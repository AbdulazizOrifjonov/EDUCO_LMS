import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  DollarSign,
  Palette,
  Code,
  Check,
  Sparkles,
  ArrowLeft,
  Save,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { toast } from '@/components/ui/Toast';
import { createCourse, updateCourse, getCourseById, getCourses } from '@/services/courseService';
import { getCourseCodeSuggestions } from './CourseForm';
import { ROLES } from '@/lib/constants';

const courseSchema = z.object({
  name: z.string().min(2, 'Kurs nomi kamida 2 ta harfdan iborat bo‘lishi kerak'),
  code: z.string().min(2, 'Kurs kodi kiritilishi shart'),
  description: z.string().optional().or(z.literal('')),
  monthlyFee: z.coerce.number().min(0, 'To‘lov manfiy bo‘lishi mumkin emas').default(0),
  color: z.string().default('#123D78'),
  isActive: z.boolean().default(true),
});

const PRESET_COLORS = [
  '#123D78', // Educo Navy
  '#F12D3A', // Educo Red
  '#059669', // Emerald
  '#0284C7', // Sky blue
  '#D97706', // Amber
  '#7C3AED', // Purple
  '#DB2777', // Pink
  '#475569', // Slate
];

export default function CourseCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { profile } = useAuth();
  const currentUserRole = profile?.role || ROLES.OWNER;
  const isEditing = Boolean(id);

  const [existingCourses, setExistingCourses] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoCode, setIsAutoCode] = useState(!isEditing);

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
  const watchedName = watch('name');
  const watchedCode = watch('code');

  const suggestions = useMemo(() => {
    return getCourseCodeSuggestions(watchedName, existingCourses);
  }, [watchedName, existingCourses]);

  useEffect(() => {
    let mounted = true;
    getCourses({ limit: 100 })
      .then((res) => {
        if (mounted) setExistingCourses(res.courses || []);
      })
      .catch(() => {});

    if (isEditing && id) {
      getCourseById(id)
        .then((c) => {
          if (c && mounted) {
            reset({
              name: c.name || '',
              code: c.code || '',
              description: c.description || '',
              monthlyFee: c.monthlyFee || c.monthly_fee || 0,
              color: c.color || '#123D78',
              isActive: c.is_active !== undefined ? c.is_active : true,
            });
            setIsAutoCode(false);
          }
        })
        .catch(() => {
          toast.error('Kurs ma‘lumotlarini yuklab bo‘lmadi');
        });
    }

    return () => {
      mounted = false;
    };
  }, [isEditing, id, reset]);

  const handleNameChange = (val) => {
    if (isAutoCode && suggestions.length > 0) {
      setValue('code', suggestions[0].code);
    }
  };

  const handleSelectSuggestion = (code) => {
    setValue('code', code);
    setIsAutoCode(true);
  };

  const handleToggleAutoCode = () => {
    if (!isAutoCode) {
      setIsAutoCode(true);
      if (suggestions.length > 0) {
        setValue('code', suggestions[0].code);
      }
    } else {
      setIsAutoCode(false);
    }
  };

  const handleBack = () => {
    navigate(`/${currentUserRole}/courses`);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (isEditing) {
        await updateCourse(id, data);
        toast.success(t('courses.updateSuccess', 'Kurs ma‘lumotlari muvaffaqiyatli yangilandi!'));
      } else {
        await createCourse(data);
        toast.success(t('courses.createSuccess', 'Yangi kurs muvaffaqiyatli yaratildi!'));
      }
      handleBack();
    } catch (err) {
      console.error(err);
      toast.error(err.message || t('common.error', 'Kursni saqlashda xatolik yuz berdi'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6 animate-fade-in">
      {/* Top Header & Breadcrumb */}
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
        <span className="text-xs font-bold px-3 py-1 rounded-full border bg-blue-500/15 text-brand-navy dark:text-blue-400 border-brand-navy/30">
          KURS BOSHQARUVI
        </span>
      </div>

      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
          <span className="p-2.5 rounded-2xl bg-brand-navy/10 text-brand-navy dark:text-blue-400 ring-1 ring-brand-navy/20">
            <BookOpen className="w-7 h-7" />
          </span>
          {isEditing ? '✏️ Kurs ma‘lumotlarini tahrirlash' : '📚 Yangi kurs yaratish'}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 pl-1">
          {isEditing
            ? 'Kurs parametri, avtomatik kodi, to‘lov miqdori va nishon rangini yangilang'
            : 'Yangi ta‘lim yo‘nalishi yoki fanni o‘quv markazining ta‘lim dasturiga qo‘shing'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
            <BookOpen className="w-5 h-5 text-brand-navy dark:text-blue-400" />
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              1. Kurs nomi va Avtomatik kodi
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Kurs nomi <span className="text-brand-red">*</span>
              </label>
              <Input
                icon={BookOpen}
                placeholder="Masalan: Frontend dasturlash, Arab tili, Python..."
                error={errors.name?.message}
                {...register('name', {
                  onChange: (e) => handleNameChange(e.target.value),
                })}
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Kurs kodi <span className="text-brand-red">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleToggleAutoCode}
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md transition-all cursor-pointer border ${
                    isAutoCode
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60 shadow-2xs'
                      : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                  }`}
                  title={isAutoCode ? 'Avtomatik kod yaratish faol (nomdan olinadi)' : 'Qo‘lda kiritish rejimi'}
                >
                  <Sparkles className={`w-3 h-3 ${isAutoCode ? 'text-emerald-500' : 'text-gray-400'}`} />
                  <span>{isAutoCode ? 'Avto faol' : 'Qo‘lda kiritish'}</span>
                </button>
              </div>
              <Input
                icon={Code}
                placeholder="Masalan: FE-1.1"
                error={errors.code?.message}
                {...register('code', {
                  onChange: () => setIsAutoCode(false),
                })}
              />
              {isAutoCode && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium pl-0.5 pt-0.5">
                  <Sparkles className="w-3 h-3 shrink-0" />
                  <span>Kurs nomidan avtomatik kod shakllanadi</span>
                </p>
              )}
            </div>
          </div>

          {/* Suggestion Chips */}
          {suggestions.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap text-xs bg-emerald-500/5 dark:bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
              <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1 shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Tavsiya etilgan avtomatik kodlar:</span>
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {suggestions.map((sug, idx) => {
                  const isSelected = watchedCode === sug.code;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSuggestion(sug.code)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-blue-600 dark:bg-emerald-600 text-white border-blue-600 dark:border-emerald-600 shadow-xs'
                          : 'bg-white hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <span>{sug.code}</span>
                      <span className={`text-[10px] ml-1 font-normal ${isSelected ? 'text-emerald-100' : 'text-gray-400'}`}>
                        ({sug.desc})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Kurs tavsifi / O‘quv dasturi
            </label>
            <textarea
              rows={3}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-white text-sm p-3.5 focus:outline-none focus:ring-2 focus:ring-brand-navy"
              placeholder="Kurs maqsadi, qamrovi, o‘quv rejasi va natijalari..."
              {...register('description')}
            />
          </div>
        </Card>

        {/* Section 2: Pricing & Visual Identity */}
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
            <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              2. Oylik to‘lov va Nishon rangi
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Oylik to‘lov summasi (so‘m yoki $)
              </label>
              <Input
                type="number"
                step="1000"
                icon={DollarSign}
                placeholder="500000"
                error={errors.monthlyFee?.message}
                {...register('monthlyFee')}
              />
            </div>

            {/* Color selection */}
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-gray-400" />
                <span>Nishon va Jadval rangi</span>
              </label>
              <div className="flex items-center gap-2.5 flex-wrap pt-1.5">
                {PRESET_COLORS.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setValue('color', hex)}
                    style={{ backgroundColor: hex }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform cursor-pointer ${
                      selectedColor === hex
                        ? 'scale-110 ring-2 ring-offset-2 ring-brand-navy dark:ring-offset-surface-dark'
                        : 'hover:scale-105'
                    }`}
                  >
                    {selectedColor === hex && <Check className="w-4 h-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Section 3: Status */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                Kurs faoliyati (Faol o‘quv kursi)
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {isActive
                  ? 'Ushbu kurs bo‘yicha yangi guruhlar ochish va talabalar qabul qilish mumkin'
                  : 'Arxivlangan kurs; bu yo‘nalishda yangi guruhlar ochilmaydi'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setValue('isActive', !isActive)}
              className={`
                relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
                ${isActive ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-gray-700'}
              `}
            >
              <span
                className={`
                  pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                  ${isActive ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0'}
                `}
              />
            </button>
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
            {isEditing ? 'O‘zgarishlarni saqlash' : 'Kursni yaratish va Saqlash'}
          </Button>
        </div>
      </form>
    </div>
  );
}
