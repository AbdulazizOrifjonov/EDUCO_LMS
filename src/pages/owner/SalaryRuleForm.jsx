import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { Button, Input, Select } from '@/components/ui';

const salaryRuleSchema = z.object({
  staff_id: z.string().min(1, 'Please select a staff member'),
  method: z.enum(['fixed_monthly', 'hourly', 'per_lesson'], {
    required_error: 'Please select a salary method',
  }),
  rate: z
    .number({ invalid_type_error: 'Rate must be a number' })
    .positive('Rate must be greater than 0'),
  effective_date: z.string().min(1, 'Effective date is required'),
});

export default function SalaryRuleForm({ initialData, onSubmit, onCancel, isLoading }) {
  const { t } = useTranslation();
  const [staffList, setStaffList] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(salaryRuleSchema),
    defaultValues: {
      staff_id: initialData?.staffId || initialData?.staff_id || '',
      method: initialData?.method || 'fixed_monthly',
      rate: initialData?.rate ? Number(initialData.rate) : 3000000,
      effective_date:
        initialData?.effectiveDate ||
        initialData?.effective_date ||
        new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    async function fetchStaff() {
      try {
        setLoadingStaff(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, role')
          .in('role', ['teacher', 'admin'])
          .order('full_name');

        if (!error && data) {
          setStaffList(data);
        }
      } catch (err) {
        console.error('Error fetching staff list:', err);
      } finally {
        setLoadingStaff(false);
      }
    }
    fetchStaff();
  }, []);

  const selectedMethod = watch('method');

  const methodOptions = [
    { value: 'fixed_monthly', label: `${t('payroll.fixedMonthly')} (UZS)` },
    { value: 'hourly', label: `${t('payroll.hourly')} (UZS)` },
    { value: 'per_lesson', label: `${t('payroll.perLesson')} (UZS)` },
  ];

  const staffOptions = staffList.map((s) => ({
    value: s.id,
    label: `${s.full_name || t('payroll.staffMember')} (${t('roles.' + s.role, { defaultValue: s.role })}) - ${s.email}`,
  }));

  const handleFormSubmit = (values) => {
    onSubmit({
      ...values,
      rate: Number(values.rate),
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 block mb-1.5">
          {t('payroll.staffMember')} <span className="text-brand-red">*</span>
        </label>
        <select
          {...register('staff_id')}
          disabled={loadingStaff || Boolean(initialData?.staffId)}
          className={`
            w-full rounded-lg border bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 text-sm
            px-3.5 py-2 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1
            dark:focus:ring-offset-surface-dark
            ${
              errors.staff_id
                ? 'border-brand-red focus:border-brand-red focus:ring-brand-red'
                : 'border-gray-300 dark:border-gray-600 focus:border-brand-navy focus:ring-brand-navy'
            }
          `}
        >
          <option value="" disabled>
            {loadingStaff ? t('payroll.loadingStaff') : t('payroll.selectStaff')}
          </option>
          {staffOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {errors.staff_id && (
          <p className="text-xs text-brand-red mt-1">{errors.staff_id.message}</p>
        )}
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 block mb-1.5">
          {t('payroll.method')} <span className="text-brand-red">*</span>
        </label>
        <select
          {...register('method')}
          className={`
            w-full rounded-lg border bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 text-sm
            px-3.5 py-2 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1
            dark:focus:ring-offset-surface-dark
            ${
              errors.method
                ? 'border-brand-red focus:border-brand-red focus:ring-brand-red'
                : 'border-gray-300 dark:border-gray-600 focus:border-brand-navy focus:ring-brand-navy'
            }
          `}
        >
          {methodOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {errors.method && (
          <p className="text-xs text-brand-red mt-1">{errors.method.message}</p>
        )}
      </div>

      <div>
        <Input
          type="number"
          label={
            selectedMethod === 'hourly'
              ? t('payroll.hourlyRate')
              : selectedMethod === 'per_lesson'
              ? t('payroll.perLessonRate')
              : t('payroll.monthlyBaseRate')
          }
          placeholder="e.g. 3500000"
          required
          error={errors.rate?.message}
          {...register('rate', { valueAsNumber: true })}
        />
      </div>

      <div>
        <Input
          type="date"
          label={t('payroll.effectiveDate')}
          required
          error={errors.effective_date?.message}
          {...register('effective_date')}
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            {t('common.cancel')}
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
        >
          {initialData ? t('payroll.updateRule') : t('payroll.saveRule')}
        </Button>
      </div>
    </form>
  );
}
