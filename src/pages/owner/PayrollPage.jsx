import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DollarSign,
  Calendar,
  Users,
  CreditCard,
  Plus,
  Download,
  CheckCircle,
  Clock,
  Lock,
  Edit2,
  FileSpreadsheet,
  AlertCircle,
  Filter,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import { Button, Card, Table, Badge, Modal, Select, EmptyState, LoadingSpinner } from '@/components/ui';
import SalaryRuleForm from './SalaryRuleForm';
import SalaryPeriodForm from './SalaryPeriodForm';
import {
  getSalaryRules,
  createSalaryRule,
  updateSalaryRule,
  getSalaryPeriods,
  createSalaryPeriod,
  closeSalaryPeriod,
  calculateSalary,
  getPayments,
  markAsPaid,
  exportPayrollCSV,
} from '@/services/payrollService';
import { formatCurrency, formatDate } from '@/utils/csvExport';

export default function PayrollPage() {
  const { t } = useTranslation();
  const { profile, user } = useAuth();

  // Role verification - OWNER ONLY
  const isOwner = profile?.role === 'owner';

  // Active Tab
  const [activeTab, setActiveTab] = useState('rules'); // 'rules' | 'periods' | 'calculations' | 'payments'

  // State
  const [rules, setRules] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [calculations, setCalculations] = useState([]);
  const [payments, setPayments] = useState([]);

  // Loaders
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [calcLoading, setCalcLoading] = useState(false);

  // Modals
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [periodModalOpen, setPeriodModalOpen] = useState(false);

  // Initial load
  useEffect(() => {
    if (!isOwner) return;

    loadInitialData();
  }, [isOwner]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [fetchedRules, fetchedPeriods] = await Promise.all([
        getSalaryRules(),
        getSalaryPeriods(),
      ]);

      setRules(fetchedRules);
      setPeriods(fetchedPeriods);

      if (fetchedPeriods.length > 0) {
        setSelectedPeriodId(fetchedPeriods[0].id);
      }
    } catch (err) {
      console.error('Error loading payroll data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load calculations and payments when selectedPeriodId changes
  useEffect(() => {
    if (!selectedPeriodId) return;

    async function loadPeriodData() {
      try {
        setCalcLoading(true);
        const [calcData, payData] = await Promise.all([
          calculateSalary(selectedPeriodId),
          getPayments(selectedPeriodId),
        ]);
        setCalculations(calcData);
        setPayments(payData);
      } catch (err) {
        console.error('Error loading period calculations:', err);
      } finally {
        setCalcLoading(false);
      }
    }

    loadPeriodData();
  }, [selectedPeriodId]);

  // Handle Salary Rule Save
  const handleSaveRule = async (data) => {
    try {
      setActionLoading(true);
      if (editingRule) {
        await updateSalaryRule(editingRule.id, data);
      } else {
        await createSalaryRule(data);
      }
      setRuleModalOpen(false);
      setEditingRule(null);
      const updatedRules = await getSalaryRules();
      setRules(updatedRules);
    } catch (err) {
      console.error('Failed to save salary rule:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Salary Period Save
  const handleSavePeriod = async (data) => {
    try {
      setActionLoading(true);
      const newPeriod = await createSalaryPeriod(data);
      setPeriodModalOpen(false);
      const updatedPeriods = await getSalaryPeriods();
      setPeriods(updatedPeriods);
      if (newPeriod?.id) {
        setSelectedPeriodId(newPeriod.id);
      }
    } catch (err) {
      console.error('Failed to create salary period:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Close Period
  const handleClosePeriod = async (periodId) => {
    if (!window.confirm(t('payroll.closePeriodConfirm'))) {
      return;
    }
    try {
      setActionLoading(true);
      await closeSalaryPeriod(periodId);
      const updated = await getSalaryPeriods();
      setPeriods(updated);
    } catch (err) {
      console.error('Failed to close period:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Mark as Paid
  const handleMarkAsPaid = async (paymentId) => {
    try {
      setActionLoading(true);
      await markAsPaid(paymentId);
      const updatedPayments = await getPayments(selectedPeriodId);
      setPayments(updatedPayments);
    } catch (err) {
      console.error('Failed to mark payment as paid:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle CSV Export
  const handleExportCSV = () => {
    const dataToExport = activeTab === 'payments' ? payments : calculations;
    exportPayrollCSV(dataToExport, `payroll_${selectedPeriodId || 'report'}.csv`);
  };

  if (!isOwner) {
    return (
      <div className="p-8">
        <Card className="text-center p-12">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/40 text-brand-red flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('payroll.accessRestricted')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md mx-auto">
            {t('payroll.ownerOnlyNotice')}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t('payroll.title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {t('payroll.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            icon={Download}
            onClick={handleExportCSV}
            disabled={calculations.length === 0 && payments.length === 0}
          >
            {t('common.export')}
          </Button>

          {activeTab === 'rules' && (
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => {
                setEditingRule(null);
                setRuleModalOpen(true);
              }}
            >
              {t('payroll.addRule')}
            </Button>
          )}

          {activeTab === 'periods' && (
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setPeriodModalOpen(true)}
            >
              {t('payroll.createPeriod')}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <nav className="flex space-x-6 rtl:space-x-reverse" aria-label="Tabs">
          {[
            { id: 'rules', label: t('payroll.salaryRules'), icon: Users, count: rules.length },
            { id: 'periods', label: t('payroll.salaryPeriods'), icon: Calendar, count: periods.length },
            { id: 'calculations', label: t('payroll.calculations'), icon: DollarSign },
            { id: 'payments', label: t('payroll.payments'), icon: CreditCard, count: payments.filter(p => p.status === 'unpaid').length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap
                  ${
                    isActive
                      ? 'border-brand-navy text-brand-navy dark:border-blue-400 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`ml-1.5 py-0.5 px-2 rounded-full text-xs ${
                      isActive
                        ? 'bg-blue-100 text-brand-navy dark:bg-blue-900/50 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-surface-dark-tertiary dark:text-gray-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* TAB 1: SALARY RULES */}
      {activeTab === 'rules' && (
        <Card noPadding>
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t('payroll.staffRulesTitle')}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('payroll.staffRulesSubtitle')}</p>
            </div>
          </div>

          {/* Mobile View for Staff Rules */}
          <div className="block md:hidden divide-y divide-gray-100 dark:divide-gray-800 p-2">
            {loading ? (
              <div className="py-12 text-center text-gray-500">
                <LoadingSpinner size="md" />
                <p className="mt-2 text-xs">{t('payroll.loadingRules')}</p>
              </div>
            ) : rules.length === 0 ? (
              <div className="py-10">
                <EmptyState
                  icon={Users}
                  title={t('payroll.noRulesTitle')}
                  description={t('payroll.noRulesDesc')}
                  actionText={t('payroll.createFirstRule')}
                  onAction={() => {
                    setEditingRule(null);
                    setRuleModalOpen(true);
                  }}
                />
              </div>
            ) : (
              rules.map((rule) => (
                <div key={rule.id} className="p-4 bg-white dark:bg-surface-dark-secondary rounded-xl mb-3 border border-gray-100 dark:border-gray-800 shadow-sm space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{rule.staffName}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{rule.staffEmail}</div>
                    </div>
                    <Badge variant="primary" size="sm">{t('roles.' + rule.staffRole, { defaultValue: rule.staffRole })}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs bg-gray-50 dark:bg-surface-dark-tertiary p-2 rounded-lg">
                    <span className="capitalize text-gray-600 dark:text-gray-400">
                      {rule.method ? rule.method.replace('_', ' ') : t('payroll.fixedMonthly')}
                    </span>
                    <span className="font-bold text-brand-navy dark:text-blue-400 text-sm">
                      {formatCurrency(rule.rate)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{formatDate(rule.effectiveDate)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Edit2}
                      onClick={() => {
                        setEditingRule(rule);
                        setRuleModalOpen(true);
                      }}
                    >
                      {t('common.edit')}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-sm">
              <thead className="bg-gray-50 dark:bg-surface-dark-tertiary text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-3.5">{t('payroll.staffMember')}</th>
                  <th className="px-6 py-3.5">{t('users.role')}</th>
                  <th className="px-6 py-3.5">{t('payroll.method')}</th>
                  <th className="px-6 py-3.5">{t('payroll.rate')}</th>
                  <th className="px-6 py-3.5">{t('payroll.effectiveDate')}</th>
                  <th className="px-6 py-3.5 text-right rtl:text-left">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-surface-dark-secondary">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-gray-500">
                      <LoadingSpinner size="md" />
                      <p className="mt-2 text-xs">{t('payroll.loadingRules')}</p>
                    </td>
                  </tr>
                ) : rules.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-10">
                      <EmptyState
                        icon={Users}
                        title={t('payroll.noRulesTitle')}
                        description={t('payroll.noRulesDesc')}
                        actionText={t('payroll.createFirstRule')}
                        onAction={() => {
                          setEditingRule(null);
                          setRuleModalOpen(true);
                        }}
                      />
                    </td>
                  </tr>
                ) : (
                  rules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-gray-50/50 dark:hover:bg-surface-dark-tertiary/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{rule.staffName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{rule.staffEmail}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="primary" size="sm">{t('roles.' + rule.staffRole, { defaultValue: rule.staffRole })}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className="capitalize font-medium text-gray-800 dark:text-gray-200">
                          {rule.method ? rule.method.replace('_', ' ') : t('payroll.fixedMonthly')}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-brand-navy dark:text-blue-400">
                        {formatCurrency(rule.rate)}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-xs">
                        {formatDate(rule.effectiveDate)}
                      </td>
                      <td className="px-6 py-4 text-right rtl:text-left">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Edit2}
                          onClick={() => {
                            setEditingRule(rule);
                            setRuleModalOpen(true);
                          }}
                        >
                          {t('common.edit')}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 2: SALARY PERIODS */}
      {activeTab === 'periods' && (
        <Card noPadding>
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t('payroll.accountingPeriods')}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('payroll.accountingPeriodsSubtitle')}</p>
            </div>
          </div>

          {/* Mobile View for Periods */}
          <div className="block md:hidden divide-y divide-gray-100 dark:divide-gray-800 p-2">
            {loading ? (
              <div className="py-12 text-center text-gray-500">
                <LoadingSpinner size="md" />
                <p className="mt-2 text-xs">{t('payroll.loadingPeriods')}</p>
              </div>
            ) : periods.length === 0 ? (
              <div className="py-10">
                <EmptyState
                  icon={Calendar}
                  title={t('payroll.noPeriodsTitle')}
                  description={t('payroll.noPeriodsDesc')}
                  actionText={t('payroll.createPeriod')}
                  onAction={() => setPeriodModalOpen(true)}
                />
              </div>
            ) : (
              periods.map((period) => (
                <div key={period.id} className="p-4 bg-white dark:bg-surface-dark-secondary rounded-xl mb-3 border border-gray-100 dark:border-gray-800 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{period.name}</div>
                    <Badge variant={period.status === 'closed' ? 'secondary' : 'success'}>
                      {period.status === 'closed' ? t('payroll.closed') : t('payroll.open')}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-surface-dark-tertiary p-2 rounded-lg">
                    <div>
                      <span className="text-[10px] uppercase text-gray-400 block">{t('payroll.startDate')}</span>
                      <span>{formatDate(period.startDate)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-gray-400 block">{t('payroll.endDate')}</span>
                      <span>{formatDate(period.endDate)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedPeriodId(period.id);
                        setActiveTab('calculations');
                      }}
                    >
                      {t('payroll.viewCalcs')}
                    </Button>
                    {period.status !== 'closed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleClosePeriod(period.id)}
                        isLoading={actionLoading}
                      >
                        {t('payroll.closePeriod')}
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-sm">
              <thead className="bg-gray-50 dark:bg-surface-dark-tertiary text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-3.5">{t('payroll.periodTitle')}</th>
                  <th className="px-6 py-3.5">{t('payroll.startDate')}</th>
                  <th className="px-6 py-3.5">{t('payroll.endDate')}</th>
                  <th className="px-6 py-3.5">{t('payroll.scheduledPayment')}</th>
                  <th className="px-6 py-3.5">{t('common.status')}</th>
                  <th className="px-6 py-3.5 text-right rtl:text-left">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-surface-dark-secondary">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-gray-500">
                      <LoadingSpinner size="md" />
                      <p className="mt-2 text-xs">{t('payroll.loadingPeriods')}</p>
                    </td>
                  </tr>
                ) : periods.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-10">
                      <EmptyState
                        icon={Calendar}
                        title={t('payroll.noPeriodsTitle')}
                        description={t('payroll.noPeriodsDesc')}
                        actionText={t('payroll.createPeriod')}
                        onAction={() => setPeriodModalOpen(true)}
                      />
                    </td>
                  </tr>
                ) : (
                  periods.map((period) => (
                    <tr key={period.id} className="hover:bg-gray-50/50 dark:hover:bg-surface-dark-tertiary/50">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                        {period.name}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {formatDate(period.startDate)}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {formatDate(period.endDate)}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {formatDate(period.paymentDate)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={period.status === 'closed' ? 'secondary' : 'success'}>
                          {period.status === 'closed' ? t('payroll.closed') : t('payroll.open')}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right rtl:text-left space-x-2 rtl:space-x-reverse">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPeriodId(period.id);
                            setActiveTab('calculations');
                          }}
                        >
                          {t('payroll.viewCalcs')}
                        </Button>
                        {period.status !== 'closed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleClosePeriod(period.id)}
                            isLoading={actionLoading}
                          >
                            {t('payroll.closePeriod')}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: CALCULATIONS */}
      {activeTab === 'calculations' && (
        <div className="space-y-4">
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="w-full sm:w-72">
                <Select
                  label={t('payroll.selectPeriod')}
                  options={periods.map((p) => ({
                    value: p.id,
                    label: p.name,
                    badge: p.status === 'closed' ? t('payroll.closed') : t('payroll.open'),
                  }))}
                  value={selectedPeriodId}
                  onChange={(e) => setSelectedPeriodId(e.target.value)}
                  color="blue"
                />
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="primary"
                  onClick={() => setActiveTab('payments')}
                >
                  {t('payroll.proceedToDisbursements')}
                </Button>
              </div>
            </div>
          </Card>

          <Card noPadding>
            {/* Mobile View for Calculations */}
            <div className="block md:hidden divide-y divide-gray-100 dark:divide-gray-800 p-2">
              {calcLoading ? (
                <div className="py-12 text-center text-gray-500">
                  <LoadingSpinner size="md" />
                  <p className="mt-2 text-xs">{t('payroll.computingTotals')}</p>
                </div>
              ) : calculations.length === 0 ? (
                <div className="py-10">
                  <EmptyState
                    icon={DollarSign}
                    title={t('payroll.noCalcsTitle')}
                    description={t('payroll.noCalcsDesc')}
                  />
                </div>
              ) : (
                calculations.map((c) => (
                  <div key={c.staffId} className="p-4 bg-white dark:bg-surface-dark-secondary rounded-xl mb-3 border border-gray-100 dark:border-gray-800 shadow-sm space-y-2.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{c.staffName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{c.staffEmail}</div>
                      </div>
                      <span className="capitalize text-xs font-medium text-gray-700 dark:text-gray-300">
                        {c.method?.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs bg-gray-50 dark:bg-surface-dark-tertiary p-2 rounded-lg text-center">
                      <div>
                        <span className="text-[10px] text-gray-500 block">{t('payroll.baseSalary')}</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">{formatCurrency(c.baseSalary)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-emerald-600 block">{t('payroll.bonus')}</span>
                        <span className="font-medium text-emerald-600">+{formatCurrency(c.bonus)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-brand-red block">{t('payroll.deduction')}</span>
                        <span className="font-medium text-brand-red">-{formatCurrency(c.deductions)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="font-medium text-gray-600 dark:text-gray-400">{t('payroll.netSalary')}:</span>
                      <span className="font-bold text-brand-navy dark:text-blue-400 text-base">{formatCurrency(c.netSalary)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left rtl:text-right text-sm">
                <thead className="bg-gray-50 dark:bg-surface-dark-tertiary text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-6 py-3.5">{t('payroll.staffMember')}</th>
                    <th className="px-6 py-3.5">{t('payroll.method')}</th>
                    <th className="px-6 py-3.5">{t('payroll.baseSalary')}</th>
                    <th className="px-6 py-3.5">{t('payroll.bonus')}</th>
                    <th className="px-6 py-3.5">{t('payroll.deduction')}</th>
                    <th className="px-6 py-3.5 font-bold">{t('payroll.netSalary')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-surface-dark-secondary">
                  {calcLoading ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-gray-500">
                        <LoadingSpinner size="md" />
                        <p className="mt-2 text-xs">{t('payroll.computingTotals')}</p>
                      </td>
                    </tr>
                  ) : calculations.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-10">
                        <EmptyState
                          icon={DollarSign}
                          title={t('payroll.noCalcsTitle')}
                          description={t('payroll.noCalcsDesc')}
                        />
                      </td>
                    </tr>
                  ) : (
                    calculations.map((c) => (
                      <tr key={c.staffId} className="hover:bg-gray-50/50 dark:hover:bg-surface-dark-tertiary/50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 dark:text-gray-100">{c.staffName}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{c.staffEmail}</div>
                        </td>
                        <td className="px-6 py-4 capitalize text-gray-700 dark:text-gray-300">
                          {c.method?.replace('_', ' ')}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-200">
                          {formatCurrency(c.baseSalary)}
                        </td>
                        <td className="px-6 py-4 text-emerald-600 dark:text-emerald-400 font-medium">
                          +{formatCurrency(c.bonus)}
                        </td>
                        <td className="px-6 py-4 text-brand-red dark:text-red-400 font-medium">
                          -{formatCurrency(c.deductions)}
                        </td>
                        <td className="px-6 py-4 font-bold text-brand-navy dark:text-blue-400 text-base">
                          {formatCurrency(c.netSalary)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: PAYMENTS */}
      {activeTab === 'payments' && (
        <Card noPadding>
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t('payroll.disbursementRecords')}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('payroll.disbursementSubtitle')}</p>
            </div>
          </div>

          {/* Mobile View for Payments */}
          <div className="block md:hidden divide-y divide-gray-100 dark:divide-gray-800 p-2">
            {calcLoading ? (
              <div className="py-12 text-center text-gray-500">
                <LoadingSpinner size="md" />
                <p className="mt-2 text-xs">{t('payroll.loadingPeriods')}</p>
              </div>
            ) : payments.length === 0 ? (
              <div className="py-10">
                <EmptyState
                  icon={CreditCard}
                  title={t('payroll.noPayroll')}
                  description={t('tuition.noPayments')}
                />
              </div>
            ) : (
              payments.map((p) => (
                <div key={p.id} className="p-4 bg-white dark:bg-surface-dark-secondary rounded-xl mb-3 border border-gray-100 dark:border-gray-800 shadow-sm space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{p.staffName}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{p.staffEmail}</div>
                    </div>
                    <Badge variant={p.status === 'paid' ? 'success' : 'warning'}>
                      {p.status === 'paid' ? t('payroll.paid') : t('payroll.unpaid')}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs bg-gray-50 dark:bg-surface-dark-tertiary p-2 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-400">{p.paymentMethod || 'Naqd pul'}</span>
                    <span className="font-bold text-gray-900 dark:text-gray-100 text-base">{formatCurrency(p.netSalary)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-gray-500">{p.paidAt ? formatDate(p.paidAt) : '-'}</span>
                    {p.status !== 'paid' ? (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={CheckCircle}
                        onClick={() => handleMarkAsPaid(p.id)}
                        isLoading={actionLoading}
                      >
                        {t('payroll.markPaid')}
                      </Button>
                    ) : (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> {t('payroll.settled')}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-sm">
              <thead className="bg-gray-50 dark:bg-surface-dark-tertiary text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-3.5">{t('payroll.staffMember')}</th>
                  <th className="px-6 py-3.5">{t('payroll.netAmount')}</th>
                  <th className="px-6 py-3.5">{t('common.status')}</th>
                  <th className="px-6 py-3.5">{t('tuition.paymentMethod')}</th>
                  <th className="px-6 py-3.5">{t('payroll.clearanceDate')}</th>
                  <th className="px-6 py-3.5 text-right rtl:text-left">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-surface-dark-secondary">
                {calcLoading ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-gray-500">
                      <LoadingSpinner size="md" />
                      <p className="mt-2 text-xs">{t('payroll.loadingPeriods')}</p>
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-10">
                      <EmptyState
                        icon={CreditCard}
                        title={t('payroll.noPayroll')}
                        description={t('tuition.noPayments')}
                      />
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-surface-dark-tertiary/50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{p.staffName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{p.staffEmail}</div>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-gray-100">
                        {formatCurrency(p.netSalary)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={p.status === 'paid' ? 'success' : 'warning'}>
                          {p.status === 'paid' ? t('payroll.paid') : t('payroll.unpaid')}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-xs">
                        {p.paymentMethod}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-xs">
                        {p.paidAt ? formatDate(p.paidAt) : '-'}
                      </td>
                      <td className="px-6 py-4 text-right rtl:text-left">
                        {p.status !== 'paid' ? (
                          <Button
                            variant="primary"
                            size="sm"
                            icon={CheckCircle}
                            onClick={() => handleMarkAsPaid(p.id)}
                            isLoading={actionLoading}
                          >
                            {t('payroll.markPaid')}
                          </Button>
                        ) : (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> {t('payroll.settled')}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Salary Rule Modal */}
      <Modal
        isOpen={ruleModalOpen}
        onClose={() => setRuleModalOpen(false)}
        title={editingRule ? t('payroll.editSalaryRule') : t('payroll.newSalaryRule')}
        subtitle={t('payroll.ruleModalSubtitle')}
      >
        <SalaryRuleForm
          initialData={editingRule}
          onSubmit={handleSaveRule}
          onCancel={() => setRuleModalOpen(false)}
          isLoading={actionLoading}
        />
      </Modal>

      {/* Salary Period Modal */}
      <Modal
        isOpen={periodModalOpen}
        onClose={() => setPeriodModalOpen(false)}
        title={t('payroll.createSalaryPeriod')}
        subtitle={t('payroll.periodModalSubtitle')}
      >
        <SalaryPeriodForm
          onSubmit={handleSavePeriod}
          onCancel={() => setPeriodModalOpen(false)}
          isLoading={actionLoading}
        />
      </Modal>
    </div>
  );
}
