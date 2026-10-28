import React, { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { Users, GraduationCap, Building2, Calendar, DollarSign, Hash, Camera, Trash2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { toast } from '@/components/ui/Toast';
import { createGroup, updateGroup } from '@/services/groupService';
import { getCourses } from '@/services/courseService';
import { getTeachers } from '@/services/userService';
import { fileToCompressedDataUrl } from '@/services/settingsService';
import ImageCropperModal from '@/components/ui/ImageCropperModal';

const groupSchema = z.object({
  name: z.string().min(2, 'Group name must be at least 2 characters'),
  courseId: z.string().min(1, 'Course selection is required'),
  teacherId: z.string().optional().or(z.literal('')),
  room: z.string().optional().or(z.literal('')),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1').max(100, 'Max capacity is 100'),
  monthlyPrice: z.coerce.number().min(0, 'Oylik to‘lov 0 dan kam bo‘lishi mumkin emas').default(0),
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
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [cropModalFile, setCropModalFile] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: '',
      courseId: '',
      teacherId: '',
      room: '',
      capacity: 20,
      monthlyPrice: 0,
      status: 'active',
      startDate: '',
    },
  });

  const selectedCourseId = watch('courseId');
  const selectedCourse = useMemo(() => {
    return courses.find((c) => c.id === selectedCourseId) || null;
  }, [courses, selectedCourseId]);

  // Auto pre-fill group monthly price from course fee when a course is chosen
  useEffect(() => {
    if (!isEditing && selectedCourseId && courses.length > 0) {
      const matched = courses.find((c) => c.id === selectedCourseId);
      if (matched && (!watch('monthlyPrice') || Number(watch('monthlyPrice')) === 0)) {
        setValue('monthlyPrice', matched.monthly_fee || 0, { shouldValidate: true });
      }
    }
  }, [selectedCourseId, courses, isEditing, setValue, watch]);

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
      setAvatarUrl(group.avatar_url || group.image_url || '');
      reset({
        name: group.name || '',
        courseId: group.course_id || '',
        teacherId: group.primaryTeacher?.id || group.teacherId || '',
        room: group.room || '',
        capacity: group.capacity || 20,
        monthlyPrice: group.monthly_price !== undefined ? group.monthly_price : (group.monthlyPrice || 0),
        status: group.status || 'active',
        startDate: group.start_date ? group.start_date.split('T')[0] : '',
      });
    } else {
      setAvatarUrl('');
      reset({
        name: '',
        courseId: '',
        teacherId: '',
        room: '',
        capacity: 20,
        monthlyPrice: 0,
        status: 'active',
        startDate: new Date().toISOString().split('T')[0],
      });
    }

    return () => {
      mounted = false;
    };
  }, [group, isOpen, reset]);

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCropModalFile(file);
    }
    e.target.value = '';
  };

  const handleApplyCroppedAvatar = (croppedDataUrl) => {
    setCropModalFile(null);
    setAvatarUrl(croppedDataUrl);
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl('');
  };

  const onSubmit = async (data) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = {
        name: data.name,
        courseId: data.courseId,
        teacherId: data.teacherId || null,
        room: data.room || null,
        capacity: Number(data.capacity) || 20,
        monthly_price: Number(data.monthlyPrice) || 0,
        monthlyPrice: Number(data.monthlyPrice) || 0,
        status: data.status,
        startDate: data.startDate || null,
        avatar_url: avatarUrl,
        image_url: avatarUrl,
      };
      if (isEditing) {
        await updateGroup(group.id, payload);
        toast.success(t('groups.updateSuccess', 'Group updated successfully!'));
      } else {
        await createGroup(payload);
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
        {/* Avatar Upload */}
        <div className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
          <div className="relative group/avatar shrink-0">
            <div className="w-14 h-14 rounded-xl overflow-hidden border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-lg shadow-xs">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Guruh profil rasmi"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Users className="w-6 h-6 opacity-70" />
              )}
            </div>
            <label
              className="absolute -bottom-1 -right-1 p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white shadow-xs cursor-pointer transition-transform hover:scale-110 flex items-center justify-center"
              title="Guruhga profil rasmi qo‘yish"
            >
              <Camera className="w-3 h-3" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarSelect}
                disabled={avatarUploading}
              />
            </label>
          </div>

          <div className="flex-1 space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-900 dark:text-white">
                Guruh profil rasmi
              </span>
              {avatarUploading && (
                <span className="text-[11px] text-emerald-600 animate-pulse font-medium">
                  Yuklanmoqda...
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Guruh logotipi yoki rasmini yuklang.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 hover:bg-emerald-100 cursor-pointer border border-emerald-500/20">
                <Camera className="w-3 h-3" />
                <span>{avatarUrl ? 'Almashtirish' : 'Rasm tanlash'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarSelect}
                  disabled={avatarUploading}
                />
              </label>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 hover:bg-red-100 border border-red-500/20"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>O‘chirish</span>
                </button>
              )}
            </div>
          </div>
        </div>

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

          <Select
            label={t('courses.course', 'Associated Course')}
            required
            options={[
              { value: '', label: t('groups.selectCourse', 'Select a course...') },
              ...courses.map((c) => ({
                value: c.id,
                label: `${c.name} (${c.code})`,
              })),
            ]}
            value={watch('courseId') || ''}
            onChange={(e) => setValue('courseId', e.target.value, { shouldValidate: true })}
            disabled={loadingOptions}
            error={errors.courseId?.message}
            color="emerald"
            searchable
          />
        </div>

        {/* Teacher & Room */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label={t('groups.primaryTeacher', 'Lead Teacher')}
            options={[
              { value: '', label: t('groups.unassigned', 'Unassigned / Select Later') },
              ...teachers.map((teach) => ({
                value: teach.id,
                label: `${teach.fullName} (@${teach.username})`,
              })),
            ]}
            value={watch('teacherId') || ''}
            onChange={(e) => setValue('teacherId', e.target.value, { shouldValidate: true })}
            disabled={loadingOptions}
            color="blue"
            searchable
          />

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

          <Select
            label={t('common.status', 'Lifecycle Status')}
            options={[
              { value: 'active', label: t('common.active', 'Active (Ongoing)') },
              { value: 'upcoming', label: t('groups.upcoming', 'Upcoming (Not Started)') },
              { value: 'completed', label: t('groups.completed', 'Completed') },
              { value: 'archived', label: t('common.archived', 'Archived') },
            ]}
            value={watch('status') || 'active'}
            onChange={(e) => setValue('status', e.target.value, { shouldValidate: true })}
            color="emerald"
          />
        </div>

        {/* Monthly Price & Start Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>Oylik to‘lov summasi (so‘m)</span>
                <span className="text-red-500">*</span>
              </label>
              {selectedCourse && (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  Kurs: {Number(selectedCourse.monthly_fee || 0).toLocaleString()} so‘m
                </span>
              )}
            </div>
            <Input
              type="number"
              step="1000"
              icon={DollarSign}
              placeholder="Masalan: 600000"
              error={errors.monthlyPrice?.message}
              {...register('monthlyPrice')}
            />
          </div>

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

      {/* Telegram-style Image Cropper Modal for Group Avatar */}
      <ImageCropperModal
        isOpen={Boolean(cropModalFile)}
        imageFile={cropModalFile}
        onClose={() => setCropModalFile(null)}
        onCrop={handleApplyCroppedAvatar}
        title="Guruh profil rasmini moslashtirish"
        subtitle="Rasmni suring, kattalashtiring va o‘lchamini sozlang"
      />
    </Modal>
  );
}
