"use client";

import React, { useState, useEffect } from "react";
import StudentInfoCard from "./StudentInfoCard";
import AttendanceSummary from "./AttendanceSummary";
import LoadingState from "./LoadingState";
import ErrorState from "./ErrorState";
import { AttendanceData } from "../types";
import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import AttendanceCalendar from "../../components/ui/attendancecalender"; // Import the calendar component
import CourseAttendance from "./CourseAttendance";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState<AttendanceData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const getData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No token found. Please log in again.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.message || "Failed to fetch attendance");

        setAttendance(data as AttendanceData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setTimeout(() => setLoading(false), 300);
      }
    };

    getData();
  }, []);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  if (
    !attendance ||
    !attendance.dailyAttendance ||
    attendance.dailyAttendance.length === 0
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-lg">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            No Records Found
          </h2>
          <p className="text-gray-600">
            We couldn’t find any attendance records for you.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Please check back later or contact support if this persists.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto p-4 md:p-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row items-start justify-between mb-8">
        <div className="mb-4 md:mb-0">
          <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600 mb-2">
            Student Dashboard
          </h1>
          <p className="text-gray-600">
            Track your attendance and academic progress
          </p>
        </div>
        <div className="flex items-center bg-white shadow-md rounded-xl px-4 py-2 border border-gray-200">
          <div className="mr-3 bg-gradient-to-br from-blue-500 to-purple-600 w-10 h-10 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {attendance.studentId}
            </span>
          </div>
          <div>
            <div className="text-sm text-gray-500">Student ID</div>
            <div className="font-semibold text-gray-800">
              {attendance.studentId}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StudentInfoCard
          branch={attendance.branch}
          batch={attendance.batch}
          section={attendance.section}
        />
        <AttendanceSummary
          totalPresent={attendance.totalPresent}
          totalClasses={attendance.totalClasses}
          overallPercentage={attendance.overallPercentage}
        />
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <AttendanceCalendar
          attendanceData={{
            studentId: parseInt(attendance.studentId),
            totalPresentAllSubjects: attendance.totalPresent,
            totalAbsentAllSubjects:
              attendance.totalClasses - attendance.totalPresent,
            subjects: attendance.subjects || {},
          }}
        />{" "}
      </div>
      <div className="bg-white rounded-xl shadow-md ">
        <h2 className="text-2xl font-semibold mb-4">Course-wise Attendance</h2>
        <CourseAttendance dailyAttendance={attendance.dailyAttendance} />
      </div>
    </main>
  );
}
