// src/pages/public/components/CtaSection.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  PhoneCall,
  Mail,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  BookOpen,
  Check,
  GraduationCap,
} from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import ScrollReveal from '@/hooks/useScrollReveal';
import { createStudentReminder } from '@/services/reminderService';
import { formatUzPhone } from '@/utils/phoneFormat';

const DEFAULT_COURSES = [
  { id: 'c-frontend', title: 'Frontend Web Dasturlash (React & Next.js)', category: 'IT & Dasturlash', badge: 'Top kurs' },
  { id: 'c-python', title: 'Python Backend & Sun‘iy Intellekt (AI)', category: 'IT & Dasturlash', badge: 'Trend' },
  { id: 'c-english', title: 'Ingliz tili (IELTS 8.0+ & General)', category: 'Xorijiy tillar', badge: 'Sertifikat' },
  { id: 'c-design', title: 'Grafik Dizayn & UI/UX (Figma, Photoshop)', category: 'Dizayn', badge: 'Amaliy' },
  { id: 'c-russian', title: 'Rus tili (Mukammal so‘zlashuv)', category: 'Xorijiy tillar', badge: 'Tezkor' },
  { id: 'c-arabic', title: 'Arab tili (Tajvid & Grammatika)', category: 'Xorijiy tillar', badge: 'Nufuzli' },
  { id: 'c-math', title: 'Oliy Matematika & Mantiq', category: 'Aniq fanlar', badge: 'Olimpiada' },
  { id: 'c-chess', title: 'Professional Shaxmat akademiyasi', category: 'Sport & Mantiq', badge: 'Chempionlar' },
];

export default function CtaSection({ settings, courses = [], prefilledCourse = '' }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '+998 ',
    course: prefilledCourse || '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Sync pre-filled course when selected from Course card or modal
  useEffect(() => {
    if (prefilledCourse) {
      setFormData((prev) => ({ ...prev, course: prefilledCourse }));
    }
  }, [prefilledCourse]);

  // Merge available courses
  const courseOptions = React.useMemo(() => {
    if (courses && courses.length > 0) {
      return courses.map((c, i) => ({
        id: c.id || `c-${i}`,
        title: c.title,
        category: c.category || 'Asosiy yo‘nalish',
        badge: c.price ? `${Number(c.price).toLocaleString()} so‘m` : '500,000 so‘m',
      }));
    }
    return DEFAULT_COURSES;
  }, [courses]);

  // Close custom select dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePhoneChange = (e) => {
    const raw = e.target.value;
    if (raw === '') {
      setFormData((prev) => ({ ...prev, phone: '' }));
      return;
    }
    if (raw === '+') {
      setFormData((prev) => ({ ...prev, phone: '+' }));
      return;
    }
    const formatted = formatUzPhone(raw);
    setFormData((prev) => ({ ...prev, phone: formatted }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      toast.error('Iltimos, ism va familiyangizni kiriting');
      return;
    }
    const digits = formData.phone.replace(/\D/g, '');
    if (digits.length < 9) {
      toast.error('Iltimos, to‘liq telefon raqamingizni kiriting (masalan: +998 90 123 45 67)');
      return;
    }

    setSubmitting(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const selectedCourseName = formData.course || 'Umumiy sinov darsi';

      // Save as student reminder / lead into system storage for Owner and Admin
      await createStudentReminder({
        type: 'website_lead',
        source: 'website',
        student_name: trimmedName,
        student_phone: formData.phone.trim(),
        course_name: selectedCourseName,
        group_name: 'Veb-sayt arizasi',
        due_date: todayStr,
        due_time: '10:00',
        note: formData.message?.trim()
          ? `Veb-sayt arizasi (${selectedCourseName}): ${formData.message.trim()}`
          : `Veb-sayt orqali "${selectedCourseName}" bo‘yicha bepul sinov darsiga yozildi`,
        status: 'pending',
        created_at: new Date().toISOString(),
      });

      // Notify other open browser tabs / Admin dashboards in real-time
      try {
        window.dispatchEvent(new Event('educo-data-sync'));
        window.dispatchEvent(new CustomEvent('new-website-lead', { detail: { name: trimmedName } }));
      } catch (_) {}

      setSubmitting(false);
      setSubmitted(true);
      toast.success('Arizangiz muvaffaqiyatli qabul qilindi! Menejerimiz tez orada siz bilan bog‘lanadi.');
      setFormData({ name: '', phone: '+998 ', course: '', message: '' });
    } catch (err) {
      console.error('Lead creation error:', err);
      setSubmitting(false);
      toast.error('Arizani yuborishda xatolik yuz berdi. Iltimos qaytadan urinib ko‘ring.');
    }
  };

  return (
    <section id="contact" className="py-20 lg:py-28 relative overflow-hidden">
      {/* Background Radial Glows */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[1540px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Contact Details (Enters from Left) */}
          <ScrollReveal animation="left" className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 dark:bg-emerald-950/60 text-blue-800 dark:text-emerald-300 text-xs font-bold border border-blue-300/60 dark:border-emerald-800/60">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-emerald-400" />
                <span>Birinchi Dars Bepul!</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white leading-tight tracking-tight">
                {settings?.cta_headline || 'Orzularingizdagi kasb sari ilk qadamni tashlang!'}
              </h2>

              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                {settings?.cta_subheadline ||
                  'Hoziroq ro‘yxatdan o‘ting va 1-bepul sinov darsimizda qatnashing. Safimizga qo‘shiling!'}
              </p>
            </div>

            {/* Direct Contact Cards */}
            <div className="space-y-4">
              <a
                href={`tel:${settings?.phone || '+998936101774'}`}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-[#1a2332] border border-gray-200/80 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-blue-500/50 dark:hover:border-emerald-500/50 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-emerald-950/80 text-blue-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <PhoneCall className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    Tezkor Aloqa Raqami:
                  </span>
                  <h4 className="text-base font-extrabold text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-emerald-400 transition-colors">
                    {settings?.phone || '+998 (93) 610-17-74'}
                  </h4>
                </div>
              </a>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-[#1a2332] border border-gray-200/80 dark:border-gray-800 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    Bizning Manzil:
                  </span>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    {settings?.address || 'Toshkent shahar, Yunusobod tumani, Amir Temur ko‘chasi, 107-B bino'}
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-[#1a2332] border border-gray-200/80 dark:border-gray-800 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    Ish Vaqti:
                  </span>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    {settings?.working_hours || 'Dushanba - Shanba: 08:30 - 20:30'}
                  </h4>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Right Column: Quick Registration Form Card (Enters from Right) */}
          <ScrollReveal
            animation="right"
            className="lg:col-span-7 bg-white dark:bg-[#1a2332] rounded-3xl p-6 sm:p-10 border border-gray-200/90 dark:border-gray-800 shadow-2xl relative"
          >
            {submitted ? (
              <div className="py-12 text-center space-y-4 animate-in fade-in zoom-in-95 duration-500">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                  Rahmat! Arizangiz Qabul Qilindi
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 max-w-md mx-auto leading-relaxed">
                  Arizangiz to‘g‘ridan-to‘g‘ri ma’muriyat eslatmalariga yuborildi. Mutaxassisimiz 15 daqiqa ichida siz bilan bog‘lanadi va birinchi bepul sinov darsingiz vaqtini tasdiqlaydi.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95"
                  >
                    Yana ariza qoldirish
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                    <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Tezkor ro‘yxatga olish</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-gray-950 dark:text-white">
                    Bepul sinov darsiga yozilish
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    Ma’lumotlaringizni qoldiring, 15 daqiqa ichida sizga qo‘ng‘iroq qilamiz
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Name field */}
                  <div>
                    <label
                      htmlFor="registration-name-input"
                      className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Ism va familiyangiz *
                    </label>
                    <input
                      id="registration-name-input"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Masalan: Sardor Aliyev"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/70 text-sm font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Phone field */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                        Telefon raqamingiz *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        placeholder="+998 90 123 45 67"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/70 text-sm font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 transition-all"
                      />
                    </div>

                    {/* Custom Styled Select Option for Courses / Subjects */}
                    <div className="relative" ref={dropdownRef}>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                        Qiziqtirgan kurs / fan
                      </label>

                      {/* Custom Select Trigger Button */}
                      <button
                        type="button"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold text-left flex items-center justify-between gap-2 transition-all cursor-pointer shadow-xs ${
                          dropdownOpen
                            ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-white dark:bg-gray-800'
                            : 'border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/70 hover:bg-gray-100/70 dark:hover:bg-gray-800'
                        } ${formData.course ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <BookOpen className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          <span className="truncate">
                            {formData.course || 'Kursni tanlang (ixtiyoriy)'}
                          </span>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ${
                            dropdownOpen ? 'rotate-180 text-emerald-600 dark:text-emerald-400' : ''
                          }`}
                        />
                      </button>

                      {/* Custom Select Dropdown Menu */}
                      {dropdownOpen && (
                        <div className="absolute z-50 left-0 right-0 mt-2 max-h-64 overflow-y-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                          {courseOptions.map((c) => {
                            const isSelected = formData.course === c.title;
                            return (
                              <div
                                key={c.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => {
                                  setFormData({ ...formData, course: c.title });
                                  setDropdownOpen(false);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    setFormData({ ...formData, course: c.title });
                                    setDropdownOpen(false);
                                  }
                                }}
                                className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-2 transition-colors cursor-pointer select-none ${
                                  isSelected
                                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-bold'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-750 text-gray-800 dark:text-gray-200'
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs sm:text-sm font-bold truncate">
                                    {c.title}
                                  </div>
                                  <div className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-0.5">
                                    <span>{c.category}</span>
                                    {c.badge && (
                                      <span className="px-1.5 py-0.2 rounded bg-gray-200/80 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium">
                                        {c.badge}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {isSelected && (
                                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Message field */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Qo‘shimcha savol yoki istak (ixtiyoriy)
                    </label>
                    <textarea
                      rows={3}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Dars vaqti yoki boshqa savollaringiz bo‘lsa yozing..."
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/70 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 transition-all resize-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 dark:from-emerald-600 dark:via-emerald-500 dark:to-teal-700 dark:hover:from-emerald-700 dark:hover:to-teal-800 text-white font-extrabold text-base shadow-xl shadow-blue-700/30 dark:shadow-emerald-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Send className={`w-5 h-5 ${submitting ? 'animate-bounce' : ''}`} />
                  <span>{submitting ? 'Arizangiz qabul qilinmoqda...' : 'Bepul darsga ro‘yxatdan o‘tish'}</span>
                </button>
              </form>
            )}
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
