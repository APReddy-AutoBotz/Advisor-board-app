import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExportService } from '../exportService';
import type { ConsultationSession } from '../../types/session';
import type { Advisor, AdvisorResponse } from '../../types/domain';

// Mock jsPDF
vi.mock('jspdf', () => {
  const mockDoc = {
    setFontSize: vi.fn(),
    setFont: vi.fn(),
    text: vi.fn(),
    splitTextToSize: vi.fn((text: string) => {
      // Always return an array of strings, simulating text wrapping
      if (!text) return [''];
      return text.length > 50 ? [text.substring(0, 50), text.substring(50)] : [text];
    }),
    addPage: vi.fn(),
    save: vi.fn(),
    internal: {
      pageSize: {
        height: 297
      }
    }
  };
  
  return {
    default: vi.fn(() => mockDoc)
  };
});

// Mock DOM methods for markdown export
Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mock-url'),
    revokeObjectURL: vi.fn()
  }
});

Object.defineProperty(global, 'Blob', {
  value: vi.fn((content, options) => ({ content, options }))
});

// Mock document methods
Object.defineProperty(global, 'document', {
  value: {
    createElement: vi.fn(() => ({
      href: '',
      download: '',
      click: vi.fn(),
      style: {}
    })),
    body: {
      appendChild: vi.fn(),
      removeChild: vi.fn()
    }
  }
});

