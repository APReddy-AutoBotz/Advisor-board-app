/**
 * Error Scenario Tests for Fallback Mechanisms
 * 
 * Comprehensive test suite covering:
 * - LLM provider failure scenarios and fallbacks
 * - Network error handling and recovery
 * - Rate limiting and quota exhaustion
 * - Static response generation as fallback
 * - Error propagation and user experience
 */

import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { ResponseOrchestrator } from '../../../services/responseOrchestrator';
import { LLMIntegrationLayer } from '../../../services/llm/LLMIntegrationLayer';
import { EnhancedStaticResponseGenerator } from '../../../services/enhancedStaticResponseGenerator';
import { LLMError, LLMErrorType } from '../../../types/llm';
import type { Advisor, DomainId } from '../../../types/domain';
import type { EnvironmentConfig } from '../../../types/llm';

// Mock fetch globally
global.fetch = vi.fn();

describe('Fallback Mechanisms - Error Scenario Tests', () => {
  let orchestrator: ResponseOrchestrator;
  let mockFetch: Mock;

  const testConfig: EnvironmentConfig = {
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
      },
      gemini: {
        apiKey: 'test-gemini-key-123',
        model: 'gemini-pro',
        baseURL: 'https://generativelanguage.googleapis.com/v1'
      }
    },
    defaultProvider: 'openai',
    enableCaching: false, // Disable caching for error testing
    maxConcurrentRequests: 5,
    responseTimeout: 10000,
    retryPolicy: {
      maxRetries: 2,
      baseDelay: 500,
      maxDelay: 2000,
      backoffMultiplier: 2
    }
  };

  const mockAdvisors: Advisor[] = [
    {
      id: 'sarah-kim',
      name: 'Sarah Kim',
      expertise: 'Product Strategy',
      background: 'Former CPO at Stripe',
      domain: 'productboard',
      isSelected: true,
      specialties: ['Product Strategy', 'Growth']
    },
    {
      id: 'sarah-chen',
      name: 'Dr. Sarah Chen',
      expertise: 'Clinical Research Strategy',
      background: 'Former Pfizer VP',
      domain: 'cliniboard',
      isSelected: true,
      specialties: ['Phase III Trials', 'FDA Interactions']
    }
  ];

  const testQuestion = 'How do I achieve product-market fit for my B2B SaaS platform?';

  beforeEach(() => {
    mockFetch = vi.mocked(global.fetch);
    mockFetch.mockClear();
    
    orchestrator = new ResponseOrchestrator(testConfig);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('LLM Provider Failure Scenarios', () => {
    it('should fallback to static responses when primary provider fails', async () => {
      // Mock OpenAI failure
      mockFetch.mockRejectedValue(new LLMError(
        LLMErrorType.API_UNAVAILABLE,
        'OpenAI API is currently unavailable',
        'openai',
        true
      ));

      const result = await orchestrator.generateAdvisorResponses(
        testQuestion,
        [mockAdvisors[0]],
        'productboard'
      );

      expect(result.responses).toHaveLength(1);
      expect(result.successCount).toBe(1);
      expect(result.errorCount).toBe(0); // No user-facing errors

      const response = result.responses[0];
      expect(response.metadata.responseType).toBe('static');
      expect(response.metadata.errorInfo?.fallbackUsed).toBe(true);
      expect(response.metadata.errorInfo?.originalError).toContain('OpenAI API');
      expect(response.content).toContain('Strategic Approach');
      expect(response.content.length).toBeGreaterThan(200);
    });

    it('should attempt provider failover before static fallback', async () => {
      // OpenAI fails, Anthropic succeeds
      mockFetch
        .mockRejectedValueOnce(new LLMError(
          LLMErrorType.NETWORK_ERROR,
          'Network timeout',
          'openai',
          true
        ))
        .mockRejectedValueOnce(new LLMError(
          LLMErrorType.NETWORK_ERROR,
          'Network timeout',
          'openai',
          true
        ))
        .mockRejectedValueOnce(new LLMError(
          LLMErrorType.NETWORK_ERROR,
          'Network timeout',
          'openai',
          true
        ))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            content: [{ type: 'text', text: 'Anthropic fallback response' }],
            usage: { input_tokens: 100, output_tokens: 200 },
            model: 'claude-3-sonnet-20240229'
          })
        });

      const result = await orchestrator.generateAdvisorResponses(
        testQuestion,
        [mockAdvisors[0]],
        'productboard'
      );

      expect(result.responses).toHaveLength(1);
      const response = result.responses[0];
      
      expect(response.metadata.responseType).toBe('llm');
      expect(response.provider).toBe('anthropic');
      expect(response.content).toBe('Anthropic fallback response');
      expect(mockFetch).toHaveBeenCalledTimes(4); // 3 OpenAI retries + 1 Anthropic success
    }, 15000);

    it('should handle authentication errors without retries', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          error: {
            message: 'Invalid API key provided',
            type: 'invalid_request_error'
          }
        })
      });

      const result = await orchestrator.generateAdvisorResponses(
        testQuestion,
        [mockAdvisors[0]],
        'productboard'
      );

      expect(result.responses).toHaveLength(1);
      const response = result.responses[0];
      
      expect(response.metadata.responseType).toBe('static');
      expect(response.metadata.errorInfo?.type).toBe('authentication_error');
      expect(response.metadata.errorInfo?.fallbackUsed).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1); // No retries for auth errors
    });

    it('should handle rate limiting with exponential backoff', async () => {
      const startTime = Date.now();

      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          json: () => Promise.resolve({
            error: {
              message: 'Rate limit exceeded',
              type: 'rate_limit_error'
            }
          })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          json: () => Promise.resolve({
            error: {
              message: 'Rate limit exceeded',
              type: 'rate_limit_error'
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            choices: [{ message: { content: 'Success after rate limit' } }],
            usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 }
          })
        });

      const result = await orchestrator.generateAdvisorResponses(
        testQuestion,
        [mockAdvisors[0]],
        'productboard'
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result.responses).toHaveLength(1);
      const response = result.responses[0];
      
      expect(response.metadata.responseType).toBe('llm');
      expect(response.content).toBe('Success after rate limit');
      expect(duration).toBeGreaterThan(1500); // Should have waited for backoff
      expect(mockFetch).toHaveBeenCalledTimes(3);
    }, 10000);

    it('should handle quota exhaustion gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        json: () => Promise.resolve({
          error: {
            message: 'You exceeded your current quota',
            type: 'insufficient_quota'
          }
        })
      });

      const result = await orchestrator.generateAdvisorResponses(
        testQuestion,
        [mockAdvisors[0]],
        'productboard'
      );

      expect(result.responses).toHaveLength(1);
      const response = result.responses[0];
      
      expect(response.metadata.responseType).toBe('static');
      expect(response.metadata.errorInfo?.type).toBe('quota_exceeded');
      expect(response.metadata.errorInfo?.fallbackUsed).toBe(true);
      expect(response.content).toContain('Strategic Approach');
    });
  });

  describe('Network Error Handling', () => {
    it('should handle network timeouts with fallback', async () => {
      const timeoutConfig = {
        ...testConfig,
        responseTimeout: 1000 // Very short timeout
      };

      const timeoutOrchestrator = new ResponseOrchestrator(timeoutConfig);

      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({
            choices: [{ message: { content: 'Delayed response' } }]
          })
        }), 2000)) // Longer than timeout
      );

      const result = await timeoutOrchestrator.generateAdvisorResponses(
        testQuestion,
        [mockAdvisors[0]],
        'productboard'
      );

      expect(result.responses).toHaveLength(1);
      const response = result.responses[0];
      
      expect(response.metadata.responseType).toBe('static');
      expect(response.metadata.errorInfo?.type).toBe('network_error');
      expect(response.metadata.errorInfo?.fallbackUsed).toBe(true);
    });

    it('should handle DNS resolution failures', async () => {
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

      const result = await orchestrator.generateAdvisorResponses(
        testQuestion,
        [mockAdvisors[0]],
        'productboard'
      );

      expect(result.responses).toHaveLength(1);
      const response = result.responses[0];
      
      expect(response.metadata.responseType).toBe('static');
      expect(response.metadata.errorInfo?.type).toBe('network_error');
      expect(response.metadata.errorInfo?.originalError).toContain('Failed to fetch');
    });

    it('should handle connection refused errors', async () => {
      mockFetch.mockRejectedValue(new Error('ECONNREFUSED'));

      const result = await orchestrator.generateAdvisorResponses(
        testQuestion,
        [mockAdvisors[0]],
        'productboard'
      );

      expect(result.responses).toHaveLength(1);
      const response = result.responses[0];
      
      expect(response.metadata.responseType).toBe('static');
      expect(response.metadata.errorInfo?.type).toBe('network_error');
      expect(response.metadata.errorInfo?.originalError).toContain('ECONNREFUSED');
    });

    it('should handle SSL/TLS certificate errors', async () => {
      mockFetch.mockRejectedValue(new Error('certificate verify failed'));

      const result = await orchestrator.generateAdvisorResponses(
        testQuestion,
        [mockAdvisors[0]],
        'productboard'
      );

      expect(result.responses).toHaveLength(1);
      const response = result.responses[0];
      
      expect(response.metadata.responseType).toBe('static');
      expect(response.metadata.errorInfo?.type).toBe('network_error');
      expect(response.metadata.errorInfo?.originalError).toContain('certificate');
    });
  });

  describe('Malformed Response Handling', () => {
    it('should handle invalid JSON responses', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new SyntaxError('Unexpected token'))
      });

      const result = await orchestrator.generateAdvisorResponses(
        testQuestion,
        [mockAdvisors[0]],
        'productboard'
      );

      expect(result.responses).toHaveLength(1);
      const response = result.responses[0];
      
      expect(response.metadata.responseType).toBe('static');
      expect(response.metadata.errorInfo?.type).toBe('parsing_error');
      expect(response.metadata.errorInfo?.fallbackUsed).toBe(true);
    });

    it('should handle missing required fields in response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          // Missing 'choices' field for OpenAI response
          usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 }
        })
      });

      const result = await orchestrator.generateAdvisorResponses(
        testQuestion,
        [mockAdvisors[0]],
        'productboard'
      );

      expect(result.responses).toHaveLength(1);
      const response = result.responses[0];
      
      expect(response.metadata.responseType).toBe('static');
      expect(response.metadata.errorInfo?.type).toBe('parsing_error');
      expect(response.metadata.errorInfo?.fallbackUsed).toBe(true);
    });

    it('should handle empty response content', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: '' } }], // Empty content
          usage: { prompt_tokens: 100, completion_tokens: 0, total_tokens: 100 }
        })
      });

      const result = await orchestrator.generateAdvisorResponses(
        testQuestion,
        [mockAdvisors[0]],
        'productboard'
      );

      expect(result.responses).toHaveLength(1);
      const response = result.responses[0];
      
      expect(response.metadata.responseType).toBe('static');
      expect(response.metadata.errorInfo?.type).toBe('empty_response');
      expect(response.metadata.errorInfo?.fallbackUsed).toBe(true);
    });

    it('should handle corrupted response data', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: null } }], // Null content
          usage: null // Null usage
        })
      });

      const result = await orchestrator.generateAdvisorResponses(
        testQuestion,
        [mockAdvisors[0]],
        'productboard'
      );

      expect(result.responses).toHaveLength(1);
      const response = result.responses[0];
      
      expect(response.metadata.responseType).toBe('static');
      expect(response.metadata.errorInfo?.type).toBe('parsing_error');
      expect(response.metadata.errorInfo?.fallbackUsed).toBe(true);
    });
  });

  describe('Multi-Advisor Error Scenarios', () => {
    it('should handle mixed success and failure scenarios', async () => {
      // First advisor succeeds, second fails
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            choices: [{ message: { content: 'Success response' } }],
            usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 }
          })
        })
        .mockRejectedValueOnce(new Error('API failure'))
        .mockRejectedValueOnce(new Error('API failure'))
        .mockRejectedValueOnce(new Error('API failure'));

      const result = await orchestrator.generateAdvisorResponses(
        testQuestion,
        mockAdvisors.slice(0, 2),
        'productboard'
      );

      expect(result.responses).toHaveLength(2);
      expect(result.successCount).toBe(2); // Both should have responses

      const successResponse = result.responses.find(r => r.advisorId === 'sarah-kim');
      const fallbackResponse = result.responses.find(r => r.advisorId === 'sarah-chen');

      expect(successResponse?.metadata.responseType).toBe('llm');
      expect(successResponse?.content).toBe('Success response');

      expect(fallbackResponse?.metadata.responseType).toBe('static');
      expect(fallbackResponse?.metadata.errorInfo?.fallbackUsed).toBe(true);
    });

    it('should handle cascading failures across all advisors', async () => {
      mockFetch.mockRejectedValue(new Error('Complete system failure'));

      const result = await orchestrator.generateAdvisorResponses(
        testQuestion,
        mockAdvisors,
        'productboard'
      );

      expect(result.responses).toHaveLength(2);
      expect(result.successCount).toBe(2); // All should have static fallbacks

      result.responses.forEach(response => {
        expect(response.metadata.responseType).toBe('static');
        expect(response.metadata.errorInfo?.fallbackUsed).toBe(true);
        expect(response.content).toContain('Strategic Approach');
        expect(response.content.length).toBeGreaterThan(200);
      });
    });

    it('should maintain performance during partial failures', async () => {
      // 50% failure rate
      let callCount = 0;
      mockFetch.mockImplementation(() => {
        callCount++;
        if (callCount % 2 === 0) {
          return Promise.reject(new Error('Intermittent failure'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            choices: [{ message: { content: 'Success response' } }],
            usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 }
          })
        });
      });

      const startTime = Date.now();
      const result = await orchestrator.generateAdvisorResponses(
        testQuestion,
        mockAdvisors,
        'productboard'
      );
      const endTime = Date.now();

      expect(result.responses).toHaveLength(2);
      expect(result.successCount).toBe(2);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete reasonably fast

      // Should have mix of LLM and static responses
      const llmResponses = result.responses.filter(r => r.metadata.responseType === 'llm');
      const staticResponses = result.responses.filter(r => r.metadata.responseType === 'static');

      expect(llmResponses.length).toBeGreaterThan(0);
      expect(staticResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Static Response Generation Fallbacks', () => {
    it('should generate domain-appropriate static responses', async () => {
      mockFetch.mockRejectedValue(new Error('All LLMs down'));

      // Test product domain
      const productResult = await orchestrator.generateAdvisorResponses(
        'Product strategy question',
        [mockAdvisors[0]],
        'productboard'
      );

      expect(productResult.responses[0].metadata.frameworks).toEqual(
        expect.arrayContaining(['Jobs-to-be-Done', 'North Star Framework'])
      );

      // Test clinical domain
      const clinicalResult = await orchestrator.generateAdvisorResponses(
        'Clinical trial question',
        [mockAdvisors[1]],
        'cliniboard'
      );

      expect(clinicalResult.responses[0].metadata.frameworks).toEqual(
        expect.arrayContaining(['ICH Guidelines', 'Good Clinical Practice'])
      );
    });

    it('should maintain response quality in static fallbacks', async () => {
      mockFetch.mockRejectedValue(new Error('LLM unavailable'));

      const result = await orchestrator.generateAdvisorResponses(
        'How do I scale my product team effectively?',
        [mockAdvisors[0]],
        'productboard'
      );

      const response = result.responses[0];
      
      expect(response.content.length).toBeGreaterThan(500);
      expect(response.content).toContain('Strategic Approach');
      expect(response.content).toContain('Framework Application');
      expect(response.content).toContain('Implementation Considerations');
      expect(response.metadata.confidence).toBeGreaterThan(0.6);
    });

    it('should handle static generator failures gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('LLM unavailable'));

      // Mock static generator failure (this would be rare but possible)
      const originalGenerate = EnhancedStaticResponseGenerator.prototype.generateResponse;
      EnhancedStaticResponseGenerator.prototype.generateResponse = vi.fn()
        .mockRejectedValue(new Error('Static generator failed'));

      const result = await orchestrator.generateAdvisorResponses(
        testQuestion,
        [mockAdvisors[0]],
        'productboard'
      );

      expect(result.responses).toHaveLength(1);
      const response = result.responses[0];
      
      expect(response.content).toContain('unable to provide');
      expect(response.metadata.confidence).toBe(0.1);
      expect(response.metadata.errorInfo?.fallbackUsed).toBe(true);

      // Restore original method
      EnhancedStaticResponseGenerator.prototype.generateResponse = originalGenerate;
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover from temporary network issues', async () => {
      let attemptCount = 0;
      mockFetch.mockImplementation(() => {
        attemptCount++;
        if (attemptCount <= 2) {
          return Promise.reject(new Error('Temporary network issue'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            choices: [{ message: { content: 'Recovered response' } }],
            usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 }
          })
        });
      });

      const result = await orchestrator.generateAdvisorResponses(
        testQuestion,
        [mockAdvisors[0]],
        'productboard'
      );

      expect(result.responses).toHaveLength(1);
      const response = result.responses[0];
      
      expect(response.metadata.responseType).toBe('llm');
      expect(response.content).toBe('Recovered response');
      expect(attemptCount).toBe(3); // Should have retried and succeeded
    });

    it('should provide detailed error information for debugging', async () => {
      const specificError = new LLMError(
        LLMErrorType.MODEL_OVERLOADED,
        'Model is currently overloaded. Please try again later.',
        'openai',
        true
      );

      mockFetch.mockRejectedValue(specificError);

      const result = await orchestrator.generateAdvisorResponses(
        testQuestion,
        [mockAdvisors[0]],
        'productboard'
      );

      const response = result.responses[0];
      
      expect(response.metadata.errorInfo).toBeDefined();
      expect(response.metadata.errorInfo?.type).toBe('model_overloaded');
      expect(response.metadata.errorInfo?.originalError).toContain('overloaded');
      expect(response.metadata.errorInfo?.provider).toBe('openai');
      expect(response.metadata.errorInfo?.retryable).toBe(true);
      expect(response.metadata.errorInfo?.fallbackUsed).toBe(true);
    });

    it('should handle provider-specific error formats', async () => {
      // Test OpenAI error format
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          error: {
            message: 'Invalid request format',
            type: 'invalid_request_error',
            param: 'messages',
            code: 'invalid_request'
          }
        })
      });

      const result = await orchestrator.generateAdvisorResponses(
        testQuestion,
        [mockAdvisors[0]],
        'productboard'
      );

      const response = result.responses[0];
      
      expect(response.metadata.errorInfo?.type).toBe('invalid_request_error');
      expect(response.metadata.errorInfo?.originalError).toContain('Invalid request format');
    });

    it('should maintain system stability under error conditions', async () => {
      // Simulate various error conditions
      const errorTypes = [
        new Error('Network timeout'),
        new Error('DNS resolution failed'),
        new Error('Connection refused'),
        new Error('SSL handshake failed'),
        new Error('Rate limit exceeded')
      ];

      let errorIndex = 0;
      mockFetch.mockImplementation(() => {
        const error = errorTypes[errorIndex % errorTypes.length];
        errorIndex++;
        return Promise.reject(error);
      });

      // Process multiple requests to test stability
      const promises = Array.from({ length: 10 }, (_, i) => 
        orchestrator.generateAdvisorResponses(
          `Test question ${i}`,
          [mockAdvisors[0]],
          'productboard'
        )
      );

      const results = await Promise.all(promises);

      // All requests should complete with fallback responses
      results.forEach(result => {
        expect(result.responses).toHaveLength(1);
        expect(result.successCount).toBe(1);
        expect(result.responses[0].metadata.responseType).toBe('static');
        expect(result.responses[0].metadata.errorInfo?.fallbackUsed).toBe(true);
      });
    });
  });

  describe('User Experience During Errors', () => {
    it('should provide helpful error messages without exposing technical details', async () => {
      mockFetch.mockRejectedValue(new Error('Internal server error: Database connection failed'));

      const result = await orchestrator.generateAdvisorResponses(
        testQuestion,
        [mockAdvisors[0]],
        'productboard'
      );

      const response = result.responses[0];
      
      // User-facing content should not expose technical details
      expect(response.content).not.toContain('Database connection failed');
      expect(response.content).not.toContain('Internal server error');
      
      // But should provide helpful guidance
      expect(response.content).toContain('Strategic Approach');
      expect(response.content).toContain('based on best practices');
      
      // Technical details should be in metadata for debugging
      expect(response.metadata.errorInfo?.originalError).toContain('Database connection failed');
    });

    it('should maintain consistent response format during errors', async () => {
      mockFetch.mockRejectedValue(new Error('Service unavailable'));

      const result = await orchestrator.generateAdvisorResponses(
        testQuestion,
        mockAdvisors,
        'productboard'
      );

      result.responses.forEach(response => {
        // Should have all required fields
        expect(response.advisorId).toBeDefined();
        expect(response.content).toBeDefined();
        expect(response.persona).toBeDefined();
        expect(response.metadata).toBeDefined();
        expect(response.timestamp).toBeDefined();
        
        // Content should be structured
        expect(response.content.length).toBeGreaterThan(100);
        expect(response.metadata.confidence).toBeGreaterThan(0);
        expect(response.metadata.frameworks).toBeDefined();
      });
    });

    it('should provide appropriate confidence levels for fallback responses', async () => {
      mockFetch.mockRejectedValue(new Error('All providers failed'));

      const result = await orchestrator.generateAdvisorResponses(
        testQuestion,
        [mockAdvisors[0]],
        'productboard'
      );

      const response = result.responses[0];
      
      // Static responses should have lower but reasonable confidence
      expect(response.metadata.confidence).toBeGreaterThan(0.5);
      expect(response.metadata.confidence).toBeLessThan(0.9);
      expect(response.metadata.responseType).toBe('static');
    });
  });
});