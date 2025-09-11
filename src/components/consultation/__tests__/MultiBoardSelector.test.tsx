import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MultiBoardSelector from '../MultiBoardSelector';
import { getAllBoards, type Board } from '../../../lib/boards';
import ThemeProvider from '../../common/ThemeProvider';

// Mock the boards data
vi.mock('../../../lib/boards', () => ({
  getAllBoards: vi.fn(),
  getBoardById: vi.fn()
}));

// Mock the board themes
vi.mock('../../../lib/boardThemes', () => ({
  getBoardTheme: vi.fn(() => ({
    id: 'test',
    name: 'Test Board',
    gradient: {
      from: '#3B82F6',
      to: '#1E40AF',
      css: 'bg-gradient-to-br from-blue-500 to-blue-700'
    },
    accent: '#2563EB',
    chip: {
      background: '#EFF6FF',
      text: '#2563EB',
      border: '#BFDBFE'
    },
    ring: {
      focus: 'focus:ring-blue-500',
      selection: 'ring-blue-500'
    },
    background: {
      light: '#FFFFFF',
      medium: '#EFF6FF',
      dark: '#1E40AF'
    },
    text: {
      primary: '#0B0E14',
      secondary: '#2563EB',
      muted: '#9CA3AF'
    }
  }))
}));

// Test wrapper with ThemeProvider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

const renderWithTheme = (component: React.ReactElement) => {
  return render(component, { wrapper: TestWrapper });
};

const mockBoards: Board[] = [
  {
    id: 'productboard',
    title: 'Product Development & Strategy',
    tagline: 'Silicon Valley product mastery from unicorn builders',
    description: 'Complete product development expertise from ideation to launch',
    color: {
      primary: '#6366F1',
      secondary: '#C7D2FE',
      accent: '#4F46E5',
      background: '#EEF2FF',
      text: '#312E81'
    },
    experts: [
      {
        id: 'sarah-kim',
        name: 'Sarah Kim',
        code: 'CPO',
        role: 'Chief Product Officer',
        blurb: 'Former CPO at Airbnb',
        credentials: 'Former CPO at Airbnb, Stanford MBA',
        avatar: '/portraits/sarah.png',
        specialties: ['Growth Strategy', 'Platform Products']
      }
    ],
    samplePrompts: ['How do I achieve product-market fit?'],
    benefitOneLiner: 'Scale faster with battle-tested strategies'
  },
  {
    id: 'cliniboard',
    title: 'Clinical Research & Regulatory',
    tagline: 'Navigate FDA approvals with former regulators',
    description: 'Expert guidance for clinical trials and regulatory submissions',
    color: {
      primary: '#2563eb',
      secondary: '#dbeafe',
      accent: '#3b82f6',
      background: '#eff6ff',
      text: '#1e3a8a'
    },
    experts: [
      {
        id: 'sarah-chen',
        name: 'Dr. Sarah Chen',
        code: 'CPO',
        role: 'Clinical Research Strategy',
        blurb: 'Former Pfizer VP',
        credentials: 'MD, PhD, Former FDA Advisory Committee Member',
        avatar: '/portraits/sarah-chen.png',
        specialties: ['Phase III Trials', 'FDA Interactions']
      }
    ],
    samplePrompts: ['How do I prepare for FDA submission?'],
    benefitOneLiner: 'Get FDA-approved guidance'
  },
  {
    id: 'eduboard',
    title: 'Educational Innovation',
    tagline: 'Transform learning with pedagogy experts',
    description: 'Educational innovation and pedagogical excellence',
    color: {
      primary: '#ea580c',
      secondary: '#fed7aa',
      accent: '#f97316',
      background: '#fff7ed',
      text: '#7c2d12'
    },
    experts: [
      {
        id: 'maria-garcia',
        name: 'Prof. Maria Garcia',
        code: 'CURR',
        role: 'Curriculum Design Expert',
        blurb: 'Stanford Professor',
        credentials: 'PhD Education, Stanford Professor',
        avatar: '/portraits/maria.png',
        specialties: ['Curriculum Design', 'Learning Analytics']
      }
    ],
    samplePrompts: ['How do I design effective curriculum?'],
    benefitOneLiner: 'Create transformative learning experiences'
  }
];

