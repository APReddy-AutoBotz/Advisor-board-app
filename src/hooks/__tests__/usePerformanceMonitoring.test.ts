import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  usePerformanceMonitoring,
  useAsyncPerformanceMonitoring,
  useMemoryMonitoring,
  useBundleMonitoring,
} from '../usePerformanceMonitoring';

// Mock performance API
const mockPerformance = {
  now: vi.fn(),
  memory: {
    usedJSHeapSize: 50 * 1024 * 1024, // 50MB
  },
};

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true,
});

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

describe('usePerformanceMonitoring', () => {
  beforeEach(() => {
    console.log = vi.fn();
    console.warn = vi.fn();
    mockPerformance.now.mockReturnValue(0);
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    vi.clearAllMocks();
  });

  it('measures render performance', () => {
    mockPerformance.now
      .mockReturnValueOnce(0) // Start time
      .mockReturnValueOnce(50); // End time

    const { result, unmount } = renderHook(() =>
      usePerformanceMonitoring('TestComponent')
    );

    expect(result.current.renderCount).toBe(1);

    unmount();

    expect(result.current.metrics).toHaveLength(1);
    expect(result.current.metrics[0]).toMatchObject({
      renderTime: 50,
      componentName: 'TestComponent',
    });
  });

  it('warns about slow renders', () => {
    mockPerformance.now
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(150); // Slow render (>100ms)

    const { unmount } = renderHook(() =>
      usePerformanceMonitoring('SlowComponent', { slowRenderThreshold: 100 })
    );

    unmount();

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Slow render detected in SlowComponent: 150.00ms'),
      expect.any(Object)
    );
  });

  it('respects sample rate', () => {
    // Mock Math.random to always return 0.9
    const originalRandom = Math.random;
    Math.random = vi.fn().mockReturnValue(0.9);

    mockPerformance.now
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(50);

    const { result, unmount } = renderHook(() =>
      usePerformanceMonitoring('TestComponent', { sampleRate: 0.5 })
    );

    unmount();

    // Should not record metrics due to sample rate
    expect(result.current.metrics).toHaveLength(0);

    Math.random = originalRandom;
  });

  it('logs periodic performance summaries', () => {
    mockPerformance.now
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(50);

    // Mock render count to be 10 (divisible by 10)
    const { result, rerender, unmount } = renderHook(() =>
      usePerformanceMonitoring('TestComponent')
    );

    // Simulate 10 renders
    for (let i = 0; i < 9; i++) {
      rerender();
    }

    unmount();

    // Should log performance summary on 10th render
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('TestComponent performance (render #10):'),
      expect.any(Object)
    );
  });

  it('disables logging when configured', () => {
    mockPerformance.now
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(150);

    const { unmount } = renderHook(() =>
      usePerformanceMonitoring('TestComponent', { enableLogging: false })
    );

    unmount();

    expect(console.warn).not.toHaveBeenCalled();
  });
});

describe('useAsyncPerformanceMonitoring', () => {
  beforeEach(() => {
    console.warn = vi.fn();
    mockPerformance.now.mockReturnValue(0);
  });

  it('tracks async operation performance', () => {
    mockPerformance.now
      .mockReturnValueOnce(0) // Start time
      .mockReturnValueOnce(500); // End time

    const { result } = renderHook(() => useAsyncPerformanceMonitoring());

    act(() => {
      result.current.startOperation('test-operation');
    });

    expect(result.current.activeOperations).toBe(1);

    act(() => {
      result.current.endOperation('test-operation', { metadata: 'test' });
    });

    expect(result.current.activeOperations).toBe(0);
  });

  it('warns about slow async operations', () => {
    mockPerformance.now
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(1500); // 1.5 seconds

    const { result } = renderHook(() => useAsyncPerformanceMonitoring());

    act(() => {
      result.current.startOperation('slow-operation');
    });

    act(() => {
      result.current.endOperation('slow-operation');
    });

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Slow async operation: slow-operation took 1500.00ms'),
      undefined
    );
  });

  it('handles operations that were never started', () => {
    const { result } = renderHook(() => useAsyncPerformanceMonitoring());

    act(() => {
      result.current.endOperation('non-existent-operation');
    });

    expect(result.current.activeOperations).toBe(0);
    expect(console.warn).not.toHaveBeenCalled();
  });
});

describe('useMemoryMonitoring', () => {
  beforeEach(() => {
    console.warn = vi.fn();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('tracks memory usage', () => {
    const { result } = renderHook(() => useMemoryMonitoring('TestComponent'));

    expect(result.current).toMatchObject({
      initial: 50 * 1024 * 1024,
      current: 50 * 1024 * 1024,
      peak: 50 * 1024 * 1024,
    });
  });

  it('detects memory growth', () => {
    // Start with 50MB
    mockPerformance.memory.usedJSHeapSize = 50 * 1024 * 1024;

    const { result } = renderHook(() => useMemoryMonitoring('TestComponent'));

    // Simulate memory growth to 65MB (15MB increase)
    mockPerformance.memory.usedJSHeapSize = 65 * 1024 * 1024;

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Potential memory leak in TestComponent: +15.00MB'),
      expect.any(Object)
    );

    expect(result.current?.current).toBe(65 * 1024 * 1024);
    expect(result.current?.peak).toBe(65 * 1024 * 1024);
  });

  it('handles missing memory API', () => {
    // Temporarily remove memory API
    const originalMemory = (performance as any).memory;
    delete (performance as any).memory;

    const { result } = renderHook(() => useMemoryMonitoring('TestComponent'));

    expect(result.current).toBeNull();

    // Restore memory API
    (performance as any).memory = originalMemory;
  });
});

describe('useBundleMonitoring', () => {
  beforeEach(() => {
    console.log = vi.fn();
    mockPerformance.now.mockReturnValue(0);
  });

  it('tracks chunk load times', () => {
    mockPerformance.now
      .mockReturnValueOnce(0) // Start time
      .mockReturnValueOnce(200); // End time

    const { result } = renderHook(() => useBundleMonitoring());

    let endTracking: (() => void) | undefined;

    act(() => {
      endTracking = result.current.trackChunkLoad('test-chunk');
    });

    act(() => {
      endTracking?.();
    });

    expect(result.current.loadTimes.get('test-chunk')).toBe(200);
    expect(console.log).toHaveBeenCalledWith(
      '📦 Chunk loaded: test-chunk in 200.00ms'
    );
  });

  it('tracks multiple chunks', () => {
    mockPerformance.now
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(100)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(150);

    const { result } = renderHook(() => useBundleMonitoring());

    let endTracking1: (() => void) | undefined;
    let endTracking2: (() => void) | undefined;

    act(() => {
      endTracking1 = result.current.trackChunkLoad('chunk-1');
      endTracking2 = result.current.trackChunkLoad('chunk-2');
    });

    act(() => {
      endTracking1?.();
      endTracking2?.();
    });

    expect(result.current.loadTimes.get('chunk-1')).toBe(100);
    expect(result.current.loadTimes.get('chunk-2')).toBe(150);
  });
});