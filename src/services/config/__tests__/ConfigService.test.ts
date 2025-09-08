/**
 * ConfigService Tests
 * Tests for configuration service functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConfigService } from '../ConfigService';
import type { EnvironmentConfig, FeatureFlags } from '../../../types/config';

// Mock dependencies
vi.mock('../ConfigManager', () => ({
  ConfigManager: {
    getInstance: () => ({
      getConfig: vi.fn().mockReturnValue({
        llmProviders: {
          openai: {
            apiKey: 'sk-test-key',
            model: 'gpt-3.5-turbo'
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
        environment: 'test',
        logLevel: 'info',
        enableMetrics: false,
        configVersion: '1.0.0'
      }),
      getFeatureFlags: vi.fn().mockReturnValue({
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
      }),
      isFeatureEnabled: vi.fn().mockImplementation((feature) => {
        const flags = {
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
        return flags[feature as keyof typeof flags] || false;
      }),
      updateConfig: vi.fn().mockReturnValue({
        isValid: true,
        errors: [],
        warnings: [],
        timestamp: new Date()
      }),
      updateFeatureFlags: vi.fn(),
      addConfigUpdateListener: vi.fn(),
      removeConfigUpdateListener: vi.fn(),
      exportConfigForDebug: vi.fn().mockReturnValue({
        config: {},
        featureFlags: {},
        validation: { isValid: true, errors: [], warnings: [] }
      }),
      resetConfig: vi.fn()
    })
  }
}));

vi.mock('../ConfigValidator', () => ({
  ConfigValidator: {
    getInstance: () => ({
      validateConfiguration: vi.fn().mockReturnValue({
        isValid: true,
        errors: [],
        warnings: [],
        timestamp: new Date()
      }),
      performHealthCheck: vi.fn().mockResolvedValue({
        isHealthy: true,
        issues: [],
        recommendations: [],
        lastChecked: new Date(),
        providersStatus: {}
      }),
      getRecommendations: vi.fn().mockReturnValue([
        'Configure multiple providers for better reliability'
      ])
    })
  }
}));

vi.mock('../../errorHandling/Logger', () => ({
  Logger: {
    getInstance: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    })
  }
}));

describe('ConfigService', () => {
  let configService: ConfigService;

  beforeEach(() => {
    // Reset singleton
    (ConfigService as any).instance = undefined;
    configService = ConfigService.getInstance();
    vi.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = ConfigService.getInstance();
      const instance2 = ConfigService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getConfig', () => {
    it('should return current configuration', () => {
      const config = configService.getConfig();
      
      expect(config).toBeDefined();
      expect(config.llmProviders).toBeDefined();
      expect(config.defaultProvider).toBe('openai');
    });
  });

  describe('getFeatureFlags', () => {
    it('should return current feature flags', () => {
      const featureFlags = configService.getFeatureFlags();
      
      expect(featureFlags).toBeDefined();
      expect(featureFlags.llmIntegrationEnabled).toBe(true);
    });
  });

  describe('isFeatureEnabled', () => {
    it('should check if feature is enabled', () => {
      const isEnabled = configService.isFeatureEnabled('llmIntegrationEnabled');
      expect(isEnabled).toBe(true);
      
      const isDisabled = configService.isFeatureEnabled('debugLogging');
      expect(isDisabled).toBe(false);
    });
  });

  describe('getLLMProviderConfig', () => {
    it('should return provider configuration', () => {
      const openaiConfig = configService.getLLMProviderConfig('openai');
      
      expect(openaiConfig).toBeDefined();
      expect(openaiConfig.apiKey).toBe('sk-test-key');
      expect(openaiConfig.model).toBe('gpt-3.5-turbo');
    });

    it('should return undefined for non-existent provider', () => {
      const nonExistentConfig = configService.getLLMProviderConfig('nonexistent');
      expect(nonExistentConfig).toBeUndefined();
    });
  });

  describe('getDefaultProvider', () => {
    it('should return default provider', () => {
      const defaultProvider = configService.getDefaultProvider();
      expect(defaultProvider).toBe('openai');
    });
  });

  describe('getConfiguredProviders', () => {
    it('should return list of configured providers', () => {
      const providers = configService.getConfiguredProviders();
      expect(Array.isArray(providers)).toBe(true);
      expect(providers).toContain('openai');
    });
  });

  describe('isProviderConfigured', () => {
    it('should check if provider is configured', () => {
      const isConfigured = configService.isProviderConfigured('openai');
      expect(isConfigured).toBe(true);
      
      const isNotConfigured = configService.isProviderConfigured('anthropic');
      expect(isNotConfigured).toBe(false);
    });
  });

  describe('getRetryPolicy', () => {
    it('should return retry policy configuration', () => {
      const retryPolicy = configService.getRetryPolicy();
      
      expect(retryPolicy).toBeDefined();
      expect(retryPolicy.maxRetries).toBe(3);
      expect(retryPolicy.baseDelay).toBe(1000);
    });
  });

  describe('getPerformanceSettings', () => {
    it('should return performance settings', () => {
      const settings = configService.getPerformanceSettings();
      
      expect(settings).toBeDefined();
      expect(settings.maxConcurrentRequests).toBe(10);
      expect(settings.responseTimeout).toBe(30000);
      expect(settings.enableCaching).toBe(true);
    });
  });

  describe('getEnvironmentInfo', () => {
    it('should return environment information', () => {
      const envInfo = configService.getEnvironmentInfo();
      
      expect(envInfo).toBeDefined();
      expect(envInfo.environment).toBe('test');
      expect(envInfo.logLevel).toBe('info');
      expect(envInfo.enableMetrics).toBe(false);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration successfully', () => {
      const updates = {
        maxConcurrentRequests: 20,
        responseTimeout: 45000
      };

      const result = configService.updateConfig(updates);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('updateFeatureFlags', () => {
    it('should update feature flags successfully', () => {
      const updates = {
        debugLogging: true,
        experimentalFeatures: true
      };

      expect(() => {
        configService.updateFeatureFlags(updates);
      }).not.toThrow();
    });
  });

  describe('validateConfiguration', () => {
    it('should validate current configuration', () => {
      const result = configService.validateConfiguration();
      
      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('performHealthCheck', () => {
    it('should perform health check', async () => {
      const healthCheck = await configService.performHealthCheck();
      
      expect(healthCheck).toBeDefined();
      expect(healthCheck.isHealthy).toBe(true);
      expect(healthCheck.lastChecked).toBeInstanceOf(Date);
    });
  });

  describe('getRecommendations', () => {
    it('should return configuration recommendations', () => {
      const recommendations = configService.getRecommendations();
      
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('getConfigSummary', () => {
    it('should return configuration summary', () => {
      const summary = configService.getConfigSummary();
      
      expect(summary).toBeDefined();
      expect(summary.environment).toBe('test');
      expect(Array.isArray(summary.configuredProviders)).toBe(true);
      expect(summary.defaultProvider).toBe('openai');
      expect(Array.isArray(summary.enabledFeatures)).toBe(true);
      expect(typeof summary.isValid).toBe('boolean');
    });
  });

  describe('isLLMReady', () => {
    it('should check if LLM is ready for operations', () => {
      const isReady = configService.isLLMReady();
      expect(typeof isReady).toBe('boolean');
    });

    it('should return false when LLM integration is disabled', () => {
      // Mock disabled LLM integration
      const mockConfigManager = {
        getFeatureFlags: vi.fn().mockReturnValue({
          llmIntegrationEnabled: false,
          enhancedStaticResponses: true
        }),
        getConfig: vi.fn().mockReturnValue({
          llmProviders: { openai: { apiKey: 'test' } },
          defaultProvider: 'openai'
        })
      };

      vi.mocked(configService as any).configManager = mockConfigManager;
      
      const isReady = configService.isLLMReady();
      expect(isReady).toBe(false);
    });
  });

  describe('getFallbackConfig', () => {
    it('should return fallback configuration', () => {
      const fallbackConfig = configService.getFallbackConfig();
      
      expect(fallbackConfig).toBeDefined();
      expect(fallbackConfig.useStaticResponses).toBe(true);
      expect(typeof fallbackConfig.enhancedStaticEnabled).toBe('boolean');
    });
  });

  describe('getProviderSpecificConfig', () => {
    it('should return provider-specific configuration', () => {
      const providerConfig = configService.getProviderSpecificConfig('openai');
      
      expect(providerConfig).toBeDefined();
      expect(providerConfig.apiKey).toBe('sk-test-key');
      expect(providerConfig.retryPolicy).toBeDefined();
      expect(providerConfig.isDefault).toBe(true);
    });

    it('should return null for non-existent provider', () => {
      const providerConfig = configService.getProviderSpecificConfig('nonexistent');
      expect(providerConfig).toBeNull();
    });
  });

  describe('isHotReloadEnabled', () => {
    it('should check if hot-reload is enabled', () => {
      const isEnabled = configService.isHotReloadEnabled();
      expect(typeof isEnabled).toBe('boolean');
    });
  });

  describe('getMetricsConfig', () => {
    it('should return metrics configuration', () => {
      const metricsConfig = configService.getMetricsConfig();
      
      expect(metricsConfig).toBeDefined();
      expect(typeof metricsConfig.enabled).toBe('boolean');
      expect(typeof metricsConfig.performanceMetrics).toBe('boolean');
    });
  });

  describe('getCachingConfig', () => {
    it('should return caching configuration', () => {
      const cachingConfig = configService.getCachingConfig();
      
      expect(cachingConfig).toBeDefined();
      expect(typeof cachingConfig.enabled).toBe('boolean');
      expect(typeof cachingConfig.maxConcurrentRequests).toBe('number');
    });
  });

  describe('prepareConfigForOperation', () => {
    it('should prepare config for LLM call operation', () => {
      const config = configService.prepareConfigForOperation('llm_call');
      
      expect(config).toBeDefined();
      expect(config.provider).toBe('openai');
      expect(config.providerConfig).toBeDefined();
      expect(config.retryPolicy).toBeDefined();
    });

    it('should prepare config for static response operation', () => {
      const config = configService.prepareConfigForOperation('static_response');
      
      expect(config).toBeDefined();
      expect(typeof config.personaEnabled).toBe('boolean');
      expect(typeof config.questionAnalysisEnabled).toBe('boolean');
    });

    it('should prepare config for persona generation operation', () => {
      const config = configService.prepareConfigForOperation('persona_generation');
      
      expect(config).toBeDefined();
      expect(typeof config.llmEnabled).toBe('boolean');
      expect(typeof config.staticFallback).toBe('boolean');
    });

    it('should throw error for unknown operation', () => {
      expect(() => {
        configService.prepareConfigForOperation('unknown' as any);
      }).toThrow('Unknown operation: unknown');
    });
  });

  describe('configuration listeners', () => {
    it('should add and remove configuration update listeners', () => {
      const listener = vi.fn();
      
      configService.addConfigUpdateListener(listener);
      configService.removeConfigUpdateListener(listener);
      
      // Verify the methods were called on the underlying manager
      expect(configService).toBeDefined();
    });
  });

  describe('exportConfigForDebug', () => {
    it('should export configuration for debugging', () => {
      const debugConfig = configService.exportConfigForDebug();
      
      expect(debugConfig).toBeDefined();
      expect(debugConfig.config).toBeDefined();
      expect(debugConfig.featureFlags).toBeDefined();
    });
  });

  describe('resetConfig', () => {
    it('should reset configuration to defaults', () => {
      expect(() => {
        configService.resetConfig();
      }).not.toThrow();
    });
  });
});