import { useState, useEffect } from 'react';

export function useStudentName(fallback: string = '') {
  const [studentName, setStudentName] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("studentName");
    setStudentName(String(stored || fallback || "U"));
  }, [fallback]);

  const updateStudentName = (name: string) => {
    setStudentName(name);
    localStorage.setItem("studentName", name);
  };

  return {
    studentName,
    updateStudentName
  };
}
