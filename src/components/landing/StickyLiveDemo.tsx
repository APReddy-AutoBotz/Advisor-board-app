/**
 * Sticky Live Demo - Left Rail + Right Stream
 * Interactive demo showing advisor responses with skeletons and smooth reveal
 */

import React, { useState, useEffect } from 'react';
import { trackEvent } from '../../lib/boards';
import { getBoardTheme } from '../../lib/boardThemes';
import Button from '../common/Button';

interface StickyLiveDemoProps {
  className?: string;
}

interface AdvisorResponse {
  id: string;
  name: string;
  role: string;
  response: string;
  boardId: string;
  delay: number;
}

const DEMO_RESPONSES: AdvisorResponse[] = [
  {
    id: 'clinical-1',
    name: 'Dr. Sarah Chen',
    role: 'Clinical Research Director',
    response: 'From a regulatory perspective, ensure your study design meets FDA guidelines for Phase II trials. Consider adaptive trial designs to optimize patient enrollment and reduce timeline risks.',
    boardId: 'cliniboard',
    delay: 800,
  },
  {
    id: 'product-1', 
    name: 'Marcus Rodriguez',
    role: 'Senior Product Manager',
    response: 'Focus on user validation early. I recommend conducting 15-20 user interviews before building. Use Jobs-to-be-Done framework to identify the core problem you\'re solving.',
    boardId: 'productboard',
    delay: 1200,
  },
  {
    id: 'education-1',
    name: 'Prof. Amara Okafor',
    role: 'Learning Experience Designer',
    response: 'Apply Bloom\'s Taxonomy to structure your curriculum. Start with knowledge acquisition, then move to application and synthesis. Include formative assessments every 2-3 modules.',
    boardId: 'eduboard',
    delay: 1600,
  },
  {
    id: 'remedy-1',
    name: 'Dr. Kenji Nakamura',
    role: 'Integrative Medicine Specialist',
    response: 'Consider a holistic approach combining nutrition, movement, and stress management. Start with an elimination diet to identify triggers, then gradually introduce targeted supplements.',
    boardId: 'remediboard',
    delay: 2000,
  },
];

const DEMO_SUMMARY = {
  title: 'Topline Summary',
  content: 'All advisors recommend a validation-first approach with regulatory compliance, user research, structured learning, and holistic wellness integration. Key themes: early validation, regulatory awareness, systematic methodology, and integrated solutions.',
  delay: 2400,
};

interface ResponseSkeletonProps {
  boardId: string;
}

const ResponseSkeleton: React.FC<ResponseSkeletonProps> = ({ boardId }) => {
  const theme = getBoardTheme(boardId);
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-card ring-1 ring-ink-200 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center gap-4 mb-4">
        <div 
          className="w-12 h-12 rounded-lg"
          style={{ backgroundColor: theme.background.medium }}
        />
        <div className="flex-1">
          <div className="h-4 bg-ink-200 rounded w-32 mb-2" />
          <div className="h-3 bg-ink-100 rounded w-48" />
        </div>
      </div>
      
      {/* Content Skeleton */}
      <div className="space-y-2">
        <div className="h-3 bg-ink-100 rounded w-full" />
        <div className="h-3 bg-ink-100 rounded w-5/6" />
        <div className="h-3 bg-ink-100 rounded w-4/5" />
      </div>
    </div>
  );
};

interface AdvisorResponseCardProps {
  response: AdvisorResponse;
  isVisible: boolean;
}

const AdvisorResponseCard: React.FC<AdvisorResponseCardProps> = ({ response, isVisible }) => {
  const theme = getBoardTheme(response.boardId);
  
  if (!isVisible) {
    return <ResponseSkeleton boardId={response.boardId} />;
  }
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-card ring-1 ring-ink-200 animate-fade-in">
      {/* Advisor Header */}
      <div className="flex items-center gap-4 mb-4">
        <div 
          className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm"
          style={{ backgroundColor: theme.accent }}
        >
          {response.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-ink-900">{response.name}</h4>
          <p className="text-sm text-ink-600">{response.role}</p>
        </div>
        <div 
          className="px-2 py-1 rounded text-xs font-medium"
          style={{ 
            backgroundColor: theme.background.medium,
            color: theme.text.secondary 
          }}
        >
          {theme.name.split(' ')[0]}
        </div>
      </div>
      
      {/* Response Content */}
      <p className="text-ink-700 leading-relaxed">{response.response}</p>
    </div>
  );
};

