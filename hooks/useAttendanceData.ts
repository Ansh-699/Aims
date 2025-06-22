import { useState, useEffect, useCallback } from 'react';
import { AttendanceData } from '@/app/types';

interface UseAttendanceDataReturn {
  loading: boolean;
  attendance: AttendanceData | null;
  error: string;
  refetch: () => void;
}

export function useAttendanceData(): UseAttendanceDataReturn {
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState<AttendanceData | null>(null);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    const startTime = Date.now();
    const token = localStorage.getItem("token");
    
    if (!token) {
      setError("No token found. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      
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

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    loading,
    attendance,
    error,
    refetch
  };
}
