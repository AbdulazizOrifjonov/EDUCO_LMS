import React from 'react';
import { create } from 'zustand';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export const useToastStore = create((set) => ({
  toasts: [],
  addToast: ({ type = 'info', message, title, duration = 4000 }) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    set((state) => ({
      toasts: [...state.toasts, { id, type, message, title, duration }],
    }));

    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
    return id;
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  clearAll: () => set({ toasts: [] }),
}));

export const toast = {
  success: (message, title, duration) =>
    useToastStore.getState().addToast({ type: 'success', message, title, duration }),
  error: (message, title, duration) =>
    useToastStore.getState().addToast({ type: 'danger', message, title, duration }),
  warning: (message, title, duration) =>
    useToastStore.getState().addToast({ type: 'warning', message, title, duration }),
  info: (message, title, duration) =>
    useToastStore.getState().addToast({ type: 'info', message, title, duration }),
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  const iconMap = {
    success: CheckCircle2,
    danger: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const styleMap = {
    success:
      'border-emerald-500/40 bg-white/95 dark:bg-[#0c1f17]/95 text-gray-900 dark:text-emerald-100 shadow-xl shadow-emerald-950/15 ring-1 ring-emerald-500/20',
    danger:
      'border-rose-500/40 bg-white/95 dark:bg-[#200d11]/95 text-gray-900 dark:text-rose-100 shadow-xl shadow-rose-950/15 ring-1 ring-rose-500/20',
    warning:
      'border-amber-500/40 bg-white/95 dark:bg-[#20180a]/95 text-gray-900 dark:text-amber-100 shadow-xl shadow-amber-950/15 ring-1 ring-amber-500/20',
    info:
      'border-blue-500/40 bg-white/95 dark:bg-[#0f172a]/95 text-gray-900 dark:text-blue-100 shadow-xl shadow-blue-950/15 ring-1 ring-blue-500/20',
  };

  const iconColorMap = {
    success: 'text-emerald-600 dark:text-emerald-400',
    danger: 'text-rose-600 dark:text-rose-400',
    warning: 'text-amber-600 dark:text-amber-400',
    info: 'text-blue-600 dark:text-blue-400',
  };

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-auto sm:right-5 rtl:sm:right-auto rtl:sm:left-5 z-50 flex flex-col items-center sm:items-end gap-2 w-auto max-w-[calc(100vw-32px)] sm:max-w-md pointer-events-none transition-all duration-200"
    >
      {toasts.map((item) => {
        const Icon = iconMap[item.type] || Info;
        return (
          <div
            key={item.id}
            className={`
              pointer-events-auto flex items-center gap-2.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-2xl border backdrop-blur-md
              animate-slide-up transition-all duration-200 w-auto max-w-full
              ${styleMap[item.type] || styleMap.info}
            `}
          >
            <Icon className={`w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0 ${iconColorMap[item.type] || iconColorMap.info}`} />
            <div className="flex-1 min-w-0 pr-1">
              {item.title && (
                <p className="text-xs font-bold leading-tight mb-0.5">
                  {item.title}
                </p>
              )}
              <p className="text-[11px] sm:text-xs font-semibold leading-snug break-words">
                {item.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => removeToast(item.id)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 -mr-1 rounded-lg shrink-0 cursor-pointer"
              aria-label="Yopish"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export const ToastProvider = ToastContainer;
export default ToastContainer;

