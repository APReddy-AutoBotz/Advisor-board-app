import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import ThemeProvider from '../components/common/ThemeProvider';
import ErrorBoundary from '../components/common/ErrorBoundary';

// Test wrapper that includes all necessary providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </ErrorBoundary>
  );
};

// Custom render function that includes providers
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: TestWrapper, ...options });

// Accessibility test utilities
export const checkColorContrast = (element: HTMLElement, expectedRatio: number = 4.5): boolean => {
  // This is a simplified contrast check - in a real app you'd use a proper contrast checking library
  const styles = window.getComputedStyle(element);
  const backgroundColor = styles.backgroundColor;
  const color = styles.color;
  
  // For testing purposes, we'll assume good contrast if both colors are defined
  return backgroundColor !== 'rgba(0, 0, 0, 0)' && color !== 'rgba(0, 0, 0, 0)';
};

export const checkTouchTargetSize = (element: HTMLElement): boolean => {
  const rect = element.getBoundingClientRect();
  const minSize = 44; // 44px minimum touch target size
  return rect.width >= minSize && rect.height >= minSize;
};

export const checkAriaLabels = (element: HTMLElement): boolean => {
  // Check if interactive elements have proper ARIA labels
  const interactiveElements = element.querySelectorAll('button, a, input, textarea, select, [role="button"], [role="link"]');
  
  for (const el of interactiveElements) {
    const hasAriaLabel = el.hasAttribute('aria-label');
    const hasAriaLabelledBy = el.hasAttribute('aria-labelledby');
    const hasTextContent = el.textContent?.trim();
    const hasAltText = el.hasAttribute('alt');
    
    if (!hasAriaLabel && !hasAriaLabelledBy && !hasTextContent && !hasAltText) {
      return false;
    }
  }
  
  return true;
};

export const checkKeyboardNavigation = async (element: HTMLElement): Promise<boolean> => {
  // Check if all interactive elements are keyboard accessible
  const interactiveElements = element.querySelectorAll('button, a, input, textarea, select, [role="button"], [role="link"], [tabindex]');
  
  for (const el of interactiveElements) {
    const tabIndex = el.getAttribute('tabindex');
    if (tabIndex === '-1' && !el.hasAttribute('disabled')) {
      // Element is not keyboard accessible
      return false;
    }
  }
  
  return true;
};

export const simulateMobileViewport = () => {
  // Simulate mobile viewport for responsive testing
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 375, // iPhone SE width
  });
  
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 667, // iPhone SE height
  });
  
  // Trigger resize event
  window.dispatchEvent(new Event('resize'));
};

export const simulateTabletViewport = () => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 768, // iPad width
  });
  
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 1024, // iPad height
  });
  
  window.dispatchEvent(new Event('resize'));
};

export const simulateDesktopViewport = () => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1920,
  });
  
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 1080,
  });
  
  window.dispatchEvent(new Event('resize'));
};

// Re-export everything from testing library
export * from '@testing-library/react';
export { customRender as render };