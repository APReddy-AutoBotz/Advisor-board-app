/**
 * Animation Observer Utility
 * Handles intersection-based entrance animations for premium micro-interactions
 */

interface AnimationObserverOptions {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}

class AnimationObserver {
  private observer: IntersectionObserver | null = null;
  private elements: Set<Element> = new Set();

  constructor(options: AnimationObserverOptions = {}) {
    const {
      threshold = 0.1,
      rootMargin = '0px 0px -50px 0px',
      once = true
    } = options;

    // Check if IntersectionObserver is supported
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target;
            
            // Add the 'in-view' class to trigger animations
            element.classList.add('in-view');
            
            // If once is true, stop observing this element
            if (once) {
              this.observer?.unobserve(element);
              this.elements.delete(element);
            }
          } else if (!once) {
            // Remove the class if not intersecting and not once-only
            entry.target.classList.remove('in-view');
          }
        });
      }, {
        threshold,
        rootMargin
      });
    }
  }

  /**
   * Start observing elements with the 'observe-entrance' class
   */
  observe(selector: string = '.observe-entrance'): void {
    if (!this.observer) return;

    const elements = document.querySelectorAll(selector);
    elements.forEach((element) => {
      if (!this.elements.has(element)) {
        this.observer?.observe(element);
        this.elements.add(element);
      }
    });
  }

  /**
   * Stop observing a specific element
   */
  unobserve(element: Element): void {
    if (this.observer && this.elements.has(element)) {
      this.observer.unobserve(element);
      this.elements.delete(element);
    }
  }

  /**
   * Stop observing all elements and disconnect the observer
   */
  disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.elements.clear();
    }
  }

  /**
   * Manually trigger animations for all observed elements (fallback)
   */
  triggerAll(): void {
    this.elements.forEach((element) => {
      element.classList.add('in-view');
    });
  }
}

// Create a singleton instance
let animationObserver: AnimationObserver | null = null;

/**
 * Initialize the animation observer
 */
export const initAnimationObserver = (options?: AnimationObserverOptions): AnimationObserver => {
  if (!animationObserver) {
    animationObserver = new AnimationObserver(options);
  }
  return animationObserver;
};

/**
 * Get the current animation observer instance
 */
export const getAnimationObserver = (): AnimationObserver | null => {
  return animationObserver;
};

/**
 * Start observing entrance animations
 */
export const startEntranceAnimations = (): void => {
  const observer = initAnimationObserver();
  observer.observe('.observe-entrance');
};

/**
 * Hook for React components to handle entrance animations
 */
export const useEntranceAnimations = (deps: any[] = []) => {
  if (typeof window !== 'undefined') {
    // Use a simple timeout to ensure DOM is ready
    setTimeout(() => {
      startEntranceAnimations();
    }, 100);
  }
};

/**
 * Cleanup function for when components unmount
 */
export const cleanupAnimationObserver = (): void => {
  if (animationObserver) {
    animationObserver.disconnect();
    animationObserver = null;
  }
};

export default AnimationObserver;