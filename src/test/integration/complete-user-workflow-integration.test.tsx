/**
 * Complete User Workflow Integration Test - Fixed Version
 * 
 * Tests the entire user journey from question submission to response display
 * Validates persona consistency and response quality across all advisor types
 * Verifies integration of all persona-llm components with consultation interface
 * 
 * Requirements: FR-1, FR-2, FR-3, FR-4, FR-5, FR-6, FR-7
 */

import { screen, waitFor } from '@testing-library/react';
import { render } from '../../utils/testUtils';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import ConsultationInterface from '../../components/consultation/ConsultationInterface';
import { generateAdvisorResponses, getQuestionInsights } from '../../services/intelligentResponseService';
import { demoModeService } from '../../services/demoModeService';
import { performanceMonitoringService } from '../../services/performanceMonitoringService';
import type { Domain, Advisor } from '../../types/domain';

// Mock services
vi.mock('../../services/intelligentResponseService');
vi.mock('../../services/demoModeService');
vi.mock('../../services/performanceMonitoringService');
vi.mock('../../services/exportService', () => ({
  ExportService: {
    exportToPDF: vi.fn().mockResolvedValue(undefined)
  }
}));

const mockGenerateAdvisorResponses = vi.mocked(generateAdvisorResponses);
const mockGetQuestionInsights = vi.mocked(getQuestionInsights);
const mockDemoModeService = vi.mocked(demoModeService);
const mockPerformanceMonitoringService = vi.mocked(performanceMonitoringService);

// Test data
const mockDomain: Domain = {
  id: 'productboard',
  name: 'ProductBoard',
  description: 'Product strategy and development advisory',
  theme: {
    primary: 'blue',
    secondary: 'blue-100',
    accent: 'blue-600',
    background: 'blue-50',
    text: 'blue-900'
  },
  advisors: []
};

const mockAdvisors: Advisor[] = [
  {
    id: 'cpo-001',
    name: 'Sarah Chen',
    expertise: 'Chief Product Officer',
    background: 'Former VP of Product at leading tech companies',
    domain: 'productboard',
    isSelected: true,
    credentials: 'MBA, 15+ years product leadership',
    specialties: ['Product Strategy', 'Market Analysis', 'Team Leadership'],
    avatar: '/images/advisors/sarah-chen.jpg'
  },
  {
    id: 'pm-001',
    name: 'Marcus Rodriguez',
    expertise: 'Senior Product Manager',
    background: 'Expert in agile development and user research',
    domain: 'productboard',
    isSelected: true,
    credentials: 'MS Computer Science, Certified Scrum Master',
    specialties: ['User Research', 'Agile Development', 'Data Analytics'],
    avatar: '/images/advisors/marcus-rodriguez.jpg'
  }
];

const mockQuestionInsights = {
  type: 'product_strategy',
  keywords: ['market', 'competition', 'strategy'],
  domain: 'productboard',
  confidence: 0.85,
  sentiment: 'neutral',
  complexity: 'medium',
  urgency: 'normal',
  frameworks: ['Jobs-to-be-Done', 'North Star Framework', 'OKRs']
};

const mockAdvisorResponses = [
  {
    advisorId: 'cpo-001',
    content: 'As a Chief Product Officer, I recommend focusing on market differentiation through innovative features that address unmet customer needs. Consider implementing a Jobs-to-be-Done framework to identify these opportunities.',
    timestamp: new Date(),
    persona: {
      name: 'Sarah Chen',
      expertise: 'Chief Product Officer'
    },
    metadata: {
      responseType: 'llm' as const,
      provider: 'openai',
      processingTime: 1200,
      confidence: 0.9,
      frameworks: ['Jobs-to-be-Done', 'North Star Framework']
    }
  },
  {
    advisorId: 'pm-001',
    content: 'From a product management perspective, I suggest conducting user interviews to validate your assumptions. Use data-driven insights to prioritize features that will have the highest impact on user satisfaction and business metrics.',
    timestamp: new Date(),
    persona: {
      name: 'Marcus Rodriguez',
      expertise: 'Senior Product Manager'
    },
    metadata: {
      responseType: 'static' as const,
      processingTime: 800,
      confidence: 0.85,
      frameworks: ['User Research', 'Data Analytics']
    }
  }
];

