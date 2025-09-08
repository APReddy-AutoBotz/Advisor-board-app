/**
 * AI-Advisor Card Component
 * 
 * Enhanced advisor card with gradient backgrounds, portrait integration,
 * and premium styling. Supports both solid and glass variants.
 * Includes proper AI disclaimers and accessibility features.
 * Updated with safety-compliant persona bios.
 */

import React, { useState } from 'react';
import { getBoardTheme } from '../../lib/boardThemes';
import { PortraitAssignmentEngine, type PortraitAssignment } from '../../lib/portraitRegistry';
import { NameFactory, type GeneratedName } from '../../lib/nameFactory';
import { extractFirstName, extractLastName } from '../../utils/nameUtils';
import type { Advisor, DomainId } from '../../types/domain';
import { SAFE_PERSONA_BIOS, AI_PERSONA_INFO_POPOVER, CTA_BUTTON_TEMPLATE } from '../../data/safePersonaBios';

export interface AIAdvisorCardProps {
  advisor: Advisor;
  boardId: DomainId;
  slotIndex: number;
  isSelected?: boolean;
  onSelect?: (advisor: Advisor) => void;
  onDeselect?: (advisor: Advisor) => void;
  onChatClick?: (advisor: Advisor) => void;
  onProfileClick?: (advisor: Advisor) => void;
  variant?: 'solid' | 'glass';
  className?: string;
}

