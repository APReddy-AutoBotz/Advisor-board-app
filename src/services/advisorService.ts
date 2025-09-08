import type { Advisor, AdvisorResponse, PersonaConfig } from '../types/domain';
import { yamlConfigLoader } from './yamlConfigLoader';

export interface AdvisorServiceConfig {
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export class AdvisorServiceError extends Error {
  constructor(
    message: string,
    public readonly advisorId: string,
    public readonly code: 'TIMEOUT' | 'NETWORK_ERROR' | 'PERSONA_ERROR' | 'UNKNOWN'
  ) {
    super(message);
    this.name = 'AdvisorServiceError';
  }
}

export class AdvisorService {
  private static instance: AdvisorService;
  private config: AdvisorServiceConfig;

  constructor(config: Partial<AdvisorServiceConfig> = {}) {
    this.config = {
      timeout: 30000, // 30 seconds
      retryAttempts: 3,
      retryDelay: 1000, // 1 second
      ...config,
    };
  }

  static getInstance(config?: Partial<AdvisorServiceConfig>): AdvisorService {
    if (!AdvisorService.instance) {
      AdvisorService.instance = new AdvisorService(config);
    }
    return AdvisorService.instance;
  }

  /**
   * Generate response from a single advisor using their persona configuration
   */
  async generateAdvisorResponse(
    advisor: Advisor,
    prompt: string,
    sessionContext?: string
  ): Promise<AdvisorResponse> {
    const personaConfig = this.createPersonaConfig(advisor);
    
    try {
      const response = await this.callKiroPersona(advisor, prompt, personaConfig, sessionContext);
      
      return {
        advisorId: advisor.id,
        content: response,
        timestamp: new Date(),
        persona: personaConfig,
      };
    } catch (error) {
      throw new AdvisorServiceError(
        `Failed to generate response for ${advisor.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        advisor.id,
        this.categorizeError(error)
      );
    }
  }

  /**
   * Generate responses from multiple advisors simultaneously
   */
  async generateMultipleResponses(
    advisors: Advisor[],
    prompt: string,
    sessionContext?: string
  ): Promise<AdvisorResponse[]> {
    const responsePromises = advisors.map(advisor =>
      this.generateAdvisorResponseWithRetry(advisor, prompt, sessionContext)
    );

    const results = await Promise.allSettled(responsePromises);
    const responses: AdvisorResponse[] = [];
    const errors: AdvisorServiceError[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        responses.push(result.value);
      } else {
        const advisor = advisors[index];
        errors.push(new AdvisorServiceError(
          `Failed to get response from ${advisor.name}`,
          advisor.id,
          'UNKNOWN'
        ));
      }
    });

    // If all responses failed, throw an error
    if (responses.length === 0 && errors.length > 0) {
      throw new AdvisorServiceError(
        'All advisor responses failed',
        'multiple',
        'UNKNOWN'
      );
    }

    // Log partial failures but return successful responses
    if (errors.length > 0) {
      console.warn('Some advisor responses failed:', errors);
    }

    return responses;
  }

  /**
   * Create persona configuration from advisor data
   */
  private createPersonaConfig(advisor: Advisor): PersonaConfig {
    return {
      name: advisor.name,
      expertise: advisor.expertise,
      background: advisor.background,
      tone: this.getDomainTone(advisor.domain.id),
      specialization: this.extractSpecializations(advisor.expertise),
    };
  }

  /**
   * Get domain-specific tone for persona
   */
  private getDomainTone(domainId: string): string {
    const toneMap: Record<string, string> = {
      cliniboard: 'professional, evidence-based, regulatory-focused',
      eduboard: 'pedagogical, inclusive, reform-minded',
      remediboard: 'holistic, traditional, wellness-oriented',
    };
    return toneMap[domainId] || 'professional, knowledgeable';
  }

  /**
   * Extract specialization keywords from expertise string
   */
  private extractSpecializations(expertise: string): string[] {
    // Simple keyword extraction - could be enhanced with NLP
    const keywords = expertise.toLowerCase()
      .split(/[,\s]+/)
      .filter(word => word.length > 3)
      .slice(0, 5); // Limit to 5 keywords
    
    return keywords;
  }

  /**
   * Call Kiro's AI persona system (placeholder for actual implementation)
   */
  private async callKiroPersona(
    advisor: Advisor,
    prompt: string,
    personaConfig: PersonaConfig,
    sessionContext?: string
  ): Promise<string> {
    // Validate prompt
    if (!prompt || !prompt.trim()) {
      throw new AdvisorServiceError(
        'Prompt cannot be empty',
        advisor.id,
        'PERSONA_ERROR'
      );
    }

    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Request timeout'));
      }, this.config.timeout);
    });

    // Simulate Kiro persona call - replace with actual Kiro integration
    const personaPromise = this.simulateKiroPersonaCall(advisor, prompt, personaConfig, sessionContext);

    try {
      return await Promise.race([personaPromise, timeoutPromise]);
    } catch (error) {
      if (error instanceof Error && error.message === 'Request timeout') {
        throw new AdvisorServiceError(
          `Timeout waiting for response from ${advisor.name}`,
          advisor.id,
          'TIMEOUT'
        );
      }
      throw error;
    }
  }

  /**
   * Simulate Kiro persona call - replace with actual implementation
   */
  private async simulateKiroPersonaCall(
    advisor: Advisor,
    prompt: string,
    personaConfig: PersonaConfig,
    sessionContext?: string
  ): Promise<string> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Create persona-specific response based on domain and expertise
    const domainResponses = {
      cliniboard: this.generateClinicalResponse(advisor, prompt, personaConfig),
      eduboard: this.generateEducationResponse(advisor, prompt, personaConfig),
      remediboard: this.generateRemediesResponse(advisor, prompt, personaConfig),
    };

    const response = domainResponses[advisor.domain.id as keyof typeof domainResponses] ||
      this.generateGenericResponse(advisor, prompt, personaConfig);

    return response;
  }

  /**
   * Generate clinical domain response
   */
  private generateClinicalResponse(advisor: Advisor, prompt: string, persona: PersonaConfig): string {
    const responses = [
      `From a ${persona.expertise.toLowerCase()} perspective, I need to emphasize the regulatory implications here. ${prompt.includes('trial') ? 'This trial design requires careful consideration of FDA guidance documents.' : 'We must ensure compliance with ICH-GCP standards.'}`,
      `Based on my experience in ${persona.expertise.toLowerCase()}, the key considerations are safety monitoring and data integrity. ${prompt.includes('adverse') ? 'These adverse events require immediate SUSAR reporting.' : 'We need robust pharmacovigilance protocols.'}`,
      `As someone with ${persona.background.toLowerCase()}, I recommend a risk-based approach. The regulatory pathway should align with current FDA/EMA expectations for this indication.`,
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Generate education domain response
   */
  private generateEducationResponse(advisor: Advisor, prompt: string, persona: PersonaConfig): string {
    const responses = [
      `From an educational equity standpoint, we need to consider how this impacts underserved communities. My background in ${persona.expertise.toLowerCase()} suggests we should prioritize inclusive design.`,
      `Based on pedagogical research, the most effective approach would be to implement evidence-based practices. ${prompt.includes('curriculum') ? 'Curriculum reform should be data-driven and student-centered.' : 'We need to focus on measurable learning outcomes.'}`,
      `Drawing from my experience in ${persona.expertise.toLowerCase()}, I recommend a systems thinking approach that addresses root causes rather than symptoms.`,
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Generate remedies domain response
   */
  private generateRemediesResponse(advisor: Advisor, prompt: string, persona: PersonaConfig): string {
    const responses = [
      `From a holistic wellness perspective, we should consider the whole person approach. My expertise in ${persona.expertise.toLowerCase()} emphasizes the importance of natural healing processes.`,
      `Traditional medicine teaches us that ${prompt.includes('treatment') ? 'treatment should work with the body\'s natural healing mechanisms' : 'prevention is always preferable to intervention'}. We need to honor both ancient wisdom and modern safety standards.`,
      `Based on my background in ${persona.expertise.toLowerCase()}, I recommend integrating traditional practices with evidence-based approaches for optimal patient outcomes.`,
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Generate generic response fallback
   */
  private generateGenericResponse(advisor: Advisor, prompt: string, persona: PersonaConfig): string {
    return `Based on my expertise in ${persona.expertise}, I believe this requires careful consideration of multiple factors. My background in ${persona.background.toLowerCase()} suggests we should approach this systematically and consider all stakeholders involved.`;
  }

  /**
   * Generate response with retry logic
   */
  private async generateAdvisorResponseWithRetry(
    advisor: Advisor,
    prompt: string,
    sessionContext?: string
  ): Promise<AdvisorResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        return await this.generateAdvisorResponse(advisor, prompt, sessionContext);
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.config.retryAttempts) {
          // Wait before retrying
          await new Promise(resolve => 
            setTimeout(resolve, this.config.retryDelay * attempt)
          );
        }
      }
    }

    throw lastError || new Error('All retry attempts failed');
  }

  /**
   * Categorize error types for better error handling
   */
  private categorizeError(error: unknown): 'TIMEOUT' | 'NETWORK_ERROR' | 'PERSONA_ERROR' | 'UNKNOWN' {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (message.includes('timeout')) return 'TIMEOUT';
      if (message.includes('network') || message.includes('fetch') || message.includes('connection')) return 'NETWORK_ERROR';
      if (message.includes('persona')) return 'PERSONA_ERROR';
    }
    return 'UNKNOWN';
  }

  /**
   * Update service configuration
   */
  updateConfig(newConfig: Partial<AdvisorServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Generate a summary of multiple advisor responses
   */
  async generateResponseSummary(
    responses: AdvisorResponse[],
    originalPrompt: string
  ): Promise<string> {
    if (responses.length === 0) {
      throw new AdvisorServiceError(
        'Cannot generate summary: no responses provided',
        'summary',
        'PERSONA_ERROR'
      );
    }

    if (responses.length === 1) {
      return `**Single Advisor Summary**\n\n${responses[0].persona.name} provided insights based on their expertise in ${responses[0].persona.expertise}. Their response emphasized the importance of considering this question from their specialized perspective.`;
    }

    try {
      // Create a timeout promise for summary generation
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Summary generation timeout'));
        }, this.config.timeout);
      });

      // Generate summary - replace with actual Kiro integration
      const summaryPromise = this.generateSummaryContent(responses, originalPrompt);

      return await Promise.race([summaryPromise, timeoutPromise]);
    } catch (error) {
      if (error instanceof Error && error.message === 'Summary generation timeout') {
        throw new AdvisorServiceError(
          'Timeout while generating response summary',
          'summary',
          'TIMEOUT'
        );
      }
      throw new AdvisorServiceError(
        `Failed to generate summary: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'summary',
        'PERSONA_ERROR'
      );
    }
  }

