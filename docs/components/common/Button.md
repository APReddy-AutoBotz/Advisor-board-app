# Button Component

A reusable button component with theme integration, accessibility features, and multiple variants.

## Props Interface

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant style */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Loading state */
  isLoading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Icon to display before text */
  leftIcon?: React.ReactNode;
  /** Icon to display after text */
  rightIcon?: React.ReactNode;
  /** Full width button */
  fullWidth?: boolean;
  /** Button children */
  children: React.ReactNode;
}
```

## Usage Examples

### Basic Button
```tsx
import { Button } from '@/components/common/Button';

<Button onClick={() => console.log('clicked')}>
  Click Me
</Button>
```

### Button Variants
```tsx
<Button variant="primary">Primary Button</Button>
<Button variant="secondary">Secondary Button</Button>
<Button variant="outline">Outline Button</Button>
<Button variant="ghost">Ghost Button</Button>
```

### Button Sizes
```tsx
<Button size="sm">Small Button</Button>
<Button size="md">Medium Button</Button>
<Button size="lg">Large Button</Button>
```

### Loading State
```tsx
<Button isLoading>
  Loading...
</Button>
```

### With Icons
```tsx
import { ChevronRightIcon, DownloadIcon } from '@heroicons/react/24/outline';

<Button leftIcon={<DownloadIcon />}>
  Download
</Button>

<Button rightIcon={<ChevronRightIcon />}>
  Next
</Button>
```

### Full Width
```tsx
<Button fullWidth>
  Full Width Button
</Button>
```

## Theme Integration

The Button component automatically applies theme-specific colors based on the current domain:

- **Cliniboard**: Blue color scheme
- **EduBoard**: Orange color scheme  
- **RemediBoard**: Green color scheme

```tsx
// Theme is automatically applied based on ThemeProvider context
<ThemeProvider domain="cliniboard">
  <Button variant="primary">Blue themed button</Button>
</ThemeProvider>
```

## Accessibility Features

- **Keyboard Navigation**: Full keyboard support with focus management
- **Screen Reader**: Proper ARIA labels and roles
- **Loading State**: Announces loading state to screen readers
- **Disabled State**: Properly communicated to assistive technologies

```tsx
<Button 
  aria-label="Submit form"
  disabled={isSubmitting}
  isLoading={isSubmitting}
>
  {isSubmitting ? 'Submitting...' : 'Submit'}
</Button>
```

## Styling

The Button component uses Tailwind CSS classes with CSS custom properties for theming:

```css
.btn-primary {
  @apply bg-primary text-primary-foreground hover:bg-primary/90;
}

.btn-secondary {
  @apply bg-secondary text-secondary-foreground hover:bg-secondary/80;
}
```

## Testing

The Button component includes comprehensive tests:

```tsx
// Unit tests
describe('Button Component', () => {
  it('renders with correct variant classes', () => {
    render(<Button variant="primary">Test</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-primary');
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Test</Button>);
    
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## Performance Considerations

- Uses `React.memo` for optimization when props don't change
- Icon components are lazy-loaded when needed
- CSS classes are optimized for minimal bundle size

## Related Components

- [Card](./Card.md) - Often used together for action cards
- [LoadingSkeleton](./LoadingSkeleton.md) - For loading states
- [ThemeProvider](./ThemeProvider.md) - For theme context