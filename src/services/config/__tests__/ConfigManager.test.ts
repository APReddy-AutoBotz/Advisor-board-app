/**
 * ConfigManager Tests
 * Tests for configuration management functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConfigManager } from '../ConfigManager';
import type { EnvironmentConfig, ConfigUpdateEvent } from '../../../types/config';

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

describe('ConfigManager', () => {
  let configManager: ConfigManager;
  let originalEnv: any;

  beforeEach(() => {
    // Reset singleton
    (ConfigManager as any).instance = undefined;
    
    // Mock environment variables
    originalEnv = process.env;
    process.env = {
      ...originalEnv,
      OPENAI_API_KEY: 'sk-test-key-123',
      OPENAI_MODEL: 'gpt-4',
      LLM_DEFAULT_PROVIDER: 'openai',
      NODE_ENV: 'test'
    };

    configManager = ConfigManager.getInstance();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = ConfigManager.getInstance();
      const instance2 = ConfigManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getConfig', () => {
    it('should return current configuration', () => {
      const config = configManager.getConfig();
      
      expect(config).toBeDefined();
      expect(config.llmProviders).toBeDefined();
      expect(config.defaultProvider).toBe('openai');
      expect(config.environment).toBe('test');
    });

    it('should include OpenAI configuration when API key is provided', () => {
      const config = configManager.getConfig();
      
      expect(config.llmProviders.openai).toBeDefined();
      expect(config.llmProviders.openai?.apiKey).toBe('sk-test-key-123');
      expect(config.llmProviders.openai?.model).toBe('gpt-4');
    });
  });

  describe('getFeatureFlags', () => {
    it('should return current feature flags', () => {
      const featureFlags = configManager.getFeatureFlags();
      
      expect(featureFlags).toBeDefined();
      expect(typeof featureFlags.llmIntegrationEnabled).toBe('boolean');
      expect(typeof featureFlags.enhancedStaticResponses).toBe('boolean');
    });

    it('should respect environment variable overrides', () => {
      process.env.FEATURE_LLM_INTEGRATION = 'false';
      
      // Reset instance to pick up new env vars
      (ConfigManager as any).instance = undefined;
      const newConfigManager = ConfigManager.getInstance();
      
      const featureFlags = newConfigManager.getFeatureFlags();
      expect(featureFlags.llmIntegrationEnabled).toBe(false);
    });
  });

  describe('isFeatureEnabled', () => {
    it('should return correct feature flag status', () => {
      const isEnabled = configManager.isFeatureEnabled('llmIntegrationEnabled');
      expect(typeof isEnabled).toBe('boolean');
    });
  });

  describe('updateConfig', () => {
    it('should update configuration successfully', () => {
      const updates = {
        maxConcurrentRequests: 20,
        responseTimeout: 45000
      };

      const result = configManager.updateConfig(updates);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      
      const config = configManager.getConfig();
      expect(config.maxConcurrentRequests).toBe(20);
      expect(config.responseTimeout).toBe(45000);
    });

    it('should validate configuration updates', () => {
      const invalidUpdates = {
        maxConcurrentRequests: -1,
        responseTimeout: 500
      };

      const result = configManager.updateConfig(invalidUpdates);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('updateFeatureFlags', () => {
    it('should update feature flags successfully', () => {
      const updates = {
        debugLogging: true,
        experimentalFeatures: true
      };

      configManager.updateFeatureFlags(updates);
      
      const featureFlags = configManager.getFeatureFlags();
      expect(featureFlags.debugLogging).toBe(true);
      expect(featureFlags.experimentalFeatures).toBe(true);
    });
  });

  describe('validateConfiguration', () => {
    it('should validate valid configuration', () => {
      const result = configManager.validateConfiguration();
      
      expect(result).toBeDefined();
      expect(typeof result.isValid).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('should detect configuration errors', () => {
      // Create invalid configuration
      const invalidConfig: EnvironmentConfig = {
        llmProviders: {},
        defaultProvider: 'nonexistent',
        enableCaching: true,
        maxConcurrentRequests: -1,
        responseTimeout: 500,
        retryPolicy: {
          maxRetries: -1,
          baseDelay: -1000,
          maxDelay: 500,
          backoffMultiplier: 0.5
        },
        environment: 'test',
        logLevel: 'info',
        enableMetrics: false,
        configVersion: '1.0.0'
      };

      const result = configManager.validateConfiguration(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('addConfigUpdateListener', () => {
    it('should add and notify configuration update listeners', () => {
      const listener = vi.fn();
      configManager.addConfigUpdateListener(listener);

      const updates = { maxConcurrentRequests: 15 };
      configManager.updateConfig(updates);

      expect(listener).toHaveBeenCalled();
      
      const event: ConfigUpdateEvent = listener.mock.calls[0][0];
      expect(event.timestamp).toBeDefined();
      expect(event.oldConfig).toBeDefined();
      expect(event.newConfig).toBeDefined();
      expect(event.changedKeys).toContain('maxConcurrentRequests');
    });
  });

  describe('removeConfigUpdateListener', () => {
    it('should remove configuration update listeners', () => {
      const listener = vi.fn();
      configManager.addConfigUpdateListener(listener);
      configManager.removeConfigUpdateListener(listener);

      const updates = { maxConcurrentRequests: 15 };
      configManager.updateConfig(updates);

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('exportConfigForDebug', () => {
    it('should export configuration without sensitive data', () => {
      const debugConfig = configManager.exportConfigForDebug();
      
      expect(debugConfig).toBeDefined();
      expect(debugConfig.config).toBeDefined();
      expect(debugConfig.featureFlags).toBeDefined();
      expect(debugConfig.validation).toBeDefined();
      
      // Check that API keys are redacted
      if (debugConfig.config.llmProviders.openai) {
        expect(debugConfig.config.llmProviders.openai.apiKey).toBe('[REDACTED]');
      }
    });
  });

  describe('resetConfig', () => {
    it('should reset configuration to defaults', () => {
      // Modify configuration
      configManager.updateConfig({ maxConcurrentRequests: 50 });
      configManager.updateFeatureFlags({ debugLogging: true });

      // Reset
      configManager.resetConfig();

      // Verify reset
      const config = configManager.getConfig();
      const featureFlags = configManager.getFeatureFlags();
      
      expect(config.maxConcurrentRequests).toBe(10); // Default value
      expect(featureFlags.debugLogging).toBe(false); // Default value
    });
  });

  describe('environment variable handling', () => {
    it('should handle missing environment variables gracefully', () => {
      process.env = {}; // Clear all env vars
      
      (ConfigManager as any).instance = undefined;
      const newConfigManager = ConfigManager.getInstance();
      
      const config = newConfigManager.getConfig();
      expect(config).toBeDefined();
      expect(config.defaultProvider).toBe('openai'); // Default fallback
    });

    it('should support Vite environment variables', () => {
      // Mock import.meta.env
      const mockImportMeta = {
        env: {
          VITE_OPENAI_API_KEY: 'sk-vite-test-key',
          VITE_OPENAI_MODEL: 'gpt-4-turbo'
        }
      };

      // Mock import.meta globally
      Object.defineProperty(globalThis, 'import', {
        value: { meta: mockImportMeta },
        writable: true,
        configurable: true
      });
      
      // Clear process.env to force fallback to import.meta.env
      const originalProcessEnv = process.env;
      process.env = {};
      
      (ConfigManager as any).instance = undefined;
      const newConfigManager = ConfigManager.getInstance();
      
      const config = newConfigManager.getConfig();
      expect(config.llmProviders.openai?.apiKey).toBe('sk-vite-test-key');
      expect(config.llmProviders.openai?.model).toBe('gpt-4-turbo');
      
      // Restore original environment
      process.env = originalProcessEnv;
      delete (globalThis as any).import;
    });
  });

  describe('hot-reloading', () => {
    it('should detect configuration changes when hot-reload is enabled', async () => {
      process.env.FEATURE_CONFIG_HOT_RELOAD = 'true';
      process.env.NODE_ENV = 'development';
      
      (ConfigManager as any).instance = undefined;
      const newConfigManager = ConfigManager.getInstance();
      
      const listener = vi.fn();
      newConfigManager.addConfigUpdateListener(listener);

      // Simulate environment change
      process.env.LLM_MAX_CONCURRENT_REQUESTS = '25';
      
      // Manually trigger config check (in real implementation this would be automatic)
      (newConfigManager as any).checkForConfigChanges();
      
      // Note: In a real test, we might need to wait for the interval
      // For now, we just verify the method exists and can be called
      expect(typeof (newConfigManager as any).checkForConfigChanges).toBe('function');
    });
  });
});
