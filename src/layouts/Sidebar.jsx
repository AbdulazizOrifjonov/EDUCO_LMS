import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Globe,
  X,
  Sparkles,
  Camera,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import useTheme from '@/hooks/useTheme';
import { SUPPORTED_LANGUAGES, ROLES } from '@/lib/constants';
import { LanguageFlag } from '@/components/LanguageSelector';
import { uploadAvatar } from '@/services/settingsService';
import ImageCropperModal from '@/components/ui/ImageCropperModal';
import { localStore } from '@/lib/localStore';

export default function Sidebar({
  items = [],
  role = 'student',
  collapsed = false,
  onToggleCollapse = () => {},
  mobileOpen = false,
  onCloseMobile = () => {},
}) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [cropAvatarFile, setCropAvatarFile] = useState(null);

  // Dismiss mobile virtual keyboard whenever sidebar opens
  useEffect(() => {
    if (mobileOpen) {
      if (typeof document !== 'undefined' && document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
    }
  }, [mobileOpen]);

  // Derived user details
  const displayName =
    profile?.full_name ||
    profile?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'User';

  const userEmail = profile?.email || user?.email || '';
  const userRole = (profile?.role || user?.user_metadata?.role || role || 'student').toLowerCase();

  // Avatar initials
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';

  // Live due reminders count for Owner & Admin
  const dueRemindersCount = React.useMemo(() => {
    if (!['owner', 'admin'].includes(userRole)) return 0;
    try {
      const all = localStore.getStudentReminders ? localStore.getStudentReminders() : [];
      const today = new Date().toISOString().split('T')[0];
      return all.filter((r) => r.status === 'pending' && r.due_date <= today).length;
    } catch {
      return 0;
    }
  }, [userRole]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    try {
      localStorage.setItem('educo-lang', langCode);
    } catch (e) {}
    const targetLang = SUPPORTED_LANGUAGES.find((l) => l.code === langCode);
    const dir = targetLang?.dir || 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = langCode;
    setLangMenuOpen(false);
  };

  // Role badge styling
  const getRoleBadgeClasses = (r) => {
    switch (r) {
      case ROLES.OWNER:
      case 'owner':
        return 'bg-rose-500/25 text-rose-200 border-rose-400/40';
      case ROLES.ADMIN:
      case 'admin':
        return 'bg-purple-500/25 text-purple-200 border-purple-400/40';
      case ROLES.TEACHER:
      case 'teacher':
        return 'bg-amber-500/25 text-amber-200 border-amber-400/40';
      case ROLES.STUDENT:
      case 'student':
      default:
        return 'bg-emerald-500/25 text-emerald-200 border-emerald-400/40';
    }
  };

  const currentLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language) ||
    SUPPORTED_LANGUAGES[0];

  // Helper for translating navigation labels
  const getNavLabel = (item) => {
    if (item.labelKey) return t(item.labelKey, item.label);
    if (typeof item.label === 'string') {
      // Check if it's already translated or matching a nav key
      const key = `nav.${item.label.toLowerCase().replace(/\s+/g, '')}`;
      const translated = t(key);
      return translated !== key ? translated : item.label;
    }
    return item.label;
  };

  const isRtl = i18n.dir ? i18n.dir() === 'rtl' : currentLang.dir === 'rtl';

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={() => {
            if (typeof document !== 'undefined' && document.activeElement && typeof document.activeElement.blur === 'function') {
              document.activeElement.blur();
            }
            onCloseMobile();
          }}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Element */}
      <aside
        className={`fixed top-0 bottom-0 z-50 flex flex-col bg-gradient-to-b from-[#123D78] via-[#1b4b8a] to-[#2563EB] text-white shadow-2xl transition-all duration-300 ease-in-out dark:bg-none dark:bg-[#101827] dark:border-r dark:border-gray-800/80
          ${isRtl ? 'right-0' : 'left-0'}
          ${collapsed ? 'lg:w-20' : 'lg:w-64'}
          w-72
          ${
            mobileOpen
              ? 'translate-x-0'
              : isRtl
              ? 'translate-x-full lg:translate-x-0'
              : '-translate-x-full lg:translate-x-0'
          }
        `}
      >
        {/* Light Mode Glow / Shula (banner-inspired vertical sheen, strictly hidden in dark mode) */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden dark:hidden" aria-hidden="true">
          <div className="absolute -bottom-10 -right-10 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-1/3 -left-10 h-48 w-48 rounded-full bg-sky-300/10 blur-3xl" />
        </div>
        {/* Header / Logo Section */}
        <div
          className={`relative flex h-16 items-center border-b border-white/10 dark:border-gray-800 ${
            collapsed && !mobileOpen ? 'justify-center px-2' : 'justify-between px-4'
          }`}
        >
          {collapsed && !mobileOpen ? (
            /* When collapsed: NO logo image in sidebar! The toggle button sits right here in its place */
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden lg:flex h-10 w-10 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white shadow-md border border-white/25 hover:scale-105 active:scale-95 transition-all"
              title={t('common.expand', 'Yon panelni kengaytirish')}
              aria-label="Expand sidebar"
            >
              {isRtl ? (
                <ChevronLeft className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </button>
          ) : (
            <>
              {/* When expanded: Full EDUCO Logo on left */}
              <NavLink
                to={`/${userRole}/dashboard`}
                className="flex items-center gap-2.5 transition-opacity hover:opacity-95"
                onClick={onCloseMobile}
                title="EDUCO LMS"
              >
                <img
                  src="/educo-logo-white.png"
                  alt="EDUCO"
                  className="h-8 sm:h-9 w-auto object-contain drop-shadow-sm"
                />
                <span className="rounded-md bg-white/15 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white border border-white/20 shadow-xs">
                  LMS
                </span>
              </NavLink>

              {/* Mobile Close Button */}
              <button
                type="button"
                onClick={onCloseMobile}
                className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
                aria-label={t('common.close', 'Close menu')}
              >
                <X className="h-5 w-5" />
              </button>

              {/* Desktop Collapse Button */}
              <button
                type="button"
                onClick={onToggleCollapse}
                className="hidden lg:flex items-center justify-center rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                title={t('common.collapse', 'Yon panelni yig‘ish')}
                aria-label="Collapse sidebar"
              >
                {isRtl ? (
                  <ChevronRight className="h-5 w-5" />
                ) : (
                  <ChevronLeft className="h-5 w-5" />
                )}
              </button>
            </>
          )}
        </div>

        {/* Navigation Items (Scrollable without ugly scrollbars) */}
        <nav className="sidebar-scroll flex-1 space-y-1.5 overflow-y-auto overflow-x-hidden px-3 py-4">
          {items.map((item, index) => {
            const Icon = item.icon || Sparkles;
            const label = getNavLabel(item);
            const isDashboardItem =
              item.path === `/${role}` ||
              item.path === `/${role}/dashboard` ||
              item.labelKey === 'nav.dashboard';
            const isActiveRoute = isDashboardItem
              ? location.pathname === `/${role}` ||
                location.pathname === `/${role}/dashboard`
              : location.pathname === item.path ||
                location.pathname.startsWith(`${item.path}/`);

            let badgeCount = item.badge;
            if (item.path && item.path.includes('/reminders') && dueRemindersCount > 0) {
              badgeCount = dueRemindersCount;
            }

            return (
              <NavLink
                key={item.path || index}
                to={item.path}
                onClick={onCloseMobile}
                title={collapsed && !mobileOpen ? label : undefined}
                className={`
                  group relative flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-sm transition-all duration-200
                  ${
                    isActiveRoute
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 dark:from-emerald-600 dark:to-teal-700 text-white font-semibold shadow-lg shadow-blue-950/50 dark:shadow-emerald-950/50 ring-1 ring-white/25 dark:ring-emerald-400/25'
                      : 'font-medium text-white/80 hover:bg-white/10 hover:text-white dark:text-gray-300 dark:hover:bg-gray-800/70 dark:hover:text-white'
                  }
                  ${collapsed && !mobileOpen ? 'justify-center px-2' : ''}
                `}
              >
                {/* Nav Icon */}
                <Icon
                  className={`h-5 w-5 flex-shrink-0 transition-transform duration-200 ${
                    isActiveRoute ? 'scale-105 text-white' : 'group-hover:scale-110'
                  }`}
                />

                {/* Nav Label */}
                {(!collapsed || mobileOpen) && (
                  <span className="flex-1 truncate tracking-wide">{label}</span>
                )}

                {/* Badge if present */}
                {badgeCount !== undefined && badgeCount !== null && badgeCount > 0 && (
                  <span
                    className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-black
                      ${
                        item.path && item.path.includes('/reminders')
                          ? collapsed && !mobileOpen
                            ? 'absolute top-1 right-1 h-4 min-w-[16px] text-[10px] bg-amber-500 text-white animate-pulse shadow-sm'
                            : 'bg-amber-500 text-white font-black shadow-xs animate-pulse'
                          : collapsed && !mobileOpen
                          ? 'absolute top-1 right-1 h-4 min-w-[16px] text-[10px] bg-blue-500 dark:bg-emerald-600 text-white'
                          : 'bg-white/20 text-white backdrop-blur-sm'
                      }
                    `}
                  >
                    {badgeCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Section */}
        <div className="border-t border-white/10 p-3 space-y-2 dark:border-gray-800">
          {/* Controls: Language & Theme */}
          <div
            className={`flex items-center gap-2 ${
              collapsed && !mobileOpen ? 'flex-col' : 'justify-between'
            }`}
          >
            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-2 rounded-lg p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white dark:text-gray-300 dark:hover:bg-gray-800"
                title={t('common.language', 'Language')}
                aria-label="Select language"
              >
                <LanguageFlag code={currentLang.code} className="w-5 h-3.5" />
                {(!collapsed || mobileOpen) && (
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    {currentLang.code}
                  </span>
                )}
              </button>

              {langMenuOpen && (
                <div
                  className={`absolute bottom-full mb-2 z-50 w-40 rounded-xl border border-white/10 bg-[#123D78] p-1.5 shadow-2xl backdrop-blur-lg dark:border-gray-700 dark:bg-[#101827]
                    ${isRtl ? 'right-0' : 'left-0'}
                  `}
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-colors
                        ${
                          i18n.language === lang.code
                            ? 'bg-blue-600 dark:bg-emerald-600 text-white'
                            : 'text-white/80 hover:bg-white/10 hover:text-white dark:text-gray-300 dark:hover:bg-gray-800'
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
              className="flex items-center gap-1.5 rounded-lg p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white dark:text-gray-300 dark:hover:bg-gray-800"
              title={
                theme === 'dark'
                  ? t('common.lightMode', 'Switch to Light Mode')
                  : t('common.darkMode', 'Switch to Dark Mode')
              }
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-300" />
              ) : (
                <Moon className="h-4 w-4 text-white" />
              )}
              {(!collapsed || mobileOpen) && (
                <span className="text-xs font-medium capitalize">
                  {theme === 'dark' ? t('common.lightMode', 'Light') : t('common.darkMode', 'Dark')}
                </span>
              )}
            </button>
          </div>

          {/* User Profile Info Card */}
          <div
            className={`flex items-center rounded-xl bg-white/10 p-2.5 backdrop-blur-sm transition-all dark:bg-gray-800/50
              ${collapsed && !mobileOpen ? 'justify-center p-2' : 'gap-3'}
            `}
          >
            {/* Avatar with direct photo upload */}
            <label
              title={t('users.uploadAvatar', 'Profil rasmini yuklash yoki o‘zgartirish')}
              className="group relative flex h-10 w-10 flex-shrink-0 cursor-pointer items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 dark:from-emerald-600 dark:to-teal-500 font-bold text-white shadow-md ring-2 ring-white/20 overflow-visible"
            >
              <div className="h-full w-full rounded-full overflow-hidden flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-bold">{initials}</span>
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="h-4 w-4 text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-[#1b4b8a] bg-blue-600 dark:bg-emerald-600 text-white shadow-sm dark:border-gray-900">
                <Camera className="h-2.5 w-2.5" />
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setCropAvatarFile(file);
                  }
                  e.target.value = '';
                }}
              />
            </label>

            {/* Names & Role */}
            {(!collapsed || mobileOpen) && (
              <div
                onClick={() => {
                  navigate(`/${userRole}/settings`);
                  onCloseMobile();
                }}
                className="min-w-0 flex-1 cursor-pointer hover:opacity-90"
                title={t('common.profile', 'Profil sozlamalari')}
              >
                <p className="truncate text-xs font-semibold text-white">
                  {displayName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span
                    className={`inline-block whitespace-nowrap shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getRoleBadgeClasses(
                      userRole
                    )}`}
                  >
                    {t(`roles.${userRole}`, userRole)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-blue-200 dark:text-emerald-300 font-medium shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-300 dark:bg-emerald-400 animate-pulse" />
                    Online
                  </span>
                </div>
              </div>
            )}

            {/* Logout Button */}
            {(!collapsed || mobileOpen) && (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-red-300"
                title={t('common.logout', 'Sign Out')}
                aria-label={t('common.logout', 'Logout')}
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Collapsed view standalone logout */}
          {collapsed && !mobileOpen && (
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-center rounded-xl p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-red-300"
              title={t('common.logout', 'Sign Out')}
              aria-label={t('common.logout', 'Logout')}
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Telegram-style Image Cropper Modal for Avatar */}
      <ImageCropperModal
        isOpen={Boolean(cropAvatarFile)}
        imageFile={cropAvatarFile}
        onClose={() => setCropAvatarFile(null)}
        onCrop={async (croppedDataUrl, croppedFile) => {
          setCropAvatarFile(null);
          const uid = profile?.id || user?.id;
          if (uid) {
            try {
              await uploadAvatar(uid, croppedFile || croppedDataUrl);
            } catch (err) {
              console.error('Avatar upload error:', err);
            }
          }
        }}
        title={t('users.editAvatar', 'Profil rasmini moslashtirish')}
      />
    </>
  );
}
