'use client';

import React, { useState, useEffect } from "react";
import StudentInfoCard from "./StudentInfoCard";
import AttendanceSummary from "./AttendanceSummary";
import LoadingState from "./LoadingState";
import ErrorState from "./ErrorState";
import { AttendanceData } from "../types";
import AttendanceCalendar from "../../components/ui/attendancecalender";
import CourseAttendance from "./CourseAttendance";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState<AttendanceData | null>(null);
  const [error, setError] = useState("");
  const [studentName, setStudentName] = useState("");

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
        if (!res.ok) throw new Error(data.message || "Failed to fetch attendance");

        setAttendance(data as AttendanceData);

        const stored = localStorage.getItem("studentName");
        const fromApi = (data.studentName as string) || (data.student_name as string);
        setStudentName(stored || fromApi || data.studentId);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setTimeout(() => setLoading(false), 300);
      }
    };

    getData();
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!attendance || attendance.dailyAttendance.length === 0) {
    return (
      <div className="min-h-screen p-4 bg-gray-50">
        <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-lg">
          <h2 className="text-xl font-bold text-gray-800 mb-2">No Records Found</h2>
          <p className="text-gray-600">We couldn’t find any attendance records for you.</p>
          <p className="text-sm text-gray-500 mt-4">
            Please check back later or contact support if this persists.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-9xl mx-auto p-1 md:p-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row items-start justify-between mb-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600 mb-2">
            Student Dashboard
          </h1>
          <p className="text-gray-600">Track your attendance and academic progress</p>
        </div>
        <div className="flex items-center bg-white shadow-md rounded-xl px-4 py-2 border border-gray-200">
          <div className="mr-3 bg-gradient-to-br from-blue-500 to-purple-600 w-10 h-10 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {studentName.charAt(0).toUpperCase() || "U"}
            </span>
          </div>
          <div>
            <div className="text-sm text-gray-500">Student</div>
            <div className="font-semibold text-gray-800">{studentName}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
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

      <div className="bg-white rounded-xl p-2 mt-6">
        <AttendanceCalendar
          attendanceData={{
            studentId: parseInt(attendance.studentId),
            totalPresentAllSubjects: attendance.totalPresent,
            totalAbsentAllSubjects: attendance.totalClasses - attendance.totalPresent,
            subjects: attendance.subjects || {},
          }}
        />
      </div>

      {/* Updated QuizStarter */}
      <QuizStarter />

      <div className="bg-white rounded-xl p-2 mt-6">
        <CourseAttendance dailyAttendance={attendance.dailyAttendance} />
      </div>
    </main>
  );
}

// ----------------------


const QuizStarter = () => {
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [pin, setPin] = useState('');
  const [quizCode, setQuizCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setAdmissionNumber(localStorage.getItem('admissionNumber') || '');
    setPin(localStorage.getItem('studentPin') || '');
  }, []);

  const handleSubmit = async (code: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        'https://faas-blr1-8177d592.doserverless.co/api/v1/web/fn-1c23ee6f-939a-44b2-9c4e-d17970ddd644/abes/fetchQuizDetails',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quiz_uc: code,
            user_unique_code: admissionNumber,
            pin: pin,
          }),
        }
      );

      const data = await res.json();
      const linkHtml = data?.response?.data?.[0]?.quiz_link;
      if (!linkHtml) throw new Error('No quiz link found');

      const parser = new DOMParser();
      const doc = parser.parseFromString(linkHtml, 'text/html');
      const href = doc.querySelector('a')?.href;
      if (!href) throw new Error('Invalid quiz link format');

      window.location.href = href;
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 mt-6 shadow">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">Start Quiz</h2>
      <div className="grid gap-4">
        
        <input
          type="text"
          value={quizCode}
          onChange={(e) => {
            const v = e.target.value;
            if (/^\d*$/.test(v) && v.length <= 4) {
              setQuizCode(v);
              setError('');
            }
          }}
          maxLength={4}
          placeholder="Enter 4-digit Quiz Code"
          className={`w-full px-4 py-2 border rounded-md text-center ${error ? 'border-red-500' : 'border-gray-300'}`}
        />
        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
        <button
          onClick={() => {
            if (quizCode.length === 4) {
              handleSubmit(quizCode);
            } else {
              setError('Please enter a valid 4-digit quiz code');
            }
          }}
          disabled={loading || quizCode.length !== 4}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Start Quiz'}
        </button>
      </div>
    </div>
  );
};
