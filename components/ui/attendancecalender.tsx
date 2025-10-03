"use client";
import React, { useState, useEffect } from "react";
import LoadingState from "../../app/userdashboard/skeletonloading";
import ErrorState from "../../app/userdashboard/ErrorState";
import { ProgressiveLoader, CalendarSkeleton } from "./progressive-loader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  X,
  CalendarDays,
  Clock,
  BookOpen,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { JSX } from "react/jsx-runtime";
import { useAttendance } from "@/contexts/AttendanceContext";

// Removed in-memory caching to avoid stale cross-user data

interface Props {
  attendanceData: AttendanceData;
}

interface DailyRecord {
  date: string;
  present: number;
  absent: number;
  leave?: number;
  details?: Array<{
    time: string;
    status: 'Present' | 'Absent' | 'Leave';
    formatted: string;
  }>;
}

interface SubjectSummary {
  totalPresent: number;
  totalAbsent: number;
  totalLeave?: number;
  daily: DailyRecord[];
}

export interface AttendanceData {
  studentId: number;
  totalPresentAllSubjects: number;
  totalAbsentAllSubjects: number;
  totalLeaveAllSubjects?: number;
  subjects: Record<string, SubjectSummary>;
}

export default function AttendanceCalendar({ attendanceData: initialData }: Props) {
  const { attendanceData: cachedData, isLoading, error: contextError, fetchAttendance, isStale } = useAttendance();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedPeriodDetail, setSelectedPeriodDetail] = useState<{
    period: any;
    attendance: any;
    date: string;
  } | null>(null);

  // Always use cached data from context (ignore initial data as it has wrong structure)
  const attendanceData = cachedData;
  const loading = isLoading;
  const error = contextError || "";

  // Always fetch data on mount to ensure we have the right structure
  useEffect(() => {
    fetchAttendance();

    // On logout clear state listener
    const clearHandler = () => {
      setSelectedDay(null);
      setCurrentMonth(new Date());
    };
    window.addEventListener('clear-attendance-cache', clearHandler);
    return () => window.removeEventListener('clear-attendance-cache', clearHandler);
  }, [fetchAttendance]);

  // Force refresh function using context
  const refreshData = async () => {
    await fetchAttendance(true); // Force refresh
  };

  const getDailyAttendance = (): Map<
    string,
    { present: number; absent: number; leave: number; details: Array<{ subject: string, status: 'Present' | 'Absent' | 'Leave', time: string, formatted: string }> }
  > => {
    const dailyMap = new Map<string, { present: number; absent: number; leave: number; details: Array<{ subject: string, status: 'Present' | 'Absent' | 'Leave', time: string, formatted: string }> }>();

    if (!attendanceData?.subjects) {
      return dailyMap;
    }

    Object.entries(attendanceData.subjects).forEach(([subjectName, subject]) => {
      if (!subject.daily || !Array.isArray(subject.daily)) {
        return;
      }

      subject.daily.forEach((day: any) => {
        if (!dailyMap.has(day.date)) {
          dailyMap.set(day.date, { present: 0, absent: 0, leave: 0, details: [] });
        }
        const currentDayData = dailyMap.get(day.date)!;
        currentDayData.present += day.present;
        currentDayData.absent += day.absent;
        currentDayData.leave += day.leave || 0;

        // Add detailed information for each subject
        if (day.details) {
          day.details.forEach((detail: any) => {
            currentDayData.details.push({
              subject: subjectName,
              status: detail.status,
              time: detail.time,
              formatted: detail.formatted
            });
          });
        }
      });
    });
    return dailyMap;
  };

  const dailyAttendance = getDailyAttendance();

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    const startDay = firstDay.getDay();
    for (let i = 0; i < startDay; i++) {
      days.push({ date: null, data: null });
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        d
      ).padStart(2, "0")}`;
      const data = dailyAttendance.get(dateStr) || { present: 0, absent: 0, leave: 0, details: [] };
      days.push({ date: new Date(year, month, d), data });
    }
    return days;
  };

  const calendarDays = generateCalendarDays();

  const goToPreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const getTotalSubjects = () => {
    const src = attendanceData?.subjects;
    return src ? Object.keys(src).length : 0;
  };

  const getSelectedDayData = () => {
    if (!selectedDay) return null;

    const dateStr = `${selectedDay.getFullYear()}-${String(
      selectedDay.getMonth() + 1
    ).padStart(2, "0")}-${String(selectedDay.getDate()).padStart(2, "0")}`;

    const daySummary = dailyAttendance.get(dateStr);

    if (daySummary) {
      return {
        present: daySummary.present,
        absent: daySummary.absent,
        leave: daySummary.leave,
        details: daySummary.details
      };
    } else {
      return { present: 0, absent: 0, leave: 0, details: [] };
    }
  };

  // Show progressive loading states
  if (loading && !attendanceData) {
    return <CalendarSkeleton />;
  }

  if (error && !attendanceData) return <ErrorState error={error} />;

  // Use cached attendance data
  const displayPresent = attendanceData?.totalPresentAllSubjects ?? 0;
  const displayAbsent = attendanceData?.totalAbsentAllSubjects ?? 0;

  const selectedDayData = getSelectedDayData();



  return (
    <ProgressiveLoader 
      isLoading={loading} 
      isStale={isStale}
      message="Fetching latest attendance data..."
    >
      <div className={cn(
        "w-full bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 dark:bg-gradient-to-br dark:from-blue-900 dark:via-blue-800 dark:to-indigo-900",
        selectedDay ? "min-h-screen py-0" : "min-h-fit py-2"
      )}>
        <div className="w-full px-2 md:px-4 py-2">
        {/* Header - Stats Cards */}
        <div className="w-full grid grid-cols-2 gap-3 mb-4 pb-3">
          {/* Present Lecture Card */}
          <Card className="p-4 bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700/50 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2">
                  Present Lectures
                </p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {displayPresent}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-800/50 rounded-full">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>

          {/* Absent Lecture Card */}
          <Card className="p-4 bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-700/50 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-2">
                  Absent Lectures
                </p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                  {displayAbsent}
                </p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-800/50 rounded-full">
                <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Calendar Section */}
        <Card className="w-full p-1 md:p-2 bg-white/90 dark:bg-gray-800/90 border border-blue-200 dark:border-blue-700 shadow-lg backdrop-blur-sm">
          <div className="flex justify-between items-center mb-0">
            <Button
              variant="outline"
              onClick={goToPreviousMonth}
              className="p-1 md:p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-200 text-gray-700 dark:text-gray-300"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only md:not-sr-only md:ml-2">Previous</span>
            </Button>
            <div className="text-center flex gap-2 items-center">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <Calendar className="h-5 w-5 md:h-6 md:w-6 text-indigo-600 dark:text-indigo-400" />
                {formatMonth(currentMonth)}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshData}
                disabled={loading}
                className={cn(
                  "ml-2 p-1 text-xs transition-all duration-200",
                  isStale 
                    ? "text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300" 
                    : "text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300",
                  loading && "animate-spin"
                )}
                title={isStale ? "Data is stale - click to refresh" : "Refresh data"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                  <path d="M21 3v5h-5"></path>
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                  <path d="M3 21v-5h5"></path>
                </svg>
              </Button>
              {isStale && (
                <Badge variant="outline" className="ml-2 text-xs text-yellow-600 dark:text-yellow-400 border-yellow-300 dark:border-yellow-600">
                  Updating...
                </Badge>
              )}
            </div>
            <Button
              variant="outline"
              onClick={goToNextMonth}
              className="p-1 md:p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-200 text-gray-700 dark:text-gray-300"
            >
              <span className="sr-only md:not-sr-only md:mr-2">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Weekdays Header */}
          <div className="w-full grid grid-cols-7 gap-0.5 mb-0">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day: string) => (
              <div
                key={day}
                className="text-center py-2 text-xs font-medium text-gray-600 dark:text-gray-400"
              >
                {day.substring(0, 3)}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="w-full grid grid-cols-7 gap-0.5">
            {calendarDays.map((day, index) => {
              if (!day.date) {
                return <div key={index} className="h-10"></div>;
              }
              const totalLectures = (day.data?.present || 0) + (day.data?.absent || 0) + (day.data?.leave || 0);
              const isToday =
                day.date.toDateString() === new Date().toDateString();
              const isSelected =
                selectedDay?.toDateString() === day.date.toDateString();

              let dayStyle: string;
              let textColor: string;
              let badgeColor = "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300";
              let badgeContent: string | JSX.Element = "";

              const dayOfWeek = day.date.getDay();
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
              const isWeekendOff = isWeekend && totalLectures === 0;

              if (isWeekendOff) {
                dayStyle = "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600";
                textColor = "text-gray-500 dark:text-gray-400";
                badgeColor = "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300";
                badgeContent = "OFF";
              } else if (totalLectures > 0) {
                // Determine the primary status for the day
                const presentCount = day.data?.present || 0;
                const absentCount = day.data?.absent || 0;
                const leaveCount = day.data?.leave || 0;

                if (leaveCount > 0 && leaveCount >= presentCount && leaveCount >= absentCount) {
                  // Leave is the primary status
                  dayStyle = "bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/30 hover:from-yellow-100 hover:to-amber-100 dark:hover:from-yellow-800/40 dark:hover:to-amber-800/40 border-yellow-200 dark:border-yellow-700";
                  textColor = "text-yellow-800 dark:text-yellow-300";
                  badgeColor = "bg-yellow-200 dark:bg-yellow-700 text-yellow-800 dark:text-yellow-300";
                  badgeContent = "L"; // Leave indicator
                } else if (presentCount >= absentCount) {
                  // Present is the primary status
                  dayStyle = "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-800/40 dark:hover:to-emerald-800/40 border-green-200 dark:border-green-700";
                  textColor = "text-green-800 dark:text-green-300";
                  badgeColor = "bg-green-200 dark:bg-green-700 text-green-800 dark:text-green-300";
                  badgeContent = presentCount.toString(); // Show present count
                } else {
                  // Absent is the primary status
                  dayStyle = "bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30 hover:from-red-100 hover:to-pink-100 dark:hover:from-red-800/40 dark:hover:to-pink-800/40 border-red-200 dark:border-red-700";
                  textColor = "text-gray-800 dark:text-gray-200";
                  badgeColor = "bg-red-200 dark:bg-red-700 text-red-800 dark:text-red-300";
                  badgeContent = presentCount.toString(); // Show present count even when mostly absent
                }
              } else {
                dayStyle = "bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-gray-200 dark:border-gray-600";
                textColor = "text-gray-700 dark:text-gray-300";
              }

              if (isToday) {
                dayStyle = cn(dayStyle, "ring-2 ring-indigo-500 dark:ring-indigo-400");
              }
              if (isSelected) {
                dayStyle = cn(dayStyle, "ring-2 ring-purple-500 dark:ring-purple-400");
              }

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDay(day.date)}
                  className={cn(
                    "h-12 flex flex-col justify-center items-center border rounded-lg p-1 transition-all duration-200",
                    dayStyle
                  )}
                >
                  <span className={cn("text-sm font-semibold", textColor)}>
                    {day.date.getDate()}
                  </span>
                  {(totalLectures > 0 || isWeekendOff) && (
                    <Badge className={cn("text-xxs px-1 mt-0.5", badgeColor)}>
                      {badgeContent}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>

          {/* Period Boxes for Selected Day - Only show when a date is selected */}
          {selectedDay && selectedDayData && (
            <div className="mt-3">
              <Card className="p-3 bg-white/90 dark:bg-gray-800/90 border-blue-200 dark:border-blue-700 shadow-lg backdrop-blur-sm">
                <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3">
                  {selectedDay.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })} - Daily Schedule
                </h3>

                {(() => {
                  const dayOfWeek = selectedDay.getDay();
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                  // Check if it's a weekend with no data
                  if (
                    isWeekend &&
                    selectedDayData.present === 0 &&
                    selectedDayData.absent === 0 &&
                    (selectedDayData.leave || 0) === 0
                  ) {
                    return (
                      <div className="text-center py-4">
                        <Badge className="bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-3 py-1 text-sm">
                          Weekend - No Classes Scheduled
                        </Badge>
                      </div>
                    );
                  }

                  // Get periods from configuration - fully configurable for different institutions
                  const periods = [
                    { id: 1, time: "8:50 - 9:40", start: "08:50", end: "09:40" },
                    { id: 2, time: "9:40 - 10:30", start: "09:40", end: "10:30" },
                    { id: 3, time: "10:40 - 11:30", start: "10:40", end: "11:30" },
                    { id: 4, time: "11:30 - 12:20", start: "11:30", end: "12:20" },
                    { id: 5, time: "12:20 - 1:10", start: "12:20", end: "13:10" },
                    { id: 6, time: "2:00 - 2:50", start: "14:00", end: "14:50" },
                    { id: 7, time: "2:50 - 3:40", start: "14:50", end: "15:40" },
                    { id: 8, time: "3:40 - 4:30", start: "15:40", end: "16:30" },
                  ];
                  // Note: These periods are based on the actual class schedule from the API data
                  // They can be easily modified in lib/attendance-config.ts for different institutions

                  // Create a comprehensive list of all attendance records for the day
                  const allAttendanceRecords: Array<{
                    subject: string;
                    status: string;
                    time: string;
                    formatted: string;
                  }> = [];

                  if (selectedDayData.details) {
                    selectedDayData.details.forEach((detail: any) => {
                      if (detail.time && detail.subject && detail.status) {
                        allAttendanceRecords.push({
                          subject: detail.subject,
                          status: detail.status,
                          time: detail.time.substring(11, 16), // Extract HH:MM
                          formatted: detail.formatted
                        });
                      }
                    });
                  }

                  // Function to find attendance for a period
                  const getAttendanceForPeriod = (period: any) => {
                    // First, try exact match for period start time
                    let exactMatch = allAttendanceRecords.find(record => record.time === period.start);
                    if (exactMatch) {
                      return exactMatch;
                    }

                    // Then, check for any attendance within the period time range
                    const [startHours, startMinutes] = period.start.split(':').map(Number);
                    const startInMinutes = startHours * 60 + startMinutes;

                    const [endHours, endMinutes] = period.end.split(':').map(Number);
                    const endInMinutes = endHours * 60 + endMinutes;

                    for (const record of allAttendanceRecords) {
                      const [hours, minutes] = record.time.split(':').map(Number);
                      const timeInMinutes = hours * 60 + minutes;

                      if (timeInMinutes >= startInMinutes && timeInMinutes < endInMinutes) {
                        return record;
                      }
                    }

                    return null;
                  };

                  return (
                    <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                      {periods.map((period) => {
                        const attendance = getAttendanceForPeriod(period);

                        let bgColor = "bg-gray-100 dark:bg-gray-700"; // Not marked
                        let textColor = "text-gray-500 dark:text-gray-400";
                        let borderColor = "border-gray-200 dark:border-gray-600";

                        if (attendance) {
                          if (attendance.status === "Present") {
                            bgColor = "bg-green-100 dark:bg-green-800/50";
                            textColor = "text-green-800 dark:text-green-300";
                            borderColor = "border-green-200 dark:border-green-700";
                          } else if (attendance.status === "Absent") {
                            bgColor = "bg-red-100 dark:bg-red-800/50";
                            textColor = "text-red-800 dark:text-red-300";
                            borderColor = "border-red-200 dark:border-red-700";
                          } else if (attendance.status === "Leave") {
                            bgColor = "bg-yellow-100 dark:bg-yellow-800/50";
                            textColor = "text-yellow-800 dark:text-yellow-300";
                            borderColor = "border-yellow-200 dark:border-yellow-700";
                          }
                        }

                        return (
                          <button
                            key={period.id}
                            onClick={() => setSelectedPeriodDetail({
                              period,
                              attendance,
                              date: selectedDay.toLocaleDateString("en-US", {
                                weekday: "long",
                                month: "long",
                                day: "numeric",
                                year: "numeric"
                              })
                            })}
                            className={cn(
                              "p-2 rounded-lg border-2 transition-all duration-200 min-h-[80px] flex flex-col justify-between hover:scale-105 hover:shadow-md cursor-pointer active:scale-95",
                              bgColor,
                              borderColor
                            )}
                            title={`Click for detailed information about Period ${period.id}`}
                          >
                            <div className="text-center">
                              <div className={cn("text-xs font-semibold mb-1", textColor)}>
                                Period {period.id}
                              </div>
                              <div className={cn("text-xs mb-2", textColor)}>
                                {period.time}
                              </div>
                              {attendance ? (
                                <div className={cn("text-xs font-medium truncate", textColor)}>
                                  {attendance.subject}
                                </div>
                              ) : (
                                <div className={cn("text-xs", textColor)}>
                                  Not Marked
                                </div>
                              )}
                            </div>

                            {attendance && (
                              <div className="text-center mt-1">
                                <Badge
                                  className={cn(
                                    "text-xs px-1 py-0.5",
                                    attendance.status === "Present" ? "bg-green-200 text-green-800 dark:bg-green-700 dark:text-green-300" :
                                      attendance.status === "Absent" ? "bg-red-200 text-red-800 dark:bg-red-700 dark:text-red-300" :
                                        "bg-yellow-200 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-300"
                                  )}
                                >
                                  {attendance.status}
                                </Badge>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </Card>
            </div>
          )}
        </Card>

        {/* Detailed Period Modal */}
        {selectedPeriodDetail && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <Card className="w-full max-w-md shadow-3xl animate-in zoom-in slide-in-from-bottom duration-500">
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                    Period {selectedPeriodDetail.period.id} Details
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPeriodDetail(null)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Period Information */}
                <div className="space-y-4">
                  {/* Date and Time */}
                  <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                      <CalendarDays className="h-4 w-4" />
                      Date & Time
                    </div>
                    <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-400 mb-1">
                      <Calendar className="h-3 w-3" />
                      {selectedPeriodDetail.date}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-400">
                      <Clock className="h-3 w-3" />
                      {selectedPeriodDetail.period.time}
                    </div>
                  </div>

                  {/* Subject Information */}
                  {selectedPeriodDetail.attendance ? (
                    <>
                      <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-300 mb-2">
                          <BookOpen className="h-4 w-4" />
                          Subject
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-400">
                          {selectedPeriodDetail.attendance.subject}
                        </div>
                      </div>

                      {/* Attendance Status */}
                      <div className={cn(
                        "p-3 rounded-lg",
                        selectedPeriodDetail.attendance.status === "Present"
                          ? "bg-green-50 dark:bg-green-900/30"
                          : selectedPeriodDetail.attendance.status === "Absent"
                            ? "bg-red-50 dark:bg-red-900/30"
                            : "bg-yellow-50 dark:bg-yellow-900/30"
                      )}>
                        <div className={cn(
                          "flex items-center gap-2 text-sm font-medium mb-2",
                          selectedPeriodDetail.attendance.status === "Present"
                            ? "text-green-800 dark:text-green-300"
                            : selectedPeriodDetail.attendance.status === "Absent"
                              ? "text-red-800 dark:text-red-300"
                              : "text-yellow-800 dark:text-yellow-300"
                        )}>
                          {selectedPeriodDetail.attendance.status === "Present" ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : selectedPeriodDetail.attendance.status === "Absent" ? (
                            <XCircle className="h-4 w-4" />
                          ) : (
                            <AlertCircle className="h-4 w-4" />
                          )}
                          Attendance Status
                        </div>
                        <div className={cn(
                          "text-sm font-semibold",
                          selectedPeriodDetail.attendance.status === "Present"
                            ? "text-green-700 dark:text-green-400"
                            : selectedPeriodDetail.attendance.status === "Absent"
                              ? "text-red-700 dark:text-red-400"
                              : "text-yellow-700 dark:text-yellow-400"
                        )}>
                          {selectedPeriodDetail.attendance.status}
                        </div>
                      </div>

                      {/* Additional Details */}
                      {selectedPeriodDetail.attendance.formatted && (
                        <div className="bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-lg">
                          <div className="flex items-center gap-2 text-sm font-medium text-indigo-800 dark:text-indigo-300 mb-2">
                            <Clock className="h-4 w-4" />
                            Class Duration
                          </div>
                          <div className="text-sm text-indigo-700 dark:text-indigo-400">
                            {selectedPeriodDetail.attendance.formatted}
                          </div>
                        </div>
                      )}

                      {/* Quick Stats */}
                      <div className="bg-purple-50 dark:bg-purple-900/30 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-sm font-medium text-purple-800 dark:text-purple-300 mb-2">
                          <BarChart3 className="h-4 w-4" />
                          Quick Info
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-purple-700 dark:text-purple-400">
                            Period: {selectedPeriodDetail.period.id}/8
                          </div>
                          <div className="text-purple-700 dark:text-purple-400">
                            Status: {selectedPeriodDetail.attendance.status}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Free Period */
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg text-center">
                      <div className="flex items-center justify-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-300 mb-2">
                        <Info className="h-4 w-4" />
                        Free Period
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        No class scheduled for this period
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={() => setSelectedPeriodDetail(null)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
        </div>
      </div>
    </ProgressiveLoader>
  );
}
