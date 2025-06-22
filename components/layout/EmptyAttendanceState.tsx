import React from 'react';

export function EmptyAttendanceState() {
  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          No Records Found
        </h2>
        <p className="text-gray-600">
          We couldn't find any attendance records for you.
        </p>
        <p className="text-sm text-gray-500 mt-4">
          Please check back later or contact support if this persists.
        </p>
      </div>
    </div>
  );
}
