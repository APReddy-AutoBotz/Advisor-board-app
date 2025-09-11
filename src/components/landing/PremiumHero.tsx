/**
 * Premium Hero Section - Live Demo Panel Layout
 * Enhanced with right-side demo panel and premium interactions
 */

import React, { lazy, Suspense } from 'react';
import Button from '../common/Button';
import { trackEvent } from '../../lib/boards';
import { useEntranceAnimations } from '../../utils/animationObserver';
import '../../styles/premium-hero.css';

// Lazy load demo input for better performance
const DemoInput = lazy(() => import('../demo/DemoInput'));

interface PremiumHeroProps {
  onStartSession: () => void;
  onStartMultiDomainSession?: () => void;
  className?: string;
}

interface StatPillProps {
  icon: string;
  value: string;
  label: string;
}

const StatPill: React.FC<StatPillProps> = ({ icon, value, label }) => {
  return (
    <div className="premium-stat-pill inline-flex items-center gap-1 text-xs rounded-full px-3 py-1.5 hover:scale-105 transition-transform duration-200">
      <span className="text-sm">{icon}</span>
      <span className="font-bold text-gray-800">{value}</span>
      <span className="opacity-75 text-gray-600">{label}</span>
    </div>
  );
};

interface LiveDemoPanelProps {
  onStartSession: () => void;
}

const LiveDemoPanel: React.FC<LiveDemoPanelProps> = ({ onStartSession }) => {
  return (
    <div className="glass-hero p-6 max-w-[480px]">
      <Suspense fallback={
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-10 bg-gray-200 rounded-lg"></div>
        </div>
      }>
        <DemoInput 
          onStartSession={onStartSession}
          variant="hero"
          className="w-full"
        />
        <div className="text-xs opacity-75 truncate mt-2">
          AI-powered advisory consultation platform
        </div>
      </Suspense>
    </div>
  );
};

const PremiumHero: React.FC<PremiumHeroProps> = ({ onStartSession, onStartMultiDomainSession }) => {
  // Initialize entrance animations
  useEntranceAnimations();

  const handleCTAClick = () => {
    trackEvent('hero_cta_click', { location: 'hero_primary' });
    onStartSession();
  };

  const handleMultiBoardClick = () => {
    trackEvent('multi_board_cta_click', { location: 'hero_banner' });
    // Navigate to multi-board consultation
    if (onStartMultiDomainSession) {
      onStartMultiDomainSession();
    } else {
      // Fallback: trigger regular session
      onStartSession();
    }
  };

  return (
    <>
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http://www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
      <div className="relative z-10 w-full max-w-[1200px] mx-auto px-6 py-20">
        <div className="grid xl:grid-cols-12 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column - Hero Content */}
          <div className="xl:col-span-7 lg:col-span-6 text-center lg:text-left">
            {/* Premium Trust Ribbon */}
            <div className="observe-entrance stagger-1 mb-8 premium-trust-ribbon inline-flex items-center rounded-full px-6 py-3 text-sm font-bold text-white transform hover:scale-105 transition-all duration-300 relative">
              <span className="mr-2">🚀</span>
              Built with Kiro • AI-Powered • Enterprise Ready
            </div>
            
            {/* Main headline with premium gradient */}
            <h1 className="observe-entrance stagger-2 text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              <span className="text-gray-900">Ask the </span>
              <span className="premium-gradient-text">
                Right Board.
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-700 bg-clip-text text-transparent">
                Get the Best Answer.
              </span>
            </h1>
            
            {/* Sub-headline - ≤30 words */}
            <p className="observe-entrance stagger-3 mt-3 text-lg leading-7 text-gray-600 sm:text-xl sm:leading-8 max-w-[65ch]">
              Multi-expert AI advice across Clinical, Product, Education, and Wellness boards—structured, fast, audit-friendly.
            </p>
            
            {/* Enhanced Stat Pills - More impactful metrics */}
            <div className="observe-entrance stagger-4 mt-4 flex flex-wrap gap-2">
              <StatPill 
                icon="⚡" 
                value="2-min" 
                label="setup" 
              />
              <StatPill 
                icon="🎯" 
                value="4x" 
                label="faster" 
              />
              <StatPill 
                icon="🧠" 
                value="50+" 
                label="experts" 
              />
            </div>
            
            {/* Enhanced Primary CTA */}
            <div className="observe-entrance stagger-5 mt-6 flex flex-col sm:flex-row gap-3 items-center lg:items-start">
              <Button
                onClick={handleCTAClick}
                variant="primary"
                size="lg"
                className="btn-premium px-8 py-4 text-lg font-semibold shadow-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 motion-safe:hover:-translate-y-0.5 transition-transform focus:outline-2 focus:outline-offset-2 focus:outline-blue-600"
              >
                Start Your Boardroom Session
              </Button>
              <Button
                onClick={() => {
                  const boardsSection = document.querySelector('[data-board-picker]');
                  boardsSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                variant="outline"
                size="lg"
                className="px-8 py-4 text-lg font-semibold border-2 hover:bg-gray-50 motion-safe:hover:-translate-y-0.5 transition-transform focus:outline-2 focus:outline-offset-2 focus:outline-gray-600"
              >
                See All Boards
              </Button>
            </div>
          </div>

          {/* Right Column - Live Demo */}
          <div className="xl:col-span-5 lg:col-span-6 relative">
            <div className="max-w-[480px] lg:max-w-none">
              <LiveDemoPanel onStartSession={onStartSession} />
            </div>
          </div>
        </div>
        
        {/* Metrics Row */}
        <div className="xl:col-span-7 lg:col-span-6 mt-8">
          <div className="flex gap-6 items-center text-sm opacity-80">
            <span>Trusted by 500+ organizations</span>
            <span>•</span>
            <span>99.9% uptime</span>
            <span>•</span>
            <span>SOC 2 compliant</span>
          </div>
        </div>

      </div>
    </section>
    {/* Multi-Board CTA Section - Premium Banner */}
    <section className="premium-multi-board-banner py-12 relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-20 animate-pulse bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
      
      <div className="max-w-[1200px] mx-auto px-6 text-center relative z-10">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-white mb-3">
            🌟 Multi-Board Consultation
          </h2>
          <p className="text-xl text-emerald-50 max-w-2xl mx-auto">
            Get coordinated advice from multiple expert boards simultaneously
          </p>
        </div>
        
        <button
          onClick={handleMultiBoardClick}
          className="premium-cta-button inline-flex items-center gap-4 px-8 py-4 text-emerald-600 rounded-full font-bold text-lg focus:outline-2 focus:outline-offset-2 focus:outline-white"
        >
          <span className="text-2xl">🚀</span>
          <span>Try Multi-Board Consultation</span>
          <span className="text-xl">→</span>
        </button>
        
        <div className="mt-6 flex justify-center items-center gap-8 text-emerald-100 text-sm">
          <div className="flex items-center gap-2">
            <span className="premium-pulse-dot w-2 h-2 bg-emerald-200 rounded-full"></span>
            <span>4 Expert Boards</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="premium-pulse-dot w-2 h-2 bg-emerald-200 rounded-full"></span>
            <span>Coordinated Responses</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="premium-pulse-dot w-2 h-2 bg-emerald-200 rounded-full"></span>
            <span>Unified Insights</span>
          </div>
        </div>
      </div>
    </section>
    </>
  );
};

export default PremiumHero;