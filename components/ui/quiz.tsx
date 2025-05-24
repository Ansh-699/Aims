"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Eye,
  Calendar,
  Trophy,
  CheckCircle,
  XCircle,
  Clock,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface QuizItem {
  master_course_code: string;
  student_name: string;
  admission_number: string;
  marks_obtained: number;
  correct: number;
  incorrect: number;
  not_attempted: number;
  loggedin_at: string;
  quiz_link: string;
}

// Updated helper to parse pin that appears inside the fragment (#…?pin=…)
function getPinFromQuizLink(htmlString: string): string | null {
  if (typeof window === "undefined") return null;
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");
  const anchor = doc.querySelector("a");
  if (!anchor) return null;

  const rawHref = anchor.getAttribute("href") || anchor.href;
  const hashParts = rawHref.split("#");
  if (hashParts.length < 2) return null;
  const fragment = hashParts[1];
  const qIndex = fragment.indexOf("?");
  if (qIndex === -1) return null;
  const queryString = fragment.slice(qIndex + 1);
  const params = new URLSearchParams(queryString);
  return params.get("pin");
}

export default function QuizList() {
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No token found. Please log in.");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/quiz", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          throw new Error(`API request failed with status ${res.status}`);
        }
        const data = await res.json();
        const list = data.response?.data as QuizItem[] | undefined;
        if (!Array.isArray(list) || list.length === 0) {
          setError("No quizzes found.");
          setLoading(false);
          return;
        }
        setQuizzes(list);

        const first = list[0];
        setStudentName(first.student_name);
        localStorage.setItem("studentName", first.student_name);
        localStorage.setItem("admissionNumber", first.admission_number);
        const pinValue = getPinFromQuizLink(first.quiz_link) || "";
        localStorage.setItem("studentPin", pinValue);
      } catch (err) {
        console.error(err);
        setError(
          `Failed to fetch quizzes. ${err instanceof Error ? err.message : ""}`
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalQuizzes = quizzes.length;
  const totalCorrect = useMemo(
    () => quizzes.reduce((s, q) => s + q.correct, 0),
    [quizzes]
  );
  const totalIncorrect = useMemo(
    () => quizzes.reduce((s, q) => s + q.incorrect, 0),
    [quizzes]
  );
  const totalNot = useMemo(
    () => quizzes.reduce((s, q) => s + q.not_attempted, 0),
    [quizzes]
  );
  const averageScore = useMemo(
    () =>
      totalQuizzes
        ? Math.round(
            quizzes.reduce((s, q) => s + q.marks_obtained, 0) / totalQuizzes
          )
        : 0,
    [quizzes, totalQuizzes]
  );
  const overallAccuracy = useMemo(
    () => calculateAccuracy(totalCorrect, totalIncorrect, totalNot),
    [totalCorrect, totalIncorrect, totalNot]
  );

  const handlePrevious = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const handleNext = () =>
    setCurrentIndex((i) => Math.min(totalQuizzes - 1, i + 1));

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorMessage message={error} />;
  if (totalQuizzes === 0)
    return <InfoMessage message="No quizzes available at the moment." />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-1">
            Quiz Dashboard
          </h1>
          <p className="text-gray-600">Student: {studentName}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <SummaryCard
            label="Total Quizzes"
            value={totalQuizzes}
            icon={<BookOpen className="h-8 w-8 text-blue-600" />}
          />
          <SummaryCard
            label="Overall Accuracy"
            value={`${overallAccuracy}%`}
            icon={<CheckCircle className="h-8 w-8 text-green-600" />}
            valueClass={getScoreColor(overallAccuracy)}
          />
        </div>

        {/* Quiz Card Carousel */}
        <div className="mt-6 md:mt-8 min-w-full">
          <div className="flex justify-center w-full max-w-lg mx-auto">
            <div className="w-full max-w-lg sm:max-w-sm md:max-w-md">
              {(() => {
                const quiz = quizzes[currentIndex];
                const acc = calculateAccuracy(
                  quiz.correct,
                  quiz.incorrect,
                  quiz.not_attempted
                );
                const totalQ =
                  quiz.correct + quiz.incorrect + quiz.not_attempted;
                return (
                  <QuizCard
                    key={currentIndex}
                    quiz={quiz}
                    accuracy={acc}
                    totalQuestions={totalQ}
                    currentIndex={currentIndex}
                    totalQuizzes={totalQuizzes}
                    onPrevious={handlePrevious}
                    onNext={handleNext}
                  />
                );
              })()}
            </div>
          </div>
          <p className="text-center text-sm text-gray-600 mt-3">
            Showing quiz {currentIndex + 1} of {totalQuizzes}
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------- Subcomponents & Helpers ----------

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Skeleton */}
        <div className="mb-6">
          <Skeleton className="h-10 w-3/4 sm:w-1/2 mb-2" />
          <Skeleton className="h-4 w-1/2 sm:w-1/3" />
        </div>

        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="animate-pulse bg-white/70">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <Skeleton className="h-5 w-24 mb-2" />
                  <Skeleton className="h-8 w-12" />
                </div>
                <Skeleton className="h-8 w-8" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quiz Card Carousel Skeleton */}
        <div className="mt-6 md:mt-8">
          <div className="flex justify-center w-full max-w-2xl mx-auto">
            <Card className="animate-pulse w-full max-w-xs sm:max-w-sm md:max-w-md bg-white/80">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-3/5" />
                  <Skeleton className="h-7 w-7" />
                </div>
                <Skeleton className="h-4 w-2/5 mt-1" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full col-span-2" />
                </div>
                <Skeleton className="h-5 w-1/2 mx-auto" />
              </CardContent>
            </Card>
          </div>
          <Skeleton className="h-4 w-28 mx-auto mt-3" />
        </div>
      </div>
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 flex items-center justify-center">
      <div className="max-w-md w-full">
        <Card className="border-red-200 bg-red-50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 text-red-700">
              <XCircle className="h-6 w-6" />
              <span className="text-lg font-semibold">Error</span>
            </div>
            <p className="text-red-600 mt-3 ml-9">{message}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoMessage({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 flex items-center justify-center">
      <div className="max-w-md w-full">
        <Card className="border-blue-200 bg-blue-50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 text-blue-700">
              <BookOpen className="h-6 w-6" />
              <span className="text-lg font-semibold">Information</span>
            </div>
            <p className="text-blue-600 mt-3 ml-9">{message}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  valueClass = "",
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className={`text-3xl font-bold ${valueClass || "text-gray-800"}`}>
            {value}
          </p>
        </div>
        {icon}
      </CardContent>
    </Card>
  );
}

