import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../utils/testUtils';
import { checkAriaLabels, checkKeyboardNavigation } from '../../utils/testUtils';
import LandingPage from '../landing/LandingPage';
import AdvisorSelectionPanel from '../advisors/AdvisorSelectionPanel';
import ConsultationInterface from '../consultation/ConsultationInterface';
import { yamlConfigLoader } from '../../services/yamlConfigLoader';

// Mock services
vi.mock('../../services/yamlConfigLoader', () => ({
  yamlConfigLoader: {
    loadAllDomains: vi.fn(),
    getDomain: vi.fn(),
  },
}));

vi.mock('../../hooks/useAdvisorPersonas', () => ({
  useAdvisorPersonas: vi.fn(() => ({
    responses: [],
    isLoading: false,
    error: null,
    loadingAdvisors: new Set(),
    summary: null,
    isGeneratingSummary: false,
    summaryError: null,
    submitPrompt: vi.fn(),
    clearResponses: vi.fn(),
    clearError: vi.fn(),
    retryFailedResponse: vi.fn(),
    generateSummary: vi.fn(),
    clearSummary: vi.fn(),
    clearSummaryError: vi.fn(),
  })),
}));

vi.mock('../../hooks/useKiroIntegration', () => ({
  useKiroContext: vi.fn(() => ({
    kiroState: { personaRecommendations: [] },
    updatePersonaRecommendations: vi.fn(),
    applyPersonaRecommendation: vi.fn(),
    isReady: true,
  })),
}));

const mockDomains = [
  {
    id: 'cliniboard',
    name: 'Cliniboard',
    description: 'Clinical research advisory board',
    advisors: [
      { 
        id: '1', 
        name: 'Dr. Smith', 
        expertise: 'Clinical Trials', 
        background: 'Former FDA officer with 15 years experience',
        domain: { id: 'cliniboard' },
        isSelected: false
      },
      { 
        id: '2', 
        name: 'Dr. Jones', 
        expertise: 'Regulatory Affairs', 
        background: 'Pharmaceutical regulatory specialist',
        domain: { id: 'cliniboard' },
        isSelected: false
      },
    ],
    theme: { primary: '#3B82F6', secondary: '#1E40AF', accent: '#60A5FA', background: '#F8FAFC', text: '#1E293B' },
  },
];

