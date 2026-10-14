import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  User,
  Settings,
  LogOut,
  ChevronDown,
  CheckCircle2,
  Clock,
  Check,
  AlertCircle,
  HelpCircle,
  Camera,
} from 'lucide-react';
import Sidebar from './Sidebar';
import LanguageSelector from '@/components/LanguageSelector';
import useAuth from '@/hooks/useAuth';
import useTheme from '@/hooks/useTheme';
import useNotifications from '@/hooks/useNotifications';
import { SUPPORTED_LANGUAGES, ROLES } from '@/lib/constants';
import { uploadAvatar } from '@/services/settingsService';

export default function DashboardLayout({
  sidebarItems = [],
  role = 'student',
  children,
}) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const { user, profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const {
    notifications = [],
    unreadCount = 0,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  // Layout states
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const userDropdownRef = useRef(null);
  const notifDropdownRef = useRef(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target)
      ) {
        setUserDropdownOpen(false);
      }
      if (
        notifDropdownRef.current &&
        !notifDropdownRef.current.contains(event.target)
      ) {
        setNotifDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Sync RTL direction
  const currentLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language) ||
    SUPPORTED_LANGUAGES[0];
  const isRtl = i18n.dir ? i18n.dir() === 'rtl' : currentLang.dir === 'rtl';

  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  }, [isRtl]);

  // Derived user details
  const displayName =
    profile?.full_name ||
    profile?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'User';

  const userEmail = profile?.email || user?.email || '';
  const userRole = (
    profile?.role ||
    user?.user_metadata?.role ||
    role ||
    'student'
  ).toLowerCase();

  const initials =
    displayName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'U';

  // Compute Page Title based on current route or active item
  const getPageTitle = () => {
    const activeItem = sidebarItems.find(
      (item) => item.path === location.pathname
    );
    if (activeItem) {
      if (activeItem.labelKey) return t(activeItem.labelKey, activeItem.label);
      if (typeof activeItem.label === 'string') {
        const key = `nav.${activeItem.label.toLowerCase().replace(/\s+/g, '')}`;
        const translated = t(key);
        return translated !== key ? translated : activeItem.label;
      }
      return activeItem.label;
    }

    // Fallbacks based on path segments
    const segments = location.pathname.split('/').filter(Boolean);
    if (segments.length === 0 || (segments.length === 1 && ['owner', 'admin', 'teacher', 'student'].includes(segments[0]))) {
      return t('nav.dashboard', 'Dashboard');
    }
    const lastSegment = segments[segments.length - 1];
    const navKey = `nav.${lastSegment}`;
    const translated = t(navKey);
    return translated !== navKey
      ? translated
      : lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
  };

  const handleLogout = async () => {
    setUserDropdownOpen(false);
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search or trigger search event
      console.log('Search query:', searchQuery);
    }
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#EFECE4] text-slate-900 transition-colors duration-200 dark:bg-[#101827] dark:text-gray-100 flex overflow-x-hidden w-full max-w-full"
    >
      {/* Sidebar Component */}
      <Sidebar
        items={sidebarItems}
        role={userRole}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Wrapper */}
      <div
        className={`flex min-h-screen min-w-0 flex-1 flex-col pt-16 transition-all duration-300 ease-in-out overflow-x-hidden
          ${
            collapsed
              ? isRtl
                ? 'lg:mr-20'
                : 'lg:ml-20'
              : isRtl
              ? 'lg:mr-64'
              : 'lg:ml-64'
          }
          w-full
        `}
      >
        {/* Top Navigation Bar (Fixed at top on scroll) */}
        <header
          className={`fixed top-0 z-40 flex h-16 items-center justify-between border-b border-[#D8D1C2] bg-[#F8F5EC]/95 px-3 sm:px-6 shadow-sm backdrop-blur-md transition-all duration-300 ease-in-out dark:border-gray-800 dark:bg-[#101827]/95
            ${
              collapsed
                ? isRtl
                  ? 'left-0 right-0 lg:right-20'
                  : 'left-0 right-0 lg:left-20'
                : isRtl
                ? 'left-0 right-0 lg:right-64'
                : 'left-0 right-0 lg:left-64'
            }
          `}
        >
          {/* Left section: Hamburger (mobile) + Page Title */}
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 mr-2">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="shrink-0 rounded-lg p-1.5 sm:p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white lg:hidden"
              aria-label="Open mobile menu"
            >
              <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="truncate whitespace-nowrap text-base font-bold tracking-tight text-gray-900 dark:text-white sm:text-lg md:text-xl">
                {getPageTitle()}
              </h1>
            </div>
          </div>

          {/* Center / Search bar */}
          <div className="hidden max-w-md flex-1 px-4 md:block">
            <form onSubmit={handleSearchSubmit} className="relative">
              <div
                className={`pointer-events-none absolute inset-y-0 flex items-center text-gray-500 ${
                  isRtl ? 'right-3' : 'left-3'
                }`}
              >
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`${t('common.search', 'Search')} (Ctrl+K)...`}
                className={`w-full rounded-xl border border-[#D4CCB9] bg-[#EFECE2] py-2 text-sm text-gray-900 placeholder-gray-500 outline-none transition-all focus:border-[#123D78] focus:bg-[#FAF7F0] focus:ring-2 focus:ring-[#123D78]/20 dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-red-500 dark:focus:bg-gray-800
                  ${isRtl ? 'pr-9 pl-4' : 'pl-9 pr-4'}
                `}
              />
            </form>
          </div>

          {/* Right section: Language selector, Theme toggle, Notifications, User Profile */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
            {/* Language Switcher */}
            <LanguageSelector />

            {/* Quick Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-xl p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
              title={
                theme === 'dark'
                  ? t('common.lightMode', 'Light Mode')
                  : t('common.darkMode', 'Dark Mode')
              }
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-amber-400" />
              ) : (
                <Moon className="h-5 w-5 text-gray-600" />
              )}
            </button>

            {/* Notifications Dropdown */}
            <div className="relative" ref={notifDropdownRef}>
              <button
                type="button"
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="relative rounded-xl p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                aria-label="Notifications"
                title={t('nav.notifications', 'Notifications')}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#F12D3A] px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-gray-900">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Menu Card */}
              {notifDropdownOpen && (
                <div
                  className={`absolute top-full mt-2 w-80 sm:w-96 rounded-2xl border border-gray-100 bg-white p-0 shadow-2xl transition-all dark:border-gray-800 dark:bg-[#1a2332]
                    ${isRtl ? 'left-0' : 'right-0'}
                  `}
                >
                  <div className="flex items-center justify-between border-b border-gray-100 p-4 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {t('nav.notifications', 'Notifications')}
                      </h3>
                      {unreadCount > 0 && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-[#F12D3A] dark:bg-red-900/30 dark:text-red-300">
                          {unreadCount} {t('common.new', 'new')}
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="text-xs font-medium text-[#123D78] hover:underline dark:text-blue-400"
                      >
                        {t('common.markAllAsRead', 'Mark all as read')}
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
                        <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-500" />
                        <p>{t('common.noNotifications', 'All caught up!')}</p>
                      </div>
                    ) : (
                      notifications.slice(0, 5).map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            if (!notif.is_read) markAsRead(notif.id);
                          }}
                          className={`flex items-start gap-3 p-3.5 transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/60
                            ${!notif.is_read ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''}
                          `}
                        >
                          <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-[#123D78] dark:bg-blue-900/40 dark:text-blue-300">
                            <Bell className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                              {notif.title || t('nav.notifications', 'Notification')}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mt-0.5">
                              {notif.message || notif.content}
                            </p>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {notif.created_at
                                ? new Date(notif.created_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : ''}
                            </span>
                          </div>
                          {!notif.is_read && (
                            <span className="h-2 w-2 rounded-full bg-[#F12D3A] flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="border-t border-gray-100 p-2.5 text-center dark:border-gray-800">
                    <Link
                      to={`/${userRole}/notifications`}
                      onClick={() => setNotifDropdownOpen(false)}
                      className="text-xs font-semibold text-[#123D78] hover:text-[#F12D3A] transition-colors dark:text-blue-400 dark:hover:text-red-400"
                    >
                      {t('common.viewAll', 'View all notifications')} →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu Dropdown */}
            <div className="relative" ref={userDropdownRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 rounded-xl p-1.5 text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                aria-label="User menu"
              >
                {/* Avatar */}
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full overflow-hidden bg-gradient-to-tr from-[#123D78] to-[#1a4f9a] text-xs font-bold text-white shadow-sm ring-2 ring-gray-100 dark:ring-gray-800">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <div className="hidden text-left sm:block">
                  <p className="max-w-[120px] truncate text-xs font-semibold text-gray-900 dark:text-white">
                    {displayName}
                  </p>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t(`roles.${userRole}`, userRole)}
                  </p>
                </div>
                <ChevronDown className="hidden h-4 w-4 text-gray-400 sm:block" />
              </button>

              {/* User Dropdown Popover */}
              {userDropdownOpen && (
                <div
                  className={`absolute top-full mt-2 w-60 rounded-2xl border border-gray-100 bg-white p-1.5 shadow-2xl transition-all dark:border-gray-800 dark:bg-[#1a2332]
                    ${isRtl ? 'left-0' : 'right-0'}
                  `}
                >
                  <div className="flex items-center gap-3 border-b border-gray-100 px-3 py-2.5 dark:border-gray-800">
                    <label
                      title={t('users.uploadAvatar', 'Rasm yuklash')}
                      className="group relative flex h-10 w-10 flex-shrink-0 cursor-pointer items-center justify-center rounded-full overflow-hidden bg-gradient-to-tr from-[#123D78] to-[#1a4f9a] text-xs font-bold text-white shadow-sm"
                    >
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={displayName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        initials
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera className="h-4 w-4 text-white" />
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          const uid = profile?.id || user?.id;
                          if (file && uid) {
                            try {
                              await uploadAvatar(uid, file);
                            } catch (err) {
                              console.error('Avatar upload error:', err);
                            }
                          }
                          e.target.value = '';
                        }}
                      />
                    </label>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-gray-900 dark:text-white">
                        {displayName}
                      </p>
                      <p className="truncate text-[11px] text-gray-500 dark:text-gray-400">
                        {userEmail}
                      </p>
                    </div>
                  </div>

                  <div className="py-1">
                    <label className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-[#123D78] dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white">
                      <Camera className="h-4 w-4 text-brand-navy dark:text-blue-400" />
                      <span>{t('users.uploadAvatar', 'Profilga rasm qo‘yish')}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          const uid = profile?.id || user?.id;
                          if (file && uid) {
                            try {
                              await uploadAvatar(uid, file);
                              setUserDropdownOpen(false);
                            } catch (err) {
                              console.error('Avatar upload error:', err);
                            }
                          }
                          e.target.value = '';
                        }}
                      />
                    </label>
                    <Link
                      to={`/${userRole}/settings`}
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-[#123D78] dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                    >
                      <User className="h-4 w-4 text-gray-500" />
                      {t('common.profile', 'Profile')}
                    </Link>
                    <Link
                      to={`/${userRole}/settings`}
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-[#123D78] dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                    >
                      <Settings className="h-4 w-4 text-gray-500" />
                      {t('common.settings', 'Settings')}
                    </Link>
                  </div>

                  <div className="border-t border-gray-100 pt-1 dark:border-gray-800">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                    >
                      <LogOut className="h-4 w-4" />
                      {t('common.logout', 'Sign Out')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 w-full p-3 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
