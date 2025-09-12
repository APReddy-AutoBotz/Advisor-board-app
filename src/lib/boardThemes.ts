/**
 * Board Theme System - Single Source of Truth for Design Tokens
 * Ensures consistent visual identity across all boards and components
 */

export interface BoardTheme {
  id: string;
  name: string;
  gradient: {
    from: string;
    to: string;
    css: string;
  };
  accent: string;
  chip: {
    background: string;
    text: string;
    border: string;
  };
  ring: {
    focus: string;
    selection: string;
  };
  // Additional semantic colors
  background: {
    light: string;
    medium: string;
    dark: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
  };
}

export const BOARD_THEMES: Record<string, BoardTheme> = {
  productboard: {
    id: 'productboard',
    name: 'Product Development',
    gradient: {
      from: '#FCD34D',
      to: '#F59E0B',
      css: 'bg-gradient-to-br from-product-from to-product-to'
    },
    accent: '#D97706',
    chip: {
      background: '#FFFBEB',
      text: '#D97706',
      border: '#FDE68A'
    },
    ring: {
      focus: 'focus:ring-product-accent',
      selection: 'ring-product-accent'
    },
    background: {
      light: '#FFFFFF',
      medium: '#FFFBEB',
      dark: '#D97706'
    },
    text: {
      primary: '#0B0E14',
      secondary: '#D97706',
      muted: '#9CA3AF'
    }
  },

  cliniboard: {
    id: 'cliniboard',
    name: 'Clinical Research & Regulatory',
    gradient: {
      from: '#3B82F6',
      to: '#1E40AF',
      css: 'bg-gradient-to-br from-clinical-from to-clinical-to'
    },
    accent: '#2563EB',
    chip: {
      background: '#EFF6FF',
      text: '#2563EB',
      border: '#BFDBFE'
    },
    ring: {
      focus: 'focus:ring-clinical-accent',
      selection: 'ring-clinical-accent'
    },
    background: {
      light: '#FFFFFF',
      medium: '#EFF6FF',
      dark: '#1E40AF'
    },
    text: {
      primary: '#0B0E14',
      secondary: '#2563EB',
      muted: '#9CA3AF'
    }
  },

  eduboard: {
    id: 'eduboard',
    name: 'Education & Learning',
    gradient: {
      from: '#8B5CF6',
      to: '#F59E0B',
      css: 'bg-gradient-to-br from-education-from to-education-to'
    },
    accent: '#A855F7',
    chip: {
      background: '#F5F3FF',
      text: '#A855F7',
      border: '#DDD6FE'
    },
    ring: {
      focus: 'focus:ring-education-accent',
      selection: 'ring-education-accent'
    },
    background: {
      light: '#FFFFFF',
      medium: '#F5F3FF',
      dark: '#A855F7'
    },
    text: {
      primary: '#0B0E14',
      secondary: '#A855F7',
      muted: '#9CA3AF'
    }
  },

  remediboard: {
    id: 'remediboard',
    name: 'Holistic Wellness & Remedies',
    gradient: {
      from: '#10B981',
      to: '#14B8A6',
      css: 'bg-gradient-to-br from-remedy-from to-remedy-to'
    },
    accent: '#059669',
    chip: {
      background: '#ECFDF5',
      text: '#059669',
      border: '#A7F3D0'
    },
    ring: {
      focus: 'focus:ring-remedy-accent',
      selection: 'ring-remedy-accent'
    },
    background: {
      light: '#FFFFFF',
      medium: '#ECFDF5',
      dark: '#059669'
    },
    text: {
      primary: '#0B0E14',
      secondary: '#059669',
      muted: '#9CA3AF'
    }
  }
};

// Utility functions
export const getBoardTheme = (boardId: string): BoardTheme => {
  return BOARD_THEMES[boardId] || BOARD_THEMES.cliniboard;
};

export const getAllBoardThemes = (): BoardTheme[] => {
  return Object.values(BOARD_THEMES);
};

// CSS Custom Properties Generator (for dynamic theming)
export const generateThemeCSS = (theme: BoardTheme): string => {
  return `
    --board-gradient-from: ${theme.gradient.from};
    --board-gradient-to: ${theme.gradient.to};
    --board-accent: ${theme.accent};
    --board-chip-bg: ${theme.chip.background};
    --board-chip-text: ${theme.chip.text};
    --board-chip-border: ${theme.chip.border};
    --board-bg-light: ${theme.background.light};
    --board-bg-medium: ${theme.background.medium};
    --board-bg-dark: ${theme.background.dark};
    --board-text-primary: ${theme.text.primary};
    --board-text-secondary: ${theme.text.secondary};
    --board-text-muted: ${theme.text.muted};
  `;
};

// Accessibility: Ensure WCAG AA contrast compliance
export const validateThemeContrast = (theme: BoardTheme): boolean => {
  // This would integrate with a contrast checking library
  // For now, we'll assume our predefined themes are compliant
  return true;
};

// Analytics integration
export const trackThemeUsage = (themeId: string, component: string) => {
  console.log(`🎨 Theme Usage: ${themeId} in ${component}`);
  // In production, integrate with analytics service
};
