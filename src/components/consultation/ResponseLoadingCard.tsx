import React from 'react';
import Card from '../common/Card';

interface ResponseLoadingCardProps {
  advisorName: string;
  advisorRole: string;
  className?: string;
}

const ResponseLoadingCard: React.FC<ResponseLoadingCardProps> = ({
  advisorName,
  advisorRole,
  className = '',
}) => {
  return (
    <Card 
      className={`${className} animate-pulse border-l-4 border-l-blue-400`} 
      padding="lg"
    >
      {/* Advisor Header */}
      <div className="flex items-start space-x-4 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-blue-50 shadow-sm">
          <span className="text-blue-700 font-semibold text-sm">
            {advisorName.split(' ').map(n => n[0]).join('')}
          </span>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                {advisorName}
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Thinking...
                </span>
              </h3>
              <p className="text-sm text-gray-600 font-medium">
                {advisorRole}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Content */}
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
      </div>

      {/* Loading Actions */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </Card>
  );
};

export default ResponseLoadingCard;
