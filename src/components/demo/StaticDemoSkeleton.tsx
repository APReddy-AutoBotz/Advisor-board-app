/**
 * Static Demo Skeleton Component
 * 
 * Displays board-themed skeleton cards during loading state
 * Features 1.2s shimmer animation with proper aspect ratios
 */

import React from 'react';
import type { StaticAdvisorResponse } from '../../data/sampleDemoData';

export interface StaticDemoSkeletonProps {
  advisors: StaticAdvisorResponse[];
  className?: string;
}

export const StaticDemoSkeleton: React.FC<StaticDemoSkeletonProps> = ({
  advisors,
  className = ''
}) => {
  const containerClasses = [
    'skeleton-container',
    'space-y-6',
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={containerClasses}
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading advisor responses"
    >
      {/* Advisor Cards Skeleton Grid */}
      <div className="card-grid">
        {advisors.map((advisor) => (
          <div
            key={`skeleton-${advisor.id}`}
            className={`skeleton-card ${advisor.boardId}`}
            style={{
              animationDelay: `${advisor.delay * 0.1}ms` // Slight stagger for visual interest
            }}
          >
            {/* Skeleton Header */}
            <div className="p-6 space-y-4">
              {/* Avatar and Name Skeleton */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full skeleton" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton-text short" />
                  <div className="skeleton-text medium" />
                </div>
              </div>
              
              {/* Badge Skeleton */}
              <div className="w-24 h-6 skeleton rounded-full" />
              
              {/* Content Skeleton */}
              <div className="space-y-2">
                <div className="skeleton-text long" />
                <div className="skeleton-text long" />
                <div className="skeleton-text medium" />
              </div>
              
              {/* Footer Skeleton */}
              <div className="pt-3 border-t border-gray-100">
                <div className="skeleton-text short" />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Summary Skeleton */}
      <div className="max-w-2xl mx-auto">
        <div className="skeleton-card bg-gray-100">
          <div className="p-6 space-y-4">
            {/* Header Skeleton */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg skeleton" />
              <div className="flex-1 space-y-2">
                <div className="skeleton-text short" />
                <div className="skeleton-text medium" />
              </div>
            </div>
            
            {/* Content Skeleton */}
            <div className="space-y-2">
              <div className="skeleton-text long" />
              <div className="skeleton-text long" />
            </div>
            
            {/* Footer Skeleton */}
            <div className="pt-3 border-t border-gray-100 flex justify-between">
              <div className="skeleton-text short" />
              <div className="skeleton-text short" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaticDemoSkeleton;
