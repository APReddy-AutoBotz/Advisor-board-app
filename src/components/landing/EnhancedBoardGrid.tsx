import React, { useState } from 'react';
import { BOARDS, trackEvent, type Board, type BoardExpert } from '../../lib/boards';
import Button from '../common/Button';

interface EnhancedBoardGridProps {
  onBoardSelect: (board: Board) => void;
}

const EnhancedBoardGrid: React.FC<EnhancedBoardGridProps> = ({ onBoardSelect }) => {
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [showExpertsModal, setShowExpertsModal] = useState(false);
  
  const boards = Object.values(BOARDS);

  const handleBoardClick = (board: Board) => {
    trackEvent('board_card_open', { board_id: board.id, board_title: board.title });
    onBoardSelect(board);
  };

  const handleExpertsClick = (e: React.MouseEvent, board: Board) => {
    e.stopPropagation();
    setSelectedBoard(board);
    setShowExpertsModal(true);
    trackEvent('experts_modal_open', { board_id: board.id, expert_count: board.experts.length });
  };

  const closeModal = () => {
    setShowExpertsModal(false);
    setSelectedBoard(null);
  };

  return (
    <>
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Section Header */}
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Choose Your Advisory Board
            </h2>
            <p className="mt-4 text-lg leading-8 text-gray-600">
              Select from specialized boards of industry experts, each with proven track records and deep domain expertise.
            </p>
          </div>

          {/* Responsive Board Grid */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {boards.map((board) => (
              <BoardCard
                key={board.id}
                board={board}
                onClick={() => handleBoardClick(board)}
                onExpertsClick={(e) => handleExpertsClick(e, board)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Experts Modal */}
      {showExpertsModal && selectedBoard && (
        <ExpertsModal
          board={selectedBoard}
          onClose={closeModal}
        />
      )}
    </>
  );
};

// Enhanced Board Card Component
interface BoardCardProps {
  board: Board;
  onClick: () => void;
  onExpertsClick: (e: React.MouseEvent) => void;
}

const BoardCard: React.FC<BoardCardProps> = ({ board, onClick, onExpertsClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Get first 3 expert codes + count
  const expertCodes = board.experts.slice(0, 3).map(expert => expert.code);
  const remainingCount = Math.max(0, board.experts.length - 3);

  return (
    <div
      className={`group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl bg-white p-6 shadow-lg ring-1 ring-gray-200 transition-all duration-300 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-blue-200 ${
        isHovered ? 'scale-105' : ''
      }`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      tabIndex={0}
      role="button"
      aria-label={`Open ${board.title} advisory board`}
    >
      {/* Color Bar */}
      <div 
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: board.color.primary }}
      />
      
      {/* Board Icon */}
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl" style={{ backgroundColor: board.color.background }}>
        <div className="text-2xl font-bold" style={{ color: board.color.primary }}>
          {board.title.charAt(0)}
        </div>
      </div>

      {/* Board Info */}
      <div className="flex-1">
        <h3 className="mb-2 text-xl font-bold text-gray-900 group-hover:text-blue-600">
          {board.title}
        </h3>
        <p className="mb-4 text-sm font-medium" style={{ color: board.color.primary }}>
          {board.tagline}
        </p>
        <p className="mb-6 text-sm leading-relaxed text-gray-600">
          {board.description}
        </p>
      </div>

      {/* Expert Chips */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {expertCodes.map((code, index) => (
            <span
              key={index}
              className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset"
              style={{ 
                backgroundColor: board.color.background,
                color: board.color.text,
                borderColor: board.color.secondary
              }}
            >
              {code}
            </span>
          ))}
          {remainingCount > 0 && (
            <span
              className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset"
              style={{ 
                backgroundColor: board.color.background,
                color: board.color.text,
                borderColor: board.color.secondary
              }}
            >
              +{remainingCount}
            </span>
          )}
        </div>
      </div>

      {/* Experts Count Button */}
      <button
        onClick={onExpertsClick}
        className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label={`View ${board.experts.length} experts in ${board.title}`}
      >
        <span>{board.experts.length} Experts Available</span>
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Stats */}
      <div className="mt-4 flex justify-between text-xs text-gray-500">
        <span>{board.experts.length * 15}+ years exp</span>
        <span>94% success rate</span>
      </div>
    </div>
  );
};

// Experts Modal Component
interface ExpertsModalProps {
  board: Board;
  onClose: () => void;
}

const ExpertsModal: React.FC<ExpertsModalProps> = ({ board, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        {/* Modal panel */}
        <div className="relative inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6 sm:align-middle">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900" id="modal-title">
                {board.title} Experts
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {board.experts.length} expert advisors ready to help
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Close modal"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Experts List */}
          <div className="space-y-4">
            {board.experts.map((expert) => (
              <ExpertCard key={expert.id} expert={expert} color={board.color} />
            ))}
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Expert Card Component
interface ExpertCardProps {
  expert: BoardExpert;
  color: Board['color'];
}

const ExpertCard: React.FC<ExpertCardProps> = ({ expert, color }) => {
  return (
    <div className="flex items-start space-x-4 rounded-lg border border-gray-200 p-4">
      {/* Avatar */}
      <img
        src={expert.avatar}
        alt={expert.name}
        className="h-12 w-12 rounded-full border-2 border-white shadow-md"
      />
      
      {/* Info */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-gray-900">{expert.name}</h4>
          <span 
            className="inline-flex items-center rounded px-2 py-1 text-xs font-medium"
            style={{ backgroundColor: color.background, color: color.text }}
          >
            {expert.code}
          </span>
        </div>
        <p className="text-sm text-gray-600">{expert.credentials}</p>
        <p className="mt-1 text-sm text-gray-700">{expert.blurb}</p>
        
        {/* Specialties */}
        <div className="mt-2 flex flex-wrap gap-1">
          {expert.specialties.slice(0, 3).map((specialty, index) => (
            <span key={index} className="inline-flex items-center rounded text-xs font-medium text-gray-500">
              • {specialty}
            </span>
          ))}
        </div>
      </div>
      
      {/* Experience */}
      <div className="text-right">
        <div className="text-lg font-bold" style={{ color: color.primary }}>
          15+
        </div>
        <div className="text-xs text-gray-500">years</div>
      </div>
    </div>
  );
};

export default EnhancedBoardGrid;