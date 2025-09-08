---
inclusion: always
---

# Advisor Prioritization Steering Rules

This document defines the intelligent advisor prioritization system for AdvisorBoard. These rules guide the automatic suggestion and ranking of advisors based on user context, prompt analysis, and historical patterns.

## Core Prioritization Principles

### 1. Expertise Relevance Matching
- **Primary Rule**: Match advisor expertise to prompt keywords and context
- **Implementation**: Analyze prompt for domain-specific terminology and rank advisors by expertise alignment
- **Weight**: 40% of total prioritization score

### 2. Historical Usage Patterns
- **Primary Rule**: Prioritize advisors frequently used by the current user
- **Implementation**: Track advisor selection frequency and success rates per user
- **Weight**: 25% of total prioritization score

### 3. Complementary Expertise
- **Primary Rule**: Suggest advisors that complement already selected advisors
- **Implementation**: Avoid redundant expertise, prioritize diverse perspectives
- **Weight**: 20% of total prioritization score

### 4. Session Context Optimization
- **Primary Rule**: Consider current session type and complexity
- **Implementation**: Adjust recommendations based on single vs multi-domain sessions
- **Weight**: 15% of total prioritization score

## Domain-Specific Prioritization Rules

### Cliniboard (Clinical Trials Domain)
```yaml
priority_keywords:
  high_priority:
    - "clinical trial"
    - "FDA approval"
    - "safety profile"
    - "regulatory"
    - "protocol design"
    - "adverse events"
  
  medium_priority:
    - "research"
    - "study design"
    - "patient recruitment"
    - "data analysis"
    - "biomarker"
    
advisor_specializations:
  regulatory_expert:
    triggers: ["FDA", "regulatory", "approval", "compliance"]
    boost_factor: 1.5
  
  safety_specialist:
    triggers: ["safety", "adverse", "toxicity", "risk"]
    boost_factor: 1.4
    
  protocol_designer:
    triggers: ["protocol", "design", "methodology", "endpoints"]
    boost_factor: 1.3
```

### EduBoard (Education Domain)
```yaml
priority_keywords:
  high_priority:
    - "curriculum"
    - "pedagogy"
    - "student engagement"
    - "learning outcomes"
    - "educational equity"
    - "assessment"
  
  medium_priority:
    - "teaching methods"
    - "classroom management"
    - "technology integration"
    - "professional development"
    
advisor_specializations:
  curriculum_expert:
    triggers: ["curriculum", "standards", "alignment", "scope"]
    boost_factor: 1.5
    
  equity_advocate:
    triggers: ["equity", "inclusion", "diversity", "access"]
    boost_factor: 1.4
    
  assessment_specialist:
    triggers: ["assessment", "evaluation", "testing", "measurement"]
    boost_factor: 1.3
```

### RemediBoard (Natural Remedies Domain)
```yaml
priority_keywords:
  high_priority:
    - "herbal medicine"
    - "traditional healing"
    - "natural remedies"
    - "holistic approach"
    - "plant medicine"
    - "integrative health"
  
  medium_priority:
    - "alternative medicine"
    - "wellness"
    - "nutrition"
    - "mindfulness"
    
advisor_specializations:
  herbalist:
    triggers: ["herbal", "botanical", "plant", "extract"]
    boost_factor: 1.5
    
  traditional_healer:
    triggers: ["traditional", "ancient", "indigenous", "cultural"]
    boost_factor: 1.4
    
  integrative_practitioner:
    triggers: ["integrative", "holistic", "whole-person", "mind-body"]
    boost_factor: 1.3
```

## Dynamic Prioritization Algorithms

### Prompt Analysis Algorithm
1. **Keyword Extraction**: Extract domain-specific keywords from user prompt
2. **Semantic Analysis**: Analyze prompt intent and complexity level
3. **Expertise Mapping**: Map extracted concepts to advisor specializations
4. **Confidence Scoring**: Assign confidence scores to each advisor match

