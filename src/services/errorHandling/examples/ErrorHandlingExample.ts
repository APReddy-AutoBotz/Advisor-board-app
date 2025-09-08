/**
 * Error Handling System Integration Example
 * Demonstrates comprehensive error handling and fallback mechanisms
 * 
 * Requirements: FR-6
 */

import type { Advisor, DomainId } from '../../../types/domain';
import type { EnvironmentConfig } from '../../../types/llm';
import {
  ErrorType,
  SystemError,
  LLMProviderError,
  ErrorRecoveryManager,
  FallbackManager,
  Logger,
  LogLevel
} from '../index';
import { ResponseOrchestrator } from '../../responseOrchestrator';

export class ErrorHandlingExample {
  private responseOrchestrator: ResponseOrchestrator;
  private errorRecoveryManager: ErrorRecoveryManager;
  private fallbackManager: FallbackManager;
  private logger: Logger;

  constructor() {
    // Configure environment with error handling
    const environmentConfig: EnvironmentConfig = {
      llmProviders: {
        openai: {
          apiKey: 'test-key',
          model: 'gpt-4'
        },
        anthropic: {
          apiKey: 'test-key',
          model: 'claude-3-sonnet'
        }
      },
      defaultProvider: 'openai',
      enableCaching: true,
      maxConcurrentRequests: 5,
      responseTimeout: 15000,
      retryPolicy: {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2
      }
    };

    this.responseOrchestrator = new ResponseOrchestrator(environmentConfig);
    this.errorRecoveryManager = new ErrorRecoveryManager();
    this.fallbackManager = new FallbackManager();
    this.logger = new Logger('ErrorHandlingExample', {
      level: LogLevel.INFO,
      enableConsole: true,
      enableStorage: true
    });
  }

