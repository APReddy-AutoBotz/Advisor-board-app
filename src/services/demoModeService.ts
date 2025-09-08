/**
 * Demo Mode Service
 * 
 * Provides enhanced logging, response metadata, and demo-specific features
 * for hackathon demonstration. Ensures impressive responses work without API keys.
 * 
 * Requirements: FR-5
 */

import type { Advisor } from '../types/domain';
import { enhancedStaticResponseGenerator, type EnhancedStaticResponse } from './enhancedStaticResponseGenerator';
import { DEMO_QUESTIONS, type DemoQuestion } from '../data/demoQuestions';

export interface DemoMetrics {
  responseTime: number;
  advisorCount: number;
  questionComplexity: 'low' | 'medium' | 'high';
  personaAccuracy: number;
  technicalDepth: number;
  businessRelevance: number;
  overallQuality: number;
}

export interface DemoResponse {
  advisorId: string;
  content: string;
  metadata: {
    responseType: 'demo_static' | 'demo_llm';
    processingTime: number;
    confidence: number;
    personaAccuracy: number;
    technicalDepth: number;
    businessRelevance: number;
    frameworks: string[];
    demoNotes?: string;
  };
  demoInsights: {
    showcasesExpertise: string[];
    keyDifferentiators: string[];
    industryCredentials: string[];
  };
}

export interface DemoSession {
  sessionId: string;
  startTime: Date;
  question: string;
  domain: string;
  advisors: Advisor[];
  responses: DemoResponse[];
  metrics: DemoMetrics;
  demoNotes: string[];
  performanceLog: string[];
}

class DemoModeService {
  private isDemoMode: boolean = false;
  private currentSession: DemoSession | null = null;
  private performanceLog: string[] = [];

  /**
   * Enable demo mode with enhanced logging
   */
  enableDemoMode(): void {
    this.isDemoMode = true;
    this.performanceLog = [];
    this.log('🎬 Demo mode enabled - Enhanced logging and metrics active');
  }

  /**
   * Disable demo mode
   */
  disableDemoMode(): void {
    this.isDemoMode = false;
    this.currentSession = null;
    this.performanceLog = [];
    this.log('Demo mode disabled');
  }

  /**
   * Check if demo mode is active
   */
  isDemoModeActive(): boolean {
    return this.isDemoMode;
  }

  /**
   * Start a new demo session
   */
  startDemoSession(question: string, domain: string, advisors: Advisor[]): string {
    const sessionId = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.currentSession = {
      sessionId,
      startTime: new Date(),
      question,
      domain,
      advisors,
      responses: [],
      metrics: {
        responseTime: 0,
        advisorCount: advisors.length,
        questionComplexity: this.analyzeQuestionComplexity(question),
        personaAccuracy: 0,
        technicalDepth: 0,
        businessRelevance: 0,
        overallQuality: 0
      },
      demoNotes: [],
      performanceLog: []
    };

    this.log(`🚀 Demo session started: ${sessionId}`);
    this.log(`📝 Question: "${question}"`);
    this.log(`🏢 Domain: ${domain}`);
    this.log(`👥 Advisors: ${advisors.map(a => a.name).join(', ')}`);

    return sessionId;
  }

  /**
   * Generate enhanced demo response for advisor
   */
  async generateDemoResponse(advisor: Advisor, question: string, domainId: string): Promise<DemoResponse> {
    const startTime = Date.now();
    
    this.log(`🤖 Generating demo response for ${advisor.name} (${advisor.role})`);

    // Generate enhanced static response
    const staticResponse = await enhancedStaticResponseGenerator.generateResponse(advisor, question, domainId);
    
    // Enhance response with demo-specific metadata
    const demoResponse = this.enhanceDemoResponse(advisor, staticResponse, question, domainId);
    
    const processingTime = Date.now() - startTime;
    demoResponse.metadata.processingTime = processingTime;

    this.log(`✅ Response generated in ${processingTime}ms`);
    this.log(`📊 Quality metrics: Persona=${demoResponse.metadata.personaAccuracy}, Technical=${demoResponse.metadata.technicalDepth}, Business=${demoResponse.metadata.businessRelevance}`);

    // Add to current session if active
    if (this.currentSession) {
      this.currentSession.responses.push(demoResponse);
    }

    return demoResponse;
  }

