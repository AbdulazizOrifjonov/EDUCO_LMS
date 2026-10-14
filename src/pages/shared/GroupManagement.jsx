import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import PasswordStrengthInput, { evaluatePasswordStrength } from '@/components/ui/PasswordStrengthInput';
import { toast } from '@/components/ui/Toast';
import GroupForm from './GroupForm';
import {
  getGroups,
  updateGroup,
} from '@/services/groupService';
import { getCourses } from '@/services/courseService';
import { getTeachers, createStudent } from '@/services/userService';
import { cleanUzPhone } from '@/utils/phoneFormat';

export default function GroupManagement() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const currentUserRole = profile?.role || 'owner';

  const [groups, setGroups] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Student creation modal
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [newStudentData, setNewStudentData] = useState({
    firstName: '',
    lastName: '',
    fatherPhone: '',
    motherPhone: '',
    phone: '',
    password: '',
    groupId: '',
  });
  const [isSubmittingStudent, setIsSubmittingStudent] = useState(false);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const fetchFilters = async () => {
    try {
      const [cRes, tRes] = await Promise.all([
        getCourses({ limit: 100 }),
        getTeachers(),
      ]);
      setCourses(cRes.courses || []);
      setTeachers(tRes || []);
    } catch (e) {
      console.warn('Filter options fetch note:', e);
    }
  };

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getGroups({
        search,
        courseId: courseFilter,
        teacherId: teacherFilter,
        status: statusFilter,
        page,
        limit: 12,
      });
      setGroups(data.groups || []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalCount || 0);
    } catch (err) {
      console.error(err);
      toast.error(t('groups.fetchError', 'Failed to load groups'));
    } finally {
      setLoading(false);
    }
  }, [search, courseFilter, teacherFilter, statusFilter, page, t]);

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

  const handleCreateStudent = async (e) => {
    e?.preventDefault?.();
    if (!newStudentData.firstName.trim() || !newStudentData.lastName.trim()) {
      toast.error(t('errors.required', 'Ism va familiya kiritilishi shart'));
      return;
    }
    const cleanFather = cleanUzPhone(newStudentData.fatherPhone);
    const cleanMother = cleanUzPhone(newStudentData.motherPhone);
    const cleanPhone = cleanUzPhone(newStudentData.phone);
    if (!cleanFather && !cleanMother && !cleanPhone) {
      toast.error(t('users.atLeastOneParentPhone', 'Otasining yoki onasining telefon raqamini kiritish shart'));
      return;
    }

    const trimmedPwd = (newStudentData.password || '').trim();
    if (!trimmedPwd) {
      toast.error(t('users.passwordRequired', 'Kabinetga kirish uchun parol kiritish shart!'));
      return;
    }
    if (!evaluatePasswordStrength(trimmedPwd).allMet) {
      toast.error(
        t(
          'users.passwordMustBeStrong',
          'Parol xavfsiz (yashil) bo‘lishi uchun katta-kichik harf, raqam va maxsus belgi (!@#$) ishtirok etishi shart!'
        )
      );
      return;
    }

    setIsSubmittingStudent(true);
    try {
      await createStudent({
        firstName: newStudentData.firstName,
        lastName: newStudentData.lastName,
        fatherPhone: cleanFather,
        motherPhone: cleanMother,
        phone: cleanPhone,
        password: trimmedPwd,
        groupId: newStudentData.groupId || null,
      });
      toast.success(t('users.studentCreatedAndEnrolled', 'Yangi o‘quvchi yaratildi va guruhga biriktirildi!'));
      setNewStudentData({
        firstName: '',
        lastName: '',
        fatherPhone: '',
        motherPhone: '',
        phone: '',
        password: '',
        groupId: '',
      });
      setIsAddStudentOpen(false);
      fetchGroups();
    } catch (err) {
      toast.error(err.message || 'Xatolik yuz berdi');
    } finally {
      setIsSubmittingStudent(false);
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

  const columns = [
    {
      header: t('groups.group', 'Group Name'),
      key: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0 shadow-sm"
            style={{ backgroundColor: row.courseColor || '#123D78' }}
          >
            <Users className="w-5 h-5" />
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
    {
      header: t('groups.primaryTeacher', 'Lead Teacher'),
      key: 'teacher',
      render: (row) => (
        <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
          {row.primaryTeacher?.fullName || t('groups.unassigned', 'Not Assigned')}
        </span>
      ),
    },
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
                  percent >= 100 ? 'bg-brand-red' : percent > 80 ? 'bg-amber-500' : 'bg-brand-navy'
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
            onClick={() => navigate(`/owner/groups/${row.id}`)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="!p-1.5 h-8 w-8 text-gray-600 dark:text-gray-300 hover:text-brand-navy"
            title={t('common.edit', 'Edit Group')}
            onClick={() => {
              setSelectedGroup(row);
              setIsFormOpen(true);
            }}
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
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2.5">
            <Users className="w-7 h-7 text-brand-navy dark:text-blue-400" />
            {t('groups.title', 'Group Management')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('groups.subtitle', 'Organize cohorts, classrooms, schedules, and student rosters')}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="md"
            icon={GraduationCap}
            onClick={() => setIsAddStudentOpen(true)}
          >
            {t('users.createStudent', '+ Yangi o‘quvchi qo‘shish')}
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => {
              setSelectedGroup(null);
              setIsFormOpen(true);
            }}
          >
            {t('groups.createGroup', 'New Study Group')}
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <Card noPadding>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input
            icon={Search}
            placeholder={t('groups.searchPlaceholder', 'Search group or room...')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />

          {/* Course Filter */}
          <select
            value={courseFilter}
            onChange={(e) => {
              setCourseFilter(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-navy"
          >
            <option value="all">{t('courses.allCourses', 'All Courses')}</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Teacher Filter */}
          <select
            value={teacherFilter}
            onChange={(e) => {
              setTeacherFilter(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-navy"
          >
            <option value="all">{t('groups.allTeachers', 'All Teachers')}</option>
            {teachers.map((teach) => (
              <option key={teach.id} value={teach.id}>
                {teach.fullName}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-navy"
          >
            <option value="all">{t('groups.allStatuses', 'All Statuses')}</option>
            <option value="active">{t('common.active', 'Active')}</option>
            <option value="upcoming">{t('groups.upcoming', 'Upcoming')}</option>
            <option value="completed">{t('groups.completed', 'Completed')}</option>
            <option value="archived">{t('common.archived', 'Archived')}</option>
          </select>
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
                          className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold shrink-0 shadow-sm"
                          style={{ backgroundColor: group.courseColor || '#123D78' }}
                        >
                          <Users className="w-5 h-5" />
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
                              : 'bg-brand-navy dark:bg-blue-500'
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
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Edit2}
                        className="flex-1 justify-center text-xs py-1.5"
                        onClick={() => {
                          setSelectedGroup(group);
                          setIsFormOpen(true);
                        }}
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
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* Group Create/Edit Modal */}
      {isFormOpen && (
        <GroupForm
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedGroup(null);
          }}
          group={selectedGroup}
          onSuccess={fetchGroups}
        />
      )}

      {/* Student Create Modal */}
      <Modal
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
        title={t('users.createStudent', 'Yangi o‘quvchi qo‘shish')}
        subtitle={t('users.createStudentSubtitle', "O'quvchini tizimga kiritish va o'quv guruhiga biriktirish")}
        size="lg"
      >
        <form onSubmit={handleCreateStudent} className="space-y-4">
          <div className="p-3.5 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 text-xs text-brand-navy dark:text-blue-300">
            <p className="font-semibold">{t('users.parentsContact', "Ota-onasi bilan bog'lanish")}</p>
            <p className="text-gray-600 dark:text-gray-400 mt-0.5">
              {t('users.parentPhoneNote', "Otasining yoki onasining (yoki ikkalasining) telefon raqamini kiriting.")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('common.firstName', 'Ism')}
              icon={User}
              required
              placeholder="Masalan: Jasur"
              value={newStudentData.firstName}
              onChange={(e) =>
                setNewStudentData({ ...newStudentData, firstName: e.target.value })
              }
            />
            <Input
              label={t('common.lastName', 'Familiya')}
              icon={User}
              required
              placeholder="Masalan: Rustamov"
              value={newStudentData.lastName}
              onChange={(e) =>
                setNewStudentData({ ...newStudentData, lastName: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('users.fatherPhone', 'Otasining telefon raqami')}
              icon={Phone}
              placeholder="+998 90 111 22 33"
              value={newStudentData.fatherPhone}
              onChange={(e) =>
                setNewStudentData({ ...newStudentData, fatherPhone: e.target.value })
              }
            />
            <Input
              label={t('users.motherPhone', 'Onasining telefon raqami')}
              icon={Phone}
              placeholder="+998 90 222 33 44"
              value={newStudentData.motherPhone}
              onChange={(e) =>
                setNewStudentData({ ...newStudentData, motherPhone: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('users.studentPhoneOptional', "O'quvchining shaxsiy telefoni (ixtiyoriy)")}
              icon={Phone}
              placeholder="+998 90 333 44 55"
              value={newStudentData.phone}
              onChange={(e) =>
                setNewStudentData({ ...newStudentData, phone: e.target.value })
              }
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase text-gray-700 dark:text-gray-300">
                {t('users.assignToGroup', "O'quv guruhiga biriktirish")}
              </label>
              <select
                value={newStudentData.groupId}
                onChange={(e) =>
                  setNewStudentData({ ...newStudentData, groupId: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-navy"
              >
                <option value="">{t('users.unassignedGroup', "Guruhsiz / Keyinroq biriktirish")}</option>
                {groups.map((grp) => (
                  <option key={grp.id} value={grp.id}>
                    {grp.name} ({grp.studentCount || grp.enrolled_count || 0} / {grp.capacity || 20})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-surface-dark-tertiary/30">
            <PasswordStrengthInput
              label={t('users.cabinetPassword', 'LMS kabinetga kirish paroli')}
              required
              value={newStudentData.password}
              onValueChange={(val) =>
                setNewStudentData({ ...newStudentData, password: val })
              }
              placeholder="Masalan: Jasur#2026!"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setIsAddStudentOpen(false)}
            >
              {t('common.cancel', 'Bekor qilish')}
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isSubmittingStudent}
            >
              {t('common.create', 'Qo‘shish')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
