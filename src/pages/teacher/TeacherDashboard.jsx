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
  AlertCircle,
  RefreshCw,
  Sparkles,
  ArrowRight,
  UserPlus,
  User,
  Phone,
  MessageSquare,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import dashboardService from '@/services/dashboardService';
import { createStudent } from '@/services/userService';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
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

  useEffect(() => {
    const handleSync = () => {
      if (user?.id) {
        loadData(false);
      }
    };
    window.addEventListener('educo-data-sync', handleSync);
    return () => window.removeEventListener('educo-data-sync', handleSync);
  }, [user?.id]);



  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Loading teacher classroom portal..." />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Banner with Rich Blue Gradient in Light Mode, Emerald in Dark Mode */}
      <div className="dashboard-banner select-none flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#123D78] via-[#1b4b8a] to-[#2563EB] dark:from-[#072228] dark:via-[#092e27] dark:to-[#04241b] text-white shadow-xl relative overflow-hidden border border-blue-400/20 dark:border-emerald-500/20">
        {/* Decorative ambient blur glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-sky-400/10 dark:bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 dark:bg-emerald-500/20 backdrop-blur text-xs font-semibold uppercase tracking-wider text-white/95 dark:text-emerald-200 border border-white/20 dark:border-emerald-400/40 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-200 dark:text-emerald-300" />
            <span>{t('dashboard.teacherPortal', 'O‘qituvchi o‘quv markazi')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t('dashboard.welcome', { name: teacherName, defaultValue: `Xush kelibsiz, ${teacherName}` })}
          </h1>
          <p className="text-sm text-blue-100 dark:text-emerald-100/80 max-w-xl">
            {t('dashboard.teacherBannerSubtitle', 'Guruhlarni boshqarish, dars davomati olish, topshiriqlarni tekshirish va baholash portali.')}
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 dark:hover:bg-emerald-500/20 backdrop-blur text-sm font-medium transition-colors border border-white/15 dark:border-emerald-400/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">
              {refreshing ? t('common.refreshing', 'Yangilanmoqda...') : t('common.refresh', 'Yangilash')}
            </span>
          </button>
          <Button
            onClick={() => navigate('/teacher/attendance')}
            variant="danger"
            size="md"
            icon={CheckCircle2}
            className="bg-brand-red hover:bg-brand-red-dark text-white shadow-md"
          >
            {t('attendance.markAttendance', 'Davomat olish')}
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
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 pt-0.5">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-emerald-400 mr-1 shrink-0 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          {t('dashboard.teacherQuickActions', 'Tezkor amallar:')}
        </span>
        <button
          type="button"
          onClick={() => navigate('/teacher/students/create')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-500/15 text-blue-700 dark:bg-emerald-500/15 dark:text-emerald-300 border border-blue-500/30 dark:border-emerald-500/30 hover:bg-blue-500/25 dark:hover:bg-emerald-500/25 transition-all shadow-xs shrink-0 cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5 text-blue-600 dark:text-emerald-400" />
          <span>{t('dashboard.addNewStudentQuick', "+ Yangi o'quvchi qo'shish")}</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/teacher/attendance')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 hover:bg-teal-500/25 transition-all shadow-xs shrink-0 cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span>{t('attendance.markAttendance', 'Davomat olish')}</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/teacher/grades')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-all shadow-xs shrink-0 cursor-pointer"
        >
          <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>{t('grades.addGrade', 'Baho qo‘yish')}</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/teacher/chat')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30 hover:bg-sky-500/25 transition-all shadow-xs shrink-0 cursor-pointer"
        >
          <MessageSquare className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          <span>{t('nav.chat', 'Guruh chatlari')}</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/teacher/schedule')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 hover:bg-purple-500/25 transition-all shadow-xs shrink-0 cursor-pointer"
        >
          <Calendar className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span>{t('dashboard.mySchedule', 'Dars jadvali')}</span>
        </button>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card noPadding className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/15 dark:bg-emerald-500/20 text-blue-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
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
          <div className="w-12 h-12 rounded-xl bg-blue-500/15 dark:bg-emerald-500/20 text-blue-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
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
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-gray-900 dark:text-white block">
              {todayLessons.length}
            </span>
            <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
              {t('dashboard.todayLessons', 'Bugungi darslar')}
            </p>
          </div>
        </Card>
      </div>

      {/* Middle Section: My Groups List & Today's Lessons */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Groups List with Student Counts (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card
            title={t('dashboard.myGroups', 'Mening guruhlarim')}
            subtitle={t('dashboard.myGroupsSubtitle', 'Sizga biriktirilgan faol o‘quv guruhlari')}
            headerAction={
              <Button
                onClick={() => navigate('/teacher/groups')}
                variant="ghost"
                size="sm"
                className="text-xs text-brand-navy dark:text-blue-400 font-semibold"
              >
                {t('dashboard.manageGroupsLink', 'Guruhlarni boshqarish →')}
              </Button>
            }
          >
            {teacherData.myGroups.length === 0 ? (
              <EmptyState
                icon={Layers}
                title={t('dashboard.noGroupsAssigned', 'Hali guruhlar biriktirilmagan')}
                description={t('dashboard.noGroupsAssignedDesc', 'Ma‘muriyat sizga o‘quv guruhlarini biriktirganda, ular bu yerda ko‘rinadi.')}
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
                          {t('dashboard.roomNumber', { room: grp.room, defaultValue: `${grp.room}-xona` })}
                        </Badge>
                      </div>
                      <h4 className="text-base font-bold text-gray-900 dark:text-white">
                        {grp.name}
                      </h4>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5 font-medium">
                        <Users className="w-3.5 h-3.5 text-blue-700 dark:text-emerald-400" />
                        {t('dashboard.studentsCapacity', { count: grp.studentCount, capacity: grp.capacity, defaultValue: `${grp.studentCount} / ${grp.capacity} talaba` })}
                      </span>
                      <button
                        type="button"
                        onClick={() => navigate(`/teacher/groups/${grp.id}`)}
                        className="text-blue-700 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {t('common.details', 'Batafsil')} <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Today's Lessons */}
          <Card
            title={t('dashboard.todayLessons', "Bugungi darslar")}
            subtitle={t('dashboard.todayLessonsSubtitle', "Bugungi taqvimingizdagi rejalashtirilgan darslar")}
          >
            {todayLessons.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title={t('dashboard.noClassesScheduledToday', "Bugun darslar rejalashtirilmagan")}
                description={t('dashboard.noClassesScheduledTodayDesc', "Bugungi kunda siz uchun o‘quv mashg‘ulotlari belgilanmagan.")}
              />
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800 -mx-5 -my-5">
                {todayLessons.map((l) => (
                  <div
                    key={l.id}
                    className="p-4 sm:p-5 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-surface-dark-tertiary/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-emerald-950/40 text-blue-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                          {l.title}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {l.groupName} &bull; {l.room ? `${l.room}-xona` : ''} &bull; {l.courseName}
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
                        {t('dashboard.takeAttendance', 'Davomat olish')}
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
            title={t('dashboard.upcomingLessons', 'Kutilayotgan darslar')}
            subtitle={t('dashboard.upcomingClassesSubtitle', 'Yaqin kunlardagi dars mashg‘ulotlari')}
          >
            {upcomingSchedule.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title={t('dashboard.noUpcomingClasses', 'Kutilayotgan darslar yo‘q')}
                description={t('dashboard.noUpcomingClassesDesc', 'Bu hafta uchun boshqa rejalashtirilgan darslar topilmadi.')}
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
                      <span>{item.groups?.name || 'Guruh'}</span>
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
            title={t('dashboard.recentGradesGiven', 'So‘nggi qo‘yilgan baholar')}
            subtitle={t('dashboard.recentGradesSubtitle', 'Baholar jurnaliga kiritilgan so‘nggi ballar')}
            headerAction={
              <Button
                onClick={() => navigate('/teacher/grades')}
                variant="ghost"
                size="sm"
                className="text-xs text-brand-navy dark:text-blue-400 font-semibold"
              >
                {t('dashboard.gradebookLink', 'Baholar jurnali →')}
              </Button>
            }
          >
            {recentGrades.length === 0 ? (
              <EmptyState
                icon={Award}
                title={t('dashboard.noGradesRecorded', 'Hali baholar qayd etilmagan')}
                description={t('dashboard.noGradesRecordedDesc', 'O‘quvchilarga qo‘yilgan baholar bu yerda ko‘rinadi.')}
              />
            ) : (
              <div className="space-y-3">
                {recentGrades.map((g) => {
                  const studentName = g.student
                    ? `${g.student.first_name} ${g.student.last_name}`
                    : 'Talaba';
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
                          {g.lesson?.title || 'Dars'}
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

    </div>
  );
}
