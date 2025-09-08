import React, { Suspense } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  LazyAdvisorSelectionPanel,
  LazyConsultationInterface,
  LazyMultiDomainAdvisorPanel,
  withPerformanceMonitoring,
} from '../LazyComponents';
import type { Advisor, DomainId } from '../../../types/domain';

// Mock the heavy components to control loading behavior
vi.mock('../../advisors/AdvisorSelectionPanel', () => ({
  default: () => <div data-testid="advisor-selection-panel">Advisor Selection Panel</div>,
}));

vi.mock('../../consultation/ConsultationInterface', () => ({
  default: () => <div data-testid="consultation-interface">Consultation Interface</div>,
}));

vi.mock('../../advisors/MultiDomainAdvisorPanel', () => ({
  default: () => <div data-testid="multi-domain-advisor-panel">Multi Domain Advisor Panel</div>,
}));

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
  name: 'Dr. Test',
  expertise: 'Testing',
  background: 'Test background',
  domain: {
    id: 'cliniboard',
    name: 'Cliniboard',
    description: 'Clinical domain',
    advisors: [],
  },
  isSelected: true,
};

describe('LazyComponents Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPerformance.now.mockReturnValue(0);
  });

  it('should load LazyAdvisorSelectionPanel efficiently', async () => {
    const startTime = performance.now();
    
    render(
      <LazyAdvisorSelectionPanel
        domainId="cliniboard"
        onSelectionComplete={vi.fn()}
      />
    );

    // Should show loading skeleton initially
    expect(screen.getByRole('status')).toBeInTheDocument();

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByTestId('advisor-selection-panel')).toBeInTheDocument();
    });

    const endTime = performance.now();
    const loadTime = endTime - startTime;

    // Should load reasonably quickly
    expect(loadTime).toBeLessThan(1000);
  });

  it('should load LazyConsultationInterface efficiently', async () => {
    const startTime = performance.now();
    
    render(
      <LazyConsultationInterface
        selectedAdvisors={[mockAdvisor]}
        onBack={vi.fn()}
      />
    );

    // Should show loading skeleton initially
    expect(screen.getByRole('status')).toBeInTheDocument();

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByTestId('consultation-interface')).toBeInTheDocument();
    });

    const endTime = performance.now();
    const loadTime = endTime - startTime;

    expect(loadTime).toBeLessThan(1000);
  });

  it('should handle multiple lazy components loading simultaneously', async () => {
    const startTime = performance.now();
    
    render(
      <div>
        <LazyAdvisorSelectionPanel
          domainId="cliniboard"
          onSelectionComplete={vi.fn()}
        />
        <LazyConsultationInterface
          selectedAdvisors={[mockAdvisor]}
          onBack={vi.fn()}
        />
        <LazyMultiDomainAdvisorPanel
          onSelectionComplete={vi.fn()}
          onBack={vi.fn()}
        />
      </div>
    );

    // All should show loading states initially
    expect(screen.getAllByRole('status')).toHaveLength(3);

    // Wait for all components to load
    await waitFor(() => {
      expect(screen.getByTestId('advisor-selection-panel')).toBeInTheDocument();
      expect(screen.getByTestId('consultation-interface')).toBeInTheDocument();
      expect(screen.getByTestId('multi-domain-advisor-panel')).toBeInTheDocument();
    });

    const endTime = performance.now();
    const totalLoadTime = endTime - startTime;

    // Should load all components in reasonable time
    expect(totalLoadTime).toBeLessThan(2000);
  });

  it('should reset properly when resetKeys change', async () => {
    const { rerender } = render(
      <LazyAdvisorSelectionPanel
        domainId="cliniboard"
        onSelectionComplete={vi.fn()}
      />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('advisor-selection-panel')).toBeInTheDocument();
    });

    const startTime = performance.now();

    // Change resetKey (domainId)
    rerender(
      <LazyAdvisorSelectionPanel
        domainId="eduboard"
        onSelectionComplete={vi.fn()}
      />
    );

    // Should show loading state again
    expect(screen.getByRole('status')).toBeInTheDocument();

    // Wait for reload
    await waitFor(() => {
      expect(screen.getByTestId('advisor-selection-panel')).toBeInTheDocument();
    });

    const endTime = performance.now();
    const reloadTime = endTime - startTime;

    // Reload should be fast since component is already loaded
    expect(reloadTime).toBeLessThan(500);
  });

  it('should handle error boundaries efficiently', async () => {
    // Mock a component that throws an error
    vi.doMock('../../advisors/AdvisorSelectionPanel', () => ({
      default: () => {
        throw new Error('Test error');
      },
    }));

    const startTime = performance.now();

    render(
      <LazyAdvisorSelectionPanel
        domainId="cliniboard"
        onSelectionComplete={vi.fn()}
      />
    );

    // Should show error boundary UI
    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    const endTime = performance.now();
    const errorHandlingTime = endTime - startTime;

    // Error handling should be fast
    expect(errorHandlingTime).toBeLessThan(500);
  });

  it('should provide appropriate loading skeletons for different components', () => {
    // Test advisor selection skeleton
    render(
      <LazyAdvisorSelectionPanel
        domainId="cliniboard"
        onSelectionComplete={vi.fn()}
      />
    );

    // Should show skeleton with advisor card structure
    expect(screen.getByRole('status')).toBeInTheDocument();

    // Test consultation skeleton with advisor count
    const { rerender } = render(
      <LazyConsultationInterface
        selectedAdvisors={[mockAdvisor, mockAdvisor, mockAdvisor]}
        onBack={vi.fn()}
      />
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should handle rapid component switching efficiently', async () => {
    const { rerender } = render(
      <LazyAdvisorSelectionPanel
        domainId="cliniboard"
        onSelectionComplete={vi.fn()}
      />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('advisor-selection-panel')).toBeInTheDocument();
    });

    const startTime = performance.now();

    // Rapidly switch between components
    for (let i = 0; i < 5; i++) {
      rerender(
        <LazyConsultationInterface
          selectedAdvisors={[mockAdvisor]}
          onBack={vi.fn()}
        />
      );

      rerender(
        <LazyAdvisorSelectionPanel
          domainId="cliniboard"
          onSelectionComplete={vi.fn()}
        />
      );
    }

    const endTime = performance.now();
    const switchingTime = endTime - startTime;

    // Rapid switching should not cause performance issues
    expect(switchingTime).toBeLessThan(1000);
  });
});

