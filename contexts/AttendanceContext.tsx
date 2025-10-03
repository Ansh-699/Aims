"use client";
import React, { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from 'react';
import { emitPerformanceMetrics } from '@/components/ui/performance-monitor';

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
  isStale: boolean;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

interface AttendanceProviderProps {
  children: ReactNode;
}

// Request deduplication and caching
class AttendanceCache {
  private static instance: AttendanceCache;
  private cache = new Map<string, { data: AttendanceData; timestamp: number }>();
  private pendingRequests = new Map<string, Promise<AttendanceData>>();
  private readonly CACHE_DURATION = 3 * 60 * 1000; // 3 minutes
  private readonly STALE_DURATION = 1 * 60 * 1000; // 1 minute (when to show stale indicator)

  static getInstance(): AttendanceCache {
    if (!AttendanceCache.instance) {
      AttendanceCache.instance = new AttendanceCache();
    }
    return AttendanceCache.instance;
  }

  getCacheKey(token: string): string {
    // Use a hash of the token for cache key to avoid storing full tokens
    return btoa(token.slice(-20)).slice(0, 10);
  }

  get(token: string): { data: AttendanceData; isStale: boolean } | null {
    const key = this.getCacheKey(token);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    const age = Date.now() - cached.timestamp;
    if (age > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }
    
    return {
      data: cached.data,
      isStale: age > this.STALE_DURATION
    };
  }

  set(token: string, data: AttendanceData): void {
    const key = this.getCacheKey(token);
    this.cache.set(key, {
      data: { ...data, cachedAt: new Date().toISOString() },
      timestamp: Date.now()
    });
  }

  async fetchWithDeduplication(token: string, force = false): Promise<AttendanceData> {
    const key = this.getCacheKey(token);
    
    // Check cache first (unless forced)
    if (!force) {
      const cached = this.get(token);
      if (cached && !cached.isStale) {
        return cached.data;
      }
    }

    // Check if there's already a pending request
    const pending = this.pendingRequests.get(key);
    if (pending) {
      return pending;
    }

    // Create new request
    const request = this.performFetch(token);
    this.pendingRequests.set(key, request);

    try {
      const data = await request;
      this.set(token, data);
      return data;
    } finally {
      this.pendingRequests.delete(key);
    }
  }

  private async performFetch(token: string): Promise<AttendanceData> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
      const response = await fetch("/api/all-attendance", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to fetch attendance data");
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }
}

export function AttendanceProvider({ children }: AttendanceProviderProps) {
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);
  const cache = useRef(AttendanceCache.getInstance());
  const backgroundFetchRef = useRef<NodeJS.Timeout>();
  const performanceRef = useRef({
    requestCount: 0,
    cacheHits: 0,
    errors: 0,
    totalLoadTime: 0
  });

  // Background refresh for stale data
  useEffect(() => {
    if (attendanceData && isStale) {
      // Automatically refresh stale data in background
      backgroundFetchRef.current = setTimeout(() => {
        fetchAttendance(true);
      }, 2000);
    }

    return () => {
      if (backgroundFetchRef.current) {
        clearTimeout(backgroundFetchRef.current);
      }
    };
  }, [isStale, attendanceData]);

  const fetchAttendance = useCallback(async (force = false) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("No authentication token found");
      return;
    }

    // Check cache first for immediate response
    if (!force && !isLoading) {
      const cached = cache.current.get(token);
      if (cached) {
        setAttendanceData(cached.data);
        setIsStale(cached.isStale);
        setError(null);
        
        // If data is stale, fetch in background
        if (cached.isStale) {
          setTimeout(() => fetchAttendance(true), 100);
        }
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const startTime = Date.now();
      const data = await cache.current.fetchWithDeduplication(token, force);
      const loadTime = Date.now() - startTime;
      
      setAttendanceData(data);
      setIsStale(false);
      
      // Update performance metrics
      performanceRef.current.requestCount++;
      performanceRef.current.totalLoadTime += loadTime;
      
      if (data.fromCache) {
        performanceRef.current.cacheHits++;
      }
      
      // Emit performance metrics
      emitPerformanceMetrics({
        loadTime,
        cacheHits: performanceRef.current.cacheHits,
        totalRequests: performanceRef.current.requestCount,
        errorRate: (performanceRef.current.errors / performanceRef.current.requestCount) * 100,
        lastUpdated: new Date().toISOString()
      });
      
    } catch (err: any) {
      performanceRef.current.errors++;
      setError(err.message);
      // Keep existing data on error if available
      if (!attendanceData) {
        setAttendanceData(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, attendanceData]);

  const clearCache = useCallback(() => {
    cache.current.clear();
    setAttendanceData(null);
    setError(null);
    setIsStale(false);
  }, []);

  const value: AttendanceContextType = {
    attendanceData,
    isLoading,
    error,
    fetchAttendance,
    clearCache,
    isStale
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