import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExportOptions } from '../ExportOptions';
import { ExportService } from '../../../services/exportService';
import ThemeProvider from '../../common/ThemeProvider';
import type { ConsultationSession } from '../../../types/session';
import type { Advisor, AdvisorResponse } from '../../../types/domain';

// Mock the ExportService
vi.mock('../../../services/exportService', () => ({
  ExportService: {
    exportToPDF: vi.fn(),
    exportToMarkdown: vi.fn(),
    validateSessionForExport: vi.fn()
  }
}));

// Helper function to render with ThemeProvider
const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('ExportOptions', () => {
  let mockSession: ConsultationSession;
  let mockOnExportComplete: ReturnType<typeof vi.fn>;
  let mockOnError: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    const mockAdvisors: Advisor[] = [
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
      }
    ];

    const mockResponses: AdvisorResponse[] = [
      {
        advisorId: 'advisor-1',
        content: 'This is a clinical response.',
        timestamp: new Date('2024-01-15T10:30:00Z'),
        persona: {
          name: 'Dr. Jane Smith',
          role: 'Clinical Research Expert',
          expertise: ['Clinical Trials'],
          tone: 'professional',
          background: 'Expert in clinical trials'
        }
      }
    ];

    mockSession = {
      id: 'session-123',
      selectedAdvisors: mockAdvisors,
      prompt: 'What are the key considerations for clinical trials?',
      responses: mockResponses,
      timestamp: new Date('2024-01-15T10:00:00Z'),
      summary: 'Summary of the consultation',
      domain: 'cliniboard'
    };

    mockOnExportComplete = vi.fn();
    mockOnError = vi.fn();

    // Reset mocks
    vi.clearAllMocks();
    
    // Setup default mock implementations
    vi.mocked(ExportService.validateSessionForExport).mockReturnValue({
      isValid: true,
      errors: []
    });
    vi.mocked(ExportService.exportToPDF).mockResolvedValue();
    vi.mocked(ExportService.exportToMarkdown).mockResolvedValue();
  });

  it('should render export options with session information', () => {
    renderWithTheme(
      <ExportOptions
        session={mockSession}
        onExportComplete={mockOnExportComplete}
        onError={mockOnError}
      />
    );

    expect(screen.getByText('Export Session')).toBeInTheDocument();
    expect(screen.getByText('Session ID: session-123')).toBeInTheDocument();
    expect(screen.getByText('Export as PDF')).toBeInTheDocument();
    expect(screen.getByText('Export as Markdown')).toBeInTheDocument();
  });

  it('should display session preview information', () => {
    renderWithTheme(
      <ExportOptions
        session={mockSession}
        onExportComplete={mockOnExportComplete}
        onError={mockOnError}
      />
    );

    expect(screen.getByText('Session Preview')).toBeInTheDocument();
    expect(screen.getByText('Advisors:')).toBeInTheDocument();
    expect(screen.getByText('Responses:')).toBeInTheDocument();
    expect(screen.getByText('Domain:')).toBeInTheDocument();
    expect(screen.getByText('cliniboard')).toBeInTheDocument();
  });

  it('should have all export options checked by default', () => {
    renderWithTheme(
      <ExportOptions
        session={mockSession}
        onExportComplete={mockOnExportComplete}
        onError={mockOnError}
      />
    );

    const metadataCheckbox = screen.getByLabelText(/Include session metadata/);
    const timestampsCheckbox = screen.getByLabelText(/Include timestamps/);
    const summaryCheckbox = screen.getByLabelText(/Include summary/);

    expect(metadataCheckbox).toBeChecked();
    expect(timestampsCheckbox).toBeChecked();
    expect(summaryCheckbox).toBeChecked();
  });

  it('should disable summary checkbox when no summary is available', () => {
    const sessionWithoutSummary = { ...mockSession, summary: undefined };
    
    renderWithTheme(
      <ExportOptions
        session={sessionWithoutSummary}
        onExportComplete={mockOnExportComplete}
        onError={mockOnError}
      />
    );

    const summaryCheckbox = screen.getByLabelText(/Include summary/);
    expect(summaryCheckbox).toBeDisabled();
    expect(screen.getByText(/not available/)).toBeInTheDocument();
  });

  it('should update export options when checkboxes are toggled', () => {
    renderWithTheme(
      <ExportOptions
        session={mockSession}
        onExportComplete={mockOnExportComplete}
        onError={mockOnError}
      />
    );

    const metadataCheckbox = screen.getByLabelText(/Include session metadata/);
    
    fireEvent.click(metadataCheckbox);
    expect(metadataCheckbox).not.toBeChecked();
    
    fireEvent.click(metadataCheckbox);
    expect(metadataCheckbox).toBeChecked();
  });

  it('should export to PDF when PDF button is clicked', async () => {
    renderWithTheme(
      <ExportOptions
        session={mockSession}
        onExportComplete={mockOnExportComplete}
        onError={mockOnError}
      />
    );

    const pdfButton = screen.getByText('Export as PDF');
    fireEvent.click(pdfButton);

    await waitFor(() => {
      expect(ExportService.validateSessionForExport).toHaveBeenCalledWith(mockSession);
      expect(ExportService.exportToPDF).toHaveBeenCalledWith(mockSession, {
        format: 'pdf',
        includeMetadata: true,
        includeTimestamps: true,
        includeSummary: true
      });
      expect(mockOnExportComplete).toHaveBeenCalled();
    });
  });

  it('should export to Markdown when Markdown button is clicked', async () => {
    renderWithTheme(
      <ExportOptions
        session={mockSession}
        onExportComplete={mockOnExportComplete}
        onError={mockOnError}
      />
    );

    const markdownButton = screen.getByText('Export as Markdown');
    fireEvent.click(markdownButton);

    await waitFor(() => {
      expect(ExportService.validateSessionForExport).toHaveBeenCalledWith(mockSession);
      expect(ExportService.exportToMarkdown).toHaveBeenCalledWith(mockSession, {
        format: 'markdown',
        includeMetadata: true,
        includeTimestamps: true,
        includeSummary: true
      });
      expect(mockOnExportComplete).toHaveBeenCalled();
    });
  });

  it('should show loading state during export', async () => {
    // Make the export take some time
    vi.mocked(ExportService.exportToPDF).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    renderWithTheme(
      <ExportOptions
        session={mockSession}
        onExportComplete={mockOnExportComplete}
        onError={mockOnError}
      />
    );

    const pdfButton = screen.getByText('Export as PDF');
    const markdownButton = screen.getByText('Export as Markdown');
    
    fireEvent.click(pdfButton);

    // Check that buttons are disabled during export
    expect(pdfButton).toBeDisabled();
    expect(markdownButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByText('Export as PDF')).toBeInTheDocument();
    });
  });

  it('should handle validation errors', async () => {
    vi.mocked(ExportService.validateSessionForExport).mockReturnValue({
      isValid: false,
      errors: ['Session ID is required', 'Prompt is missing']
    });

    renderWithTheme(
      <ExportOptions
        session={mockSession}
        onExportComplete={mockOnExportComplete}
        onError={mockOnError}
      />
    );

    const pdfButton = screen.getByText('Export as PDF');
    fireEvent.click(pdfButton);

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(
        'Export validation failed: Session ID is required, Prompt is missing'
      );
      expect(ExportService.exportToPDF).not.toHaveBeenCalled();
    });
  });

  it('should handle export errors', async () => {
    const exportError = new Error('Export failed');
    vi.mocked(ExportService.exportToPDF).mockRejectedValue(exportError);

    renderWithTheme(
      <ExportOptions
        session={mockSession}
        onExportComplete={mockOnExportComplete}
        onError={mockOnError}
      />
    );

    const pdfButton = screen.getByText('Export as PDF');
    fireEvent.click(pdfButton);

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Export failed');
      expect(mockOnExportComplete).not.toHaveBeenCalled();
    });
  });

  it('should respect custom export options', async () => {
    renderWithTheme(
      <ExportOptions
        session={mockSession}
        onExportComplete={mockOnExportComplete}
        onError={mockOnError}
      />
    );

    // Uncheck some options
    const metadataCheckbox = screen.getByLabelText(/Include session metadata/);
    const timestampsCheckbox = screen.getByLabelText(/Include timestamps/);
    
    fireEvent.click(metadataCheckbox);
    fireEvent.click(timestampsCheckbox);

    const pdfButton = screen.getByText('Export as PDF');
    fireEvent.click(pdfButton);

    await waitFor(() => {
      expect(ExportService.exportToPDF).toHaveBeenCalledWith(mockSession, {
        format: 'pdf',
        includeMetadata: false,
        includeTimestamps: false,
        includeSummary: true
      });
    });
  });

  it('should display export information', () => {
    renderWithTheme(
      <ExportOptions
        session={mockSession}
        onExportComplete={mockOnExportComplete}
        onError={mockOnError}
      />
    );

    expect(screen.getByText(/PDF exports will be saved to your downloads folder/)).toBeInTheDocument();
    expect(screen.getByText(/Markdown exports will be downloaded as .md files/)).toBeInTheDocument();
  });
});