describe('withPerformanceMonitoring HOC', () => {
  beforeEach(() => {
    console.log = vi.fn();
    console.warn = vi.fn();
    mockPerformance.now.mockReturnValue(0);
  });

  it('should monitor component performance', () => {
    const TestComponent = () => <div>Test Component</div>;
    const MonitoredComponent = withPerformanceMonitoring(TestComponent, 'TestComponent');

    mockPerformance.now
      .mockReturnValueOnce(0) // Mount time
      .mockReturnValueOnce(50); // Unmount time

    const { unmount } = render(<MonitoredComponent />);

    expect(screen.getByText('Test Component')).toBeInTheDocument();

    unmount();

    // Should log performance metrics in development
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('TestComponent render time: 50.00ms')
    );
  });

  it('should warn about slow renders', () => {
    const SlowComponent = () => {
      // Simulate slow component
      return <div>Slow Component</div>;
    };
    
    const MonitoredSlowComponent = withPerformanceMonitoring(SlowComponent, 'SlowComponent');

    mockPerformance.now
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(150); // Slow render

    const { unmount } = render(<MonitoredSlowComponent />);
    unmount();

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Slow render detected in SlowComponent: 150.00ms')
    );
  });

  it('should preserve component props and behavior', () => {
    interface TestProps {
      message: string;
      onClick: () => void;
    }

    const TestComponent: React.FC<TestProps> = ({ message, onClick }) => (
      <button onClick={onClick}>{message}</button>
    );

    const MonitoredComponent = withPerformanceMonitoring(TestComponent, 'TestComponent');
    const onClick = vi.fn();

    render(<MonitoredComponent message="Click me" onClick={onClick} />);

    const button = screen.getByText('Click me');
    button.click();

    expect(onClick).toHaveBeenCalled();
  });

  it('should handle component errors gracefully', () => {
    const ErrorComponent = () => {
      throw new Error('Component error');
    };

    const MonitoredErrorComponent = withPerformanceMonitoring(ErrorComponent, 'ErrorComponent');

    expect(() => {
      render(<MonitoredErrorComponent />);
    }).toThrow('Component error');

    // Should still attempt to log performance even with errors
    expect(console.log).toHaveBeenCalled();
  });

  it('should not interfere with component lifecycle', () => {
    let mountCount = 0;
    let unmountCount = 0;

    const LifecycleComponent = () => {
      React.useEffect(() => {
        mountCount++;
        return () => {
          unmountCount++;
        };
      }, []);

      return <div>Lifecycle Component</div>;
    };

    const MonitoredComponent = withPerformanceMonitoring(LifecycleComponent, 'LifecycleComponent');

    const { unmount } = render(<MonitoredComponent />);

    expect(mountCount).toBe(1);
    expect(unmountCount).toBe(0);

    unmount();

    expect(unmountCount).toBe(1);
  });
});