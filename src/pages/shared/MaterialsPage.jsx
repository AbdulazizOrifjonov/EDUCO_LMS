import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FolderArchive,
  Upload,
  Search,
  FileText,
  Video,
  FileCode,
  Download,
  Trash2,
  Paperclip,
  ExternalLink,
  Users,
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
  getMaterials,
  createMaterial,
  deleteMaterial,
  uploadMaterialFile,
} from '@/services/materialService';
import { getGroups } from '@/services/groupService';
import { ROLES } from '@/lib/constants';

export default function MaterialsPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const canUpload = profile?.role !== ROLES.STUDENT;

  const [materials, setMaterials] = useState([]);
  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newGroupId, setNewGroupId] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const res = await getGroups({ limit: 100 });
        setGroups(res.groups || []);
        if (res.groups?.length > 0) {
          setNewGroupId(res.groups[0].id);
        }
      } catch (err) {
        console.warn(err);
      }
    };
    loadGroups();
  }, []);

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMaterials({
        groupId: groupFilter,
        fileType: typeFilter,
        search,
      });
      setMaterials(data || []);
    } catch (err) {
      console.error(err);
      toast.error(t('materials.fetchError', 'Failed to load materials'));
    } finally {
      setLoading(false);
    }
  }, [groupFilter, typeFilter, search, t]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const handleCreateMaterial = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.warning(t('materials.titleRequired', 'Please enter a title'));
      return;
    }
    if (!newGroupId) {
      toast.warning(t('materials.groupRequired', 'Please select a target group'));
      return;
    }
    if (!selectedFile) {
      toast.warning(t('materials.fileRequired', 'Please select a file to upload'));
      return;
    }

    setUploading(true);
    try {
      const uploadedFile = await uploadMaterialFile(selectedFile);
      await createMaterial({
        title: newTitle,
        description: newDescription,
        groupId: newGroupId,
        fileUrl: uploadedFile.url,
        fileType: selectedFile.type || selectedFile.name.split('.').pop(),
        fileSize: selectedFile.size,
        uploadedBy: profile?.id,
      });
      toast.success(t('materials.uploadSuccess', 'Material uploaded successfully!'));
      setIsUploadOpen(false);
      setNewTitle('');
      setNewDescription('');
      setSelectedFile(null);
      fetchMaterials();
    } catch (err) {
      console.error(err);
      toast.error(t('common.error', 'Upload failed'));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('materials.confirmDelete', 'Delete this learning resource?'))) return;
    try {
      await deleteMaterial(id);
      toast.success(t('materials.deleted', 'Material deleted'));
      fetchMaterials();
    } catch (err) {
      toast.error(t('common.error', 'Failed to delete'));
    }
  };

  const getFileIcon = (type = '') => {
    const t = type.toLowerCase();
    if (t.includes('video') || t.includes('mp4')) return Video;
    if (t.includes('code') || t.includes('js') || t.includes('html')) return FileCode;
    return FileText;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '—';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2.5">
            <FolderArchive className="w-7 h-7 text-brand-navy dark:text-blue-400" />
            {t('nav.materials', 'Learning Materials & Media')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('materials.subtitle', 'Courseware handouts, presentation slides, reference manuals, and media')}
          </p>
        </div>

        {canUpload && (
          <Button
            variant="primary"
            size="md"
            icon={Upload}
            onClick={() => setIsUploadOpen(true)}
          >
            {t('materials.uploadMaterial', 'Upload Resource')}
          </Button>
        )}
      </div>

      {/* Filters Bar */}
      <Card noPadding>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            icon={Search}
            placeholder={t('materials.searchPlaceholder', 'Search titles or descriptions...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-navy"
          >
            <option value="all">{t('groups.allGroups', 'All Cohort Groups')}</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-navy"
          >
            <option value="all">{t('materials.allTypes', 'All Media Types')}</option>
            <option value="pdf">{t('materials.pdfDocs', 'PDF Documents')}</option>
            <option value="video">{t('materials.videoLectures', 'Video Lectures')}</option>
            <option value="zip">{t('materials.zipArchives', 'Archive / ZIP Files')}</option>
          </select>
        </div>
      </Card>

      {/* Material Cards Grid */}
      {loading ? (
        <div className="py-24 text-center">
          <LoadingSpinner size="lg" />
          <p className="text-xs text-gray-500 mt-2">{t('common.loading', 'Loading learning materials...')}</p>
        </div>
      ) : materials.length === 0 ? (
        <Card>
          <div className="py-16 text-center text-gray-500">
            <FolderArchive className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p className="font-semibold text-sm">{t('materials.noMaterials', 'No learning materials found')}</p>
            <p className="text-xs text-gray-400 mt-1">{t('materials.noMaterialsDesc', 'Click "Upload Resource" to share course files.')}</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.map((m) => {
            const Icon = getFileIcon(m.file_type);
            return (
              <Card key={m.id} className="flex flex-col justify-between hover:shadow-card-hover transition-all">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-navy/10 dark:bg-blue-900/40 text-brand-navy dark:text-blue-300 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <Badge variant="primary" size="sm">
                      {m.groupName}
                    </Badge>
                  </div>

                  <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 line-clamp-1">
                    {m.title}
                  </h3>
                  {m.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                      {m.description}
                    </p>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">{formatFileSize(m.file_size)}</span>
                    <span className="mx-1.5">•</span>
                    <span>{new Date(m.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <a
                      href={m.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-surface-dark-tertiary text-brand-navy dark:text-blue-300 transition-colors"
                      title={t('common.download', 'Download / Open')}
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    {canUpload && (
                      <button
                        type="button"
                        onClick={() => handleDelete(m.id)}
                        className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-red-50 text-gray-400 hover:text-brand-red transition-colors"
                        title={t('common.delete', 'Delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title={t('materials.uploadTitle', 'Upload Educational Resource')}
        subtitle={t('materials.uploadSubtitle', 'Add slides, documents, or curriculum exercises for student download')}
        size="md"
      >
        <form onSubmit={handleCreateMaterial} className="space-y-4">
          <Input
            label={t('common.title', 'Resource Title')}
            required
            placeholder="e.g. Unit 3 Vocabulary Sheet"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              {t('groups.group', 'Target Cohort Group')} <span className="text-brand-red">*</span>
            </label>
            <select
              value={newGroupId}
              onChange={(e) => setNewGroupId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-navy"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              {t('common.description', 'Brief Description / Synopsis')}
            </label>
            <textarea
              rows={3}
              placeholder="Overview of this file, topics covered..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 text-sm p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-navy"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 block mb-1.5">
              {t('materials.selectFile', 'Select File')} <span className="text-brand-red">*</span>
            </label>
            <input
              type="file"
              required
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-navy/10 file:text-brand-navy hover:file:bg-brand-navy/20 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <Button variant="ghost" onClick={() => setIsUploadOpen(false)} disabled={uploading}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" variant="primary" isLoading={uploading}>
              {t('common.upload', 'Upload Resource')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
