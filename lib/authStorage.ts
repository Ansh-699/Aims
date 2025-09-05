// Centralized helpers to manage authentication-related storage

const LOCAL_KEYS = [
  'token',
  'studentName',
  'admissionNumber',
  'studentPin',
  'quizCode',
  'course_map'
];

const SESSION_KEYS = [
  'attendance_data',
  'attendance_timestamp',
  'quiz_data'
];

export function clearAuthStorage() {
  try {
    LOCAL_KEYS.forEach(k => localStorage.removeItem(k));
    SESSION_KEYS.forEach(k => sessionStorage.removeItem(k));
  } catch (e) {
    // ignore
  }
}

export interface SeedExtra {
  studentId?: string | number;
  batch?: string;
  section?: string;
  branch?: string;
  studentName?: string;
}

export function seedAuthStorage(token: string, admissionNumber: string, extra: SeedExtra = {}) {
  try {
    localStorage.setItem('token', token);
    localStorage.setItem('admissionNumber', admissionNumber);
    if (extra.studentId) localStorage.setItem('studentId', String(extra.studentId));
    if (extra.batch) localStorage.setItem('batch', extra.batch);
    if (extra.section) localStorage.setItem('section', extra.section);
    if (extra.branch) localStorage.setItem('branch', extra.branch);
    if (extra.studentName) localStorage.setItem('studentName', extra.studentName);
  } catch (e) {
    // ignore
  }
}

export function broadcastAuthReset() {
  try {
    window.dispatchEvent(new Event('clear-attendance-cache'));
    window.dispatchEvent(new Event('clear-quiz-cache'));
  } catch {}
}
