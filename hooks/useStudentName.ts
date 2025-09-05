import { useState, useEffect, useRef } from 'react';

// Key to track which user's name is cached
const LAST_ID_KEY = 'lastStudentId';

// Accept string/number fallback (studentId can arrive as number from API) and always coerce to string
export function useStudentName(fallback: string | number | undefined = '') {
  const [studentName, setStudentName] = useState("");
  const prevFallbackRef = useRef<string | null>(null);
  const attemptedFetchRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const currentToken = localStorage.getItem('token');
    const lastAuthToken = localStorage.getItem('lastAuthToken');
    const admissionNumber = localStorage.getItem('admissionNumber');
    const normalizedFallback = fallback !== undefined && fallback !== null ? String(fallback) : '';

    // If token changed or admission number changed, purge stale name
    if ((lastAuthToken && currentToken && lastAuthToken !== currentToken) ||
        (admissionNumber && normalizedFallback && admissionNumber !== normalizedFallback)) {
      localStorage.removeItem('studentName');
    }
    if (normalizedFallback) {
      localStorage.setItem(LAST_ID_KEY, normalizedFallback);
    }
    prevFallbackRef.current = normalizedFallback;
    const stored = localStorage.getItem('studentName');
    const lastId = localStorage.getItem(LAST_ID_KEY);
    if (stored && lastId === normalizedFallback) {
      setStudentName(stored);
    } else if (normalizedFallback) {
      // If fallback looks like a pure numeric id, don't show it as name; leave blank to fetch real name
      if (/^\d+$/.test(normalizedFallback)) {
        setStudentName("");
      } else {
        setStudentName(normalizedFallback);
      }
    } else {
      setStudentName("");
    }
  }, [fallback]);

  // Lazy fetch real student name from quiz endpoint if missing
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (studentName) return; // already have something meaningful
    if (attemptedFetchRef.current) return; // avoid duplicate fetch
    const token = localStorage.getItem('token');
    if (!token) return;
    attemptedFetchRef.current = true;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    fetch('/api/quiz', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal
    })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('quiz fetch failed')))
      .then(data => {
        const first = data?.response?.data?.[0];
        if (first?.student_name) {
          const realName = String(first.student_name).trim();
          if (realName) {
            setStudentName(realName);
            try {
              localStorage.setItem('studentName', realName);
            } catch {}
          }
        }
      })
      .catch(() => {})
      .finally(() => clearTimeout(timeout));

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [studentName]);

  // Listen for external updates (quiz component) and refresh name
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = () => {
      try {
        const stored = localStorage.getItem('studentName');
        if (stored && stored !== studentName) setStudentName(stored);
      } catch {}
    };
    window.addEventListener('student-name-updated', handler);
    return () => window.removeEventListener('student-name-updated', handler);
  }, [studentName]);

  const updateStudentName = (name: string | number) => {
    const coerced = name !== undefined && name !== null ? String(name) : '';
    setStudentName(coerced);
    try {
      localStorage.setItem('studentName', coerced);
      if (fallback !== undefined && fallback !== null && String(fallback).length) {
        localStorage.setItem(LAST_ID_KEY, String(fallback));
      }
    } catch {}
  };

  return { studentName, updateStudentName };
}
