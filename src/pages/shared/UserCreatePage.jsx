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
  Check,
  AlertCircle,
  Plus,
  BookOpen,
  Save,
  X,
  Wallet,
  Coins,
  Percent,
  Tag,
  BadgeCheck,
  ArrowRight,
  RefreshCw,
  Trash2,
  AlertTriangle,
  ChevronDown,
  Layers,
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
import { getGroups, enrollStudent, updateStudentDiscount } from '@/services/groupService';
import { createStudentReminder } from '@/services/reminderService';
import { getCourses, createCourse } from '@/services/courseService';
import { ROLES } from '@/lib/constants';
import { formatUzPhone, cleanUzPhone } from '@/utils/phoneFormat';

/**
 * Parses schedule strings like "Dush-Chor-Jum, 09:30 - 11:00"
 * Returns active days and time minutes from midnight for conflict detection.
 */
function parseSchedule(scheduleStr) {
  if (!scheduleStr) return null;
  const s = String(scheduleStr).toLowerCase();
  const days = [];
  if (s.includes('dush') || s.includes('mon')) days.push('mon');
  if (s.includes('sesh') || s.includes('tue')) days.push('tue');
  if (s.includes('chor') || s.includes('wed')) days.push('wed');
  if (s.includes('pay') || s.includes('thu')) days.push('thu');
  if (s.includes('jum') || s.includes('fri')) days.push('fri');
  if (s.includes('shan') || s.includes('sat')) days.push('sat');
  if (s.includes('yak') || s.includes('sun')) days.push('sun');

  const timeMatch = s.match(/(\d{1,2})[:.](\d{2})\s*[-—–]\s*(\d{1,2})[:.](\d{2})/);
  let startMin = null;
  let endMin = null;
  if (timeMatch) {
    startMin = parseInt(timeMatch[1], 10) * 60 + parseInt(timeMatch[2], 10);
    endMin = parseInt(timeMatch[3], 10) * 60 + parseInt(timeMatch[4], 10);
  }
  return { days, startMin, endMin, raw: scheduleStr };
}

