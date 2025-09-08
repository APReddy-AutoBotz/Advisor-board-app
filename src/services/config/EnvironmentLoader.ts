/**
 * Environment Configuration Loader
 * Handles loading configuration from various sources and environments
 */

import type { 
  EnvironmentConfig, 
  FeatureFlags, 
  EnvironmentVariableMap,
  ConfigManagerOptions 
} from '../../types/config';
import { Logger } from '../errorHandling/Logger';

export class EnvironmentLoader {
  private static instance: EnvironmentLoader;
  private logger: Logger;
  private configSources: string[] = [];

  private constructor() {
    this.logger = new Logger('EnvironmentLoader');
  }

  /**
   * Get singleton instance
   */
  static getInstance(): EnvironmentLoader {
    if (!EnvironmentLoader.instance) {
      EnvironmentLoader.instance = new EnvironmentLoader();
    }
    return EnvironmentLoader.instance;
  }

  /**
   * Load configuration from all available sources
   */
  loadConfiguration(options?: ConfigManagerOptions): EnvironmentConfig {
    this.configSources = [];
    
    try {
      // Load from environment variables
      const envConfig = this.loadFromEnvironment();
      this.configSources.push('environment');

      // Load from .env files (if available)
      const dotenvConfig = this.loadFromDotenv();
      if (dotenvConfig) {
        this.configSources.push('.env');
      }

      // Load from config files (if available)
      const fileConfig = this.loadFromConfigFile();
      if (fileConfig) {
        this.configSources.push('config-file');
      }

      // Merge configurations with priority: file > .env > environment
      const mergedConfig = this.mergeConfigurations([
        envConfig,
        dotenvConfig,
        fileConfig
      ].filter(Boolean) as EnvironmentConfig[]);

      // Apply defaults
      const finalConfig = this.applyDefaults(mergedConfig);

      this.logger.info('Configuration loaded successfully', {
        sources: this.configSources,
        providers: Object.keys(finalConfig.llmProviders),
        environment: finalConfig.environment
      });

      return finalConfig;

    } catch (error) {
      this.logger.error('Failed to load configuration', error);
      return this.getDefaultConfiguration();
    }
  }

  /**
   * Load feature flags from environment
   */
  loadFeatureFlags(): FeatureFlags {
    try {
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
    } catch (error) {
      this.logger.error('Failed to load feature flags', error);
      return this.getDefaultFeatureFlags();
    }
  }

  /**
   * Load configuration from environment variables
   */
  private loadFromEnvironment(): EnvironmentConfig {
    const llmProviders = this.loadLLMProvidersFromEnv();
    const retryPolicy = this.loadRetryPolicyFromEnv();

    return {
      llmProviders,
      defaultProvider: this.getEnvVar('LLM_DEFAULT_PROVIDER') || this.getFirstAvailableProvider(llmProviders),
      enableCaching: this.getBooleanEnvVar('LLM_ENABLE_CACHING', true),
      maxConcurrentRequests: this.getNumberEnvVar('LLM_MAX_CONCURRENT_REQUESTS', 10),
      responseTimeout: this.getNumberEnvVar('LLM_RESPONSE_TIMEOUT', 30000),
      retryPolicy,
      environment: (this.getEnvVar('NODE_ENV') as any) || 'development',
      logLevel: (this.getEnvVar('LOG_LEVEL') as any) || 'info',
      enableMetrics: this.getBooleanEnvVar('ENABLE_METRICS', false),
      metricsEndpoint: this.getEnvVar('METRICS_ENDPOINT'),
      configVersion: this.getEnvVar('CONFIG_VERSION') || '1.0.0'
    };
  }

