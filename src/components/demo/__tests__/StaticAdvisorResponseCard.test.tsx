/**
 * Static Advisor Response Card Tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StaticAdvisorResponseCard from '../StaticAdvisorResponseCard';
import type { StaticAdvisorResponse } from '../../../data/sampleDemoData';

const mockAdvisor: StaticAdvisorResponse = {
  id: 'test-advisor',
  name: 'Dr. Test Advisor',
  role: 'Test Expert (AI Persona)',
  response: 'This is a test response from the advisor.',
  boardId: 'clinical',
  delay: 800
};

describe('StaticAdvisorResponseCard', () => {
  it('renders advisor information correctly', () => {
    render(
      <StaticAdvisorResponseCard 
        advisor={mockAdvisor}
        isVisible={true}
      />
    );

    expect(screen.getByText('Dr. Test Advisor')).toBeInTheDocument();
    expect(screen.getByText('Test Expert (AI Persona)')).toBeInTheDocument();
    expect(screen.getByText('This is a test response from the advisor.')).toBeInTheDocument();
  });

  it('displays board theme correctly', () => {
    render(
      <StaticAdvisorResponseCard 
        advisor={mockAdvisor}
        isVisible={true}
      />
    );

    expect(screen.getByText('Clinical Research & Regulatory')).toBeInTheDocument();
  });

  it('shows AI disclaimer', () => {
    render(
      <StaticAdvisorResponseCard 
        advisor={mockAdvisor}
        isVisible={true}
      />
    );

    expect(screen.getByText('AI Persona Response - Educational Use Only')).toBeInTheDocument();
  });

  it('applies correct CSS classes for board theming', () => {
    const { container } = render(
      <StaticAdvisorResponseCard 
        advisor={mockAdvisor}
        isVisible={true}
      />
    );

    const card = container.querySelector('.card-clinical');
    expect(card).toBeInTheDocument();
  });
});