function hasScheduleConflict(sched1, sched2) {
  const p1 = parseSchedule(sched1);
  const p2 = parseSchedule(sched2);
  if (!p1 || !p2) return false;
  const sharedDays = p1.days.filter((d) => p2.days.includes(d));
  if (sharedDays.length === 0) return false;
  if (p1.startMin !== null && p1.endMin !== null && p2.startMin !== null && p2.endMin !== null) {
    return Math.max(p1.startMin, p2.startMin) < Math.min(p1.endMin, p2.endMin);
  }
  return true;
}

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
  const isOwnerOrAdmin = currentUserRole === ROLES.OWNER || currentUserRole === ROLES.ADMIN;

  const isEditing = Boolean(id);
  const defaultRoleFromQuery = isTeacher ? ROLES.STUDENT : (searchParams.get('role') || ROLES.STUDENT);

  const [groupsList, setGroupsList] = useState([]);
  const [enrolledGroupIds, setEnrolledGroupIds] = useState(() => {
    const qGroup = searchParams.get('groupId');
    return qGroup ? [qGroup] : [];
  });
  const [initialGroupIds, setInitialGroupIds] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(searchParams.get('groupId') || '');
  const [originalGroupId, setOriginalGroupId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Group quick action state (Schedule, Teacher, Course switcher drawers per group card)
  const [activeGroupAction, setActiveGroupAction] = useState({ groupId: null, type: null });
  // Add another group drawer & course filter
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [filterCourseForAdd, setFilterCourseForAdd] = useState('all');

  // Teacher direction / Course selection & inline creation
  const [coursesList, setCoursesList] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [isCreatingInlineCourse, setIsCreatingInlineCourse] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseFee, setNewCourseFee] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [isSavingCourse, setIsSavingCourse] = useState(false);

  // Student Tuition & Discount Pricing State (Owner & Admin only)
  const [tuitionPricingMode, setTuitionPricingMode] = useState('standard'); // 'standard' | 'custom' | 'percent' | 'amount' | 'free'
  const [customTuitionPrice, setCustomTuitionPrice] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [discountReason, setDiscountReason] = useState('');

  // Selected & Enrolled group objects
  const enrolledGroupObjs = React.useMemo(() => {
    return enrolledGroupIds
      .map((gid) => groupsList.find((g) => g.id === gid))
      .filter(Boolean);
  }, [enrolledGroupIds, groupsList]);

  const selectedGroupObj = groupsList.find((g) => g.id === (enrolledGroupIds[0] || selectedGroupId));
  const originalGroupObj = groupsList.find((g) => g.id === (initialGroupIds[0] || originalGroupId));

  // Base monthly fee: sum of all enrolled groups, or fallback single group price
  const baseFee = React.useMemo(() => {
    if (enrolledGroupObjs.length > 0) {
      return enrolledGroupObjs.reduce((acc, g) => acc + Number(g.monthly_price || g.price || 500000), 0);
    }
    return Number(selectedGroupObj?.monthly_price || selectedGroupObj?.price || 500000);
  }, [enrolledGroupObjs, selectedGroupObj]);

  // Live Schedule Conflicts Detection across enrolled groups
  const scheduleConflicts = React.useMemo(() => {
    const clashes = [];
    for (let i = 0; i < enrolledGroupObjs.length; i++) {
      for (let j = i + 1; j < enrolledGroupObjs.length; j++) {
        const gA = enrolledGroupObjs[i];
        const gB = enrolledGroupObjs[j];
        const schedA = gA.schedule_days || gA.schedule || '';
        const schedB = gB.schedule_days || gB.schedule || '';
        if (schedA && schedB && hasScheduleConflict(schedA, schedB)) {
          clashes.push({ gA, gB, schedA, schedB });
        }
      }
    }
    return clashes;
  }, [enrolledGroupObjs]);

  const calculatedEffectivePrice = React.useMemo(() => {
    if (tuitionPricingMode === 'standard') {
      return baseFee;
    }
    if (tuitionPricingMode === 'free') {
      return 0;
    }
    if (tuitionPricingMode === 'custom') {
      const cleanNum = Number(String(customTuitionPrice).replace(/\D/g, ''));
      return isNaN(cleanNum) || customTuitionPrice === '' ? baseFee : cleanNum;
    }
    if (tuitionPricingMode === 'percent') {
      const pct = Math.min(100, Math.max(0, Number(discountPercent) || 0));
      const discountVal = Math.round(baseFee * (pct / 100));
      return Math.max(0, baseFee - discountVal);
    }
    if (tuitionPricingMode === 'amount') {
      const amt = Number(String(discountAmount).replace(/\D/g, '')) || 0;
      return Math.max(0, baseFee - amt);
    }
    return baseFee;
  }, [tuitionPricingMode, customTuitionPrice, discountPercent, discountAmount, baseFee]);

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
      hasReminder: isOwnerOrAdmin && defaultRoleFromQuery === ROLES.STUDENT,
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
      const res = await getGroups({ status: 'all', limit: 200 });
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

  const loadCourses = async () => {
    try {
      const res = await getCourses({ status: 'active', limit: 100 });
      setCoursesList(res.courses || []);
    } catch (e) {
      console.error('loadCourses error:', e);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleCreateInlineCourse = async (e) => {
    e?.preventDefault?.();
    const name = newCourseName.trim();
    if (!name) {
      toast.error('Yo‘nalish (kurs) nomini kiriting!');
      return;
    }
    try {
      setIsSavingCourse(true);
      const fee = Number(String(newCourseFee).replace(/\D/g, '')) || 0;
      const created = await createCourse({
        name,
        monthlyFee: fee,
        description: newCourseDesc.trim() || undefined,
      });
      toast.success(`"${name}" yangi ta‘lim yo‘nalishi yaratildi va biriktirildi!`);
      const res = await getCourses({ status: 'active', limit: 100 });
      setCoursesList(res.courses || []);
      setSelectedCourseId(created.id);
      setIsCreatingInlineCourse(false);
      setNewCourseName('');
      setNewCourseFee('');
      setNewCourseDesc('');
    } catch (err) {
      toast.error(`Xatolik: ${err.message}`);
    } finally {
      setIsSavingCourse(false);
    }
  };

  // If editing, load user details
  useEffect(() => {
    if (isEditing && id) {
      getUserById(id)
        .then(async (u) => {
          if (u) {
            if (u.course_id || u.courseId) {
              setSelectedCourseId(u.course_id || u.courseId);
            }

            // Load all memberships & group IDs for student
            let targetGroupIds = [];
            if (Array.isArray(u.group_ids) && u.group_ids.length > 0) {
              targetGroupIds.push(...u.group_ids);
            }
            if (u.group_id && !targetGroupIds.includes(u.group_id)) {
              targetGroupIds.push(u.group_id);
            }
            if (u.groupId && !targetGroupIds.includes(u.groupId)) {
              targetGroupIds.push(u.groupId);
            }

            let targetMem = null;
            try {
              const { localStore } = await import('@/lib/localStore');
              const memberships = localStore.getMemberships ? localStore.getMemberships() : [];
              const normId = localStore.normalizeUserId(id);
              const activeMems = memberships.filter((m) => localStore.normalizeUserId(m.student_id) === normId && m.is_active !== false);
              activeMems.forEach((m) => {
                if (m.group_id && !targetGroupIds.includes(m.group_id)) {
                  targetGroupIds.push(m.group_id);
                }
              });
              targetMem = activeMems[0] || memberships.find((m) => localStore.normalizeUserId(m.student_id) === normId);

              const allGroups = localStore.getGroups ? localStore.getGroups() : [];
              allGroups.forEach((g) => {
                if (Array.isArray(g.student_ids) && (g.student_ids.includes(id) || g.student_ids.map(String).includes(String(id)))) {
                  if (!targetGroupIds.includes(g.id)) {
                    targetGroupIds.push(g.id);
                  }
                }
              });
            } catch (_) {}

            targetGroupIds = [...new Set(targetGroupIds.filter(Boolean))];
            setEnrolledGroupIds(targetGroupIds);
            setInitialGroupIds(targetGroupIds);
            const firstGid = targetGroupIds[0] || '';
            setSelectedGroupId(firstGid);
            setOriginalGroupId(firstGid);

            // Set pricing & discount state
            const targetCustomPrice = targetMem?.custom_price !== undefined ? targetMem.custom_price : u.custom_price;
            const targetPercent = targetMem?.discount_percent !== undefined ? targetMem.discount_percent : u.discount_percent;
            const targetAmount = targetMem?.discount_amount !== undefined ? targetMem.discount_amount : u.discount_amount;
            const targetReason = targetMem?.discount_reason || u.discount_reason || '';

            if (targetCustomPrice !== null && targetCustomPrice !== undefined && targetCustomPrice !== '') {
              if (Number(targetCustomPrice) === 0) {
                setTuitionPricingMode('free');
              } else {
                setTuitionPricingMode('custom');
                setCustomTuitionPrice(String(targetCustomPrice));
              }
            } else if (Number(targetPercent) > 0) {
              setTuitionPricingMode('percent');
              setDiscountPercent(String(targetPercent));
            } else if (Number(targetAmount) > 0) {
              setTuitionPricingMode('amount');
              setDiscountAmount(String(targetAmount));
            } else {
              setTuitionPricingMode('standard');
            }

            if (targetReason) {
              setDiscountReason(targetReason);
            }

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
      // Tuition & Discount calculation for student (Owner & Admin only)
      let customPriceVal = null;
      let discountTypeVal = null;
      let discountPercentVal = 0;
      let discountAmountVal = 0;

      if (isOwnerOrAdmin && data.role === ROLES.STUDENT) {
        if (tuitionPricingMode === 'custom') {
          const cleanNum = Number(String(customTuitionPrice).replace(/\D/g, ''));
          customPriceVal = isNaN(cleanNum) ? null : cleanNum;
          discountTypeVal = 'custom';
        } else if (tuitionPricingMode === 'free') {
          customPriceVal = 0;
          discountTypeVal = 'free';
        } else if (tuitionPricingMode === 'percent') {
          discountPercentVal = Math.min(100, Math.max(0, Number(discountPercent) || 0));
          discountTypeVal = 'percent';
          const calcVal = Math.round(baseFee * (discountPercentVal / 100));
          customPriceVal = Math.max(0, baseFee - calcVal);
        } else if (tuitionPricingMode === 'amount') {
          discountAmountVal = Number(String(discountAmount).replace(/\D/g, '')) || 0;
          discountTypeVal = 'amount';
          customPriceVal = Math.max(0, baseFee - discountAmountVal);
        }
      }

      const enrollmentOptions = {
        custom_price: customPriceVal,
        discount_type: discountTypeVal,
        discount_percent: discountPercentVal,
        discount_amount: discountAmountVal,
        discount_reason: discountReason.trim(),
      };

      if (isEditing) {
        const selectedCourseObj = coursesList.find((c) => c.id === selectedCourseId);
        const primaryGroupObj = groupsList.find((g) => g.id === enrolledGroupIds[0]);

        const uniqueCourseIds = [...new Set(
          enrolledGroupIds.map((gid) => {
            const g = groupsList.find((x) => x.id === gid);
            return g?.course_id || g?.courseId;
          }).filter(Boolean)
        )];

        const uniqueCourseNames = [...new Set(
          enrolledGroupIds.map((gid) => {
            const g = groupsList.find((x) => x.id === gid);
            return g?.courseName || g?.course_name;
          }).filter(Boolean)
        )];

        await updateUser(id, {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: cleanPhone,
          fatherPhone: cleanFather,
          motherPhone: cleanMother,
          role: data.role,
          isActive: data.isActive,
          password: trimmedPwd || undefined,
          courseId: uniqueCourseIds[0] || primaryGroupObj?.course_id || selectedCourseId || undefined,
          course_ids: uniqueCourseIds,
          subject: uniqueCourseNames.join(', ') || primaryGroupObj?.courseName || primaryGroupObj?.course_name || selectedCourseObj?.name || undefined,
          group_id: enrolledGroupIds[0] || null,
          group_ids: enrolledGroupIds,
          custom_price: isOwnerOrAdmin && data.role === ROLES.STUDENT ? customPriceVal : undefined,
          discount_percent: isOwnerOrAdmin && data.role === ROLES.STUDENT ? discountPercentVal : undefined,
          discount_amount: isOwnerOrAdmin && data.role === ROLES.STUDENT ? discountAmountVal : undefined,
          discount_type: isOwnerOrAdmin && data.role === ROLES.STUDENT ? discountTypeVal : undefined,
          discount_reason: isOwnerOrAdmin && data.role === ROLES.STUDENT ? discountReason.trim() : undefined,
        });

        if (data.role === ROLES.STUDENT) {
          const { removeStudent, enrollStudent, updateStudentDiscount } = await import('@/services/groupService');

          // 1. Groups from which student was removed
          const removedGroups = initialGroupIds.filter((gid) => !enrolledGroupIds.includes(gid));
          for (const remGid of removedGroups) {
            try {
              await removeStudent(remGid, id);
            } catch (e) {
              console.warn('Remove student note:', e);
            }
          }

          // 2. Groups to which student was newly enrolled
          const addedGroups = enrolledGroupIds.filter((gid) => !initialGroupIds.includes(gid));
          for (const addGid of addedGroups) {
            try {
              await enrollStudent(addGid, id, enrollmentOptions);
              if (isOwnerOrAdmin) {
                await updateStudentDiscount(addGid, id, enrollmentOptions);
              }
            } catch (e) {
              console.warn('Enroll student note:', e);
            }
          }

          // 3. Groups that remained enrolled (update discount if needed)
          const keptGroups = enrolledGroupIds.filter((gid) => initialGroupIds.includes(gid));
          if (isOwnerOrAdmin) {
            for (const keptGid of keptGroups) {
              try {
                await updateStudentDiscount(keptGid, id, enrollmentOptions);
              } catch (e) {
                console.warn('Update discount note:', e);
              }
            }
          }

          setInitialGroupIds(enrolledGroupIds);
          try {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('educo-data-sync', { detail: { type: 'user_groups_updated', userId: id } }));
            }
          } catch (_) {}
        }
        toast.success('Foydalanuvchi ma‘lumotlari muvaffaqiyatli saqlandi!');
      } else {
        // If teacher role and an inline course was drafted, auto-create it
        let finalCourseId = selectedCourseId;
        let finalSubject = '';
        if (data.role === ROLES.TEACHER) {
          if (!finalCourseId && newCourseName.trim()) {
            try {
              const fee = Number(String(newCourseFee).replace(/\D/g, '')) || 0;
              const newC = await createCourse({
                name: newCourseName.trim(),
                monthlyFee: fee,
                description: newCourseDesc.trim() || undefined,
              });
              finalCourseId = newC.id;
              finalSubject = newC.name;
            } catch (_) {}
          } else if (finalCourseId) {
            const matched = coursesList.find((c) => c.id === finalCourseId);
            finalSubject = matched?.name || '';
          }
        }

        const primaryGroupObj = groupsList.find((g) => g.id === enrolledGroupIds[0]);
        const uniqueCourseIds = [...new Set(
          enrolledGroupIds.map((gid) => {
            const g = groupsList.find((x) => x.id === gid);
            return g?.course_id || g?.courseId;
          }).filter(Boolean)
        )];
        const uniqueCourseNames = [...new Set(
          enrolledGroupIds.map((gid) => {
            const g = groupsList.find((x) => x.id === gid);
            return g?.courseName || g?.course_name;
          }).filter(Boolean)
        )];

        const createdUser = await createUser({
          firstName: data.firstName,
          lastName: data.lastName,
          phone: cleanPhone,
          fatherPhone: cleanFather,
          motherPhone: cleanMother,
          role: data.role,
          isActive: data.isActive,
          password: trimmedPwd,
          courseId: uniqueCourseIds[0] || finalCourseId || null,
          course_ids: uniqueCourseIds,
          subject: uniqueCourseNames.join(', ') || finalSubject || '',
          group_id: enrolledGroupIds[0] || null,
          group_ids: enrolledGroupIds,
          custom_price: isOwnerOrAdmin && data.role === ROLES.STUDENT ? customPriceVal : null,
          discount_percent: isOwnerOrAdmin && data.role === ROLES.STUDENT ? discountPercentVal : 0,
          discount_amount: isOwnerOrAdmin && data.role === ROLES.STUDENT ? discountAmountVal : 0,
          discount_type: isOwnerOrAdmin && data.role === ROLES.STUDENT ? discountTypeVal : null,
          discount_reason: isOwnerOrAdmin && data.role === ROLES.STUDENT ? discountReason.trim() : '',
        });

        // 1. Group enrollments if any selected
        if (data.role === ROLES.STUDENT && enrolledGroupIds.length > 0 && createdUser?.id) {
          const { enrollStudent, updateStudentDiscount } = await import('@/services/groupService');
          for (const gid of enrolledGroupIds) {
            try {
              await enrollStudent(gid, createdUser.id, enrollmentOptions);
              if (isOwnerOrAdmin && (customPriceVal !== null || discountPercentVal > 0 || discountAmountVal > 0)) {
                await updateStudentDiscount(gid, createdUser.id, enrollmentOptions);
              }
            } catch (e) {
              console.warn('Enrollment note:', e);
            }
          }
        }

        // 2. Schedule Reminder if requested (Owner & Admin only)
        if (isOwnerOrAdmin && data.role === ROLES.STUDENT && data.hasReminder && data.reminderDate) {
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

  const handleSwitchGroup = (oldGroupId, newGroupId) => {
    if (!newGroupId || oldGroupId === newGroupId) return;
    setEnrolledGroupIds((prev) =>
      prev.map((gid) => (gid === oldGroupId ? newGroupId : gid))
    );
    setActiveGroupAction({ groupId: null, type: null });
    const newG = groupsList.find((g) => g.id === newGroupId);
    toast.success(`Guruh muvaffaqiyatli «${newG?.name || 'Yangi guruh'}» ga almashtirildi! Saqlash tugmasini bosing.`);
  };

  const handleRemoveGroup = (groupIdToRemove) => {
    const oldG = groupsList.find((g) => g.id === groupIdToRemove);
    setEnrolledGroupIds((prev) => prev.filter((gid) => gid !== groupIdToRemove));
    setActiveGroupAction({ groupId: null, type: null });
    toast.info(`«${oldG?.name || 'Guruh'}» ro‘yxatdan chiqarildi. Saqlash tugmasini bosing.`);
  };

  const handleAddGroup = (newGroupId) => {
    if (!newGroupId) return;
    if (enrolledGroupIds.includes(newGroupId)) {
      toast.warning('O‘quvchi ushbu guruhga allaqachon biriktirilgan!');
      return;
    }
    const newG = groupsList.find((g) => g.id === newGroupId);
    setEnrolledGroupIds((prev) => [...prev, newGroupId]);
    setIsAddingGroup(false);
    toast.success(`«${newG?.name || 'Guruh'}» qo‘shimcha yo‘nalish sifatida biriktirildi! Saqlash tugmasini bosing.`);
  };

  const handleToggleGroupAction = (groupId, actionType) => {
    setActiveGroupAction((prev) => {
      if (prev.groupId === groupId && prev.type === actionType) {
        return { groupId: null, type: null };
      }
      return { groupId, type: actionType };
    });
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
            <span className="hidden xs:inline">Bekor qilish</span>
            <span className="xs:hidden">Bekor</span>
          </Button>
          <Button
            type="button"
            variant="primary"
            icon={Save}
            isLoading={isSubmitting}
            onClick={handleSubmit(onSubmit)}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white shadow-md shadow-blue-600/30 dark:shadow-emerald-600/30 ring-1 ring-blue-400/40 dark:ring-emerald-400/40"
          >
            <span className="hidden xs:inline">{isEditing ? "O'zgarishlarni saqlash" : "Ro'yxatdan o'tkazish"}</span>
            <span className="xs:hidden">{isEditing ? "Saqlash" : "Ro'yxatga olish"}</span>
          </Button>
        </div>
      </div>

      {/* Visual Workflow Steps Guide (Logical Dependency Order) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-purple-50/70 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-purple-950/30 border border-blue-200/80 dark:border-blue-900/50 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-200">
              O‘quv markazni sozlash mantiqiy ketma-ketligi
            </span>
          </div>
          <span className="text-[11px] text-blue-700 dark:text-blue-300 font-semibold bg-white/70 dark:bg-gray-800/70 px-2.5 py-0.5 rounded-full border border-blue-200/60 dark:border-blue-800">
            Har bir bosqichda yetishmayotgan qismini o‘sha joyning o‘zida ham yaratib ketaverasiz
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <button
            type="button"
            onClick={() => navigate(`/${currentUserRole}/courses/create`)}
            className="p-2.5 rounded-xl border flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/40 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 transition-all text-left cursor-pointer"
            title="Kurs yoki yo‘nalish yaratish sahifasiga o‘tish"
          >
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-[10px] shrink-0">1</span>
            <span className="truncate">1. Kurs (Yo‘nalish) ↗</span>
          </button>
          <div className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${selectedRole === ROLES.TEACHER ? 'bg-amber-100/90 border-amber-300 dark:bg-amber-950/60 font-bold text-amber-900 dark:text-amber-200 ring-2 ring-amber-400/50' : 'bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}>
            <span className="w-5 h-5 rounded-full bg-amber-600 text-white font-black flex items-center justify-center text-[10px] shrink-0">2</span>
            <span className="truncate">2. O‘qituvchi</span>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/${currentUserRole}/groups/create`)}
            className="p-2.5 rounded-xl border flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 hover:bg-purple-50 dark:hover:bg-purple-950/40 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 transition-all text-left cursor-pointer"
            title="Guruh ochish sahifasiga o‘tish"
          >
            <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-black flex items-center justify-center text-[10px] shrink-0">3</span>
            <span className="truncate">3. O‘quv guruhi ↗</span>
          </button>
          <div className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${selectedRole === ROLES.STUDENT ? 'bg-emerald-100/90 border-emerald-300 dark:bg-emerald-950/60 font-bold text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-400/50' : 'bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}>
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-[10px] shrink-0">4</span>
            <span className="truncate">4. O‘quvchi (Hozir)</span>
          </div>
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

        {/* Section 4: Mutaxassislik va Ta'lim yo'nalishi (Teacher only) */}
        {selectedRole === ROLES.TEACHER && (
          <Card className="p-5 border-2 border-amber-300/80 dark:border-amber-900/50">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-800 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                    4. Mutaxassislik va Ta‘lim yo‘nalishi (Fan)
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    O‘qituvchi markazda qaysi fan yoki yo‘nalish bo‘yicha dars beradi?
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatingInlineCourse(!isCreatingInlineCourse)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isCreatingInlineCourse ? "Bekor qilish" : "Yangi yo‘nalish qo‘shish"}</span>
              </button>
            </div>

            {/* Inline Course Creator Sub-card */}
            {isCreatingInlineCourse && (
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border-2 border-dashed border-amber-300 dark:border-amber-800 space-y-3.5 mb-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                      Yangi ta‘lim yo‘nalishi (kurs) yaratish
                    </h3>
                  </div>
                  <span className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold">
                    Bir zumda yaratilib, o‘qituvchiga biriktiriladi
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                      Yo‘nalish / Fan nomi <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      placeholder="Masalan: Matematika, IELTS, Dasturlash"
                      value={newCourseName}
                      onChange={(e) => setNewCourseName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                      Oylik kurs to‘lovi (so‘mda)
                    </label>
                    <Input
                      placeholder="Masalan: 450 000"
                      value={newCourseFee}
                      onChange={(e) => setNewCourseFee(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                    Qisqacha tavsif (ixtiyoriy)
                  </label>
                  <Input
                    placeholder="Kurs darajasi yoki yo‘nalish haqida qisqacha ma‘lumot"
                    value={newCourseDesc}
                    onChange={(e) => setNewCourseDesc(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200/60 dark:border-amber-900/40">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCreatingInlineCourse(false)}
                  >
                    Bekor qilish
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    isLoading={isSavingCourse}
                    onClick={handleCreateInlineCourse}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                  >
                    Yo‘nalishni saqlash va biriktirish
                  </Button>
                </div>
              </div>
            )}

            {/* Course Select */}
            <div className="space-y-3">
              <Select
                label="O‘qituvchining asosiy yo‘nalishi / fani"
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                placeholder="Yo‘nalishni tanlang (yoki yuqoridan yangi qo‘shing)"
                headerTitle="Mavjud ta‘lim yo‘nalishlari"
                icon={BookOpen}
                size="md"
                options={[
                  { value: '', label: 'Yo‘nalishsiz (Keyinroq biriktirish)', subtitle: 'Guruh ochilganda ham biriktirish mumkin' },
                  ...coursesList.map((c) => ({
                    value: c.id,
                    label: c.name,
                    subtitle: c.monthly_fee ? `${Number(c.monthly_fee).toLocaleString()} so‘m/oy` : 'To‘lov belgilanmagan',
                    color: c.color || '#d97706',
                  })),
                ]}
              />

              {coursesList.length === 0 && !isCreatingInlineCourse && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <span>Tizimda hali ta‘lim yo‘nalishlari (kurslar) mavjud emas. Yuqoridagi tugma orqali o‘qituvchi uchun hoziroq yo‘nalish qo‘shishingiz mumkin!</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreatingInlineCourse(true)}
                    className="shrink-0 font-bold border-amber-300 text-amber-900 dark:text-amber-200"
                  >
                    + Yangi yo‘nalish
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Section 4: O'quv guruhlari va Ta'lim yo'nalishlari (Student only) */}
        {selectedRole === ROLES.STUDENT && (
          <Card className="p-4 sm:p-6 border-2 border-emerald-500/30 dark:border-emerald-800/60 shadow-sm space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 flex-wrap gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                      4. O‘quv guruhlari va Ta‘lim yo‘nalishlari
                    </h2>
                    <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      Jami: {enrolledGroupObjs.length} ta guruh
                    </span>
                    {enrolledGroupObjs.length > 1 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                        ⚡ Bir nechta yo‘nalishda o‘qiydi
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    O‘quvchining dars jadvallari, o‘qituvchilari, guruhlari va ta‘lim yo‘nalishlarini qulay boshqaring
                  </p>
                </div>
              </div>

              {/* Top Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsAddingGroup(!isAddingGroup)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingGroup ? "Yopish" : "+ Qo‘shimcha guruh / fan qo‘shish"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/${currentUserRole}/groups/create`)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-bold border border-gray-200 dark:border-gray-700 shadow-2xs transition-all cursor-pointer active:scale-95"
                  title="Yangi parallel guruh yaratish sahifasini ochish"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Yangi guruh ochish</span>
                </button>
              </div>
            </div>

            {/* Schedule Conflicts Alert Banner */}
            {scheduleConflicts.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-500/15 dark:bg-amber-950/40 border-2 border-amber-500 text-amber-950 dark:text-amber-100 space-y-2.5 animate-fade-in shadow-xs">
                <div className="flex items-center gap-2 font-black text-xs sm:text-sm text-amber-900 dark:text-amber-200">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 animate-bounce" />
                  <span>DIQQAT: Dars vaqtlari to‘qnashuvi aniqlandi ({scheduleConflicts.length} ta)!</span>
                </div>
                <div className="space-y-2">
                  {scheduleConflicts.map((c, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white/90 dark:bg-gray-900/90 border border-amber-300 dark:border-amber-700/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5 flex-wrap">
                          <span className="text-rose-600 dark:text-rose-400 font-extrabold">«{c.gA.name}»</span>
                          <span className="text-gray-400 font-normal">({c.schedA})</span>
                          <span className="text-amber-600 font-black">↔</span>
                          <span className="text-rose-600 dark:text-rose-400 font-extrabold">«{c.gB.name}»</span>
                          <span className="text-gray-400 font-normal">({c.schedB})</span>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          Dars kunlari va soatlari ustma-ust tushadi. O‘quvchi bir vaqtda ikkala darsga qatnasha olmaydi.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleGroupAction(c.gB.id, 'time')}
                        className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs active:scale-95 transition-all self-start sm:self-auto flex items-center gap-1.5"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>«{c.gB.name}» vaqtini almashtirish</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unsaved Changes / Group Transfer Diff Banner */}
            {isEditing && (
              (() => {
                const added = enrolledGroupIds.filter((gid) => !initialGroupIds.includes(gid));
                const removed = initialGroupIds.filter((gid) => !enrolledGroupIds.includes(gid));
                const hasDiff = added.length > 0 || removed.length > 0;
                if (!hasDiff) return null;
                return (
                  <div className="p-3.5 rounded-2xl bg-blue-500/15 dark:bg-blue-950/40 border-2 border-blue-500 dark:border-blue-600 text-xs text-blue-950 dark:text-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs animate-fade-in">
                    <div className="flex items-center gap-2 flex-wrap">
                      <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 animate-spin" />
                      <div>
                        <span className="font-bold">Guruhlar tarkibida saqlanmagan o‘zgarishlar bor: </span>
                        {added.length > 0 && (
                          <span className="text-emerald-700 dark:text-emerald-300 font-bold">
                            +{added.length} ta yangi biriktirildi ({added.map((gid) => groupsList.find((g) => g.id === gid)?.name || gid).join(', ')}).{' '}
                          </span>
                        )}
                        {removed.length > 0 && (
                          <span className="text-rose-600 dark:text-rose-400 font-bold">
                            -{removed.length} ta chiqarildi ({removed.map((gid) => groupsList.find((g) => g.id === gid)?.name || gid).join(', ')}).{' '}
                          </span>
                        )}
                        <span className="text-gray-600 dark:text-gray-300">
                          O‘zgarishlarni kuchga kiritish uchun yuqoridagi «Saqlash» tugmasini bosing.
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-blue-600 text-white shadow-xs shrink-0 self-start sm:self-auto">
                      Saqlash kutilmoqda
                    </span>
                  </div>
                );
              })()
            )}

            {/* Empty State: Student has 0 groups */}
            {enrolledGroupObjs.length === 0 && (
              <div className="p-5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border-2 border-dashed border-amber-300 dark:border-amber-800 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                    Ushbu o‘quvchi hozircha hech qaysi guruhga biriktirilmagan (Kutish zali)
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto mt-1">
                    O‘quvchini markazning mos guruhiga biriktiring yoki bir vaqtning o‘zida bir nechta parallel fanga yozing.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingGroup(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ O‘quvchini guruhga biriktirish</span>
                </button>
              </div>
            )}

            {/* Enrolled Groups Cards List */}
            {enrolledGroupObjs.length > 0 && (
              <div className="space-y-3.5">
                {enrolledGroupObjs.map((group, idx) => {
                  const isActionOpen = activeGroupAction.groupId === group.id;
                  const currentActionType = activeGroupAction.type;

                  // Find parallel time alternative groups for the same course
                  const timeAlternatives = groupsList.filter((g) => {
                    if (g.id === group.id) return false;
                    const sameCourseId = g.course_id && group.course_id && g.course_id === group.course_id;
                    const sameCourseName = (g.course_name || g.courseName || '').toLowerCase().trim() === (group.course_name || group.courseName || '').toLowerCase().trim();
                    return sameCourseId || sameCourseName;
                  });

                  // Find teacher alternative groups for the same course
                  const teacherAlternatives = groupsList.filter((g) => {
                    if (g.id === group.id) return false;
                    const sameCourse = (g.course_id && group.course_id && g.course_id === group.course_id) ||
                      ((g.course_name || g.courseName || '').toLowerCase().trim() === (group.course_name || group.courseName || '').toLowerCase().trim());
                    return sameCourse;
                  });

                  // Find other courses for direction switcher
                  const currentCourseId = group.course_id || group.courseId;

                  return (
                    <div
                      key={group.id}
                      className="p-4 sm:p-5 rounded-2xl border-2 border-emerald-500/30 dark:border-emerald-800/80 bg-white dark:bg-gray-900/60 shadow-xs space-y-3 transition-all hover:border-emerald-500/60"
                    >
                      {/* Top Row: Group Name, Badges, Fee */}
                      <div className="flex items-start justify-between flex-wrap gap-2 pb-2.5 border-b border-gray-100 dark:border-gray-800">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-600 text-white shadow-2xs">
                              #{idx + 1}-Guruh
                            </span>
                            <span className="text-base font-black text-gray-900 dark:text-white">
                              «{group.name}»
                            </span>
                            {group.room && (
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 shadow-2xs">
                                🚪 {group.room.replace(/^xona\s*/i, '')}-xona
                              </span>
                            )}
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                              📚 {group.courseName || group.course_name || 'Fan'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-300 flex-wrap">
                            <div className="flex items-center gap-1 font-medium">
                              <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              <span>Ustoz: <strong className="text-gray-900 dark:text-white">{group.teacherName || group.teacher_name || 'Noma‘lum'}</strong></span>
                            </div>
                            <div className="flex items-center gap-1 font-medium">
                              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                              <span>Dars vaqti: <strong className="text-gray-900 dark:text-white">{group.schedule_days || group.schedule || 'Jadval ko‘rsatilmagan'}</strong></span>
                            </div>
                            <div className="flex items-center gap-1 font-medium">
                              <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>Sig‘im: <strong className="text-gray-900 dark:text-white">{group.enrolled_count || group.studentCount || 0}/{group.capacity || 20} ta</strong></span>
                            </div>
                          </div>
                        </div>

                        {/* Monthly Fee Pill */}
                        <div className="text-right shrink-0">
                          <span className="text-[10px] uppercase font-bold text-gray-400 block">Oylik to‘lov</span>
                          <span className="text-sm sm:text-base font-black text-emerald-700 dark:text-emerald-300">
                            {Number(group.monthly_price || group.price || 500000).toLocaleString()} so‘m/oy
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons Bar: Responsive Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        {/* 1. Vaqtini almashtirish */}
                        <button
                          type="button"
                          onClick={() => handleToggleGroupAction(group.id, 'time')}
                          className={`px-3 py-2.5 min-h-[42px] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-xs ${
                            isActionOpen && currentActionType === 'time'
                              ? 'bg-amber-600 text-white ring-2 ring-amber-400/40'
                              : 'bg-amber-50 hover:bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 dark:text-amber-200 border border-amber-300 dark:border-amber-800'
                          }`}
                          title="Ushbu yo‘nalish bo‘yicha boshqa vaqtdagi parallel guruhga ko‘chirish"
                        >
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span>⏰ Vaqtini almashtirish</span>
                        </button>

                        {/* 2. Ustozini almashtirish */}
                        <button
                          type="button"
                          onClick={() => handleToggleGroupAction(group.id, 'teacher')}
                          className={`px-3 py-2.5 min-h-[42px] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-xs ${
                            isActionOpen && currentActionType === 'teacher'
                              ? 'bg-blue-600 text-white ring-2 ring-blue-400/40'
                              : 'bg-blue-50 hover:bg-blue-100 text-blue-900 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 dark:text-blue-200 border border-blue-300 dark:border-blue-800'
                          }`}
                          title="Ushbu fan bo‘yicha boshqa o‘qituvchi guruhiga o‘tkazish"
                        >
                          <Users className="w-3.5 h-3.5 shrink-0" />
                          <span>👨‍🏫 Ustozini almashtirish</span>
                        </button>

                        {/* 3. Yo'nalishni almashtirish */}
                        <button
                          type="button"
                          onClick={() => handleToggleGroupAction(group.id, 'course')}
                          className={`px-3 py-2.5 min-h-[42px] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-xs ${
                            isActionOpen && currentActionType === 'course'
                              ? 'bg-purple-600 text-white ring-2 ring-purple-400/40'
                              : 'bg-purple-50 hover:bg-purple-100 text-purple-900 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 dark:text-purple-200 border border-purple-300 dark:border-purple-800'
                          }`}
                          title="Boshqa fan yoki yangi yo‘nalish guruhiga ko‘chirish"
                        >
                          <BookOpen className="w-3.5 h-3.5 shrink-0" />
                          <span>🔄 Yo‘nalishni almashtirish</span>
                        </button>

                        {/* 4. Guruhdan chiqarish */}
                        <button
                          type="button"
                          onClick={() => handleRemoveGroup(group.id)}
                          className="px-3 py-2.5 min-h-[42px] rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 dark:text-rose-300 border border-rose-300 dark:border-rose-800 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-xs"
                          title="O‘quvchini ushbu guruhdan chiqarish"
                        >
                          <Trash2 className="w-3.5 h-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
                          <span>❌ Guruhdan chiqarish</span>
                        </button>
                      </div>

                      {/* ⏰ DRAWER 1: Vaqtini almashtirish (Parallel vaqtga ko'chirish) */}
                      {isActionOpen && currentActionType === 'time' && (
                        <div className="p-3.5 sm:p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 space-y-3 animate-fade-in">
                          <div className="flex items-center justify-between pb-2 border-b border-amber-200 dark:border-amber-800/80">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                              <h4 className="font-black text-xs sm:text-sm text-gray-900 dark:text-white">
                                «{group.name}» dars vaqtini almashtirish
                              </h4>
                            </div>
                            <button
                              type="button"
                              onClick={() => setActiveGroupAction({ groupId: null, type: null })}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-xs text-amber-900 dark:text-amber-200">
                            Ushbu yo‘nalish (<strong>{group.courseName || group.course_name}</strong>) bo‘yicha parallel guruhlar va ularning dars vaqtlari:
                          </p>

                          {timeAlternatives.length === 0 ? (
                            <div className="p-3 rounded-lg bg-white/80 dark:bg-gray-800/80 text-xs text-gray-600 dark:text-gray-300 flex items-center justify-between gap-2">
                              <span>Hozircha ushbu kurs bo‘yicha boshqa parallel guruh mavjud emas.</span>
                              <button
                                type="button"
                                onClick={() => navigate(`/${currentUserRole}/groups/create?courseId=${group.course_id || group.courseId || ''}`)}
                                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shrink-0"
                              >
                                + Yangi 2-guruh ochish
                              </button>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {timeAlternatives.map((altG) => {
                                const altSched = altG.schedule_days || altG.schedule || 'Jadvalsiz';
                                const altRoom = altG.room ? `${altG.room.replace(/^xona\s*/i, '')}-xona` : '';
                                const altTeacher = altG.teacherName || altG.teacher_name || 'Ustoz';
                                const isEnrolledInThis = enrolledGroupIds.includes(altG.id);

                                // Check if altG conflicts with ANY OTHER enrolled group (except the one being replaced)
                                const altConflict = enrolledGroupObjs.some((otherG) => {
                                  if (otherG.id === group.id) return false;
                                  const oSched = otherG.schedule_days || otherG.schedule || '';
                                  return oSched && altSched && hasScheduleConflict(oSched, altSched);
                                });

                                return (
                                  <div
                                    key={altG.id}
                                    className={`p-3 rounded-xl border text-xs space-y-2 transition-all ${
                                      altConflict
                                        ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-amber-400'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-1.5">
                                      <div>
                                        <div className="font-bold text-gray-900 dark:text-white">
                                          «{altG.name}» {altRoom && <span className="text-[10px] text-gray-500 font-mono">({altRoom})</span>}
                                        </div>
                                        <div className="text-[11px] text-gray-500 dark:text-gray-400">
                                          👨‍🏫 {altTeacher}
                                        </div>
                                      </div>
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 shrink-0">
                                        {altG.enrolled_count || 0}/{altG.capacity || 20} ta
                                      </span>
                                    </div>

                                    <div className="p-2 rounded-lg bg-amber-500/10 dark:bg-amber-950/30 text-[11px] font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                                      <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                      <span>{altSched}</span>
                                    </div>

                                    {altConflict && (
                                      <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3 shrink-0" />
                                        <span>Boshqa biriktirilgan guruh bilan vaqt to‘qnashadi!</span>
                                      </div>
                                    )}

                                    <button
                                      type="button"
                                      disabled={isEnrolledInThis}
                                      onClick={() => handleSwitchGroup(group.id, altG.id)}
                                      className="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer shadow-2xs active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                                    >
                                      <Clock className="w-3.5 h-3.5" />
                                      <span>Ushbu vaqtga ko‘chirish</span>
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* 👨‍🏫 DRAWER 2: Ustozini almashtirish */}
                      {isActionOpen && currentActionType === 'teacher' && (
                        <div className="p-3.5 sm:p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-300 dark:border-blue-800 space-y-3 animate-fade-in">
                          <div className="flex items-center justify-between pb-2 border-b border-blue-200 dark:border-blue-800/80">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-blue-600 shrink-0" />
                              <h4 className="font-black text-xs sm:text-sm text-gray-900 dark:text-white">
                                «{group.name}» o‘qituvchisini almashtirish
                              </h4>
                            </div>
                            <button
                              type="button"
                              onClick={() => setActiveGroupAction({ groupId: null, type: null })}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-xs text-blue-900 dark:text-blue-200">
                            Hozirgi ustoz: <strong>{group.teacherName || group.teacher_name || 'Noma‘lum'}</strong>. Quyidan ushbu fan bo‘yicha boshqa ustoz va guruhni tanlang:
                          </p>

                          {teacherAlternatives.length === 0 ? (
                            <div className="p-3 rounded-lg bg-white/80 dark:bg-gray-800/80 text-xs text-gray-600 dark:text-gray-300">
                              Ushbu kurs bo‘yicha hozircha boshqa guruhlar mavjud emas.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {teacherAlternatives.map((altG) => {
                                const altTeacher = altG.teacherName || altG.teacher_name || 'Boshqa ustoz';
                                const altSched = altG.schedule_days || altG.schedule || 'Jadvalsiz';
                                const altRoom = altG.room ? `${altG.room.replace(/^xona\s*/i, '')}-xona` : '';
                                const isEnrolledInThis = enrolledGroupIds.includes(altG.id);

                                return (
                                  <div
                                    key={altG.id}
                                    className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-400 text-xs space-y-2 transition-all"
                                  >
                                    <div className="flex items-start justify-between gap-1.5">
                                      <div>
                                        <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                                          <span>👨‍🏫 {altTeacher}</span>
                                        </div>
                                        <div className="text-[11px] text-gray-500 dark:text-gray-400">
                                          Guruh: «{altG.name}» {altRoom && `(${altRoom})`}
                                        </div>
                                      </div>
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 shrink-0">
                                        {altG.enrolled_count || 0}/{altG.capacity || 20} ta
                                      </span>
                                    </div>

                                    <div className="p-2 rounded-lg bg-blue-500/10 dark:bg-blue-950/30 text-[11px] font-medium text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                                      <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                      <span>{altSched}</span>
                                    </div>

                                    <button
                                      type="button"
                                      disabled={isEnrolledInThis}
                                      onClick={() => handleSwitchGroup(group.id, altG.id)}
                                      className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-2xs active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                                    >
                                      <Users className="w-3.5 h-3.5" />
                                      <span>Ushbu ustozga o‘tkazish</span>
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* 🔄 DRAWER 3: Yo'nalishni almashtirish (Boshqa kurs tanlash) */}
                      {isActionOpen && currentActionType === 'course' && (
                        <div className="p-3.5 sm:p-4 rounded-xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-300 dark:border-purple-800 space-y-3 animate-fade-in">
                          <div className="flex items-center justify-between pb-2 border-b border-purple-200 dark:border-purple-800/80">
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-purple-600 shrink-0" />
                              <h4 className="font-black text-xs sm:text-sm text-gray-900 dark:text-white">
                                «{group.name}» o‘rniga boshqa yo‘nalish (kurs) tanlash
                              </h4>
                            </div>
                            <button
                              type="button"
                              onClick={() => setActiveGroupAction({ groupId: null, type: null })}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-xs text-purple-900 dark:text-purple-200">
                            Hozirgi kurs: <strong>{group.courseName || group.course_name}</strong>. Quyidan o‘quvchi o‘tishi kerak bo‘lgan yangi ta‘lim yo‘nalishi va guruhini tanlang:
                          </p>

                          <div className="space-y-2">
                            {coursesList
                              .filter((c) => c.id !== currentCourseId)
                              .map((crs) => {
                                const crsGroups = groupsList.filter((g) => g.course_id === crs.id || g.courseId === crs.id);
                                return (
                                  <div
                                    key={crs.id}
                                    className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 space-y-2"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
                                        <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                                        <span>{crs.name}</span>
                                      </div>
                                      <span className="text-[10px] text-gray-500">
                                        {crsGroups.length} ta guruh mavjud
                                      </span>
                                    </div>

                                    {crsGroups.length === 0 ? (
                                      <p className="text-[11px] text-gray-400 italic">
                                        Ushbu yo‘nalish bo‘yicha hozircha ochiq guruh yo‘q
                                      </p>
                                    ) : (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                                        {crsGroups.map((cg) => {
                                          const cgSched = cg.schedule_days || cg.schedule || 'Jadvalsiz';
                                          const isEnrolled = enrolledGroupIds.includes(cg.id);
                                          return (
                                            <button
                                              key={cg.id}
                                              type="button"
                                              disabled={isEnrolled}
                                              onClick={() => handleSwitchGroup(group.id, cg.id)}
                                              className="p-2 rounded-lg bg-gray-50 dark:bg-gray-900/60 hover:bg-purple-100 dark:hover:bg-purple-950/60 border border-gray-200 dark:border-gray-700 text-left transition-all cursor-pointer flex flex-col justify-between disabled:opacity-50"
                                            >
                                              <div className="font-bold text-xs text-gray-900 dark:text-white flex items-center justify-between">
                                                <span>«{cg.name}»</span>
                                                <span className="text-[10px] text-gray-400">{cg.room ? `${cg.room}-xona` : ''}</span>
                                              </div>
                                              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                                👨‍🏫 {cg.teacherName || cg.teacher_name || 'Ustoz'} • ⏰ {cgSched}
                                              </div>
                                              <div className="text-[10px] font-bold text-purple-600 dark:text-purple-400 mt-1 flex items-center gap-1">
                                                <span>Ushbu guruhga ko‘chirish ➔</span>
                                              </div>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* + Qo'shimcha guruh / yo'nalish qo'shish expandable panel */}
            {isAddingGroup && (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-50/70 via-white to-blue-50/50 dark:from-emerald-950/20 dark:via-gray-900 dark:to-blue-950/20 border-2 border-dashed border-emerald-400 dark:border-emerald-700 space-y-3.5 animate-fade-in shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-200/80 dark:border-emerald-800/60">
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <h3 className="font-black text-sm text-gray-900 dark:text-white">
                        O‘quvchini yana bir boshqa guruh / fanga yozish (Qo‘shimcha yo‘nalish)
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        1 o‘quvchi markazda bir nechta fanda (masalan: Ingliz tili + Matematika + Rus tili) parallel o‘qishi mumkin
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddingGroup(false)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Course Filter Pills */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block">
                    Fanni tanlang (Filtr):
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFilterCourseForAdd('all')}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        filterCourseForAdd === 'all'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-emerald-300'
                      }`}
                    >
                      Barcha fanlar ({groupsList.filter((g) => !enrolledGroupIds.includes(g.id)).length})
                    </button>
                    {coursesList.map((c) => {
                      const count = groupsList.filter((g) => !enrolledGroupIds.includes(g.id) && (g.course_id === c.id || g.courseId === c.id)).length;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setFilterCourseForAdd(c.id)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            filterCourseForAdd === c.id
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-emerald-300'
                          }`}
                        >
                          {c.name} ({count})
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Available Groups Grid */}
                {(() => {
                  const availableToAdd = groupsList.filter((g) => {
                    if (enrolledGroupIds.includes(g.id)) return false;
                    if (filterCourseForAdd === 'all') return true;
                    return g.course_id === filterCourseForAdd || g.courseId === filterCourseForAdd;
                  });

                  if (availableToAdd.length === 0) {
                    return (
                      <div className="p-4 rounded-xl bg-white/80 dark:bg-gray-800/80 text-xs text-gray-500 dark:text-gray-400 text-center">
                        Tanlangan fan bo‘yicha qo‘shish mumkin bo‘lgan boshqa guruh topilmadi.
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto p-1">
                      {availableToAdd.map((ag) => {
                        const schedStr = ag.schedule_days || ag.schedule || 'Jadvalsiz';
                        const roomStr = ag.room ? `${ag.room.replace(/^xona\s*/i, '')}-xona` : '';
                        const teacherStr = ag.teacherName || ag.teacher_name || 'Ustoz';
                        const monthlyFee = Number(ag.monthly_price || ag.price || 500000);

                        // Check conflict with currently enrolled groups
                        const hasConflict = enrolledGroupObjs.some((eg) => {
                          const egSched = eg.schedule_days || eg.schedule || '';
                          return egSched && schedStr && hasScheduleConflict(egSched, schedStr);
                        });

                        return (
                          <div
                            key={ag.id}
                            className={`p-3 rounded-xl border text-xs space-y-2 flex flex-col justify-between transition-all ${
                              hasConflict
                                ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-emerald-400'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-gray-900 dark:text-white truncate" title={ag.name}>
                                  «{ag.name}»
                                </span>
                                {roomStr && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-100 dark:bg-gray-700 font-mono text-gray-600 dark:text-gray-300 shrink-0">
                                    🚪 {roomStr}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">
                                📚 {ag.courseName || ag.course_name || 'Fan'}
                              </div>
                              <div className="text-[11px] text-gray-500 dark:text-gray-400">
                                👨‍🏫 {teacherStr}
                              </div>
                              <div className="p-1.5 rounded-lg bg-gray-50 dark:bg-gray-900/60 text-[11px] font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                                <span className="truncate">{schedStr}</span>
                              </div>
                              <div className="flex items-center justify-between pt-0.5 text-[11px]">
                                <span className="text-gray-400">Sig‘im: {ag.enrolled_count || 0}/{ag.capacity || 20}</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">{monthlyFee.toLocaleString()} so‘m/oy</span>
                              </div>
                              {hasConflict && (
                                <div className="text-[10px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1 pt-0.5">
                                  <AlertTriangle className="w-3 h-3 shrink-0" />
                                  <span>Dars vaqti boshqa guruh bilan to‘qnashadi</span>
                                </div>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAddGroup(ag.id)}
                              className="w-full mt-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>+ Ushbu guruhga yozish</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Bottom Summary Pill */}
            {enrolledGroupObjs.length > 0 && (
              <div className="p-3 sm:p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-gray-800 dark:text-gray-200">
                    O‘quvchining jami yo‘nalishlari:
                  </span>
                  {enrolledGroupObjs.map((g) => (
                    <span
                      key={g.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white dark:bg-gray-900 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 font-bold text-[11px] shadow-2xs"
                    >
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>{g.courseName || g.course_name}: «{g.name}»</span>
                    </span>
                  ))}
                </div>
                <div className="text-right sm:shrink-0">
                  <span className="text-gray-500 dark:text-gray-400">Jami oylik standart to‘lov: </span>
                  <span className="font-black text-sm text-emerald-600 dark:text-emerald-400">
                    {baseFee.toLocaleString()} so‘m / oy
                  </span>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Section 5: Oylik to'lov narxi va individual chegirma (Faqat Owner va Admin uchun!) */}
        {selectedRole === ROLES.STUDENT && isOwnerOrAdmin && (
          <Card className="p-5 border-2 border-emerald-500/40 dark:border-emerald-600/40 bg-gradient-to-br from-emerald-50/40 via-white to-teal-50/30 dark:from-emerald-950/20 dark:via-gray-900 dark:to-teal-950/20 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-emerald-100 dark:border-emerald-900/50 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                      {isEditing ? "Oylik to‘lov summasi va Chegirma" : "5. Oylik to‘lov summasi va Chegirma"}
                    </h2>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      Faqat Owner & Admin
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Ushbu o‘quvchi uchun individual to‘lov miqdorini yoki chegirmasini belgilang
                  </p>
                </div>
              </div>

              {/* Selected Group Base Price Pill */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xs text-xs">
                <span className="text-gray-500 dark:text-gray-400">
                  {enrolledGroupObjs.length > 1 ? `Jami (${enrolledGroupObjs.length} ta guruh):` : 'Guruh rasmiy narxi:'}
                </span>
                <span className="font-black text-gray-900 dark:text-gray-100">
                  {baseFee.toLocaleString()} so‘m / oy
                </span>
              </div>
            </div>

            {/* Multi-group Tuition Breakdown if > 1 group */}
            {enrolledGroupObjs.length > 1 && (
              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-gray-800/80 border border-emerald-200/80 dark:border-emerald-800/60 text-xs flex items-center justify-between flex-wrap gap-2">
                <span className="text-gray-500 dark:text-gray-400 font-medium">Guruhlar bo‘yicha to‘lov:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {enrolledGroupObjs.map((g) => (
                    <span
                      key={g.id}
                      className="px-2 py-0.5 rounded-lg bg-emerald-100/70 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 font-bold text-[11px] border border-emerald-300/60 dark:border-emerald-700/60"
                    >
                      {g.name}: {Number(g.monthly_price || g.price || 500000).toLocaleString()} so‘m
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing Mode Selector */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 block">
                  To‘lov usulini tanlang:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'standard', label: 'Standart narx', desc: 'To‘liq guruh narxi', icon: Coins },
                    { id: 'custom', label: 'Maxsus narx', desc: 'Kelishilgan summa', icon: Wallet },
                    { id: 'percent', label: 'Foizli chegirma', desc: '% miqdorda', icon: Percent },
                    { id: 'amount', label: 'Summali chegirma', desc: '-so‘m chegirma', icon: Tag },
                    { id: 'free', label: 'Bepul (Grant)', desc: '0 so‘m (100% grant)', icon: BadgeCheck },
                  ].map((mode) => {
                    const IconComp = mode.icon;
                    const isSelected = tuitionPricingMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setTuitionPricingMode(mode.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-400/30'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <IconComp className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
                          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <div className="text-xs font-bold leading-tight">{mode.label}</div>
                        <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-gray-400'}`}>
                          {mode.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Inputs according to selected mode */}
              {tuitionPricingMode === 'custom' && (
                <div className="p-3.5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 space-y-2.5">
                  <label className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
                    Kelishilgan maxsus oylik to‘lov summasini kiriting (so‘m):
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={customTuitionPrice}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, '');
                          setCustomTuitionPrice(raw ? Number(raw).toLocaleString() : '');
                        }}
                        placeholder="Masalan: 400,000"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                        so‘m / oy
                      </span>
                    </div>
                  </div>
                  {/* Quick price pills */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-gray-400 font-medium">Tezkor tanlov:</span>
                    {[250000, 300000, 350000, 400000, 450000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCustomTuitionPrice(amt.toLocaleString())}
                        className="px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-emerald-100 dark:hover:bg-emerald-950 text-[11px] font-semibold text-gray-700 dark:text-gray-300 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                      >
                        {amt.toLocaleString()} so‘m
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {tuitionPricingMode === 'percent' && (
                <div className="p-3.5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 space-y-2.5">
                  <label className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
                    Chegirma foizini kiriting (%):
                  </label>
                  <div className="relative flex-1 max-w-xs">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(e.target.value)}
                      placeholder="Masalan: 20"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                      %
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-gray-400 font-medium">Tezkor foizlar:</span>
                    {[10, 15, 20, 25, 30, 50].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setDiscountPercent(String(pct))}
                        className="px-2.5 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-emerald-100 dark:hover:bg-emerald-950 text-[11px] font-semibold text-gray-700 dark:text-gray-300 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {tuitionPricingMode === 'amount' && (
                <div className="p-3.5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 space-y-2.5">
                  <label className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
                    Chegirma summasini kiriting (-so‘m):
                  </label>
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={discountAmount}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '');
                        setDiscountAmount(raw ? Number(raw).toLocaleString() : '');
                      }}
                      placeholder="Masalan: 100,000"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                      so‘m chegirma
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-gray-400 font-medium">Tezkor chegirmalar:</span>
                    {[50000, 100000, 150000, 200000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setDiscountAmount(amt.toLocaleString())}
                        className="px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-emerald-100 dark:hover:bg-emerald-950 text-[11px] font-semibold text-gray-700 dark:text-gray-300 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                      >
                        -{amt.toLocaleString()} so‘m
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {tuitionPricingMode === 'free' && (
                <div className="p-4 rounded-2xl bg-emerald-100/70 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs font-semibold text-emerald-900 dark:text-emerald-200 flex items-center gap-3">
                  <BadgeCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-bold">100% Bepul Grant asosida o‘qish</div>
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                      O‘quvchi ushbu guruhda to‘lovsiz tahsil oladi. Tizimda oylik to‘lov summasi 0 so‘m qilib saqlanadi.
                    </div>
                  </div>
                </div>
              )}

              {/* Live Calculation Banner */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                    Yakuniy Oylik To‘lov Miqdori
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-emerald-900 dark:text-emerald-100">
                    {calculatedEffectivePrice.toLocaleString()} so‘m{' '}
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">/ oy</span>
                  </div>
                </div>

                {tuitionPricingMode !== 'standard' && (
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                      Guruh narxidan farqi:
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-600 dark:text-amber-400">
                      <Tag className="w-3.5 h-3.5" />
                      -{(Math.max(0, baseFee - calculatedEffectivePrice)).toLocaleString()} so‘m chegirma
                    </span>
                  </div>
                )}
              </div>

              {/* Discount / Pricing Reason Input */}
              {tuitionPricingMode !== 'standard' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                    Chegirma yoki narx o‘zgarishi sababi (Ixtiyoriy izoh):
                  </label>
                  <input
                    type="text"
                    value={discountReason}
                    onChange={(e) => setDiscountReason(e.target.value)}
                    placeholder="Masalan: Ikkinchi farzand chegirmasi, Olimpiada g‘olibi, Kam ta‘minlangan oila..."
                    className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {/* Quick reason tag buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {[
                      "2-farzand chegirmasi",
                      "Olimpiada sovrindori",
                      "Kam ta‘minlangan oila",
                      "100% Grant",
                      "Erta to‘lov bonusi",
                    ].map((reason) => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => setDiscountReason(reason)}
                        className="px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-emerald-100 dark:hover:bg-emerald-950 text-[11px] font-medium text-gray-600 dark:text-gray-300 hover:text-emerald-700 transition-colors"
                      >
                        + {reason}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Section 6: ⏰ Dars kuni / Qayta bog'lanish eslatmasi (Owner & Admin only) */}
        {selectedRole === ROLES.STUDENT && !isEditing && isOwnerOrAdmin && (
          <Card className="p-5 border-2 border-amber-300 dark:border-amber-900/50 bg-amber-50/20 dark:bg-amber-950/10">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-amber-200/80 dark:border-amber-900/50 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                    6. ⏰ Dars kuni va Qayta bog‘lanish eslatmasi (Admin uchun)
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