  /**
   * Load LLM providers from environment variables
   */
  private loadLLMProvidersFromEnv(): any {
    const providers: any = {};

    // OpenAI
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

    // Anthropic
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

    // Gemini
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

    // Local
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
   * Load retry policy from environment variables
   */
  private loadRetryPolicyFromEnv() {
    return {
      maxRetries: this.getNumberEnvVar('LLM_MAX_RETRIES', 3),
      baseDelay: this.getNumberEnvVar('LLM_BASE_DELAY', 1000),
      maxDelay: this.getNumberEnvVar('LLM_MAX_DELAY', 10000),
      backoffMultiplier: this.getNumberEnvVar('LLM_BACKOFF_MULTIPLIER', 2)
    };
  }

  /**
   * Load configuration from .env files
   */
  private loadFromDotenv(): EnvironmentConfig | null {
    // In a real implementation, this would use a dotenv library
    // For now, we'll return null as .env loading is handled by the build system
    return null;
  }

  /**
   * Load configuration from config files
   */
  private loadFromConfigFile(): EnvironmentConfig | null {
    try {
      // Try to load from various config file locations
      const configPaths = [
        './config/app.json',
        './config/config.json',
        './app.config.json',
        './config.json'
      ];

      for (const path of configPaths) {
        try {
          // In a real implementation, this would use fs to read the file
          // For browser environment, this would need to be pre-loaded
          const config = this.loadConfigFromPath(path);
          if (config) {
            return config;
          }
        } catch (error) {
          // Continue to next path
        }
      }

      return null;
    } catch (error) {
      this.logger.warn('Failed to load configuration from file', error);
      return null;
    }
  }

  /**
   * Load configuration from a specific path
   */
  private loadConfigFromPath(path: string): EnvironmentConfig | null {
    // This would be implemented differently for Node.js vs browser
    // For now, return null as file loading is not available in browser
    return null;
  }

  /**
   * Merge multiple configurations with priority
   */
  private mergeConfigurations(configs: EnvironmentConfig[]): EnvironmentConfig {
    if (configs.length === 0) {
      return this.getDefaultConfiguration();
    }

    if (configs.length === 1) {
      return configs[0];
    }

    // Merge configurations (later configs override earlier ones)
    const merged = configs.reduce((acc, config) => {
      return {
        ...acc,
        ...config,
        llmProviders: {
          ...acc.llmProviders,
          ...config.llmProviders
        },
        retryPolicy: {
          ...acc.retryPolicy,
          ...config.retryPolicy
        }
      };
    });

    return merged;
  }

  /**
   * Apply default values to configuration
   */
  private applyDefaults(config: EnvironmentConfig): EnvironmentConfig {
    const defaults = this.getDefaultConfiguration();

    return {
      ...defaults,
      ...config,
      llmProviders: {
        ...defaults.llmProviders,
        ...config.llmProviders
      },
      retryPolicy: {
        ...defaults.retryPolicy,
        ...config.retryPolicy
      }
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

    // Try window environment variables (if set by build process)
    if (typeof window !== 'undefined' && (window as any).__ENV__) {
      return (window as any).__ENV__[key];
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
   * Get the first available provider
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
   * Get default feature flags
   */
  private getDefaultFeatureFlags(): FeatureFlags {
    return {
      llmIntegrationEnabled: true,
      enhancedStaticResponses: true,
      responseCaching: true,
      debugLogging: false,
      performanceMetrics: false,
      experimentalFeatures: false,
      personaPromptGeneration: true,
      questionAnalysis: true,
      multiProviderFallback: true,
      configHotReload: true
    };
  }

  /**
   * Get configuration sources used
   */
  getConfigSources(): string[] {
    return [...this.configSources];
  }

  /**
   * Check if running in browser environment
   */
  private isBrowserEnvironment(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  }

  /**
   * Check if running in Node.js environment
   */
  private isNodeEnvironment(): boolean {
    return typeof process !== 'undefined' && process.versions && process.versions.node;
  }

  /**
   * Get environment type
   */
  getEnvironmentType(): 'browser' | 'node' | 'unknown' {
    if (this.isBrowserEnvironment()) return 'browser';
    if (this.isNodeEnvironment()) return 'node';
    return 'unknown';
  }

  /**
   * Validate environment setup
   */
  validateEnvironmentSetup(): { isValid: boolean; issues: string[]; recommendations: string[] } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    const envType = this.getEnvironmentType();
    
    if (envType === 'unknown') {
      issues.push('Unable to determine environment type');
    }

    // Check for common environment issues
    if (envType === 'browser') {
      if (!import.meta?.env) {
        recommendations.push('Consider using Vite for better environment variable support');
      }
    }

    if (envType === 'node') {
      if (!process.env) {
        issues.push('Process environment variables are not available');
      }
    }

    // Check for required environment variables
    const requiredVars = ['NODE_ENV'];
    for (const varName of requiredVars) {
      if (!this.getEnvVar(varName)) {
        recommendations.push(`Consider setting ${varName} environment variable`);
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    };
  }
}