import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAdvisorPersonas, usePersonaConfigurations } from '../useAdvisorPersonas';
import { advisorService } from '../../services/advisorService';
import type { Advisor, Domain, AdvisorResponse } from '../../types/domain';

// Mock the advisor service
vi.mock('../../services/advisorService', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    advisorService: {
      generateMultipleResponses: vi.fn(),
      generateAdvisorResponse: vi.fn(),
      generateResponseSummary: vi.fn(),
    },
  };
});

const mockDomain: Domain = {
  id: 'cliniboard',
  name: 'Cliniboard',
  description: 'Clinical research board',
  theme: {
    primary: '#3B82F6',
    secondary: '#1E40AF',
    accent: '#60A5FA',
    background: '#F8FAFC',
    text: '#1E293B',
  },
  advisors: [],
};

const mockAdvisor1: Advisor = {
  id: 'advisor-1',
  name: 'Dr. Test Advisor',
  expertise: 'Clinical Trials Design',
  background: 'Former FDA officer',
  domain: mockDomain,
  isSelected: true,
};

const mockAdvisor2: Advisor = {
  id: 'advisor-2',
  name: 'Dr. Second Advisor',
  expertise: 'Regulatory Affairs',
  background: 'Regulatory specialist',
  domain: mockDomain,
  isSelected: true,
};

const mockResponse1: AdvisorResponse = {
  advisorId: 'advisor-1',
  content: 'This is a clinical response from advisor 1',
  timestamp: new Date(),
  persona: {
    name: 'Dr. Test Advisor',
    expertise: 'Clinical Trials Design',
    background: 'Former FDA officer',
    tone: 'professional',
  },
};

const mockResponse2: AdvisorResponse = {
  advisorId: 'advisor-2',
  content: 'This is a regulatory response from advisor 2',
  timestamp: new Date(),
  persona: {
    name: 'Dr. Second Advisor',
    expertise: 'Regulatory Affairs',
    background: 'Regulatory specialist',
    tone: 'professional',
  },
};

