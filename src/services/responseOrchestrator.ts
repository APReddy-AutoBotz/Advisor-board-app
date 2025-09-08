/**
 * Response Orchestrator Service
 * 
 * Main coordination service that manages the entire response generation pipeline.
 * Implements concurrent processing for multiple advisor responses, comprehensive error handling
 * with graceful degradation, and response caching for performance optimization.
 * 
 * Requirements: FR-6, FR-7
 */

import type { Advisor, AdvisorResponse, DomainId } from '../types/domain';
import type { LLMConfig, LLMResponse, EnvironmentConfig } from '../types/llm';
import { ErrorType, SystemError, LLMProviderError, ErrorRecoveryManager, Logger } from './errorHandling';
import { PersonaPromptService } from './personaPromptService';
import { LLMIntegrationLayer } from './llm/LLMIntegrationLayer';
import { EnhancedStaticResponseGenerator } from './enhancedStaticResponseGenerator';
import { QuestionAnalysisEngine, type QuestionAnalysis } from './questionAnalysisEngine';

export interface ResponseOrchestratorConfig {
  maxConcurrentRequests: number;
  responseTimeout: number;
  enableCaching: boolean;
  fallbackToStatic: boolean;
  retryAttempts: number;
}

export interface ResponseMetadata {
  responseType: 'llm' | 'static';
  provider?: string;
  processingTime: number;
  confidence: number;
  questionAnalysis?: QuestionAnalysis;
  frameworks?: string[];
  errorInfo?: {
    type: string;
    message: string;
    fallbackUsed: boolean;
  };
}

export interface EnhancedAdvisorResponse extends AdvisorResponse {
  metadata: ResponseMetadata;
}

export interface ResponseGenerationResult {
  responses: EnhancedAdvisorResponse[];
  totalProcessingTime: number;
  successCount: number;
  errorCount: number;
  cacheHitCount: number;
  questionAnalysis: QuestionAnalysis;
}

export class ResponseOrchestrator {
  private personaPromptService: PersonaPromptService;
  private llmIntegrationLayer: LLMIntegrationLayer;
  private staticResponseGenerator: EnhancedStaticResponseGenerator;
  private questionAnalysisEngine: QuestionAnalysisEngine;
  private errorRecoveryManager: ErrorRecoveryManager;
  private logger: Logger;
  private config: ResponseOrchestratorConfig;
  private responseCache: Map<string, { response: EnhancedAdvisorResponse; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  constructor(
    environmentConfig: EnvironmentConfig,
    config?: Partial<ResponseOrchestratorConfig>
  ) {
    this.personaPromptService = new PersonaPromptService();
    this.llmIntegrationLayer = new LLMIntegrationLayer(environmentConfig);
    this.staticResponseGenerator = new EnhancedStaticResponseGenerator();
    this.questionAnalysisEngine = new QuestionAnalysisEngine();
    this.errorRecoveryManager = new ErrorRecoveryManager();
    this.logger = new Logger('ResponseOrchestrator');
    
    this.config = {
      maxConcurrentRequests: config?.maxConcurrentRequests ?? environmentConfig.maxConcurrentRequests ?? 10,
      responseTimeout: config?.responseTimeout ?? environmentConfig.responseTimeout ?? 15000,
      enableCaching: config?.enableCaching ?? environmentConfig.enableCaching ?? true,
      fallbackToStatic: config?.fallbackToStatic ?? true,
      retryAttempts: config?.retryAttempts ?? 2
    };
  }

  /**
   * Generate responses from multiple advisors concurrently
   */
  async generateAdvisorResponses(
    question: string,
    advisors: Advisor[],
    domainId: DomainId,
    llmConfig?: Partial<LLMConfig>
  ): Promise<ResponseGenerationResult> {
    const startTime = Date.now();
    
    // Analyze the question first
    const questionAnalysis = this.questionAnalysisEngine.analyze(question);
    
    // Process advisors in batches to respect concurrency limits
    const responses: EnhancedAdvisorResponse[] = [];
    let successCount = 0;
    let errorCount = 0;
    let cacheHitCount = 0;
    
    const batches = this.createBatches(advisors, this.config.maxConcurrentRequests);
    
    for (const batch of batches) {
      const batchPromises = batch.map(advisor => 
        this.processAdvisorResponse(advisor, question, questionAnalysis, domainId, llmConfig)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          responses.push(result.value);
          successCount++;
          
          // Check if this was a cache hit (would need to track this properly)
          // For now, we'll track cache hits in the processAdvisorResponse method
        } else {
          errorCount++;
          // Create error response for failed advisor
          const errorResponse = this.createErrorResponse(
            batch[index], 
            question, 
            result.reason,
            questionAnalysis
          );
          responses.push(errorResponse);
        }
      });
    }
    
    const totalProcessingTime = Date.now() - startTime;
    
