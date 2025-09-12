/**
 * Base LLM Provider
 * Abstract base class for all LLM providers with common functionality
 */

import type { LLMProvider, LLMConfig, LLMResponse, RetryPolicy } from '../../types/llm';
import { LLMErrorType as ErrorType, LLMProviderError } from '../../types/llm';

export abstract class BaseLLMProvider implements LLMProvider {
  abstract name: string;
  protected retryPolicy: RetryPolicy = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  };

  abstract callAPI(prompt: string, config: LLMConfig): Promise<LLMResponse>;
  abstract isAvailable(): boolean;
  abstract getDefaultConfig(): Partial<LLMConfig>;
  abstract validateConfig(config: LLMConfig): boolean;

  /**
   * Execute API call with retry logic
   */
  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    retryPolicy?: Partial<RetryPolicy>
  ): Promise<T> {
    const policy = { ...this.retryPolicy, ...retryPolicy };
    let lastError: Error;

    for (let attempt = 0; attempt <= policy.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain error types
        if (error instanceof LLMProviderError && !error.retryable) {
          throw error;
        }

        // Don't retry on the last attempt
        if (attempt === policy.maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          policy.baseDelay * Math.pow(policy.backoffMultiplier, attempt),
          policy.maxDelay
        );

        await this.sleep(delay);
      }
    }

    // Preserve the original error type
    throw lastError!;
  }

  /**
   * Sleep utility for retry delays
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate API response structure
   */
  protected validateResponse(response: any): void {
    if (!response) {
      throw new LLMProviderError(
        ErrorType.INVALID_RESPONSE,
        'Empty response received from API',
        this.name,
        { provider: this.name }
      );
    }
  }

  /**
   * Handle common HTTP errors
   */
  protected handleHttpError(error: any, response?: Response): LLMProviderError {
    const context = { provider: this.name };
    
    if (response) {
      switch (response.status) {
        case 401:
          return new LLMProviderError(
            ErrorType.AUTHENTICATION_ERROR,
            'Invalid API key or authentication failed',
            this.name,
            context,
            { retryable: false }
          );
        case 429:
          return new LLMProviderError(
            ErrorType.RATE_LIMITED,
            'Rate limit exceeded',
            this.name,
            context,
            { retryable: true }
          );
        case 402:
        case 403:
          return new LLMProviderError(
            ErrorType.QUOTA_EXCEEDED,
            'API quota exceeded or insufficient credits',
            this.name,
            context,
            { retryable: false }
          );
        case 500:
        case 502:
        case 503:
        case 504:
          return new LLMProviderError(
            ErrorType.API_UNAVAILABLE,
            'API server error',
            this.name,
            context,
            { retryable: true }
          );
        default:
          return new LLMProviderError(
            ErrorType.API_UNAVAILABLE,
            `HTTP ${response.status}: ${error.message || 'Unknown error'}`,
            this.name,
            context,
            { retryable: response.status >= 500 }
          );
      }
    }

    // Network or other errors
    if (error.name === 'TypeError' || error.message.includes('fetch')) {
      return new LLMProviderError(
        ErrorType.NETWORK_ERROR,
        'Network connection failed',
        this.name,
        context,
        { retryable: true }
      );
    }

    return new LLMProviderError(
      ErrorType.API_UNAVAILABLE,
      error.message || 'Unknown API error',
      this.name,
      context,
      { retryable: true }
    );
  }

  /**
   * Create timeout promise for API calls
   */
  protected createTimeoutPromise(timeoutMs: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new LLMProviderError(
          ErrorType.RESPONSE_TIMEOUT,
          `Request timeout after ${timeoutMs}ms`,
          this.name,
          { provider: this.name },
          { retryable: true }
        ));
      }, timeoutMs);
    });
  }
}
