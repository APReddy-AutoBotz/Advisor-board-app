/**
 * Custom error classes for YAML configuration loading
 */

export class YamlConfigError extends Error {
  filename?: string;
  originalError?: Error;
  
  constructor(
    message: string,
    filename?: string,
    originalError?: Error
  ) {
    super(message);
    this.name = 'YamlConfigError';
    this.filename = filename;
    this.originalError = originalError;
  }
}

export class YamlParseError extends YamlConfigError {
  constructor(filename: string, originalError: Error) {
    super(`Failed to parse YAML file: ${filename}`, filename, originalError);
    this.name = 'YamlParseError';
  }
}

export class YamlValidationError extends YamlConfigError {
  field?: string;
  
  constructor(
    message: string,
    filename: string,
    field?: string
  ) {
    super(`Validation error in ${filename}: ${message}`, filename);
    this.name = 'YamlValidationError';
    this.field = field;
  }
}

export class YamlNetworkError extends YamlConfigError {
  constructor(filename: string, status?: number) {
    const message = status 
      ? `Failed to load ${filename} (HTTP ${status})`
      : `Network error loading ${filename}`;
    super(message, filename);
    this.name = 'YamlNetworkError';
  }
}

/**
 * Error handler for YAML configuration loading
 */
export class YamlErrorHandler {
  private static errorLog: YamlConfigError[] = [];

  /**
   * Handle and log YAML configuration errors
   */
  static handleError(error: unknown, filename?: string): YamlConfigError {
    let yamlError: YamlConfigError;

    if (error instanceof YamlConfigError) {
      yamlError = error;
    } else if (error instanceof Error) {
      yamlError = new YamlConfigError(
        `Unexpected error loading YAML config: ${error.message}`,
        filename,
        error
      );
    } else {
      yamlError = new YamlConfigError(
        'Unknown error loading YAML configuration',
        filename
      );
    }

    // Log the error
    this.errorLog.push(yamlError);
    console.error('YAML Config Error:', yamlError);

    return yamlError;
  }

  /**
   * Create appropriate error based on fetch response
   */
  static createNetworkError(response: Response, filename: string): YamlNetworkError {
    return new YamlNetworkError(filename, response.status);
  }

  /**
   * Create validation error with field context
   */
  static createValidationError(
    message: string,
    filename: string,
    field?: string
  ): YamlValidationError {
    return new YamlValidationError(message, filename, field);
  }

  /**
   * Create parse error from YAML parsing failure
   */
  static createParseError(filename: string, originalError: Error): YamlParseError {
    return new YamlParseError(filename, originalError);
  }

  /**
   * Get all logged errors
   */
  static getErrorLog(): YamlConfigError[] {
    return [...this.errorLog];
  }

  /**
   * Clear error log
   */
  static clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Check if there are any critical errors
   */
  static hasCriticalErrors(): boolean {
    return this.errorLog.some(error => 
      error instanceof YamlParseError || 
      error instanceof YamlNetworkError
    );
  }

  /**
   * Get user-friendly error message
   */
  static getUserFriendlyMessage(error: YamlConfigError): string {
    if (error instanceof YamlNetworkError) {
      return `Unable to load configuration file. Please check your internet connection and try again.`;
    }
    
    if (error instanceof YamlParseError) {
      return `Configuration file format is invalid. Please contact support.`;
    }
    
    if (error instanceof YamlValidationError) {
      return `Configuration file is missing required information. Using default settings.`;
    }
    
    return `An unexpected error occurred while loading configuration. Using default settings.`;
  }
}

/**
 * Retry mechanism for YAML loading
 */
export class YamlRetryHandler {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second

  /**
   * Retry a YAML loading operation with exponential backoff
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    filename: string,
    maxRetries: number = this.MAX_RETRIES
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt === maxRetries) {
          throw YamlErrorHandler.handleError(lastError, filename);
        }

        // Wait before retrying (exponential backoff)
        const delay = this.RETRY_DELAY * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        console.warn(`Retry attempt ${attempt} for ${filename} failed:`, lastError.message);
      }
    }

    throw YamlErrorHandler.handleError(lastError!, filename);
  }
}
