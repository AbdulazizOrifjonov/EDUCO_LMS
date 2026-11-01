// src/pages/public/components/PublicNavbar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import useTheme from '@/hooks/useTheme';

export default function PublicNavbar({ settings }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Bosh sahifa', href: '#top' },
    { label: 'Kurslar', href: '#courses' },
    { label: 'Fanlar', href: '#subjects' },
    { label: 'Ustozlar', href: '#teachers' },
    { label: 'Dars lavhalari', href: '#gallery' },
    { label: 'Yangiliklar', href: '#news' },
    { label: 'Video lavhalar', href: '#videos' },
    { label: 'Biz haqimizda', href: '#about' },
    { label: 'Aloqa', href: '#contact' },
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
        return 'Asoschi (Boshqaruvchi)';
      case 'admin':
        return 'Administrator';
      case 'teacher':
        return 'O‘qituvchi';
      case 'student':
        return 'O‘quvchi';
      default:
        return 'Kabinet';
    }
  };

  const roleOptions = [
    {
      id: 'owner',
      title: 'Boshqaruvchi (Asoschi)',
      subtitle: 'Markaz to‘liq boshqaruvi',
      icon: Shield,
      color: 'from-amber-500 to-rose-600',
      path: '/login?role=owner',
    },
    {
      id: 'admin',
      title: 'Administrator',
      subtitle: 'Guruhlar, to‘lovlar va qabul',
      icon: UserCheck,
      color: 'from-purple-500 to-indigo-600',
      path: '/login?role=admin',
    },
    {
      id: 'teacher',
      title: 'O‘qituvchi',
      subtitle: 'Darslar, davomat va baholar',
      icon: Users,
      color: 'from-blue-500 to-cyan-600',
      path: '/login?role=teacher',
    },
    {
      id: 'student',
      title: 'O‘quvchi',
      subtitle: 'Shaxsiy darslar va reyting',
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

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 dark:bg-[#101827]/95 backdrop-blur-md shadow-md border-b border-gray-200/80 dark:border-gray-800 py-3'
          : 'bg-white/80 dark:bg-[#101827]/80 backdrop-blur-sm py-4 border-b border-gray-100 dark:border-gray-800/60'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a
            href="#top"
            onClick={(e) => handleNavClick(e, '#top')}
            className="flex items-center gap-3 group focus:outline-none"
          >
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-gradient-to-tr from-[#064e3b] via-[#047857] to-emerald-500 flex items-center justify-center text-white font-black text-xl shadow-md shadow-emerald-950/20 group-hover:scale-105 transition-transform">
              E
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-1.5 font-sans">
                EDUCO
                <span className="text-xs px-2 py-0.5 rounded-md font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-300/60 dark:border-emerald-700/60">
                  LMS
                </span>
              </span>
              <span className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 font-medium tracking-wide hidden sm:block">
                Zamonaviy Ta’lim Ekotizimi
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center space-x-1 lg:space-x-1.5 rtl:space-x-reverse">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="px-3 py-1.5 rounded-xl text-xs lg:text-[13px] font-semibold text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/30 transition-all cursor-pointer"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Yorug‘ rejim' : 'Qorong‘u rejim'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Quick Contact Hotline */}
            <a
              href={`tel:${settings?.phone || '+998936101774'}`}
              className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 bg-gray-100/80 dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{settings?.phone || '+998 93 610 17 74'}</span>
            </a>

            {/* Login / Dashboard Button Area */}
            {isAuthenticated ? (
              <div className="relative">
                <Link
                  to={getDashboardPath()}
                  className="flex items-center gap-2.5 px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/25 transition-all hover:scale-102 active:scale-98"
                >
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs text-white">
                    {(profile?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline">Kabinetga o‘tish</span>
                  <span className="sm:hidden">Kabinet</span>
                  <ArrowRight className="w-4 h-4 ml-0.5 rtl:rotate-180" />
                </Link>
              </div>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setRoleDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#064e3b] to-emerald-600 hover:from-[#053d2e] hover:to-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-950/20 transition-all hover:scale-102 active:scale-98 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Kabinetga kirish</span>
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
                        O‘z rolingizni tanlang:
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        Tizimga kirish uchun o‘z yo‘nalishingizga bosing
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
                          className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-all text-left cursor-pointer group"
                        >
                          <div
                            className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${role.color} flex items-center justify-center text-white shrink-0 shadow-sm group-hover:scale-108 transition-transform`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              {role.title}
                            </h4>
                            <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 truncate">
                              {role.subtitle}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all shrink-0" />
                        </button>
                      );
                    })}

                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                      <Link
                        to="/login"
                        onClick={() => setRoleDropdownOpen(false)}
                        className="block w-full py-2 text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        Barcha ro‘llar uchun umumiy kirish sahifasi →
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
          <div className="xl:hidden pt-4 pb-6 mt-3 border-t border-gray-100 dark:border-gray-800 animate-in fade-in slide-in-from-top-4 duration-200">
            <nav className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-800 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="pt-4 mt-3 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-2.5">
              <a
                href={`tel:${settings?.phone || '+998936101774'}`}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <PhoneCall className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Qo‘ng‘iroq: {settings?.phone || '+998 93 610 17 74'}</span>
              </a>

              {isAuthenticated ? (
                <Link
                  to={getDashboardPath()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold text-sm shadow-md"
                >
                  <span>Kabinetga o‘tish ({getRoleLabel()})</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#064e3b] to-emerald-600 text-white font-bold text-sm shadow-md"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Kabinetga kirish (Login)</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
