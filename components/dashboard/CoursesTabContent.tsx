import React from 'react';
import { AttendanceData } from '@/app/types';
import CourseAttendance from '@/app/userdashboard/CourseAttendance';

interface CoursesTabContentProps {
  attendance: AttendanceData;
}

export function CoursesTabContent({ attendance }: CoursesTabContentProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <CourseAttendance dailyAttendance={attendance.dailyAttendance} />
    </div>
  );
}
