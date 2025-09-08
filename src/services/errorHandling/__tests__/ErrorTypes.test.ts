/**
 * Error Types Tests
 * Tests for error type definitions and error classes
 */

import {
  ErrorType,
  ErrorSeverity,
  SystemError,
  LLMProviderError,
  PersonaError,
  ResponseGenerationError
} from '../ErrorTypes';

describe('ErrorTypes', () => {
  describe('SystemError', () => {
    it('should create a basic system error', () => {
      const error = new SystemError(
        ErrorType.API_UNAVAILABLE,
        'Test error message'
      );

      expect(error.type).toBe(ErrorType.API_UNAVAILABLE);
      expect(error.message).toBe('Test error message');
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.retryable).toBe(false);
      expect(error.userMessage).toContain('AI service');
      expect(error.requestId).toBeDefined();
      expect(error.context.timestamp).toBeInstanceOf(Date);
    });

    it('should create error with custom options', () => {
      const error = new SystemError(
        ErrorType.RATE_LIMITED,
        'Rate limit exceeded',
        { userId: 'user123', advisorId: 'advisor456' },
        {
          severity: ErrorSeverity.HIGH,
          retryable: true,
          userMessage: 'Custom user message'
        }
      );

      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.retryable).toBe(true);
      expect(error.userMessage).toBe('Custom user message');
      expect(error.context.userId).toBe('user123');
      expect(error.context.advisorId).toBe('advisor456');
    });

    it('should generate unique request IDs', () => {
      const error1 = new SystemError(ErrorType.UNKNOWN_ERROR, 'Test 1');
      const error2 = new SystemError(ErrorType.UNKNOWN_ERROR, 'Test 2');

      expect(error1.requestId).toBeDefined();
      expect(error2.requestId).toBeDefined();
      expect(error1.requestId).not.toBe(error2.requestId);
    });

    it('should serialize to JSON correctly', () => {
      const error = new SystemError(
        ErrorType.NETWORK_ERROR,
        'Network failed',
        { userId: 'test' },
        { severity: ErrorSeverity.HIGH, retryable: true }
      );

      const json = error.toJSON();

      expect(json.name).toBe('SystemError');
      expect(json.type).toBe(ErrorType.NETWORK_ERROR);
      expect(json.severity).toBe(ErrorSeverity.HIGH);
      expect(json.retryable).toBe(true);
      expect(json.context.userId).toBe('test');
    });

    it('should provide default user messages for all error types', () => {
      const errorTypes = Object.values(ErrorType);
      
      errorTypes.forEach(errorType => {
        const error = new SystemError(errorType, 'Test message');
        expect(error.userMessage).toBeDefined();
        expect(error.userMessage.length).toBeGreaterThan(0);
      });
    });
  });

  describe('LLMProviderError', () => {
    it('should create LLM provider specific error', () => {
      const error = new LLMProviderError(
        ErrorType.AUTHENTICATION_ERROR,
        'Invalid API key',
        'openai',
        { requestId: 'req123' },
        { severity: ErrorSeverity.CRITICAL }
      );

      expect(error.type).toBe(ErrorType.AUTHENTICATION_ERROR);
      expect(error.provider).toBe('openai');
      expect(error.severity).toBe(ErrorSeverity.CRITICAL);
      expect(error.context.provider).toBe('openai');
      expect(error.context.requestId).toBe('req123');
    });

    it('should inherit from SystemError', () => {
      const error = new LLMProviderError(
        ErrorType.RATE_LIMITED,
        'Rate limited',
        'anthropic'
      );

      expect(error).toBeInstanceOf(SystemError);
      expect(error.name).toBe('LLMProviderError');
    });
  });

  describe('PersonaError', () => {
    it('should create persona specific error', () => {
      const error = new PersonaError(
        ErrorType.PERSONA_NOT_FOUND,
        'Persona not found',
        { advisorId: 'advisor123', personaKey: 'cpo' }
      );

      expect(error.type).toBe(ErrorType.PERSONA_NOT_FOUND);
      expect(error.advisorId).toBe('advisor123');
      expect(error.personaKey).toBe('cpo');
      expect(error.context.advisorId).toBe('advisor123');
      expect(error.context.personaKey).toBe('cpo');
    });
  });

  describe('ResponseGenerationError', () => {
    it('should create response generation specific error', () => {
      const error = new ResponseGenerationError(
        ErrorType.RESPONSE_VALIDATION_ERROR,
        'Invalid response format',
        { advisorId: 'advisor123', questionType: 'strategy' }
      );

      expect(error.type).toBe(ErrorType.RESPONSE_VALIDATION_ERROR);
      expect(error.advisorId).toBe('advisor123');
      expect(error.questionType).toBe('strategy');
    });
  });

  describe('Error Type Coverage', () => {
    it('should have all expected error types defined', () => {
      const expectedTypes = [
        'API_UNAVAILABLE',
        'RATE_LIMITED',
        'INVALID_RESPONSE',
        'NETWORK_ERROR',
        'CONFIGURATION_ERROR',
        'AUTHENTICATION_ERROR',
        'QUOTA_EXCEEDED',
        'PERSONA_NOT_FOUND',
        'PROMPT_GENERATION_ERROR',
        'PERSONA_VALIDATION_ERROR',
        'QUESTION_ANALYSIS_ERROR',
        'INVALID_QUESTION_FORMAT',
        'RESPONSE_TIMEOUT',
        'RESPONSE_VALIDATION_ERROR',
        'CONCURRENT_PROCESSING_ERROR',
        'CACHE_ERROR',
        'CONFIGURATION_LOAD_ERROR',
        'SERVICE_UNAVAILABLE',
        'UNKNOWN_ERROR'
      ];

      const actualTypes = Object.keys(ErrorType);
      expectedTypes.forEach(type => {
        expect(actualTypes).toContain(type);
      });
    });

    it('should have all severity levels defined', () => {
      const expectedSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      const actualSeverities = Object.keys(ErrorSeverity);
      
      expectedSeverities.forEach(severity => {
        expect(actualSeverities).toContain(severity);
      });
    });
  });
});