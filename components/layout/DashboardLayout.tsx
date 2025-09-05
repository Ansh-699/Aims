import React from 'react';
import { DesktopNavigation } from '../navigation/DesktopNavigation';
import { MobileNavigation } from '../navigation/MobileNavigation';
import { ThemeToggle } from '../ui/theme-toggle';
import { LogoutButton } from './LogoutButton';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function DashboardLayout({ children, activeTab, onTabChange }: DashboardLayoutProps) {
  return (
    <main className="max-w-full mx-auto p-2 sm:p-4 md:p-8 pb-28 animate-fadeIn bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 min-h-screen transition-colors duration-300">
      {/* Theme Toggle Button - positioned in top right */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <ThemeToggle />
        <LogoutButton />
      </div>
      
      {children}
      
      <DesktopNavigation activeTab={activeTab} onTabChange={onTabChange} />
      <MobileNavigation activeTab={activeTab} onTabChange={onTabChange} />
    </main>
  );
}
