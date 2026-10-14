import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import { useThemeStore } from '@/hooks/useTheme';
import { Button, Card, Badge, Input } from '@/components/ui';
import ProfilePage from './ProfilePage';
import { LanguageFlag } from '@/components/LanguageSelector';
import { getCenterSettings, updateCenterSettings } from '@/services/settingsService';

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();
  const { theme, setTheme } = useThemeStore();

  const isOwner = profile?.role === 'owner';
  const isAdmin = profile?.role === 'admin';
  const canManageCenter = isOwner || isAdmin;

  // Active Tab
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'appearance' | 'language' | 'center'

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
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
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
                  ? 'border-brand-navy text-brand-navy dark:border-blue-400 dark:text-blue-400'
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
                  ? 'border-brand-navy text-brand-navy dark:border-blue-400 dark:text-blue-400'
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
                  ? 'border-brand-navy text-brand-navy dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }
            `}
          >
            <Globe className="w-4 h-4" />
            <span>{t('settings.languageSettings', 'Language')}</span>
          </button>

          {canManageCenter && (
            <button
              onClick={() => setActiveTab('center')}
              className={`
                flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === 'center'
                    ? 'border-brand-navy text-brand-navy dark:border-blue-400 dark:text-blue-400'
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
      {activeTab === 'profile' && <ProfilePage />}

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
                          ? 'border-brand-navy bg-blue-50/50 dark:bg-blue-950/20 ring-2 ring-brand-navy dark:ring-blue-500'
                          : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark-secondary hover:border-gray-300 dark:hover:border-gray-700'
                      }
                    `}
                  >
                    <div>
                      <div className="p-2.5 rounded-lg bg-gray-100 dark:bg-surface-dark-tertiary w-fit text-brand-navy dark:text-blue-400 mb-3">
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
                      {isSelected && <CheckCircle className="w-4 h-4 text-brand-navy dark:text-blue-400" />}
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
                          ? 'border-brand-navy bg-blue-50/50 dark:bg-blue-950/20 ring-2 ring-brand-navy dark:ring-blue-500'
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
                      {isSelected && <CheckCircle className="w-4 h-4 text-brand-navy dark:text-blue-400" />}
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
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 block mb-1.5">
                  {t('settings.timezone')}
                </label>
                <select
                  value={centerConfig.timezone || 'Asia/Tashkent'}
                  onChange={(e) =>
                    setCenterConfig({ ...centerConfig, timezone: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary px-3.5 py-2 text-sm text-gray-900 dark:text-gray-100"
                >
                  <option value="Asia/Tashkent">Asia/Tashkent (UTC+05:00)</option>
                  <option value="Asia/Samarkand">Asia/Samarkand (UTC+05:00)</option>
                  <option value="Asia/Dubai">Asia/Dubai (UTC+04:00)</option>
                  <option value="Europe/Moscow">Europe/Moscow (UTC+03:00)</option>
                  <option value="Europe/London">Europe/London (UTC+00:00)</option>
                </select>
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
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 block mb-1.5">
                  {t('settings.defaultAbsenceType')}
                </label>
                <select
                  value={centerConfig.default_absence_type || 'unexcused'}
                  onChange={(e) =>
                    setCenterConfig({ ...centerConfig, default_absence_type: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary px-3.5 py-2 text-sm text-gray-900 dark:text-gray-100"
                >
                  <option value="unexcused">{t('attendance.unexcused')}</option>
                  <option value="excused">{t('attendance.excused')}</option>
                  <option value="late">{t('attendance.late')}</option>
                </select>
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
    </div>
  );
}
