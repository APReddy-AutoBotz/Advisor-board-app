/**
 * Error Recovery Manager
 * Coordinates error handling, retry logic, and recovery strategies
 * 
 * Requirements: FR-6
 */

import type { Advisor, AdvisorResponse, DomainId } from '../../types/domain';
import type { LLMConfig } from '../../types/llm';
import {
  ErrorType,
  SystemError,
  LLMProviderError,
  PersonaError,
  ResponseGenerationError,
  RecoveryStrategy,
  RetryPolicy
} from './ErrorTypes';
import { ErrorHandlingStrategies } from './ErrorHandlingStrategies';
import { FallbackManager, FallbackResult } from './FallbackManager';
import { Logger } from './Logger';

export interface RecoveryResult {
  success: boolean;
  response?: AdvisorResponse;
  attempts: number;
  totalTime: number;
  strategy: RecoveryStrategy;
  fallbackUsed: boolean;
  error?: SystemError;
}

export interface RecoveryContext {
  advisor: Advisor;
  question: string;
  domainId: DomainId;
  originalConfig?: Partial<LLMConfig>;
  requestId: string;
  startTime: number;
}

export class ErrorRecoveryManager {
  private fallbackManager: FallbackManager;
  private logger: Logger;
  private activeRecoveries: Map<string, RecoveryContext> = new Map();

  constructor() {
    this.fallbackManager = new FallbackManager();
    this.logger = new Logger('ErrorRecoveryManager');
  }

  /**
   * Execute error recovery strategy
   */
  async executeRecovery(
    error: SystemError,
    context: RecoveryContext,
    operation: () => Promise<AdvisorResponse>
  ): Promise<RecoveryResult> {
    const strategy = ErrorHandlingStrategies.getStrategy(error.type);
    
    this.logger.info(`Starting error recovery`, {
      errorType: error.type,
      strategy: strategy.recoveryStrategy,
      advisorId: context.advisor.id,
      requestId: context.requestId
    });

    // Track active recovery
    this.activeRecoveries.set(context.requestId, context);

    try {
      switch (strategy.recoveryStrategy) {
        case RecoveryStrategy.RETRY:
          return await this.executeRetryStrategy(error, context, operation, strategy.retryPolicy);
        
        case RecoveryStrategy.FALLBACK:
          return await this.executeFallbackStrategy(error, context);
        
        case RecoveryStrategy.GRACEFUL_DEGRADATION:
          return await this.executeGracefulDegradation(error, context);
        
        case RecoveryStrategy.FAIL_FAST:
          return await this.executeFailFast(error, context);
        
        case RecoveryStrategy.USER_INTERVENTION:
          return await this.executeUserIntervention(error, context);
        
        default:
          throw new SystemError(
            ErrorType.CONFIGURATION_ERROR,
            `Unknown recovery strategy: ${strategy.recoveryStrategy}`,
            { requestId: context.requestId }
          );
      }
    } finally {
      // Clean up active recovery tracking
      this.activeRecoveries.delete(context.requestId);
    }
  }

  /**
   * Execute retry strategy with exponential backoff
   */
  private async executeRetryStrategy(
    error: SystemError,
    context: RecoveryContext,
    operation: () => Promise<AdvisorResponse>,
    retryPolicy?: RetryPolicy
  ): Promise<RecoveryResult> {
    if (!retryPolicy) {
      // No retry policy, fall back to fallback strategy
      return await this.executeFallbackStrategy(error, context);
    }

    let lastError = error;
    let attempts = 0;

    for (attempts = 1; attempts <= retryPolicy.maxRetries; attempts++) {
      try {
        // Wait before retry (except for first attempt)
        if (attempts > 1) {
          const delay = Math.min(
            retryPolicy.baseDelay * Math.pow(retryPolicy.backoffMultiplier, attempts - 2),
            retryPolicy.maxDelay
          );
          
          this.logger.debug(`Retry attempt ${attempts} after ${delay}ms delay`, {
            requestId: context.requestId,
            advisorId: context.advisor.id
          });
          
          await this.delay(delay);
        }

        // Attempt the operation
        const response = await operation();
        
        this.logger.info(`Retry successful on attempt ${attempts}`, {
          requestId: context.requestId,
          advisorId: context.advisor.id,
          totalTime: Date.now() - context.startTime
        });

        return {
          success: true,
          response,
          attempts,
          totalTime: Date.now() - context.startTime,
          strategy: RecoveryStrategy.RETRY,
          fallbackUsed: false
        };

      } catch (retryError) {
        lastError = retryError instanceof SystemError ? retryError : new SystemError(
          ErrorType.UNKNOWN_ERROR,
          retryError instanceof Error ? retryError.message : 'Unknown retry error',
          { requestId: context.requestId },
          { cause: retryError instanceof Error ? retryError : undefined }
        );

        // Check if this error type is retryable
        if (!retryPolicy.retryableErrors.includes(lastError.type)) {
          this.logger.warn(`Non-retryable error encountered, stopping retries`, {
            errorType: lastError.type,
            attempt: attempts,
            requestId: context.requestId
          });
          break;
        }

        this.logger.warn(`Retry attempt ${attempts} failed`, {
          errorType: lastError.type,
          requestId: context.requestId,
          advisorId: context.advisor.id
        });
      }
    }

    // All retries failed, try fallback
    this.logger.warn(`All retry attempts failed, attempting fallback`, {
      attempts,
      requestId: context.requestId,
      advisorId: context.advisor.id
    });

    const fallbackResult = await this.executeFallbackStrategy(lastError, context);
    
    return {
      ...fallbackResult,
      attempts,
      strategy: RecoveryStrategy.RETRY
    };
  }

