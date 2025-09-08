/**
 * Persona Consistency Validation Test
 * 
 * Validates that advisor responses maintain consistent persona characteristics
 * across different question types and response generation methods.
 * Tests persona-specific language, expertise demonstration, and framework usage.
 * 
 * Requirements: FR-1, FR-5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PersonaPromptService } from '../../services/personaPromptService';
import { EnhancedStaticResponseGenerator } from '../../services/enhancedStaticResponseGenerator';
import { ResponseOrchestrator } from '../../services/responseOrchestrator';
import { demoModeService } from '../../services/demoModeService';
import type { Advisor } from '../../types/domain';
import type { EnvironmentConfig } from '../../types/llm';

// Test advisors representing different domains and expertise levels
const testAdvisors: Advisor[] = [
  {
    id: 'cpo-001',
    name: 'Sarah Chen',
    expertise: 'Chief Product Officer',
    background: 'Former VP of Product at leading tech companies with 15+ years experience',
    domain: 'productboard',
    isSelected: true,
    credentials: 'MBA Stanford, Former VP Product at Meta',
    specialties: ['Product Strategy', 'Market Analysis', 'Team Leadership', 'Go-to-Market'],
    avatar: '/images/advisors/sarah-chen.jpg'
  },
  {
    id: 'clinical-001',
    name: 'Dr. Emily Watson',
    expertise: 'Clinical Research Specialist',
    background: 'Former FDA reviewer with 20+ years in clinical development',
    domain: 'cliniboard',
    isSelected: true,
    credentials: 'MD Johns Hopkins, PhD Pharmacology, Board Certified',
    specialties: ['Clinical Trials', 'Regulatory Affairs', 'Drug Development', 'Safety Monitoring'],
    avatar: '/images/advisors/emily-watson.jpg'
  },
  {
    id: 'edu-001',
    name: 'Prof. Michael Torres',
    expertise: 'Curriculum Design Expert',
    background: 'Educational technology researcher and curriculum designer',
    domain: 'eduboard',
    isSelected: true,
    credentials: 'PhD Education, 20+ years curriculum development',
    specialties: ['Learning Design', 'Educational Technology', 'Assessment', 'Pedagogy'],
    avatar: '/images/advisors/michael-torres.jpg'
  },
  {
    id: 'naturo-001',
    name: 'Dr. Lisa Park',
    expertise: 'Naturopathic Medicine',
    background: 'Licensed naturopathic doctor specializing in integrative wellness',
    domain: 'remediboard',
    isSelected: true,
    credentials: 'ND, Licensed Naturopathic Doctor, Certified Herbalist',
    specialties: ['Holistic Health', 'Natural Remedies', 'Nutrition', 'Wellness Coaching'],
    avatar: '/images/advisors/lisa-park.jpg'
  }
];

// Test questions designed to elicit persona-specific responses
const testQuestions = {
  strategy: 'How should I approach competitive market analysis for my new product?',
  technical: 'What are the key technical considerations for scaling our platform?',
  process: 'How can I improve our team\'s workflow and collaboration?',
  innovation: 'What emerging trends should I be aware of in my industry?',
  problem_solving: 'We\'re facing declining user engagement. What should we do?'
};

// Expected persona characteristics for validation
const personaCharacteristics = {
  'cpo-001': {
    language: ['strategic', 'market', 'competitive', 'business', 'growth', 'customers'],
    frameworks: ['Jobs-to-be-Done', 'North Star Framework', 'OKRs', 'Product-Market Fit'],
    tone: 'executive',
    perspective: 'business-strategic',
    decisionMaking: 'data-driven'
  },
  'clinical-001': {
    language: ['clinical', 'regulatory', 'safety', 'efficacy', 'protocol', 'compliance'],
    frameworks: ['ICH Guidelines', 'FDA Guidance', 'Clinical Development Plan', 'GCP'],
    tone: 'scientific',
    perspective: 'regulatory-clinical',
    decisionMaking: 'evidence-based'
  },
  'edu-001': {
    language: ['learning', 'educational', 'curriculum', 'pedagogy', 'assessment', 'students'],
    frameworks: ['Bloom\'s Taxonomy', 'Backward Design', 'Learning Objectives', 'Constructivism'],
    tone: 'academic',
    perspective: 'educational-pedagogical',
    decisionMaking: 'research-informed'
  },
  'naturo-001': {
    language: ['holistic', 'natural', 'wellness', 'integrative', 'healing', 'balance'],
    frameworks: ['Functional Medicine', 'Holistic Assessment', 'Natural Healing', 'Mind-Body'],
    tone: 'compassionate',
    perspective: 'holistic-integrative',
    decisionMaking: 'patient-centered'
  }
};

describe('Persona Consistency Validation', () => {
  let personaPromptService: PersonaPromptService;
  let staticResponseGenerator: EnhancedStaticResponseGenerator;
  let responseOrchestrator: ResponseOrchestrator;

  const mockEnvironmentConfig: EnvironmentConfig = {
    llmProviders: {},
    defaultProvider: 'openai',
    enableCaching: false,
    maxConcurrentRequests: 5,
    responseTimeout: 10000
  };

  beforeEach(() => {
    personaPromptService = new PersonaPromptService();
    staticResponseGenerator = new EnhancedStaticResponseGenerator();
    responseOrchestrator = new ResponseOrchestrator(mockEnvironmentConfig);
    
    // Mock demo mode to be inactive for these tests
    vi.spyOn(demoModeService, 'isDemoModeActive').mockReturnValue(false);
  });

  describe('Persona Prompt Generation Consistency', () => {
    it('should generate persona-specific prompts that reflect advisor expertise', () => {
      testAdvisors.forEach(advisor => {
        const prompt = personaPromptService.generatePersonaPrompt(advisor, testQuestions.strategy);
        const characteristics = personaCharacteristics[advisor.id];
        
        // Verify prompt contains advisor-specific language
        const promptLower = prompt.toLowerCase();
        const matchingLanguage = characteristics.language.filter(term => 
          promptLower.includes(term.toLowerCase())
        );
        
        expect(matchingLanguage.length).toBeGreaterThan(0, 
          `Prompt for ${advisor.name} should contain domain-specific language`);
        
        // Verify prompt mentions relevant frameworks
        const mentionedFrameworks = characteristics.frameworks.filter(framework =>
          prompt.includes(framework)
        );
        
        expect(mentionedFrameworks.length).toBeGreaterThan(0,
          `Prompt for ${advisor.name} should mention relevant frameworks`);
        
        // Verify prompt includes advisor credentials and background
        expect(prompt).toContain(advisor.expertise);
        expect(prompt).toContain(advisor.background);
      });
    });

    it('should adapt prompts based on question type while maintaining persona', () => {
      const advisor = testAdvisors[0]; // CPO
      
      Object.entries(testQuestions).forEach(([questionType, question]) => {
        const prompt = personaPromptService.generatePersonaPrompt(advisor, question);
        
        // Should always maintain core persona elements
        expect(prompt).toContain(advisor.expertise);
        expect(prompt).toContain('Chief Product Officer');
        
        // Should adapt to question context
        if (questionType === 'technical') {
          expect(prompt.toLowerCase()).toMatch(/technical|technology|engineering|architecture/);
        } else if (questionType === 'strategy') {
          expect(prompt.toLowerCase()).toMatch(/strategic|strategy|market|competitive/);
        }
      });
    });
  });

  describe('Static Response Persona Consistency', () => {
    it('should generate responses that reflect advisor persona characteristics', async () => {
      for (const advisor of testAdvisors) {
        const response = await staticResponseGenerator.generateResponse(
          advisor,
          testQuestions.strategy,
          advisor.domain
        );
        
        const characteristics = personaCharacteristics[advisor.id];
        const contentLower = response.content.toLowerCase();
        
        // Verify response contains persona-specific language
        const matchingLanguage = characteristics.language.filter(term =>
          contentLower.includes(term.toLowerCase())
        );
        
        expect(matchingLanguage.length).toBeGreaterThan(0,
          `Response from ${advisor.name} should use domain-specific language`);
        
        // Verify response mentions relevant frameworks
        const mentionedFrameworks = characteristics.frameworks.filter(framework =>
          response.content.includes(framework)
        );
        
        expect(mentionedFrameworks.length).toBeGreaterThan(0,
          `Response from ${advisor.name} should reference relevant frameworks`);
        
        // Verify response reflects advisor's perspective
        expect(response.content).toMatch(new RegExp(advisor.expertise, 'i'));
      }
    });

    it('should maintain consistent tone across different question types', async () => {
      const advisor = testAdvisors[1]; // Clinical specialist
      const responses: string[] = [];
      
      // Generate responses for different question types
      for (const question of Object.values(testQuestions)) {
        const response = await staticResponseGenerator.generateResponse(
          advisor,
          question,
          advisor.domain
        );
        responses.push(response.content);
      }
      
      // All responses should maintain scientific/clinical tone
      responses.forEach(content => {
        const contentLower = content.toLowerCase();
        
        // Should use clinical/scientific language
        expect(contentLower).toMatch(/clinical|research|evidence|study|protocol|safety/);
        
        // Should not use overly casual language
        expect(contentLower).not.toMatch(/awesome|cool|amazing|super/);
        
        // Should maintain professional tone
        expect(content).toMatch(/^[A-Z]/); // Starts with capital letter
        expect(content.length).toBeGreaterThan(100); // Substantial response
      });
    });
  });

  describe('Cross-Domain Persona Differentiation', () => {
    it('should generate distinctly different responses for the same question across domains', async () => {
      const question = testQuestions.innovation;
      const responses: Array<{ advisor: Advisor; content: string }> = [];
      
      // Generate responses from all advisors for the same question
      for (const advisor of testAdvisors) {
        const response = await staticResponseGenerator.generateResponse(
          advisor,
          question,
          advisor.domain
        );
        responses.push({ advisor, content: response.content });
      }
      
      // Verify responses are sufficiently different
      for (let i = 0; i < responses.length; i++) {
        for (let j = i + 1; j < responses.length; j++) {
          const response1 = responses[i];
          const response2 = responses[j];
          
          // Calculate simple similarity (word overlap)
          const words1 = new Set(response1.content.toLowerCase().split(/\s+/));
          const words2 = new Set(response2.content.toLowerCase().split(/\s+/));
          const intersection = new Set([...words1].filter(x => words2.has(x)));
          const union = new Set([...words1, ...words2]);
          const similarity = intersection.size / union.size;
          
          // Responses should be less than 30% similar
          expect(similarity).toBeLessThan(0.3,
            `Responses from ${response1.advisor.name} and ${response2.advisor.name} are too similar`);
          
          // Verify domain-specific differences
          const char1 = personaCharacteristics[response1.advisor.id];
          const char2 = personaCharacteristics[response2.advisor.id];
          
          // Each response should contain its own domain language
          const content1Lower = response1.content.toLowerCase();
          const content2Lower = response2.content.toLowerCase();
          
          const domain1Matches = char1.language.filter(term => 
            content1Lower.includes(term.toLowerCase())
          ).length;
          const domain2Matches = char2.language.filter(term => 
            content2Lower.includes(term.toLowerCase())
          ).length;
          
          expect(domain1Matches).toBeGreaterThan(0);
          expect(domain2Matches).toBeGreaterThan(0);
        }
      }
    });

    it('should use appropriate frameworks for each domain', async () => {
      const question = testQuestions.process;
      
      for (const advisor of testAdvisors) {
        const response = await staticResponseGenerator.generateResponse(
          advisor,
          question,
          advisor.domain
        );
        
        const characteristics = personaCharacteristics[advisor.id];
        const content = response.content;
        
        // Should mention at least one relevant framework
        const relevantFrameworks = characteristics.frameworks.filter(framework =>
          content.includes(framework)
        );
        
        expect(relevantFrameworks.length).toBeGreaterThan(0,
          `${advisor.name} should reference domain-appropriate frameworks`);
        
        // Should not mention frameworks from other domains
        const otherAdvisors = testAdvisors.filter(a => a.id !== advisor.id);
        for (const otherAdvisor of otherAdvisors) {
          const otherCharacteristics = personaCharacteristics[otherAdvisor.id];
          const inappropriateFrameworks = otherCharacteristics.frameworks.filter(framework =>
            content.includes(framework) && !characteristics.frameworks.includes(framework)
          );
          
          expect(inappropriateFrameworks.length).toBe(0,
            `${advisor.name} should not reference frameworks from other domains: ${inappropriateFrameworks.join(', ')}`);
        }
      }
    });
  });

  describe('Response Quality and Depth Validation', () => {
    it('should generate responses with appropriate depth for advisor expertise level', async () => {
      const question = testQuestions.problem_solving;
      
      for (const advisor of testAdvisors) {
        const response = await staticResponseGenerator.generateResponse(
          advisor,
          question,
          advisor.domain
        );
        
        const content = response.content;
        
        // Response should be substantial (indicating expertise depth)
        expect(content.length).toBeGreaterThan(200,
          `Response from ${advisor.name} should demonstrate expertise depth`);
        
        // Should contain actionable insights
        expect(content.toLowerCase()).toMatch(/recommend|suggest|consider|implement|strategy|approach/);
        
        // Should reference specific methodologies or best practices
        const characteristics = personaCharacteristics[advisor.id];
        const hasMethodology = characteristics.frameworks.some(framework =>
          content.includes(framework)
        ) || characteristics.language.some(term =>
          content.toLowerCase().includes(term.toLowerCase())
        );
        
        expect(hasMethodology).toBe(true,
          `Response from ${advisor.name} should reference specific methodologies`);
      }
    });

    it('should maintain professional credibility in responses', async () => {
      const question = testQuestions.technical;
      
      for (const advisor of testAdvisors) {
        const response = await staticResponseGenerator.generateResponse(
          advisor,
          question,
          advisor.domain
        );
        
        const content = response.content;
        
        // Should not make unrealistic claims
        expect(content.toLowerCase()).not.toMatch(/guarantee|100%|never fail|always work|perfect solution/);
        
        // Should acknowledge complexity when appropriate
        expect(content.toLowerCase()).toMatch(/consider|depends|may|might|typically|often|usually/);
        
        // Should reference advisor's background appropriately
        const backgroundTerms = advisor.background.toLowerCase().split(/\s+/);
        const contentLower = content.toLowerCase();
        const backgroundMentions = backgroundTerms.filter(term => 
          term.length > 3 && contentLower.includes(term)
        );
        
        expect(backgroundMentions.length).toBeGreaterThan(0,
          `Response should reflect ${advisor.name}'s background`);
      }
    });
  });

  describe('Consistency Across Response Generation Methods', () => {
    it('should maintain persona consistency between static and LLM responses', async () => {
      // This test would compare static responses with mock LLM responses
      // to ensure persona characteristics are maintained across generation methods
      
      const advisor = testAdvisors[0]; // CPO
      const question = testQuestions.strategy;
      
      // Generate static response
      const staticResponse = await staticResponseGenerator.generateResponse(
        advisor,
        question,
        advisor.domain
      );
      
      // Mock LLM response with similar characteristics
      const mockLLMResponse = {
        content: `As a Chief Product Officer with extensive experience in product strategy, I recommend focusing on competitive differentiation through Jobs-to-be-Done analysis. Consider implementing a North Star Framework to align your team around key business metrics and customer outcomes.`,
        metadata: {
          responseType: 'llm' as const,
          provider: 'openai',
          processingTime: 1200,
          confidence: 0.9
        }
      };
      
      // Both responses should contain similar persona characteristics
      const characteristics = personaCharacteristics[advisor.id];
      
      [staticResponse.content, mockLLMResponse.content].forEach((content, index) => {
        const responseType = index === 0 ? 'static' : 'LLM';
        const contentLower = content.toLowerCase();
        
        // Should contain domain-specific language
        const languageMatches = characteristics.language.filter(term =>
          contentLower.includes(term.toLowerCase())
        );
        
        expect(languageMatches.length).toBeGreaterThan(0,
          `${responseType} response should contain domain-specific language`);
        
        // Should reference appropriate frameworks
        const frameworkMatches = characteristics.frameworks.filter(framework =>
          content.includes(framework)
        );
        
        expect(frameworkMatches.length).toBeGreaterThan(0,
          `${responseType} response should reference appropriate frameworks`);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should maintain persona consistency even with unusual questions', async () => {
      const unusualQuestions = [
        'What is the meaning of life?',
        'How do I bake a cake?',
        'What should I wear to a wedding?',
        'How do I fix my car?'
      ];
      
      for (const advisor of testAdvisors) {
        for (const question of unusualQuestions) {
          const response = await staticResponseGenerator.generateResponse(
            advisor,
            question,
            advisor.domain
          );
          
          // Should still maintain professional tone
          expect(response.content).toMatch(/^[A-Z]/);
          expect(response.content.length).toBeGreaterThan(50);
          
          // Should acknowledge the question is outside their expertise
          expect(response.content.toLowerCase()).toMatch(
            /outside|beyond|not my expertise|recommend consulting|suggest speaking/
          );
          
          // Should still identify themselves appropriately
          expect(response.content).toMatch(new RegExp(advisor.expertise, 'i'));
        }
      }
    });

    it('should handle empty or very short questions gracefully', async () => {
      const shortQuestions = ['', 'Help', 'What?', 'How?'];
      
      for (const advisor of testAdvisors) {
        for (const question of shortQuestions) {
          const response = await staticResponseGenerator.generateResponse(
            advisor,
            question,
            advisor.domain
          );
          
          // Should provide a helpful response asking for clarification
          expect(response.content.toLowerCase()).toMatch(
            /clarify|specific|more information|elaborate|details/
          );
          
          // Should still maintain persona
          expect(response.content).toMatch(new RegExp(advisor.expertise, 'i'));
        }
      }
    });
  });
});