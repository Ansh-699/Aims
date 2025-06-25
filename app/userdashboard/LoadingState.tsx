import React from "react";

export default function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md transition-all duration-500 animate-fadeIn border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col items-center">
          <div className="relative w-32 h-32 mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-gray-100 dark:border-gray-700"></div>
            <div className="absolute inset-0 rounded-full border-t-4 border-r-4 border-blue-600 dark:border-blue-400 animate-spin"></div>
            <div className="absolute inset-4 rounded-full border-4 border-gray-100 dark:border-gray-700"></div>
            <div className="absolute inset-4 rounded-full border-t-4 border-indigo-500 dark:border-indigo-400 animate-spin animation-delay-150"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <span className="text-xl text-gray-800 dark:text-gray-200 font-bold">Loading</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Please wait</span>
              </div>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
            Fetching Your Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-center max-w-xs">
            We're retrieving your attendance records and preparing your dashboard...
          </p>
          
          <div className="w-full mt-8">
            <div className="h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500 animate-progressBar"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}