import React from 'react';
import { BOARDS } from '../../lib/boards';

const BenefitsSection: React.FC = () => {
  const benefits = [
    {
      id: 'clinical',
      title: 'Clinical Excellence',
      icon: '🏥',
      oneLiner: BOARDS.cliniboard.benefitOneLiner,
      description: 'Navigate regulatory complexities with confidence',
      stats: '90% faster approvals',
      color: 'blue'
    },
    {
      id: 'product', 
      title: 'Product Mastery',
      icon: '🚀',
      oneLiner: BOARDS.productboard.benefitOneLiner,
      description: 'Ship products users love with proven frameworks',
      stats: '3x faster time-to-market',
      color: 'purple'
    },
    {
      id: 'education',
      title: 'Learning Innovation', 
      icon: '📚',
      oneLiner: BOARDS.eduboard.benefitOneLiner,
      description: 'Create engaging learning with evidence-based design',
      stats: '85% better retention',
      color: 'orange'
    },
    {
      id: 'wellness',
      title: 'Holistic Health',
      icon: '🌿', 
      oneLiner: BOARDS.remediboard.benefitOneLiner,
      description: 'Achieve optimal wellness with holistic approaches',
      stats: '70% better outcomes',
      color: 'green'
    }
  ];

  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-900',
      accent: 'text-blue-600',
      icon: 'bg-blue-100'
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200', 
      text: 'text-purple-900',
      accent: 'text-purple-600',
      icon: 'bg-purple-100'
    },
    orange: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-900', 
      accent: 'text-orange-600',
      icon: 'bg-orange-100'
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-900',
      accent: 'text-green-600', 
      icon: 'bg-green-100'
    }
  };

  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Proven Results Across Industries
          </h2>
          <p className="mt-4 text-lg leading-8 text-gray-600">
            Our expert advisors deliver measurable outcomes in their specialized domains.
          </p>
        </div>

        {/* Benefits Grid - Mobile: 4-item list, Desktop: 2x2 grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:gap-8">
          {benefits.map((benefit) => {
            const colors = colorClasses[benefit.color as keyof typeof colorClasses];
            
            return (
              <div
                key={benefit.id}
                className={`group relative overflow-hidden rounded-2xl border-2 p-8 transition-all duration-300 hover:shadow-xl ${colors.bg} ${colors.border}`}
              >
                {/* Icon */}
                <div className={`mb-6 inline-flex h-16 w-16 items-center justify-center rounded-xl ${colors.icon}`}>
                  <span className="text-3xl" role="img" aria-label={benefit.title}>
                    {benefit.icon}
                  </span>
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <h3 className={`text-2xl font-bold ${colors.text}`}>
                    {benefit.title}
                  </h3>
                  
                  <p className={`text-lg font-semibold ${colors.accent}`}>
                    {benefit.oneLiner}
                  </p>
                  
                  <p className={`leading-relaxed ${colors.text} opacity-80`}>
                    {benefit.description}
                  </p>
                  
                  {/* Stats Badge */}
                  <div className="inline-flex items-center rounded-full bg-white px-4 py-2 shadow-sm">
                    <svg className={`mr-2 h-4 w-4 ${colors.accent}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className={`text-sm font-medium ${colors.text}`}>
                      {benefit.stats}
                    </span>
                  </div>
                </div>

                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center rounded-full bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-4 shadow-lg">
            <div className="flex -space-x-2">
              {/* Expert Avatars */}
              <div className="h-10 w-10 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-white font-bold text-sm">
                SC
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-500 border-2 border-white flex items-center justify-center text-white font-bold text-sm">
                SK
              </div>
              <div className="h-10 w-10 rounded-full bg-orange-500 border-2 border-white flex items-center justify-center text-white font-bold text-sm">
                MR
              </div>
              <div className="h-10 w-10 rounded-full bg-green-500 border-2 border-white flex items-center justify-center text-white font-bold text-sm">
                +27
              </div>
            </div>
            <div className="ml-4 text-left">
              <div className="text-sm font-semibold text-gray-900">
                30+ Expert Advisors Ready
              </div>
              <div className="text-xs text-gray-600">
                Average response time: 2 minutes
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;