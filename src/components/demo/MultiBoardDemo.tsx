/**
 * Multi-Board Demo Component
 * Premium display-first experience for multi-board consultations
 * Uses static demo data for immediate, impressive results
 */

import React, { useState, useEffect } from 'react';
import type { Board } from '../../lib/boards';
import { BOARDS } from '../../lib/boards';
import Button from '../common/Button';
import Card from '../common/Card';
import MultiBoardSelector from '../consultation/MultiBoardSelector';
import CoordinatedResponsePanel from '../consultation/CoordinatedResponsePanel';
import MultiBoardLoadingCard from '../consultation/MultiBoardLoadingCard';
import { generateStaticMultiBoardResponses, getRecommendedDemoQuestion, hasPremiumDemoContent } from '../../services/staticMultiBoardService';
import type { StaticMultiBoardResult } from '../../services/staticMultiBoardService';

interface MultiBoardDemoProps {
  onBack?: () => void;
  className?: string;
}

const MultiBoardDemo: React.FC<MultiBoardDemoProps> = ({
  onBack,
  className = ''
}) => {
  const [selectedBoards, setSelectedBoards] = useState<Board[]>([]);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<StaticMultiBoardResult | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Update recommended question when boards change
  useEffect(() => {
    if (selectedBoards.length >= 2) {
      const recommendedQuestion = getRecommendedDemoQuestion(selectedBoards);
      setQuestion(recommendedQuestion);
    } else {
      setQuestion('');
    }
  }, [selectedBoards]);

  const handleBoardSelection = (boards: Board[]) => {
    setSelectedBoards(boards);
    setResults(null);
    setShowResults(false);
  };

  const handleSubmit = async () => {
    if (selectedBoards.length < 2 || !question.trim()) return;

    setIsLoading(true);
    setShowResults(false);

    try {
      const multiBoardResults = await generateStaticMultiBoardResponses({
        question: question.trim(),
        selectedBoards,
      });

      setResults(multiBoardResults);
      setShowResults(true);
    } catch (error) {
      console.error('Failed to generate multi-board responses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedBoards([]);
    setQuestion('');
    setResults(null);
    setShowResults(false);
  };

  const isPremiumContent = selectedBoards.length >= 2 && hasPremiumDemoContent(selectedBoards);
  const canSubmit = selectedBoards.length >= 2 && question.trim().length > 0;

  return (
    <div className={`page-container py-16 ${className}`}>
      {/* Header Block with proper vertical rhythm */}
      <div className="text-center rhythm-section-gap">
        <div className="flex items-center justify-center gap-4 rhythm-h1-subhead">
          {onBack && (
            <Button
              variant="outline"
              onClick={onBack}
              className="flex items-center gap-2"
            >
              ← Back
            </Button>
          )}
          <h1 className="type-h1">
            Multi-Board Consultation
          </h1>
        </div>
        <p className="type-body text-gray-600 max-w-2xl mx-auto rhythm-subhead-meta">
          Get coordinated expertise from multiple advisory boards working together 
          to provide comprehensive, well-rounded guidance.
        </p>
      </div>

      {/* Board Selection */}
      {!showResults && (
        <Card className="p-6">
          <MultiBoardSelector
            availableBoards={Object.values(BOARDS)}
            selectedBoards={selectedBoards}
            onBoardSelection={handleBoardSelection}
            maxSelections={4}
          />
          

        </Card>
      )}

      {/* Question Input */}
      {selectedBoards.length >= 2 && !showResults && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Your Question</h2>
          <div className="space-y-4">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Enter your question for the advisory boards..."
              className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Selected boards: {selectedBoards.map(b => b.title).join(', ')}
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={isLoading}
                >
                  Reset
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit || isLoading}
                  className="min-w-[120px]"
                >
                  {isLoading ? 'Consulting...' : 'Get Advice'}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <MultiBoardLoadingCard
          selectedBoards={selectedBoards}
          question={question}
        />
      )}

      {/* Results Display */}
      {showResults && results && (
        <CoordinatedResponsePanel
          results={results}
          selectedBoards={selectedBoards}
          question={question}
          onReset={handleReset}
        />
      )}
    </div>
  );
};

export default MultiBoardDemo;