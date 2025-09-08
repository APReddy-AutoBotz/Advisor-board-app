/**
 * Static Summary Card Component
 * 
 * Displays synthesized topline summary after advisor responses
 * Features premium styling and delayed reveal animation
 */

import React, { useState, useEffect } from 'react';
import type { StaticDemoSummary } from '../../data/sampleDemoData';

export interface StaticSummaryCardProps {
  summary: StaticDemoSummary;
  isVisible?: boolean;
  className?: string;
}

export const StaticSummaryCard: React.FC<StaticSummaryCardProps> = ({
  summary,
  isVisible = false,
  className = ''
}) => {
  const [shouldAnimate, setShouldAnimate] = useState(false);
  
  // Trigger animation after delay
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setShouldAnimate(true);
      }, summary.delay);
      
      return () => clearTimeout(timer);
    } else {
      setShouldAnimate(false);
    }
  }, [isVisible, summary.delay]);

  const cardClasses = [
    'summary-card premium-card',
    'relative overflow-hidden',
    'bg-gradient-to-br from-white/95 to-slate-50/95',
    'backdrop-blur-sm',
    'border border-blue-200/30',
    'rounded-xl p-6',
    'transition-all duration-300 ease-out',
    'focus-ring',
    shouldAnimate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5',
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={cardClasses}
      style={{
        transitionDelay: shouldAnimate ? '0ms' : `${summary.delay}ms`
      }}
    >
      {/* Premium Accent Gradient */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500" />
      
      {/* Summary Icon and Title */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {summary.title}
          </h3>
          <p className="text-sm text-gray-600">
            Multi-perspective synthesis
          </p>
        </div>
      </div>
      
      {/* Summary Content */}
      <div className="space-y-3">
        <p className="text-gray-700 leading-relaxed">
          {summary.content}
        </p>
      </div>
      
      {/* Key Insights Badge */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            ✨ AI-Generated Summary
          </span>
          
          <div className="text-xs text-gray-500">
            Synthesized from expert perspectives
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaticSummaryCard;