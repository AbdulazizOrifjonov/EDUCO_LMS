import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { BookOpen, DollarSign, Palette, Code, Check } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { toast } from '@/components/ui/Toast';
import { createCourse, updateCourse } from '@/services/courseService';

const courseSchema = z.object({
  name: z.string().min(2, 'Course name must be at least 2 characters'),
  code: z.string().min(2, 'Course code is required (e.g. ENG-101)'),
  description: z.string().optional().or(z.literal('')),
  monthlyFee: z.coerce.number().min(0, 'Monthly fee cannot be negative'),
  color: z.string().default('#123D78'),
  isActive: z.boolean().default(true),
});

const PRESET_COLORS = [
  '#123D78', // EDUCO Navy
  '#F12D3A', // EDUCO Red
  '#0284C7', // Sky
  '#059669', // Emerald
  '#D97706', // Amber
  '#7C3AED', // Purple
  '#DB2777', // Pink
  '#475569', // Slate
];

export default function CourseForm({
  isOpen,
  onClose,
  course = null,
  onSuccess,
}) {
  const { t } = useTranslation();
  const isEditing = Boolean(course?.id);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      monthlyFee: 0,
      color: '#123D78',
      isActive: true,
    },
  });

  const selectedColor = watch('color');
  const isActive = watch('isActive');

  useEffect(() => {
    if (course && isOpen) {
      reset({
        name: course.name || '',
        code: course.code || '',
        description: course.description || '',
        monthlyFee: course.monthly_fee !== undefined ? course.monthly_fee : 0,
        color: course.color || '#123D78',
        isActive: course.is_active !== undefined ? course.is_active : true,
      });
    } else if (isOpen) {
      reset({
        name: '',
        code: '',
        description: '',
        monthlyFee: 0,
        color: '#123D78',
        isActive: true,
      });
    }
  }, [course, isOpen, reset]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (isEditing) {
        await updateCourse(course.id, data);
        toast.success(t('courses.updateSuccess', 'Course updated successfully!'));
      } else {
        await createCourse(data);
        toast.success(t('courses.createSuccess', 'Course created successfully!'));
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.message || t('common.error', 'Failed to save course'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? t('courses.editCourse', 'Edit Course') : t('courses.createCourse', 'Create Course')}
      subtitle={
        isEditing
          ? t('courses.editSubtitle', 'Update course details, fees, and visual badge')
          : t('courses.createSubtitle', 'Add a new educational direction or subject to curriculum')
      }
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Input
              label={t('courses.name', 'Course Name')}
              icon={BookOpen}
              required
              placeholder="e.g. Advanced English C1"
              error={errors.name?.message}
              {...register('name')}
            />
          </div>
          <div>
            <Input
              label={t('courses.code', 'Course Code')}
              icon={Code}
              required
              placeholder="e.g. ENG-C1"
              error={errors.code?.message}
              {...register('code')}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 block mb-1.5">
            {t('common.description', 'Description')}
          </label>
          <textarea
            rows={3}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-brand-navy"
            placeholder="Course overview, curriculum scope, objectives..."
            {...register('description')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t('courses.fee', 'Monthly Tuition Fee ($)')}
            type="number"
            step="0.01"
            icon={DollarSign}
            placeholder="0.00"
            error={errors.monthlyFee?.message}
            {...register('monthlyFee')}
          />

          {/* Color theme selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-gray-400" />
              {t('courses.color', 'Badge & Schedule Color')}
            </label>
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {PRESET_COLORS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setValue('color', hex)}
                  style={{ backgroundColor: hex }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                    selectedColor === hex ? 'scale-110 ring-2 ring-offset-2 ring-brand-navy dark:ring-offset-surface-dark' : 'hover:scale-105'
                  }`}
                >
                  {selectedColor === hex && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Status Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-surface-dark-tertiary/40">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {t('courses.activeStatus', 'Active Curriculum')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isActive
                ? t('courses.activeDesc', 'Available for group creation and student enrollments')
                : t('courses.inactiveDesc', 'Archived course; no new groups can be opened')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setValue('isActive', !isActive)}
            className={`
              relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
              ${isActive ? 'bg-brand-navy' : 'bg-gray-300 dark:bg-gray-700'}
            `}
          >
            <span
              className={`
                pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                ${isActive ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0'}
              `}
            />
          </button>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {isEditing ? t('common.save', 'Save Changes') : t('common.create', 'Create Course')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
