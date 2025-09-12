import { useState } from 'react';
import LandingPage from '../landing/LandingPage';
import Button from '../common/Button';
import type { Domain } from '../../types';

export default function LandingDemo() {
  const [showLanding, setShowLanding] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);

  const handleStartSession = (domain: Domain) => {
    setSelectedDomain(domain);
    setShowLanding(false);
  };

  const handleBackToLanding = () => {
    setShowLanding(true);
    setSelectedDomain(null);
  };

  console.log('LandingDemo rendering, showLanding:', showLanding);

  if (showLanding) {
    return (
      <div className="w-full">
        {/* Debug info */}
        <div className="fixed top-20 right-4 bg-red-500 text-white p-2 text-xs z-50">
          LandingDemo Active
        </div>
        {/* Full-width landing page without container constraints */}
        <LandingPage onStartSession={handleStartSession} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
      <div className="text-center max-w-2xl mx-auto p-8 bg-white dark:bg-neutral-800 rounded-lg shadow-lg">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h2 className="text-3xl font-bold mb-4">Session Started!</h2>
          
          <p className="text-lg mb-6">
            You've successfully selected <strong>{selectedDomain?.name}</strong> and would now 
            proceed to the advisor selection panel.
          </p>
          
          <div className="bg-neutral-100 dark:bg-neutral-700 rounded-lg p-4 mb-6">
            <h3 className="font-semibold mb-2">Selected Domain Details:</h3>
            <div className="text-sm space-y-1">
              <div><strong>Name:</strong> {selectedDomain?.name}</div>
              <div><strong>Description:</strong> {selectedDomain?.description}</div>
              <div><strong>Available Advisors:</strong> {selectedDomain?.advisors.length}</div>
            </div>
          </div>
          
          <div className="space-y-3">
            <p className="text-sm opacity-75">
              In the actual application, this would navigate to the advisor selection panel 
              where you can choose specific experts from this domain.
            </p>
            
            <Button onClick={handleBackToLanding} variant="outline">
              â† Back to Landing Page
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
