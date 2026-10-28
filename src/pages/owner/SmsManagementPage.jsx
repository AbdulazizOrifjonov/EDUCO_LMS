import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Smartphone,
  Send,
  Clock,
  Settings2,
  ListOrdered,
  History,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Play,
  RotateCcw,
  Trash2,
  HelpCircle,
  ShieldCheck,
  Search,
  Filter,
  Plus,
  Sliders,
  Radio,
  Eye,
  EyeOff,
  Sparkles,
  PhoneCall,
  UserCheck,
  ArrowRight,
  Wifi,
  WifiOff,
  BatteryCharging,
  Info,
  Loader2,
  Users,
  Copy,
  ExternalLink,
  Phone,
  Check,
  UserX,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import TimePicker from '@/components/ui/TimePicker';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { toast } from '@/components/ui/Toast';
import { formatCurrency, formatDate } from '@/utils/csvExport';
import smsService, {
  getSmsSettings,
  updateSmsSettings,
  getSmsDevices,
  saveSmsDevice,
  pingDevice,
  sendTestSms,
  generateDebtorQueue,
  getProspectiveRecipients,
  getSmsQueue,
  getSmsLogs,
  processQueueBatch,
  retryQueueItem,
  cancelQueueItem,
  formatSmsMessage,
  normalizePhone,
  startSmsAutomationWorker,
} from '@/services/smsService';

