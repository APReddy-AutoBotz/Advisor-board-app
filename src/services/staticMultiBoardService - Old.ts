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
export async function generateStaticMultiBoardResponses(
  request: MultiDomainConsultationRequest
): Promise<StaticMultiBoardResult> {
  // Simulate brief loading for demo effect
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const boardIds = request.selectedBoards.map(board => board.id);
  const demoScenario = getMultiBoardDemoScenario(boardIds);
  
  if (!demoScenario) {
    // Fallback to default scenario if no specific match
    return generateFallbackMultiBoardResponse(request);
  }
  
  // Convert demo data to service response format
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
    totalExperts: demoScenario.totalExperts,
    isDemo: true,
  };
}

/**
 * Generate fallback response for board combinations not in demo data
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

/**
 * Generate fallback response content for individual advisors
 */
function generateFallbackResponse(
  advisorName: string, 
  advisorRole: string, 
  boardTitle: string, 
  question: string
): string {
  // Create more varied, realistic responses based on board type and question content
  const questionLower = question.toLowerCase();
  
  // Board-specific response templates
  if (boardTitle.includes('Clinical') || boardTitle.includes('Remedy')) {
    return generateClinicalResponse(advisorName, advisorRole, boardTitle, question);
  } else if (boardTitle.includes('Product')) {
    return generateProductResponse(advisorName, advisorRole, boardTitle, question);
  } else if (boardTitle.includes('Education')) {
    return generateEducationResponse(advisorName, advisorRole, boardTitle, question);
  } else {
    return generateGenericExpertResponse(advisorName, advisorRole, boardTitle, question);
  }
}

function generateClinicalResponse(advisorName: string, advisorRole: string, boardTitle: string, question: string): string {
  const questionLower = question.toLowerCase();
  
  if (questionLower.includes('diabetic') || questionLower.includes('diabetes')) {
    return `**Clinical & Regulatory (AI Persona)**

Design as Class II device-adjacent app with HIPAA + IEC 62304.

• FDA: MDDS claim; avoid diagnostic claims initially
• Data: HIPAA BAA; least-privilege access
• Risk: ISO 14971; safety case
• Trials: pilot in 2 clinics, pre/post HbA1c
• Next: Draft QMS checklist; review in 7 days

*AI persona. Educational only—not medical advice.*`;
  }
  
  return `**Clinical & Regulatory (AI Persona)**

Evidence-based approach prioritizing patient safety and regulatory compliance.

• Safety protocols per clinical guidelines
• Risk assessment for patient populations  
• Monitoring and adverse event protocols
• Documentation for quality assurance
• Next: Clinical review board meeting; 5 days

*AI persona. Educational only—not medical advice.*`;
}

function generateProductResponse(advisorName: string, advisorRole: string, boardTitle: string, question: string): string {
  const questionLower = question.toLowerCase();
  
  if (questionLower.includes('diabetic') || questionLower.includes('diabetes')) {
    return `**Product Development (AI Persona)**

Ship a CGM-first MVP with care-team messaging in 12 weeks.

• Map patient journeys: onboarding → CGM pairing → coach loop
• Must-haves: CGM sync, hypo alerts, med logging
• Guardrails: PHI segregation, audit trails
• Success: ≥50% WAU by week 8
• Next: Staff 1 PM, 1 FE, 1 BE, 1 RN; kickoff Monday

*Simulated expert trained on domain patterns.*`;
  }
  
  return `**Product Development (AI Persona)**

User-centered MVP with clear value proposition and scalability.

• Core features: user journeys, key workflows
• Technical: feasibility assessment, architecture
• Go-to-market: positioning, success metrics
• Resources: team structure, timeline
• Next: MVP scope review; stakeholder alignment

*Simulated expert trained on domain patterns.*`;
}

function generateEducationResponse(advisorName: string, advisorRole: string, boardTitle: string, question: string): string {
  const questionLower = question.toLowerCase();
  
  if (questionLower.includes('diabetic') || questionLower.includes('diabetes')) {
    return `**Educational Innovation (AI Persona)**

Transform learning experiences with pedagogy experts and EdTech.

• Curriculum: diabetes self-management, CGM literacy
• Delivery: micro-learning modules, peer support
• Assessment: competency-based progression
• Engagement: gamification, social features
• Next: Pilot curriculum with 20 patients; week 3

*Simulated expert trained on domain patterns.*`;
  }
  
  return `**Educational Innovation (AI Persona)**

Adult learning principles with practical skill development.

• Learning objectives: real-world outcomes
• Delivery: multiple modalities, accessibility
• Assessment: competency-based advancement
• Analytics: progress tracking, optimization
• Next: Curriculum review; stakeholder feedback

*Simulated expert trained on domain patterns.*`;
}

function generateGenericExpertResponse(advisorName: string, advisorRole: string, boardTitle: string, question: string): string {
  return `As ${advisorName}, ${advisorRole}, I bring specialized expertise from ${boardTitle} to address this multifaceted challenge.

**Domain Expertise Application:**
Drawing from my experience in ${boardTitle.toLowerCase()}, I recommend a structured approach that leverages industry best practices while considering the unique aspects of your specific situation.

**Strategic Considerations:**
- Stakeholder analysis and requirement gathering
- Risk assessment and mitigation planning
- Resource optimization and timeline management
- Quality assurance and success measurement

**Implementation Framework:**
- Phased approach with clear milestones and deliverables
- Cross-functional collaboration and communication protocols
- Continuous monitoring and adjustment mechanisms
- Documentation and knowledge transfer processes

**Success Factors:**
- Clear objectives and success criteria definition
- Adequate resource allocation and team coordination
- Regular progress reviews and course corrections
- Stakeholder engagement and change management

**Integrated Approach:**
Coordinating with other advisory boards ensures comprehensive coverage of all relevant aspects while maintaining focus on your primary objectives and constraints.`;
}

/**
 * Get appropriate demo question for selected boards
 */
export function getRecommendedDemoQuestion(boards: Board[]): string {
  const boardIds = boards.map(b => b.id).sort();
  
  const questionMap: Record<string, string> = {
    'cliniboard,productboard': "How should we approach developing a digital health platform for diabetic patients?",
    'eduboard,productboard': "How can we design an effective onboarding experience for our complex B2B software platform?",
    'cliniboard,remediboard': "What's the best approach for integrating traditional medicine practices into modern clinical trials?",
  };
  
  const key = boardIds.join(',');
  return questionMap[key] || DEFAULT_MULTI_BOARD_QUESTION;
}

/**
 * Check if a board combination has premium demo content
 */
export function hasPremiumDemoContent(boards: Board[]): boolean {
  const boardIds = boards.map(b => b.id);
  return getMultiBoardDemoScenario(boardIds) !== null;
}