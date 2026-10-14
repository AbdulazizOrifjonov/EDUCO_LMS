import React from 'react';
import { FolderOpen } from 'lucide-react';
import Button from './Button';

export default function EmptyState({
  icon: Icon = FolderOpen,
  title = 'No items found',
  description = 'There are no items to display at this time.',
  actionText,
  onAction,
  actionIcon,
  actionVariant = 'primary',
  className = '',
}) {
  return (
    <div
      className={`
        flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-xl border border-dashed
        border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-surface-dark-secondary/40
        ${className}
      `}
    >
      <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-surface-dark-tertiary flex items-center justify-center text-brand-navy dark:text-blue-400 mb-3.5 shadow-sm">
        <Icon className="w-6 h-6" />
      </div>

      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
        {title}
      </h3>

      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mb-5">
          {description}
        </p>
      )}

      {actionText && onAction && (
        <Button
          onClick={onAction}
          variant={actionVariant}
          icon={actionIcon}
          size="sm"
        >
          {actionText}
        </Button>
      )}
    </div>
  );
}
