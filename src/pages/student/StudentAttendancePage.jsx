import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CheckSquare,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Info,
  Filter,
  X,
  ArrowRight,
  TrendingUp,
  Sun,
  Coffee,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import { localStore } from '@/lib/localStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

export default function StudentAttendancePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const normalizedUserId = localStore.normalizeUserId(user?.id || profile?.id);

  // Calendar Month State (Year & Month)
  const [currentDate, setCurrentDate] = useState(() => {
    // Current date (default October 2026)
    return new Date();
  });

  // Selected Day Modal State (for Mobile / Click)
  const [selectedDayDetail, setSelectedDayDetail] = useState(null);

  // Realtime Sync Ticker
  const [updateTick, setUpdateTick] = useState(0);

  React.useEffect(() => {
    const handleSync = () => setUpdateTick((t) => t + 1);
    window.addEventListener('educo-data-sync', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('educo-data-sync', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // History Filter
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'present' | 'late' | 'excused' | 'absent'

  // 1. Resolve student group
  const { studentGroup, groupSchedules } = useMemo(() => {
    const allGroups = localStore.getGroups();
    const memberships = localStore.getMemberships
      ? localStore.getMemberships()
      : localStore.getItem('educo_db_memberships', []);

    const studentMembership = memberships.find(
      (m) =>
        localStore.normalizeUserId(m.student_id) === normalizedUserId &&
        m.is_active !== false
    );

    const group = studentMembership
      ? allGroups.find((g) => g.id === studentMembership.group_id)
      : allGroups.find(
          (g) =>
            Array.isArray(g.student_ids) &&
            g.student_ids
              .map((id) => localStore.normalizeUserId(id))
              .includes(normalizedUserId)
        );

    if (!group) return { studentGroup: null, groupSchedules: [] };

    const allSchedules = localStore.getSchedules();
    const scheds = allSchedules.filter((s) => s.group_id === group.id);

    return { studentGroup: group, groupSchedules: scheds };
  }, [normalizedUserId, updateTick]);

  // 2. Fetch and enrich student's attendance records
  const studentAttendanceRecords = useMemo(() => {
    const all = localStore.getAttendance();
    const studentLogs = all.filter(
      (a) => localStore.normalizeUserId(a.student_id) === normalizedUserId
    );

    // Map by date string YYYY-MM-DD
    return studentLogs.map((item) => {
      let dateStr = item.date;
      if (!dateStr && item.lesson_id) {
        const match = item.lesson_id.match(/(\d{4}-\d{2}-\d{2})/);
        if (match) {
          dateStr = match[1];
        }
      }
      if (!dateStr && item.created_at) {
        dateStr = item.created_at.split('T')[0];
      }

      return {
        ...item,
        dateString: dateStr,
      };
    });
  }, [normalizedUserId, updateTick]);

  // 3. Overall Statistics Calculation
  const stats = useMemo(() => {
    const total = studentAttendanceRecords.length;
    const present = studentAttendanceRecords.filter((r) => r.status === 'present').length;
    const late = studentAttendanceRecords.filter((r) => r.status === 'late').length;
    const excused = studentAttendanceRecords.filter((r) => r.status === 'excused').length;
    const absent = studentAttendanceRecords.filter((r) => r.status === 'absent').length;

    // Rate: present (100%), late (80%), excused (100% attendance but excused absence), absent (0%)
    const score = total > 0 ? Math.round(((present + late * 0.8 + excused * 0.9) / total) * 100) : 100;
    const attendedCount = present + late;

    return {
      total,
      present,
      late,
      excused,
      absent,
      rate: Math.min(100, Math.max(0, score)),
      attendedCount,
    };
  }, [studentAttendanceRecords]);

  // 4. Calendar Matrix Calculation
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 0-indexed

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const daysInMonth = lastDayOfMonth.getDate();
    // In JS: 0=Sun, 1=Mon, ..., 6=Sat. Convert to 1=Mon ... 7=Sun
    let startingDayOfWeek = firstDayOfMonth.getDay();
    startingDayOfWeek = startingDayOfWeek === 0 ? 7 : startingDayOfWeek;

    // Scheduled days of week for this student's group
    const scheduledDays = (groupSchedules || []).map((s) => Number(s.day_of_week));

    const days = [];
    // Blank lead-in days
    for (let i = 1; i < startingDayOfWeek; i++) {
      days.push({ dayNumber: null });
    }

    // Actual calendar days
    for (let d = 1; d <= daysInMonth; d++) {
      const dayDate = new Date(year, month, d);
      const dayOfWeek = dayDate.getDay() === 0 ? 7 : dayDate.getDay();
      const monthPadded = String(month + 1).padStart(2, '0');
      const dayPadded = String(d).padStart(2, '0');
      const dateString = `${year}-${monthPadded}-${dayPadded}`;

      const isScheduled = scheduledDays.includes(dayOfWeek);

      // Find attendance record for this date
      const record = studentAttendanceRecords.find((r) => r.dateString === dateString);

      const isToday =
        new Date().getFullYear() === year &&
        new Date().getMonth() === month &&
        new Date().getDate() === d;

      days.push({
        dayNumber: d,
        dateString,
        dayOfWeek,
        isScheduled,
        record: record || null,
        isToday,
      });
    }

    return {
      year,
      month,
      days,
    };
  }, [currentDate, groupSchedules, studentAttendanceRecords]);

  const monthNames = [
    'Yanvar',
    'Fevral',
    'Mart',
    'Aprel',
    'May',
    'Iyun',
    'Iyul',
    'Avgust',
    'Sentyabr',
    'Oktyabr',
    'Noyabr',
    'Dekabr',
  ];

  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleCurrentMonth = () => {
    setCurrentDate(new Date());
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'present':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Bor (Qatnashdi)
          </span>
        );
      case 'late':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <AlertTriangle className="w-3.5 h-3.5" />
            Kechikdi
          </span>
        );
      case 'excused':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
            <HelpCircle className="w-3.5 h-3.5" />
            Sababli
          </span>
        );
      case 'absent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <XCircle className="w-3.5 h-3.5" />
            Kelmadi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            Rejalashtirilgan
          </span>
        );
    }
  };

  // If student is not enrolled in any group
  if (!studentGroup) {
    return (
      <div className="space-y-6 animate-fade-in p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              <CheckSquare className="w-7 h-7 text-[#123D78] dark:text-blue-400" />
              {t('dashboard.myAttendance', 'Mening davomatim')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Darslarga qatnashish ko‘rsatkichi va interaktiv taqvim
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-900/60 shadow-sm">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Guruhga biriktirilmagansiz
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Davomat maʼlumotlari ko‘rinishi uchun o‘quvchi avval biron o‘quv guruhiga biriktirilgan bo‘lishi lozim. Biriktirilgandan so‘ng barcha dars davomati bu yerda avtomatik jamlanadi.
          </p>
          <div className="pt-2">
            <Button
              variant="primary"
              onClick={() => navigate('/student/dashboard')}
              icon={ArrowRight}
            >
              Boshqaruv paneliga qaytish
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in p-4 sm:p-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#123D78] via-[#1b4b8a] to-[#2563EB] dark:from-emerald-600 dark:via-emerald-700 dark:to-teal-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-6 -mr-6 w-56 h-56 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-white/90 border border-white/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Shaxsiy davomat tahlili</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Mening davomatim
            </h1>
            <p className="text-sm text-blue-100 dark:text-emerald-100 max-w-xl">
              Guruh: <strong className="text-white">{studentGroup.name}</strong> • {studentGroup.course_name}
            </p>
          </div>

          <div className="flex items-center gap-3.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3.5 sm:p-4">
            <div className="min-w-[4.5rem] h-14 px-2.5 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center font-black text-xl text-sky-300 dark:text-emerald-300 shrink-0 shadow-inner tracking-tight">
              {stats.rate}%
            </div>
            <div>
              <span className="text-xs text-blue-200 dark:text-emerald-200 block uppercase font-bold">Umumiy ko‘rsatkich</span>
              <span className="text-sm font-bold text-white">
                {stats.total > 0
                  ? `${stats.total} ta darsdan ${stats.attendedCount} tasida qatnashgan`
                  : 'Darslar boshlanmoqda'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Status Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Present */}
        <div className="bg-white dark:bg-gray-900 border border-emerald-200 dark:border-emerald-900/60 rounded-3xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold block">
              Bor (Qatnashgan)
            </span>
            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
              {stats.present} ta dars
            </span>
          </div>
        </div>

        {/* Late */}
        <div className="bg-white dark:bg-gray-900 border border-amber-200 dark:border-amber-900/60 rounded-3xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold block">
              Kechikkan
            </span>
            <span className="text-2xl font-black text-amber-700 dark:text-amber-400">
              {stats.late} ta dars
            </span>
          </div>
        </div>

        {/* Excused */}
        <div className="bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-900/60 rounded-3xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold block">
              Sababli qoldirilgan
            </span>
            <span className="text-2xl font-black text-blue-700 dark:text-blue-400">
              {stats.excused} ta dars
            </span>
          </div>
        </div>

        {/* Absent */}
        <div className="bg-white dark:bg-gray-900 border border-rose-200 dark:border-rose-900/60 rounded-3xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold block">
              Sababsiz qoldirilgan
            </span>
            <span className="text-2xl font-black text-rose-700 dark:text-rose-400">
              {stats.absent} ta dars
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Calendar Section */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        {/* Calendar Month Navigation Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-emerald-950/80 text-[#123D78] dark:text-emerald-400 flex items-center justify-center">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {monthNames[calendarData.month]} {calendarData.year}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Dars o‘tilgan kunlar ranglar bilan ko‘rsatilgan (ustiga bosing yoki olib boring)
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCurrentMonth}
              className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              Bugun
            </button>
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
              title="Oldingi oy"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
              title="Keyingi oy"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-600 dark:text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-300/50" />
            Bor (Qatnashgan)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 ring-2 ring-amber-300/50" />
            Kechikdi
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500 ring-2 ring-blue-300/50" />
            Sababli qoldirdi
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 ring-2 ring-rose-300/50" />
            Sababsiz kelmadi
          </span>
          <span className="flex items-center gap-1.5 text-gray-400">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-600" />
            Dars kuni (rejalashtirilgan)
          </span>
        </div>

        {/* Calendar Grid */}
        <div className="overflow-x-auto p-1">
          <div className="min-w-[640px]">
            {/* Weekday Labels */}
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-black uppercase tracking-wider">
              <span className="text-gray-500 dark:text-gray-400">Dush</span>
              <span className="text-gray-500 dark:text-gray-400">Sesh</span>
              <span className="text-gray-500 dark:text-gray-400">Chor</span>
              <span className="text-gray-500 dark:text-gray-400">Pay</span>
              <span className="text-gray-500 dark:text-gray-400">Jum</span>
              <span className="text-amber-600 dark:text-amber-400">Shan</span>
              <span className="text-rose-600 dark:text-rose-400">Yak</span>
            </div>

            {/* Days Matrix */}
            <div className="grid grid-cols-7 gap-2">
              {calendarData.days.map((d, idx) => {
                if (!d.dayNumber) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      className="h-20 sm:h-24 rounded-2xl bg-gray-50/30 dark:bg-gray-800/20 border border-transparent"
                    />
                  );
                }

                const rec = d.record;
                const colIndex = idx % 7;
                const rowIndex = Math.floor(idx / 7);

                // Smart tooltip positioning: never clip left or right
                let tooltipPosClass = 'left-1/2 -translate-x-1/2';
                let tooltipArrowClass = 'left-1/2 -translate-x-1/2';
                if (colIndex <= 1) {
                  tooltipPosClass = 'left-0 translate-x-0';
                  tooltipArrowClass = 'left-6';
                } else if (colIndex >= 5) {
                  tooltipPosClass = 'right-0 left-auto translate-x-0';
                  tooltipArrowClass = 'right-6';
                }

                let tooltipVerticalClass = 'bottom-full mb-2';
                let tooltipArrowVertical = 'top-full border-t-gray-900 border-x-transparent border-b-transparent';
                if (rowIndex === 0) {
                  tooltipVerticalClass = 'top-full mt-2 bottom-auto';
                  tooltipArrowVertical = 'bottom-full border-b-gray-900 border-x-transparent border-t-transparent';
                }

                // Styling determination
                let bgClass = 'bg-gray-50/70 dark:bg-gray-800/40 border-gray-200/60 dark:border-gray-800 hover:border-gray-300';
                let indicatorBadge = null;
                let topIndicatorIcon = null;

                // 1. If today
                if (d.isToday) {
                  bgClass = 'bg-gradient-to-br from-blue-50/90 via-sky-50 to-indigo-50/50 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-gray-900 border-2 border-blue-600 dark:border-emerald-500 shadow-md shadow-blue-500/20 ring-2 ring-blue-400/40 dark:ring-emerald-400/30';
                }

                // 2. Attendance status (Past lessons)
                if (rec) {
                  if (rec.status === 'present') {
                    bgClass = 'bg-emerald-50/90 dark:bg-emerald-950/40 border-2 border-emerald-500 dark:border-emerald-500 shadow-xs hover:shadow-md';
                    topIndicatorIcon = <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />;
                    indicatorBadge = (
                      <div className="mt-1 inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-black tracking-wide shadow-2xs">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Bor</span>
                      </div>
                    );
                  } else if (rec.status === 'late') {
                    bgClass = 'bg-amber-50/90 dark:bg-amber-950/40 border-2 border-amber-500 dark:border-amber-500 shadow-xs hover:shadow-md';
                    topIndicatorIcon = <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />;
                    indicatorBadge = (
                      <div className="mt-1 inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md bg-amber-600 text-white text-[10px] font-black tracking-wide shadow-2xs">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Kechikdi</span>
                      </div>
                    );
                  } else if (rec.status === 'excused') {
                    bgClass = 'bg-blue-50/90 dark:bg-blue-950/40 border-2 border-blue-500 dark:border-blue-500 shadow-xs hover:shadow-md';
                    topIndicatorIcon = <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />;
                    indicatorBadge = (
                      <div className="mt-1 inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-black tracking-wide shadow-2xs">
                        <HelpCircle className="w-3 h-3" />
                        <span>Sababli</span>
                      </div>
                    );
                  } else if (rec.status === 'absent') {
                    bgClass = 'bg-rose-50/90 dark:bg-rose-950/40 border-2 border-rose-500 dark:border-rose-500 shadow-xs hover:shadow-md';
                    topIndicatorIcon = <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />;
                    indicatorBadge = (
                      <div className="mt-1 inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-black tracking-wide shadow-2xs">
                        <XCircle className="w-3 h-3" />
                        <span>Kelmadi</span>
                      </div>
                    );
                  }
                } else if (d.isScheduled && !d.isToday) {
                  // Scheduled lesson (future)
                  bgClass = 'bg-blue-50/40 dark:bg-gray-800/60 border border-dashed border-blue-300 dark:border-blue-700/70 hover:border-blue-400';
                  indicatorBadge = (
                    <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 text-[10px] font-semibold">
                      <Clock className="w-3 h-3 text-blue-500" />
                      <span>Dars kuni</span>
                    </div>
                  );
                } else if (!rec && !d.isToday) {
                  // 3. Distinct Weekend / Dam olish kunlari
                  if (d.dayOfWeek === 7) {
                    // Yakshanba
                    bgClass = 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/70 dark:border-rose-900/40 hover:border-rose-300';
                    indicatorBadge = (
                      <div className="text-[10px] font-bold text-rose-500/80 dark:text-rose-400/80 flex items-center gap-1">
                        <Sun className="w-3 h-3 text-rose-500" />
                        <span>Dam olish</span>
                      </div>
                    );
                  } else if (d.dayOfWeek === 6) {
                    // Shanba
                    bgClass = 'bg-amber-50/40 dark:bg-amber-950/15 border-amber-200/60 dark:border-amber-900/40 hover:border-amber-300';
                    indicatorBadge = (
                      <div className="text-[10px] font-semibold text-amber-600/80 dark:text-amber-400/80 flex items-center gap-1">
                        <Coffee className="w-3 h-3 text-amber-500" />
                        <span>Tanaffus</span>
                      </div>
                    );
                  }
                }

                // If today and no lesson
                if (d.isToday && !indicatorBadge) {
                  indicatorBadge = (
                    <div className="text-[10px] font-bold text-blue-700/80 dark:text-blue-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                      <span>Dars yo‘q</span>
                    </div>
                  );
                }

                return (
                  <div
                    key={`day-${d.dayNumber}`}
                    onClick={() => {
                      if (rec || d.isScheduled) {
                        setSelectedDayDetail(d);
                      }
                    }}
                    className={`h-20 sm:h-24 p-2 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer relative group hover:z-30 ${bgClass}`}
                  >
                    {/* Day number & indicators */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs sm:text-sm font-bold ${
                          d.isToday
                            ? 'w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-blue-600 dark:bg-emerald-600 text-white flex items-center justify-center font-black shadow-xs'
                            : d.dayOfWeek === 7
                            ? 'text-rose-600 dark:text-rose-400 font-black'
                            : d.dayOfWeek === 6
                            ? 'text-amber-700 dark:text-amber-400 font-bold'
                            : 'text-gray-800 dark:text-gray-200'
                        }`}
                      >
                        {d.dayNumber}
                      </span>

                      {d.isToday ? (
                        <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[9px] font-black uppercase tracking-wider animate-pulse shadow-xs">
                          Bugun
                        </span>
                      ) : (
                        topIndicatorIcon
                      )}
                    </div>

                    {/* Middle indicator badge */}
                    <div>{indicatorBadge}</div>

                    {/* Desktop Hover Tooltip (Preview) - Guaranteed fully visible, never clipped */}
                    {(rec || d.isScheduled) && (
                      <div
                        className={`absolute ${tooltipVerticalClass} ${tooltipPosClass} w-64 p-3.5 rounded-2xl bg-gray-900 text-white text-xs shadow-2xl border border-gray-700/90 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 hidden md:block`}
                      >
                        <div className="font-bold flex items-center justify-between border-b border-gray-800 pb-2">
                          <span className="text-white text-xs">{d.dateString}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-800 text-gray-300 font-semibold">
                            Batafsil
                          </span>
                        </div>
                        <div className="mt-2 text-[11px] space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Holat:</span>
                            <span
                              className={`font-bold flex items-center gap-1 ${
                                rec?.status === 'present'
                                  ? 'text-emerald-400'
                                  : rec?.status === 'late'
                                  ? 'text-amber-400'
                                  : rec?.status === 'excused'
                                  ? 'text-blue-400'
                                  : rec?.status === 'absent'
                                  ? 'text-rose-400'
                                  : 'text-blue-300'
                              }`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  rec?.status === 'present'
                                    ? 'bg-emerald-400'
                                    : rec?.status === 'late'
                                    ? 'bg-amber-400'
                                    : rec?.status === 'excused'
                                    ? 'bg-blue-400'
                                    : rec?.status === 'absent'
                                    ? 'bg-rose-400'
                                    : 'bg-blue-300'
                                }`}
                              />
                              {rec?.status === 'present'
                                ? 'Bor (Qatnashgan)'
                                : rec?.status === 'late'
                                ? 'Kechikdi'
                                : rec?.status === 'excused'
                                ? 'Sababli qoldirdi'
                                : rec?.status === 'absent'
                                ? 'Sababsiz kelmadi'
                                : 'Rejalashtirilgan dars'}
                            </span>
                          </div>
                          {rec?.remark && (
                            <div className="pt-1.5 border-t border-gray-800 text-gray-300 italic text-[11px] leading-tight">
                              Izoh: "{rec.remark}"
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Day Detail Modal (Click or Mobile Popover) */}
      {selectedDayDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setSelectedDayDetail(null)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-5 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-emerald-950 text-[#123D78] dark:text-emerald-400 flex items-center justify-center shadow-xs">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {selectedDayDetail.dateString}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Dars davomati ma'lumotlari
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayDetail(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Group & Course */}
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60 space-y-1">
                <span className="text-[11px] text-gray-400 uppercase font-semibold block">
                  O‘quv guruhi
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-white block">
                  {studentGroup.name}
                </span>
                <span className="text-xs text-blue-600 dark:text-emerald-400 block">
                  {studentGroup.course_name}
                </span>
              </div>

              {/* Status & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60">
                  <span className="text-[11px] text-gray-400 uppercase font-semibold block mb-1">
                    Davomat holati
                  </span>
                  <div>{getStatusBadge(selectedDayDetail.record?.status)}</div>
                </div>

                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60">
                  <span className="text-[11px] text-gray-400 uppercase font-semibold block mb-1">
                    Auditoriya / Vaqt
                  </span>
                  <div className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-500 dark:text-emerald-400" />
                    <span>{studentGroup.room || '101-xona'}</span>
                  </div>
                </div>
              </div>

              {/* Teacher Remark / Note */}
              <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-emerald-950/30 border border-blue-200/70 dark:border-emerald-800/70 space-y-1.5">
                <span className="text-[11px] text-blue-800 dark:text-emerald-300 uppercase font-bold block flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  Ustoz izohi / Sababi
                </span>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed italic">
                  {selectedDayDetail.record?.remark
                    ? `"${selectedDayDetail.record.remark}"`
                    : 'Ushbu dars uchun qo‘shimcha izoh qoldirilmagan.'}
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              className="w-full justify-center"
              onClick={() => setSelectedDayDetail(null)}
            >
              Tushunarli
            </Button>
          </div>
        </div>
      )}

      {/* Detailed Chronological History Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-indigo-500" />
              Davomat tarixi
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              O‘tkazilgan darslar bo‘yicha to‘liq qaydlar daftari
            </p>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'ALL', label: 'Barchasi' },
              { id: 'present', label: 'Bor' },
              { id: 'late', label: 'Kechikdi' },
              { id: 'excused', label: 'Sababli' },
              { id: 'absent', label: 'Kelmadi' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-[#123D78] text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {studentAttendanceRecords.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-xs">
            Hozircha davomat yozuvlari kiritilmagan.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {studentAttendanceRecords
              .filter((r) => statusFilter === 'ALL' || r.status === statusFilter)
              .map((rec) => (
                <div
                  key={rec.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 px-3 rounded-2xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold text-xs text-gray-600 dark:text-gray-300 shrink-0">
                      <CalendarIcon className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">
                        {rec.dateString || 'Dars sanasi'}
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">
                        {studentGroup.name} • {studentGroup.room || '101-xona'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    {rec.remark && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 italic max-w-xs truncate hidden md:inline">
                        "{rec.remark}"
                      </span>
                    )}
                    <div>{getStatusBadge(rec.status)}</div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
