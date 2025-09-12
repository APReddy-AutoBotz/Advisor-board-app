import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import MultiDomainConsultationInterface from '../MultiDomainConsultationInterface';
import ThemeProvider from '../../common/ThemeProvider';
import type { Advisor, Domain, DomainId } from '../../../types/domain';

// Mock the hooks
vi.mock('../../../hooks/useAdvisorPersonas', () => ({
  useAdvisorPersonas: vi.fn()
}));

vi.mock('../../../hooks/useSessionState', () => ({
  useSessionState: vi.fn()
}));

import { useAdvisorPersonas } from '../../../hooks/useAdvisorPersonas';
import { useSessionState } from '../../../hooks/useSessionState';

const mockDomain: Domain = {
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
  advisors: []
};

const mockAdvisors: Advisor[] = [
  {
    id: 'advisor-1',
    name: 'Dr. Sarah Chen',
    expertise: 'Clinical Research',
    background: 'Leading clinical researcher',
    domain: { ...mockDomain, id: 'cliniboard' },
    isSelected: true
  },
  {
    id: 'advisor-2',
    name: 'Prof. Emily Johnson',
    expertise: 'Curriculum Design',
    background: 'Education reform specialist',
    domain: { ...mockDomain, id: 'eduboard', name: 'EduBoard' },
    isSelected: true
  },
  {
    id: 'advisor-3',
    name: 'Dr. James Wilson',
    expertise: 'Herbal Medicine',
    background: 'Traditional medicine practitioner',
    domain: { ...mockDomain, id: 'remediboard', name: 'RemediBoard' },
    isSelected: true
  }
];

const mockDomains: DomainId[] = ['cliniboard', 'eduboard', 'remediboard'];

