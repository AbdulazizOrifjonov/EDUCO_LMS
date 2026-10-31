import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users,
  GraduationCap,
  Layers,
  BookOpen,
  Calendar,
  Clock,
  TrendingUp,
  UserPlus,
  PlusCircle,
  FileSpreadsheet,
  AlertCircle,
  RefreshCw,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import dashboardService from '@/services/dashboardService';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalGroups: 0,
    activeGroups: 0,
    totalCourses: 0,
  });

  const [todaySchedule, setTodaySchedule] = useState([]);
  const [recentEnrollments, setRecentEnrollments] = useState([]);

  const userName =
    profile?.first_name ||
    profile?.full_name ||
    user?.user_metadata?.first_name ||
    user?.email?.split('@')[0] ||
    'Administrator';

  const loadData = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const [adminStats, lessons, enrollments] = await Promise.all([
        dashboardService.getAdminStats(),
        dashboardService.getTodayLessons(user?.id, 'admin'),
        dashboardService.getRecentEnrollments(5),
      ]);

      setStats(adminStats);
      setTodaySchedule(lessons);
      setRecentEnrollments(enrollments);
    } catch (err) {
      console.error('Admin dashboard error:', err);
      setError(err.message || 'Failed to load administrator metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  useEffect(() => {
    const handleSync = () => {
      loadData(false);
    };
    window.addEventListener('educo-data-sync', handleSync);
    return () => window.removeEventListener('educo-data-sync', handleSync);
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Loading administrator dashboard..." />
      </div>
    );
  }

  // 4 Primary Stats Cards (Without payroll metrics)
  const statCards = [
    {
      title: t('dashboard.totalStudents', 'Jami talabalar'),
      value: stats.totalStudents,
      icon: GraduationCap,
      color: 'text-blue-600 dark:text-emerald-400',
      bgColor: 'bg-blue-500/15 dark:bg-emerald-500/20',
      trend: t('dashboard.activeStudentsTrend', 'Faol o‘quvchilar'),
      onClick: () => navigate('/admin/users?role=student'),
    },
    {
      title: t('dashboard.totalTeachers', "Jami o'qituvchilar"),
      value: stats.totalTeachers,
      icon: Users,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500/15 dark:bg-amber-500/20',
      trend: t('dashboard.activeTeachersTrend', 'Guruhlarga biriktirilgan'),
      onClick: () => navigate('/admin/users?role=teacher'),
    },
    {
      title: t('dashboard.totalGroups', 'Jami guruhlar'),
      value: stats.totalGroups,
      icon: Layers,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500/15 dark:bg-amber-500/20',
      trend: `${stats.activeGroups} ${t('common.active', 'faol').toLowerCase()}`,
      onClick: () => navigate('/admin/groups'),
    },
    {
      title: t('dashboard.totalCourses', 'Jami kurslar'),
      value: stats.totalCourses,
      icon: BookOpen,
      color: 'text-blue-600 dark:text-emerald-400',
      bgColor: 'bg-blue-500/15 dark:bg-emerald-500/20',
      trend: t('dashboard.coursesTrend', 'Barcha yo‘nalishlar'),
      onClick: () => navigate('/admin/courses'),
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner with Rich Blue Gradient in Light Mode, Emerald in Dark Mode */}
      <div className="dashboard-banner select-none flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#123D78] via-[#1b4b8a] to-[#2563EB] dark:from-[#072228] dark:via-[#092e27] dark:to-[#04241b] text-white shadow-xl relative overflow-hidden border border-blue-400/20 dark:border-emerald-500/20">
        {/* Decorative ambient blur glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-sky-400/10 dark:bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 dark:bg-emerald-500/20 backdrop-blur text-xs font-semibold uppercase tracking-wider text-white/95 dark:text-emerald-200 border border-white/20 dark:border-emerald-400/40 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-200 dark:text-emerald-300" />
            <span>{t('dashboard.adminPortal', 'Administrator boshqaruv paneli')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t('dashboard.welcome', { name: userName, defaultValue: `Xush kelibsiz, ${userName}` })}
          </h1>
          <p className="text-sm text-blue-100 dark:text-emerald-100/80 max-w-xl">
            {t('dashboard.adminBannerSubtitle', 'Akademik jarayonlar, o‘qituvchilar dars jadvali va talabalar qabuli markazi.')}
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
            onClick={() => navigate('/admin/groups')}
            variant="danger"
            size="md"
            icon={PlusCircle}
            className="bg-brand-red hover:bg-brand-red-dark text-white shadow-md"
          >
            {t('groups.createGroup', 'Yangi guruh yaratish')}
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

      {/* Quick Action Buttons for Admin */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 pt-0.5">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-emerald-400 mr-1 shrink-0 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          {t('dashboard.adminQuickActions', 'Tezkor amallar:')}
        </span>
        <button
          type="button"
          onClick={() => navigate('/admin/users?role=student')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-500/15 text-blue-700 dark:bg-emerald-500/15 dark:text-emerald-300 border border-blue-500/30 dark:border-emerald-500/30 hover:bg-blue-500/25 dark:hover:bg-emerald-500/25 transition-all shadow-xs shrink-0 cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5 text-blue-600 dark:text-emerald-400" />
          <span>{t('users.createStudent', "Yangi o'quvchi qo'shish")}</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/admin/users?role=teacher')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-all shadow-xs shrink-0 cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>{t('users.createTeacher', "O'qituvchi qo'shish")}</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/admin/schedule')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 hover:bg-teal-500/25 transition-all shadow-xs shrink-0 cursor-pointer"
        >
          <Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span>{t('schedule.title', 'Dars jadvali')}</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/admin/attendance')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30 hover:bg-sky-500/25 transition-all shadow-xs shrink-0 cursor-pointer"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          <span>{t('attendance.title', 'Davomat markazi')}</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/admin/announcements')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 hover:bg-purple-500/25 transition-all shadow-xs shrink-0 cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span>{t('announcements.newAnnouncement', "E'lon berish")}</span>
        </button>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {statCards.map((item, idx) => {
          const Icon = item.icon;
          return (
            <Card
              key={idx}
              noPadding
              onClick={item.onClick}
              className="p-4 sm:p-5 flex flex-col justify-between hover:shadow-card-hover hover:border-brand-navy/30 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${item.bgColor} ${item.color} flex items-center justify-center transition-transform group-hover:scale-105 shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-brand-navy dark:group-hover:text-blue-400 transition-colors shrink-0" />
              </div>
              <div>
                <span className="text-2xl font-black tracking-tight text-gray-900 dark:text-white block">
                  {item.value}
                </span>
                <h3 className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide mt-1 leading-snug break-words">
                  {item.title}
                </h3>
                <div className="flex items-center gap-1.5 mt-2 text-[11px] text-blue-600 dark:text-emerald-400 font-medium leading-tight">
                  <TrendingUp className="w-3 h-3 shrink-0" />
                  <span>{item.trend}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Main Grid: Today's Schedule & Recent Enrollments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card
            title={t('dashboard.todayLessons', "Today's Schedule")}
            subtitle={t('dashboard.todayTimelineSubtitle', 'Real-time timeline of lessons occurring today')}
            headerAction={
              <Button
                onClick={() => navigate('/schedule')}
                variant="ghost"
                size="sm"
                className="text-xs text-blue-600 dark:text-emerald-400 hover:text-blue-700 dark:hover:text-emerald-300 font-semibold"
              >
                {t('dashboard.scheduleGrid', 'Schedule Grid →')}
              </Button>
            }
          >
            {todaySchedule.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title={t('dashboard.noLessonsToday', 'No lessons scheduled today')}
                description={t('dashboard.noLessonsFoundDesc', "No active lesson blocks were found for today's date.")}
                actionText={t('schedule.addLesson', 'Schedule a Lesson')}
                onAction={() => navigate('/schedule')}
              />
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800 -mx-5 -my-5">
                {todaySchedule.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="p-4 sm:p-5 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-surface-dark-tertiary/40 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-emerald-500/20 text-blue-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                            {lesson.title}
                          </h4>
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-semibold text-white"
                            style={{ backgroundColor: lesson.courseColor || '#123D78' }}
                          >
                            {lesson.courseName}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {lesson.groupName} &bull; {lesson.room ? `${lesson.room}-xona` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-semibold text-gray-900 dark:text-white block">
                        {lesson.startTime} - {lesson.endTime}
                      </span>
                      <Badge
                        variant={lesson.status === 'completed' ? 'success' : 'primary'}
                        size="sm"
                        className="mt-1"
                      >
                        {lesson.status === 'completed' ? t('common.completed', 'Tugallangan') : t('common.active', 'Faol')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Recent Enrollments (1 col) */}
        <div>
          <Card
            title={t('dashboard.recentEnrollments', 'So‘nggi qabullar')}
            subtitle={t('dashboard.enrollmentSubtitle', 'Guruhlarga qabul qilingan so‘nggi o‘quvchilar')}
            headerAction={
              <Button
                onClick={() => navigate('/admin/groups')}
                variant="ghost"
                size="sm"
                className="text-xs text-blue-600 dark:text-emerald-400 hover:text-blue-700 dark:hover:text-emerald-300 font-semibold"
              >
                {t('common.viewAll', 'Barchasini ko‘rish →')}
              </Button>
            }
          >
            {recentEnrollments.length === 0 ? (
              <EmptyState
                icon={Users}
                title={t('dashboard.noRecentEnrollments', 'So‘nggi qabullar yo‘q')}
                description={t('dashboard.noEnrollmentsDesc', 'Kurslarga qabul qilingan talabalar bu yerda aks etadi.')}
              />
            ) : (
              <div className="space-y-3">
                {recentEnrollments.map((enr) => {
                  const student = enr.profiles;
                  const group = enr.groups;
                  const fullName = student ? `${student.first_name} ${student.last_name}` : 'Talaba';
                  return (
                    <div
                      key={enr.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-surface-dark-tertiary/20 hover:border-blue-500/20 dark:hover:border-emerald-500/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/15 dark:bg-emerald-500/25 text-blue-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs uppercase">
                          {fullName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                            {fullName}
                          </h4>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            {group?.name || 'Guruh'}ga qabul qilingan
                          </p>
                        </div>
                      </div>

                      <Badge variant="success" size="sm">
                        {t('common.active', 'Faol')}
                      </Badge>
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
