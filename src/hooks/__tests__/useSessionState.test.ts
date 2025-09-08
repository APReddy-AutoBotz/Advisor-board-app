import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';
import { useSessionState } from '../useSessionState';
import type { ConsultationSession } from '../../types/session';
import type { Advisor } from '../../types/domain';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock console.warn to avoid noise in tests
const originalWarn = console.warn;
beforeEach(() => {
  console.warn = vi.fn();
  localStorageMock.clear();
});

afterEach(() => {
  console.warn = originalWarn;
});

const mockAdvisor: Advisor = {
  id: 'advisor-1',
  name: 'Dr. Test',
  expertise: 'Testing',
  background: 'Test background',
  domain: {
    id: 'cliniboard',
    name: 'CliniBoard',
    description: 'Clinical domain',
    theme: {
      primary: 'blue-600',
      secondary: 'blue-100',
      accent: 'blue-500',
    },
    advisors: [],
  },
  isSelected: true,
};

const mockSession: ConsultationSession = {
  id: 'session-1',
  selectedAdvisors: [mockAdvisor],
  prompt: 'Test prompt',
  responses: [],
  timestamp: new Date('2024-01-01T10:00:00Z'),
  domain: 'cliniboard',
};

describe('useSessionState', () => {
  describe('Initial State', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useSessionState());

      expect(result.current.currentSession).toBeUndefined();
      expect(result.current.sessionHistory).toEqual([]);
      expect(result.current.selectedDomain).toBeUndefined();
      expect(result.current.selectedAdvisors).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeUndefined();
    });
  });

  describe('Session Management', () => {
    it('should save a session', () => {
      const { result } = renderHook(() => useSessionState());

      act(() => {
        result.current.saveSession(mockSession);
      });

      expect(result.current.currentSession).toEqual(mockSession);
      expect(result.current.sessionHistory).toContain(mockSession);
    });

    it('should update existing session in history', () => {
      const { result } = renderHook(() => useSessionState());

      act(() => {
        result.current.saveSession(mockSession);
      });

      const updatedSession = {
        ...mockSession,
        prompt: 'Updated prompt',
      };

      act(() => {
        result.current.saveSession(updatedSession);
      });

      expect(result.current.sessionHistory).toHaveLength(1);
      expect(result.current.sessionHistory[0].prompt).toBe('Updated prompt');
    });

    it('should load a session by ID', () => {
      const { result } = renderHook(() => useSessionState());

      act(() => {
        result.current.saveSession(mockSession);
      });

      let loadedSession: ConsultationSession | null = null;
      act(() => {
        loadedSession = result.current.loadSession('session-1');
      });

      expect(loadedSession).toEqual(mockSession);
      expect(result.current.currentSession).toEqual(mockSession);
      expect(result.current.selectedAdvisors).toEqual(mockSession.selectedAdvisors);
      expect(result.current.selectedDomain).toBe(mockSession.domain);
    });

    it('should return null for non-existent session', () => {
      const { result } = renderHook(() => useSessionState());

      let loadedSession: ConsultationSession | null = null;
      act(() => {
        loadedSession = result.current.loadSession('non-existent');
      });

      expect(loadedSession).toBeNull();
    });

    it('should delete a session', () => {
      const { result } = renderHook(() => useSessionState());

      act(() => {
        result.current.saveSession(mockSession);
      });

      expect(result.current.sessionHistory).toHaveLength(1);

      act(() => {
        result.current.deleteSession('session-1');
      });

      expect(result.current.sessionHistory).toHaveLength(0);
      expect(result.current.currentSession).toBeUndefined();
    });

    it('should clear all sessions', () => {
      const { result } = renderHook(() => useSessionState());

      const session2 = { ...mockSession, id: 'session-2' };

      act(() => {
        result.current.saveSession(mockSession);
        result.current.saveSession(session2);
      });

      expect(result.current.sessionHistory).toHaveLength(2);

      act(() => {
        result.current.clearAllSessions();
      });

      expect(result.current.sessionHistory).toHaveLength(0);
      expect(result.current.currentSession).toBeUndefined();
    });
  });

  describe('State Updates', () => {
    it('should update current session', () => {
      const { result } = renderHook(() => useSessionState());

      act(() => {
        result.current.saveSession(mockSession);
      });

      act(() => {
        result.current.updateCurrentSession({ prompt: 'Updated prompt' });
      });

      expect(result.current.currentSession?.prompt).toBe('Updated prompt');
    });

    it('should not update if no current session', () => {
      const { result } = renderHook(() => useSessionState());

      act(() => {
        result.current.updateCurrentSession({ prompt: 'Updated prompt' });
      });

      expect(result.current.currentSession).toBeUndefined();
    });

    it('should set selected advisors', () => {
      const { result } = renderHook(() => useSessionState());

      act(() => {
        result.current.setSelectedAdvisors([mockAdvisor]);
      });

      expect(result.current.selectedAdvisors).toEqual([mockAdvisor]);
    });

    it('should set selected domain', () => {
      const { result } = renderHook(() => useSessionState());

      act(() => {
        result.current.setSelectedDomain('cliniboard');
      });

      expect(result.current.selectedDomain).toBe('cliniboard');
    });

    it('should set loading state', () => {
      const { result } = renderHook(() => useSessionState());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('should set error state', () => {
      const { result } = renderHook(() => useSessionState());

      act(() => {
        result.current.setError('Test error');
      });

      expect(result.current.error).toBe('Test error');
    });
  });

  describe('Session Metadata', () => {
    it('should generate session metadata', () => {
      const { result } = renderHook(() => useSessionState());

      act(() => {
        result.current.saveSession(mockSession);
      });

      const metadata = result.current.getSessionMetadata();

      expect(metadata).toHaveLength(1);
      expect(metadata[0]).toEqual({
        sessionId: 'session-1',
        createdAt: mockSession.timestamp,
        updatedAt: mockSession.timestamp,
        domain: 'cliniboard',
        advisorCount: 1,
        responseCount: 0,
      });
    });
  });

  describe('Local Storage Persistence', () => {
    it('should save session state to localStorage', () => {
      const { result } = renderHook(() => useSessionState());

      act(() => {
        result.current.setSelectedDomain('cliniboard');
        result.current.setSelectedAdvisors([mockAdvisor]);
      });

      // Wait for useEffect to run
      act(() => {
        // Trigger a re-render to ensure useEffect runs
      });

      const savedState = JSON.parse(localStorageMock.getItem('advisorboard_session_state') || '{}');
      expect(savedState.selectedDomain).toBe('cliniboard');
      expect(savedState.selectedAdvisors).toHaveLength(1);
    });

    it('should save session history to localStorage', () => {
      const { result } = renderHook(() => useSessionState());

      act(() => {
        result.current.saveSession(mockSession);
      });

      // Wait for useEffect to run
      act(() => {
        // Trigger a re-render to ensure useEffect runs
      });

      const savedHistory = JSON.parse(localStorageMock.getItem('advisorboard_session_history') || '[]');
      expect(savedHistory).toHaveLength(1);
      expect(savedHistory[0].id).toBe('session-1');
    });

    it('should restore session state from localStorage', () => {
      // Pre-populate localStorage
      const stateToSave = {
        selectedDomain: 'cliniboard',
        selectedAdvisors: [mockAdvisor],
        timestamp: new Date().toISOString(),
      };
      localStorageMock.setItem('advisorboard_session_state', JSON.stringify(stateToSave));

      const historyToSave = [{
        ...mockSession,
        timestamp: mockSession.timestamp.toISOString(),
      }];
      localStorageMock.setItem('advisorboard_session_history', JSON.stringify(historyToSave));

      const { result } = renderHook(() => useSessionState());

      // Wait for restoration to complete
      act(() => {
        // Trigger restoration
      });

      expect(result.current.selectedDomain).toBe('cliniboard');
      expect(result.current.selectedAdvisors).toHaveLength(1);
      expect(result.current.sessionHistory).toHaveLength(1);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      // Set invalid JSON in localStorage
      localStorageMock.setItem('advisorboard_session_state', 'invalid json');
      localStorageMock.setItem('advisorboard_session_history', 'invalid json');

      const { result } = renderHook(() => useSessionState());

      // Should not crash and should clear corrupted data
      expect(result.current.selectedDomain).toBeUndefined();
      expect(result.current.sessionHistory).toEqual([]);
      expect(console.warn).toHaveBeenCalled();
    });

    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw errors
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = vi.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      const { result } = renderHook(() => useSessionState());

      act(() => {
        result.current.setSelectedDomain('cliniboard');
      });

      expect(console.warn).toHaveBeenCalledWith(
        'Failed to save session state to localStorage:',
        expect.any(Error)
      );

      // Restore original method
      localStorageMock.setItem = originalSetItem;
    });
  });

  describe('Session Restoration', () => {
    it('should manually restore session state', () => {
      const stateToSave = {
        selectedDomain: 'eduboard',
        selectedAdvisors: [mockAdvisor],
        timestamp: new Date().toISOString(),
      };
      localStorageMock.setItem('advisorboard_session_state', JSON.stringify(stateToSave));

      const { result } = renderHook(() => useSessionState());

      // Clear current state
      act(() => {
        result.current.setSelectedDomain(undefined);
        result.current.setSelectedAdvisors([]);
      });

      // Manually restore
      act(() => {
        result.current.restoreSessionState();
      });

      expect(result.current.selectedDomain).toBe('eduboard');
      expect(result.current.selectedAdvisors).toHaveLength(1);
    });
  });
});