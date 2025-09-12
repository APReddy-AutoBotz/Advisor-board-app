import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useConsultationState } from '../useConsultationState';
import type { Advisor } from '../../types/domain';

describe('useConsultationState', () => {
  const mockAdvisors: Advisor[] = [
    {
      id: 'advisor-1',
      name: 'Dr. Jane Smith',
      expertise: 'Clinical Research',
      background: 'Expert in clinical trials',
      domain: {
        id: 'cliniboard',
        name: 'Cliniboard',
        description: 'Clinical research domain',
        theme: {
          primary: '#3b82f6',
          secondary: '#1e40af',
          accent: '#60a5fa',
          background: '#eff6ff',
          text: '#1e3a8a',
        },
        advisors: [],
      },
      isSelected: true,
    },
    {
      id: 'advisor-2',
      name: 'Prof. John Doe',
      expertise: 'Regulatory Affairs',
      background: 'FDA compliance expert',
      domain: {
        id: 'cliniboard',
        name: 'Cliniboard',
        description: 'Clinical research domain',
        theme: {
          primary: '#3b82f6',
          secondary: '#1e40af',
          accent: '#60a5fa',
          background: '#eff6ff',
          text: '#1e3a8a',
        },
        advisors: [],
      },
      isSelected: true,
    },
  ];

  it('initializes with empty state', () => {
    const { result } = renderHook(() => useConsultationState());

    expect(result.current.currentSession).toBeNull();
    expect(result.current.selectedAdvisors).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.responses).toEqual([]);
  });

  it('initializes session with advisors', () => {
    const { result } = renderHook(() => useConsultationState());

    act(() => {
      result.current.initializeSession(mockAdvisors);
    });

    expect(result.current.currentSession).not.toBeNull();
    expect(result.current.currentSession?.selectedAdvisors).toEqual(mockAdvisors);
    expect(result.current.currentSession?.domain).toBe('cliniboard');
    expect(result.current.selectedAdvisors).toEqual(mockAdvisors);
    expect(result.current.error).toBeNull();
  });

  it('sets error when initializing session with empty advisors array', () => {
    const { result } = renderHook(() => useConsultationState());

    act(() => {
      result.current.initializeSession([]);
    });

    expect(result.current.currentSession).toBeNull();
    expect(result.current.error).toBe('No advisors provided for session initialization');
  });

  it('generates unique session IDs', () => {
    const { result } = renderHook(() => useConsultationState());

    act(() => {
      result.current.initializeSession(mockAdvisors);
    });

    const firstSessionId = result.current.currentSession?.id;

    act(() => {
      result.current.initializeSession(mockAdvisors);
    });

    const secondSessionId = result.current.currentSession?.id;

    expect(firstSessionId).not.toBe(secondSessionId);
    expect(firstSessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
    expect(secondSessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
  });

  it('submits prompt and generates responses', async () => {
    const { result } = renderHook(() => useConsultationState());

    act(() => {
      result.current.initializeSession(mockAdvisors);
    });

    const testPrompt = 'What are the best practices for clinical trials?';

    await act(async () => {
      await result.current.submitPrompt(testPrompt);
    });

    expect(result.current.currentSession?.prompt).toBe(testPrompt);
    expect(result.current.responses).toHaveLength(2);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();

    // Check that responses are generated for each advisor
    const advisorIds = result.current.responses.map(r => r.advisorId);
    expect(advisorIds).toContain('advisor-1');
    expect(advisorIds).toContain('advisor-2');
  });

  it('sets loading state during prompt submission', async () => {
    const { result } = renderHook(() => useConsultationState());

    act(() => {
      result.current.initializeSession(mockAdvisors);
    });

    // Start the submission but don't await it immediately
    let submitPromise: Promise<void>;
    act(() => {
      submitPromise = result.current.submitPrompt('Test prompt');
    });

    // Check loading state is set immediately
    expect(result.current.isLoading).toBe(true);

    // Now await the promise
    await act(async () => {
      await submitPromise;
    });

    // Check loading state is cleared after completion
    expect(result.current.isLoading).toBe(false);
  });

  it('sets error when submitting prompt without active session', async () => {
    const { result } = renderHook(() => useConsultationState());

    await act(async () => {
      await result.current.submitPrompt('Test prompt');
    });

    expect(result.current.error).toBe('No active session or advisors selected');
    expect(result.current.isLoading).toBe(false);
  });

  it('clears session state', () => {
    const { result } = renderHook(() => useConsultationState());

    // Initialize session first
    act(() => {
      result.current.initializeSession(mockAdvisors);
    });

    expect(result.current.currentSession).not.toBeNull();

    // Clear session
    act(() => {
      result.current.clearSession();
    });

    expect(result.current.currentSession).toBeNull();
    expect(result.current.selectedAdvisors).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.responses).toEqual([]);
  });

  it('clears error state', () => {
    const { result } = renderHook(() => useConsultationState());

    // Set an error first
    act(() => {
      result.current.initializeSession([]);
    });

    expect(result.current.error).not.toBeNull();

    // Clear error
    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('adds individual response', () => {
    const { result } = renderHook(() => useConsultationState());

    act(() => {
      result.current.initializeSession(mockAdvisors);
    });

    const mockResponse = {
      advisorId: 'advisor-1',
      content: 'Test response content',
      timestamp: new Date(),
      persona: {
        name: 'Dr. Jane Smith',
        expertise: 'Clinical Research',
        background: 'Expert in clinical trials',
      },
    };

    act(() => {
      result.current.addResponse(mockResponse);
    });

    expect(result.current.responses).toHaveLength(1);
    expect(result.current.responses[0]).toEqual(mockResponse);
    expect(result.current.currentSession?.responses).toHaveLength(1);
  });

  it('updates session with partial data', () => {
    const { result } = renderHook(() => useConsultationState());

    act(() => {
      result.current.initializeSession(mockAdvisors);
    });

    const updates = {
      prompt: 'Updated prompt',
      summary: 'Test summary',
    };

    act(() => {
      result.current.updateSession(updates);
    });

    expect(result.current.currentSession?.prompt).toBe('Updated prompt');
    expect(result.current.currentSession?.summary).toBe('Test summary');
    expect(result.current.currentSession?.selectedAdvisors).toEqual(mockAdvisors); // Should preserve existing data
  });

  it('handles updateSession when no current session exists', () => {
    const { result } = renderHook(() => useConsultationState());

    const updates = {
      prompt: 'Test prompt',
    };

    act(() => {
      result.current.updateSession(updates);
    });

    expect(result.current.currentSession).toBeNull();
  });

  it('generates domain-specific mock responses', async () => {
    const eduAdvisors = mockAdvisors.map(advisor => ({
      ...advisor,
      domain: {
        ...advisor.domain,
        id: 'eduboard' as const,
        name: 'EduBoard',
      },
    }));

    const { result } = renderHook(() => useConsultationState());

    act(() => {
      result.current.initializeSession(eduAdvisors);
    });

    await act(async () => {
      await result.current.submitPrompt('How can we improve education?');
    });

    // Check that responses contain education-specific content
    const responseContents = result.current.responses.map(r => r.content);
    const hasEducationContent = responseContents.some(content => 
      content.includes('educational') || content.includes('curriculum') || content.includes('learning')
    );
    expect(hasEducationContent).toBe(true);
  });

  it('includes advisor metadata in responses', async () => {
    const { result } = renderHook(() => useConsultationState());

    act(() => {
      result.current.initializeSession(mockAdvisors);
    });

    await act(async () => {
      await result.current.submitPrompt('Test question');
    });

    result.current.responses.forEach(response => {
      expect(response.persona).toHaveProperty('name');
      expect(response.persona).toHaveProperty('expertise');
      expect(response.persona).toHaveProperty('background');
      expect(response.timestamp).toBeInstanceOf(Date);
    });
  });

  it('maintains response order with timestamps', async () => {
    const { result } = renderHook(() => useConsultationState());

    act(() => {
      result.current.initializeSession(mockAdvisors);
    });

    await act(async () => {
      await result.current.submitPrompt('Test question');
    });

    const timestamps = result.current.responses.map(r => r.timestamp.getTime());
    
    // Timestamps should be in ascending order (with small delays between responses)
    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
    }
  });
});
