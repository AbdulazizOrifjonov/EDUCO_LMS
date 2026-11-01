// src/pages/public/components/PublicFooter.jsx
import React from 'react';
import {
  Send,
  Phone,
  Mail,
  MapPin,
  Clock,
  ArrowUp,
  Heart,
} from 'lucide-react';

export default function PublicFooter({ settings }) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-950 text-white pt-16 pb-12 border-t border-gray-800/80 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Brand Info with Official EDUCO Logo */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/educo-logo-white.png"
                alt="EDUCO"
                className="h-8 sm:h-9 w-auto object-contain"
              />
              <span className="text-xs px-2 py-0.5 rounded-md font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-400/30">
                LMS
              </span>
            </div>

            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed max-w-sm">
              {settings?.footer_text ||
                'EDUCO LMS — zamonaviy o‘quv markazlari, o‘qituvchilar va talabalar uchun yagona innovatsion ta’lim boshqaruv platformasi.'}
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-2.5 pt-2">
              {settings?.telegram && (
                <a
                  href={settings.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-gray-900 hover:bg-blue-600 text-gray-300 hover:text-white flex items-center justify-center transition-all hover:scale-110"
                  title="Telegram"
                >
                  <Send className="w-4 h-4" />
                </a>
              )}
              {settings?.instagram && (
                <a
                  href={settings.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-gray-900 hover:bg-pink-600 text-gray-300 hover:text-white flex items-center justify-center transition-all hover:scale-110"
                  title="Instagram"
                >
                  <span className="text-xs font-bold">IG</span>
                </a>
              )}
              {settings?.youtube && (
                <a
                  href={settings.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-gray-900 hover:bg-red-600 text-gray-300 hover:text-white flex items-center justify-center transition-all hover:scale-110"
                  title="YouTube"
                >
                  <span className="text-xs font-bold">YT</span>
                </a>
              )}
              {settings?.facebook && (
                <a
                  href={settings.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-gray-900 hover:bg-blue-700 text-gray-300 hover:text-white flex items-center justify-center transition-all hover:scale-110"
                  title="Facebook"
                >
                  <span className="text-xs font-bold">FB</span>
                </a>
              )}
            </div>
          </div>

          {/* Quick Nav Links */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Tezkor Bo‘limlar
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
              <li>
                <a href="#courses" className="hover:text-blue-400 dark:hover:text-emerald-400 transition-colors">
                  Barcha Kurslar
                </a>
              </li>
              <li>
                <a href="#subjects" className="hover:text-blue-400 dark:hover:text-emerald-400 transition-colors">
                  Fanlar & Yo‘nalishlar
                </a>
              </li>
              <li>
                <a href="#teachers" className="hover:text-blue-400 dark:hover:text-emerald-400 transition-colors">
                  Ustozlarimiz
                </a>
              </li>
              <li>
                <a href="#gallery" className="hover:text-blue-400 dark:hover:text-emerald-400 transition-colors">
                  Darslardan Lavhalar
                </a>
              </li>
              <li>
                <a href="#news" className="hover:text-blue-400 dark:hover:text-emerald-400 transition-colors">
                  Yangiliklar
                </a>
              </li>
              <li>
                <a href="#videos" className="hover:text-blue-400 dark:hover:text-emerald-400 transition-colors">
                  Video Lavhalar
                </a>
              </li>
            </ul>
          </div>

          {/* Platform Links */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Platforma
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
              <li>
                <a href="/login" className="hover:text-blue-400 dark:hover:text-emerald-400 transition-colors">
                  Kabinetga kirish (Login)
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-blue-400 dark:hover:text-emerald-400 transition-colors">
                  Biz haqimizda
                </a>
              </li>
              <li>
                <a href="#stats" className="hover:text-blue-400 dark:hover:text-emerald-400 transition-colors">
                  Natijalarimiz
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-blue-400 dark:hover:text-emerald-400 transition-colors">
                  Bepul Sinov Darsi
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="lg:col-span-4 space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Aloqa & Manzil
            </h4>
            <div className="space-y-2.5 text-xs sm:text-sm text-gray-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-blue-400 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>{settings?.address || 'Toshkent shahar, Yunusobod tumani, Amir Temur ko‘chasi, 107-B bino'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-blue-400 dark:text-emerald-400 shrink-0" />
                <a href={`tel:${settings?.phone || '+998936101774'}`} className="hover:text-white transition-colors">
                  {settings?.phone || '+998 (93) 610-17-74'}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-blue-400 dark:text-emerald-400 shrink-0" />
                <a href={`mailto:${settings?.email || 'info@educo-lms.uz'}`} className="hover:text-white transition-colors">
                  {settings?.email || 'info@educo-lms.uz'}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-blue-400 dark:text-emerald-400 shrink-0" />
                <span>{settings?.working_hours || 'Dushanba - Shanba: 08:30 - 20:30'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="pt-8 border-t border-gray-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© {currentYear} EDUCO LMS Ta’lim Platformasi. Barcha huquqlar himoyalangan.</p>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={scrollToTop}
              className="p-2.5 rounded-xl bg-gray-900 hover:bg-blue-600 dark:hover:bg-emerald-600 text-gray-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Yuqoriga qaytish"
            >
              <span>Tepaga</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
