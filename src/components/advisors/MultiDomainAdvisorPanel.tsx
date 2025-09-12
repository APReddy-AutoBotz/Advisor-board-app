import { useState, useEffect } from 'react';
import { yamlConfigLoader } from '../../services';
import type { Domain, Advisor, DomainId } from '../../types/domain';
import AdvisorCard from './AdvisorCard';
import Button from '../common/Button';
import Card from '../common/Card';
import { useTheme } from '../common/ThemeProvider';

interface MultiDomainAdvisorPanelProps {
  onSelectionComplete: (advisors: Advisor[], domains: DomainId[]) => void;
  onBack: () => void;
  className?: string;
}

export default function MultiDomainAdvisorPanel({
  onSelectionComplete,
  onBack,
  className = ''
}: MultiDomainAdvisorPanelProps) {
  const { isDarkMode } = useTheme();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedAdvisors, setSelectedAdvisors] = useState<Advisor[]>([]);
  const [activeDomains, setActiveDomains] = useState<Set<DomainId>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDomains, setExpandedDomains] = useState<Set<DomainId>>(new Set());

  useEffect(() => {
    const loadDomains = async () => {
      try {
        setLoading(true);
        const loadedDomains = await yamlConfigLoader.loadAllDomains();
        setDomains(loadedDomains);
        // Initially expand all domains for multi-domain view
        setExpandedDomains(new Set(loadedDomains.map(d => d.id)));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load domains');
      } finally {
        setLoading(false);
      }
    };

    loadDomains();
  }, []);

  const handleAdvisorToggle = (advisor: Advisor) => {
    setSelectedAdvisors(prev => {
      const isSelected = prev.some(a => a.id === advisor.id);
      const newSelection = isSelected
        ? prev.filter(a => a.id !== advisor.id)
        : [...prev, { ...advisor, isSelected: true }];

      // Update active domains based on selected advisors
      const newActiveDomains = new Set<DomainId>();
      newSelection.forEach(a => newActiveDomains.add(a.domain.id));
      setActiveDomains(newActiveDomains);

      return newSelection;
    });
  };

  const handleDomainToggle = (domainId: DomainId) => {
    const domain = domains.find(d => d.id === domainId);
    if (!domain) return;

    const domainAdvisors = domain.advisors;
    const allDomainAdvisorsSelected = domainAdvisors.every(advisor =>
      selectedAdvisors.some(selected => selected.id === advisor.id)
    );

    if (allDomainAdvisorsSelected) {
      // Deselect all advisors from this domain
      setSelectedAdvisors(prev =>
        prev.filter(advisor => advisor.domain.id !== domainId)
      );
    } else {
      // Select all advisors from this domain
      setSelectedAdvisors(prev => {
        const withoutDomainAdvisors = prev.filter(advisor => advisor.domain.id !== domainId);
        const domainAdvisorsToAdd = domainAdvisors.map(advisor => ({
          ...advisor,
          isSelected: true
        }));
        return [...withoutDomainAdvisors, ...domainAdvisorsToAdd];
      });
    }
  };

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

  const handleContinue = () => {
    if (selectedAdvisors.length > 0) {
      onSelectionComplete(selectedAdvisors, Array.from(activeDomains));
    }
  };

  const getSelectedCountByDomain = (domainId: DomainId) => {
    return selectedAdvisors.filter(advisor => advisor.domain.id === domainId).length;
  };

  const getTotalAdvisorsByDomain = (domainId: DomainId) => {
    const domain = domains.find(d => d.id === domainId);
    return domain?.advisors.length || 0;
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${className}`}>
        <Card className="text-center" padding="xl">
          <div className="animate-pulse space-y-4">
            <div className="w-16 h-16 bg-neutral-200 rounded-full mx-auto"></div>
            <div className="h-4 bg-neutral-200 rounded w-48 mx-auto"></div>
          </div>
          <p className="mt-4 text-neutral-600">Loading all advisory domains...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${className}`}>
        <Card className="text-center max-w-md" padding="xl">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Configuration Error</h3>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry Loading
          </Button>
        </Card>
      </div>
    );
  }

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
              Back to Domain Selection
            </Button>
          </div>

          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Ask All Boards - Mega Mode
            </h1>
            <p className={`text-lg max-w-3xl mx-auto ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
              Select advisors from multiple domains to get comprehensive insights from all areas of expertise.
              Choose individual advisors or entire domain boards.
            </p>
          </div>
        </div>

        {/* Selection Summary */}
        {selectedAdvisors.length > 0 && (
          <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20" padding="lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  Selected Advisory Board ({selectedAdvisors.length} advisors)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {Array.from(activeDomains).map(domainId => {
                    const domain = domains.find(d => d.id === domainId);
                    const count = getSelectedCountByDomain(domainId);
                    return (
                      <span
                        key={domainId}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          domainId === 'cliniboard' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                          domainId === 'eduboard' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                          'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        }`}
                      >
                        {domain?.name}: {count} advisor{count !== 1 ? 's' : ''}
                      </span>
                    );
                  })}
                </div>
              </div>
              <Button
                onClick={handleContinue}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
                rightIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                }
              >
                Start Multi-Domain Consultation
              </Button>
            </div>
          </Card>
        )}

        {/* Domain Sections */}
        <div className="space-y-6">
          {domains.map((domain) => {
            const selectedCount = getSelectedCountByDomain(domain.id);
            const totalCount = getTotalAdvisorsByDomain(domain.id);
            const allSelected = selectedCount === totalCount;
            const isExpanded = expandedDomains.has(domain.id);

            return (
              <Card key={domain.id} className="overflow-hidden" padding="none">
                {/* Domain Header */}
                <div
                  className={`p-6 cursor-pointer transition-colors ${
                    domain.id === 'cliniboard' ? 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30' :
                    domain.id === 'eduboard' ? 'bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30' :
                    'bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30'
                  }`}
                  onClick={() => toggleDomainExpansion(domain.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        domain.id === 'cliniboard' ? 'bg-blue-600' :
                        domain.id === 'eduboard' ? 'bg-orange-600' :
                        'bg-green-600'
                      }`}>
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {domain.id === 'cliniboard' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          ) : domain.id === 'eduboard' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 9h.01M15 9h.01M9 15h.01M15 15h.01" />
                          )}
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{domain.name}</h3>
                        <p className={`text-sm ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                          {domain.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {selectedCount}/{totalCount} selected
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDomainToggle(domain.id);
                          }}
                          className={`mt-1 ${allSelected ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : ''}`}
                        >
                          {allSelected ? 'Deselect All' : 'Select All'}
                        </Button>
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

                {/* Advisor Grid */}
                {isExpanded && (
                  <div className="p-6 pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {domain.advisors.map((advisor) => (
                        <AdvisorCard
                          key={advisor.id}
                          advisor={advisor}
                          isSelected={selectedAdvisors.some(a => a.id === advisor.id)}
                          onToggleSelection={() => handleAdvisorToggle(advisor)}
                          className="h-full"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Bottom Action Bar */}
        {selectedAdvisors.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 p-4 shadow-lg">
            <div className="container mx-auto flex items-center justify-between">
              <div>
                <div className="font-semibold">
                  {selectedAdvisors.length} advisor{selectedAdvisors.length !== 1 ? 's' : ''} selected
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  From {activeDomains.size} domain{activeDomains.size !== 1 ? 's' : ''}
                </div>
              </div>
              <Button
                onClick={handleContinue}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
                rightIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                }
              >
                Start Multi-Domain Consultation
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
