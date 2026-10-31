import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { AlertTriangle, AlertOctagon, Trash2, X, ArrowRight, ShieldAlert } from 'lucide-react';

const TwoStepConfirmContext = createContext(null);

export function TwoStepConfirmProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1); // 1 or 2
  const [config, setConfig] = useState({
    title: 'O‘chirishni tasdiqlang',
    itemName: '',
    description: 'Ushbu ma‘lumot tizimdan o‘chiriladi.',
    dangerLevel: 'high',
    confirmButtonText: 'Ha, butunlay o‘chirilsin',
  });

  const resolverRef = useRef(null);

  const confirmDelete = useCallback((options = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setConfig({
        title: options.title || 'Ma‘lumotni o‘chirish',
        itemName: options.itemName || options.name || '',
        description: options.description || 'Ushbu ma‘lumot tizimdan butunlay o‘chiriladi.',
        dangerLevel: options.dangerLevel || 'high',
        confirmButtonText: options.confirmButtonText || 'Ha, butunlay o‘chirilsin',
      });
      setStep(1);
      setIsOpen(true);
    });
  }, []);

  const handleCancel = () => {
    setIsOpen(false);
    setStep(1);
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  };

  const handleStep1Proceed = () => {
    setStep(2);
  };

  const handleFinalConfirm = () => {
    setIsOpen(false);
    setStep(1);
    if (resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
  };

  return (
    <TwoStepConfirmContext.Provider value={{ confirmDelete }}>
      {children}

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fade-in"
          onClick={handleCancel}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-[#1a2332] rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700/80 overflow-hidden transform transition-all duration-200 scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Step Progress Indicator Bar */}
            <div className="bg-gray-100/90 dark:bg-gray-800/80 px-5 py-3 border-b border-gray-200 dark:border-gray-700/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  2 bosqichli xavfsizlik:
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wide ${
                  step === 1
                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                    : 'bg-red-500/20 text-red-600 dark:text-red-300 border border-red-500/30'
                }`}>
                  {step === 1 ? '1-bosqich / 2' : '2-bosqich / 2 (Yakuniy)'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                className="p-1 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                aria-label="Yopish"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {step === 1 ? (
                /* STEP 1: Warning & Request to proceed */
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                    <AlertTriangle className="w-7 h-7" />
                  </div>

                  <div className="text-center space-y-2">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                      {config.title}
                    </h3>
                    {config.itemName ? (
                      <p className="text-sm font-bold text-amber-800 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-950/40 py-1.5 px-3 rounded-xl border border-amber-200/60 dark:border-amber-800/60 inline-block max-w-full truncate">
                        «{config.itemName}»
                      </p>
                    ) : null}
                    <p className="text-xs text-gray-600 dark:text-gray-300 pt-1 leading-relaxed">
                      {config.description}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 italic">
                      O‘quv markaz ma‘lumotlari xavfsizligi uchun o‘chirish amali 2 bosqichda tekshiriladi.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="w-full py-2.5 px-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="button"
                      onClick={handleStep1Proceed}
                      className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <span>Davom etish</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                /* STEP 2: Strict Final Confirmation: "Aniq ishonchingiz komilmi?" */
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-red-500/15 border-2 border-red-500/40 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto shadow-inner animate-pulse">
                    <AlertOctagon className="w-8 h-8" />
                  </div>

                  <div className="text-center space-y-2">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800">
                      🛑 2-bosqich: Oxirgi ogohlantirish!
                    </span>
                    <h3 className="text-lg font-black text-red-600 dark:text-red-400">
                      Aniq ishonchingiz komilmi?
                    </h3>
                    <div className="p-3.5 rounded-2xl bg-red-50/80 dark:bg-red-950/40 border border-red-200 dark:border-red-800/80 text-xs text-red-900 dark:text-red-200 leading-relaxed text-left">
                      <strong>DIQQAT:</strong> Ushbu amalni ortga qaytarib bo‘lmaydi! Agar quyidagi qizil tugmani bossangiz, 
                      {config.itemName ? ` «${config.itemName}»` : ' ushbu ma‘lumot'} tizimdan butunlay o‘chiriladi.
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="w-full py-2.5 px-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Yo‘q, bekor qilish
                    </button>
                    <button
                      type="button"
                      onClick={handleFinalConfirm}
                      className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ring-2 ring-red-400/50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{config.confirmButtonText}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </TwoStepConfirmContext.Provider>
  );
}

export function useTwoStepConfirm() {
  const ctx = useContext(TwoStepConfirmContext);
  if (!ctx) {
    return {
      confirmDelete: async ({ itemName, title } = {}) => {
        const step1 = window.confirm(`1-bosqich: ${title || 'O‘chirish'}\n${itemName ? `«${itemName}»` : ''} o‘chirishni xohlaysizmi?`);
        if (!step1) return false;
        return window.confirm(`2-bosqich: Aniq ishonchingiz komilmi? Bu amalni ortga qaytarib bo‘lmaydi!`);
      },
    };
  }
  return ctx;
}
