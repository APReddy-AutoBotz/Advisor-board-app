import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../../components/common/ThemeProvider';
import { LandingPage } from '../../components/landing/LandingPage';
import { AdvisorSelectionPanel } from '../../components/advisors/AdvisorSelectionPanel';
import { ConsultationInterface } from '../../components/consultation/ConsultationInterface';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';

// Mock services for consistent visual testing
vi.mock('../../services/yamlConfigLoader');
vi.mock('../../services/advisorService');

const mockDomains = [
  {
    id: 'cliniboard' as const,
    name: 'Cliniboard',
    description: 'Clinical trials expertise with comprehensive research capabilities',
    theme: { primary: 'blue', secondary: 'blue-light' },
    advisors: [
      {
        id: 'advisor-1',
        name: 'Dr. Sarah Chen',
        expertise: 'Clinical Research',
        background: 'Leading clinical researcher with 15+ years experience in Phase II/III trials',
        domain: 'cliniboard' as const,
        isSelected: false
      },
      {
        id: 'advisor-2',
        name: 'Dr. Michael Rodriguez',
        expertise: 'Regulatory Affairs',
        background: 'Former FDA reviewer specializing in drug approval processes',
        domain: 'cliniboard' as const,
        isSelected: false
      }
    ]
  },
  {
    id: 'eduboard' as const,
    name: 'EduBoard',
    description: 'Educational innovation and pedagogical excellence',
    theme: { primary: 'orange', secondary: 'orange-light' },
    advisors: []
  },
  {
    id: 'remediboard' as const,
    name: 'RemediBoard',
    description: 'Natural remedies and holistic wellness approaches',
    theme: { primary: 'green', secondary: 'green-light' },
    advisors: []
  }
];

const renderWithTheme = (component: React.ReactNode, theme = 'cliniboard') => {
  return render(
    <ThemeProvider initialTheme={theme}>
      {component}
    </ThemeProvider>
  );
};

// Helper function to capture component snapshot
const captureSnapshot = (component: React.ReactNode, testName: string) => {
  const { container } = render(component);
  expect(container.firstChild).toMatchSnapshot(testName);
};

