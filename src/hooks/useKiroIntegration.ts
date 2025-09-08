/**
 * Custom hook for integrating with Kiro's steering system and hooks
 * 
 * This hook provides the interface between the AdvisorBoard application
 * and Kiro's advanced features including steering rules, hooks, and
 * dynamic persona management.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Advisor, Domain } from '../types/domain';
import type { ConsultationSession } from '../types/session';
import type {
  PersonaSwitchContext,
  PersonaSwitchRecommendation,
  UserPreferences
} from '../../.kiro/hooks/persona-switch';
import {
  analyzePersonaSwitchOpportunities,
  executePersonaSwitch,
  updateUserPreferences
} from '../../.kiro/hooks/persona-switch';
import {
  appStateReducer,
  createInitialState,
  StatePersistence,
  StateValidation,
  StateActions
} from '../../.kiro/hooks/state-management';

export interface KiroIntegrationConfig {
  enablePersonaSwitching: boolean;
  enableStateManagement: boolean;
  enableAdvisorPrioritization: boolean;
  autoApplyRecommendations: boolean;
  persistenceEnabled: boolean;
}

export interface AdvisorPrioritization {
  advisorId: string;
  priority: number;
  reason: string;
  confidence: number;
}

export interface KiroIntegrationState {
  isInitialized: boolean;
  config: KiroIntegrationConfig;
  personaRecommendations: PersonaSwitchRecommendation[];
  advisorPriorities: AdvisorPrioritization[];
  steeringRulesLoaded: boolean;
  lastUpdate: Date | null;
}

/**
 * Main hook for Kiro integration
 */
