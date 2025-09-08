import type { DomainId, ThemeConfig } from '../types/domain';

export const domainThemes: Record<DomainId, ThemeConfig> = {
  cliniboard: {
    primary: 'clinical-600',
    secondary: 'clinical-100',
    accent: 'clinical-500',
    background: 'clinical-50',
    text: 'clinical-900',
  },
  eduboard: {
    primary: 'education-600',
    secondary: 'education-100',
    accent: 'education-500',
    background: 'education-50',
    text: 'education-900',
  },
  remediboard: {
    primary: 'remedies-600',
    secondary: 'remedies-100',
    accent: 'remedies-500',
    background: 'remedies-50',
    text: 'remedies-900',
  },
};

export function getThemeForDomain(domainId: DomainId): ThemeConfig {
  return domainThemes[domainId];
}

export function getDomainColorClass(domainId: DomainId, variant: keyof ThemeConfig): string {
  const theme = getThemeForDomain(domainId);
  return theme[variant];
}