import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Award,
  Calendar,
  Users,
  Plus,
  Edit2,
  Trash2,
  MessageSquare,
  BookOpen,
  History,
  CheckCircle2,
  ChevronDown,
  Check,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Table from '@/components/ui/Table';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from '@/components/ui/Toast';
import GradeForm from './GradeForm';
import {
  getGradesByGroup,
  getGradesByStudent,
  deleteGrade,
  GRADE_COLORS,
} from '@/services/gradeService';
import { getGroups, getGroupById } from '@/services/groupService';
import { getOrCreateLesson } from '@/services/attendanceService';
import { ROLES } from '@/lib/constants';

export default function GradesPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const isStudent = profile?.role === ROLES.STUDENT;

  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [grades, setGrades] = useState([]);
  const [students, setStudents] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loading, setLoading] = useState(true);

  // Custom Group Dropdown State
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);
  const groupDropdownRef = useRef(null);

  // Close group dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (groupDropdownRef.current && !groupDropdownRef.current.contains(event.target)) {
        setGroupDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load groups (or student's grades directly)
  useEffect(() => {
    const init = async () => {
      if (isStudent && profile?.id) {
        setLoading(true);
        try {
          const studentGrades = await getGradesByStudent(profile.id);
          setGrades(studentGrades);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      } else {
        try {
          const gRes = await getGroups({ status: 'active', limit: 100 });
          const groupList = gRes.groups || [];
          setGroups(groupList);
          if (groupList.length > 0 && !selectedGroupId) {
            setSelectedGroupId(groupList[0].id);
          }
        } catch (err) {
          console.error(err);
        }
      }
    };
    init();
  }, [isStudent, profile]);

  // Load group students & grades
  const fetchGroupGrades = useCallback(async () => {
    if (isStudent || !selectedGroupId) return;
    setLoading(true);
    try {
      const [groupDetails, groupGrades] = await Promise.all([
        getGroupById(selectedGroupId),
        getGradesByGroup(selectedGroupId),
      ]);

      setStudents(groupDetails.students || []);
      setGrades(groupGrades || []);

      // Get or create today's lesson reference for new assessments
      const today = new Date().toISOString().split('T')[0];
      const lesson = await getOrCreateLesson({
        groupId: selectedGroupId,
        date: today,
        title: `${groupDetails.name} Session`,
        createdBy: profile?.id,
      });
      setCurrentLesson(lesson);
    } catch (err) {
      console.error(err);
      toast.error(t('grades.fetchError', 'Failed to load group grades'));
    } finally {
      setLoading(false);
    }
  }, [selectedGroupId, isStudent, profile, t]);

  useEffect(() => {
    fetchGroupGrades();
  }, [fetchGroupGrades]);

  const handleDeleteGrade = async (gradeId) => {
    if (!window.confirm(t('grades.confirmDelete', 'Delete this grade record?'))) return;
    try {
      await deleteGrade(gradeId);
      toast.success(t('grades.deleted', 'Grade deleted successfully'));
      fetchGroupGrades();
    } catch (err) {
      toast.error(t('common.error', 'Failed to delete grade'));
    }
  };

  const renderGradeBadge = (val) => {
    const num = Math.round(Number(val));
    const config = GRADE_COLORS[num] || GRADE_COLORS[5];
    return (
      <span
        className={`inline-flex items-center justify-center font-bold px-2.5 py-1 rounded-lg text-sm border shadow-sm ${config.bg} ${config.text} ${config.border}`}
      >
        {num} / 5
      </span>
    );
  };

  // Student view columns
  const studentColumns = [
    {
      header: t('schedule.lesson', 'Subject / Lesson'),
      key: 'lesson',
      render: (row) => (
        <div>
          <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
            {row.lessons?.title || 'Academic Session'}
          </p>
          <p className="text-xs text-gray-500">{row.lessons?.groups?.name}</p>
        </div>
      ),
    },
    {
      header: t('grades.grade', 'Score (1 - 5)'),
      key: 'grade_value',
      render: (row) => renderGradeBadge(row.grade_value),
    },
    {
      header: t('grades.feedback', 'Instructor Evaluation'),
      key: 'feedback',
      render: (row) => (
        <span className="text-xs text-gray-600 dark:text-gray-300 italic">
          {row.feedback || t('grades.noFeedback', 'No feedback provided')}
        </span>
      ),
    },
    {
      header: t('common.date', 'Evaluation Date'),
      key: 'created_at',
      render: (row) => (
        <span className="text-xs text-gray-500">
          {row.created_at ? new Date(row.created_at).toLocaleDateString() : '—'}
        </span>
      ),
    },
  ];

  const activeGroup = groups.find((g) => g.id === selectedGroupId) || groups[0];

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Award className="w-5 h-5 sm:w-6 sm:h-6 text-brand-navy dark:text-blue-400 shrink-0" />
            <span>{t('nav.grades', 'Student Grades & Academic Assessment')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1 sm:line-clamp-none">
            {isStudent
              ? t('grades.studentSubtitle', 'Review your academic scores, feedback, and progress')
              : t('grades.teacherSubtitle', 'Evaluate student performance on a 1-5 standardized scale with feedback')}
          </p>
        </div>
      </div>

      {/* Group Selector for Teachers & Admins */}
      {!isStudent && (
        <Card noPadding className="overflow-visible">
          <div className="p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            {/* Custom Interactive Group Selector */}
            <div className="relative flex-1 min-w-0" ref={groupDropdownRef}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-brand-navy dark:text-blue-400" />
                  <span>{t('groups.group', 'O‘quv guruhi')}</span>
                </label>
                {groups.length > 0 && (
                  <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                    {groups.length} ta guruh mavjud
                  </span>
                )}
              </div>

              {/* Selector Trigger Button */}
              <button
                type="button"
                onClick={() => setGroupDropdownOpen((prev) => !prev)}
                className="w-full flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-2xl border border-gray-300/80 dark:border-gray-700 bg-white dark:bg-surface-dark-secondary hover:border-brand-navy/60 dark:hover:border-blue-500/60 shadow-xs transition-all text-left rtl:text-right focus:outline-none focus:ring-2 focus:ring-brand-navy/20 cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0 shadow-xs"
                    style={{ backgroundColor: activeGroup?.courseColor || '#123D78' }}
                  >
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">
                      {activeGroup?.name || t('groups.selectGroup', 'Guruhni tanlang')}
                    </p>
                    <p className="text-xs text-brand-navy dark:text-blue-400 font-medium truncate mt-0.5">
                      {activeGroup?.courseName || 'Kurs fani'}
                      {activeGroup?.room ? ` • ${activeGroup.room}-xona` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-surface-dark-tertiary text-gray-600 dark:text-gray-300">
                    {students.length} o‘quvchi
                  </span>
                  <div className="p-1 rounded-lg bg-gray-100 dark:bg-surface-dark-tertiary text-gray-500 dark:text-gray-400">
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        groupDropdownOpen ? 'rotate-180 text-brand-navy dark:text-blue-400' : ''
                      }`}
                    />
                  </div>
                </div>
              </button>

              {/* Dropdown Popover List */}
              {groupDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2332] shadow-2xl p-2 max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800">
                    Guruhni tanlang ({groups.length})
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-800/60 mt-1">
                    {groups.map((g) => {
                      const isSelected = g.id === selectedGroupId;
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => {
                            setSelectedGroupId(g.id);
                            setGroupDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between gap-3 p-2.5 rounded-xl transition-colors text-left rtl:text-right cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50/80 dark:bg-blue-950/40 text-brand-navy dark:text-blue-300'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800/60 text-gray-700 dark:text-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs"
                              style={{ backgroundColor: g.courseColor || '#123D78' }}
                            >
                              <Users className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`text-sm truncate ${isSelected ? 'font-bold' : 'font-semibold'}`}>
                                {g.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                {g.courseName}
                                {g.room ? ` • ${g.room}-xona` : ''}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isSelected && (
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-navy text-white dark:bg-blue-500">
                                <Check className="h-3 w-3" />
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Action Button: Record New Grade */}
            <div className="shrink-0 w-full sm:w-auto pt-1 sm:pt-0">
              <Button
                variant="primary"
                size="md"
                icon={Plus}
                className="w-full sm:w-auto justify-center text-xs sm:text-sm font-semibold py-2.5 px-4 shadow-sm"
                onClick={() => {
                  setSelectedStudent(null);
                  setSelectedGradeRecord(null);
                  setIsFormOpen(true);
                }}
                disabled={students.length === 0}
              >
                {t('grades.addGrade', 'Yangi baho yozish')}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Student View (Read-Only) */}
      {isStudent ? (
        <Card noPadding>
          {/* Desktop Student Table */}
          <div className="hidden md:block">
            <Table
              columns={studentColumns}
              data={grades}
              isLoading={loading}
              emptyMessage={t('grades.noStudentGrades', 'You have no recorded grades yet.')}
            />
          </div>

          {/* Mobile Student Cards (Zero horizontal scroll) */}
          <div className="block md:hidden">
            {loading ? (
              <div className="py-12 text-center text-gray-500">
                <LoadingSpinner size="md" />
                <p className="text-xs text-gray-400 mt-2">{t('common.loading', 'Yuklanmoqda...')}</p>
              </div>
            ) : grades.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                <Award className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                <p className="text-sm font-semibold">{t('grades.noStudentGrades', 'Hali hech qanday baho mavjud emas.')}</p>
              </div>
            ) : (
              <div className="p-3 space-y-3">
                {grades.map((g) => (
                  <div
                    key={g.id}
                    className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark-secondary p-4 shadow-sm space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-sm text-gray-900 dark:text-gray-100">
                          {g.lessons?.title || 'Dars mashg‘uloti'}
                        </p>
                        <p className="text-xs text-gray-500">{g.lessons?.groups?.name}</p>
                      </div>
                      <div className="shrink-0">{renderGradeBadge(g.grade_value)}</div>
                    </div>
                    {g.feedback && (
                      <p className="text-xs text-gray-600 dark:text-gray-300 italic bg-gray-50 dark:bg-surface-dark-tertiary p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                        "{g.feedback}"
                      </p>
                    )}
                    <p className="text-[11px] text-gray-400">
                      📅 {g.created_at ? new Date(g.created_at).toLocaleDateString() : '—'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      ) : (
        /* Teacher / Admin View: Roster with Latest Grades and Add/Edit */
        <Card noPadding>
          <div className="p-3.5 sm:p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Users className="w-4 h-4 text-brand-navy dark:text-blue-400 shrink-0" />
              <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100 truncate">
                {t('grades.rosterTitle', 'Guruh talabalarining baholari')}
              </h3>
            </div>
            <span className="shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-brand-navy dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50 whitespace-nowrap">
              {students.length} {t('grades.studentsBadge', 'o‘quvchi')}
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <LoadingSpinner size="md" />
              <p className="text-xs text-gray-500 mt-2">{t('common.loading', 'Loading student grades...')}</p>
            </div>
          ) : students.length === 0 ? (
            <div className="py-16 text-center text-gray-500">
              <Users className="w-10 h-10 mx-auto mb-2 text-gray-400" />
              <p className="text-sm font-semibold">{t('groups.noStudents', 'No students enrolled in this group.')}</p>
            </div>
          ) : (
            <>
              {/* Desktop Roster List */}
              <div className="hidden md:block divide-y divide-gray-100 dark:divide-gray-800">
                {students.map((st, idx) => {
                  const studentGradeRecords = grades.filter((g) => g.student_id === st.id);
                  const latestGrade = studentGradeRecords[0]; // ordered desc

                  return (
                    <div
                      key={st.id}
                      className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-surface-dark-tertiary/20 transition-colors"
                    >
                      {/* Student Info */}
                      <div className="flex items-center gap-3 min-w-[220px]">
                        <span className="text-xs font-mono text-gray-400 w-5">{idx + 1}.</span>
                        <div className="w-9 h-9 rounded-full bg-brand-navy/10 text-brand-navy dark:text-blue-300 font-bold flex items-center justify-center text-xs uppercase">
                          {st.first_name?.[0] || 'S'}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                            {st.fullName}
                          </p>
                          <p className="text-xs text-gray-500">@{st.username}</p>
                        </div>
                      </div>

                      {/* Latest Grade & Feedback Display */}
                      <div className="flex-1 flex items-center gap-4 flex-wrap">
                        {latestGrade ? (
                          <>
                            <div>{renderGradeBadge(latestGrade.grade_value)}</div>
                            <div className="max-w-md">
                              <p className="text-xs text-gray-700 dark:text-gray-200 line-clamp-1 italic">
                                "{latestGrade.feedback || t('grades.noFeedback', 'No written remark')}"
                              </p>
                              <span className="text-[10px] text-gray-400">
                                {t('grades.evaluatedOn', 'Evaluated')} {new Date(latestGrade.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 italic">
                            {t('grades.notGraded', 'No grades recorded yet')}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant={latestGrade ? 'outline' : 'primary'}
                          size="sm"
                          icon={latestGrade ? Edit2 : Plus}
                          onClick={() => {
                            setSelectedStudent(st);
                            setSelectedGradeRecord(latestGrade || null);
                            setIsFormOpen(true);
                          }}
                        >
                          {latestGrade ? t('grades.editGrade', 'Update') : t('grades.addGrade', 'Grade')}
                        </Button>
                        {latestGrade && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="!p-1.5 h-8 w-8 text-gray-500 hover:text-brand-red"
                            onClick={() => handleDeleteGrade(latestGrade.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Mobile Student Assessment Cards (Zero horizontal scroll) */}
              <div className="block md:hidden p-3 space-y-3">
                {students.map((st, idx) => {
                  const studentGradeRecords = grades.filter((g) => g.student_id === st.id);
                  const latestGrade = studentGradeRecords[0];
                  const avgGrade =
                    studentGradeRecords.length > 0
                      ? (
                          studentGradeRecords.reduce((acc, g) => acc + Number(g.grade_value), 0) /
                          studentGradeRecords.length
                        ).toFixed(1)
                      : null;

                  return (
                    <div
                      key={st.id}
                      className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark-secondary p-4 shadow-sm space-y-3"
                    >
                      {/* Top: Avatar, Name, Username, Rank */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-brand-navy/10 text-brand-navy dark:text-blue-300 font-bold flex items-center justify-center text-sm uppercase shrink-0">
                            {st.first_name?.[0] || 'S'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">
                              {st.fullName}
                            </p>
                            <p className="text-xs text-gray-500 truncate">@{st.username}</p>
                          </div>
                        </div>
                        <span className="text-xs font-mono text-gray-400 bg-gray-100 dark:bg-surface-dark-tertiary px-2 py-0.5 rounded-full shrink-0">
                          #{idx + 1}
                        </span>
                      </div>

                      {/* Grade Section */}
                      <div className="pt-2.5 pb-1 border-t border-gray-100 dark:border-gray-800">
                        {latestGrade ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-gray-500">So‘nggi baho:</span>
                                {renderGradeBadge(latestGrade.grade_value)}
                              </div>
                              {avgGrade && studentGradeRecords.length > 1 && (
                                <span className="text-xs bg-blue-50 dark:bg-blue-950/40 text-brand-navy dark:text-blue-300 px-2 py-0.5 rounded-md font-semibold">
                                  O‘rtacha: {avgGrade}
                                </span>
                              )}
                            </div>

                            {latestGrade.feedback && (
                              <p className="text-xs text-gray-700 dark:text-gray-300 italic bg-gray-50 dark:bg-surface-dark-tertiary p-2 rounded-xl border border-gray-100 dark:border-gray-800">
                                "{latestGrade.feedback}"
                              </p>
                            )}

                            <div className="flex items-center justify-between text-[11px] text-gray-400">
                              <span>
                                {t('grades.evaluatedOn', 'Baholangan')}: {new Date(latestGrade.created_at).toLocaleDateString()}
                              </span>
                              {studentGradeRecords.length > 1 && (
                                <span>{studentGradeRecords.length} ta baho mavjud</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="py-2.5 text-center bg-gray-50/60 dark:bg-surface-dark-tertiary/40 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                            <span className="text-xs text-gray-400 italic">
                              {t('grades.notGraded', 'Hali baho qo‘yilmagan')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2">
                        <Button
                          variant={latestGrade ? 'outline' : 'primary'}
                          size="sm"
                          icon={latestGrade ? Edit2 : Plus}
                          className="flex-1 justify-center text-xs py-2"
                          onClick={() => {
                            setSelectedStudent(st);
                            setSelectedGradeRecord(latestGrade || null);
                            setIsFormOpen(true);
                          }}
                        >
                          {latestGrade ? t('grades.editGrade', 'Bahoni o‘zgartirish') : t('grades.addGrade', '+ Baho qo‘yish')}
                        </Button>

                        {latestGrade && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="!p-2 text-gray-500 hover:text-brand-red shrink-0"
                            title={t('common.delete', 'O‘chirish')}
                            onClick={() => handleDeleteGrade(latestGrade.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Card>
      )}

      {/* Grade Form Modal */}
      {isFormOpen && (
        <GradeForm
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedStudent(null);
            setSelectedGradeRecord(null);
          }}
          lessonId={currentLesson?.id}
          student={selectedStudent}
          availableStudents={students}
          currentGrade={selectedGradeRecord}
          gradedBy={profile?.id}
          onSuccess={fetchGroupGrades}
        />
      )}
    </div>
  );
}
