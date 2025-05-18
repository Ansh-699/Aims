import React from "react";

export default function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md transition-all duration-500 animate-fadeIn">
        <div className="flex flex-col items-center">
          <div className="relative w-32 h-32 mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
            <div className="absolute inset-0 rounded-full border-t-4 border-r-4 border-blue-600 animate-spin"></div>
            <div className="absolute inset-4 rounded-full border-4 border-gray-100"></div>
            <div className="absolute inset-4 rounded-full border-t-4 border-indigo-500 animate-spin animation-delay-150"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <span className="text-xl text-gray-800 font-bold">Loading</span>
                <span className="text-xs text-gray-500">Please wait</span>
              </div>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2 mt-4">
            Fetching Your Dashboard
          </h2>
          <p className="text-gray-600 text-center max-w-xs">
            We're retrieving your attendance records and preparing your dashboard...
          </p>
          
          <div className="w-full mt-8">
            <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 animate-progressBar"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}