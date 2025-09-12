import { useTheme } from './ThemeProvider';
import Button from './Button';

interface DarkModeToggleProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export default function DarkModeToggle({ 
  size = 'md', 
  showLabel = false, 
  className = '' 
}: DarkModeToggleProps) {
  const { isDarkMode, toggleDarkMode } = useTheme();

  const SunIcon = () => (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );

  const MoonIcon = () => (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  );

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={toggleDarkMode}
      className={`${className} relative`}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="relative flex items-center">
        {/* Icon container with transition */}
        <div className="relative w-4 h-4">
          <div
            className={`absolute inset-0 transform transition-all duration-300 ${
              isDarkMode ? 'rotate-0 opacity-100' : 'rotate-90 opacity-0'
            }`}
          >
            <MoonIcon />
          </div>
          <div
            className={`absolute inset-0 transform transition-all duration-300 ${
              isDarkMode ? '-rotate-90 opacity-0' : 'rotate-0 opacity-100'
            }`}
          >
            <SunIcon />
          </div>
        </div>
        
        {showLabel && (
          <span className="ml-2 text-sm">
            {isDarkMode ? 'Dark' : 'Light'}
          </span>
        )}
      </div>
    </Button>
  );
}
