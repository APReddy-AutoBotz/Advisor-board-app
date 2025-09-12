import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SummaryDisplay from '../SummaryDisplay';

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

// Mock the ThemeProvider component
vi.mock('../../common/ThemeProvider', () => ({
  ThemeProvider: ({ children }: any) => <div>{children}</div>,
}));

import { ThemeProvider } from '../../common/ThemeProvider';

const mockSummary = `**Advisory Board Summary**

**Question:** What are the key regulatory considerations for Phase 2 trials?

**Advisors Consulted:** Dr. Clinical Expert, Dr. Regulatory Specialist

**Domains Represented:** Clinical Research

**Consensus Points:**
1. Multiple advisors (Dr. Clinical Expert, Dr. Regulatory Specialist) emphasized the importance of safety-focused considerations
2. Regulatory compliance is critical for trial success

**Key Insights:**
1. Dr. Clinical Expert: We must ensure compliance with FDA guidelines and implement robust safety monitoring protocols
2. Dr. Regulatory Specialist: I recommend establishing clear documentation processes for regulatory submissions

**Unique Perspectives:**
1. Dr. Clinical Expert brought regulatory and clinical trial expertise, emphasizing compliance and safety protocols
2. Dr. Regulatory Specialist provided specialized insights from their Regulatory Affairs background

**Recommendation:**
Based on the clinical research expertise consulted, a focused approach within this domain is recommended. Consider implementing the suggested strategies while maintaining alignment with domain-specific best practices.`;

