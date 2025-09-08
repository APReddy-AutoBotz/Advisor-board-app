/**
 * Enhanced Static Response Generator Tests
 * 
 * Tests for question analysis, persona-specific responses, and framework integration
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EnhancedStaticResponseGenerator } from '../enhancedStaticResponseGenerator';
import type { Advisor } from '../../types/domain';

describe('EnhancedStaticResponseGenerator', () => {
  let generator: EnhancedStaticResponseGenerator;
  
  beforeEach(() => {
    generator = new EnhancedStaticResponseGenerator();
  });

  describe('Question Analysis', () => {
    it('should correctly identify product ideation questions', () => {
      const questions = [
        'How can we create a new product for our users?',
        'What innovative features should we build?',
        'I have an idea for a mobile app, what do you think?',
        'Should we develop a new service offering?'
      ];

      questions.forEach(question => {
        const analysis = generator.analyzeQuestion(question, 'productboard');
        expect(analysis.type).toBe('product_ideation');
        expect(analysis.confidence).toBeGreaterThan(0.4);
      });
    });

    it('should correctly identify strategy questions', () => {
      const questions = [
        'What should our go-to-market strategy be?',
        'How do we position ourselves against competitors?',
        'What is the best business model for this?',
        'How should we plan our roadmap for next year?'
      ];

      questions.forEach(question => {
        const analysis = generator.analyzeQuestion(question, 'productboard');
        expect(analysis.type).toBe('strategy');
        expect(analysis.confidence).toBeGreaterThan(0.4);
      });
    });

    it('should correctly identify technical questions', () => {
      const questions = [
        'What architecture should we use for this system?',
        'How do we implement this API integration?',
        'What database would be best for our use case?',
        'How can we improve our application performance?'
      ];

      questions.forEach(question => {
        const analysis = generator.analyzeQuestion(question, 'productboard');
        expect(analysis.type).toBe('technical');
        expect(analysis.confidence).toBeGreaterThan(0.4);
      });
    });

    it('should extract relevant keywords', () => {
      const question = 'How can we improve our product strategy for mobile users?';
      const keywords = generator.extractKeywords(question, 'productboard');
      
      expect(keywords).toContain('product');
      expect(keywords).toContain('strategy');
      expect(keywords.length).toBeGreaterThan(0);
      expect(keywords.length).toBeLessThanOrEqual(5);
    });

    it('should provide confidence scores', () => {
      const question = 'What technical architecture should we use for our new product?';
      const analysis = generator.analyzeQuestion(question, 'productboard');
      
      expect(analysis.confidence).toBeGreaterThan(0);
      expect(analysis.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('Response Generation', () => {
    const mockAdvisor: Advisor = {
      id: 'sarah-kim',
      name: 'Sarah Kim',
      expertise: 'Product Strategy',
      background: 'Former CPO at Stripe',
      domain: 'productboard',
      isSelected: true
    };

    it('should generate enhanced static response', async () => {
      const question = 'How should we approach product strategy for our new mobile app?';
      const response = await generator.generateResponse(mockAdvisor, question, 'productboard');
      
      expect(response.content).toBeTruthy();
      expect(response.content.length).toBeGreaterThan(100);
      expect(response.metadata.responseType).toBe('static');
      expect(response.metadata.confidence).toBeGreaterThan(0);
      expect(response.metadata.processingTime).toBeGreaterThan(0);
    });

    it('should include persona-specific content when persona exists', async () => {
      const question = 'What product strategy should we use?';
      const response = await generator.generateResponse(mockAdvisor, question, 'productboard');
      
      // Should include persona-specific language
      expect(response.content).toMatch(/stripe|cpo|product/i);
      expect(response.content).toMatch(/strategic|strategy/i);
    });

    it('should generate professional response for unknown advisor', async () => {
      const unknownAdvisor: Advisor = {
        id: 'unknown-advisor',
        name: 'Unknown Advisor',
        expertise: 'General Business',
        background: 'Business professional',
        domain: 'productboard',
        isSelected: true
      };

      const question = 'How should we approach this business challenge?';
      const response = await generator.generateResponse(unknownAdvisor, question, 'productboard');
      
      expect(response.content).toBeTruthy();
      expect(response.content).toMatch(/professional|business|expertise/i);
    });

    it('should include actionable steps in responses', async () => {
      const question = 'How do we launch a new product?';
      const response = await generator.generateResponse(mockAdvisor, question, 'productboard');
      
      expect(response.content).toMatch(/recommended approach|actionable|steps/i);
      expect(response.content).toMatch(/1\.|2\.|3\.|4\./); // Should have numbered steps
    });

    it('should include relevant frameworks', async () => {
      const question = 'What product strategy framework should we use?';
      const response = await generator.generateResponse(mockAdvisor, question, 'productboard');
      
      expect(response.metadata.frameworks).toBeTruthy();
      expect(response.metadata.frameworks.length).toBeGreaterThan(0);
      expect(response.content).toMatch(/framework/i);
    });
  });

  describe('Domain-Specific Responses', () => {
    it('should generate appropriate responses for ProductBoard', async () => {
      const advisor: Advisor = {
        id: 'product-advisor',
        name: 'Product Advisor',
        expertise: 'Product Management',
        background: 'Product expert',
        domain: 'productboard',
        isSelected: true
      };

      const question = 'How do we validate our product idea?';
      const response = await generator.generateResponse(advisor, question, 'productboard');
      
      expect(response.content).toMatch(/product|user|market|validation/i);
      expect(response.metadata.frameworks).toContain('Jobs-to-be-Done Framework');
    });

    it('should generate appropriate responses for CliniBoard', async () => {
      const advisor: Advisor = {
        id: 'clinical-advisor',
        name: 'Clinical Advisor',
        expertise: 'Clinical Research',
        background: 'Clinical expert',
        domain: 'cliniboard',
        isSelected: true
      };

      const question = 'How do we design a clinical trial?';
      const response = await generator.generateResponse(advisor, question, 'cliniboard');
      
      expect(response.content).toMatch(/clinical|trial|patient|regulatory/i);
      expect(response.metadata.frameworks).toContain('Clinical Development Plan');
    });

    it('should generate appropriate responses for EduBoard', async () => {
      const advisor: Advisor = {
        id: 'edu-advisor',
        name: 'Education Advisor',
        expertise: 'Curriculum Design',
        background: 'Education expert',
        domain: 'eduboard',
        isSelected: true
      };

      const question = 'How do we design an effective curriculum?';
      const response = await generator.generateResponse(advisor, question, 'eduboard');
      
      expect(response.content).toMatch(/learning|curriculum|student|education/i);
      expect(response.metadata.frameworks).toContain('Backward Design');
    });

    it('should generate appropriate responses for RemediBoard', async () => {
      const advisor: Advisor = {
        id: 'wellness-advisor',
        name: 'Wellness Advisor',
        expertise: 'Holistic Health',
        background: 'Wellness expert',
        domain: 'remediboard',
        isSelected: true
      };

      const question = 'What natural approach should we take for wellness?';
      const response = await generator.generateResponse(advisor, question, 'remediboard');
      
      expect(response.content).toMatch(/wellness|health|natural|holistic/i);
      expect(response.metadata.frameworks).toContain('Integrative Medicine Model');
    });
  });

  describe('Question Type Specific Responses', () => {
    const mockAdvisor: Advisor = {
      id: 'test-advisor',
      name: 'Test Advisor',
      expertise: 'General',
      background: 'Professional',
      domain: 'productboard',
      isSelected: true
    };

    it('should customize response for product ideation questions', async () => {
      const question = 'I have an idea for a new app, what should I do?';
      const response = await generator.generateResponse(mockAdvisor, question, 'productboard');
      
      expect(response.content).toMatch(/ideation|concept|prototype|mvp/i);
      expect(response.content).toMatch(/discovery|validation|development|launch/i);
    });

    it('should customize response for strategy questions', async () => {
      const question = 'What should our long-term business strategy be?';
      const response = await generator.generateResponse(mockAdvisor, question, 'productboard');
      
      expect(response.content).toMatch(/strategy|strategic|competitive|market/i);
      expect(response.content).toMatch(/analysis|planning|implementation|review/i);
    });

    it('should customize response for technical questions', async () => {
      const question = 'What technical architecture should we implement?';
      const response = await generator.generateResponse(mockAdvisor, question, 'productboard');
      
      expect(response.content).toMatch(/technical|architecture|system|implementation/i);
      expect(response.content).toMatch(/requirements|design|development|deployment/i);
    });
  });

  describe('Response Quality', () => {
    const mockAdvisor: Advisor = {
      id: 'quality-advisor',
      name: 'Quality Advisor',
      expertise: 'Professional Services',
      background: 'Industry expert',
      domain: 'productboard',
      isSelected: true
    };

    it('should generate responses with appropriate length', async () => {
      const question = 'How do we improve our business processes?';
      const response = await generator.generateResponse(mockAdvisor, question, 'productboard');
      
      expect(response.content.length).toBeGreaterThan(200);
      expect(response.content.length).toBeLessThan(2000);
    });

    it('should include professional insights', async () => {
      const question = 'What best practices should we follow?';
      const response = await generator.generateResponse(mockAdvisor, question, 'productboard');
      
      expect(response.content).toMatch(/insights|considerations|professional/i);
      expect(response.content).toMatch(/best practices|methodology|approach/i);
    });

    it('should provide structured responses', async () => {
      const question = 'How should we approach this challenge?';
      const response = await generator.generateResponse(mockAdvisor, question, 'productboard');
      
      // Should have clear sections
      expect(response.content).toMatch(/\*\*.*\*\*/); // Bold headers
      expect(response.content).toMatch(/•|1\.|2\./); // Bullet points or numbered lists
    });

    it('should maintain consistent quality across question types', async () => {
      const questions = [
        'How do we create a new product?',
        'What should our strategy be?',
        'What technical approach is best?',
        'Can you give me general advice?'
      ];

      for (const question of questions) {
        const response = await generator.generateResponse(mockAdvisor, question, 'productboard');
        
        expect(response.content.length).toBeGreaterThan(200);
        expect(response.metadata.confidence).toBeGreaterThan(0.3);
        expect(response.metadata.processingTime).toBeLessThan(1000); // Should be fast
      }
    });
  });

  describe('Performance', () => {
    const mockAdvisor: Advisor = {
      id: 'perf-advisor',
      name: 'Performance Advisor',
      expertise: 'Performance',
      background: 'Expert',
      domain: 'productboard',
      isSelected: true
    };

    it('should generate responses quickly', async () => {
      const question = 'How do we optimize performance?';
      const startTime = Date.now();
      
      const response = await generator.generateResponse(mockAdvisor, question, 'productboard');
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should be very fast
      expect(response.metadata.processingTime).toBeLessThan(100);
    });

    it('should handle multiple concurrent requests', async () => {
      const questions = Array(10).fill('How do we solve this problem?');
      const promises = questions.map(q => 
        generator.generateResponse(mockAdvisor, q, 'productboard')
      );
      
      const responses = await Promise.all(promises);
      
      expect(responses).toHaveLength(10);
      responses.forEach(response => {
        expect(response.content).toBeTruthy();
        expect(response.metadata.processingTime).toBeLessThan(100);
      });
    });
  });
});