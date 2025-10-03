import { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';

// Global cache to prevent multiple API calls
let globalQuizCache: any = null;
let globalCacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Custom fetcher for SWR
const fetcher = (url: string) => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No token found. Please log in.");
  }

  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(res => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  });
};

export function useQuizData() {
  // Check if we have valid cached data
  const now = Date.now();
  const hasValidCache = globalQuizCache && (now - globalCacheTimestamp) < CACHE_DURATION;

  const { data, error, isLoading } = useSWR(
    hasValidCache ? null : "/api/quiz", // Don't fetch if we have valid cache
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      revalidateOnReconnect: false,
      dedupingInterval: 600000, // 10 minutes
      refreshInterval: 0,
      fallbackData: hasValidCache ? globalQuizCache : undefined,
      onSuccess: (data) => {
        // Update global cache
        globalQuizCache = data;
        globalCacheTimestamp = Date.now();
        
        // Store in sessionStorage as backup
        sessionStorage.setItem("quiz_data", JSON.stringify(data));
        
        // Update localStorage with student info
        if (data?.response?.data?.[0]) {
          const firstRecord = data.response.data[0];
          localStorage.setItem('studentName', firstRecord.student_name);
          localStorage.setItem('admissionNumber', firstRecord.admission_number);
          const pin = firstRecord.quiz_link.match(/pin=([^&]+)/)?.[1] || '';
          localStorage.setItem('pin', pin);
          localStorage.setItem('lastAuthToken', localStorage.getItem('token') || '');
          
          // Dispatch event to notify other components
          window.dispatchEvent(new Event('student-name-updated'));
        }
      }
    }
  );

  // Return cached data if available, otherwise SWR data
  return {
    data: hasValidCache ? globalQuizCache : data,
    error,
    isLoading: hasValidCache ? false : isLoading
  };
}

// Clear cache function for logout
export function clearQuizCache() {
  globalQuizCache = null;
  globalCacheTimestamp = 0;
  sessionStorage.removeItem("quiz_data");
}