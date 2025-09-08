/**
 * Integration tests for Kiro hooks and steering functionality
 */

import { vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKiroIntegration, useKiroContext } from '../useKiroIntegration';
import type { Advisor, Domain } from '../../types/domain';
import type { ConsultationSession } from '../../types/session';

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
    id: 'advisor-1',
    name: 'Dr. Sarah Chen',
    expertise: 'Regulatory Affairs',
    background: 'FDA approval specialist with 15 years experience',
    domain: mockDomain,
    isSelected: false
  },
  {
    id: 'advisor-2',
    name: 'Dr. Michael Rodriguez',
    expertise: 'Clinical Safety',
    background: 'Safety monitoring and adverse event analysis expert',
    domain: mockDomain,
    isSelected: false
  },
  {
    id: 'advisor-3',
    name: 'Dr. Emily Watson',
    expertise: 'Protocol Design',
    background: 'Clinical trial protocol development and methodology',
    domain: mockDomain,
    isSelected: false
  }
];

const mockSession: ConsultationSession = {
  id: 'session-1',
  selectedAdvisors: [mockAdvisors[0]],
  prompt: 'What are the key considerations for FDA approval?',
  responses: [],
  timestamp: new Date(),
  domain: 'cliniboard'
};

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('useKiroIntegration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const { result } = renderHook(() => useKiroIntegration());

      expect(result.current.kiroState.isInitialized).toBe(false);
      expect(result.current.kiroState.config.enablePersonaSwitching).toBe(true);
      expect(result.current.kiroState.config.enableStateManagement).toBe(true);
      expect(result.current.kiroState.config.enableAdvisorPrioritization).toBe(true);
    });

    it('should initialize with custom configuration', () => {
      const customConfig = {
        enablePersonaSwitching: false,
        autoApplyRecommendations: true
      };

      const { result } = renderHook(() => useKiroIntegration(customConfig));

      expect(result.current.kiroState.config.enablePersonaSwitching).toBe(false);
      expect(result.current.kiroState.config.autoApplyRecommendations).toBe(true);
    });

    it('should load persisted state on initialization', async () => {
      const persistedState = {
        userPreferences: {
          defaultTheme: 'dark',
          preferredDomains: ['cliniboard'],
          autoSaveEnabled: true,
          exportFormat: 'markdown',
          maxAdvisorsPerSession: 3
        },
        sessionHistory: [mockSession],
        theme: 'dark'
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(persistedState));

      const { result } = renderHook(() => useKiroIntegration());

      // Wait for initialization to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(result.current.kiroState.isInitialized).toBe(true);
    });
  });

  describe('Advisor Prioritization', () => {
    it('should calculate advisor priorities based on prompt keywords', () => {
      const { result } = renderHook(() => useKiroIntegration());

      act(() => {
        result.current.updateAdvisorPriorities(
          mockAdvisors,
          'We need FDA regulatory guidance for our clinical trial'
        );
      });

      const priorities = result.current.kiroState.advisorPriorities;
      expect(priorities).toHaveLength(3);
      
      // Regulatory expert should have highest priority
      const regulatoryPriority = priorities.find(p => p.advisorId === 'advisor-1');
      expect(regulatoryPriority?.priority).toBeGreaterThan(0.5);
      expect(regulatoryPriority?.reason).toContain('regulatory');
    });

    it('should handle empty prompt gracefully', () => {
      const { result } = renderHook(() => useKiroIntegration());

      act(() => {
        result.current.updateAdvisorPriorities(mockAdvisors, '');
      });

      const priorities = result.current.kiroState.advisorPriorities;
      expect(priorities).toHaveLength(3);
      priorities.forEach(priority => {
        expect(priority.priority).toBeGreaterThanOrEqual(0);
        expect(priority.priority).toBeLessThanOrEqual(1);
      });
    });

    it('should boost frequently used advisors', () => {
      const { result } = renderHook(() => useKiroIntegration());

      // Simulate user preferences with frequently used advisor
      act(() => {
        result.current.dispatch({
          type: 'UPDATE_PREFERENCES',
          payload: {
            frequentlyUsedAdvisors: ['advisor-2']
          }
        });
      });

      act(() => {
        result.current.updateAdvisorPriorities(mockAdvisors, 'safety concerns');
      });

      const priorities = result.current.kiroState.advisorPriorities;
      const safetyPriority = priorities.find(p => p.advisorId === 'advisor-2');
      expect(safetyPriority?.reason).toContain('Frequently used');
    });
  });

  describe('Persona Switch Recommendations', () => {
    it('should generate recommendations based on prompt analysis', () => {
      const { result } = renderHook(() => useKiroIntegration());

      act(() => {
        result.current.updatePersonaRecommendations(
          'We need safety monitoring expertise for adverse events',
          mockAdvisors
        );
      });

      const recommendations = result.current.kiroState.personaRecommendations;
      expect(recommendations.length).toBeGreaterThan(0);
      
      // Should recommend safety specialist
      const safetyRecommendation = recommendations.find(r => r.advisorId === 'advisor-2');
      expect(safetyRecommendation).toBeDefined();
      expect(safetyRecommendation?.suggestedAction).toBe('add');
    });

    it('should recommend removing advisors when overloaded', () => {
      const { result } = renderHook(() => useKiroIntegration());

      // Select all advisors first
      act(() => {
        mockAdvisors.forEach(advisor => {
          result.current.dispatch({
            type: 'SELECT_ADVISOR',
            payload: advisor
          });
        });
      });

      act(() => {
        result.current.updatePersonaRecommendations(
          'Simple regulatory question',
          mockAdvisors
        );
      });

      const recommendations = result.current.kiroState.personaRecommendations;
      const removeRecommendation = recommendations.find(r => r.suggestedAction === 'remove');
      expect(removeRecommendation).toBeDefined();
    });

    it('should apply persona recommendations correctly', () => {
      const { result } = renderHook(() => useKiroIntegration());

      const recommendation = {
        advisorId: 'advisor-2',
        reason: 'Safety expertise needed',
        confidence: 0.8,
        suggestedAction: 'add' as const
      };

      act(() => {
        result.current.applyPersonaRecommendation(recommendation, mockAdvisors);
      });

      expect(result.current.appState.selectedAdvisors).toContainEqual(
        expect.objectContaining({ id: 'advisor-2', isSelected: true })
      );
    });
  });

  describe('State Management', () => {
    it('should handle domain selection', () => {
      const { result } = renderHook(() => useKiroIntegration());

      act(() => {
        result.current.dispatch({
          type: 'SELECT_DOMAIN',
          payload: mockDomain
        });
      });

      expect(result.current.appState.selectedDomain).toEqual(mockDomain);
      expect(result.current.appState.activeView).toBe('advisor-selection');
    });

    it('should handle advisor selection with validation', () => {
      const { result } = renderHook(() => useKiroIntegration());

      act(() => {
        result.current.dispatch({
          type: 'SELECT_ADVISOR',
          payload: mockAdvisors[0]
        });
      });

      expect(result.current.appState.selectedAdvisors).toHaveLength(1);
      expect(result.current.appState.selectedAdvisors[0]).toEqual(
        expect.objectContaining({ id: 'advisor-1', isSelected: true })
      );
    });

    it('should enforce maximum advisors limit', () => {
      const { result } = renderHook(() => useKiroIntegration());

      // Set low limit
      act(() => {
        result.current.dispatch({
          type: 'UPDATE_PREFERENCES',
          payload: { maxAdvisorsPerSession: 1 }
        });
      });

      // Select first advisor
      act(() => {
        result.current.dispatch({
          type: 'SELECT_ADVISOR',
          payload: mockAdvisors[0]
        });
      });

      // Try to select second advisor
      act(() => {
        result.current.dispatch({
          type: 'SELECT_ADVISOR',
          payload: mockAdvisors[1]
        });
      });

      expect(result.current.appState.selectedAdvisors).toHaveLength(1);
      expect(result.current.appState.errors).toContainEqual(
        expect.objectContaining({
          type: 'validation',
          message: expect.stringContaining('Maximum 1 advisors allowed')
        })
      );
    });

    it('should persist state changes', () => {
      const { result } = renderHook(() => useKiroIntegration());

      act(() => {
        result.current.dispatch({
          type: 'UPDATE_PREFERENCES',
          payload: { defaultTheme: 'dark' }
        });
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'advisorboard-state',
        expect.stringContaining('"defaultTheme":"dark"')
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors gracefully', async () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const { result } = renderHook(() => useKiroIntegration());

      // Should still initialize despite storage error
      expect(result.current.kiroState.isInitialized).toBe(false);
      // Should not crash the application
    });

    it('should validate state consistency', () => {
      const { result } = renderHook(() => useKiroIntegration());

      // Create inconsistent state (advisors without domain)
      act(() => {
        result.current.dispatch({
          type: 'SELECT_ADVISOR',
          payload: mockAdvisors[0]
        });
      });

      expect(result.current.appState.errors).toContainEqual(
        expect.objectContaining({
          type: 'validation',
          message: 'Advisors selected without a domain'
        })
      );
    });
  });
});

