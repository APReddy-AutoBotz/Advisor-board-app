/**
 * Static Multi-Board Response Service
 * Provides demo-ready multi-board consultation responses using static data
 * No LLM calls, no session storage - pure display-first experience
 */

import type { Board } from '../lib/boards';
import type { MultiDomainConsultationRequest, MultiDomainResponse } from './intelligentResponseService';
import { 
  getMultiBoardDemoScenario, 
  DEFAULT_MULTI_BOARD_QUESTION,
  type MultiBoardDemoScenario 
} from '../data/multiBoardDemoData';

export interface StaticMultiBoardResult {
  responses: MultiDomainResponse[];
  crossBoardSummary: string;
  totalExperts: number;
  isDemo: true;
}

/**
 * Generate static multi-board responses for demo purposes
 * Returns coordinated responses immediately without API calls
 */
export async function generateStaticMultiBoardResponses(request: any): Promise<StaticMultiBoardResult> {
  // Simulate brief loading for demo effect (keeps the premium feel)
  await new Promise(resolve => setTimeout(resolve, 800));

  // Normalize inputs: accept {selectedBoards}, {selectedBoardIds}, string[]
  let boardIds: string[] = [];
  if (Array.isArray(request)) {
    boardIds = request as string[];
  } else if (request?.selectedBoardIds && Array.isArray(request.selectedBoardIds)) {
    boardIds = request.selectedBoardIds as string[];
  } else if (request?.selectedBoards && Array.isArray(request.selectedBoards)) {
    boardIds = (request.selectedBoards as any[]).map((b) => b.id);
  }

  const question: string = request?.question || DEFAULT_MULTI_BOARD_QUESTION;

  // Try to find a curated demo scenario first
  let demoScenario = getMultiBoardDemoScenario(boardIds);
  if (!demoScenario) {
    // If we don't have full Board objects (no titles/experts), build a safe static fallback
    if (!request?.selectedBoards) {
      return generateStaticFallbackFromIds(boardIds, question);
    }
    // Else fall back to older flow that uses Board objects
    return generateFallbackMultiBoardResponse(request as MultiDomainConsultationRequest);
  }

  // Convert curated demo data to service response format
  const responses: MultiDomainResponse[] = demoScenario.responses.map(boardResponse => ({
    boardId: boardResponse.boardId,
    boardName: boardResponse.boardName,
    responses: boardResponse.responses.map(advisorResponse => ({
      advisorId: advisorResponse.advisorId,
      content: advisorResponse.content,
      timestamp: new Date(),
      persona: {
        name: advisorResponse.name,
        expertise: advisorResponse.role,
      },
      confidence: advisorResponse.confidence,
    })),
    timestamp: new Date(),
    coordinationContext: boardResponse.coordinationContext,
  }));

  return {
    responses,
    crossBoardSummary: demoScenario.crossBoardSummary,
    totalExperts: responses.reduce((sum, r) => sum + r.responses.length, 0),
    isDemo: true,
  };
}

/**
 * Build a safe static fallback using only board IDs and the current question.
 * This avoids reliance on full Board objects when the caller passes just IDs.
 */
function generateStaticFallbackFromIds(boardIds: string[], question: string): StaticMultiBoardResult {
  const boardTitleMap: Record<string, string> = {
    productboard: 'Product Development & Strategy',
    cliniboard: 'Clinical Research & Regulatory',
    remediboard: 'Holistic Wellness & Natural Remedies',
    eduboard: 'Education & Learning Design',
  };

  const responses: MultiDomainResponse[] = boardIds.map((id) => {
    const boardTitle = boardTitleMap[id] ?? id;
    // two generic advisors per board for parity with curated demos
    const advisors = [
      { advisorId: `${id}-a`, name: 'Advisor A', role: boardTitle.split('&')[0].trim() },
      { advisorId: `${id}-b`, name: 'Advisor B', role: boardTitle.split('&')[0].trim() },
    ];

    // choose generator based on board
    const generator = id === 'productboard'
      ? generateProductResponse
      : id === 'cliniboard'
      ? generateClinicalResponse
      : id === 'remediboard'
      ? generateWellnessResponse
      : generateEducationResponse;

    return {
      boardId: id,
      boardName: boardTitle,
      responses: advisors.map(a => ({
        advisorId: a.advisorId,
        content: generator(a.name, a.role, boardTitle, question),
        timestamp: new Date(),
        persona: { name: a.name, expertise: a.role },
        confidence: 0.8,
      })),
      timestamp: new Date(),
      coordinationContext: `${boardTitle} perspective with multi-board coordination`,
    } as unknown as MultiDomainResponse;
  });

  const crossBoardSummary = `**Cross-Board Synthesis**

• **Consensus:** All boards emphasize user safety and practical next steps.
• **Tension:** Breadth versus depth—prioritize a shippable MVP, validate quickly.
• **Decision:** Product leads MVP scope; Clinical leads safety checklist; target ≥70% WAU by week 8.`;

  return {
    responses,
    crossBoardSummary,
    totalExperts: responses.reduce((s, r) => s + r.responses.length, 0),
    isDemo: true,
  };
}

