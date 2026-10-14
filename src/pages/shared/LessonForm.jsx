import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, Building2, CheckCircle2, AlertTriangle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { toast } from '@/components/ui/Toast';
import { localStore } from '@/lib/localStore';
import { getGroups } from '@/services/groupService';

const PATTERN_DAYS = {
  odd: [1, 3, 5],  // Dushanba, Chorshanba, Juma
  even: [2, 4, 6], // Seshanba, Payshanba, Shanba
};

const lessonSchema = z
  .object({
    groupId: z.string().min(1, 'Guruhni tanlash majburiy'),
    dayPattern: z.enum(['odd', 'even']),
    startTime: z.string().min(1, 'Boshlanish vaqti majburiy'),
    endTime: z.string().min(1, 'Tugash vaqti majburiy'),
    room: z.string().optional().or(z.literal('')),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: 'Tugash vaqti boshlanish vaqtidan keyin bo‘lishi kerak',
    path: ['endTime'],
  });

export default function LessonForm({
  isOpen,
  onClose,
  lesson = null,
  initialDay = 1,
  initialTime = '09:00',
  existingLessons = [],
  onSuccess,
}) {
  const { t } = useTranslation();
  const isEditing = Boolean(lesson?.id);
  const [groups, setGroups] = useState([]);
  const [conflictWarning, setConflictWarning] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getDefaultPattern = (dayNum) => ([2, 4, 6].includes(Number(dayNum)) ? 'even' : 'odd');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      groupId: '',
      dayPattern: getDefaultPattern(initialDay),
      startTime: initialTime || '09:00',
      endTime: '10:30',
      room: '',
    },
  });

  const selectedPattern = watch('dayPattern');
  const selectedStart = watch('startTime');
  const selectedEnd = watch('endTime');
  const selectedRoom = watch('room');
  const selectedGroup = watch('groupId');

  useEffect(() => {
    if (!isOpen) return;

    const loadGroups = async () => {
      try {
        const res = await getGroups({ status: 'active', limit: 100 });
        setGroups(res.groups || []);
      } catch (err) {
        console.error(err);
      }
    };
    loadGroups();

    if (lesson) {
      const lessonDay = lesson.day_of_week || lesson.dayOfWeek || 1;
      reset({
        groupId: lesson.group_id || lesson.groupId || '',
        dayPattern: getDefaultPattern(lessonDay),
        startTime: lesson.start_time?.slice(0, 5) || '09:00',
        endTime: lesson.end_time?.slice(0, 5) || '10:30',
        room: lesson.room || '',
      });
    } else {
      reset({
        groupId: '',
        dayPattern: getDefaultPattern(initialDay),
        startTime: initialTime || '09:00',
        endTime: '10:30',
        room: '',
      });
    }
  }, [lesson, isOpen, initialDay, initialTime, reset]);

  // Auto-fill room if group is selected and room is empty
  useEffect(() => {
    if (!selectedGroup || isEditing) return;
    const foundGroup = groups.find((g) => g.id === selectedGroup);
    if (foundGroup?.room && !selectedRoom) {
      setValue('room', foundGroup.room);
    }
  }, [selectedGroup, groups, isEditing, selectedRoom, setValue]);

  // Real-time conflict detection across all 3 days of the selected pattern
  useEffect(() => {
    if (!selectedPattern || !selectedStart || !selectedEnd) {
      setConflictWarning(null);
      return;
    }

    const targetDays = PATTERN_DAYS[selectedPattern] || [1, 3, 5];

    const hasConflict = existingLessons.find((l) => {
      if (lesson && (l.id === lesson.id || l.group_id === (lesson.group_id || lesson.groupId))) {
        return false;
      }
      const inTargetDays = targetDays.includes(Number(l.day_of_week));
      if (!inTargetDays) return false;

      const lStart = l.start_time?.slice(0, 5);
      const lEnd = l.end_time?.slice(0, 5);
      const timesOverlap = selectedStart < lEnd && selectedEnd > lStart;

      if (!timesOverlap) return false;

      if (selectedRoom && l.room && selectedRoom.toLowerCase() === l.room.toLowerCase()) {
        return true;
      }
      if (selectedGroup && l.group_id === selectedGroup) {
        return true;
      }
      return false;
    });

    if (hasConflict) {
      const lStart = hasConflict.start_time?.slice(0, 5);
      const lEnd = hasConflict.end_time?.slice(0, 5);
      if (selectedRoom && hasConflict.room && selectedRoom.toLowerCase() === hasConflict.room.toLowerCase()) {
        setConflictWarning(
          `"${hasConflict.room}" xonasi bu vaqtda (${lStart} - ${lEnd}) "${hasConflict.groupName || 'boshqa guruh'}" tomonidan band qilingan.`
        );
      } else {
        setConflictWarning(
          `Tanlangan guruhda ushbu kunlarda (${lStart} - ${lEnd}) dars mavjud.`
        );
      }
    } else {
      setConflictWarning(null);
    }
  }, [selectedPattern, selectedStart, selectedEnd, selectedRoom, selectedGroup, existingLessons, lesson]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      localStore.saveSchedulePattern({
        groupId: data.groupId,
        pattern: data.dayPattern,
        startTime: data.startTime,
        endTime: data.endTime,
        room: data.room?.trim() || '101-xona',
        existingLesson: isEditing ? lesson : null,
      });

      const patternText =
        data.dayPattern === 'even'
          ? 'Juft kunlar (Seshanba, Payshanba, Shanba)'
          : 'Toq kunlar (Dushanba, Chorshanba, Juma)';

      toast.success(
        isEditing
          ? `Dars jadvali (${patternText}) muvaffaqiyatli yangilandi!`
          : `Dars ${patternText} kunlariga muvaffaqiyatli qo'shildi!`
      );

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.message || t('common.error', 'Failed to save timetable slot'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const patternOptions = [
    {
      id: 'odd',
      title: t('schedule.oddDays', 'Toq kunlar (Dushanbalik)'),
      subtitle: 'Dushanba • Chorshanba • Juma',
      days: [
        t('schedule.monday', 'Dushanba'),
        t('schedule.wednesday', 'Chorshanba'),
        t('schedule.friday', 'Juma'),
      ],
    },
    {
      id: 'even',
      title: t('schedule.evenDays', 'Juft kunlar (Seshanbalik)'),
      subtitle: 'Seshanba • Payshanba • Shanba',
      days: [
        t('schedule.tuesday', 'Seshanba'),
        t('schedule.thursday', 'Payshanba'),
        t('schedule.saturday', 'Shanba'),
      ],
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? t('schedule.editLesson', 'Dars vaqtini tahrirlash') : t('schedule.addLesson', 'Yangi darsni rejalashtirish')}
      subtitle={t('schedule.modalSubtitle', 'Guruh, dars kunlari (Toq yoki Juft kunlar), vaqt va xonani belgilang')}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Conflict Alert */}
        {conflictWarning && (
          <div className="p-3 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 flex items-start gap-2.5 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold">Vaqt to&apos;qnashuvi:</span> {conflictWarning}
            </div>
          </div>
        )}

        {/* Group Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            {t('groups.group', 'O‘quv guruhi')} <span className="text-brand-red">*</span>
          </label>
          <select
            className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 text-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-brand-navy"
            {...register('groupId')}
          >
            <option value="">{t('groups.selectGroup', 'Guruhni tanlang...')}</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} {g.courseName ? `(${g.courseName})` : ''}
              </option>
            ))}
          </select>
          {errors.groupId && (
            <p className="text-xs text-brand-red font-medium">{errors.groupId.message}</p>
          )}
        </div>

        {/* 2-Option Day Pattern Selector: Toq kunlar vs Juft kunlar */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            {t('schedule.dayPattern', 'Dars kunlari (Hafta kunlari)')} <span className="text-brand-red">*</span>
          </label>
          <input type="hidden" {...register('dayPattern')} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {patternOptions.map((opt) => {
              const isSelected = selectedPattern === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setValue('dayPattern', opt.id, { shouldValidate: true })}
                  className={`text-left p-3.5 rounded-xl border-2 transition-all relative flex flex-col justify-between gap-2.5 ${
                    isSelected
                      ? 'border-brand-navy bg-brand-navy/5 dark:border-blue-500 dark:bg-blue-950/40 shadow-sm'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark-secondary hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 w-full">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-brand-navy text-white dark:bg-blue-600'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                      >
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <p
                          className={`text-xs font-bold leading-snug ${
                            isSelected
                              ? 'text-brand-navy dark:text-blue-300'
                              : 'text-gray-800 dark:text-gray-200'
                          }`}
                        >
                          {opt.title}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-brand-navy dark:text-blue-400 shrink-0" />
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1 pt-0.5">
                    {opt.days.map((dName) => (
                      <span
                        key={dName}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                          isSelected
                            ? 'bg-brand-navy/15 text-brand-navy dark:bg-blue-500/20 dark:text-blue-200'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                      >
                        {dName}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-brand-navy dark:text-blue-400 shrink-0" />
            {selectedPattern === 'even'
              ? 'Dars avtomatik ravishda Seshanba, Payshanba va Shanba kunlariga qo‘yiladi.'
              : 'Dars avtomatik ravishda Dushanba, Chorshanba va Juma kunlariga qo‘yiladi.'}
          </p>
        </div>

        {/* Start & End Times */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('schedule.startTime', 'Boshlanish vaqti')}
            type="time"
            icon={Clock}
            required
            error={errors.startTime?.message}
            {...register('startTime')}
          />
          <Input
            label={t('schedule.endTime', 'Tugash vaqti')}
            type="time"
            icon={Clock}
            required
            error={errors.endTime?.message}
            {...register('endTime')}
          />
        </div>

        {/* Room */}
        <Input
          label={t('groups.room', 'Xona / Joylashuv')}
          icon={Building2}
          placeholder="Masalan: 101-xona yoki Lab 202"
          error={errors.room?.message}
          {...register('room')}
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel', 'Bekor qilish')}
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {isEditing ? t('common.save', 'Saqlash') : t('schedule.scheduleLesson', 'Jadvalga kiritish')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

