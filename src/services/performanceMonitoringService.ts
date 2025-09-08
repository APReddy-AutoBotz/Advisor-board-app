/**
 * Performance Monitoring Service
 * 
 * Tracks response quality metrics, performance benchmarks, and system health
 * for hackathon demonstration and production monitoring.
 * 
 * Requirements: FR-5
 */

export interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  qualityScore: number;
  userSatisfaction: number;
  systemLoad: number;
}

export interface ResponseQualityMetrics {
  personaConsistency: number;
  technicalAccuracy: number;
  businessRelevance: number;
  actionabilityScore: number;
  comprehensiveness: number;
  professionalTone: number;
}

export interface SystemHealthMetrics {
  memoryUsage: number;
  cpuUsage: number;
  networkLatency: number;
  cacheHitRate: number;
  apiAvailability: number;
  errorCount: number;
}

export interface PerformanceBenchmark {
  metric: string;
  target: number;
  current: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  trend: 'improving' | 'stable' | 'declining';
}

export interface PerformanceReport {
  timestamp: Date;
  sessionId: string;
  metrics: PerformanceMetrics;
  qualityMetrics: ResponseQualityMetrics;
  systemHealth: SystemHealthMetrics;
  benchmarks: PerformanceBenchmark[];
  recommendations: string[];
}

class PerformanceMonitoringService {
  private metrics: PerformanceMetrics[] = [];
  private qualityMetrics: ResponseQualityMetrics[] = [];
  private systemHealth: SystemHealthMetrics[] = [];
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    this.isMonitoring = true;
    
    // Monitor system health every 5 seconds
    this.monitoringInterval = setInterval(() => {
      this.collectSystemHealth();
    }, 5000);