  /**
   * Enhance static response with demo-specific metadata and insights
   */
  private enhanceDemoResponse(
    advisor: Advisor, 
    staticResponse: EnhancedStaticResponse, 
    question: string,
    domainId: string
  ): DemoResponse {
    // Calculate demo-specific quality metrics
    const personaAccuracy = this.calculatePersonaAccuracy(advisor, staticResponse.content);
    const technicalDepth = this.calculateTechnicalDepth(staticResponse.content, staticResponse.metadata.questionAnalysis.type);
    const businessRelevance = this.calculateBusinessRelevance(staticResponse.content, domainId);

    // Get demo insights for this advisor
    const demoInsights = this.generateDemoInsights(advisor, question, domainId);

    // Find matching demo question for additional context
    const matchingDemoQuestion = DEMO_QUESTIONS.find(dq => 
      dq.domain === domainId && dq.showcasesAdvisors.includes(advisor.id || advisor.name.toLowerCase().replace(/\s+/g, '-'))
    );

    return {
      advisorId: advisor.id || advisor.name,
      content: staticResponse.content,
      metadata: {
        responseType: 'demo_static',
        processingTime: staticResponse.metadata.processingTime,
        confidence: staticResponse.metadata.confidence,
        personaAccuracy,
        technicalDepth,
        businessRelevance,
        frameworks: staticResponse.metadata.frameworks,
        demoNotes: matchingDemoQuestion?.demoNotes
      },
      demoInsights
    };
  }

  /**
   * Calculate persona accuracy score based on response content
   */
  private calculatePersonaAccuracy(advisor: Advisor, content: string): number {
    let score = 0.7; // Base score

    // Check for role-specific language
    const roleKeywords = {
      'Chief Product Officer': ['strategy', 'product-market fit', 'scaling', 'revenue', 'business'],
      'Senior Product Manager': ['user research', 'roadmap', 'features', 'analytics', 'testing'],
      'Head of Design': ['user experience', 'design system', 'accessibility', 'visual', 'interface'],
      'VP of Engineering': ['architecture', 'scalability', 'technical', 'infrastructure', 'systems'],
      'Head of Growth Marketing': ['acquisition', 'viral', 'growth', 'metrics', 'conversion'],
      'Head of Data Science': ['analytics', 'machine learning', 'data', 'metrics', 'insights'],
      'Clinical Research Strategy': ['clinical', 'FDA', 'regulatory', 'trials', 'approval'],
      'Regulatory Affairs Director': ['compliance', 'submission', 'regulatory', 'FDA', 'guidelines'],
      'Curriculum Design Expert': ['learning', 'curriculum', 'pedagogy', 'education', 'students'],
      'EdTech Innovation Lead': ['technology', 'platform', 'learning systems', 'AI', 'personalized'],
      'Naturopathic Medicine': ['natural', 'holistic', 'functional', 'integrative', 'wellness'],
      'Traditional Chinese Medicine': ['TCM', 'acupuncture', 'balance', 'energy', 'herbs']
    };

    const keywords = roleKeywords[advisor.role as keyof typeof roleKeywords] || [];
    const contentLower = content.toLowerCase();
    
    keywords.forEach(keyword => {
      if (contentLower.includes(keyword.toLowerCase())) {
        score += 0.05;
      }
    });

    // Check for specific company/experience mentions
    const experienceKeywords = ['stripe', 'google', 'airbnb', 'netflix', 'spotify', 'linkedin', 'pfizer', 'fda', 'stanford', 'khan academy'];
    experienceKeywords.forEach(keyword => {
      if (contentLower.includes(keyword)) {
        score += 0.03;
      }
    });

    return Math.min(0.95, score);
  }

