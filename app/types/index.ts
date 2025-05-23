export interface DailyRecord {
  date: string;
  present: number;
  absent: number;
}

export interface SubjectSummary {
  totalPresent: number;
  totalAbsent: number;
  daily: DailyRecord[];
}

export interface AttendanceSummaryData {
  studentId: number;
  totalPresentAllSubjects: number;
  totalAbsentAllSubjects: number;
  subjects: Record<string, SubjectSummary>;
}

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
  
  subjects?: Record<string, SubjectSummary>; 
}