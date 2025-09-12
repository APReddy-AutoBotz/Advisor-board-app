/**
 * Comprehensive Logging and Monitoring System
 * Implements logging and monitoring for debugging and error tracking
 * 
 * Requirements: FR-6
 */

import { ErrorType, SystemError, ErrorSeverity } from './ErrorTypes';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context: string;
  data?: Record<string, any>;
  error?: SystemError;
  requestId?: string;
  userId?: string;
  sessionId?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableStorage: boolean;
  maxStorageEntries: number;
  enableMonitoring: boolean;
  monitoringEndpoint?: string;
  contextFilters: string[];
}

export interface MonitoringMetrics {
  errorCounts: Record<ErrorType, number>;
  errorRates: Record<ErrorType, number>;
  responseTimeP95: number;
  responseTimeP99: number;
  fallbackUsageRate: number;
  cacheHitRate: number;
  providerAvailability: Record<string, number>;
}

export class Logger {
  private context: string;
  private config: LoggerConfig;
  private logStorage: LogEntry[] = [];
  private metrics: MonitoringMetrics;
  private metricsWindow: Map<string, { timestamp: number; value: number }[]> = new Map();
  private readonly METRICS_WINDOW_SIZE = 1000;
  private readonly METRICS_TIME_WINDOW = 5 * 60 * 1000; // 5 minutes

  constructor(context: string, config?: Partial<LoggerConfig>) {
    this.context = context;
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableStorage: true,
      maxStorageEntries: 10000,
      enableMonitoring: false,
      contextFilters: [],
      ...config
    };

    this.metrics = {
      errorCounts: {} as Record<ErrorType, number>,
      errorRates: {} as Record<ErrorType, number>,
      responseTimeP95: 0,
      responseTimeP99: 0,
      fallbackUsageRate: 0,
      cacheHitRate: 0,
      providerAvailability: {}
    };

