import React from 'react';
import { Home, BookOpen, Trophy } from 'lucide-react';

interface MobileTabButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function MobileTabButton({ icon, label, isActive, onClick }: MobileTabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center p-3 px-4 rounded-xl transition-all duration-200 active:scale-95 touch-manipulation ${
        isActive
          ? "text-blue-600 bg-white/50 shadow-sm"
          : "text-gray-600 hover:text-blue-500 hover:bg-white/30 active:bg-white/40"
      }`}
    >
      {icon}
      <span className="text-xs mt-1 font-medium">{label}</span>
      {isActive && (
        <div className="absolute -bottom-1 w-1 h-1 bg-blue-600 rounded-full"></div>
      )}
    </button>
  );
}

interface MobileNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function MobileNavigation({ activeTab, onTabChange }: MobileNavigationProps) {
  return (
    <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl px-2 py-2 transition-all duration-300 max-w-xs w-full">
      <div className="flex justify-between items-center gap-x-2">
        <MobileTabButton
          icon={<Home size={22} />}
          label="Home"
          isActive={activeTab === "home"}
          onClick={() => onTabChange("home")}
        />
        <MobileTabButton
          icon={<BookOpen size={22} />}
          label="Courses"
          isActive={activeTab === "courses"}
          onClick={() => onTabChange("courses")}
        />
        <MobileTabButton
          icon={<Trophy size={22} />}
          label="Quiz"
          isActive={activeTab === "quiz"}
          onClick={() => onTabChange("quiz")}
        />
      </div>
    </div>
  );
}
