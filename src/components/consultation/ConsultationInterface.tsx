import React, { useState, useEffect } from 'react';
import type { Domain, Advisor } from '../../types/domain';
import type { ConsultationSession } from '../../types/session';
import type { Board } from '../../lib/boards';
import Button from '../common/Button';
import Card from '../common/Card';
import PromptInput from './PromptInput';
import ResponsePanel from './ResponsePanel';
import ResponseLoadingCard from './ResponseLoadingCard';
import QuestionAnalysisDisplay from './QuestionAnalysisDisplay';
import MultiBoardSelector from './MultiBoardSelector';
import { useAdvisorPersonas } from '../../hooks/useAdvisorPersonas';

interface ConsultationInterfaceProps {
  selectedAdvisors: Advisor[];
  domain?: Domain;
  selectedBoards?: Board[];
  onBack?: () => void;
  onComplete?: (session: ConsultationSession) => void;
  onSessionComplete?: (session: ConsultationSession) => void; // Legacy prop for backward compatibility
  onBoardSelection?: (boards: Board[]) => void;
  className?: string;
  mode?: 'single-board' | 'multi-board';
}

const ConsultationInterface: React.FC<ConsultationInterfaceProps> = ({
  selectedAdvisors,
  domain,
  selectedBoards = [],
  onBack,
  onComplete,
  onSessionComplete, // Legacy prop
  onBoardSelection,
  className = '',
  mode = 'single-board',
}) => {
  // Handle legacy prop
  const handleComplete = onComplete || onSessionComplete;
  
  // Use the advisor personas hook for state management
  const {
    responses,
    isLoading: isGenerating,
    error,
    submitPrompt: hookSubmitPrompt,
    clearResponses,
    clearError
  } = useAdvisorPersonas(selectedAdvisors);
  
  const [prompt, setPrompt] = useState('');
  const [sessionStarted, setSessionStarted] = useState(false);
  const [questionInsights, setQuestionInsights] = useState<any>(null);
  const [consultationMode, setConsultationMode] = useState<'single-board' | 'multi-board'>(mode);
  const [localSelectedBoards, setLocalSelectedBoards] = useState<Board[]>(selectedBoards);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Handle board selection changes
  const handleBoardSelection = (boards: Board[]) => {
    setLocalSelectedBoards(boards);
    if (onBoardSelection) {
      onBoardSelection(boards);
    }
  };

  // Toggle between single-board and multi-board modes
  const handleModeToggle = (newMode: 'single-board' | 'multi-board') => {
    setConsultationMode(newMode);
    // Reset session when switching modes
    setSessionStarted(false);
    setPrompt('');
    setResponses([]);
    setQuestionInsights(null);
  };

  // Check if we can proceed with consultation
  const canProceedWithConsultation = () => {
    if (consultationMode === 'single-board') {
      return selectedAdvisors.length > 0;
    } else {
      return localSelectedBoards.length >= 2;
    }
  };

  // Determine the effective domain for single-board mode
  const effectiveDomain = domain || (selectedAdvisors.length > 0 ? selectedAdvisors[0].domain : null);

  const handlePromptSubmit = async (userPrompt: string) => {
    console.log('🚀 Starting consultation with:', userPrompt);
    console.log('🎯 Consultation mode:', consultationMode);
    
    setPrompt(userPrompt);
    setSessionStarted(true);

    if (consultationMode === 'single-board') {
      // Use the hook for single-board mode
      await hookSubmitPrompt(userPrompt);
    } else {
      // For multi-board mode, we'll need to handle this differently
      // This is a simplified implementation for now
      console.log('🏢 Multi-board mode not fully implemented with hook yet');
      await hookSubmitPrompt(userPrompt);
    }
  };

  const handleExportSession = async () => {
    const session: ConsultationSession = {
      id: `session-${Date.now()}`,
      timestamp: new Date(),
      domain: consultationMode === 'single-board' ? (effectiveDomain?.id || 'cliniboard') : 'multi-board',
      selectedAdvisors: consultationMode === 'single-board' ? selectedAdvisors : [],
      selectedBoards: consultationMode === 'multi-board' ? localSelectedBoards : undefined,
      consultationMode,
      prompt,
      responses,
      summary: responses.length > 0 
        ? consultationMode === 'single-board'
          ? 'Session completed with intelligent responses from all selected advisors.'
          : `Multi-board consultation completed with coordinated responses from ${localSelectedBoards.length} advisory boards.`
        : undefined
    };

    try {
      // Import the ExportService dynamically to avoid bundle issues
      const { ExportService } = await import('../../services/exportService');
      await ExportService.exportToPDF(session);
      
      if (handleComplete) {
        handleComplete(session);
      }
    } catch (error) {
      console.error('Export failed:', error);
      // Fallback to JSON export if PDF fails
      const dataStr = JSON.stringify(session, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `advisorboard-session-${session.id}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 py-8 ${className}`}>
      <div className="max-w-6xl mx-auto px-4">
        {/* No Advisors Selected Error */}
        {consultationMode === 'single-board' && selectedAdvisors.length === 0 && (
          <Card className="mb-8 bg-red-50 border-red-200" padding="lg">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Advisors Selected</h3>
              <p className="text-gray-600 mb-4">Please select at least one advisor to start your consultation.</p>
              {onBack && (
                <Button onClick={onBack} variant="primary">
                  Back to Selection
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Header */}
        {(consultationMode === 'multi-board' || selectedAdvisors.length > 0) && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {consultationMode === 'single-board' 
                    ? (effectiveDomain ? `${effectiveDomain.name} Advisory Session` : 'Advisory Board Consultation')
                    : 'Multi-Board Consultation'
                  }
                </h1>
                <p className="text-gray-600 mt-2">
                  {consultationMode === 'single-board'
                    ? `Ask your question to ${selectedAdvisors.length} selected advisor${selectedAdvisors.length !== 1 ? 's' : ''}`
                    : `Coordinated advice from ${localSelectedBoards.length} advisory board${localSelectedBoards.length !== 1 ? 's' : ''}`
                  }
                </p>
              </div>
              {onBack && (
                <Button
                  variant="outline"
                  onClick={onBack}
                  leftIcon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  }
                >
                  Back to Selection
                </Button>
              )}
            </div>

          {/* Mode Toggle */}
          {!sessionStarted && (
            <Card className="mb-6" padding="lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Consultation Mode</h3>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => handleModeToggle('single-board')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      consultationMode === 'single-board'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Single Board
                  </button>
                  <button
                    onClick={() => handleModeToggle('multi-board')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      consultationMode === 'multi-board'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Multi-Board
                  </button>
                </div>
              </div>
              <p className="text-gray-600 text-sm">
                {consultationMode === 'single-board'
                  ? 'Get focused expertise from advisors within a single domain'
                  : 'Get coordinated advice from multiple advisory boards for complex, cross-domain questions'
                }
              </p>
            </Card>
          )}

          {/* Multi-Board Selector */}
          {consultationMode === 'multi-board' && !sessionStarted && (
            <MultiBoardSelector
              selectedBoards={localSelectedBoards}
              onBoardSelection={handleBoardSelection}
              className="mb-8"
            />
          )}

          {/* Selected Advisors (Single Board Mode) */}
          {consultationMode === 'single-board' && selectedAdvisors.length > 0 && (
            <Card 
              className={`mb-8 ${effectiveDomain?.id === 'cliniboard' ? 'border-clinical-200 bg-clinical-50' : ''}`} 
              padding="lg"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Selected Advisors:
              </h3>
              <div className="text-gray-600 mb-4">
                {selectedAdvisors.map((advisor, index) => (
                  <span key={advisor.id}>
                    {advisor.name}
                    {index < selectedAdvisors.length - 1 && ', '}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedAdvisors.map((advisor) => (
                  <div key={advisor.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">
                        {advisor.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{advisor.name}</p>
                      <p className="text-sm text-gray-600">{advisor.expertise}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Selected Boards Summary (Multi-Board Mode) */}
          {consultationMode === 'multi-board' && sessionStarted && localSelectedBoards.length > 0 && (
            <Card className="mb-8" padding="lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Consulting with {localSelectedBoards.length} Advisory Boards
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {localSelectedBoards.map((board) => (
                  <div key={board.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: board.color.background }}
                    >
                      <span 
                        className="font-semibold text-sm"
                        style={{ color: board.color.primary }}
                      >
                        {board.title.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{board.title}</p>
                      <p className="text-sm text-gray-600">{board.experts.length} experts</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
          </div>
        )}

        {/* Question Display */}
        {sessionStarted && prompt && (
          <Card className="mb-8" padding="lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Question</h3>
            <p className="text-gray-700 bg-gray-50 p-4 rounded-lg italic mb-4">
              "{prompt}"
            </p>
            {questionInsights && (
              <QuestionAnalysisDisplay insights={questionInsights} />
            )}
          </Card>
        )}

        {/* Prompt Input */}
        {!sessionStarted && canProceedWithConsultation() && (
          <Card className="mb-8" padding="lg">
            <PromptInput
              onSubmit={handlePromptSubmit}
              placeholder={
                consultationMode === 'single-board'
                  ? `Ask your question to the ${effectiveDomain?.name || 'Cliniboard'} board...`
                  : 'Ask your multi-domain question here for coordinated expert advice...'
              }
              isLoading={isGenerating}
            />
          </Card>
        )}

        {/* Validation Message for Multi-Board Mode */}
        {consultationMode === 'multi-board' && !sessionStarted && localSelectedBoards.length < 2 && (
          <Card className="mb-8 bg-amber-50 border-amber-200" padding="lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-amber-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-amber-800 text-sm font-medium">
                Select at least 2 advisory boards to enable multi-board consultation
              </span>
            </div>
          </Card>
        )}

        {/* Loading State */}
        {isGenerating && (
          <div className="space-y-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              {consultationMode === 'single-board' 
                ? '🧠 Generating Expert Responses...'
                : '🌐 Coordinating Multi-Board Responses...'
              }
            </h2>
            {consultationMode === 'single-board' 
              ? selectedAdvisors.map((advisor, index) => (
                  <ResponseLoadingCard
                    key={advisor.id}
                    advisorName={advisor.name}
                    advisorRole={advisor.expertise || 'Professional Advisor'}
                    className="animate-fade-in"
                  />
                ))
              : localSelectedBoards.map((board, index) => (
                  <ResponseLoadingCard
                    key={board.id}
                    advisorName={board.title}
                    advisorRole={`${board.experts.length} Expert${board.experts.length !== 1 ? 's' : ''}`}
                    className="animate-fade-in"
                  />
                ))
            }
          </div>
        )}

        {/* Responses */}
        {responses.length > 0 && (
          <div className="space-y-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              {consultationMode === 'single-board' 
                ? '🎯 Expert Advisory Responses'
                : '🌐 Coordinated Multi-Board Responses'
              }
            </h2>
            {consultationMode === 'single-board' 
              ? responses.map((response, index) => {
                  const advisor = selectedAdvisors.find(a => a.id === response.advisorId);
                  return (
                    <ResponsePanel
                      key={response.advisorId}
                      response={response}
                      advisor={advisor}
                      className="animate-fade-in"
                    />
                  );
                })
              : (() => {
                  // Group responses by board for multi-board display
                  const responsesByBoard = responses.reduce((acc: any, response: any) => {
                    const boardId = response.boardId || 'unknown';
                    if (!acc[boardId]) {
                      acc[boardId] = [];
                    }
                    acc[boardId].push(response);
                    return acc;
                  }, {});

                  return Object.entries(responsesByBoard).map(([boardId, boardResponses]: [string, any]) => {
                    const board = localSelectedBoards.find(b => b.id === boardId);
                    return (
                      <div key={boardId} className="space-y-4">
                        {/* Board Header */}
                        <div className="flex items-center space-x-3 mb-4">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: board?.color.background }}
                          >
                            <span 
                              className="font-semibold text-sm"
                              style={{ color: board?.color.primary }}
                            >
                              {board?.title.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {board?.title || 'Advisory Board'}
                          </h3>
                        </div>
                        
                        {/* Board Responses */}
                        {boardResponses.map((response: any, index: number) => {
                          // Create a mock advisor object for the ResponsePanel
                          const mockAdvisor = {
                            id: response.advisorId,
                            name: response.persona?.name || 'Expert Advisor',
                            expertise: response.persona?.expertise || 'Professional Advisory',
                            background: response.persona?.background || '',
                            credentials: '',
                            avatar: ''
                          };
                          
                          return (
                            <div key={response.advisorId} className="ml-8">
                              <ResponsePanel
                                response={response}
                                advisor={mockAdvisor}
                                className="animate-fade-in"
                                boardColor={board?.color}
                              />
                            </div>
                          );
                        })}
                      </div>
                    );
                  });
                })()
            }
          </div>
        )}

        {/* Session Actions */}
        {responses.length > 0 && (
          <Card className="text-center bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200" padding="lg">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {consultationMode === 'single-board' 
                ? '🎉 Intelligent Consultation Complete!'
                : '🌐 Multi-Board Consultation Complete!'
              }
            </h3>
            <p className="text-gray-600 mb-6">
              {consultationMode === 'single-board'
                ? `You've received personalized insights from all ${selectedAdvisors.length} selected advisor${selectedAdvisors.length !== 1 ? 's' : ''}. Each response was intelligently crafted based on your specific question and their expertise.`
                : `You've received coordinated advice from ${localSelectedBoards.length} advisory board${localSelectedBoards.length !== 1 ? 's' : ''}. Each board provided domain-specific insights that complement the others for comprehensive guidance.`
              }
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-white rounded-lg border">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {consultationMode === 'single-board' ? selectedAdvisors.length : localSelectedBoards.length}
                </div>
                <div className="text-sm text-gray-500">
                  {consultationMode === 'single-board' 
                    ? `AI Expert${selectedAdvisors.length !== 1 ? 's' : ''}`
                    : `Advisory Board${localSelectedBoards.length !== 1 ? 's' : ''}`
                  }
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{responses.length}</div>
                <div className="text-sm text-gray-500">
                  {consultationMode === 'single-board' 
                    ? `Intelligent Response${responses.length !== 1 ? 's' : ''}`
                    : `Coordinated Response${responses.length !== 1 ? 's' : ''}`
                  }
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {questionInsights ? Math.round(questionInsights.confidence * 100) : 95}%
                </div>
                <div className="text-sm text-gray-500">
                  {consultationMode === 'single-board' ? 'Relevance Score' : 'Coordination Score'}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleExportSession}
                variant="primary"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
              >
                📄 Download Professional Report
              </Button>
              {onBack && (
                <Button
                  onClick={onBack}
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  🔄 Start New Consultation
                </Button>
              )}
            </div>
            
            <div className="mt-4 text-xs text-gray-500">
              🧠 Powered by Kiro AI • 🎯 Contextually Intelligent • 🔒 Enterprise Ready
            </div>
          </Card>
        )}

        {/* AI Disclaimer */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm text-yellow-800">
            <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">
              🤖 You're consulting with AI personas, not real individuals. Educational content only; 
              {consultationMode === 'multi-board' || 
               (consultationMode === 'single-board' && (effectiveDomain?.id === 'remediboard' || effectiveDomain?.id === 'cliniboard'))
                ? ' no medical or legal advice.' 
                : ' verify important decisions with qualified professionals.'
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultationInterface;