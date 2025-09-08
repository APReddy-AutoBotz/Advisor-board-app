/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    // Override default breakpoints with exact specs
    screens: {
      'sm': '640px',
      'md': '768px', 
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1440px',
    },
    // Override default container
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1rem',
        lg: '1rem',
        xl: '1rem',
        '2xl': '1rem',
      },
      screens: {
        sm: '100%',
        md: '688px',
        lg: '1200px',
        xl: '1200px',
        '2xl': '1200px',
      },
    },
    extend: {
      // Premium Design System Colors
      colors: {
        // Ink Neutrals (exact specs)
        ink: {
          900: '#0B0E14',
          700: '#1F2937', 
          600: '#374151',
          400: '#9CA3AF',
          200: '#E5E7EB',
          100: '#F3F4F6',
        },
        paper: '#FFFFFF',
        
        // BoardTheme Gradients & Accents (exact specs)
        clinical: {
          from: '#3B82F6',
          to: '#1E40AF', 
          accent: '#2563EB',
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          800: '#1e40af',
        },
        product: {
          from: '#FCD34D',
          to: '#F59E0B',
          accent: '#D97706',
          50: '#fffbeb',
          100: '#fde68a',
          500: '#fcd34d',
          600: '#d97706',
          400: '#f59e0b',
        },
        education: {
          from: '#8B5CF6',
          to: '#F59E0B',
          accent: '#A855F7',
          50: '#f5f3ff',
          100: '#ede9fe',
          500: '#8b5cf6',
          600: '#a855f7',
          400: '#f59e0b',
        },
        remedy: {
          from: '#10B981',
          to: '#14B8A6',
          accent: '#059669',
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669',
          400: '#14b8a6',
        },
      },
      
      // Typography (Inter/DM Sans with exact scales)
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['DM Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Display: 64/68
        'display': ['4rem', { lineHeight: '4.25rem', letterSpacing: '-0.02em' }],
        // H1: 48/56  
        'h1': ['3rem', { lineHeight: '3.5rem', letterSpacing: '-0.02em' }],
        // H2: 32/40
        'h2': ['2rem', { lineHeight: '2.5rem', letterSpacing: '-0.01em' }],
        // H3: 20/28
        'h3': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        // Body: 16/24
        'body': ['1rem', { lineHeight: '1.5rem' }],
        // Small: 14/20
        'small': ['0.875rem', { lineHeight: '1.25rem' }],
      },
      
      // 4-point Spacing Scale (exact specs)
      spacing: {
        '0.5': '0.125rem',  // 2px
        '1': '0.25rem',     // 4px
        '2': '0.5rem',      // 8px
        '3': '0.75rem',     // 12px
        '4': '1rem',        // 16px
        '5': '1.25rem',     // 20px
        '6': '1.5rem',      // 24px
        '8': '2rem',        // 32px
        '10': '2.5rem',     // 40px
        '12': '3rem',       // 48px
        '14': '3.5rem',     // 56px
        '16': '4rem',       // 64px
        '20': '5rem',       // 80px
        '24': '6rem',       // 96px
        '30': '7.5rem',     // 120px
      },
      
      // Border Radius (exact specs)
      borderRadius: {
        'sm': '0.5rem',     // 8px
        'DEFAULT': '0.75rem', // 12px
        'md': '1rem',       // 16px
        'lg': '1.5rem',     // 24px
        'xl': '2rem',       // 32px
      },
      
      // Shadows (exact specs)
      boxShadow: {
        'card': '0 8px 24px rgba(0, 0, 0, 0.08)',
        'hover': '0 10px 28px rgba(0, 0, 0, 0.12)',
        'focus': '0 0 0 3px rgba(59, 130, 246, 0.1)',
      },
      
      // Motion (exact specs)
      transitionDuration: {
        'enter': '160ms',
        'hover': '120ms', 
        'dialog': '200ms',
      },
      transitionTimingFunction: {
        'premium': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
      
      // Animation enhancements
      animation: {
        'fade-in': 'fadeIn 160ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        'slide-up': 'slideUp 160ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        'scale-in': 'scaleIn 120ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        'grain': 'grain 8s steps(10) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        grain: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '10%': { transform: 'translate(-5%, -5%)' },
          '20%': { transform: 'translate(-10%, 5%)' },
          '30%': { transform: 'translate(5%, -10%)' },
          '40%': { transform: 'translate(-5%, 15%)' },
          '50%': { transform: 'translate(-10%, 5%)' },
          '60%': { transform: 'translate(15%, 0%)' },
          '70%': { transform: 'translate(0%, 15%)' },
          '80%': { transform: 'translate(-15%, 10%)' },
          '90%': { transform: 'translate(10%, 5%)' },
        },
      },
      
      // Background patterns for grain overlay
      backgroundImage: {
        'grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
}

