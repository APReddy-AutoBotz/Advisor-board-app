import React from 'react';
import type { Advisor } from '../../types/domain';
import Card from '../common/Card';

interface AdvisorCardProps {
  advisor: Advisor;
  isSelected: boolean;
  onSelect: () => void;
  className?: string;
}

const AdvisorCard: React.FC<AdvisorCardProps> = ({
  advisor,
  isSelected,
  onSelect,
  className = '',
}) => {
  return (
    <Card
      className={`
        ${className}
        ${isSelected 
          ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200' 
          : 'hover:shadow-md border-gray-200'
        }
        transition-all duration-200 cursor-pointer
      `}
      onClick={onSelect}
      padding="lg"
    >
      {/* Professional Avatar */}
      <div className="flex items-start justify-between mb-4">
        <div className="relative">
          {advisor.avatar ? (
            <img 
              src={advisor.avatar} 
              alt={`${advisor.name} - ${advisor.expertise}`}
              className="w-16 h-16 rounded-full border-2 border-white shadow-lg"
            />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">
                {advisor.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
          )}
          {/* Professional badge */}
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white">
            <svg className="w-3 h-3 text-yellow-800" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        </div>
        <div className={`
          w-6 h-6 rounded-full border-2 flex items-center justify-center
          ${isSelected 
            ? 'bg-blue-500 border-blue-500' 
            : 'border-gray-300'
          }
        `}>
          {isSelected && (
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </div>

      {/* Advisor Info */}
      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            {advisor.name}
          </h3>
          {(advisor as any).credentials && (
            <p className="text-xs text-gray-500 font-medium">
              {(advisor as any).credentials}
            </p>
          )}
        </div>
        
        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
          {advisor.expertise}
        </div>
        
        <p className="text-sm text-gray-600 leading-relaxed">
          {advisor.background}
        </p>
        
        {/* Specialties */}
        {(advisor as any).specialties && (
          <div className="flex flex-wrap gap-1">
            {(advisor as any).specialties.slice(0, 2).map((specialty: string, index: number) => (
              <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                {specialty}
              </span>
            ))}
            {(advisor as any).specialties.length > 2 && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-500">
                +{(advisor as any).specialties.length - 2} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Selection Status */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className={`
          text-sm font-medium text-center py-2 px-4 rounded-lg
          ${isSelected 
            ? 'bg-blue-100 text-blue-700' 
            : 'bg-gray-100 text-gray-600'
          }
        `}>
          {isSelected ? 'Selected for Consultation' : 'Click to Select'}
        </div>
      </div>
    </Card>
  );
};

export default AdvisorCard;
