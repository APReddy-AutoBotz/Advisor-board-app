/**
 * Anthropic Provider Implementation
 * Handles Anthropic Claude API integration with proper error handling and retry logic
 */

import { BaseLLMProvider } from './BaseLLMProvider';
import type { LLMConfig, LLMResponse } from '../../types/llm';
import { LLMError, LLMErrorType } from '../../types/llm';

export class AnthropicProvider extends BaseLLMProvider {
  name = 'anthropic';
  private baseURL = 'https://api.anthropic.com/v1';

  async callAPI(prompt: string, config: LLMConfig): Promise<LLMResponse> {
    if (!this.validateConfig(config)) {
      throw new LLMError(
        LLMErrorType.CONFIGURATION_ERROR,
        'Invalid Anthropic configuration',
        this.name,
        false
      );
    }

    const timeout = config.timeout || 30000;
    
    return this.executeWithRetry(async () => {
      const requestBody = {
        model: config.model,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      };

      const fetchPromise = fetch(`${this.baseURL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey!,
          'anthropic-version': '2023-06-01'
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

      if (!data.content || !Array.isArray(data.content) || data.content.length === 0) {
        throw new LLMError(
          LLMErrorType.INVALID_RESPONSE,
          'Invalid response structure from Anthropic API',
          this.name
        );
      }

      const textContent = data.content.find((item: any) => item.type === 'text');
      if (!textContent) {
        throw new LLMError(
          LLMErrorType.INVALID_RESPONSE,
          'No text content found in Anthropic response',
          this.name
        );
      }

      return {
        content: textContent.text,
        usage: data.usage ? {
          promptTokens: data.usage.input_tokens,
          completionTokens: data.usage.output_tokens,
          totalTokens: data.usage.input_tokens + data.usage.output_tokens
        } : undefined,
        model: config.model,
        provider: this.name,
        timestamp: new Date()
      };
    });
  }

  isAvailable(): boolean {
    return typeof fetch !== 'undefined';
  }

  getDefaultConfig(): Partial<LLMConfig> {
    return {
      provider: 'anthropic',
      model: 'claude-3-sonnet-20240229',
      temperature: 0.7,
      maxTokens: 1000,
      timeout: 30000
    };
  }

  validateConfig(config: LLMConfig): boolean {
    if (config.provider !== 'anthropic') {
      return false;
    }

    if (!config.apiKey || typeof config.apiKey !== 'string') {
      return false;
    }

    if (!config.model || typeof config.model !== 'string') {
      return false;
    }

    if (typeof config.temperature !== 'number' || config.temperature < 0 || config.temperature > 1) {
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