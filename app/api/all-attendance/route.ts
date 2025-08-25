import { NextResponse } from "next/server";
import { withPerformanceLogging } from "@/app/utils/performance";

// Simple in-memory API cache
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
type CacheEntry = {
  data: any;
  timestamp: number;
};
const apiCache = new Map<string, CacheEntry>();

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

  // Check cache using token as key
  const cacheKey = `attendance_${token.slice(0, 10)}`;
  const cached = apiCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    console.log("[all-attendance] serving from cache");
    return NextResponse.json(cached.data, {
      status: 200,
      headers: {
        "Cache-Control": "max-age=300, stale-while-revalidate=1800",
        "X-Cache": "HIT"
      }
    });
  }

  try {
    const origin = process.env.NODE_ENV === "production"
      ? "https://www.attendanceaims.live/"
      : "http://localhost:3000";

    // Get studentId using the attendance API
    const attendanceRes = await fetch(
      `${origin}/api/attendance`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ token }),
        cache: 'no-store'
      }
    );

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
    console.log("[all-attendance] studentId:", studentId);

    // Get subject list
    const subsRes = await fetch(
      "https://abes.platform.simplifii.com/api/v1/custom/getCFMappedWithStudentID",
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      }
    );

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

    // Create a mapping of course codes to course names
    const courseCodeToNameMap: Record<string, string> = {};
    entries.forEach(entry => {
      if (entry.cdata && entry.cdata.course_code && entry.cdata.course_name) {
        courseCodeToNameMap[entry.cdata.course_code] = entry.cdata.course_name.trim();
      }
    });

    const subjects = entries.map(e => ({
      name: e.cdata.course_name.trim(),
      code: e.cdata.course_code,
      cfId: e.id
    }));

    // Parallel fetching for all subjects with enhanced timeout and retry logic
    const fetchSubject = async (sub: { name: string, cfId: string }, retries = 2) => {
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

          const url = new URL("https://abes.platform.simplifii.com/api/v1/cards");
          url.searchParams.set("type", "Attendance");
          url.searchParams.set("sort_by", "-datetime1");
          url.searchParams.set("report_title", sub.name);
          url.searchParams.set("equalto___fk_student", String(studentId));
          url.searchParams.set("equalto___cf_id", String(sub.cfId));
          url.searchParams.set("token", token);

          const r = await fetch(url.toString(), {
            signal: controller.signal,
            cache: 'no-store'
          });
          clearTimeout(timeoutId);

          if (!r.ok) {
            if (attempt === retries) {
              console.warn(`[all-attendance] fetch cards failed for ${sub.name} after ${retries + 1} attempts`);
              return { subject: sub.name, data: [], error: `HTTP ${r.status}` };
            }
            continue; // Retry
          }

          const j = await r.json();
          return { subject: sub.name, data: j.response?.data || [], error: null };
        } catch (err) {
          if (attempt === retries) {
            console.error(`[all-attendance] error fetching ${sub.name} after ${retries + 1} attempts:`, err);
            return { subject: sub.name, data: [], error: err instanceof Error ? err.message : 'Unknown error' };
          }
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
      return { subject: sub.name, data: [], error: 'Max retries exceeded' };
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

    // Process results
    let grandPresent = 0;
    let grandAbsent = 0;
    const subjectsSummary: Record<string, any> = {};

    rawResults.forEach(({ subject, data }) => {
      const presentCount = data.filter((d: any) => d.state === "Present").length;
      const absentCount = data.filter((d: any) => d.state === "Absent").length;
      grandPresent += presentCount;
      grandAbsent += absentCount;

      // Process daily attendance with optimized date handling
      const byDate: Record<string, { present: number; absent: number }> = {};

      data.forEach((d: any) => {
        let dateKey: string;

        try {
          const dt = new Date(d.start_time || (d.date_formatted?.split(" ").pop() || ""));
          dateKey = dt.toISOString().slice(0, 10);
        } catch (e) {
          // Fallback to current date if parsing fails
          dateKey = new Date().toISOString().slice(0, 10);
        }

        if (!byDate[dateKey]) byDate[dateKey] = { present: 0, absent: 0 };
        d.state === "Present" ? byDate[dateKey].present++ : byDate[dateKey].absent++;
      });

      const daily = Object.entries(byDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, counts]) => ({ date, ...counts }));

      subjectsSummary[subject] = {
        totalPresent: presentCount,
        totalAbsent: absentCount,
        daily
      };
    });

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

    // Update cache
    apiCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });

    // Return with caching headers
    return NextResponse.json(
      responseData,
      {
        status: 200,
        headers: {
          "Cache-Control": "max-age=300, stale-while-revalidate=1800",
          "X-Cache": "MISS"
        }
      }
    );
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