    // Initialize error counts
    Object.values(ErrorType).forEach(errorType => {
      this.metrics.errorCounts[errorType] = 0;
      this.metrics.errorRates[errorType] = 0;
    });
  }

  /**
   * Log debug message
   */
  debug(message: string, data?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Log info message
   */
  info(message: string, data?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * Log error message
   */
  error(message: string, data?: Record<string, any>, error?: SystemError): void {
    this.log(LogLevel.ERROR, message, data, error);
    
    if (error) {
      this.recordError(error);
    }
  }

  /**
   * Log fatal error message
   */
  fatal(message: string, data?: Record<string, any>, error?: SystemError): void {
    this.log(LogLevel.FATAL, message, data, error);
    
    if (error) {
      this.recordError(error);
    }
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    data?: Record<string, any>,
    error?: SystemError
  ): void {
    if (level < this.config.level) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context: this.context,
      data,
      error,
      requestId: data?.requestId || error?.requestId,
      userId: data?.userId,
      sessionId: data?.sessionId
    };

    // Console logging
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // Storage logging
    if (this.config.enableStorage) {
      this.logToStorage(entry);
    }

    // Monitoring
    if (this.config.enableMonitoring && level >= LogLevel.WARN) {
      this.sendToMonitoring(entry);
    }
  }

  /**
   * Log to console with appropriate formatting
   */
  private logToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const levelName = LogLevel[entry.level];
    const prefix = `[${timestamp}] [${levelName}] [${entry.context}]`;
    
    const logData = {
      ...entry.data,
      ...(entry.error && { error: entry.error.toJSON() })
    };

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, entry.message, logData);
        break;
      case LogLevel.INFO:
        console.info(prefix, entry.message, logData);
        break;
      case LogLevel.WARN:
        console.warn(prefix, entry.message, logData);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(prefix, entry.message, logData);
        break;
    }
  }

  /**
   * Store log entry in memory
   */
  private logToStorage(entry: LogEntry): void {
    this.logStorage.push(entry);

    // Maintain storage size limit
    if (this.logStorage.length > this.config.maxStorageEntries) {
      this.logStorage = this.logStorage.slice(-this.config.maxStorageEntries);
    }
  }

  /**
   * Send log entry to monitoring system
   */
  private sendToMonitoring(entry: LogEntry): void {
    if (!this.config.monitoringEndpoint) {
      return;
    }

    // In a real implementation, this would send to an external monitoring service
    // For now, we'll just store it for potential future use
    try {
      const monitoringData = {
        timestamp: entry.timestamp.toISOString(),
        level: LogLevel[entry.level],
        context: entry.context,
        message: entry.message,
        data: entry.data,
        error: entry.error?.toJSON(),
        requestId: entry.requestId,
        userId: entry.userId
      };

      // Simulate sending to monitoring endpoint
      // fetch(this.config.monitoringEndpoint, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(monitoringData)
      // }).catch(err => console.error('Failed to send to monitoring:', err));
      
    } catch (error) {
      console.error('Failed to prepare monitoring data:', error);
    }
  }

  /**
   * Record error for metrics tracking
   */
  private recordError(error: SystemError): void {
    // Increment error count
    this.metrics.errorCounts[error.type] = (this.metrics.errorCounts[error.type] || 0) + 1;

    // Record error for rate calculation
    const now = Date.now();
    const errorKey = `error_${error.type}`;
    
    if (!this.metricsWindow.has(errorKey)) {
      this.metricsWindow.set(errorKey, []);
    }
    
    const errorWindow = this.metricsWindow.get(errorKey)!;
    errorWindow.push({ timestamp: now, value: 1 });
    
    // Clean old entries
    this.cleanMetricsWindow(errorKey);
    
    // Update error rate
    this.updateErrorRate(error.type);
  }

  /**
   * Record response time metric
   */
  recordResponseTime(responseTime: number): void {
    const now = Date.now();
    const key = 'response_time';
    
    if (!this.metricsWindow.has(key)) {
      this.metricsWindow.set(key, []);
    }
    
    const window = this.metricsWindow.get(key)!;
    window.push({ timestamp: now, value: responseTime });
    
    this.cleanMetricsWindow(key);
    this.updateResponseTimePercentiles();
  }

  /**
   * Record fallback usage
   */
  recordFallbackUsage(): void {
    const now = Date.now();
    const key = 'fallback_usage';
    
    if (!this.metricsWindow.has(key)) {
      this.metricsWindow.set(key, []);
    }
    
    const window = this.metricsWindow.get(key)!;
    window.push({ timestamp: now, value: 1 });
    
    this.cleanMetricsWindow(key);
    this.updateFallbackUsageRate();
  }

  /**
   * Record cache hit
   */
  recordCacheHit(hit: boolean): void {
    const now = Date.now();
    const key = 'cache_access';
    
    if (!this.metricsWindow.has(key)) {
      this.metricsWindow.set(key, []);
    }
    
    const window = this.metricsWindow.get(key)!;
    window.push({ timestamp: now, value: hit ? 1 : 0 });
    
    this.cleanMetricsWindow(key);
    this.updateCacheHitRate();
  }

  /**
   * Record provider availability
   */
  recordProviderAvailability(provider: string, available: boolean): void {
    const now = Date.now();
    const key = `provider_${provider}`;
    
    if (!this.metricsWindow.has(key)) {
      this.metricsWindow.set(key, []);
    }
    
    const window = this.metricsWindow.get(key)!;
    window.push({ timestamp: now, value: available ? 1 : 0 });
    
    this.cleanMetricsWindow(key);
    this.updateProviderAvailability(provider);
  }

  /**
   * Clean old entries from metrics window
   */
  private cleanMetricsWindow(key: string): void {
    const window = this.metricsWindow.get(key);
    if (!window) return;

    const cutoff = Date.now() - this.METRICS_TIME_WINDOW;
    const filtered = window.filter(entry => entry.timestamp > cutoff);
    
    // Also limit by size
    if (filtered.length > this.METRICS_WINDOW_SIZE) {
      filtered.splice(0, filtered.length - this.METRICS_WINDOW_SIZE);
    }
    
    this.metricsWindow.set(key, filtered);
  }

  /**
   * Update error rate for specific error type
   */
  private updateErrorRate(errorType: ErrorType): void {
    const key = `error_${errorType}`;
    const window = this.metricsWindow.get(key) || [];
    
    if (window.length === 0) {
      this.metrics.errorRates[errorType] = 0;
      return;
    }

    const timeSpan = Date.now() - window[0].timestamp;
    const errorCount = window.length;
    
    // Calculate errors per minute
    this.metrics.errorRates[errorType] = timeSpan > 0 ? (errorCount / timeSpan) * 60000 : 0;
  }

  /**
   * Update response time percentiles
   */
  private updateResponseTimePercentiles(): void {
    const window = this.metricsWindow.get('response_time') || [];
    
    if (window.length === 0) {
      this.metrics.responseTimeP95 = 0;
      this.metrics.responseTimeP99 = 0;
      return;
    }

    const values = window.map(entry => entry.value).sort((a, b) => a - b);
    
    this.metrics.responseTimeP95 = this.calculatePercentile(values, 95);
    this.metrics.responseTimeP99 = this.calculatePercentile(values, 99);
  }

  /**
   * Update fallback usage rate
   */
  private updateFallbackUsageRate(): void {
    const window = this.metricsWindow.get('fallback_usage') || [];
    const responseWindow = this.metricsWindow.get('response_time') || [];
    
    if (responseWindow.length === 0) {
      this.metrics.fallbackUsageRate = 0;
      return;
    }

    this.metrics.fallbackUsageRate = window.length / responseWindow.length;
  }

  /**
   * Update cache hit rate
   */
  private updateCacheHitRate(): void {
    const window = this.metricsWindow.get('cache_access') || [];
    
    if (window.length === 0) {
      this.metrics.cacheHitRate = 0;
      return;
    }

    const hits = window.filter(entry => entry.value === 1).length;
    this.metrics.cacheHitRate = hits / window.length;
  }

  /**
   * Update provider availability
   */
  private updateProviderAvailability(provider: string): void {
    const key = `provider_${provider}`;
    const window = this.metricsWindow.get(key) || [];
    
    if (window.length === 0) {
      this.metrics.providerAvailability[provider] = 0;
      return;
    }

    const available = window.filter(entry => entry.value === 1).length;
    this.metrics.providerAvailability[provider] = available / window.length;
  }

  /**
   * Calculate percentile from sorted array
   */
  private calculatePercentile(sortedValues: number[], percentile: number): number {
    if (sortedValues.length === 0) return 0;
    
    const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, Math.min(index, sortedValues.length - 1))];
  }

  /**
   * Get recent log entries
   */
  getRecentLogs(count: number = 100, level?: LogLevel): LogEntry[] {
    let logs = this.logStorage.slice(-count);
    
    if (level !== undefined) {
      logs = logs.filter(entry => entry.level >= level);
    }
    
    return logs;
  }

  /**
   * Get logs by context filter
   */
  getLogsByContext(context: string, count: number = 100): LogEntry[] {
    return this.logStorage
      .filter(entry => entry.context.includes(context))
      .slice(-count);
  }

  /**
   * Get logs by request ID
   */
  getLogsByRequestId(requestId: string): LogEntry[] {
    return this.logStorage.filter(entry => entry.requestId === requestId);
  }

  /**
   * Get current metrics
   */
  getMetrics(): MonitoringMetrics {
    return { ...this.metrics };
  }

  /**
   * Get error summary
   */
  getErrorSummary(): {
    totalErrors: number;
    errorsByType: Record<ErrorType, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    recentErrors: LogEntry[];
  } {
    const errorLogs = this.logStorage.filter(entry => entry.error);
    const errorsByType = { ...this.metrics.errorCounts };
    const errorsBySerity: Record<ErrorSeverity, number> = {
      [ErrorSeverity.LOW]: 0,
      [ErrorSeverity.MEDIUM]: 0,
      [ErrorSeverity.HIGH]: 0,
      [ErrorSeverity.CRITICAL]: 0
    };

    errorLogs.forEach(entry => {
      if (entry.error) {
        errorsBySerity[entry.error.severity]++;
      }
    });

    return {
      totalErrors: errorLogs.length,
      errorsByType,
      errorsBySeverity: errorsBySerity,
      recentErrors: errorLogs.slice(-10)
    };
  }

  /**
   * Clear stored logs
   */
  clearLogs(): void {
    this.logStorage = [];
  }

  /**
   * Update logger configuration
   */
  updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get logger configuration
   */
  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify({
      context: this.context,
      exportTime: new Date().toISOString(),
      logs: this.logStorage,
      metrics: this.metrics
    }, null, 2);
  }
}
