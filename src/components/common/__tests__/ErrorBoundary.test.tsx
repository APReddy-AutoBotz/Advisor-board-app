import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import ErrorBoundary from '../ErrorBoundary';
import ThemeProvider from '../ThemeProvider';

// Mock component that throws an error
const ThrowError: React.FC<{ shouldThrow?: boolean; message?: string }> = ({ 
  shouldThrow = false, 
  message = 'Test error' 
}) => {
  if (shouldThrow) {
    throw new Error(message);
  }
  return <div>No error</div>;
};

// Mock console methods to avoid noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Test wrapper with ThemeProvider
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

describe('ErrorBoundary', () => {
  beforeEach(() => {
    console.error = vi.fn();
    console.warn = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });

  it('renders children when there is no error', () => {
    render(
      <TestWrapper>
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      </TestWrapper>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('renders error UI when child component throws', () => {
    render(
      <TestWrapper>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} message="Test error message" />
        </ErrorBoundary>
      </TestWrapper>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/We encountered an unexpected error/)).toBeInTheDocument();
  });

  it('shows error details in development mode', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <TestWrapper>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} message="Development error" />
        </ErrorBoundary>
      </TestWrapper>
    );

    expect(screen.getByText('Error Details (Development Only)')).toBeInTheDocument();

    process.env.NODE_ENV = originalNodeEnv;
  });

  it('hides error details in production mode', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    render(
      <TestWrapper>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} message="Production error" />
        </ErrorBoundary>
      </TestWrapper>
    );

    expect(screen.queryByText('Error Details (Development Only)')).not.toBeInTheDocument();

    process.env.NODE_ENV = originalNodeEnv;
  });

  it('calls onError callback when error occurs', () => {
    const onError = vi.fn();

    render(
      <TestWrapper>
        <ErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} message="Callback test error" />
        </ErrorBoundary>
      </TestWrapper>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('resets error state when Try Again is clicked', () => {
    let shouldThrow = true;
    
    const DynamicErrorComponent = () => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>No error</div>;
    };

    const { rerender } = render(
      <TestWrapper>
        <ErrorBoundary>
          <DynamicErrorComponent />
        </ErrorBoundary>
      </TestWrapper>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Change the error condition and click Try Again
    shouldThrow = false;
    fireEvent.click(screen.getByText('Try Again'));

    // Re-render with the same component but different behavior
    rerender(
      <TestWrapper>
        <ErrorBoundary>
          <DynamicErrorComponent />
        </ErrorBoundary>
      </TestWrapper>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('reloads page when Reload Page is clicked', () => {
    // Mock window.location.reload
    const mockReload = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true,
    });

    render(
      <TestWrapper>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Reload Page'));
    expect(mockReload).toHaveBeenCalled();
  });

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <TestWrapper>
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </TestWrapper>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('resets error when resetKeys change', () => {
    const { rerender } = render(
      <TestWrapper>
        <ErrorBoundary resetKeys={['key1']} resetOnPropsChange={true}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </TestWrapper>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Change resetKeys
    rerender(
      <TestWrapper>
        <ErrorBoundary resetKeys={['key2']} resetOnPropsChange={true}>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      </TestWrapper>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('generates unique error IDs', () => {
    const { rerender } = render(
      <TestWrapper>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} message="First error" />
        </ErrorBoundary>
      </TestWrapper>
    );

    const firstErrorId = screen.getByText(/error ID:/).textContent;

    // Reset and throw another error
    fireEvent.click(screen.getByText('Try Again'));
    
    rerender(
      <TestWrapper>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} message="Second error" />
        </ErrorBoundary>
      </TestWrapper>
    );

    const secondErrorId = screen.getByText(/error ID:/).textContent;
    expect(firstErrorId).not.toBe(secondErrorId);
  });

  it('handles auto-retry functionality', async () => {
    vi.useFakeTimers();

    const { rerender } = render(
      <TestWrapper>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </TestWrapper>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Click auto-retry
    fireEvent.click(screen.getByText('Auto-retry in 3s'));

    // Fast-forward time
    vi.advanceTimersByTime(3000);

    // Re-render with no error
    rerender(
      <TestWrapper>
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      </TestWrapper>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('logs error information to console', () => {
    render(
      <TestWrapper>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} message="Console test error" />
        </ErrorBoundary>
      </TestWrapper>
    );

    expect(console.error).toHaveBeenCalledWith(
      'ErrorBoundary caught an error:',
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });
});
