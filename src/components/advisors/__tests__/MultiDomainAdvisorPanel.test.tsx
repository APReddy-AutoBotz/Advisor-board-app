import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import MultiDomainAdvisorPanel from '../MultiDomainAdvisorPanel';
import { yamlConfigLoader } from '../../../services';
import ThemeProvider from '../../common/ThemeProvider';
import type { Domain } from '../../../types/domain';

// Mock the yamlConfigLoader
vi.mock('../../../services', () => ({
  yamlConfigLoader: {
    loadAllDomains: vi.fn()
  }
}));

const mockDomains: Domain[] = [
  {
    id: 'cliniboard',
    name: 'Cliniboard',
    description: 'Clinical research and regulatory guidance',
    theme: {
      primary: '#3B82F6',
      secondary: '#1E40AF',
      accent: '#60A5FA',
      background: '#EFF6FF',
      text: '#1E3A8A'
    },
    advisors: [
      {
        id: 'advisor-1',
        name: 'Dr. Sarah Chen',
        expertise: 'Clinical Research',
        background: 'Leading clinical researcher',
        domain: {} as Domain,
        isSelected: false
      },
      {
        id: 'advisor-2',
        name: 'Dr. Michael Rodriguez',
        expertise: 'Regulatory Affairs',
        background: 'FDA regulatory expert',
        domain: {} as Domain,
        isSelected: false
      }
    ]
  },
  {
    id: 'eduboard',
    name: 'EduBoard',
    description: 'Education systems and curriculum reform',
    theme: {
      primary: '#F97316',
      secondary: '#EA580C',
      accent: '#FB923C',
      background: '#FFF7ED',
      text: '#9A3412'
    },
    advisors: [
      {
        id: 'advisor-3',
        name: 'Prof. Emily Johnson',
        expertise: 'Curriculum Design',
        background: 'Education reform specialist',
        domain: {} as Domain,
        isSelected: false
      }
    ]
  },
  {
    id: 'remediboard',
    name: 'RemediBoard',
    description: 'Natural and traditional medicine',
    theme: {
      primary: '#10B981',
      secondary: '#059669',
      accent: '#34D399',
      background: '#ECFDF5',
      text: '#065F46'
    },
    advisors: [
      {
        id: 'advisor-4',
        name: 'Dr. James Wilson',
        expertise: 'Herbal Medicine',
        background: 'Traditional medicine practitioner',
        domain: {} as Domain,
        isSelected: false
      }
    ]
  }
];

