import React from 'react';
import type { Advisor } from '../../types/domain';
import Card from '../common/Card';

interface ResponsePanelProps {
  response: {
    advisorId: string;
    content: string;
    timestamp: Date;
    persona: {
      name: string;
      expertise: string;
    };
  };
  advisor?: Advisor;
  className?: string;
  style?: React.CSSProperties;
}

const ResponsePanel: React.FC<ResponsePanelProps> = ({
  response,
  advisor,
  className = '',
  style,
}) => {
  return (
    <Card className={`${className}`} style={style} padding="lg" data-testid={`response-panel-${response.advisorId}`}>
      {/* Advisor Header */}
      <div className="flex items-start space-x-4 mb-4">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-blue-600 font-semibold text-sm">
            {response.persona.name.split(' ').map(n => n[0]).join('')}
          </span>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {response.persona.name}
              </h3>
              <p className="text-sm text-gray-600">
                {response.persona.expertise}
              </p>
            </div>
            <div className="text-xs text-gray-500">
              {response.timestamp.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* Response Content */}
      <div className="prose prose-gray max-w-none">
        <div className="text-gray-700 leading-relaxed whitespace-pre-line">
          {response.content}
        </div>
      </div>

      {/* Response Actions */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>Helpful</span>
            </button>
            <button className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              <span>Share</span>
            </button>
          </div>
          <div className="text-xs text-gray-400">
            Response #{response.advisorId.split('-')[1] || '1'}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ResponsePanel;