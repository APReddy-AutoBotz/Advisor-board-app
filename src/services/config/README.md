# Configuration and Environment Management System

This system provides comprehensive configuration and environment management for the Persona-Powered LLM Integration. It includes environment variable loading, feature flags, runtime configuration updates, validation, and hot-reloading capabilities.

## Features

- **Environment Configuration**: Load configuration from environment variables, .env files, and config files
- **Feature Flags**: Toggle different capabilities at runtime
- **Runtime Configuration**: Update configuration without restarting the application
- **Validation**: Comprehensive validation with error reporting and recommendations
- **Hot-Reloading**: Automatic configuration updates during development
- **Health Checks**: Monitor configuration health and provider status
- **Multi-Environment Support**: Different configurations for development, production, and test environments

## Architecture

### Core Components

1. **ConfigManager**: Central configuration management with hot-reloading
2. **ConfigValidator**: Comprehensive validation and health checking
3. **ConfigService**: High-level service interface for easy access
4. **EnvironmentLoader**: Handles loading from various sources

### Configuration Sources (Priority Order)

1. Config files (highest priority)
2. .env files
3. Environment variables (lowest priority)

## Usage

### Basic Usage

```typescript
import { ConfigService } from './services/config';

const configService = ConfigService.getInstance();

// Get current configuration
const config = configService.getConfig();
console.log('Default Provider:', config.defaultProvider);

// Check feature flags
const isLLMEnabled = configService.isFeatureEnabled('llmIntegrationEnabled');

// Get provider configuration
const openaiConfig = configService.getLLMProviderConfig('openai');
```

### Runtime Updates

```typescript
// Update configuration
const result = configService.updateConfig({
  maxConcurrentRequests: 20,
  responseTimeout: 45000
});

if (result.isValid) {
  console.log('Configuration updated successfully');
}

// Update feature flags
configService.updateFeatureFlags({
  debugLogging: true,
  experimentalFeatures: false
});
```

### Configuration Validation

```typescript
// Validate current configuration
const validation = configService.validateConfiguration();

if (!validation.isValid) {
  console.log('Configuration errors:', validation.errors);
  console.log('Configuration warnings:', validation.warnings);
}

// Perform health check
const healthCheck = await configService.performHealthCheck();
console.log('System healthy:', healthCheck.isHealthy);
```

### Configuration Listeners

```typescript
// Listen for configuration changes
const listener = (event) => {
  console.log('Configuration changed:', event.changedKeys);
};

configService.addConfigUpdateListener(listener);

// Clean up
configService.removeConfigUpdateListener(listener);
```

## Environment Variables

### LLM Provider Configuration

```bash
# OpenAI
OPENAI_API_KEY=sk-your-openai-key
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_TEMPERATURE=0.7
OPENAI_MAX_TOKENS=2048

# Anthropic
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
ANTHROPIC_MODEL=claude-3-sonnet-20240229
ANTHROPIC_BASE_URL=https://api.anthropic.com
ANTHROPIC_TEMPERATURE=0.7
ANTHROPIC_MAX_TOKENS=2048

# Gemini
GEMINI_API_KEY=your-gemini-key
GEMINI_MODEL=gemini-1.5-flash
GEMINI_BASE_URL=https://generativelanguage.googleapis.com
GEMINI_TEMPERATURE=0.7
GEMINI_MAX_TOKENS=2048

# Local Model
LOCAL_LLM_MODEL=llama2
LOCAL_LLM_BASE_URL=http://localhost:11434
LOCAL_TEMPERATURE=0.7
LOCAL_MAX_TOKENS=2048
```

### General Configuration

