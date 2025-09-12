/**
 * Temporary Error Handling Stub
 * Minimal exports to prevent import errors
 */

// Complete error types needed by LLM providers
export enum ErrorType {
  UNKNOWN_ERROR = 'unknown_error',
  API_UNAVAILABLE = 'api_unavailable',
  RATE_LIMITED = 'rate_limited',
  INVALID_RESPONSE = 'invalid_response',
  NETWORK_ERROR = 'network_error',
  CONFIGURATION_ERROR = 'configuration_error',
  AUTHENTICATION_ERROR = 'authentication_error',
  QUOTA_EXCEEDED = 'quota_exceeded',
  RESPONSE_TIMEOUT = 'response_timeout'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Simple error classes
export class SystemError extends Error {
  public readonly type: ErrorType = ErrorType.UNKNOWN_ERROR;
  public readonly severity: ErrorSeverity = ErrorSeverity.MEDIUM;
  
  constructor(message: string) {
    super(message);
    this.name = 'SystemError';
  }
}

export class LLMProviderError extends SystemError {
  public readonly provider: string;
  public readonly retryable: boolean;
  
  constructor(
    type: ErrorType,
    message: string,
    provider: string,
    context?: any,
    options?: { retryable?: boolean }
  ) {
    super(message);
    this.name = 'LLMProviderError';
    this.type = type;
    this.provider = provider;
    this.retryable = options?.retryable ?? false;
  }
}

export class PersonaError extends SystemError {
  constructor(message: string) {
    super(message);
    this.name = 'PersonaError';
  }
}

export class ResponseGenerationError extends SystemError {
  constructor(message: string) {
    super(message);
    this.name = 'ResponseGenerationError';
  }
}

// Stub classes to prevent import errors
export class ErrorRecoveryManager {
  static getInstance() {
    return new ErrorRecoveryManager();
  }
  
  async recover(error: any) {
    return { success: false, error };
  }
}

export class Logger {
  static getInstance() {
    return new Logger();
  }
  
  log(level: string, message: string, context?: any) {
    console.log(`[${level}] ${message}`, context);
  }
  
  error(message: string, context?: any) {
    console.error(message, context);
  }
  
  warn(message: string, context?: any) {
    console.warn(message, context);
  }
  
  info(message: string, context?: any) {
    console.info(message, context);
  }
}

export class FallbackManager {
  static getInstance() {
    return new FallbackManager();
  }
  
  getFallbackResponse() {
    return { content: 'Fallback response', success: true };
  }
}

export class ErrorHandlingStrategies {
  static getStrategy(errorType: ErrorType) {
    return { retryable: false, fallback: true };
  }
}

// Stub exports to prevent import errors
export const ErrorHandlingUtils = {
  createSystemError: (error: unknown): SystemError => {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new SystemError(message);
  },
  getUserMessage: (error: unknown): string => {
    return 'An error occurred. Please try again.';
  }
};

export const DEFAULT_ERROR_CONFIG = {
  retryPolicy: {
    maxRetries: 3,
    baseDelay: 1000
  }
};
