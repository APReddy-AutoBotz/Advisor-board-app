import React, { useState } from 'react';
import { getBoardTheme, trackThemeUsage } from '../../lib/boardThemes';
import { extractFirstName, createChatCTA } from '../../utils/nameUtils';
import type { BoardExpert } from '../../lib/boards';

interface EnhancedAdvisorCardProps {
  advisor: BoardExpert;
  boardId: string;
  variant?: 'solid' | 'glass';
  isSelected?: boolean;
  onSelect?: (advisor: BoardExpert) => void;
  onChatClick?: (advisor: BoardExpert) => void;
  onViewProfile?: (advisor: BoardExpert) => void;
  className?: string;
}

const EnhancedAdvisorCard: React.FC<EnhancedAdvisorCardProps> = ({
  advisor,
  boardId,
  variant = 'solid',
  isSelected = false,
  onSelect,
  onChatClick,
  onViewProfile,
  className = ''
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const theme = getBoardTheme(boardId);
  
  React.useEffect(() => {
    trackThemeUsage(boardId, 'EnhancedAdvisorCard');
  }, [boardId]);

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(advisor);
    }
  };

  const handleChatClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onChatClick) {
      onChatClick(advisor);
    }
  };

  const handleViewProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewProfile) {
      onViewProfile(advisor);
    }
  };

  const cardClasses = `
    group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl 
    transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] focus:outline-none 
    ${theme.ring.focus} focus:ring-4 focus:ring-offset-2
    ${variant === 'glass' 
      ? 'bg-white/80 backdrop-blur-sm border border-white/20' 
      : 'bg-white border border-gray-200'
    }
    ${isSelected 
      ? `ring-4 ${theme.ring.selection} shadow-xl scale-[1.02]` 
      : 'shadow-lg hover:shadow-2xl'
    }
    ${className}
  `;

  return (
    <div
      className={cardClasses}
      onClick={handleCardClick}
      tabIndex={0}
      role="button"
      aria-label={`Select AI advisor ${advisor.name}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-4 right-4 z-10">
          <div 
            className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white shadow-lg"
            style={{ backgroundColor: theme.accent }}
          >
            <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}

      {/* Gradient Banner */}
      <div 
        className={`relative h-24 ${theme.gradient.css}`}
        style={{
          background: `linear-gradient(135deg, ${theme.gradient.from} 0%, ${theme.gradient.to} 100%)`
        }}
      >
        {/* Subtle radial highlight */}
        <div className="absolute inset-0 bg-gradient-radial from-white/20 via-transparent to-transparent opacity-60" />
        
        {/* Light grain texture */}
        <div className="absolute inset-0 opacity-10 bg-noise" />
      </div>

      {/* Portrait overlapping banner */}
      <div className="relative -mt-8 flex justify-center">
        <div className="relative">
          <img
            src={advisor.avatar}
            alt={`Illustrated portrait of ${advisor.name} (AI persona)`}
            className="h-16 w-16 rounded-full border-2 border-white shadow-lg object-cover"
            loading="lazy"
            style={{ aspectRatio: '1/1' }}
          />
          
          {/* AI Indicator Badge */}
          <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 border-2 border-white shadow-sm">
            <span className="text-xs font-bold text-white">AI</span>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="flex-1 p-6 pt-4">
        {/* Name and Role */}
        <div className="mb-3">
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-gray-700">
            {advisor.name}
          </h3>
          <p className="text-sm font-medium" style={{ color: theme.accent }}>
            {advisor.role}
          </p>
        </div>

        {/* Summary (2-3 lines, truncated cleanly) */}
        <p className="mb-4 text-sm leading-relaxed text-gray-600 line-clamp-3">
          {advisor.blurb}
        </p>

        {/* Skill/Keyword Chips (max 4) */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {advisor.specialties.slice(0, 4).map((specialty, index) => (
              <span
                key={index}
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border"
                style={{
                  backgroundColor: theme.chip.background,
                  color: theme.chip.text,
                  borderColor: theme.chip.border
                }}
              >
                {specialty}
              </span>
            ))}
          </div>
        </div>

        {/* CTAs Row - Side by side layout */}
        <div className="advisor-card-ctas flex gap-2 w-full">
          {/* Primary CTA - Chat */}
          <button
            onClick={handleChatClick}
            className={`
              flex-1 rounded-lg px-2 py-2.5 text-xs font-semibold text-white 
              transition-all duration-200 hover:shadow-lg focus:outline-none 
              focus:ring-4 focus:ring-offset-2 ${theme.ring.focus}
              min-h-[40px] flex items-center justify-center gap-1 whitespace-nowrap
            `}
            style={{ backgroundColor: theme.accent }}
            aria-label={`Chat with AI ${advisor.name}`}
          >
            <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="truncate text-xs">Chat {extractFirstName(advisor.name)}</span>
          </button>

          {/* Secondary CTA - View Profile */}
          <button
            onClick={handleViewProfile}
            className={`
              flex-1 rounded-lg border px-2 py-2.5 text-xs font-medium 
              transition-all duration-200 hover:shadow-md focus:outline-none 
              focus:ring-4 focus:ring-offset-2 ${theme.ring.focus}
              min-h-[40px] flex items-center justify-center gap-1 whitespace-nowrap
            `}
            style={{ 
              borderColor: theme.chip.border,
              color: theme.text.secondary,
              backgroundColor: 'transparent'
            }}
            aria-label={`View ${advisor.name} persona profile`}
          >
            <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="truncate text-xs">View Profile</span>
          </button>
        </div>
      </div>

      {/* AI Info Tooltip */}
      <div className="absolute top-4 left-4">
        <button
          className="flex h-6 w-6 items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/30 transition-colors"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={(e) => {
            e.stopPropagation();
            setShowTooltip(!showTooltip);
          }}
          aria-label="About this AI advisor"
        >
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute top-8 left-0 z-20 w-64 rounded-lg bg-gray-900 p-3 text-xs text-white shadow-xl">
            <div className="font-semibold mb-1">About AI {extractFirstName(advisor.name)}</div>
            <div className="text-gray-300">
              This is an AI advisor trained to emulate {boardId.replace('board', '')} reasoning. 
              It is not the real person. Educational use only.
            </div>
            <div className="absolute -top-1 left-4 h-2 w-2 rotate-45 bg-gray-900"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedAdvisorCard;