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
  Award,
  ChevronDown,
  UserCheck,
  PhoneCall,
  Sparkles,
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
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const roleDropdownRef = useRef(null);

  const { user, profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  const currentLang = (i18n.language?.split('-')[0] || 'uz').toLowerCase();
  const tr = navTranslations[currentLang] || navTranslations.uz;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target)) {
        setRoleDropdownOpen(false);
      }
    };
    if (roleDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [roleDropdownOpen]);

  const navLinks = [
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

  const roleOptions = [
    {
      id: 'owner',
      title: tr.roles.owner.title,
      subtitle: tr.roles.owner.subtitle,
      icon: Shield,
      color: 'from-amber-500 to-rose-600',
      path: '/login?role=owner',
    },
    {
      id: 'admin',
      title: tr.roles.admin.title,
      subtitle: tr.roles.admin.subtitle,
      icon: UserCheck,
      color: 'from-purple-500 to-indigo-600',
      path: '/login?role=admin',
    },
    {
      id: 'teacher',
      title: tr.roles.teacher.title,
      subtitle: tr.roles.teacher.subtitle,
      icon: Users,
      color: 'from-blue-500 to-cyan-600',
      path: '/login?role=teacher',
    },
    {
      id: 'student',
      title: tr.roles.student.title,
      subtitle: tr.roles.student.subtitle,
      icon: GraduationCap,
      color: 'from-emerald-500 to-teal-600',
      path: '/login?role=student',
    },
  ];

  const handleNavClick = (e, href) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const targetId = href.replace('#', '');
      if (targetId === 'top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const el = document.getElementById(targetId);
        if (el) {
          const yOffset = -80;
          const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }
      setMobileMenuOpen(false);
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

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md shadow-md border-b border-gray-200/90 dark:border-gray-800/90 py-2.5 sm:py-3'
          : 'bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-sm py-3.5 sm:py-4 border-b border-gray-100 dark:border-gray-800/60'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          {/* 1. Official EDUCO Logo with Dual Theme (Light=Blue/Red, Dark=White/Green) */}
          <a
            href="#top"
            onClick={(e) => handleNavClick(e, '#top')}
            className="flex items-center gap-2.5 sm:gap-3 group focus:outline-none shrink-0"
            title="EDUCO LMS"
          >
            <div className="flex items-center">
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
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] sm:text-[11px] font-black px-1.5 sm:px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/90 dark:bg-emerald-950/80 dark:text-emerald-400 dark:border-emerald-700/60 shadow-xs transition-colors">
                  LMS
                </span>
              </div>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium tracking-tight hidden 2xl:block">
                {tr.ecosystem}
              </span>
            </div>
          </a>

          {/* 2. Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center space-x-0.5 2xl:space-x-1 rtl:space-x-reverse">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="px-2.5 2xl:px-3 py-1.5 rounded-xl text-xs 2xl:text-[13px] font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-700 hover:bg-blue-50/90 dark:hover:text-emerald-400 dark:hover:bg-emerald-950/40 transition-all cursor-pointer whitespace-nowrap"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* 3. Right Action Area: Hotline, Languages, Theme, Login */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Quick Contact Hotline Pill */}
            <a
              href={`tel:${settings?.phone || '+998936101774'}`}
              className="hidden 2xl:flex items-center gap-2 h-10 px-3 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 border border-gray-200/80 dark:border-gray-700 bg-gray-50/80 hover:bg-blue-50/90 hover:text-blue-700 hover:border-blue-200/90 dark:bg-gray-800/80 dark:hover:bg-gray-700 transition-colors shrink-0"
              title="Qo‘ng‘iroq qilish"
            >
              <PhoneCall className="w-3.5 h-3.5 text-blue-600 dark:text-emerald-400 shrink-0" />
              <span className="whitespace-nowrap">{settings?.phone || '+998 93 610 17 74'}</span>
            </a>

            {/* Official Language Selector Dropdown (UZ / EN / RU) */}
            <div className="shrink-0">
              <LanguageSelector className="shrink-0" />
            </div>

            {/* Day / Night Theme Toggle Button (Kun: Moon/Blue, Tun: Sun/Gold) */}
            <button
              type="button"
              onClick={toggleTheme}
              className="h-10 w-10 inline-flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 hover:bg-blue-50 hover:text-blue-700 dark:bg-gray-800/80 dark:hover:bg-emerald-950/40 text-gray-700 dark:text-gray-200 transition-colors shadow-xs cursor-pointer shrink-0"
              title={theme === 'dark' ? tr.lightMode : tr.darkMode}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-400 transition-transform hover:rotate-45" />
              ) : (
                <Moon className="w-5 h-5 text-blue-600 transition-transform hover:-rotate-12" />
              )}
            </button>

            {/* Login / Dashboard Button Area */}
            {isAuthenticated ? (
              <div className="relative shrink-0">
                <Link
                  to={getDashboardPath()}
                  className="flex items-center gap-2 px-3 sm:px-4 h-10 rounded-xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 dark:from-emerald-600 dark:to-teal-700 dark:hover:from-emerald-700 dark:hover:to-teal-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-700/25 dark:shadow-emerald-950/30 transition-all hover:scale-102 active:scale-98"
                >
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs text-white">
                    {(profile?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline whitespace-nowrap">{tr.dashboard}</span>
                  <span className="sm:hidden">Kabinet</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </Link>
              </div>
            ) : (
              <div className="relative shrink-0" ref={roleDropdownRef}>
                <button
                  type="button"
                  onClick={() => setRoleDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 h-10 rounded-xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 dark:from-[#064e3b] dark:via-emerald-600 dark:to-teal-700 dark:hover:from-[#053d2e] dark:hover:to-emerald-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-700/25 dark:shadow-emerald-950/40 transition-all hover:scale-102 active:scale-98 cursor-pointer"
                >
                  <LogIn className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">{tr.login}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 opacity-80 transition-transform duration-200 ${
                      roleDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Role Picker Dropdown Popover */}
                {roleDropdownOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white dark:bg-[#1a2332] p-2.5 shadow-2xl border border-gray-100 dark:border-gray-700/80 space-y-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                  >
                    <div className="px-2.5 py-1.5 border-b border-gray-100 dark:border-gray-800">
                      <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                        {tr.chooseRole}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        {tr.chooseRoleDesc}
                      </p>
                    </div>

                    {roleOptions.map((role) => {
                      const Icon = role.icon;
                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => {
                            setRoleDropdownOpen(false);
                            navigate(role.path);
                          }}
                          className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-blue-50/70 dark:hover:bg-gray-800/80 transition-all text-left cursor-pointer group"
                        >
                          <div
                            className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${role.color} flex items-center justify-center text-white shrink-0 shadow-sm group-hover:scale-108 transition-transform`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-emerald-400 transition-colors">
                              {role.title}
                            </h4>
                            <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 truncate">
                              {role.subtitle}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-emerald-400 group-hover:translate-x-1 transition-all shrink-0 rtl:rotate-180" />
                        </button>
                      );
                    })}

                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                      <Link
                        to="/login"
                        onClick={() => setRoleDropdownOpen(false)}
                        className="block w-full py-2 text-center text-xs font-semibold text-blue-600 dark:text-emerald-400 hover:underline"
                      >
                        {tr.allRolesLogin}
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="p-2 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 xl:hidden transition-colors cursor-pointer"
              aria-label="Menyu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Navigation Menu */}
        {mobileMenuOpen && (
          <div className="xl:hidden pt-4 pb-6 mt-3 border-t border-gray-100 dark:border-gray-800 animate-in fade-in slide-in-from-top-4 duration-200 space-y-4">
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
              {navLinks.map((link) => (
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
                href={`tel:${settings?.phone || '+998936101774'}`}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <PhoneCall className="w-4 h-4 text-blue-600 dark:text-emerald-400" />
                <span>{tr.hotline}: {settings?.phone || '+998 93 610 17 74'}</span>
              </a>

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
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 dark:from-[#064e3b] dark:to-emerald-600 text-white font-bold text-sm shadow-md"
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
