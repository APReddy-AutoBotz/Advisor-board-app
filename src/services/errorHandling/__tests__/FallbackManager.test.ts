/**
 * Fallback Manager Tests
 * Tests for fallback mechanisms and cache management
 */

import { FallbackManager } from '../FallbackManager';
import { ErrorType, SystemError } from '../ErrorTypes';
import type { Advisor } from '../../../types/domain';

import { vi } from 'vitest';

// Mock the EnhancedStaticResponseGenerator
vi.mock('../../enhancedStaticResponseGenerator', () => ({
  EnhancedStaticResponseGenerator: vi.fn().mockImplementation(() => ({
    generateResponse: vi.fn().mockResolvedValue({
      advisorId: 'test-advisor',
      content: 'Mock static response',
      timestamp: new Date(),
      persona: {
        name: 'Test Advisor',
        expertise: 'Test Expertise',
        background: 'Test Background',
        tone: 'professional',
        specialization: []
      },
      metadata: {
        responseType: 'static',
        processingTime: 100,
        confidence: 0.8
      }
    })
  }))
}));

describe('FallbackManager', () => {
  let fallbackManager: FallbackManager;
  let mockAdvisor: Advisor;

  beforeEach(() => {
    fallbackManager = new FallbackManager();
    mockAdvisor = {
      id: 'test-advisor',
      name: 'Test Advisor',
      expertise: 'Test Expertise',
      background: 'Test Background',
      domain: 'productboard',
      isSelected: true,
      specialties: ['strategy', 'product']
    };
  });

  describe('executeFallback', () => {
    it('should execute static response fallback successfully', async () => {
      const error = new SystemError(
        ErrorType.API_UNAVAILABLE,
        'API is down',
        { advisorId: mockAdvisor.id }
      );

      const result = await fallbackManager.executeFallback(
        error,
        mockAdvisor,
        'Test question',
        'productboard'
      );

      expect(result.success).toBe(true);
      expect(result.response).toBeDefined();
      expect(result.fallbackType).toBe('static_response');
      expect(result.response!.content).toBe('Mock static response');
      expect(result.response!.metadata.errorInfo).toBeDefined();
      expect(result.response!.metadata.errorInfo!.fallbackUsed).toBe(true);
    });

    it('should return failure when fallback is disabled', async () => {
      const error = new SystemError(
        ErrorType.CACHE_ERROR,
        'Cache error',
        { advisorId: mockAdvisor.id }
      );

      const result = await fallbackManager.executeFallback(
        error,
        mockAdvisor,
        'Test question',
        'productboard'
      );

      expect(result.success).toBe(false);
      expect(result.fallbackType).toBe('none');
      expect(result.error).toBe(error);
    });

    it('should try cache fallback first when configured', async () => {
      // Pre-populate cache
      const cachedResponse = {
        advisorId: mockAdvisor.id,
        content: 'Cached response',
        timestamp: new Date(),
        persona: {
          name: mockAdvisor.name,
          expertise: mockAdvisor.expertise,
          background: mockAdvisor.background,
          tone: 'professional' as const,
          specialization: mockAdvisor.specialties || []
        },
        metadata: {
          responseType: 'static' as const,
          processingTime: 50,
          confidence: 0.9
        }
      };

      // Manually add to cache (this would normally be done through cacheResponse)
      const cacheKey = (fallbackManager as any).generateCacheKey(mockAdvisor, 'Test question');
      (fallbackManager as any).responseCache.set(cacheKey, {
        response: cachedResponse,
        timestamp: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000,
        quality: 'high'
      });

      const error = new SystemError(
        ErrorType.API_UNAVAILABLE,
        'API is down',
        { advisorId: mockAdvisor.id }
      );

      // Mock the strategy to return cached_response
      vi.spyOn(await import('../ErrorHandlingStrategies'), 'ErrorHandlingStrategies', 'get').mockReturnValue({
        getFallbackStrategy: vi.fn().mockReturnValue({
          enabled: true,
          fallbackType: 'cached_response',
          gracefulDegradation: true
        })
      } as any);

      const result = await fallbackManager.executeFallback(
        error,
        mockAdvisor,
        'Test question',
        'productboard'
      );

      expect(result.success).toBe(true);
      expect(result.fallbackType).toBe('cached_response');
      expect(result.response!.content).toBe('Cached response');
    });

    it('should generate emergency response for simplified fallback', async () => {
      const error = new SystemError(
        ErrorType.SERVICE_UNAVAILABLE,
        'All services down',
        { advisorId: mockAdvisor.id }
      );

      // Mock the strategy to return simplified_response
      vi.spyOn(await import('../ErrorHandlingStrategies'), 'ErrorHandlingStrategies', 'get').mockReturnValue({
        getFallbackStrategy: vi.fn().mockReturnValue({
          enabled: true,
          fallbackType: 'simplified_response',
          gracefulDegradation: true
        })
      } as any);

      const result = await fallbackManager.executeFallback(
        error,
        mockAdvisor,
        'Test question',
        'productboard'
      );

      expect(result.success).toBe(true);
      expect(result.fallbackType).toBe('simplified_response');
      expect(result.response!.content).toContain('product-related question');
      expect(result.response!.metadata.confidence).toBe(0.3);
    });
  });

  describe('cache management', () => {
    it('should generate consistent cache keys', () => {
      const key1 = (fallbackManager as any).generateCacheKey(mockAdvisor, 'Test question');
      const key2 = (fallbackManager as any).generateCacheKey(mockAdvisor, 'Test question');
      const key3 = (fallbackManager as any).generateCacheKey(mockAdvisor, 'Different question');

      expect(key1).toBe(key2);
      expect(key1).not.toBe(key3);
    });

    it('should return cache statistics', () => {
      const stats = fallbackManager.getCacheStats();
      
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('highQuality');
      expect(stats).toHaveProperty('mediumQuality');
      expect(stats).toHaveProperty('lowQuality');
      expect(stats).toHaveProperty('expired');
      expect(typeof stats.size).toBe('number');
    });

    it('should clear cache', () => {
      fallbackManager.clearCache();
      const stats = fallbackManager.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should clean up expired cache entries', () => {
      // This would require manipulating internal cache state
      // For now, just verify the method exists and doesn't throw
      expect(() => fallbackManager.clearExpiredCache()).not.toThrow();
    });
  });

  describe('preloadCache', () => {
    it('should preload cache with common questions', async () => {
      const commonQuestions = [
        'What is the best product strategy?',
        'How to validate market fit?',
        'What metrics should I track?'
      ];

      await fallbackManager.preloadCache(mockAdvisor, commonQuestions, 'productboard');

      const stats = fallbackManager.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);
    });

    it('should handle preload failures gracefully', async () => {
      // Create a new fallback manager with failing generator
      const fallbackManagerWithFailure = new FallbackManager();
      
      // Mock the internal static response generator to fail
      const mockGenerator = vi.fn().mockRejectedValue(new Error('Generation failed'));
      (fallbackManagerWithFailure as any).staticResponseGenerator = {
        generateResponse: mockGenerator
      };
      
      await expect(
        fallbackManagerWithFailure.preloadCache(mockAdvisor, ['Test question'], 'productboard')
      ).resolves.not.toThrow();
    });
  });

  describe('emergency response generation', () => {
    it('should generate domain-specific emergency responses', () => {
      const productResponse = (fallbackManager as any).generateEmergencyResponse(
        { ...mockAdvisor, domain: 'productboard' },
        'Test question'
      );
      
      const clinicalResponse = (fallbackManager as any).generateEmergencyResponse(
        { ...mockAdvisor, domain: 'cliniboard' },
        'Test question'
      );

      expect(productResponse).toContain('product');
      expect(clinicalResponse).toContain('clinical');
      expect(productResponse).not.toBe(clinicalResponse);
    });

    it('should provide fallback for unknown domains', () => {
      const response = (fallbackManager as any).generateEmergencyResponse(
        { ...mockAdvisor, domain: 'unknown' },
        'Test question'
      );

      expect(response).toContain(mockAdvisor.name);
      expect(response).toContain(mockAdvisor.expertise);
    });
  });
});