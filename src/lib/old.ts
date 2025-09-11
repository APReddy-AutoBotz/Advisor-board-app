/**
 * Central Boards Registry - Single Source of Truth
 * This registry powers all board data across the application
 */

import { PortraitAssignmentEngine, type GenderPreference } from './portraitRegistry';

export interface BoardExpert {
  id: string;
  name: string;
  code: string; // Short identifier like "CPO", "FDA", "MD"
  role: string;
  blurb: string; // One-line description
  credentials: string;
  avatar: string;
  specialties: string[];
  genderPreference?: GenderPreference; // For portrait assignment
}

export interface Board {
  id: string;
  title: string;
  tagline: string;
  description: string;
  color: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  experts: BoardExpert[];
  samplePrompts: string[];
  benefitOneLiner: string;
}

export const BOARDS: Record<string, Board> = {
  product: {
    id: 'productboard',
    title: 'Product Development & Strategy',
    tagline: 'Silicon Valley product mastery from unicorn builders and scaling experts',
    description: 'Complete product development expertise from ideation to launch',
    color: {
      primary: '#6366F1',
      secondary: '#C7D2FE',
      accent: '#4F46E5',
      background: '#EEF2FF',
      text: '#312E81'
    },
    experts: [
      {
        id: 'sarah-kim',
        name: 'Sarah Kim',
        code: 'CPO',
        role: 'Chief Product Officer',
        blurb: 'Former CPO at Airbnb, scaled from startup to $100B+ valuation with product-led growth',
        credentials: 'Former CPO at Airbnb, Stanford MBA',
        avatar: '/Portraits/a2_safety-md.png', // Feminine portrait
        specialties: ['Growth Strategy', 'Platform Products', 'International Expansion'],
        genderPreference: 'fem'
      },
      {
        id: 'marcus-chen',
        name: 'Marcus Chen',
        code: 'SPM',
        role: 'Senior Product Manager',
        blurb: 'Google PM for 8 years, launched 5 products with 100M+ users each',
        credentials: 'MS Computer Science, Google Senior PM',
        avatar: '/Portraits/a1_strategy-pm.png', // Masculine portrait
        specialties: ['Product Analytics', 'A/B Testing', 'User Research'],
        genderPreference: 'masc'
      },
      {
        id: 'elena-rodriguez',
        name: 'Elena Rodriguez',
        code: 'DES',
        role: 'Head of Design',
        blurb: 'Former Design Director at Airbnb, expert in design systems and user experience',
        credentials: 'MFA Design, Former Airbnb Design Director',
        avatar: '/Portraits/a5_pedagogy-mentor.png', // Feminine portrait
        specialties: ['Design Systems', 'User Experience', 'Design Leadership'],
        genderPreference: 'fem'
      },
      {
        id: 'alex-thompson',
        name: 'Alex Thompson',
        code: 'ENG',
        role: 'VP of Engineering',
        blurb: 'Former Netflix VP Engineering, scaled systems to 200M+ users globally',
        credentials: 'MS Computer Science, Former Netflix VP',
        avatar: '/Portraits/a3_reg-reviewer.png', // Masculine portrait
        specialties: ['System Architecture', 'Engineering Leadership', 'Technical Strategy'],
        genderPreference: 'masc'
      },
      {
        id: 'ryan-martinez',
        name: 'Ryan Martinez',
        code: 'GRO',
        role: 'Head of Growth Marketing',
        blurb: 'Growth marketing leader at Spotify, drove 10x user acquisition and retention',
        credentials: 'MS Marketing, Former Spotify Growth Lead',
        avatar: '/Portraits/a4_data-scientist.png', // Masculine portrait
        specialties: ['Growth Marketing', 'User Acquisition', 'Retention Strategy'],
        genderPreference: 'masc'
      },
      {
        id: 'michael-zhang',
        name: 'Michael Zhang',
        code: 'DATA',
        role: 'Head of Data Science',
        blurb: 'LinkedIn Data Science Lead who built recommendation algorithms',
        credentials: 'PhD Statistics, Former LinkedIn Data Science Lead',
        avatar: '/Portraits/a6_diet-lifestyle.png', // Masculine portrait
        specialties: ['Data Analytics', 'Machine Learning', 'Product Metrics'],
        genderPreference: 'masc'
      }
    ],
    samplePrompts: [
      'How do I achieve product-market fit for my B2B SaaS platform?',
      'What\'s the best go-to-market strategy for launching in enterprise?',
      'How should I prioritize features for maximum user impact?'
    ],
    benefitOneLiner: 'Scale faster with battle-tested strategies from unicorn builders'
  },

  clinical: {
    id: 'cliniboard',
    title: 'Clinical Research & Regulatory',
    tagline: 'Navigate FDA approvals, clinical trials, and drug safety with former regulators and Big Pharma executives',
    description: 'Expert guidance for clinical trials, regulatory submissions, and patient safety',
    color: {
      primary: '#2563eb',
      secondary: '#dbeafe', 
      accent: '#3b82f6',
      background: '#eff6ff',
      text: '#1e3a8a'
    },
    experts: [
      {
        id: 'sarah-chen',
        name: 'Dr. Sarah Chen',
        code: 'CPO',
        role: 'Clinical Research Strategy',
        blurb: 'Former Pfizer VP who led 50+ Phase III trials to FDA approval',
        credentials: 'MD, PhD, Former FDA Advisory Committee Member',
        avatar: '/Portraits/a2_safety-md.png', // Feminine portrait
        specialties: ['Phase III Trials', 'FDA Interactions', 'Global Regulatory Strategy'],
        genderPreference: 'fem'
      },
      {
        id: 'michael-rodriguez',
        name: 'Dr. Michael Rodriguez',
        code: 'FDA',
        role: 'Regulatory Affairs Director',
        blurb: 'Former FDA CDER Director who reviewed 100+ NDA submissions',
        credentials: 'PharmD, JD, Former FDA CDER Director',
        avatar: '/Portraits/a3_reg-reviewer.png', // Masculine portrait
        specialties: ['FDA Submissions', 'Regulatory Strategy', 'Compliance'],
        genderPreference: 'masc'
      },
      {
        id: 'priya-patel',
        name: 'Dr. Priya Patel',
        code: 'PV',
        role: 'Pharmacovigilance & Drug Safety',
        blurb: 'Novartis Chief Safety Officer managing global drug safety programs',
        credentials: 'MD, MPH, Board Certified in Preventive Medicine',
        avatar: '/Portraits/a5_pedagogy-mentor.png', // Feminine portrait
        specialties: ['Drug Safety', 'Risk Management', 'Global Pharmacovigilance'],
        genderPreference: 'fem'
      },
      {
        id: 'james-wilson',
        name: 'Dr. James Wilson',
        code: 'OPS',
        role: 'Clinical Trial Operations',
        blurb: 'J&J VP who managed 200+ global clinical trials across 50 countries',
        credentials: 'MD, MBA, Certified Clinical Research Professional',
        avatar: '/Portraits/a1_strategy-pm.png', // Masculine portrait
        specialties: ['Global Trials', 'Site Management', 'Patient Recruitment'],
        genderPreference: 'masc'
      },
      {
        id: 'lisa-thompson',
        name: 'Dr. Lisa Thompson',
        code: 'STAT',
        role: 'Biostatistics & Data Science',
        blurb: 'Roche Principal Statistician specializing in adaptive trial designs',
        credentials: 'PhD Statistics, MS Biostatistics',
        avatar: '/Portraits/a2_safety-md.png', // Feminine portrait (reusing, will cycle)
        specialties: ['Adaptive Trials', 'Bayesian Statistics', 'Real-World Evidence'],
        genderPreference: 'fem'
      },
      {
        id: 'maria-garcia',
        name: 'Dr. Maria Garcia',
        code: 'ONC',
        role: 'Oncology Clinical Development',
        blurb: 'Leading oncologist with 100+ publications in cancer therapeutics',
        credentials: 'MD, PhD Oncology, Board Certified Medical Oncologist',
        avatar: '/Portraits/a5_pedagogy-mentor.png', // Feminine portrait (reusing, will cycle)
        specialties: ['Cancer Therapeutics', 'Immunotherapy', 'Precision Medicine'],
        genderPreference: 'fem'
      }
    ],
    samplePrompts: [
      'How long should I wait before reporting a serious adverse event to authorities?',
      'What are the key FDA requirements for our Phase III oncology trial?',
      'How do I prepare for an FDA pre-submission meeting?'
    ],
    benefitOneLiner: 'Get FDA-approved guidance from former regulators and Big Pharma executives'
  },



  education: {
    id: 'eduboard',
    title: 'Educational Innovation',
    tagline: 'Transform learning experiences with pedagogy experts and EdTech pioneers',
    description: 'Educational innovation and pedagogical excellence',
    color: {
      primary: '#ea580c',
      secondary: '#fed7aa',
      accent: '#f97316',
      background: '#fff7ed', 
      text: '#7c2d12'
    },
    experts: [
      {
        id: 'maria-garcia-edu',
        name: 'Prof. Maria Garcia',
        code: 'CURR',
        role: 'Curriculum Design Expert',
        blurb: 'Stanford Professor who designed curricula for 1M+ students',
        credentials: 'PhD Education, Stanford Professor',
        avatar: '/Portraits/a5_pedagogy-mentor.png', // Feminine portrait
        specialties: ['Curriculum Design', 'Learning Analytics', 'Educational Technology'],
        genderPreference: 'fem'
      },
      {
        id: 'david-kim-edu',
        name: 'Dr. David Kim',
        code: 'TECH',
        role: 'EdTech Innovation Lead',
        blurb: 'Former Khan Academy CTO who built learning platforms for millions',
        credentials: 'PhD Computer Science, Former Khan Academy CTO',
        avatar: '/Portraits/a4_data-scientist.png', // Masculine portrait
        specialties: ['EdTech Platforms', 'Learning Systems', 'Educational AI'],
        genderPreference: 'masc'
      }
    ],
    samplePrompts: [
      'How can I design an effective online learning curriculum?',
      'What are the best practices for student engagement in digital learning?',
      'How do I measure learning outcomes effectively?'
    ],
    benefitOneLiner: 'Create transformative learning experiences that actually work'
  },

  wellness: {
    id: 'remediboard',
    title: 'Holistic Wellness & Natural Remedies',
    tagline: 'Integrate traditional wisdom with modern science for optimal health outcomes',
    description: 'Natural remedies and holistic wellness approaches',
    color: {
      primary: '#16a34a',
      secondary: '#bbf7d0',
      accent: '#22c55e',
      background: '#f0fdf4',
      text: '#14532d'
    },
    experts: [
      {
        id: 'james-wilson-wellness',
        name: 'Dr. James Wilson',
        code: 'NAT',
        role: 'Naturopathic Medicine',
        blurb: 'Integrative medicine pioneer with 25+ years treating chronic conditions',
        credentials: 'ND, LAc, Certified Functional Medicine Practitioner',
        avatar: '/Portraits/a6_diet-lifestyle.png', // Masculine portrait
        specialties: ['Herbal Medicine', 'Functional Medicine', 'Chronic Disease'],
        genderPreference: 'masc'
      },
      {
        id: 'lisa-chen-wellness',
        name: 'Dr. Lisa Chen',
        code: 'TCM',
        role: 'Traditional Chinese Medicine',
        blurb: 'TCM practitioner bridging ancient wisdom with modern research',
        credentials: 'DAOM, Licensed Acupuncturist, Herbalist',
        avatar: '/Portraits/a2_safety-md.png', // Feminine portrait
        specialties: ['Acupuncture', 'Chinese Herbs', 'Mind-Body Medicine'],
        genderPreference: 'fem'
      }
    ],
    samplePrompts: [
      'What natural remedies can help with chronic inflammation?',
      'How do I integrate holistic approaches with conventional treatment?',
      'What are evidence-based natural solutions for stress management?'
    ],
    benefitOneLiner: 'Heal naturally with evidence-based holistic approaches'
  }
};

