import React from 'react';
import { AttendanceData } from '@/app/types';
import CourseAttendance from '@/app/userdashboard/CourseAttendance';

interface CoursesTabContentProps {
  attendance: AttendanceData;
}

export function CoursesTabContent({ attendance }: CoursesTabContentProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm">
      <CourseAttendance dailyAttendance={attendance.dailyAttendance} />
    </div>
  );
}
