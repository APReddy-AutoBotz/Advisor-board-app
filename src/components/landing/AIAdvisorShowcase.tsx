/**
 * AI-Advisor Gallery Showcase Component
 * 
 * Demonstrates the new AI-Advisor Gallery on the landing page
 * Shows premium visual design and portrait integration
 */

import React, { useState } from 'react';
import { AIAdvisorGallery } from '../advisors/AIAdvisorGallery';
import { getBoardTheme } from '../../lib/boardThemes';
import type { Advisor, DomainId } from '../../types/domain';

// Sample advisors for showcase (with gender preferences)
const createShowcaseAdvisors = (boardId: DomainId): Advisor[] => {
  const baseAdvisors = {
    productboard: [
      {
        id: 'showcase-pm-1',
        name: 'Product Strategy Expert',
        expertise: 'Senior Product Manager',
        background: 'Former VP of Product at leading tech companies with 15+ years experience in product strategy and market analysis',
        specialties: ['Product Strategy', 'Market Analysis', 'User Research', 'Go-to-Market'],
        genderPref: 'fem' as const
      },
      {
        id: 'showcase-pm-2', 
        name: 'Technical Product Leader',
        expertise: 'Principal Product Manager',
        background: 'Expert in technical product development and engineering collaboration',
        specialties: ['Technical Strategy', 'Engineering', 'Architecture', 'Scalability'],
        genderPref: 'masc' as const
      },
      {
        id: 'showcase-pm-3',
        name: 'Growth Product Specialist',
        expertise: 'Growth Product Manager',
        background: 'Specialist in product growth, analytics, and user acquisition strategies',
        specialties: ['Growth Strategy', 'Analytics', 'A/B Testing', 'User Acquisition'],
        genderPref: 'any' as const
      }
    ],
    cliniboard: [
      {
        id: 'showcase-clinical-1',
        name: 'Clinical Research Director',
        expertise: 'Clinical Research Specialist',
        background: 'Former FDA reviewer with 20+ years in clinical development and regulatory affairs',
        specialties: ['Clinical Trials', 'FDA Guidance', 'Regulatory Strategy', 'Safety Monitoring'],
        genderPref: 'fem' as const
      },
      {
        id: 'showcase-clinical-2',
        name: 'Regulatory Affairs Expert',
        expertise: 'Regulatory Affairs Director',
        background: 'Expert in drug development and regulatory submission processes',
        specialties: ['Regulatory Submissions', 'Drug Development', 'Compliance', 'Quality Assurance'],
        genderPref: 'masc' as const
      }
    ],
    eduboard: [
      {
        id: 'showcase-edu-1',
        name: 'Learning Design Expert',
        expertise: 'Curriculum Design Specialist',
        background: 'Educational technology researcher and curriculum designer with focus on modern pedagogy',
        specialties: ['Curriculum Design', 'Educational Technology', 'Learning Analytics', 'Assessment'],
        genderPref: 'masc' as const
      },
      {
        id: 'showcase-edu-2',
        name: 'EdTech Innovation Leader',
        expertise: 'Educational Technology Director',
        background: 'Pioneer in educational technology integration and digital learning experiences',
        specialties: ['EdTech Integration', 'Digital Learning', 'Innovation', 'Student Engagement'],
        genderPref: 'fem' as const
      }
    ],
    remediboard: [
      {
        id: 'showcase-remedy-1',
        name: 'Holistic Wellness Expert',
        expertise: 'Naturopathic Medicine Specialist',
        background: 'Licensed naturopathic doctor specializing in integrative wellness and natural healing',
        specialties: ['Holistic Health', 'Natural Remedies', 'Nutrition', 'Wellness Coaching'],
        genderPref: 'fem' as const
      },
      {
        id: 'showcase-remedy-2',
        name: 'Integrative Health Advisor',
        expertise: 'Functional Medicine Practitioner',
        background: 'Expert in functional medicine approaches and lifestyle interventions',
        specialties: ['Functional Medicine', 'Lifestyle Medicine', 'Preventive Care', 'Root Cause Analysis'],
        genderPref: 'masc' as const
      }
    ]
  };

  return baseAdvisors[boardId].map(advisor => ({
    ...advisor,
    domain: boardId,
    isSelected: false,
    credentials: 'Professional credentials and certifications',
    yearsExperience: Math.floor(Math.random() * 15) + 10,
    publications: Math.floor(Math.random() * 50) + 5
  }));
};