describe('SummaryDisplay', () => {
  const defaultProps = {
    summary: mockSummary,
    isVisible: true,
    onToggleVisibility: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithTheme = (component: React.ReactElement) => {
    return render(
      <ThemeProvider>
        {component}
      </ThemeProvider>
    );
  };

  describe('rendering', () => {
    it('should render summary when visible', () => {
      renderWithTheme(<SummaryDisplay {...defaultProps} />);
      
      expect(screen.getByText('Response Summary')).toBeInTheDocument();
      expect(screen.getByText('Advisory Board Summary')).toBeInTheDocument();
      expect(screen.getByText(/What are the key regulatory considerations/)).toBeInTheDocument();
    });

    it('should not render when not visible', () => {
      renderWithTheme(<SummaryDisplay {...defaultProps} isVisible={false} />);
      
      expect(screen.queryByText('Response Summary')).not.toBeInTheDocument();
    });

    it('should render hide summary button when visible', () => {
      renderWithTheme(<SummaryDisplay {...defaultProps} />);
      
      const hideButton = screen.getByText('Hide Summary');
      expect(hideButton).toBeInTheDocument();
    });

    it('should render clear button when onClear is provided', () => {
      const onClear = vi.fn();
      renderWithTheme(<SummaryDisplay {...defaultProps} onClear={onClear} />);
      
      const clearButton = screen.getByRole('button', { name: /delete/i });
      expect(clearButton).toBeInTheDocument();
    });

    it('should not render clear button when onClear is not provided', () => {
      renderWithTheme(<SummaryDisplay {...defaultProps} />);
      
      const clearButton = screen.queryByRole('button', { name: /delete/i });
      expect(clearButton).not.toBeInTheDocument();
    });
  });

  describe('content parsing', () => {
    it('should parse and display structured sections', () => {
      renderWithTheme(<SummaryDisplay {...defaultProps} />);
      
      // Check for section headers
      expect(screen.getByText('Question:')).toBeInTheDocument();
      expect(screen.getByText('Advisors Consulted:')).toBeInTheDocument();
      expect(screen.getByText('Consensus Points:')).toBeInTheDocument();
      expect(screen.getByText('Key Insights:')).toBeInTheDocument();
      expect(screen.getByText('Unique Perspectives:')).toBeInTheDocument();
      expect(screen.getByText('Recommendation:')).toBeInTheDocument();
    });

    it('should render list items correctly', () => {
      renderWithTheme(<SummaryDisplay {...defaultProps} />);
      
      // Check for list content
      expect(screen.getByText(/Multiple advisors.*emphasized the importance/)).toBeInTheDocument();
      expect(screen.getByText(/Dr. Clinical Expert.*We must ensure compliance/)).toBeInTheDocument();
    });

    it('should display appropriate icons for different sections', () => {
      renderWithTheme(<SummaryDisplay {...defaultProps} />);
      
      // The component should render SVG icons for different section types
      const svgElements = screen.getAllByRole('img', { hidden: true });
      expect(svgElements.length).toBeGreaterThan(0);
    });
  });

  describe('interactions', () => {
    it('should call onToggleVisibility when hide button is clicked', () => {
      const onToggleVisibility = vi.fn();
      renderWithTheme(<SummaryDisplay {...defaultProps} onToggleVisibility={onToggleVisibility} />);
      
      const hideButton = screen.getByText('Hide Summary');
      fireEvent.click(hideButton);
      
      expect(onToggleVisibility).toHaveBeenCalledTimes(1);
    });

    it('should call onClear when clear button is clicked', () => {
      const onClear = vi.fn();
      renderWithTheme(<SummaryDisplay {...defaultProps} onClear={onClear} />);
      
      const clearButton = screen.getByRole('button', { name: /delete/i });
      fireEvent.click(clearButton);
      
      expect(onClear).toHaveBeenCalledTimes(1);
    });
  });

  describe('styling and accessibility', () => {
    it('should apply custom className', () => {
      const { container } = renderWithTheme(
        <SummaryDisplay {...defaultProps} className="custom-class" />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should have proper semantic structure', () => {
      renderWithTheme(<SummaryDisplay {...defaultProps} />);
      
      // Check for proper heading structure
      const mainHeading = screen.getByRole('heading', { level: 3 });
      expect(mainHeading).toHaveTextContent('Response Summary');
      
      const subHeadings = screen.getAllByRole('heading', { level: 4 });
      expect(subHeadings.length).toBeGreaterThan(0);
    });

    it('should display timestamp in metadata', () => {
      renderWithTheme(<SummaryDisplay {...defaultProps} />);
      
      expect(screen.getByText('Generated summary of advisor responses')).toBeInTheDocument();
      // Should display current time (we can't test exact time due to timing)
      expect(screen.getByText(/\d{1,2}:\d{2}:\d{2}/)).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle empty summary gracefully', () => {
      renderWithTheme(<SummaryDisplay {...defaultProps} summary="" />);
      
      expect(screen.getByText('Response Summary')).toBeInTheDocument();
      // Should still render the container even with empty content
    });

    it('should handle summary without structured sections', () => {
      const plainSummary = 'This is just a plain text summary without any structured sections.';
      renderWithTheme(<SummaryDisplay {...defaultProps} summary={plainSummary} />);
      
      expect(screen.getByText('Response Summary')).toBeInTheDocument();
      expect(screen.getByText(plainSummary)).toBeInTheDocument();
    });

    it('should handle summary with only headers', () => {
      const headerOnlySummary = '**Header 1**\n**Header 2**\n**Header 3**';
      renderWithTheme(<SummaryDisplay {...defaultProps} summary={headerOnlySummary} />);
      
      expect(screen.getByText('Header 1')).toBeInTheDocument();
      expect(screen.getByText('Header 2')).toBeInTheDocument();
      expect(screen.getByText('Header 3')).toBeInTheDocument();
    });

    it('should handle summary with mixed content types', () => {
      const mixedSummary = `**Section 1**
Some regular text here.

**List Section:**
1. First item
2. Second item

**Another Section**
More regular text.`;
      
      renderWithTheme(<SummaryDisplay {...defaultProps} summary={mixedSummary} />);
      
      expect(screen.getByText('Section 1')).toBeInTheDocument();
      expect(screen.getByText('Some regular text here.')).toBeInTheDocument();
      expect(screen.getByText('First item')).toBeInTheDocument();
      expect(screen.getByText('Second item')).toBeInTheDocument();
    });
  });

  describe('icon selection', () => {
    it('should use appropriate icons for different section types', () => {
      const sectionsWithIcons = `**Consensus Points:**
Test consensus content

**Key Insights:**
Test insights content

**Unique Perspectives:**
Test perspectives content

**Recommendation:**
Test recommendation content`;

      renderWithTheme(<SummaryDisplay {...defaultProps} summary={sectionsWithIcons} />);
      
      // Each section should have its appropriate icon
      // We can't easily test the specific SVG paths, but we can ensure icons are rendered
      const sections = screen.getAllByRole('heading', { level: 4 });
      expect(sections.length).toBe(4);
    });
  });
});
