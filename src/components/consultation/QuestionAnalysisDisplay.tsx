import React from 'react';
import type { QuestionInsights } from '../../services/intelligentResponseService';

interface QuestionAnalysisDisplayProps {
  insights: QuestionInsights;
  className?: string;
}

const QuestionAnalysisDisplay: React.FC<QuestionAnalysisDisplayProps> = ({
  insights,
  className = '',
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  
  React.useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const getDomainColor = (domain: string) => {
    switch (domain) {
      case 'clinical research': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'natural remedies': return 'bg-green-100 text-green-800 border-green-200';
      case 'education': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'product development': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`${className} transform transition-all duration-500 ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
    }`}>
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <h4 className="text-sm font-semibold text-gray-700">Question Analysis</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Type</div>
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
              {insights.type}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Domain</div>
            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getDomainColor(insights.domain)}`}>
              {insights.domain}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Confidence</div>
            <div className="flex items-center gap-2">
              <div className={`text-sm font-semibold ${getConfidenceColor(insights.confidence)}`}>
                {Math.round(insights.confidence * 100)}%
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-1000 ${
                    insights.confidence >= 0.8 ? 'bg-green-400' : 
                    insights.confidence >= 0.6 ? 'bg-yellow-400' : 'bg-red-400'
                  }`}
                  style={{ width: `${insights.confidence * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        {insights.keywords.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Key Terms</div>
            <div className="flex flex-wrap gap-1">
              {insights.keywords.slice(0, 6).map((keyword, index) => (
                <span 
                  key={keyword}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-50 text-gray-600 border border-gray-200"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionAnalysisDisplay;