  /**
   * Generate summary content by analyzing and synthesizing responses
   */
  private async generateSummaryContent(
    responses: AdvisorResponse[],
    originalPrompt: string
  ): Promise<string> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

    // Extract key themes and insights from responses
    const advisorNames = responses.map(r => r.persona.name);
    const domains = [...new Set(responses.map(r => this.getDomainFromExpertise(r.persona.expertise)))];
    const keyInsights = this.extractKeyInsights(responses);
    const commonThemes = this.findCommonThemes(responses);
    const uniquePerspectives = this.identifyUniquePerspectives(responses);

    // Build structured summary
    let summary = `**Advisory Board Summary**\n\n`;
    summary += `**Question:** ${originalPrompt}\n\n`;
    summary += `**Advisors Consulted:** ${advisorNames.join(', ')}\n`;
    summary += `**Domains Represented:** ${domains.join(', ')}\n\n`;

    if (commonThemes.length > 0) {
      summary += `**Consensus Points:**\n`;
      commonThemes.forEach((theme, index) => {
        summary += `${index + 1}. ${theme}\n`;
      });
      summary += `\n`;
    }

    if (keyInsights.length > 0) {
      summary += `**Key Insights:**\n`;
      keyInsights.forEach((insight, index) => {
        summary += `${index + 1}. ${insight}\n`;
      });
      summary += `\n`;
    }

