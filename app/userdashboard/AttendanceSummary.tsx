import React, { useEffect, useState } from "react";
import { PieChart, Clock, Award } from "lucide-react";
import { getStatusColor, getStatusLabel } from "../utils/statusHelpers";

interface AttendanceSummaryProps {
    totalPresent: number;
    totalClasses: number;
    overallPercentage: string;
}

export default function AttendanceSummary({
    totalPresent,
    totalClasses,
    overallPercentage,
}: AttendanceSummaryProps) {
    const [animatedPercent, setAnimatedPercent] = useState(0);
    const [targetPercent, setTargetPercent] = useState(parseFloat(overallPercentage));
    const [calcResult, setCalcResult] = useState<{
        days: number;
        lectures: number;
        type: "need" | "leave";
    } | null>(null);

    const percentValue = parseFloat(overallPercentage);
    const { textColor, bgColor, gradientFrom, gradientTo } = getStatusColor(percentValue);
    const statusLabel = getStatusLabel(percentValue);

    // Animate initial percentage
    useEffect(() => {
        const timer = setTimeout(() => setAnimatedPercent(percentValue), 200);
        return () => clearTimeout(timer);
    }, [percentValue]);

    // Recalculate lectures/days whenever target, present or total changes
    useEffect(() => {
        const P = totalPresent;
        const T = totalClasses;
        const target = targetPercent / 100;
        const current = P / T;

        let lectures: number;
        let days: number;
        let type: "need" | "leave";

        if (target > current) {
            // Number of additional lectures needed to hit target
            const x = (target * T - P) / (1 - target);
            lectures = Math.ceil(x);
            days = Math.ceil(lectures / 8);
            type = "need";
        } else {
            // Number of lectures that can be skipped and still maintain target
            const x = (P - target * T) / target;
            lectures = Math.floor(x);
            days = Math.floor(lectures / 8);
            type = "leave";
        }

        setCalcResult({ days, lectures, type });
    }, [targetPercent, totalPresent, totalClasses]);

    const handleScroll = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTargetPercent(parseFloat(e.target.value));
    };

    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden md:col-span-2 transition-all duration-300 hover:shadow-lg border border-gray-200 group">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 flex justify-between items-center">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                    <PieChart className="h-5 w-5 text-blue-600" />
                    Overall Attendance
                </h3>
                <span className="text-sm text-gray-600 flex items-center gap-1 bg-white px-3 py-1 rounded-full shadow-sm">
                    <Clock className="h-3.5 w-3.5" />
                    Last updated today
                </span>
            </div>

            {/* Content */}
            <div className="p-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    {/* Donut Chart */}
                    <div className="relative w-40 h-40">
                        <svg viewBox="0 0 120 120" className="w-full h-full">
                            <defs>
                                <linearGradient id="attendanceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor={gradientFrom} />
                                    <stop offset="100%" stopColor={gradientTo} />
                                </linearGradient>
                            </defs>
                            <circle
                                cx="60"
                                cy="60"
                                r="54"
                                fill="none"
                                stroke="#e6e6e6"
                                strokeWidth="12"
                            />
                            <circle
                                cx="60"
                                cy="60"
                                r="54"
                                fill="none"
                                stroke="url(#attendanceGradient)"
                                strokeWidth="12"
                                strokeDasharray={`${(animatedPercent * 339.292) / 100} 339.292`}
                                strokeLinecap="round"
                                transform="rotate(-90 60 60)"
                                className="transition-all duration-1000 ease-out"
                            />
                            <text
                                x="60"
                                y="55"
                                dominantBaseline="middle"
                                textAnchor="middle"
                                fontSize="22"
                                fontWeight="bold"
                                fill={textColor}
                            >
                                {animatedPercent.toFixed(1)}%
                            </text>
                            <text
                                x="60"
                                y="75"
                                dominantBaseline="middle"
                                textAnchor="middle"
                                fontSize="10"
                                fill="#718096"
                            >
                                Attendance
                            </text>
                        </svg>
                    </div>

                    {/* Stats & Slider */}
                    <div className="flex-1 w-full space-y-5">
                        {/* Present/Total */}
                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-600">Present / Total Classes</span>
                                <span className="font-medium text-gray-800">
                                    {totalPresent}/{totalClasses}
                                </span>
                            </div>
                            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${bgColor} transition-all duration-1000 ease-out`}
                                    style={{ width: `${animatedPercent}%` }}
                                />
                            </div>
                        </div>

                        {/* Status */}
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${bgColor} bg-opacity-20`}> 
                                    <Award className={`h-5 w-5 ${textColor}`} />
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Status</div>
                                    <div className={`font-semibold ${textColor}`}>{statusLabel}</div>
                                </div>
                            </div>
                        </div>

                        {/* Slider & Calculation */}
                        <div className="space-y-4 pt-4">
                            <div className="w-full">
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={targetPercent}
                                    onChange={handleScroll}
                                    className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>0%</span>
                                    <span>100%</span>
                                </div>
                            </div>
                            <span className="text-sm text-gray-600">
                                🎯 Target Attendance: <span className="font-semibold">{targetPercent.toFixed(1)}%</span>
                            </span>

                            {calcResult && (
                                <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-100 transition-all duration-300">
                                    {calcResult.type === "need" ? (
                                        <>
                                            To maintain <strong>{targetPercent.toFixed(1)}%</strong> attendance, you must attend{' '}
                                            <strong>{calcResult.lectures}</strong> more lectures (<strong>{calcResult.days}</strong> days).
                                        </>
                                    ) : (
                                        <>
                                            To keep <strong>{targetPercent.toFixed(1)}%</strong> attendance, you can miss{' '}
                                            <strong>{calcResult.lectures}</strong> lectures (<strong>{calcResult.days}</strong> days).
                                        </>
                                    )}
                                </p>
                            )}
                        </div>

                        {/* Advice */}
                        <p className="text-sm text-gray-600 italic">
                            {percentValue >= 75
                                ? "You're doing great! Keep up the good attendance."
                                : percentValue >= 50
                                ? "Your attendance needs some improvement. Try not to miss any more classes."
                                : "Your attendance is critically low. Please attend all upcoming classes."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}