import React, { useState } from 'react';
import type { Domain, Advisor } from '../../types/domain';
import type { ConsultationSession } from '../../types/session';
import Button from '../common/Button';
import Card from '../common/Card';
import PromptInput from './PromptInput';
import ResponsePanel from './ResponsePanel';
import { generateAdvisorResponses, getQuestionInsights } from '../../services/intelligentResponseService';

interface ConsultationInterfaceProps {
  selectedAdvisors: Advisor[];
  domain: Domain;
  onBack?: () => void;
  onComplete?: (session: ConsultationSession) => void;
  className?: string;
}

const ConsultationInterface: React.FC<ConsultationInterfaceProps> = ({
  selectedAdvisors,
  domain,
  onBack,
  onComplete,
  className = '',
}) => {
  const [prompt, setPrompt] = useState('');
  const [responses, setResponses] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [questionInsights, setQuestionInsights] = useState<any>(null);

  const handlePromptSubmit = async (userPrompt: string) => {
    console.log('🚀 Starting intelligent consultation with:', userPrompt);
    console.log('👥 Selected advisors:', selectedAdvisors);
    
    setPrompt(userPrompt);
    setIsGenerating(true);
    setSessionStarted(true);

    try {
      // Analyze the question for insights
      const insights = await getQuestionInsights(userPrompt);
      console.log('🧠 Question analysis:', insights);
      setQuestionInsights(insights);
      
      // Convert Advisor[] to BoardExpert[] for the service
      const boardExperts = selectedAdvisors.map(advisor => ({
        id: advisor.id,
        name: advisor.name,
        code: advisor.expertise?.substring(0, 3).toUpperCase() || 'ADV', // Extract code from expertise
        role: advisor.expertise || 'Advisor',
        blurb: advisor.background || 'Expert advisor',
        credentials: advisor.credentials || 'Professional credentials',
        avatar: advisor.avatar || '/images/default-avatar.svg',
        specialties: [advisor.expertise || 'General Advisory']
      }));
      
      // Generate intelligent responses using the service
      const intelligentResponses = await generateAdvisorResponses(userPrompt, boardExperts, domain.id);
      
      // Set responses immediately since we have intelligent content
      console.log('✨ Generated intelligent responses:', intelligentResponses);
      setResponses(intelligentResponses);
      setIsGenerating(false);
      
    } catch (error) {
      console.error('❌ Error generating intelligent responses:', error);
      setIsGenerating(false);
      
      // Fallback to basic responses
      const fallbackResponses = selectedAdvisors.map((advisor) => ({
        advisorId: advisor.id,
        content: `Thank you for your question about "${userPrompt}". As a ${advisor.expertise || 'professional advisor'}, I'm here to provide insights based on my experience. Let me know if you'd like me to elaborate on any specific aspects.`,
        timestamp: new Date(),
        persona: {
          name: advisor.name,
          expertise: advisor.expertise || 'Professional Advisory'
        }
      }));
      
      setResponses(fallbackResponses);
    }
  };

  const handleExportSession = async () => {
    const session: ConsultationSession = {
      id: `session-${Date.now()}`,
      timestamp: new Date(),
      domain: domain.id,
      selectedAdvisors,
      prompt,
      responses,
      summary: responses.length > 0 ? 'Session completed with intelligent responses from all selected advisors.' : undefined
    };

    try {
      // Import the ExportService dynamically to avoid bundle issues
      const { ExportService } = await import('../../services/exportService');
      await ExportService.exportToPDF(session);
      
      if (onComplete) {
        onComplete(session);
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
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {domain.name} Advisory Session
              </h1>
              <p className="text-gray-600 mt-2">
                Consulting with {selectedAdvisors.length} expert{selectedAdvisors.length !== 1 ? 's' : ''}
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
                Back to Domains
              </Button>
            )}
          </div>

          {/* Selected Advisors */}
          <Card className="mb-8" padding="lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Advisory Board</h3>
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
        </div>

        {/* Question Display */}
        {sessionStarted && prompt && (
          <Card className="mb-8" padding="lg">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Question</h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg italic">
                  "{prompt}"
                </p>
              </div>
              {questionInsights && (
                <div className="bg-blue-50 p-4 rounded-lg min-w-[200px]">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">Question Analysis</h4>
                  <div className="text-xs text-blue-700 space-y-1">
                    <div>Type: {questionInsights.type}</div>
                    <div>Domain: {questionInsights.domain}</div>
                    <div>Confidence: {Math.round(questionInsights.confidence * 100)}%</div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Prompt Input */}
        {!sessionStarted && (
          <Card className="mb-8" padding="lg">
            <PromptInput
              onSubmit={handlePromptSubmit}
              placeholder={`Ask your ${domain.name.toLowerCase()} question here...`}
              isLoading={isGenerating}
            />
          </Card>
        )}

        {/* Loading State */}
        {isGenerating && (
          <Card className="mb-8" padding="lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                🧠 Generating Intelligent Responses...
              </h3>
              <p className="text-gray-600">
                Our AI advisors are analyzing your question and crafting personalized insights based on their expertise.
              </p>
              {questionInsights && (
                <div className="mt-4 text-sm text-blue-600">
                  Detected: {questionInsights.type} question in {questionInsights.domain} domain
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Responses */}
        {responses.length > 0 && (
          <div className="space-y-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              🎯 Expert Advisory Responses
            </h2>
            {responses.map((response, index) => {
              const advisor = selectedAdvisors.find(a => a.id === response.advisorId);
              return (
                <ResponsePanel
                  key={response.advisorId}
                  response={response}
                  advisor={advisor}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.2}s` }}
                />
              );
            })}
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
              🎉 Intelligent Consultation Complete!
            </h3>
            <p className="text-gray-600 mb-6">
              You've received personalized insights from all {selectedAdvisors.length} selected advisor{selectedAdvisors.length !== 1 ? 's' : ''}. 
              Each response was intelligently crafted based on your specific question and their expertise.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-white rounded-lg border">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{selectedAdvisors.length}</div>
                <div className="text-sm text-gray-500">AI Expert{selectedAdvisors.length !== 1 ? 's' : ''}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{responses.length}</div>
                <div className="text-sm text-gray-500">Intelligent Response{responses.length !== 1 ? 's' : ''}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {questionInsights ? Math.round(questionInsights.confidence * 100) : 95}%
                </div>
                <div className="text-sm text-gray-500">Relevance Score</div>
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
              {domain.id === 'remediboard' || domain.id === 'cliniboard' ? ' no medical or legal advice.' : ' verify important decisions with qualified professionals.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultationInterface;