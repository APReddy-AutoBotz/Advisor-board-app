import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ResponseThread from '../ResponseThread';
import type { Advisor, AdvisorResponse } from '../../../types/domain';
import ThemeProvider from '../../common/ThemeProvider';

// Test wrapper with ThemeProvider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

const renderWithTheme = (component: React.ReactElement) => {
  return render(component, { wrapper: TestWrapper });
};

// Mock the AdvisorAvatar component
vi.mock('../../advisors/AdvisorAvatar', () => ({
  default: ({ advisor, size }: { advisor: Advisor; size: string }) => (
    <div data-testid={`avatar-${advisor.id}`} data-size={size}>
      {advisor.name} Avatar
    </div>
  ),
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

describe('ResponseThread', () => {
  const mockAdvisor: Advisor = {
    id: 'advisor-1',
    name: 'Dr. Jane Smith',
    expertise: 'Clinical Research',
    background: 'Expert in clinical trials with 15 years of experience',
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
  };

  const mockResponse: AdvisorResponse = {
    advisorId: 'advisor-1',
    content: 'This is a comprehensive response from the advisor.\n\nIt includes multiple paragraphs to test formatting.\n\nEach paragraph should be rendered separately.',
    timestamp: new Date('2024-01-15T10:30:00Z'),
    persona: {
      name: 'Dr. Jane Smith',
      expertise: 'Clinical Research',
      background: 'Expert in clinical trials',
    },
  };

  it('renders advisor information in header', () => {
    renderWithTheme(<ResponseThread advisor={mockAdvisor} response={mockResponse} />);

    expect(screen.getByTestId('avatar-advisor-1')).toBeInTheDocument();
    expect(screen.getByText('Dr. Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Clinical Research')).toBeInTheDocument();
  });

  it('formats and displays timestamp', () => {
    renderWithTheme(<ResponseThread advisor={mockAdvisor} response={mockResponse} />);

    // The timestamp should be formatted with AM/PM
    expect(screen.getByText('04:00:00 PM')).toBeInTheDocument();
  });

  it('renders response content with proper paragraph formatting', () => {
    renderWithTheme(<ResponseThread advisor={mockAdvisor} response={mockResponse} />);

    expect(screen.getByText('This is a comprehensive response from the advisor.')).toBeInTheDocument();
    expect(screen.getByText('It includes multiple paragraphs to test formatting.')).toBeInTheDocument();
    expect(screen.getByText('Each paragraph should be rendered separately.')).toBeInTheDocument();
  });

  it('displays domain name in footer', () => {
    renderWithTheme(<ResponseThread advisor={mockAdvisor} response={mockResponse} />);

    expect(screen.getByText('Response from Cliniboard')).toBeInTheDocument();
  });

  it('applies clinical domain styling', () => {
    renderWithTheme(<ResponseThread advisor={mockAdvisor} response={mockResponse} />);

    const headerSection = screen.getByText('Dr. Jane Smith').closest('.border-clinical-200');
    expect(headerSection).toHaveClass('border-clinical-200', 'bg-clinical-50', 'text-clinical-800');
  });

  it('applies education domain styling', () => {
    const eduAdvisor = {
      ...mockAdvisor,
      domain: {
        ...mockAdvisor.domain,
        id: 'eduboard' as const,
        name: 'EduBoard',
      },
    };

    renderWithTheme(<ResponseThread advisor={eduAdvisor} response={mockResponse} />);

    const headerSection = screen.getByText('Dr. Jane Smith').closest('.border-education-200');
    expect(headerSection).toHaveClass('border-education-200', 'bg-education-50', 'text-education-800');
  });

  it('applies remedies domain styling', () => {
    const remediAdvisor = {
      ...mockAdvisor,
      domain: {
        ...mockAdvisor.domain,
        id: 'remediboard' as const,
        name: 'RemediBoard',
      },
    };

    renderWithTheme(<ResponseThread advisor={remediAdvisor} response={mockResponse} />);

    const headerSection = screen.getByText('Dr. Jane Smith').closest('.border-remedies-200');
    expect(headerSection).toHaveClass('border-remedies-200', 'bg-remedies-50', 'text-remedies-800');
  });

  it('applies default styling for unknown domain', () => {
    const unknownAdvisor = {
      ...mockAdvisor,
      domain: {
        ...mockAdvisor.domain,
        id: 'unknown' as any,
        name: 'Unknown',
      },
    };

    renderWithTheme(<ResponseThread advisor={unknownAdvisor} response={mockResponse} />);

    const headerSection = screen.getByText('Dr. Jane Smith').closest('.border-neutral-200');
    expect(headerSection).toHaveClass('border-neutral-200', 'bg-neutral-50', 'text-neutral-800');
  });

  it('renders copy button and handles click', async () => {
    const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText');
    
    renderWithTheme(<ResponseThread advisor={mockAdvisor} response={mockResponse} />);

    const copyButton = screen.getByTitle('Copy response');
    expect(copyButton).toBeInTheDocument();

    fireEvent.click(copyButton);

    expect(writeTextSpy).toHaveBeenCalledWith(mockResponse.content);
  });

  it('renders follow-up button and shows alert on click', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    renderWithTheme(<ResponseThread advisor={mockAdvisor} response={mockResponse} />);

    const followUpButton = screen.getByTitle('Ask follow-up');
    expect(followUpButton).toBeInTheDocument();

    fireEvent.click(followUpButton);

    expect(alertSpy).toHaveBeenCalledWith('Follow-up questions will be implemented in a future task');

    alertSpy.mockRestore();
  });

  it('handles empty response content gracefully', () => {
    const emptyResponse = {
      ...mockResponse,
      content: '',
    };

    renderWithTheme(<ResponseThread advisor={mockAdvisor} response={emptyResponse} />);

    // Should still render the structure without content
    expect(screen.getByText('Dr. Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Response from Cliniboard')).toBeInTheDocument();
  });

  it('handles response with only whitespace', () => {
    const whitespaceResponse = {
      ...mockResponse,
      content: '   \n\n   \n   ',
    };

    renderWithTheme(<ResponseThread advisor={mockAdvisor} response={whitespaceResponse} />);

    // Should still render the structure
    expect(screen.getByText('Dr. Jane Smith')).toBeInTheDocument();
  });

  it('handles single paragraph response', () => {
    const singleParagraphResponse = {
      ...mockResponse,
      content: 'This is a single paragraph response without line breaks.',
    };

    renderWithTheme(<ResponseThread advisor={mockAdvisor} response={singleParagraphResponse} />);

    expect(screen.getByText('This is a single paragraph response without line breaks.')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const customClass = 'custom-response-class';
    
    renderWithTheme(<ResponseThread advisor={mockAdvisor} response={mockResponse} className={customClass} />);

    const container = screen.getByText('Dr. Jane Smith').closest(`.${customClass}`);
    expect(container).toBeInTheDocument();
  });

  it('passes correct size prop to AdvisorAvatar', () => {
    renderWithTheme(<ResponseThread advisor={mockAdvisor} response={mockResponse} />);

    const avatar = screen.getByTestId('avatar-advisor-1');
    expect(avatar).toHaveAttribute('data-size', 'sm');
  });

  it('truncates long advisor names and expertise in header', () => {
    const longNameAdvisor = {
      ...mockAdvisor,
      name: 'Dr. Jane Elizabeth Smith-Johnson-Williams',
      expertise: 'Clinical Research and Regulatory Affairs with Specialization in Cardiovascular Medicine',
    };

    renderWithTheme(<ResponseThread advisor={longNameAdvisor} response={mockResponse} />);

    const nameElement = screen.getByText('Dr. Jane Elizabeth Smith-Johnson-Williams');
    const expertiseElement = screen.getByText('Clinical Research and Regulatory Affairs with Specialization in Cardiovascular Medicine');
    
    expect(nameElement).toHaveClass('truncate');
    expect(expertiseElement).toHaveClass('truncate');
  });

  it('handles advisor without domain gracefully', () => {
    const advisorWithoutDomain = {
      ...mockAdvisor,
      domain: undefined as any,
    };

    renderWithTheme(<ResponseThread advisor={advisorWithoutDomain} response={mockResponse} />);

    expect(screen.getByText('Response from Advisory Board')).toBeInTheDocument();
  });
});
