import React from 'react';
import { Home, BookOpen, Trophy } from 'lucide-react';

interface TabButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function TabButton({ icon, label, isActive, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center transition-colors duration-200 ${
        isActive
          ? "text-blue-600 dark:text-blue-400"
          : "text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400"
      }`}
    >
      {icon}
      <span className="text-xs mt-1">{label}</span>
    </button>
  );
}

interface DesktopNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function DesktopNavigation({ activeTab, onTabChange }: DesktopNavigationProps) {
  return (
    <div className="hidden md:flex fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-gray-200/60 dark:border-gray-700/60 rounded-2xl shadow-lg px-9 py-3 transition-colors duration-300">
      <div className="flex items-center space-x-5">
        <TabButton
          icon={<Home size={24} />}
          label="Home"
          isActive={activeTab === "home"}
          onClick={() => onTabChange("home")}
        />
        <TabButton
          icon={<BookOpen size={24} />}
          label="Courses"
          isActive={activeTab === "courses"}
          onClick={() => onTabChange("courses")}
        />
        <TabButton
          icon={<Trophy size={24} />}
          label="Quiz"
          isActive={activeTab === "quiz"}
          onClick={() => onTabChange("quiz")}
        />
      </div>
    </div>
  );
}