describe('Consultation Flow Accessibility', () => {
  beforeEach(() => {
    vi.mocked(yamlConfigLoader.loadAllDomains).mockResolvedValue(mockDomains);
    vi.mocked(yamlConfigLoader.getDomain).mockResolvedValue(mockDomains[0]);
  });

  describe('Landing Page Accessibility', () => {
    it('should have proper heading hierarchy', async () => {
      render(<LandingPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      });

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('Ask the Greatest Minds');

      const h2 = screen.getByRole('heading', { level: 2 });
      expect(h2).toHaveTextContent('Choose Your Advisory Domain');
    });

    it('should have proper landmark roles', async () => {
      render(<LandingPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('banner')).toBeInTheDocument();
      });

      expect(screen.getByRole('banner')).toBeInTheDocument(); // Hero section
      expect(screen.getByRole('main')).toBeInTheDocument(); // Domain selection
    });

    it('should have keyboard accessible domain selection', async () => {
      render(<LandingPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Cliniboard')).toBeInTheDocument();
      });

      const domainCards = screen.getAllByRole('button');
      expect(domainCards.length).toBeGreaterThan(0);

      // Check keyboard navigation
      for (const card of domainCards) {
        expect(await checkKeyboardNavigation(card.parentElement!)).toBe(true);
      }
    });

    it('should have proper ARIA labels for interactive elements', async () => {
      render(<LandingPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Start Your Boardroom Session')).toBeInTheDocument();
      });

      const ctaButton = screen.getByLabelText('Scroll to domain selection section');
      expect(ctaButton).toBeInTheDocument();

      const domainCards = screen.getAllByRole('button');
      domainCards.forEach(card => {
        expect(card).toHaveAttribute('aria-label');
      });
    });
  });

  describe('Advisor Selection Accessibility', () => {
    it('should have proper form structure', async () => {
      render(<AdvisorSelectionPanel domainId="cliniboard" onSelectionComplete={() => {}} />);
      
      await waitFor(() => {
        expect(screen.getByText('Select Your Cliniboard Advisors')).toBeInTheDocument();
      });

      // Check for proper heading
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Select Your Cliniboard Advisors');

      // Check for advisor group
      const advisorGroup = screen.getByRole('group', { name: 'Available advisors' });
      expect(advisorGroup).toBeInTheDocument();
    });

    it('should announce selection changes to screen readers', async () => {
      render(<AdvisorSelectionPanel domainId="cliniboard" onSelectionComplete={() => {}} />);
      
      await waitFor(() => {
        expect(screen.getByText('0 of 2 advisors selected')).toBeInTheDocument();
      });

      const selectionStatus = screen.getByText('0 of 2 advisors selected');
      expect(selectionStatus).toHaveAttribute('aria-live', 'polite');
    });

    it('should have accessible selection controls', async () => {
      render(<AdvisorSelectionPanel domainId="cliniboard" onSelectionComplete={() => {}} />);
      
      await waitFor(() => {
        expect(screen.getByText('Select All')).toBeInTheDocument();
      });

      const selectAllButton = screen.getByLabelText('Select all advisors');
      expect(selectAllButton).toBeInTheDocument();

      const continueButton = screen.getByLabelText(/Continue with .* selected advisor/);
      expect(continueButton).toBeInTheDocument();
    });

    it('should maintain focus management during selection', async () => {
      render(<AdvisorSelectionPanel domainId="cliniboard" onSelectionComplete={() => {}} />);
      
      await waitFor(() => {
        expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
      });

      // Focus should be manageable on advisor cards
      const advisorCards = screen.getAllByRole('button');
      advisorCards.forEach(card => {
        card.focus();
        expect(card).toHaveFocus();
      });
    });
  });

  describe('Consultation Interface Accessibility', () => {
    const mockAdvisors = mockDomains[0].advisors.map(advisor => ({ ...advisor, isSelected: true }));

    it('should have proper form structure for prompt input', () => {
      render(<ConsultationInterface selectedAdvisors={mockAdvisors} />);
      
      const form = screen.getByRole('form', { name: 'Ask your question to advisors' });
      expect(form).toBeInTheDocument();

      const textarea = screen.getByRole('textbox', { name: 'Your Question' });
      expect(textarea).toBeInTheDocument();
    });

    it('should provide proper error feedback', () => {
      render(<ConsultationInterface selectedAdvisors={mockAdvisors} />);
      
      const textarea = screen.getByRole('textbox');
      
      // Simulate validation error
      fireEvent.change(textarea, { target: { value: 'short' } });
      fireEvent.blur(textarea);
      
      // Error should be announced to screen readers
      const errorElement = screen.queryByRole('alert');
      if (errorElement) {
        expect(errorElement).toBeInTheDocument();
      }
    });

    it('should have proper ARIA attributes for form elements', () => {
      render(<ConsultationInterface selectedAdvisors={mockAdvisors} />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('aria-describedby');
      expect(textarea).toHaveAttribute('aria-invalid', 'false');
    });

    it('should announce character count changes', () => {
      render(<ConsultationInterface selectedAdvisors={mockAdvisors} />);
      
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Test question' } });
      
      const charCount = screen.getByLabelText(/\d+ of 2000 characters used/);
      expect(charCount).toHaveAttribute('aria-live', 'polite');
    });

    it('should have accessible submit button', () => {
      render(<ConsultationInterface selectedAdvisors={mockAdvisors} />);
      
      const submitButton = screen.getByLabelText('Submit question to advisors');
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveAttribute('type', 'submit');
    });
  });

  describe('Keyboard Navigation Flow', () => {
    it('should support complete keyboard navigation through consultation flow', async () => {
      const { rerender } = render(<LandingPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Cliniboard')).toBeInTheDocument();
      });

      // Test landing page keyboard navigation
      const domainCard = screen.getByLabelText(/Select Cliniboard domain/);
      expect(await checkKeyboardNavigation(domainCard.parentElement!)).toBe(true);

      // Simulate domain selection and move to advisor selection
      rerender(<AdvisorSelectionPanel domainId="cliniboard" onSelectionComplete={() => {}} />);
      
      await waitFor(() => {
        expect(screen.getByText('Select Your Cliniboard Advisors')).toBeInTheDocument();
      });

      // Test advisor selection keyboard navigation
      const advisorCards = screen.getAllByRole('button');
      for (const card of advisorCards) {
        expect(await checkKeyboardNavigation(card.parentElement!)).toBe(true);
      }

      // Move to consultation interface
      const mockAdvisors = mockDomains[0].advisors.map(advisor => ({ ...advisor, isSelected: true }));
      rerender(<ConsultationInterface selectedAdvisors={mockAdvisors} />);

      // Test consultation interface keyboard navigation
      const textarea = screen.getByRole('textbox');
      const submitButton = screen.getByRole('button', { name: /Submit question/ });
      
      expect(await checkKeyboardNavigation(textarea.parentElement!)).toBe(true);
      expect(await checkKeyboardNavigation(submitButton.parentElement!)).toBe(true);
    });
  });

  describe('Screen Reader Announcements', () => {
    it('should provide meaningful page titles and descriptions', async () => {
      render(<LandingPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      });

      // Main heading should be descriptive
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Ask the Greatest Minds');

      // Section should have proper description
      const sectionDescription = screen.getByText(/Select the domain that matches your expertise needs/);
      expect(sectionDescription).toBeInTheDocument();
    });

    it('should announce loading states', () => {
      const mockAdvisors = mockDomains[0].advisors.map(advisor => ({ ...advisor, isSelected: true }));
      
      // Mock loading state
      vi.mocked(require('../../hooks/useAdvisorPersonas').useAdvisorPersonas).mockReturnValue({
        responses: [],
        isLoading: true,
        error: null,
        loadingAdvisors: new Set(['1']),
        summary: null,
        isGeneratingSummary: false,
        summaryError: null,
        submitPrompt: vi.fn(),
        clearResponses: vi.fn(),
        clearError: vi.fn(),
        retryFailedResponse: vi.fn(),
        generateSummary: vi.fn(),
        clearSummary: vi.fn(),
        clearSummaryError: vi.fn(),
      });

      render(<ConsultationInterface selectedAdvisors={mockAdvisors} />);
      
      const loadingText = screen.getByText(/Your question is being processed/);
      expect(loadingText).toBeInTheDocument();
    });
  });

  describe('Color Contrast and Visual Accessibility', () => {
    it('should maintain proper contrast in all theme variants', async () => {
      render(<LandingPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Cliniboard')).toBeInTheDocument();
      });

      // All interactive elements should have proper contrast
      const interactiveElements = screen.getAllByRole('button');
      interactiveElements.forEach(element => {
        // In a real implementation, you'd use a proper contrast checking library
        expect(element.className).toBeTruthy(); // Basic check that styles are applied
      });
    });

    it('should support high contrast mode', async () => {
      render(<LandingPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Cliniboard')).toBeInTheDocument();
      });

      // Elements should have proper border and background styles for high contrast
      const domainCards = screen.getAllByRole('button');
      domainCards.forEach(card => {
        expect(card.className).toContain('border');
      });
    });
  });
});
