import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  UserCheck,
  GraduationCap,
  Shield,
  Search,
  Filter,
  Download,
  Edit2,
  KeyRound,
  ShieldAlert,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Phone,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Table from '@/components/ui/Table';
import Select from '@/components/ui/Select';
import { toast } from '@/components/ui/Toast';
import UserForm from './UserForm';
import {
  getUsers,
  toggleUserStatus,
  resetUserPassword,
  exportUsersToCSV,
} from '@/services/userService';
import { ROLES } from '@/lib/constants';
import { formatUzPhone } from '@/utils/phoneFormat';
import { useSearch } from '@/context/SearchContext';

export default function UserManagement() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const currentUserRole = profile?.role || ROLES.OWNER;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlRole = searchParams.get('role');
  const { searchQuery, setSearchQuery } = useSearch();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchQuery || '');
  const [roleFilter, setRoleFilter] = useState(urlRole || 'all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  // Synchronize with global navbar search bar
  useEffect(() => {
    if (searchQuery !== undefined) {
      setSearch(searchQuery);
      setPage(1);
    }
  }, [searchQuery]);

  // Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formDefaultRole, setFormDefaultRole] = useState(ROLES.STUDENT);

  // Sync roleFilter if URL changes
  useEffect(() => {
    if (urlRole && ['owner', 'admin', 'teacher', 'student', 'all'].includes(urlRole)) {
      setRoleFilter(urlRole);
    }
  }, [urlRole]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUsers({
        role: roleFilter,
        status: statusFilter,
        search,
        page,
        limit: pageSize,
        currentUserRole,
      });
      setUsers(data.users || []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalCount || 0);
    } catch (err) {
      console.error(err);
      toast.error(t('users.fetchError', 'Failed to load users'));
    } finally {
      setLoading(false);
    }
  }, [roleFilter, statusFilter, search, page, currentUserRole, t]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleStatus = async (user) => {
    const nextStatus = !user.is_active;
    try {
      await toggleUserStatus(user.id, nextStatus);
      toast.success(
        nextStatus
          ? t('users.activated', 'User account activated')
          : t('users.suspended', 'User account suspended')
      );
      fetchUsers();
    } catch (err) {
      toast.error(t('common.error', 'Failed to update user status'));
    }
  };

  const handleResetPassword = (user) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleExportCSV = () => {
    if (!users.length) {
      toast.warning(t('common.noData', 'No users to export'));
      return;
    }
    exportUsersToCSV(users);
    toast.success(t('users.exported', 'Users exported to CSV'));
  };

  const roleBadgeVariants = {
    [ROLES.OWNER]: 'danger',
    [ROLES.ADMIN]: 'purple',
    [ROLES.TEACHER]: 'warning',
    [ROLES.STUDENT]: 'success',
  };

  const columns = [
    {
      header: t('common.name', 'Foydalanuvchi'),
      key: 'name',
      className: 'whitespace-nowrap',
      cellClassName: 'whitespace-nowrap',
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
        const grad = avatarGradients[row.role] || 'from-blue-600 to-indigo-600';
        return (
          <div className="flex items-center gap-3 whitespace-nowrap">
            <div className={`w-9 h-9 rounded-full overflow-hidden bg-gradient-to-tr ${grad} text-white flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-sm ring-2 ring-gray-100 dark:ring-gray-800`}>
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
            <p className="font-semibold text-gray-900 dark:text-gray-100">{row.fullName}</p>
          </div>
        );
      },
    },
    {
      header: t('users.role', 'Role'),
      key: 'role',
      className: 'whitespace-nowrap',
      cellClassName: 'whitespace-nowrap',
      render: (row) => {
        const roleStyles = {
          [ROLES.OWNER]: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30',
          [ROLES.ADMIN]: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30',
          [ROLES.TEACHER]: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30',
          [ROLES.STUDENT]: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30',
        };
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${roleStyles[row.role] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}`}>
            <span>{t(`roles.${row.role}`, row.role)}</span>
          </span>
        );
      },
    },
    {
      header: t('common.phone', 'Phone'),
      key: 'phone',
      className: 'whitespace-nowrap',
      cellClassName: 'whitespace-nowrap',
      render: (row) => {
        const primaryPhone = row.phone || row.father_phone || row.mother_phone || '';
        const hasParentPhone = row.role === 'student' && (row.father_phone || row.mother_phone);

        return (
          <div className="flex items-center gap-2 whitespace-nowrap">
            {/* Primary Phone Badge */}
            <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-gray-800 dark:text-gray-200 bg-gray-100/90 dark:bg-gray-800/90 px-2.5 py-1 rounded-xl border border-gray-200 dark:border-gray-700/80 shadow-xs">
              <Phone className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
              {primaryPhone ? formatUzPhone(primaryPhone) : '—'}
            </span>

            {/* Compact Parent Popover Badge (Zero row-height inflation!) */}
            {hasParentPhone && (
              <div className="relative group/parent inline-block">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-all cursor-pointer shadow-xs"
                  title={t('groups.parentContacts', 'Ota-onasi raqamlari')}
                >
                  <Users className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>{t('groups.parents', 'Ota-onasi')}</span>
                  <ChevronDown className="w-2.5 h-2.5 opacity-70 group-hover/parent:rotate-180 transition-transform" />
                </button>

                {/* Floating Popover on Hover */}
                <div className="invisible group-hover/parent:visible opacity-0 group-hover/parent:opacity-100 transition-all duration-200 pointer-events-none group-hover/parent:pointer-events-auto absolute left-0 top-full mt-1.5 w-64 p-3 rounded-2xl bg-white dark:bg-[#1a2332] shadow-2xl border border-gray-200 dark:border-gray-700 z-50 text-left">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400 mb-2 pb-1.5 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
                    <span>{t('groups.parentContacts', 'Ota-onasi raqamlari')}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">
                      Aloqa
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {row.father_phone && (
                      <a
                        href={`tel:${row.father_phone}`}
                        className="flex items-center justify-between p-2 rounded-xl bg-indigo-50/70 hover:bg-indigo-100/70 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 border border-indigo-200/50 dark:border-indigo-800/50 transition-colors group/call"
                      >
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400">
                            {t('groups.father', 'Otasi')}
                          </span>
                          <span className="font-mono text-xs font-bold text-gray-800 dark:text-gray-200">
                            {formatUzPhone(row.father_phone)}
                          </span>
                        </div>
                        <Phone className="w-3.5 h-3.5 text-indigo-500 group-hover/call:scale-110 transition-transform shrink-0" />
                      </a>
                    )}
                    {row.mother_phone && (
                      <a
                        href={`tel:${row.mother_phone}`}
                        className="flex items-center justify-between p-2 rounded-xl bg-rose-50/70 hover:bg-rose-100/70 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 border border-rose-200/50 dark:border-rose-800/50 transition-colors group/call"
                      >
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold uppercase text-rose-600 dark:text-rose-400">
                            {t('groups.mother', 'Onasi')}
                          </span>
                          <span className="font-mono text-xs font-bold text-gray-800 dark:text-gray-200">
                            {formatUzPhone(row.mother_phone)}
                          </span>
                        </div>
                        <Phone className="w-3.5 h-3.5 text-rose-500 group-hover/call:scale-110 transition-transform shrink-0" />
                      </a>
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
      header: t('common.status', 'Status'),
      key: 'status',
      render: (row) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
            row.is_active
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs ring-1 ring-emerald-500/20'
              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 shadow-xs ring-1 ring-rose-500/20'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              row.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
            }`}
          />
          {row.is_active ? t('common.active', 'Faol') : t('common.inactive', 'Nofaol')}
        </span>
      ),
    },
    {
      header: t('common.date', 'Joined'),
      key: 'created_at',
      render: (row) => (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {row.created_at ? new Date(row.created_at).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      header: t('common.actions', 'Actions'),
      key: 'actions',
      className: 'text-right rtl:text-left',
      cellClassName: 'text-right rtl:text-left',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="!p-1.5 h-8 w-8 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/15 rounded-lg"
            title={t('common.edit', 'Tahrirlash')}
            onClick={() => navigate(`/${currentUserRole}/users/edit/${row.id}`)}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="!p-1.5 h-8 w-8 text-amber-600 dark:text-amber-400 hover:bg-amber-500/15 rounded-lg"
            title={t('auth.resetPassword', 'Parolni tiklash')}
            onClick={() => handleResetPassword(row)}
          >
            <KeyRound className="w-4 h-4" />
          </Button>
          {row.role !== ROLES.OWNER && (
            <Button
              variant="ghost"
              size="sm"
              className={`!p-1.5 h-8 w-8 rounded-lg ${
                row.is_active
                  ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-500/15'
                  : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15'
              }`}
              title={row.is_active ? t('users.suspend', 'Bloklash') : t('users.activate', 'Faollashtirish')}
              onClick={() => handleToggleStatus(row)}
            >
              {row.is_active ? (
                <XCircle className="w-4 h-4" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2.5">
            <Users className="w-7 h-7 text-brand-navy dark:text-blue-400" />
            {t('nav.users', 'User Management')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('users.pageSubtitle', 'Manage system accounts, credentials, and access roles')}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="md"
            icon={Download}
            onClick={handleExportCSV}
          >
            {t('common.export', 'Export CSV')}
          </Button>

          <Button
            variant="outline"
            size="md"
            icon={UserCheck}
            className="border-amber-400/80 text-amber-700 hover:bg-amber-50 dark:border-amber-600/60 dark:text-amber-300 dark:hover:bg-amber-950/40 font-semibold"
            onClick={() => navigate(`/${currentUserRole}/users/create?role=${ROLES.TEACHER}`)}
          >
            + {t('users.createTeacher', "O'qituvchi qo'shish")}
          </Button>

          <Button
            variant="primary"
            size="md"
            icon={GraduationCap}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/40 font-semibold"
            onClick={() => navigate(`/${currentUserRole}/users/create?role=${ROLES.STUDENT}`)}
          >
            + {t('users.createStudent', "Yangi o'quvchi qo'shish")}
          </Button>

          {currentUserRole === ROLES.OWNER && (
            <Button
              variant="ghost"
              size="md"
              icon={Shield}
              className="text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-purple-300/60 dark:border-purple-800/50 font-semibold"
              onClick={() => navigate(`/${currentUserRole}/users/create?role=${ROLES.ADMIN}`)}
            >
              + {t('users.createAdmin', "Admin")}
            </Button>
          )}
        </div>
      </div>

      {/* Role Navigation Tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2 border-b border-gray-200 dark:border-gray-800 pb-3 flex-wrap">
        {(() => {
          const tabColorMap = {
            all: {
              active: 'bg-blue-600 dark:bg-emerald-600 text-white shadow-md shadow-blue-600/30 dark:shadow-emerald-600/30 ring-2 ring-blue-400/40 dark:ring-emerald-400/40',
              inactive: 'bg-white dark:bg-surface-dark-secondary text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-surface-dark-tertiary border border-gray-200/80 dark:border-gray-700/60',
            },
            [ROLES.STUDENT]: {
              active: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/60',
              inactive: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-300/80 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40',
            },
            [ROLES.TEACHER]: {
              active: 'bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-2 ring-amber-400/60',
              inactive: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-300/80 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/40',
            },
            [ROLES.ADMIN]: {
              active: 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-2 ring-purple-300/60',
              inactive: 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border border-purple-300/80 dark:border-purple-800/60 hover:bg-purple-100 dark:hover:bg-purple-900/40',
            },
          };

          return [
            { key: 'all', label: t('users.allMembersTab', 'Barcha foydalanuvchilar'), icon: Users },
            { key: ROLES.STUDENT, label: t('users.studentsTab', "O'quvchilar"), icon: GraduationCap },
            { key: ROLES.TEACHER, label: t('users.teachersTab', "O'qituvchilar"), icon: UserCheck },
            ...(currentUserRole === ROLES.OWNER
              ? [{ key: ROLES.ADMIN, label: t('users.adminsTab', t('users.admin', 'Administratorlar')), icon: Shield }]
              : []),
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = roleFilter === tab.key;
            const cfg = tabColorMap[tab.key] || tabColorMap.all;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setRoleFilter(tab.key);
                  setSearchParams(tab.key === 'all' ? {} : { role: tab.key });
                  setPage(1);
                }}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 cursor-pointer
                  ${isActive ? cfg.active : cfg.inactive}
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          });
        })()}
      </div>

      {/* Filter and Search Bar */}
      <Card noPadding>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
          {/* Search */}
          <div className="lg:col-span-2">
            <Input
              icon={Search}
              size="md"
              placeholder={t('users.searchPlaceholder', 'Ism, foydalanuvchi nomi yoki telefon bo‘yicha qidirish...')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Role Filter */}
          <Select
            value={roleFilter}
            size="md"
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            placeholder={t('users.allRoles', 'Barcha rollar')}
            headerTitle={t('users.filterByRole', 'Rol bo‘yicha saralash')}
            icon={Shield}
            options={[
              { value: 'all', label: t('users.allRoles', 'Barcha rollar') },
              ...(currentUserRole === 'owner'
                ? [
                    { value: ROLES.OWNER, label: t('roles.owner', 'Asoschi (Owner)'), color: '#f59e0b', subtitle: 'Tizim rahbari' },
                    { value: ROLES.ADMIN, label: t('roles.admin', 'Administrator'), color: '#8b5cf6', subtitle: 'Markaz ma’muri' },
                  ]
                : []),
              { value: ROLES.TEACHER, label: t('roles.teacher', 'O‘qituvchi'), color: '#3b82f6', subtitle: 'Pedagog / Ustoz' },
              { value: ROLES.STUDENT, label: t('roles.student', 'O‘quvchi'), color: '#10b981', subtitle: 'Tinglovchi / Talaba' },
            ]}
          />

          {/* Status Filter */}
          <Select
            value={statusFilter}
            size="md"
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            placeholder={t('users.allStatuses', 'Barcha holatlar')}
            headerTitle={t('common.status', 'Akkaunt holati')}
            icon={CheckCircle}
            options={[
              { value: 'all', label: t('users.allStatuses', 'Barcha holatlar') },
              { value: 'active', label: t('common.active', 'Faol akkauntlar'), color: '#10b981', subtitle: 'Kirish huquqiga ega' },
              { value: 'inactive', label: t('common.inactive', 'Nofaol / Bloklangan'), color: '#ef4444', subtitle: 'Kirish cheklangan' },
            ]}
          />
        </div>

        {/* Desktop User Table */}
        <div className="hidden md:block">
          <Table
            columns={columns}
            data={users}
            isLoading={loading}
            emptyMessage={t('users.noUsersFound', 'No users found matching current filters')}
          />
        </div>

        {/* Mobile User Cards (Zero horizontal scroll) */}
        <div className="block md:hidden">
          {loading ? (
            <div className="py-12 text-center text-gray-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-navy"></div>
              <p className="mt-2 text-xs">{t('common.loading', 'Yuklanmoqda...')}</p>
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <Users className="w-10 h-10 mx-auto mb-2 text-gray-400" />
              <p className="text-sm font-semibold">{t('users.noUsersFound', 'Foydalanuvchilar topilmadi')}</p>
            </div>
          ) : (
            <div className="p-3 space-y-3">
              {users.map((row) => {
                const initials =
                  `${row.first_name?.[0] || ''}${row.last_name?.[0] || ''}`.toUpperCase() || 'U';
                const avatarSrc = row.avatar_url || row.profiles?.avatar_url;
                const primaryPhone = row.phone || row.father_phone || row.mother_phone || '';

                return (
                  <div
                    key={row.id}
                    className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark-secondary p-4 shadow-sm space-y-3"
                  >
                    {/* Header: Avatar, Name, Role, Status */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${
                          row.role === ROLES.OWNER
                            ? 'from-rose-500 to-red-600'
                            : row.role === ROLES.ADMIN
                            ? 'from-purple-600 to-indigo-600'
                            : row.role === ROLES.TEACHER
                            ? 'from-amber-500 to-orange-600'
                            : 'from-blue-600 to-indigo-600'
                        } text-white font-bold flex items-center justify-center text-xs uppercase shrink-0 overflow-hidden shadow-sm ring-2 ring-gray-100 dark:ring-gray-800`}>
                          {avatarSrc ? (
                            <img src={avatarSrc} alt={row.fullName} className="w-full h-full object-cover" />
                          ) : (
                            initials
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">
                            {row.fullName}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              row.role === ROLES.OWNER
                                ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                                : row.role === ROLES.ADMIN
                                ? 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30'
                                : row.role === ROLES.TEACHER
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                                : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                            }`}>
                              {t(`roles.${row.role}`, row.role)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                          row.is_active
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 ring-1 ring-emerald-500/20'
                            : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 ring-1 ring-rose-500/20'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${row.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                        {row.is_active ? t('common.active', 'Faol') : t('common.inactive', 'Nofaol')}
                      </span>
                    </div>

                    {/* Phones Row (Compact 1-row layout with parents popover) */}
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2 text-xs">
                      {primaryPhone ? (
                        <div className="flex items-center gap-2 font-mono font-bold text-gray-800 dark:text-gray-200 bg-gray-100/80 dark:bg-gray-800/80 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700/80 text-[11px]">
                          <Phone className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>{formatUzPhone(primaryPhone)}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}

                      {row.role === 'student' && (row.father_phone || row.mother_phone) && (
                        <div className="relative group/mobileParent inline-block">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 shadow-xs cursor-pointer"
                          >
                            <Users className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span>{t('groups.parents', 'Ota-onasi')}</span>
                            <ChevronDown className="w-2.5 h-2.5 opacity-70 group-hover/mobileParent:rotate-180 transition-transform" />
                          </button>

                          {/* Floating Popover on Hover/Focus */}
                          <div className="invisible group-hover/mobileParent:visible opacity-0 group-hover/mobileParent:opacity-100 transition-all duration-200 pointer-events-none group-hover/mobileParent:pointer-events-auto absolute right-0 bottom-full mb-1.5 w-60 p-2.5 rounded-xl bg-white dark:bg-[#1a2332] shadow-2xl border border-gray-200 dark:border-gray-700 z-50 text-left">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 pb-1 border-b border-gray-100 dark:border-gray-700/60">
                              {t('groups.parentContacts', 'Ota-onasi raqamlari')}
                            </div>
                            <div className="space-y-1.5">
                              {row.father_phone && (
                                <a
                                  href={`tel:${row.father_phone}`}
                                  className="flex items-center justify-between p-1.5 rounded-lg bg-indigo-50/70 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 border border-indigo-200/50 dark:border-indigo-800/50 transition-colors"
                                >
                                  <div>
                                    <span className="text-[9px] font-bold uppercase text-indigo-600 dark:text-indigo-400 block">
                                      {t('groups.father', 'Otasi')}
                                    </span>
                                    <span className="font-mono text-xs font-bold text-gray-800 dark:text-gray-200">
                                      {formatUzPhone(row.father_phone)}
                                    </span>
                                  </div>
                                  <Phone className="w-3 h-3 text-indigo-500" />
                                </a>
                              )}
                              {row.mother_phone && (
                                <a
                                  href={`tel:${row.mother_phone}`}
                                  className="flex items-center justify-between p-1.5 rounded-lg bg-rose-50/70 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 border border-rose-200/50 dark:border-rose-800/50 transition-colors"
                                >
                                  <div>
                                    <span className="text-[9px] font-bold uppercase text-rose-600 dark:text-rose-400 block">
                                      {t('groups.mother', 'Onasi')}
                                    </span>
                                    <span className="font-mono text-xs font-bold text-gray-800 dark:text-gray-200">
                                      {formatUzPhone(row.mother_phone)}
                                    </span>
                                  </div>
                                  <Phone className="w-3 h-3 text-rose-500" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Edit2}
                        className="flex-1 justify-center text-xs py-1.5 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                        onClick={() => navigate(`/${currentUserRole}/users/edit/${row.id}`)}
                      >
                        {t('common.edit', 'Tahrirlash')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={KeyRound}
                        className="flex-1 justify-center text-xs py-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                        title={t('users.resetPassword', 'Parolni tiklash')}
                        onClick={() => handleResetPassword(row)}
                      >
                        {t('auth.resetPassword', 'Parol')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`!p-2 shrink-0 rounded-lg ${
                          row.is_active
                            ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                            : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                        }`}
                        title={row.is_active ? t('users.suspend', 'Bloklash') : t('users.activate', 'Faollashtirish')}
                        onClick={() => handleToggleStatus(row)}
                      >
                        {row.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
          <div>
            {t('common.showing', 'Showing')}{' '}
            <span className="font-semibold text-gray-700 dark:text-gray-200">
              {users.length > 0 ? (page - 1) * pageSize + 1 : 0}
            </span>{' '}
            -{' '}
            <span className="font-semibold text-gray-700 dark:text-gray-200">
              {Math.min(page * pageSize, totalCount)}
            </span>{' '}
            {t('common.of', 'of')}{' '}
            <span className="font-semibold text-gray-700 dark:text-gray-200">{totalCount}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
            >
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
            </Button>
            <span className="px-2 font-medium">
              {page} / {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            >
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </Button>
          </div>
        </div>
      </Card>

      {/* User Create/Edit Modal */}
      {isFormOpen && (
        <UserForm
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          currentUserRole={currentUserRole}
          defaultRole={formDefaultRole}
          onSuccess={fetchUsers}
        />
      )}
    </div>
  );
}
