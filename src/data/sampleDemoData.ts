/**
 * Static demo data for premium landing transformation
 * Provides hardcoded advisor responses and demo scenarios for visual simulation
 */

export interface StaticAdvisorResponse {
  id: string;
  name: string;
  role: string;
  response: string;
  boardId: 'clinical' | 'product' | 'education' | 'remedy';
  delay: number; // CSS animation delay in ms
}

export interface StaticDemoSummary {
  title: string;
  content: string;
  delay: number;
}

export interface StaticDemoScenario {
  question: string;
  advisors: StaticAdvisorResponse[];
  summary: StaticDemoSummary;
}

export const DEMO_SCENARIOS: Record<string, StaticDemoScenario> = {
  default: {
    question: "How should we prioritize our product roadmap for Q1?",
    advisors: [
      {
        id: "sarah-kim", 
        name: "Sarah Kim",
        role: "Chief Product Advisor",
        response: "Use the RICE framework (Reach, Impact, Confidence, Effort) to score features. Focus on high-impact, low-effort wins first. Validate assumptions with user data before committing resources to major initiatives.",
        boardId: "product",
        delay: 800
      },
      {
        id: "maria-garcia-edu",
        name: "Dr. Maria Garcia",
        role: "Learning Experience Advisor", 
        response: "Consider user onboarding complexity when prioritizing features. New functionality should reduce cognitive load, not increase it. Implement progressive disclosure and contextual help systems for better adoption.",
        boardId: "education",
        delay: 1200
      }
    ],
    summary: {
      title: "Strategic Roadmap Insights",
      content: "Prioritize based on user impact and learning curve. Balance feature complexity with user adoption. Use data-driven decisions with strong focus on user experience and measurable outcomes.",
      delay: 1600
    }
  },
  
  product: {
    question: "How should we prioritize our product roadmap?",
    advisors: [
      {
        id: "sarah-kim",
        name: "Sarah Kim",
        role: "Chief Product Advisor",
        response: "Use the RICE framework (Reach, Impact, Confidence, Effort) to score features. Focus on high-impact, low-effort wins first. Validate assumptions with user data before committing resources.",
        boardId: "product",
        delay: 800
      },
      {
        id: "maria-garcia-edu",
        name: "Dr. Maria Garcia",
        role: "Curriculum Design Advisor", 
        response: "Consider user onboarding complexity. New features should reduce cognitive load, not increase it. Implement progressive disclosure and contextual help systems.",
        boardId: "education",
        delay: 1200
      }
    ],
    summary: {
      title: "Strategic Alignment",
      content: "Prioritize based on user impact and learning curve. Balance feature complexity with user adoption. Data-driven decisions with user experience focus.",
      delay: 1600
    }
  },

  clinical: {
    question: "What's the best approach for patient recruitment?",
    advisors: [
      {
        id: "james-wilson",
        name: "Dr. James Wilson",
        role: "Clinical Operations Advisor",
        response: "Leverage digital recruitment channels and patient registries. Ensure inclusion criteria are clear and achievable. Consider decentralized trial elements to improve accessibility.",
        boardId: "clinical",
        delay: 800
      },
      {
        id: "lisa-chen-wellness",
        name: "Dr. Lisa Chen",
        role: "Traditional Medicine Advisor",
        response: "Address patient concerns about trial participation. Provide comprehensive support systems and clear communication about benefits. Consider cultural sensitivity in outreach.",
        boardId: "remedy",
        delay: 1200
      }
    ],
    summary: {
      title: "Patient-Centered Approach",
      content: "Combine digital efficiency with human-centered design. Focus on accessibility, clear communication, and comprehensive patient support throughout the recruitment process.",
      delay: 1600
    }
  }
};

// Default scenario for initial demo load
export const DEFAULT_DEMO_QUESTION = "How should we prioritize our product roadmap for Q1?";

// Board-specific demo questions for variety
export const BOARD_DEMO_QUESTIONS = {
  clinical: "What's the best approach for patient recruitment?",
  product: "How should we prioritize our product roadmap?",
  education: "How can we improve user onboarding?",
  remedy: "What holistic approaches should we consider?"
};
