import React from 'react';

interface DashboardHeaderProps {
  studentName: string;
}

export function DashboardHeader({ studentName }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row items-start justify-between py-1 mb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600 mb-2">
          Student Dashboard
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Track your attendance and academic progress
        </p>
      </div>
      <div className="flex items-center bg-white shadow-md rounded-xl px-3 sm:px-4 py-2 border border-gray-200 mt-4 md:mt-0">
        <div className="mr-2 sm:mr-3 bg-gradient-to-br from-blue-500 to-purple-600 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-xs sm:text-sm">
            {studentName.charAt(0).toUpperCase() || "U"}
          </span>
        </div>
        <div>
          <div className="text-xs sm:text-sm text-gray-500">Student</div>
          <div className="font-semibold text-gray-800 text-sm sm:text-base">
            {studentName}
          </div>
        </div>
      </div>
    </div>
  );
}
