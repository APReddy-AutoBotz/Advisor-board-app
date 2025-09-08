/**
 * Enhanced Configuration Manager
 * Handles environment configuration, feature flags, validation, and hot-reloading
 */

import type { 
  EnvironmentConfig, 
  FeatureFlags, 
  ConfigValidationResult,
  ConfigUpdateEvent,
  ConfigWatcher
} from '../../types/config';
import { Logger } from '../errorHandling/Logger';

export class ConfigManager {
  private static instance: ConfigManager;
  private config: EnvironmentConfig;
  private featureFlags: FeatureFlags;
  private watchers: ConfigWatcher[] = [];
  private logger: Logger;
  private configUpdateListeners: ((event: ConfigUpdateEvent) => void)[] = [];

  private constructor() {
    this.logger = new Logger('ConfigManager');
    this.config = this.loadConfiguration();
    this.featureFlags = this.loadFeatureFlags();
    this.setupHotReloading();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Load configuration from environment variables and defaults
   */
  private loadConfiguration(): EnvironmentConfig {
    try {
      const llmProviders = this.loadLLMProviders();
      const retryPolicy = this.loadRetryPolicy();
      
      const config: EnvironmentConfig = {
        llmProviders,
        defaultProvider: this.getEnvVar('LLM_DEFAULT_PROVIDER') || this.getFirstAvailableProvider(llmProviders),
        enableCaching: this.getBooleanEnvVar('LLM_ENABLE_CACHING', true),
        maxConcurrentRequests: this.getNumberEnvVar('LLM_MAX_CONCURRENT_REQUESTS', 10),
        responseTimeout: this.getNumberEnvVar('LLM_RESPONSE_TIMEOUT', 30000),
        retryPolicy,
        environment: this.getEnvVar('NODE_ENV') || 'development',
        logLevel: this.getEnvVar('LOG_LEVEL') || 'info',
        enableMetrics: this.getBooleanEnvVar('ENABLE_METRICS', false),
        metricsEndpoint: this.getEnvVar('METRICS_ENDPOINT'),
        configVersion: this.getEnvVar('CONFIG_VERSION') || '1.0.0'
      };

      this.logger.info('Configuration loaded successfully', { 
        providers: Object.keys(llmProviders),
        environment: config.environment 
      });

      return config;
    } catch (error) {
      this.logger.error('Failed to load configuration', error);
      return this.getDefaultConfiguration();
    }
  }

  /**
   * Load LLM provider configurations
   */
  private loadLLMProviders() {
    const providers: any = {};

    // OpenAI configuration
    const openaiKey = this.getEnvVar('OPENAI_API_KEY');
    if (openaiKey) {
      providers.openai = {
        apiKey: openaiKey,
        model: this.getEnvVar('OPENAI_MODEL') || 'gpt-3.5-turbo',
        baseURL: this.getEnvVar('OPENAI_BASE_URL'),
        temperature: this.getNumberEnvVar('OPENAI_TEMPERATURE', 0.7),
        maxTokens: this.getNumberEnvVar('OPENAI_MAX_TOKENS', 2048)
      };
    }

    // Anthropic configuration
    const anthropicKey = this.getEnvVar('ANTHROPIC_API_KEY');
    if (anthropicKey) {
      providers.anthropic = {
        apiKey: anthropicKey,
        model: this.getEnvVar('ANTHROPIC_MODEL') || 'claude-3-sonnet-20240229',
        baseURL: this.getEnvVar('ANTHROPIC_BASE_URL'),
        temperature: this.getNumberEnvVar('ANTHROPIC_TEMPERATURE', 0.7),
        maxTokens: this.getNumberEnvVar('ANTHROPIC_MAX_TOKENS', 2048)
      };
    }

    // Gemini configuration
    const geminiKey = this.getEnvVar('GEMINI_API_KEY');
    if (geminiKey) {
      providers.gemini = {
        apiKey: geminiKey,
        model: this.getEnvVar('GEMINI_MODEL') || 'gemini-1.5-flash',
        baseURL: this.getEnvVar('GEMINI_BASE_URL'),
        temperature: this.getNumberEnvVar('GEMINI_TEMPERATURE', 0.7),
        maxTokens: this.getNumberEnvVar('GEMINI_MAX_TOKENS', 2048)
      };
    }

    // Local model configuration
    const localBaseURL = this.getEnvVar('LOCAL_LLM_BASE_URL');
    const localModel = this.getEnvVar('LOCAL_LLM_MODEL');
    if (localBaseURL || localModel) {
      providers.local = {
        model: localModel || 'llama2',
        baseURL: localBaseURL || 'http://localhost:11434',
        temperature: this.getNumberEnvVar('LOCAL_TEMPERATURE', 0.7),
        maxTokens: this.getNumberEnvVar('LOCAL_MAX_TOKENS', 2048)
      };
    }

    return providers;
  }

  /**
   * Load retry policy configuration
   */
  private loadRetryPolicy() {
    return {
      maxRetries: this.getNumberEnvVar('LLM_MAX_RETRIES', 3),
      baseDelay: this.getNumberEnvVar('LLM_BASE_DELAY', 1000),
      maxDelay: this.getNumberEnvVar('LLM_MAX_DELAY', 10000),
      backoffMultiplier: this.getNumberEnvVar('LLM_BACKOFF_MULTIPLIER', 2)
    };
  }

  /**
   * Load feature flags from environment
   */
  private loadFeatureFlags(): FeatureFlags {
    return {
      llmIntegrationEnabled: this.getBooleanEnvVar('FEATURE_LLM_INTEGRATION', true),
      enhancedStaticResponses: this.getBooleanEnvVar('FEATURE_ENHANCED_STATIC_RESPONSES', true),
      responseCaching: this.getBooleanEnvVar('FEATURE_RESPONSE_CACHING', true),
      debugLogging: this.getBooleanEnvVar('FEATURE_DEBUG_LOGGING', false),
      performanceMetrics: this.getBooleanEnvVar('FEATURE_PERFORMANCE_METRICS', false),
      experimentalFeatures: this.getBooleanEnvVar('FEATURE_EXPERIMENTAL', false),
      personaPromptGeneration: this.getBooleanEnvVar('FEATURE_PERSONA_PROMPTS', true),
      questionAnalysis: this.getBooleanEnvVar('FEATURE_QUESTION_ANALYSIS', true),
      multiProviderFallback: this.getBooleanEnvVar('FEATURE_MULTI_PROVIDER_FALLBACK', true),
      configHotReload: this.getBooleanEnvVar('FEATURE_CONFIG_HOT_RELOAD', true)
    };
  }

  /**
   * Get environment variable with fallback support
   */
  private getEnvVar(key: string): string | undefined {
    // Try process.env first (Node.js environment)
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key];
    }

