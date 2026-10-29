import React from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown } from 'lucide-react';
import Dropdown from '@/components/ui/Dropdown';
import { SUPPORTED_LANGUAGES } from '@/lib/constants';

export function LanguageFlag({ code, className = 'w-5 h-3.5' }) {
  switch (code) {
    case 'uz':
      // Flag of Uzbekistan
      return (
        <svg
          viewBox="0 0 36 24"
          className={`${className} rounded-[3px] shadow-sm shrink-0 overflow-hidden border border-black/10 dark:border-white/10`}
          aria-hidden="true"
        >
          <rect width="36" height="7.5" y="0" fill="#0099B5" />
          <rect width="36" height="0.8" y="7.5" fill="#CE1126" />
          <rect width="36" height="7.4" y="8.3" fill="#FFFFFF" />
          <rect width="36" height="0.8" y="15.7" fill="#CE1126" />
          <rect width="36" height="7.5" y="16.5" fill="#1EB53A" />
          {/* Crescent */}
          <circle cx="6.2" cy="3.8" r="2.3" fill="#FFFFFF" />
          <circle cx="7.0" cy="3.8" r="1.9" fill="#0099B5" />
          {/* Stars */}
          <g fill="#FFFFFF">
            <circle cx="10.5" cy="2.2" r="0.45" />
            <circle cx="12.2" cy="2.2" r="0.45" />
            <circle cx="13.9" cy="2.2" r="0.45" />
            <circle cx="9.6" cy="3.7" r="0.45" />
            <circle cx="11.3" cy="3.7" r="0.45" />
            <circle cx="13.0" cy="3.7" r="0.45" />
            <circle cx="14.7" cy="3.7" r="0.45" />
            <circle cx="8.8" cy="5.2" r="0.45" />
            <circle cx="10.5" cy="5.2" r="0.45" />
            <circle cx="12.2" cy="5.2" r="0.45" />
            <circle cx="13.9" cy="5.2" r="0.45" />
            <circle cx="15.6" cy="5.2" r="0.45" />
          </g>
        </svg>
      );

    case 'ru':
      // Flag of Russia
      return (
        <svg
          viewBox="0 0 36 24"
          className={`${className} rounded-[3px] shadow-sm shrink-0 overflow-hidden border border-black/10 dark:border-white/10`}
          aria-hidden="true"
        >
          <rect width="36" height="8" y="0" fill="#FFFFFF" />
          <rect width="36" height="8" y="8" fill="#0039A6" />
          <rect width="36" height="8" y="16" fill="#D52B1E" />
        </svg>
      );

    case 'en':
      // Flag of USA / English
      return (
        <svg
          viewBox="0 0 36 24"
          className={`${className} rounded-[3px] shadow-sm shrink-0 overflow-hidden border border-black/10 dark:border-white/10`}
          aria-hidden="true"
        >
          <rect width="36" height="24" fill="#FFFFFF" />
          <rect width="36" height="1.85" y="0" fill="#B22234" />
          <rect width="36" height="1.85" y="3.7" fill="#B22234" />
          <rect width="36" height="1.85" y="7.4" fill="#B22234" />
          <rect width="36" height="1.85" y="11.1" fill="#B22234" />
          <rect width="36" height="1.85" y="14.8" fill="#B22234" />
          <rect width="36" height="1.85" y="18.5" fill="#B22234" />
          <rect width="36" height="1.85" y="22.15" fill="#B22234" />
          <rect width="15.5" height="12.95" x="0" y="0" fill="#3C3B6E" />
          <g fill="#FFFFFF">
            <circle cx="2.6" cy="2.2" r="0.65" />
            <circle cx="5.8" cy="2.2" r="0.65" />
            <circle cx="9.0" cy="2.2" r="0.65" />
            <circle cx="12.2" cy="2.2" r="0.65" />
            <circle cx="4.2" cy="4.3" r="0.65" />
            <circle cx="7.4" cy="4.3" r="0.65" />
            <circle cx="10.6" cy="4.3" r="0.65" />
            <circle cx="2.6" cy="6.4" r="0.65" />
            <circle cx="5.8" cy="6.4" r="0.65" />
            <circle cx="9.0" cy="6.4" r="0.65" />
            <circle cx="12.2" cy="6.4" r="0.65" />
            <circle cx="4.2" cy="8.5" r="0.65" />
            <circle cx="7.4" cy="8.5" r="0.65" />
            <circle cx="10.6" cy="8.5" r="0.65" />
            <circle cx="2.6" cy="10.6" r="0.65" />
            <circle cx="5.8" cy="10.6" r="0.65" />
            <circle cx="9.0" cy="10.6" r="0.65" />
            <circle cx="12.2" cy="10.6" r="0.65" />
          </g>
        </svg>
      );

    default:
      return null;
  }
}

export default function LanguageSelector({ className = '' }) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.split('-')[0] || 'uz';

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('educo-lang', langCode);

    // Apply RTL direction if needed
    const targetLang = SUPPORTED_LANGUAGES.find((l) => l.code === langCode);
    if (targetLang && typeof document !== 'undefined') {
      document.documentElement.setAttribute('dir', targetLang.dir || 'ltr');
      document.documentElement.setAttribute('lang', langCode);
    }
  };

  const activeLangConfig =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  const dropdownItems = SUPPORTED_LANGUAGES.map((lang) => ({
    label: (
      <div className="flex items-center justify-between w-full">
        <span className="flex items-center gap-2.5">
          <LanguageFlag code={lang.code} className="w-5 h-3.5" />
          <span className="font-medium">{lang.nativeName}</span>
          <span className="text-xs text-gray-400">({lang.code.toUpperCase()})</span>
        </span>
        {currentLang === lang.code && (
          <Check className="w-4 h-4 text-brand-navy dark:text-blue-400 ml-2" />
        )}
      </div>
    ),
    onClick: () => handleLanguageChange(lang.code),
  }));

  return (
    <Dropdown
      className={className}
      trigger={
        <button
          type="button"
          aria-label="Select language"
          className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-xs"
        >
          <LanguageFlag code={activeLangConfig.code} className="w-5 h-3.5 shrink-0" />
          <span className="hidden sm:inline font-semibold uppercase text-xs">{activeLangConfig.code}</span>
          <ChevronDown className="hidden sm:inline w-3.5 h-3.5 text-gray-400" />
        </button>
      }
      items={dropdownItems}
      align="right"
    />
  );
}
