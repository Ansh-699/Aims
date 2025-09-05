"use client";
import React, { useState, useEffect } from "react";
import LoadingState from "../../app/userdashboard/skeletonloading";
import ErrorState from "../../app/userdashboard/ErrorState";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

// Removed in-memory caching to avoid stale cross-user data

interface Props {
  attendanceData: AttendanceData;
}

interface DailyRecord {
  date: string;
  present: number;
  absent: number;
}

interface SubjectSummary {
  totalPresent: number;
  totalAbsent: number;
  daily: DailyRecord[];
}

export interface AttendanceData {
  studentId: number;
  totalPresentAllSubjects: number;
  totalAbsentAllSubjects: number;
  subjects: Record<string, SubjectSummary>;
}

export default function AttendanceCalendar({ attendanceData: initialData }: Props) {
  const [loading, setLoading] = useState(true);
  const [fetchedAttendance, setFetchedAttendance] = useState<AttendanceData | null>(null);
  const [error, setError] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // Data fetching (no in-memory cache to prevent stale data for new logins)
  useEffect(() => {
    const fetchAttendance = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found");
        setLoading(false);
        return;
      }
      try {
        console.log("Fetching fresh attendance data");
        const response = await fetch("/api/all-attendance", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store'
        });
        
        if (!response.ok) {
          const t = await response.text();
          throw new Error(t || "Failed to fetch attendance data");
        }
        
  const data = await response.json();
  setFetchedAttendance(data);
        
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAttendance();
    
    // On logout clear state listener
    const clearHandler = () => {
  setFetchedAttendance(null);
      setSelectedDay(null);
      setCurrentMonth(new Date());
    };
    window.addEventListener('clear-attendance-cache', clearHandler);
    return () => window.removeEventListener('clear-attendance-cache', clearHandler);
  }, []);

  // Add cache force refresh function
  const refreshData = async () => {
    setLoading(true);
    
    const token = localStorage.getItem("token");
    if (!token) {
      setError("No authentication token found");
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch("/api/all-attendance", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        const t = await response.text();
        throw new Error(t || "Failed to fetch attendance data");
      }
      
  const data = await response.json();
  setFetchedAttendance(data);
      
      setError("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getDailyAttendance = (): Map<
    string,
    { present: number; absent: number }
  > => {
    const dailyMap = new Map<string, { present: number; absent: number }>();
  if (!fetchedAttendance?.subjects) return dailyMap;

  Object.values(fetchedAttendance.subjects).forEach((subject) => {
      subject.daily.forEach((day) => {
        if (!dailyMap.has(day.date)) {
          dailyMap.set(day.date, { present: 0, absent: 0 });
        }
        const currentDayData = dailyMap.get(day.date)!;
        currentDayData.present += day.present;
        currentDayData.absent += day.absent;
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
      const data = dailyAttendance.get(dateStr) || { present: 0, absent: 0 };
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
    const src = fetchedAttendance?.subjects || initialData?.subjects;
    return src ? Object.keys(src).length : 0;
  };

  const getSelectedDayData = () => {
    if (!selectedDay) return null;

    const dateStr = `${selectedDay.getFullYear()}-${String(
      selectedDay.getMonth() + 1
    ).padStart(2, "0")}-${String(selectedDay.getDate()).padStart(2, "0")}`;

    const daySummary = dailyAttendance.get(dateStr);

    if (daySummary) {
      // Return the actual present and absent counts for the day
      return { present: daySummary.present, absent: daySummary.absent };
    } else {
      // If no data for the day, assume 0 present and 0 absent
      return { present: 0, absent: 0 };
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  // Determine which totals to display (prefer prop to ensure consistency with header summary)
  const displayPresent = initialData?.totalPresentAllSubjects ?? fetchedAttendance?.totalPresentAllSubjects ?? 0;
  const displayAbsent = initialData?.totalAbsentAllSubjects ?? fetchedAttendance?.totalAbsentAllSubjects ?? 0;
  if (!initialData && !fetchedAttendance) return null;

  const selectedDayData = getSelectedDayData();

  return (
    <div className="w-full py-0 dark:bg-gray-800">
      <div className="w-full px-0 py-2">
        {/* Header */}
        <div className="text-center mb-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50  "></div>
        <div className="w-full grid grid-cols-2 gap-2 mb-3 pb-3 dark:bg-gray-800 ">
          {/* Present Lecture Card */}
          <Card className="p-3 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 border border-blue-200 dark:border-blue-700/50 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1 dark:text-white ">
                  Present Lecture
                </p>
                <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                  {displayPresent}
                </p>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-800/50 rounded-full">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>

          {/* Absent Lecture Card */}
          <Card className="p-3 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30 border border-red-200 dark:border-red-700/50 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">
                  Absent Lecture
                </p>
                <p className="text-xl font-bold text-red-700 dark:text-red-300">
                  {displayAbsent}
                </p>
              </div>
              <div className="p-2 bg-red-100 dark:bg-red-800/50 rounded-full">
                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Calendar Section */}
        <Card className="w-full p-1 md:p-2 mb-0 bg-white/70 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
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
                className="ml-2 p-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                  <path d="M21 3v5h-5"></path>
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                  <path d="M3 21v-5h5"></path>
                </svg>
              </Button>
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
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
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
              const totalLectures = day.data.present + day.data.absent;
              const isToday =
                day.date.toDateString() === new Date().toDateString();
              const isSelected =
                selectedDay?.toDateString() === day.date.toDateString();

              let dayStyle: string;
              let textColor: string;
              let badgeColor = "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300";

              const dayOfWeek = day.date.getDay();
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
              const isWeekendOff = isWeekend && totalLectures === 0;

              if (isWeekendOff) {
                dayStyle = "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600";
                textColor = "text-gray-500 dark:text-gray-400";
                badgeColor = "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300";
              } else if (totalLectures > 0) {
                if (day.data.present >= day.data.absent) {
                  dayStyle =
                    "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-800/40 dark:hover:to-emerald-800/40 border-green-200 dark:border-green-700";
                  textColor = "text-green-800 dark:text-green-300";
                  badgeColor = "bg-green-200 dark:bg-green-700 text-green-800 dark:text-green-300";
                } else {
                  dayStyle =
                    "bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30 hover:from-red-100 hover:to-pink-100 dark:hover:from-red-800/40 dark:hover:to-pink-800/40 border-red-200 dark:border-red-700";
                  textColor = "text-gray-800 dark:text-gray-200";
                  badgeColor = "bg-red-200 dark:bg-red-700 text-red-800 dark:text-red-300";
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
                      {isWeekendOff ? "OFF" : day.data.present}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tooltip on Selected Day */}
          {selectedDay &&
            selectedDayData && ( // Ensure selectedDayData is not null
              <div className="mt-1">
                <Card className="p-2 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 border-indigo-200 dark:border-indigo-700">
                  <h3 className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">
                    {selectedDay.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const dayOfWeek = selectedDay.getDay();
                      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                      // Check if it's a weekend and if there's no specific attendance data (present/absent sum is 0)
                      // The selectedDayData now directly reflects present/absent counts.
                      // If it's a weekend and both present and absent are 0, it's likely an "OFF" day.
                      if (
                        isWeekend &&
                        selectedDayData.present === 0 &&
                        selectedDayData.absent === 0
                      ) {
                        return (
                          <Badge className="bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-0.5 text-xs">
                            OFF
                          </Badge>
                        );
                      } else {
                        // For non-weekends, or weekends with attendance data, display present/absent
                        return (
                          <>
                            <Badge className="bg-green-100 dark:bg-green-800/50 text-green-800 dark:text-green-300 px-2 py-0.5 text-xs">
                              Present: {selectedDayData.present}
                            </Badge>
                            <Badge className="bg-red-100 dark:bg-red-800/50 text-red-800 dark:text-red-300 px-2 py-0.5 text-xs">
                              Absent: {selectedDayData.absent}
                            </Badge>
                          </>
                        );
                      }
                    })()}
                  </div>
                </Card>
              </div>
            )}
        </Card>
      </div>
    </div>
  );
}