export default function SmsManagementPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'devices' | 'queue' | 'logs'
  const [loading, setLoading] = useState(true);

  // Core Data
  const [settings, setSettings] = useState(null);
  const [devices, setDevices] = useState([]);
  const [queue, setQueue] = useState([]);
  const [logs, setLogs] = useState([]);

  // Prospective Recipients State (Live Debtor & Parent Roster)
  const [prospectiveRecipients, setProspectiveRecipients] = useState([]);
  const [recipientFilter, setRecipientFilter] = useState('debtors'); // 'debtors' | 'all' | 'paid' | 'excluded'
  const [recipientSearch, setRecipientSearch] = useState('');
  const [selectedPreviewStudentId, setSelectedPreviewStudentId] = useState(null);
  const [excludedStudentIds, setExcludedStudentIds] = useState(() => {
    try {
      const stored = localStorage.getItem('educo_sms_excluded_student_ids');
      return stored ? JSON.parse(stored) : [];
    } catch (_) {
      return [];
    }
  });
  const [copiedPhoneId, setCopiedPhoneId] = useState(null);
  const [copiedTextId, setCopiedTextId] = useState(null);
  const previewRef = useRef(null);

  // Queue Filters
  const [queueStatusFilter, setQueueStatusFilter] = useState('ALL');
  const [queueSearch, setQueueSearch] = useState('');

  // Modals
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Bu EDUCO LMS tizimidan sinov SMS xabari!');
  const [selectedTestDevice, setSelectedTestDevice] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  // Device Edit Modal
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [savingDevice, setSavingDevice] = useState(false);
  const [showToken, setShowToken] = useState(false);

  // Actions Progress
  const [generatingQueue, setGeneratingQueue] = useState(false);
  const [processingQueue, setProcessingQueue] = useState(false);
  const [queueProgress, setQueueProgress] = useState(null);
  const [pingingDeviceId, setPingingDeviceId] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [togglingSystem, setTogglingSystem] = useState(false);
  const [retryingId, setRetryingId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [refreshingQueue, setRefreshingQueue] = useState(false);

  // Synchronous execution locks to immediately block rapid double-clicks
  const isSendingTestRef = useRef(false);
  const isProcessingQueueRef = useRef(false);
  const isGeneratingQueueRef = useRef(false);
  const isRetryingIdRef = useRef(null);
  const isCancellingIdRef = useRef(null);
  const isPingingDeviceIdRef = useRef(null);
  const isSavingDeviceRef = useRef(false);
  const isSavingSettingsRef = useRef(false);
  const isTogglingSystemRef = useRef(false);

  // Template variables helper
  const templateVariables = [
    { tag: '{student_name}', label: 'Talaba ismi', example: 'Bobur Usmonov' },
    { tag: '{parent_name}', label: 'Ota-ona murojaati', example: 'Hurmatli ota' },
    { tag: '{course_name}', label: 'Kurs nomi', example: 'Frontend React' },
    { tag: '{amount}', label: 'Qarzdorlik summasi', example: '600,000 so‘m' },
    { tag: '{due_date}', label: 'Muddati', example: '25.10.2026' },
  ];

  // Load all SMS data
  const loadData = async () => {
    try {
      setLoading(true);
      const [st, devs, q, lg, recips] = await Promise.all([
        getSmsSettings(),
        getSmsDevices(),
        getSmsQueue(),
        getSmsLogs(100),
        getProspectiveRecipients({ excludedStudentIds }),
      ]);
      setSettings(st);
      setDevices(devs);
      setQueue(q);
      setLogs(lg);
      setProspectiveRecipients(recips || []);
      if (!selectedPreviewStudentId && recips && recips.length > 0) {
        const firstDebtor = recips.find((r) => r.isDebtor && !r.isExcluded);
        setSelectedPreviewStudentId(firstDebtor ? firstDebtor.studentId : recips[0].studentId);
      }
    } catch (err) {
      console.error('Error loading SMS management data:', err);
      toast.error('SMS tizimi ma‘lumotlarini yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  // Re-sync prospective recipients when settings or exclusions change
  useEffect(() => {
    let active = true;
    getProspectiveRecipients({ settingsOverride: settings, excludedStudentIds }).then((recips) => {
      if (active && recips) {
        setProspectiveRecipients(recips);
        if (!selectedPreviewStudentId && recips.length > 0) {
          const firstDebtor = recips.find((r) => r.isDebtor && !r.isExcluded);
          setSelectedPreviewStudentId(firstDebtor ? firstDebtor.studentId : recips[0].studentId);
        }
      }
    }).catch(() => {});
    return () => {
      active = false;
    };
  }, [settings?.message_template, settings?.target_recipient, excludedStudentIds]);

  useEffect(() => {
    loadData();
    const stopWorker = startSmsAutomationWorker({
      onScheduledTrigger: async ({ res }) => {
        toast.success(`Rejadagi SMS tarqatish bajarildi: ${res?.queuedCount || 0} ta qarzdor navbatga olindi`);
        const [updatedQueue, updatedLogs] = await Promise.all([getSmsQueue(), getSmsLogs(100)]);
        setQueue(updatedQueue);
        setLogs(updatedLogs);
      },
    });
    return () => stopWorker?.();
  }, []);

  // Filtered Queue
  const filteredQueue = useMemo(() => {
    let list = queue;
    if (queueStatusFilter !== 'ALL') {
      list = list.filter((q) => q.status === queueStatusFilter);
    }
    if (queueSearch.trim()) {
      const q = queueSearch.toLowerCase().trim();
      const rawDigits = q.replace(/\D/g, '');
      list = list.filter(
        (item) =>
          (item.recipient_name && item.recipient_name.toLowerCase().includes(q)) ||
          (item.recipient_phone && (item.recipient_phone.includes(q) || (rawDigits && item.recipient_phone.includes(rawDigits)))) ||
          (item.message_text && item.message_text.toLowerCase().includes(q))
      );
    }
    return list;
  }, [queue, queueStatusFilter, queueSearch]);

  // Statistics
  const stats = useMemo(() => {
    const pending = queue.filter((q) => q.status === 'pending').length;
    const sent = queue.filter((q) => q.status === 'sent').length;
    const failed = queue.filter((q) => q.status === 'failed').length;
    const processing = queue.filter((q) => q.status === 'processing').length;

    const primaryDevice = devices.find((d) => d.device_role === 'primary');
    const backupDevice = devices.find((d) => d.device_role === 'backup');

    return {
      pending,
      sent,
      failed,
      processing,
      total: queue.length,
      primaryOnline: primaryDevice?.status === 'online',
      backupOnline: backupDevice?.status === 'online',
      primaryDevice,
      backupDevice,
    };
  }, [queue, devices]);

  // Save Settings
  const handleSaveSettings = async (e) => {
    e?.preventDefault();
    if (isSavingSettingsRef.current || savingSettings) return;
    try {
      isSavingSettingsRef.current = true;
      setSavingSettings(true);
      const updated = await updateSmsSettings(settings);
      setSettings(updated);
      toast.success('SMS tizimi sozlamalari muvaffaqiyatli saqlandi!');
    } catch (err) {
      toast.error(`Xatolik: ${err.message}`);
    } finally {
      setSavingSettings(false);
      setTimeout(() => {
        isSavingSettingsRef.current = false;
      }, 1000);
    }
  };

  // Toggle Master System Enabled
  const handleToggleSystem = async () => {
    if (isTogglingSystemRef.current || togglingSystem) return;
    try {
      isTogglingSystemRef.current = true;
      setTogglingSystem(true);
      const nextState = !settings?.is_enabled;
      const updated = await updateSmsSettings({ ...settings, is_enabled: nextState });
      setSettings(updated);
      if (nextState) {
        toast.success('Avtomatlashtirilgan SMS tizimi FAOL holatga o‘tkazildi');
      } else {
        toast.info('Avtomatlashtirilgan SMS tizimi to‘xtatildi (O‘chirildi)');
      }
    } catch (err) {
      toast.error(`Xatolik: ${err.message}`);
    } finally {
      setTogglingSystem(false);
      setTimeout(() => {
        isTogglingSystemRef.current = false;
      }, 1000);
    }
  };

  // Ping Device
  const handlePingDevice = async (device) => {
    if (isPingingDeviceIdRef.current || pingingDeviceId) return;
    try {
      isPingingDeviceIdRef.current = device.id;
      setPingingDeviceId(device.id);
      const res = await pingDevice(device);
      if (res.success) {
        toast.success(`"${device.name}" onlayn va tayyor!`);
      } else {
        toast.warning(`"${device.name}" bilan aloqa yo‘q: ${res.error || 'Oflayn'}`);
      }
      const updatedDevices = await getSmsDevices();
      setDevices(updatedDevices);
    } catch (err) {
      toast.error(`Ping xatosi: ${err.message}`);
    } finally {
      setPingingDeviceId(null);
      setTimeout(() => {
        isPingingDeviceIdRef.current = null;
      }, 1000);
    }
  };

  // Open Edit Device
  const handleOpenEditDevice = (device) => {
    setEditingDevice({ ...device });
    setIsDeviceModalOpen(true);
  };

  // Save Device Form
  const handleSaveDevice = async (e) => {
    e.preventDefault();
    if (isSavingDeviceRef.current || savingDevice) return;
    try {
      isSavingDeviceRef.current = true;
      setSavingDevice(true);
      await saveSmsDevice(editingDevice);
      toast.success(`"${editingDevice.name}" qurilmasi muvaffaqiyatli saqlandi!`);
      setIsDeviceModalOpen(false);
      const updatedDevices = await getSmsDevices();
      setDevices(updatedDevices);
    } catch (err) {
      toast.error(`Qurilmani saqlashda xatolik: ${err.message}`);
    } finally {
      setSavingDevice(false);
      setTimeout(() => {
        isSavingDeviceRef.current = false;
      }, 1000);
    }
  };

  // Generate Debtor Queue
  const handleGenerateQueue = async () => {
    if (isGeneratingQueueRef.current || generatingQueue) return;
    try {
      isGeneratingQueueRef.current = true;
      setGeneratingQueue(true);
      const res = await generateDebtorQueue({ excludedStudentIds });
      toast.success(`Qarzdorlar tekshirildi: +${res.queuedCount} ta navbatda`);
      const [updatedQueue, updatedRecips] = await Promise.all([
        getSmsQueue(),
        getProspectiveRecipients({ settingsOverride: settings, excludedStudentIds }),
      ]);
      setQueue(updatedQueue);
      setProspectiveRecipients(updatedRecips || []);
      setActiveTab('queue');
    } catch (err) {
      toast.error(`Navbat shakllantirishda xatolik: ${err.message}`);
    } finally {
      setGeneratingQueue(false);
      setTimeout(() => {
        isGeneratingQueueRef.current = false;
      }, 1000);
    }
  };

  // Process Batch
  const handleProcessQueue = async () => {
    if (isProcessingQueueRef.current || processingQueue) return;
    try {
      isProcessingQueueRef.current = true;
      setProcessingQueue(true);
      const res = await processQueueBatch({
        limit: 500,
        onProgress: (p) => setQueueProgress(p),
      });
      if (res.inProgress) {
        toast.warning('Tarqatish jarayoni allaqachon bajarilmoqda');
        return;
      }
      toast.success(
        `SMS tarqatish yakunlandi! Yuborildi: ${res.sent} ta, Xatolik: ${res.failed} ta.`
      );
      const [updatedQueue, updatedLogs] = await Promise.all([getSmsQueue(), getSmsLogs(100)]);
      setQueue(updatedQueue);
      setLogs(updatedLogs);
    } catch (err) {
      toast.error(`Xatolik: ${err.message}`);
    } finally {
      setProcessingQueue(false);
      setQueueProgress(null);
      setTimeout(() => {
        isProcessingQueueRef.current = false;
      }, 1200);
    }
  };

  // Retry Item
  const handleRetryItem = async (id) => {
    if (isRetryingIdRef.current || retryingId) return;
    try {
      isRetryingIdRef.current = id;
      setRetryingId(id);
      await retryQueueItem(id);
      toast.success('Xabar qayta urinish navbatiga qo‘yildi');
      const updatedQueue = await getSmsQueue();
      setQueue(updatedQueue);
    } catch (err) {
      toast.error(`Xatolik: ${err.message}`);
    } finally {
      setRetryingId(null);
      setTimeout(() => {
        isRetryingIdRef.current = null;
      }, 1000);
    }
  };

  // Cancel Item
  const handleCancelItem = async (id) => {
    if (isCancellingIdRef.current || cancellingId) return;
    try {
      isCancellingIdRef.current = id;
      setCancellingId(id);
      await cancelQueueItem(id);
      toast.info('SMS navbatdan bekor qilindi');
      const updatedQueue = await getSmsQueue();
      setQueue(updatedQueue);
    } catch (err) {
      toast.error(`Xatolik: ${err.message}`);
    } finally {
      setCancellingId(null);
      setTimeout(() => {
        isCancellingIdRef.current = null;
      }, 1000);
    }
  };

  // Refresh data with toast feedback
  const handleRefreshData = async () => {
    if (refreshingQueue) return;
    try {
      setRefreshingQueue(true);
      await loadData();
      toast.success('SMS ma’lumotlari yangilandi!');
    } catch (err) {
      toast.error(`Xatolik: ${err.message}`);
    } finally {
      setRefreshingQueue(false);
    }
  };

  // Send Test SMS
  const handleSendTestSms = async (e) => {
    e?.preventDefault?.();
    if (isSendingTestRef.current || sendingTest) {
      console.warn('[SmsManagement] Test SMS allaqachon yuborilmoqda, takroriy bosish bloklandi.');
      return;
    }

    const cleanPhone = (testPhone || '').trim();
    if (!cleanPhone || cleanPhone.replace(/\D/g, '').length < 9) {
      toast.error('Test telefon raqamini to‘liq kiriting (+998...)');
      return;
    }
    if (!testMessage.trim()) {
      toast.error('Test xabari matnini kiriting');
      return;
    }

    try {
      isSendingTestRef.current = true;
      setSendingTest(true);
      const res = await sendTestSms({
        phone: cleanPhone,
        message: testMessage.trim(),
        deviceId: selectedTestDevice || undefined,
      });

      if (res?.deduplicated) {
        toast.info('Bu xabar yaqinda yuborilgan (dublikatsiya oldi olindi)');
      } else if (res?.simulated || res?.result?.simulated) {
        toast.success(`Test SMS muvaffaqiyatli jo‘natildi! (${res.device?.name || 'SMS Gateway'})`);
      } else {
        toast.success('Test SMS muvaffaqiyatli jo‘natildi!');
      }
      setIsTestModalOpen(false);
      const updatedLogs = await getSmsLogs(100);
      setLogs(updatedLogs);
    } catch (err) {
      toast.error(`Test SMS yuborilmadi: ${err.message}`);
    } finally {
      setSendingTest(false);
      setTimeout(() => {
        isSendingTestRef.current = false;
      }, 300);
    }
  };

  // Insert tag into template textarea
  const handleInsertTag = (tag) => {
    if (!settings) return;
    const current = settings.message_template || '';
    setSettings({
      ...settings,
      message_template: `${current} ${tag}`,
    });
  };

  // Active student/recipient for the live Phone Preview
  const activePreviewRecipient = useMemo(() => {
    if (!prospectiveRecipients || prospectiveRecipients.length === 0) return null;
    return (
      prospectiveRecipients.find((r) => r.studentId === selectedPreviewStudentId) ||
      prospectiveRecipients.find((r) => r.isDebtor && !r.isExcluded) ||
      prospectiveRecipients[0]
    );
  }, [prospectiveRecipients, selectedPreviewStudentId]);

  // Live preview message dynamically reflects the selected student
  const livePreviewText = useMemo(() => {
    if (!settings?.message_template) return '';
    if (activePreviewRecipient?.messageText) {
      return activePreviewRecipient.messageText;
    }
    return formatSmsMessage(settings.message_template, {
      student_name: activePreviewRecipient?.studentName || 'Jasur Rustamov',
      parent_name: activePreviewRecipient?.parentSalutation || 'Hurmatli ota',
      course_name: activePreviewRecipient?.courseName || 'Frontend React & JavaScript',
      amount: activePreviewRecipient?.balance || 280000,
      due_date: formatDate(new Date()),
    });
  }, [settings?.message_template, activePreviewRecipient]);

  // Filtered prospective recipients for Tab 1 table
  const filteredProspectiveRecipients = useMemo(() => {
    let list = prospectiveRecipients;
    if (recipientFilter === 'debtors') {
      list = list.filter((r) => r.isDebtor && !r.isExcluded);
    } else if (recipientFilter === 'paid') {
      list = list.filter((r) => !r.isDebtor && !r.isExcluded);
    } else if (recipientFilter === 'excluded') {
      list = list.filter((r) => r.isExcluded);
    }
    if (recipientSearch.trim()) {
      const q = recipientSearch.toLowerCase().trim();
      const rawDigits = q.replace(/\D/g, '');
      list = list.filter(
        (r) =>
          (r.studentName && r.studentName.toLowerCase().includes(q)) ||
          (r.courseName && r.courseName.toLowerCase().includes(q)) ||
          (r.groupName && r.groupName.toLowerCase().includes(q)) ||
          (r.targetPhone && (r.targetPhone.includes(q) || (rawDigits && r.targetPhone.includes(rawDigits)))) ||
          (r.recipientLabel && r.recipientLabel.toLowerCase().includes(q)) ||
          (r.messageText && r.messageText.toLowerCase().includes(q))
      );
    }
    return list;
  }, [prospectiveRecipients, recipientFilter, recipientSearch]);

  // Summary counts for prospective recipients
  const prospectiveStats = useMemo(() => {
    const total = prospectiveRecipients.length;
    const debtors = prospectiveRecipients.filter((r) => r.isDebtor && !r.isExcluded);
    const paid = prospectiveRecipients.filter((r) => !r.isDebtor && !r.isExcluded);
    const excluded = prospectiveRecipients.filter((r) => r.isExcluded);
    const totalDebt = debtors.reduce((sum, r) => sum + r.balance, 0);
    return {
      total,
      debtorsCount: debtors.length,
      paidCount: paid.length,
      excludedCount: excluded.length,
      totalDebt,
    };
  }, [prospectiveRecipients]);

  // Toggle exclusion of student from automated SMS
  const handleToggleExclude = (studentId, studentName) => {
    setExcludedStudentIds((prev) => {
      const isAlready = prev.includes(studentId);
      const next = isAlready ? prev.filter((id) => id !== studentId) : [...prev, studentId];
      try {
        localStorage.setItem('educo_sms_excluded_student_ids', JSON.stringify(next));
      } catch (_) {}
      if (isAlready) {
        toast.success(`"${studentName}" SMS ro‘yxatiga qaytarildi!`);
      } else {
        toast.info(`"${studentName}" SMS eslatmalaridan chetlatildi (SMS bormaydi).`);
      }
      return next;
    });
  };

  // Open Test SMS prefilled for specific recipient
  const handleOpenRecipientTestSms = (recipient) => {
    if (!recipient.targetPhone) {
      toast.error(`"${recipient.studentName}" uchun qabul qiluvchi telefon raqami topilmadi!`);
      return;
    }
    setTestPhone(recipient.targetPhone);
    setTestMessage(recipient.messageText);
    const primary = devices.find((d) => d.device_role === 'primary') || devices[0];
    if (primary) setSelectedTestDevice(primary.id);
    setIsTestModalOpen(true);
  };

  // Switch phone preview to specific recipient and scroll
  const handleViewInPhone = (studentId, studentName) => {
    setSelectedPreviewStudentId(studentId);
    if (previewRef.current) {
      previewRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    toast.info(`"${studentName}" ota-onasi ko‘rinishi telefonda ochildi`);
  };

  const handleCopyPhone = (id, phone) => {
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedPhoneId(id);
    toast.success(`Nusxalandi: ${phone}`);
    setTimeout(() => setCopiedPhoneId(null), 1500);
  };

  const handleCopyText = (id, text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedTextId(id);
    toast.success('SMS matni nusxalandi');
    setTimeout(() => setCopiedTextId(null), 1500);
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in pb-12">
      {/* Page Header Banner */}
      <div className="bg-white dark:bg-surface-dark-secondary p-3.5 sm:p-5 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs space-y-3.5 sm:space-y-4">
        {/* Top Row: Icon, Titles, Shield Badge, and Master Status Switch */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-blue-600 dark:bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-blue-600/30 dark:shadow-emerald-600/30 shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-xl lg:text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight leading-snug">
                  SMS Eslatmalar Tizimi
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300/60 inline-flex items-center gap-1 shrink-0">
                  <ShieldCheck className="w-3 h-3" />
                  Faqat Boshliq
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">
                2 ta Android SIM-karta orqali qarzdorlarga avtomatik to‘lov eslatmalari
              </p>
            </div>
          </div>

          {/* Master Toggle Pill Button */}
          <button
            type="button"
            disabled={togglingSystem}
            onClick={handleToggleSystem}
            className={`self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer shrink-0 disabled:opacity-60 disabled:cursor-not-allowed ${
              settings?.is_enabled
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25 ring-2 ring-emerald-400/40'
                : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300/70 dark:border-gray-700'
            }`}
          >
            {togglingSystem ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <span className={`w-2.5 h-2.5 rounded-full ${settings?.is_enabled ? 'bg-white animate-pulse' : 'bg-gray-400'}`} />
            )}
            <span>{settings?.is_enabled ? 'Tizim: FAOL (Yoqilgan)' : 'Tizim: TO‘XTATILGAN'}</span>
          </button>
        </div>

        {/* Action Buttons Row */}
        <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-800/80">
          <Button
            variant="outline"
            size="md"
            icon={Send}
            disabled={generatingQueue || togglingSystem}
            onClick={() => setIsTestModalOpen(true)}
            className="cursor-pointer font-bold justify-center text-xs sm:text-sm w-full sm:w-auto"
          >
            Test SMS
          </Button>

          <Button
            variant="primary"
            size="md"
            icon={RefreshCw}
            isLoading={generatingQueue}
            disabled={generatingQueue || togglingSystem}
            onClick={handleGenerateQueue}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white shadow-sm font-bold cursor-pointer justify-center text-xs sm:text-sm w-full sm:w-auto"
          >
            {generatingQueue
              ? 'Tekshirilmoqda...'
              : prospectiveStats.debtorsCount > 0
              ? `Qarzdorlarni tekshirish (${prospectiveStats.debtorsCount})`
              : 'Qarzdorlarni tekshirish'}
          </Button>
        </div>
      </div>

      {/* Live Metrics Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Pending */}
        <Card noPadding className="hover:shadow-card-hover transition-all">
          <div className="p-3.5 sm:p-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                  {stats.pending > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                  {stats.pending > 0 ? 'Navbatda' : 'Rejada'}
                </span>
              </div>
              <span className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-amber-600 dark:text-amber-400 block">
                {stats.pending > 0 ? `${stats.pending} ta` : `${prospectiveStats.debtorsCount} ta`}
              </span>
              <h4 className="text-[11px] sm:text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide mt-1">
                {stats.pending > 0 ? 'Navbatdagi xabarlar' : 'Rejadagi Qarzdorlar'}
              </h4>
            </div>
            <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 mt-2 line-clamp-1 border-t border-gray-100 dark:border-gray-800/80 pt-2">
              {stats.pending > 0
                ? 'Reja bo‘yicha yuborilishi kutilmoqda'
                : `Bugungi ro‘yxatda ${prospectiveStats.debtorsCount} ta qarzdorga SMS rejalashtirilgan`}
            </p>
          </div>
        </Card>

        {/* Metric 2: Sent */}
        <Card noPadding className="hover:shadow-card-hover transition-all">
          <div className="p-3.5 sm:p-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Yetkazildi
                </span>
              </div>
              <span className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400 block">
                {stats.sent} ta
              </span>
              <h4 className="text-[11px] sm:text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide mt-1">
                Muvaffaqiyatli ketgan
              </h4>
            </div>
            <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 mt-2 line-clamp-1 border-t border-gray-100 dark:border-gray-800/80 pt-2">
              SIM-karta orqali yetkazildi
            </p>
          </div>
        </Card>

        {/* Metric 3: Failed */}
        <Card noPadding className="hover:shadow-card-hover transition-all">
          <div className="p-3.5 sm:p-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className={`inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full ${stats.failed > 0 ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                  {stats.failed > 0 && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                  {stats.failed > 0 ? 'Xatolik' : 'Xatosiz'}
                </span>
              </div>
              <span className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-rose-600 dark:text-rose-400 block">
                {stats.failed} ta
              </span>
              <h4 className="text-[11px] sm:text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide mt-1">
                Yetib bormagan (Xato)
              </h4>
            </div>
            <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 mt-2 line-clamp-1 border-t border-gray-100 dark:border-gray-800/80 pt-2">
              Telefon o‘chiq yoki xato raqam
            </p>
          </div>
        </Card>

        {/* Metric 4: Dual-Phone Gateways */}
        <Card noPadding className="hover:shadow-card-hover transition-all">
          <div className="p-3.5 sm:p-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Radio className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className={`inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full ${stats.primaryOnline ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${stats.primaryOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                  {stats.primaryOnline ? 'Faol' : 'Nofaol'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${stats.primaryOnline ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                  <span className={`w-1 h-1 rounded-full ${stats.primaryOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                  Asosiy: {stats.primaryOnline ? 'Onlayn' : 'Oflayn'}
                </span>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${stats.backupOnline ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                  <span className={`w-1 h-1 rounded-full ${stats.backupOnline ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                  Zaxira: {stats.backupOnline ? 'Onlayn' : 'Oflayn'}
                </span>
              </div>
              <h4 className="text-[11px] sm:text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide mt-2">
                Gateway holati
              </h4>
            </div>
            <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 mt-2 line-clamp-1 border-t border-gray-100 dark:border-gray-800/80 pt-2">
              Avtomatik failover bilan
            </p>
          </div>
        </Card>
      </div>

      {/* Progress Bar when Queue Processing */}
      {processingQueue && queueProgress && (
        <Card className="p-4 border-2 border-blue-500/40 bg-blue-50/40 dark:bg-surface-dark-secondary animate-pulse">
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <span className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              SMS tarqatilmoqda ({queueProgress.current} / {queueProgress.total}): {queueProgress.item?.recipient_phone}
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              Qurilma: {queueProgress.device || 'Android Gateway'}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-blue-600 dark:bg-emerald-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.round((queueProgress.current / queueProgress.total) * 100)}%` }}
            />
          </div>
        </Card>
      )}

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-2.5 border-b border-gray-200 dark:border-gray-800 pb-3.5 mb-6 sm:mb-8 overflow-x-auto no-scrollbar flex-nowrap scroll-smooth">
        {[
          { key: 'overview', label: 'Sozlamalar va Avtomatlashtirish', icon: Sliders },
          { key: 'devices', label: 'Dual Gateway Qurilmalar', icon: Smartphone, badge: devices.length },
          { key: 'queue', label: 'SMS Navbati & Qarzdorlar', icon: ListOrdered, badge: stats.pending },
          { key: 'logs', label: 'Yuborish Tarixi & Jurnali', icon: History, badge: logs.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 dark:bg-emerald-600 text-white shadow-md shadow-blue-600/30 dark:shadow-emerald-600/30 ring-2 ring-blue-400/40 dark:ring-emerald-400/40'
                  : 'bg-white dark:bg-surface-dark-secondary text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-surface-dark-tertiary border border-gray-200/80 dark:border-gray-700/60'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                    isActive ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SETTINGS & AUTOMATION                                              */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && settings && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Left Form: Automation Rules */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-6">
            <Card className="p-3.5 sm:p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
                <Clock className="w-5 h-5 text-blue-600 dark:text-emerald-400" />
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base">
                  Avtomatlashtirish Qoidalari va Vaqtlari
                </h3>
              </div>

              {/* Schedule Days */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Oyning qaysi kunlarida yuborilsin:
                  </label>
                  <span className="text-xs text-blue-600 dark:text-emerald-400 font-bold lowercase">
                    tanlangan: {(settings.schedule_days || []).join(', ') || 'hech qaysi'} - sanalar
                  </span>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date().getDate();
                      const current = settings.schedule_days || [];
                      const updated = current.includes(today) ? current : [...current, today].sort((a, b) => a - b);
                      setSettings({ ...settings, schedule_days: updated });
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      (settings.schedule_days || []).includes(new Date().getDate())
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/60'
                    }`}
                  >
                    Bugun ({new Date().getDate()}-sana)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSettings({ ...settings, schedule_days: [1, 5, 10, 15, 20, 25] });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold cursor-pointer"
                  >
                    Standart (1, 5, 10, 15, 20, 25)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSettings({ ...settings, schedule_days: Array.from({ length: 31 }, (_, i) => i + 1) });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold cursor-pointer"
                  >
                    Har kuni (1-31)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSettings({ ...settings, schedule_days: [] });
                    }}
                    className="px-2 py-1 rounded-lg text-gray-400 hover:text-rose-500 font-semibold cursor-pointer ml-auto"
                  >
                    Tozalash
                  </button>
                </div>

                {/* Day Buttons 1 through 31 */}
                <div className="grid grid-cols-7 sm:grid-cols-11 gap-1.5 p-2 bg-gray-50 dark:bg-surface-dark-tertiary rounded-xl border border-gray-200 dark:border-gray-700">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                    const isSelected = (settings.schedule_days || []).includes(day);
                    const isToday = day === new Date().getDate();
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          const current = settings.schedule_days || [];
                          const updated = isSelected ? current.filter((d) => d !== day) : [...current, day].sort((a, b) => a - b);
                          setSettings({ ...settings, schedule_days: updated });
                        }}
                        className={`h-8 sm:h-9 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center relative ${
                          isSelected
                            ? 'bg-blue-600 dark:bg-emerald-600 text-white shadow-xs font-black'
                            : 'bg-white dark:bg-surface-dark-secondary hover:bg-gray-100 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                        }`}
                        title={isToday ? `${day}-sana (Bugun)` : `${day}-sana`}
                      >
                        <span>{day}</span>
                        {isToday && (
                          <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${isSelected ? 'bg-amber-300' : 'bg-emerald-500'} ring-1 ring-white dark:ring-gray-900`} />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 pt-1">
                  <span>Faqat qarzdorligi bor o‘quvchilar tekshiriladi (to‘langanlarga SMS bormaydi).</span>
                  {(settings.schedule_days || []).includes(new Date().getDate()) && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Bugungi sana tanlangan
                    </span>
                  )}
                </div>
              </div>

              {/* Schedule Time & Target Recipient */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <TimePicker
                    label="Kunlik yuborish vaqti (Toshkent vaqti)"
                    value={settings.schedule_time || '10:00'}
                    onChange={(newTime) => setSettings({ ...settings, schedule_time: newTime })}
                  />
                </div>

                <div>
                  <Select
                    label="Qabul qiluvchi ustuvorligi"
                    value={settings.target_recipient || 'father_first'}
                    onChange={(e) => setSettings({ ...settings, target_recipient: e.target.value })}
                    headerTitle="Qabul qiluvchi ustuvorligi"
                    options={[
                      {
                        value: 'father_first',
                        label: '1. Otasiga (bo‘lmasa Onasiga, keyin Talabaga)',
                        subtitle: 'Dastlab otasining telefoniga SMS yuboriladi',
                      },
                      {
                        value: 'mother_first',
                        label: '1. Onasiga (bo‘lmasa Otasiga, keyin Talabaga)',
                        subtitle: 'Dastlab onasining telefoniga SMS yuboriladi',
                      },
                      {
                        value: 'student',
                        label: 'To‘g‘ridan-to‘g‘ri Talabaning o‘ziga',
                        subtitle: 'Faqat talabaning o‘z telefon raqamiga yuboriladi',
                      },
                    ]}
                  />
                </div>
              </div>

              {/* Limits and Intervals */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    SMS lar oralig‘i (soniya)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={settings.send_interval_seconds || 4}
                    onChange={(e) => setSettings({ ...settings, send_interval_seconds: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-surface-dark-tertiary text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-gray-400">Spam blokdan saqlash</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Maksimal qayta urinish
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={settings.max_retries || 3}
                    onChange={(e) => setSettings({ ...settings, max_retries: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-surface-dark-tertiary text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-gray-400">Xatolik bo‘lsa necha marta</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Takrorlanish chegarasi (kun)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={settings.anti_duplicate_days || 15}
                    onChange={(e) => setSettings({ ...settings, anti_duplicate_days: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-surface-dark-tertiary text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-gray-400">Bir xil o‘quvchiga qaytmaslik</span>
                </div>
              </div>
            </Card>

            {/* Template Editor */}
            <Card className="p-3.5 sm:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                <div className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-blue-600 dark:text-emerald-400" />
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base">
                    SMS Xabari Shabloni
                  </h3>
                </div>
                <span className="text-xs text-gray-400">
                  Uzunlik: {(settings.message_template || '').length} belgi
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                  Dinamik o‘zgaruvchilar (Bosing, matnga qo‘shiladi):
                </label>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {templateVariables.map((v) => (
                    <button
                      key={v.tag}
                      type="button"
                      onClick={() => handleInsertTag(v.tag)}
                      className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-blue-50 hover:bg-blue-100 dark:bg-surface-dark-tertiary dark:hover:bg-gray-700 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-gray-600 transition-colors cursor-pointer"
                    >
                      + {v.tag}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={4}
                  value={settings.message_template || ''}
                  onChange={(e) => setSettings({ ...settings, message_template: e.target.value })}
                  placeholder="SMS matnini kiriting..."
                  className="w-full p-3 sm:p-3.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-surface-dark-tertiary text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-emerald-500 leading-relaxed font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="primary"
                  size="md"
                  icon={CheckCircle2}
                  isLoading={savingSettings}
                  disabled={savingSettings}
                  onClick={handleSaveSettings}
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold px-6 cursor-pointer w-full sm:w-auto justify-center"
                >
                  Barcha sozlamalarni saqlash
                </Button>
              </div>
            </Card>
          </div>

          {/* Right Column: Live SMS Preview & System Status */}
          <div className="lg:col-span-5 space-y-4 sm:space-y-6">
            {/* Live Smartphone Preview */}
            <Card ref={previewRef} className="p-3.5 sm:p-5 bg-gradient-to-br from-gray-50 to-blue-50/20 dark:from-surface-dark-secondary dark:to-[#0f2420]/30 border-blue-500/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-blue-600 dark:text-emerald-400" />
                  <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                    Ota-ona telefonida ko‘rinishi (Jonli Preview)
                  </h4>
                </div>
                <span className="text-[10px] uppercase font-mono font-bold bg-blue-100 dark:bg-emerald-950/60 text-blue-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                  SMS Preview
                </span>
              </div>

              {/* Recipient Switcher for Preview */}
              <div className="mb-3.5 p-2.5 bg-white dark:bg-surface-dark-tertiary rounded-xl border border-gray-200 dark:border-gray-700/80 shadow-2xs">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-600 dark:text-emerald-400" />
                    Ko‘rib chiqilayotgan qabul qiluvchi:
                  </label>
                  {activePreviewRecipient?.isDebtor ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                      Qarzdor ({formatCurrency(activePreviewRecipient.balance)})
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                      To‘langan (0 so‘m)
                    </span>
                  )}
                </div>
                <select
                  value={selectedPreviewStudentId || activePreviewRecipient?.studentId || ''}
                  onChange={(e) => setSelectedPreviewStudentId(e.target.value)}
                  className="w-full text-xs font-semibold py-2 px-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-surface-dark-secondary text-gray-900 dark:text-gray-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {prospectiveRecipients.map((r) => (
                    <option key={r.studentId} value={r.studentId}>
                      {r.studentName} — {r.isDebtor ? `Qarz: ${formatCurrency(r.balance)}` : 'To‘langan'} • {r.recipientLabel}: {r.targetPhone || 'Raqam yo‘q'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mock Smartphone Screen */}
              <div className="w-full max-w-sm mx-auto bg-gray-900 rounded-3xl p-3 shadow-2xl border-4 border-gray-800">
                {/* Phone Speaker & Camera Notch */}
                <div className="w-24 h-4 bg-gray-800 rounded-full mx-auto mb-3" />

                {/* SMS Chat Screen */}
                <div className="bg-white dark:bg-gray-950 rounded-2xl p-4 min-h-[220px] flex flex-col justify-between">
                  {/* SMS Header */}
                  <div className="text-center border-b border-gray-100 dark:border-gray-800 pb-2 mb-3">
                    <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center mx-auto mb-1">
                      ED
                    </div>
                    <span className="font-bold text-xs text-gray-900 dark:text-white block">EDUCO</span>
                    <span className="text-[10px] text-gray-400 font-mono block">
                      Bugun {settings.schedule_time || '10:00'}
                    </span>
                    {activePreviewRecipient && (
                      <span className="text-[10px] text-blue-600 dark:text-emerald-400 font-bold block mt-0.5">
                        {activePreviewRecipient.recipientLabel}: {activePreviewRecipient.targetPhone || 'Telefon yo‘q'}
                      </span>
                    )}
                  </div>

                  {/* SMS Bubble */}
                  <div className="bg-blue-600 text-white p-3.5 rounded-2xl rounded-tl-xs text-xs font-medium leading-relaxed shadow-sm">
                    {livePreviewText || 'SMS matnini kiriting...'}
                  </div>

                  <div className="text-[10px] text-right text-gray-400 mt-2 font-mono">
                    ✓ Yetkazildi • SIM 1 (Samsung)
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick Actions Guide Card */}
            <Card className="p-3.5 sm:p-4 space-y-2.5 bg-amber-50/40 dark:bg-amber-950/15 border-amber-300/60 dark:border-amber-800/60">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <h4 className="font-bold text-amber-950 dark:text-amber-200">
                    Avtomatlashtirish qanday ishlaydi?
                  </h4>
                  <p className="text-amber-900/80 dark:text-amber-300/80 leading-relaxed">
                    1. Rejalashtirilgan vaqtda server qarzdorlik hisobini tekshiradi.<br />
                    2. Faqat to‘lovi o‘tgan talabalarga xabar navbati yaratiladi.<br />
                    3. Avval <strong>Asosiy telefon</strong> orqali yuboriladi, agar u oflayn bo‘lsa, zudlik bilan <strong>Zaxira telefon</strong>ga o‘tadi.<br />
                    4. Operator bloklamasligi uchun har bir SMS oralig‘ida {settings.send_interval_seconds || 4} soniya tanaffus qilinadi.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* ========================================================================= */}
          {/* FULL WIDTH: SMS JO'NATILADIGAN QABUL QILUVCHILAR RO'YXATI                */}
          {/* ========================================================================= */}
          <div className="lg:col-span-12 space-y-4">
            <Card className="p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200/90 dark:border-gray-800">
              {/* Header */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-600/10 dark:bg-emerald-500/15 text-blue-600 dark:text-emerald-400 flex items-center justify-center shadow-xs shrink-0">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base sm:text-lg">
                        SMS Jo‘natiladigan Qabul Qiluvchilar Ro‘yxati
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                        {prospectiveStats.debtorsCount} ta qarzdorga SMS boradi
                      </span>
                      {prospectiveStats.totalDebt > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          Jami qarz: {formatCurrency(prospectiveStats.totalDebt)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Belgilangan qoidalar ({settings.schedule_time || '10:00'}, ustuvorlik: {settings.target_recipient === 'father_first' ? 'Otasiga' : settings.target_recipient === 'mother_first' ? 'Onasiga' : 'Talabaga'}) bo‘yicha SMS boradigan ota-onalar va talabalar.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={RefreshCw}
                    onClick={loadData}
                    className="!h-10 !min-h-[40px] px-3.5 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Yangilash
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Play}
                    isLoading={generatingQueue}
                    disabled={generatingQueue || prospectiveStats.debtorsCount === 0}
                    onClick={handleGenerateQueue}
                    className="!h-10 !min-h-[40px] px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-sm"
                  >
                    {generatingQueue
                      ? 'Navbatga olinmoqda...'
                      : `Qarzdorlarni navbatga olish (${prospectiveStats.debtorsCount})`}
                  </Button>
                </div>
              </div>

              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3">
                <div className="relative w-full sm:w-72 md:w-80 shrink-0 h-10 flex items-center">
                  <Input
                    icon={Search}
                    size="sm"
                    className="!gap-0 !h-10 w-full"
                    inputClassName="!h-10 text-xs rounded-xl"
                    placeholder="Qidirish (ism, telefon, kurs, matn)..."
                    value={recipientSearch}
                    onChange={(e) => setRecipientSearch(e.target.value)}
                  />
                </div>

                {/* Filter Pills */}
                <div className="inline-flex items-center rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/90 dark:bg-surface-dark-secondary text-xs h-10 min-h-[40px] p-0 overflow-hidden divide-x divide-gray-200 dark:divide-gray-700 shrink-0 shadow-2xs overflow-x-auto no-scrollbar">
                  {[
                    { key: 'debtors', label: 'SMS boradiganlar', count: prospectiveStats.debtorsCount },
                    { key: 'all', label: 'Barchasi', count: prospectiveStats.total },
                    { key: 'paid', label: 'To‘langanlar', count: prospectiveStats.paidCount },
                    { key: 'excluded', label: 'Chetlatilganlar', count: prospectiveStats.excludedCount },
                  ].map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setRecipientFilter(f.key)}
                      className={`h-full min-h-[40px] flex items-center justify-center gap-1.5 px-3.5 sm:px-4 font-bold transition-all cursor-pointer whitespace-nowrap text-xs ${
                        recipientFilter === f.key
                          ? 'bg-blue-600 dark:bg-emerald-600 text-white font-black shadow-xs'
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <span>{f.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                          recipientFilter === f.key
                            ? 'bg-white/20 text-white'
                            : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {f.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipients Table (Desktop View - Fully Responsive with 0 Horizontal Scroll) */}
              <div className="hidden md:block w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700/80 mt-3">
                <table className="w-full table-fixed text-left border-collapse text-xs">
                  <colgroup>
                    <col className="w-[22%]" />
                    <col className="w-[19%]" />
                    <col className="w-[13%]" />
                    <col className="w-[23%]" />
                    <col className="w-[11%]" />
                    <col className="w-[12%]" />
                  </colgroup>
                  <thead>
                    <tr className="bg-gray-50/90 dark:bg-surface-dark-tertiary border-b border-gray-200 dark:border-gray-700/80 text-gray-500 uppercase font-bold text-[10px] xl:text-[11px] tracking-wider">
                      <th className="py-3 pl-4 pr-2">Talaba (O‘quvchi)</th>
                      <th className="py-3 px-2">SMS Shaxs & Telefon</th>
                      <th className="py-3 px-2">Moliyaviy Holat</th>
                      <th className="py-3 px-2">SMS Matni</th>
                      <th className="py-3 px-1 text-center">Holati</th>
                      <th className="py-3 pr-4 pl-1 text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredProspectiveRecipients.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-gray-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Users className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                            <span className="font-medium text-sm text-gray-600 dark:text-gray-300">
                              Ushbu filtr bo‘yicha qabul qiluvchilar topilmadi
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredProspectiveRecipients.map((item) => {
                        const isSelectedInPreview = selectedPreviewStudentId === item.studentId;
                        return (
                          <tr
                            key={item.studentId}
                            className={`transition-colors ${
                              isSelectedInPreview
                                ? 'bg-blue-50/60 dark:bg-emerald-950/20'
                                : 'hover:bg-gray-50/70 dark:hover:bg-surface-dark-tertiary/40'
                            }`}
                          >
                            {/* Student Info */}
                            <td className="py-3 pl-4 pr-2 overflow-hidden">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 dark:from-emerald-600 dark:to-teal-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                  {item.studentName.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-gray-900 dark:text-gray-100 truncate text-xs" title={item.studentName}>
                                    {item.studentName}
                                  </div>
                                  <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate" title={`${item.courseName} • ${item.groupName}`}>
                                    {item.courseName} • <span className="font-semibold text-gray-600 dark:text-gray-300">{item.groupName}</span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Recipient Role & Phone */}
                            <td className="py-3 px-2 overflow-hidden">
                              <div className="min-w-0 space-y-0.5">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shrink-0 ${
                                      item.recipientType === 'father'
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                        : item.recipientType === 'mother'
                                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                        : 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                                    }`}
                                  >
                                    {item.recipientLabel}
                                  </span>
                                  {item.targetPhone ? (
                                    <div className="inline-flex items-center gap-1 font-mono font-bold text-gray-900 dark:text-gray-100 text-xs min-w-0">
                                      <span className="truncate">{item.targetPhone}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleCopyPhone(item.studentId, item.targetPhone)}
                                        className="text-gray-400 hover:text-blue-600 dark:hover:text-emerald-400 transition-colors p-0.5 shrink-0 cursor-pointer"
                                        title="Raqamni nusxalash"
                                      >
                                        {copiedPhoneId === item.studentId ? (
                                          <Check className="w-3 h-3 text-emerald-600" />
                                        ) : (
                                          <Copy className="w-3 h-3" />
                                        )}
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 truncate">
                                      ⚠️ Tel yo‘q
                                    </span>
                                  )}
                                </div>
                                <div className="text-[9px] text-gray-400 truncate" title={`Ota: ${item.fatherPhone || '-'} | Ona: ${item.motherPhone || '-'}`}>
                                  {item.fatherPhone && <span>Ota: {item.fatherPhone}</span>}
                                  {item.fatherPhone && item.motherPhone && <span className="mx-1">•</span>}
                                  {item.motherPhone && <span>Ona: {item.motherPhone}</span>}
                                </div>
                              </div>
                            </td>

                            {/* Financial / Debt Status */}
                            <td className="py-3 px-2 overflow-hidden">
                              {item.isDebtor ? (
                                <div className="min-w-0">
                                  <span className="text-xs font-black text-rose-600 dark:text-rose-400 block truncate">
                                    {formatCurrency(item.balance)}
                                  </span>
                                  <span className="text-[10px] text-gray-400 block truncate">
                                    To‘langan: {formatCurrency(item.paid)}
                                  </span>
                                </div>
                              ) : (
                                <div className="min-w-0">
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 truncate">
                                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                                    0 so‘m
                                  </span>
                                  <span className="text-[10px] text-gray-400 block truncate">
                                    To‘liq to‘langan
                                  </span>
                                </div>
                              )}
                            </td>

                            {/* Live Formatted SMS Preview */}
                            <td className="py-3 px-2 overflow-hidden">
                              <div className="relative group p-2 rounded-lg bg-gray-50/90 dark:bg-surface-dark-tertiary border border-gray-200/80 dark:border-gray-700/60 text-[11px] text-gray-700 dark:text-gray-300 leading-tight font-sans">
                                <p className="line-clamp-2 pr-5 text-[11px] break-words" title={item.messageText}>
                                  {item.messageText}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => handleCopyText(item.studentId, item.messageText)}
                                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded bg-white dark:bg-gray-800 text-gray-500 hover:text-blue-600 dark:hover:text-emerald-400 shadow-2xs cursor-pointer"
                                  title="SMS matnini nusxalash"
                                >
                                  {copiedTextId === item.studentId ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </td>

                            {/* SMS Status */}
                            <td className="py-3 px-1 text-center overflow-hidden">
                              {item.isExcluded ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800 whitespace-nowrap">
                                  <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                                  Chetlatilgan
                                </span>
                              ) : item.queueStatus === 'pending' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800 whitespace-nowrap">
                                  <Clock className="w-2.5 h-2.5 shrink-0" />
                                  Navbatda
                                </span>
                              ) : item.queueStatus === 'sent' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 whitespace-nowrap">
                                  <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                                  Yuborilgan
                                </span>
                              ) : item.isDebtor ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800 whitespace-nowrap">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                                  SMS boradi
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 whitespace-nowrap">
                                  Bormaydi
                                </span>
                              )}
                            </td>

                            {/* Action Buttons */}
                            <td className="py-3 pr-4 pl-1 text-right overflow-hidden">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleViewInPhone(item.studentId, item.studentName)}
                                  className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer shrink-0 ${
                                    isSelectedInPreview
                                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark-secondary text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                  }`}
                                  title="Ota-ona ko‘rinishini telefonda ko‘rish"
                                >
                                  <Eye className="w-3.5 h-3.5 shrink-0" />
                                  <span className="hidden 2xl:inline text-[10px]">Telefonda</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenRecipientTestSms(item)}
                                  className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark-secondary text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs shrink-0"
                                  title="Ushbu raqamga Test SMS jo‘natish"
                                >
                                  <Send className="w-3.5 h-3.5 text-blue-600 dark:text-emerald-400 shrink-0" />
                                  <span className="hidden 2xl:inline text-[10px]">Sinov</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleToggleExclude(item.studentId, item.studentName)}
                                  className={`p-1.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shrink-0 ${
                                    item.isExcluded
                                      ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                                      : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-gray-50'
                                  }`}
                                  title={item.isExcluded ? 'SMS yuborishga qaytarish' : 'SMS yuborishdan chetlatish'}
                                >
                                  {item.isExcluded ? (
                                    <>
                                      <UserCheck className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300 shrink-0" />
                                      <span className="hidden 2xl:inline text-[10px]">Kiritish</span>
                                    </>
                                  ) : (
                                    <>
                                      <UserX className="w-3.5 h-3.5 shrink-0" />
                                      <span className="hidden 2xl:inline text-[10px]">Chetlash</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View */}
              <div className="grid grid-cols-1 gap-3 md:hidden mt-3">
                {filteredProspectiveRecipients.map((item) => (
                  <Card key={item.studentId} className="p-3.5 space-y-3 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                          {item.studentName}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {item.courseName} • {item.groupName}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          item.isDebtor
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {item.isDebtor ? `Qarz: ${formatCurrency(item.balance)}` : 'To‘langan'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-surface-dark-tertiary text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Qabul qiluvchi:</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200">
                          {item.recipientLabel}: {item.targetPhone || 'Telefon yo‘q'}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-[11px] line-clamp-2 pt-1 border-t border-gray-200 dark:border-gray-700">
                        {item.messageText}
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Eye}
                        onClick={() => handleViewInPhone(item.studentId, item.studentName)}
                        className="text-xs px-2.5 py-1"
                      >
                        Telefonda
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Send}
                        onClick={() => handleOpenRecipientTestSms(item)}
                        className="text-xs px-2.5 py-1"
                      >
                        Sinov SMS
                      </Button>
                      <button
                        type="button"
                        onClick={() => handleToggleExclude(item.studentId, item.studentName)}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 cursor-pointer"
                      >
                        {item.isExcluded ? 'Kiritish' : 'Chetlash'}
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DUAL GATEWAY DEVICES                                              */}
      {/* ========================================================================= */}
      {activeTab === 'devices' && (
        <div className="space-y-6 sm:space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Primary Device Card */}
            {(() => {
              const dev = devices.find((d) => d.device_role === 'primary') || {
                id: null,
                device_role: 'primary',
                name: 'Asosiy Android Gateway (Samsung)',
                gateway_url: 'http://192.168.1.150:8080/send',
                status: 'offline',
              };
              const isOnline = dev.status === 'online';
              return (
                <Card className="p-5 sm:p-6 border-2 border-blue-500/30 relative overflow-hidden rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  {/* Top Block: Icon + Name + Online badge */}
                  <div className="flex items-start justify-between gap-3 mb-5">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 shrink-0">
                        <Smartphone className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                            1-Qurilma (Asosiy)
                          </span>
                          <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${isOnline ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                            {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-600" /> : <WifiOff className="w-3.5 h-3.5 text-gray-400" />}
                            {isOnline ? 'Onlayn' : 'Oflayn'}
                          </span>
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base">{dev.name}</h3>
                      </div>
                    </div>
                  </div>

                  {/* Middle Block: Gateway Details Info Box */}
                  <div className="p-4 sm:p-5 bg-gray-50/90 dark:bg-surface-dark-tertiary rounded-2xl space-y-3.5 text-xs border border-gray-100 dark:border-gray-800/80 mb-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <span className="text-gray-500 font-medium">Gateway URL:</span>
                      <span className="font-mono font-semibold text-gray-800 dark:text-gray-200 truncate max-w-full sm:max-w-[260px] px-2.5 py-1 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xs" title={dev.gateway_url}>
                        {dev.gateway_url || 'Kiritilmagan'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 font-medium">SIM Raqami:</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{dev.phone_number || 'SIM 1'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 font-medium">Oxirgi aloqa:</span>
                      <span className="text-gray-700 dark:text-gray-300 font-mono">
                        {dev.last_seen_at ? formatDate(dev.last_seen_at) : 'Hali ulanmagan'}
                      </span>
                    </div>
                    {dev.last_error && (
                      <div className="text-[11px] text-rose-600 dark:text-rose-400 border-t border-gray-200 dark:border-gray-700 pt-2">
                        Xatolik: {dev.last_error}
                      </div>
                    )}
                  </div>

                  {/* Bottom Block: Actions */}
                  <div className="flex items-center gap-2.5 pt-3 flex-wrap border-t border-gray-100 dark:border-gray-800/70">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={RefreshCw}
                      isLoading={pingingDeviceId === dev.id}
                      disabled={Boolean(pingingDeviceId)}
                      onClick={() => handlePingDevice(dev)}
                      className="cursor-pointer"
                    >
                      Aloqani tekshirish (Ping)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Send}
                      onClick={() => {
                        setSelectedTestDevice(dev.id);
                        setIsTestModalOpen(true);
                      }}
                      className="cursor-pointer"
                    >
                      Test SMS
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenEditDevice(dev)}
                      className="bg-blue-600 hover:bg-blue-700 dark:bg-emerald-600 text-white cursor-pointer ml-auto"
                    >
                      Tahrirlash
                    </Button>
                  </div>
                </Card>
              );
            })()}

            {/* Backup Device Card */}
            {(() => {
              const dev = devices.find((d) => d.device_role === 'backup') || {
                id: null,
                device_role: 'backup',
                name: 'Zaxira Android Gateway (Redmi)',
                gateway_url: 'http://192.168.1.151:8080/send',
                status: 'offline',
              };
              const isOnline = dev.status === 'online';
              return (
                <Card className="p-5 sm:p-6 border-2 border-emerald-500/30 relative overflow-hidden rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  {/* Top Block: Icon + Name + Online badge */}
                  <div className="flex items-start justify-between gap-3 mb-5">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 shrink-0">
                        <Smartphone className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            2-Qurilma (Zaxira Failover)
                          </span>
                          <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${isOnline ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                            {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-600" /> : <WifiOff className="w-3.5 h-3.5 text-gray-400" />}
                            {isOnline ? 'Onlayn' : 'Oflayn'}
                          </span>
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base">{dev.name}</h3>
                      </div>
                    </div>
                  </div>

                  {/* Middle Block: Gateway Details Info Box */}
                  <div className="p-4 sm:p-5 bg-gray-50/90 dark:bg-surface-dark-tertiary rounded-2xl space-y-3.5 text-xs border border-gray-100 dark:border-gray-800/80 mb-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <span className="text-gray-500 font-medium">Gateway URL:</span>
                      <span className="font-mono font-semibold text-gray-800 dark:text-gray-200 truncate max-w-full sm:max-w-[260px] px-2.5 py-1 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xs" title={dev.gateway_url}>
                        {dev.gateway_url || 'Kiritilmagan'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 font-medium">SIM Raqami:</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{dev.phone_number || 'SIM 1'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 font-medium">Oxirgi aloqa:</span>
                      <span className="text-gray-700 dark:text-gray-300 font-mono">
                        {dev.last_seen_at ? formatDate(dev.last_seen_at) : 'Hali ulanmagan'}
                      </span>
                    </div>
                    {dev.last_error && (
                      <div className="text-[11px] text-rose-600 dark:text-rose-400 border-t border-gray-200 dark:border-gray-700 pt-2">
                        Xatolik: {dev.last_error}
                      </div>
                    )}
                  </div>

                  {/* Bottom Block: Actions */}
                  <div className="flex items-center gap-2.5 pt-3 flex-wrap border-t border-gray-100 dark:border-gray-800/70">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={RefreshCw}
                      isLoading={pingingDeviceId === dev.id}
                      disabled={Boolean(pingingDeviceId)}
                      onClick={() => handlePingDevice(dev)}
                      className="cursor-pointer"
                    >
                      Aloqani tekshirish (Ping)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Send}
                      onClick={() => {
                        setSelectedTestDevice(dev.id);
                        setIsTestModalOpen(true);
                      }}
                      className="cursor-pointer"
                    >
                      Test SMS
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenEditDevice(dev)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer ml-auto"
                    >
                      Tahrirlash
                    </Button>
                  </div>
                </Card>
              );
            })()}
          </div>

          {/* Android SMS Gateway Setup Guide Card */}
          <Card className="p-5 sm:p-7 border border-blue-200/80 dark:border-gray-700/80 rounded-2xl">
            <div className="flex items-center gap-3 pb-3.5 mb-6 border-b border-gray-100 dark:border-gray-800">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center shrink-0">
                <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-bold text-sm uppercase tracking-wide text-gray-900 dark:text-gray-100">
                  Android Telefonni SMS Gateway qilib ulash bo‘yicha qo‘llanma
                </h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-normal mt-0.5">
                  Oddiy Android telefoningiz orqali tizimdan avtomatik SMS yuborishni yo‘lga qo‘yish bo‘yicha 3 ta oson qadam
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              <div className="p-4 sm:p-5 bg-gray-50/90 dark:bg-surface-dark-tertiary rounded-2xl border border-gray-200/80 dark:border-gray-700/80 space-y-2">
                <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">1</span>
                <div>
                  <strong className="text-gray-900 dark:text-gray-100 block mb-1">Ilovani o‘rnating:</strong>
                  Android telefonga bepul va ochiq kodli <em>"SMS Gate"</em> yoki <em>"SMS Gateway (Android)"</em> ilovasini o‘rnating.
                </div>
              </div>
              <div className="p-4 sm:p-5 bg-gray-50/90 dark:bg-surface-dark-tertiary rounded-2xl border border-gray-200/80 dark:border-gray-700/80 space-y-2">
                <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">2</span>
                <div>
                  <strong className="text-gray-900 dark:text-gray-100 block mb-1">Ruxsatlarni bering:</strong>
                  Ilovaga <em>"Send SMS"</em> ruxsatini va Batareya sozlamalaridan <em>"Cheklovsiz (Unrestricted)"</em> rejimini yoqing.
                </div>
              </div>
              <div className="p-4 sm:p-5 bg-gray-50/90 dark:bg-surface-dark-tertiary rounded-2xl border border-gray-200/80 dark:border-gray-700/80 space-y-2">
                <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">3</span>
                <div>
                  <strong className="text-gray-900 dark:text-gray-100 block mb-1">LMS ga ulang:</strong>
                  Ilova ekranda ko‘rsatgan IP-manzilni (masalan: <code className="font-mono text-blue-600 dark:text-emerald-400 bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700">http://192.168.1.150:8080/send</code>) yuqoridagi kartaga kiriting.
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SMS QUEUE                                                          */}
      {/* ========================================================================= */}
      {activeTab === 'queue' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Queue Filter Toolbar (1 Row on Desktop, Equal Height h-10 / 40px for All Elements) */}
          <Card className="p-3 sm:p-3.5 rounded-2xl shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-3">
              {/* Left Group: Search Bar + Status Filter Segmented Pills */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                {/* 1. Search Bar (Exact h-10 / 40px) */}
                <div className="relative w-full sm:w-64 md:w-72 lg:w-80 shrink-0 h-10 min-h-[40px] max-h-[40px] flex items-center">
                  <Input
                    icon={Search}
                    size="sm"
                    className="!gap-0 !h-10 w-full justify-center"
                    inputClassName="!h-10 !min-h-[40px] !max-h-[40px] text-xs rounded-xl"
                    placeholder="Qidirish (ism, raqam, matn)..."
                    value={queueSearch}
                    onChange={(e) => setQueueSearch(e.target.value)}
                  />
                </div>

                {/* 2. Status Filter Segmented Pills (Exact h-10 / 40px seamless full-height) */}
                <div className="inline-flex items-center rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/90 dark:bg-surface-dark-secondary text-xs h-10 min-h-[40px] max-h-[40px] p-0 overflow-hidden divide-x divide-gray-200 dark:divide-gray-700 shrink-0 shadow-2xs">
                  {[
                    { key: 'ALL', label: 'Barchasi', count: queue.length },
                    { key: 'pending', label: 'Kutilmoqda', count: stats.pending },
                    { key: 'sent', label: 'Yuborildi', count: stats.sent },
                    { key: 'failed', label: 'Xatolik', count: stats.failed },
                  ].map((st) => (
                    <button
                      key={st.key}
                      type="button"
                      onClick={() => setQueueStatusFilter(st.key)}
                      className={`h-full min-h-[40px] max-h-[40px] flex items-center justify-center gap-1.5 px-3.5 sm:px-4 font-bold transition-all cursor-pointer whitespace-nowrap text-xs ${
                        queueStatusFilter === st.key
                          ? 'bg-blue-600 dark:bg-emerald-600 text-white font-black shadow-xs'
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <span>{st.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                          queueStatusFilter === st.key
                            ? 'bg-white/20 text-white'
                            : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {st.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Group: Action Buttons (Exact h-10 / 40px) */}
              <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  icon={RefreshCw}
                  isLoading={refreshingQueue}
                  disabled={refreshingQueue}
                  onClick={handleRefreshData}
                  className="!h-10 !min-h-[40px] !max-h-[40px] !py-0 cursor-pointer font-semibold justify-center text-xs w-full sm:w-auto px-3.5 rounded-xl"
                >
                  Yangilash
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={Play}
                  isLoading={processingQueue}
                  disabled={stats.pending === 0 || processingQueue}
                  onClick={handleProcessQueue}
                  className="!h-10 !min-h-[40px] !max-h-[40px] !py-0 bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer justify-center text-xs w-full sm:w-auto px-4 rounded-xl"
                >
                  {processingQueue
                    ? 'Tarqatilmoqda... (kuting)'
                    : `Navbatdagi xabarlarni yuborish (${stats.pending})`}
                </Button>
              </div>
            </div>
          </Card>

          {/* Desktop Table View (Hidden on mobile) */}
          <Card noPadding className="hidden md:block overflow-hidden rounded-2xl shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50/90 dark:bg-surface-dark-tertiary border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 uppercase font-bold text-[11px] tracking-wider">
                    <th className="py-3.5 pl-6 pr-4 min-w-[180px]">Qabul qiluvchi</th>
                    <th className="py-3.5 px-4 min-w-[140px]">Telefon</th>
                    <th className="py-3.5 px-4 min-w-[130px]">Qarzdorlik</th>
                    <th className="py-3.5 px-4 min-w-[260px]">SMS Matni</th>
                    <th className="py-3.5 px-4 min-w-[120px]">Holat</th>
                    <th className="py-3.5 px-4 min-w-[90px]">Urinish</th>
                    <th className="py-3.5 pr-6 pl-4 text-right min-w-[120px]">Amal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredQueue.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-14 text-center text-gray-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <ListOrdered className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                          <span className="font-medium text-sm text-gray-600 dark:text-gray-300">Navbatda SMS xabarlari mavjud emas</span>
                          <span className="text-xs text-gray-400">Qarzdorlarni tekshirish tugmasini bosib yangi navbat hosil qilishingiz mumkin</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredQueue.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/70 dark:hover:bg-surface-dark-tertiary/40 transition-colors">
                        <td className="py-3.5 pl-6 pr-4 font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                          {item.recipient_name}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-gray-700 dark:text-gray-300 font-semibold whitespace-nowrap">
                          {item.recipient_phone}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap font-mono">
                          {formatCurrency(item.amount_due)}
                        </td>
                        <td className="py-3.5 px-4 max-w-sm truncate text-gray-600 dark:text-gray-300 font-sans" title={item.message_text}>
                          {item.message_text}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              item.status === 'sent'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : item.status === 'failed'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                : item.status === 'processing'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 animate-pulse'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            }`}
                          >
                            {item.status === 'sent' ? 'Yuborildi' : item.status === 'failed' ? 'Xatolik' : item.status === 'processing' ? 'Yuborilmoqda...' : 'Kutilmoqda'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-gray-500 whitespace-nowrap">
                          {item.attempts || 0} / {item.max_attempts || 3}
                        </td>
                        <td className="py-3.5 pr-6 pl-4 text-right whitespace-nowrap space-x-1">
                          {item.status === 'failed' && (
                            <button
                              type="button"
                              disabled={retryingId === item.id}
                              onClick={() => handleRetryItem(item.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400 font-bold text-[10px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Qayta urinish"
                            >
                              {retryingId === item.id && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                              <span>{retryingId === item.id ? 'Yuborilmoqda...' : 'Qayta yuborish'}</span>
                            </button>
                          )}
                          {item.status === 'pending' && (
                            <button
                              type="button"
                              disabled={cancellingId === item.id}
                              onClick={() => handleCancelItem(item.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 font-bold text-[10px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Bekor qilish"
                            >
                              {cancellingId === item.id && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                              <span>{cancellingId === item.id ? 'Bekor qilinmoqda...' : 'Bekor qilish'}</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile Card List View (Visible on phones & tablets < md) */}
          <div className="block md:hidden space-y-3">
            {filteredQueue.length === 0 ? (
              <Card className="p-8 text-center text-gray-400 rounded-2xl">
                <div className="flex flex-col items-center justify-center gap-2">
                  <ListOrdered className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                  <span className="font-semibold text-sm text-gray-600 dark:text-gray-300">
                    Navbatda SMS xabarlari mavjud emas
                  </span>
                  <span className="text-xs text-gray-400">
                    Qarzdorlarni tekshirish tugmasini bosib yangi navbat shakllantirishingiz mumkin
                  </span>
                </div>
              </Card>
            ) : (
              filteredQueue.map((item) => (
                <Card key={item.id} className="p-4 space-y-3 border border-gray-200/80 dark:border-gray-800 rounded-2xl shadow-xs">
                  {/* Card Top: Recipient & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                        {item.recipient_name}
                      </h4>
                      <a
                        href={`tel:${item.recipient_phone}`}
                        className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-blue-600 dark:text-emerald-400 mt-0.5 hover:underline"
                      >
                        <PhoneCall className="w-3 h-3" />
                        <span>{item.recipient_phone}</span>
                      </a>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                        item.status === 'sent'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : item.status === 'failed'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          : item.status === 'processing'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 animate-pulse'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}
                    >
                      {item.status === 'sent' ? 'Yuborildi' : item.status === 'failed' ? 'Xatolik' : item.status === 'processing' ? 'Yuborilmoqda...' : 'Kutilmoqda'}
                    </span>
                  </div>

                  {/* Card Debt Amount */}
                  <div className="flex items-center justify-between text-xs py-1.5 px-3 bg-gray-50 dark:bg-surface-dark-tertiary rounded-xl border border-gray-100 dark:border-gray-800/60">
                    <span className="text-gray-500 font-medium">Qarzdorlik summasi:</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">
                      {formatCurrency(item.amount_due)}
                    </span>
                  </div>

                  {/* Card SMS Message preview */}
                  <div className="p-3 bg-blue-50/40 dark:bg-gray-800/60 rounded-xl text-xs text-gray-700 dark:text-gray-300 leading-relaxed border border-blue-100/50 dark:border-gray-700/60">
                    <span className="block text-[10px] font-bold uppercase text-gray-400 mb-1">SMS Matni:</span>
                    <p className="line-clamp-3 font-sans">{item.message_text}</p>
                  </div>

                  {/* Card Footer: Attempts & Action Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800/80 text-xs">
                    <span className="font-mono text-gray-500 text-[11px]">
                      Urinish: {item.attempts || 0}/{item.max_attempts || 3}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {item.status === 'failed' && (
                        <button
                          type="button"
                          disabled={retryingId === item.id}
                          onClick={() => handleRetryItem(item.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300 font-bold text-xs cursor-pointer active:scale-95 transition-all"
                        >
                          {retryingId === item.id && <Loader2 className="w-3 h-3 animate-spin" />}
                          <span>Qayta yuborish</span>
                        </button>
                      )}
                      {item.status === 'pending' && (
                        <button
                          type="button"
                          disabled={cancellingId === item.id}
                          onClick={() => handleCancelItem(item.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-300 font-bold text-xs cursor-pointer active:scale-95 transition-all"
                        >
                          {cancellingId === item.id && <Loader2 className="w-3 h-3 animate-spin" />}
                          <span>Bekor qilish</span>
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: AUDIT LOGS & HISTORY                                               */}
      {/* ========================================================================= */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <Card noPadding className="hidden md:block rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                Yuborilgan SMS Xabarlar Jurnali ({logs.length} ta yozuv)
              </h3>
              <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadData}>
                Yangilash
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50/90 dark:bg-surface-dark-tertiary border-b border-gray-200 dark:border-gray-800 text-gray-500 uppercase font-bold text-[11px] tracking-wider">
                    <th className="py-3.5 pl-6 pr-4 min-w-[130px]">Vaqt</th>
                    <th className="py-3.5 px-4 min-w-[160px]">Qabul qiluvchi</th>
                    <th className="py-3.5 px-4 min-w-[140px]">Telefon</th>
                    <th className="py-3.5 px-4 min-w-[140px]">Qurilma / Kanal</th>
                    <th className="py-3.5 px-4 min-w-[110px]">Natija</th>
                    <th className="py-3.5 pr-6 pl-4 min-w-[200px]">Izoh / Tafsilot</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-14 text-center text-gray-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <History className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                          <span className="font-medium text-sm text-gray-600 dark:text-gray-300">Tarixda SMS yozuvlari mavjud emas</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50/70 dark:hover:bg-surface-dark-tertiary/40">
                        <td className="py-3.5 pl-6 pr-4 font-mono text-gray-500 whitespace-nowrap">
                          {formatDate(log.created_at)}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-gray-100">
                          {log.recipient_name || 'Noma‘lum'}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-gray-700 dark:text-gray-300">
                          {log.recipient_phone}
                        </td>
                        <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300">
                          {log.response_payload?.delivered_via || 'SIM Gateway'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              log.status === 'sent'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {log.status === 'sent' ? 'Yuborildi' : 'Xatolik'}
                          </span>
                        </td>
                        <td className="py-3.5 pr-6 pl-4 text-gray-500 truncate max-w-xs">
                          {log.error_details || 'Muvaffaqiyatli yetkazildi'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile Log Cards View */}
          <div className="block md:hidden space-y-3">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                Jami {logs.length} ta yozuv
              </span>
              <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadData}>
                Yangilash
              </Button>
            </div>
            {logs.length === 0 ? (
              <Card className="p-8 text-center text-gray-400 rounded-2xl">
                <div className="flex flex-col items-center justify-center gap-2">
                  <History className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                  <span className="font-semibold text-sm text-gray-600 dark:text-gray-300">
                    Tarixda SMS yozuvlari mavjud emas
                  </span>
                </div>
              </Card>
            ) : (
              logs.map((log) => (
                <Card key={log.id} className="p-4 space-y-2.5 border border-gray-200/80 dark:border-gray-800 rounded-2xl shadow-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                        {log.recipient_name || 'Noma‘lum'}
                      </h4>
                      <span className="text-xs font-mono font-semibold text-gray-500 dark:text-gray-400 block mt-0.5">
                        {log.recipient_phone}
                      </span>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                        log.status === 'sent'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {log.status === 'sent' ? 'Yuborildi' : 'Xatolik'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs py-1.5 px-3 bg-gray-50 dark:bg-surface-dark-tertiary rounded-xl border border-gray-100 dark:border-gray-800/60">
                    <span className="text-gray-500">Vaqt:</span>
                    <span className="font-mono text-gray-700 dark:text-gray-300">
                      {formatDate(log.created_at)}
                    </span>
                  </div>

                  <div className="text-xs text-gray-600 dark:text-gray-400 pt-1 border-t border-gray-100 dark:border-gray-800/60">
                    <span className="font-medium text-gray-500">Kanal:</span> {log.response_payload?.delivered_via || 'SIM Gateway'}
                    {log.error_details && (
                      <p className="mt-1 text-rose-500 text-[11px] font-medium">{log.error_details}</p>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: TEST SMS SENDER                                                  */}
      {/* ========================================================================= */}
      {isTestModalOpen && (
        <Modal
          isOpen={isTestModalOpen}
          onClose={() => !sendingTest && setIsTestModalOpen(false)}
          title="Sinov (Test) SMS Xabari Yuborish"
          maxWidth="md"
        >
          <form onSubmit={handleSendTestSms} className="space-y-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Telefon raqamingizni kiriting va tanlangan Android Gateway orqali real SMS borishini tekshirib ko‘ring.
            </p>

            {sendingTest && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900/80 text-xs">
                <Loader2 className="w-4 h-4 animate-spin shrink-0 text-blue-600 dark:text-blue-400" />
                <div className="min-w-0">
                  <strong className="block font-semibold">SMS yuborilmoqda...</strong>
                  <span className="text-[11px] text-blue-600 dark:text-blue-400">
                    Android Gateway orqali telefon tarmog‘iga uzatilmoqda. Iltimos, xabar ketgunicha kuting!
                  </span>
                </div>
              </div>
            )}

            <div>
              <Select
                label="Qaysi qurilma orqali yuborilsin"
                value={selectedTestDevice}
                disabled={sendingTest}
                onChange={(e) => setSelectedTestDevice(e.target.value)}
                headerTitle="Gateway qurilmasini tanlang"
                options={[
                  {
                    value: '',
                    label: 'Avtomatik (Asosiy, bo‘lmasa Zaxira)',
                    subtitle: 'Tizim avtomatik onlayn qurilmani tanlaydi',
                  },
                  ...devices.map((d) => ({
                    value: d.id,
                    label: `${d.name} (${d.device_role === 'primary' ? 'Asosiy' : 'Zaxira'})`,
                    subtitle: d.gateway_url || 'URL kiritilgan',
                    badge: d.status === 'online' ? 'Onlayn' : 'Oflayn',
                  })),
                ]}
              />
            </div>

            <div>
              <Input
                label="Telefon raqami"
                isPhone
                type="tel"
                disabled={sendingTest}
                placeholder="+998 90 123 45 67"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                Xabar matni
              </label>
              <textarea
                rows={3}
                disabled={sendingTest}
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className={`w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-surface-dark-tertiary text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-emerald-500 leading-relaxed font-sans ${
                  sendingTest ? 'opacity-60 cursor-not-allowed' : ''
                }`}
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <Button variant="ghost" disabled={sendingTest} onClick={() => setIsTestModalOpen(false)}>
                Bekor qilish
              </Button>
              <Button
                type="submit"
                variant="primary"
                icon={Send}
                isLoading={sendingTest}
                disabled={sendingTest}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-emerald-600 text-white font-bold"
              >
                {sendingTest ? 'Yuborilmoqda... (kuting)' : 'Hozir yuborish'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT GATEWAY DEVICE                                              */}
      {/* ========================================================================= */}
      {isDeviceModalOpen && editingDevice && (
        <Modal
          isOpen={isDeviceModalOpen}
          onClose={() => setIsDeviceModalOpen(false)}
          title={`SMS Gateway Sozlash: ${editingDevice.device_role === 'primary' ? 'Asosiy Telefon' : 'Zaxira Telefon'}`}
          maxWidth="lg"
        >
          <form onSubmit={handleSaveDevice} className="space-y-4">
            <div>
              <Input
                label="Qurilma Nomi"
                type="text"
                value={editingDevice.name || ''}
                onChange={(e) => setEditingDevice({ ...editingDevice, name: e.target.value })}
                placeholder="Masalan: Boshliq Samsung A54"
                required
              />
            </div>

            <div>
              <Input
                label="Gateway API Manzili (URL)"
                type="url"
                value={editingDevice.gateway_url || ''}
                onChange={(e) => setEditingDevice({ ...editingDevice, gateway_url: e.target.value })}
                placeholder="http://192.168.1.150:8080/send yoki https://gateway.domen.uz/v1/sms"
                helperText="Telefondagi SMS Gateway ilovasi ko‘rsatgan HTTP POST so‘rov manzili"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                Maxfiy API Token (ixtiyoriy)
              </label>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={editingDevice.api_token || ''}
                  onChange={(e) => setEditingDevice({ ...editingDevice, api_token: e.target.value })}
                  placeholder="Maxfiy parolingiz yoki kalit"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-surface-dark-tertiary text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm font-mono pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <Input
                label="SIM Karta Telefon Raqami"
                isPhone
                type="tel"
                value={editingDevice.phone_number || ''}
                onChange={(e) => setEditingDevice({ ...editingDevice, phone_number: e.target.value })}
                placeholder="+998 90 123 45 67"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <Button variant="ghost" disabled={savingDevice} onClick={() => setIsDeviceModalOpen(false)}>
                Bekor qilish
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={savingDevice}
                disabled={savingDevice}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-emerald-600 text-white font-bold"
              >
                Qurilmani saqlash
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
