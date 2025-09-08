import type { Advisor, AdvisorResponse, DomainId } from './domain';

export interface ConsultationSession {
  id: string;
  selectedAdvisors: Advisor[];
  prompt: string;
  responses: AdvisorResponse[];
  timestamp: Date;
  summary?: string;
  domain?: string;
  isMultiDomain?: boolean;
  domains?: DomainId[];
}

export interface MultiDomainSession extends ConsultationSession {
  isMultiDomain: true;
  domains: DomainId[];
  responsesByDomain: Record<DomainId, AdvisorResponse[]>;
}

export interface SessionState {
  currentSession?: ConsultationSession;
  sessionHistory: ConsultationSession[];
  selectedDomain?: string;
  selectedAdvisors: Advisor[];
  isLoading: boolean;
  error?: string;
}

export interface ExportOptions {
  format: 'pdf' | 'markdown';
  includeMetadata: boolean;
  includeTimestamps: boolean;
  includeSummary: boolean;
}

export interface SessionMetadata {
  sessionId: string;
  createdAt: Date;
  updatedAt: Date;
  domain: string;
  advisorCount: number;
  responseCount: number;
}