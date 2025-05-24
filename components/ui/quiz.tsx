'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Eye, Calendar, Trophy, CheckCircle, XCircle, Clock, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

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
    if (typeof window === 'undefined') return null;
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const anchor = doc.querySelector('a');
    if (!anchor) return null;

    // Get the raw href (including the '#...?...' fragment)
    const rawHref = anchor.getAttribute('href') || anchor.href;
    // Split off at the '#' to get the fragment part
    const hashParts = rawHref.split('#');
    if (hashParts.length < 2) return null;
    const fragment = hashParts[1];               // e.g. "/quiz-1?foo=bar&pin=7845&..."
    const qIndex = fragment.indexOf('?');
    if (qIndex === -1) return null;
    const queryString = fragment.slice(qIndex + 1);
    const params = new URLSearchParams(queryString);
    return params.get('pin');
}

export default function QuizList() {
    const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
    const [studentName, setStudentName] = useState('');
    // const [admissionNumber, setAdmissionNumber] = useState(''); // Removed as it's not displayed
    // const [pin, setPin] = useState(''); // Removed as it's not displayed
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        (async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('No token found. Please log in.');
                setLoading(false);
                return;
            }
            try {
                const res = await fetch('/api/quiz', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                const list = data.response?.data as QuizItem[] | undefined;
                if (!Array.isArray(list) || list.length === 0) {
                    setError('No quizzes found.');
                    setLoading(false);
                    return;
                }
                setQuizzes(list);

                // Initialize first quiz details
                const first = list[0];
                setStudentName(first.student_name);
                localStorage.setItem('studentName', first.student_name);

                // admissionNumber and pin are still fetched and stored if needed elsewhere, but not set to state for display
                localStorage.setItem('admissionNumber', first.admission_number);
                const pinValue = getPinFromQuizLink(first.quiz_link) || '';
                localStorage.setItem('studentPin', pinValue);

            } catch (err) {
                console.error(err);
                setError('Failed to fetch quizzes.');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // summary stats
    const totalQuizzes = quizzes.length;
    const totalCorrect = useMemo(() => quizzes.reduce((s, q) => s + q.correct, 0), [quizzes]);
    const totalIncorrect = useMemo(() => quizzes.reduce((s, q) => s + q.incorrect, 0), [quizzes]);
    const totalNot = useMemo(() => quizzes.reduce((s, q) => s + q.not_attempted, 0), [quizzes]);
    const averageScore = useMemo(
        () =>
            totalQuizzes
                ? Math.round(quizzes.reduce((s, q) => s + q.marks_obtained, 0) / totalQuizzes)
                : 0,
        [quizzes, totalQuizzes]
    );
    const overallAccuracy = useMemo(
        () => calculateAccuracy(totalCorrect, totalIncorrect, totalNot),
        [totalCorrect, totalIncorrect, totalNot]
    );

    const handlePrevious = () => setCurrentIndex((i) => Math.max(0, i - 1));
    const handleNext = () => setCurrentIndex((i) => Math.min(totalQuizzes - 1, i + 1));

    if (loading) return <LoadingSkeleton />;
    if (error) return <ErrorMessage message={error} />;
    if (totalQuizzes === 0) return <InfoMessage message="No quizzes available at the moment." />;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-0">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-2">
                    <h1 className="text-4xl font-bold text-gray-800 mb-0">Quiz Dashboard</h1>
                    <p className="text-gray-600">
                        Student: {studentName}
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-1 mb-0">
                    <SummaryCard label="Total Quizzes" value={totalQuizzes} icon={<BookOpen className="h-8 w-8 text-blue-600" />} />
                   
                    <SummaryCard
                        label="Overall Accuracy"
                        value={`${overallAccuracy}%`}
                        icon={<CheckCircle className="h-8 w-8 text-green-600" />}
                        valueClass={getScoreColor(overallAccuracy)}
                    />
                </div>

                {/* Quiz Card Carousel */}
                <div className="mt-2">
                    <div className="flex justify-center items-center mb-1">
                        <Button onClick={handlePrevious} disabled={currentIndex === 0} variant="outline" size="icon" className="mr-4">
                            <ChevronLeft className="h-6 w-6" />
                        </Button>

                        <div className="flex-grow flex justify-center min-w-sm px-0">
                            <div className="w-full max-w-lg">
                                {(() => {
                                    const quiz = quizzes[currentIndex];
                                    const acc = calculateAccuracy(quiz.correct, quiz.incorrect, quiz.not_attempted);
                                    const totalQ = quiz.correct + quiz.incorrect + quiz.not_attempted;
                                    return <QuizCard key={currentIndex} quiz={quiz} accuracy={acc} totalQuestions={totalQ} />;
                                })()}
                            </div>
                        </div>

                        <Button
                            onClick={handleNext}
                            disabled={currentIndex === totalQuizzes - 1}
                            variant="outline"
                            size="icon"
                            className="ml-4"
                        >
                            <ChevronRight className="h-6 w-6" />
                        </Button>
                    </div>
                    <p className="text-center text-gray-600">
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
                <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
                        <div className="max-w-7xl mx-auto mb-8">
                                <Skeleton className="h-8 w-64 mb-2" />
                                <Skeleton className="h-4 w-64" /> {/* Adjusted width as less info is shown */}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                                {[...Array(4)].map((_, i) => (
                                        <Card key={i} className="animate-pulse">
                                                <CardContent className="p-6">
                                                        <Skeleton className="h-6 w-32 mb-2" />
                                                        <Skeleton className="h-8 w-16" />
                                                </CardContent>
                                        </Card>
                                ))}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[...Array(3)].map((_, i) => (
                                        <Card key={i} className="animate-pulse">
                                                <CardHeader>
                                                        <Skeleton className="h-6 w-32" />
                                                        <Skeleton className="h-4 w-24" />
                                                </CardHeader>
                                                <CardContent>
                                                        <Skeleton className="h-20 w-full" />
                                                </CardContent>
                                        </Card>
                                ))}
                        </div>
                </div>
        );
}

