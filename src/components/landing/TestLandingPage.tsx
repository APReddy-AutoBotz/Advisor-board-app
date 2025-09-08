import React from 'react';
import { BOARDS, getTotalExperts, getCombinedExperience } from '../../lib/boards';
import SimpleEnhancedHero from './SimpleEnhancedHero';

const TestLandingPage: React.FC = () => {
  console.log('🔥 TestLandingPage rendering');
  console.log('📊 BOARDS:', BOARDS);
  console.log('👥 Total Experts:', getTotalExperts());
  console.log('⏰ Combined Experience:', getCombinedExperience());

  const handleStartSession = () => {
    console.log('🚀 Start session clicked!');
  };

  return (
    <div className="min-h-screen">
      {/* Enhanced Hero */}
      <SimpleEnhancedHero onStartSession={handleStartSession} />
      
      {/* Board Grid */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Choose Your Advisory Board</h2>
            <p className="text-lg text-gray-600">
              Access {getTotalExperts()} expert advisors with {getCombinedExperience()}+ years of combined experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.values(BOARDS).map((board) => (
              <div
                key={board.id}
                className="bg-white rounded-2xl p-6 shadow-lg border-2 hover:shadow-xl transition-all duration-300 cursor-pointer"
                style={{ borderTopColor: board.color.primary }}
                onClick={() => console.log('Board clicked:', board.title)}
              >
                <div 
                  className="w-16 h-16 rounded-xl flex items-center justify-center mb-4 mx-auto"
                  style={{ backgroundColor: board.color.background }}
                >
                  <span 
                    className="text-2xl font-bold"
                    style={{ color: board.color.primary }}
                  >
                    {board.title.charAt(0)}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold mb-2">{board.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{board.description}</p>
                
                <div className="flex flex-wrap gap-1 mb-4">
                  {board.experts.slice(0, 3).map((expert, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 text-xs font-medium rounded"
                      style={{ 
                        backgroundColor: board.color.background,
                        color: board.color.text 
                      }}
                    >
                      {expert.code}
                    </span>
                  ))}
                </div>
                
                <div className="text-sm text-gray-500">
                  {board.experts.length} experts available
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl">
            <h2 className="text-2xl font-bold mb-4">🚀 Mega Mode</h2>
            <p className="text-gray-600 mb-6">
              Consult with ALL expert boards simultaneously for comprehensive insights
            </p>
            <button 
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all"
              onClick={() => console.log('Mega mode clicked!')}
            >
              Launch Mega Consultation
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TestLandingPage;