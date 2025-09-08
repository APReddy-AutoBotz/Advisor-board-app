/**
 * Integration Tests for End-to-End Response Generation
 * 
 * Comprehensive test suite covering:
 * - Complete response generation pipeline
 * - Multi-advisor concurrent processing
 * - Real-world scenario testing
 * - Cross-component integration validation
 */

import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { ResponseOrchestrator } from '../../../services/responseOrchestrator';
import { PersonaPromptService } from '../../../services/personaPromptService';
import { LLMIntegrationLayer } from '../../../services/llm/LLMIntegrationLayer';
import { EnhancedStaticResponseGenerator } from '../../../services/enhancedStaticResponseGenerator';
import { QuestionAnalysisEngine } from '../../../services/questionAnalysisEngine';
import type { Advisor, DomainId } from '../../../types/domain';
import type { EnvironmentConfig, LLMResponse } from '../../../types/llm';
import type { AdvisorResponse } from '../../../types/session';

// Mock fetch globally
global.fetch = vi.fn();

describe('End-to-End Response Generation - Integration Tests', () => {
  let orchestrator: ResponseOrchestrator;
  let mockFetch: Mock;
  
  const mockEnvironmentConfig: EnvironmentConfig = {
    llmProviders: {
      openai: {
        apiKey: 'sk-test-key-123',
        model: 'gpt-4',
        baseURL: 'https://api.openai.com/v1'
      },
      anthropic: {
        apiKey: 'sk-ant-test-key-123',
        model: 'claude-3-sonnet-20240229',
        baseURL: 'https://api.anthropic.com'
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

  const mockAdvisors: Advisor[] = [
    {
      id: 'sarah-kim',
      name: 'Sarah Kim',
      expertise: 'Product Strategy',
      background: 'Former CPO at Stripe, scaled from startup to $95B valuation',
      domain: 'productboard',
      isSelected: true,
      specialties: ['Product Strategy', '0-to-1 Products', 'Platform Scaling']
    },
    {
      id: 'marcus-chen',
      name: 'Marcus Chen',
      expertise: 'User Research',
      background: 'Former Google PM, led products with 100M+ users',
      domain: 'productboard',
      isSelected: true,
      specialties: ['User Research', 'Product Analytics', 'Growth Strategy']
    },
    {
      id: 'sarah-chen',
      name: 'Dr. Sarah Chen',
      expertise: 'Clinical Research Strategy',
      background: 'Former Pfizer VP who led 50+ Phase III trials to FDA approval',
      domain: 'cliniboard',
      isSelected: true,
      specialties: ['Phase III Trials', 'FDA Interactions', 'Global Regulatory Strategy']
    },
    {
      id: 'michael-rodriguez',
      name: 'Dr. Michael Rodriguez',
      expertise: 'Regulatory Affairs',
      background: 'Former FDA CDER Director, 20+ years regulatory experience',
      domain: 'cliniboard',
      isSelected: true,
      specialties: ['FDA Submissions', 'Regulatory Strategy', 'Drug Development']
    }
  ];

  const realWorldScenarios = {
    productStrategy: {
      question: 'I\'m building a B2B SaaS platform for healthcare providers. We have 50 pilot customers but are struggling to achieve product-market fit. Our churn rate is 15% monthly and customer acquisition cost is $2,500. How do I identify the core value proposition and scale effectively?',
      domain: 'productboard' as DomainId,
      expectedAdvisors: ['sarah-kim', 'marcus-chen'],
      expectedKeywords: ['product-market fit', 'churn', 'CAC', 'B2B SaaS', 'healthcare'],
      expectedFrameworks: ['Jobs-to-be-Done', 'North Star Framework', 'Product-Market Fit Canvas']
    },

    clinicalTrial: {
      question: 'We\'re developing a novel oncology drug that showed promising Phase II results. We need to design a Phase III trial for FDA approval. The drug targets a rare cancer with only 5,000 new cases annually in the US. What are the key considerations for trial design, regulatory strategy, and approval pathway?',
      domain: 'cliniboard' as DomainId,
      expectedAdvisors: ['sarah-chen', 'michael-rodriguez'],
      expectedKeywords: ['Phase III', 'oncology', 'FDA approval', 'rare cancer', 'regulatory'],
      expectedFrameworks: ['ICH Guidelines', 'FDA Submission Guidelines', 'Good Clinical Practice']
    },

    crossDomain: {
      question: 'I\'m launching a digital health platform that combines AI-powered clinical decision support with patient engagement tools. I need guidance on product strategy, regulatory compliance, and clinical validation. How do I navigate the complex healthcare landscape while building a scalable product?',
      domain: 'productboard' as DomainId,
      expectedAdvisors: ['sarah-kim', 'marcus-chen', 'sarah-chen', 'michael-rodriguez'],
      expectedKeywords: ['digital health', 'AI', 'clinical decision support', 'regulatory compliance', 'scalable'],
      expectedFrameworks: ['Jobs-to-be-Done', 'ICH Guidelines', 'FDA Software Guidelines']
    },

    technicalScaling: {
      question: 'Our healthcare platform is experiencing rapid growth (300% YoY) but our technical infrastructure is struggling. We\'re seeing 99.5% uptime but need 99.99% for healthcare compliance. Database queries are slow, and we\'re hitting API rate limits. What\'s the best approach to scale our architecture while maintaining HIPAA compliance?',
      domain: 'productboard' as DomainId,
      expectedAdvisors: ['alex-thompson', 'ryan-martinez'],
      expectedKeywords: ['technical scaling', 'uptime', 'HIPAA', 'database', 'API'],
      expectedFrameworks: ['Microservices Architecture', 'DevOps Best Practices']
    }
  };

  const mockLLMResponses = {
    'sarah-kim': {
      content: `Based on my experience scaling Stripe from startup to $95B valuation, your B2B SaaS platform faces classic product-market fit challenges. Here's my strategic approach:

**Strategic Analysis:**
Your 15% monthly churn and $2,500 CAC indicate misalignment between product value and customer needs. At Stripe, we faced similar challenges early on.

**Framework Application:**
Using the Jobs-to-be-Done framework, focus on understanding what healthcare providers are truly "hiring" your platform to do. The high churn suggests you're solving a "nice-to-have" rather than a "must-have" problem.

**Implementation Roadmap:**
1. Conduct deep customer interviews with your 50 pilot customers
2. Identify the 20% who are most engaged and understand why
3. Build your core value proposition around their primary job-to-be-done
4. Implement cohort-based retention analysis

**Risk Mitigation:**
Healthcare sales cycles are long. Focus on reducing time-to-value and demonstrating ROI within 30 days of implementation.`,
      model: 'gpt-4',
      provider: 'openai',
      timestamp: new Date(),
      usage: { promptTokens: 200, completionTokens: 400, totalTokens: 600 }
    },

    'marcus-chen': {
      content: `From my experience leading products with 100M+ users at Google, your metrics reveal critical user research gaps. Here's my data-driven approach:

**User Research Strategy:**
Your 15% churn rate is concerning but actionable. At Google, we learned that understanding user behavior patterns is crucial for retention.

**Analytics Framework:**
Implement cohort analysis to understand when and why users churn. Focus on:
- Time-to-first-value metrics
- Feature adoption rates
- User engagement patterns

**Research Methodology:**
1. Conduct exit interviews with churned customers
2. Analyze usage data for successful vs. churning accounts
3. Implement in-app feedback loops
4. Create user journey maps for different personas

**Growth Strategy:**
Reduce CAC by improving product-led growth. Focus on viral coefficients and referral programs within healthcare networks.`,
      model: 'gpt-4',
      provider: 'openai',
      timestamp: new Date(),
      usage: { promptTokens: 180, completionTokens: 350, totalTokens: 530 }
    },

    'sarah-chen': {
      content: `Having led 50+ Phase III trials at Pfizer, rare oncology trials require specialized approaches. Here's my regulatory strategy:

**Clinical Trial Design:**
For rare cancers with 5,000 annual cases, consider:
- Multi-center international collaboration
- Adaptive trial designs to optimize enrollment
- Real-world evidence integration
- Patient-reported outcome measures

**Regulatory Pathway:**
Given the rare disease indication, explore:
- FDA Orphan Drug Designation
- Breakthrough Therapy Designation
- Accelerated Approval pathway
- Priority Review voucher potential

**Implementation Strategy:**
1. Pre-IND meeting with FDA to align on trial design
2. Establish patient advocacy partnerships
3. Develop companion diagnostic strategy
4. Plan for post-market surveillance requirements

**Risk Management:**
Rare disease trials face unique challenges. Prepare for slower enrollment and consider basket trial designs.`,
      model: 'claude-3-sonnet-20240229',
      provider: 'anthropic',
      timestamp: new Date(),
      usage: { promptTokens: 220, completionTokens: 380, totalTokens: 600 }
    },

    'michael-rodriguez': {
      content: `As former FDA CDER Director, I understand the regulatory complexities of rare oncology drugs. Here's my regulatory affairs perspective:

**FDA Strategy:**
For rare oncology indications, leverage regulatory incentives:
- Orphan Drug Designation provides 7-year market exclusivity
- Fast Track designation for unmet medical needs
- Rolling review to expedite approval process

**Submission Planning:**
1. Early engagement through Type B meetings
2. Comprehensive CMC development strategy
3. Risk Evaluation and Mitigation Strategy (REMS) planning
4. Post-market study commitments

**Global Regulatory Considerations:**
- EMA PRIME designation for parallel EU approval
- Health Canada Notice of Compliance with Conditions
- Japanese PMDA consultation for global development

**Compliance Framework:**
Ensure GCP compliance across all sites and implement robust pharmacovigilance systems from trial initiation.`,
      model: 'claude-3-sonnet-20240229',
      provider: 'anthropic',
      timestamp: new Date(),
      usage: { promptTokens: 200, completionTokens: 360, totalTokens: 560 }
    }
  };

  beforeEach(() => {
    mockFetch = vi.mocked(global.fetch);
    mockFetch.mockClear();
    
    orchestrator = new ResponseOrchestrator(mockEnvironmentConfig);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Response Generation Pipeline', () => {
    it('should generate comprehensive responses for product strategy scenario', async () => {
      const scenario = realWorldScenarios.productStrategy;
      
      // Mock successful LLM responses
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            choices: [{ message: { content: mockLLMResponses['sarah-kim'].content } }],
            usage: mockLLMResponses['sarah-kim'].usage,
            model: 'gpt-4'
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            choices: [{ message: { content: mockLLMResponses['marcus-chen'].content } }],
            usage: mockLLMResponses['marcus-chen'].usage,
            model: 'gpt-4'
          })
        });

      const advisors = mockAdvisors.filter(a => scenario.expectedAdvisors.includes(a.id));
      const result = await orchestrator.generateAdvisorResponses(
        scenario.question,
        advisors,
        scenario.domain
      );

      // Validate response structure
      expect(result.responses).toHaveLength(2);
      expect(result.successCount).toBe(2);
      expect(result.errorCount).toBe(0);
      expect(result.questionAnalysis).toBeDefined();

      // Validate question analysis
      expect(result.questionAnalysis.type).toBe('strategy');
      expect(result.questionAnalysis.domain).toBe('productboard');
      expect(result.questionAnalysis.confidence).toBeGreaterThan(0.7);

      // Validate individual responses
      const sarahResponse = result.responses.find(r => r.advisorId === 'sarah-kim');
      const marcusResponse = result.responses.find(r => r.advisorId === 'marcus-chen');

      expect(sarahResponse).toBeDefined();
      expect(sarahResponse!.content).toContain('Stripe');
      expect(sarahResponse!.content).toContain('product-market fit');
      expect(sarahResponse!.metadata.responseType).toBe('llm');
      expect(sarahResponse!.metadata.frameworks).toContain('Jobs-to-be-Done');

      expect(marcusResponse).toBeDefined();
      expect(marcusResponse!.content).toContain('Google');
      expect(marcusResponse!.content).toContain('cohort analysis');
      expect(marcusResponse!.metadata.responseType).toBe('llm');

      // Validate performance metrics
      expect(result.processingTime).toBeLessThan(10000); // Should complete within 10 seconds
      expect(result.metadata.concurrentProcessing).toBe(true);
    });

    it('should handle clinical trial scenario with domain expertise', async () => {
      const scenario = realWorldScenarios.clinicalTrial;
      
      // Mock successful LLM responses for clinical advisors
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            content: [{ type: 'text', text: mockLLMResponses['sarah-chen'].content }],
            usage: { input_tokens: 220, output_tokens: 380 },
            model: 'claude-3-sonnet-20240229'
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            content: [{ type: 'text', text: mockLLMResponses['michael-rodriguez'].content }],
            usage: { input_tokens: 200, output_tokens: 360 },
            model: 'claude-3-sonnet-20240229'
          })
        });

      const advisors = mockAdvisors.filter(a => scenario.expectedAdvisors.includes(a.id));
      const result = await orchestrator.generateAdvisorResponses(
        scenario.question,
        advisors,
        scenario.domain
      );

      // Validate clinical-specific responses
      expect(result.responses).toHaveLength(2);
      expect(result.successCount).toBe(2);

      const clinicalResponse = result.responses.find(r => r.advisorId === 'sarah-chen');
      const regulatoryResponse = result.responses.find(r => r.advisorId === 'michael-rodriguez');

      expect(clinicalResponse!.content).toContain('Phase III');
      expect(clinicalResponse!.content).toContain('FDA');
      expect(clinicalResponse!.content).toContain('rare disease');
      expect(clinicalResponse!.metadata.frameworks).toContain('ICH Guidelines');

      expect(regulatoryResponse!.content).toContain('Orphan Drug Designation');
      expect(regulatoryResponse!.content).toContain('CDER');
      expect(regulatoryResponse!.metadata.frameworks).toContain('FDA Submission Guidelines');

      // Validate domain-specific question analysis
      expect(result.questionAnalysis.keywords).toEqual(
        expect.arrayContaining(['Phase III', 'FDA', 'oncology', 'regulatory'])
      );
    });

    it('should handle cross-domain scenarios with multiple advisor types', async () => {
      const scenario = realWorldScenarios.crossDomain;
      
      // Mock responses for all advisor types
      mockFetch
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({
            choices: [{ message: { content: 'Cross-domain response content...' } }],
            usage: { prompt_tokens: 200, completion_tokens: 300, total_tokens: 500 },
            model: 'gpt-4'
          })
        });

      const result = await orchestrator.generateAdvisorResponses(
        scenario.question,
        mockAdvisors, // All advisors for cross-domain
        scenario.domain
      );

      expect(result.responses).toHaveLength(4);
      expect(result.successCount).toBe(4);

      // Should have both product and clinical perspectives
      const productAdvisors = result.responses.filter(r => 
        ['sarah-kim', 'marcus-chen'].includes(r.advisorId)
      );
      const clinicalAdvisors = result.responses.filter(r => 
        ['sarah-chen', 'michael-rodriguez'].includes(r.advisorId)
      );

      expect(productAdvisors).toHaveLength(2);
      expect(clinicalAdvisors).toHaveLength(2);

      // Validate cross-domain keyword analysis
      expect(result.questionAnalysis.keywords).toEqual(
        expect.arrayContaining(['digital health', 'AI', 'regulatory', 'scalable'])
      );
    });
  });

  describe('Concurrent Processing and Performance', () => {
    it('should process multiple advisors concurrently within performance budget', async () => {
      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({
            choices: [{ message: { content: 'Concurrent response...' } }],
            usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 }
          })
        }), 1000)) // 1 second delay per request
      );

      const startTime = Date.now();
      const result = await orchestrator.generateAdvisorResponses(
        'Test concurrent processing',
        mockAdvisors,
        'productboard'
      );
      const endTime = Date.now();

      const processingTime = endTime - startTime;

      // Should process concurrently, not sequentially
      // 4 advisors with 1s delay each should take ~2s (with concurrency limit of 5), not 4s
      expect(processingTime).toBeLessThan(3000);
      expect(processingTime).toBeGreaterThan(1000);

      expect(result.responses).toHaveLength(4);
      expect(result.successCount).toBe(4);
      expect(result.metadata.concurrentProcessing).toBe(true);
    });

    it('should respect concurrent request limits', async () => {
      const limitedConfig = {
        ...mockEnvironmentConfig,
        maxConcurrentRequests: 2
      };

      const limitedOrchestrator = new ResponseOrchestrator(limitedConfig);

      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({
            choices: [{ message: { content: 'Limited concurrent response...' } }],
            usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 }
          })
        }), 500))
      );

      const startTime = Date.now();
      const result = await limitedOrchestrator.generateAdvisorResponses(
        'Test limited concurrency',
        mockAdvisors,
        'productboard'
      );
      const endTime = Date.now();

      const processingTime = endTime - startTime;

      // With limit of 2 and 4 advisors, should take ~1s (2 batches of 500ms each)
      expect(processingTime).toBeGreaterThan(1000);
      expect(processingTime).toBeLessThan(2000);

      expect(result.responses).toHaveLength(4);
      expect(result.successCount).toBe(4);
    });

    it('should handle large numbers of advisors efficiently', async () => {
      const manyAdvisors = Array.from({ length: 20 }, (_, i) => ({
        ...mockAdvisors[0],
        id: `advisor-${i}`,
        name: `Advisor ${i}`
      }));

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Bulk response...' } }],
          usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 }
        })
      });

      const startTime = Date.now();
      const result = await orchestrator.generateAdvisorResponses(
        'Test bulk processing',
        manyAdvisors,
        'productboard'
      );
      const endTime = Date.now();

      expect(result.responses).toHaveLength(20);
      expect(result.successCount).toBe(20);
      expect(endTime - startTime).toBeLessThan(15000); // Should complete within 15 seconds
    });
  });

  describe('Error Handling and Fallback Mechanisms', () => {
    it('should gracefully handle mixed success and failure scenarios', async () => {
      // First advisor succeeds, second fails, third succeeds, fourth fails
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            choices: [{ message: { content: 'Success response 1' } }],
            usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 }
          })
        })
        .mockRejectedValueOnce(new Error('API failure'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            choices: [{ message: { content: 'Success response 2' } }],
            usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 }
          })
        })
        .mockRejectedValueOnce(new Error('API failure'));

      const result = await orchestrator.generateAdvisorResponses(
        'Test mixed scenarios',
        mockAdvisors,
        'productboard'
      );

      expect(result.responses).toHaveLength(4);
      expect(result.successCount).toBe(4); // All should have responses (LLM or static fallback)

      // Check response types
      const llmResponses = result.responses.filter(r => r.metadata.responseType === 'llm');
      const staticResponses = result.responses.filter(r => r.metadata.responseType === 'static');

      expect(llmResponses).toHaveLength(2);
      expect(staticResponses).toHaveLength(2);

      // Static responses should indicate fallback was used
      staticResponses.forEach(response => {
        expect(response.metadata.errorInfo?.fallbackUsed).toBe(true);
        expect(response.content).toContain('Strategic Approach');
      });
    });

    it('should handle complete API failures with static fallbacks', async () => {
      mockFetch.mockRejectedValue(new Error('All APIs down'));

      const result = await orchestrator.generateAdvisorResponses(
        realWorldScenarios.productStrategy.question,
        mockAdvisors.slice(0, 2),
        'productboard'
      );

      expect(result.responses).toHaveLength(2);
      expect(result.successCount).toBe(2);
      expect(result.errorCount).toBe(0); // No errors because fallbacks worked

      // All responses should be static
      result.responses.forEach(response => {
        expect(response.metadata.responseType).toBe('static');
        expect(response.metadata.errorInfo?.fallbackUsed).toBe(true);
        expect(response.content).toContain('Strategic Approach');
        expect(response.content.length).toBeGreaterThan(200);
      });
    });

    it('should handle timeout scenarios gracefully', async () => {
      const timeoutConfig = {
        ...mockEnvironmentConfig,
        responseTimeout: 1000 // Very short timeout
      };

      const timeoutOrchestrator = new ResponseOrchestrator(timeoutConfig);

      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({
            choices: [{ message: { content: 'Delayed response' } }]
          })
        }), 2000)) // Longer than timeout
      );

      const result = await timeoutOrchestrator.generateAdvisorResponses(
        'Test timeout handling',
        [mockAdvisors[0]],
        'productboard'
      );

      expect(result.responses).toHaveLength(1);
      expect(result.responses[0].metadata.responseType).toBe('static');
      expect(result.responses[0].metadata.errorInfo?.type).toBe('network_error');
    });

    it('should provide meaningful error information', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        json: () => Promise.resolve({
          error: { message: 'Rate limit exceeded', type: 'rate_limit_error' }
        })
      });

      const result = await orchestrator.generateAdvisorResponses(
        'Test error information',
        [mockAdvisors[0]],
        'productboard'
      );

      expect(result.responses).toHaveLength(1);
      expect(result.responses[0].metadata.errorInfo).toBeDefined();
      expect(result.responses[0].metadata.errorInfo?.type).toBe('rate_limit_error');
      expect(result.responses[0].metadata.errorInfo?.fallbackUsed).toBe(true);
    });
  });

  describe('Response Quality and Consistency', () => {
    it('should maintain persona consistency across different question types', async () => {
      const questions = [
        'How do I achieve product-market fit?',
        'What is the best pricing strategy?',
        'How should I scale my team?',
        'What metrics should I track?'
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: mockLLMResponses['sarah-kim'].content } }],
          usage: { prompt_tokens: 200, completion_tokens: 400, total_tokens: 600 }
        })
      });

      const results = await Promise.all(
        questions.map(question => 
          orchestrator.generateAdvisorResponses(
            question,
            [mockAdvisors[0]], // Sarah Kim
            'productboard'
          )
        )
      );

      results.forEach(result => {
        expect(result.responses).toHaveLength(1);
        const response = result.responses[0];
        
        // Should maintain Sarah Kim's persona
        expect(response.persona.name).toBe('Sarah Kim');
        expect(response.content).toContain('Stripe');
        expect(response.metadata.frameworks).toContain('Jobs-to-be-Done');
      });
    });

    it('should provide domain-appropriate frameworks and insights', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Domain-specific response...' } }],
          usage: { prompt_tokens: 150, completion_tokens: 300, total_tokens: 450 }
        })
      });

      // Test product domain
      const productResult = await orchestrator.generateAdvisorResponses(
        'Product strategy question',
        [mockAdvisors[0]],
        'productboard'
      );

      expect(productResult.responses[0].metadata.frameworks).toEqual(
        expect.arrayContaining(['Jobs-to-be-Done', 'North Star Framework'])
      );

      // Test clinical domain
      const clinicalResult = await orchestrator.generateAdvisorResponses(
        'Clinical trial question',
        [mockAdvisors[2]],
        'cliniboard'
      );

      expect(clinicalResult.responses[0].metadata.frameworks).toEqual(
        expect.arrayContaining(['ICH Guidelines', 'Good Clinical Practice'])
      );
    });

    it('should generate responses of appropriate length and depth', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: mockLLMResponses['sarah-kim'].content } }],
          usage: { prompt_tokens: 200, completion_tokens: 400, total_tokens: 600 }
        })
      });

      const result = await orchestrator.generateAdvisorResponses(
        realWorldScenarios.productStrategy.question,
        [mockAdvisors[0]],
        'productboard'
      );

      const response = result.responses[0];

      // Should be comprehensive but not excessive
      expect(response.content.length).toBeGreaterThan(500);
      expect(response.content.length).toBeLessThan(3000);

      // Should have structured sections
      expect(response.content).toMatch(/Strategic|Framework|Implementation|Risk/i);

      // Should include actionable insights
      expect(response.content).toMatch(/\d+\./); // Numbered lists
      expect(response.content).toContain('focus on');
    });
  });

  describe('Caching and Performance Optimization', () => {
    it('should cache responses for identical questions', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Cached response test' } }],
          usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 }
        })
      });

      const question = 'Identical question for caching test';
      const advisor = [mockAdvisors[0]];

      // First call
      await orchestrator.generateAdvisorResponses(question, advisor, 'productboard');
      
      // Second call should use cache
      await orchestrator.generateAdvisorResponses(question, advisor, 'productboard');

      // Should only make one API call due to caching
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should provide cache statistics', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Cache stats test' } }],
          usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 }
        })
      });

      // Generate some cached responses
      await orchestrator.generateAdvisorResponses('Question 1', [mockAdvisors[0]], 'productboard');
      await orchestrator.generateAdvisorResponses('Question 2', [mockAdvisors[1]], 'productboard');
      await orchestrator.generateAdvisorResponses('Question 1', [mockAdvisors[0]], 'productboard'); // Cache hit

      const stats = orchestrator.getCacheStats();

      expect(stats.size).toBeGreaterThan(0);
      expect(stats.hitRate).toBeGreaterThan(0);
      expect(typeof stats.hitRate).toBe('number');
    });
  });

  describe('Health Monitoring and Diagnostics', () => {
    it('should provide comprehensive health check information', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Health check response' } }]
        })
      });

      const health = await orchestrator.healthCheck();

      expect(health).toHaveProperty('llmProviders');
      expect(health).toHaveProperty('staticGenerator');
      expect(health).toHaveProperty('questionAnalyzer');
      expect(health).toHaveProperty('personaService');
      expect(health).toHaveProperty('cacheStatus');

      expect(typeof health.llmProviders).toBe('object');
      expect(typeof health.staticGenerator).toBe('boolean');
      expect(typeof health.questionAnalyzer).toBe('boolean');
      expect(typeof health.personaService).toBe('boolean');
    });

    it('should track processing metrics', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Metrics test response' } }],
          usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 }
        })
      });

      const result = await orchestrator.generateAdvisorResponses(
        'Metrics tracking test',
        mockAdvisors.slice(0, 2),
        'productboard'
      );

      expect(result.processingTime).toBeDefined();
      expect(result.processingTime).toBeGreaterThan(0);
      expect(result.metadata.concurrentProcessing).toBe(true);
      expect(result.metadata.cacheHits).toBeDefined();
      expect(result.metadata.totalTokensUsed).toBeGreaterThan(0);
    });
  });
});