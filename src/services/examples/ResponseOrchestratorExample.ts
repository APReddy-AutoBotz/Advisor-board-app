/**
 * Response Orchestrator Usage Example
 * 
 * Demonstrates how to use the ResponseOrchestrator service to coordinate
 * response generation across multiple advisors with error handling and caching.
 */

import { ResponseOrchestrator } from '../responseOrchestrator';
import type { Advisor, DomainId } from '../../types/domain';
import type { EnvironmentConfig } from '../../types/llm';

// Example environment configuration
const exampleEnvironmentConfig: EnvironmentConfig = {
  llmProviders: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || 'your-openai-key',
      model: 'gpt-4'
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY || 'your-anthropic-key',
      model: 'claude-3-sonnet-20240229'
    }
  },
  defaultProvider: 'openai',
  enableCaching: true,
  maxConcurrentRequests: 5,
  responseTimeout: 15000,
  retryPolicy: {
    maxRetries: 2,
    baseDelay: 1000,
    maxDelay: 5000,
    backoffMultiplier: 2
  }
};

// Example advisors
const exampleAdvisors: Advisor[] = [
  {
    id: 'sarah-kim',
    name: 'Sarah Kim',
    expertise: 'Product Strategy',
    background: 'Former CPO at Stripe',
    domain: 'productboard',
    isSelected: true,
    specialties: ['Product Strategy', 'Growth', 'Platform Scaling']
  },
  {
    id: 'marcus-chen',
    name: 'Marcus Chen',
    expertise: 'Product Management',
    background: 'Google Senior PM',
    domain: 'productboard',
    isSelected: true,
    specialties: ['User Research', 'A/B Testing', 'Product Analytics']
  },
  {
    id: 'elena-rodriguez',
    name: 'Elena Rodriguez',
    expertise: 'Design Leadership',
    background: 'Former Airbnb Design Director',
    domain: 'productboard',
    isSelected: true,
    specialties: ['Design Systems', 'User Experience', 'Design Research']
  }
];

/**
 * Basic usage example
 */
export async function basicUsageExample() {
  console.log('🚀 Response Orchestrator - Basic Usage Example\n');

  // Initialize the orchestrator
  const orchestrator = new ResponseOrchestrator(exampleEnvironmentConfig);

  try {
    // Generate responses from multiple advisors
    const question = "What's the best approach for launching a new product feature?";
    const domainId: DomainId = 'productboard';

    console.log(`Question: ${question}\n`);
    console.log('Generating responses from advisors...\n');

    const result = await orchestrator.generateAdvisorResponses(
      question,
      exampleAdvisors,
      domainId
    );

    // Display results
    console.log('📊 Generation Results:');
    console.log(`- Total processing time: ${result.totalProcessingTime}ms`);
    console.log(`- Successful responses: ${result.successCount}`);
    console.log(`- Failed responses: ${result.errorCount}`);
    console.log(`- Cache hits: ${result.cacheHitCount}`);
    console.log(`- Question analysis: ${result.questionAnalysis.type} (confidence: ${result.questionAnalysis.confidence})\n`);

    // Display advisor responses
    result.responses.forEach((response, index) => {
      console.log(`👤 ${response.persona.name} (${response.metadata.responseType}):`);
      console.log(`   Processing time: ${response.metadata.processingTime}ms`);
      console.log(`   Confidence: ${response.metadata.confidence}`);
      if (response.metadata.frameworks) {
        console.log(`   Frameworks: ${response.metadata.frameworks.join(', ')}`);
      }
      if (response.metadata.errorInfo) {
        console.log(`   ⚠️  Fallback used: ${response.metadata.errorInfo.message}`);
      }
      console.log(`   Response: ${response.content.substring(0, 200)}...\n`);
    });

  } catch (error) {
    console.error('❌ Error generating responses:', error);
  }
}

/**
 * Advanced configuration example
 */
export async function advancedConfigurationExample() {
  console.log('⚙️ Response Orchestrator - Advanced Configuration Example\n');

  // Create orchestrator with custom configuration
  const orchestrator = new ResponseOrchestrator(exampleEnvironmentConfig, {
    maxConcurrentRequests: 3,
    responseTimeout: 10000,
    enableCaching: true,
    fallbackToStatic: true,
    retryAttempts: 3
  });

  try {
    const question = "How should we approach technical debt in our product?";
    const domainId: DomainId = 'productboard';

    console.log(`Question: ${question}\n`);

    // Generate responses with custom LLM configuration
    const result = await orchestrator.generateAdvisorResponses(
      question,
      exampleAdvisors,
      domainId,
      {
        temperature: 0.7,
        maxTokens: 500,
        provider: 'anthropic'
      }
    );

    console.log('📊 Advanced Configuration Results:');
    console.log(`- Processing time: ${result.totalProcessingTime}ms`);
    console.log(`- Success rate: ${(result.successCount / result.responses.length * 100).toFixed(1)}%`);
    console.log(`- Cache efficiency: ${result.cacheHitCount} hits\n`);

    // Show configuration details
    const config = orchestrator.getConfig();
    console.log('🔧 Current Configuration:');
    console.log(`- Max concurrent requests: ${config.maxConcurrentRequests}`);
    console.log(`- Response timeout: ${config.responseTimeout}ms`);
    console.log(`- Caching enabled: ${config.enableCaching}`);
    console.log(`- Static fallback: ${config.fallbackToStatic}\n`);

  } catch (error) {
    console.error('❌ Error in advanced configuration:', error);
  }
}

