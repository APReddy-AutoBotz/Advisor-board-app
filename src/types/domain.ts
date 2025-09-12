export type DomainId = 'cliniboard' | 'productboard' | 'eduboard' | 'remediboard';

export interface Domain {
  id: DomainId;
  name: string;
  description: string;
  theme: ThemeConfig;
  advisors: Advisor[];
}

export interface ThemeConfig {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export interface UseCase {
  title: string;
  prompt: string;
}

export interface DomainSpec {
  name: string;
  description: string;
  advisors: AdvisorSpec[];
  use_cases: UseCase[];
}

export interface AdvisorSpec {
  name: string;
  expertise: string;
  background: string;
}

export interface Advisor {
  id: string;
  name: string;
  expertise: string;
  background: string;
  domain: DomainId;
  avatar?: string;
  isSelected: boolean;
  credentials?: string;
  specialties?: string[];
  yearsExperience?: number;
  publications?: number;
  affiliations?: string[];
  // AI-Advisor Gallery enhancements
  genderPref?: 'fem' | 'masc' | 'any';
  portraitKey?: string;
  aiPersonaName?: {
    firstName: string;
    lastName: string;
    fullName: string;
  };
}

export interface AdvisorResponse {
  advisorId: string;
  content: string;
  timestamp: Date;
  persona: PersonaConfig;
}

export interface PersonaConfig {
  name: string;
  expertise: string;
  background: string;
  tone?: string;
  specialization?: string[];
}
