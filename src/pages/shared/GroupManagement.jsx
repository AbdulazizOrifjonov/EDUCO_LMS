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
  Clock,
  Sparkles,
  User,
  Phone,
  BookOpen,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Table from '@/components/ui/Table';
import Select from '@/components/ui/Select';
import { toast } from '@/components/ui/Toast';
import {
  getGroups,
  updateGroup,
} from '@/services/groupService';
import { getCourses } from '@/services/courseService';
import { getTeachers } from '@/services/userService';
import { useSearch } from '@/context/SearchContext';

export default function GroupManagement() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const currentUserRole = profile?.role || 'owner';
  const isTeacher = currentUserRole === 'teacher';
  const teacherFullName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || profile?.name || profile?.full_name || '';
  const { searchQuery, setSearchQuery } = useSearch();

  const [groups, setGroups] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState(searchQuery || '');
  const [courseFilter, setCourseFilter] = useState('all');
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
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

  const fetchGroups = useCallback(async () => {
    setLoading(true);
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
        limit: 12,
      });

      let fetchedGroups = data.groups || [];
      if (isTeacher) {
        const myName = teacherFullName.trim().toLowerCase();
        const myId = profile?.id;
        fetchedGroups = fetchedGroups.filter((g) => {
          const matchId = (myId && (g.teacher_id === myId || g.teacherId === myId || g.primaryTeacher?.id === myId));
          const matchGt = Array.isArray(g.group_teachers) && g.group_teachers.some(t => (t.teacher_id || t.id || t.profiles?.id) === myId);
          const gName = (g.teacher_name || g.teacherName || g.primaryTeacher?.fullName || '').trim().toLowerCase();
          const matchName = myName && gName && (gName.includes(myName) || myName.includes(gName));
          return matchId || matchGt || matchName;
        });
      }

      setGroups(fetchedGroups);
      setTotalPages(Math.ceil((fetchedGroups.length || data.totalCount || 1) / 12) || 1);
      setTotalCount(fetchedGroups.length);
    } catch (err) {
      console.error(err);
      toast.error(t('groups.fetchError', 'Failed to load groups'));
    } finally {
      setLoading(false);
    }
  }, [search, courseFilter, teacherFilter, statusFilter, page, isTeacher, profile?.id, profile?.userId, teacherFullName, t]);

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleToggleArchive = async (group) => {
    const nextStatus = group.status === 'archived' ? 'active' : 'archived';
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
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-surface-dark-tertiary text-gray-600 dark:text-gray-300">
                    {row.room}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {row.courseName}
              </p>
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
          const percent = Math.min(Math.round(((row.studentCount || 0) / (row.capacity || 20)) * 100), 100);
          return (
            <div className="w-32">
              <div className="flex items-center justify-between text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                <span>{row.studentCount} / {row.capacity}</span>
                <span className="text-gray-400">{percent}%</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-surface-dark-tertiary h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    percent >= 100 ? 'bg-brand-red' : percent > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        },
      },
      {
        header: t('nav.schedule', 'Lessons'),
        key: 'schedule',
        render: (row) => (
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {row.schedules?.length
              ? `${row.schedules.length} ${t('schedule.perWeek', '/ week')}`
              : t('schedule.noSchedule', 'No timetable')}
          </span>
        ),
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
            {!isTeacher && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="!p-1.5 h-8 w-8 text-gray-600 dark:text-gray-300 hover:text-brand-navy"
                  title={t('common.edit', 'Edit Group')}
                  onClick={() => navigate(`/${currentUserRole}/groups/edit/${row.id}`)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`!p-1.5 h-8 w-8 ${
                    row.status === 'archived'
                      ? 'text-gray-500 hover:text-emerald-600'
                      : 'text-gray-500 hover:text-brand-red'
                  }`}
                  title={row.status === 'archived' ? t('common.restore', 'Restore') : t('common.archive', 'Archive')}
                  onClick={() => handleToggleArchive(row)}
                >
                  {row.status === 'archived' ? (
                    <RotateCcw className="w-4 h-4" />
                  ) : (
                    <Archive className="w-4 h-4" />
                  )}
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

        {!isTeacher && (
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="outline"
              size="md"
              icon={GraduationCap}
              onClick={() => navigate(`/${currentUserRole}/users/create?role=student`)}
            >
              {t('users.createStudent', '+ Yangi o‘quvchi qo‘shish')}
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
        )}
      </div>

      {/* Filters Bar */}
      <Card noPadding>
        <div className={`p-4 grid grid-cols-1 sm:grid-cols-2 ${isTeacher ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-3 items-center`}>
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

        {/* Desktop Table View */}
        <div className="hidden md:block">
          <Table
            columns={columns}
            data={groups}
            isLoading={loading}
            emptyMessage={t('groups.noGroups', 'No study groups match your criteria.')}
          />
        </div>

        {/* Mobile Individual Group Cards (Zero horizontal scroll) */}
        <div className="block md:hidden">
          {loading ? (
            <div className="py-12 text-center text-gray-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-navy"></div>
              <p className="mt-2 text-xs">{t('common.loading', 'Guruhlar yuklanmoqda...')}</p>
            </div>
          ) : groups.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <Users className="w-10 h-10 mx-auto mb-2 text-gray-400" />
              <p className="text-sm font-semibold">{t('groups.noGroups', 'Guruhlar topilmadi.')}</p>
            </div>
          ) : (
            <div className="p-3 space-y-3">
              {groups.map((group) => {
                const percent = Math.min(
                  Math.round(((group.studentCount || 0) / (group.capacity || 20)) * 100),
                  100
                );
                const currentRole = profile?.role || 'owner';
                const detailPath = `/${currentRole}/groups/${group.id}`;

                return (
                  <div
                    key={group.id}
                    className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark-secondary p-4 shadow-sm space-y-3"
                  >
                    {/* Header: Icon, Group Name, Room, Status */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold shrink-0 shadow-sm overflow-hidden"
                          style={{ backgroundColor: group.courseColor || '#064e3b' }}
                        >
                          {group.avatar_url || group.image_url ? (
                            <img
                              src={group.avatar_url || group.image_url}
                              alt={group.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Users className="w-5 h-5" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 truncate">
                              {group.name}
                            </h3>
                            {group.room && (
                              <span className="text-[11px] px-1.5 py-0.5 rounded font-medium bg-gray-100 dark:bg-surface-dark-tertiary text-gray-600 dark:text-gray-300">
                                🚪 {group.room}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-brand-navy dark:text-blue-400 font-medium truncate mt-0.5">
                            📚 {group.courseName}
                          </p>
                        </div>
                      </div>

                      <Badge variant={getStatusBadgeVariant(group.status)} size="sm" className="shrink-0">
                        <span className="capitalize">
                          {t(`groups.${group.status}`, t(`common.${group.status}`, group.status))}
                        </span>
                      </Badge>
                    </div>

                    {/* Teacher & Schedule info */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-100 dark:border-gray-800">
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-semibold">O‘qituvchi:</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200 truncate block mt-0.5">
                          👤 {group.primaryTeacher?.fullName || t('groups.unassigned', 'Biriktirilmagan')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-semibold">Darslar:</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200 truncate block mt-0.5">
                          📅 {group.schedules?.length ? `${group.schedules.length} ta / hafta` : 'Jadvalsiz'}
                        </span>
                      </div>
                    </div>

                    {/* Capacity Progress Bar */}
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                      <div className="flex items-center justify-between text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                          <span>O‘quvchilar: <b>{group.studentCount || 0}</b> / {group.capacity || 20}</span>
                        </span>
                        <span className="font-mono text-xs font-semibold text-gray-500">{percent}%</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-surface-dark-tertiary h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all rounded-full ${
                            percent >= 100
                              ? 'bg-brand-red'
                              : percent > 80
                              ? 'bg-amber-500'
                              : 'bg-emerald-500 dark:bg-emerald-500'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        icon={Eye}
                        className="flex-1 justify-center text-xs py-1.5"
                        onClick={() => navigate(detailPath)}
                      >
                        {t('common.view', 'Batafsil')}
                      </Button>
                      {!isTeacher && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            icon={Edit2}
                            className="flex-1 justify-center text-xs py-1.5"
                            onClick={() => navigate(`/${currentUserRole}/groups/edit/${group.id}`)}
                          >
                            {t('common.edit', 'Tahrirlash')}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`!p-2 shrink-0 ${
                              group.status === 'archived'
                                ? 'text-gray-500 hover:text-emerald-600'
                                : 'text-gray-500 hover:text-brand-red'
                            }`}
                            title={group.status === 'archived' ? t('common.restore', 'Tiklash') : t('common.archive', 'Arxivlash')}
                            onClick={() => handleToggleArchive(group)}
                          >
                            {group.status === 'archived' ? (
                              <RotateCcw className="w-4 h-4" />
                            ) : (
                              <Archive className="w-4 h-4" />
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
