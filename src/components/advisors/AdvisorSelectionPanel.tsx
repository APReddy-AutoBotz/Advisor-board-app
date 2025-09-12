import React, { useState } from 'react';
import type { Domain, Advisor } from '../../types/domain';
import { AIAdvisorGallery } from './AIAdvisorGallery';
import { extractFirstName } from '../../utils/nameUtils';
import Button from '../common/Button';
import Card from '../common/Card';
import { getBoardTheme } from '../../lib/boardThemes';

interface AdvisorSelectionPanelProps {
  domain: Domain;
  onAdvisorSelect: (selectedAdvisors: Advisor[]) => void;
  onProceed: (selectedAdvisors: Advisor[]) => void;
  onBack?: () => void;
  selectedAdvisors: Advisor[];
  className?: string;
}

const AdvisorSelectionPanel: React.FC<AdvisorSelectionPanelProps> = ({
  domain,
  onAdvisorSelect,
  onProceed,
  onBack,
  selectedAdvisors,
  className = '',
}) => {
  const theme = getBoardTheme(domain.id);
  const [profileModalAdvisor, setProfileModalAdvisor] = useState<Advisor | null>(null);

  // Handle selection changes from AI Gallery
  const handleSelectionChange = (newSelectedAdvisors: Advisor[]) => {
    onAdvisorSelect(newSelectedAdvisors);
  };

  // Handle chat click - ensure advisor is selected and proceed to consultation
  const handleChatClick = (advisor: Advisor) => {
    console.log('🚀 Starting chat with advisor:', advisor.name);
    
    // Auto-select the advisor if not already selected
    const updatedSelection = selectedAdvisors.some(a => a.id === advisor.id) 
      ? selectedAdvisors 
      : [...selectedAdvisors, advisor];
    
    // Update selection first
    onAdvisorSelect(updatedSelection);
    
    // Proceed immediately with the updated selection
    console.log('📋 Proceeding to consultation with advisors:', updatedSelection.map(a => a.name));
    onProceed(updatedSelection);
  };

  // Handle profile click - show advisor profile modal
  const handleProfileClick = (advisor: Advisor) => {
    console.log('📊 Profile clicked for:', advisor.name);
    setProfileModalAdvisor(advisor);
  };

  return (
    <div className={`min-h-screen bg-gray-50 py-8 ${className}`}>
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Select Your {domain.name} Advisors
              </h1>
              <p className="text-gray-600 mt-2">
                Choose the experts you'd like to consult with for your question
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

          {/* Domain Info with Enhanced Styling */}
          <Card className="mb-8 overflow-hidden" padding="none">
            {/* Gradient Header */}
            <div 
              className="h-20 relative"
              style={{
                background: `linear-gradient(135deg, ${theme.gradient.from} 0%, ${theme.gradient.to} 100%)`
              }}
            >
              {/* Noise Overlay */}
              {theme.noiseOverlay && (
                <div 
                  className="absolute inset-0 opacity-8"
                  style={{
                    backgroundImage: `url("${theme.noiseOverlay}")`,
                    backgroundSize: '256px 256px'
                  }}
                />
              )}
            </div>
            
            {/* Content - Elevated Design */}
            <div className="px-6 pb-6 pt-4 relative">
              <div className="flex items-center space-x-4">
                <div 
                  className="w-16 h-16 rounded-xl shadow-lg flex items-center justify-center ring-4 ring-white transform -translate-y-8"
                  style={{ backgroundColor: theme.accent }}
                >
                  <div className="w-8 h-8 bg-white/20 rounded-lg"></div>
                </div>
                <div className="flex-1 pt-2">
                  <h2 className="text-2xl font-bold text-gray-900">{domain.name}</h2>
                  <p className="text-gray-600 mt-1">{domain.description}</p>
                  <div className="flex items-center mt-2 text-sm text-gray-500">
                    <span>{domain.advisors.length} AI Expert{domain.advisors.length !== 1 ? 's' : ''} Available</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* AI-Advisor Gallery */}
        <AIAdvisorGallery
          advisors={domain.advisors}
          boardId={domain.id}
          onSelectionChange={handleSelectionChange}
          onChatClick={handleChatClick}
          onProfileClick={handleProfileClick}
          variant="solid"
          showSelectionCounter={true}
          maxColumns={3}
          className="mb-8"
        />

        {/* Enhanced Proceed Button */}
        {selectedAdvisors.length > 0 && (
          <Card className="mb-8 bg-gradient-to-r from-gray-50 to-white border-2" padding="lg" style={{ borderColor: theme.accent }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: theme.accent }}
                >
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Ready to Start! 🚀
                  </h3>
                  <p className="text-gray-600">
                    {selectedAdvisors.length} AI expert{selectedAdvisors.length !== 1 ? 's' : ''} selected for your consultation
                  </p>
                </div>
              </div>
              <Button
                onClick={() => onProceed(selectedAdvisors)}
                size="lg"
                className="shadow-lg hover:shadow-xl transition-all duration-200"
                style={{ 
                  backgroundColor: theme.accent,
                  borderColor: theme.accent
                }}
                rightIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                }
              >
                Start AI Consultation
              </Button>
            </div>
          </Card>
        )}

        {/* Enhanced Getting Started Guide */}
        {selectedAdvisors.length === 0 && (
          <Card className="text-center border-2 border-dashed" padding="xl" style={{ borderColor: theme.chip.border }}>
            <div className="mb-6">
              <div 
                className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: theme.chip.background }}
              >
                <svg className="w-10 h-10" style={{ color: theme.accent }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              🤖 Build Your AI Advisory Board
            </h3>
            <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
              Select from our expert AI personas in {domain.name} to get diverse, 
              professional insights on your questions. Each advisor brings unique expertise and perspectives.
            </p>
            
            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 text-left">
              <div className="flex items-start space-x-3">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: theme.accent }}
                >
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Expert AI Personas</h4>
                  <p className="text-sm text-gray-600">Each advisor is trained with domain-specific expertise</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: theme.accent }}
                >
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Multiple Perspectives</h4>
                  <p className="text-sm text-gray-600">Get diverse viewpoints on your challenges</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: theme.accent }}
                >
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Educational Only</h4>
                  <p className="text-sm text-gray-600">AI-generated insights for learning purposes</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 text-sm text-gray-500">
              👆 Click on any advisor card above to add them to your consultation session
            </div>
          </Card>
        )}
      </div>

      {/* Advisor Profile Modal */}
      {profileModalAdvisor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {profileModalAdvisor.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{profileModalAdvisor.name}</h2>
                  <p className="text-lg text-gray-600">{profileModalAdvisor.expertise}</p>
                </div>
              </div>
              <button
                onClick={() => setProfileModalAdvisor(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Background */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Professional Background</h3>
                <p className="text-gray-700 leading-relaxed">{profileModalAdvisor.background}</p>
              </div>

              {/* Credentials */}
              {(profileModalAdvisor as any).credentials && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Credentials</h3>
                  <p className="text-gray-700">{(profileModalAdvisor as any).credentials}</p>
                </div>
              )}

              {/* Specialties */}
              {(profileModalAdvisor as any).specialties && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Areas of Expertise</h3>
                  <div className="flex flex-wrap gap-2">
                    {(profileModalAdvisor as any).specialties.map((specialty: string, index: number) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Disclaimer */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-semibold text-yellow-800">AI Persona Disclaimer</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      This is an AI persona trained to simulate expert reasoning in {domain.name}. 
                      It is not a real person. Use for educational purposes only.
                      {(domain.id === 'cliniboard' || domain.id === 'remediboard') && 
                        ' This does not constitute medical or legal advice.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={() => {
                    setProfileModalAdvisor(null);
                    handleChatClick(profileModalAdvisor);
                  }}
                  className="flex-1"
                  style={{ backgroundColor: theme.accent }}
                >
                  Start Chat with {extractFirstName(profileModalAdvisor.name)}
                </Button>
                <Button
                  onClick={() => setProfileModalAdvisor(null)}
                  variant="outline"
                  className="px-6"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvisorSelectionPanel;
