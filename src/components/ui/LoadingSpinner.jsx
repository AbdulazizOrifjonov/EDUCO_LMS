import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({
  size = 'md',
  color = 'primary',
  className = '',
  text = '',
  fullPage = false,
}) {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  }[size] || 'w-6 h-6';

  const colorClasses = {
    primary: 'text-brand-navy dark:text-blue-400',
    danger: 'text-brand-red dark:text-red-400',
    white: 'text-white',
    gray: 'text-gray-400 dark:text-gray-500',
    current: 'text-current',
  }[color] || 'text-brand-navy dark:text-blue-400';

  const spinner = (
    <div className={`inline-flex flex-col items-center justify-center gap-2 ${className}`}>
      <Loader2 className={`animate-spin ${sizeClasses} ${colorClasses}`} />
      {text && (
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          {text}
        </span>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-surface-light dark:bg-surface-dark transition-colors duration-200">
        {spinner}
      </div>
    );
  }

  return spinner;
}
