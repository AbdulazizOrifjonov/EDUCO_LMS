import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { FileText, Calendar, Users, Paperclip, Upload } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { toast } from '@/components/ui/Toast';
import { createHomework, updateHomework } from '@/services/homeworkService';
import { getGroups } from '@/services/groupService';
import { uploadMaterialFile } from '@/services/materialService';

const homeworkSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(5, 'Description is required'),
  groupId: z.string().min(1, 'Please select a group'),
  dueDate: z.string().min(1, 'Due date is required'),
  maxScore: z.coerce.number().min(1).default(100),
});

export default function HomeworkForm({
  isOpen,
  onClose,
  homework = null,
  teacherId = null,
  onSuccess,
}) {
  const { t } = useTranslation();
  const isEditing = Boolean(homework?.id);
  const [groups, setGroups] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(homeworkSchema),
    defaultValues: {
      title: '',
      description: '',
      groupId: '',
      dueDate: '',
      maxScore: 100,
    },
  });

  useEffect(() => {
    if (!isOpen) return;

    const loadGroups = async () => {
      try {
        const res = await getGroups({ status: 'active', limit: 100 });
        setGroups(res.groups || []);
      } catch (err) {
        console.error(err);
      }
    };
    loadGroups();

    if (homework) {
      reset({
        title: homework.title || '',
        description: homework.description || '',
        groupId: homework.group_id || '',
        dueDate: homework.due_date ? homework.due_date.slice(0, 16) : '',
        maxScore: homework.max_score || 100,
      });
      setAttachments(Array.isArray(homework.attachments) ? homework.attachments : []);
    } else {
      // Default due date = 3 days from now at 23:59
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 3);
      nextDate.setHours(23, 59, 0, 0);

      reset({
        title: '',
        description: '',
        groupId: '',
        dueDate: nextDate.toISOString().slice(0, 16),
        maxScore: 100,
      });
      setAttachments([]);
    }
  }, [homework, isOpen, reset]);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploading(true);
    try {
      const uploadedList = [];
      for (const file of files) {
        const result = await uploadMaterialFile(file, 'homework');
        uploadedList.push(result);
      }
      setAttachments((prev) => [...prev, ...uploadedList]);
      toast.success('File attached');
    } catch (err) {
      toast.error('Failed to attach file');
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (idx) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const payload = {
        title: data.title,
        description: data.description,
        groupId: data.groupId,
        dueDate: new Date(data.dueDate).toISOString(),
        maxScore: data.maxScore,
        attachments,
        teacherId,
      };

      if (isEditing) {
        await updateHomework(homework.id, payload);
        toast.success(t('homework.updateSuccess', 'Homework updated!'));
      } else {
        await createHomework(payload);
        toast.success(t('homework.createSuccess', 'Homework created and assigned!'));
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.message || t('common.error', 'Failed to save homework'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? t('homework.editHomework', 'Edit Homework Assignment') : t('homework.createHomework', 'Assign Homework')}
      subtitle={t('homework.createSubtitle', 'Publish task, submission criteria, deadline, and supplemental documents')}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Title */}
        <Input
          label={t('homework.title', 'Assignment Title')}
          icon={FileText}
          required
          placeholder="e.g. Chapter 4 Grammar Exercises & Essay"
          error={errors.title?.message}
          {...register('title')}
        />

        {/* Group & Deadline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              {t('groups.group', 'Assigned Cohort Group')} <span className="text-brand-red">*</span>
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-navy"
              {...register('groupId')}
            >
              <option value="">{t('groups.selectGroup', 'Select Group...')}</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.courseName})
                </option>
              ))}
            </select>
            {errors.groupId && (
              <p className="text-xs text-brand-red font-medium">{errors.groupId.message}</p>
            )}
          </div>

          <Input
            label={t('homework.deadline', 'Submission Deadline')}
            type="datetime-local"
            icon={Calendar}
            required
            error={errors.dueDate?.message}
            {...register('dueDate')}
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            {t('common.description', 'Instructions & Requirements')} <span className="text-brand-red">*</span>
          </label>
          <textarea
            rows={4}
            placeholder={t('homework.descPlaceholder', 'Detailed homework tasks, reference materials, formatting requirements...')}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-brand-navy"
            {...register('description')}
          />
          {errors.description && (
            <p className="text-xs text-brand-red font-medium">{errors.description.message}</p>
          )}
        </div>

        {/* Attachments Upload */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <Paperclip className="w-3.5 h-3.5" />
            {t('homework.attachments', 'Attachment Documents & Worksheets')}
          </label>

          <div className="flex items-center gap-2">
            <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-surface-dark-tertiary text-xs font-medium text-gray-700 dark:text-gray-200 transition-colors">
              <Upload className="w-4 h-4 text-brand-navy dark:text-blue-400" />
              <span>{uploading ? t('common.loading', 'Uploading...') : t('homework.attachFiles', 'Attach File(s)')}</span>
              <input
                type="file"
                multiple
                className="hidden"
                disabled={uploading}
                onChange={handleFileUpload}
              />
            </label>
          </div>

          {/* Attached Files List */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {attachments.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-surface-dark-tertiary text-xs text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                >
                  <Paperclip className="w-3 h-3 text-brand-navy" />
                  <span className="font-medium max-w-[150px] truncate">{file.name || 'File'}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(idx)}
                    className="text-gray-400 hover:text-brand-red ml-1 font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {isEditing ? t('common.save', 'Save Changes') : t('homework.assign', 'Publish Homework')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
