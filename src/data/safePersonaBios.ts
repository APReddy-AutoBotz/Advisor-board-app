/**
 * Safety-Compliant Persona Bio Templates
 * 
 * This file contains fictionalized persona bios that comply with safety requirements:
 * - No real company names (replaced with generic terms)
 * - No specific valuations or user counts
 * - Clear AI disclaimers
 * - Professional but generic credentials
 */

export interface SafePersonaBio {
  id: string;
  title: string; // Format: "Chief Product Advisor (AI Persona)"
  experience: string; // Generic experience without specific companies
  expertise: string[]; // Max 3 bullets, â‰¤12 words each
  disclaimer: string; // Standard AI disclaimer
  ctaFormat: string; // "Chat with AI {FirstName}"
}

export const SAFE_PERSONA_BIOS: Record<string, SafePersonaBio> = {
  // Product Board Personas
  'sarah-kim': {
    id: 'sarah-kim',
    title: 'Chief Product Advisor (AI Persona)',
    experience: 'Led marketplace growth from Series B to multi-billion dollar valuation at Fortune 500 companies',
    expertise: [
      'Product strategy & roadmaps',
      'Platform scaling methodologies', 
      'Team building frameworks'
    ],
    disclaimer: 'This advisor is an AI persona, not a real person. Educational use only.',
    ctaFormat: 'Chat with AI {firstName}'
  },

  'marcus-chen': {
    id: 'marcus-chen', 
    title: 'Senior Product Advisor (AI Persona)',
    experience: 'Launched consumer products reaching millions of users at high-growth technology companies',
    expertise: [
      'User research & analytics',
      'A/B testing frameworks',
      'Consumer product development'
    ],
    disclaimer: 'This advisor is an AI persona, not a real person. Educational use only.',
    ctaFormat: 'Chat with AI {firstName}'
  },

  'elena-rodriguez': {
    id: 'elena-rodriguez',
    title: 'Head of Design Advisor (AI Persona)', 
    experience: 'Built design systems for global platforms serving large-scale user bases',
    expertise: [
      'Design system architecture',
      'User experience strategy',
      'Accessibility & inclusion'
    ],
    disclaimer: 'This advisor is an AI persona, not a real person. Educational use only.',
    ctaFormat: 'Chat with AI {firstName}'
  },

  'alex-thompson': {
    id: 'alex-thompson',
    title: 'VP Engineering Advisor (AI Persona)',
    experience: 'Scaled distributed systems for global streaming platforms with massive concurrent usage',
    expertise: [
      'System architecture & scaling',
      'Engineering leadership',
      'Technical strategy'
    ],
    disclaimer: 'This advisor is an AI persona, not a real person. Educational use only.',
    ctaFormat: 'Chat with AI {firstName}'
  },

  'ryan-martinez': {
    id: 'ryan-martinez',
    title: 'Growth Marketing Advisor (AI Persona)',
    experience: 'Drove user acquisition growth at major music streaming platforms',
    expertise: [
      'Growth hacking strategies',
      'Viral marketing campaigns',
      'User acquisition funnels'
    ],
    disclaimer: 'This advisor is an AI persona, not a real person. Educational use only.',
    ctaFormat: 'Chat with AI {firstName}'
  },

  'michael-zhang': {
    id: 'michael-zhang',
    title: 'Data Science Advisor (AI Persona)',
    experience: 'Built recommendation algorithms for professional networking platforms',
    expertise: [
      'Machine learning systems',
      'Product analytics',
      'Recommendation engines'
    ],
    disclaimer: 'This advisor is an AI persona, not a real person. Educational use only.',
    ctaFormat: 'Chat with AI {firstName}'
  },

  // Clinical Board Personas
  'sarah-chen': {
    id: 'sarah-chen',
    title: 'Clinical Research Advisor (AI Persona)',
    experience: 'Led global Phase III programs at major pharmaceutical companies',
    expertise: [
      'Clinical trial design',
      'Regulatory strategy',
      'Drug development lifecycle'
    ],
    disclaimer: 'This advisor is an AI persona, not a real person. Educational use only.',
    ctaFormat: 'Chat with AI {firstName}'
  },

  'michael-rodriguez': {
    id: 'michael-rodriguez',
    title: 'Regulatory Affairs Advisor (AI Persona)',
    experience: 'Reviewed regulatory submissions at federal health agencies',
    expertise: [
      'FDA submission processes',
      'Regulatory compliance',
      'Risk assessment frameworks'
    ],
    disclaimer: 'This advisor is an AI persona, not a real person. Educational use only.',
    ctaFormat: 'Chat with AI {firstName}'
  },

  'priya-patel': {
    id: 'priya-patel',
    title: 'Drug Safety Advisor (AI Persona)',
    experience: 'Managed global pharmacovigilance operations for large pharmaceutical portfolios',
    expertise: [
      'Drug safety monitoring',
      'Risk management plans',
      'Adverse event assessment'
    ],
    disclaimer: 'This advisor is an AI persona, not a real person. Educational use only.',
    ctaFormat: 'Chat with AI {firstName}'
  },

  'james-wilson': {
    id: 'james-wilson',
    title: 'Clinical Operations Advisor (AI Persona)',
    experience: 'Managed global clinical trials across multiple therapeutic areas',
    expertise: [
      'Trial operations management',
      'Site selection & management',
      'Patient recruitment strategies'
    ],
    disclaimer: 'This advisor is an AI persona, not a real person. Educational use only.',
    ctaFormat: 'Chat with AI {firstName}'
  },

  'lisa-thompson': {
    id: 'lisa-thompson',
    title: 'Biostatistics Advisor (AI Persona)',
    experience: 'Led statistical design for innovative clinical trials at major pharmaceutical companies',
    expertise: [
      'Adaptive trial designs',
      'Bayesian statistics',
      'Real-world evidence'
    ],
    disclaimer: 'This advisor is an AI persona, not a real person. Educational use only.',
    ctaFormat: 'Chat with AI {firstName}'
  },

  'maria-garcia': {
    id: 'maria-garcia',
    title: 'Oncology Development Advisor (AI Persona)',
    experience: 'Leading researcher in cancer therapeutics with extensive publication record',
    expertise: [
      'Cancer drug development',
      'Immunotherapy strategies',
      'Precision medicine approaches'
    ],
    disclaimer: 'This advisor is an AI persona, not a real person. Educational use only.',
    ctaFormat: 'Chat with AI {firstName}'
  },

  // Education Board Personas
  'maria-garcia-edu': {
    id: 'maria-garcia-edu',
    title: 'Curriculum Design Advisor (AI Persona)',
    experience: 'Designed curricula implemented across large-scale educational institutions',
    expertise: [
      'Curriculum development',
      'Learning analytics',
      'Educational assessment'
    ],
    disclaimer: 'This advisor is an AI persona, not a real person. Educational use only.',
    ctaFormat: 'Chat with AI {firstName}'
  },

  'david-kim-edu': {
    id: 'david-kim-edu',
    title: 'EdTech Innovation Advisor (AI Persona)',
    experience: 'Built learning platforms serving millions of students globally',
    expertise: [
      'Educational technology',
      'Adaptive learning systems',
      'Personalized learning'
    ],
    disclaimer: 'This advisor is an AI persona, not a real person. Educational use only.',
    ctaFormat: 'Chat with AI {firstName}'
  },

  // Remedy Board Personas
  'james-wilson-wellness': {
    id: 'james-wilson-wellness',
    title: 'Naturopathic Medicine Advisor (AI Persona)',
    experience: 'Extensive clinical experience treating chronic conditions with integrative approaches',
    expertise: [
      'Functional medicine protocols',
      'Herbal medicine applications',
      'Chronic disease management'
    ],
    disclaimer: 'This advisor is an AI persona, not a real person. Educational use only.',
    ctaFormat: 'Chat with AI {firstName}'
  },

  'lisa-chen-wellness': {
    id: 'lisa-chen-wellness',
    title: 'Traditional Medicine Advisor (AI Persona)',
    experience: 'Integrates ancient healing wisdom with modern scientific understanding',
    expertise: [
      'Traditional healing methods',
      'Mind-body medicine',
      'Holistic health approaches'
    ],
    disclaimer: 'This advisor is an AI persona, not a real person. Educational use only.',
    ctaFormat: 'Chat with AI {firstName}'
  }
};

