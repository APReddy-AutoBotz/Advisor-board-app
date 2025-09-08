/**
 * Gemini Provider Implementation
 * Handles Google Gemini API integration with proper error handling and retry logic
 */

import { BaseLLMProvider } from './BaseLLMProvider';
import type { LLMConfig, LLMResponse } from '../../types/llm';
import { LLMError, LLMErrorType } from '../../types/llm';

export class GeminiProvider extends BaseLLMProvider {
  name = 'gemini';
  private baseURL = 'https://generativelanguage.googleapis.com/v1beta';

  async callAPI(prompt: string, config: LLMConfig): Promise<LLMResponse> {
    if (!this.validateConfig(config)) {
      throw new LLMError(
        LLMErrorType.CONFIGURATION_ERROR,
        'Invalid Gemini configuration',
        this.name,
        false
      );
    }

    const timeout = config.timeout || 30000;
    
    return this.executeWithRetry(async () => {
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: config.temperature,
          maxOutputTokens: config.maxTokens,
          topP: 0.8,
          topK: 10
        }
      };

      const url = `${this.baseURL}/models/${config.model}:generateContent?key=${config.apiKey}`;
      
      const fetchPromise = fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
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

      if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
        throw new LLMError(
          LLMErrorType.INVALID_RESPONSE,
          'Invalid response structure from Gemini API',
          this.name
        );
      }

      const candidate = data.candidates[0];
      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        throw new LLMError(
          LLMErrorType.INVALID_RESPONSE,
          'No content found in Gemini response',
          this.name
        );
      }

      const textPart = candidate.content.parts.find((part: any) => part.text);
      if (!textPart) {
        throw new LLMError(
          LLMErrorType.INVALID_RESPONSE,
          'No text content found in Gemini response',
          this.name
        );
      }

      return {
        content: textPart.text,
        usage: data.usageMetadata ? {
          promptTokens: data.usageMetadata.promptTokenCount || 0,
          completionTokens: data.usageMetadata.candidatesTokenCount || 0,
          totalTokens: data.usageMetadata.totalTokenCount || 0
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
      provider: 'gemini',
      model: 'gemini-1.5-flash',
      temperature: 0.7,
      maxTokens: 1000,
      timeout: 30000
    };
  }

  validateConfig(config: LLMConfig): boolean {
    if (config.provider !== 'gemini') {
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