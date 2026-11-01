// src/pages/public/components/AboutSection.jsx
import React from 'react';
import {
  CheckCircle2,
  Compass,
  Target,
  Sparkles,
  Zap,
  ShieldCheck,
  Laptop,
  Briefcase,
  Users,
} from 'lucide-react';
import ScrollReveal from '@/hooks/useScrollReveal';

export default function AboutSection({ settings }) {
  const advantages = [
    {
      title: '100% Amaliy Ta’lim',
      desc: 'Quruq nazariyadan xoli, har bir darsda real keyslar va kompaniya loyihalari ustida ishlash.',
      icon: Laptop,
      color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/60',
    },
    {
      title: 'Zamonaviy EDUCO LMS',
      desc: 'Davomat, baholar, jonli chat, dumaloq video xabarlar va ota-onalar nazorati bitta platformada.',
      icon: Zap,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60',
    },
    {
      title: 'Xalqaro Tajribali Ustozlar',
      desc: 'Yirik IT kompaniyalar va nufuzli universitetlarda ta’lim olgan kuchli mentorlar jamoasi.',
      icon: ShieldCheck,
      color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/60',
    },
    {
      title: 'Karyera va Ishga Joylashish',
      desc: 'Bitiruvchilar uchun portfolio yaratish, rezyume tayyorlash va hamkor korxonalarga tavsiya etish.',
      icon: Briefcase,
      color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/60',
    },
  ];

  return (
    <section id="about" className="py-20 lg:py-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Mission, Vision & Description (Enters from Left) */}
          <ScrollReveal animation="left" className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-300/60 dark:border-emerald-800/60">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Biz haqimizda</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white leading-tight tracking-tight">
              {settings?.about_title || 'Kelajak liderlarini tayyorlaydigan innovatsion markaz'}
            </h2>

            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              {settings?.about_description ||
                'EDUCO — bu ilg‘or xalqaro ta’lim standartlari asosida tashkil etilgan zamonaviy ta’lim ekotizimi. Biz har bir o‘quvchining individual iqtidorini kashf etish, chuqur amaliy ko‘nikmalar berish va zamonaviy IT hamda aniq fanlar sohasida yetakchi mutaxassis bo‘lib yetishishiga ko‘maklashamiz.'}
            </p>

            {/* Mission & Vision Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1a2332] border border-gray-200/80 dark:border-gray-800 shadow-sm space-y-2">
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Target className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                  {settings?.mission_title || 'Bizning Missiyamiz'}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  {settings?.mission_desc ||
                    'Har bir yoshga zamonaviy bilim, amaliy tajriba va mustahkam kelajak poydevorini taqdim etish.'}
                </p>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1a2332] border border-gray-200/80 dark:border-gray-800 shadow-sm space-y-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Compass className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                  {settings?.vision_title || 'Bizning Viziyamiz'}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  {settings?.vision_desc ||
                    'O‘zbekistonda xalqaro miqyosdagi eng ilg‘or va natijador ta’lim ekotizimiga aylanish.'}
                </p>
              </div>
            </div>
          </ScrollReveal>

          {/* Right Column: Key Educational Advantages Grid (Enters from Right) */}
          <ScrollReveal animation="right" className="lg:col-span-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {advantages.map((adv, idx) => {
                const Icon = adv.icon;
                return (
                  <div
                    key={idx}
                    className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#1a2332] border border-gray-100 dark:border-gray-800/80 shadow-md shadow-gray-200/40 dark:shadow-none hover:shadow-xl hover:-translate-y-1 transition-all duration-300 space-y-3 group"
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${adv.color} group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-extrabold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {adv.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {adv.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Trust Quote Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-600/10 via-teal-600/10 to-blue-600/10 dark:from-emerald-950/40 dark:to-blue-950/40 border border-emerald-500/20 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 font-black text-lg">
                ✓
              </div>
              <p className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200">
                EDUCO ta’lim markazi orqali o‘qigan 3,400+ bitiruvchilarning 98% qismi o‘z sohasida nufuzli korxonalarga ishga kirdi yoki IELTS 7.0+ sertifikatiga ega bo‘ldi.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
