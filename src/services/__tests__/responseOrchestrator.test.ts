/**
 * Response Orchestrator Service Tests
 * 
 * Comprehensive test suite for the response orchestrator including:
 * - Concurrent processing
 * - Error handling and fallbacks
 * - Caching functionality
 * - Performance optimization
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { ResponseOrchestrator } from '../responseOrchestrator';
import { PersonaPromptService } from '../personaPromptService';
import { LLMIntegrationLayer } from '../llm/LLMIntegrationLayer';
import { EnhancedStaticResponseGenerator } from '../enhancedStaticResponseGenerator';
import { QuestionAnalysisEngine } from '../questionAnalysisEngine';
import { LLMError, LLMErrorType } from '../../types/llm';
import type { Advisor, DomainId } from '../../types/domain';
import type { EnvironmentConfig, LLMResponse } from '../../types/llm';

// Mock all dependencies
vi.mock('../personaPromptService');
vi.mock('../llm/LLMIntegrationLayer');
vi.mock('../enhancedStaticResponseGenerator');
vi.mock('../questionAnalysisEngine');

describe('ResponseOrchestrator', () => {
  let orchestrator: ResponseOrchestrator;
  let mockPersonaService: Mock;
  let mockLLMLayer: Mock;
  let mockStaticGenerator: Mock;
  let mockQuestionAnalyzer: Mock;
  
  const mockEnvironmentConfig: EnvironmentConfig = {
    llmProviders: {
      openai: { apiKey: 'test-key', model: 'gpt-4' }
    },
    defaultProvider: 'openai',
    enableCaching: true,
    maxConcurrentRequests: 5,
    responseTimeout: 10000,
    retryPolicy: {
      maxRetries: 2,
      baseDelay: 1000,
      maxDelay: 5000,
      backoffMultiplier: 2
    }
  };

  const mockAdvisor: Advisor = {
    id: 'sarah-kim',
    name: 'Sarah Kim',
    expertise: 'Product Strategy',
    background: 'Former CPO at Stripe',
    domain: 'productboard',
    isSelected: true,
    specialties: ['Product Strategy', 'Growth']
  };

  const mockQuestionAnalysis = {
    type: 'strategy' as const,
    keywords: ['product', 'strategy'],
    domain: 'productboard' as DomainId,
    confidence: 0.8,
    sentiment: 'neutral' as const,
    complexity: 'medium' as const,
    urgency: 'low' as const
  };

  const mockLLMResponse: LLMResponse = {
    content: 'This is a detailed strategic response...',
    model: 'gpt-4',
    provider: 'openai',
    timestamp: new Date(),
    usage: {
      promptTokens: 100,
      completionTokens: 200,
      totalTokens: 300
    }
  };

  const mockStaticResponse = {
    content: 'This is a static fallback response...',
    metadata: {
      responseType: 'static' as const,
      processingTime: 50,
      confidence: 0.7,
      questionAnalysis: mockQuestionAnalysis,
      frameworks: ['North Star Framework']
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mocks
    mockPersonaService = vi.mocked(PersonaPromptService).prototype.generatePersonaPrompt = vi.fn()
      .mockReturnValue('You are Sarah Kim, a strategic product expert...');
    
    mockLLMLayer = vi.mocked(LLMIntegrationLayer).prototype.generateResponse = vi.fn()
      .mockResolvedValue(mockLLMResponse);
    
    vi.mocked(LLMIntegrationLayer).prototype.getProviderStatus = vi.fn()
      .mockResolvedValue({ openai: true, anthropic: false });
    
    mockStaticGenerator = vi.mocked(EnhancedStaticResponseGenerator).prototype.generateResponse = vi.fn()
      .mockResolvedValue(mockStaticResponse);
    
    mockQuestionAnalyzer = vi.mocked(QuestionAnalysisEngine).prototype.analyze = vi.fn()
      .mockReturnValue(mockQuestionAnalysis);

    orchestrator = new ResponseOrchestrator(mockEnvironmentConfig);
  });

  describe('generateAdvisorResponses', () => {
    it('should generate responses for multiple advisors concurrently', async () => {
      const advisors = [
        mockAdvisor,
        { ...mockAdvisor, id: 'marcus-chen', name: 'Marcus Chen' }
      ];
      const question = 'What is the best product strategy?';

      const result = await orchestrator.generateAdvisorResponses(
        question,
        advisors,
        'productboard'
      );

      expect(result.responses).toHaveLength(2);
      expect(result.successCount).toBe(2);
      expect(result.errorCount).toBe(0);
      expect(result.questionAnalysis).toEqual(mockQuestionAnalysis);
      expect(mockLLMLayer).toHaveBeenCalledTimes(2);
    });

    it('should respect concurrent request limits', async () => {
      const advisors = Array.from({ length: 10 }, (_, i) => ({
        ...mockAdvisor,
        id: `advisor-${i}`,
        name: `Advisor ${i}`
      }));

      const question = 'Test question';
      
      // Mock LLM to have a delay so we can test concurrency
      mockLLMLayer.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockLLMResponse), 100))
      );

      const startTime = Date.now();
      const result = await orchestrator.generateAdvisorResponses(
        question,
        advisors,
        'productboard'
      );
      const endTime = Date.now();

      expect(result.responses).toHaveLength(10);
      expect(result.successCount).toBe(10);
      
      // Should process in batches, not all at once
      // With batch size 5 and 100ms delay, should take ~200ms, not 1000ms
      expect(endTime - startTime).toBeLessThan(500);
    });

    it('should handle LLM failures with static fallback', async () => {
      mockLLMLayer.mockRejectedValue(new LLMError(
        LLMErrorType.API_UNAVAILABLE,
        'OpenAI API is down',
        'openai',
        true
      ));

      const result = await orchestrator.generateAdvisorResponses(
        'Test question',
        [mockAdvisor],
        'productboard'
      );

      expect(result.responses).toHaveLength(1);
      expect(result.responses[0].metadata.responseType).toBe('static');
      expect(result.responses[0].metadata.errorInfo?.fallbackUsed).toBe(true);
      expect(result.successCount).toBe(1);
      expect(mockStaticGenerator).toHaveBeenCalled();
    });

    it('should retry failed LLM requests', async () => {
      mockLLMLayer
        .mockRejectedValueOnce(new LLMError(
          LLMErrorType.NETWORK_ERROR,
          'Network timeout',
          'openai',
          true
        ))
        .mockResolvedValueOnce(mockLLMResponse);

      const result = await orchestrator.generateAdvisorResponses(
        'Test question',
        [mockAdvisor],
        'productboard'
      );

      expect(result.responses).toHaveLength(1);
      expect(result.responses[0].metadata.responseType).toBe('llm');
      expect(result.successCount).toBe(1);
      expect(mockLLMLayer).toHaveBeenCalledTimes(2); // Initial call + retry
    });

    it('should not retry non-retryable errors', async () => {
      mockLLMLayer.mockRejectedValue(new LLMError(
        LLMErrorType.AUTHENTICATION_ERROR,
        'Invalid API key',
        'openai',
        false // Not retryable
      ));

      const result = await orchestrator.generateAdvisorResponses(
        'Test question',
        [mockAdvisor],
        'productboard'
      );

      expect(result.responses).toHaveLength(1);
      expect(result.responses[0].metadata.responseType).toBe('static');
      expect(mockLLMLayer).toHaveBeenCalledTimes(1); // No retry
    });

    it('should handle timeout errors', async () => {
      // Create orchestrator with very short timeout
      const shortTimeoutOrchestrator = new ResponseOrchestrator(
        mockEnvironmentConfig,
        { responseTimeout: 10 } // 10ms timeout
      );

      mockLLMLayer.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockLLMResponse), 100))
      );

      const result = await shortTimeoutOrchestrator.generateAdvisorResponses(
        'Test question',
        [mockAdvisor],
        'productboard'
      );

      expect(result.responses).toHaveLength(1);
      expect(result.responses[0].metadata.responseType).toBe('static');
      expect(result.responses[0].metadata.errorInfo?.type).toBe('network_error');
    });
  });

  describe('caching functionality', () => {
    it('should cache successful responses', async () => {
      const question = 'Test question';
      
      // First call
      await orchestrator.generateAdvisorResponses(
        question,
        [mockAdvisor],
        'productboard'
      );

      // Second call with same question should use cache
      await orchestrator.generateAdvisorResponses(
        question,
        [mockAdvisor],
        'productboard'
      );

      // LLM should only be called once due to caching
      expect(mockLLMLayer).toHaveBeenCalledTimes(1);
    });

    it('should respect cache TTL', async () => {
      const question = 'Test question';
      
      // First call
      await orchestrator.generateAdvisorResponses(
        question,
        [mockAdvisor],
        'productboard'
      );

      // Mock time passage beyond TTL
      vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 11 * 60 * 1000); // 11 minutes

      // Second call should not use expired cache
      await orchestrator.generateAdvisorResponses(
        question,
        [mockAdvisor],
        'productboard'
      );

      expect(mockLLMLayer).toHaveBeenCalledTimes(2);
    });

    it('should allow cache clearing', async () => {
      const question = 'Test question';
      
      // First call
      await orchestrator.generateAdvisorResponses(
        question,
        [mockAdvisor],
        'productboard'
      );

      // Clear cache
      orchestrator.clearCache();

      // Second call should not use cache
      await orchestrator.generateAdvisorResponses(
        question,
        [mockAdvisor],
        'productboard'
      );

      expect(mockLLMLayer).toHaveBeenCalledTimes(2);
    });
  });

  describe('error handling', () => {
    it('should create error responses for completely failed advisors', async () => {
      mockLLMLayer.mockRejectedValue(new Error('Complete failure'));
      mockStaticGenerator.mockRejectedValue(new Error('Static generator failed'));

      const result = await orchestrator.generateAdvisorResponses(
        'Test question',
        [mockAdvisor],
        'productboard'
      );

      expect(result.responses).toHaveLength(1);
      expect(result.responses[0].content).toContain('unable to provide');
      expect(result.responses[0].metadata.confidence).toBe(0.1);
      expect(result.errorCount).toBe(1);
      expect(result.successCount).toBe(0);
    });

    it('should handle mixed success and failure scenarios', async () => {
      const advisors = [
        mockAdvisor,
        { ...mockAdvisor, id: 'failing-advisor', name: 'Failing Advisor' }
      ];

      // Reset the mock to ensure proper call order
      mockLLMLayer.mockReset();
      mockLLMLayer
        .mockResolvedValueOnce(mockLLMResponse) // First advisor succeeds
        .mockRejectedValueOnce(new Error('Second advisor fails')); // Second fails

      const result = await orchestrator.generateAdvisorResponses(
        'Test question',
        advisors,
        'productboard'
      );

      expect(result.responses).toHaveLength(2);
      expect(result.successCount).toBe(2); // Both get responses (one LLM, one static fallback)
      
      // Find responses by advisor ID to avoid order dependency
      const firstResponse = result.responses.find(r => r.advisorId === 'sarah-kim');
      const secondResponse = result.responses.find(r => r.advisorId === 'failing-advisor');
      
      expect(firstResponse?.metadata.responseType).toBe('llm');
      expect(secondResponse?.metadata.responseType).toBe('static');
    });
  });

  describe('configuration management', () => {
    it('should allow configuration updates', () => {
      const newConfig = {
        maxConcurrentRequests: 20,
        responseTimeout: 30000
      };

      orchestrator.updateConfig(newConfig);
      const currentConfig = orchestrator.getConfig();

      expect(currentConfig.maxConcurrentRequests).toBe(20);
      expect(currentConfig.responseTimeout).toBe(30000);
    });

    it('should provide cache statistics', () => {
      const stats = orchestrator.getCacheStats();
      
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('hitRate');
      expect(typeof stats.size).toBe('number');
      expect(typeof stats.hitRate).toBe('number');
    });
  });

  describe('health check', () => {
    it('should perform comprehensive health check', async () => {
      const health = await orchestrator.healthCheck();

      expect(health).toHaveProperty('llmProviders');
      expect(health).toHaveProperty('staticGenerator');
      expect(health).toHaveProperty('questionAnalyzer');
      expect(health).toHaveProperty('personaService');
      
      expect(health.llmProviders).toEqual({ openai: true, anthropic: false });
      expect(health.staticGenerator).toBe(true);
      expect(health.questionAnalyzer).toBe(true);
      expect(health.personaService).toBe(true);
    });

    it('should handle health check failures gracefully', async () => {
      vi.mocked(LLMIntegrationLayer).prototype.getProviderStatus
        .mockRejectedValue(new Error('Health check failed'));

      const health = await orchestrator.healthCheck();

      expect(health.llmProviders).toEqual({});
      expect(health.staticGenerator).toBe(true); // Other services still work
    });
  });

  describe('performance optimization', () => {
    it('should process large numbers of advisors efficiently', async () => {
      const advisors = Array.from({ length: 50 }, (_, i) => ({
        ...mockAdvisor,
        id: `advisor-${i}`,
        name: `Advisor ${i}`
      }));

      const startTime = Date.now();
      const result = await orchestrator.generateAdvisorResponses(
        'Test question',
        advisors,
        'productboard'
      );
      const endTime = Date.now();

      expect(result.responses).toHaveLength(50);
      expect(result.successCount).toBe(50);
      
      // Should complete in reasonable time (less than 5 seconds)
      expect(endTime - startTime).toBeLessThan(5000);
    });

    it('should clean up cache when it grows too large', async () => {
      // Create orchestrator with caching enabled
      const cachingOrchestrator = new ResponseOrchestrator(mockEnvironmentConfig, {
        enableCaching: true
      });

      // Fill cache beyond limit with unique questions to avoid cache hits
      const promises = [];
      for (let i = 0; i < 150; i++) {
        promises.push(
          cachingOrchestrator.generateAdvisorResponses(
            `Unique question ${i} ${Date.now()}`,
            [{ ...mockAdvisor, id: `advisor-${i}` }],
            'productboard'
          )
        );
      }
      
      await Promise.all(promises);

      const stats = cachingOrchestrator.getCacheStats();
      expect(stats.size).toBeLessThanOrEqual(100); // Should be cleaned up
    });
  });

  describe('framework integration', () => {
    it('should include relevant frameworks in response metadata', async () => {
      const result = await orchestrator.generateAdvisorResponses(
        'What is the best strategy?',
        [mockAdvisor],
        'productboard'
      );

      expect(result.responses[0].metadata.frameworks).toBeDefined();
      expect(result.responses[0].metadata.frameworks).toContain('Jobs-to-be-Done');
    });

    it('should adapt frameworks based on domain', async () => {
      const clinicalAdvisor = {
        ...mockAdvisor,
        domain: 'cliniboard' as DomainId
      };

      const result = await orchestrator.generateAdvisorResponses(
        'Clinical trial strategy?',
        [clinicalAdvisor],
        'cliniboard'
      );

      expect(result.responses[0].metadata.frameworks).toContain('ICH Guidelines');
    });
  });
});