import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import {
  GraduationCap,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  Globe,
  Sun,
  Moon,
  CheckCircle2,
  Download,
} from 'lucide-react';
import InstallAppModal from '@/components/InstallAppModal';
import useAuth from '@/hooks/useAuth';
import useTheme from '@/hooks/useTheme';
import Button from '@/components/ui/Button';
import { SUPPORTED_LANGUAGES, ROLES } from '@/lib/constants';
import { LanguageFlag } from '@/components/LanguageSelector';
import { formatUzPhone, cleanUzPhone } from '@/utils/phoneFormat';

const loginSchema = z.object({
  username: z.string().min(1, 'Telefon raqam yoki login kiritilishi shart'),
  password: z.string().min(1, 'Parol kiritilishi shart'),
  rememberMe: z.boolean().optional(),
});

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signIn, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Automatic redirect if user already has an active remembered session
  useEffect(() => {
    if (!authLoading && user && profile) {
      const rawRole = profile?.role || user?.user_metadata?.role || 'student';
      const userRole = String(rawRole).toLowerCase().trim();
      const from = location.state?.from?.pathname;
      if (from && from !== '/login' && from !== '/unauthorized' && from.startsWith(`/${userRole}`)) {
        navigate(from, { replace: true });
        return;
      }
      switch (userRole) {
        case 'owner':
          navigate('/owner/dashboard', { replace: true });
          break;
        case 'admin':
          navigate('/admin/dashboard', { replace: true });
          break;
        case 'teacher':
          navigate('/teacher/dashboard', { replace: true });
          break;
        case 'student':
        default:
          navigate('/student/dashboard', { replace: true });
          break;
      }
    }
  }, [user, profile, authLoading, navigate, location.state]);

  const [showPassword, setShowPassword] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [serverError, setServerError] = useState('');
  const [installModalOpen, setInstallModalOpen] = useState(false);

  // Role passed from navbar dropdown (e.g. ?role=owner)
  const searchParams = new URLSearchParams(location.search);
  const roleParam = searchParams.get('role')?.toLowerCase();

  const ROLE_BADGES = {
    owner: { label: 'Boshqaruvchi (Asoschi)', icon: '👑', color: 'from-amber-500/10 to-orange-500/10 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700/60' },
    admin: { label: 'Administrator', icon: '👨‍💼', color: 'from-blue-500/10 to-indigo-500/10 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700/60' },
    teacher: { label: "O'qituvchi", icon: '👨‍🏫', color: 'from-purple-500/10 to-indigo-500/10 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700/60' },
    student: { label: "O'quvchi", icon: '🎓', color: 'from-emerald-500/10 to-teal-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60' },
  };
  const activeRoleBadge = roleParam ? ROLE_BADGES[roleParam] : null;

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language) || SUPPORTED_LANGUAGES[0];
  const isRTL = currentLang.dir === 'rtl';

  const remembered =
    typeof window !== 'undefined' && typeof window.localStorage?.getItem === 'function'
      ? window.localStorage.getItem('educo_remember_username') || ''
      : '';
  const initialUsername = remembered
    ? (remembered.startsWith('+') || /^\d+$/.test(remembered) ? formatUzPhone(remembered) : remembered)
    : '+998 ';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: initialUsername,
      password: '',
      rememberMe: remembered ? true : true, // Always default to true so user session is remembered!
    },
  });

  const usernameValue = watch('username');

  const onSubmit = async (values) => {
    setServerError('');
    try {
      const identifier = (values.username || '').trim();
      const digits = identifier.replace(/\D/g, '');
      const hasAlpha = /[a-zA-Z]/.test(identifier);

      if (!hasAlpha && (!digits || digits === '998')) {
        setServerError('Iltimos, telefon raqamingizni yoki loginingizni to‘liq kiriting!');
        return;
      }

      const { data, error } = await signIn(identifier, values.password);

      if (error) {
        setServerError(error.message || t('auth.invalidCredentials', 'Invalid username or password'));
        return;
      }

      try {
        if (values.rememberMe) {
          window.localStorage?.setItem?.('educo_remember_username', values.username);
        } else {
          window.localStorage?.removeItem?.('educo_remember_username');
        }
      } catch (_) {}

      // Check role and redirect to role dashboard or intended destination
      const rawRole = data?.user?.user_metadata?.role || 'student';
      const userRole = String(rawRole).toLowerCase().trim();
      const from = location.state?.from?.pathname;

      // Only redirect to 'from' if it safely belongs to the user's role prefix
      if (from && from !== '/login' && from !== '/unauthorized' && from.startsWith(`/${userRole}`)) {
        navigate(from, { replace: true });
        return;
      }

      switch (userRole) {
        case ROLES.OWNER:
        case 'owner':
          navigate('/owner/dashboard', { replace: true });
          break;
        case ROLES.ADMIN:
        case 'admin':
          navigate('/admin/dashboard', { replace: true });
          break;
        case ROLES.TEACHER:
        case 'teacher':
          navigate('/teacher/dashboard', { replace: true });
          break;
        case ROLES.STUDENT:
        case 'student':
        default:
          navigate('/student/dashboard', { replace: true });
          break;
      }
    } catch (err) {
      setServerError(err.message || 'Kirishda xatolik yuz berdi');
    }
  };

  const handleQuickDemoLogin = async (username, password) => {
    setValue('username', username, { shouldValidate: true });
    setValue('password', password, { shouldValidate: true });
    setServerError('');
    try {
      const { data, error } = await signIn(username, password);
      if (error) {
        setServerError(error.message || 'Kirishda xatolik yuz berdi');
        return;
      }
      try {
        window.localStorage?.setItem?.('educo_remember_username', username);
      } catch (_) {}

      const rawRole = data?.user?.user_metadata?.role || 'student';
      const userRole = String(rawRole).toLowerCase().trim();
      switch (userRole) {
        case 'owner':
          navigate('/owner/dashboard', { replace: true });
          break;
        case 'admin':
          navigate('/admin/dashboard', { replace: true });
          break;
        case 'teacher':
          navigate('/teacher/dashboard', { replace: true });
          break;
        case 'student':
        default:
          navigate('/student/dashboard', { replace: true });
          break;
      }
    } catch (err) {
      setServerError(err.message || 'Kirishda xatolik yuz berdi');
    }
  };

  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
    try {
      window.localStorage?.setItem?.('educo-lang', langCode);
    } catch (e) {}
    setLangDropdownOpen(false);
    const selected = SUPPORTED_LANGUAGES.find((l) => l.code === langCode);
    document.documentElement.dir = selected?.dir || 'ltr';
    document.documentElement.lang = langCode;
  };

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className="min-h-screen w-full flex flex-col justify-between bg-surface-light dark:bg-surface-dark transition-colors duration-200"
    >
      {/* Top Header: Brand Corner & Controls */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img
            src="/educo-logo.png"
            alt="EDUCO"
            className="h-8 w-auto object-contain dark:hidden"
          />
          <img
            src="/educo-logo-white.png"
            alt="EDUCO"
            className="h-8 w-auto object-contain hidden dark:block"
          />
          <span className="text-xs font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-100 text-brand-navy dark:bg-blue-900/50 dark:text-blue-300">
            LMS
          </span>
        </div>

        {/* Language selector & Theme toggle */}
        <div className="flex items-center gap-3 relative">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark-secondary text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-surface-dark-tertiary transition-colors shadow-sm"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-brand-navy" />}
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark-secondary text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-surface-dark-tertiary text-sm font-medium transition-colors shadow-sm"
            >
              <LanguageFlag code={currentLang.code} className="w-5 h-3.5" />
              <span className="hidden sm:inline">{currentLang.nativeName}</span>
            </button>

            {langDropdownOpen && (
              <div
                className={`absolute ${
                  isRTL ? 'left-0' : 'right-0'
                } mt-2 w-44 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark-secondary shadow-dropdown py-1.5 z-50`}
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => changeLanguage(lang.code)}
                    className={`w-full flex items-center justify-between px-3.5 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-surface-dark-tertiary transition-colors ${
                      i18n.language === lang.code
                        ? 'text-brand-navy dark:text-blue-400 font-semibold bg-blue-50/50 dark:bg-surface-dark-tertiary/50'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <LanguageFlag code={lang.code} className="w-5 h-3.5" />
                      <span>{lang.nativeName}</span>
                    </span>
                    {i18n.language === lang.code && <CheckCircle2 className="w-4 h-4 text-brand-navy dark:text-blue-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Login Card Area */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Card Container */}
          <div className="bg-white dark:bg-surface-dark-secondary rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xl p-8 sm:p-10 transition-colors">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <img src="/educo-logo.png" alt="EDUCO" className="h-10 w-auto object-contain dark:hidden" />
                <img src="/educo-logo-white.png" alt="EDUCO" className="h-10 w-auto object-contain hidden dark:block" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                {t('auth.loginTitle', 'Sign in to EDUCO')}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
                {t('auth.loginSubtitle', 'Enter your credentials to continue to your dashboard')}
              </p>
              {activeRoleBadge && (
                <div className="mt-3 flex justify-center">
                  <div className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold border bg-gradient-to-r ${activeRoleBadge.color} shadow-xs`}>
                    <span className="text-sm">{activeRoleBadge.icon}</span>
                    <span>{activeRoleBadge.label} kabineti</span>
                  </div>
                </div>
              )}
            </div>

            {/* Error Banner */}
            {serverError && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-brand-red/20 text-brand-red dark:text-red-300 flex items-start gap-3 text-sm animate-fade-in">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span className="font-medium">{serverError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              {/* Username Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="username"
                  className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300"
                >
                  {t('auth.loginIdentifier', 'Telefon raqam yoki Login')}
                </label>
                <div className="relative flex items-center">
                  <div className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 pl-3.5 rtl:pl-0 rtl:pr-3.5 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    placeholder="+998 90 123 45 67 yoki username"
                    value={usernameValue ?? ''}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === '') {
                        setValue('username', '', { shouldValidate: true });
                        return;
                      }
                      if (/[a-zA-Z]/.test(raw)) {
                        setValue('username', raw, { shouldValidate: true });
                        return;
                      }
                      if (raw === '+') {
                        setValue('username', '+', { shouldValidate: true });
                        return;
                      }
                      const formatted = formatUzPhone(raw);
                      setValue('username', formatted, { shouldValidate: true });
                    }}
                    onFocus={(e) => {
                      if (!e.target.value || !e.target.value.trim()) {
                        setValue('username', '+998 ', { shouldValidate: false });
                      }
                    }}
                    className={`w-full rounded-xl border bg-white dark:bg-surface-dark-tertiary text-gray-900 dark:text-white text-sm py-2.5 pl-10 rtl:pl-3.5 rtl:pr-10 pr-3.5 focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-surface-dark transition-colors ${
                      errors.username
                        ? 'border-brand-red focus:border-brand-red focus:ring-brand-red'
                        : 'border-gray-300 dark:border-gray-700 focus:border-brand-navy focus:ring-brand-navy dark:focus:border-blue-500 dark:focus:ring-blue-500'
                    }`}
                  />
                </div>
                {errors.username && (
                  <p className="text-xs text-brand-red dark:text-red-400 font-medium">
                    {errors.username.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300"
                  >
                    {t('auth.password', 'Password')}
                  </label>
                  <button
                    type="button"
                    onClick={() => navigate('/reset-password')}
                    className="text-xs font-medium text-brand-navy hover:text-brand-navy-light dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  >
                    {t('auth.forgotPassword', 'Forgot password?')}
                  </button>
                </div>
                <div className="relative flex items-center">
                  <div className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 pl-3.5 rtl:pl-0 rtl:pr-3.5 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    {...register('password')}
                    className={`w-full rounded-xl border bg-white dark:bg-surface-dark-tertiary text-gray-900 dark:text-white text-sm py-2.5 pl-10 rtl:pl-10 rtl:pr-10 pr-10 focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-surface-dark transition-colors ${
                      errors.password
                        ? 'border-brand-red focus:border-brand-red focus:ring-brand-red'
                        : 'border-gray-300 dark:border-gray-700 focus:border-brand-navy focus:ring-brand-navy dark:focus:border-blue-500 dark:focus:ring-blue-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 pr-3 rtl:pr-0 rtl:pl-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-brand-red dark:text-red-400 font-medium">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    {...register('rememberMe')}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-brand-navy focus:ring-brand-navy dark:focus:ring-offset-surface-dark accent-brand-navy cursor-pointer"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    {t('auth.rememberMe', 'Remember me')}
                  </span>
                </label>
              </div>

              {/* Sign in Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isSubmitting || authLoading}
                className="mt-2 bg-brand-navy hover:bg-brand-navy-light text-white font-semibold py-3 rounded-xl shadow-md"
              >
                {t('auth.signIn', 'Sign In')}
              </Button>
            </form>

            {/* Quick Demo Login Section (Faqat Boshliq) */}
            <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Boshliq (Owner) uchun tezkor kirish:
                </span>
                <span className="text-[10px] text-gray-400 font-medium">1-bosishda kirish</span>
              </div>

              {/* Featured Boshliq Button */}
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('abbosbek', 'AbbosBek1415')}
                disabled={isSubmitting || authLoading}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/20 hover:from-amber-500/25 hover:to-orange-500/20 border-2 border-amber-400 dark:border-amber-600/60 text-amber-950 dark:text-amber-200 font-bold text-sm shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                title="Boshliq kabinetiga 1 bosishda kirish"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center text-base shadow-xs shrink-0">
                    👑
                  </div>
                  <div className="text-left">
                    <div className="leading-tight flex items-center gap-1.5">
                      <span>Boshliq (Abbosbek)</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 font-black uppercase">Owner</span>
                    </div>
                    <span className="text-[11px] font-normal text-amber-800/80 dark:text-amber-300/80">
                      abbosbek • AbbosBek1415
                    </span>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-lg bg-amber-500 text-white font-bold shrink-0 shadow-xs">
                  Kirish &rarr;
                </span>
              </button>
            </div>

            {/* Quick Demo Switcher Tip */}
            <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('auth.inviteNote', 'Have an invitation link?')}{' '}
                <button
                  type="button"
                  onClick={() => navigate('/invite')}
                  className="font-semibold text-brand-navy dark:text-blue-400 hover:underline"
                >
                  {t('auth.acceptInvitation', 'Activate your account')}
                </button>
              </p>
            </div>

            {/* Install App Link */}
            <div className="mt-4 pt-3 border-t border-gray-100/80 dark:border-gray-800 text-center">
              <button
                type="button"
                onClick={() => setInstallModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50/80 hover:bg-blue-100/90 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Ilovani kompyuter yoki iPhone‘ga o‘rnatish 📲</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* PWA Install Modal */}
      <InstallAppModal
        isOpen={installModalOpen}
        onClose={() => setInstallModalOpen(false)}
      />

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-6 text-center text-xs text-gray-500 dark:text-gray-400">
        &copy; {new Date().getFullYear()} EDUCO LMS. All rights reserved.
      </footer>
    </div>
  );
}
