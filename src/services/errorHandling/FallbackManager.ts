/**
 * Fallback Manager
 * Manages fallback mechanisms for API failures, network issues, and rate limiting
 * 
 * Requirements: FR-6
 */

import type { Advisor, AdvisorResponse, DomainId } from '../../types/domain';
import type { LLMConfig, LLMResponse } from '../../types/llm';
import { ErrorType, SystemError, LLMProviderError, FallbackStrategy } from './ErrorTypes';
import { ErrorHandlingStrategies } from './ErrorHandlingStrategies';
import { EnhancedStaticResponseGenerator } from '../enhancedStaticResponseGenerator';
import { Logger } from './Logger';

export interface FallbackResult {
  success: boolean;
  response?: AdvisorResponse;
  fallbackType: 'static_response' | 'cached_response' | 'simplified_response' | 'none';
  processingTime: number;
  error?: SystemError;
}

export interface CachedResponse {
  response: AdvisorResponse;
  timestamp: number;
  expiresAt: number;
  quality: 'high' | 'medium' | 'low';
}

export class FallbackManager {
  private staticResponseGenerator: EnhancedStaticResponseGenerator;
  private responseCache: Map<string, CachedResponse> = new Map();
  private logger: Logger;
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes
  private readonly EMERGENCY_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours for emergency fallbacks

  constructor() {
    this.staticResponseGenerator = new EnhancedStaticResponseGenerator();
    this.logger = new Logger('FallbackManager');
  }

  /**
   * Execute fallback strategy for a failed operation
   */
  async executeFallback(
    error: SystemError,
    advisor: Advisor,
    question: string,
    domainId: DomainId,
    originalConfig?: Partial<LLMConfig>
  ): Promise<FallbackResult> {
    const startTime = Date.now();
    const strategy = ErrorHandlingStrategies.getFallbackStrategy(error.type);

    if (!strategy?.enabled) {
      return {
        success: false,
        fallbackType: 'none',
        processingTime: Date.now() - startTime,
        error
      };
    }

    this.logger.info(`Executing fallback strategy: ${strategy.fallbackType}`, {
      errorType: error.type,
      advisorId: advisor.id,
      fallbackType: strategy.fallbackType
    });

    try {
      switch (strategy.fallbackType) {
        case 'cached_response':
          return await this.tryCache(advisor, question, startTime);
        
        case 'static_response':
          return await this.tryStaticResponse(advisor, question, domainId, startTime, error);
        
        case 'simplified_response':
          return await this.trySimplifiedResponse(advisor, question, domainId, startTime, error);
        
        default:
          throw new SystemError(
            ErrorType.CONFIGURATION_ERROR,
            `Unknown fallback type: ${strategy.fallbackType}`,
            { advisorId: advisor.id }
          );
      }
    } catch (fallbackError) {
      this.logger.error('Fallback execution failed', {
        originalError: error.type,
        fallbackError: fallbackError instanceof Error ? fallbackError.message : 'Unknown error',
        advisorId: advisor.id
      });

      return {
        success: false,
        fallbackType: strategy.fallbackType,
        processingTime: Date.now() - startTime,
        error: fallbackError instanceof SystemError ? fallbackError : new SystemError(
          ErrorType.SERVICE_UNAVAILABLE,
          'All fallback mechanisms failed',
          { advisorId: advisor.id },
          { cause: fallbackError instanceof Error ? fallbackError : undefined }
        )
      };
    }
  }

