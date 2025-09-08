/**
 * Enhanced Static Response Generator
 * 
 * Creates high-quality, persona-specific responses when LLM APIs are unavailable.
 * Analyzes question types and generates responses using advisor expertise and context.
 * 
 * Requirements: FR-3, FR-4
 */

import type { Advisor } from '../types/domain';
import { PERSONA_LIBRARY, type PersonaConfig } from './personaPromptService';

// Question type analysis interfaces
export interface QuestionAnalysis {
  type: 'product_ideation' | 'strategy' | 'technical' | 'general';
  keywords: string[];
  domain: string;
  confidence: number;
  context?: any;
}

export interface StaticResponseMetadata {
  responseType: 'static';
  processingTime: number;
  confidence: number;
  questionAnalysis: QuestionAnalysis;
  frameworks: string[];
}

export interface EnhancedStaticResponse {
  content: string;
  metadata: StaticResponseMetadata;
}

// Question type patterns for analysis
const QUESTION_TYPE_PATTERNS = {
  product_ideation: [
    /\b(idea|concept|innovation|create|build|develop|design|launch|new product)\b/i,
    /\b(brainstorm|ideate|conceptualize|prototype|mvp|minimum viable)\b/i,
    /\b(market opportunity|product opportunity|business idea)\b/i,
    /\b(what if|how about|could we|should we create)\b/i
  ],
  strategy: [
    /\b(strategy|strategic|plan|planning|roadmap|vision|mission)\b/i,
    /\b(competitive|market|business model|revenue|growth|scale)\b/i,
    /\b(positioning|differentiation|value proposition|go-to-market)\b/i,
    /\b(long.term|short.term|quarterly|annual|strategic planning)\b/i,
    /\b(approach|methodology|framework)\b/i,
    /\bgo.to.market\b/i,
    /\bcompetitor|competition\b/i,
    /\bmarket position|market share\b/i,
    /\bbusiness strategy\b/i
  ],
  technical: [
    /\b(technical|technology|architecture|system|platform|infrastructure)\b/i,
    /\b(api|database|server|cloud|security|performance|scalability)\b/i,
    /\b(code|programming|development|engineering|implementation)\b/i,
    /\b(integration|deployment|testing|debugging|optimization)\b/i
  ],
  general: [
    /\b(help|advice|guidance|recommendation|suggestion|opinion)\b/i,
    /\b(best practice|industry standard|benchmark|comparison)\b/i,
    /\b(process|workflow|methodology|framework|approach)\b/i
  ]
};

// Domain-specific keywords for context
const DOMAIN_KEYWORDS = {
  productboard: ['product', 'feature', 'user', 'customer', 'market', 'business', 'revenue', 'growth'],
  cliniboard: ['clinical', 'trial', 'patient', 'regulatory', 'fda', 'drug', 'therapy', 'medical'],
  eduboard: ['education', 'learning', 'student', 'curriculum', 'teaching', 'assessment', 'pedagogy'],
  remediboard: ['wellness', 'health', 'natural', 'holistic', 'healing', 'therapy', 'medicine', 'treatment']
};