describe('useAdvisorPersonas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useAdvisorPersonas([]));

      expect(result.current.responses).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.loadingAdvisors.size).toBe(0);
      expect(result.current.summary).toBe(null);
      expect(result.current.isGeneratingSummary).toBe(false);
      expect(result.current.summaryError).toBe(null);
    });
  });

  describe('submitPrompt', () => {
    it('should submit prompt and receive responses', async () => {
      const mockGenerateMultiple = vi.mocked(advisorService.generateMultipleResponses);
      mockGenerateMultiple.mockResolvedValue([mockResponse1, mockResponse2]);

      const { result } = renderHook(() => useAdvisorPersonas([mockAdvisor1, mockAdvisor2]));

      await act(async () => {
        await result.current.submitPrompt('Test prompt');
      });

      expect(mockGenerateMultiple).toHaveBeenCalledWith(
        [mockAdvisor1, mockAdvisor2],
        'Test prompt',
        undefined
      );

      await waitFor(() => {
        expect(result.current.responses).toHaveLength(2);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe(null);
      });
    });

    it('should handle empty prompt', async () => {
      const { result } = renderHook(() => useAdvisorPersonas([mockAdvisor1]));

      await act(async () => {
        await result.current.submitPrompt('');
      });

      expect(result.current.error).toBe('Prompt cannot be empty');
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle no selected advisors', async () => {
      const { result } = renderHook(() => useAdvisorPersonas([]));

      await act(async () => {
        await result.current.submitPrompt('Test prompt');
      });

      expect(result.current.error).toBe('No advisors selected');
      expect(result.current.isLoading).toBe(false);
    });

    it('should set loading state during request', async () => {
      const mockGenerateMultiple = vi.mocked(advisorService.generateMultipleResponses);
      
      // Create a promise that we can control
      let resolvePromise: (value: AdvisorResponse[]) => void;
      const controlledPromise = new Promise<AdvisorResponse[]>((resolve) => {
        resolvePromise = resolve;
      });
      mockGenerateMultiple.mockReturnValue(controlledPromise);

      const { result } = renderHook(() => useAdvisorPersonas([mockAdvisor1]));

      // Start the request
      act(() => {
        result.current.submitPrompt('Test prompt');
      });

      // Check loading state
      expect(result.current.isLoading).toBe(true);
      expect(result.current.loadingAdvisors.has('advisor-1')).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolvePromise!([mockResponse1]);
      });

      // Check final state
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.loadingAdvisors.size).toBe(0);
      });
    });

    it('should handle service errors', async () => {
      const mockGenerateMultiple = vi.mocked(advisorService.generateMultipleResponses);
      mockGenerateMultiple.mockRejectedValue(new Error('Service error'));

      const { result } = renderHook(() => useAdvisorPersonas([mockAdvisor1]));

      await act(async () => {
        await result.current.submitPrompt('Test prompt');
      });

      expect(result.current.error).toBe('Failed to generate advisor responses');
      expect(result.current.isLoading).toBe(false);
    });

    it('should include session context when provided', async () => {
      const mockGenerateMultiple = vi.mocked(advisorService.generateMultipleResponses);
      mockGenerateMultiple.mockResolvedValue([mockResponse1]);

      const { result } = renderHook(() => useAdvisorPersonas([mockAdvisor1]));

      await act(async () => {
        await result.current.submitPrompt('Test prompt', 'session context');
      });

      expect(mockGenerateMultiple).toHaveBeenCalledWith(
        [mockAdvisor1],
        'Test prompt',
        'session context'
      );
    });
  });

  describe('retryFailedResponse', () => {
    it('should retry response for specific advisor', async () => {
      const mockGenerateMultiple = vi.mocked(advisorService.generateMultipleResponses);
      const mockGenerateResponse = vi.mocked(advisorService.generateAdvisorResponse);
      
      mockGenerateMultiple.mockResolvedValue([mockResponse1]);
      mockGenerateResponse.mockResolvedValue(mockResponse1);

      const { result } = renderHook(() => useAdvisorPersonas([mockAdvisor1]));

      // First set a prompt
      await act(async () => {
        await result.current.submitPrompt('Original prompt');
      });

      // Then retry
      await act(async () => {
        await result.current.retryFailedResponse('advisor-1');
      });

      expect(mockGenerateResponse).toHaveBeenCalledWith(
        mockAdvisor1,
        'Original prompt',
        ''
      );
    });

    it('should handle retry with custom prompt', async () => {
      const mockGenerateResponse = vi.mocked(advisorService.generateAdvisorResponse);
      mockGenerateResponse.mockResolvedValue(mockResponse1);

      const { result } = renderHook(() => useAdvisorPersonas([mockAdvisor1]));

      await act(async () => {
        await result.current.retryFailedResponse('advisor-1', 'Custom retry prompt');
      });

      expect(mockGenerateResponse).toHaveBeenCalledWith(
        mockAdvisor1,
        'Custom retry prompt',
        ''
      );
    });

    it('should handle advisor not found', async () => {
      const { result } = renderHook(() => useAdvisorPersonas([mockAdvisor1]));

      await act(async () => {
        await result.current.retryFailedResponse('non-existent-advisor');
      });

      expect(result.current.error).toBe('Advisor non-existent-advisor not found');
    });

    it('should handle retry without previous prompt', async () => {
      const { result } = renderHook(() => useAdvisorPersonas([mockAdvisor1]));

      await act(async () => {
        await result.current.retryFailedResponse('advisor-1');
      });

      expect(result.current.error).toBe('No prompt available for retry');
    });
  });

  describe('clearResponses', () => {
    it('should clear all responses and errors', async () => {
      const mockGenerateMultiple = vi.mocked(advisorService.generateMultipleResponses);
      mockGenerateMultiple.mockResolvedValue([mockResponse1]);

      const { result } = renderHook(() => useAdvisorPersonas([mockAdvisor1]));

      // Add some responses
      await act(async () => {
        await result.current.submitPrompt('Test prompt');
      });

      // Clear responses
      act(() => {
        result.current.clearResponses();
      });

      expect(result.current.responses).toEqual([]);
      expect(result.current.error).toBe(null);
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      const { result } = renderHook(() => useAdvisorPersonas([]));

      // Trigger an error
      await act(async () => {
        await result.current.submitPrompt('Test prompt');
      });

      expect(result.current.error).toBeTruthy();

      // Clear error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('generateSummary', () => {
    it('should generate summary for existing responses', async () => {
      const mockGenerateMultiple = vi.mocked(advisorService.generateMultipleResponses);
      const mockGenerateSummary = vi.mocked(advisorService.generateResponseSummary);
      
      mockGenerateMultiple.mockResolvedValue([mockResponse1, mockResponse2]);
      mockGenerateSummary.mockResolvedValue('**Advisory Board Summary**\n\nThis is a test summary of the responses.');

      const { result } = renderHook(() => useAdvisorPersonas([mockAdvisor1, mockAdvisor2]));

      // First add some responses
      await act(async () => {
        await result.current.submitPrompt('Test prompt');
      });

      // Then generate summary
      await act(async () => {
        await result.current.generateSummary('Test prompt');
      });

      expect(mockGenerateSummary).toHaveBeenCalledWith([mockResponse1, mockResponse2], 'Test prompt');
      expect(result.current.summary).toBe('**Advisory Board Summary**\n\nThis is a test summary of the responses.');
      expect(result.current.isGeneratingSummary).toBe(false);
      expect(result.current.summaryError).toBe(null);
    });

    it('should handle summary generation with no responses', async () => {
      const { result } = renderHook(() => useAdvisorPersonas([mockAdvisor1]));

      await act(async () => {
        await result.current.generateSummary('Test prompt');
      });

      expect(result.current.summaryError).toBe('No responses available to summarize');
      expect(result.current.isGeneratingSummary).toBe(false);
    });

    it('should set loading state during summary generation', async () => {
      const mockGenerateMultiple = vi.mocked(advisorService.generateMultipleResponses);
      const mockGenerateSummary = vi.mocked(advisorService.generateResponseSummary);
      
      mockGenerateMultiple.mockResolvedValue([mockResponse1]);
      
      // Create a controlled promise for summary generation
      let resolveSummary: (value: string) => void;
      const summaryPromise = new Promise<string>((resolve) => {
        resolveSummary = resolve;
      });
      mockGenerateSummary.mockReturnValue(summaryPromise);

      const { result } = renderHook(() => useAdvisorPersonas([mockAdvisor1]));

      // Add responses first
      await act(async () => {
        await result.current.submitPrompt('Test prompt');
      });

      // Start summary generation
      act(() => {
        result.current.generateSummary('Test prompt');
      });

      // Check loading state
      expect(result.current.isGeneratingSummary).toBe(true);
      expect(result.current.summaryError).toBe(null);

      // Resolve the summary
      await act(async () => {
        resolveSummary!('Test summary');
      });

      // Check final state
      await waitFor(() => {
        expect(result.current.isGeneratingSummary).toBe(false);
        expect(result.current.summary).toBe('Test summary');
      });
    });

    it('should handle summary generation errors', async () => {
      const mockGenerateMultiple = vi.mocked(advisorService.generateMultipleResponses);
      const mockGenerateSummary = vi.mocked(advisorService.generateResponseSummary);
      
      mockGenerateMultiple.mockResolvedValue([mockResponse1]);
      mockGenerateSummary.mockRejectedValue(new Error('Summary generation failed'));

      const { result } = renderHook(() => useAdvisorPersonas([mockAdvisor1]));

      // Add responses first
      await act(async () => {
        await result.current.submitPrompt('Test prompt');
      });

      // Try to generate summary
      await act(async () => {
        await result.current.generateSummary('Test prompt');
      });

      expect(result.current.summaryError).toBe('Failed to generate response summary');
      expect(result.current.isGeneratingSummary).toBe(false);
      expect(result.current.summary).toBe(null);
    });
  });

  describe('clearSummary', () => {
    it('should clear summary and summary error', async () => {
      const mockGenerateMultiple = vi.mocked(advisorService.generateMultipleResponses);
      const mockGenerateSummary = vi.mocked(advisorService.generateResponseSummary);
      
      mockGenerateMultiple.mockResolvedValue([mockResponse1]);
      mockGenerateSummary.mockResolvedValue('Test summary');

      const { result } = renderHook(() => useAdvisorPersonas([mockAdvisor1]));

      // Add responses and generate summary
      await act(async () => {
        await result.current.submitPrompt('Test prompt');
      });

      await act(async () => {
        await result.current.generateSummary('Test prompt');
      });

      expect(result.current.summary).toBeTruthy();

      // Clear summary
      act(() => {
        result.current.clearSummary();
      });

      expect(result.current.summary).toBe(null);
      expect(result.current.summaryError).toBe(null);
    });
  });

  describe('clearSummaryError', () => {
    it('should clear only summary error', async () => {
      const { result } = renderHook(() => useAdvisorPersonas([mockAdvisor1]));

      // Trigger summary error
      await act(async () => {
        await result.current.generateSummary('Test prompt');
      });

      expect(result.current.summaryError).toBeTruthy();

      // Clear summary error
      act(() => {
        result.current.clearSummaryError();
      });

      expect(result.current.summaryError).toBe(null);
    });
  });
});

