import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  GraduationCap,
  Sparkles,
  BookOpen,
  ArrowRight,
  AlertCircle,
  MessageSquare,
  CalendarX,
  Sun,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Check,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import { localStore } from '@/lib/localStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

export default function StudentSchedulePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const normalizedUserId = localStore.normalizeUserId(user?.id || profile?.id);

  // Find student's enrolled group
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

    if (!group) {
      return { studentGroup: null, groupSchedules: [] };
    }

    const allSchedules = localStore.getSchedules();
    const scheds = allSchedules.filter((s) => s.group_id === group.id);

    return { studentGroup: group, groupSchedules: scheds };
  }, [normalizedUserId]);

  const weekDays = [
    { day: 1, name: 'Dushanba', short: 'Dush', isOdd: true },
    { day: 2, name: 'Seshanba', short: 'Sesh', isOdd: false },
    { day: 3, name: 'Chorshanba', short: 'Chor', isOdd: true },
    { day: 4, name: 'Payshanba', short: 'Pay', isOdd: false },
    { day: 5, name: 'Juma', short: 'Jum', isOdd: true },
    { day: 6, name: 'Shanba', short: 'Shan', isOdd: false },
    { day: 7, name: 'Yakshanba', short: 'Yak', isOdd: false },
  ];

  // Current day of week (1 to 7)
  const currentDayOfWeek = new Date().getDay() === 0 ? 7 : new Date().getDay();

  // Compute exact ISO date (YYYY-MM-DD) for each weekday in the current active week
  const weekDates = useMemo(() => {
    const now = new Date();
    const currDay = now.getDay() === 0 ? 7 : now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (currDay - 1));
    monday.setHours(0, 0, 0, 0);

    const dates = {};
    for (let i = 1; i <= 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + (i - 1));
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      dates[i] = `${yyyy}-${mm}-${dd}`;
    }
    return dates;
  }, []);

  // Fetch student attendance records for checking presence/absence
  const attendanceData = useMemo(() => {
    try {
      const allAtt = localStore.getAttendance ? localStore.getAttendance() : [];
      const studentLogs = allAtt.filter(
        (a) => localStore.normalizeUserId(a.student_id) === normalizedUserId
      );
      const dateMap = {};
      for (const log of studentLogs) {
        const dStr = log.date ? log.date.slice(0, 10) : '';
        if (dStr) dateMap[dStr] = log;
      }
      return { logs: studentLogs, dateMap };
    } catch {
      return { logs: [], dateMap: {} };
    }
  }, [normalizedUserId]);

  const getAttendanceForDay = (dayNum, lesson) => {
    const dateStr = weekDates[dayNum];
    if (attendanceData.dateMap[dateStr]) {
      return attendanceData.dateMap[dateStr];
    }
    const byLesson = attendanceData.logs.find(
      (a) => a.lesson_id === lesson.id || a.lesson_id === `lsn-${studentGroup?.id}-${dateStr}`
    );
    if (byLesson) return byLesson;

    // Fallback: check if student has any record for this weekday in current cycle
    const byDow = attendanceData.logs.find((a) => {
      if (!a.date) return false;
      const d = new Date(a.date);
      const dow = d.getDay() === 0 ? 7 : d.getDay();
      return dow === dayNum;
    });
    return byDow || null;
  };

  // If student is not enrolled in any group
  if (!studentGroup) {
    return (
      <div className="space-y-6 animate-fade-in p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-7 h-7 text-[#123D78] dark:text-blue-400" />
              {t('dashboard.mySchedule', 'Mening dars jadvalim')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Shaxsiy o‘quv guruhingiz dars kunlari va dars vaqtlari
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-900/60 shadow-sm">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Siz hali birorta guruhga biriktirilmagansiz
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Dars jadvali ko‘rinishi uchun avval o‘quv markazi maʼmuriyati tomonidan tegishli o‘quv guruhiga biriktirilishingiz lozim. Biriktirilganingizdan so‘ng sizning haftalik dars jadvalingiz avtomatik aks etadi.
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
        <div className="absolute right-0 top-0 -mt-6 -mr-6 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-white/90 border border-white/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Shaxsiy dars jadvali</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {studentGroup.name}
            </h1>
            <p className="text-sm text-blue-100 dark:text-emerald-100 max-w-xl">
              {studentGroup.course_name || 'Kurs mashg‘ulotlari'} • Haftalik dars kunlari va belgilangan xona
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-left">
              <span className="text-[11px] block text-blue-200 uppercase font-semibold">Auditoriya</span>
              <span className="text-sm font-bold flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-4 h-4 text-sky-300 dark:text-emerald-300" />
                {studentGroup.room || '101-xona'}
              </span>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-left">
              <span className="text-[11px] block text-blue-200 uppercase font-semibold">Ustoz</span>
              <span className="text-sm font-bold flex items-center gap-1.5 mt-0.5">
                <User className="w-4 h-4 text-amber-300" />
                {studentGroup.teacher_name || 'Bobur Mirzayev'}
              </span>
            </div>
            <Button
              variant="secondary"
              onClick={() => navigate('/student/chat')}
              className="bg-white hover:bg-white/90 text-[#123D78] font-bold shadow-md cursor-pointer border-0"
              icon={MessageSquare}
            >
              Guruh chati
            </Button>
          </div>
        </div>
      </div>

      {/* Weekly Schedule Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#123D78] dark:text-blue-400" />
              Haftalik darslar jadvali
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Faqat sizning guruhingiz darslari va davomat holati
            </p>
          </div>
        </div>

        {/* Attendance Status Legend */}
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs shadow-2xs">
          <span className="font-bold text-gray-700 dark:text-gray-300 text-[11px] uppercase tracking-wider mr-1">
            Davomat belgilari:
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Qatnashgan (Yashil)
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-800">
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Kech qolgan (Sariq)
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-semibold border border-rose-200 dark:border-rose-800">
            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> Qatnashmagan (Qizil)
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-semibold border border-sky-200 dark:border-sky-800">
            <HelpCircle className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" /> Sababli
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-800">
            <Sun className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> Dam olish kuni
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3.5">
          {weekDays.map((w) => {
            const isToday = w.day === currentDayOfWeek;
            const dayLessons = groupSchedules.filter((s) => Number(s.day_of_week) === w.day);

            return (
              <div
                key={w.day}
                className={`flex flex-col h-full rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isToday
                    ? 'bg-blue-50/70 dark:bg-blue-950/25 border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/25 shadow-md'
                    : w.day === 7
                    ? 'bg-rose-50/30 dark:bg-rose-950/10 border-rose-200/80 dark:border-rose-900/40 shadow-2xs'
                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-2xs hover:shadow-xs'
                }`}
              >
                {/* Day Header - Clean, balanced, never crowded */}
                <div
                  className={`px-3.5 py-3 border-b flex items-center justify-between gap-1.5 ${
                    isToday
                      ? 'border-blue-200 dark:border-blue-800/80 bg-blue-100/70 dark:bg-blue-900/40'
                      : w.day === 7
                      ? 'border-rose-200/80 dark:border-rose-900/40 bg-rose-100/50 dark:bg-rose-950/40'
                      : 'border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40'
                  }`}
                >
                  <span className="font-bold text-sm text-gray-900 dark:text-white truncate">
                    {w.name}
                  </span>

                  {isToday ? (
                    <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider shrink-0 shadow-xs animate-pulse">
                      Bugun
                    </span>
                  ) : w.day === 7 ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500 text-white shrink-0 shadow-xs">
                      Dam olish
                    </span>
                  ) : (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 ${
                        w.isOdd
                          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-900/50'
                          : 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/50 dark:border-purple-900/50'
                      }`}
                    >
                      {w.isOdd ? 'Toq kun' : 'Juft kun'}
                    </span>
                  )}
                </div>

                {/* Day Body - Fixed minimum height for perfect symmetry across all 7 columns */}
                <div className="p-3 flex-1 flex flex-col justify-between min-h-[175px]">
                  {dayLessons.length > 0 ? (
                    dayLessons.map((lesson) => {
                      const start = (lesson.start_time || '09:00').slice(0, 5);
                      const end = (lesson.end_time || '10:30').slice(0, 5);

                      // Check attendance for this day
                      const att = getAttendanceForDay(w.day, lesson);
                      const status = att?.status;

                      // Card border and bg based on attendance
                      let cardStyle = 'bg-blue-50/50 dark:bg-emerald-950/20 border-blue-200/80 dark:border-emerald-800/60';
                      let statusBadge = (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-blue-200 dark:border-emerald-800 shrink-0">
                          Dars
                        </span>
                      );

                      if (status === 'present') {
                        cardStyle = 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 ring-1 ring-emerald-500/20';
                        statusBadge = (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1 shrink-0">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            Qatnashgan
                          </span>
                        );
                      } else if (status === 'late') {
                        cardStyle = 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 ring-1 ring-amber-500/20';
                        statusBadge = (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300 dark:border-amber-700 flex items-center gap-1 shrink-0">
                            <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            Kech qolgan
                          </span>
                        );
                      } else if (status === 'absent') {
                        cardStyle = 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-300 dark:border-rose-700 ring-1 ring-rose-500/20';
                        statusBadge = (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 border border-rose-300 dark:border-rose-700 flex items-center gap-1 shrink-0">
                            <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                            Qatnashmagan
                          </span>
                        );
                      } else if (status === 'excused') {
                        cardStyle = 'bg-sky-50/60 dark:bg-sky-950/30 border-sky-300 dark:border-sky-700 ring-1 ring-sky-500/20';
                        statusBadge = (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200 border border-sky-300 dark:border-sky-700 flex items-center gap-1 shrink-0">
                            <HelpCircle className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                            Sababli
                          </span>
                        );
                      } else if (isToday) {
                        cardStyle = 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-400 dark:border-blue-600 ring-1 ring-blue-500/30';
                        statusBadge = (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-600 text-white shrink-0 shadow-2xs">
                            Bugungi dars
                          </span>
                        );
                      }

                      return (
                        <div
                          key={lesson.id}
                          className={`p-3.5 rounded-xl border flex flex-col justify-between h-full space-y-2.5 shadow-2xs hover:shadow-xs transition-all ${cardStyle}`}
                        >
                          {/* Time & Attendance Status Badge */}
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-black text-[#123D78] dark:text-emerald-300 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-emerald-400 shrink-0" />
                              {start} - {end}
                            </span>
                            {statusBadge}
                          </div>

                          {/* Group Name & Course */}
                          <div>
                            <div className="text-xs font-bold text-gray-900 dark:text-white leading-snug line-clamp-2">
                              {studentGroup.name}
                            </div>
                            {studentGroup.course_name && (
                              <p className="text-[11px] font-medium text-blue-600 dark:text-emerald-400 mt-0.5 truncate">
                                {studentGroup.course_name}
                              </p>
                            )}
                          </div>

                          {/* Room & Teacher */}
                          <div className="pt-2 border-t border-blue-100/80 dark:border-gray-800/80 space-y-1 text-[11px] text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-blue-500 dark:text-emerald-400 shrink-0" />
                              <span className="font-medium truncate">{lesson.room || studentGroup.room || '101-xona'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <span className="font-medium truncate">{studentGroup.teacher_name || 'Bobur Mirzayev'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-full min-h-[150px] rounded-xl border border-dashed border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 p-3.5 flex flex-col items-center justify-center text-center">
                      {w.day === 7 ? (
                        <>
                          <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-1.5 border border-rose-200 dark:border-rose-900/60">
                            <Sun className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-rose-800 dark:text-rose-300">
                            Dam olish kuni
                          </span>
                          <span className="text-[10px] text-rose-600/70 dark:text-rose-400/70 mt-0.5 font-medium">
                            Haftalik tanaffus
                          </span>
                        </>
                      ) : isToday ? (
                        <>
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-1.5">
                            <CalendarX className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-blue-900 dark:text-blue-200">
                            Bugun dars yo‘q
                          </span>
                          <span className="text-[10px] text-blue-600 dark:text-blue-300 mt-0.5">
                            Mustaqil ta'lim
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 flex items-center justify-center mb-1.5">
                            <CalendarX className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            Dars yo‘q
                          </span>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                            Bo‘sh kun
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
