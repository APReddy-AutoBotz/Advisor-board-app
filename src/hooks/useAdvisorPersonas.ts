import { useState, useCallback, useRef, useMemo } from 'react';
import type { Advisor, AdvisorResponse } from '../types/domain';
import { advisorService, AdvisorServiceError } from '../services/advisorService';
import { useAsyncPerformanceMonitoring } from './usePerformanceMonitoring';

export interface UseAdvisorPersonasState {
  responses: AdvisorResponse[];
  isLoading: boolean;
  error: string | null;
  loadingAdvisors: Set<string>;
  summary: string | null;
  isGeneratingSummary: boolean;
  summaryError: string | null;
}

export interface UseAdvisorPersonasActions {
  submitPrompt: (prompt: string, sessionContext?: string) => Promise<void>;
  clearResponses: () => void;
  clearError: () => void;
  retryFailedResponse: (advisorId: string, prompt: string) => Promise<void>;
  generateSummary: (prompt: string) => Promise<void>;
  clearSummary: () => void;
  clearSummaryError: () => void;
}

export interface UseAdvisorPersonasReturn extends UseAdvisorPersonasState, UseAdvisorPersonasActions {}

/**
 * Custom hook for managing AI persona interactions with multiple advisors
 */
export function useAdvisorPersonas(selectedAdvisors: Advisor[]): UseAdvisorPersonasReturn {
  const [state, setState] = useState<UseAdvisorPersonasState>({
    responses: [],
    isLoading: false,
    error: null,
    loadingAdvisors: new Set(),
    summary: null,
    isGeneratingSummary: false,
    summaryError: null,
  });

  // Keep track of the current prompt for retry functionality
  const currentPromptRef = useRef<string>('');
  const sessionContextRef = useRef<string>('');
  
  // Performance monitoring
  const { startOperation, endOperation } = useAsyncPerformanceMonitoring();

  // Memoize advisor IDs for performance
  const advisorIds = useMemo(() => 
    selectedAdvisors.map(a => a.id).join(','), 
    [selectedAdvisors]
  );

  /**
   * Submit prompt to all selected advisors
   */
  const submitPrompt = useCallback(async (prompt: string, sessionContext?: string) => {
    if (!prompt.trim()) {
      setState(prev => ({ ...prev, error: 'Prompt cannot be empty' }));
      return;
    }

    if (selectedAdvisors.length === 0) {
      setState(prev => ({ ...prev, error: 'No advisors selected' }));
      return;
    }

    const operationId = `submit_prompt_${Date.now()}`;
    startOperation(operationId);

    // Store current prompt for retry functionality
    currentPromptRef.current = prompt;
    sessionContextRef.current = sessionContext || '';

    // Set loading state
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      loadingAdvisors: new Set(selectedAdvisors.map(a => a.id)),
    }));

    try {
      // Generate responses from all selected advisors
      const responses = await advisorService.generateMultipleResponses(
        selectedAdvisors,
        prompt,
        sessionContext
      );

      setState(prev => ({
        ...prev,
        responses: [...prev.responses, ...responses],
        isLoading: false,
        loadingAdvisors: new Set(),
      }));

      endOperation(operationId, { 
        advisorCount: selectedAdvisors.length, 
        responseCount: responses.length,
        promptLength: prompt.length,
      });

    } catch (error) {
      const errorMessage = error instanceof AdvisorServiceError 
        ? error.message 
        : 'Failed to generate advisor responses';

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        loadingAdvisors: new Set(),
      }));

      endOperation(operationId, { 
        error: errorMessage,
        advisorCount: selectedAdvisors.length,
      });
    }
  }, [selectedAdvisors, startOperation, endOperation]);

  /**
   * Retry failed response for a specific advisor
   */
  const retryFailedResponse = useCallback(async (advisorId: string, prompt?: string) => {
    const advisor = selectedAdvisors.find(a => a.id === advisorId);
    if (!advisor) {
      setState(prev => ({ ...prev, error: `Advisor ${advisorId} not found` }));
      return;
    }

    const promptToUse = prompt || currentPromptRef.current;
    if (!promptToUse) {
      setState(prev => ({ ...prev, error: 'No prompt available for retry' }));
      return;
    }

    // Set loading state for this specific advisor
    setState(prev => ({
      ...prev,
      error: null,
      loadingAdvisors: new Set([...prev.loadingAdvisors, advisorId]),
    }));

    try {
      const response = await advisorService.generateAdvisorResponse(
        advisor,
        promptToUse,
        sessionContextRef.current
      );

      setState(prev => {
        const newLoadingAdvisors = new Set(prev.loadingAdvisors);
        newLoadingAdvisors.delete(advisorId);

        // Remove any existing response from this advisor for the same prompt
        const filteredResponses = prev.responses.filter(r => r.advisorId !== advisorId);

        return {
          ...prev,
          responses: [...filteredResponses, response],
          loadingAdvisors: newLoadingAdvisors,
        };
      });

    } catch (error) {
      const errorMessage = error instanceof AdvisorServiceError 
        ? error.message 
        : `Failed to retry response for ${advisor.name}`;

      setState(prev => {
        const newLoadingAdvisors = new Set(prev.loadingAdvisors);
        newLoadingAdvisors.delete(advisorId);

        return {
          ...prev,
          error: errorMessage,
          loadingAdvisors: newLoadingAdvisors,
        };
      });
    }
  }, [selectedAdvisors]);

  /**
   * Clear all responses
   */
  const clearResponses = useCallback(() => {
    setState(prev => ({
      ...prev,
      responses: [],
      error: null,
    }));
  }, []);

  /**
   * Generate summary of current responses
   */
  const generateSummary = useCallback(async (prompt: string) => {
    if (state.responses.length === 0) {
      setState(prev => ({ ...prev, summaryError: 'No responses available to summarize' }));
      return;
    }

    setState(prev => ({
      ...prev,
      isGeneratingSummary: true,
      summaryError: null,
    }));

    try {
      const summary = await advisorService.generateResponseSummary(state.responses, prompt);
      
      setState(prev => ({
        ...prev,
        summary,
        isGeneratingSummary: false,
      }));

    } catch (error) {
      const errorMessage = error instanceof AdvisorServiceError 
        ? error.message 
        : 'Failed to generate response summary';

      setState(prev => ({
        ...prev,
        summaryError: errorMessage,
        isGeneratingSummary: false,
      }));
    }
  }, [state.responses]);

  /**
   * Clear summary
   */
  const clearSummary = useCallback(() => {
    setState(prev => ({
      ...prev,
      summary: null,
      summaryError: null,
    }));
  }, []);

  /**
   * Clear summary error
   */
  const clearSummaryError = useCallback(() => {
    setState(prev => ({ ...prev, summaryError: null }));
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    submitPrompt,
    clearResponses,
    clearError,
    retryFailedResponse,
    generateSummary,
    clearSummary,
    clearSummaryError,
  };
}