const mockResponses = [
  {
    advisorId: 'advisor-1',
    content: 'From a clinical perspective, this is important...',
    timestamp: new Date(),
    persona: {
      name: 'Dr. Sarah Chen',
      expertise: 'Clinical Research',
      background: 'Leading clinical researcher'
    }
  },
  {
    advisorId: 'advisor-2',
    content: 'From an educational standpoint, we should consider...',
    timestamp: new Date(),
    persona: {
      name: 'Prof. Emily Johnson',
      expertise: 'Curriculum Design',
      background: 'Education reform specialist'
    }
  }
];

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('MultiDomainConsultationInterface', () => {
  const mockOnBack = vi.fn();
  const mockOnSessionComplete = vi.fn();
  const mockSubmitPrompt = vi.fn();
  const mockCreateSession = vi.fn();
  const mockUpdateSession = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(useAdvisorPersonas).mockReturnValue({
      submitPrompt: mockSubmitPrompt,
      responses: [],
      isLoading: false,
      error: null
    });

    vi.mocked(useSessionState).mockReturnValue({
      createSession: mockCreateSession,
      updateSession: mockUpdateSession,
      sessions: [],
      currentSession: null,
      isLoading: false,
      error: null
    });

    mockCreateSession.mockResolvedValue({
      id: 'test-session',
      selectedAdvisors: mockAdvisors,
      prompt: '',
      responses: [],
      timestamp: new Date(),
      isMultiDomain: true,
      domains: mockDomains,
      responsesByDomain: {}
    });
  });

  it('renders multi-domain consultation interface', () => {
    renderWithTheme(
      <MultiDomainConsultationInterface
        selectedAdvisors={mockAdvisors}
        domains={mockDomains}
        onBack={mockOnBack}
        onSessionComplete={mockOnSessionComplete}
      />
    );

    expect(screen.getByText('Multi-Domain Advisory Session')).toBeInTheDocument();
    expect(screen.getByText('Consulting with 3 advisors across 3 domains')).toBeInTheDocument();
  });

  it('displays advisory board summary with all domains', () => {
    renderWithTheme(
      <MultiDomainConsultationInterface
        selectedAdvisors={mockAdvisors}
        domains={mockDomains}
        onBack={mockOnBack}
        onSessionComplete={mockOnSessionComplete}
      />
    );

    expect(screen.getByText('Your Multi-Domain Advisory Board')).toBeInTheDocument();
    expect(screen.getByText('Cliniboard')).toBeInTheDocument();
    expect(screen.getByText('EduBoard')).toBeInTheDocument();
    expect(screen.getByText('RemediBoard')).toBeInTheDocument();
  });

  it('shows advisor names and expertise in domain sections', () => {
    renderWithTheme(
      <MultiDomainConsultationInterface
        selectedAdvisors={mockAdvisors}
        domains={mockDomains}
        onBack={mockOnBack}
        onSessionComplete={mockOnSessionComplete}
      />
    );

    expect(screen.getByText('Dr. Sarah Chen - Clinical Research')).toBeInTheDocument();
    expect(screen.getByText('Prof. Emily Johnson - Curriculum Design')).toBeInTheDocument();
    expect(screen.getByText('Dr. James Wilson - Herbal Medicine')).toBeInTheDocument();
  });

  it('handles prompt submission', async () => {
    renderWithTheme(
      <MultiDomainConsultationInterface
        selectedAdvisors={mockAdvisors}
        domains={mockDomains}
        onBack={mockOnBack}
        onSessionComplete={mockOnSessionComplete}
      />
    );

    const promptInput = screen.getByPlaceholderText('Ask your question to all selected advisory boards...');
    const submitButton = screen.getByRole('button', { name: /Ask Advisors/i });

    fireEvent.change(promptInput, { target: { value: 'What are the best practices?' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSubmitPrompt).toHaveBeenCalledWith('What are the best practices?');
    });
  });

  it('displays loading state during consultation', () => {
    vi.mocked(useAdvisorPersonas).mockReturnValue({
      submitPrompt: mockSubmitPrompt,
      responses: [],
      isLoading: true,
      error: null
    });

    renderWithTheme(
      <MultiDomainConsultationInterface
        selectedAdvisors={mockAdvisors}
        domains={mockDomains}
        onBack={mockOnBack}
        onSessionComplete={mockOnSessionComplete}
      />
    );

    expect(screen.getByText('Consulting with 3 advisors across 3 domains...')).toBeInTheDocument();
  });

  it('displays error state when consultation fails', () => {
    vi.mocked(useAdvisorPersonas).mockReturnValue({
      submitPrompt: mockSubmitPrompt,
      responses: [],
      isLoading: false,
      error: 'Failed to get responses'
    });

    renderWithTheme(
      <MultiDomainConsultationInterface
        selectedAdvisors={mockAdvisors}
        domains={mockDomains}
        onBack={mockOnBack}
        onSessionComplete={mockOnSessionComplete}
      />
    );

    expect(screen.getByText('Failed to get responses')).toBeInTheDocument();
  });

  it('shows response controls when responses are available', () => {
    vi.mocked(useAdvisorPersonas).mockReturnValue({
      submitPrompt: mockSubmitPrompt,
      responses: mockResponses,
      isLoading: false,
      error: null
    });

    renderWithTheme(
      <MultiDomainConsultationInterface
        selectedAdvisors={mockAdvisors}
        domains={mockDomains}
        onBack={mockOnBack}
        onSessionComplete={mockOnSessionComplete}
      />
    );

    expect(screen.getByText('View by:')).toBeInTheDocument();
    expect(screen.getByText('Filter:')).toBeInTheDocument();
    expect(screen.getByText('Domains')).toBeInTheDocument();
    expect(screen.getByText('Advisors')).toBeInTheDocument();
  });

  it('allows switching between domain and advisor view modes', () => {
    vi.mocked(useAdvisorPersonas).mockReturnValue({
      submitPrompt: mockSubmitPrompt,
      responses: mockResponses,
      isLoading: false,
      error: null
    });

    renderWithTheme(
      <MultiDomainConsultationInterface
        selectedAdvisors={mockAdvisors}
        domains={mockDomains}
        onBack={mockOnBack}
        onSessionComplete={mockOnSessionComplete}
      />
    );

    const advisorsViewButton = screen.getByRole('button', { name: 'Advisors' });
    fireEvent.click(advisorsViewButton);

    // The view should switch to advisors mode
    expect(advisorsViewButton).toHaveClass('bg-white');
  });

  it('allows filtering by domain', () => {
    vi.mocked(useAdvisorPersonas).mockReturnValue({
      submitPrompt: mockSubmitPrompt,
      responses: mockResponses,
      isLoading: false,
      error: null
    });

    renderWithTheme(
      <MultiDomainConsultationInterface
        selectedAdvisors={mockAdvisors}
        domains={mockDomains}
        onBack={mockOnBack}
        onSessionComplete={mockOnSessionComplete}
      />
    );

    const cliniBoardFilter = screen.getByRole('button', { name: 'Cliniboard' });
    fireEvent.click(cliniBoardFilter);

    // The filter should be applied
    expect(cliniBoardFilter).toHaveClass('text-white');
  });

  it('calls onBack when back button is clicked', () => {
    renderWithTheme(
      <MultiDomainConsultationInterface
        selectedAdvisors={mockAdvisors}
        domains={mockDomains}
        onBack={mockOnBack}
        onSessionComplete={mockOnSessionComplete}
      />
    );

    const backButton = screen.getByText('Back to Advisor Selection');
    fireEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalled();
  });

  it('creates session on prompt submission', async () => {
    renderWithTheme(
      <MultiDomainConsultationInterface
        selectedAdvisors={mockAdvisors}
        domains={mockDomains}
        onBack={mockOnBack}
        onSessionComplete={mockOnSessionComplete}
      />
    );

    const promptInput = screen.getByPlaceholderText('Ask your question to all selected advisory boards...');
    const submitButton = screen.getByRole('button', { name: /Ask Advisors/i });

    fireEvent.change(promptInput, { target: { value: 'What are the best practices?' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreateSession).toHaveBeenCalledWith(
        expect.objectContaining({
          selectedAdvisors: mockAdvisors,
          prompt: 'What are the best practices?',
          isMultiDomain: true,
          domains: mockDomains
        })
      );
    });
  });

  it('updates session when responses are received', async () => {
    vi.mocked(useAdvisorPersonas).mockReturnValue({
      submitPrompt: mockSubmitPrompt,
      responses: mockResponses,
      isLoading: false,
      error: null
    });

    renderWithTheme(
      <MultiDomainConsultationInterface
        selectedAdvisors={mockAdvisors}
        domains={mockDomains}
        onBack={mockOnBack}
        onSessionComplete={mockOnSessionComplete}
      />
    );

    // Simulate prompt submission to create session
    const promptInput = screen.getByPlaceholderText('Ask your question to all selected advisory boards...');
    const submitButton = screen.getByRole('button', { name: /Ask Advisors/i });

    fireEvent.change(promptInput, { target: { value: 'Test question' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSessionComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          responses: mockResponses,
          isMultiDomain: true
        })
      );
    });
  });

  it('shows empty state when no responses are available', () => {
    renderWithTheme(
      <MultiDomainConsultationInterface
        selectedAdvisors={mockAdvisors}
        domains={mockDomains}
        onBack={mockOnBack}
        onSessionComplete={mockOnSessionComplete}
      />
    );

    expect(screen.getByText('Ready for Multi-Domain Consultation')).toBeInTheDocument();
    expect(screen.getByText(/Ask your question above to get insights from all 3 selected advisors/)).toBeInTheDocument();
  });
});
