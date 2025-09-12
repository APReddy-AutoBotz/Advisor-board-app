/**
 * MultiBoardLoadingCard Component
 * Enhanced loading states for multi-board consultations with progressive indicators
 */

import React, { useState, useEffect } from 'react';
import type { Board } from '../../lib/boards';
import Card from '../common/Card';
import { getBoardTheme } from '../../lib/boardThemes';

interface MultiBoardLoadingCardProps {
  selectedBoards: Board[];
  question: string;
  className?: string;
}

interface BoardLoadingState {
  boardId: string;
  status: 'waiting' | 'processing' | 'completed';
  progress: number;
}

const MultiBoardLoadingCard: React.FC<MultiBoardLoadingCardProps> = ({
  selectedBoards,
  question,
  className = ''
}) => {
  const [boardStates, setBoardStates] = useState<BoardLoadingState[]>([]);
  const [currentPhase, setCurrentPhase] = useState<'analyzing' | 'coordinating' | 'generating'>('analyzing');

  useEffect(() => {
    // Initialize board states
    const initialStates = selectedBoards.map(board => ({
      boardId: board.id,
      status: 'waiting' as const,
      progress: 0
    }));
    setBoardStates(initialStates);

    // Simulate progressive loading phases
    const phases = [
      { phase: 'analyzing', duration: 1000 },
      { phase: 'coordinating', duration: 1500 },
      { phase: 'generating', duration: 2000 }
    ];

    let totalDelay = 0;
    phases.forEach(({ phase, duration }) => {
      setTimeout(() => {
        setCurrentPhase(phase as any);
      }, totalDelay);
      totalDelay += duration;
    });

    // Start processing boards sequentially
    selectedBoards.forEach((board, index) => {
      const startDelay = 1500 + (index * 800);
      
      // Start processing
      setTimeout(() => {
        setBoardStates(prev => prev.map(state => 
          state.boardId === board.id 
            ? { ...state, status: 'processing' }
            : state
        ));
      }, startDelay);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setBoardStates(prev => prev.map(state => {
          if (state.boardId === board.id && state.status === 'processing') {
            const newProgress = Math.min(state.progress + Math.random() * 20, 100);
            return { ...state, progress: newProgress };
          }
          return state;
        }));
      }, 200);

      // Complete processing
      setTimeout(() => {
        clearInterval(progressInterval);
        setBoardStates(prev => prev.map(state => 
          state.boardId === board.id 
            ? { ...state, status: 'completed', progress: 100 }
            : state
        ));
      }, startDelay + 2000);
    });
  }, [selectedBoards]);

  const getPhaseDescription = () => {
    switch (currentPhase) {
      case 'analyzing':
        return 'Analyzing your question and determining optimal coordination strategy...';
      case 'coordinating':
        return 'Coordinating between advisory boards to ensure comprehensive coverage...';
      case 'generating':
        return 'Generating coordinated responses from selected expert panels...';
      default:
        return 'Processing your multi-board consultation...';
    }
  };

  const getStatusIcon = (status: BoardLoadingState['status']) => {
    switch (status) {
      case 'waiting':
        return '⏳';
      case 'processing':
        return '🔄';
      case 'completed':
        return '✅';
      default:
        return '⏳';
    }
  };

  return (
    <Card className={`relative overflow-hidden p-10 ${className}`}>
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 opacity-50"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-emerald-600/5 animate-pulse"></div>
      
      <div className="relative">
        {/* Enhanced Main Loading Header */}
        <div className="text-center mb-10">
          <div className="relative mb-6">
            {/* Multi-layered loading animation */}
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 animate-spin border-4 border-blue-500 border-t-transparent rounded-full"></div>
              <div className="absolute inset-2 animate-spin border-4 border-purple-500 border-t-transparent rounded-full" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              <div className="absolute inset-4 animate-spin border-4 border-emerald-500 border-t-transparent rounded-full" style={{ animationDuration: '2s' }}></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 via-purple-500 to-emerald-500 rounded-full animate-pulse"></div>
              </div>
            </div>
            
            {/* Floating coordination indicators */}
            <div className="absolute inset-0 flex items-center justify-center">
              {selectedBoards.map((board, index) => {
                const theme = getBoardTheme(board.id);
                const angle = (index * 360) / selectedBoards.length;
                const radius = 50;
                const x = Math.cos((angle * Math.PI) / 180) * radius;
                const y = Math.sin((angle * Math.PI) / 180) * radius;
                
                return (
                  <div
                    key={board.id}
                    className="absolute w-4 h-4 rounded-full animate-bounce"
                    style={{
                      backgroundColor: theme.accent,
                      transform: `translate(${x}px, ${y}px)`,
                      animationDelay: `${index * 0.3}s`,
                      animationDuration: '2s'
                    }}
                  />
                );
              })}
            </div>
          </div>
          
          <h3 className="text-3xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent">
            Multi-Board Consultation in Progress
          </h3>
          
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className={`w-3 h-3 rounded-full transition-all duration-500 ${
              currentPhase === 'analyzing' ? 'bg-blue-500 animate-pulse scale-125' : 'bg-gray-300'
            }`}></div>
            <div className={`w-3 h-3 rounded-full transition-all duration-500 ${
              currentPhase === 'coordinating' ? 'bg-purple-500 animate-pulse scale-125' : 'bg-gray-300'
            }`}></div>
            <div className={`w-3 h-3 rounded-full transition-all duration-500 ${
              currentPhase === 'generating' ? 'bg-emerald-500 animate-pulse scale-125' : 'bg-gray-300'
            }`}></div>
          </div>
          
          <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto font-medium">
            {getPhaseDescription()}
          </p>

          {/* Enhanced Question Display */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/50 shadow-lg">
            <div className="flex items-center justify-center gap-2 mb-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Your Question</p>
            </div>
            <p className="text-gray-900 font-medium text-lg leading-relaxed">{question}</p>
          </div>
        </div>

        {/* Enhanced Board Progress Indicators */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <h4 className="text-xl font-bold text-gray-900">Advisory Board Progress</h4>
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-full">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-blue-800">Coordinated Processing</span>
            </div>
          </div>
          
          {selectedBoards.map((board, index) => {
            const theme = getBoardTheme(board.id);
            const boardState = boardStates.find(state => state.boardId === board.id);
            const status = boardState?.status || 'waiting';
            const progress = boardState?.progress || 0;

            return (
              <div 
                key={board.id} 
                className="relative overflow-hidden bg-white rounded-2xl border-2 shadow-lg transition-all duration-500 hover:shadow-xl"
                style={{ 
                  borderColor: status === 'completed' ? theme.accent : '#e5e7eb',
                  transform: status === 'processing' ? 'scale(1.02)' : 'scale(1)'
                }}
              >
                {/* Animated background for active board */}
                {status === 'processing' && (
                  <div 
                    className="absolute inset-0 opacity-5 animate-pulse"
                    style={{ backgroundColor: theme.accent }}
                  ></div>
                )}
                
                <div className="relative p-6">
                  <div className="flex items-center gap-4">
                    {/* Enhanced Board Indicator */}
                    <div className="relative">
                      <div 
                        className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300"
                        style={{ 
                          backgroundColor: theme.accent,
                          transform: status === 'processing' ? 'scale(1.1)' : 'scale(1)',
                          boxShadow: status === 'processing' ? `0 0 30px ${theme.accent}40` : 'none'
                        }}
                      >
                        <span className="text-white font-bold text-lg">
                          {board.title.split(' ').map(word => word[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                      
                      {/* Status indicator */}
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center"
                           style={{ backgroundColor: 
                             status === 'completed' ? '#10b981' : 
                             status === 'processing' ? '#f59e0b' : '#6b7280' 
                           }}>
                        <span className="text-white text-xs font-bold">{getStatusIcon(status)}</span>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h5 className="text-lg font-bold text-gray-900">{board.title}</h5>
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
                             style={{ 
                               backgroundColor: theme.chip.background,
                               color: theme.chip.text 
                             }}>
                          <span>{board.experts.length} experts</span>
                        </div>
                      </div>
                      
                      {/* Enhanced Progress Bar */}
                      <div className="relative">
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div 
                            className="h-3 rounded-full transition-all duration-500 relative"
                            style={{ 
                              backgroundColor: theme.accent,
                              width: `${progress}%`
                            }}
                          >
                            {status === 'processing' && (
                              <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                            )}
                          </div>
                        </div>
                        
                        {/* Progress percentage */}
                        {status === 'processing' && (
                          <div className="absolute right-0 -top-6 text-xs font-bold" style={{ color: theme.accent }}>
                            {Math.round(progress)}%
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Enhanced Status Text */}
                    <div className="text-right min-w-[120px]">
                      <div className="text-sm font-bold text-gray-900 capitalize mb-1">
                        {status === 'processing' ? 'Generating...' : 
                         status === 'completed' ? 'Complete' : 'Waiting'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {status === 'processing' ? 'Analyzing & coordinating' :
                         status === 'completed' ? 'Response ready' : 'In queue'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

        {/* Enhanced Coordination Status */}
        <div className="mt-8 p-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border-2 border-emerald-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h5 className="font-bold text-emerald-900">Cross-Board Coordination Active</h5>
                <div className="flex gap-1">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" 
                         style={{ animationDelay: `${i * 0.2}s` }}></div>
                  ))}
                </div>
              </div>
              <p className="text-emerald-700 leading-relaxed">
                Ensuring responses are complementary and address all aspects of your question across {selectedBoards.length} domains
              </p>
              
              {/* Coordination visualization */}
              <div className="mt-4 flex items-center gap-2">
                <span className="text-xs font-medium text-emerald-800">Coordinating:</span>
                <div className="flex items-center gap-1">
                  {selectedBoards.map((board, index) => {
                    const theme = getBoardTheme(board.id);
                    return (
                      <div key={board.id} className="flex items-center gap-1">
                        <div
                          className="w-3 h-3 rounded-full animate-pulse"
                          style={{ 
                            backgroundColor: theme.accent,
                            animationDelay: `${index * 0.3}s`
                          }}
                        />
                        {index < selectedBoards.length - 1 && (
                          <svg className="w-2 h-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

        {/* Enhanced Expected Completion */}
        <div className="mt-6 text-center p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center justify-center gap-2 mb-2">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-semibold text-gray-700">Estimated completion</span>
          </div>
          <p className="text-lg font-bold text-gray-900">
            ~{Math.max(5, 15 - Math.floor(Date.now() / 1000) % 15)} seconds
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Processing {selectedBoards.reduce((total, board) => total + board.experts.length, 0)} expert responses
          </p>
        </div>
      </div>
    </Card>
  );
};

export default MultiBoardLoadingCard;