  /**
   * Execute fallback strategy
   */
  private async executeFallbackStrategy(
    error: SystemError,
    context: RecoveryContext
  ): Promise<RecoveryResult> {
    try {
      const fallbackResult = await this.fallbackManager.executeFallback(
        error,
        context.advisor,
        context.question,
        context.domainId,
        context.originalConfig
      );

      if (fallbackResult.success && fallbackResult.response) {
        this.logger.info(`Fallback strategy successful`, {
          fallbackType: fallbackResult.fallbackType,
          requestId: context.requestId,
          advisorId: context.advisor.id
        });

        return {
          success: true,
          response: fallbackResult.response,
          attempts: 1,
          totalTime: Date.now() - context.startTime,
          strategy: RecoveryStrategy.FALLBACK,
          fallbackUsed: true
        };
      } else {
        throw fallbackResult.error || new SystemError(
          ErrorType.SERVICE_UNAVAILABLE,
          'Fallback strategy failed',
          { requestId: context.requestId }
        );
      }
    } catch (fallbackError) {
      this.logger.error(`Fallback strategy failed`, {
        requestId: context.requestId,
        advisorId: context.advisor.id,
        error: fallbackError instanceof Error ? fallbackError.message : 'Unknown error'
      });

      return {
        success: false,
        attempts: 1,
        totalTime: Date.now() - context.startTime,
        strategy: RecoveryStrategy.FALLBACK,
        fallbackUsed: true,
        error: fallbackError instanceof SystemError ? fallbackError : new SystemError(
          ErrorType.SERVICE_UNAVAILABLE,
          'All recovery strategies failed',
          { requestId: context.requestId },
          { cause: fallbackError instanceof Error ? fallbackError : undefined }
        )
      };
    }
  }

  /**
   * Execute graceful degradation
   */
  private async executeGracefulDegradation(
    error: SystemError,
    context: RecoveryContext
  ): Promise<RecoveryResult> {
    this.logger.info(`Executing graceful degradation`, {
      errorType: error.type,
      requestId: context.requestId,
      advisorId: context.advisor.id
    });

    // For graceful degradation, we try fallback but with reduced expectations
    try {
      const fallbackResult = await this.fallbackManager.executeFallback(
        error,
        context.advisor,
        context.question,
        context.domainId,
        context.originalConfig
      );

      if (fallbackResult.success && fallbackResult.response) {
        // Modify response to indicate degraded service
        const degradedResponse: AdvisorResponse = {
          ...fallbackResult.response,
          metadata: {
            ...fallbackResult.response.metadata,
            confidence: Math.min(fallbackResult.response.metadata.confidence, 0.7),
            errorInfo: {
              type: error.type,
              message: 'Service operating in degraded mode',
              fallbackUsed: true
            }
          }
        };

        return {
          success: true,
          response: degradedResponse,
          attempts: 1,
          totalTime: Date.now() - context.startTime,
          strategy: RecoveryStrategy.GRACEFUL_DEGRADATION,
          fallbackUsed: true
        };
      }
    } catch (degradationError) {
      this.logger.error(`Graceful degradation failed`, {
        requestId: context.requestId,
        error: degradationError instanceof Error ? degradationError.message : 'Unknown error'
      });
    }

    // If even graceful degradation fails, return a minimal response
    const minimalResponse: AdvisorResponse = {
      advisorId: context.advisor.id,
      content: `I apologize, but I'm currently experiencing technical difficulties. Please try again in a few moments. If the issue persists, please contact support.`,
      timestamp: new Date(),
      persona: {
        name: context.advisor.name,
        expertise: context.advisor.expertise,
        background: context.advisor.background,
        tone: 'apologetic',
        specialization: []
      },
      metadata: {
        responseType: 'static',
        processingTime: Date.now() - context.startTime,
        confidence: 0.1,
        errorInfo: {
          type: error.type,
          message: 'System operating in minimal mode',
          fallbackUsed: true
        }
      }
    };

    return {
      success: true,
      response: minimalResponse,
      attempts: 1,
      totalTime: Date.now() - context.startTime,
      strategy: RecoveryStrategy.GRACEFUL_DEGRADATION,
      fallbackUsed: true
    };
  }