describe('ExportService', () => {
  let mockSession: ConsultationSession;
  let mockAdvisors: Advisor[];
  let mockResponses: AdvisorResponse[];

  beforeEach(() => {
    mockAdvisors = [
      {
        id: 'advisor-1',
        name: 'Dr. Jane Smith',
        expertise: 'Clinical Research',
        background: 'Expert in clinical trials',
        domain: {
          id: 'cliniboard',
          name: 'CliniBoard',
          description: 'Clinical expertise',
          theme: { primary: '#3B82F6', secondary: '#EFF6FF' },
          advisors: []
        },
        isSelected: true
      },
      {
        id: 'advisor-2',
        name: 'Prof. John Doe',
        expertise: 'Medical Ethics',
        background: 'Ethics specialist',
        domain: {
          id: 'cliniboard',
          name: 'CliniBoard',
          description: 'Clinical expertise',
          theme: { primary: '#3B82F6', secondary: '#EFF6FF' },
          advisors: []
        },
        isSelected: true
      }
    ];

    mockResponses = [
      {
        advisorId: 'advisor-1',
        content: 'This is a detailed clinical response about the research methodology.',
        timestamp: new Date('2024-01-15T10:30:00Z'),
        persona: {
          name: 'Dr. Jane Smith',
          role: 'Clinical Research Expert',
          expertise: ['Clinical Trials', 'Research Design'],
          tone: 'professional',
          background: 'Expert in clinical trials'
        }
      },
      {
        advisorId: 'advisor-2',
        content: 'From an ethical perspective, we need to consider patient consent and data privacy.',
        timestamp: new Date('2024-01-15T10:32:00Z'),
        persona: {
          name: 'Prof. John Doe',
          role: 'Medical Ethics Specialist',
          expertise: ['Medical Ethics', 'Patient Rights'],
          tone: 'thoughtful',
          background: 'Ethics specialist'
        }
      }
    ];

    mockSession = {
      id: 'session-123',
      selectedAdvisors: mockAdvisors,
      prompt: 'What are the key considerations for designing a clinical trial?',
      responses: mockResponses,
      timestamp: new Date('2024-01-15T10:00:00Z'),
      summary: 'The advisors discussed clinical trial design and ethical considerations.',
      domain: 'cliniboard'
    };

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateSessionForExport', () => {
    it('should validate a complete session successfully', () => {
      const result = ExportService.validateSessionForExport(mockSession);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for missing session ID', () => {
      const invalidSession = { ...mockSession, id: '' };
      const result = ExportService.validateSessionForExport(invalidSession);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Session ID is required');
    });

    it('should return errors for missing prompt', () => {
      const invalidSession = { ...mockSession, prompt: '' };
      const result = ExportService.validateSessionForExport(invalidSession);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Session prompt is required');
    });

    it('should return errors for no selected advisors', () => {
      const invalidSession = { ...mockSession, selectedAdvisors: [] };
      const result = ExportService.validateSessionForExport(invalidSession);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least one advisor must be selected');
    });

    it('should return errors for missing timestamp', () => {
      const invalidSession = { ...mockSession, timestamp: undefined as any };
      const result = ExportService.validateSessionForExport(invalidSession);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Session timestamp is required');
    });
  });

  describe('formatSessionForExport', () => {
    it('should format session data correctly', () => {
      const result = ExportService.formatSessionForExport(mockSession);
      
      expect(result.metadata).toEqual({
        sessionId: 'session-123',
        createdAt: mockSession.timestamp,
        updatedAt: mockSession.timestamp,
        domain: 'cliniboard',
        advisorCount: 2,
        responseCount: 2
      });

      expect(result.formattedResponses).toHaveLength(2);
      expect(result.formattedResponses[0]).toEqual({
        advisor: 'Dr. Jane Smith',
        expertise: 'Clinical Research',
        content: 'This is a detailed clinical response about the research methodology.',
        timestamp: '2024-01-15T10:30:00.000Z'
      });
    });

    it('should handle unknown advisors gracefully', () => {
      const sessionWithUnknownAdvisor = {
        ...mockSession,
        responses: [{
          advisorId: 'unknown-advisor',
          content: 'Response from unknown advisor',
          timestamp: new Date('2024-01-15T10:30:00Z'),
          persona: {
            name: 'Unknown',
            role: 'Unknown',
            expertise: [],
            tone: 'neutral',
            background: ''
          }
        }]
      };

      const result = ExportService.formatSessionForExport(sessionWithUnknownAdvisor);
      
      expect(result.formattedResponses[0].advisor).toBe('Unknown Advisor');
      expect(result.formattedResponses[0].expertise).toBe('');
    });
  });

  describe('exportToPDF', () => {
    it('should create PDF with all sections when all options are enabled', async () => {
      const jsPDF = await import('jspdf');
      const mockDoc = new jsPDF.default();
      
      await ExportService.exportToPDF(mockSession, {
        format: 'pdf',
        includeMetadata: true,
        includeTimestamps: true,
        includeSummary: true
      });

      expect(mockDoc.setFontSize).toHaveBeenCalledWith(20);
      expect(mockDoc.setFont).toHaveBeenCalledWith('helvetica', 'bold');
      expect(mockDoc.text).toHaveBeenCalled();
      expect(mockDoc.save).toHaveBeenCalledWith(
        expect.stringMatching(/advisorboard-session-session-123-\d{4}-\d{2}-\d{2}\.pdf/)
      );
    });

    it('should skip metadata section when includeMetadata is false', async () => {
      const jsPDF = await import('jspdf');
      const mockDoc = new jsPDF.default();
      
      await ExportService.exportToPDF(mockSession, {
        format: 'pdf',
        includeMetadata: false,
        includeTimestamps: true,
        includeSummary: true
      });

      expect(mockDoc.save).toHaveBeenCalled();
    });

    it('should handle sessions without summary', async () => {
      const sessionWithoutSummary = { ...mockSession, summary: undefined };
      
      await expect(
        ExportService.exportToPDF(sessionWithoutSummary, {
          format: 'pdf',
          includeMetadata: true,
          includeTimestamps: true,
          includeSummary: true
        })
      ).resolves.not.toThrow();
    });
  });

  describe('exportToMarkdown', () => {
    it('should create markdown with all sections when all options are enabled', async () => {
      await ExportService.exportToMarkdown(mockSession, {
        format: 'markdown',
        includeMetadata: true,
        includeTimestamps: true,
        includeSummary: true
      });

      expect(global.Blob).toHaveBeenCalledWith(
        [expect.stringContaining('# AdvisorBoard Consultation Session')],
        { type: 'text/markdown' }
      );
      
      expect(document.createElement).toHaveBeenCalledWith('a');
    });

    it('should skip metadata section when includeMetadata is false', async () => {
      await ExportService.exportToMarkdown(mockSession, {
        format: 'markdown',
        includeMetadata: false,
        includeTimestamps: true,
        includeSummary: true
      });

      expect(global.Blob).toHaveBeenCalledWith(
        [expect.not.stringContaining('## Session Information')],
        { type: 'text/markdown' }
      );
    });

    it('should skip timestamps when includeTimestamps is false', async () => {
      await ExportService.exportToMarkdown(mockSession, {
        format: 'markdown',
        includeMetadata: true,
        includeTimestamps: false,
        includeSummary: true
      });

      expect(global.Blob).toHaveBeenCalledWith(
        [expect.not.stringContaining('Response time:')],
        { type: 'text/markdown' }
      );
    });

    it('should skip summary when includeSummary is false', async () => {
      await ExportService.exportToMarkdown(mockSession, {
        format: 'markdown',
        includeMetadata: true,
        includeTimestamps: true,
        includeSummary: false
      });

      expect(global.Blob).toHaveBeenCalledWith(
        [expect.not.stringContaining('## Summary')],
        { type: 'text/markdown' }
      );
    });

    it('should handle sessions without responses', async () => {
      const sessionWithoutResponses = { ...mockSession, responses: [] };
      
      await expect(
        ExportService.exportToMarkdown(sessionWithoutResponses, {
          format: 'markdown',
          includeMetadata: true,
          includeTimestamps: true,
          includeSummary: true
        })
      ).resolves.not.toThrow();
    });
  });
});
