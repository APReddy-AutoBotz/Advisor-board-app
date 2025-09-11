/**
 * Intelligent Response Service
 * 
 * This service generates intelligent, contextual responses from AI advisors
 * using the persona prompt service and LLM integration layer.
 */

import { personaPromptService } from './personaPromptService';
import type { BoardExpert, Board } from '../lib/boards';
import { LLMIntegrationLayer } from './llm/LLMIntegrationLayer';

export interface QuestionInsights {
  type: string;
  domain: string;
  confidence: number;
  keywords: string[];
  complexity: 'low' | 'medium' | 'high';
  suggestedExperts?: string[];
}

export interface AdvisorResponse {
  advisorId: string;
  content: string;
  timestamp: Date;
  persona: {
    name: string;
    expertise: string;
  };
  confidence?: number;
  sources?: string[];
}

// Multi-Board Coordination Interfaces
export interface MultiDomainConsultationRequest {
  question: string;
  selectedBoards: Board[];
  coordinationContext?: string;
  requestId?: string;
}

export interface MultiDomainResponse {
  boardId: string;
  boardName: string;
  responses: AdvisorResponse[];
  timestamp: Date;
  coordinationContext: string;
  crossBoardSummary?: string;
}

export interface CoordinationPromptTemplate {
  basePrompt: string;
  crossBoardContext: string;
  domainBoundaries: string;
  coordinationInstructions: string;
}

export interface BoardCoordinationConfig {
  boardId: string;
  complementaryBoards: string[];
  domainBoundaries: string[];
  coordinationPrompts: Record<string, CoordinationPromptTemplate>;
}

// Board Coordination Configuration
const BOARD_COORDINATION_CONFIG: Record<string, BoardCoordinationConfig> = {
  productboard: {
    boardId: 'productboard',
    complementaryBoards: ['cliniboard', 'eduboard', 'remediboard'],
    domainBoundaries: [
      'Focus on product strategy, user experience, and technical implementation',
      'Avoid medical advice or clinical recommendations',
      'Consider business viability and market dynamics'
    ],
    coordinationPrompts: {
      'cliniboard': {
        basePrompt: 'You are providing product development advice while considering clinical/regulatory constraints.',
        crossBoardContext: 'The clinical research board will address regulatory compliance and safety requirements.',
        domainBoundaries: 'Focus on product features, user experience, and technical feasibility. Acknowledge when clinical expertise is needed.',
        coordinationInstructions: 'Reference how your product recommendations should align with regulatory requirements that the clinical board will detail.'
      },
      'eduboard': {
        basePrompt: 'You are providing product development advice for educational technology or learning platforms.',
        crossBoardContext: 'The education board will address pedagogical approaches and learning effectiveness.',
        domainBoundaries: 'Focus on product architecture, user engagement, and technical implementation. Defer to education experts on learning theory.',
        coordinationInstructions: 'Explain how your product recommendations will support the educational strategies the education board will outline.'
      },
      'remediboard': {
        basePrompt: 'You are providing product development advice for wellness or health-related products.',
        crossBoardContext: 'The wellness board will address holistic health approaches and natural remedies.',
        domainBoundaries: 'Focus on product design, user experience, and technology. Avoid making health claims or medical recommendations.',
        coordinationInstructions: 'Describe how your product features can support the wellness approaches the holistic health board will recommend.'
      }
    }
  },
  cliniboard: {
    boardId: 'cliniboard',
    complementaryBoards: ['productboard', 'eduboard', 'remediboard'],
    domainBoundaries: [
      'Focus on clinical research, regulatory compliance, and evidence-based medicine',
      'Maintain scientific rigor and regulatory standards',
      'Address safety, efficacy, and regulatory pathways'
    ],
    coordinationPrompts: {
      'productboard': {
        basePrompt: 'You are providing clinical and regulatory guidance for product development.',
        crossBoardContext: 'The product board will address technical implementation and user experience.',
        domainBoundaries: 'Focus on regulatory requirements, clinical evidence, and safety standards. Avoid product design specifics.',
        coordinationInstructions: 'Outline the regulatory framework and clinical requirements that the product team will need to implement.'
      },
      'eduboard': {
        basePrompt: 'You are providing clinical research guidance for educational or training programs.',
        crossBoardContext: 'The education board will address learning methodologies and curriculum design.',
        domainBoundaries: 'Focus on evidence-based practices, research methodologies, and clinical standards. Defer to education experts on pedagogy.',
        coordinationInstructions: 'Provide the clinical evidence and research standards that should inform the educational approaches.'
      },
      'remediboard': {
        basePrompt: 'You are providing clinical research perspective on integrative and holistic health approaches.',
        crossBoardContext: 'The wellness board will address natural remedies and holistic treatments.',
        domainBoundaries: 'Focus on clinical evidence, safety data, and regulatory considerations for natural products.',
        coordinationInstructions: 'Provide the clinical evidence and safety considerations for the natural approaches the wellness board will recommend.'
      }
    }
  },
  eduboard: {
    boardId: 'eduboard',
    complementaryBoards: ['productboard', 'cliniboard', 'remediboard'],
    domainBoundaries: [
      'Focus on educational theory, learning effectiveness, and pedagogical approaches',
      'Address curriculum design and learning outcomes',
      'Consider diverse learning styles and accessibility'
    ],
    coordinationPrompts: {
      'productboard': {
        basePrompt: 'You are providing educational guidance for product development and user experience.',
        crossBoardContext: 'The product board will address technical implementation and user interface design.',
        domainBoundaries: 'Focus on learning theory, user education, and pedagogical effectiveness. Avoid technical implementation details.',
        coordinationInstructions: 'Outline the educational principles and learning strategies that should guide the product design decisions.'
      },
      'cliniboard': {
        basePrompt: 'You are providing educational expertise for clinical training or medical education programs.',
        crossBoardContext: 'The clinical board will address evidence-based practices and regulatory requirements.',
        domainBoundaries: 'Focus on educational methodology, curriculum design, and learning assessment. Defer to clinical experts on medical content.',
        coordinationInstructions: 'Design educational approaches that will effectively teach the clinical concepts and evidence the clinical board will provide.'
      },
      'remediboard': {
        basePrompt: 'You are providing educational guidance for wellness and holistic health education.',
        crossBoardContext: 'The wellness board will address natural remedies and holistic health approaches.',
        domainBoundaries: 'Focus on educational strategies, behavior change, and learning engagement. Avoid making health recommendations.',
        coordinationInstructions: 'Create educational frameworks that will help people understand and apply the wellness strategies the holistic health board will recommend.'
      }
    }
  },
  remediboard: {
    boardId: 'remediboard',
    complementaryBoards: ['productboard', 'cliniboard', 'eduboard'],
    domainBoundaries: [
      'Focus on holistic health, natural remedies, and integrative approaches',
      'Emphasize root cause analysis and whole-person wellness',
      'Consider traditional wisdom alongside modern research'
    ],
    coordinationPrompts: {
      'productboard': {
        basePrompt: 'You are providing holistic health guidance for wellness product development.',
        crossBoardContext: 'The product board will address technical implementation and user experience design.',
        domainBoundaries: 'Focus on holistic health principles, natural approaches, and wellness strategies. Avoid technical product details.',
        coordinationInstructions: 'Provide the wellness principles and holistic health approaches that should inform the product features and user experience.'
      },
      'cliniboard': {
        basePrompt: 'You are providing integrative health perspective alongside conventional clinical approaches.',
        crossBoardContext: 'The clinical board will address evidence-based medicine and regulatory requirements.',
        domainBoundaries: 'Focus on natural remedies, holistic approaches, and integrative medicine. Acknowledge the importance of clinical evidence.',
        coordinationInstructions: 'Explain how natural and holistic approaches can complement the evidence-based treatments the clinical board will recommend.'
      },
      'eduboard': {
        basePrompt: 'You are providing holistic health guidance for wellness education and behavior change.',
        crossBoardContext: 'The education board will address learning methodologies and curriculum design.',
        domainBoundaries: 'Focus on holistic health principles, natural wellness approaches, and lifestyle medicine. Defer to education experts on teaching methods.',
        coordinationInstructions: 'Provide the wellness content and holistic health principles that the education board can structure into effective learning experiences.'
      }
    }
  }
};

