import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import {
  Users,
  GraduationCap,
  Building2,
  Calendar,
  DollarSign,
  Hash,
  ArrowLeft,
  Save,
  Sparkles,
  CheckCircle2,
  BookOpen,
  Layers,
  Camera,
  Trash2,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { toast } from '@/components/ui/Toast';
import { createGroup, updateGroup, getGroupById } from '@/services/groupService';
import { getCourses } from '@/services/courseService';
import { getTeachers } from '@/services/userService';
import ImageCropperModal from '@/components/ui/ImageCropperModal';
import { fileToCompressedDataUrl } from '@/services/settingsService';
import { ROLES } from '@/lib/constants';

const groupSchema = z.object({
  name: z.string().min(2, 'Guruh nomi kamida 2 ta belgidan iborat bo‘lishi kerak'),
  courseId: z.string().min(1, 'Kursni tanlash shart'),
  teacherId: z.string().optional().or(z.literal('')),
  room: z.string().optional().or(z.literal('')),
  capacity: z.coerce.number().min(1, 'Guruh sig‘imi kamida 1 kishi bo‘lishi kerak').max(100, 'Maksimal sig‘im 100 kishi'),
  monthlyPrice: z.coerce.number().min(0, 'Oylik to‘lov 0 dan kam bo‘lishi mumkin emas').default(0),
  status: z.enum(['active', 'completed', 'archived', 'upcoming']).default('active'),
  startDate: z.string().optional().or(z.literal('')),
  endDate: z.string().optional().or(z.literal('')),
});

export default function GroupCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { profile } = useAuth();
  const currentUserRole = profile?.role || ROLES.OWNER;
  const isTeacher = currentUserRole === ROLES.TEACHER;
  const isEditing = Boolean(id);

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
      teacherId: isTeacher ? (profile?.id || '') : '',
      room: '',
      capacity: 20,
      monthlyPrice: 0,
      status: 'active',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
    },
  });

  const selectedCourseId = watch('courseId');
  const selectedTeacherId = watch('teacherId');
  const selectedStatus = watch('status');

  const selectedCourse = useMemo(() => {
    return courses.find((c) => c.id === selectedCourseId) || null;
  }, [courses, selectedCourseId]);

  // Auto pre-fill group monthly price from course fee when a course is selected
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
        console.error('Failed to load group options:', err);
      } finally {
        if (mounted) setLoadingOptions(false);
      }
    };

    loadData();

    if (isEditing && id) {
      getGroupById(id)
        .then((grp) => {
          if (grp && mounted) {
            if (grp.avatar_url || grp.image_url) {
              setAvatarUrl(grp.avatar_url || grp.image_url);
            }
            reset({
              name: grp.name || '',
              courseId: grp.course_id || grp.courseId || '',
              teacherId: grp.primaryTeacher?.id || grp.teacher_id || grp.teacherId || grp.teachers?.[0]?.id || '',
              room: grp.room || '',
              capacity: grp.capacity || 20,
              monthlyPrice: grp.monthly_price !== undefined ? grp.monthly_price : (grp.monthlyPrice || 0),
              status: grp.status || 'active',
              startDate: grp.start_date ? grp.start_date.split('T')[0] : '',
              endDate: grp.end_date ? grp.end_date.split('T')[0] : '',
            });
          }
        })
        .catch((e) => {
          console.error(e);
          toast.error('Guruh ma‘lumotlarini yuklab bo‘lmadi');
        });
    }

    return () => {
      mounted = false;
    };
  }, [isEditing, id, reset]);

  const handleBack = () => {
    navigate(`/${currentUserRole}/groups`);
  };

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
        endDate: data.endDate || null,
        avatar_url: avatarUrl,
        image_url: avatarUrl,
      };
      if (isEditing) {
        await updateGroup(id, payload);
        toast.success(t('groups.updateSuccess', 'Guruh ma‘lumotlari muvaffaqiyatli saqlandi!'));
      } else {
        await createGroup(payload);
        toast.success(t('groups.createSuccess', 'Yangi guruh muvaffaqiyatli tashkil etildi!'));
      }
      handleBack();
    } catch (err) {
      console.error(err);
      toast.error(err.message || t('common.error', 'Guruhni saqlashda xatolik yuz berdi'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6 animate-fade-in">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          size="sm"
          icon={ArrowLeft}
          onClick={handleBack}
          className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
        >
          Orqaga qaytish
        </Button>
        <span
          className={`text-xs font-bold px-3 py-1 rounded-full border ${
            isTeacher
              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
              : 'bg-blue-500/15 text-brand-navy dark:text-blue-400 border-brand-navy/30'
          }`}
        >
          {isTeacher ? 'O‘QITUVCHI KABINETI' : 'BOSHQARUV PANELI'}
        </span>
      </div>

      {/* Header Info */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
          <span className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
            <Layers className="w-7 h-7" />
          </span>
          {isEditing ? '✏️ Guruh ma‘lumotlarini tahrirlash' : '🏫 Yangi o‘quv guruhi yaratish'}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 pl-1">
          {isEditing
            ? 'Guruh parametrlari, mas‘ul o‘qituvchi, talabalar sig‘imi va dars xonasini yangilang'
            : 'Yangi sinf yoki o‘quv guruhini shakllantirish, o‘qituvchi, kurs fani va auditoriyani belgilang'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Basic Information */}
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
            <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              1. Asosiy ma‘lumotlar va Kurs fani
            </h2>
          </div>

          {/* Group Avatar Upload Box */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-gray-50/80 dark:bg-surface-dark-tertiary/60 border border-gray-100 dark:border-gray-800">
            <div className="relative group/avatar shrink-0">
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-2xl shadow-sm">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Guruh profil rasmi"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Users className="w-8 h-8 opacity-70" />
                )}
              </div>
              <label
                className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white shadow-md cursor-pointer transition-transform hover:scale-110 flex items-center justify-center"
                title="Guruhga profil rasmi qo‘yish"
              >
                <Camera className="w-3.5 h-3.5" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarSelect}
                  disabled={avatarUploading}
                />
              </label>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Guruh profil rasmi (Avatar)
                </h3>
                {avatarUploading && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 animate-pulse font-medium">
                    Yuklanmoqda...
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Guruh uchun logotip yoki rasm yuklang. Bu rasm chatda, guruhlar ro‘yxatida va guruh profilida ko‘rinadi.
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 cursor-pointer border border-emerald-500/20 transition-colors">
                  <Camera className="w-3.5 h-3.5" />
                  <span>{avatarUrl ? 'Rasmni almashtirish' : 'Rasm tanlash'}</span>
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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-500/20 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>O‘chirish</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Group Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Guruh nomi <span className="text-brand-red">*</span>
              </label>
              <Input
                icon={Users}
                placeholder="Masalan: Frontend Boot-2026 yoki Arab tili (A1)"
                error={errors.name?.message}
                {...register('name')}
              />
            </div>

            {/* Course Selector */}
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Kurs fani / Ta‘lim yo‘nalishi <span className="text-brand-red">*</span>
              </label>
              <Select
                value={selectedCourseId}
                onChange={(e) => setValue('courseId', e.target.value)}
                placeholder="Kursni tanlang..."
                headerTitle="O‘quv kurslari"
                icon={BookOpen}
                options={courses.map((c) => ({
                  value: c.id,
                  label: c.name,
                  subtitle: `${c.code || ''} • ${c.duration_months ? c.duration_months + ' oy' : 'Asosiy kurs'}`,
                  color: c.color || '#123D78',
                }))}
                error={errors.courseId?.message}
              />
            </div>
          </div>
        </Card>

        {/* Section 2: Teacher & Room */}
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
            <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              2. Mas‘ul o‘qituvchi va Dars xonasi
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Teacher Selector */}
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Asosiy o‘qituvchi (Ustoz)
              </label>
              <Select
                value={selectedTeacherId}
                onChange={(e) => setValue('teacherId', e.target.value)}
                placeholder="O‘qituvchini biriktirish..."
                headerTitle="O‘qituvchilar"
                icon={GraduationCap}
                options={[
                  { value: '', label: 'Biriktirilmagan (Keyinroq belgilash)' },
                  ...teachers.map((t) => ({
                    value: t.id,
                    label: `${t.first_name || ''} ${t.last_name || ''}`.trim() || t.username,
                    subtitle: `@${t.username} • ${t.phone || 'O‘qituvchi'}`,
                    color: '#3b82f6',
                  })),
                ]}
              />
              {isTeacher && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  ✓ Siz ushbu guruhga asosiy o‘qituvchi sifatida biriktirilasiz
                </p>
              )}
            </div>

            {/* Room / Classroom */}
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Xona / Auditoriya
              </label>
              <Input
                icon={Building2}
                placeholder="Masalan: 204-xona yoki Online Zoom"
                error={errors.room?.message}
                {...register('room')}
              />
            </div>
          </div>
        </Card>

        {/* Section 3: Pricing & Capacity */}
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
            <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              3. Oylik to‘lov va Talabalar sig‘imi
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Monthly Price */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Oylik to‘lov summasi (so‘m)</span>
                  <span className="text-brand-red">*</span>
                </label>
                {selectedCourse && (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    Kurs narxi: {Number(selectedCourse.monthly_fee || 0).toLocaleString()} so‘m
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
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Guruhning rasmiy oylik to‘lovi. Chegirmali o‘qiydigan talabalarning chegirmasi guruh ichidagi talabalar ro‘yxatida alohida boshqariladi.
              </p>
            </div>

            {/* Capacity */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                O‘quvchilar sig‘imi <span className="text-brand-red">*</span>
              </label>
              <Input
                type="number"
                icon={Hash}
                min={1}
                max={100}
                placeholder="20"
                error={errors.capacity?.message}
                {...register('capacity')}
              />
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Guruhga qabul qilinadigan maksimal o‘quvchilar soni.
              </p>
            </div>
          </div>
        </Card>

        {/* Section 4: Status and Dates */}
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
            <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              4. Guruh holati va Dars sanalari
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Status */}
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Guruh holati
              </label>
              <Select
                value={selectedStatus}
                onChange={(e) => setValue('status', e.target.value)}
                options={[
                  { value: 'active', label: 'Faol (Darslar davom etmoqda)', color: '#10b981' },
                  { value: 'upcoming', label: 'Yaqinda boshlanadigan', color: '#f59e0b' },
                  { value: 'completed', label: 'Tugatilgan', color: '#8b5cf6' },
                  { value: 'archived', label: 'Arxivlangan', color: '#6b7280' },
                ]}
              />
            </div>

            {/* Start Date */}
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Boshlanish sanasi
              </label>
              <input
                type="date"
                {...register('startDate')}
                className="w-full h-11 px-3.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-surface-dark-secondary text-sm text-gray-900 dark:text-white font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>
        </Card>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <Button variant="ghost" size="lg" onClick={handleBack} disabled={isSubmitting}>
            Bekor qilish
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            icon={Save}
            isLoading={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-bold px-8 shadow-lg shadow-blue-600/30 dark:shadow-emerald-600/30 ring-1 ring-blue-400/40 dark:ring-emerald-400/40"
          >
            {isEditing ? 'O‘zgarishlarni saqlash' : 'Guruhni yaratish va Saqlash'}
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
    </div>
  );
}
