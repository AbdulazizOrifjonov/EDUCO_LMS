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
  BookOpen,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

export default function PublicFooter({ settings }) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavClick = (e, hash) => {
    if (hash && hash.startsWith('#')) {
      e.preventDefault();
      const targetId = hash.replace('#', '');
      const el = document.getElementById(targetId);
      if (el) {
        const yOffset = -80;
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer
      id="footer"
      className="relative z-20 bg-[#0B1528] dark:bg-[#050C16] text-white pt-16 pb-12 border-t border-blue-900/40 dark:border-emerald-950/70 select-none transition-colors duration-500 shadow-2xl"
    >
      <div className="max-w-[1540px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Brand Info with Official Clean EDUCO Logo */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/educo-logo-white.png"
                alt="EDUCO"
                className="h-8 sm:h-9 w-auto object-contain"
              />
            </div>

            <p className="text-xs sm:text-sm text-gray-300 dark:text-gray-400 leading-relaxed max-w-sm">
              {settings?.footer_text ||
                'EDUCO LMS — zamonaviy ta’lim, IT, xorijiy tillar va mantiqiy fanlar akademiyasi hamda innovatsion ta’lim boshqaruv ekotizimi.'}
            </p>

            {/* Official Social & Quick Contact Badges */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
                Rasmiy sahifalarimiz va aloqa:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Telegram Admin */}
                <a
                  href={settings?.telegram || "https://t.me/educomarkaz36"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 hover:bg-[#229ED9]/25 border border-white/10 hover:border-[#229ED9]/60 transition-all group"
                  title="Telegram orqali yozish"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#229ED9] text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <Send className="w-4 h-4 -ml-0.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-gray-400 block leading-tight font-medium">Telegram Admin</span>
                    <span className="text-xs font-bold text-white group-hover:text-[#229ED9] transition-colors truncate block">
                      @educomarkaz36
                    </span>
                  </div>
                </a>

                {/* Instagram */}
                <a
                  href={settings?.instagram || "https://www.instagram.com/educomarkaz?rpxt=MTFneWxqaHB1MjFmMg%3D%3D&utm_source=qr"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 hover:bg-pink-900/25 border border-white/10 hover:border-pink-500/60 transition-all group"
                  title="Instagram sahifamizga o'tish"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform font-black text-[11px]">
                    IG
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-gray-400 block leading-tight font-medium">Instagram</span>
                    <span className="text-xs font-bold text-white group-hover:text-pink-400 transition-colors truncate block">
                      @educomarkaz
                    </span>
                  </div>
                </a>
              </div>

              {/* Direct Phone Call Card */}
              <a
                href={`tel:${settings?.phone?.replace(/\D/g, '') || '998995418989'}`}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/60 transition-all group"
                title="Qo'ng'iroq qilish"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-emerald-400 block leading-tight font-medium">Qo‘ng‘iroq uchun:</span>
                  <span className="text-xs font-extrabold text-white group-hover:text-emerald-300 transition-colors">
                    {settings?.phone || '+998 (99) 541-89-89'}
                  </span>
                </div>
              </a>
            </div>
          </div>

          {/* Quick Nav Links */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 dark:bg-emerald-400" />
              <span>Tezkor Bo‘limlar</span>
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-300 dark:text-gray-400">
              <li>
                <a
                  href="#courses"
                  onClick={(e) => handleNavClick(e, '#courses')}
                  className="hover:text-blue-400 dark:hover:text-emerald-400 transition-colors"
                >
                  Barcha Kurslar
                </a>
              </li>
              <li>
                <a
                  href="#subjects"
                  onClick={(e) => handleNavClick(e, '#subjects')}
                  className="hover:text-blue-400 dark:hover:text-emerald-400 transition-colors"
                >
                  Fanlar & Yo‘nalishlar
                </a>
              </li>
              <li>
                <a
                  href="#teachers"
                  onClick={(e) => handleNavClick(e, '#teachers')}
                  className="hover:text-blue-400 dark:hover:text-emerald-400 transition-colors"
                >
                  Ustozlarimiz
                </a>
              </li>
              <li>
                <a
                  href="#gallery"
                  onClick={(e) => handleNavClick(e, '#gallery')}
                  className="hover:text-blue-400 dark:hover:text-emerald-400 transition-colors"
                >
                  Darslardan Lavhalar
                </a>
              </li>
              <li>
                <a
                  href="#news"
                  onClick={(e) => handleNavClick(e, '#news')}
                  className="hover:text-blue-400 dark:hover:text-emerald-400 transition-colors"
                >
                  Yangiliklar
                </a>
              </li>
              <li>
                <a
                  href="#videos"
                  onClick={(e) => handleNavClick(e, '#videos')}
                  className="hover:text-blue-400 dark:hover:text-emerald-400 transition-colors"
                >
                  Video Lavhalar
                </a>
              </li>
            </ul>
          </div>

          {/* Platform Links */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 dark:bg-emerald-400" />
              <span>Platforma</span>
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-300 dark:text-gray-400">
              <li>
                <a
                  href="/login"
                  className="hover:text-blue-400 dark:hover:text-emerald-400 transition-colors font-bold text-white"
                >
                  Kabinetga kirish (Login)
                </a>
              </li>
              <li>
                <a
                  href="#about"
                  onClick={(e) => handleNavClick(e, '#about')}
                  className="hover:text-blue-400 dark:hover:text-emerald-400 transition-colors"
                >
                  Biz haqimizda
                </a>
              </li>
              <li>
                <a
                  href="#stats"
                  onClick={(e) => handleNavClick(e, '#stats')}
                  className="hover:text-blue-400 dark:hover:text-emerald-400 transition-colors"
                >
                  Natijalarimiz
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  onClick={(e) => handleNavClick(e, '#contact')}
                  className="hover:text-blue-400 dark:hover:text-emerald-400 transition-colors"
                >
                  Bepul Sinov Darsi
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="lg:col-span-4 space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 dark:bg-emerald-400" />
              <span>Aloqa & Manzil</span>
            </h4>
            <div className="space-y-3 text-xs sm:text-sm text-gray-300 dark:text-gray-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-blue-400 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>{settings?.address || 'Toshkent shahar, Yunusobod tumani, Amir Temur ko‘chasi, 107-B bino'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-gray-400 block leading-tight">Telefon raqam:</span>
                  <a
                    href={`tel:${settings?.phone?.replace(/\D/g, '') || '998995418989'}`}
                    className="hover:text-emerald-400 font-bold text-white transition-colors"
                  >
                    {settings?.phone || '+998 (99) 541-89-89'}
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Send className="w-4 h-4 text-[#229ED9] shrink-0" />
                <div>
                  <span className="text-[10px] text-gray-400 block leading-tight">Telegram Admin:</span>
                  <a
                    href={settings?.telegram || "https://t.me/educomarkaz36"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#229ED9] font-bold text-white transition-colors"
                  >
                    @educomarkaz36
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-4 h-4 text-pink-400 font-black text-[11px] shrink-0 text-center">IG</span>
                <div>
                  <span className="text-[10px] text-gray-400 block leading-tight">Instagram sahifa:</span>
                  <a
                    href={settings?.instagram || "https://www.instagram.com/educomarkaz?rpxt=MTFneWxqaHB1MjFmMg%3D%3D&utm_source=qr"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-pink-400 font-bold text-white transition-colors"
                  >
                    @educomarkaz
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{settings?.working_hours || 'Dushanba - Shanba: 08:30 - 20:30'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="pt-8 border-t border-white/10 dark:border-emerald-950/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <p>© {currentYear} EDUCO Ta’lim Platformasi. Barcha huquqlar himoyalangan.</p>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={scrollToTop}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-blue-600 dark:hover:bg-emerald-600 text-gray-200 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
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
