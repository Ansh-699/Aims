"use client";
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface AttendanceData {
  studentId: number;
  totalPresentAllSubjects: number;
  totalAbsentAllSubjects: number;
  totalLeaveAllSubjects?: number;
  subjects: Record<string, any>;
  cachedAt?: string;
}

interface AttendanceContextType {
  attendanceData: AttendanceData | null;
  isLoading: boolean;
  error: string | null;
  fetchAttendance: (force?: boolean) => Promise<void>;
  clearCache: () => void;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

interface AttendanceProviderProps {
  children: ReactNode;
}

export function AttendanceProvider({ children }: AttendanceProviderProps) {
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendance = useCallback(async (force = false) => {
    // Check if we have cached data and it's less than 5 minutes old
    if (!force && attendanceData && attendanceData.cachedAt) {
      const cacheAge = Date.now() - new Date(attendanceData.cachedAt).getTime();
      const fiveMinutes = 5 * 60 * 1000;
      
      if (cacheAge < fiveMinutes) {
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch("/api/all-attendance", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to fetch attendance data");
      }

      const data = await response.json();
      const cachedData = {
        ...data,
        cachedAt: new Date().toISOString()
      };
      
      setAttendanceData(cachedData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [attendanceData]);

  const clearCache = useCallback(() => {
    setAttendanceData(null);
    setError(null);
  }, []);

  const value: AttendanceContextType = {
    attendanceData,
    isLoading,
    error,
    fetchAttendance,
    clearCache
  };

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const context = useContext(AttendanceContext);
  if (context === undefined) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
}