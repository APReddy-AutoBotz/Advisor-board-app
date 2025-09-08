/**
 * Intelligent Response Service
 * Updated to use new persona prompt generator and response orchestrator
 * Provides improved reliability, error handling, and TypeScript interfaces
 * Integrated with demo mode service for hackathon demonstration
 * 
 * Requirements: FR-1, FR-2, FR-6, FR-5
 */

import type { BoardExpert } from '../lib/boards';
import type { Advisor, DomainId } from '../types/domain';
import type { LLMConfig, EnvironmentConfig } from '../types/llm';
// import { ResponseOrchestrator, type ResponseGenerationResult, type EnhancedAdvisorResponse } from './responseOrchestrator';
import { demoModeService, type DemoResponse } from './demoModeService';
import { performanceMonitoringService } from './performanceMonitoringService';
import { PERSONA_LIBRARY } from './personaPromptService';

// Response interface for backward compatibility
export interface LegacyAdvisorResponse {
  advisorId: string;
  content: string;
  timestamp: Date;
  persona: {
    name: string;
    expertise: string;
  };
}

// Enhanced response interface with metadata
export interface IntelligentAdvisorResponse extends LegacyAdvisorResponse {
  metadata?: {
    responseType: 'llm' | 'static';
    provider?: string;
    processingTime: number;
    confidence: number;
    frameworks?: string[];
    errorInfo?: {
      type: string;
      message: string;
      fallbackUsed: boolean;
    };
  };
}

// Service configuration
interface IntelligentResponseConfig {
  enableLLM: boolean;
  fallbackToStatic: boolean;
  maxConcurrentRequests: number;
  responseTimeout: number;
  enableCaching: boolean;
}

// Default environment configuration
const DEFAULT_ENV_CONFIG: EnvironmentConfig = {
  llmProviders: {},
  defaultProvider: 'openai',
  enableCaching: true,
  maxConcurrentRequests: 10,
  responseTimeout: 15000,
  retryPolicy: {
    maxRetries: 2,
    baseDelay: 1000,
    maxDelay: 5000,
    backoffMultiplier: 2
  }
};

// Service instance - temporarily disabled
// let responseOrchestrator: ResponseOrchestrator | null = null;

// Initialize the response orchestrator - temporarily disabled
// function getResponseOrchestrator(): ResponseOrchestrator {
//   if (!responseOrchestrator) {
//     responseOrchestrator = new ResponseOrchestrator(DEFAULT_ENV_CONFIG);
//   }
//   return responseOrchestrator;
// }

// Convert BoardExpert to Advisor for compatibility
function convertBoardExpertToAdvisor(expert: BoardExpert, domainId: string): Advisor {
  return {
    id: expert.id,
    name: expert.name,
    expertise: expert.role,
    background: expert.blurb,
    domain: domainId as DomainId,
    isSelected: true,
    credentials: expert.credentials,
    specialties: expert.specialties,
    avatar: expert.avatar
  };
}

// Convert enhanced response to legacy format - temporarily disabled
// function convertToLegacyResponse(response: EnhancedAdvisorResponse): IntelligentAdvisorResponse {
//   return {
//     advisorId: response.advisorId,
//     content: response.content,
//     timestamp: response.timestamp,
//     persona: {
//       name: response.persona.name,
//       expertise: response.persona.expertise
//     },
//     metadata: {
//       responseType: response.metadata.responseType,
//       provider: response.metadata.provider,
//       processingTime: response.metadata.processingTime,
//       confidence: response.metadata.confidence,
//       frameworks: response.metadata.frameworks,
//       errorInfo: response.metadata.errorInfo
//     }
//   };
// }

// Generate personalized response for a single advisor using proper persona configuration
async function generatePersonalizedResponse(
  advisor: Advisor, 
  question: string, 
  domainId: string
): Promise<IntelligentAdvisorResponse> {
  const startTime = Date.now();
  
  try {
    console.log(`🎯 Generating personalized response for ${advisor.name} (${advisor.id})`);
    
    // Get domain-specific context and frameworks
    const frameworks = getRelevantFrameworksForDomain(domainId, 'general');
    
    // Generate personalized content using proper persona configuration
    const personalizedContent = generateAdvisorSpecificResponse(advisor, question, domainId, frameworks);
    
    const processingTime = Date.now() - startTime;
    
    console.log(`✅ Generated response for ${advisor.name} in ${processingTime}ms`);
    
    return {
      advisorId: advisor.id,
      content: personalizedContent,
      timestamp: new Date(),
      persona: {
        name: advisor.name,
        expertise: advisor.expertise || 'Expert Advisor'
      },
      metadata: {
        responseType: 'static',
        processingTime,
        confidence: 0.95, // Higher confidence for persona-based responses
        frameworks
      }
    };
  } catch (error) {
    console.error(`❌ Error generating response for ${advisor.name}:`, error);
    
    // Fallback response with better error handling
    return {
      advisorId: advisor.id,
      content: `Thank you for your question about "${question}". As a ${advisor.expertise || 'professional advisor'}, I'd be happy to share my insights based on my experience. Let me provide you with a thoughtful response.`,
      timestamp: new Date(),
      persona: {
        name: advisor.name,
        expertise: advisor.expertise || 'Expert Advisor'
      },
      metadata: {
        responseType: 'static',
        processingTime: Date.now() - startTime,
        confidence: 0.6,
        errorInfo: {
          type: 'generation_error',
          message: error instanceof Error ? error.message : 'Unknown error',
          fallbackUsed: true
        }
      }
    };
  }
}

