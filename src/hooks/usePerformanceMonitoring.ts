import { useEffect, useRef, useCallback, useState } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  componentName: string;
  timestamp: number;
  memoryUsage?: number;
  props?: Record<string, any>;
}

interface PerformanceConfig {
  enableLogging?: boolean;
  slowRenderThreshold?: number;
  memoryThreshold?: number;
  sampleRate?: number;
}

/**
 * Hook for monitoring component performance and detecting performance issues
 */
export function usePerformanceMonitoring(
  componentName: string,
  config: PerformanceConfig = {}
) {
  const {
    enableLogging = import.meta.env.DEV,
    slowRenderThreshold = 100,
    memoryThreshold = 50 * 1024 * 1024, // 50MB
    sampleRate = 1.0,
  } = config;

  const renderStartTime = useRef<number>(0);
  const renderCount = useRef<number>(0);
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);

  // Start performance measurement
  const startMeasurement = useCallback(() => {
    renderStartTime.current = performance.now();
    renderCount.current += 1;
  }, []);

  // End performance measurement and log results
  const endMeasurement = useCallback((props?: Record<string, any>) => {
    if (Math.random() > sampleRate) return;

    const endTime = performance.now();
    const renderTime = endTime - renderStartTime.current;
    
    // Get memory usage if available
    const memoryUsage = (performance as any).memory?.usedJSHeapSize;

    const metric: PerformanceMetrics = {
      renderTime,
      componentName,
      timestamp: Date.now(),
      memoryUsage,
      props: props ? { ...props } : undefined,
    };

    // Update metrics state
    setMetrics(prev => [...prev.slice(-99), metric]); // Keep last 100 metrics

    // Log performance issues
    if (enableLogging) {
      if (renderTime > slowRenderThreshold) {
        console.warn(
          `🐌 Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`,
          { metric, renderCount: renderCount.current }
        );
      }

      if (memoryUsage && memoryUsage > memoryThreshold) {
        console.warn(
          `🧠 High memory usage detected: ${(memoryUsage / 1024 / 1024).toFixed(2)}MB`,
          { componentName, memoryUsage }
        );
      }

      // Log every 10th render in development
      if (renderCount.current % 10 === 0) {
        console.log(
          `📊 ${componentName} performance (render #${renderCount.current}):`,
          {
            averageRenderTime: metrics.slice(-10).reduce((sum, m) => sum + m.renderTime, 0) / Math.min(10, metrics.length),
            lastRenderTime: renderTime,
            memoryUsage: memoryUsage ? `${(memoryUsage / 1024 / 1024).toFixed(2)}MB` : 'N/A',
          }
        );
      }
    }
  }, [componentName, enableLogging, slowRenderThreshold, memoryThreshold, sampleRate, metrics]);

  // Measure render performance
  useEffect(() => {
    startMeasurement();
    
    return () => {
      endMeasurement();
    };
  });

  return {
    metrics,
    renderCount: renderCount.current,
    startMeasurement,
    endMeasurement,
  };
}

/**
 * Hook for monitoring async operation performance
 */
export function useAsyncPerformanceMonitoring() {
  const [operations, setOperations] = useState<Map<string, number>>(new Map());

  const startOperation = useCallback((operationId: string) => {
    setOperations(prev => new Map(prev).set(operationId, performance.now()));
  }, []);

  const endOperation = useCallback((operationId: string, metadata?: Record<string, any>) => {
    setOperations(prev => {
      const startTime = prev.get(operationId);
      if (!startTime) return prev;

      const duration = performance.now() - startTime;
      
      // Log slow operations
      if (duration > 1000) { // 1 second threshold
        console.warn(`🐌 Slow async operation: ${operationId} took ${duration.toFixed(2)}ms`, metadata);
      }

      const newMap = new Map(prev);
      newMap.delete(operationId);
      return newMap;
    });
  }, []);

  return {
    startOperation,
    endOperation,
    activeOperations: operations.size,
  };
}

/**
 * Hook for monitoring memory usage and detecting memory leaks
 */
export function useMemoryMonitoring(componentName: string) {
  const [memoryStats, setMemoryStats] = useState<{
    initial: number;
    current: number;
    peak: number;
  } | null>(null);

  useEffect(() => {
    if (!(performance as any).memory) {
      return; // Memory API not available
    }

    const initialMemory = (performance as any).memory.usedJSHeapSize;
    let peakMemory = initialMemory;

    setMemoryStats({
      initial: initialMemory,
      current: initialMemory,
      peak: initialMemory,
    });

    const interval = setInterval(() => {
      const currentMemory = (performance as any).memory.usedJSHeapSize;
      peakMemory = Math.max(peakMemory, currentMemory);

      setMemoryStats(prev => prev ? {
        ...prev,
        current: currentMemory,
        peak: peakMemory,
      } : null);

      // Detect potential memory leaks
      const memoryGrowth = currentMemory - initialMemory;
      if (memoryGrowth > 10 * 1024 * 1024) { // 10MB growth
        console.warn(
          `🧠 Potential memory leak in ${componentName}: +${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`,
          {
            initial: `${(initialMemory / 1024 / 1024).toFixed(2)}MB`,
            current: `${(currentMemory / 1024 / 1024).toFixed(2)}MB`,
            growth: `${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`,
          }
        );
      }
    }, 5000); // Check every 5 seconds

    return () => {
      clearInterval(interval);
    };
  }, [componentName]);

  return memoryStats;
}

/**
 * Hook for monitoring bundle size and lazy loading performance
 */
export function useBundleMonitoring() {
  const [loadTimes, setLoadTimes] = useState<Map<string, number>>(new Map());

  const trackChunkLoad = useCallback((chunkName: string) => {
    const startTime = performance.now();
    
    return () => {
      const loadTime = performance.now() - startTime;
      setLoadTimes(prev => new Map(prev).set(chunkName, loadTime));
      
      if (import.meta.env.DEV) {
        console.log(`📦 Chunk loaded: ${chunkName} in ${loadTime.toFixed(2)}ms`);
      }
    };
  }, []);

  return {
    loadTimes,
    trackChunkLoad,
  };
}