import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Trash2,
  Edit2,
  Paperclip,
  Users,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Table from '@/components/ui/Table';
import Select from '@/components/ui/Select';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from '@/components/ui/Toast';
import HomeworkForm from './HomeworkForm';
import {
  getHomeworkList,
  deleteHomework,
} from '@/services/homeworkService';
import { getGroups } from '@/services/groupService';
import { ROLES } from '@/lib/constants';

export default function HomeworkPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isStudent = profile?.role === ROLES.STUDENT;

  const [homeworkList, setHomeworkList] = useState([]);
  const [groups, setGroups] = useState([]);
  const [groupFilter, setGroupFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedHw, setSelectedHw] = useState(null);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const res = await getGroups({ limit: 100 });
        setGroups(res.groups || []);
      } catch (err) {
        console.warn(err);
      }
    };
    loadGroups();
  }, []);

  const fetchHomework = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getHomeworkList({
        groupId: groupFilter,
        teacherId: isStudent ? 'all' : (profile?.role === ROLES.TEACHER ? profile.id : 'all'),
        studentId: isStudent ? profile?.id : null,
      });
      setHomeworkList(data || []);
    } catch (err) {
      console.error(err);
      toast.error(t('homework.fetchError', 'Failed to load homework assignments'));
    } finally {
      setLoading(false);
    }
  }, [groupFilter, isStudent, profile, t]);

  useEffect(() => {
    fetchHomework();
  }, [fetchHomework]);

  const handleDelete = async (id) => {
    if (!window.confirm(t('homework.confirmDelete', 'Delete this homework assignment?'))) return;
    try {
      await deleteHomework(id);
      toast.success(t('homework.deleted', 'Homework deleted'));
      fetchHomework();
    } catch (err) {
      toast.error(t('common.error', 'Failed to delete homework'));
    }
  };

  const columns = [
    {
      header: t('homework.assignment', 'Assignment Title'),
      key: 'title',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-navy/10 dark:bg-brand-navy/40 text-brand-navy dark:text-blue-300 flex items-center justify-center font-bold shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="font-semibold text-gray-900 dark:text-gray-100">{row.title}</span>
            <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{row.description}</p>
          </div>
        </div>
      ),
    },
    {
      header: t('groups.group', 'Cohort Group'),
      key: 'group',
      render: (row) => (
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
          {row.groupName}
        </span>
      ),
    },
    {
      header: t('homework.deadline', 'Due Date'),
      key: 'due_date',
      render: (row) => {
        const isPastDue = row.isPastDue;
        return (
          <div className="flex items-center gap-1.5 text-xs">
            <Clock className={`w-3.5 h-3.5 ${isPastDue ? 'text-brand-red' : 'text-gray-400'}`} />
            <span className={isPastDue ? 'text-brand-red font-medium' : 'text-gray-600 dark:text-gray-300'}>
              {new Date(row.due_date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        );
      },
    },
    {
      header: isStudent ? t('common.status', 'Submission Status') : t('homework.submissions', 'Submissions'),
      key: 'submissions',
      render: (row) => {
        if (isStudent) {
          const sub = row.userSubmission;
          if (!sub) {
            return (
              <Badge variant={row.isPastDue ? 'danger' : 'warning'} size="sm">
                {row.isPastDue ? 'Missing' : 'Pending'}
              </Badge>
            );
          }
          return (
            <Badge variant={sub.status === 'graded' ? 'success' : 'primary'} size="sm">
              <span className="capitalize">{sub.status}</span>
            </Badge>
          );
        }

        return (
          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
            {row.submissionsCount} submitted
          </span>
        );
      },
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
            className="!p-1.5 h-8 w-8 text-gray-600 hover:text-brand-navy"
            title={t('common.view', 'View Details')}
            onClick={() => navigate(`/owner/homework/${row.id}`)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          {!isStudent && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="!p-1.5 h-8 w-8 text-gray-600 hover:text-brand-navy"
                title={t('common.edit', 'Edit')}
                onClick={() => {
                  setSelectedHw(row);
                  setIsFormOpen(true);
                }}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="!p-1.5 h-8 w-8 text-gray-600 hover:text-brand-red"
                title={t('common.delete', 'Delete')}
                onClick={() => handleDelete(row.id)}
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
            <FileText className="w-7 h-7 text-brand-navy dark:text-blue-400" />
            {t('nav.homework', 'Homework & Assignments')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isStudent
              ? t('homework.studentSubtitle', 'Keep track of active coursework deadlines and submit solutions')
              : t('homework.teacherSubtitle', 'Assign coursework tasks, manage submission deadlines, and evaluate student work')}
          </p>
        </div>

        {!isStudent && (
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => {
              setSelectedHw(null);
              setIsFormOpen(true);
            }}
          >
            {t('homework.createHomework', 'Assign Homework')}
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <Card noPadding>
        <div className="p-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="w-full sm:w-80">
            <Select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              placeholder={t('groups.allGroups', 'Barcha o‘quv guruhlari')}
              headerTitle={t('groups.title', 'Guruh bo‘yicha vazifalar')}
              icon={Users}
              size="sm"
              options={[
                { value: 'all', label: t('groups.allGroups', 'Barcha o‘quv guruhlari') },
                ...groups.map((g) => ({
                  value: g.id,
                  label: g.name,
                  subtitle: g.courseName || 'Kurs fani',
                  color: g.courseColor || '#123D78',
                })),
              ]}
            />
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block">
          <Table
            columns={columns}
            data={homeworkList}
            isLoading={loading}
            emptyMessage={t('homework.noHomework', 'No homework assignments found.')}
          />
        </div>

        {/* Mobile Cards View (Zero horizontal scroll) */}
        <div className="block md:hidden">
          {loading ? (
            <div className="py-12 text-center text-gray-500">
              <LoadingSpinner size="md" />
              <p className="text-xs text-gray-400 mt-2">{t('common.loading', 'Yuklanmoqda...')}</p>
            </div>
          ) : homeworkList.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <FileText className="w-10 h-10 mx-auto mb-2 text-gray-400" />
              <p className="text-sm font-semibold">{t('homework.noHomework', 'Uy vazifalari topilmadi.')}</p>
            </div>
          ) : (
            <div className="p-3 space-y-3">
              {homeworkList.map((hw) => {
                const isPastDue = hw.isPastDue;
                const currentRole = profile?.role || 'owner';
                const detailPath = `/${currentRole}/homework/${hw.id}`;

                return (
                  <div
                    key={hw.id}
                    className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark-secondary p-4 shadow-sm space-y-3"
                  >
                    {/* Header: Title + Group Badge */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-brand-navy/10 dark:bg-brand-navy/40 text-brand-navy dark:text-blue-300 flex items-center justify-center font-bold shrink-0 mt-0.5">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">
                            {hw.title}
                          </h3>
                          <span className="inline-block mt-1 text-xs font-medium text-brand-navy dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md">
                            {hw.groupName}
                          </span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="shrink-0">
                        {isStudent ? (
                          !hw.userSubmission ? (
                            <Badge variant={isPastDue ? 'danger' : 'warning'} size="sm">
                              {isPastDue ? 'Kechikkan' : 'Kutilmoqda'}
                            </Badge>
                          ) : (
                            <Badge variant={hw.userSubmission.status === 'graded' ? 'success' : 'primary'} size="sm">
                              {hw.userSubmission.status === 'graded' ? 'Baholandi' : 'Topshirildi'}
                            </Badge>
                          )
                        ) : (
                          <Badge variant="primary" size="sm">
                            {hw.submissionsCount || 0} ta topshirilgan
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    {hw.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 bg-gray-50/70 dark:bg-surface-dark-tertiary/40 p-2.5 rounded-xl">
                        {hw.description}
                      </p>
                    )}

                    {/* Due Date Row */}
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <Clock className={`w-3.5 h-3.5 ${isPastDue ? 'text-brand-red' : 'text-gray-400'}`} />
                        <span className={isPastDue ? 'text-brand-red font-semibold' : 'text-gray-600 dark:text-gray-300'}>
                          Muddati: {new Date(hw.due_date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {isPastDue && (
                        <span className="text-[10px] text-brand-red font-bold uppercase tracking-wider">
                          Muddati o‘tgan
                        </span>
                      )}
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

                      {!isStudent && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            icon={Edit2}
                            className="flex-1 justify-center text-xs py-1.5"
                            onClick={() => {
                              setSelectedHw(hw);
                              setIsFormOpen(true);
                            }}
                          >
                            {t('common.edit', 'Tahrirlash')}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="!p-2 text-gray-500 hover:text-brand-red shrink-0"
                            title={t('common.delete', 'O‘chirish')}
                            onClick={() => handleDelete(hw.id)}
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Homework Create/Edit Modal */}
      {isFormOpen && (
        <HomeworkForm
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedHw(null);
          }}
          homework={selectedHw}
          teacherId={profile?.id}
          onSuccess={fetchHomework}
        />
      )}
    </div>
  );
}
