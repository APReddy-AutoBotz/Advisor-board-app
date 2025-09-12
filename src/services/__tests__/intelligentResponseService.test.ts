import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateMultiBoardResponses,
  generateCrossBoardSummary,
  getQuestionInsights,
  generateAdvisorResponses,
  type MultiDomainConsultationRequest,
  type MultiDomainResponse,
  type AdvisorResponse
} from '../intelligentResponseService';
import { BOARDS } from '../../lib/boards';
import { LLMIntegrationLayer } from '../llm/LLMIntegrationLayer';

// Mock the LLM integration layer
vi.mock('../llm/LLMIntegrationLayer', () => ({
  LLMIntegrationLayer: {
    getInstance: vi.fn(() => ({
      isAvailable: vi.fn(() => Promise.resolve(true)),
      generateResponse: vi.fn(() => Promise.resolve({
        content: 'Mock LLM response for testing',
        usage: { tokens: 100 }
      }))
    }))
  }
}));

describe('IntelligentResponseService - Multi-Board Coordination', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateMultiBoardResponses', () => {
    it('should generate coordinated responses from multiple boards', async () => {
      const request: MultiDomainConsultationRequest = {
        question: 'How can I develop a health app that helps diabetic patients manage their condition?',
        selectedBoards: [BOARDS.product, BOARDS.clinical, BOARDS.wellness],
        requestId: 'test-123'
      };

      const responses = await generateMultiBoardResponses(request);

      expect(responses).toHaveLength(3);
      expect(responses[0].boardId).toBe('productboard');
      expect(responses[1].boardId).toBe('cliniboard');
      expect(responses[2].boardId).toBe('remediboard');
      
      // Each board should have responses from all its experts
      expect(responses[0].responses).toHaveLength(BOARDS.product.experts.length);
      expect(responses[1].responses).toHaveLength(BOARDS.clinical.experts.length);
      expect(responses[2].responses).toHaveLength(BOARDS.wellness.experts.length);
    });

    it('should include coordination context in responses', async () => {
      const request: MultiDomainConsultationRequest = {
        question: 'Test question for coordination',
        selectedBoards: [BOARDS.product, BOARDS.clinical]
      };

      const responses = await generateMultiBoardResponses(request);

      responses.forEach(response => {
        expect(response.coordinationContext).toContain('multi-domain consultation');
        expect(response.coordinationContext).toContain('2 advisory boards');
      });
    });

    it('should handle single board gracefully', async () => {
      const request: MultiDomainConsultationRequest = {
        question: 'Single board question',
        selectedBoards: [BOARDS.product]
      };

      const responses = await generateMultiBoardResponses(request);

      expect(responses).toHaveLength(1);
      expect(responses[0].boardId).toBe('productboard');
      expect(responses[0].responses).toHaveLength(BOARDS.product.experts.length);
    });

    it('should handle LLM failures gracefully with fallback responses', async () => {
      // Mock LLM to fail
      const mockLLM = {
        isAvailable: vi.fn(() => Promise.resolve(true)),
        generateResponse: vi.fn(() => Promise.reject(new Error('LLM failed')))
      };
      vi.mocked(LLMIntegrationLayer.getInstance).mockReturnValue(mockLLM as any);

      const request: MultiDomainConsultationRequest = {
        question: 'Test question with LLM failure',
        selectedBoards: [BOARDS.product]
      };

      const responses = await generateMultiBoardResponses(request);

      expect(responses).toHaveLength(1);
      expect(responses[0].responses).toHaveLength(BOARDS.product.experts.length);
      // Should still have responses even with LLM failure
      responses[0].responses.forEach(response => {
        expect(response.content).toBeTruthy();
        expect(response.confidence).toBeLessThan(0.8); // Lower confidence for fallback
      });
    });

    it('should generate different coordination contexts for different board combinations', async () => {
      const request1: MultiDomainConsultationRequest = {
        question: 'Test question',
        selectedBoards: [BOARDS.product, BOARDS.clinical]
      };

      const request2: MultiDomainConsultationRequest = {
        question: 'Test question',
        selectedBoards: [BOARDS.education, BOARDS.wellness]
      };

      const responses1 = await generateMultiBoardResponses(request1);
      const responses2 = await generateMultiBoardResponses(request2);

      expect(responses1[0].coordinationContext).not.toBe(responses2[0].coordinationContext);
      expect(responses1[0].coordinationContext).toContain('Product Development');
      expect(responses2[0].coordinationContext).toContain('Educational Innovation');
    });
  });

  describe('generateCrossBoardSummary', () => {
    it('should generate a comprehensive cross-board summary', () => {
      const mockResponses: MultiDomainResponse[] = [
        {
          boardId: 'productboard',
          boardName: 'Product Development & Strategy',
          responses: [
            {
              advisorId: 'expert1',
              content: 'Product advice',
              timestamp: new Date(),
              persona: { name: 'Expert 1', expertise: 'Product' }
            }
          ],
          timestamp: new Date(),
          coordinationContext: 'Test context'
        },
        {
          boardId: 'cliniboard',
          boardName: 'Clinical Research & Regulatory',
          responses: [
            {
              advisorId: 'expert2',
              content: 'Clinical advice',
              timestamp: new Date(),
              persona: { name: 'Expert 2', expertise: 'Clinical' }
            }
          ],
          timestamp: new Date(),
          coordinationContext: 'Test context'
        }
      ];

      const summary = generateCrossBoardSummary(mockResponses, 'Test question');

      expect(summary).toContain('Cross-Board Synthesis');
      expect(summary).toContain('2 advisory boards');
      expect(summary).toContain('Product Development & Strategy');
      expect(summary).toContain('Clinical Research & Regulatory');
      expect(summary).toContain('Integrated Recommendations');
      expect(summary).toContain('multi-domain approach');
    });

    it('should handle single board summary', () => {
      const mockResponses: MultiDomainResponse[] = [
        {
          boardId: 'productboard',
          boardName: 'Product Development & Strategy',
          responses: [
            {
              advisorId: 'expert1',
              content: 'Product advice',
              timestamp: new Date(),
              persona: { name: 'Expert 1', expertise: 'Product' }
            }
          ],
          timestamp: new Date(),
          coordinationContext: 'Test context'
        }
      ];

      const summary = generateCrossBoardSummary(mockResponses, 'Test question');

      expect(summary).toContain('1 advisory boards');
      expect(summary).toContain('Product Development & Strategy');
    });
  });

  describe('getQuestionInsights', () => {
    it('should analyze multi-domain questions correctly', async () => {
      const insights = await getQuestionInsights(
        'How can I develop a clinical trial app that educates patients about natural remedies?'
      );

      expect(insights.type).toBeTruthy();
      expect(insights.domain).toBeTruthy();
      expect(insights.confidence).toBeGreaterThan(0);
      expect(insights.keywords).toBeInstanceOf(Array);
      expect(insights.complexity).toMatch(/^(low|medium|high)$/);
    });

    it('should handle diabetes-related questions', async () => {
      const insights = await getQuestionInsights(
        'What are the best dietary recommendations for diabetic patients?'
      );

      expect(insights.domain).toBe('natural remedies');
      expect(insights.confidence).toBeGreaterThan(0.8);
      expect(insights.keywords).toContain('diabetic');
    });

    it('should identify product development questions', async () => {
      const insights = await getQuestionInsights(
        'How should I design the user experience for my mobile app?'
      );

      expect(insights.domain).toBe('product development');
      expect(insights.confidence).toBeGreaterThan(0.8);
    });

    it('should handle clinical research questions', async () => {
      const insights = await getQuestionInsights(
        'What are the FDA requirements for a Phase III clinical trial?'
      );

      expect(insights.domain).toBe('clinical research');
      expect(insights.confidence).toBeGreaterThan(0.8);
    });

    it('should identify education-related questions', async () => {
      const insights = await getQuestionInsights(
        'How can I design an effective curriculum for medical students?'
      );

      expect(insights.domain).toBe('education');
      expect(insights.confidence).toBeGreaterThan(0.8);
    });
  });

  describe('generateAdvisorResponses (existing functionality)', () => {
    it('should generate responses for single board experts', async () => {
      const question = 'How can I improve user engagement in my app?';
      const experts = BOARDS.product.experts;
      const domainId = 'productboard';

      const responses = await generateAdvisorResponses(question, experts, domainId);

      expect(responses).toHaveLength(experts.length);
      responses.forEach(response => {
        expect(response.advisorId).toBeTruthy();
        expect(response.content).toBeTruthy();
        expect(response.timestamp).toBeInstanceOf(Date);
        expect(response.persona.name).toBeTruthy();
        expect(response.persona.expertise).toBeTruthy();
      });
    });

    it('should handle empty experts array', async () => {
      const responses = await generateAdvisorResponses('Test question', [], 'productboard');
      expect(responses).toHaveLength(0);
    });

    it('should provide fallback responses when LLM fails', async () => {
      // Mock LLM to be unavailable
      const mockLLM = {
        isAvailable: vi.fn(() => Promise.resolve(false)),
        generateResponse: vi.fn()
      };
      vi.mocked(LLMIntegrationLayer.getInstance).mockReturnValue(mockLLM as any);

      const question = 'Test question';
      const experts = BOARDS.product.experts.slice(0, 1); // Just one expert for faster test
      const responses = await generateAdvisorResponses(question, experts, 'productboard');

      expect(responses).toHaveLength(1);
      expect(responses[0].content).toBeTruthy();
      expect(responses[0].confidence).toBeLessThan(0.8); // Lower confidence for fallback
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed requests gracefully', async () => {
      const request: MultiDomainConsultationRequest = {
        question: '',
        selectedBoards: []
      };

      const responses = await generateMultiBoardResponses(request);
      expect(responses).toHaveLength(0);
    });

    it('should handle network timeouts gracefully', async () => {
      // Mock LLM to timeout
      const mockLLM = {
        isAvailable: vi.fn(() => Promise.resolve(true)),
        generateResponse: vi.fn(() => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        ))
      };
      vi.mocked(LLMIntegrationLayer.getInstance).mockReturnValue(mockLLM as any);

      const request: MultiDomainConsultationRequest = {
        question: 'Test timeout question',
        selectedBoards: [BOARDS.product]
      };

      const responses = await generateMultiBoardResponses(request);
      
      expect(responses).toHaveLength(1);
      // Should still get fallback responses
      expect(responses[0].responses).toHaveLength(BOARDS.product.experts.length);
    });
  });

  describe('Performance', () => {
    it('should complete multi-board generation within reasonable time', async () => {
      const startTime = Date.now();
      
      const request: MultiDomainConsultationRequest = {
        question: 'Performance test question',
        selectedBoards: [BOARDS.product, BOARDS.clinical]
      };

      await generateMultiBoardResponses(request);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
    });
  });
});
