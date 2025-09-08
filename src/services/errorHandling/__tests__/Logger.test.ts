/**
 * Logger Tests
 * Tests for logging and monitoring functionality
 */

import { vi } from 'vitest';
import { Logger, LogLevel } from '../Logger';
import { ErrorType, SystemError, ErrorSeverity } from '../ErrorTypes';

describe('Logger', () => {
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger('TestContext', { level: LogLevel.DEBUG });
    // Clear any existing logs
    logger.clearLogs();
  });

  describe('basic logging', () => {
    it('should log debug messages', () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      
      logger.debug('Debug message', { key: 'value' });
      
      expect(consoleSpy).toHaveBeenCalled();
      const logs = logger.getRecentLogs(1);
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.DEBUG);
      expect(logs[0].message).toBe('Debug message');
      expect(logs[0].context).toBe('TestContext');
      
      consoleSpy.mockRestore();
    });

    it('should log info messages', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      
      logger.info('Info message', { requestId: 'req123' });
      
      expect(consoleSpy).toHaveBeenCalled();
      const logs = logger.getRecentLogs(1);
      expect(logs[0].level).toBe(LogLevel.INFO);
      expect(logs[0].data?.requestId).toBe('req123');
      
      consoleSpy.mockRestore();
    });

    it('should log warning messages', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      logger.warn('Warning message');
      
      expect(consoleSpy).toHaveBeenCalled();
      const logs = logger.getRecentLogs(1);
      expect(logs[0].level).toBe(LogLevel.WARN);
      
      consoleSpy.mockRestore();
    });

    it('should log error messages with error objects', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new SystemError(ErrorType.API_UNAVAILABLE, 'Test error');
      
      logger.error('Error occurred', { userId: 'user123' }, error);
      
      expect(consoleSpy).toHaveBeenCalled();
      const logs = logger.getRecentLogs(1);
      expect(logs[0].level).toBe(LogLevel.ERROR);
      expect(logs[0].error).toBe(error);
      
      consoleSpy.mockRestore();
    });

    it('should log fatal messages', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      logger.fatal('Fatal error');
      
      expect(consoleSpy).toHaveBeenCalled();
      const logs = logger.getRecentLogs(1);
      expect(logs[0].level).toBe(LogLevel.FATAL);
      
      consoleSpy.mockRestore();
    });
  });

  describe('log level filtering', () => {
    it('should respect log level configuration', () => {
      const warnLogger = new Logger('WarnContext', { level: LogLevel.WARN });
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      
      warnLogger.debug('This should not be logged');
      warnLogger.warn('This should be logged');
      
      expect(consoleSpy).not.toHaveBeenCalled();
      const logs = warnLogger.getRecentLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.WARN);
      
      consoleSpy.mockRestore();
    });

    it('should filter logs by level when retrieving', () => {
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');
      
      const errorLogs = logger.getRecentLogs(10, LogLevel.ERROR);
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].level).toBe(LogLevel.ERROR);
      
      const warnAndAbove = logger.getRecentLogs(10, LogLevel.WARN);
      expect(warnAndAbove).toHaveLength(2);
    });
  });

  describe('log storage and retrieval', () => {
    it('should store logs in memory', () => {
      logger.info('Message 1');
      logger.info('Message 2');
      logger.info('Message 3');
      
      const logs = logger.getRecentLogs();
      expect(logs).toHaveLength(3);
      expect(logs[0].message).toBe('Message 1');
      expect(logs[2].message).toBe('Message 3');
    });

    it('should limit stored log entries', () => {
      const limitedLogger = new Logger('Limited', { maxStorageEntries: 2 });
      
      limitedLogger.info('Message 1');
      limitedLogger.info('Message 2');
      limitedLogger.info('Message 3');
      
      const logs = limitedLogger.getRecentLogs();
      expect(logs).toHaveLength(2);
      expect(logs[0].message).toBe('Message 2');
      expect(logs[1].message).toBe('Message 3');
    });

    it('should retrieve logs by context', () => {
      logger.info('Test message', { context: 'specific' });
      logger.info('Other message');
      
      const contextLogs = logger.getLogsByContext('TestContext');
      expect(contextLogs).toHaveLength(2);
      expect(contextLogs[0].context).toBe('TestContext');
    });

    it('should retrieve logs by request ID', () => {
      logger.info('Message 1', { requestId: 'req123' });
      logger.info('Message 2', { requestId: 'req456' });
      logger.info('Message 3', { requestId: 'req123' });
      
      const requestLogs = logger.getLogsByRequestId('req123');
      expect(requestLogs).toHaveLength(2);
      expect(requestLogs[0].requestId).toBe('req123');
      expect(requestLogs[1].requestId).toBe('req123');
    });
  });

  describe('metrics tracking', () => {
    it('should record response times', () => {
      logger.recordResponseTime(100);
      logger.recordResponseTime(200);
      logger.recordResponseTime(150);
      
      const metrics = logger.getMetrics();
      expect(metrics.responseTimeP95).toBeGreaterThan(0);
      expect(metrics.responseTimeP99).toBeGreaterThan(0);
    });

    it('should record fallback usage', () => {
      logger.recordFallbackUsage();
      logger.recordFallbackUsage();
      
      const metrics = logger.getMetrics();
      expect(metrics.fallbackUsageRate).toBeGreaterThanOrEqual(0);
    });

    it('should record cache hits and misses', () => {
      logger.recordCacheHit(true);
      logger.recordCacheHit(false);
      logger.recordCacheHit(true);
      
      const metrics = logger.getMetrics();
      expect(metrics.cacheHitRate).toBeCloseTo(0.67, 1);
    });

    it('should record provider availability', () => {
      logger.recordProviderAvailability('openai', true);
      logger.recordProviderAvailability('openai', false);
      logger.recordProviderAvailability('openai', true);
      
      const metrics = logger.getMetrics();
      expect(metrics.providerAvailability.openai).toBeCloseTo(0.67, 1);
    });
  });

  describe('error tracking', () => {
    it('should track error counts and rates', () => {
      const error1 = new SystemError(ErrorType.API_UNAVAILABLE, 'Error 1');
      const error2 = new SystemError(ErrorType.RATE_LIMITED, 'Error 2');
      const error3 = new SystemError(ErrorType.API_UNAVAILABLE, 'Error 3');
      
      logger.error('Error 1', {}, error1);
      logger.error('Error 2', {}, error2);
      logger.error('Error 3', {}, error3);
      
      const metrics = logger.getMetrics();
      expect(metrics.errorCounts[ErrorType.API_UNAVAILABLE]).toBe(2);
      expect(metrics.errorCounts[ErrorType.RATE_LIMITED]).toBe(1);
    });

    it('should provide error summary', () => {
      const error1 = new SystemError(ErrorType.API_UNAVAILABLE, 'Error 1', {}, { severity: ErrorSeverity.HIGH });
      const error2 = new SystemError(ErrorType.RATE_LIMITED, 'Error 2', {}, { severity: ErrorSeverity.MEDIUM });
      
      logger.error('Error 1', {}, error1);
      logger.error('Error 2', {}, error2);
      
      const summary = logger.getErrorSummary();
      expect(summary.totalErrors).toBe(2);
      expect(summary.errorsByType[ErrorType.API_UNAVAILABLE]).toBe(1);
      expect(summary.errorsBySeverity[ErrorSeverity.HIGH]).toBe(1);
      expect(summary.recentErrors).toHaveLength(2);
    });
  });

  describe('configuration', () => {
    it('should update configuration', () => {
      logger.updateConfig({ level: LogLevel.ERROR, enableConsole: false });
      
      const config = logger.getConfig();
      expect(config.level).toBe(LogLevel.ERROR);
      expect(config.enableConsole).toBe(false);
    });

    it('should disable console logging when configured', () => {
      logger.updateConfig({ enableConsole: false });
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      
      logger.info('This should not appear in console');
      
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('log export', () => {
    it('should export logs as JSON', () => {
      logger.info('Test message', { key: 'value' });
      
      const exported = logger.exportLogs();
      const parsed = JSON.parse(exported);
      
      expect(parsed.context).toBe('TestContext');
      expect(parsed.exportTime).toBeDefined();
      expect(parsed.logs).toHaveLength(1);
      expect(parsed.metrics).toBeDefined();
    });
  });

  describe('cleanup', () => {
    it('should clear logs', () => {
      logger.info('Message 1');
      logger.info('Message 2');
      
      expect(logger.getRecentLogs()).toHaveLength(2);
      
      logger.clearLogs();
      
      expect(logger.getRecentLogs()).toHaveLength(0);
    });
  });
});