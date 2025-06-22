import React from 'react';
import { DesktopNavigation } from '../navigation/DesktopNavigation';
import { MobileNavigation } from '../navigation/MobileNavigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function DashboardLayout({ children, activeTab, onTabChange }: DashboardLayoutProps) {
  return (
    <main className="max-w-full mx-auto p-2 sm:p-4 md:p-8 pb-28 animate-fadeIn bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      {children}
      
      <DesktopNavigation activeTab={activeTab} onTabChange={onTabChange} />
      <MobileNavigation activeTab={activeTab} onTabChange={onTabChange} />
    </main>
  );
}
