/**
 * LLM Integration Usage Examples
 * Demonstrates how to use the LLM integration layer
 */

import { createLLMIntegration, LLMError, LLMErrorType } from '../index';

/**
 * Basic usage example
 */
export async function basicUsageExample() {
  try {
    // Create LLM integration instance
    const llmIntegration = createLLMIntegration();
    
    // Generate a response using the default provider
    const response = await llmIntegration.generateResponse(
      'Explain the benefits of TypeScript in modern web development.'
    );
    
    console.log('Response:', response.content);
    console.log('Provider:', response.provider);
    console.log('Model:', response.model);
    console.log('Usage:', response.usage);
    
  } catch (error) {
    if (error instanceof LLMError) {
      console.error('LLM Error:', error.type, error.message);
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

/**
 * Custom configuration example
 */
export async function customConfigExample() {
  try {
    const llmIntegration = createLLMIntegration();
    
    // Generate response with custom configuration
    const response = await llmIntegration.generateResponse(
      'Write a brief product strategy for a new mobile app.',
      {
        provider: 'anthropic',
        model: 'claude-3-sonnet-20240229',
        temperature: 0.8,
        maxTokens: 500
      }
    );
    
    console.log('Custom config response:', response.content);
    
  } catch (error) {
    console.error('Error with custom config:', error);
  }
}

/**
 * Provider switching example
 */
export async function providerSwitchingExample() {
  try {
    const llmIntegration = createLLMIntegration();
    
    // Check provider status
    const status = await llmIntegration.getProviderStatus();
    console.log('Provider status:', status);
    
    // Switch to a different provider
    llmIntegration.setActiveProvider('anthropic');
    console.log('Switched to provider:', llmIntegration.getActiveProvider());
    
    // Generate response with new provider
    const response = await llmIntegration.generateResponse(
      'What are the key principles of good API design?'
    );
    
    console.log('Response from new provider:', response.content);
    
  } catch (error) {
    console.error('Error switching providers:', error);
  }
}

/**
 * Error handling and fallback example
 */
export async function errorHandlingExample() {
  try {
    const llmIntegration = createLLMIntegration();
    
    // This will automatically try fallback providers if the primary fails
    const response = await llmIntegration.generateResponse(
      'Explain machine learning concepts for beginners.'
    );
    
    console.log('Response (with automatic fallback):', response.content);
    
  } catch (error) {
    if (error instanceof LLMError) {
      switch (error.type) {
        case LLMErrorType.API_UNAVAILABLE:
          console.log('All APIs are currently unavailable. Please try again later.');
          break;
        case LLMErrorType.AUTHENTICATION_ERROR:
          console.log('Please check your API keys configuration.');
          break;
        case LLMErrorType.RATE_LIMITED:
          console.log('Rate limit exceeded. Please wait before making more requests.');
          break;
        case LLMErrorType.QUOTA_EXCEEDED:
          console.log('API quota exceeded. Please check your billing.');
          break;
        default:
          console.log('An error occurred:', error.message);
      }
    }
  }
}

/**
 * Testing provider connectivity
 */
export async function testConnectivityExample() {
  try {
    const llmIntegration = createLLMIntegration();
    
    // Test individual providers
    const openaiTest = await llmIntegration.testProvider('openai');
    const anthropicTest = await llmIntegration.testProvider('anthropic');
    
    console.log('OpenAI connectivity:', openaiTest ? 'OK' : 'Failed');
    console.log('Anthropic connectivity:', anthropicTest ? 'OK' : 'Failed');
    
    // Get comprehensive status
    const allStatus = await llmIntegration.getProviderStatus();
    console.log('All provider status:', allStatus);
    
  } catch (error) {
    console.error('Error testing connectivity:', error);
  }
}

/**
 * Configuration management example
 */
export async function configurationExample() {
  try {
    const llmIntegration = createLLMIntegration();
    
    // Get current configuration
    const config = llmIntegration.getConfig();
    console.log('Current config:', config);
    
    // Update configuration
    llmIntegration.updateConfig({
      enableCaching: false,
      responseTimeout: 45000
    });
    
    console.log('Configuration updated');
    
    // Clear cache
    llmIntegration.clearCache();
    console.log('Cache cleared');
    
  } catch (error) {
    console.error('Error managing configuration:', error);
  }
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('=== Basic Usage Example ===');
  await basicUsageExample();
  
  console.log('\n=== Custom Configuration Example ===');
  await customConfigExample();
  
  console.log('\n=== Provider Switching Example ===');
  await providerSwitchingExample();
  
  console.log('\n=== Error Handling Example ===');
  await errorHandlingExample();
  
  console.log('\n=== Connectivity Testing Example ===');
  await testConnectivityExample();
  
  console.log('\n=== Configuration Management Example ===');
  await configurationExample();
}