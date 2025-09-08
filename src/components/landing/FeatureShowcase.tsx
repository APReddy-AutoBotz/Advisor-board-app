/**
 * Feature Showcase - 3-up Feature Cards + FAQ
 * Premium feature highlights with icons, bullets, and FAQ accordion
 */

import React, { useState } from 'react';
import { trackEvent } from '../../lib/boards';

interface FeatureShowcaseProps {
  className?: string;
}

interface FeatureCard {
  id: string;
  icon: string;
  title: string;
  description: string;
  bullets: string[];
  screenshot?: string;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const FEATURE_CARDS: FeatureCard[] = [
  {
    id: 'multi-expert',
    icon: '🧠',
    title: 'Multi-Expert Consultation',
    description: 'Get diverse perspectives from specialized AI advisors trained on domain expertise.',
    bullets: [
      'Clinical research methodologies',
      'Product development strategies', 
      'Educational pedagogy approaches',
      'Holistic wellness practices'
    ],
    screenshot: '/screenshots/multi-expert-demo.png'
  },
  {
    id: 'intelligent-synthesis',
    icon: '⚡',
    title: 'Intelligent Synthesis',
    description: 'AI-powered analysis identifies consensus, conflicts, and actionable insights.',
    bullets: [
      'Automatic response summarization',
      'Consensus identification',
      'Conflict resolution suggestions',
      'Prioritized action items'
    ],
    screenshot: '/screenshots/synthesis-demo.png'
  },
  {
    id: 'export-share',
    icon: '📊',
    title: 'Export & Collaboration',
    description: 'Professional reports and shareable insights for team decision-making.',
    bullets: [
      'PDF consultation reports',
      'Markdown documentation',
      'Session replay and sharing',
      'Team collaboration tools'
    ],
    screenshot: '/screenshots/export-demo.png'
  }
];

const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'what-is-advisorboard',
    question: 'What is AdvisorBoard and how does it work?',
    answer: 'AdvisorBoard is an AI-powered consultation platform that simulates expert advisory boards across different domains. Each AI advisor is trained on domain-specific knowledge and reasoning patterns to provide specialized insights on your questions.'
  },
  {
    id: 'ai-accuracy',
    question: 'How accurate are the AI advisor responses?',
    answer: 'Our AI advisors are trained on extensive domain knowledge and best practices. However, responses are for educational and brainstorming purposes only and should not replace professional advice. Always consult qualified professionals for critical decisions.'
  },
  {
    id: 'data-privacy',
    question: 'Is my consultation data private and secure?',
    answer: 'Yes, we take privacy seriously. Your consultation sessions are processed securely and not stored permanently. We use industry-standard encryption and do not share your questions or responses with third parties.'
  },
  {
    id: 'pricing-plans',
    question: 'What are the pricing options?',
    answer: 'We offer a free tier with basic consultations and premium plans with advanced features like multi-board consultations, detailed exports, and priority processing. Contact us for enterprise pricing.'
  },
  {
    id: 'supported-domains',
    question: 'What domains and expertise areas are available?',
    answer: 'Currently we support Clinical Research, Product Development, Education & Learning, and Holistic Wellness. We\'re continuously expanding our advisor expertise and adding new specialized domains.'
  },
  {
    id: 'integration-api',
    question: 'Can I integrate AdvisorBoard with my existing tools?',
    answer: 'Yes, we provide API access for premium users to integrate advisory consultations into existing workflows, documentation systems, and decision-making processes.'
  }
];

