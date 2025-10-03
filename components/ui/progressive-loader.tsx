"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ProgressiveLoaderProps {
  isLoading: boolean;
  isStale?: boolean;
  progress?: number;
  message?: string;
  children: React.ReactNode;
}

export function ProgressiveLoader({ 
  isLoading, 
  isStale = false, 
  progress, 
  message = "Loading attendance data...", 
  children 
}: ProgressiveLoaderProps) {
  if (!isLoading && !isStale) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Show children with overlay when stale */}
      {isStale && (
        <div className="relative">
          <div className="opacity-75">
            {children}
          </div>
          <div className="absolute top-2 right-2 z-10">
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 animate-pulse">
              Updating...
            </Badge>
          </div>
        </div>
      )}

      {/* Show skeleton when loading */}
      {isLoading && !isStale && (
        <div className="space-y-4">
          {/* Header skeleton */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </Card>
            <Card className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </Card>
          </div>

          {/* Calendar skeleton */}
          <Card className="p-4">
            <div className="flex justify-between items-center mb-4">
              <Skeleton className="h-6 w-32" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>

            {/* Calendar grid skeleton */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </Card>

          {/* Progress indicator */}
          <div className="flex items-center justify-center space-x-2 py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">{message}</span>
            {progress !== undefined && (
              <Badge variant="outline" className="ml-2">
                {Math.round(progress)}%
              </Badge>
            )}
          </div>

          {/* Progress bar */}
          {progress !== undefined && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="w-full space-y-4">
      {/* Stats cards skeleton */}
      <div className="grid grid-cols-2 gap-3">
        {[1, 2].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-12" />
              </div>
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </Card>
        ))}
      </div>

      {/* Calendar skeleton */}
      <Card className="p-4 animate-pulse">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-6 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>

        {/* Weekdays */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center py-2">
              <Skeleton className="h-3 w-8 mx-auto" />
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-12 flex flex-col items-center justify-center">
              <Skeleton className="h-4 w-6 mb-1" />
              <Skeleton className="h-3 w-4" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// Shimmer effect for loading states
export function ShimmerEffect({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]", className)} />
  );
}