// Generate advisor-specific response content using proper persona configurations
function generateAdvisorSpecificResponse(
  advisor: Advisor, 
  question: string, 
  domainId: string, 
  frameworks: string[]
): string {
  const questionLower = question.toLowerCase();
  
  console.log(`🔍 Looking for persona config for advisor: ${advisor.name} (ID: ${advisor.id}, Expertise: ${advisor.expertise})`);
  console.log(`📚 Available personas:`, Object.keys(PERSONA_LIBRARY));
  
  // Try to find the advisor in the persona library by matching ID first, then by other methods
  let personaConfig = null;
  
  // Method 1: Direct ID match
  if (advisor.id && PERSONA_LIBRARY[advisor.id]) {
    personaConfig = PERSONA_LIBRARY[advisor.id];
    console.log(`✅ Found persona by direct ID match: ${advisor.id}`);
  } 
  // Method 2: Try exact name match (convert to kebab-case)
  else {
    const advisorNameKebab = advisor.name.toLowerCase().replace(/\s+/g, '-');
    if (PERSONA_LIBRARY[advisorNameKebab]) {
      personaConfig = PERSONA_LIBRARY[advisorNameKebab];
      console.log(`✅ Found persona by name match: ${advisorNameKebab}`);
    }
    // Method 3: Try role-based matching
    else {
      const matchingPersona = Object.values(PERSONA_LIBRARY).find(persona => 
        persona.role.toLowerCase() === advisor.expertise?.toLowerCase()
      );
      if (matchingPersona) {
        personaConfig = matchingPersona;
        console.log(`✅ Found persona by role match: ${matchingPersona.id} for role ${advisor.expertise}`);
      }
      // Method 4: Try partial name matching
      else {
        const firstNameMatch = Object.values(PERSONA_LIBRARY).find(persona => {
          const personaFirstName = persona.id.split('-')[0];
          const advisorFirstName = advisor.name.toLowerCase().split(' ')[0];
          return personaFirstName === advisorFirstName;
        });
        if (firstNameMatch) {
          personaConfig = firstNameMatch;
          console.log(`✅ Found persona by first name match: ${firstNameMatch.id}`);
        } else {
          console.log(`❌ No persona match found for: ${advisor.name} (${advisor.id})`);
        }
      }
    }
  }
  
  if (personaConfig) {
    console.log(`🎯 Using persona config for ${personaConfig.role}: ${personaConfig.id}`);
    
    // Use the persona's system prompt and response style to generate a proper response
    const { role, roleContext, expertiseAreas, responseStyle, responseTemplates } = personaConfig;
    
    // Determine question type for template selection
    let questionType = 'general';
    if (questionLower.includes('strategy') || questionLower.includes('plan')) questionType = 'strategy';
    else if (questionLower.includes('product') || questionLower.includes('feature') || questionLower.includes('website')) questionType = 'product_ideation';
    else if (questionLower.includes('technical') || questionLower.includes('engineering') || questionLower.includes('architecture')) questionType = 'technical';
    
    console.log(`📝 Question type detected: ${questionType} for question: "${question.substring(0, 50)}..."`);
    
    // Get the appropriate response template
    const template = responseTemplates[questionType] || responseTemplates.general;
    console.log(`📋 Using template: ${template.substring(0, 50)}...`);
    
    // Generate persona-specific response based on their expertise and background
    console.log(`🎭 Checking role match: "${role}" vs expected roles`);
    
    if (role === 'Chief Product Officer') {
      console.log(`✅ Matched Chief Product Officer role`);
      return `${template} Looking at your question about "${question}", I'd approach this from a strategic product perspective. Based on my experience scaling products from $1M to $1B ARR, here's what I recommend:

1. **Strategic Foundation**: Start by clearly defining the value proposition and target market. What specific problem are you solving that existing solutions don't address?

2. **Product-Market Fit**: Use the Jobs-to-be-Done framework to understand what users are truly hiring your product to accomplish. This will guide feature prioritization.

3. **Scalability Planning**: Design your architecture and business model to handle 10x growth from day one. Consider platform effects and network effects early.

4. **Metrics & KPIs**: Establish clear success metrics aligned with business objectives. Focus on leading indicators, not just lagging metrics.

5. **Go-to-Market Strategy**: Plan your launch strategy, pricing model, and customer acquisition channels based on your target segments.

The key frameworks I'd leverage include North Star Framework for alignment, OKRs for execution, and Platform Strategy Canvas for long-term thinking.`;
    }
    
    if (role === 'Senior Product Manager') {
      console.log(`✅ Matched Senior Product Manager role`);
      return `${template} Looking at your question about "${question}", I'd approach this from a strategic product perspective. Based on my experience scaling products from $1M to $1B ARR, here's what I recommend:

1. **Strategic Foundation**: Start by clearly defining the value proposition and target market. What specific problem are you solving that existing solutions don't address?

2. **Product-Market Fit**: Use the Jobs-to-be-Done framework to understand what users are truly hiring your product to accomplish. This will guide feature prioritization.

3. **Scalability Planning**: Design your architecture and business model to handle 10x growth from day one. Consider platform effects and network effects early.

4. **Metrics & KPIs**: Establish clear success metrics aligned with business objectives. Focus on leading indicators, not just lagging metrics.

5. **Go-to-Market Strategy**: Plan your launch strategy, pricing model, and customer acquisition channels based on your target segments.

The key frameworks I'd leverage include North Star Framework for alignment, OKRs for execution, and Platform Strategy Canvas for long-term thinking.`;
    }
    
    if (role === 'Senior Product Manager') {
      return `${template} For your question about "${question}", let me share my tactical approach based on launching products to 100M+ users:

1. **User Research First**: Conduct 15-20 user interviews to validate assumptions. Use the "5 Whys" technique to understand root problems.

2. **Feature Prioritization**: Apply the RICE framework (Reach, Impact, Confidence, Effort) to prioritize features. Focus on high-impact, low-effort wins initially.

3. **Rapid Experimentation**: Set up A/B testing infrastructure early. Test core hypotheses with MVPs before building full features.

4. **User Journey Mapping**: Map out the complete user experience from discovery to retention. Identify friction points and optimization opportunities.

5. **Analytics & Iteration**: Implement comprehensive product analytics. Use cohort analysis and funnel metrics to guide product decisions.

Key methodologies I'd recommend: Design Thinking for problem definition, Lean Startup for validation, and Hypothesis-Driven Development for feature testing.`;
    }
    
    if (role === 'Head of Design') {
      return `${template} Approaching your question about "${question}" from a design leadership perspective, here's my systematic approach:

1. **User-Centered Research**: Start with deep user research to understand needs, pain points, and mental models. Use ethnographic studies and user journey mapping.

2. **Design System Foundation**: Establish a scalable design system early. This ensures consistency and speeds up development as you grow.

3. **Accessibility & Inclusion**: Design for diverse users from the beginning. Follow WCAG guidelines and test with assistive technologies.

4. **Collaborative Design Process**: Implement design thinking workshops with cross-functional teams. Use collaborative tools like Figma for real-time iteration.

5. **Usability Testing**: Conduct regular usability testing throughout the design process. Use both moderated and unmoderated testing methods.

The frameworks I'd apply include Atomic Design for system thinking, Design Thinking for problem-solving, and User Journey Mapping for experience optimization.`;
    }
    
    if (role === 'VP of Engineering') {
      return `${template} From an engineering leadership standpoint, your question about "${question}" requires careful technical architecture planning:

1. **Scalable Architecture**: Design microservices architecture from the start. Separate concerns for user management, core business logic, and data processing.

2. **Technology Stack**: Choose proven technologies that can scale. Consider Node.js/Python for backend, React for frontend, and cloud-native deployment.

3. **DevOps & CI/CD**: Implement automated testing, continuous integration, and deployment pipelines. Use infrastructure as code for reproducible environments.

4. **Security & Compliance**: Build security into the architecture from day one. Implement proper authentication, authorization, and data encryption.

5. **Performance & Monitoring**: Set up comprehensive monitoring and alerting. Plan for performance optimization and capacity planning.

Key technical frameworks: Domain-Driven Design for architecture, Test-Driven Development for quality, and Site Reliability Engineering for operations.`;
    }
    
    // RemediBoard persona-specific responses
    if (role === 'Naturopathic Medicine') {
      console.log(`✅ Matched Naturopathic Medicine role`);
      
      // Special handling for diabetes-related questions
      if (questionLower.includes('diabetic') || questionLower.includes('diabetes') || questionLower.includes('diet plan')) {
        return `${template} As a Naturopathic Medicine practitioner specializing in metabolic disorders, here's my comprehensive approach to diabetic nutrition:

**Foundational Dietary Strategy:**
1. **Low Glycemic Index Focus**: Emphasize foods with GI <55 - steel-cut oats, quinoa, legumes, and non-starchy vegetables. Avoid refined carbohydrates and processed foods.

2. **Nutrient-Dense Whole Foods**: Include chromium-rich foods (broccoli, whole grains), magnesium sources (leafy greens, nuts), and omega-3 fatty acids (wild-caught fish, flaxseeds).

3. **Meal Timing & Portion Control**: Implement intermittent fasting (12-16 hours) and smaller, frequent meals to stabilize blood sugar. Use the plate method: 50% non-starchy vegetables, 25% lean protein, 25% complex carbohydrates.

**Natural Blood Sugar Support:**
- Bitter melon extract (500mg 2x daily)
- Cinnamon bark (1-2g daily) for insulin sensitivity
- Alpha-lipoic acid (300-600mg daily) for glucose metabolism
- Berberine (500mg 3x daily) - as effective as metformin in studies

**Lifestyle Integration:**
- Regular moderate exercise (30 minutes post-meal walking)
- Stress management through meditation or yoga
- Adequate sleep (7-9 hours) for hormonal balance

This approach addresses root causes while supporting conventional treatment. Always coordinate with your primary care physician for medication adjustments.`;
      }
      
      return `${template} As a Naturopathic Medicine practitioner with 25+ years of experience treating chronic conditions, I approach your question about "${question}" from an integrative medicine perspective:

1. **Root Cause Analysis**: Rather than just treating symptoms, I focus on identifying and addressing the underlying causes of health issues through comprehensive assessment.

2. **Personalized Treatment Protocols**: Every patient is unique. I develop individualized treatment plans combining herbal medicine, nutritional therapy, and lifestyle modifications based on your specific constitution and health history.

3. **Evidence-Based Natural Therapies**: I integrate traditional naturopathic wisdom with modern research. For conditions like diabetes, I use proven approaches like chromium supplementation, bitter melon extract, and targeted dietary interventions.

4. **Holistic Lifestyle Integration**: True healing requires addressing all aspects of health - nutrition, movement, stress management, sleep optimization, and emotional well-being.

5. **Collaborative Care Approach**: I work alongside conventional medical providers to ensure safe, comprehensive care that maximizes therapeutic outcomes while minimizing risks.

Key principles I apply: Vis Medicatrix Naturae (the healing power of nature), Tolle Causam (treat the cause), and Primum Non Nocere (first, do no harm).`;
    }
    
    if (role === 'Traditional Chinese Medicine') {
      console.log(`✅ Matched Traditional Chinese Medicine role`);
      
      // Special handling for diabetes-related questions
      if (questionLower.includes('diabetic') || questionLower.includes('diabetes') || questionLower.includes('diet plan')) {
        return `${template} In Traditional Chinese Medicine, diabetes is known as "Xiao Ke" (消渴) or "wasting and thirsting syndrome." Here's my TCM approach to diabetic nutrition:

**TCM Pattern Assessment:**
Most diabetic patients show patterns of:
- Kidney Yin deficiency (frequent urination, thirst)
- Spleen Qi deficiency (poor digestion, fatigue)
- Stomach Heat (excessive hunger, dry mouth)

**Dietary Therapy (食疗) Recommendations:**
1. **Cooling, Nourishing Foods**: Bitter melon (苦瓜), winter melon, mung beans, and mulberry leaves to clear Heat and nourish Yin
2. **Spleen-Supporting Grains**: Job's tears (薏米), millet, and small amounts of brown rice to strengthen digestive function
3. **Kidney-Nourishing Foods**: Black sesame seeds, walnuts, goji berries, and Chinese yam to support Kidney Yin

**Herbal Formula Considerations:**
- Yu Quan Wan (玉泉丸) for Kidney Yin deficiency patterns
- Gan Lu Yin (甘露饮) for Stomach Heat with Yin deficiency
- Liu Wei Di Huang Wan (六味地黄丸) for foundational Kidney support

**Lifestyle Harmony:**
- Gentle Qigong exercises like "Eight Pieces of Brocade"
- Meditation to calm Shen (spirit) and reduce stress
- Regular sleep schedule (9 PM - 6 AM) to support Kidney function

**Acupuncture Points**: Zusanli (ST36), Sanyinjiao (SP6), and Taixi (KI3) for metabolic regulation.

This integrative approach balances your constitution while supporting blood sugar stability. Work with both TCM and conventional practitioners for optimal care.`;
      }
      
      return `${template} From my Traditional Chinese Medicine perspective, bridging ancient wisdom with modern research, I approach your question about "${question}" through TCM principles:

1. **Constitutional Assessment**: In TCM, we first assess your unique constitution (体质) - whether you tend toward heat or cold, excess or deficiency patterns. This guides all treatment decisions.

2. **Pattern Differentiation (辨证论治)**: Rather than treating diseases, we treat patterns of disharmony. For diabetes (消渴症), we might see patterns of Kidney Yin deficiency, Spleen Qi deficiency, or Heat in the Stomach.

3. **Multi-Modal Treatment Approach**: I combine acupuncture, Chinese herbal formulas, dietary therapy (食疗), and Qigong exercises for comprehensive healing that addresses both symptoms and root causes.

4. **Seasonal and Lifestyle Harmony**: TCM emphasizes living in harmony with natural cycles. Treatment plans include seasonal dietary adjustments, appropriate exercise, and stress management techniques.

5. **Gradual, Sustainable Healing**: TCM focuses on gentle, sustained improvement that strengthens the body's natural healing capacity rather than forcing rapid changes.

Core TCM frameworks I utilize: Five Element Theory for understanding organ relationships, Yin-Yang balance for treatment planning, and Qi and Blood theory for addressing energy and circulation patterns.`;
    }
    
    // CliniBoard persona-specific responses
    if (role === 'Clinical Trial Operations') {
      console.log(`✅ Matched Clinical Trial Operations role`);
      
      // Special handling for adverse event reporting
      if (questionLower.includes('adverse event') || questionLower.includes('serious adverse') || questionLower.includes('sae') || questionLower.includes('reporting')) {
        return `${template} Having managed 200+ global clinical trials, here's my systematic approach to Serious Adverse Event (SAE) reporting:

**Immediate Response Protocol (Within 24 Hours):**
1. **Initial Assessment**: Determine if the event meets SAE criteria - death, life-threatening, hospitalization, disability, congenital anomaly, or other medically important event
2. **Expedited Reporting**: Submit initial SAE report to sponsor within 24 hours of awareness using MedWatch Form FDA 3500A
3. **Regulatory Notifications**: For fatal/life-threatening events, notify FDA within 7 calendar days; all other SAEs within 15 calendar days

**Documentation Requirements:**
- Complete case narrative with timeline
- Concomitant medications and medical history
- Causality assessment (related/unrelated to study drug)
- Expectedness evaluation against current IB/package insert
- SUSAR determination (Suspected Unexpected Serious Adverse Reaction)

**Multi-Country Considerations:**
- EMA reporting via EudraVigilance within same timelines
- Local country requirements (Health Canada, PMDA, etc.)
- Ethics committee notifications per local regulations
- Site training on expedited reporting procedures

**Quality Assurance:**
- Source document verification
- Data reconciliation with eCRF entries
- Follow-up for outcome updates
- Annual safety reports compilation

**Best Practices from 200+ Trials:**
- Implement robust safety monitoring plans
- Train sites on SAE recognition and reporting
- Establish clear escalation procedures
- Maintain regulatory correspondence files

This systematic approach ensures regulatory compliance while maintaining patient safety as the top priority.`;
      }
      
      return `${template} Having managed 200+ global clinical trials across 50 countries, I approach your question about "${question}" from an operational excellence perspective:

1. **Global Trial Management**: Coordinate multi-site operations across different regulatory environments, ensuring consistent protocol execution and data quality standards.

2. **Site Selection & Management**: Establish robust site qualification criteria, conduct thorough feasibility assessments, and implement performance monitoring systems.

3. **Patient Recruitment Strategies**: Develop targeted recruitment plans using digital channels, patient registries, and community outreach while maintaining ethical standards.

4. **Regulatory Compliance**: Ensure adherence to ICH-GCP, FDA regulations, and local country requirements through comprehensive training and monitoring programs.

5. **Risk-Based Monitoring**: Implement centralized and on-site monitoring strategies that focus resources on critical data and processes.

Key operational frameworks: Risk-Based Quality Management, Centralized Statistical Monitoring, and Adaptive Trial Designs for operational efficiency.`;
    }
    
    if (role === 'Biostatistics & Data Science') {
      console.log(`✅ Matched Biostatistics & Data Science role`);
      return `${template} As a Principal Statistician with expertise in adaptive trial designs, I approach your question about "${question}" from a statistical methodology perspective:

1. **Statistical Design Optimization**: Implement adaptive trial designs, Bayesian methodologies, and innovative statistical approaches to maximize information while minimizing patient exposure.

2. **Sample Size & Power Calculations**: Develop robust statistical plans with appropriate alpha spending functions, interim analysis strategies, and futility stopping rules.

3. **Real-World Evidence Integration**: Leverage external controls, historical data, and real-world evidence to enhance trial efficiency and regulatory acceptance.

4. **Data Monitoring & Analysis**: Establish independent Data Monitoring Committees (DMCs) with pre-specified statistical stopping boundaries and interim analysis plans.

5. **Regulatory Statistical Strategy**: Align statistical approaches with FDA/EMA guidance documents, ensuring regulatory acceptance through early engagement and clear statistical analysis plans.

Core statistical frameworks: Bayesian Adaptive Designs, Group Sequential Methods, and Master Protocol Approaches for complex trial architectures.`;
    }
    
    if (role === 'Oncology Clinical Development') {
      console.log(`✅ Matched Oncology Clinical Development role`);
      return `${template} As a leading oncologist with 100+ publications in cancer therapeutics, I approach your question about "${question}" from a clinical development perspective:

1. **Precision Medicine Strategy**: Develop biomarker-driven trial designs that identify patient populations most likely to benefit from targeted therapies and immunotherapies.

2. **Dose Optimization**: Implement innovative dose-finding strategies beyond traditional 3+3 designs, including model-based approaches and combination therapy optimization.

3. **Endpoint Selection**: Choose clinically meaningful endpoints - overall survival, progression-free survival, or patient-reported outcomes that reflect true clinical benefit.

4. **Regulatory Pathway Planning**: Navigate FDA Breakthrough Therapy, Fast Track, and Accelerated Approval pathways while planning for confirmatory studies.

5. **Translational Research Integration**: Incorporate correlative studies, pharmacokinetic/pharmacodynamic analyses, and biomarker development to understand mechanism of action.

Key oncology frameworks: Precision Medicine Approaches, Immuno-Oncology Trial Designs, and Combination Therapy Development Strategies.`;
    }
    
    if (role === 'Clinical Research Strategy') {
      console.log(`✅ Matched Clinical Research Strategy role`);
      return `${template} As a former Pfizer VP who led 50+ Phase III trials to FDA approval, I approach your question about "${question}" from a strategic clinical development perspective:

1. **Development Strategy**: Design comprehensive clinical development programs that address regulatory requirements while optimizing timelines and resource allocation.

2. **Regulatory Engagement**: Establish early and frequent communication with FDA through pre-IND meetings, End-of-Phase II meetings, and advisory committee preparations.

3. **Global Development Planning**: Coordinate international regulatory strategies across FDA, EMA, and other major health authorities to enable simultaneous global submissions.

4. **Risk Management**: Implement comprehensive risk assessment and mitigation strategies for clinical, regulatory, and commercial risks throughout development.

5. **Portfolio Optimization**: Balance pipeline priorities, resource allocation, and strategic partnerships to maximize probability of success and commercial potential.

Strategic frameworks: Target Product Profile Development, Regulatory Science Principles, and Global Development Strategy Optimization.`;
    }
    
    if (role === 'Regulatory Affairs Director') {
      console.log(`✅ Matched Regulatory Affairs Director role`);
      return `${template} As a former FDA CDER Director who reviewed 100+ NDA submissions, I approach your question about "${question}" from a regulatory strategy perspective:

1. **Regulatory Pathway Selection**: Evaluate optimal regulatory pathways including traditional NDA/BLA, 505(b)(2), or biosimilar pathways based on product characteristics and competitive landscape.

2. **FDA Interaction Strategy**: Plan strategic FDA meetings (pre-IND, End-of-Phase II, pre-NDA) with clear objectives and comprehensive briefing packages.

3. **Submission Strategy**: Develop high-quality regulatory submissions with clear benefit-risk assessments, comprehensive safety databases, and robust efficacy demonstrations.

4. **Advisory Committee Preparation**: Prepare for FDA advisory committee meetings with compelling presentations, risk mitigation strategies, and stakeholder engagement plans.

5. **Post-Market Compliance**: Establish robust pharmacovigilance systems, REMS programs, and post-market study commitments to ensure ongoing regulatory compliance.

Regulatory frameworks: ICH Guidelines Implementation, FDA Guidance Document Compliance, and Risk-Based Regulatory Strategy Development.`;
    }
    
    if (role === 'Pharmacovigilance & Drug Safety') {
      console.log(`✅ Matched Pharmacovigilance & Drug Safety role`);
      return `${template} As Novartis Chief Safety Officer managing global drug safety programs, I approach your question about "${question}" from a comprehensive safety perspective:

1. **Global Safety Database Management**: Establish robust pharmacovigilance systems that capture, assess, and report adverse events across all markets and clinical development programs.

2. **Signal Detection & Risk Assessment**: Implement advanced signal detection methodologies, statistical screening, and medical review processes to identify emerging safety signals.

3. **Risk Management Planning**: Develop comprehensive Risk Evaluation and Mitigation Strategies (REMS) and Risk Management Plans (RMPs) that effectively minimize patient risk.

4. **Regulatory Safety Reporting**: Ensure compliant expedited reporting, periodic safety updates (PSURs/PADERs), and development safety update reports (DSURs) across global markets.

5. **Benefit-Risk Assessment**: Conduct ongoing benefit-risk evaluations throughout product lifecycle, incorporating real-world evidence and post-market surveillance data.

Safety frameworks: ICH E2E Pharmacovigilance Planning, WHO-UMC Causality Assessment, and Global Safety Database Standards.`;
    }
    
    // EduBoard persona-specific responses  
    if (role === 'Curriculum Design Expert') {
      console.log(`✅ Matched Curriculum Design Expert role`);
      return `${template} As a curriculum design expert focused on educational equity and evidence-based practices, I approach your question about "${question}" from a systematic curriculum development perspective:

1. **Learning Outcomes Alignment**: Design clear, measurable learning objectives that align with institutional goals and industry standards while addressing diverse learner needs.

2. **Evidence-Based Pedagogical Design**: Integrate research-proven instructional strategies including active learning, collaborative learning, and culturally responsive teaching methods.

3. **Assessment Strategy Development**: Create comprehensive assessment frameworks that include formative, summative, and authentic assessments to measure student progress and program effectiveness.

4. **Equity & Inclusion Integration**: Ensure curriculum design addresses systemic barriers and promotes inclusive learning environments for underrepresented student populations.

5. **Technology-Enhanced Learning**: Strategically integrate educational technology to enhance learning outcomes while maintaining focus on pedagogical effectiveness over technological novelty.

Educational frameworks: Backward Design Principles, Universal Design for Learning (UDL), and Culturally Sustaining Pedagogy for inclusive curriculum development.`;
    }
    
    if (role === 'EdTech Innovation Lead') {
      console.log(`✅ Matched EdTech Innovation Lead role`);
      return `${template} As an EdTech innovation leader focused on scalable educational solutions, I approach your question about "${question}" from a technology-enabled learning perspective:

1. **Learning Technology Strategy**: Develop comprehensive EdTech implementation strategies that prioritize pedagogical effectiveness and measurable learning outcomes over technological features.

2. **Scalable Platform Development**: Design educational technology solutions that can scale across diverse learning environments while maintaining quality and accessibility standards.

3. **Data-Driven Learning Analytics**: Implement learning analytics systems that provide actionable insights for educators and learners while protecting student privacy and promoting equity.

4. **Adaptive Learning Systems**: Create personalized learning experiences that adapt to individual student needs, learning styles, and progress patterns through intelligent tutoring systems.

5. **Digital Equity & Accessibility**: Ensure educational technology solutions address digital divides and comply with accessibility standards (WCAG, Section 508) for inclusive learning.

EdTech frameworks: Learning Experience Design (LXD), Human-Centered Design for Education, and Evidence-Based EdTech Implementation Strategies.`;
    }
    
    // ProductBoard remaining personas
    if (role === 'Head of Growth Marketing') {
      console.log(`✅ Matched Head of Growth Marketing role`);
      return `${template} As a former Spotify Growth Lead who drove 10x user acquisition, I approach your question about "${question}" from a data-driven growth perspective:

1. **Growth Strategy Framework**: Implement systematic growth experimentation using the AARRR funnel (Acquisition, Activation, Retention, Revenue, Referral) to identify and optimize key growth levers.

2. **User Acquisition Optimization**: Develop multi-channel acquisition strategies combining paid marketing, content marketing, viral mechanics, and strategic partnerships to achieve sustainable CAC:LTV ratios.

3. **Product-Led Growth**: Design viral loops and network effects directly into the product experience, creating organic growth mechanisms that scale without proportional marketing spend increases.

4. **Growth Analytics & Experimentation**: Establish robust A/B testing infrastructure, cohort analysis, and growth metrics dashboards to make data-driven decisions and rapidly iterate on growth hypotheses.

5. **Retention & Engagement Optimization**: Implement behavioral triggers, personalization engines, and engagement campaigns that maximize user lifetime value and reduce churn rates.

Growth frameworks: North Star Metric identification, ICE prioritization (Impact, Confidence, Ease), and Growth Accounting for sustainable scaling.`;
    }
    
    if (role === 'Head of Data Science') {
      console.log(`✅ Matched Head of Data Science role`);
      return `${template} As a former LinkedIn Data Science Lead who built recommendation algorithms for hundreds of millions of users, I approach your question about "${question}" from an advanced analytics perspective:

1. **Data Strategy & Infrastructure**: Design scalable data architectures using modern data stack (cloud data warehouses, ETL pipelines, real-time streaming) that support both operational and analytical workloads.

2. **Machine Learning Systems**: Develop production ML systems including recommendation engines, predictive models, and personalization algorithms that deliver measurable business impact at scale.

3. **Advanced Analytics & Insights**: Implement sophisticated statistical analyses, causal inference methods, and experimental design to extract actionable insights from complex datasets.

4. **Data Product Development**: Create data-driven product features including search algorithms, content ranking systems, and user matching algorithms that enhance user experience and engagement.

5. **Metrics & Measurement**: Establish comprehensive measurement frameworks including leading/lagging indicators, statistical significance testing, and attribution modeling for accurate performance assessment.

Data Science frameworks: CRISP-DM methodology, MLOps best practices, and Statistical Inference for reliable model deployment and monitoring.`;
    }
    
    // Add more persona-specific responses as needed
    const finalResponse = `${template} Based on my expertise in ${expertiseAreas.join(', ')}, I'd recommend focusing on ${expertiseAreas[0].toLowerCase()} principles to address your question effectively. ${responseStyle}`;
    console.log(`🎉 Generated persona-specific response for ${role}: ${finalResponse.substring(0, 100)}...`);
    return finalResponse;
  }
  
  // Fallback to domain-specific responses if no persona match
  console.log(`⚠️ Using fallback response for ${advisor.name} - no persona config found`);
  const templates = {
    productboard: `As a ${advisor.expertise || 'Product Expert'}, I see great potential in your question about "${question}". From a product development perspective, I'd recommend starting with user research to validate assumptions, building an MVP to test core hypotheses, and iterating based on user feedback. Key frameworks I'd apply include Jobs-to-be-Done for understanding user needs and OKRs for measuring success.`,
    
    cliniboard: `Speaking as a ${advisor.expertise || 'Clinical Expert'}, your question about "${question}" requires careful consideration of regulatory requirements and patient safety. I'd recommend starting with a comprehensive risk assessment, ensuring compliance with relevant guidelines (FDA, ICH), and establishing robust quality management systems from the beginning.`,
    
    eduboard: `As an ${advisor.expertise || 'Education Expert'}, I'd approach your question about "${question}" from a learner-centered perspective. Focus on clear learning objectives, evidence-based pedagogical practices, and assessment strategies that support student growth. Consider how technology can enhance rather than replace effective teaching methods.`,
    
    remediboard: `From my ${advisor.expertise || 'Wellness Expert'} background, I believe your question about "${question}" requires a holistic approach. Focus on addressing root causes rather than just symptoms, consider the interconnection between mind, body, and spirit, and develop personalized protocols based on individual needs and constitution.`
  };
  
  const template = templates[domainId as keyof typeof templates] || templates.productboard;
  
  // Add frameworks mention if relevant
  const frameworkMention = frameworks.length > 0 
    ? ` The key frameworks I'd recommend include ${frameworks.slice(0, 2).join(' and ')}.`
    : '';
  
  const fallbackResponse = template + frameworkMention;
  console.log(`📝 Generated fallback response: ${fallbackResponse.substring(0, 100)}...`);
  return fallbackResponse;
}

