"use client";
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import CourseDetailModal from "./course-detail-modal";
import {
  BookOpen,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Course {
  name: string;
  code?: string;
  totalPresent: number;
  totalAbsent: number;
  totalLeave?: number;
  percentage: string;
  daily: Array<{
    date: string;
    present: number;
    absent: number;
    leave?: number;
    details?: Array<{
      time: string;
      status: 'Present' | 'Absent' | 'Leave';
      formatted: string;
    }>;
  }>;
}

interface CoursesListProps {
  courses: Record<string, Course>;
}

export default function CoursesList({ courses }: CoursesListProps) {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCourseClick = (course: Course) => {
    setSelectedCourse(course);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCourse(null);
  };

  const getAttendancePercentage = (course: Course) => {
    const total = course.totalPresent + course.totalAbsent + (course.totalLeave || 0);
    return total > 0 ? (course.totalPresent / total) * 100 : 0;
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 75) return "border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/30";
    if (percentage >= 60) return "border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/30";
    return "border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/30";
  };

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 75) return <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />;
    if (percentage >= 60) return <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
    return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
  };

  return (
    <div className="w-full bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 dark:bg-gradient-to-br dark:from-blue-900 dark:via-blue-800 dark:to-indigo-900 min-h-fit py-2">
      <div className="w-full px-2 md:px-4 py-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(courses).map(([courseName, course]) => {
            const percentage = getAttendancePercentage(course);
            const total = course.totalPresent + course.totalAbsent + (course.totalLeave || 0);
            
            return (
              <Card
                key={courseName}
                className={cn(
                  "p-4 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg",
                  getStatusColor(percentage)
                )}
                onClick={() => handleCourseClick(course)}
              >
                {/* Course Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                        {course.name}
                      </h3>
                      {course.code && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {course.code}
                        </p>
                      )}
                    </div>
                  </div>
                  {getStatusIcon(percentage)}
                </div>

                {/* Attendance Percentage */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Attendance
                    </span>
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                      <span className="text-xs font-medium text-green-700 dark:text-green-400">
                        Present
                      </span>
                    </div>
                    <p className="text-sm font-bold text-green-800 dark:text-green-300">
                      {course.totalPresent}
                    </p>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <XCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
                      <span className="text-xs font-medium text-red-700 dark:text-red-400">
                        Absent
                      </span>
                    </div>
                    <p className="text-sm font-bold text-red-800 dark:text-red-300">
                      {course.totalAbsent}
                    </p>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <BarChart3 className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
                        Total
                      </span>
                    </div>
                    <p className="text-sm font-bold text-blue-800 dark:text-blue-300">
                      {total}
                    </p>
                  </div>
                </div>

                {/* Click hint */}
                <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    Click for detailed view
                  </p>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Course Detail Modal */}
        {selectedCourse && (
          <CourseDetailModal
            isOpen={isModalOpen}
            onClose={closeModal}
            courseData={selectedCourse}
          />
        )}
      </div>
    </div>
  );
}