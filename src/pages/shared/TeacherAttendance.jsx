import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  GraduationCap,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCcw,
  Search,
  Save,
  UserCheck,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { toast } from '@/components/ui/Toast';
import {
  getTeacherAttendance,
  saveTeacherAttendance,
  getLessons,
} from '@/services/attendanceService';
import { getTeachers } from '@/services/userService';
import { ROLES } from '@/lib/constants';

export default function TeacherAttendance() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const todayStr = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(todayStr);
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('all');
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check-in modal
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [teacherToRecord, setTeacherToRecord] = useState(null);
  const [formStatus, setFormStatus] = useState('present');
  const [formNotes, setFormNotes] = useState('');
  const [formLessonId, setFormLessonId] = useState('');
  const [availableLessons, setAvailableLessons] = useState([]);
  const [saving, setSaving] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTeacherAttendance({
        date,
        teacherId: selectedTeacherId,
      });
      setAttendanceRecords(data || []);
    } catch (err) {
      console.error(err);
      toast.error(t('attendance.fetchError', 'Failed to load teacher attendance'));
    } finally {
      setLoading(false);
    }
  }, [date, selectedTeacherId, t]);

  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const list = await getTeachers();
        setTeachers(list);
      } catch (err) {
        console.error(err);
      }
    };
    loadTeachers();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleOpenCheckIn = async (teacher) => {
    setTeacherToRecord(teacher);
    setFormStatus('present');
    setFormNotes('');
    try {
      const lessons = await getLessons({ date, teacherId: teacher?.id });
      setAvailableLessons(lessons);
      setFormLessonId(lessons[0]?.id || '');
      setIsCheckInOpen(true);
    } catch (err) {
      toast.error('Could not load teacher lessons for this date');
    }
  };

  const handleSaveCheckIn = async () => {
    if (!teacherToRecord) return;
    setSaving(true);
    try {
      await saveTeacherAttendance({
        lessonId: formLessonId || null,
        teacherId: teacherToRecord.id,
        status: formStatus,
        notes: formNotes,
        checkInTime: new Date().toISOString(),
      });
      toast.success(t('attendance.teacherRecorded', 'Teacher attendance logged successfully!'));
      setIsCheckInOpen(false);
      fetchRecords();
    } catch (err) {
      console.error(err);
      toast.error(t('common.error', 'Failed to log teacher attendance'));
    } finally {
      setSaving(false);
    }
  };

  const statusVariant = {
    present: 'success',
    late: 'warning',
    absent: 'danger',
    substitute: 'primary',
  };

  const columns = [
    {
      header: t('roles.teacher', 'Instructor'),
      key: 'teacher',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-navy/10 text-brand-navy dark:text-blue-300 flex items-center justify-center font-bold text-xs uppercase">
            {row.profiles?.first_name?.[0] || 'T'}
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {row.profiles?.first_name} {row.profiles?.last_name}
            </p>
            <p className="text-xs text-gray-500">@{row.profiles?.username}</p>
          </div>
        </div>
      ),
    },
    {
      header: t('schedule.lesson', 'Assigned Lesson / Group'),
      key: 'lesson',
      render: (row) => (
        <div>
          <p className="font-medium text-xs text-gray-900 dark:text-gray-100">
            {row.lessons?.title || 'Daily Campus Duty'}
          </p>
          {row.lessons?.groups && (
            <p className="text-[11px] text-gray-400">{row.lessons.groups.name}</p>
          )}
        </div>
      ),
    },
    {
      header: t('attendance.checkInTime', 'Check-In Timestamp'),
      key: 'checkIn',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          <span>
            {row.check_in_time
              ? new Date(row.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '—'}
          </span>
        </div>
      ),
    },
    {
      header: t('common.status', 'Status'),
      key: 'status',
      render: (row) => (
        <Badge variant={statusVariant[row.status] || 'default'} size="sm">
          <span className="capitalize">{row.status}</span>
        </Badge>
      ),
    },
    {
      header: t('common.notes', 'Notes'),
      key: 'notes',
      render: (row) => (
        <span className="text-xs text-gray-500 line-clamp-1">{row.notes || '—'}</span>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2.5">
            <GraduationCap className="w-7 h-7 text-brand-navy dark:text-blue-400" />
            {t('attendance.teacherAttendance', 'Faculty & Teacher Attendance')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('attendance.teacherSubtitle', 'Administrative tracking of instructor punctuality and duty check-ins')}
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={UserCheck}
          onClick={() => handleOpenCheckIn(teachers[0])}
          disabled={teachers.length === 0}
        >
          {t('attendance.logTeacher', 'Log Instructor Check-In')}
        </Button>
      </div>

      {/* Date & Filter */}
      <Card noPadding>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 block mb-1">
              {t('common.date', 'Log Date')}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-navy"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 block mb-1">
              {t('roles.teacher', 'Filter Teacher')}
            </label>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-navy"
            >
              <option value="all">{t('groups.allTeachers', 'All Teachers')}</option>
              {teachers.map((teach) => (
                <option key={teach.id} value={teach.id}>
                  {teach.fullName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Table
          columns={columns}
          data={attendanceRecords}
          isLoading={loading}
          emptyMessage={t('attendance.noTeacherLogs', 'No faculty check-ins recorded for this selected date.')}
        />
      </Card>

      {/* Check-In Modal */}
      <Modal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        title={t('attendance.logCheckIn', 'Record Faculty Check-In')}
        subtitle="Log attendance status, punctuality, and remarks for an instructor"
        size="md"
      >
        <div className="space-y-4">
          {/* Teacher Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              {t('roles.teacher', 'Instructor')}
            </label>
            <select
              value={teacherToRecord?.id || ''}
              onChange={(e) => {
                const found = teachers.find((t) => t.id === e.target.value);
                setTeacherToRecord(found);
              }}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-navy"
            >
              {teachers.map((teach) => (
                <option key={teach.id} value={teach.id}>
                  {teach.fullName} (@{teach.username})
                </option>
              ))}
            </select>
          </div>

          {/* Status Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              {t('common.status', 'Attendance Status')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['present', 'late', 'absent', 'substitute'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFormStatus(st)}
                  className={`
                    p-2 rounded-lg text-xs font-bold capitalize border transition-all
                    ${
                      formStatus === st
                        ? 'border-brand-navy bg-brand-navy text-white shadow-sm'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-surface-dark-tertiary text-gray-700 dark:text-gray-300'
                    }
                  `}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              {t('common.notes', 'Administrative Notes')}
            </label>
            <textarea
              rows={3}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="e.g. Arrived on time, covered substitute lecture in Hall B..."
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 text-sm p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-navy"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <Button variant="ghost" onClick={() => setIsCheckInOpen(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button variant="primary" isLoading={saving} onClick={handleSaveCheckIn}>
              {t('common.save', 'Save Log')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
