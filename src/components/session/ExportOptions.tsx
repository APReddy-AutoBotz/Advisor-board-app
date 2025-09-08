import React, { useState } from 'react';
import Button from '../common/Button';
import Card from '../common/Card';
import { ExportService } from '../../services/exportService';
import type { ConsultationSession, ExportOptions as ExportOptionsType } from '../../types/session';

interface ExportOptionsProps {
  session: ConsultationSession;
  onExportComplete?: () => void;
  onError?: (error: string) => void;
}

export const ExportOptions: React.FC<ExportOptionsProps> = ({
  session,
  onExportComplete,
  onError
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptionsType>({
    format: 'pdf',
    includeMetadata: true,
    includeTimestamps: true,
    includeSummary: true
  });

  const handleExport = async (format: 'pdf' | 'markdown') => {
    setIsExporting(true);
    
    try {
      // Validate session data before export
      const validation = ExportService.validateSessionForExport(session);
      if (!validation.isValid) {
        throw new Error(`Export validation failed: ${validation.errors.join(', ')}`);
      }

      const options = { ...exportOptions, format };
      
      if (format === 'pdf') {
        await ExportService.exportToPDF(session, options);
      } else {
        await ExportService.exportToMarkdown(session, options);
      }
      
      onExportComplete?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Export failed';
      onError?.(errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  const handleOptionChange = (key: keyof ExportOptionsType, value: boolean) => {
    setExportOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Export Session
        </h3>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Session ID: {session.id}
        </div>
      </div>

      {/* Export Options */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Export Options
        </h4>
        
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={exportOptions.includeMetadata}
              onChange={(e) => handleOptionChange('includeMetadata', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Include session metadata
            </span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={exportOptions.includeTimestamps}
              onChange={(e) => handleOptionChange('includeTimestamps', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Include timestamps
            </span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={exportOptions.includeSummary}
              onChange={(e) => handleOptionChange('includeSummary', e.target.checked)}
              disabled={!session.summary}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Include summary {!session.summary && '(not available)'}
            </span>
          </label>
        </div>
      </div>

      {/* Session Preview */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Session Preview
        </h4>
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <div>
            <span className="font-medium">Date:</span> {session.timestamp.toLocaleDateString()}
          </div>
          <div>
            <span className="font-medium">Advisors:</span> {session.selectedAdvisors.length}
          </div>
          <div>
            <span className="font-medium">Responses:</span> {session.responses.length}
          </div>
          {session.domain && (
            <div>
              <span className="font-medium">Domain:</span> {session.domain}
            </div>
          )}
        </div>
      </div>

      {/* Export Buttons */}
      <div className="flex space-x-3 pt-4 border-t">
        <Button
          onClick={() => handleExport('pdf')}
          disabled={isExporting}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white"
        >
          {isExporting ? 'Exporting...' : 'Export as PDF'}
        </Button>
        
        <Button
          onClick={() => handleExport('markdown')}
          disabled={isExporting}
          variant="outline"
          className="flex-1"
        >
          {isExporting ? 'Exporting...' : 'Export as Markdown'}
        </Button>
      </div>

      {/* Export Info */}
      <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t">
        <p>
          PDF exports will be saved to your downloads folder. 
          Markdown exports will be downloaded as .md files.
        </p>
      </div>
    </Card>
  );
};