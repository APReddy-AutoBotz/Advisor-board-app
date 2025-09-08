import React from 'react';
import Button from '../common/Button';
import { getCombinedExperience, getTotalExperts, trackEvent } from '../../lib/boards';

interface EnhancedHeroProps {
  onStartSession: () => void;
}

const EnhancedHero: React.FC<EnhancedHeroProps> = ({ onStartSession }) => {
  const handleCTAClick = () => {
    trackEvent('hero_cta_click', { location: 'hero_primary' });
    onStartSession();
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 py-16 sm:py-24">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]" />
      
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Hackathon Winner Badge */}
          <div className="mb-8 inline-flex items-center rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-6 py-2 text-sm font-bold text-white shadow-lg">
            🏆 Built with Kiro • Hackathon Winner • Enterprise Ready
          </div>
          
          {/* Main Headline - Conversion Optimized */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
            Get Expert Advice in
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> 2 Minutes</span>
          </h1>
          
          {/* Value Proposition Subhead */}
          <p className="mb-8 text-xl leading-8 text-gray-600 sm:text-2xl">
            Access former FDA directors, Big Pharma executives, and Silicon Valley product leaders. 
            <span className="font-semibold text-gray-900">No scheduling. No fees. Instant insights.</span>
          </p>
          
          {/* Trust Stats Pills */}
          <div className="mb-10 flex flex-wrap justify-center gap-4 sm:gap-6">
            <StatPill 
              number={getTotalExperts()} 
              label="Expert Advisors" 
              icon="👥" 
            />
            <StatPill 
              number={`${getCombinedExperience()}+`} 
              label="Years Experience" 
              icon="🎯" 
            />
            <StatPill 
              number="$50B+" 
              label="Drug Approvals" 
              icon="💊" 
            />
            <StatPill 
              number="24/7" 
              label="Availability" 
              icon="⚡" 
            />
          </div>
          
          {/* Primary CTA */}
          <div className="mb-8">
            <Button
              onClick={handleCTAClick}
              variant="primary"
              size="lg"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 px-12 py-4 text-lg font-semibold text-white shadow-xl hover:from-blue-700 hover:to-purple-700 focus:ring-4 focus:ring-blue-200 sm:w-auto"
            >
              🚀 Start Your Boardroom Session
            </Button>
          </div>
          
          {/* Trust Ribbon */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>No signup required</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Instant responses</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Professional reports</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Stat Pill Component
interface StatPillProps {
  number: string | number;
  label: string;
  icon: string;
}

const StatPill: React.FC<StatPillProps> = ({ number, label, icon }) => {
  return (
    <div className="flex h-16 min-w-[140px] items-center justify-center rounded-full bg-white px-6 py-3 shadow-lg ring-1 ring-gray-200">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-2xl font-bold text-gray-900">{number}</span>
        </div>
        <div className="text-xs font-medium text-gray-600">{label}</div>
      </div>
    </div>
  );
};

export default EnhancedHero;