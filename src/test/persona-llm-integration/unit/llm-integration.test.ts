/**
 * Unit Tests for LLM Integration
 * 
 * Comprehensive test suite covering:
 * - Multi-provider LLM integration (OpenAI, Anthropic, Gemini, Local)
 * - Provider switching and failover mechanisms
 * - API error handling and retry logic
 * - Configuration management and validation
 */

import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { LLMIntegrationLayer } from '../../../services/llm/LLMIntegrationLayer';
import { OpenAIProvider } from '../../../services/llm/OpenAIProvider';
import { AnthropicProvider } from '../../../services/llm/AnthropicProvider';
import { GeminiProvider } from '../../../services/llm/GeminiProvider';
import { LocalProvider } from '../../../services/llm/LocalProvider';
import { LLMError, LLMErrorType } from '../../../types/llm';
import type { EnvironmentConfig, LLMResponse, LLMConfig } from '../../../types/llm';

// Mock fetch globally
global.fetch = vi.fn();

describe('LLM Integration - Unit Tests', () => {
  let integrationLayer: LLMIntegrationLayer;
  let mockFetch: Mock;
  let mockConfig: EnvironmentConfig;

  const mockResponses = {
    openai: {
      choices: [{
        message: { 
          content: 'This is a comprehensive product strategy response from OpenAI...',
          role: 'assistant'
        }
      }],
      usage: {
        prompt_tokens: 150,
        completion_tokens: 300,
        total_tokens: 450
      },
      model: 'gpt-4',
      id: 'chatcmpl-test123'
    },

    anthropic: {
      content: [{
        type: 'text',
        text: 'This is a detailed strategic analysis from Anthropic Claude...'
      }],
      usage: {
        input_tokens: 150,
        output_tokens: 300
      },
      model: 'claude-3-sonnet-20240229',
      id: 'msg_test123'
    },

    gemini: {
      candidates: [{
        content: {
          parts: [{
            text: 'This is a comprehensive response from Google Gemini...'
          }]
        }
      }],
      usageMetadata: {
        promptTokenCount: 150,
        candidatesTokenCount: 300,
        totalTokenCount: 450
      }
    },

    local: {
      response: 'This is a response from the local model...',
      tokens_used: 450,
      model: 'local-llama-7b'
    }
  };

  beforeEach(() => {
    mockFetch = vi.mocked(global.fetch);
    mockFetch.mockClear();

    mockConfig = {
      llmProviders: {
        openai: {
          apiKey: 'sk-test-openai-key-123',
          model: 'gpt-4',
          baseURL: 'https://api.openai.com/v1'
        },
        anthropic: {
          apiKey: 'sk-ant-test-key-123',
          model: 'claude-3-sonnet-20240229',
          baseURL: 'https://api.anthropic.com'
        },
        gemini: {
          apiKey: 'test-gemini-key-123',
          model: 'gemini-pro',
          baseURL: 'https://generativelanguage.googleapis.com/v1'
        },
        local: {
          baseURL: 'http://localhost:11434',
          model: 'llama2:7b'
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

  describe('Provider Initialization and Management', () => {
    it('should initialize with all supported providers', () => {
      const providers = integrationLayer.getAvailableProviders();
      
      expect(providers).toContain('openai');
      expect(providers).toContain('anthropic');
      expect(providers).toContain('gemini');
      expect(providers).toContain('local');
      expect(providers.length).toBe(4);
    });

    it('should set and get active provider correctly', () => {
      expect(integrationLayer.getActiveProvider()).toBe('openai');

      integrationLayer.setActiveProvider('anthropic');
      expect(integrationLayer.getActiveProvider()).toBe('anthropic');

      integrationLayer.setActiveProvider('gemini');
      expect(integrationLayer.getActiveProvider()).toBe('gemini');
    });

    it('should throw error for invalid provider', () => {
      expect(() => {
        integrationLayer.setActiveProvider('invalid-provider');
      }).toThrow(LLMError);

      expect(() => {
        integrationLayer.setActiveProvider('gpt-5'); // Non-existent provider
      }).toThrow(LLMError);
    });

    it('should register custom providers', () => {
      const customProvider = new OpenAIProvider();
      customProvider.name = 'custom-openai';
      
      integrationLayer.registerProvider(customProvider);
      const providers = integrationLayer.getAvailableProviders();
      
      expect(providers).toContain('custom-openai');
      expect(providers.length).toBe(5);
    });

    it('should validate provider configurations', () => {
      const validConfig = integrationLayer.validateProviderConfig('openai');
      expect(validConfig).toBe(true);

      // Test with missing API key
      const invalidConfig = {
        ...mockConfig,
        llmProviders: {
          ...mockConfig.llmProviders,
          openai: { model: 'gpt-4' } // Missing apiKey
        }
      };

      const invalidLayer = new LLMIntegrationLayer(invalidConfig);
      expect(invalidLayer.validateProviderConfig('openai')).toBe(false);
    });
  });

  describe('OpenAI Provider Integration', () => {
    it('should generate response using OpenAI API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponses.openai)
      });

      const prompt = 'You are Sarah Kim, CPO at Stripe. How do I achieve product-market fit?';
      const result = await integrationLayer.generateResponse(prompt);

      expect(result.content).toBe('This is a comprehensive product strategy response from OpenAI...');
      expect(result.provider).toBe('openai');
      expect(result.model).toBe('gpt-4');
      expect(result.usage?.totalTokens).toBe(450);
      expect(result.usage?.promptTokens).toBe(150);
      expect(result.usage?.completionTokens).toBe(300);
    });

    it('should handle OpenAI API errors correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          error: {
            message: 'Invalid API key',
            type: 'invalid_request_error'
          }
        })
      });

      await expect(
        integrationLayer.generateResponse('Test prompt')
      ).rejects.toThrow(LLMError);
    });

    it('should handle OpenAI rate limiting', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () => Promise.resolve({
          error: {
            message: 'Rate limit exceeded',
            type: 'rate_limit_error'
          }
        })
      });

      await expect(
        integrationLayer.generateResponse('Test prompt')
      ).rejects.toThrow(LLMError);
    });

    it('should use custom OpenAI configuration', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponses.openai)
      });

      const customConfig: Partial<LLMConfig> = {
        temperature: 0.7,
        maxTokens: 1000,
        model: 'gpt-3.5-turbo'
      };

      await integrationLayer.generateResponse('Test prompt', customConfig);

      const fetchCall = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body as string);

      expect(requestBody.temperature).toBe(0.7);
      expect(requestBody.max_tokens).toBe(1000);
      expect(requestBody.model).toBe('gpt-3.5-turbo');
    });
  });

  describe('Anthropic Provider Integration', () => {
    beforeEach(() => {
      integrationLayer.setActiveProvider('anthropic');
    });

    it('should generate response using Anthropic API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponses.anthropic)
      });

      const result = await integrationLayer.generateResponse('Test prompt');

      expect(result.content).toBe('This is a detailed strategic analysis from Anthropic Claude...');
      expect(result.provider).toBe('anthropic');
      expect(result.model).toBe('claude-3-sonnet-20240229');
      expect(result.usage?.totalTokens).toBe(450);
    });

    it('should handle Anthropic-specific error formats', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          type: 'error',
          error: {
            type: 'invalid_request_error',
            message: 'Invalid request format'
          }
        })
      });

      await expect(
        integrationLayer.generateResponse('Test prompt')
      ).rejects.toThrow(LLMError);
    });

    it('should format Anthropic requests correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponses.anthropic)
      });

      await integrationLayer.generateResponse('Test prompt');

      const fetchCall = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body as string);

      expect(requestBody.messages).toBeDefined();
      expect(requestBody.messages[0].role).toBe('user');
      expect(requestBody.messages[0].content).toBe('Test prompt');
      expect(requestBody.model).toBe('claude-3-sonnet-20240229');
    });
  });

  describe('Gemini Provider Integration', () => {
    beforeEach(() => {
      integrationLayer.setActiveProvider('gemini');
    });

    it('should generate response using Gemini API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponses.gemini)
      });

      const result = await integrationLayer.generateResponse('Test prompt');

      expect(result.content).toBe('This is a comprehensive response from Google Gemini...');
      expect(result.provider).toBe('gemini');
      expect(result.usage?.totalTokens).toBe(450);
    });

    it('should handle Gemini API key in URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponses.gemini)
      });

      await integrationLayer.generateResponse('Test prompt');

      const fetchCall = mockFetch.mock.calls[0];
      const url = fetchCall[0] as string;

      expect(url).toContain('key=test-gemini-key-123');
    });

    it('should format Gemini requests correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponses.gemini)
      });

      await integrationLayer.generateResponse('Test prompt');

      const fetchCall = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body as string);

      expect(requestBody.contents).toBeDefined();
      expect(requestBody.contents[0].parts[0].text).toBe('Test prompt');
    });
  });

  describe('Local Provider Integration', () => {
    beforeEach(() => {
      integrationLayer.setActiveProvider('local');
    });

    it('should generate response using local model', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponses.local)
      });

      const result = await integrationLayer.generateResponse('Test prompt');

      expect(result.content).toBe('This is a response from the local model...');
      expect(result.provider).toBe('local');
      expect(result.model).toBe('local-llama-7b');
    });

    it('should handle local model unavailability', async () => {
      mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));

      await expect(
        integrationLayer.generateResponse('Test prompt')
      ).rejects.toThrow(LLMError);
    });

    it('should format local model requests correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponses.local)
      });

      await integrationLayer.generateResponse('Test prompt');

      const fetchCall = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body as string);

      expect(requestBody.model).toBe('llama2:7b');
      expect(requestBody.prompt).toBe('Test prompt');
    });
  });

  describe('Provider Failover and Retry Logic', () => {
    it('should failover to secondary provider on primary failure', async () => {
      // OpenAI fails, should fallback to Anthropic
      mockFetch
        .mockRejectedValueOnce(new Error('OpenAI API error'))
        .mockRejectedValueOnce(new Error('OpenAI API error'))
        .mockRejectedValueOnce(new Error('OpenAI API error'))
        .mockRejectedValueOnce(new Error('OpenAI API error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponses.anthropic)
        });

      const result = await integrationLayer.generateResponse('Test prompt');

      expect(result.content).toBe('This is a detailed strategic analysis from Anthropic Claude...');
      expect(result.provider).toBe('anthropic');
      expect(mockFetch).toHaveBeenCalledTimes(5); // 4 OpenAI retries + 1 Anthropic success
    }, 20000);

    it('should retry with exponential backoff', async () => {
      const startTime = Date.now();

      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponses.openai)
        });

      await integrationLayer.generateResponse('Test prompt');

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should have waited for backoff (at least 1 second for first retry)
      expect(duration).toBeGreaterThan(1000);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    }, 10000);

    it('should not retry non-retryable errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          error: {
            message: 'Invalid API key',
            type: 'invalid_request_error'
          }
        })
      });

      await expect(
        integrationLayer.generateResponse('Test prompt')
      ).rejects.toThrow(LLMError);

      expect(mockFetch).toHaveBeenCalledTimes(1); // No retries for auth errors
    });

    it('should exhaust all providers before failing', async () => {
      // All providers fail
      mockFetch.mockRejectedValue(new Error('All APIs down'));

      await expect(
        integrationLayer.generateResponse('Test prompt')
      ).rejects.toThrow(LLMError);

      // Should have tried all providers with retries
      expect(mockFetch).toHaveBeenCalledTimes(16); // 4 providers × 4 attempts each
    }, 30000);

    it('should respect maximum retry limits', async () => {
      const limitedConfig = {
        ...mockConfig,
        retryPolicy: {
          maxRetries: 1,
          baseDelay: 100,
          maxDelay: 1000,
          backoffMultiplier: 2
        }
      };

      const limitedLayer = new LLMIntegrationLayer(limitedConfig);
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(
        limitedLayer.generateResponse('Test prompt')
      ).rejects.toThrow(LLMError);

      // Should have tried each provider only 2 times (initial + 1 retry)
      expect(mockFetch).toHaveBeenCalledTimes(8); // 4 providers × 2 attempts each
    }, 10000);
  });

  describe('Response Caching', () => {
    it('should cache successful responses', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponses.openai)
      });

      const prompt = 'Test caching prompt';

      // First call
      const result1 = await integrationLayer.generateResponse(prompt);
      
      // Second call should use cache
      const result2 = await integrationLayer.generateResponse(prompt);

      expect(result1.content).toBe(result2.content);
      expect(mockFetch).toHaveBeenCalledTimes(1); // Only one API call
    });

    it('should respect cache TTL', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponses.openai)
      });

      const prompt = 'Test TTL prompt';

      // First call
      await integrationLayer.generateResponse(prompt);

      // Mock time passage beyond TTL (default 10 minutes)
      const originalNow = Date.now;
      Date.now = vi.fn(() => originalNow() + 11 * 60 * 1000);

      // Second call should not use expired cache
      await integrationLayer.generateResponse(prompt);

      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Restore Date.now
      Date.now = originalNow;
    });

    it('should allow cache clearing', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponses.openai)
      });

      const prompt = 'Test cache clear prompt';

      // First call
      await integrationLayer.generateResponse(prompt);

      // Clear cache
      integrationLayer.clearCache();

      // Second call should not use cache
      await integrationLayer.generateResponse(prompt);

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should not cache failed responses', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('API error'))
        .mockRejectedValueOnce(new Error('API error'))
        .mockRejectedValueOnce(new Error('API error'))
        .mockRejectedValueOnce(new Error('API error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponses.openai)
        });

      const prompt = 'Test failed caching prompt';

      // First call fails, should not be cached
      await expect(
        integrationLayer.generateResponse(prompt)
      ).rejects.toThrow();

      // Second call should try again (not use cached failure)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponses.openai)
      });

      const result = await integrationLayer.generateResponse(prompt);
      expect(result.content).toBe('This is a comprehensive product strategy response from OpenAI...');
    }, 20000);
  });

  describe('Configuration Management', () => {
    it('should update configuration dynamically', () => {
      const newConfig = {
        defaultProvider: 'anthropic',
        enableCaching: false,
        maxConcurrentRequests: 20
      };

      integrationLayer.updateConfig(newConfig);
      const currentConfig = integrationLayer.getConfig();

      expect(currentConfig.defaultProvider).toBe('anthropic');
      expect(currentConfig.enableCaching).toBe(false);
      expect(currentConfig.maxConcurrentRequests).toBe(20);
    });

    it('should validate configuration changes', () => {
      const invalidConfig = {
        defaultProvider: 'invalid-provider'
      };

      expect(() => {
        integrationLayer.updateConfig(invalidConfig);
      }).toThrow(LLMError);
    });

    it('should get current configuration', () => {
      const config = integrationLayer.getConfig();

      expect(config.defaultProvider).toBe('openai');
      expect(config.enableCaching).toBe(true);
      expect(config.maxConcurrentRequests).toBe(10);
      expect(config.responseTimeout).toBe(30000);
    });

    it('should handle partial configuration updates', () => {
      const partialConfig = {
        responseTimeout: 60000
      };

      integrationLayer.updateConfig(partialConfig);
      const config = integrationLayer.getConfig();

      expect(config.responseTimeout).toBe(60000);
      expect(config.defaultProvider).toBe('openai'); // Should remain unchanged
      expect(config.enableCaching).toBe(true); // Should remain unchanged
    });
  });

  describe('Provider Health Checks', () => {
    it('should test individual provider connectivity', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponses.openai)
      });

      const isHealthy = await integrationLayer.testProvider('openai');
      expect(isHealthy).toBe(true);
    });

    it('should detect unhealthy providers', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection failed'));

      const isHealthy = await integrationLayer.testProvider('openai');
      expect(isHealthy).toBe(false);
    });

    it('should get status for all providers', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockResponses.openai) })
        .mockRejectedValueOnce(new Error('Anthropic down'))
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockResponses.gemini) })
        .mockRejectedValueOnce(new Error('Local model down'));

      const status = await integrationLayer.getProviderStatus();

      expect(status.openai).toBe(true);
      expect(status.anthropic).toBe(false);
      expect(status.gemini).toBe(true);
      expect(status.local).toBe(false);
    });

    it('should perform comprehensive health check', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponses.openai)
      });

      const health = await integrationLayer.healthCheck();

      expect(health).toHaveProperty('providers');
      expect(health).toHaveProperty('cacheStatus');
      expect(health).toHaveProperty('configValid');
      expect(health.configValid).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle network timeouts', async () => {
      const timeoutConfig = {
        ...mockConfig,
        responseTimeout: 100 // Very short timeout
      };

      const timeoutLayer = new LLMIntegrationLayer(timeoutConfig);

      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve(mockResponses.openai)
        }), 200)) // Longer than timeout
      );

      await expect(
        timeoutLayer.generateResponse('Test prompt')
      ).rejects.toThrow(LLMError);
    });

    it('should handle malformed API responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ invalid: 'response' })
      });

      await expect(
        integrationLayer.generateResponse('Test prompt')
      ).rejects.toThrow(LLMError);
    });

    it('should handle empty responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: { content: '' }
          }]
        })
      });

      await expect(
        integrationLayer.generateResponse('Test prompt')
      ).rejects.toThrow(LLMError);
    });

    it('should handle very large prompts', async () => {
      const largePrompt = 'This is a very large prompt. '.repeat(10000);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponses.openai)
      });

      const result = await integrationLayer.generateResponse(largePrompt);
      expect(result.content).toBeDefined();
    });

    it('should handle concurrent request limits', async () => {
      const limitedConfig = {
        ...mockConfig,
        maxConcurrentRequests: 2
      };

      const limitedLayer = new LLMIntegrationLayer(limitedConfig);

      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve(mockResponses.openai)
        }), 100))
      );

      // Start 5 concurrent requests
      const promises = Array.from({ length: 5 }, (_, i) => 
        limitedLayer.generateResponse(`Test prompt ${i}`)
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(5);
      expect(results.every(r => r.content)).toBe(true);
    });
  });
});