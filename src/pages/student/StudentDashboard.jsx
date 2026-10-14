import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  GraduationCap,
  Calendar,
  Clock,
  Award,
  CheckCircle2,
  BookOpen,
  FileText,
  Bell,
  Sparkles,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  UserCheck,
  TrendingUp,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import dashboardService from '@/services/dashboardService';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';

export default function StudentDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [studentData, setStudentData] = useState({
    currentGroup: null,
    grades: [],
    attendanceSummary: {
      total: 0,
      present: 0,
      late: 0,
      absent: 0,
      excused: 0,
      presentPercent: 100,
      latePercent: 0,
      absentPercent: 0,
      rate: 100,
    },
    homeworkDeadlines: [],
    announcements: [],
  });

  const [todaySchedule, setTodaySchedule] = useState([]);

  const studentName =
    profile?.first_name ||
    profile?.full_name ||
    user?.user_metadata?.first_name ||
    user?.email?.split('@')[0] ||
    'Student';

  const loadData = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const studentId = user?.id;

      const [statsRes, lessonsRes] = await Promise.all([
        dashboardService.getStudentStats(studentId),
        dashboardService.getTodayLessons(studentId, 'student'),
      ]);

      setStudentData(statsRes);
      setTodaySchedule(lessonsRes);
    } catch (err) {
      console.error('Student dashboard error:', err);
      setError(err.message || 'Failed to load your student dashboard');
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

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Loading student portal..." />
      </div>
    );
  }

  const { currentGroup, grades, attendanceSummary, homeworkDeadlines, announcements } = studentData;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-brand-navy via-brand-navy-light to-blue-900 text-white shadow-xl relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur text-xs font-semibold uppercase tracking-wider text-white/90 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{t('dashboard.studentLearningSpace', 'Student Learning Space')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t('dashboard.welcome', { name: studentName, defaultValue: `Welcome back, ${studentName}` })}
          </h1>
          <p className="text-sm text-blue-100/80 max-w-xl">
            {currentGroup
              ? `You are enrolled in ${currentGroup.name} (${currentGroup.courseName}). Keep up the great work!`
              : 'Review your upcoming homework, view daily classes, and track your learning progress.'}
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
            onClick={() => navigate('/student/homework')}
            variant="danger"
            size="md"
            icon={FileText}
            className="bg-brand-red hover:bg-brand-red-dark text-white shadow-md"
          >
            {t('dashboard.myHomework', 'My Homework')}
          </Button>
        </div>
      </div>

      {/* Error Alert */}
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

      {/* Current Group Info Card & Attendance Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Group Banner Card */}
        <Card className="p-6 flex flex-col justify-between border-l-4 border-l-brand-navy">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t('dashboard.currentGroup', 'Current Group')}
              </span>
              <Badge variant="primary" size="sm">
                {t('dashboard.activeCohort', 'Active Cohort')}
              </Badge>
            </div>
            {currentGroup ? (
              <>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {currentGroup.name}
                </h3>
                <p className="text-sm font-medium text-brand-navy dark:text-blue-400 mt-1">
                  {currentGroup.courseName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Classroom: <span className="font-semibold text-gray-700 dark:text-gray-300">{currentGroup.room || 'Room 101'}</span>
                </p>
              </>
            ) : (
              <div className="py-2">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Not Enrolled in an Active Group
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Contact center administration to complete cohort assignment.
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <Button
              onClick={() => navigate('/student/materials')}
              variant="outline"
              size="sm"
              icon={BookOpen}
              className="text-xs"
            >
              {t('dashboard.studyMaterials', 'Study Materials')}
            </Button>
            <Button
              onClick={() => navigate('/student/chat')}
              variant="ghost"
              size="sm"
              className="text-xs text-brand-navy dark:text-blue-400"
            >
              {t('dashboard.classChat', 'Class Chat →')}
            </Button>
          </div>
        </Card>

        {/* Attendance Summary (present/late/absent percentages) */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {t('dashboard.myAttendance', 'Attendance Summary')}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Total attendance track: {attendanceSummary.total} sessions recorded
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-brand-navy dark:text-blue-400">
                {attendanceSummary.rate}%
              </span>
              <span className="block text-[11px] text-gray-400 dark:text-gray-500 font-medium uppercase">
                {t('dashboard.overallRate', 'Overall Rate')}
              </span>
            </div>
          </div>

          {/* Visual Percentage Progress Stack */}
          <div className="w-full h-3 rounded-full bg-gray-100 dark:bg-surface-dark-tertiary overflow-hidden flex mb-5">
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{ width: `${attendanceSummary.presentPercent}%` }}
              title={`Present: ${attendanceSummary.presentPercent}%`}
            />
            <div
              className="bg-amber-400 h-full transition-all duration-300"
              style={{ width: `${attendanceSummary.latePercent}%` }}
              title={`Late: ${attendanceSummary.latePercent}%`}
            />
            <div
              className="bg-brand-red h-full transition-all duration-300"
              style={{ width: `${attendanceSummary.absentPercent}%` }}
              title={`Absent: ${attendanceSummary.absentPercent}%`}
            />
          </div>

          {/* Breakdown stat pills */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40">
              <span className="text-[11px] font-semibold uppercase text-emerald-800 dark:text-emerald-300 block">
                {t('attendance.present', 'Present')}
              </span>
              <span className="text-lg font-bold text-emerald-900 dark:text-emerald-200">
                {attendanceSummary.present} <span className="text-xs font-normal opacity-80">({attendanceSummary.presentPercent}%)</span>
              </span>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/40">
              <span className="text-[11px] font-semibold uppercase text-amber-800 dark:text-amber-300 block">
                {t('attendance.late', 'Late')}
              </span>
              <span className="text-lg font-bold text-amber-900 dark:text-amber-200">
                {attendanceSummary.late} <span className="text-xs font-normal opacity-80">({attendanceSummary.latePercent}%)</span>
              </span>
            </div>

            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/40">
              <span className="text-[11px] font-semibold uppercase text-brand-red dark:text-red-300 block">
                {t('attendance.absent', 'Absent')}
              </span>
              <span className="text-lg font-bold text-brand-red dark:text-red-200">
                {attendanceSummary.absent} <span className="text-xs font-normal opacity-80">({attendanceSummary.absentPercent}%)</span>
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Grid: Today's Schedule & Recent Grades */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card
            title={t('dashboard.todayLessons', "Today's Schedule")}
            subtitle={t('dashboard.todayTimelineSubtitle', 'Your timetable of classes for today')}
            headerAction={
              <Button
                onClick={() => navigate('/student/schedule')}
                variant="ghost"
                size="sm"
                className="text-xs text-brand-navy dark:text-blue-400"
              >
                {t('dashboard.mySchedule', 'Weekly Timetable')} &rarr;
              </Button>
            }
          >
            {todaySchedule.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title={t('dashboard.noLessonsToday', 'No classes scheduled today')}
                description={t('dashboard.noLessonsDesc', 'Enjoy your study break or work on upcoming assignments.')}
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
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                          {lesson.title}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {lesson.courseName} &bull; Room {lesson.room}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-semibold text-gray-900 dark:text-white block">
                        {lesson.startTime} - {lesson.endTime}
                      </span>
                      <Badge variant="primary" size="sm" className="mt-1">
                        {t('common.active', 'Scheduled')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Grades (1-5 with visual bars) */}
          <Card
            title={t('dashboard.myGrades', 'Recent Grades')}
            subtitle="Scores assigned on the standard 1 - 5 academic scale"
            headerAction={
              <Button
                onClick={() => navigate('/student/grades')}
                variant="ghost"
                size="sm"
                className="text-xs text-brand-navy dark:text-blue-400"
              >
                {t('common.viewAll', 'View All')} &rarr;
              </Button>
            }
          >
            {grades.length === 0 ? (
              <EmptyState
                icon={Award}
                title={t('grades.noStudentGrades', 'No grades posted yet')}
                description="Evaluation scores from your teacher will show up here."
              />
            ) : (
              <div className="space-y-4">
                {grades.map((g) => {
                  const score = Number(g.score);
                  // 1-5 scale percentage: score / 5 * 100
                  const percentage = Math.min(100, Math.max(20, (score / 5) * 100));
                  const scoreColor =
                    score >= 4.5
                      ? 'bg-emerald-500 text-emerald-700'
                      : score >= 3.5
                      ? 'bg-blue-500 text-blue-700'
                      : score >= 2.5
                      ? 'bg-amber-500 text-amber-700'
                      : 'bg-brand-red text-red-700';

                  return (
                    <div
                      key={g.id}
                      className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-surface-dark-tertiary/20"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div>
                          <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                            {g.lessonTitle}
                          </h4>
                          <span className="text-[11px] text-gray-400 dark:text-gray-500">
                            {g.date ? new Date(g.date).toLocaleDateString() : ''}
                          </span>
                        </div>
                        <span className="text-sm font-black text-gray-900 dark:text-white">
                          {score} / 5.0
                        </span>
                      </div>

                      {/* Visual Bar (1-5) */}
                      <div className="w-full bg-gray-200 dark:bg-surface-dark-tertiary h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            score >= 4.5
                              ? 'bg-emerald-500'
                              : score >= 3.5
                              ? 'bg-brand-navy dark:bg-blue-500'
                              : score >= 2.5
                              ? 'bg-amber-500'
                              : 'bg-brand-red'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      {g.feedback && (
                        <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-2 italic bg-white dark:bg-surface-dark-secondary p-2 rounded-lg">
                          &ldquo;{g.feedback}&rdquo;
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Upcoming Homework Deadlines & Announcements */}
        <div className="space-y-6">
          {/* Upcoming Homework Deadlines */}
          <Card
            title={t('homework.title', 'Upcoming Deadlines')}
            subtitle="Assignments due soon"
            headerAction={
              <Button
                onClick={() => navigate('/student/homework')}
                variant="ghost"
                size="sm"
                className="text-xs text-brand-navy dark:text-blue-400"
              >
                {t('nav.homework', 'All Homework')} &rarr;
              </Button>
            }
          >
            {homeworkDeadlines.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title={t('homework.noHomework', 'No pending homework')}
                description="You are completely caught up on your assignments!"
              />
            ) : (
              <div className="space-y-3">
                {homeworkDeadlines.map((hw) => (
                  <div
                    key={hw.id}
                    className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-surface-dark-tertiary/20"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                        {hw.title}
                      </h4>
                      <Badge variant="warning" size="sm">
                        Due {new Date(hw.due_date).toLocaleDateString()}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                      {hw.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Announcements */}
          <Card
            title={t('nav.announcements', 'Center Announcements')}
            subtitle="Important updates from the EDUCO team"
          >
            {announcements.length === 0 ? (
              <EmptyState
                icon={Bell}
                title={t('common.noData', 'No announcements')}
                description="New announcements from staff will appear here."
              />
            ) : (
              <div className="space-y-3">
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-surface-dark-tertiary/20"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-gray-900 dark:text-white">
                        {ann.title}
                      </span>
                      {ann.isPinned && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-brand-navy font-semibold">
                          Pinned
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-600 dark:text-gray-300 line-clamp-3">
                      {ann.content}
                    </p>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 block">
                      By {ann.author} &bull; {new Date(ann.date).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
