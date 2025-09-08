/**
 * Configuration System Usage Examples
 * Demonstrates how to use the configuration and environment management system
 */

import { ConfigService } from '../ConfigService';
import type { ConfigUpdateEvent, RuntimeConfigUpdate, FeatureFlagUpdate } from '../../../types/config';

/**
 * Example: Basic Configuration Usage
 */
export class BasicConfigurationExample {
  private configService: ConfigService;

  constructor() {
    this.configService = ConfigService.getInstance();
  }

  /**
   * Example: Get current configuration
   */
  getCurrentConfiguration() {
    console.log('=== Current Configuration ===');
    
    const config = this.configService.getConfig();
    console.log('Environment:', config.environment);
    console.log('Default Provider:', config.defaultProvider);
    console.log('Configured Providers:', this.configService.getConfiguredProviders());
    console.log('Caching Enabled:', config.enableCaching);
    console.log('Max Concurrent Requests:', config.maxConcurrentRequests);
    
    return config;
  }

  /**
   * Example: Check feature flags
   */
  checkFeatureFlags() {
    console.log('=== Feature Flags ===');
    
    const featureFlags = this.configService.getFeatureFlags();
    console.log('LLM Integration:', featureFlags.llmIntegrationEnabled);
    console.log('Enhanced Static Responses:', featureFlags.enhancedStaticResponses);
    console.log('Response Caching:', featureFlags.responseCaching);
    console.log('Debug Logging:', featureFlags.debugLogging);
    
    // Check individual features
    const isLLMEnabled = this.configService.isFeatureEnabled('llmIntegrationEnabled');
    console.log('Is LLM Integration Enabled?', isLLMEnabled);
    
    return featureFlags;
  }

  /**
   * Example: Get provider-specific configuration
   */
  getProviderConfiguration() {
    console.log('=== Provider Configuration ===');
    
    const providers = this.configService.getConfiguredProviders();
    
    for (const provider of providers) {
      const config = this.configService.getProviderSpecificConfig(provider);
      console.log(`${provider} Config:`, {
        model: config?.model,
        isDefault: config?.isDefault,
        timeout: config?.timeout
      });
    }
    
    return providers;
  }
}

/**
 * Example: Runtime Configuration Updates
 */
export class RuntimeConfigurationExample {
  private configService: ConfigService;

  constructor() {
    this.configService = ConfigService.getInstance();
  }

  /**
   * Example: Update configuration at runtime
   */
  updateConfiguration() {
    console.log('=== Runtime Configuration Update ===');
    
    const updates: RuntimeConfigUpdate = {
      maxConcurrentRequests: 15,
      responseTimeout: 45000,
      enableCaching: true
    };

    const result = this.configService.updateConfig(updates);
    
    if (result.isValid) {
      console.log('Configuration updated successfully');
    } else {
      console.log('Configuration update failed:', result.errors);
    }
    
    return result;
  }

  /**
   * Example: Update feature flags
   */
  updateFeatureFlags() {
    console.log('=== Feature Flag Update ===');
    
    const updates: FeatureFlagUpdate = {
      debugLogging: true,
      performanceMetrics: true,
      experimentalFeatures: false
    };

    try {
      this.configService.updateFeatureFlags(updates);
      console.log('Feature flags updated successfully');
    } catch (error) {
      console.error('Failed to update feature flags:', error);
    }
  }

  /**
   * Example: Listen for configuration changes
   */
  setupConfigurationListener() {
    console.log('=== Configuration Change Listener ===');
    
    const listener = (event: ConfigUpdateEvent) => {
      console.log('Configuration changed at:', event.timestamp);
      console.log('Changed keys:', event.changedKeys);
      
      // React to specific changes
      if (event.changedKeys.includes('defaultProvider')) {
        console.log('Default provider changed from', 
          event.oldConfig.defaultProvider, 
          'to', 
          event.newConfig.defaultProvider
        );
      }
      
      if (event.changedKeys.includes('maxConcurrentRequests')) {
        console.log('Max concurrent requests changed from', 
          event.oldConfig.maxConcurrentRequests, 
          'to', 
          event.newConfig.maxConcurrentRequests
        );
      }
    };

    this.configService.addConfigUpdateListener(listener);
    
    // Return cleanup function
    return () => {
      this.configService.removeConfigUpdateListener(listener);
    };
  }
}

