import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Eye,
  Trash2,
  Archive,
  RotateCcw,
  Users,
  Compass,
  Layers,
  Sparkles,
  DollarSign,
  CheckCircle,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import { toast } from '@/components/ui/Toast';
import {
  getCourses,
  archiveCourse,
  deleteCourse,
  getLearningDirections,
} from '@/services/courseService';
import { useSearch } from '@/context/SearchContext';
import { useTwoStepConfirm } from '@/context/ConfirmContext';

export default function CourseManagement() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { confirmDelete } = useTwoStepConfirm();
  const currentUserRole = profile?.role || '';
  const isOwnerOrAdmin = currentUserRole === 'owner' || currentUserRole === 'admin';
  const { searchQuery, setSearchQuery } = useSearch();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchQuery || '');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Synchronize with global navbar search bar
  useEffect(() => {
    if (searchQuery !== undefined) {
      setSearch(searchQuery);
      setPage(1);
    }
  }, [searchQuery]);

  // Modals
  const [isDirectionsModalOpen, setIsDirectionsModalOpen] = useState(false);
  const [directions, setDirections] = useState([]);
  const [selectedCourseForView, setSelectedCourseForView] = useState(null);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCourses({
        search,
        status: statusFilter,
        page,
        limit: 15,
      });
      setCourses(data.courses || []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalCount || 0);
    } catch (err) {
      console.error(err);
      toast.error(t('courses.fetchError', 'Failed to load courses'));
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page, t]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Realtime cross-role sync: auto-refresh when another user/role adds or modifies courses
  useEffect(() => {
    const handleSync = () => fetchCourses();
    window.addEventListener('educo-data-sync', handleSync);
    return () => window.removeEventListener('educo-data-sync', handleSync);
  }, [fetchCourses]);

  const loadDirections = async () => {
    const data = await getLearningDirections();
    setDirections(data);
    setIsDirectionsModalOpen(true);
  };

  const handleToggleArchive = async (course) => {
    const nextStatus = !course.is_active;
    if (!nextStatus) {
      // Archiving course
      const ok = await confirmDelete({
        title: 'Kurs / Yo‘nalishni arxivlash',
        itemName: course.name,
        description: 'Ushbu ta‘lim yo‘nalishi arxivlanadi. Yangi guruhlar ochishda ushbu kurs tanlanmaydi. Istalgan payt qayta faollashtirish mumkin.',
        confirmButtonText: 'Ha, kurs arxivlansin',
      });
      if (!ok) return;
    }
    try {
      await archiveCourse(course.id, nextStatus);
      toast.success(
        nextStatus
          ? t('courses.restored', 'Course restored successfully')
          : t('courses.archived', 'Course archived successfully')
      );
      fetchCourses();
    } catch (err) {
      toast.error(t('common.error', 'Failed to update course status'));
    }
  };

  const handleDeleteCourse = async (course) => {
    const ok = await confirmDelete({
      title: 'Kursni butunlay o‘chirish',
      itemName: `${course.name} (${course.code})`,
      description: 'Diqqat: Ushbu kurs tizimdan butunlay o‘chiriladi. Bu amalni ortga qaytarib bo‘lmaydi!',
      confirmButtonText: 'Ha, kurs butunlay o‘chirilsin',
    });
    if (!ok) return;

    try {
      await deleteCourse(course.id);
      toast.success(t('courses.deleteSuccess', 'Kurs muvaffaqiyatli o‘chirildi!'));
      if (selectedCourseForView?.id === course.id) {
        setSelectedCourseForView(null);
      }
      fetchCourses();
    } catch (err) {
      console.error(err);
      toast.error(err.message || t('common.error', 'Kursni o‘chirishda xatolik yuz berdi'));
    }
  };

  const columns = [
    {
      header: t('courses.course', 'Course Details'),
      key: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0 shadow-sm"
            style={{ backgroundColor: row.color || '#123D78' }}
          >
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 dark:text-gray-100">{row.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-md font-mono bg-gray-100 dark:bg-surface-dark-tertiary text-gray-600 dark:text-gray-300">
                {row.code}
              </span>
            </div>
            {row.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5 max-w-sm">
                {row.description}
              </p>
            )}
            {row.teachers && row.teachers.length > 0 && (
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span className="text-[10px] font-semibold text-gray-400">Ustozlar:</span>
                {row.teachers.map((t, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                  >
                    👨‍🏫 {t.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      header: t('courses.groupsCount', 'Active Groups'),
      key: 'groupsCount',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300">
          <Users className="w-4 h-4 text-brand-navy dark:text-blue-400" />
          <span className="font-semibold">{row.groupsCount || 0}</span>
          <span className="text-gray-400">{t('nav.groups', 'groups')}</span>
        </div>
      ),
    },
    {
      header: t('courses.fee', 'Oylik to‘lov'),
      key: 'monthly_fee',
      render: (row) => (
        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-500/20 whitespace-nowrap">
          {Number(row.monthly_fee || 0).toLocaleString()} so‘m / oy
        </span>
      ),
    },
    {
      header: t('common.status', 'Status'),
      key: 'status',
      render: (row) => (
        <Badge variant={row.is_active ? 'success' : 'secondary'} size="sm">
          {row.is_active ? t('common.active', 'Active') : t('common.archived', 'Archived')}
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
          {/* Read / View Course Details */}
          <Button
            variant="ghost"
            size="sm"
            className="!p-1.5 h-8 w-8 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 rounded-lg"
            title={t('common.view', 'Batafsil ko‘rish')}
            onClick={() => setSelectedCourseForView(row)}
          >
            <Eye className="w-4 h-4" />
          </Button>

          {isOwnerOrAdmin && (
            <>
              {/* Update / Edit Course */}
              <Button
                variant="ghost"
                size="sm"
                className="!p-1.5 h-8 w-8 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-lg"
                title={t('common.edit', 'Tahrirlash')}
                onClick={() => navigate(`/${currentUserRole}/courses/edit/${row.id}`)}
              >
                <Edit2 className="w-4 h-4" />
              </Button>

              {/* Archive / Restore Course */}
              <Button
                variant="ghost"
                size="sm"
                className={`!p-1.5 h-8 w-8 rounded-lg ${
                  row.is_active
                    ? 'text-amber-600 hover:bg-amber-500/10'
                    : 'text-emerald-600 hover:bg-emerald-500/10'
                }`}
                title={row.is_active ? t('common.archive', 'Arxivlash') : t('common.restore', 'Qayta faollashtirish')}
                onClick={() => handleToggleArchive(row)}
              >
                {row.is_active ? <Archive className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
              </Button>

              {/* Delete Course Permanently */}
              <Button
                variant="ghost"
                size="sm"
                className="!p-1.5 h-8 w-8 text-rose-600 dark:text-rose-400 hover:bg-rose-500/15 rounded-lg"
                title={t('common.delete', 'Butunlay o‘chirish')}
                onClick={() => handleDeleteCourse(row)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-brand-navy dark:text-blue-400" />
            {t('courses.title', 'Course Management')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('courses.subtitle', 'Configure curricula, pricing schemes, and academic subjects')}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="md"
            icon={Compass}
            onClick={loadDirections}
          >
            {t('courses.directions', 'Learning Directions')}
          </Button>
          {isOwnerOrAdmin && (
            <Button
              variant="primary"
              size="md"
              icon={Plus}
              onClick={() => navigate(`/${currentUserRole}/courses/create`)}
            >
              {t('courses.createCourse', 'New Course')}
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card noPadding>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <Input
              icon={Search}
              placeholder={t('courses.searchPlaceholder', 'Search by course name, code, or description...')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            placeholder={t('courses.allStatuses', 'Barcha holatlar')}
            headerTitle={t('common.status', 'Kurs holati')}
            icon={BookOpen}
            size="sm"
            options={[
              { value: 'all', label: t('courses.allStatuses', 'Barcha holatlar') },
              { value: 'active', label: t('common.active', 'Faol kurslar'), color: '#10b981', subtitle: 'Guruhlar ochilgan kurslar' },
              { value: 'archived', label: t('common.archived', 'Arxivlangan kurslar'), color: '#ef4444', subtitle: 'To‘xtatilgan kurslar' },
            ]}
          />
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block">
          <Table
            columns={columns}
            data={courses}
            isLoading={loading}
            emptyMessage={t('courses.noCourses', 'No courses found. Click "+ New Course" to create one.')}
          />
        </div>

        {/* Mobile Cards View (Zero horizontal scroll) */}
        <div className="block md:hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-navy"></div>
              <p className="mt-2 text-xs">{t('common.loading', 'Yuklanmoqda...')}</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <BookOpen className="w-10 h-10 mx-auto mb-2 text-gray-400" />
              <p className="text-sm font-semibold">{t('courses.noCourses', 'Kurslar topilmadi.')}</p>
            </div>
          ) : (
            <div className="p-3 space-y-3">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark-secondary p-4 shadow-sm space-y-3"
                >
                  {/* Header: Icon + Title + Code + Status */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0 shadow-sm"
                        style={{ backgroundColor: course.color || '#123D78' }}
                      >
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">
                            {course.name}
                          </h3>
                          <span className="text-[11px] px-1.5 py-0.5 rounded font-mono bg-gray-100 dark:bg-surface-dark-tertiary text-gray-600 dark:text-gray-300 font-semibold">
                            {course.code}
                          </span>
                        </div>
                        {course.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                            {course.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant={course.is_active ? 'success' : 'secondary'} size="sm" className="shrink-0">
                      {course.is_active ? t('common.active', 'Faol') : t('common.archived', 'Arxivlangan')}
                    </Badge>
                  </div>

                  {/* Stats Row */}
                  <div className="pt-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                      <Users className="w-4 h-4 text-brand-navy dark:text-blue-400 shrink-0" />
                      <span className="font-semibold">{course.groupsCount || 0}</span>
                      <span className="text-gray-400">{t('nav.groups', 'guruhlar')}</span>
                    </div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      ${Number(course.monthly_fee || 0).toFixed(2)} <span className="text-gray-400 font-normal">{t('courses.perMonth', '/oy')}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-1.5 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Eye}
                      className="text-xs py-1 px-2.5 text-blue-600 dark:text-blue-400"
                      onClick={() => setSelectedCourseForView(course)}
                    >
                      Batafsil
                    </Button>
                    {isOwnerOrAdmin && (
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Edit2}
                          className="text-xs py-1 px-2 text-emerald-600 dark:text-emerald-400"
                          onClick={() => navigate(`/${currentUserRole}/courses/edit/${course.id}`)}
                        >
                          Tahrirlash
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={course.is_active ? Archive : RotateCcw}
                          className={`text-xs py-1 px-2 ${
                            course.is_active
                              ? 'text-amber-600 hover:bg-amber-500/10'
                              : 'text-emerald-600 hover:bg-emerald-500/10'
                          }`}
                          onClick={() => handleToggleArchive(course)}
                        >
                          {course.is_active ? 'Arxiv' : 'Tiklash'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Trash2}
                          className="text-xs py-1 px-2 text-rose-600 dark:text-rose-400 hover:bg-rose-500/15"
                          onClick={() => handleDeleteCourse(course)}
                        >
                          O‘chirish
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>



      {/* Learning Directions Modal */}
      <Modal
        isOpen={isDirectionsModalOpen}
        onClose={() => setIsDirectionsModalOpen(false)}
        title={t('courses.directionsTitle', 'Academic Learning Directions')}
        subtitle={t('courses.directionsSubtitle', 'Curriculum tracks and subject categorization')}
        size="md"
      >
        <div className="space-y-3">
          {directions.map((d) => (
            <div
              key={d.id}
              className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-surface-dark-tertiary flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-navy/10 text-brand-navy dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                  {d.code}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{d.name}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Curriculum Code: {d.code}</p>
                </div>
              </div>
              <Badge variant="primary" size="sm">
                Active Track
              </Badge>
            </div>
          ))}
        </div>
      </Modal>

      {/* Course Details (Read / View) Modal */}
      <Modal
        isOpen={Boolean(selectedCourseForView)}
        onClose={() => setSelectedCourseForView(null)}
        title="Kurs ma‘lumotlari"
        subtitle="Ta‘lim yo‘nalishi, o‘quv rejasi va biriktirilgan ustozlar"
        size="md"
      >
        {selectedCourseForView && (
          <div className="space-y-4">
            {/* Header info */}
            <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-gray-50 dark:bg-surface-dark-tertiary border border-gray-100 dark:border-gray-800">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold shrink-0 shadow-md"
                style={{ backgroundColor: selectedCourseForView.color || '#123D78' }}
              >
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-base text-gray-900 dark:text-gray-100">
                    {selectedCourseForView.name}
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded-md font-mono bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-900/60">
                    {selectedCourseForView.code}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={selectedCourseForView.is_active ? 'success' : 'secondary'} size="sm">
                    {selectedCourseForView.is_active ? 'Faol o‘quv kursi' : 'Arxivlangan'}
                  </Badge>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedCourseForView.groupsCount || 0} ta faol guruh
                  </span>
                </div>
              </div>
            </div>

            {/* Pricing card */}
            <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Oylik to‘lov summasi:</span>
              </div>
              <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
                {Number(selectedCourseForView.monthly_fee || selectedCourseForView.monthlyFee || 0).toLocaleString()} so‘m / oy
              </span>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Kurs tavsifi / O‘quv dasturi:
              </p>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-surface-dark-tertiary border border-gray-100 dark:border-gray-800 text-xs text-gray-700 dark:text-gray-300 leading-relaxed max-h-36 overflow-y-auto">
                {selectedCourseForView.description || 'Kurs bo‘yicha qo‘shimcha tavsif kiritilmagan.'}
              </div>
            </div>

            {/* Assigned Teachers */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Biriktirilgan ustozlar ({selectedCourseForView.teachers?.length || 0}):
              </p>
              {selectedCourseForView.teachers && selectedCourseForView.teachers.length > 0 ? (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {selectedCourseForView.teachers.map((tch, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-surface-dark-secondary flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center text-[11px]">
                          {tch.name?.charAt(0) || 'U'}
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{tch.name}</span>
                      </div>
                      <span className="text-gray-500 dark:text-gray-400 font-mono text-[11px]">
                        {tch.phone || 'Telefon yo‘q'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">Hozircha ustoz biriktirilmagan.</p>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-2">
              {isOwnerOrAdmin && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Edit2}
                    onClick={() => {
                      const cid = selectedCourseForView.id;
                      setSelectedCourseForView(null);
                      navigate(`/${currentUserRole}/courses/edit/${cid}`);
                    }}
                  >
                    Tahrirlash
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    onClick={() => handleDeleteCourse(selectedCourseForView)}
                  >
                    O‘chirish
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCourseForView(null)}
              >
                Yopish
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
