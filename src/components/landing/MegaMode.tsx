import React, { useState } from 'react';
import Button from '../common/Button';
import { BOARDS, trackEvent } from '../../lib/boards';

interface MegaModeProps {
  onMegaConsultation: (prompt: string) => void;
}

const MegaMode: React.FC<MegaModeProps> = ({ onMegaConsultation }) => {
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');
  
  // Collect sample prompts from all boards
  const allSamplePrompts = Object.values(BOARDS).flatMap(board => 
    board.samplePrompts.map(prompt => ({ prompt, boardId: board.id, boardTitle: board.title }))
  );
  
  // Featured sample prompts for demo
  const featuredPrompts = [
    {
      prompt: "How long should I wait before reporting a serious adverse event to authorities?",
      boardId: "cliniboard",
      boardTitle: "Clinical Research",
      category: "🏥 Regulatory"
    },
    {
      prompt: "How do I prioritize features for maximum user impact?",
      boardId: "productboard", 
      boardTitle: "Product Strategy",
      category: "🚀 Product"
    },
    {
      prompt: "How do I design a curriculum that maximizes student engagement?",
      boardId: "eduboard",
      boardTitle: "Education",
      category: "📚 Learning"
    }
  ];

  const handleMegaCTA = () => {
    const prompt = selectedPrompt || featuredPrompts[0].prompt;
    trackEvent('mega_cta_click', { 
      prompt: prompt.substring(0, 50) + '...', 
      has_custom_prompt: selectedPrompt.length > 0 
    });
    onMegaConsultation(prompt);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 py-16 sm:py-24">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('/images/grid.svg')] opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Mega Mode Badge */}
          <div className="mb-6 inline-flex items-center rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-6 py-2 text-sm font-bold text-black">
            ⚡ MEGA MODE • All Boards • Maximum Insights
          </div>
          
          {/* Headline */}
          <h2 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Get Advice from
            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent"> All Experts</span>
            <br />at Once
          </h2>
          
          {/* Why Mega Mode */}
          <p className="mb-8 text-xl leading-8 text-gray-300">
            Why consult one board when you can get perspectives from clinical researchers, product leaders, 
            educators, and wellness experts simultaneously? Get comprehensive insights in one session.
          </p>
          
          {/* Sample Prompts */}
          <div className="mb-10">
            <h3 className="mb-6 text-lg font-semibold text-white">Try a sample question:</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              {featuredPrompts.map((item, index) => (
                <SamplePromptCard
                  key={index}
                  prompt={item.prompt}
                  category={item.category}
                  boardTitle={item.boardTitle}
                  isSelected={selectedPrompt === item.prompt}
                  onClick={() => setSelectedPrompt(item.prompt)}
                />
              ))}
            </div>
          </div>
          
          {/* Custom Prompt Input */}
          <div className="mb-8">
            <div className="mx-auto max-w-2xl">
              <label htmlFor="custom-prompt" className="sr-only">
                Enter your own question
              </label>
              <textarea
                id="custom-prompt"
                rows={3}
                className="w-full rounded-lg border-0 bg-white/10 px-4 py-3 text-white placeholder-gray-300 backdrop-blur-sm focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="Or ask your own question... (e.g., 'How do I balance innovation with regulatory compliance in medical device development?')"
                value={selectedPrompt}
                onChange={(e) => setSelectedPrompt(e.target.value)}
              />
            </div>
          </div>
          
          {/* Mega CTA */}
          <div className="mb-8">
            <Button
              onClick={handleMegaCTA}
              size="lg"
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 px-12 py-4 text-lg font-bold text-black shadow-2xl hover:from-yellow-500 hover:to-orange-600 focus:ring-4 focus:ring-yellow-200 sm:w-auto"
            >
              🔥 Launch Mega Consultation
            </Button>
          </div>
          
          {/* Mega Mode Stats */}
          <div className="flex flex-wrap justify-center gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-yellow-400">4</div>
              <div className="text-sm text-gray-300">Expert Boards</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-400">30+</div>
              <div className="text-sm text-gray-300">Total Experts</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-400">360°</div>
              <div className="text-sm text-gray-300">Perspective</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-400">1</div>
              <div className="text-sm text-gray-300">Session</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Sample Prompt Card Component
interface SamplePromptCardProps {
  prompt: string;
  category: string;
  boardTitle: string;
  isSelected: boolean;
  onClick: () => void;
}

const SamplePromptCard: React.FC<SamplePromptCardProps> = ({ 
  prompt, 
  category, 
  boardTitle, 
  isSelected, 
  onClick 
}) => {
  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-lg p-4 text-left transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
        isSelected 
          ? 'bg-gradient-to-br from-yellow-400/20 to-orange-500/20 ring-2 ring-yellow-400' 
          : 'bg-white/10 backdrop-blur-sm hover:bg-white/20'
      }`}
    >
      {/* Category Badge */}
      <div className="mb-3 inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white">
        {category}
      </div>
      
      {/* Prompt Text */}
      <p className="mb-3 text-sm leading-relaxed text-white group-hover:text-yellow-100">
        "{prompt}"
      </p>
      
      {/* Board Attribution */}
      <div className="text-xs text-gray-300">
        from {boardTitle}
      </div>
      
      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-400">
            <svg className="h-4 w-4 text-black" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}
    </button>
  );
};

export default MegaMode;