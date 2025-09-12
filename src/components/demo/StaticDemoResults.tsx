/**
 * Static Demo Results Component
 * 
 * Orchestrates the display of advisor response cards and summary
 * Features CSS Grid for equal heights and staggered reveal animations
 */

import React, { useState, useEffect } from 'react';
import StaticAdvisorResponseCard from './StaticAdvisorResponseCard';
import StaticSummaryCard from './StaticSummaryCard';
import type { StaticDemoScenario } from '../../data/sampleDemoData';

export interface StaticDemoResultsProps {
  scenario: StaticDemoScenario;
  isVisible?: boolean;
  className?: string;
}

export const StaticDemoResults: React.FC<StaticDemoResultsProps> = ({
  scenario,
  isVisible = false,
  className = ''
}) => {
  const [showResults, setShowResults] = useState(false);
  
  // Control the overall visibility with a slight delay for smooth transition
  useEffect(() => {
    if (isVisible) {
      // Small delay to ensure skeleton has been visible
      const timer = setTimeout(() => {
        setShowResults(true);
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      setShowResults(false);
    }
  }, [isVisible]);

  const containerClasses = [
    'demo-results',
    'space-y-6',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {/* Advisor Response Cards Grid */}
      <div className="card-grid">
        {scenario.advisors.map((advisor) => (
          <StaticAdvisorResponseCard
            key={advisor.id}
            advisor={advisor}
            isVisible={showResults}
          />
        ))}
      </div>
      
      {/* Summary Card */}
      <div className="max-w-2xl mx-auto">
        <StaticSummaryCard
          summary={scenario.summary}
          isVisible={showResults}
        />
      </div>
    </div>
  );
};

export default StaticDemoResults;