```bash
# LLM Configuration
LLM_DEFAULT_PROVIDER=openai
LLM_ENABLE_CACHING=true
LLM_MAX_CONCURRENT_REQUESTS=10
LLM_RESPONSE_TIMEOUT=30000

# Retry Policy
LLM_MAX_RETRIES=3
LLM_BASE_DELAY=1000
LLM_MAX_DELAY=10000
LLM_BACKOFF_MULTIPLIER=2

# Environment
NODE_ENV=development
LOG_LEVEL=info
ENABLE_METRICS=false
METRICS_ENDPOINT=http://localhost:3001/metrics
CONFIG_VERSION=1.0.0
```

### Feature Flags

```bash
# Feature Flags
FEATURE_LLM_INTEGRATION=true
FEATURE_ENHANCED_STATIC_RESPONSES=true
FEATURE_RESPONSE_CACHING=true
FEATURE_DEBUG_LOGGING=false
FEATURE_PERFORMANCE_METRICS=false
FEATURE_EXPERIMENTAL=false
FEATURE_PERSONA_PROMPTS=true
FEATURE_QUESTION_ANALYSIS=true
FEATURE_MULTI_PROVIDER_FALLBACK=true
FEATURE_CONFIG_HOT_RELOAD=true
```

## Vite Environment Variables

For browser environments using Vite, prefix environment variables with `VITE_`:

```bash
VITE_OPENAI_API_KEY=sk-your-openai-key
VITE_LLM_DEFAULT_PROVIDER=openai
VITE_FEATURE_LLM_INTEGRATION=true
```

## Configuration Files

### JSON Configuration Example

```json
{
  "llmProviders": {
    "openai": {
      "apiKey": "sk-your-openai-key",
      "model": "gpt-3.5-turbo",
      "temperature": 0.7,
      "maxTokens": 2048
    }
  },
  "defaultProvider": "openai",
  "enableCaching": true,
  "maxConcurrentRequests": 10,
  "responseTimeout": 30000,
  "retryPolicy": {
    "maxRetries": 3,
    "baseDelay": 1000,
    "maxDelay": 10000,
    "backoffMultiplier": 2
  },
  "environment": "development",
  "logLevel": "info",
  "enableMetrics": false
}
```

## Feature Flags

### Available Feature Flags

- **llmIntegrationEnabled**: Enable/disable LLM API integration
- **enhancedStaticResponses**: Enable enhanced static response generation
- **responseCaching**: Enable response caching
- **debugLogging**: Enable debug-level logging
- **performanceMetrics**: Enable performance monitoring
- **experimentalFeatures**: Enable experimental features
- **personaPromptGeneration**: Enable persona-specific prompt generation
- **questionAnalysis**: Enable question analysis and categorization
- **multiProviderFallback**: Enable automatic provider fallback
- **configHotReload**: Enable configuration hot-reloading

### Feature Flag Usage

```typescript
// Check if feature is enabled
if (configService.isFeatureEnabled('llmIntegrationEnabled')) {
  // Use LLM integration
} else {
  // Use static responses
}

// Update feature flags
configService.updateFeatureFlags({
  debugLogging: true,
  experimentalFeatures: false
});
```

## Validation and Health Checks

### Configuration Validation

The system performs comprehensive validation including:

- **Provider Configuration**: API keys, models, URLs, parameters
- **Performance Settings**: Timeouts, concurrency limits
- **Retry Policy**: Retry counts, delays, backoff multipliers
- **Environment Settings**: Environment type, log levels
- **Feature Flag Consistency**: Conflicting or inconsistent flags

### Health Checks

Health checks monitor:

- **Provider Accessibility**: Can providers be reached?
- **Configuration Validity**: Are all settings valid?
- **System Readiness**: Is the system ready for operations?
- **Performance Metrics**: Are settings optimized?

```typescript
// Perform health check
const healthCheck = await configService.performHealthCheck();

if (!healthCheck.isHealthy) {
  console.log('Issues found:', healthCheck.issues);
  console.log('Recommendations:', healthCheck.recommendations);
}

// Check provider status
Object.entries(healthCheck.providersStatus).forEach(([provider, status]) => {
  console.log(`${provider}: ${status.accessible ? 'OK' : 'ERROR'}`);
});
```