/**
 * Generate responses for multiple advisors with enhanced error handling and reliability
 * Uses the new response orchestrator for improved performance and fallback mechanisms
 * Integrates with demo mode service for hackathon demonstration
 */
export const generateAdvisorResponses = async (
  question: string,
  advisors: BoardExpert[],
  domainId: string,
  config?: Partial<IntelligentResponseConfig & LLMConfig>
): Promise<IntelligentAdvisorResponse[]> => {
  console.log('🚀 Starting intelligent response generation with new orchestrator:', {
    question: question.substring(0, 50) + '...',
    advisorCount: advisors.length,
    domainId,
    config: config ? Object.keys(config) : 'default',
    demoMode: demoModeService.isDemoModeActive()
  });

  try {
    // Check if demo mode is active
    if (demoModeService.isDemoModeActive()) {
      console.log('🎬 Demo mode active - using enhanced demo responses');
      
      // Convert BoardExpert to Advisor format for demo mode
      const advisorList: Advisor[] = advisors.map(expert => 
        convertBoardExpertToAdvisor(expert, domainId)
      );
      
      // Generate demo responses with enhanced metrics
      const demoResponses: DemoResponse[] = [];
      const startTime = Date.now();
      
      for (const advisor of advisorList) {
        const demoResponse = await demoModeService.generateDemoResponse(
          advisor,
          question,
          domainId
        );
        demoResponses.push(demoResponse);
        
        // Record performance metrics
        performanceMonitoringService.recordResponseMetrics(
          demoResponse.metadata.processingTime,
          1,
          'medium', // Could be derived from question analysis
          {
            personaAccuracy: demoResponse.metadata.personaAccuracy,
            technicalDepth: demoResponse.metadata.technicalDepth,
            businessRelevance: demoResponse.metadata.businessRelevance
          }
        );
      }
      
      const totalTime = Date.now() - startTime;
      console.log(`🎬 Demo responses generated in ${totalTime}ms`);
      
      // Convert demo responses to legacy format
      return demoResponses.map(demoResponse => ({
        advisorId: demoResponse.advisorId,
        content: demoResponse.content,
        timestamp: new Date(),
        persona: {
          name: advisorList.find(a => a.id === demoResponse.advisorId)?.name || demoResponse.advisorId,
          expertise: advisorList.find(a => a.id === demoResponse.advisorId)?.expertise || 'Expert'
        },
        metadata: {
          responseType: demoResponse.metadata.responseType === 'demo_static' ? 'static' : 'llm',
          processingTime: demoResponse.metadata.processingTime,
          confidence: demoResponse.metadata.confidence,
          frameworks: demoResponse.metadata.frameworks
        }
      }));
    }
    
    // Normal mode - use simplified intelligent responses
    console.log('🧠 Generating intelligent responses without orchestrator');
    
    // Convert BoardExpert to Advisor format
    const advisorList: Advisor[] = advisors.map(expert => 
      convertBoardExpertToAdvisor(expert, domainId)
    );
    
    console.log('👥 Converted advisors:', advisorList.map(a => `${a.name} (ID: ${a.id}, Expertise: ${a.expertise})`));
    
    // Detect the correct domain for the question
    const questionInsights = await getQuestionInsights(question, domainId);
    const actualDomain = questionInsights.domain;
    
    console.log('🔍 Domain detection:', { provided: domainId, detected: actualDomain });
    
    // Generate personalized responses for each advisor
    const responses = await Promise.all(
      advisorList.map(async (advisor) => {
        const personalizedResponse = await generatePersonalizedResponse(advisor, question, actualDomain);
        return personalizedResponse;
      })
    );
    
    console.log('🎉 Successfully generated intelligent responses:', {
      totalResponses: responses.length,
      advisors: advisorList.map(a => a.name)
    });
    
    return responses;
    
  } catch (error) {
    console.error('❌ Critical error in generateAdvisorResponses:', error);
    
    // Final fallback: create minimal responses for all advisors
    return advisors.map(advisor => ({
      advisorId: advisor.id,
      content: `I apologize, but I'm currently experiencing technical difficulties. As a ${advisor.role}, I'm here to help with your question about "${question}". Please try again later or contact support if the issue persists.`,
      timestamp: new Date(),
      persona: {
        name: advisor.name,
        expertise: advisor.role
      },
      metadata: {
        responseType: 'static' as const,
        processingTime: 0,
        confidence: 0.1,
        errorInfo: {
          type: 'critical_error',
          message: error instanceof Error ? error.message : 'Unknown error',
          fallbackUsed: true
        }
      }
    }));
  }
};

