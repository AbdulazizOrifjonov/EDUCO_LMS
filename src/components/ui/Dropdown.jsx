import React, { useState, useRef, useEffect } from 'react';

export default function Dropdown({
  trigger,
  items = [],
  align = 'auto',
  className = '',
  menuClassName = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Viewport safety check: prevent dropdown menu from ever clipping off screen edges on mobile
  useEffect(() => {
    if (isOpen && menuRef.current) {
      menuRef.current.style.left = '';
      menuRef.current.style.right = '';
      menuRef.current.style.transform = '';

      const frameId = requestAnimationFrame(() => {
        if (!menuRef.current) return;
        const rect = menuRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 360;
        const margin = 12;

        let shiftX = 0;
        if (rect.left < margin) {
          shiftX = margin - rect.left;
        } else if (rect.right > viewportWidth - margin) {
          shiftX = (viewportWidth - margin) - rect.right;
        }

        if (shiftX !== 0) {
          menuRef.current.style.transform = `translateX(${shiftX}px)`;
        }
      });

      return () => cancelAnimationFrame(frameId);
    }
  }, [isOpen]);

  const alignClasses = {
    left: 'left-0 rtl:left-auto rtl:right-0 origin-top-left',
    right: 'right-0 rtl:right-auto rtl:left-0 origin-top-right',
    auto: 'left-0 sm:left-auto sm:right-0 rtl:right-0 rtl:sm:right-auto rtl:sm:left-0 origin-top-left sm:origin-top-right',
  }[align] || align || 'left-0 sm:left-auto sm:right-0 origin-top-left sm:origin-top-right';

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
      <div onClick={() => setIsOpen((prev) => !prev)}>
        {trigger}
      </div>

      {isOpen && (
        <div
          ref={menuRef}
          className={`
            absolute z-50 mt-2 w-52 max-w-[calc(100vw-1.5rem)] rounded-xl bg-white dark:bg-surface-dark-secondary
            border border-gray-100 dark:border-gray-800 shadow-dropdown py-1.5
            animate-fade-in focus:outline-none ${alignClasses} ${menuClassName}
          `}
          role="menu"
        >
          {items.map((item, index) => {
            if (item.type === 'divider') {
              return (
                <div
                  key={index}
                  className="my-1 border-t border-gray-100 dark:border-gray-800"
                />
              );
            }

            const Icon = item.icon;
            const isDanger = item.variant === 'danger';

            return (
              <button
                key={index}
                type="button"
                disabled={item.disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  item.onClick?.();
                  setIsOpen(false);
                }}
                className={`
                  w-full text-left rtl:text-right px-4 py-2 text-sm flex items-center gap-2.5
                  transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed
                  ${
                    isDanger
                      ? 'text-brand-red hover:bg-red-50 dark:hover:bg-red-950/30'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100/70 dark:hover:bg-surface-dark-tertiary'
                  }
                  ${item.className || ''}
                `}
                role="menuitem"
              >
                {Icon && <Icon className="w-4 h-4 shrink-0" />}
                <span className="truncate">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto rtl:ml-0 rtl:mr-auto text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
