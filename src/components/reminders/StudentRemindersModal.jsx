import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  Clock,
  Phone,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Users,
  GraduationCap,
  ArrowRight,
  X,
  Plus,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { toast } from '@/components/ui/Toast';
import {
  getStudentReminders,
  completeStudentReminder,
  postponeStudentReminder,
  deleteStudentReminder,
} from '@/services/reminderService';
import { formatUzPhone } from '@/utils/phoneFormat';

export default function StudentRemindersModal({
  isOpen,
  onClose,
  onOpenCreateGroup,
}) {
  const { t } = useTranslation();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('due'); // 'due' | 'upcoming' | 'completed'

  const loadReminders = async () => {
    setLoading(true);
    try {
      const all = await getStudentReminders();
      setReminders(all || []);
    } catch (err) {
      console.error('Failed to load reminders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadReminders();
    }
  }, [isOpen]);

  const todayStr = new Date().toISOString().split('T')[0];

  const dueReminders = reminders.filter(
    (r) => r.status === 'pending' && r.due_date <= todayStr
  );
  const upcomingReminders = reminders.filter(
    (r) => r.status === 'pending' && r.due_date > todayStr
  );
  const completedReminders = reminders.filter((r) => r.status === 'completed');

  const displayedList =
    activeTab === 'due'
      ? dueReminders
      : activeTab === 'upcoming'
      ? upcomingReminders
      : completedReminders;

  const handleMarkSpoken = async (id, studentName) => {
    try {
      await completeStudentReminder(id, 'Gaplashildi va kelishildi');
      toast.success(`${studentName} bilan bog'lanildi deb belgilandi!`);
      loadReminders();
    } catch (err) {
      toast.error('Xatolik yuz berdi');
    }
  };

  const handlePostpone = async (id, days) => {
    try {
      await postponeStudentReminder(id, days);
      toast.info(`Eslatma ${days} kunga keyinga surildi`);
      loadReminders();
    } catch (err) {
      toast.error('Xatolik yuz berdi');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteStudentReminder(id);
      toast.success("Eslatma o'chirildi");
      loadReminders();
    } catch (err) {
      toast.error('Xatolik yuz berdi');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="⏰ O‘quvchilar bilan bog‘lanish va Dars eslatmalari"
      subtitle="Yangi kelgan o‘quvchilarga dars kuni, guruhi va sinov darsi haqida xabar berish bildirishnomalari"
      size="xl"
    >
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('due')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'due'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-400/40'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Muddati kelganlar</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === 'due' ? 'bg-white/30 text-white' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              {dueReminders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upcoming')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'upcoming'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-400/40'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Kutilayotganlar</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === 'upcoming' ? 'bg-white/30 text-white' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              {upcomingReminders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('completed')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'completed'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/40'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Gaplashilganlar</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === 'completed' ? 'bg-white/30 text-white' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              {completedReminders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={loadReminders}
            className="ml-auto p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            title="Yangilash"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Reminders List */}
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {displayedList.length === 0 ? (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500 opacity-80" />
              <p className="text-sm font-semibold">
                {activeTab === 'due'
                  ? "Ajoyib! Hozirda qo'ng'iroq qilish kerak bo'lgan o'quvchilar yo'q."
                  : activeTab === 'upcoming'
                  ? "Yaqin kunlarda rejalashtirilgan eslatmalar yo'q."
                  : "Hali gaplashilgan eslatmalar mavjud emas."}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Yangi o‘quvchi ro‘yxatga olinganda avtomatik eslatma qo‘shishingiz mumkin.
              </p>
            </div>
          ) : (
            displayedList.map((item) => {
              const isOverdue = item.status === 'pending' && item.due_date <= todayStr;
              const phoneToCall = item.student_phone || item.father_phone || item.mother_phone;

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isOverdue
                      ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20'
                      : item.status === 'completed'
                      ? 'border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-surface-dark-tertiary/20 opacity-80'
                      : 'border-blue-200 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-950/20'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    {/* Left: Student Info & Note */}
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-gray-900 dark:text-white">
                          {item.student_name}
                        </span>
                        {isOverdue && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500 text-white shadow-xs animate-pulse">
                            Qo‘ng‘iroq vaqti keldi!
                          </span>
                        )}
                        {item.group_name && item.group_name !== 'Guruhsiz' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60">
                            <GraduationCap className="w-3 h-3" />
                            <span>{item.group_name}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60">
                            <Users className="w-3 h-3" />
                            <span>Guruhsiz (Kutilmoqda)</span>
                          </span>
                        )}
                      </div>

                      {/* Reminder Note */}
                      <p className="text-xs text-gray-700 dark:text-gray-300 font-medium bg-white/70 dark:bg-surface-dark-secondary/70 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                        💬 <span className="font-semibold text-gray-900 dark:text-white">Eslatma maqsadi:</span> {item.note}
                      </p>

                      {/* Date & Time badge */}
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 font-mono flex-wrap">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-blue-500" />
                          <span>{item.due_date}</span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>{item.due_time}</span>
                        </span>
                        {phoneToCall && (
                          <a
                            href={`tel:${phoneToCall}`}
                            className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>{formatUzPhone(phoneToCall)}</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Right: Action Buttons */}
                    <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                      {item.status === 'pending' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleMarkSpoken(item.id, item.student_name)}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>✅ Gaplashildi</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handlePostpone(item.id, 1)}
                              className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-[11px] font-semibold transition-colors cursor-pointer"
                              title="1 kunga surish"
                            >
                              +1 kun
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePostpone(item.id, 3)}
                              className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-[11px] font-semibold transition-colors cursor-pointer"
                              title="3 kunga surish"
                            >
                              +3 kun
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                              title="Bekor qilish"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-500/30">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Bog‘lanilgan</span>
                          </span>
                          {item.completed_at && (
                            <p className="text-[10px] text-gray-400 mt-1">
                              {new Date(item.completed_at).toLocaleDateString('ru-RU')}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info & New Group Action */}
        <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between flex-wrap gap-2 text-xs">
          <p className="text-gray-500 dark:text-gray-400">
            🔔 Eslatma «Gaplashildi» deb belgilanmagunicha navbarda faol bo‘lib turadi.
          </p>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Yopish
          </Button>
        </div>
      </div>
    </Modal>
  );
}