// Professional frameworks by domain and question type
const PROFESSIONAL_FRAMEWORKS = {
  productboard: {
    product_ideation: ['Jobs-to-be-Done Framework', 'Design Thinking', 'Lean Startup Methodology'],
    strategy: ['North Star Framework', 'OKRs', 'Product-Market Fit Canvas', 'Platform Strategy Canvas'],
    technical: ['System Design Principles', 'API Design Best Practices', 'Scalability Patterns'],
    general: ['Product Management Framework', 'User-Centered Design', 'Agile Methodology']
  },
  cliniboard: {
    product_ideation: ['Target Product Profile', 'Regulatory Strategy Framework', 'Clinical Development Plan'],
    strategy: ['Clinical Development Plan', 'Drug Development Lifecycle', 'Regulatory Pathway Planning'],
    technical: ['ICH Guidelines', 'FDA Guidance Documents', 'Clinical Data Standards'],
    general: ['Clinical Research Best Practices', 'Regulatory Compliance Framework', 'Patient Safety Protocols']
  },
  eduboard: {
    product_ideation: ['Learning Experience Design', 'Educational Technology Framework', 'Backward Design'],
    strategy: ['Backward Design', 'Curriculum Mapping', 'Learning Analytics Strategy'],
    technical: ['Learning Management Systems', 'Educational AI Architecture', 'Adaptive Learning Technology'],
    general: ['Bloom\'s Taxonomy', 'Competency-Based Learning', 'Pedagogical Best Practices']
  },
  remediboard: {
    product_ideation: ['Integrative Medicine Model', 'Holistic Health Framework', 'Natural Healing Protocols'],
    strategy: ['Integrative Medicine Model', 'Wellness Program Design', 'Integrative Care Strategy'],
    technical: ['Traditional Medicine Principles', 'Evidence-Based Natural Therapies', 'Mind-Body Integration'],
    general: ['Integrative Medicine Model', 'Holistic Assessment Framework', 'Patient-Centered Care']
  }
};

export class EnhancedStaticResponseGenerator {
  /**
   * Generates enhanced static response for an advisor
   */
  async generateResponse(
    advisor: Advisor, 
    question: string, 
    domainId: string
  ): Promise<EnhancedStaticResponse> {
    const startTime = Date.now();
    
    // Analyze the question
    const analysis = this.analyzeQuestion(question, domainId);
    
    // Get persona configuration
    const persona = this.getPersonaConfig(advisor);
    
    // Generate response content
    const content = this.generateResponseContent(advisor, question, analysis, persona);
    
    // Get relevant frameworks
    const frameworks = this.getRelevantFrameworks(domainId, analysis.type);
    
    const processingTime = Math.max(1, Date.now() - startTime);
    
    return {
      content,
      metadata: {
        responseType: 'static',
        processingTime,
        confidence: analysis.confidence,
        questionAnalysis: analysis,
        frameworks
      }
    };
  }

  /**
   * Analyzes question type and extracts context
   */
  analyzeQuestion(question: string, domainId: string): QuestionAnalysis {
    const questionLower = question.toLowerCase();
    
    // Analyze question type with weighted scoring
    let bestMatch = 'general';
    let maxScore = 0;
    const typeScores: Record<string, number> = {};
    
    for (const [type, patterns] of Object.entries(QUESTION_TYPE_PATTERNS)) {
      let score = 0;
      for (const pattern of patterns) {
        if (pattern.test(question)) {
          score += 1;
        }
      }
      typeScores[type] = score;
      
      // Add bonus for exact keyword matches
      if (type === 'strategy' && /\b(strategy|strategic|go-to-market|positioning)\b/i.test(question)) {
        score += 0.5;
      }
      if (type === 'product_ideation' && /\b(idea|create|build|new product|innovation)\b/i.test(question)) {
        score += 0.5;
      }
      if (type === 'technical' && /\b(technical|architecture|system|implementation)\b/i.test(question)) {
        score += 0.5;
      }
      
      if (score > maxScore) {
        maxScore = score;
        bestMatch = type;
      }
    }
    
    // If no clear winner and multiple types have same score, prefer more specific types
    if (maxScore > 0) {
      const tiedTypes = Object.entries(typeScores).filter(([_, score]) => score === maxScore);
      if (tiedTypes.length > 1) {
        // Preference order: product_ideation > strategy > technical > general
        const preferenceOrder = ['product_ideation', 'strategy', 'technical', 'general'];
        for (const preferredType of preferenceOrder) {
          if (tiedTypes.some(([type]) => type === preferredType)) {
            bestMatch = preferredType;
            break;
          }
        }
      }
    }
    
    // Extract keywords
    const keywords = this.extractKeywords(question, domainId);
    
    // Calculate confidence based on pattern matches and keyword relevance
    const confidence = Math.min(0.9, (maxScore * 0.3) + (keywords.length * 0.1) + 0.4);
    
    return {
      type: bestMatch as QuestionAnalysis['type'],
      keywords,
      domain: domainId,
      confidence,
      context: {
        questionLength: question.length,
        hasQuestionMark: question.includes('?'),
        wordCount: question.split(' ').length
      }
    };
  }

