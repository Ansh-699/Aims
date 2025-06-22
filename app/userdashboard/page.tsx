"use client";

import React from "react";
import LoadingState from "./LoadingState";
import ErrorState from "./ErrorState";
import { useAttendanceData } from "@/hooks/useAttendanceData";
import { useTabNavigation } from "@/hooks/useTabNavigation"; 
import { useStudentName } from "@/hooks/useStudentName";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { EmptyAttendanceState } from "@/components/layout/EmptyAttendanceState";

export default function DashboardPage() {
  // Custom hooks for data and state management
  const { loading, attendance, error } = useAttendanceData();
  const { activeTab, handleTabChange } = useTabNavigation("home");
  const { studentName } = useStudentName(attendance?.studentId);

  // Early returns for loading and error states
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!attendance || attendance.dailyAttendance.length === 0) {
    return <EmptyAttendanceState />;
  }

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={handleTabChange}>
      <DashboardContent 
        activeTab={activeTab}
        attendance={attendance}
        studentName={studentName}
      />
    </DashboardLayout>
  );
}