/**
 * Hook for managing persona configurations from YAML specs
 */
export function usePersonaConfigurations(advisors: Advisor[]) {
  const [personaConfigs, setPersonaConfigs] = useState<Map<string, any>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPersonaConfigurations = useCallback(async () => {
    if (advisors.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const configs = new Map();
      
      // Group advisors by domain to minimize YAML loads
      const domainGroups = advisors.reduce((groups, advisor) => {
        const domainId = advisor.domain.id;
        if (!groups[domainId]) {
          groups[domainId] = [];
        }
        groups[domainId].push(advisor);
        return groups;
      }, {} as Record<string, Advisor[]>);

      // Load configurations for each domain
      for (const [domainId, domainAdvisors] of Object.entries(domainGroups)) {
        try {
          // The YAML config is already loaded by yamlConfigLoader
          // We just need to create persona configs for each advisor
          domainAdvisors.forEach(advisor => {
            const personaConfig = {
              name: advisor.name,
              expertise: advisor.expertise,
              background: advisor.background,
              domain: advisor.domain.id,
              tone: getDomainTone(advisor.domain.id),
              specializations: extractSpecializations(advisor.expertise),
            };
            configs.set(advisor.id, personaConfig);
          });
        } catch (domainError) {
          console.warn(`Failed to load persona config for domain ${domainId}:`, domainError);
        }
      }

      setPersonaConfigs(configs);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load persona configurations';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [advisors]);

  return {
    personaConfigs,
    isLoading,
    error,
    loadPersonaConfigurations,
  };
}

/**
 * Utility function to get domain-specific tone
 */
function getDomainTone(domainId: string): string {
  const toneMap: Record<string, string> = {
    cliniboard: 'professional, evidence-based, regulatory-focused',
    eduboard: 'pedagogical, inclusive, reform-minded',
    remediboard: 'holistic, traditional, wellness-oriented',
  };
  return toneMap[domainId] || 'professional, knowledgeable';
}

/**
 * Utility function to extract specializations from expertise string
 */
function extractSpecializations(expertise: string): string[] {
  return expertise.toLowerCase()
    .split(/[,\s]+/)
    .filter(word => word.length > 3)
    .slice(0, 5);
}