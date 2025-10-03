import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface AttendanceRecord {
  date: string;
  present: number;
  absent: number;
  leave: number;
  details: Array<{
    time: string;
    status: 'Present' | 'Absent' | 'Leave';
    formatted: string;
  }>;
}

interface SubjectAttendanceRequest {
  subject: string;
  studentId: number;
  cfId: string;
}

// Generic function to fetch daily attendance for any subject from cards API
async function fetchSubjectAttendance(
  subject: string, 
  studentId: number, 
  cfId: string, 
  token: string
): Promise<{ success: boolean, data: any[], error?: string }> {
  console.log(`[subject-attendance] Fetching attendance for ${subject} (cfId: ${cfId})`);
  
  try {
    // Use configurable API endpoint
    const url = new URL("https://abes.platform.simplifii.com/api/v1/cards");
    url.searchParams.set("type", "Attendance");
    url.searchParams.set("sort_by", "datetime1");
    url.searchParams.set("report_title", subject);
    url.searchParams.set("equalto___fk_student", String(studentId));
    url.searchParams.set("equalto___cf_id", String(cfId));
    url.searchParams.set("token", token);

    console.log(`[subject-attendance] API URL: ${url.toString().substring(0, 120)}...`);

    const response = await fetch(url.toString(), { cache: 'no-store' });

    if (!response.ok) {
      return { success: false, data: [], error: `HTTP ${response.status}` };
    }

    const responseData = await response.json();
    const records = responseData.response?.data || [];
    
    console.log(`[subject-attendance] Retrieved ${records.length} attendance records for ${subject}`);
    
    return { success: true, data: records };

  } catch (err) {
    console.error(`[subject-attendance] Error fetching ${subject}:`, err);
    return { success: false, data: [], error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Process attendance records into daily summary with detailed status information
function processAttendanceRecords(records: any[]): AttendanceRecord[] {
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
      console.warn(`[subject-attendance] Invalid date format:`, record.start_time, record.date_formatted);
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
}

export async function POST(req: Request) {
  console.log("[subject-attendance] POST request received");

  try {
    const { subject, studentId, cfId, token } = await req.json();

    if (!subject || !studentId || !cfId || !token) {
      return NextResponse.json(
        { error: "Missing required parameters: subject, studentId, cfId, token" },
        { status: 400 }
      );
    }

    // Fetch attendance data from cards API
    const result = await fetchSubjectAttendance(subject, studentId, cfId, token);

    if (!result.success) {
      return NextResponse.json(
        { error: `Failed to fetch attendance for ${subject}`, details: result.error },
        { status: 500 }
      );
    }

    // Process the records into daily summaries
    const dailyRecords = processAttendanceRecords(result.data);

    // Calculate totals
    const totalPresent = result.data.filter((d: any) => d.state === "Present").length;
    const totalAbsent = result.data.filter((d: any) => d.state === "Absent").length;
    const totalLeave = result.data.filter((d: any) => d.state === "Leave").length;

    const responseData = {
      subject,
      studentId,
      cfId,
      totalPresent,
      totalAbsent,
      totalLeave,
      totalRecords: result.data.length,
      dailyAttendance: dailyRecords,
      fetchedAt: new Date().toISOString()
    };

    console.log(`[subject-attendance] Returning ${dailyRecords.length} daily records for ${subject}`);

    return NextResponse.json(responseData, { status: 200 });

  } catch (err: any) {
    console.error("[subject-attendance] Unexpected error:", err);
    return NextResponse.json(
      { error: "Server error", message: err.message },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  // Extract query parameters for GET requests
  const { searchParams } = new URL(req.url);
  const subject = searchParams.get('subject');
  const studentId = searchParams.get('studentId');
  const cfId = searchParams.get('cfId');
  
  // Extract token from Authorization header
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");

  if (!subject || !studentId || !cfId || !token) {
    return NextResponse.json(
      { error: "Missing required parameters: subject, studentId, cfId in query params and Authorization header" },
      { status: 400 }
    );
  }

  try {
    // Fetch attendance data from cards API
    const result = await fetchSubjectAttendance(subject, parseInt(studentId), cfId, token);

    if (!result.success) {
      return NextResponse.json(
        { error: `Failed to fetch attendance for ${subject}`, details: result.error },
        { status: 500 }
      );
    }

    // Process the records into daily summaries
    const dailyRecords = processAttendanceRecords(result.data);

    // Calculate totals
    const totalPresent = result.data.filter((d: any) => d.state === "Present").length;
    const totalAbsent = result.data.filter((d: any) => d.state === "Absent").length;
    const totalLeave = result.data.filter((d: any) => d.state === "Leave").length;

    const responseData = {
      subject,
      studentId: parseInt(studentId),
      cfId,
      totalPresent,
      totalAbsent,
      totalLeave,
      totalRecords: result.data.length,
      dailyAttendance: dailyRecords,
      fetchedAt: new Date().toISOString()
    };

    console.log(`[subject-attendance] Returning ${dailyRecords.length} daily records for ${subject}`);

    return NextResponse.json(responseData, { status: 200 });

  } catch (err: any) {
    console.error("[subject-attendance] Unexpected error:", err);
    return NextResponse.json(
      { error: "Server error", message: err.message },
      { status: 500 }
    );
  }
}