import React from 'react';

export function EmptyAttendanceState() {
  return (
    <div className="min-h-screen p-4 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
          No Records Found
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          We couldn't find any attendance records for you.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
          Please check back later or contact support if this persists.
        </p>
      </div>
    </div>
  );
}
