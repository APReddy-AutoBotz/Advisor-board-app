import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import ResponsePanel from '../ResponsePanel';
import type { Advisor, AdvisorResponse, Domain } from '../../../types/domain';

// Mock the ResponseThread component
vi.mock('../ResponseThread', () => ({
  default: ({ advisor, response, onRetry, isRetrying }: any) => (
    <div data-testid={`response-thread-${advisor.id}`}>
      <div data-testid="advisor-name">{advisor.name}</div>
      <div data-testid="response-content">{response.content}</div>
      <div data-testid="response-timestamp">{response.timestamp.toISOString()}</div>
      {onRetry && (
        <button 
          data-testid="retry-button" 
          onClick={() => onRetry()}
          disabled={isRetrying}
        >
          {isRetrying ? 'Retrying...' : 'Retry'}
        </button>
      )}
    </div>
  ),
}));

// Mock the SummaryDisplay component
vi.mock('../SummaryDisplay', () => ({
  default: ({ summary, isVisible, onToggleVisibility, onClear }: any) => (
    isVisible ? (
      <div data-testid="summary-display">
        <div>Response Summary</div>
        <div>{summary}</div>
        <button onClick={onToggleVisibility}>Hide Summary</button>
        {onClear && <button onClick={onClear}>Clear</button>}
      </div>
    ) : null
  ),
}));

// Mock the Button component
vi.mock('../../common/Button', () => ({
  default: ({ children, onClick, disabled, variant, size, className }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled}
      data-variant={variant}
      data-size={size}
      className={className}
    >
      {children}
    </button>
  ),
}));

// Mock the Card component
vi.mock('../../common/Card', () => ({
  default: ({ children, variant, padding, className }: any) => (
    <div 
      data-variant={variant}
      data-padding={padding}
      className={className}
    >
      {children}
    </div>
  ),
}));

