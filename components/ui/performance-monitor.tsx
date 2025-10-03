"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, Clock, Zap, TrendingUp } from 'lucide-react';

interface PerformanceMetrics {
  loadTime: number;
  cacheHits: number;
  totalRequests: number;
  errorRate: number;
  lastUpdated: string;
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Listen for performance updates
    const handlePerformanceUpdate = (event: CustomEvent) => {
      setMetrics(event.detail);
    };

    window.addEventListener('performance-update', handlePerformanceUpdate as EventListener);
    
    // Check if we're in development mode to show the monitor
    setIsVisible(process.env.NODE_ENV === 'development');

    return () => {
      window.removeEventListener('performance-update', handlePerformanceUpdate as EventListener);
    };
  }, []);

  if (!isVisible || !metrics) {
    return null;
  }

  const cacheHitRate = metrics.totalRequests > 0 ? (metrics.cacheHits / metrics.totalRequests) * 100 : 0;

  return (
    <Card className="fixed bottom-4 right-4 p-3 bg-white/95 backdrop-blur-sm border shadow-lg z-50 max-w-xs">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium">Performance</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(false)}
          className="h-6 w-6 p-0"
        >
          ×
        </Button>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Load Time</span>
          </div>
          <Badge variant={metrics.loadTime < 2000 ? "default" : "destructive"} className="text-xs">
            {metrics.loadTime}ms
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            <span>Cache Hit Rate</span>
          </div>
          <Badge variant={cacheHitRate > 50 ? "default" : "secondary"} className="text-xs">
            {Math.round(cacheHitRate)}%
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            <span>Error Rate</span>
          </div>
          <Badge variant={metrics.errorRate < 5 ? "default" : "destructive"} className="text-xs">
            {Math.round(metrics.errorRate)}%
          </Badge>
        </div>

        <div className="text-xs text-gray-500 pt-1 border-t">
          Last updated: {new Date(metrics.lastUpdated).toLocaleTimeString()}
        </div>
      </div>
    </Card>
  );
}

// Utility function to emit performance metrics
export function emitPerformanceMetrics(metrics: PerformanceMetrics) {
  window.dispatchEvent(new CustomEvent('performance-update', { detail: metrics }));
}