/**
 * OpenAI Provider Tests
 * Test suite for OpenAI API integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OpenAIProvider } from '../OpenAIProvider';
import type { LLMConfig } from '../../../types/llm';
import { LLMError, LLMErrorType } from '../../../types/llm';

// Mock fetch globally
global.fetch = vi.fn();

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider;
  let mockConfig: LLMConfig;

  beforeEach(() => {
    provider = new OpenAIProvider();
    mockConfig = {
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 1000,
      apiKey: 'test-api-key',
      timeout: 30000
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should have correct name', () => {
      expect(provider.name).toBe('openai');
    });

    it('should be available', () => {
      expect(provider.isAvailable()).toBe(true);
    });

    it('should return default configuration', () => {
      const defaults = provider.getDefaultConfig();
      expect(defaults.provider).toBe('openai');
      expect(defaults.model).toBe('gpt-3.5-turbo');
      expect(defaults.temperature).toBe(0.7);
      expect(defaults.maxTokens).toBe(1000);
    });

    it('should validate valid configuration', () => {
      expect(provider.validateConfig(mockConfig)).toBe(true);
    });

    it('should reject invalid provider', () => {
      const invalidConfig = { ...mockConfig, provider: 'anthropic' as any };
      expect(provider.validateConfig(invalidConfig)).toBe(false);
    });

    it('should reject missing API key', () => {
      const invalidConfig = { ...mockConfig, apiKey: undefined };
      expect(provider.validateConfig(invalidConfig)).toBe(false);
    });

    it('should reject invalid temperature', () => {
      const invalidConfig = { ...mockConfig, temperature: -1 };
      expect(provider.validateConfig(invalidConfig)).toBe(false);
    });

    it('should reject invalid max tokens', () => {
      const invalidConfig = { ...mockConfig, maxTokens: 0 };
      expect(provider.validateConfig(invalidConfig)).toBe(false);
    });
  });

  describe('API Calls', () => {
    it('should make successful API call', async () => {
      const mockResponse = {
        choices: [{
          message: { content: 'Test response from OpenAI' }
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

      const result = await provider.callAPI('Test prompt', mockConfig);

      expect(result.content).toBe('Test response from OpenAI');
      expect(result.provider).toBe('openai');
      expect(result.model).toBe('gpt-3.5-turbo');
      expect(result.usage?.totalTokens).toBe(30);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should handle API errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Invalid API key' })
      });

      await expect(
        provider.callAPI('Test prompt', mockConfig)
      ).rejects.toThrow(LLMError);
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new TypeError('Network error'));

      await expect(
        provider.callAPI('Test prompt', mockConfig)
      ).rejects.toThrow(LLMError);
    });

    it('should handle timeout', async () => {
      const shortTimeoutConfig = { ...mockConfig, timeout: 100 };
      
      (global.fetch as any).mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(resolve, 200))
      );

      await expect(
        provider.callAPI('Test prompt', shortTimeoutConfig)
      ).rejects.toThrow(LLMError);
    });

    it('should handle invalid response structure', async () => {
      const invalidResponse = { invalid: 'response' };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(invalidResponse)
      });

      await expect(
        provider.callAPI('Test prompt', mockConfig)
      ).rejects.toThrow(LLMError);
    });

    it('should handle missing message content', async () => {
      const invalidResponse = {
        choices: [{ message: {} }]
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(invalidResponse)
      });

      await expect(
        provider.callAPI('Test prompt', mockConfig)
      ).rejects.toThrow(LLMError);
    });
  });

  describe('Error Handling', () => {
    it('should handle 401 authentication error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' })
      });

      try {
        await provider.callAPI('Test prompt', mockConfig);
      } catch (error) {
        expect(error).toBeInstanceOf(LLMError);
        expect((error as LLMError).type).toBe(LLMErrorType.AUTHENTICATION_ERROR);
        expect((error as LLMError).retryable).toBe(false);
      }
    });

    it('should handle 429 rate limiting', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ error: 'Rate limited' })
      });

      try {
        await provider.callAPI('Test prompt', mockConfig);
      } catch (error) {
        expect(error).toBeInstanceOf(LLMError);
        expect((error as LLMError).type).toBe(LLMErrorType.RATE_LIMITED);
        expect((error as LLMError).retryable).toBe(true);
      }
    });

    it('should handle 500 server error', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Internal server error' })
      });

      try {
        await provider.callAPI('Test prompt', mockConfig);
      } catch (error) {
        expect(error).toBeInstanceOf(LLMError);
        expect((error as LLMError).type).toBe(LLMErrorType.API_UNAVAILABLE);
        expect((error as LLMError).retryable).toBe(true);
      }
    });
  });

  describe('Connection Testing', () => {
    it('should test connection successfully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Test' } }]
        })
      });

      const result = await provider.testConnection('test-api-key');
      expect(result).toBe(true);
    });

    it('should fail connection test on error', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Connection failed'));

      const result = await provider.testConnection('test-api-key');
      expect(result).toBe(false);
    });
  });

  describe('Request Format', () => {
    it('should format request correctly', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Response' } }]
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      await provider.callAPI('Test prompt', mockConfig);

      const fetchCall = (global.fetch as any).mock.calls[0];
      const [url, options] = fetchCall;

      expect(url).toBe('https://api.openai.com/v1/chat/completions');
      expect(options.method).toBe('POST');
      expect(options.headers['Authorization']).toBe('Bearer test-api-key');
      expect(options.headers['Content-Type']).toBe('application/json');

      const body = JSON.parse(options.body);
      expect(body.model).toBe('gpt-3.5-turbo');
      expect(body.messages[0].content).toBe('Test prompt');
      expect(body.temperature).toBe(0.7);
      expect(body.max_tokens).toBe(1000);
    });
  });
});