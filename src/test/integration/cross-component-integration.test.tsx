import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '../../components/common/ThemeProvider';
import { LandingPage } from '../../components/landing/LandingPage';
import { AdvisorSelectionPanel } from '../../components/advisors/AdvisorSelectionPanel';
import { ConsultationInterface } from '../../components/consultation/ConsultationInterface';
import { SessionManager } from '../../components/session/SessionManager';

// Mock services
vi.mock('../../services/yamlConfigLoader');
vi.mock('../../services/advisorService');
vi.mock('../../services/exportService');

const mockDomains = [
  {
    id: 'cliniboard' as const,
    name: 'Cliniboard',
    description: 'Clinical trials expertise',
    theme: { primary: 'blue', secondary: 'blue-light' },
    advisors: [
      {
        id: 'advisor-1',
        name: 'Dr. Sarah Chen',
        expertise: 'Clinical Research',
        background: 'Leading clinical researcher',
        domain: 'cliniboard' as const,
        isSelected: false
      }
    ]
  }
];

const renderWithTheme = (component: React.ReactNode) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('Cross-Component Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Theme Integration Across Components', () => {
    it('should apply consistent theming across all components', async () => {
      const { rerender } = renderWithTheme(
        <LandingPage domains={mockDomains} onDomainSelect={() => {}} />
      );

      // Check theme application on landing page
      const cliniboardCard = screen.getByTestId('domain-card-cliniboard');
      expect(cliniboardCard).toHaveClass('theme-cliniboard');

      // Switch to advisor selection with same theme
      rerender(
        <ThemeProvider>
          <AdvisorSelectionPanel 
            domain={mockDomains[0]} 
            onAdvisorSelect={() => {}}
            onProceed={() => {}}
            selectedAdvisors={[]}
          />
        </ThemeProvider>
      );

      const advisorCard = screen.getByTestId('advisor-card-advisor-1');
      expect(advisorCard).toHaveClass('theme-cliniboard');

      // Switch to consultation interface
      rerender(
        <ThemeProvider>
          <ConsultationInterface 
            selectedAdvisors={mockDomains[0].advisors}
            domain={mockDomains[0]}
          />
        </ThemeProvider>
      );

      const consultationContainer = screen.getByTestId('consultation-interface');
      expect(consultationContainer).toHaveClass('theme-cliniboard');
    });

    it('should handle dark mode toggle across components', async () => {
      const user = userEvent.setup();
      
      renderWithTheme(
        <div>
          <LandingPage domains={mockDomains} onDomainSelect={() => {}} />
        </div>
      );

      // Toggle dark mode
      const darkModeToggle = screen.getByTestId('dark-mode-toggle');
      await user.click(darkModeToggle);

      // Check that dark mode is applied
      expect(document.documentElement).toHaveClass('dark');
    });
  });

  describe('State Management Integration', () => {
    it('should maintain state consistency across component transitions', async () => {
      const user = userEvent.setup();
      let selectedDomain: any = null;
      let selectedAdvisors: any[] = [];

      const { rerender } = renderWithTheme(
        <LandingPage 
          domains={mockDomains} 
          onDomainSelect={(domain) => { selectedDomain = domain; }} 
        />
      );

      // Select domain
      const cliniboardCard = screen.getByTestId('domain-card-cliniboard');
      await user.click(cliniboardCard);

      expect(selectedDomain).toEqual(mockDomains[0]);

      // Move to advisor selection
      rerender(
        <ThemeProvider>
          <AdvisorSelectionPanel 
            domain={selectedDomain}
            onAdvisorSelect={(advisors) => { selectedAdvisors = advisors; }}
            onProceed={() => {}}
            selectedAdvisors={selectedAdvisors}
          />
        </ThemeProvider>
      );

      // Select advisor
      const advisorCard = screen.getByTestId('advisor-card-advisor-1');
      await user.click(advisorCard);

      expect(selectedAdvisors).toHaveLength(1);
      expect(selectedAdvisors[0].id).toBe('advisor-1');

      // Move to consultation
      rerender(
        <ThemeProvider>
          <ConsultationInterface 
            selectedAdvisors={selectedAdvisors}
            domain={selectedDomain}
          />
        </ThemeProvider>
      );

      // Verify advisor information is displayed
      expect(screen.getByText('Dr. Sarah Chen')).toBeInTheDocument();
      expect(screen.getByText('Clinical Research')).toBeInTheDocument();
    });
  });

  describe('Data Flow Integration', () => {
    it('should handle data flow from YAML config to UI components', async () => {
      const mockYamlConfigLoader = await import('../../services/yamlConfigLoader');
      (mockYamlConfigLoader.loadDomainConfig as any).mockResolvedValue({
        name: 'Cliniboard',
        description: 'Clinical trials expertise',
        advisors: [
          {
            id: 'yaml-advisor-1',
            name: 'Dr. YAML Test',
            expertise: 'YAML Testing',
            background: 'Loaded from YAML'
          }
        ]
      });

      renderWithTheme(
        <AdvisorSelectionPanel 
          domain={mockDomains[0]}
          onAdvisorSelect={() => {}}
          onProceed={() => {}}
          selectedAdvisors={[]}
        />
      );

      // Should display YAML-loaded advisor data
      await waitFor(() => {
        expect(screen.getByText('Dr. YAML Test')).toBeInTheDocument();
        expect(screen.getByText('YAML Testing')).toBeInTheDocument();
      });
    });

    it('should handle AI response data flow through components', async () => {
      const mockAdvisorService = await import('../../services/advisorService');
      (mockAdvisorService.generateAdvisorResponse as any).mockResolvedValue({
        advisorId: 'advisor-1',
        content: 'Integration test response',
        timestamp: new Date(),
        persona: { name: 'Dr. Sarah Chen', expertise: 'Clinical Research' }
      });

      const user = userEvent.setup();

      renderWithTheme(
        <ConsultationInterface 
          selectedAdvisors={mockDomains[0].advisors}
          domain={mockDomains[0]}
        />
      );

      // Submit prompt
      const promptInput = screen.getByPlaceholderText('Enter your question for the advisory board...');
      await user.type(promptInput, 'Integration test question');
      
      const submitButton = screen.getByText('Submit Question');
      await user.click(submitButton);

      // Should display AI response
      await waitFor(() => {
        expect(screen.getByText('Integration test response')).toBeInTheDocument();
      });
    });
  });

  describe('Session Management Integration', () => {
    it('should integrate session state with export functionality', async () => {
      const user = userEvent.setup();
      
      renderWithTheme(
        <SessionManager>
          <ConsultationInterface 
            selectedAdvisors={mockDomains[0].advisors}
            domain={mockDomains[0]}
          />
        </SessionManager>
      );

      // Create session data
      const promptInput = screen.getByPlaceholderText('Enter your question for the advisory board...');
      await user.type(promptInput, 'Session test question');
      
      const submitButton = screen.getByText('Submit Question');
      await user.click(submitButton);

      // Wait for response
      await waitFor(() => {
        expect(screen.getByTestId('response-panel')).toBeInTheDocument();
      });

      // Test export integration
      const exportButton = screen.getByText('Export Session');
      await user.click(exportButton);

      expect(screen.getByText('Export as PDF')).toBeInTheDocument();
      expect(screen.getByText('Export as Markdown')).toBeInTheDocument();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle errors gracefully across component boundaries', async () => {
      const mockYamlConfigLoader = await import('../../services/yamlConfigLoader');
      (mockYamlConfigLoader.loadDomainConfig as any).mockRejectedValue(
        new Error('YAML loading failed')
      );

      renderWithTheme(
        <AdvisorSelectionPanel 
          domain={mockDomains[0]}
          onAdvisorSelect={() => {}}
          onProceed={() => {}}
          selectedAdvisors={[]}
        />
      );

      // Should display error message
      await waitFor(() => {
        expect(screen.getByText(/Error loading advisors/)).toBeInTheDocument();
      });
    });

    it('should handle AI service errors in consultation flow', async () => {
      const mockAdvisorService = await import('../../services/advisorService');
      (mockAdvisorService.generateAdvisorResponse as any).mockRejectedValue(
        new Error('AI service unavailable')
      );

      const user = userEvent.setup();

      renderWithTheme(
        <ConsultationInterface 
          selectedAdvisors={mockDomains[0].advisors}
          domain={mockDomains[0]}
        />
      );

      const promptInput = screen.getByPlaceholderText('Enter your question for the advisory board...');
      await user.type(promptInput, 'Error test question');
      
      const submitButton = screen.getByText('Submit Question');
      await user.click(submitButton);

      // Should display error message
      await waitFor(() => {
        expect(screen.getByText(/Failed to generate response/)).toBeInTheDocument();
      });
    });
  });
});