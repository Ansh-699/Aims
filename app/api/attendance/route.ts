// app/api/attendance/route.ts
import { NextResponse } from "next/server";

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

    // 1) call external API with built-in fetch
    const url =
      "https://abes.platform.simplifii.com/api/v1/custom/getCFMappedWithStudentID?embed_attendance_summary=1";
    const extRes = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
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

    // 2) process your data
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

    console.log("[attendance] processed, sending response");

    return NextResponse.json(
      {
        dailyAttendance,
        totalPresent,
        totalClasses,
        overallPercentage,
        batch,
        section,
        branch,
        studentId,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[attendance] unexpected error:", err);
    return NextResponse.json(
      { error: err.message || "Unknown server error" },
      { status: 500 }
    );
  }
}
