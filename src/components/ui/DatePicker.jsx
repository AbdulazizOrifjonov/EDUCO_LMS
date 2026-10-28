import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Clock,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Modern Theme-Adaptive DatePicker for EDUCO LMS
 * Works beautifully in both Light Mode (Blue brand) and Dark Mode (Emerald).
 */
export default function DatePicker({
  value,
  onChange,
  placeholder = 'Sanani tanlang...',
  label,
  error,
  disabled = false,
  minDate,
  maxDate,
  className = '',
  name,
  id,
}) {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse incoming value (expected YYYY-MM-DD or ISO string)
  const selectedDate = useMemo(() => {
    if (!value) return null;
    try {
      const s = String(value).slice(0, 10);
      const [y, m, d] = s.split('-').map(Number);
      if (!y || !m || !d) return null;
      return new Date(y, m - 1, d);
    } catch {
      return null;
    }
  }, [value]);

  // View state for Month and Year in the calendar popover
  const [viewDate, setViewDate] = useState(() => {
    if (selectedDate) return new Date(selectedDate);
    return new Date();
  });

  // Keep viewDate in sync when opened or value changes
  useEffect(() => {
    if (selectedDate) {
      setViewDate(new Date(selectedDate));
    }
  }, [selectedDate, isOpen]);

  // Close calendar popover on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth(); // 0 to 11

  const monthNames = [
    'Yanvar',
    'Fevral',
    'Mart',
    'Aprel',
    'May',
    'Iyun',
    'Iyul',
    'Avgust',
    'Sentabr',
    'Oktabr',
    'Noyabr',
    'Dekabr',
  ];

  const weekDayNames = [
    { short: 'Du', full: 'Dushanba' },
    { short: 'Se', full: 'Seshanba' },
    { short: 'Ch', full: 'Chorshanba' },
    { short: 'Pa', full: 'Payshanba' },
    { short: 'Ju', full: 'Juma' },
    { short: 'Sh', full: 'Shanba' },
    { short: 'Ya', full: 'Yakshanba' },
  ];

  // Compute days for calendar matrix (Monday to Sunday)
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0);

    // Day of week: 1 = Mon, 7 = Sun
    let startDayOfWeek = firstDayOfMonth.getDay();
    if (startDayOfWeek === 0) startDayOfWeek = 7;

    const days = [];

    // Previous month filler days
    const prevMonthLastDay = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i > 0; i--) {
      const dayNum = prevMonthLastDay - i + 1;
      const d = new Date(viewYear, viewMonth - 1, dayNum);
      days.push({
        date: d,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isWeekend: d.getDay() === 0,
      });
    }

    // Current month days
    for (let d = 1; d <= lastDayOfMonth.getDate(); d++) {
      const curDate = new Date(viewYear, viewMonth, d);
      days.push({
        date: curDate,
        dayNumber: d,
        isCurrentMonth: true,
        isWeekend: curDate.getDay() === 0,
      });
    }

    // Next month filler days to complete 6-row or 5-row grid
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const curDate = new Date(viewYear, viewMonth + 1, d);
      days.push({
        date: curDate,
        dayNumber: d,
        isCurrentMonth: false,
        isWeekend: curDate.getDay() === 0,
      });
    }

    return days;
  }, [viewYear, viewMonth]);

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  const formatToYMD = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const handleSelectDay = (d) => {
    if (disabled) return;
    const ymd = formatToYMD(d);
    onChange?.(ymd);
    setIsOpen(false);
  };

  const handleToday = (e) => {
    e.stopPropagation();
    const today = new Date();
    onChange?.(formatToYMD(today));
    setViewDate(today);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange?.('');
    setIsOpen(false);
  };

  // Format displayed text
  const displayValue = useMemo(() => {
    if (!selectedDate) return '';
    const day = selectedDate.getDate();
    const month = monthNames[selectedDate.getMonth()];
    const year = selectedDate.getFullYear();
    return `${day}-${month}, ${year}`;
  }, [selectedDate]);

  const todayStr = useMemo(() => formatToYMD(new Date()), []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5"
        >
          {label}
        </label>
      )}

      {/* Input Trigger Button */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full h-11 px-3.5 rounded-xl border flex items-center justify-between gap-2 text-sm transition-all select-none cursor-pointer ${
          disabled
            ? 'opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-800'
            : isOpen
            ? 'border-blue-600 dark:border-emerald-500 ring-2 ring-blue-500/20 dark:ring-emerald-500/20 bg-white dark:bg-surface-dark-secondary'
            : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 bg-white dark:bg-surface-dark-secondary'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <CalendarIcon
            className={`w-4 h-4 shrink-0 transition-colors ${
              isOpen
                ? 'text-blue-600 dark:text-emerald-400'
                : 'text-gray-400 dark:text-gray-500'
            }`}
          />
          <span
            className={`truncate font-medium ${
              displayValue
                ? 'text-gray-900 dark:text-white'
                : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            {displayValue || placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {displayValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              title="Tozalash"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="text-gray-400 text-xs font-mono">📅</span>
        </div>
      </div>

      {error && (
        <p className="text-xs text-rose-500 dark:text-rose-400 mt-1 font-medium">{error}</p>
      )}

      {/* Hidden input for HTML form submissions / react-hook-form */}
      <input
        type="hidden"
        name={name}
        id={id}
        value={value || ''}
      />

      {/* Popover Calendar */}
      {isOpen && (
        <div
          className="absolute z-50 mt-2 left-0 w-80 sm:w-84 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-150"
          style={{ minWidth: '300px' }}
        >
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
              title="Oldingi oy"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 font-bold text-sm text-gray-900 dark:text-white">
              <span>{monthNames[viewMonth]}</span>
              <span className="text-blue-600 dark:text-emerald-400 font-black">
                {viewYear}
              </span>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
              title="Keyingi oy"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
            {weekDayNames.map((w, idx) => (
              <span
                key={w.short}
                className={`text-[11px] font-bold uppercase py-1 select-none ${
                  idx === 6
                    ? 'text-rose-500 dark:text-rose-400'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {w.short}
              </span>
            ))}
          </div>

          {/* Day Matrix */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((item, idx) => {
              const ymd = formatToYMD(item.date);
              const isSelected = selectedDate && ymd === formatToYMD(selectedDate);
              const isToday = ymd === todayStr;

              let btnClass = 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800';

              if (!item.isCurrentMonth) {
                btnClass = 'text-gray-300 dark:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/40';
              } else if (isSelected) {
                btnClass =
                  'bg-[#123D78] dark:bg-emerald-600 text-white font-bold shadow-md shadow-blue-900/20 dark:shadow-emerald-950/40 hover:bg-[#1b4b8a] dark:hover:bg-emerald-500';
              } else if (isToday) {
                btnClass =
                  'bg-blue-50 dark:bg-emerald-950/40 text-blue-700 dark:text-emerald-300 font-bold border border-blue-300 dark:border-emerald-700';
              } else if (item.isWeekend) {
                btnClass = 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30';
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectDay(item.date)}
                  className={`h-9 w-full rounded-xl text-xs font-medium flex items-center justify-center transition-all cursor-pointer relative select-none ${btnClass}`}
                >
                  <span>{item.dayNumber}</span>
                  {isToday && !isSelected && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-600 dark:bg-emerald-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer Quick Presets */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100 dark:border-gray-800 text-xs">
            <button
              type="button"
              onClick={handleToday}
              className="text-blue-600 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Bugun</span>
            </button>

            {selectedDate && (
              <button
                type="button"
                onClick={handleClear}
                className="text-gray-400 hover:text-rose-500 transition-colors font-medium cursor-pointer"
              >
                Tozalash
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition-colors cursor-pointer"
            >
              Yopish
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
