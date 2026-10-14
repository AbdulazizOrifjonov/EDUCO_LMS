import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users,
  GraduationCap,
  ShieldCheck,
  Layers,
  CheckCircle2,
  BookOpen,
  Calendar,
  Clock,
  TrendingUp,
  Activity,
  PlusCircle,
  FileText,
  DollarSign,
  AlertCircle,
  RefreshCw,
  ArrowUpRight,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import dashboardService from '@/services/dashboardService';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';

export default function OwnerDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalAdmins: 0,
    totalGroups: 0,
    activeGroups: 0,
    totalCourses: 0,
  });

  const [todayLessons, setTodayLessons] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [attendanceChart, setAttendanceChart] = useState([]);

  const userName =
    profile?.first_name ||
    profile?.full_name ||
    user?.user_metadata?.first_name ||
    user?.email?.split('@')[0] ||
    'Owner';

  const loadDashboardData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const [statsData, lessonsData, activityData, weeklyAtt] = await Promise.all([
        dashboardService.getOwnerStats(),
        dashboardService.getTodayLessons(user?.id, 'owner'),
        dashboardService.getRecentActivity(6),
        dashboardService.getWeeklyAttendanceSummary(),
      ]);

      setStats(statsData);
      setTodayLessons(lessonsData);
      setRecentActivity(activityData);
      setAttendanceChart(weeklyAtt);
    } catch (err) {
      console.error('Owner dashboard data error:', err);
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Loading owner dashboard data..." />
      </div>
    );
  }

  // Definition for the 6 stats cards
  const statsCards = [
    {
      title: t('dashboard.totalStudents', 'Jami talabalar'),
      value: stats.totalStudents,
      icon: GraduationCap,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500/15 dark:bg-blue-500/20',
      borderColor: 'hover:border-blue-500/40',
      trend: t('dashboard.activeStudentsTrend', 'Faol o‘quvchilar'),
      trendUp: true,
      onClick: () => navigate('/owner/users?role=student'),
    },
    {
      title: t('dashboard.totalTeachers', "Jami o'qituvchilar"),
      value: stats.totalTeachers,
      icon: Users,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-500/15 dark:bg-indigo-500/20',
      borderColor: 'hover:border-indigo-500/40',
      trend: t('dashboard.activeTeachersTrend', 'Guruhlarga biriktirilgan'),
      trendUp: true,
      onClick: () => navigate('/owner/users?role=teacher'),
    },
    {
      title: t('dashboard.totalAdmins', 'Jami administratorlar'),
      value: stats.totalAdmins,
      icon: ShieldCheck,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-500/15 dark:bg-purple-500/20',
      borderColor: 'hover:border-purple-500/40',
      trend: t('dashboard.adminsTrend', 'Markaz boshqaruvi'),
      trendUp: true,
      onClick: () => navigate('/owner/users?role=admin'),
    },
    {
      title: t('dashboard.totalGroups', 'Jami guruhlar'),
      value: stats.totalGroups,
      icon: Layers,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500/15 dark:bg-amber-500/20',
      borderColor: 'hover:border-amber-500/40',
      trend: `${stats.activeGroups} ${t('common.active', 'faol').toLowerCase()}`,
      trendUp: true,
      onClick: () => navigate('/owner/groups'),
    },
    {
      title: t('dashboard.activeGroups', 'Faol guruhlar'),
      value: stats.activeGroups,
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/15 dark:bg-emerald-500/20',
      borderColor: 'hover:border-emerald-500/40',
      trend: t('dashboard.operationalTrend', 'Darslar davom etmoqda'),
      trendUp: true,
      onClick: () => navigate('/owner/groups?status=active'),
    },
    {
      title: t('dashboard.totalCourses', 'Jami kurslar'),
      value: stats.totalCourses,
      icon: BookOpen,
      color: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-500/15 dark:bg-rose-500/20',
      borderColor: 'hover:border-rose-500/40',
      trend: t('dashboard.coursesTrend', 'Barcha yo‘nalishlar'),
      trendUp: true,
      onClick: () => navigate('/owner/courses'),
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-brand-navy via-brand-navy-light to-blue-900 text-white shadow-xl relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-48 h-48 bg-white/5 rounded-full pointer-events-none blur-2xl" />
        <div className="absolute right-40 bottom-0 -mb-10 w-32 h-32 bg-brand-red/10 rounded-full pointer-events-none blur-xl" />

        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur text-xs font-semibold uppercase tracking-wider text-white/90 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{t('dashboard.ownerPortal', 'Owner Executive Portal')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t('dashboard.welcome', { name: userName, defaultValue: `Welcome back, ${userName}` })}
          </h1>
          <p className="text-sm text-blue-100/80 max-w-xl">
            {t('dashboard.ownerBannerSubtitle', 'Here is your daily operational summary across students, courses, schedules, and center performance.')}
          </p>
        </div>

        {/* Action button */}
        <div className="relative z-10 flex items-center gap-3">
          <button
            type="button"
            onClick={() => loadDashboardData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur text-sm font-medium transition-colors border border-white/10 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">
              {refreshing ? t('common.refreshing', 'Refreshing...') : t('common.refresh', 'Refresh')}
            </span>
          </button>
          <Button
            onClick={() => navigate('/owner/payroll')}
            variant="danger"
            size="md"
            icon={DollarSign}
            className="bg-brand-red hover:bg-brand-red-dark text-white shadow-lg"
          >
            {t('nav.payroll', 'Payroll Overview')}
          </Button>
        </div>
      </div>

      {/* Error Alert if any */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-brand-red/20 text-brand-red dark:text-red-300 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <Button onClick={() => loadDashboardData(true)} size="sm" variant="danger">
            {t('common.retry', 'Retry')}
          </Button>
        </div>
      )}

      {/* Quick Action Buttons Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mr-2 shrink-0">
          {t('dashboard.quickActions', 'Quick Actions')}:
        </span>
        <Button
          onClick={() => navigate('/owner/users?role=student')}
          variant="outline"
          size="sm"
          icon={PlusCircle}
          className="shrink-0 text-xs py-1.5"
        >
          {t('users.createStudent', "Yangi o'quvchi qo'shish")}
        </Button>
        <Button
          onClick={() => navigate('/owner/users?role=teacher')}
          variant="outline"
          size="sm"
          icon={PlusCircle}
          className="shrink-0 text-xs py-1.5"
        >
          {t('users.createTeacher', "O'qituvchi qo'shish")}
        </Button>
        <Button
          onClick={() => navigate('/owner/groups')}
          variant="outline"
          size="sm"
          icon={PlusCircle}
          className="shrink-0 text-xs py-1.5"
        >
          {t('groups.createGroup', 'New Group')}
        </Button>
        <Button
          onClick={() => navigate('/owner/courses')}
          variant="outline"
          size="sm"
          icon={BookOpen}
          className="shrink-0 text-xs py-1.5"
        >
          {t('nav.courses', 'Courses')}
        </Button>
        <Button
          onClick={() => navigate('/owner/reports')}
          variant="outline"
          size="sm"
          icon={FileText}
          className="shrink-0 text-xs py-1.5"
        >
          {t('reports.title', 'Generate Reports')}
        </Button>
      </div>

      {/* 6 Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5 sm:gap-4">
        {statsCards.map((item, index) => {
          const Icon = item.icon;
          return (
            <Card
              key={index}
              noPadding
              onClick={item.onClick}
              className={`p-4 flex flex-col justify-between hover:shadow-card-hover ${item.borderColor || 'hover:border-brand-navy/30'} transition-all cursor-pointer group`}
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
                <h3 className="text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide mt-1 leading-snug break-words">
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

      {/* Middle Section: Today's Lessons & Weekly Attendance Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Lessons (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card
            title={t('dashboard.todayLessons', "Today's Lessons")}
            subtitle={t('dashboard.scheduledToday', `Scheduled classes for today (${new Date().toLocaleDateString()})`)}
            headerAction={
              <Button
                onClick={() => navigate('/owner/schedule')}
                variant="ghost"
                size="sm"
                className="text-xs text-brand-navy dark:text-blue-400"
              >
                {t('dashboard.viewFullSchedule', 'View Full Schedule →')}
              </Button>
            }
          >
            {todayLessons.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title={t('dashboard.noLessonsToday', 'No lessons scheduled today')}
                description={t('dashboard.noLessonsDesc', 'All classes are either completed or none have been assigned for the current calendar date.')}
                actionText={t('nav.schedule', 'Schedule')}
                onAction={() => navigate('/owner/schedule')}
              />
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800 -mx-5 -my-5">
                {todayLessons.map((lesson) => (
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

        {/* Weekly Attendance Overview Bar Chart Placeholder (1 col) */}
        <div>
          <Card
            title={t('dashboard.attendanceOverview', 'Attendance Overview')}
            subtitle={t('dashboard.attendanceSubtitle', 'Weekly attendance rates across all groups')}
          >
            <div className="space-y-4">
              <div className="h-44 flex items-end justify-between gap-2 pt-6 px-2">
                {attendanceChart.map((bar, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                    <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {bar.rate}%
                    </span>
                    <div className="w-full bg-gray-100 dark:bg-surface-dark-tertiary rounded-t-lg h-32 relative overflow-hidden flex items-end">
                      <div
                        className="w-full bg-brand-navy dark:bg-blue-500 rounded-t-md transition-all duration-500 group-hover:bg-brand-red"
                        style={{ height: `${bar.rate}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {bar.day}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-navy dark:bg-blue-500" />
                  Target: 90%+
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  Avg. Rate: 92.6%
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Bottom Section: Recent Activity Feed */}
      <div>
        <Card
          title={t('dashboard.recentActivity', 'Recent Activity Feed')}
          subtitle={t('dashboard.activitySubtitle', 'System audit events, user activations, and enrollments')}
          headerAction={
            <Button
              onClick={() => navigate('/owner/audit')}
              variant="ghost"
              size="sm"
              className="text-xs text-brand-navy dark:text-blue-400"
            >
              {t('dashboard.viewAuditLogs', 'View Audit Logs →')}
            </Button>
          }
        >
          {recentActivity.length === 0 ? (
            <EmptyState
              icon={Activity}
              title={t('dashboard.noActivity', 'No recent activity logged')}
              description={t('dashboard.noActivityDesc', 'New system actions and registrations will automatically appear here.')}
            />
          ) : (
            <div className="space-y-3">
              {recentActivity.map((act) => (
                <div
                  key={act.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 dark:border-gray-800/80 bg-gray-50/50 dark:bg-surface-dark-tertiary/20 hover:border-gray-200 dark:hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-brand-navy dark:text-blue-300 flex items-center justify-center shrink-0">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                        {act.title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {act.description} &bull; <span className="font-medium">{act.user}</span>
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] text-gray-400 dark:text-gray-500 whitespace-nowrap ml-3">
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
