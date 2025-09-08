# AdvisorBoard Setup Guide

This guide provides detailed setup instructions for developers working on the AdvisorBoard application.

## 🛠️ Development Environment Setup

### System Requirements

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher (comes with Node.js)
- **Git**: For version control
- **VS Code**: Recommended IDE with extensions

### Recommended VS Code Extensions

Install these extensions for the best development experience:

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "ms-vscode.test-adapter-converter",
    "hbenl.vscode-test-explorer",
    "streetsidesoftware.code-spell-checker"
  ]
}
```

### Initial Setup

1. **Clone the repository**:
```bash
git clone <repository-url>
cd advisor-board-app
```

2. **Install dependencies**:
```bash
npm install
```

3. **Verify installation**:
```bash
npm run test -- --run
npm run build
```

4. **Start development server**:
```bash
npm run dev
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000
VITE_API_TIMEOUT=10000

# Feature Flags
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_ENABLE_DEBUG_MODE=false
VITE_ENABLE_MOCK_DATA=true

# Analytics (optional)
VITE_ANALYTICS_ID=your-analytics-id

# Kiro Integration
VITE_KIRO_ENDPOINT=http://localhost:8080
VITE_KIRO_API_KEY=your-kiro-api-key
```

### TypeScript Configuration

The project uses multiple TypeScript configurations:

- `tsconfig.json` - Base configuration
- `tsconfig.app.json` - Application code
- `tsconfig.node.json` - Node.js/Vite configuration
- `tsconfig.test.json` - Test files

### Tailwind CSS Configuration

Customize the theme in `tailwind.config.js`:

```javascript
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Cliniboard theme (blue)
        'clini-primary': '#2563eb',
        'clini-secondary': '#dbeafe',
        
        // EduBoard theme (orange)
        'edu-primary': '#ea580c',
        'edu-secondary': '#fed7aa',
        
        // RemediBoard theme (green)
        'remedi-primary': '#16a34a',
        'remedi-secondary': '#dcfce7',
      }
    }
  }
}
```

## 📁 Project Structure Deep Dive

### Source Code Organization

```
src/
├── components/              # React components
│   ├── common/             # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── ThemeProvider.tsx
│   │   └── __tests__/
│   ├── landing/            # Landing page components
│   ├── advisors/           # Advisor selection components
│   ├── consultation/       # Consultation interface
│   └── session/            # Session management
├── hooks/                  # Custom React hooks
│   ├── useTheme.ts
│   ├── useAdvisorPersonas.ts
│   └── useSessionState.ts
├── services/               # Business logic and API calls
│   ├── yamlConfigLoader.ts
│   ├── advisorService.ts
│   └── exportService.ts
├── types/                  # TypeScript type definitions
│   ├── advisor.ts
│   ├── domain.ts
│   └── session.ts
├── utils/                  # Utility functions
│   ├── themeUtils.ts
│   ├── errorHandling.ts
│   └── performanceMonitoring.ts
└── test/                   # Test utilities and setup
    ├── setup.ts
    ├── utils.tsx
    ├── e2e/
    ├── integration/
    └── performance/
```

### Configuration Files

```
├── .env                    # Environment variables
├── .env.example           # Environment template
├── .gitignore             # Git ignore rules
├── .eslintrc.js           # ESLint configuration
├── .prettierrc            # Prettier configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── vite.config.ts         # Vite build configuration
├── vitest.config.ts       # Vitest test configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies and scripts
```

## 🧪 Testing Setup

### Test Environment Configuration

The project uses Vitest with jsdom for testing React components:

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*'
      ]
    }
  }
});
```

### Running Different Test Types

```bash
# Unit tests
npm run test

# Integration tests
npm run test -- integration

# E2E tests
npm run test -- e2e

# Performance tests
npm run test -- performance

# Accessibility tests
npm run test -- accessibility

# Visual regression tests
npm run test -- visual

# Coverage report
npm run test:coverage
```

### Test Data Setup

Create mock data for consistent testing:

```typescript
// src/test/mockData.ts
export const mockDomains = [
  {
    id: 'cliniboard',
    name: 'Cliniboard',
    description: 'Clinical trials expertise',
    advisors: [
      {
        id: 'advisor-1',
        name: 'Dr. Sarah Chen',
        expertise: 'Clinical Research',
        background: 'Leading clinical researcher'
      }
    ]
  }
];
```

## 🎨 Styling and Theming

### Theme System Architecture

The application uses a context-based theming system:

```typescript
// Theme context structure
interface ThemeContext {
  currentTheme: 'cliniboard' | 'eduboard' | 'remediboard';
  isDarkMode: boolean;
  setTheme: (theme: string) => void;
  toggleDarkMode: () => void;
}
```

### Adding New Themes

1. **Define theme colors in Tailwind config**:
```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      'newtheme-primary': '#your-color',
      'newtheme-secondary': '#your-color'
    }
  }
}
```