interface SummaryCardProps {
  isVisible: boolean;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ isVisible }) => {
  if (!isVisible) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 shadow-card ring-1 ring-blue-200 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-blue-200 rounded-lg" />
          <div className="h-5 bg-blue-200 rounded w-32" />
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-blue-100 rounded w-full" />
          <div className="h-3 bg-blue-100 rounded w-5/6" />
          <div className="h-3 bg-blue-100 rounded w-4/5" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 shadow-card ring-1 ring-blue-200 animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h4 className="font-semibold text-ink-900">{DEMO_SUMMARY.title}</h4>
      </div>
      <p className="text-ink-700 leading-relaxed">{DEMO_SUMMARY.content}</p>
    </div>
  );
};

const StickyLiveDemo: React.FC<StickyLiveDemoProps> = ({ className = '' }) => {
  const [question, setQuestion] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [visibleResponses, setVisibleResponses] = useState<Set<string>>(new Set());
  const [showSummary, setShowSummary] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    
    trackEvent('demo_submit', { question: question.substring(0, 50) });
    setIsSubmitted(true);
    
    // Animate responses appearing
    DEMO_RESPONSES.forEach((response) => {
      setTimeout(() => {
        setVisibleResponses(prev => new Set([...prev, response.id]));
        trackEvent('advisor_response_render', { advisor_id: response.id, board: response.boardId });
      }, response.delay);
    });
    
    // Show summary last
    setTimeout(() => {
      setShowSummary(true);
      trackEvent('summary_render', { responses_count: DEMO_RESPONSES.length });
    }, DEMO_SUMMARY.delay);
  };

  const handleReset = () => {
    setQuestion('');
    setIsSubmitted(false);
    setVisibleResponses(new Set());
    setShowSummary(false);
  };

  return (
    <section className={`py-16 sm:py-24 bg-gradient-to-br from-gray-50 to-blue-50 ${className}`}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
            See It In Action
          </h2>
          <p className="mt-4 text-lg leading-8 text-ink-600">
            Watch how our AI advisors collaborate to provide comprehensive, multi-perspective insights in real-time.
          </p>
        </div>

        {/* Demo Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Rail - Sticky Input */}
          <div className="lg:col-span-2">
            <div className="sticky top-8">
              <div className="bg-white rounded-xl p-6 shadow-card ring-1 ring-ink-200">
                <h3 className="text-lg font-semibold text-ink-900 mb-4">
                  Ask Your Question
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="demo-question" className="block text-sm font-medium text-ink-700 mb-2">
                      Your Question
                    </label>
                    <textarea
                      id="demo-question"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="How should I validate my product concept before building?"
                      rows={4}
                      className="w-full px-4 py-3 border border-ink-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      disabled={isSubmitted}
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      disabled={!question.trim() || isSubmitted}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitted ? 'Consulting...' : 'Ask Advisors'}
                    </Button>
                    
                    {isSubmitted && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleReset}
                        className="px-4"
                      >
                        Reset
                      </Button>
                    )}
                  </div>
                </form>
                
                {/* Helper Text */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <span className="font-medium">💡 Try asking:</span> Product validation strategies, clinical trial design, curriculum development, or wellness program planning.
                  </p>
                </div>
                
                {/* Disclaimer */}
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-xs text-yellow-800">
                    🤖 Demo responses are simulated for illustration. Real consultations provide personalized, context-aware advice.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Stream - Responses */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {/* Question Display */}
              {isSubmitted && (
                <div className="bg-blue-50 rounded-xl p-6 border border-blue-200 animate-fade-in">
                  <h4 className="font-semibold text-blue-900 mb-2">Your Question</h4>
                  <p className="text-blue-800 italic">"{question}"</p>
                </div>
              )}
              
              {/* Advisor Responses */}
              {isSubmitted && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-ink-900 flex items-center gap-2">
                    <span>🎯 Expert Advisory Responses</span>
                    {visibleResponses.size > 0 && (
                      <span className="text-sm font-normal text-ink-600">
                        ({visibleResponses.size}/{DEMO_RESPONSES.length})
                      </span>
                    )}
                  </h4>
                  
                  {DEMO_RESPONSES.map((response) => (
                    <AdvisorResponseCard
                      key={response.id}
                      response={response}
                      isVisible={visibleResponses.has(response.id)}
                    />
                  ))}
                </div>
              )}
              
              {/* Summary */}
              {isSubmitted && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-ink-900">📊 Synthesis</h4>
                  <SummaryCard isVisible={showSummary} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StickyLiveDemo;