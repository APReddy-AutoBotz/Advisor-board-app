/**
 * LLM Integration Layer Tests
 * Comprehensive test suite for the LLM integration system
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LLMIntegrationLayer } from '../LLMIntegrationLayer';
import { LLMConfigManager } from '../LLMConfigManager';
import { OpenAIProvider } from '../OpenAIProvider';
import { AnthropicProvider } from '../AnthropicProvider';
import type { EnvironmentConfig } from '../../../types/llm';
import { LLMError, LLMErrorType } from '../../../types/llm';

// Mock fetch globally
global.fetch = vi.fn();

describe('LLMIntegrationLayer', () => {
  let integrationLayer: LLMIntegrationLayer;
  let mockConfig: EnvironmentConfig;

  beforeEach(() => {
    mockConfig = {
      llmProviders: {
        openai: {
          apiKey: 'test-openai-key',
          model: 'gpt-3.5-turbo'
        },
        anthropic: {
          apiKey: 'test-anthropic-key',
          model: 'claude-3-sonnet-20240229'
        }
      },
      defaultProvider: 'openai',
      enableCaching: true,
      maxConcurrentRequests: 10,
      responseTimeout: 30000,
      retryPolicy: {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2
      }
    };

    integrationLayer = new LLMIntegrationLayer(mockConfig);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Provider Management', () => {
    it('should initialize with default providers', () => {
      const providers = integrationLayer.getAvailableProviders();
      expect(providers).toContain('openai');
      expect(providers).toContain('anthropic');
      expect(providers).toContain('gemini');
      expect(providers).toContain('local');
    });

    it('should set and get active provider', () => {
      integrationLayer.setActiveProvider('anthropic');
      expect(integrationLayer.getActiveProvider()).toBe('anthropic');
    });

    it('should throw error for invalid provider', () => {
      expect(() => {
        integrationLayer.setActiveProvider('invalid-provider');
      }).toThrow(LLMError);
    });

    it('should register custom provider', () => {
      const customProvider = new OpenAIProvider();
      customProvider.name = 'custom-openai';
      
      integrationLayer.registerProvider(customProvider);
      const providers = integrationLayer.getAvailableProviders();
      expect(providers).toContain('custom-openai');
    });
  });

  describe('Response Generation', () => {
    it('should generate response with active provider', async () => {
      const mockResponse = {
        choices: [{
          message: { content: 'Test response' }
        }],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30
        }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await integrationLayer.generateResponse('Test prompt');
      
      expect(result.content).toBe('Test response');
      expect(result.provider).toBe('openai');
      expect(result.usage?.totalTokens).toBe(30);
    });

    it('should use cached response when available', async () => {
      const mockResponse = {
        choices: [{
          message: { content: 'Cached response' }
        }]
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      // First call
      const result1 = await integrationLayer.generateResponse('Test prompt');
      
      // Second call should use cache (no additional fetch)
      const result2 = await integrationLayer.generateResponse('Test prompt');
      
      expect(result1.content).toBe(result2.content);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should fallback to secondary provider on failure', async () => {
      // Mock OpenAI failure (with retries) and Anthropic success
      (global.fetch as any)
        .mockRejectedValueOnce(new Error('OpenAI API error'))
        .mockRejectedValueOnce(new Error('OpenAI API error'))
        .mockRejectedValueOnce(new Error('OpenAI API error'))
        .mockRejectedValueOnce(new Error('OpenAI API error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            content: [{
              type: 'text',
              text: 'Anthropic response'
            }],
            usage: {
              input_tokens: 10,
              output_tokens: 20
            }
          })
        });

      const result = await integrationLayer.generateResponse('Test prompt');
      
      expect(result.content).toBe('Anthropic response');
      expect(result.provider).toBe('anthropic');
    }, 20000);

    it('should throw error when all providers fail', async () => {
      (global.fetch as any).mockRejectedValue(new Error('All APIs down'));

      await expect(
        integrationLayer.generateResponse('Test prompt')
      ).rejects.toThrow(LLMError);
    }, 20000);
  });

  describe('Provider Testing', () => {
    it('should test provider connectivity', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Test' } }]
        })
      });

      const result = await integrationLayer.testProvider('openai');
      expect(result).toBe(true);
    });

    it('should return false for failed provider test', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Connection failed'));

      const result = await integrationLayer.testProvider('openai');
      expect(result).toBe(false);
    });

    it('should get status for all providers', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Test' } }]
        })
      });

      const status = await integrationLayer.getProviderStatus();
      
      expect(typeof status.openai).toBe('boolean');
      expect(typeof status.anthropic).toBe('boolean');
      expect(typeof status.gemini).toBe('boolean');
      expect(typeof status.local).toBe('boolean');
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      const newConfig = {
        defaultProvider: 'anthropic',
        enableCaching: false
      };

      integrationLayer.updateConfig(newConfig);
      const config = integrationLayer.getConfig();
      
      expect(config.defaultProvider).toBe('anthropic');
      expect(config.enableCaching).toBe(false);
    });

    it('should get current configuration', () => {
      const config = integrationLayer.getConfig();
      expect(config.defaultProvider).toBe('openai');
      expect(config.enableCaching).toBe(true);
    });
  });

  describe('Cache Management', () => {
    it('should clear cache', async () => {
      const mockResponse = {
        choices: [{
          message: { content: 'Test response' }
        }]
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      // Generate cached response
      await integrationLayer.generateResponse('Test prompt');
      
      // Clear cache
      integrationLayer.clearCache();
      
      // Next call should fetch again
      await integrationLayer.generateResponse('Test prompt');
      
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValue(new TypeError('Network error'));

      await expect(
        integrationLayer.generateResponse('Test prompt')
      ).rejects.toThrow(LLMError);
    }, 20000);

    it('should handle HTTP errors', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' })
      });

      await expect(
        integrationLayer.generateResponse('Test prompt')
      ).rejects.toThrow(LLMError);
    });

    it('should handle rate limiting', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ error: 'Rate limited' })
      });

      await expect(
        integrationLayer.generateResponse('Test prompt')
      ).rejects.toThrow(LLMError);
    }, 20000);
  });
});