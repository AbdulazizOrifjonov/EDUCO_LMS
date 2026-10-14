import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Calendar,
  Clock,
  ArrowLeft,
  Paperclip,
  Upload,
  CheckCircle2,
  AlertCircle,
  Award,
  Send,
  Eye,
  MessageSquare,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from '@/components/ui/Toast';
import {
  getHomeworkById,
  submitHomework,
  gradeHomeworkSubmission,
} from '@/services/homeworkService';
import { uploadMaterialFile } from '@/services/materialService';
import { ROLES } from '@/lib/constants';

export default function HomeworkDetail({ homeworkId: propHwId }) {
  const { t } = useTranslation();
  const { id: paramHwId } = useParams();
  const navigate = useNavigate();
  const hwId = propHwId || paramHwId;

  const { profile } = useAuth();
  const isStudent = profile?.role === ROLES.STUDENT;

  const [homework, setHomework] = useState(null);
  const [loading, setLoading] = useState(true);

  // Student submission form state
  const [submissionText, setSubmissionText] = useState('');
  const [studentAttachments, setStudentAttachments] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Teacher grading modal state
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradeScore, setGradeScore] = useState(100);
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [grading, setGrading] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!hwId) return;
    setLoading(true);
    try {
      const data = await getHomeworkById(hwId);
      setHomework(data);

      if (isStudent && profile?.id) {
        const mySub = (data.homework_submissions || []).find((s) => s.student_id === profile.id);
        if (mySub) {
          setSubmissionText(mySub.submission_text || '');
          setStudentAttachments(Array.isArray(mySub.attachments) ? mySub.attachments : []);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(t('homework.fetchError', 'Failed to load homework details'));
    } finally {
      setLoading(false);
    }
  }, [hwId, isStudent, profile, t]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleStudentFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadingFile(true);
    try {
      const list = [];
      for (const f of files) {
        const res = await uploadMaterialFile(f, 'submissions');
        list.push(res);
      }
      setStudentAttachments((prev) => [...prev, ...list]);
      toast.success('Attached submission file');
    } catch (err) {
      toast.error('File upload failed');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    if (!submissionText.trim() && studentAttachments.length === 0) {
      toast.warning('Please enter text or attach a file to submit');
      return;
    }
    setSubmitting(true);
    try {
      await submitHomework({
        homeworkId: hwId,
        studentId: profile.id,
        submissionText,
        attachments: studentAttachments,
      });
      toast.success(t('homework.submitSuccess', 'Homework submitted successfully!'));
      fetchDetail();
    } catch (err) {
      console.error(err);
      toast.error(t('common.error', 'Submission failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenGrade = (sub) => {
    setSelectedSubmission(sub);
    setGradeScore(sub.score !== null ? sub.score : homework?.max_score || 100);
    setGradeFeedback(sub.feedback || '');
    setIsGradeModalOpen(true);
  };

  const handleSaveGrade = async () => {
    if (!selectedSubmission) return;
    setGrading(true);
    try {
      await gradeHomeworkSubmission({
        submissionId: selectedSubmission.id,
        score: gradeScore,
        feedback: gradeFeedback,
        gradedBy: profile?.id,
      });
      toast.success(t('homework.gradedSuccess', 'Submission graded successfully!'));
      setIsGradeModalOpen(false);
      fetchDetail();
    } catch (err) {
      console.error(err);
      toast.error(t('common.error', 'Grading failed'));
    } finally {
      setGrading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <LoadingSpinner size="lg" />
        <p className="text-xs text-gray-500 mt-2">Loading homework...</p>
      </div>
    );
  }

  if (!homework) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-brand-red mx-auto mb-3" />
        <h3 className="text-lg font-bold">Homework assignment not found</h3>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    );
  }

  const isPastDue = new Date(homework.due_date) < new Date();
  const mySubmission = (homework.submissions || []).find((s) => s.student_id === profile?.id);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          icon={ArrowLeft}
          onClick={() => navigate(-1)}
          className="!p-2 h-9 w-9"
        />
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{homework.title}</h1>
            <Badge variant="primary" size="md">
              {homework.groups?.name}
            </Badge>
            <Badge variant={isPastDue ? 'danger' : 'success'} size="sm">
              {isPastDue ? 'Past Due' : 'Active'}
            </Badge>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-brand-navy" />
              Due: {new Date(homework.due_date).toLocaleString()}
            </span>
            <span>Max Score: {homework.max_score} pts</span>
            <span>Assigned by: {homework.teacherName}</span>
          </p>
        </div>
      </div>

      {/* Assignment Description & Reference Files */}
      <Card title={t('homework.instructions', 'Assignment Instructions')}>
        <div className="prose dark:prose-invert max-w-none text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
          {homework.description}
        </div>

        {homework.attachments && homework.attachments.length > 0 && (
          <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Reference Files & Materials
            </p>
            <div className="flex flex-wrap gap-2.5">
              {homework.attachments.map((file, idx) => (
                <a
                  key={idx}
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-surface-dark-tertiary text-xs font-medium text-brand-navy dark:text-blue-300 hover:border-brand-navy transition-colors"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  <span className="max-w-[180px] truncate">{file.name || 'Download File'}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Student View: Submission Form & Evaluation Result */}
      {isStudent ? (
        <Card title={t('homework.yourSubmission', 'Your Homework Submission')}>
          {mySubmission && mySubmission.status === 'graded' && (
            <div className="p-4 rounded-xl mb-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
              <Award className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">
                  Graded: {mySubmission.score} / {homework.max_score} points
                </p>
                {mySubmission.feedback && (
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1 italic">
                    "{mySubmission.feedback}"
                  </p>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleStudentSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 block mb-1.5">
                {t('homework.submissionText', 'Answer / Written Submission')}
              </label>
              <textarea
                rows={5}
                disabled={mySubmission?.status === 'graded'}
                placeholder="Type your homework response or paste code/links here..."
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-brand-navy"
              />
            </div>

            {/* Attachments for Student */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 block mb-1.5">
                {t('homework.attachments', 'Attach Completed Files / Solution')}
              </label>

              {mySubmission?.status !== 'graded' && (
                <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 hover:bg-gray-50 text-xs font-medium">
                  <Upload className="w-4 h-4 text-brand-navy" />
                  <span>{uploadingFile ? 'Uploading...' : 'Upload File'}</span>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    disabled={uploadingFile}
                    onChange={handleStudentFileUpload}
                  />
                </label>
              )}

              {studentAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {studentAttachments.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-100 dark:bg-surface-dark-tertiary text-xs border"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-brand-navy" />
                      <span className="font-medium">{f.name || 'File'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {mySubmission?.status !== 'graded' && (
              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  icon={Send}
                  isLoading={submitting}
                  disabled={uploadingFile}
                >
                  {mySubmission ? t('homework.resubmit', 'Update Submission') : t('homework.submit', 'Turn In Homework')}
                </Button>
              </div>
            )}
          </form>
        </Card>
      ) : (
        /* Teacher / Admin View: Submissions Review Table */
        <Card noPadding>
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {t('homework.submissions', 'Student Submissions')}
            </h3>
            <span className="text-xs text-gray-500 font-medium">
              {homework.submissions?.length || 0} received
            </span>
          </div>

          <Table
            columns={[
              {
                header: t('users.student', 'Student'),
                key: 'student',
                render: (row) => (
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-brand-navy/10 text-brand-navy font-bold flex items-center justify-center text-xs">
                      {row.profiles?.first_name?.[0] || 'S'}
                    </div>
                    <div>
                      <p className="font-semibold text-xs text-gray-900 dark:text-gray-100">
                        {row.profiles?.first_name} {row.profiles?.last_name}
                      </p>
                      <p className="text-[10px] text-gray-400">@{row.profiles?.username}</p>
                    </div>
                  </div>
                ),
              },
              {
                header: t('common.date', 'Submitted At'),
                key: 'submitted_at',
                render: (row) => (
                  <span className="text-xs text-gray-500">
                    {row.submitted_at ? new Date(row.submitted_at).toLocaleString() : '—'}
                  </span>
                ),
              },
              {
                header: t('common.status', 'Status'),
                key: 'status',
                render: (row) => (
                  <Badge variant={row.status === 'graded' ? 'success' : 'warning'} size="sm">
                    <span className="capitalize">{row.status}</span>
                  </Badge>
                ),
              },
              {
                header: t('grades.grade', 'Score'),
                key: 'score',
                render: (row) => (
                  <span className="font-bold text-xs">
                    {row.score !== null ? `${row.score} / ${homework.max_score}` : 'Ungraded'}
                  </span>
                ),
              },
              {
                header: t('common.actions', 'Action'),
                key: 'action',
                className: 'text-right rtl:text-left',
                cellClassName: 'text-right rtl:text-left',
                render: (row) => (
                  <Button
                    variant={row.status === 'graded' ? 'outline' : 'primary'}
                    size="sm"
                    onClick={() => handleOpenGrade(row)}
                  >
                    {row.status === 'graded' ? 'Review & Edit' : 'Grade'}
                  </Button>
                ),
              },
            ]}
            data={homework.submissions || []}
            emptyMessage={t('homework.noSubmissions', 'No student submissions received yet.')}
          />
        </Card>
      )}

      {/* Grading Modal (Teacher) */}
      <Modal
        isOpen={isGradeModalOpen}
        onClose={() => setIsGradeModalOpen(false)}
        title={t('homework.evaluateSubmission', 'Grade Homework Submission')}
        subtitle={`Reviewing work of ${selectedSubmission?.profiles?.first_name || ''} ${selectedSubmission?.profiles?.last_name || ''}`}
        size="lg"
      >
        <div className="space-y-4">
          {/* Submission text preview */}
          {selectedSubmission?.submission_text && (
            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-surface-dark-tertiary border text-xs leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
              <span className="font-semibold block mb-1 text-gray-500 uppercase text-[10px]">
                Student Text:
              </span>
              {selectedSubmission.submission_text}
            </div>
          )}

          {/* Attachments */}
          {selectedSubmission?.attachments && selectedSubmission.attachments.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500 mb-1.5">Submitted Attachments:</p>
              <div className="flex flex-wrap gap-2">
                {selectedSubmission.attachments.map((f, i) => (
                  <a
                    key={i}
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-white dark:bg-surface-dark-secondary text-xs text-brand-navy dark:text-blue-300 font-medium hover:border-brand-navy"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>{f.name || 'View File'}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Score input */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={`Score (0 - ${homework.max_score})`}
              type="number"
              min={0}
              max={homework.max_score}
              value={gradeScore}
              onChange={(e) => setGradeScore(e.target.value)}
            />
          </div>

          {/* Feedback */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Instructor Feedback / Corrections
            </label>
            <textarea
              rows={3}
              placeholder="Constructive feedback for student..."
              value={gradeFeedback}
              onChange={(e) => setGradeFeedback(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 text-sm p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-navy"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <Button variant="ghost" onClick={() => setIsGradeModalOpen(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button variant="primary" isLoading={grading} onClick={handleSaveGrade}>
              {t('common.save', 'Save Score & Feedback')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
