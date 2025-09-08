import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, beforeEach, describe, it, expect } from 'vitest';
import ThemeProvider from '../../common/ThemeProvider';
import SessionManager from '../SessionManager';
import { useSessionState } from '../../../hooks/useSessionState';
import type { ConsultationSession } from '../../../types/session';
import type { Advisor } from '../../../types/domain';

// Mock the useSessionState hook
vi.mock('../../../hooks/useSessionState');
const mockUseSessionState = useSessionState as ReturnType<typeof vi.fn>;

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
      background: 'blue-50',
      text: 'blue-900',
    },
    advisors: [],
  },
  isSelected: true,
};

const mockSession: ConsultationSession = {
  id: 'session-1',
  selectedAdvisors: [mockAdvisor],
  prompt: 'Test prompt for clinical research',
  responses: [
    {
      advisorId: 'advisor-1',
      content: 'Test response',
      timestamp: new Date('2024-01-01T10:30:00Z'),
      persona: {
        name: 'Dr. Test',
        expertise: 'Testing',
        background: 'Test background',
      },
    },
  ],
  timestamp: new Date('2024-01-01T10:00:00Z'),
  domain: 'cliniboard',
};

const mockSessionState = {
  currentSession: undefined,
  sessionHistory: [],
  selectedDomain: undefined,
  selectedAdvisors: [],
  isLoading: false,
  error: undefined,
  saveSession: vi.fn(),
  loadSession: vi.fn(),
  deleteSession: vi.fn(),
  clearAllSessions: vi.fn(),
  restoreSessionState: vi.fn(),
  updateCurrentSession: vi.fn(),
  setSelectedAdvisors: vi.fn(),
  setSelectedDomain: vi.fn(),
  setLoading: vi.fn(),
  setError: vi.fn(),
  getSessionMetadata: vi.fn(() => []),
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('SessionManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSessionState.mockReturnValue(mockSessionState);
  });

  describe('Empty State', () => {
    it('should display empty state when no sessions exist', () => {
      renderWithTheme(<SessionManager />);

      expect(screen.getByText('No Sessions Yet')).toBeInTheDocument();
      expect(screen.getByText('Start your first consultation session to see it appear here.')).toBeInTheDocument();
    });

    it('should show start new session button when onNewSession is provided', () => {
      const mockOnNewSession = vi.fn();
      renderWithTheme(<SessionManager onNewSession={mockOnNewSession} />);

      const startButton = screen.getByText('Start New Session');
      expect(startButton).toBeInTheDocument();

      fireEvent.click(startButton);
      expect(mockOnNewSession).toHaveBeenCalledTimes(1);
    });

    it('should not show start new session button when onNewSession is not provided', () => {
      renderWithTheme(<SessionManager />);

      expect(screen.queryByText('Start New Session')).not.toBeInTheDocument();
    });
  });

  describe('Session List', () => {
    beforeEach(() => {
      mockUseSessionState.mockReturnValue({
        ...mockSessionState,
        sessionHistory: [mockSession],
        getSessionMetadata: vi.fn(() => [
          {
            sessionId: 'session-1',
            createdAt: new Date('2024-01-01T10:00:00Z'),
            updatedAt: new Date('2024-01-01T10:00:00Z'),
            domain: 'cliniboard',
            advisorCount: 1,
            responseCount: 1,
          },
        ]),
      });
    });

    it('should display session history', () => {
      renderWithTheme(<SessionManager />);

      expect(screen.getByText('Session History')).toBeInTheDocument();
      expect(screen.getByText('CliniBoard')).toBeInTheDocument();
      expect(screen.getByText('Test prompt for clinical research')).toBeInTheDocument();
      expect(screen.getByText('1 advisor')).toBeInTheDocument();
      expect(screen.getByText('1 response')).toBeInTheDocument();
    });

    it('should handle session selection', () => {
      const mockOnSessionSelect = vi.fn();
      const mockLoadSession = vi.fn().mockReturnValue(mockSession);
      
      mockUseSessionState.mockReturnValue({
        ...mockSessionState,
        sessionHistory: [mockSession],
        loadSession: mockLoadSession,
        getSessionMetadata: vi.fn(() => [
          {
            sessionId: 'session-1',
            createdAt: new Date('2024-01-01T10:00:00Z'),
            updatedAt: new Date('2024-01-01T10:00:00Z'),
            domain: 'cliniboard',
            advisorCount: 1,
            responseCount: 1,
          },
        ]),
      });

      renderWithTheme(<SessionManager onSessionSelect={mockOnSessionSelect} />);

      const sessionCard = screen.getByText('Test prompt for clinical research').closest('div');
      fireEvent.click(sessionCard!);

      expect(mockLoadSession).toHaveBeenCalledWith('session-1');
      expect(mockOnSessionSelect).toHaveBeenCalledWith(mockSession);
    });

    it('should handle session deletion', () => {
      const mockDeleteSession = vi.fn();
      
      mockUseSessionState.mockReturnValue({
        ...mockSessionState,
        sessionHistory: [mockSession],
        deleteSession: mockDeleteSession,
        getSessionMetadata: vi.fn(() => [
          {
            sessionId: 'session-1',
            createdAt: new Date('2024-01-01T10:00:00Z'),
            updatedAt: new Date('2024-01-01T10:00:00Z'),
            domain: 'cliniboard',
            advisorCount: 1,
            responseCount: 1,
          },
        ]),
      });

      renderWithTheme(<SessionManager />);

      const deleteButton = screen.getByTitle('Delete session');
      fireEvent.click(deleteButton);

      expect(mockDeleteSession).toHaveBeenCalledWith('session-1');
    });

    it('should highlight current session', () => {
      mockUseSessionState.mockReturnValue({
        ...mockSessionState,
        currentSession: mockSession,
        sessionHistory: [mockSession],
        getSessionMetadata: vi.fn(() => [
          {
            sessionId: 'session-1',
            createdAt: new Date('2024-01-01T10:00:00Z'),
            updatedAt: new Date('2024-01-01T10:00:00Z'),
            domain: 'cliniboard',
            advisorCount: 1,
            responseCount: 1,
          },
        ]),
      });

      renderWithTheme(<SessionManager />);

      expect(screen.getByText('Current')).toBeInTheDocument();
    });
  });

  describe('Domain Styling', () => {
    it('should apply correct styling for different domains', () => {
      const eduSession = {
        ...mockSession,
        id: 'session-2',
        domain: 'eduboard',
      };

      const remediSession = {
        ...mockSession,
        id: 'session-3',
        domain: 'remediboard',
      };

      mockUseSessionState.mockReturnValue({
        ...mockSessionState,
        sessionHistory: [mockSession, eduSession, remediSession],
        getSessionMetadata: vi.fn(() => [
          {
            sessionId: 'session-1',
            createdAt: new Date('2024-01-01T10:00:00Z'),
            updatedAt: new Date('2024-01-01T10:00:00Z'),
            domain: 'cliniboard',
            advisorCount: 1,
            responseCount: 1,
          },
          {
            sessionId: 'session-2',
            createdAt: new Date('2024-01-01T10:00:00Z'),
            updatedAt: new Date('2024-01-01T10:00:00Z'),
            domain: 'eduboard',
            advisorCount: 1,
            responseCount: 1,
          },
          {
            sessionId: 'session-3',
            createdAt: new Date('2024-01-01T10:00:00Z'),
            updatedAt: new Date('2024-01-01T10:00:00Z'),
            domain: 'remediboard',
            advisorCount: 1,
            responseCount: 1,
          },
        ]),
      });

      renderWithTheme(<SessionManager />);

      expect(screen.getByText('CliniBoard')).toBeInTheDocument();
      expect(screen.getByText('EduBoard')).toBeInTheDocument();
      expect(screen.getByText('RemediBoard')).toBeInTheDocument();
    });
  });

  describe('Clear All Sessions', () => {
    beforeEach(() => {
      mockUseSessionState.mockReturnValue({
        ...mockSessionState,
        sessionHistory: [mockSession],
        getSessionMetadata: vi.fn(() => [
          {
            sessionId: 'session-1',
            createdAt: new Date('2024-01-01T10:00:00Z'),
            updatedAt: new Date('2024-01-01T10:00:00Z'),
            domain: 'cliniboard',
            advisorCount: 1,
            responseCount: 1,
          },
        ]),
      });
    });

    it('should show clear all button when sessions exist', () => {
      renderWithTheme(<SessionManager />);

      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });

    it('should show confirmation dialog when clear all is clicked', () => {
      renderWithTheme(<SessionManager />);

      fireEvent.click(screen.getByText('Clear All'));

      expect(screen.getByText('Clear All Sessions?')).toBeInTheDocument();
      expect(screen.getByText('This action cannot be undone. All session history will be permanently deleted.')).toBeInTheDocument();
    });

    it('should clear all sessions when confirmed', () => {
      const mockClearAllSessions = vi.fn();
      
      mockUseSessionState.mockReturnValue({
        ...mockSessionState,
        sessionHistory: [mockSession],
        clearAllSessions: mockClearAllSessions,
        getSessionMetadata: vi.fn(() => [
          {
            sessionId: 'session-1',
            createdAt: new Date('2024-01-01T10:00:00Z'),
            updatedAt: new Date('2024-01-01T10:00:00Z'),
            domain: 'cliniboard',
            advisorCount: 1,
            responseCount: 1,
          },
        ]),
      });

      renderWithTheme(<SessionManager />);

      fireEvent.click(screen.getByText('Clear All'));
      fireEvent.click(screen.getByText('Yes, Clear All'));

      expect(mockClearAllSessions).toHaveBeenCalledTimes(1);
    });

    it('should cancel clear all when cancel is clicked', () => {
      const mockClearAllSessions = vi.fn();
      
      mockUseSessionState.mockReturnValue({
        ...mockSessionState,
        sessionHistory: [mockSession],
        clearAllSessions: mockClearAllSessions,
        getSessionMetadata: vi.fn(() => [
          {
            sessionId: 'session-1',
            createdAt: new Date('2024-01-01T10:00:00Z'),
            updatedAt: new Date('2024-01-01T10:00:00Z'),
            domain: 'cliniboard',
            advisorCount: 1,
            responseCount: 1,
          },
        ]),
      });

      renderWithTheme(<SessionManager />);

      fireEvent.click(screen.getByText('Clear All'));
      fireEvent.click(screen.getByText('Cancel'));

      expect(mockClearAllSessions).not.toHaveBeenCalled();
      expect(screen.queryByText('Clear All Sessions?')).not.toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('should format dates correctly', () => {
      mockUseSessionState.mockReturnValue({
        ...mockSessionState,
        sessionHistory: [mockSession],
        getSessionMetadata: vi.fn(() => [
          {
            sessionId: 'session-1',
            createdAt: new Date('2024-01-01T10:00:00Z'),
            updatedAt: new Date('2024-01-01T10:00:00Z'),
            domain: 'cliniboard',
            advisorCount: 1,
            responseCount: 1,
          },
        ]),
      });

      renderWithTheme(<SessionManager />);

      // The exact format may vary based on locale, but should contain date elements
      expect(screen.getByText(/Jan|10:00/)).toBeInTheDocument();
    });
  });

  describe('Pluralization', () => {
    it('should handle singular and plural forms correctly', () => {
      const multiAdvisorSession = {
        ...mockSession,
        selectedAdvisors: [mockAdvisor, { ...mockAdvisor, id: 'advisor-2' }],
        responses: [
          {
            advisorId: 'advisor-1',
            content: 'Response 1',
            timestamp: new Date(),
            persona: { name: 'Dr. Test', expertise: 'Testing', background: 'Test' },
          },
          {
            advisorId: 'advisor-2',
            content: 'Response 2',
            timestamp: new Date(),
            persona: { name: 'Dr. Test 2', expertise: 'Testing', background: 'Test' },
          },
        ],
      };

      mockUseSessionState.mockReturnValue({
        ...mockSessionState,
        sessionHistory: [multiAdvisorSession],
        getSessionMetadata: vi.fn(() => [
          {
            sessionId: 'session-1',
            createdAt: new Date('2024-01-01T10:00:00Z'),
            updatedAt: new Date('2024-01-01T10:00:00Z'),
            domain: 'cliniboard',
            advisorCount: 2,
            responseCount: 2,
          },
        ]),
      });

      renderWithTheme(<SessionManager />);

      expect(screen.getByText('2 advisors')).toBeInTheDocument();
      expect(screen.getByText('2 responses')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing session gracefully', () => {
      mockUseSessionState.mockReturnValue({
        ...mockSessionState,
        sessionHistory: [],
        getSessionMetadata: vi.fn(() => [
          {
            sessionId: 'session-1',
            createdAt: new Date('2024-01-01T10:00:00Z'),
            updatedAt: new Date('2024-01-01T10:00:00Z'),
            domain: 'cliniboard',
            advisorCount: 1,
            responseCount: 1,
          },
        ]),
      });

      renderWithTheme(<SessionManager />);

      // Should not crash and should not display any session cards
      expect(screen.queryByText('Test prompt for clinical research')).not.toBeInTheDocument();
    });

    it('should handle session without prompt', () => {
      const sessionWithoutPrompt = {
        ...mockSession,
        prompt: '',
      };

      mockUseSessionState.mockReturnValue({
        ...mockSessionState,
        sessionHistory: [sessionWithoutPrompt],
        getSessionMetadata: vi.fn(() => [
          {
            sessionId: 'session-1',
            createdAt: new Date('2024-01-01T10:00:00Z'),
            updatedAt: new Date('2024-01-01T10:00:00Z'),
            domain: 'cliniboard',
            advisorCount: 1,
            responseCount: 1,
          },
        ]),
      });

      renderWithTheme(<SessionManager />);

      expect(screen.getByText('No prompt yet')).toBeInTheDocument();
    });
  });
});