import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Megaphone,
  Plus,
  Pin,
  Trash2,
  Calendar,
  Users,
  Shield,
  Eye,
  MessageSquare,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from '@/components/ui/Toast';
import {
  getAnnouncements,
  createAnnouncement,
  togglePinAnnouncement,
  deleteAnnouncement,
} from '@/services/announcementService';
import { getGroups } from '@/services/groupService';
import { ROLES } from '@/lib/constants';

export default function AnnouncementsPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const canCreate = profile?.role !== ROLES.STUDENT;

  const [announcements, setAnnouncements] = useState([]);
  const [groups, setGroups] = useState([]);
  const [groupFilter, setGroupFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Create modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [groupId, setGroupId] = useState('');
  const [targetRole, setTargetRole] = useState('all');
  const [isPinned, setIsPinned] = useState(false);
  const [saving, setSaving] = useState(false);

  // Detail modal state
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

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

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAnnouncements({
        groupId: groupFilter,
        targetRole: roleFilter,
      });
      setAnnouncements(data || []);
    } catch (err) {
      console.error(err);
      toast.error(t('announcements.fetchError', 'Failed to load announcements'));
    } finally {
      setLoading(false);
    }
  }, [groupFilter, roleFilter, t]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.warning(t('announcements.requiredFields', 'Title and content are required'));
      return;
    }
    setSaving(true);
    try {
      await createAnnouncement({
        authorId: profile?.id,
        groupId: groupId || null,
        title,
        content,
        targetRole,
        isPinned,
      });
      toast.success(t('announcements.createSuccess', 'Announcement broadcasted!'));
      setIsCreateOpen(false);
      setTitle('');
      setContent('');
      setGroupId('');
      setIsPinned(false);
      fetchAnnouncements();
    } catch (err) {
      console.error(err);
      toast.error(t('common.error', 'Failed to publish announcement'));
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePin = async (item) => {
    try {
      await togglePinAnnouncement(item.id, !item.is_pinned);
      toast.success(item.is_pinned ? 'Unpinned' : 'Pinned to top');
      fetchAnnouncements();
    } catch (err) {
      toast.error('Failed to toggle pin');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('announcements.confirmDelete', 'Delete this broadcast announcement?'))) return;
    try {
      await deleteAnnouncement(id);
      toast.success(t('announcements.deleted', 'Announcement deleted'));
      fetchAnnouncements();
    } catch (err) {
      toast.error(t('common.error', 'Failed to delete'));
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2.5">
            <Megaphone className="w-7 h-7 text-brand-navy dark:text-blue-400" />
            {t('nav.announcements', 'Campus Bulletins & Announcements')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('announcements.subtitle', 'Official institution notices, schedule adjustments, and cohort updates')}
          </p>
        </div>

        {canCreate && (
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => setIsCreateOpen(true)}
          >
            {t('announcements.newAnnouncement', 'New Announcement')}
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <Card noPadding>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-navy"
          >
            <option value="all">{t('groups.allGroups', 'All Audiences & Cohorts')}</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-navy"
          >
            <option value="all">{t('users.allRoles', 'All Target Roles')}</option>
            <option value="student">{t('roles.student', 'Students Only')}</option>
            <option value="teacher">{t('roles.teacher', 'Teachers Only')}</option>
          </select>
        </div>
      </Card>

      {/* Announcements List */}
      {loading ? (
        <div className="py-24 text-center">
          <LoadingSpinner size="lg" />
          <p className="text-xs text-gray-500 mt-2">Loading announcements...</p>
        </div>
      ) : announcements.length === 0 ? (
        <Card>
          <div className="py-16 text-center text-gray-500">
            <Megaphone className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p className="font-semibold text-sm">{t('announcements.noAnnouncements', 'No announcements broadcasted yet')}</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((item) => (
            <Card
              key={item.id}
              className={`transition-all ${
                item.is_pinned
                  ? 'border-brand-navy/30 dark:border-blue-900/40 bg-blue-50/20 dark:bg-blue-950/20 shadow-md'
                  : ''
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    {item.is_pinned && (
                      <Badge variant="danger" size="sm" icon={Pin}>
                        {t('announcements.pinned', 'Pinned')}
                      </Badge>
                    )}
                    <Badge variant="primary" size="sm">
                      {item.groupName}
                    </Badge>
                    {item.target_role && item.target_role !== 'all' && (
                      <Badge variant="secondary" size="sm">
                        {t('announcements.audience', 'Audience')}: {t(`roles.${item.target_role}`, item.target_role)}
                      </Badge>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(item.created_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <h3
                    onClick={() => setSelectedAnnouncement(item)}
                    className="text-base font-bold text-gray-900 dark:text-gray-100 hover:text-brand-navy dark:hover:text-blue-400 cursor-pointer"
                  >
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mt-1 whitespace-pre-line">
                    {item.content}
                  </p>

                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                    <span>{t('announcements.publishedBy', 'Published by')}: {item.authorName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="!p-1.5 h-8 w-8 text-gray-500 hover:text-brand-navy"
                    title={t('common.view', 'View Full Post')}
                    onClick={() => setSelectedAnnouncement(item)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  {canCreate && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`!p-1.5 h-8 w-8 ${
                          item.is_pinned ? 'text-brand-red' : 'text-gray-400 hover:text-brand-navy'
                        }`}
                        title={item.is_pinned ? t('announcements.unpin', 'Unpin') : t('announcements.pin', 'Pin to top')}
                        onClick={() => handleTogglePin(item)}
                      >
                        <Pin className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="!p-1.5 h-8 w-8 text-gray-400 hover:text-brand-red"
                        title={t('common.delete', 'Delete')}
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title={t('announcements.createTitle', 'Broadcast Campus Announcement')}
        subtitle="Publish notices to cohort groups or the full educational community"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label={t('common.title', 'Subject / Title')}
            required
            placeholder="e.g. Schedule Update for Fall Semester"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase text-gray-700 dark:text-gray-300">
                {t('announcements.targetGroup', 'Target Group')}
              </label>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-navy"
              >
                <option value="">{t('announcements.allGroups', 'All Groups (Campus-Wide)')}</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase text-gray-700 dark:text-gray-300">
                {t('announcements.targetRole', 'Target Role')}
              </label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-navy"
              >
                <option value="all">{t('announcements.everyone', 'Everyone')}</option>
                <option value="student">{t('roles.student', 'Students')}</option>
                <option value="teacher">{t('roles.teacher', 'Teachers')}</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase text-gray-700 dark:text-gray-300">
              {t('announcements.content', 'Message Content')}
            </label>
            <textarea
              rows={5}
              required
              placeholder="Announcement details, schedules, instructions..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-brand-navy"
            />
          </div>

          {/* Pin to top checkbox */}
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700 dark:text-gray-300 select-none">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="rounded text-brand-navy focus:ring-brand-navy w-4 h-4"
            />
            <span>{t('announcements.pinCheckbox', 'Pin this announcement at the top of the feed')}</span>
          </label>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)} disabled={saving}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" variant="primary" isLoading={saving}>
              {t('announcements.publish', 'Broadcast Announcement')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      {selectedAnnouncement && (
        <Modal
          isOpen={Boolean(selectedAnnouncement)}
          onClose={() => setSelectedAnnouncement(null)}
          title={selectedAnnouncement.title}
          subtitle={`${t('announcements.publishedBy', 'Published by')} ${selectedAnnouncement.authorName} • ${new Date(selectedAnnouncement.created_at).toLocaleString()}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              {selectedAnnouncement.is_pinned && (
                <Badge variant="danger" size="sm" icon={Pin}>
                  {t('announcements.pinned', 'Pinned')}
                </Badge>
              )}
              <Badge variant="primary" size="sm">
                {selectedAnnouncement.groupName}
              </Badge>
            </div>
            <div className="prose dark:prose-invert text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed py-2">
              {selectedAnnouncement.content}
            </div>
            <div className="flex justify-end pt-3 border-t border-gray-100 dark:border-gray-800">
              <Button variant="outline" onClick={() => setSelectedAnnouncement(null)}>
                {t('common.close', 'Close')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
