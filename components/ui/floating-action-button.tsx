"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FloatingActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label?: string;
  className?: string;
  loading?: boolean;
}

export function FloatingActionButton({ 
  onClick, 
  icon, 
  label, 
  className,
  loading = false 
}: FloatingActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={loading}
      className={cn(
        "fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-2xl",
        "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
        "border-2 border-white/20 backdrop-blur-sm",
        "transition-all duration-300 ease-out transform",
        "hover:scale-110 hover:shadow-3xl hover:-translate-y-1",
        "active:scale-95",
        "animate-in slide-in-from-bottom-8 fade-in duration-700",
        loading && "animate-spin",
        className
      )}
      title={label}
    >
      <div className={cn(
        "transition-transform duration-300",
        loading && "animate-spin"
      )}>
        {icon}
      </div>
    </Button>
  );
}