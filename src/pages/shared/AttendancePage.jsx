import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
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
  ChevronUp,
  BarChart3,
  UserCheck,
  Search,
  ArrowUpRight,
  Sparkles,
  GraduationCap,
  Layers,
  Percent,
  Eye,
  RotateCcw,
  BookOpen,
  Filter,
  X,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import Avatar from '@/components/ui/Avatar';
import Select from '@/components/ui/Select';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from '@/components/ui/Toast';
import { getGroups, getGroupById } from '@/services/groupService';
import {
  getOrCreateLesson,
  getAttendanceForLesson,
  getGroupAttendanceStatus,
  saveAttendanceRecords,
  getLessons,
  getTeacherAndGroupAttendanceAnalytics,
} from '@/services/attendanceService';
import { ROLES } from '@/lib/constants';
import { useSearch } from '@/context/SearchContext';

const TeacherAttendance = React.lazy(() => import('./TeacherAttendance'));
const AttendanceReport = React.lazy(() => import('./AttendanceReport'));

export default function AttendancePage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const isTeacher = profile?.role === ROLES.TEACHER;
  const isOwnerOrAdmin = profile?.role === ROLES.OWNER || profile?.role === ROLES.ADMIN;

  // Active top-level tab
  const [activeTab, setActiveTab] = useState(isOwnerOrAdmin ? 'analytics' : 'roster');

  // --- ANALYTICS STATE & 3-LEVEL PROGRESSIVE DRILL-DOWN ---
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // --- URL SEARCH PARAMS FOR BROWSER HISTORY (Google Chrome Back / Forward) ---
  const [searchParams, setSearchParams] = useSearchParams();
  const teacherIdFromUrl = searchParams.get('teacher');
  const groupIdFromUrl = searchParams.get('group');

  // Progressive Drill-down levels:
  // Level 1: drillTeacher === null
  // Level 2: drillTeacher !== null && drillGroup === null
  // Level 3: drillGroup !== null
  const { searchQuery, setSearchQuery } = useSearch();
  const [drillTeacher, setDrillTeacher] = useState(null);
  const [drillGroup, setDrillGroup] = useState(null);
  const [teacherSearch, setTeacherSearch] = useState(searchQuery || '');
  const [groupStudentSearch, setGroupStudentSearch] = useState(searchQuery || '');
  const [staffRoleFilter, setStaffRoleFilter] = useState('all'); // 'all' | 'teacher' | 'admin'

  // Dropdown filter states
  const [selectedTeacherId, setSelectedTeacherId] = useState(teacherIdFromUrl || 'all');
  const [selectedGroupIdFilter, setSelectedGroupIdFilter] = useState(groupIdFromUrl || 'all');
  const [studentSearch, setStudentSearch] = useState(searchQuery || '');

  // Synchronize with Navbar global search bar
  useEffect(() => {
    if (searchQuery !== undefined) {
      setTeacherSearch(searchQuery);
      setGroupStudentSearch(searchQuery);
      setStudentSearch(searchQuery);
    }
  }, [searchQuery]);

  // Modal for individual student's daily attendance breakdown
  const [selectedStudentForModal, setSelectedStudentForModal] = useState(null);

  // --- ROSTER STATE (Kunlik guruh davomatini belgilash) ---
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [groups, setGroups] = useState([]);
  const [selectedRosterGroupId, setSelectedRosterGroupId] = useState('');
  const [currentLesson, setCurrentLesson] = useState(null);
  const [rosterStudents, setRosterStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({}); // { [studentId]: { status, remark } }
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [savingRoster, setSavingRoster] = useState(false);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [viewHistory, setViewHistory] = useState(false);

  // 30-minute Attendance Locking & Status State
  const [attendanceStatus, setAttendanceStatus] = useState({
    hasAttendance: false,
    isWithin30Min: false,
    isLocked: false,
    minutesLeft: 0,
    submittedAt: null,
  });
  const [groupStatuses, setGroupStatuses] = useState({});

  // Countdown timer for 30-minute edit window
  useEffect(() => {
    if (!attendanceStatus.hasAttendance || attendanceStatus.isLocked || !attendanceStatus.submittedAt) return;
    const interval = setInterval(() => {
      const subMs = new Date(attendanceStatus.submittedAt).getTime();
      const diffMinutes = Math.floor((Date.now() - subMs) / (60 * 1000));
      const isWithin = diffMinutes < 30;
      const left = Math.max(0, 30 - diffMinutes);
      setAttendanceStatus((prev) => ({
        ...prev,
        isWithin30Min: isWithin,
        isLocked: !isWithin,
        minutesLeft: left,
      }));
    }, 15000);
    return () => clearInterval(interval);
  }, [attendanceStatus.hasAttendance, attendanceStatus.isLocked, attendanceStatus.submittedAt]);

  // Load Analytics Data
  const loadAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    try {
      const data = await getTeacherAndGroupAttendanceAnalytics();
      setAnalyticsData(data);
    } catch (err) {
      console.error('Analytics load error:', err);
      toast.error('Davomat tahlilini yuklashda xatolik yuz berdi');
    } finally {
      setLoadingAnalytics(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'analytics') {
      loadAnalytics();
    }
  }, [activeTab, loadAnalytics]);

  // If logged in as teacher, auto-set drillTeacher to own profile
  useEffect(() => {
    if (isTeacher && analyticsData?.teachers?.length > 0 && !drillTeacher) {
      const myProfile = analyticsData.teachers.find((t) => t.id === profile?.id);
      if (myProfile) {
        setDrillTeacher(myProfile);
      }
    }
  }, [isTeacher, analyticsData, profile?.id, drillTeacher]);

  // Synchronize URL search params with progressive drill-down levels (Support Google Chrome back/forward button!)
  useEffect(() => {
    if (!analyticsData) return;
    const allStaff = analyticsData.staff || analyticsData.teachers || [];
    const allTeachers = analyticsData.teachers || [];

    if (groupIdFromUrl && teacherIdFromUrl) {
      const parentTeacher = allTeachers.find((t) => t.id === teacherIdFromUrl) || allStaff.find((s) => s.id === teacherIdFromUrl);
      if (parentTeacher) {
        setDrillTeacher(parentTeacher);
        setSelectedTeacherId(parentTeacher.id);
        const g = (parentTeacher.groups || []).find((grp) => grp.id === groupIdFromUrl);
        if (g) {
          setDrillGroup(g);
          setSelectedGroupIdFilter(g.id);
        }
      }
    } else if (teacherIdFromUrl) {
      const parentTeacher = allTeachers.find((t) => t.id === teacherIdFromUrl) || allStaff.find((s) => s.id === teacherIdFromUrl);
      if (parentTeacher) {
        setDrillTeacher(parentTeacher);
        setSelectedTeacherId(parentTeacher.id);
        setDrillGroup(null);
        setSelectedGroupIdFilter('all');
      }
    } else {
      // Level 1: neither teacher nor group in URL
      if (!isTeacher) {
        setDrillTeacher(null);
        setSelectedTeacherId('all');
        setDrillGroup(null);
        setSelectedGroupIdFilter('all');
      }
    }
  }, [teacherIdFromUrl, groupIdFromUrl, analyticsData, isTeacher]);

  // Load Groups for Roster
  useEffect(() => {
    const loadGroupsList = async () => {
      try {
        const res = await getGroups({
          status: 'active',
          teacherId: isTeacher ? profile?.id : 'all',
          limit: 100,
        });
        const groupList = res.groups || [];
        setGroups(groupList);
        if (groupList.length > 0 && !selectedRosterGroupId) {
          setSelectedRosterGroupId(groupList[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadGroupsList();
  }, [isTeacher, profile, selectedRosterGroupId]);

  // Refresh status of all groups for the selected date
  const refreshGroupStatuses = useCallback(async () => {
    if (!groups || groups.length === 0) return;
    try {
      const entries = await Promise.all(
        groups.map(async (g) => {
          const stat = await getGroupAttendanceStatus(g.id, selectedDate);
          return [g.id, stat];
        })
      );
      setGroupStatuses(Object.fromEntries(entries));
    } catch (e) {
      console.warn('refreshGroupStatuses error:', e);
    }
  }, [groups, selectedDate]);

  useEffect(() => {
    refreshGroupStatuses();
  }, [refreshGroupStatuses]);

  useEffect(() => {
    const handleSync = () => {
      refreshGroupStatuses();
    };
    window.addEventListener('educo-data-sync', handleSync);
    return () => window.removeEventListener('educo-data-sync', handleSync);
  }, [refreshGroupStatuses]);

  // Load lesson and students for Roster
  const loadGroupAttendance = useCallback(async () => {
    if (!selectedRosterGroupId || !selectedDate) return;
    setLoadingRoster(true);
    try {
      const groupData = await getGroupById(selectedRosterGroupId);
      const enrolledStudents = groupData.students || [];
      setRosterStudents(enrolledStudents);

      const lesson = await getOrCreateLesson({
        groupId: selectedRosterGroupId,
        date: selectedDate,
        title: `${groupData.name} - ${selectedDate}`,
        createdBy: profile?.id,
      });
      setCurrentLesson(lesson);

      const existingAttendance = await getAttendanceForLesson(lesson.id);
      const hasRecords = Boolean(existingAttendance && existingAttendance.length > 0);

      let recordTime = null;
      let isWithin = false;
      let left = 0;
      let locked = false;

      if (hasRecords) {
        const timestamps = existingAttendance
          .map((r) => new Date(r.created_at || r.updated_at || Date.now()).getTime())
          .filter((t) => !isNaN(t));
        const subTime = timestamps.length > 0 ? Math.min(...timestamps) : Date.now();
        recordTime = new Date(subTime).toISOString();
        const diffMinutes = Math.floor((Date.now() - subTime) / (60 * 1000));
        isWithin = diffMinutes < 30;
        left = Math.max(0, 30 - diffMinutes);
        locked = !isWithin;
      }

      setAttendanceStatus({
        hasAttendance: hasRecords,
        isWithin30Min: isWithin,
        isLocked: locked,
        minutesLeft: left,
        submittedAt: recordTime,
      });

      const map = {};
      enrolledStudents.forEach((st) => {
        const found = (existingAttendance || []).find((a) => a.student_id === st.id);
        map[st.id] = {
          status: found ? found.status : 'present',
          remark: found ? found.remark || '' : '',
        };
      });
      setAttendanceMap(map);
    } catch (err) {
      console.error(err);
      toast.error(t('attendance.loadError', 'Davomat roʻyxatini yuklashda xatolik'));
    } finally {
      setLoadingRoster(false);
    }
  }, [selectedRosterGroupId, selectedDate, profile, t]);

  useEffect(() => {
    if (activeTab === 'roster') {
      loadGroupAttendance();
    }
  }, [loadGroupAttendance, activeTab]);

  const loadHistory = async () => {
    if (!selectedRosterGroupId) return;
    try {
      const lessons = await getLessons({ groupId: selectedRosterGroupId });
      setHistoryRecords(lessons || []);
      setViewHistory(!viewHistory);
    } catch (err) {
      toast.error(t('attendance.historyError', 'Tarixni yuklashda xatolik'));
    }
  };

  const setStatus = (studentId, status) => {
    if (attendanceStatus.isLocked) {
      toast.warning('Davomat yopilgan. 30 daqiqalik tahrirlash muddati tugagan.');
      return;
    }
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const setRemark = (studentId, remark) => {
    if (attendanceStatus.isLocked) return;
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remark,
      },
    }));
  };

  const handleMarkAll = (status) => {
    if (attendanceStatus.isLocked) {
      toast.warning('Davomat yopilgan. 30 daqiqalik tahrirlash muddati tugagan.');
      return;
    }
    setAttendanceMap((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((id) => {
        next[id] = { ...next[id], status };
      });
      return next;
    });
  };

  const handleSaveRoster = async () => {
    if (savingRoster) return;
    if (!currentLesson?.id) return;
    if (attendanceStatus.isLocked) {
      toast.error('Davomat yopilgan. 30 daqiqalik tahrirlash muddati tugagan.');
      return;
    }
    setSavingRoster(true);
    try {
      const records = Object.entries(attendanceMap).map(([studentId, data]) => ({
        student_id: studentId,
        status: data.status,
        remark: data.remark,
      }));

      await saveAttendanceRecords(currentLesson.id, records, profile?.id);
      const now = new Date().toISOString();
      setAttendanceStatus({
        hasAttendance: true,
        isWithin30Min: true,
        isLocked: false,
        minutesLeft: 30,
        submittedAt: now,
      });
      await refreshGroupStatuses();
      toast.success(
        attendanceStatus.hasAttendance
          ? 'Davomat muvaffaqiyatli yangilandi! (30 daqiqa ichida tahrirlash mumkin)'
          : 'Davomat qabul qilindi! 30 daqiqa ichida kechikkanlarni tahrirlashingiz mumkin.'
      );
    } catch (err) {
      console.error(err);
      toast.error(err.message || t('common.error', 'Davomatni saqlashda xatolik'));
    } finally {
      setSavingRoster(false);
    }
  };

  // URL-driven Navigation helpers (Google Chrome back/forward button support!)
  const selectTeacherDrill = (teacher) => {
    setSearchParams({ teacher: teacher.id });
  };

  const selectGroupDrill = (grp) => {
    const parentId = drillTeacher?.id || selectedTeacherId;
    setSearchParams({ teacher: parentId, group: grp.id });
  };

  const backToTeacherDrill = () => {
    if (drillTeacher) {
      setSearchParams({ teacher: drillTeacher.id });
    } else {
      setSearchParams({});
    }
  };

  const backToLevel1 = () => {
    setSearchParams({});
    setTeacherSearch('');
    setGroupStudentSearch('');
    setStudentSearch('');
    setStaffRoleFilter('all');
  };

  // Reset drill-down filters and jump back to Level 1
  const resetFilters = () => {
    setSelectedTeacherId('all');
    setSelectedGroupIdFilter('all');
    setStudentSearch('');
    setTeacherSearch('');
    setGroupStudentSearch('');
    setStaffRoleFilter('all');
    setSearchParams({});
  };

  const handleTeacherDropdownChange = (tId) => {
    setSelectedTeacherId(tId);
    setSelectedGroupIdFilter('all');
    if (tId === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ teacher: tId });
    }
  };

  const handleGroupDropdownChange = (gId) => {
    setSelectedGroupIdFilter(gId);
    if (gId === 'all') {
      if (drillTeacher) {
        setSearchParams({ teacher: drillTeacher.id });
      } else {
        setSearchParams({});
      }
    } else {
      let parentTeacherId = drillTeacher?.id || selectedTeacherId;
      if (parentTeacherId === 'all') {
        (analyticsData?.teachers || []).forEach((t) => {
          if ((t.groups || []).some((grp) => grp.id === gId)) {
            parentTeacherId = t.id;
          }
        });
      }
      setSearchParams({ teacher: parentTeacherId, group: gId });
    }
  };

  // Role Badge Helper matching Image 3 (Passwords page badge colors)
  const getRoleBadge = (role) => {
    switch (role) {
      case ROLES.ADMIN:
      case 'admin':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30">
            ADMINISTRATOR
          </span>
        );
      case ROLES.OWNER:
      case 'owner':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">
            BOSHLIQ
          </span>
        );
      case ROLES.STUDENT:
      case 'student':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
            O'QUVCHI
          </span>
        );
      case ROLES.TEACHER:
      case 'teacher':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
            O'QITUVCHI
          </span>
        );
    }
  };

  // Available groups for the selected teacher (or all groups)
  const availableGroupsForFilter = useMemo(() => {
    const allT = analyticsData?.teachers || [];
    if (selectedTeacherId === 'all') {
      return allT.flatMap((t) => t.groups || []);
    }
    const foundT = allT.find((t) => t.id === selectedTeacherId);
    return foundT?.groups || [];
  }, [analyticsData, selectedTeacherId]);

  // Level 1: Filtered staff (both Admins & Teachers) for Owner/Admin
  const filteredStaffForLevel1 = useMemo(() => {
    let staffList = analyticsData?.staff || analyticsData?.teachers || [];
    if (isTeacher) {
      staffList = staffList.filter((s) => s.id === profile?.id);
    } else if (staffRoleFilter !== 'all') {
      staffList = staffList.filter((s) => s.role === staffRoleFilter);
    }

    const q = (teacherSearch || searchQuery || '').trim().toLowerCase();
    if (q) {
      const rawDigits = q.replace(/\D/g, '');
      staffList = staffList.filter(
        (s) =>
          s.fullName?.toLowerCase().includes(q) ||
          s.first_name?.toLowerCase().includes(q) ||
          s.last_name?.toLowerCase().includes(q) ||
          s.username?.toLowerCase().includes(q) ||
          s.phone?.toLowerCase().includes(q) ||
          (rawDigits && (s.phone || '').replace(/\D/g, '').includes(rawDigits)) ||
          s.role?.toLowerCase().includes(q) ||
          (s.groups || []).some((grp) => (grp.name || '').toLowerCase().includes(q))
      );
    }
    return staffList;
  }, [analyticsData, isTeacher, profile, staffRoleFilter, teacherSearch, searchQuery]);

  // Level 3: Filtered students list in current drillGroup
  const filteredStudentsInDrillGroup = useMemo(() => {
    if (!drillGroup) return [];
    let students = drillGroup.students || [];
    const q = (groupStudentSearch || searchQuery || '').trim().toLowerCase();
    if (q) {
      const rawDigits = q.replace(/\D/g, '');
      students = students.filter(
        (s) =>
          s.fullName?.toLowerCase().includes(q) ||
          s.first_name?.toLowerCase().includes(q) ||
          s.last_name?.toLowerCase().includes(q) ||
          s.username?.toLowerCase().includes(q) ||
          s.phone?.toLowerCase().includes(q) ||
          (rawDigits && (s.phone || '').replace(/\D/g, '').includes(rawDigits))
      );
    }
    return students;
  }, [drillGroup, groupStudentSearch, searchQuery]);

  // Level 2 Roster: Filtered students list in Kunlik guruh davomati
  const filteredRosterStudents = useMemo(() => {
    const q = (studentSearch || searchQuery || '').trim().toLowerCase();
    if (!q) return rosterStudents;
    const rawDigits = q.replace(/\D/g, '');
    return rosterStudents.filter((st) => {
      const full = (st.fullName || `${st.first_name || ''} ${st.last_name || ''}`).toLowerCase();
      const first = (st.first_name || '').toLowerCase();
      const last = (st.last_name || '').toLowerCase();
      const user = (st.username || '').toLowerCase();
      const phone = (st.phone || '').toLowerCase();
      return (
        full.includes(q) ||
        first.includes(q) ||
        last.includes(q) ||
        user.includes(q) ||
        phone.includes(q) ||
        (rawDigits && phone.replace(/\D/g, '').includes(rawDigits))
      );
    });
  }, [rosterStudents, studentSearch, searchQuery]);

  const statusButtons = [
    {
      status: 'present',
      label: t('attendance.present', 'Kelgan'),
      icon: CheckCircle2,
      activeClass: 'bg-emerald-600 text-white ring-2 ring-emerald-600',
      idleClass: 'hover:bg-emerald-50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    },
    {
      status: 'late',
      label: t('attendance.late', 'Kechikkan'),
      icon: Clock,
      activeClass: 'bg-amber-500 text-white ring-2 ring-amber-500',
      idleClass: 'hover:bg-amber-50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    },
    {
      status: 'excused',
      label: t('attendance.excused', 'Sababli'),
      icon: HelpCircle,
      activeClass: 'bg-blue-600 text-white ring-2 ring-blue-600',
      idleClass: 'hover:bg-blue-50 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    },
    {
      status: 'absent',
      label: t('attendance.absent', 'Kelmagan'),
      icon: XCircle,
      activeClass: 'bg-brand-red text-white ring-2 ring-brand-red',
      idleClass: 'hover:bg-red-50 text-brand-red border-red-200 dark:border-red-900',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ========================================================================= */}
      {/* PROMINENT TOP BREADCRUMB PATH (Davomat > Ustoz > Guruh)                   */}
      {/* Marked in Image 4 with Google Chrome Browser History Support             */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between p-3 sm:p-4 rounded-2xl bg-white dark:bg-surface-dark-secondary border border-gray-200/80 dark:border-gray-800 shadow-xs">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold flex-wrap">
          <button
            type="button"
            onClick={backToLevel1}
            className={`inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
              !drillTeacher && !drillGroup
                ? 'text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 dark:bg-emerald-500/15 px-3 py-1.5 rounded-xl border border-emerald-500/30'
                : 'text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 px-2 py-1 rounded-lg'
            }`}
          >
            <ClipboardCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Davomat</span>
          </button>

          {drillTeacher && (
            <>
              <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
              <button
                type="button"
                onClick={backToTeacherDrill}
                className={`inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                  !drillGroup
                    ? 'text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 dark:bg-emerald-500/15 px-3 py-1.5 rounded-xl border border-emerald-500/30'
                    : 'text-gray-600 hover:text-emerald-600 dark:text-gray-300 dark:hover:text-emerald-400 px-2 py-1 rounded-lg'
                }`}
              >
                <span>{drillTeacher.fullName}</span>
              </button>
            </>
          )}

          {drillGroup && (
            <>
              <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 dark:bg-emerald-500/15 px-3 py-1.5 rounded-xl border border-emerald-500/30 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-500" />
                <span>{drillGroup.name}</span>
              </span>
            </>
          )}
        </div>

        {/* Quick Back Button if drilled in */}
        {(drillTeacher || drillGroup) && (
          <button
            type="button"
            onClick={drillGroup ? backToTeacherDrill : backToLevel1}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gray-100 hover:bg-gray-200 dark:bg-surface-dark-tertiary dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors cursor-pointer border border-gray-200/70 dark:border-gray-700/70 shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{drillGroup ? "Ustozga qaytish" : "Ustozlarga qaytish"}</span>
          </button>
        )}
      </div>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2.5">
            <ClipboardCheck className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            {isOwnerOrAdmin ? "Davomat boshqaruvi va tahlili" : t('nav.attendance', 'Davomat')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isOwnerOrAdmin
              ? "Administratorlar, ustozlar, ularning har bir guruhi va talabaning davomat foizigacha to'liq monitoring"
              : t('attendance.pageSubtitle', 'Guruh mashgʻulotlari va kunlik davomatni qayd etish')}
          </p>
        </div>

        {/* Global Action if on roster */}
        {activeTab === 'roster' && (
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button variant="outline" size="md" icon={History} onClick={loadHistory}>
              {viewHistory ? t('attendance.hideHistory', 'Tarixni yashirish') : t('attendance.viewHistory', 'Darslar tarixi')}
            </Button>
            {attendanceStatus.isLocked ? (
              <Button
                variant="outline"
                size="md"
                icon={Lock}
                disabled
                className="opacity-75 cursor-not-allowed bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-700"
              >
                Davomat yopilgan
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                icon={Save}
                isLoading={savingRoster}
                disabled={loadingRoster || rosterStudents.length === 0}
                onClick={handleSaveRoster}
                className="!bg-blue-600 hover:!bg-blue-700 dark:!bg-emerald-600 dark:hover:!bg-emerald-500 text-white shadow-md shadow-blue-600/25 dark:shadow-emerald-600/25 cursor-pointer"
              >
                {attendanceStatus.hasAttendance ? 'O‘zgarishlarni saqlash' : t('common.save', 'Davomatni saqlash')}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Navigation Tabs Bar */}
      <div
        className={`w-full grid ${
          isOwnerOrAdmin ? 'grid-cols-2 sm:flex' : 'grid-cols-2'
        } items-center gap-1.5 sm:gap-2 p-1 sm:p-0 bg-gray-100/90 dark:bg-surface-dark-secondary/70 sm:bg-transparent sm:dark:bg-transparent rounded-2xl sm:rounded-none sm:border-b sm:border-gray-200 sm:dark:border-gray-800`}
      >
        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all min-w-0 cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-blue-600 dark:bg-emerald-600 text-white shadow-md shadow-blue-600/30 dark:shadow-emerald-600/30 font-bold'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-surface-dark-secondary'
          }`}
        >
          <BarChart3 className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline whitespace-nowrap">
            {isTeacher ? "Guruhlarim tahlili" : "Xodimlar & Guruhlar tahlili"}
          </span>
          <span className="sm:hidden truncate">
            {isTeacher ? "Guruhlar tahlili" : "Tahlil"}
          </span>
          {analyticsData && (
            <span
              className={`text-[10px] sm:text-xs px-1.5 py-0.2 rounded-full shrink-0 ${
                activeTab === 'analytics'
                  ? 'bg-white/20 text-white'
                  : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {filteredStaffForLevel1.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('roster')}
          className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all min-w-0 cursor-pointer ${
            activeTab === 'roster'
              ? 'bg-blue-600 dark:bg-emerald-600 text-white shadow-md shadow-blue-600/30 dark:shadow-emerald-600/30 font-bold'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-surface-dark-secondary'
          }`}
        >
          <ClipboardCheck className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline whitespace-nowrap">Kunlik guruh davomati</span>
          <span className="sm:hidden truncate">Kunlik davomat</span>
        </button>

        {isOwnerOrAdmin && (
          <>
            <button
              type="button"
              onClick={() => setActiveTab('staff')}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all min-w-0 cursor-pointer ${
                activeTab === 'staff'
                  ? 'bg-blue-600 dark:bg-emerald-600 text-white shadow-md shadow-blue-600/30 dark:shadow-emerald-600/30 font-bold'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-surface-dark-secondary'
              }`}
            >
              <UserCheck className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline whitespace-nowrap">Xodimlar / Ustozlar davomati</span>
              <span className="sm:hidden truncate">Xodimlar</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all min-w-0 cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-blue-600 dark:bg-emerald-600 text-white shadow-md shadow-blue-600/30 dark:shadow-emerald-600/30 font-bold'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-surface-dark-secondary'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline whitespace-nowrap">Davomat hisoboti & CSV</span>
              <span className="sm:hidden truncate">Hisobot & CSV</span>
            </button>
          </>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: TEACHER & GROUP ATTENDANCE ANALYTICS (HIERARCHICAL DRILL-DOWN)    */}
      {/* ========================================================================= */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card noPadding>
              <div className="p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                    Markaz umumiy davomati
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                      {analyticsData?.overallRate || 93}%
                    </span>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      A'lo
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Percent className="w-6 h-6" />
                </div>
              </div>
            </Card>

            <Card noPadding>
              <div className="p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                    Faol ustozlar
                  </span>
                  <div className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
                    {analyticsData?.totalTeachers || 0}
                    <span className="text-xs font-normal text-gray-500 ml-1">nafar</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-brand-navy dark:text-blue-400 flex items-center justify-center">
                  <GraduationCap className="w-6 h-6" />
                </div>
              </div>
            </Card>

            <Card noPadding>
              <div className="p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                    Faol guruhlar
                  </span>
                  <div className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
                    {analyticsData?.totalGroups || 0}
                    <span className="text-xs font-normal text-gray-500 ml-1">ta</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Layers className="w-6 h-6" />
                </div>
              </div>
            </Card>

            <Card noPadding>
              <div className="p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                    Jami o'quvchilar
                  </span>
                  <div className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
                    {analyticsData?.totalStudents || 0}
                    <span className="text-xs font-normal text-gray-500 ml-1">talaba</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </Card>
          </div>

          {/* ========================================================================= */}
          {/* STEP-BY-STEP FILTER PANEL: USTOZ -> GURUH -> O'QUVCHI                     */}
          {/* ========================================================================= */}
          <Card noPadding>
            <div className="p-4 bg-white dark:bg-surface-dark-secondary rounded-2xl border border-gray-200/80 dark:border-gray-800 space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2.5">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider flex items-center gap-2">
                  <Filter className="w-4 h-4 text-brand-navy dark:text-blue-400" />
                  Bosqichma-bosqich saralash va qidirish
                </span>
                {(selectedTeacherId !== 'all' || selectedGroupIdFilter !== 'all' || studentSearch) && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-xs text-brand-red dark:text-red-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Filtrni tozalash
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                {/* 1-Qadam: Ustozni tanlash */}
                <Select
                  label="1. Ustozni tanlang"
                  value={selectedTeacherId}
                  onChange={(e) => handleTeacherDropdownChange(e.target.value)}
                  placeholder="Barcha ustozlar"
                  headerTitle="Ustozlar ro‘yxati"
                  icon={GraduationCap}
                  size="sm"
                  options={[
                    { value: 'all', label: `Barcha ustozlar (${analyticsData?.teachers?.length || 0})` },
                    ...(analyticsData?.teachers || []).map((t) => ({
                      value: t.id,
                      label: t.fullName,
                      subtitle: `${t.teacherRate}% davomat • ${t.groupsCount} ta guruh`,
                      color: '#123D78',
                    })),
                  ]}
                />

                {/* 2-Qadam: Guruhni tanlash */}
                <Select
                  label="2. Guruhni tanlang"
                  value={selectedGroupIdFilter}
                  onChange={(e) => handleGroupDropdownChange(e.target.value)}
                  placeholder="Guruhni tanlang"
                  headerTitle="O‘quv guruhlari"
                  icon={Users}
                  size="sm"
                  options={[
                    {
                      value: 'all',
                      label: selectedTeacherId === 'all'
                        ? 'Barcha guruhlar'
                        : `Tanlangan ustozning barcha guruhlari (${availableGroupsForFilter.length})`,
                    },
                    ...availableGroupsForFilter.map((g) => ({
                      value: g.id,
                      label: g.name,
                      subtitle: `${g.groupRate}% davomat • ${g.enrolledCount} ta talaba`,
                      color: g.courseColor || '#10b981',
                    })),
                  ]}
                />

                {/* 3-Qadam: Qidiruv */}
                <div>
                  <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider block mb-1">
                    {drillGroup ? "3. Talabani qidirish" : "3. Ustoz yoki talabani qidirish"}
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder={drillGroup ? "Guruhdan talaba qidirish..." : "Ustoz yoki talaba ismi..."}
                      value={drillGroup ? groupStudentSearch : (teacherSearch || studentSearch)}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStudentSearch(val);
                        setTeacherSearch(val);
                        setGroupStudentSearch(val);
                        setSearchQuery(val);
                      }}
                      className="w-full text-xs pl-9 pr-8 py-2.5 bg-gray-50 dark:bg-surface-dark-tertiary rounded-xl border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-navy"
                    />
                    {(studentSearch || teacherSearch || groupStudentSearch) && (
                      <button
                        type="button"
                        onClick={() => {
                          setStudentSearch('');
                          setTeacherSearch('');
                          setGroupStudentSearch('');
                          setSearchQuery('');
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Progressive 3-Level Drill-Down Views */}
          {loadingAnalytics ? (
            <div className="py-20 text-center">
              <LoadingSpinner size="lg" />
              <p className="text-sm text-gray-500 mt-3 font-medium">Ustozlar va guruhlar davomati hisoblanmoqda...</p>
            </div>
          ) : drillGroup ? (
            /* ========================================================================= */
            /* LEVEL 3: TANLANGAN GURUH TALABALARI DAVOMATI PANELI                       */
            /* ========================================================================= */
            <div className="space-y-5 animate-fade-in">
              {/* Navigation Bar / Breadcrumb */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-surface-dark-secondary p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
                <div className="flex items-center gap-2 flex-wrap text-sm">
                  <button
                    type="button"
                    onClick={backToTeacherDrill}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs bg-gray-100 hover:bg-gray-200 dark:bg-surface-dark-tertiary dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Ustoz guruhlariga qaytish
                  </button>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <span
                      onClick={backToLevel1}
                      className="hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer font-medium"
                    >
                      Barcha xodimlar
                    </span>
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span
                      onClick={backToTeacherDrill}
                      className="hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer font-medium"
                    >
                      {drillTeacher?.fullName || "Ustoz"}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {drillGroup.name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRosterGroupId(drillGroup.id);
                      setActiveTab('roster');
                    }}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white transition-all shadow-md shadow-blue-600/20 dark:shadow-emerald-600/20 cursor-pointer flex items-center gap-1.5"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5" />
                    Guruhga davomat olish
                  </button>
                </div>
              </div>

              {/* Group Passport & Quick Stats Card */}
              <Card noPadding>
                <div className="p-5 bg-gradient-to-br from-white to-emerald-50/20 dark:from-surface-dark-secondary dark:to-[#0f2420]/30 rounded-2xl border border-emerald-500/20 dark:border-emerald-500/25">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                          {drillGroup.name}
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-500/30">
                          {drillGroup.courseName}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-2 flex-wrap">
                        <span>📅 {drillGroup.schedule}</span>
                        <span>•</span>
                        <span>📍 {drillGroup.room}</span>
                        <span>•</span>
                        <span>👤 Mas'ul ustoz: <strong className="text-gray-700 dark:text-gray-300">{drillTeacher?.fullName}</strong></span>
                        <span>•</span>
                        <span>👥 Jami talabalar: <strong className="text-gray-700 dark:text-gray-300">{drillGroup.students?.length || 0} nafar</strong></span>
                      </div>
                    </div>

                    {/* Group Metrics and Daily Chart */}
                    <div className="flex items-center gap-5 bg-white dark:bg-surface-dark-tertiary p-3.5 rounded-2xl border border-gray-200/80 dark:border-gray-700 flex-wrap">
                      <div className="text-center px-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          Guruh davomati
                        </span>
                        <span
                          className={`text-2xl font-black ${
                            drillGroup.groupRate >= 90
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : drillGroup.groupRate >= 80
                              ? 'text-teal-600 dark:text-teal-400'
                              : drillGroup.groupRate >= 70
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {drillGroup.groupRate}%
                        </span>
                      </div>

                      {/* Mini Daily Attendance Chart */}
                      <div className="flex items-end gap-1.5 h-11 px-3 border-l border-gray-200 dark:border-gray-700">
                        {(drillGroup.dailyChart || []).map((chartBar, bIdx) => (
                          <div key={bIdx} className="flex flex-col items-center gap-0.5 group relative">
                            <div className="w-3.5 bg-gray-200 dark:bg-gray-700 rounded-t-sm h-8 relative flex items-end overflow-hidden">
                              <div
                                className="w-full bg-gradient-to-t from-red-500 via-amber-400 to-emerald-500 rounded-t-sm"
                                style={{ height: `${chartBar.rate}%` }}
                              />
                            </div>
                            <span className="text-[9px] text-gray-400 font-mono">{chartBar.day}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Student Search & List Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Guruh talabalari davomati ({filteredStudentsInDrillGroup.length} ta)
                </h3>
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Guruhdan talaba qidirish..."
                    value={groupStudentSearch}
                    onChange={(e) => setGroupStudentSearch(e.target.value)}
                    className="w-full text-xs pl-9 pr-8 py-2 bg-white dark:bg-surface-dark-secondary rounded-xl border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                  />
                  {groupStudentSearch && (
                    <button
                      type="button"
                      onClick={() => setGroupStudentSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Students Table */}
              <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark-secondary shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50/80 dark:bg-surface-dark-tertiary">
                    <tr className="text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px] border-b border-gray-200/80 dark:border-gray-800">
                      <th className="py-3 px-3 font-bold text-center w-12">#</th>
                      <th className="py-3 px-4 font-bold">Talaba</th>
                      <th className="py-3 px-3 font-bold text-center">Jami darslar</th>
                      <th className="py-3 px-3 font-bold text-center text-emerald-600 dark:text-emerald-400">Qatnashgan</th>
                      <th className="py-3 px-4 font-bold text-center min-w-[150px]">Davomat foizi</th>
                      <th className="py-3 px-3 font-bold text-center text-amber-500 dark:text-amber-400">Kechikkan</th>
                      <th className="py-3 px-3 font-bold text-center text-blue-500 dark:text-blue-400">Sababli</th>
                      <th className="py-3 px-3 font-bold text-center text-rose-500 dark:text-rose-400">Kelmagan</th>
                      <th className="py-3 px-3 font-bold text-center">Holati</th>
                      <th className="py-3 px-4 font-bold text-center">Tahlil</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 bg-white dark:bg-surface-dark-secondary">
                    {filteredStudentsInDrillGroup.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-gray-400 italic">
                          Talaba topilmadi. Qidiruvni tozalab ko'ring.
                        </td>
                      </tr>
                    ) : (
                      filteredStudentsInDrillGroup.map((student, sIdx) => (
                        <tr
                          key={student.id}
                          className="hover:bg-gray-50/80 dark:hover:bg-surface-dark-tertiary/40 transition-colors"
                        >
                          <td className="py-3 px-3 text-center font-mono text-gray-400">
                            {sIdx + 1}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={student.fullName} size="sm" src={student.avatar_url} />
                              <div>
                                <span className="font-bold text-gray-900 dark:text-gray-100 block">
                                  {student.fullName}
                                </span>
                                <span className="text-[11px] text-gray-400">
                                  {student.phone || `@${student.username}`}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3 text-center font-bold text-gray-700 dark:text-gray-300">
                            {student.totalLessons || 24} ta
                          </td>

                          <td className="py-3 px-3 text-center font-extrabold text-emerald-600 dark:text-emerald-400">
                            {student.presentCount} ta
                          </td>

                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-20 bg-gray-200 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    student.attendanceRate >= 90
                                      ? 'bg-emerald-500'
                                      : student.attendanceRate >= 80
                                      ? 'bg-teal-500'
                                      : student.attendanceRate >= 70
                                      ? 'bg-amber-500'
                                      : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${student.attendanceRate}%` }}
                                />
                              </div>
                              <span
                                className={`font-extrabold text-xs w-9 text-right ${
                                  student.attendanceRate >= 90
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : student.attendanceRate >= 80
                                    ? 'text-teal-600 dark:text-teal-400'
                                    : student.attendanceRate >= 70
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-rose-600 dark:text-rose-400'
                                }`}
                              >
                                {student.attendanceRate}%
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-3 text-center font-bold text-amber-500 dark:text-amber-400">
                            {student.lateCount} ta
                          </td>

                          <td className="py-3 px-3 text-center font-bold text-blue-500 dark:text-blue-400">
                            {student.excusedCount} ta
                          </td>

                          <td className="py-3 px-3 text-center font-bold text-rose-500 dark:text-rose-400">
                            {student.absentCount} ta
                          </td>

                          <td className="py-3 px-3 text-center">
                            {student.attendanceRate >= 90 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                A'lo (90%+)
                              </span>
                            ) : student.attendanceRate >= 80 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                                Yaxshi (80%+)
                              </span>
                            ) : student.attendanceRate >= 70 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                O'rtacha
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                Xavfli
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedStudentForModal({
                                  ...student,
                                  groupName: drillGroup.name,
                                  courseName: drillGroup.courseName,
                                  teacherName: drillTeacher?.fullName,
                                })
                              }
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-colors cursor-pointer border border-emerald-200 dark:border-emerald-800"
                            >
                              <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>Kunlik tahlil</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : drillTeacher ? (
            /* ========================================================================= */
            /* LEVEL 2: TANLANGAN USTOZNING GURUHLARI VA STATISTIKASI PANELI             */
            /* ========================================================================= */
            <div className="space-y-5 animate-fade-in">
              {/* Navigation Bar / Breadcrumb */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-surface-dark-secondary p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
                <div className="flex items-center gap-2 flex-wrap text-sm">
                  <button
                    type="button"
                    onClick={backToLevel1}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs bg-gray-100 hover:bg-gray-200 dark:bg-surface-dark-tertiary dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Barcha xodimlarga qaytish
                  </button>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <span
                      onClick={backToLevel1}
                      className="hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer font-medium"
                    >
                      Barcha xodimlar
                    </span>
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {drillTeacher.fullName}
                    </span>
                  </div>
                </div>

                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Ushbu ustozda <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{drillTeacher.groups?.length || 0} ta guruh</strong> mavjud
                </span>
              </div>

              {/* Teacher Passport / KPI Header */}
              <Card noPadding>
                <div className="p-5 bg-gradient-to-br from-white to-emerald-50/20 dark:from-surface-dark-secondary dark:to-[#0f2420]/30 rounded-2xl border border-emerald-500/20 dark:border-emerald-500/25">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    <div className="flex items-center gap-4">
                      <Avatar name={drillTeacher.fullName} size="xl" src={drillTeacher.avatar_url} />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                            {drillTeacher.fullName}
                          </h2>
                          {getRoleBadge(drillTeacher.role || 'teacher')}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1.5 flex-wrap">
                          <span>@{drillTeacher.username}</span>
                          <span>•</span>
                          <span>{drillTeacher.phone || drillTeacher.email || "Telefon kiritilmagan"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Teacher KPI Badges */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-white dark:bg-surface-dark-tertiary p-3 rounded-2xl border border-gray-200/70 dark:border-gray-700/70">
                      <div className="text-center px-3">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Ustoz davomati</span>
                        <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                          {drillTeacher.teacherSelfRate || 98}%
                        </span>
                      </div>
                      <div className="text-center px-3 border-l border-gray-200 dark:border-gray-700">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">O'tgan darslari</span>
                        <span className="text-lg font-black text-gray-900 dark:text-white">
                          {drillTeacher.lessonsTaughtCount || 24} ta
                        </span>
                      </div>
                      <div className="text-center px-3 border-l border-gray-200 dark:border-gray-700">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Guruhlari</span>
                        <span className="text-lg font-black text-brand-navy dark:text-blue-400">
                          {drillTeacher.groupsCount} ta
                        </span>
                      </div>
                      <div className="text-center px-3 border-l border-gray-200 dark:border-gray-700">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Guruhlar davomati</span>
                        <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                          {drillTeacher.teacherRate}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Teacher's Groups Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Ustozning guruhlari ro'yxati ({drillTeacher.groups?.length || 0} ta)
                  </h3>
                  <span className="text-xs text-gray-400">Guruh ustiga bosib talabalar davomatiga o'ting</span>
                </div>

                {(drillTeacher.groups || []).length === 0 ? (
                  <div className="py-12 text-center text-gray-400 bg-white dark:bg-surface-dark-secondary rounded-2xl border border-gray-200 dark:border-gray-800">
                    Ushbu ustozga biriktirilgan guruhlar topilmadi.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {drillTeacher.groups.map((grp) => (
                      <Card key={grp.id} noPadding>
                        <div className="p-5 flex flex-col justify-between h-full bg-white dark:bg-surface-dark-secondary rounded-2xl border border-gray-200/80 dark:border-gray-800 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all shadow-xs">
                          <div>
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div>
                                <h4 className="font-bold text-gray-900 dark:text-gray-100 text-base hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                                  {grp.name}
                                </h4>
                                <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-500/30">
                                  {grp.courseName}
                                </span>
                              </div>

                              <div className="text-right">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                                  Guruh davomati
                                </span>
                                <span
                                  className={`text-xl font-black ${
                                    grp.groupRate >= 90
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : grp.groupRate >= 80
                                      ? 'text-teal-600 dark:text-teal-400'
                                      : grp.groupRate >= 70
                                      ? 'text-amber-600 dark:text-amber-400'
                                      : 'text-rose-600 dark:text-rose-400'
                                  }`}
                                >
                                  {grp.groupRate}%
                                </span>
                              </div>
                            </div>

                            <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400 my-3">
                              <p>📅 Jadval: <strong className="text-gray-700 dark:text-gray-300">{grp.schedule}</strong></p>
                              <p>📍 Xona: <strong className="text-gray-700 dark:text-gray-300">{grp.room}</strong></p>
                              <p>👥 Talabalar: <strong className="text-gray-700 dark:text-gray-300">{grp.enrolledCount} nafar</strong></p>
                            </div>

                            {/* Mini Daily Chart */}
                            <div className="bg-gray-50 dark:bg-surface-dark-tertiary p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 mb-4">
                              <span className="text-[10px] font-bold text-gray-400 block mb-1">So'nggi darslar davomati:</span>
                              <div className="flex items-end gap-1.5 h-8">
                                {(grp.dailyChart || []).map((chartBar, bIdx) => (
                                  <div key={bIdx} className="flex-1 flex flex-col items-center gap-0.5">
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-t-xs h-6 relative flex items-end overflow-hidden">
                                      <div
                                        className="w-full bg-gradient-to-t from-red-500 via-amber-400 to-emerald-500"
                                        style={{ height: `${chartBar.rate}%` }}
                                      />
                                    </div>
                                    <span className="text-[8px] text-gray-400 font-mono">{chartBar.day}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                            <button
                              type="button"
                              onClick={() => selectGroupDrill(grp)}
                              className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white transition-all shadow-md shadow-blue-600/20 dark:shadow-emerald-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <span>Talabalar davomati (Foizda)</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRosterGroupId(grp.id);
                                setActiveTab('roster');
                              }}
                              className="py-2 px-3 rounded-xl text-xs font-semibold border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                            >
                              Davomat olish
                            </button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* LEVEL 1: XODIMLAR / USTOZLAR VA ADMINLAR RO'YXATI VA MONITORING           */
            /* ========================================================================= */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    Ustozlar va xodimlar davomati ({filteredStaffForLevel1.length} nafar)
                  </h3>
                  <p className="text-xs text-gray-400">
                    O'qituvchilar va administratorlar davomati monitoringi
                  </p>
                </div>

                {/* Role Category Filter Pills (Image 3 role toifalari) */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setStaffRoleFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      staffRoleFilter === 'all'
                        ? 'bg-blue-600 dark:bg-emerald-600 text-white shadow-sm shadow-blue-600/30 dark:shadow-emerald-600/30 ring-2 ring-blue-500/40 dark:ring-emerald-500/40'
                        : 'bg-gray-100 hover:bg-gray-200 dark:bg-surface-dark-tertiary dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Barchasi ({analyticsData?.staff?.length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStaffRoleFilter('teacher')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      staffRoleFilter === 'teacher'
                        ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30 ring-2 ring-amber-500/40'
                        : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    O'qituvchilar ({analyticsData?.teachers?.length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStaffRoleFilter('admin')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      staffRoleFilter === 'admin'
                        ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30 ring-2 ring-purple-500/40'
                        : 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-400 border border-purple-500/30'
                    }`}
                  >
                    Administratorlar ({analyticsData?.admins?.length || 0})
                  </button>
                </div>
              </div>

              {filteredStaffForLevel1.length === 0 ? (
                <div className="py-16 text-center text-gray-500 bg-white dark:bg-surface-dark-secondary rounded-2xl border border-gray-200 dark:border-gray-800">
                  <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p className="font-semibold text-base">Xodim topilmadi</p>
                  <p className="text-xs text-gray-400 mt-1">Filterni o'zgartirib yoki tozalab ko'ring</p>
                  <div className="mt-3">
                    <Button size="sm" variant="outline" onClick={resetFilters}>
                      Filtrni tozalash
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredStaffForLevel1.map((person) => {
                    const isPersonTeacher = person.role === 'teacher';

                    return (
                      <Card key={person.id} noPadding>
                        <div className="p-5 bg-white dark:bg-surface-dark-secondary rounded-2xl border border-gray-200/80 dark:border-gray-800 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all shadow-xs flex flex-col justify-between h-full">
                          <div>
                            {/* Staff Head with Role Badge matching Image 3 */}
                            <div className="flex items-center gap-3.5 mb-4">
                              <Avatar name={person.fullName} size="lg" src={person.avatar_url} />
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
                                    {person.fullName}
                                  </h4>
                                  {getRoleBadge(person.role)}
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  @{person.username} • {person.phone || person.email || "Aloqa kiritilmagan"}
                                </p>
                              </div>
                            </div>

                            {/* 4 KPIs Grid */}
                            {isPersonTeacher ? (
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-gray-50 dark:bg-surface-dark-tertiary p-3 rounded-xl border border-gray-200/60 dark:border-gray-700/60 text-center mb-4">
                                <div>
                                  <span className="text-[9px] uppercase font-bold text-gray-400 block">Ustoz davomati</span>
                                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                                    {person.teacherSelfRate || 98}%
                                  </span>
                                </div>
                                <div className="border-l border-gray-200 dark:border-gray-700">
                                  <span className="text-[9px] uppercase font-bold text-gray-400 block">O'tgan darslari</span>
                                  <span className="text-base font-black text-gray-900 dark:text-white">
                                    {person.lessonsTaughtCount || 24} ta
                                  </span>
                                </div>
                                <div className="border-l border-gray-200 dark:border-gray-700">
                                  <span className="text-[9px] uppercase font-bold text-gray-400 block">Guruhlari</span>
                                  <span className="text-base font-black text-amber-500 dark:text-amber-400">
                                    {person.groupsCount} ta
                                  </span>
                                </div>
                                <div className="border-l border-gray-200 dark:border-gray-700">
                                  <span className="text-[9px] uppercase font-bold text-gray-400 block">Guruh davomati</span>
                                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                                    {person.teacherRate}%
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-purple-50/50 dark:bg-purple-950/20 p-3 rounded-xl border border-purple-200/50 dark:border-purple-800/40 text-center mb-4">
                                <div>
                                  <span className="text-[9px] uppercase font-bold text-gray-400 block">Xodim davomati</span>
                                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                                    {person.teacherSelfRate || 99}%
                                  </span>
                                </div>
                                <div className="border-l border-gray-200 dark:border-gray-700">
                                  <span className="text-[9px] uppercase font-bold text-gray-400 block">Ish kuni</span>
                                  <span className="text-base font-black text-gray-900 dark:text-white">
                                    26 kun
                                  </span>
                                </div>
                                <div className="border-l border-gray-200 dark:border-gray-700">
                                  <span className="text-[9px] uppercase font-bold text-gray-400 block">Lavozim</span>
                                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400 truncate block mt-0.5">
                                    Admin
                                  </span>
                                </div>
                                <div className="border-l border-gray-200 dark:border-gray-700">
                                  <span className="text-[9px] uppercase font-bold text-gray-400 block">Faollik</span>
                                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                                    100%
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Action Button: Emerald Green for teachers, Purple for admins */}
                          {isPersonTeacher ? (
                            <button
                              type="button"
                              onClick={() => selectTeacherDrill(person)}
                              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white transition-all shadow-md shadow-blue-600/20 dark:shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer mt-2"
                            >
                              <span>Guruhlarini ko'rish ({person.groupsCount} ta guruh)</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          ) : (
                            <div className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30 flex items-center justify-center gap-2 mt-2">
                              <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                              <span>Markaz va tizim boshqaruvi (Faol)</span>
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ROSTER VIEW (KUNLIK GURUH DAVOMATINI BELGILASH)                     */}
      {/* ========================================================================= */}
      {activeTab === 'roster' && (
        <div className="space-y-6">
          {/* Date & Group Control Bar */}
          <Card noPadding>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-center">
              {/* Date Picker */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 block mb-1">
                  {t('common.date', 'Dars sanasi')}
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
                <Select
                  label={t('groups.group', 'Guruhni tanlang')}
                  value={selectedRosterGroupId}
                  onChange={(e) => setSelectedRosterGroupId(e.target.value)}
                  placeholder={t('groups.group', 'Guruhni tanlang')}
                  headerTitle="O‘quv guruhlari"
                  icon={Users}
                  size="sm"
                  options={groups.map((g) => {
                    const gStat = groupStatuses[g.id];
                    let badgeLabel = `${g.studentCount || g.enrolled_count || 0} o‘quvchi`;
                    if (gStat?.hasAttendance) {
                      if (gStat.isLocked) {
                        badgeLabel = '🔒 Yopilgan';
                      } else {
                        badgeLabel = `✅ Qabul qilingan (${gStat.minutesLeft}m)`;
                      }
                    } else {
                      badgeLabel = '⏳ Kutilmoqda';
                    }
                    return {
                      value: g.id,
                      label: g.name,
                      subtitle: g.courseName || 'O‘quv fani',
                      color: g.courseColor || '#064e3b',
                      badge: badgeLabel,
                    };
                  })}
                />
              </div>

              {/* Quick Mark All Buttons */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 block mb-1">
                  {t('attendance.quickActions', 'Barcha talabalarga belgilash')}
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={attendanceStatus.isLocked}
                    onClick={() => handleMarkAll('present')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 transition-colors ${
                      attendanceStatus.isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-emerald-200 cursor-pointer'
                    }`}
                  >
                    {t('attendance.allPresent', 'Hammasi keldi')}
                  </button>
                  <button
                    type="button"
                    disabled={attendanceStatus.isLocked}
                    onClick={() => handleMarkAll('absent')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-100 dark:bg-red-950/60 text-brand-red dark:text-red-300 transition-colors ${
                      attendanceStatus.isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-200 cursor-pointer'
                    }`}
                  >
                    {t('attendance.allAbsent', 'Hammasi kelmadi')}
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Historical List Accordion (if toggled) */}
          {viewHistory && (
            <Card title={t('attendance.historyTitle', 'Oldingi oʻtkazilgan darslar')}>
              {(historyRecords || []).length === 0 ? (
                <p className="text-xs text-gray-500 py-2">
                  {t('attendance.noHistory', 'Ushbu guruh uchun oldingi darslar topilmadi.')}
                </p>
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
                        {t('attendance.clickToLoad', 'Ushbu sanadagi davomatni yuklash')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* 30-Minute Attendance Locking & Status Banner */}
          {attendanceStatus.isLocked ? (
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
                  <Lock className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      Davomat qilib bo‘lingan va yopilgan
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                      Qulflangan
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Ushbu dars uchun davomat olinganidan keyingi 30 daqiqalik tahrirlash muddati tugagan. Natijalar qulflangan.
                  </p>
                </div>
              </div>
              {attendanceStatus.submittedAt && (
                <div className="shrink-0 text-xs text-slate-500 font-mono flex items-center gap-1.5 self-end sm:self-center">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Qabul qilingan: {new Date(attendanceStatus.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
            </div>
          ) : attendanceStatus.hasAttendance && attendanceStatus.isWithin30Min ? (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300/80 dark:border-emerald-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-emerald-950 dark:text-emerald-100">
                      Davomat qilib bo‘lingan (Qabul qilingan)
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-600 text-white shadow-xs">
                      Tahrirlash ochiq
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                    Kechikkan yoki sababli kelgan talabalarni kiritishingiz mumkin. O‘zgarishlarni kiritib "O‘zgarishlarni saqlash" tugmasini bosing.
                  </p>
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-2 self-start sm:self-center">
                <div className="px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-900 dark:text-emerald-200 text-xs font-bold border border-emerald-300/60 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{attendanceStatus.minutesLeft} daqiqa qoldi</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/50 flex items-center gap-3">
              <Clock className="w-5 h-5 text-brand-navy dark:text-blue-400 shrink-0" />
              <div className="text-xs text-gray-700 dark:text-gray-300">
                <span className="font-bold text-gray-900 dark:text-white mr-1.5">
                  Bugungi davomat hali olinmagan.
                </span>
                Dars boshlangach talabalar qatnashuvini belgilang va <b>"Davomatni saqlash"</b> tugmasini bosing. Saqlanganidan so‘ng 30 daqiqa davomida tahrirlash mumkin bo‘ladi.
              </div>
            </div>
          )}

          {/* Student Attendance List */}
          <Card noPadding>
            {loadingRoster ? (
              <div className="py-16 text-center">
                <LoadingSpinner size="md" />
                <p className="text-xs text-gray-500 mt-2">{t('common.loading', 'Talabalar roʻyxati yuklanmoqda...')}</p>
              </div>
            ) : (rosterStudents || []).length === 0 ? (
              <div className="py-16 text-center text-gray-500">
                <Users className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                <p className="text-sm font-semibold">
                  {t('groups.noStudents', 'Ushbu guruhda hali talabalar mavjud emas.')}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {t('attendance.enrollDesc', 'Guruhlar boshqaruvi boʻlimida talabalarni guruhga qoʻshishingiz mumkin.')}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredRosterStudents.map((student, idx) => {
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
                        <Avatar name={student.fullName} size="sm" src={student.avatar_url} />
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
                              disabled={attendanceStatus.isLocked}
                              onClick={() => setStatus(student.id, btn.status)}
                              className={`
                                flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
                                ${isSelected ? btn.activeClass : btn.idleClass}
                                ${attendanceStatus.isLocked ? (isSelected ? 'cursor-default ring-1 ring-slate-400' : 'opacity-40 cursor-not-allowed') : 'cursor-pointer'}
                              `}
                            >
                              <Icon className="w-3.5 h-3.5 shrink-0" />
                              <span>{btn.label}</span>
                              {attendanceStatus.isLocked && isSelected && (
                                <Lock className="w-3 h-3 ml-1 opacity-75" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Remarks Input */}
                      <div className="w-full md:w-64">
                        <input
                          type="text"
                          disabled={attendanceStatus.isLocked}
                          placeholder={
                            currentStatus === 'absent' || currentStatus === 'excused'
                              ? t('attendance.reasonPlaceholder', 'Kelmaganlik sababi...')
                              : t('attendance.optionalNote', 'Izoh (ixtiyoriy)')
                          }
                          value={currentRemark}
                          onChange={(e) => setRemark(student.id, e.target.value)}
                          className={`
                            w-full text-xs rounded-lg border py-1.5 px-2.5 bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-brand-navy
                            ${attendanceStatus.isLocked ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed border-gray-200 dark:border-gray-700' : ''}
                            ${
                              currentStatus === 'absent' && !currentRemark && !attendanceStatus.isLocked
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
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TEACHER & STAFF ATTENDANCE CHECK-IN (XODIMLAR DAVOMATI)             */}
      {/* ========================================================================= */}
      {activeTab === 'staff' && isOwnerOrAdmin && (
        <div className="animate-fade-in">
          <Suspense fallback={<div className="py-12 flex justify-center"><LoadingSpinner size="lg" /></div>}>
            <TeacherAttendance />
          </Suspense>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: REPORTS & CSV EXPORT (DAVOMAT HISOBOTI & CSV)                      */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && isOwnerOrAdmin && (
        <div className="animate-fade-in">
          <Suspense fallback={<div className="py-12 flex justify-center"><LoadingSpinner size="lg" /></div>}>
            <AttendanceReport />
          </Suspense>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INDIVIDUAL STUDENT DAILY ATTENDANCE BREAKDOWN & TIMELINE           */}
      {/* ========================================================================= */}
      {selectedStudentForModal && (
        <Modal
          isOpen={!!selectedStudentForModal}
          onClose={() => setSelectedStudentForModal(null)}
          title="Talabaning shaxsiy davomat tahlili"
          size="lg"
        >
          <div className="space-y-5">
            {/* Student Info Header */}
            <div className="p-4 bg-gray-50 dark:bg-surface-dark-tertiary rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <Avatar name={selectedStudentForModal.fullName} size="lg" src={selectedStudentForModal.avatar_url} />
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {selectedStudentForModal.fullName}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    <span>{selectedStudentForModal.groupName}</span>
                    <span>•</span>
                    <span>{selectedStudentForModal.courseName}</span>
                    <span>•</span>
                    <span>Ustoz: {selectedStudentForModal.teacherName}</span>
                  </div>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Davomat foizi</span>
                <span
                  className={`text-2xl font-extrabold ${
                    selectedStudentForModal.attendanceRate >= 90
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : selectedStudentForModal.attendanceRate >= 80
                      ? 'text-teal-600 dark:text-teal-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {selectedStudentForModal.attendanceRate}%
                </span>
              </div>
            </div>

            {/* Attendance Summary Counters */}
            <div className="grid grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300 block">Kelgan</span>
                <span className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300">
                  {selectedStudentForModal.presentCount} ta
                </span>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800 text-center">
                <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300 block">Kechikkan</span>
                <span className="text-lg font-extrabold text-amber-700 dark:text-amber-300">
                  {selectedStudentForModal.lateCount} ta
                </span>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800 text-center">
                <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-300 block">Sababli</span>
                <span className="text-lg font-extrabold text-blue-700 dark:text-blue-300">
                  {selectedStudentForModal.excusedCount} ta
                </span>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800 text-center">
                <span className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-300 block">Kelmagan</span>
                <span className="text-lg font-extrabold text-rose-700 dark:text-rose-300">
                  {selectedStudentForModal.absentCount} ta
                </span>
              </div>
            </div>

            {/* Kunlik darslar ro'yxati va davomat tarixi */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Kunlik darslar davomat tarixi
              </h4>
              <div className="max-h-60 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
                {(selectedStudentForModal.dailyHistory || []).map((session, sIdx) => (
                  <div
                    key={sIdx}
                    className="p-3 flex items-center justify-between gap-3 bg-white dark:bg-surface-dark-secondary hover:bg-gray-50/50 dark:hover:bg-gray-800/40 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 dark:text-white">{session.date}</span>
                        <span className="text-[11px] text-gray-400">({session.day})</span>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 mt-0.5">{session.topic}</p>
                      {session.remark && (
                        <p className="text-[11px] text-gray-400 italic mt-0.5">Izoh: {session.remark}</p>
                      )}
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${
                        session.status === 'present'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : session.status === 'late'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : session.status === 'excused'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {session.status === 'present'
                        ? 'Kelgan'
                        : session.status === 'late'
                        ? 'Kechikkan'
                        : session.status === 'excused'
                        ? 'Sababli'
                        : 'Kelmagan'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