export function useKiroIntegration(initialConfig?: Partial<KiroIntegrationConfig>) {
  // State management
  const [appState, dispatch] = useReducer(appStateReducer, createInitialState());
  const [kiroState, setKiroState] = useState<KiroIntegrationState>({
    isInitialized: false,
    config: {
      enablePersonaSwitching: true,
      enableStateManagement: true,
      enableAdvisorPrioritization: true,
      autoApplyRecommendations: false,
      persistenceEnabled: true,
      ...initialConfig
    },
    personaRecommendations: [],
    advisorPriorities: [],
    steeringRulesLoaded: false,
    lastUpdate: null
  });

  const steeringRulesRef = useRef<any>(null);
  const userPreferencesRef = useRef<UserPreferences>({
    preferredExpertiseAreas: [],
    frequentlyUsedAdvisors: [],
    domainPreferences: {}
  });

  /**
   * Initialize Kiro integration
   */
  const initialize = useCallback(async () => {
    try {
      // Load persisted state if enabled
      if (kiroState.config.persistenceEnabled) {
        const persistedState = StatePersistence.loadState();
        if (Object.keys(persistedState).length > 0) {
          // Merge persisted state with current state
          Object.entries(persistedState).forEach(([key, value]) => {
            if (value !== undefined) {
              dispatch({
                type: `SET_${key.toUpperCase()}`,
                payload: value
              });
            }
          });
        }
      }

      // Load steering rules (simulated - in real implementation would load from .kiro/steering/)
      await loadSteeringRules();

      setKiroState(prev => ({
        ...prev,
        isInitialized: true,
        steeringRulesLoaded: true,
        lastUpdate: new Date()
      }));
    } catch (error) {
      console.error('Failed to initialize Kiro integration:', error);
      dispatch(StateActions.addError({
        type: 'network',
        message: 'Failed to initialize Kiro integration'
      }));
    }
  }, [kiroState.config.persistenceEnabled]);

  /**
   * Load steering rules from .kiro/steering/advisor-prioritization.md
   */
  const loadSteeringRules = useCallback(async () => {
    try {
      // In a real implementation, this would parse the markdown file
      // For now, we'll simulate the steering rules
      const steeringRules = {
        cliniboard: {
          priorityKeywords: {
            high: ['clinical trial', 'FDA approval', 'safety profile', 'regulatory'],
            medium: ['research', 'study design', 'patient recruitment']
          },
          advisorSpecializations: {
            regulatory_expert: { triggers: ['FDA', 'regulatory'], boostFactor: 1.5 },
            safety_specialist: { triggers: ['safety', 'adverse'], boostFactor: 1.4 }
          }
        },
        eduboard: {
          priorityKeywords: {
            high: ['curriculum', 'pedagogy', 'student engagement'],
            medium: ['teaching methods', 'classroom management']
          },
          advisorSpecializations: {
            curriculum_expert: { triggers: ['curriculum', 'standards'], boostFactor: 1.5 },
            equity_advocate: { triggers: ['equity', 'inclusion'], boostFactor: 1.4 }
          }
        },
        remediboard: {
          priorityKeywords: {
            high: ['herbal medicine', 'traditional healing', 'natural remedies'],
            medium: ['alternative medicine', 'wellness']
          },
          advisorSpecializations: {
            herbalist: { triggers: ['herbal', 'botanical'], boostFactor: 1.5 },
            traditional_healer: { triggers: ['traditional', 'ancient'], boostFactor: 1.4 }
          }
        }
      };

      steeringRulesRef.current = steeringRules;
    } catch (error) {
      console.error('Failed to load steering rules:', error);
    }
  }, []);

  /**
   * Calculate advisor priorities based on steering rules
   */
  const calculateAdvisorPriorities = useCallback((
    availableAdvisors: Advisor[],
    currentPrompt: string,
    selectedDomain: Domain | null
  ): AdvisorPrioritization[] => {
    if (!steeringRulesRef.current || !selectedDomain) {
      return availableAdvisors.map(advisor => ({
        advisorId: advisor.id,
        priority: 0.5,
        reason: 'No steering rules available',
        confidence: 0.3
      }));
    }

    const domainRules = steeringRulesRef.current[selectedDomain.id];
    if (!domainRules) {
      return availableAdvisors.map(advisor => ({
        advisorId: advisor.id,
        priority: 0.5,
        reason: 'No domain-specific rules',
        confidence: 0.3
      }));
    }

    return availableAdvisors.map(advisor => {
      let priority = 0.3; // Base priority
      let reason = 'Base priority';
      let confidence = 0.5;

      // Check for high priority keywords
      const highKeywords = domainRules.priorityKeywords.high || [];
      const mediumKeywords = domainRules.priorityKeywords.medium || [];
      
      const promptLower = currentPrompt.toLowerCase();
      
      // High priority keyword match
      const highMatches = highKeywords.filter(keyword => 
        promptLower.includes(keyword.toLowerCase())
      );
      if (highMatches.length > 0) {
        priority += 0.3;
        reason = `Matches high priority keywords: ${highMatches.join(', ')}`;
        confidence += 0.2;
      }

      // Medium priority keyword match
      const mediumMatches = mediumKeywords.filter(keyword => 
        promptLower.includes(keyword.toLowerCase())
      );
      if (mediumMatches.length > 0) {
        priority += 0.2;
        reason += ` | Medium priority keywords: ${mediumMatches.join(', ')}`;
        confidence += 0.1;
      }

      // Advisor specialization boost
      const specializations = domainRules.advisorSpecializations || {};
      Object.entries(specializations).forEach(([specName, spec]: [string, any]) => {
        const triggers = spec.triggers || [];
        const matchingTriggers = triggers.filter((trigger: string) => 
          advisor.expertise.toLowerCase().includes(trigger.toLowerCase()) ||
          advisor.background.toLowerCase().includes(trigger.toLowerCase()) ||
          promptLower.includes(trigger.toLowerCase())
        );

        if (matchingTriggers.length > 0) {
          priority *= spec.boostFactor || 1.2;
          reason += ` | Specialization boost: ${specName}`;
          confidence += 0.15;
        }
      });

      // Historical usage boost (simulated)
      const frequentlyUsed = userPreferencesRef.current.frequentlyUsedAdvisors;
      if (frequentlyUsed.includes(advisor.id)) {
        priority += 0.1;
        reason += ' | Frequently used';
        confidence += 0.1;
      }

      return {
        advisorId: advisor.id,
        priority: Math.min(priority, 1.0),
        reason,
        confidence: Math.min(confidence, 1.0)
      };
    }).sort((a, b) => b.priority - a.priority);
  }, []);

  /**
   * Generate persona switch recommendations
   */
  const generatePersonaRecommendations = useCallback((
    currentPrompt: string,
    selectedAdvisors: Advisor[],
    availableAdvisors: Advisor[]
  ): PersonaSwitchRecommendation[] => {
    if (!kiroState.config.enablePersonaSwitching) {
      return [];
    }

    const context: PersonaSwitchContext = {
      currentAdvisors: selectedAdvisors,
      activeDomain: appState.selectedDomain,
      sessionHistory: appState.sessionHistory,
      userPreferences: userPreferencesRef.current
    };

    return analyzePersonaSwitchOpportunities(context, currentPrompt);
  }, [kiroState.config.enablePersonaSwitching, appState.selectedDomain, appState.sessionHistory]);

  /**
   * Apply a persona switch recommendation
   */
  const applyPersonaRecommendation = useCallback((
    recommendation: PersonaSwitchRecommendation,
    availableAdvisors: Advisor[]
  ) => {
    const newAdvisors = executePersonaSwitch(
      appState.selectedAdvisors,
      recommendation,
      availableAdvisors
    );

    // Update app state
    dispatch({
      type: 'UPDATE_ADVISOR_LIST',
      payload: newAdvisors
    });

    // Update user preferences
    userPreferencesRef.current = updateUserPreferences(
      userPreferencesRef.current,
      recommendation,
      true
    );

    // Remove the applied recommendation
    setKiroState(prev => ({
      ...prev,
      personaRecommendations: prev.personaRecommendations.filter(
        r => r.advisorId !== recommendation.advisorId
      ),
      lastUpdate: new Date()
    }));
  }, [appState.selectedAdvisors]);

  /**
   * Update advisor priorities when context changes
   */
  const updateAdvisorPriorities = useCallback((
    availableAdvisors: Advisor[],
    currentPrompt: string = ''
  ) => {
    if (!kiroState.config.enableAdvisorPrioritization) {
      return;
    }

    const priorities = calculateAdvisorPriorities(
      availableAdvisors,
      currentPrompt,
      appState.selectedDomain
    );

    setKiroState(prev => ({
      ...prev,
      advisorPriorities: priorities,
      lastUpdate: new Date()
    }));
  }, [kiroState.config.enableAdvisorPrioritization, appState.selectedDomain, calculateAdvisorPriorities]);

  /**
   * Update persona recommendations when context changes
   */
  const updatePersonaRecommendations = useCallback((
    currentPrompt: string,
    availableAdvisors: Advisor[]
  ) => {
    const recommendations = generatePersonaRecommendations(
      currentPrompt,
      appState.selectedAdvisors,
      availableAdvisors
    );

    setKiroState(prev => ({
      ...prev,
      personaRecommendations: recommendations,
      lastUpdate: new Date()
    }));

    // Auto-apply high-confidence recommendations if enabled
    if (kiroState.config.autoApplyRecommendations) {
      recommendations
        .filter(rec => rec.confidence > 0.8)
        .forEach(rec => applyPersonaRecommendation(rec, availableAdvisors));
    }
  }, [generatePersonaRecommendations, appState.selectedAdvisors, kiroState.config.autoApplyRecommendations, applyPersonaRecommendation]);

  /**
   * Persist state changes
   */
  useEffect(() => {
    if (kiroState.config.persistenceEnabled && kiroState.isInitialized) {
      StatePersistence.saveState(appState);
    }
  }, [appState, kiroState.config.persistenceEnabled, kiroState.isInitialized]);

  /**
   * Validate state consistency
   */
  useEffect(() => {
    if (kiroState.isInitialized) {
      const validationErrors = StateValidation.validateState(appState);
      if (validationErrors.length > 0) {
        validationErrors.forEach(error => {
          dispatch(StateActions.addError(error));
        });
      }
    }
  }, [appState, kiroState.isInitialized]);

  // Initialize on mount
  useEffect(() => {
    if (!kiroState.isInitialized) {
      initialize();
    }
  }, [initialize, kiroState.isInitialized]);

  return {
    // State
    appState,
    kiroState,
    
    // Actions
    dispatch,
    
    // Kiro-specific functions
    updateAdvisorPriorities,
    updatePersonaRecommendations,
    applyPersonaRecommendation,
    
    // Utility functions
    isReady: kiroState.isInitialized && kiroState.steeringRulesLoaded,
    
    // Configuration
    updateConfig: (newConfig: Partial<KiroIntegrationConfig>) => {
      setKiroState(prev => ({
        ...prev,
        config: { ...prev.config, ...newConfig }
      }));
    }
  };
}

// Helper hook for accessing Kiro integration in components
export function useKiroContext() {
  const integration = useKiroIntegration();
  
  return {
    ...integration,
    
    // Convenience methods for common operations
    selectDomain: (domain: Domain) => {
      integration.dispatch(StateActions.selectDomain(domain));
    },
    
    selectAdvisor: (advisor: Advisor) => {
      integration.dispatch(StateActions.selectAdvisor(advisor));
    },
    
    startSession: (prompt: string) => {
      integration.dispatch(StateActions.startSession(prompt));
    },
    
    // Get prioritized advisors for display
    getPrioritizedAdvisors: (advisors: Advisor[]) => {
      return advisors
        .map(advisor => {
          const priority = integration.kiroState.advisorPriorities.find(
            p => p.advisorId === advisor.id
          );
          return {
            ...advisor,
            priority: priority?.priority || 0.5,
            priorityReason: priority?.reason || 'No priority data'
          };
        })
        .sort((a, b) => b.priority - a.priority);
    }
  };
}

// Re-export useReducer for compatibility
import { useReducer } from 'react';