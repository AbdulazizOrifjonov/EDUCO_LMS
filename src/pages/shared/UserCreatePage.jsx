import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  User,
  Shield,
  Phone,
  GraduationCap,
  Users,
  KeyRound,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Plus,
  BookOpen,
  Save,
  X,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import DatePicker from '@/components/ui/DatePicker';
import TimePicker from '@/components/ui/TimePicker';
import PasswordStrengthInput, { evaluatePasswordStrength } from '@/components/ui/PasswordStrengthInput';
import { toast } from '@/components/ui/Toast';
import { createUser, updateUser, getUserById } from '@/services/userService';
import { getGroups, enrollStudent } from '@/services/groupService';
import { createStudentReminder } from '@/services/reminderService';
import { ROLES } from '@/lib/constants';
import { formatUzPhone, cleanUzPhone } from '@/utils/phoneFormat';

const userSchema = z.object({
  firstName: z.string().min(2, 'Ism kamida 2 ta harfdan iborat bo‘lishi kerak'),
  lastName: z.string().min(2, 'Familiya kamida 2 ta harfdan iborat bo‘lishi kerak'),
  phone: z.string().optional().or(z.literal('')),
  fatherPhone: z.string().optional().or(z.literal('')),
  motherPhone: z.string().optional().or(z.literal('')),
  role: z.enum([ROLES.OWNER, ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
  isActive: z.boolean().default(true),
  password: z.string().optional().or(z.literal('')),
  // Reminder fields
  hasReminder: z.boolean().default(false),
  reminderDate: z.string().optional().or(z.literal('')),
  reminderTime: z.string().optional().or(z.literal('')),
  reminderNote: z.string().optional().or(z.literal('')),
});

export default function UserCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id } = useParams();
  const { profile } = useAuth();
  const currentUserRole = profile?.role || ROLES.OWNER;
  const isTeacher = currentUserRole === ROLES.TEACHER;

  const isEditing = Boolean(id);
  const defaultRoleFromQuery = isTeacher ? ROLES.STUDENT : (searchParams.get('role') || ROLES.STUDENT);

  const [groupsList, setGroupsList] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(searchParams.get('groupId') || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default reminder date to 3 days from now
  const getDefaultReminderDate = (daysAhead = 3) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split('T')[0];
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '+998 ',
      fatherPhone: '+998 ',
      motherPhone: '+998 ',
      role: defaultRoleFromQuery,
      isActive: true,
      password: '',
      hasReminder: !isTeacher && defaultRoleFromQuery === ROLES.STUDENT,
      reminderDate: getDefaultReminderDate(3),
      reminderTime: '15:00',
      reminderNote: 'Dars 3 kundan keyin boshlanishi haqida xabar berish va jadvalni tasdiqlash',
    },
  });

  const selectedRole = watch('role');
  const isActive = watch('isActive');
  const phoneValue = watch('phone');
  const fatherPhoneValue = watch('fatherPhone');
  const motherPhoneValue = watch('motherPhone');
  const passwordValue = watch('password');
  const hasReminder = watch('hasReminder');
  const reminderDateValue = watch('reminderDate');

  const loadGroups = async () => {
    try {
      const res = await getGroups({ status: 'active', limit: 100 });
      let list = res.groups || [];
      if (isTeacher) {
        // Teacher sees ONLY their assigned groups
        const teacherId = profile?.id;
        const teacherName = (profile?.first_name || profile?.full_name || '').toLowerCase();
        list = list.filter((g) => {
          if (g.teacher_id && g.teacher_id === teacherId) return true;
          if (g.teacherId && g.teacherId === teacherId) return true;
          if (teacherName && (g.teacherName || g.teacher_name || '').toLowerCase().includes(teacherName)) return true;
          return false;
        });
      }
      setGroupsList(list);

      // Pre-select group if query param groupId exists or if teacher has only 1 group
      const qGroup = searchParams.get('groupId');
      if (qGroup && list.some((g) => g.id === qGroup)) {
        setSelectedGroupId(qGroup);
      } else if (isTeacher && list.length === 1 && !selectedGroupId) {
        setSelectedGroupId(list[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadGroups();
  }, [profile?.id, isTeacher]);

  // If editing, load user details
  useEffect(() => {
    if (isEditing && id) {
      getUserById(id)
        .then((u) => {
          if (u) {
            reset({
              firstName: u.first_name || '',
              lastName: u.last_name || '',
              phone: formatUzPhone(u.phone || ''),
              fatherPhone: formatUzPhone(u.father_phone || u.fatherPhone || ''),
              motherPhone: formatUzPhone(u.mother_phone || u.motherPhone || ''),
              role: u.role || ROLES.STUDENT,
              isActive: u.is_active !== undefined ? u.is_active : true,
              password: u.password || '',
              hasReminder: false,
              reminderDate: getDefaultReminderDate(3),
              reminderTime: '15:00',
              reminderNote: '',
            });
          }
        })
        .catch(() => {
          toast.error('Foydalanuvchini yuklab bo‘lmadi');
        });
    }
  }, [isEditing, id, reset]);

  // Set quick days preset
  const handleSetPresetDays = (days) => {
    setValue('reminderDate', getDefaultReminderDate(days));
    setValue(
      'reminderNote',
      `Dars ${days} kundan keyin boshlanishi haqida xabar berish va jadvalni tasdiqlash`
    );
  };



  const onSubmit = async (data) => {
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

    // Validate password
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
        await updateUser(id, {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: cleanPhone,
          fatherPhone: cleanFather,
          motherPhone: cleanMother,
          role: data.role,
          isActive: data.isActive,
          password: trimmedPwd || undefined,
        });
        toast.success('Foydalanuvchi ma‘lumotlari muvaffaqiyatli yangilandi!');
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

        // 1. Group enrollment if selected
        if (data.role === ROLES.STUDENT && selectedGroupId && createdUser?.id) {
          try {
            await enrollStudent(selectedGroupId, createdUser.id);
          } catch (e) {
            console.warn('Enrollment note:', e);
          }
        }

        // 2. Schedule Reminder if requested
        if (data.role === ROLES.STUDENT && data.hasReminder && data.reminderDate) {
          const selectedGroupObj = groupsList.find((g) => g.id === selectedGroupId);
          await createStudentReminder({
            student_id: createdUser?.id,
            student_name: `${data.firstName} ${data.lastName}`.trim(),
            student_phone: cleanPhone,
            father_phone: cleanFather,
            mother_phone: cleanMother,
            group_id: selectedGroupId || '',
            group_name: selectedGroupObj?.name || 'Guruhsiz',
            course_name: selectedGroupObj?.courseName || '',
            due_date: data.reminderDate,
            due_time: data.reminderTime || '15:00',
            note: data.reminderNote || 'Dars boshlanishi haqida xabar berish',
            status: 'pending',
          });
          toast.info(`⏰ ${data.reminderDate} sanasiga eslatma belgilandi!`);
        }

        toast.success('Yangi a‘zo muvaffaqiyatli ro‘yxatdan o‘tkazildi!');
      }

      if (isTeacher) {
        navigate('/teacher/dashboard');
      } else {
        navigate(`/${currentUserRole}/users`);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (isTeacher) {
      navigate('/teacher/dashboard');
    } else {
      navigate(`/${currentUserRole}/users`);
    }
  };

  const getRoleHeaderInfo = () => {
    if (isTeacher) {
      return {
        title: "🎓 Guruhga yangi o‘quvchi qo‘shish",
        subtitle: "O‘quvchi ma‘lumotlarini to‘ldiring, guruhingizga biriktiring va shaxsiy LMS hisobini yarating",
        badge: "O‘QITUVCHI KABINETI",
        badgeColor: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
      };
    }
    switch (selectedRole) {
      case ROLES.STUDENT:
        return {
          title: "🎓 Yangi o'quvchi ro'yxatdan o'tkazish",
          subtitle: "O'quvchini tizimga kiritish, ota-onasi kontaktlari, o'quv guruhi va dars kuni eslatmasi",
          badge: "O'QUVCHI KABINETI",
          badgeColor: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
        };
      case ROLES.TEACHER:
        return {
          title: "👨‍🏫 Yangi o'qituvchi qo'shish",
          subtitle: "O'qituvchi profili, telefon raqami va dars jadvallarini boshqarish uchun shaxsiy kabinet",
          badge: "O'QITUVCHI KABINETI",
          badgeColor: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
        };
      case ROLES.ADMIN:
        return {
          title: "🛡️ Yangi administrator qo'shish",
          subtitle: "O'quv markaz ma'muri, talabalar va guruhlarni boshqarish huquqiga ega hisob",
          badge: "ADMINISTRATOR KABINETI",
          badgeColor: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30",
        };
      default:
        return {
          title: "Foydalanuvchi yaratish",
          subtitle: "Yangi akkaunt ma'lumotlarini to'ldiring",
          badge: "YANGI HISOB",
          badgeColor: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border-emerald-500/30",
        };
    }
  };

  const roleInfo = getRoleHeaderInfo();

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-12 animate-fade-in">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
        <div>
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors mb-2 cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>
              {isTeacher
                ? "O‘qituvchi boshqaruv paneliga qaytish"
                : "Foydalanuvchilar ro‘yxatiga qaytish"}
            </span>
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              {isEditing ? "Foydalanuvchini tahrirlash" : roleInfo.title}
            </h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${roleInfo.badgeColor}`}>
              {roleInfo.badge}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            {roleInfo.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button variant="ghost" onClick={handleBack} disabled={isSubmitting}>
            Bekor qilish
          </Button>
          <Button
            type="button"
            variant="primary"
            icon={Save}
            isLoading={isSubmitting}
            onClick={handleSubmit(onSubmit)}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white shadow-md shadow-blue-600/30 dark:shadow-emerald-600/30 ring-1 ring-blue-400/40 dark:ring-emerald-400/40"
          >
            {isEditing ? "O'zgarishlarni saqlash" : "Ro'yxatdan o'tkazish"}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Role Selector Card (If not editing and NOT teacher) */}
        {!isEditing && !isTeacher && (
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-brand-navy dark:text-blue-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                Foydalanuvchi roli
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Student Role Card */}
              <button
                type="button"
                onClick={() => setValue('role', ROLES.STUDENT)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  selectedRole === ROLES.STUDENT
                    ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 ring-2 ring-emerald-400/50 shadow-md'
                    : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark-secondary hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  {selectedRole === ROLES.STUDENT && (
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                    🎓 O‘quvchi (Talaba)
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Ota-onasi raqamlari, guruh va dars eslatmasi bilan
                  </p>
                </div>
              </button>

              {/* Teacher Role Card */}
              <button
                type="button"
                onClick={() => setValue('role', ROLES.TEACHER)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  selectedRole === ROLES.TEACHER
                    ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/30 ring-2 ring-amber-400/50 shadow-md'
                    : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark-secondary hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                    <Users className="w-5 h-5" />
                  </div>
                  {selectedRole === ROLES.TEACHER && (
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                    👨‍🏫 O‘qituvchi (Ustoz)
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Guruhlarni o‘qitish, baholash va davomat qilish huquqi
                  </p>
                </div>
              </button>

              {/* Admin Role Card (Owner only) */}
              {currentUserRole === ROLES.OWNER && (
                <button
                  type="button"
                  onClick={() => setValue('role', ROLES.ADMIN)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    selectedRole === ROLES.ADMIN
                      ? 'border-purple-500 bg-purple-50/60 dark:bg-purple-950/30 ring-2 ring-purple-400/50 shadow-md'
                      : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark-secondary hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                      <Shield className="w-5 h-5" />
                    </div>
                    {selectedRole === ROLES.ADMIN && (
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                      🛡️ Administrator
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Foydalanuvchilar, guruhlar va tizimni boshqarish huquqi
                    </p>
                  </div>
                </button>
              )}
            </div>
          </Card>
        )}

        {/* Teacher Panel Friendly Card */}
        {isTeacher && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/5 border border-emerald-500/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                  O‘qituvchi tomonidan talaba ro‘yxatga olish
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Ushbu o‘quvchi to‘g‘ridan-to‘g‘ri sizning guruhingizga biriktiriladi va unga shaxsiy LMS paroli beriladi
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 shrink-0 hidden sm:inline-block">
              O‘QUVCHI
            </span>
          </div>
        )}

        {/* Section 1: Shaxsiy Ma'lumotlar */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                1. Asosiy shaxsiy ma'lumotlar
              </h2>
            </div>
            {/* Status Switch */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Faol holat:</span>
              <button
                type="button"
                onClick={() => setValue('isActive', !isActive)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isActive ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Ism"
              icon={User}
              required
              placeholder="Masalan: Abdulaziz"
              error={errors.firstName?.message}
              {...register('firstName')}
            />
            <Input
              label="Familiya"
              icon={User}
              required
              placeholder="Masalan: Orifjonov"
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>
        </Card>

        {/* Section 2: Aloqa va Ota-onasi raqamlari */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
            <Phone className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
              2. Aloqa va LMS kabinetga kirish raqamlari
            </h2>
          </div>

          {selectedRole === ROLES.STUDENT ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50 flex items-start gap-2.5">
                <Users className="w-4 h-4 text-emerald-700 dark:text-emerald-400 mt-0.5 shrink-0" />
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  <span className="font-bold text-gray-900 dark:text-white">Muhim:</span> Otasining yoki onasining telefon raqami o‘quvchining shaxsiy LMS kabinetiga kirish logini bo‘lib xizmat qiladi. Kamida bittasini to‘liq kiriting.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Otasining telefon raqami"
                  icon={Phone}
                  isPhone
                  placeholder="+998 90 123 45 67"
                  value={fatherPhoneValue}
                  onChange={(e) => setValue('fatherPhone', formatUzPhone(e.target.value))}
                  error={errors.fatherPhone?.message}
                />
                <Input
                  label="Onasining telefon raqami"
                  icon={Phone}
                  isPhone
                  placeholder="+998 90 765 43 21"
                  value={motherPhoneValue}
                  onChange={(e) => setValue('motherPhone', formatUzPhone(e.target.value))}
                  error={errors.motherPhone?.message}
                />
              </div>

              <Input
                label="O‘quvchining shaxsiy telefon raqami (Ixtiyoriy)"
                icon={Phone}
                isPhone
                placeholder="+998 93 582 17 74"
                value={phoneValue}
                onChange={(e) => setValue('phone', formatUzPhone(e.target.value))}
                error={errors.phone?.message}
              />
            </div>
          ) : (
            <div>
              <Input
                label="Telefon raqami (LMS kabinetga kirish logini)"
                icon={Phone}
                isPhone
                required
                placeholder="+998 90 123 45 67"
                value={phoneValue}
                onChange={(e) => setValue('phone', formatUzPhone(e.target.value))}
                error={errors.phone?.message}
              />
            </div>
          )}
        </Card>

        {/* Section 3: LMS Kabinetga kirish paroli */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                3. LMS Kabinetga kirish paroli
              </h2>
            </div>
            <span className="text-xs text-gray-400">
              Ushbu parol bilan foydalanuvchi tizimga kiradi
            </span>
          </div>

          <PasswordStrengthInput
            label="Yangi parol"
            required={!isEditing}
            value={passwordValue || ''}
            onValueChange={(val) => setValue('password', val, { shouldValidate: true })}
            placeholder="Masalan: Educo#2026!"
            error={errors.password?.message}
          />
        </Card>

        {/* Section 4: O'quv guruhiga biriktirish (Student only) */}
        {selectedRole === ROLES.STUDENT && (
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-800 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                  4. O‘quv guruhi va Yo‘nalish
                </h2>
              </div>
              {/* "+ Yangi guruh ochish" button */}
              {!isTeacher && (
                <button
                  type="button"
                  onClick={() => navigate(`/${currentUserRole}/groups/create`)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Yangi guruh ochish</span>
                </button>
              )}
            </div>

            <div className="space-y-3">
              <Select
                label={isTeacher ? "Sizning o‘quv guruhingiz" : "O‘quv guruhini tanlang"}
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                placeholder="Guruhsiz (Keyinroq biriktirish)"
                headerTitle="Mavjud o‘quv guruhlari"
                icon={BookOpen}
                size="md"
                options={[
                  { value: '', label: 'Guruhsiz (Hozircha guruh biriktirilmasin)', subtitle: 'Keyinroq biriktiriladi' },
                  ...groupsList.map((g) => ({
                    value: g.id,
                    label: g.name,
                    subtitle: `${g.courseName || g.course_name || 'Kurs'} • Ustoz: ${g.teacherName || g.teacher_name || 'Noma‘lum'}`,
                    badge: `${g.enrolled_count || g.studentCount || 0}/${g.capacity} ta talaba`,
                    color: g.color || '#064e3b',
                  })),
                ]}
              />

              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isTeacher
                  ? "O‘quvchi ro‘yxatga olingandan so‘ng ushbu tanlangan guruh darslarida va davomatida avtomatik paydo bo‘ladi."
                  : "Agar o‘quvchi uchun mos guruh hali ochilmagan bo‘lsa, yuqoridagi «+ Yangi guruh ochish» tugmasini bosing yoki guruhsiz qoldiring."}
              </p>
            </div>
          </Card>
        )}

        {/* Section 5: ⏰ Dars kuni / Qayta bog'lanish eslatmasi (Admin Reminder) */}
        {selectedRole === ROLES.STUDENT && !isEditing && !isTeacher && (
          <Card className="p-5 border-2 border-amber-300 dark:border-amber-900/50 bg-amber-50/20 dark:bg-amber-950/10">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-amber-200/80 dark:border-amber-900/50 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                    5. ⏰ Dars kuni va Qayta bog‘lanish eslatmasi (Admin uchun)
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    O‘quvchiga dars boshlanish sanasini aytish yoki sinov darsini eslatish bildirishnomasi
                  </p>
                </div>
              </div>

              {/* Reminder Switch */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  {hasReminder ? "Eslatma yoqilgan" : "Eslatmani yoqish"}
                </span>
                <input
                  type="checkbox"
                  checked={hasReminder}
                  onChange={(e) => setValue('hasReminder', e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 accent-amber-600 cursor-pointer"
                />
              </label>
            </div>

            {hasReminder && (
              <div className="space-y-4 pt-2">
                {/* Quick Presets */}
                <div>
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">
                    Tezkor sana tanlash:
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSetPresetDays(1)}
                      className="px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-surface-dark text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition-colors cursor-pointer shadow-2xs"
                    >
                      Ertaga (+1 kun)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetPresetDays(3)}
                      className="px-3 py-1.5 rounded-xl border border-amber-400 dark:border-amber-700 bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors cursor-pointer shadow-sm"
                    >
                      3 kundan keyin (+3 kun)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetPresetDays(5)}
                      className="px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-surface-dark text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition-colors cursor-pointer shadow-2xs"
                    >
                      5 kundan keyin (+5 kun)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetPresetDays(7)}
                      className="px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-surface-dark text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition-colors cursor-pointer shadow-2xs"
                    >
                      1 haftadan keyin (+7 kun)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Date Input with Custom Adaptive Calendar */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-600" />
                      <span>Eslatma sanasi (Kalendar)</span>
                    </label>
                    <DatePicker
                      value={watch('reminderDate')}
                      onChange={(val) => setValue('reminderDate', val, { shouldDirty: true })}
                      placeholder="Eslatma sanasini tanlang..."
                      className="w-full"
                    />
                  </div>

                  {/* Time Input */}
                  <div className="flex flex-col gap-1.5">
                    <TimePicker
                      label="Eslatma vaqti (Toshkent vaqti)"
                      value={watch('reminderTime') || '10:00'}
                      onChange={(val) => setValue('reminderTime', val, { shouldValidate: true, shouldDirty: true })}
                    />
                  </div>
                </div>

                {/* Reminder Note */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Eslatma maqsadi / Qo‘ng‘iroq sababi
                  </label>
                  <input
                    type="text"
                    placeholder="Masalan: Dars boshlanishi haqida xabar berish va 1-darsga taklif qilish"
                    {...register('reminderNote')}
                    className="w-full h-11 px-3.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-surface-dark-secondary text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  <p className="text-[11px] text-gray-500">
                    🔔 Ushbu belgilangan kun va vaqt kelganda sizga yuqori navbarda doimiy ko‘rinadigan miltillovchi xabarnoma chiqib turadi («Gaplashildi» deb belgilanmagunicha).
                  </p>
                </div>
              </div>
            )}
          </Card>
        )}

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
            {isEditing ? "O'zgarishlarni saqlash" : "Ro'yxatdan o'tkazish va Saqlash"}
          </Button>
        </div>
      </form>

    </div>
  );
}
