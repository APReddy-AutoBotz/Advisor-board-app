/**
 * Persona Strip - Horizontal Scroll Showcase
 * Shows all 6 portraits with board themes, names, and CTAs
 * Updated with safety-compliant persona bios and AI disclaimers
 */

import React, { useState } from 'react';
import { getBoardTheme } from '../../lib/boardThemes';
import { NameFactory } from '../../lib/nameFactory';
import { PortraitAssignmentEngine } from '../../lib/portraitRegistry';
import { trackEvent } from '../../lib/boards';
import { SAFE_PERSONA_BIOS, AI_PERSONA_INFO_POPOVER, CTA_BUTTON_TEMPLATE } from '../../data/safePersonaBios';
import Button from '../common/Button';

interface PersonaStripProps {
  className?: string;
}

interface PersonaShowcaseItem {
  id: string;
  boardId: string;
  portraitKey: string;
  genderTag: 'feminine' | 'masculine';
  role: string;
  shortDescription: string;
}

// Showcase personas using all 6 portraits with safety-compliant roles
const SHOWCASE_PERSONAS: PersonaShowcaseItem[] = [
  {
    id: 'sarah-kim',
    boardId: 'productboard',
    portraitKey: 'a1_strategy-pm',
    genderTag: 'masculine',
    role: 'Chief Product Advisor (AI Persona)',
    shortDescription: 'Product strategy & platform scaling',
  },
  {
    id: 'sarah-chen',
    boardId: 'cliniboard', 
    portraitKey: 'a2_safety-md',
    genderTag: 'feminine',
    role: 'Clinical Research Advisor (AI Persona)',
    shortDescription: 'Clinical trials & regulatory strategy',
  },
  {
    id: 'michael-rodriguez',
    boardId: 'cliniboard',
    portraitKey: 'a3_reg-reviewer', 
    genderTag: 'masculine',
    role: 'Regulatory Affairs Advisor (AI Persona)',
    shortDescription: 'FDA submissions & compliance',
  },
  {
    id: 'michael-zhang',
    boardId: 'productboard',
    portraitKey: 'a4_data-scientist',
    genderTag: 'masculine', 
    role: 'Data Science Advisor (AI Persona)',
    shortDescription: 'Analytics & machine learning',
  },
  {
    id: 'maria-garcia-edu',
    boardId: 'eduboard',
    portraitKey: 'a5_pedagogy-mentor',
    genderTag: 'feminine',
    role: 'Curriculum Design Advisor (AI Persona)', 
    shortDescription: 'Learning design & assessment',
  },
  {
    id: 'james-wilson-wellness',
    boardId: 'remediboard',
    portraitKey: 'a6_diet-lifestyle',
    genderTag: 'masculine',
    role: 'Naturopathic Medicine Advisor (AI Persona)',
    shortDescription: 'Integrative & holistic wellness',
  },
];

interface PersonaCardProps {
  persona: PersonaShowcaseItem;
  onChatClick: (persona: PersonaShowcaseItem) => void;
  onInfoClick: (persona: PersonaShowcaseItem) => void;
}

