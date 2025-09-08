/**
 * Error Recovery Manager Tests
 * Tests for comprehensive error recovery and coordination
 */

import { vi } from 'vitest';
import { ErrorRecoveryManager } from '../ErrorRecoveryManager';
import { ErrorType, SystemError, RecoveryStrategy } from '../ErrorTypes';
import type { Advisor } from '../../../types/domain';

describe('ErrorRecoveryManager', () => {
  let errorRecoveryManager: ErrorRecoveryManager;
  let mockAdvisor: Advisor;

  beforeEach(() => {
    errorRecoveryManager = new ErrorRecoveryManager();
    mockAdvisor = {
      id: 'test-advisor',
      name: 'Test Advisor',
      expertise: 'Test Expertise',
      background: 'Test Background',
      domain: 'productboard',
      isSelected: true,
      specialties: ['strategy']
    };
  });

  describe('createRecoveryContext', () => {
    it('should create recovery context with required fields', () => {
      const context = errorRecoveryManager.createRecoveryContext(
        mockAdvisor,
        'Test question',
        'productboard'
      );

      expect(context.advisor).toBe(mockAdvisor);
      expect(context.question).toBe('Test question');
      expect(context.domainId).toBe('productboard');
      expect(context.requestId).toBeDefined();
      expect(context.startTime).toBeGreaterThan(0);
    });

    it('should generate unique request IDs', () => {
      const context1 = errorRecoveryManager.createRecoveryContext(
        mockAdvisor,
        'Question 1',
        'productboard'
      );
      
      const context2 = errorRecoveryManager.createRecoveryContext(
        mockAdvisor,
        'Question 2',
        'productboard'
      );

      expect(context1.requestId).not.toBe(context2.requestId);
    });
  });

  describe('executeRecovery', () => {
    it('should execute retry strategy successfully', async () => {
      const error = new SystemError(
        ErrorType.RATE_LIMITED,
        'Rate limited',
        { advisorId: mockAdvisor.id },
        { retryable: true }
      );

      const context = errorRecoveryManager.createRecoveryContext(
        mockAdvisor,
        'Test question',
        'productboard'
      );

      let attemptCount = 0;
      const mockOperation = vi.fn().mockImplementation(async () => {
        attemptCount++;
        if (attemptCount < 2) {
          throw error;
        }
        return {
          advisorId: mockAdvisor.id,
          content: 'Success response',
          timestamp: new Date(),
          persona: {
            name: mockAdvisor.name,
            expertise: mockAdvisor.expertise,
            background: mockAdvisor.background,
            tone: 'professional',
            specialization: []
          },
          metadata: {
            responseType: 'llm' as const,
            processingTime: 100,
            confidence: 0.9
          }
        };
      });

      const result = await errorRecoveryManager.executeRecovery(
        error,
        context,
        mockOperation
      );

      expect(result.success).toBe(true);
      expect(result.response).toBeDefined();
      expect(result.attempts).toBe(2);
      expect(result.strategy).toBe(RecoveryStrategy.RETRY);
      expect(result.fallbackUsed).toBe(false);
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    it('should execute fallback strategy when retries fail', async () => {
      const error = new SystemError(
        ErrorType.API_UNAVAILABLE,
        'API unavailable',
        { advisorId: mockAdvisor.id },
        { retryable: true }
      );

      const context = errorRecoveryManager.createRecoveryContext(
        mockAdvisor,
        'Test question',
        'productboard'
      );

      const mockOperation = vi.fn().mockRejectedValue(error);

      const result = await errorRecoveryManager.executeRecovery(
        error,
        context,
        mockOperation
      );

      expect(result.success).toBe(true);
      expect(result.response).toBeDefined();
      expect(result.strategy).toBe(RecoveryStrategy.FALLBACK);
      expect(result.fallbackUsed).toBe(true);
    });

    it('should execute graceful degradation for appropriate errors', async () => {
      const error = new SystemError(
        ErrorType.PERSONA_NOT_FOUND,
        'Persona not found',
        { advisorId: mockAdvisor.id }
      );

      const context = errorRecoveryManager.createRecoveryContext(
        mockAdvisor,
        'Test question',
        'productboard'
      );

      const mockOperation = vi.fn().mockRejectedValue(error);

      const result = await errorRecoveryManager.executeRecovery(
        error,
        context,
        mockOperation
      );

      expect(result.success).toBe(true);
      expect(result.response).toBeDefined();
      expect(result.strategy).toBe(RecoveryStrategy.GRACEFUL_DEGRADATION);
      expect(result.fallbackUsed).toBe(true);
      expect(result.response!.metadata.confidence).toBeLessThanOrEqual(0.7);
    });

    it('should execute fail fast for critical errors', async () => {
      // Mock the strategy to return fail fast
      const { ErrorHandlingStrategies } = await import('../ErrorHandlingStrategies');
      const originalGetStrategy = ErrorHandlingStrategies.getStrategy;
      vi.spyOn(ErrorHandlingStrategies, 'getStrategy')
        .mockReturnValue({
          errorType: ErrorType.AUTHENTICATION_ERROR,
          recoveryStrategy: RecoveryStrategy.FAIL_FAST,
          userMessage: 'Authentication failed',
          technicalMessage: 'Auth error',
          severity: undefined as any,
          retryPolicy: undefined,
          fallbackStrategy: undefined,
          logLevel: 'error',
          notifyUser: false,
          reportToMonitoring: true
        });

      const error = new SystemError(
        ErrorType.AUTHENTICATION_ERROR,
        'Authentication failed',
        { advisorId: mockAdvisor.id }
      );

      const context = errorRecoveryManager.createRecoveryContext(
        mockAdvisor,
        'Test question',
        'productboard'
      );

      const mockOperation = vi.fn().mockRejectedValue(error);

      const result = await errorRecoveryManager.executeRecovery(
        error,
        context,
        mockOperation
      );

      expect(result.success).toBe(false);
      expect(result.strategy).toBe(RecoveryStrategy.FAIL_FAST);
      expect(result.error).toBe(error);

      // Restore original function
      vi.spyOn(require('../ErrorHandlingStrategies').ErrorHandlingStrategies, 'getStrategy')
        .mockImplementation(originalGetStrategy);
    });

    it('should provide user intervention response when required', async () => {
      // Mock the strategy to return user intervention
      const { ErrorHandlingStrategies } = await import('../ErrorHandlingStrategies');
      const originalGetStrategy = ErrorHandlingStrategies.getStrategy;
      vi.spyOn(ErrorHandlingStrategies, 'getStrategy')
        .mockReturnValue({
          errorType: ErrorType.CONFIGURATION_ERROR,
          recoveryStrategy: RecoveryStrategy.USER_INTERVENTION,
          userMessage: 'Configuration error requires attention',
          technicalMessage: 'Config error',
          severity: undefined as any,
          retryPolicy: undefined,
          fallbackStrategy: undefined,
          logLevel: 'error',
          notifyUser: false,
          reportToMonitoring: true
        });

      const error = new SystemError(
        ErrorType.CONFIGURATION_ERROR,
        'Configuration error',
        { advisorId: mockAdvisor.id }
      );

      const context = errorRecoveryManager.createRecoveryContext(
        mockAdvisor,
        'Test question',
        'productboard'
      );

      const mockOperation = vi.fn().mockRejectedValue(error);

      const result = await errorRecoveryManager.executeRecovery(
        error,
        context,
        mockOperation
      );

      expect(result.success).toBe(true);
      expect(result.response).toBeDefined();
      expect(result.strategy).toBe(RecoveryStrategy.USER_INTERVENTION);
      expect(result.response!.content).toContain('technical difficulties');
      expect(result.response!.content).toContain(context.requestId);

      // Restore original function
      vi.spyOn(require('../ErrorHandlingStrategies').ErrorHandlingStrategies, 'getStrategy')
        .mockImplementation(originalGetStrategy);
    });
  });

  describe('utility methods', () => {
    it('should provide user-friendly error messages', () => {
      const error = new SystemError(
        ErrorType.API_UNAVAILABLE,
        'Technical error message'
      );

      const message = errorRecoveryManager.getUserFriendlyMessage(error);
      
      expect(message).toBeDefined();
      expect(message.length).toBeGreaterThan(0);
      expect(message).not.toContain('API');
      expect(message).not.toContain('HTTP');
    });

    it('should correctly identify monitoring requirements', () => {
      const criticalError = new SystemError(ErrorType.SERVICE_UNAVAILABLE, 'Service down');
      const minorError = new SystemError(ErrorType.CACHE_ERROR, 'Cache miss');

      expect(errorRecoveryManager.shouldReportToMonitoring(criticalError)).toBe(true);
      expect(errorRecoveryManager.shouldReportToMonitoring(minorError)).toBe(false);
    });

    it('should correctly identify user notification requirements', () => {
      const userVisibleError = new SystemError(ErrorType.API_UNAVAILABLE, 'API down');
      const internalError = new SystemError(ErrorType.AUTHENTICATION_ERROR, 'Auth failed');

      expect(errorRecoveryManager.shouldNotifyUser(userVisibleError)).toBe(true);
      expect(errorRecoveryManager.shouldNotifyUser(internalError)).toBe(false);
    });
  });

  describe('recovery tracking', () => {
    it('should track active recoveries', async () => {
      const error = new SystemError(ErrorType.NETWORK_ERROR, 'Network error');
      const context = errorRecoveryManager.createRecoveryContext(
        mockAdvisor,
        'Test question',
        'productboard'
      );

      const slowOperation = vi.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return {
          advisorId: mockAdvisor.id,
          content: 'Response',
          timestamp: new Date(),
          persona: {
            name: mockAdvisor.name,
            expertise: mockAdvisor.expertise,
            background: mockAdvisor.background,
            tone: 'professional',
            specialization: []
          },
          metadata: {
            responseType: 'llm' as const,
            processingTime: 100,
            confidence: 0.9
          }
        };
      });

      // Start recovery (don't await yet)
      const recoveryPromise = errorRecoveryManager.executeRecovery(
        error,
        context,
        slowOperation
      );

      // Check that recovery is tracked
      const activeRecoveries = errorRecoveryManager.getActiveRecoveries();
      expect(activeRecoveries.length).toBe(1);
      expect(activeRecoveries[0].requestId).toBe(context.requestId);

      // Wait for completion
      await recoveryPromise;

      // Check that recovery is no longer tracked
      const activeRecoveriesAfter = errorRecoveryManager.getActiveRecoveries();
      expect(activeRecoveriesAfter.length).toBe(0);
    });

    it('should allow canceling recovery operations', () => {
      const context = errorRecoveryManager.createRecoveryContext(
        mockAdvisor,
        'Test question',
        'productboard'
      );

      // Manually add to active recoveries (simulating ongoing operation)
      (errorRecoveryManager as any).activeRecoveries.set(context.requestId, context);

      const cancelled = errorRecoveryManager.cancelRecovery(context.requestId);
      expect(cancelled).toBe(true);

      const activeRecoveries = errorRecoveryManager.getActiveRecoveries();
      expect(activeRecoveries.length).toBe(0);
    });

    it('should provide recovery statistics', () => {
      const stats = errorRecoveryManager.getRecoveryStats();
      
      expect(stats).toHaveProperty('activeRecoveries');
      expect(stats).toHaveProperty('totalRecoveries');
      expect(stats).toHaveProperty('successRate');
      expect(stats).toHaveProperty('averageRecoveryTime');
      expect(typeof stats.activeRecoveries).toBe('number');
    });
  });
});