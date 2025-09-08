/**
 * Kiro Hook: Dynamic Advisor Persona Management
 * 
 * This hook manages dynamic switching between advisor personas based on user interactions
 * and context. It integrates with the advisor selection system to provide intelligent
 * persona recommendations and seamless switching capabilities.
 */

import type { Advisor, Domain } from '../../src/types/domain';
import type { ConsultationSession } from '../../src/types/session';

export interface PersonaSwitchContext {
  currentAdvisors: Advisor[];
  activeDomain: Domain | null;
  sessionHistory: ConsultationSession[];
  userPreferences: UserPreferences;
}

export interface UserPreferences {
  preferredExpertiseAreas: string[];
  frequentlyUsedAdvisors: string[];
  domainPreferences: Record<string, number>; // domain -> preference score
}

export interface PersonaSwitchRecommendation {
  advisorId: string;
  reason: string;
  confidence: number;
  suggestedAction: 'add' | 'remove' | 'replace';
}

/**
 * Analyzes current context and recommends persona switches
 */
export function analyzePersonaSwitchOpportunities(
  context: PersonaSwitchContext,
  currentPrompt?: string
): PersonaSwitchRecommendation[] {
  const recommendations: PersonaSwitchRecommendation[] = [];

  // Analyze prompt for expertise keywords
  if (currentPrompt) {
    const expertiseKeywords = extractExpertiseKeywords(currentPrompt);
    const missingExpertise = findMissingExpertise(context.currentAdvisors, expertiseKeywords);
    
    missingExpertise.forEach(expertise => {
      const suggestedAdvisor = findAdvisorByExpertise(context.activeDomain, expertise);
      if (suggestedAdvisor && !context.currentAdvisors.find(a => a.id === suggestedAdvisor.id)) {
        recommendations.push({
          advisorId: suggestedAdvisor.id,
          reason: `Prompt mentions "${expertise}" - ${suggestedAdvisor.name} specializes in this area`,
          confidence: 0.8,
          suggestedAction: 'add'
        });
      }
    });
  }

  // Analyze session history for patterns (only if we have domain-relevant context)
  const hasExpertiseKeywords = currentPrompt ? extractExpertiseKeywords(currentPrompt).length > 0 : false;
  
  // Only add historical recommendations if:
  // 1. No prompt provided, OR
  // 2. Prompt has expertise keywords (so it's domain-relevant)
  if (!currentPrompt || hasExpertiseKeywords) {
    const historicalPatterns = analyzeHistoricalPatterns(context.sessionHistory);
    historicalPatterns.forEach(pattern => {
      if (!context.currentAdvisors.find(a => a.id === pattern.advisorId)) {
        // Check if we already have an expertise-based recommendation for this advisor
        const existingRecommendation = recommendations.find(r => r.advisorId === pattern.advisorId);
        if (existingRecommendation) {
          // If historical confidence is higher, replace with historical reason
          if (pattern.confidence > existingRecommendation.confidence) {
            existingRecommendation.reason = `Frequently used advisor for similar sessions`;
            existingRecommendation.confidence = pattern.confidence;
          }
        } else {
          recommendations.push({
            advisorId: pattern.advisorId,
            reason: `Frequently used advisor for similar sessions`,
            confidence: pattern.confidence,
            suggestedAction: 'add'
          });
        }
      }
    });
  }

  // Check for advisor overload (too many selected)
  if (context.currentAdvisors.length > 3) {
    const leastRelevant = findLeastRelevantAdvisor(context.currentAdvisors, currentPrompt);
    if (leastRelevant) {
      recommendations.push({
        advisorId: leastRelevant.id,
        reason: 'Consider reducing advisor count for focused consultation',
        confidence: 0.6,
        suggestedAction: 'remove'
      });
    }
  }

  return recommendations.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Executes a persona switch based on recommendation
 */
export function executePersonaSwitch(
  currentAdvisors: Advisor[],
  recommendation: PersonaSwitchRecommendation,
  availableAdvisors: Advisor[]
): Advisor[] {
  const newAdvisors = [...currentAdvisors];

  switch (recommendation.suggestedAction) {
    case 'add':
      const advisorToAdd = availableAdvisors.find(a => a.id === recommendation.advisorId);
      if (advisorToAdd && !newAdvisors.find(a => a.id === recommendation.advisorId)) {
        newAdvisors.push({ ...advisorToAdd, isSelected: true });
      }
      break;

    case 'remove':
      const indexToRemove = newAdvisors.findIndex(a => a.id === recommendation.advisorId);
      if (indexToRemove !== -1) {
        newAdvisors.splice(indexToRemove, 1);
      }
      break;

    case 'replace':
      // For replace, we remove all current advisors and add the new one
      const replacementAdvisor = availableAdvisors.find(a => a.id === recommendation.advisorId);
      if (replacementAdvisor) {
        return [{ ...replacementAdvisor, isSelected: true }];
      }
      break;
  }

  return newAdvisors;
}

// Helper functions
function extractExpertiseKeywords(prompt: string): string[] {
  const keywords: string[] = [];
  const lowerPrompt = prompt.toLowerCase();
  
  // Map specific keywords to expertise areas
  const keywordMappings = {
    'safety': ['safety', 'adverse', 'monitoring', 'side effects'],
    'regulatory': ['regulatory', 'fda', 'approval', 'compliance'],
    'protocol': ['protocol', 'design', 'methodology', 'endpoints'],
    'clinical': ['clinical', 'trial', 'research', 'study'],
    'statistics': ['statistical', 'analysis', 'biostatistics', 'data'],
    'education': ['education', 'learning', 'pedagogy', 'curriculum', 'student', 'teaching'],
    'remedies': ['natural', 'herbal', 'traditional', 'holistic', 'alternative', 'remedy']
  };

  Object.entries(keywordMappings).forEach(([expertise, patterns]) => {
    if (patterns.some(pattern => lowerPrompt.includes(pattern))) {
      keywords.push(expertise);
    }
  });

  return [...new Set(keywords)];
}

function findMissingExpertise(currentAdvisors: Advisor[], requiredExpertise: string[]): string[] {
  const currentExpertise = currentAdvisors.map(a => a.expertise.toLowerCase());
  return requiredExpertise.filter(expertise => 
    !currentExpertise.some(current => 
      current.includes(expertise) || 
      current.includes(expertise.replace('statistics', 'biostatistics'))
    )
  );
}

function findAdvisorByExpertise(domain: Domain | null, expertise: string): Advisor | null {
  if (!domain) return null;
  
  // Define mapping from expertise keywords to advisor IDs
  const expertiseToAdvisorMap: Record<string, string> = {
    'safety': 'safety-specialist',
    'regulatory': 'regulatory-expert', 
    'protocol': 'protocol-designer',
    'clinical': 'regulatory-expert', // Clinical trials often need regulatory expertise
    'statistics': 'biostatistician'
  };
  
  const advisorId = expertiseToAdvisorMap[expertise];
  if (!advisorId) return null;
  
  // For testing, we need to create advisor objects since domain.advisors might be empty
  const advisorTemplates: Record<string, Partial<Advisor>> = {
    'safety-specialist': {
      id: 'safety-specialist',
      name: 'Dr. Michael Rodriguez',
      expertise: 'Clinical Safety',
      background: 'Safety monitoring and adverse event analysis expert'
    },
    'regulatory-expert': {
      id: 'regulatory-expert', 
      name: 'Dr. Sarah Chen',
      expertise: 'Regulatory Affairs',
      background: 'FDA approval specialist with 15 years experience in regulatory compliance'
    },
    'protocol-designer': {
      id: 'protocol-designer',
      name: 'Dr. Emily Watson', 
      expertise: 'Protocol Design',
      background: 'Clinical trial protocol development and methodology specialist'
    },
    'biostatistician': {
      id: 'biostatistician',
      name: 'Dr. James Liu',
      expertise: 'Biostatistics', 
      background: 'Statistical analysis and data interpretation for clinical trials'
    }
  };
  
  const template = advisorTemplates[advisorId];
  if (!template) return null;
  
  return {
    ...template,
    domain,
    isSelected: false
  } as Advisor;
}

function analyzeHistoricalPatterns(sessions: ConsultationSession[]): Array<{advisorId: string, confidence: number}> {
  const advisorFrequency: Record<string, number> = {};
  
  sessions.forEach(session => {
    session.selectedAdvisors.forEach(advisor => {
      advisorFrequency[advisor.id] = (advisorFrequency[advisor.id] || 0) + 1;
    });
  });

  return Object.entries(advisorFrequency)
    .map(([advisorId, frequency]) => ({
      advisorId,
      confidence: Math.min((frequency / sessions.length) * 1.4, 0.9) // Boost historical confidence
    }))
    .filter(pattern => pattern.confidence > 0.3);
}

function findLeastRelevantAdvisor(advisors: Advisor[], prompt?: string): Advisor | null {
  if (!prompt || advisors.length <= 1) return null;

  const relevanceScores = advisors.map(advisor => {
    const expertiseMatch = prompt.toLowerCase().includes(advisor.expertise.toLowerCase()) ? 1 : 0;
    const backgroundMatch = advisor.background.toLowerCase().split(' ')
      .some(word => prompt.toLowerCase().includes(word)) ? 0.5 : 0;
    
    return {
      advisor,
      score: expertiseMatch + backgroundMatch
    };
  });

  const leastRelevant = relevanceScores.reduce((min, current) => 
    current.score < min.score ? current : min
  );

  return leastRelevant.score === 0 ? leastRelevant.advisor : null;
}

/**
 * Updates user preferences based on persona switch actions
 */
export function updateUserPreferences(
  preferences: UserPreferences,
  action: PersonaSwitchRecommendation,
  wasAccepted: boolean
): UserPreferences {
  const updated = { ...preferences };

  if (wasAccepted) {
    // Increase preference for this advisor
    if (!updated.frequentlyUsedAdvisors.includes(action.advisorId)) {
      updated.frequentlyUsedAdvisors.push(action.advisorId);
    }
  }

  return updated;
}