function ErrorMessage({ message }: { message: string }) {
        return (
                <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
                        <div className="max-w-7xl mx-auto">
                                <Card className="border-red-200 bg-red-50">
                                        <CardContent className="p-6">
                                                <div className="flex items-center space-x-2 text-red-600">
                                                        <XCircle className="h-5 w-5" />
                                                        <span className="font-medium">Error</span>
                                                </div>
                                                <p className="text-red-600 mt-2">{message}</p>
                                        </CardContent>
                                </Card>
                        </div>
                </div>
        );
}

function InfoMessage({ message }: { message: string }) {
        return (
                <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
                        <div className="max-w-7xl mx-auto">
                                <Card className="border-blue-200 bg-blue-50">
                                        <CardContent className="p-6">
                                                <div className="flex items-center space-x-2 text-blue-600">
                                                        <BookOpen className="h-5 w-5" />
                                                        <span className="font-medium">Information</span>
                                                </div>
                                                <p className="text-blue-600 mt-2">{message}</p>
                                        </CardContent>
                                </Card>
                        </div>
                </div>
        );
}


function SummaryCard({ label, value, icon, valueClass = '' }: { label: string; value: string | number; icon: React.ReactNode; valueClass?: string }) {
        return (
                <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                        <CardContent className="p-6 flex items-center justify-between">
                                <div>
                                        <p className="text-sm font-medium text-gray-600">{label}</p>
                                        <p className={`text-3xl font-bold ${valueClass}`}>{value}</p>
                                </div>
                                {icon}
                        </CardContent>
                </Card>
        );
}

function QuizCard({ quiz, accuracy, totalQuestions }: { quiz: QuizItem; accuracy: number; totalQuestions: number }) {
        const quizLinkHref = useMemo(() => {
                if (typeof window === 'undefined') return '#';
                try {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(quiz.quiz_link, 'text/html');
                        const anchor = doc.querySelector('a');
                        return anchor?.href || '#';
                } catch (e) {
                        console.error("Error parsing quiz_link in QuizCard:", e);
                        return '#';
                }
        }, [quiz.quiz_link]);

        return (
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 w-full">
                        <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg font-semibold text-gray-800 truncate">
                                                {quiz.master_course_code}
                                        </CardTitle>
                                        <Button variant="ghost" size="sm" className="shrink-0 text-blue-600" onClick={() => window.open(quizLinkHref, '_blank')} disabled={quizLinkHref === '#'}>
                                                <Eye className="h-4 w-4" />
                                        </Button>
                                </div>
                                <CardDescription className="flex items-center text-sm text-gray-600">
                                        <Calendar className="h-4 w-4 mr-1" />
                                        {formatDate(quiz.loggedin_at)}
                                </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                                <div className="text-center p-4 bg-gray-50 rounded-lg">
                                        <div className={`text-3xl font-bold ${getScoreColor(quiz.marks_obtained)} mb-1`}>{quiz.marks_obtained}%</div>
                                        <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getAccuracyColor(accuracy)}`}>{accuracy}% Accuracy</div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                        <StatBox icon={<CheckCircle className="h-4 w-4 text-green-600" />} label="Correct" value={quiz.correct} bg="bg-green-50" text="text-green-700" />
                                        <StatBox icon={<XCircle className="h-4 w-4 text-red-600" />} label="Incorrect" value={quiz.incorrect} bg="bg-red-50" text="text-red-700" />
                                        <StatBox icon={<Clock className="h-4 w-4 text-gray-600" />} label="Not Attempted" value={quiz.not_attempted} bg="bg-gray-50" text="text-gray-700" colSpan={2} />
                                </div>
                                <div className="text-center text-sm text-gray-600 border-t pt-3">Total Questions: <span className="font-semibold">{totalQuestions}</span></div>
                        </CardContent>
                </Card>
        );
}

function StatBox({ icon, label, value, bg, text, colSpan = 1 }: { icon: React.ReactNode; label: string; value: number; bg: string; text: string; colSpan?: number }) {
        return (
                <div className={`${bg} rounded-lg p-2 ${colSpan > 1 ? 'col-span-2' : ''}`}> <div className="flex items-center space-x-2"> {icon} <div> <p className={`text-xs font-medium ${text}`}>{label}</p> <p className={`text-lg font-bold ${text}`}>{value}</p> </div></div></div>
        );
}

function formatDate(raw: string): string { return new Date(raw).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', }); }
function calculateAccuracy(c: number, i: number, n: number): number { const total = c + i + n; return total > 0 ? Math.round((c / total) * 100) : 0; }
function getScoreColor(score: number): string { if (score >= 80) return 'text-green-600'; if (score >= 60) return 'text-yellow-600'; return 'text-red-600'; }
function getAccuracyColor(acc: number): string { if (acc >= 80) return 'bg-green-100 text-green-800'; if (acc >= 60) return 'bg-yellow-100 text-yellow-800'; return 'bg-red-100 text-red-800'; }

