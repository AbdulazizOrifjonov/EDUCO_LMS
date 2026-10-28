import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ShieldAlert,
  Search,
  Filter,
  Calendar,
  User,
  Activity,
  ArrowUpDown,
  Lock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import { Button, Card, Badge, Input, EmptyState, LoadingSpinner } from '@/components/ui';
import Select from '@/components/ui/Select';
import { getAuditLogs } from '@/services/auditService';
import { formatDate } from '@/utils/csvExport';

export default function AuditLogPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();

  const isOwner = profile?.role === 'owner';
  const isAdmin = profile?.role === 'admin';
  const hasAccess = isOwner || isAdmin;

  // State
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (hasAccess) {
      loadLogs();
    }
  }, [hasAccess, page, actionFilter, startDate, endDate]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await getAuditLogs({
        action: actionFilter !== 'ALL' ? actionFilter : undefined,
        search: search || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        excludePayroll: !isOwner, // Admins cannot see payroll audit logs
        page,
        pageSize,
      });

      setLogs(res.logs || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadLogs();
  };

  if (!hasAccess) {
    return (
      <div className="p-8">
        <Card className="text-center p-12">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/40 text-brand-red flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('payroll.accessRestricted')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md mx-auto">
            {t('errors.unauthorized')}
          </p>
        </Card>
      </div>
    );
  }

  const getActionBadge = (action) => {
    if (!action) return <Badge variant="secondary">UNKNOWN</Badge>;
    const upper = action.toUpperCase();

    if (upper.includes('DELETE') || upper.includes('REMOVE')) {
      return <Badge variant="danger">{action}</Badge>;
    }
    if (upper.includes('CREATE') || upper.includes('RECORD') || upper.includes('INSERT')) {
      return <Badge variant="success">{action}</Badge>;
    }
    if (upper.includes('UPDATE') || upper.includes('EDIT') || upper.includes('CHANGE')) {
      return <Badge variant="info">{action}</Badge>;
    }
    if (upper.includes('PAY') || upper.includes('SALARY')) {
      return <Badge variant="purple">{action}</Badge>;
    }
    return <Badge variant="primary">{action}</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {t('audit.hubTitle')}
            </h1>
            <Badge variant={isOwner ? 'purple' : 'primary'}>
              {isOwner ? t('audit.fullAuditOwner') : t('audit.adminAudit')}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {t('audit.hubSubtitle')}
          </p>
        </div>

        <Button
          variant="outline"
          icon={RefreshCw}
          onClick={loadLogs}
          isLoading={loading}
        >
          {t('audit.refresh')}
        </Button>
      </div>

      {/* Filter Bar */}
      <Card>
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <Input
              icon={Search}
              placeholder={t('audit.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select
            label={t('audit.actionCategory')}
            options={[
              { value: 'ALL', label: t('audit.allActions') },
              { value: 'RECORD_PAYMENT', label: 'RECORD_PAYMENT' },
              { value: 'CREATE_SALARY_RULE', label: 'CREATE_SALARY_RULE' },
              { value: 'MARK_SALARY_PAID', label: 'MARK_SALARY_PAID' },
              { value: 'UPDATE_SETTINGS', label: 'UPDATE_SETTINGS' },
              { value: 'UPDATE_PROFILE', label: 'UPDATE_PROFILE' },
              { value: 'CHANGE_PASSWORD', label: 'CHANGE_PASSWORD' },
            ]}
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            color="blue"
          />

          <div>
            <Input
              type="date"
              label={t('reports.from')}
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div>
            <Input
              type="date"
              label={t('reports.to')}
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </form>
      </Card>

      {/* Audit Log Table */}
      <Card noPadding>
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {t('audit.totalEvents', { count: total })}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {t('audit.pageOf', { page, total: totalPages })}
          </span>
        </div>

        {/* Mobile View: Clean responsive cards */}
        <div className="block md:hidden divide-y divide-gray-100 dark:divide-gray-800 p-2">
          {loading ? (
            <div className="py-12 text-center text-gray-500">
              <LoadingSpinner size="md" />
              <p className="mt-2 text-xs">{t('audit.loadingAudit')}</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-10">
              <EmptyState
                icon={ShieldAlert}
                title={t('audit.noAuditTitle')}
                description={t('audit.noAuditDesc')}
              />
            </div>
          ) : (
            logs.map((log) => {
              const userDetail = log.profiles || {};
              return (
                <div key={log.id} className="p-4 bg-white dark:bg-surface-dark-secondary rounded-xl mb-3 border border-gray-100 dark:border-gray-800 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    {getActionBadge(log.action)}
                    <span className="font-mono text-[11px] text-gray-500 dark:text-gray-400">
                      {formatDate(log.created_at, 'en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-gray-100 block">
                        {userDetail.full_name || 'System / Service'}
                      </span>
                      <span className="text-[11px] text-gray-500 dark:text-gray-400">
                        {userDetail.email || (log.user_id ? log.user_id.slice(0, 8) : 'Automated')}
                      </span>
                    </div>
                    {log.target && (
                      <span className="font-mono text-[11px] bg-gray-100 dark:bg-surface-dark-tertiary px-2 py-0.5 rounded text-gray-700 dark:text-gray-300">
                        {log.target}
                      </span>
                    )}
                  </div>

                  {log.details && (
                    <div className="text-[11px] font-mono text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-surface-dark-tertiary p-2 rounded-lg break-all">
                      {typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details)}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View: Full Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left rtl:text-right text-sm">
            <thead className="bg-gray-50 dark:bg-surface-dark-tertiary text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-6 py-3.5">{t('audit.timestamp')}</th>
                <th className="px-6 py-3.5">{t('audit.action')}</th>
                <th className="px-6 py-3.5">{t('audit.performedBy')}</th>
                <th className="px-6 py-3.5">{t('audit.targetResource')}</th>
                <th className="px-6 py-3.5">{t('audit.details')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-surface-dark-secondary">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-500">
                    <LoadingSpinner size="md" />
                    <p className="mt-2 text-xs">{t('audit.loadingAudit')}</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-10">
                    <EmptyState
                      icon={ShieldAlert}
                      title={t('audit.noAuditTitle')}
                      description={t('audit.noAuditDesc')}
                    />
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const userDetail = log.profiles || {};
                  return (
                    <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-surface-dark-tertiary/50">
                      <td className="px-6 py-4 font-mono text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {formatDate(log.created_at, 'en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="px-6 py-4">
                        {getActionBadge(log.action)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {userDetail.full_name || 'System / Service'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {userDetail.email || (log.user_id ? log.user_id.slice(0, 8) : 'Automated')}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-700 dark:text-gray-300">
                        {log.target || '-'}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-gray-600 dark:text-gray-400 max-w-sm truncate">
                        {typeof log.details === 'object'
                          ? JSON.stringify(log.details)
                          : String(log.details || '-')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              icon={ChevronLeft}
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              {t('common.back')}
            </Button>

            <span className="text-xs text-gray-500 dark:text-gray-400">
              {t('audit.pageOf', { page, total: totalPages })}
            </span>

            <Button
              variant="outline"
              size="sm"
              icon={ChevronRight}
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              {t('common.next')}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
