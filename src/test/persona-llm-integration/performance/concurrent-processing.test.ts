/**
 * Performance Tests for Concurrent Processing
 * 
 * Comprehensive test suite covering:
 * - Concurrent advisor response generation
 * - Response time benchmarks
 * - Throughput and scalability testing
 * - Memory usage and resource optimization
 */

import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { ResponseOrchestrator } from '../../../services/responseOrchestrator';
import { PersonaPromptService } from '../../../services/personaPromptService';
import type { Advisor, DomainId } from '../../../types/domain';
import type { EnvironmentConfig } from '../../../types/llm';

// Performance monitoring utilities
class PerformanceMonitor {
  private measurements: Map<string, number[]> = new Map();
  private memoryBaseline: number = 0;

  startMeasurement(name: string): () => number {
    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();
    
    return () => {
      const endTime = performance.now();
      const endMemory = this.getMemoryUsage();
      const duration = endTime - startTime;
      const memoryDelta = endMemory - startMemory;
      
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

  getThroughput(name: string, itemCount: number): number {
    const avgTime = this.getAverageTime(name);
    return avgTime > 0 ? (itemCount * 1000) / avgTime : 0; // items per second
  }

  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed / 1024 / 1024; // MB
    }
    return 0;
  }

  reset(): void {
    this.measurements.clear();
    this.memoryBaseline = this.getMemoryUsage();
  }

  getStats(name: string) {
    return {
      avg: this.getAverageTime(name),
      median: this.getMedianTime(name),
      p95: this.getPercentile(name, 95),
      p99: this.getPercentile(name, 99),
      throughput: this.getThroughput(name, 1)
    };
  }
}

// Mock fetch globally
global.fetch = vi.fn();