describe('Visual Regression Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset viewport for consistent testing
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
  });

  describe('Landing Page Visual Tests', () => {
    it('should render landing page with all domains consistently', () => {
      const { container } = renderWithTheme(
        <LandingPage domains={mockDomains} onDomainSelect={() => {}} />
      );
      
      expect(container.firstChild).toMatchSnapshot('landing-page-default');
    });

    it('should render landing page in dark mode', () => {
      const { container } = render(
        <ThemeProvider initialTheme="cliniboard" initialDarkMode={true}>
          <LandingPage domains={mockDomains} onDomainSelect={() => {}} />
        </ThemeProvider>
      );
      
      expect(container.firstChild).toMatchSnapshot('landing-page-dark-mode');
    });

    it('should render landing page on mobile viewport', () => {
      Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
      
      const { container } = renderWithTheme(
        <LandingPage domains={mockDomains} onDomainSelect={() => {}} />
      );
      
      expect(container.firstChild).toMatchSnapshot('landing-page-mobile');
    });
  });

  describe('Theme Consistency Tests', () => {
    it('should render cliniboard theme consistently', () => {
      const { container } = renderWithTheme(
        <div>
          <Button variant="primary">Cliniboard Button</Button>
          <Card className="mt-4">
            <h3>Cliniboard Card</h3>
            <p>Clinical trials expertise</p>
          </Card>
        </div>,
        'cliniboard'
      );
      
      expect(container.firstChild).toMatchSnapshot('cliniboard-theme');
    });

    it('should render eduboard theme consistently', () => {
      const { container } = renderWithTheme(
        <div>
          <Button variant="primary">EduBoard Button</Button>
          <Card className="mt-4">
            <h3>EduBoard Card</h3>
            <p>Educational innovation</p>
          </Card>
        </div>,
        'eduboard'
      );
      
      expect(container.firstChild).toMatchSnapshot('eduboard-theme');
    });

    it('should render remediboard theme consistently', () => {
      const { container } = renderWithTheme(
        <div>
          <Button variant="primary">RemediBoard Button</Button>
          <Card className="mt-4">
            <h3>RemediBoard Card</h3>
            <p>Natural remedies</p>
          </Card>
        </div>,
        'remediboard'
      );
      
      expect(container.firstChild).toMatchSnapshot('remediboard-theme');
    });
  });

  describe('Advisor Selection Visual Tests', () => {
    it('should render advisor selection panel consistently', () => {
      const { container } = renderWithTheme(
        <AdvisorSelectionPanel 
          domain={mockDomains[0]}
          onAdvisorSelect={() => {}}
          onProceed={() => {}}
          selectedAdvisors={[]}
        />
      );
      
      expect(container.firstChild).toMatchSnapshot('advisor-selection-empty');
    });

    it('should render advisor selection with selected advisors', () => {
      const selectedAdvisors = [mockDomains[0].advisors[0]];
      
      const { container } = renderWithTheme(
        <AdvisorSelectionPanel 
          domain={mockDomains[0]}
          onAdvisorSelect={() => {}}
          onProceed={() => {}}
          selectedAdvisors={selectedAdvisors}
        />
      );
      
      expect(container.firstChild).toMatchSnapshot('advisor-selection-with-selection');
    });
  });

  describe('Consultation Interface Visual Tests', () => {
    it('should render consultation interface initial state', () => {
      const { container } = renderWithTheme(
        <ConsultationInterface 
          selectedAdvisors={mockDomains[0].advisors}
          domain={mockDomains[0]}
        />
      );
      
      expect(container.firstChild).toMatchSnapshot('consultation-interface-initial');
    });

    it('should render consultation interface with responses', () => {
      const mockResponses = [
        {
          advisorId: 'advisor-1',
          content: 'This is a sample response from Dr. Sarah Chen regarding clinical trial considerations.',
          timestamp: new Date('2024-01-01T12:00:00Z'),
          persona: { name: 'Dr. Sarah Chen', expertise: 'Clinical Research' }
        }
      ];

      const { container } = renderWithTheme(
        <ConsultationInterface 
          selectedAdvisors={mockDomains[0].advisors}
          domain={mockDomains[0]}
        />
      );
      
      expect(container.firstChild).toMatchSnapshot('consultation-interface-with-responses');
    });
  });

  describe('Button Component Visual Tests', () => {
    it('should render all button variants consistently', () => {
      const { container } = renderWithTheme(
        <div className="space-y-4">
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="outline">Outline Button</Button>
          <Button variant="ghost">Ghost Button</Button>
        </div>
      );
      
      expect(container.firstChild).toMatchSnapshot('button-variants');
    });

    it('should render button sizes consistently', () => {
      const { container } = renderWithTheme(
        <div className="space-y-4">
          <Button size="sm">Small Button</Button>
          <Button size="md">Medium Button</Button>
          <Button size="lg">Large Button</Button>
        </div>
      );
      
      expect(container.firstChild).toMatchSnapshot('button-sizes');
    });

    it('should render button states consistently', () => {
      const { container } = renderWithTheme(
        <div className="space-y-4">
          <Button>Normal Button</Button>
          <Button disabled>Disabled Button</Button>
          <Button isLoading>Loading Button</Button>
        </div>
      );
      
      expect(container.firstChild).toMatchSnapshot('button-states');
    });
  });

  describe('Card Component Visual Tests', () => {
    it('should render card variants consistently', () => {
      const { container } = renderWithTheme(
        <div className="space-y-4">
          <Card>
            <h3>Default Card</h3>
            <p>This is a default card with standard styling.</p>
          </Card>
          
          <Card className="border-2 border-primary">
            <h3>Highlighted Card</h3>
            <p>This is a highlighted card with primary border.</p>
          </Card>
          
          <Card className="bg-secondary">
            <h3>Secondary Card</h3>
            <p>This is a card with secondary background.</p>
          </Card>
        </div>
      );
      
      expect(container.firstChild).toMatchSnapshot('card-variants');
    });
  });

  describe('Responsive Design Visual Tests', () => {
    const viewports = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1024, height: 768, name: 'desktop' },
      { width: 1440, height: 900, name: 'large-desktop' }
    ];

    viewports.forEach(({ width, height, name }) => {
      it(`should render landing page consistently on ${name}`, () => {
        Object.defineProperty(window, 'innerWidth', { value: width, writable: true });
        Object.defineProperty(window, 'innerHeight', { value: height, writable: true });
        
        const { container } = renderWithTheme(
          <LandingPage domains={mockDomains} onDomainSelect={() => {}} />
        );
        
        expect(container.firstChild).toMatchSnapshot(`landing-page-${name}`);
      });
    });
  });

  describe('Dark Mode Visual Tests', () => {
    it('should render all components consistently in dark mode', () => {
      const { container } = render(
        <ThemeProvider initialTheme="cliniboard" initialDarkMode={true}>
          <div className="space-y-8">
            <LandingPage domains={mockDomains} onDomainSelect={() => {}} />
            
            <div className="space-y-4">
              <Button variant="primary">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
            </div>
            
            <Card>
              <h3>Dark Mode Card</h3>
              <p>This card should render properly in dark mode.</p>
            </Card>
          </div>
        </ThemeProvider>
      );
      
      expect(container.firstChild).toMatchSnapshot('dark-mode-components');
    });
  });

  describe('Loading States Visual Tests', () => {
    it('should render loading states consistently', () => {
      const { container } = renderWithTheme(
        <div className="space-y-4">
          <Button isLoading>Loading Button</Button>
          
          <Card>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            </div>
          </Card>
        </div>
      );
      
      expect(container.firstChild).toMatchSnapshot('loading-states');
    });
  });

  describe('Error States Visual Tests', () => {
    it('should render error states consistently', () => {
      const { container } = renderWithTheme(
        <div className="space-y-4">
          <Card className="border-red-500 bg-red-50">
            <h3 className="text-red-700">Error State</h3>
            <p className="text-red-600">Something went wrong. Please try again.</p>
            <Button variant="outline" className="mt-2">Retry</Button>
          </Card>
        </div>
      );
      
      expect(container.firstChild).toMatchSnapshot('error-states');
    });
  });
});