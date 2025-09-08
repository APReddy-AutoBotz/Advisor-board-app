import React from 'react';
import { render, screen } from '@testing-library/react';
import AdvisorAvatar from '../AdvisorAvatar';
import type { Advisor, Domain } from '../../../types/domain';

const mockDomain: Domain = {
  id: 'cliniboard',
  name: 'Cliniboard',
  description: 'Clinical research and regulatory guidance',
  theme: {
    primary: 'clinical-600',
    secondary: 'clinical-100',
    accent: 'clinical-500',
    background: 'clinical-50',
    text: 'clinical-900',
  },
  advisors: [],
};

const mockAdvisor: Advisor = {
  id: 'cliniboard-0',
  name: 'Dr. Sanya Rao',
  expertise: 'Regulatory Affairs',
  background: 'Former FDA officer with 15+ years in IND/NDA reviews',
  domain: mockDomain,
  isSelected: false,
};

describe('AdvisorAvatar', () => {
  it('renders initials when no avatar URL is provided', () => {
    render(<AdvisorAvatar advisor={mockAdvisor} />);

    expect(screen.getByText('SR')).toBeInTheDocument();
  });

  it('renders image when avatar URL is provided', () => {
    const advisorWithAvatar = {
      ...mockAdvisor,
      avatar: 'https://example.com/avatar.jpg',
    };

    render(<AdvisorAvatar advisor={advisorWithAvatar} />);

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    expect(img).toHaveAttribute('alt', 'Dr. Sanya Rao avatar');
  });

  it('applies correct size classes', () => {
    const { rerender } = render(<AdvisorAvatar advisor={mockAdvisor} size="sm" />);
    
    let avatar = screen.getByText('SR');
    expect(avatar.className).toContain('w-8');
    expect(avatar.className).toContain('h-8');
    expect(avatar.className).toContain('text-xs');

    rerender(<AdvisorAvatar advisor={mockAdvisor} size="lg" />);
    avatar = screen.getByText('SR');
    expect(avatar.className).toContain('w-16');
    expect(avatar.className).toContain('h-16');
    expect(avatar.className).toContain('text-base');

    rerender(<AdvisorAvatar advisor={mockAdvisor} size="xl" />);
    avatar = screen.getByText('SR');
    expect(avatar.className).toContain('w-20');
    expect(avatar.className).toContain('h-20');
    expect(avatar.className).toContain('text-lg');
  });

  it('applies domain-specific color classes', () => {
    render(<AdvisorAvatar advisor={mockAdvisor} />);

    const avatar = screen.getByText('SR');
    expect(avatar.className).toContain('bg-clinical-100');
    expect(avatar.className).toContain('text-clinical-700');
  });

  it('shows border when showBorder is true', () => {
    render(<AdvisorAvatar advisor={mockAdvisor} showBorder={true} />);

    const avatar = screen.getByText('SR');
    expect(avatar.className).toContain('border-2');
  });

  it('generates correct initials for different name formats', () => {
    const singleNameAdvisor = {
      ...mockAdvisor,
      name: 'Madonna',
    };

    const { rerender } = render(<AdvisorAvatar advisor={singleNameAdvisor} />);
    expect(screen.getByText('M')).toBeInTheDocument();

    const threeNameAdvisor = {
      ...mockAdvisor,
      name: 'Dr. John Michael Smith',
    };

    rerender(<AdvisorAvatar advisor={threeNameAdvisor} />);
    expect(screen.getByText('JS')).toBeInTheDocument(); // Should take first and last name initials
  });

  it('applies different domain color schemes', () => {
    const educationAdvisor = {
      ...mockAdvisor,
      domain: { ...mockDomain, id: 'eduboard' as const },
    };

    const { rerender } = render(<AdvisorAvatar advisor={educationAdvisor} />);
    let avatar = screen.getByText('SR');
    expect(avatar.className).toContain('bg-education-100');
    expect(avatar.className).toContain('text-education-700');

    const remediesAdvisor = {
      ...mockAdvisor,
      domain: { ...mockDomain, id: 'remediboard' as const },
    };

    rerender(<AdvisorAvatar advisor={remediesAdvisor} />);
    avatar = screen.getByText('SR');
    expect(avatar.className).toContain('bg-remedies-100');
    expect(avatar.className).toContain('text-remedies-700');
  });

  it('includes title attribute with advisor name', () => {
    render(<AdvisorAvatar advisor={mockAdvisor} />);

    const avatar = screen.getByText('SR');
    expect(avatar).toHaveAttribute('title', 'Dr. Sanya Rao');
  });
});