/* =========================
 * Legacy fallback + helpers
 * =========================
 * These keep the previous behavior when a full request with
 * `selectedBoards` (Board objects) is still provided.
 */

function generateFallbackMultiBoardResponse(
  request: MultiDomainConsultationRequest
): StaticMultiBoardResult {
  const responses: MultiDomainResponse[] = request.selectedBoards.map(board => ({
    boardId: board.id,
    boardName: board.title,
    responses: board.experts.slice(0, 2).map(expert => ({
      advisorId: expert.id,
      content: generateFallbackResponse(expert.name, expert.role, board.title, request.question),
      timestamp: new Date(),
      persona: {
        name: expert.name,
        expertise: expert.role,
      },
      confidence: 0.75,
    })),
    timestamp: new Date(),
    coordinationContext: `${board.title} perspective with multi-board coordination`,
  }));
  
  const boardNames = request.selectedBoards.map(b => b.title).join(', ');
  const totalExperts = responses.reduce((sum, r) => sum + r.responses.length, 0);
  
  const crossBoardSummary = `**Cross-Board Synthesis**

• **Consensus:** All boards agree on user-centered approach with safety-first design principles
• **Tension:** Speed-to-market vs regulatory compliance requires careful timeline balancing  
• **Decision:** Product lead owns MVP scope; Clinical lead owns safety review; target ≥70% weekly active users by week 8`;

  return {
    responses,
    crossBoardSummary,
    totalExperts,
    isDemo: true,
  };
}

function generateFallbackResponse(
  advisorName: string,
  advisorRole: string,
  boardTitle: string,
  question: string
): string {
  // Route by board name keywords to keep content on-brand
  const title = boardTitle.toLowerCase();
  if (title.includes('product')) {
    return generateProductResponse(advisorName, advisorRole, boardTitle, question);
  }
  if (title.includes('clinical') || title.includes('regulatory')) {
    return generateClinicalResponse(advisorName, advisorRole, boardTitle, question);
  }
  if (title.includes('wellness') || title.includes('remed')) {
    return generateWellnessResponse(advisorName, advisorRole, boardTitle, question);
  }
  return generateEducationResponse(advisorName, advisorRole, boardTitle, question);
}

function generateProductResponse(
  advisorName: string,
  advisorRole: string,
  boardTitle: string,
  question: string
): string {
  return `**Verdict:** Ship a CGM-first MVP with care-team messaging in 12 weeks.

- Map patient journeys: onboarding → CGM pairing → coach loop
- Must-haves: CGM sync, hypo alerts, med logging
- Guardrails: PHI segregation, audit trails
- Success: ≥50% WAU by week 8
- Next: Staff 1 PM, 1 FE, 1 BE, 1 RN; kickoff Monday

*Simulated expert trained on domain patterns.*`;
}

function generateClinicalResponse(
  advisorName: string,
  advisorRole: string,
  boardTitle: string,
  question: string
): string {
  return `**Verdict:** Design as Class II device-adjacent app with HIPAA + IEC 62304.

- FDA: MDDS claim; avoid diagnostic claims initially
- Data: HIPAA BAA; least-privilege access
- Risk: ISO 14971; safety case
- Trials: pilot in 2 clinics, pre/post HbA1c
- Next: Draft QMS checklist; review in 7 days

*AI persona. Educational only—not medical advice.*`;
}

function generateWellnessResponse(
  advisorName: string,
  advisorRole: string,
  boardTitle: string,
  question: string
): string {
  return `**Verdict:** Build daily habit loops around whole foods, movement, and stress care.

- Plate method: half veg, quarter protein, smart carbs
- Swap refined grains for millets/brown rice (trial 4 weeks)
- Pair carbs with fiber + protein to blunt glucose spikes
- CGM-aware nudges: pre-meal walk; 10-min post-meal movement
- Weekly coach check-ins; track sleep, mood, adherence

*AI persona. Educational only—not medical advice.*`;
}

function generateEducationResponse(
  advisorName: string,
  advisorRole: string,
  boardTitle: string,
  question: string
): string {
  return `**Verdict:** Teach self-management with competency-based modules and coach feedback.

- Onboarding: 7-day glucose literacy sprint with micro-lessons
- Practice: food logging + movement streaks; badge progress
- Personalization: adapt difficulty via weekly CGM trends
- Assessment: monthly skill check; coach review cycle
- Next: run 20-user pilot; >70% lesson completion

*Simulated expert trained on domain patterns.*`;
}
