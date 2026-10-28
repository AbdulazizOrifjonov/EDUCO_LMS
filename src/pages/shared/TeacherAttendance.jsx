import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  GraduationCap,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Search,
  Save,
  UserCheck,
  Sparkles,
  Zap,
  Phone,
  MessageSquare,
  Filter,
  RotateCcw,
  CheckCheck,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Pencil,
  Eye,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Avatar from '@/components/ui/Avatar';
import { toast } from '@/components/ui/Toast';
import {
  getTeacherAttendance,
  saveTeacherAttendance,
} from '@/services/attendanceService';
import { ROLES } from '@/lib/constants';
import { useSearch } from '@/context/SearchContext';

export default function TeacherAttendance() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const todayStr = new Date().toISOString().split('T')[0];
  const { searchQuery: globalSearchQuery, setSearchQuery: setGlobalSearchQuery } = useSearch();

  const [date, setDate] = useState(todayStr);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(globalSearchQuery || '');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'present' | 'auto' | 'late' | 'excused' | 'absent' | 'pending'

  // Synchronize with global navbar search bar
  useEffect(() => {
    if (globalSearchQuery !== undefined) {
      setSearchQuery(globalSearchQuery);
    }
  }, [globalSearchQuery]);

  // Note editor modal
  const [selectedRecordForNote, setSelectedRecordForNote] = useState(null);
  const [noteStatus, setNoteStatus] = useState('present');
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Fetch Teacher Attendance
  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTeacherAttendance({ date });
      setRecords(data || []);
    } catch (err) {
      console.error('Fetch teacher attendance error:', err);
      toast.error('O‘qituvchilar davomatini yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Quick 1-click status change
  const handleQuickMark = async (teacherId, newStatus) => {
    try {
      // Optimistic update
      setRecords((prev) =>
        prev.map((r) => {
          if (r.teacher_id === teacherId) {
            return {
              ...r,
              status: newStatus,
              is_auto: false,
              marked_by: 'admin',
              check_in_time: r.check_in_time || new Date().toISOString(),
            };
          }
          return r;
        })
      );

      await saveTeacherAttendance({
        teacherId,
        date,
        status: newStatus,
        isAuto: false,
        markedBy: 'admin',
      });

      const labelMap = {
        present: 'Kelgan',
        late: 'Kechikkan',
        excused: 'Sababli',
        absent: 'Kelmagan',
      };
      toast.success(`Ustoz davomati saqlandi: ${labelMap[newStatus] || newStatus}`);
    } catch (err) {
      console.error(err);
      toast.error('Davomatni saqlashda xatolik yuz berdi');
      fetchRecords();
    }
  };

  // Open note edit modal
  const handleOpenNoteModal = (record) => {
    setSelectedRecordForNote(record);
    setNoteStatus(record.status === 'pending' ? 'present' : record.status);
    setNoteText(record.notes || '');
  };

  // Save note & status modal
  const handleSaveNoteModal = async () => {
    if (!selectedRecordForNote) return;
    setSavingNote(true);
    try {
      await saveTeacherAttendance({
        teacherId: selectedRecordForNote.teacher_id,
        date,
        status: noteStatus,
        notes: noteText,
        isAuto: false,
        markedBy: 'admin',
      });

      toast.success('Ustoz davomati va izohi saqlandi!');
      setSelectedRecordForNote(null);
      fetchRecords();
    } catch (err) {
      console.error(err);
      toast.error('Saqlashda xatolik');
    } finally {
      setSavingNote(false);
    }
  };

  // Mark all pending teachers as present
  const handleMarkAllPresent = async () => {
    const pendingList = records.filter((r) => r.status === 'pending');
    if (pendingList.length === 0) {
      toast.info('Barcha ustozlar davomati allaqachon belgilangan');
      return;
    }

    try {
      for (const rec of pendingList) {
        await saveTeacherAttendance({
          teacherId: rec.teacher_id,
          date,
          status: 'present',
          notes: 'Admin tomonidan umumiy kelgan deb belgilandi',
          isAuto: false,
          markedBy: 'admin',
        });
      }
      toast.success(`${pendingList.length} ta ustoz kelgan deb belgilandi!`);
      fetchRecords();
    } catch (err) {
      console.error(err);
      toast.error('Barchasini belgilashda xatolik');
    }
  };

  // Quick date change helpers
  const handleSetRelativeDate = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    setDate(d.toISOString().split('T')[0]);
  };

  // Compute statistics
  const stats = useMemo(() => {
    const total = records.length;
    const present = records.filter((r) => r.status === 'present').length;
    const autoPresent = records.filter((r) => r.status === 'present' && r.is_auto).length;
    const late = records.filter((r) => r.status === 'late').length;
    const excused = records.filter((r) => r.status === 'excused').length;
    const absent = records.filter((r) => r.status === 'absent').length;
    const pending = records.filter((r) => r.status === 'pending').length;
    const rate = total > 0 ? Math.round(((present + late * 0.75 + excused * 0.5) / total) * 100) : 100;

    return { total, present, autoPresent, late, excused, absent, pending, rate };
  }, [records]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Search filter
      const q = (searchQuery || globalSearchQuery || '').trim().toLowerCase();
      if (q) {
        const rawDigits = q.replace(/\D/g, '');
        const full = (r.teacher?.fullName || '').toLowerCase();
        const first = (r.teacher?.first_name || '').toLowerCase();
        const last = (r.teacher?.last_name || '').toLowerCase();
        const user = (r.teacher?.username || '').toLowerCase();
        const phone = (r.teacher?.phone || '').toLowerCase();
        const phoneMatch = phone.includes(q) || (rawDigits && phone.replace(/\D/g, '').includes(rawDigits));
        const groupMatch = (r.groups || []).some((g) => (g.name || '').toLowerCase().includes(q));
        if (!full.includes(q) && !first.includes(q) && !last.includes(q) && !user.includes(q) && !phoneMatch && !groupMatch) {
          return false;
        }
      }

      // Status filter
      if (statusFilter === 'all') return true;
      if (statusFilter === 'auto') return r.status === 'present' && r.is_auto;
      return r.status === statusFilter;
    });
  }, [records, searchQuery, globalSearchQuery, statusFilter]);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2.5">
            <GraduationCap className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            <span>Ustozlar va xodimlar davomati</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Admin tomonidan ustozlar davomatini belgilash yoki darsda davomat olgan ustozlarning avtomatik qayd etilishi
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            icon={RotateCcw}
            onClick={fetchRecords}
            disabled={loading}
          >
            Yangilash
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={CheckCheck}
            onClick={handleMarkAllPresent}
            disabled={loading || stats.pending === 0}
            className="!bg-blue-600 hover:!bg-blue-700 dark:!bg-emerald-600 dark:hover:!bg-emerald-500 text-white shadow-md shadow-blue-600/25 dark:shadow-emerald-600/25"
          >
            Hammasini kelgan deb belgilash
          </Button>
        </div>
      </div>

      {/* Auto-marking Informational Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/30 flex items-start gap-3.5">
        <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
          <Zap className="w-5 h-5 text-amber-300" />
        </div>
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">
              Aqlli Avtomatik Davomat Tizimi
            </h4>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              Faol
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            Agar admin o‘qituvchi davomatini oldindan qo‘lda belgilamagan bo‘lsa ham,{' '}
            <strong className="text-emerald-700 dark:text-emerald-400">
              o‘qituvchi o‘z darsida o‘quvchilarining davomatini saqlashi bilan tizim uni avtomatik tarzda «Kelgan»
            </strong>{' '}
            deb hisoblaydi va dars o‘tgan vaqtini qayd etadi.
          </p>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card noPadding>
          <div className="p-4 text-center">
            <span className="text-[11px] font-bold uppercase text-gray-400 block tracking-wider">
              Jami Ustozlar
            </span>
            <span className="text-2xl font-black text-gray-900 dark:text-white mt-1 block">
              {stats.total}
            </span>
          </div>
        </Card>

        <Card noPadding>
          <div className="p-4 text-center bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-500/20">
            <span className="text-[11px] font-bold uppercase text-emerald-600 dark:text-emerald-400 block tracking-wider">
              Kelganlar
            </span>
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {stats.present}
              </span>
              <span className="text-[11px] font-semibold text-emerald-500">
                ({stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%)
              </span>
            </div>
          </div>
        </Card>

        <Card noPadding>
          <div className="p-4 text-center bg-teal-50/50 dark:bg-teal-950/20 rounded-2xl border border-teal-500/20">
            <span className="text-[11px] font-bold uppercase text-teal-600 dark:text-teal-400 block tracking-wider flex items-center justify-center gap-1">
              <Zap className="w-3 h-3 text-amber-500 inline" />
              <span>Avtomatik</span>
            </span>
            <span className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-1 block">
              {stats.autoPresent}
            </span>
          </div>
        </Card>

        <Card noPadding>
          <div className="p-4 text-center bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl border border-amber-500/20">
            <span className="text-[11px] font-bold uppercase text-amber-600 dark:text-amber-400 block tracking-wider">
              Kechikkan
            </span>
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
              {stats.late}
            </span>
          </div>
        </Card>

        <Card noPadding>
          <div className="p-4 text-center bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl border border-rose-500/20">
            <span className="text-[11px] font-bold uppercase text-rose-600 dark:text-rose-400 block tracking-wider">
              Kelmagan
            </span>
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 block">
              {stats.absent}
            </span>
          </div>
        </Card>

        <Card noPadding>
          <div className="p-4 text-center bg-gray-50/50 dark:bg-surface-dark-tertiary rounded-2xl border border-gray-200 dark:border-gray-800">
            <span className="text-[11px] font-bold uppercase text-gray-500 dark:text-gray-400 block tracking-wider">
              Kutilmoqda
            </span>
            <span className="text-2xl font-black text-gray-600 dark:text-gray-300 mt-1 block">
              {stats.pending}
            </span>
          </div>
        </Card>
      </div>

      {/* Date Controls & Filters Bar */}
      <Card noPadding>
        <div className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Date Pickers */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-surface-dark-tertiary p-1 rounded-xl border border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => handleSetRelativeDate(-1)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg hover:bg-white dark:hover:bg-surface-dark-secondary transition-colors text-gray-700 dark:text-gray-300"
                >
                  Kecha
                </button>
                <button
                  type="button"
                  onClick={() => handleSetRelativeDate(0)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    date === todayStr
                      ? 'bg-blue-600 dark:bg-emerald-600 text-white shadow-xs font-bold'
                      : 'hover:bg-white dark:hover:bg-surface-dark-secondary text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Bugun
                </button>
                <button
                  type="button"
                  onClick={() => handleSetRelativeDate(1)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg hover:bg-white dark:hover:bg-surface-dark-secondary transition-colors text-gray-700 dark:text-gray-300"
                >
                  Ertaga
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 text-xs py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
                <span className="text-xs text-gray-400 hidden sm:inline">
                  {new Date(date).toLocaleDateString('uz-UZ', { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Teacher Search */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setGlobalSearchQuery(e.target.value);
                }}
                placeholder="Ustoz yoki guruh bo‘yicha qidirish..."
                className="w-full text-xs pl-9 pr-8 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-surface-dark-tertiary focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-gray-100"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setGlobalSearchQuery('');
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Status Tab Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-gray-100 dark:border-gray-800 pt-3 text-xs">
            {[
              { id: 'all', label: 'Barchasi', count: stats.total },
              { id: 'present', label: 'Kelganlar', count: stats.present, color: 'text-emerald-600' },
              { id: 'auto', label: '⚡ Dars o‘tganlar', count: stats.autoPresent, color: 'text-teal-600 font-bold' },
              { id: 'late', label: 'Kechikkanlar', count: stats.late, color: 'text-amber-600' },
              { id: 'excused', label: 'Sabablilar', count: stats.excused, color: 'text-blue-600' },
              { id: 'absent', label: 'Kelmaganlar', count: stats.absent, color: 'text-rose-600' },
              { id: 'pending', label: 'Kutilmoqda', count: stats.pending, color: 'text-gray-500' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id)}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === st.id
                    ? (st.id === 'all'
                        ? 'bg-blue-600 dark:bg-emerald-600 text-white shadow-xs font-bold'
                        : st.id === 'late'
                        ? 'bg-amber-600 text-white shadow-xs font-bold'
                        : st.id === 'excused'
                        ? 'bg-blue-600 text-white shadow-xs font-bold'
                        : st.id === 'absent'
                        ? 'bg-rose-600 text-white shadow-xs font-bold'
                        : 'bg-emerald-600 text-white shadow-xs font-bold')
                    : 'bg-gray-100 hover:bg-gray-200 dark:bg-surface-dark-tertiary dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <span>{st.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    statusFilter === st.id
                      ? 'bg-white/25 text-white'
                      : 'bg-white dark:bg-surface-dark-secondary text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {st.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Teachers List / Table */}
      <Card noPadding>
        {loading ? (
          <div className="py-16 text-center text-gray-500">
            <RotateCcw className="w-8 h-8 mx-auto animate-spin text-emerald-600 mb-2" />
            <p className="text-sm font-semibold">O‘qituvchilar davomati yuklanmoqda...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <GraduationCap className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Hech qanday o‘qituvchi topilmadi
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Qidiruv so‘zini o‘zgartiring yoki boshqa sanani tanlang
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredRecords.map((row) => {
              const isPresent = row.status === 'present';
              const isLate = row.status === 'late';
              const isExcused = row.status === 'excused';
              const isAbsent = row.status === 'absent';
              const isPending = row.status === 'pending';

              return (
                <div
                  key={row.teacher_id}
                  className={`p-4 transition-colors hover:bg-gray-50/60 dark:hover:bg-surface-dark-tertiary/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    row.is_auto
                      ? 'bg-emerald-50/20 dark:bg-emerald-950/10'
                      : ''
                  }`}
                >
                  {/* Left: Teacher Info & Groups */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-[280px]">
                    <Avatar
                      name={row.teacher?.fullName}
                      size="md"
                      src={row.teacher?.avatar_url}
                      className="ring-2 ring-emerald-500/20"
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                          {row.teacher?.fullName}
                        </h4>
                        <span className="text-xs text-gray-400 font-mono">
                          @{row.teacher?.username}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1 flex-wrap">
                        {row.teacher?.phone && (
                          <a
                            href={`tel:${row.teacher.phone}`}
                            className="inline-flex items-center gap-1 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                          >
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span>{row.teacher.phone}</span>
                          </a>
                        )}

                        {/* Assigned Groups Chips */}
                        <div className="flex items-center gap-1 flex-wrap">
                          <BookOpen className="w-3 h-3 text-gray-400" />
                          {(row.groups || []).length > 0 ? (
                            (row.groups || []).map((g) => (
                              <span
                                key={g.id}
                                className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-gray-100 dark:bg-surface-dark-tertiary text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                              >
                                {g.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-gray-400 italic">Guruh biriktirilmagan</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Lesson & Smart Auto-detection Details */}
                  <div className="min-w-[220px]">
                    {row.conducted_lesson ? (
                      <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-300">
                          <Zap className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
                          <span>Dars o‘tdi (Talabalar davomati olingan)</span>
                        </div>
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                          {row.auto_lesson_info || 'Guruh mashgʻuloti'}
                        </p>
                      </div>
                    ) : row.today_schedules && row.today_schedules.length > 0 ? (
                      <div className="text-xs space-y-1">
                        <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 font-semibold">
                          <Clock className="w-3.5 h-3.5 text-brand-navy dark:text-blue-400" />
                          <span>
                            {row.today_schedules[0].start_time?.slice(0, 5)} - {row.today_schedules[0].end_time?.slice(0, 5)}
                          </span>
                          <span className="text-[10px] text-gray-400">({row.today_schedules[0].room})</span>
                        </div>
                        <span className="text-[11px] text-gray-400 block">
                          Dars jadvali mavjud (Hali davomat olinmagan)
                        </span>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 italic">
                        Shu kuni dars jadvali belgilanmagan
                      </div>
                    )}
                  </div>

                  {/* Status Badge & Check-In Time */}
                  <div className="min-w-[190px]">
                    <div className="flex items-center gap-2">
                      {isPresent && (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${
                            row.is_auto
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {row.is_auto ? (
                            <>
                              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                              <span>Kelgan (Dars o‘tgan)</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Kelgan (Admin)</span>
                            </>
                          )}
                        </span>
                      )}

                      {isLate && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-500/30 inline-flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Kechikkan</span>
                        </span>
                      )}

                      {isExcused && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-500/30 inline-flex items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                          <span>Sababli</span>
                        </span>
                      )}

                      {isAbsent && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-500/30 inline-flex items-center gap-1.5">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Kelmagan</span>
                        </span>
                      )}

                      {isPending && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 dark:bg-surface-dark-tertiary dark:text-gray-400 border border-gray-200 dark:border-gray-700 inline-flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span>Kutilmoqda</span>
                        </span>
                      )}
                    </div>

                    {/* Check-In Timestamp */}
                    {row.check_in_time && (
                      <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {new Date(row.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {row.marked_by === 'system' && (
                          <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold">• Avtomatik</span>
                        )}
                      </p>
                    )}

                    {/* Notes preview */}
                    {row.notes && (
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 italic line-clamp-1 mt-0.5">
                        {row.notes}
                      </p>
                    )}
                  </div>

                  {/* Right: Quick Action Buttons for Admin */}
                  <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                    <button
                      type="button"
                      title="Kelgan deb belgilash"
                      onClick={() => handleQuickMark(row.teacher_id, 'present')}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        isPresent
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/60 dark:text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      ✓ Kelgan
                    </button>

                    <button
                      type="button"
                      title="Kechikkan deb belgilash"
                      onClick={() => handleQuickMark(row.teacher_id, 'late')}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        isLate
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:hover:bg-amber-950/60 dark:text-amber-300 border-amber-500/30'
                      }`}
                    >
                      ⏳ Kechikkan
                    </button>

                    <button
                      type="button"
                      title="Sababli deb belgilash"
                      onClick={() => handleQuickMark(row.teacher_id, 'excused')}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        isExcused
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:hover:bg-blue-950/60 dark:text-blue-300 border-blue-500/30'
                      }`}
                    >
                      📋 Sababli
                    </button>

                    <button
                      type="button"
                      title="Kelmagan deb belgilash"
                      onClick={() => handleQuickMark(row.teacher_id, 'absent')}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        isAbsent
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:hover:bg-rose-950/60 dark:text-rose-300 border-rose-500/30'
                      }`}
                    >
                      ✕ Kelmagan
                    </button>

                    <button
                      type="button"
                      title="Izoh va sabab yozish"
                      onClick={() => handleOpenNoteModal(row)}
                      className="p-1.5 rounded-xl text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-surface-dark-tertiary transition-colors border border-gray-200 dark:border-gray-700 cursor-pointer"
                    >
                      <Pencil className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Note & Status Detail Modal */}
      {selectedRecordForNote && (
        <Modal
          isOpen={!!selectedRecordForNote}
          onClose={() => setSelectedRecordForNote(null)}
          title="Ustoz davomati va ma'muriy izoh"
          subtitle={selectedRecordForNote.teacher?.fullName}
          size="md"
        >
          <div className="space-y-4">
            {/* Status Choice */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 block mb-2">
                Davomat holati
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'present', label: 'Kelgan', color: 'bg-emerald-600' },
                  { id: 'late', label: 'Kechikkan', color: 'bg-amber-600' },
                  { id: 'excused', label: 'Sababli', color: 'bg-blue-600' },
                  { id: 'absent', label: 'Kelmagan', color: 'bg-rose-600' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setNoteStatus(s.id)}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      noteStatus === s.id
                        ? `${s.color} text-white border-transparent shadow-xs`
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-surface-dark-tertiary text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Note text */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 block mb-1">
                Admin izohi / Sababi
              </label>
              <textarea
                rows={3}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Masalan: Tirbandlik sababli 15 daqiqa kechikib keldi yoki kasalligi sababli dars o'rinbosarga berildi..."
                className="w-full text-xs p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-800">
              <Button variant="ghost" size="sm" onClick={() => setSelectedRecordForNote(null)}>
                Bekor qilish
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={savingNote}
                onClick={handleSaveNoteModal}
                className="!bg-blue-600 hover:!bg-blue-700 dark:!bg-emerald-600 dark:hover:!bg-emerald-500 text-white"
              >
                Saqlash
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
