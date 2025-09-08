/**
 * Local Provider Implementation
 * Handles local LLM integration (Ollama, LocalAI, etc.) with proper error handling and retry logic
 */

import { BaseLLMProvider } from './BaseLLMProvider';
import type { LLMConfig, LLMResponse } from '../../types/llm';
import { LLMError, LLMErrorType } from '../../types/llm';

export class LocalProvider extends BaseLLMProvider {
  name = 'local';
  private defaultBaseURL = 'http://localhost:11434'; // Default Ollama URL

  async callAPI(prompt: string, config: LLMConfig): Promise<LLMResponse> {
    if (!this.validateConfig(config)) {
      throw new LLMError(
        LLMErrorType.CONFIGURATION_ERROR,
        'Invalid Local provider configuration',
        this.name,
        false
      );
    }

    const timeout = config.timeout || 60000; // Longer timeout for local models
    const baseURL = this.getBaseURL(config);
    
    return this.executeWithRetry(async () => {
      const requestBody = {
        model: config.model,
        prompt: prompt,
        options: {
          temperature: config.temperature,
          num_predict: config.maxTokens
        },
        stream: false
      };

      const fetchPromise = fetch(`${baseURL}/api/generate`, {
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

      if (!data.response || typeof data.response !== 'string') {
        throw new LLMError(
          LLMErrorType.INVALID_RESPONSE,
          'Invalid response structure from local model API',
          this.name
        );
      }

      return {
        content: data.response,
        usage: data.prompt_eval_count || data.eval_count ? {
          promptTokens: data.prompt_eval_count || 0,
          completionTokens: data.eval_count || 0,
          totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
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
      provider: 'local',
      model: 'llama2',
      temperature: 0.7,
      maxTokens: 1000,
      timeout: 60000
    };
  }

  validateConfig(config: LLMConfig): boolean {
    if (config.provider !== 'local') {
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
   * Get base URL for local provider
   */
  private getBaseURL(config: LLMConfig): string {
    // Check if a custom base URL is provided in the config
    // This could be passed through environment variables or config
    return process.env.LOCAL_LLM_BASE_URL || this.defaultBaseURL;
  }

  /**
   * Test API connectivity
   */
  async testConnection(baseURL?: string): Promise<boolean> {
    try {
      const url = baseURL || this.defaultBaseURL;
      const response = await fetch(`${url}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * List available models from local provider
   */
  async listModels(baseURL?: string): Promise<string[]> {
    try {
      const url = baseURL || this.defaultBaseURL;
      const response = await fetch(`${url}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      if (data.models && Array.isArray(data.models)) {
        return data.models.map((model: any) => model.name);
      }

      return [];
    } catch (error) {
      return [];
    }
  }
}