    return {
      responses,
      totalProcessingTime,
      successCount,
      errorCount,
      cacheHitCount,
      questionAnalysis
    };
  }

  /**
   * Process response for a single advisor with error handling and fallbacks
   */
  private async processAdvisorResponse(
    advisor: Advisor,
    question: string,
    questionAnalysis: QuestionAnalysis,
    domainId: DomainId,
    llmConfig?: Partial<LLMConfig>
  ): Promise<EnhancedAdvisorResponse> {
    const startTime = Date.now();
    const cacheKey = this.getCacheKey(advisor, question);
    
    // Check cache first
    if (this.config.enableCaching) {
      const cached = this.getCachedResponse(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    // Use comprehensive error recovery system
    const recoveryContext = this.errorRecoveryManager.createRecoveryContext(
      advisor,
      question,
      domainId,
      llmConfig
    );

    try {
      const recoveryResult = await this.errorRecoveryManager.executeRecovery(
        new SystemError(ErrorType.UNKNOWN_ERROR, 'Initial operation attempt'),
        recoveryContext,
        async () => {
          const llmResponse = await this.generateLLMResponse(
            advisor, 
            question, 
            questionAnalysis, 
            llmConfig
          );
          
          return this.createAdvisorResponse(
            advisor, 
            llmResponse.content, 
            questionAnalysis,
            {
              responseType: 'llm',
              provider: llmResponse.provider,
              processingTime: Date.now() - startTime,
              confidence: 0.9,
              questionAnalysis,
              frameworks: this.getRelevantFrameworks(advisor, questionAnalysis)
            }
          );
        }
      );

      if (recoveryResult.success && recoveryResult.response) {
        // Cache successful response
        if (this.config.enableCaching) {
          this.cacheResponse(cacheKey, recoveryResult.response);
        }
        
        this.logger.recordResponseTime(Date.now() - startTime);
        if (recoveryResult.fallbackUsed) {
          this.logger.recordFallbackUsage();
        }
        
        return recoveryResult.response;
      } else {
        throw recoveryResult.error || new SystemError(
          ErrorType.SERVICE_UNAVAILABLE,
          'All recovery strategies failed',
          { advisorId: advisor.id }
        );
      }
    } catch (error) {
      this.logger.error('Response generation failed completely', {
        advisorId: advisor.id,
        question: question.substring(0, 100),
        processingTime: Date.now() - startTime
      }, error instanceof SystemError ? error : undefined);
      
      throw error;
    }
    
    // Fallback to static response if enabled
    if (this.config.fallbackToStatic) {
      try {
        const staticResponse = await this.staticResponseGenerator.generateResponse(
          advisor, 
          question, 
          domainId
        );
        
        const response = this.createAdvisorResponse(
          advisor,
          staticResponse.content,
          questionAnalysis,
          {
            ...staticResponse.metadata,
            errorInfo: lastError ? {
              type: lastError instanceof LLMError ? lastError.type : 'unknown_error',
              message: lastError.message,
              fallbackUsed: true
            } : undefined
          }
        );
        
        // Cache fallback response
        if (this.config.enableCaching) {
          this.cacheResponse(cacheKey, response);
        }
        
        return response;
      } catch (staticError) {
        // If static response also fails, throw the original LLM error
        throw lastError || staticError;
      }
    }
    
    // No fallback available, throw the last error
    throw lastError || new Error('Failed to generate response');
  }

  /**
   * Generate LLM response using persona prompt
   */
  private async generateLLMResponse(
    advisor: Advisor,
    question: string,
    questionAnalysis: QuestionAnalysis,
    llmConfig?: Partial<LLMConfig>
  ): Promise<LLMResponse> {
    // Generate persona-specific prompt
    const personaPrompt = this.personaPromptService.generatePersonaPrompt(advisor, question);
    
    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new SystemError(
          ErrorType.RESPONSE_TIMEOUT,
          'Response timeout exceeded',
          { advisorId: advisor.id, timeout: this.config.responseTimeout },
          { retryable: true }
        ));
      }, this.config.responseTimeout);
    });
    
    // Race between LLM call and timeout
    const responsePromise = this.llmIntegrationLayer.generateResponse(personaPrompt, llmConfig);
    
    return Promise.race([responsePromise, timeoutPromise]);
  }

  /**
   * Create advisor response object
   */
  private createAdvisorResponse(
    advisor: Advisor,
    content: string,
    questionAnalysis: QuestionAnalysis,
    metadata: ResponseMetadata
  ): EnhancedAdvisorResponse {
    return {
      advisorId: advisor.id,
      content,
      timestamp: new Date(),
      persona: {
        name: advisor.name,
        expertise: advisor.expertise,
        background: advisor.background,
        tone: 'professional',
        specialization: advisor.specialties
      },
      metadata
    };
  }

  /**
   * Create error response for failed advisor
   */
  private createErrorResponse(
    advisor: Advisor,
    question: string,
    error: any,
    questionAnalysis: QuestionAnalysis
  ): EnhancedAdvisorResponse {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const fallbackContent = `I apologize, but I'm currently unable to provide a detailed response. Please try again later or contact support if the issue persists.`;
    
    return this.createAdvisorResponse(
      advisor,
      fallbackContent,
      questionAnalysis,
      {
        responseType: 'static',
        processingTime: 0,
        confidence: 0.1,
        questionAnalysis,
        errorInfo: {
          type: error instanceof LLMError ? error.type : 'unknown_error',
          message: errorMessage,
          fallbackUsed: true
        }
      }
    );
  }

  /**
   * Get relevant frameworks for advisor and question type
   */
  private getRelevantFrameworks(advisor: Advisor, questionAnalysis: QuestionAnalysis): string[] {
    // This would typically come from the persona library
    const domainFrameworks: Record<string, string[]> = {
      productboard: ['Jobs-to-be-Done', 'North Star Framework', 'OKRs'],
      cliniboard: ['ICH Guidelines', 'FDA Guidance', 'Clinical Development Plan'],
      eduboard: ['Bloom\'s Taxonomy', 'Backward Design', 'Learning Analytics'],
      remediboard: ['Integrative Medicine', 'Holistic Assessment', 'Natural Healing']
    };
    
    return domainFrameworks[advisor.domain] || [];
  }

  /**
   * Create batches for concurrent processing
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Generate cache key for advisor and question
   */
  private getCacheKey(advisor: Advisor, question: string): string {
    // Create a stable hash of the question for caching
    const questionHash = this.simpleHash(question);
    return `${advisor.id}:${questionHash}`;
  }

  /**
   * Simple hash function for cache keys
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get cached response if available and not expired
   */
  private getCachedResponse(cacheKey: string): EnhancedAdvisorResponse | null {
    const cached = this.responseCache.get(cacheKey);
    if (!cached) {
      return null;
    }

    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_TTL) {
      this.responseCache.delete(cacheKey);
      return null;
    }

    return cached.response;
  }

  /**
   * Cache response
   */
  private cacheResponse(cacheKey: string, response: EnhancedAdvisorResponse): void {
    this.responseCache.set(cacheKey, {
      response,
      timestamp: Date.now()
    });

    // Clean up old cache entries periodically
    if (this.responseCache.size > 100) {
      this.cleanupCache();
    }
  }

  /**
   * Clean up expired cache entries and enforce size limit
   */
  private cleanupCache(): void {
    const now = Date.now();
    
    // First, remove expired entries
    for (const [key, cached] of this.responseCache.entries()) {
      if (now - cached.timestamp > this.CACHE_TTL) {
        this.responseCache.delete(key);
      }
    }
    
    // If still over limit, remove oldest entries
    if (this.responseCache.size > 100) {
      const entries = Array.from(this.responseCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const entriesToRemove = entries.slice(0, this.responseCache.size - 100);
      entriesToRemove.forEach(([key]) => {
        this.responseCache.delete(key);
      });
    }
  }

  /**
   * Delay utility for retry backoff
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear all cached responses
   */
  public clearCache(): void {
    this.responseCache.clear();
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<ResponseOrchestratorConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  public getConfig(): ResponseOrchestratorConfig {
    return { ...this.config };
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.responseCache.size,
      hitRate: 0 // Would need to track hits/misses for accurate calculation
    };
  }

  /**
   * Health check for all integrated services
   */
  public async healthCheck(): Promise<{
    llmProviders: Record<string, boolean>;
    staticGenerator: boolean;
    questionAnalyzer: boolean;
    personaService: boolean;
  }> {
    try {
      const [llmStatus, staticTest, questionTest, personaTest] = await Promise.allSettled([
        this.llmIntegrationLayer.getProviderStatus(),
        this.staticResponseGenerator.generateResponse(
          { id: 'test', name: 'Test', expertise: 'Test', background: 'Test', domain: 'productboard', isSelected: false },
          'Test question',
          'productboard'
        ),
        this.questionAnalysisEngine.analyze('Test question'),
        this.personaPromptService.generatePersonaPrompt(
          { id: 'test', name: 'Test', expertise: 'Test', background: 'Test', domain: 'productboard', isSelected: false },
          'Test question'
        )
      ]);

      return {
        llmProviders: llmStatus.status === 'fulfilled' ? llmStatus.value : {},
        staticGenerator: staticTest.status === 'fulfilled',
        questionAnalyzer: questionTest.status === 'fulfilled',
        personaService: personaTest.status === 'fulfilled'
      };
    } catch (error) {
      return {
        llmProviders: {},
        staticGenerator: false,
        questionAnalyzer: false,
        personaService: false
      };
    }
  }
}