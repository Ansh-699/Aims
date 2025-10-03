import React from 'react';
import { AttendanceData } from '@/app/types';
import StudentInfoCard from '@/app/userdashboard/StudentInfoCard';
import AttendanceSummary from '@/app/userdashboard/AttendanceSummary';
import AttendanceCalendar from '@/components/ui/attendancecalender';
import { DashboardHeader } from './DashboardHeader';

interface HomeTabContentProps {
  attendance: AttendanceData;
  studentName: string;
}

export function HomeTabContent({ attendance, studentName }: HomeTabContentProps) {
  const processedAttendanceData = {
    studentId: parseInt(attendance.studentId),
    totalPresentAllSubjects: attendance.totalPresent,
    totalAbsentAllSubjects: attendance.totalClasses - attendance.totalPresent,
    subjects: attendance.subjects || {},
  };



  const studentInfo = {
    branch: attendance.branch,
    batch: attendance.batch,
    section: attendance.section,
  };

  return (
    <>
      <DashboardHeader {...({ studentName } as any)} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 ">
        <StudentInfoCard
          branch={studentInfo.branch}
          batch={studentInfo.batch}
          section={studentInfo.section}
        />
        <AttendanceSummary
          totalPresent={attendance.totalPresent}
          totalClasses={attendance.totalClasses}
          overallPercentage={attendance.overallPercentage}
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-2 sm:p-4 mt-4 sm:mt-6 shadow-sm">
        <AttendanceCalendar attendanceData={processedAttendanceData} />
      </div>
    </>
  );
}