describe('ResponsePanel', () => {
  const mockDomain: Domain = {
    id: 'cliniboard',
    name: 'Cliniboard',
    description: 'Clinical trials expertise',
    theme: {
      primary: '#3B82F6',
      secondary: '#EFF6FF',
      accent: '#1D4ED8',
      background: '#F8FAFC',
      text: '#1E293B',
    },
    advisors: [],
  };

  const mockAdvisors: Advisor[] = [
    {
      id: 'advisor-1',
      name: 'Dr. Sarah Chen',
      expertise: 'Clinical Research',
      background: 'Leading clinical researcher with 15 years experience',
      domain: mockDomain,
      isSelected: true,
    },
    {
      id: 'advisor-2',
      name: 'Dr. Michael Rodriguez',
      expertise: 'Regulatory Affairs',
      background: 'Former FDA reviewer with expertise in drug approval',
      domain: mockDomain,
      isSelected: true,
    },
    {
      id: 'advisor-3',
      name: 'Dr. Emily Watson',
      expertise: 'Biostatistics',
      background: 'Statistical analysis expert for clinical trials',
      domain: mockDomain,
      isSelected: true,
    },
  ];

  const mockResponses: AdvisorResponse[] = [
    {
      advisorId: 'advisor-1',
      content: 'This is a response from Dr. Sarah Chen about clinical research methodology.',
      timestamp: new Date('2024-01-15T10:30:00Z'),
      persona: {
        name: 'Dr. Sarah Chen',
        expertise: 'Clinical Research',
        background: 'Leading clinical researcher',
        tone: 'professional',
      },
    },
    {
      advisorId: 'advisor-2',
      content: 'From a regulatory perspective, you should consider FDA guidelines.',
      timestamp: new Date('2024-01-15T10:31:00Z'),
      persona: {
        name: 'Dr. Michael Rodriguez',
        expertise: 'Regulatory Affairs',
        background: 'Former FDA reviewer',
        tone: 'authoritative',
      },
    },
  ];

  const defaultProps = {
    advisors: mockAdvisors,
    responses: mockResponses,
    prompt: 'What are the key considerations for clinical trial design?',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders the prompt when provided', () => {
      render(<ResponsePanel {...defaultProps} />);
      
      expect(screen.getByText('Your Question:')).toBeInTheDocument();
      expect(screen.getByText(defaultProps.prompt)).toBeInTheDocument();
    });

    it('renders advisor responses section header', () => {
      render(<ResponsePanel {...defaultProps} />);
      
      expect(screen.getByText('Advisor Responses')).toBeInTheDocument();
    });

    it('renders layout controls', () => {
      render(<ResponsePanel {...defaultProps} />);
      
      expect(screen.getByText('Layout:')).toBeInTheDocument();
      expect(screen.getByTitle('Column layout')).toBeInTheDocument();
      expect(screen.getByTitle('Tab layout')).toBeInTheDocument();
      expect(screen.getByTitle('List layout')).toBeInTheDocument();
    });

    it('renders response metadata', () => {
      render(<ResponsePanel {...defaultProps} />);
      
      expect(screen.getByText(/2 responses from 3 advisors/)).toBeInTheDocument();
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('renders empty state when no responses are provided', () => {
      render(
        <ResponsePanel
          advisors={mockAdvisors}
          responses={[]}
          prompt="Test question"
        />
      );
      
      expect(screen.getByText('No Responses Yet')).toBeInTheDocument();
      expect(screen.getByText('Submit a question to receive insights from your selected advisors.')).toBeInTheDocument();
    });

    it('renders empty state when responses do not match advisors', () => {
      const unmatchedResponses: AdvisorResponse[] = [
        {
          advisorId: 'unknown-advisor',
          content: 'This response has no matching advisor',
          timestamp: new Date(),
          persona: {
            name: 'Unknown',
            expertise: 'Unknown',
            background: 'Unknown',
          },
        },
      ];

      render(
        <ResponsePanel
          advisors={mockAdvisors}
          responses={unmatchedResponses}
          prompt="Test question"
        />
      );
      
      expect(screen.getByText('No Responses Yet')).toBeInTheDocument();
    });
  });

  describe('Layout Modes', () => {
    it('renders in columns layout by default', () => {
      render(<ResponsePanel {...defaultProps} />);
      
      // Check that ResponseThread components are rendered
      expect(screen.getByTestId('response-thread-advisor-1')).toBeInTheDocument();
      expect(screen.getByTestId('response-thread-advisor-2')).toBeInTheDocument();
    });

    it('renders in tabs layout when specified', () => {
      render(<ResponsePanel {...defaultProps} layout="tabs" />);
      
      // Check for tab navigation - use getAllByText to handle multiple instances
      const sarahTabs = screen.getAllByText('Dr. Sarah Chen');
      const michaelTabs = screen.getAllByText('Dr. Michael Rodriguez');
      expect(sarahTabs.length).toBeGreaterThan(0);
      expect(michaelTabs.length).toBeGreaterThan(0);
      
      // Only the first advisor's response should be visible initially
      expect(screen.getByTestId('response-thread-advisor-1')).toBeInTheDocument();
      expect(screen.queryByTestId('response-thread-advisor-2')).not.toBeInTheDocument();
    });

    it('switches tabs when tab is clicked', () => {
      render(<ResponsePanel {...defaultProps} layout="tabs" />);
      
      // Initially shows first advisor
      expect(screen.getByTestId('response-thread-advisor-1')).toBeInTheDocument();
      expect(screen.queryByTestId('response-thread-advisor-2')).not.toBeInTheDocument();
      
      // Click on second advisor tab
      fireEvent.click(screen.getByText('Dr. Michael Rodriguez'));
      
      // Now shows second advisor
      expect(screen.queryByTestId('response-thread-advisor-1')).not.toBeInTheDocument();
      expect(screen.getByTestId('response-thread-advisor-2')).toBeInTheDocument();
    });

    it('renders in list layout when specified', () => {
      render(<ResponsePanel {...defaultProps} layout="list" />);
      
      // Both responses should be visible in list layout
      expect(screen.getByTestId('response-thread-advisor-1')).toBeInTheDocument();
      expect(screen.getByTestId('response-thread-advisor-2')).toBeInTheDocument();
    });
  });

  describe('Summary Functionality', () => {
    it('renders summarize button when multiple responses exist and callback is provided', () => {
      const mockGenerateSummary = vi.fn();
      
      render(
        <ResponsePanel 
          {...defaultProps} 
          onGenerateSummary={mockGenerateSummary}
        />
      );
      
      expect(screen.getByText('Summarize')).toBeInTheDocument();
    });

    it('does not render summarize button with single response', () => {
      const mockGenerateSummary = vi.fn();
      
      render(
        <ResponsePanel 
          advisors={[mockAdvisors[0]]}
          responses={[mockResponses[0]]}
          onGenerateSummary={mockGenerateSummary}
        />
      );
      
      expect(screen.queryByText('Summarize')).not.toBeInTheDocument();
    });

    it('calls onGenerateSummary when summarize button is clicked', () => {
      const mockGenerateSummary = vi.fn();
      
      render(
        <ResponsePanel 
          {...defaultProps} 
          onGenerateSummary={mockGenerateSummary}
        />
      );
      
      fireEvent.click(screen.getByText('Summarize'));
      expect(mockGenerateSummary).toHaveBeenCalledTimes(1);
    });

    it('shows loading state when generating summary', () => {
      const mockGenerateSummary = vi.fn();
      
      render(
        <ResponsePanel 
          {...defaultProps} 
          onGenerateSummary={mockGenerateSummary}
          isGeneratingSummary={true}
        />
      );
      
      expect(screen.getByText('Generating...')).toBeInTheDocument();
    });

    it('displays summary when provided', () => {
      const summary = 'This is a summary of all advisor responses.';
      
      render(
        <ResponsePanel 
          {...defaultProps} 
          summary={summary}
        />
      );
      
      expect(screen.getByText('Show Summary')).toBeInTheDocument();
      
      // Click to show summary
      fireEvent.click(screen.getByText('Show Summary'));
      
      expect(screen.getByText('Response Summary')).toBeInTheDocument();
      expect(screen.getByText(summary)).toBeInTheDocument();
      expect(screen.getByText('Hide Summary')).toBeInTheDocument();
    });

    it('toggles summary visibility', () => {
      const summary = 'This is a summary of all advisor responses.';
      
      render(
        <ResponsePanel 
          {...defaultProps} 
          summary={summary}
        />
      );
      
      // Initially hidden
      expect(screen.queryByText('Response Summary')).not.toBeInTheDocument();
      
      // Show summary
      fireEvent.click(screen.getByText('Show Summary'));
      expect(screen.getByText('Response Summary')).toBeInTheDocument();
      
      // Hide summary
      fireEvent.click(screen.getByText('Hide Summary'));
      expect(screen.queryByText('Response Summary')).not.toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('shows loading indicators for advisors being retried', () => {
      const loadingAdvisors = new Set(['advisor-1']);
      
      render(
        <ResponsePanel 
          {...defaultProps} 
          loadingAdvisors={loadingAdvisors}
          layout="tabs"
        />
      );
      
      // Check for loading indicator in tab - find the button containing the advisor name
      const tabButtons = screen.getAllByRole('button').filter(button => 
        button.textContent?.includes('Dr. Sarah Chen')
      );
      expect(tabButtons.length).toBeGreaterThan(0);
      expect(tabButtons[0]).toHaveTextContent('●');
    });
  });

  describe('Retry Functionality', () => {
    it('passes retry callback to ResponseThread components', () => {
      const mockRetryResponse = vi.fn();
      
      render(
        <ResponsePanel 
          {...defaultProps} 
          onRetryResponse={mockRetryResponse}
        />
      );
      
      // Click retry button on first response
      const retryButtons = screen.getAllByTestId('retry-button');
      fireEvent.click(retryButtons[0]);
      
      expect(mockRetryResponse).toHaveBeenCalledWith('advisor-1');
    });

    it('shows retry loading state for specific advisors', () => {
      const mockRetryResponse = vi.fn();
      const loadingAdvisors = new Set(['advisor-1']);
      
      render(
        <ResponsePanel 
          {...defaultProps} 
          onRetryResponse={mockRetryResponse}
          loadingAdvisors={loadingAdvisors}
        />
      );
      
      const retryButtons = screen.getAllByTestId('retry-button');
      expect(retryButtons[0]).toHaveTextContent('Retrying...');
      expect(retryButtons[1]).toHaveTextContent('Retry');
    });
  });

  describe('Domain Theming', () => {
    it('applies clinical domain styling', () => {
      render(<ResponsePanel {...defaultProps} />);
      
      // Check for clinical theme classes in prompt display - look for the Card component with the classes
      const promptCards = screen.getAllByText('Your Question:');
      const promptCard = promptCards[0].closest('[data-variant="filled"]');
      expect(promptCard).toHaveClass('border-clinical-200', 'bg-clinical-50');
    });

    it('applies education domain styling', () => {
      const eduDomain: Domain = { ...mockDomain, id: 'eduboard' };
      const eduAdvisors = mockAdvisors.map(advisor => ({ ...advisor, domain: eduDomain }));
      
      render(
        <ResponsePanel 
          advisors={eduAdvisors}
          responses={mockResponses}
          prompt="Test question"
        />
      );
      
      const promptCards = screen.getAllByText('Your Question:');
      const promptCard = promptCards[0].closest('[data-variant="filled"]');
      expect(promptCard).toHaveClass('border-education-200', 'bg-education-50');
    });

    it('applies remedies domain styling', () => {
      const remediDomain: Domain = { ...mockDomain, id: 'remediboard' };
      const remediAdvisors = mockAdvisors.map(advisor => ({ ...advisor, domain: remediDomain }));
      
      render(
        <ResponsePanel 
          advisors={remediAdvisors}
          responses={mockResponses}
          prompt="Test question"
        />
      );
      
      const promptCards = screen.getAllByText('Your Question:');
      const promptCard = promptCards[0].closest('[data-variant="filled"]');
      expect(promptCard).toHaveClass('border-remedies-200', 'bg-remedies-50');
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels for layout controls', () => {
      render(<ResponsePanel {...defaultProps} />);
      
      expect(screen.getByTitle('Column layout')).toBeInTheDocument();
      expect(screen.getByTitle('Tab layout')).toBeInTheDocument();
      expect(screen.getByTitle('List layout')).toBeInTheDocument();
    });

    it('maintains proper tab navigation in tabs layout', () => {
      render(<ResponsePanel {...defaultProps} layout="tabs" />);
      
      const tabs = screen.getAllByRole('button').filter(button => 
        button.textContent?.includes('Dr.')
      );
      
      expect(tabs).toHaveLength(2);
      tabs.forEach(tab => {
        expect(tab).toHaveAttribute('class');
      });
    });
  });

  describe('Response Filtering', () => {
    it('only displays responses from selected advisors', () => {
      const mixedResponses: AdvisorResponse[] = [
        ...mockResponses,
        {
          advisorId: 'unknown-advisor',
          content: 'This should not be displayed',
          timestamp: new Date(),
          persona: {
            name: 'Unknown Advisor',
            expertise: 'Unknown',
            background: 'Unknown',
          },
        },
      ];
      
      render(
        <ResponsePanel 
          advisors={mockAdvisors}
          responses={mixedResponses}
          prompt="Test question"
        />
      );
      
      // Should only show responses from known advisors
      expect(screen.getByTestId('response-thread-advisor-1')).toBeInTheDocument();
      expect(screen.getByTestId('response-thread-advisor-2')).toBeInTheDocument();
      expect(screen.queryByText('This should not be displayed')).not.toBeInTheDocument();
    });
  });

  describe('Timestamp Formatting', () => {
    it('displays correct last updated timestamp', () => {
      const olderResponse: AdvisorResponse = {
        ...mockResponses[0],
        timestamp: new Date('2024-01-15T09:00:00Z'),
      };
      
      const newerResponse: AdvisorResponse = {
        ...mockResponses[1],
        timestamp: new Date('2024-01-15T11:00:00Z'),
      };
      
      render(
        <ResponsePanel 
          advisors={mockAdvisors}
          responses={[olderResponse, newerResponse]}
          prompt="Test question"
        />
      );
      
      // Should show the newer timestamp - use exact same formatting as component
      const expectedTime = new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(new Date('2024-01-15T11:00:00Z'));
      
      expect(screen.getByText(`Last updated: ${expectedTime}`)).toBeInTheDocument();
    });
  });
});