## Hot-Reloading

Hot-reloading automatically detects configuration changes during development:

```typescript
// Enable hot-reloading (development only)
FEATURE_CONFIG_HOT_RELOAD=true
NODE_ENV=development

// Listen for changes
configService.addConfigUpdateListener((event) => {
  console.log('Configuration updated:', event.changedKeys);
  // React to changes
});
```

## Error Handling

The configuration system provides comprehensive error handling:

```typescript
// Configuration update with validation
const result = configService.updateConfig(updates);

if (!result.isValid) {
  // Handle validation errors
  result.errors.forEach(error => {
    console.error('Configuration error:', error);
  });
  
  // Show warnings
  result.warnings.forEach(warning => {
    console.warn('Configuration warning:', warning);
  });
}

// Operation preparation with error handling
try {
  const config = configService.prepareConfigForOperation('llm_call');
  // Use configuration
} catch (error) {
  console.error('LLM not ready:', error.message);
  // Use fallback
  const fallback = configService.getFallbackConfig();
}
```

## Best Practices

### Development Environment

```bash
NODE_ENV=development
LOG_LEVEL=debug
FEATURE_DEBUG_LOGGING=true
FEATURE_CONFIG_HOT_RELOAD=true
FEATURE_EXPERIMENTAL=true
```

### Production Environment

```bash
NODE_ENV=production
LOG_LEVEL=info
ENABLE_METRICS=true
FEATURE_DEBUG_LOGGING=false
FEATURE_EXPERIMENTAL=false
FEATURE_CONFIG_HOT_RELOAD=false
FEATURE_PERFORMANCE_METRICS=true
```

### Security Considerations

1. **Never commit API keys** to version control
2. **Use environment variables** for sensitive data
3. **Validate all configuration** before use
4. **Monitor configuration changes** in production
5. **Use secure key storage** in production environments

### Performance Optimization

1. **Configure appropriate timeouts** for your use case
2. **Set reasonable concurrency limits** to avoid overwhelming providers
3. **Enable caching** for better performance
4. **Use multiple providers** for better reliability
5. **Monitor performance metrics** in production

## Testing

The configuration system includes comprehensive tests:

```bash
# Run configuration tests
npm test src/services/config

# Run specific test files
npm test ConfigManager.test.ts
npm test ConfigValidator.test.ts
npm test ConfigService.test.ts
```

## Examples

See the `examples/ConfigurationExample.ts` file for complete usage examples including:

- Basic configuration usage
- Runtime updates
- Validation and health checks
- Operational readiness checks
- Environment-specific configuration
- Complete workflow examples

## Integration

### With LLM Services

```typescript
// Check if LLM is ready
if (configService.isLLMReady()) {
  const llmConfig = configService.prepareConfigForOperation('llm_call');
  // Use LLM with configuration
} else {
  const fallback = configService.getFallbackConfig();
  // Use static responses
}
```

### With UI Components

```typescript
// Get configuration summary for UI
const summary = configService.getConfigSummary();

// Display configuration status
<ConfigStatus 
  environment={summary.environment}
  providers={summary.configuredProviders}
  isValid={summary.isValid}
  errors={summary.errorCount}
  warnings={summary.warningCount}
/>
```

### With Error Handling

```typescript
import { ConfigService } from './services/config';
import { ErrorHandlingService } from './services/errorHandling';

const configService = ConfigService.getInstance();
const errorService = ErrorHandlingService.getInstance();

// Integrate configuration with error handling
configService.addConfigUpdateListener((event) => {
  if (event.changedKeys.includes('logLevel')) {
    errorService.updateLogLevel(event.newConfig.logLevel);
  }
});
```

This configuration system provides a robust foundation for managing environment settings, feature flags, and runtime configuration in the Persona-Powered LLM Integration system.