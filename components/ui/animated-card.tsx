"use client";
import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
  onClick?: () => void;
}

export function AnimatedCard({ 
  children, 
  className, 
  delay = 0, 
  hover = true,
  onClick 
}: AnimatedCardProps) {
  return (
    <Card
      className={cn(
        "transition-all duration-500 ease-out transform",
        "animate-in slide-in-from-bottom-4 fade-in",
        hover && "hover:scale-105 hover:shadow-xl hover:-translate-y-1",
        "active:scale-95",
        onClick && "cursor-pointer",
        className
      )}
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: 'both'
      }}
      onClick={onClick}
    >
      {children}
    </Card>
  );
}

export function GlassCard({ 
  children, 
  className, 
  delay = 0,
  onClick 
}: AnimatedCardProps) {
  return (
    <div
      className={cn(
        "backdrop-blur-md bg-white/10 dark:bg-gray-800/10 border border-white/20 dark:border-gray-700/20",
        "rounded-xl shadow-xl transition-all duration-500 ease-out transform",
        "animate-in slide-in-from-bottom-4 fade-in",
        "hover:bg-white/20 dark:hover:bg-gray-800/20 hover:scale-105 hover:shadow-2xl hover:-translate-y-1",
        "active:scale-95",
        onClick && "cursor-pointer",
        className
      )}
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: 'both'
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}