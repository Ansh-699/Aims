import { NextResponse } from "next/server";

// Simple in-memory cache for attendance data
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
type CacheEntry = {
  data: any;
  timestamp: number;
};
const attendanceCache = new Map<string, CacheEntry>();

export async function POST(req: Request) {
  console.log("[attendance] start");

  try {
    const { token } = await req.json();
    if (!token) {
      console.warn("[attendance] missing token");
      return NextResponse.json(
        { error: "Missing token in request body" },
        { status: 400 }
      );
    }
    console.log("[attendance] token:", token.slice(0, 10) + "...");

    // Check cache first
    const cacheKey = `attendance_${token.slice(0, 10)}`;
    const cached = attendanceCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      console.log("[attendance] serving from cache");
      return NextResponse.json(cached.data, {
        status: 200,
        headers: {
          "Cache-Control": "max-age=300, stale-while-revalidate=1800",
          "X-Cache": "HIT"
        }
      });
    }

    // Add timeout for external API call
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const url =
      "https://abes.platform.simplifii.com/api/v1/custom/getCFMappedWithStudentID?embed_attendance_summary=1";
    const extRes = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log("[attendance] external status:", extRes.status);

    if (!extRes.ok) {
      const text = await extRes.text();
      console.error("[attendance] external error body:", text);
      return NextResponse.json(
        { error: `External API error ${extRes.status}` },
        { status: extRes.status }
      );
    }

    const extJson = await extRes.json();
    const records = extJson?.response?.data;
    console.log("[attendance] got records:", Array.isArray(records) ? records.length : "not an array");

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: "No attendance records returned" },
        { status: 502 }
      );
    }

    const totalSummary = records[records.length - 1];
    const dailyRecords = records.slice(0, -1);

    const dailyAttendance = dailyRecords.map((r: any) => ({
      course: r.cdata.course_name.trim(),
      present: r.attendance_summary.Present,
      total: r.attendance_summary.Total,
      percent: r.attendance_summary.Percent,
    }));

    const { Present: totalPresent, Total: totalClasses, Percent: overallPercentage } =
      totalSummary.attendance_summary;
    const { batch, section, dept: branch, student_id: studentId } = dailyRecords[0];

    const responseData = {
      dailyAttendance,
      totalPresent,
      totalClasses,
      overallPercentage,
      batch,
      section,
      branch,
      studentId,
    };

    // Store in cache
    attendanceCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });

    console.log("[attendance] processed, sending response");

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        "Cache-Control": "max-age=300, stale-while-revalidate=1800",
        "X-Cache": "MISS"
      }
    });
  } catch (err: any) {
    console.error("[attendance] unexpected error:", err);
    
    // Check if it's a timeout error and provide better error message
    if (err.name === 'AbortError') {
      return NextResponse.json(
        { error: "Request timeout - please try again" },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { error: err.message || "Unknown server error" },
      { status: 500 }
    );
  }
}