    if (uniquePerspectives.length > 0) {
      summary += `**Unique Perspectives:**\n`;
      uniquePerspectives.forEach((perspective, index) => {
        summary += `${index + 1}. ${perspective}\n`;
      });
      summary += `\n`;
    }

    summary += `**Recommendation:**\n`;
    summary += this.generateRecommendation(responses, domains);

    return summary;
  }

  /**
   * Extract domain from expertise string
   */
  private getDomainFromExpertise(expertise: string): string {
    const expertiseLower = expertise.toLowerCase();
    if (expertiseLower.includes('clinical') || expertiseLower.includes('regulatory') || expertiseLower.includes('trial')) {
      return 'Clinical Research';
    }
    if (expertiseLower.includes('education') || expertiseLower.includes('pedagogy') || expertiseLower.includes('curriculum')) {
      return 'Education';
    }
    if (expertiseLower.includes('traditional') || expertiseLower.includes('holistic') || expertiseLower.includes('natural')) {
      return 'Natural Remedies';
    }
    return 'General Advisory';
  }

  /**
   * Extract key insights from responses
   */
  private extractKeyInsights(responses: AdvisorResponse[]): string[] {
    const insights: string[] = [];
    
    responses.forEach(response => {
      const content = response.content;
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
      
      // Look for sentences that contain key insight indicators
      const insightSentences = sentences.filter(sentence => {
        const lower = sentence.toLowerCase();
        return lower.includes('recommend') || 
               lower.includes('important') || 
               lower.includes('key') || 
               lower.includes('critical') ||
               lower.includes('essential') ||
               lower.includes('should') ||
               lower.includes('must');
      });

      if (insightSentences.length > 0) {
        const insight = insightSentences[0].trim();
        if (insight && !insights.some(existing => existing.includes(insight.substring(0, 30)))) {
          insights.push(`${response.persona.name}: ${insight}`);
        }
      }
    });

    return insights.slice(0, 5); // Limit to 5 key insights
  }

