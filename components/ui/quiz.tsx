"use client";

import React, { useEffect, useState, useMemo, useCallback, memo } from "react";
import useSWR from "swr";
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
  BarChart3,
  ListFilter,
  Medal,
  Star
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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

// Fetch function with timeout and retry logic
const fetchWithRetry = async (
  url: string,
  options: RequestInit,
  retries = 3,
  timeout = 5000
) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    return response.json();
  } catch (err) {
    if (retries > 0 && err instanceof Error && err.name === "AbortError") {
      console.log(`Request timed out, retrying... (${retries} attempts left)`);
      return fetchWithRetry(url, options, retries - 1, timeout);
    }
    throw err;
  }
};

// Custom fetcher for SWR
const fetcher = (url: string) => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No token found. Please log in.");
  }

  return fetchWithRetry(
    url,
    { headers: { Authorization: `Bearer ${token}` } },
    3,
    8000 // Increased timeout for initial load
  );
};

export default function QuizList() {
  const [studentName, setStudentName] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSubjectIndex, setCurrentSubjectIndex] = useState(0); // Add this new state
  const [viewMode, setViewMode] = useState<"all" | "best">("all");

  // Using SWR for data fetching with automatic caching and revalidation
  const { data, error, isLoading } = useSWR("/api/quiz", fetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    dedupingInterval: 300000, // 5 minutes
    onSuccess: (data) => {
      // Store the data in sessionStorage as a cache backup
      sessionStorage.setItem("quiz_data", JSON.stringify(data));
    },
    fallbackData: (() => {
      // Try to load from sessionStorage first
      try {
        const cached = sessionStorage.getItem("quiz_data");
        return cached ? JSON.parse(cached) : undefined;
      } catch (e) {
        return undefined;
      }
    })(),
  });

  // Process the quiz data with useMemo for performance
  const quizzes = useMemo(() => {
    if (!data?.response?.data) return [];

    const list = data.response.data as QuizItem[];

    // Sort by date (most recent first)
    return [...list].sort(
      (a, b) => new Date(b.loggedin_at).getTime() - new Date(a.loggedin_at).getTime()
    );
  }, [data]);

  // Group quizzes by subject and find best scores
  const subjectBestScores = useMemo(() => {
    if (!quizzes.length) return [];
    
    // Group by subject code
    const subjectGroups: Record<string, QuizItem[]> = {};
    
    quizzes.forEach(quiz => {
      const subjectCode = quiz.master_course_code;
      if (!subjectGroups[subjectCode]) {
        subjectGroups[subjectCode] = [];
      }
      subjectGroups[subjectCode].push(quiz);
    });
    
    // Find best quiz for each subject
    return Object.entries(subjectGroups).map(([subject, quizList]) => {
      // Sort by marks (highest first)
      const sortedQuizzes = [...quizList].sort((a, b) => 
        b.marks_obtained - a.marks_obtained
      );
      
      const bestQuiz = sortedQuizzes[0];
      const avgScore = Math.round(
        sortedQuizzes.reduce((sum, q) => sum + q.marks_obtained, 0) / sortedQuizzes.length
      );
      
      const totalCorrect = sortedQuizzes.reduce((sum, q) => sum + q.correct, 0);
      const totalIncorrect = sortedQuizzes.reduce((sum, q) => sum + q.incorrect, 0);
      const totalNotAttempted = sortedQuizzes.reduce((sum, q) => sum + q.not_attempted, 0);
      
      const overallAccuracy = calculateAccuracy(
        totalCorrect, totalIncorrect, totalNotAttempted
      );
      
      return {
        subject,
        bestQuiz,
        quizCount: quizList.length,
        avgScore,
        overallAccuracy,
      };
    }).sort((a, b) => b.bestQuiz.marks_obtained - a.bestQuiz.marks_obtained);
  }, [quizzes]);

  // Extend subjectBestScores to include top 5 quizzes per subject
  const subjectTopScores = useMemo(() => {
    if (!quizzes.length) return [];
    
    // Group by subject code
    const subjectGroups: Record<string, QuizItem[]> = {};
    
    quizzes.forEach(quiz => {
      const subjectCode = quiz.master_course_code;
      if (!subjectGroups[subjectCode]) {
        subjectGroups[subjectCode] = [];
      }
      subjectGroups[subjectCode].push(quiz);
    });
    
    // Get top 5 quizzes for each subject
    return Object.entries(subjectGroups).map(([subject, quizList]) => {
      // Sort by marks (highest first)
      const sortedQuizzes = [...quizList].sort((a, b) => 
        b.marks_obtained - a.marks_obtained
      );
      
      // Take top 5 (or fewer if there aren't 5)
      const topQuizzes = sortedQuizzes.slice(0, 5);
      
      const avgScore = Math.round(
        quizList.reduce((sum, q) => sum + q.marks_obtained, 0) / quizList.length
      );
      
      const totalCorrect = quizList.reduce((sum, q) => sum + q.correct, 0);
      const totalIncorrect = quizList.reduce((sum, q) => sum + q.incorrect, 0);
      const totalNotAttempted = quizList.reduce((sum, q) => sum + q.not_attempted, 0);
      
      const overallAccuracy = calculateAccuracy(
        totalCorrect, totalIncorrect, totalNotAttempted
      );
      
      return {
        subject,
        topQuizzes,
        quizCount: quizList.length,
        avgScore,
        overallAccuracy,
      };
    }).sort((a, b) => b.topQuizzes[0].marks_obtained - a.topQuizzes[0].marks_obtained);
  }, [quizzes]);

  // Save student info when data is loaded
  useEffect(() => {
    if (quizzes.length > 0) {
      const first = quizzes[0];
      setStudentName(first.student_name);

      localStorage.setItem("studentName", first.student_name);
      localStorage.setItem("admissionNumber", first.admission_number);

      const pinValue = getPinFromQuizLink(first.quiz_link) || "";
      localStorage.setItem("studentPin", pinValue);
    }
  }, [quizzes]);

  // Pre-calculate stats with useMemo for better performance
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

  // Navigation handlers with useCallback to prevent unnecessary re-renders
  const handlePrevious = useCallback(() => setCurrentIndex((i) => Math.max(0, i - 1)), []);
  const handleNext = useCallback(() => setCurrentIndex((i) => Math.min(totalQuizzes - 1, i + 1)), [totalQuizzes]);

  // Add these new navigation handlers for subjects
  const handlePreviousSubject = useCallback(
    () => setCurrentSubjectIndex((i) => Math.max(0, i - 1)),
    []
  );
  
  const handleNextSubject = useCallback(
    () => setCurrentSubjectIndex((i) => Math.min(subjectTopScores.length - 1, i + 1)),
    [subjectTopScores.length]
  );

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorMessage message={error.message || "An error occurred while loading quizzes."} />;
  if (totalQuizzes === 0)
    return <InfoMessage message="No quizzes available at the moment." />;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 px-4 pt-6 pb-2 min-h-[calc(80vh-5rem)] ">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-1">
            Quiz Dashboard
          </h1>
          <p className="text-gray-600">Student: {studentName}</p>
        </div>

        {/* View Toggle Buttons */}
        <div className="flex w-full border rounded-lg overflow-hidden mb-6">
          <Button
            variant={viewMode === "all" ? "default" : "ghost"}
            className={`flex-1 rounded-none ${viewMode === "all" ? "bg-blue-600" : "hover:bg-gray-100"}`}
            onClick={() => setViewMode("all")}
          >
            <BookOpen className="h-4 w-4 mr-2" /> All Quizzes
          </Button>
          <Button
            variant={viewMode === "best" ? "default" : "ghost"}
            className={`flex-1 rounded-none ${viewMode === "best" ? "bg-blue-600" : "hover:bg-gray-100"}`}
            onClick={() => setViewMode("best")}
          >
            <Trophy className="h-4 w-4 mr-2" /> Best Scores
          </Button>
        </div>

        {viewMode === "all" ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-4 mb-6">
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
            <div className="flex justify-center w-full">
              <div className="w-full max-w-md">
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
                    <MemoizedQuizCard
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

            <p className="text-center text-sm text-gray-600 mt-4 px-4 max-w-full overflow-hidden">
              Showing quiz {currentIndex + 1} of {totalQuizzes}
            </p>
          </>
        ) : (
          <>
            {/* Best Scores View */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-4 mb-6">
                <SummaryCard
                  label="Subjects"
                  value={subjectTopScores.length}
                  icon={<BookOpen className="h-8 w-8 text-indigo-600" />}
                />
                <SummaryCard
                  label="Best Score"
                  value={subjectTopScores.length > 0 ? 
                    `${subjectTopScores[0].topQuizzes[0].marks_obtained}` : "0"}
                  icon={<Trophy className="h-8 w-8 text-amber-600" />}
                  valueClass="text-amber-600"
                />
              </div>

              {/* Replace multiple cards with single scrollable card */}
              <div className="flex justify-center w-full">
                <div className="w-full max-w-md">
                  {subjectTopScores.length > 0 && (
                    <>
                      <TopScoresCard
                        key={subjectTopScores[currentSubjectIndex].subject}
                        subjectData={subjectTopScores[currentSubjectIndex]}
                        rank={currentSubjectIndex + 1}
                        currentIndex={currentSubjectIndex}
                        totalSubjects={subjectTopScores.length}
                        onPrevious={handlePreviousSubject}
                        onNext={handleNextSubject}
                      />
                      <p className="text-center text-sm text-gray-600 mt-4">
                        Showing subject {currentSubjectIndex + 1} of {subjectTopScores.length}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------- Subcomponents & Helpers ----------

function LoadingSkeleton() {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 px-4 pt-6 pb-2 min-h-[calc(80vh-5rem)]">
      <div className="max-w-7xl mx-auto">
        {/* Header Skeleton */}
        <div className="mb-6">
          <Skeleton className="h-10 w-3/4 sm:w-1/2 mb-2" />
          <Skeleton className="h-4 w-1/2 sm:w-1/3" />
        </div>

        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-4 mb-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="animate-pulse bg-white/70 rounded-xl">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <Skeleton className="h-4 w-24 mb-2 rounded" />
                  <Skeleton className="h-6 w-16 rounded" />
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
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

// Memoized components for better performance
const MemoizedErrorMessage = memo(ErrorMessage);
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

const MemoizedInfoMessage = memo(InfoMessage);
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

const MemoizedSummaryCard = memo(SummaryCard);
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

// Performance-optimized QuizCard with memoization
const QuizCard = memo(function QuizCard({
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
  // Calculate link only once with useMemo
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

  // Cache formatted date
  const formattedDate = useMemo(() => formatDate(quiz.loggedin_at), [quiz.loggedin_at]);

  // Cache score and accuracy colors
  const scoreColorClass = useMemo(() => getScoreColor(quiz.marks_obtained), [quiz.marks_obtained]);
  const accuracyColorClass = useMemo(() => getAccuracyColor(accuracy), [accuracy]);

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
          {formattedDate}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1 sm:space-y-4">
        <div className="text-center p-0 sm:p-2 bg-gray-50 rounded-lg">
          <div
            className={`text-2xl sm:text-3xl font-bold ${scoreColorClass} mb-1`}
          >
            {quiz.marks_obtained} Marks
          </div>
          <div
            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${accuracyColorClass}`}
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
});

const MemoizedQuizCard = memo(QuizCard);

// Optimize StatBox with memoization
const StatBox = memo(function StatBox({
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
});

// New component to display subject best scores
const SubjectScoreCard = memo(function SubjectScoreCard({
  subjectData,
  rank
}: {
  subjectData: {
    subject: string;
    bestQuiz: QuizItem;
    quizCount: number;
    avgScore: number;
    overallAccuracy: number;
  };
  rank: number;
}) {
  const { subject, bestQuiz, quizCount, avgScore, overallAccuracy } = subjectData;
  
  // Format dates
  const formattedDate = formatDate(bestQuiz.loggedin_at);
  
  // Calculate accuracy for best quiz
  const bestQuizAccuracy = calculateAccuracy(
    bestQuiz.correct,
    bestQuiz.incorrect,
    bestQuiz.not_attempted
  );
  
  // Get color classes
  const scoreColorClass = getScoreColor(bestQuiz.marks_obtained);
  const accuracyColorClass = getAccuracyTextColor(bestQuizAccuracy);
  
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-md hover:shadow-lg transition-all">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center 
              ${rank === 1 ? 'bg-amber-100 text-amber-800' : 
                rank === 2 ? 'bg-slate-100 text-slate-800' : 
                rank === 3 ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'}`}>
              <span className="text-sm font-bold">{rank}</span>
            </div>
            <CardTitle className="text-base font-medium text-gray-800">
              {subject}
            </CardTitle>
          </div>
          <Badge variant={rank <= 3 ? "default" : "outline"} className="text-xs">
            {quizCount} {quizCount === 1 ? 'quiz' : 'quizzes'}
          </Badge>
        </div>
        <CardDescription className="flex items-center text-xs text-gray-600">
          <Calendar className="h-3 w-3 mr-1" /> Best score on {formattedDate}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-1 bg-blue-50 rounded-lg p-2 text-center">
            <p className="text-xs font-medium text-blue-700">Best</p>
            <p className={`text-lg font-bold ${scoreColorClass}`}>
              {bestQuiz.marks_obtained}
            </p>
          </div>
          
          <div className="col-span-1 bg-purple-50 rounded-lg p-2 text-center">
            <p className="text-xs font-medium text-purple-700">Average</p>
            <p className={`text-lg font-bold ${getScoreColor(avgScore)}`}>
              {avgScore}
            </p>
          </div>
          
          <div className="col-span-1 bg-green-50 rounded-lg p-2 text-center">
            <p className="text-xs font-medium text-green-700">Accuracy</p>
            <p className={`text-lg font-bold ${accuracyColorClass}`}>
              {bestQuizAccuracy}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// Updated TopScoresCard with navigation buttons
const TopScoresCard = memo(function TopScoresCard({
  subjectData,
  rank,
  currentIndex,
  totalSubjects,
  onPrevious,
  onNext
}: {
  subjectData: {
    subject: string;
    topQuizzes: QuizItem[];
    quizCount: number;
    avgScore: number;
    overallAccuracy: number;
  };
  rank: number;
  currentIndex: number;
  totalSubjects: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const { subject, topQuizzes, quizCount, avgScore, overallAccuracy } = subjectData;
  
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-md hover:shadow-lg transition-all relative">
      {/* Add navigation buttons */}
      <Button
        onClick={onPrevious}
        disabled={currentIndex === 0}
        variant="outline"
        size="icon"
        className="absolute left-2 top-1/3 transform -translate-y-1/2 z-10 h-8 w-8 shadow-md"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Button
        onClick={onNext}
        disabled={currentIndex === totalSubjects - 1}
        variant="outline"
        size="icon"
        className="absolute right-2 top-1/3 transform -translate-y-1/2 z-10 h-8 w-8 shadow-md"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center 
              ${rank === 1 ? 'bg-amber-100 text-amber-800' : 
                rank === 2 ? 'bg-slate-100 text-slate-800' : 
                rank === 3 ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'}`}>
              <span className="text-sm font-bold">{rank}</span>
            </div>
            <CardTitle className="text-base font-medium text-gray-800">
              {subject}
            </CardTitle>
          </div>
          <Badge variant={rank <= 3 ? "default" : "outline"} className="text-xs">
            {quizCount} {quizCount === 1 ? 'quiz' : 'quizzes'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="mb-3">
          <div className="flex justify-between items-center text-sm mb-2">
            <span className="font-medium text-indigo-700">Your Top Scores</span>
            <span className="text-gray-500 text-xs">Out of 10</span>
          </div>
          
          {/* List of top 5 scores */}
          <div className="space-y-2">
            {topQuizzes.map((quiz, idx) => {
              const totalQuestions = quiz.correct + quiz.incorrect + quiz.not_attempted;
              const outOf = Math.max(10, totalQuestions); // Assuming max score is 100 if not provided
              
              return (
                <div 
                  key={idx} 
                  className={`flex items-center justify-between p-2 rounded-md ${
                    idx === 0 ? 'bg-amber-50' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center 
                      ${idx === 0 ? 'bg-amber-200 text-amber-800' : 
                        idx === 1 ? 'bg-gray-200 text-gray-800' : 
                        idx === 2 ? 'bg-orange-200 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                      <span className="text-xs font-bold">{idx + 1}</span>
                    </div>
                    <div>
                      <span className={`font-semibold ${getScoreColor(quiz.marks_obtained)}`}>
                        {quiz.marks_obtained}/{outOf}
                      </span>
                      <div className="text-xs text-gray-500">
                        {formatDate(quiz.loggedin_at)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <div className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                      {quiz.correct} correct
                    </div>
                    <div className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                      {quiz.incorrect} wrong
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Placeholder for missing scores */}
            {Array.from({ length: Math.max(0, 5 - topQuizzes.length) }).map((_, idx) => (
              <div 
                key={`empty-${idx}`} 
                className="flex items-center justify-center p-2 rounded-md bg-gray-50 border border-dashed border-gray-200 text-gray-400 text-sm"
              >
                No more quiz attempts
              </div>
            ))}
          </div>
        </div>
        
        {/* Average stats */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-purple-600" />
            <div>
              <p className="text-xs text-gray-600">Average Score</p>
              <p className={`text-sm font-bold ${getScoreColor(avgScore)}`}>{avgScore}/100</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-xs text-gray-600">Accuracy</p>
              <p className={`text-sm font-bold ${getAccuracyTextColor(overallAccuracy)}`}>{overallAccuracy}%</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// Helper function to get text color for accuracy (without background)
function getAccuracyTextColor(acc: number): string {
  if (acc >= 80) return "text-green-700";
  if (acc >= 60) return "text-yellow-700";
  return "text-red-700";
}

// Badge component
function Badge({ 
  children, 
  variant = "default",
  className = ""
}: { 
  children: React.ReactNode; 
  variant?: "default" | "outline";
  className?: string;
}) {
  const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
  
  const variantClasses = {
    default: "bg-indigo-100 text-indigo-800",
    outline: "bg-white border border-gray-200 text-gray-700"
  };
  
  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
}

// Utility functions
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
