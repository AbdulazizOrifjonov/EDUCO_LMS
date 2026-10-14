import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  Calendar,
  Users,
  Download,
  Filter,
  CheckCircle,
  Clock,
  Award,
  BookOpen,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button, Card, Badge, Input, EmptyState, LoadingSpinner } from '@/components/ui';
import {
  generateAttendanceReport,
  generateGradeReport,
  generateTeacherReport,
  generateStudentProgressReport,
  exportToCSV,
} from '@/services/reportService';
import { formatDate } from '@/utils/csvExport';

export default function ReportsPage() {
  const { t } = useTranslation();

  // Selected report type
  const [reportType, setReportType] = useState('attendance'); // 'attendance' | 'grades' | 'teachers' | 'progress'

  // Filter criteria
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('ALL');
  const [selectedTeacherId, setSelectedTeacherId] = useState('ALL');
  const [selectedStudentId, setSelectedStudentId] = useState('ALL');

  // Filter options loaded from Supabase
  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);

  // Results state
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Load dropdown lists on mount
  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const [groupsRes, teachersRes, studentsRes] = await Promise.all([
          supabase.from('groups').select('id, name').order('name'),
          supabase.from('profiles').select('id, full_name, email').in('role', ['teacher', 'admin']).order('full_name'),
          supabase.from('profiles').select('id, full_name, email').eq('role', 'student').order('full_name'),
        ]);

        if (groupsRes.data) setGroups(groupsRes.data);
        if (teachersRes.data) setTeachers(teachersRes.data);
        if (studentsRes.data) setStudents(studentsRes.data);
      } catch (err) {
        console.error('Error fetching filter options:', err);
      }
    }

    loadFilterOptions();
  }, []);

  // Generate Report
  const handleGenerate = async () => {
    try {
      setLoading(true);
      setHasGenerated(true);

      const filters = {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        groupId: selectedGroupId !== 'ALL' ? selectedGroupId : undefined,
        teacherId: selectedTeacherId !== 'ALL' ? selectedTeacherId : undefined,
        studentId: selectedStudentId !== 'ALL' ? selectedStudentId : undefined,
      };

      let results = [];
      if (reportType === 'attendance') {
        results = await generateAttendanceReport(filters);
      } else if (reportType === 'grades') {
        results = await generateGradeReport(filters);
      } else if (reportType === 'teachers') {
        results = await generateTeacherReport(filters);
      } else if (reportType === 'progress') {
        results = await generateStudentProgressReport(filters);
      }

      setReportData(results);
    } catch (err) {
      console.error('Error generating report:', err);
    } finally {
      setLoading(false);
    }
  };

  // Export to CSV
  const handleExport = () => {
    if (!reportData || reportData.length === 0) return;

    let columns = [];
    if (reportType === 'attendance') {
      columns = [
        { key: 'date', label: 'Date' },
        { key: 'studentName', label: 'Student' },
        { key: 'studentEmail', label: 'Email' },
        { key: 'groupName', label: 'Group' },
        { key: 'teacherName', label: 'Teacher' },
        { key: 'status', label: 'Attendance Status' },
        { key: 'notes', label: 'Notes' },
      ];
    } else if (reportType === 'grades') {
      columns = [
        { key: 'date', label: 'Date' },
        { key: 'studentName', label: 'Student' },
        { key: 'groupName', label: 'Group' },
        { key: 'assessmentType', label: 'Assessment' },
        { key: 'score', label: 'Score' },
        { key: 'maxScore', label: 'Max Score' },
        { key: 'percentage', label: 'Percentage' },
      ];
    } else if (reportType === 'teachers') {
      columns = [
        { key: 'teacherName', label: 'Teacher' },
        { key: 'email', label: 'Email' },
        { key: 'assignedGroupsCount', label: 'Assigned Groups' },
        { key: 'totalStudents', label: 'Students' },
        { key: 'totalLessonsTaught', label: 'Lessons Taught' },
        { key: 'weeklyHours', label: 'Est Weekly Hours' },
      ];
    } else if (reportType === 'progress') {
      columns = [
        { key: 'studentName', label: 'Student' },
        { key: 'studentEmail', label: 'Email' },
        { key: 'attendedClasses', label: 'Classes Attended' },
        { key: 'totalClasses', label: 'Total Classes' },
        { key: 'attendanceRate', label: 'Attendance Rate' },
        { key: 'averageGrade', label: 'Avg Grade' },
        { key: 'performanceStatus', label: 'Performance Status' },
      ];
    }

    exportToCSV(columns, reportData, `${reportType}_report.csv`);
  };

  const reportTypes = [
    {
      id: 'attendance',
      name: t('reports.attendanceType'),
      description: t('reports.attendanceDesc'),
      icon: Clock,
      color: 'text-blue-500',
    },
    {
      id: 'grades',
      name: t('reports.gradesType'),
      description: t('reports.gradesDesc'),
      icon: Award,
      color: 'text-amber-500',
    },
    {
      id: 'teachers',
      name: t('reports.teachersType'),
      description: t('reports.teachersDesc'),
      icon: Users,
      color: 'text-emerald-500',
    },
    {
      id: 'progress',
      name: t('reports.progressType'),
      description: t('reports.progressDesc'),
      icon: TrendingUp,
      color: 'text-purple-500',
    },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t('reports.hubTitle')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {t('reports.hubSubtitle')}
          </p>
        </div>

        {reportData.length > 0 && (
          <Button
            variant="outline"
            icon={Download}
            onClick={handleExport}
          >
            {t('common.export')}
          </Button>
        )}
      </div>

      {/* Report Type Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = reportType === type.id;
          return (
            <div
              key={type.id}
              onClick={() => {
                setReportType(type.id);
                setHasGenerated(false);
                setReportData([]);
              }}
              className={`
                p-5 rounded-xl border cursor-pointer transition-all duration-150
                ${
                  isSelected
                    ? 'border-brand-navy dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm ring-1 ring-brand-navy dark:ring-blue-500'
                    : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark-secondary hover:border-gray-300 dark:hover:border-gray-700'
                }
              `}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg bg-gray-100 dark:bg-surface-dark-tertiary ${type.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                {isSelected && (
                  <Badge variant="primary" size="sm">{t('common.active')}</Badge>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                {type.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {type.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Filter Toolbar */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div>
            <Input
              type="date"
              label={t('reports.from')}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div>
            <Input
              type="date"
              label={t('reports.to')}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 block mb-1.5">
              {t('reports.groupFilter')}
            </label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary px-3.5 py-2 text-sm text-gray-900 dark:text-gray-100"
            >
              <option value="ALL">{t('reports.allGroups')}</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 block mb-1.5">
              {t('reports.teacherFilter')}
            </label>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary px-3.5 py-2 text-sm text-gray-900 dark:text-gray-100"
            >
              <option value="ALL">{t('reports.allTeachers')}</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Button
              variant="primary"
              fullWidth
              icon={BarChart3}
              isLoading={loading}
              onClick={handleGenerate}
            >
              {t('reports.generate')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Report Data Results */}
      <Card noPadding>
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 capitalize">
              {t('reports.resultsTitle', { type: reportTypes.find(r => r.id === reportType)?.name || reportType })}
            </h3>
            {hasGenerated && (
              <Badge variant="secondary" size="sm">
                {t('reports.recordsCount', { count: reportData.length })}
              </Badge>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-gray-500">
              <LoadingSpinner size="lg" />
              <p className="mt-2 text-xs">{t('reports.compilingStats')}</p>
            </div>
          ) : !hasGenerated ? (
            <div className="py-12">
              <EmptyState
                icon={BarChart3}
                title={t('reports.readyToGenerate')}
                description={t('reports.readyToGenerateDesc')}
              />
            </div>
          ) : reportData.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={Filter}
                title={t('reports.noMatchingRecords')}
                description={t('reports.noMatchingRecordsDesc')}
              />
            </div>
          ) : (
            <table className="w-full text-left rtl:text-right text-sm">
              {/* ATTENDANCE TABLE */}
              {reportType === 'attendance' && (
                <>
                  <thead className="bg-gray-50 dark:bg-surface-dark-tertiary text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                    <tr>
                      <th className="px-6 py-3.5">{t('common.date')}</th>
                      <th className="px-6 py-3.5">{t('reports.student')}</th>
                      <th className="px-6 py-3.5">{t('reports.group')}</th>
                      <th className="px-6 py-3.5">{t('reports.teacher')}</th>
                      <th className="px-6 py-3.5">{t('common.status')}</th>
                      <th className="px-6 py-3.5">{t('common.notes')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-surface-dark-secondary">
                    {reportData.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50/50 dark:hover:bg-surface-dark-tertiary/50">
                        <td className="px-6 py-4 font-mono text-xs">{formatDate(row.date)}</td>
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{row.studentName}</td>
                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{row.groupName}</td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{row.teacherName}</td>
                        <td className="px-6 py-4">
                          <Badge variant={row.status === 'present' ? 'success' : row.status === 'late' ? 'warning' : 'danger'}>
                            {row.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">{row.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {/* GRADES TABLE */}
              {reportType === 'grades' && (
                <>
                  <thead className="bg-gray-50 dark:bg-surface-dark-tertiary text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                    <tr>
                      <th className="px-6 py-3.5">{t('common.date')}</th>
                      <th className="px-6 py-3.5">{t('reports.student')}</th>
                      <th className="px-6 py-3.5">{t('reports.group')}</th>
                      <th className="px-6 py-3.5">{t('reports.assessmentType')}</th>
                      <th className="px-6 py-3.5">{t('reports.score')}</th>
                      <th className="px-6 py-3.5">{t('reports.percentage')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-surface-dark-secondary">
                    {reportData.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50/50 dark:hover:bg-surface-dark-tertiary/50">
                        <td className="px-6 py-4 font-mono text-xs">{row.date}</td>
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{row.studentName}</td>
                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{row.groupName}</td>
                        <td className="px-6 py-4 capitalize">{row.assessmentType}</td>
                        <td className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">
                          {row.score} / {row.maxScore}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="primary">{row.percentage}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {/* TEACHERS TABLE */}
              {reportType === 'teachers' && (
                <>
                  <thead className="bg-gray-50 dark:bg-surface-dark-tertiary text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                    <tr>
                      <th className="px-6 py-3.5">{t('reports.instructorName')}</th>
                      <th className="px-6 py-3.5">{t('common.email')}</th>
                      <th className="px-6 py-3.5">{t('reports.assignedGroups')}</th>
                      <th className="px-6 py-3.5">{t('reports.activeGroups')}</th>
                      <th className="px-6 py-3.5">{t('reports.totalEnrolled')}</th>
                      <th className="px-6 py-3.5">{t('reports.estWeeklyHours')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-surface-dark-secondary">
                    {reportData.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50/50 dark:hover:bg-surface-dark-tertiary/50">
                        <td className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">{row.teacherName}</td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-xs">{row.email}</td>
                        <td className="px-6 py-4">{row.assignedGroupsCount}</td>
                        <td className="px-6 py-4 font-medium text-brand-navy dark:text-blue-400">{row.activeGroupsCount}</td>
                        <td className="px-6 py-4">{row.totalStudents} {t('groups.students')}</td>
                        <td className="px-6 py-4 font-mono font-medium">{row.weeklyHours} hrs</td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {/* STUDENT PROGRESS TABLE */}
              {reportType === 'progress' && (
                <>
                  <thead className="bg-gray-50 dark:bg-surface-dark-tertiary text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                    <tr>
                      <th className="px-6 py-3.5">{t('reports.student')}</th>
                      <th className="px-6 py-3.5">{t('common.email')}</th>
                      <th className="px-6 py-3.5">{t('reports.classesAttended')}</th>
                      <th className="px-6 py-3.5">{t('reports.attendanceRate')}</th>
                      <th className="px-6 py-3.5">{t('reports.averageGrade')}</th>
                      <th className="px-6 py-3.5">{t('common.status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-surface-dark-secondary">
                    {reportData.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50/50 dark:hover:bg-surface-dark-tertiary/50">
                        <td className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">{row.studentName}</td>
                        <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">{row.studentEmail}</td>
                        <td className="px-6 py-4">{row.attendedClasses} / {row.totalClasses}</td>
                        <td className="px-6 py-4 font-medium">{row.attendanceRate}</td>
                        <td className="px-6 py-4 font-bold text-brand-navy dark:text-blue-400">{row.averageGrade}</td>
                        <td className="px-6 py-4">
                          <Badge variant={row.performanceStatus === 'Excellent' ? 'success' : row.performanceStatus === 'Satisfactory' ? 'primary' : 'warning'}>
                            {row.performanceStatus}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