### Historical Pattern Analysis
1. **Usage Frequency**: Track how often each advisor is selected
2. **Success Metrics**: Monitor user satisfaction with advisor responses
3. **Context Similarity**: Compare current prompt to historical successful sessions
4. **Temporal Patterns**: Consider time-based usage patterns

### Complementary Selection Logic
```typescript
// Example complementary selection rules
const complementaryRules = {
  // If regulatory expert is selected, suggest safety specialist
  regulatory_expert: ['safety_specialist', 'protocol_designer'],
  
  // If curriculum expert is selected, suggest assessment specialist
  curriculum_expert: ['assessment_specialist', 'equity_advocate'],
  
  // If herbalist is selected, suggest integrative practitioner
  herbalist: ['integrative_practitioner', 'traditional_healer']
};
```

## Adaptive Learning Rules

### User Preference Learning
- **Track Selection Patterns**: Monitor which suggested advisors users actually select
- **Feedback Integration**: Incorporate user feedback on advisor recommendations
- **Preference Weighting**: Adjust prioritization weights based on user behavior

### Context-Aware Adaptation
- **Session Type Recognition**: Distinguish between exploratory vs focused sessions
- **Complexity Assessment**: Adjust recommendations based on prompt complexity
- **Multi-Domain Coordination**: Special rules for cross-domain consultations

## Implementation Guidelines

### Real-Time Prioritization
```typescript
interface PrioritizationContext {
  currentPrompt: string;
  selectedAdvisors: Advisor[];
  userHistory: SessionHistory[];
  sessionType: 'single' | 'multi-domain';
  domainContext: Domain;
}

function calculateAdvisorPriority(
  advisor: Advisor,
  context: PrioritizationContext
): number {
  const expertiseScore = calculateExpertiseRelevance(advisor, context.currentPrompt);
  const historyScore = calculateHistoricalRelevance(advisor, context.userHistory);
  const complementaryScore = calculateComplementaryValue(advisor, context.selectedAdvisors);
  const contextScore = calculateContextRelevance(advisor, context.sessionType);
  
  return (
    expertiseScore * 0.4 +
    historyScore * 0.25 +
    complementaryScore * 0.2 +
    contextScore * 0.15
  );
}
```

### Recommendation Thresholds
- **High Priority**: Score ≥ 0.8 (Strongly recommend)
- **Medium Priority**: Score 0.5-0.79 (Suggest)
- **Low Priority**: Score 0.3-0.49 (Available)
- **Not Recommended**: Score < 0.3 (Hide or deprioritize)

## Quality Assurance Rules

### Recommendation Validation
- **Minimum Diversity**: Ensure at least 2 different specializations in recommendations
- **Maximum Overlap**: Limit advisors with similar expertise to 2 per recommendation set
- **Expertise Coverage**: Ensure core domain expertise is always represented

### Fallback Strategies
- **No Clear Match**: Default to most popular advisors in domain
- **New User**: Use domain-specific default advisor sets
- **System Error**: Provide balanced representation across all specializations

## Performance Monitoring

### Key Metrics
- **Recommendation Acceptance Rate**: Percentage of suggested advisors actually selected
- **Session Success Rate**: User satisfaction with recommended advisor combinations
- **Diversity Index**: Measure of expertise diversity in recommendations
- **Response Time**: Speed of prioritization algorithm execution

### Continuous Improvement
- **A/B Testing**: Test different prioritization weights and algorithms
- **User Feedback Integration**: Incorporate explicit user feedback on recommendations
- **Performance Optimization**: Monitor and optimize algorithm performance
- **Rule Refinement**: Regularly update prioritization rules based on usage data

## Integration Points

### Frontend Integration
- Display prioritized advisors with visual indicators (stars, badges, ordering)
- Provide explanation tooltips for why specific advisors are recommended
- Allow users to override recommendations while learning from their choices

### Backend Integration
- Real-time calculation of advisor priorities during advisor selection
- Caching of frequently calculated prioritization scores
- Integration with user preference and history tracking systems

### Analytics Integration
- Track recommendation effectiveness and user satisfaction
- Monitor prioritization algorithm performance and accuracy
- Generate insights for continuous improvement of recommendation quality