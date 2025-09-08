/**
 * ConfigValidator Tests
 * Tests for configuration validation functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConfigValidator } from '../ConfigValidator';
import type { EnvironmentConfig, FeatureFlags } from '../../../types/config';

// Mock Logger
vi.mock('../../errorHandling/Logger', () => ({
  Logger: {
    getInstance: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    })
  }
}));

describe('ConfigValidator', () => {
  let validator: ConfigValidator;
  let validConfig: EnvironmentConfig;
  let validFeatureFlags: FeatureFlags;

  beforeEach(() => {
    // Reset singleton
    (ConfigValidator as any).instance = undefined;
    validator = ConfigValidator.getInstance();

    validConfig = {
      llmProviders: {
        openai: {
          apiKey: 'sk-test-key-1234567890123456789012345678901234567890',
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          maxTokens: 2048
        }
      },
      defaultProvider: 'openai',
      enableCaching: true,
      maxConcurrentRequests: 10,
      responseTimeout: 30000,
      retryPolicy: {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2
      },
      environment: 'development',
      logLevel: 'info',
      enableMetrics: false,
      configVersion: '1.0.0'
    };

    validFeatureFlags = {
      llmIntegrationEnabled: true,
      enhancedStaticResponses: true,
      responseCaching: true,
      debugLogging: false,
      performanceMetrics: false,
      experimentalFeatures: false,
      personaPromptGeneration: true,
      questionAnalysis: true,
      multiProviderFallback: true,
      configHotReload: true
    };
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = ConfigValidator.getInstance();
      const instance2 = ConfigValidator.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('validateConfiguration', () => {
    it('should validate valid configuration', () => {
      const result = validator.validateConfiguration(validConfig, validFeatureFlags);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should detect missing default provider', () => {
      const invalidConfig = {
        ...validConfig,
        defaultProvider: 'nonexistent'
      };

      const result = validator.validateConfiguration(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Default provider 'nonexistent' is not configured. Available providers: openai");
    });

    it('should detect invalid retry policy', () => {
      const invalidConfig = {
        ...validConfig,
        retryPolicy: {
          maxRetries: -1,
          baseDelay: -1000,
          maxDelay: 500,
          backoffMultiplier: 0.5
        }
      };

      const result = validator.validateConfiguration(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Max retries must be non-negative');
      expect(result.errors).toContain('Base delay must be non-negative');
      expect(result.errors).toContain('Max delay must be greater than or equal to base delay');
      expect(result.errors).toContain('Backoff multiplier must be at least 1');
    });

    it('should detect invalid performance settings', () => {
      const invalidConfig = {
        ...validConfig,
        responseTimeout: 500,
        maxConcurrentRequests: 0
      };

      const result = validator.validateConfiguration(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Response timeout must be at least 1000ms');
      expect(result.errors).toContain('Max concurrent requests must be at least 1');
    });

    it('should generate warnings for suboptimal settings', () => {
      const suboptimalConfig = {
        ...validConfig,
        maxConcurrentRequests: 150,
        responseTimeout: 150000
      };

      const result = validator.validateConfiguration(suboptimalConfig);
      
      expect(result.warnings).toContain('Max concurrent requests is very high (>100). This may cause performance issues');
      expect(result.warnings).toContain('Response timeout is very high (>2 minutes). Users may experience long waits');
    });
  });

  describe('OpenAI configuration validation', () => {
    it('should validate valid OpenAI configuration', () => {
      const result = validator.validateConfiguration(validConfig);
      expect(result.isValid).toBe(true);
    });

    it('should detect missing OpenAI API key', () => {
      const invalidConfig = {
        ...validConfig,
        llmProviders: {
          openai: {
            apiKey: '',
            model: 'gpt-3.5-turbo'
          }
        }
      };

      const result = validator.validateConfiguration(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('OpenAI API key is required');
    });

    it('should warn about short OpenAI API key', () => {
      const invalidConfig = {
        ...validConfig,
        llmProviders: {
          openai: {
            apiKey: 'sk-short',
            model: 'gpt-3.5-turbo'
          }
        }
      };

      const result = validator.validateConfiguration(invalidConfig);
      expect(result.warnings).toContain('OpenAI API key appears to be invalid (too short)');
    });

    it('should warn about API key format', () => {
      const invalidConfig = {
        ...validConfig,
        llmProviders: {
          openai: {
            apiKey: 'invalid-key-format-1234567890123456789012345678901234567890',
            model: 'gpt-3.5-turbo'
          }
        }
      };

      const result = validator.validateConfiguration(invalidConfig);
      expect(result.warnings).toContain('OpenAI API key should start with "sk-"');
    });

    it('should detect invalid temperature', () => {
      const invalidConfig = {
        ...validConfig,
        llmProviders: {
          openai: {
            apiKey: 'sk-test-key-1234567890123456789012345678901234567890',
            model: 'gpt-3.5-turbo',
            temperature: 3.0
          }
        }
      };

      const result = validator.validateConfiguration(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('OpenAI temperature must be between 0 and 2');
    });

    it('should detect invalid base URL', () => {
      const invalidConfig = {
        ...validConfig,
        llmProviders: {
          openai: {
            apiKey: 'sk-test-key-1234567890123456789012345678901234567890',
            model: 'gpt-3.5-turbo',
            baseURL: 'invalid-url'
          }
        }
      };

      const result = validator.validateConfiguration(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('OpenAI base URL is invalid');
    });
  });

  describe('Anthropic configuration validation', () => {
    it('should validate valid Anthropic configuration', () => {
      const configWithAnthropic = {
        ...validConfig,
        llmProviders: {
          anthropic: {
            apiKey: 'sk-ant-test-key-1234567890123456789012345678901234567890',
            model: 'claude-3-sonnet-20240229'
          }
        },
        defaultProvider: 'anthropic'
      };

      const result = validator.validateConfiguration(configWithAnthropic);
      expect(result.isValid).toBe(true);
    });

    it('should detect missing Anthropic API key', () => {
      const invalidConfig = {
        ...validConfig,
        llmProviders: {
          anthropic: {
            apiKey: '',
            model: 'claude-3-sonnet-20240229'
          }
        },
        defaultProvider: 'anthropic'
      };

      const result = validator.validateConfiguration(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Anthropic API key is required');
    });

    it('should detect invalid Anthropic temperature', () => {
      const invalidConfig = {
        ...validConfig,
        llmProviders: {
          anthropic: {
            apiKey: 'sk-ant-test-key-1234567890123456789012345678901234567890',
            model: 'claude-3-sonnet-20240229',
            temperature: 1.5
          }
        },
        defaultProvider: 'anthropic'
      };

      const result = validator.validateConfiguration(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Anthropic temperature must be between 0 and 1');
    });
  });

  describe('Local model configuration validation', () => {
    it('should validate valid local configuration', () => {
      const configWithLocal = {
        ...validConfig,
        llmProviders: {
          local: {
            model: 'llama2',
            baseURL: 'http://localhost:11434'
          }
        },
        defaultProvider: 'local'
      };

      const result = validator.validateConfiguration(configWithLocal);
      expect(result.isValid).toBe(true);
    });

    it('should detect missing local model name', () => {
      const invalidConfig = {
        ...validConfig,
        llmProviders: {
          local: {
            model: '',
            baseURL: 'http://localhost:11434'
          }
        },
        defaultProvider: 'local'
      };

      const result = validator.validateConfiguration(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Local model name is required');
    });

    it('should detect missing local base URL', () => {
      const invalidConfig = {
        ...validConfig,
        llmProviders: {
          local: {
            model: 'llama2',
            baseURL: ''
          }
        },
        defaultProvider: 'local'
      };

      const result = validator.validateConfiguration(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Local model base URL is required');
    });
  });

  describe('environment-specific validation', () => {
    it('should warn about debug logging in production', () => {
      const prodConfig = {
        ...validConfig,
        environment: 'production' as const,
        logLevel: 'debug' as const
      };

      const prodFeatureFlags = {
        ...validFeatureFlags,
        debugLogging: true
      };

      const result = validator.validateConfiguration(prodConfig, prodFeatureFlags);
      
      expect(result.warnings).toContain('Debug logging is enabled in production environment');
      expect(result.warnings).toContain('Debug logging feature flag is enabled in production');
    });

    it('should warn about disabled metrics in production', () => {
      const prodConfig = {
        ...validConfig,
        environment: 'production' as const,
        enableMetrics: false
      };

      const result = validator.validateConfiguration(prodConfig);
      expect(result.warnings).toContain('Metrics are disabled in production environment');
    });

    it('should detect invalid environment', () => {
      const invalidConfig = {
        ...validConfig,
        environment: 'invalid' as any
      };

      const result = validator.validateConfiguration(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Invalid environment: invalid. Must be 'development', 'production', or 'test'");
    });
  });

  describe('feature flag validation', () => {
    it('should detect conflicting feature flags', () => {
      const conflictingFlags = {
        ...validFeatureFlags,
        llmIntegrationEnabled: false,
        enhancedStaticResponses: false
      };

      const result = validator.validateConfiguration(validConfig, conflictingFlags);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Either LLM integration or enhanced static responses must be enabled');
    });

    it('should warn about inconsistent caching settings', () => {
      const inconsistentFlags = {
        ...validFeatureFlags,
        responseCaching: true
      };

      const inconsistentConfig = {
        ...validConfig,
        enableCaching: false
      };

      const result = validator.validateConfiguration(inconsistentConfig, inconsistentFlags);
      expect(result.warnings).toContain('Response caching feature flag is enabled but caching is disabled in config');
    });

    it('should warn about multi-provider fallback with single provider', () => {
      const singleProviderFlags = {
        ...validFeatureFlags,
        multiProviderFallback: true
      };

      const result = validator.validateConfiguration(validConfig, singleProviderFlags);
      expect(result.warnings).toContain('Multi-provider fallback is enabled but only one provider is configured');
    });
  });

  describe('performHealthCheck', () => {
    it('should perform health check on valid configuration', async () => {
      const healthCheck = await validator.performHealthCheck(validConfig);
      
      expect(healthCheck).toBeDefined();
      expect(typeof healthCheck.isHealthy).toBe('boolean');
      expect(Array.isArray(healthCheck.issues)).toBe(true);
      expect(Array.isArray(healthCheck.recommendations)).toBe(true);
      expect(healthCheck.lastChecked).toBeInstanceOf(Date);
      expect(healthCheck.providersStatus).toBeDefined();
    });

    it('should detect provider configuration issues', async () => {
      const invalidConfig = {
        ...validConfig,
        llmProviders: {
          openai: {
            apiKey: '',
            model: 'gpt-3.5-turbo'
          }
        }
      };

      const healthCheck = await validator.performHealthCheck(invalidConfig);
      
      expect(healthCheck.isHealthy).toBe(false);
      expect(healthCheck.issues.length).toBeGreaterThan(0);
      expect(healthCheck.providersStatus.openai).toBeDefined();
      expect(healthCheck.providersStatus.openai.accessible).toBe(false);
    });
  });

  describe('getRecommendations', () => {
    it('should provide recommendations for configuration improvement', () => {
      const recommendations = validator.getRecommendations(validConfig, validFeatureFlags);
      
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations).toContain('Configure multiple providers for better reliability and fallback options');
    });

    it('should recommend provider configuration when none exist', () => {
      const noProviderConfig = {
        ...validConfig,
        llmProviders: {}
      };

      const recommendations = validator.getRecommendations(noProviderConfig, validFeatureFlags);
      expect(recommendations).toContain('Configure at least one LLM provider for better responses');
    });

    it('should recommend production optimizations', () => {
      const prodConfig = {
        ...validConfig,
        environment: 'production' as const,
        logLevel: 'debug' as const,
        enableMetrics: false
      };

      const recommendations = validator.getRecommendations(prodConfig, validFeatureFlags);
      expect(recommendations).toContain('Use info or warn log level in production for better performance');
      expect(recommendations).toContain('Enable metrics in production for monitoring and debugging');
    });
  });
});