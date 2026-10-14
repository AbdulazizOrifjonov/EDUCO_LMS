import React, { useState } from 'react';
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
  GraduationCap,
  Sparkles,
  Camera,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import useTheme from '@/hooks/useTheme';
import { SUPPORTED_LANGUAGES, ROLES } from '@/lib/constants';
import { LanguageFlag } from '@/components/LanguageSelector';
import { uploadAvatar } from '@/services/settingsService';

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
        return 'bg-amber-500/20 text-amber-200 border-amber-400/30';
      case ROLES.ADMIN:
      case 'admin':
        return 'bg-indigo-500/20 text-indigo-200 border-indigo-400/30';
      case ROLES.TEACHER:
      case 'teacher':
        return 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30';
      case ROLES.STUDENT:
      case 'student':
      default:
        return 'bg-blue-500/20 text-blue-200 border-blue-400/30';
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
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Element */}
      <aside
        className={`fixed top-0 bottom-0 z-50 flex flex-col bg-[#123D78] text-white shadow-2xl transition-all duration-300 ease-in-out dark:bg-[#101827] dark:border-r dark:border-gray-800/80
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
        {/* Header / Logo Section */}
        <div
          className={`relative flex h-16 items-center border-b border-white/10 dark:border-gray-800 ${
            collapsed && !mobileOpen ? 'justify-center px-2' : 'justify-between px-4'
          }`}
        >
          <NavLink
            to={`/${userRole}/dashboard`}
            className="flex items-center gap-3 transition-opacity hover:opacity-95"
            onClick={onCloseMobile}
            title="EDUCO LMS"
          >
            {/* Logo Icon (Always 100% visible) */}
            <div className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-white/25 to-white/10 shadow-md backdrop-blur-sm border border-white/25">
              <GraduationCap className="h-6 w-6 text-white" />
              <span className="absolute -bottom-1 px-1 py-[1px] rounded bg-[#F12D3A] text-[8px] font-black uppercase tracking-wider text-white shadow-sm leading-none">
                EDUCO
              </span>
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F12D3A] opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#F12D3A]" />
              </span>
            </div>

            {/* Logo Text (visible when expanded) */}
            {(!collapsed || mobileOpen) && (
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-black tracking-wider text-white">
                    EDUCO
                  </span>
                  <span className="rounded-md bg-[#F12D3A] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                    LMS
                  </span>
                </div>
                <span className="text-[10px] font-medium text-white/60 tracking-tight dark:text-gray-400">
                  Learning Management
                </span>
              </div>
            )}
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

          {/* Desktop Collapse/Expand Toggle Button */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className={`hidden lg:flex items-center justify-center transition-all ${
              collapsed && !mobileOpen
                ? 'absolute -right-3 top-1/2 -translate-y-1/2 z-50 h-6 w-6 rounded-full bg-[#F12D3A] text-white shadow-lg ring-2 ring-white dark:ring-gray-900 hover:scale-110'
                : 'rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white'
            }`}
            title={collapsed ? t('common.expand', 'Yon panelni kengaytirish') : t('common.collapse', 'Yon panelni yig‘ish')}
            aria-label="Toggle sidebar collapse"
          >
            {collapsed ? (
              isRtl ? (
                <ChevronLeft className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )
            ) : isRtl ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
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
                      ? 'bg-gradient-to-r from-[#F12D3A] to-[#d91e2b] text-white font-semibold shadow-lg shadow-red-600/30 ring-1 ring-white/25'
                      : 'font-medium text-white/75 hover:bg-white/10 hover:text-white dark:text-gray-300 dark:hover:bg-gray-800/70 dark:hover:text-white'
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
                {item.badge !== undefined && item.badge !== null && item.badge > 0 && (
                  <span
                    className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-bold
                      ${
                        collapsed && !mobileOpen
                          ? 'absolute top-1 right-1 h-4 min-w-[16px] text-[10px] bg-red-500 text-white'
                          : 'bg-white/20 text-white backdrop-blur-sm'
                      }
                    `}
                  >
                    {item.badge}
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
                            ? 'bg-[#F12D3A] text-white'
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
              className="group relative flex h-10 w-10 flex-shrink-0 cursor-pointer items-center justify-center rounded-full bg-gradient-to-tr from-[#F12D3A] to-rose-400 font-bold text-white shadow-md ring-2 ring-white/20 overflow-visible"
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
              <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-[#123D78] bg-[#F12D3A] text-white shadow-sm dark:border-gray-900">
                <Camera className="h-2.5 w-2.5" />
              </span>
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
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`inline-block truncate rounded-full border px-1.5 py-0.2 text-[10px] font-semibold uppercase tracking-wider ${getRoleBadgeClasses(
                      userRole
                    )}`}
                  >
                    {t(`roles.${userRole}`, userRole)}
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
    </>
  );
}
