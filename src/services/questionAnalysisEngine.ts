import type { DomainId } from '../types/domain';

export interface QuestionAnalysis {
  type: 'product_ideation' | 'strategy' | 'technical' | 'general' | 'clinical' | 'educational' | 'remedial';
  keywords: string[];
  domain: DomainId | 'multi-domain';
  confidence: number;
  context?: QuestionContext;
  sentiment: 'positive' | 'neutral' | 'negative';
  complexity: 'low' | 'medium' | 'high';
  urgency: 'low' | 'medium' | 'high';
}

export interface QuestionContext {
  previousQuestions?: string[];
  sessionId?: string;
  userIntent?: string;
  relatedTopics?: string[];
  followUpIndicators?: string[];
}

export interface KeywordMatch {
  keyword: string;
  weight: number;
  category: string;
}

export class QuestionAnalysisEngine {
  private readonly domainKeywords: Record<DomainId, string[]> = {
    productboard: [
      'product', 'feature', 'roadmap', 'user', 'market', 'launch', 'mvp', 'prototype',
      'customer', 'feedback', 'analytics', 'metrics', 'kpi', 'growth', 'monetization',
      'pricing', 'competition', 'positioning', 'brand', 'marketing', 'sales'
    ],
    cliniboard: [
      'clinical', 'trial', 'patient', 'treatment', 'therapy', 'drug', 'medication',
      'diagnosis', 'symptom', 'disease', 'medical', 'healthcare', 'regulatory',
      'fda', 'approval', 'safety', 'efficacy', 'protocol', 'research', 'study'
    ],
    eduboard: [
      'education', 'learning', 'curriculum', 'student', 'teacher', 'course',
      'assessment', 'pedagogy', 'instruction', 'classroom', 'online', 'elearning',
      'training', 'skill', 'knowledge', 'academic', 'university', 'school'
    ],
    remediboard: [
      'natural', 'holistic', 'alternative', 'herbal', 'supplement', 'wellness',
      'nutrition', 'lifestyle', 'prevention', 'traditional', 'chinese', 'medicine',
      'acupuncture', 'naturopathic', 'homeopathic', 'organic', 'detox', 'healing'
    ]
  };

  private readonly questionTypeKeywords: Record<string, string[]> = {
    product_ideation: [
      'idea', 'concept', 'innovation', 'create', 'develop', 'design', 'build',
      'new', 'novel', 'unique', 'brainstorm', 'ideate', 'invent'
    ],
    strategy: [
      'strategy', 'plan', 'approach', 'framework', 'methodology', 'roadmap',
      'direction', 'goal', 'objective', 'vision', 'mission', 'competitive'
    ],
    technical: [
      'technical', 'implementation', 'architecture', 'system', 'technology',
      'code', 'software', 'hardware', 'integration', 'api', 'database'
    ],
    clinical: [
      'clinical', 'medical', 'patient', 'treatment', 'diagnosis', 'therapeutic',
      'protocol', 'trial', 'study', 'research', 'safety', 'efficacy'
    ],
    educational: [
      'educational', 'learning', 'teaching', 'curriculum', 'instruction',
      'assessment', 'pedagogy', 'academic', 'training', 'skill'
    ],
    remedial: [
      'remedial', 'alternative', 'natural', 'holistic', 'wellness', 'prevention',
      'lifestyle', 'nutrition', 'supplement', 'traditional'
    ],
    general: [
      'help', 'advice', 'guidance', 'recommendation', 'suggestion', 'opinion',
      'thoughts', 'perspective', 'insight', 'experience'
    ]
  };

  private readonly urgencyIndicators = [
    'urgent', 'asap', 'immediately', 'quickly', 'fast', 'emergency', 'critical',
    'deadline', 'time-sensitive', 'rush', 'priority', 'now'
  ];

  private readonly complexityIndicators = {
    high: [
      'complex', 'complicated', 'sophisticated', 'advanced', 'comprehensive',
      'detailed', 'in-depth', 'thorough', 'extensive', 'multi-faceted'
    ],
    low: [
      'simple', 'basic', 'easy', 'straightforward', 'quick', 'brief',
      'overview', 'summary', 'introduction', 'beginner'
    ]
  };

  private readonly sentimentWords = {
    positive: [
      'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic',
      'love', 'like', 'enjoy', 'excited', 'optimistic', 'confident'
    ],
    negative: [
      'bad', 'terrible', 'awful', 'hate', 'dislike', 'worried', 'concerned',
      'frustrated', 'disappointed', 'problem', 'issue', 'challenge'
    ]
  };

  private readonly followUpIndicators = [
    'also', 'additionally', 'furthermore', 'moreover', 'building on',
    'following up', 'related to', 'in addition', 'another question',
    'what about', 'how about', 'can you also'
  ];

