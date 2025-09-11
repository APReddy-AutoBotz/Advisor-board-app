/**
 * Static multi-board demo data for premium consultation experience
 * Provides coordinated responses across multiple advisory boards
 */

import type { Board } from '../lib/boards';

export interface MultiBoardAdvisorResponse {
  advisorId: string;
  name: string;
  role: string;
  content: string;
  boardId: string;
  boardName: string;
  confidence: number;
  timestamp: Date;
}

export interface MultiBoardDemoResponse {
  boardId: string;
  boardName: string;
  responses: MultiBoardAdvisorResponse[];
  coordinationContext: string;
}

export interface MultiBoardDemoScenario {
  question: string;
  selectedBoards: string[];
  responses: MultiBoardDemoResponse[];
  crossBoardSummary: string;
  totalExperts: number;
}

export const MULTI_BOARD_DEMO_SCENARIOS: Record<string, MultiBoardDemoScenario> = {
  productClinical: {
    question: "How should we approach developing a digital health platform for diabetic patients?",
    selectedBoards: ['productboard', 'cliniboard'],
    responses: [
      {
        boardId: 'productboard',
        boardName: 'Product Development & Strategy',
        coordinationContext: 'Product strategy with clinical compliance considerations',
        responses: [
          {
            advisorId: 'sarah-kim',
            name: 'Sarah Kim',
            role: 'Chief Product Officer',
            content: `**Product Development (AI Persona)**

Ship a CGM-first MVP with care-team messaging in 12 weeks.

• Map patient journeys: onboarding → CGM pairing → coach loop
• Must-haves: CGM sync, hypo alerts, med logging
• Guardrails: PHI segregation, audit trails
• Success: ≥50% WAU by week 8
• Next: Staff 1 PM, 1 FE, 1 BE, 1 RN; kickoff Monday

*Simulated expert trained on domain patterns.*`,
            boardId: 'productboard',
            boardName: 'Product Development & Strategy',
            confidence: 0.9,
            timestamp: new Date()
          },
          {
            advisorId: 'marcus-chen',
            name: 'Marcus Chen',
            role: 'Senior Product Manager',
            content: `**Product Development (AI Persona)**

Focus on P0 features: glucose logging, medication tracking, emergency alerts.

• Onboarding: 2-minute first glucose log time
• Accessibility: vision support for complications
• Integration: CGM sync, real-time alerts
• Retention: progressive disclosure, engagement loops
• Next: UX wireframes ready; user testing week 2

*Simulated expert trained on domain patterns.*`,
            boardId: 'productboard',
            boardName: 'Product Development & Strategy',
            confidence: 0.85,
            timestamp: new Date()
          }
        ]
      },
      {
        boardId: 'cliniboard',
        boardName: 'Clinical Research & Regulatory',
        coordinationContext: 'Clinical validation with product development alignment',
        responses: [
          {
            advisorId: 'sarah-chen',
            name: 'Dr. Sarah Chen',
            role: 'Clinical Research Strategy',
            content: `**Clinical & Regulatory (AI Persona)**

Design as Class II device-adjacent app with HIPAA + IEC 62304.

• FDA: MDDS claim; avoid diagnostic claims initially
• Data: HIPAA BAA; least-privilege access
• Risk: ISO 14971; safety case
• Trials: pilot in 2 clinics, pre/post HbA1c
• Next: Draft QMS checklist; review in 7 days

*AI persona. Educational only—not medical advice.*`,
            boardId: 'cliniboard',
            boardName: 'Clinical Research & Regulatory',
            confidence: 0.95,
            timestamp: new Date()
          },
          {
            advisorId: 'michael-rodriguez',
            name: 'Dr. Michael Rodriguez',
            role: 'Regulatory Affairs Director',
            content: `**Clinical & Regulatory (AI Persona)**

Schedule Q-Sub meeting 6 months before 510(k) submission.

• Design controls: CFR 820.30 compliance
• Risk management: ISO 14971 framework
• Software lifecycle: IEC 62304 documentation
• Cybersecurity: FDA guidance integration
• Next: Q-Sub prep meeting; regulatory timeline

*AI persona. Educational only—not medical advice.*`,
            boardId: 'cliniboard',
            boardName: 'Clinical Research & Regulatory',
            confidence: 0.92,
            timestamp: new Date()
          }
        ]
      }
    ],
    crossBoardSummary: `**Cross-Board Synthesis**

• **Consensus:** All boards agree on user-centered approach with safety-first design principles
• **Tension:** Speed-to-market vs regulatory compliance requires careful timeline balancing  
• **Decision:** Product lead owns MVP scope; Clinical lead owns safety review; target ≥70% weekly active users by week 8`,
    totalExperts: 4
  },

  productEducation: {
    question: "How can we design an effective onboarding experience for our complex B2B software platform?",
    selectedBoards: ['productboard', 'eduboard'],
    responses: [
      {
        boardId: 'productboard',
        boardName: 'Product Development & Strategy',
        coordinationContext: 'Product onboarding with educational methodology integration',
        responses: [
          {
            advisorId: 'sarah-kim',
            name: 'Sarah Kim',
            role: 'Chief Product Officer',
            content: `**Verdict:** Use progressive disclosure with role-based onboarding journeys.

**Assumptions:**
- B2B users need rapid time-to-value
- Complex features require gradual introduction
- Different roles need customized paths

**Guidance:**
- Build interactive product tours with tooltips
- Create sandbox environment for exploration
- Target 3-day time-to-first-value
- Implement A/B testing for optimization
- Track activation and feature adoption metrics`,
            boardId: 'productboard',
            boardName: 'Product Development & Strategy',
            confidence: 0.88,
            timestamp: new Date()
          }
        ]
      },
      {
        boardId: 'eduboard',
        boardName: 'Educational Innovation',
        coordinationContext: 'Learning methodology with product implementation alignment',
        responses: [
          {
            advisorId: 'maria-garcia-edu',
            name: 'Prof. Maria Garcia',
            role: 'Curriculum Design Expert',
            content: `**Verdict:** Apply scaffolded learning with 5-7 minute digestible modules.

**Assumptions:**
- Users learn best through hands-on practice
- Cognitive load must be carefully managed
- Competency-based progression drives retention

**Guidance:**
- Build on existing user workflows
- Provide immediate feedback on actions
- Create clear progression indicators
- Connect learning to specific job tasks
- Enable peer interaction opportunities`,
            boardId: 'eduboard',
            boardName: 'Educational Innovation',
            confidence: 0.91,
            timestamp: new Date()
          }
        ]
      }
    ],
    crossBoardSummary: `**Shared Ground:** All boards emphasize progressive learning, user-centered design, and competency-based advancement.

**Key Trade-off:** Comprehensive feature education vs rapid user activation vs learning retention.

**Immediate Next:** Create integrated onboarding prototype combining product tours with educational modules within 7 days.`,
    totalExperts: 2
  },

  clinicalWellness: {
    question: "What's the best approach for integrating traditional medicine practices into modern clinical trials?",
    selectedBoards: ['cliniboard', 'remediboard'],
    responses: [
      {
        boardId: 'cliniboard',
        boardName: 'Clinical Research & Regulatory',
        coordinationContext: 'Clinical research with traditional medicine integration',
        responses: [
          {
            advisorId: 'sarah-chen',
            name: 'Dr. Sarah Chen',
            role: 'Clinical Research Strategy',
            content: `**Verdict:** Follow botanical drug development pathway for herbal interventions.

**Assumptions:**
- Traditional medicine requires rigorous validation
- ICH-E6 GCP principles apply to trials
- Herb-drug interactions need monitoring

**Guidance:**
- Design pragmatic real-world effectiveness studies
- Implement enhanced pharmacovigilance protocols
- Develop quality standards for preparations
- Combine traditional diagnostics with biomarkers
- Ensure sustainable sourcing practices

**Disclosure:** Educational content, not medical advice.`,
            boardId: 'cliniboard',
            boardName: 'Clinical Research & Regulatory',
            confidence: 0.87,
            timestamp: new Date()
          }
        ]
      },
      {
        boardId: 'remediboard',
        boardName: 'Holistic Wellness & Natural Remedies',
        coordinationContext: 'Traditional medicine with clinical research validation',
        responses: [
          {
            advisorId: 'james-wilson-wellness',
            name: 'Dr. James Wilson',
            role: 'Naturopathic Medicine',
            content:`**Verdict:** Build daily habit loops around whole foods, movement, and stress care.

- Plate method first: half veg, quarter protein, smart carbs
- Swap refined grains for millets or brown rice, trial 4 weeks
- Pair carbs with fiber + protein to blunt glucose spikes
- CGM-aware nudges: pre-meal walk, post-meal 10-min movement
- Weekly coach check-ins; track sleep, mood, adherence`

**Assumptions:**
- Traditional formulas work through synergistic effects
- Constitutional assessment enhances outcomes
- Practitioner collaboration is essential

**Guidance:**
- Design complementary protocols allowing concurrent care
- Include traditional healers in research teams
- Respect traditional preparation and timing methods
- Integrate lifestyle and mindfulness components
- Ensure post-study access to treatments

**Disclosure:** Educational content, not medical advice.`,
            boardId: 'remediboard',
            boardName: 'Holistic Wellness & Natural Remedies',
            confidence: 0.89,
            timestamp: new Date()
          }
        ]
      }
    ],
    crossBoardSummary: `**Shared Ground:** All boards emphasize patient safety, evidence-based validation, and respect for traditional healing principles.

**Key Trade-off:** Scientific standardization vs individualized traditional medicine vs regulatory compliance.

**Immediate Next:** Establish traditional medicine practitioner advisory committee within 7 days for study design input.`,
    totalExperts: 2
  }
};

// Helper function to get demo scenario by board combination
export function getMultiBoardDemoScenario(boardIds: string[]): MultiBoardDemoScenario | null {
  const sortedIds = boardIds.sort().join('');
  
  const scenarioMap: Record<string, string> = {
    'cliniboardproductboard': 'productClinical',
    'eduboardproductboard': 'productEducation', 
    'cliniboardremediboard': 'clinicalWellness'
  };
  
  const scenarioKey = scenarioMap[sortedIds];
  return scenarioKey ? MULTI_BOARD_DEMO_SCENARIOS[scenarioKey] : null;
}

// Default multi-board question for demo
export const DEFAULT_MULTI_BOARD_QUESTION = "How should we approach developing a digital health platform for diabetic patients?";