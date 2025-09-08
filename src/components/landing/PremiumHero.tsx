/**
 * Premium Hero Section - Live Demo Panel Layout
 * Enhanced with right-side demo panel and premium interactions
 */

import React, { useEffect } from 'react';
import Button from '../common/Button';
import DemoInput from '../demo/DemoInput';
import { trackEvent } from '../../lib/boards';
import { useEntranceAnimations } from '../../utils/animationObserver';

interface PremiumHeroProps {
  onStartSession: () => void;
  className?: string;
}

interface StatPillProps {
  icon: string;
  value: string;
  label: string;
}

const StatPill: React.FC<StatPillProps> = ({ icon, value, label }) => {
  return (
    <div className="premium-card micro-lift flex h-16 min-w-[140px] items-center justify-center rounded-full bg-white px-6 py-3 shadow-card ring-1 ring-ink-200">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-2xl font-bold text-ink-900">{value}</span>
        </div>
        <div className="text-xs font-medium text-ink-600">{label}</div>
      </div>
    </div>
  );
};

interface LiveDemoPanelProps {
  onStartSession: () => void;
}

const LiveDemoPanel: React.FC<LiveDemoPanelProps> = ({ onStartSession }) => {
  return (
    <div className="demo-input-card rounded-2xl p-6 bg-white/95 backdrop-blur-sm border border-white/20">
      <DemoInput 
        onStartSession={onStartSession}
        variant="hero"
        className="w-full"
      />
    </div>
  );
};

const PremiumHero: React.FC<PremiumHeroProps> = ({ onStartSession, className = '' }) => {
  // Initialize entrance animations
  useEntranceAnimations();

  const handleCTAClick = () => {
    trackEvent('hero_cta_click', { location: 'hero_primary' });
    onStartSession();
  };

  return (
    <section className={`relative overflow-hidden hero-gradient py-16 sm:py-24 ${className}`}>
      {/* Ultra-soft Gradient Background with Grain Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.08] mix-blend-overlay"
        style={{ 
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.08\'/%3E%3C/svg%3E")',
          background: 'linear-gradient(135deg, #f8fafc 0%, rgba(59, 130, 246, 0.06) 50%, rgba(147, 51, 234, 0.04) 100%)'
        }}
      />
      
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* CSS Grid Layout: 60/40 split on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-5 lg:gap-16 items-start">
          
          {/* Left Column: Hero Content (60% on desktop) */}
          <div className="lg:col-span-3 hero-stagger">
            {/* Trust Ribbon */}
            <div className="observe-entrance stagger-1 mb-8 inline-flex items-center rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-6 py-2 text-sm font-bold text-white shadow-lg micro-glow">
              🚀 Built with Kiro • AI-Powered • Enterprise Ready
            </div>
            
            {/* Main Headline - Typography: H1 48/56 desktop, 36/44 mobile, ≤12 words */}
            <h1 className="observe-entrance stagger-2 mb-6 text-4xl font-bold tracking-tight text-ink-900 leading-tight sm:text-5xl lg:text-6xl lg:leading-[56px] max-w-[12ch]">
              Ask the Right Board.
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Get the Best Answer.</span>
            </h1>
            
            {/* Sub-headline - ≤30 words */}
            <p className="observe-entrance stagger-3 mb-8 text-lg leading-7 text-ink-600 sm:text-xl sm:leading-8 max-w-prose">
              One prompt → multi-expert advice across Clinical, Product, Education, and Holistic Wellness—
              <span className="font-semibold text-ink-900">structured, fast, and audit-friendly.</span>
            </p>
            
            {/* Stat Pills - Exactly 3 pills */}
            <div className="observe-entrance stagger-4 mb-10 flex flex-wrap gap-4 sm:gap-6">
              <StatPill 
                icon="⏱️" 
                value="2-min" 
                label="avg" 
              />
              <StatPill 
                icon="💰" 
                value="90%" 
                label="cost cut" 
              />
              <StatPill 
                icon="🌐" 
                value="24/7" 
                label="access" 
              />
            </div>
            
            {/* Primary CTA */}
            <div className="observe-entrance stagger-5 mb-8">
              <Button
                onClick={handleCTAClick}
                variant="primary"
                size="lg"
                className="btn-premium w-full px-8 py-4 text-lg font-semibold shadow-xl sm:w-auto"
              >
                🚀 Start Your Boardroom Session
              </Button>
            </div>
            
            {/* Social Proof / Trust Indicators */}
            <div className="flex flex-wrap gap-8 text-center opacity-75">
              <div>
                <div className="text-2xl font-bold text-ink-900">4</div>
                <div className="text-sm text-ink-600">Expert Boards</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-ink-900">50+</div>
                <div className="text-sm text-ink-600">AI Advisors</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-ink-900">360°</div>
                <div className="text-sm text-ink-600">Perspective</div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Demo Panel (40% on desktop) */}
          <div className="lg:col-span-2">
            <div className="sticky top-8">
              <div className="mb-4 text-center lg:text-left">
                <h2 className="text-xl font-semibold text-ink-900 mb-2">Try It Live</h2>
                <p className="text-sm text-ink-600">See multi-expert AI advice in action</p>
              </div>
              <LiveDemoPanel onStartSession={onStartSession} />
            </div>
          </div>

        </div>
      </div>
      
      {/* Background Decoration */}
      <div className="absolute left-1/2 top-0 -z-10 -translate-x-1/2 blur-3xl xl:-top-6" aria-hidden="true">
        <div
          className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20"
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
        />
      </div>
    </section>
  );
};

export default PremiumHero;