/**
 * OpenAI Provider Implementation
 * Handles OpenAI API integration with proper error handling and retry logic
 */

import { BaseLLMProvider } from './BaseLLMProvider';
import type { LLMConfig, LLMResponse } from '../../types/llm';
import { LLMError, LLMErrorType } from '../../types/llm';

export class OpenAIProvider extends BaseLLMProvider {
  name = 'openai';
  private baseURL = 'https://api.openai.com/v1';

  async callAPI(prompt: string, config: LLMConfig): Promise<LLMResponse> {
    if (!this.validateConfig(config)) {
      throw new LLMError(
        LLMErrorType.CONFIGURATION_ERROR,
        'Invalid OpenAI configuration',
        this.name,
        false
      );
    }

    const timeout = config.timeout || 30000;
    
    return this.executeWithRetry(async () => {
      try {
        const requestBody = {
          model: config.model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: config.temperature,
          max_tokens: config.maxTokens
        };

        const fetchPromise = fetch(`${this.baseURL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`
          },
          body: JSON.stringify(requestBody)
        });

        const response = await Promise.race([
          fetchPromise,
          this.createTimeoutPromise(timeout)
        ]);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw this.handleHttpError(errorData, response);
        }

        const data = await response.json();
        this.validateResponse(data);

        if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
          throw new LLMError(
            LLMErrorType.INVALID_RESPONSE,
            'Invalid response structure from OpenAI API',
            this.name
          );
        }

        return {
          content: data.choices[0].message.content,
          usage: data.usage ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens
          } : undefined,
          model: config.model,
          provider: this.name,
          timestamp: new Date()
        };
      } catch (error) {
        // Convert any non-LLMError to LLMError
        if (error instanceof LLMError) {
          throw error;
        }
        
        // Handle network/fetch errors
        if (error instanceof TypeError || (error as any).name === 'TypeError') {
          throw new LLMError(
            LLMErrorType.NETWORK_ERROR,
            'Network connection failed',
            this.name,
            true
          );
        }

        throw new LLMError(
          LLMErrorType.API_UNAVAILABLE,
          error instanceof Error ? error.message : 'Unknown error',
          this.name,
          true
        );
      }
    });
  }

  isAvailable(): boolean {
    // Check if we have the necessary environment or can make a test call
    return typeof fetch !== 'undefined';
  }

  getDefaultConfig(): Partial<LLMConfig> {
    return {
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 1000,
      timeout: 30000
    };
  }

  validateConfig(config: LLMConfig): boolean {
    if (config.provider !== 'openai') {
      return false;
    }

    if (!config.apiKey || typeof config.apiKey !== 'string') {
      return false;
    }

    if (!config.model || typeof config.model !== 'string') {
      return false;
    }

    if (typeof config.temperature !== 'number' || config.temperature < 0 || config.temperature > 2) {
      return false;
    }

    if (typeof config.maxTokens !== 'number' || config.maxTokens < 1) {
      return false;
    }

    return true;
  }

  /**
   * Test API connectivity
   */
  async testConnection(apiKey: string): Promise<boolean> {
    try {
      const testConfig: LLMConfig = {
        ...this.getDefaultConfig(),
        apiKey,
        maxTokens: 5
      } as LLMConfig;

      await this.callAPI('Test', testConfig);
      return true;
    } catch (error) {
      return false;
    }
  }
}