/**
 * Analyze a question to extract insights about its type, domain, and complexity
 */
export async function getQuestionInsights(question: string): Promise<QuestionInsights> {
  try {
    // Simple question analysis - could be enhanced with NLP
    const questionLower = question.toLowerCase();
    
    // Determine question type
    let type = 'advisory';
    if (questionLower.includes('how') || questionLower.includes('what') || questionLower.includes('why')) {
      type = 'informational';
    } else if (questionLower.includes('should') || questionLower.includes('recommend') || questionLower.includes('best') || 
               questionLower.includes('better') || questionLower.includes('which')) {
      type = 'advisory';
    } else if (questionLower.includes('compare') || questionLower.includes('versus') || questionLower.includes('vs') ||
               questionLower.includes('or') || questionLower.includes('between')) {
      type = 'comparative';
    } else if (questionLower.includes('implement') || questionLower.includes('execute') || questionLower.includes('plan')) {
      type = 'strategic';
    }

    // Determine domain with priority order (wellness/nutrition first, then clinical)
    let domain = 'general';
    let confidence = 0.7;
    
    // Priority 1: Wellness/Nutrition (including diabetic patients asking about food)
    if (questionLower.includes('natural') || questionLower.includes('herbal') || questionLower.includes('holistic') ||
        questionLower.includes('wellness') || questionLower.includes('traditional') || questionLower.includes('remedy') ||
        questionLower.includes('diabetic') || questionLower.includes('diabetes') || questionLower.includes('nutrition') ||
        questionLower.includes('diet') || questionLower.includes('food') || questionLower.includes('millet') ||
        questionLower.includes('rice') || questionLower.includes('health') || questionLower.includes('supplement') ||
        questionLower.includes('vitamin') || questionLower.includes('mineral') || questionLower.includes('exercise') ||
        questionLower.includes('lifestyle') || questionLower.includes('weight') || questionLower.includes('blood sugar') ||
        questionLower.includes('cholesterol') || questionLower.includes('hypertension')) {
      domain = 'natural remedies';
      confidence = 0.9;
    }
    // Priority 2: Clinical Research (only for actual research/trial questions)
    else if (questionLower.includes('clinical trial') || questionLower.includes('clinical study') || 
             questionLower.includes('fda approval') || questionLower.includes('drug development') || 
             questionLower.includes('pharmaceutical') || questionLower.includes('randomized controlled') ||
             questionLower.includes('placebo') || questionLower.includes('biomarker') || 
             questionLower.includes('regulatory') || questionLower.includes('protocol') ||
             (questionLower.includes('clinical') && (questionLower.includes('trial') || questionLower.includes('study') || questionLower.includes('research')))) {
      domain = 'clinical research';
      confidence = 0.9;
    }
    // Priority 3: Education
    else if (questionLower.includes('education') || questionLower.includes('curriculum') || questionLower.includes('student') ||
             questionLower.includes('learning') || questionLower.includes('teaching') || questionLower.includes('school') ||
             questionLower.includes('training') || questionLower.includes('course') || questionLower.includes('pedagogy')) {
      domain = 'education';
      confidence = 0.9;
    }
    // Priority 4: Product Development
    else if (questionLower.includes('product') || questionLower.includes('feature') || questionLower.includes('user experience') ||
             questionLower.includes('design') || questionLower.includes('development') || questionLower.includes('growth') ||
             questionLower.includes('app') || questionLower.includes('software') || questionLower.includes('platform') ||
             questionLower.includes('website') || questionLower.includes('web') || questionLower.includes('digital') ||
             questionLower.includes('startup') || questionLower.includes('business model') || questionLower.includes('mvp') ||
             questionLower.includes('requirements') || questionLower.includes('launch') || questionLower.includes('market') ||
             questionLower.includes('competitive') || questionLower.includes('strategy') || questionLower.includes('metrics') ||
             questionLower.includes('kpi') || questionLower.includes('analytics') || questionLower.includes('user research')) {
      domain = 'product development';
      confidence = 0.9;
    }
    // Fallback: Check for general medical/patient context (lower priority)
    else if (questionLower.includes('medical') || questionLower.includes('patient care') || questionLower.includes('treatment')) {
      domain = 'clinical research';
      confidence = 0.7;
    }

    // Extract keywords
    const keywords = question
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 10);

    // Determine complexity
    let complexity: 'low' | 'medium' | 'high' = 'medium';
    if (question.length < 50) {
      complexity = 'low';
    } else if (question.length > 200 || keywords.length > 8) {
      complexity = 'high';
    }

    return {
      type,
      domain,
      confidence,
      keywords,
      complexity,
    };
  } catch (error) {
    console.error('Error analyzing question:', error);
    return {
      type: 'general',
      domain: 'general',
      confidence: 0.5,
      keywords: [],
      complexity: 'medium',
    };
  }
}

/**
 * Generate coordinated responses from multiple boards simultaneously
 */
