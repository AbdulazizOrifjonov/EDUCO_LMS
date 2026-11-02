import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
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
  ArrowLeft,
  Save,
  Trash2,
  Users,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import { useThemeStore } from '@/hooks/useTheme';
import { Button, Card, Badge, Input, PasswordStrengthInput, ImageCropperModal } from '@/components/ui';
import Select from '@/components/ui/Select';
import { LanguageFlag } from '@/components/LanguageSelector';
import { updateProfile, changePassword, uploadAvatar } from '@/services/settingsService';
import { localStore } from '@/lib/localStore';
import { ROLES } from '@/lib/constants';
import { toast } from '@/components/ui/Toast';
import { formatUzPhone } from '@/utils/phoneFormat';

export default function ProfilePage({ targetUserId: propTargetUserId } = {}) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const [searchParams] = useSearchParams();
  const queryUserId = searchParams.get('userId');

  const { profile, user, fetchProfile } = useAuth();
  const { theme, setTheme } = useThemeStore();

  const currentUserRole = String(profile?.role || user?.user_metadata?.role || 'owner').toLowerCase();
  const isOwner = currentUserRole === ROLES.OWNER || currentUserRole === 'owner';

  // Determine if viewing another user's profile or own profile
  const resolvedTargetId = propTargetUserId || paramId || queryUserId || null;
  const isViewingOther = Boolean(
    resolvedTargetId &&
    resolvedTargetId !== profile?.id &&
    resolvedTargetId !== user?.id
  );

  // Target user data state
  const [targetUser, setTargetUser] = useState(() => {
    if (!isViewingOther || !resolvedTargetId) return null;
    try {
      const all = localStore.getUsers();
      return all.find((u) => u.id === resolvedTargetId || u.username === resolvedTargetId) || null;
    } catch (_) {
      return null;
    }
  });

  // Profile fields state
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [username, setUsername] = useState('');
  const [userRole, setUserRole] = useState(ROLES.STUDENT);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [fatherPhone, setFatherPhone] = useState('');
  const [motherPhone, setMotherPhone] = useState('');

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI feedback states
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [cropModalFile, setCropModalFile] = useState(null);

  // Synchronize state with target user or own profile
  useEffect(() => {
    if (isViewingOther && resolvedTargetId) {
      const all = localStore.getUsers();
      const found = all.find((u) => u.id === resolvedTargetId || u.username === resolvedTargetId);
      if (found) {
        setTargetUser(found);
        setFullName(found.fullName || found.full_name || `${found.first_name || ''} ${found.last_name || ''}`.trim() || found.name || '');
        setPhoneNumber(found.phone || found.phone_number || '');
        setUsername(found.username || found.email || '');
        setUserRole(found.role || ROLES.STUDENT);
        setAvatarUrl(found.avatar_url || '');
        setFatherPhone(found.father_phone || '');
        setMotherPhone(found.mother_phone || '');
      }
    } else if (profile) {
      setFullName(profile.full_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.name || '');
      setPhoneNumber(profile.phone_number || profile.phone || '');
      setUsername(profile.email || user?.email || profile.username || '');
      setUserRole(profile.role || ROLES.OWNER);
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [resolvedTargetId, isViewingOther, profile, user]);

  // Handle Profile Update (Works for both own profile and target user)
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess('');

    try {
      if (isViewingOther && targetUser?.id) {
        // Save target user via localStore
        const cleanName = fullName.trim();
        const parts = cleanName.split(' ');
        const fName = parts[0] || cleanName;
        const lName = parts.slice(1).join(' ') || '';

        const updated = {
          ...targetUser,
          fullName: cleanName,
          full_name: cleanName,
          first_name: fName,
          last_name: lName,
          phone: phoneNumber.trim(),
          phone_number: phoneNumber.trim(),
          username: username.trim(),
          role: userRole,
          father_phone: fatherPhone.trim(),
          mother_phone: motherPhone.trim(),
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        };

        localStore.saveUser(updated);
        setTargetUser(updated);
        setProfileSuccess(t('users.updateSuccess', 'Foydalanuvchi ma‘lumotlari muvaffaqiyatli saqlandi!'));
        toast.success(t('users.updateSuccess', 'Foydalanuvchi ma‘lumotlari muvaffaqiyatli saqlandi!'));
      } else if (profile?.id) {
        // Save own profile
        await updateProfile(profile.id, {
          full_name: fullName,
          phone_number: phoneNumber,
        });
        await fetchProfile(profile.id);
        setProfileSuccess(t('users.updateSuccess', 'Profil ma‘lumotlari yangilandi!'));
        toast.success(t('users.updateSuccess', 'Profil ma‘lumotlari yangilandi!'));
      }
      setTimeout(() => setProfileSuccess(''), 4000);
    } catch (err) {
      console.error('Failed to update profile:', err);
      toast.error(err.message || 'Xatolik yuz berdi');
    } finally {
      setProfileSaving(false);
    }
  };

  // Handle Avatar Selection for Telegram-like Cropping
  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCropModalFile(file);
    }
    e.target.value = '';
  };

  const handleApplyCroppedAvatar = async (croppedDataUrl, croppedFile) => {
    setCropModalFile(null);
    const uid = isViewingOther ? targetUser?.id : (profile?.id || user?.id);
    if (!uid) return;

    try {
      setAvatarUploading(true);
      setProfileSuccess('');
      const uploadedUrl = await uploadAvatar(uid, croppedFile || croppedDataUrl);
      setAvatarUrl(uploadedUrl);

      if (isViewingOther && targetUser) {
        const updated = { ...targetUser, avatar_url: uploadedUrl };
        localStore.saveUser(updated);
        setTargetUser(updated);
      } else {
        await fetchProfile(uid);
      }

      setProfileSuccess(t('users.avatarUpdated', 'Profil rasmi muvaffaqiyatli o‘rnatildi!'));
      toast.success(t('users.avatarUpdated', 'Profil rasmi muvaffaqiyatli o‘rnatildi!'));
      setTimeout(() => setProfileSuccess(''), 4000);
    } catch (err) {
      console.error('Failed to upload avatar:', err);
      toast.error('Rasm yuklashda xatolik yuz berdi');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    const uid = isViewingOther ? targetUser?.id : (profile?.id || user?.id);
    if (!uid) return;
    try {
      setAvatarUploading(true);
      await uploadAvatar(uid, null);
      setAvatarUrl('');

      if (isViewingOther && targetUser) {
        const updated = { ...targetUser, avatar_url: '' };
        localStore.saveUser(updated);
        setTargetUser(updated);
      } else {
        await fetchProfile(uid);
      }

      setProfileSuccess(t('users.avatarRemoved', 'Profil rasmi olib tashlandi.'));
      toast.success(t('users.avatarRemoved', 'Profil rasmi olib tashlandi.'));
      setTimeout(() => setProfileSuccess(''), 4000);
    } catch (err) {
      console.error('Failed to remove avatar:', err);
      toast.error('Rasmni o‘chirishda xatolik');
    } finally {
      setAvatarUploading(false);
    }
  };

  // Handle Password Change / Reset
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!newPassword || newPassword.length < 6) {
      setPasswordError(
        t('users.passwordMinLength', 'Yangi parol kamida 6 ta belgidan iborat bo‘lishi kerak!')
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t('errors.passwordMismatch', 'Parollar mos kelmadi.'));
      return;
    }

    try {
      setPasswordSaving(true);
      if (isViewingOther && targetUser?.id) {
        // Owner/Admin directly resets target user's password without needing current password
        localStore.updateUserPassword(targetUser.id, newPassword);
        setPasswordSuccess(t('auth.passwordChanged', 'Foydalanuvchi yangi paroli muvaffaqiyatli o‘rnatildi!'));
        toast.success(t('auth.passwordChanged', 'Foydalanuvchi yangi paroli muvaffaqiyatli o‘rnatildi!'));
      } else {
        await changePassword(currentPassword, newPassword, profile?.id || user?.id);
        setPasswordSuccess(t('auth.passwordChanged', 'Parol muvaffaqiyatli yangilandi!'));
        toast.success(t('auth.passwordChanged', 'Parol muvaffaqiyatli yangilandi!'));
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 4000);
    } catch (err) {
      setPasswordError(err.message || 'Parolni yangilab bo‘lmadi.');
      toast.error(err.message || 'Parolni yangilab bo‘lmadi.');
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
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  const displayAvatar = avatarUrl || (isViewingOther ? targetUser?.avatar_url : profile?.avatar_url) || '';
  const currentDisplayName = fullName || (isViewingOther ? targetUser?.fullName : profile?.full_name) || 'User';
  const effectiveRole = String(userRole || (isViewingOther ? targetUser?.role : profile?.role) || 'student').toLowerCase();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button if viewing another user from users list */}
      {isViewingOther && (
        <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
          <button
            type="button"
            onClick={() => navigate(`/${currentUserRole}/users`)}
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('common.backToUsers', 'Foydalanuvchilar ro‘yxatiga qaytish')}</span>
          </button>
          <span className="text-xs px-3 py-1 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 font-bold border border-blue-500/30">
            {t('users.managingUser', 'Foydalanuvchi profilini boshqarish')}
          </span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {isViewingOther
            ? `${currentDisplayName} — ${t('users.profileTitle', 'Profil ma‘lumotlari')}`
            : t('settings.profileSettings', 'Profil sozlamalari')}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {isViewingOther
            ? t('users.manageProfileDesc', 'Foydalanuvchi profili, aloqa ma’lumotlari, huquqlari va parolini boshqarish')
            : t('settings.settingsSubtitle', 'Tizim sozlamalari, til tanlovi, foydalanuvchi profili va markaz parametrlarini boshqarish')}
        </p>
      </div>

      {/* Profile Overview Card (Matches screenshot with Green border & round avatar) */}
      <Card>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-3xl overflow-hidden bg-gray-100 dark:bg-surface-dark-tertiary border-2 border-emerald-600 dark:border-emerald-500 flex items-center justify-center text-3xl font-extrabold text-emerald-700 dark:text-emerald-300 shadow-md">
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt={currentDisplayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                currentDisplayName ? currentDisplayName.charAt(0).toUpperCase() : 'U'
              )}
            </div>

            <label
              title={t('users.uploadAvatar', 'Profilga rasm qo‘yish')}
              className="absolute -bottom-1 -right-1 p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer shadow-lg transition-transform hover:scale-105"
            >
              <Camera className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarSelect}
                disabled={avatarUploading}
              />
            </label>
          </div>

          <div className="flex-1 text-center sm:text-left rtl:sm:text-right space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-gray-100">
                {currentDisplayName}
              </h2>
              {effectiveRole === 'teacher' ? (
                <span className="inline-flex items-center font-bold rounded-full px-2.5 py-0.5 text-xs bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/60 uppercase tracking-wider w-fit mx-auto sm:mx-0">
                  {t('roles.teacher', 'O‘QITUVCHI')}
                </span>
              ) : effectiveRole === 'admin' ? (
                <span className="inline-flex items-center font-bold rounded-full px-2.5 py-0.5 text-xs bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300/60 uppercase tracking-wider w-fit mx-auto sm:mx-0">
                  {t('roles.admin', 'ADMINISTRATOR')}
                </span>
              ) : effectiveRole === 'owner' ? (
                <span className="inline-flex items-center font-bold rounded-full px-2.5 py-0.5 text-xs bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300/60 uppercase tracking-wider w-fit mx-auto sm:mx-0">
                  {t('roles.owner', 'BOSHLIQ')}
                </span>
              ) : (
                <span className="inline-flex items-center font-bold rounded-full px-2.5 py-0.5 text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/60 uppercase tracking-wider w-fit mx-auto sm:mx-0">
                  {t('roles.student', 'O‘QUVCHI')}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
              {phoneNumber ? formatUzPhone(phoneNumber) : (isViewingOther ? targetUser?.phone : profile?.phone) || 'Telefon raqam kiritilmagan'}
            </p>

            {/* Explicit Upload / Remove Avatar Buttons */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer shadow-sm transition-colors">
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
                  onChange={handleAvatarSelect}
                  disabled={avatarUploading}
                />
              </label>

              {displayAvatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={avatarUploading}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t('users.removeAvatar', 'Rasmni o‘chirish')}</span>
                </button>
              )}
            </div>

            {avatarUploading && (
              <p className="text-xs text-emerald-600 animate-pulse mt-1">{t('common.loading', 'Yuklanmoqda...')}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Tafsilotlar: Edit Details Form (Matches screenshot) */}
      <Card
        title={t('common.details', 'Tafsilotlar')}
        subtitle={t('users.editSubtitle', 'Foydalanuvchi profili, huquqlari va holatini tahrirlash')}
      >
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          {profileSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label={t('common.name', 'ISM *')}
                placeholder="Foydalanuvchi to‘liq ismi"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div>
              <Input
                label={t('common.phone', 'TELEFON')}
                placeholder="+998 90 123 45 67"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label={t('auth.username', 'FOYDALANUVCHI NOMI')}
                placeholder="foydalanuvchi_nomi yoki email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={!isOwner && !isViewingOther}
              />
            </div>

            <div>
              {/* Role selection: Owner can change target user's role */}
              {isOwner && isViewingOther ? (
                <Select
                  label={t('users.role', 'ROL')}
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  options={[
                    { value: ROLES.STUDENT, label: t('roles.student', 'O‘quvchi') },
                    { value: ROLES.TEACHER, label: t('roles.teacher', 'O‘qituvchi') },
                    { value: ROLES.ADMIN, label: t('roles.admin', 'Administrator') },
                    { value: ROLES.OWNER, label: t('roles.owner', 'Boshliq (Owner)') },
                  ]}
                  color="blue"
                />
              ) : (
                <Input
                  label={t('users.role', 'ROL')}
                  value={t('roles.' + effectiveRole, { defaultValue: effectiveRole.toUpperCase() })}
                  disabled
                />
              )}
            </div>
          </div>

          {/* Student Parent Contacts */}
          {effectiveRole === 'student' && (
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-500" />
                <span>{t('groups.parentContacts', 'Ota-onasi telefon raqamlari')}</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Input
                    label={t('groups.fatherPhone', 'OTASINING TELEFONI')}
                    placeholder="+998 90 123 45 67"
                    value={fatherPhone}
                    onChange={(e) => setFatherPhone(e.target.value)}
                  />
                </div>
                <div>
                  <Input
                    label={t('groups.motherPhone', 'ONASINING TELEFONI')}
                    placeholder="+998 90 123 45 67"
                    value={motherPhone}
                    onChange={(e) => setMotherPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-3">
            <Button
              type="submit"
              variant="primary"
              icon={Save}
              isLoading={profileSaving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 shadow-md shadow-emerald-600/30"
            >
              {t('common.save', 'Saqlash')}
            </Button>
          </div>
        </form>
      </Card>

      {/* Change Password Card */}
      <Card
        title={isViewingOther ? t('auth.resetTargetPassword', 'Foydalanuvchi hisobiga yangi parol o‘rnatish') : t('auth.changePassword', 'Parolni o‘zgartirish')}
        subtitle={isViewingOther ? 'Boshliq sifatida ushbu foydalanuvchiga to‘g‘ridan-to‘g‘ri yangi parol belgilash' : t('auth.passwordRequirements', 'Parol xavfsizligi va maxfiyligi')}
      >
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {passwordSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-brand-red text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          {/* Current password is ONLY needed when changing own password, NOT when Owner manages another user */}
          {!isViewingOther && (
            <div>
              <Input
                type="password"
                label={t('auth.currentPassword', 'Amaldagi parol')}
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
          )}

          <div className="space-y-4">
            <PasswordStrengthInput
              label={isViewingOther ? 'Yangi parol o‘rnating' : t('auth.newPassword', 'Yangi parol')}
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

          <div className="flex justify-end pt-3">
            <Button
              type="submit"
              variant="primary"
              icon={KeyRound}
              isLoading={passwordSaving}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 shadow-md shadow-amber-600/30"
            >
              {isViewingOther ? 'Yangi parolni saqlash' : t('auth.changePassword', 'Parolni yangilash')}
            </Button>
          </div>
        </form>
      </Card>

      {/* Local Preferences Section (Only visible when viewing own profile) */}
      {!isViewingOther && (
        <Card
          title={t('common.settings', 'Mavzu va til sozlamalari')}
          subtitle={t('settings.languageSettings', 'Tizim interfeys tili va displey rejimi')}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 block mb-2">
                {t('common.theme', 'Displey mavzusi')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['light', 'dark', 'system'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setTheme(m)}
                    className={`
                      py-2 px-3 text-xs font-bold rounded-xl capitalize border transition-all cursor-pointer
                      ${
                        theme === m
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-600'
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
                {t('common.language', 'Til')}
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
                      py-2 px-2 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer
                      ${
                        i18n.language === lang.code
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-600'
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
      )}

      {/* Telegram-style Image Cropper Modal */}
      <ImageCropperModal
        isOpen={Boolean(cropModalFile)}
        imageFile={cropModalFile}
        onClose={() => setCropModalFile(null)}
        onCrop={handleApplyCroppedAvatar}
        title={t('users.editAvatar', 'Profil rasmini moslashtirish')}
      />
    </div>
  );
}
