import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { Users, GraduationCap, Building2, Calendar, Hash } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { toast } from '@/components/ui/Toast';
import { createGroup, updateGroup } from '@/services/groupService';
import { getCourses } from '@/services/courseService';
import { getTeachers } from '@/services/userService';

const groupSchema = z.object({
  name: z.string().min(2, 'Group name must be at least 2 characters'),
  courseId: z.string().min(1, 'Course selection is required'),
  teacherId: z.string().optional().or(z.literal('')),
  room: z.string().optional().or(z.literal('')),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1').max(100, 'Max capacity is 100'),
  status: z.enum(['active', 'completed', 'archived', 'upcoming']).default('active'),
  startDate: z.string().optional().or(z.literal('')),
});

export default function GroupForm({
  isOpen,
  onClose,
  group = null,
  onSuccess,
}) {
  const { t } = useTranslation();
  const isEditing = Boolean(group?.id);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: '',
      courseId: '',
      teacherId: '',
      room: '',
      capacity: 20,
      status: 'active',
      startDate: '',
    },
  });

  // Load courses and teachers
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    const loadData = async () => {
      setLoadingOptions(true);
      try {
        const [courseRes, teacherRes] = await Promise.all([
          getCourses({ status: 'active', limit: 100 }),
          getTeachers(),
        ]);
        if (mounted) {
          setCourses(courseRes.courses || []);
          setTeachers(teacherRes || []);
        }
      } catch (err) {
        console.error('Failed to load options:', err);
      } finally {
        if (mounted) setLoadingOptions(false);
      }
    };

    loadData();

    if (group) {
      reset({
        name: group.name || '',
        courseId: group.course_id || '',
        teacherId: group.primaryTeacher?.id || group.teacherId || '',
        room: group.room || '',
        capacity: group.capacity || 20,
        status: group.status || 'active',
        startDate: group.start_date ? group.start_date.split('T')[0] : '',
      });
    } else {
      reset({
        name: '',
        courseId: '',
        teacherId: '',
        room: '',
        capacity: 20,
        status: 'active',
        startDate: new Date().toISOString().split('T')[0],
      });
    }

    return () => {
      mounted = false;
    };
  }, [group, isOpen, reset]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (isEditing) {
        await updateGroup(group.id, data);
        toast.success(t('groups.updateSuccess', 'Group updated successfully!'));
      } else {
        await createGroup(data);
        toast.success(t('groups.createSuccess', 'Group created successfully!'));
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.message || t('common.error', 'Failed to save group'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? t('groups.editGroup', 'Edit Study Group') : t('groups.createGroup', 'Create Study Group')}
      subtitle={
        isEditing
          ? t('groups.editSubtitle', 'Configure group parameters, schedule capacity, and instructor')
          : t('groups.createSubtitle', 'Initialize a new cohort or classroom section')
      }
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name & Course */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t('groups.name', 'Group Name')}
            icon={Users}
            required
            placeholder="e.g. Group A1 - Morning"
            error={errors.name?.message}
            {...register('name')}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              {t('courses.course', 'Associated Course')} <span className="text-brand-red">*</span>
            </label>
            <select
              disabled={loadingOptions}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-navy"
              {...register('courseId')}
            >
              <option value="">{t('groups.selectCourse', 'Select a course...')}</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
            {errors.courseId && (
              <p className="text-xs text-brand-red font-medium">{errors.courseId.message}</p>
            )}
          </div>
        </div>

        {/* Teacher & Room */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              {t('groups.primaryTeacher', 'Lead Teacher')}
            </label>
            <select
              disabled={loadingOptions}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-navy"
              {...register('teacherId')}
            >
              <option value="">{t('groups.unassigned', 'Unassigned / Select Later')}</option>
              {teachers.map((teach) => (
                <option key={teach.id} value={teach.id}>
                  {teach.fullName} (@{teach.username})
                </option>
              ))}
            </select>
          </div>

          <Input
            label={t('groups.room', 'Classroom / Room')}
            icon={Building2}
            placeholder="e.g. Room 204 or Online Meet"
            error={errors.room?.message}
            {...register('room')}
          />
        </div>

        {/* Capacity & Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t('groups.capacity', 'Max Student Capacity')}
            type="number"
            min={1}
            max={100}
            icon={Hash}
            placeholder="20"
            error={errors.capacity?.message}
            {...register('capacity')}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              {t('common.status', 'Lifecycle Status')}
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-navy"
              {...register('status')}
            >
              <option value="active">{t('common.active', 'Active (Ongoing)')}</option>
              <option value="upcoming">{t('groups.upcoming', 'Upcoming (Not Started)')}</option>
              <option value="completed">{t('groups.completed', 'Completed')}</option>
              <option value="archived">{t('common.archived', 'Archived')}</option>
            </select>
          </div>
        </div>

        {/* Start Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t('groups.startDate', 'Start Date')}
            type="date"
            icon={Calendar}
            error={errors.startDate?.message}
            {...register('startDate')}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {isEditing ? t('common.save', 'Save Changes') : t('common.create', 'Create Group')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
