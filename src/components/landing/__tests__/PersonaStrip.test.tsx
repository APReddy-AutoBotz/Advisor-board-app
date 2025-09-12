/**
 * PersonaStrip Component Tests
 * 
 * Tests for safety-compliant persona bios, AI disclaimers, and CTA formatting
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PersonaStrip from '../PersonaStrip';
import { SAFE_PERSONA_BIOS, CTA_BUTTON_TEMPLATE } from '../../../data/safePersonaBios';

// Mock the trackEvent function
vi.mock('../../../lib/boards', () => ({
  trackEvent: vi.fn()
}));

// Mock the NameFactory
vi.mock('../../../lib/nameFactory', () => ({
  NameFactory: vi.fn().mockImplementation(() => ({
    generateName: vi.fn().mockReturnValue({
      firstName: 'Sarah',
      lastName: 'Kim',
      fullName: 'Sarah Kim',
      gender: 'feminine'
    })
  }))
}));

// Mock the PortraitAssignmentEngine
vi.mock('../../../lib/portraitRegistry', () => ({
  PortraitAssignmentEngine: vi.fn().mockImplementation(() => ({
    assignPortrait: vi.fn().mockReturnValue({
      portraitKey: 'a1_strategy-pm',
      url: '/Portraits/a1_strategy-pm.png',
      alt: 'Portrait of Sarah Kim',
      genderTag: 'feminine'
    })
  }))
}));

// Mock getBoardTheme
vi.mock('../../../lib/boardThemes', () => ({
  getBoardTheme: vi.fn().mockReturnValue({
    gradient: { css: 'bg-gradient-to-r from-blue-500 to-purple-600' },
    accent: '#3B82F6'
  })
}));

describe('PersonaStrip', () => {
  it('renders all persona cards with safety-compliant roles', () => {
    render(<PersonaStrip />);
    
    // Check that AI Persona disclaimer is in role titles
    expect(screen.getByText('Chief Product Advisor (AI Persona)')).toBeInTheDocument();
    expect(screen.getByText('Clinical Research Advisor (AI Persona)')).toBeInTheDocument();
    expect(screen.getByText('Regulatory Affairs Advisor (AI Persona)')).toBeInTheDocument();
    expect(screen.getByText('Data Science Advisor (AI Persona)')).toBeInTheDocument();
    expect(screen.getByText('Curriculum Design Advisor (AI Persona)')).toBeInTheDocument();
    expect(screen.getByText('Naturopathic Medicine Advisor (AI Persona)')).toBeInTheDocument();
  });

  it('displays safety-compliant CTA button text', () => {
    render(<PersonaStrip />);
    
    // Check that CTA buttons use the correct format
    const ctaButtons = screen.getAllByText(/Chat with AI .+ \(Simulated Persona\)/);
    expect(ctaButtons).toHaveLength(6); // One for each persona
    
    // Verify specific CTA format
    expect(screen.getByText('Chat with AI Sarah (Simulated Persona)')).toBeInTheDocument();
  });

  it('shows info popover with AI disclaimer when info button is clicked', async () => {
    render(<PersonaStrip />);
    
    // Click the first info button
    const infoButtons = screen.getAllByText('About this AI persona');
    fireEvent.click(infoButtons[0]);
    
    // Wait for popover to appear
    await waitFor(() => {
      expect(screen.getByText('AI Persona Disclaimer')).toBeInTheDocument();
    });
    
    // Check disclaimer content
    expect(screen.getByText(/This advisor is an AI persona, not a real person/)).toBeInTheDocument();
    expect(screen.getByText('Educational use only')).toBeInTheDocument();
  });

  it('displays safety-compliant experience descriptions', () => {
    render(<PersonaStrip />);
    
    // Check that no real company names are displayed
    expect(screen.queryByText(/Stripe/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Google/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Airbnb/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Netflix/i)).not.toBeInTheDocument();
    
    // Check that no specific valuations are displayed
    expect(screen.queryByText(/\$100M/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\$1B/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\$95B/)).not.toBeInTheDocument();
    
    // Check that no specific user counts are displayed
    expect(screen.queryByText(/10M\+ users/)).not.toBeInTheDocument();
    expect(screen.queryByText(/100M\+ users/)).not.toBeInTheDocument();
  });

  it('shows medical disclaimer for clinical and remedy board personas', async () => {
    render(<PersonaStrip />);
    
    // Click info button for clinical persona (should be the second card)
    const infoButtons = screen.getAllByText('About this AI persona');
    fireEvent.click(infoButtons[1]); // Clinical persona
    
    await waitFor(() => {
      expect(screen.getByText(/Not medical advice/)).toBeInTheDocument();
    });
  });

  it('closes info popover when close button is clicked', async () => {
    render(<PersonaStrip />);
    
    // Open popover
    const infoButtons = screen.getAllByText('About this AI persona');
    fireEvent.click(infoButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText('AI Persona Disclaimer')).toBeInTheDocument();
    });
    
    // Close popover
    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);
    
    await waitFor(() => {
      expect(screen.queryByText('AI Persona Disclaimer')).not.toBeInTheDocument();
    });
  });

  it('displays expertise areas from safe persona bios', () => {
    render(<PersonaStrip />);
    
    // Check that expertise areas are displayed (these should be from SAFE_PERSONA_BIOS)
    expect(screen.getByText('Product strategy & platform scaling')).toBeInTheDocument();
    expect(screen.getByText('Clinical trials & regulatory strategy')).toBeInTheDocument();
    expect(screen.getByText('FDA submissions & compliance')).toBeInTheDocument();
  });

  it('handles chat button clicks correctly', () => {
    // Mock window.alert to avoid actual alerts in tests
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(<PersonaStrip />);
    
    // Click a chat button
    const chatButton = screen.getByText('Chat with AI Sarah (Simulated Persona)');
    fireEvent.click(chatButton);
    
    // Verify alert was called with correct message
    expect(alertSpy).toHaveBeenCalledWith(
      expect.stringContaining('Starting chat with Chat with AI Sarah (Simulated Persona)')
    );
    
    alertSpy.mockRestore();
  });

  it('renders section header with correct content', () => {
    render(<PersonaStrip />);
    
    expect(screen.getByText('Meet Your AI Advisory Team')).toBeInTheDocument();
    expect(screen.getByText(/Each AI persona is trained on domain expertise/)).toBeInTheDocument();
  });

  it('includes AI badges on persona cards', () => {
    render(<PersonaStrip />);
    
    // Check for AI badges (🤖 AI text)
    const aiBadges = screen.getAllByText('🤖 AI');
    expect(aiBadges).toHaveLength(6); // One for each persona
  });

  it('validates that CTA_BUTTON_TEMPLATE function works correctly', () => {
    const result = CTA_BUTTON_TEMPLATE('Sarah');
    expect(result).toBe('Chat with AI Sarah (Simulated Persona)');
  });

  it('validates that SAFE_PERSONA_BIOS contains required fields', () => {
    const sarahBio = SAFE_PERSONA_BIOS['sarah-kim'];
    
    expect(sarahBio).toBeDefined();
    expect(sarahBio.title).toContain('(AI Persona)');
    expect(sarahBio.disclaimer).toContain('not a real person');
    expect(sarahBio.expertise).toHaveLength(3); // Max 3 expertise areas
    expect(sarahBio.ctaFormat).toContain('(Simulated Persona)');
    
    // Ensure no real company names in experience
    expect(sarahBio.experience).not.toMatch(/Stripe|Google|Airbnb|Netflix/i);
    
    // Ensure no specific valuations
    expect(sarahBio.experience).not.toMatch(/\$\d+[MB]/);
  });

  it('ensures all personas have consistent AI disclaimers', () => {
    Object.values(SAFE_PERSONA_BIOS).forEach(bio => {
      expect(bio.title).toContain('(AI Persona)');
      expect(bio.disclaimer).toContain('Educational use only');
      expect(bio.ctaFormat).toContain('(Simulated Persona)');
    });
  });
});
