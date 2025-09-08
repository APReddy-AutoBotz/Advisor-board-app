/**
 * Static Demo Orchestrator Component
 * 
 * Manages the complete demo flow: skeleton loading → advisor responses → summary
 * Handles timing, transitions, and analytics tracking
 */

import React, { useState, useEffect } from 'react';
import StaticDemoSkeleton from './StaticDemoSkeleton';
import StaticDemoResults from './StaticDemoResults';
import type { StaticDemoScenario } from '../../data/sampleDemoData';

export interface StaticDemoOrchestratorProps {
  scenario: StaticDemoScenario;
  isActive?: boolean;
  onComplete?: () => void;
  className?: string;
}

export const StaticDemoOrchestrator: React.FC<StaticDemoOrchestratorProps> = ({
  scenario,
  isActive = false,
  onComplete,
  className = ''
}) => {
  const [phase, setPhase] = useState<'idle' | 'loading' | 'results'>('idle');
  
  // Demo flow timing - respond to external loading state
  useEffect(() => {
    if (isActive) {
      // Track demo start
      console.log('🎯 Analytics: hero_demo_submit', {
        question: scenario.question.substring(0, 50),
        timestamp: new Date().toISOString()
      });
      
      // Show results immediately when active
      setPhase('results');
      
      // Track advisor responses
      scenario.advisors.forEach((advisor) => {
        console.log('🎯 Analytics: advisor_response_render', {
          advisor_id: advisor.id,
          board_type: advisor.boardId,
          timestamp: new Date().toISOString()
        });
      });
      
      // Track summary render
      setTimeout(() => {
        console.log('🎯 Analytics: summary_render', {
          response_count: scenario.advisors.length,
          timestamp: new Date().toISOString()
        });
        
        if (onComplete) {
          onComplete();
        }
      }, scenario.summary.delay);
    } else {
      setPhase('idle');
    }
  }, [isActive, scenario, onComplete]);

  const containerClasses = [
    'static-demo-orchestrator',
    'transition-all duration-300 ease-out',
    className
  ].filter(Boolean).join(' ');

  if (phase === 'idle') {
    return null;
  }

  return (
    <div className={containerClasses}>
      {phase === 'results' && (
        <StaticDemoResults 
          scenario={scenario}
          isVisible={true}
        />
      )}
    </div>
  );
};

export default StaticDemoOrchestrator;