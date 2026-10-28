import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  Clock,
  Phone,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Users,
  GraduationCap,
  ArrowRight,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  Trash2,
  CalendarDays,
  Sparkles,
  MapPin,
  User,
  SlidersHorizontal,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import DatePicker from '@/components/ui/DatePicker';
import TimePicker from '@/components/ui/TimePicker';
import { toast } from '@/components/ui/Toast';
import {
  getStudentReminders,
  createStudentReminder,
  completeStudentReminder,
  postponeStudentReminder,
  deleteStudentReminder,
} from '@/services/reminderService';
import { localStore } from '@/lib/localStore';
import { formatUzPhone } from '@/utils/phoneFormat';

export default function RemindersPage() {
  const { t } = useTranslation();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'trial' | 'today' | 'upcoming' | 'completed'

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [completeModalItem, setCompleteModalItem] = useState(null);
  const [completeNote, setCompleteNote] = useState('');

  // Form state for creating a new reminder / trial lesson
  const [formData, setFormData] = useState({
    student_name: '',
    student_phone: '+998',
    father_phone: '',
    mother_phone: '',
    type: 'trial_lesson', // 'trial_lesson' | 'call' | 'general'
    group_id: '',
    due_date: new Date().toISOString().split('T')[0],
    due_time: '18:00',
    room: '101-xona',
    teacher_name: '',
    note: '',
  });

  // Groups and courses list for select dropdowns
  const groups = useMemo(() => {
    try {
      return localStore.getGroups ? localStore.getGroups() : [];
    } catch {
      return [];
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getStudentReminders();
      setReminders(data || []);
    } catch (err) {
      console.error('Failed to load reminders:', err);
      toast.error('Eslatmalarni yuklab bo‘lmadi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Listen to local storage sync events
    const handleSync = () => loadData();
    window.addEventListener('educo-data-sync', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('educo-data-sync', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];

  // Filtered lists
  const stats = useMemo(() => {
    const todayDue = reminders.filter(
      (r) => r.status === 'pending' && r.due_date <= todayStr
    ).length;
    const trials = reminders.filter(
      (r) => r.type === 'trial_lesson' || (r.note && r.note.toLowerCase().includes('sinov'))
    ).length;
    const calls = reminders.filter(
      (r) => r.type === 'call' || (!r.type && r.status === 'pending')
    ).length;
    const completed = reminders.filter((r) => r.status === 'completed').length;

    return { todayDue, trials, calls, completed, total: reminders.length };
  }, [reminders, todayStr]);

  const filteredReminders = useMemo(() => {
    let list = reminders;

    // Tab filter
    if (activeTab === 'trial') {
      list = list.filter(
        (r) => r.type === 'trial_lesson' || (r.note && r.note.toLowerCase().includes('sinov'))
      );
    } else if (activeTab === 'today') {
      list = list.filter((r) => r.status === 'pending' && r.due_date <= todayStr);
    } else if (activeTab === 'upcoming') {
      list = list.filter((r) => r.status === 'pending' && r.due_date > todayStr);
    } else if (activeTab === 'completed') {
      list = list.filter((r) => r.status === 'completed');
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          (r.student_name && r.student_name.toLowerCase().includes(q)) ||
          (r.student_phone && r.student_phone.includes(q)) ||
          (r.father_phone && r.father_phone.includes(q)) ||
          (r.group_name && r.group_name.toLowerCase().includes(q)) ||
          (r.course_name && r.course_name.toLowerCase().includes(q)) ||
          (r.teacher_name && r.teacher_name.toLowerCase().includes(q)) ||
          (r.note && r.note.toLowerCase().includes(q))
      );
    }

    return list;
  }, [reminders, activeTab, searchQuery, todayStr]);

  // Handle Complete
  const handleOpenComplete = (item) => {
    setCompleteModalItem(item);
    setCompleteNote(
      item.type === 'trial_lesson'
        ? 'Sinov darsida qatnashdi va kursga yozildi'
        : 'Ota-onasi bilan gaplashildi va kelishildi'
    );
  };

  const handleConfirmComplete = async () => {
    if (!completeModalItem) return;
    try {
      await completeStudentReminder(completeModalItem.id, completeNote);
      toast.success(`${completeModalItem.student_name} bo‘yicha eslatma bajarildi!`);
      setCompleteModalItem(null);
      loadData();
    } catch {
      toast.error('Xatolik yuz berdi');
    }
  };

  // Handle Postpone
  const handlePostpone = async (id, days) => {
    try {
      await postponeStudentReminder(id, days);
      toast.info(`Eslatma ${days} kunga keyinga surildi`);
      loadData();
    } catch {
      toast.error('Xatolik yuz berdi');
    }
  };

  // Handle Delete
  const handleDelete = async (id, name) => {
    if (!window.confirm(`${name} eslatmasini o‘chirishni tasdiqlaysizmi?`)) return;
    try {
      await deleteStudentReminder(id);
      toast.success('Eslatma muvaffaqiyatli o‘chirildi');
      loadData();
    } catch {
      toast.error('O‘chirishda xatolik');
    }
  };

  // Handle Create Submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.student_name.trim()) {
      toast.error('O‘quvchi ismini kiriting');
      return;
    }

    // Resolve selected group details
    const selGroup = groups.find((g) => g.id === formData.group_id);

    try {
      await createStudentReminder({
        ...formData,
        group_name: selGroup ? selGroup.name : 'Guruhsiz',
        course_name: selGroup ? selGroup.course_name : formData.course_name || '',
        teacher_name: selGroup ? selGroup.teacher_name : formData.teacher_name || '',
        room: selGroup ? selGroup.room : formData.room || '',
      });

      toast.success(
        formData.type === 'trial_lesson'
          ? 'Yangi sinov darsi muvaffaqiyatli rejalashtirildi!'
          : 'Yangi eslatma muvaffaqiyatli saqlandi!'
      );

      setIsCreateModalOpen(false);
      setFormData({
        student_name: '',
        student_phone: '+998',
        father_phone: '',
        mother_phone: '',
        type: 'trial_lesson',
        group_id: '',
        due_date: todayStr,
        due_time: '18:00',
        room: '101-xona',
        teacher_name: '',
        note: '',
      });
      loadData();
    } catch {
      toast.error('Saqlashda xatolik yuz berdi');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-emerald-950/60 text-blue-800 dark:text-emerald-300 border border-blue-200 dark:border-emerald-800 text-xs font-bold mb-2">
            <Bell className="w-3.5 h-3.5" />
            <span>Administrator & Resepshn eslatmalari</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Eslatmalar va Sinov darslari
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Yangi o‘quvchilar sinov darslari, qo‘ng‘iroqlar va kelishuvlar monitoringi
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            onClick={loadData}
            disabled={loading}
            icon={RefreshCw}
            className={loading ? 'animate-spin' : ''}
          >
            Yangilash
          </Button>

          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            icon={Plus}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 shadow-md"
          >
            + Yangi eslatma / Sinov darsi
          </Button>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div
          onClick={() => setActiveTab('today')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'today'
              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-400 ring-2 ring-amber-500/25'
              : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-amber-700 dark:text-amber-400">
              Bugun bajarilishi kerak
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-2">
            {stats.todayDue}
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">Muddati kelgan yoki o‘tgan</p>
        </div>

        <div
          onClick={() => setActiveTab('trial')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'trial'
              ? 'bg-purple-50 dark:bg-purple-950/30 border-purple-400 ring-2 ring-purple-500/25'
              : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-purple-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-purple-700 dark:text-purple-400">
              Sinov darslari
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-2">
            {stats.trials}
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">Yangi o‘quvchi sinovlari</p>
        </div>

        <div
          onClick={() => setActiveTab('upcoming')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'upcoming'
              ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-400 ring-2 ring-blue-500/25'
              : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-blue-700 dark:text-blue-400">
              Kutilayotganlar
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-2">
            {reminders.filter((r) => r.status === 'pending' && r.due_date > todayStr).length}
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">Kelgusi kunlar jadvali</p>
        </div>

        <div
          onClick={() => setActiveTab('completed')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'completed'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 ring-2 ring-emerald-500/25'
              : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-emerald-700 dark:text-emerald-400">
              Bajarilganlar
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-2">
            {stats.completed}
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">Kelishilgan & o‘tkazilgan</p>
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <Card noPadding>
        <div className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-gray-100 dark:bg-gray-800">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'all'
                    ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                Barchasi ({stats.total})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('trial')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'trial'
                    ? 'bg-purple-600 text-white shadow-xs font-black'
                    : 'text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Sinov darslari ({stats.trials})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('today')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'today'
                    ? 'bg-amber-500 text-white shadow-xs font-black'
                    : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Bugun ({stats.todayDue})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('upcoming')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'upcoming'
                    ? 'bg-blue-600 dark:bg-emerald-600 text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                Kutilayotganlar
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('completed')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'completed'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Bajarilgan ({stats.completed})</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="O‘quvchi, telefon, guruh..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-emerald-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Reminders List */}
      <div className="space-y-3.5">
        {filteredReminders.length === 0 ? (
          <div className="py-16 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-emerald-950/40 text-blue-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <Bell className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Hech qanday eslatma topilmadi
            </h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              {searchQuery
                ? 'Qidiruv bo‘yicha mos eslatma yoki sinov darsi topilmadi.'
                : 'Ushbu bo‘limda hozircha eslatmalar mavjud emas. Yangi sinov darsi yoki eslatma qo‘shishingiz mumkin.'}
            </p>
            <Button
              variant="primary"
              onClick={() => setIsCreateModalOpen(true)}
              icon={Plus}
              className="mt-2"
            >
              + Yangi eslatma qo‘shish
            </Button>
          </div>
        ) : (
          filteredReminders.map((item) => {
            const isDueToday = item.status === 'pending' && item.due_date <= todayStr;
            const isCompleted = item.status === 'completed';
            const isTrial =
              item.type === 'trial_lesson' ||
              (item.note && item.note.toLowerCase().includes('sinov'));

            return (
              <div
                key={item.id}
                className={`rounded-2xl border p-4 sm:p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isCompleted
                    ? 'bg-gray-50/70 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800 opacity-80'
                    : isDueToday
                    ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/80 shadow-sm'
                    : isTrial
                    ? 'bg-purple-50/30 dark:bg-purple-950/15 border-purple-200 dark:border-purple-900/50'
                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-2xs'
                }`}
              >
                {/* Left Side: Student Info & Meta */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 shadow-sm ${
                      isCompleted
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                        : isTrial
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-6 h-6" />
                    ) : isTrial ? (
                      <GraduationCap className="w-6 h-6" />
                    ) : (
                      <Phone className="w-5 h-5" />
                    )}
                  </div>

                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-extrabold text-base text-gray-900 dark:text-white truncate">
                        {item.student_name}
                      </h3>

                      {/* Type Badge */}
                      {isTrial ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-800 flex items-center gap-1">
                          <GraduationCap className="w-3 h-3" />
                          <span>Sinov darsi</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>Qo‘ng‘iroq / Eslatma</span>
                        </span>
                      )}

                      {/* Status Indicator */}
                      {isCompleted ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          ✓ Bajarilgan
                        </span>
                      ) : isDueToday ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                          Bugun muddati!
                        </span>
                      ) : null}
                    </div>

                    {/* Course / Group / Teacher / Room */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600 dark:text-gray-300 font-medium">
                      {item.course_name && (
                        <span className="text-blue-600 dark:text-emerald-400 font-bold">
                          {item.course_name}
                        </span>
                      )}
                      {item.group_name && item.group_name !== 'Guruhsiz' && (
                        <span>• Guruh: {item.group_name}</span>
                      )}
                      {item.teacher_name && <span>• Ustoz: {item.teacher_name}</span>}
                      {item.room && <span>• Xona: {item.room}</span>}
                    </div>

                    {/* Note / Purpose */}
                    {item.note && (
                      <p className="text-xs text-gray-700 dark:text-gray-300 bg-white/70 dark:bg-gray-800/60 p-2 rounded-xl border border-gray-100 dark:border-gray-800">
                        {item.note}
                      </p>
                    )}

                    {/* Completed note if done */}
                    {isCompleted && item.completed_note && (
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-1.5 rounded-lg border border-emerald-200 dark:border-emerald-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Natija: {item.completed_note}</span>
                      </p>
                    )}

                    {/* Phones list */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {item.student_phone && (
                        <a
                          href={`tel:${item.student_phone}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold transition-colors"
                        >
                          <Phone className="w-3 h-3" />
                          <span>O‘quvchi: {formatUzPhone(item.student_phone)}</span>
                        </a>
                      )}

                      {item.father_phone && (
                        <a
                          href={`tel:${item.father_phone}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-colors"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Otasi: {formatUzPhone(item.father_phone)}</span>
                        </a>
                      )}

                      {item.mother_phone && (
                        <a
                          href={`tel:${item.mother_phone}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold transition-colors"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Onasi: {formatUzPhone(item.mother_phone)}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side: Scheduled Date/Time & Actions */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-gray-800">
                  {/* Date & Time */}
                  <div className="text-left md:text-right font-mono text-xs space-y-0.5">
                    <div className="flex items-center md:justify-end gap-1.5 font-bold text-gray-900 dark:text-white">
                      <Calendar className="w-3.5 h-3.5 text-blue-500 dark:text-emerald-400" />
                      <span>{item.due_date}</span>
                    </div>
                    {item.due_time && (
                      <div className="flex items-center md:justify-end gap-1.5 text-gray-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{item.due_time}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {!isCompleted && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenComplete(item)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isTrial ? 'Dars o‘tildi' : 'Bog‘lanildi'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handlePostpone(item.id, 1)}
                          className="px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold transition-colors cursor-pointer"
                          title="1 kunga keyinga surish"
                        >
                          +1 kun
                        </button>

                        <button
                          type="button"
                          onClick={() => handlePostpone(item.id, 3)}
                          className="px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold transition-colors cursor-pointer"
                          title="3 kunga keyinga surish"
                        >
                          +3 kun
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id, item.student_name)}
                      className="p-1.5 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="O‘chirish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Create New Reminder / Trial Lesson */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Yangi eslatma / Sinov darsi qo‘shish"
        size="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {/* Reminder Type Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
              Eslatma turi
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setFormData((p) => ({ ...p, type: 'trial_lesson' }))}
                className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                  formData.type === 'trial_lesson'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 ring-2 ring-purple-500/20 text-purple-900 dark:text-purple-200 font-bold'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-extrabold">🎓 Sinov darsi</div>
                  <div className="text-[11px] opacity-75">Yangi o‘quvchini 1-darsga chaqirish</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData((p) => ({ ...p, type: 'call' }))}
                className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                  formData.type === 'call'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 ring-2 ring-amber-500/20 text-amber-900 dark:text-amber-200 font-bold'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-extrabold">📞 Qo‘ng‘iroq / Qayta bog‘lanish</div>
                  <div className="text-[11px] opacity-75">Dars kuni yoki to‘lovni eslatish</div>
                </div>
              </button>
            </div>
          </div>

          {/* Student Name */}
          <Input
            label="O‘quvchining F.I.SH."
            placeholder="Masalan: Diyorbek Karimov"
            value={formData.student_name}
            onChange={(e) => setFormData((p) => ({ ...p, student_name: e.target.value }))}
            required
          />

          {/* Phone Numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="O‘quvchi telefoni"
              placeholder="+998901234567"
              value={formData.student_phone}
              onChange={(e) => setFormData((p) => ({ ...p, student_phone: e.target.value }))}
            />
            <Input
              label="Ota-onasining telefoni"
              placeholder="+998909876543"
              value={formData.father_phone}
              onChange={(e) => setFormData((p) => ({ ...p, father_phone: e.target.value }))}
            />
          </div>

          {/* Group / Direction Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <Select
                label="O‘quv guruhi"
                value={formData.group_id}
                onChange={(e) => setFormData((p) => ({ ...p, group_id: e.target.value }))}
                headerTitle="Guruhni tanlang"
                options={[
                  { value: '', label: 'Guruh tanlanmagan (Umumiy)' },
                  ...groups.map((g) => ({
                    value: g.id,
                    label: g.name,
                    subtitle: g.course_name || 'Kurs',
                  })),
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                Auditoriya (Xona)
              </label>
              <input
                type="text"
                placeholder="101-xona"
                value={formData.room}
                onChange={(e) => setFormData((p) => ({ ...p, room: e.target.value }))}
                className="w-full h-11 px-3.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Date & Time Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                Eslatma / Dars sanasi
              </label>
              <DatePicker
                value={formData.due_date}
                onChange={(val) => setFormData((p) => ({ ...p, due_date: val }))}
                placeholder="Sanani tanlang..."
                className="w-full"
              />
            </div>

            <div>
              <TimePicker
                label="Vaqti (Toshkent vaqti)"
                value={formData.due_time || '10:00'}
                onChange={(val) => setFormData((p) => ({ ...p, due_time: val }))}
              />
            </div>
          </div>

          {/* Purpose / Note */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
              Eslatma maqsadi va izoh
            </label>
            <textarea
              rows={3}
              placeholder="Masalan: 1-sinov darsiga taklif qilingan, noutbuk olib kelishi lozim..."
              value={formData.note}
              onChange={(e) => setFormData((p) => ({ ...p, note: e.target.value }))}
              className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <Button variant="ghost" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Bekor qilish
            </Button>
            <Button variant="primary" type="submit" icon={Check}>
              Saqlash
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Mark Complete with Note */}
      <Modal
        isOpen={Boolean(completeModalItem)}
        onClose={() => setCompleteModalItem(null)}
        title="Eslatmani bajarildi deb qayd etish"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <strong className="text-gray-900 dark:text-white">
              {completeModalItem?.student_name}
            </strong>{' '}
            bo‘yicha natija yoki kelishuv xulosasini kiriting:
          </p>

          <textarea
            rows={3}
            value={completeNote}
            onChange={(e) => setCompleteNote(e.target.value)}
            className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <Button variant="ghost" onClick={() => setCompleteModalItem(null)}>
              Bekor qilish
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmComplete}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white"
              icon={Check}
            >
              Tasdiqlash
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
