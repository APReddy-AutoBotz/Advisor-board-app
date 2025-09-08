/**
 * Disclaimer Banner Component
 * 
 * Displays sticky disclaimers for medical and legal domains
 * as required by the AI-Advisor Gallery specification
 */

import React, { useState } from 'react';
import type { DomainId } from '../../types/domain';

export interface DisclaimerBannerProps {
  domainId: DomainId;
  className?: string;
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({
  domainId,
  className = ''
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  // Only show for medical and legal domains
  const shouldShow = (domainId === 'cliniboard' || domainId === 'remediboard') && !isDismissed;

  if (!shouldShow) return null;

  const getDisclaimerContent = () => {
    switch (domainId) {
      case 'cliniboard':
        return {
          icon: '🏥',
          title: 'Medical Disclaimer',
          message: 'Educational information only. Not medical advice. Consult qualified healthcare professionals for medical decisions.',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-600'
        };
      case 'remediboard':
        return {
          icon: '⚕️',
          title: 'Health & Wellness Disclaimer',
          message: 'Educational information only. Not medical advice. Consult qualified healthcare professionals for health decisions.',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          textColor: 'text-amber-800',
          iconColor: 'text-amber-600'
        };
      default:
        return null;
    }
  };

  const disclaimer = getDisclaimerContent();
  if (!disclaimer) return null;

  return (
    <div className={`sticky top-0 z-50 ${className}`}>
      <div className={`${disclaimer.bgColor} ${disclaimer.borderColor} border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-3">
              <div className={`${disclaimer.iconColor} text-lg`}>
                {disclaimer.icon}
              </div>
              <div className={`${disclaimer.textColor}`}>
                <span className="font-semibold mr-2">{disclaimer.title}:</span>
                <span className="text-sm">{disclaimer.message}</span>
              </div>
            </div>
            
            <button
              onClick={() => setIsDismissed(true)}
              className={`${disclaimer.textColor} hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current rounded p-1`}
              aria-label="Dismiss disclaimer"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisclaimerBanner;