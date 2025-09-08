import React, { useState, useRef } from 'react';
import { useTheme } from '../common/ThemeProvider';
import Button from '../common/Button';
import Card from '../common/Card';
import DarkModeToggle from '../common/DarkModeToggle';
import PremiumHero from './PremiumHero';
import PremiumBoardPicker from './PremiumBoardPicker';
import StickyLiveDemo from './StickyLiveDemo';
import PersonaStrip from './PersonaStrip';
import MegaMode from './MegaMode';
import FeatureShowcase from './FeatureShowcase';
import AIAdvisorShowcase from './AIAdvisorShowcase';
import ComplianceFooter from '../common/ComplianceFooter';
import { trackEvent } from '../../lib/boards';
import type { Domain } from '../../types/domain';

interface LandingPageProps {
  onStartSession?: (domain: Domain) => void;
  onStartMultiDomainSession?: () => void;
  className?: string;
}

export default function LandingPage({ onStartSession, onStartMultiDomainSession, className = '' }: LandingPageProps) {
  const { isDarkMode } = useTheme();
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const domainSectionRef = useRef<HTMLDivElement>(null);

  const handleMegaConsultation = () => {
    trackEvent('mega_cta_click', { location: 'hero_mega' });
    if (onStartMultiDomainSession) {
      onStartMultiDomainSession();
    }
  };

  const handleStartSession = () => {
    trackEvent('hero_cta_click', { location: 'hero_primary' });
    domainSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePremiumBoardSelect = (domain: Domain) => {
    trackEvent('board_card_open', { board_id: domain.id, board_title: domain.name });
    setSelectedDomain(domain);
    if (onStartSession) {
      onStartSession(domain);
    }
  };

  return (
    <div className={`min-h-screen ${className}`}>
      {/* Dark Mode Toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50">
        <DarkModeToggle />
      </div>

      {/* Premium Hero Section */}
      <PremiumHero onStartSession={handleStartSession} />

      {/* Sticky Live Demo */}
      <StickyLiveDemo />
      
      {/* Persona Strip */}
      <PersonaStrip />
      
      {/* Premium Board Picker */}
      <div ref={domainSectionRef} data-board-picker>
        <PremiumBoardPicker onBoardSelect={handlePremiumBoardSelect} />
      </div>
      
      {/* Mega Mode */}
      <MegaMode />

      {/* AI-Advisor Gallery Showcase */}
      <AIAdvisorShowcase />

      {/* Feature Showcase - 3-up + FAQ */}
      <FeatureShowcase />

      {/* Legacy compatibility - keep for fallback */}
      {selectedDomain && (
        <section className="py-16 bg-white dark:bg-neutral-900">
          <div className="container mx-auto px-4">
            <Card className="text-center animate-fade-in glow-blue max-w-2xl mx-auto" padding="xl">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h3 className="text-2xl font-bold mb-4">
                Ready to consult with {selectedDomain.name}?
              </h3>
              
              <p className={`
                text-base mb-6 leading-relaxed
                ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}
              `}>
                You've selected <strong>{selectedDomain.name}</strong> with {selectedDomain.advisors.length} expert advisors. 
                Click below to start your boardroom session and get personalized insights.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                <Button
                  size="lg"
                  onClick={() => onStartSession && onStartSession(selectedDomain)}
                  className={`
                    min-w-[200px] glow-orange
                    ${isDarkMode 
                      ? 'bg-white text-gray-900 hover:bg-gray-100' 
                      : 'bg-orange-500 text-white hover:bg-orange-600'
                    }
                  `}
                >
                  Start Your Boardroom Session
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={() => setSelectedDomain(null)}
                  className="text-sm"
                >
                  Choose Different Domain
                </Button>
              </div>
            </Card>
          </div>
        </section>
      )}
      {/* Benefits Row - Domain-Aware */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Domain-Specific Value
            </h2>
            <p className="mt-4 text-lg leading-8 text-gray-600">
              Each board delivers specialized insights tailored to your domain
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <BenefitCard
              title="Product"
              description="Scope, effort, and launch risks in one sheet."
              icon="🚀"
              color="indigo"
            />
            <BenefitCard
              title="Clinical"
              description="Reg & safety flags in plain English."
              icon="🏥"
              color="blue"
            />
            <BenefitCard
              title="Edu"
              description="Outcome-aligned lesson tweaks, fast."
              icon="📚"
              color="violet"
            />
            <BenefitCard
              title="Remedy"
              description="Diet & routine first—no medical claims."
              icon="🌿"
              color="emerald"
            />
          </div>
        </div>
      </section>

      {/* Compliance Footer */}
      <ComplianceFooter />
    </div>
  );
}



// BenefitCard Component
interface BenefitCardProps {
  title: string;
  description: string;
  icon: string;
  color: string;
}

const BenefitCard: React.FC<BenefitCardProps> = ({ title, description, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-900',
    violet: 'bg-violet-50 border-violet-200 text-violet-900',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-900'
  };

  return (
    <div className={`rounded-2xl border-2 p-6 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-sm leading-relaxed">{description}</p>
    </div>
  );
};