  /**
   * Demonstrate API unavailability handling
   */
  async demonstrateAPIUnavailability(): Promise<void> {
    console.log('\n=== API Unavailability Demonstration ===');
    
    const mockAdvisor: Advisor = {
      id: 'demo-advisor',
      name: 'Demo Product Manager',
      expertise: 'Product Strategy',
      background: 'Senior PM with 10+ years experience',
      domain: 'productboard',
      isSelected: true,
      specialties: ['strategy', 'roadmapping']
    };

    try {
      // Simulate API unavailability
      const error = new LLMProviderError(
        ErrorType.API_UNAVAILABLE,
        'OpenAI API is currently unavailable',
        'openai',
        { advisorId: mockAdvisor.id },
        { retryable: true }
      );

      const recoveryContext = this.errorRecoveryManager.createRecoveryContext(
        mockAdvisor,
        'What is the best product strategy for a new startup?',
        'productboard'
      );

      console.log('🔄 Attempting recovery from API unavailability...');
      
      const result = await this.errorRecoveryManager.executeRecovery(
        error,
        recoveryContext,
        async () => {
          // This would normally call the LLM API
          throw error; // Simulate continued failure
        }
      );

      if (result.success) {
        console.log('✅ Recovery successful!');
        console.log(`📝 Response: ${result.response?.content.substring(0, 100)}...`);
        console.log(`🔧 Strategy used: ${result.strategy}`);
        console.log(`🔄 Fallback used: ${result.fallbackUsed}`);
        console.log(`⏱️  Total time: ${result.totalTime}ms`);
      } else {
        console.log('❌ Recovery failed');
        console.log(`🚨 Error: ${result.error?.message}`);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  }

  /**
   * Demonstrate rate limiting handling
   */
  async demonstrateRateLimiting(): Promise<void> {
    console.log('\n=== Rate Limiting Demonstration ===');
    
    const mockAdvisor: Advisor = {
      id: 'demo-advisor-2',
      name: 'Demo Clinical Researcher',
      expertise: 'Clinical Trials',
      background: 'Clinical research specialist',
      domain: 'cliniboard',
      isSelected: true,
      specialties: ['trials', 'regulatory']
    };

    try {
      const error = new LLMProviderError(
        ErrorType.RATE_LIMITED,
        'Rate limit exceeded - 429 Too Many Requests',
        'openai',
        { advisorId: mockAdvisor.id },
        { retryable: true }
      );

      const recoveryContext = this.errorRecoveryManager.createRecoveryContext(
        mockAdvisor,
        'What are the key considerations for Phase II clinical trials?',
        'cliniboard'
      );

      console.log('🔄 Handling rate limiting with exponential backoff...');
      
      let attemptCount = 0;
      const result = await this.errorRecoveryManager.executeRecovery(
        error,
        recoveryContext,
        async () => {
          attemptCount++;
          console.log(`  Attempt ${attemptCount}...`);
          
          if (attemptCount < 3) {
            throw error; // Simulate continued rate limiting
          }
          
          // Simulate successful response after retries
          return {
            advisorId: mockAdvisor.id,
            content: 'Phase II clinical trials require careful consideration of...',
            timestamp: new Date(),
            persona: {
              name: mockAdvisor.name,
              expertise: mockAdvisor.expertise,
              background: mockAdvisor.background,
              tone: 'professional',
              specialization: mockAdvisor.specialties || []
            },
            metadata: {
              responseType: 'llm' as const,
              processingTime: 2000,
              confidence: 0.9
            }
          };
        }
      );

      if (result.success) {
        console.log('✅ Rate limiting handled successfully!');
        console.log(`🔄 Attempts made: ${result.attempts}`);
        console.log(`⏱️  Total time: ${result.totalTime}ms`);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  }

  /**
   * Demonstrate fallback system
   */
  async demonstrateFallbackSystem(): Promise<void> {
    console.log('\n=== Fallback System Demonstration ===');
    
    const mockAdvisor: Advisor = {
      id: 'demo-advisor-3',
      name: 'Demo Education Specialist',
      expertise: 'Learning Design',
      background: 'Educational technology expert',
      domain: 'eduboard',
      isSelected: true,
      specialties: ['curriculum', 'assessment']
    };

    try {
      const criticalError = new SystemError(
        ErrorType.SERVICE_UNAVAILABLE,
        'All LLM providers are unavailable',
        { advisorId: mockAdvisor.id },
        { retryable: false }
      );

      console.log('🔄 All primary services failed, using fallback system...');
      
      const fallbackResult = await this.fallbackManager.executeFallback(
        criticalError,
        mockAdvisor,
        'How can I design an effective online learning curriculum?',
        'eduboard'
      );

      if (fallbackResult.success) {
        console.log('✅ Fallback system provided response!');
        console.log(`📝 Response: ${fallbackResult.response?.content.substring(0, 150)}...`);
        console.log(`🔧 Fallback type: ${fallbackResult.fallbackType}`);
        console.log(`⏱️  Processing time: ${fallbackResult.processingTime}ms`);
      } else {
        console.log('❌ Even fallback system failed');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  }

  /**
   * Demonstrate comprehensive logging and monitoring
   */
  async demonstrateLoggingAndMonitoring(): Promise<void> {
    console.log('\n=== Logging and Monitoring Demonstration ===');
    
    // Generate some sample errors and metrics
    const errors = [
      new LLMProviderError(ErrorType.API_UNAVAILABLE, 'API down', 'openai'),
      new LLMProviderError(ErrorType.RATE_LIMITED, 'Rate limited', 'anthropic'),
      new SystemError(ErrorType.NETWORK_ERROR, 'Network timeout'),
      new SystemError(ErrorType.RESPONSE_VALIDATION_ERROR, 'Invalid response format')
    ];

    // Log errors
    errors.forEach((error, index) => {
      this.logger.error(`Sample error ${index + 1}`, {
        requestId: `req_${index + 1}`,
        userId: 'demo-user'
      }, error);
    });

    // Record some metrics
    [120, 250, 180, 95, 300].forEach(time => {
      this.logger.recordResponseTime(time);
    });

    this.logger.recordFallbackUsage();
    this.logger.recordFallbackUsage();
    
    this.logger.recordCacheHit(true);
    this.logger.recordCacheHit(false);
    this.logger.recordCacheHit(true);
    this.logger.recordCacheHit(true);

    this.logger.recordProviderAvailability('openai', false);
    this.logger.recordProviderAvailability('anthropic', true);
    this.logger.recordProviderAvailability('openai', true);

    // Display metrics
    const metrics = this.logger.getMetrics();
    console.log('📊 Current Metrics:');
    console.log(`  Response Time P95: ${metrics.responseTimeP95.toFixed(2)}ms`);
    console.log(`  Response Time P99: ${metrics.responseTimeP99.toFixed(2)}ms`);
    console.log(`  Cache Hit Rate: ${(metrics.cacheHitRate * 100).toFixed(1)}%`);
    console.log(`  Fallback Usage Rate: ${(metrics.fallbackUsageRate * 100).toFixed(1)}%`);
    console.log(`  Provider Availability:`);
    Object.entries(metrics.providerAvailability).forEach(([provider, availability]) => {
      console.log(`    ${provider}: ${(availability * 100).toFixed(1)}%`);
    });

    // Display error summary
    const errorSummary = this.logger.getErrorSummary();
    console.log(`📈 Error Summary:`);
    console.log(`  Total Errors: ${errorSummary.totalErrors}`);
    console.log(`  By Type:`);
    Object.entries(errorSummary.errorsByType).forEach(([type, count]) => {
      if (count > 0) {
        console.log(`    ${type}: ${count}`);
      }
    });
    console.log(`  By Severity:`);
    Object.entries(errorSummary.errorsBySeverity).forEach(([severity, count]) => {
      if (count > 0) {
        console.log(`    ${severity}: ${count}`);
      }
    });
  }

  /**
   * Demonstrate complete error handling workflow
   */
  async demonstrateCompleteWorkflow(): Promise<void> {
    console.log('\n=== Complete Error Handling Workflow ===');
    
    const mockAdvisor: Advisor = {
      id: 'workflow-advisor',
      name: 'Workflow Demo Advisor',
      expertise: 'Comprehensive Analysis',
      background: 'Multi-domain expert',
      domain: 'productboard',
      isSelected: true,
      specialties: ['analysis', 'strategy']
    };

    try {
      console.log('🚀 Starting complete workflow demonstration...');
      
      // This would normally use the ResponseOrchestrator
      // For demo purposes, we'll simulate the workflow
      const question = 'How can I build a resilient product development process?';
      
      console.log(`📝 Question: ${question}`);
      console.log(`👤 Advisor: ${mockAdvisor.name}`);
      console.log(`🎯 Domain: ${mockAdvisor.domain}`);
      
      // Simulate the complete workflow with error handling
      const startTime = Date.now();
      
      try {
        // This would call responseOrchestrator.generateAdvisorResponses
        console.log('🔄 Attempting primary response generation...');
        
        // Simulate various failure scenarios and recovery
        const scenarios = [
          'API_UNAVAILABLE',
          'RATE_LIMITED', 
          'NETWORK_ERROR',
          'SUCCESS'
        ];
        
        for (const scenario of scenarios) {
          console.log(`  Testing scenario: ${scenario}`);
          
          if (scenario === 'SUCCESS') {
            console.log('✅ Primary system successful!');
            break;
          } else {
            console.log(`  ⚠️  ${scenario} - attempting recovery...`);
            // Simulate recovery time
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        
        const totalTime = Date.now() - startTime;
        console.log(`⏱️  Total processing time: ${totalTime}ms`);
        console.log('🎉 Workflow completed successfully with comprehensive error handling!');
        
      } catch (error) {
        console.log('❌ Workflow failed even with error handling');
        console.error(error);
      }
      
    } catch (error) {
      console.error('Unexpected workflow error:', error);
    }
  }

  /**
   * Run all demonstrations
   */
  async runAllDemonstrations(): Promise<void> {
    console.log('🎯 Starting Comprehensive Error Handling Demonstrations');
    console.log('=' .repeat(60));
    
    await this.demonstrateAPIUnavailability();
    await this.demonstrateRateLimiting();
    await this.demonstrateFallbackSystem();
    await this.demonstrateLoggingAndMonitoring();
    await this.demonstrateCompleteWorkflow();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ All error handling demonstrations completed!');
    console.log('📊 Check the logs and metrics for detailed information.');
  }
}

// Example usage
export async function runErrorHandlingExample(): Promise<void> {
  const example = new ErrorHandlingExample();
  await example.runAllDemonstrations();
}

// Export for use in other examples or tests
export { ErrorHandlingExample };