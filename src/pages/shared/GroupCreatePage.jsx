import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
  Plus,
  AlertCircle,
  X,
  Split,
  ArrowRightLeft,
  Clock,
  Search,
  Check,
  CalendarCheck,
  UserCheck,
  UserPlus,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import DatePicker from '@/components/ui/DatePicker';
import Modal from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import {
  createGroup,
  updateGroup,
  getGroupById,
  getGroups,
  generateSubgroupSuggestions,
  enrollStudent,
} from '@/services/groupService';
import { getCourses, createCourse } from '@/services/courseService';
import { getTeachers, createUser } from '@/services/userService';
import { localStore, STORAGE_KEYS } from '@/lib/localStore';
import ImageCropperModal from '@/components/ui/ImageCropperModal';
import GroupSplitModal from '@/components/groups/GroupSplitModal';
import { fileToCompressedDataUrl } from '@/services/settingsService';
import { ROLES } from '@/lib/constants';
import { formatUzPhone, cleanUzPhone } from '@/utils/phoneFormat';

const groupSchema = z.object({
  name: z.string().min(2, 'Guruh nomi kamida 2 ta belgidan iborat bo‘lishi kerak'),
  courseId: z.string().min(1, 'Kursni tanlash shart'),
  teacherId: z.string().optional().or(z.literal('')),
  room: z.string().optional().or(z.literal('')),
  capacity: z.coerce.number().min(1, 'Guruh sig‘imi kamida 1 kishi bo‘lishi kerak').max(100, 'Maksimal sig‘im 100 kishi'),
  monthlyPrice: z.coerce.number().min(0, 'Oylik to‘lov 0 dan kam bo‘lishi mumkin emas').default(500000),
  status: z.enum(['active', 'completed', 'archived', 'upcoming']).default('active'),
  startDate: z.string().optional().or(z.literal('')),
  endDate: z.string().optional().or(z.literal('')),
});

const DAYS_CONFIG = [
  { id: 1, name: 'Dushanba', short: 'Dush', pattern: 'odd' },
  { id: 2, name: 'Seshanba', short: 'Sesh', pattern: 'even' },
  { id: 3, name: 'Chorshanba', short: 'Chor', pattern: 'odd' },
  { id: 4, name: 'Payshanba', short: 'Pay', pattern: 'even' },
  { id: 5, name: 'Juma', short: 'Jum', pattern: 'odd' },
  { id: 6, name: 'Shanba', short: 'Shan', pattern: 'even' },
  { id: 7, name: 'Yakshanba', short: 'Yak', pattern: 'sunday' },
];

const TIME_PRESETS = [
  { label: '09:00 - 10:30', start: '09:00', end: '10:30' },
  { label: '09:30 - 11:00', start: '09:30', end: '11:00' },
  { label: '10:00 - 11:30', start: '10:00', end: '11:30' },
  { label: '10:30 - 12:00', start: '10:30', end: '12:00' },
  { label: '11:00 - 12:30', start: '11:00', end: '12:30' },
  { label: '14:00 - 15:30', start: '14:00', end: '15:30' },
  { label: '15:30 - 17:00', start: '15:30', end: '17:00' },
  { label: '16:00 - 17:30', start: '16:00', end: '17:30' },
  { label: '17:00 - 18:30', start: '17:00', end: '18:30' },
  { label: '17:30 - 19:00', start: '17:30', end: '19:00' },
  { label: '18:00 - 19:30', start: '18:00', end: '19:30' },
  { label: '07:00 - 08:30', start: '07:00', end: '08:30' },
  { label: '08:30 - 10:00', start: '08:30', end: '10:00' },
];

