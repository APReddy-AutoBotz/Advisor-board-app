import { describe, it, expect } from 'vitest';
import {
  hexToRgb,
  getLuminance,
  getContrastRatio,
  meetsContrastRequirement,
  validateThemeContrast,
  validateAllDomainColors,
  DOMAIN_COLORS
} from '../colorContrast';

describe('Color Contrast Utilities', () => {
  describe('hexToRgb', () => {
    it('should convert hex colors to RGB', () => {
      expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
      expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('ffffff')).toEqual({ r: 255, g: 255, b: 255 }); // Without #
    });

    it('should return null for invalid hex colors', () => {
      expect(hexToRgb('invalid')).toBeNull();
      expect(hexToRgb('#gggggg')).toBeNull();
      expect(hexToRgb('')).toBeNull();
    });
  });

  describe('getLuminance', () => {
    it('should calculate correct luminance for white', () => {
      const white = { r: 255, g: 255, b: 255 };
      expect(getLuminance(white)).toBeCloseTo(1, 2);
    });

    it('should calculate correct luminance for black', () => {
      const black = { r: 0, g: 0, b: 0 };
      expect(getLuminance(black)).toBeCloseTo(0, 2);
    });

    it('should calculate luminance for mid-tone colors', () => {
      const gray = { r: 128, g: 128, b: 128 };
      const luminance = getLuminance(gray);
      expect(luminance).toBeGreaterThan(0);
      expect(luminance).toBeLessThan(1);
    });
  });

  describe('getContrastRatio', () => {
    it('should calculate maximum contrast ratio for black and white', () => {
      const black = { r: 0, g: 0, b: 0 };
      const white = { r: 255, g: 255, b: 255 };
      
      const ratio = getContrastRatio(black, white);
      expect(ratio).toBeCloseTo(21, 0); // Maximum possible ratio
    });

    it('should calculate minimum contrast ratio for identical colors', () => {
      const color = { r: 128, g: 128, b: 128 };
      
      const ratio = getContrastRatio(color, color);
      expect(ratio).toBeCloseTo(1, 2); // Minimum possible ratio
    });

    it('should be symmetric (order should not matter)', () => {
      const color1 = { r: 255, g: 0, b: 0 };
      const color2 = { r: 0, g: 255, b: 0 };
      
      const ratio1 = getContrastRatio(color1, color2);
      const ratio2 = getContrastRatio(color2, color1);
      
      expect(ratio1).toBeCloseTo(ratio2, 5);
    });
  });

  describe('meetsContrastRequirement', () => {
    it('should pass AA requirements for high contrast combinations', () => {
      expect(meetsContrastRequirement('#000000', '#ffffff')).toBe(true); // Black on white
      expect(meetsContrastRequirement('#ffffff', '#000000')).toBe(true); // White on black
    });

    it('should fail AA requirements for low contrast combinations', () => {
      expect(meetsContrastRequirement('#888888', '#999999')).toBe(false); // Similar grays
      expect(meetsContrastRequirement('#ffff00', '#ffffff')).toBe(false); // Yellow on white
    });

    it('should handle different size requirements', () => {
      // Some combinations might pass for large text but fail for normal text
      const result1 = meetsContrastRequirement('#767676', '#ffffff', 'AA', 'normal');
      const result2 = meetsContrastRequirement('#767676', '#ffffff', 'AA', 'large');
      
      // Large text has lower requirements (3:1 vs 4.5:1)
      expect(result2).toBe(true);
    });

    it('should handle AAA level requirements', () => {
      // AAA has stricter requirements than AA
      const color1 = '#595959'; // This should pass AA but might fail AAA
      const color2 = '#ffffff';
      
      const aaResult = meetsContrastRequirement(color1, color2, 'AA');
      const aaaResult = meetsContrastRequirement(color1, color2, 'AAA');
      
      expect(aaResult).toBe(true);
      expect(aaaResult).toBe(false);
    });
  });

  describe('validateThemeContrast', () => {
    it('should validate a good theme with no violations', () => {
      const goodTheme = {
        primary: '#2563eb',
        secondary: '#1d4ed8',
        accent: '#60a5fa',
        background: '#ffffff',
        text: '#000000'
      };
      
      const result = validateThemeContrast(goodTheme);
      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should identify violations in a poor theme', () => {
      const poorTheme = {
        primary: '#ffff00', // Yellow - poor contrast with white text
        secondary: '#ffff00',
        accent: '#ffff00',
        background: '#ffffff',
        text: '#cccccc' // Light gray - poor contrast with white background
      };
      
      const result = validateThemeContrast(poorTheme);
      expect(result.isValid).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });

    it('should provide detailed violation messages', () => {
      const poorTheme = {
        primary: '#ffff00',
        secondary: '#1d4ed8',
        accent: '#60a5fa',
        background: '#ffffff',
        text: '#cccccc'
      };
      
      const result = validateThemeContrast(poorTheme);
      expect(result.violations.some(v => v.includes('Text'))).toBe(true);
      expect(result.violations.some(v => v.includes('primary'))).toBe(true);
    });
  });

  describe('Domain Color Validation', () => {
    it('should have valid color schemes for all domains', () => {
      const results = validateAllDomainColors();
      
      Object.entries(results).forEach(([domain, result]) => {
        expect(result.isValid).toBe(true);
        expect(result.violations).toHaveLength(0);
      });
    });

    it('should include all expected domains', () => {
      const results = validateAllDomainColors();
      
      expect(results).toHaveProperty('cliniboard');
      expect(results).toHaveProperty('eduboard');
      expect(results).toHaveProperty('remediboard');
    });

    it('should have proper color definitions for each domain', () => {
      Object.entries(DOMAIN_COLORS).forEach(([domain, colors]) => {
        expect(colors).toHaveProperty('primary');
        expect(colors).toHaveProperty('secondary');
        expect(colors).toHaveProperty('accent');
        expect(colors).toHaveProperty('background');
        expect(colors).toHaveProperty('text');
        
        // All colors should be valid hex codes
        Object.values(colors).forEach(color => {
          expect(hexToRgb(color)).not.toBeNull();
        });
      });
    });
  });

  describe('Specific Domain Color Tests', () => {
    describe('Cliniboard Colors', () => {
      it('should meet contrast requirements', () => {
        const colors = DOMAIN_COLORS.cliniboard;
        const result = validateThemeContrast(colors);
        
        expect(result.isValid).toBe(true);
        expect(result.violations).toHaveLength(0);
      });

      it('should have sufficient contrast for primary button', () => {
        const { primary } = DOMAIN_COLORS.cliniboard;
        expect(meetsContrastRequirement('#ffffff', primary)).toBe(true);
      });
    });

    describe('EduBoard Colors', () => {
      it('should meet contrast requirements', () => {
        const colors = DOMAIN_COLORS.eduboard;
        const result = validateThemeContrast(colors);
        
        expect(result.isValid).toBe(true);
        expect(result.violations).toHaveLength(0);
      });

      it('should have sufficient contrast for primary button', () => {
        const { primary } = DOMAIN_COLORS.eduboard;
        expect(meetsContrastRequirement('#ffffff', primary)).toBe(true);
      });
    });

    describe('RemediBoard Colors', () => {
      it('should meet contrast requirements', () => {
        const colors = DOMAIN_COLORS.remediboard;
        const result = validateThemeContrast(colors);
        
        expect(result.isValid).toBe(true);
        expect(result.violations).toHaveLength(0);
      });

      it('should have sufficient contrast for primary button', () => {
        const { primary } = DOMAIN_COLORS.remediboard;
        expect(meetsContrastRequirement('#ffffff', primary)).toBe(true);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle transparent backgrounds gracefully', () => {
      const theme = {
        primary: '#2563eb',
        secondary: '#1d4ed8',
        accent: '#60a5fa',
        background: 'transparent',
        text: '#000000'
      };
      
      // Should not throw an error
      expect(() => validateThemeContrast(theme)).not.toThrow();
    });

    it('should handle invalid color formats', () => {
      const theme = {
        primary: 'invalid-color',
        secondary: '#1d4ed8',
        accent: '#60a5fa',
        background: '#ffffff',
        text: '#000000'
      };
      
      const result = validateThemeContrast(theme);
      // Should handle gracefully and report violations
      expect(result.isValid).toBe(false);
    });
  });
});
