import React from 'react';
import { useTheme } from '../common/ThemeProvider';
import Card from '../common/Card';
// Button import removed as it's not used in this component
import type { Domain } from '../../types';

interface DomainCardProps {
  domain: Domain;
  onSelect: (domain: Domain) => void;
  isSelected?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function DomainCard({ 
  domain, 
  onSelect, 
  isSelected = false, 
  className = '',
  style
}: DomainCardProps) {
  const { setCurrentDomain, currentDomain } = useTheme();

  const handleCardClick = () => {
    setCurrentDomain(domain.id);
    onSelect(domain);
  };

  const getDomainIcon = () => {
    switch (domain.id) {
      case 'cliniboard':
        return (
          <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'eduboard':
        return (
          <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case 'remediboard':
        return (
          <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 9h.01M15 9h.01M9 15h.01M15 15h.01" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getDomainColorClasses = () => {
    const isActive = currentDomain === domain.id || isSelected;
    
    switch (domain.id) {
      case 'cliniboard':
        return {
          card: isActive 
            ? 'bg-blue-50 border-blue-300 shadow-blue-500/20 glow-blue' 
            : 'bg-white border-blue-200 hover:bg-blue-50 hover:border-blue-300 hover:shadow-lg',
          icon: isActive ? 'text-blue-600' : 'text-blue-500',
          title: isActive ? 'text-blue-800' : 'text-blue-700',
          description: isActive ? 'text-blue-600' : 'text-neutral-600',
          advisorCount: 'text-blue-500',
        };
      case 'eduboard':
        return {
          card: isActive 
            ? 'bg-amber-50 border-amber-300 shadow-amber-500/20 glow-orange' 
            : 'bg-white border-amber-200 hover:bg-amber-50 hover:border-amber-300 hover:shadow-lg',
          icon: isActive ? 'text-amber-600' : 'text-amber-500',
          title: isActive ? 'text-amber-800' : 'text-amber-700',
          description: isActive ? 'text-amber-600' : 'text-neutral-600',
          advisorCount: 'text-amber-500',
        };
      case 'remediboard':
        return {
          card: isActive 
            ? 'bg-emerald-50 border-emerald-300 shadow-emerald-500/20 glow-blue' 
            : 'bg-white border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 hover:shadow-lg',
          icon: isActive ? 'text-emerald-600' : 'text-emerald-500',
          title: isActive ? 'text-emerald-800' : 'text-emerald-700',
          description: isActive ? 'text-emerald-600' : 'text-neutral-600',
          advisorCount: 'text-emerald-500',
        };
      default:
        return {
          card: 'bg-white border-neutral-200 hover:bg-neutral-50 hover:shadow-lg',
          icon: 'text-neutral-500',
          title: 'text-neutral-700',
          description: 'text-neutral-600',
          advisorCount: 'text-neutral-500',
        };
    }
  };

  const colorClasses = getDomainColorClasses();
  const isActive = currentDomain === domain.id || isSelected;

  return (
    <Card
      interactive
      onClick={handleCardClick}
      style={style}
      role="button"
      tabIndex={0}
      aria-label={`Select ${domain.name} domain with ${domain.advisors.length} expert advisors`}
      aria-pressed={isActive}
      className={`
        ${colorClasses.card}
        transition-all duration-300 ease-in-out
        transform hover:scale-105 hover:shadow-lg
        cursor-pointer
        ${isActive ? 'ring-2 ring-offset-2 ring-current' : ''}
        ${className}
      `}
      padding="lg"
      shadow={isActive ? "lg" : "md"}
    >
      <div className="text-center">
        {/* Domain Icon */}
        <div className={`flex justify-center ${colorClasses.icon}`} aria-hidden="true">
          {getDomainIcon()}
        </div>

        {/* Domain Name */}
        <h3 className={`text-lg sm:text-xl font-bold mb-3 ${colorClasses.title}`}>
          {domain.name}
        </h3>

        {/* Domain Description */}
        <p className={`text-sm mb-4 leading-relaxed ${colorClasses.description}`}>
          {domain.description}
        </p>

        {/* Advisor Count */}
        <div className={`text-xs font-medium mb-4 ${colorClasses.advisorCount}`} aria-label={`${domain.advisors.length} expert advisors available`}>
          {domain.advisors.length} Expert{domain.advisors.length !== 1 ? 's' : ''} Available
        </div>

        {/* Sample Advisors Preview */}
        <div className="mb-4">
          <div className="flex justify-center space-x-2 mb-2">
            {domain.advisors.slice(0, 3).map((advisor) => (
              <div
                key={advisor.id}
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
                  ${colorClasses.card} border-2 border-white shadow-sm
                `}
                title={advisor.name}
              >
                {advisor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
            ))}
            {domain.advisors.length > 3 && (
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs
                ${colorClasses.card} border-2 border-white shadow-sm
              `}>
                +{domain.advisors.length - 3}
              </div>
            )}
          </div>
        </div>

        {/* Selection Status */}
        {isActive && (
          <div className={`text-xs font-medium ${colorClasses.title} mb-2`}>
            ✓ Selected
          </div>
        )}

        {/* Hover Instruction */}
        <div className={`
          text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200
          ${colorClasses.description}
        `}>
          Click to explore this domain
        </div>
      </div>
    </Card>
  );
}