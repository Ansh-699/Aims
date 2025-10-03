import { NextResponse } from "next/server";
import { withPerformanceLogging } from "@/app/utils/performance";

// Force dynamic execution; remove all caching
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = 'edge';

async function getAllAttendanceHandler(req: Request) {
  console.log("[all-attendance] start (GET)");

  // Extract authorization
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) {
    return NextResponse.json(
      { error: "Missing Authorization header with Bearer token" },
      { status: 400 }
    );
  }

  console.log(`[all-attendance] Using token: ${token.substring(0, 20)}...${token.substring(token.length - 20)}`);


  try {
    const origin = process.env.NODE_ENV === "production"
      ? "https://www.attendanceaims.live/"
      : "http://localhost:3000";

    // Get studentId and summary data using the attendance API
    const attendanceRes = await fetch(`${origin}/api/attendance`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ token }),
      cache: 'no-store'
    });

    if (!attendanceRes.ok) {
      const errText = await attendanceRes.text();
      console.error("[all-attendance] /api/attendance error:", errText);
      return NextResponse.json(
        { error: "Failed to get studentId from attendance" },
        { status: attendanceRes.status }
      );
    }

    const attendanceJson = await attendanceRes.json();
    const studentId = attendanceJson.studentId;
    const summaryData = attendanceJson.dailyAttendance; // Get summary data for fallback
    console.log("[all-attendance] studentId:", studentId);
    console.log("[all-attendance] Summary data has", summaryData.length, "subjects");

    // Get subject list with attendance summary to ensure we get all subjects
    const subsRes = await fetch("https://abes.platform.simplifii.com/api/v1/custom/getCFMappedWithStudentID?embed_attendance_summary=1", {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });

    if (!subsRes.ok) {
      const t = await subsRes.text();
      console.error("[all-attendance] subjects fetch failed:", t);
      return NextResponse.json(
        { error: "Failed to fetch subjects" },
        { status: subsRes.status }
      );
    }

    const subsJson = await subsRes.json();
    const entries: any[] = subsJson.response?.data || [];

    if (!entries.length) {
      return NextResponse.json(
        { error: "No subjects found" },
        { status: 404 }
      );
    }

    // Filter out entries without cdata (summary entries) and only get actual subject entries
    const subjectEntries = entries.filter(entry => entry.cdata && entry.cdata.course_name);
    console.log(`[all-attendance] Found ${subjectEntries.length} subjects (filtered out summary entries)`);

    if (!subjectEntries.length) {
      return NextResponse.json(
        { error: "No subject entries found after filtering" },
        { status: 404 }
      );
    }

    // Create a mapping of course codes to course names
    const courseCodeToNameMap: Record<string, string> = {};
    subjectEntries.forEach(entry => {
      if (entry.cdata && entry.cdata.course_code && entry.cdata.course_name) {
        courseCodeToNameMap[entry.cdata.course_code] = entry.cdata.course_name.trim();
      }
    });

    const subjects = subjectEntries.map(e => ({
      name: e.cdata.course_name.trim(),
      code: e.cdata.course_code,
      cfId: e.id
    }));

    console.log(`[all-attendance] Processing subjects:`, subjects.map(s => s.name));

    // Generic function to fetch daily attendance for any subject from cards API
    const fetchSubjectAttendance = async (
      subject: string, 
      studentId: number, 
      cfId: string, 
      token: string, 
      retries = 2
    ): Promise<{ subject: string, data: any[], error?: string | null }> => {
      console.log(`[all-attendance] Fetching attendance for ${subject} (cfId: ${cfId})`);
      
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          // Use the standardized cards API endpoint
          const url = new URL("https://abes.platform.simplifii.com/api/v1/cards");
          url.searchParams.set("type", "Attendance");
          url.searchParams.set("sort_by", "datetime1"); // Use datetime1 for consistent sorting
          url.searchParams.set("report_title", subject);
          url.searchParams.set("equalto___fk_student", String(studentId));
          url.searchParams.set("equalto___cf_id", String(cfId));
          url.searchParams.set("token", token);

          console.log(`[all-attendance] API URL: ${url.toString().substring(0, 120)}...`);

          const response = await fetch(url.toString(), { 
            signal: controller.signal, 
            cache: 'no-store' 
          });
          clearTimeout(timeoutId);

          if (!response.ok) {
            console.warn(`[all-attendance] HTTP ${response.status} for ${subject} on attempt ${attempt + 1}`);
            if (attempt === retries) {
              return { subject, data: [], error: `HTTP ${response.status}` };
            }
            continue;
          }

          const responseData = await response.json();
          const records = responseData.response?.data || [];
          
          console.log(`[all-attendance] Retrieved ${records.length} attendance records for ${subject}`);
          
          // Log sample record structure for debugging
          if (records.length > 0) {
            const sampleRecord = records[0];
            console.log(`[all-attendance] Sample record for ${subject}:`, {
              state: sampleRecord.state,
              start_time: sampleRecord.start_time,
              date_formatted: sampleRecord.date_formatted
            });
          }

          return { subject, data: records, error: null };

        } catch (err) {
          console.error(`[all-attendance] Error fetching ${subject} on attempt ${attempt + 1}:`, err);
          if (attempt === retries) {
            return { subject, data: [], error: err instanceof Error ? err.message : 'Unknown error' };
          }
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
      return { subject, data: [], error: 'Max retries exceeded' };
    };

    // Generic function to process attendance records into daily summary
    const processAttendanceRecords = (records: any[]): Array<{
      date: string;
      present: number;
      absent: number;
      leave: number;
      details: Array<{
        time: string;
        status: 'Present' | 'Absent' | 'Leave';
        formatted: string;
      }>;
    }> => {
      const byDate: Record<string, {
        present: number;
        absent: number;
        leave: number;
        details: Array<{ time: string; status: 'Present' | 'Absent' | 'Leave'; formatted: string }>;
      }> = {};

      records.forEach((record: any) => {
        let dateKey: string;
        try {
          const dt = new Date(record.start_time || record.date_formatted?.split(" ").pop() || "");
          dateKey = dt.toISOString().slice(0, 10);
        } catch (e) {
          console.warn(`[all-attendance] Invalid date format:`, record.start_time, record.date_formatted);
          dateKey = new Date().toISOString().slice(0, 10);
        }

        if (!byDate[dateKey]) {
          byDate[dateKey] = { present: 0, absent: 0, leave: 0, details: [] };
        }

        const status = record.state as 'Present' | 'Absent' | 'Leave';
        const timeFormatted = record.date_formatted || record.start_time || '';
        
        // Count by status
        if (status === 'Present') {
          byDate[dateKey].present++;
        } else if (status === 'Absent') {
          byDate[dateKey].absent++;
        } else if (status === 'Leave') {
          byDate[dateKey].leave++;
        }

        // Add detailed record
        byDate[dateKey].details.push({
          time: record.start_time || '',
          status,
          formatted: timeFormatted
        });
      });

      return Object.entries(byDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, data]) => ({ date, ...data }));
    };

    // Wrapper function for backward compatibility
    const fetchSubject = async (sub: { name: string, cfId: string }, retries = 2) => {
      return await fetchSubjectAttendance(sub.name, studentId, sub.cfId, token, retries);
    };

    // Optimized batch processing with dynamic batch sizing based on response times
    const performanceMetrics = {
      startTime: Date.now(),
      batchTimes: [] as number[],
      totalRequests: subjects.length,
      failedRequests: 0
    };

    let batchSize = 4; // Start with 4 concurrent requests
    const maxBatchSize = 6;
    const minBatchSize = 2;
    let rawResults: { subject: string, data: any[], error?: string | null }[] = [];

    for (let i = 0; i < subjects.length; i += batchSize) {
      const batchStartTime = Date.now();
      const batch = subjects.slice(i, i + batchSize);

      console.log(`[all-attendance] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(subjects.length / batchSize)} with ${batch.length} subjects`);

      const batchResults = await Promise.all(batch.map(fetchSubject));
      rawResults = [...rawResults, ...batchResults];

      const batchTime = Date.now() - batchStartTime;
      performanceMetrics.batchTimes.push(batchTime);

      // Count failed requests
      const batchFailures = batchResults.filter(r => r.error).length;
      performanceMetrics.failedRequests += batchFailures;

      // Adaptive batch sizing based on performance
      if (batchTime > 8000 && batchSize > minBatchSize) {
        batchSize = Math.max(minBatchSize, batchSize - 1);
        console.log(`[all-attendance] Reducing batch size to ${batchSize} due to slow response (${batchTime}ms)`);
      } else if (batchTime < 3000 && batchSize < maxBatchSize && batchFailures === 0) {
        batchSize = Math.min(maxBatchSize, batchSize + 1);
        console.log(`[all-attendance] Increasing batch size to ${batchSize} due to fast response (${batchTime}ms)`);
      }

      // Small delay between batches to avoid overwhelming the API
      if (i + batchSize < subjects.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // Process results and merge with summary data for missing subjects
    let grandPresent = 0;
    let grandAbsent = 0;
    const subjectsSummary: Record<string, any> = {};

    // Process detailed results using the generic processing function
    rawResults.forEach(({ subject, data, error }) => {
      const presentCount = data.filter((d: any) => d.state === "Present").length;
      const absentCount = data.filter((d: any) => d.state === "Absent").length;
      const leaveCount = data.filter((d: any) => d.state === "Leave").length;
      
      grandPresent += presentCount;
      grandAbsent += absentCount;

      console.log(`[all-attendance] ${subject}: ${presentCount} present, ${absentCount} absent, ${leaveCount} leave${error ? ` (error: ${error})` : ''}`);

      // Use the generic processing function
      const dailyRecords = processAttendanceRecords(data);
      
      // Convert to the expected format for backward compatibility
      const daily = dailyRecords.map(record => ({
        date: record.date,
        present: record.present,
        absent: record.absent,
        leave: record.leave,
        details: record.details // Include detailed status information
      }));

      subjectsSummary[subject] = {
        totalPresent: presentCount,
        totalAbsent: absentCount,
        totalLeave: leaveCount,
        daily
      };
    });

    // Add missing subjects from summary data
    summaryData.forEach((summarySubject: any) => {
      const subjectName = summarySubject.course;
      if (!subjectsSummary[subjectName]) {
        const presentCount = summarySubject.present;
        const absentCount = summarySubject.total - summarySubject.present;

        console.log(`[all-attendance] Adding missing subject from summary: ${subjectName}: ${presentCount} present, ${absentCount} absent`);

        grandPresent += presentCount;
        grandAbsent += absentCount;

        subjectsSummary[subjectName] = {
          totalPresent: presentCount,
          totalAbsent: absentCount,
          daily: [] // No daily data available for these subjects
        };
      }
    });

    // FULLY GENERIC SYSTEM: Fetch detailed data for ALL subjects dynamically
    // No hardcoded subject names or cf_ids - everything is fetched from the API
    // This system will automatically work with new semesters and different subjects
    console.log(`[all-attendance] Fetching detailed daily data for all subjects from cards API`);
    
    // Create a comprehensive mapping of all subjects with their cf_ids
    const allSubjectCfIdMap: Record<string, string> = {};
    subjectEntries.forEach(entry => {
      if (entry.cdata && entry.cdata.course_name && entry.id) {
        const subjectName = entry.cdata.course_name.trim();
        allSubjectCfIdMap[subjectName] = String(entry.id);
      }
    });

    console.log(`[all-attendance] Found ${Object.keys(allSubjectCfIdMap).length} subjects with cf_ids:`, Object.keys(allSubjectCfIdMap));

    // Fetch detailed attendance data for ALL subjects (not just missing ones)
    for (const [subjectName, cfId] of Object.entries(allSubjectCfIdMap)) {
      try {
        console.log(`[all-attendance] Fetching detailed data for ${subjectName} (cf_id: ${cfId})`);
        const result = await fetchSubjectAttendance(subjectName, studentId, cfId, token);
        
        if (result.data.length > 0) {
          const dailyRecords = processAttendanceRecords(result.data);
          
          // Calculate totals from detailed data
          const presentCount = result.data.filter((d: any) => d.state === "Present").length;
          const absentCount = result.data.filter((d: any) => d.state === "Absent").length;
          const leaveCount = result.data.filter((d: any) => d.state === "Leave").length;

          // Update or create the subject summary with detailed daily data
          if (!subjectsSummary[subjectName]) {
            // Subject wasn't in the summary, add it
            grandPresent += presentCount;
            grandAbsent += absentCount;
            
            subjectsSummary[subjectName] = {
              totalPresent: presentCount,
              totalAbsent: absentCount,
              totalLeave: leaveCount,
              daily: []
            };
          }

          // Update with detailed daily data
          subjectsSummary[subjectName].daily = dailyRecords.map(record => ({
            date: record.date,
            present: record.present,
            absent: record.absent,
            leave: record.leave,
            details: record.details
          }));

          console.log(`[all-attendance] Updated ${subjectName} with ${dailyRecords.length} daily records from cards API`);
          
          // Log today's data for verification
          const today = new Date().toISOString().slice(0, 10);
          const todayData = dailyRecords.find(d => d.date === today);
          if (todayData) {
            console.log(`[all-attendance] ${subjectName} today (${today}): ${todayData.present} present, ${todayData.absent} absent, ${todayData.leave} leave`);
          }
        } else {
          console.log(`[all-attendance] No detailed records found for ${subjectName} in cards API`);
        }
      } catch (err) {
        console.error(`[all-attendance] Failed to fetch cards API data for ${subjectName}:`, err);
      }
    }

    console.log(`[all-attendance] Grand totals: ${grandPresent} present, ${grandAbsent} absent`);

    // Calculate performance metrics
    const totalTime = Date.now() - performanceMetrics.startTime;
    const avgBatchTime = performanceMetrics.batchTimes.reduce((a, b) => a + b, 0) / performanceMetrics.batchTimes.length;
    const successRate = ((performanceMetrics.totalRequests - performanceMetrics.failedRequests) / performanceMetrics.totalRequests) * 100;

    console.log(`[all-attendance] Performance summary: Total: ${totalTime}ms, Avg batch: ${Math.round(avgBatchTime)}ms, Success rate: ${Math.round(successRate)}%`);

    // Prepare the final response
    const responseData = {
      studentId,
      totalPresentAllSubjects: grandPresent,
      totalAbsentAllSubjects: grandAbsent,
      subjects: subjectsSummary,
      courseCodeMap: courseCodeToNameMap, // Add the mapping to the response
      cachedAt: new Date().toISOString(),
      performance: process.env.NODE_ENV === 'development' ? {
        totalTime,
        avgBatchTime: Math.round(avgBatchTime),
        successRate: Math.round(successRate),
        totalRequests: performanceMetrics.totalRequests,
        failedRequests: performanceMetrics.failedRequests,
        batchCount: performanceMetrics.batchTimes.length
      } : undefined
    };

    // Return without cache headers
    return NextResponse.json(responseData, { status: 200 });
  } catch (err: any) {
    console.error("[all-attendance] unexpected error:", err);
    return NextResponse.json(
      { error: "Server error", message: err.message },
      { status: 500 }
    );
  }
}

// Export the performance-wrapped handler
export const GET = withPerformanceLogging(getAllAttendanceHandler, 'all-attendance');