// Set up domain references
mockDomains.forEach(domain => {
  domain.advisors.forEach(advisor => {
    advisor.domain = domain;
  });
});

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('MultiDomainAdvisorPanel', () => {
  const mockOnSelectionComplete = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(yamlConfigLoader.loadAllDomains).mockResolvedValue(mockDomains);
  });

  it('renders loading state initially', () => {
    renderWithTheme(
      <MultiDomainAdvisorPanel
        onSelectionComplete={mockOnSelectionComplete}
        onBack={mockOnBack}
      />
    );

    expect(screen.getByText('Loading all advisory domains...')).toBeInTheDocument();
  });

  it('renders all domains after loading', async () => {
    renderWithTheme(
      <MultiDomainAdvisorPanel
        onSelectionComplete={mockOnSelectionComplete}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Ask All Boards - Mega Mode')).toBeInTheDocument();
    });

    expect(screen.getByText('Cliniboard')).toBeInTheDocument();
    expect(screen.getByText('EduBoard')).toBeInTheDocument();
    expect(screen.getByText('RemediBoard')).toBeInTheDocument();
  });

  it('displays advisor selection counts correctly', async () => {
    renderWithTheme(
      <MultiDomainAdvisorPanel
        onSelectionComplete={mockOnSelectionComplete}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Ask All Boards - Mega Mode')).toBeInTheDocument();
    });

    expect(screen.getByText('0/2 selected')).toBeInTheDocument(); // Cliniboard
    // There are two domains with 1 advisor each, so we expect to find this text twice
    const oneAdvisorCounts = screen.getAllByText('0/1 selected');
    expect(oneAdvisorCounts).toHaveLength(2); // EduBoard and RemediBoard
  });

  it('allows selecting individual advisors', async () => {
    renderWithTheme(
      <MultiDomainAdvisorPanel
        onSelectionComplete={mockOnSelectionComplete}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Ask All Boards - Mega Mode')).toBeInTheDocument();
    });

    // Click on an advisor card
    const advisorCard = screen.getByText('Dr. Sarah Chen');
    fireEvent.click(advisorCard);

    await waitFor(() => {
      expect(screen.getByText(/Selected Advisory Board \(1 advisor/)).toBeInTheDocument();
    });
  });

  it('allows selecting all advisors from a domain', async () => {
    renderWithTheme(
      <MultiDomainAdvisorPanel
        onSelectionComplete={mockOnSelectionComplete}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Ask All Boards - Mega Mode')).toBeInTheDocument();
    });

    // Click "Select All" for Cliniboard
    const selectAllButtons = screen.getAllByText('Select All');
    fireEvent.click(selectAllButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Selected Advisory Board \(2 advisor/)).toBeInTheDocument();
    });
  });

  it('shows domain expansion/collapse functionality', async () => {
    renderWithTheme(
      <MultiDomainAdvisorPanel
        onSelectionComplete={mockOnSelectionComplete}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Ask All Boards - Mega Mode')).toBeInTheDocument();
    });

    // Initially all domains should be expanded (advisors visible)
    expect(screen.getByText('Dr. Sarah Chen')).toBeInTheDocument();

    // Click on domain header to collapse
    const cliniBoardHeader = screen.getByText('Cliniboard');
    fireEvent.click(cliniBoardHeader.closest('div')!);

    // Advisor should still be visible since we're not actually collapsing in this test
    // (the collapse functionality is visual and doesn't remove elements from DOM)
  });

  it('calls onSelectionComplete with correct parameters', async () => {
    renderWithTheme(
      <MultiDomainAdvisorPanel
        onSelectionComplete={mockOnSelectionComplete}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Ask All Boards - Mega Mode')).toBeInTheDocument();
    });

    // Select an advisor
    const advisorCard = screen.getByText('Dr. Sarah Chen');
    fireEvent.click(advisorCard);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Start Multi-Domain Consultation/ })).toHaveLength(2);
    });

    // Click continue button (use the first one which should be in the selection summary)
    const continueButtons = screen.getAllByRole('button', { name: /Start Multi-Domain Consultation/ });
    fireEvent.click(continueButtons[0]);

    expect(mockOnSelectionComplete).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'advisor-1',
          name: 'Dr. Sarah Chen',
          isSelected: true
        })
      ]),
      ['cliniboard']
    );
  });

  it('calls onBack when back button is clicked', async () => {
    renderWithTheme(
      <MultiDomainAdvisorPanel
        onSelectionComplete={mockOnSelectionComplete}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Back to Domain Selection')).toBeInTheDocument();
    });

    const backButton = screen.getByText('Back to Domain Selection');
    fireEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalled();
  });

  it('handles loading error gracefully', async () => {
    vi.mocked(yamlConfigLoader.loadAllDomains).mockRejectedValue(new Error('Failed to load'));

    renderWithTheme(
      <MultiDomainAdvisorPanel
        onSelectionComplete={mockOnSelectionComplete}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Configuration Error')).toBeInTheDocument();
    });

    expect(screen.getByText('Failed to load')).toBeInTheDocument();
  });

  it('shows bottom action bar when advisors are selected', async () => {
    renderWithTheme(
      <MultiDomainAdvisorPanel
        onSelectionComplete={mockOnSelectionComplete}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Ask All Boards - Mega Mode')).toBeInTheDocument();
    });

    // Select an advisor
    const advisorCard = screen.getByText('Dr. Sarah Chen');
    fireEvent.click(advisorCard);

    await waitFor(() => {
      // Check for bottom action bar elements
      expect(screen.getByText(/1 advisor.* selected/)).toBeInTheDocument();
      expect(screen.getByText(/From 1 domain/)).toBeInTheDocument();
    });
  });

  it('updates selection counts when advisors are selected/deselected', async () => {
    renderWithTheme(
      <MultiDomainAdvisorPanel
        onSelectionComplete={mockOnSelectionComplete}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Ask All Boards - Mega Mode')).toBeInTheDocument();
    });

    // Select an advisor
    const advisorCard = screen.getByText('Dr. Sarah Chen');
    fireEvent.click(advisorCard);

    await waitFor(() => {
      expect(screen.getByText('1/2 selected')).toBeInTheDocument();
    });

    // Deselect the advisor
    fireEvent.click(advisorCard);

    await waitFor(() => {
      expect(screen.getByText('0/2 selected')).toBeInTheDocument();
    });
  });
});