export default function GroupCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { profile } = useAuth();
  const currentUserRole = profile?.role || ROLES.OWNER;
  const isTeacher = currentUserRole === ROLES.TEACHER;
  const isEditing = Boolean(id);

  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [splitModalGroup, setSplitModalGroup] = useState(null);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [cropModalFile, setCropModalFile] = useState(null);

  // Quick Inline Course Creation state
  const [isCreatingInlineCourse, setIsCreatingInlineCourse] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseFee, setNewCourseFee] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [isSavingCourse, setIsSavingCourse] = useState(false);

  // Quick Inline Teacher Creation state
  const [isCreatingInlineTeacher, setIsCreatingInlineTeacher] = useState(false);
  const [newTeacherFirstName, setNewTeacherFirstName] = useState('');
  const [newTeacherLastName, setNewTeacherLastName] = useState('');
  const [newTeacherPhone, setNewTeacherPhone] = useState('+998 ');
  const [isSavingTeacher, setIsSavingTeacher] = useState(false);

  const teacherFullName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || profile?.fullName || profile?.name || '';

  // Lesson Schedule (Days and Time) state
  const [hasSchedule, setHasSchedule] = useState(true);
  const [selectedDays, setSelectedDays] = useState([1, 3, 5]); // Default: Toq kunlar (D/CH/J)
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');

  // Enrolled Students state
  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentFilter, setStudentFilter] = useState('all'); // 'all' | 'unassigned' | 'selected'

  // Quick Inline Student Creation state (2-yo‘l)
  const [studentMode, setStudentMode] = useState('list'); // 'list' | 'create'
  const [newStudentFirst, setNewStudentFirst] = useState('');
  const [newStudentLast, setNewStudentLast] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('+998 ');
  const [newStudentParentPhone, setNewStudentParentPhone] = useState('+998 ');
  const [newStudentPassword, setNewStudentPassword] = useState('');
  const [isSavingStudent, setIsSavingStudent] = useState(false);

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
      courseId: searchParams.get('courseId') || '',
      teacherId: isTeacher ? (profile?.id || '') : '',
      room: '',
      capacity: 20,
      monthlyPrice: 500000,
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

  // Existing groups for the selected course
  const existingCourseGroups = useMemo(() => {
    if (!selectedCourseId) return [];
    return allGroups.filter(
      (g) =>
        (g.course_id === selectedCourseId || g.courseId === selectedCourseId) &&
        (!isEditing || g.id !== id)
    );
  }, [allGroups, selectedCourseId, isEditing, id]);

  // Smart Subgroup suggestions (e.g. ENG-1.1, ENG-1.2)
  const subgroupSuggestions = useMemo(() => {
    return generateSubgroupSuggestions(selectedCourse?.name || '', existingCourseGroups.length);
  }, [selectedCourse, existingCourseGroups.length]);

  const handleQuickApplySubgroup = (subgroupNum) => {
    if (!selectedCourse) {
      toast.error('Avval kurs fanini tanlang!');
      return;
    }
    const cName = selectedCourse.name || 'Kurs';
    const pfx = subgroupSuggestions.prefix || 'GRP';
    const proposedName = `${cName} 1.${subgroupNum} (${pfx}-1.${subgroupNum})`;
    setValue('name', proposedName, { shouldValidate: true });

    if (existingCourseGroups.length > 0) {
      const firstG = existingCourseGroups[0];
      if (firstG.room && (!watch('room') || watch('room') === '')) {
        setValue('room', `${firstG.room}B`);
      }
      if (firstG.teacher_id && !watch('teacherId') && !isTeacher) {
        setValue('teacherId', firstG.teacher_id);
      }
    }
    if (!watch('capacity') || Number(watch('capacity')) === 20) {
      setValue('capacity', 25);
    }
    toast.success(`✓ "${proposedName}" parametrlari to‘ldirildi!`);
  };

  const handleOpenSplitGroup = (grp) => {
    setSplitModalGroup(grp);
  };

  const handleSelectDayPattern = (type) => {
    if (type === 'odd') {
      setSelectedDays([1, 3, 5]);
      toast.info('Toq kunlar (D / CH / J) tanlandi');
    } else if (type === 'even') {
      setSelectedDays([2, 4, 6]);
      toast.info('Juft kunlar (S / P / SH) tanlandi');
    } else if (type === 'everyday') {
      setSelectedDays([1, 2, 3, 4, 5, 6]);
      toast.info('Har kuni (Dush - Shanba) tanlandi');
    } else if (type === 'weekend') {
      setSelectedDays([6, 7]);
      toast.info('Dam olish kunlari (Shanba, Yakshanba) tanlandi');
    }
  };

  const handleToggleDay = (dayId) => {
    setSelectedDays((prev) => {
      if (prev.includes(dayId)) {
        return prev.filter((d) => d !== dayId);
      } else {
        return [...prev, dayId].sort((a, b) => a - b);
      }
    });
  };

  const cleanNewStudentPhone = cleanUzPhone(newStudentPhone);
  const cleanNewParentPhone = cleanUzPhone(newStudentParentPhone);

  // Check if student personal phone already belongs to another user
  const studentPhoneConflict = useMemo(() => {
    if (!cleanNewStudentPhone || cleanNewStudentPhone.length < 9) return null;
    const allUsers = localStore.getUsers ? localStore.getUsers() : [];
    return allUsers.find((u) => {
      const uPhone = cleanUzPhone(u.phone);
      return uPhone && uPhone === cleanNewStudentPhone;
    });
  }, [cleanNewStudentPhone]);

  // Check if parent phone is shared by siblings (already in center)
  const parentSiblings = useMemo(() => {
    if (!cleanNewParentPhone || cleanNewParentPhone.length < 9) return [];
    const allUsers = localStore.getUsers ? localStore.getUsers() : [];
    return allUsers.filter((u) => {
      if (u.role !== 'student') return false;
      const uFather = cleanUzPhone(u.father_phone);
      const uMother = cleanUzPhone(u.mother_phone);
      return (uFather && uFather === cleanNewParentPhone) || (uMother && uMother === cleanNewParentPhone);
    });
  }, [cleanNewParentPhone]);

  const filteredStudents = useMemo(() => {
    let list = allStudents;

    if (studentFilter === 'selected') {
      list = list.filter((s) => selectedStudentIds.includes(s.id));
    } else if (studentFilter === 'unassigned') {
      list = list.filter((s) => {
        const gids = Array.isArray(s.group_ids) ? s.group_ids : (s.group_id ? [s.group_id] : []);
        return gids.length === 0;
      });
    }

    if (!studentSearch.trim()) return list;
    const q = studentSearch.toLowerCase().trim();
    return list.filter((s) => {
      const fullName = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
      const phone = (s.phone || '').replace(/\D/g, '');
      const fatherPhone = (s.father_phone || '').replace(/\D/g, '');
      const motherPhone = (s.mother_phone || '').replace(/\D/g, '');
      const username = (s.username || '').toLowerCase();
      return (
        fullName.includes(q) ||
        phone.includes(q) ||
        fatherPhone.includes(q) ||
        motherPhone.includes(q) ||
        username.includes(q)
      );
    });
  }, [allStudents, studentSearch, studentFilter, selectedStudentIds]);

  const handleCreateInlineStudent = async (e) => {
    e?.preventDefault?.();
    const first = newStudentFirst.trim();
    const last = newStudentLast.trim();
    if (!first || !last) {
      toast.error('O‘quvchining ismi va familiyasini kiriting!');
      return;
    }
    if (!cleanNewStudentPhone) {
      toast.error('O‘quvchining shaxsiy telefon raqamini (Login uchun) to‘liq kiriting!');
      return;
    }
    if (studentPhoneConflict) {
      toast.error(
        `Bu telefon raqam (+${cleanNewStudentPhone}) bilan tizimda allaqachon boshqa foydalanuvchi (${studentPhoneConflict.full_name || studentPhoneConflict.username}) ro‘yxatdan o‘tgan! Har bir talaba faqat o‘zining shaxsiy raqamiga ega bo‘lishi shart.`
      );
      return;
    }
    if (!cleanNewParentPhone) {
      toast.error('Ota-onaning telefon raqamini (SMS xabarlar uchun) to‘liq kiriting!');
      return;
    }

    try {
      setIsSavingStudent(true);
      const createdStudent = await createUser({
        firstName: first,
        lastName: last,
        phone: cleanNewStudentPhone,
        fatherPhone: cleanNewParentPhone,
        role: ROLES.STUDENT,
        password: newStudentPassword.trim() || 'Talaba#2026!',
        isActive: true,
      });

      setAllStudents((prev) => [createdStudent, ...prev]);
      setSelectedStudentIds((prev) => (prev.includes(createdStudent.id) ? prev : [...prev, createdStudent.id]));

      toast.success(`✓ "${first} ${last}" o‘quvchi yaratildi va guruhga biriktirildi!`);

      // Reset inline form
      setNewStudentFirst('');
      setNewStudentLast('');
      setNewStudentPhone('+998 ');
      setNewStudentParentPhone('+998 ');
      setNewStudentPassword('');
      setStudentMode('list');
    } catch (err) {
      toast.error(`Xatolik: ${err.message}`);
    } finally {
      setIsSavingStudent(false);
    }
  };

  const handleToggleStudent = (studentId) => {
    setSelectedStudentIds((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const handleSelectAllStudents = () => {
    const ids = filteredStudents.map((s) => s.id);
    setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...ids])));
    toast.info(`${ids.length} ta o‘quvchi tanlandi`);
  };

  const handleClearStudents = () => {
    setSelectedStudentIds([]);
  };

  // Pre-fill query param name or subgroup if present, and resolve courseId / courseName
  useEffect(() => {
    if (!isEditing && courses.length > 0) {
      const qCid = searchParams.get('courseId');
      const qCname = searchParams.get('courseName');
      const currentSelected = courses.find((c) => c.id === selectedCourseId);
      if (!currentSelected && (qCid || qCname)) {
        const matched =
          courses.find((c) => c.id === qCid) ||
          courses.find((c) => qCname && c.name?.toLowerCase() === qCname.toLowerCase()) ||
          (qCid?.includes('it') || qCname?.toLowerCase().includes('dasturlash') || qCname?.toLowerCase().includes('frontend')
            ? courses.find((c) => c.id === 'crs-fullstack')
            : null) ||
          (qCname?.toLowerCase().includes('rus') || qCname?.toLowerCase().includes('рус')
            ? courses.find((c) => c.id === 'crs-rus-tili')
            : null);
        if (matched) {
          setValue('courseId', matched.id, { shouldValidate: true });
        }
      }

      const qSubgroup = searchParams.get('subgroup');
      if (qSubgroup && selectedCourse) {
        handleQuickApplySubgroup(Number(qSubgroup) || 2);
      }
      const qName = searchParams.get('name');
      if (qName) {
        setValue('name', qName, { shouldValidate: true });
      }
    }
  }, [searchParams, selectedCourse, courses, selectedCourseId, isEditing, setValue]);

  // Auto pre-fill group monthly price from course fee when a course is selected
  useEffect(() => {
    if (!isEditing && selectedCourseId && courses.length > 0) {
      const matched = courses.find((c) => c.id === selectedCourseId);
      if (matched && (!watch('monthlyPrice') || Number(watch('monthlyPrice')) === 0)) {
        setValue('monthlyPrice', matched.monthly_fee || 0, { shouldValidate: true });
      }
    }
  }, [selectedCourseId, courses, isEditing, setValue, watch]);

  // Load courses, teachers and all existing groups
  const loadData = async () => {
    setLoadingOptions(true);
    try {
      const [courseRes, teacherRes, groupRes] = await Promise.all([
        getCourses({ status: 'active', limit: 100 }),
        getTeachers(),
        getGroups({ limit: 100 }),
      ]);
      setCourses(courseRes.courses || []);
      setTeachers(teacherRes || []);
      setAllGroups(groupRes.groups || []);

      const allUsers = localStore.getUsers ? localStore.getUsers() : [];
      const studentList = allUsers.filter((u) => u.role === 'student');
      setAllStudents(studentList);
    } catch (err) {
      console.error('Failed to load group options:', err);
    } finally {
      setLoadingOptions(false);
    }
  };

  // If teacher is logged in, ensure teacherId is bound to their teacher record
  useEffect(() => {
    if (isTeacher && teachers.length > 0 && !watch('teacherId')) {
      const myId = profile?.id;
      const myName = teacherFullName.trim().toLowerCase();
      const matched = teachers.find(
        (t) =>
          t.id === myId ||
          t.username === profile?.username ||
          (myName && `${t.first_name || ''} ${t.last_name || ''}`.toLowerCase().includes(myName)) ||
          (t.phone && profile?.phone && t.phone.replace(/\D/g, '') === profile?.phone.replace(/\D/g, ''))
      );
      if (matched) {
        setValue('teacherId', matched.id);
      } else if (myId) {
        setValue('teacherId', myId);
      }
    }
  }, [isTeacher, teachers, profile, teacherFullName, setValue, watch]);

  useEffect(() => {
    let mounted = true;
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

            // Pre-fill existing students
            const existingStudentIds = Array.isArray(grp.student_ids) && grp.student_ids.length > 0
              ? grp.student_ids
              : (grp.students || []).map((s) => s.id);
            if (existingStudentIds.length > 0) {
              setSelectedStudentIds(existingStudentIds);
            }

            // Pre-fill existing schedules
            const allSchedules = localStore.getSchedules ? localStore.getSchedules() : [];
            const grpSchedules = allSchedules.filter((s) => s.group_id === id);
            if (grpSchedules.length > 0) {
              const days = grpSchedules.map((s) => Number(s.day_of_week));
              setSelectedDays(Array.from(new Set(days)));
              if (grpSchedules[0].start_time) {
                setStartTime(grpSchedules[0].start_time.slice(0, 5));
              }
              if (grpSchedules[0].end_time) {
                setEndTime(grpSchedules[0].end_time.slice(0, 5));
              }
              setHasSchedule(true);
            } else if (grp.schedule || grp.schedule_time) {
              const schedStr = grp.schedule || '';
              if (/sesh|pay|shan/i.test(schedStr)) {
                setSelectedDays([2, 4, 6]);
              } else if (/dush|chor|jum/i.test(schedStr)) {
                setSelectedDays([1, 3, 5]);
              } else if (/har kuni/i.test(schedStr)) {
                setSelectedDays([1, 2, 3, 4, 5, 6]);
              } else if (/dam olish|shanba.*yakshanba/i.test(schedStr)) {
                setSelectedDays([6, 7]);
              }
              const timeMatch = (grp.schedule_time || schedStr).match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
              if (timeMatch) {
                setStartTime(timeMatch[1]);
                setEndTime(timeMatch[2]);
              }
              setHasSchedule(true);
            }
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
      toast.success(`"${name}" yangi ta‘lim yo‘nalishi yaratildi va guruhga tanlandi!`);
      const res = await getCourses({ status: 'active', limit: 100 });
      setCourses(res.courses || []);
      setValue('courseId', created.id, { shouldValidate: true });
      if (fee > 0) {
        setValue('monthlyPrice', fee, { shouldValidate: true });
      }
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

  const handleCreateInlineTeacher = async (e) => {
    e?.preventDefault?.();
    const firstName = newTeacherFirstName.trim();
    const lastName = newTeacherLastName.trim();
    const phone = cleanUzPhone(newTeacherPhone);
    if (!firstName || !lastName) {
      toast.error('O‘qituvchining ismi va familiyasini kiriting!');
      return;
    }
    if (!phone) {
      toast.error('O‘qituvchining telefon raqamini to‘liq kiriting!');
      return;
    }
    try {
      setIsSavingTeacher(true);
      const created = await createUser({
        firstName,
        lastName,
        phone,
        role: ROLES.TEACHER,
        courseId: selectedCourseId || null,
        subject: selectedCourse?.name || '',
      });
      toast.success(`Ustoz "${firstName} ${lastName}" muvaffaqiyatli qo‘shildi va biriktirildi!`);
      const teacherRes = await getTeachers();
      setTeachers(teacherRes || []);
      setValue('teacherId', created.id);
      setIsCreatingInlineTeacher(false);
      setNewTeacherFirstName('');
      setNewTeacherLastName('');
      setNewTeacherPhone('+998 ');
    } catch (err) {
      toast.error(`Xatolik: ${err.message}`);
    } finally {
      setIsSavingTeacher(false);
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const actualTeacherId = isTeacher ? (profile?.id || data.teacherId || null) : (data.teacherId || null);
      const teacherUser = teachers.find((t) => t.id === actualTeacherId);
      const actualTeacherName = isTeacher
        ? (teacherFullName || profile?.fullName || profile?.name)
        : (teacherUser ? `${teacherUser.first_name || ''} ${teacherUser.last_name || ''}`.trim() || teacherUser.fullName : null);

      const payload = {
        name: data.name,
        courseId: data.courseId,
        teacherId: actualTeacherId,
        teacher_id: actualTeacherId,
        teacher_name: actualTeacherName,
        room: data.room || null,
        capacity: Number(data.capacity) || 20,
        monthly_price: Number(data.monthlyPrice) || 0,
        monthlyPrice: Number(data.monthlyPrice) || 0,
        status: data.status,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
        avatar_url: avatarUrl,
        image_url: avatarUrl,
        student_ids: selectedStudentIds,
        enrolled_count: selectedStudentIds.length,
        days: selectedDays,
        startTime,
        endTime,
      };

      let targetGroupId = id;
      if (isEditing) {
        await updateGroup(id, payload);
      } else {
        const created = await createGroup(payload);
        targetGroupId = created?.id;
      }

      // 1. Auto-generate timetable slots for the teacher & group
      if (hasSchedule && selectedDays.length > 0 && targetGroupId) {
        localStore.saveGroupSchedule({
          groupId: targetGroupId,
          days: selectedDays,
          startTime,
          endTime,
          room: data.room || '101-xona',
          teacherId: actualTeacherId,
          teacherName: actualTeacherName,
        });
      }

      // 2. Sync enrolled students (add new, remove deselected)
      if (targetGroupId) {
        if (isEditing) {
          const currentGroup = await getGroupById(targetGroupId);
          const currentIds = (currentGroup?.students || []).map((s) => s.id);
          for (const studentId of selectedStudentIds) {
            if (!currentIds.includes(studentId)) {
              await enrollStudent(targetGroupId, studentId);
            }
          }
          for (const studentId of currentIds) {
            if (!selectedStudentIds.includes(studentId)) {
              await removeStudent(targetGroupId, studentId);
            }
          }
        } else if (selectedStudentIds.length > 0) {
          for (const studentId of selectedStudentIds) {
            await enrollStudent(targetGroupId, studentId);
          }
        }
        const grps = localStore.getGroups();
        const gIdx = grps.findIndex((g) => g.id === targetGroupId);
        if (gIdx >= 0) {
          grps[gIdx].student_ids = selectedStudentIds;
          grps[gIdx].enrolled_count = selectedStudentIds.length;
          localStore.saveGroup(grps[gIdx]);
        }
      }

      // 3. Sync to Cloudflare D1
      localStore.pushToServer({
        [STORAGE_KEYS.GROUPS]: localStore.getGroups(),
        [STORAGE_KEYS.LESSON_SCHEDULES]: localStore.getSchedules(),
        [STORAGE_KEYS.MEMBERSHIPS]: localStore.getMemberships(),
      }).catch(() => {});

      toast.success(
        isEditing
          ? t('groups.updateSuccess', 'Guruh, dars jadvali va talabalar ro‘yxati muvaffaqiyatli saqlandi!')
          : t('groups.createSuccess', 'Yangi guruh ochildi, dars jadvaliga avtomatik kiritildi va talabalar biriktirildi!')
      );
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

      {/* Visual Workflow Steps Guide (1 Kurs = Ko‘p Parallel Guruhlar Mantiqi) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-blue-50/60 to-indigo-50/70 dark:from-emerald-950/30 dark:via-blue-950/20 dark:to-indigo-950/30 border border-emerald-200/80 dark:border-emerald-900/50 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-950 dark:text-emerald-200">
              Guruh ochish mantiqi: 1 ta Kurs = Ko‘p parallel guruhlar
            </span>
          </div>
          <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-bold bg-white/80 dark:bg-gray-800/80 px-2.5 py-0.5 rounded-full border border-emerald-300/60 dark:border-emerald-800">
            Har bir fan kursi 1 ta bo‘ladi, uning ostida 1.1, 1.2, 1.3... kabi cheksiz guruhlar ochiladi
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div
            className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
              selectedCourse
                ? 'bg-emerald-100/80 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-bold'
                : 'bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full font-black flex items-center justify-center text-[10px] shrink-0 ${
                selectedCourse ? 'bg-emerald-600 text-white' : 'bg-gray-400 text-white'
              }`}
            >
              ✓
            </span>
            <span className="truncate">
              {selectedCourse ? `1. Kurs: ${selectedCourse.name}` : '1. Asosiy Kurs tanlash'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl border bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-amber-600 text-white font-black flex items-center justify-center text-[10px] shrink-0">2</span>
            <span className="truncate">2. O‘qituvchi & Xona</span>
          </div>
          <div className="p-2.5 rounded-xl border bg-indigo-100/90 border-indigo-300 dark:bg-indigo-950/60 font-bold text-indigo-950 dark:text-indigo-200 ring-2 ring-indigo-400/50 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center text-[10px] shrink-0">3</span>
            <span className="truncate">3. Dars jadvali (Kun & Vaqt)</span>
          </div>
          <div className="p-2.5 rounded-xl border bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 flex items-center gap-2 font-bold">
            <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-black flex items-center justify-center text-[10px] shrink-0">4</span>
            <span className="truncate">4. O‘quvchilar ({selectedStudentIds.length} ta)</span>
          </div>
        </div>
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

              {/* Quick Subgroup Name Recommendation Chips */}
              <div className="pt-1.5 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 dark:text-gray-400">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Tavsiya etilgan sub-guruh nomlari:</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {subgroupSuggestions.suggestions.slice(0, 5).map((sug) => (
                    <button
                      key={sug.code}
                      type="button"
                      onClick={() => {
                        setValue('name', sug.name, { shouldValidate: true });
                        toast.info(`Guruh nomi tanlandi: "${sug.name}"`);
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-100 hover:bg-emerald-100 dark:bg-gray-800 dark:hover:bg-emerald-950 text-gray-700 hover:text-emerald-700 dark:text-gray-300 dark:hover:text-emerald-300 border border-gray-200 dark:border-gray-700 transition-all cursor-pointer active:scale-95 flex items-center gap-1 shadow-2xs"
                      title={`Guruh nomini "${sug.name}" ga o‘zgartirish`}
                    >
                      <span>🏷️</span>
                      <span>{sug.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Course Selector & Inline Creator */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Kurs fani / Ta‘lim yo‘nalishi <span className="text-brand-red">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCreatingInlineCourse(!isCreatingInlineCourse)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isCreatingInlineCourse ? 'Yopish' : 'Yangi yo‘nalish'}</span>
                </button>
              </div>

              {/* Inline Course Creation Card */}
              {isCreatingInlineCourse && (
                <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 space-y-3 animate-fade-in mb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <h4 className="text-xs font-bold text-blue-950 dark:text-blue-200 uppercase tracking-wide">
                        Yangi ta‘lim yo‘nalishi (Kurs) ochish
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCreatingInlineCourse(false)}
                      className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                        Kurs nomi <span className="text-brand-red">*</span>
                      </label>
                      <Input
                        placeholder="Masalan: Frontend Boot-2026 yoki Ingliz tili"
                        value={newCourseName}
                        onChange={(e) => setNewCourseName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                        Oylik to‘lov (so‘m)
                      </label>
                      <Input
                        placeholder="Masalan: 500000"
                        value={newCourseFee}
                        onChange={(e) => setNewCourseFee(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Kurs tavsifi (ixtiyoriy)
                    </label>
                    <Input
                      placeholder="Masalan: Noldan professional darajagacha darslar"
                      value={newCourseDesc}
                      onChange={(e) => setNewCourseDesc(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
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
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                    >
                      Yo‘nalishni saqlash va tanlash
                    </Button>
                  </div>
                </div>
              )}

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

              {courses.length === 0 && !isCreatingInlineCourse && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span>Tizimda hali kurslar mavjud emas. Yuqoridagi tugma orqali yo‘nalish yarating!</span>
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
          </div>

          {/* Parallel Groups & Subgroup Assistant Box */}
          {selectedCourse && (
            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-emerald-50/60 dark:from-blue-950/40 dark:via-gray-900/60 dark:to-emerald-950/30 border border-blue-200 dark:border-blue-900/60 space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-blue-950 dark:text-blue-200">
                    «{selectedCourse.name}» bo‘yicha mavjud guruhlar ({existingCourseGroups.length} ta)
                  </h4>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white dark:bg-gray-800 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Parallel guruhlar tizimi
                </span>
              </div>

              {existingCourseGroups.length === 0 ? (
                <div className="p-3 rounded-xl bg-white/80 dark:bg-gray-800/80 border border-blue-100 dark:border-blue-900 text-xs text-gray-600 dark:text-gray-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span>Ushbu yo‘nalishda hali guruhlar ochilmagan. 1-asosiy guruhni yaratish tavsiya etiladi.</span>
                  <button
                    type="button"
                    onClick={() => handleQuickApplySubgroup(1)}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shrink-0 shadow-xs cursor-pointer"
                  >
                    ⚡ 1-guruh nomini qo‘yish ({subgroupSuggestions.prefix}-1.1)
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 gap-2">
                    <div className="text-xs text-emerald-950 dark:text-emerald-200">
                      <span className="font-bold">1 Kurs = Ko‘p guruhlar:</span> «{selectedCourse.name}» kursi ostida navbatdagi yangi parallel guruhni avtomatik to‘ldirish
                    </div>
                    <button
                      type="button"
                      onClick={() => handleQuickApplySubgroup(existingCourseGroups.length + 1)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-xs cursor-pointer flex items-center justify-center gap-1.5 shrink-0 transition-transform active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{selectedCourse.name} 1.{existingCourseGroups.length + 1}</span>
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {existingCourseGroups.map((cg) => {
                      const count = cg.studentCount || cg.enrolled_count || (cg.student_ids || []).length || 0;
                      const cap = cg.capacity || 20;
                      const isFull = count >= cap;
                      return (
                        <div
                          key={cg.id}
                          className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all ${
                            isFull
                              ? 'bg-red-50/90 dark:bg-red-950/40 border-red-300 dark:border-red-900 shadow-2xs'
                              : 'bg-white/90 dark:bg-gray-800/90 border-gray-200/80 dark:border-gray-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`w-3 h-3 rounded-full shrink-0 ${
                                isFull ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'
                              }`}
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-black text-gray-900 dark:text-white truncate">
                                {cg.name}
                              </div>
                              <div className="text-[11px] text-gray-500 dark:text-gray-400">
                                {cg.room || 'Xona'} • Ustoz: {cg.teacher_name || 'Ustoz'} •{' '}
                                <span className={isFull ? 'text-red-600 dark:text-red-400 font-black' : 'text-emerald-600 dark:text-emerald-400 font-bold'}>
                                  {count} / {cap} talaba {isFull && '(Sig‘im to‘lgan! ⚠️)'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => navigate(`/${currentUserRole}/groups/edit/${cg.id}`)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors cursor-pointer"
                              title="Ushbu guruhni tahrirlashga o‘tish"
                            >
                              ✏️ Tahrirlash
                            </button>
                            {isFull && (
                              <button
                                type="button"
                                onClick={() => handleOpenSplitGroup(cg)}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-red-600 hover:bg-red-700 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1 active:scale-95"
                                title="Ushbu to‘lgan guruhni 2-guruhga ajratish"
                              >
                                <Split className="w-3 h-3" />
                                <span>2-guruhga ajratish</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Quick Parallel Group Creation Buttons */}
                  <div className="pt-2 border-t border-blue-200/60 dark:border-blue-900/40 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Keyingi parallel guruhni ochish:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuickApplySubgroup(2)}
                      className="px-3 py-1.5 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-transform active:scale-95 cursor-pointer flex items-center gap-1"
                    >
                      <span>➕ 2-guruhni ochish ({subgroupSuggestions.prefix}-1.2)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickApplySubgroup(3)}
                      className="px-3 py-1.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-transform active:scale-95 cursor-pointer flex items-center gap-1"
                    >
                      <span>➕ 3-guruhni ochish ({subgroupSuggestions.prefix}-1.3)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
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
            {/* Teacher Selector & Inline Creator */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Asosiy o‘qituvchi (Ustoz)
                </label>
                {!isTeacher && (
                  <button
                    type="button"
                    onClick={() => setIsCreatingInlineTeacher(!isCreatingInlineTeacher)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isCreatingInlineTeacher ? 'Yopish' : 'Yangi o‘qituvchi'}</span>
                  </button>
                )}
              </div>

              {/* Inline Teacher Creation Card */}
              {isCreatingInlineTeacher && (
                <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-3 animate-fade-in mb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-200 uppercase tracking-wide">
                        Yangi o‘qituvchi (Ustoz) qo‘shish
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCreatingInlineTeacher(false)}
                      className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                        Ism <span className="text-brand-red">*</span>
                      </label>
                      <Input
                        placeholder="Masalan: Sardor"
                        value={newTeacherFirstName}
                        onChange={(e) => setNewTeacherFirstName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                        Familiya <span className="text-brand-red">*</span>
                      </label>
                      <Input
                        placeholder="Masalan: Alimov"
                        value={newTeacherLastName}
                        onChange={(e) => setNewTeacherLastName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Telefon raqami (Login uchun) <span className="text-brand-red">*</span>
                    </label>
                    <Input
                      placeholder="+998 90 123 45 67"
                      value={newTeacherPhone}
                      onChange={(e) => setNewTeacherPhone(formatUzPhone(e.target.value))}
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsCreatingInlineTeacher(false)}
                    >
                      Bekor qilish
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      isLoading={isSavingTeacher}
                      onClick={handleCreateInlineTeacher}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    >
                      O‘qituvchini saqlash va biriktirish
                    </Button>
                  </div>
                </div>
              )}

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
              {teachers.length === 0 && !isCreatingInlineTeacher && !isTeacher && (
                <div className="p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span>Hozircha tizimda o‘qituvchilar yo‘q. Yuqoridagi tugma orqali o‘qituvchini tezkor qo‘shishingiz yoki guruhni hozircha o‘qituvchisiz saqlashingiz mumkin.</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreatingInlineTeacher(true)}
                    className="shrink-0 font-bold border-blue-300 text-blue-900 dark:text-blue-200"
                  >
                    + Yangi o‘qituvchi
                  </Button>
                </div>
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

        {/* Section 3: Lesson Days & Time (Automatic Timetable Integration) */}
        <Card className="p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  3. Dars kunlari va Dars vaqti (Jadvalga avtomatik kiritish)
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Belgilangan kunlar va vaqt o‘qituvchining «Mening dars jadvalim» va umumiy dars jadvaliga avtomatik qo‘shiladi
                </p>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800">
              <input
                type="checkbox"
                checked={hasSchedule}
                onChange={(e) => setHasSchedule(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span>Dars jadvalini shakllantirish</span>
            </label>
          </div>

          {hasSchedule ? (
            <div className="space-y-5">
              {/* Day Pattern Presets */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Dars kunlari andozasi (Hafta kunlari)</span>
                    <span className="text-brand-red">*</span>
                  </label>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {selectedDays.length} ta kun tanlandi
                  </span>
                </div>

                {/* 2 Primary Big Cards: Toq kunlar vs Juft kunlar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Toq kunlar Card */}
                  <button
                    type="button"
                    onClick={() => handleSelectDayPattern('odd')}
                    className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between gap-2.5 ${
                      selectedDays.length === 3 && [1, 3, 5].every((d) => selectedDays.includes(d))
                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/50 shadow-md ring-2 ring-indigo-500/30'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark-tertiary hover:border-indigo-300 dark:hover:border-indigo-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 w-full">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                          selectedDays.length === 3 && [1, 3, 5].every((d) => selectedDays.includes(d))
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                        }`}>
                          D/CH/J
                        </div>
                        <div>
                          <div className="font-extrabold text-sm text-gray-900 dark:text-white">
                            Toq kunlar (D / CH / J)
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Dushanba • Chorshanba • Juma
                          </div>
                        </div>
                      </div>
                      {selectedDays.length === 3 && [1, 3, 5].every((d) => selectedDays.includes(d)) && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-600 text-white">
                          ✓ Tanlangan
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {['Dushanba', 'Chorshanba', 'Juma'].map((dn) => (
                        <span
                          key={dn}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            selectedDays.length === 3 && [1, 3, 5].every((d) => selectedDays.includes(d))
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {dn}
                        </span>
                      ))}
                    </div>
                  </button>

                  {/* Juft kunlar Card */}
                  <button
                    type="button"
                    onClick={() => handleSelectDayPattern('even')}
                    className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between gap-2.5 ${
                      selectedDays.length === 3 && [2, 4, 6].every((d) => selectedDays.includes(d))
                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/50 shadow-md ring-2 ring-indigo-500/30'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark-tertiary hover:border-indigo-300 dark:hover:border-indigo-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 w-full">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                          selectedDays.length === 3 && [2, 4, 6].every((d) => selectedDays.includes(d))
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                        }`}>
                          S/P/SH
                        </div>
                        <div>
                          <div className="font-extrabold text-sm text-gray-900 dark:text-white">
                            Juft kunlar (S / P / SH)
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Seshanba • Payshanba • Shanba
                          </div>
                        </div>
                      </div>
                      {selectedDays.length === 3 && [2, 4, 6].every((d) => selectedDays.includes(d)) && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-600 text-white">
                          ✓ Tanlangan
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {['Seshanba', 'Payshanba', 'Shanba'].map((dn) => (
                        <span
                          key={dn}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            selectedDays.length === 3 && [2, 4, 6].every((d) => selectedDays.includes(d))
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {dn}
                        </span>
                      ))}
                    </div>
                  </button>
                </div>

                {/* Secondary options: Har kuni / Dam olish */}
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleSelectDayPattern('everyday')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      selectedDays.length === 6 && [1, 2, 3, 4, 5, 6].every((d) => selectedDays.includes(d))
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Har kuni (Dush - Shanba)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectDayPattern('weekend')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      selectedDays.length === 2 && [6, 7].every((d) => selectedDays.includes(d))
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Dam olish (Shanba • Yakshanba)
                  </button>
                </div>

                {/* Individual Days Toggle Pills */}
                <div className="pt-2">
                  <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1.5">
                    Kunlarni alohida tanlash yoki o‘zgartirish:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {DAYS_CONFIG.map((d) => {
                      const isSelected = selectedDays.includes(d.id);
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => handleToggleDay(d.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-xs scale-102 ring-1 ring-indigo-400'
                              : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                            isSelected ? 'bg-white text-indigo-700 font-black' : 'bg-gray-300 dark:bg-gray-600 text-transparent'
                          }`}>
                            ✓
                          </span>
                          <span>{d.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Lesson Time Range and Quick Presets */}
              <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Dars vaqti oralig‘i</span>
                    <span className="text-brand-red">*</span>
                  </label>
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                    {startTime} — {endTime}
                  </span>
                </div>

                {/* Quick Time Presets (from official Educo table) */}
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400">
                    Tezkor dars vaqtlari (Tavsiya etilgan jadvallar):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {TIME_PRESETS.map((tp) => {
                      const isActive = startTime === tp.start && endTime === tp.end;
                      return (
                        <button
                          key={tp.label}
                          type="button"
                          onClick={() => {
                            setStartTime(tp.start);
                            setEndTime(tp.end);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                            isActive
                              ? 'bg-emerald-600 text-white shadow-xs font-bold scale-102'
                              : 'bg-gray-100 hover:bg-emerald-50 dark:bg-gray-800 dark:hover:bg-emerald-950/40 text-gray-700 dark:text-gray-300 hover:text-emerald-700 dark:hover:text-emerald-300 border border-gray-200/80 dark:border-gray-700'
                          }`}
                        >
                          {tp.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Time Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Boshlanish vaqti
                    </label>
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Tugash vaqti
                    </label>
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Automatic Timetable Integration Notice */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-50 to-emerald-50 dark:from-indigo-950/40 dark:to-emerald-950/30 border border-indigo-200 dark:border-indigo-900/60 flex items-start gap-3">
                <CalendarCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-950 dark:text-indigo-200 space-y-0.5">
                  <div className="font-bold">
                    Avtomatik dars jadvali integratsiyasi:
                  </div>
                  <div>
                    Ushbu guruh saqlanganda, haftaning <strong>{selectedDays.length} ta kunida</strong> (soat <strong>{startTime} - {endTime}</strong> oralig‘ida) mas‘ul o‘qituvchining dars jadvaliga darslar avtomatik joylashtiriladi. O‘qituvchi «Mening dars jadvalim» sahifasini ochganda ushbu darslar darhol ko‘rinadi.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400">
              Dars jadvali avtomatik yaratilmaydi. Guruh saqlangach, dars jadvalini Dars jadvali bo‘limidan qo‘lda kiritishingiz mumkin.
            </div>
          )}
        </Card>

        {/* Section 4: Pricing & Capacity */}
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
            <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              4. Oylik to‘lov va Talabalar sig‘imi
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
                placeholder="Masalan: 500000"
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

        {/* Section 5: Status and Dates */}
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
            <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              5. Guruh holati va Dars sanalari
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
              <DatePicker
                value={watch('startDate')}
                onChange={(val) => setValue('startDate', val)}
                placeholder="Sanani tanlang..."
                className="w-full"
              />
            </div>
          </div>
        </Card>

        {/* Section 6: Students Enrollment (2 Paths: Existing or Inline New Student) */}
        <Card className="p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  6. Guruh talabalari (O‘quvchilarni biriktirish — 2 ta yo‘l)
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Guruhga o‘quvchilarni mavjud bazadan tanlang yoki to‘g‘ridan-to‘g‘ri yangi o‘quvchi ro‘yxatdan o‘tkazing
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                selectedStudentIds.length > Number(watch('capacity') || 20)
                  ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-300'
                  : 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200'
              }`}>
                Tanlangan: {selectedStudentIds.length} / {watch('capacity') || 20} talaba
              </span>
            </div>
          </div>

          {/* Two Paths Switcher */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-1.5 rounded-2xl bg-gray-100 dark:bg-surface-dark-tertiary">
            <button
              type="button"
              onClick={() => setStudentMode('list')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                studentMode === 'list'
                  ? 'bg-white dark:bg-gray-800 text-purple-700 dark:text-purple-300 shadow-xs ring-1 ring-purple-200 dark:ring-purple-900'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 text-purple-600" />
              <span>1-yo‘l: Mavjud o‘quvchilardan tanlash ({allStudents.length} ta)</span>
            </button>
            <button
              type="button"
              onClick={() => setStudentMode('create')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                studentMode === 'create'
                  ? 'bg-emerald-600 text-white shadow-xs ring-1 ring-emerald-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>2-yo‘l: Yangi o‘quvchi yaratish va biriktirish</span>
            </button>
          </div>

          {studentMode === 'create' ? (
            /* Path 2: Inline Quick Student Creation Form */
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-blue-50/70 dark:from-emerald-950/30 dark:via-gray-900/40 dark:to-blue-950/30 border border-emerald-200 dark:border-emerald-800 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-emerald-200/60 dark:border-emerald-800/60 pb-3">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                      Yangi o‘quvchini ro‘yxatdan o‘tkazish va biriktirish
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Talaba ma‘lumotlarini kiriting. U avtomatik tarzda yaratiladi va ushbu guruhga darhol biriktiriladi.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStudentMode('list')}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer"
                >
                  Bekor qilish
                </button>
              </div>

              {/* Information Callout */}
              <div className="p-3 rounded-xl bg-white/80 dark:bg-gray-800/80 border border-emerald-100 dark:border-emerald-900 text-xs text-gray-600 dark:text-gray-300 space-y-1">
                <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Telefon raqamlari bo‘yicha tizim qoidalari:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div className="bg-emerald-50/60 dark:bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-200/60">
                    <span className="font-bold text-emerald-900 dark:text-emerald-200">1. Talabaning shaxsiy telefoni (Login):</span>
                    <p className="text-gray-600 dark:text-gray-400 mt-0.5">
                      Faqat 1 ta o‘quvchining o‘ziga tegishli unikal login raqami. Boshqa profil yoki rol uchun qayta ishlatilishi mumkin emas.
                    </p>
                  </div>
                  <div className="bg-blue-50/60 dark:bg-blue-950/40 p-2.5 rounded-lg border border-blue-200/60">
                    <span className="font-bold text-blue-900 dark:text-blue-200">2. Ota-onaning telefoni (SMS xabarlar):</span>
                    <p className="text-gray-600 dark:text-gray-400 mt-0.5">
                      Bir nechta farzand (2 yoki 3 ta aka-uka/opa-singil) uchun BIR XIL bo‘lishi mumkin! Xabarlar har bir farzand uchun alohida boradi.
                    </p>
                  </div>
                </div>
              </div>

              {/* Fields: First Name & Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Ism <span className="text-brand-red">*</span>
                  </label>
                  <Input
                    placeholder="Masalan: Sardor"
                    value={newStudentFirst}
                    onChange={(e) => setNewStudentFirst(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Familiya <span className="text-brand-red">*</span>
                  </label>
                  <Input
                    placeholder="Masalan: Alimov"
                    value={newStudentLast}
                    onChange={(e) => setNewStudentLast(e.target.value)}
                  />
                </div>
              </div>

              {/* Fields: Student Phone & Parent Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Student Personal Phone */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Talabaning shaxsiy telefoni (Login uchun) <span className="text-brand-red">*</span>
                  </label>
                  <Input
                    icon={Phone}
                    placeholder="+998 90 123 45 67"
                    value={newStudentPhone}
                    onChange={(e) => setNewStudentPhone(formatUzPhone(e.target.value))}
                    className={studentPhoneConflict ? 'border-red-500 ring-2 ring-red-500/20' : ''}
                  />
                  {studentPhoneConflict ? (
                    <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-[11px] text-red-700 dark:text-red-300 flex items-start gap-1.5 animate-fade-in">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Xatolik:</strong> Bu telefon raqam (+{cleanNewStudentPhone}) bilan tizimda allaqachon boshqa foydalanuvchi ({studentPhoneConflict.full_name || studentPhoneConflict.username}) ro‘yxatdan o‘tgan! Har bir talaba faqat o‘zining shaxsiy raqami orqali o‘z profiliga kirishi shart.
                      </span>
                    </div>
                  ) : cleanNewStudentPhone && cleanNewStudentPhone.length >= 9 ? (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                      <Check className="w-3.5 h-3.5" />
                      <span>Telefon raqam bo‘sh va biriktirish uchun tayyor</span>
                    </p>
                  ) : (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Talaba shaxsiy kabinetiga ushbu raqam orqali kiradi
                    </p>
                  )}
                </div>

                {/* Parent Phone */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Ota-onaning telefoni (Otasi yoki onasi - SMS uchun) <span className="text-brand-red">*</span>
                  </label>
                  <Input
                    icon={Phone}
                    placeholder="+998 90 987 65 43"
                    value={newStudentParentPhone}
                    onChange={(e) => setNewStudentParentPhone(formatUzPhone(e.target.value))}
                  />
                  {parentSiblings.length > 0 ? (
                    <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start gap-1.5 animate-fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Ko‘p farzandli oila:</strong> Ushbu ota-onaning boshqa farzandi ham mavjud: <strong>{parentSiblings.map((s) => `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.username).join(', ')}</strong>. SMS xabarlar har bir farzand uchun alohida boradi.
                      </span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Davomat, baholar va to‘lov xabarlari ushbu raqamga yuboriladi
                    </p>
                  )}
                </div>
              </div>

              {/* Optional Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Kabinet paroli (Ixtiyoriy)
                </label>
                <Input
                  placeholder="Bo‘sh qoldirilsa avtomatik: Talaba#2026!"
                  value={newStudentPassword}
                  onChange={(e) => setNewStudentPassword(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setStudentMode('list')}
                >
                  Bekor qilish
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  isLoading={isSavingStudent}
                  disabled={Boolean(studentPhoneConflict)}
                  onClick={handleCreateInlineStudent}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>O‘quvchini saqlash va guruhga qo‘shish</span>
                </Button>
              </div>
            </div>
          ) : (
            /* Path 1: Existing Students Checklist */
            <div className="space-y-3 animate-fade-in">
              {/* Search, Filter Chips, and Batch Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="O‘quvchini ismi yoki telefon raqami bo‘yicha qidirish..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-gray-50 dark:bg-surface-dark-tertiary border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {/* Filter chips */}
                  <div className="inline-flex items-center p-0.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setStudentFilter('all')}
                      className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                        studentFilter === 'all'
                          ? 'bg-white dark:bg-gray-700 text-purple-700 dark:text-purple-300 shadow-2xs'
                          : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      Barchasi ({allStudents.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudentFilter('selected')}
                      className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                        studentFilter === 'selected'
                          ? 'bg-white dark:bg-gray-700 text-purple-700 dark:text-purple-300 shadow-2xs'
                          : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      Tanlanganlar ({selectedStudentIds.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudentFilter('unassigned')}
                      className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                        studentFilter === 'unassigned'
                          ? 'bg-white dark:bg-gray-700 text-purple-700 dark:text-purple-300 shadow-2xs'
                          : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      Guruhsizlar
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleSelectAllStudents}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-purple-100 dark:bg-gray-800 dark:hover:bg-purple-950/40 text-gray-700 dark:text-gray-300 hover:text-purple-700 dark:hover:text-purple-300 transition-colors cursor-pointer"
                  >
                    ✓ Qidirilganlarni tanlash
                  </button>
                  {selectedStudentIds.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearStudents}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-50 hover:bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 transition-colors cursor-pointer"
                    >
                      Tozalash ({selectedStudentIds.length})
                    </button>
                  )}
                </div>
              </div>

              {/* Selected Student Pills (if any) */}
              {selectedStudentIds.length > 0 && (
                <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/50 space-y-1.5">
                  <div className="text-[11px] font-bold text-purple-900 dark:text-purple-300 flex items-center justify-between">
                    <span>Biriktirilgan o‘quvchilar ({selectedStudentIds.length} ta):</span>
                    <button
                      type="button"
                      onClick={handleClearStudents}
                      className="text-red-600 hover:underline cursor-pointer"
                    >
                      Barchasini bekor qilish
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                    {selectedStudentIds.map((sId) => {
                      const st = allStudents.find((s) => s.id === sId);
                      const name = st ? `${st.first_name || ''} ${st.last_name || ''}`.trim() || st.username : sId;
                      return (
                        <span
                          key={sId}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-200 border border-purple-200 dark:border-purple-800 shadow-2xs"
                        >
                          <UserCheck className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                          <span className="truncate max-w-[150px]">{name}</span>
                          <button
                            type="button"
                            onClick={() => handleToggleStudent(sId)}
                            className="hover:text-red-600 p-0.5 ml-0.5 cursor-pointer"
                            title="Guruhdan chiqarish"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Student Picker List */}
              <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-surface-dark-tertiary">
                {filteredStudents.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-500 dark:text-gray-400">
                    {studentSearch ? 'Qidiruv bo‘yicha o‘quvchilar topilmadi.' : 'Tizimda hali o‘quvchilar ro‘yxatga olinmagan.'}
                  </div>
                ) : (
                  filteredStudents.slice(0, 50).map((st) => {
                    const isSelected = selectedStudentIds.includes(st.id);
                    const fullName = `${st.first_name || ''} ${st.last_name || ''}`.trim() || st.username;
                    const parentContact = st.father_phone ? `Otasi: ${st.father_phone}` : st.mother_phone ? `Onasi: ${st.mother_phone}` : '';
                    return (
                      <div
                        key={st.id}
                        onClick={() => handleToggleStudent(st.id)}
                        className={`p-2.5 sm:px-4 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-purple-50/80 dark:bg-purple-950/40 hover:bg-purple-100/70'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // Controlled by container onClick
                            className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 shrink-0 pointer-events-none"
                          />
                          <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center shrink-0">
                            {st.first_name?.[0] || st.username?.[0] || 'U'}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-gray-900 dark:text-white truncate">
                              {fullName}
                            </div>
                            <div className="text-[11px] text-gray-500 dark:text-gray-400 font-mono flex items-center gap-2">
                              <span>{st.phone || '@' + st.username}</span>
                              {parentContact && (
                                <span className="text-[10px] bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-400">
                                  {parentContact}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          {isSelected ? (
                            <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/60 px-2 py-0.5 rounded-md">
                              ✓ Biriktirilgan
                            </span>
                          ) : (
                            <span className="text-[11px] text-gray-400 hover:text-purple-600 font-medium">
                              + Qo‘shish
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              {filteredStudents.length > 50 && (
                <p className="text-[11px] text-center text-gray-400">
                  Ko‘rsatilmoqda: 50 ta / jami {filteredStudents.length} ta o‘quvchi. Qidiruvdan foydalanib aniq talabani toping.
                </p>
              )}
            </div>
          )}
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

      {/* Group Split Modal (Split overflowing groups into 2nd group) */}
      <GroupSplitModal
        isOpen={Boolean(splitModalGroup)}
        group={splitModalGroup}
        onClose={() => setSplitModalGroup(null)}
        onSuccess={() => {
          setSplitModalGroup(null);
          loadData();
        }}
      />
    </div>
  );
}
