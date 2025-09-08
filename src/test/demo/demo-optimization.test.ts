/**
 * Demo Optimization Tests
 * 
 * Tests for hackathon demonstration features including demo mode,
 * performance monitoring, and sample questions.
 * 
 * Requirements: FR-5
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { demoModeService } from '../../services/demoModeService';
import { performanceMonitoringService } from '../../services/performanceMonitoringService';
import { DEMO_QUESTIONS, QUICK_DEMO_QUESTIONS, getRandomDemoQuestion, getDemoQuestionsForAdvisor } from '../../data/demoQuestions';
import type { Advisor } from '../../types/domain';

// Mock advisor for testing
const mockAdvisor: Advisor = {
  id: 'sarah-kim',
  name: 'Sarah Kim',
  role: 'Chief Product Officer',
  expertise: 'Product Strategy, 0-to-1 Products, Platform Scaling',
  background: 'Former CPO at Stripe, scaled from $1M to $1B ARR',
  domain: 'productboard',
  isSelected: true
};

describe('Demo Mode Service', () => {
  beforeEach(() => {
    demoModeService.disableDemoMode();
  });

  afterEach(() => {
    demoModeService.disableDemoMode();
  });

  describe('Demo Mode Management', () => {
    it('should enable and disable demo mode correctly', () => {
      expect(demoModeService.isDemoModeActive()).toBe(false);
      
      demoModeService.enableDemoMode();
      expect(demoModeService.isDemoModeActive()).toBe(true);
      
      demoModeService.disableDemoMode();
      expect(demoModeService.isDemoModeActive()).toBe(false);
    });

    it('should start demo session with correct metadata', () => {
      demoModeService.enableDemoMode();
      
      const sessionId = demoModeService.startDemoSession(
        'How do I achieve product-market fit?',
        'productboard',
        [mockAdvisor]
      );
      
      expect(sessionId).toMatch(/^demo_\d+_[a-z0-9]+$/);
      
      const session = demoModeService.getCurrentSession();
      expect(session).toBeTruthy();
      expect(session?.question).toBe('How do I achieve product-market fit?');
      expect(session?.domain).toBe('productboard');
      expect(session?.advisors).toHaveLength(1);
    });
  });

  describe('Demo Response Generation', () => {
    it('should generate enhanced demo response with metadata', async () => {
      demoModeService.enableDemoMode();
      demoModeService.startDemoSession(
        'How do I scale my product team?',
        'productboard',
        [mockAdvisor]
      );

      const response = await demoModeService.generateDemoResponse(
        mockAdvisor,
        'How do I scale my product team?',
        'productboard'
      );

      expect(response).toBeTruthy();
      expect(response.advisorId).toBe('sarah-kim');
      expect(response.content).toBeTruthy();
      expect(response.metadata.responseType).toBe('demo_static');
      expect(response.metadata.processingTime).toBeGreaterThan(0);
      expect(response.metadata.confidence).toBeGreaterThan(0);
      expect(response.metadata.personaAccuracy).toBeGreaterThan(0);
      expect(response.metadata.technicalDepth).toBeGreaterThan(0);
      expect(response.metadata.businessRelevance).toBeGreaterThan(0);
      
      expect(response.demoInsights).toBeTruthy();
      expect(response.demoInsights.showcasesExpertise).toBeInstanceOf(Array);
      expect(response.demoInsights.keyDifferentiators).toBeInstanceOf(Array);
      expect(response.demoInsights.industryCredentials).toBeInstanceOf(Array);
    });

    it('should complete demo session with calculated metrics', async () => {
      demoModeService.enableDemoMode();
      demoModeService.startDemoSession(
        'How do I build a design system?',
        'productboard',
        [mockAdvisor]
      );

      await demoModeService.generateDemoResponse(
        mockAdvisor,
        'How do I build a design system?',
        'productboard'
      );

      const completedSession = demoModeService.completeDemoSession();
      
      expect(completedSession).toBeTruthy();
      expect(completedSession?.metrics.responseTime).toBeGreaterThan(0);
      expect(completedSession?.metrics.advisorCount).toBe(1);
      expect(completedSession?.metrics.overallQuality).toBeGreaterThan(0);
      expect(completedSession?.responses).toHaveLength(1);
    });
  });

  describe('Quality Metrics Calculation', () => {
    it('should calculate persona accuracy correctly', async () => {
      demoModeService.enableDemoMode();
      
      const response = await demoModeService.generateDemoResponse(
        mockAdvisor,
        'What product strategy should I use for scaling?',
        'productboard'
      );

      // Should have high persona accuracy for product strategy question
      expect(response.metadata.personaAccuracy).toBeGreaterThan(0.7);
    });

    it('should calculate technical depth based on question type', async () => {
      demoModeService.enableDemoMode();
      
      const technicalResponse = await demoModeService.generateDemoResponse(
        mockAdvisor,
        'What technical architecture should I use for scaling to 10M users?',
        'productboard'
      );

      const generalResponse = await demoModeService.generateDemoResponse(
        mockAdvisor,
        'How do I improve team communication?',
        'productboard'
      );

      // Technical question should have higher technical depth
      expect(technicalResponse.metadata.technicalDepth).toBeGreaterThanOrEqual(
        generalResponse.metadata.technicalDepth
      );
    });
  });
});

describe('Performance Monitoring Service', () => {
  beforeEach(() => {
    performanceMonitoringService.resetMetrics();
  });

  afterEach(() => {
    performanceMonitoringService.stopMonitoring();
  });

  describe('Performance Metrics Recording', () => {
    it('should record response metrics correctly', () => {
      performanceMonitoringService.recordResponseMetrics(
        1500, // responseTime
        3,    // advisorCount
        'medium', // questionComplexity
        {
          personaAccuracy: 0.85,
          technicalDepth: 0.75,
          businessRelevance: 0.90
        }
      );

      const metrics = performanceMonitoringService.getAllMetrics();
      expect(metrics.performance).toHaveLength(1);
      
      const metric = metrics.performance[0];
      expect(metric.responseTime).toBe(1500);
      expect(metric.throughput).toBeCloseTo(3 / 1.5); // advisors per second
      expect(metric.qualityScore).toBeCloseTo(0.833); // average of quality scores
    });

    it('should record quality metrics correctly', () => {
      const qualityMetrics = performanceMonitoringService.recordQualityMetrics(
        'This is a strategic response about product development with technical architecture considerations and business strategy frameworks.',
        'Chief Product Officer',
        'strategy',
        ['North Star Framework', 'OKRs']
      );

      expect(qualityMetrics.personaConsistency).toBeGreaterThanOrEqual(0.7);
      expect(qualityMetrics.technicalAccuracy).toBeGreaterThanOrEqual(0.7);
      expect(qualityMetrics.businessRelevance).toBeGreaterThan(0.7);
      expect(qualityMetrics.professionalTone).toBeGreaterThanOrEqual(0.7);
    });
  });

  describe('Performance Report Generation', () => {
    it('should generate comprehensive performance report', () => {
      // Record some metrics first
      performanceMonitoringService.recordResponseMetrics(
        1200, 2, 'high',
        { personaAccuracy: 0.9, technicalDepth: 0.8, businessRelevance: 0.85 }
      );

      performanceMonitoringService.recordQualityMetrics(
        'Strategic response with technical depth',
        'VP of Engineering',
        'technical',
        ['System Design', 'DevOps']
      );

      const report = performanceMonitoringService.generatePerformanceReport('test-session');
      
      expect(report.sessionId).toBe('test-session');
      expect(report.timestamp).toBeInstanceOf(Date);
      expect(report.metrics).toBeTruthy();
      expect(report.qualityMetrics).toBeTruthy();
      expect(report.systemHealth).toBeTruthy();
      expect(report.benchmarks).toBeInstanceOf(Array);
      expect(report.recommendations).toBeInstanceOf(Array);
    });

    it('should provide performance benchmarks with status', () => {
      performanceMonitoringService.recordResponseMetrics(
        500, 5, 'low', // Excellent response time
        { personaAccuracy: 0.95, technicalDepth: 0.9, businessRelevance: 0.92 }
      );

      const report = performanceMonitoringService.generatePerformanceReport('benchmark-test');
      
      const responseTimeBenchmark = report.benchmarks.find(b => b.metric === 'Response Time');
      expect(responseTimeBenchmark?.status).toBe('excellent');
      
      const qualityBenchmark = report.benchmarks.find(b => b.metric === 'Quality Score');
      expect(qualityBenchmark?.status).toBe('excellent');
    });
  });

  describe('System Health Monitoring', () => {
    it('should start and stop monitoring correctly', () => {
      expect(() => performanceMonitoringService.startMonitoring()).not.toThrow();
      expect(() => performanceMonitoringService.stopMonitoring()).not.toThrow();
    });
  });
});

describe('Demo Questions Data', () => {
  describe('Demo Questions Structure', () => {
    it('should have well-structured demo questions', () => {
      expect(DEMO_QUESTIONS).toBeInstanceOf(Array);
      expect(DEMO_QUESTIONS.length).toBeGreaterThan(0);
      
      DEMO_QUESTIONS.forEach(question => {
        expect(question.id).toBeTruthy();
        expect(question.question).toBeTruthy();
        expect(question.domain).toBeTruthy();
        expect(question.category).toMatch(/^(product_ideation|strategy|technical|general)$/);
        expect(question.showcasesAdvisors).toBeInstanceOf(Array);
        expect(question.expectedInsights).toBeInstanceOf(Array);
        expect(question.demoNotes).toBeTruthy();
      });
    });

    it('should have quick demo questions for rapid demonstration', () => {
      expect(QUICK_DEMO_QUESTIONS).toBeInstanceOf(Array);
      expect(QUICK_DEMO_QUESTIONS.length).toBeGreaterThan(0);
      expect(QUICK_DEMO_QUESTIONS.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Demo Question Utilities', () => {
    it('should get random demo question', () => {
      const randomQuestion = getRandomDemoQuestion();
      expect(randomQuestion).toBeTruthy();
      expect(DEMO_QUESTIONS).toContain(randomQuestion);
    });

    it('should get random demo question by domain', () => {
      const productQuestion = getRandomDemoQuestion('productboard');
      expect(productQuestion.domain).toBe('productboard');
      
      const clinicalQuestion = getRandomDemoQuestion('cliniboard');
      expect(clinicalQuestion.domain).toBe('cliniboard');
    });

    it('should get demo questions for specific advisor', () => {
      const sarahQuestions = getDemoQuestionsForAdvisor('sarah-kim');
      expect(sarahQuestions).toBeInstanceOf(Array);
      
      sarahQuestions.forEach(question => {
        expect(question.showcasesAdvisors).toContain('sarah-kim');
      });
    });
  });

  describe('Demo Question Coverage', () => {
    it('should cover all domains', () => {
      const domains = [...new Set(DEMO_QUESTIONS.map(q => q.domain))];
      expect(domains).toContain('productboard');
      expect(domains).toContain('cliniboard');
      expect(domains).toContain('eduboard');
      expect(domains).toContain('remediboard');
    });

    it('should cover all question categories', () => {
      const categories = [...new Set(DEMO_QUESTIONS.map(q => q.category))];
      expect(categories).toContain('product_ideation');
      expect(categories).toContain('strategy');
      expect(categories).toContain('technical');
      expect(categories).toContain('general');
    });

    it('should showcase key advisors', () => {
      const advisors = [...new Set(DEMO_QUESTIONS.flatMap(q => q.showcasesAdvisors))];
      expect(advisors).toContain('sarah-kim');
      expect(advisors).toContain('alex-thompson');
      expect(advisors).toContain('elena-rodriguez');
      expect(advisors).toContain('sarah-chen');
      expect(advisors).toContain('michael-rodriguez');
    });
  });
});

describe('Demo Integration', () => {
  describe('End-to-End Demo Flow', () => {
    it('should complete full demo workflow', async () => {
      // Enable demo mode
      demoModeService.enableDemoMode();
      performanceMonitoringService.startMonitoring();
      
      try {
        // Start demo session
        const question = QUICK_DEMO_QUESTIONS[0];
        const sessionId = demoModeService.startDemoSession(
          question.question,
          question.domain,
          [mockAdvisor]
        );
        
        expect(sessionId).toBeTruthy();
        
        // Generate demo response
        const response = await demoModeService.generateDemoResponse(
          mockAdvisor,
          question.question,
          question.domain
        );
        
        expect(response).toBeTruthy();
        
        // Record performance metrics
        performanceMonitoringService.recordResponseMetrics(
          response.metadata.processingTime,
          1,
          'medium',
          {
            personaAccuracy: response.metadata.personaAccuracy,
            technicalDepth: response.metadata.technicalDepth,
            businessRelevance: response.metadata.businessRelevance
          }
        );
        
        // Complete session
        const completedSession = demoModeService.completeDemoSession();
        expect(completedSession).toBeTruthy();
        
        // Generate performance report
        const report = performanceMonitoringService.generatePerformanceReport(sessionId);
        expect(report).toBeTruthy();
        expect(report.sessionId).toBe(sessionId);
        
      } finally {
        demoModeService.disableDemoMode();
        performanceMonitoringService.stopMonitoring();
      }
    });
  });

  describe('Demo Quality Assurance', () => {
    it('should ensure impressive responses without API keys', async () => {
      demoModeService.enableDemoMode();
      
      try {
        const response = await demoModeService.generateDemoResponse(
          mockAdvisor,
          'How do I achieve product-market fit for my B2B SaaS product?',
          'productboard'
        );
        
        // Quality thresholds for impressive demo
        expect(response.metadata.confidence).toBeGreaterThan(0.7);
        expect(response.metadata.personaAccuracy).toBeGreaterThan(0.7);
        expect(response.metadata.businessRelevance).toBeGreaterThan(0.7);
        
        // Content quality checks
        expect(response.content.length).toBeGreaterThan(200); // Substantial response
        expect(response.content).toMatch(/strategy|approach|recommend/i); // Professional language
        expect(response.demoInsights.showcasesExpertise.length).toBeGreaterThan(0);
        
      } finally {
        demoModeService.disableDemoMode();
      }
    });

    it('should demonstrate unique advisor expertise', async () => {
      demoModeService.enableDemoMode();
      
      const advisors = [
        { ...mockAdvisor, id: 'sarah-kim', role: 'Chief Product Officer' },
        { ...mockAdvisor, id: 'alex-thompson', role: 'VP of Engineering' },
        { ...mockAdvisor, id: 'elena-rodriguez', role: 'Head of Design' }
      ];
      
      try {
        const responses = await Promise.all(
          advisors.map(advisor => 
            demoModeService.generateDemoResponse(
              advisor,
              'How do I scale my product to 10M users?',
              'productboard'
            )
          )
        );
        
        // Each response should be unique and role-specific
        expect(responses).toHaveLength(3);
        
        const contents = responses.map(r => r.content);
        expect(contents[0]).not.toBe(contents[1]);
        expect(contents[1]).not.toBe(contents[2]);
        
        // Each should showcase different expertise
        const expertiseAreas = responses.map(r => r.demoInsights.showcasesExpertise);
        expect(expertiseAreas[0]).not.toEqual(expertiseAreas[1]);
        expect(expertiseAreas[1]).not.toEqual(expertiseAreas[2]);
        
      } finally {
        demoModeService.disableDemoMode();
      }
    });
  });
});