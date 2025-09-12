import React from 'react';

interface LoadingSkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
  animate?: boolean;
}

/**
 * Basic loading skeleton component
 */
export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className = '',
  width = '100%',
  height = '1rem',
  rounded = false,
  animate = true,
}) => {
  const baseClasses = 'bg-neutral-200';
  const animationClasses = animate ? 'animate-pulse' : '';
  const roundedClasses = rounded ? 'rounded-full' : 'rounded';

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={`${baseClasses} ${animationClasses} ${roundedClasses} ${className}`}
      style={style}
      aria-label="Loading..."
      role="status"
    />
  );
};

/**
 * Skeleton for advisor cards
 */
export const AdvisorCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-6 border border-neutral-200 rounded-lg bg-white ${className}`}>
    {/* Avatar */}
    <div className="flex justify-center mb-4">
      <LoadingSkeleton width={80} height={80} rounded />
    </div>
    
    {/* Name */}
    <LoadingSkeleton height="1.25rem" className="mb-2" />
    
    {/* Role */}
    <LoadingSkeleton height="1rem" width="80%" className="mb-3 mx-auto" />
    
    {/* Background */}
    <div className="space-y-2">
      <LoadingSkeleton height="0.875rem" />
      <LoadingSkeleton height="0.875rem" width="90%" />
      <LoadingSkeleton height="0.875rem" width="75%" />
    </div>
    
    {/* Button */}
    <div className="mt-4">
      <LoadingSkeleton height="2.5rem" rounded />
    </div>
  </div>
);

/**
 * Skeleton for response panels
 */
export const ResponsePanelSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-6 border border-neutral-200 rounded-lg bg-white ${className}`}>
    {/* Header */}
    <div className="flex items-center mb-4">
      <LoadingSkeleton width={40} height={40} rounded className="mr-3" />
      <div className="flex-1">
        <LoadingSkeleton height="1.125rem" width="60%" className="mb-1" />
        <LoadingSkeleton height="0.875rem" width="40%" />
      </div>
    </div>
    
    {/* Content */}
    <div className="space-y-3">
      <LoadingSkeleton height="1rem" />
      <LoadingSkeleton height="1rem" width="95%" />
      <LoadingSkeleton height="1rem" width="88%" />
      <LoadingSkeleton height="1rem" width="92%" />
      <LoadingSkeleton height="1rem" width="85%" />
    </div>
    
    {/* Footer */}
    <div className="mt-4 pt-4 border-t border-neutral-200">
      <LoadingSkeleton height="0.875rem" width="30%" />
    </div>
  </div>
);

/**
 * Skeleton for domain cards
 */
export const DomainCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-6 border-2 border-neutral-200 rounded-lg bg-neutral-50 ${className}`}>
    {/* Icon */}
    <div className="flex justify-center mb-4">
      <LoadingSkeleton width={48} height={48} rounded />
    </div>
    
    {/* Title */}
    <LoadingSkeleton height="1.25rem" width="70%" className="mb-3 mx-auto" />
    
    {/* Description */}
    <div className="space-y-2 mb-4">
      <LoadingSkeleton height="0.875rem" />
      <LoadingSkeleton height="0.875rem" width="80%" className="mx-auto" />
    </div>
    
    {/* Expert count */}
    <LoadingSkeleton height="0.75rem" width="50%" className="mx-auto" />
  </div>
);

/**
 * Skeleton for consultation interface
 */
export const ConsultationSkeleton: React.FC<{ advisorCount?: number }> = ({ 
  advisorCount = 3 
}) => (
  <div className="max-w-7xl mx-auto p-6">
    {/* Header */}
    <div className="mb-8">
      <LoadingSkeleton height="2rem" width="60%" className="mb-2" />
      <LoadingSkeleton height="1rem" width="40%" />
    </div>
    
    {/* Selected advisors */}
    <div className="mb-6 p-4 border border-neutral-200 rounded-lg bg-neutral-50">
      <LoadingSkeleton height="1rem" width="80%" />
    </div>
    
    {/* Prompt input */}
    <div className="mb-8">
      <LoadingSkeleton height="6rem" rounded />
    </div>
    
    {/* Response panels */}
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: advisorCount }, (_, i) => (
        <ResponsePanelSkeleton key={i} />
      ))}
    </div>
  </div>
);

/**
 * Skeleton for multi-domain interface
 */
export const MultiDomainSkeleton: React.FC = () => (
  <div className="max-w-7xl mx-auto p-6">
    {/* Header */}
    <div className="mb-8">
      <LoadingSkeleton height="2.5rem" width="70%" className="mb-2" />
      <LoadingSkeleton height="1rem" width="50%" />
    </div>
    
    {/* Domain sections */}
    <div className="space-y-8">
      {Array.from({ length: 3 }, (_, domainIndex) => (
        <div key={domainIndex} className="border border-neutral-200 rounded-lg p-6">
          {/* Domain header */}
          <div className="flex items-center mb-4">
            <LoadingSkeleton width={32} height={32} rounded className="mr-3" />
            <LoadingSkeleton height="1.5rem" width="30%" />
          </div>
          
          {/* Advisor grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }, (_, advisorIndex) => (
              <AdvisorCardSkeleton key={advisorIndex} />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default LoadingSkeleton;
