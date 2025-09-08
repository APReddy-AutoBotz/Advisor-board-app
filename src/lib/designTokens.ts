/**
 * Premium Design Tokens - Single Source of Truth
 * Mobbin-grade design system with exact specifications
 */

// Grid & Layout System
export const GRID = {
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1440,
  },
  container: {
    desktop: 1200,
    tablet: 688,
    mobile: '100%',
    padding: 16,
  },
} as const;

// 4-Point Spacing Scale
export const SPACING = {
  0.5: 2,   // 0.125rem
  1: 4,     // 0.25rem  
  2: 8,     // 0.5rem
  3: 12,    // 0.75rem
  4: 16,    // 1rem
  5: 20,    // 1.25rem
  6: 24,    // 1.5rem
  8: 32,    // 2rem
  10: 40,   // 2.5rem
  12: 48,   // 3rem
  14: 56,   // 3.5rem
  16: 64,   // 4rem
  20: 80,   // 5rem
  24: 96,   // 6rem
  30: 120,  // 7.5rem
} as const;

// Border Radius Scale
export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
} as const;

// Shadow System
export const SHADOWS = {
  card: '0 8px 24px rgba(0, 0, 0, 0.08)',
  hover: '0 10px 28px rgba(0, 0, 0, 0.12)',
  focus: '0 0 0 3px rgba(59, 130, 246, 0.1)',
} as const;

// Typography Scale (Inter/DM Sans)
export const TYPOGRAPHY = {
  display: {
    size: 64,
    lineHeight: 68,
    letterSpacing: '-0.02em',
    fontWeight: 700,
    fontFamily: 'DM Sans',
  },
  h1: {
    size: 48,
    lineHeight: 56,
    letterSpacing: '-0.02em',
    fontWeight: 700,
    fontFamily: 'DM Sans',
  },
  h2: {
    size: 32,
    lineHeight: 40,
    letterSpacing: '-0.01em',
    fontWeight: 600,
    fontFamily: 'DM Sans',
  },
  h3: {
    size: 20,
    lineHeight: 28,
    letterSpacing: '-0.01em',
    fontWeight: 600,
    fontFamily: 'Inter',
  },
  body: {
    size: 16,
    lineHeight: 24,
    letterSpacing: '0em',
    fontWeight: 400,
    fontFamily: 'Inter',
  },
  small: {
    size: 14,
    lineHeight: 20,
    letterSpacing: '0em',
    fontWeight: 400,
    fontFamily: 'Inter',
  },
} as const;

// Ink Neutral Colors (exact specs)
export const NEUTRALS = {
  ink900: '#0B0E14',
  ink700: '#1F2937',
  ink600: '#374151', 
  ink400: '#9CA3AF',
  ink200: '#E5E7EB',
  ink100: '#F3F4F6',
  paper: '#FFFFFF',
} as const;

// BoardTheme System (exact gradients & accents)
export const BOARD_THEMES = {
  clinical: {
    name: 'Clinical Research & Regulatory',
    gradient: {
      from: '#3B82F6',
      to: '#1E40AF',
      css: 'bg-gradient-to-br from-clinical-from to-clinical-to',
    },
    accent: '#2563EB',
    background: '#eff6ff',
    text: '#1e40af',
  },
  product: {
    name: 'Product Development',
    gradient: {
      from: '#FCD34D', 
      to: '#F59E0B',
      css: 'bg-gradient-to-br from-product-from to-product-to',
    },
    accent: '#D97706',
    background: '#fffbeb',
    text: '#d97706',
  },
  education: {
    name: 'Education & Learning',
    gradient: {
      from: '#8B5CF6',
      to: '#F59E0B', 
      css: 'bg-gradient-to-br from-education-from to-education-to',
    },
    accent: '#A855F7',
    background: '#f5f3ff',
    text: '#a855f7',
  },
  remedy: {
    name: 'Holistic Wellness & Remedies',
    gradient: {
      from: '#10B981',
      to: '#14B8A6',
      css: 'bg-gradient-to-br from-remedy-from to-remedy-to', 
    },
    accent: '#059669',
    background: '#ecfdf5',
    text: '#059669',
  },
} as const;

// Motion System (exact specs)
export const MOTION = {
  duration: {
    enter: 160,
    hover: 120,
    dialog: 200,
    shimmer: 1200, // Skeleton shimmer animation
    stagger: 160,  // Staggered element delays
  },
  easing: {
    premium: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',
  },
  transforms: {
    cardLift: 'translateY(-8px)', // Premium card hover lift
    cardHover: 'translateY(-2px)', // Subtle hover state
  },
} as const;

