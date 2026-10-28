import React, { useState, useRef, useEffect, forwardRef, useId } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Search } from 'lucide-react';

const Select = forwardRef(function Select(
  {
    label,
    options = [],
    value,
    onChange,
    placeholder = 'Tanlang...',
    headerTitle,
    icon: DefaultIcon,
    error,
    helperText,
    disabled = false,
    required = false,
    className = '',
    buttonClassName = '',
    popoverClassName = '',
    searchable = false,
    size = 'md',
    id,
    name,
    children,
    ...props
  },
  ref
) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const popoverRef = useRef(null);
  const searchInputRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [popoverCoords, setPopoverCoords] = useState({
    top: 0,
    left: 0,
    width: 0,
    maxHeight: 300,
    placement: 'bottom',
  });

  // Parse options: supports array of objects, array of primitives, or <option> children
  const parsedOptions = React.useMemo(() => {
    const list = [];

    // From options prop
    if (Array.isArray(options) && options.length > 0) {
      options.forEach((opt) => {
        if (typeof opt === 'object' && opt !== null) {
          list.push({
            value: opt.value !== undefined ? opt.value : '',
            label: opt.label !== undefined ? opt.label : String(opt.value),
            subtitle: opt.subtitle || opt.desc || opt.description || null,
            icon: opt.icon || null,
            color: opt.color || opt.courseColor || null,
            badge: opt.badge || (opt.count !== undefined ? String(opt.count) : null),
            disabled: !!opt.disabled,
          });
        } else {
          list.push({
            value: opt,
            label: String(opt),
            subtitle: null,
            icon: null,
            color: null,
            badge: null,
            disabled: false,
          });
        }
      });
    } else if (children) {
      // From <option> children
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child)) {
          list.push({
            value: child.props.value !== undefined ? child.props.value : child.props.children,
            label: child.props.children || String(child.props.value),
            subtitle: child.props['data-subtitle'] || null,
            icon: child.props['data-icon'] || null,
            color: child.props['data-color'] || null,
            badge: child.props['data-badge'] || null,
            disabled: !!child.props.disabled,
          });
        }
      });
    }

    return list;
  }, [options, children]);

  // Selected option
  const selectedOption = parsedOptions.find(
    (opt) => String(opt.value) === String(value)
  );

  // Position calculation for portal floating menu
  const updatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const margin = 6;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    const minWidth = Math.max(rect.width, 240);
    const width = Math.min(minWidth, viewportWidth - 16);

    let left = rect.left;
    if (left + width > viewportWidth - 8) {
      left = Math.max(8, viewportWidth - width - 8);
    }
    if (left < 8) left = 8;

    let placement = 'bottom';
    let top = rect.bottom + margin;
    let maxHeight = Math.min(340, spaceBelow - margin * 2);

    if (spaceBelow < 200 && spaceAbove > spaceBelow) {
      placement = 'top';
      maxHeight = Math.min(340, spaceAbove - margin * 2);
      top = Math.max(8, rect.top - margin - maxHeight);
    }

    setPopoverCoords({
      top,
      left,
      width,
      maxHeight: Math.max(150, maxHeight),
      placement,
    });
  };

  // Toggle open
  const toggleOpen = () => {
    if (disabled) return;
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen((prev) => !prev);
  };

  // Close on outside click or ESC
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target) &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Window scroll and resize listeners while open
  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    const handleScroll = (e) => {
      if (popoverRef.current && popoverRef.current.contains(e.target)) return;
      updatePosition();
    };

    const handleResize = () => {
      updatePosition();
    };

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  // Reset search when opened/closed
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      if (searchable || parsedOptions.length >= 8) {
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    }
  }, [isOpen, searchable, parsedOptions.length]);

  const handleSelect = (optVal) => {
    if (disabled) return;
    setIsOpen(false);

    if (typeof onChange === 'function') {
      const syntheticEvent = {
        target: {
          value: optVal,
          name: name || selectId,
        },
      };
      onChange(syntheticEvent);
    }
  };

  // Filtered options by search query
  const filteredOptions = parsedOptions.filter((opt) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchLabel = opt.label?.toLowerCase().includes(q);
    const matchSub = opt.subtitle?.toLowerCase().includes(q);
    return matchLabel || matchSub;
  });

  const shouldShowSearch = searchable || parsedOptions.length >= 8;
  const ActiveIcon = selectedOption?.icon || DefaultIcon;

  return (
    <div
      ref={containerRef}
      className={`w-full flex flex-col gap-1.5 relative ${isOpen ? 'z-[100]' : 'z-10'} ${className}`}
    >
      {/* Hidden Native Input for form libraries / refs */}
      <input
        ref={ref}
        type="hidden"
        id={selectId}
        name={name}
        value={value !== undefined && value !== null ? value : ''}
        required={required}
        disabled={disabled}
      />

      {/* Label */}
      {label && (
        <label
          htmlFor={selectId}
          onClick={toggleOpen}
          className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 cursor-pointer flex items-center justify-between"
        >
          <span>
            {label}
            {required && <span className="text-brand-red ml-1">*</span>}
          </span>
          {parsedOptions.length > 0 && (
            <span className="text-[10px] font-normal text-gray-400 lowercase">
              ({parsedOptions.length} ta)
            </span>
          )}
        </label>
      )}

      {/* Trigger Button - Exactly like Image 2 */}
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={toggleOpen}
        className={`
          w-full flex items-center justify-between gap-2.5 text-left rtl:text-right
          rounded-xl border transition-all duration-150 select-none cursor-pointer shadow-2xs
          ${
            size === 'sm'
              ? 'h-10 px-3 text-xs'
              : size === 'lg'
              ? 'h-12 px-4 text-base'
              : 'h-11 px-3.5 text-sm'
          }
          ${
            disabled
              ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 cursor-not-allowed'
              : error
              ? 'border-brand-red bg-white dark:bg-surface-dark-secondary focus:ring-2 focus:ring-brand-red/20'
              : isOpen
              ? 'border-emerald-500/80 dark:border-emerald-500/80 ring-2 ring-emerald-500/20 bg-white dark:bg-surface-dark-secondary shadow-sm'
              : 'border-gray-300/80 dark:border-gray-700 bg-white dark:bg-surface-dark-secondary hover:border-emerald-500/60 dark:hover:border-emerald-500/60'
          }
          ${buttonClassName}
        `}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Left Icon Badge if present */}
          {ActiveIcon && (
            <div
              className={`rounded-lg flex items-center justify-center text-white font-bold shrink-0 shadow-2xs transition-transform ${
                size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-8 h-8' : 'w-7 h-7'
              }`}
              style={{
                backgroundColor: selectedOption?.color || '#123D78',
              }}
            >
              <ActiveIcon className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p
              className={`truncate ${size === 'sm' ? 'text-xs' : 'text-sm'} ${
                selectedOption
                  ? 'font-bold text-gray-900 dark:text-gray-100'
                  : 'font-normal text-gray-400 dark:text-gray-500'
              }`}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </p>
          </div>
        </div>

        {/* Right Badge & Chevron */}
        <div className="flex items-center gap-1.5 shrink-0">
          {selectedOption?.badge && (
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 dark:bg-surface-dark-tertiary text-gray-600 dark:text-gray-300">
              {selectedOption.badge}
            </span>
          )}
          <div className="p-1 rounded-lg bg-gray-100/80 dark:bg-surface-dark-tertiary text-gray-500 dark:text-gray-400">
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-emerald-600 dark:text-emerald-400' : ''
              }`}
            />
          </div>
        </div>
      </button>

      {/* Dropdown Popover List - Rendered in Portal so it floats above EVERYTHING with no overflow-clipping */}
      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: 'fixed',
              top: `${popoverCoords.top}px`,
              left: `${popoverCoords.left}px`,
              width: `${popoverCoords.width}px`,
              maxHeight: `${popoverCoords.maxHeight}px`,
              zIndex: 999999,
            }}
            className={`
              rounded-2xl border
              border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2332]
              shadow-2xl p-2 overflow-y-auto animate-in fade-in zoom-in-95 duration-150
              ${popoverClassName}
            `}
          >
            {/* Popover Header Title */}
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800/80 flex items-center justify-between sticky top-0 bg-white dark:bg-[#1a2332] z-10">
              <span>
                {headerTitle ||
                  (label
                    ? `${label} (${parsedOptions.length})`
                    : `Tanlang (${parsedOptions.length})`)}
              </span>
              {selectedOption && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium truncate max-w-[150px]">
                  {selectedOption.label}
                </span>
              )}
            </div>

            {/* Search box if list is long */}
            {shouldShowSearch && (
              <div className="p-2 border-b border-gray-100 dark:border-gray-800 sticky top-8 bg-white dark:bg-[#1a2332] z-10">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Qidirish..."
                    className="w-full pl-8 pr-3 py-1.5 bg-gray-100 dark:bg-surface-dark-tertiary border-0 rounded-xl text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* Options Items */}
            <div className="divide-y divide-gray-100 dark:divide-gray-800/60 mt-1">
              {filteredOptions.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-400 dark:text-gray-500 font-medium">
                  Variantlar topilmadi
                </div>
              ) : (
                filteredOptions.map((opt, idx) => {
                  const isSelected = String(opt.value) === String(value);
                  const ItemIcon = opt.icon || DefaultIcon;

                  return (
                    <button
                      key={`${opt.value}-${idx}`}
                      type="button"
                      disabled={opt.disabled}
                      onClick={() => handleSelect(opt.value)}
                      className={`
                        w-full flex items-center justify-between gap-3 p-2.5 rounded-xl transition-all duration-150
                        text-left rtl:text-right cursor-pointer group
                        ${
                          opt.disabled
                            ? 'opacity-40 cursor-not-allowed'
                            : isSelected
                            ? 'bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/60 text-gray-700 dark:text-gray-200'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Left Icon Badge */}
                        {ItemIcon && (
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-2xs transition-transform group-hover:scale-105"
                            style={{
                              backgroundColor: opt.color || '#123D78',
                            }}
                          >
                            <ItemIcon className="w-4 h-4" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm truncate leading-snug ${
                              isSelected ? 'font-bold' : 'font-semibold'
                            }`}
                          >
                            {opt.label}
                          </p>
                          {opt.subtitle && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5 leading-none">
                              {opt.subtitle}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right Checkmark / Badge */}
                      <div className="flex items-center gap-2 shrink-0">
                        {opt.badge && (
                          <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                            {opt.badge}
                          </span>
                        )}
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}

      {/* Error or Helper text */}
      {error ? (
        <p className="text-xs text-brand-red dark:text-red-400 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Select;
