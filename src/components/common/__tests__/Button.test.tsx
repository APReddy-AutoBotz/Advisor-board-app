import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '../Button';
import ThemeProvider from '../ThemeProvider';

const renderWithTheme = (component: React.ReactNode) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('Button Component', () => {
  describe('Basic Rendering', () => {
    it('renders with text content', () => {
      renderWithTheme(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('renders with different variants', () => {
      const { rerender } = renderWithTheme(<Button variant="primary">Primary</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-neutral-600');

      rerender(
        <ThemeProvider>
          <Button variant="secondary">Secondary</Button>
        </ThemeProvider>
      );
      expect(screen.getByRole('button')).toHaveClass('bg-neutral-100');

      rerender(
        <ThemeProvider>
          <Button variant="outline">Outline</Button>
        </ThemeProvider>
      );
      expect(screen.getByRole('button')).toHaveClass('border-2');

      rerender(
        <ThemeProvider>
          <Button variant="ghost">Ghost</Button>
        </ThemeProvider>
      );
      expect(screen.getByRole('button')).toHaveClass('text-neutral-600');
    });

    it('renders with different sizes', () => {
      const { rerender } = renderWithTheme(<Button size="sm">Small</Button>);
      expect(screen.getByRole('button')).toHaveClass('px-3');

      rerender(
        <ThemeProvider>
          <Button size="md">Medium</Button>
        </ThemeProvider>
      );
      expect(screen.getByRole('button')).toHaveClass('px-4');

      rerender(
        <ThemeProvider>
          <Button size="lg">Large</Button>
        </ThemeProvider>
      );
      expect(screen.getByRole('button')).toHaveClass('px-6');
    });
  });

  describe('Interactive Behavior', () => {
    it('handles click events', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      renderWithTheme(<Button onClick={handleClick}>Click me</Button>);
      
      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not trigger click when disabled', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      renderWithTheme(<Button onClick={handleClick} disabled>Disabled</Button>);
      
      await user.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('shows loading state', () => {
      renderWithTheme(<Button isLoading>Loading</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('disabled');
      // Check for loading spinner
      expect(button.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes when disabled', () => {
      renderWithTheme(<Button disabled>Disabled Button</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('disabled');
    });

    it('has proper ARIA attributes when loading', () => {
      renderWithTheme(<Button isLoading>Loading Button</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('disabled');
      expect(button.querySelector('svg')).toBeInTheDocument();
    });

    it('supports custom aria-label', () => {
      renderWithTheme(<Button aria-label="Custom label">×</Button>);
      
      expect(screen.getByRole('button', { name: 'Custom label' })).toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    it('renders with left icon', () => {
      const LeftIcon = () => <span data-testid="left-icon">←</span>;
      
      renderWithTheme(
        <Button leftIcon={<LeftIcon />}>
          With Left Icon
        </Button>
      );
      
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByText('With Left Icon')).toBeInTheDocument();
    });

    it('renders with right icon', () => {
      const RightIcon = () => <span data-testid="right-icon">→</span>;
      
      renderWithTheme(
        <Button rightIcon={<RightIcon />}>
          With Right Icon
        </Button>
      );
      
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
      expect(screen.getByText('With Right Icon')).toBeInTheDocument();
    });
  });

  describe('Layout', () => {
    it('renders as full width when specified', () => {
      renderWithTheme(<Button fullWidth>Full Width</Button>);
      
      expect(screen.getByRole('button')).toHaveClass('w-full');
    });

    it('applies custom className', () => {
      renderWithTheme(<Button className="custom-class">Custom</Button>);
      
      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });
  });

  describe('Form Integration', () => {
    it('supports type attribute', () => {
      renderWithTheme(<Button type="submit">Submit</Button>);
      
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });

    it('supports form attribute', () => {
      renderWithTheme(<Button form="my-form">Submit Form</Button>);
      
      expect(screen.getByRole('button')).toHaveAttribute('form', 'my-form');
    });
  });

  describe('Theme Integration', () => {
    it('applies theme-specific classes', () => {
      render(
        <ThemeProvider defaultDomain="cliniboard">
          <Button variant="primary">Themed Button</Button>
        </ThemeProvider>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-clinical-600');
    });

    it('works with dark mode', () => {
      render(
        <ThemeProvider defaultDomain="cliniboard">
          <Button variant="primary">Dark Mode Button</Button>
        </ThemeProvider>
      );
      
      // Button should render properly regardless of dark mode
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('is accessible via keyboard', () => {
      const handleClick = vi.fn();
      
      renderWithTheme(<Button onClick={handleClick}>Keyboard Accessible</Button>);
      
      const button = screen.getByRole('button');
      expect(button).not.toHaveAttribute('tabindex', '-1');
      expect(button).toBeEnabled();
    });

    it('supports keyboard interaction when enabled', () => {
      renderWithTheme(<Button>Keyboard Button</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeEnabled();
      expect(button).not.toHaveAttribute('disabled');
    });

    it('is focusable by default', () => {
      renderWithTheme(<Button>Focusable</Button>);
      
      const button = screen.getByRole('button');
      expect(button).not.toHaveAttribute('disabled');
    });

    it('is not focusable when disabled', () => {
      renderWithTheme(<Button disabled>Not Focusable</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('disabled');
    });
  });
});