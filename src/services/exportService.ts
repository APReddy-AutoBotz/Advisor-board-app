import jsPDF from 'jspdf';
import type { ConsultationSession, ExportOptions, SessionMetadata } from '../types/session';
import type { AdvisorResponse } from '../types/domain';
import { getBoardTheme } from '../lib/boardThemes';

export class ExportService {
  /**
   * Export session data as PDF
   */
  static async exportToPDF(
    session: ConsultationSession,
    options: ExportOptions = {
      format: 'pdf',
      includeMetadata: true,
      includeTimestamps: true,
      includeSummary: true
    }
  ): Promise<void> {
    const doc = new jsPDF();
    let yPosition = 20;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const lineHeight = 7;
    
    // Get board theme colors
    const boardTheme = getBoardTheme(session.domain);
    
    // Convert hex colors to RGB arrays for jsPDF
    const hexToRgb = (hex: string): [number, number, number] => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
      ] : [37, 99, 235]; // fallback to blue
    };
    
    const primaryColor = hexToRgb(boardTheme.accent);
    const lightBg = hexToRgb(boardTheme.background.medium);
    const darkText = hexToRgb(boardTheme.text.primary);

    // Helper function to add text with word wrapping
    const addWrappedText = (text: string, x: number, y: number, maxWidth: number): number => {
      if (!text) return y;
      const lines = doc.splitTextToSize(text, maxWidth);
      if (!lines || !Array.isArray(lines)) return y;
      doc.text(lines, x, y);
      return y + (lines.length * lineHeight);
    };

    // Helper function to check if we need a new page
    const checkPageBreak = (requiredSpace: number): number => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        doc.addPage();
        return 20;
      }
      return yPosition;
    };

    // Header with branding using board theme colors
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, 'F');
    
    // Logo area (using text for now, but could be replaced with actual logo)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('AdvisorBoard', margin, 25);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Professional Advisory Consultation Report', margin, 32);
    
    // Domain badge
    const domainName = session.domain || 'General';
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(140, 15, 50, 15, 3, 3, 'F');
    doc.setTextColor(...primaryColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(domainName.toUpperCase(), 145, 24);
    
    yPosition = 55;
    doc.setTextColor(...darkText);

    // Metadata section
    if (options.includeMetadata) {
      yPosition = checkPageBreak(40);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      yPosition = addWrappedText('Session Information', margin, yPosition, 170);
      yPosition += 5;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      if (options.includeTimestamps) {
        yPosition = addWrappedText(`Date: ${session.timestamp.toLocaleDateString()} ${session.timestamp.toLocaleTimeString()}`, margin, yPosition, 170);
        yPosition += 3;
      }
      
      yPosition = addWrappedText(`Session ID: ${session.id}`, margin, yPosition, 170);
      yPosition += 3;
      
      if (session.domain) {
        yPosition = addWrappedText(`Domain: ${session.domain}`, margin, yPosition, 170);
        yPosition += 3;
      }
      
      const advisorNames = session.selectedAdvisors.map(a => a.name).join(', ');
      yPosition = addWrappedText(`Advisors: ${advisorNames}`, margin, yPosition, 170);
      yPosition += 10;
    }

    // Prompt section
    yPosition = checkPageBreak(30);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    yPosition = addWrappedText('Question', margin, yPosition, 170);
    yPosition += 5;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    yPosition = addWrappedText(session.prompt, margin, yPosition, 170);
    yPosition += 10;

    // Responses section
    if (session.responses.length > 0) {
      yPosition = checkPageBreak(30);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      yPosition = addWrappedText('Advisor Responses', margin, yPosition, 170);
      yPosition += 10;

      session.responses.forEach((response, index) => {
        const advisor = session.selectedAdvisors.find(a => a.id === response.advisorId);
        
        yPosition = checkPageBreak(50);
        
        // Advisor card with styling
        doc.setFillColor(249, 250, 251);
        doc.roundedRect(margin - 5, yPosition - 5, 180, 25, 3, 3, 'F');
        
        // Advisor avatar circle
        doc.setFillColor(...primaryColor);
        doc.circle(margin + 5, yPosition + 5, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        const initials = advisor?.name?.split(' ').map(n => n[0]).join('') || 'A';
        doc.text(initials, margin + 2, yPosition + 8);
        
        // Advisor name
        doc.setTextColor(...darkText);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        yPosition = addWrappedText(`${advisor?.name || 'Unknown Advisor'}`, margin + 20, yPosition, 150);

        if (advisor?.expertise) {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(107, 114, 128); // Gray-500
          yPosition = addWrappedText(`${advisor.expertise}`, margin + 20, yPosition + 2, 150);
          yPosition += 8;
        } else {
          yPosition += 15;
        }

        // Response content
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        yPosition = addWrappedText(response.content, margin, yPosition, 170);
        
        if (options.includeTimestamps) {
          yPosition += 3;
          doc.setFontSize(8);
          doc.setFont('helvetica', 'italic');
          yPosition = addWrappedText(`Response time: ${response.timestamp.toLocaleTimeString()}`, margin, yPosition, 170);
        }
        
        yPosition += 10;
      });
    }

    // Summary section
    if (options.includeSummary && session.summary) {
      yPosition = checkPageBreak(30);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      yPosition = addWrappedText('Summary', margin, yPosition, 170);
      yPosition += 5;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      yPosition = addWrappedText(session.summary, margin, yPosition, 170);
    }

    // Save the PDF
    const filename = `advisorboard-session-${session.id}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  }

  /**
   * Export session data as Markdown
   */
  static async exportToMarkdown(
    session: ConsultationSession,
    options: ExportOptions = {
      format: 'markdown',
      includeMetadata: true,
      includeTimestamps: true,
      includeSummary: true
    }
  ): Promise<void> {
    let markdown = '';

    // Title
    markdown += '# AdvisorBoard Consultation Session\n\n';

    // Metadata section
    if (options.includeMetadata) {
      markdown += '## Session Information\n\n';
      
      if (options.includeTimestamps) {
        markdown += `**Date:** ${session.timestamp.toLocaleDateString()} ${session.timestamp.toLocaleTimeString()}\n\n`;
      }
      
      markdown += `**Session ID:** ${session.id}\n\n`;
      
      if (session.domain) {
        markdown += `**Domain:** ${session.domain}\n\n`;
      }
      
      const advisorNames = session.selectedAdvisors.map(a => a.name).join(', ');
      markdown += `**Advisors:** ${advisorNames}\n\n`;
    }

    // Prompt section
    markdown += '## Question\n\n';
    markdown += `${session.prompt}\n\n`;

    // Responses section
    if (session.responses.length > 0) {
      markdown += '## Advisor Responses\n\n';

      session.responses.forEach((response, index) => {
        const advisor = session.selectedAdvisors.find(a => a.id === response.advisorId);
        
        markdown += `### ${advisor?.name || 'Unknown Advisor'}\n\n`;
        
        if (advisor?.expertise) {
          markdown += `*${advisor.expertise}*\n\n`;
        }

        markdown += `${response.content}\n\n`;
        
        if (options.includeTimestamps) {
          markdown += `*Response time: ${response.timestamp.toLocaleTimeString()}*\n\n`;
        }
        
        markdown += '---\n\n';
      });
    }

    // Summary section
    if (options.includeSummary && session.summary) {
      markdown += '## Summary\n\n';
      markdown += `${session.summary}\n\n`;
    }

    // Create and download the file
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `advisorboard-session-${session.id}-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Format session data for export
   */
  static formatSessionForExport(session: ConsultationSession): {
    metadata: SessionMetadata;
    formattedResponses: Array<{
      advisor: string;
      expertise: string;
      content: string;
      timestamp: string;
    }>;
  } {
    const metadata: SessionMetadata = {
      sessionId: session.id,
      createdAt: session.timestamp,
      updatedAt: session.timestamp,
      domain: session.domain || 'Unknown',
      advisorCount: session.selectedAdvisors.length,
      responseCount: session.responses.length
    };

    const formattedResponses = session.responses.map(response => {
      const advisor = session.selectedAdvisors.find(a => a.id === response.advisorId);
      return {
        advisor: advisor?.name || 'Unknown Advisor',
        expertise: advisor?.expertise || '',
        content: response.content,
        timestamp: response.timestamp.toISOString()
      };
    });

    return { metadata, formattedResponses };
  }

  /**
   * Validate session data before export
   */
  static validateSessionForExport(session: ConsultationSession): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!session.id) {
      errors.push('Session ID is required');
    }

    if (!session.prompt || session.prompt.trim().length === 0) {
      errors.push('Session prompt is required');
    }

    if (!session.selectedAdvisors || session.selectedAdvisors.length === 0) {
      errors.push('At least one advisor must be selected');
    }

    if (!session.timestamp) {
      errors.push('Session timestamp is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
