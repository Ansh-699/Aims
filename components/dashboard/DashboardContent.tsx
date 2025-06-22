import React from 'react';
import { AttendanceData } from '@/app/types';
import { HomeTabContent } from './HomeTabContent';
import { CoursesTabContent } from './CoursesTabContent';
import { QuizTabContent } from './QuizTabContent';

interface DashboardContentProps {
  activeTab: string;
  attendance: AttendanceData;
  studentName: string;
}

export function DashboardContent({ activeTab, attendance, studentName }: DashboardContentProps) {
  switch (activeTab) {
    case "home":
      return <HomeTabContent attendance={attendance} studentName={studentName} />;
    
    case "courses":
      return <CoursesTabContent attendance={attendance} />;
    
    case "quiz":
      return <QuizTabContent />;
    
    default:
      return <HomeTabContent attendance={attendance} studentName={studentName} />;
  }
}
