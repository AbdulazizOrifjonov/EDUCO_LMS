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

const loginSchema = z.object({
  username: z.string().min(1, 'Username or email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
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

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language) || SUPPORTED_LANGUAGES[0];
  const isRTL = currentLang.dir === 'rtl';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      const identifier = values.username.trim();
      const { data, error } = await signIn(identifier, values.password);

      if (error) {
        setServerError(error.message || t('auth.invalidCredentials', 'Invalid username or password'));
        return;
      }

      if (values.rememberMe) {
        localStorage.setItem('educo_remember_username', values.username);
      } else {
        localStorage.removeItem('educo_remember_username');
      }

      // Check role and redirect to role dashboard or intended destination
      const userRole = data?.user?.user_metadata?.role || 'student';
      const from = location.state?.from?.pathname;

      if (from && from !== '/login') {
        navigate(from, { replace: true });
        return;
      }

      switch (userRole) {
        case ROLES.OWNER:
          navigate('/owner', { replace: true });
          break;
        case ROLES.ADMIN:
          navigate('/admin', { replace: true });
          break;
        case ROLES.TEACHER:
          navigate('/teacher', { replace: true });
          break;
        case ROLES.STUDENT:
        default:
          navigate('/student', { replace: true });
          break;
      }
    } catch (err) {
      setServerError(err.message || t('common.error', 'An error occurred during sign in'));
    }
  };

  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
    try {
      localStorage.setItem('educo-lang', langCode);
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
                    {...register('username')}
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

            {/* Quick Demo Roles Access */}
            <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2.5 text-center">
                {t('common.quickDemo', 'Quick Demo Access / Test accounts')}:
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setValue('username', 'owner@educo.app');
                    setValue('password', 'Educo#2026!Pro');
                  }}
                  className="p-2.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 text-brand-navy dark:text-blue-300 font-medium hover:bg-blue-100/60 dark:hover:bg-blue-900/40 transition-colors text-left flex items-center justify-between shadow-xs"
                >
                  <span className="font-semibold">👑 {t('roles.owner', 'Owner')}</span>
                  <span className="text-[10px] opacity-75">Auto-fill</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setValue('username', 'admin@educo.app');
                    setValue('password', 'Educo#2026!Pro');
                  }}
                  className="p-2.5 rounded-xl border border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 font-medium hover:bg-purple-100/60 dark:hover:bg-purple-900/40 transition-colors text-left flex items-center justify-between shadow-xs"
                >
                  <span className="font-semibold">🛡️ {t('roles.admin', 'Admin')}</span>
                  <span className="text-[10px] opacity-75">Auto-fill</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setValue('username', 'teacher@educo.app');
                    setValue('password', 'Educo#2026!Pro');
                  }}
                  className="p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-medium hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 transition-colors text-left flex items-center justify-between shadow-xs"
                >
                  <span className="font-semibold">👨‍🏫 {t('roles.teacher', 'Teacher')}</span>
                  <span className="text-[10px] opacity-75">Auto-fill</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setValue('username', 'student@educo.app');
                    setValue('password', 'Educo#2026!Pro');
                  }}
                  className="p-2.5 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 font-medium hover:bg-amber-100/60 dark:hover:bg-amber-900/40 transition-colors text-left flex items-center justify-between shadow-xs"
                >
                  <span className="font-semibold">🎓 {t('roles.student', 'Student')}</span>
                  <span className="text-[10px] opacity-75">Auto-fill</span>
                </button>
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
