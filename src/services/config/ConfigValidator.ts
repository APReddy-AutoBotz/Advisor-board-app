/**
 * Configuration Validator
 * Provides comprehensive validation for configuration and environment settings
 */

import type { 
  EnvironmentConfig, 
  FeatureFlags, 
  ConfigValidationResult,
  ConfigHealthCheck,
  LLMProviderConfig 
} from '../../types/config';
import { Logger } from '../errorHandling/Logger';

export class ConfigValidator {
  private static instance: ConfigValidator;
  private logger: Logger;

  private constructor() {
    this.logger = new Logger('ConfigValidator');
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ConfigValidator {
    if (!ConfigValidator.instance) {
      ConfigValidator.instance = new ConfigValidator();
    }
    return ConfigValidator.instance;
  }

  /**
   * Validate complete configuration
   */
  validateConfiguration(config: EnvironmentConfig, featureFlags?: FeatureFlags): ConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate LLM providers
      const providerValidation = this.validateLLMProviders(config.llmProviders);
      errors.push(...providerValidation.errors);
      warnings.push(...providerValidation.warnings);

      // Validate default provider
      const defaultProviderValidation = this.validateDefaultProvider(config);
      errors.push(...defaultProviderValidation.errors);
      warnings.push(...defaultProviderValidation.warnings);

      // Validate retry policy
      const retryValidation = this.validateRetryPolicy(config.retryPolicy);
      errors.push(...retryValidation.errors);
      warnings.push(...retryValidation.warnings);

      // Validate performance settings
      const performanceValidation = this.validatePerformanceSettings(config);
      errors.push(...performanceValidation.errors);
      warnings.push(...performanceValidation.warnings);

      // Validate environment-specific settings
      const environmentValidation = this.validateEnvironmentSettings(config, featureFlags);
      errors.push(...environmentValidation.errors);
      warnings.push(...environmentValidation.warnings);

      // Validate feature flag consistency
      if (featureFlags) {
        const featureFlagValidation = this.validateFeatureFlags(featureFlags, config);
        errors.push(...featureFlagValidation.errors);
        warnings.push(...featureFlagValidation.warnings);
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        timestamp: new Date()
      };

    } catch (error) {
      this.logger.error('Configuration validation failed', error);
      return {
        isValid: false,
        errors: ['Configuration validation failed due to internal error'],
        warnings: [],
        timestamp: new Date()
      };
    }
  }

  /**
   * Validate LLM provider configurations
   */
  private validateLLMProviders(providers: LLMProviderConfig): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (Object.keys(providers).length === 0) {
      warnings.push('No LLM providers configured. System will use static responses only.');
      return { errors, warnings };
    }

    // Validate OpenAI configuration
    if (providers.openai) {
      const openaiValidation = this.validateOpenAIConfig(providers.openai);
      errors.push(...openaiValidation.errors);
      warnings.push(...openaiValidation.warnings);
    }

    // Validate Anthropic configuration
    if (providers.anthropic) {
      const anthropicValidation = this.validateAnthropicConfig(providers.anthropic);
      errors.push(...anthropicValidation.errors);
      warnings.push(...anthropicValidation.warnings);
    }

    // Validate Gemini configuration
    if (providers.gemini) {
      const geminiValidation = this.validateGeminiConfig(providers.gemini);
      errors.push(...geminiValidation.errors);
      warnings.push(...geminiValidation.warnings);
    }

    // Validate Local configuration
    if (providers.local) {
      const localValidation = this.validateLocalConfig(providers.local);
      errors.push(...localValidation.errors);
      warnings.push(...localValidation.warnings);
    }

    return { errors, warnings };
  }

  /**
   * Validate OpenAI configuration
   */
  private validateOpenAIConfig(config: NonNullable<LLMProviderConfig['openai']>): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.apiKey) {
      errors.push('OpenAI API key is required');
    } else if (config.apiKey.length < 20) {
      warnings.push('OpenAI API key appears to be invalid (too short)');
    } else if (!config.apiKey.startsWith('sk-')) {
      warnings.push('OpenAI API key should start with "sk-"');
    }

    if (!config.model) {
      errors.push('OpenAI model is required');
    } else {
      const validModels = ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o'];
      if (!validModels.some(model => config.model.includes(model))) {
        warnings.push(`OpenAI model "${config.model}" may not be supported`);
      }
    }

    if (config.baseURL) {
      if (!this.isValidURL(config.baseURL)) {
        errors.push('OpenAI base URL is invalid');
      }
    }

    if (config.temperature !== undefined) {
      if (config.temperature < 0 || config.temperature > 2) {
        errors.push('OpenAI temperature must be between 0 and 2');
      }
    }

    if (config.maxTokens !== undefined) {
      if (config.maxTokens < 1 || config.maxTokens > 32000) {
        warnings.push('OpenAI maxTokens should be between 1 and 32000');
      }
    }

    return { errors, warnings };
  }

  /**
   * Validate Anthropic configuration
   */
  private validateAnthropicConfig(config: NonNullable<LLMProviderConfig['anthropic']>): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.apiKey) {
      errors.push('Anthropic API key is required');
    } else if (config.apiKey.length < 20) {
      warnings.push('Anthropic API key appears to be invalid (too short)');
    }

    if (!config.model) {
      errors.push('Anthropic model is required');
    } else {
      const validModels = ['claude-3-sonnet', 'claude-3-opus', 'claude-3-haiku'];
      if (!validModels.some(model => config.model.includes(model))) {
        warnings.push(`Anthropic model "${config.model}" may not be supported`);
      }
    }

    if (config.baseURL && !this.isValidURL(config.baseURL)) {
      errors.push('Anthropic base URL is invalid');
    }

    if (config.temperature !== undefined && (config.temperature < 0 || config.temperature > 1)) {
      errors.push('Anthropic temperature must be between 0 and 1');
    }

    if (config.maxTokens !== undefined && (config.maxTokens < 1 || config.maxTokens > 200000)) {
      warnings.push('Anthropic maxTokens should be between 1 and 200000');
    }

    return { errors, warnings };
  }

  /**
   * Validate Gemini configuration
   */
  private validateGeminiConfig(config: NonNullable<LLMProviderConfig['gemini']>): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.apiKey) {
      errors.push('Gemini API key is required');
    } else if (config.apiKey.length < 20) {
      warnings.push('Gemini API key appears to be invalid (too short)');
    }

    if (!config.model) {
      errors.push('Gemini model is required');
    } else {
      const validModels = ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'];
      if (!validModels.some(model => config.model.includes(model))) {
        warnings.push(`Gemini model "${config.model}" may not be supported`);
      }
    }

    if (config.baseURL && !this.isValidURL(config.baseURL)) {
      errors.push('Gemini base URL is invalid');
    }

    if (config.temperature !== undefined && (config.temperature < 0 || config.temperature > 2)) {
      errors.push('Gemini temperature must be between 0 and 2');
    }

    if (config.maxTokens !== undefined && (config.maxTokens < 1 || config.maxTokens > 32000)) {
      warnings.push('Gemini maxTokens should be between 1 and 32000');
    }

    return { errors, warnings };
  }

  /**
   * Validate Local model configuration
   */
  private validateLocalConfig(config: NonNullable<LLMProviderConfig['local']>): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.model) {
      errors.push('Local model name is required');
    }

    if (!config.baseURL) {
      errors.push('Local model base URL is required');
    } else if (!this.isValidURL(config.baseURL)) {
      errors.push('Local model base URL is invalid');
    }

    if (config.temperature !== undefined && (config.temperature < 0 || config.temperature > 2)) {
      errors.push('Local model temperature must be between 0 and 2');
    }

    if (config.maxTokens !== undefined && (config.maxTokens < 1 || config.maxTokens > 32000)) {
      warnings.push('Local model maxTokens should be between 1 and 32000');
    }

    return { errors, warnings };
  }

  /**
   * Validate default provider setting
   */
  private validateDefaultProvider(config: EnvironmentConfig): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.defaultProvider) {
      errors.push('Default provider must be specified');
      return { errors, warnings };
    }

    const availableProviders = Object.keys(config.llmProviders);
    if (availableProviders.length === 0) {
      warnings.push('No providers configured, default provider setting will be ignored');
      return { errors, warnings };
    }

    if (!availableProviders.includes(config.defaultProvider)) {
      errors.push(`Default provider '${config.defaultProvider}' is not configured. Available providers: ${availableProviders.join(', ')}`);
    }

    return { errors, warnings };
  }

  /**
   * Validate retry policy
   */
  private validateRetryPolicy(retryPolicy: any): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (retryPolicy.maxRetries < 0) {
      errors.push('Max retries must be non-negative');
    } else if (retryPolicy.maxRetries > 10) {
      warnings.push('Max retries is very high (>10). This may cause long delays');
    }

    if (retryPolicy.baseDelay < 0) {
      errors.push('Base delay must be non-negative');
    } else if (retryPolicy.baseDelay > 10000) {
      warnings.push('Base delay is very high (>10s). This may cause long delays');
    }

    if (retryPolicy.maxDelay < retryPolicy.baseDelay) {
      errors.push('Max delay must be greater than or equal to base delay');
    }

    if (retryPolicy.backoffMultiplier < 1) {
      errors.push('Backoff multiplier must be at least 1');
    } else if (retryPolicy.backoffMultiplier > 5) {
      warnings.push('Backoff multiplier is very high (>5). This may cause exponential delays');
    }

    return { errors, warnings };
  }

  /**
   * Validate performance settings
   */
  private validatePerformanceSettings(config: EnvironmentConfig): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (config.responseTimeout < 1000) {
      errors.push('Response timeout must be at least 1000ms');
    } else if (config.responseTimeout > 120000) {
      warnings.push('Response timeout is very high (>2 minutes). Users may experience long waits');
    }

    if (config.maxConcurrentRequests < 1) {
      errors.push('Max concurrent requests must be at least 1');
    } else if (config.maxConcurrentRequests > 100) {
      warnings.push('Max concurrent requests is very high (>100). This may cause performance issues');
    }

    return { errors, warnings };
  }

  /**
   * Validate environment-specific settings
   */
  private validateEnvironmentSettings(config: EnvironmentConfig, featureFlags?: FeatureFlags): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!['development', 'production', 'test'].includes(config.environment)) {
      errors.push(`Invalid environment: ${config.environment}. Must be 'development', 'production', or 'test'`);
    }

    if (!['debug', 'info', 'warn', 'error'].includes(config.logLevel)) {
      errors.push(`Invalid log level: ${config.logLevel}. Must be 'debug', 'info', 'warn', or 'error'`);
    }

    // Production environment checks
    if (config.environment === 'production') {
      if (config.logLevel === 'debug') {
        warnings.push('Debug logging is enabled in production environment');
      }

      if (!config.enableMetrics) {
        warnings.push('Metrics are disabled in production environment');
      }

      if (featureFlags?.debugLogging) {
        warnings.push('Debug logging feature flag is enabled in production');
      }

      if (featureFlags?.experimentalFeatures) {
        warnings.push('Experimental features are enabled in production');
      }
    }

    // Development environment checks
    if (config.environment === 'development') {
      if (!featureFlags?.configHotReload) {
        warnings.push('Config hot-reload is disabled in development environment');
      }
    }

    return { errors, warnings };
  }

  /**
   * Validate feature flags consistency
   */
  private validateFeatureFlags(featureFlags: FeatureFlags, config: EnvironmentConfig): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for conflicting feature flags
    if (!featureFlags.llmIntegrationEnabled && !featureFlags.enhancedStaticResponses) {
      errors.push('Either LLM integration or enhanced static responses must be enabled');
    }

    if (featureFlags.responseCaching && !config.enableCaching) {
      warnings.push('Response caching feature flag is enabled but caching is disabled in config');
    }

    if (featureFlags.performanceMetrics && !config.enableMetrics) {
      warnings.push('Performance metrics feature flag is enabled but metrics are disabled in config');
    }

    if (featureFlags.multiProviderFallback && Object.keys(config.llmProviders).length < 2) {
      warnings.push('Multi-provider fallback is enabled but only one provider is configured');
    }

    if (featureFlags.personaPromptGeneration && !featureFlags.llmIntegrationEnabled) {
      warnings.push('Persona prompt generation requires LLM integration to be enabled');
    }

    return { errors, warnings };
  }

  /**
   * Perform health check on configuration
   */
  async performHealthCheck(config: EnvironmentConfig): Promise<ConfigHealthCheck> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    const providersStatus: ConfigHealthCheck['providersStatus'] = {};

    try {
      // Check each configured provider
      for (const [providerName, providerConfig] of Object.entries(config.llmProviders)) {
        if (!providerConfig) continue;

        const status = {
          configured: true,
          accessible: false,
          lastChecked: new Date()
        };

        try {
          // In a real implementation, this would make actual API calls to test connectivity
          // For now, we'll just validate the configuration
          const validation = this.validateLLMProviders({ [providerName]: providerConfig } as any);
          
          if (validation.errors.length > 0) {
            status.accessible = false;
            status.error = validation.errors.join('; ');
            issues.push(`Provider ${providerName}: ${status.error}`);
          } else {
            status.accessible = true;
            if (validation.warnings.length > 0) {
              recommendations.push(`Provider ${providerName}: ${validation.warnings.join('; ')}`);
            }
          }
        } catch (error) {
          status.accessible = false;
          status.error = error instanceof Error ? error.message : 'Unknown error';
          issues.push(`Provider ${providerName}: ${status.error}`);
        }

        providersStatus[providerName] = status;
      }

      // General health recommendations
      if (Object.keys(config.llmProviders).length === 1) {
        recommendations.push('Consider configuring multiple providers for better reliability');
      }

      if (config.responseTimeout > 60000) {
        recommendations.push('Consider reducing response timeout for better user experience');
      }

      if (config.retryPolicy.maxRetries > 5) {
        recommendations.push('Consider reducing max retries to avoid long delays');
      }

      return {
        isHealthy: issues.length === 0,
        issues,
        recommendations,
        lastChecked: new Date(),
        providersStatus
      };

    } catch (error) {
      this.logger.error('Health check failed', error);
      return {
        isHealthy: false,
        issues: ['Health check failed due to internal error'],
        recommendations: [],
        lastChecked: new Date(),
        providersStatus: {}
      };
    }
  }

  /**
   * Validate URL format
   */
  private isValidURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get validation recommendations based on configuration
   */
  getRecommendations(config: EnvironmentConfig, featureFlags?: FeatureFlags): string[] {
    const recommendations: string[] = [];

    // Provider recommendations
    const providerCount = Object.keys(config.llmProviders).length;
    if (providerCount === 0) {
      recommendations.push('Configure at least one LLM provider for better responses');
    } else if (providerCount === 1) {
      recommendations.push('Configure multiple providers for better reliability and fallback options');
    }

    // Performance recommendations
    if (config.maxConcurrentRequests > 50) {
      recommendations.push('Consider reducing max concurrent requests to avoid overwhelming providers');
    }

    if (config.responseTimeout > 45000) {
      recommendations.push('Consider reducing response timeout for better user experience');
    }

    // Environment-specific recommendations
    if (config.environment === 'production') {
      if (config.logLevel === 'debug') {
        recommendations.push('Use info or warn log level in production for better performance');
      }

      if (!config.enableMetrics) {
        recommendations.push('Enable metrics in production for monitoring and debugging');
      }
    }

    // Feature flag recommendations
    if (featureFlags) {
      if (!featureFlags.responseCaching && config.enableCaching) {
        recommendations.push('Enable response caching feature flag to improve performance');
      }

      if (!featureFlags.multiProviderFallback && providerCount > 1) {
        recommendations.push('Enable multi-provider fallback for better reliability');
      }
    }

    return recommendations;
  }
}