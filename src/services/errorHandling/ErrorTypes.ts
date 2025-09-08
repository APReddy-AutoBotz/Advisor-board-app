/**
 * Comprehensive Error Type Definitions
 * Defines all error types and handling strategies for the persona-LLM integration system
 * 
 * Requirements: FR-6
 */

export enum ErrorType {
  // LLM Provider Errors
  API_UNAVAILABLE = 'api_unavailable',
  RATE_LIMITED = 'rate_limited',
  INVALID_RESPONSE = 'invalid_response',
  NETWORK_ERROR = 'network_error',
  CONFIGURATION_ERROR = 'configuration_error',
  AUTHENTICATION_ERROR = 'authentication_error',
  QUOTA_EXCEEDED = 'quota_exceeded',
  
  // Persona System Errors
  PERSONA_NOT_FOUND = 'persona_not_found',
  PROMPT_GENERATION_ERROR = 'prompt_generation_error',
  PERSONA_VALIDATION_ERROR = 'persona_validation_error',
  
  // Question Analysis Errors
  QUESTION_ANALYSIS_ERROR = 'question_analysis_error',
  INVALID_QUESTION_FORMAT = 'invalid_question_format',
  
  // Response Generation Errors
  RESPONSE_TIMEOUT = 'response_timeout',
  RESPONSE_VALIDATION_ERROR = 'response_validation_error',
  CONCURRENT_PROCESSING_ERROR = 'concurrent_processing_error',
  
  // System Errors
  CACHE_ERROR = 'cache_error',
  CONFIGURATION_LOAD_ERROR = 'configuration_load_error',
  SERVICE_UNAVAILABLE = 'service_unavailable',
  UNKNOWN_ERROR = 'unknown_error'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum RecoveryStrategy {
  RETRY = 'retry',
  FALLBACK = 'fallback',
  GRACEFUL_DEGRADATION = 'graceful_degradation',
  FAIL_FAST = 'fail_fast',
  USER_INTERVENTION = 'user_intervention'
}

export interface ErrorContext {
  timestamp: Date;
  requestId?: string;
  userId?: string;
  advisorId?: string;
  provider?: string;
  question?: string;
  stackTrace?: string;
  additionalData?: Record<string, any>;
}

export interface RetryPolicy {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: ErrorType[];
}

export interface FallbackStrategy {
  enabled: boolean;
  fallbackType: 'static_response' | 'cached_response' | 'simplified_response';
  fallbackProvider?: string;
  gracefulDegradation: boolean;
}

export interface ErrorHandlingStrategy {
  errorType: ErrorType;
  severity: ErrorSeverity;
  recoveryStrategy: RecoveryStrategy;
  retryPolicy?: RetryPolicy;
  fallbackStrategy?: FallbackStrategy;
  userMessage: string;
  technicalMessage: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  notifyUser: boolean;
  reportToMonitoring: boolean;
}

export class SystemError extends Error {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly context: ErrorContext;
  public readonly retryable: boolean;
  public readonly userMessage: string;
  public readonly technicalMessage: string;
  public readonly requestId?: string;

  constructor(
    type: ErrorType,
    message: string,
    context: Partial<ErrorContext> = {},
    options: {
      severity?: ErrorSeverity;
      retryable?: boolean;
      userMessage?: string;
      cause?: Error;
    } = {}
  ) {
    super(message);
    this.name = 'SystemError';
    this.type = type;
    this.severity = options.severity || ErrorSeverity.MEDIUM;
    this.retryable = options.retryable || false;
    this.userMessage = options.userMessage || this.getDefaultUserMessage(type);
    this.technicalMessage = message;
    this.requestId = context.requestId || this.generateRequestId();
    
    this.context = {
      timestamp: new Date(),
      requestId: this.requestId,
      stackTrace: this.stack,
      ...context
    };

    if (options.cause) {
      this.cause = options.cause;
    }
  }

