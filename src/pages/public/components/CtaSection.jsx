// src/pages/public/components/CtaSection.jsx
import React, { useState } from 'react';
import {
  Send,
  PhoneCall,
  Mail,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import ScrollReveal from '@/hooks/useScrollReveal';

export default function CtaSection({ settings, courses = [] }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '+998 ',
    course: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Iltimos, ismingizni kiriting');
      return;
    }
    if (formData.phone.trim().length < 9) {
      toast.error('Iltimos, to‘g‘ri telefon raqamingizni kiriting');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      toast.success('Arizangiz muvaffaqiyatli qabul qilindi! Menejerimiz tez orada bog‘lanadi.');
      setFormData({ name: '', phone: '+998 ', course: '', message: '' });
    }, 600);
  };

  return (
    <section id="contact" className="py-20 lg:py-28 relative overflow-hidden">
      {/* Background Radial Glows */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Contact Details (Enters from Left) */}
          <ScrollReveal animation="left" className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-300/60 dark:border-emerald-800/60">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
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
                className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-[#1a2332] border border-gray-200/80 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-emerald-500/50 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <PhoneCall className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    Tezkor Aloqa Raqami:
                  </span>
                  <h4 className="text-base font-extrabold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
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
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                  Rahmat! Arizangiz Qabul Qilindi
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                  Tez orada mutaxassisimiz siz bilan telefon orqali bog‘lanadi va sinov darsi vaqtini belgilab beradi.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors cursor-pointer"
                >
                  Yana ariza qoldirish
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <div className="space-y-1">
                  <h3 className="text-xl sm:text-2xl font-black text-gray-950 dark:text-white">
                    Bepul sinov darsiga yozilish
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    Ma’lumotlaringizni qoldiring, 15 daqiqa ichida sizga qo‘ng‘iroq qilamiz
                  </p>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Ism va familiyangiz *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Masalan: Sardor Aliyev"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/70 text-sm font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                        Telefon raqamingiz *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+998 90 123 45 67"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/70 text-sm font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                        Qiziqtirgan kurs
                      </label>
                      <select
                        id="registration-course-select"
                        value={formData.course}
                        onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/70 text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
                      >
                        <option value="">Kursni tanlang (ixtiyoriy)</option>
                        {courses.map((c) => (
                          <option key={c.id} value={c.title}>
                            {c.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Qo‘shimcha savol yoki istak (ixtiyoriy)
                    </label>
                    <textarea
                      rows={3}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Dars vaqti yoki boshqa savollaringiz bo‘lsa yozing..."
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/70 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-base shadow-xl shadow-emerald-600/30 transition-all hover:scale-101 active:scale-99 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  <span>{submitting ? 'Yuborilmoqda...' : 'Bepul darsga ro‘yxatdan o‘tish'}</span>
                </button>
              </form>
            )}
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
