import { useState, useCallback, useEffect } from 'react';
import type { Advisor, AdvisorResponse } from '../types/domain';
import type { ConsultationSession } from '../types/session';

interface ConsultationState {
  currentSession: ConsultationSession | null;
  selectedAdvisors: Advisor[];
  isLoading: boolean;
  error: string | null;
  responses: AdvisorResponse[];
}

interface UseConsultationStateReturn extends ConsultationState {
  initializeSession: (advisors: Advisor[]) => void;
  submitPrompt: (prompt: string) => Promise<void>;
  clearSession: () => void;
  clearError: () => void;
  addResponse: (response: AdvisorResponse) => void;
  updateSession: (updates: Partial<ConsultationSession>) => void;
}

const useConsultationState = (): UseConsultationStateReturn => {
  const [state, setState] = useState<ConsultationState>({
    currentSession: null,
    selectedAdvisors: [],
    isLoading: false,
    error: null,
    responses: [],
  });

  const generateSessionId = (): string => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const initializeSession = useCallback((advisors: Advisor[]) => {
    if (advisors.length === 0) {
      setState(prev => ({
        ...prev,
        error: 'No advisors provided for session initialization',
      }));
      return;
    }

    const session: ConsultationSession = {
      id: generateSessionId(),
      selectedAdvisors: advisors,
      prompt: '',
      responses: [],
      timestamp: new Date(),
      domain: advisors[0]?.domain?.id || 'unknown',
    };

    setState(prev => ({
      ...prev,
      currentSession: session,
      selectedAdvisors: advisors,
      responses: [],
      error: null,
    }));
  }, []);

  const submitPrompt = useCallback(async (prompt: string) => {
    if (!state.currentSession || state.selectedAdvisors.length === 0) {
      setState(prev => ({
        ...prev,
        error: 'No active session or advisors selected',
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      // Update session with prompt
      const updatedSession = {
        ...state.currentSession,
        prompt,
        timestamp: new Date(),
      };

      setState(prev => ({
        ...prev,
        currentSession: updatedSession,
      }));

      // Generate mock responses (in real implementation, this would call AI service)
      const mockResponses = await generateMockResponses(state.selectedAdvisors, prompt);
      
      // Update session with responses
      const finalSession = {
        ...updatedSession,
        responses: mockResponses,
      };

      setState(prev => ({
        ...prev,
        currentSession: finalSession,
        responses: mockResponses,
        isLoading: false,
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to get advisor responses',
        isLoading: false,
      }));
    }
  }, [state.currentSession, state.selectedAdvisors]);

  const clearSession = useCallback(() => {
    setState({
      currentSession: null,
      selectedAdvisors: [],
      isLoading: false,
      error: null,
      responses: [],
    });
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  const addResponse = useCallback((response: AdvisorResponse) => {
    setState(prev => ({
      ...prev,
      responses: [...prev.responses, response],
      currentSession: prev.currentSession ? {
        ...prev.currentSession,
        responses: [...prev.responses, response],
      } : null,
    }));
  }, []);

  const updateSession = useCallback((updates: Partial<ConsultationSession>) => {
    setState(prev => ({
      ...prev,
      currentSession: prev.currentSession ? {
        ...prev.currentSession,
        ...updates,
      } : null,
    }));
  }, []);

  // Mock response generation (to be replaced with actual AI integration)
  const generateMockResponses = async (advisors: Advisor[], prompt: string): Promise<AdvisorResponse[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
    
    return advisors.map((advisor, index) => ({
      advisorId: advisor.id,
      content: generateMockResponse(advisor, prompt),
      timestamp: new Date(Date.now() + index * 200), // Slight delay between responses
      persona: {
        name: advisor.name,
        expertise: advisor.expertise,
        background: advisor.background,
      },
    }));
  };

  const generateMockResponse = (advisor: Advisor, prompt: string): string => {
    const domainResponses = {
      cliniboard: [
        `From a clinical research perspective, this question touches on several important regulatory considerations. Based on my experience with FDA protocols, I would recommend establishing clear safety endpoints and ensuring robust data collection mechanisms.`,
        `As someone who has overseen numerous clinical trials, I believe this approach requires careful consideration of patient safety and regulatory compliance. The evidence suggests we should prioritize established protocols while remaining open to innovative methodologies.`,
        `This is an excellent question that highlights the complexity of modern clinical research. From my background in regulatory affairs, I would emphasize the importance of following ICH-GCP guidelines while maintaining scientific rigor.`,
      ],
      eduboard: [
        `From an educational standpoint, this challenge requires a multi-faceted approach that considers both pedagogical theory and practical implementation. Research shows that student engagement increases significantly when we incorporate active learning strategies.`,
        `As an educator with experience in curriculum development, I believe this issue calls for a comprehensive review of our current practices. We need to ensure that our approaches are both evidence-based and culturally responsive.`,
        `This question touches on fundamental principles of educational equity and access. Based on my research in learning sciences, I would recommend implementing differentiated instruction strategies that meet diverse learner needs.`,
      ],
      remediboard: [
        `From a traditional medicine perspective, this concern has been addressed for centuries through holistic approaches that consider the whole person. Ancient wisdom combined with modern understanding suggests a balanced approach focusing on root causes.`,
        `As a practitioner of integrative medicine, I believe this situation calls for a comprehensive approach that honors both traditional healing methods and contemporary scientific understanding. The mind-body connection is particularly relevant here.`,
        `This is a thoughtful question that highlights the importance of natural healing approaches. Based on traditional practices and emerging research, I would recommend considering herbal remedies alongside lifestyle modifications.`,
      ],
    };

    const domainId = advisor.domain?.id || 'cliniboard';
    const responses = domainResponses[domainId as keyof typeof domainResponses] || domainResponses.cliniboard;
    const baseResponse = responses[Math.floor(Math.random() * responses.length)];
    
    return `${baseResponse}\n\nAs ${advisor.name}, with my expertise in ${advisor.expertise}, I believe this approach aligns with current best practices in our field. ${advisor.background}\n\nI'd be happy to elaborate on any specific aspect of this recommendation or discuss how it might be implemented in your particular context.`;
  };

  return {
    ...state,
    initializeSession,
    submitPrompt,
    clearSession,
    clearError,
    addResponse,
    updateSession,
  };
};

export { useConsultationState };
export default useConsultationState;