export async function generateMultiBoardResponses(
  request: MultiDomainConsultationRequest
): Promise<MultiDomainResponse[]> {
  try {
    console.log('🌐 Generating multi-board responses for:', request.question);
    console.log('📋 Selected boards:', request.selectedBoards.map(b => b.title));

    // Generate coordination context
    const coordinationContext = generateCoordinationContext(request.selectedBoards, request.question);
    
    // Create parallel API calls for each board
    const boardResponsePromises = request.selectedBoards.map(async (board) => {
      try {
        console.log(`🎯 Processing board: ${board.title}`);
        
        // Get coordination config for this board
        const coordinationConfig = getCoordinationConfigForBoard(board.id, request.selectedBoards);
        
        // Generate responses for all experts in this board
        const boardResponses = await generateCoordinatedBoardResponses(
          request.question,
          board,
          coordinationConfig,
          coordinationContext
        );

        return {
          boardId: board.id,
          boardName: board.title,
          responses: boardResponses,
          timestamp: new Date(),
          coordinationContext,
        };
      } catch (error) {
        console.error(`❌ Error generating responses for board ${board.title}:`, error);
        
        // Return fallback response for this board
        return {
          boardId: board.id,
          boardName: board.title,
          responses: generateFallbackBoardResponses(board, request.question),
          timestamp: new Date(),
          coordinationContext,
        };
      }
    });

    // Wait for all board responses to complete
    const multiDomainResponses = await Promise.all(boardResponsePromises);
    
    console.log('✅ Generated multi-board responses for', multiDomainResponses.length, 'boards');
    return multiDomainResponses;
    
  } catch (error) {
    console.error('❌ Error in multi-board response generation:', error);
    
    // Return fallback responses for all boards
    return request.selectedBoards.map(board => ({
      boardId: board.id,
      boardName: board.title,
      responses: generateFallbackBoardResponses(board, request.question),
      timestamp: new Date(),
      coordinationContext: 'Fallback mode - individual board responses',
    }));
  }
}

/**
 * Generate responses for a single board with coordination context
 */
async function generateCoordinatedBoardResponses(
  question: string,
  board: Board,
  coordinationConfig: CoordinationPromptTemplate[],
  coordinationContext: string
): Promise<AdvisorResponse[]> {
  const responsePromises = board.experts.map(async (expert) => {
    try {
      // Create coordinated prompt for this expert
      const coordinatedPrompt = createCoordinatedPrompt(
        expert,
        question,
        board.id,
        coordinationConfig,
        coordinationContext
      );
      
      // Generate response using LLM with coordination context
      const responseResult = await generateCoordinatedLLMResponse(expert, coordinatedPrompt, board.id);

      return {
        advisorId: expert.id,
        content: responseResult.content,
        timestamp: new Date(),
        persona: {
          name: expert.name,
          expertise: expert.role,
        },
        confidence: responseResult.isLLMGenerated ? 0.85 : 0.7, // Higher confidence for LLM, lower for fallback
      };
    } catch (error) {
      console.error(`❌ Error generating coordinated response for ${expert.name}:`, error);
      
      // Fallback to regular response generation with lower confidence
      return {
        advisorId: expert.id,
        content: generateFallbackResponse(expert, question, board.id),
        timestamp: new Date(),
        persona: {
          name: expert.name,
          expertise: expert.role,
        },
        confidence: 0.6, // Lower confidence for fallback responses
      };
    }
  });

  return Promise.all(responsePromises);
}

/**
 * Generate intelligent responses from multiple advisors
 */
export async function generateAdvisorResponses(
  question: string,
  experts: BoardExpert[],
  domainId: string
): Promise<AdvisorResponse[]> {
  try {
    console.log('🧠 Generating intelligent responses for:', question);
    console.log('👥 Experts:', experts.map(e => e.name));
    console.log('🎯 Domain:', domainId);

    // Get question insights
    const insights = await getQuestionInsights(question);
    
    // Generate responses for each expert
    const responsePromises = experts.map(async (expert) => {
      try {
        // Try to use LLM integration first, fallback to static responses
        const response = await generateLLMResponse(expert, question, domainId);

        return {
          advisorId: expert.id,
          content: response,
          timestamp: new Date(),
          persona: {
            name: expert.name,
            expertise: expert.role,
          },
          confidence: insights.confidence,
        };
      } catch (error) {
        console.error(`Error generating response for ${expert.name}:`, error);
        
        // Fallback response
        return {
          advisorId: expert.id,
          content: generateFallbackResponse(expert, question, domainId),
          timestamp: new Date(),
          persona: {
            name: expert.name,
            expertise: expert.role,
          },
          confidence: 0.6,
        };
      }
    });

    const responses = await Promise.all(responsePromises);
    console.log('✅ Generated', responses.length, 'intelligent responses');
    
    return responses;
  } catch (error) {
    console.error('Error generating advisor responses:', error);
    
    // Return fallback responses for all experts
    return experts.map(expert => ({
      advisorId: expert.id,
      content: generateFallbackResponse(expert, question, domainId),
      timestamp: new Date(),
      persona: {
        name: expert.name,
        expertise: expert.role,
      },
      confidence: 0.5,
    }));
  }
}

/**
 * Generate coordination context for multi-board consultation
 */
function generateCoordinationContext(selectedBoards: Board[], question: string): string {
  const boardNames = selectedBoards.map(b => b.title).join(', ');
  const boardCount = selectedBoards.length;
  
  return `This is a multi-domain consultation involving ${boardCount} advisory boards: ${boardNames}. 
Each board will provide expertise from their domain while considering how their advice complements the other boards. 
The goal is to provide coordinated, comprehensive guidance that addresses all relevant aspects of the question.`;
}

/**
 * Get coordination configuration for a specific board in the context of other selected boards
 */
function getCoordinationConfigForBoard(boardId: string, selectedBoards: Board[]): CoordinationPromptTemplate[] {
  const boardConfig = BOARD_COORDINATION_CONFIG[boardId];
  if (!boardConfig) {
    return [];
  }
  
  const otherBoardIds = selectedBoards
    .filter(board => board.id !== boardId)
    .map(board => board.id);
  
  return otherBoardIds
    .filter(otherBoardId => boardConfig.coordinationPrompts[otherBoardId])
    .map(otherBoardId => boardConfig.coordinationPrompts[otherBoardId]);
}

/**
 * Create a coordinated prompt that includes cross-board context
 */
