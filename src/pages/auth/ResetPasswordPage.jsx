import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Mail,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Button from '@/components/ui/Button';

const resetSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ['confirmPassword'],
  });

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [requestMode, setRequestMode] = useState(false);
  const [requestEmail, setRequestEmail] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);

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
    resolver: zodResolver(resetSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const passwordValue = watch('password', '');

  // Strength score calculation
  const getPasswordStrength = (pass) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (pass.length >= 12) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score; // 0 to 5
  };

  const strengthScore = getPasswordStrength(passwordValue);

  const getStrengthLabel = (score) => {
    if (score <= 1) return { label: 'Weak', color: 'bg-red-500', text: 'text-red-500' };
    if (score <= 3) return { label: 'Moderate', color: 'bg-amber-500', text: 'text-amber-500' };
    return { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-500' };
  };

  const strength = getStrengthLabel(strengthScore);

  const onSubmitNewPassword = async (values) => {
    setServerError('');
    try {
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
      setServerError(err.message || 'Failed to update password');
    }
  };

  const handleSendResetEmail = async (e) => {
    e.preventDefault();
    if (!requestEmail || !requestEmail.includes('@')) {
      setServerError('Please enter a valid email address');
      return;
    }

    setRequestLoading(true);
    setServerError('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(requestEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setServerError(error.message);
        return;
      }

      setRequestSent(true);
    } catch (err) {
      setServerError(err.message || 'Failed to send reset email');
    } finally {
      setRequestLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-surface-light dark:bg-surface-dark transition-colors duration-200">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-surface-dark-secondary rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xl p-8 sm:p-10 transition-colors">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-brand-navy/10 dark:bg-blue-500/10 text-brand-navy dark:text-blue-400 items-center justify-center mb-4 ring-8 ring-blue-50 dark:ring-surface-dark-tertiary">
              <KeyRound className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              {requestMode
                ? t('auth.forgotPassword', 'Forgot Password')
                : t('auth.resetPassword', 'Reset Password')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
              {requestMode
                ? 'Enter your account email to receive a password recovery link'
                : 'Enter and confirm your new secure password'}
            </p>
          </div>

          {/* Success Banner */}
          {success && (
            <div className="p-6 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center animate-fade-in">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                {t('auth.passwordChanged', 'Password successfully updated!')}
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                Redirecting you to sign in...
              </p>
            </div>
          )}

          {requestSent && (
            <div className="p-6 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-center animate-fade-in">
              <Mail className="w-12 h-12 text-brand-navy dark:text-blue-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Check your email
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                We sent a password reset link to <strong className="font-semibold">{requestEmail}</strong>.
              </p>
              <button
                type="button"
                onClick={() => setRequestSent(false)}
                className="mt-4 text-xs font-semibold text-brand-navy dark:text-blue-400 hover:underline"
              >
                Did not receive it? Try again
              </button>
            </div>
          )}

          {!success && !requestSent && (
            <>
              {/* Server Error Message */}
              {serverError && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-brand-red/20 text-brand-red dark:text-red-300 flex items-start gap-3 text-sm animate-fade-in">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span className="font-medium">{serverError}</span>
                </div>
              )}

              {requestMode ? (
                /* Request Reset Link Form */
                <form onSubmit={handleSendResetEmail} className="space-y-5">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="reqEmail"
                      className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300"
                    >
                      {t('common.email', 'Email Address')}
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        id="reqEmail"
                        type="email"
                        required
                        value={requestEmail}
                        onChange={(e) => setRequestEmail(e.target.value)}
                        placeholder="you@domain.com"
                        className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-surface-dark-tertiary text-gray-900 dark:text-white text-sm py-2.5 pl-10 pr-3.5 focus:outline-none focus:ring-2 focus:ring-brand-navy focus:border-brand-navy"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    isLoading={requestLoading}
                    className="bg-brand-navy hover:bg-brand-navy-light text-white font-semibold py-3 rounded-xl shadow-md"
                  >
                    Send Reset Link
                  </Button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setRequestMode(false)}
                      className="text-xs text-brand-navy dark:text-blue-400 font-medium hover:underline"
                    >
                      Already have a reset code/token? Enter new password
                    </button>
                  </div>
                </form>
              ) : (
                /* Set New Password Form */
                <form onSubmit={handleSubmit(onSubmitNewPassword)} className="space-y-5" noValidate>
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

                  {/* Password Strength Indicator */}
                  {passwordValue.length > 0 && (
                    <div className="space-y-1.5 animate-fade-in">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Password strength:</span>
                        <span className={`font-semibold ${strength.text}`}>{strength.label}</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex gap-1">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${strength.color}`}
                          style={{ width: `${Math.min(100, (strengthScore / 5) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

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

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    isLoading={isSubmitting}
                    className="bg-brand-navy hover:bg-brand-navy-light text-white font-semibold py-3 rounded-xl shadow-md"
                  >
                    {t('auth.resetPassword', 'Update Password')}
                  </Button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => setRequestMode(true)}
                      className="text-xs text-gray-500 dark:text-gray-400 hover:text-brand-navy dark:hover:text-white"
                    >
                      Need to request a reset link first?
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* Back link */}
          <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-800 text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-brand-navy dark:hover:text-white font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t('common.back', 'Back to login')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
