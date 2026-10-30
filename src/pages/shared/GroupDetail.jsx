import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Calendar,
  ClipboardCheck,
  Award,
  ArrowLeft,
  UserPlus,
  ArrowRightLeft,
  Trash2,
  Clock,
  Building2,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  User,
  Phone,
  ChevronDown,
  Camera,
  Tag,
  Percent,
  DollarSign,
  Edit3,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from '@/components/ui/Toast';
import {
  getGroupById,
  getGroups,
  enrollStudent,
  removeStudent,
  transferStudent,
  uploadGroupAvatar,
  updateStudentDiscount,
} from '@/services/groupService';
import { getStudents } from '@/services/userService';
import ImageCropperModal from '@/components/ui/ImageCropperModal';
import { getGradesByGroup } from '@/services/gradeService';
import { getAttendanceReport } from '@/services/attendanceService';
import { formatUzPhone } from '@/utils/phoneFormat';

export default function GroupDetail({ groupId: propGroupId }) {
  const { t } = useTranslation();
  const { id: paramGroupId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const currentUserRole = profile?.role || 'owner';
  const isTeacher = currentUserRole === 'teacher';
  const groupId = propGroupId || paramGroupId;

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('students');

  // Modals for student management
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [otherGroups, setOtherGroups] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [targetGroupId, setTargetGroupId] = useState('');
  const [studentToTransfer, setStudentToTransfer] = useState(null);

  // Student Discount Modal
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [discountStudent, setDiscountStudent] = useState(null);
  const [discountType, setDiscountType] = useState('none'); // 'none' | 'percent' | 'fixed' | 'custom'
  const [discountValue, setDiscountValue] = useState('');
  const [discountReason, setDiscountReason] = useState('');
  const [savingDiscount, setSavingDiscount] = useState(false);

  // Data for Attendance & Grades tabs
  const [grades, setGrades] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [cropModalFile, setCropModalFile] = useState(null);

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCropModalFile(file);
    }
    e.target.value = '';
  };

  const handleApplyCroppedAvatar = async (croppedDataUrl, croppedFile) => {
    setCropModalFile(null);
    const file = croppedFile || croppedDataUrl;

    if (!file || !groupId) return;
    try {
      setAvatarUploading(true);
      const uploadedUrl = await uploadGroupAvatar(groupId, file);
      setGroup((prev) => ({ ...prev, avatar_url: uploadedUrl, image_url: uploadedUrl }));
      toast.success(t('groups.avatarUpdated', "Guruh profil rasmi muvaffaqiyatli saqlandi!"));
    } catch (err) {
      console.error('Failed to upload group avatar:', err);
      toast.error("Rasmni yuklab bo'lmadi");
    } finally {
      setAvatarUploading(false);

    }
  };

  const handleRemoveAvatar = async () => {
    if (!groupId) return;
    if (!window.confirm("Guruh profil rasmini olib tashlashni tasdiqlaysizmi?")) return;
    try {
      setAvatarUploading(true);
      await uploadGroupAvatar(groupId, null);
      setGroup((prev) => ({ ...prev, avatar_url: '', image_url: '' }));
      toast.success(t('groups.avatarRemoved', "Guruh profil rasmi olib tashlandi."));
    } catch (err) {
      console.error('Failed to remove group avatar:', err);
    } finally {
      setAvatarUploading(false);
    }
  };

  const fetchGroup = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    try {
      const data = await getGroupById(groupId);

      if (isTeacher && data) {
        const teacherFullName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || profile?.name || profile?.full_name || '';
        const myName = teacherFullName.trim().toLowerCase();
        const myId = profile?.id;

        const matchId = (myId && (data.teacher_id === myId || data.teacherId === myId || data.teachers?.some((t) => t.id === myId)));
        const gName = (data.teacher_name || data.teacherName || data.teachers?.[0]?.fullName || '').trim().toLowerCase();
        const matchName = myName && gName && (gName.includes(myName) || myName.includes(gName));

        if (!matchId && !matchName) {
          toast.error("Siz faqat o‘zingizga biriktirilgan guruhlarni ko‘rishingiz mumkin!");
          navigate('/teacher/groups', { replace: true });
          return;
        }
      }

      setGroup(data);

      // Also fetch grades and attendance summary for tabs
      try {
        const gradesData = await getGradesByGroup(groupId);
        setGrades(gradesData || []);

        const attReport = await getAttendanceReport({ groupId });
        setAttendanceStats(attReport.stats);
      } catch (e) {
        console.warn('Supplementary tab data load note:', e);
      }
    } catch (err) {
      console.error(err);
      toast.error(t('groups.fetchError', 'Failed to load group details'));
    } finally {
      setLoading(false);
    }
  }, [groupId, isTeacher, profile, navigate, t]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  // Open Add Student Modal (Existing students)
  const handleOpenAddStudent = async () => {
    try {
      const allStudents = await getStudents();
      const enrolledIds = new Set((group?.students || []).map((s) => s.id));
      const notEnrolled = allStudents.filter((s) => !enrolledIds.has(s.id));
      setAvailableStudents(notEnrolled);
      setSelectedStudentId(notEnrolled[0]?.id || '');
      setIsAddStudentOpen(true);
    } catch (err) {
      toast.error('Could not load students');
    }
  };

  const handleEnrollStudent = async () => {
    if (!selectedStudentId) return;
    try {
      await enrollStudent(groupId, selectedStudentId);
      toast.success(t('groups.studentEnrolled', 'Student enrolled successfully!'));
      setIsAddStudentOpen(false);
      fetchGroup();
    } catch (err) {
      toast.error(err.message || 'Enrollment failed');
    }
  };

  const handleRemoveStudent = async (student) => {
    if (!window.confirm(t('groups.confirmRemoveStudent', `Remove ${student.fullName} from group?`))) {
      return;
    }
    try {
      await removeStudent(groupId, student.id);
      toast.success(t('groups.studentRemoved', 'Student removed from group.'));
      fetchGroup();
    } catch (err) {
      toast.error(err.message || 'Failed to remove student');
    }
  };

  const handleOpenTransfer = async (student) => {
    setStudentToTransfer(student);
    try {
      const allGroups = await getGroups({ status: 'active', limit: 100 });
      const candidates = (allGroups.groups || []).filter((g) => g.id !== groupId);
      setOtherGroups(candidates);
      setTargetGroupId(candidates[0]?.id || '');
      setIsTransferOpen(true);
    } catch (err) {
      toast.error('Could not load other groups');
    }
  };

  const handleExecuteTransfer = async () => {
    if (!targetGroupId || !studentToTransfer) return;
    try {
      await transferStudent(groupId, targetGroupId, studentToTransfer.id);
      toast.success(t('groups.transferSuccess', 'Student transferred successfully!'));
      setIsTransferOpen(false);
      setStudentToTransfer(null);
      fetchGroup();
    } catch (err) {
      toast.error(err.message || 'Transfer failed');
    }
  };

  const handleOpenDiscountModal = (student) => {
    setDiscountStudent(student);
    if (student.custom_price != null && student.custom_price !== '') {
      setDiscountType('custom');
      setDiscountValue(String(student.custom_price));
    } else if (Number(student.discount_percent) > 0) {
      setDiscountType('percent');
      setDiscountValue(String(student.discount_percent));
    } else if (Number(student.discount_amount) > 0) {
      setDiscountType('fixed');
      setDiscountValue(String(student.discount_amount));
    } else {
      setDiscountType('none');
      setDiscountValue('');
    }
    setDiscountReason(student.discount_reason || '');
    setIsDiscountModalOpen(true);
  };

  const handleSaveDiscount = async () => {
    if (!discountStudent) return;
    try {
      setSavingDiscount(true);
      const baseFee = Number(group.monthly_price || 0);
      let payload = {
        discount_type: discountType === 'none' ? null : discountType,
        discount_reason: discountReason.trim(),
        custom_price: null,
        discount_percent: 0,
        discount_amount: 0,
      };

      if (discountType === 'percent') {
        const pct = Math.min(100, Math.max(0, Number(discountValue) || 0));
        payload.discount_percent = pct;
        payload.discount_amount = Math.round(baseFee * (pct / 100));
      } else if (discountType === 'fixed') {
        const amt = Math.max(0, Number(discountValue) || 0);
        payload.discount_amount = amt;
      } else if (discountType === 'custom') {
        const customPrice = Math.max(0, Number(discountValue) || 0);
        payload.custom_price = customPrice;
        payload.discount_amount = Math.max(0, baseFee - customPrice);
      }

      await updateStudentDiscount(groupId, discountStudent.id, payload);
      toast.success("Talaba to‘lovi va chegirmasi muvaffaqiyatli saqlandi!");
      setIsDiscountModalOpen(false);
      setDiscountStudent(null);
      fetchGroup();
    } catch (err) {
      console.error(err);
      toast.error("Chegirmani saqlashda xatolik yuz berdi");
    } finally {
      setSavingDiscount(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[300px]">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-gray-500 mt-3">{t('common.loading', 'Loading group details...')}</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-brand-red mx-auto mb-3" />
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
          {t('groups.notFound', 'Group Not Found')}
        </h3>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
          {t('common.back', 'Go Back')}
        </Button>
      </div>
    );
  }

  const capacity = group.capacity || 20;
  const enrolledCount = group.students?.length || 0;
  const fillPercent = Math.min(Math.round((enrolledCount / capacity) * 100), 100);

  const daysOfWeek = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Back Button */}
      {/* Group Profile Header Card */}
      <Card className="p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <Button
            variant="outline"
            size="sm"
            icon={ArrowLeft}
            onClick={() => navigate(-1)}
            className="!p-2 h-9 w-9 shrink-0 self-start"
            title="Orqaga"
          />

          {/* Group Avatar with Camera Upload */}
          <div className="relative group shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-600 dark:border-emerald-500 flex items-center justify-center text-3xl font-extrabold text-emerald-800 dark:text-emerald-300 shadow-md">
              {group.avatar_url || group.image_url ? (
                <img
                  src={group.avatar_url || group.image_url}
                  alt={group.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                group.name?.charAt(0) || 'G'
              )}
            </div>

            <label
              title="Guruhga profil rasmi qo‘yish"
              className="absolute -bottom-1 -right-1 p-2 bg-blue-600 hover:bg-blue-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-full cursor-pointer shadow-lg transition-transform hover:scale-105"
            >
              <Camera className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarSelect}
                disabled={avatarUploading}
              />
            </label>
          </div>

          {/* Group Info & Actions */}
          <div className="flex-1 text-center sm:text-left rtl:sm:text-right space-y-2 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-wrap justify-center sm:justify-start">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{group.name}</h1>
              <Badge variant="primary" size="md">
                {group.courses?.name || group.courseName || 'General Course'}
              </Badge>
              <Badge
                variant={group.status === 'active' ? 'success' : 'secondary'}
                size="sm"
              >
                <span className="capitalize">{group.status}</span>
              </Badge>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-4 flex-wrap justify-center sm:justify-start">
              <span className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                Ustoz: {group.teachers?.[0]?.fullName || group.teacher_name || t('groups.unassigned', 'Not Assigned')}
              </span>
              <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                <DollarSign className="w-3.5 h-3.5" />
                Oylik to‘lov: {Number(group.monthly_price || 0).toLocaleString()} so‘m / oy
              </span>
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-gray-400" />
                Xona: {group.room || 'TBD'}
              </span>
              {group.schedule && (
                <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400 font-mono">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  {group.schedule}
                </span>
              )}
            </p>

            {/* Avatar action buttons */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors">
                <Camera className="w-3.5 h-3.5" />
                <span>
                  {group.avatar_url || group.image_url
                    ? "Rasmni almashtirish"
                    : "Guruh profiliga rasm qo‘yish"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarSelect}
                  disabled={avatarUploading}
                />
              </label>

              {(group.avatar_url || group.image_url) && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={avatarUploading}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 text-xs font-semibold transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Rasmni o‘chirish</span>
                </button>
              )}

              {avatarUploading && (
                <span className="text-xs text-emerald-600 animate-pulse font-medium">Yuklanmoqda...</span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Capacity Indicator Card */}
        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase">
              {t('groups.capacity', 'Cohort Capacity')}
            </span>
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
              {enrolledCount} / {capacity}
            </span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-surface-dark-tertiary h-2.5 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full transition-all duration-300 ${
                fillPercent >= 100
                  ? 'bg-brand-red'
                  : fillPercent > 80
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${fillPercent}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {capacity - enrolledCount > 0
              ? `${capacity - enrolledCount} seats remaining available`
              : 'Cohort is at maximum capacity'}
          </p>
        </Card>

        {/* Schedule Summary Card */}
        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase">
              {t('nav.schedule', 'Weekly Sessions')}
            </span>
            <Clock className="w-4 h-4 text-brand-navy dark:text-blue-400" />
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {group.schedules?.length || 0} {t('groups.lessonsPerWeek', 'lessons / week')}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {group.room ? `Held in ${group.room}` : 'Classroom to be announced'}
          </p>
        </Card>

        {/* Attendance Summary Card */}
        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase">
              {t('attendance.rate', 'Attendance Rate')}
            </span>
            <ClipboardCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {attendanceStats ? `${attendanceStats.rate}%` : '—'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {attendanceStats
              ? `${attendanceStats.present} present out of ${attendanceStats.total} checks`
              : 'No recorded attendance yet'}
          </p>
        </Card>
      </div>

      {/* Tabs Header */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <nav className="flex items-center gap-6 overflow-x-auto no-scrollbar py-1 rtl:space-x-reverse">
          {[
            { id: 'students', label: t('groups.students', 'Enrolled Students'), icon: Users, count: enrolledCount },
            { id: 'schedule', label: t('nav.schedule', 'Weekly Timetable'), icon: Calendar, count: group.schedules?.length },
            { id: 'attendance', label: t('nav.attendance', 'Attendance Log'), icon: ClipboardCheck },
            { id: 'grades', label: t('nav.grades', 'Grades & Feedback'), icon: Award, count: grades?.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  shrink-0 flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap cursor-pointer
                  ${
                    isSelected
                      ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400 font-semibold'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`ml-1.5 px-2 py-0.5 rounded-full text-xs ${
                      isSelected
                        ? 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 font-bold'
                        : 'bg-gray-100 dark:bg-surface-dark-tertiary text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab 1: Students */}
      {activeTab === 'students' && (
        <Card noPadding>
          <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 flex-wrap gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {t('groups.enrolledList', 'Cohort Student Roster')}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                icon={Users}
                onClick={handleOpenAddStudent}
                disabled={enrolledCount >= capacity}
              >
                {t('groups.enrollExisting', 'Mavjud talabani biriktirish')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={UserPlus}
                onClick={() => {
                  if (isTeacher) {
                    navigate(`/teacher/students/create?groupId=${groupId}`);
                  } else {
                    navigate(`/${currentUserRole}/users/create?role=student&groupId=${groupId}`);
                  }
                }}
                disabled={enrolledCount >= capacity}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
                {t('groups.addNewStudent', "+ Yangi talaba yaratish")}
              </Button>
            </div>
          </div>

          <Table
            columns={[
              {
                header: t('common.name', 'Student Name'),
                key: 'name',
                render: (row) => (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-brand-navy dark:text-blue-300 flex items-center justify-center font-bold text-xs uppercase">
                      {row.first_name?.[0] || row.username?.[0] || 'S'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{row.fullName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">@{row.username}</p>
                    </div>
                  </div>
                ),
              },
              {
                header: t('common.phone', 'Telefon va Ota-onasi'),
                key: 'phone',
                className: 'whitespace-nowrap',
                cellClassName: 'whitespace-nowrap',
                render: (row) => {
                  const primaryPhone = row.phone || row.father_phone || row.mother_phone || '';
                  const hasParentPhone = row.father_phone || row.mother_phone;

                  return (
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100/90 dark:bg-gray-800/90 px-2.5 py-1 rounded-xl border border-gray-200 dark:border-gray-700/80 shadow-xs">
                        <Phone className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        {primaryPhone ? formatUzPhone(primaryPhone) : '—'}
                      </span>

                      {hasParentPhone && (
                        <div className="relative group/parent inline-block">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-all cursor-pointer shadow-xs"
                            title={t('groups.parentContacts', 'Ota-onasi raqamlari')}
                          >
                            <Users className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span>{t('groups.parents', 'Ota-onasi')}</span>
                            <ChevronDown className="w-2.5 h-2.5 opacity-70 group-hover/parent:rotate-180 transition-transform" />
                          </button>

                          {/* Floating Popover on Hover */}
                          <div className="invisible group-hover/parent:visible opacity-0 group-hover/parent:opacity-100 transition-all duration-200 pointer-events-none group-hover/parent:pointer-events-auto absolute left-0 top-full mt-1.5 w-60 p-2.5 rounded-xl bg-white dark:bg-[#1a2332] shadow-2xl border border-gray-200 dark:border-gray-700 z-50 text-left">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 pb-1 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
                              <span>{t('groups.parentContacts', 'Ota-onasi raqamlari')}</span>
                              <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">Aloqa</span>
                            </div>
                            <div className="space-y-1.5">
                              {row.father_phone && (
                                <a
                                  href={`tel:${row.father_phone}`}
                                  className="flex items-center justify-between p-1.5 rounded-lg bg-indigo-50/70 hover:bg-indigo-100/70 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 border border-indigo-200/50 dark:border-indigo-800/50 transition-colors"
                                >
                                  <div>
                                    <span className="text-[9px] font-bold uppercase text-indigo-600 dark:text-indigo-400 block">
                                      {t('groups.father', 'Otasi')}
                                    </span>
                                    <span className="font-mono text-xs font-bold text-gray-800 dark:text-gray-200">
                                      {formatUzPhone(row.father_phone)}
                                    </span>
                                  </div>
                                  <Phone className="w-3 h-3 text-indigo-500" />
                                </a>
                              )}
                              {row.mother_phone && (
                                <a
                                  href={`tel:${row.mother_phone}`}
                                  className="flex items-center justify-between p-1.5 rounded-lg bg-rose-50/70 hover:bg-rose-100/70 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 border border-rose-200/50 dark:border-rose-800/50 transition-colors"
                                >
                                  <div>
                                    <span className="text-[9px] font-bold uppercase text-rose-600 dark:text-rose-400 block">
                                      {t('groups.mother', 'Onasi')}
                                    </span>
                                    <span className="font-mono text-xs font-bold text-gray-800 dark:text-gray-200">
                                      {formatUzPhone(row.mother_phone)}
                                    </span>
                                  </div>
                                  <Phone className="w-3 h-3 text-rose-500" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                },
              },
              {
                header: "Oylik to‘lov va Chegirma",
                key: 'pricing',
                render: (row) => {
                  const baseFee = Number(group.monthly_price || 0);
                  const effective = row.effective_price !== undefined ? row.effective_price : baseFee;
                  const hasDiscount = Boolean(row.discount_label);

                  return (
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-gray-100 text-xs">
                          <span>{effective.toLocaleString()} so‘m / oy</span>
                          {hasDiscount && (
                            <span className="text-[10px] line-through text-gray-400 font-normal">
                              {baseFee.toLocaleString()}
                            </span>
                          )}
                        </div>
                        {hasDiscount ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-500/20">
                            <Tag className="w-2.5 h-2.5 text-amber-600" />
                            {row.discount_label}
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400 dark:text-gray-500">
                            Standart to‘lov
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenDiscountModal(row)}
                        className="p-1 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors cursor-pointer"
                        title="Chegirma yoki individual narx belgilash"
                      >
                        <Percent className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                },
              },
              {
                header: t('groups.enrolledDate', 'Enrolled Date'),
                key: 'enrolledAt',
                render: (row) => (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {row.enrolledAt ? new Date(row.enrolledAt).toLocaleDateString() : 'Active'}
                  </span>
                ),
              },
              {
                header: t('common.actions', 'Actions'),
                key: 'actions',
                className: 'text-right rtl:text-left',
                cellClassName: 'text-right rtl:text-left',
                render: (row) => (
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="!p-1.5 h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                      title="Chegirma va to‘lovni sozlash"
                      onClick={() => handleOpenDiscountModal(row)}
                    >
                      <Percent className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="!p-1.5 h-8 w-8 text-gray-600 hover:text-brand-navy"
                      title={t('groups.transfer', 'Transfer to another group')}
                      onClick={() => handleOpenTransfer(row)}
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="!p-1.5 h-8 w-8 text-gray-600 hover:text-brand-red"
                      title={t('groups.remove', 'Remove from group')}
                      onClick={() => handleRemoveStudent(row)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ),
              },
            ]}
            data={group.students || []}
            emptyMessage={t('groups.noStudents', 'No students enrolled in this group yet.')}
          />
        </Card>
      )}

      {/* Tab 2: Weekly Schedule */}
      {activeTab === 'schedule' && (
        <Card>
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {t('groups.weeklySchedule', 'Regular Weekly Timetable')}
            </h3>
            {!group.schedules || group.schedules.length === 0 ? (
              <p className="text-xs text-gray-500 py-4">
                {t('groups.noSchedule', 'No recurring weekly schedule configured for this group.')}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                {group.schedules.map((sch) => (
                  <div
                    key={sch.id}
                    className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-surface-dark-tertiary flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                        {daysOfWeek[sch.day_of_week] || `Day ${sch.day_of_week}`}
                      </p>
                      <p className="text-xs text-brand-navy dark:text-blue-300 mt-0.5 font-medium">
                        {sch.start_time?.slice(0, 5)} - {sch.end_time?.slice(0, 5)}
                      </p>
                      {sch.room && (
                        <p className="text-[11px] text-gray-400 mt-0.5">Room: {sch.room}</p>
                      )}
                    </div>
                    <Badge variant="primary" size="sm">
                      Weekly
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Tab 3: Attendance Summary */}
      {activeTab === 'attendance' && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {t('nav.attendance', 'Group Attendance Records')}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/owner/attendance')}
              >
                {t('attendance.takeAttendance', 'Take Attendance')}
              </Button>
            </div>
            {attendanceStats ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200">
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">Present</p>
                  <p className="text-xl font-bold text-emerald-800 dark:text-emerald-200">{attendanceStats.present}</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200">
                  <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">Late</p>
                  <p className="text-xl font-bold text-amber-800 dark:text-amber-200">{attendanceStats.late}</p>
                </div>
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200">
                  <p className="text-xs text-brand-red dark:text-red-300 font-medium">Absent</p>
                  <p className="text-xl font-bold text-brand-red dark:text-red-200">{attendanceStats.absent}</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200">
                  <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">Excused</p>
                  <p className="text-xl font-bold text-blue-800 dark:text-blue-200">{attendanceStats.excused}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500 py-3">No attendance recorded yet for this group.</p>
            )}
          </div>
        </Card>
      )}

      {/* Tab 4: Grades */}
      {activeTab === 'grades' && (
        <Card noPadding>
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {t('grades.groupGrades', 'Grades & Academic Feedback')}
            </h3>
          </div>
          <Table
            columns={[
              {
                header: t('common.name', 'Student'),
                key: 'student',
                render: (row) => (
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {row.profiles?.first_name} {row.profiles?.last_name}
                  </span>
                ),
              },
              {
                header: t('grades.grade', 'Score (1-5)'),
                key: 'grade_value',
                render: (row) => (
                  <span className="font-bold text-sm px-2.5 py-1 rounded-md bg-blue-100 text-brand-navy">
                    {row.grade_value} / 5
                  </span>
                ),
              },
              {
                header: t('grades.feedback', 'Feedback'),
                key: 'feedback',
                render: (row) => (
                  <span className="text-xs text-gray-600 dark:text-gray-300 line-clamp-1">
                    {row.feedback || '—'}
                  </span>
                ),
              },
              {
                header: t('common.date', 'Date'),
                key: 'created_at',
                render: (row) => (
                  <span className="text-xs text-gray-500">
                    {new Date(row.created_at).toLocaleDateString()}
                  </span>
                ),
              },
            ]}
            data={grades}
            emptyMessage={t('grades.noGrades', 'No grades recorded yet.')}
          />
        </Card>
      )}

      {/* Modal: Enroll Existing Student */}
      <Modal
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
        title={t('groups.enrollStudent', 'Guruhga mavjud talabani biriktirish')}
        subtitle={`${group.name} — ${t('groups.enrollExistingSubtitle', 'ro‘yxatdan o‘tgan talabani ushbu guruhga qabul qilish')}`}
        size="md"
      >
        <div className="space-y-4">
          {availableStudents.length === 0 ? (
            <div className="text-center py-6 space-y-3">
              <p className="text-sm text-gray-500">
                {t('groups.allStudentsEnrolled', 'Barcha talabalar guruhlarga biriktirilgan yoki tizimda bo‘sh talabalar yo‘q.')}
              </p>
              <Button
                variant="primary"
                size="sm"
                icon={UserPlus}
                onClick={() => {
                  setIsAddStudentOpen(false);
                  if (isTeacher) {
                    navigate(`/teacher/students/create?groupId=${groupId}`);
                  } else {
                    navigate(`/${currentUserRole}/users/create?role=student&groupId=${groupId}`);
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {t('groups.addNewStudent', "+ Yangi talaba yaratish (Katta oyna)")}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Select
                label={t('users.student', 'Talabani tanlang')}
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                placeholder={t('tuition.selectStudent', 'Talabani tanlang')}
                headerTitle={t('users.students', 'Mavjud talabalar')}
                icon={GraduationCap}
                size="sm"
                options={availableStudents.map((st) => ({
                  value: st.id,
                  label: st.fullName,
                  subtitle: `@${st.username} • ${st.phone || 'Talaba'}`,
                  color: '#10b981',
                }))}
              />

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <Button variant="ghost" onClick={() => setIsAddStudentOpen(false)}>
                  {t('common.cancel', 'Bekor qilish')}
                </Button>
                <Button
                  variant="primary"
                  disabled={availableStudents.length === 0 || !selectedStudentId}
                  onClick={handleEnrollStudent}
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white"
                >
                  {t('groups.confirmEnroll', 'Guruhga biriktirish')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal: Transfer Student */}
      <Modal
        isOpen={isTransferOpen}
        onClose={() => {
          setIsTransferOpen(false);
          setStudentToTransfer(null);
        }}
        title={t('groups.transferStudent', 'Transfer Student to Another Cohort')}
        subtitle={`Move ${studentToTransfer?.fullName || ''} from ${group.name}`}
      >
        <div className="space-y-4">
          {otherGroups.length === 0 ? (
            <p className="text-sm text-gray-500 py-3">
              {t('groups.noOtherGroups', 'No other active cohorts available for transfer.')}
            </p>
          ) : (
            <Select
              label={t('groups.targetGroup', 'Ko‘chiriladigan guruh')}
              value={targetGroupId}
              onChange={(e) => setTargetGroupId(e.target.value)}
              placeholder={t('groups.selectGroup', 'Guruhni tanlang')}
              headerTitle={t('groups.title', 'O‘quv guruhlari')}
              icon={Users}
              size="sm"
              options={otherGroups.map((g) => ({
                value: g.id,
                label: g.name,
                subtitle: g.courseName || 'Kurs fani',
                badge: `${g.studentCount}/${g.capacity}`,
                color: g.courseColor || '#123D78',
              }))}
            />
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <Button
              variant="ghost"
              onClick={() => {
                setIsTransferOpen(false);
                setStudentToTransfer(null);
              }}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              variant="primary"
              disabled={otherGroups.length === 0}
              onClick={handleExecuteTransfer}
            >
              {t('groups.confirmTransfer', 'Execute Transfer')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Student Tuition & Discount Management */}
      <Modal
        isOpen={isDiscountModalOpen}
        onClose={() => {
          if (!savingDiscount) {
            setIsDiscountModalOpen(false);
            setDiscountStudent(null);
          }
        }}
        title="Talaba oylik to‘lovi va chegirmasini sozlash"
        size="md"
      >
        {discountStudent && (
          <div className="space-y-4">
            {/* Student info banner */}
            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-surface-dark-secondary border border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {discountStudent.fullName}
                </p>
                <p className="text-xs text-gray-500">@{discountStudent.username}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-400 block uppercase font-bold">Guruh narxi</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {Number(group.monthly_price || 0).toLocaleString()} so‘m / oy
                </span>
              </div>
            </div>

            {/* Discount Type Selection */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 block mb-2">
                Chegirma turi yoki individual narx
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'none', label: "Chegirmasiz (Standart)", desc: "Guruh narxi bo'yicha" },
                  { id: 'percent', label: "Foizli chegirma (%)", desc: "Masalan: 10%, 20%, 50%" },
                  { id: 'fixed', label: "Qat'iy chegirma (so'm)", desc: "Masalan: 100 000 so'm ayirish" },
                  { id: 'custom', label: "Maxsus to'lov (so'm)", desc: "Masalan: 450 000 so'm belgilash" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setDiscountType(item.id);
                      if (item.id === 'none') setDiscountValue('');
                    }}
                    className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                      discountType === item.id
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-bold ring-1 ring-emerald-500'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark-secondary text-gray-700 dark:text-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-xs font-semibold">{item.label}</div>
                    <div className="text-[10px] opacity-70 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Value Input */}
            {discountType !== 'none' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  {discountType === 'percent'
                    ? "Chegirma foizi (%)"
                    : discountType === 'fixed'
                    ? "Chegirma summasi (so'm)"
                    : "Belgilangan yakuniy oylik to'lov summasi (so'm)"}
                </label>
                <Input
                  type="number"
                  placeholder={
                    discountType === 'percent'
                      ? "Masalan: 20"
                      : discountType === 'fixed'
                      ? "Masalan: 100000"
                      : "Masalan: 450000"
                  }
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                />
              </div>
            )}

            {/* Real-time Calculation Breakdown Box */}
            {(() => {
              const base = Number(group.monthly_price || 0);
              let val = Number(discountValue) || 0;
              let finalDue = base;
              let discountSub = 0;

              if (discountType === 'percent') {
                val = Math.min(100, Math.max(0, val));
                discountSub = Math.round(base * (val / 100));
                finalDue = Math.max(0, base - discountSub);
              } else if (discountType === 'fixed') {
                discountSub = Math.min(base, Math.max(0, val));
                finalDue = Math.max(0, base - discountSub);
              } else if (discountType === 'custom') {
                finalDue = Math.max(0, val);
                discountSub = Math.max(0, base - finalDue);
              }

              return (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                    <span>Standart kurs narxi:</span>
                    <span>{base.toLocaleString()} so‘m</span>
                  </div>
                  {discountType !== 'none' && (
                    <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 font-medium">
                      <span>Chegirma:</span>
                      <span>-{discountSub.toLocaleString()} so‘m</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between font-bold text-gray-900 dark:text-white pt-1.5 border-t border-emerald-500/20 text-sm">
                    <span>Talaba to‘lashi kerak:</span>
                    <span className="text-emerald-700 dark:text-emerald-400">{finalDue.toLocaleString()} so‘m / oy</span>
                  </div>
                </div>
              );
            })()}

            {/* Reason */}
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Chegirma sababi / Izoh
              </label>
              <Input
                placeholder="Masalan: Olimpiada g‘olibi, Oila a‘zolari birga o‘qiydi, Grant..."
                value={discountReason}
                onChange={(e) => setDiscountReason(e.target.value)}
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsDiscountModalOpen(false);
                  setDiscountStudent(null);
                }}
                disabled={savingDiscount}
              >
                Bekor qilish
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveDiscount}
                disabled={savingDiscount}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {savingDiscount ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

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
