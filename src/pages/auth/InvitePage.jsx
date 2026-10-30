import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import {
  Lock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Button from '@/components/ui/Button';

const inviteSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export default function InvitePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailFromUrl = searchParams.get('email') || '';

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const passwordValue = watch('password', '');

  // Requirement checks
  const hasMinLength = passwordValue.length >= 8;
  const hasUppercase = /[A-Z]/.test(passwordValue);
  const hasNumber = /[0-9]/.test(passwordValue);
  const hasSpecial = /[^A-Za-z0-9]/.test(passwordValue);

  const onSubmit = async (values) => {
    setServerError('');
    try {
      // Update the user password in Supabase
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (error) {
        setServerError(error.message);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2500);
    } catch (err) {
      setServerError(err.message || 'Failed to set password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-surface-light dark:bg-surface-dark transition-colors duration-200">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-surface-dark-secondary rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xl p-8 sm:p-10 transition-colors">
          {/* Logo & Heading */}
          <div className="text-center mb-8">
            <div className="inline-flex p-3 rounded-2xl bg-white shadow-md border border-gray-100 dark:border-gray-700 items-center justify-center mb-4 ring-8 ring-blue-50 dark:ring-surface-dark-tertiary">
              <img src="/educo-logo.png" alt="EDUCO" className="h-9 w-auto object-contain" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              {t('auth.welcomeToEduco', 'Welcome to EDUCO')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
              {emailFromUrl
                ? `Complete your setup for ${emailFromUrl}`
                : t('auth.setYourPassword', 'Set your password to activate your account')}
            </p>
          </div>

          {/* Success Notification */}
          {success ? (
            <div className="p-6 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center animate-fade-in">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                {t('auth.passwordChanged', 'Password set successfully!')}
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                Redirecting to login page...
              </p>
            </div>
          ) : (
            <>
              {/* Error Banner */}
              {serverError && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-brand-red/20 text-brand-red dark:text-red-300 flex items-start gap-3 text-sm animate-fade-in">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span className="font-medium">{serverError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                {/* New Password */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300"
                  >
                    {t('auth.newPassword', 'New Password')}
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      {...register('password')}
                      className={`w-full rounded-xl border bg-white dark:bg-surface-dark-tertiary text-gray-900 dark:text-white text-sm py-2.5 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-surface-dark transition-colors ${
                        errors.password
                          ? 'border-brand-red focus:border-brand-red focus:ring-brand-red'
                          : 'border-gray-300 dark:border-gray-700 focus:border-brand-navy focus:ring-brand-navy'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="confirmPassword"
                    className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300"
                  >
                    {t('auth.confirmPassword', 'Confirm Password')}
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      {...register('confirmPassword')}
                      className={`w-full rounded-xl border bg-white dark:bg-surface-dark-tertiary text-gray-900 dark:text-white text-sm py-2.5 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-surface-dark transition-colors ${
                        errors.confirmPassword
                          ? 'border-brand-red focus:border-brand-red focus:ring-brand-red'
                          : 'border-gray-300 dark:border-gray-700 focus:border-brand-navy focus:ring-brand-navy'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-brand-red dark:text-red-400 font-medium">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                {/* Password Requirements Checklist */}
                <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-surface-dark-tertiary border border-gray-100 dark:border-gray-800 space-y-2">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                    {t('auth.passwordRequirements', 'Password Requirements:')}
                  </span>
                  <ul className="text-xs space-y-1.5 text-gray-500 dark:text-gray-400">
                    <li className="flex items-center gap-2">
                      <CheckCircle2
                        className={`w-3.5 h-3.5 ${
                          hasMinLength ? 'text-emerald-500' : 'text-gray-300 dark:text-gray-600'
                        }`}
                      />
                      <span className={hasMinLength ? 'text-gray-900 dark:text-white font-medium' : ''}>
                        At least 8 characters
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2
                        className={`w-3.5 h-3.5 ${
                          hasUppercase ? 'text-emerald-500' : 'text-gray-300 dark:text-gray-600'
                        }`}
                      />
                      <span className={hasUppercase ? 'text-gray-900 dark:text-white font-medium' : ''}>
                        At least one uppercase letter (A-Z)
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2
                        className={`w-3.5 h-3.5 ${
                          hasNumber ? 'text-emerald-500' : 'text-gray-300 dark:text-gray-600'
                        }`}
                      />
                      <span className={hasNumber ? 'text-gray-900 dark:text-white font-medium' : ''}>
                        At least one number (0-9)
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  isLoading={isSubmitting}
                  icon={ArrowRight}
                  iconPosition="right"
                  className="bg-brand-navy hover:bg-brand-navy-light text-white font-semibold py-3 rounded-xl shadow-md"
                >
                  {t('auth.acceptInvitation', 'Activate Account & Continue')}
                </Button>
              </form>
            </>
          )}

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-brand-navy dark:hover:text-white font-medium"
            >
              {t('common.back', 'Back to login')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
