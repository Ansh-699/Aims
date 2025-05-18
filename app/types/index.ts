export interface CourseAttendance {
  course: string;
  present: number;
  total: number;
  percent: string;
  courseCode?: string;
}

export interface AttendanceData {
  dailyAttendance: CourseAttendance[];
  totalPresent: number;
  totalClasses: number;
  overallPercentage: string;
  batch: string;
  section: string;
  branch: string;
  studentId: string;
}