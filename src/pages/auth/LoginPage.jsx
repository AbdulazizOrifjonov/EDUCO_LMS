import React, { useState } from 'react';
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
} from 'lucide-react';
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
  const { signIn, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [showPassword, setShowPassword] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [serverError, setServerError] = useState('');
  const [quickLoggingInRole, setQuickLoggingInRole] = useState(null);

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
      rememberMe: Boolean(remembered),
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
      setServerError(err.message || t('common.error', 'An error occurred during sign in'));
    }
  };

  const handleQuickLogin = async (loginIdentifier, password, roleKey = '') => {
    setServerError('');
    setQuickLoggingInRole(roleKey || loginIdentifier);
    setValue('username', loginIdentifier);
    setValue('password', password);
    try {
      const { data, error } = await signIn(loginIdentifier, password);
      if (error) {
        setServerError(error.message || t('auth.invalidCredentials', 'Invalid username or password'));
        setQuickLoggingInRole(null);
        return;
      }
      const rawRole = data?.user?.user_metadata?.role || data?.profile?.role || roleKey || 'student';
      const userRole = String(rawRole).toLowerCase().trim();
      const targetPath = `/${userRole}/dashboard`;

      navigate(targetPath, { replace: true });

      // Safety fallback to ensure page transitions even on browser edge cases
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          if (window.location.pathname === '/login' || window.location.pathname === '/') {
            window.location.replace(targetPath);
          }
        }, 150);
      }
    } catch (err) {
      setServerError(err.message || 'Kirishda xatolik yuz berdi');
      setQuickLoggingInRole(null);
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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-navy flex items-center justify-center text-white shadow-md">
            <GraduationCap className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-brand-navy dark:text-white">
            EDUCO<span className="text-brand-red">.</span>LMS
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
              <div className="inline-flex w-14 h-14 rounded-2xl bg-brand-navy/10 dark:bg-blue-500/10 text-brand-navy dark:text-blue-400 items-center justify-center mb-4 ring-8 ring-blue-50 dark:ring-surface-dark-tertiary">
                <GraduationCap className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                {t('auth.loginTitle', 'Sign in to EDUCO')}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
                {t('auth.loginSubtitle', 'Enter your credentials to continue to your dashboard')}
              </p>
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

            {/* Quick Demo Access - Dedicated Teachers Section */}
            <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">👨‍🏫</span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    {t('common.teacherDemoAccounts', "O'qituvchilar kabineti (Demo kirish)")}
                  </h3>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                  1-klikda kirish
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3">
                {t('common.teacherDemoHint', "Istalgan o'qituvchi kartasini bosing va to'g'ridan-to'g'ri o'qituvchi profiliga kiring:")}
              </p>

              {/* 3 Teachers Cards */}
              <div className="space-y-2 mb-4">
                {/* Teacher 1: Bobur Mirzayev */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => handleQuickLogin('+998 90 333 44 55', 'Bobur#2026!', 'teacher')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleQuickLogin('+998 90 333 44 55', 'Bobur#2026!', 'teacher');
                    }
                  }}
                  className="p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-100/70 dark:hover:bg-emerald-950/50 transition-all flex items-center justify-between gap-2 shadow-xs cursor-pointer active:scale-[0.99] group select-none"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-gray-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                        Bobur Mirzayev
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-medium">
                        IT & Backend
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 font-mono mt-0.5 flex items-center gap-2">
                      <span>+998 90 333 44 55</span>
                      <span className="text-[10px] text-gray-400">•</span>
                      <span className="text-gray-600 dark:text-gray-300 font-semibold">Bobur#2026!</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isSubmitting || authLoading}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickLogin('+998 90 333 44 55', 'Bobur#2026!', 'teacher');
                    }}
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>{quickLoggingInRole === 'teacher' && watch('username') === '+998 90 333 44 55' ? 'Kirilmoqda...' : 'Kirish'}</span>
                    <span className="text-[10px]">→</span>
                  </button>
                </div>

                {/* Teacher 2: Nilufar Usmonova */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => handleQuickLogin('+998 90 444 55 66', 'Nilufar#2026!', 'teacher')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleQuickLogin('+998 90 444 55 66', 'Nilufar#2026!', 'teacher');
                    }
                  }}
                  className="p-2.5 rounded-xl border border-teal-200 dark:border-teal-900/60 bg-teal-50/40 dark:bg-teal-950/20 hover:bg-teal-100/70 dark:hover:bg-teal-950/50 transition-all flex items-center justify-between gap-2 shadow-xs cursor-pointer active:scale-[0.99] group select-none"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-gray-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">
                        Nilufar Usmonova
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 font-medium">
                        Ingliz tili (IELTS)
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 font-mono mt-0.5 flex items-center gap-2">
                      <span>+998 90 444 55 66</span>
                      <span className="text-[10px] text-gray-400">•</span>
                      <span className="text-gray-600 dark:text-gray-300 font-semibold">Nilufar#2026!</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isSubmitting || authLoading}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickLogin('+998 90 444 55 66', 'Nilufar#2026!', 'teacher');
                    }}
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>{quickLoggingInRole === 'teacher' && watch('username') === '+998 90 444 55 66' ? 'Kirilmoqda...' : 'Kirish'}</span>
                    <span className="text-[10px]">→</span>
                  </button>
                </div>

                {/* Teacher 3: Abdulazizbek Orifjonov */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => handleQuickLogin('+998 93 582 17 74', 'Ltmy$95W2', 'teacher')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleQuickLogin('+998 93 582 17 74', 'Ltmy$95W2', 'teacher');
                    }
                  }}
                  className="p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 hover:bg-indigo-100/70 dark:hover:bg-indigo-950/50 transition-all flex items-center justify-between gap-2 shadow-xs cursor-pointer active:scale-[0.99] group select-none"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-gray-900 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
                        Abdulazizbek Orifjonov
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-medium">
                        Frontend & Web
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 font-mono mt-0.5 flex items-center gap-2">
                      <span>+998 93 582 17 74</span>
                      <span className="text-[10px] text-gray-400">•</span>
                      <span className="text-gray-600 dark:text-gray-300 font-semibold">Ltmy$95W2</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isSubmitting || authLoading}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickLogin('+998 93 582 17 74', 'Ltmy$95W2', 'teacher');
                    }}
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>{quickLoggingInRole === 'teacher' && watch('username') === '+998 93 582 17 74' ? 'Kirilmoqda...' : 'Kirish'}</span>
                    <span className="text-[10px]">→</span>
                  </button>
                </div>
              </div>

              {/* Other Roles Demo Access */}
              <div className="pt-3 border-t border-dashed border-gray-200 dark:border-gray-800">
                <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-2">
                  {t('common.otherRolesDemo', 'Boshqa rollar (1-klikda tezkor kirish):')}
                </p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    disabled={isSubmitting || authLoading}
                    onClick={() => handleQuickLogin('+998 90 111 22 33', 'Educo#2026!Pro', 'owner')}
                    className="p-2.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 text-brand-navy dark:text-blue-300 font-medium hover:bg-blue-100/70 dark:hover:bg-blue-900/50 active:scale-95 transition-all text-center shadow-xs flex flex-col items-center gap-0.5 cursor-pointer"
                  >
                    <span className="font-bold text-xs">👑 Rahbar</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                      {quickLoggingInRole === 'owner' ? 'Kirilmoqda...' : 'Alisher Q.'}
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting || authLoading}
                    onClick={() => handleQuickLogin('+998 90 222 33 44', 'Malika#2026!', 'admin')}
                    className="p-2.5 rounded-xl border border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 font-medium hover:bg-purple-100/70 dark:hover:bg-purple-900/50 active:scale-95 transition-all text-center shadow-xs flex flex-col items-center gap-0.5 cursor-pointer"
                  >
                    <span className="font-bold text-xs">🛡️ Admin</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                      {quickLoggingInRole === 'admin' ? 'Kirilmoqda...' : 'Malika K.'}
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting || authLoading}
                    onClick={() => handleQuickLogin('+998 90 555 66 77', 'Jasur#2026!', 'student')}
                    className="p-2.5 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 font-medium hover:bg-amber-100/70 dark:hover:bg-amber-900/50 active:scale-95 transition-all text-center shadow-xs flex flex-col items-center gap-0.5 cursor-pointer"
                  >
                    <span className="font-bold text-xs">🎓 O'quvchi</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                      {quickLoggingInRole === 'student' ? 'Kirilmoqda...' : 'Jasur R.'}
                    </span>
                  </button>
                </div>
              </div>
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
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-6 text-center text-xs text-gray-500 dark:text-gray-400">
        &copy; {new Date().getFullYear()} EDUCO LMS. All rights reserved.
      </footer>
    </div>
  );
}
