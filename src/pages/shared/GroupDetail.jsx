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
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import PasswordStrengthInput, { evaluatePasswordStrength } from '@/components/ui/PasswordStrengthInput';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from '@/components/ui/Toast';
import {
  getGroupById,
  getGroups,
  enrollStudent,
  removeStudent,
  transferStudent,
} from '@/services/groupService';
import { getStudents, createStudent } from '@/services/userService';
import { getGradesByGroup } from '@/services/gradeService';
import { getAttendanceReport } from '@/services/attendanceService';
import { cleanUzPhone } from '@/utils/phoneFormat';

export default function GroupDetail({ groupId: propGroupId }) {
  const { t } = useTranslation();
  const { id: paramGroupId } = useParams();
  const navigate = useNavigate();
  const groupId = propGroupId || paramGroupId;

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('students');

  // Modals for student management
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [addStudentMode, setAddStudentMode] = useState('existing'); // 'existing' | 'new'
  const [newStudentData, setNewStudentData] = useState({
    firstName: '',
    lastName: '',
    fatherPhone: '',
    motherPhone: '',
    phone: '',
    password: '',
  });
  const [isSubmittingNewStudent, setIsSubmittingNewStudent] = useState(false);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [otherGroups, setOtherGroups] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [targetGroupId, setTargetGroupId] = useState('');
  const [studentToTransfer, setStudentToTransfer] = useState(null);

  // Data for Attendance & Grades tabs
  const [grades, setGrades] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState(null);

  const fetchGroup = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    try {
      const data = await getGroupById(groupId);
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
  }, [groupId, t]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  // Open Add Student Modal
  const handleOpenAddStudent = async () => {
    try {
      const allStudents = await getStudents();
      const enrolledIds = new Set((group?.students || []).map((s) => s.id));
      const notEnrolled = allStudents.filter((s) => !enrolledIds.has(s.id));
      setAvailableStudents(notEnrolled);
      setSelectedStudentId(notEnrolled[0]?.id || '');
      setAddStudentMode(notEnrolled.length > 0 ? 'existing' : 'new');
      setNewStudentData({
        firstName: '',
        lastName: '',
        fatherPhone: '',
        motherPhone: '',
        phone: '',
        password: '',
      });
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

  const handleCreateAndEnrollStudent = async (e) => {
    e?.preventDefault?.();
    if (!newStudentData.firstName.trim() || !newStudentData.lastName.trim()) {
      toast.error(t('errors.required', 'Ism va familiya kiritilishi shart'));
      return;
    }
    const cleanFather = cleanUzPhone(newStudentData.fatherPhone);
    const cleanMother = cleanUzPhone(newStudentData.motherPhone);
    const cleanPhone = cleanUzPhone(newStudentData.phone);
    if (!cleanFather && !cleanMother && !cleanPhone) {
      toast.error(t('users.atLeastOneParentPhone', 'Otasining yoki onasining telefon raqamini kiritish shart'));
      return;
    }

    const trimmedPwd = (newStudentData.password || '').trim();
    if (!trimmedPwd) {
      toast.error(t('users.passwordRequired', 'Kabinetga kirish uchun parol kiritish shart!'));
      return;
    }
    if (!evaluatePasswordStrength(trimmedPwd).allMet) {
      toast.error(
        t(
          'users.passwordMustBeStrong',
          'Parol xavfsiz (yashil) bo‘lishi uchun katta-kichik harf, raqam va maxsus belgi (!@#$) ishtirok etishi shart!'
        )
      );
      return;
    }

    setIsSubmittingNewStudent(true);
    try {
      await createStudent({
        firstName: newStudentData.firstName,
        lastName: newStudentData.lastName,
        fatherPhone: cleanFather,
        motherPhone: cleanMother,
        phone: cleanPhone,
        password: trimmedPwd,
        groupId,
      });
      toast.success(t('groups.studentEnrolled', 'Talaba muvaffaqiyatli qabul qilindi!'));
      setNewStudentData({ firstName: '', lastName: '', fatherPhone: '', motherPhone: '', phone: '', password: '' });
      setIsAddStudentOpen(false);
      fetchGroup();
    } catch (err) {
      toast.error(err.message || 'Xatolik yuz berdi');
    } finally {
      setIsSubmittingNewStudent(false);
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
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Back Button */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          icon={ArrowLeft}
          onClick={() => navigate(-1)}
          className="!p-2 h-9 w-9"
        />
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{group.name}</h1>
            <Badge variant="primary" size="md">
              {group.courses?.name || 'General Course'}
            </Badge>
            <Badge
              variant={group.status === 'active' ? 'success' : 'secondary'}
              size="sm"
            >
              <span className="capitalize">{group.status}</span>
            </Badge>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-brand-navy" />
              Teacher: {group.teachers?.[0]?.fullName || t('groups.unassigned', 'Not Assigned')}
            </span>
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-gray-400" />
              Room: {group.room || 'TBD'}
            </span>
          </p>
        </div>
      </div>

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
                  : 'bg-brand-navy'
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
        <nav className="flex space-x-6 rtl:space-x-reverse">
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
                  flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap
                  ${
                    isSelected
                      ? 'border-brand-navy text-brand-navy dark:border-blue-400 dark:text-blue-400 font-semibold'
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
                        ? 'bg-brand-navy/10 text-brand-navy dark:bg-blue-900/40 dark:text-blue-300 font-bold'
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
          <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {t('groups.enrolledList', 'Cohort Student Roster')}
            </h3>
            <Button
              variant="primary"
              size="sm"
              icon={UserPlus}
              onClick={handleOpenAddStudent}
              disabled={enrolledCount >= capacity}
            >
              {t('groups.enrollStudent', 'Enroll Student')}
            </Button>
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
                header: t('common.phone', 'Phone Number'),
                key: 'phone',
                render: (row) => (
                  <span className="text-xs text-gray-600 dark:text-gray-300">
                    {row.phone || '—'}
                  </span>
                ),
              },
              {
                header: t('groups.parentsPhone', "Ota-onasi telefoni"),
                key: 'parentsPhone',
                render: (row) => (
                  <div className="flex flex-col gap-0.5 text-xs text-gray-600 dark:text-gray-300">
                    {row.father_phone && (
                      <span className="flex items-center gap-1">
                        <span className="font-semibold text-gray-500 dark:text-gray-400">{t('groups.father', 'Otasi')}:</span>
                        {row.father_phone}
                      </span>
                    )}
                    {row.mother_phone && (
                      <span className="flex items-center gap-1">
                        <span className="font-semibold text-gray-500 dark:text-gray-400">{t('groups.mother', 'Onasi')}:</span>
                        {row.mother_phone}
                      </span>
                    )}
                    {!row.father_phone && !row.mother_phone && <span>—</span>}
                  </div>
                ),
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

      {/* Modal: Enroll Student */}
      <Modal
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
        title={t('groups.enrollStudent', 'Guruhga talaba qabul qilish')}
        subtitle={`${group.name} — ${t('groups.enrollSubtitle', 'yangi talaba qo‘shish yoki mavjud talabani biriktirish')}`}
        size="lg"
      >
        <div className="space-y-4">
          {/* Mode Switcher */}
          <div className="flex p-1 rounded-xl bg-gray-100 dark:bg-surface-dark-tertiary">
            <button
              type="button"
              onClick={() => setAddStudentMode('new')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                addStudentMode === 'new'
                  ? 'bg-white dark:bg-surface-dark-secondary text-brand-navy dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              + {t('groups.addNewStudent', "Yangi o'quvchi qo'shish")}
            </button>
            <button
              type="button"
              onClick={() => setAddStudentMode('existing')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                addStudentMode === 'existing'
                  ? 'bg-white dark:bg-surface-dark-secondary text-brand-navy dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              {t('groups.existingStudent', "Mavjud o'quvchi")} ({availableStudents.length})
            </button>
          </div>

          {addStudentMode === 'new' ? (
            <form onSubmit={handleCreateAndEnrollStudent} className="space-y-4">
              <div className="p-3.5 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 text-xs text-brand-navy dark:text-blue-300">
                <p className="font-semibold">{t('users.parentsContact', "Ota-onasi bilan bog'lanish")}</p>
                <p className="text-gray-600 dark:text-gray-400 mt-0.5">
                  {t('users.parentPhoneNote', "Otasining yoki onasining (yoki ikkalasining) telefon raqamini kiriting.")}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t('common.firstName', 'Ism')}
                  icon={User}
                  required
                  placeholder="Masalan: Aziz"
                  value={newStudentData.firstName}
                  onChange={(e) =>
                    setNewStudentData({ ...newStudentData, firstName: e.target.value })
                  }
                />
                <Input
                  label={t('common.lastName', 'Familiya')}
                  icon={User}
                  required
                  placeholder="Masalan: Karimov"
                  value={newStudentData.lastName}
                  onChange={(e) =>
                    setNewStudentData({ ...newStudentData, lastName: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t('users.fatherPhone', 'Otasining telefon raqami')}
                  icon={Phone}
                  placeholder="+998 90 111 22 33"
                  value={newStudentData.fatherPhone}
                  onChange={(e) =>
                    setNewStudentData({ ...newStudentData, fatherPhone: e.target.value })
                  }
                />
                <Input
                  label={t('users.motherPhone', 'Onasining telefon raqami')}
                  icon={Phone}
                  placeholder="+998 90 222 33 44"
                  value={newStudentData.motherPhone}
                  onChange={(e) =>
                    setNewStudentData({ ...newStudentData, motherPhone: e.target.value })
                  }
                />
              </div>

              <Input
                label={t('users.studentPhoneOptional', "O'quvchining shaxsiy telefoni (ixtiyoriy)")}
                icon={Phone}
                placeholder="+998 90 333 44 55"
                value={newStudentData.phone}
                onChange={(e) =>
                  setNewStudentData({ ...newStudentData, phone: e.target.value })
                }
              />

              <div className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-surface-dark-tertiary/30">
                <PasswordStrengthInput
                  label={t('users.cabinetPassword', 'LMS kabinetga kirish paroli')}
                  required
                  value={newStudentData.password}
                  onValueChange={(val) =>
                    setNewStudentData({ ...newStudentData, password: val })
                  }
                  placeholder="Masalan: Jasur#2026!"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <Button variant="ghost" type="button" onClick={() => setIsAddStudentOpen(false)}>
                  {t('common.cancel', 'Bekor qilish')}
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  isLoading={isSubmittingNewStudent}
                >
                  {t('groups.createAndEnroll', 'Yaratish va guruhga qabul qilish')}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {availableStudents.length === 0 ? (
                <p className="text-sm text-gray-500 py-3">
                  {t('groups.allStudentsEnrolled', 'Barcha mavjud talabalar guruhlarga biriktirilgan.')}
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase text-gray-700 dark:text-gray-300">
                    {t('users.student', 'Talabani tanlang')}
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-navy"
                  >
                    {availableStudents.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.fullName} (@{st.username}) {st.phone ? `— ${st.phone}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <Button variant="ghost" onClick={() => setIsAddStudentOpen(false)}>
                  {t('common.cancel', 'Bekor qilish')}
                </Button>
                <Button
                  variant="primary"
                  disabled={availableStudents.length === 0}
                  onClick={handleEnrollStudent}
                >
                  {t('groups.confirmEnroll', 'Guruhga qabul qilish')}
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
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase text-gray-700 dark:text-gray-300">
                {t('groups.targetGroup', 'Target Study Group')}
              </label>
              <select
                value={targetGroupId}
                onChange={(e) => setTargetGroupId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-navy"
              >
                {otherGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.courseName}) — {g.studentCount}/{g.capacity}
                  </option>
                ))}
              </select>
            </div>
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
    </div>
  );
}
