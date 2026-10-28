import React, { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { BookOpen, DollarSign, Palette, Code, Check, Sparkles } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { toast } from '@/components/ui/Toast';
import { createCourse, updateCourse } from '@/services/courseService';
import { localStore } from '@/lib/localStore';

/**
 * Intelligent helper to auto-generate course codes with sequential numbering (1.1, 1.2, 1.3...)
 */
export function getCourseCodeSuggestions(courseName, existingCourses = []) {
  if (!courseName || !courseName.trim()) return [];

  const trimmed = courseName.trim();
  const lower = trimmed.toLowerCase();

  // 1. Determine base acronyms / prefixes
  let shortPrefix = '';
  let fullPrefix = '';

  if (lower.includes('front')) {
    shortPrefix = 'FE';
    fullPrefix = 'FRONTEND';
  } else if (lower.includes('back')) {
    shortPrefix = 'BE';
    fullPrefix = 'BACKEND';
  } else if (lower.includes('full') || lower.includes('fullstack')) {
    shortPrefix = 'FS';
    fullPrefix = 'FULLSTACK';
  } else if (lower.includes('pyth')) {
    shortPrefix = 'PY';
    fullPrefix = 'PYTHON';
  } else if (lower.includes('java') && !lower.includes('script')) {
    shortPrefix = 'JAVA';
    fullPrefix = 'JAVA';
  } else if (lower.includes('script') || lower.includes('js')) {
    shortPrefix = 'JS';
    fullPrefix = 'JAVASCRIPT';
  } else if (lower.includes('react')) {
    shortPrefix = 'REACT';
    fullPrefix = 'REACT';
  } else if (lower.includes('arab')) {
    shortPrefix = 'AR';
    fullPrefix = 'ARAB';
  } else if (lower.includes('ingliz') || lower.includes('engl') || lower.includes('ielts') || lower.includes('cefr')) {
    shortPrefix = 'ENG';
    fullPrefix = 'ENGLISH';
  } else if (lower.includes('rus')) {
    shortPrefix = 'RUS';
    fullPrefix = 'RUSSIAN';
  } else if (lower.includes('korey') || lower.includes('korean')) {
    shortPrefix = 'KOR';
    fullPrefix = 'KOREAN';
  } else if (lower.includes('nemis') || lower.includes('german')) {
    shortPrefix = 'DE';
    fullPrefix = 'GERMAN';
  } else if (lower.includes('turk')) {
    shortPrefix = 'TR';
    fullPrefix = 'TURKISH';
  } else if (lower.includes('matem') || lower.includes('math')) {
    shortPrefix = 'MATH';
    fullPrefix = 'MATEMATIKA';
  } else if (lower.includes('fizik') || lower.includes('phys')) {
    shortPrefix = 'PHYS';
    fullPrefix = 'FIZIKA';
  } else if (lower.includes('kimyo') || lower.includes('chem')) {
    shortPrefix = 'CHEM';
    fullPrefix = 'KIMYO';
  } else if (lower.includes('biolog') || lower.includes('bio')) {
    shortPrefix = 'BIO';
    fullPrefix = 'BIOLOGIYA';
  } else if (lower.includes('dizayn') || lower.includes('design') || lower.includes('ui') || lower.includes('ux')) {
    shortPrefix = 'DSGN';
    fullPrefix = 'DESIGN';
  } else if (lower.includes('smm') || lower.includes('market')) {
    shortPrefix = 'SMM';
    fullPrefix = 'MARKETING';
  } else if (lower.includes('robot')) {
    shortPrefix = 'ROBO';
    fullPrefix = 'ROBOT';
  } else {
    // Dynamic rule based on words
    const words = trimmed
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .split(/\s+/)
      .filter(Boolean);

    if (words.length >= 2) {
      shortPrefix = words.slice(0, 3).map((w) => w[0].toUpperCase()).join('');
      fullPrefix = words[0].toUpperCase().slice(0, 8);
    } else if (words.length === 1) {
      const w = words[0].toUpperCase();
      shortPrefix = w.length <= 4 ? w : w.slice(0, 3);
      fullPrefix = w.slice(0, 8);
    } else {
      shortPrefix = 'CRS';
      fullPrefix = 'COURSE';
    }
  }

  // 2. Scan existing courses to find highest minor version (1.1, 1.2, 1.3...)
  const findNextVersion = (prefix) => {
    let maxMinor = 0;
    const cleanPrefix = prefix.toUpperCase();

    existingCourses.forEach((c) => {
      const cCode = (c.code || '').toUpperCase().trim();
      const regex = new RegExp(`^${cleanPrefix}[-_\\s]?(\\d+)\\.(\\d+)`, 'i');
      const match = cCode.match(regex);
      if (match) {
        const minor = parseInt(match[2], 10);
        if (!isNaN(minor) && minor > maxMinor) {
          maxMinor = minor;
        }
      }
    });

    return `1.${maxMinor + 1}`;
  };

  // Pure numeric minor version
  let maxPureNumericMinor = 0;
  existingCourses.forEach((c) => {
    const cCode = (c.code || '').trim();
    const match = cCode.match(/^(\d+)\.(\d+)$/);
    if (match) {
      const minor = parseInt(match[2], 10);
      if (!isNaN(minor) && minor > maxPureNumericMinor) {
        maxPureNumericMinor = minor;
      }
    }
  });
  const nextPureNumeric = `1.${maxPureNumericMinor + 1}`;

  const nextVerShort = findNextVersion(shortPrefix);
  const nextVerFull = findNextVersion(fullPrefix);

  const optionShort = `${shortPrefix}-${nextVerShort}`;
  const optionFull = `${fullPrefix}-${nextVerFull}`;
  const optionNumeric = nextPureNumeric;

  return [
    { label: optionShort, code: optionShort, desc: 'Tavsiya' },
    { label: optionFull, code: optionFull, desc: 'To‘liq' },
    { label: optionNumeric, code: optionNumeric, desc: 'Raqam' },
  ];
}

const courseSchema = z.object({
  name: z.string().min(2, 'Course name must be at least 2 characters'),
  code: z.string().min(2, 'Course code is required (e.g. FE-1.1)'),
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
  existingCourses = [],
  onSuccess,
}) {
  const { t } = useTranslation();
  const isEditing = Boolean(course?.id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoCode, setIsAutoCode] = useState(!isEditing);

  const allCourses = useMemo(() => {
    if (existingCourses && existingCourses.length > 0) return existingCourses;
    try {
      return localStore.getCourses() || [];
    } catch {
      return [];
    }
  }, [existingCourses]);

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
    return getCourseCodeSuggestions(watchedName, allCourses);
  }, [watchedName, allCourses]);

  useEffect(() => {
    if (course && isOpen) {
      setIsAutoCode(false);
      reset({
        name: course.name || '',
        code: course.code || '',
        description: course.description || '',
        monthlyFee: course.monthly_fee !== undefined ? course.monthly_fee : 0,
        color: course.color || '#123D78',
        isActive: course.is_active !== undefined ? course.is_active : true,
      });
    } else if (isOpen) {
      setIsAutoCode(true);
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

  const handleNameChange = (newName) => {
    if (isAutoCode) {
      const sugs = getCourseCodeSuggestions(newName, allCourses);
      if (sugs.length > 0) {
        setValue('code', sugs[0].code, { shouldValidate: true });
      }
    }
  };

  const handleSelectSuggestion = (codeVal) => {
    setValue('code', codeVal, { shouldValidate: true });
  };

  const handleToggleAutoCode = () => {
    const nextState = !isAutoCode;
    setIsAutoCode(nextState);
    if (nextState && suggestions.length > 0) {
      setValue('code', suggestions[0].code, { shouldValidate: true });
    }
  };

  const onSubmit = async (data) => {
    if (isSubmitting) return;
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
      title={isEditing ? t('courses.editCourse', 'Kursni tahrirlash') : t('courses.createCourse', 'Yangi kurs yaratish')}
      subtitle={
        isEditing
          ? t('courses.editSubtitle', 'Kurs parametrlari, oylik to‘lov va nishon rangini tahrirlash')
          : t('courses.createSubtitle', 'Yangi ta’lim yo‘nalishi yoki fanni o‘quv dasturiga qo‘shish')
      }
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Input
              label={t('courses.name', 'Kurs nomi')}
              icon={BookOpen}
              required
              placeholder="Masalan: Frontend, arab tili, Python..."
              error={errors.name?.message}
              {...register('name', {
                onChange: (e) => {
                  handleNameChange(e.target.value);
                },
              })}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                {t('courses.code', 'Kurs kodi')} <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleToggleAutoCode}
                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md transition-all cursor-pointer border ${
                  isAutoCode
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60 shadow-2xs'
                    : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                }`}
                title={isAutoCode ? 'Avtomatik kod faol (1.1, 1.2...)' : 'Avtomatik kod yaratish'}
              >
                <Sparkles className={`w-3 h-3 ${isAutoCode ? 'text-emerald-500' : 'text-gray-400'}`} />
                <span>{isAutoCode ? 'Avto faol' : 'Qo‘lda kiritish'}</span>
              </button>
            </div>
            <Input
              icon={Code}
              required
              placeholder="e.g. FE-1.1"
              error={errors.code?.message}
              {...register('code', {
                onChange: () => {
                  setIsAutoCode(false);
                },
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
          <div className="-mt-1 flex items-center gap-1.5 flex-wrap text-xs bg-emerald-500/5 dark:bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
            <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1 shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Avtomatik kodlar:</span>
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {suggestions.map((sug, idx) => {
                const isSelected = watchedCode === sug.code;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSuggestion(sug.code)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
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
            label={t('courses.fee', 'Oylik to‘lov summasi (so‘m)')}
            type="number"
            step="1000"
            icon={DollarSign}
            placeholder="Masalan: 600000"
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
              ${isActive ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-gray-700'}
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
