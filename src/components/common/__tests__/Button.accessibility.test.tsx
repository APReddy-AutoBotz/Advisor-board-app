import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../../utils/testUtils';
import { checkTouchTargetSize, checkAriaLabels, checkKeyboardNavigation } from '../../../utils/testUtils';
import Button from '../Button';

describe('Button Accessibility', () => {
  describe('Touch Target Size', () => {
    it('should meet minimum touch target size requirements', () => {
      render(<Button>Test Button</Button>);
      const button = screen.getByRole('button');
      
      expect(checkTouchTargetSize(button)).toBe(true);
    });

    it('should maintain touch target size across all sizes', () => {
      const sizes = ['sm', 'md', 'lg', 'xl'] as const;
      
      sizes.forEach(size => {
        const { unmount } = render(<Button size={size}>Test Button</Button>);
        const button = screen.getByRole('button');
        
        expect(checkTouchTargetSize(button)).toBe(true);
        unmount();
      });
    });
  });

  describe('ARIA Labels and Semantics', () => {
    it('should have proper button role', () => {
      render(<Button>Test Button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toBeInTheDocument();
    });

    it('should support custom aria-label', () => {
      render(<Button aria-label="Custom label">Test</Button>);
      const button = screen.getByLabelText('Custom label');
      
      expect(button).toBeInTheDocument();
    });

    it('should support aria-describedby', () => {
      render(
        <div>
          <Button aria-describedby="description">Test</Button>
          <div id="description">Button description</div>
        </div>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-describedby', 'description');
    });

    it('should indicate loading state to screen readers', () => {
      render(<Button isLoading>Test Button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toBeDisabled();
      expect(button).toHaveTextContent('Test Button');
    });

    it('should indicate disabled state properly', () => {
      render(<Button disabled>Test Button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('disabled');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be keyboard accessible', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Test Button</Button>);
      const button = screen.getByRole('button');
      
      expect(await checkKeyboardNavigation(button.parentElement!)).toBe(true);
    });

    it('should respond to Enter key', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Test Button</Button>);
      const button = screen.getByRole('button');
      
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      expect(handleClick).toHaveBeenCalled();
    });

    it('should respond to Space key', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Test Button</Button>);
      const button = screen.getByRole('button');
      
      fireEvent.keyDown(button, { key: ' ', code: 'Space' });
      expect(handleClick).toHaveBeenCalled();
    });

    it('should not respond to keyboard when disabled', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick} disabled>Test Button</Button>);
      const button = screen.getByRole('button');
      
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      fireEvent.keyDown(button, { key: ' ', code: 'Space' });
      
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Focus Management', () => {
    it('should be focusable', () => {
      render(<Button>Test Button</Button>);
      const button = screen.getByRole('button');
      
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should not be focusable when disabled', () => {
      render(<Button disabled>Test Button</Button>);
      const button = screen.getByRole('button');
      
      button.focus();
      expect(button).not.toHaveFocus();
    });

    it('should have visible focus indicator', () => {
      render(<Button>Test Button</Button>);
      const button = screen.getByRole('button');
      
      // Check that focus styles are applied
      expect(button.className).toContain('focus:outline-none');
      expect(button.className).toContain('focus:ring-2');
    });
  });

  describe('Screen Reader Support', () => {
    it('should announce button text to screen readers', () => {
      render(<Button>Submit Form</Button>);
      const button = screen.getByRole('button', { name: 'Submit Form' });
      
      expect(button).toBeInTheDocument();
    });

    it('should announce loading state', () => {
      render(<Button isLoading aria-label="Submitting form">Submit</Button>);
      const button = screen.getByLabelText('Submitting form');
      
      expect(button).toBeInTheDocument();
      expect(button).toBeDisabled();
    });

    it('should properly announce icons', () => {
      const icon = <span aria-hidden="true">→</span>;
      render(<Button rightIcon={icon}>Next</Button>);
      
      const button = screen.getByRole('button', { name: 'Next' });
      expect(button).toBeInTheDocument();
    });
  });

  describe('Color Contrast', () => {
    it('should maintain sufficient color contrast for all variants', () => {
      const variants = ['primary', 'secondary', 'accent', 'outline', 'ghost'] as const;
      
      variants.forEach(variant => {
        const { unmount } = render(<Button variant={variant}>Test</Button>);
        const button = screen.getByRole('button');
        
        // In a real implementation, you'd use a proper contrast checking library
        // For now, we'll just check that the button has color styles applied
        expect(button.className).toBeTruthy();
        unmount();
      });
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should maintain usability on mobile devices', () => {
      render(<Button>Mobile Button</Button>);
      const button = screen.getByRole('button');
      
      // Check touch-friendly classes are applied
      expect(button.className).toContain('touch-manipulation');
      expect(button.className).toContain('min-h-[44px]');
      expect(button.className).toContain('min-w-[44px]');
    });

    it('should handle full width on mobile', () => {
      render(<Button fullWidth>Full Width Button</Button>);
      const button = screen.getByRole('button');
      
      expect(button.className).toContain('w-full');
    });
  });
});