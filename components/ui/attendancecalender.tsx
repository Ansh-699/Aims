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

export default function AttendancePage({}: Props) {
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(
    null
  );
  const [error, setError] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    const fetchAttendance = async () => {
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
        });
        if (!response.ok) {
          const t = await response.text();
          throw new Error(t || "Failed to fetch attendance data");
        }
        const data = await response.json();
        setAttendanceData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  const getDailyAttendance = (): Map<
    string,
    { present: number; absent: number }
  > => {
    const dailyMap = new Map<string, { present: number; absent: number }>();
    if (!attendanceData?.subjects) return dailyMap;

    Object.values(attendanceData.subjects).forEach((subject) => {
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
    return attendanceData?.subjects
      ? Object.keys(attendanceData.subjects).length
      : 0;
  };

  const getSelectedDayData = () => {
    if (!selectedDay) return null;

    const dateStr = `${selectedDay.getFullYear()}-${String(
      selectedDay.getMonth() + 1
    ).padStart(2, "0")}-${String(selectedDay.getDate()).padStart(2, "0")}`;

    const daySummary = dailyAttendance.get(dateStr);

    const totalPeriodsInDay = 8; 
    let presentInTooltip: number;
    let absentInTooltip: number;

    if (daySummary) {
      presentInTooltip = daySummary.present + daySummary.absent;
      
      absentInTooltip = totalPeriodsInDay - presentInTooltip;
    } else {
      presentInTooltip = 0;
      absentInTooltip = totalPeriodsInDay - 0; 
    }

    if (absentInTooltip < 0) {
      absentInTooltip = 0;
    }

    return { present: presentInTooltip, absent: absentInTooltip };
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!attendanceData) return null;

  const selectedDayData = getSelectedDayData();

  return (
    <div className="w-full">
      <div className="w-full px-0 py-2">
        {/* Header */}
        <div className="text-center mb-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"></div>
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-3">
          {/* Present Lecture Card */}
          <Card className="p-4 md:p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">
                  Present Lecture
                </p>
                <p className="text-2xl md:text-3xl font-bold text-blue-700">
                  {attendanceData.totalPresentAllSubjects}
                </p>
              </div>
              <div className="p-2 md:p-3 bg-blue-100 rounded-full">
                <Users className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          {/* Absent Lecture Card */}
          <Card className="p-4 md:p-6 bg-gradient-to-br from-red-50 to-pink-50 border-red-200 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600 mb-1">
                  Absent Lecture
                </p>
                <p className="text-2xl md:text-3xl font-bold text-red-700">
                  {attendanceData.totalAbsentAllSubjects}
                </p>
              </div>
              <div className="p-2 md:p-3 bg-red-100 rounded-full">
                <TrendingDown className="h-5 w-5 md:h-6 md:w-6 text-red-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Calendar Section */}
        <Card className="w-full p-1 md:p-2 mb-0 bg-white/70">
          <div className="flex justify-between items-center mb-0">
            <Button
              variant="outline"
              onClick={goToPreviousMonth}
              className="p-1 md:p-2 hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only md:not-sr-only md:ml-2">Previous</span>
            </Button>
            <div className="text-center">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Calendar className="h-5 w-5 md:h-6 md:w-6 text-indigo-600" />
                {formatMonth(currentMonth)}
              </h2>
            </div>
            <Button
              variant="outline"
              onClick={goToNextMonth}
              className="p-1 md:p-2 hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200"
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
                className="text-center py-2 text-xs font-medium text-gray-600"
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
              let dayStyle = "bg-gray-50 hover:bg-gray-100 border-gray-200";
              let textColor = "text-gray-600";
              let badgeColor = "bg-gray-200 text-gray-700";
              if (totalLectures > 0) {
                if (day.data.present >= day.data.absent) {
                  dayStyle =
                    "bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-green-200";
                  textColor = "text-green-800";
                  badgeColor = "bg-green-200 text-green-800";
                } else {
                  dayStyle =
                    "bg-gradient-to-br from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100 border-red-200";
                  textColor = "text-red-800";
                  badgeColor = "bg-red-200 text-red-800";
                }
              }
              if (isToday) {
                dayStyle += " ring-1 md:ring-2 ring-indigo-500";
              }
              if (isSelected) {
                dayStyle += " ring-1 md:ring-2 ring-purple-500";
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
                  {totalLectures > 0 && (
                    <Badge className={cn("text-xxs px-1 mt-0.5", badgeColor)}>
                      {totalLectures}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tooltip on Selected Day */}
          {selectedDay && selectedDayData && (
            <div className="mt-1">
              <Card className="p-2 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
                <h3 className="text-sm font-semibold text-indigo-800">
                  {selectedDay.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </h3>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-green-100 text-green-800 px-2 py-0.5 text-xs">
                    Present: {selectedDayData.present}
                  </Badge>
                  <Badge className="bg-red-100 text-red-800 px-2 py-0.5 text-xs">
                    Absent: {selectedDayData.absent}
                  </Badge>
                </div>
              </Card>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
