/**
 * LLM Provider Integration Types
 * Defines interfaces and types for LLM provider integration
 */

export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'gemini' | 'local';
  model: string;
  temperature: number;
  maxTokens: number;
  apiKey?: string;
  timeout?: number;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: string;
  timestamp: Date;
}

export interface LLMProvider {
  name: string;
  callAPI(prompt: string, config: LLMConfig): Promise<LLMResponse>;
  isAvailable(): boolean;
  getDefaultConfig(): Partial<LLMConfig>;
  validateConfig(config: LLMConfig): boolean;
}

export interface RetryPolicy {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

// Simple error types for LLM operations (avoiding circular dependencies)
export const LLMErrorType = {
  UNKNOWN_ERROR: 'unknown_error',
  API_UNAVAILABLE: 'api_unavailable',
  RATE_LIMITED: 'rate_limited',
  INVALID_RESPONSE: 'invalid_response',
  NETWORK_ERROR: 'network_error',
  AUTHENTICATION_ERROR: 'authentication_error',
  QUOTA_EXCEEDED: 'quota_exceeded',
  RESPONSE_TIMEOUT: 'response_timeout'
} as const;

export type LLMErrorType = typeof LLMErrorType[keyof typeof LLMErrorType];

export class LLMError extends Error {
  public readonly type: LLMErrorType;
  
  constructor(type: LLMErrorType, message: string) {
    super(message);
    this.name = 'LLMError';
    this.type = type;
  }
}

export class LLMProviderError extends LLMError {
  public readonly provider: string;
  public readonly retryable: boolean;
  
  constructor(
    type: LLMErrorType,
    message: string,
    provider: string,
    context?: any,
    options?: { retryable?: boolean }
  ) {
    super(type, message);
    this.name = 'LLMProviderError';
    this.provider = provider;
    this.retryable = options?.retryable ?? false;
  }
}

export interface LLMProviderConfig {
  openai?: {
    apiKey: string;
    model: string;
    baseURL?: string;
  };
  anthropic?: {
    apiKey: string;
    model: string;
    baseURL?: string;
  };
  gemini?: {
    apiKey: string;
    model: string;
    baseURL?: string;
  };
  local?: {
    model: string;
    baseURL: string;
  };
}

export interface EnvironmentConfig {
  llmProviders: LLMProviderConfig;
  defaultProvider: string;
  enableCaching: boolean;
  maxConcurrentRequests: number;
  responseTimeout: number;
  retryPolicy: RetryPolicy;
}
