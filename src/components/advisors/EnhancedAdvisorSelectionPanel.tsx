import React, { useState, useEffect } from 'react';
import { getBoardTheme } from '../../lib/boardThemes';
import { BOARDS, trackEvent, type BoardExpert } from '../../lib/boards';
import { extractFirstName, createChatCTA } from '../../utils/nameUtils';
import EnhancedAdvisorCard from './EnhancedAdvisorCard';
import Button from '../common/Button';

interface EnhancedAdvisorSelectionPanelProps {
  boardId?: string;
  onSelectionComplete: (advisors: BoardExpert[]) => void;
  onBack: () => void;
  className?: string;
}

const EnhancedAdvisorSelectionPanel: React.FC<EnhancedAdvisorSelectionPanelProps> = ({
  boardId,
  onSelectionComplete,
  onBack,
  className = ''
}) => {
  const [selectedAdvisors, setSelectedAdvisors] = useState<BoardExpert[]>([]);
  const [showLimitNotice, setShowLimitNotice] = useState(false);
  const [showPersonaModal, setShowPersonaModal] = useState<BoardExpert | null>(null);

  const MAX_ADVISORS = 5;
  
  // Get advisors from all boards or specific board
  const allAdvisors = boardId 
    ? BOARDS[boardId]?.experts || []
    : Object.values(BOARDS).flatMap(board => 
        board.experts.map(expert => ({ ...expert, boardId: board.id }))
      );

  const theme = boardId ? getBoardTheme(boardId) : getBoardTheme('cliniboard');

  const handleAdvisorSelect = (advisor: BoardExpert) => {
    const isSelected = selectedAdvisors.some(a => a.id === advisor.id);
    
    if (isSelected) {
      // Deselect
      setSelectedAdvisors(prev => prev.filter(a => a.id !== advisor.id));
      trackEvent('advisor_deselect', { advisor_id: advisor.id, board: boardId });
    } else {
      // Select
      if (selectedAdvisors.length >= MAX_ADVISORS) {
        // Show limit notice
        setShowLimitNotice(true);
        setTimeout(() => setShowLimitNotice(false), 3000);
        return;
      }
      
      setSelectedAdvisors(prev => [...prev, advisor]);
      trackEvent('advisor_select', { advisor_id: advisor.id, board: boardId });
    }
  };

  const handleChatClick = (advisor: BoardExpert) => {
    trackEvent('advisor_chat_click', { advisor_id: advisor.id, board: boardId });
    // Navigate to chat interface
    console.log('Chat with:', advisor.name);
  };

  const handleViewProfile = (advisor: BoardExpert) => {
    setShowPersonaModal(advisor);
  };

  const handleProceed = () => {
    if (selectedAdvisors.length > 0) {
      onSelectionComplete(selectedAdvisors);
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            {/* Back Button */}
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Go back"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Back</span>
            </button>

            {/* Selection Counter */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Selected Advisors:</span>
                <div 
                  className="inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold text-white"
                  style={{ backgroundColor: theme.accent }}
                >
                  {selectedAdvisors.length}/{MAX_ADVISORS}
                </div>
              </div>

              {/* Proceed Button */}
              <Button
                onClick={handleProceed}
                disabled={selectedAdvisors.length === 0}
                className="min-w-[120px]"
                style={{ backgroundColor: selectedAdvisors.length > 0 ? theme.accent : undefined }}
              >
                Proceed ({selectedAdvisors.length})
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Limit Notice */}
      {showLimitNotice && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40 animate-fade-in">
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 shadow-lg">
            <div className="flex items-center gap-2 text-sm text-red-800">
              <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">
                Max {MAX_ADVISORS} advisors. Deselect one to choose another.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-12">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-4">
            {boardId ? `${BOARDS[boardId]?.title} Advisors` : 'Choose Your Advisory Team'}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Select up to {MAX_ADVISORS} AI advisors to join your consultation. 
            Each brings unique expertise and perspective to your questions.
          </p>
        </div>

        {/* Advisors Grid */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {allAdvisors.map((advisor) => {
            const advisorBoardId = 'boardId' in advisor ? advisor.boardId : boardId || 'cliniboard';
            return (
              <EnhancedAdvisorCard
                key={advisor.id}
                advisor={advisor}
                boardId={advisorBoardId}
                variant="solid"
                isSelected={selectedAdvisors.some(a => a.id === advisor.id)}
                onSelect={handleAdvisorSelect}
                onChatClick={handleChatClick}
                onViewProfile={handleViewProfile}
              />
            );
          })}
        </div>

        {/* Selected Advisors Summary */}
        {selectedAdvisors.length > 0 && (
          <div className="mt-16 bg-white rounded-2xl border border-gray-200 p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Your Selected Advisory Team ({selectedAdvisors.length}/{MAX_ADVISORS})
            </h3>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {selectedAdvisors.map((advisor) => (
                <div key={advisor.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <img
                    src={advisor.avatar}
                    alt={advisor.name}
                    className="h-10 w-10 rounded-full border-2 border-white shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{advisor.name}</div>
                    <div className="text-sm text-gray-600 truncate">{advisor.role}</div>
                  </div>
                  <button
                    onClick={() => handleAdvisorSelect(advisor)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    aria-label={`Remove ${advisor.name}`}
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-center">
              <Button
                onClick={handleProceed}
                size="lg"
                className="min-w-[200px]"
                style={{ backgroundColor: theme.accent }}
              >
                Start Consultation with {selectedAdvisors.length} Advisor{selectedAdvisors.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Persona Profile Modal */}
      {showPersonaModal && (
        <PersonaProfileModal
          advisor={showPersonaModal}
          boardId={boardId || 'cliniboard'}
          onClose={() => setShowPersonaModal(null)}
        />
      )}
    </div>
  );
};

// Persona Profile Modal Component
interface PersonaProfileModalProps {
  advisor: BoardExpert;
  boardId: string;
  onClose: () => void;
}

const PersonaProfileModal: React.FC<PersonaProfileModalProps> = ({ advisor, boardId, onClose }) => {
  const theme = getBoardTheme(boardId);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        {/* Modal panel */}
        <div className="relative inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6 sm:align-middle">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <img
                src={advisor.avatar}
                alt={advisor.name}
                className="h-16 w-16 rounded-full border-2 border-white shadow-lg"
              />
              <div>
                <h3 className="text-xl font-bold text-gray-900" id="modal-title">
                  AI {advisor.name}
                </h3>
                <p className="text-sm" style={{ color: theme.accent }}>
                  {advisor.role}
                </p>
              </div>
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

          {/* Content */}
          <div className="space-y-6">
            {/* Persona Overview */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Persona Overview</h4>
              <p className="text-gray-700 leading-relaxed">{advisor.blurb}</p>
            </div>

            {/* Credentials */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Credentials</h4>
              <p className="text-gray-700">{advisor.credentials}</p>
            </div>

            {/* Specialties */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Areas of Expertise</h4>
              <div className="flex flex-wrap gap-2">
                {advisor.specialties.map((specialty, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium border"
                    style={{
                      backgroundColor: theme.chip.background,
                      color: theme.chip.text,
                      borderColor: theme.chip.border
                    }}
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            </div>

            {/* Sample Questions */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Sample Questions to Ask</h4>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-1">•</span>
                  <span>What are the key considerations for {advisor.specialties[0]?.toLowerCase()}?</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-1">•</span>
                  <span>How would you approach risk assessment in this domain?</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-1">•</span>
                  <span>What frameworks do you recommend for decision-making?</span>
                </li>
              </ul>
            </div>

            {/* Limitations */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">AI Persona Limitations</h4>
              <p className="text-sm text-yellow-700">
                This AI advisor is trained to emulate {boardId.replace('board', '')} reasoning patterns. 
                It provides educational insights only and should not replace professional consultation. 
                Always verify critical decisions with qualified experts.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="advisor-card-ctas mt-8 flex justify-end gap-3">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
            <Button 
              onClick={() => {
                onClose();
                // Navigate to chat
              }}
              style={{ backgroundColor: theme.accent }}
              className="text-white"
            >
              {createChatCTA(advisor.name)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAdvisorSelectionPanel;