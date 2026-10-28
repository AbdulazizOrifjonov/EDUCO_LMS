import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyRound,
  Search,
  Eye,
  EyeOff,
  Copy,
  Check,
  Shield,
  ShieldCheck,
  ShieldAlert,
  GraduationCap,
  Users,
  Phone,
  Edit3,
  RefreshCw,
  Clock,
  X,
  ChevronDown,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Table from '@/components/ui/Table';
import Avatar from '@/components/ui/Avatar';
import Modal from '@/components/ui/Modal';
import PasswordStrengthInput, { evaluatePasswordStrength } from '@/components/ui/PasswordStrengthInput';
import { toast } from '@/components/ui/Toast';
import { getUsers, adminSetUserPassword } from '@/services/userService';
import { ROLES } from '@/lib/constants';
import { formatUzPhone } from '@/utils/phoneFormat';
import { useSearch } from '@/context/SearchContext';

const ROLE_BADGE_STYLES = {
  [ROLES.OWNER]: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30',
  [ROLES.ADMIN]: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30',
  [ROLES.TEACHER]: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30',
  [ROLES.STUDENT]: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30',
};

export default function PasswordsPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const currentUserRole = (profile?.role || 'owner').toLowerCase();
  const isOwner = currentUserRole === ROLES.OWNER;
  const { searchQuery, setSearchQuery } = useSearch();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchQuery || '');
  const [roleFilter, setRoleFilter] = useState('all');

  // Synchronize with Navbar global search bar
  useEffect(() => {
    if (searchQuery !== undefined) {
      setSearch(searchQuery);
    }
  }, [searchQuery]);
  const [showAllPasswords, setShowAllPasswords] = useState(true);
  const [visibleRowIds, setVisibleRowIds] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  // Edit password modal state
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const fetchCredentials = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUsers({
        search: '',
        role: 'all',
        status: 'all',
        page: 1,
        limit: 500,
        currentUserRole,
      });

      let list = res.users || [];
      if (!isOwner) {
        list = list.filter((u) => u.role === ROLES.TEACHER || u.role === ROLES.STUDENT);
      }
      setUsers(list);
    } catch (err) {
      console.error('Failed to load passwords:', err);
      toast.error(t('users.fetchError', 'Foydalanuvchilar parollarini yuklab bo‘lmadi'));
    } finally {
      setLoading(false);
    }
  }, [currentUserRole, isOwner, t]);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  const toggleRowVisibility = (id) => {
    setVisibleRowIds((prev) => ({
      ...prev,
      [id]: !(prev[id] ?? showAllPasswords),
    }));
  };

  const isRowPasswordVisible = (id) => {
    if (visibleRowIds[id] !== undefined) return visibleRowIds[id];
    return showAllPasswords;
  };

  const handleToggleAll = () => {
    const next = !showAllPasswords;
    setShowAllPasswords(next);
    setVisibleRowIds({});
  };

  const handleCopy = (text, keyId) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedId(keyId);
    toast.success(t('passwords.copied', 'Nusxa olindi!'));
    setTimeout(() => {
      setCopiedId((prev) => (prev === keyId ? null : prev));
    }, 2000);
  };

  const handleOpenChangeModal = (userRow) => {
    setSelectedUser(userRow);
    setNewPassword(userRow.password || '');
  };

  const handleSaveNewPassword = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    const trimmed = (newPassword || '').trim();
    if (!trimmed) {
      toast.error(t('users.passwordRequired', 'Yangi parolni kiriting!'));
      return;
    }

    if (trimmed.length < 6) {
      toast.error(t('users.passwordTooShort', 'Parol kamida 6 ta belgidan iborat bo‘lishi kerak!'));
      return;
    }

    setIsSavingPassword(true);
    try {
      await adminSetUserPassword(selectedUser.id, trimmed);
      toast.success(
        t('passwords.updatedSuccess', `${selectedUser.fullName} uchun yangi parol saqlandi!`)
      );
      setSelectedUser(null);
      setNewPassword('');
      fetchCredentials();
    } catch (err) {
      toast.error(err.message || 'Parolni saqlashda xatolik yuz berdi');
    } finally {
      setIsSavingPassword(false);
    }
  };

  // Filtered users by role tab and search term
  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    const effectiveSearch = (search || searchQuery || '').trim().toLowerCase();
    if (effectiveSearch) {
      const q = effectiveSearch;
      const qDigits = q.replace(/\D/g, '');
      const matchName =
        (u.fullName || '').toLowerCase().includes(q) ||
        (u.first_name || '').toLowerCase().includes(q) ||
        (u.last_name || '').toLowerCase().includes(q);
      const matchUsername = (u.username || '').toLowerCase().includes(q);
      const matchPhone =
        (u.phone || '').toLowerCase().includes(q) ||
        (u.father_phone || '').toLowerCase().includes(q) ||
        (u.mother_phone || '').toLowerCase().includes(q) ||
        (qDigits.length >= 3 && (
          (u.phone || '').replace(/\D/g, '').includes(qDigits) ||
          (u.father_phone || '').replace(/\D/g, '').includes(qDigits) ||
          (u.mother_phone || '').replace(/\D/g, '').includes(qDigits)
        ));
      const matchRole =
        (q === 'ustoz' && u.role === ROLES.TEACHER) ||
        (q === 'oʻqituvchi' && u.role === ROLES.TEACHER) ||
        (q === 'oquvchi' && u.role === ROLES.STUDENT) ||
        (q === 'talaba' && u.role === ROLES.STUDENT) ||
        (q === 'admin' && u.role === ROLES.ADMIN);

      return matchName || matchUsername || matchPhone || matchRole;
    }
    return true;
  });

  // Counts for tabs
  const totalStudents = users.filter((u) => u.role === ROLES.STUDENT).length;
  const totalTeachers = users.filter((u) => u.role === ROLES.TEACHER).length;
  const totalAdmins = users.filter((u) => u.role === ROLES.ADMIN).length;

  const roleBadgeVariants = {
    [ROLES.OWNER]: 'danger',
    [ROLES.ADMIN]: 'purple',
    [ROLES.TEACHER]: 'warning',
    [ROLES.STUDENT]: 'success',
  };

  const renderStrengthBadge = (pwd) => {
    const s = evaluatePasswordStrength(pwd || '');
    if (s.level === 'strong') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
          <ShieldCheck className="w-3 h-3 shrink-0" />
          <span>{t('passwords.strong', 'Xavfsiz')}</span>
        </span>
      );
    }
    if (s.level === 'medium') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
          <Shield className="w-3 h-3 shrink-0" />
          <span>{t('passwords.medium', "O'rtacha")}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
        <ShieldAlert className="w-3 h-3 shrink-0" />
        <span>{t('passwords.weak', 'Zaif')}</span>
      </span>
    );
  };

  const columns = [
    {
      header: t('common.name', 'Ism'),
      key: 'name',
      className: '!px-2.5 whitespace-nowrap',
      cellClassName: '!px-2.5 !py-2.5 whitespace-nowrap',
      render: (row) => {
        const initials =
          `${row.first_name?.[0] || ''}${row.last_name?.[0] || ''}`.toUpperCase() ||
          row.fullName?.[0]?.toUpperCase() ||
          'U';
        const avatarSrc =
          row.avatar_url ||
          (row.id === profile?.id ? profile?.avatar_url : '');
        const avatarGradients = {
          [ROLES.OWNER]: 'from-rose-500 to-red-600',
          [ROLES.ADMIN]: 'from-purple-600 to-indigo-600',
          [ROLES.TEACHER]: 'from-amber-500 to-orange-600',
          [ROLES.STUDENT]: 'from-blue-600 to-indigo-600',
        };
        const grad = avatarGradients[row.role] || 'from-[#123D78] to-blue-600';
        return (
          <div className="flex items-center gap-2 whitespace-nowrap">
            <div className={`w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr ${grad} text-white flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-sm ring-2 ring-gray-100 dark:ring-gray-800`}>
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={row.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <span className="font-semibold text-gray-900 dark:text-gray-100 text-xs sm:text-sm">
              {row.fullName}
            </span>
          </div>
        );
      },
    },
    {
      header: t('users.role', 'Rol'),
      key: 'role',
      className: '!px-2 whitespace-nowrap',
      cellClassName: '!px-2 !py-2.5 whitespace-nowrap',
      render: (row) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${ROLE_BADGE_STYLES[row.role] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}`}>
          {t(`roles.${row.role}`, row.role)}
        </span>
      ),
    },
    {
      header: t('passwords.loginPhone', 'Login / Telefon'),
      key: 'phone',
      className: '!px-2 whitespace-nowrap',
      cellClassName: '!px-2 !py-2.5 whitespace-nowrap',
      render: (row) => {
        const primaryPhone = row.phone || row.father_phone || row.mother_phone || '';
        const formatted = primaryPhone ? formatUzPhone(primaryPhone) : '—';
        const copyKey = `phone-${row.id}`;
        const fatherCopyKey = `father-${row.id}`;
        const motherCopyKey = `mother-${row.id}`;
        const hasParentPhone = row.role === ROLES.STUDENT && (row.father_phone || row.mother_phone);

        return (
          <div className="flex flex-col items-start gap-1 whitespace-nowrap">
            {/* Primary Login Phone */}
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700/80 pl-2 pr-1 py-0.5 shadow-xs">
              <Phone className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-mono text-xs font-bold text-gray-900 dark:text-gray-100 tracking-wide whitespace-nowrap">
                {formatted}
              </span>
              {primaryPhone && (
                <button
                  type="button"
                  onClick={() => handleCopy(primaryPhone, copyKey)}
                  className="p-1 rounded-md text-gray-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  title={t('passwords.copyPhone', 'Raqamdan nusxa olish')}
                >
                  {copiedId === copyKey ? (
                    <Check className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              )}
            </div>

            {/* Compact Parent Popover Badge directly underneath (Zero horizontal stretch!) */}
            {hasParentPhone && (
              <div className="relative group/parent inline-block">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-all cursor-pointer shadow-xs"
                  title={t('groups.parentContacts', 'Ota-onasi raqamlari')}
                >
                  <Users className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>{t('groups.parents', 'Ota-onasi')}</span>
                  <ChevronDown className="w-2 h-2 opacity-70 group-hover/parent:rotate-180 transition-transform" />
                </button>

                {/* Floating Popover on Hover */}
                <div className="invisible group-hover/parent:visible opacity-0 group-hover/parent:opacity-100 transition-all duration-200 pointer-events-none group-hover/parent:pointer-events-auto absolute left-0 top-full mt-1.5 w-60 p-2.5 rounded-2xl bg-white dark:bg-[#1a2332] shadow-2xl border border-gray-200 dark:border-gray-700 z-50 text-left">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400 mb-2 pb-1.5 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
                    <span>{t('groups.parentContacts', 'Ota-onasi raqamlari')}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">
                      Aloqa
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {row.father_phone && (
                      <div className="flex items-center justify-between p-2 rounded-xl bg-indigo-50/70 hover:bg-indigo-100/70 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 border border-indigo-200/50 dark:border-indigo-800/50 transition-colors">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400">
                            {t('groups.father', 'Otasi')}
                          </span>
                          <a
                            href={`tel:${row.father_phone}`}
                            className="font-mono text-xs font-bold text-gray-800 dark:text-gray-200 hover:underline"
                          >
                            {formatUzPhone(row.father_phone)}
                          </a>
                        </div>
                        <div className="flex items-center gap-1">
                          <a
                            href={`tel:${row.father_phone}`}
                            className="p-1 rounded text-indigo-500 hover:text-indigo-700 hover:bg-white dark:hover:bg-gray-800"
                            title="Qo'ng'iroq qilish"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopy(row.father_phone, fatherCopyKey)}
                            className="p-1 rounded text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-white dark:hover:bg-gray-800 transition-colors cursor-pointer"
                            title="Nusxa olish"
                          >
                            {copiedId === fatherCopyKey ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                    {row.mother_phone && (
                      <div className="flex items-center justify-between p-2 rounded-xl bg-rose-50/70 hover:bg-rose-100/70 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 border border-rose-200/50 dark:border-rose-800/50 transition-colors">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold uppercase text-rose-600 dark:text-rose-400">
                            {t('groups.mother', 'Onasi')}
                          </span>
                          <a
                            href={`tel:${row.mother_phone}`}
                            className="font-mono text-xs font-bold text-gray-800 dark:text-gray-200 hover:underline"
                          >
                            {formatUzPhone(row.mother_phone)}
                          </a>
                        </div>
                        <div className="flex items-center gap-1">
                          <a
                            href={`tel:${row.mother_phone}`}
                            className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-white dark:hover:bg-gray-800"
                            title="Qo'ng'iroq qilish"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopy(row.mother_phone, motherCopyKey)}
                            className="p-1 rounded text-gray-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-white dark:hover:bg-gray-800 transition-colors cursor-pointer"
                            title="Nusxa olish"
                          >
                            {copiedId === motherCopyKey ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: t('passwords.currentPassword', 'Joriy parol'),
      key: 'password',
      className: '!px-2 whitespace-nowrap',
      cellClassName: '!px-2 !py-2.5 whitespace-nowrap',
      render: (row) => {
        const visible = isRowPasswordVisible(row.id);
        const pwd = row.password || 'Educo#2026!';
        const copyKey = `pwd-${row.id}`;
        return (
          <div className="flex flex-col items-start gap-1 whitespace-nowrap">
            {/* Unified Password Capsule */}
            <div className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 shadow-xs">
              <KeyRound className="w-3 h-3 text-emerald-700 dark:text-emerald-400 shrink-0" />
              <span className="font-mono text-xs font-bold tracking-wider text-gray-900 dark:text-white select-all">
                {visible ? pwd : '••••••••••'}
              </span>
              <div className="flex items-center gap-0.5 ml-1 pl-1 border-l border-emerald-200/70 dark:border-emerald-800/60">
                <button
                  type="button"
                  onClick={() => toggleRowVisibility(row.id)}
                  className="p-1 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-emerald-100/60 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer"
                  title={visible ? t('passwords.hide', 'Yashirish') : t('passwords.show', "Ko'rsatish")}
                >
                  {visible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(pwd, copyKey)}
                  className="p-1 rounded-md text-gray-500 hover:text-emerald-700 dark:text-gray-400 dark:hover:text-emerald-300 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer"
                  title={t('passwords.copyPassword', 'Paroldan nusxa olish')}
                >
                  {copiedId === copyKey ? (
                    <Check className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>

            {renderStrengthBadge(pwd)}
          </div>
        );
      },
    },
    {
      header: t('passwords.updatedAt', 'Sana'),
      key: 'password_updated_at',
      className: '!px-2 whitespace-nowrap',
      cellClassName: '!px-2 !py-2.5 whitespace-nowrap',
      render: (row) => {
        const dt = row.password_updated_at || row.updated_at || row.created_at;
        return (
          <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 whitespace-nowrap font-mono">
            <Clock className="w-3 h-3 shrink-0" />
            <span>{dt ? new Date(dt).toLocaleDateString('ru-RU') : '—'}</span>
          </span>
        );
      },
    },
    {
      header: t('common.actions', 'Amallar'),
      key: 'actions',
      className: '!px-2 whitespace-nowrap text-right',
      cellClassName: '!px-2 !py-2.5 whitespace-nowrap text-right',
      render: (row) => (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => handleOpenChangeModal(row)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:border-emerald-500 hover:text-emerald-600 dark:hover:border-emerald-400 dark:hover:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 text-xs font-semibold shadow-xs transition-all cursor-pointer whitespace-nowrap active:scale-95 shrink-0"
            title={t('passwords.changeBtn', 'Parolni almashtirish')}
          >
            <Edit3 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{t('passwords.changeBtn', 'Almashtirish')}</span>
          </button>
        </div>
      ),
    },
  ];

  const filterTabs = [
    {
      id: 'all',
      label: t('passwords.allTab', 'Barchasi'),
      count: users.length,
      icon: Users,
    },
    {
      id: ROLES.STUDENT,
      label: t('users.studentsTab', "O'quvchilar"),
      count: totalStudents,
      icon: GraduationCap,
    },
    {
      id: ROLES.TEACHER,
      label: t('users.teachersTab', "O'qituvchilar"),
      count: totalTeachers,
      icon: Users,
    },
    ...(isOwner
      ? [
          {
            id: ROLES.ADMIN,
            label: t('users.adminsTab', 'Administratorlar'),
            count: totalAdmins,
            icon: Shield,
          },
        ]
      : []),
  ];

  const tabColorConfig = {
    all: {
      active: 'bg-blue-600 dark:bg-emerald-600 text-white shadow-md shadow-blue-600/30 dark:shadow-emerald-600/30 ring-2 ring-blue-400/40 dark:ring-emerald-400/40',
      activeCount: 'bg-white/20 text-white',
      inactive: 'bg-gray-100 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700',
      inactiveCount: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    },
    [ROLES.STUDENT]: {
      active: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/60',
      activeCount: 'bg-white/25 text-white',
      inactive: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-300/80 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40',
      inactiveCount: 'bg-emerald-200/80 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200',
    },
    [ROLES.TEACHER]: {
      active: 'bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-2 ring-amber-400/60',
      activeCount: 'bg-white/25 text-white',
      inactive: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-300/80 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/40',
      inactiveCount: 'bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200',
    },
    [ROLES.ADMIN]: {
      active: 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-2 ring-purple-300/60',
      activeCount: 'bg-white/25 text-white',
      inactive: 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border border-purple-300/80 dark:border-purple-800/60 hover:bg-purple-100 dark:hover:bg-purple-900/40',
      inactiveCount: 'bg-purple-200/80 dark:bg-purple-900/80 text-purple-900 dark:text-purple-200',
    },
  };

  return (
    <div className="space-y-5">
      {/* Page Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-surface-dark-secondary p-5 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#123D78] to-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-900/20 shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
              {t('passwords.title', 'Parollar va Loginlar bazasi')}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {isOwner
                ? t(
                    'passwords.ownerSubtitle',
                    'Barcha administratorlar, o‘qituvchilar va o‘quvchilarning joriy (oxirgi o‘zgartirilgan) parollari'
                  )
                : t(
                    'passwords.adminSubtitle',
                    'O‘qituvchilar va o‘quvchilar parolini unutganda ko‘rish yoki yangilab berish paneli'
                  )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            icon={showAllPasswords ? EyeOff : Eye}
            onClick={handleToggleAll}
          >
            {showAllPasswords
              ? t('passwords.hideAll', 'Parollarni yashirish')
              : t('passwords.showAll', 'Parollarni ko‘rsatish')}
          </Button>
          <Button variant="ghost" size="sm" icon={RefreshCw} onClick={fetchCredentials}>
            {t('common.refresh', 'Yangilash')}
          </Button>
        </div>
      </div>

      {/* Main Card with Filter Tabs + Search Toolbar + Clean Table */}
      <Card>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-5 pb-4 border-b border-gray-100 dark:border-gray-800">
          {/* Role Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {filterTabs.map((tab) => {
              const Icon = tab.icon;
              const active = roleFilter === tab.id;
              const cfg = tabColorConfig[tab.id] || tabColorConfig.all;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRoleFilter(tab.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    active ? cfg.active : cfg.inactive
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      active ? cfg.activeCount : cfg.inactiveCount
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Clean Search Input */}
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSearchQuery(e.target.value);
              }}
              placeholder={t('passwords.searchPlaceholder', 'Ism yoki raqam bo‘yicha qidirish...')}
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-navy dark:focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-800 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSearchQuery('');
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Desktop Table View (>= md) */}
        <div className="hidden md:block">
          <Table
            columns={columns}
            data={filteredUsers}
            isLoading={loading}
            emptyMessage={t('users.noUsersFound', 'Hech qanday foydalanuvchi topilmadi')}
          />
        </div>

        {/* Mobile Responsive Cards View (< md) - Zero Horizontal Scroll */}
        <div className="block md:hidden">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark-secondary animate-pulse space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700" />
                      <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
                    </div>
                    <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  </div>
                  <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded-xl" />
                </div>
              ))}
            </div>
          ) : !filteredUsers || filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark-secondary">
              <KeyRound className="w-8 h-8 mx-auto mb-2 text-gray-400 opacity-60" />
              <p className="text-sm font-medium">{t('users.noUsersFound', 'Hech qanday foydalanuvchi topilmadi')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => {
                const visible = isRowPasswordVisible(user.id);
                const pwd = user.password || 'Educo#2026!';
                const copyKey = `pwd-${user.id}`;
                const phoneCopyKey = `phone-${user.id}`;
                const primaryPhone = user.phone || user.father_phone || user.mother_phone || '';
                const formattedPhone = primaryPhone ? formatUzPhone(primaryPhone) : '—';
                const dt = user.password_updated_at || user.updated_at || user.created_at;

                return (
                  <div
                    key={user.id}
                    className="p-3.5 sm:p-4 rounded-2xl border border-gray-200/90 dark:border-gray-800 bg-white dark:bg-surface-dark-secondary shadow-xs hover:shadow-sm transition-all space-y-3 w-full max-w-full overflow-hidden"
                  >
                    {/* Top Row: Avatar + Name + Role */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar
                          src={user.avatar_url}
                          name={user.fullName}
                          size="sm"
                          role={user.role}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                            {user.fullName}
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                            @{user.username || user.email?.split('@')[0]}
                          </p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${ROLE_BADGE_STYLES[user.role] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}`}>
                        {t(`roles.${user.role}`, user.role)}
                      </span>
                    </div>

                    {/* Middle Row 1: Login / Phone */}
                    <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/70 dark:border-gray-700/60">
                      <span className="text-gray-500 dark:text-gray-400 font-medium text-[11px]">
                        {t('passwords.loginPhone', 'Login / Telefon')}:
                      </span>
                      <div className="flex items-center gap-1.5">
                        {primaryPhone ? (
                          <>
                            <a
                              href={`tel:${primaryPhone}`}
                              className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {formattedPhone}
                            </a>
                            <button
                              type="button"
                              onClick={() => handleCopy(primaryPhone, phoneCopyKey)}
                              className="p-1 rounded text-gray-400 hover:text-emerald-600 transition-colors cursor-pointer"
                              title="Nusxa olish"
                            >
                              {copiedId === phoneCopyKey ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </div>
                    </div>

                    {/* Middle Row 2: Parents Phone (if Student) */}
                    {user.role === ROLES.STUDENT && (user.father_phone || user.mother_phone) && (
                      <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/40">
                        <span className="text-amber-800 dark:text-amber-300 font-medium text-[11px] flex items-center gap-1">
                          <Users className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          <span>Ota-onasi:</span>
                        </span>
                        <div className="flex items-center gap-2">
                          {user.father_phone && (
                            <a
                              href={`tel:${user.father_phone}`}
                              className="font-mono text-[11px] font-bold text-indigo-700 dark:text-indigo-300 hover:underline"
                              title="Otasi"
                            >
                              Otasi: {formatUzPhone(user.father_phone)}
                            </a>
                          )}
                          {user.mother_phone && (
                            <a
                              href={`tel:${user.mother_phone}`}
                              className="font-mono text-[11px] font-bold text-rose-700 dark:text-rose-300 hover:underline"
                              title="Onasi"
                            >
                              Onasi: {formatUzPhone(user.mother_phone)}
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Middle Row 3: Password Capsule & Strength */}
                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <div className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs">
                        <KeyRound className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                        <span className="font-mono text-xs font-bold tracking-wider text-gray-900 dark:text-white select-all">
                          {visible ? pwd : '••••••••••'}
                        </span>
                        <div className="flex items-center gap-0.5 ml-1 pl-1 border-l border-emerald-200/80 dark:border-emerald-800/60">
                          <button
                            type="button"
                            onClick={() => toggleRowVisibility(user.id)}
                            className="p-1 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer"
                            title={visible ? 'Yashirish' : 'Ko‘rsatish'}
                          >
                            {visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(pwd, copyKey)}
                            className="p-1 rounded-md text-gray-500 hover:text-emerald-700 dark:text-gray-400 dark:hover:text-emerald-300 transition-colors cursor-pointer"
                            title="Paroldan nusxa olish"
                          >
                            {copiedId === copyKey ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                      {renderStrengthBadge(pwd)}
                    </div>

                    {/* Bottom Row: Date & Action Button */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800/80">
                      <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span>{dt ? new Date(dt).toLocaleDateString('ru-RU') : '—'}</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => handleOpenChangeModal(user)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>{t('passwords.changeBtn', 'Almashtirish')}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* Change Password Modal */}
      <Modal
        isOpen={Boolean(selectedUser)}
        onClose={() => {
          setSelectedUser(null);
          setNewPassword('');
        }}
        title={t('passwords.modalTitle', 'Parolni yangilash')}
        subtitle={
          selectedUser
            ? `${selectedUser.fullName} (${t(`roles.${selectedUser.role}`, selectedUser.role)}) uchun yangi kirish parolini belgilang`
            : ''
        }
        size="md"
      >
        {selectedUser && (
          <form onSubmit={handleSaveNewPassword} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-surface-dark-tertiary/40 border border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs">
              <div>
                <p className="text-gray-500 dark:text-gray-400">
                  {t('passwords.loginPhone', 'Login (Telefon raqami)')}:
                </p>
                <p className="font-mono font-bold text-sm text-gray-900 dark:text-white mt-0.5">
                  {formatUzPhone(
                    selectedUser.phone ||
                      selectedUser.father_phone ||
                      selectedUser.mother_phone ||
                      ''
                  )}
                </p>
              </div>
              <Badge variant={roleBadgeVariants[selectedUser.role] || 'secondary'}>
                {t(`roles.${selectedUser.role}`, selectedUser.role)}
              </Badge>
            </div>

            <PasswordStrengthInput
              label={t('passwords.newPasswordLabel', 'Yangi parol')}
              required
              value={newPassword}
              onValueChange={(val) => setNewPassword(val)}
              placeholder="Masalan: Educo#2026!"
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setSelectedUser(null);
                  setNewPassword('');
                }}
              >
                {t('common.cancel', 'Bekor qilish')}
              </Button>
              <Button type="submit" variant="primary" isLoading={isSavingPassword}>
                {t('common.save', 'Saqlash')}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
