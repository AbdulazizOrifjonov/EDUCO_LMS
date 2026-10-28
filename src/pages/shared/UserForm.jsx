import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { KeyRound, Shield, User, Phone, RefreshCw, Users, GraduationCap } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import PasswordStrengthInput, { evaluatePasswordStrength } from '@/components/ui/PasswordStrengthInput';
import { toast } from '@/components/ui/Toast';
import { createUser, updateUser } from '@/services/userService';
import { getGroups, enrollStudent } from '@/services/groupService';
import { ROLES } from '@/lib/constants';
import { formatUzPhone, cleanUzPhone } from '@/utils/phoneFormat';

const createUserSchema = () =>
  z.object({
    firstName: z.string().min(2, 'Ism kamida 2 ta harfdan iborat bo‘lishi kerak'),
    lastName: z.string().min(2, 'Familiya kamida 2 ta harfdan iborat bo‘lishi kerak'),
    phone: z.string().optional().or(z.literal('')),
    fatherPhone: z.string().optional().or(z.literal('')),
    motherPhone: z.string().optional().or(z.literal('')),
    role: z.enum([ROLES.OWNER, ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
    isActive: z.boolean().default(true),
    password: z.string().optional().or(z.literal('')),
  });

export default function UserForm({
  isOpen,
  onClose,
  user = null,
  currentUserRole = 'owner',
  defaultRole = null,
  onSuccess,
}) {
  const { t } = useTranslation();
  const isEditing = Boolean(user?.id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [groupsList, setGroupsList] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');

  const schema = createUserSchema(isEditing);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '+998 ',
      fatherPhone: '+998 ',
      motherPhone: '+998 ',
      role: defaultRole || ROLES.STUDENT,
      isActive: true,
      password: '',
    },
  });

  const isActive = watch('isActive');
  const selectedRole = watch('role');
  const phoneValue = watch('phone');
  const fatherPhoneValue = watch('fatherPhone');
  const motherPhoneValue = watch('motherPhone');
  const passwordValue = watch('password');

  // Load active groups for student enrollment
  useEffect(() => {
    if (isOpen) {
      getGroups({ status: 'active', limit: 100 })
        .then((res) => setGroupsList(res.groups || []))
        .catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (user && isOpen) {
      reset({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        phone: formatUzPhone(user.phone || ''),
        fatherPhone: formatUzPhone(user.father_phone || user.fatherPhone || ''),
        motherPhone: formatUzPhone(user.mother_phone || user.motherPhone || ''),
        role: user.role || ROLES.STUDENT,
        isActive: user.is_active !== undefined ? user.is_active : true,
        password: user.password || '',
      });
      setSelectedGroupId('');
    } else if (isOpen) {
      const initialRole = defaultRole || (currentUserRole === 'admin' ? ROLES.STUDENT : ROLES.TEACHER);
      reset({
        firstName: '',
        lastName: '',
        phone: '+998 ',
        fatherPhone: '+998 ',
        motherPhone: '+998 ',
        role: initialRole,
        isActive: true,
        password: '',
      });
      setSelectedGroupId('');
    }
  }, [user, isOpen, reset, currentUserRole, defaultRole]);

  // Determine selectable roles (Owner is unique — even Owner cannot create another Owner)
  const selectableRoles =
    currentUserRole === 'owner'
      ? [
          { value: ROLES.ADMIN, label: t('roles.admin', 'Administrator') },
          { value: ROLES.TEACHER, label: t('roles.teacher', "O'qituvchi") },
          { value: ROLES.STUDENT, label: t('roles.student', 'Talaba') },
        ]
      : [
          { value: ROLES.TEACHER, label: t('roles.teacher', "O'qituvchi") },
          { value: ROLES.STUDENT, label: t('roles.student', 'Talaba') },
        ];

  const onSubmit = async (data) => {
    if (isSubmitting) return;
    if (!isEditing && data.role === ROLES.OWNER) {
      toast.error('Tizimda faqat 1 ta Boshliq (Owner) bo‘lishi mumkin!');
      return;
    }

    const cleanPhone = cleanUzPhone(data.phone);
    const cleanFather = cleanUzPhone(data.fatherPhone);
    const cleanMother = cleanUzPhone(data.motherPhone);

    // Validate phone number
    if (data.role === ROLES.STUDENT) {
      const hasPhone = Boolean(cleanFather || cleanMother || cleanPhone);
      if (!hasPhone) {
        toast.error(t('users.atLeastOneParentPhone', 'Otasining yoki onasining telefon raqamini kiritish shart'));
        return;
      }
    } else {
      if (!cleanPhone) {
        toast.error(t('users.phoneRequiredForLogin', 'Login uchun telefon raqamini to‘liq kiriting!'));
        return;
      }
    }

    // Validate password & strength
    const trimmedPwd = (data.password || '').trim();
    if (!isEditing && !trimmedPwd) {
      toast.error(t('users.passwordRequired', 'Kabinetga kirish uchun parol kiritish shart!'));
      return;
    }

    if (trimmedPwd && trimmedPwd.length < 6) {
      toast.error(t('users.passwordTooShort', 'Parol kamida 6 ta belgidan iborat bo‘lishi kerak!'));
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await updateUser(user.id, {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: cleanPhone,
          fatherPhone: cleanFather,
          motherPhone: cleanMother,
          role: data.role,
          isActive: data.isActive,
          password: trimmedPwd || undefined,
        });
        toast.success(t('users.updateSuccess', 'Foydalanuvchi ma‘lumotlari yangilandi!'));
      } else {
        const createdUser = await createUser({
          firstName: data.firstName,
          lastName: data.lastName,
          phone: cleanPhone,
          fatherPhone: cleanFather,
          motherPhone: cleanMother,
          role: data.role,
          isActive: data.isActive,
          password: trimmedPwd,
        });

        if (data.role === ROLES.STUDENT && selectedGroupId && createdUser?.id) {
          try {
            await enrollStudent(selectedGroupId, createdUser.id);
            toast.success(t('users.studentCreatedAndEnrolled', "Yangi o‘quvchi yaratildi va guruhga biriktirildi!"));
          } catch (enrollErr) {
            console.warn('Auto enrollment note:', enrollErr);
            toast.success(t('users.createSuccess', 'Yangi foydalanuvchi yaratildi!'));
          }
        } else {
          toast.success(t('users.createSuccess', 'Yangi foydalanuvchi muvaffaqiyatli yaratildi!'));
        }
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.message || t('common.error', 'Operation failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEditing
          ? t('users.editUser', 'Foydalanuvchini tahrirlash')
          : selectedRole === ROLES.ADMIN
          ? t('users.createAdmin', 'Administrator qo‘shish')
          : selectedRole === ROLES.STUDENT
          ? t('users.createStudent', "Yangi o'quvchi qo'shish")
          : selectedRole === ROLES.TEACHER
          ? t('users.createTeacher', "Yangi o'qituvchi qo'shish")
          : t('users.createUser', 'Foydalanuvchi yaratish')
      }
      subtitle={
        isEditing
          ? t('users.editSubtitle', 'Foydalanuvchi profili, paroli va huquqlarini tahrirlash')
          : selectedRole === ROLES.STUDENT
          ? t('users.createStudentSubtitle', "O'quvchini tizimga kiritish va o'quv guruhiga biriktirish")
          : t('users.createSubtitle', 'EDUCO LMS tizimiga yangi a‘zo qo‘shish')
      }
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t('common.firstName', 'Ism')}
            icon={User}
            required
            placeholder="Masalan: Lola"
            error={errors.firstName?.message}
            {...register('firstName')}
          />
          <Input
            label={t('common.lastName', 'Familiya')}
            icon={User}
            required
            placeholder="Masalan: Jalolova"
            error={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>

        {/* Role Selector */}
        {!(isEditing && user?.role === ROLES.OWNER) && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              {t('users.role', 'Rol')} <span className="text-brand-red">*</span>
            </label>
            <div className={`grid grid-cols-2 ${selectableRoles.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-2`}>
              {selectableRoles.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setValue('role', r.value)}
                  className={`
                    flex items-center justify-center gap-2 p-2.5 rounded-xl border text-sm font-medium transition-all
                    ${
                      selectedRole === r.value
                        ? 'border-brand-navy bg-brand-navy/10 text-brand-navy dark:bg-brand-navy/30 dark:text-blue-300 font-semibold ring-2 ring-brand-navy/20'
                        : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-surface-dark-tertiary'
                    }
                  `}
                >
                  <Shield className="w-4 h-4 shrink-0" />
                  <span className="capitalize">{r.label}</span>
                </button>
              ))}
            </div>
            {errors.role && (
              <p className="text-xs text-brand-red font-medium">{errors.role.message}</p>
            )}
          </div>
        )}

        {/* Phone & Login Credentials Section */}
        {selectedRole === ROLES.STUDENT ? (
          <div className="p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-900/40 bg-emerald-50/60 dark:bg-emerald-950/20 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              <Users className="w-4 h-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
              <span>{t('users.parentsContact', "Ota-onasi bilan bog'lanish va Login raqami")}</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {t('users.parentPhoneNote', "Otasining yoki onasining (yoki ikkalasining) telefon raqamini kiriting")}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('users.fatherPhone', "Otasining telefon raqami")}
                icon={Phone}
                isPhone
                value={fatherPhoneValue}
                onChange={(e) => setValue('fatherPhone', formatUzPhone(e.target.value))}
                error={errors.fatherPhone?.message}
              />
              <Input
                label={t('users.motherPhone', "Onasining telefon raqami")}
                icon={Phone}
                isPhone
                value={motherPhoneValue}
                onChange={(e) => setValue('motherPhone', formatUzPhone(e.target.value))}
                error={errors.motherPhone?.message}
              />
            </div>
            <Input
              label={t('users.studentPhoneOptional', "O'quvchining shaxsiy telefoni (Login uchun, ixtiyoriy)")}
              icon={Phone}
              isPhone
              value={phoneValue}
              onChange={(e) => setValue('phone', formatUzPhone(e.target.value))}
              error={errors.phone?.message}
            />
          </div>
        ) : (
          <Input
            label={t('users.loginPhone', 'Telefon raqami (LMS kabinetga kirish logini)')}
            icon={Phone}
            isPhone
            required
            value={phoneValue}
            onChange={(e) => setValue('phone', formatUzPhone(e.target.value))}
            error={errors.phone?.message}
          />
        )}

        {/* Password with Live Strength Meter (Red -> Orange -> Green) for ALL roles */}
        <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-surface-dark-tertiary/30">
          <PasswordStrengthInput
            label={t('users.cabinetPassword', 'LMS kabinetga kirish paroli')}
            required={!isEditing}
            value={passwordValue || ''}
            onValueChange={(val) => setValue('password', val, { shouldValidate: true })}
            placeholder="Masalan: Lola#2026!"
            error={errors.password?.message}
          />
        </div>

        {/* Group Assignment (for Student role) */}
        {selectedRole === ROLES.STUDENT && !isEditing && (
          <div className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-surface-dark-tertiary/30">
            <Select
              label={t('users.assignToGroup', "O'quv guruhiga biriktirish")}
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              placeholder={t('users.unassignedGroup', "Guruhsiz (keyinroq biriktirish)")}
              headerTitle={t('groups.title', 'O‘quv guruhlari')}
              icon={GraduationCap}
              size="sm"
              options={[
                { value: '', label: t('users.unassignedGroup', "Guruhsiz (keyinroq biriktirish)") },
                ...groupsList.map((g) => ({
                  value: g.id,
                  label: g.name,
                  subtitle: g.courseName || g.course_name || 'Kurs fani',
                  badge: `${g.studentCount || g.enrolled_count || 0}/${g.capacity} ta o‘quvchi`,
                  color: g.color || g.courseColor || '#064e3b',
                })),
              ]}
            />
          </div>
        )}

        {/* Status Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-surface-dark-tertiary/40">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {t('common.status', 'Holat')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isActive
                ? t('users.statusActiveDesc', 'Foydalanuvchi tizimga erkin kira oladi')
                : t('users.statusInactiveDesc', 'Foydalanuvchi tizimga kirishi vaqtincha to‘xtatilgan')}
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

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel', 'Bekor qilish')}
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {isEditing ? t('common.save', 'Saqlash') : t('common.create', 'Yaratish')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