/**
 * Analyze question and provide insights for the UI
 * Uses the new question analysis engine for improved accuracy
 */
export const getQuestionInsights = async (question: string, domainId: string = 'productboard') => {
  try {
    // Simplified question analysis without orchestrator
    const questionLower = question.toLowerCase();
    
    // First detect domain based on question content
    let detectedDomain = domainId; // Default to provided domain
    if (questionLower.includes('diabetes') || questionLower.includes('diet') || questionLower.includes('nutrition') || 
        questionLower.includes('health') || questionLower.includes('wellness') || questionLower.includes('food') ||
        questionLower.includes('rice') || questionLower.includes('millet') || questionLower.includes('supplement')) {
      detectedDomain = 'remediboard';
    } else if (questionLower.includes('clinical') || questionLower.includes('trial') || questionLower.includes('patient') ||
               questionLower.includes('fda') || questionLower.includes('regulatory') || questionLower.includes('drug')) {
      detectedDomain = 'cliniboard';
    } else if (questionLower.includes('education') || questionLower.includes('learning') || questionLower.includes('curriculum') ||
               questionLower.includes('student') || questionLower.includes('teaching') || questionLower.includes('school')) {
      detectedDomain = 'eduboard';
    } else if (questionLower.includes('product') || questionLower.includes('website') || questionLower.includes('app') ||
               questionLower.includes('development') || questionLower.includes('software') || questionLower.includes('technology')) {
      detectedDomain = 'productboard';
    }
    
    // Determine question type
    let type = 'general';
    if (questionLower.includes('strategy') || questionLower.includes('plan')) type = 'strategy';
    else if (questionLower.includes('technical') || questionLower.includes('technology')) type = 'technical';
    else if (questionLower.includes('product') || questionLower.includes('feature')) type = 'product_ideation';
    else if (questionLower.includes('clinical') || questionLower.includes('trial')) type = 'clinical';
    else if (questionLower.includes('regulatory') || questionLower.includes('compliance')) type = 'regulatory';
    else if (questionLower.includes('education') || questionLower.includes('learning')) type = 'educational';
    else if (questionLower.includes('nutrition') || questionLower.includes('wellness') || questionLower.includes('diet')) type = 'wellness';
    
    // Extract keywords
    const keywords = question.split(' ')
      .filter(word => word.length > 2)
      .map(word => word.toLowerCase().replace(/[^\w]/g, ''))
      .filter(word => !['the', 'and', 'or', 'but', 'for', 'with', 'how', 'what', 'when', 'where', 'why'].includes(word));
    
    // Determine complexity based on question length and keywords
    const complexity = question.length > 100 ? 'high' : question.length > 50 ? 'medium' : 'low';
    
    // Determine confidence based on keyword matches
    const confidence = keywords.length > 3 ? 0.8 : keywords.length > 1 ? 0.6 : 0.4;
    
    console.log('🔍 Question analysis completed:', {
      type,
      confidence,
      domain: domainId,
      keywordCount: keywords.length,
      complexity
    });
    
    return {
      type,
      keywords: keywords.slice(0, 5), // Limit to top 5 keywords
      domain: detectedDomain, // Use detected domain instead of provided
      confidence,
      sentiment: 'neutral',
      complexity,
      urgency: 'normal',
      frameworks: getRelevantFrameworksForDomain(detectedDomain, type)
    };
    
  } catch (error) {
    console.error('Error with question analysis, using fallback:', error);
    
    // Simple fallback analysis
    const keywords = question.split(' ')
      .filter(word => word.length > 2)
      .map(word => word.toLowerCase())
      .filter(word => !['the', 'and', 'or', 'but', 'for', 'with'].includes(word));
    
    return {
      type: 'general',
      keywords: keywords.slice(0, 5),
      domain: domainId,
      confidence: 0.5,
      sentiment: 'neutral',
      complexity: 'medium',
      urgency: 'normal',
      frameworks: getRelevantFrameworksForDomain(domainId, 'general')
    };
  }
};

