import React, { forwardRef } from 'react';
import { formatUzPhone } from '@/utils/phoneFormat';

const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    icon: Icon,
    iconPosition = 'left',
    type = 'text',
    isPhone = false,
    size = 'md',
    className = '',
    inputClassName = '',
    disabled = false,
    required = false,
    id,
    value,
    defaultValue,
    onChange,
    onFocus,
    onClick,
    placeholder,
    ...props
  },
  ref
) {
  const inputId = id || (label ? `input-${String(label).toLowerCase().replace(/\s+/g, '-')}` : undefined);

  const isSearchField =
    type === 'search' ||
    (placeholder && /qidirish|search|поиск|بحث/i.test(String(placeholder)));

  const isPhoneInput =
    !disabled &&
    !isSearchField &&
    (type === 'tel' ||
      isPhone ||
      (props.name && /phone/i.test(props.name)) ||
      (placeholder && String(placeholder).trim().startsWith('+998')) ||
      (typeof label === 'string' && /telefon|phone|телефон|هاتف/i.test(label)));

  const handleChange = (e) => {
    if (isPhoneInput) {
      const formatted = formatUzPhone(e.target.value);
      e.target.value = formatted;
    }
    onChange?.(e);
  };

  const handleFocus = (e) => {
    if (isPhoneInput) {
      if (!e.target.value || !e.target.value.startsWith('+998')) {
        e.target.value = formatUzPhone(e.target.value);
      }
      const len = e.target.value.length;
      if (e.target.value === '+998 ') {
        setTimeout(() => {
          try {
            e.target.setSelectionRange(len, len);
          } catch (_) {}
        }, 0);
      }
    }
    onFocus?.(e);
  };

  const handleClick = (e) => {
    if (isPhoneInput && e.target.value === '+998 ') {
      const len = e.target.value.length;
      try {
        e.target.setSelectionRange(len, len);
      } catch (_) {}
    }
    onClick?.(e);
  };

  const resolvedValue =
    value !== undefined
      ? isPhoneInput
        ? formatUzPhone(value)
        : value
      : undefined;

  const resolvedDefaultValue =
    value === undefined
      ? isPhoneInput
        ? formatUzPhone(defaultValue)
        : defaultValue
      : undefined;

  const resolvedPlaceholder = isPhoneInput
    ? '+998 99 585 45 65'
    : placeholder;

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300"
        >
          {label}
          {required && <span className="text-brand-red ml-1">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 pl-3 rtl:pl-0 rtl:pr-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          type={isPhoneInput ? 'tel' : type}
          inputMode={isPhoneInput ? 'numeric' : undefined}
          disabled={disabled}
          required={required}
          value={resolvedValue}
          defaultValue={resolvedDefaultValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onClick={handleClick}
          placeholder={resolvedPlaceholder}
          className={`
            w-full rounded-xl border bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 transition-colors duration-150
            ${size === 'sm' ? 'h-10 text-xs px-3' : size === 'lg' ? 'h-12 text-base px-4' : 'h-11 text-sm px-3.5'}
            placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-surface-dark
            disabled:bg-gray-100 dark:disabled:bg-surface-dark-tertiary disabled:cursor-not-allowed disabled:text-gray-400
            ${Icon && iconPosition === 'left' ? '!pl-9 rtl:!pl-3.5 rtl:!pr-9' : ''}
            ${Icon && iconPosition === 'right' ? '!pr-9 rtl:!pr-3.5 rtl:!pl-9' : ''}
            ${
              error
                ? 'border-brand-red focus:border-brand-red focus:ring-brand-red'
                : 'border-gray-300 dark:border-gray-600 focus:border-brand-navy focus:ring-brand-navy dark:focus:border-blue-500 dark:focus:ring-blue-500'
            }
            ${inputClassName}
          `}
          {...props}
        />

        {Icon && iconPosition === 'right' && (
          <div className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 pr-3 rtl:pr-0 rtl:pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      {error ? (
        <p className="text-xs text-brand-red dark:text-red-400 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Input;

