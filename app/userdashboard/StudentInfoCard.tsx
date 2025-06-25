import React from "react";
import { User, GraduationCap, Layers, Users } from "lucide-react";

interface StudentInfoCardProps {
  branch: string;
  batch: string;
  section: string;
}

export default function StudentInfoCard({ branch, batch, section }: StudentInfoCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg border border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-600 group">
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 px-6 py-4 border-b border-gray-200 dark:border-gray-600 transition-colors duration-300 group-hover:from-blue-50 group-hover:to-purple-50 dark:group-hover:from-blue-900/30 dark:group-hover:to-purple-900/30">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-gray-200">
          <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <span>Student Information</span>
        </h3>
      </div>
      <div className="px-6 py-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-600 dark:text-white">
            <GraduationCap className="h-4 w-4 text-indigo-500" />
            <span>Branch</span>
          </div>
          <span className="font-medium text-gray-800 bg-gray-100 dark:bg-gray-700 dark:text-white px-3 py-1 rounded-full text-sm">
            {branch}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-600 dark:text-white">
            <Layers className="h-4 w-4 text-blue-500" />
            <span>Batch</span>
          </div>
          <span className="font-medium text-gray-800 bg-gray-100 dark:bg-gray-700 dark:text-white px-3 py-1 rounded-full text-sm">
            {batch}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-600 dark:text-white">
            <Users className="h-4 w-4 text-purple-500" />
            <span>Section</span>
          </div>
          <span className="font-medium text-gray-800 bg-gray-100 dark:bg-gray-700 dark:text-white px-3 py-1 rounded-full text-sm">
            {section}
          </span>
        </div>
      </div>      
    </div>
  );
}
