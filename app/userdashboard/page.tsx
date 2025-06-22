"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import StudentInfoCard from "./StudentInfoCard";
import AttendanceSummary from "./AttendanceSummary";
import LoadingState from "./LoadingState";
import ErrorState from "./ErrorState";
import { AttendanceData } from "../types";
import AttendanceCalendar from "../../components/ui/attendancecalender";
import CourseAttendance from "./CourseAttendance";
import { Home, BookOpen, User, Trophy } from "lucide-react"; // Import Lucide React icons
import QuizList from "@/components/ui/quiz"

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState<AttendanceData | null>(null);
  const [error, setError] = useState("");
  const [studentName, setStudentName] = useState("");
  const [activeTab, setActiveTab] = useState("home"); // Default active tab

  // Memoize processed attendance data to avoid unnecessary recalculations
  const processedAttendanceData = useMemo(() => {
    if (!attendance) return null;
    
    return {
      studentId: parseInt(attendance.studentId),
      totalPresentAllSubjects: attendance.totalPresent,
      totalAbsentAllSubjects: attendance.totalClasses - attendance.totalPresent,
      subjects: attendance.subjects || {},
    };
  }, [attendance]);

  // Memoize student info to prevent unnecessary re-renders
  const studentInfo = useMemo(() => {
    if (!attendance) return null;
    
    return {
      branch: attendance.branch,
      batch: attendance.batch,
      section: attendance.section,
    };
  }, [attendance?.branch, attendance?.batch, attendance?.section]);

  // Memoized tab switching handler to prevent unnecessary re-renders
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  // Optimized data fetching with error handling and performance monitoring
  const fetchData = useCallback(async () => {
    const startTime = Date.now();
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
      
      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch attendance");
      }

      // Process and validate data efficiently
      const processedData = {
        ...data,
        totalPresent: Number(data.totalPresent) || 0,
        totalClasses: Number(data.totalClasses) || 0,
        overallPercentage: String(data.overallPercentage || "0"),
        dailyAttendance: Array.isArray(data.dailyAttendance) ? data.dailyAttendance : [],
        subjects: typeof data.subjects === 'object' ? data.subjects : {},
      };

      setAttendance(processedData as AttendanceData);

      const stored = localStorage.getItem("studentName");
      setStudentName(String(stored || data.studentId || "U"));
      
      // Log performance in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Dashboard] Data fetch completed in ${Date.now() - startTime}ms`);
      }
    } catch (err: any) {
      console.error('[Dashboard] Error fetching data:', err);
      setError(err.message);
    } finally {
      // Add slight delay for better UX
      setTimeout(() => setLoading(false), 300);
    }
  }, []);

  // Memoized content rendering with performance optimizations
  const renderContent = useMemo(() => {
    if (!attendance) return null;

    switch (activeTab) {
      case "home":
        return (
          <>
            <div className="flex flex-col md:flex-row items-start justify-between py-1 mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600 mb-2">
                  Student Dashboard
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">
                  Track your attendance and academic progress
                </p>
              </div>
              <div className="flex items-center bg-white shadow-md rounded-xl px-3 sm:px-4 py-2 border border-gray-200 mt-4 md:mt-0">
                <div className="mr-2 sm:mr-3 bg-gradient-to-br from-blue-500 to-purple-600 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xs sm:text-sm">
                    {studentName.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-gray-500">Student</div>
                  <div className="font-semibold text-gray-800 text-sm sm:text-base">
                    {studentName}
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {studentInfo && (
                <StudentInfoCard
                  branch={studentInfo.branch}
                  batch={studentInfo.batch}
                  section={studentInfo.section}
                />
              )}
              <AttendanceSummary
                totalPresent={attendance.totalPresent}
                totalClasses={attendance.totalClasses}
                overallPercentage={attendance.overallPercentage}
              />
            </div>
            <div className="bg-white rounded-xl p-2 sm:p-4 mt-4 sm:mt-6 shadow-sm">
              {processedAttendanceData && (
                <AttendanceCalendar attendanceData={processedAttendanceData} />
              )}
            </div>
          </>
        );

      case "courses":
        return (
          <div className="bg-white rounded-xl shadow-sm">
            <CourseAttendance dailyAttendance={attendance.dailyAttendance} />
          </div>
        );
      
      case "quiz":
        return (
          <>
            <div>
              <QuizList />
              <QuizStarter />
            </div>
          </>
        );
      
      default:
        return null;
    }
  }, [activeTab, attendance, studentInfo, processedAttendanceData, studentName]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!attendance || attendance.dailyAttendance.length === 0) {
    return (
      <div className="min-h-screen p-4 bg-gray-50">
        <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-lg">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            No Records Found
          </h2>
          <p className="text-gray-600">
            We couldn't find any attendance records for you.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Please check back later or contact support if this persists.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-full mx-auto p-2 sm:p-4 md:p-8 pb-28 animate-fadeIn bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      {renderContent}

      {/* Desktop Navbar (Detached and Translucent) */}
      <div className="hidden md:flex fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white/80 backdrop-blur-lg border border-gray-200/60 rounded-2xl shadow-lg px-9 py-3">
        <div className="flex items-center space-x-5">
          <button
            onClick={() => handleTabChange("home")}
            className={`flex flex-col items-center transition-colors duration-200 ${activeTab === "home"
                ? "text-blue-600"
                : "text-gray-600 hover:text-blue-500"
              }`}
          >
            <Home size={24} />
            <span className="text-xs mt-1">Home</span>
          </button>

          <button
            onClick={() => handleTabChange("courses")}
            className={`flex flex-col items-center transition-colors duration-200 ${activeTab === "courses"
                ? "text-blue-600"
                : "text-gray-600 hover:text-blue-500"
              }`}
          >
            <BookOpen size={24} />
            <span className="text-xs mt-1">Courses</span>
          </button>

          <button
            onClick={() => handleTabChange("quiz")}
            className={`flex flex-col items-center transition-colors duration-200 ${activeTab === "quiz"
                ? "text-blue-600"
                : "text-gray-600 hover:text-blue-500"
              }`}
          >
            <Trophy size={24} />
            <span className="text-xs mt-1">Quiz</span>
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navbar (Improved for touch) */}
      <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl px-2 py-2 transition-all duration-300 max-w-xs w-full">
        <div className="flex justify-between items-center gap-x-2">
          <button
            onClick={() => handleTabChange("home")}
            className={`relative flex flex-col items-center p-3 px-4 rounded-xl transition-all duration-200 active:scale-95 touch-manipulation ${activeTab === "home"
                ? "text-blue-600 bg-white/50 shadow-sm"
                : "text-gray-600 hover:text-blue-500 hover:bg-white/30 active:bg-white/40"
              }`}
          >
            <Home size={22} />
            <span className="text-xs mt-1 font-medium">Home</span>
            {activeTab === "home" && (
              <div className="absolute -bottom-1 w-1 h-1 bg-blue-600 rounded-full"></div>
            )}
          </button>

          <button
            onClick={() => handleTabChange("courses")}
            className={`relative flex flex-col items-center p-3 px-4 rounded-xl transition-all duration-200 active:scale-95 touch-manipulation ${activeTab === "courses"
                ? "text-blue-600 bg-white/50 shadow-sm"
                : "text-gray-600 hover:text-blue-500 hover:bg-white/30 active:bg-white/40"
              }`}
          >
            <BookOpen size={22} />
            <span className="text-xs mt-1 font-medium">Courses</span>
            {activeTab === "courses" && (
              <div className="absolute -bottom-1 w-1 h-1 bg-blue-600 rounded-full"></div>
            )}
          </button>

          <button
            onClick={() => handleTabChange("quiz")}
            className={`relative flex flex-col items-center p-3 px-4 rounded-xl transition-all duration-200 active:scale-95 touch-manipulation ${activeTab === "quiz"
                ? "text-blue-600 bg-white/50 shadow-sm"
                : "text-gray-600 hover:text-blue-500 hover:bg-white/30 active:bg-white/40"
              }`}
          >
            <Trophy size={22} />
            <span className="text-xs mt-1 font-medium">Quiz</span>
            {activeTab === "quiz" && (
              <div className="absolute -bottom-1 w-1 h-1 bg-blue-600 rounded-full"></div>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}

// ----------------------

const QuizStarter = () => {
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [pin, setPin] = useState("");
  const [quizCode, setQuizCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0); // seconds until quiz starts
  const [quizStartTime, setQuizStartTime] = useState<Date | null>(null);

  useEffect(() => {
    setAdmissionNumber(localStorage.getItem("admissionNumber") || "");
    setPin(localStorage.getItem("studentPin") || "");
  }, []);

  useEffect(() => {
    if (countdown <= 0 || !quizStartTime) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((quizStartTime.getTime() - now.getTime()) / 1000);
      setCountdown(diff > 0 ? diff : 0);
    }, 1000);

    return () => clearInterval(interval);
  }, [quizStartTime, countdown]);

const handleSubmit = async (code: string) => {
  setLoading(true);
  setError("");

  try {
    const res = await fetch(
      "https://faas-blr1-8177d592.doserverless.co/api/v1/web/fn-1c23ee6f-939a-44b2-9c4e-d17970ddd644/abes/fetchQuizDetails",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quiz_uc: code,
          user_unique_code: admissionNumber,
          pin: pin,
        }),
      }
    );

    const data = await res.json();
    const quizData = data?.response?.data;
    if (!quizData) throw new Error("Quiz data not found");
    if (
      data?.msg === "Invalid Quiz ID" ||
      !data?.response?.data ||
      data.response.data.length === 0
    ) {
      throw new Error("Invalid Quiz Code. Please try again.");
    }

    const now = new Date();
    const quizStart = new Date(quizData.login_time);
    const quizEnd = new Date(quizData.end_time);

    if (now < quizStart) {
      const secondsLeft = Math.floor((quizStart.getTime() - now.getTime()) / 1000);
      setCountdown(secondsLeft);
      setQuizStartTime(quizStart);
      return;
    }

    if (now >= quizEnd) {
      setError("Quiz has already ended. You cannot attempt it now.");
      return;
    }

    localStorage.setItem("admissionNumber", admissionNumber);
    localStorage.setItem("studentPin", pin);
    localStorage.setItem("quizCode", code);

    const today = new Date().toISOString().split("T")[0];
    const finalId = quizData.cf_id;

    const reqIdPlain = `${today}_${admissionNumber}_${code}_${finalId}`;
    const encodedReqId = btoa(reqIdPlain);

    setTimeout(() => {
      const targetUrl = `https://abesquiz.netlify.app/#/access-quiz?req_id=${encodedReqId}`;
      window.location.href = targetUrl;
    }, 300);
  } catch (err: any) {
    console.error(err);
    setError(err.message || "Something went wrong");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="bg-white rounded-xl p-4 mt-6 shadow">
      <h2 className="text-lg font-semibold mb-0 text-gray-800">Start Quiz</h2>
      <div className="grid gap-4">
        <input
          type="text"
          value={quizCode}
          onChange={(e) => {
            const v = e.target.value.toUpperCase();
            if (v.length <= 4) {
              setQuizCode(v);
              setError("");
            }
          }}
          maxLength={4}
          placeholder="Enter 4-character Quiz Code"
          className={`w-full px-4 py-2 border rounded-md text-center ${error ? "border-red-500" : "border-gray-300"
            }`}
        />

        {error && <p className="text-sm text-red-600 text-center">{error}</p>}

        {countdown > 0 && (
          <p className="text-center text-gray-500">
            Quiz starts in: {Math.floor(countdown / 60)}:
            {String(countdown % 60).padStart(2, "0")}
          </p>
        )}

        <button
          onClick={() => {
            if (quizCode.length === 4) {
              handleSubmit(quizCode);
            } else {
              setError("Please enter a valid 4-digit quiz code");
            }
          }}
          disabled={loading || quizCode.length !== 4 || countdown > 0}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Start Quiz"}
        </button>
      </div>
    </div>
  );
};
