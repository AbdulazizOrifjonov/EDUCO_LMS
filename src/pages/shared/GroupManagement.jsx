import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Plus,
  Search,
  Building2,
  Calendar,
  GraduationCap,
  Eye,
  Edit2,
  Archive,
  RotateCcw,
  Trash2,
  Clock,
  Sparkles,
  User,
  Phone,
  BookOpen,
  Split,
  AlertTriangle,
  LayoutGrid,
  List,
  ChevronRight,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Table from '@/components/ui/Table';
import Select from '@/components/ui/Select';
import { toast } from '@/components/ui/Toast';
import GroupSplitModal from '@/components/groups/GroupSplitModal';
import {
  getGroups,
  updateGroup,
  deleteGroup,
} from '@/services/groupService';
import { getCourses } from '@/services/courseService';
import { getTeachers } from '@/services/userService';
import { useSearch } from '@/context/SearchContext';
import { useTwoStepConfirm } from '@/context/ConfirmContext';
import { localStore } from '@/lib/localStore';

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
  if (name.includes('python') || name.includes('dastur') || name.includes('it') || name.includes('frontend') || name.includes('full stack')) return '#0284c7'; // Sky Blue
  if (name.includes('fizika') || name.includes('physics')) return '#dc2626'; // Red
  if (name.includes('ona tili') || name.includes('adabiyot')) return '#4f46e5'; // Indigo
  if (name.includes('biolog') || name.includes('kimyo')) return '#16a34a'; // Green
  return existingColor || '#2563eb';
};

