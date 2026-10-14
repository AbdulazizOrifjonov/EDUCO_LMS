import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Archive,
  RotateCcw,
  Users,
  Compass,
  Layers,
  Sparkles,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import CourseForm from './CourseForm';
import {
  getCourses,
  archiveCourse,
  getLearningDirections,
} from '@/services/courseService';

export default function CourseManagement() {
  const { t } = useTranslation();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isDirectionsModalOpen, setIsDirectionsModalOpen] = useState(false);
  const [directions, setDirections] = useState([]);

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

  const loadDirections = async () => {
    const data = await getLearningDirections();
    setDirections(data);
    setIsDirectionsModalOpen(true);
  };

  const handleToggleArchive = async (course) => {
    const nextStatus = !course.is_active;
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
      header: t('courses.fee', 'Tuition Fee'),
      key: 'monthly_fee',
      render: (row) => (
        <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
          ${Number(row.monthly_fee || 0).toFixed(2)} {t('courses.perMonth', '/mo')}
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
          <Button
            variant="ghost"
            size="sm"
            className="!p-1.5 h-8 w-8 text-gray-600 dark:text-gray-300 hover:text-brand-navy"
            title={t('common.edit', 'Edit Course')}
            onClick={() => {
              setSelectedCourse(row);
              setIsFormOpen(true);
            }}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`!p-1.5 h-8 w-8 ${
              row.is_active
                ? 'text-gray-500 hover:text-brand-red'
                : 'text-gray-500 hover:text-emerald-600'
            }`}
            title={row.is_active ? t('common.archive', 'Archive') : t('common.restore', 'Restore')}
            onClick={() => handleToggleArchive(row)}
          >
            {row.is_active ? <Archive className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
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
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => {
              setSelectedCourse(null);
              setIsFormOpen(true);
            }}
          >
            {t('courses.createCourse', 'New Course')}
          </Button>
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
                setPage(1);
              }}
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-navy"
            >
              <option value="all">{t('courses.allStatuses', 'All Statuses')}</option>
              <option value="active">{t('common.active', 'Active Courses')}</option>
              <option value="archived">{t('common.archived', 'Archived Courses')}</option>
            </select>
          </div>
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
                  <div className="pt-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Edit2}
                      className="flex-1 justify-center text-xs py-1.5"
                      onClick={() => {
                        setSelectedCourse(course);
                        setIsFormOpen(true);
                      }}
                    >
                      {t('common.edit', 'Tahrirlash')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={course.is_active ? Archive : RotateCcw}
                      className={`flex-1 justify-center text-xs py-1.5 ${
                        course.is_active
                          ? 'text-gray-600 hover:text-brand-red'
                          : 'text-gray-600 hover:text-emerald-600'
                      }`}
                      onClick={() => handleToggleArchive(course)}
                    >
                      {course.is_active ? t('common.archive', 'Arxivlash') : t('common.restore', 'Tiklash')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Course Create/Edit Modal */}
      {isFormOpen && (
        <CourseForm
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedCourse(null);
          }}
          course={selectedCourse}
          onSuccess={fetchCourses}
        />
      )}

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
    </div>
  );
}
