/**
 * Error Handling Strategies Configuration
 * Defines specific handling strategies for different error types
 * 
 * Requirements: FR-6
 */

import {
  ErrorType,
  ErrorSeverity,
  RecoveryStrategy,
  ErrorHandlingStrategy,
  RetryPolicy,
  FallbackStrategy
} from './ErrorTypes';

export class ErrorHandlingStrategies {
  private static readonly strategies: Map<ErrorType, ErrorHandlingStrategy> = new Map([
    // LLM Provider Errors
    [ErrorType.API_UNAVAILABLE, {
      errorType: ErrorType.API_UNAVAILABLE,
      severity: ErrorSeverity.HIGH,
      recoveryStrategy: RecoveryStrategy.FALLBACK,
      retryPolicy: {
        maxRetries: 2,
        baseDelay: 1000,
        maxDelay: 5000,
        backoffMultiplier: 2,
        retryableErrors: [ErrorType.API_UNAVAILABLE, ErrorType.NETWORK_ERROR]
      },
      fallbackStrategy: {
        enabled: true,
        fallbackType: 'static_response',
        gracefulDegradation: true
      },
      userMessage: 'AI service temporarily unavailable. Using our enhanced backup system to provide you with expert insights.',
      technicalMessage: 'LLM API unavailable, falling back to static response generation',
      logLevel: 'warn',
      notifyUser: true,
      reportToMonitoring: true
    }],

    [ErrorType.RATE_LIMITED, {
      errorType: ErrorType.RATE_LIMITED,
      severity: ErrorSeverity.MEDIUM,
      recoveryStrategy: RecoveryStrategy.RETRY,
      retryPolicy: {
        maxRetries: 3,
        baseDelay: 2000,
        maxDelay: 10000,
        backoffMultiplier: 2,
        retryableErrors: [ErrorType.RATE_LIMITED]
      },
      fallbackStrategy: {
        enabled: true,
        fallbackType: 'static_response',
        gracefulDegradation: true
      },
      userMessage: 'High demand detected. Please wait a moment while we process your request...',
      technicalMessage: 'Rate limit exceeded, implementing exponential backoff retry',
      logLevel: 'info',
      notifyUser: true,
      reportToMonitoring: true
    }],

    [ErrorType.NETWORK_ERROR, {
      errorType: ErrorType.NETWORK_ERROR,
      severity: ErrorSeverity.HIGH,
      recoveryStrategy: RecoveryStrategy.RETRY,
      retryPolicy: {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 8000,
        backoffMultiplier: 2,
        retryableErrors: [ErrorType.NETWORK_ERROR]
      },
      fallbackStrategy: {
        enabled: true,
        fallbackType: 'static_response',
        gracefulDegradation: true
      },
      userMessage: 'Connection issue detected. Retrying with backup systems...',
      technicalMessage: 'Network connectivity issue, retrying with fallback',
      logLevel: 'warn',
      notifyUser: true,
      reportToMonitoring: true
    }],

    [ErrorType.AUTHENTICATION_ERROR, {
      errorType: ErrorType.AUTHENTICATION_ERROR,
      severity: ErrorSeverity.CRITICAL,
      recoveryStrategy: RecoveryStrategy.FALLBACK,
      fallbackStrategy: {
        enabled: true,
        fallbackType: 'static_response',
        gracefulDegradation: true
      },
      userMessage: 'Authentication issue detected. Using backup response system to ensure you receive quality insights.',
      technicalMessage: 'API authentication failed, switching to static response generation',
      logLevel: 'error',
      notifyUser: false, // Don't expose auth details to user
      reportToMonitoring: true
    }],

    [ErrorType.QUOTA_EXCEEDED, {
      errorType: ErrorType.QUOTA_EXCEEDED,
      severity: ErrorSeverity.HIGH,
      recoveryStrategy: RecoveryStrategy.FALLBACK,
      fallbackStrategy: {
        enabled: true,
        fallbackType: 'static_response',
        gracefulDegradation: true
      },
      userMessage: 'Switching to our premium backup system to ensure you receive comprehensive responses.',
      technicalMessage: 'API quota exceeded, using static response generation',
      logLevel: 'warn',
      notifyUser: false, // Don't expose quota details
      reportToMonitoring: true
    }],

    [ErrorType.INVALID_RESPONSE, {
      errorType: ErrorType.INVALID_RESPONSE,
      severity: ErrorSeverity.MEDIUM,
      recoveryStrategy: RecoveryStrategy.RETRY,
      retryPolicy: {
        maxRetries: 2,
        baseDelay: 500,
        maxDelay: 2000,
        backoffMultiplier: 2,
        retryableErrors: [ErrorType.INVALID_RESPONSE]
      },
      fallbackStrategy: {
        enabled: true,
        fallbackType: 'static_response',
        gracefulDegradation: true
      },
      userMessage: 'Optimizing response quality. Please wait a moment...',
      technicalMessage: 'Invalid response received, retrying with fallback',
      logLevel: 'warn',
      notifyUser: false,
      reportToMonitoring: true
    }],

    // Persona System Errors
    [ErrorType.PERSONA_NOT_FOUND, {
      errorType: ErrorType.PERSONA_NOT_FOUND,
      severity: ErrorSeverity.MEDIUM,
      recoveryStrategy: RecoveryStrategy.GRACEFUL_DEGRADATION,
      fallbackStrategy: {
        enabled: true,
        fallbackType: 'static_response',
        gracefulDegradation: true
      },
      userMessage: 'Using default advisor configuration to provide you with expert insights.',
      technicalMessage: 'Persona not found, using default persona configuration',
      logLevel: 'warn',
      notifyUser: false,
      reportToMonitoring: true
    }],

    [ErrorType.PROMPT_GENERATION_ERROR, {
      errorType: ErrorType.PROMPT_GENERATION_ERROR,
      severity: ErrorSeverity.MEDIUM,
      recoveryStrategy: RecoveryStrategy.GRACEFUL_DEGRADATION,
      fallbackStrategy: {
        enabled: true,
        fallbackType: 'static_response',
        gracefulDegradation: true
      },
      userMessage: 'Generating response using standard advisor approach...',
      technicalMessage: 'Persona prompt generation failed, using default prompt',
      logLevel: 'warn',
      notifyUser: false,
      reportToMonitoring: true
    }],

    // Question Analysis Errors
    [ErrorType.QUESTION_ANALYSIS_ERROR, {
      errorType: ErrorType.QUESTION_ANALYSIS_ERROR,
      severity: ErrorSeverity.LOW,
      recoveryStrategy: RecoveryStrategy.GRACEFUL_DEGRADATION,
      userMessage: 'Processing your question with standard analysis...',
      technicalMessage: 'Question analysis failed, proceeding with basic categorization',
      logLevel: 'info',
      notifyUser: false,
      reportToMonitoring: false
    }],

    [ErrorType.INVALID_QUESTION_FORMAT, {
      errorType: ErrorType.INVALID_QUESTION_FORMAT,
      severity: ErrorSeverity.LOW,
      recoveryStrategy: RecoveryStrategy.GRACEFUL_DEGRADATION,
      userMessage: 'Processing your inquiry as a general question...',
      technicalMessage: 'Question format not recognized, using general processing',
      logLevel: 'info',
      notifyUser: false,
      reportToMonitoring: false
    }],

    // Response Generation Errors
    [ErrorType.RESPONSE_TIMEOUT, {
      errorType: ErrorType.RESPONSE_TIMEOUT,
      severity: ErrorSeverity.MEDIUM,
      recoveryStrategy: RecoveryStrategy.FALLBACK,
      fallbackStrategy: {
        enabled: true,
        fallbackType: 'static_response',
        gracefulDegradation: true
      },
      userMessage: 'Generating response using our rapid-response system...',
      technicalMessage: 'Response timeout exceeded, using static response generation',
      logLevel: 'warn',
      notifyUser: false,
      reportToMonitoring: true
    }],

    [ErrorType.RESPONSE_VALIDATION_ERROR, {
      errorType: ErrorType.RESPONSE_VALIDATION_ERROR,
      severity: ErrorSeverity.MEDIUM,
      recoveryStrategy: RecoveryStrategy.RETRY,
      retryPolicy: {
        maxRetries: 2,
        baseDelay: 500,
        maxDelay: 2000,
        backoffMultiplier: 2,
        retryableErrors: [ErrorType.RESPONSE_VALIDATION_ERROR]
      },
      fallbackStrategy: {
        enabled: true,
        fallbackType: 'static_response',
        gracefulDegradation: true
      },
      userMessage: 'Ensuring response quality. Please wait...',
      technicalMessage: 'Response validation failed, retrying with fallback',
      logLevel: 'warn',
      notifyUser: false,
      reportToMonitoring: true
    }],

    [ErrorType.CONCURRENT_PROCESSING_ERROR, {
      errorType: ErrorType.CONCURRENT_PROCESSING_ERROR,
      severity: ErrorSeverity.MEDIUM,
      recoveryStrategy: RecoveryStrategy.RETRY,
      retryPolicy: {
        maxRetries: 2,
        baseDelay: 1000,
        maxDelay: 3000,
        backoffMultiplier: 1.5,
        retryableErrors: [ErrorType.CONCURRENT_PROCESSING_ERROR]
      },
      userMessage: 'Processing your request with optimized resource allocation...',
      technicalMessage: 'Concurrent processing error, retrying with reduced load',
      logLevel: 'warn',
      notifyUser: false,
      reportToMonitoring: true
    }],

    // System Errors
    [ErrorType.CACHE_ERROR, {
      errorType: ErrorType.CACHE_ERROR,
      severity: ErrorSeverity.LOW,
      recoveryStrategy: RecoveryStrategy.GRACEFUL_DEGRADATION,
      userMessage: 'Processing your request without cache optimization...',
      technicalMessage: 'Cache system error, proceeding without cache',
      logLevel: 'info',
      notifyUser: false,
      reportToMonitoring: false
    }],

    [ErrorType.CONFIGURATION_ERROR, {
      errorType: ErrorType.CONFIGURATION_ERROR,
      severity: ErrorSeverity.HIGH,
      recoveryStrategy: RecoveryStrategy.GRACEFUL_DEGRADATION,
      fallbackStrategy: {
        enabled: true,
        fallbackType: 'static_response',
        gracefulDegradation: true
      },
      userMessage: 'Using default system configuration to ensure service availability.',
      technicalMessage: 'Configuration error detected, using default settings',
      logLevel: 'error',
      notifyUser: false,
      reportToMonitoring: true
    }],

    [ErrorType.SERVICE_UNAVAILABLE, {
      errorType: ErrorType.SERVICE_UNAVAILABLE,
      severity: ErrorSeverity.CRITICAL,
      recoveryStrategy: RecoveryStrategy.FALLBACK,
      fallbackStrategy: {
        enabled: true,
        fallbackType: 'static_response',
        gracefulDegradation: true
      },
      userMessage: 'Service temporarily unavailable. Using backup systems to provide you with expert insights.',
      technicalMessage: 'Core service unavailable, using all available fallbacks',
      logLevel: 'error',
      notifyUser: true,
      reportToMonitoring: true
    }],

    [ErrorType.UNKNOWN_ERROR, {
      errorType: ErrorType.UNKNOWN_ERROR,
      severity: ErrorSeverity.HIGH,
      recoveryStrategy: RecoveryStrategy.FALLBACK,
      fallbackStrategy: {
        enabled: true,
        fallbackType: 'static_response',
        gracefulDegradation: true
      },
      userMessage: 'An unexpected situation occurred. Our backup systems are ensuring you receive quality responses.',
      technicalMessage: 'Unknown error encountered, using comprehensive fallback strategy',
      logLevel: 'error',
      notifyUser: false,
      reportToMonitoring: true
    }]
  ]);

