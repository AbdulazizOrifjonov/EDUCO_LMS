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
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState('ALL');
  const [selectedRatingFilter, setSelectedRatingFilter] = useState('ALL'); // 'ALL' | '9-10' | '7-8' | '5-6' | '1-4'
  const [onlySuggestions, setOnlySuggestions] = useState(false);
  const [onlyComplaints, setOnlyComplaints] = useState(false);

  // Load Feedbacks from localStore
  const loadFeedbacks = () => {
    const allFb = localStore.getTeacherFeedbacks ? localStore.getTeacherFeedbacks() : [];
    if (isTeacher) {
      // If teacher is viewing, only show feedbacks for this teacher
      setFeedbacks(allFb.filter((fb) => localStore.normalizeUserId(fb.teacher_id) === currentUserId));
    } else {
      setFeedbacks(allFb);
    }
  };

  useEffect(() => {
    loadFeedbacks();
  }, [userRole, currentUserId]);

  // Load teachers list
  const allUsers = localStore.getUsers ? localStore.getUsers() : [];
  const allGroups = localStore.getGroups ? localStore.getGroups() : [];
  const teachersList = useMemo(() => {
    return allUsers.filter((u) => u.role === 'teacher');
  }, [allUsers]);

  // Aggregated Teacher Statistics (Leaderboard)
  const teacherStats = useMemo(() => {
    const statsMap = {};

    // Initialize all active teachers
    teachersList.forEach((tc) => {
      const tcGroups = allGroups.filter(
        (g) => localStore.normalizeUserId(g.teacher_id) === localStore.normalizeUserId(tc.id)
      );
      statsMap[tc.id] = {
        id: tc.id,
        name: tc.full_name || 'Ustoz',
        avatar_url: tc.avatar_url || null,
        phone: tc.phone || '',
        subject: tc.subject || tcGroups[0]?.course_name || 'Fan o‘qituvchisi',
        groupCount: tcGroups.length,
        ratings: [],
        satisfactions: { 'Juda aʼlo': 0, 'Yaxshi': 0, 'Oʻrtacha': 0, 'Qoniqarsiz': 0 },
        suggestionsCount: 0,
        complaintsCount: 0,
        averageRating: 0,
        totalReviews: 0,
      };
    });

    // Populate with feedbacks
    feedbacks.forEach((fb) => {
      let tId = fb.teacher_id;
      // Match by normalized ID
      let matchedKey = Object.keys(statsMap).find(
        (key) => localStore.normalizeUserId(key) === localStore.normalizeUserId(tId)
      );

      if (!matchedKey) {
        // If not in map, create entry
        matchedKey = tId;
        statsMap[tId] = {
          id: tId,
          name: fb.teacher_name || 'Ustoz',
          avatar_url: null,
          phone: '',
          subject: fb.subject || 'O‘qituvchi',
          groupCount: 1,
          ratings: [],
          satisfactions: { 'Juda aʼlo': 0, 'Yaxshi': 0, 'Oʻrtacha': 0, 'Qoniqarsiz': 0 },
          suggestionsCount: 0,
          complaintsCount: 0,
          averageRating: 0,
          totalReviews: 0,
        };
      }

      const st = statsMap[matchedKey];
      if (fb.rating) st.ratings.push(Number(fb.rating));
      if (fb.satisfaction && st.satisfactions[fb.satisfaction] !== undefined) {
        st.satisfactions[fb.satisfaction] += 1;
      }
      if (fb.suggestions?.trim()) st.suggestionsCount += 1;
      if (fb.complaints?.trim()) st.complaintsCount += 1;
    });

    // Calculate averages & format
    const result = Object.values(statsMap).map((st) => {
      const count = st.ratings.length;
      const sum = st.ratings.reduce((a, b) => a + b, 0);
      const avg = count > 0 ? (sum / count) : 0;
      return {
        ...st,
        totalReviews: count,
        averageRating: Number(avg.toFixed(1)),
      };
    });

    // Sort by average rating descending, then total reviews descending
    result.sort((a, b) => {
      if (b.averageRating !== a.averageRating) return b.averageRating - a.averageRating;
      return b.totalReviews - a.totalReviews;
    });

    return result;
  }, [teachersList, allGroups, feedbacks]);

  // Overall Center KPIs
  const overallKPIs = useMemo(() => {
    const totalFb = feedbacks.length;
    const allScores = feedbacks.map((f) => Number(f.rating) || 0).filter((s) => s > 0);
    const avgScore = allScores.length > 0 ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1) : '10.0';
    const topTeacher = teacherStats[0] || null;
    const totalSuggestions = feedbacks.filter((f) => f.suggestions?.trim()).length;
    const totalComplaints = feedbacks.filter((f) => f.complaints?.trim()).length;
    const positiveCount = feedbacks.filter((f) => (f.rating >= 8) || f.satisfaction === 'Juda aʼlo' || f.satisfaction === 'Yaxshi').length;
    const satisfactionRate = totalFb > 0 ? Math.round((positiveCount / totalFb) * 100) : 100;

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
      // Teacher filter
      if (selectedTeacherFilter !== 'ALL' && fb.teacher_id !== selectedTeacherFilter) {
        return false;
      }

      // Rating filter
      if (selectedRatingFilter === '9-10' && (fb.rating < 9)) return false;
      if (selectedRatingFilter === '7-8' && (fb.rating < 7 || fb.rating > 8)) return false;
      if (selectedRatingFilter === '5-6' && (fb.rating < 5 || fb.rating > 6)) return false;
      if (selectedRatingFilter === '1-4' && (fb.rating > 4)) return false;

      // Only suggestions / complaints
      if (onlySuggestions && !fb.suggestions?.trim()) return false;
      if (onlyComplaints && !fb.complaints?.trim()) return false;

      // Search query
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
      toast.error('Eksport qilish uchun fikr-mulohazalar mavjud emas');
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
    link.setAttribute('download', `Oqtuvchilar_Reytingi_Fidbeklar_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Reyting va fikrlar hisoboti CSV formatida yuklab olindi!');
  };

  const getScoreBadgeColor = (score) => {
    if (score >= 9) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
    if (score >= 7) return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800';
    if (score >= 5) return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800';
    return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800';
  };

  const getProgressColor = (score) => {
    if (score >= 9) return 'bg-emerald-500';
    if (score >= 7) return 'bg-blue-500';
    if (score >= 5) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Taʼlim Sifati & O‘quvchilar Mamnunligi</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
            {isTeacher ? 'Mening Reytingim va O‘quvchilar Fikrlari' : 'O‘qituvchilar Reytingi & Fikr-Mulohazalar'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
            Talabalar tomonidan ustozlarga berilgan 1-10 ballik baholar, darsdan mamnunlik koeffitsiyenti, taklif va shikoyatlar monitoringi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadFeedbacks}
            className="flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Yangilash</span>
          </Button>
          {!isTeacher && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/20"
            >
              <Download className="w-4 h-4" />
              <span>CSV Eksport</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Top Analytics KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* KPI 1: Markaziy O‘rtacha Ball */}
        <Card className="p-4 sm:p-5 flex flex-col justify-between border-l-4 border-l-emerald-500 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <span>O‘rtacha Ball</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 flex items-baseline gap-1">
              <span>{overallKPIs.avgScore}</span>
              <span className="text-sm font-semibold text-gray-400">/ 10</span>
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
              {overallKPIs.satisfactionRate}% ijobiy mamnunlik
            </p>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Number(overallKPIs.avgScore) * 10)}%` }}
            />
          </div>
        </Card>

        {/* KPI 2: Jami Fidbeklar */}
        <Card className="p-4 sm:p-5 flex flex-col justify-between border-l-4 border-l-blue-500 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <span>Jami Fidbeklar</span>
            <MessageSquare className="w-4 h-4 text-blue-500" />
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100">
              {overallKPIs.totalFb}
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5">
              Talabalar tomonidan
            </p>
          </div>
          <div className="text-[11px] text-gray-400">
            {teachersList.length} nafar faol ustozga
          </div>
        </Card>

        {/* KPI 3: Top O‘qituvchi */}
        <Card className="p-4 sm:p-5 flex flex-col justify-between border-l-4 border-l-amber-500 shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <span>Top Ustoz 🥇</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="my-2">
            <div className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-gray-100 truncate">
              {overallKPIs.topTeacher?.name || '—'}
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-bold mt-0.5 flex items-center gap-1">
              <span>★ {overallKPIs.topTeacher?.averageRating || 10} ball</span>
              <span className="text-gray-400">({overallKPIs.topTeacher?.totalReviews || 0} baho)</span>
            </p>
          </div>
          <div className="text-[11px] text-gray-400 truncate">
            {overallKPIs.topTeacher?.subject || 'Barcha fanlar'}
          </div>
        </Card>

        {/* KPI 4: Foydali Takliflar */}
        <Card className="p-4 sm:p-5 flex flex-col justify-between border-l-4 border-l-indigo-500 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <span>Takliflar</span>
            <Lightbulb className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">
              {overallKPIs.totalSuggestions}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
              Darsni qiziqarli qilish
            </p>
          </div>
          <div className="text-[11px] text-gray-400">
            Dars sifati g‘oyalari
          </div>
        </Card>

        {/* KPI 5: Shikoyat va Eʼtirozlar */}
        <Card className="p-4 sm:p-5 flex flex-col justify-between border-l-4 border-l-rose-500 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <span>Eʼtirozlar</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
              {overallKPIs.totalComplaints}
            </div>
            <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-0.5">
              {overallKPIs.totalComplaints > 0 ? 'Nazorat talab etiladi' : 'Shikoyatlar yo‘q'}
            </p>
          </div>
          <div className="text-[11px] text-gray-400">
            Maʼmuriyat nazorati
          </div>
        </Card>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Ustozlar Reytingi (Peshqadam)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer relative ${
              activeTab === 'reviews'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Fikrlar & Takliflar</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[11px] font-black ${
              activeTab === 'reviews' ? 'bg-white text-blue-600' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}>
              {feedbacks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Tahliliy Diagramma</span>
          </button>
        </div>

        {activeTab === 'leaderboard' && (
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-surface-dark-secondary p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-surface-dark-tertiary text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Kartalar
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-surface-dark-tertiary text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Jadval
            </button>
          </div>
        )}
      </div>

      {/* 4. TAB 1: O‘QITUVCHILAR PESHQADAMI (LEADERBOARD) */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-6">
          {viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {teacherStats.map((tc, idx) => {
                const rank = idx + 1;
                let rankBadge = (
                  <span className="w-7 h-7 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-extrabold text-xs flex items-center justify-center">
                    #{rank}
                  </span>
                );
                if (rank === 1) {
                  rankBadge = (
                    <span className="px-2 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-extrabold text-xs flex items-center gap-1 border border-amber-300">
                      🥇 #1 Oltin
                    </span>
                  );
                } else if (rank === 2) {
                  rankBadge = (
                    <span className="px-2 py-1 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-extrabold text-xs flex items-center gap-1 border border-slate-300">
                      🥈 #2 Kumush
                    </span>
                  );
                } else if (rank === 3) {
                  rankBadge = (
                    <span className="px-2 py-1 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 font-extrabold text-xs flex items-center gap-1 border border-orange-300">
                      🥉 #3 Bronza
                    </span>
                  );
                }

                return (
                  <Card key={tc.id} className="p-5 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-shadow relative border border-gray-200 dark:border-gray-800">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar src={tc.avatar_url} name={tc.name} size="lg" />
                        <div className="min-w-0">
                          <h3 className="font-extrabold text-base text-gray-900 dark:text-gray-100 truncate">
                            {tc.name}
                          </h3>
                          <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold truncate">
                            {tc.subject}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {tc.groupCount} ta guruh ustozi
                          </p>
                        </div>
                      </div>
                      <div>{rankBadge}</div>
                    </div>

                    {/* Score Bar & Stars */}
                    <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-surface-dark-tertiary border border-gray-100 dark:border-gray-700/60 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          O‘quvchilar Bahosi:
                        </span>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                          <span className="font-black text-base text-gray-900 dark:text-gray-100">
                            {tc.totalReviews > 0 ? tc.averageRating : '—'}
                          </span>
                          <span className="text-xs text-gray-400">/ 10</span>
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${getProgressColor(tc.averageRating)}`}
                          style={{ width: `${tc.totalReviews > 0 ? tc.averageRating * 10 : 0}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 pt-0.5 font-medium">
                        <span>Jami baholar: <strong>{tc.totalReviews} ta</strong></span>
                        <span>Takliflar: <strong>{tc.suggestionsCount} ta</strong></span>
                        {tc.complaintsCount > 0 ? (
                          <span className="text-rose-600 font-bold">⚠️ {tc.complaintsCount} eʼtiroz</span>
                        ) : (
                          <span className="text-emerald-600 font-bold">0 eʼtiroz</span>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTeacherFilter(tc.id);
                        setActiveTab('reviews');
                      }}
                      className="w-full text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-500" />
                      <span>Fidbek va Takliflarni Ko‘rish ({tc.totalReviews})</span>
                    </Button>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">O‘rin</TableHead>
                    <TableHead>O‘qituvchi</TableHead>
                    <TableHead>Fan / Kurs</TableHead>
                    <TableHead>O‘rtacha Ball</TableHead>
                    <TableHead>Baholar Soni</TableHead>
                    <TableHead>Takliflar</TableHead>
                    <TableHead>Eʼtirozlar</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teacherStats.map((tc, idx) => (
                    <TableRow key={tc.id}>
                      <TableCell className="font-extrabold text-sm">
                        {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar src={tc.avatar_url} name={tc.name} size="sm" />
                          <span className="font-bold text-sm text-gray-900 dark:text-gray-100">
                            {tc.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                        {tc.subject}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-extrabold border ${getScoreBadgeColor(tc.averageRating)}`}>
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{tc.totalReviews > 0 ? tc.averageRating : '—'} / 10</span>
                        </span>
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {tc.totalReviews} ta
                      </TableCell>
                      <TableCell className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold">
                        {tc.suggestionsCount} ta
                      </TableCell>
                      <TableCell>
                        {tc.complaintsCount > 0 ? (
                          <span className="text-xs font-bold text-rose-600">⚠️ {tc.complaintsCount} ta</span>
                        ) : (
                          <span className="text-xs font-semibold text-emerald-600">0 ta</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTeacherFilter(tc.id);
                            setActiveTab('reviews');
                          }}
                          className="text-xs font-bold text-blue-600 dark:text-blue-400 cursor-pointer"
                        >
                          Ko‘rish
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      )}

      {/* 5. TAB 2: TALABALAR FIKRLARI & TAKLIFLARI (REVIEWS FEED) */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <Card className="p-4 sm:p-5 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="O‘quvchi, ustoz yoki taklif matni..."
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-surface-dark-tertiary text-xs sm:text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Teacher Filter */}
              <div>
                <select
                  value={selectedTeacherFilter}
                  onChange={(e) => setSelectedTeacherFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-surface-dark-tertiary text-xs sm:text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-surface-dark-tertiary text-xs sm:text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Barcha ballar (1-10)</option>
                  <option value="9-10">🌟 9 - 10 ball (Aʼlo)</option>
                  <option value="7-8">👍 7 - 8 ball (Yaxshi)</option>
                  <option value="5-6">😐 5 - 6 ball (O‘rtacha)</option>
                  <option value="1-4">⚠️ 1 - 4 ball (Past / Shikoyat)</option>
                </select>
              </div>

              {/* Checkboxes */}
              <div className="flex flex-col justify-center space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
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
                <span className="text-gray-500">
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
                  className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
                >
                  Filtrlarni tozalash
                </button>
              </div>
            )}
          </Card>

          {/* Feedbacks Grid */}
          {filteredFeedbacks.length === 0 ? (
            <Card className="p-12 text-center shadow-sm space-y-3">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto" />
              <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
                Fikr-mulohazalar topilmadi
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                Tanlangan filtrlar bo‘yicha hozircha fidbek mavjud emas. Filtrlarni o‘zgartirib ko‘ring.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFeedbacks.map((fb) => (
                <Card
                  key={fb.id}
                  className="p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-800 flex flex-col justify-between"
                >
                  {/* Top Bar: Student info & Teacher */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          {fb.is_anonymous ? (
                            <span className="px-2 py-0.5 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 text-xs font-bold flex items-center gap-1">
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
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Guruh: <strong className="text-gray-700 dark:text-gray-300">{fb.group_name || 'Guruh'}</strong>
                        </p>
                      </div>

                      {/* Rating Badge */}
                      <span className={`px-3 py-1.5 rounded-2xl text-xs font-black border flex items-center gap-1 shrink-0 ${getScoreBadgeColor(fb.rating)}`}>
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{fb.rating} / 10</span>
                      </span>
                    </div>

                    {/* Teacher Mention Badge */}
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 dark:bg-surface-dark-tertiary border border-gray-100 dark:border-gray-700/60 text-xs">
                      <GraduationCap className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="text-gray-500 dark:text-gray-400">Ustoz:</span>
                      <strong className="text-gray-900 dark:text-gray-100">{fb.teacher_name}</strong>
                      <span className="text-gray-400">•</span>
                      <span className="text-blue-600 dark:text-blue-400 font-medium">{fb.subject}</span>
                    </div>
                  </div>

                  {/* Middle: Satisfaction & Content */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-500 dark:text-gray-400">Darsdan mamnunligi:</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200 px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-800">
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
                      <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 text-xs space-y-1">
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
                      <div className="p-3.5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/60 text-xs space-y-1">
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
                </Card>
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
            <Card className="p-6 space-y-4 shadow-sm">
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
                      <div className="flex-1 bg-gray-100 dark:bg-gray-800 h-3 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${getProgressColor(sc)}`}
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
            </Card>

            {/* Common Student Suggestions */}
            <Card className="p-6 space-y-4 shadow-sm">
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

              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 mt-4 text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
                💡 <strong>Xulosa va Tavsiya:</strong> Talabalar darslarda amaliyot va interaktiv o‘yinli bellashuvlarni juda yaxshi kutib olmoqda. Har bir fanga haftada kamida 1 marta mini-viktorina yoki amaliy mashg‘ulot qo‘shish umumiy o‘zlashtirishni sezilarli oshiradi.
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
