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
  Trash2,
  AlertTriangle,
  Send,
  Check,
  MessageSquare,
  Phone,
  Sparkles,
  Users,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import { Button, Card, Badge, Modal, Input, EmptyState, LoadingSpinner } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import PaymentForm from './PaymentForm';
import {
  getTuitionSummary,
  getTuitionPayments,
  recordPayment,
  markStudentAsPaid,
  markAllStudentsAsPaid,
  exportTuitionCSV,
  deletePayment,
  deleteSelectedPayments,
  deleteAllPayments,
} from '@/services/tuitionService';
import {
  sendDirectDebtorSmsList,
  formatDebtorSmsMessage,
  DEFAULT_DEBTOR_TEMPLATE,
} from '@/services/smsService';
import { updateStudentDiscount } from '@/services/groupService';
import { formatCurrency, formatDate } from '@/utils/csvExport';
import { useSearch } from '@/context/SearchContext';

export default function TuitionPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { searchQuery: globalSearch, setSearchQuery: setGlobalSearch } = useSearch();

  const userRole = (profile?.role || '').toLowerCase();
  const isStudent = userRole === 'student';
  const canDeletePayments = userRole === 'admin' || userRole === 'owner';

  // Tabs
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'history'

  // Data states
  const [studentsSummary, setStudentsSummary] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Debtor Selection States (for selective SMS and selective payment)
  const [selectedDebtors, setSelectedDebtors] = useState(new Set());

  // Debtor SMS Modal States
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const [smsRecipientsList, setSmsRecipientsList] = useState([]);
  const [smsRecipientType, setSmsRecipientType] = useState('parent_preferred'); // 'parent_preferred' | 'student'
  const [smsTemplateText, setSmsTemplateText] = useState(DEFAULT_DEBTOR_TEMPLATE);
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [smsProgress, setSmsProgress] = useState({ current: 0, total: 0, studentName: '' });

  // Mark all paid (December reset) state
  const [showAllPaidConfirm, setShowAllPaidConfirm] = useState(false);
  const [isMarkingAllPaid, setIsMarkingAllPaid] = useState(false);

  // Delete states
  const [selectedPayments, setSelectedPayments] = useState(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteMode, setDeleteMode] = useState(null); // 'single' | 'selected' | 'all'
  const [paymentToDelete, setPaymentToDelete] = useState(null);

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

  const loadData = React.useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const [summary, history] = await Promise.all([
        getTuitionSummary({ status: statusFilter !== 'ALL' ? statusFilter : undefined }),
        getTuitionPayments({}),
      ]);
      setStudentsSummary(summary);
      setPaymentHistory(history);
    } catch (err) {
      console.error('Error fetching tuition records:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();

    const handleSync = () => {
      loadData(true);
    };
    window.addEventListener('educo-data-sync', handleSync);
    return () => window.removeEventListener('educo-data-sync', handleSync);
  }, [loadData]);

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

  // Debtor selection & calculation helpers
  const eligibleDebtors = useMemo(() => {
    return filteredStudents.filter((s) => Number(s.balance || 0) > 0);
  }, [filteredStudents]);

  const totalSelectedDebt = useMemo(() => {
    return filteredStudents
      .filter((s) => selectedDebtors.has(s.studentId))
      .reduce((sum, s) => sum + Number(s.balance || 0), 0);
  }, [filteredStudents, selectedDebtors]);

  const handleToggleSelectDebtor = (studentId, balance) => {
    if (Number(balance || 0) <= 0) {
      toast.info("Ushbu talabaning qarzdorligi yo‘q (to‘langan), uni tanlab bo‘lmaydi.");
      return;
    }
    setSelectedDebtors((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  const handleToggleSelectAllDebtors = () => {
    if (selectedDebtors.size === eligibleDebtors.length && eligibleDebtors.length > 0) {
      setSelectedDebtors(new Set());
    } else {
      setSelectedDebtors(new Set(eligibleDebtors.map((s) => s.studentId)));
    }
  };

  // 1-Click Quick Payment Handler for single row
  const handleQuickPay = async (student) => {
    if (actionLoading) return;
    if (!student || Number(student.balance || 0) <= 0) {
      toast.info("Ushbu talabaning to‘lanmagan qarzdorligi yo‘q.");
      return;
    }
    try {
      setActionLoading(true);
      await markStudentAsPaid(student.studentId, student.balance, 'Naqd pul', 'To‘liq to‘landi (1-bosishda)');
      toast.success(
        `✅ ${student.studentName} uchun ${formatCurrency(student.balance)} to‘lov qabul qilindi va qarzdorlik to‘liq yopildi!`
      );
      setSelectedDebtors((prev) => {
        const next = new Set(prev);
        next.delete(student.studentId);
        return next;
      });
      await loadData(true);
    } catch (err) {
      console.error('handleQuickPay error:', err);
      toast.error(err.message || 'To‘lovni qabul qilishda xatolik yuz berdi');
    } finally {
      setActionLoading(false);
    }
  };

  // Batch Payment for Selected Debtors
  const handleBatchPaySelected = async () => {
    if (actionLoading || selectedDebtors.size === 0) return;
    try {
      setActionLoading(true);
      const ids = Array.from(selectedDebtors);
      const res = await markAllStudentsAsPaid(ids, 'Tanlangan talabalar qarzdorligi to‘liq yopildi');
      toast.success(
        `✅ Tanlangan ${res.clearedCount} ta talabaning qarzdorligi (${formatCurrency(res.totalClearedAmount)}) to‘liq to‘landi deb belgilandi!`
      );
      setSelectedDebtors(new Set());
      await loadData(true);
    } catch (err) {
      console.error('handleBatchPaySelected error:', err);
      toast.error(err.message || 'To‘lovlarni yopishda xatolik yuz berdi');
    } finally {
      setActionLoading(false);
    }
  };

  // Mark all students as paid (December fresh start)
  const handleConfirmMarkAllPaid = async () => {
    if (isMarkingAllPaid) return;
    try {
      setIsMarkingAllPaid(true);
      const res = await markAllStudentsAsPaid('ALL', 'Dekabr oyigacha barcha qarzdorliklar to‘liq yopildi (Noyabrgacha yopish)');
      toast.success(
        `✅ Barcha ${res.clearedCount} ta talabaning jami ${formatCurrency(res.totalClearedAmount)} qarzdorligi to‘liq to‘landi deb qayd etildi! Dekabr oyiga toza hisob bilan tayyor.`
      );
      setShowAllPaidConfirm(false);
      setSelectedDebtors(new Set());
      await loadData(true);
    } catch (err) {
      console.error('handleConfirmMarkAllPaid error:', err);
      toast.error(err.message || 'Barchasini to‘langan qilishda xatolik');
    } finally {
      setIsMarkingAllPaid(false);
    }
  };

  // Debtor SMS Modal Handlers
  const handleOpenSmsModal = (debtorsList) => {
    const validDebtors = debtorsList.filter((s) => Number(s.balance || 0) > 0 && s.status !== 'paid');
    if (validDebtors.length === 0) {
      toast.warning("Tanlangan talabalar orasida qarzdorlik mavjud talabalar topilmadi. To‘langan talabalarga SMS yuborilmaydi!");
      return;
    }
    setSmsRecipientsList(validDebtors);
    setSmsTemplateText(DEFAULT_DEBTOR_TEMPLATE);
    setIsSmsModalOpen(true);
  };

  const handleSendDebtorSms = async () => {
    if (isSendingSms || smsRecipientsList.length === 0) return;
    try {
      setIsSendingSms(true);
      setSmsProgress({ current: 0, total: smsRecipientsList.length, studentName: '' });

      const result = await sendDirectDebtorSmsList({
        debtors: smsRecipientsList,
        customTemplate: smsTemplateText,
        recipientType: smsRecipientType,
        onProgress: (p) => setSmsProgress(p),
      });

      if (result.sentCount > 0) {
        toast.success(`📲 ${result.sentCount} ta qarzdorlik SMS xabarnomasi muvaffaqiyatli yuborildi!`);
      }
      if (result.skippedPaidCount > 0) {
        toast.info(`ℹ️ ${result.skippedPaidCount} ta to‘langan talaba o‘tkazib yuborildi (SMS bormaydi).`);
      }
      if (result.failedCount > 0) {
        toast.warning(`⚠️ ${result.failedCount} ta xabar telefon raqami noto‘g‘ri bo‘lgani uchun yuborilmadi.`);
      }

      setIsSmsModalOpen(false);
      setSmsRecipientsList([]);
    } catch (err) {
      console.error('handleSendDebtorSms error:', err);
      toast.error(err.message || 'SMS yuborishda xatolik yuz berdi');
    } finally {
      setIsSendingSms(false);
      setSmsProgress({ current: 0, total: 0, studentName: '' });
    }
  };

  const livePreviewSample = useMemo(() => {
    if (!smsRecipientsList || smsRecipientsList.length === 0) return '';
    const sample = smsRecipientsList[0];
    const recipientSalutation =
      smsRecipientType === 'student'
        ? sample.studentName || 'Hurmatli talaba'
        : sample.fatherPhone || sample.motherPhone
        ? 'Hurmatli ota-ona'
        : sample.studentName || 'Hurmatli talaba';

    return formatDebtorSmsMessage(smsTemplateText, {
      student_name: sample.studentName,
      parent_name: recipientSalutation,
      course_name: sample.courseName,
      group_name: sample.groupName,
      teacher_name: sample.teacherName || 'Fan ustozi',
      amount: formatCurrency(sample.balance),
    });
  }, [smsRecipientsList, smsTemplateText, smsRecipientType]);


  // Selection & Delete Handlers for Payment History
  const handleSelectPayment = (id) => {
    setSelectedPayments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllPayments = () => {
    if (selectedPayments.size === filteredHistory.length && filteredHistory.length > 0) {
      setSelectedPayments(new Set());
    } else {
      setSelectedPayments(new Set(filteredHistory.map((p) => p.id)));
    }
  };

  const handleOpenDeleteSingle = (payment) => {
    setPaymentToDelete(payment);
    setDeleteMode('single');
    setShowDeleteConfirm(true);
  };

  const handleOpenDeleteSelected = () => {
    if (selectedPayments.size === 0) return;
    setDeleteMode('selected');
    setShowDeleteConfirm(true);
  };

  const handleOpenDeleteAll = () => {
    if (paymentHistory.length === 0) return;
    setDeleteMode('all');
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (isDeleting) return;
    try {
      setIsDeleting(true);
      if (deleteMode === 'single' && paymentToDelete) {
        await deletePayment(paymentToDelete.id);
        toast.success(t('tuition.paymentDeleted', 'To‘lov muvaffaqiyatli o‘chirildi!'));
      } else if (deleteMode === 'selected') {
        const ids = Array.from(selectedPayments);
        await deleteSelectedPayments(ids);
        toast.success(t('tuition.selectedPaymentsDeleted', `${ids.length} ta to‘lov muvaffaqiyatli o‘chirildi!`));
      } else if (deleteMode === 'all') {
        await deleteAllPayments();
        toast.success(t('tuition.allPaymentsDeleted', 'Barcha to‘lovlar tarixi to‘liq tozalandi!'));
      }
      setSelectedPayments(new Set());
      setShowDeleteConfirm(false);
      setPaymentToDelete(null);
      setDeleteMode(null);
      await loadData();
    } catch (err) {
      console.error('Delete payment error:', err);
      toast.error(err.message || 'To‘lovni o‘chirishda xatolik yuz berdi');
    } finally {
      setIsDeleting(false);
    }
  };

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
    <div className="space-y-6 animate-fade-in pb-24 sm:pb-12">
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

        <div className="flex items-center gap-2.5 flex-wrap">
          {canDeletePayments && !isStudent && (
            <Button
              variant="outline"
              icon={CheckCircle2}
              onClick={() => setShowAllPaidConfirm(true)}
              className="border-emerald-400 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 font-semibold text-xs sm:text-sm w-full sm:w-auto"
              title="Dekabr oyiga toza hisob bilan o‘tish uchun barcha talabalar qoldiq qarzini to‘langan deb belgilash"
            >
              <span className="hidden sm:inline">✅ Barchasini to‘langan qilish (Noyabrgacha yopish)</span>
              <span className="sm:hidden">✅ Barchasini yopish</span>
            </Button>
          )}

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

        {activeTab === 'history' && canDeletePayments && (
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
            {selectedPayments.size > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 rounded-xl">
                <span className="text-xs font-semibold text-red-700 dark:text-red-400">
                  {selectedPayments.size} ta tanlandi
                </span>
                <Button
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  onClick={handleOpenDeleteSelected}
                  className="!py-1 !px-2.5 text-xs bg-red-600 hover:bg-red-700 text-white"
                >
                  Tanlanganlarni o‘chirish
                </Button>
                <button
                  type="button"
                  onClick={() => setSelectedPayments(new Set())}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 underline ml-1 cursor-pointer"
                >
                  Bekor qilish
                </button>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              icon={Trash2}
              onClick={handleOpenDeleteAll}
              disabled={paymentHistory.length === 0}
              className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-950/30"
              title="To‘lovlar tarixining barchasini tozalash"
            >
              Tarixni tozalash
            </Button>
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
                  {!isStudent && (
                    <th className="px-4 py-3.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          eligibleDebtors.length > 0 &&
                          selectedDebtors.size === eligibleDebtors.length
                        }
                        onChange={handleToggleSelectAllDebtors}
                        className="w-4 h-4 rounded text-blue-600 dark:text-emerald-500 focus:ring-blue-500 dark:focus:ring-emerald-400 border-gray-300 dark:border-gray-700 cursor-pointer"
                        title={
                          eligibleDebtors.length === 0
                            ? "Qarzdor talabalar yo‘q"
                            : selectedDebtors.size === eligibleDebtors.length
                            ? "Tanlovni bekor qilish"
                            : "Barcha qarzdorlarni tanlash"
                        }
                        disabled={eligibleDebtors.length === 0}
                      />
                    </th>
                  )}
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
                    <td colSpan={isStudent ? 9 : 11} className="py-12 text-center text-gray-500">
                      <LoadingSpinner size="md" />
                      <p className="mt-2 text-xs">Loading tuition statements...</p>
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={isStudent ? 9 : 11} className="py-10">
                      <EmptyState
                        icon={CreditCard}
                        title="No tuition records found"
                        description="There are currently no student records matching the filter criteria."
                      />
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((st) => {
                    const isDebtor = Number(st.balance || 0) > 0;
                    const isSelected = selectedDebtors.has(st.studentId);
                    const parentPhone = st.fatherPhone || st.motherPhone;

                    return (
                      <tr
                        key={st.id}
                        className={`hover:bg-gray-50/70 dark:hover:bg-surface-dark-tertiary/60 transition-colors ${
                          isSelected ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                        }`}
                      >
                        {!isStudent && (
                          <td className="px-4 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectDebtor(st.studentId, st.balance)}
                              disabled={!isDebtor}
                              className={`w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-700 ${
                                !isDebtor ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                              }`}
                              title={
                                !isDebtor
                                  ? "Ushbu talabaning qarzdorligi yo‘q (to‘langan talabaga SMS bormaydi)"
                                  : "Ushbu qarzdor talabani tanlash"
                              }
                            />
                          </td>
                        )}

                        <td className="px-5 py-4">
                          <div className="font-semibold text-gray-900 dark:text-gray-100">{st.studentName}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 font-mono flex items-center gap-1 mt-0.5">
                            <span>📞 {st.studentPhone || st.studentEmail || '-'}</span>
                          </div>
                          {parentPhone && (
                            <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 mt-0.5">
                              <span>👨‍👩‍👦 Ota-onasi: {parentPhone}</span>
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-medium text-gray-900 dark:text-gray-100 text-xs">{st.courseName}</div>
                          <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{st.groupName}</div>
                          {st.teacherName && (
                            <div className="text-[11px] text-purple-700 dark:text-purple-300 font-semibold flex items-center gap-1 mt-1 bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-400/20 w-fit">
                              <span>👨‍🏫 Ustoz: {st.teacherName}</span>
                            </div>
                          )}
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
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {/* 1-Click To'landi Button */}
                              {isDebtor ? (
                                <Button
                                  variant="success"
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs !py-1 !px-2.5 shadow-xs flex items-center gap-1"
                                  title="Qoldiq qarzni to‘liq to‘langan deb qabul qilish (1-bosishda)"
                                  onClick={() => handleQuickPay(st)}
                                  disabled={actionLoading}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>To‘landi</span>
                                </Button>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-md border border-emerald-500/20" title="To‘lov to‘liq yopilgan">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>To‘langan</span>
                                </span>
                              )}

                              {/* Debtor SMS Button */}
                              {isDebtor && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-xs !py-1 !px-2 flex items-center gap-1"
                                  title="Ushbu talabaga / ota-onasiga qarzdorlik SMS yuborish"
                                  onClick={() => handleOpenSmsModal([st])}
                                >
                                  <Send className="w-3 h-3" />
                                  <span>SMS</span>
                                </Button>
                              )}

                              {/* Discount Button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="!p-1.5 h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                title="Chegirmani sozlash"
                                onClick={() => handleOpenDiscountModal(st)}
                              >
                                <Percent className="w-4 h-4" />
                              </Button>

                              {/* Custom Payment Modal Button */}
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs !py-1 !px-2"
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
                    );
                  })
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
              filteredStudents.map((st) => {
                const isDebtor = Number(st.balance || 0) > 0;
                const isSelected = selectedDebtors.has(st.studentId);
                const parentPhone = st.fatherPhone || st.motherPhone;

                return (
                  <div
                    key={st.id}
                    className={`p-4 rounded-2xl bg-white dark:bg-surface-dark-secondary border border-gray-200 dark:border-gray-800 shadow-xs space-y-3 ${
                      isSelected ? 'ring-2 ring-blue-500 bg-blue-50/20' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        {!isStudent && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectDebtor(st.studentId, st.balance)}
                            disabled={!isDebtor}
                            className={`w-4 h-4 rounded text-blue-600 mt-0.5 ${
                              !isDebtor ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                            }`}
                          />
                        )}
                        <div>
                          <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">{st.studentName}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">📞 {st.studentPhone || st.studentEmail}</p>
                          {parentPhone && (
                            <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">👨‍👩‍👦 Ota-onasi: {parentPhone}</p>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(st.status)}
                    </div>

                    <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-surface-dark-tertiary flex flex-col gap-1 text-xs">
                      <div className="flex items-center justify-between">
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
                      {st.teacherName && (
                        <div className="text-[11px] text-purple-700 dark:text-purple-300 font-semibold">
                          👨‍🏫 Ustoz: {st.teacherName}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-1 sm:gap-2 text-center text-xs border-t border-b border-gray-100 dark:border-gray-800/80 py-2">
                      <div className="min-w-0">
                        <span className="text-[10px] text-gray-400 block uppercase truncate">To‘lanishi kerak</span>
                        <span className="font-bold text-gray-900 dark:text-gray-100 text-[11px] sm:text-xs truncate block">{formatCurrency(st.amountDue)}</span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-gray-400 block uppercase truncate">To‘langan</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px] sm:text-xs truncate block">{formatCurrency(st.amountPaid)}</span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-gray-400 block uppercase truncate">Qoldiq qarz</span>
                        <span className="font-bold text-brand-red dark:text-red-400 text-[11px] sm:text-xs truncate block">{formatCurrency(st.balance)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                      <span className="text-[11px] text-gray-400">
                        So‘nggi to‘lov: {st.lastPaymentDate ? formatDate(st.lastPaymentDate) : '-'}
                      </span>
                      {!isStudent && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isDebtor ? (
                            <Button
                              variant="success"
                              size="sm"
                              icon={CheckCircle2}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-1.5 px-2.5 rounded-xl cursor-pointer"
                              onClick={() => handleQuickPay(st)}
                              disabled={actionLoading}
                            >
                              To‘landi
                            </Button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-xl border border-emerald-500/20">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>To‘langan</span>
                            </span>
                          )}

                          {isDebtor && (
                            <Button
                              variant="outline"
                              size="sm"
                              icon={Send}
                              className="text-blue-600 border-blue-200 text-xs py-1.5 px-2.5 rounded-xl cursor-pointer"
                              onClick={() => handleOpenSmsModal([st])}
                            >
                              SMS
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Percent}
                            className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl"
                            title="Chegirmani sozlash"
                            onClick={() => handleOpenDiscountModal(st)}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs py-1.5 px-3 rounded-xl font-semibold cursor-pointer"
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
                );
              })
            )}
          </div>
        </Card>
      )}

      {/* Sticky Floating Action Bar for Selected Debtors */}
      {selectedDebtors.size > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-4xl bg-white dark:bg-surface-dark-secondary rounded-2xl shadow-2xl border border-blue-500/40 p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-slide-up backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
              {selectedDebtors.size}
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {selectedDebtors.size} ta qarzdor talaba tanlandi
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Tanlanganlar jami qarzdorligi: <span className="font-bold text-red-600 dark:text-red-400">{formatCurrency(totalSelectedDebt)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            <Button
              variant="primary"
              size="sm"
              icon={Send}
              onClick={() => {
                const list = filteredStudents.filter((s) => selectedDebtors.has(s.studentId));
                handleOpenSmsModal(list);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 px-3 shadow-md flex items-center gap-1.5"
            >
              📲 Tanlanganlarga SMS yuborish ({selectedDebtors.size} ta)
            </Button>

            <Button
              variant="success"
              size="sm"
              icon={CheckCircle2}
              onClick={handleBatchPaySelected}
              disabled={actionLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2 px-3 shadow-md flex items-center gap-1.5"
            >
              ✅ Tanlanganlarni to‘langan qilish ({selectedDebtors.size} ta)
            </Button>

            <button
              type="button"
              onClick={() => setSelectedDebtors(new Set())}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 underline px-2 cursor-pointer font-medium"
            >
              Bekor qilish
            </button>
          </div>
        </div>
      )}

      {/* HISTORY TABLE */}
      {activeTab === 'history' && (
        <Card noPadding>
          {/* Desktop History Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-sm">
              <thead className="bg-gray-50 dark:bg-surface-dark-tertiary text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  {canDeletePayments && (
                    <th className="px-4 py-3.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          filteredHistory.length > 0 &&
                          selectedPayments.size === filteredHistory.length
                        }
                        onChange={handleSelectAllPayments}
                        className="w-4 h-4 rounded text-blue-600 dark:text-emerald-500 focus:ring-blue-500 dark:focus:ring-emerald-400 border-gray-300 dark:border-gray-700 cursor-pointer"
                        title="Barchasini tanlash"
                      />
                    </th>
                  )}
                  <th className="px-6 py-3.5">{t('users.student', 'Student')}</th>
                  <th className="px-6 py-3.5">{t('tuition.amount', 'Amount')}</th>
                  <th className="px-6 py-3.5">{t('tuition.paymentMethod', 'Method')}</th>
                  <th className="px-6 py-3.5">{t('tuition.reference', 'Reference ID')}</th>
                  <th className="px-6 py-3.5">{t('common.date', 'Date')}</th>
                  <th className="px-6 py-3.5">{t('common.status', 'Status')}</th>
                  <th className="px-6 py-3.5">{t('common.notes', 'Notes')}</th>
                  {canDeletePayments && (
                    <th className="px-6 py-3.5 text-right rtl:text-left">{t('common.actions', 'Amallar')}</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-surface-dark-secondary">
                {loading ? (
                  <tr>
                    <td colSpan={canDeletePayments ? 9 : 7} className="py-12 text-center text-gray-500">
                      <LoadingSpinner size="md" />
                      <p className="mt-2 text-xs">{t('common.loading', 'Loading payment transactions...')}</p>
                    </td>
                  </tr>
                ) : filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={canDeletePayments ? 9 : 7} className="py-10">
                      <EmptyState
                        icon={Receipt}
                        title={t('tuition.noPayments', 'No payment history')}
                        description="Payments logged will appear here with timestamps and receipts."
                      />
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((h) => (
                    <tr
                      key={h.id}
                      className={`hover:bg-gray-50/50 dark:hover:bg-surface-dark-tertiary/50 transition-colors ${
                        selectedPayments.has(h.id) ? 'bg-red-50/30 dark:bg-red-950/20' : ''
                      }`}
                    >
                      {canDeletePayments && (
                        <td className="px-4 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedPayments.has(h.id)}
                            onChange={() => handleSelectPayment(h.id)}
                            className="w-4 h-4 rounded text-blue-600 dark:text-emerald-500 focus:ring-blue-500 dark:focus:ring-emerald-400 border-gray-300 dark:border-gray-700 cursor-pointer"
                          />
                        </td>
                      )}
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
                      {canDeletePayments && (
                        <td className="px-6 py-4 text-right rtl:text-left">
                          <button
                            type="button"
                            onClick={() => handleOpenDeleteSingle(h)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                            title="To‘lovni o‘chirish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
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
                  className={`p-4 rounded-2xl bg-white dark:bg-surface-dark-secondary border border-gray-200 dark:border-gray-800 shadow-xs space-y-2.5 text-xs transition-colors ${
                    selectedPayments.has(h.id) ? 'ring-2 ring-red-500/50 bg-red-50/20' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      {canDeletePayments && (
                        <input
                          type="checkbox"
                          checked={selectedPayments.has(h.id)}
                          onChange={() => handleSelectPayment(h.id)}
                          className="mt-0.5 w-4 h-4 rounded text-blue-600 dark:text-emerald-500 focus:ring-blue-500 dark:focus:ring-emerald-400 border-gray-300 dark:border-gray-700 cursor-pointer"
                        />
                      )}
                      <div>
                        <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">{h.studentName}</h4>
                        <p className="text-[11px] text-gray-400">{h.studentEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="success">{t('tuition.cleared', 'Cleared')}</Badge>
                      {canDeletePayments && (
                        <button
                          type="button"
                          onClick={() => handleOpenDeleteSingle(h)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors"
                          title="To‘lovni o‘chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => {
          if (!isDeleting) {
            setShowDeleteConfirm(false);
            setPaymentToDelete(null);
            setDeleteMode(null);
          }
        }}
        title={
          deleteMode === 'all'
            ? "Barcha to‘lovlar tarixini tozalash"
            : deleteMode === 'selected'
            ? "Tanlangan to‘lovlarni o‘chirish"
            : "To‘lovni o‘chirish"
        }
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-300">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
            <div className="text-xs space-y-1">
              <p className="font-bold">
                {deleteMode === 'all'
                  ? "Diqqat! Barcha to‘lovlar tarixi to‘liq o‘chiriladi!"
                  : deleteMode === 'selected'
                  ? `Tanlangan ${selectedPayments.size} ta to‘lov o‘chiriladi!`
                  : "Ushbu to‘lov yozuvi o‘chiriladi!"}
              </p>
              <p className="text-red-700/80 dark:text-red-400/80">
                {deleteMode === 'all'
                  ? "Barcha talabalarning to‘lov tarixi o‘chirilgach, talabalar qoldiq qarzdorligi (balansi / dummi) avtomatik ravishda qayta hisoblanadi."
                  : "Ushbu amalni ortga qaytarib bo‘lmaydi. To‘lov summasi talabaning umumiy balansidan chiqarib tashlanadi va qoldiq qarz qayta hisoblanadi."}
              </p>
            </div>
          </div>

          {deleteMode === 'single' && paymentToDelete && (
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-surface-dark-tertiary border border-gray-200 dark:border-gray-800 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500">Talaba:</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">{paymentToDelete.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Summa:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(paymentToDelete.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Usul / Kvitansiya:</span>
                <span className="text-gray-700 dark:text-gray-300">{paymentToDelete.paymentMethod} ({paymentToDelete.referenceNumber || '-'})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Sana:</span>
                <span className="text-gray-700 dark:text-gray-300">{formatDate(paymentToDelete.paymentDate)}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
            <Button
              variant="ghost"
              onClick={() => {
                setShowDeleteConfirm(false);
                setPaymentToDelete(null);
                setDeleteMode(null);
              }}
              disabled={isDeleting}
            >
              Bekor qilish
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              isLoading={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? "O‘chirilmoqda..." : "Ha, o‘chirilsin"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* DEBTOR SMS DISPATCH MODAL WITH LIVE PREVIEW */}
      <Modal
        isOpen={isSmsModalOpen}
        onClose={() => {
          if (!isSendingSms) {
            setIsSmsModalOpen(false);
            setSmsRecipientsList([]);
          }
        }}
        title="📲 Qarzdor talabalarga SMS xabarnoma yuborish"
        size="lg"
      >
        <div className="space-y-4">
          {/* Header Summary */}
          <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                {smsRecipientsList.length}
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {smsRecipientsList.length} ta qarzdor talaba tanlangan
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Jami qarzdorlik summasi: <span className="font-bold text-red-600 dark:text-red-400">{formatCurrency(smsRecipientsList.reduce((acc, curr) => acc + Number(curr.balance || 0), 0))}</span>
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
              Antispam himoyasi faol
            </span>
          </div>

          {/* Recipient Target Radio */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Xabar qaysi raqamga yuborilsin?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label
                className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-colors ${
                  smsRecipientType === 'parent_preferred'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 font-semibold'
                    : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-surface-dark-tertiary'
                }`}
              >
                <input
                  type="radio"
                  name="recipientType"
                  value="parent_preferred"
                  checked={smsRecipientType === 'parent_preferred'}
                  onChange={() => setSmsRecipientType('parent_preferred')}
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <div className="font-bold">👨‍👩‍👦 Ota-onasi telefoniga (Tavsiya etiladi)</div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 font-normal">
                    Ota yoki ona raqami, bo‘lmasa talabaning o‘ziga boradi
                  </div>
                </div>
              </label>

              <label
                className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-colors ${
                  smsRecipientType === 'student'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 font-semibold'
                    : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-surface-dark-tertiary'
                }`}
              >
                <input
                  type="radio"
                  name="recipientType"
                  value="student"
                  checked={smsRecipientType === 'student'}
                  onChange={() => setSmsRecipientType('student')}
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <div className="font-bold">📱 Talabaning o‘ziga</div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 font-normal">
                    Faqat talabaning shaxsiy login raqamiga boradi
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Selected Students List Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-600 dark:text-gray-400">
              <span>Tanlangan qabul qiluvchilar ro‘yxati:</span>
              <span>{smsRecipientsList.length} ta</span>
            </div>
            <div className="max-h-36 overflow-y-auto border border-gray-200 dark:border-gray-800 rounded-xl divide-y divide-gray-100 dark:divide-gray-800 bg-gray-50/40 dark:bg-surface-dark-tertiary/40 p-1 text-xs">
              {smsRecipientsList.map((st) => {
                const targetPhone =
                  smsRecipientType === 'student'
                    ? st.studentPhone
                    : st.fatherPhone || st.motherPhone || st.studentPhone;
                return (
                  <div key={st.studentId} className="p-2 flex items-center justify-between gap-2">
                    <div className="truncate">
                      <span className="font-bold text-gray-900 dark:text-gray-100">{st.studentName}</span>
                      <span className="text-gray-500 ml-1.5">• {st.courseName} ({st.groupName})</span>
                      {st.teacherName && (
                        <span className="text-purple-600 dark:text-purple-400 font-medium ml-1.5">• Ustoz: {st.teacherName}</span>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="font-bold text-red-600 dark:text-red-400">{formatCurrency(st.balance)}</span>
                      <span className="text-[11px] text-gray-500 dark:text-gray-400 block font-mono">{targetPhone || 'Raqamsiz'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SMS Template Editor */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                SMS Xabar matni:
              </label>
              <button
                type="button"
                onClick={() => setSmsTemplateText(DEFAULT_DEBTOR_TEMPLATE)}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 underline font-medium cursor-pointer"
              >
                🔄 Standart muloyim matnga qaytarish
              </button>
            </div>
            <textarea
              rows={5}
              value={smsTemplateText}
              onChange={(e) => setSmsTemplateText(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
              placeholder="SMS matnini kiriting..."
            />
            {/* Template Variables Helper Chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px] text-gray-500">
              <span className="font-semibold">O‘zgaruvchilar:</span>
              {['{student_name}', '{course_name}', '{group_name}', '{teacher_name}', '{amount}'].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setSmsTemplateText((prev) => `${prev} ${v}`)}
                  className="px-2 py-0.5 rounded bg-gray-100 dark:bg-surface-dark-tertiary hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-mono text-[10px] cursor-pointer"
                  title="Matnga qo‘shish"
                >
                  +{v}
                </button>
              ))}
            </div>
          </div>

          {/* LIVE PREVIEW BOX */}
          <div className="space-y-1.5">
            <div className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Namuna: 1-talabaga ketadigan jonli SMS ko‘rinishi</span>
            </div>
            <div className="p-3.5 rounded-xl bg-gray-900 text-emerald-400 font-mono text-xs whitespace-pre-wrap leading-relaxed shadow-inner border border-gray-800">
              {livePreviewSample}
            </div>
          </div>

          {/* Sending Progress Bar */}
          {isSendingSms && (
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs space-y-2">
              <div className="flex items-center justify-between font-bold text-blue-900 dark:text-blue-100">
                <span>SMS yuborilmoqda...</span>
                <span>{smsProgress.current} / {smsProgress.total}</span>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-900 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-2 transition-all duration-300"
                  style={{
                    width: `${smsProgress.total > 0 ? (smsProgress.current / smsProgress.total) * 100 : 0}%`,
                  }}
                />
              </div>
              {smsProgress.studentName && (
                <div className="text-[11px] text-blue-700 dark:text-blue-300">
                  Navbatdagi talaba: <span className="font-semibold">{smsProgress.studentName}</span>
                </div>
              )}
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-800">
            <Button
              variant="ghost"
              onClick={() => {
                setIsSmsModalOpen(false);
                setSmsRecipientsList([]);
              }}
              disabled={isSendingSms}
            >
              Bekor qilish
            </Button>
            <Button
              variant="primary"
              icon={Send}
              onClick={handleSendDebtorSms}
              disabled={isSendingSms || smsRecipientsList.length === 0}
              isLoading={isSendingSms}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 px-4 shadow-md"
            >
              {isSendingSms ? "Yuborilmoqda..." : `📲 SMS Yuborish (${smsRecipientsList.length} ta)`}
            </Button>
          </div>
        </div>
      </Modal>

      {/* CONFIRMATION MODAL: MARK ALL AS PAID (DECEMBER FRESH START) */}
      <Modal
        isOpen={showAllPaidConfirm}
        onClose={() => {
          if (!isMarkingAllPaid) setShowAllPaidConfirm(false);
        }}
        title="Barcha talabalarni to‘langan deb belgilash (Noyabrgacha yopish)"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Dekabr oyidan toza hisob bilan boshlash</span>
            </div>
            <p className="text-xs leading-relaxed text-emerald-800 dark:text-emerald-200">
              Ushbu amal barcha 143 ta talabaning mavjud barcha eski/dummi qarzdorliklarini <strong>«Dekabr oyigacha qarzdorliklar to‘liq yopildi»</strong> deb kvitansiya bilan rasmiylashtiradi.
            </p>
            <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-100">
              Natijada barcha qoldiq qarzlar 0 so‘m bo‘ladi, tizim to‘liq yashil holatga o‘tadi va Dekabr oyidan boshlab real hisob-kitoblar boshlanadi.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-800">
            <Button
              variant="ghost"
              onClick={() => setShowAllPaidConfirm(false)}
              disabled={isMarkingAllPaid}
            >
              Bekor qilish
            </Button>
            <Button
              variant="success"
              icon={CheckCircle2}
              onClick={handleConfirmMarkAllPaid}
              disabled={isMarkingAllPaid}
              isLoading={isMarkingAllPaid}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2 px-4 shadow-md"
            >
              {isMarkingAllPaid ? "To‘lovlar qayd etilmoqda..." : "Ha, barchasini to‘langan deb belgilash"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
