/**
 * Simple Animation Observer Hook
 * Provides basic entrance animations without complex intersection observer
 */

import { useEffect } from 'react';

/**
 * Simple hook that adds entrance animation classes to elements
 * This is a simplified version that doesn't use intersection observer
 */
export const useEntranceAnimations = () => {
  useEffect(() => {
    // Add a simple class-based animation system
    const elements = document.querySelectorAll('.observe-entrance');
    
    elements.forEach((element, index) => {
      // Add animation classes with staggered delays
      setTimeout(() => {
        element.classList.add('in-view');
      }, index * 160); // Use 160ms stagger as defined in CSS
    });

    // Cleanup function
    return () => {
      elements.forEach(element => {
        element.classList.remove('in-view');
      });
    };
  }, []);
};

// Export for backward compatibility
export default useEntranceAnimations;