    console.log('🔍 Performance monitoring started');
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('🔍 Performance monitoring stopped');
  }

  /**
   * Record response performance metrics
   */
  recordResponseMetrics(
    responseTime: number,
    advisorCount: number,
    questionComplexity: 'low' | 'medium' | 'high',
    qualityScores: {
      personaAccuracy: number;
      technicalDepth: number;
      businessRelevance: number;
    }
  ): void {
    const metrics: PerformanceMetrics = {
      responseTime,
      throughput: advisorCount / (responseTime / 1000), // advisors per second
      errorRate: 0, // Would be calculated from actual errors
      qualityScore: (qualityScores.personaAccuracy + qualityScores.technicalDepth + qualityScores.businessRelevance) / 3,
      userSatisfaction: this.estimateUserSatisfaction(responseTime, qualityScores),
      systemLoad: this.getCurrentSystemLoad()
    };

    this.metrics.push(metrics);

    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    console.log(`📊 Performance recorded: ${responseTime}ms, Quality: ${metrics.qualityScore.toFixed(2)}`);
  }

  /**
   * Record response quality metrics
   */
  recordQualityMetrics(
    content: string,
    advisorRole: string,
    questionType: string,
    frameworks: string[]
  ): ResponseQualityMetrics {
    const qualityMetrics: ResponseQualityMetrics = {
      personaConsistency: this.analyzePersonaConsistency(content, advisorRole),
      technicalAccuracy: this.analyzeTechnicalAccuracy(content, questionType),
      businessRelevance: this.analyzeBusinessRelevance(content),
      actionabilityScore: this.analyzeActionability(content),
      comprehensiveness: this.analyzeComprehensiveness(content, frameworks),
      professionalTone: this.analyzeProfessionalTone(content)
    };

    this.qualityMetrics.push(qualityMetrics);

    // Keep only last 100 quality metrics
    if (this.qualityMetrics.length > 100) {
      this.qualityMetrics = this.qualityMetrics.slice(-100);
    }

    return qualityMetrics;
  }

  /**
   * Collect system health metrics
   */
  private collectSystemHealth(): void {
    const health: SystemHealthMetrics = {
      memoryUsage: this.getMemoryUsage(),
      cpuUsage: this.getCpuUsage(),
      networkLatency: this.getNetworkLatency(),
      cacheHitRate: this.getCacheHitRate(),
      apiAvailability: this.getApiAvailability(),
      errorCount: this.getErrorCount()
    };

    this.systemHealth.push(health);

    // Keep only last 100 health metrics
    if (this.systemHealth.length > 100) {
      this.systemHealth = this.systemHealth.slice(-100);
    }
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(sessionId: string): PerformanceReport {
    const latestMetrics = this.getLatestMetrics();
    const latestQuality = this.getLatestQualityMetrics();
    const latestHealth = this.getLatestSystemHealth();
    const benchmarks = this.calculateBenchmarks();
    const recommendations = this.generateRecommendations(benchmarks);

    return {
      timestamp: new Date(),
      sessionId,
      metrics: latestMetrics,
      qualityMetrics: latestQuality,
      systemHealth: latestHealth,
      benchmarks,
      recommendations
    };
  }

  /**
   * Get performance benchmarks
   */
  private calculateBenchmarks(): PerformanceBenchmark[] {
    const avgResponseTime = this.getAverageResponseTime();
    const avgQuality = this.getAverageQuality();
    const avgThroughput = this.getAverageThroughput();

    return [
      {
        metric: 'Response Time',
        target: 2000, // 2 seconds
        current: avgResponseTime,
        status: avgResponseTime < 1000 ? 'excellent' : avgResponseTime < 2000 ? 'good' : avgResponseTime < 5000 ? 'warning' : 'critical',
        trend: this.calculateTrend('responseTime')
      },
      {
        metric: 'Quality Score',
        target: 0.85,
        current: avgQuality,
        status: avgQuality > 0.9 ? 'excellent' : avgQuality > 0.8 ? 'good' : avgQuality > 0.7 ? 'warning' : 'critical',
        trend: this.calculateTrend('qualityScore')
      },
      {
        metric: 'Throughput',
        target: 5, // 5 advisors per second
        current: avgThroughput,
        status: avgThroughput > 10 ? 'excellent' : avgThroughput > 5 ? 'good' : avgThroughput > 2 ? 'warning' : 'critical',
        trend: this.calculateTrend('throughput')
      },
      {
        metric: 'Error Rate',
        target: 0.01, // 1%
        current: this.getAverageErrorRate(),
        status: this.getAverageErrorRate() < 0.01 ? 'excellent' : this.getAverageErrorRate() < 0.05 ? 'good' : this.getAverageErrorRate() < 0.1 ? 'warning' : 'critical',
        trend: this.calculateTrend('errorRate')
      }
    ];
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(benchmarks: PerformanceBenchmark[]): string[] {
    const recommendations: string[] = [];

    benchmarks.forEach(benchmark => {
      if (benchmark.status === 'critical' || benchmark.status === 'warning') {
        switch (benchmark.metric) {
          case 'Response Time':
            recommendations.push('Consider implementing response caching and optimizing persona prompt generation');
            break;
          case 'Quality Score':
            recommendations.push('Review persona templates and enhance static response generation algorithms');
            break;
          case 'Throughput':
            recommendations.push('Implement concurrent processing and optimize advisor response generation');
            break;
          case 'Error Rate':
            recommendations.push('Improve error handling and implement better fallback mechanisms');
            break;
        }
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('System performance is optimal - continue monitoring for consistency');
    }

    return recommendations;
  }

  /**
   * Analyze persona consistency
   */
  private analyzePersonaConsistency(content: string, advisorRole: string): number {
    let score = 0.7; // Base score

    const roleKeywords = {
      'Chief Product Officer': ['strategy', 'product', 'business', 'market', 'revenue'],
      'Senior Product Manager': ['user', 'feature', 'roadmap', 'analytics', 'research'],
      'Head of Design': ['design', 'user experience', 'interface', 'visual', 'accessibility'],
      'VP of Engineering': ['technical', 'architecture', 'system', 'scalability', 'infrastructure'],
      'Clinical Research Strategy': ['clinical', 'trial', 'regulatory', 'FDA', 'patient'],
      'Regulatory Affairs Director': ['regulatory', 'compliance', 'submission', 'approval', 'guidelines']
    };

    const keywords = roleKeywords[advisorRole as keyof typeof roleKeywords] || [];
    const contentLower = content.toLowerCase();

    keywords.forEach(keyword => {
      if (contentLower.includes(keyword)) {
        score += 0.05;
      }
    });

    return Math.min(0.95, score);
  }

  /**
   * Analyze technical accuracy
   */
  private analyzeTechnicalAccuracy(content: string, questionType: string): number {
    let score = 0.75; // Base score

    const technicalTerms = [
      'framework', 'methodology', 'process', 'system', 'approach',
      'implementation', 'strategy', 'analysis', 'optimization', 'best practices'
    ];

    const contentLower = content.toLowerCase();
    technicalTerms.forEach(term => {
      if (contentLower.includes(term)) {
        score += 0.02;
      }
    });

    // Bonus for technical questions
    if (questionType === 'technical') {
      score += 0.1;
    }

    return Math.min(0.95, score);
  }

  /**
   * Analyze business relevance
   */
  private analyzeBusinessRelevance(content: string): number {
    let score = 0.7; // Base score

    const businessTerms = [
      'business', 'strategy', 'revenue', 'growth', 'market', 'customer',
      'value', 'roi', 'objectives', 'outcomes', 'success', 'competitive'
    ];

    const contentLower = content.toLowerCase();
    businessTerms.forEach(term => {
      if (contentLower.includes(term)) {
        score += 0.03;
      }
    });

    return Math.min(0.95, score);
  }

  /**
   * Analyze actionability
   */
  private analyzeActionability(content: string): number {
    let score = 0.6; // Base score

    const actionableTerms = [
      'step', 'phase', 'implement', 'execute', 'plan', 'approach',
      'recommend', 'suggest', 'consider', 'focus', 'prioritize', 'start'
    ];

    const contentLower = content.toLowerCase();
    actionableTerms.forEach(term => {
      if (contentLower.includes(term)) {
        score += 0.04;
      }
    });

    // Check for numbered lists or structured recommendations
    if (content.includes('1.') || content.includes('•') || content.includes('-')) {
      score += 0.1;
    }

    return Math.min(0.95, score);
  }

  /**
   * Analyze comprehensiveness
   */
  private analyzeComprehensiveness(content: string, frameworks: string[]): number {
    let score = 0.6; // Base score

    // Length bonus
    const wordCount = content.split(' ').length;
    if (wordCount > 200) score += 0.1;
    if (wordCount > 400) score += 0.1;

    // Framework usage bonus
    score += frameworks.length * 0.05;

    // Structure bonus
    if (content.includes('**') || content.includes('###')) {
      score += 0.1;
    }

    return Math.min(0.95, score);
  }

  /**
   * Analyze professional tone
   */
  private analyzeProfessionalTone(content: string): number {
    let score = 0.8; // Base score

    const professionalTerms = [
      'recommend', 'suggest', 'consider', 'approach', 'strategy',
      'framework', 'methodology', 'best practices', 'experience', 'expertise'
    ];

    const contentLower = content.toLowerCase();
    professionalTerms.forEach(term => {
      if (contentLower.includes(term)) {
        score += 0.02;
      }
    });

    // Penalty for informal language
    const informalTerms = ['gonna', 'wanna', 'kinda', 'sorta', 'yeah', 'ok'];
    informalTerms.forEach(term => {
      if (contentLower.includes(term)) {
        score -= 0.05;
      }
    });

    return Math.max(0.5, Math.min(0.95, score));
  }

  /**
   * Estimate user satisfaction based on performance metrics
   */
  private estimateUserSatisfaction(responseTime: number, qualityScores: any): number {
    let satisfaction = 0.8; // Base satisfaction

    // Response time impact
    if (responseTime < 1000) satisfaction += 0.1;
    else if (responseTime > 5000) satisfaction -= 0.2;

    // Quality impact
    const avgQuality = (qualityScores.personaAccuracy + qualityScores.technicalDepth + qualityScores.businessRelevance) / 3;
    satisfaction += (avgQuality - 0.7) * 0.5;

    return Math.max(0.1, Math.min(0.95, satisfaction));
  }

  /**
   * Get current system load (mock implementation)
   */
  private getCurrentSystemLoad(): number {
    return Math.random() * 0.3 + 0.1; // 10-40% load
  }

  /**
   * Get memory usage (mock implementation)
   */
  private getMemoryUsage(): number {
    return Math.random() * 30 + 20; // 20-50 MB
  }

  /**
   * Get CPU usage (mock implementation)
   */
  private getCpuUsage(): number {
    return Math.random() * 20 + 5; // 5-25%
  }

  /**
   * Get network latency (mock implementation)
   */
  private getNetworkLatency(): number {
    return Math.random() * 50 + 10; // 10-60ms
  }

  /**
   * Get cache hit rate (mock implementation)
   */
  private getCacheHitRate(): number {
    return Math.random() * 0.2 + 0.8; // 80-100%
  }

  /**
   * Get API availability (mock implementation)
   */
  private getApiAvailability(): number {
    return Math.random() * 0.05 + 0.95; // 95-100%
  }

  /**
   * Get error count (mock implementation)
   */
  private getErrorCount(): number {
    return Math.floor(Math.random() * 3); // 0-2 errors
  }

  /**
   * Calculate trend for a metric
   */
  private calculateTrend(metricName: string): 'improving' | 'stable' | 'declining' {
    // Mock implementation - would analyze historical data
    const trends = ['improving', 'stable', 'declining'] as const;
    return trends[Math.floor(Math.random() * trends.length)];
  }

  /**
   * Get latest metrics
   */
  private getLatestMetrics(): PerformanceMetrics {
    return this.metrics[this.metrics.length - 1] || {
      responseTime: 0,
      throughput: 0,
      errorRate: 0,
      qualityScore: 0,
      userSatisfaction: 0,
      systemLoad: 0
    };
  }

  /**
   * Get latest quality metrics
   */
  private getLatestQualityMetrics(): ResponseQualityMetrics {
    return this.qualityMetrics[this.qualityMetrics.length - 1] || {
      personaConsistency: 0,
      technicalAccuracy: 0,
      businessRelevance: 0,
      actionabilityScore: 0,
      comprehensiveness: 0,
      professionalTone: 0
    };
  }

  /**
   * Get latest system health
   */
  private getLatestSystemHealth(): SystemHealthMetrics {
    return this.systemHealth[this.systemHealth.length - 1] || {
      memoryUsage: 0,
      cpuUsage: 0,
      networkLatency: 0,
      cacheHitRate: 0,
      apiAvailability: 0,
      errorCount: 0
    };
  }

  /**
   * Get average response time
   */
  private getAverageResponseTime(): number {
    if (this.metrics.length === 0) return 0;
    return this.metrics.reduce((sum, m) => sum + m.responseTime, 0) / this.metrics.length;
  }

  /**
   * Get average quality
   */
  private getAverageQuality(): number {
    if (this.metrics.length === 0) return 0;
    return this.metrics.reduce((sum, m) => sum + m.qualityScore, 0) / this.metrics.length;
  }

  /**
   * Get average throughput
   */
  private getAverageThroughput(): number {
    if (this.metrics.length === 0) return 0;
    return this.metrics.reduce((sum, m) => sum + m.throughput, 0) / this.metrics.length;
  }

  /**
   * Get average error rate
   */
  private getAverageErrorRate(): number {
    if (this.metrics.length === 0) return 0;
    return this.metrics.reduce((sum, m) => sum + m.errorRate, 0) / this.metrics.length;
  }

  /**
   * Get all metrics for analysis
   */
  getAllMetrics(): {
    performance: PerformanceMetrics[];
    quality: ResponseQualityMetrics[];
    systemHealth: SystemHealthMetrics[];
  } {
    return {
      performance: [...this.metrics],
      quality: [...this.qualityMetrics],
      systemHealth: [...this.systemHealth]
    };
  }

  /**
   * Reset all metrics
   */
  resetMetrics(): void {
    this.metrics = [];
    this.qualityMetrics = [];
    this.systemHealth = [];
    console.log('📊 Performance metrics reset');
  }
}

// Export singleton instance
export const performanceMonitoringService = new PerformanceMonitoringService();