describe('useKiroContext', () => {
  it('should provide convenience methods', () => {
    const { result } = renderHook(() => useKiroContext());

    expect(typeof result.current.selectDomain).toBe('function');
    expect(typeof result.current.selectAdvisor).toBe('function');
    expect(typeof result.current.startSession).toBe('function');
    expect(typeof result.current.getPrioritizedAdvisors).toBe('function');
  });

  it('should prioritize advisors correctly', () => {
    const { result } = renderHook(() => useKiroContext());

    // Set up some priorities
    act(() => {
      result.current.updateAdvisorPriorities(mockAdvisors, 'regulatory guidance');
    });

    const prioritizedAdvisors = result.current.getPrioritizedAdvisors(mockAdvisors);
    
    expect(prioritizedAdvisors).toHaveLength(3);
    expect(prioritizedAdvisors[0]).toHaveProperty('priority');
    expect(prioritizedAdvisors[0]).toHaveProperty('priorityReason');
    
    // Should be sorted by priority (highest first)
    expect(prioritizedAdvisors[0].priority).toBeGreaterThanOrEqual(prioritizedAdvisors[1].priority);
  });
});

describe('Integration with Steering Rules', () => {
  it('should apply domain-specific prioritization rules', () => {
    const { result } = renderHook(() => useKiroIntegration());

    // Select clinical domain
    act(() => {
      result.current.dispatch({
        type: 'SELECT_DOMAIN',
        payload: mockDomain
      });
    });

    // Update priorities with clinical keywords
    act(() => {
      result.current.updateAdvisorPriorities(
        mockAdvisors,
        'FDA regulatory approval for clinical trial safety'
      );
    });

    const priorities = result.current.kiroState.advisorPriorities;
    
    // Regulatory expert should have highest priority due to FDA keyword
    const regulatoryPriority = priorities.find(p => p.advisorId === 'advisor-1');
    const safetyPriority = priorities.find(p => p.advisorId === 'advisor-2');
    
    expect(regulatoryPriority?.priority).toBeGreaterThan(0.6);
    expect(safetyPriority?.priority).toBeGreaterThan(0.6);
  });

  it('should handle cross-domain scenarios', () => {
    const { result } = renderHook(() => useKiroIntegration());

    // Test with mixed domain keywords
    act(() => {
      result.current.updateAdvisorPriorities(
        mockAdvisors,
        'educational curriculum for clinical research training'
      );
    });

    const priorities = result.current.kiroState.advisorPriorities;
    expect(priorities).toHaveLength(3);
    
    // Should still provide reasonable priorities even with mixed keywords
    priorities.forEach(priority => {
      expect(priority.priority).toBeGreaterThanOrEqual(0);
      expect(priority.priority).toBeLessThanOrEqual(1);
    });
  });
});