    // Try import.meta.env for Vite (browser environment)
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env[`VITE_${key}`];
    }

    return undefined;
  }

  /**
   * Get boolean environment variable with default
   */
  private getBooleanEnvVar(key: string, defaultValue: boolean): boolean {
    const value = this.getEnvVar(key);
    if (value === undefined) return defaultValue;
    return value.toLowerCase() === 'true' || value === '1';
  }

  /**
   * Get number environment variable with default
   */
  private getNumberEnvVar(key: string, defaultValue: number): number {
    const value = this.getEnvVar(key);
    if (value === undefined) return defaultValue;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Get the first available provider from configuration
   */
  private getFirstAvailableProvider(providers: any): string {
    const providerOrder = ['openai', 'anthropic', 'gemini', 'local'];
    
    for (const provider of providerOrder) {
      if (providers[provider]) {
        return provider;
      }
    }

    return 'openai'; // Default fallback
  }

  /**
   * Get default configuration
   */
  private getDefaultConfiguration(): EnvironmentConfig {
    return {
      llmProviders: {},
      defaultProvider: 'openai',
      enableCaching: true,
      maxConcurrentRequests: 10,
      responseTimeout: 30000,
      retryPolicy: {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2
      },
      environment: 'development',
      logLevel: 'info',
      enableMetrics: false,
      configVersion: '1.0.0'
    };
  }

  /**
   * Setup hot-reloading for development
   */
  private setupHotReloading(): void {
    if (!this.featureFlags.configHotReload || this.config.environment === 'production') {
      return;
    }

    // In a real implementation, this would watch for file changes
    // For now, we'll set up a periodic check for environment variable changes
    if (typeof window !== 'undefined') {
      // Browser environment - check for changes periodically
      setInterval(() => {
        this.checkForConfigChanges();
      }, 5000);
    }
  }

  /**
   * Check for configuration changes
   */
  private checkForConfigChanges(): void {
    try {
      const newConfig = this.loadConfiguration();
      const newFeatureFlags = this.loadFeatureFlags();

      if (this.hasConfigChanged(newConfig) || this.hasFeatureFlagsChanged(newFeatureFlags)) {
        const oldConfig = { ...this.config };
        const oldFeatureFlags = { ...this.featureFlags };

        this.config = newConfig;
        this.featureFlags = newFeatureFlags;

        const event: ConfigUpdateEvent = {
          timestamp: new Date(),
          oldConfig,
          newConfig,
          oldFeatureFlags,
          newFeatureFlags,
          changedKeys: this.getChangedKeys(oldConfig, newConfig)
        };

        this.notifyConfigUpdate(event);
        this.logger.info('Configuration updated via hot-reload', { 
          changedKeys: event.changedKeys 
        });
      }
    } catch (error) {
      this.logger.error('Failed to check for config changes', error);
    }
  }

  /**
   * Check if configuration has changed
   */
  private hasConfigChanged(newConfig: EnvironmentConfig): boolean {
    return JSON.stringify(this.config) !== JSON.stringify(newConfig);
  }

  /**
   * Check if feature flags have changed
   */
  private hasFeatureFlagsChanged(newFeatureFlags: FeatureFlags): boolean {
    return JSON.stringify(this.featureFlags) !== JSON.stringify(newFeatureFlags);
  }

  /**
   * Get changed configuration keys
   */
  private getChangedKeys(oldConfig: any, newConfig: any): string[] {
    const changedKeys: string[] = [];
    
    const checkObject = (old: any, current: any, prefix = '') => {
      for (const key in current) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof current[key] === 'object' && current[key] !== null) {
          if (typeof old[key] === 'object' && old[key] !== null) {
            checkObject(old[key], current[key], fullKey);
          } else {
            changedKeys.push(fullKey);
          }
        } else if (old[key] !== current[key]) {
          changedKeys.push(fullKey);
        }
      }
    };

    checkObject(oldConfig, newConfig);
    return changedKeys;
  }

  /**
   * Notify configuration update listeners
   */
  private notifyConfigUpdate(event: ConfigUpdateEvent): void {
    this.configUpdateListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        this.logger.error('Error in config update listener', error);
      }
    });
  }

  /**
   * Get current configuration
   */
  getConfig(): EnvironmentConfig {
    return { ...this.config };
  }

  /**
   * Get current feature flags
   */
  getFeatureFlags(): FeatureFlags {
    return { ...this.featureFlags };
  }

  /**
   * Check if a feature is enabled
   */
  isFeatureEnabled(feature: keyof FeatureFlags): boolean {
    return this.featureFlags[feature];
  }

  /**
   * Update configuration at runtime
   */
  updateConfig(updates: Partial<EnvironmentConfig>): ConfigValidationResult {
    const newConfig = { ...this.config, ...updates };
    const validation = this.validateConfiguration(newConfig);

    if (validation.isValid) {
      const oldConfig = { ...this.config };
      this.config = newConfig;

      const event: ConfigUpdateEvent = {
        timestamp: new Date(),
        oldConfig,
        newConfig,
        oldFeatureFlags: this.featureFlags,
        newFeatureFlags: this.featureFlags,
        changedKeys: this.getChangedKeys(oldConfig, newConfig)
      };

      this.notifyConfigUpdate(event);
      this.logger.info('Configuration updated at runtime', { 
        changedKeys: event.changedKeys 
      });
    }

    return validation;
  }

  /**
   * Update feature flags at runtime
   */
  updateFeatureFlags(updates: Partial<FeatureFlags>): void {
    const oldFeatureFlags = { ...this.featureFlags };
    this.featureFlags = { ...this.featureFlags, ...updates };

    const event: ConfigUpdateEvent = {
      timestamp: new Date(),
      oldConfig: this.config,
      newConfig: this.config,
      oldFeatureFlags,
      newFeatureFlags: this.featureFlags,
      changedKeys: Object.keys(updates)
    };

    this.notifyConfigUpdate(event);
    this.logger.info('Feature flags updated at runtime', { 
      changedFlags: Object.keys(updates) 
    });
  }

  /**
   * Comprehensive configuration validation
   */
  validateConfiguration(config?: EnvironmentConfig): ConfigValidationResult {
    const configToValidate = config || this.config;
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate LLM providers
      const providerValidation = this.validateLLMProviders(configToValidate.llmProviders);
      errors.push(...providerValidation.errors);
      warnings.push(...providerValidation.warnings);

      // Validate default provider
      if (!configToValidate.llmProviders[configToValidate.defaultProvider as keyof typeof configToValidate.llmProviders]) {
        errors.push(`Default provider '${configToValidate.defaultProvider}' is not configured.`);
      }

      // Validate retry policy
      const retryValidation = this.validateRetryPolicy(configToValidate.retryPolicy);
      errors.push(...retryValidation.errors);
      warnings.push(...retryValidation.warnings);

      // Validate timeouts and limits
      if (configToValidate.responseTimeout < 1000) {
        errors.push('Response timeout must be at least 1000ms.');
      }

      if (configToValidate.maxConcurrentRequests < 1) {
        errors.push('Max concurrent requests must be at least 1.');
      }

      if (configToValidate.maxConcurrentRequests > 100) {
        warnings.push('Max concurrent requests is very high (>100). This may cause performance issues.');
      }

      // Validate environment-specific settings
      if (configToValidate.environment === 'production') {
        if (this.featureFlags.debugLogging) {
          warnings.push('Debug logging is enabled in production environment.');
        }
        
        if (!configToValidate.enableMetrics) {
          warnings.push('Metrics are disabled in production environment.');
        }
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
  private validateLLMProviders(providers: any): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (Object.keys(providers).length === 0) {
      warnings.push('No LLM providers configured. System will use static responses only.');
      return { errors, warnings };
    }

    for (const [providerName, config] of Object.entries(providers)) {
      if (!config) continue;

      const providerConfig = config as any;

      // Validate API keys for external providers
      if (['openai', 'anthropic', 'gemini'].includes(providerName)) {
        if (!providerConfig.apiKey) {
          errors.push(`${providerName} provider is missing API key.`);
        } else if (providerConfig.apiKey.length < 10) {
          warnings.push(`${providerName} API key appears to be invalid (too short).`);
        }
      }

      // Validate model names
      if (!providerConfig.model) {
        errors.push(`${providerName} provider is missing model configuration.`);
      }

      // Validate base URLs
      if (providerConfig.baseURL) {
        try {
          new URL(providerConfig.baseURL);
        } catch {
          errors.push(`${providerName} provider has invalid base URL: ${providerConfig.baseURL}`);
        }
      }

      // Validate temperature and token limits
      if (providerConfig.temperature !== undefined) {
        if (providerConfig.temperature < 0 || providerConfig.temperature > 2) {
          warnings.push(`${providerName} temperature should be between 0 and 2.`);
        }
      }

      if (providerConfig.maxTokens !== undefined) {
        if (providerConfig.maxTokens < 1 || providerConfig.maxTokens > 32000) {
          warnings.push(`${providerName} maxTokens should be between 1 and 32000.`);
        }
      }
    }

    return { errors, warnings };
  }

  /**
   * Validate retry policy configuration
   */
  private validateRetryPolicy(retryPolicy: any): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (retryPolicy.maxRetries < 0) {
      errors.push('Max retries must be non-negative.');
    }

    if (retryPolicy.maxRetries > 10) {
      warnings.push('Max retries is very high (>10). This may cause long delays.');
    }

    if (retryPolicy.baseDelay < 0) {
      errors.push('Base delay must be non-negative.');
    }

    if (retryPolicy.maxDelay < retryPolicy.baseDelay) {
      errors.push('Max delay must be greater than or equal to base delay.');
    }

    if (retryPolicy.backoffMultiplier < 1) {
      errors.push('Backoff multiplier must be at least 1.');
    }

    return { errors, warnings };
  }

  /**
   * Add configuration update listener
   */
  addConfigUpdateListener(listener: (event: ConfigUpdateEvent) => void): void {
    this.configUpdateListeners.push(listener);
  }

  /**
   * Remove configuration update listener
   */
  removeConfigUpdateListener(listener: (event: ConfigUpdateEvent) => void): void {
    const index = this.configUpdateListeners.indexOf(listener);
    if (index > -1) {
      this.configUpdateListeners.splice(index, 1);
    }
  }

  /**
   * Export configuration for debugging (without sensitive data)
   */
  exportConfigForDebug(): any {
    const debugConfig = { ...this.config };
    
    // Remove sensitive API keys
    for (const [providerName, providerConfig] of Object.entries(debugConfig.llmProviders)) {
      if (providerConfig && 'apiKey' in providerConfig) {
        (providerConfig as any).apiKey = providerConfig.apiKey ? '[REDACTED]' : undefined;
      }
    }

    return {
      config: debugConfig,
      featureFlags: this.featureFlags,
      validation: this.validateConfiguration(),
      configuredProviders: Object.keys(this.config.llmProviders),
      environment: this.config.environment
    };
  }

  /**
   * Reset configuration to defaults
   */
  resetConfig(): void {
    const oldConfig = { ...this.config };
    const oldFeatureFlags = { ...this.featureFlags };
    
    this.config = this.loadConfiguration();
    this.featureFlags = this.loadFeatureFlags();

    const event: ConfigUpdateEvent = {
      timestamp: new Date(),
      oldConfig,
      newConfig: this.config,
      oldFeatureFlags,
      newFeatureFlags: this.featureFlags,
      changedKeys: ['*'] // Indicate full reset
    };

    this.notifyConfigUpdate(event);
    this.logger.info('Configuration reset to defaults');
  }
}