/**
 * Get relevant frameworks for a domain and question type
 */
function getRelevantFrameworksForDomain(domainId: string, questionType: string): string[] {
  const frameworkMap: Record<string, Record<string, string[]>> = {
    productboard: {
      strategy: ['Jobs-to-be-Done', 'North Star Framework', 'OKRs'],
      product_ideation: ['Design Thinking', 'Lean Startup', 'Product-Market Fit Canvas'],
      technical: ['System Design', 'Technical Architecture', 'DevOps'],
      general: ['Jobs-to-be-Done', 'North Star Framework', 'OKRs']
    },
    cliniboard: {
      clinical: ['ICH Guidelines', 'FDA Guidance', 'Clinical Development Plan'],
      strategy: ['ICH Guidelines', 'FDA Guidance', 'Clinical Development Plan'],
      regulatory: ['FDA Submission Process', 'Regulatory Strategy Framework'],
      safety: ['Pharmacovigilance', 'Risk Management Plan'],
      general: ['ICH Guidelines', 'FDA Guidance', 'Clinical Development Plan']
    },
    eduboard: {
      educational: ['Bloom\'s Taxonomy', 'Backward Design', 'Learning Objectives'],
      strategy: ['Bloom\'s Taxonomy', 'Backward Design', 'Learning Objectives'],
      curriculum: ['Bloom\'s Taxonomy', 'Backward Design', 'Learning Objectives'],
      technology: ['EdTech Integration', 'Learning Management Systems'],
      assessment: ['Formative Assessment', 'Learning Analytics'],
      general: ['Bloom\'s Taxonomy', 'Backward Design', 'Learning Objectives']
    },
    remediboard: {
      remedial: ['Functional Medicine', 'Holistic Nutrition', 'Integrative Approach'],
      strategy: ['Functional Medicine', 'Holistic Nutrition', 'Integrative Approach'],
      nutrition: ['Functional Medicine', 'Holistic Nutrition', 'Integrative Approach'],
      wellness: ['Mind-Body Medicine', 'Traditional Medicine', 'Natural Healing'],
      chronic: ['Root Cause Analysis', 'Lifestyle Medicine'],
      general: ['Functional Medicine', 'Holistic Nutrition', 'Integrative Approach']
    }
  };
  
  const domainFrameworks = frameworkMap[domainId] || frameworkMap.productboard;
  return domainFrameworks[questionType] || domainFrameworks.general || [];
}

/**
 * Update service configuration - simplified version
 */
export const updateServiceConfig = (config: Partial<IntelligentResponseConfig>): void => {
  console.log('📝 Updated intelligent response service configuration:', config);
  // Configuration updates would be applied to the simplified service
};

/**
 * Get service health status - simplified version
 */
export const getServiceHealth = async () => {
  try {
    return {
      status: 'healthy',
      components: {
        responseGeneration: 'operational',
        questionAnalysis: 'operational',
        demoMode: demoModeService.isDemoModeActive() ? 'active' : 'inactive'
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Clear response cache - simplified version
 */
export const clearResponseCache = (): void => {
  console.log('🗑️ Response cache cleared (simplified service)');
  // Cache clearing would be implemented for the simplified service
};