"use client";
import { useState, useEffect } from "react";
import { User, PieChart, BarChart, Calendar, CheckCircle, BookOpen } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("No token found. Please log in again.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.message || "Failed to fetch attendance");

        setAttendance(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Simulate loading for demo purposes
    setTimeout(() => {
      fetchData();
    }, 1500);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="p-10 rounded-xl shadow-lg bg-white w-full max-w-md transition-all duration-500">
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32 mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-gray-800 border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl text-gray-500 font-medium">0%</span>
              </div>
            </div>
            <p className="text-lg font-medium text-gray-700 mb-2">Loading your data</p>
            <p className="text-sm text-gray-500">Please wait while we fetch your attendance records</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md border-l-4 border-red-500 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-red-500 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-circle"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{error}</p>
            <button 
              className="mt-4 px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const {
    dailyAttendance,
    totalPresent,
    totalClasses,
    overallPercentage,
    batch,
    section,
    branch,
    studentId,
  } = attendance;

  if (!dailyAttendance || dailyAttendance.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No Records Found</CardTitle>
            <CardDescription>We couldn't find any attendance records for you.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Please check back later or contact support if this issue persists.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const percentValue = parseInt(overallPercentage) || 0;

  return (
    <main className="max-w-6xl mx-auto p-6 md:p-8 animate-fade-in">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">Student Dashboard</h1>
          <p className="text-gray-500">View your attendance statistics and records</p>
        </div>
        <div className="flex items-center mt-4 md:mt-0 bg-gray-100 p-3 rounded-lg">
          <User className="h-5 w-5 text-gray-700 mr-2" />
          <span className="font-medium text-gray-800">{studentId}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Student Info Card */}
       <Card className="hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-200">
  <CardHeader className="bg-gray-50">
    <CardTitle className="flex items-center gap-2 text-gray-800 text-base sm:text-lg">
      <User className="h-5 w-5" />
      Student Information
    </CardTitle>
  </CardHeader>
  <CardContent className="pt-6 pb-4 px-4 sm:px-6">
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap justify-between text-sm sm:text-base">
        <span className="text-gray-500">Branch</span>
        <span className="font-medium text-gray-800">{branch}</span>
      </div>
      <div className="flex flex-wrap justify-between text-sm sm:text-base">
        <span className="text-gray-500">Batch</span>
        <span className="font-medium text-gray-800">{batch}</span>
      </div>
      <div className="flex flex-wrap justify-between text-sm sm:text-base">
        <span className="text-gray-500">Section</span>
        <span className="font-medium text-gray-800">{section}</span>
      </div>
    </div>
  </CardContent>
</Card>


        {/* Overall Attendance Card */}
        <Card className="hover:shadow-lg transition-all duration-300 overflow-hidden md:col-span-2">
          <CardHeader className="bg-gray-50">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <PieChart className="h-5 w-5" />
              Overall Attendance
            </CardTitle>
            <CardDescription>Your attendance across all courses</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center mb-4">
              <div className="relative w-24 h-24 mr-6">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e6e6e6"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={percentValue >= 75 ? "#4ade80" : percentValue >= 50 ? "#facc15" : "#f87171"}
                    strokeWidth="3"
                    strokeDasharray={`${percentValue}, 100`}
                    className="transition-all duration-1000 ease-out"
                  />
                  <text x="18" y="20.5" textAnchor="middle" fontSize="8" fill="gray" fontWeight="bold">{percentValue}%</text>
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-700 font-medium">Present/Total</span>
                  <span className="text-gray-700 font-medium">{totalPresent}/{totalClasses}</span>
                </div>
                <Progress value={percentValue} className="h-2" />
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className={`${percentValue >= 75 ? "text-green-600" : percentValue >= 50 ? "text-yellow-600" : "text-red-600"} font-medium`}>
                {percentValue >= 75 ? "Good Standing" : percentValue >= 50 ? "Needs Attention" : "Critical"}
              </span>
              <span className="text-gray-500">Updated today</span>
            </div>
          </CardContent>
        </Card>
      </div>
    

      {/* Daily Attendance Table */}
     <Card className="hover:shadow-lg transition-all duration-300 border rounded-xl overflow-hidden">
  <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
      <div className="space-y-1">
        <CardTitle className="text-lg font-semibold flex items-center gap-2 text-gray-800">
          <BarChart className="h-5 w-5 text-purple-600" />
          Course-wise Attendance
        </CardTitle>
        <CardDescription className="text-gray-600">
          Detailed breakdown by subject
        </CardDescription>
      </div>
      <div className="flex items-center px-3 py-1.5 rounded-full bg-white border text-sm font-medium text-gray-700 shadow-sm">
        <Calendar className="h-4 w-4 mr-2 text-purple-500" />
        Current Semester
      </div>
    </div>
  </CardHeader>

  <CardContent className="p-0">
    <Table className="hidden sm:table">
      <TableHeader className="bg-gray-50">
        <TableRow>
          <TableHead className="w-[35%] pl-6">Course</TableHead>
          <TableHead className="text-center">Present</TableHead>
          <TableHead className="text-center">Total</TableHead>
          <TableHead className="text-center pr-6">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {dailyAttendance.map((item: any, i: number) => {
          const percentNum = parseInt(item.percent) || 0;
          const status = percentNum >= 75 ? 'safe' : percentNum >= 50 ? 'warning' : 'critical';
          return (
            <TableRow 
              key={i} 
              className="hover:bg-gray-50 transition-colors group"
            >
              <TableCell className="pl-6 font-medium text-gray-800">
                {item.course}
              </TableCell>
              <TableCell className="text-center text-gray-600">
                <div className="flex items-center justify-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  {item.present}
                </div>
              </TableCell>
              <TableCell className="text-center text-gray-600">
                <div className="flex items-center justify-center gap-1">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                  {item.total}
                </div>
              </TableCell>
              <TableCell className="pr-6">
                <div className="flex items-center justify-center">
                  <div className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2
                    ${status === 'safe' ? 'bg-green-100 text-green-800' : 
                      status === 'warning' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'}`}
                  >
                    <div className={`h-2 w-2 rounded-full 
                      ${status === 'safe' ? 'bg-green-600' : 
                        status === 'warning' ? 'bg-yellow-600' : 
                        'bg-red-600'}`}
                    />
                    {item.percent}
                  </div>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>

    {/* Mobile View */}
    <div className="sm:hidden space-y-4 p-4">
      {dailyAttendance.map((item: any, i: number) => {
        const percentNum = parseInt(item.percent) || 0;
        const status = percentNum >= 75 ? 'safe' : percentNum >= 50 ? 'warning' : 'critical';
        return (
          <div key={i} className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-medium text-gray-800">{item.course}</h3>
              <div className={`px-2.5 py-1 rounded-full text-xs flex items-center gap-1
                ${status === 'safe' ? 'bg-green-100 text-green-800' : 
                  status === 'warning' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-red-100 text-red-800'}`}
              >
                <div className={`h-2 w-2 rounded-full 
                  ${status === 'safe' ? 'bg-green-600' : 
                    status === 'warning' ? 'bg-yellow-600' : 
                    'bg-red-600'}`}
                />
                {item.percent}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Present
                </span>
                <span className="font-medium">{item.present}</span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 flex items-center gap-1">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                  Total Classes
                </span>
                <span className="font-medium">{item.total}</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">Progress:</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${status === 'safe' ? 'bg-green-500' : 
                      status === 'warning' ? 'bg-yellow-500' : 
                      'bg-red-500'}`}
                    style={{ width: item.percent }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </CardContent>
</Card>
    </main>
  );
}