  private getDefaultUserMessage(type: ErrorType): string {
    const messages: Record<ErrorType, string> = {
      [ErrorType.API_UNAVAILABLE]: 'The AI service is temporarily unavailable. We\'ll use our backup system to provide you with a response.',
      [ErrorType.RATE_LIMITED]: 'We\'re experiencing high demand. Please wait a moment and try again.',
      [ErrorType.NETWORK_ERROR]: 'Connection issue detected. Retrying with backup systems...',
      [ErrorType.AUTHENTICATION_ERROR]: 'Authentication failed. Please check your API configuration.',
      [ErrorType.QUOTA_EXCEEDED]: 'API quota exceeded. Switching to backup response system.',
      [ErrorType.PERSONA_NOT_FOUND]: 'Advisor configuration not found. Using default advisor settings.',
      [ErrorType.RESPONSE_TIMEOUT]: 'Response is taking longer than expected. Generating alternative response...',
      [ErrorType.INVALID_RESPONSE]: 'Received invalid response from AI service. Using backup system.',
      [ErrorType.CONFIGURATION_ERROR]: 'System configuration issue detected. Using default settings.',
      [ErrorType.PROMPT_GENERATION_ERROR]: 'Error generating personalized prompt. Using standard prompt.',
      [ErrorType.PERSONA_VALIDATION_ERROR]: 'Advisor persona validation failed. Using default persona.',
      [ErrorType.QUESTION_ANALYSIS_ERROR]: 'Question analysis failed. Proceeding with standard processing.',
      [ErrorType.INVALID_QUESTION_FORMAT]: 'Question format not recognized. Processing as general inquiry.',
      [ErrorType.RESPONSE_VALIDATION_ERROR]: 'Response validation failed. Generating alternative response.',
      [ErrorType.CONCURRENT_PROCESSING_ERROR]: 'Processing error occurred. Retrying with reduced load.',
      [ErrorType.CACHE_ERROR]: 'Cache system error. Proceeding without cache.',
      [ErrorType.CONFIGURATION_LOAD_ERROR]: 'Configuration loading failed. Using default settings.',
      [ErrorType.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable. Using backup systems.',
      [ErrorType.UNKNOWN_ERROR]: 'An unexpected error occurred. Our team has been notified.'
    };

    return messages[type] || 'An error occurred while processing your request.';
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  toJSON() {
    return {
      name: this.name,
      type: this.type,
      severity: this.severity,
      message: this.message,
      userMessage: this.userMessage,
      technicalMessage: this.technicalMessage,
      retryable: this.retryable,
      requestId: this.requestId,
      context: this.context,
      stack: this.stack
    };
  }
}

export class LLMProviderError extends SystemError {
  public readonly provider: string;

  constructor(
    type: ErrorType,
    message: string,
    provider: string,
    context: Partial<ErrorContext> = {},
    options: {
      severity?: ErrorSeverity;
      retryable?: boolean;
      userMessage?: string;
      cause?: Error;
    } = {}
  ) {
    super(type, message, { ...context, provider }, options);
    this.name = 'LLMProviderError';
    this.provider = provider;
  }
}

export class PersonaError extends SystemError {
  public readonly advisorId?: string;
  public readonly personaKey?: string;

  constructor(
    type: ErrorType,
    message: string,
    context: Partial<ErrorContext> & { advisorId?: string; personaKey?: string } = {},
    options: {
      severity?: ErrorSeverity;
      retryable?: boolean;
      userMessage?: string;
      cause?: Error;
    } = {}
  ) {
    super(type, message, context, options);
    this.name = 'PersonaError';
    this.advisorId = context.advisorId;
    this.personaKey = context.personaKey;
  }
}

export class ResponseGenerationError extends SystemError {
  public readonly advisorId?: string;
  public readonly questionType?: string;

  constructor(
    type: ErrorType,
    message: string,
    context: Partial<ErrorContext> & { advisorId?: string; questionType?: string } = {},
    options: {
      severity?: ErrorSeverity;
      retryable?: boolean;
      userMessage?: string;
      cause?: Error;
    } = {}
  ) {
    super(type, message, context, options);
    this.name = 'ResponseGenerationError';
    this.advisorId = context.advisorId;
    this.questionType = context.questionType;
  }
}