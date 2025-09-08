import { useState } from 'react';
import type { Advisor, AdvisorResponse, DomainId } from '../../types/domain';
import ResponseThread from './ResponseThread';
import Card from '../common/Card';
import Button from '../common/Button';
import { useTheme } from '../common/ThemeProvider';

interface MultiDomainResponsePanelProps {
  responses: AdvisorResponse[];
  selectedAdvisors: Advisor[];
  domains: DomainId[];
  viewMode: 'domains' | 'advisors';
  prompt: string;
  className?: string;
}

export default function MultiDomainResponsePanel({
  responses,
  selectedAdvisors,
  domains,
  viewMode,
  prompt,
  className = ''
}: MultiDomainResponsePanelProps) {
  const { isDarkMode } = useTheme();
  const [expandedDomains, setExpandedDomains] = useState<Set<DomainId>>(new Set(domains));
  const [showSummary, setShowSummary] = useState(false);

  // Group responses by domain
  const responsesByDomain = responses.reduce((acc, response) => {
    const advisor = selectedAdvisors.find(a => a.id === response.advisorId);
    if (advisor) {
      const domainId = advisor.domain.id;
      if (!acc[domainId]) {
        acc[domainId] = [];
      }
      acc[domainId].push(response);
    }
    return acc;
  }, {} as Record<DomainId, AdvisorResponse[]>);

  // Get advisors by domain
  const advisorsByDomain = selectedAdvisors.reduce((acc, advisor) => {
    const domainId = advisor.domain.id;
    if (!acc[domainId]) {
      acc[domainId] = [];
    }
    acc[domainId].push(advisor);
    return acc;
  }, {} as Record<DomainId, Advisor[]>);

  const toggleDomainExpansion = (domainId: DomainId) => {
    setExpandedDomains(prev => {
      const newSet = new Set(prev);
      if (newSet.has(domainId)) {
        newSet.delete(domainId);
      } else {
        newSet.add(domainId);
      }
      return newSet;
    });
  };

  const getDomainName = (domainId: DomainId): string => {
    switch (domainId) {
      case 'cliniboard': return 'Cliniboard';
      case 'eduboard': return 'EduBoard';
      case 'remediboard': return 'RemediBoard';
      default: return domainId;
    }
  };

  const getDomainDescription = (domainId: DomainId): string => {
    switch (domainId) {
      case 'cliniboard': return 'Clinical research and regulatory guidance';
      case 'eduboard': return 'Education systems and curriculum reform';
      case 'remediboard': return 'Natural and traditional medicine';
      default: return '';
    }
  };

  const getDomainTheme = (domainId: DomainId) => {
    switch (domainId) {
      case 'cliniboard':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-700',
          text: 'text-blue-800 dark:text-blue-300',
          accent: 'bg-blue-600',
          icon: 'text-blue-600'
        };
      case 'eduboard':
        return {
          bg: 'bg-orange-50 dark:bg-orange-900/20',
          border: 'border-orange-200 dark:border-orange-700',
          text: 'text-orange-800 dark:text-orange-300',
          accent: 'bg-orange-600',
          icon: 'text-orange-600'
        };
      case 'remediboard':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-200 dark:border-green-700',
          text: 'text-green-800 dark:text-green-300',
          accent: 'bg-green-600',
          icon: 'text-green-600'
        };
      default:
        return {
          bg: 'bg-neutral-50 dark:bg-neutral-800',
          border: 'border-neutral-200 dark:border-neutral-700',
          text: 'text-neutral-800 dark:text-neutral-300',
          accent: 'bg-neutral-600',
          icon: 'text-neutral-600'
        };
    }
  };

  const generateSummary = () => {
    // Simple summary generation - in a real app, this would use AI
    const domainSummaries = domains.map(domainId => {
      const domainResponses = responsesByDomain[domainId] || [];
      const domainName = getDomainName(domainId);
      
      if (domainResponses.length === 0) return null;
      
      return `**${domainName} Perspective**: ${domainResponses.length} advisor${domainResponses.length !== 1 ? 's' : ''} provided insights focusing on ${getDomainDescription(domainId).toLowerCase()}.`;
    }).filter(Boolean);

    return `## Multi-Domain Consultation Summary

**Question**: ${prompt}

**Advisory Board**: ${selectedAdvisors.length} advisors across ${domains.length} domains

${domainSummaries.join('\n\n')}

**Key Insights**: This multi-domain consultation provides comprehensive perspectives from clinical, educational, and holistic wellness experts, offering a well-rounded approach to your question.`;
  };

  if (viewMode === 'advisors') {
    // Show all responses in a single column, grouped by advisor
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Summary Section */}
        {showSummary && (
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20" padding="lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Consultation Summary</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSummary(false)}
              >
                Hide Summary
              </Button>
            </div>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div className="whitespace-pre-line">{generateSummary()}</div>
            </div>
          </Card>
        )}

        {/* Show Summary Button */}
        {!showSummary && responses.length > 0 && (
          <div className="text-center">
            <Button
              onClick={() => setShowSummary(true)}
              variant="outline"
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            >
              Generate Summary
            </Button>
          </div>
        )}

        {/* Individual Advisor Responses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {selectedAdvisors.map(advisor => {
            const advisorResponses = responses.filter(r => r.advisorId === advisor.id);
            const theme = getDomainTheme(advisor.domain.id);
            
            return (
              <Card key={advisor.id} className={`${theme.border} border-2`} padding="none">
                {/* Advisor Header */}
                <div className={`p-4 ${theme.bg} border-b ${theme.border}`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${theme.accent} rounded-full flex items-center justify-center text-white font-semibold`}>
                      {advisor.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-semibold">{advisor.name}</h4>
                      <p className="text-sm opacity-75">{advisor.expertise}</p>
                      <p className={`text-xs ${theme.text} font-medium`}>
                        {getDomainName(advisor.domain.id)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Response Content */}
                <div className="p-4">
                  {advisorResponses.length > 0 ? (
                    <div className="space-y-4">
                      {advisorResponses.map((response, index) => (
                        <ResponseThread
                          key={`${response.advisorId}-${index}`}
                          response={response}
                          advisor={advisor}
                          showAdvisorInfo={false}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-neutral-500">
                      <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm">Waiting for response...</p>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Domain view mode
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Section */}
      {showSummary && (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20" padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Multi-Domain Consultation Summary</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSummary(false)}
            >
              Hide Summary
            </Button>
          </div>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <div className="whitespace-pre-line">{generateSummary()}</div>
          </div>
        </Card>
      )}

      {/* Show Summary Button */}
      {!showSummary && responses.length > 0 && (
        <div className="text-center">
          <Button
            onClick={() => setShowSummary(true)}
            variant="outline"
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          >
            Generate Multi-Domain Summary
          </Button>
        </div>
      )}

      {/* Domain Sections */}
      {domains.map(domainId => {
        const theme = getDomainTheme(domainId);
        const domainResponses = responsesByDomain[domainId] || [];
        const domainAdvisors = advisorsByDomain[domainId] || [];
        const isExpanded = expandedDomains.has(domainId);
        const hasResponses = domainResponses.length > 0;

        return (
          <Card key={domainId} className={`${theme.border} border-2 overflow-hidden`} padding="none">
            {/* Domain Header */}
            <div
              className={`p-6 cursor-pointer ${theme.bg} border-b ${theme.border}`}
              onClick={() => toggleDomainExpansion(domainId)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 ${theme.accent} rounded-lg flex items-center justify-center`}>
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {domainId === 'cliniboard' ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      ) : domainId === 'eduboard' ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 9h.01M15 9h.01M9 15h.01M15 15h.01" />
                      )}
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{getDomainName(domainId)}</h3>
                    <p className={`text-sm ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                      {getDomainDescription(domainId)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {domainResponses.length}/{domainAdvisors.length} responses
                    </div>
                    {hasResponses && (
                      <div className={`text-xs ${theme.text}`}>
                        {domainAdvisors.length} advisor{domainAdvisors.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                  
                  <svg
                    className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Domain Content */}
            {isExpanded && (
              <div className="p-6">
                {hasResponses ? (
                  <div className="space-y-6">
                    {domainAdvisors.map(advisor => {
                      const advisorResponses = domainResponses.filter(r => r.advisorId === advisor.id);
                      
                      return (
                        <div key={advisor.id} className="border-l-4 border-neutral-200 dark:border-neutral-700 pl-4">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className={`w-8 h-8 ${theme.accent} rounded-full flex items-center justify-center text-white text-sm font-semibold`}>
                              {advisor.name.charAt(0)}
                            </div>
                            <div>
                              <h5 className="font-medium">{advisor.name}</h5>
                              <p className="text-sm opacity-75">{advisor.expertise}</p>
                            </div>
                          </div>
                          
                          {advisorResponses.length > 0 ? (
                            <div className="space-y-3">
                              {advisorResponses.map((response, index) => (
                                <ResponseThread
                                  key={`${response.advisorId}-${index}`}
                                  response={response}
                                  advisor={advisor}
                                  showAdvisorInfo={false}
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-neutral-500">
                              <svg className="w-6 h-6 mx-auto mb-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p className="text-xs">Waiting for response...</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-neutral-500">
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="text-sm">Waiting for responses from {domainAdvisors.length} advisor{domainAdvisors.length !== 1 ? 's' : ''}...</p>
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}