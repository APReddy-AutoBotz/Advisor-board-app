/**
 * DemoInput Component Tests
 * Tests for interactive demo input with skeleton loading states
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import DemoInput from '../DemoInput';

// Mock the analytics tracking
const mockGtag = vi.fn();
Object.defineProperty(window, 'gtag', {
  value: mockGtag,
  writable: true
});

describe('DemoInput', () => {
  const mockOnStartSession = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders demo input form with default question', () => {
    render(<DemoInput onStartSession={mockOnStartSession} />);
    
    expect(screen.getByLabelText(/ask your question to ai advisors/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/should we run a dose-escalation pilot/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /get multi-expert advice/i })).toBeInTheDocument();
  });

  it('displays disclaimer banner that stays visible', () => {
    render(<DemoInput onStartSession={mockOnStartSession} />);
    
    const disclaimer = screen.getByText(/this is a demo simulation/i);
    expect(disclaimer).toBeInTheDocument();
    expect(disclaimer.closest('[role="note"]')).toBeInTheDocument();
  });

  it('handles form submission and shows skeleton loading states', () => {
    render(<DemoInput onStartSession={mockOnStartSession} />);
    
    const submitButton = screen.getByRole('button', { name: /get multi-expert advice/i });
    fireEvent.click(submitButton);

    // Should show loading state immediately
    expect(screen.getByText(/getting advice/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/loading advisor responses/i)).toBeInTheDocument();
  });

  it('transitions from skeleton to advisor cards after delay', async () => {
    render(<DemoInput onStartSession={mockOnStartSession} />);
    
    const submitButton = screen.getByRole('button', { name: /get multi-expert advice/i });
    
    act(() => {
      fireEvent.click(submitButton);
    });

    // Fast-forward through the loading delay (900ms)
    act(() => {
      vi.advanceTimersByTime(900);
    });

    await waitFor(() => {
      expect(screen.getByText(/dr. sarah chen/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/marcus rodriguez/i)).toBeInTheDocument();
    expect(screen.getByText(/topline summary/i)).toBeInTheDocument();
  });

  it('tracks analytics events on demo submission', () => {
    render(<DemoInput onStartSession={mockOnStartSession} />);
    
    const submitButton = screen.getByRole('button', { name: /get multi-expert advice/i });
    fireEvent.click(submitButton);

    expect(mockGtag).toHaveBeenCalledWith('event', 'hero_demo_submit', {
      question_preview: expect.stringContaining('Should we run a dose-escalation pilot'),
      location: 'hero_panel'
    });
  });

  it('disables input during loading state', () => {
    render(<DemoInput onStartSession={mockOnStartSession} />);
    
    const textarea = screen.getByLabelText(/ask your question to ai advisors/i);
    const submitButton = screen.getByRole('button', { name: /get multi-expert advice/i });
    
    fireEvent.click(submitButton);

    expect(textarea).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it('shows reset button after results are displayed', async () => {
    render(<DemoInput onStartSession={mockOnStartSession} />);
    
    const submitButton = screen.getByRole('button', { name: /get multi-expert advice/i });
    
    act(() => {
      fireEvent.click(submitButton);
      vi.advanceTimersByTime(900);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /reset demo/i })).toBeInTheDocument();
    });
  });

  it('resets demo state when reset button is clicked', async () => {
    render(<DemoInput onStartSession={mockOnStartSession} />);
    
    const submitButton = screen.getByRole('button', { name: /get multi-expert advice/i });
    
    act(() => {
      fireEvent.click(submitButton);
      vi.advanceTimersByTime(900);
    });

    await waitFor(() => {
      const resetButton = screen.getByRole('button', { name: /reset demo/i });
      fireEvent.click(resetButton);
    });

    // Should return to initial state
    expect(screen.getByRole('button', { name: /get multi-expert advice/i })).toBeInTheDocument();
    expect(screen.queryByText(/dr. sarah chen/i)).not.toBeInTheDocument();
  });

  it('shows start session button after results are displayed', async () => {
    render(<DemoInput onStartSession={mockOnStartSession} />);
    
    const submitButton = screen.getByRole('button', { name: /get multi-expert advice/i });
    
    act(() => {
      fireEvent.click(submitButton);
      vi.advanceTimersByTime(900);
    });

    await waitFor(() => {
      const startSessionButton = screen.getByRole('button', { name: /start full session/i });
      expect(startSessionButton).toBeInTheDocument();
      
      fireEvent.click(startSessionButton);
      expect(mockOnStartSession).toHaveBeenCalled();
    });
  });

  it('handles different variants correctly', () => {
    const { rerender } = render(<DemoInput variant="hero" />);
    expect(screen.getByLabelText(/ask your question to ai advisors/i)).toHaveAttribute('id', 'demo-question-hero');

    rerender(<DemoInput variant="sticky" />);
    expect(screen.getByLabelText(/ask your question to ai advisors/i)).toHaveAttribute('id', 'demo-question-sticky');
  });

  it('prevents submission with empty question', () => {
    render(<DemoInput onStartSession={mockOnStartSession} />);
    
    const textarea = screen.getByLabelText(/ask your question to ai advisors/i);
    const submitButton = screen.getByRole('button', { name: /get multi-expert advice/i });
    
    fireEvent.change(textarea, { target: { value: '' } });
    
    expect(submitButton).toBeDisabled();
  });

  it('respects character limit on textarea', () => {
    render(<DemoInput onStartSession={mockOnStartSession} />);
    
    const textarea = screen.getByLabelText(/ask your question to ai advisors/i) as HTMLTextAreaElement;
    expect(textarea.maxLength).toBe(200);
  });

  it('has proper accessibility attributes', () => {
    render(<DemoInput onStartSession={mockOnStartSession} />);
    
    const textarea = screen.getByLabelText(/ask your question to ai advisors/i);
    expect(textarea).toHaveAttribute('aria-describedby', 'demo-disclaimer-hero');
    
    const disclaimer = screen.getByRole('note');
    expect(disclaimer).toHaveAttribute('id', 'demo-disclaimer-hero');
  });
});
