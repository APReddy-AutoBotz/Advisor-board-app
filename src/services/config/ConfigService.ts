/**
 * Configuration Service
 * Provides centralized access to configuration and feature flags
 */

import { ConfigManager } from './ConfigManager';
import { ConfigValidator } from './ConfigValidator';
import type { 
  EnvironmentConfig, 
  FeatureFlags, 
  ConfigValidationResult,
  ConfigHealthCheck,
  ConfigUpdateEvent,
  RuntimeConfigUpdate,
  FeatureFlagUpdate
} from '../../types/config';
import { Logger } from '../errorHandling/Logger';

export class ConfigService {
  private static instance: ConfigService;
  private configManager: ConfigManager;
  private configValidator: ConfigValidator;
  private logger: Logger;

  private constructor() {
    this.configManager = ConfigManager.getInstance();
    this.configValidator = ConfigValidator.getInstance();
    this.logger = new Logger('ConfigService');
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  /**
   * Get current configuration
   */
  getConfig(): EnvironmentConfig {
    return this.configManager.getConfig();
  }

  /**
   * Get current feature flags
   */
  getFeatureFlags(): FeatureFlags {
    return this.configManager.getFeatureFlags();
  }

  /**
   * Check if a feature is enabled
   */
  isFeatureEnabled(feature: keyof FeatureFlags): boolean {
    return this.configManager.isFeatureEnabled(feature);
  }

  /**
   * Get LLM provider configuration
   */
  getLLMProviderConfig(providerName: string): any {
    const config = this.getConfig();
    return config.llmProviders[providerName as keyof typeof config.llmProviders];
  }

  /**
   * Get default LLM provider
   */
  getDefaultProvider(): string {
    return this.getConfig().defaultProvider;
  }

  /**
   * Get configured LLM providers
   */
  getConfiguredProviders(): string[] {
    return Object.keys(this.getConfig().llmProviders);
  }

  /**
   * Check if a provider is configured
   */
  isProviderConfigured(providerName: string): boolean {
    const config = this.getConfig();
    return !!config.llmProviders[providerName as keyof typeof config.llmProviders];
  }

  /**
   * Get retry policy configuration
   */
  getRetryPolicy() {
    return this.getConfig().retryPolicy;
  }

  /**
   * Get performance settings
   */
  getPerformanceSettings() {
    const config = this.getConfig();
    return {
      maxConcurrentRequests: config.maxConcurrentRequests,
      responseTimeout: config.responseTimeout,
      enableCaching: config.enableCaching
    };
  }

  /**
   * Get environment information
   */
  getEnvironmentInfo() {
    const config = this.getConfig();
    return {
      environment: config.environment,
      logLevel: config.logLevel,
      enableMetrics: config.enableMetrics,
      configVersion: config.configVersion
    };
  }

  /**
   * Update configuration at runtime
   */
  updateConfig(updates: RuntimeConfigUpdate): ConfigValidationResult {
    try {
      const result = this.configManager.updateConfig(updates);
      
      if (result.isValid) {
        this.logger.info('Configuration updated successfully', { updates });
      } else {
        this.logger.warn('Configuration update failed validation', { 
          errors: result.errors,
          warnings: result.warnings 
        });
      }

      return result;
    } catch (error) {
      this.logger.error('Failed to update configuration', error);
      return {
        isValid: false,
        errors: ['Failed to update configuration due to internal error'],
        warnings: [],
        timestamp: new Date()
      };
    }
  }

  /**
   * Update feature flags at runtime
   */
  updateFeatureFlags(updates: FeatureFlagUpdate): void {
    try {
      this.configManager.updateFeatureFlags(updates);
      this.logger.info('Feature flags updated successfully', { updates });
    } catch (error) {
      this.logger.error('Failed to update feature flags', error);
      throw error;
    }
  }

  /**
   * Validate current configuration
   */
  validateConfiguration(): ConfigValidationResult {
    const config = this.getConfig();
    const featureFlags = this.getFeatureFlags();
    return this.configValidator.validateConfiguration(config, featureFlags);
  }

  /**
   * Perform health check
   */
  async performHealthCheck(): Promise<ConfigHealthCheck> {
    const config = this.getConfig();
    return this.configValidator.performHealthCheck(config);
  }

  /**
   * Get configuration recommendations
   */
  getRecommendations(): string[] {
    const config = this.getConfig();
    const featureFlags = this.getFeatureFlags();
    return this.configValidator.getRecommendations(config, featureFlags);
  }

  /**
   * Add configuration update listener
   */
  addConfigUpdateListener(listener: (event: ConfigUpdateEvent) => void): void {
    this.configManager.addConfigUpdateListener(listener);
  }

  /**
   * Remove configuration update listener
   */
  removeConfigUpdateListener(listener: (event: ConfigUpdateEvent) => void): void {
    this.configManager.removeConfigUpdateListener(listener);
  }

  /**
   * Export configuration for debugging
   */
  exportConfigForDebug(): any {
    return this.configManager.exportConfigForDebug();
  }

  /**
   * Reset configuration to defaults
   */
  resetConfig(): void {
    this.configManager.resetConfig();
    this.logger.info('Configuration reset to defaults');
  }

  /**
   * Get configuration summary for UI display
   */
  getConfigSummary() {
    const config = this.getConfig();
    const featureFlags = this.getFeatureFlags();
    const validation = this.validateConfiguration();

    return {
      environment: config.environment,
      configuredProviders: Object.keys(config.llmProviders),
      defaultProvider: config.defaultProvider,
      enabledFeatures: Object.entries(featureFlags)
        .filter(([_, enabled]) => enabled)
        .map(([feature, _]) => feature),
      isValid: validation.isValid,
      errorCount: validation.errors.length,
      warningCount: validation.warnings.length,
      lastValidated: validation.timestamp
    };
  }

  /**
   * Check if system is ready for LLM operations
   */
  isLLMReady(): boolean {
    const config = this.getConfig();
    const featureFlags = this.getFeatureFlags();
    
    // Check if LLM integration is enabled
    if (!featureFlags.llmIntegrationEnabled) {
      return false;
    }

    // Check if at least one provider is configured
    const configuredProviders = Object.keys(config.llmProviders);
    if (configuredProviders.length === 0) {
      return false;
    }

    // Check if default provider is configured
    if (!config.llmProviders[config.defaultProvider as keyof typeof config.llmProviders]) {
      return false;
    }

    // Validate configuration
    const validation = this.validateConfiguration();
    return validation.isValid;
  }

  /**
   * Get fallback configuration when LLM is not ready
   */
  getFallbackConfig() {
    const featureFlags = this.getFeatureFlags();
    
    return {
      useStaticResponses: true,
      enhancedStaticEnabled: featureFlags.enhancedStaticResponses,
      personaPromptEnabled: featureFlags.personaPromptGeneration,
      questionAnalysisEnabled: featureFlags.questionAnalysis
    };
  }

  /**
   * Get provider-specific configuration
   */
  getProviderSpecificConfig(providerName: string) {
    const config = this.getConfig();
    const providerConfig = config.llmProviders[providerName as keyof typeof config.llmProviders];
    
    if (!providerConfig) {
      return null;
    }

    return {
      ...providerConfig,
      retryPolicy: config.retryPolicy,
      timeout: config.responseTimeout,
      isDefault: config.defaultProvider === providerName
    };
  }

  /**
   * Check if configuration hot-reload is enabled
   */
  isHotReloadEnabled(): boolean {
    const featureFlags = this.getFeatureFlags();
    const config = this.getConfig();
    
    return featureFlags.configHotReload && config.environment !== 'production';
  }

  /**
   * Get metrics configuration
   */
  getMetricsConfig() {
    const config = this.getConfig();
    const featureFlags = this.getFeatureFlags();
    
    return {
      enabled: config.enableMetrics,
      endpoint: config.metricsEndpoint,
      performanceMetrics: featureFlags.performanceMetrics,
      debugLogging: featureFlags.debugLogging
    };
  }

  /**
   * Get caching configuration
   */
  getCachingConfig() {
    const config = this.getConfig();
    const featureFlags = this.getFeatureFlags();
    
    return {
      enabled: config.enableCaching && featureFlags.responseCaching,
      maxConcurrentRequests: config.maxConcurrentRequests,
      responseTimeout: config.responseTimeout
    };
  }

  /**
   * Validate and prepare configuration for a specific operation
   */
  prepareConfigForOperation(operation: 'llm_call' | 'static_response' | 'persona_generation'): any {
    const config = this.getConfig();
    const featureFlags = this.getFeatureFlags();
    
    switch (operation) {
      case 'llm_call':
        if (!featureFlags.llmIntegrationEnabled) {
          throw new Error('LLM integration is disabled');
        }
        
        if (!this.isLLMReady()) {
          throw new Error('LLM configuration is not ready');
        }
        
        return {
          provider: config.defaultProvider,
          providerConfig: this.getProviderSpecificConfig(config.defaultProvider),
          retryPolicy: config.retryPolicy,
          timeout: config.responseTimeout
        };
        
      case 'static_response':
        if (!featureFlags.enhancedStaticResponses) {
          throw new Error('Enhanced static responses are disabled');
        }
        
        return {
          personaEnabled: featureFlags.personaPromptGeneration,
          questionAnalysisEnabled: featureFlags.questionAnalysis
        };
        
      case 'persona_generation':
        if (!featureFlags.personaPromptGeneration) {
          throw new Error('Persona prompt generation is disabled');
        }
        
        return {
          llmEnabled: featureFlags.llmIntegrationEnabled && this.isLLMReady(),
          staticFallback: featureFlags.enhancedStaticResponses
        };
        
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }
}
