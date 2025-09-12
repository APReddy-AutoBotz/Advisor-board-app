import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AdvisorCard from '../AdvisorCard';
import type { Advisor, Domain } from '../../../types/domain';

// Mock ThemeProvider
vi.mock('../../common/ThemeProvider', () => ({
  useTheme: () => ({
    currentDomain: 'cliniboard',
    isDarkMode: false,
  }),
}));

const mockDomain: Domain = {
  id: 'cliniboard',
  name: 'Cliniboard',
  description: 'Clinical research and regulatory guidance',
  theme: {
    primary: 'clinical-600',
    secondary: 'clinical-100',
    accent: 'clinical-500',
    background: 'clinical-50',
    text: 'clinical-900',
  },
  advisors: [],
};

const mockAdvisor: Advisor = {
  id: 'cliniboard-0',
  name: 'Dr. Sanya Rao',
  expertise: 'Regulatory Affairs',
  background: 'Former FDA officer with 15+ years in IND/NDA reviews',
  domain: mockDomain,
  isSelected: false,
};

describe('AdvisorCard', () => {
  const mockOnToggleSelection = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders advisor information correctly', () => {
    render(
      <AdvisorCard
        advisor={mockAdvisor}
        isSelected={false}
        onToggleSelection={mockOnToggleSelection}
      />
    );

    expect(screen.getByText('Dr. Sanya Rao')).toBeInTheDocument();
    expect(screen.getByText('Regulatory Affairs')).toBeInTheDocument();
    expect(screen.getByText('Former FDA officer with 15+ years in IND/NDA reviews')).toBeInTheDocument();
  });

  it('shows unchecked checkbox when not selected', () => {
    render(
      <AdvisorCard
        advisor={mockAdvisor}
        isSelected={false}
        onToggleSelection={mockOnToggleSelection}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('shows checked checkbox when selected', () => {
    render(
      <AdvisorCard
        advisor={mockAdvisor}
        isSelected={true}
        onToggleSelection={mockOnToggleSelection}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('shows selection indicator when selected', () => {
    render(
      <AdvisorCard
        advisor={mockAdvisor}
        isSelected={true}
        onToggleSelection={mockOnToggleSelection}
      />
    );

    expect(screen.getByText('Selected for consultation')).toBeInTheDocument();
  });

  it('calls onToggleSelection when card is clicked', () => {
    render(
      <AdvisorCard
        advisor={mockAdvisor}
        isSelected={false}
        onToggleSelection={mockOnToggleSelection}
      />
    );

    const card = screen.getByText('Dr. Sanya Rao').closest('div')?.closest('div')?.closest('div');
    if (card) {
      fireEvent.click(card);
    }

    expect(mockOnToggleSelection).toHaveBeenCalledWith(mockAdvisor);
  });

  it('calls onToggleSelection when checkbox is clicked', () => {
    render(
      <AdvisorCard
        advisor={mockAdvisor}
        isSelected={false}
        onToggleSelection={mockOnToggleSelection}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(mockOnToggleSelection).toHaveBeenCalledWith(mockAdvisor);
  });

  it('applies correct styling for different domains', () => {
    const educationAdvisor = {
      ...mockAdvisor,
      domain: { ...mockDomain, id: 'eduboard' as const },
    };

    const { rerender, container } = render(
      <AdvisorCard
        advisor={educationAdvisor}
        isSelected={true}
        onToggleSelection={mockOnToggleSelection}
      />
    );

    // Find the outermost card element (the one with the ring styling)
    const card = container.querySelector('[class*="ring-education-500"]');
    expect(card).toBeTruthy();
    expect(card?.className).toContain('ring-education-500');

    // Test remedies domain
    const remediesAdvisor = {
      ...mockAdvisor,
      domain: { ...mockDomain, id: 'remediboard' as const },
    };

    rerender(
      <AdvisorCard
        advisor={remediesAdvisor}
        isSelected={true}
        onToggleSelection={mockOnToggleSelection}
      />
    );

    const newCard = container.querySelector('[class*="ring-remedies-500"]');
    expect(newCard).toBeTruthy();
    expect(newCard?.className).toContain('ring-remedies-500');
  });
});
