import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

const Select = forwardRef(function Select(
  {
    label,
    options = [],
    value,
    onChange,
    placeholder = 'Select an option',
    error,
    helperText,
    disabled = false,
    required = false,
    className = '',
    selectClassName = '',
    id,
    ...props
  },
  ref
) {
  const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300"
        >
          {label}
          {required && <span className="text-brand-red ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`
            w-full appearance-none rounded-lg border bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 text-sm
            pl-3.5 pr-10 rtl:pl-10 rtl:pr-3.5 py-2 transition-colors duration-150
            focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-surface-dark
            disabled:bg-gray-100 dark:disabled:bg-surface-dark-tertiary disabled:cursor-not-allowed disabled:text-gray-400
            ${
              error
                ? 'border-brand-red focus:border-brand-red focus:ring-brand-red'
                : 'border-gray-300 dark:border-gray-600 focus:border-brand-navy focus:ring-brand-navy dark:focus:border-blue-500 dark:focus:ring-blue-500'
            }
            ${selectClassName}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => {
            const optVal = typeof opt === 'object' ? opt.value : opt;
            const optLabel = typeof opt === 'object' ? opt.label : opt;
            return (
              <option key={optVal} value={optVal}>
                {optLabel}
              </option>
            );
          })}
        </select>

        <div className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 pr-3 rtl:pr-0 rtl:pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {error ? (
        <p className="text-xs text-brand-red dark:text-red-400 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Select;
