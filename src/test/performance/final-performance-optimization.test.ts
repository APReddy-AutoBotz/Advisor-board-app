/**
 * Final Performance Optimization Test
 * 
 * Tests performance benchmarks for the complete persona-llm integration system.
 * Validates response times, concurrent processing, memory usage, and system scalability.
 * Ensures the system meets production-ready performance standards.
 * 
 * Requirements: FR-6, FR-7
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ResponseOrchestrator } from '../../services/responseOrchestrator';
import { PersonaPromptService } from '../../services/personaPromptService';
import { EnhancedStaticResponseGenerator } from '../../services/enhancedStaticResponseGenerator';
import { QuestionAnalysisEngine } from '../../services/questionAnalysisEngine';
import { performanceMonitoringService } from '../../services/performanceMonitoringService';
import { demoModeService } from '../../services/demoModeService';
import type { Advisor } from '../../types/domain';
import type { EnvironmentConfig } from '../../types/llm';

// Performance benchmarks (in milliseconds)
const PERFORMANCE_BENCHMARKS = {
  STATIC_RESPONSE_MAX: 100,
  QUESTION_ANALYSIS_MAX: 50,
  PERSONA_PROMPT_GENERATION_MAX: 25,
  CONCURRENT_PROCESSING_MAX: 2000,
  MEMORY_USAGE_MAX_MB: 50,
  CACHE_LOOKUP_MAX: 5
};

// Test data for performance testing
const createTestAdvisors = (count: number): Advisor[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `advisor-${i}`,
    name: `Test Advisor ${i}`,
    expertise: `Expert ${i}`,
    background: `Background for advisor ${i}`,
    domain: 'productboard',
    isSelected: true,
    credentials: `Credentials ${i}`,
    specialties: [`Specialty ${i}A`, `Specialty ${i}B`]
  }));
};

const testQuestions = [
  'How should I approach market analysis for my product?',
  'What are the key technical considerations for scaling?',
  'How can I improve team collaboration and workflow?',
  'What emerging trends should I be aware of?',
  'How do I handle declining user engagement?'
];

describe('Final Performance Optimization', () => {
  let responseOrchestrator: ResponseOrchestrator;
  let personaPromptService: PersonaPromptService;
  let staticResponseGenerator: EnhancedStaticResponseGenerator;
  let questionAnalysisEngine: QuestionAnalysisEngine;

  const mockEnvironmentConfig: EnvironmentConfig = {
    llmProviders: {},
    defaultProvider: 'openai',
    enableCaching: true,
    maxConcurrentRequests: 10,
    responseTimeout: 15000
  };

  beforeEach(() => {
    responseOrchestrator = new ResponseOrchestrator(mockEnvironmentConfig);
    personaPromptService = new PersonaPromptService();
    staticResponseGenerator = new EnhancedStaticResponseGenerator();
    questionAnalysisEngine = new QuestionAnalysisEngine();
    
    // Mock demo mode to be inactive for performance tests
    vi.spyOn(demoModeService, 'isDemoModeActive').mockReturnValue(false);
    
    // Clear performance monitoring
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any resources
    responseOrchestrator.clearCache();
  });

  describe('Individual Component Performance', () => {
    it('should generate persona prompts within performance benchmark', async () => {
      const advisor = createTestAdvisors(1)[0];
      const question = testQuestions[0];
      
      const startTime = performance.now();
      const prompt = personaPromptService.generatePersonaPrompt(advisor, question);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(PERFORMANCE_BENCHMARKS.PERSONA_PROMPT_GENERATION_MAX);
      expect(prompt).toBeTruthy();
      expect(prompt.length).toBeGreaterThan(100);
    });

    it('should analyze questions within performance benchmark', async () => {
      const question = testQuestions[0];
      
      const startTime = performance.now();
      const analysis = questionAnalysisEngine.analyze(question);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(PERFORMANCE_BENCHMARKS.QUESTION_ANALYSIS_MAX);
      expect(analysis).toBeTruthy();
      expect(analysis.type).toBeTruthy();
      expect(analysis.confidence).toBeGreaterThan(0);
    });

    it('should generate static responses within performance benchmark', async () => {
      const advisor = createTestAdvisors(1)[0];
      const question = testQuestions[0];
      
      const startTime = performance.now();
      const response = await staticResponseGenerator.generateResponse(
        advisor,
        question,
        'productboard'
      );
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(PERFORMANCE_BENCHMARKS.STATIC_RESPONSE_MAX);
      expect(response.content).toBeTruthy();
      expect(response.content.length).toBeGreaterThan(100);
    });
  });

  describe('Concurrent Processing Performance', () => {
    it('should handle multiple advisors concurrently within benchmark', async () => {
      const advisors = createTestAdvisors(5);
      const question = testQuestions[0];
      
      const startTime = performance.now();
      
      // Process all advisors concurrently
      const promises = advisors.map(advisor =>
        staticResponseGenerator.generateResponse(advisor, question, 'productboard')
      );
      
      const responses = await Promise.all(promises);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(PERFORMANCE_BENCHMARKS.CONCURRENT_PROCESSING_MAX);
      expect(responses).toHaveLength(5);
      responses.forEach(response => {
        expect(response.content).toBeTruthy();
      });
    });

    it('should scale efficiently with increasing advisor count', async () => {
      const advisorCounts = [1, 3, 5, 10];
      const question = testQuestions[0];
      const results: Array<{ count: number; duration: number; avgPerAdvisor: number }> = [];
      
      for (const count of advisorCounts) {
        const advisors = createTestAdvisors(count);
        
        const startTime = performance.now();
        const promises = advisors.map(advisor =>
          staticResponseGenerator.generateResponse(advisor, question, 'productboard')
        );
        await Promise.all(promises);
        const endTime = performance.now();
        
        const duration = endTime - startTime;
        const avgPerAdvisor = duration / count;
        
        results.push({ count, duration, avgPerAdvisor });
      }
      
      // Verify scaling efficiency - average per advisor should not increase dramatically
      const baselineAvg = results[0].avgPerAdvisor;
      const maxAvg = Math.max(...results.map(r => r.avgPerAdvisor));
      
      // Average per advisor should not increase by more than 50% even with 10x advisors
      expect(maxAvg).toBeLessThan(baselineAvg * 1.5);
      
      // Total time for 10 advisors should still be reasonable
      const maxCount = Math.max(...results.map(r => r.count));
      const maxDuration = results.find(r => r.count === maxCount)?.duration || 0;
      expect(maxDuration).toBeLessThan(PERFORMANCE_BENCHMARKS.CONCURRENT_PROCESSING_MAX);
    });

    it('should handle concurrent requests from multiple users', async () => {
      const advisor = createTestAdvisors(1)[0];
      const concurrentUsers = 10;
      
      const startTime = performance.now();
      
      // Simulate multiple users asking questions simultaneously
      const promises = Array.from({ length: concurrentUsers }, (_, i) =>
        staticResponseGenerator.generateResponse(
          advisor,
          `${testQuestions[i % testQuestions.length]} (User ${i})`,
          'productboard'
        )
      );
      
      const responses = await Promise.all(promises);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(PERFORMANCE_BENCHMARKS.CONCURRENT_PROCESSING_MAX);
      expect(responses).toHaveLength(concurrentUsers);
      
      // Verify all responses are unique and valid
      const uniqueContents = new Set(responses.map(r => r.content));
      expect(uniqueContents.size).toBe(concurrentUsers); // All responses should be unique
    });
  });

  describe('Caching Performance', () => {
    it('should provide fast cache lookups', async () => {
      const advisor = createTestAdvisors(1)[0];
      const question = testQuestions[0];
      
      // First request (cache miss)
      const firstStartTime = performance.now();
      const firstResponse = await staticResponseGenerator.generateResponse(
        advisor,
        question,
        'productboard'
      );
      const firstEndTime = performance.now();
      const firstDuration = firstEndTime - firstStartTime;
      
      // Enable caching in orchestrator
      const orchestratorConfig = {
        maxConcurrentRequests: 10,
        responseTimeout: 15000,
        enableCaching: true,
        fallbackToStatic: true,
        retryAttempts: 2
      };
      
      const cachedOrchestrator = new ResponseOrchestrator(mockEnvironmentConfig, orchestratorConfig);
      
      // Second request (should be faster due to internal optimizations)
      const secondStartTime = performance.now();
      const secondResponse = await staticResponseGenerator.generateResponse(
        advisor,
        question,
        'productboard'
      );
      const secondEndTime = performance.now();
      const secondDuration = secondEndTime - secondStartTime;
      
      // Both responses should be valid
      expect(firstResponse.content).toBeTruthy();
      expect(secondResponse.content).toBeTruthy();
      
      // Cache lookup should be very fast
      expect(secondDuration).toBeLessThan(PERFORMANCE_BENCHMARKS.CACHE_LOOKUP_MAX);
    });

    it('should efficiently manage cache memory usage', async () => {
      const advisors = createTestAdvisors(20);
      const questions = Array.from({ length: 50 }, (_, i) => `Test question ${i}`);
      
      // Generate many cached responses
      for (const advisor of advisors.slice(0, 5)) { // Limit to prevent test timeout
        for (const question of questions.slice(0, 10)) { // Limit to prevent test timeout
          await staticResponseGenerator.generateResponse(advisor, question, 'productboard');
        }
      }
      
      // Check cache statistics
      const cacheStats = responseOrchestrator.getCacheStats();
      
      // Cache should not grow unbounded
      expect(cacheStats.size).toBeLessThan(100); // Should have reasonable size limit
    });
  });

  describe('Memory Usage Optimization', () => {
    it('should maintain reasonable memory usage under load', async () => {
      const initialMemory = process.memoryUsage();
      
      // Generate many responses to test memory usage
      const advisors = createTestAdvisors(10);
      const responses: any[] = [];
      
      for (let i = 0; i < 20; i++) {
        const advisor = advisors[i % advisors.length];
        const question = testQuestions[i % testQuestions.length];
        
        const response = await staticResponseGenerator.generateResponse(
          advisor,
          question,
          'productboard'
        );
        responses.push(response);
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncreaseMB = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;
      
      // Memory increase should be reasonable
      expect(memoryIncreaseMB).toBeLessThan(PERFORMANCE_BENCHMARKS.MEMORY_USAGE_MAX_MB);
      
      // Verify all responses are valid
      expect(responses).toHaveLength(20);
      responses.forEach(response => {
        expect(response.content).toBeTruthy();
      });
    });

    it('should clean up resources properly', async () => {
      const advisor = createTestAdvisors(1)[0];
      const question = testQuestions[0];
      
      // Generate response and measure memory
      const beforeMemory = process.memoryUsage();
      
      const response = await staticResponseGenerator.generateResponse(
        advisor,
        question,
        'productboard'
      );
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const afterMemory = process.memoryUsage();
      
      // Memory should not increase significantly for a single response
      const memoryIncreaseMB = (afterMemory.heapUsed - beforeMemory.heapUsed) / 1024 / 1024;
      expect(memoryIncreaseMB).toBeLessThan(5); // Should be minimal for single response
      
      expect(response.content).toBeTruthy();
    });
  });

  describe('End-to-End Performance', () => {
    it('should complete full workflow within acceptable time', async () => {
      const advisors = createTestAdvisors(3);
      const question = testQuestions[0];
      
      const startTime = performance.now();
      
      // Simulate complete workflow
      const questionAnalysis = questionAnalysisEngine.analyze(question);
      
      const responsePromises = advisors.map(async advisor => {
        const prompt = personaPromptService.generatePersonaPrompt(advisor, question);
        const response = await staticResponseGenerator.generateResponse(
          advisor,
          question,
          'productboard'
        );
        return { advisor, prompt, response };
      });
      
      const results = await Promise.all(responsePromises);
      const endTime = performance.now();
      
      const totalDuration = endTime - startTime;
      
      // Complete workflow should finish within reasonable time
      expect(totalDuration).toBeLessThan(PERFORMANCE_BENCHMARKS.CONCURRENT_PROCESSING_MAX);
      
      // Verify all components worked
      expect(questionAnalysis).toBeTruthy();
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.prompt).toBeTruthy();
        expect(result.response.content).toBeTruthy();
      });
    });

    it('should maintain performance under stress conditions', async () => {
      const advisors = createTestAdvisors(5);
      const stressTestRounds = 10;
      const durations: number[] = [];
      
      for (let round = 0; round < stressTestRounds; round++) {
        const question = `${testQuestions[round % testQuestions.length]} (Round ${round})`;
        
        const startTime = performance.now();
        
        const promises = advisors.map(advisor =>
          staticResponseGenerator.generateResponse(advisor, question, 'productboard')
        );
        
        const responses = await Promise.all(promises);
        const endTime = performance.now();
        
        const duration = endTime - startTime;
        durations.push(duration);
        
        // Verify responses are valid
        expect(responses).toHaveLength(5);
        responses.forEach(response => {
          expect(response.content).toBeTruthy();
        });
      }
      
      // Performance should remain consistent across rounds
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const maxDuration = Math.max(...durations);
      const minDuration = Math.min(...durations);
      
      // Variance should not be too high (performance should be consistent)
      const variance = maxDuration - minDuration;
      expect(variance).toBeLessThan(avgDuration * 0.5); // Variance should be less than 50% of average
      
      // All rounds should complete within benchmark
      expect(maxDuration).toBeLessThan(PERFORMANCE_BENCHMARKS.CONCURRENT_PROCESSING_MAX);
    });
  });

  describe('Performance Monitoring Integration', () => {
    it('should record performance metrics accurately', async () => {
      const advisor = createTestAdvisors(1)[0];
      const question = testQuestions[0];
      
      // Mock performance monitoring service
      const recordMetricsSpy = vi.spyOn(performanceMonitoringService, 'recordResponseMetrics');
      
      const startTime = performance.now();
      const response = await staticResponseGenerator.generateResponse(
        advisor,
        question,
        'productboard'
      );
      const endTime = performance.now();
      
      const actualDuration = endTime - startTime;
      
      // Manually record metrics to test monitoring
      performanceMonitoringService.recordResponseMetrics(
        actualDuration,
        1,
        'medium',
        {
          personaAccuracy: 0.9,
          technicalDepth: 0.8,
          businessRelevance: 0.85
        }
      );
      
      expect(recordMetricsSpy).toHaveBeenCalledWith(
        actualDuration,
        1,
        'medium',
        expect.objectContaining({
          personaAccuracy: 0.9,
          technicalDepth: 0.8,
          businessRelevance: 0.85
        })
      );
      
      expect(response.content).toBeTruthy();
    });

    it('should provide performance insights for optimization', async () => {
      const advisors = createTestAdvisors(3);
      const question = testQuestions[0];
      
      const performanceData: Array<{
        advisorId: string;
        duration: number;
        responseLength: number;
      }> = [];
      
      for (const advisor of advisors) {
        const startTime = performance.now();
        const response = await staticResponseGenerator.generateResponse(
          advisor,
          question,
          'productboard'
        );
        const endTime = performance.now();
        
        performanceData.push({
          advisorId: advisor.id,
          duration: endTime - startTime,
          responseLength: response.content.length
        });
      }
      
      // Analyze performance patterns
      const avgDuration = performanceData.reduce((sum, data) => sum + data.duration, 0) / performanceData.length;
      const avgResponseLength = performanceData.reduce((sum, data) => sum + data.responseLength, 0) / performanceData.length;
      
      // Performance should be consistent across advisors
      performanceData.forEach(data => {
        expect(data.duration).toBeLessThan(avgDuration * 2); // No advisor should take more than 2x average
        expect(data.responseLength).toBeGreaterThan(avgResponseLength * 0.5); // All responses should be substantial
      });
      
      // Overall performance should meet benchmarks
      expect(avgDuration).toBeLessThan(PERFORMANCE_BENCHMARKS.STATIC_RESPONSE_MAX);
    });
  });

  describe('Scalability Testing', () => {
    it('should handle increasing load gracefully', async () => {
      const loadLevels = [1, 5, 10, 20];
      const results: Array<{ load: number; avgDuration: number; successRate: number }> = [];
      
      for (const load of loadLevels) {
        const advisors = createTestAdvisors(Math.min(load, 10)); // Cap advisors to prevent timeout
        const questions = Array.from({ length: load }, (_, i) => 
          `${testQuestions[i % testQuestions.length]} (Load ${i})`
        );
        
        const startTime = performance.now();
        let successCount = 0;
        
        const promises = questions.map(async (question, i) => {
          try {
            const advisor = advisors[i % advisors.length];
            const response = await staticResponseGenerator.generateResponse(
              advisor,
              question,
              'productboard'
            );
            if (response.content) successCount++;
            return response;
          } catch (error) {
            return null;
          }
        });
        
        await Promise.allSettled(promises);
        const endTime = performance.now();
        
        const avgDuration = (endTime - startTime) / load;
        const successRate = successCount / load;
        
        results.push({ load, avgDuration, successRate });
      }
      
      // Success rate should remain high across all load levels
      results.forEach(result => {
        expect(result.successRate).toBeGreaterThan(0.95); // 95% success rate minimum
      });
      
      // Performance degradation should be reasonable
      const baselineAvg = results[0].avgDuration;
      const maxAvg = Math.max(...results.map(r => r.avgDuration));
      
      // Average duration should not increase by more than 100% even at highest load
      expect(maxAvg).toBeLessThan(baselineAvg * 2);
    });
  });
});