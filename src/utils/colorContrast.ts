/**
 * Color contrast utilities for accessibility testing
 * Based on WCAG 2.1 guidelines
 */

interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): RGB | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Calculate relative luminance of a color
 * Based on WCAG 2.1 formula
 */
export function getLuminance(rgb: RGB): number {
  const { r, g, b } = rgb;
  
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: RGB, color2: RGB): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Check if contrast ratio meets WCAG standards
 */
export function meetsContrastRequirement(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  size: 'normal' | 'large' = 'normal'
): boolean {
  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);
  
  if (!fg || !bg) return false;
  
  const ratio = getContrastRatio(fg, bg);
  
  // WCAG 2.1 requirements
  const requirements = {
    AA: {
      normal: 4.5,
      large: 3.0
    },
    AAA: {
      normal: 7.0,
      large: 4.5
    }
  };
  
  return ratio >= requirements[level][size];
}

/**
 * Validate color combinations for all theme variants
 */
export function validateThemeContrast(theme: {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}): {
  isValid: boolean;
  violations: string[];
} {
  const violations: string[] = [];
  
  // Check primary text on background
  if (!meetsContrastRequirement(theme.text, theme.background)) {
    violations.push(`Text (${theme.text}) on background (${theme.background}) fails contrast requirement`);
  }
  
  // Check primary button contrast
  if (!meetsContrastRequirement('#FFFFFF', theme.primary)) {
    violations.push(`White text on primary (${theme.primary}) fails contrast requirement`);
  }
  
  // Check secondary button contrast
  if (!meetsContrastRequirement('#FFFFFF', theme.secondary)) {
    violations.push(`White text on secondary (${theme.secondary}) fails contrast requirement`);
  }
  
  // Check accent color contrast
  if (!meetsContrastRequirement('#FFFFFF', theme.accent)) {
    violations.push(`White text on accent (${theme.accent}) fails contrast requirement`);
  }
  
  return {
    isValid: violations.length === 0,
    violations
  };
}

/**
 * Get computed color from DOM element
 */
export function getComputedColor(element: HTMLElement, property: 'color' | 'backgroundColor'): string | null {
  const computed = window.getComputedStyle(element);
  const value = computed.getPropertyValue(property);
  
  // Convert rgb() to hex
  const rgbMatch = value.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]);
    const g = parseInt(rgbMatch[2]);
    const b = parseInt(rgbMatch[3]);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }
  
  return value;
}

/**
 * Check contrast of DOM element
 */
export function checkElementContrast(element: HTMLElement): {
  ratio: number;
  meetsAA: boolean;
  meetsAAA: boolean;
} {
  const color = getComputedColor(element, 'color');
  const backgroundColor = getComputedColor(element, 'backgroundColor');
  
  if (!color || !backgroundColor) {
    return { ratio: 0, meetsAA: false, meetsAAA: false };
  }
  
  const fg = hexToRgb(color);
  const bg = hexToRgb(backgroundColor);
  
  if (!fg || !bg) {
    return { ratio: 0, meetsAA: false, meetsAAA: false };
  }
  
  const ratio = getContrastRatio(fg, bg);
  
  return {
    ratio,
    meetsAA: ratio >= 4.5,
    meetsAAA: ratio >= 7.0
  };
}

/**
 * Domain-specific color validation
 */
export const DOMAIN_COLORS = {
  cliniboard: {
    primary: '#2563eb',
    secondary: '#1d4ed8',
    accent: '#60a5fa',
    background: '#ffffff',
    text: '#1e293b'
  },
  eduboard: {
    primary: '#d97706',
    secondary: '#b45309',
    accent: '#fbbf24',
    background: '#ffffff',
    text: '#92400e'
  },
  remediboard: {
    primary: '#059669',
    secondary: '#047857',
    accent: '#34d399',
    background: '#ffffff',
    text: '#064e3b'
  }
};

/**
 * Validate all domain color schemes
 */
export function validateAllDomainColors(): {
  [key: string]: {
    isValid: boolean;
    violations: string[];
  };
} {
  const results: { [key: string]: { isValid: boolean; violations: string[] } } = {};
  
  Object.entries(DOMAIN_COLORS).forEach(([domain, colors]) => {
    results[domain] = validateThemeContrast(colors);
  });
  
  return results;
}
