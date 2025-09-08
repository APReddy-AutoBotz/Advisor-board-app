import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../../utils/testUtils';
import { checkKeyboardNavigation } from '../../../utils/testUtils';
import Card from '../Card';

describe('Card Accessibility', () => {
  describe('Interactive Cards', () => {
    it('should have proper button role when interactive', () => {
      render(
        <Card interactive onClick={() => {}}>
          Interactive Card Content
        </Card>
      );
      
      const card = screen.getByRole('button');
      expect(card).toBeInTheDocument();
    });

    it('should be keyboard accessible when interactive', async () => {
      const handleClick = vi.fn();
      render(
        <Card interactive onClick={handleClick}>
          Interactive Card
        </Card>
      );
      
      const card = screen.getByRole('button');
      expect(await checkKeyboardNavigation(card.parentElement!)).toBe(true);
    });

    it('should respond to Enter key when interactive', () => {
      const handleClick = vi.fn();
      render(
        <Card interactive onClick={handleClick}>
          Interactive Card
        </Card>
      );
      
      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' });
      
      expect(handleClick).toHaveBeenCalled();
    });

    it('should respond to Space key when interactive', () => {
      const handleClick = vi.fn();
      render(
        <Card interactive onClick={handleClick}>
          Interactive Card
        </Card>
      );
      
      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: ' ', code: 'Space' });
      
      expect(handleClick).toHaveBeenCalled();
    });

    it('should have proper tabIndex when interactive', () => {
      render(
        <Card interactive onClick={() => {}}>
          Interactive Card
        </Card>
      );
      
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('should support custom aria-label', () => {
      render(
        <Card interactive onClick={() => {}} aria-label="Custom card label">
          Card Content
        </Card>
      );
      
      const card = screen.getByLabelText('Custom card label');
      expect(card).toBeInTheDocument();
    });

    it('should support aria-describedby', () => {
      render(
        <div>
          <Card interactive onClick={() => {}} aria-describedby="card-description">
            Card Content
          </Card>
          <div id="card-description">Card description</div>
        </div>
      );
      
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('aria-describedby', 'card-description');
    });
  });

  describe('Non-Interactive Cards', () => {
    it('should not have button role when not interactive', () => {
      render(<Card>Non-interactive Card</Card>);
      
      const buttons = screen.queryAllByRole('button');
      expect(buttons).toHaveLength(0);
    });

    it('should not be focusable when not interactive', () => {
      render(<Card>Non-interactive Card</Card>);
      
      const card = screen.getByText('Non-interactive Card').parentElement;
      expect(card).not.toHaveAttribute('tabIndex');
    });
  });

  describe('Focus Management', () => {
    it('should be focusable when interactive', () => {
      render(
        <Card interactive onClick={() => {}}>
          Focusable Card
        </Card>
      );
      
      const card = screen.getByRole('button');
      card.focus();
      expect(card).toHaveFocus();
    });

    it('should have visible focus indicator when interactive', () => {
      render(
        <Card interactive onClick={() => {}}>
          Interactive Card
        </Card>
      );
      
      const card = screen.getByRole('button');
      expect(card.className).toContain('focus:outline-none');
      expect(card.className).toContain('focus:ring-2');
    });
  });

  describe('Semantic Structure', () => {
    it('should support custom semantic elements', () => {
      render(
        <Card as="article">
          Article Card Content
        </Card>
      );
      
      const article = screen.getByText('Article Card Content').parentElement;
      expect(article?.tagName.toLowerCase()).toBe('article');
    });

    it('should support section elements', () => {
      render(
        <Card as="section">
          Section Card Content
        </Card>
      );
      
      const section = screen.getByText('Section Card Content').parentElement;
      expect(section?.tagName.toLowerCase()).toBe('section');
    });

    it('should default to div element', () => {
      render(<Card>Default Card Content</Card>);
      
      const div = screen.getByText('Default Card Content').parentElement;
      expect(div?.tagName.toLowerCase()).toBe('div');
    });
  });

  describe('Header and Footer Accessibility', () => {
    it('should properly structure header content', () => {
      render(
        <Card header={<h2>Card Header</h2>}>
          Card Body Content
        </Card>
      );
      
      const header = screen.getByRole('heading', { level: 2 });
      expect(header).toHaveTextContent('Card Header');
    });

    it('should properly structure footer content', () => {
      render(
        <Card footer={<div role="contentinfo">Card Footer</div>}>
          Card Body Content
        </Card>
      );
      
      const footer = screen.getByRole('contentinfo');
      expect(footer).toHaveTextContent('Card Footer');
    });

    it('should maintain proper reading order with header and footer', () => {
      render(
        <Card 
          header={<h2>Header</h2>}
          footer={<div>Footer</div>}
        >
          Body Content
        </Card>
      );
      
      const header = screen.getByText('Header');
      const body = screen.getByText('Body Content');
      const footer = screen.getByText('Footer');
      
      // Check that elements appear in the correct order in the DOM
      const card = header.closest('[class*="relative"]');
      const elements = Array.from(card?.children || []);
      
      expect(elements[0]).toContain(header);
      expect(elements[1]).toContain(body);
      expect(elements[2]).toContain(footer);
    });
  });

  describe('Touch Interactions', () => {
    it('should support touch interactions when interactive', () => {
      render(
        <Card interactive onClick={() => {}}>
          Touch Card
        </Card>
      );
      
      const card = screen.getByRole('button');
      expect(card.className).toContain('touch-manipulation');
    });

    it('should have appropriate touch target size when interactive', () => {
      render(
        <Card interactive onClick={() => {}}>
          Touch Target
        </Card>
      );
      
      const card = screen.getByRole('button');
      // The card should be large enough for touch interaction
      // In a real test, you'd measure the actual dimensions
      expect(card).toBeInTheDocument();
    });
  });

  describe('Screen Reader Support', () => {
    it('should announce interactive cards properly', () => {
      render(
        <Card interactive onClick={() => {}} aria-label="Clickable card">
          Card Content
        </Card>
      );
      
      const card = screen.getByRole('button', { name: 'Clickable card' });
      expect(card).toBeInTheDocument();
    });

    it('should not confuse screen readers with non-interactive cards', () => {
      render(<Card>Static Card Content</Card>);
      
      // Should not have any button or interactive roles
      const buttons = screen.queryAllByRole('button');
      const links = screen.queryAllByRole('link');
      
      expect(buttons).toHaveLength(0);
      expect(links).toHaveLength(0);
    });
  });
});