function QuizCard({
  quiz,
  accuracy,
  totalQuestions,
  currentIndex,
  totalQuizzes,
  onPrevious,
  onNext,
}: {
  quiz: QuizItem;
  accuracy: number;
  totalQuestions: number;
  currentIndex: number;
  totalQuizzes: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const quizLinkHref = useMemo(() => {
    if (typeof window === "undefined") return "#";
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(quiz.quiz_link, "text/html");
      const anchor = doc.querySelector("a");
      return anchor?.href || "#";
    } catch (e) {
      console.error("Error parsing quiz_link in QuizCard:", e);
      return "#";
    }
  }, [quiz.quiz_link]);

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 w-full relative">
      <Button
        onClick={onPrevious}
        disabled={currentIndex === 0}
        variant="outline"
        size="icon"
        className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 h-8 w-8 shadow-md"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <Button
        onClick={onNext}
        disabled={currentIndex === totalQuizzes - 1}
        variant="outline"
        size="icon"
        className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 h-8 w-8 shadow-md"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg font-semibold text-gray-800 truncate pr-2">
            {quiz.master_course_code}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 text-blue-600 px-2"
            onClick={() => window.open(quizLinkHref, "_blank")}
            disabled={quizLinkHref === "#"}
          >
            <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
        <CardDescription className="flex items-center text-xs sm:text-sm text-gray-600 mt-1">
          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
          {formatDate(quiz.loggedin_at)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1 sm:space-y-4">
        <div className="text-center p-0 sm:p-2 bg-gray-50 rounded-lg">
          <div
            className={`text-2xl sm:text-3xl font-bold ${getScoreColor(
              quiz.marks_obtained
            )} mb-1`}
          >
            {quiz.marks_obtained} Marks
          </div>
          <div
            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getAccuracyColor(
              accuracy
            )}`}
          >
            {accuracy}% Accuracy
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 p-3">
          <StatBox
            icon={<CheckCircle className="h-4 w-4 text-green-600" />}
            label="Correct"
            value={quiz.correct}
            bg="bg-green-50"
            text="text-green-700"
          />
          <StatBox
            icon={<XCircle className="h-4 w-4 text-red-600" />}
            label="Incorrect"
            value={quiz.incorrect}
            bg="bg-red-50"
            text="text-red-700"
          />
        </div>
        <div className="text-center text-xs sm:text-sm text-gray-600 border-t pt-2 sm:pt-3">
          Total Questions:{" "}
          <span className="font-semibold">{totalQuestions}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function StatBox({
  icon,
  label,
  value,
  bg,
  text,
  colSpan = 1,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  bg: string;
  text: string;
  colSpan?: number;
}) {
  return (
    <div className={`${bg} rounded-lg p-2 ${colSpan > 1 ? "col-span-2" : ""}`}>
      <div className="flex items-center space-x-1.5 sm:space-x-2">
        {icon}
        <div>
          <p className={`text-xs font-medium ${text}`}>{label}</p>
          <p className={`text-base sm:text-lg font-bold ${text}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}

function formatDate(raw: string): string {
  return new Date(raw).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function calculateAccuracy(c: number, i: number, n: number): number {
  const total = c + i + n;
  return total > 0 ? Math.round((c / total) * 100) : 0;
}
function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  return "text-red-600";
}
function getAccuracyColor(acc: number): string {
  if (acc >= 80) return "bg-green-100 text-green-800";
  if (acc >= 60) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
}
