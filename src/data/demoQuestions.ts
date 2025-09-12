/**
 * Demo Questions for Hackathon Demonstration
 * 
 * Curated questions that showcase each advisor's unique expertise
 * and demonstrate the sophisticated persona-driven response system.
 * 
 * Requirements: FR-5
 */

export interface DemoQuestion {
  id: string;
  question: string;
  domain: string;
  category: 'product_ideation' | 'strategy' | 'technical' | 'general';
  showcasesAdvisors: string[];
  expectedInsights: string[];
  demoNotes: string;
}

export const DEMO_QUESTIONS: DemoQuestion[] = [
  // ProductBoard Questions
  {
    id: 'product-market-fit',
    question: 'How do I achieve product-market fit for my B2B SaaS product targeting mid-market companies?',
    domain: 'productboard',
    category: 'strategy',
    showcasesAdvisors: ['sarah-kim', 'marcus-chen', 'michael-zhang'],
    expectedInsights: [
      'Sarah Kim: Strategic PMF framework from Stripe experience',
      'Marcus Chen: User research and validation methodology',
      'Michael Zhang: Data-driven PMF metrics and measurement'
    ],
    demoNotes: 'Perfect for showing strategic thinking across CPO, PM, and Data Science perspectives'
  },
  {
    id: 'product-scaling',
    question: 'What technical architecture decisions should I make to scale my product from 10K to 10M users?',
    domain: 'productboard',
    category: 'technical',
    showcasesAdvisors: ['alex-thompson', 'sarah-kim', 'michael-zhang'],
    expectedInsights: [
      'Alex Thompson: Netflix-scale infrastructure and microservices',
      'Sarah Kim: Product strategy for hypergrowth scaling',
      'Michael Zhang: Data infrastructure and ML systems at scale'
    ],
    demoNotes: 'Demonstrates technical depth with business context'
  },
  {
    id: 'product-innovation',
    question: 'What innovative product features should I build to differentiate from competitors and create new market opportunities?',
    domain: 'productboard',
    category: 'product_ideation',
    showcasesAdvisors: ['sarah-kim', 'marcus-chen', 'elena-rodriguez'],
    expectedInsights: [
      'Sarah Kim: Innovation strategy from Stripe\'s disruptive approach',
      'Marcus Chen: Feature ideation and user research methodology',
      'Elena Rodriguez: Design-driven innovation and user experience'
    ],
    demoNotes: 'Perfect for showing product ideation across strategy, PM, and design'
  },
  {
    id: 'growth-strategy',
    question: 'How can I build viral growth mechanics into my consumer app to achieve 10x user acquisition?',
    domain: 'productboard',
    category: 'strategy',
    showcasesAdvisors: ['ryan-martinez', 'elena-rodriguez', 'marcus-chen'],
    expectedInsights: [
      'Ryan Martinez: Spotify-proven viral growth tactics',
      'Elena Rodriguez: UX design for viral sharing features',
      'Marcus Chen: A/B testing framework for growth features'
    ],
    demoNotes: 'Shows growth expertise with design and PM integration'
  },
  {
    id: 'design-system',
    question: 'How do I build a design system that scales across multiple product teams and maintains consistency?',
    domain: 'productboard',
    category: 'technical',
    showcasesAdvisors: ['elena-rodriguez', 'alex-thompson', 'sarah-kim'],
    expectedInsights: [
      'Elena Rodriguez: Airbnb Design Language System experience',
      'Alex Thompson: Technical implementation of design systems',
      'Sarah Kim: Product strategy for design system adoption'
    ],
    demoNotes: 'Perfect for showing design leadership with technical implementation'
  },

  // CliniBoard Questions
  {
    id: 'clinical-trial-design',
    question: 'What\'s the optimal Phase III trial design for a novel oncology immunotherapy targeting PD-L1?',
    domain: 'cliniboard',
    category: 'strategy',
    showcasesAdvisors: ['sarah-chen', 'maria-garcia', 'lisa-thompson'],
    expectedInsights: [
      'Sarah Chen: FDA regulatory strategy and trial design',
      'Maria Garcia: Oncology-specific clinical considerations',
      'Lisa Thompson: Biostatistical design and adaptive approaches'
    ],
    demoNotes: 'Demonstrates deep clinical expertise across regulatory, medical, and statistical domains'
  },
  {
    id: 'fda-submission',
    question: 'How should I prepare for FDA Pre-IND meeting and what data package is required for a breakthrough therapy designation?',
    domain: 'cliniboard',
    category: 'strategy',
    showcasesAdvisors: ['michael-rodriguez', 'sarah-chen', 'priya-patel'],
    expectedInsights: [
      'Michael Rodriguez: Former FDA insider perspective on submission strategy',
      'Sarah Chen: Clinical development strategy for breakthrough designation',
      'Priya Patel: Safety data requirements and risk assessment'
    ],
    demoNotes: 'Shows regulatory expertise from both industry and FDA perspectives'
  },
  {
    id: 'global-trial-operations',
    question: 'What are the key operational challenges for running a global Phase III trial across 25 countries?',
    domain: 'cliniboard',
    category: 'technical',
    showcasesAdvisors: ['james-wilson', 'sarah-chen', 'priya-patel'],
    expectedInsights: [
      'James Wilson: Global trial operations and site management',
      'Sarah Chen: Regulatory considerations across regions',
      'Priya Patel: Global pharmacovigilance and safety monitoring'
    ],
    demoNotes: 'Demonstrates operational complexity and global regulatory expertise'
  },

  // EduBoard Questions
  {
    id: 'curriculum-design',
    question: 'How do I design a competency-based curriculum for data science that adapts to individual learning styles?',
    domain: 'eduboard',
    category: 'strategy',
    showcasesAdvisors: ['maria-garcia-edu', 'david-kim-edu'],
    expectedInsights: [
      'Maria Garcia: Pedagogical framework and competency-based design',
      'David Kim: EdTech platform and adaptive learning technology'
    ],
    demoNotes: 'Shows educational expertise combining pedagogy with technology'
  },
  {
    id: 'edtech-platform',
    question: 'What technical architecture should I use to build a personalized learning platform that serves 1M+ students?',
    domain: 'eduboard',
    category: 'technical',
    showcasesAdvisors: ['david-kim-edu', 'maria-garcia-edu'],
    expectedInsights: [
      'David Kim: Khan Academy-scale platform architecture',
      'Maria Garcia: Learning analytics and personalization requirements'
    ],
    demoNotes: 'Demonstrates EdTech scalability with pedagogical considerations'
  },

  // RemediBoard Questions
  {
    id: 'integrative-treatment',
    question: 'How can I develop an integrative treatment protocol for chronic autoimmune conditions combining naturopathic and conventional approaches?',
    domain: 'remediboard',
    category: 'strategy',
    showcasesAdvisors: ['james-wilson-wellness', 'lisa-chen-wellness'],
    expectedInsights: [
      'James Wilson: Functional medicine approach to autoimmune conditions',
      'Lisa Chen: TCM perspective on immune system balance'
    ],
    demoNotes: 'Shows integrative medicine expertise combining different healing modalities'
  },
  {
    id: 'holistic-wellness',
    question: 'What mind-body techniques are most effective for managing chronic stress and preventing burnout in healthcare workers?',
    domain: 'remediboard',
    category: 'general',
    showcasesAdvisors: ['lisa-chen-wellness', 'james-wilson-wellness'],
    expectedInsights: [
      'Lisa Chen: TCM stress management and energy balance techniques',
      'James Wilson: Naturopathic stress reduction and adrenal support'
    ],
    demoNotes: 'Demonstrates holistic wellness expertise with practical applications'
  }
];

