import React, { ReactNode, useEffect, useState } from 'react';
import ErrorBoundary from './ErrorBoundary';
import Button from './Button';
import Card from './Card';

interface AsyncErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error) => void;
  resetKeys?: Array<string | number>;
  fallback?: ReactNode;
}

interface AsyncErrorState {
  error: Error | null;
  isRetrying: boolean;
  retryCount: number;
}

/**
 * Error boundary specifically designed for handling async operation errors
 * Provides retry functionality and graceful degradation
 */
const AsyncErrorBoundary: React.FC<AsyncErrorBoundaryProps> = ({
  children,
  onError,
  resetKeys = [],
  fallback,
}) => {
  const [asyncError, setAsyncError] = useState<AsyncErrorState>({
    error: null,
    isRetrying: false,
    retryCount: 0,
  });

  // Reset error state when resetKeys change
  useEffect(() => {
    if (asyncError.error) {
      setAsyncError({
        error: null,
        isRetrying: false,
        retryCount: 0,
      });
    }
  }, resetKeys);

  // Global error handler for unhandled promise rejections
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      // Only capture if it's likely related to our app
      if (event.reason instanceof Error) {
        setAsyncError(prev => ({
          error: event.reason,
          isRetrying: false,
          retryCount: prev.retryCount,
        }));
        
        if (onError) {
          onError(event.reason);
        }
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [onError]);

  const handleRetry = () => {
    setAsyncError(prev => ({
      error: null,
      isRetrying: true,
      retryCount: prev.retryCount + 1,
    }));

    // Reset retry state after a short delay
    setTimeout(() => {
      setAsyncError(prev => ({
        ...prev,
        isRetrying: false,
      }));
    }, 1000);
  };

  const handleClearError = () => {
    setAsyncError({
      error: null,
      isRetrying: false,
      retryCount: 0,
    });
  };

  // Custom fallback for async errors
  const AsyncErrorFallback = () => {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Card padding="lg" className="border-red-200 bg-red-50 text-center">
        <div className="text-red-500 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </div>

        <h3 className="text-lg font-semibold text-red-900 mb-2">
          Operation Failed
        </h3>

        <p className="text-red-700 mb-4 text-sm">
          {asyncError.error?.message || 'An unexpected error occurred during the operation.'}
        </p>

        {asyncError.retryCount > 0 && (
          <p className="text-red-600 mb-4 text-xs">
            Retry attempts: {asyncError.retryCount}
          </p>
        )}

        <div className="flex justify-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            disabled={asyncError.isRetrying}
          >
            {asyncError.isRetrying ? 'Retrying...' : 'Retry'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearError}
          >
            Dismiss
          </Button>
        </div>
      </Card>
    );
  };

  // Provide error context to children
  const errorContext = {
    setAsyncError: (error: Error) => {
      setAsyncError(prev => ({
        error,
        isRetrying: false,
        retryCount: prev.retryCount,
      }));
      
      if (onError) {
        onError(error);
      }
    },
    clearAsyncError: handleClearError,
    retryCount: asyncError.retryCount,
  };

  return (
    <ErrorBoundary
      resetKeys={resetKeys}
      onError={onError}
    >
      <AsyncErrorContext.Provider value={errorContext}>
        {asyncError.error ? <AsyncErrorFallback /> : children}
      </AsyncErrorContext.Provider>
    </ErrorBoundary>
  );
};

// Context for async error handling
export const AsyncErrorContext = React.createContext<{
  setAsyncError: (error: Error) => void;
  clearAsyncError: () => void;
  retryCount: number;
} | null>(null);

// Hook for using async error context
export const useAsyncError = () => {
  const context = React.useContext(AsyncErrorContext);
  if (!context) {
    throw new Error('useAsyncError must be used within an AsyncErrorBoundary');
  }
  return context;
};

export default AsyncErrorBoundary;
