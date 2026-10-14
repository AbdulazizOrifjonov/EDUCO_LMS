import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { Button, Input } from '@/components/ui';

const paymentSchema = z.object({
  student_id: z.string().min(1, 'Please select a student'),
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be greater than 0'),
  payment_method: z.string().min(1, 'Payment method is required'),
  reference_number: z.string().optional(),
  payment_date: z.string().min(1, 'Payment date is required'),
  notes: z.string().optional(),
});

export default function PaymentForm({ defaultStudentId, onSubmit, onCancel, isLoading }) {
  const { t } = useTranslation();
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      student_id: defaultStudentId || '',
      amount: 1200000,
      payment_method: 'Payme',
      reference_number: '',
      payment_date: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  useEffect(() => {
    async function loadStudents() {
      try {
        setLoadingStudents(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone_number')
          .eq('role', 'student')
          .order('full_name');

        if (!error && data) {
          setStudents(data);
          if (defaultStudentId) {
            setValue('student_id', defaultStudentId);
          }
        }
      } catch (err) {
        console.error('Error fetching students:', err);
      } finally {
        setLoadingStudents(false);
      }
    }

    loadStudents();
  }, [defaultStudentId, setValue]);

  const methodOptions = [
    { value: 'Payme', label: 'Payme' },
    { value: 'Click', label: 'Click' },
    { value: 'Cash', label: 'Cash' },
    { value: 'Bank Transfer', label: 'Bank Transfer' },
    { value: 'Uzum Bank', label: 'Uzum Bank' },
    { value: 'Other', label: 'Other' },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 block mb-1.5">
          {t('users.student', 'Student')} <span className="text-brand-red">*</span>
        </label>
        <select
          {...register('student_id')}
          disabled={loadingStudents || Boolean(defaultStudentId)}
          className={`
            w-full rounded-lg border bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 text-sm
            px-3.5 py-2 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1
            dark:focus:ring-offset-surface-dark
            ${
              errors.student_id
                ? 'border-brand-red focus:border-brand-red focus:ring-brand-red'
                : 'border-gray-300 dark:border-gray-600 focus:border-brand-navy focus:ring-brand-navy'
            }
          `}
        >
          <option value="" disabled>
            {loadingStudents ? t('common.loading', 'Loading students...') : t('tuition.selectStudent', 'Select a student')}
          </option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name || t('users.student', 'Student')} ({s.email || s.phone_number || s.id.slice(0, 8)})
            </option>
          ))}
        </select>
        {errors.student_id && (
          <p className="text-xs text-brand-red mt-1">{errors.student_id.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Input
            type="number"
            label={t('tuition.paymentAmount', 'Payment Amount (UZS)')}
            placeholder="e.g. 1200000"
            required
            error={errors.amount?.message}
            {...register('amount', { valueAsNumber: true })}
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 block mb-1.5">
            {t('tuition.paymentMethod', 'Payment Method')} <span className="text-brand-red">*</span>
          </label>
          <select
            {...register('payment_method')}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 text-sm px-3.5 py-2"
          >
            {methodOptions.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          {errors.payment_method && (
            <p className="text-xs text-brand-red mt-1">{errors.payment_method.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Input
            type="text"
            label={t('tuition.reference', 'Reference / Transaction ID')}
            placeholder="e.g. TXN-948291"
            error={errors.reference_number?.message}
            {...register('reference_number')}
          />
        </div>

        <div>
          <Input
            type="date"
            label={t('tuition.paymentDate', 'Payment Date')}
            required
            error={errors.payment_date?.message}
            {...register('payment_date')}
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 block mb-1.5">
          {t('common.notes', 'Notes')}
        </label>
        <textarea
          rows={3}
          placeholder="Receipt notes, cash collector name, or remarks..."
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-brand-navy"
          {...register('notes')}
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
            {t('common.cancel', 'Cancel')}
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
        >
          {t('tuition.confirmRecord', 'Confirm & Record Payment')}
        </Button>
      </div>
    </form>
  );
}
