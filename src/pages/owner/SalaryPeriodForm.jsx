import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '@/components/ui';

const salaryPeriodSchema = z
  .object({
    name: z.string().min(2, 'Period name must be at least 2 characters'),
    start_date: z.string().min(1, 'Start date is required'),
    end_date: z.string().min(1, 'End date is required'),
    payment_date: z.string().min(1, 'Payment date is required'),
  })
  .refine(
    (data) => new Date(data.end_date) >= new Date(data.start_date),
    {
      message: 'End date cannot be earlier than start date',
      path: ['end_date'],
    }
  )
  .refine(
    (data) => new Date(data.payment_date) >= new Date(data.start_date),
    {
      message: 'Payment date cannot be earlier than start date',
      path: ['payment_date'],
    }
  );

export default function SalaryPeriodForm({ onSubmit, onCancel, isLoading }) {
  const { t } = useTranslation();

  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .split('T')[0];
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    .toISOString()
    .split('T')[0];
  const defaultPayDate = new Date(today.getFullYear(), today.getMonth() + 1, 5)
    .toISOString()
    .split('T')[0];

  const monthName = today.toLocaleString('default', { month: 'long', year: 'numeric' });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(salaryPeriodSchema),
    defaultValues: {
      name: `${monthName} Payroll`,
      start_date: firstDayOfMonth,
      end_date: lastDayOfMonth,
      payment_date: defaultPayDate,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Input
          label={t('payroll.periodName')}
          placeholder="e.g. October 2026 Payroll"
          required
          error={errors.name?.message}
          {...register('name')}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Input
            type="date"
            label={t('payroll.startDate')}
            required
            error={errors.start_date?.message}
            {...register('start_date')}
          />
        </div>

        <div>
          <Input
            type="date"
            label={t('payroll.endDate')}
            required
            error={errors.end_date?.message}
            {...register('end_date')}
          />
        </div>
      </div>

      <div>
        <Input
          type="date"
          label={t('payroll.scheduledPaymentDate')}
          required
          error={errors.payment_date?.message}
          {...register('payment_date')}
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
          {t('payroll.createPeriod')}
        </Button>
      </div>
    </form>
  );
}