2. **Add theme to TypeScript types**:
```typescript
// src/types/theme.ts
export type ThemeId = 'cliniboard' | 'eduboard' | 'remediboard' | 'newtheme';
```

3. **Update theme provider**:
```typescript
// src/components/common/ThemeProvider.tsx
const themes = {
  newtheme: {
    primary: 'newtheme-primary',
    secondary: 'newtheme-secondary'
  }
};
```

### CSS Custom Properties

The theme system uses CSS custom properties for dynamic theming:

```css
:root {
  --color-primary: theme('colors.clini.primary');
  --color-secondary: theme('colors.clini.secondary');
}

[data-theme="eduboard"] {
  --color-primary: theme('colors.edu.primary');
  --color-secondary: theme('colors.edu.secondary');
}
```

## 🔌 API Integration

### Service Layer Architecture

Services handle all external API calls and business logic:

```typescript
// src/services/advisorService.ts
export class AdvisorService {
  private baseUrl: string;
  
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }
  
  async generateAdvisorResponse(
    advisor: Advisor, 
    prompt: string, 
    domain: Domain
  ): Promise<AdvisorResponse> {
    // Implementation
  }
}
```

### Mock Data for Development

Use mock services during development:

```typescript
// src/services/mockAdvisorService.ts
export const mockAdvisorService = {
  generateAdvisorResponse: async (advisor, prompt, domain) => {
    // Return mock response
    return {
      advisorId: advisor.id,
      content: `Mock response from ${advisor.name}`,
      timestamp: new Date(),
      persona: advisor
    };
  }
};
```

### Error Handling

Implement consistent error handling across services:

```typescript
// src/utils/errorHandling.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public endpoint: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const handleApiError = (error: unknown, endpoint: string) => {
  if (error instanceof ApiError) {
    console.error(`API Error at ${endpoint}:`, error.message);
  } else {
    console.error(`Unexpected error at ${endpoint}:`, error);
  }
};
```

## 🚀 Performance Optimization

### Bundle Analysis

Analyze bundle size and optimize imports:

```bash
# Install bundle analyzer
npm install --save-dev rollup-plugin-visualizer

# Add to vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html',
      open: true
    })
  ]
});

# Build and analyze
npm run build
```

### Code Splitting

Implement lazy loading for better performance:

```typescript
// Lazy load components
const LazyConsultationInterface = lazy(() => 
  import('./components/consultation/ConsultationInterface')
);

// Use with Suspense
<Suspense fallback={<LoadingSkeleton />}>
  <LazyConsultationInterface />
</Suspense>
```

### Performance Monitoring

Enable performance monitoring in development:

```typescript
// src/main.tsx
import { performanceTracker } from './utils/performanceMonitoring';

if (import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true') {
  performanceTracker.recordMemoryUsage('app-start');
}
```

## 🔒 Security Considerations

### Environment Variables

Never commit sensitive data to version control:

```bash
# .env.example (safe to commit)
VITE_API_BASE_URL=http://localhost:3000
VITE_KIRO_API_KEY=your-api-key-here

# .env (never commit)
VITE_KIRO_API_KEY=actual-secret-key
```

### Content Security Policy

Configure CSP headers for production:

```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline'; 
               style-src 'self' 'unsafe-inline';">
```

## 🐛 Debugging

### Development Tools

Enable debugging features:

```typescript
// src/utils/debug.ts
export const debug = {
  enabled: import.meta.env.VITE_ENABLE_DEBUG_MODE === 'true',
  
  log: (message: string, data?: any) => {
    if (debug.enabled) {
      console.log(`[DEBUG] ${message}`, data);
    }
  },
  
  performance: (name: string, fn: () => void) => {
    if (debug.enabled) {
      console.time(name);
      fn();
      console.timeEnd(name);
    } else {
      fn();
    }
  }
};
```

### Browser DevTools

Useful browser extensions for debugging:
- React Developer Tools
- Redux DevTools (if using Redux)
- Lighthouse for performance auditing
- axe DevTools for accessibility testing

## 📦 Deployment

### Build Optimization

Configure Vite for production builds:

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@headlessui/react', '@heroicons/react']
        }
      }
    },
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
});
```

### Docker Setup

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### CI/CD Pipeline

Example GitHub Actions workflow:

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run lint
      - run: npm run test -- --run
      - run: npm run build
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## 🤝 Contributing

### Development Workflow

1. **Create feature branch**:
```bash
git checkout -b feature/advisor-improvements
```

2. **Make changes and test**:
```bash
npm run test
npm run lint
```

3. **Commit with conventional commits**:
```bash
git commit -m "feat(advisors): add new advisor selection filters"
```

4. **Push and create PR**:
```bash
git push origin feature/advisor-improvements
```

### Code Review Checklist

- [ ] All tests pass
- [ ] Code follows TypeScript best practices
- [ ] Components have proper accessibility attributes
- [ ] Performance impact is minimal
- [ ] Documentation is updated
- [ ] No console errors or warnings

This setup guide should get you up and running with AdvisorBoard development. For specific component documentation, see the `docs/components/` directory.