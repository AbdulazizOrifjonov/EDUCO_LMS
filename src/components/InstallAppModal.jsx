import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  Monitor,
  Share2,
  PlusSquare,
  CheckCircle2,
  X,
  Laptop,
  Check,
  Sparkles,
} from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

export default function InstallAppModal({ isOpen, onClose }) {
  const { platform, isStandalone, hasNativePrompt, triggerInstall } = usePWA();
  const [activeTab, setActiveTab] = useState(platform || 'desktop'); // 'desktop' | 'ios' | 'android'
  const [installed, setInstalled] = useState(isStandalone);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    const success = await triggerInstall();
    if (success) {
      setInstalled(true);
      setTimeout(() => {
        onClose?.();
      }, 1500);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-[#1a2332] rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700/80 overflow-hidden transform transition-all duration-200 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-[#123D78] to-indigo-700 text-white p-5 sm:p-6 relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Yopish"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-white p-1.5 shadow-md shrink-0 flex items-center justify-center">
              <img
                src="/educo-logo-192.png"
                alt="EDUCO"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">EDUCO LMS Ilovasi</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-400 text-emerald-950 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> PWA APP
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-1">
                Kompyuter (Windows / Mac), iPhone va Android uchun to‘liq ilova
              </p>
            </div>
          </div>

          {/* Platform Switcher Tabs */}
          <div className="flex rounded-xl bg-black/25 p-1 mt-4 text-xs font-bold gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('desktop')}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'desktop'
                  ? 'bg-white text-blue-900 shadow-md scale-100'
                  : 'text-blue-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Kompyuter</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ios')}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'ios'
                  ? 'bg-white text-blue-900 shadow-md scale-100'
                  : 'text-blue-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>iPhone / iOS</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('android')}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'android'
                  ? 'bg-white text-blue-900 shadow-md scale-100'
                  : 'text-blue-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Android</span>
            </button>
          </div>
        </div>

        {/* Tab Content (Scrollable if screen is small) */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* SUCCESS BANNER IF INSTALLED */}
          {installed && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 flex items-center gap-3 text-xs font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>Ilova muvaffaqiyatli o‘rnatildi! Endi uni ish stolidan mustaqil ochishingiz mumkin.</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 1: DESKTOP / PC (WINDOWS / MAC)                     */}
          {/* ======================================================== */}
          {activeTab === 'desktop' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 space-y-1">
                <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-bold text-xs sm:text-sm">
                  <Laptop className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Kompyuterga (Windows / Mac) o‘rnatish:</span>
                </div>
                <p className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  Ilova brauzersiz, to‘liq mustaqil dastur bo‘lib kompyuteringiz ish stoliga (Desktop) va Bosh menyuga (Start) tushadi.
                </p>
              </div>

              {/* DIRECT 1-CLICK BUTTON */}
              <button
                type="button"
                onClick={handleNativeInstall}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-95 border border-blue-400/40 group"
              >
                <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>Kompyuterga 1-klikda o‘rnatish</span>
              </button>

              {/* VISUAL DIAGRAM OF BROWSER URL BAR */}
              <div className="rounded-2xl border-2 border-dashed border-blue-400/50 bg-slate-900 text-white p-3 space-y-2 shadow-inner">
                <div className="flex items-center justify-between text-[11px] text-gray-300">
                  <span className="font-semibold text-blue-300">🖥️ Brauzeringizning eng yuqori qismi:</span>
                  <span className="text-amber-400 font-bold animate-pulse text-[10px]">Qayerga bosish kerak ⬇️</span>
                </div>

                {/* Simulated URL bar */}
                <div className="flex items-center gap-2 bg-slate-800 rounded-xl p-2 border border-slate-700 text-xs font-mono">
                  <div className="flex-1 truncate text-gray-400 pl-1 text-[11px]">
                    🔒 https://educo-lms...
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-2 py-1 rounded-lg bg-blue-600 text-white font-bold flex items-center gap-1 text-[11px] ring-2 ring-amber-400 shadow-sm animate-pulse">
                      <Download className="w-3 h-3" />
                      <span>O‘rnatish</span>
                    </span>
                    <span className="w-6 h-6 rounded-lg bg-slate-700 text-gray-300 flex items-center justify-center font-bold text-xs">
                      ⋮
                    </span>
                  </div>
                </div>

                <p className="text-[10px] text-gray-400 text-center pt-0.5">
                  Yuqoridagi manzil satri o‘ng tomonidagi <strong className="text-white">O‘rnatish</strong> belgisini yoki <strong className="text-white">3 ta nuqta [ ⋮ ]</strong> menyusini bosing.
                </p>
              </div>

              {/* 2 ALTERNATIVE WAYS EXPLAINED */}
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-1">
                  <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] flex items-center justify-center font-bold shrink-0">1</span>
                    <span>1-usul: Manzil qatoridagi belgi</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 pl-7 text-[11px] leading-relaxed">
                    Google Chrome yoki Edge manzil satrining eng o‘ng tomonida paydo bo‘lgan <strong className="text-blue-600 dark:text-blue-400">⊞ O‘rnatish</strong> (kompyutercha belgisi) ni bosing ➔ <strong>«O‘rnatish»</strong> ni tanlang.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-1">
                  <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] flex items-center justify-center font-bold shrink-0">2</span>
                    <span>2-usul: Brauzer menyusi orqali (100% barcha kompyuterlarda)</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 pl-7 text-[11px] leading-relaxed">
                    Brauzeringizning eng yuqori o‘ng burchagidagi <strong>[ ⋮ ] (3 ta nuqta)</strong> ni bosing ➔ <strong>«EDUCO LMS ilovasini o‘rnatish...»</strong> (yoki «Ilovani o‘rnatish») yozuvini bosing.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: iPHONE / iOS (SAFARI)                            */}
          {/* ======================================================== */}
          {activeTab === 'ios' && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200">
                <strong>iPhone (Safari):</strong> App Store kerak emas! Ilova to‘g‘ridan-to‘g‘ri Safari orqali iPhone bosh ekraningizga Telegram yoki Instagram kabi alohida dastur bo‘lib tushadi.
              </div>

              <div className="space-y-2.5 text-xs">
                {/* Step 1 */}
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm block">
                      1-qadam: Pastdagi «Ulashish» tugmasini bosing
                    </span>
                    <p className="text-gray-600 dark:text-gray-300 mt-1 text-[11px] sm:text-xs leading-relaxed">
                      iPhone Safari brauzerining <strong>eng pastki o‘rtasida</strong> joylashgan <strong className="text-blue-600 dark:text-blue-400">[ 📤 Ulashish ]</strong> (kvadratdan tepaga strelka chiqqan belgi) ni bosing.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
                    <PlusSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm block">
                      2-qadam: «Asosiy ekranga qo‘shish»ni bosing
                    </span>
                    <p className="text-gray-600 dark:text-gray-300 mt-1 text-[11px] sm:text-xs leading-relaxed">
                      Ochilgan menyudan pastroqqa tushib <strong className="text-emerald-600 dark:text-emerald-400">«Asosiy ekranga qo‘shish»</strong> (Add to Home Screen ➕) yozuvini bosing.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm block">
                      3-qadam: Yuqori o‘ngdagi «Qo‘shish» (Add) ni bosing
                    </span>
                    <p className="text-gray-600 dark:text-gray-300 mt-1 text-[11px] sm:text-xs leading-relaxed">
                      Yuqori o‘ng burchakdagi ko‘k rangli <strong>«Qo‘shish»</strong> tugmasini bosing. Bo‘ldi! EDUCO LMS ilovasi darhol iPhone bosh ekranida paydo bo‘ladi!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: ANDROID                                          */}
          {/* ======================================================== */}
          {activeTab === 'android' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
                Android telefoningizda Google Chrome orqali ilovani 1-bosishda Play Market-siz to‘g‘ridan-to‘g‘ri o‘rnatib olishingiz mumkin.
              </div>

              {/* 1-CLICK ANDROID INSTALL BUTTON */}
              <button
                type="button"
                onClick={handleNativeInstall}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-95"
              >
                <Download className="w-5 h-5" />
                <span>Android ilovani o‘rnatish</span>
              </button>

              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                  <span className="font-bold text-emerald-600 shrink-0">1.</span>
                  <p className="text-gray-700 dark:text-gray-300">
                    Chrome brauzeri yuqori o‘ng burchagidagi <strong>3 nuqta (⋮)</strong> belgisini bosing.
                  </p>
                </div>
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                  <span className="font-bold text-emerald-600 shrink-0">2.</span>
                  <p className="text-gray-700 dark:text-gray-300">
                    Menyudan <strong>«Ilovani o‘rnatish»</strong> (yoki «Bosh ekranga qo‘shish») tugmasini bosing.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-t border-gray-100 dark:border-gray-800/80 text-xs text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-surface-dark-secondary shrink-0">
          <span className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
            <Check className="w-4 h-4 shrink-0" />
            <span>Xotirani kam egallaydi, tez ishlaydi</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all cursor-pointer shadow-sm"
          >
            Tushunarli
          </button>
        </div>
      </div>
    </div>
  );
}