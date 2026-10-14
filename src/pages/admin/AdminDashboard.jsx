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
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500/15 dark:bg-blue-500/20',
      trend: t('dashboard.activeStudentsTrend', 'Faol o‘quvchilar'),
      onClick: () => navigate('/admin/users?role=student'),
    },
    {
      title: t('dashboard.totalTeachers', "Jami o'qituvchilar"),
      value: stats.totalTeachers,
      icon: Users,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-500/15 dark:bg-indigo-500/20',
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
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/15 dark:bg-emerald-500/20',
      trend: t('dashboard.coursesTrend', 'Barcha yo‘nalishlar'),
      onClick: () => navigate('/admin/courses'),
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-brand-navy via-brand-navy-light to-blue-900 text-white shadow-xl relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur text-xs font-semibold uppercase tracking-wider text-white/90 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-200" />
            <span>{t('dashboard.adminPortal', 'Administrator Control Panel')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t('dashboard.welcome', { name: userName, defaultValue: `Welcome back, ${userName}` })}
          </h1>
          <p className="text-sm text-blue-100/80 max-w-xl">
            {t('dashboard.adminBannerSubtitle', 'Monitor real-time academic operations, faculty timetables, and student enrollment.')}
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
            onClick={() => navigate('/admin/groups')}
            variant="danger"
            size="md"
            icon={PlusCircle}
            className="bg-brand-red hover:bg-brand-red-dark text-white shadow-md"
          >
            {t('groups.createGroup', 'Create New Group')}
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
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mr-2 shrink-0">
          {t('dashboard.adminQuickActions', 'Admin Quick Actions:')}
        </span>
        <Button
          onClick={() => navigate('/admin/users?role=student')}
          variant="outline"
          size="sm"
          icon={UserPlus}
          className="shrink-0 text-xs py-1.5"
        >
          {t('users.createStudent', "Yangi o'quvchi qo'shish")}
        </Button>
        <Button
          onClick={() => navigate('/admin/users?role=teacher')}
          variant="outline"
          size="sm"
          icon={UserPlus}
          className="shrink-0 text-xs py-1.5"
        >
          {t('users.createTeacher', "O'qituvchi qo'shish")}
        </Button>
        <Button
          onClick={() => navigate('/admin/schedule')}
          variant="outline"
          size="sm"
          icon={Calendar}
          className="shrink-0 text-xs py-1.5"
        >
          {t('schedule.title', 'Manage Schedule')}
        </Button>
        <Button
          onClick={() => navigate('/admin/attendance')}
          variant="outline"
          size="sm"
          icon={FileSpreadsheet}
          className="shrink-0 text-xs py-1.5"
        >
          {t('attendance.title', 'Attendance Center')}
        </Button>
        <Button
          onClick={() => navigate('/admin/announcements')}
          variant="outline"
          size="sm"
          icon={PlusCircle}
          className="shrink-0 text-xs py-1.5"
        >
          {t('announcements.newAnnouncement', 'Post Announcement')}
        </Button>
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
                <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium leading-tight">
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
                className="text-xs text-brand-navy dark:text-blue-400"
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
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-brand-navy dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
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
                          {lesson.groupName} &bull; Room: {lesson.room}
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
                        {lesson.status}
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
            title={t('dashboard.recentEnrollments', 'Recent Enrollments')}
            subtitle={t('dashboard.enrollmentSubtitle', 'Latest students added to groups')}
            headerAction={
              <Button
                onClick={() => navigate('/groups')}
                variant="ghost"
                size="sm"
                className="text-xs text-brand-navy dark:text-blue-400"
              >
                {t('common.viewAll', 'View All →')}
              </Button>
            }
          >
            {recentEnrollments.length === 0 ? (
              <EmptyState
                icon={Users}
                title={t('dashboard.noRecentEnrollments', 'No recent enrollments')}
                description={t('dashboard.noEnrollmentsDesc', 'Students enrolled into courses will be listed here.')}
              />
            ) : (
              <div className="space-y-3">
                {recentEnrollments.map((enr) => {
                  const student = enr.profiles;
                  const group = enr.groups;
                  const fullName = student ? `${student.first_name} ${student.last_name}` : 'Student';
                  return (
                    <div
                      key={enr.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-surface-dark-tertiary/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-brand-navy dark:text-blue-300 flex items-center justify-center font-bold text-xs uppercase">
                          {fullName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                            {fullName}
                          </h4>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            {t('groups.enrolled', 'Enrolled')} in {group?.name || 'Group'}
                          </p>
                        </div>
                      </div>

                      <Badge variant="success" size="sm">
                        {t('groups.enrolled', 'Enrolled')}
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
