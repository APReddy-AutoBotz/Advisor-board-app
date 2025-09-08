/**
 * AI-Advisor Gallery Component
 * 
 * Premium advisor gallery with responsive grid, selection management,
 * and integrated portrait/naming system. Mobile-first design with
 * accessibility features and performance optimizations.
 */

import React, { useMemo } from 'react';
import { AIAdvisorCard } from './AIAdvisorCard';
import { ToastContainer } from '../common/ToastNotification';
import { useAdvisorSelection } from '../../hooks/useAdvisorSelection';
import { getBoardTheme } from '../../lib/boardThemes';
import type { Advisor, DomainId } from '../../types/domain';

export interface AIAdvisorGalleryProps {
  advisors: Advisor[];
  boardId: DomainId;
  onChatClick?: (advisor: Advisor) => void;
  onProfileClick?: (advisor: Advisor) => void;
  onSelectionChange?: (selectedAdvisors: Advisor[]) => void;
  variant?: 'solid' | 'glass';
  className?: string;
  showSelectionCounter?: boolean;
  maxColumns?: 1 | 2 | 3;
}

export const AIAdvisorGallery: React.FC<AIAdvisorGalleryProps> = ({
  advisors,
  boardId,
  onChatClick,
  onProfileClick,
  onSelectionChange,
  variant = 'solid',
  className = '',
  showSelectionCounter = true,
  maxColumns = 3
}) => {
  const {
    selectedAdvisors,
    selectedCount,
    maxSelections,
    canSelectMore,
    selectAdvisor,
    deselectAdvisor,
    isSelected,
    clearSelection,
    toasts,
    dismissToast
  } = useAdvisorSelection();

  const theme = getBoardTheme(boardId);

  // Notify parent of selection changes
  React.useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedAdvisors);
    }
  }, [selectedAdvisors, onSelectionChange]);

  // Responsive grid classes
  const gridClasses = useMemo(() => {
    const baseClasses = 'grid gap-6';
    
    switch (maxColumns) {
      case 1:
        return `${baseClasses} grid-cols-1`;
      case 2:
        return `${baseClasses} grid-cols-1 sm:grid-cols-2`;
      case 3:
      default:
        return `${baseClasses} grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`;
    }
  }, [maxColumns]);

  const handleAdvisorSelect = (advisor: Advisor) => {
    const success = selectAdvisor(advisor);
    
    // Analytics tracking
    if (success) {
      console.log('📊 advisor_select', {
        advisorId: advisor.id,
        board: boardId,
        expertise: advisor.expertise,
        selectionCount: selectedCount + 1
      });
    }
  };

  const handleAdvisorDeselect = (advisor: Advisor) => {
    deselectAdvisor(advisor);
    
    // Analytics tracking
    console.log('📊 advisor_deselect', {
      advisorId: advisor.id,
      board: boardId,
      selectionCount: selectedCount - 1
    });
  };

  const handleChatClick = (advisor: Advisor) => {
    // Analytics tracking
    console.log('📊 advisor_chat_click', {
      advisorId: advisor.id,
      board: boardId,
      expertise: advisor.expertise
    });
    
    if (onChatClick) {
      onChatClick(advisor);
    }
  };

  const handleProfileClick = (advisor: Advisor) => {
    // Analytics tracking
    console.log('📊 persona_info_open', {
      advisorId: advisor.id,
      board: boardId,
      expertise: advisor.expertise
    });
    
    if (onProfileClick) {
      onProfileClick(advisor);
    }
  };

  if (!advisors || advisors.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Advisors Available</h3>
        <p className="text-gray-600">Check back later for expert advisors in this domain.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Selection Counter */}
      {showSelectionCounter && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Counter Pill */}
            <div 
              className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium shadow-sm"
              style={{
                backgroundColor: theme.chip.background,
                color: theme.chip.text,
                borderColor: theme.chip.border,
                border: '1px solid'
              }}
            >
              <span className="mr-2">Selected Advisors:</span>
              <span className="font-bold">{selectedCount}/{maxSelections}</span>
            </div>

            {/* Selection Status */}
            {selectedCount > 0 && (
              <div className="text-sm text-gray-600">
                {canSelectMore 
                  ? `${maxSelections - selectedCount} more available`
                  : 'Maximum reached'
                }
              </div>
            )}
          </div>

          {/* Clear Selection */}
          {selectedCount > 0 && (
            <button
              onClick={clearSelection}
              className="text-sm text-gray-500 hover:text-gray-700 underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 rounded"
            >
              Clear All
            </button>
          )}
        </div>
      )}

      {/* Advisor Grid */}
      <div className={gridClasses}>
        {advisors.map((advisor, index) => (
          <AIAdvisorCard
            key={advisor.id}
            advisor={advisor}
            boardId={boardId}
            slotIndex={index}
            isSelected={isSelected(advisor.id)}
            onSelect={handleAdvisorSelect}
            onDeselect={handleAdvisorDeselect}
            onChatClick={handleChatClick}
            onProfileClick={handleProfileClick}
            variant={variant}
          />
        ))}
      </div>

      {/* Selection Summary */}
      {selectedCount > 0 && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Your Advisory Board ({selectedCount} advisor{selectedCount !== 1 ? 's' : ''})
          </h4>
          <div className="flex flex-wrap gap-2">
            {selectedAdvisors.map(advisor => (
              <span
                key={advisor.id}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-white border border-gray-200 text-gray-700"
              >
                {advisor.name}
                <button
                  onClick={() => handleAdvisorDeselect(advisor)}
                  className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  aria-label={`Remove ${advisor.name}`}
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <ToastContainer
        toasts={toasts}
        onDismiss={dismissToast}
      />

      {/* AI Disclaimer */}
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">🤖 AI Persona Advisory</p>
            <p>
              These are AI personas trained to emulate expert reasoning in their respective domains. 
              They are not real people. Educational use only.
              {(boardId === 'cliniboard' || boardId === 'remediboard') && (
                <span className="block mt-1 font-medium">
                  ⚠️ Not medical advice. Consult qualified healthcare professionals for medical decisions.
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAdvisorGallery;