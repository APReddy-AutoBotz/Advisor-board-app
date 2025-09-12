/**
 * Premium Board Picker - Card Gallery with Native Dialogs
 * 1/2/3 columns responsive, equal-height cards, full-card click
 */

import React, { useState, useRef, useEffect } from 'react';
import { BOARDS, trackEvent, type Board } from '../../lib/boards';
import { getBoardTheme } from '../../lib/boardThemes';
import type { Domain } from '../../types/domain';

interface PremiumBoardPickerProps {
  onBoardSelect: (domain: Domain) => void;
  className?: string;
}

interface ExpertModalProps {
  board: Board | null;
  isOpen: boolean;
  onClose: () => void;
}

const ExpertModal: React.FC<ExpertModalProps> = ({ board, isOpen, onClose }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && board) {
      dialog.showModal();
      trackEvent('experts_modal_open', { board_id: board.id, board_title: board.title });
    } else {
      dialog.close();
    }

    const handleClose = () => onClose();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    dialog.addEventListener('close', handleClose);
    dialog.addEventListener('keydown', handleKeyDown);

    return () => {
      dialog.removeEventListener('close', handleClose);
      dialog.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, board, onClose]);

  if (!board) return null;

  const theme = getBoardTheme(board.id);

  return (
    <dialog
      ref={dialogRef}
      className="backdrop:bg-black/50 backdrop:backdrop-blur-sm rounded-xl border-0 p-0 shadow-hover max-w-2xl w-full"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-xl overflow-hidden">
        {/* Header with Board Theme */}
        <div 
          className={`${theme.gradient.css} p-6 text-white relative overflow-hidden`}
        >
          {/* Grain Overlay */}
          <div 
            className="absolute inset-0 opacity-[0.08] mix-blend-overlay"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.08\'/%3E%3C/svg%3E")' }}
          />
          
          <div className="relative flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">{board.title}</h2>
              <p className="text-white/90">{board.experts.length} Experts Available</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-hover"
              aria-label="Close dialog"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Expert List */}
        <div className="p-6 max-h-96 overflow-y-auto">
          <div className="space-y-4">
            {board.experts.map((expert, index) => (
              <div 
                key={expert.id}
                className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-hover"
              >
                {/* Expert Avatar/Code */}
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: theme.accent }}
                >
                  {expert.code}
                </div>
                
                {/* Expert Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-ink-900 mb-1">{expert.name}</h3>
                  <p className="text-sm text-ink-600 mb-2">{expert.role}</p>
                  <p className="text-sm text-ink-500 line-clamp-2">{expert.blurb}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-ink-200 bg-gray-50">
          <p className="text-sm text-ink-600 text-center">
            Select this board to consult with all {board.experts.length} experts
          </p>
        </div>
      </div>
    </dialog>
  );
};

interface BoardCardProps {
  board: Board;
  onSelect: (board: Board) => void;
  onExpertsClick: (board: Board) => void;
}

const BoardCard: React.FC<BoardCardProps> = ({ board, onSelect, onExpertsClick }) => {
  const theme = getBoardTheme(board.id);

  const handleCardClick = () => {
    trackEvent('board_card_open', { board_id: board.id, board_title: board.title });
    onSelect(board);
  };

  const handleExpertsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onExpertsClick(board);
  };

  return (
    <div
      className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-xl bg-white shadow-card ring-1 ring-ink-200 transition-all duration-hover hover:shadow-hover hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-blue-200"
      onClick={handleCardClick}
      tabIndex={0}
      role="button"
      aria-label={`Open ${board.title} advisory board`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      {/* Board Theme Color Bar */}
      <div 
        className="h-1 w-full"
        style={{ backgroundColor: theme.accent }}
      />
      
      {/* Card Content */}
      <div className="flex flex-1 flex-col p-6">
        {/* Board Icon */}
        <div 
          className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl"
          style={{ backgroundColor: theme.background.medium }}
        >
          <div 
            className="text-2xl font-bold"
            style={{ color: theme.accent }}
          >
            {board.title.charAt(0)}
          </div>
        </div>

        {/* Board Info */}
        <div className="flex-1">
          <h3 className="mb-2 text-xl font-bold text-ink-900 group-hover:text-blue-600 transition-colors duration-hover">
            {board.title}
          </h3>
          <p 
            className="mb-4 text-sm font-medium"
            style={{ color: theme.accent }}
          >
            {board.tagline}
          </p>
          <p className="mb-6 text-sm leading-relaxed text-ink-600">
            {board.description}
          </p>
        </div>

        {/* Expert Chips */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {board.experts.slice(0, 3).map((expert, index) => (
              <span
                key={index}
                className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset"
                style={{ 
                  backgroundColor: theme.background.medium,
                  color: theme.text.secondary,
                  borderColor: theme.chip.border
                }}
              >
                {expert.code}
              </span>
            ))}
            {board.experts.length > 3 && (
              <span
                className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset"
                style={{ 
                  backgroundColor: theme.background.medium,
                  color: theme.text.secondary,
                  borderColor: theme.chip.border
                }}
              >
                +{board.experts.length - 3}
              </span>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between text-xs text-ink-500">
          <button
            onClick={handleExpertsClick}
            className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-hover"
          >
            {board.experts.length} experts →
          </button>
          <span>94% success rate</span>
        </div>
      </div>
    </div>
  );
};

const PremiumBoardPicker: React.FC<PremiumBoardPickerProps> = ({ onBoardSelect, className = '' }) => {
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleBoardSelect = (board: Board) => {
    // Convert Board to Domain for compatibility
    const domain: Domain = {
      id: board.id as any,
      name: board.title,
      description: board.description,
      theme: {
        primary: getBoardTheme(board.id).accent,
        secondary: getBoardTheme(board.id).background.medium,
        accent: getBoardTheme(board.id).accent,
        background: getBoardTheme(board.id).background.light,
        text: getBoardTheme(board.id).text.primary
      },
      advisors: board.experts.map(expert => ({
        id: expert.id,
        name: expert.name,
        expertise: expert.role,
        background: expert.blurb,
        domain: board.id as any,
        isSelected: false,
        avatar: expert.avatar,
        credentials: expert.credentials
      }))
    };
    
    onBoardSelect(domain);
  };

  const handleExpertsClick = (board: Board) => {
    setSelectedBoard(board);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedBoard(null);
  };

  return (
    <section className={`py-16 sm:py-24 ${className}`} data-board-picker>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Enhanced Section Header */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <div className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-100 to-purple-100 px-6 py-2 text-sm font-semibold text-blue-800 mb-6">
            🎯 4 Specialized Advisory Boards
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl mb-6">
            Choose Your Advisory Board
          </h2>
          <p className="text-lg leading-8 text-ink-600 mb-8">
            Select from specialized boards of industry experts, each with proven track records and deep domain expertise.
          </p>
          
          {/* Quick Stats */}
          <div className="flex justify-center gap-8 text-sm text-ink-500">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              <span>50+ AI Experts</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
              <span>Real-time Responses</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
              <span>Multi-perspective Analysis</span>
            </div>
          </div>
        </div>

        {/* Board Grid - 1/2/3 columns responsive */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Object.values(BOARDS).map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              onSelect={handleBoardSelect}
              onExpertsClick={handleExpertsClick}
            />
          ))}
        </div>
      </div>

      {/* Native Dialog for Expert Listings */}
      <ExpertModal
        board={selectedBoard}
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />
    </section>
  );
};

export default PremiumBoardPicker;
