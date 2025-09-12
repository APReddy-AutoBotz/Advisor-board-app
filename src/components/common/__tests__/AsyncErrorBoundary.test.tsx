import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import AsyncErrorBoundary, { useAsyncError } from '../AsyncErrorBoundary';

// Test component that uses async error context
const AsyncErrorTestComponent: React.FC<{ shouldThrowAsync?: boolean }> = ({ 
  shouldThrowAsync = false 
}) => {
  const { setAsyncError, clearAsyncError, retryCount } = useAsyncError();

  const handleAsyncOperation = async () => {
    if (shouldThrowAsync) {
      setAsyncError(new Error('Async operation failed'));
    }
  };

  return (
    <div>
      <div>Retry count: {retryCount}</div>
      <button onClick={handleAsyncOperation}>Trigger Async Error</button>
      <button onClick={clearAsyncError}>Clear Error</button>
    </div>
  );
};

// Mock console methods
const originalConsoleError = console.error;

describe('AsyncErrorBoundary', () => {
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('renders children when there is no error', () => {
    render(
      <AsyncErrorBoundary>
        <AsyncErrorTestComponent />
      </AsyncErrorBoundary>
    );

    expect(screen.getByText('Retry count: 0')).toBeInTheDocument();
    expect(screen.getByText('Trigger Async Error')).toBeInTheDocument();
  });

  it('shows error UI when async error is set', async () => {
    render(
      <AsyncErrorBoundary>
        <AsyncErrorTestComponent shouldThrowAsync={true} />
      </AsyncErrorBoundary>
    );

    fireEvent.click(screen.getByText('Trigger Async Error'));

    await waitFor(() => {
      expect(screen.getByText('Operation Failed')).toBeInTheDocument();
      expect(screen.getByText('Async operation failed')).toBeInTheDocument();
    });
  });

  it('calls onError callback when async error occurs', async () => {
    const onError = vi.fn();

    render(
      <AsyncErrorBoundary onError={onError}>
        <AsyncErrorTestComponent shouldThrowAsync={true} />
      </AsyncErrorBoundary>
    );

    fireEvent.click(screen.getByText('Trigger Async Error'));

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  it('allows retry functionality', async () => {
    render(
      <AsyncErrorBoundary>
        <AsyncErrorTestComponent shouldThrowAsync={true} />
      </AsyncErrorBoundary>
    );

    // Trigger error
    fireEvent.click(screen.getByText('Trigger Async Error'));

    await waitFor(() => {
      expect(screen.getByText('Operation Failed')).toBeInTheDocument();
    });

    // Click retry
    fireEvent.click(screen.getByText('Retry'));

    await waitFor(() => {
      expect(screen.getByText('Retry count: 1')).toBeInTheDocument();
    });
  });

  it('shows retry count after multiple retries', async () => {
    render(
      <AsyncErrorBoundary>
        <AsyncErrorTestComponent shouldThrowAsync={true} />
      </AsyncErrorBoundary>
    );

    // Trigger error and retry multiple times
    fireEvent.click(screen.getByText('Trigger Async Error'));

    await waitFor(() => {
      expect(screen.getByText('Operation Failed')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Retry'));

    await waitFor(() => {
      expect(screen.getByText('Retry count: 1')).toBeInTheDocument();
    });

    // Trigger error again
    fireEvent.click(screen.getByText('Trigger Async Error'));

    await waitFor(() => {
      expect(screen.getByText('Operation Failed')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Retry'));

    await waitFor(() => {
      expect(screen.getByText('Retry count: 2')).toBeInTheDocument();
    });
  });

  it('allows dismissing errors', async () => {
    render(
      <AsyncErrorBoundary>
        <AsyncErrorTestComponent shouldThrowAsync={true} />
      </AsyncErrorBoundary>
    );

    // Trigger error
    fireEvent.click(screen.getByText('Trigger Async Error'));

    await waitFor(() => {
      expect(screen.getByText('Operation Failed')).toBeInTheDocument();
    });

    // Dismiss error
    fireEvent.click(screen.getByText('Dismiss'));

    await waitFor(() => {
      expect(screen.getByText('Retry count: 0')).toBeInTheDocument();
      expect(screen.queryByText('Operation Failed')).not.toBeInTheDocument();
    });
  });

  it('resets error state when resetKeys change', async () => {
    const { rerender } = render(
      <AsyncErrorBoundary resetKeys={['key1']}>
        <AsyncErrorTestComponent shouldThrowAsync={true} />
      </AsyncErrorBoundary>
    );

    // Trigger error
    fireEvent.click(screen.getByText('Trigger Async Error'));

    await waitFor(() => {
      expect(screen.getByText('Operation Failed')).toBeInTheDocument();
    });

    // Change resetKeys
    rerender(
      <AsyncErrorBoundary resetKeys={['key2']}>
        <AsyncErrorTestComponent shouldThrowAsync={false} />
      </AsyncErrorBoundary>
    );

    await waitFor(() => {
      expect(screen.getByText('Retry count: 0')).toBeInTheDocument();
      expect(screen.queryByText('Operation Failed')).not.toBeInTheDocument();
    });
  });

  it('renders custom fallback when provided', async () => {
    const customFallback = <div>Custom async error message</div>;

    render(
      <AsyncErrorBoundary fallback={customFallback}>
        <AsyncErrorTestComponent shouldThrowAsync={true} />
      </AsyncErrorBoundary>
    );

    fireEvent.click(screen.getByText('Trigger Async Error'));

    await waitFor(() => {
      expect(screen.getByText('Custom async error message')).toBeInTheDocument();
      expect(screen.queryByText('Operation Failed')).not.toBeInTheDocument();
    });
  });

  it('shows retrying state during retry', async () => {
    vi.useFakeTimers();

    render(
      <AsyncErrorBoundary>
        <AsyncErrorTestComponent shouldThrowAsync={true} />
      </AsyncErrorBoundary>
    );

    // Trigger error
    fireEvent.click(screen.getByText('Trigger Async Error'));

    await waitFor(() => {
      expect(screen.getByText('Operation Failed')).toBeInTheDocument();
    });

    // Click retry
    fireEvent.click(screen.getByText('Retry'));

    // Should show retrying state
    expect(screen.getByText('Retrying...')).toBeInTheDocument();

    // Fast-forward time to complete retry
    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(screen.getByText('Retry')).toBeInTheDocument();
      expect(screen.queryByText('Retrying...')).not.toBeInTheDocument();
    });

    vi.useRealTimers();
  });

  it('handles unhandled promise rejections', async () => {
    const onError = vi.fn();

    render(
      <AsyncErrorBoundary onError={onError}>
        <div>Test content</div>
      </AsyncErrorBoundary>
    );

    // Simulate unhandled promise rejection
    const error = new Error('Unhandled promise rejection');
    const event = new PromiseRejectionEvent('unhandledrejection', {
      promise: Promise.reject(error),
      reason: error,
    });

    window.dispatchEvent(event);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(error);
    });
  });

  it('throws error when useAsyncError is used outside provider', () => {
    const TestComponent = () => {
      useAsyncError();
      return <div>Test</div>;
    };

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAsyncError must be used within an AsyncErrorBoundary');
  });
});
