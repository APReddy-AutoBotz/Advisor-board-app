import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import { ThemeProvider } from '../../components/common/ThemeProvider';

// Mock the YAML config loader
vi.mock('../../services/yamlConfigLoader', () => ({
  loadDomainConfig: vi.fn().mockResolvedValue({
    name: 'Cliniboard',
    description: 'Clinical trials expertise',
    advisors: [
      {
        id: 'advisor-1',
        name: 'Dr. Sarah Chen',
        expertise: 'Clinical Research',
        background: 'Leading clinical researcher',
        domain: 'cliniboard'
      },
      {
        id: 'advisor-2', 
        name: 'Dr. Michael Rodriguez',
        expertise: 'Regulatory Affairs',
        background: 'FDA regulatory expert',
        domain: 'cliniboard'
      }
    ]
  }),
  loadAllDomainConfigs: vi.fn().mockResolvedValue([
    {
      id: 'cliniboard',
      name: 'Cliniboard',
      description: 'Clinical trials expertise',
      advisors: []
    },
    {
      id: 'eduboard',
      name: 'EduBoard', 
      description: 'Education expertise',
      advisors: []
    },
    {
      id: 'remediboard',
      name: 'RemediBoard',
      description: 'Natural remedies expertise', 
      advisors: []
    }
  ])
}));

// Mock the advisor service
vi.mock('../../services/advisorService', () => ({
  generateAdvisorResponse: vi.fn().mockResolvedValue({
    advisorId: 'advisor-1',
    content: 'This is a mock response from the advisor.',
    timestamp: new Date(),
    persona: { name: 'Dr. Sarah Chen', expertise: 'Clinical Research' }
  })
}));

const renderWithTheme = (component: React.ReactNode) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('Complete User Workflow E2E Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should complete full workflow from landing to consultation', async () => {
    const user = userEvent.setup();
    
    renderWithTheme(<App />);

    // 1. Landing page should be visible
    expect(screen.getByText('AdvisorBoard – Ask the Greatest Minds')).toBeInTheDocument();
    expect(screen.getByText('Cliniboard')).toBeInTheDocument();
    expect(screen.getByText('EduBoard')).toBeInTheDocument();
    expect(screen.getByText('RemediBoard')).toBeInTheDocument();

    // 2. Select a domain (Cliniboard)
    const cliniboardCard = screen.getByTestId('domain-card-cliniboard');
    await user.click(cliniboardCard);

    // 3. Should navigate to advisor selection
    await waitFor(() => {
      expect(screen.getByText('Select Your Advisors')).toBeInTheDocument();
    });

    // 4. Select advisors
    const advisor1 = await screen.findByTestId('advisor-card-advisor-1');
    const advisor2 = await screen.findByTestId('advisor-card-advisor-2');
    
    await user.click(advisor1);
    await user.click(advisor2);

    // 5. Proceed to consultation
    const proceedButton = screen.getByText('Start Consultation');
    await user.click(proceedButton);

    // 6. Should show consultation interface
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter your question for the advisory board...')).toBeInTheDocument();
    });

    // 7. Submit a prompt
    const promptInput = screen.getByPlaceholderText('Enter your question for the advisory board...');
    await user.type(promptInput, 'What are the key considerations for Phase II clinical trials?');
    
    const submitButton = screen.getByText('Submit Question');
    await user.click(submitButton);

    // 8. Should show loading state and then responses
    expect(screen.getByText('Generating responses...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('This is a mock response from the advisor.')).toBeInTheDocument();
    });

    // 9. Should be able to generate summary
    const summaryButton = screen.getByText('Generate Summary');
    await user.click(summaryButton);

    await waitFor(() => {
      expect(screen.getByText('Response Summary')).toBeInTheDocument();
    });
  });

  it('should complete export workflow', async () => {
    const user = userEvent.setup();
    
    renderWithTheme(<App />);

    // Navigate through to consultation with responses
    const cliniboardCard = screen.getByTestId('domain-card-cliniboard');
    await user.click(cliniboardCard);

    await waitFor(() => {
      expect(screen.getByText('Select Your Advisors')).toBeInTheDocument();
    });

    const advisor1 = await screen.findByTestId('advisor-card-advisor-1');
    await user.click(advisor1);

    const proceedButton = screen.getByText('Start Consultation');
    await user.click(proceedButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter your question for the advisory board...')).toBeInTheDocument();
    });

    const promptInput = screen.getByPlaceholderText('Enter your question for the advisory board...');
    await user.type(promptInput, 'Test question');
    
    const submitButton = screen.getByText('Submit Question');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('This is a mock response from the advisor.')).toBeInTheDocument();
    });

    // Test export functionality
    const exportButton = screen.getByText('Export Session');
    await user.click(exportButton);

    // Should show export options
    expect(screen.getByText('Export as PDF')).toBeInTheDocument();
    expect(screen.getByText('Export as Markdown')).toBeInTheDocument();

    // Test PDF export
    const pdfExportButton = screen.getByText('Export as PDF');
    await user.click(pdfExportButton);

    // Should show success message
    await waitFor(() => {
      expect(screen.getByText('Session exported successfully!')).toBeInTheDocument();
    });
  });

  it('should handle multi-domain consultation workflow', async () => {
    const user = userEvent.setup();
    
    renderWithTheme(<App />);

    // Navigate to multi-domain mode
    const megaModeButton = screen.getByText('Ask All Boards');
    await user.click(megaModeButton);

    await waitFor(() => {
      expect(screen.getByText('Multi-Domain Consultation')).toBeInTheDocument();
    });

    // Should show all domains
    expect(screen.getByText('Cliniboard Advisors')).toBeInTheDocument();
    expect(screen.getByText('EduBoard Advisors')).toBeInTheDocument();
    expect(screen.getByText('RemediBoard Advisors')).toBeInTheDocument();

    // Select advisors from multiple domains
    const cliniAdvisor = await screen.findByTestId('advisor-card-advisor-1');
    await user.click(cliniAdvisor);

    const proceedButton = screen.getByText('Start Multi-Domain Consultation');
    await user.click(proceedButton);

    // Should show multi-domain consultation interface
    await waitFor(() => {
      expect(screen.getByText('Multi-Domain Advisory Session')).toBeInTheDocument();
    });

    // Submit prompt and verify domain-organized responses
    const promptInput = screen.getByPlaceholderText('Enter your question for all advisory boards...');
    await user.type(promptInput, 'How can we improve healthcare outcomes?');
    
    const submitButton = screen.getByText('Submit to All Boards');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Cliniboard Responses')).toBeInTheDocument();
    });
  });

  it('should maintain session state across navigation', async () => {
    const user = userEvent.setup();
    
    renderWithTheme(<App />);

    // Start a session
    const cliniboardCard = screen.getByTestId('domain-card-cliniboard');
    await user.click(cliniboardCard);

    await waitFor(() => {
      expect(screen.getByText('Select Your Advisors')).toBeInTheDocument();
    });

    const advisor1 = await screen.findByTestId('advisor-card-advisor-1');
    await user.click(advisor1);

    // Navigate back to landing
    const backButton = screen.getByText('Back to Domains');
    await user.click(backButton);

    // Navigate back to same domain
    await user.click(cliniboardCard);

    // Should maintain advisor selection
    await waitFor(() => {
      const selectedAdvisor = screen.getByTestId('advisor-card-advisor-1');
      expect(selectedAdvisor).toHaveClass('selected');
    });
  });
});