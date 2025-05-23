import { NextResponse } from "next/server";


export async function GET(req: Request) {
  console.log("[all-attendance] start (GET)");

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) {
    return NextResponse.json({ error: "Missing Authorization header with Bearer token" }, { status: 400 });
  }

  try {
    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const attendanceRes = await fetch(
      `${origin}/api/attendance`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ token }),
      }
    );
    if (!attendanceRes.ok) {
      const errText = await attendanceRes.text();
      console.error("[all-attendance] /api/attendance error:", errText);
      return NextResponse.json({ error: "Failed to get studentId from attendance" }, { status: attendanceRes.status });
    }
    const attendanceJson = await attendanceRes.json();
    const studentId = attendanceJson.studentId;
    console.log("[all-attendance] studentId:", studentId);

    const subsRes = await fetch(
      "https://abes.platform.simplifii.com/api/v1/custom/getCFMappedWithStudentID",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!subsRes.ok) {
      const t = await subsRes.text();
      console.error("[all-attendance] subjects fetch failed:", t);
      return NextResponse.json({ error: "Failed to fetch subjects" }, { status: subsRes.status });
    }
    const subsJson = await subsRes.json();
    const entries: any[] = subsJson.response?.data || [];
    if (!entries.length) {
      return NextResponse.json({ error: "No subjects found" }, { status: 404 });
    }
    const subjects = entries.map(e => ({ name: e.cdata.course_name.trim(), cfId: e.id }));

    let grandPresent = 0;
    let grandAbsent = 0;
    const rawResults = await Promise.all(
      subjects.map(async (sub) => {
        const url = new URL("https://abes.platform.simplifii.com/api/v1/cards");
        url.searchParams.set("type", "Attendance");
        url.searchParams.set("sort_by", "-datetime1");
        url.searchParams.set("report_title", sub.name);
        url.searchParams.set("equalto___fk_student", String(studentId));
        url.searchParams.set("equalto___cf_id", String(sub.cfId));
        url.searchParams.set("token", token);

        const r = await fetch(url.toString());
        if (!r.ok) {
          console.warn(`[all-attendance] fetch cards failed for ${sub.name}`);
          return { subject: sub.name, data: [] };
        }
        const j = await r.json();
        return { subject: sub.name, data: j.response?.data || [] };
      })
    );

    const subjectsSummary: Record<string, any> = {};
    rawResults.forEach(({ subject, data }) => {
      const presentCount = data.filter((d: any) => d.state === "Present").length;
      const absentCount = data.filter((d: any) => d.state === "Absent").length;
      grandPresent += presentCount;
      grandAbsent += absentCount;

      const byDate: Record<string, { present: number; absent: number }> = {};
      data.forEach((d: any) => {
        const dt = new Date(d.start_time || (d.date_formatted?.split(" ").pop() || ""));
        const dateKey = dt.toISOString().slice(0, 10);
        if (!byDate[dateKey]) byDate[dateKey] = { present: 0, absent: 0 };
        d.state === "Present" ? byDate[dateKey].present++ : byDate[dateKey].absent++;
      });
      const daily = Object.entries(byDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, counts]) => ({ date, ...counts }));

      subjectsSummary[subject] = { totalPresent: presentCount, totalAbsent: absentCount, daily };
    });

    return NextResponse.json(
      { studentId, totalPresentAllSubjects: grandPresent, totalAbsentAllSubjects: grandAbsent, subjects: subjectsSummary },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[all-attendance] unexpected error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
