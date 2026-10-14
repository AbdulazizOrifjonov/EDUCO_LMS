import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Layers,
  Users,
  Calendar,
  Clock,
  Award,
  BookOpen,
  FileCheck,
  CheckCircle2,
  PlusCircle,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ArrowRight,
  UserPlus,
  User,
  Phone,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import dashboardService from '@/services/dashboardService';
import { createStudent } from '@/services/userService';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import PasswordStrengthInput, { evaluatePasswordStrength } from '@/components/ui/PasswordStrengthInput';
import { toast } from '@/components/ui/Toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { cleanUzPhone } from '@/utils/phoneFormat';

export default function TeacherDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // New Student Modal state
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [newStudentData, setNewStudentData] = useState({
    firstName: '',
    lastName: '',
    fatherPhone: '',
    motherPhone: '',
    phone: '',
    password: '',
    groupId: '',
  });
  const [isSubmittingStudent, setIsSubmittingStudent] = useState(false);

  const [teacherData, setTeacherData] = useState({
    myGroupsCount: 0,
    totalStudentsCount: 0,
    pendingHomework: 0,
    myGroups: [],
  });

  const [todayLessons, setTodayLessons] = useState([]);
  const [upcomingSchedule, setUpcomingSchedule] = useState([]);
  const [recentGrades, setRecentGrades] = useState([]);

  const teacherName =
    profile?.first_name ||
    profile?.full_name ||
    user?.user_metadata?.first_name ||
    user?.email?.split('@')[0] ||
    'Teacher';

  const loadData = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const teacherId = user?.id;

      const [statsRes, lessonsRes, upcomingRes, gradesRes] = await Promise.all([
        dashboardService.getTeacherStats(teacherId),
        dashboardService.getTodayLessons(teacherId, 'teacher'),
        dashboardService.getUpcomingSchedule(teacherId, 'teacher', 5),
        dashboardService.getTeacherRecentGrades(teacherId, 5),
      ]);

      setTeacherData(statsRes);
      setTodayLessons(lessonsRes);
      setUpcomingSchedule(upcomingRes);
      setRecentGrades(gradesRes);
    } catch (err) {
      console.error('Teacher dashboard error:', err);
      setError(err.message || 'Failed to load teacher workspace');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const handleCreateStudent = async (e) => {
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

    setIsSubmittingStudent(true);
    try {
      await createStudent({
        firstName: newStudentData.firstName,
        lastName: newStudentData.lastName,
        fatherPhone: cleanFather,
        motherPhone: cleanMother,
        phone: cleanPhone,
        password: trimmedPwd,
        groupId: newStudentData.groupId || null,
      });
      toast.success(t('users.userCreated', 'Yangi o‘quvchi muvaffaqiyatli qo‘shildi!'));
      setNewStudentData({
        firstName: '',
        lastName: '',
        fatherPhone: '',
        motherPhone: '',
        phone: '',
        password: '',
        groupId: '',
      });
      setIsAddStudentOpen(false);
      loadData(true);
    } catch (err) {
      toast.error(err.message || 'Xatolik yuz berdi');
    } finally {
      setIsSubmittingStudent(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Loading teacher classroom portal..." />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-brand-navy via-brand-navy-light to-blue-900 text-white shadow-xl relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur text-xs font-semibold uppercase tracking-wider text-white/90 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{t('dashboard.teacherPortal', 'Teacher Portal')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t('dashboard.welcome', { name: teacherName, defaultValue: `Welcome back, ${teacherName}` })}
          </h1>
          <p className="text-sm text-blue-100/80 max-w-xl">
            {t('dashboard.teacherBannerSubtitle', 'Manage your classroom groups, mark lesson attendance, evaluate assignments, and track student grades.')}
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur text-sm font-medium transition-colors border border-white/10 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">
              {refreshing ? t('common.refreshing', 'Refreshing...') : t('common.refresh', 'Refresh')}
            </span>
          </button>
          <Button
            onClick={() => navigate('/teacher/attendance')}
            variant="danger"
            size="md"
            icon={CheckCircle2}
            className="bg-brand-red hover:bg-brand-red-dark text-white shadow-md"
          >
            {t('attendance.markAttendance', 'Mark Attendance')}
          </Button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-brand-red/20 text-brand-red dark:text-red-300 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <Button onClick={() => loadData(true)} size="sm" variant="danger">
            {t('common.retry', 'Retry')}
          </Button>
        </div>
      )}

      {/* Quick Action Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mr-2 shrink-0">
          {t('dashboard.teacherQuickActions', 'Teacher Quick Actions:')}
        </span>
        <Button
          onClick={() => setIsAddStudentOpen(true)}
          variant="primary"
          size="sm"
          icon={UserPlus}
          className="shrink-0 text-xs py-1.5 shadow-sm"
        >
          {t('dashboard.addNewStudentQuick', "+ Yangi o'quvchi qo'shish")}
        </Button>
        <Button
          onClick={() => navigate('/teacher/attendance')}
          variant="outline"
          size="sm"
          icon={CheckCircle2}
          className="shrink-0 text-xs py-1.5"
        >
          {t('attendance.markAttendance', 'Mark Attendance')}
        </Button>
        <Button
          onClick={() => navigate('/teacher/grades')}
          variant="outline"
          size="sm"
          icon={Award}
          className="shrink-0 text-xs py-1.5"
        >
          {t('grades.addGrade', 'Add Grade')}
        </Button>
        <Button
          onClick={() => navigate('/teacher/homework')}
          variant="outline"
          size="sm"
          icon={PlusCircle}
          className="shrink-0 text-xs py-1.5"
        >
          {t('homework.createHomework', 'Create Homework')}
        </Button>
        <Button
          onClick={() => navigate('/teacher/schedule')}
          variant="outline"
          size="sm"
          icon={Calendar}
          className="shrink-0 text-xs py-1.5"
        >
          {t('dashboard.mySchedule', 'My Timetable')}
        </Button>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card noPadding className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/15 dark:bg-blue-500/20 text-brand-navy dark:text-blue-400 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-gray-900 dark:text-white block">
              {teacherData.myGroupsCount}
            </span>
            <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
              {t('dashboard.assignedGroups', 'Biriktirilgan guruhlar')}
            </p>
          </div>
        </Card>

        <Card noPadding className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-gray-900 dark:text-white block">
              {teacherData.totalStudentsCount}
            </span>
            <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
              {t('dashboard.enrolledStudents', 'Qabul qilingan talabalar')}
            </p>
          </div>
        </Card>

        <Card noPadding className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-gray-900 dark:text-white block">
              {teacherData.pendingHomework}
            </span>
            <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
              {t('dashboard.pendingHomework', 'Tekshirish kutilmoqda')}
            </p>
          </div>
        </Card>
      </div>

      {/* Middle Section: My Groups List & Today's Lessons */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Groups List with Student Counts (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card
            title={t('dashboard.myGroups', 'My Groups')}
            subtitle="Active academic groups assigned to your supervision"
            headerAction={
              <Button
                onClick={() => navigate('/teacher/groups')}
                variant="ghost"
                size="sm"
                className="text-xs text-brand-navy dark:text-blue-400"
              >
                Manage Groups &rarr;
              </Button>
            }
          >
            {teacherData.myGroups.length === 0 ? (
              <EmptyState
                icon={Layers}
                title="No groups assigned yet"
                description="When the administration assigns you to instructional groups, they will show up here."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {teacherData.myGroups.map((grp) => (
                  <div
                    key={grp.id}
                    className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/40 dark:bg-surface-dark-tertiary/20 hover:border-brand-navy/30 dark:hover:border-blue-500/30 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="px-2 py-0.5 rounded text-[11px] font-semibold text-white"
                          style={{ backgroundColor: grp.courseColor }}
                        >
                          {grp.courseName}
                        </span>
                        <Badge variant="primary" size="sm">
                          Room: {grp.room}
                        </Badge>
                      </div>
                      <h4 className="text-base font-bold text-gray-900 dark:text-white">
                        {grp.name}
                      </h4>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5 font-medium">
                        <Users className="w-3.5 h-3.5 text-brand-navy dark:text-blue-400" />
                        {grp.studentCount} / {grp.capacity} Students
                      </span>
                      <button
                        type="button"
                        onClick={() => navigate(`/teacher/groups/${grp.id}`)}
                        className="text-brand-navy dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
                      >
                        Details <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Today's Lessons */}
          <Card
            title={t('dashboard.todayLessons', "Today's Lessons")}
            subtitle="Classes scheduled on your calendar for today"
          >
            {todayLessons.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No classes scheduled today"
                description="You have no teaching periods scheduled for today."
              />
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800 -mx-5 -my-5">
                {todayLessons.map((l) => (
                  <div
                    key={l.id}
                    className="p-4 sm:p-5 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-surface-dark-tertiary/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-brand-navy dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                          {l.title}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {l.groupName} &bull; Room {l.room} &bull; {l.courseName}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-semibold text-gray-900 dark:text-white block">
                        {l.startTime} - {l.endTime}
                      </span>
                      <Button
                        onClick={() => navigate(`/teacher/attendance?lessonId=${l.id}`)}
                        size="sm"
                        variant="primary"
                        className="mt-1.5 text-xs py-1"
                      >
                        Take Attendance
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Upcoming Schedule & Recent Grades Given (1 col) */}
        <div className="space-y-6">
          {/* Upcoming Schedule */}
          <Card
            title={t('dashboard.upcomingLessons', 'Upcoming Schedule')}
            subtitle="Classes over the coming days"
          >
            {upcomingSchedule.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No upcoming classes"
                description="No additional scheduled lessons found for this week."
              />
            ) : (
              <div className="space-y-3">
                {upcomingSchedule.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-surface-dark-tertiary/20"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-gray-900 dark:text-white">
                        {item.title}
                      </span>
                      <span className="text-[11px] font-semibold text-brand-navy dark:text-blue-400">
                        {item.lesson_date}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                      <span>{item.groups?.name || 'Group'}</span>
                      <span>
                        {item.start_time?.slice(0, 5)} - {item.end_time?.slice(0, 5)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Grades Given */}
          <Card
            title="Recent Grades Given"
            subtitle="Latest marks submitted to the gradebook"
            headerAction={
              <Button
                onClick={() => navigate('/grades')}
                variant="ghost"
                size="sm"
                className="text-xs text-brand-navy dark:text-blue-400"
              >
                Gradebook &rarr;
              </Button>
            }
          >
            {recentGrades.length === 0 ? (
              <EmptyState
                icon={Award}
                title="No grades recorded"
                description="Grades assigned to students will appear here."
              />
            ) : (
              <div className="space-y-3">
                {recentGrades.map((g) => {
                  const studentName = g.student
                    ? `${g.student.first_name} ${g.student.last_name}`
                    : 'Student';
                  return (
                    <div
                      key={g.id}
                      className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-surface-dark-tertiary/20 flex items-center justify-between"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                          {studentName}
                        </h4>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          {g.lesson?.title || 'Lesson'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-brand-navy dark:text-blue-300 font-black text-sm flex items-center justify-center">
                          {g.grade_value}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Modal: Add New Student for Teacher */}
      <Modal
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
        title={t('groups.addNewStudent', "Yangi o'quvchi qo'shish")}
        subtitle={t('users.createSubtitle', "EDUCO LMS tizimiga yangi a‘zo qo‘shish")}
        size="lg"
      >
        <form onSubmit={handleCreateStudent} className="space-y-4">
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
              placeholder="Masalan: Jasur"
              value={newStudentData.firstName}
              onChange={(e) =>
                setNewStudentData({ ...newStudentData, firstName: e.target.value })
              }
            />
            <Input
              label={t('common.lastName', 'Familiya')}
              icon={User}
              required
              placeholder="Masalan: Rustamov"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('users.studentPhoneOptional', "O'quvchining shaxsiy telefoni (ixtiyoriy)")}
              icon={Phone}
              placeholder="+998 90 333 44 55"
              value={newStudentData.phone}
              onChange={(e) =>
                setNewStudentData({ ...newStudentData, phone: e.target.value })
              }
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase text-gray-700 dark:text-gray-300">
                {t('groups.group', "O'quv guruhi")}
              </label>
              <select
                value={newStudentData.groupId}
                onChange={(e) =>
                  setNewStudentData({ ...newStudentData, groupId: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-navy"
              >
                <option value="">{t('groups.unassigned', 'Guruhsiz (faqat ro‘yxatga olish)')}</option>
                {teacherData.myGroups.map((grp) => (
                  <option key={grp.id} value={grp.id}>
                    {grp.name} ({grp.studentCount || grp.enrolled_count || 0} o‘quvchi)
                  </option>
                ))}
              </select>
            </div>
          </div>

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
            <Button
              variant="ghost"
              type="button"
              onClick={() => setIsAddStudentOpen(false)}
            >
              {t('common.cancel', 'Bekor qilish')}
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isSubmittingStudent}
            >
              {t('common.create', 'Qo‘shish')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
