import React from 'react';
import Card from '../common/Card';

interface AdvisorShowcaseProps {
  className?: string;
}

const AdvisorShowcase: React.FC<AdvisorShowcaseProps> = ({ className = '' }) => {
  const featuredAdvisors = [
    {
      name: 'Dr. Sarah Chen',
      expertise: 'Clinical Research Strategy',
      credentials: 'MD, PhD, Former FDA Advisory Committee Member',
      avatar: '/images/advisors/dr-sarah-chen.svg',
      background: 'Former VP Clinical Development at Pfizer',
      achievements: ['20+ years experience', '50+ Phase III trials', 'FDA Advisory Committee'],
      specialties: ['Phase III Trials', 'FDA Interactions', 'Global Regulatory Strategy']
    },
    {
      name: 'Dr. Michael Rodriguez',
      expertise: 'Regulatory Affairs',
      credentials: 'PharmD, JD, Former FDA CDER Director',
      avatar: '/images/advisors/dr-michael-rodriguez.svg',
      background: 'Former FDA CDER Director',
      achievements: ['FDA Leadership', '100+ NDA Reviews', 'Regulatory Expert'],
      specialties: ['FDA Submissions', 'Regulatory Strategy', 'Compliance']
    },
    {
      name: 'Dr. Priya Patel',
      expertise: 'Pharmacovigilance & Drug Safety',
      credentials: 'MD, MPH, Board Certified in Preventive Medicine',
      avatar: '/images/advisors/dr-priya-patel.svg',
      background: 'Chief Safety Officer at Novartis',
      achievements: ['Global Safety Expert', '200+ Safety Reviews', 'Risk Management'],
      specialties: ['Drug Safety', 'Risk Management', 'Global Pharmacovigilance']
    }
  ];

  return (
    <div className={`${className}`}>
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          🏆 World-Class Clinical Advisory Board
        </h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Get instant access to former FDA directors, Big Pharma executives, and leading clinical researchers. 
          Our advisory board represents <span className="font-bold text-blue-600">200+ years of combined experience</span> 
          and <span className="font-bold text-green-600">$50B+ in drug approvals</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {featuredAdvisors.map((advisor, index) => (
          <Card key={index} className="text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2" padding="xl">
            {/* Professional Avatar */}
            <div className="relative mb-6">
              <img 
                src={advisor.avatar} 
                alt={advisor.name}
                className="w-24 h-24 mx-auto rounded-full border-4 border-white shadow-xl"
              />
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                <div className="bg-yellow-400 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold">
                  EXPERT
                </div>
              </div>
            </div>

            {/* Advisor Details */}
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {advisor.name}
                </h3>
                <p className="text-sm text-gray-500 font-medium">
                  {advisor.credentials}
                </p>
              </div>

              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                {advisor.expertise}
              </div>

              <p className="text-sm text-gray-600 leading-relaxed">
                {advisor.background}
              </p>

              {/* Achievements */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900">Key Achievements:</h4>
                <div className="flex flex-wrap gap-1 justify-center">
                  {advisor.achievements.map((achievement, i) => (
                    <span key={i} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                      ✓ {achievement}
                    </span>
                  ))}
                </div>
              </div>

              {/* Specialties */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900">Specialties:</h4>
                <div className="flex flex-wrap gap-1 justify-center">
                  {advisor.specialties.map((specialty, i) => (
                    <span key={i} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Stats Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200" padding="xl">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            🎯 Advisory Board Impact
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">12</div>
              <div className="text-sm text-gray-600">Expert Advisors</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">200+</div>
              <div className="text-sm text-gray-600">Years Experience</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">$50B+</div>
              <div className="text-sm text-gray-600">Drug Approvals</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">24/7</div>
              <div className="text-sm text-gray-600">Availability</div>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-white rounded-lg border border-blue-200">
            <p className="text-sm text-gray-600">
              <span className="font-bold text-blue-600">🏆 Industry First:</span> The only platform providing instant access to 
              former FDA directors, Big Pharma executives, and leading clinical researchers in a single consultation.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdvisorShowcase;