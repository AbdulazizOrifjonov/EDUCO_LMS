// src/pages/public/components/PublicNavbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Menu,
  X,
  LogIn,
  Sun,
  Moon,
  ArrowRight,
  Shield,
  GraduationCap,
  Users,
  ChevronDown,
  UserCheck,
  PhoneCall,
  Send,
  Sparkles,
  BookOpen,
  Image as ImageIcon,
  Newspaper,
  Video,
  Info,
  Instagram,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import useTheme from '@/hooks/useTheme';
import LanguageSelector, { LanguageFlag } from '@/components/LanguageSelector';
import { SUPPORTED_LANGUAGES } from '@/lib/constants';

const navTranslations = {
  uz: {
    home: 'Bosh sahifa',
    courses: 'Kurslar',
    subjects: 'Fanlar',
    teachers: 'Ustozlar',
    gallery: 'Dars lavhalari',
    news: 'Yangiliklar',
    videos: 'Video lavhalar',
    about: 'Biz haqimizda',
    contact: 'Aloqa',
    more: 'Yana',
    login: 'Kabinetga kirish',
    dashboard: 'Kabinetga o‘tish',
    hotline: 'Qo‘ng‘iroq',
    lightMode: 'Kunduzgi rejim (Ko‘k)',
    darkMode: 'Tungi rejim (Yashil)',
    chooseRole: 'O‘z rolingizni tanlang:',
    chooseRoleDesc: 'Tizimga kirish uchun yo‘nalishingizni tanlang',
    allRolesLogin: 'Barcha ro‘llar uchun umumiy kirish sahifasi →',
    roles: {
      owner: { title: 'Boshqaruvchi (Asoschi)', subtitle: 'Markaz to‘liq boshqaruvi' },
      admin: { title: 'Administrator', subtitle: 'Guruhlar, to‘lovlar va qabul' },
      teacher: { title: 'O‘qituvchi', subtitle: 'Darslar, davomat va baholar' },
      student: { title: 'O‘quvchi', subtitle: 'Shaxsiy darslar va reyting' },
    },
    ecosystem: 'Zamonaviy Ta’lim Ekotizimi',
  },
  ru: {
    home: 'Главная',
    courses: 'Курсы',
    subjects: 'Предметы',
    teachers: 'Преподаватели',
    gallery: 'Галерея',
    news: 'Новости',
    videos: 'Видео',
    about: 'О нас',
    contact: 'Контакты',
    more: 'Еще',
    login: 'Войти в кабинет',
    dashboard: 'Личный кабинет',
    hotline: 'Горячая линия',
    lightMode: 'Дневной режим (Синий)',
    darkMode: 'Ночной режим (Зеленый)',
    chooseRole: 'Выберите вашу роль:',
    chooseRoleDesc: 'Нажмите на ваше направление для входа',
    allRolesLogin: 'Общая страница входа для всех ролей →',
    roles: {
      owner: { title: 'Руководитель (Основатель)', subtitle: 'Полное управление центром' },
      admin: { title: 'Администратор', subtitle: 'Группы, платежи и приём' },
      teacher: { title: 'Преподаватель', subtitle: 'Уроки, посещаемость и оценки' },
      student: { title: 'Ученик', subtitle: 'Личные уроки и рейтинг' },
    },
    ecosystem: 'Современная Экосистема Обучения',
  },
  en: {
    home: 'Home',
    courses: 'Courses',
    subjects: 'Subjects',
    teachers: 'Teachers',
    gallery: 'Life at EDUCO',
    news: 'News',
    videos: 'Videos',
    about: 'About Us',
    contact: 'Contact',
    more: 'More',
    login: 'Log in to Portal',
    dashboard: 'Go to Dashboard',
    hotline: 'Hotline',
    lightMode: 'Day Mode (Blue)',
    darkMode: 'Night Mode (Green)',
    chooseRole: 'Choose your role:',
    chooseRoleDesc: 'Select your account type to access your portal',
    allRolesLogin: 'General login page for all accounts →',
    roles: {
      owner: { title: 'Director / Owner', subtitle: 'Full center administration' },
      admin: { title: 'Administrator', subtitle: 'Groups, finances & admission' },
      teacher: { title: 'Teacher / Mentor', subtitle: 'Lessons, attendance & grades' },
      student: { title: 'Student', subtitle: 'Personal lessons & rating' },
    },
    ecosystem: 'Modern Education Ecosystem',
  },
};

export default function PublicNavbar({ settings }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const moreDropdownRef = useRef(null);

  const { user, profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  const currentLang = (i18n.language?.split('-')[0] || 'uz').toLowerCase();
  const tr = navTranslations[currentLang] || navTranslations.uz;
  const isDark = theme === 'dark';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns when clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(e.target)) {
        setMoreDropdownOpen(false);
      }
    };
    if (moreDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [moreDropdownOpen]);

  // Primary links (Always visible on desktop lg+)
  const primaryLinks = [
    { label: tr.home, href: '#top' },
    { label: tr.courses, href: '#courses' },
    { label: tr.subjects, href: '#subjects' },
    { label: tr.teachers, href: '#teachers' },
    { label: tr.contact, href: '#contact' },
  ];

  // Secondary links (Nested under "Yana" on laptops, inline on 2xl screens)
  const secondaryLinks = [
    { label: tr.gallery, href: '#gallery', icon: ImageIcon },
    { label: tr.news, href: '#news', icon: Newspaper },
    { label: tr.videos, href: '#videos', icon: Video },
    { label: tr.about, href: '#about', icon: Info },
  ];

  // All links combined for mobile menu and 2xl screens
  const allNavLinks = [
    { label: tr.home, href: '#top' },
    { label: tr.courses, href: '#courses' },
    { label: tr.subjects, href: '#subjects' },
    { label: tr.teachers, href: '#teachers' },
    { label: tr.gallery, href: '#gallery' },
    { label: tr.news, href: '#news' },
    { label: tr.videos, href: '#videos' },
    { label: tr.about, href: '#about' },
    { label: tr.contact, href: '#contact' },
  ];

  const userRole = (profile?.role || user?.user_metadata?.role || '').toLowerCase();
  const isAuthenticated = Boolean(user && userRole);

  const getDashboardPath = () => {
    switch (userRole) {
      case 'owner':
        return '/owner/dashboard';
      case 'admin':
        return '/admin/dashboard';
      case 'teacher':
        return '/teacher/dashboard';
      case 'student':
        return '/student/dashboard';
      default:
        return '/login';
    }
  };

  const getRoleLabel = () => {
    switch (userRole) {
      case 'owner':
        return tr.roles.owner.title;
      case 'admin':
        return tr.roles.admin.title;
      case 'teacher':
        return tr.roles.teacher.title;
      case 'student':
        return tr.roles.student.title;
      default:
        return tr.dashboard;
    }
  };

  const handleNavClick = (e, href) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const targetId = href.replace('#', '');
      if (targetId === 'top') {
        window.dispatchEvent(new CustomEvent('educo-smooth-scroll-to', { detail: { top: 0 } }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const el = document.getElementById(targetId);
        if (el) {
          const yOffset = -80;
          const y = el.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop) + yOffset;
          window.dispatchEvent(new CustomEvent('educo-smooth-scroll-to', { detail: { top: y } }));
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }
      setMobileMenuOpen(false);
      setMoreDropdownOpen(false);
    }
  };

  const handleLanguageSelect = (langCode) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('educo-lang', langCode);
    const targetLang = SUPPORTED_LANGUAGES.find((l) => l.code === langCode);
    if (targetLang && typeof document !== 'undefined') {
      document.documentElement.setAttribute('dir', targetLang.dir || 'ltr');
      document.documentElement.setAttribute('lang', langCode);
    }
  };

  // Modern frosted glass styling based on theme and scroll position
  const headerClass = isScrolled
    ? isDark
      ? 'public-navbar-scrolled-dark shadow-md'
      : 'public-navbar-scrolled-light shadow-md'
    : isDark
      ? 'public-navbar-top-dark shadow-xs'
      : 'public-navbar-top-light shadow-xs';

  // Detect iOS (Safari, Chrome iOS, In-App webviews, and standalone PWA) to guarantee notch/status-bar clearance
  const isIos =
    typeof window !== 'undefined' &&
    (/iPhone|iPad|iPod/.test(navigator.userAgent || '') ||
      (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent || '')));

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 public-navbar-header ${headerClass}`}
      style={{
        paddingTop: isIos
          ? 'max(env(safe-area-inset-top, 44px), 44px)'
          : 'max(env(safe-area-inset-top, 0px), 8px)',
      }}
    >
      <div className="w-full max-w-[1540px] mx-auto px-2.5 sm:px-6 lg:px-8 py-2 sm:py-2.5">
        <div className="flex items-center justify-between gap-1.5 sm:gap-2.5 lg:gap-4">
          {/* 1. Official EDUCO Logo with Dual Theme (Light=Blue/Red, Dark=White/Green) */}
          <a
            href="#top"
            onClick={(e) => handleNavClick(e, '#top')}
            className="flex items-center group focus:outline-none shrink-0"
            title="EDUCO"
          >
            <img
              src="/educo-logo.png"
              alt="EDUCO"
              className="h-7 sm:h-8 lg:h-9 w-auto object-contain dark:hidden group-hover:scale-102 transition-transform"
            />
            <img
              src="/educo-logo-white.png"
              alt="EDUCO"
              className="h-7 sm:h-8 lg:h-9 w-auto object-contain hidden dark:block group-hover:scale-102 transition-transform"
            />
          </a>

          {/* 2. Responsive Desktop Navigation Links */}
          {/* 2A: Widescreen view (>= 2xl: 1536px): Show all 9 links */}
          <nav className="hidden 2xl:flex items-center space-x-1 rtl:space-x-reverse">
            {allNavLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-700 hover:bg-blue-50/90 dark:hover:text-emerald-400 dark:hover:bg-emerald-950/40 transition-all cursor-pointer whitespace-nowrap"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* 2B: Laptop / Desktop view (lg to 2xl: 1024px to 1535px): Show primary 5 links + "Yana" dropdown */}
          <nav className="hidden lg:flex 2xl:hidden items-center space-x-0.5 xl:space-x-1 rtl:space-x-reverse">
            {primaryLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="px-2 xl:px-2.5 py-1.5 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-700 hover:bg-blue-50/90 dark:hover:text-emerald-400 dark:hover:bg-emerald-950/40 transition-all cursor-pointer whitespace-nowrap"
              >
                {link.label}
              </a>
            ))}

            {/* "Yana" (More) dropdown for secondary sections */}
            <div className="relative" ref={moreDropdownRef}>
              <button
                type="button"
                onClick={() => setMoreDropdownOpen((prev) => !prev)}
                className="inline-flex items-center gap-1 px-2 xl:px-2.5 py-1.5 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-700 hover:bg-blue-50/90 dark:hover:text-emerald-400 dark:hover:bg-emerald-950/40 transition-all cursor-pointer whitespace-nowrap"
              >
                <span>{tr.more}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${moreDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {moreDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white dark:bg-[#0f172a] p-1.5 shadow-2xl border border-gray-100 dark:border-gray-800 space-y-0.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {secondaryLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <a
                        key={item.href}
                        href={item.href}
                        onClick={(e) => handleNavClick(e, item.href)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-blue-50/90 hover:text-blue-700 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                      >
                        <Icon className="w-4 h-4 opacity-75 shrink-0" />
                        <span>{item.label}</span>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* 3. Right Action Area: Hotline, Telegram, Instagram, Languages, Kun/Tun Toggle, Kabinetga kirish */}
          <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2 shrink-0">
            {/* Quick Hotline Pill */}
            <a
              href={`tel:${settings?.phone?.replace(/\D/g, '') || '998995418989'}`}
              className="hidden xl:flex items-center gap-2 h-9 px-3 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 border border-gray-200/80 dark:border-gray-700 bg-gray-50/80 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 dark:bg-gray-800/80 dark:hover:bg-gray-700 transition-colors shrink-0"
              title="Qo‘ng‘iroq qilish"
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="whitespace-nowrap">{settings?.phone || '+998 (99) 541-89-89'}</span>
            </a>

            {/* Telegram Admin Quick Icon */}
            <a
              href={settings?.telegram || "https://t.me/educomarkaz36"}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center justify-center w-9 h-9 rounded-xl text-[#229ED9] border border-gray-200/80 dark:border-gray-700 bg-gray-50/80 hover:bg-[#229ED9]/15 hover:border-[#229ED9]/40 dark:bg-gray-800/80 transition-all hover:scale-105 shrink-0"
              title="Telegram Admin (@educomarkaz36)"
            >
              <Send className="w-4 h-4 shrink-0" />
            </a>

            {/* Instagram Quick Icon */}
            <a
              href={settings?.instagram || "https://www.instagram.com/educomarkaz?rpxt=MTFneWxqaHB1MjFmMg%3D%3D&utm_source=qr"}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center justify-center w-9 h-9 rounded-xl text-white bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] hover:opacity-90 hover:scale-105 transition-all shrink-0 shadow-xs"
              title="Instagram (@educomarkaz)"
            >
              <Instagram className="w-4 h-4 text-white stroke-[2.2]" />
            </a>

            {/* Language Selector Dropdown (UZ / EN / RU) */}
            <div className="shrink-0">
              <LanguageSelector className="shrink-0" align="auto" />
            </div>

            {/* Kun / Tun Theme Toggle Button (Kun: Blue accent with Moon, Tun: Gold/Green with Sun) */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`h-9 w-9 sm:h-10 sm:w-10 inline-flex items-center justify-center rounded-xl border transition-all shadow-xs cursor-pointer shrink-0 ${
                isDark
                  ? 'border-emerald-700/60 bg-emerald-950/40 text-amber-400 hover:bg-emerald-900/60 hover:scale-105 active:scale-95'
                  : 'border-blue-200/90 bg-blue-50/80 text-blue-700 hover:bg-blue-100 hover:scale-105 active:scale-95'
              }`}
              title={isDark ? tr.lightMode : tr.darkMode}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 transition-transform hover:rotate-45" />
              ) : (
                <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-700 transition-transform hover:-rotate-12" />
              )}
            </button>

            {/* Login / Dashboard Button Area (Always Visible & Prominent) */}
            {isAuthenticated ? (
              <div className="relative shrink-0">
                <Link
                  to={getDashboardPath()}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 h-9 sm:h-10 rounded-xl text-white font-bold text-xs sm:text-sm shadow-md transition-all hover:scale-102 active:scale-98 ${
                    isDark
                      ? 'bg-gradient-to-r from-[#064e3b] via-emerald-600 to-teal-700 hover:from-[#053d2e] hover:to-emerald-800 shadow-emerald-950/40'
                      : 'bg-gradient-to-r from-[#123D78] via-[#1a4f94] to-[#123D78] hover:from-[#0d2d59] hover:to-[#0d2d59] shadow-blue-900/25'
                  }`}
                >
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/20 flex items-center justify-center font-bold text-[10px] sm:text-xs text-white">
                    {(profile?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline whitespace-nowrap">{tr.dashboard}</span>
                  <span className="sm:hidden font-bold whitespace-nowrap">
                    {currentLang === 'ru' ? 'Кабинет' : currentLang === 'en' ? 'Portal' : 'Kabinet'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 rtl:rotate-180" />
                </Link>
              </div>
            ) : (
              <div className="relative shrink-0">
                <Link
                  to="/login"
                  className={`flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 h-9 sm:h-10 rounded-xl text-white font-bold text-xs sm:text-sm shadow-md transition-all hover:scale-102 active:scale-98 cursor-pointer ${
                    isDark
                      ? 'bg-gradient-to-r from-[#064e3b] via-emerald-600 to-teal-700 hover:from-[#053d2e] hover:to-emerald-800 shadow-emerald-950/40 ring-1 ring-emerald-400/30'
                      : 'bg-gradient-to-r from-[#123D78] via-[#1a4f94] to-[#123D78] hover:from-[#0d2d59] hover:to-[#0d2d59] shadow-blue-900/25 ring-1 ring-blue-300/30'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="hidden sm:inline whitespace-nowrap">{tr.login}</span>
                  <span className="sm:hidden font-bold whitespace-nowrap">
                    {currentLang === 'ru' ? 'Войти' : currentLang === 'en' ? 'Login' : 'Kirish'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 rtl:rotate-180 hidden sm:inline" />
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="p-2 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden transition-colors cursor-pointer shrink-0"
              aria-label="Menyu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Navigation Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden pt-3 pb-6 mt-2 border-t border-gray-100 dark:border-gray-800 max-h-[calc(80vh-env(safe-area-inset-top,0px))] overflow-y-auto animate-in fade-in slide-in-from-top-4 duration-200 space-y-4 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]">
            {/* Quick 1-tap Language Switcher for Mobile */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-100 dark:bg-gray-800/80 border border-gray-200/80 dark:border-gray-700">
              {[
                { code: 'uz', label: "O'zbek", flag: 'uz' },
                { code: 'ru', label: 'Русский', flag: 'ru' },
                { code: 'en', label: 'English', flag: 'en' },
              ].map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleLanguageSelect(lang.code)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                    currentLang === lang.code
                      ? 'bg-white dark:bg-gray-700 text-blue-700 dark:text-emerald-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <LanguageFlag code={lang.code} className="w-4 h-3" />
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>

            {/* Nav Links */}
            <nav className="flex flex-col space-y-1">
              {allNavLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-800 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-emerald-950/40 hover:text-blue-700 dark:hover:text-emerald-400 transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-2.5">
              <a
                href={`tel:${settings?.phone?.replace(/\D/g, '') || '998995418989'}`}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors"
              >
                <PhoneCall className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{tr.hotline}: {settings?.phone || '+998 (99) 541-89-89'}</span>
              </a>

              {/* Mobile Quick Socials */}
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={settings?.telegram || "https://t.me/educomarkaz36"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-[#229ED9]/10 text-[#229ED9] border border-[#229ED9]/30 transition-colors"
                >
                  <Send className="w-3.5 h-3.5 -ml-0.5" />
                  <span>@educomarkaz36</span>
                </a>
                <a
                  href={settings?.instagram || "https://www.instagram.com/educomarkaz?rpxt=MTFneWxqaHB1MjFmMg%3D%3D&utm_source=qr"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/30 transition-colors"
                >
                  <Instagram className="w-4 h-4 text-pink-600 dark:text-pink-400 stroke-[2.2]" />
                  <span>@educomarkaz</span>
                </a>
              </div>

              {isAuthenticated ? (
                <Link
                  to={getDashboardPath()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-emerald-600 dark:to-teal-700 text-white font-bold text-sm shadow-md"
                >
                  <span>{tr.dashboard} ({getRoleLabel()})</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </Link>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#123D78] via-[#1a4f94] to-[#123D78] dark:from-[#064e3b] dark:to-emerald-600 text-white font-bold text-sm shadow-md"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{tr.login}</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
