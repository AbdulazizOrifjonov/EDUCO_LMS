import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Clock, ChevronDown, Check, Sparkles, Sun, Moon, Sunrise, Sunset } from 'lucide-react';

/**
 * Modern 24-Hour TimePicker for EDUCO LMS
 * Replaces the ugly/confusing browser native AM/PM time picker with an intuitive,
 * 24-hour Tashkent-standard time selector.
 */
export default function TimePicker({
  value = '10:00',
  onChange,
  label,
  helperText,
  disabled = false,
  error = null,
  className = '',
  id,
  name,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const hoursListRef = useRef(null);
  const minutesListRef = useRef(null);

  // Normalize incoming value to "HH:mm" (24-hour format)
  const [currentHour, currentMinute] = useMemo(() => {
    if (!value || typeof value !== 'string') return [10, 0];
    const parts = value.split(':');
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    return [
      isNaN(h) || h < 0 || h > 23 ? 10 : h,
      isNaN(m) || m < 0 || m > 59 ? 0 : m,
    ];
  }, [value]);

  const formattedTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

  // Close on click outside
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

  // Scroll selected hour and minute into view when popover opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (hoursListRef.current) {
          const selectedHourEl = hoursListRef.current.querySelector('[data-selected="true"]');
          if (selectedHourEl) {
            selectedHourEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }
        }
        if (minutesListRef.current) {
          const selectedMinuteEl = minutesListRef.current.querySelector('[data-selected="true"]');
          if (selectedMinuteEl) {
            selectedMinuteEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }
        }
      }, 50);
    }
  }, [isOpen]);

  const setHour = (h) => {
    const newTime = `${String(h).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
    onChange?.(newTime);
  };

  const setMinute = (m) => {
    const newTime = `${String(currentHour).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    onChange?.(newTime);
  };

  const setFullTime = (h, m) => {
    const newTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    onChange?.(newTime);
  };

  const handleSetCurrentTime = () => {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    setFullTime(h, m);
  };

  // Time period descriptor in Uzbek
  const periodInfo = useMemo(() => {
    if (currentHour >= 5 && currentHour < 12) {
      return { label: 'Ertalabki vaqt', icon: Sunrise, color: 'text-amber-500' };
    }
    if (currentHour >= 12 && currentHour < 17) {
      return { label: 'Kunduzgi vaqt', icon: Sun, color: 'text-orange-500' };
    }
    if (currentHour >= 17 && currentHour < 22) {
      return { label: 'Kechki vaqt', icon: Sunset, color: 'text-indigo-400' };
    }
    return { label: 'Tungi vaqt', icon: Moon, color: 'text-blue-400' };
  }, [currentHour]);

  const PeriodIcon = periodInfo.icon;

  // Preset popular times for fast 1-click selection
  const popularPresets = ['09:00', '10:00', '11:00', '14:00', '16:00', '18:00', '20:00'];

  // Hours: 00 to 23
  const hours = Array.from({ length: 24 }, (_, i) => i);
  // Minutes: 00 to 59
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5"
        >
          {label}
        </label>
      )}

      {/* Main Trigger Button */}
      <div
        id={id}
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className={`w-full h-11 px-3.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
          error
            ? 'border-red-500 focus:ring-2 focus:ring-red-500/30'
            : isOpen
            ? 'border-blue-600 dark:border-emerald-500 ring-2 ring-blue-500/20 dark:ring-emerald-500/20'
            : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
        } ${
          disabled
            ? 'opacity-60 bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
            : 'bg-white dark:bg-surface-dark-tertiary'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Clock className="w-4 h-4 text-blue-600 dark:text-emerald-400 shrink-0" />
          <span className="text-sm font-bold tracking-wider text-gray-900 dark:text-gray-100 font-mono">
            {formattedTime}
          </span>
          <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 truncate hidden xs:inline">
            ({periodInfo.label})
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-gray-400">
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600 dark:text-emerald-400' : ''}`}
          />
        </div>
      </div>

      {helperText && !error && (
        <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
      {error && <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>}

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute left-0 mt-2 z-50 w-72 sm:w-80 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header Display */}
          <div className="p-3.5 bg-gradient-to-r from-blue-50 via-white to-blue-50 dark:from-gray-800 dark:via-gray-800/90 dark:to-gray-800 border-b border-gray-100 dark:border-gray-700/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-emerald-400" />
                24 soatlik Toshkent vaqti
              </span>
              <div className="flex items-center gap-1 text-[11px] font-bold">
                <PeriodIcon className={`w-3.5 h-3.5 ${periodInfo.color}`} />
                <span className={periodInfo.color}>{periodInfo.label}</span>
              </div>
            </div>

            {/* Large Digital Display */}
            <div className="flex items-center justify-center gap-2 py-1">
              <div className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-gray-900 border border-blue-200 dark:border-gray-700 shadow-xs text-center">
                <span className="text-2xl font-black font-mono text-blue-600 dark:text-emerald-400 tracking-wider">
                  {String(currentHour).padStart(2, '0')}
                </span>
                <span className="block text-[9px] font-bold uppercase text-gray-400 tracking-wider">
                  Soat
                </span>
              </div>
              <span className="text-2xl font-black text-gray-400 font-mono -mt-3">:</span>
              <div className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-gray-900 border border-blue-200 dark:border-gray-700 shadow-xs text-center">
                <span className="text-2xl font-black font-mono text-blue-600 dark:text-emerald-400 tracking-wider">
                  {String(currentMinute).padStart(2, '0')}
                </span>
                <span className="block text-[9px] font-bold uppercase text-gray-400 tracking-wider">
                  Daqiqa
                </span>
              </div>
            </div>
          </div>

          {/* Popular Presets */}
          <div className="px-3 py-2 bg-gray-50/70 dark:bg-gray-900/40 border-b border-gray-100 dark:border-gray-700/60">
            <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              <span>Tezkor tanlov</span>
              <button
                type="button"
                onClick={handleSetCurrentTime}
                className="text-blue-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1 lowercase"
              >
                <Sparkles className="w-3 h-3" /> hozirgi vaqt
              </button>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {popularPresets.map((preset) => {
                const isSelected = preset === formattedTime;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      const [h, m] = preset.split(':').map(Number);
                      setFullTime(h, m);
                    }}
                    className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold transition-all shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 dark:bg-emerald-600 text-white shadow-xs'
                        : 'bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dual Column Picker: Soat va Daqiqa */}
          <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-gray-700/80 p-2">
            {/* Hours Column */}
            <div className="pr-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 text-center pb-1.5">
                Soat (00 - 23)
              </div>
              <div
                ref={hoursListRef}
                className="h-44 overflow-y-auto space-y-1 pr-1 custom-scrollbar"
              >
                {hours.map((h) => {
                  const isSelected = h === currentHour;
                  const hourLabel = String(h).padStart(2, '0');
                  return (
                    <button
                      key={h}
                      type="button"
                      data-selected={isSelected}
                      onClick={() => setHour(h)}
                      className={`w-full h-8 rounded-lg text-xs font-mono font-bold flex items-center justify-between px-3 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 dark:bg-emerald-600 text-white shadow-xs font-black'
                          : 'hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span>{hourLabel}:00</span>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Minutes Column */}
            <div className="pl-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 text-center pb-1.5">
                Daqiqa (00 - 59)
              </div>
              <div
                ref={minutesListRef}
                className="h-44 overflow-y-auto space-y-1 pr-1 custom-scrollbar"
              >
                {minutes.map((m) => {
                  const isSelected = m === currentMinute;
                  const minuteLabel = String(m).padStart(2, '0');
                  const isFiveMinStep = m % 5 === 0;
                  return (
                    <button
                      key={m}
                      type="button"
                      data-selected={isSelected}
                      onClick={() => setMinute(m)}
                      className={`w-full h-8 rounded-lg text-xs font-mono font-bold flex items-center justify-between px-3 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 dark:bg-emerald-600 text-white shadow-xs font-black'
                          : isFiveMinStep
                          ? 'hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 font-bold'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700/60 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      <span>:{minuteLabel}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer with Confirm Button */}
          <div className="p-2.5 bg-gray-50 dark:bg-gray-900/60 border-t border-gray-100 dark:border-gray-700/80 flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
              Tanlandi: <strong className="font-mono text-gray-900 dark:text-gray-100">{formattedTime}</strong>
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              Tayyor
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
