/**
 * Static Advisor Response Card Component
 * 
 * Displays hardcoded advisor responses for premium landing demo
 * Features board-specific theming, equal heights, and smooth reveal animations
 */

import React, { useState, useEffect } from 'react';
import { getBoardTheme } from '../../lib/boardThemes';
import { BOARD_THEMES } from '../../lib/designTokens';
import type { StaticAdvisorResponse } from '../../data/sampleDemoData';

export interface StaticAdvisorResponseCardProps {
  advisor: StaticAdvisorResponse;
  isVisible?: boolean;
  className?: string;
}

export const StaticAdvisorResponseCard: React.FC<StaticAdvisorResponseCardProps> = ({
  advisor,
  isVisible = false,
  className = ''
}) => {
  const [shouldAnimate, setShouldAnimate] = useState(false);
  
  // Get board theme for styling
  const boardTheme = BOARD_THEMES[advisor.boardId];
  
  // Trigger animation after delay
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setShouldAnimate(true);
      }, advisor.delay);
      
      return () => clearTimeout(timer);
    } else {
      setShouldAnimate(false);
    }
  }, [isVisible, advisor.delay]);

  // Board-specific styling with premium micro-interactions
  const cardClasses = [
    'premium-card advisor-card micro-lift-strong',
    `card-${advisor.boardId}`,
    'relative overflow-hidden',
    'bg-white/90 backdrop-blur-sm',
    'border border-white/20',
    'rounded-xl p-6',
    'transition-all duration-300 ease-out',
    'focus-ring interactive-element',
    shouldAnimate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5',
    className
  ].filter(Boolean).join(' ');

  // Get avatar placeholder based on board theme
  const getAvatarPlaceholder = () => {
    const initials = advisor.name.split(' ').map(n => n[0]).join('');
    return (
      <div 
        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-lg"
        style={{ backgroundColor: boardTheme.accent }}
      >
        {initials}
      </div>
    );
  };

  return (
    <div 
      className={cardClasses}
      style={{
        transitionDelay: shouldAnimate ? '0ms' : `${advisor.delay}ms`
      }}
    >
      {/* Board Theme Accent Bar */}
      <div 
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: boardTheme.accent }}
      />
      
      {/* Header with Avatar and Advisor Info */}
      <div className="flex items-start gap-4 mb-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {getAvatarPlaceholder()}
        </div>
        
        {/* Advisor Details */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {advisor.name}
          </h3>
          <p 
            className="text-sm font-medium mb-2"
            style={{ color: boardTheme.accent }}
          >
            {advisor.role}
          </p>
          
          {/* Board Badge */}
          <span 
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: boardTheme.background,
              color: boardTheme.text,
              border: `1px solid ${boardTheme.accent}20`
            }}
          >
            {boardTheme.name}
          </span>
        </div>
      </div>
      
      {/* Response Content */}
      <div className="space-y-3">
        <p className="text-gray-700 leading-relaxed text-sm">
          {advisor.response}
        </p>
      </div>
      
      {/* AI Disclaimer */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="text-gray-400">🤖</span>
          <span>AI Persona Response - Educational Use Only</span>
        </div>
      </div>
    </div>
  );
};

export default StaticAdvisorResponseCard;