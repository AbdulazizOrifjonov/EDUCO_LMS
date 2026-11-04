import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Split,
  ArrowRight,
  ArrowRightLeft,
  Building2,
  GraduationCap,
  Sparkles,
  Check,
  Search,
  CheckCircle2,
  AlertTriangle,
  Layers,
  X,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { toast } from '@/components/ui/Toast';
import { splitGroup, generateSubgroupSuggestions } from '@/services/groupService';
import { localStore } from '@/lib/localStore';

export default function GroupSplitModal({ isOpen, onClose, group, onSuccess }) {
  const [sourceGroupName, setSourceGroupName] = useState('');
  const [targetGroupName, setTargetGroupName] = useState('');
  const [targetGroupCode, setTargetGroupCode] = useState('');
  const [targetRoom, setTargetRoom] = useState('');
  const [targetTeacherId, setTargetTeacherId] = useState('');
  const [targetCapacity, setTargetCapacity] = useState(25);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState(new Set()); // IDs to move to group 2
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teachers, setTeachers] = useState([]);

  // Initialize data when modal opens
  useEffect(() => {
    if (!isOpen || !group) return;

    const courseName = group.course_name || group.courseName || group.name || 'Kurs';
    const suggestions = generateSubgroupSuggestions(courseName, 1);

    // Auto-suggest names
    const cleanPrefix = suggestions.prefix;
    setSourceGroupName(`${courseName} 1.1 (${cleanPrefix}-1.1)`);
    setTargetGroupName(`${courseName} 1.2 (${cleanPrefix}-1.2)`);
    setTargetGroupCode(`${cleanPrefix}-1.2`);
    setTargetRoom(group.room ? `${group.room}B` : 'Xona 102');
    setTargetTeacherId(group.teacher_id || group.teacherId || '');
    setTargetCapacity(group.capacity || 25);

    // Load teachers
    const uList = localStore.getUsers ? localStore.getUsers() : [];
    setTeachers(uList.filter((u) => u.role === 'teacher'));

    // Load enrolled students of this group
    const groupStudentIds = group.student_ids || [];
    let studentsInGroup = [];

    if (group.students && Array.isArray(group.students) && group.students.length > 0) {
      studentsInGroup = group.students;
    } else {
      const normIds = new Set(groupStudentIds.map((id) => localStore.normalizeUserId(id)));
      studentsInGroup = uList.filter((u) => normIds.has(localStore.normalizeUserId(u.id)));
    }

    setAllStudents(studentsInGroup);

    // Default: evenly split students 50/50
    const half = Math.ceil(studentsInGroup.length / 2);
    const toMove = new Set(studentsInGroup.slice(half).map((s) => s.id));
    setSelectedStudentIds(toMove);
  }, [isOpen, group]);

  const totalCount = allStudents.length;
  const targetCount = selectedStudentIds.size;
  const sourceCount = totalCount - targetCount;

  // Even split 50/50 action
  const handleEvenSplit = () => {
    const half = Math.ceil(allStudents.length / 2);
    const toMove = new Set(allStudents.slice(half).map((s) => s.id));
    setSelectedStudentIds(toMove);
    toast.info(`Talabalar teng taqsimlandi: 1-guruhda ${half} nafar, 2-guruhda ${allStudents.length - half} nafar.`);
  };

  // Move overflow students (those over capacity)
  const handleOverflowSplit = () => {
    const cap = group?.capacity || 20;
    if (allStudents.length <= cap) {
      handleEvenSplit();
      return;
    }
    const toMove = new Set(allStudents.slice(cap).map((s) => s.id));
    setSelectedStudentIds(toMove);
    toast.info(`Me‘yordan ortiqcha ${toMove.size} nafar talaba 2-guruhga ajratildi.`);
  };

  // Reset all to group 1
  const handleResetAll = () => {
    setSelectedStudentIds(new Set());
  };

  // Select all to group 2
  const handleSelectAll = () => {
    setSelectedStudentIds(new Set(allStudents.map((s) => s.id)));
  };

  // Toggle single student
  const toggleStudent = (id) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return allStudents;
    const q = searchQuery.toLowerCase().trim();
    return allStudents.filter((s) => {
      const name = `${s.first_name || ''} ${s.last_name || ''} ${s.fullName || ''}`.toLowerCase();
      const phone = (s.phone || '').toLowerCase();
      return name.includes(q) || phone.includes(q);
    });
  }, [allStudents, searchQuery]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetGroupName.trim()) {
      toast.error('2-guruh nomini kiriting!');
      return;
    }
    if (selectedStudentIds.size === 0) {
      toast.error('2-guruhga kamida 1 nafar o‘quvchini ajrating!');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await splitGroup({
        sourceGroupId: group.id,
        renameSourceGroupTo: sourceGroupName.trim(),
        newGroupName: targetGroupName.trim(),
        newGroupCode: targetGroupCode.trim(),
        room: targetRoom.trim(),
        teacherId: targetTeacherId,
        capacity: Number(targetCapacity) || 25,
        studentIdsToMove: Array.from(selectedStudentIds),
      });

      toast.success(
        `🎉 Guruh muvaffaqiyatli 2 ga ajratildi!\n1-guruhda: ${res.remainingCount} ta, 2-guruhda: ${res.movedCount} ta o‘quvchi.`
      );
      onClose();
      if (onSuccess) onSuccess(res);
    } catch (err) {
      toast.error(`Xatolik: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!group) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="👥 Guruhni bo‘lish va 2-guruhni shakllantirish"
      subtitle="Katta guruhni 2 ta optimal guruhga (ENG-1.1 va ENG-1.2) ajratish"
      size="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Banner with Overview */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-emerald-50/80 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-emerald-950/40 border border-blue-200 dark:border-blue-900/60 flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600 text-white shrink-0 mt-0.5 shadow-sm">
            <Split className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase tracking-wider text-blue-950 dark:text-blue-200">
              «{group.name}» (Jami {totalCount} nafar talaba)
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              O‘quvchilar soni ko‘paygan guruhni sifatli o‘qitish uchun 2 ta parallel guruhga taqsimlang. O‘quvchilarning barcha ma‘lumotlari, davomati va to‘lovlari to‘liq saqlanib qoladi.
            </p>
          </div>
        </div>

        {/* Section 1: Group Names & Rooms */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-700">
          {/* Source Group (1-guruh) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-gray-200 dark:border-gray-700">
              <span className="text-xs font-black text-blue-700 dark:text-blue-400 flex items-center gap-1.5 uppercase">
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
                <span>1-Asosiy guruh (Qoladiganlar)</span>
              </span>
              <span className="text-xs font-bold text-gray-500">
                {sourceCount} nafar
              </span>
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400 block mb-1">
                Guruh nomi:
              </label>
              <Input
                value={sourceGroupName}
                onChange={(e) => setSourceGroupName(e.target.value)}
                placeholder="Masalan: Ingliz tili 1.1 (ENG-1.1)"
              />
            </div>
            <div className="text-[11px] text-gray-500">
              Xona: <strong>{group.room || 'Xona 102'}</strong> • Ustoz: <strong>{group.teacher_name || 'Ustoz'}</strong>
            </div>
          </div>

          {/* Target Group (2-guruh) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-gray-200 dark:border-gray-700">
              <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 uppercase">
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">2</span>
                <span>2-Yangi guruh (Ko‘chiriladiganlar)</span>
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {targetCount} nafar
              </span>
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400 block mb-1">
                Yangi 2-guruh nomi: <span className="text-red-500">*</span>
              </label>
              <Input
                value={targetGroupName}
                onChange={(e) => setTargetGroupName(e.target.value)}
                placeholder="Masalan: Ingliz tili 1.2 (ENG-1.2)"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400 block mb-1">
                  Xona / Auditoriya:
                </label>
                <Input
                  value={targetRoom}
                  onChange={(e) => setTargetRoom(e.target.value)}
                  placeholder="Xona 102B"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400 block mb-1">
                  Maksimal sig‘im:
                </label>
                <Input
                  type="number"
                  min="5"
                  max="50"
                  value={targetCapacity}
                  onChange={(e) => setTargetCapacity(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Student Distribution Bar & Actions */}
        <div className="space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>O‘quvchilarni taqsimlash ({totalCount} nafar)</span>
              </h4>
              <p className="text-[11px] text-gray-500">
                O‘quvchi kartasini bosib 1- yoki 2-guruhga o‘tkazing yoki tezkor tugmalardan foydalaning:
              </p>
            </div>

            {/* Quick Action Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={handleEvenSplit}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-950 dark:hover:bg-blue-900 dark:text-blue-300 border border-blue-300 dark:border-blue-800 transition-colors"
                title="Teng 50/50 taqsimlash"
              >
                ⚖️ Teng 50 / 50
              </button>
              <button
                type="button"
                onClick={handleOverflowSplit}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-950 dark:hover:bg-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 transition-colors"
                title="Sig‘imdan ortiqchalarini 2-guruhga ajratish"
              >
                ⚡ Ortiqchalarni ajratish
              </button>
              <button
                type="button"
                onClick={handleResetAll}
                className="px-2 py-1 rounded-lg text-[11px] font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Tiklash
              </button>
            </div>
          </div>

          {/* Visual Progress Bar */}
          <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-blue-700 dark:text-blue-400">
                1-guruhda: {sourceCount} nafar ({Math.round((sourceCount / (totalCount || 1)) * 100)}%)
              </span>
              <span className="text-emerald-700 dark:text-emerald-400">
                2-guruhda: {targetCount} nafar ({Math.round((targetCount / (totalCount || 1)) * 100)}%)
              </span>
            </div>
            <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
              <div
                className="bg-blue-600 h-full transition-all duration-300"
                style={{ width: `${(sourceCount / (totalCount || 1)) * 100}%` }}
              />
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${(targetCount / (totalCount || 1)) * 100}%` }}
              />
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="O‘quvchilarni ism yoki telefon bo‘yicha qidirish..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Student List */}
          <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 border border-gray-100 dark:border-gray-800 rounded-xl p-2 bg-gray-50/50 dark:bg-gray-900/40">
            {filteredStudents.length === 0 ? (
              <p className="text-center text-xs text-gray-400 py-4">O‘quvchi topilmadi</p>
            ) : (
              filteredStudents.map((s, idx) => {
                const isSelectedToMove = selectedStudentIds.has(s.id);
                const sName = `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.fullName || s.full_name || s.username || `Talaba #${idx + 1}`;
                return (
                  <div
                    key={s.id || idx}
                    onClick={() => toggleStudent(s.id)}
                    className={`p-2 rounded-xl border flex items-center justify-between gap-2 text-xs transition-all cursor-pointer ${
                      isSelectedToMove
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 shadow-2xs'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0 ${
                          isSelectedToMove
                            ? 'bg-emerald-600 text-white'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="font-bold truncate">{sName}</div>
                        <div className="text-[10px] text-gray-400 truncate">
                          {s.phone || 'Telefon raqam kiritilmagan'}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wide ${
                          isSelectedToMove
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                        }`}
                      >
                        {isSelectedToMove ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>2-Guruhga o‘tadi</span>
                          </>
                        ) : (
                          <span>1-Guruhda qoladi</span>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-200 dark:border-gray-800">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Bekor qilish
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/50"
          >
            🚀 Guruhlarni shakllantirish va Saqlash
          </Button>
        </div>
      </form>
    </Modal>
  );
}
