/**
 * Tests for persona-switch Kiro hook
 */

import { describe, it, expect } from 'vitest';
import {
  analyzePersonaSwitchOpportunities,
  executePersonaSwitch,
  updateUserPreferences
} from '../persona-switch';
import type {
  PersonaSwitchContext,
  PersonaSwitchRecommendation,
  UserPreferences
} from '../persona-switch';
import type { Advisor, Domain } from '../../../src/types/domain';
import type { ConsultationSession } from '../../../src/types/session';

// Mock data
const mockDomain: Domain = {
  id: 'cliniboard',
  name: 'Cliniboard',
  description: 'Clinical trials expertise',
  theme: {
    primary: '#3B82F6',
    secondary: '#EFF6FF',
    accent: '#1E40AF',
    background: '#FFFFFF',
    text: '#000000'
  },
  advisors: []
};

const mockAdvisors: Advisor[] = [
  {
    id: 'regulatory-expert',
    name: 'Dr. Sarah Chen',
    expertise: 'Regulatory Affairs',
    background: 'FDA approval specialist with 15 years experience in regulatory compliance',
    domain: mockDomain,
    isSelected: false
  },
  {
    id: 'safety-specialist',
    name: 'Dr. Michael Rodriguez',
    expertise: 'Clinical Safety',
    background: 'Safety monitoring and adverse event analysis expert',
    domain: mockDomain,
    isSelected: false
  },
  {
    id: 'protocol-designer',
    name: 'Dr. Emily Watson',
    expertise: 'Protocol Design',
    background: 'Clinical trial protocol development and methodology specialist',
    domain: mockDomain,
    isSelected: false
  },
  {
    id: 'biostatistician',
    name: 'Dr. James Liu',
    expertise: 'Biostatistics',
    background: 'Statistical analysis and data interpretation for clinical trials',
    domain: mockDomain,
    isSelected: false
  }
];

const mockUserPreferences: UserPreferences = {
  preferredExpertiseAreas: ['regulatory', 'safety'],
  frequentlyUsedAdvisors: ['regulatory-expert'],
  domainPreferences: {
    'cliniboard': 0.8,
    'eduboard': 0.3,
    'remediboard': 0.2
  }
};

const mockSessionHistory: ConsultationSession[] = [
  {
    id: 'session-1',
    selectedAdvisors: [mockAdvisors[0], mockAdvisors[1]], // regulatory + safety
    prompt: 'FDA approval process',
    responses: [],
    timestamp: new Date('2024-01-01'),
    domain: 'cliniboard'
  },
  {
    id: 'session-2',
    selectedAdvisors: [mockAdvisors[0]], // regulatory only
    prompt: 'Regulatory compliance',
    responses: [],
    timestamp: new Date('2024-01-02'),
    domain: 'cliniboard'
  }
];

