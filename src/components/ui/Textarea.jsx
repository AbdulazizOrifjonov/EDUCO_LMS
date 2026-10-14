import React, { forwardRef } from 'react';

const Textarea = forwardRef(function Textarea(
  {
    label,
    error,
    helperText,
    rows = 4,
    className = '',
    textareaClassName = '',
    disabled = false,
    required = false,
    id,
    ...props
  },
  ref
) {
  const textareaId = id || (label ? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={textareaId}
          className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300"
        >
          {label}
          {required && <span className="text-brand-red ml-1">*</span>}
        </label>
      )}

      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        disabled={disabled}
        required={required}
        className={`
          w-full rounded-lg border bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 text-sm
          p-3 transition-colors duration-150 resize-y
          placeholder-gray-400 dark:placeholder-gray-500
          focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-surface-dark
          disabled:bg-gray-100 dark:disabled:bg-surface-dark-tertiary disabled:cursor-not-allowed disabled:text-gray-400
          ${
            error
              ? 'border-brand-red focus:border-brand-red focus:ring-brand-red'
              : 'border-gray-300 dark:border-gray-600 focus:border-brand-navy focus:ring-brand-navy dark:focus:border-blue-500 dark:focus:ring-blue-500'
          }
          ${textareaClassName}
        `}
        {...props}
      />

      {error ? (
        <p className="text-xs text-brand-red dark:text-red-400 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Textarea;