describe('Complete User Workflow Integration', () => {
  const user = userEvent.setup();
  let mockOnBack: ReturnType<typeof vi.fn>;
  let mockOnComplete: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnBack = vi.fn();
    mockOnComplete = vi.fn();
    
    // Reset all mocks
    vi.clearAllMocks();
    
    // Setup default mock implementations
    mockGetQuestionInsights.mockResolvedValue(mockQuestionInsights);
    mockGenerateAdvisorResponses.mockResolvedValue(mockAdvisorResponses);
    mockDemoModeService.isDemoModeActive.mockReturnValue(false);
    mockPerformanceMonitoringService.recordResponseMetrics.mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Interface Rendering', () => {
    it('should render consultation interface with selected advisors', () => {
      render(
        <ConsultationInterface
          selectedAdvisors={mockAdvisors}
          domain={mockDomain}
          onBack={mockOnBack}
          onComplete={mockOnComplete}
        />
      );

      // Verify domain header
      expect(screen.getByText('ProductBoard Advisory Session')).toBeInTheDocument();
      expect(screen.getByText('Consulting with 2 experts')).toBeInTheDocument();

      // Verify advisor display
      expect(screen.getByText('Your Advisory Board')).toBeInTheDocument();
      expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
      expect(screen.getByText('Chief Product Officer')).toBeInTheDocument();
      expect(screen.getByText('Marcus Rodriguez')).toBeInTheDocument();
      expect(screen.getByText('Senior Product Manager')).toBeInTheDocument();

      // Verify prompt input is visible
      expect(screen.getByLabelText('Your Question')).toBeInTheDocument();
    });

    it('should display back button when onBack is provided', () => {
      render(
        <ConsultationInterface
          selectedAdvisors={mockAdvisors}
          domain={mockDomain}
          onBack={mockOnBack}
          onComplete={mockOnComplete}
        />
      );

      const backButton = screen.getByRole('button', { name: /back to advisors/i });
      expect(backButton).toBeInTheDocument();
    });
  });

  describe('Question Submission and Analysis', () => {
    it('should analyze question and display insights', async () => {
      render(
        <ConsultationInterface
          selectedAdvisors={mockAdvisors}
          domain={mockDomain}
          onBack={mockOnBack}
          onComplete={mockOnComplete}
        />
      );

      const questionInput = screen.getByLabelText('Your Question');
      const submitButton = screen.getByRole('button', { name: /submit question/i });

      // Submit question
      await user.type(questionInput, 'How should I approach market competition analysis?');
      await user.click(submitButton);

      // Wait for question analysis
      await waitFor(() => {
        expect(mockGetQuestionInsights).toHaveBeenCalledWith(
          'How should I approach market competition analysis?'
        );
      });

      // Verify question display
      await waitFor(() => {
        expect(screen.getByText('Your Question')).toBeInTheDocument();
        expect(screen.getByText('"How should I approach market competition analysis?"')).toBeInTheDocument();
      });

      // Verify question analysis display
      await waitFor(() => {
        expect(screen.getByText('Question Analysis')).toBeInTheDocument();
        expect(screen.getByText('Type: product_strategy')).toBeInTheDocument();
        expect(screen.getByText('Domain: productboard')).toBeInTheDocument();
        expect(screen.getByText('Confidence: 85%')).toBeInTheDocument();
      });
    });

    it('should show loading state during response generation', async () => {
      // Make the response generation take longer
      mockGenerateAdvisorResponses.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockAdvisorResponses), 1000))
      );

      render(
        <ConsultationInterface
          selectedAdvisors={mockAdvisors}
          domain={mockDomain}
          onBack={mockOnBack}
          onComplete={mockOnComplete}
        />
      );

      const questionInput = screen.getByLabelText('Your Question');
      const submitButton = screen.getByRole('button', { name: /submit question/i });

      await user.type(questionInput, 'Test question');
      await user.click(submitButton);

      // Verify loading state - using regex to avoid emoji encoding issues
      await waitFor(() => {
        expect(screen.getByText(/Generating Intelligent Responses/)).toBeInTheDocument();
        expect(screen.getByText(/Our AI advisors are analyzing your question/)).toBeInTheDocument();
      });

      // Wait for responses to complete
      await waitFor(() => {
        expect(screen.getByText(/Expert Advisory Responses/)).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Response Generation and Display', () => {
    it('should generate and display advisor responses with persona consistency', async () => {
      render(
        <ConsultationInterface
          selectedAdvisors={mockAdvisors}
          domain={mockDomain}
          onBack={mockOnBack}
          onComplete={mockOnComplete}
        />
      );

      const questionInput = screen.getByLabelText('Your Question');
      const submitButton = screen.getByRole('button', { name: /submit question/i });

      await user.type(questionInput, 'How should I approach market competition analysis?');
      await user.click(submitButton);

      // Wait for responses
      await waitFor(() => {
        expect(mockGenerateAdvisorResponses).toHaveBeenCalledWith(
          'How should I approach market competition analysis?',
          expect.arrayContaining([
            expect.objectContaining({
              id: 'cpo-001',
              name: 'Sarah Chen',
              code: 'CHI',
              role: 'Chief Product Officer',
              blurb: 'Former VP of Product at leading tech companies'
            }),
            expect.objectContaining({
              id: 'pm-001',
              name: 'Marcus Rodriguez',
              code: 'SEN',
              role: 'Senior Product Manager',
              blurb: 'Expert in agile development and user research'
            })
          ]),
          'productboard'
        );
      });

      // Verify response display
      await waitFor(() => {
        expect(screen.getByText(/Expert Advisory Responses/)).toBeInTheDocument();
        
        // Check CPO response
        expect(screen.getByText(/As a Chief Product Officer, I recommend focusing on market differentiation/)).toBeInTheDocument();
        
        // Check PM response
        expect(screen.getByText(/From a product management perspective, I suggest conducting user interviews/)).toBeInTheDocument();
      });

      // Verify advisor names are displayed (using getAllByText since names appear in multiple places)
      expect(screen.getAllByText('Sarah Chen')).toHaveLength(2); // Once in advisor board, once in response
      expect(screen.getAllByText('Marcus Rodriguez')).toHaveLength(2); // Once in advisor board, once in response
    });

    it('should handle response generation errors gracefully', async () => {
      mockGenerateAdvisorResponses.mockRejectedValue(new Error('API Error'));

      render(
        <ConsultationInterface
          selectedAdvisors={mockAdvisors}
          domain={mockDomain}
          onBack={mockOnBack}
          onComplete={mockOnComplete}
        />
      );

      const questionInput = screen.getByLabelText('Your Question');
      const submitButton = screen.getByRole('button', { name: /submit question/i });

      await user.type(questionInput, 'Test question');
      await user.click(submitButton);

      // Wait for fallback responses
      await waitFor(() => {
        expect(screen.getByText(/Expert Advisory Responses/)).toBeInTheDocument();
        
        // Should show fallback responses
        expect(screen.getByText(/Thank you for your question about "Test question"/)).toBeInTheDocument();
      });
    });
  });

  describe('Session Completion and Export', () => {
    it('should complete session and export results', async () => {
      render(
        <ConsultationInterface
          selectedAdvisors={mockAdvisors}
          domain={mockDomain}
          onBack={mockOnBack}
          onComplete={mockOnComplete}
        />
      );

      // Submit question and wait for responses
      const questionInput = screen.getByLabelText('Your Question');
      const submitButton = screen.getByRole('button', { name: /submit question/i });

      await user.type(questionInput, 'Test question');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Intelligent Consultation Complete/)).toBeInTheDocument();
      });

      // Verify completion stats
      expect(screen.getByText('AI Experts')).toBeInTheDocument();
      expect(screen.getByText('Intelligent Responses')).toBeInTheDocument();
      expect(screen.getByText('Relevance Score')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument(); // Confidence percentage

      // Test export functionality
      const exportButton = screen.getByRole('button', { name: /download professional report/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            domain: 'productboard',
            selectedAdvisors: mockAdvisors,
            prompt: 'Test question',
            responses: mockAdvisorResponses
          })
        );
      });
    });
  });

  describe('Accessibility and User Experience', () => {
    it('should be accessible to screen readers', async () => {
      render(
        <ConsultationInterface
          selectedAdvisors={mockAdvisors}
          domain={mockDomain}
          onBack={mockOnBack}
          onComplete={mockOnComplete}
        />
      );

      // Check for proper headings
      expect(screen.getByRole('heading', { name: /productboard advisory session/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /your advisory board/i })).toBeInTheDocument();

      // Check for proper form labels
      const questionInput = screen.getByLabelText('Your Question');
      expect(questionInput).toBeInTheDocument();

      // Check for proper button labels
      const submitButton = screen.getByRole('button', { name: /submit question/i });
      expect(submitButton).toBeInTheDocument();
    });

    it('should provide clear visual feedback during interactions', async () => {
      render(
        <ConsultationInterface
          selectedAdvisors={mockAdvisors}
          domain={mockDomain}
          onBack={mockOnBack}
          onComplete={mockOnComplete}
        />
      );

      const questionInput = screen.getByLabelText('Your Question');
      const submitButton = screen.getByRole('button', { name: /submit question/i });

      // Test input focus
      await user.click(questionInput);
      expect(questionInput).toHaveFocus();

      // Test button states
      expect(submitButton).toBeDisabled(); // Should be disabled when input is empty

      await user.type(questionInput, 'Test question');
      expect(submitButton).not.toBeDisabled(); // Should be enabled when input has content
    });
  });
});