import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Star,
  Award,
  TrendingUp,
  Users,
  Lightbulb,
  AlertTriangle,
  Search,
  Filter,
  Download,
  CheckCircle2,
  Lock,
  MessageSquare,
  GraduationCap,
  BookOpen,
  Calendar,
  Sparkles,
  Trash2,
  RefreshCw,
  Eye,
  BarChart3,
  ThumbsUp,
  HeartHandshake,
  Layers,
  ChevronRight,
  Info,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import { localStore } from '@/lib/localStore';
import { Button, Card, Badge, Avatar, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, toast } from '@/components/ui';

export default function TeacherRatingsPage() {
  const { t } = useTranslation();
  const { user, profile } = useAuth();

  const userRole = String(profile?.role || user?.user_metadata?.role || 'owner').toLowerCase();
  const isTeacher = userRole === 'teacher';
  const currentUserId = localStore.normalizeUserId(user?.id || profile?.id);

  // States
  const [feedbacks, setFeedbacks] = useState([]);
  const [activeTab, setActiveTab] = useState('leaderboard'); // 'leaderboard' | 'reviews' | 'analytics'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState('ALL');
  const [selectedRatingFilter, setSelectedRatingFilter] = useState('ALL'); // 'ALL' | '9-10' | '7-8' | '5-6' | '1-4'
  const [onlySuggestions, setOnlySuggestions] = useState(false);
  const [onlyComplaints, setOnlyComplaints] = useState(false);

  // Load Feedbacks from localStore
  const loadFeedbacks = () => {
    const allFb = localStore.getTeacherFeedbacks ? localStore.getTeacherFeedbacks() : [];
    if (isTeacher) {
      setFeedbacks(allFb.filter((fb) => localStore.normalizeUserId(fb.teacher_id) === currentUserId));
    } else {
      setFeedbacks(allFb);
    }
  };

  useEffect(() => {
    loadFeedbacks();
  }, [userRole, currentUserId]);

  // Load teachers and groups
  const allUsers = localStore.getUsers ? localStore.getUsers() : [];
  const allGroups = localStore.getGroups ? localStore.getGroups() : [];
  const teachersList = useMemo(() => {
    return allUsers.filter((u) => u.role === 'teacher');
  }, [allUsers]);

  // Subject color mapping
  const getSubjectColorStyles = (subject = '') => {
    const s = subject.toLowerCase();
    if (s.includes('matematika')) {
      return {
        borderLeft: 'border-l-4 border-l-emerald-500',
        badgeBg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
        progressGradient: 'from-emerald-400 to-teal-500',
        icon: '📐',
      };
    }
    if (s.includes('ingliz')) {
      return {
        borderLeft: 'border-l-4 border-l-blue-500',
        badgeBg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
        progressGradient: 'from-blue-400 to-indigo-500',
        icon: '🇬🇧',
      };
    }
    if (s.includes('rus')) {
      return {
        borderLeft: 'border-l-4 border-l-orange-500',
        badgeBg: 'bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-200 dark:border-orange-800',
        progressGradient: 'from-orange-400 to-amber-500',
        icon: '🇷🇺',
      };
    }
    if (s.includes('mental')) {
      return {
        borderLeft: 'border-l-4 border-l-purple-500',
        badgeBg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
        progressGradient: 'from-purple-400 to-indigo-500',
        icon: '🧮',
      };
    }
    if (s.includes('arab')) {
      return {
        borderLeft: 'border-l-4 border-l-teal-500',
        badgeBg: 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800',
        progressGradient: 'from-teal-400 to-cyan-500',
        icon: '📖',
      };
    }
    if (s.includes('it') || s.includes('full') || s.includes('dastur')) {
      return {
        borderLeft: 'border-l-4 border-l-indigo-500',
        badgeBg: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800',
        progressGradient: 'from-indigo-400 to-violet-500',
        icon: '💻',
      };
    }
    if (s.includes('shaxmat')) {
      return {
        borderLeft: 'border-l-4 border-l-amber-500',
        badgeBg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
        progressGradient: 'from-amber-400 to-yellow-500',
        icon: '♟️',
      };
    }
    return {
      borderLeft: 'border-l-4 border-l-blue-500',
      badgeBg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
      progressGradient: 'from-blue-400 to-indigo-500',
      icon: '📚',
    };
  };

  // Aggregated Teacher Statistics (Leaderboard)
  const teacherStats = useMemo(() => {
    const statsMap = {};

    // Initialize all active teachers (default to 0)
    teachersList.forEach((tc) => {
      const tcGroups = allGroups.filter(
        (g) => localStore.normalizeUserId(g.teacher_id) === localStore.normalizeUserId(tc.id)
      );
      const studentCount = tcGroups.reduce(
        (acc, g) => acc + (Array.isArray(g.student_ids) ? g.student_ids.length : 0),
        0
      );

      statsMap[tc.id] = {
        id: tc.id,
        name: tc.full_name || 'Ustoz',
        avatar_url: tc.avatar_url || null,
        phone: tc.phone || '',
        subject: tc.subject || tcGroups[0]?.course_name || 'Fan o‘qituvchisi',
        groupCount: tcGroups.length,
        studentCount: studentCount > 0 ? studentCount : (tcGroups.length * 15),
        ratings: [],
        satisfactions: { 'Juda aʼlo': 0, 'Yaxshi': 0, 'Oʻrtacha': 0, 'Qoniqarsiz': 0 },
        suggestionsCount: 0,
        complaintsCount: 0,
        latestSuggestion: '',
        averageRating: 0,
        totalReviews: 0,
      };
    });

    // Populate with real feedbacks (if any exist)
    feedbacks.forEach((fb) => {
      let tId = fb.teacher_id;
      let matchedKey = Object.keys(statsMap).find(
        (key) => localStore.normalizeUserId(key) === localStore.normalizeUserId(tId)
      );

      if (!matchedKey) {
        matchedKey = tId;
        statsMap[tId] = {
          id: tId,
          name: fb.teacher_name || 'Ustoz',
          avatar_url: null,
          phone: '',
          subject: fb.subject || 'O‘qituvchi',
          groupCount: 1,
          studentCount: 15,
          ratings: [],
          satisfactions: { 'Juda aʼlo': 0, 'Yaxshi': 0, 'Oʻrtacha': 0, 'Qoniqarsiz': 0 },
          suggestionsCount: 0,
          complaintsCount: 0,
          latestSuggestion: '',
          averageRating: 0,
          totalReviews: 0,
        };
      }

      const st = statsMap[matchedKey];
      if (fb.rating) st.ratings.push(Number(fb.rating));
      if (fb.satisfaction && st.satisfactions[fb.satisfaction] !== undefined) {
        st.satisfactions[fb.satisfaction] += 1;
      }
      if (fb.suggestions?.trim()) {
        st.suggestionsCount += 1;
        if (!st.latestSuggestion) st.latestSuggestion = fb.suggestions.trim();
      }
      if (fb.complaints?.trim()) st.complaintsCount += 1;
    });

    // Calculate averages & format
    const result = Object.values(statsMap).map((st) => {
      const count = st.ratings.length;
      const sum = st.ratings.reduce((a, b) => a + b, 0);
      const avg = count > 0 ? sum / count : 0;
      return {
        ...st,
        totalReviews: count,
        averageRating: Number(avg.toFixed(1)),
      };
    });

    // Sort by average rating descending, then total reviews descending, then by name
    result.sort((a, b) => {
      if (b.averageRating !== a.averageRating) return b.averageRating - a.averageRating;
      if (b.totalReviews !== a.totalReviews) return b.totalReviews - a.totalReviews;
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [teachersList, allGroups, feedbacks]);

  // Overall Center KPIs
  const overallKPIs = useMemo(() => {
    const totalFb = feedbacks.length;
    const allScores = feedbacks.map((f) => Number(f.rating) || 0).filter((s) => s > 0);
    const avgScore =
      allScores.length > 0 ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1) : '0.0';
    const topTeacher = teacherStats.find((t) => t.totalReviews > 0) || null;
    const totalSuggestions = feedbacks.filter((f) => f.suggestions?.trim()).length;
    const totalComplaints = feedbacks.filter((f) => f.complaints?.trim()).length;
    const positiveCount = feedbacks.filter(
      (f) => f.rating >= 8 || f.satisfaction === 'Juda aʼlo' || f.satisfaction === 'Yaxshi'
    ).length;
    const satisfactionRate = totalFb > 0 ? Math.round((positiveCount / totalFb) * 100) : 0;

    return {
      totalFb,
      avgScore,
      topTeacher,
      totalSuggestions,
      totalComplaints,
      satisfactionRate,
    };
  }, [feedbacks, teacherStats]);

  // Filtered reviews feed
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((fb) => {
      if (selectedTeacherFilter !== 'ALL' && fb.teacher_id !== selectedTeacherFilter) {
        return false;
      }
      if (selectedRatingFilter === '9-10' && fb.rating < 9) return false;
      if (selectedRatingFilter === '7-8' && (fb.rating < 7 || fb.rating > 8)) return false;
      if (selectedRatingFilter === '5-6' && (fb.rating < 5 || fb.rating > 6)) return false;
      if (selectedRatingFilter === '1-4' && fb.rating > 4) return false;
      if (onlySuggestions && !fb.suggestions?.trim()) return false;
      if (onlyComplaints && !fb.complaints?.trim()) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchStudent = (fb.student_name || '').toLowerCase().includes(q);
        const matchTeacher = (fb.teacher_name || '').toLowerCase().includes(q);
        const matchSubject = (fb.subject || '').toLowerCase().includes(q);
        const matchGroup = (fb.group_name || '').toLowerCase().includes(q);
        const matchSug = (fb.suggestions || '').toLowerCase().includes(q);
        const matchComp = (fb.complaints || '').toLowerCase().includes(q);
        if (!matchStudent && !matchTeacher && !matchSubject && !matchGroup && !matchSug && !matchComp) {
          return false;
        }
      }

      return true;
    });
  }, [feedbacks, selectedTeacherFilter, selectedRatingFilter, onlySuggestions, onlyComplaints, searchQuery]);

  // Actions
  const handleMarkReviewed = (id) => {
    localStore.updateTeacherFeedbackStatus(id, 'reviewed');
    toast.success('Fidbek "Ko‘rib chiqildi" deb belgilandi');
    loadFeedbacks();
  };

  const handleDelete = (id) => {
    if (window.confirm('Ushbu fikr-mulohazani o‘chirishni tasdiqlaysizmi?')) {
      localStore.deleteTeacherFeedback(id);
      toast.success('Fikr-mulohaza muvaffaqiyatli o‘chirildi');
      loadFeedbacks();
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (feedbacks.length === 0) {
      toast.error('Hozircha eksport qilish uchun fikr-mulohazalar mavjud emas');
      return;
    }

    const headers = [
      'ID',
      'Ustoz',
      'Fan',
      'Guruh',
      'O‘quvchi',
      'Anonim',
      'Baho (1-10)',
      'Mamnunlik',
      'Takliflar',
      'Shikoyatlar',
      'Sana',
      'Holati',
    ];

    const rows = feedbacks.map((fb) => [
      fb.id,
      `"${(fb.teacher_name || '').replace(/"/g, '""')}"`,
      `"${(fb.subject || '').replace(/"/g, '""')}"`,
      `"${(fb.group_name || '').replace(/"/g, '""')}"`,
      `"${(fb.is_anonymous ? 'Anonim' : fb.student_name || '').replace(/"/g, '""')}"`,
      fb.is_anonymous ? 'Ha' : 'Yo‘q',
      fb.rating,
      `"${fb.satisfaction || ''}"`,
      `"${(fb.suggestions || '').replace(/"/g, '""')}"`,
      `"${(fb.complaints || '').replace(/"/g, '""')}"`,
      new Date(fb.created_at).toLocaleDateString('uz-UZ'),
      fb.status || 'new',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Oqtuvchilar_Reytingi_Fidbeklar_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Reyting va fikrlar hisoboti CSV formatida yuklab olindi!');
  };

  // Render Medal Badge (Never truncated)
  const renderMedalBadge = (rank, hasRatings) => {
    if (!hasRatings) {
      return (
        <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-extrabold text-xs sm:text-sm flex items-center justify-center shrink-0 border border-gray-200 dark:border-gray-700">
          #{rank}
        </span>
      );
    }
    if (rank === 1) {
      return (
        <span className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 text-white font-black text-[11px] sm:text-xs shadow-md shadow-amber-500/25 flex items-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap">
          <span>🥇</span>
          <span>#1 Oltin</span>
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-slate-400 to-slate-600 text-white font-black text-[11px] sm:text-xs shadow-md shadow-slate-500/20 flex items-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap">
          <span>🥈</span>
          <span>#2 Kumush</span>
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-black text-[11px] sm:text-xs shadow-md shadow-orange-500/20 flex items-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap">
          <span>🥉</span>
          <span>#3 Bronza</span>
        </span>
      );
    }
    return (
      <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-extrabold text-xs sm:text-sm flex items-center justify-center shrink-0 border border-gray-200 dark:border-gray-700">
        #{rank}
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 shrink-0">
            <Award className="w-6 h-6 text-yellow-300" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-2">
              <span>{isTeacher ? 'Mening Reytingim va O‘quvchilar Fikrlari' : 'O‘qituvchilar Reytingi & Talabalar Fikrlari'}</span>
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                ★ 10 Ballik Tizim
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              O‘quvchilar tomonidan qo‘yilgan ballar, darsdan mamnunlik, taklif va shikoyatlar monitoringi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadFeedbacks}
            className="flex items-center gap-1.5 cursor-pointer rounded-xl text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Yangilash</span>
          </Button>
          {!isTeacher && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/20 rounded-xl text-xs font-bold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV Eksport</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Top Analytics KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* KPI 1: O‘rtacha Ball */}
        <div className="p-4 rounded-2xl bg-white dark:bg-surface-dark-secondary border border-gray-200/80 dark:border-gray-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
            <Star className="w-5 h-5 fill-emerald-500 text-emerald-500" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block truncate">
              O‘rtacha Ball
            </span>
            <div className="text-xl font-black text-gray-900 dark:text-gray-100 flex items-baseline gap-1">
              <span>{overallKPIs.avgScore}</span>
              <span className="text-xs text-gray-400">/ 10</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Jami Fidbeklar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-surface-dark-secondary border border-gray-200/80 dark:border-gray-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
            <MessageSquare className="w-5 h-5 text-blue-500" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block truncate">
              Jami Fidbeklar
            </span>
            <div className="text-xl font-black text-gray-900 dark:text-gray-100">
              {overallKPIs.totalFb} ta
            </div>
          </div>
        </div>

        {/* KPI 3: 1-O‘rin */}
        <div className="p-4 rounded-2xl bg-white dark:bg-surface-dark-secondary border border-gray-200/80 dark:border-gray-800 shadow-sm flex items-center gap-3.5 col-span-2 sm:col-span-1">
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800">
            <Award className="w-5 h-5 text-amber-500" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block truncate">
              Top Ustoz 🥇
            </span>
            <div className="text-sm font-extrabold text-gray-900 dark:text-gray-100 truncate">
              {overallKPIs.topTeacher ? overallKPIs.topTeacher.name : 'Kutilmoqda'}
            </div>
          </div>
        </div>

        {/* KPI 4: Takliflar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-surface-dark-secondary border border-gray-200/80 dark:border-gray-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800">
            <Lightbulb className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block truncate">
              Takliflar
            </span>
            <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">
              {overallKPIs.totalSuggestions} ta
            </div>
          </div>
        </div>

        {/* KPI 5: Eʼtirozlar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-surface-dark-secondary border border-gray-200/80 dark:border-gray-800 shadow-sm flex items-center gap-3.5 col-span-2 sm:col-span-1 lg:col-span-1">
          <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-800">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block truncate">
              Eʼtirozlar
            </span>
            <div className="text-xl font-black text-rose-600 dark:text-rose-400">
              {overallKPIs.totalComplaints} ta
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Info Notice */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 flex items-start sm:items-center gap-3 text-xs text-blue-900 dark:text-blue-200">
        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5 sm:mt-0" />
        <span className="leading-relaxed">
          <strong>Nol holat (Clean Stock):</strong> Barcha ustozlar reytingi nol holatida turadi. O‘quvchilar o‘z kabinetidagi <strong>"O‘qituvchimga fikr-mulohaza"</strong> bo‘limi orqali darsni baholashi va taklif qoldirishi bilan o‘sha ustozning bali, yulduzlari va reyting o‘rni avtomatik ko‘tariladi.
        </span>
      </div>

      {/* 3. Navigation Tabs & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 rounded-2xl bg-gray-100/80 dark:bg-surface-dark-tertiary/70 border border-gray-200/80 dark:border-gray-800">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab('leaderboard')}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === 'leaderboard'
                ? 'bg-white dark:bg-surface-dark-secondary text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Award className="w-4 h-4 shrink-0" />
            <span>Ustozlar Reytingi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === 'reviews'
                ? 'bg-white dark:bg-surface-dark-secondary text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span>O‘quvchilar Fikrlari</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              {feedbacks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-white dark:bg-surface-dark-secondary text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span>Tahliliy Diagramma</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ustoz yoki fanni qidirish..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-surface-dark-secondary text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 4. TAB 1: O‘QITUVCHILAR PESHQADAMI (ROW-CARD KO‘RINISHI) */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-3">
          {teacherStats
            .filter((tc) => {
              if (!searchQuery.trim()) return true;
              const q = searchQuery.toLowerCase();
              return tc.name.toLowerCase().includes(q) || tc.subject.toLowerCase().includes(q);
            })
            .map((tc, idx) => {
              const rank = idx + 1;
              const subjectStyles = getSubjectColorStyles(tc.subject);
              const hasRatings = tc.totalReviews > 0;

              return (
                <div
                  key={tc.id}
                  className={`w-full rounded-2xl p-3.5 sm:p-5 bg-white dark:bg-surface-dark-secondary border border-gray-200/90 dark:border-gray-800 shadow-xs hover:shadow-md transition-all flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5 sm:gap-4 ${subjectStyles.borderLeft}`}
                >
                  {/* Left: Medal, Avatar, Name, Subject, Groups */}
                  <div className="flex items-center gap-3 sm:gap-3.5 w-full lg:w-[36%] min-w-0">
                    <div className="shrink-0">{renderMedalBadge(rank, hasRatings)}</div>
                    <Avatar
                      src={tc.avatar_url}
                      name={tc.name}
                      size="md"
                      className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl shadow-xs ring-2 ring-gray-100 dark:ring-gray-700 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-gray-100 leading-snug truncate">
                        {tc.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
                        <span className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-lg text-[11px] sm:text-xs font-bold shrink-0 ${subjectStyles.badgeBg}`}>
                          <span>{subjectStyles.icon}</span>
                          <span>{tc.subject}</span>
                        </span>
                        <span className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">
                          👥 {tc.groupCount} ta guruh • {tc.studentCount} ta o‘quvchi
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Rating Score & Progress Bar */}
                  <div className="w-full lg:w-[32%] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <div className="flex items-center gap-0.5 text-sm">
                          {[1, 2, 3, 4, 5].map((sIdx) => (
                            <Star
                              key={sIdx}
                              className={`w-3.5 h-3.5 ${
                                hasRatings && tc.averageRating >= sIdx * 2
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-gray-300 dark:text-gray-700'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-1">
                          {hasRatings
                            ? tc.averageRating >= 9
                              ? 'Aʼlo darajada'
                              : 'Yaxshi'
                            : 'Hali baho yo‘q'}
                        </span>
                      </div>

                      <div className={`px-2.5 py-0.5 rounded-lg text-xs font-black flex items-center gap-1 ${
                        hasRatings
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                      }`}>
                        <Star className={`w-3 h-3 ${hasRatings ? 'fill-amber-500 text-amber-500' : 'text-gray-400'}`} />
                        <span>{hasRatings ? tc.averageRating : '0.0'}</span>
                        <span className="text-[10px] text-gray-400">/ 10</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${subjectStyles.progressGradient} transition-all duration-500`}
                        style={{ width: `${hasRatings ? tc.averageRating * 10 : 0}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium">
                      <span>Mamnunlik:</span>
                      <span className={hasRatings ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-gray-400'}>
                        {hasRatings ? `${Math.round(tc.averageRating * 10)}%` : '0%'}
                      </span>
                    </div>
                  </div>

                  {/* Right: Metrics Pills & Action Button */}
                  <div className="w-full lg:w-[28%] flex flex-wrap items-center justify-between lg:justify-end gap-2 sm:gap-3 pt-2.5 lg:pt-0 border-t lg:border-t-0 border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <span className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
                        💬 {tc.totalReviews}
                      </span>
                      <span className="px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
                        💡 {tc.suggestionsCount}
                      </span>
                      <span className={`px-2.5 py-1 rounded-xl ${
                        tc.complaintsCount > 0
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                      }`}>
                        {tc.complaintsCount > 0 ? `⚠️ ${tc.complaintsCount}` : '✅ 0'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTeacherFilter(tc.id);
                        setActiveTab('reviews');
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Fidbeklar ({tc.totalReviews})</span>
                      <ChevronRight className="w-3 h-3 opacity-80" />
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* 5. TAB 2: TALABALAR FIKRLARI & TAKLIFLARI (REVIEWS FEED) */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-surface-dark-secondary border border-gray-200/80 dark:border-gray-800 shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="O‘quvchi, ustoz yoki taklif..."
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-surface-dark-tertiary text-xs sm:text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Teacher Filter */}
              <div>
                <select
                  value={selectedTeacherFilter}
                  onChange={(e) => setSelectedTeacherFilter(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-surface-dark-tertiary text-xs sm:text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Barcha ustozlar ({teachersList.length})</option>
                  {teachersList.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name} ({t.subject || 'Ustoz'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Rating Filter */}
              <div>
                <select
                  value={selectedRatingFilter}
                  onChange={(e) => setSelectedRatingFilter(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-surface-dark-tertiary text-xs sm:text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Barcha ballar (1-10)</option>
                  <option value="9-10">🌟 9 - 10 ball (Aʼlo)</option>
                  <option value="7-8">👍 7 - 8 ball (Yaxshi)</option>
                  <option value="5-6">😐 5 - 6 ball (O‘rtacha)</option>
                  <option value="1-4">⚠️ 1 - 4 ball (Past / Shikoyat)</option>
                </select>
              </div>

              {/* Checkboxes */}
              <div className="flex flex-col justify-center space-y-1.5 text-xs text-gray-700 dark:text-gray-300 pl-1">
                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={onlySuggestions}
                    onChange={(e) => setOnlySuggestions(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Faqat takliflari borlar 💡</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={onlyComplaints}
                    onChange={(e) => setOnlyComplaints(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span>Faqat eʼtirozlari borlar ⚠️</span>
                </label>
              </div>
            </div>

            {(selectedTeacherFilter !== 'ALL' || selectedRatingFilter !== 'ALL' || onlySuggestions || onlyComplaints || searchQuery) && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800 text-xs">
                <span className="text-gray-500 font-medium">
                  Topilgan natijalar: <strong>{filteredFeedbacks.length} ta</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTeacherFilter('ALL');
                    setSelectedRatingFilter('ALL');
                    setOnlySuggestions(false);
                    setOnlyComplaints(false);
                    setSearchQuery('');
                  }}
                  className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                >
                  Filtrlarni tozalash
                </button>
              </div>
            )}
          </div>

          {/* Feedbacks Grid */}
          {filteredFeedbacks.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-surface-dark-secondary border border-gray-200/80 dark:border-gray-800 shadow-xs space-y-3">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto" />
              <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
                Hozircha fikr-mulohazalar mavjud emas
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                O‘quvchilar o‘z profillaridan ustoziga fidbek yuborganida, bu yerda to‘liq ro‘yxat shaklida paydo bo‘ladi.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFeedbacks.map((fb) => (
                <div
                  key={fb.id}
                  className="p-5 rounded-2xl bg-white dark:bg-surface-dark-secondary border border-gray-200/90 dark:border-gray-800 shadow-xs hover:shadow-sm transition-shadow flex flex-col justify-between space-y-4"
                >
                  {/* Top Bar: Student info & Teacher */}
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          {fb.is_anonymous ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 text-xs font-bold flex items-center gap-1">
                              <Lock className="w-3 h-3" /> 🎭 Anonim O‘quvchi
                            </span>
                          ) : (
                            <span className="font-extrabold text-sm text-gray-900 dark:text-gray-100">
                              {fb.student_name}
                            </span>
                          )}
                          <span className="text-[11px] text-gray-400">
                            {new Date(fb.created_at).toLocaleDateString('uz-UZ')}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Guruh: <strong className="text-gray-700 dark:text-gray-300">{fb.group_name || 'Guruh'}</strong>
                        </p>
                      </div>

                      {/* Rating Badge */}
                      <span className="px-3 py-1 rounded-xl text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1 shrink-0">
                        <Star className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
                        <span>{fb.rating} / 10</span>
                      </span>
                    </div>

                    {/* Teacher Mention Badge */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 p-2 rounded-xl bg-gray-50 dark:bg-surface-dark-tertiary border border-gray-100 dark:border-gray-700/60 text-xs">
                      <GraduationCap className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="text-gray-500 dark:text-gray-400">Ustoz:</span>
                      <strong className="text-gray-900 dark:text-gray-100">{fb.teacher_name}</strong>
                      <span className="text-gray-400">•</span>
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">{fb.subject}</span>
                    </div>
                  </div>

                  {/* Middle: Satisfaction & Content */}
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-gray-500 dark:text-gray-400">Darsdan mamnunligi:</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200 px-2.5 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-800">
                        {fb.satisfaction}
                      </span>
                      {fb.status === 'reviewed' ? (
                        <span className="ml-auto text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Ko‘rib chiqildi
                        </span>
                      ) : (
                        <span className="ml-auto text-[11px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md">
                          Yangi fikr
                        </span>
                      )}
                    </div>

                    {/* Suggestions Box */}
                    {fb.suggestions && (
                      <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 text-xs space-y-1">
                        <div className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                          <Lightbulb className="w-4 h-4 text-amber-600" />
                          <span>Darsni qiziqroq qilish bo‘yicha taklif:</span>
                        </div>
                        <p className="text-gray-800 dark:text-gray-200 leading-relaxed font-normal">
                          {fb.suggestions}
                        </p>
                      </div>
                    )}

                    {/* Complaints Box */}
                    {fb.complaints && (
                      <div className="p-3.5 rounded-xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/60 text-xs space-y-1">
                        <div className="font-bold text-rose-900 dark:text-rose-300 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          <span>Eʼtiroz / Shikoyat:</span>
                        </div>
                        <p className="text-gray-800 dark:text-gray-200 leading-relaxed font-normal">
                          {fb.complaints}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions (Owner / Admin) */}
                  {!isTeacher && (
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800 text-xs">
                      {fb.status !== 'reviewed' ? (
                        <button
                          type="button"
                          onClick={() => handleMarkReviewed(fb.id)}
                          className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Ko‘rib chiqildi deb belgilash</span>
                        </button>
                      ) : (
                        <span className="text-gray-400 text-[11px]">Ko‘rib chiqilgan</span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDelete(fb.id)}
                        className="text-gray-400 hover:text-rose-600 transition-colors p-1 rounded-lg"
                        title="O‘chirish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. TAB 3: TAHLILIY DIAGRAMMA & INSIGHTS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score distribution */}
            <div className="p-6 rounded-2xl bg-white dark:bg-surface-dark-secondary border border-gray-200/80 dark:border-gray-800 shadow-xs space-y-4">
              <h3 className="font-extrabold text-base text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span>1-10 Ballik Shkala Taqsimoti</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                O‘quvchilar tomonidan berilgan baholarning taqsimoti.
              </p>

              <div className="space-y-2.5 pt-2">
                {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((sc) => {
                  const count = feedbacks.filter((f) => Number(f.rating) === sc).length;
                  const pct = feedbacks.length > 0 ? Math.round((count / feedbacks.length) * 100) : 0;
                  return (
                    <div key={sc} className="flex items-center gap-3 text-xs">
                      <span className="w-14 font-extrabold text-gray-700 dark:text-gray-300">
                        {sc} ball
                      </span>
                      <div className="flex-1 bg-gray-100 dark:bg-gray-800 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-14 text-right font-bold text-gray-600 dark:text-gray-400">
                        {count} ta ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Common Student Suggestions */}
            <div className="p-6 rounded-2xl bg-white dark:bg-surface-dark-secondary border border-gray-200/80 dark:border-gray-800 shadow-xs space-y-4">
              <h3 className="font-extrabold text-base text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                <span>O‘quvchilar Eng Ko‘p So‘rayotgan Takliflar</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Talabalar dars jarayonini qiziqroq qilish uchun eng ko‘p nimalarni tavsiya qilmoqda.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  { tag: 'Ko‘proq amaliy mashg‘ulotlar & keyslar', pct: 45, count: '45%' },
                  { tag: 'Qiziqarli o‘yinlar, viktorina & kvestlar', pct: 28, count: '28%' },
                  { tag: 'Slaydlar, video & vizual materiallar', pct: 16, count: '16%' },
                  { tag: 'Uyga vazifani chuqurroq tushuntirish', pct: 7, count: '7%' },
                  { tag: 'Boshqa erkin takliflar', pct: 4, count: '4%' },
                ].map((item) => (
                  <div key={item.tag} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-800 dark:text-gray-200">
                      <span>{item.tag}</span>
                      <span className="text-blue-600 dark:text-blue-400">{item.count}</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full"
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 mt-4 text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
                💡 <strong>Xulosa va Tavsiya:</strong> Talabalar darslarda amaliyot va interaktiv o‘yinli bellashuvlarni juda yaxshi kutib olmoqda. Har bir fanga haftada kamida 1 marta mini-viktorina yoki amaliy mashg‘ulot qo‘shish umumiy o‘zlashtirishni sezilarli oshiradi.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