  /**
   * Find common themes across responses
   */
  private findCommonThemes(responses: AdvisorResponse[]): string[] {
    const themes: string[] = [];
    
    // Look for common keywords and concepts
    const allContent = responses.map(r => r.content.toLowerCase()).join(' ');
    const commonWords = ['safety', 'evidence', 'approach', 'consider', 'implementation', 'research', 'practice', 'patient', 'student', 'holistic', 'regulatory', 'clinical', 'compliance', 'guidelines', 'protocols'];
    
    commonWords.forEach(word => {
      const occurrences = (allContent.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
      if (occurrences >= Math.min(2, responses.length)) {
        const advisorsUsingWord = responses.filter(r => 
          r.content.toLowerCase().includes(word)
        ).map(r => r.persona.name);
        
        if (advisorsUsingWord.length >= Math.max(2, Math.ceil(responses.length / 2))) {
          themes.push(`Multiple advisors (${advisorsUsingWord.join(', ')}) emphasized the importance of ${word}-focused considerations`);
        }
      }
    });

    // If no themes found with strict criteria, try with looser criteria
    if (themes.length === 0 && responses.length >= 2) {
      commonWords.forEach(word => {
        const advisorsUsingWord = responses.filter(r => 
          r.content.toLowerCase().includes(word)
        ).map(r => r.persona.name);
        
        if (advisorsUsingWord.length >= 2) {
          themes.push(`Multiple advisors (${advisorsUsingWord.join(', ')}) emphasized the importance of ${word}-focused considerations`);
        }
      });
    }

    return themes.slice(0, 3); // Limit to 3 common themes
  }

  /**
   * Identify unique perspectives from each advisor
   */
  private identifyUniquePerspectives(responses: AdvisorResponse[]): string[] {
    const perspectives: string[] = [];
    
    responses.forEach(response => {
      const expertise = response.persona.expertise.toLowerCase();
      let perspective = '';
      
      if (expertise.includes('clinical') || expertise.includes('regulatory')) {
        perspective = `${response.persona.name} brought regulatory and clinical trial expertise, emphasizing compliance and safety protocols`;
      } else if (expertise.includes('education') || expertise.includes('pedagogy')) {
        perspective = `${response.persona.name} provided educational reform insights, focusing on equity and evidence-based pedagogical approaches`;
      } else if (expertise.includes('traditional') || expertise.includes('holistic')) {
        perspective = `${response.persona.name} offered traditional medicine wisdom, emphasizing holistic and natural healing approaches`;
      } else {
        perspective = `${response.persona.name} contributed specialized insights from their ${response.persona.expertise} background`;
      }
      
      if (perspective) {
        perspectives.push(perspective);
      }
    });

    return perspectives;
  }

  /**
   * Generate overall recommendation based on all responses
   */
  private generateRecommendation(responses: AdvisorResponse[], domains: string[]): string {
    if (domains.length === 1) {
      return `Based on the ${domains[0].toLowerCase()} expertise consulted, a focused approach within this domain is recommended. Consider implementing the suggested strategies while maintaining alignment with domain-specific best practices.`;
    }
    
    if (domains.length === 2) {
      return `The multi-domain perspective from ${domains.join(' and ')} provides valuable complementary insights. Consider an integrated approach that balances the recommendations from both domains while addressing any potential conflicts between different methodologies.`;
    }
    
    return `The comprehensive multi-domain consultation across ${domains.join(', ')} offers a holistic view of the challenge. Consider developing a phased implementation strategy that incorporates insights from all domains, starting with areas of consensus and gradually addressing domain-specific considerations.`;
  }

  /**
   * Get current configuration
   */
  getConfig(): AdvisorServiceConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const advisorService = AdvisorService.getInstance();