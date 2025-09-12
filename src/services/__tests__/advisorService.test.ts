import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AdvisorService, AdvisorServiceError } from '../advisorService';
import type { Advisor, Domain } from '../../types/domain';

// Mock data
const mockDomain: Domain = {
  id: 'cliniboard',
  name: 'Cliniboard',
  description: 'Clinical research board',
  theme: {
    primary: '#3B82F6',
    secondary: '#1E40AF',
    accent: '#60A5FA',
    background: '#F8FAFC',
    text: '#1E293B',
  },
  advisors: [],
};

const mockAdvisor: Advisor = {
  id: 'test-advisor-1',
  name: 'Dr. Test Advisor',
  expertise: 'Clinical Trials Design',
  background: 'Former FDA officer with 15+ years experience',
  domain: mockDomain,
  isSelected: true,
};

const mockAdvisor2: Advisor = {
  id: 'test-advisor-2',
  name: 'Dr. Second Advisor',
  expertise: 'Regulatory Affairs',
  background: 'Regulatory specialist with global experience',
  domain: mockDomain,
  isSelected: true,
};

describe('AdvisorService', () => {
  let advisorService: AdvisorService;

  beforeEach(() => {
    advisorService = new AdvisorService({
      timeout: 5000,
      retryAttempts: 2,
      retryDelay: 100,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateAdvisorResponse', () => {
    it('should generate a response for a single advisor', async () => {
      const prompt = 'What are the key considerations for Phase 2 trial design?';
      
      const response = await advisorService.generateAdvisorResponse(mockAdvisor, prompt);
      
      expect(response).toBeDefined();
      expect(response.advisorId).toBe(mockAdvisor.id);
      expect(response.content).toBeTruthy();
      expect(response.timestamp).toBeInstanceOf(Date);
      expect(response.persona).toBeDefined();
      expect(response.persona.name).toBe(mockAdvisor.name);
      expect(response.persona.expertise).toBe(mockAdvisor.expertise);
    });

    it('should create appropriate persona config from advisor data', async () => {
      const prompt = 'Test prompt';
      
      const response = await advisorService.generateAdvisorResponse(mockAdvisor, prompt);
      
      expect(response.persona.name).toBe(mockAdvisor.name);
      expect(response.persona.expertise).toBe(mockAdvisor.expertise);
      expect(response.persona.background).toBe(mockAdvisor.background);
      expect(response.persona.tone).toBe('professional, evidence-based, regulatory-focused');
      expect(Array.isArray(response.persona.specialization)).toBe(true);
    });

    it('should generate domain-specific responses for clinical advisors', async () => {
      const prompt = 'Evaluate this trial protocol for safety concerns';
      
      const response = await advisorService.generateAdvisorResponse(mockAdvisor, prompt);
      
      expect(response.content.toLowerCase()).toMatch(
        /(regulatory|fda|clinical|safety|trial|compliance|ich-gcp)/
      );
    });

    it('should handle empty prompts', async () => {
      await expect(
        advisorService.generateAdvisorResponse(mockAdvisor, '')
      ).rejects.toThrow();
    });
  });

  describe('generateMultipleResponses', () => {
    it('should generate responses from multiple advisors', async () => {
      const advisors = [mockAdvisor, mockAdvisor2];
      const prompt = 'What are the regulatory requirements for this indication?';
      
      const responses = await advisorService.generateMultipleResponses(advisors, prompt);
      
      expect(responses).toHaveLength(2);
      expect(responses[0].advisorId).toBe(mockAdvisor.id);
      expect(responses[1].advisorId).toBe(mockAdvisor2.id);
      
      responses.forEach(response => {
        expect(response.content).toBeTruthy();
        expect(response.timestamp).toBeInstanceOf(Date);
        expect(response.persona).toBeDefined();
      });
    });

    it('should handle partial failures gracefully', async () => {
      // Mock one advisor to fail
      const failingAdvisor: Advisor = {
        ...mockAdvisor,
        id: 'failing-advisor',
        name: 'Failing Advisor',
      };

      // Spy on the private method to simulate failure for specific advisor
      const originalMethod = advisorService['generateAdvisorResponseWithRetry'];
      vi.spyOn(advisorService as any, 'generateAdvisorResponseWithRetry')
        .mockImplementation(async (advisor: Advisor, prompt: string) => {
          if (advisor.id === 'failing-advisor') {
            throw new AdvisorServiceError('Simulated failure', advisor.id, 'NETWORK_ERROR');
          }
          return originalMethod.call(advisorService, advisor, prompt);
        });

      const advisors = [mockAdvisor, failingAdvisor];
      const prompt = 'Test prompt';
      
      const responses = await advisorService.generateMultipleResponses(advisors, prompt);
      
      // Should return successful responses even if some fail
      expect(responses).toHaveLength(1);
      expect(responses[0].advisorId).toBe(mockAdvisor.id);
    });

    it('should throw error if all advisors fail', async () => {
      // Mock all advisors to fail
      vi.spyOn(advisorService as any, 'generateAdvisorResponseWithRetry')
        .mockRejectedValue(new AdvisorServiceError('All failed', 'test', 'NETWORK_ERROR'));

      const advisors = [mockAdvisor, mockAdvisor2];
      const prompt = 'Test prompt';
      
      await expect(
        advisorService.generateMultipleResponses(advisors, prompt)
      ).rejects.toThrow('All advisor responses failed');
    });
  });

  describe('domain-specific responses', () => {
    it('should generate clinical responses for cliniboard domain', async () => {
      const clinicalAdvisor: Advisor = {
        ...mockAdvisor,
        domain: { ...mockDomain, id: 'cliniboard' },
      };
      
      const response = await advisorService.generateAdvisorResponse(
        clinicalAdvisor, 
        'Review this adverse event report'
      );
      
      expect(response.content.toLowerCase()).toMatch(
        /(regulatory|fda|clinical|safety|adverse|susar|pharmacovigilance)/
      );
    });

    it('should generate education responses for eduboard domain', async () => {
      const eduDomain: Domain = { ...mockDomain, id: 'eduboard' };
      const eduAdvisor: Advisor = {
        ...mockAdvisor,
        domain: eduDomain,
        expertise: 'Educational Reform',
      };
      
      const response = await advisorService.generateAdvisorResponse(
        eduAdvisor, 
        'How can we improve curriculum design?'
      );
      
      expect(response.content.toLowerCase()).toMatch(
        /(educational|curriculum|pedagogical|learning|student|equity)/
      );
    });

    it('should generate remedies responses for remediboard domain', async () => {
      const remediesDomain: Domain = { ...mockDomain, id: 'remediboard' };
      const remediesAdvisor: Advisor = {
        ...mockAdvisor,
        domain: remediesDomain,
        expertise: 'Traditional Medicine',
      };
      
      const response = await advisorService.generateAdvisorResponse(
        remediesAdvisor, 
        'What natural treatments are available?'
      );
      
      expect(response.content.toLowerCase()).toMatch(
        /(holistic|traditional|natural|healing|wellness|treatment)/
      );
    });
  });

  describe('error handling', () => {
    it('should categorize timeout errors correctly', () => {
      const timeoutError = new Error('Request timeout');
      const categorized = advisorService['categorizeError'](timeoutError);
      expect(categorized).toBe('TIMEOUT');
    });

    it('should categorize network errors correctly', () => {
      const networkError = new Error('Network connection failed');
      const categorized = advisorService['categorizeError'](networkError);
      expect(categorized).toBe('NETWORK_ERROR');
    });

    it('should categorize unknown errors correctly', () => {
      const unknownError = new Error('Something went wrong');
      const categorized = advisorService['categorizeError'](unknownError);
      expect(categorized).toBe('UNKNOWN');
    });

    it('should handle non-Error objects', () => {
      const categorized = advisorService['categorizeError']('string error');
      expect(categorized).toBe('UNKNOWN');
    });
  });

  describe('configuration', () => {
    it('should use default configuration', () => {
      const defaultService = new AdvisorService();
      const config = defaultService.getConfig();
      
      expect(config.timeout).toBe(30000);
      expect(config.retryAttempts).toBe(3);
      expect(config.retryDelay).toBe(1000);
    });

    it('should allow configuration updates', () => {
      const newConfig = {
        timeout: 10000,
        retryAttempts: 5,
      };
      
      advisorService.updateConfig(newConfig);
      const config = advisorService.getConfig();
      
      expect(config.timeout).toBe(10000);
      expect(config.retryAttempts).toBe(5);
      expect(config.retryDelay).toBe(100); // Should keep original value
    });
  });

  describe('persona configuration', () => {
    it('should extract specializations from expertise', () => {
      const expertise = 'Clinical Trials, Regulatory Affairs, Drug Development';
      const specializations = advisorService['extractSpecializations'](expertise);
      
      expect(specializations).toContain('clinical');
      expect(specializations).toContain('trials');
      expect(specializations).toContain('regulatory');
      expect(specializations).toContain('affairs');
      expect(specializations.length).toBeLessThanOrEqual(5);
    });

    it('should get correct domain tone', () => {
      expect(advisorService['getDomainTone']('cliniboard')).toBe(
        'professional, evidence-based, regulatory-focused'
      );
      expect(advisorService['getDomainTone']('eduboard')).toBe(
        'pedagogical, inclusive, reform-minded'
      );
      expect(advisorService['getDomainTone']('remediboard')).toBe(
        'holistic, traditional, wellness-oriented'
      );
      expect(advisorService['getDomainTone']('unknown')).toBe(
        'professional, knowledgeable'
      );
    });
  });

  describe('generateResponseSummary', () => {
    const mockResponses = [
      {
        advisorId: mockAdvisor.id,
        content: 'From a clinical research perspective, this requires careful regulatory consideration. We must ensure compliance with FDA guidelines and implement robust safety monitoring protocols.',
        timestamp: new Date(),
        persona: {
          name: mockAdvisor.name,
          expertise: mockAdvisor.expertise,
          background: mockAdvisor.background,
        },
      },
      {
        advisorId: mockAdvisor2.id,
        content: 'Based on regulatory affairs experience, I recommend establishing clear documentation processes. The regulatory pathway should align with current FDA expectations for this indication.',
        timestamp: new Date(),
        persona: {
          name: mockAdvisor2.name,
          expertise: mockAdvisor2.expertise,
          background: mockAdvisor2.background,
        },
      },
    ];

    it('should generate summary for multiple responses', async () => {
      const prompt = 'What are the key regulatory considerations?';
      
      const summary = await advisorService.generateResponseSummary(mockResponses, prompt);
      
      expect(summary).toBeTruthy();
      expect(summary).toContain('Advisory Board Summary');
      expect(summary).toContain(prompt);
      expect(summary).toContain(mockAdvisor.name);
      expect(summary).toContain(mockAdvisor2.name);
      expect(summary).toContain('Clinical Research');
    });

    it('should handle single response summary', async () => {
      const singleResponse = [mockResponses[0]];
      const prompt = 'Test question';
      
      const summary = await advisorService.generateResponseSummary(singleResponse, prompt);
      
      expect(summary).toContain('Single Advisor Summary');
      expect(summary).toContain(mockAdvisor.name);
      expect(summary).toContain(mockAdvisor.expertise);
    });

    it('should throw error for empty responses', async () => {
      const prompt = 'Test question';
      
      await expect(
        advisorService.generateResponseSummary([], prompt)
      ).rejects.toThrow('Cannot generate summary: no responses provided');
    });

    it('should extract key insights from responses', () => {
      const insights = advisorService['extractKeyInsights'](mockResponses);
      
      expect(insights.length).toBeGreaterThan(0);
      expect(insights.some(insight => 
        insight.includes('recommend') || 
        insight.includes('must') || 
        insight.includes('should')
      )).toBe(true);
    });

    it('should find common themes across responses', () => {
      const themes = advisorService['findCommonThemes'](mockResponses);
      
      expect(Array.isArray(themes)).toBe(true);
      // Should find common regulatory theme
      expect(themes.some(theme => 
        theme.toLowerCase().includes('regulatory')
      )).toBe(true);
    });

    it('should identify unique perspectives', () => {
      const perspectives = advisorService['identifyUniquePerspectives'](mockResponses);
      
      expect(perspectives.length).toBe(2);
      expect(perspectives[0]).toContain(mockAdvisor.name);
      expect(perspectives[1]).toContain(mockAdvisor2.name);
      expect(perspectives.some(p => p.includes('regulatory'))).toBe(true);
    });

    it('should generate appropriate recommendations', () => {
      const domains = ['Clinical Research'];
      const recommendation = advisorService['generateRecommendation'](mockResponses, domains);
      
      expect(recommendation).toBeTruthy();
      expect(recommendation.toLowerCase()).toContain('clinical research');
    });

    it('should handle multi-domain recommendations', () => {
      const multiDomainResponses = [
        mockResponses[0],
        {
          ...mockResponses[1],
          persona: {
            ...mockResponses[1].persona,
            expertise: 'Educational Reform',
          },
        },
      ];
      
      const domains = ['Clinical Research', 'Education'];
      const recommendation = advisorService['generateRecommendation'](multiDomainResponses, domains);
      
      expect(recommendation).toContain('multi-domain');
      expect(recommendation).toContain('integrated approach');
    });

    it('should extract correct domain from expertise', () => {
      expect(advisorService['getDomainFromExpertise']('Clinical Trials Design')).toBe('Clinical Research');
      expect(advisorService['getDomainFromExpertise']('Educational Reform')).toBe('Education');
      expect(advisorService['getDomainFromExpertise']('Traditional Medicine')).toBe('Natural Remedies');
      expect(advisorService['getDomainFromExpertise']('Unknown Field')).toBe('General Advisory');
    });
  });
});
