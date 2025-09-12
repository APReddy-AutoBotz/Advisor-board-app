/**
 * LLM Configuration Manager
 * Handles configuration loading, validation, and environment management
 * Now uses the centralized ConfigService for configuration management
 */

import type { EnvironmentConfig, LLMProviderConfig, RetryPolicy } from '../../types/llm';
import { LLMError, LLMErrorType } from '../../types/llm';
import { ConfigService } from '../config/ConfigService';

export class LLMConfigManager {
  private static instance: LLMConfigManager;
  private configService: ConfigService;

  private constructor() {
    this.configService = ConfigService.getInstance();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): LLMConfigManager {
    if (!LLMConfigManager.instance) {
      LLMConfigManager.instance = new LLMConfigManager();
    }
    return LLMConfigManager.instance;
  }

  // Configuration loading is now handled by ConfigService

  /**
   * Get current configuration
   */
  getConfig(): EnvironmentConfig {
    return this.configService.getConfig();
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<EnvironmentConfig>): void {
    this.configService.updateConfig(updates);
  }

  /**
   * Validate configuration
   */
  validateConfig(): { isValid: boolean; errors: string[] } {
    const validation = this.configService.validateConfiguration();
    return {
      isValid: validation.isValid,
      errors: validation.errors
    };
  }

  /**
   * Get provider configuration for a specific provider
   */
  getProviderConfig(providerName: string): any {
    return this.configService.getLLMProviderConfig(providerName);
  }

  /**
   * Check if a provider is configured
   */
  isProviderConfigured(providerName: string): boolean {
    return this.configService.isProviderConfigured(providerName);
  }

  /**
   * Get list of configured providers
   */
  getConfiguredProviders(): string[] {
    return this.configService.getConfiguredProviders();
  }

  /**
   * Set API key for a provider (runtime configuration)
   */
  setProviderApiKey(providerName: string, apiKey: string): void {
    const config = this.configService.getConfig();
    const updates = {
      llmProviders: {
        ...config.llmProviders,
        [providerName]: {
          ...config.llmProviders[providerName as keyof typeof config.llmProviders],
          apiKey
        }
      }
    };
    this.configService.updateConfig(updates);
  }

  /**
   * Remove provider configuration
   */
  removeProvider(providerName: string): void {
    const config = this.configService.getConfig();
    const newProviders = { ...config.llmProviders };
    delete (newProviders as any)[providerName];
    
    const updates = {
      llmProviders: newProviders,
      defaultProvider: config.defaultProvider === providerName 
        ? this.configService.getConfiguredProviders()[0] || 'openai'
        : config.defaultProvider
    };
    
    this.configService.updateConfig(updates);
  }

  /**
   * Reset configuration to defaults
   */
  resetConfig(): void {
    this.configService.resetConfig();
  }

  /**
   * Export configuration for debugging (without sensitive data)
   */
  exportConfigForDebug(): any {
    return this.configService.exportConfigForDebug();
  }
}