function createCoordinatedPrompt(
  expert: BoardExpert,
  question: string,
  boardId: string,
  coordinationConfigs: CoordinationPromptTemplate[],
  coordinationContext: string
): string {
  const basePrompt = createPersonaPrompt(expert, question, boardId);
  
  if (coordinationConfigs.length === 0) {
    return basePrompt;
  }
  
  // Combine coordination instructions from all relevant boards
  const coordinationInstructions = coordinationConfigs
    .map(config => config.coordinationInstructions)
    .join('\n\n');
  
  const domainBoundaries = coordinationConfigs
    .map(config => config.domainBoundaries)
    .join('\n');
  
  return `${basePrompt}

MULTI-BOARD COORDINATION CONTEXT:
${coordinationContext}

COORDINATION INSTRUCTIONS:
${coordinationInstructions}

DOMAIN BOUNDARIES:
Stay within your expertise: ${domainBoundaries}

Remember: This is a coordinated consultation. Your response should complement the other advisory boards while staying within your domain expertise. Acknowledge when other boards will provide specialized knowledge in their areas.`;
}

/**
 * Generate LLM response with coordination context
 */
async function generateCoordinatedLLMResponse(expert: BoardExpert, coordinatedPrompt: string, domainId: string): Promise<{ content: string; isLLMGenerated: boolean }> {
  try {
    const llmLayer = LLMIntegrationLayer.getInstance();
    
    if (await llmLayer.isAvailable()) {
      // Use slightly higher temperature for coordinated responses to encourage creativity
      const temperature = 0.85 + (Math.random() * 0.15); // 0.85-1.0
      const llmResponse = await llmLayer.generateResponse(coordinatedPrompt, {
        temperature,
        maxTokens: 900, // Slightly longer for coordinated responses
        timeout: 20000 // Longer timeout for coordination
      });
      
      if (llmResponse && llmResponse.content) {
        console.log(`✅ Generated coordinated LLM response for ${expert.name}`);
        return { content: llmResponse.content, isLLMGenerated: true };
      }
    }
  } catch (error) {
    console.warn(`⚠️ Coordinated LLM generation failed for ${expert.name}, using fallback:`, error);
  }
  
  // Fallback to domain-specific insight
  return { 
    content: generateDomainSpecificInsight(expert, coordinatedPrompt, domainId), 
    isLLMGenerated: false 
  };
}

/**
 * Generate fallback responses for an entire board
 */
function generateFallbackBoardResponses(board: Board, question: string): AdvisorResponse[] {
  return board.experts.map(expert => ({
    advisorId: expert.id,
    content: generateFallbackResponse(expert, question, board.id),
    timestamp: new Date(),
    persona: {
      name: expert.name,
      expertise: expert.role,
    },
    confidence: 0.5,
  }));
}

/**
 * Generate cross-board synthesis summary
 */
export function generateCrossBoardSummary(multiDomainResponses: MultiDomainResponse[], question: string): string {
  const boardNames = multiDomainResponses.map(r => r.boardName);
  const totalResponses = multiDomainResponses.reduce((sum, r) => sum + r.responses.length, 0);
  
  return `## Cross-Board Synthesis

This consultation brought together **${boardNames.length} advisory boards** (${boardNames.join(', ')}) with **${totalResponses} expert perspectives** to address your question comprehensively.

### Key Coordination Points:
${multiDomainResponses.map(response => 
  `**${response.boardName}**: Provided ${response.responses.length} expert perspective${response.responses.length > 1 ? 's' : ''} focusing on their domain expertise while considering complementary insights from other boards.`
).join('\n')}

### Integrated Recommendations:
The advisory boards have provided coordinated guidance that addresses multiple dimensions of your question. Each board's recommendations are designed to complement the others, giving you a holistic view that no single domain could provide alone.

*This multi-domain approach ensures you receive comprehensive, well-rounded advice that considers all relevant aspects of your situation.*`;
}

/**
 * Generate LLM response with fallback to static responses
 */
async function generateLLMResponse(expert: BoardExpert, question: string, domainId: string): Promise<string> {
  try {
    // Check if LLM integration is available and configured
    const llmLayer = LLMIntegrationLayer.getInstance();
    
    if (await llmLayer.isAvailable()) {
      // Create a persona-specific prompt for the LLM
      const prompt = createPersonaPrompt(expert, question, domainId);
      
      // Generate response using LLM with varied temperature for diversity
      const temperature = 0.8 + (Math.random() * 0.2); // 0.8-1.0 for more variety
      const llmResponse = await llmLayer.generateResponse(prompt, {
        temperature,
        maxTokens: 800,
        timeout: 15000
      });
      
      if (llmResponse && llmResponse.content) {
        console.log(`✅ Generated LLM response for ${expert.name}`);
        return llmResponse.content;
      }
    }
  } catch (error) {
    console.warn(`⚠️ LLM generation failed for ${expert.name}, using fallback:`, error);
  }
  
  // Fallback to static contextual responses
  return generateDomainSpecificInsight(expert, question, domainId);
}

/**
 * Create a persona-specific prompt for LLM generation
 */
function createPersonaPrompt(expert: BoardExpert, question: string, domainId: string): string {
  const expertRole = expert.role;
  const expertName = expert.name;
  const specialties = expert.specialties.join(', ');
  
  // Get board-specific lane restrictions
  const laneRestrictions = getBoardLaneRestrictions(domainId);
  
  // Get role-specific perspective and approach
  const roleSpecificGuidance = getRoleSpecificGuidance(expertRole, domainId);
  
  return `GLOBAL POLICIES (Multi-Board):
1) Stay in your lane: ${domainId} = ${laneRestrictions.allowedTopics}. Do not comment on other domains.
2) First line = direct verdict answering the user's question.
3) Max 5 bullets; each ≤ 12 words; avoid fluff.
4) If clinical/nutrition: add disclosure "educational, not medical advice."
5) Never use autobiographical intros like "As Dr. ...".
6) If question is outside your lane, say: "Out of scope for ${domainId}; refer to ${laneRestrictions.referTo}."

You are ${expertName}, a ${expertRole} with expertise in ${specialties}. 

Question: "${question}"

${roleSpecificGuidance}

Format your response as:
**Verdict:** [Direct 1-sentence answer]
**Assumptions:** [2-3 key assumptions, each ≤12 words]
**Guidance:** [3-5 actionable bullets, each ≤12 words]
${laneRestrictions.requiresDisclaimer ? '**Disclosure:** Educational content, not medical advice.' : ''}

Stay strictly within your domain expertise. Be concise and actionable.`;
}

/**
 * Get board-specific lane restrictions and allowed topics
 */
