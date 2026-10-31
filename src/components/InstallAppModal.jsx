import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  Monitor,
  Share2,
  PlusSquare,
  CheckCircle2,
  X,
  ExternalLink,
  Laptop,
  Check,
} from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

export default function InstallAppModal({ isOpen, onClose }) {
  const { platform, isStandalone, hasNativePrompt, triggerInstall } = usePWA();
  const [activeTab, setActiveTab] = useState(platform); // 'ios' | 'desktop' | 'android'
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
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-[#1a2332] rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700/80 overflow-hidden transform transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-[#123D78] to-indigo-700 text-white p-5 sm:p-6 relative">
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
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-400 text-emerald-950">
                  PWA APP
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-1">
                Kompyuter (Windows / Mac), iPhone va Android uchun to‘liq ilova
              </p>
            </div>
          </div>

          {/* Platform Switcher Tabs */}
          <div className="flex rounded-xl bg-black/20 p-1 mt-4 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('desktop')}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'desktop'
                  ? 'bg-white text-blue-900 shadow-sm'
                  : 'text-blue-100 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Kompyuter</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ios')}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'ios'
                  ? 'bg-white text-blue-900 shadow-sm'
                  : 'text-blue-100 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>iPhone / iOS</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('android')}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'android'
                  ? 'bg-white text-blue-900 shadow-sm'
                  : 'text-blue-100 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Android</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* TAB 1: DESKTOP / PC */}
          {activeTab === 'desktop' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 space-y-2">
                <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-bold text-sm">
                  <Laptop className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Windows va Mac kompyuterlariga o‘rnatish:</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  Ilova kompyuteringiz ish stoliga (Desktop) va Bosh menyuga (Start Menu) alohida dastur bo‘lib o‘rnatiladi. Brauzer manzillar qatorisiz to‘liq ekran ishlaydi.
                </p>
              </div>

              {hasNativePrompt ? (
                <button
                  type="button"
                  onClick={handleNativeInstall}
                  className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Kompyuterga 1-klikda o‘rnatish</span>
                </button>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-xs">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">1</span>
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>Google Chrome</strong> yoki <strong>Microsoft Edge</strong> brauzeri manzil qatori (URL bar) o‘ng tomonidagi <span className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 font-mono font-bold">⊞ O‘rnatish</span> belgisini bosing.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-xs">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">2</span>
                    <p className="text-gray-700 dark:text-gray-300">
                      Chiqadigan oynada <strong>«O‘rnatish» (Install)</strong> tugmasini bosing — ilova bir zumda kompyuteringizga tushadi!
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: iPHONE / iOS */}
          {activeTab === 'ios' && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
                <strong>iPhone (Safari):</strong> Apple iOS App Store dan yuklamasdan ham, to‘g‘ridan-to‘g‘ri Asosiy ekranga to‘liq ilova sifatida o‘rnatish imkonini beradi.
              </div>

              <div className="space-y-2.5 text-xs">
                {/* Step 1 */}
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 dark:text-white block">
                      1-qadam: «Ulashish» tugmasini bosing
                    </span>
                    <p className="text-gray-600 dark:text-gray-300 mt-0.5">
                      iPhone Safari brauzeri ekranining eng pastki qismidagi o‘rtada joylashgan <strong>[ 📤 Ulashish ]</strong> (Share) belgisini bosing.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 dark:text-white block">
                      2-qadam: «Asosiy ekranga qo‘shish»ni tanlang
                    </span>
                    <p className="text-gray-600 dark:text-gray-300 mt-0.5">
                      Ochilgan menyudan biroz pastga tushib <strong>«Asosiy ekranga qo‘shish»</strong> (yoki <em>Add to Home Screen ➕</em>) tugmasini bosing.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 dark:text-white block">
                      3-qadam: «Qo‘shish» (Add) ni bosing
                    </span>
                    <p className="text-gray-600 dark:text-gray-300 mt-0.5">
                      Yuqori o‘ng burchakdagi <strong>«Qo‘shish»</strong> tugmasini bosing. EDUCO LMS xuddi Instagram yoki Telegram kabi iPhone ish stolingizda alohida ilova bo‘lib ochiladi!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ANDROID */}
          {activeTab === 'android' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
                Android telefoningizda Google Chrome orqali ilovani 1-bosishda o‘rnatib olishingiz mumkin.
              </div>

              {hasNativePrompt ? (
                <button
                  type="button"
                  onClick={handleNativeInstall}
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Android ilovani o‘rnatish</span>
                </button>
              ) : (
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                    <span className="font-bold text-emerald-600">1.</span>
                    <p className="text-gray-700 dark:text-gray-300">
                      Chrome brauzeri yuqori o‘ng burchagidagi <strong>3 nuqta (⋮)</strong> belgisini bosing.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                    <span className="font-bold text-emerald-600">2.</span>
                    <p className="text-gray-700 dark:text-gray-300">
                      Menyudan <strong>«Ilovani o‘rnatish»</strong> (yoki «Bosh ekranga qo‘shish») tugmasini bosing.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bottom Actions */}
          <div className="pt-2 flex items-center justify-between border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Avtomatik yangilanadi va xotirani kam egallaydi</span>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Tushunarli
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
