/**
 * Kiro Hook: Frontend State Coordination
 * 
 * This hook provides centralized state management coordination between different
 * parts of the AdvisorBoard application, ensuring consistent state across components
 * and enabling advanced features like cross-session persistence and real-time updates.
 */

import type { Advisor, Domain } from '../../src/types/domain';
import type { ConsultationSession } from '../../src/types/session';

export interface GlobalAppState {
  // Domain and advisor state
  availableDomains: Domain[];
  selectedDomain: Domain | null;
  selectedAdvisors: Advisor[];
  
  // Session state
  currentSession: ConsultationSession | null;
  sessionHistory: ConsultationSession[];
  
  // UI state
  isLoading: boolean;
  activeView: 'landing' | 'advisor-selection' | 'consultation' | 'multi-domain';
  theme: 'light' | 'dark';
  
  // User preferences
  userPreferences: UserPreferences;
  
  // Error state
  errors: AppError[];
}

export interface UserPreferences {
  defaultTheme: 'light' | 'dark';
  preferredDomains: string[];
  autoSaveEnabled: boolean;
  exportFormat: 'pdf' | 'markdown';
  maxAdvisorsPerSession: number;
}

export interface AppError {
  id: string;
  type: 'network' | 'validation' | 'persona' | 'export' | 'storage';
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
}

export interface StateAction {
  type: string;
  payload?: any;
}

// Action types
export const STATE_ACTIONS = {
  // Domain actions
  SET_AVAILABLE_DOMAINS: 'SET_AVAILABLE_DOMAINS',
  SELECT_DOMAIN: 'SELECT_DOMAIN',
  
  // Advisor actions
  SELECT_ADVISOR: 'SELECT_ADVISOR',
  DESELECT_ADVISOR: 'DESELECT_ADVISOR',
  CLEAR_ADVISOR_SELECTION: 'CLEAR_ADVISOR_SELECTION',
  UPDATE_ADVISOR_LIST: 'UPDATE_ADVISOR_LIST',
  
  // Session actions
  START_SESSION: 'START_SESSION',
  END_SESSION: 'END_SESSION',
  UPDATE_SESSION: 'UPDATE_SESSION',
  LOAD_SESSION_HISTORY: 'LOAD_SESSION_HISTORY',
  
  // UI actions
  SET_LOADING: 'SET_LOADING',
  CHANGE_VIEW: 'CHANGE_VIEW',
  TOGGLE_THEME: 'TOGGLE_THEME',
  
  // Preference actions
  UPDATE_PREFERENCES: 'UPDATE_PREFERENCES',
  
  // Error actions
  ADD_ERROR: 'ADD_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  CLEAR_ALL_ERRORS: 'CLEAR_ALL_ERRORS'
} as const;

/**
 * Main state reducer for the application
 */
export function appStateReducer(state: GlobalAppState, action: StateAction): GlobalAppState {
  switch (action.type) {
    case STATE_ACTIONS.SET_AVAILABLE_DOMAINS:
      return {
        ...state,
        availableDomains: action.payload,
        errors: state.errors.filter(e => e.type !== 'network')
      };

    case STATE_ACTIONS.SELECT_DOMAIN:
      return {
        ...state,
        selectedDomain: action.payload,
        selectedAdvisors: [], // Clear advisors when switching domains
        activeView: 'advisor-selection'
      };

    case STATE_ACTIONS.SELECT_ADVISOR:
      const advisor = action.payload as Advisor;
      if (state.selectedAdvisors.find(a => a.id === advisor.id)) {
        return state; // Already selected
      }
      
      // Check max advisors limit
      if (state.selectedAdvisors.length >= state.userPreferences.maxAdvisorsPerSession) {
        return {
          ...state,
          errors: [...state.errors, {
            id: `max-advisors-${Date.now()}`,
            type: 'validation',
            message: `Maximum ${state.userPreferences.maxAdvisorsPerSession} advisors allowed per session`,
            timestamp: new Date()
          }]
        };
      }

      return {
        ...state,
        selectedAdvisors: [...state.selectedAdvisors, { ...advisor, isSelected: true }]
      };

    case STATE_ACTIONS.DESELECT_ADVISOR:
      return {
        ...state,
        selectedAdvisors: state.selectedAdvisors.filter(a => a.id !== action.payload)
      };

    case STATE_ACTIONS.CLEAR_ADVISOR_SELECTION:
      return {
        ...state,
        selectedAdvisors: []
      };

    case STATE_ACTIONS.START_SESSION:
      const newSession: ConsultationSession = {
        id: `session-${Date.now()}`,
        selectedAdvisors: state.selectedAdvisors,
        prompt: action.payload.prompt,
        responses: [],
        timestamp: new Date(),
        domain: state.selectedDomain?.id || 'unknown'
      };

      return {
        ...state,
        currentSession: newSession,
        activeView: 'consultation'
      };

    case STATE_ACTIONS.UPDATE_SESSION:
      if (!state.currentSession) return state;
      
      return {
        ...state,
        currentSession: {
          ...state.currentSession,
          ...action.payload
        }
      };

    case STATE_ACTIONS.END_SESSION:
      if (!state.currentSession) return state;

      const completedSession = {
        ...state.currentSession,
        endTime: new Date()
      };

      return {
        ...state,
        currentSession: null,
        sessionHistory: [completedSession, ...state.sessionHistory],
        activeView: 'landing'
      };

    case STATE_ACTIONS.LOAD_SESSION_HISTORY:
      return {
        ...state,
        sessionHistory: action.payload
      };

    case STATE_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };

    case STATE_ACTIONS.CHANGE_VIEW:
      return {
        ...state,
        activeView: action.payload
      };

    case STATE_ACTIONS.TOGGLE_THEME:
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      return {
        ...state,
        theme: newTheme,
        userPreferences: {
          ...state.userPreferences,
          defaultTheme: newTheme
        }
      };

    case STATE_ACTIONS.UPDATE_PREFERENCES:
      return {
        ...state,
        userPreferences: {
          ...state.userPreferences,
          ...action.payload
        }
      };

    case STATE_ACTIONS.ADD_ERROR:
      return {
        ...state,
        errors: [...state.errors, action.payload]
      };

    case STATE_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        errors: state.errors.filter(e => e.id !== action.payload)
      };

    case STATE_ACTIONS.CLEAR_ALL_ERRORS:
      return {
        ...state,
        errors: []
      };

    default:
      return state;
  }
}