describe('usePersonaConfigurations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadPersonaConfigurations', () => {
    it('should load persona configurations for advisors', async () => {
      const { result } = renderHook(() => usePersonaConfigurations([mockAdvisor1, mockAdvisor2]));

      await act(async () => {
        await result.current.loadPersonaConfigurations();
      });

      expect(result.current.personaConfigs.size).toBe(2);
      expect(result.current.personaConfigs.has('advisor-1')).toBe(true);
      expect(result.current.personaConfigs.has('advisor-2')).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle empty advisor list', async () => {
      const { result } = renderHook(() => usePersonaConfigurations([]));

      await act(async () => {
        await result.current.loadPersonaConfigurations();
      });

      expect(result.current.personaConfigs.size).toBe(0);
      expect(result.current.isLoading).toBe(false);
    });

    it('should create correct persona configuration', async () => {
      const { result } = renderHook(() => usePersonaConfigurations([mockAdvisor1]));

      await act(async () => {
        await result.current.loadPersonaConfigurations();
      });

      const config = result.current.personaConfigs.get('advisor-1');
      expect(config).toBeDefined();
      expect(config.name).toBe('Dr. Test Advisor');
      expect(config.expertise).toBe('Clinical Trials Design');
      expect(config.background).toBe('Former FDA officer');
      expect(config.domain).toBe('cliniboard');
      expect(config.tone).toBe('professional, evidence-based, regulatory-focused');
      expect(Array.isArray(config.specializations)).toBe(true);
    });

    it('should group advisors by domain efficiently', async () => {
      const eduDomain: Domain = { ...mockDomain, id: 'eduboard' };
      const eduAdvisor: Advisor = {
        ...mockAdvisor1,
        id: 'edu-advisor',
        domain: eduDomain,
      };

      const { result } = renderHook(() => usePersonaConfigurations([mockAdvisor1, eduAdvisor]));

      await act(async () => {
        await result.current.loadPersonaConfigurations();
      });

      expect(result.current.personaConfigs.size).toBe(2);
      
      const clinicalConfig = result.current.personaConfigs.get('advisor-1');
      const eduConfig = result.current.personaConfigs.get('edu-advisor');
      
      expect(clinicalConfig.tone).toBe('professional, evidence-based, regulatory-focused');
      expect(eduConfig.tone).toBe('pedagogical, inclusive, reform-minded');
    });
  });
});
