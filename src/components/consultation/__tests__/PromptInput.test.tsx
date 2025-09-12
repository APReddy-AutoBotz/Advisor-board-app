import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PromptInput from '../PromptInput';
import ThemeProvider from '../../common/ThemeProvider';

// Test wrapper with ThemeProvider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

const renderWithTheme = (component: React.ReactElement) => {
  return render(component, { wrapper: TestWrapper });
};

describe('PromptInput', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders with default placeholder', () => {
    renderWithTheme(<PromptInput onSubmit={mockOnSubmit} />);
    
    expect(screen.getByPlaceholderText('Ask your question to the advisory board...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ask advisors/i })).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    const customPlaceholder = 'Custom placeholder text';
    renderWithTheme(<PromptInput onSubmit={mockOnSubmit} placeholder={customPlaceholder} />);
    
    expect(screen.getByPlaceholderText(customPlaceholder)).toBeInTheDocument();
  });

  it('shows character count', () => {
    renderWithTheme(<PromptInput onSubmit={mockOnSubmit} />);
    
    expect(screen.getByText('0/2000')).toBeInTheDocument();
  });

  it('updates character count when typing', async () => {
    renderWithTheme(<PromptInput onSubmit={mockOnSubmit} />);
    
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Hello world' } });
    
    await waitFor(() => {
      expect(screen.getByText('11/2000')).toBeInTheDocument();
    });
  });

  it('disables submit button when input is empty', () => {
    renderWithTheme(<PromptInput onSubmit={mockOnSubmit} />);
    
    const submitButton = screen.getByRole('button', { name: /ask advisors/i });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when input has content', async () => {
    renderWithTheme(<PromptInput onSubmit={mockOnSubmit} />);
    
    const textarea = screen.getByRole('textbox');
    const submitButton = screen.getByRole('button', { name: /ask advisors/i });
    
    fireEvent.change(textarea, { target: { value: 'Valid question here' } });
    
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('shows validation error for empty input on submit', async () => {
    renderWithTheme(<PromptInput onSubmit={mockOnSubmit} />);
    
    const form = screen.getByRole('textbox').closest('form');
    fireEvent.submit(form!);
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a question or prompt')).toBeInTheDocument();
    });
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('shows validation error for input that is too short', async () => {
    renderWithTheme(<PromptInput onSubmit={mockOnSubmit} />);
    
    const textarea = screen.getByRole('textbox');
    const form = textarea.closest('form');
    
    fireEvent.change(textarea, { target: { value: 'Short' } });
    fireEvent.submit(form!);
    
    await waitFor(() => {
      expect(screen.getByText('Please provide a more detailed question (at least 10 characters)')).toBeInTheDocument();
    });
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('shows validation error for input that is too long', async () => {
    renderWithTheme(<PromptInput onSubmit={mockOnSubmit} />);
    
    const textarea = screen.getByRole('textbox');
    const form = textarea.closest('form');
    const longText = 'a'.repeat(2001);
    
    fireEvent.change(textarea, { target: { value: longText } });
    fireEvent.submit(form!);
    
    await waitFor(() => {
      expect(screen.getByText('Question is too long (maximum 2000 characters)')).toBeInTheDocument();
    });
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with valid input', async () => {
    renderWithTheme(<PromptInput onSubmit={mockOnSubmit} />);
    
    const textarea = screen.getByRole('textbox');
    const form = textarea.closest('form');
    const validInput = 'This is a valid question with enough characters';
    
    fireEvent.change(textarea, { target: { value: validInput } });
    fireEvent.submit(form!);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(validInput);
    });
  });

  it('trims whitespace from input before submitting', async () => {
    renderWithTheme(<PromptInput onSubmit={mockOnSubmit} />);
    
    const textarea = screen.getByRole('textbox');
    const form = textarea.closest('form');
    const inputWithWhitespace = '  This is a valid question with whitespace  ';
    const expectedTrimmed = 'This is a valid question with whitespace';
    
    fireEvent.change(textarea, { target: { value: inputWithWhitespace } });
    fireEvent.submit(form!);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(expectedTrimmed);
    });
  });

  it('submits on Ctrl+Enter', async () => {
    renderWithTheme(<PromptInput onSubmit={mockOnSubmit} />);
    
    const textarea = screen.getByRole('textbox');
    const validInput = 'This is a valid question';
    
    fireEvent.change(textarea, { target: { value: validInput } });
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(validInput);
    });
  });

  it('submits on Cmd+Enter (Mac)', async () => {
    renderWithTheme(<PromptInput onSubmit={mockOnSubmit} />);
    
    const textarea = screen.getByRole('textbox');
    const validInput = 'This is a valid question';
    
    fireEvent.change(textarea, { target: { value: validInput } });
    fireEvent.keyDown(textarea, { key: 'Enter', metaKey: true });
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(validInput);
    });
  });

  it('shows loading state', () => {
    renderWithTheme(<PromptInput onSubmit={mockOnSubmit} isLoading={true} />);
    
    const submitButton = screen.getByRole('button', { name: /asking.../i });
    expect(submitButton).toBeDisabled();
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('shows disabled state', () => {
    renderWithTheme(<PromptInput onSubmit={mockOnSubmit} disabled={true} />);
    
    const submitButton = screen.getByRole('button', { name: /ask advisors/i });
    expect(submitButton).toBeDisabled();
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('clears error when user starts typing after validation error', async () => {
    renderWithTheme(<PromptInput onSubmit={mockOnSubmit} />);
    
    const textarea = screen.getByRole('textbox');
    const form = textarea.closest('form');
    
    // Trigger validation error
    fireEvent.submit(form!);
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a question or prompt')).toBeInTheDocument();
    });
    
    // Start typing
    fireEvent.change(textarea, { target: { value: 'New input' } });
    
    await waitFor(() => {
      expect(screen.queryByText('Please enter a question or prompt')).not.toBeInTheDocument();
    });
  });

  it('shows help text when no error is present', () => {
    renderWithTheme(<PromptInput onSubmit={mockOnSubmit} />);
    
    expect(screen.getByText('Tip: Press Ctrl+Enter (Cmd+Enter on Mac) to submit quickly')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const customClass = 'custom-test-class';
    renderWithTheme(<PromptInput onSubmit={mockOnSubmit} className={customClass} />);
    
    const container = screen.getByRole('textbox').closest('.custom-test-class');
    expect(container).toBeInTheDocument();
  });
});