function getBoardLaneRestrictions(domainId: string): {
  allowedTopics: string;
  referTo: string;
  requiresDisclaimer: boolean;
} {
  const restrictions = {
    cliniboard: {
      allowedTopics: 'pathways, trial design, RBQM, eCTD, Part 11/GCP',
      referTo: 'product or wellness boards',
      requiresDisclaimer: true
    },
    remediboard: {
      allowedTopics: 'nutrition/TCM routines, safe habit protocols, herb–drug cautions',
      referTo: 'clinical board for FDA pathways',
      requiresDisclaimer: true
    },
    productboard: {
      allowedTopics: 'MVP scope, UX moments, metrics, GTM',
      referTo: 'clinical board for medical advice',
      requiresDisclaimer: false
    },
    eduboard: {
      allowedTopics: 'learning design, curriculum, pedagogy, educational technology',
      referTo: 'other specialized boards',
      requiresDisclaimer: false
    }
  };
  
  return restrictions[domainId as keyof typeof restrictions] || restrictions.productboard;
}

/**
 * Get role-specific guidance to ensure distinct perspectives
 */
function getRoleSpecificGuidance(expertRole: string, domainId: string): string {
  const roleLower = expertRole.toLowerCase();
  
  if (roleLower.includes('chief product officer') || roleLower.includes('cpo')) {
    return `As a Chief Product Officer, focus on:
- Strategic product vision and roadmap implications
- Cross-functional team coordination and resource allocation
- Market positioning and competitive differentiation
- Long-term business impact and scalability considerations
- Executive-level decision making and stakeholder management
- Product-market fit and go-to-market strategy

Your response should reflect C-level strategic thinking and focus on high-level product strategy rather than tactical implementation details.`;
  }
  
  if (roleLower.includes('head of design') || roleLower.includes('design director')) {
    return `As a Head of Design, focus on:
- User experience (UX) and user interface (UI) design principles
- Design systems, accessibility, and inclusive design practices
- User research methodologies and design validation
- Visual design, information architecture, and interaction design
- Design team processes and design-development collaboration
- Brand consistency and design quality standards

Your response should emphasize design thinking, user-centered approaches, and visual/experiential considerations that other roles might overlook.`;
  }
  
  if (roleLower.includes('head of growth') || roleLower.includes('growth marketing')) {
    return `As a Head of Growth Marketing, focus on:
- User acquisition strategies and conversion optimization
- Growth metrics, funnel analysis, and retention strategies
- Marketing channels, campaign optimization, and performance marketing
- A/B testing, growth experiments, and data-driven marketing
- Customer lifecycle management and engagement strategies
- Viral mechanics, referral programs, and organic growth

Your response should emphasize growth tactics, marketing strategies, and user acquisition approaches that drive measurable business growth.`;
  }
  
  if (roleLower.includes('senior product manager') || roleLower.includes('product manager')) {
    return `As a Senior Product Manager, focus on:
- Feature prioritization and product requirements definition
- User story creation and acceptance criteria
- Cross-functional coordination between engineering, design, and business
- Product analytics, user feedback analysis, and iteration planning
- Technical feasibility assessment and development planning
- Product launch strategies and success metrics

Your response should focus on tactical product management, feature-level decisions, and hands-on product development processes.`;
  }
  
  if (roleLower.includes('naturopathic') || roleLower.includes('naturopath')) {
    return `As a Naturopathic Physician, focus on:
- Natural healing modalities and evidence-based alternative medicine
- Root cause analysis and holistic health assessment
- Nutritional therapy, herbal medicine, and lifestyle interventions
- Patient education and empowerment for self-healing
- Integration with conventional medicine and safety considerations
- Individualized treatment protocols based on constitutional assessment

Your response should emphasize natural, holistic approaches while maintaining clinical rigor and safety awareness.`;
  }
  
  if (roleLower.includes('traditional chinese medicine') || roleLower.includes('tcm')) {
    return `As a Traditional Chinese Medicine practitioner, focus on:
- TCM diagnostic principles (pulse, tongue, constitutional assessment)
- Five Element theory, qi, and energetic balance concepts
- Herbal formulations, acupuncture points, and treatment protocols
- Dietary therapy based on TCM food energetics
- Seasonal considerations and lifestyle harmony
- Integration of ancient wisdom with modern understanding

Your response should reflect TCM philosophy, diagnostic approaches, and treatment modalities unique to Chinese medicine.`;
  }
  
  // Fallback for other roles
  return `As a ${expertRole}, provide advice that reflects your specific professional expertise and unique perspective. Focus on the aspects of this question that align most closely with your role and experience.`;
}

/**
 * Get domain-specific guidance for LLM prompts
 */
function getDomainSpecificPromptGuidance(domainId: string): string {
  switch (domainId) {
    case 'remediboard':
      return `Focus on natural, holistic health approaches while maintaining clinical safety and evidence-based practices.`;
      
    case 'cliniboard':
      return `Emphasize scientific rigor, regulatory compliance, and evidence-based clinical research methodologies.`;
      
    case 'eduboard':
      return `Apply pedagogical expertise and evidence-based educational strategies for effective learning outcomes.`;
      
    case 'productboard':
      return `Avoid generic "5 requirements" lists. Instead, provide specific, actionable insights from your unique professional perspective.`;
      
    default:
      return `Provide specific, actionable advice that reflects your unique professional expertise.`;
  }
}

/**
 * Generate a fallback response when the main service fails
 */
function generateFallbackResponse(expert: BoardExpert, question: string, domainId: string): string {
  // Generate contextual response based on the actual question
  return generateDomainSpecificInsight(expert, question, domainId);
}

/**
 * Get domain context for responses
 */
function getDomainContext(domainId: string): string {
  const contexts = {
    'cliniboard': 'Clinical Research',
    'eduboard': 'Educational',
    'remediboard': 'Wellness',
    'productboard': 'Product Development',
  };
  return contexts[domainId as keyof typeof contexts] || 'Advisory';
}

/**
 * Generate contextual, question-specific insights
 */
function generateDomainSpecificInsight(expert: BoardExpert, question: string, domainId: string): string {
  const questionLower = question.toLowerCase();
  
  // Generate contextual responses based on the actual question content
  switch (domainId) {
    case 'remediboard':
      return generateWellnessResponse(expert, question, questionLower);
    case 'cliniboard':
      return generateClinicalResponse(expert, question, questionLower);
    case 'eduboard':
      return generateEducationResponse(expert, question, questionLower);
    case 'productboard':
      return generateProductResponse(expert, question, questionLower);
    default:
      return generateGeneralResponse(expert, question, questionLower);
  }
}

/**
 * Generate wellness-specific contextual responses
 */
