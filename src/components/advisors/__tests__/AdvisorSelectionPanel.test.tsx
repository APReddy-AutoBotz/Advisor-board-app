import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';
import AdvisorSelectionPanel from '../AdvisorSelectionPanel';
import { yamlConfigLoader } from '../../../services/yamlConfigLoader';
import type { Domain, Advisor } from '../../../types/domain';

// Mock the yamlConfigLoader
vi.mock('../../../services/yamlConfigLoader', () => ({
  yamlConfigLoader: {
    getDomain: vi.fn(),
  },
}));

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
  advisors: [
    {
      id: 'cliniboard-0',
      name: 'Dr. Sanya Rao',
      expertise: 'Regulatory Affairs',
      background: 'Former FDA officer with 15+ years in IND/NDA reviews',
      domain: {} as Domain,
      isSelected: false,
    },
    {
      id: 'cliniboard-1',
      name: 'Dr. Javier Morales',
      expertise: 'Clinical Trials Design',
      background: 'Epidemiologist and PI for 40+ global studies',
      domain: {} as Domain,
      isSelected: false,
    },
  ],
};

// Set domain reference
mockDomain.advisors.forEach(advisor => {
  advisor.domain = mockDomain;
});

describe('AdvisorSelectionPanel', () => {
  const mockOnSelectionComplete = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (yamlConfigLoader.getDomain as any).mockResolvedValue(mockDomain);
  });

  it('renders loading state initially', () => {
    // Create a promise that doesn't resolve immediately
    let resolvePromise: (value: Domain) => void;
    const pendingPromise = new Promise<Domain>((resolve) => {
      resolvePromise = resolve;
    });
    
    (yamlConfigLoader.getDomain as any).mockReturnValue(pendingPromise);

    render(
      <AdvisorSelectionPanel
        domainId="cliniboard"
        onSelectionComplete={mockOnSelectionComplete}
        onBack={mockOnBack}
      />
    );

    expect(screen.getByText('Loading advisors...')).toBeInTheDocument();
    
    // Clean up by resolving the promise
    resolvePromise!(mockDomain);
  });

  it('renders advisors after loading', async () => {
    await act(async () => {
      render(
        <AdvisorSelectionPanel
          domainId="cliniboard"
          onSelectionComplete={mockOnSelectionComplete}
          onBack={mockOnBack}
        />
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Select Your Cliniboard Advisors')).toBeInTheDocument();
    });

    expect(screen.getByText('Dr. Sanya Rao')).toBeInTheDocument();
    expect(screen.getByText('Dr. Javier Morales')).toBeInTheDocument();
    expect(screen.getByText('Regulatory Affairs')).toBeInTheDocument();
    expect(screen.getByText('Clinical Trials Design')).toBeInTheDocument();
  });

  it('allows selecting and deselecting advisors', async () => {
    render(
      <AdvisorSelectionPanel
        domainId="cliniboard"
        onSelectionComplete={mockOnSelectionComplete}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Dr. Sanya Rao')).toBeInTheDocument();
    });

    // Initially no advisors selected
    expect(screen.getByText('0 of 2 advisors selected')).toBeInTheDocument();

    // Select first advisor
    const firstAdvisorCard = screen.getByText('Dr. Sanya Rao').closest('div')?.closest('div');
    if (firstAdvisorCard) {
      fireEvent.click(firstAdvisorCard);
    }

    await waitFor(() => {
      expect(screen.getByText('1 of 2 advisors selected')).toBeInTheDocument();
    });

    // Select second advisor
    const secondAdvisorCard = screen.getByText('Dr. Javier Morales').closest('div')?.closest('div');
    if (secondAdvisorCard) {
      fireEvent.click(secondAdvisorCard);
    }

    await waitFor(() => {
      expect(screen.getByText('2 of 2 advisors selected')).toBeInTheDocument();
    });
  });

  it('enables continue button when advisors are selected', async () => {
    render(
      <AdvisorSelectionPanel
        domainId="cliniboard"
        onSelectionComplete={mockOnSelectionComplete}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Dr. Sanya Rao')).toBeInTheDocument();
    });

    // Continue button should be disabled initially
    const continueButton = screen.getByText(/Continue with \d+ Advisor/);
    expect(continueButton).toBeDisabled();

    // Select an advisor
    const advisorCard = screen.getByText('Dr. Sanya Rao').closest('div')?.closest('div');
    if (advisorCard) {
      fireEvent.click(advisorCard);
    }

    await waitFor(() => {
      expect(continueButton).not.toBeDisabled();
    });
  });

  it('calls onSelectionComplete when continue is clicked', async () => {
    render(
      <AdvisorSelectionPanel
        domainId="cliniboard"
        onSelectionComplete={mockOnSelectionComplete}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Dr. Sanya Rao')).toBeInTheDocument();
    });

    // Select an advisor
    const advisorCard = screen.getByText('Dr. Sanya Rao').closest('div')?.closest('div');
    if (advisorCard) {
      fireEvent.click(advisorCard);
    }

    // Click continue
    const continueButton = screen.getByText(/Continue with \d+ Advisor/);
    fireEvent.click(continueButton);

    expect(mockOnSelectionComplete).toHaveBeenCalledWith([
      expect.objectContaining({
        id: 'cliniboard-0',
        name: 'Dr. Sanya Rao',
        isSelected: true,
      }),
    ]);
  });

  it('handles select all functionality', async () => {
    render(
      <AdvisorSelectionPanel
        domainId="cliniboard"
        onSelectionComplete={mockOnSelectionComplete}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Select All')).toBeInTheDocument();
    });

    // Click select all
    fireEvent.click(screen.getByText('Select All'));

    await waitFor(() => {
      expect(screen.getByText('2 of 2 advisors selected')).toBeInTheDocument();
      expect(screen.getByText('Deselect All')).toBeInTheDocument();
    });

    // Click deselect all
    fireEvent.click(screen.getByText('Deselect All'));

    await waitFor(() => {
      expect(screen.getByText('0 of 2 advisors selected')).toBeInTheDocument();
      expect(screen.getByText('Select All')).toBeInTheDocument();
    });
  });

  it('handles error state', async () => {
    (yamlConfigLoader.getDomain as any).mockRejectedValue(new Error('Failed to load'));

    await act(async () => {
      render(
        <AdvisorSelectionPanel
          domainId="cliniboard"
          onSelectionComplete={mockOnSelectionComplete}
          onBack={mockOnBack}
        />
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Failed to Load Advisors')).toBeInTheDocument();
    });

    expect(screen.getByText('Failed to load')).toBeInTheDocument();
  });
});
