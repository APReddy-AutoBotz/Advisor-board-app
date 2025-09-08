/**
 * Kiro Hook: Internationalization (i18n) Automation
 * 
 * This hook automatically detects text strings and prepares them for
 * internationalization, making AdvisorBoard accessible to global users
 * in multiple languages.
 */

import { KiroHook } from '../types/hooks';

export const internationalizationHook: KiroHook = {
  name: 'internationalization',
  description: 'Auto-prepare text for multiple languages',
  trigger: {
    type: 'file-change',
    pattern: 'src/**/*.tsx'
  },
  actions: [
    {
      type: 'extract-strings',
      description: 'Extract translatable strings'
    },
    {
      type: 'generate-keys',
      description: 'Generate translation keys'
    },
    {
      type: 'update-i18n-files',
      description: 'Update translation files'
    }
  ],
  supportedLanguages: [
    'en', // English (default)
    'es', // Spanish - Large healthcare market
    'fr', // French - Regulatory compliance
    'de', // German - Clinical research hub
    'ja', // Japanese - Technology adoption
    'zh', // Chinese - Massive market potential
    'pt', // Portuguese - Brazil healthcare
    'ar'  // Arabic - Growing market
  ],
  metadata: {
    category: 'accessibility',
    impact: 'global',
    marketExpansion: '8x potential user base'
  }
};

// Translation utilities
export const i18nUtils = {
  // Auto-detect translatable strings
  extractStrings: (content: string) => {
    const strings = content.match(/['"`]([^'"`]+)['"`]/g) || [];
    return strings.filter(s => s.length > 3 && /[a-zA-Z]/.test(s));
  },
  
  // Generate translation keys
  generateKey: (text: string) => {
    return text.toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  },
  
  // Market size calculator
  calculateMarketExpansion: (baseUsers: number, languages: string[]) => {
    const marketMultipliers = {
      'es': 2.1, 'fr': 1.3, 'de': 1.2, 'ja': 1.8,
      'zh': 3.2, 'pt': 1.4, 'ar': 1.6
    };
    
    return languages.reduce((total, lang) => {
      return total + (baseUsers * (marketMultipliers[lang] || 1));
    }, baseUsers);
  }
};