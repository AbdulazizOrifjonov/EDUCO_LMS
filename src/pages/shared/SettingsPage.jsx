import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Settings,
  User,
  Palette,
  Globe,
  Building2,
  CheckCircle,
  Save,
  Moon,
  Sun,
  Laptop,
  Clock,
  Shield,
  FileText,
  Download,
  Upload,
  Database,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import { useThemeStore } from '@/hooks/useTheme';
import { Button, Card, Badge, Input } from '@/components/ui';
import Select from '@/components/ui/Select';
import ProfilePage from './ProfilePage';
import { LanguageFlag } from '@/components/LanguageSelector';
import { getCenterSettings, updateCenterSettings } from '@/services/settingsService';
import { exportDatabaseBackup, restoreDatabaseBackup } from '@/services/backupService';
import { useTwoStepConfirm } from '@/context/ConfirmContext';
import { toast } from '@/components/ui/Toast';

export default function SettingsPage() {
  const { confirmDelete } = useTwoStepConfirm();
  const backupInputRef = useRef(null);
  const [isExportingBackup, setIsExportingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);

  const handleExportBackup = async () => {
    try {
      setIsExportingBackup(true);
      exportDatabaseBackup(centerConfig.center_name || 'EDUCO LMS');
      toast.success('Barcha ma’lumotlar zaxira nusxasi muvaffaqiyatli yuklab olindi!');
    } catch (e) {
      toast.error('Zaxira nusxani yaratishda xatolik: ' + e.message);
    } finally {
      setIsExportingBackup(false);
    }
  };

  const handleFileSelectedForRestore = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ok = await confirmDelete({
      title: 'Zaxira nusxadan qayta tiklash',
      itemName: file.name,
      description: 'Ushbu fayldagi barcha ma’lumotlar (talabalar, guruhlar, kurslar, davomat, baholar) tizimga yuklanadi va server bilan sinxronizatsiya qilinadi.',
      confirmButtonText: 'Ha, bazani qayta tiklash',
    });

    if (!ok) {
      e.target.value = '';
      return;
    }

    try {
      setIsRestoringBackup(true);
      const text = await file.text();
      await restoreDatabaseBackup(text);
      toast.success('Tizim ma’lumotlari zaxiradan to‘liq tiklandi!');
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err) {
      toast.error('Tiklashda xatolik yuz berdi: ' + err.message);
    } finally {
      setIsRestoringBackup(false);
      e.target.value = '';
    }
  };

  const { t, i18n } = useTranslation();
  const { profile } = useAuth();
  const { theme, setTheme } = useThemeStore();

  const isOwner = profile?.role === 'owner';
  const isAdmin = profile?.role === 'admin';
  const canManageCenter = isOwner || isAdmin;

  const { id: paramId } = useParams();
  const [searchParams] = useSearchParams();
  const queryUserId = paramId || searchParams.get('userId');

  // Active Tab (Defaults to profile if a specific user is targeted)
  const [activeTab, setActiveTab] = useState(() => {
    if (paramId || searchParams.get('userId')) return 'profile';
    return searchParams.get('tab') || 'profile';
  });

  useEffect(() => {
    if (paramId || searchParams.get('userId')) {
      setActiveTab('profile');
    }
  }, [paramId, searchParams]);

  // Center Settings State
  const [centerConfig, setCenterConfig] = useState({
    center_name: 'EDUCO Learning Center',
    timezone: 'Asia/Tashkent',
    attendance_deadline_hours: 24,
    default_absence_type: 'unexcused',
    chat_retention_days: 90,
    max_file_size_mb: 25,
  });

  const [loadingCenter, setLoadingCenter] = useState(false);
  const [savingCenter, setSavingCenter] = useState(false);
  const [centerSuccess, setCenterSuccess] = useState('');

  useEffect(() => {
    if (canManageCenter) {
      loadCenter();
    }
  }, [canManageCenter]);

  const loadCenter = async () => {
    try {
      setLoadingCenter(true);
      const data = await getCenterSettings();
      if (data) {
        setCenterConfig((prev) => ({
          ...prev,
          ...data,
        }));
      }
    } catch (err) {
      console.error('Failed to load center settings:', err);
    } finally {
      setLoadingCenter(false);
    }
  };

  const handleCenterSave = async (e) => {
    e.preventDefault();
    try {
      setSavingCenter(true);
      setCenterSuccess('');
      await updateCenterSettings(centerConfig);
      setCenterSuccess('Center configuration updated successfully.');
      setTimeout(() => setCenterSuccess(''), 4000);
    } catch (err) {
      console.error('Failed to save center settings:', err);
    } finally {
      setSavingCenter(false);
    }
  };

  const handleLanguageSelect = (lang) => {
    i18n.changeLanguage(lang);
    try {
      localStorage.setItem('educo-lang', lang);
    } catch (e) {}
    document.documentElement.lang = lang;
    if (lang === 'ar') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t('settings.title', 'Settings & Configuration')}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {t('settings.settingsSubtitle', 'Manage system preferences, localization, user profile and organizational parameters')}
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <nav className="flex space-x-6 rtl:space-x-reverse" aria-label="Settings Tabs">
          <button
            onClick={() => setActiveTab('profile')}
            className={`
              flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors
              ${
                activeTab === 'profile'
                  ? 'border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-300'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }
            `}
          >
            <User className="w-4 h-4" />
            <span>{t('common.profile', 'Profile')}</span>
          </button>

          <button
            onClick={() => setActiveTab('appearance')}
            className={`
              flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors
              ${
                activeTab === 'appearance'
                  ? 'border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-300'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }
            `}
          >
            <Palette className="w-4 h-4" />
            <span>{t('settings.themeSettings', 'Appearance')}</span>
          </button>

          <button
            onClick={() => setActiveTab('language')}
            className={`
              flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors
              ${
                activeTab === 'language'
                  ? 'border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-300'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }
            `}
          >
            <Globe className="w-4 h-4" />
            <span>{t('settings.languageSettings', 'Language')}</span>
          </button>

          {canManageCenter && (
            <button
              onClick={() => setActiveTab('backup')}
              className={`
                flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === 'backup'
                    ? 'border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-300'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }
              `}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Xavfsizlik & Zaxira</span>
            </button>
          )}

          {canManageCenter && (
            <button
              onClick={() => setActiveTab('center')}
              className={`
                flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === 'center'
                    ? 'border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-300'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }
              `}
            >
              <Building2 className="w-4 h-4" />
              <span>{t('settings.centerSettings', 'Center Settings')}</span>
              {isOwner && (
                <Badge variant="purple" size="sm" className="ml-1">
                  {t('roles.owner', 'Owner')}
                </Badge>
              )}
            </button>
          )}
        </nav>
      </div>

      {/* TAB 1: PROFILE */}
      {activeTab === 'profile' && <ProfilePage targetUserId={queryUserId} />}

      {/* TAB 2: APPEARANCE */}
      {activeTab === 'appearance' && (
        <div className="space-y-6">
          <Card
            title={t('settings.themeSettings')}
            subtitle={t('common.theme')}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {[
                {
                  id: 'light',
                  label: t('common.lightMode'),
                  description: 'Clean bright layout with crisp EDUCO navy contrasts',
                  icon: Sun,
                },
                {
                  id: 'dark',
                  label: t('common.darkMode'),
                  description: 'Sleek dark theme gentle on the eyes in low light',
                  icon: Moon,
                },
                {
                  id: 'system',
                  label: t('common.systemMode'),
                  description: 'Matches your operating system color scheme preference',
                  icon: Laptop,
                },
              ].map((opt) => {
                const Icon = opt.icon;
                const isSelected = theme === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => setTheme(opt.id)}
                    className={`
                      p-5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between
                      ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 ring-2 ring-emerald-600 dark:ring-emerald-500'
                          : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark-secondary hover:border-gray-300 dark:hover:border-gray-700'
                      }
                    `}
                  >
                    <div>
                      <div className="p-2.5 rounded-lg bg-gray-100 dark:bg-surface-dark-tertiary w-fit text-emerald-600 dark:text-emerald-400 mb-3">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                        {opt.label}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {opt.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500">
                        {isSelected ? t('common.active') : t('common.view')}
                      </span>
                      {isSelected && <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: LANGUAGE */}
      {activeTab === 'language' && (
        <div className="space-y-6">
          <Card
            title={t('settings.languageSettings')}
            subtitle={t('common.language')}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {[
                { code: 'uz', name: "O'zbek tili", native: "O'zbekcha", flag: '🇺🇿' },
                { code: 'ru', name: 'Русский', native: 'Русский', flag: '🇷🇺' },
                { code: 'en', name: 'English', native: 'English (US)', flag: '🇺🇸' },
              ].map((lang) => {
                const isSelected = i18n.language === lang.code;
                return (
                  <div
                    key={lang.code}
                    onClick={() => handleLanguageSelect(lang.code)}
                    className={`
                      p-5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between
                      ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 ring-2 ring-emerald-600 dark:ring-emerald-500'
                          : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark-secondary hover:border-gray-300 dark:hover:border-gray-700'
                      }
                    `}
                  >
                    <div>
                      <div className="mb-3">
                        <LanguageFlag code={lang.code} className="w-8 h-5" />
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                        {lang.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-sans">
                        {lang.native} {lang.isRTL && '(RTL layout)'}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500">
                        {isSelected ? t('common.active') : t('common.edit')}
                      </span>
                      {isSelected && <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: CENTER SETTINGS (OWNER / ADMIN ONLY) */}
      {activeTab === 'center' && canManageCenter && (
        <Card
          title={t('settings.centerSettings')}
          subtitle={t('settings.settingsSubtitle')}
        >
          <form onSubmit={handleCenterSave} className="space-y-5 pt-2">
            {centerSuccess && (
              <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>{centerSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input
                  label={t('settings.centerName')}
                  value={centerConfig.center_name || ''}
                  onChange={(e) =>
                    setCenterConfig({ ...centerConfig, center_name: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Select
                  label={t('settings.timezone')}
                  options={[
                    { value: 'Asia/Tashkent', label: 'Asia/Tashkent (UTC+05:00)' },
                    { value: 'Asia/Samarkand', label: 'Asia/Samarkand (UTC+05:00)' },
                    { value: 'Asia/Dubai', label: 'Asia/Dubai (UTC+04:00)' },
                    { value: 'Europe/Moscow', label: 'Europe/Moscow (UTC+03:00)' },
                    { value: 'Europe/London', label: 'Europe/London (UTC+00:00)' },
                  ]}
                  value={centerConfig.timezone || 'Asia/Tashkent'}
                  onChange={(e) =>
                    setCenterConfig({ ...centerConfig, timezone: e.target.value })
                  }
                  color="blue"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input
                  type="number"
                  label={t('settings.autoMarkDeadline')}
                  value={centerConfig.attendance_deadline_hours || 24}
                  onChange={(e) =>
                    setCenterConfig({
                      ...centerConfig,
                      attendance_deadline_hours: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div>
                <Select
                  label={t('settings.defaultAbsenceType')}
                  options={[
                    { value: 'unexcused', label: t('attendance.unexcused') },
                    { value: 'excused', label: t('attendance.excused') },
                    { value: 'late', label: t('attendance.late') },
                  ]}
                  value={centerConfig.default_absence_type || 'unexcused'}
                  onChange={(e) =>
                    setCenterConfig({ ...centerConfig, default_absence_type: e.target.value })
                  }
                  color="amber"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input
                  type="number"
                  label={t('settings.chatRetention')}
                  value={centerConfig.chat_retention_days || 90}
                  onChange={(e) =>
                    setCenterConfig({
                      ...centerConfig,
                      chat_retention_days: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div>
                <Input
                  type="number"
                  label={t('settings.maxFileSize')}
                  value={centerConfig.max_file_size_mb || 25}
                  onChange={(e) =>
                    setCenterConfig({
                      ...centerConfig,
                      max_file_size_mb: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-100 dark:border-gray-800">
              <Button
                type="submit"
                variant="primary"
                icon={Save}
                isLoading={savingCenter}
              >
                {t('common.save')}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Tab: Database Safety & Backup */}
      {activeTab === 'backup' && canManageCenter && (
        <div className="space-y-6">
          {/* Status Protection Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0 shadow-inner">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">
                    Baza himoyasi: Doimiy faol
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    AVTOMATIK KAFOLAT
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                  Kodni yangilab Cloudflare Pages-ga yuklaganingizda (yoki build qilinganda) yaratilgan o‘quvchilar, guruhlar, kurslar va parollar <strong>hech qachon o‘chmaydi</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Card 1: Download JSON Backup */}
            <Card className="p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <Download className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  To‘liq zaxira nusxasini yuklab olish
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  O‘quv markazning barcha talabalari, o‘qituvchilari, guruhlari, davomat, baholar, eslatmalar va chat yozuvlarini 1 ta <strong>.json</strong> fayl ko‘rinishida kompyuteringizga yuklab olasiz.
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                <Button
                  variant="primary"
                  icon={Download}
                  onClick={handleExportBackup}
                  isLoading={isExportingBackup}
                  fullWidth
                >
                  📥 Zaxira nusxasini yuklab olish (.json)
                </Button>
              </div>
            </Card>

            {/* Card 2: Restore from Backup */}
            <Card className="p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Upload className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Zaxira faylidan qayta tiklash
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Avval yuklab olingan zaxira faylini tanlab, tizim ma’lumotlarini 2 bosqichli tasdiq bilan to‘liq qayta tiklashingiz mumkin.
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                <input
                  type="file"
                  ref={backupInputRef}
                  accept=".json,application/json"
                  onChange={handleFileSelectedForRestore}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  icon={Upload}
                  onClick={() => backupInputRef.current?.click()}
                  isLoading={isRestoringBackup}
                  fullWidth
                >
                  📤 Zaxira faylini yuklab tiklash (.json)
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
