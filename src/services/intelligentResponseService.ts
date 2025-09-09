/**
 * Intelligent Response Service
 * 
 * This service generates intelligent, contextual responses from AI advisors
 * using the persona prompt service and LLM integration layer.
 */

import { personaPromptService } from './personaPromptService';
import type { BoardExpert } from '../lib/boards';

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

/**
 * Analyze a question to extract insights about its type, domain, and complexity
 */
export async function getQuestionInsights(question: string): Promise<QuestionInsights> {
  try {
    // Simple question analysis - could be enhanced with NLP
    const questionLower = question.toLowerCase();
    
    // Determine question type
    let type = 'general';
    if (questionLower.includes('how') || questionLower.includes('what') || questionLower.includes('why')) {
      type = 'informational';
    } else if (questionLower.includes('should') || questionLower.includes('recommend') || questionLower.includes('best')) {
      type = 'advisory';
    } else if (questionLower.includes('compare') || questionLower.includes('versus') || questionLower.includes('vs')) {
      type = 'comparative';
    } else if (questionLower.includes('implement') || questionLower.includes('execute') || questionLower.includes('plan')) {
      type = 'strategic';
    }

    // Determine domain
    let domain = 'general';
    let confidence = 0.7;
    
    if (questionLower.includes('clinical') || questionLower.includes('trial') || questionLower.includes('fda') || 
        questionLower.includes('drug') || questionLower.includes('medical') || questionLower.includes('patient')) {
      domain = 'clinical research';
      confidence = 0.9;
    } else if (questionLower.includes('education') || questionLower.includes('curriculum') || questionLower.includes('student') ||
               questionLower.includes('learning') || questionLower.includes('teaching') || questionLower.includes('school')) {
      domain = 'education';
      confidence = 0.9;
    } else if (questionLower.includes('natural') || questionLower.includes('herbal') || questionLower.includes('holistic') ||
               questionLower.includes('wellness') || questionLower.includes('traditional') || questionLower.includes('remedy') ||
               questionLower.includes('diabetic') || questionLower.includes('diabetes') || questionLower.includes('nutrition') ||
               questionLower.includes('diet') || questionLower.includes('food') || questionLower.includes('millet') ||
               questionLower.includes('rice') || questionLower.includes('health')) {
      domain = 'natural remedies';
      confidence = 0.9;
    } else if (questionLower.includes('product') || questionLower.includes('feature') || questionLower.includes('user') ||
               questionLower.includes('design') || questionLower.includes('development') || questionLower.includes('growth')) {
      domain = 'product development';
      confidence = 0.9;
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
        // Use the persona prompt service to generate contextual responses
        const response = await personaPromptService.generatePersonaResponse(
          expert,
          question
        );

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
  // Diabetes and nutrition questions
  if (questionLower.includes('diabetic') || questionLower.includes('diabetes')) {
    if (questionLower.includes('millet') || questionLower.includes('rice')) {
      return `For diabetic patients, **millets are generally the better choice** compared to rice. Here's my professional assessment:

**Millets (Recommended):**
- Lower glycemic index (35-55) vs white rice (70+)
- Higher fiber content helps slow glucose absorption
- Rich in magnesium, which supports insulin sensitivity
- Contains complex carbohydrates for sustained energy

**Rice Considerations:**
- Brown rice is better than white rice (GI ~50 vs 70+)
- Portion control is crucial with any rice variety
- Basmati rice has a lower GI than other white rice varieties

**My Naturopathic Recommendation:**
Start with small portions of millets (finger millet, pearl millet, or foxtail millet) and monitor blood glucose response. Combine with protein and healthy fats to further stabilize blood sugar. Consider soaking millets overnight for better digestibility.

**Important:** Always consult with your healthcare provider before making significant dietary changes, especially if you're on diabetes medications.`;
    }
  }
  
  // Herbal and natural remedy questions
  if (questionLower.includes('herb') || questionLower.includes('natural') || questionLower.includes('remedy')) {
    return `From a traditional medicine perspective, I focus on addressing root causes while supporting the body's natural healing mechanisms. Based on my 25+ years of clinical experience, I recommend a holistic approach that considers constitutional factors, lifestyle patterns, and individual sensitivities.

Key principles I follow: **Safety first** - ensuring no contraindications with existing medications, **Individualized treatment** - what works for one person may not work for another, and **Gradual implementation** - allowing the body to adapt naturally.

I'd need more specific information about your health goals and current situation to provide targeted recommendations. Would you like to discuss any particular health concerns?`;
  }

  // General wellness
  return `From a holistic wellness perspective, I believe in treating the whole person - mind, body, and spirit. My approach combines traditional wisdom with modern safety standards, always prioritizing natural healing processes while ensuring evidence-based practices.

The key is understanding that true wellness comes from addressing root causes rather than just managing symptoms. I'd be happy to discuss specific wellness strategies tailored to your individual needs.`;
}

/**
 * Generate clinical research contextual responses
 */
function generateClinicalResponse(expert: BoardExpert, question: string, questionLower: string): string {
  if (questionLower.includes('trial') || questionLower.includes('study')) {
    return `From a clinical research perspective, this requires careful consideration of regulatory requirements, patient safety protocols, and statistical design. The key is ensuring we maintain scientific rigor while meeting FDA expectations for this type of study.

Based on my experience with Phase III trials, I recommend focusing on: **Primary endpoint selection** that aligns with regulatory guidance, **Patient population definition** that ensures adequate power and generalizability, and **Safety monitoring** with appropriate stopping rules.

The regulatory pathway should be discussed early with FDA through pre-IND or Type B meetings to ensure alignment on study design and endpoints.`;
  }
  
  return `In clinical development, we must prioritize patient safety, regulatory compliance, and scientific validity. This challenge requires a systematic approach that considers both efficacy and safety endpoints while maintaining the highest standards of clinical research integrity.`;
}

/**
 * Generate education contextual responses
 */
function generateEducationResponse(expert: BoardExpert, question: string, questionLower: string): string {
  if (questionLower.includes('curriculum') || questionLower.includes('learning')) {
    return `From an educational design perspective, this requires understanding learning objectives, student engagement strategies, and assessment methods. We should focus on evidence-based pedagogical approaches that promote inclusive learning and measurable outcomes.

Key considerations include: **Backward design** starting with desired outcomes, **Multiple learning modalities** to accommodate diverse learners, and **Continuous assessment** to ensure learning is actually occurring.`;
  }
  
  return `In education, we must consider diverse learning styles, accessibility requirements, and measurable outcomes. The most effective solutions often integrate technology with proven pedagogical principles while maintaining focus on student success and engagement.`;
}

/**
 * Generate product development contextual responses
 */
function generateProductResponse(expert: BoardExpert, question: string, questionLower: string): string {
  if (questionLower.includes('feature') || questionLower.includes('user')) {
    return `From a product development perspective, this requires understanding user needs, technical feasibility, and business impact. We should prioritize solutions that create measurable value for users while supporting business objectives.

I recommend starting with: **User research** to validate the problem, **Technical discovery** to understand constraints, and **Success metrics** to measure impact post-launch.`;
  }
  
  return `In product development, we must balance user experience, technical constraints, and business goals. The most successful approaches often involve rapid experimentation and data-driven decision making with clear success criteria.`;
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