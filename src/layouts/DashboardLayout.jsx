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
  ArrowLeft,
  X,
  Download,
  Globe,
  RefreshCw,
} from 'lucide-react';
import { localStore } from '@/lib/localStore';
import InstallAppModal from '@/components/InstallAppModal';
import Sidebar from './Sidebar';
import LanguageSelector from '@/components/LanguageSelector';
import useAuth from '@/hooks/useAuth';
import useTheme from '@/hooks/useTheme';
import useNotifications from '@/hooks/useNotifications';
import { SUPPORTED_LANGUAGES, ROLES } from '@/lib/constants';
import { uploadAvatar } from '@/services/settingsService';
import StudentRemindersModal from '@/components/reminders/StudentRemindersModal';
import { getDueReminders } from '@/services/reminderService';
import GlobalSearchBar from '@/components/GlobalSearchBar';
import ImageCropperModal from '@/components/ui/ImageCropperModal';
import { toast } from '@/components/ui/Toast';
import {
  isPushSupported,
  getNotificationPermission,
  requestNotificationPermission,
  showPushNotification,
} from '@/services/pushNotificationService';

export default function DashboardLayout({
  sidebarItems = [],
  role = 'student',
  children,
}) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const isChatPage = location.pathname.includes('/chat');

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
  const [remindersModalOpen, setRemindersModalOpen] = useState(false);
  const [dueRemindersCount, setDueRemindersCount] = useState(0);
  const [cropAvatarFile, setCropAvatarFile] = useState(null);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [pushPermission, setPushPermission] = useState(() => getNotificationPermission());

  useEffect(() => {
    setMobileSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        if (window.innerWidth < 768) {
          setMobileSearchOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleEnablePush = async () => {
    try {
      const perm = await requestNotificationPermission();
      setPushPermission(perm);
      if (perm === 'granted') {
        toast.success("Bildirishnomalar muvaffaqiyatli yoqildi!");
      } else {
        toast.warning("Bildirishnomalarga ruxsat berilmadi");
      }
    } catch (err) {
      toast.error(err.message || "Xatolik yuz berdi");
    }
  };

  const handleTestPushNotification = async () => {
    const ok = await showPushNotification({
      title: "📢 EDUCO LMS — Sinov Bildirishnomasi!",
      body: "Salom! Bu sizning telefoningizga yuborilgan bildirishnoma. Barcha yangi xabarlar va e'lonlar xuddi shu tarzda keladi!",
      url: '/chat?channel=announcements',
      tag: 'test-notification-' + Date.now(),
    });
    if (ok) {
      toast.success("Bildirishnoma telefoningizga yuborildi!");
    } else {
      handleEnablePush();
    }
  };

  const userDropdownRef = useRef(null);
  const notifDropdownRef = useRef(null);
  const mainRef = useRef(null);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [installModalOpen, setInstallModalOpen] = useState(false);

  // Automatically scroll main container and window to top on every route navigation
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } catch {
      window.scrollTo(0, 0);
    }
    if (typeof document !== 'undefined') {
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
    }
  }, [location.pathname, location.search]);

  // Track if mobile chat window is actively open
  useEffect(() => {
    const updateChatState = () => {
      setIsMobileChatOpen(document.body.classList.contains('mobile-chat-open'));
    };
    updateChatState();
    const observer = new MutationObserver(updateChatState);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Poll for due reminders (admin & owner)
  useEffect(() => {
    if (role === 'admin' || role === 'owner') {
      const checkReminders = async () => {
        try {
          const due = await getDueReminders();
          setDueRemindersCount(due.length);
        } catch (_) {}
      };
      checkReminders();
      const interval = setInterval(checkReminders, 4000);
      return () => clearInterval(interval);
    }
  }, [role]);

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

  // Mobile virtual keyboard management: dismiss keyboard on navigation or when mobile menu toggles
  useEffect(() => {
    if (typeof document !== 'undefined' && document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
  }, [location.pathname, mobileOpen]);

  // Lock body & html scroll when viewing chat page so mobile viewport never shifts or scrolls
  useEffect(() => {
    if (isChatPage) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.touchAction = 'pan-y';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isChatPage]);

  // Global mobile touch handler: dismiss keyboard when user taps outside input fields
  useEffect(() => {
    const handleTouchStart = (e) => {
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) {
        if (e.target !== active && !active.contains(e.target)) {
          if (!e.target.closest('input, textarea, [contenteditable="true"]')) {
            active.blur();
          }
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    return () => document.removeEventListener('touchstart', handleTouchStart);
  }, []);

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
    // 1. Exact match in sidebarItems
    const exactItem = sidebarItems.find(
      (item) => item.path === location.pathname
    );
    if (exactItem) {
      if (exactItem.labelKey) return t(exactItem.labelKey, exactItem.label);
      if (typeof exactItem.label === 'string') {
        const key = `nav.${exactItem.label.toLowerCase().replace(/\s+/g, '')}`;
        const translated = t(key);
        return translated !== key ? translated : exactItem.label;
      }
      return exactItem.label;
    }

    // 2. Prefix match in sidebarItems (e.g. /teacher/groups/create matches /teacher/groups)
    const matchingParent = sidebarItems
      .filter((item) => item.path && item.path !== `/${userRole}` && item.path !== `/${userRole}/dashboard`)
      .sort((a, b) => (b.path?.length || 0) - (a.path?.length || 0))
      .find((item) => location.pathname.startsWith(item.path));

    if (matchingParent) {
      if (matchingParent.labelKey) return t(matchingParent.labelKey, matchingParent.label);
      if (typeof matchingParent.label === 'string') {
        const key = `nav.${matchingParent.label.toLowerCase().replace(/\s+/g, '')}`;
        const translated = t(key);
        return translated !== key ? translated : matchingParent.label;
      }
      return matchingParent.label;
    }

    // 3. Contextual section title by route (Prevents "Create", "Edit", or raw IDs from appearing)
    const path = location.pathname.toLowerCase();
    if (path.includes('/groups')) {
      return userRole === 'teacher' ? t('nav.myGroups', 'Mening guruhlarim') : t('nav.groups', 'Guruhlar');
    }
    if (path.includes('/courses')) return t('nav.courses', 'Kurslar');
    if (path.includes('/users') || path.includes('/students')) return t('nav.users', 'Foydalanuvchilar');
    if (path.includes('/attendance')) return t('nav.attendance', 'Davomat');
    if (path.includes('/grades')) return t('nav.grades', 'Baholar');
    if (path.includes('/schedule')) return t('nav.schedule', 'Dars jadvali');
    if (path.includes('/passwords')) return t('nav.passwords', 'Parollar bazasi');
    if (path.includes('/tuition')) return t('nav.tuition', 'O‘qish to‘lovlari');
    if (path.includes('/reports')) return t('nav.reports', 'Hisobotlar');
    if (path.includes('/chat')) return t('nav.chat', 'Guruh chatlari');
    if (path.includes('/sms')) return t('nav.sms', 'SMS Xabarlar');
    if (path.includes('/settings')) return t('nav.settings', 'Sozlamalar');
    if (path.includes('/notifications')) return t('nav.notifications', 'Xabarnomalar');
    if (path.includes('/dashboard')) return t('nav.dashboard', 'Boshqaruv paneli');

    // 4. Fallbacks based on path segments, strictly filtering out "create", "edit", and UUIDs
    const segments = location.pathname.split('/').filter(Boolean);
    if (segments.length === 0 || (segments.length === 1 && ['owner', 'admin', 'teacher', 'student'].includes(segments[0]))) {
      return t('nav.dashboard', 'Boshqaruv paneli');
    }

    let relevantSegment = segments[segments.length - 1];
    if (['create', 'edit', 'add-student'].includes(relevantSegment.toLowerCase()) || /^[0-9a-fA-F-]+$/.test(relevantSegment)) {
      if (segments.length > 2) {
        relevantSegment = segments[segments.length - 2];
      } else {
        return '';
      }
    }

    if (relevantSegment.toLowerCase() === 'create' || relevantSegment.toLowerCase() === 'edit') {
      return '';
    }

    const navKey = `nav.${relevantSegment}`;
    const translated = t(navKey);
    return translated !== navKey
      ? translated
      : relevantSegment.charAt(0).toUpperCase() + relevantSegment.slice(1);
  };

  const [isRefreshingSync, setIsRefreshingSync] = useState(false);

  const handleFullSystemRefresh = async () => {
    setIsRefreshingSync(true);
    toast.info("Tizim barcha qurilmalar bilan yangilanmoqda...");
    try {
      await localStore.forceRefreshFromServer();
      toast.success("Tizim ma'lumotlari muvaffaqiyatli yangilandi!");
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (e) {
      toast.error("Yangilashda xatolik yuz berdi");
      setIsRefreshingSync(false);
    }
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

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`${
        isChatPage
          ? 'fixed inset-0 h-[100dvh] max-h-[100dvh] overflow-hidden'
          : 'min-h-screen overflow-x-clip'
      } bg-[#EFECE4] text-slate-900 transition-colors duration-200 dark:bg-[#101827] dark:text-gray-100 flex w-full max-w-full`}
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
        className={`flex min-w-0 flex-1 flex-col transition-all duration-300 ease-in-out ${
          isChatPage
            ? 'h-[100dvh] max-h-[100dvh] overflow-hidden pt-0'
            : 'min-h-screen pt-[calc(4rem+env(safe-area-inset-top,0px))]'
        }
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
        {/* Top Navigation Bar */}
        <header
          style={{
            paddingTop: 'env(safe-area-inset-top, 0px)',
          }}
          className={`${
            isChatPage
              ? `shrink-0 z-40 h-[calc(4rem+env(safe-area-inset-top,0px))] items-center justify-between border-b border-[#D8D1C2] bg-[#F8F5EC]/95 px-2.5 sm:px-4 lg:px-6 shadow-sm backdrop-blur-md dark:border-gray-800 dark:bg-[#101827]/95 ${
                  isMobileChatOpen ? 'hidden md:flex' : 'flex'
                }`
              : `fixed top-0 z-40 flex h-[calc(4rem+env(safe-area-inset-top,0px))] items-center justify-between border-b border-[#D8D1C2] bg-[#F8F5EC]/95 px-2.5 sm:px-4 lg:px-6 shadow-sm backdrop-blur-md transition-all duration-300 ease-in-out dark:border-gray-800 dark:bg-[#101827]/95 ${
                  collapsed
                    ? isRtl
                      ? 'left-0 right-0 lg:right-20'
                      : 'left-0 right-0 lg:left-20'
                    : isRtl
                    ? 'left-0 right-0 lg:right-64'
                    : 'left-0 right-0 lg:left-64'
                }`
          }`}
        >
          {mobileSearchOpen ? (
            /* Full-width Search Bar for Mobile / Compact Screens */
            <div className="flex w-full items-center justify-between gap-2 animate-fade-in py-1 max-w-2xl mx-auto">
              <button
                type="button"
                onClick={() => setMobileSearchOpen(false)}
                className="shrink-0 rounded-xl p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                aria-label="Orqaga"
                title="Orqaga"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex-1 min-w-0">
                <GlobalSearchBar
                  role={userRole}
                  isRtl={isRtl}
                  autoFocus={true}
                  onClose={() => setMobileSearchOpen(false)}
                />
              </div>
              <button
                type="button"
                onClick={() => setMobileSearchOpen(false)}
                className="shrink-0 rounded-xl p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800 transition-colors"
                aria-label="Yopish"
                title="Yopish"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <>
              {/* Left section: Hamburger (mobile) + EDUCO Logo */}
              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 mr-2 sm:mr-3 lg:mr-4">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof document !== 'undefined' && document.activeElement && typeof document.activeElement.blur === 'function') {
                      document.activeElement.blur();
                    }
                    setMobileOpen(true);
                  }}
                  className="shrink-0 rounded-lg p-1.5 sm:p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white lg:hidden"
                  aria-label="Open mobile menu"
                >
                  <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>

                {/* 1-Step Back Navigation Button for Mobile / Compact Screens */}
                {location.pathname !== `/${userRole}/dashboard` && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.history.length > 1) {
                        navigate(-1);
                      } else {
                        navigate(`/${userRole}/dashboard`);
                      }
                    }}
                    className="shrink-0 rounded-xl p-1.5 sm:p-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex items-center gap-1 font-bold text-xs lg:hidden active:scale-95 cursor-pointer bg-gray-50/80 dark:bg-gray-800/80 border border-gray-200/60 dark:border-gray-700/60 shadow-xs"
                    aria-label="1 qadam ortga qaytish"
                    title="1 qadam ortga qaytish"
                  >
                    <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700 dark:text-gray-200" />
                    <span className="text-[11px] font-bold hidden xs:inline">Ortga</span>
                  </button>
                )}

                {/* Official EDUCO Logo - shown on mobile, and on desktop ONLY when sidebar is collapsed */}
                <Link
                  to={`/${userRole}/dashboard`}
                  className={`items-center shrink-0 hover:opacity-90 transition-opacity ${
                    collapsed ? 'flex' : 'flex lg:hidden'
                  }`}
                  title="EDUCO LMS"
                >
                  <img
                    src="/educo-logo.png"
                    alt="EDUCO"
                    className="h-6 sm:h-7 lg:h-8 w-auto object-contain dark:hidden"
                  />
                  <img
                    src="/educo-logo-white.png"
                    alt="EDUCO"
                    className="h-6 sm:h-7 lg:h-8 w-auto object-contain hidden dark:block"
                  />
                </Link>
              </div>

              {/* Center / Search bar with reactive live search (Visible on tablet/sm >= 640px and desktop) */}
              <div className="hidden sm:flex flex-1 justify-center max-w-xs md:max-w-md lg:max-w-lg xl:max-w-2xl mx-2 sm:mx-3 lg:mx-4 min-w-0">
                <GlobalSearchBar role={userRole} isRtl={false} />
              </div>

              {/* Right section: Search Button (< sm), Reminders, Install App, Language, Theme, Notifications, User Profile */}
              <div className="flex shrink-0 items-center gap-1 sm:gap-1.5 lg:gap-2">
                {/* Search Icon Button for tiny screens < sm (< 640px) */}
                <button
                  type="button"
                  onClick={() => setMobileSearchOpen(true)}
                  className="sm:hidden h-10 w-10 inline-flex items-center justify-center rounded-xl text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white shrink-0"
                  title="Qidiruv (Ctrl+K)"
                  aria-label="Qidiruv"
                >
                  <Search className="h-5 w-5" />
                </button>

                {/* Student Reminders Alert Pill for Admin and Owner */}
                {(role === 'admin' || role === 'owner') && dueRemindersCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setRemindersModalOpen(true)}
                    className="h-10 inline-flex items-center gap-1 sm:gap-1.5 px-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0 bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/40 hover:bg-rose-500/25 ring-2 ring-rose-400/30 animate-pulse"
                    title={`${dueRemindersCount} ta o‘quvchi bilan bog‘lanish eslatmasi`}
                  >
                    <Clock className="w-3.5 h-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
                    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-md bg-rose-600 text-white text-[10px] font-black leading-none shrink-0 shadow-xs">
                      {dueRemindersCount}
                    </span>
                    <span className="hidden xl:inline whitespace-nowrap">
                      ta eslatma
                    </span>
                  </button>
                )}

                {/* Go to Website Quick Header Button (Visible on md+ screens, accessible in sidebar on mobile) */}
                <button
                  type="button"
                  onClick={() => window.open('/website', '_blank', 'noopener,noreferrer')}
                  className="hidden md:inline-flex h-10 items-center gap-1.5 px-2.5 sm:px-3 rounded-xl bg-gray-100/90 hover:bg-gray-200/90 dark:bg-gray-800/80 dark:hover:bg-gray-700/80 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
                  title="Rasmiy veb-saytga o‘tish (Yangi oynada ochiladi)"
                >
                  <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-emerald-400" />
                  <span className="hidden xl:inline">Veb-sayt</span>
                  <span className="hidden md:inline xl:hidden">Sayt</span>
                </button>

                {/* Install App Button (Visible on md+ screens, accessible in sidebar on mobile) */}
                <button
                  type="button"
                  onClick={() => setInstallModalOpen(true)}
                  className="hidden md:inline-flex h-10 items-center gap-1.5 px-2.5 sm:px-3 rounded-xl bg-blue-50/80 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
                  title="Ilovani kompyuter yoki telefonga o‘rnatish"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="hidden xl:inline">Ilovani o‘rnatish</span>
                  <span className="hidden md:inline xl:hidden">Ilova</span>
                </button>

            {/* Language Switcher (Visible on sm+ screens; on mobile available in sidebar & user profile) */}
            <div className="hidden sm:block shrink-0">
              <LanguageSelector />
            </div>

            {/* Quick Theme Toggle (Visible on sm+ screens; on mobile available in sidebar & user profile) */}
            <button
              type="button"
              onClick={toggleTheme}
              className="hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-xl text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white shrink-0"
              title={
                theme === 'dark'
                  ? t('common.lightMode', 'Light Mode')
                  : t('common.darkMode', 'Dark Mode')
              }
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 sm:h-5 w-4 sm:w-5 text-amber-400" />
              ) : (
                <Moon className="h-4 sm:h-5 w-4 sm:w-5 text-gray-600" />
              )}
            </button>

            {/* Notifications Dropdown */}
            <div className="relative shrink-0" ref={notifDropdownRef}>
              <button
                type="button"
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="relative h-10 w-10 inline-flex items-center justify-center rounded-xl text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                aria-label="Notifications"
                title={t('nav.notifications', 'Notifications')}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#F12D3A] dark:bg-emerald-600 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-gray-900">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Menu Card */}
              {notifDropdownOpen && (
                <div
                  className="fixed sm:absolute top-16 sm:top-full mt-2 inset-x-3 sm:inset-x-auto sm:right-0 sm:w-[410px] rounded-2xl border border-gray-100 bg-white p-0 shadow-2xl transition-all dark:border-gray-800 dark:bg-[#1a2332] z-50 overflow-hidden"
                >
                  <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <h3 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                        {t('nav.notifications', 'Bildirishnomalar')}
                      </h3>
                      {unreadCount > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 whitespace-nowrap shrink-0">
                          {unreadCount} {t('common.new', 'yangi')}
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {t('common.markAllAsRead', "O‘qilgan qilish")}
                      </button>
                    )}
                  </div>

                  {/* Web Push Notification Quick Enable & Test Banner */}
                  {pushPermission !== 'granted' ? (
                    <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30 border-b border-blue-100 dark:border-blue-900/40 flex items-center justify-between gap-2.5">
                      <div className="text-xs min-w-0">
                        <strong className="block text-blue-900 dark:text-blue-100 font-bold truncate">Telefonga bildirishnomalar</strong>
                        <span className="text-[11px] text-blue-700 dark:text-blue-300 block truncate">Tepada xabarlar chiqishi uchun yoqing</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleEnablePush}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shrink-0 shadow-xs cursor-pointer whitespace-nowrap active:scale-95 transition-all"
                      >
                        Yoqish 🔔
                      </button>
                    </div>
                  ) : (
                    <div className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950/30 border-b border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between text-xs">
                      <span className="text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1.5 truncate">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">Bildirishnomalar faol</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleTestPushNotification}
                        className="text-xs text-emerald-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer shrink-0 whitespace-nowrap"
                      >
                        Sinab ko‘rish 🚀
                      </button>
                    </div>
                  )}

                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
                        <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-blue-500 dark:text-emerald-500" />
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
                          <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                            <Bell className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1.5">
                              <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                {notif.title || t('nav.notifications', 'Notification')}
                              </p>
                              {!notif.is_read && (
                                <span className="h-2 w-2 rounded-full bg-rose-500 flex-shrink-0 ring-2 ring-rose-200 dark:ring-rose-900/60" />
                              )}
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mt-0.5">
                              {notif.message || notif.content}
                            </p>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
                              <Clock className="h-3 w-3 shrink-0" />
                              {notif.created_at
                                ? new Date(notif.created_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : ''}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="border-t border-gray-100 p-2.5 text-center dark:border-gray-800">
                    <Link
                      to={`/${userRole}/notifications`}
                      onClick={() => setNotifDropdownOpen(false)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {t('common.viewAll', 'Barcha bildirishnomalarni ko‘rish')} →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu Dropdown */}
            <div className="relative shrink-0" ref={userDropdownRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="h-10 flex items-center gap-1.5 sm:gap-2 rounded-xl p-1 sm:px-2 text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 shrink-0"
                aria-label="User menu"
              >
                {/* Avatar */}
                <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full overflow-hidden bg-gradient-to-tr ${
                  profile?.is_mentor || userRole === 'mentor' || profile?.username === 'abdulazizbek_orifjonov'
                    ? 'from-amber-500 via-orange-500 to-yellow-500'
                    : userRole === 'owner'
                    ? 'from-rose-500 to-red-600'
                    : userRole === 'admin'
                    ? 'from-purple-600 to-indigo-600'
                    : userRole === 'teacher'
                    ? 'from-amber-500 to-orange-600'
                    : 'from-blue-600 to-indigo-600 dark:from-emerald-500 dark:to-teal-600'
                } text-xs font-bold text-white shadow-sm ring-2 ring-gray-100 dark:ring-gray-800`}>
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
                {/* User Name & Role - text hidden on screens < 1200px to prevent crowding */}
                <div className="hidden text-left xl:block">
                  <p className="max-w-[120px] truncate text-xs font-semibold text-gray-900 dark:text-white">
                    {displayName}
                  </p>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {profile?.is_mentor || userRole === 'mentor' || profile?.username === 'abdulazizbek_orifjonov'
                      ? '⚡ MENTOR'
                      : t(`roles.${userRole}`, userRole)}
                  </p>
                </div>
                <ChevronDown className="hidden h-4 w-4 text-gray-400 xl:block" />
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
                      className={`group relative flex h-10 w-10 flex-shrink-0 cursor-pointer items-center justify-center rounded-full overflow-hidden bg-gradient-to-tr ${
                        profile?.is_mentor || userRole === 'mentor' || profile?.username === 'abdulazizbek_orifjonov'
                          ? 'from-amber-500 via-orange-500 to-yellow-500'
                          : userRole === 'owner'
                          ? 'from-rose-500 to-red-600'
                          : userRole === 'admin'
                          ? 'from-purple-600 to-indigo-600'
                          : userRole === 'teacher'
                          ? 'from-amber-500 to-orange-600'
                          : 'from-blue-600 to-indigo-600 dark:from-emerald-500 dark:to-teal-600'
                      } text-xs font-bold text-white shadow-sm`}
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
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setCropAvatarFile(file);
                            setUserDropdownOpen(false);
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
                    <label className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-emerald-300">
                      <Camera className="h-4 w-4 text-blue-600 dark:text-emerald-400" />
                      <span>{t('users.uploadAvatar', 'Profilga rasm qo‘yish')}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setCropAvatarFile(file);
                            setUserDropdownOpen(false);
                          }
                          e.target.value = '';
                        }}
                      />
                    </label>
                    <Link
                      to={`/${userRole}/settings`}
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-emerald-300"
                    >
                      <User className="h-4 w-4 text-gray-500" />
                      {t('common.profile', 'Profile')}
                    </Link>
                    <Link
                      to={`/${userRole}/settings`}
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-emerald-300"
                    >
                      <Settings className="h-4 w-4 text-gray-500" />
                      {t('common.settings', 'Settings')}
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setInstallModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-blue-700 dark:text-blue-300 transition-colors hover:bg-blue-50 dark:hover:bg-blue-950/40 text-left cursor-pointer"
                    >
                      <Download className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span>Ilovani o‘rnatish (PC / iPhone)</span>
                    </button>
                  </div>

                  {/* Sahifani to'liq yangilash (Sinxronizatsiya) */}
                  <div className="border-t border-gray-100 py-1 dark:border-gray-800">
                    <button
                      type="button"
                      disabled={isRefreshingSync}
                      onClick={handleFullSystemRefresh}
                      className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors text-left cursor-pointer disabled:opacity-50"
                      title="Barcha ma'lumotlarni serverdan qayta yuklash va barcha qurilmalar bilan to'liq sinxronlash"
                    >
                      <RefreshCw className={`h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 ${isRefreshingSync ? 'animate-spin' : ''}`} />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs">{isRefreshingSync ? 'Yangilanmoqda...' : 'Sahifani yangilash'}</div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 font-normal truncate">Barcha ma‘lumotlarni sinxronlash</div>
                      </div>
                    </button>
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
        </>
      )}
    </header>

        {/* Main Content Area */}
        <main
          ref={mainRef}
          className={`flex-1 min-w-0 w-full ${
            isChatPage
              ? 'p-0 md:p-3 overflow-hidden flex flex-col flex-1 min-h-0 h-full max-h-full'
              : 'p-3 sm:p-5 lg:p-6'
          }`}
        >
          <div
            key={location.pathname}
            className={`w-full ${
              isChatPage
                ? 'h-full flex-1 min-h-0 flex flex-col overflow-hidden'
                : 'animate-lms-page'
            }`}
          >
            {children || <Outlet />}
          </div>
        </main>
      </div>

      {/* Student Follow-up & Lesson Reminders Modal (Owner & Admin only) */}
      {(role === 'admin' || role === 'owner') && remindersModalOpen && (
        <StudentRemindersModal
          isOpen={remindersModalOpen}
          onClose={() => setRemindersModalOpen(false)}
        />
      )}

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
              console.error('Avatar upload failed:', err);
            }
          }
        }}
        title={t('users.editAvatar', 'Profil rasmini moslashtirish')}
      />

      {/* PWA Install Modal for PC, iPhone & Android */}
      <InstallAppModal
        isOpen={installModalOpen}
        onClose={() => setInstallModalOpen(false)}
      />
    </div>
  );
}
