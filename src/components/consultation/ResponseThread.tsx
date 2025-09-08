import React from 'react';
import type { Advisor, AdvisorResponse } from '../../types/domain';
import Card from '../common/Card';
import AdvisorAvatar from '../advisors/AdvisorAvatar';

interface ResponseThreadProps {
  advisor: Advisor;
  response: AdvisorResponse;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
}

const ResponseThread: React.FC<ResponseThreadProps> = ({
  advisor,
  response,
  onRetry,
  isRetrying = false,
  className = '',
}) => {
  const getDomainColorClasses = (): string => {
    const domainId = advisor.domain?.id;
    switch (domainId) {
      case 'cliniboard':
        return 'border-clinical-200 bg-clinical-50 text-clinical-800';
      case 'eduboard':
        return 'border-education-200 bg-education-50 text-education-800';
      case 'remediboard':
        return 'border-remedies-200 bg-remedies-50 text-remedies-800';
      default:
        return 'border-neutral-200 bg-neutral-50 text-neutral-800';
    }
  };

  const formatTimestamp = (timestamp: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(timestamp);
  };

  return (
    <Card variant="elevated" padding="none" className={`overflow-hidden ${className}`}>
      {/* Advisor Header */}
      <div className={`px-4 py-3 border-b ${getDomainColorClasses()}`}>
        <div className="flex items-center space-x-3">
          <AdvisorAvatar
            advisor={advisor}
            size="sm"
            className="flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">
              {advisor.name}
            </h3>
            <p className="text-xs opacity-75 truncate">
              {advisor.expertise}
            </p>
          </div>
          <div className="text-xs opacity-60">
            {formatTimestamp(response.timestamp)}
          </div>
        </div>
      </div>

      {/* Response Content */}
      <div className="p-4">
        <div className="prose prose-sm max-w-none">
          {response.content.split('\n').map((paragraph, index) => (
            paragraph.trim() ? (
              <p key={index} className="mb-3 last:mb-0 text-neutral-700 leading-relaxed">
                {paragraph}
              </p>
            ) : null
          ))}
        </div>
      </div>

      {/* Response Footer */}
      <div className="px-4 py-3 bg-neutral-50 border-t border-neutral-100">
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span>
            Response from {advisor.domain?.name || 'Advisory Board'}
            {response.persona && (
              <span className="ml-2 text-neutral-400">
                • {response.persona.tone}
              </span>
            )}
          </span>
          <div className="flex items-center space-x-2">
            {onRetry && (
              <button
                className={`hover:text-neutral-700 transition-colors ${isRetrying ? 'animate-spin' : ''}`}
                onClick={onRetry}
                disabled={isRetrying}
                title={isRetrying ? 'Retrying...' : 'Retry response'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
            <button
              className="hover:text-neutral-700 transition-colors"
              onClick={() => {
                navigator.clipboard?.writeText(response.content);
              }}
              title="Copy response"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              className="hover:text-neutral-700 transition-colors"
              onClick={() => {
                // TODO: Implement follow-up question functionality
                alert('Follow-up questions will be implemented in a future task');
              }}
              title="Ask follow-up"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ResponseThread;