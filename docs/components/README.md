# Component Documentation

This directory contains comprehensive documentation for all AdvisorBoard components, including usage examples, props interfaces, and best practices.

## Component Categories

### Common Components
- [Button](./common/Button.md) - Reusable button component with theme integration
- [Card](./common/Card.md) - Flexible card container with theme support
- [ThemeProvider](./common/ThemeProvider.md) - Theme context provider for domain-specific styling
- [ErrorBoundary](./common/ErrorBoundary.md) - Error boundary for graceful error handling
- [LoadingSkeleton](./common/LoadingSkeleton.md) - Loading state components

### Landing Components
- [LandingPage](./landing/LandingPage.md) - Main landing page with domain selection
- [DomainCard](./landing/DomainCard.md) - Individual domain selection cards

### Advisor Components
- [AdvisorSelectionPanel](./advisors/AdvisorSelectionPanel.md) - Advisor selection interface
- [AdvisorCard](./advisors/AdvisorCard.md) - Individual advisor display cards
- [AdvisorAvatar](./advisors/AdvisorAvatar.md) - Advisor profile images
- [MultiDomainAdvisorPanel](./advisors/MultiDomainAdvisorPanel.md) - Multi-domain advisor selection

### Consultation Components
- [ConsultationInterface](./consultation/ConsultationInterface.md) - Main consultation interface
- [PromptInput](./consultation/PromptInput.md) - User prompt input component
- [ResponsePanel](./consultation/ResponsePanel.md) - Advisor response display
- [ResponseThread](./consultation/ResponseThread.md) - Threaded conversation view
- [SummaryDisplay](./consultation/SummaryDisplay.md) - Response summary component

### Session Components
- [SessionManager](./session/SessionManager.md) - Session state management
- [ExportOptions](./session/ExportOptions.md) - Session export functionality

## Usage Guidelines

### Theme Integration
All components support the domain-specific theming system:

```tsx
import { useTheme } from '@/hooks/useTheme';

const MyComponent = () => {
  const { currentTheme, isDarkMode } = useTheme();
  
  return (
    <div className={`theme-${currentTheme} ${isDarkMode ? 'dark' : ''}`}>
      {/* Component content */}
    </div>
  );
};
```

### Error Handling
Wrap components in error boundaries for graceful error handling:

```tsx
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

<ErrorBoundary fallback={<div>Something went wrong</div>}>
  <MyComponent />
</ErrorBoundary>
```

### Accessibility
All components follow accessibility best practices:
- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance

### Testing
Each component includes comprehensive tests:
- Unit tests for component logic
- Integration tests for component interactions
- Accessibility tests
- Visual regression tests

## Development Guidelines

### Component Structure
```
ComponentName/
├── ComponentName.tsx          # Main component
├── ComponentName.module.css   # Component-specific styles (if needed)
├── __tests__/
│   ├── ComponentName.test.tsx           # Unit tests
│   ├── ComponentName.integration.test.tsx # Integration tests
│   └── ComponentName.accessibility.test.tsx # Accessibility tests
└── index.ts                   # Export file
```

### Props Interface
Always define clear TypeScript interfaces for props:

```tsx
interface ComponentProps {
  /** Required prop description */
  requiredProp: string;
  /** Optional prop description */
  optionalProp?: number;
  /** Callback prop description */
  onAction: (value: string) => void;
}
```

### Documentation Standards
- Include JSDoc comments for all props
- Provide usage examples
- Document accessibility features
- Include performance considerations
- List related components