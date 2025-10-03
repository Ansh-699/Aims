/**
 * Performance monitoring utilities for debugging and optimization
 */

export interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryUsage?: NodeJS.MemoryUsage;
  customMetrics?: Record<string, any>;
}

export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  
  /**
   * Start monitoring a performance metric
   */
  start(key: string, customMetrics?: Record<string, any>): void {
    const startTime = Date.now();
    this.metrics.set(key, {
      startTime,
      memoryUsage: typeof process !== 'undefined' ? process.memoryUsage?.() : undefined,
      customMetrics
    });
  }
  
  /**
   * End monitoring and calculate duration
   */
  end(key: string): PerformanceMetrics | null {
    const metric = this.metrics.get(key);
    if (!metric) {
      console.warn(`Performance metric '${key}' not found`);
      return null;
    }
    
    const endTime = Date.now();
    const updatedMetric = {
      ...metric,
      endTime,
      duration: endTime - metric.startTime,
      memoryUsage: typeof process !== 'undefined' ? process.memoryUsage?.() : undefined
    };
    
    this.metrics.set(key, updatedMetric);
    return updatedMetric;
  }
  
  /**
   * Get a specific metric
   */
  get(key: string): PerformanceMetrics | undefined {
    return this.metrics.get(key);
  }
  
  /**
   * Get all metrics
   */
  getAll(): Record<string, PerformanceMetrics> {
    return Object.fromEntries(this.metrics);
  }
  
  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
  }
  
  /**
   * Log performance summary
   */
  logSummary(key?: string): void {
    if (key) {
      const metric = this.metrics.get(key);
      if (metric) {
        console.log(`[Performance] ${key}:`, {
          duration: metric.duration ? `${metric.duration}ms` : 'In progress',
          memory: metric.memoryUsage ? `${Math.round(metric.memoryUsage.heapUsed / 1024 / 1024)}MB` : 'N/A',
          custom: metric.customMetrics
        });
      }
    } else {
      console.log('[Performance] Summary:', 
        Object.fromEntries(
          Array.from(this.metrics.entries()).map(([k, v]) => [
            k, 
            {
              duration: v.duration ? `${v.duration}ms` : 'In progress',
              memory: v.memoryUsage ? `${Math.round(v.memoryUsage.heapUsed / 1024 / 1024)}MB` : 'N/A'
            }
          ])
        )
      );
    }
  }
}

// Singleton instance for global use
export const performanceMonitor = new PerformanceMonitor();

/**
 * Decorator for timing function execution
 */
export function timed(target: any, propertyName: string, descriptor?: PropertyDescriptor) {
  if (!descriptor) return;
  
  const method = descriptor.value;
  descriptor.value = function (...args: any[]) {
    const key = `${target.constructor.name}.${propertyName}`;
    performanceMonitor.start(key);
    
    try {
      const result = method.apply(this, args);
      
      if (result instanceof Promise) {
        return result.finally(() => {
          performanceMonitor.end(key);
          performanceMonitor.logSummary(key);
        });
      } else {
        performanceMonitor.end(key);
        performanceMonitor.logSummary(key);
        return result;
      }
    } catch (error) {
      performanceMonitor.end(key);
      performanceMonitor.logSummary(key);
      throw error;
    }
  };
}

/**
 * Simple function timer utility
 */
export async function timeFunction<T>(
  fn: () => Promise<T> | T,
  label?: string
): Promise<{ result: T; duration: number }> {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    
    if (label) {
      console.log(`[Timer] ${label}: ${duration}ms`);
    }
    
    return { result, duration };
  } catch (error) {
    const duration = Date.now() - start;
    if (label) {
      console.log(`[Timer] ${label} (failed): ${duration}ms`);
    }
    throw error;
  }
}

/**
 * API response time monitoring middleware
 */
export function withPerformanceLogging(handler: Function, routeName: string) {
  return async function(this: any, ...args: any[]) {
    const start = Date.now();
    const memBefore = typeof process !== 'undefined' ? process.memoryUsage?.() : undefined;
    
    try {
      const result = await handler.apply(this, args);
      const duration = Date.now() - start;
      const memAfter = typeof process !== 'undefined' ? process.memoryUsage?.() : undefined;
      
      console.log(`[API Performance] ${routeName}:`, {
        duration: `${duration}ms`,
        memory: memAfter && memBefore 
          ? `${Math.round((memAfter.heapUsed - memBefore.heapUsed) / 1024)}KB`
          : 'N/A',
        status: 'success'
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      console.log(`[API Performance] ${routeName}:`, {
        duration: `${duration}ms`,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  };
}
