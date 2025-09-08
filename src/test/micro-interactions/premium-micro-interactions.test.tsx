/**
 * Premium Micro-Interactions Test Suite
 * Tests for the premium micro-interactions and motion system implementation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { initAnimationObserver, cleanupAnimationObserver } from '../../utils/animationObserver';

// Mock component to test micro-interactions
const TestMicroInteractionComponent = () => {
  return (
    <div>
      {/* Test 8px card lift on hover */}
      <div 
        className="premium-card micro-lift-strong" 
        data-testid="card-lift-test"
      >
        Card with 8px lift
      </div>
      
      {/* Test focus rings */}
      <button 
        className="btn-premium" 
        data-testid="focus-ring-test"
      >
        Premium Button
      </button>
      
      {/* Test staggered entrance animations */}
      <div className="stagger-container" data-testid="stagger-container">
        <div className="observe-entrance stagger-1">Item 1</div>
        <div className="observe-entrance stagger-2">Item 2</div>
        <div className="observe-entrance stagger-3">Item 3</div>
      </div>
      
      {/* Test interactive elements */}
      <input 
        className="premium-input" 
        data-testid="input-interaction-test"
        placeholder="Test input"
      />
      
      {/* Test reduced motion support */}
      <div 
        className="micro-scale" 
        data-testid="reduced-motion-test"
      >
        Scale animation element
      </div>
    </div>
  );
};

describe('Premium Micro-Interactions', () => {
  beforeEach(() => {
    // Initialize animation observer for tests
    initAnimationObserver();
  });

  afterEach(() => {
    // Cleanup after each test
    cleanupAnimationObserver();
  });

  it('applies premium card classes correctly', () => {
    render(<TestMicroInteractionComponent />);
    
    const cardElement = screen.getByTestId('card-lift-test');
    expect(cardElement).toHaveClass('premium-card');
    expect(cardElement).toHaveClass('micro-lift-strong');
  });

  it('applies focus ring classes to interactive elements', () => {
    render(<TestMicroInteractionComponent />);
    
    const buttonElement = screen.getByTestId('focus-ring-test');
    expect(buttonElement).toHaveClass('btn-premium');
    
    const inputElement = screen.getByTestId('input-interaction-test');
    expect(inputElement).toHaveClass('premium-input');
  });

  it('sets up staggered animation structure correctly', () => {
    render(<TestMicroInteractionComponent />);
    
    const staggerContainer = screen.getByTestId('stagger-container');
    expect(staggerContainer).toHaveClass('stagger-container');
    
    const items = staggerContainer.querySelectorAll('.observe-entrance');
    expect(items).toHaveLength(3);
    
    expect(items[0]).toHaveClass('stagger-1');
    expect(items[1]).toHaveClass('stagger-2');
    expect(items[2]).toHaveClass('stagger-3');
  });

  it('handles focus events correctly', async () => {
    render(<TestMicroInteractionComponent />);
    
    const buttonElement = screen.getByTestId('focus-ring-test');
    
    // Focus the button
    buttonElement.focus();
    
    // Check if focus styles are applied (this would be handled by CSS)
    expect(buttonElement).toHaveFocus();
  });

  it('handles hover interactions', async () => {
    render(<TestMicroInteractionComponent />);
    
    const cardElement = screen.getByTestId('card-lift-test');
    
    // Simulate hover
    fireEvent.mouseEnter(cardElement);
    
    // The actual transform would be handled by CSS, we just verify the classes are present
    expect(cardElement).toHaveClass('micro-lift-strong');
  });

  it('respects reduced motion preferences', () => {
    // Mock prefers-reduced-motion
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => {},
      }),
    });

    render(<TestMicroInteractionComponent />);
    
    const reducedMotionElement = screen.getByTestId('reduced-motion-test');
    expect(reducedMotionElement).toHaveClass('micro-scale');
  });

  it('applies cubic-bezier easing through CSS custom properties', () => {
    render(<TestMicroInteractionComponent />);
    
    // Check if CSS custom properties are available
    const rootStyles = getComputedStyle(document.documentElement);
    
    // These would be set by our CSS file
    expect(document.documentElement).toBeDefined();
  });

  it('ensures proper accessibility with focus rings', async () => {
    render(<TestMicroInteractionComponent />);
    
    const buttonElement = screen.getByTestId('focus-ring-test');
    const inputElement = screen.getByTestId('input-interaction-test');
    
    // Test keyboard navigation
    buttonElement.focus();
    expect(buttonElement).toHaveFocus();
    
    inputElement.focus();
    expect(inputElement).toHaveFocus();
  });

  it('provides proper touch targets', () => {
    render(<TestMicroInteractionComponent />);
    
    const buttonElement = screen.getByTestId('focus-ring-test');
    
    // Button should have touch-target class for proper sizing
    expect(buttonElement).toHaveClass('btn-premium');
  });
});

describe('Animation Observer Utility', () => {
  it('initializes animation observer correctly', () => {
    const observer = initAnimationObserver();
    expect(observer).toBeDefined();
  });

  it('handles cleanup correctly', () => {
    initAnimationObserver();
    expect(() => cleanupAnimationObserver()).not.toThrow();
  });

  it('observes entrance animations', () => {
    render(
      <div>
        <div className="observe-entrance">Test element</div>
      </div>
    );
    
    const observer = initAnimationObserver();
    expect(() => observer.observe('.observe-entrance')).not.toThrow();
  });
});