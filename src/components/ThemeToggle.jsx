import React from 'react';
import { Sun, Moon } from 'lucide-react';
import useTheme from '@/hooks/useTheme';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle color theme"
      className={`
        p-2 rounded-lg transition-colors duration-150
        text-gray-500 hover:text-gray-900 hover:bg-gray-100
        dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-surface-dark-tertiary
        focus:outline-none focus:ring-2 focus:ring-brand-navy dark:focus:ring-blue-400
        ${className}
      `}
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-amber-400 transition-transform duration-200 hover:rotate-45" />
      ) : (
        <Moon className="w-5 h-5 text-brand-navy transition-transform duration-200 hover:-rotate-12" />
      )}
    </button>
  );
}