function generateWellnessResponse(expert: BoardExpert, question: string, questionLower: string): string {
  const expertName = expert.name;
  const expertRole = expert.role;
  
  // Diabetes and nutrition questions
  if (questionLower.includes('diabetic') || questionLower.includes('diabetes')) {
    if (questionLower.includes('millet') || questionLower.includes('rice')) {
      if (expertRole.includes('Naturopathic')) {
        return `As a naturopathic physician, I strongly recommend **millets over white rice** for diabetic patients. Here's my clinical perspective:

**Why Millets Are Superior:**
- **Glycemic Index**: Millets (35-55) vs White Rice (70+) - significantly better blood sugar control
- **Fiber Content**: 8-12g per cup vs rice's 0.6g - slows glucose absorption
- **Mineral Profile**: Rich in magnesium (supports insulin function) and chromium (glucose metabolism)
- **Protein**: Higher protein content helps stabilize blood sugar

**Specific Millet Recommendations:**
- **Finger Millet (Ragi)**: Highest calcium, excellent for diabetics
- **Pearl Millet (Bajra)**: High fiber, good for weight management
- **Foxtail Millet**: Lowest glycemic index among millets

**Clinical Protocol I Recommend:**
1. Start with 1/4 cup cooked millet, monitor blood glucose
2. Combine with protein (legumes) and healthy fats (nuts/seeds)
3. Soak millets 6-8 hours before cooking for better digestibility
4. Monitor HbA1c levels after 3 months of regular consumption

**Important**: Work with your healthcare team to adjust medications as your blood sugar improves with dietary changes.`;
      } else if (expertRole.includes('Traditional Chinese Medicine')) {
        return `From a Traditional Chinese Medicine perspective, **millets are more harmonious** for diabetic patients than white rice:

**TCM Analysis:**
- **White Rice**: Creates dampness and heat, disrupts spleen qi
- **Millets**: Neutral temperature, strengthens spleen and stomach qi
- **Energetic Properties**: Millets nourish kidney yin, essential for diabetes management

**Five Element Theory Application:**
Diabetes relates to kidney and spleen deficiency. Millets support both organ systems:
- **Kidney Support**: Black/dark millets nourish kidney essence
- **Spleen Harmony**: Easy digestion reduces metabolic burden

**TCM Dietary Therapy Recommendations:**
- Cook millets with goji berries and Chinese yam for kidney support
- Add small amounts of cinnamon bark to regulate qi and blood
- Consume warm, avoid cold preparations

**Pulse and Tongue Considerations:**
Monitor for improved spleen qi (stronger pulse, less tongue coating) as you transition to millets. The goal is balanced blood sugar through organ harmony, not just glycemic control.

**Holistic Approach**: Combine with appropriate herbs, acupuncture, and qigong for comprehensive diabetes management.`;
      }
    }
    
    // General diabetes advice for wellness experts
    return `As a ${expertRole}, I approach diabetes management holistically, focusing on root causes rather than just symptom management.

**Key Principles:**
- **Blood Sugar Stability**: Choose foods with low glycemic impact
- **Nutrient Density**: Prioritize foods that nourish and heal
- **Individual Constitution**: Tailor recommendations to your unique needs
- **Gradual Transition**: Sustainable changes for long-term success

**Dietary Foundation:**
Focus on whole, unprocessed foods that support metabolic health. Include plenty of fiber-rich vegetables, quality proteins, and healthy fats. Avoid refined sugars and processed carbohydrates.

**Lifestyle Integration:**
Combine dietary changes with stress management, regular movement, and adequate sleep. These factors significantly impact blood sugar regulation.

Would you like specific guidance on meal planning or other aspects of natural diabetes management?`;
  }
  
  // Herbal and natural remedy questions
  if (questionLower.includes('herb') || questionLower.includes('natural') || questionLower.includes('remedy')) {
    return `As a ${expertRole}, I focus on addressing root causes while supporting the body's natural healing mechanisms. Based on my clinical experience, I recommend a holistic approach that considers constitutional factors, lifestyle patterns, and individual sensitivities.

**Key Principles I Follow:**
- **Safety First**: Ensuring no contraindications with existing medications
- **Individualized Treatment**: What works for one person may not work for another
- **Gradual Implementation**: Allowing the body to adapt naturally
- **Evidence-Based Practice**: Combining traditional wisdom with modern research

**My Approach:**
I believe in empowering patients with knowledge while providing safe, effective natural therapies. Every recommendation is tailored to the individual's unique constitution and health goals.

I'd need more specific information about your health concerns to provide targeted recommendations. What particular area of health would you like to focus on?`;
  }

  // General wellness
  return `As a ${expertRole}, I believe in treating the whole person - mind, body, and spirit. My approach combines traditional wisdom with modern safety standards, always prioritizing natural healing processes while ensuring evidence-based practices.

**My Philosophy:**
True wellness comes from addressing root causes rather than just managing symptoms. I work with patients to identify underlying imbalances and support the body's innate healing capacity.

**Areas of Focus:**
- Constitutional assessment and individualized treatment
- Nutritional therapy and lifestyle optimization
- Stress management and mind-body connection
- Prevention-focused healthcare

I'd be happy to discuss specific wellness strategies tailored to your individual needs and health goals. What aspects of your health would you like to optimize?`;
}

/**
 * Generate clinical research contextual responses
 */
