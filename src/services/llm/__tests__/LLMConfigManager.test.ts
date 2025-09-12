/**
 * LLM Configuration Manager Tests
 * Test suite for configuration loading and validation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LLMConfigManager } from '../LLMConfigManager';

describe('LLMConfigManager', () => {
  let configManager: LLMConfigManager;
  let originalEnv: any;

  beforeEach(() => {
    // Store original environment
    originalEnv = { ...process.env };
    
    // Mock environment variables
    process.env.OPENAI_API_KEY = 'test-openai-key';
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
    process.env.LLM_DEFAULT_PROVIDER = 'openai';
    process.env.LLM_ENABLE_CACHING = 'true';
    
    // Reset singleton
    (LLMConfigManager as any).instance = undefined;
    configManager = LLMConfigManager.getInstance();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const instance1 = LLMConfigManager.getInstance();
      const instance2 = LLMConfigManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Configuration Loading', () => {
    it('should load configuration from environment variables', () => {
      const config = configManager.getConfig();
      
      expect(config.llmProviders.openai?.apiKey).toBe('test-openai-key');
      expect(config.llmProviders.anthropic?.apiKey).toBe('test-anthropic-key');
      expect(config.defaultProvider).toBe('openai');
      expect(config.enableCaching).toBe(true);
    });

    it('should use defaults when environment variables are missing', () => {
      // Clear environment variables
      delete process.env.OPENAI_API_KEY;
      delete process.env.LLM_DEFAULT_PROVIDER;
      
      // Reset singleton to reload config
      (LLMConfigManager as any).instance = undefined;
      const newConfigManager = LLMConfigManager.getInstance();
      const config = newConfigManager.getConfig();
      
      expect(config.defaultProvider).toBe('anthropic'); // Should fallback to next available
      expect(config.maxConcurrentRequests).toBe(10); // Default value
    });

    it('should handle custom model configurations', () => {
      process.env.OPENAI_MODEL = 'gpt-4';
      process.env.ANTHROPIC_MODEL = 'claude-3-opus-20240229';
      
      (LLMConfigManager as any).instance = undefined;
      const newConfigManager = LLMConfigManager.getInstance();
      const config = newConfigManager.getConfig();
      
      expect(config.llmProviders.openai?.model).toBe('gpt-4');
      expect(config.llmProviders.anthropic?.model).toBe('claude-3-opus-20240229');
    });
  });

  describe('Configuration Validation', () => {
    it('should validate valid configuration', () => {
      const validation = configManager.validateConfig();
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect missing providers', () => {
      // Create config with no providers
      configManager.updateConfig({
        llmProviders: {}
      });
      
      const validation = configManager.validateConfig();
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('No LLM providers configured. Please set at least one API key.');
    });

    it('should detect invalid default provider', () => {
      configManager.updateConfig({
        defaultProvider: 'nonexistent-provider'
      });
      
      const validation = configManager.validateConfig();
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => 
        error.includes('Default provider \'nonexistent-provider\' is not configured')
      )).toBe(true);
    });

    it('should validate retry policy', () => {
      configManager.updateConfig({
        retryPolicy: {
          maxRetries: -1,
          baseDelay: -100,
          maxDelay: -200, // maxDelay < baseDelay to trigger the error
          backoffMultiplier: 2
        }
      });
      
      const validation = configManager.validateConfig();
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Max retries must be non-negative.');
      expect(validation.errors).toContain('Base delay must be non-negative.');
      expect(validation.errors).toContain('Max delay must be greater than or equal to base delay.');
    });

    it('should validate timeout', () => {
      configManager.updateConfig({
        responseTimeout: 500
      });
      
      const validation = configManager.validateConfig();
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Response timeout must be at least 1000ms.');
    });
  });

  describe('Provider Management', () => {
    it('should check if provider is configured', () => {
      expect(configManager.isProviderConfigured('openai')).toBe(true);
      expect(configManager.isProviderConfigured('gemini')).toBe(false);
    });

    it('should get configured providers', () => {
      const providers = configManager.getConfiguredProviders();
      expect(providers).toContain('openai');
      expect(providers).toContain('anthropic');
    });

    it('should get provider configuration', () => {
      const openaiConfig = configManager.getProviderConfig('openai');
      expect(openaiConfig.apiKey).toBe('test-openai-key');
    });

    it('should set provider API key at runtime', () => {
      configManager.setProviderApiKey('gemini', 'new-gemini-key');
      
      const geminiConfig = configManager.getProviderConfig('gemini');
      expect(geminiConfig.apiKey).toBe('new-gemini-key');
    });

    it('should remove provider configuration', () => {
      configManager.removeProvider('anthropic');
      
      expect(configManager.isProviderConfigured('anthropic')).toBe(false);
      const providers = configManager.getConfiguredProviders();
      expect(providers).not.toContain('anthropic');
    });

    it('should update default provider when removed', () => {
      configManager.removeProvider('openai');
      
      const config = configManager.getConfig();
      expect(config.defaultProvider).toBe('anthropic');
    });
  });

  describe('Configuration Updates', () => {
    it('should update configuration', () => {
      const updates = {
        enableCaching: false,
        maxConcurrentRequests: 5
      };
      
      configManager.updateConfig(updates);
      const config = configManager.getConfig();
      
      expect(config.enableCaching).toBe(false);
      expect(config.maxConcurrentRequests).toBe(5);
    });

    it('should reset configuration', () => {
      configManager.updateConfig({ enableCaching: false });
      configManager.resetConfig();
      
      const config = configManager.getConfig();
      expect(config.enableCaching).toBe(true); // Back to original
    });
  });

  describe('Debug Export', () => {
    it('should export configuration without sensitive data', () => {
      const debugConfig = configManager.exportConfigForDebug();
      
      expect(debugConfig.llmProviders.openai.apiKey).toBe('[REDACTED]');
      expect(debugConfig.llmProviders.anthropic.apiKey).toBe('[REDACTED]');
      expect(debugConfig.defaultProvider).toBe('openai');
    });

    it('should handle undefined API keys in debug export', () => {
      configManager.setProviderApiKey('gemini', '');
      const debugConfig = configManager.exportConfigForDebug();
      
      expect(debugConfig.llmProviders.gemini.apiKey).toBeUndefined();
    });
  });
});
