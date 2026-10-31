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
  ClipboardCheck,
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

// Dynamic vertical 5-stop gradient for each attendance bar:
// Eng pasti: qizil (#f43f5e) -> sal teparog'i: sabzirang (#f97316) -> o'rtasi: sariq (#facc15) -> keyin: och yashil (#a3e635) -> eng tepasi: yashil (#10b981)
const ATTENDANCE_BAR_GRADIENT =
  'linear-gradient(to top, #f43f5e 0%, #f97316 25%, #facc15 50%, #a3e635 75%, #10b981 100%)';

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

  useEffect(() => {
    const handleSync = () => {
      loadDashboardData(false);
    };
    window.addEventListener('educo-data-sync', handleSync);
    return () => window.removeEventListener('educo-data-sync', handleSync);
  }, []);

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
      color: 'text-blue-600 dark:text-emerald-400',
      bgColor: 'bg-blue-500/15 dark:bg-emerald-500/20',
      borderColor: 'hover:border-blue-500/40 dark:hover:border-emerald-500/40',
      trend: t('dashboard.activeStudentsTrend', 'Faol o‘quvchilar'),
      trendUp: true,
      onClick: () => navigate('/owner/users?role=student'),
    },
    {
      title: t('dashboard.totalTeachers', "Jami o'qituvchilar"),
      value: stats.totalTeachers,
      icon: Users,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500/15 dark:bg-amber-500/20',
      borderColor: 'hover:border-amber-500/40',
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
      color: 'text-blue-600 dark:text-emerald-400',
      bgColor: 'bg-blue-500/15 dark:bg-emerald-500/20',
      borderColor: 'hover:border-blue-500/40 dark:hover:border-emerald-500/40',
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
      {/* Top Welcome Banner with Rich Blue Gradient in Light Mode, Emerald in Dark Mode */}
      <div className="dashboard-banner select-none flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#123D78] via-[#1b4b8a] to-[#2563EB] dark:from-[#072228] dark:via-[#092e27] dark:to-[#04241b] text-white shadow-xl relative overflow-hidden border border-blue-400/20 dark:border-emerald-500/35">
        {/* Subtle decorative circles */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-56 h-56 bg-white/10 dark:bg-emerald-400/15 rounded-full pointer-events-none blur-3xl" />
        <div className="absolute right-40 bottom-0 -mb-10 w-36 h-36 bg-sky-400/10 dark:teal-400/10 rounded-full pointer-events-none blur-2xl" />

        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 dark:bg-emerald-500/20 text-white/95 dark:text-emerald-200 border border-white/20 dark:border-emerald-400/40 backdrop-blur-md text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-200 dark:text-emerald-300" />
            <span>{t('dashboard.ownerPortal', 'Boshliq boshqaruv portali')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t('dashboard.welcome', { name: userName, defaultValue: `Xush kelibsiz, ${userName}` })}
          </h1>
          <p className="text-sm text-blue-100 dark:text-emerald-100/90 max-w-xl">
            {t('dashboard.ownerBannerSubtitle', "O'quvchilar, kurslar, dars jadvallari va o'quv markazi samaradorligining kunlik hisoboti.")}
          </p>
        </div>

        {/* Action buttons */}
        <div className="relative z-10 flex items-center gap-3">
          <button
            type="button"
            onClick={() => loadDashboardData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 dark:bg-emerald-500/20 dark:hover:bg-emerald-500/30 text-white dark:text-emerald-100 backdrop-blur text-sm font-medium transition-colors border border-white/15 dark:border-emerald-400/30 disabled:opacity-50 shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">
              {refreshing ? t('common.refreshing', 'Yangilanmoqda...') : t('common.refresh', 'Yangilash')}
            </span>
          </button>
          <Button
            onClick={() => navigate('/owner/attendance')}
            variant="primary"
            size="md"
            icon={ClipboardCheck}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white shadow-lg font-bold"
          >
            {t('nav.attendance', 'Davomat')}
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

      {/* Quick Action Buttons Row (Colorful and welcoming) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mr-2 shrink-0">
          {t('dashboard.quickActions', 'Tezkor amallar')}:
        </span>
        <button
          type="button"
          onClick={() => navigate('/owner/users?role=student')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-500/15 text-blue-700 dark:bg-emerald-500/15 dark:text-emerald-300 border border-blue-500/30 dark:border-emerald-500/30 hover:bg-blue-500/25 dark:hover:bg-emerald-500/25 transition-all shadow-xs shrink-0 cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5 text-blue-600 dark:text-emerald-400" />
          <span>{t('users.createStudent', "Yangi o'quvchi qo'shish")}</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/owner/users?role=teacher')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-all shadow-xs shrink-0 cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>{t('users.createTeacher', "O'qituvchi qo'shish")}</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/owner/groups')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 hover:bg-teal-500/25 transition-all shadow-xs shrink-0 cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span>{t('groups.createGroup', 'Guruh yaratish')}</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/owner/courses')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30 hover:bg-sky-500/25 transition-all shadow-xs shrink-0 cursor-pointer"
        >
          <BookOpen className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          <span>{t('nav.courses', 'Kurslar')}</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/owner/reports')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 hover:bg-purple-500/25 transition-all shadow-xs shrink-0 cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span>{t('reports.title', 'Hisobotlar')}</span>
        </button>
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
                <div className="flex items-center gap-1.5 mt-2 text-[11px] text-blue-600 dark:text-emerald-400 font-medium leading-tight">
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
                className="text-xs text-blue-600 dark:text-emerald-400 hover:text-blue-700 dark:hover:text-emerald-300 font-semibold"
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

        {/* Weekly Attendance Overview Bar Chart Placeholder (1 col) */}
        <div>
          <Card
            title={t('dashboard.attendanceOverview', 'Davomat ko‘rsatkichlari')}
            subtitle={t('dashboard.attendanceSubtitle', 'Barcha guruhlar bo‘yicha haftalik davomat')}
            headerAction={
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/15 text-blue-700 dark:bg-emerald-500/15 dark:text-emerald-300 border border-blue-500/30 dark:border-emerald-500/30 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-emerald-500 animate-pulse" />
                92.6% A'lo
              </span>
            }
          >
            <div className="space-y-4">
              <div className="h-44 flex items-end justify-between gap-2 pt-6 px-2">
                {attendanceChart.map((bar, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                    <span className="text-[10px] font-bold text-blue-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {bar.rate}%
                    </span>
                    <div className="w-full bg-gray-100 dark:bg-surface-dark-tertiary rounded-t-lg h-32 relative overflow-hidden flex items-end">
                      <div
                        className="w-full rounded-t-md transition-all duration-500 group-hover:brightness-110 relative flex flex-col justify-start shadow-md shadow-emerald-500/20"
                        style={{
                          height: `${bar.rate}%`,
                          background: ATTENDANCE_BAR_GRADIENT,
                        }}
                      >
                        {/* Bright top cap highlight (glowing light green) */}
                        <div className="h-1 w-full bg-emerald-200 dark:bg-emerald-300 rounded-t-md opacity-90 shadow-sm" />
                      </div>
                    </div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                      {bar.day}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1.5 font-medium text-blue-700 dark:text-emerald-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-emerald-500 shadow-sm" />
                  {t('dashboard.targetRate', 'Maqsad: 90%+')}
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {t('dashboard.avgRate', 'O‘rtacha ko‘rsatkich:')}{' '}
                  {attendanceChart.length > 0
                    ? (
                        attendanceChart.reduce((acc, curr) => acc + Number(curr.rate || 0), 0) /
                        attendanceChart.length
                      ).toFixed(1)
                    : '92.6'}
                  %
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
                  className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 dark:border-gray-800/80 bg-gray-50/50 dark:bg-surface-dark-tertiary/20 hover:border-blue-500/20 dark:hover:border-emerald-500/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/15 dark:bg-emerald-500/20 text-blue-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
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