  /**
   * Calculate technical depth score
   */
  private calculateTechnicalDepth(content: string, questionType: string): number {
    let score = 0.6; // Base score

    const technicalTerms = [
      'architecture', 'scalability', 'microservices', 'api', 'database', 'infrastructure',
      'system design', 'performance', 'security', 'monitoring', 'deployment', 'cloud',
      'machine learning', 'algorithms', 'data pipeline', 'analytics', 'framework'
    ];

    const contentLower = content.toLowerCase();
    technicalTerms.forEach(term => {
      if (contentLower.includes(term)) {
        score += 0.03;
      }
    });

    // Bonus for technical question types
    if (questionType === 'technical') {
      score += 0.1;
    }

    return Math.min(0.95, score);
  }

  /**
   * Calculate business relevance score
   */
  private calculateBusinessRelevance(content: string, domainId: string): number {
    let score = 0.7; // Base score

    const businessTerms = [
      'strategy', 'revenue', 'growth', 'market', 'competitive', 'roi', 'kpi',
      'business model', 'value proposition', 'customer', 'user', 'stakeholder',
      'objectives', 'outcomes', 'success metrics', 'implementation', 'execution'
    ];

    const contentLower = content.toLowerCase();
    businessTerms.forEach(term => {
      if (contentLower.includes(term)) {
        score += 0.02;
      }
    });

    // Domain-specific relevance
    const domainTerms = {
      productboard: ['product', 'feature', 'user', 'market'],
      cliniboard: ['clinical', 'patient', 'regulatory', 'trial'],
      eduboard: ['learning', 'student', 'education', 'curriculum'],
      remediboard: ['wellness', 'health', 'healing', 'therapy']
    };

    const terms = domainTerms[domainId as keyof typeof domainTerms] || [];
    terms.forEach(term => {
      if (contentLower.includes(term)) {
        score += 0.03;
      }
    });

    return Math.min(0.95, score);
  }

  /**
   * Generate demo insights for advisor
   */
  private generateDemoInsights(advisor: Advisor, question: string, domainId: string): DemoResponse['demoInsights'] {
    const showcasesExpertise = this.getAdvisorExpertiseShowcase(advisor);
    const keyDifferentiators = this.getAdvisorDifferentiators(advisor);
    const industryCredentials = this.getIndustryCredentials(advisor);

    return {
      showcasesExpertise,
      keyDifferentiators,
      industryCredentials
    };
  }

  /**
   * Get advisor expertise showcase points
   */
  private getAdvisorExpertiseShowcase(advisor: Advisor): string[] {
    const showcaseMap: Record<string, string[]> = {
      'sarah-kim': [
        'Stripe CPO experience scaling $1M to $1B ARR',
        'Platform strategy and payment systems expertise',
        'Hypergrowth product leadership'
      ],
      'marcus-chen': [
        'Google Senior PM with 100M+ user products',
        'Consumer product development at scale',
        'A/B testing and user research methodology'
      ],
      'elena-rodriguez': [
        'Airbnb Design Language System creation',
        'Design leadership for 150M+ users',
        'Systematic approach to design at scale'
      ],
      'alex-thompson': [
        'Netflix VP Engineering for 200M+ concurrent users',
        'Global streaming infrastructure expertise',
        'Engineering leadership and technical strategy'
      ],
      'sarah-chen': [
        'Pfizer VP Clinical Development experience',
        '50+ Phase III trials to FDA approval',
        'Global regulatory strategy expertise'
      ],
      'michael-rodriguez': [
        'Former FDA CDER Director insider knowledge',
        '100+ NDA submission reviews',
        'Regulatory compliance and submission strategy'
      ]
    };

    return showcaseMap[advisor.id || ''] || [
      `${advisor.role} expertise`,
      'Industry best practices',
      'Professional frameworks and methodologies'
    ];
  }

  /**
   * Get advisor key differentiators
   */
  private getAdvisorDifferentiators(advisor: Advisor): string[] {
    return [
      'Real-world experience at scale',
      'Proven track record with measurable results',
      'Industry-specific frameworks and methodologies',
      'Strategic thinking combined with practical execution'
    ];
  }

