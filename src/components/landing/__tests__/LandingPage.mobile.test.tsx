import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '../../../utils/testUtils';
import { simulateMobileViewport, simulateTabletViewport, simulateDesktopViewport } from '../../../utils/testUtils';
import LandingPage from '../LandingPage';
import { yamlConfigLoader } from '../../../services/yamlConfigLoader';

// Mock the YAML config loader
vi.mock('../../../services/yamlConfigLoader', () => ({
  yamlConfigLoader: {
    loadAllDomains: vi.fn(),
  },
}));

const mockDomains = [
  {
    id: 'cliniboard',
    name: 'Cliniboard',
    description: 'Clinical research advisory board',
    advisors: [
      { id: '1', name: 'Dr. Smith', expertise: 'Clinical Trials', background: 'FDA', domain: { id: 'cliniboard' } },
      { id: '2', name: 'Dr. Jones', expertise: 'Regulatory', background: 'Pharma', domain: { id: 'cliniboard' } },
    ],
    theme: { primary: '#3B82F6', secondary: '#1E40AF', accent: '#60A5FA', background: '#F8FAFC', text: '#1E293B' },
  },
  {
    id: 'eduboard',
    name: 'EduBoard',
    description: 'Education advisory board',
    advisors: [
      { id: '3', name: 'Prof. Wilson', expertise: 'Pedagogy', background: 'University', domain: { id: 'eduboard' } },
    ],
    theme: { primary: '#F59E0B', secondary: '#D97706', accent: '#FBBF24', background: '#FFFBEB', text: '#92400E' },
  },
];

