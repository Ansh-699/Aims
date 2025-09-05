import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface HeaderProps {
  loading?: boolean;
}

export function DashboardHeader({ loading = false }: HeaderProps) {
  const [studentInfo, setStudentInfo] = useState<{
    student_name: string;
    admission_number: string;
    pin: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStudentInfo() {
      setIsLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        setError('No authentication token found');
        setIsLoading(false);
        return;
      }

      try {
        const response = await axios.get('/api/quiz', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const quizData = response.data;

        if (quizData.response && quizData.response.data && quizData.response.data.length > 0) {
          const firstRecord = quizData.response.data[0];
          const info = {
            student_name: firstRecord.student_name,
            admission_number: firstRecord.admission_number,
            pin: firstRecord.quiz_link.match(/pin=([^&]+)/)?.[1] || 'Not found',
          };
          setStudentInfo(info);
        } else {
          setError('No quiz data available');
        }
      } catch (error: unknown) {
        let message = 'Failed to fetch student info';
        if (axios.isAxiosError(error)) {
          message = error.response?.data?.error || error.message || message;
        } else if (error instanceof Error) {
          message = error.message;
        } else if (typeof error === 'string') {
          message = error;
        } else {
          message = String(error);
        }
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStudentInfo();
  }, []);

  const nameStr = studentInfo?.student_name || '';
  const initial = nameStr ? nameStr.charAt(0).toUpperCase() : 'U';

  return (
    <div className="flex flex-col md:flex-row items-start justify-between py-1 mb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 mb-2">
          Student Dashboard
        </h1>
        <p className="text-gray-600 dark:text-white text-sm sm:text-base">
          Track your attendance and academic progress
        </p>
      </div>
      <div className="flex items-center bg-white dark:bg-gray-800 shadow-md rounded-xl px-3 sm:px-4 py-2 border border-gray-200 dark:border-gray-700 mt-4 md:mt-0 transition-colors duration-300">
        <div className="mr-2 sm:mr-3 bg-gradient-to-br from-blue-500 to-purple-600 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-xs sm:text-sm">
            {isLoading || loading ? '…' : initial}
          </span>
        </div>
        <div>
          <div className="text-xs sm:text-sm text-gray-500 dark:text-white"></div>
          <div className="font-semibold text-gray-800 dark:text-gray-200 text-sm sm:text-base">
            {isLoading || loading ? 'Loading...' : (nameStr || 'Unknown')}
          </div>
          {studentInfo && (
            <div className="text-xs sm:text-sm text-gray-500 dark:text-white">
             {studentInfo.admission_number} 
            </div>
          )}
          {error && (
            <div className="text-xs sm:text-sm text-red-500 dark:text-red-400">
              Error: {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}