export interface AIAdvisorShowcaseProps {
  className?: string;
}

export const AIAdvisorShowcase: React.FC<AIAdvisorShowcaseProps> = ({
  className = ''
}) => {
  const [selectedBoard, setSelectedBoard] = useState<DomainId>('productboard');
  const [selectedAdvisors, setSelectedAdvisors] = useState<Advisor[]>([]);

  const theme = getBoardTheme(selectedBoard);
  const showcaseAdvisors = createShowcaseAdvisors(selectedBoard);

  const boardOptions = [
    { id: 'productboard' as DomainId, name: 'Product Development', icon: '🚀' },
    { id: 'cliniboard' as DomainId, name: 'Clinical Research', icon: '🏥' },
    { id: 'eduboard' as DomainId, name: 'Education & Learning', icon: '🎓' },
    { id: 'remediboard' as DomainId, name: 'Holistic Wellness', icon: '🌿' }
  ];

  const handleBoardChange = (boardId: DomainId) => {
    setSelectedBoard(boardId);
    setSelectedAdvisors([]); // Reset selection when changing boards
  };

  const handleSelectionChange = (newSelectedAdvisors: Advisor[]) => {
    setSelectedAdvisors(newSelectedAdvisors);
  };

  const handleChatClick = (advisor: Advisor) => {
    console.log('🎯 Showcase chat clicked:', advisor.name);
    // In a real app, this would navigate to consultation
  };

  const handleProfileClick = (advisor: Advisor) => {
    console.log('👤 Showcase profile clicked:', advisor.name);
    // In a real app, this would open advisor profile modal
  };

  return (
    <div className={`py-16 bg-gradient-to-br from-gray-50 to-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            🤖 Meet Your AI Advisory Board
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Experience our premium AI-advisor gallery with beautiful portraits, 
            intelligent personas, and domain-specific expertise. Each advisor brings 
            unique insights powered by advanced AI.
          </p>
          
          {/* Board Selector */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {boardOptions.map(board => (
              <button
                key={board.id}
                onClick={() => handleBoardChange(board.id)}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  selectedBoard === board.id
                    ? 'text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
                style={selectedBoard === board.id ? {
                  backgroundColor: getBoardTheme(board.id).accent,
                  borderColor: getBoardTheme(board.id).accent
                } : {}}
              >
                <span className="mr-2">{board.icon}</span>
                {board.name}
              </button>
            ))}
          </div>
        </div>

        {/* Showcase Gallery */}
        <div className="relative">
          {/* Background Decoration */}
          <div 
            className="absolute inset-0 rounded-3xl opacity-5 -z-10"
            style={{
              background: `linear-gradient(135deg, ${theme.gradient.from} 0%, ${theme.gradient.to} 100%)`
            }}
          />
          
          {/* Gallery Container */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200 shadow-xl">
            <AIAdvisorGallery
              advisors={showcaseAdvisors}
              boardId={selectedBoard}
              onSelectionChange={handleSelectionChange}
              onChatClick={handleChatClick}
              onProfileClick={handleProfileClick}
              variant="solid"
              showSelectionCounter={true}
              maxColumns={3}
            />
          </div>
        </div>

        {/* Features Highlight */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div 
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: theme.chip.background }}
            >
              <svg className="w-8 h-8" style={{ color: theme.accent }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Premium Design</h3>
            <p className="text-gray-600">Beautiful gradient backgrounds, professional portraits, and polished UI components</p>
          </div>
          
          <div className="text-center">
            <div 
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: theme.chip.background }}
            >
              <svg className="w-8 h-8" style={{ color: theme.accent }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Personas</h3>
            <p className="text-gray-600">AI-generated names, gender-balanced portraits, and domain-specific expertise</p>
          </div>
          
          <div className="text-center">
            <div 
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: theme.chip.background }}
            >
              <svg className="w-8 h-8" style={{ color: theme.accent }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Performance Optimized</h3>
            <p className="text-gray-600">Lazy loading, accessibility compliant, and mobile-first responsive design</p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">Ready to Experience AI Advisory?</h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Start your consultation with our expert AI advisors. Get personalized insights, 
              professional guidance, and innovative solutions for your challenges.
            </p>
            <button
              className="px-8 py-4 rounded-xl font-semibold text-gray-900 transition-all duration-200 hover:scale-105 shadow-lg"
              style={{ backgroundColor: theme.accent }}
            >
              🚀 Start Your AI Consultation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAdvisorShowcase;
