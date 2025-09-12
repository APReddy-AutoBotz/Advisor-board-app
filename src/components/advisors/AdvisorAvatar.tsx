import React from 'react';
import type { Advisor } from '../../types/domain';

interface AdvisorAvatarProps {
  advisor: Advisor;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBorder?: boolean;
  className?: string;
}

const AdvisorAvatar: React.FC<AdvisorAvatarProps> = ({
  advisor,
  size = 'md',
  showBorder = false,
  className = '',
}) => {
  const getSizeClasses = (): string => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8 text-xs';
      case 'md':
        return 'w-12 h-12 text-sm';
      case 'lg':
        return 'w-16 h-16 text-base';
      case 'xl':
        return 'w-20 h-20 text-lg';
      default:
        return 'w-12 h-12 text-sm';
    }
  };

  const getDomainColorClasses = (): string => {
    const domainId = advisor.domain.id;
    switch (domainId) {
      case 'cliniboard':
        return 'bg-clinical-100 text-clinical-700 border-clinical-300';
      case 'eduboard':
        return 'bg-education-100 text-education-700 border-education-300';
      case 'remediboard':
        return 'bg-remedies-100 text-remedies-700 border-remedies-300';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-300';
    }
  };

  const getInitials = (name: string): string => {
    // Remove common titles and get meaningful name parts
    const cleanName = name
      .replace(/^(Dr\.?|Prof\.?|Mr\.?|Ms\.?|Mrs\.?)\s+/i, '')
      .trim();
    
    const nameParts = cleanName.split(' ').filter(part => part.length > 0);
    
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    
    // Take first letter of first name and first letter of last name
    const firstInitial = nameParts[0].charAt(0);
    const lastInitial = nameParts[nameParts.length - 1].charAt(0);
    
    return (firstInitial + lastInitial).toUpperCase();
  };

  const baseClasses = [
    'flex items-center justify-center',
    'rounded-full font-medium',
    'transition-all duration-200',
    getSizeClasses(),
    getDomainColorClasses(),
    showBorder ? 'border-2' : '',
    className,
  ].filter(Boolean).join(' ');

  // If advisor has a custom avatar URL, use it; otherwise show initials
  if (advisor.avatar) {
    return (
      <img
        src={advisor.avatar}
        alt={`${advisor.name} avatar`}
        className={`${baseClasses} object-cover`}
        onError={(e) => {
          // Fallback to initials if image fails to load
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent) {
            parent.innerHTML = getInitials(advisor.name);
            parent.className = baseClasses;
          }
        }}
      />
    );
  }

  return (
    <div className={baseClasses} title={advisor.name}>
      {getInitials(advisor.name)}
    </div>
  );
};

export default AdvisorAvatar;