/**
 * Error handling and fallback example
 */
export async function errorHandlingExample() {
  console.log('🛡️ Response Orchestrator - Error Handling Example\n');

  // Create orchestrator with invalid API keys to trigger fallbacks
  const faultyConfig: EnvironmentConfig = {
    ...exampleEnvironmentConfig,
    llmProviders: {
      openai: {
        apiKey: 'invalid-key',
        model: 'gpt-4'
      }
    }
  };

  const orchestrator = new ResponseOrchestrator(faultyConfig, {
    fallbackToStatic: true,
    retryAttempts: 1
  });

  try {
    const question = "What are the key principles of good product design?";
    const domainId: DomainId = 'productboard';

    console.log(`Question: ${question}\n`);
    console.log('Testing error handling with invalid API key...\n');

    const result = await orchestrator.generateAdvisorResponses(
      question,
      exampleAdvisors.slice(0, 2), // Use fewer advisors for this example
      domainId
    );

    console.log('📊 Error Handling Results:');
    console.log(`- Total responses: ${result.responses.length}`);
    console.log(`- Successful responses: ${result.successCount}`);
    console.log(`- Error responses: ${result.errorCount}`);

    result.responses.forEach((response) => {
      console.log(`\n👤 ${response.persona.name}:`);
      console.log(`   Response type: ${response.metadata.responseType}`);
      if (response.metadata.errorInfo) {
        console.log(`   ⚠️  Error handled: ${response.metadata.errorInfo.type}`);
        console.log(`   Fallback used: ${response.metadata.errorInfo.fallbackUsed}`);
      }
      console.log(`   Content preview: ${response.content.substring(0, 150)}...`);
    });

  } catch (error) {
    console.error('❌ Error in error handling example:', error);
  }
}

/**
 * Performance and caching example
 */
export async function performanceCachingExample() {
  console.log('⚡ Response Orchestrator - Performance & Caching Example\n');

  const orchestrator = new ResponseOrchestrator(exampleEnvironmentConfig, {
    enableCaching: true,
    maxConcurrentRequests: 10
  });

  try {
    const question = "What metrics should we track for product success?";
    const domainId: DomainId = 'productboard';

    console.log(`Question: ${question}\n`);

    // First request (no cache)
    console.log('🔄 First request (building cache)...');
    const startTime1 = Date.now();
    const result1 = await orchestrator.generateAdvisorResponses(question, exampleAdvisors, domainId);
    const time1 = Date.now() - startTime1;

    console.log(`   Time: ${time1}ms, Cache hits: ${result1.cacheHitCount}`);

    // Second request (should use cache)
    console.log('🔄 Second request (using cache)...');
    const startTime2 = Date.now();
    const result2 = await orchestrator.generateAdvisorResponses(question, exampleAdvisors, domainId);
    const time2 = Date.now() - startTime2;

    console.log(`   Time: ${time2}ms, Cache hits: ${result2.cacheHitCount}`);

    // Performance comparison
    const speedup = ((time1 - time2) / time1 * 100).toFixed(1);
    console.log(`\n📈 Performance Improvement: ${speedup}% faster with caching`);

    // Cache statistics
    const cacheStats = orchestrator.getCacheStats();
    console.log(`📊 Cache Statistics: ${cacheStats.size} entries`);

  } catch (error) {
    console.error('❌ Error in performance example:', error);
  }
}

/**
 * Health check example
 */
export async function healthCheckExample() {
  console.log('🏥 Response Orchestrator - Health Check Example\n');

  const orchestrator = new ResponseOrchestrator(exampleEnvironmentConfig);

  try {
    console.log('Performing health check...\n');

    const health = await orchestrator.healthCheck();

    console.log('🔍 Health Check Results:');
    console.log('LLM Providers:');
    Object.entries(health.llmProviders).forEach(([provider, status]) => {
      console.log(`   ${provider}: ${status ? '✅ Available' : '❌ Unavailable'}`);
    });

    console.log(`Static Generator: ${health.staticGenerator ? '✅ Available' : '❌ Unavailable'}`);
    console.log(`Question Analyzer: ${health.questionAnalyzer ? '✅ Available' : '❌ Unavailable'}`);
    console.log(`Persona Service: ${health.personaService ? '✅ Available' : '❌ Unavailable'}`);

    const overallHealth = Object.values(health.llmProviders).some(Boolean) && 
                         health.staticGenerator && 
                         health.questionAnalyzer && 
                         health.personaService;

    console.log(`\n🎯 Overall System Health: ${overallHealth ? '✅ Healthy' : '⚠️ Degraded'}`);

  } catch (error) {
    console.error('❌ Error in health check:', error);
  }
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('🎯 Response Orchestrator - Complete Examples Suite\n');
  console.log('=' .repeat(60) + '\n');

  try {
    await basicUsageExample();
    console.log('=' .repeat(60) + '\n');
    
    await advancedConfigurationExample();
    console.log('=' .repeat(60) + '\n');
    
    await errorHandlingExample();
    console.log('=' .repeat(60) + '\n');
    
    await performanceCachingExample();
    console.log('=' .repeat(60) + '\n');
    
    await healthCheckExample();
    console.log('=' .repeat(60) + '\n');

    console.log('✅ All examples completed successfully!');

  } catch (error) {
    console.error('❌ Error running examples:', error);
  }
}

// Export for use in other modules
export {
  ResponseOrchestrator,
  exampleEnvironmentConfig,
  exampleAdvisors
};

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}