  /**
   * Get error handling strategy for a specific error type
   */
  static getStrategy(errorType: ErrorType): ErrorHandlingStrategy {
    const strategy = this.strategies.get(errorType);
    if (!strategy) {
      // Return default strategy for unknown error types
      return this.strategies.get(ErrorType.UNKNOWN_ERROR)!;
    }
    return strategy;
  }

  /**
   * Get all configured strategies
   */
  static getAllStrategies(): Map<ErrorType, ErrorHandlingStrategy> {
    return new Map(this.strategies);
  }

  /**
   * Check if an error type is retryable
   */
  static isRetryable(errorType: ErrorType): boolean {
    const strategy = this.getStrategy(errorType);
    return strategy.recoveryStrategy === RecoveryStrategy.RETRY && !!strategy.retryPolicy;
  }

  /**
   * Check if an error type has fallback enabled
   */
  static hasFallback(errorType: ErrorType): boolean {
    const strategy = this.getStrategy(errorType);
    return !!strategy.fallbackStrategy?.enabled;
  }

  /**
   * Get retry policy for an error type
   */
  static getRetryPolicy(errorType: ErrorType): RetryPolicy | undefined {
    const strategy = this.getStrategy(errorType);
    return strategy.retryPolicy;
  }

  /**
   * Get fallback strategy for an error type
   */
  static getFallbackStrategy(errorType: ErrorType): FallbackStrategy | undefined {
    const strategy = this.getStrategy(errorType);
    return strategy.fallbackStrategy;
  }

