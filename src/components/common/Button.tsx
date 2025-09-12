import React, { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { useTheme } from './ThemeProvider';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    // Safe theme access with fallback
    let currentDomain: string | null = null;
    let isDarkMode = false;
    
    try {
      const theme = useTheme();
      currentDomain = theme.currentDomain;
      isDarkMode = theme.isDarkMode;
    } catch (error) {
      // Fallback to default values if ThemeProvider is not available
      console.warn('Button component rendered outside ThemeProvider, using default theme');
    }

    const getVariantClasses = (): string => {
      if (!currentDomain) {
        // Neutral theme when no domain is selected
        switch (variant) {
          case 'primary':
            return 'bg-neutral-600 text-white hover:bg-neutral-700 focus:ring-neutral-500';
          case 'secondary':
            return 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 focus:ring-neutral-400';
          case 'accent':
            return 'bg-neutral-500 text-white hover:bg-neutral-600 focus:ring-neutral-400';
          case 'outline':
            return 'border-2 border-neutral-300 text-neutral-700 hover:bg-neutral-50 focus:ring-neutral-400';
          case 'ghost':
            return 'text-neutral-600 hover:bg-neutral-100 focus:ring-neutral-400';
          default:
            return 'bg-neutral-600 text-white hover:bg-neutral-700 focus:ring-neutral-500';
        }
      }

      const domainPrefix = getDomainPrefix(currentDomain);
      
      switch (variant) {
        case 'primary':
          return `bg-${domainPrefix}-600 text-white hover:bg-${domainPrefix}-700 focus:ring-${domainPrefix}-500 shadow-lg shadow-${domainPrefix}-500/25`;
        case 'secondary':
          return `bg-${domainPrefix}-100 text-${domainPrefix}-800 hover:bg-${domainPrefix}-200 focus:ring-${domainPrefix}-400 border border-${domainPrefix}-200`;
        case 'accent':
          return `bg-${domainPrefix}-500 text-white hover:bg-${domainPrefix}-600 focus:ring-${domainPrefix}-400`;
        case 'outline':
          return `border-2 border-${domainPrefix}-300 text-${domainPrefix}-700 hover:bg-${domainPrefix}-50 focus:ring-${domainPrefix}-400`;
        case 'ghost':
          return `text-${domainPrefix}-600 hover:bg-${domainPrefix}-100 focus:ring-${domainPrefix}-400`;
        default:
          return `bg-${domainPrefix}-600 text-white hover:bg-${domainPrefix}-700 focus:ring-${domainPrefix}-500`;
      }
    };

    const getSizeClasses = (): string => {
      switch (size) {
        case 'sm':
          return 'px-3 py-2 text-sm sm:py-1.5';
        case 'md':
          return 'px-4 py-2.5 text-base sm:py-2';
        case 'lg':
          return 'px-6 py-3.5 text-lg sm:py-3';
        case 'xl':
          return 'px-8 py-4.5 text-xl sm:py-4';
        default:
          return 'px-4 py-2.5 text-base sm:py-2';
      }
    };

    const baseClasses = [
      'inline-flex items-center justify-center',
      'font-medium rounded-lg',
      'transition-all duration-200 ease-in-out',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'transform hover:scale-105 active:scale-95',
      // Enhanced touch targets for mobile
      'min-h-[44px] min-w-[44px]',
      // Better mobile interaction
      'touch-manipulation',
      'select-none',
      getSizeClasses(),
      getVariantClasses(),
      fullWidth ? 'w-full' : '',
      isDarkMode ? 'focus:ring-offset-neutral-800' : 'focus:ring-offset-white',
      className,
    ].filter(Boolean).join(' ');

    return (
      <button
        ref={ref}
        className={baseClasses}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        
        {!isLoading && leftIcon && (
          <span className="mr-2">{leftIcon}</span>
        )}
        
        {children}
        
        {!isLoading && rightIcon && (
          <span className="ml-2">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

// Helper function
function getDomainPrefix(domain: string): string {
  const prefixMap: Record<string, string> = {
    cliniboard: 'clinical',
    eduboard: 'education',
    remediboard: 'remedies',
  };
  return prefixMap[domain] || 'neutral';
}

export default Button;