function generateClinicalResponse(expert: BoardExpert, question: string, questionLower: string): string {
  const expertName = expert.name;
  const expertRole = expert.role;
  
  // Diabetes-related clinical questions
  if (questionLower.includes('diabetic') || questionLower.includes('diabetes')) {
    if (questionLower.includes('millet') || questionLower.includes('rice')) {
      return `From a clinical research perspective, the evidence strongly supports **millets over white rice** for diabetic patients:

**Published Clinical Evidence:**
- **Glycemic Response Studies**: Multiple RCTs show 20-30% lower postprandial glucose with millets vs white rice
- **HbA1c Improvements**: 12-week studies demonstrate 0.5-0.8% reduction in HbA1c with millet consumption
- **Insulin Sensitivity**: Significant improvements in HOMA-IR scores with regular millet intake

**Regulatory Considerations:**
- FDA recognizes whole grains (including millets) as beneficial for diabetes management
- European Food Safety Authority (EFSA) approved health claims for millet fiber and blood glucose control
- Clinical guidelines from ADA and EASD support low-GI grain alternatives

**Study Design Recommendations:**
If conducting further research, I'd recommend:
- **Primary Endpoint**: Change in HbA1c at 12 weeks
- **Secondary Endpoints**: Postprandial glucose, insulin levels, lipid profile
- **Population**: Type 2 diabetics on stable medication regimens
- **Controls**: White rice as comparator, matched caloric intake

**Clinical Implementation:**
Based on current evidence, I recommend millets as first-line dietary intervention for diabetic patients, with appropriate monitoring and medication adjustments as needed.

**Safety Profile**: Excellent safety record with no significant adverse events reported in clinical trials.`;
    }
  }
  
  // General clinical trial questions
  if (questionLower.includes('trial') || questionLower.includes('study')) {
    return `As a ${expertRole}, this requires careful consideration of regulatory requirements, patient safety protocols, and statistical design. The key is ensuring we maintain scientific rigor while meeting FDA expectations.

**Critical Design Elements:**
- **Primary Endpoint Selection**: Must align with regulatory guidance and clinical meaningfulness
- **Patient Population**: Clearly defined inclusion/exclusion criteria for adequate power
- **Safety Monitoring**: Robust DSMB oversight with pre-specified stopping rules
- **Statistical Plan**: Appropriate sample size, interim analyses, and multiplicity adjustments

**Regulatory Strategy:**
Early FDA engagement through pre-IND or Type B meetings is essential. I recommend discussing:
- Study design and endpoints
- Regulatory pathway (505(b)(1) vs 505(b)(2))
- Post-market commitments

**Operational Excellence:**
Focus on site selection, patient recruitment strategies, and data quality to ensure study success and regulatory acceptance.`;
  }
  
  // General clinical development
  return `As a ${expertRole}, I approach clinical development with a focus on patient safety, regulatory compliance, and scientific validity. This requires a systematic approach that considers both efficacy and safety endpoints while maintaining the highest standards of clinical research integrity.

**Key Considerations:**
- **Patient-Centric Design**: Ensuring studies address real clinical needs
- **Regulatory Alignment**: Meeting FDA/EMA expectations from protocol design through submission
- **Risk Management**: Proactive identification and mitigation of study risks
- **Data Integrity**: Robust systems for accurate, reliable data collection

My experience has shown that early planning and stakeholder alignment are critical for successful clinical programs. What specific aspects of clinical development would you like to explore further?`;
}

/**
 * Generate education contextual responses
 */
function generateEducationResponse(expert: BoardExpert, question: string, questionLower: string): string {
  const expertName = expert.name;
  const expertRole = expert.role;
  
  // Nutrition education questions
  if (questionLower.includes('diabetic') || questionLower.includes('diabetes')) {
    if (questionLower.includes('millet') || questionLower.includes('rice')) {
      return `From a nutrition education perspective, this is an excellent teaching opportunity about **evidence-based dietary choices for diabetes management**:

**Learning Objectives for Patients:**
1. **Understand Glycemic Index**: How different grains affect blood sugar
2. **Apply Nutritional Knowledge**: Making informed food choices
3. **Develop Self-Management Skills**: Monitoring and adjusting diet based on outcomes

**Educational Content Framework:**
**Millets vs Rice Comparison:**
- **Visual Learning**: Glycemic index charts, fiber content comparisons
- **Hands-on Learning**: Cooking demonstrations, portion size training
- **Experiential Learning**: Blood glucose monitoring before/after meals

**Pedagogical Approach:**
- **Constructivist Learning**: Build on patients' existing food knowledge
- **Social Learning Theory**: Peer support groups and shared experiences
- **Adult Learning Principles**: Practical, immediately applicable information

**Assessment Methods:**
- **Formative**: Daily food logs and glucose tracking
- **Summative**: HbA1c improvements over 3-6 months
- **Self-Assessment**: Patient confidence in making healthy choices

**Differentiated Instruction:**
Adapt teaching methods for different learning styles, cultural backgrounds, and literacy levels. Use multiple modalities: visual aids, hands-on activities, and peer discussions.

**Technology Integration:**
Leverage apps for glucose tracking, meal planning tools, and virtual cooking classes to enhance learning outcomes.`;
    }
  }
  
  // Curriculum design questions
  if (questionLower.includes('curriculum') || questionLower.includes('learning')) {
    return `As a ${expertRole}, I approach curriculum design through evidence-based pedagogical frameworks that promote inclusive learning and measurable outcomes.

**Design Principles:**
- **Backward Design**: Start with desired learning outcomes and work backward
- **Universal Design for Learning (UDL)**: Multiple means of representation, engagement, and expression
- **Competency-Based Learning**: Focus on mastery rather than seat time
- **Authentic Assessment**: Real-world applications of knowledge and skills

**Implementation Strategy:**
- **Scaffolded Learning**: Progressive skill building with appropriate support
- **Active Learning**: Engagement through discussion, problem-solving, and collaboration
- **Formative Assessment**: Continuous feedback to guide instruction
- **Reflective Practice**: Encouraging metacognition and self-directed learning

**Technology Integration:**
Thoughtful use of educational technology to enhance, not replace, effective teaching practices. Focus on tools that support personalized learning and accessibility.`;
  }
  
  // General education
  return `As a ${expertRole}, I believe in creating inclusive, engaging learning environments that meet diverse student needs. My approach integrates evidence-based pedagogical practices with innovative teaching methods.

**Core Educational Philosophy:**
- **Student-Centered Learning**: Adapting instruction to individual needs and interests
- **Equity and Inclusion**: Ensuring all students have access to high-quality education
- **Critical Thinking**: Developing analytical and problem-solving skills
- **Lifelong Learning**: Fostering curiosity and self-directed learning habits

**Effective Teaching Strategies:**
Focus on active learning, collaborative projects, and authentic assessments that prepare students for real-world challenges. What specific educational challenge would you like to address?`;
}

/**
 * Generate product development contextual responses
 */
function generateProductResponse(expert: BoardExpert, question: string, questionLower: string): string {
  const expertName = expert.name;
  const expertRole = expert.role;
  
  // Health/nutrition app questions
  if (questionLower.includes('diabetic') || questionLower.includes('diabetes')) {
    if (questionLower.includes('millet') || questionLower.includes('rice')) {
      return `From a product development perspective, this presents an excellent opportunity for **data-driven nutrition recommendations**:

**Product Opportunity:**
A personalized nutrition app that helps diabetic users make informed grain choices based on real-time data and individual responses.

**User Research Insights:**
- **Pain Point**: Confusion about which foods are actually better for blood sugar
- **User Need**: Clear, personalized recommendations with scientific backing
- **Behavior**: Users want to track and see immediate impact of food choices

**Feature Recommendations:**
1. **Glycemic Impact Predictor**: ML model predicting blood sugar response to different grains
2. **Personalized Food Scoring**: Individual recommendations based on user's glucose patterns
3. **Educational Content**: Interactive comparisons (millet vs rice) with visual data
4. **Progress Tracking**: HbA1c trends correlated with dietary choices

**Technical Implementation:**
- **Data Sources**: Integrate with CGM devices, food databases, clinical research
- **ML Pipeline**: Personalization engine learning from user glucose responses
- **UX Design**: Simple, actionable recommendations with clear reasoning

**Success Metrics:**
- **Engagement**: Daily active users tracking meals
- **Health Outcomes**: Improved HbA1c in user cohorts
- **User Satisfaction**: NPS scores and retention rates

**Go-to-Market Strategy:**
Partner with diabetes educators and endocrinologists for credible recommendations. Focus on evidence-based approach to differentiate from generic nutrition apps.`;
    }
  }
  
  // Feature development questions
  if (questionLower.includes('feature') || questionLower.includes('user')) {
    return `As a ${expertRole}, I approach feature development through a user-centered, data-driven methodology that balances user needs with business objectives.

**Discovery Process:**
- **User Research**: Deep dive into user pain points and workflows
- **Technical Feasibility**: Architecture review and implementation complexity
- **Business Impact**: Revenue potential, user engagement, and strategic alignment
- **Competitive Analysis**: Market positioning and differentiation opportunities

**Development Framework:**
- **Jobs-to-be-Done**: Understanding the functional, emotional, and social jobs users hire our product for
- **Hypothesis-Driven Development**: Clear assumptions and success criteria
- **MVP Approach**: Minimum viable features for rapid learning and iteration
- **A/B Testing**: Data-driven optimization of user experience

**Success Measurement:**
Define clear metrics before development: user engagement, conversion rates, retention, and business KPIs. Continuous monitoring and iteration based on user feedback and data.`;
  }
  
  // General product development
  return `As a ${expertRole}, I focus on building products that create genuine value for users while achieving business objectives. My approach emphasizes rapid experimentation, data-driven decisions, and user-centered design.

**Product Philosophy:**
- **User-First Thinking**: Deep empathy for user needs and pain points
- **Data-Driven Decisions**: Metrics and user feedback guide product direction
- **Iterative Development**: Continuous improvement through rapid cycles
- **Cross-Functional Collaboration**: Alignment between design, engineering, and business

**Key Frameworks:**
Leverage proven methodologies like Design Thinking, Lean Startup, and Agile development to deliver successful products efficiently. What specific product challenge are you working on?`;
}

/**
 * Generate general advisory responses
 */
function generateGeneralResponse(expert: BoardExpert, question: string, questionLower: string): string {
  return `This requires a systematic approach that considers multiple stakeholder perspectives, potential risks and benefits, and measurable outcomes. Based on my expertise in ${expert.specialties.join(', ')}, the key is balancing different priorities while maintaining focus on the core objectives.

I'd recommend breaking this down into manageable components and addressing each systematically while keeping the bigger picture in mind.`;
}

/**
 * Generate a summary of multiple advisor responses
 */
export async function generateResponseSummary(
  responses: AdvisorResponse[],
  originalQuestion: string
): Promise<string> {
  if (responses.length === 0) {
    return 'No responses available to summarize.';
  }

  if (responses.length === 1) {
    return `**Single Expert Summary**\n\n${responses[0].persona.name} provided insights based on their expertise in ${responses[0].persona.expertise}.`;
  }

  // Extract key themes and insights
  const advisorNames = responses.map(r => r.persona.name);
  const expertiseAreas = responses.map(r => r.persona.expertise);
  
  let summary = `**Multi-Expert Advisory Summary**\n\n`;
  summary += `**Question:** ${originalQuestion}\n\n`;
  summary += `**Experts Consulted:** ${advisorNames.join(', ')}\n`;
  summary += `**Expertise Areas:** ${[...new Set(expertiseAreas)].join(', ')}\n\n`;
  
  summary += `**Key Insights:**\n`;
  responses.forEach((response, index) => {
    const firstSentence = response.content.split('.')[0] + '.';
    summary += `${index + 1}. **${response.persona.name}:** ${firstSentence}\n`;
  });
  
  summary += `\n**Recommendation:** Consider the diverse perspectives provided by each expert and look for areas of consensus while addressing any conflicting viewpoints through further discussion or research.`;
  
  return summary;
}
/**

 * Generate practical synthesis from multi-board responses
 */
export function makePanelSummary(responses: MultiDomainResponse[]): {
  sharedGround: string;
  keyTradeoff: string;
  immediateNext: string;
} {
  // Extract key themes from each board's responses
  const boardInsights = responses.map(response => ({
    boardId: response.boardId,
    boardName: response.boardName,
    toplines: response.responses.map(r => r.content.split('\n')[0]) // First line verdicts
  }));

  // Find common themes across boards
  const sharedThemes = findCommonThemes(boardInsights);
  
  // Identify key trade-offs between domains
  const tradeoffs = identifyTradeoffs(boardInsights);
  
  // Generate immediate actionable next step
  const nextStep = generateNextStep(boardInsights);

  return {
    sharedGround: sharedThemes,
    keyTradeoff: tradeoffs,
    immediateNext: nextStep
  };
}

function findCommonThemes(boardInsights: any[]): string {
  // Simple implementation - look for common keywords and concepts
  const commonKeywords = ['user', 'safety', 'compliance', 'evidence', 'testing', 'validation'];
  const mentionedKeywords = commonKeywords.filter(keyword => 
    boardInsights.some(board => 
      board.toplines.some((topline: string) => 
        topline.toLowerCase().includes(keyword)
      )
    )
  );
  
  if (mentionedKeywords.length > 0) {
    return `All boards emphasize ${mentionedKeywords.slice(0, 2).join(' and ')} as critical success factors.`;
  }
  
  return 'All boards agree on the importance of systematic, evidence-based approaches.';
}

function identifyTradeoffs(boardInsights: any[]): string {
  const boardNames = boardInsights.map(b => b.boardName);
  
  if (boardNames.includes('Clinical Research & Regulatory') && boardNames.includes('Product Development & Strategy')) {
    return 'Key trade-off: regulatory compliance speed vs product development velocity vs clinical rigor.';
  }
  
  if (boardNames.includes('Clinical Research & Regulatory') && boardNames.includes('Holistic Wellness & Natural Remedies')) {
    return 'Key trade-off: evidence-based medicine standards vs traditional healing approaches.';
  }
  
  return 'Key trade-off: balancing speed of implementation with thoroughness of validation.';
}

function generateNextStep(boardInsights: any[]): string {
  // Generate a concrete 7-day action based on the consultation
  const actions = [
    'Schedule stakeholder alignment meeting within 7 days to review multi-board recommendations.',
    'Create implementation timeline incorporating all board requirements within 1 week.',
    'Conduct feasibility assessment addressing each board\'s concerns by next Friday.',
    'Draft integrated approach document combining all board perspectives within 7 days.'
  ];
  
  return actions[Math.floor(Math.random() * actions.length)];
}