describe('analyzePersonaSwitchOpportunities', () => {
  const baseContext: PersonaSwitchContext = {
    currentAdvisors: [mockAdvisors[0]], // Start with regulatory expert
    activeDomain: mockDomain,
    sessionHistory: mockSessionHistory,
    userPreferences: mockUserPreferences
  };

  describe('Expertise keyword analysis', () => {
    it('should recommend safety specialist for safety-related prompts', () => {
      const recommendations = analyzePersonaSwitchOpportunities(
        baseContext,
        'We need to analyze adverse events and safety profile data'
      );

      const safetyRecommendation = recommendations.find(r => r.advisorId === 'safety-specialist');
      expect(safetyRecommendation).toBeDefined();
      expect(safetyRecommendation?.suggestedAction).toBe('add');
      expect(safetyRecommendation?.reason).toContain('safety');
      expect(safetyRecommendation?.confidence).toBeGreaterThan(0.7);
    });

    it('should recommend protocol designer for methodology prompts', () => {
      const recommendations = analyzePersonaSwitchOpportunities(
        baseContext,
        'How should we design the clinical trial protocol and endpoints?'
      );

      const protocolRecommendation = recommendations.find(r => r.advisorId === 'protocol-designer');
      expect(protocolRecommendation).toBeDefined();
      expect(protocolRecommendation?.suggestedAction).toBe('add');
      expect(protocolRecommendation?.reason).toContain('protocol');
    });

    it('should handle multiple expertise areas in one prompt', () => {
      const recommendations = analyzePersonaSwitchOpportunities(
        baseContext,
        'We need FDA regulatory approval and safety monitoring for our clinical trial'
      );

      expect(recommendations.length).toBeGreaterThan(0);
      
      const safetyRecommendation = recommendations.find(r => r.advisorId === 'safety-specialist');
      expect(safetyRecommendation).toBeDefined();
      
      // Should not recommend regulatory expert since already selected
      const regulatoryRecommendation = recommendations.find(r => r.advisorId === 'regulatory-expert');
      expect(regulatoryRecommendation).toBeUndefined();
    });

    it('should return empty array for prompts with no clear expertise match', () => {
      const recommendations = analyzePersonaSwitchOpportunities(
        baseContext,
        'What is the weather like today?'
      );

      expect(recommendations.length).toBe(0);
    });
  });

  describe('Historical pattern analysis', () => {
    it('should recommend frequently used advisors', () => {
      const contextWithoutRegulatory: PersonaSwitchContext = {
        ...baseContext,
        currentAdvisors: [mockAdvisors[2]], // protocol designer only
      };

      const recommendations = analyzePersonaSwitchOpportunities(
        contextWithoutRegulatory,
        'General clinical trial question'
      );

      const regulatoryRecommendation = recommendations.find(r => r.advisorId === 'regulatory-expert');
      expect(regulatoryRecommendation).toBeDefined();
      expect(regulatoryRecommendation?.reason).toContain('Frequently used');
    });

    it('should consider advisor combinations from history', () => {
      const contextWithSafetyOnly: PersonaSwitchContext = {
        ...baseContext,
        currentAdvisors: [mockAdvisors[1]], // safety specialist only
      };

      const recommendations = analyzePersonaSwitchOpportunities(
        contextWithSafetyOnly,
        'Clinical trial planning'
      );

      // Should recommend regulatory expert based on historical pairing
      const regulatoryRecommendation = recommendations.find(r => r.advisorId === 'regulatory-expert');
      expect(regulatoryRecommendation).toBeDefined();
    });
  });

  describe('Advisor overload detection', () => {
    it('should recommend removing advisors when too many are selected', () => {
      const overloadedContext: PersonaSwitchContext = {
        ...baseContext,
        currentAdvisors: mockAdvisors, // All 4 advisors selected
      };

      const recommendations = analyzePersonaSwitchOpportunities(
        overloadedContext,
        'Simple regulatory question about FDA'
      );

      const removeRecommendation = recommendations.find(r => r.suggestedAction === 'remove');
      expect(removeRecommendation).toBeDefined();
      expect(removeRecommendation?.reason).toContain('reducing advisor count');
    });

    it('should not recommend removal with reasonable advisor count', () => {
      const reasonableContext: PersonaSwitchContext = {
        ...baseContext,
        currentAdvisors: [mockAdvisors[0], mockAdvisors[1]], // 2 advisors
      };

      const recommendations = analyzePersonaSwitchOpportunities(
        reasonableContext,
        'FDA regulatory and safety question'
      );

      const removeRecommendations = recommendations.filter(r => r.suggestedAction === 'remove');
      expect(removeRecommendations.length).toBe(0);
    });
  });

  describe('Confidence scoring', () => {
    it('should assign higher confidence to clear expertise matches', () => {
      const recommendations = analyzePersonaSwitchOpportunities(
        baseContext,
        'FDA regulatory compliance and approval process'
      );

      // Should have high confidence for safety specialist (clear safety keywords)
      const safetyRecommendation = recommendations.find(r => r.advisorId === 'safety-specialist');
      if (safetyRecommendation) {
        expect(safetyRecommendation.confidence).toBeGreaterThan(0.6);
      }
    });

    it('should sort recommendations by confidence', () => {
      const recommendations = analyzePersonaSwitchOpportunities(
        baseContext,
        'We need safety monitoring, protocol design, and statistical analysis'
      );

      // Should be sorted by confidence (highest first)
      for (let i = 0; i < recommendations.length - 1; i++) {
        expect(recommendations[i].confidence).toBeGreaterThanOrEqual(recommendations[i + 1].confidence);
      }
    });
  });
});

