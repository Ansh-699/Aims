import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

// Key to track which user's name is cached
const LAST_ID_KEY = 'lastStudentId';

export function useStudentName(fallback: string | number | undefined = '') {
  const [studentName, setStudentName] = useState('');
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [pin, setPin] = useState('');
  const prevFallbackRef = useRef<string | null>(null);
  const attemptedFetchRef = useRef(false);
  const pathname = usePathname(); // Get current route

  const loadStudentInfo = () => {
    const cachedName = localStorage.getItem('studentName');
    const cachedAdmission = localStorage.getItem('admissionNumber');
    const cachedPin = localStorage.getItem('pin');
    
    if (cachedName) {
      setStudentName(cachedName);
      setAdmissionNumber(cachedAdmission || '');
      setPin(cachedPin || '');
      attemptedFetchRef.current = true;
    } else if (fallback && typeof fallback === 'string' && !/^\d+$/.test(fallback)) {
      // If fallback is a string name (not a number), use it
      setStudentName(fallback);
      setAdmissionNumber('');
      setPin('');
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

    // Load student info from cache
    loadStudentInfo();

    // Listen for student name updates from other components
    const handleStudentUpdate = () => {
      loadStudentInfo();
    };

    window.addEventListener('student-name-updated', handleStudentUpdate);

    // Cleanup
    return () => {
      window.removeEventListener('student-name-updated', handleStudentUpdate);
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