/**
 * Example: Configuration Validation and Health Checks
 */
export class ConfigurationValidationExample {
  private configService: ConfigService;

  constructor() {
    this.configService = ConfigService.getInstance();
  }

  /**
   * Example: Validate current configuration
   */
  async validateConfiguration() {
    console.log('=== Configuration Validation ===');
    
    const validation = this.configService.validateConfiguration();
    
    console.log('Is Valid:', validation.isValid);
    
    if (validation.errors.length > 0) {
      console.log('Errors:');
      validation.errors.forEach(error => console.log('  -', error));
    }
    
    if (validation.warnings.length > 0) {
      console.log('Warnings:');
      validation.warnings.forEach(warning => console.log('  -', warning));
    }
    
    return validation;
  }

  /**
   * Example: Perform health check
   */
  async performHealthCheck() {
    console.log('=== Configuration Health Check ===');
    
    const healthCheck = await this.configService.performHealthCheck();
    
    console.log('Is Healthy:', healthCheck.isHealthy);
    console.log('Last Checked:', healthCheck.lastChecked);
    
    if (healthCheck.issues.length > 0) {
      console.log('Issues:');
      healthCheck.issues.forEach(issue => console.log('  -', issue));
    }
    
    if (healthCheck.recommendations.length > 0) {
      console.log('Recommendations:');
      healthCheck.recommendations.forEach(rec => console.log('  -', rec));
    }
    
    console.log('Provider Status:');
    Object.entries(healthCheck.providersStatus).forEach(([provider, status]) => {
      console.log(`  ${provider}:`, {
        configured: status.configured,
        accessible: status.accessible,
        error: status.error
      });
    });
    
    return healthCheck;
  }

  /**
   * Example: Get configuration recommendations
   */
  getRecommendations() {
    console.log('=== Configuration Recommendations ===');
    
    const recommendations = this.configService.getRecommendations();
    
    if (recommendations.length > 0) {
      console.log('Recommendations:');
      recommendations.forEach(rec => console.log('  -', rec));
    } else {
      console.log('No recommendations - configuration looks good!');
    }
    
    return recommendations;
  }
}

/**
 * Example: Operational Configuration Checks
 */
export class OperationalConfigurationExample {
  private configService: ConfigService;

  constructor() {
    this.configService = ConfigService.getInstance();
  }

  /**
   * Example: Check if system is ready for operations
   */
  checkSystemReadiness() {
    console.log('=== System Readiness Check ===');
    
    const isLLMReady = this.configService.isLLMReady();
    console.log('LLM Ready:', isLLMReady);
    
    if (!isLLMReady) {
      const fallbackConfig = this.configService.getFallbackConfig();
      console.log('Using fallback configuration:', fallbackConfig);
    }
    
    return { isLLMReady, fallbackConfig: !isLLMReady ? this.configService.getFallbackConfig() : null };
  }

  /**
   * Example: Prepare configuration for specific operations
   */
  prepareForOperations() {
    console.log('=== Operation Configuration Preparation ===');
    
    try {
      // Prepare for LLM call
      const llmConfig = this.configService.prepareConfigForOperation('llm_call');
      console.log('LLM Call Config:', {
        provider: llmConfig.provider,
        timeout: llmConfig.timeout,
        retries: llmConfig.retryPolicy.maxRetries
      });
    } catch (error) {
      console.log('LLM not ready:', error);
    }
    
    try {
      // Prepare for static response
      const staticConfig = this.configService.prepareConfigForOperation('static_response');
      console.log('Static Response Config:', staticConfig);
    } catch (error) {
      console.log('Static responses not available:', error);
    }
    
    try {
      // Prepare for persona generation
      const personaConfig = this.configService.prepareConfigForOperation('persona_generation');
      console.log('Persona Generation Config:', personaConfig);
    } catch (error) {
      console.log('Persona generation not available:', error);
    }
  }

