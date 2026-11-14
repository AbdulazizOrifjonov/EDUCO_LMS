import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  Clock,
  Plus,
  Building2,
  Trash2,
  Edit2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Users,
  GraduationCap,
  User,
  BookOpen,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';
import { toast } from '@/components/ui/Toast';
import { useTwoStepConfirm } from '@/context/ConfirmContext';
import { localStore } from '@/lib/localStore';
import useAuth from '@/hooks/useAuth';
import LessonForm from './LessonForm';
import { getGroups } from '@/services/groupService';
import { getTeachers } from '@/services/userService';

const DAYS = [
  { id: 1, key: 'monday', name: 'Dushanba', short: 'Dush', pattern: 'odd' },
  { id: 2, key: 'tuesday', name: 'Seshanba', short: 'Sesh', pattern: 'even' },
  { id: 3, key: 'wednesday', name: 'Chorshanba', short: 'Chor', pattern: 'odd' },
  { id: 4, key: 'thursday', name: 'Payshanba', short: 'Pay', pattern: 'even' },
  { id: 5, key: 'friday', name: 'Juma', short: 'Jum', pattern: 'odd' },
  { id: 6, key: 'saturday', name: 'Shanba', short: 'Shan', pattern: 'even' },
  { id: 7, key: 'sunday', name: 'Yakshanba', short: 'Yak', pattern: 'sunday' },
];

/**
 * High-contrast, easily distinguishable color theme helper for subjects
 */
const getSubjectColor = (groupName, courseName, existingColor) => {
  if (existingColor && existingColor !== '#123D78' && existingColor !== '#064e3b' && existingColor !== '#000000') {
    return existingColor;
  }
  const name = `${groupName || ''} ${courseName || ''}`.toLowerCase();
  if (name.includes('matem') || name.includes('math')) return '#059669'; // Emerald Green
  if (name.includes('rus') || name.includes('russian')) return '#ea580c'; // Vibrant Orange
  if (name.includes('mental')) return '#d946ef'; // Magenta / Pink
  if (name.includes('ingliz') || name.includes('english')) return '#2563eb'; // Royal Blue
  if (name.includes('arab') || name.includes('arabic')) return '#0891b2'; // Cyan / Teal
  if (name.includes('shaxmat') || name.includes('chess')) return '#7c3aed'; // Purple
  if (name.includes('python') || name.includes('dastur') || name.includes('it') || name.includes('frontend')) return '#0284c7'; // Sky Blue
  if (name.includes('fizika') || name.includes('physics')) return '#dc2626'; // Red
  if (name.includes('ona tili') || name.includes('adabiyot')) return '#4f46e5'; // Indigo
  if (name.includes('biolog') || name.includes('kimyo')) return '#16a34a'; // Green
  return existingColor || '#2563eb';
};

export default function ScheduleManagement() {
  const { t } = useTranslation();
  const { confirmDelete } = useTwoStepConfirm();
  const { profile } = useAuth();
  const isTeacher = profile?.role === 'teacher';
  const teacherFullName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || profile?.name || profile?.full_name || '';

  const [schedules, setSchedules] = useState([]);
  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [patternFilter, setPatternFilter] = useState('all'); // 'all' | 'odd' | 'even'
  const [groupFilter, setGroupFilter] = useState('all');
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [roomFilter, setRoomFilter] = useState('all');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [initialSlot, setInitialSlot] = useState({ day: 1, time: '09:00' });
  const [mobileDay, setMobileDay] = useState(1);

  const fetchScheduleData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const data = localStore.getSchedules();

      const formatted = (data || []).map((s) => ({
        ...s,
        groupName: s.groups?.name || s.groupName || 'Group',
        courseName: s.groups?.courses?.name || s.courseName || '',
        color: s.groups?.courses?.color || s.color || '#123D78',
        teachers: (s.groups?.group_teachers || []).map((gt) => gt.profiles),
      }));

      setSchedules(formatted);
    } catch (err) {
      console.error(err);
      if (!isSilent) {
        toast.error(t('schedule.fetchError', 'Failed to load timetable'));
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchScheduleData();

    // Fetch groups and teachers for filtering
    const loadFilters = async () => {
      try {
        if (isTeacher) {
          const gRes = await getGroups({
            status: 'active',
            limit: 100,
            teacherId: profile?.id,
            teacherName: teacherFullName,
          });
          let groupList = gRes.groups || [];
          const myName = teacherFullName.trim().toLowerCase();
          const myId = profile?.id;
          groupList = groupList.filter((g) => {
            const matchId = (myId && (g.teacher_id === myId || g.teacherId === myId || g.primaryTeacher?.id === myId));
            const matchGt = Array.isArray(g.group_teachers) && g.group_teachers.some(t => (t.teacher_id || t.id || t.profiles?.id) === myId);
            const gName = (g.teacher_name || g.teacherName || g.primaryTeacher?.fullName || '').trim().toLowerCase();
            const matchName = myName && gName && (gName.includes(myName) || myName.includes(gName));
            return matchId || matchGt || matchName;
          });
          setGroups(groupList);
          setTeachers([]);
        } else {
          const [gRes, tRes] = await Promise.all([
            getGroups({ status: 'active', limit: 100 }),
            getTeachers(),
          ]);
          setGroups(gRes.groups || []);
          setTeachers(tRes || []);
        }
      } catch (err) {
        console.warn(err);
      }
    };
    loadFilters();

    const handleSync = () => {
      fetchScheduleData(true);
      loadFilters();
    };
    window.addEventListener('educo-data-sync', handleSync);
    return () => window.removeEventListener('educo-data-sync', handleSync);
  }, [fetchScheduleData, isTeacher, profile?.id, teacherFullName]);

  const handleDeleteLesson = async (id) => {
    const lesson = schedules.find((s) => s.id === id);
    const ok = await confirmDelete({
      title: 'Darsni jadvaldan o‘chirish',
      itemName: lesson ? `${lesson.group_name || lesson.groupName || 'Guruh'} (${lesson.room || 'Xona'})` : 'Dars',
      description: 'Ushbu dars vaqti va xonasi umumiy jadvaldan butunlay olib tashlanadi.',
    });
    if (!ok) return;
    try {
      localStore.deleteSchedule(id);
      toast.success(t('schedule.deleted', 'Dars jadvaldan o‘chirildi'));
      fetchScheduleData();
    } catch (err) {
      toast.error(t('common.error', 'Failed to delete lesson slot'));
    }
  };

  // Distinct rooms for filtering
  const distinctRooms = Array.from(new Set(schedules.map((s) => s.room).filter(Boolean)));

  // Filtered schedules
  const filteredSchedules = schedules.filter((s) => {
    if (isTeacher) {
      const myId = profile?.id;
      const myName = teacherFullName.trim().toLowerCase();
      const hasMyGroup = groups.some((g) => g.id === s.group_id);
      const hasMyId = s.teachers?.some((t) => t?.id === myId) || s.teacher_id === myId;
      const hasMyName = s.teachers?.some((t) => {
        const tName = `${t?.first_name || ''} ${t?.last_name || ''}`.trim().toLowerCase();
        return myName && tName && (tName.includes(myName) || myName.includes(tName));
      }) || (s.teacher_name && myName && s.teacher_name.toLowerCase().includes(myName));

      // Fast check direct from localStore groups
      let groupMatchesTeacher = false;
      if (!hasMyGroup && !hasMyId && !hasMyName && s.group_id) {
        const directG = localStore.getGroups?.().find((g) => g.id === s.group_id);
        if (directG) {
          const directTid = directG.teacher_id || directG.teacherId;
          const directTname = (directG.teacher_name || directG.teacherName || '').toLowerCase();
          groupMatchesTeacher = (myId && directTid === myId) || (myName && directTname && (directTname.includes(myName) || myName.includes(directTname)));
        }
      }

      if (!hasMyGroup && !hasMyId && !hasMyName && !groupMatchesTeacher) return false;
    }

    if (patternFilter === 'odd' && ![1, 3, 5].includes(Number(s.day_of_week))) return false;
    if (patternFilter === 'even' && ![2, 4, 6].includes(Number(s.day_of_week))) return false;
    if (groupFilter !== 'all' && s.group_id !== groupFilter) return false;
    if (roomFilter !== 'all' && s.room !== roomFilter) return false;
    if (!isTeacher && teacherFilter !== 'all') {
      const hasTeacher = s.teachers?.some((teach) => teach?.id === teacherFilter);
      if (!hasTeacher) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-24 sm:pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2.5">
            <Calendar className="w-7 h-7 text-brand-navy dark:text-blue-400" />
            {isTeacher ? 'Mening dars jadvalim' : t('nav.schedule', 'Dars jadvali')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('schedule.subtitle', 'Toq kunlar (Dush-Chor-Jum) va Juft kunlar (Sesh-Pay-Shan) bo‘yicha haftalik dars jadvali')}
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={Plus}
          onClick={() => {
            setSelectedLesson(null);
            setInitialSlot({ day: patternFilter === 'even' ? 2 : 1, time: '09:00' });
            setIsFormOpen(true);
          }}
        >
          {t('schedule.addLesson', 'Dars qo‘shish')}
        </Button>
      </div>

      {/* Filters */}
      <Card noPadding overflow="visible" className="relative z-30">
        <div className="p-4 space-y-3 overflow-visible">
          {/* Quick Odd / Even Days Toggle */}
          <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setPatternFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                patternFilter === 'all'
                  ? 'bg-blue-600 dark:bg-emerald-600 text-white shadow-sm shadow-blue-600/30 dark:shadow-emerald-600/30'
                  : 'bg-gray-100 dark:bg-surface-dark-tertiary text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              Barcha kunlar
            </button>
            <button
              type="button"
              onClick={() => setPatternFilter('odd')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                patternFilter === 'odd'
                  ? 'bg-blue-600 dark:bg-emerald-600 text-white shadow-sm shadow-blue-600/30 dark:shadow-emerald-600/30'
                  : 'bg-gray-100 dark:bg-surface-dark-tertiary text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              <span>Toq kunlar</span>
              <span className="opacity-75 font-medium">(Dush • Chor • Jum)</span>
            </button>
            <button
              type="button"
              onClick={() => setPatternFilter('even')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                patternFilter === 'even'
                  ? 'bg-blue-600 dark:bg-emerald-600 text-white shadow-sm shadow-blue-600/30 dark:shadow-emerald-600/30'
                  : 'bg-gray-100 dark:bg-surface-dark-tertiary text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              <span>Juft kunlar</span>
              <span className="opacity-75 font-medium">(Sesh • Pay • Shan)</span>
            </button>
          </div>

          <div className={`grid grid-cols-1 ${isTeacher ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-3`}>
            {/* Group Filter */}
            <Select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              placeholder={t('groups.allGroups', 'Barcha o‘quv guruhlari')}
              headerTitle={t('groups.title', 'Guruh bo‘yicha jadval')}
              icon={Users}
              size="sm"
              options={[
                { value: 'all', label: t('groups.allGroups', 'Barcha o‘quv guruhlari'), subtitle: `${groups.length} ta guruh` },
                ...groups.map((g) => ({
                  value: g.id,
                  label: g.name,
                  subtitle: `${g.courseName || 'Kurs'} • ${g.room ? g.room + '-xona' : ''}`,
                  color: g.courseColor || '#123D78',
                })),
              ]}
            />

            {/* Teacher Filter - only for Owner/Admin */}
            {!isTeacher && (
              <Select
                value={teacherFilter}
                onChange={(e) => setTeacherFilter(e.target.value)}
                placeholder={t('groups.allTeachers', 'Barcha o‘qituvchilar')}
                headerTitle={t('users.filterByTeacher', 'Ustoz bo‘yicha jadval')}
                icon={GraduationCap}
                size="sm"
                options={[
                  { value: 'all', label: t('groups.allTeachers', 'Barcha o‘qituvchilar'), subtitle: `${teachers.length} ta o‘qituvchi` },
                  ...teachers.map((teach) => ({
                    value: teach.id,
                    label: teach.fullName,
                    subtitle: teach.phone || 'O‘qituvchi',
                    color: '#123D78',
                  })),
                ]}
              />
            )}

            {/* Room Filter */}
            <Select
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              placeholder={t('schedule.allRooms', 'Barcha xonalar')}
              headerTitle={t('schedule.rooms', 'Xona bo‘yicha')}
              icon={Building2}
              size="sm"
              options={[
                { value: 'all', label: t('schedule.allRooms', 'Barcha xonalar'), subtitle: `${distinctRooms.length} ta xona` },
                ...distinctRooms.map((r) => ({
                  value: r,
                  label: r.toLowerCase().includes('xona') ? r : `${r}-xona`,
                  subtitle: 'Dars xonasi',
                  color: '#059669',
                })),
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Desktop Weekly Grid View */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark-secondary shadow-card">
        <div className="min-w-[850px]">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-800 bg-gray-100/90 dark:bg-surface-dark-tertiary">
            {DAYS.map((day) => {
              const dayLessons = filteredSchedules.filter((s) => Number(s.day_of_week) === day.id);
              const isSunday = day.pattern === 'sunday';
              return (
                <div
                  key={day.id}
                  className={`p-3 text-center border-r last:border-r-0 border-gray-200 dark:border-gray-800 ${
                    isSunday ? 'bg-rose-50/50 dark:bg-rose-950/20' : ''
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <p className="font-extrabold text-sm text-gray-900 dark:text-gray-100">
                      {t(`schedule.${day.key}`, day.name)}
                    </p>
                    {day.pattern !== 'sunday' && (
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-2xs ${
                          day.pattern === 'odd'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/60'
                        }`}
                      >
                        {day.pattern === 'odd' ? 'Toq' : 'Juft'}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-gray-600 dark:text-gray-400 mt-0.5 block">
                    {dayLessons.length} {t('schedule.lessonsCount', 'dars')}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Day Columns */}
          <div className="grid grid-cols-7 min-h-[520px] divide-x divide-gray-200 dark:divide-gray-800 bg-slate-50/60 dark:bg-gray-950/30">
            {DAYS.map((day) => {
              const dayLessons = filteredSchedules
                .filter((s) => Number(s.day_of_week) === day.id)
                .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

              return (
                <div
                  key={day.id}
                  className="p-2 space-y-2.5 transition-colors"
                >
                  {dayLessons.length === 0 ? (
                    <div
                      onClick={() => {
                        setSelectedLesson(null);
                        setInitialSlot({ day: day.id, time: '09:00' });
                        setIsFormOpen(true);
                      }}
                      className="h-28 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-surface-dark-secondary/60 flex flex-col items-center justify-center text-gray-500 hover:text-blue-600 hover:border-blue-500 cursor-pointer transition-all p-2 text-center group"
                    >
                      <Plus className="w-4 h-4 mb-1 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      <span className="text-[11px] font-bold">{t('schedule.addLesson', 'Dars qo‘shish')}</span>
                    </div>
                  ) : (
                    dayLessons.map((item) => {
                      const cardColor = getSubjectColor(item.groupName, item.courseName, item.color);
                      const teacher = item.teachers?.[0];
                      const teacherName = teacher ? `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim() : null;

                      return (
                        <div
                          key={item.id}
                          className="group relative rounded-xl p-3 bg-white dark:bg-surface-dark-secondary border border-gray-200/90 dark:border-gray-700/80 shadow-xs hover:shadow-md transition-all duration-150 hover:-translate-y-0.5"
                          style={{
                            borderLeftWidth: '5px',
                            borderLeftColor: cardColor,
                            backgroundColor: `${cardColor}14`,
                          }}
                        >
                          {/* Course / Group Title */}
                          <div className="flex items-start justify-between gap-1 mb-1.5">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="w-2 h-2 rounded-full shrink-0 shadow-2xs"
                                  style={{ backgroundColor: cardColor }}
                                />
                                <h4
                                  className="font-extrabold text-xs text-gray-950 dark:text-white leading-tight truncate"
                                  title={item.groupName}
                                >
                                  {item.groupName}
                                </h4>
                              </div>
                              {item.courseName && item.courseName.toLowerCase() !== item.groupName.toLowerCase() && (
                                <p className="text-[10px] font-semibold text-gray-600 dark:text-gray-300 truncate mt-0.5 pl-3.5">
                                  {item.courseName}
                                </p>
                              )}
                            </div>

                            {/* Actions on hover */}
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 bg-white/95 dark:bg-gray-800/95 rounded-md p-0.5 shadow-xs border border-gray-200/70 dark:border-gray-700">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedLesson(item);
                                  setIsFormOpen(true);
                                }}
                                className="p-1 hover:text-blue-600 text-gray-500 rounded transition-colors"
                                title={t('common.edit', 'Tahrirlash')}
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteLesson(item.id)}
                                className="p-1 hover:text-red-600 text-gray-500 rounded transition-colors"
                                title={t('common.delete', 'O‘chirish')}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Time & Room Pills */}
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {/* Time Chip */}
                              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-extrabold bg-white dark:bg-gray-800 text-gray-950 dark:text-white border border-gray-200/90 dark:border-gray-700 shadow-2xs">
                                <Clock className="w-3 h-3 shrink-0" style={{ color: cardColor }} />
                                <span>
                                  {item.start_time?.slice(0, 5)} - {item.end_time?.slice(0, 5)}
                                </span>
                              </div>

                              {/* Room Chip */}
                              {item.room && (
                                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200/90 dark:border-gray-700 shadow-2xs">
                                  <Building2 className="w-3 h-3 text-gray-500 shrink-0" />
                                  <span>{item.room.toLowerCase().includes('xona') ? item.room : `${item.room}-xona`}</span>
                                </div>
                              )}
                            </div>

                            {/* Teacher Info - High Contrast, Crystal Clear */}
                            {teacherName && (
                              <div className="flex items-center gap-1.5 pt-1.5 border-t border-gray-200/70 dark:border-gray-700/60">
                                <div
                                  className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0 shadow-2xs"
                                  style={{ backgroundColor: cardColor }}
                                >
                                  {teacherName.charAt(0)}
                                </div>
                                <span className="text-[11px] font-bold text-gray-900 dark:text-gray-100 truncate">
                                  {teacherName}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Add additional slot button at bottom of day column */}
                  {dayLessons.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLesson(null);
                        setInitialSlot({ day: day.id, time: '14:00' });
                        setIsFormOpen(true);
                      }}
                      className="w-full py-1.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-surface-dark-secondary/40 text-[11px] font-bold text-gray-600 dark:text-gray-400 hover:text-blue-600 hover:border-blue-500 dark:hover:text-blue-400 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{t('schedule.addLesson', 'Dars qo‘shish')}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Day-by-Day View (Zero horizontal scroll) */}
      <div className="block md:hidden space-y-3.5">
        {/* 7-Day Quick Selector Grid */}
        <div className="grid grid-cols-7 gap-1 p-1 rounded-2xl bg-gray-100 dark:bg-surface-dark-tertiary">
          {DAYS.map((day) => {
            const isSelected = mobileDay === day.id;
            const count = filteredSchedules.filter((s) => Number(s.day_of_week) === day.id).length;
            return (
              <button
                key={day.id}
                type="button"
                onClick={() => setMobileDay(day.id)}
                className={`py-2 px-1 rounded-xl text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-brand-navy text-white shadow-sm font-bold scale-[1.03]'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-800/60'
                }`}
              >
                <div className="text-[11px] leading-tight">{day.short}</div>
                <div
                  className={`text-[10px] mt-0.5 font-bold ${
                    isSelected ? 'text-emerald-100' : 'text-gray-400'
                  }`}
                >
                  {count}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Day Header & Add Button */}
        {(() => {
          const currentDayObj = DAYS.find((d) => d.id === mobileDay) || DAYS[0];
          const currentDayLessons = filteredSchedules
            .filter((s) => Number(s.day_of_week) === mobileDay)
            .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

          return (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
                    {t(`schedule.${currentDayObj.key}`, currentDayObj.name)}
                  </h3>
                  {currentDayObj.pattern !== 'sunday' && (
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        currentDayObj.pattern === 'odd'
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300'
                      }`}
                    >
                      {currentDayObj.pattern === 'odd' ? 'Toq kun' : 'Juft kun'}
                    </span>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  icon={Plus}
                  className="text-xs py-1 px-2.5 h-8"
                  onClick={() => {
                    setSelectedLesson(null);
                    setInitialSlot({ day: mobileDay, time: '09:00' });
                    setIsFormOpen(true);
                  }}
                >
                  {t('schedule.addLesson', 'Dars qo‘shish')}
                </Button>
              </div>

              {/* Day Lessons List */}
              {currentDayLessons.length === 0 ? (
                <div
                  onClick={() => {
                    setSelectedLesson(null);
                    setInitialSlot({ day: mobileDay, time: '09:00' });
                    setIsFormOpen(true);
                  }}
                  className="py-10 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark-secondary flex flex-col items-center justify-center text-gray-400 hover:text-brand-navy hover:border-brand-navy cursor-pointer transition-colors p-4 text-center shadow-xs"
                >
                  <Plus className="w-8 h-8 mb-2 text-gray-300 dark:text-gray-600" />
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                    {currentDayObj.name} kuniga dars rejalashtirilmagan
                  </p>
                  <span className="text-[11px] text-brand-navy dark:text-blue-400 mt-1">
                    + Yangi dars qo‘shish uchun bosing
                  </span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {currentDayLessons.map((item) => {
                    const cardColor = getSubjectColor(item.groupName, item.courseName, item.color);
                    const teacher = item.teachers?.[0];
                    const teacherName = teacher ? `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim() : null;

                    return (
                      <div
                        key={item.id}
                        className="rounded-2xl p-4 border border-gray-200/90 dark:border-gray-700/80 bg-white dark:bg-surface-dark-secondary shadow-xs hover:shadow-md space-y-3 transition-all"
                        style={{
                          borderLeftWidth: '5px',
                          borderLeftColor: cardColor,
                          backgroundColor: `${cardColor}14`,
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                                style={{ backgroundColor: cardColor }}
                              />
                              <h4 className="font-extrabold text-sm text-gray-950 dark:text-white truncate">
                                {item.groupName}
                              </h4>
                            </div>
                            {item.courseName && item.courseName.toLowerCase() !== item.groupName.toLowerCase() && (
                              <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mt-0.5 pl-4 truncate">
                                {item.courseName}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0 bg-white/95 dark:bg-gray-800/95 rounded-lg p-0.5 shadow-xs border border-gray-200/70 dark:border-gray-700">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedLesson(item);
                                setIsFormOpen(true);
                              }}
                              className="p-1.5 hover:text-blue-600 text-gray-500 rounded-lg transition-colors"
                              title={t('common.edit', 'Tahrirlash')}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteLesson(item.id)}
                              className="p-1.5 hover:text-red-600 text-gray-500 rounded-lg transition-colors"
                              title={t('common.delete', 'O‘chirish')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-gray-200/70 dark:border-gray-700/60 text-xs">
                          {/* Time Chip */}
                          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-extrabold bg-white dark:bg-gray-800 text-gray-950 dark:text-white border border-gray-200/90 dark:border-gray-700 shadow-2xs">
                            <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: cardColor }} />
                            <span>
                              {item.start_time?.slice(0, 5)} - {item.end_time?.slice(0, 5)}
                            </span>
                          </div>

                          {/* Room Chip */}
                          {item.room && (
                            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200/90 dark:border-gray-700 shadow-2xs">
                              <Building2 className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                              <span>{item.room.toLowerCase().includes('xona') ? item.room : `${item.room}-xona`}</span>
                            </div>
                          )}
                        </div>

                        {/* Teacher Info */}
                        {teacherName && (
                          <div className="flex items-center gap-2 pt-1 border-t border-gray-200/60 dark:border-gray-700/60">
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-2xs"
                              style={{ backgroundColor: cardColor }}
                            >
                              {teacherName.charAt(0)}
                            </div>
                            <span className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                              Ustoz: {teacherName}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Lesson Modal */}
      {isFormOpen && (
        <LessonForm
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedLesson(null);
          }}
          lesson={selectedLesson}
          initialDay={initialSlot.day}
          initialTime={initialSlot.time}
          existingLessons={schedules}
          availableGroups={groups}
          isTeacher={isTeacher}
          onSuccess={fetchScheduleData}
        />
      )}
    </div>
  );
}
