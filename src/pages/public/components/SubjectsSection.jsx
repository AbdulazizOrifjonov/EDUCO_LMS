// src/pages/public/components/SubjectsSection.jsx
import React from 'react';
import {
  Code,
  Globe,
  Palette,
  Calculator,
  Cpu,
  Sparkles,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import ScrollReveal from '@/hooks/useScrollReveal';

export default function SubjectsSection({ subjects = [] }) {
  const getIcon = (iconName) => {
    switch (iconName) {
      case 'Code':
        return Code;
      case 'Globe':
        return Globe;
      case 'Palette':
        return Palette;
      case 'Calculator':
        return Calculator;
      case 'Cpu':
        return Cpu;
      default:
        return Sparkles;
    }
  };

  const scrollToCourses = () => {
    const el = document.getElementById('courses');
    if (el) {
      const yOffset = -80;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <section id="subjects" className="py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <ScrollReveal animation="up" className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-xs font-bold border border-blue-300/60 dark:border-blue-800/60">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Fanlar & Yo‘nalishlar</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
            Qiziqishingizga mos o‘quv sohasini tanlang
          </h2>

          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            EDUCO markazida zamonaviy raqamli iqtisodiyot talablariga to‘liq javob beruvchi asosiy bilim yo‘nalishlari mavjud.
          </p>
        </ScrollReveal>

        {/* Subjects Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((sub, idx) => {
            const Icon = getIcon(sub.icon_name);
            return (
              <ScrollReveal
                key={sub.id || idx}
                animation={idx % 2 === 0 ? 'left' : 'right'}
                delay={(idx % 3) * 80}
                className="p-6 rounded-3xl bg-white dark:bg-[#1a2332] border border-gray-200/80 dark:border-gray-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
                onClick={scrollToCourses}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${sub.color || 'from-emerald-600 to-teal-700'} flex items-center justify-center text-white shadow-md shadow-emerald-950/20 group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-7 h-7" />
                    </div>

                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      {sub.courses_count || 1} ta kurs
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-xl font-black text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {sub.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {sub.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
                  <span>Kurslarni ko‘rish</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
