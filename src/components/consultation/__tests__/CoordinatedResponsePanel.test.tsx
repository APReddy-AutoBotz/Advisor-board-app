/**
 * CoordinatedResponsePanel Component Tests
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CoordinatedResponsePanel from '../CoordinatedResponsePanel';
import { BOARDS } from '../../../lib/boards';
import type { StaticMultiBoardResult } from '../../../services/staticMultiBoardService';

const mockResults: StaticMultiBoardResult = {
  responses: [
    {
      boardId: 'productboard',
      boardName: 'Product Development & Strategy',
      responses: [
        {
          advisorId: 'sarah-kim',
          content: 'Test product advice content',
          timestamp: new Date(),
          persona: {
            name: 'Sarah Kim',
            expertise: 'Chief Product Officer',
          },
          confidence: 0.9,
        }
      ],
      timestamp: new Date(),
      coordinationContext: 'Product strategy with clinical considerations',
    }
  ],
  crossBoardSummary: '## Test Summary\n\nThis is a test cross-board summary.',
  totalExperts: 1,
  isDemo: true,
};

const mockSelectedBoards = [BOARDS.product];

describe('CoordinatedResponsePanel', () => {
  it('renders question and results correctly', async () => {
    render(
      <CoordinatedResponsePanel
        results={mockResults}
        selectedBoards={mockSelectedBoards}
        question="Test question"
      />
    );

    expect(screen.getByText('Multi-Board Consultation')).toBeInTheDocument();
    expect(screen.getByText('Test question')).toBeInTheDocument();
    
    // Wait for the board response to appear (it might be in loading state initially)
    await waitFor(() => {
      expect(screen.getByText(/Product Development/)).toBeInTheDocument();
    });
    
    await waitFor(() => {
      expect(screen.getByText('Sarah Kim')).toBeInTheDocument();
    });
  });

  it('displays cross-board synthesis when provided', () => {
    render(
      <CoordinatedResponsePanel
        results={mockResults}
        selectedBoards={mockSelectedBoards}
        question="Test question"
      />
    );

    expect(screen.getByText('Cross-Board Synthesis')).toBeInTheDocument();
    expect(screen.getByText('Test Summary')).toBeInTheDocument();
  });

  it('shows expert count and board count correctly', () => {
    render(
      <CoordinatedResponsePanel
        results={mockResults}
        selectedBoards={mockSelectedBoards}
        question="Test question"
      />
    );

    expect(screen.getByText('experts consulted')).toBeInTheDocument();
    expect(screen.getByText('advisory boards')).toBeInTheDocument();
    // The numbers are now in separate badge elements - use getAllByText to handle multiple instances
    const expertCounts = screen.getAllByText('1');
    expect(expertCounts.length).toBeGreaterThan(0); // Should find at least one instance of "1"
  });

  it('handles empty results gracefully', () => {
    const emptyResults: StaticMultiBoardResult = {
      responses: [],
      crossBoardSummary: '',
      totalExperts: 0,
      isDemo: true,
    };

    render(
      <CoordinatedResponsePanel
        results={emptyResults}
        selectedBoards={[]}
        question="Test question"
      />
    );

    expect(screen.getByText('Multi-Board Consultation')).toBeInTheDocument();
    expect(screen.getByText('Test question')).toBeInTheDocument();
  });
});