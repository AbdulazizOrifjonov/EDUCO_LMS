import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CreditCard,
  Plus,
  Download,
  Search,
  Filter,
  DollarSign,
  Calendar,
  UserCheck,
  AlertCircle,
  Clock,
  CheckCircle2,
  Receipt,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import { Button, Card, Badge, Modal, Input, EmptyState, LoadingSpinner } from '@/components/ui';
import PaymentForm from './PaymentForm';
import {
  getTuitionSummary,
  getTuitionPayments,
  recordPayment,
  exportTuitionCSV,
} from '@/services/tuitionService';
import { formatCurrency, formatDate } from '@/utils/csvExport';

export default function TuitionPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();

  const isStudent = profile?.role === 'student';

  // Tabs
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'history'

  // Data states
  const [studentsSummary, setStudentsSummary] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'paid' | 'partial' | 'unpaid'

  // Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState(null);

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [summary, history] = await Promise.all([
        getTuitionSummary({ status: statusFilter !== 'ALL' ? statusFilter : undefined }),
        getTuitionPayments({}),
      ]);
      setStudentsSummary(summary);
      setPaymentHistory(history);
    } catch (err) {
      console.error('Error fetching tuition records:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (data) => {
    try {
      setActionLoading(true);
      await recordPayment(data);
      setIsPaymentModalOpen(false);
      setSelectedStudentForPayment(null);
      await loadData();
    } catch (err) {
      console.error('Error recording payment:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredStudents = useMemo(() => {
    let list = studentsSummary;
    if (isStudent && profile?.id) {
      list = list.filter((s) => s.studentId === profile.id);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.studentName.toLowerCase().includes(q) ||
          s.studentEmail.toLowerCase().includes(q)
      );
    }
    return list;
  }, [studentsSummary, searchQuery, isStudent, profile?.id]);

  const filteredHistory = useMemo(() => {
    let list = paymentHistory;
    if (isStudent && profile?.id) {
      list = list.filter((p) => p.studentId === profile.id);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.studentName.toLowerCase().includes(q) ||
          (p.referenceNumber && p.referenceNumber.toLowerCase().includes(q))
      );
    }
    return list;
  }, [paymentHistory, searchQuery, isStudent, profile?.id]);

  const handleExport = () => {
    if (activeTab === 'summary') {
      exportTuitionCSV(filteredStudents, 'tuition_summary.csv');
    } else {
      exportTuitionCSV(filteredHistory, 'payment_transactions.csv');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success">{t('tuition.paid', 'Paid')}</Badge>;
      case 'partial':
        return <Badge variant="warning">{t('tuition.partiallyPaid', 'Partial')}</Badge>;
      case 'unpaid':
        return <Badge variant="danger">{t('tuition.unpaid', 'Unpaid')}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t('tuition.title', 'Tuition & Payments')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {t('tuition.subtitle', 'Track student fee balances, monitor collections, and log incoming installments')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            icon={Download}
            onClick={handleExport}
            disabled={filteredStudents.length === 0 && filteredHistory.length === 0}
          >
            {t('common.export', 'Export CSV')}
          </Button>

          {!isStudent && (
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => {
                setSelectedStudentForPayment(null);
                setIsPaymentModalOpen(true);
              }}
            >
              {t('tuition.recordPayment', 'Record Payment')}
            </Button>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-brand-navy dark:text-blue-400 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400">{t('tuition.amountDue', 'Total Billed')}</div>
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(
                filteredStudents.reduce((acc, curr) => acc + (curr.amountDue || 0), 0)
              )}
            </div>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400">{t('tuition.amountPaid', 'Collected')}</div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(
                filteredStudents.reduce((acc, curr) => acc + (curr.amountPaid || 0), 0)
              )}
            </div>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/40 text-brand-red dark:text-red-400 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400">{t('tuition.balance', 'Outstanding Balance')}</div>
            <div className="text-lg font-bold text-brand-red dark:text-red-400">
              {formatCurrency(
                filteredStudents.reduce((acc, curr) => acc + (curr.balance || 0), 0)
              )}
            </div>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400">{t('tuition.paidInFull', 'Paid In Full')}</div>
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {filteredStudents.filter((s) => s.status === 'paid').length} / {filteredStudents.length}
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <nav className="flex space-x-6 rtl:space-x-reverse" aria-label="Tuition Tabs">
          <button
            onClick={() => setActiveTab('summary')}
            className={`
              flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors
              ${
                activeTab === 'summary'
                  ? 'border-brand-navy text-brand-navy dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }
            `}
          >
            <UserCheck className="w-4 h-4" />
            <span>{t('tuition.feeBalances', 'Student Fee Balances')}</span>
            <span className="ml-1.5 py-0.5 px-2 rounded-full text-xs bg-gray-100 dark:bg-surface-dark-tertiary">
              {filteredStudents.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`
              flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors
              ${
                activeTab === 'history'
                  ? 'border-brand-navy text-brand-navy dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }
            `}
          >
            <Receipt className="w-4 h-4" />
            <span>{t('tuition.paymentHistory', 'Payment History')}</span>
            <span className="ml-1.5 py-0.5 px-2 rounded-full text-xs bg-gray-100 dark:bg-surface-dark-tertiary">
              {filteredHistory.length}
            </span>
          </button>
        </nav>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Input
            icon={Search}
            placeholder={t('tuition.searchPlaceholder', 'Search by student name or email...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {activeTab === 'summary' && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-gray-500 uppercase">{t('common.status', 'Status')}:</span>
            <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 p-0.5 bg-gray-50 dark:bg-surface-dark-secondary">
              {['ALL', 'paid', 'partial', 'unpaid'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`
                    px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors
                    ${
                      statusFilter === st
                        ? 'bg-white dark:bg-surface-dark-tertiary text-brand-navy dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                    }
                  `}
                >
                  {st === 'ALL' ? t('common.all', 'All') : t(`tuition.${st}`, st)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SUMMARY TABLE */}
      {activeTab === 'summary' && (
        <Card noPadding>
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-sm">
              <thead className="bg-gray-50 dark:bg-surface-dark-tertiary text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-3.5">{t('users.student', 'Student')}</th>
                  <th className="px-6 py-3.5">{t('tuition.amountDue', 'Amount Due')}</th>
                  <th className="px-6 py-3.5">{t('tuition.amountPaid', 'Amount Paid')}</th>
                  <th className="px-6 py-3.5">{t('tuition.balance', 'Remaining Balance')}</th>
                  <th className="px-6 py-3.5">{t('common.status', 'Status')}</th>
                  <th className="px-6 py-3.5">{t('tuition.lastPayment', 'Last Payment')}</th>
                  {!isStudent && <th className="px-6 py-3.5 text-right rtl:text-left">{t('common.actions', 'Action')}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-surface-dark-secondary">
                {loading ? (
                  <tr>
                    <td colSpan={isStudent ? 6 : 7} className="py-12 text-center text-gray-500">
                      <LoadingSpinner size="md" />
                      <p className="mt-2 text-xs">Loading tuition statements...</p>
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={isStudent ? 6 : 7} className="py-10">
                      <EmptyState
                        icon={CreditCard}
                        title="No tuition records found"
                        description="There are currently no student records matching the filter criteria."
                      />
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((st) => (
                    <tr key={st.id} className="hover:bg-gray-50/50 dark:hover:bg-surface-dark-tertiary/50">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900 dark:text-gray-100">{st.studentName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{st.studentEmail}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-800 dark:text-gray-200">
                        {formatCurrency(st.amountDue)}
                      </td>
                      <td className="px-6 py-4 text-emerald-600 dark:text-emerald-400 font-semibold">
                        {formatCurrency(st.amountPaid)}
                      </td>
                      <td className="px-6 py-4 font-bold text-brand-red dark:text-red-400">
                        {formatCurrency(st.balance)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(st.status)}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-xs">
                        {st.lastPaymentDate ? formatDate(st.lastPaymentDate) : '-'}
                      </td>
                      {!isStudent && (
                        <td className="px-6 py-4 text-right rtl:text-left">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedStudentForPayment(st.studentId);
                              setIsPaymentModalOpen(true);
                            }}
                          >
                            {t('tuition.pay', 'Pay')}
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* HISTORY TABLE */}
      {activeTab === 'history' && (
        <Card noPadding>
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-sm">
              <thead className="bg-gray-50 dark:bg-surface-dark-tertiary text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-3.5">{t('users.student', 'Student')}</th>
                  <th className="px-6 py-3.5">{t('tuition.amount', 'Amount')}</th>
                  <th className="px-6 py-3.5">{t('tuition.paymentMethod', 'Method')}</th>
                  <th className="px-6 py-3.5">{t('tuition.reference', 'Reference ID')}</th>
                  <th className="px-6 py-3.5">{t('common.date', 'Date')}</th>
                  <th className="px-6 py-3.5">{t('common.status', 'Status')}</th>
                  <th className="px-6 py-3.5">{t('common.notes', 'Notes')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-surface-dark-secondary">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-gray-500">
                      <LoadingSpinner size="md" />
                      <p className="mt-2 text-xs">{t('common.loading', 'Loading payment transactions...')}</p>
                    </td>
                  </tr>
                ) : filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-10">
                      <EmptyState
                        icon={Receipt}
                        title={t('tuition.noPayments', 'No payment history')}
                        description="Payments logged will appear here with timestamps and receipts."
                      />
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((h) => (
                    <tr key={h.id} className="hover:bg-gray-50/50 dark:hover:bg-surface-dark-tertiary/50">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900 dark:text-gray-100">{h.studentName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{h.studentEmail}</div>
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(h.amount)}
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300 font-medium">
                        {h.paymentMethod}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-gray-500 dark:text-gray-400">
                        {h.referenceNumber || '-'}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-xs">
                        {formatDate(h.paymentDate)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="success">{t('tuition.cleared', 'Cleared')}</Badge>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">
                        {h.notes || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={t('tuition.recordPaymentTitle', 'Record Student Payment')}
        subtitle={t('tuition.recordPaymentSubtitle', 'Log received tuition payment into EDUCO ledger')}
      >
        <PaymentForm
          defaultStudentId={selectedStudentForPayment}
          onSubmit={handleRecordPayment}
          onCancel={() => setIsPaymentModalOpen(false)}
          isLoading={actionLoading}
        />
      </Modal>
    </div>
  );
}
