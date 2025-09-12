/**
 * Interactive Demo Input Component
 * Provides live demo experience with skeleton loading states and smooth transitions
 */

import React, { useState, useRef, useEffect } from 'react';
import Button from '../common/Button';
import { DEMO_SCENARIOS, DEFAULT_DEMO_QUESTION } from '../../data/sampleDemoData';
import StaticDemoOrchestrator from './StaticDemoOrchestrator';
import type { StaticDemoScenario } from '../../data/sampleDemoData';

interface DemoInputProps {
  onStartSession?: () => void;
  className?: string;
  variant?: 'hero' | 'sticky';
}

interface DemoState {
  isLoading: boolean;
  showResults: boolean;
  currentScenario: StaticDemoScenario | null;
}

const DemoInput: React.FC<DemoInputProps> = ({ 
  onStartSession, 
  className = '',
  variant = 'hero'
}) => {
  const [demoQuestion, setDemoQuestion] = useState(DEFAULT_DEMO_QUESTION);
  const [demoState, setDemoState] = useState<DemoState>({
    isLoading: false,
    showResults: false,
    currentScenario: null
  });
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const loadingTimeoutRef = useRef<number | undefined>();

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        window.clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoQuestion.trim() || demoState.isLoading) return;

    // Track analytics event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'hero_demo_submit', {
        question_preview: demoQuestion.slice(0, 50),
        location: variant === 'hero' ? 'hero_panel' : 'sticky_rail'
      });
    }

    // Reset state and start loading
    setDemoState({
      isLoading: true,
      showResults: false,
      currentScenario: null
    });

    // Clear any existing timeout
    if (loadingTimeoutRef.current) {
      window.clearTimeout(loadingTimeoutRef.current);
    }

    // Set scenario immediately for the orchestrator
    const scenario = DEMO_SCENARIOS.default; // Use default scenario for now
    
    // Simulate loading with skeleton animation (800-1000ms delay as specified)
    const loadingDelay = 900; // 900ms for optimal UX
    loadingTimeoutRef.current = window.setTimeout(() => {
      setDemoState({
        isLoading: false,
        showResults: true,
        currentScenario: scenario
      });

      // Track advisor response render events
      scenario.advisors.forEach((advisor) => {
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'advisor_response_render', {
            advisor_id: advisor.id,
            board_type: advisor.boardId
          });
        }
      });

      // Track summary render event
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'summary_render', {
          response_count: scenario.advisors.length
        });
      }
    }, loadingDelay);
    
    // Set the scenario immediately so the orchestrator can prepare
    setDemoState(prev => ({
      ...prev,
      isLoading: true,
      showResults: false,
      currentScenario: scenario
    }));
  };

  const handleReset = () => {
    if (loadingTimeoutRef.current) {
      window.clearTimeout(loadingTimeoutRef.current);
    }
    
    setDemoState({
      isLoading: false,
      showResults: false,
      currentScenario: null
    });
    
    setDemoQuestion(DEFAULT_DEMO_QUESTION);
    inputRef.current?.focus();
  };

  const { isLoading, showResults, currentScenario } = demoState;

  return (
    <div className={`demo-input-container ${className}`}>
      {/* Demo Input Form */}
      <form onSubmit={handleDemoSubmit} className="mb-6">
        <label 
          htmlFor={`demo-question-${variant}`} 
          className="block text-sm font-medium text-ink-700 mb-3"
        >
          Ask your question to AI advisors
        </label>
        <div className="flex flex-col gap-3">
          <textarea
            ref={inputRef}
            id={`demo-question-${variant}`}
            value={demoQuestion}
            onChange={(e) => setDemoQuestion(e.target.value)}
            placeholder="e.g., Should we run a dose-escalation pilot?"
            className="premium-input w-full px-4 py-3 border border-ink-200 rounded-lg resize-none focus-ring interactive-element"
            rows={3}
            maxLength={200}
            disabled={isLoading}
            aria-describedby={`demo-disclaimer-${variant}`}
          />
          <div className="flex gap-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!demoQuestion.trim() || isLoading}
              className="btn-premium flex-1 touch-target"
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Getting Advice...
                </>
              ) : (
                '🚀 Get Multi-Expert Advice'
              )}
            </Button>
            {showResults && (
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleReset}
                className="btn-secondary px-4 touch-target"
                aria-label="Reset demo"
              >
                ↻
              </Button>
            )}
          </div>
        </div>
      </form>

      {/* Disclaimer Banner - Always visible under input */}
      <div 
        id={`demo-disclaimer-${variant}`}
        className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg"
        role="note"
        aria-label="Demo disclaimer"
      >
        <p className="text-xs text-blue-700">
          ✨ This is a demo simulation. Real AI advisors provide personalized responses.
        </p>
      </div>

      {/* Demo Results */}
      {(isLoading || showResults) && (
        <div className="demo-results" aria-live="polite" aria-busy={isLoading}>
          {/* Show skeleton loading immediately when loading starts */}
          {isLoading && (
            <div className="skeleton-container space-y-3" aria-label="Loading advisor responses">
              <div className="skeleton-card clinical" aria-hidden="true">
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 skeleton rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="skeleton-text short"></div>
                      <div className="skeleton-text medium"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="skeleton-text long"></div>
                    <div className="skeleton-text medium"></div>
                  </div>
                </div>
              </div>
              
              <div className="skeleton-card product" aria-hidden="true">
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 skeleton rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="skeleton-text short"></div>
                      <div className="skeleton-text medium"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="skeleton-text long"></div>
                    <div className="skeleton-text short"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Show results when loading is complete */}
          {showResults && currentScenario && (
            <StaticDemoOrchestrator
              scenario={currentScenario}
              isActive={showResults}
              onComplete={() => {
                // Demo completion callback
                console.log('Demo completed');
              }}
            />
          )}

          {/* CTA to Full Experience */}
          {showResults && onStartSession && (
            <div className="pt-6 border-t border-ink-200 mt-6">
              <Button
                onClick={onStartSession}
                variant="outline"
                size="sm"
                className="w-full text-blue-600 border-blue-200 hover:bg-blue-50 touch-target"
              >
                Start Full Session →
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DemoInput;
