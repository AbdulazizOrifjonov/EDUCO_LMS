import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Award,
  Calendar,
  Users,
  Plus,
  Edit2,
  Trash2,
  MessageSquare,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Check,
  Save,
  Zap,
  Sparkles,
  Clock,
  RotateCcw,
  UserCheck,
  ClipboardCheck,
  XCircle,
  AlertCircle,
  X,
  Filter,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from '@/components/ui/Toast';
import GradeForm from './GradeForm';
import {
  getGradesByGroup,
  getGradesByStudent,
  saveGrade,
  deleteGrade,
  GRADE_COLORS,
} from '@/services/gradeService';
import { getGroups, getGroupById } from '@/services/groupService';
import {
  getOrCreateLesson,
  getAttendanceForLesson,
  saveAttendanceRecords,
} from '@/services/attendanceService';
import { ROLES } from '@/lib/constants';

/**
 * Default feedback comments according to grade value
 * 5 -> "A'lo darajada"
 * 4 -> "Yaxshi"
 * 3 -> "Qoniqarli"
 * 2 -> "Qoniqarsiz"
 * 1 -> "Yomon"
 */
export const DEFAULT_GRADE_FEEDBACK = {
  5: "A'lo darajada",
  4: 'Yaxshi',
  3: 'Qoniqarli',
  2: 'Qoniqarsiz',
  1: 'Yomon',
};

/**
 * 1-5 Grade Button configuration with vibrant active colors
 */
export const GRADE_BUTTON_CONFIG = [
  {
    val: 1,
    label: 'Yomon',
    activeClass: 'bg-red-600 text-white shadow-md ring-2 ring-red-500 scale-[1.02]',
    inactiveClass:
      'bg-red-50/80 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200/80 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/40',
  },
  {
    val: 2,
    label: 'Qoniqarsiz',
    activeClass: 'bg-orange-500 text-white shadow-md ring-2 ring-orange-500 scale-[1.02]',
    inactiveClass:
      'bg-orange-50/80 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border border-orange-200/80 dark:border-orange-900/50 hover:bg-orange-100 dark:hover:bg-orange-900/40',
  },
  {
    val: 3,
    label: 'Qoniqarli',
    activeClass: 'bg-amber-500 text-white shadow-md ring-2 ring-amber-500 scale-[1.02]',
    inactiveClass:
      'bg-amber-50/80 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 border border-amber-200/80 dark:border-amber-900/50 hover:bg-amber-100 dark:hover:bg-amber-900/40',
  },
  {
    val: 4,
    label: 'Yaxshi',
    activeClass: 'bg-blue-600 text-white shadow-md ring-2 ring-blue-500 scale-[1.02]',
    inactiveClass:
      'bg-blue-50/80 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-900/40',
  },
  {
    val: 5,
    label: "A'lo",
    activeClass: 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-500 scale-[1.02]',
    inactiveClass:
      'bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-900/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/40',
  },
];

const QUICK_FEEDBACK_PRESETS = [
  'Darsda faol qatnashdi',
  'Uyga vazifani to‘liq bajardi',
  'Mavzuni yaxshi o‘zlashtirdi',
  'Uyga vazifani bajarmagan',
  'Darsga kechikib keldi',
  'Mavzuni mustahkamlash kerak',
];