  /**
   * Extracts relevant keywords from question
   */
  extractKeywords(question: string, domainId: string): string[] {
    const questionWords = question.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    const domainKeywords = DOMAIN_KEYWORDS[domainId as keyof typeof DOMAIN_KEYWORDS] || [];
    
    // Find intersection of question words and domain keywords
    const relevantKeywords = questionWords.filter(word => 
      domainKeywords.some(keyword => 
        word.includes(keyword) || keyword.includes(word)
      )
    );
    
    // Add general business/technical keywords
    const generalKeywords = questionWords.filter(word => 
      ['strategy', 'process', 'system', 'approach', 'method', 'solution', 'problem', 'challenge', 'opportunity'].includes(word)
    );
    
    return [...new Set([...relevantKeywords, ...generalKeywords])].slice(0, 5);
  }

  /**
   * Gets persona configuration for advisor
   */
  getPersonaConfig(advisor: Advisor): PersonaConfig | null {
    // Try to find persona by advisor ID or name
    const personaKey = advisor.id || advisor.name.toLowerCase().replace(/\s+/g, '-');
    return PERSONA_LIBRARY[personaKey] || null;
  }

  /**
   * Generates response content using persona and question analysis
   */
  generateResponseContent(
    advisor: Advisor, 
    question: string, 
    analysis: QuestionAnalysis, 
    persona: PersonaConfig | null
  ): string {
    const questionType = analysis.type;
    
    // Use persona template if available
    if (persona && persona.responseTemplates[questionType]) {
      const template = persona.responseTemplates[questionType];
      const personalizedResponse = this.generatePersonalizedResponse(
        template, question, analysis, persona, advisor
      );
      return personalizedResponse;
    }
    
    // Fallback to generic but professional response
    return this.generateGenericResponse(advisor, question, analysis);
  }

  /**
   * Generates personalized response using persona template
   */
  generatePersonalizedResponse(
    template: string, 
    question: string, 
    analysis: QuestionAnalysis, 
    persona: PersonaConfig,
    advisor: Advisor
  ): string {
    const frameworks = persona.frameworks.slice(0, 2).join(' and ');
    const expertise = persona.expertiseAreas.slice(0, 3).join(', ');
    
    let response = template;
    
    // Add specific insights based on question type
    const insights = this.generateSpecificInsights(analysis, persona, advisor);
    const actionableSteps = this.generateActionableSteps(analysis, persona);
    
    response += `\n\n${insights}`;
    response += `\n\n**Recommended Approach:**\n${actionableSteps}`;
    
    // Add relevant frameworks
    if (frameworks) {
      response += `\n\n**Relevant Frameworks:** ${frameworks}`;
    }
    
    // Add expertise context
    response += `\n\n*Drawing from my expertise in ${expertise}, this approach balances ${persona.responseStyle.toLowerCase()}.*`;
    
    return response;
  }

  /**
   * Generates specific insights based on question analysis and persona
   */
  generateSpecificInsights(
    analysis: QuestionAnalysis, 
    persona: PersonaConfig,
    advisor: Advisor
  ): string {
    const { type, keywords } = analysis;
    
    switch (type) {
      case 'product_ideation':
        return `**Key Insights for Product Ideation:**\n• Focus on user problems and market validation\n• Consider scalability and technical feasibility early\n• Validate assumptions through rapid prototyping\n• Align with business objectives and success metrics`;
        
      case 'strategy':
        return `**Strategic Considerations:**\n• Analyze competitive landscape and market positioning\n• Define clear success metrics and KPIs\n• Consider resource allocation and timeline constraints\n• Plan for risk mitigation and contingency scenarios`;
        
      case 'technical':
        return `**Technical Implementation Insights:**\n• Prioritize scalability and maintainability\n• Consider security and compliance requirements\n• Plan for monitoring and observability\n• Design for failure and recovery scenarios`;
        
      case 'general':
      default:
        return `**Professional Insights:**\n• Apply industry best practices and proven methodologies\n• Consider stakeholder impact and change management\n• Focus on measurable outcomes and continuous improvement\n• Balance short-term needs with long-term vision`;
    }
  }