const PersonaCard: React.FC<PersonaCardProps> = ({ persona, onChatClick, onInfoClick }) => {
  const theme = getBoardTheme(persona.boardId);
  const nameFactory = new NameFactory('showcase-session');
  const generatedName = nameFactory.generateName(persona.boardId, persona.id, 0, persona.genderTag);
  
  // Get safety-compliant bio data
  const safeBio = SAFE_PERSONA_BIOS[persona.id];
  
  const handleChatClick = () => {
    trackEvent('persona_chat_click', { 
      advisorId: persona.id, 
      board: persona.boardId,
      portraitKey: persona.portraitKey 
    });
    onChatClick(persona);
  };

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    trackEvent('persona_info_open', { 
      advisorId: persona.id, 
      board: persona.boardId 
    });
    onInfoClick(persona);
  };

  return (
    <div className="flex-shrink-0 w-80 bg-white rounded-xl shadow-card ring-1 ring-ink-200 overflow-hidden hover:shadow-hover transition-all duration-hover group">
      {/* Board Theme Top Band */}
      <div 
        className={`h-2 w-full ${theme.gradient.css} relative overflow-hidden`}
      >
        {/* Grain Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.08] mix-blend-overlay"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.08\'/%3E%3C/svg%3E")' }}
        />
      </div>
      
      <div className="p-6">
        {/* Portrait with 2px White Ring */}
        <div className="relative mb-4 mx-auto w-20 h-20">
          <img
            src={`/Portraits/${persona.portraitKey}.png`}
            alt={`Illustrated portrait of AI ${generatedName.fullName} (simulated persona)`}
            className="w-full h-full object-cover rounded-full ring-2 ring-white shadow-lg"
            loading="lazy"
          />
          
          {/* AI Badge */}
          <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">
            🤖 AI
          </div>
        </div>
        
        {/* Name & Role */}
        <div className="text-center mb-4">
          <h3 className="font-semibold text-ink-900 mb-1">{generatedName.fullName}</h3>
          <p className="text-sm font-medium" style={{ color: theme.accent }}>
            {persona.role}
          </p>
          <p className="text-xs text-ink-600 mt-1">
            {persona.shortDescription}
          </p>
        </div>
        
        {/* CTAs */}
        <div className="space-y-3">
          <button
            onClick={handleChatClick}
            className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-hover focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {CTA_BUTTON_TEMPLATE(generatedName.firstName)}
          </button>
          
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={handleInfoClick}
              className="text-xs text-ink-500 hover:text-ink-700 transition-colors duration-hover flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              About this AI persona
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface InfoPopoverProps {
  persona: PersonaShowcaseItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const InfoPopover: React.FC<InfoPopoverProps> = ({ persona, isOpen, onClose }) => {
  if (!isOpen || !persona) return null;
  
  const nameFactory = new NameFactory('showcase-session');
  const generatedName = nameFactory.generateName(persona.boardId, persona.id, 0, persona.genderTag);
  const safeBio = SAFE_PERSONA_BIOS[persona.id];
  
  // Check if this is a medical/health-related board for additional disclaimer
  const isMedicalBoard = persona.boardId === 'cliniboard' || persona.boardId === 'remediboard';
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-hover animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-ink-900">{AI_PERSONA_INFO_POPOVER.title}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-ink-100 rounded transition-colors duration-hover"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4 text-sm text-ink-700">
          <p>
            <strong>{generatedName.fullName}</strong> is an AI persona trained on expert knowledge patterns. 
            {safeBio ? ` ${safeBio.experience}.` : ''}
          </p>
          
          <p>
            {AI_PERSONA_INFO_POPOVER.content}
          </p>
          
          {safeBio?.expertise && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-blue-800 font-medium mb-2">Expertise Areas:</p>
              <ul className="text-blue-700 text-xs space-y-1">
                {safeBio.expertise.map((area, index) => (
                  <li key={index}>• {area}</li>
                ))}
              </ul>
            </div>
          )}
          
          {isMedicalBoard && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-amber-800 font-medium">
                {AI_PERSONA_INFO_POPOVER.medicalDisclaimer}
              </p>
            </div>
          )}
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-yellow-800 font-medium">
              🎓 Educational use only
            </p>
            <p className="text-yellow-700 text-xs mt-1">
              Always verify important decisions with qualified professionals in your field.
            </p>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
          >
            {AI_PERSONA_INFO_POPOVER.closeLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

const PersonaStrip: React.FC<PersonaStripProps> = ({ className = '' }) => {
  const [selectedPersona, setSelectedPersona] = useState<PersonaShowcaseItem | null>(null);
  const [showInfoPopover, setShowInfoPopover] = useState(false);

  const handleChatClick = (persona: PersonaShowcaseItem) => {
    const nameFactory = new NameFactory('showcase-session');
    const generatedName = nameFactory.generateName(persona.boardId, persona.id, 0, persona.genderTag);
    
    // In a real app, this would navigate to chat interface
    alert(`Starting chat with ${CTA_BUTTON_TEMPLATE(generatedName.firstName)}\n\nThis would open the consultation interface with this advisor pre-selected.`);
  };

  const handleInfoClick = (persona: PersonaShowcaseItem) => {
    setSelectedPersona(persona);
    setShowInfoPopover(true);
  };

  const handleClosePopover = () => {
    setShowInfoPopover(false);
    setSelectedPersona(null);
  };

  return (
    <>
      <section className={`py-16 sm:py-24 bg-white ${className}`}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Section Header */}
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
              Meet Your AI Advisory Team
            </h2>
            <p className="mt-4 text-lg leading-8 text-ink-600">
              Each AI persona is trained on domain expertise and professional experience to provide specialized insights.
            </p>
          </div>

          {/* Horizontal Scroll Container */}
          <div className="relative">
            <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide">
              {SHOWCASE_PERSONAS.map((persona) => (
                <PersonaCard
                  key={persona.id}
                  persona={persona}
                  onChatClick={handleChatClick}
                  onInfoClick={handleInfoClick}
                />
              ))}
            </div>
            
            {/* Scroll Indicators */}
            <div className="flex justify-center mt-6 gap-2">
              {SHOWCASE_PERSONAS.map((_, index) => (
                <div
                  key={index}
                  className="w-2 h-2 rounded-full bg-ink-300"
                />
              ))}
            </div>
          </div>
          
          {/* CTA Section */}
          <div className="text-center mt-12">
            <p className="text-ink-600 mb-6">
              Ready to consult with your personalized advisory board?
            </p>
            <Button
              onClick={() => {
                trackEvent('persona_strip_cta_click', { source: 'persona_strip' });
                document.getElementById('board-picker')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
            >
              Choose Your Advisory Board
            </Button>
          </div>
        </div>
      </section>

      {/* Info Popover */}
      <InfoPopover
        persona={selectedPersona}
        isOpen={showInfoPopover}
        onClose={handleClosePopover}
      />
      
      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  );
};

export default PersonaStrip;