describe('LandingPage Mobile Responsiveness', () => {
  beforeEach(() => {
    vi.mocked(yamlConfigLoader.loadAllDomains).mockResolvedValue(mockDomains);
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Reset viewport to desktop
    simulateDesktopViewport();
  });

  describe('Mobile Layout (375px)', () => {
    beforeEach(() => {
      simulateMobileViewport();
    });

    it('should display hero section properly on mobile', async () => {
      render(<LandingPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Ask the Greatest Minds')).toBeInTheDocument();
      });

      const heroSection = screen.getByRole('banner');
      expect(heroSection).toBeInTheDocument();

      // Check that the main CTA button is full width on mobile
      const ctaButton = screen.getByText('Start Your Boardroom Session');
      expect(ctaButton.className).toContain('w-full');
    });

    it('should stack domain cards vertically on mobile', async () => {
      render(<LandingPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Cliniboard')).toBeInTheDocument();
      });

      const domainGrid = screen.getByRole('group', { name: 'Available advisory domains' });
      expect(domainGrid.className).toContain('grid-cols-1');
    });

    it('should have proper spacing and padding on mobile', async () => {
      render(<LandingPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Choose Your Advisory Domain')).toBeInTheDocument();
      });

      const mainSection = screen.getByRole('main');
      expect(mainSection.className).toContain('py-16');
      expect(mainSection.className).toContain('px-4');
    });

    it('should position dark mode toggle appropriately on mobile', async () => {
      render(<LandingPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('banner')).toBeInTheDocument();
      });

      // Dark mode toggle should be positioned for mobile
      const heroSection = screen.getByRole('banner');
      const toggleContainer = heroSection.querySelector('.absolute');
      expect(toggleContainer?.className).toContain('top-4');
      expect(toggleContainer?.className).toContain('right-4');
    });

    it('should make text sizes appropriate for mobile', async () => {
      render(<LandingPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Ask the Greatest Minds')).toBeInTheDocument();
      });

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading.className).toContain('text-3xl');
      
      const sectionHeading = screen.getByText('Choose Your Advisory Domain');
      expect(sectionHeading.className).toContain('text-2xl');
    });
  });

  describe('Tablet Layout (768px)', () => {
    beforeEach(() => {
      simulateTabletViewport();
    });

    it('should display two columns of domain cards on tablet', async () => {
      render(<LandingPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Cliniboard')).toBeInTheDocument();
      });

      const domainGrid = screen.getByRole('group', { name: 'Available advisory domains' });
      expect(domainGrid.className).toContain('sm:grid-cols-2');
    });

    it('should adjust hero layout for tablet', async () => {
      render(<LandingPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Ask the Greatest Minds')).toBeInTheDocument();
      });

      const heroSection = screen.getByRole('banner');
      expect(heroSection).toBeInTheDocument();
      
      // Check that spacing is adjusted for tablet
      const container = heroSection.querySelector('.container');
      expect(container?.className).toContain('py-16');
    });

    it('should make CTA button inline on tablet', async () => {
      render(<LandingPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Start Your Boardroom Session')).toBeInTheDocument();
      });

      const ctaButton = screen.getByText('Start Your Boardroom Session');
      expect(ctaButton.className).toContain('sm:w-auto');
    });
  });

  describe('Desktop Layout (1920px)', () => {
    beforeEach(() => {
      simulateDesktopViewport();
    });

    it('should display three columns of domain cards on desktop', async () => {
      render(<LandingPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Cliniboard')).toBeInTheDocument();
      });

      const domainGrid = screen.getByRole('group', { name: 'Available advisory domains' });
      expect(domainGrid.className).toContain('lg:grid-cols-3');
    });

    it('should use larger text sizes on desktop', async () => {
      render(<LandingPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Ask the Greatest Minds')).toBeInTheDocument();
      });

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading.className).toContain('lg:text-6xl');
    });

    it('should position dark mode toggle for desktop', async () => {
      render(<LandingPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('banner')).toBeInTheDocument();
      });

      const heroSection = screen.getByRole('banner');
      const toggleContainer = heroSection.querySelector('.absolute');
      expect(toggleContainer?.className).toContain('sm:top-6');
      expect(toggleContainer?.className).toContain('sm:right-6');
    });
  });

  describe('Touch Interactions', () => {
    beforeEach(() => {
      simulateMobileViewport();
    });

    it('should have touch-friendly button sizes', async () => {
      render(<LandingPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Start Your Boardroom Session')).toBeInTheDocument();
      });

      const ctaButton = screen.getByText('Start Your Boardroom Session');
      expect(ctaButton.className).toContain('min-h-[44px]');
      expect(ctaButton.className).toContain('touch-manipulation');
    });

    it('should make domain cards touch-friendly', async () => {
      render(<LandingPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Cliniboard')).toBeInTheDocument();
      });

      // Domain cards should be interactive and touch-friendly
      const domainCards = screen.getAllByRole('button');
      domainCards.forEach(card => {
        expect(card.className).toContain('touch-manipulation');
      });
    });
  });

  describe('Content Reflow', () => {
    it('should reflow content properly when viewport changes', async () => {
      const { rerender } = render(<LandingPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Cliniboard')).toBeInTheDocument();
      });

      // Start with mobile
      simulateMobileViewport();
      rerender(<LandingPage />);
      
      let domainGrid = screen.getByRole('group', { name: 'Available advisory domains' });
      expect(domainGrid.className).toContain('grid-cols-1');

      // Switch to desktop
      simulateDesktopViewport();
      rerender(<LandingPage />);
      
      domainGrid = screen.getByRole('group', { name: 'Available advisory domains' });
      expect(domainGrid.className).toContain('lg:grid-cols-3');
    });
  });

  describe('Loading States on Mobile', () => {
    beforeEach(() => {
      simulateMobileViewport();
    });

    it('should display loading state properly on mobile', () => {
      vi.mocked(yamlConfigLoader.loadAllDomains).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockDomains), 100))
      );

      render(<LandingPage />);
      
      const loadingText = screen.getByText('Loading advisory domains...');
      expect(loadingText).toBeInTheDocument();
      
      // Loading container should be mobile-friendly
      const loadingContainer = loadingText.closest('.min-h-screen');
      expect(loadingContainer).toBeInTheDocument();
    });
  });

  describe('Error States on Mobile', () => {
    beforeEach(() => {
      simulateMobileViewport();
    });

    it('should display error state properly on mobile', async () => {
      vi.mocked(yamlConfigLoader.loadAllDomains).mockRejectedValue(new Error('Network error'));

      render(<LandingPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Configuration Error')).toBeInTheDocument();
      });

      const retryButton = screen.getByText('Retry Loading');
      expect(retryButton.className).toContain('min-h-[44px]');
    });
  });
});