  /**
   * Get industry credentials
   */
  private getIndustryCredentials(advisor: Advisor): string[] {
    const credentialsMap: Record<string, string[]> = {
      'sarah-kim': ['Former Stripe CPO', 'Stanford MBA', '$95B company experience'],
      'marcus-chen': ['Google Senior PM', 'MS Computer Science', '8 years at Google'],
      'elena-rodriguez': ['Former Airbnb Design Director', 'MFA Design', 'Design Language System creator'],
      'alex-thompson': ['Former Netflix VP Engineering', 'MS Computer Science', 'Global streaming infrastructure'],
      'sarah-chen': ['Former Pfizer VP', 'MD, PhD', 'FDA Advisory Committee Member'],
      'michael-rodriguez': ['Former FDA CDER Director', 'PharmD, JD', '100+ NDA reviews']
    };

    return credentialsMap[advisor.id || ''] || [
      advisor.role,
      'Industry expertise',
      'Professional credentials'
    ];
  }

  /**
   * Analyze question complexity
   */
  private analyzeQuestionComplexity(question: string): 'low' | 'medium' | 'high' {
    const wordCount = question.split(' ').length;
    const technicalTerms = ['architecture', 'system', 'technical', 'implementation', 'strategy', 'framework'];
    const technicalCount = technicalTerms.filter(term => 
      question.toLowerCase().includes(term)
    ).length;

    if (wordCount > 20 || technicalCount > 2) return 'high';
    if (wordCount > 10 || technicalCount > 0) return 'medium';
    return 'low';
  }

  /**
   * Complete demo session and calculate final metrics
   */
  completeDemoSession(): DemoSession | null {
    if (!this.currentSession) return null;

    const session = this.currentSession;
    
    // Calculate final metrics
    session.metrics.responseTime = Date.now() - session.startTime.getTime();
    session.metrics.personaAccuracy = this.calculateAverageMetric(session.responses, 'personaAccuracy');
    session.metrics.technicalDepth = this.calculateAverageMetric(session.responses, 'technicalDepth');
    session.metrics.businessRelevance = this.calculateAverageMetric(session.responses, 'businessRelevance');
    session.metrics.overallQuality = (
      session.metrics.personaAccuracy + 
      session.metrics.technicalDepth + 
      session.metrics.businessRelevance
    ) / 3;

    session.performanceLog = [...this.performanceLog];

    this.log(`🏁 Demo session completed: ${session.sessionId}`);
    this.log(`📊 Final metrics: Quality=${session.metrics.overallQuality.toFixed(2)}, Time=${session.metrics.responseTime}ms`);

    const completedSession = { ...session };
    this.currentSession = null;
    
    return completedSession;
  }

  /**
   * Calculate average metric across responses
   */
  private calculateAverageMetric(responses: DemoResponse[], metric: keyof DemoResponse['metadata']): number {
    if (responses.length === 0) return 0;
    
    const sum = responses.reduce((acc, response) => {
      const value = response.metadata[metric];
      return acc + (typeof value === 'number' ? value : 0);
    }, 0);
    
    return sum / responses.length;
  }

  /**
   * Get current session
   */
  getCurrentSession(): DemoSession | null {
    return this.currentSession;
  }

  /**
   * Get performance log
   */
  getPerformanceLog(): string[] {
    return [...this.performanceLog];
  }

  /**
   * Log demo events
   */
  private log(message: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    
    this.performanceLog.push(logEntry);
    
    if (this.isDemoMode) {
      console.log(`🎬 DEMO: ${logEntry}`);
    }
  }

  /**
   * Get demo statistics
   */
  getDemoStatistics(): {
    totalSessions: number;
    averageResponseTime: number;
    averageQuality: number;
    topPerformingAdvisors: string[];
  } {
    // This would typically come from stored session data
    // For demo purposes, return mock statistics
    return {
      totalSessions: 1,
      averageResponseTime: 150,
      averageQuality: 0.87,
      topPerformingAdvisors: ['sarah-kim', 'alex-thompson', 'sarah-chen']
    };
  }
}

// Export singleton instance
export const demoModeService = new DemoModeService();