import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { usePathname } from 'next/navigation'; // For Next.js App Router

// Key to track which user's name is cached
const LAST_ID_KEY = 'lastStudentId';

export function useStudentName(fallback: string | number | undefined = '') {
  const [studentName, setStudentName] = useState('');
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [pin, setPin] = useState('');
  const prevFallbackRef = useRef<string | null>(null);
  const attemptedFetchRef = useRef(false);
  const pathname = usePathname(); // Get current route

  const fetchStudentInfo = async (token: string | null) => {
    if (!token) {
      setStudentName('');
      setAdmissionNumber('');
      setPin('');
      localStorage.removeItem('studentName');
      localStorage.removeItem('admissionNumber');
      localStorage.removeItem(LAST_ID_KEY);
      attemptedFetchRef.current = false;
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
        const newName = String(firstRecord.student_name).trim();
        const newAdmissionNumber = String(firstRecord.admission_number).trim();
        const newPin = firstRecord.quiz_link.match(/pin=([^&]+)/)?.[1] || 'Not found';

        setStudentName(newName);
        setAdmissionNumber(newAdmissionNumber);
        setPin(newPin);

        try {
          localStorage.setItem('studentName', newName);
          localStorage.setItem('admissionNumber', newAdmissionNumber);
          localStorage.setItem('pin', newPin);
          if (fallback !== undefined && fallback !== null) {
            localStorage.setItem(LAST_ID_KEY, String(fallback));
          }
          localStorage.setItem('lastAuthToken', token);
        } catch (error) {
          console.error('Failed to save to localStorage:', error);
        }
      } else {
        setStudentName('');
        setAdmissionNumber('');
        setPin('');
      }
    } catch (error) {
      console.error('Failed to fetch student info:', error);
      setStudentName('');
      setAdmissionNumber('');
      setPin('');
    } finally {
      attemptedFetchRef.current = true;
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const currentToken = localStorage.getItem('token');
    const lastAuthToken = localStorage.getItem('lastAuthToken');
    const normalizedFallback = fallback !== undefined && fallback !== null ? String(fallback) : '';

    // Clear stale data if token or fallback changed
    if (
      (lastAuthToken && currentToken && lastAuthToken !== currentToken) ||
      (prevFallbackRef.current && normalizedFallback && prevFallbackRef.current !== normalizedFallback)
    ) {
      localStorage.removeItem('studentName');
      localStorage.removeItem('admissionNumber');
      localStorage.removeItem('pin');
      localStorage.removeItem(LAST_ID_KEY);
      attemptedFetchRef.current = false;
    }

    prevFallbackRef.current = normalizedFallback;

    const storedName = localStorage.getItem('studentName');
    const storedAdmissionNumber = localStorage.getItem('admissionNumber');
    const storedPin = localStorage.getItem('pin');
    const lastId = localStorage.getItem(LAST_ID_KEY);

    if (storedName && lastId === normalizedFallback && currentToken === lastAuthToken) {
      setStudentName(storedName);
      setAdmissionNumber(storedAdmissionNumber || '');
      setPin(storedPin || '');
    } else if (normalizedFallback && !/^\d+$/.test(normalizedFallback)) {
      setStudentName(normalizedFallback);
      setAdmissionNumber('');
      setPin('');
    } else {
      setStudentName('');
      setAdmissionNumber('');
      setPin('');
    }

    // Fetch data if no valid name or on root route
    if ((!studentName || pathname === '/') && !attemptedFetchRef.current) {
      fetchStudentInfo(currentToken);
    }

    // Listen for auth changes
    const handleAuthChange = () => {
      const newToken = localStorage.getItem('token');
      attemptedFetchRef.current = false; // Allow refetch on auth change
      fetchStudentInfo(newToken);
    };

    window.addEventListener('authChange', handleAuthChange);

    // Cleanup
    return () => {
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, [studentName, pathname, fallback]); // Depend on pathname and fallback

  const updateStudentName = (name: string | number) => {
    const coerced = name !== undefined && name !== null ? String(name) : '';
    setStudentName(coerced);
    try {
      localStorage.setItem('studentName', coerced);
      if (fallback !== undefined && fallback !== null && String(fallback).length) {
        localStorage.setItem(LAST_ID_KEY, String(fallback));
      }
    } catch (error) {
      console.error('Failed to update localStorage:', error);
    }
  };

  return { studentName, admissionNumber, pin, updateStudentName };
}