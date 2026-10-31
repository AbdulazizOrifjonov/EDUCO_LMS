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
  Tag,
  Percent,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import { Button, Card, Badge, Modal, Input, EmptyState, LoadingSpinner } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import PaymentForm from './PaymentForm';
import {
  getTuitionSummary,
  getTuitionPayments,
  recordPayment,
  exportTuitionCSV,
} from '@/services/tuitionService';
import { updateStudentDiscount } from '@/services/groupService';
import { formatCurrency, formatDate } from '@/utils/csvExport';
import { useSearch } from '@/context/SearchContext';

export default function TuitionPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { searchQuery: globalSearch, setSearchQuery: setGlobalSearch } = useSearch();

  const isStudent = profile?.role === 'student';

  // Tabs
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'history'

  // Data states
  const [studentsSummary, setStudentsSummary] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState(globalSearch || '');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'paid' | 'partial' | 'unpaid'

  // Synchronize with navbar global search
  useEffect(() => {
    if (globalSearch !== undefined) {
      setSearchQuery(globalSearch);
    }
  }, [globalSearch]);

  // Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState(null);

  // Discount Modal
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [discountStudent, setDiscountStudent] = useState(null);
  const [discountType, setDiscountType] = useState('none');
  const [discountValue, setDiscountValue] = useState('');
  const [discountReason, setDiscountReason] = useState('');
  const [savingDiscount, setSavingDiscount] = useState(false);

  useEffect(() => {
    loadData();

    const handleSync = () => {
      loadData();
    };
    window.addEventListener('educo-data-sync', handleSync);
    return () => window.removeEventListener('educo-data-sync', handleSync);
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
    if (actionLoading) return;
    try {
      setActionLoading(true);
      await recordPayment(data);
      setIsPaymentModalOpen(false);
      setSelectedStudentForPayment(null);
      await loadData();
      toast.success(t('tuition.paymentRecorded', 'To‘lov muvaffaqiyatli qabul qilindi va hisobga olindi!'));
    } catch (err) {
      console.error('Error recording payment:', err);
      toast.error(err.message || 'To‘lovni saqlashda xatolik yuz berdi');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDiscountModal = (student) => {
    setDiscountStudent(student);
    const existingDiscount = student.discountDetails?.[0];
    if (existingDiscount?.type === 'custom') {
      setDiscountType('custom');
      setDiscountValue(String(student.amountDue));
    } else if (existingDiscount?.type === 'percent') {
      setDiscountType('percent');
      setDiscountValue(String(existingDiscount.percent));
    } else if (existingDiscount?.type === 'fixed') {
      setDiscountType('fixed');
      setDiscountValue(String(existingDiscount.amount));
    } else {
      setDiscountType('none');
      setDiscountValue('');
    }
    setDiscountReason(existingDiscount?.reason || '');
    setIsDiscountModalOpen(true);
  };

  const handleSaveDiscount = async () => {
    if (!discountStudent || !discountStudent.groupId) {
      toast.error("Talaba birorta guruhga biriktirilmagan");
      return;
    }
    try {
      setSavingDiscount(true);
      const baseFee = Number(discountStudent.baseFee || 0);
      let payload = {
        discount_type: discountType === 'none' ? null : discountType,
        discount_reason: discountReason.trim(),
        custom_price: null,
        discount_percent: 0,
        discount_amount: 0,
      };

      if (discountType === 'percent') {
        const pct = Math.min(100, Math.max(0, Number(discountValue) || 0));
        payload.discount_percent = pct;
        payload.discount_amount = Math.round(baseFee * (pct / 100));
      } else if (discountType === 'fixed') {
        const amt = Math.max(0, Number(discountValue) || 0);
        payload.discount_amount = amt;
      } else if (discountType === 'custom') {
        const customPrice = Math.max(0, Number(discountValue) || 0);
        payload.custom_price = customPrice;
        payload.discount_amount = Math.max(0, baseFee - customPrice);
      }

      await updateStudentDiscount(discountStudent.groupId, discountStudent.studentId, payload);
      toast.success("Talaba to‘lovi va chegirmasi muvaffaqiyatli yangilandi!");
      setIsDiscountModalOpen(false);
      setDiscountStudent(null);
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error("Chegirmani saqlashda xatolik yuz berdi");
    } finally {
      setSavingDiscount(false);
    }
  };

  const filteredStudents = useMemo(() => {
    let list = studentsSummary;
    if (isStudent && profile?.id) {
      list = list.filter((s) => s.studentId === profile.id);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const rawDigits = q.replace(/\D/g, '');
      list = list.filter(
        (s) =>
          (s.studentName && s.studentName.toLowerCase().includes(q)) ||
          (s.studentEmail && s.studentEmail.toLowerCase().includes(q)) ||
          (s.studentPhone && (s.studentPhone.toLowerCase().includes(q) || (rawDigits && s.studentPhone.replace(/\D/g, '').includes(rawDigits))))
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
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          (p.studentName && p.studentName.toLowerCase().includes(q)) ||
          (p.referenceNumber && p.referenceNumber.toLowerCase().includes(q)) ||
          (p.payment_method && p.payment_method.toLowerCase().includes(q))
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
    <div className="space-y-6 animate-fade-in">
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
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
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
        <nav className="flex items-center gap-6 overflow-x-auto no-scrollbar py-1 rtl:space-x-reverse" aria-label="Tuition Tabs">
          <button
            onClick={() => setActiveTab('summary')}
            className={`
              shrink-0 flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap cursor-pointer
              ${
                activeTab === 'summary'
                  ? 'border-blue-600 text-blue-600 dark:border-emerald-400 dark:text-emerald-400 font-semibold'
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
              shrink-0 flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap cursor-pointer
              ${
                activeTab === 'history'
                  ? 'border-blue-600 text-blue-600 dark:border-emerald-400 dark:text-emerald-400 font-semibold'
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
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setGlobalSearch(e.target.value);
            }}
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
                        ? 'bg-white dark:bg-surface-dark-tertiary text-blue-600 dark:text-emerald-400 shadow-sm font-semibold'
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
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-sm">
              <thead className="bg-gray-50 dark:bg-surface-dark-tertiary text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-5 py-3.5">{t('users.student', 'Talaba')}</th>
                  <th className="px-5 py-3.5">Kurs va Guruh</th>
                  <th className="px-5 py-3.5">Asosiy to‘lov</th>
                  <th className="px-5 py-3.5">Chegirma</th>
                  <th className="px-5 py-3.5">{t('tuition.amountDue', 'To‘lanishi kerak')}</th>
                  <th className="px-5 py-3.5">{t('tuition.amountPaid', 'To‘langan')}</th>
                  <th className="px-5 py-3.5">{t('tuition.balance', 'Qoldiq qarz')}</th>
                  <th className="px-5 py-3.5">{t('common.status', 'Holati')}</th>
                  <th className="px-5 py-3.5">{t('tuition.lastPayment', 'So‘nggi to‘lov')}</th>
                  {!isStudent && <th className="px-5 py-3.5 text-right rtl:text-left">{t('common.actions', 'Amallar')}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-surface-dark-secondary">
                {loading ? (
                  <tr>
                    <td colSpan={isStudent ? 9 : 10} className="py-12 text-center text-gray-500">
                      <LoadingSpinner size="md" />
                      <p className="mt-2 text-xs">Loading tuition statements...</p>
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={isStudent ? 9 : 10} className="py-10">
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
                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-900 dark:text-gray-100">{st.studentName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">{st.studentPhone || st.studentEmail}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-gray-900 dark:text-gray-100 text-xs">{st.courseName}</div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400">{st.groupName}</div>
                      </td>
                      <td className="px-5 py-4 text-gray-700 dark:text-gray-300 text-xs font-semibold">
                        {formatCurrency(st.baseFee)}
                      </td>
                      <td className="px-5 py-4">
                        {st.discountAmount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/20">
                            <Tag className="w-3 h-3 text-amber-600" />
                            -{formatCurrency(st.discountAmount)}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Standart</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-gray-900 dark:text-gray-100 font-bold">
                        {formatCurrency(st.amountDue)}
                      </td>
                      <td className="px-5 py-4 text-emerald-600 dark:text-emerald-400 font-semibold">
                        {formatCurrency(st.amountPaid)}
                      </td>
                      <td className="px-5 py-4 font-bold text-brand-red dark:text-red-400">
                        {formatCurrency(st.balance)}
                      </td>
                      <td className="px-5 py-4">
                        {getStatusBadge(st.status)}
                      </td>
                      <td className="px-5 py-4 text-gray-600 dark:text-gray-400 text-xs">
                        {st.lastPaymentDate ? formatDate(st.lastPaymentDate) : '-'}
                      </td>
                      {!isStudent && (
                        <td className="px-5 py-4 text-right rtl:text-left">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="!p-1.5 h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                              title="Chegirmani sozlash"
                              onClick={() => handleOpenDiscountModal(st)}
                            >
                              <Percent className="w-4 h-4" />
                            </Button>
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
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="block md:hidden space-y-3 p-3">
            {loading ? (
              <div className="py-12 text-center text-gray-500">
                <LoadingSpinner size="md" />
                <p className="mt-2 text-xs">Loading tuition statements...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                title="No tuition records found"
                description="There are currently no student records matching the filter criteria."
              />
            ) : (
              filteredStudents.map((st) => (
                <div
                  key={st.id}
                  className="p-4 rounded-2xl bg-white dark:bg-surface-dark-secondary border border-gray-200 dark:border-gray-800 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">{st.studentName}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{st.studentPhone || st.studentEmail}</p>
                    </div>
                    {getStatusBadge(st.status)}
                  </div>

                  <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-surface-dark-tertiary flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{st.courseName}</span>
                      <span className="text-gray-400 ml-1.5">• {st.groupName}</span>
                    </div>
                    {st.discountAmount > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-500/20">
                        <Tag className="w-2.5 h-2.5 text-amber-600" />
                        -{formatCurrency(st.discountAmount)}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs border-t border-b border-gray-100 dark:border-gray-800/80 py-2">
                    <div>
                      <span className="text-[10px] text-gray-400 block uppercase">To‘lanishi kerak</span>
                      <span className="font-bold text-gray-900 dark:text-gray-100">{formatCurrency(st.amountDue)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block uppercase">To‘langan</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(st.amountPaid)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block uppercase">Qoldiq qarz</span>
                      <span className="font-bold text-brand-red dark:text-red-400">{formatCurrency(st.balance)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-gray-400">
                      So‘nggi to‘lov: {st.lastPaymentDate ? formatDate(st.lastPaymentDate) : '-'}
                    </span>
                    {!isStudent && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="!p-1.5 h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                          title="Chegirmani sozlash"
                          onClick={() => handleOpenDiscountModal(st)}
                        >
                          <Percent className="w-4 h-4" />
                        </Button>
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
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* HISTORY TABLE */}
      {activeTab === 'history' && (
        <Card noPadding>
          {/* Desktop History Table */}
          <div className="hidden md:block overflow-x-auto">
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

          {/* Mobile History Cards */}
          <div className="block md:hidden space-y-3 p-3">
            {loading ? (
              <div className="py-12 text-center text-gray-500">
                <LoadingSpinner size="md" />
                <p className="mt-2 text-xs">{t('common.loading', 'Loading payment transactions...')}</p>
              </div>
            ) : filteredHistory.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title={t('tuition.noPayments', 'No payment history')}
                description="Payments logged will appear here with timestamps and receipts."
              />
            ) : (
              filteredHistory.map((h) => (
                <div
                  key={h.id}
                  className="p-4 rounded-2xl bg-white dark:bg-surface-dark-secondary border border-gray-200 dark:border-gray-800 shadow-xs space-y-2.5 text-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">{h.studentName}</h4>
                      <p className="text-[11px] text-gray-400">{h.studentEmail}</p>
                    </div>
                    <Badge variant="success">{t('tuition.cleared', 'Cleared')}</Badge>
                  </div>
                  <div className="flex items-center justify-between font-medium">
                    <span className="text-gray-500">Summa:</span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(h.amount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-500">
                    <span>Uslub & ID:</span>
                    <span className="font-mono text-gray-700 dark:text-gray-300">{h.paymentMethod} {h.referenceNumber ? `(${h.referenceNumber})` : ''}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-400 text-[11px] border-t border-gray-100 dark:border-gray-800 pt-2">
                    <span>Sana: {formatDate(h.paymentDate)}</span>
                    {h.notes && <span className="italic truncate max-w-[150px]">{h.notes}</span>}
                  </div>
                </div>
              ))
            )}
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

      {/* Student Discount Modal */}
      <Modal
        isOpen={isDiscountModalOpen}
        onClose={() => {
          if (!savingDiscount) {
            setIsDiscountModalOpen(false);
            setDiscountStudent(null);
          }
        }}
        title="Talabaning to‘lovi va chegirmasini sozlash"
        size="md"
      >
        {discountStudent && (
          <div className="space-y-4">
            {/* Student info banner */}
            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-surface-dark-secondary border border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {discountStudent.studentName}
                </p>
                <p className="text-xs text-gray-500">{discountStudent.courseName} • {discountStudent.groupName}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-400 block uppercase font-bold">Asosiy to‘lov</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {Number(discountStudent.baseFee || 0).toLocaleString()} so‘m / oy
                </span>
              </div>
            </div>

            {/* Discount Type Selection */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 block mb-2">
                Chegirma turi yoki maxsus to‘lov
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'none', label: "Chegirmasiz (Standart)", desc: "Asosiy narx bo'yicha" },
                  { id: 'percent', label: "Foizli chegirma (%)", desc: "Masalan: 10%, 20%, 50%" },
                  { id: 'fixed', label: "Qat'iy chegirma (so'm)", desc: "Masalan: 100 000 so'm ayirish" },
                  { id: 'custom', label: "Maxsus to'lov (so'm)", desc: "Masalan: 450 000 so'm to'lash" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setDiscountType(item.id);
                      if (item.id === 'none') setDiscountValue('');
                    }}
                    className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                      discountType === item.id
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-bold ring-1 ring-emerald-500'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark-secondary text-gray-700 dark:text-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-xs font-semibold">{item.label}</div>
                    <div className="text-[10px] opacity-70 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Value Input */}
            {discountType !== 'none' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  {discountType === 'percent'
                    ? "Chegirma foizi (%)"
                    : discountType === 'fixed'
                    ? "Chegirma summasi (so'm)"
                    : "Belgilangan yakuniy oylik to'lov summasi (so'm)"}
                </label>
                <Input
                  type="number"
                  placeholder={
                    discountType === 'percent'
                      ? "Masalan: 20"
                      : discountType === 'fixed'
                      ? "Masalan: 100000"
                      : "Masalan: 450000"
                  }
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                />
              </div>
            )}

            {/* Real-time Calculation Breakdown Box */}
            {(() => {
              const base = Number(discountStudent.baseFee || 0);
              let val = Number(discountValue) || 0;
              let finalDue = base;
              let discountSub = 0;

              if (discountType === 'percent') {
                val = Math.min(100, Math.max(0, val));
                discountSub = Math.round(base * (val / 100));
                finalDue = Math.max(0, base - discountSub);
              } else if (discountType === 'fixed') {
                discountSub = Math.min(base, Math.max(0, val));
                finalDue = Math.max(0, base - discountSub);
              } else if (discountType === 'custom') {
                finalDue = Math.max(0, val);
                discountSub = Math.max(0, base - finalDue);
              }

              return (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                    <span>Asosiy to‘lov:</span>
                    <span>{base.toLocaleString()} so‘m</span>
                  </div>
                  {discountType !== 'none' && (
                    <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 font-medium">
                      <span>Chegirma:</span>
                      <span>-{discountSub.toLocaleString()} so‘m</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between font-bold text-gray-900 dark:text-white pt-1.5 border-t border-emerald-500/20 text-sm">
                    <span>Oylik to‘lanadigan summa:</span>
                    <span className="text-emerald-700 dark:text-emerald-400">{finalDue.toLocaleString()} so‘m</span>
                  </div>
                </div>
              );
            })()}

            {/* Reason */}
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Chegirma sababi / Izoh
              </label>
              <Input
                placeholder="Masalan: Olimpiada g‘olibi, Kam ta'minlangan, Grant..."
                value={discountReason}
                onChange={(e) => setDiscountReason(e.target.value)}
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsDiscountModalOpen(false);
                  setDiscountStudent(null);
                }}
                disabled={savingDiscount}
              >
                Bekor qilish
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveDiscount}
                disabled={savingDiscount}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {savingDiscount ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
