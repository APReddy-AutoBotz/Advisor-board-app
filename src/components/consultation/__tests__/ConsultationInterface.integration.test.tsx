import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ConsultationInterface from '../ConsultationInterface';
import type { Advisor, AdvisorResponse } from '../../../types/domain';
import ThemeProvider from '../../common/ThemeProvider';

// Mock the useAdvisorPersonas hook
const mockUseAdvisorPersonas = vi.fn();

// Test wrapper with ThemeProvider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

const renderWithTheme = (component: React.ReactElement) => {
  return render(component, { wrapper: TestWrapper });
};

// Mock the useAdvisorPersonas hook
vi.mock('../../../hooks/useAdvisorPersonas', () => ({
  useAdvisorPersonas: () => mockUseAdvisorPersonas(),
}));

// Mock the ResponsePanel component
vi.mock('../ResponsePanel', () => ({
  default: ({ advisors, responses, prompt, onRetryResponse, loadingAdvisors }: { 
    advisors: Advisor[]; 
    responses: AdvisorResponse[];
    prompt?: string;
    onRetryResponse?: (advisorId: string) => void;
    loadingAdvisors?: Set<string>;
  }) => (
    <div data-testid="response-panel">
      {prompt && (
        <div>
          <h2>Advisor Responses</h2>
          <div>Your Question: {prompt}</div>
        </div>
      )}
      {responses.map((response) => {
        const advisor = advisors.find(a => a.id === response.advisorId);
        return advisor ? (
          <div key={response.advisorId} data-testid={`response-${advisor.id}`}>
            <div>{advisor.name}</div>
            <div>{response.content}</div>
            {onRetryResponse && (
              <button 
                onClick={() => onRetryResponse(response.advisorId)} 
                disabled={loadingAdvisors?.has(response.advisorId)}
              >
                {loadingAdvisors?.has(response.advisorId) ? 'Retrying...' : 'Retry'}
              </button>
            )}
          </div>
        ) : null;
      })}
      <div>
        <button>Ask Another Question</button>
        <button>Export Session</button>
      </div>
    </div>
  ),
}));

