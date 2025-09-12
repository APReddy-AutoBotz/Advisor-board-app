/**
 * Demo Showcase Component
 * 
 * Demonstrates the enhanced persona-driven response system with
 * performance monitoring and quality metrics for hackathon presentation.
 * 
 * Requirements: FR-5
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { demoModeService, type DemoSession, type DemoResponse } from '../../services/demoModeService';
import { performanceMonitoringService, type PerformanceReport } from '../../services/performanceMonitoringService';
import { DEMO_QUESTIONS, QUICK_DEMO_QUESTIONS, getRandomDemoQuestion } from '../../data/demoQuestions';
import type { Advisor } from '../../types/domain';

interface DemoShowcaseProps {
  onDemoComplete?: (session: DemoSession) => void;
}

export const DemoShowcase: React.FC<DemoShowcaseProps> = ({ onDemoComplete }) => {
  const [isDemoActive, setIsDemoActive] = useState(false);
  const [currentSession, setCurrentSession] = useState<DemoSession | null>(null);
  const [responses, setResponses] = useState<DemoResponse[]>([]);
  const [performanceReport, setPerformanceReport] = useState<PerformanceReport | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState(QUICK_DEMO_QUESTIONS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);

  // Mock advisors for demo
  const mockAdvisors: Advisor[] = [
    {
      id: 'sarah-kim',
      name: 'Sarah Kim',
      role: 'Chief Product Officer',
      expertise: 'Product Strategy, 0-to-1 Products, Platform Scaling',
      background: 'Former CPO at Stripe, scaled from $1M to $1B ARR',
      avatar: '/avatars/sarah-kim.jpg'
    },
    {
      id: 'alex-thompson',
      name: 'Alex Thompson',
      role: 'VP of Engineering',
      expertise: 'System Architecture, Engineering Leadership, Technical Strategy',
      background: 'Former Netflix VP Engineering, 200M+ concurrent users',
      avatar: '/avatars/alex-thompson.jpg'
    },
    {
      id: 'elena-rodriguez',
      name: 'Elena Rodriguez',
      role: 'Head of Design',
      expertise: 'Design Systems, User Experience, Design Leadership',
      background: 'Former Airbnb Design Director, built Design Language System',
      avatar: '/avatars/elena-rodriguez.jpg'
    }
  ];

  useEffect(() => {
    // Initialize performance monitoring
    performanceMonitoringService.startMonitoring();
    
    return () => {
      performanceMonitoringService.stopMonitoring();
      if (isDemoActive) {
        demoModeService.disableDemoMode();
      }
    };
  }, [isDemoActive]);

  const startDemo = async () => {
    setIsDemoActive(true);
    setIsGenerating(true);
    setResponses([]);
    setPerformanceReport(null);

    // Enable demo mode
    demoModeService.enableDemoMode();

    // Start demo session
    const sessionId = demoModeService.startDemoSession(
      selectedQuestion.question,
      selectedQuestion.domain,
      mockAdvisors
    );

    const session = demoModeService.getCurrentSession();
    setCurrentSession(session);

    try {
      // Generate responses for each advisor
      const demoResponses: DemoResponse[] = [];
      
      for (const advisor of mockAdvisors) {
        const response = await demoModeService.generateDemoResponse(
          advisor,
          selectedQuestion.question,
          selectedQuestion.domain
        );
        
        demoResponses.push(response);
        setResponses(prev => [...prev, response]);

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

        // Record quality metrics
        performanceMonitoringService.recordQualityMetrics(
          response.content,
          advisor.role,
          selectedQuestion.category,
          response.metadata.frameworks
        );
      }

      // Complete session and generate report
      const completedSession = demoModeService.completeDemoSession();
      if (completedSession) {
        setCurrentSession(completedSession);
        onDemoComplete?.(completedSession);
      }

      // Generate performance report
      const report = performanceMonitoringService.generatePerformanceReport(sessionId);
      setPerformanceReport(report);

    } catch (error) {
      console.error('Demo generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const stopDemo = () => {
    setIsDemoActive(false);
    demoModeService.disableDemoMode();
    setCurrentSession(null);
    setResponses([]);
    setPerformanceReport(null);
  };

  const selectRandomQuestion = () => {
    const randomQuestion = getRandomDemoQuestion();
    setSelectedQuestion(randomQuestion);
  };

  const formatMetricValue = (value: number, type: 'percentage' | 'time' | 'score' = 'score'): string => {
    switch (type) {
      case 'percentage':
        return `${(value * 100).toFixed(1)}%`;
      case 'time':
        return `${value.toFixed(0)}ms`;
      case 'score':
        return value.toFixed(2);
      default:
        return value.toString();
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Demo Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              🎬 Hackathon Demo Showcase
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Experience persona-driven AI responses with real-time performance monitoring
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              isDemoActive 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
            }`}>
              {isDemoActive ? '🟢 Demo Active' : '⚪ Demo Inactive'}
            </div>
            <Button
              onClick={showMetrics ? () => setShowMetrics(false) : () => setShowMetrics(true)}
              variant="outline"
              size="sm"
            >
              {showMetrics ? 'Hide Metrics' : 'Show Metrics'}
            </Button>
          </div>
        </div>

        {/* Question Selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Demo Question
            </label>
            <div className="flex items-center space-x-3">
              <select
                value={selectedQuestion.id}
                onChange={(e) => {
                  const question = DEMO_QUESTIONS.find(q => q.id === e.target.value);
                  if (question) setSelectedQuestion(question);
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                disabled={isGenerating}
              >
                {DEMO_QUESTIONS.map(question => (
                  <option key={question.id} value={question.id}>
                    {question.question.substring(0, 80)}...
                  </option>
                ))}
              </select>
              <Button
                onClick={selectRandomQuestion}
                variant="outline"
                size="sm"
                disabled={isGenerating}
              >
                Random
              </Button>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              <strong>Selected Question:</strong>
            </p>
            <p className="text-gray-900 dark:text-white">{selectedQuestion.question}</p>
            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span>Domain: {selectedQuestion.domain}</span>
              <span>Category: {selectedQuestion.category}</span>
              <span>Showcases: {selectedQuestion.showcasesAdvisors.join(', ')}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              onClick={startDemo}
              disabled={isGenerating || isDemoActive}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isGenerating ? 'Generating Responses...' : 'Start Demo'}
            </Button>
            {isDemoActive && (
              <Button
                onClick={stopDemo}
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                Stop Demo
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Performance Metrics */}
      {showMetrics && performanceReport && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📊 Real-Time Performance Metrics
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatMetricValue(performanceReport.metrics.responseTime, 'time')}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Response Time</div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatMetricValue(performanceReport.metrics.qualityScore)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Quality Score</div>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {formatMetricValue(performanceReport.metrics.throughput, 'score')}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Throughput (req/s)</div>
            </div>
            
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {formatMetricValue(performanceReport.metrics.userSatisfaction, 'percentage')}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">User Satisfaction</div>
            </div>
          </div>

          {/* Benchmarks */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Performance Benchmarks</h4>
            <div className="space-y-2">
              {performanceReport.benchmarks.map((benchmark, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium text-gray-900 dark:text-white">{benchmark.metric}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(benchmark.status)}`}>
                      {benchmark.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatMetricValue(benchmark.current)} / {formatMetricValue(benchmark.target)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {benchmark.trend} trend
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quality Metrics */}
          <div>
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Response Quality Analysis</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatMetricValue(performanceReport.qualityMetrics.personaConsistency, 'percentage')}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Persona Consistency</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatMetricValue(performanceReport.qualityMetrics.technicalAccuracy, 'percentage')}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Technical Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatMetricValue(performanceReport.qualityMetrics.businessRelevance, 'percentage')}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Business Relevance</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatMetricValue(performanceReport.qualityMetrics.actionabilityScore, 'percentage')}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Actionability</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatMetricValue(performanceReport.qualityMetrics.comprehensiveness, 'percentage')}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Comprehensiveness</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatMetricValue(performanceReport.qualityMetrics.professionalTone, 'percentage')}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Professional Tone</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Demo Responses */}
      {responses.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            🤖 AI Advisor Responses
          </h3>
          
          {responses.map((response, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {response.advisorId.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {mockAdvisors.find(a => a.id === response.advisorId)?.name || response.advisorId}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {mockAdvisors.find(a => a.id === response.advisorId)?.role}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                  <span>⚡ {response.metadata.processingTime}ms</span>
                  <span>🎯 {formatMetricValue(response.metadata.confidence, 'percentage')}</span>
                  <span>🏆 {formatMetricValue(response.metadata.personaAccuracy, 'percentage')}</span>
                </div>
              </div>

              <div className="prose dark:prose-invert max-w-none mb-4">
                <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                  {response.content}
                </div>
              </div>

              {/* Demo Insights */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white mb-2">Expertise Showcase</h5>
                    <ul className="space-y-1 text-gray-600 dark:text-gray-300">
                      {response.demoInsights.showcasesExpertise.map((item, i) => (
                        <li key={i} className="flex items-start space-x-1">
                          <span className="text-blue-500">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white mb-2">Key Differentiators</h5>
                    <ul className="space-y-1 text-gray-600 dark:text-gray-300">
                      {response.demoInsights.keyDifferentiators.map((item, i) => (
                        <li key={i} className="flex items-start space-x-1">
                          <span className="text-green-500">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white mb-2">Industry Credentials</h5>
                    <ul className="space-y-1 text-gray-600 dark:text-gray-300">
                      {response.demoInsights.industryCredentials.map((item, i) => (
                        <li key={i} className="flex items-start space-x-1">
                          <span className="text-purple-500">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Demo Session Summary */}
      {currentSession && !isGenerating && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📋 Demo Session Summary
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {currentSession.responses.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Responses Generated</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatMetricValue(currentSession.metrics.responseTime, 'time')}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Total Time</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {formatMetricValue(currentSession.metrics.overallQuality)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Overall Quality</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {currentSession.metrics.questionComplexity.toUpperCase()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Question Complexity</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
