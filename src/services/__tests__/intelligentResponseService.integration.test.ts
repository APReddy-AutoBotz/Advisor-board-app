/**
 * Integration tests for Intelligent Response Service with New Response Orchestrator
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateAdvisorResponses, getQuestionInsights, clearResponseCache } from '../intelligentResponseService';
import type { BoardExpert } from '../../lib/boards';

// Mock the LLM integration layer to simulate various scenarios
vi.mock('../llm/LLMIntegrationLayer', () => ({
  LLMIntegrationLayer: vi.fn().mockImplementation(() => ({
    generateResponse: vi.fn().mockRejectedValue(new Error('LLM service unavailable')),
    getProviderStatus: vi.fn().mockResolvedValue({})
  }))
}));

describe('Intelligent Response Service Integration', () => {
  const mockAdvisors: BoardExpert[] = [
    {
      id: 'sarah-kim',
      name: 'Sarah Kim',
      code: 'CPO',
      role: 'Chief Product Officer',
      blurb: 'Former CPO at Stripe who scaled product teams from $1M to $1B ARR',
      credentials: 'MBA Stanford, Former Stripe CPO',
      avatar: '/images/advisors/sarah-kim.svg',
      specialties: ['Product Strategy', 'Platform Scaling', '0-to-1 Products']
    },
    {
      id: 'michael-rodriguez',
      name: 'Dr. Michael Rodriguez',
      code: 'FDA',
      role: 'Regulatory Affairs Director',
      blurb: 'Former FDA CDER Director who reviewed 100+ NDA submissions',
      credentials: 'PharmD, JD, Former FDA CDER Director',
      avatar: '/images/advisors/dr-michael-rodriguez.svg',
      specialties: ['FDA Submissions', 'Regulatory Strategy', 'Compliance']
    }
  ];

  beforeEach(() => {
    // Clear cache before each test
    clearResponseCache();
  });

  describe('Response Orchestrator Integration', () => {
    it('should generate responses using response orchestrator with fallback to static when LLM fails', async () => {
      const question = 'How should we approach product strategy for our new mobile app?';
      const responses = await generateAdvisorResponses(question, mockAdvisors, 'productboard');
      
      expect(responses).toHaveLength(2);
      
      // Check Sarah Kim's response
      const sarahResponse = responses.find(r => r.advisorId === 'sarah-kim');
      expect(sarahResponse).toBeTruthy();
      expect(sarahResponse!.content).toBeTruthy();
      expect(sarahResponse!.content.length).toBeGreaterThan(100);
      expect(sarahResponse!.content).toMatch(/product|strategy/i);
      expect(sarahResponse!.persona.name).toBe('Sarah Kim');
      expect(sarahResponse!.metadata).toBeTruthy();
      expect(sarahResponse!.metadata!.responseType).toBe('static');
      
      // Check Michael's response
      const michaelResponse = responses.find(r => r.advisorId === 'michael-rodriguez');
      expect(michaelResponse).toBeTruthy();
      expect(michaelResponse!.content).toBeTruthy();
      expect(michaelResponse!.content.length).toBeGreaterThan(100);
      expect(michaelResponse!.persona.name).toBe('Dr. Michael Rodriguez');
      expect(michaelResponse!.metadata).toBeTruthy();
      expect(michaelResponse!.metadata!.responseType).toBe('static');
    });

    it('should generate domain-appropriate responses', async () => {
      const clinicalQuestion = 'How do we design a Phase III clinical trial?';
      const responses = await generateAdvisorResponses(clinicalQuestion, mockAdvisors, 'cliniboard');
      
      expect(responses).toHaveLength(2);
      
      responses.forEach(response => {
        expect(response.content).toBeTruthy();
        expect(response.content.length).toBeGreaterThan(100);
        expect(response.timestamp).toBeInstanceOf(Date);
      });
    });

    it('should handle different question types appropriately', async () => {
      const questions = [
        { q: 'What innovative product should we create?', type: 'product_ideation' },
        { q: 'What should our go-to-market strategy be?', type: 'strategy' },
        { q: 'What technical architecture should we use?', type: 'technical' },
        { q: 'Can you give me some general advice?', type: 'general' }
      ];

      for (const { q, type } of questions) {
        const responses = await generateAdvisorResponses(q, [mockAdvisors[0]], 'productboard');
        
        expect(responses).toHaveLength(1);
        expect(responses[0].content).toBeTruthy();
        expect(responses[0].content.length).toBeGreaterThan(100);
        
        // Content should be relevant to question type
        if (type === 'product_ideation') {
          expect(responses[0].content).toMatch(/idea|innovation|create|product/i);
        } else if (type === 'strategy') {
          expect(responses[0].content).toMatch(/strategy|strategic|plan|approach/i);
        } else if (type === 'technical') {
          expect(responses[0].content).toMatch(/technical|architecture|system|implementation/i);
        }
      }
    });

    it('should provide structured, professional responses with metadata', async () => {
      const question = 'How do we improve our business processes?';
      const responses = await generateAdvisorResponses(question, [mockAdvisors[0]], 'productboard');
      
      expect(responses).toHaveLength(1);
      const response = responses[0];
      
      // Should have structured content
      expect(response.content).toMatch(/\*\*.*\*\*/); // Bold headers
      expect(response.content).toMatch(/•|1\.|2\./); // Bullet points or numbered lists
      expect(response.content).toMatch(/insights|approach|recommendation/i);
      
      // Should be professional length
      expect(response.content.length).toBeGreaterThan(200);
      expect(response.content.length).toBeLessThan(2000);
      
      // Should include metadata
      expect(response.metadata).toBeTruthy();
      expect(response.metadata!.processingTime).toBeGreaterThanOrEqual(0);
      expect(response.metadata!.confidence).toBeGreaterThan(0);
      expect(response.metadata!.responseType).toBe('static');
    });
  });

  describe('Question Analysis Integration', () => {
    it('should analyze questions using new question analysis engine', async () => {
      const question = 'What product strategy should we implement?';
      const insights = await getQuestionInsights(question, 'productboard');
      
      expect(insights).toBeTruthy();
      expect(insights.type).toBeTruthy();
      expect(insights.keywords).toBeTruthy();
      expect(insights.keywords.length).toBeGreaterThan(0);
      expect(insights.confidence).toBeGreaterThan(0);
      expect(insights.domain).toBe('productboard');
      expect(insights.frameworks).toBeTruthy();
      expect(insights.frameworks.length).toBeGreaterThan(0);
      expect(insights.sentiment).toBeTruthy();
      expect(insights.complexity).toBeTruthy();
      expect(insights.urgency).toBeTruthy();
    });

    it('should provide relevant frameworks for different domains', async () => {
      const testCases = [
        { domain: 'productboard', expectedFrameworks: ['Jobs-to-be-Done', 'North Star Framework', 'OKRs'] },
        { domain: 'cliniboard', expectedFrameworks: ['ICH Guidelines', 'FDA Guidance', 'Clinical Development Plan'] },
        { domain: 'eduboard', expectedFrameworks: ['Bloom\'s Taxonomy', 'Backward Design', 'Learning Objectives'] },
        { domain: 'remediboard', expectedFrameworks: ['Functional Medicine', 'Holistic Nutrition', 'Integrative Approach'] }
      ];

      for (const { domain, expectedFrameworks } of testCases) {
        const question = 'What strategy should we use?';
        const insights = await getQuestionInsights(question, domain);
        
        expect(insights.frameworks).toBeTruthy();
        expect(insights.frameworks.length).toBeGreaterThan(0);
        // Check if at least one expected framework is present
        const hasExpectedFramework = expectedFrameworks.some(framework => 
          insights.frameworks.includes(framework)
        );
        expect(hasExpectedFramework).toBe(true);
      }
    });

    it('should handle edge cases gracefully', async () => {
      const edgeCases = [
        '',
        'a',
        'What?',
        'This is a very long question that goes on and on without much substance but should still be analyzed properly'
      ];

      for (const question of edgeCases) {
        const insights = await getQuestionInsights(question, 'productboard');
        
        expect(insights).toBeTruthy();
        expect(insights.type).toBeTruthy();
        expect(insights.confidence).toBeGreaterThan(0);
        expect(insights.domain).toBe('productboard');
      }
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle multiple concurrent requests', async () => {
      const question = 'How do we scale our platform?';
      const promises = Array(5).fill(null).map(() => 
        generateAdvisorResponses(question, [mockAdvisors[0]], 'productboard')
      );
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      results.forEach(responses => {
        expect(responses).toHaveLength(1);
        expect(responses[0].content).toBeTruthy();
        expect(responses[0].content.length).toBeGreaterThan(100);
      });
    });

    it('should complete responses within reasonable time and include processing metadata', async () => {
      const question = 'What technical approach should we take?';
      const startTime = Date.now();
      
      const responses = await generateAdvisorResponses(question, mockAdvisors, 'productboard');
      const endTime = Date.now();
      
      expect(responses).toHaveLength(2);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
      
      // Check that metadata includes processing time
      responses.forEach(response => {
        expect(response.metadata).toBeTruthy();
        expect(response.metadata!.processingTime).toBeGreaterThanOrEqual(0);
        expect(response.metadata!.processingTime).toBeLessThan(2000);
      });
    });

    it('should never return empty responses', async () => {
      const questions = [
        'Help me with product strategy',
        'What should I do about technical debt?',
        'How do we improve user experience?',
        'What are the best practices?'
      ];

      for (const question of questions) {
        const responses = await generateAdvisorResponses(question, mockAdvisors, 'productboard');
        
        responses.forEach(response => {
          expect(response.content).toBeTruthy();
          expect(response.content.trim()).not.toBe('');
          expect(response.content.length).toBeGreaterThan(50);
          expect(response.advisorId).toBeTruthy();
          expect(response.persona.name).toBeTruthy();
          expect(response.timestamp).toBeInstanceOf(Date);
        });
      }
    });
  });
});