  /**
   * Generates actionable steps based on analysis and persona
   */
  generateActionableSteps(analysis: QuestionAnalysis, persona: PersonaConfig): string {
    const steps = [
      "1. **Assessment Phase:** Analyze current state and define clear objectives",
      "2. **Planning Phase:** Develop detailed strategy with timeline and resources",
      "3. **Execution Phase:** Implement with regular checkpoints and feedback loops",
      "4. **Evaluation Phase:** Measure results and iterate based on learnings"
    ];
    
    // Customize steps based on question type
    switch (analysis.type) {
      case 'product_ideation':
        steps[0] = "1. **Discovery Phase:** Research user needs and market opportunities";
        steps[1] = "2. **Ideation Phase:** Generate and validate concepts through prototyping";
        steps[2] = "3. **Development Phase:** Build MVP with user feedback integration";
        steps[3] = "4. **Launch Phase:** Execute go-to-market strategy with success metrics";
        break;
        
      case 'strategy':
        steps[0] = "1. **Analysis Phase:** Conduct thorough market and competitive analysis";
        steps[1] = "2. **Strategy Phase:** Define vision, objectives, and strategic initiatives";
        steps[2] = "3. **Implementation Phase:** Execute with clear accountability and milestones";
        steps[3] = "4. **Review Phase:** Monitor progress and adjust strategy as needed";
        break;
        
      case 'technical':
        steps[0] = "1. **Requirements Phase:** Define technical specifications and constraints";
        steps[1] = "2. **Design Phase:** Create architecture and implementation plan";
        steps[2] = "3. **Development Phase:** Build with testing and quality assurance";
        steps[3] = "4. **Deployment Phase:** Launch with monitoring and support systems";
        break;
    }
    
    return steps.join('\n');
  }

  /**
   * Generates generic but professional response
   */
  generateGenericResponse(
    advisor: Advisor, 
    question: string, 
    analysis: QuestionAnalysis
  ): string {
    const expertise = advisor.expertise || 'professional expertise';
    const background = advisor.background || 'extensive experience';
    
    let response = `Based on my ${background} and ${expertise}, here's my perspective on your question:\n\n`;
    
    // Add type-specific generic insights
    const insights = this.generateSpecificInsights(analysis, {
      frameworks: [],
      expertiseAreas: [expertise],
      responseStyle: 'professional and analytical'
    } as PersonaConfig, advisor);
    
    response += insights;
    
    // Add generic actionable steps
    const actionableSteps = this.generateActionableSteps(analysis, {
      frameworks: []
    } as PersonaConfig);
    
    response += `\n\n**Recommended Approach:**\n${actionableSteps}`;
    
    // Add closing with advisor context
    response += `\n\n*This recommendation draws from ${expertise} and focuses on practical, implementable solutions.*`;
    
    return response;
  }

  /**
   * Gets relevant frameworks for domain and question type
   */
  getRelevantFrameworks(domainId: string, questionType: string): string[] {
    const domainFrameworks = PROFESSIONAL_FRAMEWORKS[domainId as keyof typeof PROFESSIONAL_FRAMEWORKS];
    if (!domainFrameworks) return [];
    
    return domainFrameworks[questionType as keyof typeof domainFrameworks] || [];
  }

  /**
   * Categorizes question for better response targeting
   */
  categorizeQuestion(question: string): string {
    const analysis = this.analyzeQuestion(question, 'general');
    return analysis.type;
  }
}

// Export singleton instance
export const enhancedStaticResponseGenerator = new EnhancedStaticResponseGenerator();