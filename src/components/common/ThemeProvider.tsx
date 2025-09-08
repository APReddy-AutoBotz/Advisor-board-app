import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { DomainId } from '../../types';

interface ThemeContextType {
  currentDomain: DomainId | null;
  isDarkMode: boolean;
  setCurrentDomain: (domain: DomainId | null) => void;
  toggleDarkMode: () => void;
  getThemeClasses: (variant?: 'primary' | 'secondary' | 'accent' | 'background' | 'text') => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultDomain?: DomainId;
}

export default function ThemeProvider({ children, defaultDomain }: ThemeProviderProps) {
  const [currentDomain, setCurrentDomain] = useState<DomainId | null>(defaultDomain || null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize dark mode from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('advisor-board-theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setIsDarkMode(true);
    }
  }, []);

  // Apply dark mode class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('advisor-board-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Apply domain-specific CSS custom properties
  useEffect(() => {
    const root = document.documentElement;
    
    if (currentDomain) {
      const domainColors = getDomainColors(currentDomain);
      
      // Set CSS custom properties for current domain
      Object.entries(domainColors).forEach(([key, value]) => {
        root.style.setProperty(`--color-domain-${key}`, value);
      });
      
      // Set domain class on body for additional styling
      document.body.className = document.body.className
        .replace(/domain-\w+/g, '')
        .concat(` domain-${currentDomain}`);
    } else {
      // Clear domain-specific properties
      ['primary', 'secondary', 'accent', 'background', 'text'].forEach(key => {
        root.style.removeProperty(`--color-domain-${key}`);
      });
      
      // Remove domain class
      document.body.className = document.body.className.replace(/domain-\w+/g, '');
    }
  }, [currentDomain]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const getThemeClasses = (variant: 'primary' | 'secondary' | 'accent' | 'background' | 'text' = 'primary'): string => {
    if (!currentDomain) {
      return `text-neutral-600 bg-neutral-100`; // Default neutral theme
    }

    const domainPrefix = getDomainPrefix(currentDomain);
    
    switch (variant) {
      case 'primary':
        return `text-${domainPrefix}-800 bg-${domainPrefix}-600`;
      case 'secondary':
        return `text-${domainPrefix}-700 bg-${domainPrefix}-100`;
      case 'accent':
        return `text-white bg-${domainPrefix}-500`;
      case 'background':
        return `bg-${domainPrefix}-50`;
      case 'text':
        return `text-${domainPrefix}-900`;
      default:
        return `text-${domainPrefix}-800 bg-${domainPrefix}-600`;
    }
  };

  const contextValue: ThemeContextType = {
    currentDomain,
    isDarkMode,
    setCurrentDomain,
    toggleDarkMode,
    getThemeClasses,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <div className={`min-h-screen transition-colors duration-300 ${
        isDarkMode ? 'dark bg-neutral-900 text-neutral-100' : 'bg-neutral-50 text-neutral-900'
      }`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

// Helper functions
function getDomainPrefix(domain: DomainId): string {
  const prefixMap: Record<DomainId, string> = {
    cliniboard: 'clinical',
    productboard: 'product',
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
    productboard: {
      primary: '#8b5cf6',
      secondary: '#e9d5ff',
      accent: '#a855f7',
      background: '#faf5ff',
      text: '#581c87',
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

// Custom hook to use theme context
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}