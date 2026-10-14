import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  User,
  Mail,
  Phone,
  Shield,
  KeyRound,
  Camera,
  CheckCircle,
  AlertCircle,
  Globe,
  Moon,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import { useThemeStore } from '@/hooks/useTheme';
import { Button, Card, Badge, Input, PasswordStrengthInput, evaluatePasswordStrength } from '@/components/ui';
import { LanguageFlag } from '@/components/LanguageSelector';
import { updateProfile, changePassword, uploadAvatar } from '@/services/settingsService';

export default function ProfilePage() {
  const { t, i18n } = useTranslation();
  const { profile, user, fetchProfile } = useAuth();
  const { theme, setTheme } = useThemeStore();

  // Profile fields state
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone_number || profile?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Handle Profile Update
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profile?.id) return;
    try {
      setProfileSaving(true);
      setProfileSuccess('');
      await updateProfile(profile.id, {
        full_name: fullName,
        phone_number: phoneNumber,
      });
      await fetchProfile(profile.id);
      setProfileSuccess(t('users.updateSuccess', 'Profil ma‘lumotlari yangilandi!'));
      setTimeout(() => setProfileSuccess(''), 4000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setProfileSaving(false);
    }
  };

  // Handle Avatar File Upload
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    const uid = profile?.id || user?.id;
    if (!file || !uid) return;

    try {
      setAvatarUploading(true);
      setProfileSuccess('');
      const uploadedUrl = await uploadAvatar(uid, file);
      setAvatarUrl(uploadedUrl);
      await fetchProfile(uid);
      setProfileSuccess(t('users.avatarUpdated', 'Profil rasmi muvaffaqiyatli o‘rnatildi!'));
      setTimeout(() => setProfileSuccess(''), 4000);
    } catch (err) {
      console.error('Failed to upload avatar:', err);
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    const uid = profile?.id || user?.id;
    if (!uid) return;
    try {
      setAvatarUploading(true);
      await uploadAvatar(uid, null);
      setAvatarUrl('');
      await fetchProfile(uid);
      setProfileSuccess(t('users.avatarRemoved', 'Profil rasmi olib tashlandi.'));
      setTimeout(() => setProfileSuccess(''), 4000);
    } catch (err) {
      console.error('Failed to remove avatar:', err);
    } finally {
      setAvatarUploading(false);
    }
  };

  // Handle Password Change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    const strength = evaluatePasswordStrength(newPassword);
    if (!strength.allMet) {
      setPasswordError(
        t(
          'users.passwordMustBeStrong',
          'Yangi parol xavfsiz (yashil) bo‘lishi uchun katta-kichik harf, raqam va maxsus belgi (!@#$) bo‘lishi shart!'
        )
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t('errors.passwordMismatch', 'Parollar mos kelmadi.'));
      return;
    }

    try {
      setPasswordSaving(true);
      await changePassword(currentPassword, newPassword, profile?.id || user?.id);
      setPasswordSuccess(t('auth.passwordChanged', 'Parol muvaffaqiyatli yangilandi!'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 4000);
    } catch (err) {
      setPasswordError(err.message || 'Parolni yangilab bo‘lmadi.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    try {
      localStorage.setItem('educo-lang', lang);
    } catch (e) {}
    document.documentElement.lang = lang;
    if (lang === 'ar') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  };

  const displayAvatar = avatarUrl || profile?.avatar_url || '';

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t('settings.profileSettings', 'User Account & Security')}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {t('settings.settingsSubtitle', 'Manage your personal details, credentials, and user preferences')}
        </p>
      </div>

      {/* Profile Overview Card */}
      <Card>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-surface-dark-tertiary border-2 border-brand-navy dark:border-blue-500 flex items-center justify-center text-2xl font-bold text-brand-navy dark:text-blue-400 shadow-md">
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt={fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                fullName ? fullName.charAt(0).toUpperCase() : 'U'
              )}
            </div>

            <label
              title={t('users.uploadAvatar', 'Profilga rasm qo‘yish')}
              className="absolute bottom-0 right-0 p-2 bg-brand-navy hover:bg-blue-800 text-white rounded-full cursor-pointer shadow-lg transition-transform hover:scale-105"
            >
              <Camera className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={avatarUploading}
              />
            </label>
          </div>

          <div className="flex-1 text-center sm:text-left rtl:sm:text-right space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {fullName || profile?.full_name || 'EDUCO'}
              </h2>
              <Badge variant="primary" size="sm" className="capitalize w-fit mx-auto sm:mx-0">
                {t('roles.' + (profile?.role || 'student'), { defaultValue: profile?.role || 'Student' })}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
              {profile?.phone || profile?.phone_number || profile?.email || user?.email}
            </p>

            {/* Explicit Upload / Remove Avatar Buttons */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <label className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-brand-navy hover:bg-blue-800 text-white text-xs font-semibold cursor-pointer shadow-sm transition-colors">
                <Camera className="w-3.5 h-3.5" />
                <span>
                  {displayAvatar
                    ? t('users.changeAvatar', 'Rasmni almashtirish')
                    : t('users.uploadAvatar', 'Profilga rasm qo‘yish')}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                  disabled={avatarUploading}
                />
              </label>

              {displayAvatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={avatarUploading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 text-xs font-semibold transition-colors"
                >
                  {t('users.removeAvatar', 'Rasmni o‘chirish')}
                </button>
              )}
            </div>

            {avatarUploading && (
              <p className="text-xs text-blue-500 animate-pulse mt-1">{t('common.loading')}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Edit Details Form */}
      <Card
        title={t('common.details')}
        subtitle={t('users.editSubtitle')}
      >
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          {profileSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>{profileSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label={t('common.name')}
                placeholder="First & Last Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div>
              <Input
                label={t('common.phone')}
                placeholder="+998 90 123 45 67"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label={t('auth.username')}
                value={profile?.email || user?.email || ''}
                disabled
              />
            </div>

            <div>
              <Input
                label={t('users.role')}
                value={t('roles.' + (profile?.role || 'student'), { defaultValue: profile?.role || 'STUDENT' })}
                disabled
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              isLoading={profileSaving}
            >
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Card>

      {/* Change Password Card */}
      <Card
        title={t('auth.changePassword')}
        subtitle={t('auth.passwordRequirements')}
      >
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {passwordSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-brand-red text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{passwordError}</span>
            </div>
          )}

          <div>
            <Input
              type="password"
              label={t('auth.currentPassword')}
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-4">
            <PasswordStrengthInput
              label={t('auth.newPassword', 'Yangi parol')}
              value={newPassword}
              onValueChange={(val) => setNewPassword(val)}
              placeholder="Masalan: Educo#2026"
              required
            />

            <Input
              type="password"
              label={t('auth.confirmPassword', 'Yangi parolni tasdiqlang')}
              placeholder="Yangi parolni qayta kiriting"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              isLoading={passwordSaving}
            >
              {t('auth.changePassword')}
            </Button>
          </div>
        </form>
      </Card>

      {/* Preferences Section */}
      <Card
        title={t('common.settings', 'Local Preferences')}
        subtitle={t('settings.languageSettings', 'Preferred language interface and system display mode')}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 block mb-2">
              {t('common.theme', 'Display Theme')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['light', 'dark', 'system'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setTheme(m)}
                  className={`
                    py-2 px-3 text-xs font-medium rounded-lg capitalize border transition-all
                    ${
                      theme === m
                        ? 'border-brand-navy bg-blue-50 dark:bg-blue-950/40 text-brand-navy dark:text-blue-300 font-semibold ring-1 ring-brand-navy'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark-secondary text-gray-700 dark:text-gray-300'
                    }
                  `}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 block mb-2">
              {t('common.language', 'Language')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { code: 'uz', label: "O'zbek" },
                { code: 'ru', label: 'Русский' },
                { code: 'en', label: 'English' },
              ].map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`
                    py-2 px-2 text-xs font-medium rounded-lg border transition-all flex items-center justify-center gap-1.5
                    ${
                      i18n.language === lang.code
                        ? 'border-brand-navy bg-blue-50 dark:bg-blue-950/40 text-brand-navy dark:text-blue-300 font-semibold ring-1 ring-brand-navy'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark-secondary text-gray-700 dark:text-gray-300'
                    }
                  `}
                >
                  <LanguageFlag code={lang.code} className="w-4 h-3" />
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