export default function GradesPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const isStudent = profile?.role === ROLES.STUDENT;

  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [grades, setGrades] = useState([]);
  const [students, setStudents] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loading, setLoading] = useState(true);

  // Today's attendance state for this group
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attendanceDraft, setAttendanceDraft] = useState({});
  const [filterOnlyPresent, setFilterOnlyPresent] = useState(true);

  // Custom Group Dropdown State
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);
  const groupDropdownRef = useRef(null);

  // Modal state for adding/editing grades (optional secondary flow)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedGradeRecord, setSelectedGradeRecord] = useState(null);

  // Inline grading state per student: { [studentId]: { gradeValue, feedback, isDirty, isSaving, savedGradeId, savedAt } }
  const [inlineGrades, setInlineGrades] = useState({});
  const [bulkSaving, setBulkSaving] = useState(false);

  // Close group dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (groupDropdownRef.current && !groupDropdownRef.current.contains(event.target)) {
        setGroupDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load groups (or student's grades directly)
  useEffect(() => {
    const init = async () => {
      if (isStudent && profile?.id) {
        setLoading(true);
        try {
          const studentGrades = await getGradesByStudent(profile.id);
          setGrades(studentGrades);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      } else {
        try {
          const gRes = await getGroups({ status: 'active', limit: 100 });
          const groupList = gRes.groups || [];
          setGroups(groupList);
          if (groupList.length > 0 && !selectedGroupId) {
            setSelectedGroupId(groupList[0].id);
          }
        } catch (err) {
          console.error(err);
        }
      }
    };
    init();
  }, [isStudent, profile]);

  // Load group students, grades, and today's attendance
  const fetchGroupGrades = useCallback(async () => {
    if (isStudent || !selectedGroupId) return;
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const lessonId = `lsn-${selectedGroupId}-${today}`;

      const [groupDetails, groupGrades, attRecords] = await Promise.all([
        getGroupById(selectedGroupId),
        getGradesByGroup(selectedGroupId),
        getAttendanceForLesson(lessonId),
      ]);

      const stList = groupDetails.students || [];
      const grList = groupGrades || [];
      setStudents(stList);
      setGrades(grList);
      setTodayAttendance(attRecords || []);

      // Initialize inlineGrades state for each student
      setInlineGrades((prev) => {
        const next = { ...prev };
        stList.forEach((st) => {
          if (next[st.id]?.isDirty) return;

          const studentGradeRecords = grList.filter((g) => g.student_id === st.id);
          const latestGrade = studentGradeRecords[0];

          if (latestGrade) {
            const num = Number(latestGrade.grade_value);
            next[st.id] = {
              gradeValue: num,
              feedback:
                latestGrade.feedback ||
                DEFAULT_GRADE_FEEDBACK[num] ||
                '',
              isDirty: false,
              isSaving: false,
              savedGradeId: latestGrade.id,
              savedAt: latestGrade.created_at || latestGrade.updated_at,
            };
          } else {
            next[st.id] = {
              gradeValue: null,
              feedback: '',
              isDirty: false,
              isSaving: false,
              savedGradeId: null,
              savedAt: null,
            };
          }
        });
        return next;
      });

      // Get or create today's lesson reference for new assessments
      const lesson = await getOrCreateLesson({
        groupId: selectedGroupId,
        date: today,
        title: `${groupDetails.name} Session`,
        createdBy: profile?.id,
      });
      setCurrentLesson(lesson);
    } catch (err) {
      console.error(err);
      toast.error(t('grades.fetchError', 'Failed to load group grades'));
    } finally {
      setLoading(false);
    }
  }, [selectedGroupId, isStudent, profile, t]);

  useEffect(() => {
    fetchGroupGrades();
  }, [fetchGroupGrades]);

  useEffect(() => {
    const handleSync = () => {
      fetchGroupGrades();
    };
    window.addEventListener('educo-data-sync', handleSync);
    return () => window.removeEventListener('educo-data-sync', handleSync);
  }, [fetchGroupGrades]);

  // Attendance computed states
  const hasAttendanceRecorded = todayAttendance.length > 0;

  // Partition students based on attendance:
  const { presentStudents, absentStudents } = useMemo(() => {
    if (!hasAttendanceRecorded) {
      // If attendance has not been taken yet, all students are pending
      return { presentStudents: students, absentStudents: [] };
    }

    const present = [];
    const absent = [];

    students.forEach((st) => {
      const att = todayAttendance.find((a) => a.student_id === st.id);
      const status = att ? att.status : 'present';
      if (status === 'present' || status === 'late') {
        present.push({ ...st, attendanceStatus: status });
      } else {
        absent.push({ ...st, attendanceStatus: status });
      }
    });

    return { presentStudents: present, absentStudents: absent };
  }, [students, todayAttendance, hasAttendanceRecorded]);

  // Students currently displayed in grading roster
  const displayedStudents = useMemo(() => {
    if (filterOnlyPresent && hasAttendanceRecorded) {
      return presentStudents;
    }
    return students;
  }, [filterOnlyPresent, hasAttendanceRecorded, presentStudents, students]);

  // Count how many displayed students have a grade selected
  const gradedCount = useMemo(() => {
    return displayedStudents.filter((st) => inlineGrades[st.id]?.gradeValue).length;
  }, [displayedStudents, inlineGrades]);

  // Quick Action: Mark all students as present in 1 click
  const handleQuickMarkAllPresent = async () => {
    if (students.length === 0) return;
    setLoadingAttendance(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const lessonId = currentLesson?.id || `lsn-${selectedGroupId}-${today}`;

      const records = students.map((st) => ({
        student_id: st.id,
        status: 'present',
        remark: 'Darsda qatnashdi',
      }));

      await saveAttendanceRecords(lessonId, records, profile?.id);
      setTodayAttendance(records);
      toast.success('Barcha o‘quvchilar darsda bor deb qayd etildi! Endi baholashingiz mumkin.');
    } catch (err) {
      console.error(err);
      toast.error('Davomatni saqlashda xatolik yuz berdi');
    } finally {
      setLoadingAttendance(false);
    }
  };

  // Open attendance modal and populate draft
  const handleOpenAttendanceModal = () => {
    const draft = {};
    students.forEach((st) => {
      const existing = todayAttendance.find((a) => a.student_id === st.id);
      draft[st.id] = existing ? existing.status : 'present';
    });
    setAttendanceDraft(draft);
    setShowAttendanceModal(true);
  };

  // Save attendance draft from modal
  const handleSaveAttendanceDraft = async () => {
    if (loadingAttendance) return;
    setLoadingAttendance(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const lessonId = currentLesson?.id || `lsn-${selectedGroupId}-${today}`;

      const records = students.map((st) => ({
        student_id: st.id,
        status: attendanceDraft[st.id] || 'present',
        remark: attendanceDraft[st.id] === 'absent' ? 'Darsga kelmadi' : '',
      }));

      await saveAttendanceRecords(lessonId, records, profile?.id);
      setTodayAttendance(records);
      setShowAttendanceModal(false);

      const presentCount = records.filter(
        (r) => r.status === 'present' || r.status === 'late'
      ).length;
      toast.success(
        `Davomat saqlandi! Darsda qatnashgan ${presentCount} ta o‘quvchi baholash uchun tayyor.`
      );
    } catch (err) {
      console.error(err);
      toast.error('Davomatni saqlashda xatolik yuz berdi');
    } finally {
      setLoadingAttendance(false);
    }
  };

  // Handle grade button click (1-5)
  const handleSelectGrade = (studentId, val) => {
    setInlineGrades((prev) => {
      const current = prev[studentId] || {};
      const currentFb = (current.feedback || '').trim();

      // Check if current feedback was empty or one of the default automatic comments
      const isAutoFeedback =
        !currentFb ||
        Object.values(DEFAULT_GRADE_FEEDBACK).some(
          (df) => df.toLowerCase() === currentFb.toLowerCase()
        );

      // Automatically fill according to selected grade if not custom
      const newFeedback = isAutoFeedback ? DEFAULT_GRADE_FEEDBACK[val] : currentFb;

      return {
        ...prev,
        [studentId]: {
          ...current,
          gradeValue: val,
          feedback: newFeedback,
          isDirty: true,
        },
      };
    });
  };

  // Handle feedback textarea change
  const handleFeedbackChange = (studentId, text) => {
    setInlineGrades((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        feedback: text,
        isDirty: true,
      },
    }));
  };

  // Quick preset chip clicked
  const handleQuickChipClick = (studentId, chipText) => {
    setInlineGrades((prev) => {
      const current = prev[studentId] || {};
      const existingFb = (current.feedback || '').trim();

      let newFb = chipText;
      if (
        existingFb &&
        !Object.values(DEFAULT_GRADE_FEEDBACK).includes(existingFb)
      ) {
        newFb = `${existingFb}, ${chipText}`;
      }

      return {
        ...prev,
        [studentId]: {
          ...current,
          feedback: newFb,
          isDirty: true,
        },
      };
    });
  };

  // Bulk set grade for all displayed students
  const handleBulkSetGrade = (val) => {
    setInlineGrades((prev) => {
      const next = { ...prev };
      displayedStudents.forEach((st) => {
        const current = next[st.id] || {};
        const currentFb = (current.feedback || '').trim();
        const isAutoFeedback =
          !currentFb ||
          Object.values(DEFAULT_GRADE_FEEDBACK).some(
            (df) => df.toLowerCase() === currentFb.toLowerCase()
          );

        next[st.id] = {
          ...current,
          gradeValue: val,
          feedback: isAutoFeedback ? DEFAULT_GRADE_FEEDBACK[val] : currentFb,
          isDirty: true,
        };
      });
      return next;
    });

    toast.info(
      `Darsda qatnashgan barcha o‘quvchilarga ${val} - "${DEFAULT_GRADE_FEEDBACK[val]}" bahosi belgilandi.`
    );
  };

  // FINAL COMPLETE & SAVE ALL ACTION ("Baholashni yakunlash")
  const handleCompleteAndSaveAll = async () => {
    if (bulkSaving) return;
    const readyStudents = displayedStudents.filter(
      (st) => inlineGrades[st.id]?.gradeValue
    );

    if (readyStudents.length === 0) {
      toast.error('Baholashni yakunlash uchun kamida bitta o‘quvchiga baho tanlang!');
      return;
    }

    setBulkSaving(true);
    const today = new Date().toISOString().split('T')[0];
    const lessonId = currentLesson?.id || `lsn-${selectedGroupId}-${today}`;
    const activeGroup = groups.find((g) => g.id === selectedGroupId);
    const topic = currentLesson?.title || `${activeGroup?.name || 'Guruh'} darsi`;

    try {
      await Promise.all(
        readyStudents.map(async (st) => {
          const state = inlineGrades[st.id];
          const finalFeedback =
            (state.feedback || '').trim() ||
            DEFAULT_GRADE_FEEDBACK[state.gradeValue] ||
            '';

          return saveGrade({
            lessonId,
            groupId: selectedGroupId,
            studentId: st.id,
            studentName: st.fullName,
            gradeValue: state.gradeValue,
            topic,
            feedback: finalFeedback,
            gradedBy: profile?.id,
          });
        })
      );

      // Mark all saved in local state
      setInlineGrades((prev) => {
        const next = { ...prev };
        readyStudents.forEach((st) => {
          if (next[st.id]) {
            next[st.id] = {
              ...next[st.id],
              isDirty: false,
              isSaving: false,
              savedAt: new Date().toISOString(),
            };
          }
        });
        return next;
      });

      toast.success(
        `🎉 Baholash muvaffaqiyatli yakunlandi! Jami ${readyStudents.length} nafar o‘quvchi bahosi saqlandi ✓`
      );
      fetchGroupGrades();
    } catch (err) {
      console.error(err);
      toast.error('Baholarni saqlashda xatolik yuz berdi');
    } finally {
      setBulkSaving(false);
    }
  };

  // Delete grade
  const handleDeleteGrade = async (studentId, gradeId) => {
    if (!window.confirm(t('grades.confirmDelete', 'Ushbu bahoni o‘chirishni xohlaysizmi?'))) return;
    try {
      await deleteGrade(gradeId);
      toast.success(t('grades.deleted', 'Baho o‘chirildi'));

      setInlineGrades((prev) => ({
        ...prev,
        [studentId]: {
          gradeValue: null,
          feedback: '',
          isDirty: false,
          isSaving: false,
          savedGradeId: null,
          savedAt: null,
        },
      }));

      fetchGroupGrades();
    } catch (err) {
      toast.error(t('common.error', 'Bahoni o‘chirishda xatolik yuz berdi'));
    }
  };

  const renderGradeBadge = (val) => {
    const num = Math.round(Number(val));
    const config = GRADE_COLORS[num] || GRADE_COLORS[5];
    return (
      <span
        className={`inline-flex items-center justify-center font-bold px-2.5 py-1 rounded-lg text-sm border shadow-xs ${config.bg} ${config.text} ${config.border}`}
      >
        {num} / 5
      </span>
    );
  };

  // Student view columns (read-only)
  const studentColumns = [
    {
      header: t('schedule.lesson', 'Mavzu / Dars'),
      key: 'lesson',
      render: (row) => (
        <div>
          <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
            {row.lessons?.title || 'Dars mashg‘uloti'}
          </p>
          <p className="text-xs text-gray-500">{row.lessons?.groups?.name}</p>
        </div>
      ),
    },
    {
      header: t('grades.grade', 'Baho (1 - 5)'),
      key: 'grade_value',
      render: (row) => renderGradeBadge(row.grade_value),
    },
    {
      header: t('grades.feedback', 'Ustoz izohi'),
      key: 'feedback',
      render: (row) => (
        <span className="text-xs text-gray-600 dark:text-gray-300 italic">
          {row.feedback || t('grades.noFeedback', 'Izoh qoldirilmagan')}
        </span>
      ),
    },
    {
      header: t('common.date', 'Sana'),
      key: 'created_at',
      render: (row) => (
        <span className="text-xs text-gray-500">
          {row.created_at ? new Date(row.created_at).toLocaleDateString() : '—'}
        </span>
      ),
    },
  ];

  const activeGroup = groups.find((g) => g.id === selectedGroupId) || groups[0];

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Award className="w-5 h-5 sm:w-6 sm:h-6 text-brand-navy dark:text-blue-400 shrink-0" />
            <span>{t('nav.grades', 'O‘quvchilar baholari')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {isStudent
              ? t('grades.studentSubtitle', 'O‘zingizning baholaringiz va ustozlar fikrlarini ko‘ring')
              : 'Darsda qatnashgan o‘quvchilarni baholang va oxirida umumiy yakunlang'}
          </p>
        </div>

        {/* Top Complete Grading Shortcut */}
        {!isStudent && displayedStudents.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="md"
              icon={bulkSaving ? LoadingSpinner : CheckCircle2}
              onClick={handleCompleteAndSaveAll}
              disabled={bulkSaving || loading || gradedCount === 0}
              className="text-xs sm:text-sm font-black shadow-md bg-blue-600 hover:bg-blue-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-xl py-2.5 px-4"
            >
              {bulkSaving ? (
                <span>Saqlanmoqda...</span>
              ) : (
                <span>
                  Baholashni yakunlash ({gradedCount}/{displayedStudents.length})
                </span>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Group Selector for Teachers & Admins */}
      {!isStudent && (
        <Card noPadding className="overflow-visible">
          <div className="p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            {/* Custom Interactive Group Selector */}
            <div className="relative flex-1 min-w-0" ref={groupDropdownRef}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-brand-navy dark:text-blue-400" />
                  <span>{t('groups.group', 'O‘quv guruhi')}</span>
                </label>
                {groups.length > 0 && (
                  <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                    {groups.length} ta guruh mavjud
                  </span>
                )}
              </div>

              {/* Selector Trigger Button */}
              <button
                type="button"
                onClick={() => setGroupDropdownOpen((prev) => !prev)}
                className="w-full flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-2xl border border-gray-300/80 dark:border-gray-700 bg-white dark:bg-surface-dark-secondary hover:border-brand-navy/60 dark:hover:border-blue-500/60 shadow-xs transition-all text-left rtl:text-right focus:outline-none focus:ring-2 focus:ring-brand-navy/20 cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0 shadow-xs"
                    style={{ backgroundColor: activeGroup?.courseColor || '#123D78' }}
                  >
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">
                      {activeGroup?.name || t('groups.selectGroup', 'Guruhni tanlang')}
                    </p>
                    <p className="text-xs text-brand-navy dark:text-blue-400 font-medium truncate mt-0.5">
                      {activeGroup?.courseName || 'Kurs fani'}
                      {activeGroup?.room ? ` • ${activeGroup.room}-xona` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-surface-dark-tertiary text-gray-600 dark:text-gray-300">
                    {students.length} o‘quvchi
                  </span>
                  <div className="p-1 rounded-lg bg-gray-100 dark:bg-surface-dark-tertiary text-gray-500 dark:text-gray-400">
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        groupDropdownOpen ? 'rotate-180 text-brand-navy dark:text-blue-400' : ''
                      }`}
                    />
                  </div>
                </div>
              </button>

              {/* Dropdown Popover List */}
              {groupDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2332] shadow-2xl p-2 max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800">
                    Guruhni tanlang ({groups.length})
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-800/60 mt-1">
                    {groups.map((g) => {
                      const isSelected = g.id === selectedGroupId;
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => {
                            setSelectedGroupId(g.id);
                            setGroupDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between gap-3 p-2.5 rounded-xl transition-colors text-left rtl:text-right cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50/80 dark:bg-blue-950/40 text-brand-navy dark:text-blue-300'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800/60 text-gray-700 dark:text-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs"
                              style={{ backgroundColor: g.courseColor || '#123D78' }}
                            >
                              <Users className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`text-sm truncate ${isSelected ? 'font-bold' : 'font-semibold'}`}>
                                {g.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                {g.courseName}
                                {g.room ? ` • ${g.room}-xona` : ''}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isSelected && (
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-navy text-white dark:bg-blue-500">
                                <Check className="h-3 w-3" />
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Alternative: Custom Topic / Date */}
            <div className="shrink-0 w-full sm:w-auto pt-1 sm:pt-0">
              <Button
                variant="outline"
                size="md"
                icon={Plus}
                className="w-full sm:w-auto justify-center text-xs sm:text-sm font-semibold py-2.5 px-4"
                onClick={() => {
                  setSelectedStudent(null);
                  setSelectedGradeRecord(null);
                  setIsFormOpen(true);
                }}
                disabled={students.length === 0}
              >
                Mavzu bo‘yicha baholash...
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Student View (Read-Only) */}
      {isStudent ? (
        <Card noPadding>
          {/* Desktop Student Table */}
          <div className="hidden md:block">
            <Table
              columns={studentColumns}
              data={grades}
              isLoading={loading}
              emptyMessage={t('grades.noStudentGrades', 'Sizda hali baholar mavjud emas.')}
            />
          </div>

          {/* Mobile Student Cards */}
          <div className="block md:hidden">
            {loading ? (
              <div className="py-12 text-center text-gray-500">
                <LoadingSpinner size="md" />
                <p className="text-xs text-gray-400 mt-2">{t('common.loading', 'Yuklanmoqda...')}</p>
              </div>
            ) : grades.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                <Award className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                <p className="text-sm font-semibold">{t('grades.noStudentGrades', 'Hali hech qanday baho mavjud emas.')}</p>
              </div>
            ) : (
              <div className="p-3 space-y-3">
                {grades.map((g) => (
                  <div
                    key={g.id}
                    className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark-secondary p-4 shadow-sm space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-sm text-gray-900 dark:text-gray-100">
                          {g.lessons?.title || 'Dars mashg‘uloti'}
                        </p>
                        <p className="text-xs text-gray-500">{g.lessons?.groups?.name}</p>
                      </div>
                      <div className="shrink-0">{renderGradeBadge(g.grade_value)}</div>
                    </div>
                    {g.feedback && (
                      <p className="text-xs text-gray-600 dark:text-gray-300 italic bg-gray-50 dark:bg-surface-dark-tertiary p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                        "{g.feedback}"
                      </p>
                    )}
                    <p className="text-[11px] text-gray-400">
                      📅 {g.created_at ? new Date(g.created_at).toLocaleDateString() : '—'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      ) : (
        /* Teacher / Admin View: Attendance Step + Inline Assessment */
        <div className="space-y-4">
          {/* STEP 1: ATTENDANCE STATUS & VERIFICATION */}
          {students.length > 0 && (
            <div>
              {!hasAttendanceRecorded ? (
                /* Attendance Banner: Required before grading */
                <div className="p-4 sm:p-5 rounded-2xl border-2 border-amber-300/80 dark:border-amber-700/60 bg-gradient-to-r from-amber-50/90 to-orange-50/80 dark:from-amber-950/30 dark:to-orange-950/20 shadow-xs space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <ClipboardCheck className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm sm:text-base text-gray-950 dark:text-gray-100">
                        1-Qadam: Dars davomatini belgilang
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                        Qoidaga binoan, baholashdan oldin davomat tekshiriladi. Faqat darsda qatnashgan o‘quvchilar ro‘yxatda chiqadi.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                    <Button
                      variant="primary"
                      size="md"
                      icon={loadingAttendance ? LoadingSpinner : Zap}
                      onClick={handleQuickMarkAllPresent}
                      disabled={loadingAttendance}
                      className="text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white shadow-md justify-center py-2.5 px-4 rounded-xl cursor-pointer"
                    >
                      ⚡ Barcha o‘quvchilar darsda bor (1 bosishda)
                    </Button>

                    <Button
                      variant="outline"
                      size="md"
                      icon={UserCheck}
                      onClick={handleOpenAttendanceModal}
                      className="text-xs sm:text-sm font-semibold justify-center py-2.5 px-4 rounded-xl bg-white dark:bg-surface-dark-secondary cursor-pointer"
                    >
                      📋 Davomatni belgilash (Bor / Kelmadi)
                    </Button>
                  </div>
                </div>
              ) : (
                /* Attendance Verified Bar */
                <div className="p-3 sm:p-3.5 rounded-2xl border border-blue-200/80 dark:border-blue-900/50 bg-blue-50/70 dark:bg-blue-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100">
                          Bugungi dars davomati tasdiqlangan:
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                          {presentStudents.length} ta darsda bor
                        </span>
                        {absentStudents.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300">
                            {absentStudents.length} ta kelmagan
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        {filterOnlyPresent
                          ? 'Faqat darsda qatnashgan o‘quvchilar baholanmoqda.'
                          : 'Barcha guruh o‘quvchilari ko‘rsatilmoqda.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Toggle filter */}
                    {absentStudents.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setFilterOnlyPresent((prev) => !prev)}
                        className="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-surface-dark-secondary border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                      >
                        {filterOnlyPresent ? 'Barchasini ko‘rish' : 'Faqat kelganlar'}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleOpenAttendanceModal}
                      className="px-3 py-1.5 text-xs font-bold rounded-xl bg-brand-navy/10 text-brand-navy dark:bg-blue-500/20 dark:text-blue-300 hover:bg-brand-navy/20 transition-colors cursor-pointer"
                    >
                      ✏️ Davomatni tahrirlash
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: GRADING ROSTER HEADER & BULK PRESETS */}
          <div className="p-3 sm:p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark-secondary shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-brand-navy dark:text-blue-400 shrink-0" />
              <div>
                <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100">
                  {filterOnlyPresent && hasAttendanceRecorded
                    ? `Darsda qatnashgan o‘quvchilar (${displayedStudents.length} nafar)`
                    : `Guruh o‘quvchilari (${displayedStudents.length} nafar)`}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {gradedCount} / {displayedStudents.length} o‘quvchi baholandi
                </p>
              </div>
            </div>

            {/* Quick Bulk Action Buttons */}
            {displayedStudents.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold uppercase text-gray-400 mr-1 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Tezkor:</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleBulkSetGrade(5)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800/60 transition-colors cursor-pointer"
                >
                  ⚡ Hammasiga 5 (A'lo)
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkSetGrade(4)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-300/60 dark:border-blue-800/60 transition-colors cursor-pointer"
                >
                  ⚡ Hammasiga 4 (Yaxshi)
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="py-20 text-center bg-white dark:bg-surface-dark-secondary rounded-2xl border border-gray-200 dark:border-gray-800">
              <LoadingSpinner size="md" />
              <p className="text-xs text-gray-500 mt-2">O‘quvchilar va baholar yuklanmoqda...</p>
            </div>
          ) : displayedStudents.length === 0 ? (
            <div className="py-20 text-center text-gray-500 bg-white dark:bg-surface-dark-secondary rounded-2xl border border-gray-200 dark:border-gray-800">
              <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p className="text-sm font-semibold">
                {hasAttendanceRecorded
                  ? 'Darsda qatnashgan o‘quvchilar topilmadi.'
                  : t('groups.noStudents', 'Bu guruhda hali o‘quvchilar yo‘q.')}
              </p>
            </div>
          ) : (
            /* Student Assessment Cards (Tap 1-5, comment auto-populates, NO individual save clutter) */
            <div className="space-y-3.5">
              {displayedStudents.map((st, idx) => {
                const state = inlineGrades[st.id] || {};
                const selectedVal = state.gradeValue;
                const savedAt = state.savedAt;

                return (
                  <div
                    key={st.id}
                    className={`rounded-2xl border transition-all duration-200 bg-white dark:bg-surface-dark-secondary p-3.5 sm:p-5 shadow-xs space-y-3.5 ${
                      selectedVal
                        ? 'border-blue-400/60 dark:border-blue-500/60 ring-1 ring-blue-500/20'
                        : 'border-gray-200/90 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                    }`}
                  >
                    {/* Header: Student Info, Rank, and Status Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-brand-navy/10 text-brand-navy dark:text-blue-300 font-bold flex items-center justify-center text-sm uppercase shrink-0 shadow-xs">
                          {st.first_name?.[0] || 'S'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100 truncate">
                            {st.fullName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            @{st.username}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Attendance status badge */}
                        {st.attendanceStatus && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              st.attendanceStatus === 'late'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            }`}
                          >
                            {st.attendanceStatus === 'late' ? 'Kechikdi' : 'Darsda bor'}
                          </span>
                        )}

                        {/* Selected grade badge */}
                        {selectedVal ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <Check className="w-3 h-3" />
                            <span>{selectedVal} ball belgilandi</span>
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-surface-dark-tertiary text-gray-500">
                            Baholanmagan
                          </span>
                        )}

                        <span className="text-xs font-mono text-gray-400 bg-gray-100 dark:bg-surface-dark-tertiary px-2 py-0.5 rounded-full">
                          #{idx + 1}
                        </span>
                      </div>
                    </div>

                    {/* 1 - 5 Grade Buttons Row (One single tap!) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-brand-navy dark:text-blue-400" />
                          <span>Bahoni tanlang (1 - 5):</span>
                        </label>
                        {selectedVal && (
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                            Tanlangan: <span className="text-brand-navy dark:text-blue-400">{selectedVal} ball</span> ({DEFAULT_GRADE_FEEDBACK[selectedVal]})
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5">
                        {GRADE_BUTTON_CONFIG.map((btn) => {
                          const isSelected = selectedVal === btn.val;
                          return (
                            <button
                              key={btn.val}
                              type="button"
                              onClick={() => handleSelectGrade(st.id, btn.val)}
                              className={`py-2 sm:py-2.5 px-1 rounded-xl flex flex-col items-center justify-center transition-all duration-150 cursor-pointer select-none ${
                                isSelected ? btn.activeClass : btn.inactiveClass
                              }`}
                            >
                              <span className="text-base sm:text-lg font-black leading-none">
                                {btn.val}
                              </span>
                              <span className="text-[10px] sm:text-xs font-semibold leading-tight mt-1 line-clamp-1">
                                {btn.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Textarea for Feedback / Comment (Auto-populated & Editable) */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <label className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                          <span>Izoh / Baho tafsiloti:</span>
                        </label>
                        {selectedVal && (
                          <span className="text-[11px] text-gray-400 italic">
                            (Baho bo‘yicha avtomatik qo‘yildi)
                          </span>
                        )}
                      </div>

                      <textarea
                        rows={2}
                        value={state.feedback || ''}
                        onChange={(e) => handleFeedbackChange(st.id, e.target.value)}
                        placeholder="O‘quvchi haqida izoh yozing yoki baho tanlaganda avtomatik qo‘yiladi..."
                        className="w-full text-xs sm:text-sm p-2.5 sm:p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-surface-dark-tertiary focus:bg-white dark:focus:bg-surface-dark-secondary focus:ring-2 focus:ring-brand-navy/30 dark:focus:ring-blue-500/30 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 resize-none transition-all outline-none"
                      />

                      {/* Quick preset chips */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                          Tezkor:
                        </span>
                        {QUICK_FEEDBACK_PRESETS.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => handleQuickChipClick(st.id, preset)}
                            className="text-[11px] px-2 py-0.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
                          >
                            + {preset}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Card Footer: Status details */}
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-[11px] text-gray-400 min-w-0">
                        {savedAt ? (
                          <span className="flex items-center gap-1 truncate text-emerald-600 dark:text-emerald-400 font-medium">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>
                              Oldin saqlangan: {new Date(savedAt).toLocaleDateString()}
                            </span>
                          </span>
                        ) : selectedVal ? (
                          <span className="text-blue-600 dark:text-blue-400 font-medium truncate">
                            ✓ {selectedVal} ball tanlandi — oxirida umumiy saqlanadi
                          </span>
                        ) : (
                          <span className="italic truncate text-gray-400">Baho tanlanmagan</span>
                        )}

                        {state.savedGradeId && (
                          <button
                            type="button"
                            onClick={() => handleDeleteGrade(st.id, state.savedGradeId)}
                            className="p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                            title="Bahoni o‘chirish"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {selectedVal && (
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 shrink-0">
                          <Check className="w-3.5 h-3.5" />
                          <span>Tayyor</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ABSENT STUDENTS SECTION (if any absent students filtered out) */}
          {hasAttendanceRecorded && absentStudents.length > 0 && (
            <div className="p-4 rounded-2xl border border-red-200/80 dark:border-red-950/60 bg-red-50/40 dark:bg-red-950/20 space-y-2 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-xs sm:text-sm font-bold text-red-900 dark:text-red-300">
                    Darsga kelmaganlar ({absentStudents.length} nafar) — baholanmaydi:
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAttendanceModal}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Davomatni o‘zgartirish
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap pt-1">
                {absentStudents.map((st) => (
                  <span
                    key={st.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-surface-dark-secondary border border-red-200 dark:border-red-900/40 text-gray-800 dark:text-gray-200 shadow-xs"
                  >
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="font-bold">{st.fullName}</span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      (@{st.username})
                    </span>
                    <span className="text-[10px] font-semibold text-red-600 dark:text-red-400">
                      [{st.attendanceStatus === 'excused' ? 'Sababli' : 'Kelmadi'}]
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: FINAL COMPLETE AND SAVE BUTTON (AT THE VERY END) */}
          {displayedStudents.length > 0 && (
            <div className="p-4 sm:p-6 rounded-2xl border-2 border-emerald-500/40 dark:border-emerald-500/30 bg-gradient-to-r from-emerald-50/80 via-teal-50/60 to-blue-50/80 dark:from-[#11241f] dark:to-surface-dark-secondary shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h4 className="font-black text-base sm:text-lg text-gray-900 dark:text-gray-100">
                    Baholashni yakunlash
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                  Jami <span className="font-bold">{displayedStudents.length} ta</span> o‘quvchidan{' '}
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {gradedCount} nafariga
                  </span>{' '}
                  baho va izoh tanlandi.
                  {gradedCount < displayedStudents.length && (
                    <span className="text-amber-600 dark:text-amber-400 ml-1 font-semibold">
                      ({displayedStudents.length - gradedCount} nafariga baho tanlanmagan)
                    </span>
                  )}
                </p>
              </div>

              <Button
                variant="primary"
                size="lg"
                icon={bulkSaving ? LoadingSpinner : CheckCircle2}
                disabled={bulkSaving || gradedCount === 0}
                onClick={handleCompleteAndSaveAll}
                className="w-full sm:w-auto justify-center text-sm sm:text-base font-black py-3.5 px-7 rounded-2xl bg-blue-600 hover:bg-blue-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white shadow-xl shadow-blue-600/25 dark:shadow-emerald-600/25 active:scale-95 transition-all cursor-pointer"
              >
                {bulkSaving ? (
                  <span>Baholar saqlanmoqda...</span>
                ) : (
                  <span>
                    🎓 Baholashni yakunlash va barchasini saqlash ({gradedCount})
                  </span>
                )}
              </Button>
            </div>
          )}

          {/* STICKY BOTTOM BAR FOR MOBILE */}
          {displayedStudents.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 z-40 p-3 bg-white/95 dark:bg-surface-dark-secondary/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 shadow-2xl block sm:hidden">
              <Button
                variant="primary"
                size="md"
                icon={bulkSaving ? LoadingSpinner : CheckCircle2}
                disabled={bulkSaving || gradedCount === 0}
                onClick={handleCompleteAndSaveAll}
                className="w-full justify-center text-sm font-black py-3 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white shadow-lg shadow-blue-600/20 dark:shadow-emerald-600/20 active:scale-98 cursor-pointer"
              >
                {bulkSaving ? (
                  <span>Saqlanmoqda...</span>
                ) : (
                  <span>
                    🎓 Baholashni yakunlash ({gradedCount}/{displayedStudents.length})
                  </span>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* QUICK ATTENDANCE MODAL (Bor / Kechikdi / Kelmadi) */}
      {showAttendanceModal && (
        <Modal
          isOpen={showAttendanceModal}
          onClose={() => setShowAttendanceModal(false)}
          title="Dars davomatini belgilash"
          subtitle="Baholashdan oldin qaysi o‘quvchilar darsda borligini tasdiqlang"
          size="md"
        >
          <div className="space-y-4">
            <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-80 overflow-y-auto pr-1">
              {students.map((st) => {
                const currentStatus = attendanceDraft[st.id] || 'present';
                return (
                  <div
                    key={st.id}
                    className="py-3 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-brand-navy/10 text-brand-navy dark:text-blue-300 font-bold flex items-center justify-center text-xs shrink-0">
                        {st.first_name?.[0] || 'S'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs sm:text-sm text-gray-900 dark:text-gray-100 truncate">
                          {st.fullName}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate">@{st.username}</p>
                      </div>
                    </div>

                    {/* Attendance status toggles */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setAttendanceDraft((prev) => ({ ...prev, [st.id]: 'present' }))
                        }
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          currentStatus === 'present'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-gray-100 dark:bg-surface-dark-tertiary text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        Bor
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setAttendanceDraft((prev) => ({ ...prev, [st.id]: 'late' }))
                        }
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          currentStatus === 'late'
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-gray-100 dark:bg-surface-dark-tertiary text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        Kechikdi
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setAttendanceDraft((prev) => ({ ...prev, [st.id]: 'absent' }))
                        }
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          currentStatus === 'absent'
                            ? 'bg-red-600 text-white shadow-xs'
                            : 'bg-gray-100 dark:bg-surface-dark-tertiary text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        Kelmadi
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAttendanceModal(false)}
              >
                Bekor qilish
              </Button>

              <Button
                variant="primary"
                size="md"
                icon={loadingAttendance ? LoadingSpinner : Check}
                disabled={loadingAttendance}
                onClick={handleSaveAttendanceDraft}
                className="bg-brand-navy hover:bg-navy-700 text-white font-bold"
              >
                {loadingAttendance ? 'Saqlanmoqda...' : 'Davomatni saqlash va Baholashga o‘tish'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Grade Form Modal (Optional custom session/date assessment) */}
      {isFormOpen && (
        <GradeForm
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedStudent(null);
            setSelectedGradeRecord(null);
          }}
          lessonId={currentLesson?.id}
          groupId={selectedGroupId}
          student={selectedStudent}
          availableStudents={students}
          currentGrade={selectedGradeRecord}
          gradedBy={profile?.id}
          onSuccess={fetchGroupGrades}
        />
      )}
    </div>
  );
}
