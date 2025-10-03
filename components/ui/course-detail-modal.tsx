"use client";
import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  X,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Users,
  Target,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CourseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseData: {
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
  };
}

export default function CourseDetailModal({ isOpen, onClose, courseData }: CourseDetailModalProps) {
  if (!isOpen) return null;

  const totalClasses = courseData.totalPresent + courseData.totalAbsent + (courseData.totalLeave || 0);
  const attendancePercentage = totalClasses > 0 ? (courseData.totalPresent / totalClasses) * 100 : 0;
  
  // Calculate recent attendance trend (last 10 classes)
  const recentClasses = courseData.daily.slice(-10);
  const recentPresent = recentClasses.reduce((sum, day) => sum + day.present, 0);
  const recentTotal = recentClasses.reduce((sum, day) => sum + day.present + day.absent + (day.leave || 0), 0);
  const recentPercentage = recentTotal > 0 ? (recentPresent / recentTotal) * 100 : 0;

  // Get attendance status color
  const getStatusColor = (percentage: number) => {
    if (percentage >= 75) return "text-green-600 dark:text-green-400";
    if (percentage >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 75) return <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />;
    if (percentage >= 60) return <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
    return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 shadow-2xl">
        <div className="p-6">
          {/* Modal Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-1">
                {courseData.name}
              </h2>
              {courseData.code && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Course Code: {courseData.code}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Attendance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Overall Attendance */}
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-blue-200 dark:border-blue-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-800/50 rounded-full">
                  <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-800 dark:text-blue-300">Overall Attendance</h3>
                  <p className="text-sm text-blue-600 dark:text-blue-400">Total Performance</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {attendancePercentage.toFixed(1)}%
                  </span>
                  {getStatusIcon(attendancePercentage)}
                </div>
                <Progress 
                  value={attendancePercentage} 
                  className="h-2"
                />
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  {courseData.totalPresent} present out of {totalClasses} classes
                </p>
              </div>
            </Card>

            {/* Recent Trend */}
            <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 border-purple-200 dark:border-purple-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-800/50 rounded-full">
                  <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-purple-800 dark:text-purple-300">Recent Trend</h3>
                  <p className="text-sm text-purple-600 dark:text-purple-400">Last 10 Classes</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    {recentPercentage.toFixed(1)}%
                  </span>
                  {recentPercentage >= attendancePercentage ? (
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                  )}
                </div>
                <Progress 
                  value={recentPercentage} 
                  className="h-2"
                />
                <p className="text-xs text-purple-600 dark:text-purple-400">
                  {recentPresent} present out of {recentTotal} recent classes
                </p>
              </div>
            </Card>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="p-3 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-800 dark:text-green-300">Present</span>
              </div>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                {courseData.totalPresent}
              </p>
            </Card>

            <Card className="p-3 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-red-800 dark:text-red-300">Absent</span>
              </div>
              <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                {courseData.totalAbsent}
              </p>
            </Card>

            <Card className="p-3 bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Leave</span>
              </div>
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                {courseData.totalLeave || 0}
              </p>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="p-4 bg-gray-50 dark:bg-gray-700/50">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <h3 className="font-semibold text-gray-800 dark:text-gray-300">Recent Activity</h3>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {courseData.daily.slice(-8).reverse().map((day, index) => {
                const dayTotal = day.present + day.absent + (day.leave || 0);
                if (dayTotal === 0) return null;
                
                return (
                  <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-600 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {new Date(day.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric"
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {day.present > 0 && (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-300">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {day.present}
                        </Badge>
                      )}
                      {day.absent > 0 && (
                        <Badge className="bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-300">
                          <XCircle className="h-3 w-3 mr-1" />
                          {day.absent}
                        </Badge>
                      )}
                      {(day.leave || 0) > 0 && (
                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-300">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {day.leave}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Modal Footer */}
          <div className="mt-6 flex justify-end">
            <Button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Close
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}