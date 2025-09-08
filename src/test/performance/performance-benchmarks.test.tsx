import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Performance monitoring utilities
class PerformanceMonitor {
  private measurements: Map<string, number[]> = new Map();

  startMeasurement(name: string): () => number {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (!this.measurements.has(name)) {
        this.measurements.set(name, []);
      }
      
      this.measurements.get(name)!.push(duration);
      return duration;
    };
  }

  getAverageTime(name: string): number {
    const times = this.measurements.get(name) || [];
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  }

  getMedianTime(name: string): number {
    const times = this.measurements.get(name) || [];
    if (times.length === 0) return 0;
    
    const sorted = [...times].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  }

  getPercentile(name: string, percentile: number): number {
    const times = this.measurements.get(name) || [];
    if (times.length === 0) return 0;
    
    const sorted = [...times].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    
    return sorted[Math.max(0, index)];
  }

  reset(): void {
    this.measurements.clear();
  }

  getAllMeasurements(): Record<string, { avg: number; median: number; p95: number; p99: number }> {
    const results: Record<string, any> = {};
    
    for (const [name] of this.measurements) {
      results[name] = {
        avg: this.getAverageTime(name),
        median: this.getMedianTime(name),
        p95: this.getPercentile(name, 95),
        p99: this.getPercentile(name, 99)
      };
    }
    
    return results;
  }
}

// Mock heavy components for performance testing
const createMockAdvisors = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `advisor-${i}`,
    name: `Dr. Test Advisor ${i}`,
    expertise: `Expertise ${i}`,
    background: `Background information for advisor ${i}`.repeat(10),
    domain: 'cliniboard' as const,
    isSelected: false
  }));
};

describe('Performance Benchmarks', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
    vi.clearAllMocks();
  });

  describe('Component Rendering Performance', () => {
    it('should render landing page within performance budget', async () => {
      const { default: LandingPage } = await import('../../components/landing/LandingPage');
      const { default: ThemeProvider } = await import('../../components/common/ThemeProvider');
      
      const mockDomains = [
        { id: 'cliniboard', name: 'Cliniboard', description: 'Clinical', advisors: [] },
        { id: 'eduboard', name: 'EduBoard', description: 'Education', advisors: [] },
        { id: 'remediboard', name: 'RemediBoard', description: 'Remedies', advisors: [] }
      ];

      // Run multiple iterations for accurate measurement
      const iterations = 10;
      
      for (let i = 0; i < iterations; i++) {
        const endMeasurement = monitor.startMeasurement('landing-page-render');
        
        const { unmount } = render(
          <ThemeProvider>
            <LandingPage domains={mockDomains} onDomainSelect={() => {}} />
          </ThemeProvider>
        );
        
        endMeasurement();
        unmount();
      }

      const avgTime = monitor.getAverageTime('landing-page-render');
      const p95Time = monitor.getPercentile('landing-page-render', 95);

      // Performance budgets (in milliseconds)
      expect(avgTime).toBeLessThan(50); // Average render time should be under 50ms
      expect(p95Time).toBeLessThan(100); // 95th percentile should be under 100ms

      console.log(`Landing Page Render Performance:
        Average: ${avgTime.toFixed(2)}ms
        95th Percentile: ${p95Time.toFixed(2)}ms`);
    });

    it('should render advisor selection with many advisors efficiently', async () => {
      const { default: AdvisorSelectionPanel } = await import('../../components/advisors/AdvisorSelectionPanel');
      const { default: ThemeProvider } = await import('../../components/common/ThemeProvider');
      
      const manyAdvisors = createMockAdvisors(50);
      const mockDomain = {
        id: 'cliniboard' as const,
        name: 'Cliniboard',
        description: 'Clinical trials',
        theme: { primary: 'blue' },
        advisors: manyAdvisors
      };

      const iterations = 5;
      
      for (let i = 0; i < iterations; i++) {
        const endMeasurement = monitor.startMeasurement('advisor-selection-many-advisors');
        
        const { unmount } = render(
          <ThemeProvider>
            <AdvisorSelectionPanel 
              domain={mockDomain}
              onAdvisorSelect={() => {}}
              onProceed={() => {}}
              selectedAdvisors={[]}
            />
          </ThemeProvider>
        );
        
        endMeasurement();
        unmount();
      }

      const avgTime = monitor.getAverageTime('advisor-selection-many-advisors');
      const p95Time = monitor.getPercentile('advisor-selection-many-advisors', 95);

      expect(avgTime).toBeLessThan(200); // Should handle 50 advisors under 200ms
      expect(p95Time).toBeLessThan(400);

      console.log(`Advisor Selection (50 advisors) Performance:
        Average: ${avgTime.toFixed(2)}ms
        95th Percentile: ${p95Time.toFixed(2)}ms`);
    });
  });

  describe('Bundle Size Performance', () => {
    it('should have reasonable component bundle sizes', async () => {
      // This test would typically be run with a bundler analyzer
      // For now, we'll test that components can be imported efficiently
      
      const startTime = performance.now();
      
      await Promise.all([
        import('../../components/landing/LandingPage'),
        import('../../components/advisors/AdvisorSelectionPanel'),
        import('../../components/consultation/ConsultationInterface'),
        import('../../components/common/Button'),
        import('../../components/common/Card')
      ]);
      
      const loadTime = performance.now() - startTime;
      
      // Component imports should be fast (under 50ms)
      expect(loadTime).toBeLessThan(50);
      
      console.log(`Component Import Time: ${loadTime.toFixed(2)}ms`);
    });
  });

  afterEach(() => {
    // Log all performance measurements
    const measurements = monitor.getAllMeasurements();
    
    if (Object.keys(measurements).length > 0) {
      console.log('\n=== Performance Summary ===');
      Object.entries(measurements).forEach(([name, stats]) => {
        console.log(`${name}:
          Average: ${stats.avg.toFixed(2)}ms
          Median: ${stats.median.toFixed(2)}ms
          95th Percentile: ${stats.p95.toFixed(2)}ms
          99th Percentile: ${stats.p99.toFixed(2)}ms`);
      });
      console.log('========================\n');
    }
  });
});