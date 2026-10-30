import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe, Sun, Moon, GraduationCap, Sparkles } from 'lucide-react';
import useTheme from '@/hooks/useTheme';
import { SUPPORTED_LANGUAGES } from '@/lib/constants';
import { LanguageFlag } from '@/components/LanguageSelector';

export default function AuthLayout() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const currentLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language) ||
    SUPPORTED_LANGUAGES[0];

  const isRtl = i18n.dir ? i18n.dir() === 'rtl' : currentLang.dir === 'rtl';

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    const targetLang = SUPPORTED_LANGUAGES.find((l) => l.code === langCode);
    const dir = targetLang?.dir || 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = langCode;
    setLangMenuOpen(false);
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#0b2447] via-[#123D78] to-[#1a4f9a] p-4 sm:p-6 lg:p-8 dark:from-[#080d17] dark:via-[#101827] dark:to-[#162235]"
    >
      {/* Decorative background glow & mesh circles */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-red-500/15 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-indigo-500/10 blur-[100px]" />

      {/* Top bar with Language Selector and Theme Toggle */}
      <header className="absolute top-4 inset-x-4 sm:inset-x-8 flex items-center justify-between z-20">
        <Link
          to="/"
          className="flex items-center gap-2 text-white/80 hover:text-white transition-opacity"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 backdrop-blur-md border border-white/20">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold tracking-wider text-sm hidden sm:inline-block">
            EDUCO
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white backdrop-blur-md transition-all hover:bg-white/20 border border-white/15"
              aria-label="Change language"
            >
              <LanguageFlag code={currentLang.code} className="w-5 h-3.5" />
              <span className="uppercase">{currentLang.code}</span>
            </button>

            {langMenuOpen && (
              <div
                className={`absolute top-full mt-2 w-40 rounded-xl border border-white/20 bg-[#123D78] p-1.5 shadow-2xl backdrop-blur-xl dark:border-gray-700 dark:bg-[#101827] z-50
                  ${isRtl ? 'left-0' : 'right-0'}
                `}
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors
                      ${
                        i18n.language === lang.code
                          ? 'bg-[#F12D3A] text-white'
                          : 'text-white/80 hover:bg-white/15 hover:text-white dark:text-gray-300 dark:hover:bg-gray-800'
                      }
                    `}
                  >
                    <span className="flex items-center gap-2">
                      <LanguageFlag code={lang.code} className="w-4 h-3" />
                      <span>{lang.nativeName}</span>
                    </span>
                    <span className="text-[10px] uppercase opacity-70">
                      {lang.code}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-xl bg-white/10 p-2 text-white backdrop-blur-md transition-all hover:bg-white/20 border border-white/15"
            title={
              theme === 'dark'
                ? t('common.lightMode', 'Light Mode')
                : t('common.darkMode', 'Dark Mode')
            }
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-300" />
            ) : (
              <Moon className="h-4 w-4 text-white" />
            )}
          </button>
        </div>
      </header>

      {/* Main Auth Card Container */}
      <div className="relative z-10 w-full max-w-md my-auto pt-16 pb-8">
        <div className="rounded-3xl border border-white/20 bg-white/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl transition-all dark:border-gray-800 dark:bg-[#1a2332]/95 sm:rounded-[2rem]">
          {/* Logo Header */}
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-3 flex items-center justify-center">
              <img
                src="/educo-logo.png"
                alt="EDUCO LMS"
                className="h-12 sm:h-14 w-auto object-contain dark:hidden"
              />
              <img
                src="/educo-logo-white.png"
                alt="EDUCO LMS"
                className="h-12 sm:h-14 w-auto object-contain hidden dark:block"
              />
            </div>

            <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
              {t('auth.welcomeToEduco', 'Enterprise Education & Learning Management')}
            </p>
          </div>

          {/* Child Auth Forms (Login, Forgot Password, Reset Password, etc.) */}
          <div className="mt-2">
            <Outlet />
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-white/70">
          <p>© {new Date().getFullYear()} EDUCO LMS. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
