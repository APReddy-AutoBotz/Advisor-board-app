import { useState, useEffect } from 'react';
import { useAdvisorPersonas } from '../../hooks/useAdvisorPersonas';
import { useSessionState } from '../../hooks/useSessionState';
import type { Advisor, AdvisorResponse, DomainId } from '../../types/domain';
import type { MultiDomainSession } from '../../types/session';
import PromptInput from './PromptInput';
import Button from '../common/Button';
import Card from '../common/Card';
import { useTheme } from '../common/ThemeProvider';
import MultiDomainResponsePanel from './MultiDomainResponsePanel';

interface MultiDomainConsultationInterfaceProps {
  selectedAdvisors: Advisor[];
  domains: DomainId[];
  onBack: () => void;
  onSessionComplete?: (session: MultiDomainSession) => void;
  className?: string;
}

export default function MultiDomainConsultationInterface({
  selectedAdvisors,
  domains,
  onBack,
  onSessionComplete,
  className = ''
}: MultiDomainConsultationInterfaceProps) {
  const { isDarkMode } = useTheme();
  const { submitPrompt, responses, isLoading, error } = useAdvisorPersonas(selectedAdvisors);
  const { createSession, updateSession } = useSessionState();
  
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [currentSession, setCurrentSession] = useState<MultiDomainSession | null>(null);
  const [activeFilter, setActiveFilter] = useState<DomainId | 'all'>('all');
  const [viewMode, setViewMode] = useState<'domains' | 'advisors'>('domains');

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

  const handlePromptSubmit = async (prompt: string) => {
    setCurrentPrompt(prompt);
    
    // Create or update session
    const sessionData: MultiDomainSession = {
      id: currentSession?.id || `multi-${Date.now()}`,
      selectedAdvisors,
      prompt,
      responses: [],
      timestamp: new Date(),
      isMultiDomain: true,
      domains,
      responsesByDomain: {}
    };

    if (!currentSession) {
      const newSession = await createSession(sessionData);
      setCurrentSession(newSession as MultiDomainSession);
    }

    try {
      await submitPrompt(prompt);
    } catch (err) {
      console.error('Error submitting prompt:', err);
    }
  };

  // Update session when responses change
  useEffect(() => {
    if (currentSession && responses.length > 0) {
      const updatedSession: MultiDomainSession = {
        ...currentSession,
        responses,
        responsesByDomain
      };
      setCurrentSession(updatedSession);
      updateSession(updatedSession);
      
      if (onSessionComplete) {
        onSessionComplete(updatedSession);
      }
    }
  }, [responses, currentSession, responsesByDomain, updateSession, onSessionComplete]);

  const getDomainName = (domainId: DomainId): string => {
    switch (domainId) {
      case 'cliniboard': return 'Cliniboard';
      case 'eduboard': return 'EduBoard';
      case 'remediboard': return 'RemediBoard';
      default: return domainId;
    }
  };

  const getDomainTheme = (domainId: DomainId) => {
    switch (domainId) {
      case 'cliniboard':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-700',
          text: 'text-blue-800 dark:text-blue-300',
          button: 'bg-blue-600 hover:bg-blue-700'
        };
      case 'eduboard':
        return {
          bg: 'bg-orange-50 dark:bg-orange-900/20',
          border: 'border-orange-200 dark:border-orange-700',
          text: 'text-orange-800 dark:text-orange-300',
          button: 'bg-orange-600 hover:bg-orange-700'
        };
      case 'remediboard':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-200 dark:border-green-700',
          text: 'text-green-800 dark:text-green-300',
          button: 'bg-green-600 hover:bg-green-700'
        };
      default:
        return {
          bg: 'bg-neutral-50 dark:bg-neutral-800',
          border: 'border-neutral-200 dark:border-neutral-700',
          text: 'text-neutral-800 dark:text-neutral-300',
          button: 'bg-neutral-600 hover:bg-neutral-700'
        };
    }
  };

  const filteredDomains = activeFilter === 'all' ? domains : [activeFilter];
  const hasResponses = responses.length > 0;

  return (
    <div className={`min-h-screen bg-neutral-50 dark:bg-neutral-900 ${className}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={onBack}
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              }
            >
              Back to Advisor Selection
            </Button>
          </div>

          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Multi-Domain Advisory Session
            </h1>
            <p className={`text-lg max-w-3xl mx-auto ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
              Consulting with {selectedAdvisors.length} advisors across {domains.length} domains
            </p>
          </div>
        </div>

        {/* Advisory Board Summary */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20" padding="lg">
          <h3 className="font-semibold text-lg mb-4">Your Multi-Domain Advisory Board</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {domains.map(domainId => {
              const domainAdvisors = advisorsByDomain[domainId] || [];
              const theme = getDomainTheme(domainId);
              
              return (
                <div key={domainId} className={`p-4 rounded-lg border ${theme.bg} ${theme.border}`}>
                  <h4 className={`font-medium mb-2 ${theme.text}`}>
                    {getDomainName(domainId)}
                  </h4>
                  <div className="space-y-1">
                    {domainAdvisors.map(advisor => (
                      <div key={advisor.id} className="text-sm opacity-75">
                        {advisor.name} - {advisor.expertise}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Prompt Input */}
        <Card className="mb-8" padding="lg">
          <PromptInput
            onSubmit={handlePromptSubmit}
            isLoading={isLoading}
            placeholder="Ask your question to all selected advisory boards..."
            disabled={selectedAdvisors.length === 0}
          />
          
          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-700 dark:text-red-300">{error}</span>
              </div>
            </div>
          )}
        </Card>

        {/* Response Controls */}
        {hasResponses && (
          <Card className="mb-6" padding="lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* View Mode Toggle */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">View by:</span>
                <div className="flex bg-neutral-100 dark:bg-neutral-700 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('domains')}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      viewMode === 'domains'
                        ? 'bg-white dark:bg-neutral-600 shadow-sm'
                        : 'text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    Domains
                  </button>
                  <button
                    onClick={() => setViewMode('advisors')}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      viewMode === 'advisors'
                        ? 'bg-white dark:bg-neutral-600 shadow-sm'
                        : 'text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    Advisors
                  </button>
                </div>
              </div>

              {/* Domain Filter */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Filter:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveFilter('all')}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      activeFilter === 'all'
                        ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-800'
                        : 'bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-600'
                    }`}
                  >
                    All Domains
                  </button>
                  {domains.map(domainId => {
                    const theme = getDomainTheme(domainId);
                    return (
                      <button
                        key={domainId}
                        onClick={() => setActiveFilter(domainId)}
                        className={`px-3 py-1 text-sm rounded-full transition-colors ${
                          activeFilter === domainId
                            ? `${theme.button} text-white`
                            : `${theme.bg} ${theme.text} hover:opacity-80`
                        }`}
                      >
                        {getDomainName(domainId)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Responses */}
        {hasResponses && (
          <MultiDomainResponsePanel
            responses={responses}
            selectedAdvisors={selectedAdvisors}
            domains={filteredDomains}
            viewMode={viewMode}
            prompt={currentPrompt}
          />
        )}

        {/* Loading State */}
        {isLoading && (
          <Card className="text-center" padding="xl">
            <div className="animate-pulse space-y-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mx-auto flex items-center justify-center">
                <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-neutral-200 rounded w-64 mx-auto"></div>
                <div className="h-3 bg-neutral-200 rounded w-48 mx-auto"></div>
              </div>
            </div>
            <p className="mt-4 text-neutral-600">
              Consulting with {selectedAdvisors.length} advisors across {domains.length} domains...
            </p>
          </Card>
        )}

        {/* Empty State */}
        {!hasResponses && !isLoading && (
          <Card className="text-center" padding="xl">
            <div className="text-neutral-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Ready for Multi-Domain Consultation</h3>
            <p className={`max-w-md mx-auto ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
              Ask your question above to get insights from all {selectedAdvisors.length} selected advisors 
              across {domains.length} different domains of expertise.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
