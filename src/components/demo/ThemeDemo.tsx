import { useTheme } from '../common/ThemeProvider';
import Button from '../common/Button';
import Card from '../common/Card';
import DarkModeToggle from '../common/DarkModeToggle';
import type { DomainId } from '../../types';

export default function ThemeDemo() {
  const { currentDomain, setCurrentDomain, isDarkMode } = useTheme();

  const domains: { id: DomainId; name: string; description: string }[] = [
    { id: 'cliniboard', name: 'Cliniboard', description: 'Clinical research & regulatory guidance' },
    { id: 'eduboard', name: 'EduBoard', description: 'Education systems & curriculum reform' },
    { id: 'remediboard', name: 'RemediBoard', description: 'Natural & traditional medicine' },
  ];

  return (
    <div className="p-6 space-y-8">
      {/* Header with Dark Mode Toggle */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Theme System Demo</h2>
        <DarkModeToggle showLabel />
      </div>

      {/* Domain Selection */}
      <Card header={<h3 className="text-lg font-semibold">Domain Selection</h3>}>
        <div className="space-y-4">
          <p className="text-sm opacity-75">
            Select a domain to see theme changes. Current: {currentDomain || 'None'}
          </p>
          
          <div className="flex flex-wrap gap-3">
            <Button
              variant={currentDomain === null ? 'primary' : 'outline'}
              onClick={() => setCurrentDomain(null)}
            >
              Neutral Theme
            </Button>
            
            {domains.map((domain) => (
              <Button
                key={domain.id}
                variant={currentDomain === domain.id ? 'primary' : 'outline'}
                onClick={() => setCurrentDomain(domain.id)}
              >
                {domain.name}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Button Variants */}
      <Card header={<h3 className="text-lg font-semibold">Button Variants</h3>}>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="accent">Accent</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button size="xl">Extra Large</Button>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button isLoading>Loading</Button>
            <Button disabled>Disabled</Button>
            <Button 
              leftIcon={<span>🚀</span>}
              rightIcon={<span>→</span>}
            >
              With Icons
            </Button>
          </div>
        </div>
      </Card>

      {/* Card Variants */}
      <Card header={<h3 className="text-lg font-semibold">Card Variants</h3>}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card variant="default" padding="sm">
            <h4 className="font-medium mb-2">Default Card</h4>
            <p className="text-sm opacity-75">Standard card styling</p>
          </Card>
          
          <Card variant="elevated" padding="sm">
            <h4 className="font-medium mb-2">Elevated Card</h4>
            <p className="text-sm opacity-75">Enhanced shadow</p>
          </Card>
          
          <Card variant="outlined" padding="sm">
            <h4 className="font-medium mb-2">Outlined Card</h4>
            <p className="text-sm opacity-75">Border emphasis</p>
          </Card>
          
          <Card variant="filled" padding="sm">
            <h4 className="font-medium mb-2">Filled Card</h4>
            <p className="text-sm opacity-75">Background filled</p>
          </Card>
        </div>
      </Card>

      {/* Interactive Cards */}
      <Card header={<h3 className="text-lg font-semibold">Interactive Cards</h3>}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card 
            interactive 
            padding="md"
            onClick={() => alert('Card clicked!')}
          >
            <h4 className="font-medium mb-2">Interactive Card</h4>
            <p className="text-sm opacity-75">Click me! Scales on interaction</p>
          </Card>
          
          <Card hover padding="md">
            <h4 className="font-medium mb-2">Hover Card</h4>
            <p className="text-sm opacity-75">Hover for shadow effect</p>
          </Card>
          
          <Card 
            header={<span className="text-sm font-medium">Card Header</span>}
            footer={<span className="text-xs opacity-75">Card Footer</span>}
            padding="md"
          >
            <h4 className="font-medium mb-2">Header & Footer</h4>
            <p className="text-sm opacity-75">Card with header and footer sections</p>
          </Card>
        </div>
      </Card>

      {/* Domain-Specific Showcase */}
      {currentDomain && (
        <Card header={<h3 className="text-lg font-semibold">Domain-Specific Styling</h3>}>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-opacity-10" 
                 style={{ backgroundColor: 'var(--color-domain-primary)' }}>
              <h4 className="font-medium mb-2">Domain Colors in Action</h4>
              <p className="text-sm opacity-75 mb-3">
                This section uses CSS custom properties set by the theme system.
              </p>
              
              <div className="flex flex-wrap gap-2">
                <div className="px-3 py-1 rounded text-xs font-medium"
                     style={{ 
                       backgroundColor: 'var(--color-domain-secondary)',
                       color: 'var(--color-domain-text)'
                     }}>
                  Secondary Color
                </div>
                <div className="px-3 py-1 rounded text-xs font-medium text-white"
                     style={{ backgroundColor: 'var(--color-domain-accent)' }}>
                  Accent Color
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Theme Information */}
      <Card header={<h3 className="text-lg font-semibold">Theme Information</h3>}>
        <div className="space-y-2 text-sm">
          <div><strong>Current Domain:</strong> {currentDomain || 'None'}</div>
          <div><strong>Dark Mode:</strong> {isDarkMode ? 'Enabled' : 'Disabled'}</div>
          <div><strong>Body Classes:</strong> {document.body.className || 'None'}</div>
          <div><strong>HTML Classes:</strong> {document.documentElement.className || 'None'}</div>
        </div>
      </Card>
    </div>
  );
}