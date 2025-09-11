/**
 * CoordinatedResponsePanel Component
 * Enhanced side-by-side layout for multi-board responses with progressive loading
 * Patch: clamp long text + Show more/less, scrub “As Dr…”, show medical disclaimer for Clinical/Remedi
 */

import React, { useState, useEffect } from 'react';
import type { Board } from '../../lib/boards';
import Card from '../common/Card';
import Button from '../common/Button';
import type { StaticMultiBoardResult } from '../../services/staticMultiBoardService';
import { useEntranceAnimations } from '../../utils/animationObserver';

interface CoordinatedResponsePanelProps {
  results: StaticMultiBoardResult;
  selectedBoards: Board[];
  question: string;
  onReset?: () => void;
  className?: string;
}

interface BoardResponseCardProps {
  boardResponse: any;
  board: Board;
  isLoading?: boolean;
  delay?: number;
}

const BoardResponseCard: React.FC<BoardResponseCardProps> = ({
  boardResponse,
  board,
  isLoading = false,
  delay = 0
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  if (isLoading) {
    return (
      <Card className="multi-board-loading-skeleton relative overflow-hidden border-2 shadow-lg">
        {/* Enhanced loading state with board theming */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundColor: board.color.primary }}></div>
        <div className="relative shimmer-content">
          {/* Board header skeleton */}
          <div className="flex items-center gap-4 mb-24">
            <div
              className="w-12 h-12 rounded-full shadow-lg skeleton"
              style={{ backgroundColor: board.color.primary }}
            >
              <div className="w-full h-full rounded-full bg-white/30"></div>
            </div>
            <div className="flex-1">
              <div className="skeleton-text h-6 w-48 mb-12"></div>
              <div className="skeleton-text h-4 w-32"></div>
            </div>
            <div className="skeleton w-16 h-8 rounded-full"></div>
          </div>

          {/* Coordination context skeleton */}
          <div className="mb-24 p-4 bg-blue-50 rounded-xl border-l-4 border-blue-200">
            <div className="skeleton-text h-4 w-64"></div>
          </div>

          {/* Expert responses skeleton */}
          <div className="space-y-24">
            {[1, 2].map((i) => (
              <div key={i} className="border-l-4 pl-24 py-16" style={{ borderColor: board.color.primary }}>
                <div className="flex items-center gap-12 mb-16">
                  <div
                    className="skeleton w-10 h-10 rounded-full"
                    style={{ backgroundColor: board.color.primary }}
                  ></div>
                  <div className="flex-1">
                    <div className="skeleton-text h-4 w-32 mb-8"></div>
                    <div className="skeleton-text h-3 w-24"></div>
                  </div>
                  <div className="flex gap-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <div key={star} className="skeleton w-2 h-2 rounded-full"></div>
                    ))}
                  </div>
                </div>
                <div className="space-y-12">
                  <div className="skeleton-text h-3 w-full"></div>
                  <div className="skeleton-text h-3 w-5/6"></div>
                  <div className="skeleton-text h-3 w-4/5"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Processing indicator */}
          <div className="mt-24 flex items-center justify-center gap-12 p-16 bg-gray-50 rounded-xl">
            <div
              className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"
              style={{ borderTopColor: board.color.primary }}
            ></div>
            <span className="text-sm font-medium text-gray-600">Generating coordinated response...</span>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div
      className={`board-response-card relative transition-all duration-700 transform ${
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
      }`}
      style={{
        // soft themed bg + border accent
        // @ts-ignore custom CSS vars are fine
        '--board-color': board.color.primary,
        borderColor: `${board.color.primary}40`,
        background: `linear-gradient(135deg, ${board.color.background}20, white)`
      }}
    >
      {/* Animated border accent */}
      <div
        className="absolute top-0 left-0 right-0 h-1 transition-all duration-500"
        style={{
          background: `linear-gradient(90deg, ${board.color.primary}, ${board.color.primary}80)`,
          boxShadow: `0 0 20px ${board.color.primary}40`
        }}
      ></div>

      {/* Board Header with Badge and Status */}
      <div className="flex items-center justify-between mb-24 p-6">
        <div className="flex items-center gap-12">
          <div className="board-badge" style={{ backgroundColor: board.color.primary }}>
            {boardResponse.boardName.split(' ').map((word: string) => word[0]).join('').slice(0, 2)}
            <span>{boardResponse.boardName}</span>
          </div>
          <div className="status-chip ready">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Response Ready
          </div>
        </div>
        <div className="text-sm text-gray-500">
          {boardResponse.responses.length} expert{boardResponse.responses.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* Coordination Context */}
      {boardResponse.coordinationContext && (
        <div className="mx-6 mb-24 p-20 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200/50 shadow-sm">
          <p className="text-blue-800 font-medium leading-relaxed">{boardResponse.coordinationContext}</p>
        </div>
      )}

      {/* Expert Responses */}
      <div className="space-y-24 px-6 pb-6">
        {boardResponse.responses.map((response: any, index: number) => (
          <ExpertResponseCard key={response.advisorId} response={response} board={board} index={index} />
        ))}
      </div>
    </div>
  );
};