const FeatureCard: React.FC<{ feature: FeatureCard }> = ({ feature }) => {
  const [imageError, setImageError] = useState(false);

  const handleCardClick = () => {
    trackEvent('feature_card_click', { 
      feature_id: feature.id,
      feature_title: feature.title 
    });
  };

  return (
    <div 
      className="bg-white rounded-xl shadow-card hover:shadow-hover transition-all duration-hover cursor-pointer overflow-hidden"
      onClick={handleCardClick}
    >
      {/* Screenshot/Visual */}
      {feature.screenshot && !imageError && (
        <div className="h-48 bg-gradient-to-br from-blue-50 to-purple-50 relative overflow-hidden">
          <img
            src={feature.screenshot}
            alt={`${feature.title} demonstration`}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImageError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
      )}
      
      {/* Fallback visual if no screenshot */}
      {(!feature.screenshot || imageError) && (
        <div className="h-48 bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
          <div className="text-6xl opacity-60">{feature.icon}</div>
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white text-xl">
            {feature.icon}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-ink-900 mb-2">{feature.title}</h3>
            <p className="text-ink-600 leading-relaxed">{feature.description}</p>
          </div>
        </div>

        {/* Feature Bullets */}
        <ul className="space-y-2">
          {feature.bullets.map((bullet, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm text-ink-700">{bullet}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const FAQAccordion: React.FC<{ items: FAQItem[] }> = ({ items }) => {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
    
    trackEvent('faq_toggle', { 
      faq_id: id,
      action: newOpenItems.has(id) ? 'open' : 'close'
    });
  };

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const isOpen = openItems.has(item.id);
        
        return (
          <div key={item.id} className="bg-white rounded-xl shadow-card overflow-hidden">
            <button
              onClick={() => toggleItem(item.id)}
              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-hover"
              aria-expanded={isOpen}
            >
              <h3 className="text-lg font-semibold text-ink-900 pr-4">{item.question}</h3>
              <div className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                <svg className="w-5 h-5 text-ink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            
            {isOpen && (
              <div className="px-6 pb-4">
                <div className="pt-2 border-t border-ink-100">
                  <p className="text-ink-700 leading-relaxed">{item.answer}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const LogosSection: React.FC = () => {
  const logos = [
    { name: 'TechCorp', logo: '/logos/techcorp.svg' },
    { name: 'MedInnovate', logo: '/logos/medinnovate.svg' },
    { name: 'EduTech Solutions', logo: '/logos/edutech.svg' },
    { name: 'Wellness Co', logo: '/logos/wellness.svg' },
    { name: 'Research Labs', logo: '/logos/research.svg' }
  ];

  return (
    <div className="bg-gray-50 py-12">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center mb-8">
          <p className="text-sm font-medium text-ink-600 uppercase tracking-wide">
            Trusted by innovative teams
          </p>
        </div>
        
        <div className="flex items-center justify-center gap-8 opacity-60 grayscale">
          {logos.map((company) => (
            <div key={company.name} className="flex items-center">
              {/* Placeholder logo - in real implementation, use actual logos */}
              <div className="w-24 h-12 bg-ink-200 rounded flex items-center justify-center">
                <span className="text-xs font-medium text-ink-500">{company.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const PricingTeaser: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
      <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Ready to Consult Your Advisory Board?
        </h2>
        <p className="text-xl text-blue-100 mb-8">
          Start with our free tier or upgrade for advanced multi-board consultations
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => trackEvent('pricing_cta_click', { plan: 'free' })}
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors duration-hover"
          >
            Start Free
          </button>
          <button 
            onClick={() => trackEvent('pricing_cta_click', { plan: 'premium' })}
            className="bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors duration-hover border border-blue-500"
          >
            View Pricing
          </button>
        </div>
        
        <p className="text-sm text-blue-200 mt-4">
          No credit card required • 5 free consultations • Upgrade anytime
        </p>
      </div>
    </div>
  );
};

const FeatureShowcase: React.FC<FeatureShowcaseProps> = ({ className = '' }) => {
  return (
    <section className={`py-16 sm:py-24 ${className}`}>
      {/* Feature Cards Section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 mb-24">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl mb-4">
            Powerful Features for Better Decisions
          </h2>
          <p className="text-lg leading-8 text-ink-600">
            Everything you need to harness collective intelligence and make informed decisions with confidence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURE_CARDS.map((feature) => (
            <FeatureCard key={feature.id} feature={feature} />
          ))}
        </div>
      </div>

      {/* Logos Section */}
      <LogosSection />

      {/* FAQ Section */}
      <div className="mx-auto max-w-4xl px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg leading-8 text-ink-600">
            Everything you need to know about AdvisorBoard and AI-powered consultations.
          </p>
        </div>

        <FAQAccordion items={FAQ_ITEMS} />
      </div>

      {/* Pricing Teaser */}
      <PricingTeaser />
    </section>
  );
};

export default FeatureShowcase;