  /**
   * Try to get response from cache
   */
  private async tryCache(
    advisor: Advisor,
    question: string,
    startTime: number
  ): Promise<FallbackResult> {
    const cacheKey = this.generateCacheKey(advisor, question);
    const cached = this.responseCache.get(cacheKey);

    if (cached && Date.now() < cached.expiresAt) {
      this.logger.info('Cache hit for fallback', {
        advisorId: advisor.id,
        quality: cached.quality
      });

      return {
        success: true,
        response: {
          ...cached.response,
          timestamp: new Date(), // Update timestamp for freshness
          metadata: {
            ...cached.response.metadata,
            responseType: 'static',
            processingTime: Date.now() - startTime,
            confidence: cached.quality === 'high' ? 0.8 : cached.quality === 'medium' ? 0.6 : 0.4,
            errorInfo: {
              type: 'cache_fallback',
              message: 'Using cached response due to service unavailability',
              fallbackUsed: true
            }
          }
        },
        fallbackType: 'cached_response',
        processingTime: Date.now() - startTime
      };
    }

    // No valid cache entry found
    throw new SystemError(
      ErrorType.CACHE_ERROR,
      'No valid cached response available',
      { advisorId: advisor.id }
    );
  }

  /**
   * Generate static response as fallback
   */
  private async tryStaticResponse(
    advisor: Advisor,
    question: string,
    domainId: DomainId,
    startTime: number,
    originalError: SystemError
  ): Promise<FallbackResult> {
    try {
      const staticResponse = await this.staticResponseGenerator.generateResponse(
        advisor,
        question,
        domainId
      );

      // Cache the static response for future fallbacks
      this.cacheResponse(advisor, question, staticResponse, 'medium');

      const response: AdvisorResponse = {
        ...staticResponse,
        metadata: {
          ...staticResponse.metadata,
          processingTime: Date.now() - startTime,
          errorInfo: {
            type: originalError.type,
            message: 'Using enhanced static response due to service issue',
            fallbackUsed: true
          }
        }
      };

      this.logger.info('Static response fallback successful', {
        advisorId: advisor.id,
        processingTime: Date.now() - startTime
      });

      return {
        success: true,
        response,
        fallbackType: 'static_response',
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      throw new SystemError(
        ErrorType.SERVICE_UNAVAILABLE,
        'Static response generation failed',
        { advisorId: advisor.id },
        { cause: error instanceof Error ? error : undefined }
      );
    }
  }

  /**
   * Generate simplified response as last resort
   */
  private async trySimplifiedResponse(
    advisor: Advisor,
    question: string,
    domainId: DomainId,
    startTime: number,
    originalError: SystemError
  ): Promise<FallbackResult> {
    // Create a very basic response when all else fails
    const simplifiedContent = this.generateEmergencyResponse(advisor, question);

    const response: AdvisorResponse = {
      advisorId: advisor.id,
      content: simplifiedContent,
      timestamp: new Date(),
      persona: {
        name: advisor.name,
        expertise: advisor.expertise,
        background: advisor.background,
        tone: 'professional',
        specialization: advisor.specialties || []
      },
      metadata: {
        responseType: 'static',
        processingTime: Date.now() - startTime,
        confidence: 0.3,
        errorInfo: {
          type: originalError.type,
          message: 'Using emergency response due to system unavailability',
          fallbackUsed: true
        }
      }
    };

    // Cache emergency response for extended period
    this.cacheResponse(advisor, question, response, 'low', this.EMERGENCY_CACHE_TTL);

    this.logger.warn('Emergency simplified response generated', {
      advisorId: advisor.id,
      originalError: originalError.type
    });

    return {
      success: true,
      response,
      fallbackType: 'simplified_response',
      processingTime: Date.now() - startTime
    };
  }

  /**
   * Generate emergency response content
   */
  private generateEmergencyResponse(advisor: Advisor, question: string): string {
    const templates = {
      productboard: `Thank you for your product-related question. As a ${advisor.name}, I understand you're looking for insights about product strategy and development. While our advanced AI system is temporarily unavailable, I recommend focusing on user needs, market validation, and iterative development approaches. Please try again shortly for more detailed guidance.`,
      
      cliniboard: `Thank you for your clinical research question. As a ${advisor.name}, I recognize the importance of rigorous clinical processes and regulatory compliance. While our detailed analysis system is temporarily unavailable, I recommend consulting current clinical guidelines and regulatory frameworks. Please try again shortly for comprehensive clinical insights.`,
      
      eduboard: `Thank you for your educational question. As a ${advisor.name}, I understand the importance of effective learning design and educational outcomes. While our advanced analysis is temporarily unavailable, I recommend focusing on learner-centered approaches and evidence-based educational practices. Please try again shortly for detailed educational guidance.`,
      
      remediboard: `Thank you for your wellness question. As a ${advisor.name}, I appreciate your interest in holistic health approaches. While our comprehensive analysis system is temporarily unavailable, I recommend consulting with qualified healthcare practitioners and considering integrative approaches to wellness. Please try again shortly for detailed guidance.`
    };

    return templates[advisor.domain as keyof typeof templates] || 
           `Thank you for your question. As ${advisor.name}, I'm here to help with ${advisor.expertise}. While our advanced response system is temporarily unavailable, please try again shortly for detailed insights. In the meantime, consider consulting relevant professional resources in this area.`;
  }

  /**
   * Cache response for future fallback use
   */
  private cacheResponse(
    advisor: Advisor,
    question: string,
    response: AdvisorResponse,
    quality: 'high' | 'medium' | 'low',
    customTTL?: number
  ): void {
    const cacheKey = this.generateCacheKey(advisor, question);
    const ttl = customTTL || this.CACHE_TTL;
    
    const cachedResponse: CachedResponse = {
      response,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
      quality
    };

    this.responseCache.set(cacheKey, cachedResponse);

    // Clean up old cache entries periodically
    if (this.responseCache.size > 1000) {
      this.cleanupCache();
    }
  }

  /**
   * Generate cache key for advisor and question
   */
  private generateCacheKey(advisor: Advisor, question: string): string {
    const questionHash = this.simpleHash(question);
    return `fallback:${advisor.id}:${questionHash}`;
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
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, cached] of this.responseCache.entries()) {
      if (now > cached.expiresAt) {
        this.responseCache.delete(key);
        removedCount++;
      }
    }

    // If still too many entries, remove oldest ones
    if (this.responseCache.size > 1000) {
      const entries = Array.from(this.responseCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const entriesToRemove = entries.slice(0, this.responseCache.size - 800);
      entriesToRemove.forEach(([key]) => {
        this.responseCache.delete(key);
        removedCount++;
      });
    }

    if (removedCount > 0) {
      this.logger.debug(`Cleaned up ${removedCount} expired cache entries`);
    }
  }

  /**
   * Preload cache with high-quality responses
   */
  async preloadCache(
    advisor: Advisor,
    commonQuestions: string[],
    domainId: DomainId
  ): Promise<void> {
    this.logger.info(`Preloading cache for advisor ${advisor.id}`, {
      questionCount: commonQuestions.length
    });

    const preloadPromises = commonQuestions.map(async (question) => {
      try {
        const response = await this.staticResponseGenerator.generateResponse(
          advisor,
          question,
          domainId
        );
        this.cacheResponse(advisor, question, response, 'high');
      } catch (error) {
        this.logger.warn(`Failed to preload cache for question`, {
          advisorId: advisor.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    await Promise.allSettled(preloadPromises);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    highQuality: number;
    mediumQuality: number;
    lowQuality: number;
    expired: number;
  } {
    const now = Date.now();
    let highQuality = 0;
    let mediumQuality = 0;
    let lowQuality = 0;
    let expired = 0;

    for (const cached of this.responseCache.values()) {
      if (now > cached.expiresAt) {
        expired++;
      } else {
        switch (cached.quality) {
          case 'high': highQuality++; break;
          case 'medium': mediumQuality++; break;
          case 'low': lowQuality++; break;
        }
      }
    }

    return {
      size: this.responseCache.size,
      highQuality,
      mediumQuality,
      lowQuality,
      expired
    };
  }

  /**
   * Clear all cached responses
   */
  clearCache(): void {
    this.responseCache.clear();
    this.logger.info('Fallback cache cleared');
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const sizeBefore = this.responseCache.size;
    this.cleanupCache();
    const sizeAfter = this.responseCache.size;
    
    this.logger.info(`Cleared ${sizeBefore - sizeAfter} expired cache entries`);
  }
}