describe('MultiBoardSelector', () => {
  const mockOnBoardSelection = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (getAllBoards as any).mockReturnValue(mockBoards);
  });

  it('renders the component with header and description', () => {
    renderWithTheme(
      <MultiBoardSelector
        selectedBoards={[]}
        onBoardSelection={mockOnBoardSelection}
      />
    );

    expect(screen.getByText('Select Advisory Boards')).toBeInTheDocument();
    expect(screen.getByText(/Choose 2 or more boards to get coordinated expert advice/)).toBeInTheDocument();
  });

  it('displays all available boards in a grid layout', () => {
    renderWithTheme(
      <MultiBoardSelector
        selectedBoards={[]}
        onBoardSelection={mockOnBoardSelection}
      />
    );

    // Check that all boards are displayed
    expect(screen.getByText('Product Development & Strategy')).toBeInTheDocument();
    expect(screen.getByText('Clinical Research & Regulatory')).toBeInTheDocument();
    expect(screen.getByText('Educational Innovation')).toBeInTheDocument();

    // Check taglines are displayed
    expect(screen.getByText('Silicon Valley product mastery from unicorn builders')).toBeInTheDocument();
    expect(screen.getByText('Navigate FDA approvals with former regulators')).toBeInTheDocument();
    expect(screen.getByText('Transform learning with pedagogy experts')).toBeInTheDocument();
  });

  it('shows board cards with theme colors and descriptions', () => {
    renderWithTheme(
      <MultiBoardSelector
        selectedBoards={[]}
        onBoardSelection={mockOnBoardSelection}
      />
    );

    // Check descriptions are displayed
    expect(screen.getByText('Complete product development expertise from ideation to launch')).toBeInTheDocument();
    expect(screen.getByText('Expert guidance for clinical trials and regulatory submissions')).toBeInTheDocument();
    expect(screen.getByText('Educational innovation and pedagogical excellence')).toBeInTheDocument();

    // Check expert counts are displayed
    expect(screen.getAllByText('1 experts available')).toHaveLength(3);
  });

  it('displays checkboxes for board selection', () => {
    renderWithTheme(
      <MultiBoardSelector
        selectedBoards={[]}
        onBoardSelection={mockOnBoardSelection}
      />
    );

    // All boards should have clickable cards
    const boardCards = screen.getAllByText(/experts available$/).map(el => el.closest('[class*="cursor-pointer"]')).filter(Boolean);
    expect(boardCards.length).toBeGreaterThan(0);
  });

  it('handles board selection and calls onBoardSelection', async () => {
    renderWithTheme(
      <MultiBoardSelector
        selectedBoards={[]}
        onBoardSelection={mockOnBoardSelection}
      />
    );

    // Click on the first board card
    const productBoardTitle = screen.getByText('Product Development & Strategy');
    const boardCard = productBoardTitle.closest('[class*="cursor-pointer"]');
    
    if (boardCard) {
      fireEvent.click(boardCard);
      await waitFor(() => {
        expect(mockOnBoardSelection).toHaveBeenCalledWith([mockBoards[0]]);
      });
    }
  });

  it('shows selected boards preview with count indicator', () => {
    renderWithTheme(
      <MultiBoardSelector
        selectedBoards={[mockBoards[0], mockBoards[1]]}
        onBoardSelection={mockOnBoardSelection}
      />
    );

    expect(screen.getByText('Selected Boards')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Count in the badge
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });

  it('validates minimum 2 boards requirement', () => {
    const { rerender } = renderWithTheme(
      <MultiBoardSelector
        selectedBoards={[]}
        onBoardSelection={mockOnBoardSelection}
      />
    );

    // No validation message when no boards selected
    expect(screen.queryByText(/Select at least one more board/)).not.toBeInTheDocument();

    // Show validation message when only 1 board selected
    rerender(
      <TestWrapper>
        <MultiBoardSelector
          selectedBoards={[mockBoards[0]]}
          onBoardSelection={mockOnBoardSelection}
        />
      </TestWrapper>
    );

    // Look for the validation message - it's now in an enhanced warning box
    expect(screen.getByText('Multi-Board Selection Required')).toBeInTheDocument();
    expect(screen.getByText('Select at least one more board to enable multi-board consultation')).toBeInTheDocument();

    // No validation message when 2+ boards selected
    rerender(
      <TestWrapper>
        <MultiBoardSelector
          selectedBoards={[mockBoards[0], mockBoards[1]]}
          onBoardSelection={mockOnBoardSelection}
        />
      </TestWrapper>
    );

    expect(screen.queryByText(/Select at least one more board/)).not.toBeInTheDocument();
  });

  it('allows deselecting boards by clicking remove button', async () => {
    renderWithTheme(
      <MultiBoardSelector
        selectedBoards={[mockBoards[0], mockBoards[1]]}
        onBoardSelection={mockOnBoardSelection}
      />
    );

    // Find and click the remove button for the first selected board
    const removeButtons = screen.getAllByLabelText(/Remove/);
    fireEvent.click(removeButtons[0]);

    await waitFor(() => {
      expect(mockOnBoardSelection).toHaveBeenCalledWith([mockBoards[1]]);
    });
  });

  it('respects maxSelections limit', () => {
    renderWithTheme(
      <MultiBoardSelector
        selectedBoards={[mockBoards[0], mockBoards[1]]}
        onBoardSelection={mockOnBoardSelection}
        maxSelections={2}
      />
    );

    // The third board should be disabled (opacity-50 class)
    const eduBoardTitle = screen.getByText('Educational Innovation');
    const eduBoardCard = eduBoardTitle.closest('[class*="opacity-50"]');
    expect(eduBoardCard).toBeInTheDocument();
  });

  it('shows expert specialties and counts', () => {
    renderWithTheme(
      <MultiBoardSelector
        selectedBoards={[]}
        onBoardSelection={mockOnBoardSelection}
      />
    );

    // Check that specialties are shown
    expect(screen.getByText('Growth Strategy')).toBeInTheDocument();
    expect(screen.getByText('Phase III Trials')).toBeInTheDocument();
    expect(screen.getByText('Curriculum Design')).toBeInTheDocument();
  });

  it('displays visual indicators for selected boards', () => {
    renderWithTheme(
      <MultiBoardSelector
        selectedBoards={[mockBoards[0]]}
        onBoardSelection={mockOnBoardSelection}
      />
    );

    // Check that selected board shows "Selected" indicator
    expect(screen.getByText('Selected')).toBeInTheDocument();
  });

  it('shows appropriate selection summary messages', () => {
    const { rerender } = renderWithTheme(
      <MultiBoardSelector
        selectedBoards={[mockBoards[0]]}
        onBoardSelection={mockOnBoardSelection}
      />
    );

    // With 1 board selected, should show validation message but no summary
    expect(screen.queryByText('Multi-Board Consultation Ready')).not.toBeInTheDocument();

    rerender(
      <TestWrapper>
        <MultiBoardSelector
          selectedBoards={[mockBoards[0], mockBoards[1]]}
          onBoardSelection={mockOnBoardSelection}
        />
      </TestWrapper>
    );

    // With 2+ boards selected, should show ready message in the enhanced summary
    expect(screen.getByText('Multi-Board Consultation Ready')).toBeInTheDocument();
    expect(screen.getByText(/2 advisory boards/)).toBeInTheDocument();
  });

  it('uses custom availableBoards when provided', () => {
    const customBoards = [mockBoards[0]];
    
    renderWithTheme(
      <MultiBoardSelector
        availableBoards={customBoards}
        selectedBoards={[]}
        onBoardSelection={mockOnBoardSelection}
      />
    );

    expect(screen.getByText('Product Development & Strategy')).toBeInTheDocument();
    expect(screen.queryByText('Clinical Research & Regulatory')).not.toBeInTheDocument();
    expect(screen.queryByText('Educational Innovation')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const customClass = 'custom-class';
    
    const { container } = renderWithTheme(
      <MultiBoardSelector
        selectedBoards={[]}
        onBoardSelection={mockOnBoardSelection}
        className={customClass}
      />
    );

    expect(container.querySelector(`.${customClass}`)).toBeInTheDocument();
  });
});