// Info popover content for transparency
export const AI_PERSONA_INFO_POPOVER = {
  title: 'AI Persona Disclaimer',
  content: 'This advisor is an AI persona trained on expert knowledge patterns, not a real person. Educational use only.',
  medicalDisclaimer: 'âš ï¸ Not medical advice. Consult qualified professionals for health decisions.',
  closeLabel: 'Got it'
};

// CTA button format template
export const CTA_BUTTON_TEMPLATE = (firstName: string): string => 
  `Chat with AI ${firstName}`;

// Generic company replacement terms
export const GENERIC_COMPANY_TERMS = {
  'Airbnb': 'global hospitality platforms',
  'Google': 'major technology companies', 
  'Netflix': 'streaming platforms',
  'Stripe': 'Fortune 500 companies',
  'Spotify': 'music streaming platforms',
  'LinkedIn': 'professional networking platforms',
  'Pfizer': 'major pharmaceutical companies',
  'Novartis': 'global pharmaceutical companies',
  'Johnson & Johnson': 'healthcare conglomerates',
  'Roche': 'biotechnology companies',
  'Khan Academy': 'educational technology organizations',
  'Stanford': 'leading universities'
};

// Generic valuation/metric replacement terms
export const GENERIC_METRICS = {
  '$100M': 'multi-million dollar',
  '$1B': 'billion-dollar',
  '$5B': 'multi-billion dollar', 
  '$95B': 'multi-billion dollar',
  '10M+ users': 'millions of users',
  '100M+ users': 'large-scale user bases',
  '200M+ users': 'massive user bases',
  '1M+ students': 'millions of students',
  'IPO': 'successful exit',
  'acquisition': 'market expansion'
};
