import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ClipboardCheck,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  HelpCircle,
  XCircle,
  Save,
  History,
  FileSpreadsheet,
  ChevronDown,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Table from '@/components/ui/Table';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from '@/components/ui/Toast';
import { getGroups, getGroupById } from '@/services/groupService';
import {
  getOrCreateLesson,
  getAttendanceForLesson,
  saveAttendanceRecords,
  getLessons,
} from '@/services/attendanceService';
import { ROLES, ATTENDANCE_STATUSES } from '@/lib/constants';

export default function AttendancePage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const isTeacher = profile?.role === ROLES.TEACHER;

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [currentLesson, setCurrentLesson] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({}); // { [studentId]: { status, remark } }
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [viewHistory, setViewHistory] = useState(false);

  // Load groups
  useEffect(() => {
    const loadGroups = async () => {
      try {
        const res = await getGroups({
          status: 'active',
          teacherId: isTeacher ? profile?.id : 'all',
          limit: 100,
        });
        const groupList = res.groups || [];
        setGroups(groupList);
        if (groupList.length > 0 && !selectedGroupId) {
          setSelectedGroupId(groupList[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadGroups();
  }, [isTeacher, profile]);

  // Load lesson and students when group or date changes
  const loadGroupAttendance = useCallback(async () => {
    if (!selectedGroupId || !selectedDate) return;
    setLoading(true);
    try {
      // 1. Get group details (roster)
      const groupData = await getGroupById(selectedGroupId);
      const enrolledStudents = groupData.students || [];
      setStudents(enrolledStudents);

      // 2. Find or create lesson for this date & group
      const lesson = await getOrCreateLesson({
        groupId: selectedGroupId,
        date: selectedDate,
        title: `${groupData.name} - ${selectedDate}`,
        createdBy: profile?.id,
      });
      setCurrentLesson(lesson);

      // 3. Get existing attendance for this lesson
      const existingAttendance = await getAttendanceForLesson(lesson.id);

      // 4. Map attendance by studentId
      const map = {};
      enrolledStudents.forEach((st) => {
        const found = existingAttendance.find((a) => a.student_id === st.id);
        map[st.id] = {
          status: found ? found.status : 'present', // default to present
          remark: found ? found.remark || '' : '',
        };
      });
      setAttendanceMap(map);
    } catch (err) {
      console.error(err);
      toast.error(t('attendance.loadError', 'Failed to load attendance roster'));
    } finally {
      setLoading(false);
    }
  }, [selectedGroupId, selectedDate, profile, t]);

  useEffect(() => {
    loadGroupAttendance();
  }, [loadGroupAttendance]);

  // Load historical lessons for this group
  const loadHistory = async () => {
    if (!selectedGroupId) return;
    try {
      const lessons = await getLessons({ groupId: selectedGroupId });
      setHistoryRecords(lessons);
      setViewHistory(!viewHistory);
    } catch (err) {
      toast.error(t('attendance.historyError', 'Failed to load attendance history'));
    }
  };

  const setStatus = (studentId, status) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const setRemark = (studentId, remark) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remark,
      },
    }));
  };

  const handleMarkAll = (status) => {
    setAttendanceMap((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((id) => {
        next[id] = { ...next[id], status };
      });
      return next;
    });
  };

  const handleSave = async () => {
    if (!currentLesson?.id) return;
    setSaving(true);
    try {
      const records = Object.entries(attendanceMap).map(([studentId, data]) => ({
        student_id: studentId,
        status: data.status,
        remark: data.remark,
      }));

      await saveAttendanceRecords(currentLesson.id, records, profile?.id);
      toast.success(t('attendance.saveSuccess', 'Attendance successfully saved!'));
    } catch (err) {
      console.error(err);
      toast.error(err.message || t('common.error', 'Failed to save attendance'));
    } finally {
      setSaving(false);
    }
  };

  const statusButtons = [
    {
      status: 'present',
      label: t('attendance.present', 'Present'),
      icon: CheckCircle2,
      activeClass: 'bg-emerald-600 text-white ring-2 ring-emerald-600',
      idleClass: 'hover:bg-emerald-50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    },
    {
      status: 'late',
      label: t('attendance.late', 'Late'),
      icon: Clock,
      activeClass: 'bg-amber-500 text-white ring-2 ring-amber-500',
      idleClass: 'hover:bg-amber-50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    },
    {
      status: 'excused',
      label: t('attendance.excused', 'Excused'),
      icon: HelpCircle,
      activeClass: 'bg-blue-600 text-white ring-2 ring-blue-600',
      idleClass: 'hover:bg-blue-50 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    },
    {
      status: 'absent',
      label: t('attendance.absent', 'Absent'),
      icon: XCircle,
      activeClass: 'bg-brand-red text-white ring-2 ring-brand-red',
      idleClass: 'hover:bg-red-50 text-brand-red border-red-200 dark:border-red-900',
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2.5">
            <ClipboardCheck className="w-7 h-7 text-brand-navy dark:text-blue-400" />
            {t('nav.attendance', 'Student Attendance')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('attendance.pageSubtitle', 'Record and verify daily classroom attendance and excused absences')}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="md"
            icon={History}
            onClick={loadHistory}
          >
            {viewHistory ? t('attendance.hideHistory', 'Hide History') : t('attendance.viewHistory', 'Historical Log')}
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={Save}
            isLoading={saving}
            disabled={loading || students.length === 0}
            onClick={handleSave}
          >
            {t('common.save', 'Save Attendance')}
          </Button>
        </div>
      </div>

      {/* Date & Group Control Bar */}
      <Card noPadding>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-center">
          {/* Date Picker */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 block mb-1">
              {t('common.date', 'Session Date')}
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-navy"
            />
          </div>

          {/* Group Selector */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 block mb-1">
              {t('groups.group', 'Study Cohort')}
            </label>
            <div className="relative">
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full appearance-none rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 text-sm py-2 pl-3 pr-9 focus:outline-none focus:ring-2 focus:ring-brand-navy truncate shadow-xs font-medium cursor-pointer"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id} className="dark:bg-[#1a2332] dark:text-white py-1">
                    {g.name} {g.courseName ? `• ${g.courseName}` : ''}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Quick Mark All Buttons */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 block mb-1">
              {t('attendance.quickActions', 'Batch Set Status')}
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleMarkAll('present')}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 transition-colors"
              >
                {t('attendance.allPresent', 'All Present')}
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll('absent')}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-100 dark:bg-red-950/60 text-brand-red dark:text-red-300 hover:bg-red-200 transition-colors"
              >
                {t('attendance.allAbsent', 'All Absent')}
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Historical List Accordion (if toggled) */}
      {viewHistory && (
        <Card title={t('attendance.historyTitle', 'Past Recorded Sessions')}>
          {historyRecords.length === 0 ? (
            <p className="text-xs text-gray-500 py-2">{t('attendance.noHistory', 'No historical lessons recorded for this group.')}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {historyRecords.map((l) => (
                <div
                  key={l.id}
                  onClick={() => {
                    setSelectedDate(l.lesson_date);
                    setViewHistory(false);
                  }}
                  className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-surface-dark-tertiary cursor-pointer hover:border-brand-navy transition-all"
                >
                  <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{l.lesson_date}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{l.title}</p>
                  <span className="text-[11px] font-medium text-brand-navy dark:text-blue-300">
                    {t('attendance.clickToLoad', 'Click to load this date')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Student Attendance List */}
      <Card noPadding>
        {loading ? (
          <div className="py-16 text-center">
            <LoadingSpinner size="md" />
            <p className="text-xs text-gray-500 mt-2">{t('common.loading', 'Loading cohort students...')}</p>
          </div>
        ) : students.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <Users className="w-10 h-10 mx-auto mb-2 text-gray-400" />
            <p className="text-sm font-semibold">{t('groups.noStudents', 'No students enrolled in this group.')}</p>
            <p className="text-xs text-gray-400 mt-1">{t('attendance.enrollDesc', 'Enroll students via the Group Management screen.')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {students.map((student, idx) => {
              const currentStatus = attendanceMap[student.id]?.status || 'present';
              const currentRemark = attendanceMap[student.id]?.remark || '';

              return (
                <div
                  key={student.id}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-surface-dark-tertiary/20 transition-colors"
                >
                  {/* Student Info */}
                  <div className="flex items-center gap-3 min-w-[200px]">
                    <span className="text-xs font-mono text-gray-400 w-5">{idx + 1}.</span>
                    <div className="w-9 h-9 rounded-full bg-brand-navy/10 dark:bg-brand-navy/40 text-brand-navy dark:text-blue-300 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                      {student.first_name?.[0] || 'S'}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                        {student.fullName}
                      </p>
                      <p className="text-xs text-gray-500">@{student.username}</p>
                    </div>
                  </div>

                  {/* Attendance Status Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
                    {statusButtons.map((btn) => {
                      const Icon = btn.icon;
                      const isSelected = currentStatus === btn.status;
                      return (
                        <button
                          key={btn.status}
                          type="button"
                          onClick={() => setStatus(student.id, btn.status)}
                          className={`
                            flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
                            ${isSelected ? btn.activeClass : btn.idleClass}
                          `}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span>{btn.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Remarks Input */}
                  <div className="w-full md:w-64">
                    <input
                      type="text"
                      placeholder={
                        currentStatus === 'absent' || currentStatus === 'excused'
                          ? t('attendance.reasonPlaceholder', 'Reason for absence...')
                          : t('attendance.optionalNote', 'Remark / note (optional)')
                      }
                      value={currentRemark}
                      onChange={(e) => setRemark(student.id, e.target.value)}
                      className={`
                        w-full text-xs rounded-lg border py-1.5 px-2.5 bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-brand-navy
                        ${
                          currentStatus === 'absent' && !currentRemark
                            ? 'border-amber-300 dark:border-amber-700'
                            : 'border-gray-200 dark:border-gray-700'
                        }
                      `}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
