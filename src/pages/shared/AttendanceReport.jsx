import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileSpreadsheet,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  HelpCircle,
  XCircle,
  TrendingUp,
  Users,
  GraduationCap,
  Calendar,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Table from '@/components/ui/Table';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Select from '@/components/ui/Select';
import { toast } from '@/components/ui/Toast';
import { getAttendanceReport } from '@/services/attendanceService';
import { getGroups } from '@/services/groupService';
import { getStudents } from '@/services/userService';

export default function AttendanceReport() {
  const { t } = useTranslation();

  const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(oneMonthAgo);
  const [endDate, setEndDate] = useState(today);
  const [groupId, setGroupId] = useState('all');
  const [studentId, setStudentId] = useState('all');

  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [report, setReport] = useState({ records: [], stats: { total: 0, present: 0, absent: 0, late: 0, excused: 0, rate: 0 } });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [gRes, sRes] = await Promise.all([
          getGroups({ limit: 100 }),
          getStudents(),
        ]);
        setGroups(gRes.groups || []);
        setStudents(sRes || []);
      } catch (err) {
        console.warn(err);
      }
    };
    loadOptions();
  }, []);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAttendanceReport({
        startDate,
        endDate,
        groupId,
        studentId,
      });
      setReport(data);
    } catch (err) {
      console.error(err);
      toast.error(t('attendance.reportError', 'Failed to generate attendance report'));
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, groupId, studentId, t]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleExportCSV = () => {
    const records = report?.records || [];
    if (!records.length) {
      toast.warning(t('common.noData', 'No records to export'));
      return;
    }

    const headers = ['Date', 'Student', 'Cohort/Group', 'Status', 'Remark'];
    const rows = records.map((r) => [
      `"${r.lessons?.lesson_date || ''}"`,
      `"${r.profiles?.first_name || ''} ${r.profiles?.last_name || ''}"`,
      `"${r.lessons?.groups?.name || ''}"`,
      `"${r.status || ''}"`,
      `"${r.remark || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance_report_${startDate}_to_${endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(t('attendance.reportExported', 'Report exported to CSV'));
  };

  const statusBadgeMap = {
    present: 'success',
    late: 'warning',
    excused: 'info',
    absent: 'danger',
  };

  const columns = [
    {
      header: t('common.date', 'Date'),
      key: 'date',
      render: (row) => (
        <span className="font-semibold text-xs text-gray-900 dark:text-gray-100">
          {row.lessons?.lesson_date || '—'}
        </span>
      ),
    },
    {
      header: t('users.student', 'Student'),
      key: 'student',
      render: (row) => (
        <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
          {row.profiles?.first_name} {row.profiles?.last_name}
        </span>
      ),
    },
    {
      header: t('groups.group', 'Cohort Group'),
      key: 'group',
      render: (row) => (
        <span className="text-xs text-gray-500">{row.lessons?.groups?.name || '—'}</span>
      ),
    },
    {
      header: t('common.status', 'Attendance Status'),
      key: 'status',
      render: (row) => (
        <Badge variant={statusBadgeMap[row.status] || 'default'} size="sm">
          <span className="capitalize">{row.status}</span>
        </Badge>
      ),
    },
    {
      header: t('attendance.remark', 'Remark / Reason'),
      key: 'remark',
      render: (row) => (
        <span className="text-xs text-gray-500 italic">{row.remark || 'None'}</span>
      ),
    },
  ];

  const stats = report?.stats || { total: 0, rate: 0, present: 0, late: 0, excused: 0, absent: 0 };
  const records = report?.records || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2.5">
            <FileSpreadsheet className="w-7 h-7 text-brand-navy dark:text-blue-400" />
            {t('attendance.reportTitle', 'Attendance Analytics & Reports')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('attendance.reportSubtitle', 'Comprehensive historical compliance, absentee rates, and cohort metrics')}
          </p>
        </div>

        <Button
          variant="outline"
          size="md"
          icon={Download}
          onClick={handleExportCSV}
          disabled={records.length === 0}
        >
          {t('common.export', 'Export to CSV')}
        </Button>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="text-center">
          <p className="text-xs text-gray-500 uppercase font-semibold">Total Checks</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats.total}</p>
        </Card>

        <Card className="text-center">
          <p className="text-xs text-emerald-600 uppercase font-semibold flex items-center justify-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Rate
          </p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.rate}%
          </p>
        </Card>

        <Card className="text-center">
          <p className="text-xs text-emerald-700 uppercase font-semibold">Present</p>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">{stats.present}</p>
        </Card>

        <Card className="text-center">
          <p className="text-xs text-amber-600 uppercase font-semibold">Late</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.late}</p>
        </Card>

        <Card className="text-center">
          <p className="text-xs text-blue-600 uppercase font-semibold">Excused</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.excused}</p>
        </Card>

        <Card className="text-center">
          <p className="text-xs text-brand-red uppercase font-semibold">Absent</p>
          <p className="text-2xl font-bold text-brand-red mt-1">{stats.absent}</p>
        </Card>
      </div>

      {/* Filter Controls */}
      <Card noPadding>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-semibold uppercase text-gray-700 dark:text-gray-300 block mb-1">
              {t('common.startDate', 'Start Date')}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-navy"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase text-gray-700 dark:text-gray-300 block mb-1">
              {t('common.endDate', 'End Date')}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-navy"
            />
          </div>

          <Select
            label={t('groups.group', 'O‘quv guruhi')}
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            placeholder={t('groups.allGroups', 'Barcha guruhlar')}
            headerTitle={t('groups.title', 'Guruh tanlang')}
            icon={Users}
            size="sm"
            options={[
              { value: 'all', label: t('groups.allGroups', 'Barcha guruhlar') },
              ...groups.map((g) => ({
                value: g.id,
                label: g.name,
                subtitle: g.courseName || 'Kurs fani',
                color: g.courseColor || '#123D78',
              })),
            ]}
          />

          <Select
            label={t('users.student', 'Talaba')}
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder={t('users.allStudents', 'Barcha talabalar')}
            headerTitle={t('users.students', 'Talabalar ro‘yxati')}
            icon={GraduationCap}
            size="sm"
            options={[
              { value: 'all', label: t('users.allStudents', 'Barcha talabalar') },
              ...students.map((st) => ({
                value: st.id,
                label: st.fullName,
                subtitle: st.phone || 'Talaba',
                color: '#10b981',
              })),
            ]}
          />
        </div>

        {/* Mobile View: Clean responsive cards (no horizontal overflow) */}
        <div className="block md:hidden divide-y divide-gray-100 dark:divide-gray-800 p-2">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <LoadingSpinner size="md" />
              <p className="mt-2 text-xs">{t('common.loading', 'Yuklanmoqda...')}</p>
            </div>
          ) : !records || records.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <p className="text-sm">{t('attendance.noRecords', 'No attendance entries found for the selected date range.')}</p>
            </div>
          ) : (
            records.map((row, idx) => (
              <div key={row.id || idx} className="p-4 bg-white dark:bg-surface-dark-secondary rounded-xl mb-3 border border-gray-100 dark:border-gray-800 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    {row.lessons?.lesson_date || '—'}
                  </span>
                  <Badge variant={statusBadgeMap[row.status] || 'default'} size="sm">
                    <span className="capitalize">{row.status}</span>
                  </Badge>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {row.profiles?.first_name} {row.profiles?.last_name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {t('groups.group', 'Guruh')}: {row.lessons?.groups?.name || '—'}
                  </p>
                </div>
                {row.remark && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-surface-dark-tertiary p-2 rounded-lg italic">
                    {t('attendance.remark', 'Sabab')}: {row.remark}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Full Table */}
        <div className="hidden md:block">
          <Table
            columns={columns}
            data={records}
            isLoading={loading}
            emptyMessage={t('attendance.noRecords', 'No attendance entries found for the selected date range.')}
          />
        </div>
      </Card>
    </div>
  );
}
