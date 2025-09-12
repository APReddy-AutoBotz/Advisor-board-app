/**
 * Content Sanitizer Utility
 * 
 * Replaces real company names, valuations, and specific metrics with generic terms
 * for safety compliance across all persona content.
 */

import { GENERIC_COMPANY_TERMS, GENERIC_METRICS } from '../data/safePersonaBios';

/**
 * Sanitizes content by replacing real company names and specific metrics
 * with generic, safety-compliant alternatives
 */
export function sanitizePersonaContent(content: string): string {
  let sanitized = content;
  
  // Replace company names
  Object.entries(GENERIC_COMPANY_TERMS).forEach(([realName, genericTerm]) => {
    const regex = new RegExp(`\\b${realName}\\b`, 'gi');
    sanitized = sanitized.replace(regex, genericTerm);
  });
  
  // Replace specific metrics and valuations
  Object.entries(GENERIC_METRICS).forEach(([specificMetric, genericTerm]) => {
    const regex = new RegExp(specificMetric.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    sanitized = sanitized.replace(regex, genericTerm);
  });
  
  return sanitized;
}

/**
 * Sanitizes persona bio text specifically for display
 */
export function sanitizePersonaBio(bio: string): string {
  return sanitizePersonaContent(bio)
    // Additional bio-specific replacements
    .replace(/\bCPO at\b/gi, 'Chief Product Officer at')
    .replace(/\bVP at\b/gi, 'Vice President at')
    .replace(/\bDirector at\b/gi, 'Director at')
    .replace(/\bSenior PM at\b/gi, 'Senior Product Manager at')
    .replace(/\bFormer (.+?) at (.+?),/gi, 'Former $1 at $2,')
    // Remove specific event references
    .replace(/\b(IPO|acquisition|exit)\b/gi, 'successful business milestone')
    .replace(/\bSeries [A-Z]\b/gi, 'growth stage funding')
    .replace(/\bPhase [I-V]+\b/gi, 'clinical development phase');
}

/**
 * Creates a safety-compliant role title
 */
export function createSafeRoleTitle(originalRole: string): string {
  return `${originalRole} (AI Persona)`;
}

/**
 * Creates safety-compliant CTA text
 */
export function createSafeCTAText(firstName: string): string {
  return `Chat with AI ${firstName}`;
}

/**
 * Validates that content doesn't contain prohibited terms
 */
export function validateContentSafety(content: string): {
  isValid: boolean;
  violations: string[];
} {
  const violations: string[] = [];
  
  // Check for real company names
  Object.keys(GENERIC_COMPANY_TERMS).forEach(company => {
    if (new RegExp(`\\b${company}\\b`, 'i').test(content)) {
      violations.push(`Contains real company name: ${company}`);
    }
  });
  
  // Check for specific metrics
  Object.keys(GENERIC_METRICS).forEach(metric => {
    if (content.includes(metric)) {
      violations.push(`Contains specific metric: ${metric}`);
    }
  });
  
  // Check for missing AI disclaimers in role titles
  if (content.includes('Chief') || content.includes('Director') || content.includes('VP')) {
    if (!content.includes('(AI Persona)') && !content.includes('(Simulated Persona)')) {
      violations.push('Missing AI persona disclaimer in role title');
    }
  }
  
  return {
    isValid: violations.length === 0,
    violations
  };
}

/**
 * Batch sanitizes multiple content items
 */
export function batchSanitizeContent(items: string[]): string[] {
  return items.map(sanitizePersonaContent);
}

/**
 * Extracts and sanitizes expertise areas from a bio
 */
export function extractSafeExpertise(bio: string, maxItems: number = 3): string[] {
  const expertise = bio
    .split(/[,;]/)
    .map(item => item.trim())
    .filter(item => item.length > 0 && item.length <= 50) // Reasonable length filter
    .slice(0, maxItems)
    .map(sanitizePersonaContent);
    
  return expertise;
}
