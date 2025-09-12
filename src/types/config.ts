/**
 * Configuration and Environment Management Types
 * Defines interfaces for configuration, feature flags, and validation
 */

export interface EnvironmentConfig {
  llmProviders: LLMProviderConfig;
  defaultProvider: string;
  enableCaching: boolean;
  maxConcurrentRequests: number;
  responseTimeout: number;
  retryPolicy: RetryPolicy;
  environment: 'development' | 'production' | 'test';
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableMetrics: boolean;
  metricsEndpoint?: string;
  configVersion: string;
}

export interface LLMProviderConfig {
  openai?: {
    apiKey: string;
    model: string;
    baseURL?: string;
    temperature?: number;
    maxTokens?: number;
  };
  anthropic?: {
    apiKey: string;
    model: string;
    baseURL?: string;
    temperature?: number;
    maxTokens?: number;
  };
  gemini?: {
    apiKey: string;
    model: string;
    baseURL?: string;
    temperature?: number;
    maxTokens?: number;
  };
  local?: {
    model: string;
    baseURL: string;
    temperature?: number;
    maxTokens?: number;
  };
}

export interface RetryPolicy {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export interface FeatureFlags {
  llmIntegrationEnabled: boolean;
  enhancedStaticResponses: boolean;
  responseCaching: boolean;
  debugLogging: boolean;
  performanceMetrics: boolean;
  experimentalFeatures: boolean;
  personaPromptGeneration: boolean;
  questionAnalysis: boolean;
  multiProviderFallback: boolean;
  configHotReload: boolean;
}

export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  timestamp: Date;
}

export interface ConfigUpdateEvent {
  timestamp: Date;
  oldConfig: EnvironmentConfig;
  newConfig: EnvironmentConfig;
  oldFeatureFlags: FeatureFlags;
  newFeatureFlags: FeatureFlags;
  changedKeys: string[];
}

export interface ConfigWatcher {
  id: string;
  callback: (event: ConfigUpdateEvent) => void;
  filter?: (event: ConfigUpdateEvent) => boolean;
}

export interface RuntimeConfigUpdate {
  llmProviders?: Partial<LLMProviderConfig>;
  defaultProvider?: string;
  enableCaching?: boolean;
  maxConcurrentRequests?: number;
  responseTimeout?: number;
  retryPolicy?: Partial<RetryPolicy>;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  enableMetrics?: boolean;
}

export type FeatureFlagUpdate = {
  [K in keyof FeatureFlags]?: boolean;
}

export interface ConfigExport {
  config: EnvironmentConfig;
  featureFlags: FeatureFlags;
  validation: ConfigValidationResult;
  configuredProviders: string[];
  environment: string;
  timestamp: Date;
}

export interface EnvironmentVariableMap {
  // LLM Provider Configuration
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  OPENAI_BASE_URL?: string;
  OPENAI_TEMPERATURE?: string;
  OPENAI_MAX_TOKENS?: string;
  
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_MODEL?: string;
  ANTHROPIC_BASE_URL?: string;
  ANTHROPIC_TEMPERATURE?: string;
  ANTHROPIC_MAX_TOKENS?: string;
  
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  GEMINI_BASE_URL?: string;
  GEMINI_TEMPERATURE?: string;
  GEMINI_MAX_TOKENS?: string;
  
  LOCAL_LLM_MODEL?: string;
  LOCAL_LLM_BASE_URL?: string;
  LOCAL_TEMPERATURE?: string;
  LOCAL_MAX_TOKENS?: string;
  
  // General LLM Configuration
  LLM_DEFAULT_PROVIDER?: string;
  LLM_ENABLE_CACHING?: string;
  LLM_MAX_CONCURRENT_REQUESTS?: string;
  LLM_RESPONSE_TIMEOUT?: string;
  
  // Retry Policy
  LLM_MAX_RETRIES?: string;
  LLM_BASE_DELAY?: string;
  LLM_MAX_DELAY?: string;
  LLM_BACKOFF_MULTIPLIER?: string;
  
  // Environment Configuration
  NODE_ENV?: string;
  LOG_LEVEL?: string;
  ENABLE_METRICS?: string;
  METRICS_ENDPOINT?: string;
  CONFIG_VERSION?: string;
  
  // Feature Flags
  FEATURE_LLM_INTEGRATION?: string;
  FEATURE_ENHANCED_STATIC_RESPONSES?: string;
  FEATURE_RESPONSE_CACHING?: string;
  FEATURE_DEBUG_LOGGING?: string;
  FEATURE_PERFORMANCE_METRICS?: string;
  FEATURE_EXPERIMENTAL?: string;
  FEATURE_PERSONA_PROMPTS?: string;
  FEATURE_QUESTION_ANALYSIS?: string;
  FEATURE_MULTI_PROVIDER_FALLBACK?: string;
  FEATURE_CONFIG_HOT_RELOAD?: string;
}

export interface ConfigManagerOptions {
  enableHotReload?: boolean;
  hotReloadInterval?: number;
  validateOnLoad?: boolean;
  enableMetrics?: boolean;
  logConfigChanges?: boolean;
}

export interface ConfigHealthCheck {
  isHealthy: boolean;
  issues: string[];
  recommendations: string[];
  lastChecked: Date;
  providersStatus: {
    [provider: string]: {
      configured: boolean;
      accessible: boolean;
      lastChecked?: Date;
      error?: string;
    };
  };
}
