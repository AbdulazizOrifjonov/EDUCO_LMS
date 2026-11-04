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
  Eye,
  EyeOff,
  Copy,
  Check,
  GraduationCap,
  BookOpen,
  RefreshCw,
  ArrowRight,
  Edit2,
  Plus,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import { useThemeStore } from '@/hooks/useTheme';
import { Button, Card, Badge, Input, PasswordStrengthInput, ImageCropperModal } from '@/components/ui';
import RoleBadge from '@/components/ui/RoleBadge';
import Select from '@/components/ui/Select';
import { LanguageFlag } from '@/components/LanguageSelector';
import { updateProfile, changePassword, uploadAvatar } from '@/services/settingsService';
import { getGroups, transferStudent, enrollStudent } from '@/services/groupService';
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
  const [showTargetPassword, setShowTargetPassword] = useState(true);
  const [copiedPassword, setCopiedPassword] = useState(false);

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

  // Realtime cross-device sync: auto-update profile & group info when another device makes changes
  useEffect(() => {
    const handleSync = () => {
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
      }
      if (effectiveRole === 'student' && typeof loadStudentGroupInfo === 'function') {
        loadStudentGroupInfo();
      }
    };
    window.addEventListener('educo-data-sync', handleSync);
    return () => window.removeEventListener('educo-data-sync', handleSync);
  }, [isViewingOther, resolvedTargetId, effectiveRole, loadStudentGroupInfo]);

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
        setTargetUser((prev) => ({
          ...prev,
          password: newPassword.trim(),
          password_updated_at: new Date().toISOString(),
        }));
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

  // Student group & transfer state
  const [studentGroup, setStudentGroup] = useState(null);
  const [studentGroups, setStudentGroups] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [selectedNewGroupId, setSelectedNewGroupId] = useState('');
  const [isTransferringGroup, setIsTransferringGroup] = useState(false);
  const [groupTransferSuccess, setGroupTransferSuccess] = useState('');

  const loadStudentGroupInfo = React.useCallback(async () => {
    const studentId = resolvedTargetId || targetUser?.id || profile?.id;
    if (!studentId) return;

    try {
      const res = await getGroups({ status: 'all', limit: 200 });
      const list = res.groups || [];
      setAllGroups(list);

      // Find all groups this student belongs to
      const targetGroupIds = [];
      const directGid = targetUser?.group_id || profile?.group_id;
      if (directGid) targetGroupIds.push(directGid);
      if (Array.isArray(targetUser?.group_ids)) {
        targetUser.group_ids.forEach((gid) => {
          if (gid && !targetGroupIds.includes(gid)) targetGroupIds.push(gid);
        });
      }

      try {
        const memberships = localStore.getMemberships ? localStore.getMemberships() : [];
        const normId = localStore.normalizeUserId ? localStore.normalizeUserId(studentId) : String(studentId);
        memberships
          .filter((m) => localStore.normalizeUserId(m.student_id) === normId && m.is_active !== false)
          .forEach((m) => {
            if (m.group_id && !targetGroupIds.includes(m.group_id)) targetGroupIds.push(m.group_id);
          });
      } catch (_) {}

      list.forEach((g) => {
        if (Array.isArray(g.student_ids) && (g.student_ids.includes(studentId) || g.student_ids.map(String).includes(String(studentId)))) {
          if (!targetGroupIds.includes(g.id)) targetGroupIds.push(g.id);
        }
      });

      const matchedGroups = targetGroupIds.map((gid) => list.find((g) => g.id === gid)).filter(Boolean);
      setStudentGroups(matchedGroups);
      setStudentGroup(matchedGroups[0] || null);
      setSelectedNewGroupId(matchedGroups[0] ? matchedGroups[0].id : '');
    } catch (err) {
      console.warn('Error loading student group in ProfilePage:', err);
    }
  }, [resolvedTargetId, targetUser, profile]);

  useEffect(() => {
    if (effectiveRole === 'student') {
      loadStudentGroupInfo();
    }
  }, [effectiveRole, loadStudentGroupInfo]);

  const handleTransferGroup = async (e) => {
    e?.preventDefault?.();
    if (!selectedNewGroupId) {
      toast.warning('Iltimos, ko‘chirish uchun o‘quv guruhini tanlang!');
      return;
    }
    const studentId = resolvedTargetId || targetUser?.id || profile?.id;
    if (!studentId) return;

    setIsTransferringGroup(true);
    setGroupTransferSuccess('');
    try {
      const prevGroupId = studentGroup?.id;
      const targetGroup = allGroups.find((g) => g.id === selectedNewGroupId);

      if (prevGroupId && prevGroupId !== selectedNewGroupId) {
        await transferStudent(prevGroupId, selectedNewGroupId, studentId);
      } else if (!prevGroupId) {
        await enrollStudent(selectedNewGroupId, studentId);
      }

      // Update targetUser in localStore
      if (targetUser) {
        const updated = {
          ...targetUser,
          group_id: selectedNewGroupId,
          group_ids: [selectedNewGroupId],
          course_id: targetGroup?.course_id || targetGroup?.courseId || targetUser.course_id,
          subject: targetGroup?.courseName || targetGroup?.course_name || targetUser.subject,
          updated_at: new Date().toISOString(),
        };
        localStore.saveUser(updated);
        setTargetUser(updated);
      }

      try {
        window.dispatchEvent(new CustomEvent('educo-data-sync', { detail: { type: 'group_transfer' } }));
      } catch (_) {}

      setStudentGroup(targetGroup || null);
      const msg = `O‘quvchi muvaffaqiyatli «${targetGroup?.name || 'Yangi guruh'}» guruhiga ko‘chirildi!`;
      setGroupTransferSuccess(msg);
      toast.success(msg);
      setTimeout(() => setGroupTransferSuccess(''), 5000);
    } catch (err) {
      console.error('Group transfer error:', err);
      toast.error(err.message || 'Guruhni o‘zgartirishda xatolik yuz berdi');
    } finally {
      setIsTransferringGroup(false);
    }
  };

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
              <RoleBadge role={effectiveRole} size="md" className="w-fit mx-auto sm:mx-0" />
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

      {/* Student Study Group & Quick Transfer Section (For Owner / Admin) */}
      {effectiveRole === 'student' && (
        <Card
          title="O‘quv guruhi va Ta’lim yo‘nalishi"
          subtitle="O‘quvchi biriktirilgan guruh, dars jadvali va guruhni almashtirish / ko‘chirish (Transfer)"
          className="border-2 border-emerald-500/30 dark:border-emerald-600/30 bg-gradient-to-br from-emerald-50/20 via-white to-teal-50/20 dark:from-emerald-950/15 dark:via-gray-900 dark:to-teal-950/15"
        >
          <div className="space-y-4">
            {groupTransferSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 border border-emerald-200 dark:border-emerald-800 animate-fade-in">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{groupTransferSuccess}</span>
              </div>
            )}

            {studentGroups.length > 0 ? (
              <div className="space-y-3">
                {studentGroups.map((grp, gIdx) => (
                  <div
                    key={grp.id}
                    className="p-4 rounded-2xl bg-white dark:bg-surface-dark-secondary border border-emerald-200 dark:border-emerald-800/80 shadow-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30 shadow-2xs">
                          <GraduationCap className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            {studentGroups.length > 1 ? `${gIdx + 1}-o‘quv guruhi` : 'Joriy o‘quv guruhi'}
                          </div>
                          <div className="text-base sm:text-lg font-black text-gray-900 dark:text-gray-100 flex items-center gap-2 flex-wrap">
                            <span>«{grp.name}»</span>
                            {grp.room && (
                              <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold border border-gray-200 dark:border-gray-700">
                                🚪 {grp.room}-xona
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => navigate(`/${currentUserRole}/users/edit/${targetUser?.id || resolvedTargetId}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
                        title="Guruhni almashtirish, vaqtini yoki ustozini o‘zgartirish uchun tahrirlash sahifasiga o‘tish"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Tahrirlash va almashtirish</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Kurs / Fan</span>
                        <span className="font-bold text-gray-900 dark:text-gray-100">
                          {grp.courseName || grp.course_name || 'Fan'}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Ustoz & Jadval</span>
                        <span className="font-bold text-gray-900 dark:text-gray-100 truncate block" title={grp.teacherName || grp.teacher_name}>
                          {grp.teacherName || grp.teacher_name || grp.primaryTeacher?.fullName || 'Noma‘lum'}
                        </span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 block mt-0.5 truncate">
                          {grp.schedule_days || grp.schedule || 'Jadvalsiz'}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Guruh sig‘imi</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {grp.enrolled_count || grp.studentCount || 0} / {grp.capacity || 20} ta
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Oylik to‘lov</span>
                        <span className="font-black text-gray-900 dark:text-gray-100">
                          {(grp.monthly_price || grp.price || 500000).toLocaleString()} so‘m
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <div className="flex-1">
                  <span className="font-bold block text-sm mb-0.5">Hozircha guruh biriktirilmagan (Kutish zalida)</span>
                  <span>Ushbu o‘quvchi hali biron bir o‘quv guruhiga kiritilmagan. Quyidagi ro‘yxatdan guruh tanlab uni biriktirib qo‘yishingiz mumkin.</span>
                </div>
              </div>
            )}

            {/* Quick Group Transfer / Enrollment Selector for Admin & Owner */}
            {(isOwner || currentUserRole === 'admin') && (
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-surface-dark-secondary/70 border border-gray-200 dark:border-gray-700/80 space-y-3">
                <label className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>
                    {studentGroup
                      ? "O‘quvchini boshqa guruhga ko‘chirish (Guruhni almashtirish):"
                      : "O‘quvchini guruhga biriktirish:"}
                  </span>
                </label>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="flex-1">
                    <select
                      value={selectedNewGroupId}
                      onChange={(e) => setSelectedNewGroupId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark text-gray-900 dark:text-gray-100 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="">Guruhni tanlang...</option>
                      {allGroups.map((g) => (
                        <option key={g.id} value={g.id} disabled={g.id === studentGroup?.id}>
                          {g.name} — {g.courseName || g.course_name || 'Fan'} ({g.enrolled_count || g.studentCount || 0}/{g.capacity || 20} ta)
                          {g.id === studentGroup?.id ? ' (Hozirgi guruhi)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button
                    type="button"
                    variant="primary"
                    disabled={!selectedNewGroupId || selectedNewGroupId === studentGroup?.id || isTransferringGroup}
                    isLoading={isTransferringGroup}
                    onClick={handleTransferGroup}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs shrink-0 flex items-center justify-center gap-1.5"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>{studentGroup ? "Guruhga ko‘chirish" : "Guruhga biriktirish"}</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

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
        title={isViewingOther ? 'Foydalanuvchi parolini ko‘rish va yangilash' : t('auth.changePassword', 'Parolni o‘zgartirish')}
        subtitle={isViewingOther ? 'Foydalanuvchining amaldagi paroli va yangi parol belgilash' : t('auth.passwordRequirements', 'Parol xavfsizligi va maxfiyligi')}
      >
        <div className="space-y-4">
          {/* Active Password Box (Shown when viewing another user) */}
          {isViewingOther && (
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/30 dark:border-amber-500/20 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                    Foydalanuvchining amaldagi paroli:
                  </span>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  Faol kirish paroli
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="flex-1 flex items-center justify-between px-4 py-3 rounded-xl bg-white dark:bg-surface-dark-secondary border border-gray-200 dark:border-gray-700 shadow-sm">
                  <span className="font-mono text-base sm:text-lg font-black tracking-wider text-gray-900 dark:text-gray-100 select-all">
                    {showTargetPassword ? (targetUser?.password || 'Educo#2026!') : '••••••••••••'}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowTargetPassword(!showTargetPassword)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                      title={showTargetPassword ? 'Parolni yashirish' : 'Parolni ko‘rish'}
                    >
                      {showTargetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const pwd = targetUser?.password || 'Educo#2026!';
                        navigator.clipboard.writeText(pwd);
                        setCopiedPassword(true);
                        toast.success('Parol nusxalandi!');
                        setTimeout(() => setCopiedPassword(false), 2000);
                      }}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                      title="Paroldan nusxa olish"
                    >
                      {copiedPassword ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-400">
                Foydalanuvchi tizimga <b>@{targetUser?.username || username}</b> logini va yuqoridagi parol bilan kiradi.
              </p>
            </div>
          )}

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
        </div>
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
