import { describe, it, expect, beforeEach } from 'vitest';
import { QuestionAnalysisEngine, QuestionAnalysis } from '../questionAnalysisEngine';

describe('QuestionAnalysisEngine', () => {
  let engine: QuestionAnalysisEngine;

  beforeEach(() => {
    engine = new QuestionAnalysisEngine();
  });

  describe('analyze', () => {
    it('should analyze a product strategy question correctly', () => {
      const question = "What's the best product strategy for launching a new mobile app in the competitive market?";
      const result = engine.analyze(question);

      expect(result.type).toBe('strategy');
      expect(result.domain).toBe('productboard');
      expect(result.keywords).toContain('product');
      expect(result.keywords).toContain('strategy');
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.complexity).toBe('medium');
    });

    it('should analyze a clinical research question correctly', () => {
      const question = "How should we design a clinical trial protocol for testing a new drug therapy?";
      const result = engine.analyze(question);

      expect(result.type).toBe('clinical');
      expect(result.domain).toBe('cliniboard');
      expect(result.keywords).toContain('clinical');
      expect(result.keywords).toContain('trial');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should analyze an educational curriculum question correctly', () => {
      const question = "What's the best approach to design an online learning curriculum for adult students?";
      const result = engine.analyze(question);

      expect(result.type).toBe('educational');
      expect(result.domain).toBe('eduboard');
      expect(result.keywords).toContain('learning');
      expect(result.keywords).toContain('curriculum');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should analyze a natural medicine question correctly', () => {
      const question = "What natural remedies and holistic approaches work best for stress management?";
      const result = engine.analyze(question);

      expect(result.type).toBe('remedial');
      expect(result.domain).toBe('remediboard');
      expect(result.keywords).toContain('natural');
      expect(result.keywords).toContain('holistic');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should identify multi-domain questions', () => {
      const question = "How can we integrate medical education with product development?";
      const result = engine.analyze(question);

      expect(result.domain).toBe('multi-domain');
      expect(result.keywords).toContain('medical');
      expect(result.keywords).toContain('education');
      expect(result.keywords).toContain('product');
    });

    it('should handle technical questions', () => {
      const question = "How do we implement a scalable API architecture for our healthcare system?";
      const result = engine.analyze(question);

      expect(result.type).toBe('technical');
      expect(result.keywords).toContain('implement');
      expect(result.keywords).toContain('api');
      expect(result.keywords).toContain('architecture');
    });

    it('should detect urgency indicators', () => {
      const question = "URGENT: We need immediate help with our product launch strategy!";
      const result = engine.analyze(question);

      expect(result.urgency).toBe('high');
      expect(result.sentiment).toBe('neutral'); // Despite urgency, not necessarily negative
    });

    it('should analyze complexity correctly', () => {
      const complexQuestion = "We need a comprehensive, sophisticated, and detailed analysis of our multi-faceted product strategy that covers market positioning, competitive analysis, user research, technical architecture, and long-term roadmap planning.";
      const simpleQuestion = "What's a quick overview of product basics?";

      const complexResult = engine.analyze(complexQuestion);
      const simpleResult = engine.analyze(simpleQuestion);

      expect(complexResult.complexity).toBe('high');
      expect(simpleResult.complexity).toBe('low');
    });

    it('should detect sentiment correctly', () => {
      const positiveQuestion = "I love this product idea! What's the best way to make it amazing?";
      const negativeQuestion = "I hate this problem we're facing. What terrible options do we have?";
      const neutralQuestion = "What are the options for product development?";

      const positiveResult = engine.analyze(positiveQuestion);
      const negativeResult = engine.analyze(negativeQuestion);
      const neutralResult = engine.analyze(neutralQuestion);

      expect(positiveResult.sentiment).toBe('positive');
      expect(negativeResult.sentiment).toBe('negative');
      expect(neutralResult.sentiment).toBe('neutral');
    });
  });

  describe('extractKeywords', () => {
    it('should extract relevant keywords from product questions', () => {
      const question = "What product features should we prioritize for our mobile app launch?";
      const keywords = engine.extractKeywords(question);

      expect(keywords).toContain('product');
      expect(keywords).toContain('features');
      expect(keywords).toContain('mobile');
      expect(keywords).toContain('launch');
      expect(keywords.length).toBeLessThanOrEqual(10);
    });

    it('should extract keywords from clinical questions', () => {
      const question = "How do we ensure patient safety in our clinical trial protocol?";
      const keywords = engine.extractKeywords(question);

      expect(keywords).toContain('patient');
      expect(keywords).toContain('safety');
      expect(keywords).toContain('clinical');
      expect(keywords).toContain('trial');
      expect(keywords).toContain('protocol');
    });

    it('should filter out stop words', () => {
      const question = "What is the best approach for this particular situation?";
      const keywords = engine.extractKeywords(question);

      expect(keywords).not.toContain('what');
      expect(keywords).not.toContain('is');
      expect(keywords).not.toContain('the');
      expect(keywords).not.toContain('for');
      expect(keywords).not.toContain('this');
    });

    it('should prioritize domain-specific keywords', () => {
      const question = "We need help with product strategy and general advice";
      const keywords = engine.extractKeywords(question);

      // Domain keywords should appear before general words
      const productIndex = keywords.indexOf('product');
      const strategyIndex = keywords.indexOf('strategy');
      const helpIndex = keywords.indexOf('help');

      expect(productIndex).toBeLessThan(helpIndex);
      expect(strategyIndex).toBeLessThan(helpIndex);
    });
  });

  describe('categorizeQuestion', () => {
    it('should categorize product ideation questions', () => {
      const keywords = ['idea', 'create', 'innovation', 'new'];
      const question = "I have an idea to create a new innovative product";
      const type = engine.categorizeQuestion(keywords, question);

      expect(type).toBe('product_ideation');
    });

    it('should categorize strategy questions', () => {
      const keywords = ['strategy', 'plan', 'approach'];
      const question = "What strategy should we plan for our approach?";
      const type = engine.categorizeQuestion(keywords, question);

      expect(type).toBe('strategy');
    });

    it('should categorize technical questions', () => {
      const keywords = ['technical', 'implementation', 'system'];
      const question = "How to implement this technical system?";
      const type = engine.categorizeQuestion(keywords, question);

      expect(type).toBe('technical');
    });

    it('should default to general for unclear questions', () => {
      const keywords = ['help', 'advice'];
      const question = "Can you help me with some advice?";
      const type = engine.categorizeQuestion(keywords, question);

      expect(type).toBe('general');
    });
  });

  describe('identifyDomain', () => {
    it('should identify productboard domain', () => {
      const keywords = ['product', 'market', 'customer', 'feature'];
      const question = "What product features do customers want in the market?";
      const domain = engine.identifyDomain(keywords, question);

      expect(domain).toBe('productboard');
    });

    it('should identify cliniboard domain', () => {
      const keywords = ['clinical', 'patient', 'medical', 'treatment'];
      const question = "What clinical treatment is best for patients with medical conditions?";
      const domain = engine.identifyDomain(keywords, question);

      expect(domain).toBe('cliniboard');
    });

    it('should identify eduboard domain', () => {
      const keywords = ['education', 'learning', 'student', 'curriculum'];
      const question = "How can we improve education and learning for students in our curriculum?";
      const domain = engine.identifyDomain(keywords, question);

      expect(domain).toBe('eduboard');
    });

    it('should identify remediboard domain', () => {
      const keywords = ['natural', 'holistic', 'alternative', 'wellness'];
      const question = "What natural and holistic alternative approaches support wellness?";
      const domain = engine.identifyDomain(keywords, question);

      expect(domain).toBe('remediboard');
    });

    it('should identify multi-domain for mixed keywords', () => {
      const keywords = ['product', 'clinical', 'education'];
      const question = "How do we create a product for clinical education?";
      const domain = engine.identifyDomain(keywords, question);

      expect(domain).toBe('multi-domain');
    });

    it('should default to multi-domain for no clear matches', () => {
      const keywords = ['help', 'advice', 'general'];
      const question = "Can you help with some general advice?";
      const domain = engine.identifyDomain(keywords, question);

      expect(domain).toBe('multi-domain');
    });
  });

  describe('context preservation', () => {
    it('should detect follow-up indicators', () => {
      const question = "Also, can you tell me more about this? Additionally, what about the other approach?";
      const result = engine.analyze(question);

      expect(result.context?.followUpIndicators).toContain('also');
      expect(result.context?.followUpIndicators).toContain('additionally');
      expect(result.context?.followUpIndicators).toContain('what about');
    });

    it('should preserve existing context', () => {
      const existingContext = {
        sessionId: 'test-session',
        previousQuestions: ['What is product strategy?'],
        userIntent: 'learning'
      };

      const question = "Can you tell me more about implementation?";
      const result = engine.analyze(question, existingContext);

      expect(result.context?.sessionId).toBe('test-session');
      expect(result.context?.previousQuestions).toEqual(['What is product strategy?']);
      expect(result.context?.userIntent).toBe('learning');
    });

    it('should extract related topics', () => {
      const question = "I need help with product strategy, market analysis, and competitive positioning";
      const result = engine.analyze(question);

      expect(result.context?.relatedTopics).toContain('product');
      expect(result.context?.relatedTopics).toContain('strategy');
      expect(result.context?.relatedTopics).toContain('market');
      expect(result.context?.relatedTopics).toContain('analysis');
      expect(result.context?.relatedTopics).toContain('competitive');
    });
  });

  describe('confidence scoring', () => {
    it('should have high confidence for clear domain-specific questions', () => {
      const question = "What clinical trial protocol should we use for testing this new drug therapy in patients?";
      const result = engine.analyze(question);

      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should have medium confidence for somewhat clear questions', () => {
      const question = "What's the best approach for our project?";
      const result = engine.analyze(question);

      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.confidence).toBeLessThan(0.8);
    });

    it('should have lower confidence for vague questions', () => {
      const question = "Help me with stuff";
      const result = engine.analyze(question);

      expect(result.confidence).toBeLessThan(0.7);
    });
  });

  describe('edge cases', () => {
    it('should handle empty questions', () => {
      const result = engine.analyze('');

      expect(result.type).toBe('general');
      expect(result.domain).toBe('multi-domain');
      expect(result.keywords).toEqual([]);
      expect(result.confidence).toBeLessThan(0.6);
    });

    it('should handle very long questions', () => {
      const longQuestion = 'What '.repeat(100) + 'is the best product strategy?';
      const result = engine.analyze(longQuestion);

      expect(result.type).toBe('strategy');
      expect(result.domain).toBe('productboard');
      expect(result.complexity).toBe('high');
    });

    it('should handle questions with special characters', () => {
      const question = "What's the best approach for our product's market strategy? (urgent!)";
      const result = engine.analyze(question);

      expect(result.type).toBe('strategy');
      expect(result.domain).toBe('productboard');
      expect(result.urgency).toBe('high');
    });

    it('should handle questions with multiple question marks', () => {
      const question = "What should we do? How do we proceed? When should we start?";
      const result = engine.analyze(question);

      expect(result.complexity).toBe('medium');
    });
  });
});