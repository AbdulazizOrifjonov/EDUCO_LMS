import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { Award, User, MessageSquare, BookOpen, Check } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { toast } from '@/components/ui/Toast';
import { saveGrade, GRADE_COLORS } from '@/services/gradeService';

const gradeSchema = z.object({
  studentId: z.string().min(1, 'Please select a student'),
  gradeValue: z.coerce.number().min(1).max(5),
  feedback: z.string().optional().or(z.literal('')),
  topic: z.string().optional().or(z.literal('')),
});

export default function GradeForm({
  isOpen,
  onClose,
  lessonId,
  groupId = null,
  student = null,
  availableStudents = [],
  currentGrade = null,
  gradedBy = null,
  onSuccess,
}) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(gradeSchema),
    defaultValues: {
      studentId: student?.id || '',
      gradeValue: currentGrade?.grade_value || 5,
      feedback: currentGrade?.feedback || '',
      topic: currentGrade?.topic || '',
    },
  });

  const selectedGrade = watch('gradeValue');

  useEffect(() => {
    if (isOpen) {
      reset({
        studentId: student?.id || currentGrade?.student_id || availableStudents[0]?.id || '',
        gradeValue: currentGrade?.grade_value ? Number(currentGrade.grade_value) : 5,
        feedback: currentGrade?.feedback || '',
        topic: currentGrade?.topic || '',
      });
    }
  }, [isOpen, student, currentGrade, availableStudents, reset]);

  const onSubmit = async (data) => {
    if (!lessonId && !groupId) {
      toast.error(t('grades.lessonRequired', 'A lesson instance is required to record grades'));
      return;
    }
    setIsSubmitting(true);
    try {
      const targetStudent = student || availableStudents.find((s) => s.id === data.studentId);
      const studentName =
        targetStudent?.fullName ||
        `${targetStudent?.first_name || ''} ${targetStudent?.last_name || ''}`.trim() ||
        targetStudent?.username ||
        'Talaba';

      await saveGrade({
        lessonId: lessonId || `lsn-${groupId || 'group'}-${new Date().toISOString().split('T')[0]}`,
        groupId,
        studentId: data.studentId,
        studentName,
        gradeValue: data.gradeValue,
        topic: data.topic || 'Dars mashgʻuloti',
        feedback: data.feedback,
        gradedBy,
      });
      toast.success(t('grades.saveSuccess', 'Baho va izoh muvaffaqiyatli saqlandi!'));
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.message || t('common.error', 'Failed to save grade'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const gradeOptions = [
    { val: 1, label: t('grades.scale1', 'Yomon'), bg: 'bg-red-500 hover:bg-red-600', ring: 'ring-red-500' },
    { val: 2, label: t('grades.scale2', 'Qoniqarsiz'), bg: 'bg-orange-500 hover:bg-orange-600', ring: 'ring-orange-500' },
    { val: 3, label: t('grades.scale3', 'Satisfactory'), bg: 'bg-amber-400 hover:bg-amber-500', ring: 'ring-amber-400' },
    { val: 4, label: t('grades.scale4', 'Good'), bg: 'bg-brand-navy hover:bg-brand-navy-light', ring: 'ring-brand-navy' },
    { val: 5, label: t('grades.scale5', 'Excellent'), bg: 'bg-emerald-600 hover:bg-emerald-700', ring: 'ring-emerald-600' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={currentGrade ? t('grades.editGrade', 'Update Student Grade') : t('grades.addGrade', 'Record Student Grade')}
      subtitle={t('grades.modalSubtitle', 'Score student performance on 1-5 scale with constructive evaluation')}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Student Selector / Display */}
        {student ? (
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-surface-dark-tertiary border border-gray-100 dark:border-gray-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-navy/10 text-brand-navy dark:text-blue-300 font-bold flex items-center justify-center text-xs">
              {student.first_name?.[0] || 'S'}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{student.fullName}</p>
              <p className="text-xs text-gray-500">@{student.username}</p>
            </div>
          </div>
        ) : (
          <Select
            label={t('users.student', 'Student')}
            required
            options={availableStudents.map((st) => ({
              value: st.id,
              label: st.fullName || st.first_name,
              subtitle: `@${st.username}`,
            }))}
            value={watch('studentId') || ''}
            onChange={(e) => setValue('studentId', e.target.value, { shouldValidate: true })}
            error={errors.studentId?.message}
            color="emerald"
            searchable
          />
        )}

        {/* Grade 1-5 Selection Buttons */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            {t('grades.gradeValue', 'Performance Score (1 - 5 Scale)')}
          </label>
          <div className="grid grid-cols-5 gap-2">
            {gradeOptions.map((opt) => {
              const isSelected = Number(selectedGrade) === opt.val;
              return (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setValue('gradeValue', opt.val)}
                  className={`
                    py-3 px-2 rounded-xl flex flex-col items-center justify-center font-bold text-white transition-all
                    ${opt.bg}
                    ${
                      isSelected
                        ? `ring-4 ring-offset-2 ${opt.ring} dark:ring-offset-surface-dark scale-105 shadow-md`
                        : 'opacity-80 hover:opacity-100'
                    }
                  `}
                >
                  <span className="text-xl leading-none">{opt.val}</span>
                  <span className="text-[10px] mt-1 text-center font-medium opacity-90 line-clamp-1">
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Lesson Topic */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            {t('grades.topic', 'Dars mavzusi / Mashgʻulot')}
          </label>
          <input
            type="text"
            placeholder={t('grades.topicPlaceholder', 'Mavzuni kiriting (masalan: Yangi grammatik mavzu, Mustaqil ish...)')}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-navy"
            {...register('topic')}
          />
        </div>

        {/* Feedback Textarea */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            {t('grades.feedback', 'Ustoz izohi va tavsiyalari')}
          </label>
          <textarea
            rows={3}
            placeholder={t('grades.feedbackPlaceholder', 'Talabaning darsdagi faolligi boʻyicha izoh yozing...')}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-brand-navy"
            {...register('feedback')}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {t('common.save', 'Save Grade')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
