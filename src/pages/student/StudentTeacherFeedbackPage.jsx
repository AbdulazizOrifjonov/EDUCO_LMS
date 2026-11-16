import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Star,
  HeartHandshake,
  Sparkles,
  Send,
  MessageSquare,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Lock,
  User,
  GraduationCap,
  BookOpen,
  Calendar,
  Clock,
  History,
  Trash2,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import { localStore } from '@/lib/localStore';
import { Button, Card, Badge, Avatar, toast } from '@/components/ui';

export default function StudentTeacherFeedbackPage() {
  const { t } = useTranslation();
  const { user, profile } = useAuth();

  const normalizedUserId = localStore.normalizeUserId(user?.id || profile?.id);

  // 1. Load enrolled groups and corresponding teachers
  const allGroups = localStore.getGroups ? localStore.getGroups() : [];
  const allUsers = localStore.getUsers ? localStore.getUsers() : [];

  const currentUser = useMemo(() => {
    return (
      allUsers.find((u) => localStore.normalizeUserId(u.id) === normalizedUserId) ||
      profile ||
      user
    );
  }, [allUsers, normalizedUserId, profile, user]);

  const enrolledGroups = useMemo(() => {
    const userGroupIds = Array.isArray(currentUser?.group_ids)
      ? currentUser.group_ids
      : currentUser?.group_id
      ? [currentUser.group_id]
      : [];

    const memberships = localStore.getMemberships
      ? localStore.getMemberships()
      : localStore.getItem('educo_db_memberships', []);

    const memberGroupIds = memberships
      .filter(
        (m) =>
          localStore.normalizeUserId(m.student_id) === normalizedUserId &&
          m.is_active !== false
      )
      .map((m) => m.group_id);

    const inGroupStudentIds = allGroups
      .filter(
        (g) =>
          Array.isArray(g.student_ids) &&
          g.student_ids.map((id) => localStore.normalizeUserId(id)).includes(normalizedUserId)
      )
      .map((g) => g.id);

    const allMyGroupIds = [
      ...new Set([...userGroupIds, ...memberGroupIds, ...inGroupStudentIds]),
    ];

    const matched = allGroups.filter((g) => allMyGroupIds.includes(g.id));
    return matched.length > 0 ? matched : allGroups;
  }, [allGroups, currentUser, normalizedUserId]);

  // Teachers available for this student
  const availableTeachers = useMemo(() => {
    const teachersList = [];
    const seenTeacherIds = new Set();

    enrolledGroups.forEach((grp) => {
      if (grp.teacher_id && !seenTeacherIds.has(grp.teacher_id)) {
        const teacherObj = allUsers.find(
          (u) => localStore.normalizeUserId(u.id) === localStore.normalizeUserId(grp.teacher_id)
        );
        seenTeacherIds.add(grp.teacher_id);
        teachersList.push({
          id: grp.teacher_id,
          name: teacherObj?.full_name || grp.teacher_name || 'Ustoz',
          avatar_url: teacherObj?.avatar_url || null,
          subject: grp.course_name || grp.name || 'Fan',
          group_id: grp.id,
          group_name: grp.name,
        });
      }
    });

    // Fallback: If no direct group teacher found, list all teachers in the center
    if (teachersList.length === 0) {
      allUsers
        .filter((u) => u.role === 'teacher')
        .forEach((t) => {
          teachersList.push({
            id: t.id,
            name: t.full_name || 'Ustoz',
            avatar_url: t.avatar_url || null,
            subject: t.subject || 'O‘qituvchi',
            group_id: '',
            group_name: 'Markaz ustozi',
          });
        });
    }

    return teachersList;
  }, [enrolledGroups, allUsers]);

  // Selection & Form State
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [rating, setRating] = useState(10); // 1 to 10
  const [hoverRating, setHoverRating] = useState(null);
  const [satisfaction, setSatisfaction] = useState('Juda aʼlo');
  const [suggestions, setSuggestions] = useState('');
  const [complaints, setComplaints] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myFeedbacks, setMyFeedbacks] = useState([]);

  // Auto-select first teacher
  useEffect(() => {
    if (availableTeachers.length > 0 && !selectedTeacherId) {
      setSelectedTeacherId(availableTeachers[0].id);
    }
  }, [availableTeachers, selectedTeacherId]);

  // Load student's past feedbacks
  const loadMyFeedbacks = () => {
    const allFb = localStore.getTeacherFeedbacks ? localStore.getTeacherFeedbacks() : [];
    const my = allFb.filter(
      (fb) => localStore.normalizeUserId(fb.student_id) === normalizedUserId
    );
    setMyFeedbacks(my);
  };

  useEffect(() => {
    loadMyFeedbacks();
  }, [normalizedUserId]);

  const activeTeacher = useMemo(() => {
    return (
      availableTeachers.find((t) => t.id === selectedTeacherId) ||
      availableTeachers[0] ||
      null
    );
  }, [availableTeachers, selectedTeacherId]);

  // Quick suggestion chips
  const quickSuggestions = [
    'Ko‘proq amaliy mashg‘ulotlar',
    'Qiziqarli o‘yinlar va kvestlar',
    'Slaydlar va vizual materiallar',
    'Uyga vazifani chuqurroq tushuntirish',
    'Tezkor savol-javob musobaqalari',
    'Real hayotiy loyihalar ustida ishlash',
  ];

  const handleAddSuggestionTag = (tag) => {
    if (!suggestions.includes(tag)) {
      setSuggestions((prev) => (prev ? `${prev}, ${tag}` : tag));
    }
  };

  const getRatingScoreLabel = (score) => {
    if (score === 10) return { text: '10/10 — Mukammal darajada! Darslar aʼlo darajada o‘tmoqda.', color: 'text-emerald-600 dark:text-emerald-400' };
    if (score === 9) return { text: '9/10 — Juda zo‘r! Darslar juda maʼqul.', color: 'text-emerald-600 dark:text-emerald-400' };
    if (score >= 7) return { text: `${score}/10 — Yaxshi darslar, tushunarli.`, color: 'text-blue-600 dark:text-blue-400' };
    if (score >= 5) return { text: `${score}/10 — Oʻrtacha, yaxshilash kerak bo‘lgan jihatlar bor.`, color: 'text-amber-600 dark:text-amber-400' };
    return { text: `${score}/10 — Qoniqarsiz, jiddiy eʼtibor qaratish kerak.`, color: 'text-rose-600 dark:text-rose-400' };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!activeTeacher) {
      toast.error('Iltimos, avval baholamoqchi bo‘lgan ustozingizni tanlang!');
      return;
    }

    setIsSubmitting(true);
    try {
      const feedbackPayload = {
        teacher_id: activeTeacher.id,
        teacher_name: activeTeacher.name,
        subject: activeTeacher.subject || '',
        group_id: activeTeacher.group_id || '',
        group_name: activeTeacher.group_name || '',
        student_id: normalizedUserId,
        student_name: isAnonymous ? 'Anonim o‘quvchi' : currentUser?.full_name || 'O‘quvchi',
        rating: Number(rating),
        satisfaction,
        suggestions: suggestions.trim(),
        complaints: complaints.trim(),
        is_anonymous: isAnonymous,
        status: 'new',
      };

      localStore.saveTeacherFeedback(feedbackPayload);
      toast.success('Ustozingizga fikr-mulohazangiz va bahongiz muvaffaqiyatli yuborildi! Rahmat!');

      // Reset form fields
      setSuggestions('');
      setComplaints('');
      loadMyFeedbacks();
    } catch (err) {
      console.error('Feedback save error:', err);
      toast.error('Fidbekni saqlashda xatolik yuz berdi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFeedback = (fbId) => {
    if (window.confirm('Haqiqatan ham ushbu fikr-mulohazangizni o‘chirmoqchimisiz?')) {
      localStore.deleteTeacherFeedback(fbId);
      toast.success('Fikr-mulohaza o‘chirildi');
      loadMyFeedbacks();
    }
  };

  const currentScoreInfo = getRatingScoreLabel(hoverRating || rating);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>Taʼlim sifati va talabalar ovozi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              O‘qituvchimga Fikr-Mulohaza & Baho
            </h1>
            <p className="text-white/80 text-sm sm:text-base max-w-2xl leading-relaxed">
              Ustozingiz dars o‘tish sifatini 1 dan 10 gacha baholang, darslarni yanada qiziqarli qilish bo‘yicha takliflaringizni yozib qoldiring. Sizning fikringiz biz uchun juda muhim!
            </p>
          </div>
          <div className="hidden md:flex flex-col items-center justify-center w-28 h-28 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-center p-2">
            <HeartHandshake className="w-10 h-10 text-yellow-300 mb-1" />
            <span className="text-[11px] font-semibold text-white/90">Xolis va ochiq baholash</span>
          </div>
        </div>
      </div>

      {/* 2. Ustozni tanlash */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>1. Baholamoqchi bo‘lgan ustozingizni tanlang:</span>
          </h2>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Jami: {availableTeachers.length} ta ustoz
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {availableTeachers.map((tc) => {
            const isSelected = tc.id === activeTeacher?.id;
            return (
              <button
                key={tc.id}
                type="button"
                onClick={() => setSelectedTeacherId(tc.id)}
                className={`flex items-center gap-3.5 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 dark:border-blue-500 shadow-md ring-2 ring-blue-500/30'
                    : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark-secondary hover:border-gray-300 dark:hover:border-gray-700'
                }`}
              >
                <Avatar
                  src={tc.avatar_url}
                  name={tc.name}
                  size="md"
                  className={isSelected ? 'ring-2 ring-blue-500' : ''}
                />
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">
                    {tc.name}
                  </h4>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium truncate">
                    {tc.subject}
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {tc.group_name}
                  </p>
                </div>
                {isSelected && (
                  <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Baholash va Fikr Forma */}
      <Card className="p-6 sm:p-8 space-y-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Active Teacher Banner */}
          {activeTeacher && (
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-surface-dark-tertiary border border-gray-200 dark:border-gray-700/80">
              <div className="flex items-center gap-3">
                <Avatar src={activeTeacher.avatar_url} name={activeTeacher.name} size="lg" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Tanlangan ustoz:
                    </span>
                    <Badge variant="primary" size="sm">{activeTeacher.subject}</Badge>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {activeTeacher.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Guruh: <strong className="text-gray-700 dark:text-gray-300">{activeTeacher.group_name}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-white dark:bg-surface-dark-secondary border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300">
                <BookOpen className="w-4 h-4 text-blue-500" />
                <span>Oylik baholash va taklif</span>
              </div>
            </div>
          )}

          {/* 1 dan 10 gacha baholash shkalasi */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <span>2. Ustozingizga 1 dan 10 gacha ball qo‘ying:</span>
              </label>
              <span className={`text-sm font-bold ${currentScoreInfo.color}`}>
                {currentScoreInfo.text}
              </span>
            </div>

            {/* 1-10 Button Bar */}
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-2.5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
                const isSelected = rating === score;
                const isHovered = hoverRating === score;

                let scoreColorClasses = 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-blue-400';
                if (score >= 9) {
                  scoreColorClasses = isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-500/40'
                    : 'hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300';
                } else if (score >= 7) {
                  scoreColorClasses = isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30 ring-2 ring-blue-500/40'
                    : 'hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-700 dark:hover:text-blue-300';
                } else if (score >= 5) {
                  scoreColorClasses = isSelected
                    ? 'bg-amber-600 text-white border-amber-600 shadow-lg shadow-amber-500/30 ring-2 ring-amber-500/40'
                    : 'hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-700 dark:hover:text-amber-300';
                } else {
                  scoreColorClasses = isSelected
                    ? 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-500/30 ring-2 ring-rose-500/40'
                    : 'hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300';
                }

                return (
                  <button
                    key={score}
                    type="button"
                    onClick={() => setRating(score)}
                    onMouseEnter={() => setHoverRating(score)}
                    onMouseLeave={() => setHoverRating(null)}
                    className={`h-14 rounded-2xl border font-extrabold text-lg sm:text-xl flex flex-col items-center justify-center transition-all cursor-pointer ${scoreColorClasses}`}
                  >
                    <span>{score}</span>
                    <span className="text-[10px] font-medium opacity-80 -mt-1">
                      {score === 10 ? 'Aʼlo' : score >= 8 ? 'Zo‘r' : score >= 5 ? 'O‘rta' : 'Past'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Darsdan mamnunlik darajasi */}
          <div className="space-y-3">
            <label className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-pink-500" />
              <span>3. Dars jarayonidan umumiy mamnunlik darajangiz:</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Juda aʼlo', emoji: '🤩', desc: 'Darslar doim qiziq va juda tushunarli' },
                { label: 'Yaxshi', emoji: '😊', desc: 'Umuman olganda darslar yoqmoqda' },
                { label: 'Oʻrtacha', emoji: '😐', desc: 'Yaxshi, ammo kamchiliklari bor' },
                { label: 'Qoniqarsiz', emoji: '😕', desc: 'Dars o‘tish uslubi menga yoqmayapti' },
              ].map((item) => {
                const isSelected = satisfaction === item.label;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setSatisfaction(item.label)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/40 dark:border-indigo-500 shadow-md ring-2 ring-indigo-500/30'
                        : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark-secondary hover:border-gray-300 dark:hover:border-gray-700'
                    }`}
                  >
                    <span className="text-2xl">{item.emoji}</span>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-gray-900 dark:text-gray-100">
                        {item.label}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                        {item.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Takliflar bo‘limi (Darsni yanada qiziqarli qilish) */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                <span>4. Darsda nimalar qilinsa sizga yanada qiziq va foydali bo‘ladi? (Takliflaringiz)</span>
              </label>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Tayyor takliflarni ustiga bosing
              </span>
            </div>

            {/* Quick Chips */}
            <div className="flex flex-wrap items-center gap-2">
              {quickSuggestions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleAddSuggestionTag(tag)}
                  className="text-xs font-medium px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>+</span>
                  <span>{tag}</span>
                </button>
              ))}
            </div>

            <textarea
              rows={4}
              value={suggestions}
              onChange={(e) => setSuggestions(e.target.value)}
              placeholder="Masalan: Darsda har haftada amaliy musobaqa o‘tkazilsa, yoki mavzular bo‘yicha qo‘shimcha interaktiv slaydlar berilsa juda foydali bo‘lar edi..."
              className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-surface-dark-tertiary text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Shikoyat va Eʼtirozlar bo‘limi */}
          <div className="space-y-3">
            <label className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <span>5. Dars yoki ustoz bo‘yicha eʼtiroz va shikoyatlaringiz bormi? (Ixtiyoriy)</span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Dars o‘z vaqtida boshlanishi, tushuntirish uslubi yoki boshqa biror kamchilik bo‘lsa ochiq yozing. Maʼmuriyat albatta nazoratga oladi.
            </p>
            <textarea
              rows={3}
              value={complaints}
              onChange={(e) => setComplaints(e.target.value)}
              placeholder="Agar biror kamchilik, tushunarsiz joylar yoki eʼtirozingiz bo‘lsa, yozib qoldirishingiz mumkin..."
              className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-surface-dark-tertiary text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
            />
          </div>

          {/* Anonimlik sozlamasi */}
          <div className="flex items-start sm:items-center gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-surface-dark-tertiary border border-gray-200 dark:border-gray-700">
            <input
              type="checkbox"
              id="anonymous-toggle"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="mt-0.5 sm:mt-0 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 cursor-pointer"
            />
            <label htmlFor="anonymous-toggle" className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 cursor-pointer">
              <span className="font-bold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-500" />
                Fikrimni mutlaqo anonim (maxfiy) tarzda yuborish
              </span>
              <span className="block text-gray-500 dark:text-gray-400 text-[11px] sm:text-xs mt-0.5">
                Belgilasangiz, sizning ism-familiyangiz ustozga yoki ommaga ko‘rinmaydi, faqat "Anonim o‘quvchi" deb aks etadi.
              </span>
            </label>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Yuborilmoqda...' : 'Fikr-mulohazani Yuborish'}</span>
            </Button>
          </div>
        </form>
      </Card>

      {/* 4. Avval yuborilgan fikr-mulohazalarim tarixi */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Mening avvalgi fikr-mulohazalarim tarixi</span>
          </h2>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Jami: {myFeedbacks.length} ta yuborilgan
          </span>
        </div>

        {myFeedbacks.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-gray-300 dark:border-gray-800 text-center bg-gray-50/50 dark:bg-surface-dark-secondary/50">
            <MessageSquare className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Hali fikr-mulohaza qoldirmagansiz
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Yuqoridagi shaklni to‘ldirib, birinchi fikringizni yuborishingiz mumkin.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myFeedbacks.map((fb) => (
              <Card key={fb.id} className="p-5 space-y-3.5 relative border border-gray-200 dark:border-gray-800">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                      {fb.teacher_name}
                    </h4>
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      {fb.subject} • {fb.group_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-black flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
                      <span>{fb.rating} / 10</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteFeedback(fb.id)}
                      className="p-1 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="O‘chirish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-medium">
                    Mamnunlik: {fb.satisfaction}
                  </span>
                  {fb.is_anonymous ? (
                    <span className="px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium flex items-center gap-1 text-[11px]">
                      <Lock className="w-3 h-3" /> Anonim
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium text-[11px]">
                      Ochiq fikr
                    </span>
                  )}
                  <span className="text-gray-400 text-[11px] ml-auto">
                    {new Date(fb.created_at).toLocaleDateString('uz-UZ')}
                  </span>
                </div>

                {fb.suggestions && (
                  <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50 text-xs">
                    <strong className="block text-amber-900 dark:text-amber-300 font-semibold mb-1 flex items-center gap-1">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                      Taklif:
                    </strong>
                    <span className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {fb.suggestions}
                    </span>
                  </div>
                )}

                {fb.complaints && (
                  <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-800/50 text-xs">
                    <strong className="block text-rose-900 dark:text-rose-300 font-semibold mb-1 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      Eʼtiroz / Shikoyat:
                    </strong>
                    <span className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {fb.complaints}
                    </span>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
