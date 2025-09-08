import './App.css'
import './styles/premium-enhancements.css'
import { useState, useEffect } from 'react'
import ThemeProvider from './components/common/ThemeProvider'
import ErrorBoundary from './components/common/ErrorBoundary'
import DisclaimerBanner from './components/common/DisclaimerBanner'
import SimpleLandingPage from './components/landing/SimpleLandingPage'
import AdvisorSelectionPanel from './components/advisors/AdvisorSelectionPanel'
import ConsultationInterface from './components/consultation/ConsultationInterface'
import type { Domain, Advisor } from './types/domain'
import type { ConsultationSession } from './types/session'

type AppView = 'landing' | 'advisor-selection' | 'consultation';

// Simple URL-based navigation to preserve state on refresh
const getViewFromURL = (): AppView => {
  const path = window.location.pathname;
  if (path.includes('/consultation')) return 'consultation';
  if (path.includes('/advisors')) return 'advisor-selection';
  return 'landing';
};

const updateURL = (view: AppView, domainId?: string) => {
  let path = '/';
  if (view === 'advisor-selection' && domainId) {
    path = `/advisors/${domainId}`;
  } else if (view === 'consultation' && domainId) {
    path = `/consultation/${domainId}`;
  }
  window.history.pushState({}, '', path);
};

function App() {
  const [currentView, setCurrentView] = useState<AppView>(getViewFromURL());
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [selectedAdvisors, setSelectedAdvisors] = useState<Advisor[]>([]);
  const [currentSession, setCurrentSession] = useState<ConsultationSession | null>(null);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentView(getViewFromURL());
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Restore domain and advisors from sessionStorage on refresh
  useEffect(() => {
    const savedDomain = sessionStorage.getItem('selectedDomain');
    const savedAdvisors = sessionStorage.getItem('selectedAdvisors');
    
    if (savedDomain) {
      try {
        setSelectedDomain(JSON.parse(savedDomain));
      } catch (e) {
        console.warn('Failed to restore domain from sessionStorage');
      }
    }
    
    if (savedAdvisors) {
      try {
        setSelectedAdvisors(JSON.parse(savedAdvisors));
      } catch (e) {
        console.warn('Failed to restore advisors from sessionStorage');
      }
    }
  }, []);

  // Save state to sessionStorage when it changes
  useEffect(() => {
    if (selectedDomain) {
      sessionStorage.setItem('selectedDomain', JSON.stringify(selectedDomain));
    } else {
      sessionStorage.removeItem('selectedDomain');
    }
  }, [selectedDomain]);

  useEffect(() => {
    if (selectedAdvisors.length > 0) {
      sessionStorage.setItem('selectedAdvisors', JSON.stringify(selectedAdvisors));
    } else {
      sessionStorage.removeItem('selectedAdvisors');
    }
  }, [selectedAdvisors]);

  const handleDomainSelect = (domain: Domain) => {
    setSelectedDomain(domain);
    setCurrentView('advisor-selection');
    updateURL('advisor-selection', domain.id);
  };

  const handleMultiDomainStart = () => {
    // For now, show alert - can implement later
    alert('Multi-domain mode coming soon! For now, try selecting a single domain.');
  };

  const handleAdvisorSelectionComplete = (advisors: Advisor[]) => {
    setSelectedAdvisors(advisors);
    setCurrentView('consultation');
    updateURL('consultation', selectedDomain?.id);
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
    setSelectedDomain(null);
    setSelectedAdvisors([]);
    setCurrentSession(null);
    updateURL('landing');
    
    // Clear sessionStorage
    sessionStorage.removeItem('selectedDomain');
    sessionStorage.removeItem('selectedAdvisors');
    
    // Scroll to domains section after a brief delay to ensure DOM is ready
    setTimeout(() => {
      const domainsSection = document.querySelector('[data-board-picker]');
      if (domainsSection) {
        domainsSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleBackToAdvisorSelection = () => {
    setCurrentView('advisor-selection');
    setSelectedAdvisors([]);
    setCurrentSession(null);
    updateURL('advisor-selection', selectedDomain?.id);
    
    // Clear advisors from sessionStorage
    sessionStorage.removeItem('selectedAdvisors');
  };

  const handleSessionComplete = (session: ConsultationSession) => {
    setCurrentSession(session);
  };

  return (
    <ErrorBoundary>
      <ThemeProvider>
        {/* Landing Page */}
        {currentView === 'landing' && (
          <SimpleLandingPage 
            onStartSession={handleDomainSelect}
            onStartMultiDomainSession={handleMultiDomainStart}
          />
        )}
        
        {/* Advisor Selection */}
        {currentView === 'advisor-selection' && selectedDomain && (
          <div className="min-h-screen bg-gray-50">
            {/* Medical/Legal Disclaimer Banner */}
            <DisclaimerBanner domainId={selectedDomain.id} />
            
            <AdvisorSelectionPanel
              domain={selectedDomain}
              onAdvisorSelect={setSelectedAdvisors}
              onProceed={(advisors: Advisor[]) => {
                console.log('🔄 App onProceed called with advisors:', advisors.map(a => a.name));
                if (advisors.length > 0) {
                  handleAdvisorSelectionComplete(advisors);
                } else {
                  console.warn('⚠️ No advisors provided, cannot proceed to consultation');
                }
              }}
              onBack={handleBackToLanding}
              selectedAdvisors={selectedAdvisors}
            />
          </div>
        )}
        
        {/* Consultation Interface */}
        {currentView === 'consultation' && selectedAdvisors.length > 0 && selectedDomain && (
          <div className="min-h-screen bg-gray-50">
            {/* Medical/Legal Disclaimer Banner */}
            <DisclaimerBanner domainId={selectedDomain.id} />
            
            <ConsultationInterface
              selectedAdvisors={selectedAdvisors}
              domain={selectedDomain}
              onBack={handleBackToAdvisorSelection}
              onComplete={handleSessionComplete}
            />
          </div>
        )}
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App
