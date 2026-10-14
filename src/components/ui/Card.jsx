import React from 'react';

export default function Card({
  children,
  className = '',
  title,
  subtitle,
  headerAction,
  footer,
  variant = 'default',
  noPadding = false,
  onClick,
  ...props
}) {
  const variants = {
    default:
      'bg-white dark:bg-surface-dark-secondary border border-gray-100 dark:border-gray-800 shadow-card',
    outlined:
      'bg-white dark:bg-surface-dark-secondary border border-gray-200 dark:border-gray-700',
    elevated:
      'bg-white dark:bg-surface-dark-secondary shadow-card-hover border border-gray-100 dark:border-gray-800',
    flat:
      'bg-gray-50 dark:bg-surface-dark-tertiary border-0',
  };

  const hasHeader = title || subtitle || headerAction;

  return (
    <div
      onClick={onClick}
      className={`
        rounded-xl overflow-hidden transition-all duration-150
        ${variants[variant] || variants.default}
        ${onClick ? 'cursor-pointer hover:shadow-card-hover hover:border-gray-300 dark:hover:border-gray-600' : ''}
        ${className}
      `}
      {...props}
    >
      {hasHeader && (
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div>
            {title && (
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && <div className="ml-4 shrink-0">{headerAction}</div>}
        </div>
      )}

      <div className={noPadding ? '' : 'p-5'}>{children}</div>

      {footer && (
        <div className="px-5 py-3 bg-gray-50 dark:bg-surface-dark-tertiary border-t border-gray-100 dark:border-gray-800">
          {footer}
        </div>
      )}
    </div>
  );
}
