/**
 * Test suite for PersonaPromptService
 * 
 * Tests comprehensive persona prompt library functionality including:
 * - Persona prompt generation for all advisor types
 * - LLM integration capabilities
 * - Static response generation
 * - Question analysis and persona matching
 * - Error handling and fallback mechanisms
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  PersonaPromptService,
  personaPromptService,
  PERSONA_LIBRARY,
  PERSONA_ROLE_MAPPING,
  DOMAIN_PERSONAS,
  generatePersonaPrompt,
  generatePersonaResponse,
  getPersonaConfig,
  getDomainPersonas
} from '../personaPromptService';
import { BoardExpert } from '../../lib/boards';

// Mock BoardExpert data for testing
const mockProductAdvisor: BoardExpert = {
  id: 'sarah-kim',
  name: 'Sarah Kim',
  code: 'CPO',
  role: 'Chief Product Officer',
  blurb: 'Former CPO at Stripe, scaled from startup to $95B valuation',
  credentials: 'MBA Stanford, Former Stripe CPO',
  avatar: '/images/advisors/sarah-kim.svg',
  specialties: ['Product Strategy', '0-to-1 Products', 'Platform Scaling']
};

const mockClinicalAdvisor: BoardExpert = {
  id: 'sarah-chen',
  name: 'Dr. Sarah Chen',
  code: 'CPO',
  role: 'Clinical Research Strategy',
  blurb: 'Former Pfizer VP who led 50+ Phase III trials to FDA approval',
  credentials: 'MD, PhD, Former FDA Advisory Committee Member',
  avatar: '/images/advisors/dr-sarah-chen.svg',
  specialties: ['Phase III Trials', 'FDA Interactions', 'Global Regulatory Strategy']
};

const mockUnknownAdvisor: BoardExpert = {
  id: 'unknown-advisor',
  name: 'Unknown Advisor',
  code: 'UNK',
  role: 'Unknown Role',
  blurb: 'Test advisor without persona definition',
  credentials: 'Test Credentials',
  avatar: '/images/advisors/unknown.svg',
  specialties: ['General Advice']
};

describe('PersonaPromptService', () => {
  let service: PersonaPromptService;

  beforeEach(() => {
    service = new PersonaPromptService();
  });

  describe('Persona Library Structure', () => {
    it('should have comprehensive persona definitions for key advisors', () => {
      // ProductBoard personas
      expect(PERSONA_LIBRARY['sarah-kim']).toBeDefined();
      expect(PERSONA_LIBRARY['marcus-chen']).toBeDefined();
      expect(PERSONA_LIBRARY['elena-rodriguez']).toBeDefined();
      expect(PERSONA_LIBRARY['alex-thompson']).toBeDefined();
      expect(PERSONA_LIBRARY['ryan-martinez']).toBeDefined();
      expect(PERSONA_LIBRARY['michael-zhang']).toBeDefined();

      // CliniBoard personas
      expect(PERSONA_LIBRARY['sarah-chen']).toBeDefined();
      expect(PERSONA_LIBRARY['michael-rodriguez']).toBeDefined();
    });

    it('should have complete persona configurations with all required fields', () => {
      const requiredFields = ['id', 'role', 'systemPrompt', 'roleContext', 'expertiseAreas', 'responseStyle', 'frameworks', 'responseTemplates'];
      
      Object.values(PERSONA_LIBRARY).forEach(persona => {
        requiredFields.forEach(field => {
          expect(persona[field as keyof typeof persona]).toBeDefined();
          expect(persona[field as keyof typeof persona]).not.toBe('');
        });
      });
    });

    it('should have response templates for all question types', () => {
      Object.values(PERSONA_LIBRARY).forEach(persona => {
        expect(persona.responseTemplates.general).toBeDefined();
        // At least general template should be present
        expect(Object.keys(persona.responseTemplates).length).toBeGreaterThan(0);
      });
    });

    it('should have proper domain-persona mappings', () => {
      expect(DOMAIN_PERSONAS.productboard).toContain('sarah-kim');
      expect(DOMAIN_PERSONAS.cliniboard).toContain('sarah-chen');
    });

    it('should have role-persona mappings', () => {
      expect(PERSONA_ROLE_MAPPING.product_strategy).toContain('sarah-kim');
      expect(PERSONA_ROLE_MAPPING.clinical_strategy).toContain('sarah-chen');
    });
  });

  describe('generatePersonaPrompt', () => {
    it('should generate comprehensive persona prompt for known advisor', () => {
      const question = 'How do I achieve product-market fit for my B2B SaaS platform?';
      const prompt = service.generatePersonaPrompt(mockProductAdvisor, question);

      expect(prompt).toContain('Sarah Kim');
      expect(prompt).toContain('Chief Product Officer');
      expect(prompt).toContain('Former CPO at Stripe');
      expect(prompt).toContain('Product Strategy');
      expect(prompt).toContain(question);
      expect(prompt).toContain('ROLE CONTEXT:');
      expect(prompt).toContain('EXPERTISE AREAS:');
      expect(prompt).toContain('RESPONSE STYLE:');
      expect(prompt).toContain('FRAMEWORKS TO REFERENCE:');
    });

    it('should generate fallback prompt for unknown advisor', () => {
      const question = 'What should I do?';
      const prompt = service.generatePersonaPrompt(mockUnknownAdvisor, question);

      expect(prompt).toContain('Unknown Advisor');
      expect(prompt).toContain('Unknown Role');
      expect(prompt).toContain('General Advice');
      expect(prompt).toContain(question);
    });

    it('should analyze question type correctly', () => {
      const strategyQuestion = 'What is the best strategy for market expansion?';
      const ideationQuestion = 'I have an idea for a new product feature';
      const technicalQuestion = 'How should I implement this technical architecture?';
      const generalQuestion = 'Can you help me with this problem?';

      const strategyPrompt = service.generatePersonaPrompt(mockProductAdvisor, strategyQuestion);
      const ideationPrompt = service.generatePersonaPrompt(mockProductAdvisor, ideationQuestion);
      const technicalPrompt = service.generatePersonaPrompt(mockProductAdvisor, technicalQuestion);
      const generalPrompt = service.generatePersonaPrompt(mockProductAdvisor, generalQuestion);

      // Each should use appropriate response template
      expect(strategyPrompt).toContain('From my experience scaling Stripe');
      expect(ideationPrompt).toContain('As someone who built products from zero to billions');
      expect(technicalPrompt).toContain('When we faced similar technical challenges');
      expect(generalPrompt).toContain('Based on my experience as CPO');
    });
  });

  describe('generatePersonaResponse', () => {
    it('should generate enhanced static response when LLM unavailable', async () => {
      const question = 'How do I scale my product team?';
      const response = await service.generatePersonaResponse(mockProductAdvisor, question);

      expect(response).toContain('Strategic Approach');
      expect(response).toContain('Framework Application');
      expect(response).toContain('Implementation Considerations');
      expect(response).toContain('Risk Mitigation');
    });

    it('should handle clinical advisor responses appropriately', async () => {
      const question = 'How do I prepare for FDA submission?';
      const response = await service.generatePersonaResponse(mockClinicalAdvisor, question);

      expect(response).toContain('Clinical Research Strategy');
      expect(response).toContain('FDA');
      expect(response).toContain('regulatory');
    });

    it('should use custom LLM config when provided', async () => {
      const question = 'Test question';
      const config = { temperature: 0.5, maxTokens: 500 };
      
      // Should not throw error and should return response
      const response = await service.generatePersonaResponse(mockProductAdvisor, question, config);
      expect(response).toBeDefined();
      expect(response.length).toBeGreaterThan(0);
    });
  });

  describe('Persona Configuration Management', () => {
    it('should retrieve persona config correctly', () => {
      const config = service.getPersonaConfig('sarah-kim');
      expect(config).toBeDefined();
      expect(config?.id).toBe('sarah-kim');
      expect(config?.role).toBe('Chief Product Officer');
    });

    it('should return undefined for unknown persona', () => {
      const config = service.getPersonaConfig('unknown-persona');
      expect(config).toBeUndefined();
    });

    it('should get all available personas', () => {
      const personas = service.getAvailablePersonas();
      expect(personas).toContain('sarah-kim');
      expect(personas).toContain('sarah-chen');
      expect(personas.length).toBeGreaterThan(5);
    });

    it('should get domain-specific personas', () => {
      const productPersonas = service.getDomainPersonas('productboard');
      expect(productPersonas.length).toBe(6);
      expect(productPersonas.some(p => p.id === 'sarah-kim')).toBe(true);

      const clinicalPersonas = service.getDomainPersonas('cliniboard');
      expect(clinicalPersonas.length).toBe(6);
      expect(clinicalPersonas.some(p => p.id === 'sarah-chen')).toBe(true);
    });

    it('should get personas by role type', () => {
      const strategyPersonas = service.getPersonasByRole('product_strategy');
      expect(strategyPersonas.length).toBeGreaterThan(0);
      expect(strategyPersonas.some(p => p.id === 'sarah-kim')).toBe(true);

      const clinicalPersonas = service.getPersonasByRole('clinical_strategy');
      expect(clinicalPersonas.some(p => p.id === 'sarah-chen')).toBe(true);
    });
  });

  describe('Validation and Error Handling', () => {
    it('should validate persona configurations', () => {
      expect(service.validatePersonaConfig('sarah-kim')).toBe(true);
      expect(service.validatePersonaConfig('unknown-persona')).toBe(false);
    });

    it('should provide persona statistics', () => {
      const stats = service.getPersonaStats();
      expect(stats.totalPersonas).toBeGreaterThan(5);
      expect(stats.domainBreakdown.productboard).toBe(6);
      expect(stats.domainBreakdown.cliniboard).toBe(6);
      expect(stats.roleTypes).toContain('product_strategy');
    });
  });

  describe('Utility Functions', () => {
    it('should work with exported utility functions', () => {
      const prompt = generatePersonaPrompt(mockProductAdvisor, 'Test question');
      expect(prompt).toContain('Sarah Kim');

      const config = getPersonaConfig('sarah-kim');
      expect(config?.id).toBe('sarah-kim');

      const domainPersonas = getDomainPersonas('productboard');
      expect(domainPersonas.length).toBe(6);
    });

    it('should handle async utility functions', async () => {
      const response = await generatePersonaResponse(mockProductAdvisor, 'Test question');
      expect(response).toBeDefined();
      expect(response.length).toBeGreaterThan(0);
    });
  });

  describe('Persona Content Quality', () => {
    it('should have detailed system prompts for each persona', () => {
      Object.values(PERSONA_LIBRARY).forEach(persona => {
        expect(persona.systemPrompt.length).toBeGreaterThan(200);
        expect(persona.systemPrompt).toContain(persona.role);
        expect(persona.systemPrompt).toContain('You are');
      });
    });

    it('should have comprehensive role context', () => {
      Object.values(PERSONA_LIBRARY).forEach(persona => {
        expect(persona.roleContext.length).toBeGreaterThan(50);
        expect(persona.expertiseAreas.length).toBeGreaterThan(2);
        expect(persona.frameworks.length).toBeGreaterThan(2);
      });
    });

    it('should have domain-appropriate expertise areas', () => {
      const productPersona = PERSONA_LIBRARY['sarah-kim'];
      expect(productPersona.expertiseAreas).toContain('Product Strategy');

      const clinicalPersona = PERSONA_LIBRARY['sarah-chen'];
      expect(clinicalPersona.expertiseAreas).toContain('Phase III Trials');
    });

    it('should have appropriate frameworks for each domain', () => {
      const productPersona = PERSONA_LIBRARY['sarah-kim'];
      expect(productPersona.frameworks).toContain('Jobs-to-be-Done');

      const clinicalPersona = PERSONA_LIBRARY['sarah-chen'];
      expect(clinicalPersona.frameworks).toContain('ICH Guidelines');
    });
  });

  describe('Integration with BoardExpert Interface', () => {
    it('should work seamlessly with existing BoardExpert data structure', () => {
      // Test that persona IDs match advisor IDs from boards.ts
      const productAdvisorIds = ['sarah-kim', 'marcus-chen', 'elena-rodriguez', 'alex-thompson', 'ryan-martinez', 'michael-zhang'];
      
      productAdvisorIds.forEach(id => {
        expect(PERSONA_LIBRARY[id]).toBeDefined();
        expect(service.validatePersonaConfig(id)).toBe(true);
      });
    });

    it('should handle advisor specialties mapping', () => {
      const sarahPersona = PERSONA_LIBRARY['sarah-kim'];
      expect(sarahPersona.expertiseAreas).toEqual(
        expect.arrayContaining(['Product Strategy', '0-to-1 Products', 'Platform Scaling'])
      );
    });
  });
});

describe('Persona Library Content Validation', () => {
  describe('ProductBoard Personas', () => {
    it('should have comprehensive CPO persona (Sarah Kim)', () => {
      const persona = PERSONA_LIBRARY['sarah-kim'];
      expect(persona.role).toBe('Chief Product Officer');
      expect(persona.systemPrompt).toContain('Stripe');
      expect(persona.systemPrompt).toContain('$1M to $1B ARR');
      expect(persona.expertiseAreas).toContain('Product Strategy');
      expect(persona.frameworks).toContain('Jobs-to-be-Done');
    });

    it('should have detailed PM persona (Marcus Chen)', () => {
      const persona = PERSONA_LIBRARY['marcus-chen'];
      expect(persona.role).toBe('Senior Product Manager');
      expect(persona.systemPrompt).toContain('Google');
      expect(persona.systemPrompt).toContain('100M+ users');
      expect(persona.expertiseAreas).toContain('User Research');
      expect(persona.frameworks).toContain('Design Thinking');
    });

    it('should have comprehensive design persona (Elena Rodriguez)', () => {
      const persona = PERSONA_LIBRARY['elena-rodriguez'];
      expect(persona.role).toBe('Head of Design');
      expect(persona.systemPrompt).toContain('Airbnb');
      expect(persona.expertiseAreas).toContain('Design Systems');
      expect(persona.frameworks).toContain('Design Thinking');
    });
  });

  describe('CliniBoard Personas', () => {
    it('should have detailed clinical strategy persona (Sarah Chen)', () => {
      const persona = PERSONA_LIBRARY['sarah-chen'];
      expect(persona.role).toBe('Clinical Research Strategy');
      expect(persona.systemPrompt).toContain('Pfizer');
      expect(persona.systemPrompt).toContain('Phase III');
      expect(persona.expertiseAreas).toContain('FDA Interactions');
      expect(persona.frameworks).toContain('ICH Guidelines');
    });

    it('should have regulatory affairs persona (Michael Rodriguez)', () => {
      const persona = PERSONA_LIBRARY['michael-rodriguez'];
      expect(persona.role).toBe('Regulatory Affairs Director');
      expect(persona.systemPrompt).toContain('FDA CDER Director');
      expect(persona.expertiseAreas).toContain('FDA Submissions');
      expect(persona.frameworks).toContain('FDA Submission Guidelines');
    });
  });
});
