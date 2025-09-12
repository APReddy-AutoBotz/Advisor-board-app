import React, { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { useTheme } from './ThemeProvider';
import type { JSX } from 'react/jsx-runtime';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  interactive?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = 'default',
      padding = 'md',
      rounded = 'lg',
      shadow = 'md',
      hover = false,
      interactive = false,
      header,
      footer,
      as = 'div',
      className = '',
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
      console.warn('Card component rendered outside ThemeProvider, using default theme');
    }

    const getVariantClasses = (): string => {
      if (!currentDomain) {
        // Neutral theme when no domain is selected
        switch (variant) {
          case 'elevated':
            return isDarkMode 
              ? 'bg-neutral-800 border border-neutral-700' 
              : 'bg-white border border-neutral-200';
          case 'outlined':
            return isDarkMode
              ? 'bg-transparent border-2 border-neutral-600'
              : 'bg-transparent border-2 border-neutral-300';
          case 'filled':
            return isDarkMode
              ? 'bg-neutral-700 border border-neutral-600'
              : 'bg-neutral-100 border border-neutral-200';
          default:
            return isDarkMode
              ? 'bg-neutral-800 border border-neutral-700'
              : 'bg-white border border-neutral-200';
        }
      }

      const domainPrefix = getDomainPrefix(currentDomain);
      
      switch (variant) {
        case 'elevated':
          return isDarkMode
            ? `bg-neutral-800 border border-${domainPrefix}-700/30`
            : `bg-white border border-${domainPrefix}-200`;
        case 'outlined':
          return isDarkMode
            ? `bg-transparent border-2 border-${domainPrefix}-600`
            : `bg-transparent border-2 border-${domainPrefix}-300`;
        case 'filled':
          return isDarkMode
            ? `bg-${domainPrefix}-900/20 border border-${domainPrefix}-700/30`
            : `bg-${domainPrefix}-50 border border-${domainPrefix}-200`;
        default:
          return isDarkMode
            ? `bg-neutral-800 border border-${domainPrefix}-700/30`
            : `bg-white border border-${domainPrefix}-200`;
      }
    };

    const getPaddingClasses = (): string => {
      switch (padding) {
        case 'none':
          return '';
        case 'sm':
          return 'p-3';
        case 'md':
          return 'p-4';
        case 'lg':
          return 'p-6';
        case 'xl':
          return 'p-8';
        default:
          return 'p-4';
      }
    };

    const getRoundedClasses = (): string => {
      switch (rounded) {
        case 'none':
          return '';
        case 'sm':
          return 'rounded-sm';
        case 'md':
          return 'rounded-md';
        case 'lg':
          return 'rounded-lg';
        case 'xl':
          return 'rounded-xl';
        case 'full':
          return 'rounded-full';
        default:
          return 'rounded-lg';
      }
    };

    const getShadowClasses = (): string => {
      if (shadow === 'none') return '';
      
      const shadowMap = {
        sm: 'shadow-sm',
        md: 'shadow-md',
        lg: 'shadow-lg',
        xl: 'shadow-xl',
      };
      
      const baseShadow = shadowMap[shadow as keyof typeof shadowMap] || 'shadow-md';
      
      if (currentDomain) {
        const domainPrefix = getDomainPrefix(currentDomain);
        return `${baseShadow} shadow-${domainPrefix}-500/10`;
      }
      
      return baseShadow;
    };

    const getInteractiveClasses = (): string => {
      if (!interactive && !hover) return '';
      
      const baseInteractive = 'transition-all duration-200 ease-in-out';
      
      if (interactive) {
        return `${baseInteractive} cursor-pointer transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 touch-manipulation`;
      }
      
      if (hover) {
        return `${baseInteractive} hover:shadow-lg`;
      }
      
      return baseInteractive;
    };

    const baseClasses = [
      'relative',
      getVariantClasses(),
      getRoundedClasses(),
      getShadowClasses(),
      getInteractiveClasses(),
      className,
    ].filter(Boolean).join(' ');

    const contentClasses = [
      getPaddingClasses(),
    ].filter(Boolean).join(' ');

    const Component = as;
    const interactiveProps = interactive ? {
      role: 'button',
      tabIndex: 0,
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          props.onClick?.(e as any);
        }
      }
    } : {};

    return (
      <Component ref={ref} className={baseClasses} {...interactiveProps} {...props}>
        {header && (
          <div className={`border-b ${
            isDarkMode ? 'border-neutral-700' : 'border-neutral-200'
          } ${padding !== 'none' ? 'px-4 py-3' : ''}`}>
            {header}
          </div>
        )}
        
        <div className={contentClasses}>
          {children}
        </div>
        
        {footer && (
          <div className={`border-t ${
            isDarkMode ? 'border-neutral-700' : 'border-neutral-200'
          } ${padding !== 'none' ? 'px-4 py-3' : ''}`}>
            {footer}
          </div>
        )}
      </Component>
    );
  }
);

Card.displayName = 'Card';

// Helper function
function getDomainPrefix(domain: string): string {
  const prefixMap: Record<string, string> = {
    cliniboard: 'blue',
    productboard: 'purple',
    eduboard: 'orange',
    remediboard: 'green',
  };
  return prefixMap[domain] || 'neutral';
}

export default Card;