interface ExpertResponseCardProps {
  response: any;
  board: Board;
  index: number;
}

const ExpertResponseCard: React.FC<ExpertResponseCardProps> = ({ response, board, index }) => {
  const [expanded, setExpanded] = useState(false);

  // detect board lanes for disclaimer
  const boardId = String(board.id || '').toLowerCase();
  const boardTitle = String(board.title || '').toLowerCase();
  const isClinical = /clinic/.test(boardId) || /clinic/.test(boardTitle);
  const isRemedi = /(remedi|holistic|wellness)/.test(boardId) || /(remedi|holistic|wellness)/.test(boardTitle);

  // normalize/scrub intros
  const raw = String(response?.content ?? '');
  const cleaned = raw
    .replace(/^As\s+Dr\.[^\n]*\n+/i, '')   // “As Dr. …”
    .replace(/^As\s+a\s+[^\n]*\n+/i, '')   // “As a …”
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const isLong = cleaned.length > 450;

  // bullet controls
  let bulletCount = 0;
  const MAX_BULLETS = 5;
  const MAX_WORDS = 12;

  const clampClass = expanded ? '' : 'ab-answer clamp-8';

  return (
    <div className="border-l-4 pl-24 py-8 transition-all duration-300 hover:bg-gray-50 rounded-r-lg" style={{ borderColor: board.color.primary }}>
      {/* Expert Header */}
      <div className="flex items-center gap-12 mb-12">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
            style={{ backgroundColor: board.color.primary }}
          >
            {String(response?.persona?.name || '')
              .split(' ')
              .map((n: string) => n[0])
              .join('')}
          </div>
          <div>
            <span className="font-semibold text-gray-900">{response?.persona?.name}</span>
            <div className="text-sm text-gray-600">{response?.persona?.expertise}</div>
          </div>
        </div>
      </div>

      {/* Lane-Locked Response Content (clamped + toggle) */}
      <div className={`lane-locked-content ${clampClass}`}>
        {cleaned.split('\n').map((paragraph: string, pIndex: number) => {
          const line = paragraph.trim();
          if (!line) return null;

          // verdict line
          if (line.startsWith('**Verdict:**')) {
            return (
              <div key={pIndex} className="verdict-format mb-3 font-semibold text-gray-900">
                {line.replace('**Verdict:**', '').trim()}
              </div>
            );
          }

          // bullets (limit count + words)
          if (line.startsWith('- ')) {
            if (bulletCount >= MAX_BULLETS) return null;
            bulletCount++;
            const words = line.substring(2).split(/\s+/);
            const trimmed = words.slice(0, MAX_WORDS).join(' ');
            return (
              <ul key={pIndex} className="bullet-list list-disc ml-6">
                <li>{trimmed}{words.length > MAX_WORDS ? '…' : ''}</li>
              </ul>
            );
          }

          // disclosure line (render in footer, so skip here)
          if (line.startsWith('**Disclosure:**')) return null;

          // default paragraph
          return (
            <p key={pIndex} className="mb-12 last:mb-0 leading-relaxed text-gray-700">
              {line}
            </p>
          );
        })}
      </div>

      {/* Toggle */}
      {isLong && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-xs font-medium underline text-slate-600 hover:text-slate-900"
            aria-expanded={expanded}
            aria-label={expanded ? 'Show less' : 'Show more'}
          >
            {expanded ? 'Show less' : 'Show more'}
          </button>
        </div>
      )}

      {/* AI Disclaimer */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span aria-hidden="true">🤖</span>
          <span>
            {isClinical || isRemedi
              ? 'AI persona. Educational only — not medical advice.'
              : 'Simulated AI persona response.'}
          </span>
        </div>
      </div>
    </div>
  );
};

const CoordinatedResponsePanel: React.FC<CoordinatedResponsePanelProps> = ({
  results,
  selectedBoards,
  question,
  onReset,
  className = ''
}) => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [coordinationPhase, setCoordinationPhase] =
    useState<'analyzing' | 'coordinating' | 'synthesizing' | 'complete'>('analyzing');

  // Initialize entrance animations
  useEntranceAnimations();

  // Enhanced progressive loading with coordination phases
  useEffect(() => {
    const initialStates: Record<string, boolean> = {};
    results.responses.forEach((response) => {
      initialStates[response.boardId] = true;
    });
    setLoadingStates(initialStates);

    // Coordination phases
    const phases = [
      { phase: 'analyzing', duration: 500 },
      { phase: 'coordinating', duration: 800 },
      { phase: 'synthesizing', duration: 600 }
    ];

    let totalDelay = 0;
    phases.forEach(({ phase, duration }) => {
      setTimeout(() => {
        setCoordinationPhase(phase as any);
      }, totalDelay);
      totalDelay += duration;
    });

    // Progressively show boards with staggered animation
    results.responses.forEach((response, index) => {
      setTimeout(() => {
        setLoadingStates((prev) => ({
          ...prev,
          [response.boardId]: false
        }));
      }, 1000 + index * 600);
    });

    // Mark coordination complete
    setTimeout(() => {
      setCoordinationPhase('complete');
    }, 1000 + results.responses.length * 600 + 500);
  }, [results]);

  return (
    <div className={`page-container space-y-32 ${className}`}>
      {/* Panel Header with Question and Tabs */}
      <div className="response-panel-header">
        <div className="response-question type-h2 mb-16">{question}</div>
        <div className="flex items-center gap-16 mb-16">
          <div className="text-sm text-gray-600">Selected boards: {selectedBoards.map((b) => b.title).join(', ')}</div>
          <div className="text-xs text-gray-400">Session · {new Date().toLocaleTimeString()}</div>
        </div>
        <div className="response-tabs">
          <div className="response-tab active">Board Responses</div>
          <div className="response-tab">Coordinated Analysis</div>
        </div>
      </div>

      {/* Synthesis Card */}
      {results.crossBoardSummary && (
        <Card className="p-6 bg-gradient-to-br from-emerald-50 to-blue-50 border-2 border-emerald-200/50">
          <div className="prose prose-sm max-w-none">
            <div dangerouslySetInnerHTML={{ __html: results.crossBoardSummary.replace(/\n/g, '<br>') }} />
          </div>
        </Card>
      )}

      {/* Enhanced Question Summary Header */}
      <div className="observe-entrance stagger-1">
        <Card className="relative overflow-hidden p-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200/50 shadow-xl">
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 animate-pulse"></div>
          </div>

          <div className="relative">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Multi-Board Consultation</h2>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full transition-colors duration-500 ${
                        coordinationPhase === 'complete' ? 'bg-green-500' : 'bg-blue-500 animate-pulse'
                      }`}
                    ></div>
                    <span className="text-sm font-medium text-gray-600">
                      {coordinationPhase === 'complete'
                        ? 'Coordination Complete'
                        : coordinationPhase === 'analyzing'
                        ? 'Analyzing Question...'
                        : coordinationPhase === 'coordinating'
                        ? 'Coordinating Boards...'
                        : 'Synthesizing Responses...'}
                    </span>
                  </div>
                </div>
              </div>

              {onReset && (
                <Button variant="outline" size="sm" onClick={onReset} className="ml-4 hover:scale-105 transition-transform duration-200">
                  New Question
                </Button>
              )}
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/50">
              <p className="text-gray-800 text-lg leading-relaxed mb-6 font-medium">{question}</p>

              {/* Enhanced stats with visual indicators */}
              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center gap-3 px-4 py-2 bg-blue-100 rounded-full">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xs">{results.totalExperts}</span>
                  </div>
                  <span className="font-semibold text-blue-900">experts consulted</span>
                </div>

                <div className="flex items-center gap-3 px-4 py-2 bg-purple-100 rounded-full">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xs">{selectedBoards.length}</span>
                  </div>
                  <span className="font-semibold text-purple-900">advisory boards</span>
                </div>

                <div className="flex items-center gap-3 px-4 py-2 bg-emerald-100 rounded-full">
                  <div className="flex -space-x-1">
                    {selectedBoards.map((board) => (
                      <div
                        key={board.id}
                        className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: board.color.primary }}
                        title={board.title}
                      />
                    ))}
                  </div>
                  <span className="font-semibold text-emerald-900">coordinated domains</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Enhanced Board Responses Grid with coordination indicators */}
      <div className="observe-entrance stagger-2">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-xl font-bold text-gray-900">Board Responses</h3>
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-full">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-blue-800">Coordinated Analysis</span>
            </div>
          </div>
          <p className="text-gray-600">Each board provides domain-specific expertise while considering insights from other selected boards</p>
        </div>

        <div className="grid gap-24 lg:grid-cols-1 xl:grid-cols-2">
          {results.responses.map((boardResponse, index) => {
            const board = selectedBoards.find((b) => b.id === boardResponse.boardId);
            if (!board) return null;

            return (
              <div key={boardResponse.boardId} className="observe-entrance" style={{ animationDelay: `${(index + 2) * 200}ms` }}>
                <BoardResponseCard boardResponse={boardResponse} board={board} isLoading={loadingStates[boardResponse.boardId]} delay={index * 300} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Enhanced Cross-Board Synthesis */}
      {results.crossBoardSummary && (
        <div className="observe-entrance stagger-5">
          <CrossBoardSynthesis summary={results.crossBoardSummary} boardCount={selectedBoards.length} expertCount={results.totalExperts} selectedBoards={selectedBoards} />
        </div>
      )}
    </div>
  );
};

interface CrossBoardSynthesisProps {
  summary: string;
  boardCount: number;
  expertCount: number;
  selectedBoards: Board[];
}

const CrossBoardSynthesis: React.FC<CrossBoardSynthesisProps> = ({ summary, boardCount, expertCount, selectedBoards }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'entering' | 'synthesizing' | 'complete'>('entering');

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setIsVisible(true);
      setAnimationPhase('synthesizing');
    }, 2000); // Show after boards are loaded

    const timer2 = setTimeout(() => {
      setAnimationPhase('complete');
    }, 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <Card
      className={`relative overflow-hidden p-10 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-4 border-emerald-300/50 shadow-2xl transition-all duration-1000 transform ${
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'
      }`}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400 animate-pulse"></div>
      </div>

      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-emerald-400 rounded-full opacity-30 animate-bounce"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 3) * 20}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: '3s'
            }}
          />
        ))}
      </div>

      <div className="relative">
        {/* Enhanced header with coordination visualization */}
        <div className="flex items-start gap-6 mb-8">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl">
              {animationPhase === 'complete' ? (
                <svg className="w-8 h-8 text-white animate-scale-in" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>

            {/* Coordination rings */}
            <div className="absolute inset-0 rounded-2xl border-2 border-emerald-400 animate-ping opacity-30"></div>
            <div className="absolute inset-0 rounded-2xl border-2 border-teal-400 animate-ping opacity-20" style={{ animationDelay: '0.5s' }}></div>
          </div>

          <div className="flex-1">
            <h3 className="text-3xl font-bold text-emerald-900 mb-2">Cross-Board Synthesis</h3>
            <p className="text-emerald-700 text-lg mb-4">
              {animationPhase === 'complete'
                ? `Coordinated insights from ${boardCount} advisory boards • ${expertCount} experts`
                : animationPhase === 'synthesizing'
                ? 'Synthesizing coordinated insights...'
                : 'Preparing synthesis...'}
            </p>

            {/* Board coordination visualization */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-emerald-800">Coordinated Domains:</span>
              <div className="flex items-center gap-2">
                {selectedBoards.map((board, index) => (
                  <div key={board.id} className="flex items-center gap-1">
                    <div
                      className="w-4 h-4 rounded-full border-2 border-white shadow-sm transition-all duration-500"
                      style={{
                        backgroundColor: board.color.primary,
                        transform: isVisible ? 'scale(1)' : 'scale(0)',
                        transitionDelay: `${index * 200}ms`
                      }}
                      title={board.title}
                    />
                    {index < selectedBoards.length - 1 && (
                      <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Summary content */}
        <div className="prose prose-lg max-w-none text-gray-800">
          {summary.split('\n').map((line, index) => {
            if (!line.trim()) return null;

            if (line.startsWith('##')) {
              return (
                <h4 key={index} className="text-xl font-bold text-emerald-900 mt-6 mb-3 first:mt-0">
                  {line.replace('##', '').trim()}
                </h4>
              );
            }

            if (line.startsWith('###')) {
              return (
                <h5 key={index} className="text-lg font-semibold text-emerald-800 mt-4 mb-2">
                  {line.replace('###', '').trim()}
                </h5>
              );
            }

            if (line.startsWith('**') && line.endsWith('**')) {
              return (
                <p key={index} className="font-semibold text-emerald-900 mb-3">
                  {line.replace(/\*\*/g, '')}
                </p>
              );
            }

            if (line.startsWith('*') && line.endsWith('*')) {
              return (
                <p key={index} className="italic text-emerald-700 mb-3 text-lg">
                  {line.replace(/\*/g, '')}
                </p>
              );
            }

            if (line.trim()) {
              return (
                <p key={index} className="mb-4 leading-relaxed">
                  {line}
                </p>
              );
            }

            return null;
          })}
        </div>
      </div>
    </Card>
  );
};

export default CoordinatedResponsePanel;
