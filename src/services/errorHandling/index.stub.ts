/**
 * Temporary Error Handling Stub
 * Minimal exports to prevent import errors
 */

// Simple error types
export enum ErrorType {
  UNKNOWN_ERROR = 'unknown_error'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Simple error class
export class SystemError extends Error {
  public readonly type: ErrorType = ErrorType.UNKNOWN_ERROR;
  public readonly severity: ErrorSeverity = ErrorSeverity.MEDIUM;
  
  constructor(message: string) {
    super(message);
    this.name = 'SystemError';
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