describe('Concurrent Processing Performance Tests', () => {
  let orchestrator: ResponseOrchestrator;
  let monitor: PerformanceMonitor;
  let mockFetch: Mock;

  const performanceConfig: EnvironmentConfig = {
    llmProviders: {
      openai: {
        apiKey: 'sk-test-key-123',
        model: 'gpt-4',
        baseURL: 'https://api.openai.com/v1'
      },
      anthropic: {
        apiKey: 'sk-ant-test-key-123',
        model: 'claude-3-sonnet-20240229',
        baseURL: 'https://api.anthropic.com'
      }
    },
    defaultProvider: 'openai',
    enableCaching: true,
    maxConcurrentRequests: 10,
    responseTimeout: 30000,
    retryPolicy: {
      maxRetries: 2,
      baseDelay: 500,
      maxDelay: 5000,
      backoffMultiplier: 2
    }
  };

  const createMockAdvisors = (count: number): Advisor[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `advisor-${i}`,
      name: `Advisor ${i}`,
      expertise: `Expertise ${i}`,
      background: `Background for advisor ${i}`,
      domain: (i % 2 === 0 ? 'productboard' : 'cliniboard') as DomainId,
      isSelected: true,
      specialties: [`Specialty ${i}A`, `Specialty ${i}B`]
    }));
  };

  const mockLLMResponse = {
    choices: [{
      message: { 
        content: 'This is a comprehensive strategic response that provides detailed insights and actionable recommendations based on extensive experience and proven frameworks.',
        role: 'assistant'
      }
    }],
    usage: {
      prompt_tokens: 200,
      completion_tokens: 400,
      total_tokens: 600
    },
    model: 'gpt-4',
    id: 'chatcmpl-test123'
  };

  beforeEach(() => {
    mockFetch = vi.mocked(global.fetch);
    mockFetch.mockClear();
    
    monitor = new PerformanceMonitor();
    orchestrator = new ResponseOrchestrator(performanceConfig);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Concurrent Response Generation Benchmarks', () => {
    it('should process 5 advisors concurrently within performance budget', async () => {
      const advisors = createMockAdvisors(5);
      
      // Mock API responses with realistic delays
      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve(mockLLMResponse)
        }), 800 + Math.random() * 400)) // 800-1200ms delay
      );

      const iterations = 3;
      
      for (let i = 0; i < iterations; i++) {
        const endMeasurement = monitor.startMeasurement('concurrent-5-advisors');
        
        const result = await orchestrator.generateAdvisorResponses(
          `Performance test question ${i}`,
          advisors,
          'productboard'
        );
        
        endMeasurement();
        
        expect(result.responses).toHaveLength(5);
        expect(result.successCount).toBe(5);
      }

      const stats = monitor.getStats('concurrent-5-advisors');
      
      // Performance budgets
      expect(stats.avg).toBeLessThan(3000); // Average under 3 seconds
      expect(stats.p95).toBeLessThan(4000); // 95th percentile under 4 seconds
      expect(stats.throughput).toBeGreaterThan(1.5); // At least 1.5 advisors per second

      console.log(`5 Advisors Concurrent Performance:
        Average: ${stats.avg.toFixed(2)}ms
        Median: ${stats.median.toFixed(2)}ms
        95th Percentile: ${stats.p95.toFixed(2)}ms
        Throughput: ${stats.throughput.toFixed(2)} advisors/sec`);
    });

    it('should scale efficiently with 10 advisors', async () => {
      const advisors = createMockAdvisors(10);
      
      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve(mockLLMResponse)
        }), 600 + Math.random() * 300)) // 600-900ms delay
      );

      const iterations = 3;
      
      for (let i = 0; i < iterations; i++) {
        const endMeasurement = monitor.startMeasurement('concurrent-10-advisors');
        
        const result = await orchestrator.generateAdvisorResponses(
          `Scaling test question ${i}`,
          advisors,
          'productboard'
        );
        
        endMeasurement();
        
        expect(result.responses).toHaveLength(10);
        expect(result.successCount).toBe(10);
      }

      const stats = monitor.getStats('concurrent-10-advisors');
      
      // Should scale well with concurrency limit of 10
      expect(stats.avg).toBeLessThan(5000); // Average under 5 seconds
      expect(stats.p95).toBeLessThan(7000); // 95th percentile under 7 seconds
      expect(stats.throughput).toBeGreaterThan(2); // At least 2 advisors per second

      console.log(`10 Advisors Concurrent Performance:
        Average: ${stats.avg.toFixed(2)}ms
        Median: ${stats.median.toFixed(2)}ms
        95th Percentile: ${stats.p95.toFixed(2)}ms
        Throughput: ${stats.throughput.toFixed(2)} advisors/sec`);
    });

    it('should handle 20 advisors with batching', async () => {
      const advisors = createMockAdvisors(20);
      
      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve(mockLLMResponse)
        }), 500 + Math.random() * 200)) // 500-700ms delay
      );

      const endMeasurement = monitor.startMeasurement('concurrent-20-advisors');
      
      const result = await orchestrator.generateAdvisorResponses(
        'Large scale test question',
        advisors,
        'productboard'
      );
      
      const duration = endMeasurement();
      
      expect(result.responses).toHaveLength(20);
      expect(result.successCount).toBe(20);
      
      // Should complete within reasonable time despite batching
      expect(duration).toBeLessThan(10000); // Under 10 seconds
      
      const throughput = (20 * 1000) / duration;
      expect(throughput).toBeGreaterThan(2.5); // At least 2.5 advisors per second

      console.log(`20 Advisors Batched Performance:
        Duration: ${duration.toFixed(2)}ms
        Throughput: ${throughput.toFixed(2)} advisors/sec`);
    });
  });

  describe('Concurrency Limit Testing', () => {
    it('should respect concurrency limits and batch appropriately', async () => {
      const limitedConfig = {
        ...performanceConfig,
        maxConcurrentRequests: 3
      };

      const limitedOrchestrator = new ResponseOrchestrator(limitedConfig);
      const advisors = createMockAdvisors(9); // 3 batches of 3

      let concurrentRequests = 0;
      let maxConcurrentRequests = 0;

      mockFetch.mockImplementation(() => {
        concurrentRequests++;
        maxConcurrentRequests = Math.max(maxConcurrentRequests, concurrentRequests);
        
        return new Promise(resolve => setTimeout(() => {
          concurrentRequests--;
          resolve({
            ok: true,
            json: () => Promise.resolve(mockLLMResponse)
          });
        }, 500));
      });

      const result = await limitedOrchestrator.generateAdvisorResponses(
        'Concurrency limit test',
        advisors,
        'productboard'
      );

      expect(result.responses).toHaveLength(9);
      expect(result.successCount).toBe(9);
      expect(maxConcurrentRequests).toBeLessThanOrEqual(3);

      console.log(`Concurrency Limit Test:
        Max Concurrent Requests: ${maxConcurrentRequests}
        Expected Limit: 3`);
    });

    it('should optimize batch sizes for different advisor counts', async () => {
      const testCases = [
        { advisors: 5, expectedBatches: 1 },
        { advisors: 10, expectedBatches: 1 },
        { advisors: 15, expectedBatches: 2 },
        { advisors: 25, expectedBatches: 3 }
      ];

      for (const testCase of testCases) {
        const advisors = createMockAdvisors(testCase.advisors);
        let batchCount = 0;
        let currentBatchSize = 0;

        mockFetch.mockImplementation(() => {
          if (currentBatchSize === 0) {
            batchCount++;
          }
          currentBatchSize++;
          
          return new Promise(resolve => setTimeout(() => {
            currentBatchSize--;
            resolve({
              ok: true,
              json: () => Promise.resolve(mockLLMResponse)
            });
          }, 200));
        });

        const result = await orchestrator.generateAdvisorResponses(
          `Batch optimization test ${testCase.advisors}`,
          advisors,
          'productboard'
        );

        expect(result.responses).toHaveLength(testCase.advisors);
        expect(result.successCount).toBe(testCase.advisors);

        console.log(`${testCase.advisors} Advisors - Batches: ${batchCount}`);
      }
    });
  });

  describe('Response Time Benchmarks', () => {
    it('should meet response time SLAs for different scenarios', async () => {
      const scenarios = [
        {
          name: 'single-advisor',
          advisors: 1,
          sla: 2000, // 2 seconds
          delay: 800
        },
        {
          name: 'small-team',
          advisors: 3,
          sla: 3000, // 3 seconds
          delay: 700
        },
        {
          name: 'medium-team',
          advisors: 7,
          sla: 5000, // 5 seconds
          delay: 600
        },
        {
          name: 'large-team',
          advisors: 12,
          sla: 8000, // 8 seconds
          delay: 500
        }
      ];

      for (const scenario of scenarios) {
        const advisors = createMockAdvisors(scenario.advisors);
        
        mockFetch.mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve(mockLLMResponse)
          }), scenario.delay))
        );

        const iterations = 3;
        
        for (let i = 0; i < iterations; i++) {
          const endMeasurement = monitor.startMeasurement(scenario.name);
          
          const result = await orchestrator.generateAdvisorResponses(
            `SLA test ${scenario.name} ${i}`,
            advisors,
            'productboard'
          );
          
          endMeasurement();
          
          expect(result.responses).toHaveLength(scenario.advisors);
          expect(result.successCount).toBe(scenario.advisors);
        }

        const stats = monitor.getStats(scenario.name);
        
        expect(stats.avg).toBeLessThan(scenario.sla);
        expect(stats.p95).toBeLessThan(scenario.sla * 1.2); // Allow 20% buffer for p95

        console.log(`${scenario.name} SLA Performance:
          Average: ${stats.avg.toFixed(2)}ms (SLA: ${scenario.sla}ms)
          95th Percentile: ${stats.p95.toFixed(2)}ms
          SLA Met: ${stats.avg < scenario.sla ? '✓' : '✗'}`);
      }
    });

    it('should maintain performance under load', async () => {
      const advisors = createMockAdvisors(5);
      
      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve(mockLLMResponse)
        }), 600 + Math.random() * 200))
      );

      // Simulate load with multiple concurrent orchestrator calls
      const loadIterations = 10;
      const promises = [];

      for (let i = 0; i < loadIterations; i++) {
        const promise = (async () => {
          const endMeasurement = monitor.startMeasurement('load-test');
          
          const result = await orchestrator.generateAdvisorResponses(
            `Load test iteration ${i}`,
            advisors,
            'productboard'
          );
          
          endMeasurement();
          return result;
        })();
        
        promises.push(promise);
      }

      const results = await Promise.all(promises);
      
      // All requests should succeed
      results.forEach(result => {
        expect(result.responses).toHaveLength(5);
        expect(result.successCount).toBe(5);
      });

      const stats = monitor.getStats('load-test');
      
      // Performance should remain stable under load
      expect(stats.avg).toBeLessThan(4000); // Average under 4 seconds
      expect(stats.p95).toBeLessThan(6000); // 95th percentile under 6 seconds
      
      // Performance variance should be reasonable
      const variance = stats.p95 - stats.median;
      expect(variance).toBeLessThan(3000); // Variance under 3 seconds

      console.log(`Load Test Performance (${loadIterations} concurrent requests):
        Average: ${stats.avg.toFixed(2)}ms
        Median: ${stats.median.toFixed(2)}ms
        95th Percentile: ${stats.p95.toFixed(2)}ms
        Variance: ${variance.toFixed(2)}ms`);
    });
  });

  describe('Caching Performance Impact', () => {
    it('should demonstrate significant performance improvement with caching', async () => {
      const advisors = createMockAdvisors(5);
      const question = 'Consistent question for caching test';

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockLLMResponse)
      });

      // First call (cache miss)
      const endMeasurement1 = monitor.startMeasurement('cache-miss');
      await orchestrator.generateAdvisorResponses(question, advisors, 'productboard');
      endMeasurement1();

      // Second call (cache hit)
      const endMeasurement2 = monitor.startMeasurement('cache-hit');
      await orchestrator.generateAdvisorResponses(question, advisors, 'productboard');
      endMeasurement2();

      const missTime = monitor.getAverageTime('cache-miss');
      const hitTime = monitor.getAverageTime('cache-hit');
      const improvement = ((missTime - hitTime) / missTime) * 100;

      expect(hitTime).toBeLessThan(missTime);
      expect(improvement).toBeGreaterThan(80); // At least 80% improvement
      expect(mockFetch).toHaveBeenCalledTimes(5); // Only first call should hit API

      console.log(`Caching Performance Impact:
        Cache Miss: ${missTime.toFixed(2)}ms
        Cache Hit: ${hitTime.toFixed(2)}ms
        Improvement: ${improvement.toFixed(1)}%`);
    });

    it('should handle cache warming efficiently', async () => {
      const commonQuestions = [
        'How do I achieve product-market fit?',
        'What is the best pricing strategy?',
        'How should I scale my team?',
        'What metrics should I track?',
        'How do I improve user retention?'
      ];

      const advisors = createMockAdvisors(3);

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockLLMResponse)
      });

      // Warm cache with common questions
      const endWarmup = monitor.startMeasurement('cache-warmup');
      
      for (const question of commonQuestions) {
        await orchestrator.generateAdvisorResponses(question, advisors, 'productboard');
      }
      
      endWarmup();

      // Test cache hit performance
      const endCacheTest = monitor.startMeasurement('cache-hit-test');
      
      for (const question of commonQuestions) {
        await orchestrator.generateAdvisorResponses(question, advisors, 'productboard');
      }
      
      endCacheTest();

      const warmupTime = monitor.getAverageTime('cache-warmup');
      const cacheTestTime = monitor.getAverageTime('cache-hit-test');
      const cacheEfficiency = ((warmupTime - cacheTestTime) / warmupTime) * 100;

      expect(cacheTestTime).toBeLessThan(warmupTime);
      expect(cacheEfficiency).toBeGreaterThan(85); // At least 85% efficiency

      console.log(`Cache Warming Performance:
        Warmup Time: ${warmupTime.toFixed(2)}ms
        Cache Hit Time: ${cacheTestTime.toFixed(2)}ms
        Cache Efficiency: ${cacheEfficiency.toFixed(1)}%`);
    });
  });

  describe('Error Recovery Performance', () => {
    it('should maintain performance during partial failures', async () => {
      const advisors = createMockAdvisors(6);
      
      // 50% failure rate
      let callCount = 0;
      mockFetch.mockImplementation(() => {
        callCount++;
        if (callCount % 2 === 0) {
          return Promise.reject(new Error('Simulated API failure'));
        }
        return new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve(mockLLMResponse)
        }), 600));
      });

      const iterations = 3;
      
      for (let i = 0; i < iterations; i++) {
        const endMeasurement = monitor.startMeasurement('partial-failure');
        
        const result = await orchestrator.generateAdvisorResponses(
          `Partial failure test ${i}`,
          advisors,
          'productboard'
        );
        
        endMeasurement();
        
        expect(result.responses).toHaveLength(6);
        expect(result.successCount).toBe(6); // All should have responses (LLM or static)
      }

      const stats = monitor.getStats('partial-failure');
      
      // Should complete within reasonable time despite failures
      expect(stats.avg).toBeLessThan(8000); // Average under 8 seconds
      expect(stats.p95).toBeLessThan(12000); // 95th percentile under 12 seconds

      console.log(`Partial Failure Performance:
        Average: ${stats.avg.toFixed(2)}ms
        95th Percentile: ${stats.p95.toFixed(2)}ms`);
    });

    it('should handle complete API failure gracefully', async () => {
      const advisors = createMockAdvisors(5);
      
      mockFetch.mockRejectedValue(new Error('Complete API failure'));

      const endMeasurement = monitor.startMeasurement('complete-failure');
      
      const result = await orchestrator.generateAdvisorResponses(
        'Complete failure test',
        advisors,
        'productboard'
      );
      
      const duration = endMeasurement();
      
      expect(result.responses).toHaveLength(5);
      expect(result.successCount).toBe(5); // All should have static fallback responses
      
      // Should fail fast and use static responses
      expect(duration).toBeLessThan(3000); // Under 3 seconds with fallbacks

      console.log(`Complete Failure Fallback Performance:
        Duration: ${duration.toFixed(2)}ms
        All responses via static fallback: ✓`);
    });
  });

  describe('Memory Usage and Resource Optimization', () => {
    it('should maintain reasonable memory usage during concurrent processing', async () => {
      const advisors = createMockAdvisors(15);
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockLLMResponse)
      });

      const initialMemory = process.memoryUsage?.()?.heapUsed || 0;

      // Process multiple batches
      for (let i = 0; i < 5; i++) {
        await orchestrator.generateAdvisorResponses(
          `Memory test batch ${i}`,
          advisors,
          'productboard'
        );
      }

      const finalMemory = process.memoryUsage?.()?.heapUsed || 0;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB

      // Memory increase should be reasonable
      expect(memoryIncrease).toBeLessThan(50); // Less than 50MB increase

      console.log(`Memory Usage:
        Initial: ${(initialMemory / 1024 / 1024).toFixed(2)}MB
        Final: ${(finalMemory / 1024 / 1024).toFixed(2)}MB
        Increase: ${memoryIncrease.toFixed(2)}MB`);
    });

    it('should clean up resources after processing', async () => {
      const advisors = createMockAdvisors(10);
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockLLMResponse)
      });

      // Process and then clear cache
      await orchestrator.generateAdvisorResponses(
        'Resource cleanup test',
        advisors,
        'productboard'
      );

      const statsBeforeCleanup = orchestrator.getCacheStats();
      expect(statsBeforeCleanup.size).toBeGreaterThan(0);

      orchestrator.clearCache();

      const statsAfterCleanup = orchestrator.getCacheStats();
      expect(statsAfterCleanup.size).toBe(0);

      console.log(`Resource Cleanup:
        Cache size before: ${statsBeforeCleanup.size}
        Cache size after: ${statsAfterCleanup.size}`);
    });
  });

  describe('Scalability Stress Tests', () => {
    it('should handle extreme advisor counts', async () => {
      const extremeAdvisors = createMockAdvisors(50);
      
      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve(mockLLMResponse)
        }), 300 + Math.random() * 200))
      );

      const endMeasurement = monitor.startMeasurement('extreme-scale');
      
      const result = await orchestrator.generateAdvisorResponses(
        'Extreme scale test',
        extremeAdvisors,
        'productboard'
      );
      
      const duration = endMeasurement();
      
      expect(result.responses).toHaveLength(50);
      expect(result.successCount).toBe(50);
      
      // Should complete within reasonable time
      expect(duration).toBeLessThan(30000); // Under 30 seconds
      
      const throughput = (50 * 1000) / duration;
      expect(throughput).toBeGreaterThan(2); // At least 2 advisors per second

      console.log(`Extreme Scale Performance (50 advisors):
        Duration: ${duration.toFixed(2)}ms
        Throughput: ${throughput.toFixed(2)} advisors/sec`);
    }, 35000); // Extended timeout for stress test

    it('should maintain performance consistency across multiple runs', async () => {
      const advisors = createMockAdvisors(8);
      
      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve(mockLLMResponse)
        }), 500 + Math.random() * 300))
      );

      const runs = 10;
      const durations: number[] = [];

      for (let i = 0; i < runs; i++) {
        const endMeasurement = monitor.startMeasurement(`consistency-run-${i}`);
        
        const result = await orchestrator.generateAdvisorResponses(
          `Consistency test run ${i}`,
          advisors,
          'productboard'
        );
        
        const duration = endMeasurement();
        durations.push(duration);
        
        expect(result.responses).toHaveLength(8);
        expect(result.successCount).toBe(8);
      }

      // Calculate consistency metrics
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const variance = durations.reduce((acc, duration) => acc + Math.pow(duration - avgDuration, 2), 0) / durations.length;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = (stdDev / avgDuration) * 100;

      // Performance should be consistent (low coefficient of variation)
      expect(coefficientOfVariation).toBeLessThan(25); // Less than 25% variation

      console.log(`Performance Consistency (${runs} runs):
        Average Duration: ${avgDuration.toFixed(2)}ms
        Standard Deviation: ${stdDev.toFixed(2)}ms
        Coefficient of Variation: ${coefficientOfVariation.toFixed(1)}%`);
    });
  });
});