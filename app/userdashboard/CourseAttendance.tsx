import React, { useState } from "react";
import { BarChart, CheckCircle, BookOpen, AlertCircle } from "lucide-react";
import { getStatusColor } from "../utils/statusHelpers";
import { CourseAttendance as CourseAttendanceType } from "../types";
import QuizList from "../../components/ui/quiz";

interface CourseAttendanceProps {
    dailyAttendance: CourseAttendanceType[];
}

export default function CourseAttendance({ dailyAttendance }: CourseAttendanceProps) {
    const [showLabs, setShowLabs] = useState(false);

    const mainCourses = dailyAttendance.filter(course => !course.course.toLowerCase().includes('lab') && !course.course.toLowerCase().includes('workshop') && !course.course.toLowerCase().includes('training'));
    const labCourses = dailyAttendance.filter(course => course.course.toLowerCase().includes('lab') || course.course.toLowerCase().includes('workshop') || course.course.toLowerCase().includes('training'));
    
    const displayedCourses = showLabs ? labCourses : mainCourses;

    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg border border-gray-200 mb-8">
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 ">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                        <BarChart className="h-5 w-5 text-blue-600" />
                        <span>Course-wise Attendance</span>
                    </h3>
                    <span className="text-sm bg-white px-3 py-1 rounded-full shadow-sm border border-gray-200 text-gray-600">
                        Current Semester
                    </span>
                </div>
                <p className="text-gray-500 text-sm mt-1">
                    Detailed breakdown of your attendance in each course
                </p>
                <div className="mt-2 flex space-x-2">
  <button
    onClick={() => setShowLabs(false)}
    className={`px-4 py-2 rounded-md text-sm font-medium ${
      !showLabs
        ? "bg-blue-500 text-white"
        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
    }`}
  >
    Main Classes
  </button>
  <button
    onClick={() => setShowLabs(true)}
    className={`px-4 py-2 rounded-md text-sm font-medium ${
      showLabs
        ? "bg-blue-500 text-white"
        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
    }`}
  >
    Lab Attendance
  </button>
</div>

            </div>

            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="py-3 px-6 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">
                                Course
                            </th>
                            <th className="py-3 px-6 text-center text-sm font-medium text-gray-600 uppercase tracking-wider">
                                Present
                            </th>
                            <th className="py-3 px-6 text-center text-sm font-medium text-gray-600 uppercase tracking-wider">
                                Total
                            </th>
                            <th className="py-3 px-6 text-center text-sm font-medium text-gray-600 uppercase tracking-wider">
                                Percentage
                            </th>
                            <th className="py-3 px-6 text-center text-sm font-medium text-gray-600 uppercase tracking-wider">
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {displayedCourses.map((course, index) => {
                            const percentNum = parseFloat(course.percent.replace('%', '')) || 0;
                            const { bgColor, textColor } = getStatusColor(percentNum);

                            return (
                                <tr
                                    key={index}
                                    className="hover:bg-gray-50 transition-colors cursor-pointer group"
                                >
                                    <td className="py-4 px-6">
                                        <div className="font-medium text-gray-800">{course.course}</div>
                                        <div className="text-sm text-gray-500 hidden group-hover:block transition-all">
                                            {course.courseCode || `CSE${100 + index}`}
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center justify-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                            <span className="font-medium">{course.present}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center justify-center gap-2">
                                            <BookOpen className="h-4 w-4 text-blue-500" />
                                            <span className="font-medium">{course.total}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div
                                                className={`h-2.5 rounded-full ${bgColor}`}
                                                style={{ width: course.percent }}
                                            ></div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex justify-center">
                                            <span
                                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${bgColor} text-black bg-opacity-15`}
                                            >
                                                {percentNum < 50 && <AlertCircle className="h-3 w-3 mr-1" />}
                                                {course.percent}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden p-2 space-y-4">
                {displayedCourses.map((course, index) => {
                    const percentNum = parseInt(course.percent.replace('%', '')) || 0;
                    const { bgColor, textColor } = getStatusColor(percentNum);

                    return (
                        <div
                            key={index}
                            className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
                        >
                            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                                <h4 className="font-medium text-gray-800">{course.course}</h4>
                                <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} text-black bg-opacity-15`}
                                >
                                    {percentNum < 50 && <AlertCircle className="h-3 w-3 mr-1" />}
                                    {course.percent}
                                </span>
                            </div>
                            <div className="p-4 space-y-3">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        <span>Present</span>
                                    </div>
                                    <span className="font-medium text-gray-800">{course.present}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <BookOpen className="h-4 w-4 text-blue-500" />
                                        <span>Total Classes</span>
                                    </div>
                                    <span className="font-medium text-gray-800">{course.total}</span>
                                </div>
                                <div className="pt-2">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs text-gray-500">Attendance Progress</span>
                                        <span className="text-xs font-medium text-gray-700">{course.percent}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${bgColor} transition-all duration-500 ease-out`}
                                            style={{ width: course.percent }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    );
                })}
            </div>
             <div className="px-0 py-1 border-t border-gray-200">
                    <QuizList />
                  </div>
        </div>
    );
}