// useContext import removed as it's not used
import { useTheme as useThemeContext } from '../components/common/ThemeProvider';
import type { DomainId } from '../types';

// Re-export the theme context hook
export { useTheme as useThemeContext } from '../components/common/ThemeProvider';

/**
 * Enhanced theme hook with additional utilities
 */
export function useTheme() {
  const themeContext = useThemeContext();
  
  return {
    ...themeContext,
    
    // Additional utility methods
    getDomainColorClass: (variant: 'primary' | 'secondary' | 'accent' | 'background' | 'text' = 'primary') => {
      return themeContext.getThemeClasses(variant);
    },
    
    // Check if a specific domain is active
    isDomainActive: (domain: DomainId) => {
      return themeContext.currentDomain === domain;
    },
    
    // Get domain-specific CSS variables
    getDomainCSSVars: () => {
      if (!themeContext.currentDomain) return {};
      
      const domainColors = getDomainColors(themeContext.currentDomain);
      const cssVars: Record<string, string> = {};
      
      Object.entries(domainColors).forEach(([key, value]) => {
        cssVars[`--color-domain-${key}`] = value;
      });
      
      return cssVars;
    },
    
    // Get Tailwind class names for current domain
    getTailwindClasses: (type: 'bg' | 'text' | 'border' | 'ring', shade: number = 500) => {
      if (!themeContext.currentDomain) {
        return `${type}-neutral-${shade}`;
      }
      
      const domainPrefix = getDomainPrefix(themeContext.currentDomain);
      return `${type}-${domainPrefix}-${shade}`;
    },
    
    // Theme transition utilities
    getTransitionClasses: () => {
      return 'transition-colors duration-300 ease-in-out';
    },
  };
}

// Helper functions
function getDomainPrefix(domain: DomainId): string {
  const prefixMap: Record<DomainId, string> = {
    cliniboard: 'clinical',
    eduboard: 'education',
    remediboard: 'remedies',
  };
  return prefixMap[domain];
}

function getDomainColors(domain: DomainId): Record<string, string> {
  const colorMaps: Record<DomainId, Record<string, string>> = {
    cliniboard: {
      primary: '#2563eb',
      secondary: '#dbeafe',
      accent: '#3b82f6',
      background: '#eff6ff',
      text: '#1e3a8a',
    },
    eduboard: {
      primary: '#ea580c',
      secondary: '#fed7aa',
      accent: '#f97316',
      background: '#fff7ed',
      text: '#7c2d12',
    },
    remediboard: {
      primary: '#16a34a',
      secondary: '#bbf7d0',
      accent: '#22c55e',
      background: '#f0fdf4',
      text: '#14532d',
    },
  };
  
  return colorMaps[domain];
}