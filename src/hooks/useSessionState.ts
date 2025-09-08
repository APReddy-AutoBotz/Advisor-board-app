import { useState, useCallback, useEffect } from 'react';
import type { ConsultationSession, SessionState, SessionMetadata } from '../types/session';
import type { Advisor } from '../types/domain';

const SESSION_STORAGE_KEY = 'advisorboard_session_state';
const SESSION_HISTORY_KEY = 'advisorboard_session_history';

interface UseSessionStateReturn extends SessionState {
  saveSession: (session: ConsultationSession) => void;
  loadSession: (sessionId: string) => ConsultationSession | null;
  deleteSession: (sessionId: string) => void;
  clearAllSessions: () => void;
  restoreSessionState: () => void;
  updateCurrentSession: (updates: Partial<ConsultationSession>) => void;
  setSelectedAdvisors: (advisors: Advisor[]) => void;
  setSelectedDomain: (domain: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | undefined) => void;
  getSessionMetadata: () => SessionMetadata[];
}

const useSessionState = (): UseSessionStateReturn => {
  const [state, setState] = useState<SessionState>({
    currentSession: undefined,
    sessionHistory: [],
    selectedDomain: undefined,
    selectedAdvisors: [],
    isLoading: false,
    error: undefined,
  });

  // Load session state from localStorage on mount
  useEffect(() => {
    restoreSessionState();
  }, []);

  // Save session state to localStorage whenever it changes
  useEffect(() => {
    if (state.currentSession || state.selectedDomain || state.selectedAdvisors.length > 0) {
      const stateToSave = {
        currentSession: state.currentSession,
        selectedDomain: state.selectedDomain,
        selectedAdvisors: state.selectedAdvisors,
        timestamp: new Date().toISOString(),
      };
      
      try {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(stateToSave));
      } catch (error) {
        console.warn('Failed to save session state to localStorage:', error);
      }
    }
  }, [state.currentSession, state.selectedDomain, state.selectedAdvisors]);

  // Save session history to localStorage whenever it changes
  useEffect(() => {
    if (state.sessionHistory.length > 0) {
      try {
        const historyToSave = state.sessionHistory.map(session => ({
          ...session,
          timestamp: session.timestamp.toISOString(),
        }));
        localStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(historyToSave));
      } catch (error) {
        console.warn('Failed to save session history to localStorage:', error);
      }
    }
  }, [state.sessionHistory]);

  const saveSession = useCallback((session: ConsultationSession) => {
    setState(prev => {
      // Check if session already exists in history
      const existingIndex = prev.sessionHistory.findIndex(s => s.id === session.id);
      let newHistory;
      
      if (existingIndex >= 0) {
        // Update existing session
        newHistory = [...prev.sessionHistory];
        newHistory[existingIndex] = session;
      } else {
        // Add new session to history
        newHistory = [...prev.sessionHistory, session];
      }

      return {
        ...prev,
        sessionHistory: newHistory,
        currentSession: session,
      };
    });
  }, []);

  const loadSession = useCallback((sessionId: string): ConsultationSession | null => {
    const session = state.sessionHistory.find(s => s.id === sessionId);
    if (session) {
      setState(prev => ({
        ...prev,
        currentSession: session,
        selectedAdvisors: session.selectedAdvisors,
        selectedDomain: session.domain,
      }));
      return session;
    }
    return null;
  }, [state.sessionHistory]);

  const deleteSession = useCallback((sessionId: string) => {
    setState(prev => {
      const newHistory = prev.sessionHistory.filter(s => s.id !== sessionId);
      const newCurrentSession = prev.currentSession?.id === sessionId 
        ? undefined 
        : prev.currentSession;

      return {
        ...prev,
        sessionHistory: newHistory,
        currentSession: newCurrentSession,
      };
    });
  }, []);

  const clearAllSessions = useCallback(() => {
    setState(prev => ({
      ...prev,
      sessionHistory: [],
      currentSession: undefined,
    }));
    
    try {
      localStorage.removeItem(SESSION_HISTORY_KEY);
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear session data from localStorage:', error);
    }
  }, []);

  const restoreSessionState = useCallback(() => {
    try {
      // Restore current session state
      const savedState = localStorage.getItem(SESSION_STORAGE_KEY);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        
        setState(prev => ({
          ...prev,
          currentSession: parsedState.currentSession ? {
            ...parsedState.currentSession,
            timestamp: new Date(parsedState.currentSession.timestamp),
          } : undefined,
          selectedDomain: parsedState.selectedDomain,
          selectedAdvisors: parsedState.selectedAdvisors || [],
        }));
      }

      // Restore session history
      const savedHistory = localStorage.getItem(SESSION_HISTORY_KEY);
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        const restoredHistory = parsedHistory.map((session: any) => ({
          ...session,
          timestamp: new Date(session.timestamp),
        }));
        
        setState(prev => ({
          ...prev,
          sessionHistory: restoredHistory,
        }));
      }
    } catch (error) {
      console.warn('Failed to restore session state from localStorage:', error);
      // Clear corrupted data
      try {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        localStorage.removeItem(SESSION_HISTORY_KEY);
      } catch (clearError) {
        console.warn('Failed to clear corrupted session data:', clearError);
      }
    }
  }, []);

  const updateCurrentSession = useCallback((updates: Partial<ConsultationSession>) => {
    setState(prev => {
      if (!prev.currentSession) return prev;
      
      const updatedSession = {
        ...prev.currentSession,
        ...updates,
      };

      return {
        ...prev,
        currentSession: updatedSession,
      };
    });
  }, []);

  const setSelectedAdvisors = useCallback((advisors: Advisor[]) => {
    setState(prev => ({
      ...prev,
      selectedAdvisors: advisors,
    }));
  }, []);

  const setSelectedDomain = useCallback((domain: string) => {
    setState(prev => ({
      ...prev,
      selectedDomain: domain,
    }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({
      ...prev,
      isLoading: loading,
    }));
  }, []);

  const setError = useCallback((error: string | undefined) => {
    setState(prev => ({
      ...prev,
      error,
    }));
  }, []);

  const getSessionMetadata = useCallback((): SessionMetadata[] => {
    return state.sessionHistory.map(session => ({
      sessionId: session.id,
      createdAt: session.timestamp,
      updatedAt: session.timestamp, // For now, using same timestamp
      domain: session.domain || 'unknown',
      advisorCount: session.selectedAdvisors.length,
      responseCount: session.responses.length,
    }));
  }, [state.sessionHistory]);

  return {
    ...state,
    saveSession,
    loadSession,
    deleteSession,
    clearAllSessions,
    restoreSessionState,
    updateCurrentSession,
    setSelectedAdvisors,
    setSelectedDomain,
    setLoading,
    setError,
    getSessionMetadata,
  };
};

export { useSessionState };
export default useSessionState;