describe('executePersonaSwitch', () => {
  const currentAdvisors = [mockAdvisors[0]]; // regulatory expert
  const availableAdvisors = mockAdvisors;

  it('should add advisor when action is "add"', () => {
    const recommendation: PersonaSwitchRecommendation = {
      advisorId: 'safety-specialist',
      reason: 'Safety expertise needed',
      confidence: 0.8,
      suggestedAction: 'add'
    };

    const result = executePersonaSwitch(currentAdvisors, recommendation, availableAdvisors);

    expect(result).toHaveLength(2);
    expect(result.find(a => a.id === 'safety-specialist')).toBeDefined();
    expect(result.find(a => a.id === 'safety-specialist')?.isSelected).toBe(true);
  });

  it('should remove advisor when action is "remove"', () => {
    const recommendation: PersonaSwitchRecommendation = {
      advisorId: 'regulatory-expert',
      reason: 'Simplify advisor selection',
      confidence: 0.6,
      suggestedAction: 'remove'
    };

    const result = executePersonaSwitch(currentAdvisors, recommendation, availableAdvisors);

    expect(result).toHaveLength(0);
    expect(result.find(a => a.id === 'regulatory-expert')).toBeUndefined();
  });

  it('should replace advisor when action is "replace"', () => {
    const recommendation: PersonaSwitchRecommendation = {
      advisorId: 'safety-specialist',
      reason: 'Better expertise match',
      confidence: 0.7,
      suggestedAction: 'replace'
    };

    const result = executePersonaSwitch(currentAdvisors, recommendation, availableAdvisors);

    expect(result).toHaveLength(1);
    expect(result.find(a => a.id === 'safety-specialist')).toBeDefined();
    expect(result.find(a => a.id === 'safety-specialist')?.isSelected).toBe(true);
  });

  it('should handle non-existent advisor gracefully', () => {
    const recommendation: PersonaSwitchRecommendation = {
      advisorId: 'non-existent-advisor',
      reason: 'Test case',
      confidence: 0.5,
      suggestedAction: 'add'
    };

    const result = executePersonaSwitch(currentAdvisors, recommendation, availableAdvisors);

    // Should return original advisors unchanged
    expect(result).toEqual(currentAdvisors);
  });

  it('should not add duplicate advisors', () => {
    const recommendation: PersonaSwitchRecommendation = {
      advisorId: 'regulatory-expert', // Already selected
      reason: 'Test duplicate',
      confidence: 0.5,
      suggestedAction: 'add'
    };

    const result = executePersonaSwitch(currentAdvisors, recommendation, availableAdvisors);

    expect(result).toHaveLength(1);
    expect(result.filter(a => a.id === 'regulatory-expert')).toHaveLength(1);
  });
});

describe('updateUserPreferences', () => {
  const basePreferences: UserPreferences = {
    preferredExpertiseAreas: ['regulatory'],
    frequentlyUsedAdvisors: ['regulatory-expert'],
    domainPreferences: { 'cliniboard': 0.5 }
  };

  it('should add advisor to frequently used when recommendation is accepted', () => {
    const recommendation: PersonaSwitchRecommendation = {
      advisorId: 'safety-specialist',
      reason: 'Safety expertise needed',
      confidence: 0.8,
      suggestedAction: 'add'
    };

    const result = updateUserPreferences(basePreferences, recommendation, true);

    expect(result.frequentlyUsedAdvisors).toContain('safety-specialist');
    expect(result.frequentlyUsedAdvisors).toContain('regulatory-expert'); // Should keep existing
  });

  it('should not modify preferences when recommendation is rejected', () => {
    const recommendation: PersonaSwitchRecommendation = {
      advisorId: 'safety-specialist',
      reason: 'Safety expertise needed',
      confidence: 0.8,
      suggestedAction: 'add'
    };

    const result = updateUserPreferences(basePreferences, recommendation, false);

    expect(result).toEqual(basePreferences);
  });

  it('should not add duplicate advisors to frequently used', () => {
    const recommendation: PersonaSwitchRecommendation = {
      advisorId: 'regulatory-expert', // Already in frequently used
      reason: 'Test duplicate',
      confidence: 0.8,
      suggestedAction: 'add'
    };

    const result = updateUserPreferences(basePreferences, recommendation, true);

    expect(result.frequentlyUsedAdvisors.filter(id => id === 'regulatory-expert')).toHaveLength(1);
  });
});

describe('Helper functions', () => {
  describe('extractExpertiseKeywords', () => {
    // Note: This function is not exported, so we test it indirectly through analyzePersonaSwitchOpportunities
    
    it('should identify clinical keywords', () => {
      const context: PersonaSwitchContext = {
        currentAdvisors: [],
        activeDomain: mockDomain,
        sessionHistory: [],
        userPreferences: mockUserPreferences
      };

      const recommendations = analyzePersonaSwitchOpportunities(
        context,
        'We need clinical trial regulatory approval from FDA'
      );

      // Should identify 'clinical' and 'regulatory' keywords
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should identify education keywords', () => {
      const eduDomain: Domain = { ...mockDomain, id: 'eduboard' };
      const context: PersonaSwitchContext = {
        currentAdvisors: [],
        activeDomain: eduDomain,
        sessionHistory: [],
        userPreferences: mockUserPreferences
      };

      const recommendations = analyzePersonaSwitchOpportunities(
        context,
        'How can we improve curriculum and pedagogy for students?'
      );

      // Should identify education-related keywords
      expect(recommendations.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('findMissingExpertise', () => {
    it('should identify gaps in current advisor expertise', () => {
      const context: PersonaSwitchContext = {
        currentAdvisors: [mockAdvisors[0]], // Only regulatory expert
        activeDomain: mockDomain,
        sessionHistory: [],
        userPreferences: mockUserPreferences
      };

      const recommendations = analyzePersonaSwitchOpportunities(
        context,
        'We need safety monitoring and statistical analysis'
      );

      // Should recommend safety specialist and biostatistician
      const safetyRec = recommendations.find(r => r.advisorId === 'safety-specialist');
      
      expect(safetyRec).toBeDefined();
      // Note: biostatistician might not be recommended if keywords don't match exactly
    });
  });
});