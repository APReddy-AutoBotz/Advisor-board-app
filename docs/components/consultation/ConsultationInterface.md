# ConsultationInterface Component

The main consultation interface that manages the conversation between users and selected AI advisors.

## Props Interface

```typescript
interface ConsultationInterfaceProps {
  /** Selected advisors for the consultation */
  selectedAdvisors: Advisor[];
  /** Current domain context */
  domain: Domain;
  /** Optional session ID for persistence */
  sessionId?: string;
  /** Callback when consultation is complete */
  onComplete?: (session: ConsultationSession) => void;
  /** Callback for navigation back */
  onBack?: () => void;
}

interface Advisor {
  id: string;
  name: string;
  expertise: string;
  background: string;
  domain: Domain['id'];
  isSelected: boolean;
}

interface Domain {
  id: 'cliniboard' | 'eduboard' | 'remediboard';
  name: string;
  description: string;
  theme: ThemeConfig;
  advisors: Advisor[];
}
```

## Usage Examples

### Basic Consultation
```tsx
import { ConsultationInterface } from '@/components/consultation/ConsultationInterface';

const selectedAdvisors = [
  {
    id: 'advisor-1',
    name: 'Dr. Sarah Chen',
    expertise: 'Clinical Research',
    background: 'Leading clinical researcher with 15+ years experience',
    domain: 'cliniboard',
    isSelected: true
  }
];

const domain = {
  id: 'cliniboard',
  name: 'Cliniboard',
  description: 'Clinical trials expertise',
  theme: { primary: 'blue' },
  advisors: selectedAdvisors
};

<ConsultationInterface 
  selectedAdvisors={selectedAdvisors}
  domain={domain}
  onComplete={(session) => console.log('Session complete:', session)}
/>
```

### With Session Persistence
```tsx
<ConsultationInterface 
  selectedAdvisors={selectedAdvisors}
  domain={domain}
  sessionId="session-123"
  onComplete={handleSessionComplete}
  onBack={handleNavigateBack}
/>
```

## Features

### Prompt Input
- Multi-line text input with validation
- Character count and limits
- Auto-resize functionality
- Submit on Ctrl/Cmd + Enter

### Response Management
- Real-time streaming responses from AI advisors
- Individual response panels for each advisor
- Response threading and conversation history
- Loading states and error handling

### Summary Generation
- Automatic summary of all advisor responses
- Manual summary generation on demand
- Summary export capabilities

### Session State
- Automatic session persistence
- Recovery from browser refresh
- Session metadata tracking

## Component Structure

```tsx
const ConsultationInterface = ({ selectedAdvisors, domain, sessionId, onComplete, onBack }) => {
  return (
    <div className="consultation-interface">
      {/* Header with advisor info and navigation */}
      <ConsultationHeader 
        advisors={selectedAdvisors}
        domain={domain}
        onBack={onBack}
      />
      
      {/* Main consultation area */}
      <div className="consultation-content">
        {/* Prompt input */}
        <PromptInput 
          onSubmit={handlePromptSubmit}
          isLoading={isGeneratingResponses}
        />
        
        {/* Response display */}
        <ResponsePanel 
          responses={responses}
          advisors={selectedAdvisors}
          isLoading={isGeneratingResponses}
        />
        
        {/* Summary section */}
        {responses.length > 0 && (
          <SummaryDisplay 
            responses={responses}
            onGenerateSummary={handleGenerateSummary}
          />
        )}
      </div>
      
      {/* Session actions */}
      <SessionActions 
        session={currentSession}
        onExport={handleExport}
        onSave={handleSave}
      />
    </div>
  );
};
```

## State Management

The component uses the `useConsultationState` hook for state management:

```tsx
const {
  responses,
  isLoading,
  error,
  submitPrompt,
  generateSummary,
  clearSession
} = useConsultationState({
  advisors: selectedAdvisors,
  domain,
  sessionId
});
```

## AI Integration

Integrates with the advisor service for AI responses:

```tsx
const handlePromptSubmit = async (prompt: string) => {
  try {
    setIsLoading(true);
    
    // Generate responses from all selected advisors
    const responses = await Promise.all(
      selectedAdvisors.map(advisor => 
        advisorService.generateAdvisorResponse(advisor, prompt, domain)
      )
    );
    
    setResponses(responses);
  } catch (error) {
    setError('Failed to generate responses');
  } finally {
    setIsLoading(false);
  }
};
```

## Accessibility Features

- **Keyboard Navigation**: Full keyboard support for all interactions
- **Screen Reader**: Proper ARIA labels and live regions for dynamic content
- **Focus Management**: Logical focus flow through the interface
- **Loading States**: Announced to screen readers
- **Error Messages**: Accessible error communication

```tsx
<div 
  role="main"
  aria-label="Consultation interface"
  aria-live="polite"
  aria-busy={isLoading}
>
  {/* Interface content */}
</div>
```

## Performance Optimizations

- **Lazy Loading**: Response components are lazy-loaded
- **Memoization**: Expensive calculations are memoized
- **Virtual Scrolling**: For long conversation histories
- **Debounced Input**: Prompt input is debounced to prevent excessive API calls

```tsx
const memoizedResponses = useMemo(() => 
  responses.map(response => ({
    ...response,
    formattedContent: formatResponse(response.content)
  })), 
  [responses]
);
```

## Error Handling

Comprehensive error handling for various failure scenarios:

```tsx
const ErrorDisplay = ({ error, onRetry }) => (
  <div className="error-container" role="alert">
    <h3>Something went wrong</h3>
    <p>{error.message}</p>
    <Button onClick={onRetry}>Try Again</Button>
  </div>
);
```

## Testing

### Unit Tests
```tsx
describe('ConsultationInterface', () => {
  it('renders with selected advisors', () => {
    render(
      <ConsultationInterface 
        selectedAdvisors={mockAdvisors}
        domain={mockDomain}
      />
    );
    
    expect(screen.getByText('Dr. Sarah Chen')).toBeInTheDocument();
  });
  
  it('submits prompts and displays responses', async () => {
    const user = userEvent.setup();
    
    render(
      <ConsultationInterface 
        selectedAdvisors={mockAdvisors}
        domain={mockDomain}
      />
    );
    
    const input = screen.getByPlaceholderText('Enter your question...');
    await user.type(input, 'Test question');
    
    const submitButton = screen.getByText('Submit Question');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Mock advisor response')).toBeInTheDocument();
    });
  });
});
```

### Integration Tests
- Cross-component data flow
- Session persistence
- Export functionality
- Multi-advisor coordination

## Related Components

- [PromptInput](./PromptInput.md) - User input component
- [ResponsePanel](./ResponsePanel.md) - Response display
- [SummaryDisplay](./SummaryDisplay.md) - Summary generation
- [SessionManager](../session/SessionManager.md) - Session management