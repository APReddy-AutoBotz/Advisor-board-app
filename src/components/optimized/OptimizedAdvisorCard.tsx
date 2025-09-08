import React, { memo, useMemo, useCallback } from 'react';
import type { Advisor } from '../../types/domain';
import Button from '../common/Button';
import Card from '../common/Card';
import AdvisorAvatar from '../advisors/AdvisorAvatar';

interface OptimizedAdvisorCardProps {
  advisor: Advisor;
  isSelected: boolean;
  onToggleSelection: (advisor: Advisor) => void;
  className?: string;
  showFullBackground?: boolean;
}

/**
 * Optimized advisor card component with memoization and performance optimizations
 */
const OptimizedAdvisorCard: React.FC<OptimizedAdvisorCardProps> = memo(({
  advisor,
  isSelected,
  onToggleSelection,
  className = '',
  showFullBackground = false,
}) => {
  // Memoize expensive calculations
  const domainColorClasses = useMemo(() => {
    const domainId = advisor.domain?.id;
    switch (domainId) {
      case 'cliniboard':
        return {
          border: 'border-clinical-200',
          bg: isSelected ? 'bg-clinical-100' : 'bg-clinical-50',
          text: 'text-clinical-800',
          button: isSelected ? 'bg-clinical-600 hover:bg-clinical-700' : 'border-clinical-300 text-clinical-700 hover:bg-clinical-100',
        };
      case 'eduboard':
        return {
          border: 'border-education-200',
          bg: isSelected ? 'bg-education-100' : 'bg-education-50',
          text: 'text-education-800',
          button: isSelected ? 'bg-education-600 hover:bg-education-700' : 'border-education-300 text-education-700 hover:bg-education-100',
        };
      case 'remediboard':
        return {
          border: 'border-remedies-200',
          bg: isSelected ? 'bg-remedies-100' : 'bg-remedies-50',
          text: 'text-remedies-800',
          button: isSelected ? 'bg-remedies-600 hover:bg-remedies-700' : 'border-remedies-300 text-remedies-700 hover:bg-remedies-100',
        };
      default:
        return {
          border: 'border-neutral-200',
          bg: isSelected ? 'bg-neutral-100' : 'bg-white',
          text: 'text-neutral-800',
          button: isSelected ? 'bg-neutral-600 hover:bg-neutral-700' : 'border-neutral-300 text-neutral-700 hover:bg-neutral-100',
        };
    }
  }, [advisor.domain?.id, isSelected]);

  // Memoize truncated background text
  const truncatedBackground = useMemo(() => {
    if (showFullBackground) return advisor.background;
    
    const maxLength = 120;
    if (advisor.background.length <= maxLength) {
      return advisor.background;
    }
    
    return advisor.background.substring(0, maxLength).trim() + '...';
  }, [advisor.background, showFullBackground]);

  // Memoize button text and aria label
  const buttonConfig = useMemo(() => ({
    text: isSelected ? 'Selected' : 'Select',
    ariaLabel: `${isSelected ? 'Deselect' : 'Select'} ${advisor.name} as advisor`,
  }), [isSelected, advisor.name]);

  // Stable callback reference
  const handleToggle = useCallback(() => {
    onToggleSelection(advisor);
  }, [onToggleSelection, advisor]);

  // Memoize card classes
  const cardClasses = useMemo(() => 
    `${domainColorClasses.border} ${domainColorClasses.bg} transition-all duration-200 hover:shadow-md ${
      isSelected ? 'ring-2 ring-offset-2 ring-current' : ''
    } ${className}`.trim(),
    [domainColorClasses, isSelected, className]
  );

  return (
    <Card
      variant="elevated"
      padding="lg"
      className={cardClasses}
      role="button"
      tabIndex={0}
      onClick={handleToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleToggle();
        }
      }}
      aria-pressed={isSelected}
      aria-label={buttonConfig.ariaLabel}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2">
          <div className={`w-6 h-6 rounded-full ${domainColorClasses.text} bg-current flex items-center justify-center`}>
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path 
                fillRule="evenodd" 
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                clipRule="evenodd" 
              />
            </svg>
          </div>
        </div>
      )}

      {/* Avatar */}
      <div className="flex justify-center mb-4">
        <AdvisorAvatar
          advisor={advisor}
          size="lg"
          className="ring-2 ring-white shadow-lg"
        />
      </div>

      {/* Name */}
      <h3 className={`text-lg font-semibold text-center mb-2 ${domainColorClasses.text}`}>
        {advisor.name}
      </h3>

      {/* Expertise */}
      <p className="text-sm text-center text-neutral-600 mb-3 font-medium">
        {advisor.expertise}
      </p>

      {/* Background */}
      <p className="text-xs text-neutral-600 leading-relaxed mb-4 text-center">
        {truncatedBackground}
      </p>

      {/* Action Button */}
      <Button
        variant={isSelected ? 'primary' : 'outline'}
        size="sm"
        fullWidth
        onClick={(e) => {
          e.stopPropagation(); // Prevent card click
          handleToggle();
        }}
        className={`${domainColorClasses.button} transition-colors duration-200`}
        aria-label={buttonConfig.ariaLabel}
      >
        {buttonConfig.text}
      </Button>

      {/* Keyboard hint */}
      <div className="sr-only">
        Press Enter or Space to {isSelected ? 'deselect' : 'select'} this advisor
      </div>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  return (
    prevProps.advisor.id === nextProps.advisor.id &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.showFullBackground === nextProps.showFullBackground &&
    prevProps.className === nextProps.className &&
    prevProps.advisor.name === nextProps.advisor.name &&
    prevProps.advisor.expertise === nextProps.advisor.expertise &&
    prevProps.advisor.background === nextProps.advisor.background
  );
});

OptimizedAdvisorCard.displayName = 'OptimizedAdvisorCard';

export default OptimizedAdvisorCard;