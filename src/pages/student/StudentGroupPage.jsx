import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  GraduationCap,
  Users,
  Calendar,
  Clock,
  MapPin,
  User,
  MessageSquare,
  Award,
  CheckSquare,
  ArrowRight,
  BookOpen,
  Phone,
  Sparkles,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import { localStore } from '@/lib/localStore';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';

export default function StudentGroupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const normalizedUserId = localStore.normalizeUserId(user?.id || profile?.id);

  // Find student's enrolled group and classmates
  const { studentGroup, classmates, teacherUser } = useMemo(() => {
    const allGroups = localStore.getGroups();
    const allUsers = localStore.getUsers();
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
      return { studentGroup: null, classmates: [], teacherUser: null };
    }

    // Get group member IDs from memberships and student_ids
    const groupMemberIds = memberships
      .filter((m) => m.group_id === group.id && m.is_active !== false)
      .map((m) => localStore.normalizeUserId(m.student_id));

    const enrolledStudents = allUsers.filter(
      (u) =>
        u.role === 'student' &&
        ((Array.isArray(group.student_ids) &&
          group.student_ids.map((id) => localStore.normalizeUserId(id)).includes(u.id)) ||
          groupMemberIds.includes(localStore.normalizeUserId(u.id)))
    );

    const teacher = allUsers.find(
      (u) => u.id === group.teacher_id || u.fullName === group.teacher_name
    );

    return {
      studentGroup: group,
      classmates: enrolledStudents,
      teacherUser: teacher || {
        first_name: group.teacher_name || 'Ustoz',
        last_name: '',
        fullName: group.teacher_name || 'Ustoz',
        phone: '+998 90 333 44 55',
      },
    };
  }, [normalizedUserId]);

  if (!studentGroup) {
    return (
      <div className="space-y-6 animate-fade-in p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              <GraduationCap className="w-7 h-7 text-[#123D78] dark:text-blue-400" />
              {t('dashboard.myGroup', 'Mening guruhim')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Guruh ma'lumotlari, o‘qituvchi va guruhdoshlar ro‘yxati
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-900/60 shadow-sm">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Siz hali guruhga aʼzo emassiz
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Hozircha siz hech bir faol o‘quv guruhiga biriktirilmagansiz. Administrator sizni guruhga biriktirgandan so‘ng, guruh maʼlumotlari va guruhdoshlaringiz shu yerda aks etadi.
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
      {/* Group Hero Banner */}
      <div className="bg-gradient-to-r from-[#123D78] via-[#1b4b8a] to-[#2563EB] dark:from-emerald-600 dark:via-emerald-700 dark:to-teal-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-6 -mr-6 w-56 h-56 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-white/90 border border-white/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Faol o‘quv guruhi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {studentGroup.name}
            </h1>
            <p className="text-sm text-blue-100 dark:text-emerald-100 max-w-xl">
              {studentGroup.course_name || 'Kurs mashg‘ulotlari'} • Kod: {studentGroup.code || 'FE24-01'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => navigate('/student/chat')}
              className="bg-white hover:bg-white/90 text-[#123D78] font-bold shadow-md cursor-pointer border-0"
              icon={MessageSquare}
            >
              Guruh chati
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/student/schedule')}
              className="bg-white/15 hover:bg-white/25 text-white font-bold border-white/30 cursor-pointer"
              icon={Calendar}
            >
              Dars jadvali
            </Button>
          </div>
        </div>

        {/* Quick Highlights Bar */}
        <div className="mt-6 pt-5 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <span className="text-[11px] text-blue-200 block uppercase font-medium">Auditoriya</span>
            <span className="text-sm font-bold flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-4 h-4 text-sky-300 dark:text-emerald-300" />
              {studentGroup.room || '101-xona'}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-blue-200 block uppercase font-medium">Dars vaqti</span>
            <span className="text-sm font-bold flex items-center gap-1.5 mt-0.5">
              <Clock className="w-4 h-4 text-amber-300" />
              {studentGroup.schedule || 'Dush-Chor-Jum, 18:00 - 20:00'}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-blue-200 block uppercase font-medium">Guruh tarkibi</span>
            <span className="text-sm font-bold flex items-center gap-1.5 mt-0.5">
              <Users className="w-4 h-4 text-cyan-300" />
              {classmates.length} nafar o‘quvchi
            </span>
          </div>
          <div>
            <span className="text-[11px] text-blue-200 block uppercase font-medium">Holati</span>
            <span className="text-sm font-bold flex items-center gap-1.5 mt-0.5">
              <ShieldCheck className="w-4 h-4 text-sky-300 dark:text-emerald-300" />
              Faol darslar
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Teacher and Classmates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Teacher Card & Group Info */}
        <div className="space-y-6">
          {/* Teacher Profile Card */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-[#123D78] dark:text-blue-400" />
                Guruh o‘qituvchisi
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-900/60">
                Ustoz
              </span>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-xl flex items-center justify-center shadow-md">
                {(teacherUser.first_name || 'U').charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">
                  {teacherUser.fullName || `${teacherUser.first_name || ''} ${teacherUser.last_name || ''}`.trim() || 'Bobur Mirzayev'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {studentGroup.course_name || 'Mutaxassis ustoz'}
                </p>
                {teacherUser.phone && (
                  <p className="text-xs font-mono text-gray-600 dark:text-gray-300 mt-1 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-500" />
                    {teacherUser.phone}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                className="w-full justify-center"
                icon={MessageSquare}
                onClick={() => navigate('/student/chat')}
              >
                Guruh chatida savol berish
              </Button>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider text-xs">
              Mening bo‘limlarim
            </h2>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => navigate('/student/schedule')}
                className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-gray-200/60 dark:border-gray-700/60 flex items-center justify-between text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white block">
                      Dars jadvali
                    </span>
                    <span className="text-[11px] text-gray-500">
                      Haftalik dars soatlari
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/student/grades')}
                className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 hover:bg-blue-50 dark:hover:bg-emerald-950/30 border border-gray-200/60 dark:border-gray-700/60 flex items-center justify-between text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-emerald-900/50 text-blue-600 dark:text-emerald-300 flex items-center justify-center">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white block">
                      Mening baholarim
                    </span>
                    <span className="text-[11px] text-gray-500">
                      Darslardagi baholar tarixi
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/student/attendance')}
                className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 hover:bg-purple-50 dark:hover:bg-purple-950/30 border border-gray-200/60 dark:border-gray-700/60 flex items-center justify-between text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 flex items-center justify-center">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white block">
                      Mening davomatim
                    </span>
                    <span className="text-[11px] text-gray-500">
                      Taqvim va qatnashuv foizi
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Classmates List */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-500" />
                  Guruhdoshlar ro‘yxati
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Ushbu guruhga biriktirilgan faol o‘quvchilar ({classmates.length} nafar)
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-emerald-950/60 text-blue-700 dark:text-emerald-300 font-bold text-xs border border-blue-200 dark:border-emerald-900/60">
                {classmates.length} / {studentGroup.capacity || 16} o‘rin
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {classmates.map((student, idx) => {
                const isCurrent =
                  student.id === normalizedUserId ||
                  student.username === user?.username ||
                  student.phone === user?.phone;

                return (
                  <div
                    key={student.id || idx}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center gap-3.5 ${
                      isCurrent
                        ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-400 dark:border-blue-700 ring-2 ring-blue-500/20'
                        : 'bg-gray-50/70 dark:bg-gray-800/40 border-gray-200/70 dark:border-gray-700/60 hover:bg-gray-100/70'
                    }`}
                  >
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        isCurrent
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                      }`}
                    >
                      {(student.first_name || 'O').charAt(0)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                          {student.fullName || `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'O‘quvchi'}
                        </span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.2 rounded bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider shrink-0">
                            Siz
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-gray-500 dark:text-gray-400 font-mono mt-0.5 truncate">
                        {student.phone || student.username || 'Faol'}
                      </div>
                    </div>

                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 shrink-0">
                      Faol
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
