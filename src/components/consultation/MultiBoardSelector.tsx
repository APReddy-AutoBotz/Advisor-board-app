import React, { useState, useEffect } from 'react';
import { getAllBoards, type Board } from '../../lib/boards';
import { getBoardTheme } from '../../lib/boardThemes';
import Card from '../common/Card';
import { useEntranceAnimations } from '../../utils/animationObserver';

interface MultiBoardSelectorProps {
  availableBoards?: Board[];
  selectedBoards: Board[];
  onBoardSelection: (boards: Board[]) => void;
  maxSelections?: number;
  className?: string;
}

const MultiBoardSelector: React.FC<MultiBoardSelectorProps> = ({
  availableBoards,
  selectedBoards,
  onBoardSelection,
  maxSelections = 4,
  className = ''
}) => {
  const [boards] = useState<Board[]>(availableBoards || getAllBoards());
  const [validationMessage, setValidationMessage] = useState<string>('');
  const [isAnimated, setIsAnimated] = useState(false);

  // Initialize entrance animations
  useEntranceAnimations();

  // Validate selection whenever selectedBoards changes
  useEffect(() => {
    if (selectedBoards.length === 0) {
      setValidationMessage('');
    } else if (selectedBoards.length === 1) {
      setValidationMessage('Select at least one more board to enable multi-board consultation');
    } else if (selectedBoards.length >= 2) {
      setValidationMessage('');
    }
  }, [selectedBoards]);

  // Trigger animation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimated(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleBoardToggle = (board: Board) => {
    const isSelected = selectedBoards.some(selected => selected.id === board.id);
    
    if (isSelected) {
      // Remove board from selection
      const newSelection = selectedBoards.filter(selected => selected.id !== board.id);
      onBoardSelection(newSelection);
    } else {
      // Add board to selection (if under max limit)
      if (selectedBoards.length < maxSelections) {
        const newSelection = [...selectedBoards, board];
        onBoardSelection(newSelection);
      }
    }
  };

  const isSelected = (board: Board) => selectedBoards.some(selected => selected.id === board.id);
  const isMaxReached = selectedBoards.length >= maxSelections;

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header with enhanced visual impact */}
      <div className="text-center observe-entrance stagger-1">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-emerald-600/20 blur-3xl opacity-30"></div>
          <h2 className="relative text-3xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent">
            Select Advisory Boards
          </h2>
          <div className="relative w-24 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 mx-auto rounded-full"></div>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Choose 2 or more boards to get coordinated expert advice from multiple domains
        </p>
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span>Multi-domain expertise</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            <span>Coordinated responses</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
            <span>Cross-board synthesis</span>
          </div>
        </div>
      </div>

      {/* Enhanced Selected Boards Preview - Fixed Height Strip */}
      <div className="selected-boards-strip">
        {selectedBoards.length > 0 && (
          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200/50 shadow-lg w-full" padding="lg">
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 animate-pulse"></div>
            </div>
            
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">{selectedBoards.length}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Selected Boards
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedBoards.length === 1 ? 'Add one more for multi-board consultation' : 'Ready for coordinated consultation'}
                    </p>
                  </div>
                </div>
                
                {selectedBoards.length >= 2 && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full border border-green-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-800 text-sm font-semibold">Ready</span>
                  </div>
                )}
              </div>
              
              {/* Enhanced board chips with animations */}
              <div className="flex flex-wrap gap-3">
                {selectedBoards.map((board, index) => {
                  const theme = getBoardTheme(board.id);
                  return (
                    <div
                      key={board.id}
                      className="group flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg"
                      style={{
                        backgroundColor: theme.chip.background,
                        color: theme.chip.text,
                        border: `2px solid ${theme.chip.border}`,
                        animationDelay: `${index * 100}ms`
                      }}
                    >
                      <div 
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: theme.accent }}
                      ></div>
                      <span className="font-semibold">{board.title}</span>
                      <button
                        onClick={() => handleBoardToggle(board)}
                        className="ml-3 hover:bg-black hover:bg-opacity-10 rounded-full p-1.5 transition-all duration-200 group-hover:scale-110"
                        aria-label={`Remove ${board.title}`}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Coordination indicator */}
              {selectedBoards.length >= 2 && (
                <div className="mt-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-emerald-900">Cross-Board Coordination Enabled</p>
                      <p className="text-sm text-emerald-700">Your question will be analyzed across {selectedBoards.length} domains for comprehensive insights</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Enhanced Validation Message */}
      {validationMessage && (
        <div className="observe-entrance stagger-3">
          <div className="relative overflow-hidden bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-5 shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-100/50 to-orange-100/50 animate-pulse"></div>
            <div className="relative flex items-start gap-4">
              <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-amber-900 mb-1">Multi-Board Selection Required</h4>
                <p className="text-amber-800 text-sm leading-relaxed">{validationMessage}</p>
                <p className="text-amber-700 text-xs mt-2">💡 Tip: Select boards from different domains for the most comprehensive advice</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Premium Board Grid - Equal Heights + No Reflow */}
      <div className="observe-entrance stagger-4">
        <div className="multi-board-grid">
          {boards.map((board, index) => {
            const theme = getBoardTheme(board.id);
            const selected = isSelected(board);
            const disabled = !selected && isMaxReached;

            return (
              <Card
                key={board.id}
                className={`multi-board-card group relative cursor-pointer ${
                  selected ? 'selected' : ''
                } ${
                  disabled 
                    ? 'opacity-50 cursor-not-allowed' 
                    : ''
                } ${isAnimated ? 'animate-fade-in-up' : 'opacity-0'}`}
                style={{
                  '--board-color': theme.accent,
                  '--board-color-alpha': `${theme.accent}40`,
                  animationDelay: `${index * 150}ms`,
                  animationFillMode: 'forwards'
                }}
                data-board={board.id.replace('board', '').toLowerCase()}
                padding="none"
                onClick={() => !disabled && handleBoardToggle(board)}
              >
                <div className="flex flex-col flex-1">
              {/* Enhanced Checkbox with animation - absolutely positioned */}
              <div className="selection-indicator">
                <div className={`relative w-8 h-8 rounded-xl border-3 flex items-center justify-center transition-all duration-300 ${
                  selected 
                    ? 'border-transparent shadow-lg scale-110' 
                    : 'border-gray-300 group-hover:border-gray-400'
                }`}
                style={{
                  backgroundColor: selected ? theme.accent : 'transparent',
                  boxShadow: selected ? `0 0 20px ${theme.accent}40` : 'none'
                }}
                >
                  {selected && (
                    <svg className="w-5 h-5 text-white animate-scale-in" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {!selected && (
                    <div className="w-3 h-3 rounded-full bg-gray-300 group-hover:bg-gray-400 transition-colors duration-200"></div>
                  )}
                </div>
              </div>

              {/* Enhanced Board Header */}
              <div className="mb-24">
                {/* Animated gradient bar */}
                <div className="relative mb-16 overflow-hidden rounded-full">
                  <div 
                    className="w-full h-4 rounded-full transition-all duration-500"
                    style={{
                      background: `linear-gradient(135deg, ${theme.gradient.from}, ${theme.gradient.to})`,
                      transform: selected ? 'scale(1.05)' : 'scale(1)',
                      boxShadow: selected ? `0 0 20px ${theme.accent}30` : 'none'
                    }}
                  />
                  {selected && (
                    <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse"></div>
                  )}
                </div>
                
                <div className="pr-12">
                  <h3 className="text-2xl font-bold text-gray-900 mb-12 group-hover:text-gray-800 transition-colors line-clamp-2">
                    {board.title}
                  </h3>
                  <p className="subcopy text-base font-semibold transition-colors duration-300" 
                     style={{ 
                       color: selected ? theme.accent : theme.text.secondary,
                       textShadow: selected ? `0 0 10px ${theme.accent}30` : 'none'
                     }}>
                    {board.tagline}
                  </p>
                </div>
              </div>

              {/* Enhanced Board Description */}
              <p className="body-text text-gray-700 text-base leading-relaxed line-clamp-3 group-hover:text-gray-800 transition-colors">
                {board.description}
              </p>

              {/* Enhanced Experts Count and Status */}
              <div className="experts-count flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-full">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="font-medium">{board.experts.length} experts available</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    <span>Available</span>
                  </div>
                </div>
                
                {selected && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-full animate-scale-in"
                       style={{ 
                         backgroundColor: theme.chip.background,
                         color: theme.accent,
                         border: `2px solid ${theme.accent}`
                       }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm font-bold">Selected</span>
                  </div>
                )}
              </div>

              {/* Enhanced Sample Expertise Areas */}
              <div className="board-card-chips pt-16 border-t border-gray-200 mt-auto">
                <p className="text-xs font-semibold text-gray-500 mb-12 uppercase tracking-wide">Key Expertise</p>
                <div className="flex flex-wrap gap-8">
                  {board.experts.slice(0, 3).map((expert, expertIndex) => (
                    <span
                      key={expert.id}
                      className="chip inline-block font-medium rounded-lg transition-all duration-200 hover:scale-105"
                      style={{
                        backgroundColor: selected ? theme.accent : theme.chip.background,
                        color: selected ? 'white' : theme.chip.text,
                        border: `1px solid ${selected ? theme.accent : theme.chip.border}`,
                        animationDelay: `${expertIndex * 100}ms`
                      }}
                    >
                      {expert.specialties[0] || expert.role}
                    </span>
                  ))}
                  {board.experts.length > 3 && (
                    <span className="chip inline-flex items-center font-medium text-gray-500 bg-gray-100 rounded-lg border border-gray-200">
                      +{board.experts.length - 3}
                    </span>
                  )}
                </div>
                <div className="board-card-footer">
                  {board.experts.length} experts available → 94% success rate
                </div>
              </div>

                {/* Selection overlay effect */}
                {selected && (
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-white/10 pointer-events-none rounded-lg"></div>
                )}
              </div>
            </Card>
          );
        })}
        </div>
      </div>

      {/* Enhanced Selection Summary */}
      {selectedBoards.length >= 2 && (
        <div className="observe-entrance stagger-5">
          <div className="text-center p-6 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl border-2 border-emerald-200">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="text-left">
                <h4 className="text-xl font-bold text-emerald-900">Multi-Board Consultation Ready</h4>
                <p className="text-emerald-700">
                  {selectedBoards.length} advisory boards • {selectedBoards.reduce((total, board) => total + board.experts.length, 0)} total experts
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-2 text-sm text-emerald-600">
              <div className="flex -space-x-1">
                {selectedBoards.map((board) => {
                  const theme = getBoardTheme(board.id);
                  return (
                    <div
                      key={board.id}
                      className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: theme.accent }}
                      title={board.title}
                    />
                  );
                })}
              </div>
              <span className="font-medium">Coordinated expertise across multiple domains</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiBoardSelector;
