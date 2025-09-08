/**
 * Performance monitoring utilities for AdvisorBoard application
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface PerformanceThresholds {
  renderTime: number;
  interactionTime: number;
  apiResponseTime: number;
  memoryUsage: number;
}

export class PerformanceTracker {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private thresholds: PerformanceThresholds;

  constructor(thresholds: Partial<PerformanceThresholds> = {}) {
    this.thresholds = {
      renderTime: 100, // 100ms
      interactionTime: 50, // 50ms
      apiResponseTime: 2000, // 2s
      memoryUsage: 50 * 1024 * 1024, // 50MB
      ...thresholds
    };

    this.initializeObservers();
  }

  private initializeObservers(): void {
    // Observe paint timing
    if ('PerformanceObserver' in window) {
      try {
        const paintObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric({
              name: entry.name,
              value: entry.startTime,
              timestamp: Date.now(),
              metadata: { type: 'paint' }
            });
          }
        });
        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(paintObserver);
      } catch (error) {
        console.warn('Paint observer not supported:', error);
      }

      // Observe navigation timing
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const navEntry = entry as PerformanceNavigationTiming;
            this.recordMetric({
              name: 'navigation-timing',
              value: navEntry.loadEventEnd - navEntry.navigationStart,
              timestamp: Date.now(),
              metadata: {
                type: 'navigation',
                domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.navigationStart,
                firstByte: navEntry.responseStart - navEntry.navigationStart
              }
            });
          }
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navigationObserver);
      } catch (error) {
        console.warn('Navigation observer not supported:', error);
      }

      // Observe resource timing
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const resourceEntry = entry as PerformanceResourceTiming;
            this.recordMetric({
              name: 'resource-load',
              value: resourceEntry.responseEnd - resourceEntry.startTime,
              timestamp: Date.now(),
              metadata: {
                type: 'resource',
                name: resourceEntry.name,
                size: resourceEntry.transferSize,
                cached: resourceEntry.transferSize === 0
              }
            });
          }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
      } catch (error) {
        console.warn('Resource observer not supported:', error);
      }
    }
  }

  /**
   * Record a custom performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    this.checkThresholds(metric);
  }

  /**
   * Measure the execution time of a function
   */
  measureFunction(name: string, fn: () => any, metadata?: Record<string, any>): any {
    const startTime = performance.now();
    const result = fn();
    const endTime = performance.now();

    this.recordMetric({
      name,
      value: endTime - startTime,
      timestamp: Date.now(),
      metadata: { type: 'function-execution', ...metadata }
    });

    return result;
  }

  /**
   * Measure the execution time of an async function
   */
  async measureAsyncFunction(
    name: string, 
    fn: () => Promise<any>, 
    metadata?: Record<string, any>
  ): Promise<any> {
    const startTime = performance.now();
    const result = await fn();
    const endTime = performance.now();

    this.recordMetric({
      name,
      value: endTime - startTime,
      timestamp: Date.now(),
      metadata: { type: 'async-function-execution', ...metadata }
    });

    return result;
  }

  /**
   * Start a performance measurement
   */
  startMeasurement(name: string, metadata?: Record<string, any>): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      this.recordMetric({
        name,
        value: endTime - startTime,
        timestamp: Date.now(),
        metadata: { type: 'manual-measurement', ...metadata }
      });
    };
  }

  /**
   * Measure React component render time
   */
  measureComponentRender(componentName: string): {
    onRenderStart: () => void;
    onRenderEnd: () => void;
  } {
    let startTime: number;

    return {
      onRenderStart: () => {
        startTime = performance.now();
      },
      onRenderEnd: () => {
        const endTime = performance.now();
        this.recordMetric({
          name: `${componentName}-render`,
          value: endTime - startTime,
          timestamp: Date.now(),
          metadata: { type: 'component-render', component: componentName }
        });
      }
    };
  }

  /**
   * Measure user interaction response time
   */
  measureInteraction(interactionType: string, target?: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      this.recordMetric({
        name: `interaction-${interactionType}`,
        value: endTime - startTime,
        timestamp: Date.now(),
        metadata: { 
          type: 'user-interaction', 
          interactionType, 
          target 
        }
      });
    };
  }

  /**
   * Measure API call performance
   */
  measureApiCall(endpoint: string, method: string = 'GET'): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      this.recordMetric({
        name: `api-${method.toLowerCase()}-${endpoint}`,
        value: endTime - startTime,
        timestamp: Date.now(),
        metadata: { 
          type: 'api-call', 
          endpoint, 
          method 
        }
      });
    };
  }

  /**
   * Record memory usage
   */
  recordMemoryUsage(context?: string): void {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      this.recordMetric({
        name: 'memory-usage',
        value: memInfo.usedJSHeapSize,
        timestamp: Date.now(),
        metadata: {
          type: 'memory',
          context,
          totalHeapSize: memInfo.totalJSHeapSize,
          heapSizeLimit: memInfo.jsHeapSizeLimit
        }
      });
    }
  }

  /**
   * Get performance metrics by name
   */
  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter(metric => metric.name === name);
    }
    return [...this.metrics];
  }

  /**
   * Get performance statistics for a metric
   */
  getStatistics(name: string): {
    count: number;
    average: number;
    median: number;
    min: number;
    max: number;
    p95: number;
    p99: number;
  } | null {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return null;

    const values = metrics.map(m => m.value).sort((a, b) => a - b);
    const count = values.length;
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      count,
      average: sum / count,
      median: values[Math.floor(count / 2)],
      min: values[0],
      max: values[count - 1],
      p95: values[Math.floor(count * 0.95)],
      p99: values[Math.floor(count * 0.99)]
    };
  }

  /**
   * Check if metrics exceed thresholds and log warnings
   */
  private checkThresholds(metric: PerformanceMetric): void {
    const { name, value, metadata } = metric;
    
    if (metadata?.type === 'component-render' && value > this.thresholds.renderTime) {
      console.warn(`Slow render detected: ${name} took ${value.toFixed(2)}ms (threshold: ${this.thresholds.renderTime}ms)`);
    }
    
    if (metadata?.type === 'user-interaction' && value > this.thresholds.interactionTime) {
      console.warn(`Slow interaction detected: ${name} took ${value.toFixed(2)}ms (threshold: ${this.thresholds.interactionTime}ms)`);
    }
    
    if (metadata?.type === 'api-call' && value > this.thresholds.apiResponseTime) {
      console.warn(`Slow API call detected: ${name} took ${value.toFixed(2)}ms (threshold: ${this.thresholds.apiResponseTime}ms)`);
    }
    
    if (metadata?.type === 'memory' && value > this.thresholds.memoryUsage) {
      console.warn(`High memory usage detected: ${(value / 1024 / 1024).toFixed(2)}MB (threshold: ${(this.thresholds.memoryUsage / 1024 / 1024).toFixed(2)}MB)`);
    }
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): string {
    return JSON.stringify({
      timestamp: Date.now(),
      metrics: this.metrics,
      statistics: this.getAllStatistics()
    }, null, 2);
  }

  /**
   * Get statistics for all metrics
   */
  getAllStatistics(): Record<string, any> {
    const uniqueNames = [...new Set(this.metrics.map(m => m.name))];
    const statistics: Record<string, any> = {};
    
    uniqueNames.forEach(name => {
      statistics[name] = this.getStatistics(name);
    });
    
    return statistics;
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Cleanup observers
   */
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.clearMetrics();
  }
}

// Global performance tracker instance
export const performanceTracker = new PerformanceTracker();

// React hook for performance monitoring
export const usePerformanceMonitoring = (componentName: string) => {
  const measureRender = () => performanceTracker.measureComponentRender(componentName);
  const measureInteraction = (type: string, target?: string) => 
    performanceTracker.measureInteraction(type, target);
  const recordMemory = (context?: string) => 
    performanceTracker.recordMemoryUsage(context);

  return {
    measureRender,
    measureInteraction,
    recordMemory,
    tracker: performanceTracker
  };
};

// Performance monitoring decorator for class methods
export function measurePerformance(metricName?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const name = metricName || `${target.constructor.name}.${propertyName}`;

    descriptor.value = function (...args: any[]) {
      return performanceTracker.measureFunction(name, () => method.apply(this, args));
    };
  };
}

// Performance monitoring decorator for async class methods
export function measureAsyncPerformance(metricName?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const name = metricName || `${target.constructor.name}.${propertyName}`;

    descriptor.value = async function (...args: any[]) {
      return performanceTracker.measureAsyncFunction(name, () => method.apply(this, args));
    };
  };
}