import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
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
  MoreVertical,
  Phone,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Table from '@/components/ui/Table';
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

export default function UserManagement() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const currentUserRole = profile?.role || ROLES.OWNER;
  const [searchParams, setSearchParams] = useSearchParams();
  const urlRole = searchParams.get('role');

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState(urlRole || 'all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

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
    [ROLES.TEACHER]: 'primary',
    [ROLES.STUDENT]: 'info',
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
        return (
          <div className="flex items-center gap-3 whitespace-nowrap">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-tr from-[#123D78] to-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-sm ring-2 ring-gray-100 dark:ring-gray-800">
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
      render: (row) => (
        <Badge variant={roleBadgeVariants[row.role] || 'default'} size="sm">
          <span className="capitalize">{t(`roles.${row.role}`, row.role)}</span>
        </Badge>
      ),
    },
    {
      header: t('common.phone', 'Phone'),
      key: 'phone',
      className: 'whitespace-nowrap',
      cellClassName: 'whitespace-nowrap',
      render: (row) => {
        const primaryPhone = row.phone || row.father_phone || row.mother_phone || '';
        return (
          <div className="flex flex-col gap-1.5 whitespace-nowrap">
            <span className="inline-flex items-center gap-1.5 w-fit font-mono text-xs font-bold text-gray-800 dark:text-gray-200 bg-gray-100/90 dark:bg-gray-800/90 px-2.5 py-1 rounded-xl border border-gray-200 dark:border-gray-700/80">
              <Phone className="w-3 h-3 text-brand-navy dark:text-blue-400 shrink-0" />
              {primaryPhone ? formatUzPhone(primaryPhone) : '—'}
            </span>
            {row.role === 'student' && (row.father_phone || row.mother_phone) && (
              <div className="flex flex-col gap-1">
                {row.father_phone && (
                  <span className="inline-flex items-center gap-1.5 w-fit rounded-lg bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/50 px-2 py-0.5 text-[11px]">
                    <span className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400">
                      {t('groups.father', 'Otasi')}:
                    </span>
                    <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">
                      {formatUzPhone(row.father_phone)}
                    </span>
                  </span>
                )}
                {row.mother_phone && (
                  <span className="inline-flex items-center gap-1.5 w-fit rounded-lg bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/50 px-2 py-0.5 text-[11px]">
                    <span className="text-[10px] font-bold uppercase text-rose-600 dark:text-rose-400">
                      {t('groups.mother', 'Onasi')}:
                    </span>
                    <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">
                      {formatUzPhone(row.mother_phone)}
                    </span>
                  </span>
                )}
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
        <Badge variant={row.is_active ? 'success' : 'danger'} size="sm">
          {row.is_active ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
        </Badge>
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
            className="!p-1.5 h-8 w-8 text-gray-600 dark:text-gray-300 hover:text-brand-navy"
            title={t('common.edit', 'Edit')}
            onClick={() => {
              setSelectedUser(row);
              setIsFormOpen(true);
            }}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="!p-1.5 h-8 w-8 text-gray-600 dark:text-gray-300 hover:text-amber-600"
            title={t('auth.resetPassword', 'Reset Password')}
            onClick={() => handleResetPassword(row)}
          >
            <KeyRound className="w-4 h-4" />
          </Button>
          {row.role !== ROLES.OWNER && (
            <Button
              variant="ghost"
              size="sm"
              className={`!p-1.5 h-8 w-8 ${
                row.is_active
                  ? 'text-gray-500 hover:text-brand-red'
                  : 'text-gray-500 hover:text-emerald-600'
              }`}
              title={row.is_active ? t('users.suspend', 'Suspend') : t('users.activate', 'Activate')}
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
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
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
            className="border-blue-300 text-brand-navy hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950/40"
            onClick={() => {
              setSelectedUser(null);
              setFormDefaultRole(ROLES.TEACHER);
              setIsFormOpen(true);
            }}
          >
            + {t('users.createTeacher', "O'qituvchi qo'shish")}
          </Button>

          <Button
            variant="primary"
            size="md"
            icon={GraduationCap}
            className="shadow-sm"
            onClick={() => {
              setSelectedUser(null);
              setFormDefaultRole(ROLES.STUDENT);
              setIsFormOpen(true);
            }}
          >
            + {t('users.createStudent', "Yangi o'quvchi qo'shish")}
          </Button>

          {currentUserRole === ROLES.OWNER && (
            <Button
              variant="ghost"
              size="md"
              icon={Shield}
              onClick={() => {
                setSelectedUser(null);
                setFormDefaultRole(ROLES.ADMIN);
                setIsFormOpen(true);
              }}
            >
              + {t('users.createAdmin', "Admin")}
            </Button>
          )}
        </div>
      </div>

      {/* Role Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-3 overflow-x-auto">
        {[
          { key: 'all', label: t('users.allMembersTab', 'Barcha foydalanuvchilar'), icon: Users },
          { key: ROLES.STUDENT, label: t('users.studentsTab', "O'quvchilar"), icon: GraduationCap },
          { key: ROLES.TEACHER, label: t('users.teachersTab', "O'qituvchilar"), icon: UserCheck },
          ...(currentUserRole === ROLES.OWNER
            ? [{ key: ROLES.ADMIN, label: t('users.adminsTab', t('users.admin', 'Administratorlar')), icon: Shield }]
            : []),
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = roleFilter === tab.key;
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
                flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0
                ${
                  isActive
                    ? 'bg-brand-navy text-white shadow-sm dark:bg-blue-600'
                    : 'bg-white dark:bg-surface-dark-secondary text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-surface-dark-tertiary border border-gray-200/80 dark:border-gray-700/60'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <Card noPadding>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="lg:col-span-2">
            <Input
              icon={Search}
              placeholder={t('users.searchPlaceholder', 'Search by name, username...')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-navy"
            >
              <option value="all">{t('users.allRoles', 'All Roles')}</option>
              {currentUserRole === 'owner' && (
                <>
                  <option value={ROLES.OWNER}>{t('roles.owner', 'Owner')}</option>
                  <option value={ROLES.ADMIN}>{t('roles.admin', 'Admin')}</option>
                </>
              )}
              <option value={ROLES.TEACHER}>{t('roles.teacher', 'Teacher')}</option>
              <option value={ROLES.STUDENT}>{t('roles.student', 'Student')}</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-navy"
            >
              <option value="all">{t('users.allStatuses', 'All Statuses')}</option>
              <option value="active">{t('common.active', 'Active')}</option>
              <option value="inactive">{t('common.inactive', 'Inactive')}</option>
            </select>
          </div>
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
                        <div className="w-10 h-10 rounded-full bg-brand-navy/10 text-brand-navy dark:text-blue-300 font-bold flex items-center justify-center text-sm uppercase shrink-0 overflow-hidden">
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
                            <Badge variant={roleBadgeVariants[row.role] || 'default'} size="sm">
                              <span className="capitalize">{t(`roles.${row.role}`, row.role)}</span>
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <Badge variant={row.is_active ? 'success' : 'danger'} size="sm" className="shrink-0">
                        {row.is_active ? t('common.active', 'Faol') : t('common.inactive', 'Nofaol')}
                      </Badge>
                    </div>

                    {/* Phones Row */}
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-1.5 text-xs">
                      {primaryPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-brand-navy dark:text-blue-400 shrink-0" />
                          <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
                            {formatUzPhone(primaryPhone)}
                          </span>
                        </div>
                      )}

                      {row.role === 'student' && (row.father_phone || row.mother_phone) && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {row.father_phone && (
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/50 px-2 py-0.5 text-[11px]">
                              <span className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400">
                                {t('groups.father', 'Otasi')}:
                              </span>
                              <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">
                                {formatUzPhone(row.father_phone)}
                              </span>
                            </span>
                          )}
                          {row.mother_phone && (
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/50 px-2 py-0.5 text-[11px]">
                              <span className="text-[10px] font-bold uppercase text-rose-600 dark:text-rose-400">
                                {t('groups.mother', 'Onasi')}:
                              </span>
                              <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">
                                {formatUzPhone(row.mother_phone)}
                              </span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Edit2}
                        className="flex-1 justify-center text-xs py-1.5"
                        onClick={() => {
                          setSelectedUser(row);
                          setIsFormOpen(true);
                        }}
                      >
                        {t('common.edit', 'Tahrirlash')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={KeyRound}
                        className="flex-1 justify-center text-xs py-1.5 text-gray-600 dark:text-gray-300"
                        title={t('users.resetPassword', 'Parolni tiklash')}
                        onClick={() => handleResetPassword(row)}
                      >
                        {t('auth.resetPassword', 'Parol')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`!p-2 shrink-0 ${
                          row.is_active
                            ? 'text-gray-400 hover:text-brand-red'
                            : 'text-gray-400 hover:text-emerald-600'
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
