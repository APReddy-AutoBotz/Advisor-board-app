/**
 * LLM Integration Layer Exports
 * Main entry point for LLM provider integration
 */

// Core types and interfaces
export * from '../../types/llm';

// Base provider class
export { BaseLLMProvider } from './BaseLLMProvider';

// Provider implementations
export { OpenAIProvider } from './OpenAIProvider';
export { AnthropicProvider } from './AnthropicProvider';
export { GeminiProvider } from './GeminiProvider';
export { LocalProvider } from './LocalProvider';

// Main integration layer
export { LLMIntegrationLayer } from './LLMIntegrationLayer';

// Configuration manager
export { LLMConfigManager } from './LLMConfigManager';

// Convenience factory function
import { LLMIntegrationLayer } from './LLMIntegrationLayer';
import { LLMConfigManager } from './LLMConfigManager';

/**
 * Create a configured LLM integration layer instance
 */
export function createLLMIntegration(): LLMIntegrationLayer {
  const configManager = LLMConfigManager.getInstance();
  const config = configManager.getConfig();
  
  return new LLMIntegrationLayer(config);
}

/**
 * Create LLM integration with custom configuration
 */
export function createLLMIntegrationWithConfig(config: any): LLMIntegrationLayer {
  return new LLMIntegrationLayer(config);
}