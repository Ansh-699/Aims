import { NextResponse } from "next/server";
import { withPerformanceLogging } from "@/app/utils/performance";
import { BatchProcessor } from "@/app/utils/batch-processor";

// Force dynamic execution; remove all caching
export const dynamic = "force-dynamic";
export const revalidate = 0;

// In-memory cache for API responses (edge runtime compatible)
const responseCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes server-side cache

function getCacheKey(token: string): string {
  // Use last 20 chars of token for cache key
  return token?.slice(-20) || 'default';
}

function getCachedResponse(token: string): any | null {
  const key = getCacheKey(token);
  const cached = responseCache.get(key);

  if (!cached) return null;

  const age = Date.now() - cached.timestamp;
  if (age > CACHE_DURATION) {
    responseCache.delete(key);
    return null;
  }

  return cached.data;
}

function setCachedResponse(token: string, data: any): void {
  const key = getCacheKey(token);
  responseCache.set(key, {
    data,
    timestamp: Date.now()
  });

  // Clean old entries (keep cache size manageable)
  if (responseCache.size > 100) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey) {
      responseCache.delete(oldestKey);
    }
  }
}

async function getAllAttendanceHandler(req: Request) {
  // Extract authorization
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) {
    return NextResponse.json(
      { error: "Missing Authorization header with Bearer token" },
      { status: 400 }
    );
  }

  // Check server-side cache first
  if (token) {
    const cachedResponse = getCachedResponse(token);
    if (cachedResponse) {
      return NextResponse.json({
        ...cachedResponse,
        fromCache: true,
        cachedAt: new Date().toISOString()
      });
    }
  }

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
      return NextResponse.json(
        { error: "Failed to get studentId from attendance" },
        { status: attendanceRes.status }
      );
    }

    const attendanceJson = await attendanceRes.json();
    const studentId = attendanceJson.studentId;

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID not found" },
        { status: 404 }
      );
    }

    // Get subject list with attendance summary
    const subsRes = await fetch("https://abes.platform.simplifii.com/api/v1/custom/getCFMappedWithStudentID?embed_attendance_summary=1", {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });

    if (!subsRes.ok) {
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

    // Optimized function to fetch daily attendance for any subject from cards API
    const fetchSubjectAttendance = async (
      subject: string,
      studentId: number,
      cfId: string,
      token: string,
      retries = 1
    ): Promise<{ subject: string, data: any[], error?: string | null }> => {
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000); // Reduced timeout

          // Use the standardized cards API endpoint with optimized parameters
          const url = new URL("https://abes.platform.simplifii.com/api/v1/cards");
          url.searchParams.set("type", "Attendance");
          url.searchParams.set("sort_by", "datetime1");
          url.searchParams.set("report_title", subject);
          url.searchParams.set("equalto___fk_student", String(studentId));
          url.searchParams.set("equalto___cf_id", String(cfId));
          url.searchParams.set("token", token);

          const response = await fetch(url.toString(), {
            signal: controller.signal,
            cache: 'no-store',
            headers: {
              'Accept': 'application/json',
              'Connection': 'keep-alive' // Reuse connections
            }
          });
          clearTimeout(timeoutId);

          if (!response.ok) {
            if (attempt === retries) {
              return { subject, data: [], error: `HTTP ${response.status}` };
            }
            continue;
          }

          const responseData = await response.json();
          const records = responseData.response?.data || [];

          return { subject, data: records, error: null };

        } catch (err) {
          if (attempt === retries) {
            return { subject, data: [], error: err instanceof Error ? err.message : 'Unknown error' };
          }
          // Shorter backoff for faster retries
          await new Promise(resolve => setTimeout(resolve, 500));
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

    // Ultra-optimized single-pass batch processing
    const performanceMetrics = {
      startTime: Date.now(),
      totalRequests: subjects.length,
      failedRequests: 0
    };

    // Use the advanced batch processor with higher concurrency for faster processing
    const batchProcessor = new BatchProcessor({
      maxConcurrency: 8, // Increased from 6
      batchSize: 6,      // Increased from 4
      delayBetweenBatches: 25, // Reduced from 50ms
      retryAttempts: 1,  // Reduced from 2 for faster failure handling
      timeoutMs: 8000    // Reduced from 12000ms
    });

    const subjectItems = subjects.map(subject => ({
      key: subject.name,
      data: subject
    }));

    const batchResults = await batchProcessor.processBatch(
      subjectItems,
      async (subject: any) => {
        const typedSubject = subject as { name: string; cfId: string };
        return await fetchSubjectAttendance(typedSubject.name, studentId, typedSubject.cfId, token, 1); // Reduced retries
      }
    );

    // Process results in a single pass - no duplicate processing
    let grandPresent = 0;
    let grandAbsent = 0;
    const subjectsSummary: Record<string, any> = {};

    Object.entries(batchResults).forEach(([subjectName, result]) => {
      if (result.success && result.data) {
        const { subject, data, error } = result.data as { subject: string, data: any[], error?: string | null };

        const presentCount = data.filter((d: any) => d.state === "Present").length;
        const absentCount = data.filter((d: any) => d.state === "Absent").length;
        const leaveCount = data.filter((d: any) => d.state === "Leave").length;

        grandPresent += presentCount;
        grandAbsent += absentCount;

        // Process attendance records into daily summary
        const dailyRecords = processAttendanceRecords(data);

        subjectsSummary[subject] = {
          totalPresent: presentCount,
          totalAbsent: absentCount,
          totalLeave: leaveCount,
          daily: dailyRecords.map(record => ({
            date: record.date,
            present: record.present,
            absent: record.absent,
            leave: record.leave,
            details: record.details
          }))
        };
      } else {
        performanceMetrics.failedRequests++;

        // Add empty entry for failed subjects
        subjectsSummary[subjectName] = {
          totalPresent: 0,
          totalAbsent: 0,
          totalLeave: 0,
          daily: []
        };
      }
    });

    // Calculate performance metrics
    const totalTime = Date.now() - performanceMetrics.startTime;
    const successRate = ((performanceMetrics.totalRequests - performanceMetrics.failedRequests) / performanceMetrics.totalRequests) * 100;

    // Prepare the final response
    const responseData = {
      studentId,
      totalPresentAllSubjects: grandPresent,
      totalAbsentAllSubjects: grandAbsent,
      subjects: subjectsSummary,
      courseCodeMap: courseCodeToNameMap,
      cachedAt: new Date().toISOString(),
      fromCache: false
    };

    // Cache the response
    setCachedResponse(token, responseData);

    // Return without cache headers
    return NextResponse.json(responseData, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Server error", message: err.message },
      { status: 500 }
    );
  }
}

// Export the performance-wrapped handler
export const GET = withPerformanceLogging(getAllAttendanceHandler, 'all-attendance');