  /**
   * Example: Get configuration summary for UI
   */
  getConfigurationSummary() {
    console.log('=== Configuration Summary ===');
    
    const summary = this.configService.getConfigSummary();
    
    console.log('Environment:', summary.environment);
    console.log('Configured Providers:', summary.configuredProviders);
    console.log('Default Provider:', summary.defaultProvider);
    console.log('Enabled Features:', summary.enabledFeatures);
    console.log('Configuration Valid:', summary.isValid);
    console.log('Errors:', summary.errorCount);
    console.log('Warnings:', summary.warningCount);
    
    return summary;
  }
}

/**
 * Example: Complete Configuration Workflow
 */
export class CompleteConfigurationWorkflow {
  private configService: ConfigService;

  constructor() {
    this.configService = ConfigService.getInstance();
  }

  /**
   * Example: Complete configuration setup and validation workflow
   */
  async runCompleteWorkflow() {
    console.log('=== Complete Configuration Workflow ===');
    
    // 1. Get current configuration
    const basicExample = new BasicConfigurationExample();
    basicExample.getCurrentConfiguration();
    basicExample.checkFeatureFlags();
    
    // 2. Validate configuration
    const validationExample = new ConfigurationValidationExample();
    await validationExample.validateConfiguration();
    await validationExample.performHealthCheck();
    validationExample.getRecommendations();
    
    // 3. Check system readiness
    const operationalExample = new OperationalConfigurationExample();
    operationalExample.checkSystemReadiness();
    operationalExample.prepareForOperations();
    
    // 4. Set up configuration monitoring
    const runtimeExample = new RuntimeConfigurationExample();
    const cleanup = runtimeExample.setupConfigurationListener();
    
    // 5. Make runtime updates (optional)
    // runtimeExample.updateConfiguration();
    // runtimeExample.updateFeatureFlags();
    
    // 6. Get summary for UI
    operationalExample.getConfigurationSummary();
    
    console.log('=== Workflow Complete ===');
    
    // Return cleanup function
    return cleanup;
  }
}

/**
 * Example: Environment-specific Configuration
 */
export class EnvironmentSpecificExample {
  private configService: ConfigService;

  constructor() {
    this.configService = ConfigService.getInstance();
  }

  /**
   * Example: Configure for different environments
   */
  configureForEnvironment() {
    const envInfo = this.configService.getEnvironmentInfo();
    
    console.log(`=== ${envInfo.environment.toUpperCase()} Environment Configuration ===`);
    
    switch (envInfo.environment) {
      case 'development':
        this.configureDevelopment();
        break;
      case 'production':
        this.configureProduction();
        break;
      case 'test':
        this.configureTest();
        break;
    }
  }

  private configureDevelopment() {
    console.log('Development environment detected');
    
    // Enable debug features for development
    if (!this.configService.isFeatureEnabled('debugLogging')) {
      this.configService.updateFeatureFlags({ debugLogging: true });
    }
    
    if (!this.configService.isFeatureEnabled('configHotReload')) {
      this.configService.updateFeatureFlags({ configHotReload: true });
    }
    
    console.log('Development features enabled');
  }

  private configureProduction() {
    console.log('Production environment detected');
    
    // Ensure production-safe settings
    const updates: RuntimeConfigUpdate = {
      enableMetrics: true
    };
    
    const featureUpdates: FeatureFlagUpdate = {
      debugLogging: false,
      experimentalFeatures: false,
      configHotReload: false,
      performanceMetrics: true
    };
    
    this.configService.updateConfig(updates);
    this.configService.updateFeatureFlags(featureUpdates);
    
    console.log('Production optimizations applied');
  }

  private configureTest() {
    console.log('Test environment detected');
    
    // Configure for testing
    const updates: RuntimeConfigUpdate = {
      responseTimeout: 10000, // Shorter timeout for tests
      maxConcurrentRequests: 5 // Lower concurrency for tests
    };
    
    this.configService.updateConfig(updates);
    
    console.log('Test environment configured');
  }
}

// Export usage examples
export const configurationExamples = {
  BasicConfigurationExample,
  RuntimeConfigurationExample,
  ConfigurationValidationExample,
  OperationalConfigurationExample,
  CompleteConfigurationWorkflow,
  EnvironmentSpecificExample
};