  /**
   * Update strategy for a specific error type
   */
  static updateStrategy(errorType: ErrorType, updates: Partial<ErrorHandlingStrategy>): void {
    const currentStrategy = this.getStrategy(errorType);
    const updatedStrategy = { ...currentStrategy, ...updates };
    this.strategies.set(errorType, updatedStrategy);
  }

  /**
   * Get user-friendly message for error type
   */
  static getUserMessage(errorType: ErrorType): string {
    const strategy = this.getStrategy(errorType);
    return strategy.userMessage;
  }

  /**
   * Get technical message for error type
   */
  static getTechnicalMessage(errorType: ErrorType): string {
    const strategy = this.getStrategy(errorType);
    return strategy.technicalMessage;
  }

  /**
   * Check if error should be reported to monitoring
   */
  static shouldReportToMonitoring(errorType: ErrorType): boolean {
    const strategy = this.getStrategy(errorType);
    return strategy.reportToMonitoring;
  }

  /**
   * Check if user should be notified of error
   */
  static shouldNotifyUser(errorType: ErrorType): boolean {
    const strategy = this.getStrategy(errorType);
    return strategy.notifyUser;
  }

  /**
   * Get log level for error type
   */
  static getLogLevel(errorType: ErrorType): string {
    const strategy = this.getStrategy(errorType);
    return strategy.logLevel;
  }
}