// Demo question categories for easy selection
export const DEMO_CATEGORIES = {
  'Product Strategy': DEMO_QUESTIONS.filter(q => q.domain === 'productboard' && q.category === 'strategy'),
  'Technical Architecture': DEMO_QUESTIONS.filter(q => q.category === 'technical'),
  'Clinical Development': DEMO_QUESTIONS.filter(q => q.domain === 'cliniboard'),
  'Educational Innovation': DEMO_QUESTIONS.filter(q => q.domain === 'eduboard'),
  'Integrative Wellness': DEMO_QUESTIONS.filter(q => q.domain === 'remediboard')
};

// Quick demo questions for rapid demonstration
export const QUICK_DEMO_QUESTIONS = [
  DEMO_QUESTIONS[0], // Product-market fit
  DEMO_QUESTIONS[4], // Clinical trial design
  DEMO_QUESTIONS[7], // Curriculum design
  DEMO_QUESTIONS[9]  // Integrative treatment
];

// Get random demo question by domain
export function getRandomDemoQuestion(domain?: string): DemoQuestion {
  const filteredQuestions = domain 
    ? DEMO_QUESTIONS.filter(q => q.domain === domain)
    : DEMO_QUESTIONS;
  
  return filteredQuestions[Math.floor(Math.random() * filteredQuestions.length)];
}

// Get demo questions that showcase specific advisor
export function getDemoQuestionsForAdvisor(advisorId: string): DemoQuestion[] {
  return DEMO_QUESTIONS.filter(q => q.showcasesAdvisors.includes(advisorId));
}
