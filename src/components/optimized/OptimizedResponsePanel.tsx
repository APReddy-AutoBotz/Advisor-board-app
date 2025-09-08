import React, { memo, useMemo, useCallback, useState } from 'react';
import type { Advisor, AdvisorResponse } from '../../types/domain';
import Button from '../common/Button';
import Card from '../common/Card';
import AdvisorAvatar from '../advisors/AdvisorAvatar';

interface OptimizedResponsePanelProps {
  advisor: Advisor;
  response?: AdvisorResponse;
  isLoading?: boolean;
  onRetry?: (advisorId: string) => void;
  className?: string;
  maxHeight?: string;
}

/**
 * Optimized response panel component with virtualization and performance optimizations
 */
const OptimizedResponsePanel: React.FC<OptimizedResponsePanelProps> = memo(({
  advisor,
  response,
  isLoading = false,
  onRetry,
  className = '',
  maxHeight = '32rem',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Memoize domain-specific styling
  const domainStyles = useMemo(() => {
    const domainId = advisor.domain?.id;
    switch (domainId) {
      case 'cliniboard':
        return {
          border: 'border-clinical-200',
          bg: 'bg-clinical-50',
          accent: 'text-clinical-600',
          header: 'bg-clinical-100',
        };
      case 'eduboard':
        return {
          border: 'border-education-200',
          bg: 'bg-education-50',
          accent: 'text-education-600',
          header: 'bg-education-100',
        };
      case 'remediboard':
        return {
          border: 'border-remedies-200',
          bg: 'bg-remedies-50',
          accent: 'text-remedies-600',
          header: 'bg-remedies-100',
        };
      default:
        return {
          border: 'border-neutral-200',
          bg: 'bg-neutral-50',
          accent: 'text-neutral-600',
          header: 'bg-neutral-100',
        };
    }
  }, [advisor.domain?.id]);

  // Memoize formatted response content
  const formattedContent = useMemo(() => {
    if (!response?.content) return null;

    const content = response.content;
    const shouldTruncate = content.length > 500 && !isExpanded;
    
    if (shouldTruncate) {
      return {
        text: content.substring(0, 500) + '...',
        isTruncated: true,
      };
    }

    return {
      text: content,
      isTruncated: false,
    };
  }, [response?.content, isExpanded]);

  // Memoize timestamp formatting
  const formattedTimestamp = useMemo(() => {
    if (!response?.timestamp) return null;
    
    const date = new Date(response.timestamp);
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  }, [response?.timestamp]);

  // Stable callback references
  const handleRetry = useCallback(() => {
    if (onRetry) {
      onRetry(advisor.id);
    }
  }, [onRetry, advisor.id]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  // Memoize card classes
  const cardClasses = useMemo(() => 
    `${domainStyles.border} ${domainStyles.bg} ${className}`.trim(),
    [domainStyles, className]
  );

  return (
    <Card
      variant="elevated"
      padding="none"
      className={cardClasses}
      style={{ maxHeight: isExpanded ? 'none' : maxHeight }}
    >
      {/* Header */}
      <div className={`${domainStyles.header} p-4 border-b ${domainStyles.border}`}>
        <div className="flex items-center">
          <AdvisorAvatar
            advisor={advisor}
            size="sm"
            className="mr-3 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold ${domainStyles.accent} truncate`}>
              {advisor.name}
            </h3>
            <p className="text-sm text-neutral-600 truncate">
              {advisor.expertise}
            </p>
          </div>
          {formattedTimestamp && (
            <div className="text-xs text-neutral-500 flex-shrink-0">
              {formattedTimestamp}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <LoadingContent />
        ) : response ? (
          <ResponseContent
            content={formattedContent}
            isExpanded={isExpanded}
            onToggleExpanded={toggleExpanded}
            domainAccent={domainStyles.accent}
          />
        ) : (
          <EmptyContent onRetry={handleRetry} />
        )}
      </div>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo optimization
  return (
    prevProps.advisor.id === nextProps.advisor.id &&
    prevProps.response?.content === nextProps.response?.content &&
    prevProps.response?.timestamp === nextProps.response?.timestamp &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.className === nextProps.className &&
    prevProps.maxHeight === nextProps.maxHeight
  );
});

// Memoized loading content component
const LoadingContent = memo(() => (
  <div className="space-y-3" role="status" aria-label="Loading response">
    <div className="animate-pulse">
      <div className="h-4 bg-neutral-200 rounded w-full mb-2"></div>
      <div className="h-4 bg-neutral-200 rounded w-5/6 mb-2"></div>
      <div className="h-4 bg-neutral-200 rounded w-4/6 mb-2"></div>
      <div className="h-4 bg-neutral-200 rounded w-3/6"></div>
    </div>
    <div className="flex items-center justify-center py-4">
      <div className="animate-spin w-6 h-6 border-2 border-neutral-300 border-t-neutral-600 rounded-full"></div>
      <span className="ml-2 text-sm text-neutral-600">Generating response...</span>
    </div>
  </div>
));

LoadingContent.displayName = 'LoadingContent';

// Memoized response content component
interface ResponseContentProps {
  content: { text: string; isTruncated: boolean } | null;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  domainAccent: string;
}

const ResponseContent = memo<ResponseContentProps>(({
  content,
  isExpanded,
  onToggleExpanded,
  domainAccent,
}) => {
  if (!content) return null;

  return (
    <div>
      <div className="prose prose-sm max-w-none text-neutral-700 leading-relaxed">
        {/* Split content into paragraphs for better readability */}
        {content.text.split('\n\n').map((paragraph, index) => (
          <p key={index} className="mb-3 last:mb-0">
            {paragraph}
          </p>
        ))}
      </div>
      
      {content.isTruncated && (
        <div className="mt-4 pt-3 border-t border-neutral-200">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleExpanded}
            className={`${domainAccent} border-current hover:bg-current hover:text-white`}
          >
            {isExpanded ? 'Show Less' : 'Read More'}
          </Button>
        </div>
      )}
    </div>
  );
});

ResponseContent.displayName = 'ResponseContent';

// Memoized empty content component
interface EmptyContentProps {
  onRetry?: () => void;
}

const EmptyContent = memo<EmptyContentProps>(({ onRetry }) => (
  <div className="text-center py-8">
    <div className="text-neutral-400 mb-4">
      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={1.5} 
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
        />
      </svg>
    </div>
    <p className="text-neutral-500 mb-4">No response available</p>
    {onRetry && (
      <Button variant="outline" size="sm" onClick={onRetry}>
        Retry
      </Button>
    )}
  </div>
));

EmptyContent.displayName = 'EmptyContent';

OptimizedResponsePanel.displayName = 'OptimizedResponsePanel';

export default OptimizedResponsePanel;