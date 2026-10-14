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
    success: 'border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-100',
    danger: 'border-brand-red bg-red-50/90 dark:bg-red-950/80 text-red-900 dark:text-red-100',
    warning: 'border-amber-500 bg-amber-50/90 dark:bg-amber-950/80 text-amber-900 dark:text-amber-100',
    info: 'border-brand-navy bg-blue-50/90 dark:bg-slate-900/90 text-blue-900 dark:text-blue-100',
  };

  const iconColorMap = {
    success: 'text-emerald-600 dark:text-emerald-400',
    danger: 'text-brand-red dark:text-red-400',
    warning: 'text-amber-600 dark:text-amber-400',
    info: 'text-brand-navy dark:text-blue-400',
  };

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 rtl:right-auto rtl:left-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((item) => {
        const Icon = iconMap[item.type] || Info;
        return (
          <div
            key={item.id}
            className={`
              pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg backdrop-blur-sm
              animate-slide-up transition-all duration-200
              ${styleMap[item.type] || styleMap.info}
            `}
          >
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColorMap[item.type] || iconColorMap.info}`} />
            <div className="flex-1 min-w-0">
              {item.title && (
                <p className="text-sm font-semibold mb-0.5 leading-tight">
                  {item.title}
                </p>
              )}
              <p className="text-xs leading-relaxed">{item.message}</p>
            </div>
            <button
              type="button"
              onClick={() => removeToast(item.id)}
              className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors p-0.5 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export const ToastProvider = ToastContainer;
export default ToastContainer;