export const AIAdvisorCard: React.FC<AIAdvisorCardProps> = ({
  advisor,
  boardId,
  slotIndex,
  isSelected = false,
  onSelect,
  onDeselect,
  onChatClick,
  onProfileClick,
  variant = 'solid',
  className = ''
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showInfoPopover, setShowInfoPopover] = useState(false);
  
  const theme = getBoardTheme(boardId);
  
  // Generate AI persona name and portrait assignment
  const nameFactory = new NameFactory();
  const portraitEngine = new PortraitAssignmentEngine();
  
  const genderPref = advisor.genderPref || 'any';
  const genderTag = genderPref === 'fem' ? 'feminine' : genderPref === 'masc' ? 'masculine' : 'feminine';
  
  // Get safety-compliant bio data
  const safeBio = SAFE_PERSONA_BIOS[advisor.id];
  
  // Use advisor.name if available, otherwise generate a name
  const generatedName: GeneratedName = advisor.name 
    ? {
        firstName: extractFirstName(advisor.name),
        lastName: extractLastName(advisor.name),
        fullName: advisor.name,
        gender: genderTag
      }
    : nameFactory.generateName(
        boardId,
        advisor.id,
        slotIndex,
        genderTag
      );
  
  // Use advisor.avatar if available, otherwise use portrait assignment engine
  const portraitAssignment: PortraitAssignment = advisor.avatar 
    ? {
        portraitKey: `custom-${advisor.id}`,
        url: advisor.avatar,
        alt: `Portrait of ${advisor.name} (AI advisor)`,
        genderTag: genderTag
      }
    : portraitEngine.assignPortrait(
        genderPref,
        advisor.id,
        generatedName.firstName,
        generatedName.lastName
      );

  const handleCardClick = () => {
    if (isSelected && onDeselect) {
      onDeselect(advisor);
    } else if (!isSelected && onSelect) {
      onSelect(advisor);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCardClick();
    }
  };

  const handleChatClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (onChatClick) {
      onChatClick(advisor);
    }
  };

  const handleProfileClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (onProfileClick) {
      onProfileClick(advisor);
    }
  };

  const handleInfoClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    setShowInfoPopover(!showInfoPopover);
  };

  // Card styling based on variant and selection state
  const cardClasses = [
    'relative group cursor-pointer transition-all duration-300 ease-out',
    'rounded-xl overflow-hidden',
    'hover:shadow-xl hover:scale-[1.02]',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    `focus:ring-${theme.ring.focus.replace('ring-', '')}`,
    variant === 'glass' 
      ? 'bg-white/10 backdrop-blur-sm border border-white/20' 
      : 'bg-white border border-gray-200',
    isSelected 
      ? `ring-2 ring-${theme.ring.selection.replace('ring-', '')} shadow-lg scale-[1.02]`
      : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cardClasses}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-pressed={isSelected}
      aria-label={`${isSelected ? 'Deselect' : 'Select'} AI advisor ${generatedName.fullName}`}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3 z-10">
          <div 
            className="w-6 h-6 rounded-full flex items-center justify-center shadow-lg"
            style={{ backgroundColor: theme.accent }}
          >
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}

      {/* Gradient Banner with Portrait */}
      <div className="relative h-32 overflow-hidden">
        {/* Gradient Background */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${theme.gradient.from} 0%, ${theme.gradient.to} 100%)`
          }}
        />
        
        {/* Noise Overlay */}
        {theme.noiseOverlay && (
          <div 
            className="absolute inset-0 opacity-8"
            style={{
              backgroundImage: `url("${theme.noiseOverlay}")`,
              backgroundSize: '256px 256px'
            }}
          />
        )}

        {/* Portrait */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* Portrait Image */}
            <img
              src={portraitAssignment.url}
              alt={portraitAssignment.alt}
              className={`w-20 h-20 object-cover rounded-full ring-2 ring-white shadow-lg transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(true)}
            />
            
            {/* Loading Placeholder */}
            {!imageLoaded && (
              <div className="absolute inset-0 w-20 h-20 bg-white/20 rounded-full ring-2 ring-white animate-pulse flex items-center justify-center">
                <div className="w-8 h-8 bg-white/40 rounded-full" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-3">
        {/* Name and Role */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {generatedName.fullName}
          </h3>
          <p 
            className="text-sm font-medium"
            style={{ color: theme.accentText }}
          >
            {safeBio?.title || `${advisor.expertise} (AI Persona)`}
          </p>
        </div>

        {/* Summary */}
        <p className="text-sm text-gray-600 line-clamp-2">
          {safeBio?.experience || advisor.background}
        </p>

        {/* Specialty Chips */}
        {(safeBio?.expertise || advisor.specialties) && (
          <div className="flex flex-wrap gap-1">
            {(safeBio?.expertise || advisor.specialties)?.slice(0, 3).map((specialty, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
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
        )}

        {/* Action Buttons - Horizontal Layout */}
        <div className="advisor-card-ctas flex gap-2 pt-2">
          {/* Primary CTA */}
          <button
            onClick={handleChatClick}
            className={`flex-1 px-2 py-2.5 text-xs font-semibold text-white rounded-lg transition-colors duration-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 whitespace-nowrap`}
            style={{ backgroundColor: theme.accent }}
          >
            <span className="truncate">Chat {extractFirstName(generatedName.fullName)}</span>
          </button>

          {/* Secondary CTA */}
          <button
            onClick={handleProfileClick}
            className="flex-1 px-2 py-2.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 whitespace-nowrap"
          >
            <span className="truncate">View Profile</span>
          </button>

          {/* Info Button */}
          <div className="relative">
            <button
              onClick={handleInfoClick}
              className="p-2.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 flex-shrink-0"
              aria-label="Information about AI persona"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Info Popover */}
            {showInfoPopover && (
              <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-white rounded-lg shadow-lg border border-gray-200 text-xs text-gray-600 z-20">
                <div className="space-y-2">
                  <p className="font-medium text-gray-900">{AI_PERSONA_INFO_POPOVER.title}</p>
                  <p>
                    {AI_PERSONA_INFO_POPOVER.content}
                  </p>
                  {safeBio?.experience && (
                    <p className="text-blue-600">
                      {safeBio.experience}
                    </p>
                  )}
                  {(boardId === 'cliniboard' || boardId === 'remediboard') && (
                    <p className="text-amber-600 font-medium">
                      {AI_PERSONA_INFO_POPOVER.medicalDisclaimer}
                    </p>
                  )}
                </div>
                <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
              </div>
            )}
          </div>
        </div>
      </div>


    </div>
  );
};

export default AIAdvisorCard;