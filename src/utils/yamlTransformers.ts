import type { DomainSpec, Advisor, Domain, DomainId, UseCase } from '../types';

/**
 * Transform raw YAML advisor data into typed Advisor objects
 */
export function transformAdvisors(
  advisorSpecs: any[],
  domainId: DomainId,
  domain: Domain
): Advisor[] {
  return advisorSpecs.map((spec, index) => ({
    id: `${domainId}-${sanitizeId(spec.name)}-${index}`,
    name: spec.name || 'Unknown Advisor',
    expertise: spec.expertise || 'General Expertise',
    background: spec.background || 'No background provided',
    domain: domainId,
    avatar: spec.avatar || undefined,
    isSelected: false,
  }));
}

/**
 * Transform use cases from YAML to typed objects
 */
export function transformUseCases(useCases: any[]): UseCase[] {
  if (!Array.isArray(useCases)) {
    return [];
  }

  return useCases.map((useCase, index) => ({
    title: useCase.title || `Use Case ${index + 1}`,
    prompt: useCase.prompt || 'No prompt provided',
  }));
}

/**
 * Sanitize a string to be used as an ID
 */
export function sanitizeId(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Validate advisor specification structure
 */
export function validateAdvisorSpec(spec: any, index: number): boolean {
  const requiredFields = ['name', 'expertise', 'background'];
  
  for (const field of requiredFields) {
    if (!spec[field] || typeof spec[field] !== 'string') {
      console.warn(`Advisor at index ${index} missing or invalid field: ${field}`);
      return false;
    }
  }
  
  return true;
}

/**
 * Validate domain specification structure
 */
export function validateDomainSpec(spec: any): boolean {
  if (!spec || typeof spec !== 'object') {
    console.error('Domain spec is not a valid object');
    return false;
  }

  const requiredFields = ['name', 'description', 'advisors'];
  
  for (const field of requiredFields) {
    if (!spec[field]) {
      console.error(`Domain spec missing required field: ${field}`);
      return false;
    }
  }

  if (!Array.isArray(spec.advisors)) {
    console.error('Domain spec advisors field must be an array');
    return false;
  }

  if (spec.advisors.length === 0) {
    console.error('Domain spec must have at least one advisor');
    return false;
  }

  // Validate each advisor
  return spec.advisors.every((advisor: any, index: number) => 
    validateAdvisorSpec(advisor, index)
  );
}

/**
 * Create a safe copy of domain spec with defaults
 */
export function normalizeDomainSpec(spec: any): DomainSpec {
  return {
    name: spec.name || 'Unknown Domain',
    description: spec.description || 'No description provided',
    advisors: Array.isArray(spec.advisors) ? spec.advisors.map(normalizeAdvisorSpec) : [],
    use_cases: Array.isArray(spec.use_cases) ? spec.use_cases.map(normalizeUseCase) : [],
  };
}

/**
 * Normalize advisor spec with defaults
 */
function normalizeAdvisorSpec(spec: any) {
  return {
    name: spec.name || 'Unknown Advisor',
    expertise: spec.expertise || 'General Expertise',
    background: spec.background || 'No background provided',
    avatar: spec.avatar || undefined,
  };
}

/**
 * Normalize use case with defaults
 */
function normalizeUseCase(useCase: any) {
  return {
    title: useCase.title || 'Untitled Use Case',
    prompt: useCase.prompt || 'No prompt provided',
  };
}
