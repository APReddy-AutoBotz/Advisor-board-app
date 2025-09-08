import React, { useState, useRef } from 'react';
import { useTheme } from '../common/ThemeProvider';
import Button from '../common/Button';
import Card from '../common/Card';
import DarkModeToggle from '../common/DarkModeToggle';
import PremiumHero from './PremiumHero';
import PremiumBoardPicker from './PremiumBoardPicker';
import { trackEvent } from '../../lib/boards';
import type { Domain } from '../../types/domain';

interface SimpleLandingPageProps {
  onStartSession?: (domain: Domain) => void;
  onStartMultiDomainSession?: () => void;
  className?: string;
}

export default function SimpleLandingPage({ onStartSession, onStartMultiDomainSession, className = '' }: SimpleLandingPageProps) {
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
      
      {/* Premium Board Picker */}
      <div ref={domainSectionRef} data-board-picker>
        <PremiumBoardPicker onBoardSelect={handlePremiumBoardSelect} />
      </div>

      {/* Simple Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © 2024 AdvisorBoard. AI-powered advisory consultations.
          </p>
          <p className="text-sm text-yellow-300 mt-2">
            🤖 AI-generated content for educational purposes only.
          </p>
        </div>
      </footer>
    </div>
  );
}