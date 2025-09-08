/**
 * Unit Tests for Persona Prompt Generation
 * 
 * Comprehensive test suite covering:
 * - Persona prompt generation for all advisor types
 * - Question type analysis and categorization
 * - Persona-specific response templates
 * - Fallback mechanisms for unknown advisors
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PersonaPromptService } from '../../../services/personaPromptService';
import { PERSONA_LIBRARY, DOMAIN_PERSONAS, PERSONA_ROLE_MAPPING } from '../../../services/personaPromptService';
import type { BoardExpert } from '../../../lib/boards';

describe('Persona Prompt Generation - Unit Tests', () => {
  let service: PersonaPromptService;

  // Mock advisor data for comprehensive testing
  const mockAdvisors = {
    productCPO: {
      id: 'sarah-kim',
      name: 'Sarah Kim',
      code: 'CPO',
      role: 'Chief Product Officer',
      blurb: 'Former CPO at Stripe, scaled from startup to $95B valuation',
      credentials: 'MBA Stanford, Former Stripe CPO',
      avatar: '/images/advisors/sarah-kim.svg',
      specialties: ['Product Strategy', '0-to-1 Products', 'Platform Scaling']
    } as BoardExpert,

    clinicalStrategy: {
      id: 'sarah-chen',
      name: 'Dr. Sarah Chen',
      code: 'CRS',
      role: 'Clinical Research Strategy',
      blurb: 'Former Pfizer VP who led 50+ Phase III trials to FDA approval',
      credentials: 'MD, PhD, Former FDA Advisory Committee Member',
      avatar: '/images/advisors/dr-sarah-chen.svg',
      specialties: ['Phase III Trials', 'FDA Interactions', 'Global Regulatory Strategy']
    } as BoardExpert,

    unknownAdvisor: {
      id: 'unknown-advisor',
      name: 'Unknown Advisor',
      code: 'UNK',
      role: 'Unknown Role',
      blurb: 'Test advisor without persona definition',
      credentials: 'Test Credentials',
      avatar: '/images/advisors/unknown.svg',
      specialties: ['General Advice']
    } as BoardExpert
  };

  const testQuestions = {
    productStrategy: 'How do I achieve product-market fit for my B2B SaaS platform?',
    productIdeation: 'I have an idea for a new feature that could increase user engagement',
    technicalArchitecture: 'What is the best technical architecture for scaling our platform?',
    clinicalTrial: 'How should I design a Phase III clinical trial for our new drug?',
    regulatoryStrategy: 'What are the key considerations for FDA submission?',
    generalBusiness: 'What should I focus on to grow my business?',
    complexMultiPart: 'I need help with product strategy, technical implementation, and go-to-market planning for a new healthcare AI product'
  };

  beforeEach(() => {
    service = new PersonaPromptService();
    vi.clearAllMocks();
  });

  describe('Persona Library Validation', () => {
    it('should have comprehensive persona definitions for all domains', () => {
      // ProductBoard personas
      const productPersonas = ['sarah-kim', 'marcus-chen', 'elena-rodriguez', 'alex-thompson', 'ryan-martinez', 'michael-zhang'];
      productPersonas.forEach(id => {
        expect(PERSONA_LIBRARY[id]).toBeDefined();
        expect(PERSONA_LIBRARY[id].role).toBeDefined();
        expect(PERSONA_LIBRARY[id].systemPrompt.length).toBeGreaterThan(100);
      });

      // CliniBoard personas
      const clinicalPersonas = ['sarah-chen', 'michael-rodriguez'];
      clinicalPersonas.forEach(id => {
        expect(PERSONA_LIBRARY[id]).toBeDefined();
        expect(PERSONA_LIBRARY[id].expertiseAreas.some(area => 
          area.includes('FDA') || area.includes('Clinical') || area.includes('Regulatory')
        )).toBe(true);
      });
    });

    it('should have complete persona configurations with required fields', () => {
      const requiredFields = ['id', 'role', 'systemPrompt', 'roleContext', 'expertiseAreas', 'responseStyle', 'frameworks', 'responseTemplates'];
      
      Object.values(PERSONA_LIBRARY).forEach(persona => {
        requiredFields.forEach(field => {
          expect(persona[field as keyof typeof persona]).toBeDefined();
          expect(persona[field as keyof typeof persona]).not.toBe('');
        });

        // Validate arrays have content
        expect(persona.expertiseAreas.length).toBeGreaterThan(0);
        expect(persona.frameworks.length).toBeGreaterThan(0);
        expect(Object.keys(persona.responseTemplates).length).toBeGreaterThan(0);
      });
    });

    it('should have domain-persona mappings for all domains', () => {
      expect(DOMAIN_PERSONAS.productboard).toBeDefined();
      expect(DOMAIN_PERSONAS.cliniboard).toBeDefined();
      expect(DOMAIN_PERSONAS.eduboard).toBeDefined();
      expect(DOMAIN_PERSONAS.remediboard).toBeDefined();

      // Each domain should have multiple personas
      expect(DOMAIN_PERSONAS.productboard.length).toBeGreaterThan(3);
      expect(DOMAIN_PERSONAS.cliniboard.length).toBeGreaterThan(3);
    });

    it('should have role-persona mappings for strategic roles', () => {
      expect(PERSONA_ROLE_MAPPING.product_strategy).toContain('sarah-kim');
      expect(PERSONA_ROLE_MAPPING.clinical_strategy).toContain('sarah-chen');
      expect(PERSONA_ROLE_MAPPING.design_leadership).toBeDefined();
      expect(PERSONA_ROLE_MAPPING.engineering_leadership).toBeDefined();
    });
  });

  describe('Prompt Generation for Known Advisors', () => {
    it('should generate comprehensive persona prompt for product strategy advisor', () => {
      const prompt = service.generatePersonaPrompt(mockAdvisors.productCPO, testQuestions.productStrategy);

      // Should include all persona elements
      expect(prompt).toContain('Sarah Kim');
      expect(prompt).toContain('Chief Product Officer');
      expect(prompt).toContain('Stripe');
      expect(prompt).toContain('Product Strategy');
      expect(prompt).toContain(testQuestions.productStrategy);

      // Should have structured sections
      expect(prompt).toContain('ROLE CONTEXT:');
      expect(prompt).toContain('EXPERTISE AREAS:');
      expect(prompt).toContain('RESPONSE STYLE:');
      expect(prompt).toContain('FRAMEWORKS TO REFERENCE:');

      // Should include relevant frameworks
      expect(prompt).toContain('Jobs-to-be-Done');
      expect(prompt).toContain('North Star Framework');
    });

    it('should generate clinical-specific prompt for clinical advisor', () => {
      const prompt = service.generatePersonaPrompt(mockAdvisors.clinicalStrategy, testQuestions.clinicalTrial);

      expect(prompt).toContain('Dr. Sarah Chen');
      expect(prompt).toContain('Clinical Research Strategy');
      expect(prompt).toContain('Pfizer');
      expect(prompt).toContain('Phase III');
      expect(prompt).toContain('FDA');

      // Should include clinical frameworks
      expect(prompt).toContain('ICH Guidelines');
      expect(prompt).toContain('FDA Guidance Documents');
    });

    it('should adapt prompt based on question type analysis', () => {
      const strategyPrompt = service.generatePersonaPrompt(mockAdvisors.productCPO, testQuestions.productStrategy);
      const ideationPrompt = service.generatePersonaPrompt(mockAdvisors.productCPO, testQuestions.productIdeation);
      const technicalPrompt = service.generatePersonaPrompt(mockAdvisors.productCPO, testQuestions.technicalArchitecture);

      // Each should use appropriate response templates
      expect(strategyPrompt).toContain('Strategic');
      expect(ideationPrompt).toContain('product');
      expect(technicalPrompt).toContain('technical');

      // All should maintain persona consistency
      expect(strategyPrompt).toContain('Sarah Kim');
      expect(ideationPrompt).toContain('Sarah Kim');
      expect(technicalPrompt).toContain('Sarah Kim');
    });

    it('should handle complex multi-part questions', () => {
      const prompt = service.generatePersonaPrompt(mockAdvisors.productCPO, testQuestions.complexMultiPart);

      expect(prompt).toContain('product strategy');
      expect(prompt).toContain('technical implementation');
      expect(prompt).toContain('go-to-market');
      expect(prompt).toContain('healthcare AI');

      // Should provide comprehensive guidance
      expect(prompt.length).toBeGreaterThan(1000);
    });
  });

  describe('Question Type Analysis', () => {
    it('should correctly categorize different question types', () => {
      const strategyQuestion = testQuestions.productStrategy;
      const ideationQuestion = testQuestions.productIdeation;
      const technicalQuestion = testQuestions.technicalArchitecture;
      const clinicalQuestion = testQuestions.clinicalTrial;

      // Test through prompt generation to verify categorization
      const strategyPrompt = service.generatePersonaPrompt(mockAdvisors.productCPO, strategyQuestion);
      const ideationPrompt = service.generatePersonaPrompt(mockAdvisors.productCPO, ideationQuestion);
      const technicalPrompt = service.generatePersonaPrompt(mockAdvisors.productCPO, technicalQuestion);
      const clinicalPrompt = service.generatePersonaPrompt(mockAdvisors.clinicalStrategy, clinicalQuestion);

      // Each should use appropriate response template
      expect(strategyPrompt).toMatch(/strategic|strategy/i);
      expect(ideationPrompt).toMatch(/ideation|feature|development/i);
      expect(technicalPrompt).toMatch(/technical|architecture|implementation/i);
      expect(clinicalPrompt).toMatch(/clinical|trial|FDA/i);
    });

    it('should extract relevant keywords from questions', () => {
      const healthcareQuestion = 'How do I develop a healthcare AI product for clinical trials?';
      const prompt = service.generatePersonaPrompt(mockAdvisors.productCPO, healthcareQuestion);

      expect(prompt).toContain('healthcare');
      expect(prompt).toContain('AI');
      expect(prompt).toContain('clinical trials');
    });

    it('should handle questions with domain-specific terminology', () => {
      const regulatoryQuestion = 'What are the 510(k) requirements for medical device approval?';
      const prompt = service.generatePersonaPrompt(mockAdvisors.clinicalStrategy, regulatoryQuestion);

      expect(prompt).toContain('510(k)');
      expect(prompt).toContain('medical device');
      expect(prompt).toContain('approval');
      expect(prompt).toContain('regulatory');
    });
  });

  describe('Fallback Mechanisms', () => {
    it('should generate fallback prompt for unknown advisor', () => {
      const prompt = service.generatePersonaPrompt(mockAdvisors.unknownAdvisor, testQuestions.generalBusiness);

      expect(prompt).toContain('Unknown Advisor');
      expect(prompt).toContain('Unknown Role');
      expect(prompt).toContain('General Advice');
      expect(prompt).toContain(testQuestions.generalBusiness);

      // Should still be professional and helpful
      expect(prompt).toContain('professional background');
      expect(prompt).toContain('expertise');
      expect(prompt.length).toBeGreaterThan(200);
    });

    it('should handle empty or invalid questions gracefully', () => {
      const emptyPrompt = service.generatePersonaPrompt(mockAdvisors.productCPO, '');
      const whitespacePrompt = service.generatePersonaPrompt(mockAdvisors.productCPO, '   ');

      expect(emptyPrompt).toContain('Sarah Kim');
      expect(emptyPrompt).toContain('general guidance');
      expect(whitespacePrompt).toContain('Sarah Kim');
      expect(whitespacePrompt).toContain('general guidance');
    });

    it('should handle advisors with missing specialties', () => {
      const advisorWithoutSpecialties = {
        ...mockAdvisors.productCPO,
        specialties: []
      };

      const prompt = service.generatePersonaPrompt(advisorWithoutSpecialties, testQuestions.productStrategy);

      expect(prompt).toContain('Sarah Kim');
      expect(prompt).toContain('Chief Product Officer');
      // Should still generate a valid prompt
      expect(prompt.length).toBeGreaterThan(300);
    });
  });

  describe('Persona Configuration Management', () => {
    it('should retrieve persona configurations correctly', () => {
      const sarahConfig = service.getPersonaConfig('sarah-kim');
      expect(sarahConfig).toBeDefined();
      expect(sarahConfig?.id).toBe('sarah-kim');
      expect(sarahConfig?.role).toBe('Chief Product Officer');

      const unknownConfig = service.getPersonaConfig('non-existent-advisor');
      expect(unknownConfig).toBeUndefined();
    });

    it('should validate persona configurations', () => {
      expect(service.validatePersonaConfig('sarah-kim')).toBe(true);
      expect(service.validatePersonaConfig('sarah-chen')).toBe(true);
      expect(service.validatePersonaConfig('non-existent')).toBe(false);
    });

    it('should provide comprehensive persona statistics', () => {
      const stats = service.getPersonaStats();

      expect(stats.totalPersonas).toBeGreaterThan(10);
      expect(stats.domainBreakdown.productboard).toBeGreaterThan(3);
      expect(stats.domainBreakdown.cliniboard).toBeGreaterThan(3);
      expect(stats.roleTypes.length).toBeGreaterThan(3);
    });

    it('should get domain-specific personas', () => {
      const productPersonas = service.getDomainPersonas('productboard');
      const clinicalPersonas = service.getDomainPersonas('cliniboard');

      expect(productPersonas.length).toBeGreaterThan(3);
      expect(clinicalPersonas.length).toBeGreaterThan(3);

      expect(productPersonas.some(p => p.id === 'sarah-kim')).toBe(true);
      expect(clinicalPersonas.some(p => p.id === 'sarah-chen')).toBe(true);
    });

    it('should get personas by role type', () => {
      const strategyPersonas = service.getPersonasByRole('product_strategy');
      const clinicalPersonas = service.getPersonasByRole('clinical_strategy');

      expect(strategyPersonas.length).toBeGreaterThan(0);
      expect(clinicalPersonas.length).toBeGreaterThan(0);

      expect(strategyPersonas.some(p => p.id === 'sarah-kim')).toBe(true);
      expect(clinicalPersonas.some(p => p.id === 'sarah-chen')).toBe(true);
    });
  });

  describe('Prompt Quality and Consistency', () => {
    it('should generate prompts with consistent structure', () => {
      const advisors = [mockAdvisors.productCPO, mockAdvisors.clinicalStrategy];
      const prompts = advisors.map(advisor => 
        service.generatePersonaPrompt(advisor, testQuestions.generalBusiness)
      );

      prompts.forEach(prompt => {
        expect(prompt).toContain('ROLE CONTEXT:');
        expect(prompt).toContain('EXPERTISE AREAS:');
        expect(prompt).toContain('RESPONSE STYLE:');
        expect(prompt).toContain('FRAMEWORKS TO REFERENCE:');
        expect(prompt).toContain('USER QUESTION:');
      });
    });

    it('should maintain persona voice consistency', () => {
      const questions = Object.values(testQuestions);
      const prompts = questions.map(question => 
        service.generatePersonaPrompt(mockAdvisors.productCPO, question)
      );

      prompts.forEach(prompt => {
        expect(prompt).toContain('Sarah Kim');
        expect(prompt).toContain('Stripe');
        expect(prompt).toContain('Product Strategy');
        // Should maintain consistent voice and expertise
        expect(prompt).toMatch(/experience|expertise|background/i);
      });
    });

    it('should include appropriate frameworks for each domain', () => {
      const productPrompt = service.generatePersonaPrompt(mockAdvisors.productCPO, testQuestions.productStrategy);
      const clinicalPrompt = service.generatePersonaPrompt(mockAdvisors.clinicalStrategy, testQuestions.clinicalTrial);

      // Product frameworks
      expect(productPrompt).toContain('Jobs-to-be-Done');
      expect(productPrompt).toContain('North Star Framework');
      expect(productPrompt).toContain('OKRs');

      // Clinical frameworks
      expect(clinicalPrompt).toContain('ICH Guidelines');
      expect(clinicalPrompt).toContain('FDA Guidance Documents');
      expect(clinicalPrompt).toContain('Clinical Development Plan');
    });

    it('should generate prompts of appropriate length', () => {
      const prompt = service.generatePersonaPrompt(mockAdvisors.productCPO, testQuestions.productStrategy);

      // Should be comprehensive but not excessive
      expect(prompt.length).toBeGreaterThan(500);
      expect(prompt.length).toBeLessThan(3000);

      // Should have good information density
      const wordCount = prompt.split(/\s+/).length;
      expect(wordCount).toBeGreaterThan(100);
      expect(wordCount).toBeLessThan(500);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null or undefined inputs gracefully', () => {
      // Test null advisor - should return a basic prompt
      const nullAdvisorPrompt = service.generatePersonaPrompt(null as any, testQuestions.generalBusiness);
      expect(nullAdvisorPrompt).toBeDefined();
      expect(nullAdvisorPrompt.length).toBeGreaterThan(50);

      // Test null question - should return a prompt with general guidance
      const nullQuestionPrompt = service.generatePersonaPrompt(mockAdvisors.productCPO, null as any);
      expect(nullQuestionPrompt).toBeDefined();
      expect(nullQuestionPrompt).toContain('Sarah Kim');
      expect(nullQuestionPrompt.length).toBeGreaterThan(50);
    });

    it('should handle very long questions', () => {
      const longQuestion = 'This is a very long question that goes on and on and includes many details about the business context, technical requirements, market conditions, competitive landscape, user needs, and strategic considerations. '.repeat(10);

      const prompt = service.generatePersonaPrompt(mockAdvisors.productCPO, longQuestion);

      expect(prompt).toContain('Sarah Kim');
      expect(prompt).toContain(longQuestion.substring(0, 100)); // Should include part of the question
      expect(prompt.length).toBeGreaterThan(500);
    });

    it('should handle special characters in questions', () => {
      const specialCharQuestion = 'How do I handle $100M+ ARR growth with 50% YoY increase & maintain 99.9% uptime?';

      const prompt = service.generatePersonaPrompt(mockAdvisors.productCPO, specialCharQuestion);

      expect(prompt).toContain('$100M+');
      expect(prompt).toContain('50%');
      expect(prompt).toContain('99.9%');
      expect(prompt).toContain('Sarah Kim');
    });

    it('should handle non-English characters', () => {
      const unicodeQuestion = 'How do I expand to markets like España, Deutschland, and 日本?';

      const prompt = service.generatePersonaPrompt(mockAdvisors.productCPO, unicodeQuestion);

      expect(prompt).toContain('España');
      expect(prompt).toContain('Deutschland');
      expect(prompt).toContain('日本');
      expect(prompt).toContain('Sarah Kim');
    });
  });
});