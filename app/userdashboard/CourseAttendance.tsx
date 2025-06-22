import React, { useState, useMemo } from "react";
import useSWR from "swr";
import { BarChart, CheckCircle, BookOpen, AlertCircle } from "lucide-react";
import { getStatusColor } from "../utils/statusHelpers";
import { CourseAttendance as CourseAttendanceType } from "../types";

interface CourseAttendanceProps {
  dailyAttendance: CourseAttendanceType[];
}

// Custom fetcher for course mapping
const fetcher = (url: string) => {
  const token = localStorage.getItem("token");
  if (!token) return Promise.resolve({});

  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(res => res.json()).catch(() => ({}));
};

export default function CourseAttendance({
  dailyAttendance,
}: CourseAttendanceProps) {
  const [showLabs, setShowLabs] = useState(false);

  // Fetch course code to name mapping
  const { data: courseData } = useSWR("/api/all-attendance", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 600000, // 10 minutes
  });

  const courseCodeMap = courseData?.courseCodeMap || {};

  // Enhanced course filtering and sorting
  const { mainCourses, labCourses } = useMemo(() => {
    const main: CourseAttendanceType[] = [];
    const labs: CourseAttendanceType[] = [];

    dailyAttendance.forEach((course) => {
      const courseName = course.course.toLowerCase();
      
      if (courseName.includes("lab") ||
          courseName.includes("workshop") ||
          courseName.includes("training")) {
        labs.push(course);
      } else {
        main.push(course);
      }
    });

    // Sort main courses alphabetically
    main.sort((a, b) => a.course.localeCompare(b.course));
    
    // Sort labs alphabetically
    labs.sort((a, b) => a.course.localeCompare(b.course));

    return { mainCourses: main, labCourses: labs };
  }, [dailyAttendance]);

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
              const percentNum =
                parseFloat(course.percent.replace("%", "")) || 0;
              const { bgColor, textColor } = getStatusColor(percentNum);

              // Try to extract course code from course name or use mapping
              const extractCourseCode = (courseName: string) => {
                // Check if course name contains a course code pattern (e.g., CSE101, MATH201)
                const codeMatch = courseName.match(/\b[A-Z]{2,4}\d{3}\b/);
                if (codeMatch) return codeMatch[0];
                
                // Look for exact match in courseCodeMap
                const exactMatch = Object.keys(courseCodeMap).find(
                  code => courseCodeMap[code].toLowerCase() === courseName.toLowerCase()
                );
                if (exactMatch) return exactMatch;
                
                // Fallback: generate a reasonable code
                return `CSE${100 + index}`;
              };

              const courseCode = extractCourseCode(course.course);

              return (
                <tr
                  key={index}
                  className="hover:bg-gray-50 transition-colors cursor-pointer group"
                >
                  <td className="py-4 px-6">
                    <div className="flex flex-col">
                      <div className="font-medium text-gray-800 mb-1">
                        {courseCode}
                      </div>
                      <div className="text-sm text-gray-600">
                        {course.course}
                      </div>
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
                        {percentNum < 50 && (
                          <AlertCircle className="h-3 w-3 mr-1" />
                        )}
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
      <div className="md:hidden p-2 space-y-3">
        {displayedCourses.map((course, index) => {
          const percentNum = parseInt(course.percent.replace("%", "")) || 0;
          const { bgColor, textColor } = getStatusColor(percentNum);

          // Use the same course code extraction logic
          const extractCourseCode = (courseName: string) => {
            const codeMatch = courseName.match(/\b[A-Z]{2,4}\d{3}\b/);
            if (codeMatch) return codeMatch[0];
            
            const exactMatch = Object.keys(courseCodeMap).find(
              code => courseCodeMap[code].toLowerCase() === courseName.toLowerCase()
            );
            if (exactMatch) return exactMatch;
            
            return `CSE${100 + index}`;
          };

          const courseCode = extractCourseCode(course.course);

          return (
            <div
              key={index}
              className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 text-sm">{courseCode}</h4>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{course.course}</p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} text-black bg-opacity-15 ml-2`}
                  >
                    {percentNum < 50 && <AlertCircle className="h-3 w-3 mr-1" />}
                    {course.percent}
                  </span>
                </div>
                
                {/* Show category tag for lab/workshop */}
                {(course.course.toLowerCase().includes("lab") || 
                  course.course.toLowerCase().includes("workshop") || 
                  course.course.toLowerCase().includes("training")) && (
                  <div className="mb-2">
                    <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                      {course.course.toLowerCase().includes("lab") ? "Lab" : 
                       course.course.toLowerCase().includes("workshop") ? "Workshop" : "Training"}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Present</span>
                  </div>
                  <span className="font-medium text-gray-800">
                    {course.present}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-gray-600">
                    <BookOpen className="h-4 w-4 text-blue-500" />
                    <span>Total Classes</span>
                  </div>
                  <span className="font-medium text-gray-800">
                    {course.total}
                  </span>
                </div>
                <div className="pt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500">
                      Attendance Progress
                    </span>
                    <span className="text-xs font-medium text-gray-700">
                      {course.percent}
                    </span>
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
      {/* <div className="px-0 py-1 border-t border-gray-200">
                    <QuizList />
                  </div> */}
    </div>
  );
}