// Utility functions
export const getBoardById = (id: string): Board | undefined => BOARDS[id];
export const getAllBoards = (): Board[] => Object.values(BOARDS);
export const getBoardExperts = (boardId: string): BoardExpert[] => BOARDS[boardId]?.experts || [];
export const getExpertById = (boardId: string, expertId: string): BoardExpert | undefined => 
  BOARDS[boardId]?.experts.find(expert => expert.id === expertId);

// Enhanced utility functions for the new components
export const getTotalExperts = (): number => 
  Object.values(BOARDS).reduce((total, board) => total + board.experts.length, 0);

export const getCombinedExperience = (): number => {
  // Calculate combined experience from all experts
  // For demo purposes, we'll estimate based on expert count and seniority
  const totalExperts = getTotalExperts();
  return Math.floor(totalExperts * 15); // Average 15 years per expert
};

// Enhanced Analytics event types
export type AnalyticsEvent = 
  | 'hero_cta_click'
  | 'board_card_open' 
  | 'experts_modal_open'
  | 'mega_cta_click'
  | 'advisor_select'
  | 'advisor_deselect'
  | 'advisor_chat_click'
  | 'consultation_started'
  | 'session_exported'
  | 'feature_card_click'
  | 'faq_toggle'
  | 'pricing_cta_click'
  | 'footer_link_click'
  | 'demo_submit'
  | 'advisor_response_render'
  | 'summary_render'
  | 'persona_chat_click'
  | 'persona_info_open'
  | 'persona_strip_cta_click'
  | 'mega_board_select'
  | 'mega_mode_view';

// Enhanced Analytics utility with detailed tracking
export const trackEvent = (event: AnalyticsEvent, properties?: Record<string, any>) => {
  const timestamp = new Date().toISOString();
  const eventData = {
    event,
    timestamp,
    properties: {
      ...properties,
      user_agent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      url: window.location.href
    }
  };
  
  console.log(`📊 Analytics Event: ${event}`, eventData);
  
  // In production, send to analytics service
  // Example: analytics.track(event, eventData);
  
  // Store in localStorage for demo purposes
  const events = JSON.parse(localStorage.getItem('advisor_analytics') || '[]');
  events.push(eventData);
  localStorage.setItem('advisor_analytics', JSON.stringify(events.slice(-100))); // Keep last 100 events
};