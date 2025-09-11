/**
 * LLM Integration Layer
 * Main service that manages multiple LLM providers with failover and configuration management
 */

import type { LLMProvider, LLMConfig, LLMResponse, EnvironmentConfig } from '../../types/llm';
import { ErrorType, SystemError, LLMProviderError } from '../errorHandling';
import { OpenAIProvider } from './OpenAIProvider';
import { AnthropicProvider } from './AnthropicProvider';
import { GeminiProvider } from './GeminiProvider';
import { LocalProvider } from './LocalProvider';

export class LLMIntegrationLayer {
  private static instance: LLMIntegrationLayer;
  private providers: Map<string, LLMProvider> = new Map();
  private activeProvider: string;
  private config: EnvironmentConfig;
  private responseCache: Map<string, { response: LLMResponse; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(config: EnvironmentConfig) {
    this.config = config;
    this.activeProvider = config.defaultProvider;
    this.initializeProviders();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): LLMIntegrationLayer {
    if (!LLMIntegrationLayer.instance) {
      // Create a minimal config directly from environment variables to avoid circular dependencies
      const defaultConfig = {
        llmProviders: {
          openai: {
            apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
            model: import.meta.env.VITE_LLM_MODEL || 'gpt-4o-mini',
            temperature: parseFloat(import.meta.env.VITE_LLM_TEMPERATURE || '0.7'),
            maxTokens: parseInt(import.meta.env.VITE_LLM_MAX_TOKENS || '800'),
            timeout: parseInt(import.meta.env.VITE_LLM_TIMEOUT || '30000')
          }
        },
        defaultProvider: import.meta.env.VITE_LLM_PROVIDER || 'openai',
        enableFallback: import.meta.env.VITE_LLM_FALLBACK_TO_STATIC !== 'false',
        retryPolicy: {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 10000,
          backoffMultiplier: 2
        }
      };
      LLMIntegrationLayer.instance = new LLMIntegrationLayer(defaultConfig as any);
    }
    return LLMIntegrationLayer.instance;
  }

  /**
   * Check if LLM integration is available and properly configured
   */
  async isAvailable(): Promise<boolean> {
    try {
      console.log('🔍 Checking LLM availability...');
      console.log('📋 Config:', {
        providers: Object.keys(this.config.llmProviders),
        activeProvider: this.activeProvider,
        hasApiKey: !!this.config.llmProviders[this.activeProvider as keyof typeof this.config.llmProviders]?.apiKey
      });

      // Check if we have any configured providers
      const configuredProviders = Object.keys(this.config.llmProviders);
      if (configuredProviders.length === 0) {
        console.log('❌ No configured providers');
        return false;
      }

      // Check if the active provider is available and has an API key
      const activeProviderConfig = this.config.llmProviders[this.activeProvider as keyof typeof this.config.llmProviders];
      if (!activeProviderConfig || !activeProviderConfig.apiKey) {
        console.log('❌ No API key for active provider:', this.activeProvider);
        return false;
      }

      // Validate API key format (basic validation without exposing the key)
      if (!this.isValidApiKeyFormat(activeProviderConfig.apiKey, this.activeProvider)) {
        console.log('❌ Invalid API key format for provider:', this.activeProvider);
        return false;
      }

      // Check if the provider is registered and available
      const provider = this.providers.get(this.activeProvider);
      if (!provider || !provider.isAvailable()) {
        console.log('❌ Provider not registered or available:', this.activeProvider);
        return false;
      }

      console.log('✅ LLM integration is available');
      return true;
    } catch (error) {
      console.warn('❌ LLM availability check failed:', error);
      return false;
    }
  }

  /**
   * Validate API key format without exposing the actual key
   */
  private isValidApiKeyFormat(apiKey: string, provider: string): boolean {
    if (!apiKey || typeof apiKey !== 'string') {
      return false;
    }

    // Basic format validation (without exposing the key)
    switch (provider) {
      case 'openai':
        return apiKey.startsWith('sk-') && apiKey.length > 20;
      case 'anthropic':
        return apiKey.startsWith('sk-ant-') && apiKey.length > 20;
      case 'gemini':
        return apiKey.length > 20; // Gemini keys don't have a standard prefix
      default:
        return apiKey.length > 10; // Basic length check for other providers
    }
  }

  /**
   * Initialize all available providers
   */
  private initializeProviders(): void {
    this.registerProvider(new OpenAIProvider());
    this.registerProvider(new AnthropicProvider());
    this.registerProvider(new GeminiProvider());
    this.registerProvider(new LocalProvider());
  }

  /**
   * Register a new LLM provider
   */
  registerProvider(provider: LLMProvider): void {
    this.providers.set(provider.name, provider);
  }

  /**
   * Set the active provider
   */
  setActiveProvider(providerName: string): void {
    if (!this.providers.has(providerName)) {
      throw new SystemError(
        ErrorType.CONFIGURATION_ERROR,
        `Provider '${providerName}' is not registered`,
        { provider: providerName },
        { retryable: false }
      );
    }
    this.activeProvider = providerName;
  }

  /**
   * Get the current active provider
   */
  getActiveProvider(): string {
    return this.activeProvider;
  }

  /**
   * Get list of available providers
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Generate response using the active provider with failover
   */
  async generateResponse(prompt: string, config?: Partial<LLMConfig>): Promise<LLMResponse> {
    const cacheKey = this.getCacheKey(prompt, config);
    
    // Check cache first if enabled
    if (this.config.enableCaching) {
      const cached = this.getCachedResponse(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const fullConfig = this.buildConfig(config);
    const providers = this.getProviderFallbackOrder();

    let lastError: SystemError | undefined;

    for (const providerName of providers) {
      const provider = this.providers.get(providerName);
      if (!provider || !provider.isAvailable()) {
        continue;
      }

      try {
        const providerConfig = { ...fullConfig, provider: providerName as any };
        
        // Ensure we have the right API key for this provider
        const providerSpecificConfig = this.config.llmProviders[providerName as keyof typeof this.config.llmProviders];
        if (providerSpecificConfig && 'apiKey' in providerSpecificConfig) {
          providerConfig.apiKey = providerSpecificConfig.apiKey;
        }
        
        const response = await provider.callAPI(prompt, providerConfig);
        
        // Cache successful response
        if (this.config.enableCaching) {
          this.cacheResponse(cacheKey, response);
        }

        return response;
      } catch (error) {
        lastError = error instanceof SystemError ? error : new LLMProviderError(
          ErrorType.API_UNAVAILABLE,
          error instanceof Error ? error.message : 'Unknown error',
          providerName,
          { provider: providerName },
          { retryable: true }
        );

        // Don't try other providers for non-retryable errors from the primary provider
        // But do try other providers if this was a retryable error
        if (!lastError.retryable && providerName === this.activeProvider) {
          // Only break if this was the primary provider and error is non-retryable
          continue; // Actually, let's try other providers anyway
        }
      }
    }

    // All providers failed
    throw lastError || new SystemError(
      ErrorType.API_UNAVAILABLE,
      'All LLM providers are unavailable',
      {},
      { retryable: false }
    );
  }

  /**
   * Test connectivity for a specific provider
   */
  async testProvider(providerName: string, apiKey?: string): Promise<boolean> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      return false;
    }

    try {
      const testConfig = this.buildConfig({ provider: providerName as any, apiKey });
      await provider.callAPI('Test connectivity', testConfig);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get provider status for all providers
   */
  async getProviderStatus(): Promise<Record<string, boolean>> {
    const status: Record<string, boolean> = {};
    
    for (const [name, provider] of this.providers) {
      try {
        status[name] = provider.isAvailable() && await this.testProvider(name);
      } catch (error) {
        status[name] = false;
      }
    }

    return status;
  }

  /**
   * Build complete configuration with defaults
   */
  private buildConfig(partialConfig?: Partial<LLMConfig>): LLMConfig {
    const providerName = partialConfig?.provider || this.activeProvider;
    const provider = this.providers.get(providerName);
    
    if (!provider) {
      throw new SystemError(
        ErrorType.CONFIGURATION_ERROR,
        `Provider '${providerName}' not found`,
        { provider: providerName },
        { retryable: false }
      );
    }

    const defaults = provider.getDefaultConfig();
    const providerConfig = this.config.llmProviders[providerName as keyof typeof this.config.llmProviders];
    
    return {
      provider: providerName as any,
      model: partialConfig?.model || providerConfig?.model || defaults.model!,
      temperature: partialConfig?.temperature ?? defaults.temperature!,
      maxTokens: partialConfig?.maxTokens ?? defaults.maxTokens!,
      apiKey: partialConfig?.apiKey || providerConfig?.apiKey,
      timeout: partialConfig?.timeout || this.config.responseTimeout
    };
  }

  /**
   * Get provider fallback order (active provider first, then others)
   */
  private getProviderFallbackOrder(): string[] {
    const providers = Array.from(this.providers.keys());
    const order = [this.activeProvider];
    
    // Add other providers as fallbacks
    providers.forEach(provider => {
      if (provider !== this.activeProvider) {
        order.push(provider);
      }
    });

    return order;
  }

  /**
   * Generate cache key for request
   */
  private getCacheKey(prompt: string, config?: Partial<LLMConfig>): string {
    const configStr = JSON.stringify({
      provider: config?.provider || this.activeProvider,
      model: config?.model,
      temperature: config?.temperature,
      maxTokens: config?.maxTokens
    });
    
    return `${prompt}:${configStr}`;
  }

  /**
   * Get cached response if available and not expired
   */
  private getCachedResponse(cacheKey: string): LLMResponse | null {
    const cached = this.responseCache.get(cacheKey);
    if (!cached) {
      return null;
    }

    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_TTL) {
      this.responseCache.delete(cacheKey);
      return null;
    }

    return cached.response;
  }

  /**
   * Cache response
   */
  private cacheResponse(cacheKey: string, response: LLMResponse): void {
    this.responseCache.set(cacheKey, {
      response,
      timestamp: Date.now()
    });

    // Clean up old cache entries periodically
    if (this.responseCache.size > 100) {
      this.cleanupCache();
    }
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, cached] of this.responseCache.entries()) {
      if (now - cached.timestamp > this.CACHE_TTL) {
        this.responseCache.delete(key);
      }
    }
  }

  /**
   * Clear all cached responses
   */
  clearCache(): void {
    this.responseCache.clear();
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<EnvironmentConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.defaultProvider) {
      this.setActiveProvider(newConfig.defaultProvider);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): EnvironmentConfig {
    return { ...this.config };
  }
}