// Grain Overlay (6-8% opacity white noise)
export const GRAIN = {
  opacity: 0.08,
  pattern: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E\")",
  // Ultra-soft gradient backgrounds for premium feel
  backgrounds: {
    hero: 'linear-gradient(135deg, #f8fafc 0%, rgba(59, 130, 246, 0.06) 50%, rgba(147, 51, 234, 0.04) 100%)',
    section: 'linear-gradient(180deg, rgba(248, 250, 252, 0.8) 0%, rgba(255, 255, 255, 0.9) 100%)',
  },
} as const;

// Utility Functions
export const getBoardTheme = (boardId: string) => {
  return BOARD_THEMES[boardId as keyof typeof BOARD_THEMES] || BOARD_THEMES.clinical;
};

export const getSpacing = (scale: keyof typeof SPACING) => {
  return `${SPACING[scale]}px`;
};

export const getRadius = (scale: keyof typeof RADIUS) => {
  return `${RADIUS[scale]}px`;
};

export const getTypography = (scale: keyof typeof TYPOGRAPHY) => {
  const type = TYPOGRAPHY[scale];
  return {
    fontSize: `${type.size}px`,
    lineHeight: `${type.lineHeight}px`,
    letterSpacing: type.letterSpacing,
    fontWeight: type.fontWeight,
    fontFamily: type.fontFamily,
  };
};

// CSS Custom Properties Generator
export const generateCSSVariables = () => {
  return `
    :root {
      /* Spacing Scale */
      ${Object.entries(SPACING).map(([key, value]) => `--spacing-${key}: ${value}px;`).join('\n      ')}
      
      /* Border Radius */
      ${Object.entries(RADIUS).map(([key, value]) => `--radius-${key}: ${value}px;`).join('\n      ')}
      
      /* Colors */
      ${Object.entries(NEUTRALS).map(([key, value]) => `--color-${key.toLowerCase()}: ${value};`).join('\n      ')}
      
      /* Board Themes */
      ${Object.entries(BOARD_THEMES).map(([boardId, theme]) => `
      --${boardId}-gradient-from: ${theme.gradient.from};
      --${boardId}-gradient-to: ${theme.gradient.to};
      --${boardId}-accent: ${theme.accent};
      --${boardId}-background: ${theme.background};
      --${boardId}-text: ${theme.text};`).join('\n      ')}
      
      /* Motion */
      --motion-enter: ${MOTION.duration.enter}ms;
      --motion-hover: ${MOTION.duration.hover}ms;
      --motion-dialog: ${MOTION.duration.dialog}ms;
      --motion-shimmer: ${MOTION.duration.shimmer}ms;
      --motion-stagger: ${MOTION.duration.stagger}ms;
      --motion-easing: ${MOTION.easing.premium};
      --motion-card-lift: ${MOTION.transforms.cardLift};
      --motion-card-hover: ${MOTION.transforms.cardHover};
      
      /* Grain */
      --grain-opacity: ${GRAIN.opacity};
      --grain-pattern: ${GRAIN.pattern};
      --grain-hero-bg: ${GRAIN.backgrounds.hero};
      --grain-section-bg: ${GRAIN.backgrounds.section};
    }
  `;
};

// Responsive Utilities
export const RESPONSIVE = {
  mobile: `@media (max-width: ${GRID.breakpoints.sm - 1}px)`,
  tablet: `@media (min-width: ${GRID.breakpoints.sm}px) and (max-width: ${GRID.breakpoints.lg - 1}px)`,
  desktop: `@media (min-width: ${GRID.breakpoints.lg}px)`,
  
  // Mobile-first breakpoints
  sm: `@media (min-width: ${GRID.breakpoints.sm}px)`,
  md: `@media (min-width: ${GRID.breakpoints.md}px)`,
  lg: `@media (min-width: ${GRID.breakpoints.lg}px)`,
  xl: `@media (min-width: ${GRID.breakpoints.xl}px)`,
  '2xl': `@media (min-width: ${GRID.breakpoints['2xl']}px)`,
} as const;

// Export all tokens as default
export default {
  GRID,
  SPACING,
  RADIUS,
  SHADOWS,
  TYPOGRAPHY,
  NEUTRALS,
  BOARD_THEMES,
  MOTION,
  GRAIN,
  RESPONSIVE,
  getBoardTheme,
  getSpacing,
  getRadius,
  getTypography,
  generateCSSVariables,
};