import React from "react";
import { User, GraduationCap, Layers, Users } from "lucide-react";

interface StudentInfoCardProps {
  branch: string;
  batch: string;
  section: string;
}

export default function StudentInfoCard({ branch, batch, section }: StudentInfoCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg border border-gray-200 hover:border-blue-200 group">
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200 transition-colors duration-300 group-hover:from-blue-50 group-hover:to-purple-50">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
          <User className="h-5 w-5 text-blue-600" />
          <span>Student Information</span>
        </h3>
      </div>
      <div className="px-6 py-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-600">
            <GraduationCap className="h-4 w-4 text-indigo-500" />
            <span>Branch</span>
          </div>
          <span className="font-medium text-gray-800 bg-gray-100 px-3 py-1 rounded-full text-sm">
            {branch}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-600">
            <Layers className="h-4 w-4 text-blue-500" />
            <span>Batch</span>
          </div>
          <span className="font-medium text-gray-800 bg-gray-100 px-3 py-1 rounded-full text-sm">
            {batch}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-600">
            <Users className="h-4 w-4 text-purple-500" />
            <span>Section</span>
          </div>
          <span className="font-medium text-gray-800 bg-gray-100 px-3 py-1 rounded-full text-sm">
            {section}
          </span>
        </div>
      </div>      
    </div>
  );
}