  /**
   * Execute fail fast strategy
   */
  private async executeFailFast(
    error: SystemError,
    context: RecoveryContext
  ): Promise<RecoveryResult> {
    this.logger.error(`Executing fail fast strategy`, {
      errorType: error.type,
      requestId: context.requestId,
      advisorId: context.advisor.id
    });

    return {
      success: false,
      attempts: 1,
      totalTime: Date.now() - context.startTime,
      strategy: RecoveryStrategy.FAIL_FAST,
      fallbackUsed: false,
      error
    };
  }

  /**
   * Execute user intervention strategy
   */
  private async executeUserIntervention(
    error: SystemError,
    context: RecoveryContext
  ): Promise<RecoveryResult> {
    this.logger.warn(`User intervention required`, {
      errorType: error.type,
      requestId: context.requestId,
      advisorId: context.advisor.id
    });

    // Create a response that informs the user about the issue
    const interventionResponse: AdvisorResponse = {
      advisorId: context.advisor.id,
      content: `I'm currently experiencing technical difficulties that require attention. Please try again later or contact support if this issue persists. Error ID: ${context.requestId}`,
      timestamp: new Date(),
      persona: {
        name: context.advisor.name,
        expertise: context.advisor.expertise,
        background: context.advisor.background,
        tone: 'informative',
        specialization: []
      },
      metadata: {
        responseType: 'static',
        processingTime: Date.now() - context.startTime,
        confidence: 0.2,
        errorInfo: {
          type: error.type,
          message: 'User intervention required',
          fallbackUsed: true
        }
      }
    };

    return {
      success: true,
      response: interventionResponse,
      attempts: 1,
      totalTime: Date.now() - context.startTime,
      strategy: RecoveryStrategy.USER_INTERVENTION,
      fallbackUsed: true
    };
  }

  /**
   * Create recovery context
   */
  createRecoveryContext(
    advisor: Advisor,
    question: string,
    domainId: DomainId,
    originalConfig?: Partial<LLMConfig>
  ): RecoveryContext {
    return {
      advisor,
      question,
      domainId,
      originalConfig,
      requestId: this.generateRequestId(),
      startTime: Date.now()
    };
  }

  /**
   * Get user-friendly error message
   */
  getUserFriendlyMessage(error: SystemError): string {
    const strategy = ErrorHandlingStrategies.getStrategy(error.type);
    return strategy.userMessage;
  }

  /**
   * Check if error should be reported to monitoring
   */
  shouldReportToMonitoring(error: SystemError): boolean {
    return ErrorHandlingStrategies.shouldReportToMonitoring(error.type);
  }

  /**
   * Check if user should be notified
   */
  shouldNotifyUser(error: SystemError): boolean {
    return ErrorHandlingStrategies.shouldNotifyUser(error.type);
  }

  /**
   * Get active recovery operations
   */
  getActiveRecoveries(): RecoveryContext[] {
    return Array.from(this.activeRecoveries.values());
  }

  /**
   * Cancel recovery operation
   */
  cancelRecovery(requestId: string): boolean {
    return this.activeRecoveries.delete(requestId);
  }

  /**
   * Get recovery statistics
   */
  getRecoveryStats(): {
    activeRecoveries: number;
    totalRecoveries: number;
    successRate: number;
    averageRecoveryTime: number;
  } {
    // This would typically be tracked over time
    // For now, return current active recoveries
    return {
      activeRecoveries: this.activeRecoveries.size,
      totalRecoveries: 0, // Would need persistent tracking
      successRate: 0, // Would need persistent tracking
      averageRecoveryTime: 0 // Would need persistent tracking
    };
  }

  /**
   * Delay utility for retry backoff
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `recovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up expired recovery contexts
   */
  private cleanupExpiredRecoveries(): void {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes

    for (const [requestId, context] of this.activeRecoveries.entries()) {
      if (now - context.startTime > maxAge) {
        this.activeRecoveries.delete(requestId);
        this.logger.warn(`Cleaned up expired recovery context`, {
          requestId,
          age: now - context.startTime
        });
      }
    }
  }

  /**
   * Start periodic cleanup of expired recoveries
   */
  startCleanupTimer(): void {
    setInterval(() => {
      this.cleanupExpiredRecoveries();
    }, 60000); // Clean up every minute
  }
}