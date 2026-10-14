import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  type = 'button',
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  onClick,
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const variants = {
    primary:
      'bg-brand-navy hover:bg-brand-navy-light text-white focus:ring-brand-navy dark:focus:ring-offset-surface-dark shadow-sm',
    danger:
      'bg-brand-red hover:bg-brand-red-dark text-white focus:ring-brand-red dark:focus:ring-offset-surface-dark shadow-sm',
    secondary:
      'bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-surface-dark-tertiary dark:hover:bg-gray-700 dark:text-gray-200 focus:ring-gray-400',
    ghost:
      'bg-transparent hover:bg-gray-100 dark:hover:bg-surface-dark-tertiary text-gray-700 dark:text-gray-300 focus:ring-gray-400',
    outline:
      'border border-gray-300 dark:border-gray-600 bg-transparent hover:bg-gray-50 dark:hover:bg-surface-dark-secondary text-gray-700 dark:text-gray-200 focus:ring-brand-navy',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5 min-h-[32px]',
    md: 'text-sm px-4 py-2 gap-2 min-h-[40px]',
    lg: 'text-base px-5 py-2.5 gap-2.5 min-h-[46px]',
  };

  const isActuallyDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      disabled={isActuallyDisabled}
      onClick={onClick}
      className={`
        ${baseStyles}
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {isLoading && (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      )}
      {!isLoading && Icon && iconPosition === 'left' && (
        <Icon className="w-4 h-4 shrink-0" />
      )}
      <span>{children}</span>
      {!isLoading && Icon && iconPosition === 'right' && (
        <Icon className="w-4 h-4 shrink-0" />
      )}
    </button>
  );
}
