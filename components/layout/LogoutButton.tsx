"use client";
import React, { useCallback } from 'react';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { clearQuizCache } from '@/hooks/useQuizData';

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = useCallback(() => {
  try {
  const localKeys = ['token','studentName','admissionNumber','studentPin','quizCode','course_map','studentId','batch','section','branch','lastStudentId','lastAuthToken'];
    const sessionKeys = ['attendance_data','attendance_timestamp','quiz_data'];
    localKeys.forEach(k => localStorage.removeItem(k));
    sessionKeys.forEach(k => sessionStorage.removeItem(k));
    
    // Clear the global quiz cache
    clearQuizCache();
    
    window.dispatchEvent(new Event('clear-attendance-cache'));
    window.dispatchEvent(new Event('clear-quiz-cache'));
  } catch {}
    // Small delay to ensure events propagate before navigation
    setTimeout(() => {
      router.replace('/');
      // Optional hard reload to guarantee fresh state
      setTimeout(() => window.location.reload(), 50);
    }, 10);
  }, [router]);

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 px-3 py-2 rounded-md bg-red-500/90 hover:bg-red-600 text-white text-sm font-medium shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400 transition-colors"
      aria-label="Logout"
    >
      <LogOut size={16} />
      <span className="hidden sm:inline">Logout</span>
    </button>
  );
}