  /**
   * Analyzes a user question and returns comprehensive analysis
   */
  public analyze(question: string, context?: QuestionContext): QuestionAnalysis {
    const normalizedQuestion = this.normalizeText(question);
    const keywords = this.extractKeywords(normalizedQuestion);
    const domain = this.identifyDomain(keywords, normalizedQuestion);
    const type = this.categorizeQuestion(keywords, normalizedQuestion);
    const confidence = this.calculateConfidence(keywords, domain, type);
    const sentiment = this.analyzeSentiment(normalizedQuestion);
    const complexity = this.analyzeComplexity(normalizedQuestion);
    const urgency = this.analyzeUrgency(normalizedQuestion);
    
    const enhancedContext = this.enhanceContext(normalizedQuestion, context);

    return {
      type,
      keywords,
      domain,
      confidence,
      context: enhancedContext,
      sentiment,
      complexity,
      urgency
    };
  }

  /**
   * Extracts relevant keywords from the question
   */
  public extractKeywords(question: string): string[] {
    if (!question.trim()) {
      return [];
    }

    const normalizedQuestion = this.normalizeText(question);
    const words = normalizedQuestion.split(/\s+/).filter(word => word.length > 0);
    const keywords: KeywordMatch[] = [];

    // Check domain keywords
    Object.entries(this.domainKeywords).forEach(([domain, domainWords]) => {
      domainWords.forEach(keyword => {
        if (normalizedQuestion.includes(keyword) && !this.isStopWord(keyword)) {
          keywords.push({
            keyword,
            weight: 2.0,
            category: domain
          });
        }
      });
    });

    // Check question type keywords
    Object.entries(this.questionTypeKeywords).forEach(([type, typeWords]) => {
      typeWords.forEach(keyword => {
        if (normalizedQuestion.includes(keyword) && !this.isStopWord(keyword)) {
          keywords.push({
            keyword,
            weight: 1.5,
            category: type
          });
        }
      });
    });

    // Extract important nouns and verbs (simplified NLP)
    const importantWords = words.filter(word => 
      word.length > 3 && 
      !this.isStopWord(word) &&
      !keywords.some(k => k.keyword === word)
    );

    importantWords.forEach(word => {
      keywords.push({
        keyword: word,
        weight: 1.0,
        category: 'general'
      });
    });

    // Sort by weight and return top keywords, filtering out stop words
    return keywords
      .filter(k => !this.isStopWord(k.keyword))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 10)
      .map(k => k.keyword);
  }

  /**
   * Categorizes the question type
   */
  public categorizeQuestion(keywords: string[], question: string): QuestionAnalysis['type'] {
    if (!question.trim()) {
      return 'general';
    }

    const scores: Record<string, number> = {};
    
    // Initialize scores
    Object.keys(this.questionTypeKeywords).forEach(type => {
      scores[type] = 0;
    });

    // Score based on keyword matches
    keywords.forEach(keyword => {
      Object.entries(this.questionTypeKeywords).forEach(([type, typeKeywords]) => {
        if (typeKeywords.includes(keyword)) {
          scores[type] += 2;
        }
      });
    });

    // Additional scoring based on question patterns
    if (question.includes('how to') || question.includes('implement')) {
      scores.technical += 3;
    }
    if (question.includes('strategy') || question.includes('approach')) {
      scores.strategy += 3;
    }
    if (question.includes('idea') || question.includes('create')) {
      scores.product_ideation += 3;
    }

    // Find the highest scoring type
    const maxScore = Math.max(...Object.values(scores));
    if (maxScore === 0) {
      return 'general';
    }
    
    const bestType = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0];

    return (bestType as QuestionAnalysis['type']) || 'general';
  }

  /**
   * Identifies the most relevant domain
   */
  public identifyDomain(keywords: string[], question: string): DomainId | 'multi-domain' {
    const domainScores: Record<DomainId, number> = {
      productboard: 0,
      cliniboard: 0,
      eduboard: 0,
      remediboard: 0
    };

    // Score based on keyword matches
    keywords.forEach(keyword => {
      Object.entries(this.domainKeywords).forEach(([domain, domainWords]) => {
        if (domainWords.includes(keyword)) {
          domainScores[domain as DomainId] += 2;
        }
      });
    });

    // Additional pattern-based scoring
    if (question.includes('product') || question.includes('business')) {
      domainScores.productboard += 3;
    }
    if (question.includes('medical') || question.includes('clinical')) {
      domainScores.cliniboard += 3;
    }
    if (question.includes('education') || question.includes('learning')) {
      domainScores.eduboard += 3;
    }
    if (question.includes('natural') || question.includes('alternative')) {
      domainScores.remediboard += 3;
    }

    const maxScore = Math.max(...Object.values(domainScores));
    const topDomains = Object.entries(domainScores)
      .filter(([_, score]) => score === maxScore && score > 0)
      .map(([domain, _]) => domain as DomainId);

    // Check for multi-domain indicators
    const domainsWithScore = Object.entries(domainScores)
      .filter(([_, score]) => score > 0);

    if (topDomains.length === 0) {
      return 'multi-domain';
    }
    if (topDomains.length > 1 || domainsWithScore.length > 1) {
      return 'multi-domain';
    }

    return topDomains[0];
  }

  /**
   * Calculates confidence score for the analysis
   */
  private calculateConfidence(
    keywords: string[], 
    domain: DomainId | 'multi-domain', 
    type: QuestionAnalysis['type']
  ): number {
    let confidence = 0.3; // Lower base confidence

    // Increase confidence based on keyword matches
    const keywordScore = Math.min(keywords.length * 0.08, 0.25);
    confidence += keywordScore;

    // Increase confidence if domain is clearly identified
    if (domain !== 'multi-domain') {
      confidence += 0.25;
    }

    // Increase confidence if question type is specific (not general)
    if (type !== 'general') {
      confidence += 0.2;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Analyzes sentiment of the question
   */
  private analyzeSentiment(question: string): 'positive' | 'neutral' | 'negative' {
    let positiveScore = 0;
    let negativeScore = 0;

    this.sentimentWords.positive.forEach(word => {
      if (question.includes(word)) positiveScore++;
    });

    this.sentimentWords.negative.forEach(word => {
      if (question.includes(word)) negativeScore++;
    });

    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
  }

  /**
   * Analyzes complexity level of the question
   */
  private analyzeComplexity(question: string): 'low' | 'medium' | 'high' {
    let complexityScore = 0;

    // Check for complexity indicators
    this.complexityIndicators.high.forEach(indicator => {
      if (question.includes(indicator)) complexityScore += 2;
    });

    this.complexityIndicators.low.forEach(indicator => {
      if (question.includes(indicator)) complexityScore -= 1;
    });

    // Consider question length - more aggressive scoring
    if (question.length > 300) complexityScore += 2;
    else if (question.length > 150) complexityScore += 1;
    if (question.length < 30) complexityScore -= 1;

    // Consider number of question marks (multiple questions)
    const questionMarks = (question.match(/\?/g) || []).length;
    if (questionMarks > 1) complexityScore += 1;

    // Consider word repetition (like "What What What...")
    const words = question.split(/\s+/);
    const repeatedWords = words.filter(word => 
      words.filter(w => w === word).length > 10
    );
    if (repeatedWords.length > 0) complexityScore += 1;

    if (complexityScore >= 2) return 'high';
    if (complexityScore <= -1) return 'low';
    return 'medium';
  }

  /**
   * Analyzes urgency level of the question
   */
  private analyzeUrgency(question: string): 'low' | 'medium' | 'high' {
    let urgencyScore = 0;

    this.urgencyIndicators.forEach(indicator => {
      if (question.toLowerCase().includes(indicator)) {
        urgencyScore += 2;
      }
    });

    // Check for exclamation marks
    const exclamations = (question.match(/!/g) || []).length;
    urgencyScore += exclamations;

    // Check for all caps words (urgency indicator)
    const allCapsWords = question.match(/\b[A-Z]{2,}\b/g) || [];
    urgencyScore += allCapsWords.length;

    if (urgencyScore >= 2) return 'high';
    if (urgencyScore >= 1) return 'medium';
    return 'low';
  }

  /**
   * Enhances context with follow-up detection and related topics
   */
  private enhanceContext(question: string, existingContext?: QuestionContext): QuestionContext {
    const context: QuestionContext = {
      ...existingContext,
      followUpIndicators: [],
      relatedTopics: []
    };

    // Detect follow-up indicators
    this.followUpIndicators.forEach(indicator => {
      if (question.toLowerCase().includes(indicator)) {
        context.followUpIndicators?.push(indicator);
      }
    });

    // Extract potential related topics (simplified)
    const words = this.normalizeText(question).split(/\s+/);
    const topics = words.filter(word => 
      word.length > 4 && 
      !this.isStopWord(word) &&
      !this.followUpIndicators.includes(word)
    );

    context.relatedTopics = topics.slice(0, 5);

    return context;
  }

  /**
   * Normalizes text for analysis
   */
  private normalizeText(text: string): string {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Checks if a word is a stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = [
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have',
      'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
      'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
      'what', 'where', 'when', 'why', 'how', 'who', 'which', 'whom'
    ];
    return stopWords.includes(word.toLowerCase());
  }
}

// Export singleton instance
export const questionAnalysisEngine = new QuestionAnalysisEngine();