/**
 * Creates the initial application state
 */
export function createInitialState(): GlobalAppState {
  return {
    availableDomains: [],
    selectedDomain: null,
    selectedAdvisors: [],
    currentSession: null,
    sessionHistory: [],
    isLoading: false,
    activeView: 'landing',
    theme: 'light',
    userPreferences: {
      defaultTheme: 'light',
      preferredDomains: [],
      autoSaveEnabled: true,
      exportFormat: 'pdf',
      maxAdvisorsPerSession: 5
    },
    errors: []
  };
}

/**
 * State persistence utilities
 */
export const StatePersistence = {
  /**
   * Saves state to localStorage
   */
  saveState(state: Partial<GlobalAppState>): void {
    try {
      const persistableState = {
        userPreferences: state.userPreferences,
        sessionHistory: state.sessionHistory?.slice(0, 10), // Keep last 10 sessions
        theme: state.theme
      };
      
      localStorage.setItem('advisorboard-state', JSON.stringify(persistableState));
    } catch (error) {
      console.warn('Failed to save state to localStorage:', error);
    }
  },

  /**
   * Loads state from localStorage
   */
  loadState(): Partial<GlobalAppState> {
    try {
      const saved = localStorage.getItem('advisorboard-state');
      if (!saved) return {};
      
      const parsed = JSON.parse(saved);
      
      // Convert date strings back to Date objects
      if (parsed.sessionHistory) {
        parsed.sessionHistory = parsed.sessionHistory.map((session: any) => ({
          ...session,
          timestamp: new Date(session.timestamp),
          endTime: session.endTime ? new Date(session.endTime) : undefined,
          responses: session.responses?.map((response: any) => ({
            ...response,
            timestamp: new Date(response.timestamp)
          })) || []
        }));
      }
      
      return parsed;
    } catch (error) {
      console.warn('Failed to load state from localStorage:', error);
      return {};
    }
  },

  /**
   * Clears persisted state
   */
  clearState(): void {
    try {
      localStorage.removeItem('advisorboard-state');
    } catch (error) {
      console.warn('Failed to clear state from localStorage:', error);
    }
  }
};

/**
 * State validation utilities
 */
export const StateValidation = {
  /**
   * Validates that the current state is consistent
   */
  validateState(state: GlobalAppState): AppError[] {
    const errors: AppError[] = [];

    // Validate advisor selection
    if (state.selectedAdvisors.length > 0 && !state.selectedDomain) {
      errors.push({
        id: 'invalid-advisor-selection',
        type: 'validation',
        message: 'Advisors selected without a domain',
        timestamp: new Date(),
        context: { selectedAdvisors: state.selectedAdvisors.length }
      });
    }

    // Validate session state
    if (state.currentSession && state.selectedAdvisors.length === 0) {
      errors.push({
        id: 'invalid-session-state',
        type: 'validation',
        message: 'Active session without selected advisors',
        timestamp: new Date(),
        context: { sessionId: state.currentSession.id }
      });
    }

    // Validate preferences
    if (state.userPreferences.maxAdvisorsPerSession < 1) {
      errors.push({
        id: 'invalid-max-advisors',
        type: 'validation',
        message: 'Maximum advisors per session must be at least 1',
        timestamp: new Date()
      });
    }

    return errors;
  },

  /**
   * Sanitizes state to ensure consistency
   */
  sanitizeState(state: GlobalAppState): GlobalAppState {
    const sanitized = { ...state };

    // Clear invalid advisor selections
    if (sanitized.selectedAdvisors.length > 0 && !sanitized.selectedDomain) {
      sanitized.selectedAdvisors = [];
    }

    // Ensure preferences are within valid ranges
    if (sanitized.userPreferences.maxAdvisorsPerSession < 1) {
      sanitized.userPreferences.maxAdvisorsPerSession = 1;
    }
    if (sanitized.userPreferences.maxAdvisorsPerSession > 10) {
      sanitized.userPreferences.maxAdvisorsPerSession = 10;
    }

    return sanitized;
  }
};

/**
 * Action creators for common state operations
 */
export const StateActions = {
  selectDomain: (domain: Domain): StateAction => ({
    type: STATE_ACTIONS.SELECT_DOMAIN,
    payload: domain
  }),

  selectAdvisor: (advisor: Advisor): StateAction => ({
    type: STATE_ACTIONS.SELECT_ADVISOR,
    payload: advisor
  }),

  startSession: (prompt: string): StateAction => ({
    type: STATE_ACTIONS.START_SESSION,
    payload: { prompt }
  }),

  addError: (error: Omit<AppError, 'id' | 'timestamp'>): StateAction => ({
    type: STATE_ACTIONS.ADD_ERROR,
    payload: {
      ...error,
      id: `error-${Date.now()}`,
      timestamp: new Date()
    }
  }),

  updatePreferences: (preferences: Partial<UserPreferences>): StateAction => ({
    type: STATE_ACTIONS.UPDATE_PREFERENCES,
    payload: preferences
  })
};