export default function GroupManagement() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { confirmDelete } = useTwoStepConfirm();
  const currentUserRole = profile?.role || 'owner';
  const isTeacher = currentUserRole === 'teacher';
  const teacherFullName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || profile?.name || profile?.full_name || '';
  const { searchQuery, setSearchQuery } = useSearch();

  const [groups, setGroups] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [splitModalGroup, setSplitModalGroup] = useState(null);

  // Identify groups with students exceeding or reaching capacity
  const overflowGroups = useMemo(() => {
    return groups.filter((g) => {
      const cnt = g.studentCount || g.enrolled_count || (g.student_ids || []).length || 0;
      const cap = g.capacity || 20;
      return cnt >= cap;
    });
  }, [groups]);

  // Filters
  const [search, setSearch] = useState(searchQuery || '');
  const [courseFilter, setCourseFilter] = useState('all');
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('educo_groups_view_mode') || 'cards';
    } catch (_) {
      return 'cards';
    }
  }); // 'cards' (default) or 'table'
  const [page, setPage] = useState(1);

  // Synchronize with global navbar search bar
  useEffect(() => {
    if (searchQuery !== undefined) {
      setSearch(searchQuery);
      setPage(1);
    }
  }, [searchQuery]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchFilters = async () => {
    try {
      if (isTeacher) {
        const cRes = await getCourses({ limit: 100 });
        setCourses(cRes.courses || []);
        setTeachers([]);
      } else {
        const [cRes, tRes] = await Promise.all([
          getCourses({ limit: 100 }),
          getTeachers(),
        ]);
        setCourses(cRes.courses || []);
        setTeachers(tRes || []);
      }
    } catch (e) {
      console.warn('Filter options fetch note:', e);
    }
  };

  const fetchGroups = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const effectiveTeacherId = isTeacher ? (profile?.id || profile?.userId) : teacherFilter;
      const effectiveTeacherName = isTeacher ? teacherFullName : '';

      const data = await getGroups({
        search,
        courseId: courseFilter,
        teacherId: effectiveTeacherId,
        teacherName: effectiveTeacherName,
        status: statusFilter,
        page,
        limit: 100,
      });

      let fetchedGroups = data.groups || [];
      if (isTeacher) {
        const myName = teacherFullName.trim().toLowerCase();
        const myId = profile?.id;
        const normMyId = localStore?.normalizeUserId ? localStore.normalizeUserId(myId) : myId;
        const myPhone = (profile?.phone || '').replace(/\D/g, '');
        const mySpecialty = (profile?.specialty || '').trim().toLowerCase();

        fetchedGroups = fetchedGroups.filter((g) => {
          const gTid = g.teacher_id || g.teacherId;
          const matchId = (myId && (gTid === myId || (localStore?.normalizeUserId && localStore.normalizeUserId(gTid) === normMyId) || g.primaryTeacher?.id === myId));
          const matchGt = Array.isArray(g.group_teachers) && g.group_teachers.some(t => {
            const tid = t.teacher_id || t.id || t.profiles?.id;
            return tid === myId || (localStore?.normalizeUserId && localStore.normalizeUserId(tid) === normMyId);
          });
          const gName = (g.teacher_name || g.teacherName || g.primaryTeacher?.fullName || '').trim().toLowerCase();
          const matchName = myName && gName && (gName.includes(myName) || myName.includes(gName));
          const matchPhone = myPhone && g.teacherPhone && g.teacherPhone.replace(/\D/g, '') === myPhone;
          const matchSpec = mySpecialty && ((g.name || '').toLowerCase().includes(mySpecialty) || (g.subject || '').toLowerCase().includes(mySpecialty));
          return matchId || matchGt || matchName || matchPhone || matchSpec;
        });
      }

      setGroups(fetchedGroups);
      setTotalPages(Math.ceil((fetchedGroups.length || data.totalCount || 1) / 12) || 1);
      setTotalCount(fetchedGroups.length);
    } catch (err) {
      console.error(err);
      if (!isSilent) {
        toast.error(t('groups.fetchError', 'Failed to load groups'));
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [search, courseFilter, teacherFilter, statusFilter, page, isTeacher, profile?.id, profile?.userId, teacherFullName, t]);

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Realtime cross-role sync: auto-refresh silently when another user/role creates or modifies groups
  useEffect(() => {
    const handleSync = () => fetchGroups(true);
    window.addEventListener('educo-data-sync', handleSync);
    return () => window.removeEventListener('educo-data-sync', handleSync);
  }, [fetchGroups]);

  const handleToggleArchive = async (group) => {
    const nextStatus = group.status === 'archived' ? 'active' : 'archived';
    if (nextStatus === 'archived') {
      const ok = await confirmDelete({
        title: 'Guruhni arxivlash',
        itemName: group.name,
        description: 'Ushbu guruh arxivlanadi va uning faol darslari to‘xtatiladi. Xohlagan vaqt qayta tiklashingiz mumkin.',
        confirmButtonText: 'Ha, guruh arxivlansin',
      });
      if (!ok) return;
    }
    try {
      await updateGroup(group.id, { status: nextStatus });
      toast.success(
        nextStatus === 'archived'
          ? t('groups.archived', 'Group archived')
          : t('groups.restored', 'Group restored')
      );
      fetchGroups();
    } catch (err) {
      toast.error(t('common.error', 'Failed to update group status'));
    }
  };

  const handleDeleteGroup = async (group) => {
    const ok = await confirmDelete({
      title: 'Guruhni butunlay o‘chirish',
      itemName: `${group.name} (${group.code || ''})`.trim(),
      description: 'Diqqat: Ushbu guruh tizimdan butunlay o‘chiriladi. Bu amalni ortga qaytarib bo‘lmaydi!',
      confirmButtonText: 'Ha, guruh butunlay o‘chirilsin',
    });
    if (!ok) return;

    try {
      await deleteGroup(group.id);
      toast.success(t('groups.deleteSuccess', 'Guruh muvaffaqiyatli o‘chirildi!'));
      fetchGroups();
    } catch (err) {
      console.error(err);
      toast.error(err.message || t('common.error', 'Guruhni o‘chirishda xatolik yuz berdi'));
    }
  };



  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'upcoming':
        return 'primary';
      case 'completed':
        return 'purple';
      case 'archived':
      default:
        return 'secondary';
    }
  };

  const displayedCourses = useMemo(() => {
    if (!isTeacher) return courses;
    const myCourseIds = new Set(groups.map((g) => g.course_id || g.courseId).filter(Boolean));
    const myCourseNames = new Set(groups.map((g) => g.courseName || g.course_name).filter(Boolean));
    return courses.filter((c) => myCourseIds.has(c.id) || myCourseNames.has(c.name));
  }, [isTeacher, courses, groups]);

  const columns = useMemo(() => {
    const cols = [
      {
        header: t('groups.group', 'Group Name'),
        key: 'name',
        render: (row) => (
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0 shadow-sm overflow-hidden"
              style={{ backgroundColor: row.courseColor || '#064e3b' }}
            >
              {row.avatar_url || row.image_url ? (
                <img
                  src={row.avatar_url || row.image_url}
                  alt={row.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Users className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 dark:text-gray-100">{row.name}</span>
                {row.room && (
                  <span className="text-[11px] px-2 py-0.5 rounded-md font-medium bg-gray-100 dark:bg-surface-dark-tertiary text-gray-600 dark:text-gray-300">
                    🚪 {row.room}-xona
                  </span>
                )}
              </div>
              {row.courseName && row.courseName.trim().toLowerCase() !== row.name.trim().toLowerCase() && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {row.courseName}
                </p>
              )}
            </div>
          </div>
        ),
      },
    ];

    if (!isTeacher) {
      cols.push({
        header: t('groups.primaryTeacher', 'Lead Teacher'),
        key: 'teacher',
        render: (row) => (
          <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
            {row.primaryTeacher?.fullName || t('groups.unassigned', 'Not Assigned')}
          </span>
        ),
      });
    }

    cols.push(
      {
        header: t('groups.capacity', 'Students / Capacity'),
        key: 'capacity',
        render: (row) => {
          const count = row.studentCount || 0;
          const cap = row.capacity || 20;
          const percent = Math.min(Math.round((count / cap) * 100), 100);
          const isOverloaded = count >= cap;
          return (
            <div className="w-36">
              <div className="flex items-center justify-between text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                <span className={isOverloaded ? 'text-brand-red font-bold' : ''}>
                  {count} / {cap}
                </span>
                <span className={isOverloaded ? 'text-brand-red font-bold' : 'text-gray-400'}>{percent}%</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-surface-dark-tertiary h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    percent >= 100 ? 'bg-brand-red' : percent > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              {isOverloaded && !isTeacher && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSplitModalGroup(row);
                  }}
                  className="mt-1 text-[10px] font-black px-1.5 py-0.5 rounded bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-950/80 dark:text-red-300 border border-red-300 dark:border-red-800 flex items-center gap-1 transition-all cursor-pointer active:scale-95 shadow-2xs"
                  title="Guruhni 2-guruhga ajratish (Split)"
                >
                  <Split className="w-2.5 h-2.5 shrink-0" />
                  <span>2-guruhga ajratish</span>
                </button>
              )}
            </div>
          );
        },
      },
      {
        header: t('nav.schedule', 'Dars jadvali'),
        key: 'schedule',
        render: (row) => {
          if (row.schedule) {
            return (
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-200/50">
                {row.schedule}
              </span>
            );
          }
          if (row.schedules && row.schedules.length > 0) {
            const first = row.schedules[0];
            const timeStr = first.start_time && first.end_time ? `${first.start_time.slice(0, 5)} - ${first.end_time.slice(0, 5)}` : '';
            return (
              <div className="text-xs space-y-0.5">
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-500/20 whitespace-nowrap">
                  <span>📅</span>
                  <span>{row.schedules.length} ta dars / hafta</span>
                </span>
                {timeStr && (
                  <span className="block text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                    {timeStr} {first.room ? `(${first.room})` : ''}
                  </span>
                )}
              </div>
            );
          }
          return (
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              {t('schedule.noSchedule', 'Dars jadvali tuzilmagan')}
            </span>
          );
        },
      },
      {
        header: t('courses.fee', 'Oylik to‘lov'),
        key: 'monthly_price',
        render: (row) => {
          const fee = Number(row.monthly_price || row.monthly_fee || 0);
          return (
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-500/20 whitespace-nowrap">
              {fee > 0 ? `${fee.toLocaleString()} so‘m` : 'Belgilanmagan'}
            </span>
          );
        },
      },
      {
        header: t('common.status', 'Status'),
        key: 'status',
        render: (row) => (
          <Badge variant={getStatusBadgeVariant(row.status)} size="sm">
            <span className="capitalize">
              {t(`groups.${row.status}`, t(`common.${row.status}`, row.status))}
            </span>
          </Badge>
        ),
      },
      {
        header: t('common.actions', 'Actions'),
        key: 'actions',
        className: 'text-right rtl:text-left',
        cellClassName: 'text-right rtl:text-left',
        render: (row) => (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="!p-1.5 h-8 w-8 text-gray-600 dark:text-gray-300 hover:text-brand-navy"
              title={t('groups.viewDetail', 'View Group Detail')}
              onClick={() => navigate(`/${currentUserRole}/groups/${row.id}`)}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="!p-1.5 h-8 w-8 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-lg"
              title={t('common.edit', 'Tahrirlash')}
              onClick={() => navigate(`/${currentUserRole}/groups/edit/${row.id}`)}
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            {!isTeacher && (
              <>
                {row.studentCount >= (row.capacity || 20) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="!p-1.5 h-8 w-8 text-red-600 hover:bg-red-500/10 rounded-lg"
                    title="Guruhni 2-guruhga ajratish (Split)"
                    onClick={() => setSplitModalGroup(row)}
                  >
                    <Split className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className={`!p-1.5 h-8 w-8 rounded-lg ${
                    row.status === 'archived'
                      ? 'text-emerald-600 hover:bg-emerald-500/10'
                      : 'text-amber-600 hover:bg-amber-500/10'
                  }`}
                  title={row.status === 'archived' ? t('common.restore', 'Qayta faollashtirish') : t('common.archive', 'Arxivlash')}
                  onClick={() => handleToggleArchive(row)}
                >
                  {row.status === 'archived' ? (
                    <RotateCcw className="w-4 h-4" />
                  ) : (
                    <Archive className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="!p-1.5 h-8 w-8 text-rose-600 dark:text-rose-400 hover:bg-rose-500/15 rounded-lg"
                  title={t('common.delete', 'Butunlay o‘chirish')}
                  onClick={() => handleDeleteGroup(row)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        ),
      }
    );

    return cols;
  }, [isTeacher, currentUserRole, t, navigate]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2.5">
            <Users className="w-7 h-7 text-brand-navy dark:text-blue-400" />
            {isTeacher ? 'Mening guruhlarim' : t('groups.title', 'Group Management')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isTeacher
              ? 'Sizga biriktirilgan o‘quv guruhlari, auditoriyalar va talabalaringiz ro‘yxati'
              : t('groups.subtitle', 'Organize cohorts, classrooms, schedules, and student rosters')}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* View Mode Toggle: Cards (Kartalar) vs Table (Jadval) */}
          <div className="inline-flex items-center rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100/80 dark:bg-surface-dark-tertiary p-1 shrink-0 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                setViewMode('cards');
                try { localStorage.setItem('educo_groups_view_mode', 'cards'); } catch (_) {}
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-surface-dark-secondary text-blue-600 dark:text-emerald-400 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Karta ko‘rinishi (to‘rtburchak kartlar)"
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Kartalar</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('table');
                try { localStorage.setItem('educo_groups_view_mode', 'table'); } catch (_) {}
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-surface-dark-secondary text-blue-600 dark:text-emerald-400 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Jadval ko‘rinishi"
            >
              <List className="w-4 h-4" />
              <span>Jadval</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="md"
            icon={GraduationCap}
            onClick={() => navigate(`/${currentUserRole}/users/create?role=student`)}
          >
            {t('users.createStudent', 'Yangi o‘quvchi qo‘shish')}
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => navigate(`/${currentUserRole}/groups/create`)}
          >
            {t('groups.createGroup', 'New Study Group')}
          </Button>
        </div>
      </div>

      {/* Overloaded Groups Warning Banner (Separated page-level alert) */}
      {overflowGroups.length > 0 && !isTeacher && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-red-500/10 via-rose-500/10 to-amber-500/10 dark:from-red-950/40 dark:via-rose-950/30 dark:to-amber-950/30 border border-red-200 dark:border-red-800/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-black shrink-0 shadow-sm">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-red-950 dark:text-red-200 uppercase tracking-wide">
                  {overflowGroups.length} ta o‘quv guruhida talabalar sig‘imi to‘lib ketgan!
                </h3>
                <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">
                  Dars sifatini yuqori ushlab turish uchun guruhlarni 2 ta parallel guruhga (masalan: ENG-1.1 va ENG-1.2) ajratish tavsiya etiladi.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {overflowGroups.map((og) => (
              <button
                key={og.id}
                type="button"
                onClick={() => setSplitModalGroup(og)}
                className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-xs transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <Split className="w-3.5 h-3.5" />
                <span>«{og.name}» ({og.studentCount || og.enrolled_count || 0} ta) ni 2-guruhga ajratish</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Groups Card: Filters + Table */}
      <Card noPadding>
        <div className={`p-4 border-b border-gray-100 dark:border-gray-800/80 grid grid-cols-1 sm:grid-cols-2 ${isTeacher ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-3 items-center`}>
          <Input
            icon={Search}
            size="md"
            placeholder={t('groups.searchPlaceholder', 'Search group or room...')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSearchQuery(e.target.value);
              setPage(1);
            }}
          />

          {/* Course Filter */}
          <Select
            value={courseFilter}
            size="md"
            onChange={(e) => {
              setCourseFilter(e.target.value);
              setPage(1);
            }}
            placeholder={isTeacher ? "Mening fanlarim" : t('courses.allCourses', 'Barcha kurslar')}
            headerTitle={t('courses.title', 'Kurs bo‘yicha saralash')}
            icon={BookOpen}
            options={[
              { value: 'all', label: isTeacher ? "Barcha fanlarim" : t('courses.allCourses', 'Barcha kurslar'), subtitle: `${displayedCourses.length} ta fan` },
              ...displayedCourses.map((c) => ({
                value: c.id,
                label: c.name,
                subtitle: c.code || 'Kurs fani',
                color: c.color || '#10b981',
                badge: c.groupsCount ? `${c.groupsCount} ta guruh` : null,
              })),
            ]}
          />

          {/* Teacher Filter - only shown for Owner / Admin */}
          {!isTeacher && (
            <Select
              value={teacherFilter}
              size="md"
              onChange={(e) => {
                setTeacherFilter(e.target.value);
                setPage(1);
              }}
              placeholder={t('groups.allTeachers', 'Barcha ustozlar')}
              headerTitle={t('users.filterByTeacher', 'Ustoz bo‘yicha saralash')}
              icon={Users}
              options={[
                { value: 'all', label: t('groups.allTeachers', 'Barcha ustozlar'), subtitle: `${teachers.length} ta o‘qituvchi` },
                ...teachers.map((teach) => ({
                  value: teach.id,
                  label: teach.fullName,
                  subtitle: teach.phone || 'O‘qituvchi',
                  color: '#123D78',
                })),
              ]}
            />
          )}

          {/* Status Filter */}
          <Select
            value={statusFilter}
            size="md"
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            placeholder={t('groups.allStatuses', 'Barcha holatlar')}
            headerTitle={t('common.status', 'Guruh holati')}
            options={[
              { value: 'all', label: t('groups.allStatuses', 'Barcha holatlar') },
              { value: 'active', label: t('common.active', 'Faol guruhlar'), subtitle: 'Darslar olib borilmoqda', color: '#10b981' },
              { value: 'upcoming', label: t('groups.upcoming', 'Boshlanadigan'), subtitle: 'Qabul davom etmoqda', color: '#3b82f6' },
              { value: 'completed', label: t('groups.completed', 'Yakunlangan'), subtitle: 'Darslar tugallangan', color: '#6b7280' },
              { value: 'archived', label: t('common.archived', 'Arxivlangan'), subtitle: 'Muzlatilgan / arxiv', color: '#ef4444' },
            ]}
          />
        </div>

        {/* Main Content: Rectangular Cards (Default) or Table View */}
        {viewMode === 'cards' ? (
          <div>
            {loading ? (
              <div className="py-20 text-center text-gray-500">
                <div className="inline-block animate-spin rounded-full h-9 w-9 border-b-2 border-brand-navy"></div>
                <p className="mt-2.5 text-xs font-semibold">{t('common.loading', 'Guruhlar yuklanmoqda...')}</p>
              </div>
            ) : groups.length === 0 ? (
              <div className="py-16 text-center text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-base font-bold text-gray-800 dark:text-gray-200">{t('groups.noGroups', 'Guruhlar topilmadi.')}</p>
                <p className="text-xs text-gray-400 mt-1">Qidiruv yoki filtrlash parametrlarini o‘zgartirib ko‘ring.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 p-4 sm:p-5">
                {groups.map((group) => {
                  const cardColor = getSubjectColor(group.name, group.courseName, group.courseColor || group.color);
                  const count = group.studentCount || (Array.isArray(group.student_ids) ? group.student_ids.length : 0);
                  const currentRole = profile?.role || 'owner';
                  const detailPath = `/${currentRole}/groups/${group.id}`;
                  const teacherFullNameStr = group.primaryTeacher?.fullName || group.teacher_name || group.teacherName || '';
                  const scheduleStr = group.schedule || (group.schedules?.length ? `${group.schedules.length} ta dars / hafta` : null);

                  return (
                    <div
                      key={group.id}
                      onClick={() => navigate(detailPath)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          navigate(detailPath);
                        }
                      }}
                      className="group relative rounded-2xl p-5 sm:p-6 bg-white dark:bg-surface-dark-secondary border border-gray-200/90 dark:border-gray-700/80 shadow-xs hover:shadow-xl hover:border-blue-400 dark:hover:border-emerald-500/60 transition-all duration-200 hover:-translate-y-1 cursor-pointer flex flex-col justify-between select-none"
                      style={{
                        borderLeftWidth: '6px',
                        borderLeftColor: cardColor,
                        backgroundColor: `${cardColor}0c`,
                      }}
                    >
                      <div className="space-y-4">
                        {/* 1. Guruh nomi va Fan nomi */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0 shadow-sm mt-0.5 overflow-hidden"
                              style={{ backgroundColor: cardColor }}
                            >
                              {group.avatar_url || group.image_url ? (
                                <img
                                  src={group.avatar_url || group.image_url}
                                  alt={group.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Users className="w-6 h-6 text-white" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3
                                className="font-extrabold text-base sm:text-lg text-gray-950 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2"
                                title={group.name}
                              >
                                {group.name}
                              </h3>
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 mt-1">
                                <BookOpen className="w-3.5 h-3.5 shrink-0" style={{ color: cardColor }} />
                                <span className="truncate">{group.courseName || group.direction || t('courses.course', 'Kurs fani')}</span>
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            <Badge variant={getStatusBadgeVariant(group.status)} size="sm" className="font-bold uppercase tracking-wider text-[10px]">
                              {t(`groups.${group.status}`, t(`common.${group.status}`, group.status))}
                            </Badge>
                            <div className="w-7 h-7 rounded-full bg-white dark:bg-surface-dark-tertiary border border-gray-200/80 dark:border-gray-700/80 flex items-center justify-center text-gray-400 group-hover:text-blue-600 dark:group-hover:text-emerald-400 group-hover:border-blue-300 dark:group-hover:border-emerald-500/50 group-hover:translate-x-0.5 transition-all shadow-2xs">
                              <ChevronRight className="w-4 h-4" />
                            </div>
                          </div>
                        </div>

                        {/* 2. O'qituvchining ismi */}
                        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/90 dark:bg-surface-dark-tertiary/80 border border-gray-200/80 dark:border-gray-700/70">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0 shadow-2xs"
                            style={{ backgroundColor: cardColor }}
                          >
                            {teacherFullNameStr ? teacherFullNameStr.charAt(0).toUpperCase() : 'O'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 block leading-tight">
                              O‘qituvchi
                            </span>
                            <span className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate block">
                              {teacherFullNameStr || t('groups.unassigned', 'Biriktirilmagan')}
                            </span>
                          </div>
                        </div>

                        {/* 3. Dars vaqti va Guruhdagi talabalar soni */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                          {/* Vaqti */}
                          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold bg-white/90 dark:bg-surface-dark-tertiary/80 text-gray-800 dark:text-gray-200 border border-gray-200/80 dark:border-gray-700/70 shadow-2xs">
                            <Clock className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
                            <span className="truncate">
                              {scheduleStr || t('schedule.noSchedule', 'Jadval belgilanmagan')}
                            </span>
                          </div>

                          {/* Guruhda nechta talaba borligi */}
                          <div className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold bg-white/90 dark:bg-surface-dark-tertiary/80 text-gray-800 dark:text-gray-200 border border-gray-200/80 dark:border-gray-700/70 shadow-2xs">
                            <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                              <Users className="w-4 h-4 shrink-0" style={{ color: cardColor }} />
                              <span>Talabalar:</span>
                            </span>
                            <span
                              className="font-extrabold text-xs px-2.5 py-1 rounded-lg font-mono"
                              style={{ backgroundColor: `${cardColor}18`, color: cardColor }}
                            >
                              {count} ta talaba
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table
              columns={columns}
              data={groups}
              isLoading={loading}
              emptyMessage={t('groups.noGroups', 'No study groups match your criteria.')}
              className="border-0 rounded-none"
            />
          </div>
        )}
      </Card>

      {/* Group Split Modal (Split overflowing groups into 2nd group) */}
      <GroupSplitModal
        isOpen={Boolean(splitModalGroup)}
        group={splitModalGroup}
        onClose={() => setSplitModalGroup(null)}
        onSuccess={() => {
          setSplitModalGroup(null);
          fetchGroups();
        }}
      />
    </div>
  );
}
