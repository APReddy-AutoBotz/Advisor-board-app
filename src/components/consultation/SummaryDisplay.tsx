import React from 'react';
import Card from '../common/Card';
import Button from '../common/Button';

interface SummaryDisplayProps {
  summary: string;
  isVisible: boolean;
  onToggleVisibility: () => void;
  onClear?: () => void;
  className?: string;
}

const SummaryDisplay: React.FC<SummaryDisplayProps> = ({
  summary,
  isVisible,
  onToggleVisibility,
  onClear,
  className = '',
}) => {
  // Parse the summary content to extract structured sections
  const parseSummaryContent = (content: string) => {
    const sections: { title: string; content: string; type: 'header' | 'list' | 'text' }[] = [];
    const lines = content.split('\n').filter(line => line.trim());
    
    let currentSection: { title: string; content: string; type: 'header' | 'list' | 'text' } | null = null;
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      // Check if it's a header (starts with **)
      if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        // Save previous section if exists
        if (currentSection) {
          sections.push(currentSection);
        }
        
        // Start new section
        const title = trimmedLine.replace(/\*\*/g, '');
        currentSection = {
          title,
          content: '',
          type: title.includes(':') ? 'header' : 'text'
        };
      } else if (trimmedLine.match(/^\d+\./)) {
        // It's a numbered list item
        if (currentSection) {
          if (currentSection.content) {
            currentSection.content += '\n';
          }
          currentSection.content += trimmedLine;
          currentSection.type = 'list';
        }
      } else if (trimmedLine) {
        // Regular text content
        if (currentSection) {
          if (currentSection.content) {
            currentSection.content += '\n';
          }
          currentSection.content += trimmedLine;
        }
      }
    });
    
    // Add the last section
    if (currentSection) {
      sections.push(currentSection);
    }
    
    return sections;
  };

  const sections = parseSummaryContent(summary);

  const renderSection = (section: { title: string; content: string; type: 'header' | 'list' | 'text' }, index: number) => {
    const getSectionIcon = (title: string) => {
      if (title.toLowerCase().includes('consensus') || title.toLowerCase().includes('agreement')) {
        return (
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      }
      if (title.toLowerCase().includes('insight') || title.toLowerCase().includes('key')) {
        return (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      }
      if (title.toLowerCase().includes('perspective') || title.toLowerCase().includes('unique')) {
        return (
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        );
      }
      if (title.toLowerCase().includes('recommendation')) {
        return (
          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      }
      return (
        <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    };

    return (
      <div key={index} className="mb-6 last:mb-0">
        {section.title && (
          <div className="flex items-center space-x-2 mb-3">
            {getSectionIcon(section.title)}
            <h4 className="font-semibold text-neutral-900">{section.title}</h4>
          </div>
        )}
        
        {section.type === 'list' ? (
          <ul className="space-y-2 ml-7">
            {section.content.split('\n').map((item, itemIndex) => {
              const trimmedItem = item.trim();
              if (trimmedItem.match(/^\d+\./)) {
                const content = trimmedItem.replace(/^\d+\.\s*/, '');
                return (
                  <li key={itemIndex} className="flex items-start space-x-2">
                    <span className="flex-shrink-0 w-2 h-2 bg-neutral-400 rounded-full mt-2"></span>
                    <span className="text-neutral-700 leading-relaxed">{content}</span>
                  </li>
                );
              }
              return null;
            })}
          </ul>
        ) : (
          <div className="ml-7 text-neutral-700 leading-relaxed">
            {section.content.split('\n').map((paragraph, pIndex) => (
              paragraph.trim() ? (
                <p key={pIndex} className="mb-2 last:mb-0">
                  {paragraph}
                </p>
              ) : null
            ))}
          </div>
        )}
      </div>
    );
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Card variant="elevated" padding="lg" className={`border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 text-amber-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-amber-900">Response Summary</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleVisibility}
            className="text-amber-700 border-amber-300 hover:bg-amber-100"
          >
            Hide Summary
          </Button>
          {onClear && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClear}
              className="text-neutral-600 border-neutral-300 hover:bg-neutral-100"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </Button>
          )}
        </div>
      </div>

      <div className="prose prose-sm max-w-none">
        {sections.map((section, index) => renderSection(section, index))}
      </div>

      {/* Summary Metadata */}
      <div className="mt-6 pt-4 border-t border-amber-200">
        <div className="flex items-center justify-between text-xs text-amber-700">
          <span>Generated summary of advisor responses</span>
          <span>
            {new Intl.DateTimeFormat('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }).format(new Date())}
          </span>
        </div>
      </div>
    </Card>
  );
};

export default SummaryDisplay;