describe('ConsultationInterface Integration Tests', () => {
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

  const mockResponses: AdvisorResponse[] = [
    {
      advisorId: 'advisor-1',
      content: 'From a clinical research perspective, this requires careful protocol design...',
      timestamp: new Date(),
      persona: {
        name: 'Dr. Jane Smith',
        expertise: 'Clinical Research',
        background: 'Expert in clinical trials',
        tone: 'professional, evidence-based',
      },
    },
    {
      advisorId: 'advisor-2',
      content: 'Regulatory compliance is essential for this type of study...',
      timestamp: new Date(),
      persona: {
        name: 'Prof. John Doe',
        expertise: 'Regulatory Affairs',
        background: 'FDA compliance expert',
        tone: 'regulatory-focused',
      },
    },
  ];

  const mockSubmitPrompt = vi.fn();
  const mockClearResponses = vi.fn();
  const mockClearError = vi.fn();
  const mockRetryFailedResponse = vi.fn();
  const mockGenerateSummary = vi.fn();
  const mockClearSummary = vi.fn();
  const mockClearSummaryError = vi.fn();
  const mockOnBack = vi.fn();
  const mockOnSessionComplete = vi.fn();

  // Helper function to create complete mock return value
  const createMockReturnValue = (overrides: any = {}) => ({
    responses: [],
    isLoading: false,
    error: null,
    loadingAdvisors: new Set(),
    summary: null,
    isGeneratingSummary: false,
    summaryError: null,
    submitPrompt: mockSubmitPrompt,
    clearResponses: mockClearResponses,
    clearError: mockClearError,
    retryFailedResponse: mockRetryFailedResponse,
    generateSummary: mockGenerateSummary,
    clearSummary: mockClearSummary,
    clearSummaryError: mockClearSummaryError,
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays responses when available', async () => {
    // Mock hook with responses
    mockUseAdvisorPersonas.mockReturnValue(createMockReturnValue({
      responses: mockResponses,
    }));

    renderWithTheme(
      <ConsultationInterface
        selectedAdvisors={mockAdvisors}
        onBack={mockOnBack}
        onSessionComplete={mockOnSessionComplete}
      />
    );

    // First submit a prompt to trigger the session creation
    const textarea = screen.getByRole('textbox');
    const submitButton = screen.getByRole('button', { name: /ask advisors/i });
    
    fireEvent.change(textarea, { target: { value: 'Test question' } });
    fireEvent.click(submitButton);

    // Wait for the responses to be displayed
    await waitFor(() => {
      expect(screen.getByText('Advisor Responses')).toBeInTheDocument();
    });

    expect(screen.getByTestId('response-advisor-1')).toBeInTheDocument();
    expect(screen.getByTestId('response-advisor-2')).toBeInTheDocument();
    expect(screen.getByText('Dr. Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Prof. John Doe')).toBeInTheDocument();
  });

  it('shows loading state when isLoading is true', () => {
    // Mock hook with loading state
    mockUseAdvisorPersonas.mockReturnValue(createMockReturnValue({
      isLoading: true,
      loadingAdvisors: new Set(['advisor-1']),
    }));

    renderWithTheme(
      <ConsultationInterface
        selectedAdvisors={mockAdvisors}
        onBack={mockOnBack}
        onSessionComplete={mockOnSessionComplete}
      />
    );

    expect(screen.getByText('Consulting with Advisors')).toBeInTheDocument();
    expect(screen.getByText('Your question is being processed by 2 advisors...')).toBeInTheDocument();
  });

  it('shows error state when error is present', () => {
    const errorMessage = 'Failed to generate responses';
    
    // Mock hook with error state
    mockUseAdvisorPersonas.mockReturnValue(createMockReturnValue({
      error: errorMessage,
    }));

    renderWithTheme(
      <ConsultationInterface
        selectedAdvisors={mockAdvisors}
        onBack={mockOnBack}
        onSessionComplete={mockOnSessionComplete}
      />
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
  });

  it('calls clearError when dismiss button is clicked', () => {
    const errorMessage = 'Test error';
    
    // Mock hook with error state
    mockUseAdvisorPersonas.mockReturnValue(createMockReturnValue({
      error: errorMessage,
    }));

    renderWithTheme(
      <ConsultationInterface
        selectedAdvisors={mockAdvisors}
        onBack={mockOnBack}
        onSessionComplete={mockOnSessionComplete}
      />
    );

    const dismissButton = screen.getByRole('button', { name: /dismiss/i });
    fireEvent.click(dismissButton);

    expect(mockClearError).toHaveBeenCalledTimes(1);
  });

  it('shows retry loading state for specific advisors', () => {
    // Mock hook with specific advisor loading
    mockUseAdvisorPersonas.mockReturnValue(createMockReturnValue({
      responses: mockResponses,
      loadingAdvisors: new Set(['advisor-1']),
    }));

    renderWithTheme(
      <ConsultationInterface
        selectedAdvisors={mockAdvisors}
        onBack={mockOnBack}
        onSessionComplete={mockOnSessionComplete}
      />
    );

    expect(screen.getByText('Retrying responses from 1 advisor...')).toBeInTheDocument();
    
    // Check that Dr. Jane Smith is highlighted as loading
    const loadingIndicator = screen.getByText('Dr. Jane Smith');
    expect(loadingIndicator.closest('.bg-blue-100')).toBeInTheDocument();
  });

  it('calls clearResponses when "Ask Another Question" is clicked', () => {
    // Mock hook with responses
    mockUseAdvisorPersonas.mockReturnValue(createMockReturnValue({
      responses: mockResponses,
    }));

    renderWithTheme(
      <ConsultationInterface
        selectedAdvisors={mockAdvisors}
        onBack={mockOnBack}
        onSessionComplete={mockOnSessionComplete}
      />
    );

    const anotherQuestionButton = screen.getByRole('button', { name: /ask another question/i });
    fireEvent.click(anotherQuestionButton);

    expect(mockClearResponses).toHaveBeenCalledTimes(1);
  });

  it('passes retry functionality to ResponseThread components', async () => {
    // Mock hook with responses
    mockUseAdvisorPersonas.mockReturnValue(createMockReturnValue({
      responses: mockResponses,
      loadingAdvisors: new Set(['advisor-1']),
    }));

    renderWithTheme(
      <ConsultationInterface
        selectedAdvisors={mockAdvisors}
        onBack={mockOnBack}
        onSessionComplete={mockOnSessionComplete}
      />
    );

    // First submit a prompt to trigger the session creation
    const textarea = screen.getByRole('textbox');
    const submitButton = screen.getByRole('button', { name: /ask advisors/i });
    
    fireEvent.change(textarea, { target: { value: 'Test question' } });
    fireEvent.click(submitButton);

    // Wait for the responses to be displayed
    await waitFor(() => {
      expect(screen.getByText('Advisor Responses')).toBeInTheDocument();
    });

    // Find retry buttons in the mocked ResponsePanel components
    const retryButtons = screen.getAllByText(/retry/i);
    expect(retryButtons.length).toBeGreaterThan(0);

    // Click the first retry button (should be for advisor-1)
    fireEvent.click(retryButtons[0]);

    // The retry should be called through the handleRetryResponse function
    await waitFor(() => {
      expect(mockRetryFailedResponse).toHaveBeenCalledWith('advisor-1');
    });
  });

  it('includes session context when submitting follow-up prompts', async () => {
    // Mock hook with existing responses
    mockUseAdvisorPersonas.mockReturnValue(createMockReturnValue({
      responses: mockResponses,
    }));

    renderWithTheme(
      <ConsultationInterface
        selectedAdvisors={mockAdvisors}
        onBack={mockOnBack}
        onSessionComplete={mockOnSessionComplete}
      />
    );

    const textarea = screen.getByRole('textbox');
    const submitButton = screen.getByRole('button', { name: /ask advisors/i });
    const followUpPrompt = 'Can you elaborate on that?';

    fireEvent.change(textarea, { target: { value: followUpPrompt } });
    fireEvent.click(submitButton);

    expect(mockSubmitPrompt).toHaveBeenCalledWith(
      followUpPrompt,
      expect.stringContaining('Previous discussion context:')
    );
  });
});