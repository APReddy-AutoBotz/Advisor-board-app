/**
 * Advisor Selection Management Hook
 * 
 * Manages advisor selection state with 5-advisor limit,
 * toast notifications, and analytics tracking
 */

import { useState, useCallback } from 'react';
import type { Advisor } from '../types/domain';

export interface SelectionToast {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  duration: number;
}

export interface UseAdvisorSelectionReturn {
  selectedAdvisors: Advisor[];
  selectedCount: number;
  maxSelections: number;
  canSelectMore: boolean;
  selectAdvisor: (advisor: Advisor) => boolean;
  deselectAdvisor: (advisor: Advisor) => void;
  isSelected: (advisorId: string) => boolean;
  clearSelection: () => void;
  toasts: SelectionToast[];
  dismissToast: (toastId: string) => void;
}

const MAX_SELECTIONS = 5;
const TOAST_DURATION = 3000; // 3 seconds

export const useAdvisorSelection = (): UseAdvisorSelectionReturn => {
  const [selectedAdvisors, setSelectedAdvisors] = useState<Advisor[]>([]);
  const [toasts, setToasts] = useState<SelectionToast[]>([]);

  // Generate unique toast ID
  const generateToastId = () => `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Add toast notification
  const addToast = useCallback((message: string, type: SelectionToast['type'] = 'info') => {
    const toast: SelectionToast = {
      id: generateToastId(),
      message,
      type,
      duration: TOAST_DURATION
    };

    setToasts(prev => [...prev, toast]);

    // Auto-dismiss after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toast.id));
    }, TOAST_DURATION);
  }, []);

  // Dismiss toast manually
  const dismissToast = useCallback((toastId: string) => {
    setToasts(prev => prev.filter(t => t.id !== toastId));
  }, []);

  // Select advisor
  const selectAdvisor = useCallback((advisor: Advisor): boolean => {
    if (selectedAdvisors.length >= MAX_SELECTIONS) {
      addToast('Max 5 advisors. Deselect one to choose another.', 'warning');
      
      // Analytics tracking
      console.log('🚫 Selection Limit Reached', {
        advisorId: advisor.id,
        currentCount: selectedAdvisors.length,
        maxSelections: MAX_SELECTIONS
      });
      
      return false;
    }

    if (selectedAdvisors.some(a => a.id === advisor.id)) {
      // Already selected
      return false;
    }

    setSelectedAdvisors(prev => [...prev, { ...advisor, isSelected: true }]);
    
    // Success feedback
    addToast(`Added ${advisor.name} to your advisory board`, 'success');
    
    // Analytics tracking
    console.log('✅ Advisor Selected', {
      advisorId: advisor.id,
      advisorName: advisor.name,
      expertise: advisor.expertise,
      newCount: selectedAdvisors.length + 1
    });
    
    return true;
  }, [selectedAdvisors, addToast]);

  // Deselect advisor
  const deselectAdvisor = useCallback((advisor: Advisor) => {
    setSelectedAdvisors(prev => prev.filter(a => a.id !== advisor.id));
    
    // Info feedback
    addToast(`Removed ${advisor.name} from your advisory board`, 'info');
    
    // Analytics tracking
    console.log('➖ Advisor Deselected', {
      advisorId: advisor.id,
      advisorName: advisor.name,
      newCount: selectedAdvisors.length - 1
    });
  }, [selectedAdvisors, addToast]);

  // Check if advisor is selected
  const isSelected = useCallback((advisorId: string): boolean => {
    return selectedAdvisors.some(a => a.id === advisorId);
  }, [selectedAdvisors]);

  // Clear all selections
  const clearSelection = useCallback(() => {
    const count = selectedAdvisors.length;
    setSelectedAdvisors([]);
    
    if (count > 0) {
      addToast(`Cleared ${count} advisor${count !== 1 ? 's' : ''} from selection`, 'info');
      
      // Analytics tracking
      console.log('🗑️ Selection Cleared', {
        previousCount: count
      });
    }
  }, [selectedAdvisors, addToast]);

  return {
    selectedAdvisors,
    selectedCount: selectedAdvisors.length,
    maxSelections: MAX_SELECTIONS,
    canSelectMore: selectedAdvisors.length < MAX_SELECTIONS,
    selectAdvisor,
    deselectAdvisor,
    isSelected,
    clearSelection,
    toasts,
    dismissToast
  };
};
