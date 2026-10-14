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
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import PasswordStrengthInput, { evaluatePasswordStrength } from '@/components/ui/PasswordStrengthInput';
import { toast } from '@/components/ui/Toast';
import { getUsers, adminSetUserPassword } from '@/services/userService';
import { ROLES } from '@/lib/constants';
import { formatUzPhone } from '@/utils/phoneFormat';

export default function PasswordsPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const currentUserRole = (profile?.role || 'owner').toLowerCase();
  const isOwner = currentUserRole === ROLES.OWNER;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
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

    const strength = evaluatePasswordStrength(trimmed);
    if (!strength.allMet) {
      toast.error(
        t(
          'users.passwordMustBeStrong',
          'Parol xavfsiz (yashil) bo‘lishi uchun katta-kichik harf, raqam va maxsus belgi (!@#$) ishtirok etishi shart!'
        )
      );
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
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const qDigits = q.replace(/\D/g, '');
      const matchName = (u.fullName || '').toLowerCase().includes(q);
      const matchUsername = (u.username || '').toLowerCase().includes(q);
      const matchPhone =
        (u.phone || '').toLowerCase().includes(q) ||
        (u.father_phone || '').toLowerCase().includes(q) ||
        (u.mother_phone || '').toLowerCase().includes(q) ||
        (qDigits && (u.phone || '').replace(/\D/g, '').includes(qDigits));
      return matchName || matchUsername || matchPhone;
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
    [ROLES.TEACHER]: 'primary',
    [ROLES.STUDENT]: 'info',
  };

  const renderStrengthBadge = (pwd) => {
    const s = evaluatePasswordStrength(pwd || '');
    if (s.level === 'strong') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold whitespace-nowrap bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
          <ShieldCheck className="w-3 h-3 shrink-0" />
          <span>{t('passwords.strong', 'Xavfsiz')}</span>
        </span>
      );
    }
    if (s.level === 'medium') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold whitespace-nowrap bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
          <Shield className="w-3 h-3 shrink-0" />
          <span>{t('passwords.medium', "O'rtacha")}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold whitespace-nowrap bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
        <ShieldAlert className="w-3 h-3 shrink-0" />
        <span>{t('passwords.weak', 'Zaif')}</span>
      </span>
    );
  };

  const columns = [
    {
      header: t('common.name', 'Ism'),
      key: 'name',
      className: '!px-3 whitespace-nowrap',
      cellClassName: '!px-3 !py-3 whitespace-nowrap',
      render: (row) => {
        const initials =
          `${row.first_name?.[0] || ''}${row.last_name?.[0] || ''}`.toUpperCase() ||
          row.fullName?.[0]?.toUpperCase() ||
          'U';
        const avatarSrc =
          row.avatar_url ||
          (row.id === profile?.id ? profile?.avatar_url : '');
        return (
          <div className="flex items-center gap-2.5 whitespace-nowrap">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-[#123D78] to-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-sm ring-2 ring-gray-100 dark:ring-gray-800">
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
            <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
              {row.fullName}
            </span>
          </div>
        );
      },
    },
    {
      header: t('users.role', 'Rol'),
      key: 'role',
      className: '!px-2.5 whitespace-nowrap',
      cellClassName: '!px-2.5 !py-3 whitespace-nowrap',
      render: (row) => (
        <Badge variant={roleBadgeVariants[row.role] || 'secondary'} className="capitalize whitespace-nowrap">
          {t(`roles.${row.role}`, row.role)}
        </Badge>
      ),
    },
    {
      header: t('passwords.loginPhone', 'Login va Ota-ona raqamlari'),
      key: 'phone',
      className: '!px-3 whitespace-nowrap',
      cellClassName: '!px-3 !py-3 whitespace-nowrap',
      render: (row) => {
        const primaryPhone = row.phone || row.father_phone || row.mother_phone || '';
        const formatted = primaryPhone ? formatUzPhone(primaryPhone) : '—';
        const copyKey = `phone-${row.id}`;
        const fatherCopyKey = `father-${row.id}`;
        const motherCopyKey = `mother-${row.id}`;

        return (
          <div className="flex flex-col gap-1.5 whitespace-nowrap">
            {/* Primary Login Phone */}
            <div className="inline-flex items-center gap-1.5 w-fit rounded-xl bg-gray-100/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700/80 pl-2.5 pr-1 py-1">
              <Phone className="w-3.5 h-3.5 text-brand-navy dark:text-blue-400 shrink-0" />
              <span className="font-mono text-xs font-bold text-gray-900 dark:text-gray-100 tracking-wide whitespace-nowrap">
                {formatted}
              </span>
              {primaryPhone && (
                <button
                  type="button"
                  onClick={() => handleCopy(primaryPhone, copyKey)}
                  className="p-1 rounded-lg text-gray-400 hover:text-brand-navy dark:hover:text-blue-400 hover:bg-white dark:hover:bg-gray-700 transition-colors"
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

            {/* Parent Phones (Father & Mother) neatly styled */}
            {row.role === ROLES.STUDENT && (row.father_phone || row.mother_phone) && (
              <div className="flex flex-col gap-1 pl-0.5">
                {row.father_phone && (
                  <div className="inline-flex items-center gap-1.5 w-fit rounded-lg bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/50 px-2 py-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      {t('groups.father', 'Otasi')}:
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                      {formatUzPhone(row.father_phone)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(row.father_phone, fatherCopyKey)}
                      className="p-0.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
                      title="Otasining raqamidan nusxa olish"
                    >
                      {copiedId === fatherCopyKey ? (
                        <Check className="w-2.5 h-2.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-2.5 h-2.5" />
                      )}
                    </button>
                  </div>
                )}

                {row.mother_phone && (
                  <div className="inline-flex items-center gap-1.5 w-fit rounded-lg bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/50 px-2 py-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                      {t('groups.mother', 'Onasi')}:
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                      {formatUzPhone(row.mother_phone)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(row.mother_phone, motherCopyKey)}
                      className="p-0.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-300 transition-colors"
                      title="Onasining raqamidan nusxa olish"
                    >
                      {copiedId === motherCopyKey ? (
                        <Check className="w-2.5 h-2.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-2.5 h-2.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: t('passwords.currentPassword', 'Joriy parol (Oxirgi)'),
      key: 'password',
      className: '!px-3 whitespace-nowrap',
      cellClassName: '!px-3 !py-3 whitespace-nowrap',
      render: (row) => {
        const visible = isRowPasswordVisible(row.id);
        const pwd = row.password || 'Educo#2026!';
        const copyKey = `pwd-${row.id}`;
        return (
          <div className="flex items-center gap-2 whitespace-nowrap">
            {/* Unified Password Capsule */}
            <div className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60">
              <KeyRound className="w-3.5 h-3.5 text-brand-navy dark:text-blue-400 shrink-0" />
              <span className="font-mono text-xs font-bold tracking-wider text-gray-900 dark:text-white select-all">
                {visible ? pwd : '••••••••••'}
              </span>
              <div className="flex items-center gap-0.5 ml-1 pl-1 border-l border-blue-200/70 dark:border-blue-800/60">
                <button
                  type="button"
                  onClick={() => toggleRowVisibility(row.id)}
                  className="p-1 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-blue-100/60 dark:hover:bg-blue-900/50 transition-colors"
                  title={visible ? t('passwords.hide', 'Yashirish') : t('passwords.show', "Ko'rsatish")}
                >
                  {visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(pwd, copyKey)}
                  className="p-1 rounded-lg text-gray-500 hover:text-brand-navy dark:text-gray-400 dark:hover:text-blue-300 hover:bg-blue-100/60 dark:hover:bg-blue-900/50 transition-colors"
                  title={t('passwords.copyPassword', 'Paroldan nusxa olish')}
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
        );
      },
    },
    {
      header: t('passwords.updatedAt', 'Sana'),
      key: 'password_updated_at',
      className: '!px-2.5 whitespace-nowrap',
      cellClassName: '!px-2.5 !py-3 whitespace-nowrap',
      render: (row) => {
        const dt = row.password_updated_at || row.updated_at || row.created_at;
        return (
          <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
            <Clock className="w-3 h-3 shrink-0" />
            <span>{dt ? new Date(dt).toLocaleDateString('ru-RU') : '—'}</span>
          </span>
        );
      },
    },
    {
      header: t('common.actions', 'Amallar'),
      key: 'actions',
      className: '!px-3 whitespace-nowrap text-right',
      cellClassName: '!px-3 !py-3 whitespace-nowrap text-right',
      render: (row) => (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="outline"
            icon={Edit3}
            onClick={() => handleOpenChangeModal(row)}
          >
            {t('passwords.changeBtn', 'Almashtirish')}
          </Button>
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
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRoleFilter(tab.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                    active
                      ? 'bg-[#123D78] text-white shadow-sm ring-1 ring-blue-400/30'
                      : 'bg-gray-50 dark:bg-gray-800/70 text-gray-600 dark:text-gray-300 border border-gray-200/80 dark:border-gray-700/80 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      active
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-200/80 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
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
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('passwords.searchPlaceholder', 'Ism yoki raqam bo‘yicha qidirish...')}
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-navy dark:focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-800 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <Table
          columns={columns}
          data={filteredUsers}
          isLoading={loading}
          emptyMessage={t('users.noUsersFound', 'Hech qanday foydalanuvchi topilmadi')}
        />
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
