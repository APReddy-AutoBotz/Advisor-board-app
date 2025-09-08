import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import OptimizedAdvisorCard from '../OptimizedAdvisorCard';
import type { Advisor } from '../../../types/domain';

// Mock performance API
const mockPerformance = {
  now: vi.fn(),
  mark: vi.fn(),
  measure: vi.fn(),
};

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true,
});

const mockAdvisor: Advisor = {
  id: 'advisor-1',
  name: 'Dr. Test Advisor',
  expertise: 'Test Expertise',
  background: 'This is a test background that is long enough to test truncation functionality and performance with longer text content.',
  domain: {
    id: 'cliniboard',
    name: 'Cliniboard',
    description: 'Clinical research domain',
    advisors: [],
  },
  isSelected: false,
};

describe('OptimizedAdvisorCard Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPerformance.now.mockReturnValue(0);
  });

  it('should render efficiently with memoization', () => {
    const onToggleSelection = vi.fn();
    
    const { rerender } = render(
      <OptimizedAdvisorCard
        advisor={mockAdvisor}
        isSelected={false}
        onToggleSelection={onToggleSelection}
      />
    );

    // Re-render with same props - should not cause re-render due to memo
    rerender(
      <OptimizedAdvisorCard
        advisor={mockAdvisor}
        isSelected={false}
        onToggleSelection={onToggleSelection}
      />
    );

    expect(screen.getByText('Dr. Test Advisor')).toBeInTheDocument();
  });

  it('should only re-render when relevant props change', () => {
    const onToggleSelection = vi.fn();
    let renderCount = 0;

    const TestWrapper = ({ isSelected }: { isSelected: boolean }) => {
      renderCount++;
      return (
        <OptimizedAdvisorCard
          advisor={mockAdvisor}
          isSelected={isSelected}
          onToggleSelection={onToggleSelection}
        />
      );
    };

    const { rerender } = render(<TestWrapper isSelected={false} />);
    
    const initialRenderCount = renderCount;

    // Re-render with same props
    rerender(<TestWrapper isSelected={false} />);
    
    // Should not increase render count due to memoization
    expect(renderCount).toBe(initialRenderCount);

    // Re-render with different isSelected prop
    rerender(<TestWrapper isSelected={true} />);
    
    // Should increase render count
    expect(renderCount).toBeGreaterThan(initialRenderCount);
  });

  it('should handle rapid selection toggles efficiently', () => {
    const onToggleSelection = vi.fn();
    
    render(
      <OptimizedAdvisorCard
        advisor={mockAdvisor}
        isSelected={false}
        onToggleSelection={onToggleSelection}
      />
    );

    const card = screen.getByRole('button', { name: /select dr\. test advisor/i });

    // Simulate rapid clicks
    const startTime = performance.now();
    
    for (let i = 0; i < 10; i++) {
      fireEvent.click(card);
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;

    // Should handle 10 clicks quickly (less than 100ms in test environment)
    expect(duration).toBeLessThan(100);
    expect(onToggleSelection).toHaveBeenCalledTimes(10);
  });

  it('should efficiently compute domain color classes', () => {
    const onToggleSelection = vi.fn();
    
    // Test different domain types
    const domains = ['cliniboard', 'eduboard', 'remediboard'] as const;
    
    domains.forEach(domainId => {
      const advisor = {
        ...mockAdvisor,
        domain: { ...mockAdvisor.domain, id: domainId },
      };

      const startTime = performance.now();
      
      render(
        <OptimizedAdvisorCard
          advisor={advisor}
          isSelected={false}
          onToggleSelection={onToggleSelection}
        />
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Each render should be fast
      expect(renderTime).toBeLessThan(50);
    });
  });

  it('should handle long background text efficiently', () => {
    const onToggleSelection = vi.fn();
    const longBackground = 'A'.repeat(1000); // Very long text
    
    const advisorWithLongBackground = {
      ...mockAdvisor,
      background: longBackground,
    };

    const startTime = performance.now();
    
    render(
      <OptimizedAdvisorCard
        advisor={advisorWithLongBackground}
        isSelected={false}
        onToggleSelection={onToggleSelection}
      />
    );
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should handle long text efficiently
    expect(renderTime).toBeLessThan(100);
    
    // Should truncate long text
    expect(screen.queryByText(longBackground)).not.toBeInTheDocument();
    expect(screen.getByText(/\.\.\./)).toBeInTheDocument();
  });

  it('should maintain stable callback references', () => {
    const onToggleSelection = vi.fn();
    
    const { rerender } = render(
      <OptimizedAdvisorCard
        advisor={mockAdvisor}
        isSelected={false}
        onToggleSelection={onToggleSelection}
      />
    );

    const button = screen.getByRole('button', { name: /select/i });
    const initialHandler = button.onclick;

    // Re-render with same callback
    rerender(
      <OptimizedAdvisorCard
        advisor={mockAdvisor}
        isSelected={false}
        onToggleSelection={onToggleSelection}
      />
    );

    // Callback reference should remain stable
    expect(button.onclick).toBe(initialHandler);
  });

  it('should handle keyboard interactions efficiently', () => {
    const onToggleSelection = vi.fn();
    
    render(
      <OptimizedAdvisorCard
        advisor={mockAdvisor}
        isSelected={false}
        onToggleSelection={onToggleSelection}
      />
    );

    const card = screen.getByRole('button', { name: /select dr\. test advisor/i });

    const startTime = performance.now();
    
    // Test multiple keyboard events
    fireEvent.keyDown(card, { key: 'Enter' });
    fireEvent.keyDown(card, { key: ' ' });
    fireEvent.keyDown(card, { key: 'Tab' }); // Should not trigger
    
    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(50);
    expect(onToggleSelection).toHaveBeenCalledTimes(2); // Only Enter and Space
  });

  it('should efficiently handle selection state changes', () => {
    const onToggleSelection = vi.fn();
    
    const { rerender } = render(
      <OptimizedAdvisorCard
        advisor={mockAdvisor}
        isSelected={false}
        onToggleSelection={onToggleSelection}
      />
    );

    // Measure time for selection state change
    const startTime = performance.now();
    
    rerender(
      <OptimizedAdvisorCard
        advisor={mockAdvisor}
        isSelected={true}
        onToggleSelection={onToggleSelection}
      />
    );
    
    const endTime = performance.now();
    const rerenderTime = endTime - startTime;

    expect(rerenderTime).toBeLessThan(50);
    
    // Should show selected state
    expect(screen.getByText('Selected')).toBeInTheDocument();
    expect(screen.getByRole('button', { pressed: true })).toBeInTheDocument();
  });

  it('should handle prop changes without unnecessary re-computations', () => {
    const onToggleSelection = vi.fn();
    
    // Mock useMemo to track calls
    const originalUseMemo = React.useMemo;
    const useMemoSpy = vi.fn(originalUseMemo);
    React.useMemo = useMemoSpy;

    const { rerender } = render(
      <OptimizedAdvisorCard
        advisor={mockAdvisor}
        isSelected={false}
        onToggleSelection={onToggleSelection}
      />
    );

    const initialMemoCallCount = useMemoSpy.mock.calls.length;

    // Re-render with same props
    rerender(
      <OptimizedAdvisorCard
        advisor={mockAdvisor}
        isSelected={false}
        onToggleSelection={onToggleSelection}
      />
    );

    // Should not call useMemo again for same props
    expect(useMemoSpy.mock.calls.length).toBe(initialMemoCallCount);

    React.useMemo = originalUseMemo;
  });

  it('should perform well with large numbers of cards', () => {
    const onToggleSelection = vi.fn();
    const advisors = Array.from({ length: 50 }, (_, i) => ({
      ...mockAdvisor,
      id: `advisor-${i}`,
      name: `Dr. Advisor ${i}`,
    }));

    const startTime = performance.now();
    
    render(
      <div>
        {advisors.map(advisor => (
          <OptimizedAdvisorCard
            key={advisor.id}
            advisor={advisor}
            isSelected={false}
            onToggleSelection={onToggleSelection}
          />
        ))}
      </div>
    );
    
    const endTime = performance.now();
    const totalRenderTime = endTime - startTime;

    // Should render 50 cards in reasonable time
    expect(totalRenderTime).toBeLessThan(500);
    
    // All cards should be rendered
    expect(screen.getAllByText(/Dr\. Advisor/)).toHaveLength(50);
  });
});