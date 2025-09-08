/**
 * Error Handling Strategies Tests
 * Tests for error handling strategy configuration and retrieval
 */

import {
  ErrorHandlingStrategies
} from '../ErrorHandlingStrategies';
import {
  ErrorType,
  ErrorSeverity,
  RecoveryStrategy
} from '../ErrorTypes';

describe('ErrorHandlingStrategies', () => {
  describe('getStrategy', () => {
    it('should return strategy for known error types', () => {
      const strategy = ErrorHandlingStrategies.getStrategy(ErrorType.API_UNAVAILABLE);
      
      expect(strategy).toBeDefined();
      expect(strategy.errorType).toBe(ErrorType.API_UNAVAILABLE);
      expect(strategy.severity).toBe(ErrorSeverity.HIGH);
      expect(strategy.recoveryStrategy).toBe(RecoveryStrategy.FALLBACK);
      expect(strategy.userMessage).toBeDefined();
      expect(strategy.technicalMessage).toBeDefined();
    });

    it('should return default strategy for unknown error types', () => {
      const unknownType = 'UNKNOWN_TEST_ERROR' as ErrorType;
      const strategy = ErrorHandlingStrategies.getStrategy(unknownType);
      
      expect(strategy).toBeDefined();
      expect(strategy.errorType).toBe(ErrorType.UNKNOWN_ERROR);
    });

    it('should have strategies for all error types', () => {
      const errorTypes = Object.values(ErrorType);
      
      errorTypes.forEach(errorType => {
        const strategy = ErrorHandlingStrategies.getStrategy(errorType);
        expect(strategy).toBeDefined();
        expect(strategy.userMessage).toBeDefined();
        expect(strategy.technicalMessage).toBeDefined();
        expect(strategy.logLevel).toBeDefined();
      });
    });
  });

  describe('isRetryable', () => {
    it('should correctly identify retryable errors', () => {
      expect(ErrorHandlingStrategies.isRetryable(ErrorType.RATE_LIMITED)).toBe(true);
      expect(ErrorHandlingStrategies.isRetryable(ErrorType.NETWORK_ERROR)).toBe(true);
      expect(ErrorHandlingStrategies.isRetryable(ErrorType.INVALID_RESPONSE)).toBe(true);
    });

    it('should correctly identify non-retryable errors', () => {
      expect(ErrorHandlingStrategies.isRetryable(ErrorType.AUTHENTICATION_ERROR)).toBe(false);
      expect(ErrorHandlingStrategies.isRetryable(ErrorType.QUOTA_EXCEEDED)).toBe(false);
      expect(ErrorHandlingStrategies.isRetryable(ErrorType.PERSONA_NOT_FOUND)).toBe(false);
    });
  });

  describe('hasFallback', () => {
    it('should correctly identify errors with fallback', () => {
      expect(ErrorHandlingStrategies.hasFallback(ErrorType.API_UNAVAILABLE)).toBe(true);
      expect(ErrorHandlingStrategies.hasFallback(ErrorType.AUTHENTICATION_ERROR)).toBe(true);
      expect(ErrorHandlingStrategies.hasFallback(ErrorType.RESPONSE_TIMEOUT)).toBe(true);
    });

    it('should correctly identify errors without fallback', () => {
      expect(ErrorHandlingStrategies.hasFallback(ErrorType.CACHE_ERROR)).toBe(false);
      expect(ErrorHandlingStrategies.hasFallback(ErrorType.QUESTION_ANALYSIS_ERROR)).toBe(false);
    });
  });

  describe('getRetryPolicy', () => {
    it('should return retry policy for retryable errors', () => {
      const policy = ErrorHandlingStrategies.getRetryPolicy(ErrorType.RATE_LIMITED);
      
      expect(policy).toBeDefined();
      expect(policy!.maxRetries).toBeGreaterThan(0);
      expect(policy!.baseDelay).toBeGreaterThan(0);
      expect(policy!.backoffMultiplier).toBeGreaterThan(1);
      expect(policy!.retryableErrors).toContain(ErrorType.RATE_LIMITED);
    });

    it('should return undefined for non-retryable errors', () => {
      const policy = ErrorHandlingStrategies.getRetryPolicy(ErrorType.AUTHENTICATION_ERROR);
      expect(policy).toBeUndefined();
    });
  });

  describe('getFallbackStrategy', () => {
    it('should return fallback strategy for errors with fallback', () => {
      const fallback = ErrorHandlingStrategies.getFallbackStrategy(ErrorType.API_UNAVAILABLE);
      
      expect(fallback).toBeDefined();
      expect(fallback!.enabled).toBe(true);
      expect(fallback!.fallbackType).toBeDefined();
      expect(fallback!.gracefulDegradation).toBeDefined();
    });

    it('should return undefined for errors without fallback', () => {
      const fallback = ErrorHandlingStrategies.getFallbackStrategy(ErrorType.CACHE_ERROR);
      expect(fallback).toBeUndefined();
    });
  });

  describe('getUserMessage', () => {
    it('should return user-friendly messages', () => {
      const message = ErrorHandlingStrategies.getUserMessage(ErrorType.API_UNAVAILABLE);
      
      expect(message).toBeDefined();
      expect(message.length).toBeGreaterThan(0);
      expect(message).not.toContain('API');
      expect(message).not.toContain('HTTP');
      expect(message).not.toContain('500');
    });

    it('should provide different messages for different error types', () => {
      const message1 = ErrorHandlingStrategies.getUserMessage(ErrorType.API_UNAVAILABLE);
      const message2 = ErrorHandlingStrategies.getUserMessage(ErrorType.RATE_LIMITED);
      const message3 = ErrorHandlingStrategies.getUserMessage(ErrorType.NETWORK_ERROR);
      
      expect(message1).not.toBe(message2);
      expect(message2).not.toBe(message3);
      expect(message1).not.toBe(message3);
    });
  });

  describe('shouldReportToMonitoring', () => {
    it('should report critical and high severity errors', () => {
      expect(ErrorHandlingStrategies.shouldReportToMonitoring(ErrorType.API_UNAVAILABLE)).toBe(true);
      expect(ErrorHandlingStrategies.shouldReportToMonitoring(ErrorType.AUTHENTICATION_ERROR)).toBe(true);
      expect(ErrorHandlingStrategies.shouldReportToMonitoring(ErrorType.SERVICE_UNAVAILABLE)).toBe(true);
    });

    it('should not report low severity errors', () => {
      expect(ErrorHandlingStrategies.shouldReportToMonitoring(ErrorType.CACHE_ERROR)).toBe(false);
      expect(ErrorHandlingStrategies.shouldReportToMonitoring(ErrorType.QUESTION_ANALYSIS_ERROR)).toBe(false);
    });
  });

  describe('shouldNotifyUser', () => {
    it('should notify users for appropriate error types', () => {
      expect(ErrorHandlingStrategies.shouldNotifyUser(ErrorType.API_UNAVAILABLE)).toBe(true);
      expect(ErrorHandlingStrategies.shouldNotifyUser(ErrorType.RATE_LIMITED)).toBe(true);
      expect(ErrorHandlingStrategies.shouldNotifyUser(ErrorType.SERVICE_UNAVAILABLE)).toBe(true);
    });

    it('should not notify users for internal errors', () => {
      expect(ErrorHandlingStrategies.shouldNotifyUser(ErrorType.AUTHENTICATION_ERROR)).toBe(false);
      expect(ErrorHandlingStrategies.shouldNotifyUser(ErrorType.QUOTA_EXCEEDED)).toBe(false);
      expect(ErrorHandlingStrategies.shouldNotifyUser(ErrorType.CACHE_ERROR)).toBe(false);
    });
  });

  describe('updateStrategy', () => {
    it('should update strategy configuration', () => {
      const originalStrategy = ErrorHandlingStrategies.getStrategy(ErrorType.CACHE_ERROR);
      const originalMessage = originalStrategy.userMessage;
      
      ErrorHandlingStrategies.updateStrategy(ErrorType.CACHE_ERROR, {
        userMessage: 'Updated test message'
      });
      
      const updatedStrategy = ErrorHandlingStrategies.getStrategy(ErrorType.CACHE_ERROR);
      expect(updatedStrategy.userMessage).toBe('Updated test message');
      
      // Restore original
      ErrorHandlingStrategies.updateStrategy(ErrorType.CACHE_ERROR, {
        userMessage: originalMessage
      });
    });
  });

  describe('getAllStrategies', () => {
    it('should return all configured strategies', () => {
      const strategies = ErrorHandlingStrategies.getAllStrategies();
      
      expect(strategies.size).toBeGreaterThan(0);
      expect(strategies.has(ErrorType.API_UNAVAILABLE)).toBe(true);
      expect(strategies.has(ErrorType.RATE_LIMITED)).toBe(true);
      expect(strategies.has(ErrorType.UNKNOWN_ERROR)).toBe(true);
    });
  });
});