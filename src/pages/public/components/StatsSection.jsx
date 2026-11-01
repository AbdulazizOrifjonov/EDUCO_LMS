// src/pages/public/components/StatsSection.jsx
import React from 'react';
import { Users, GraduationCap, BookOpen, Award, Star } from 'lucide-react';
import ScrollReveal from '@/hooks/useScrollReveal';

export default function StatsSection({ settings }) {
  const stats = [
    {
      id: 'students',
      label: 'Faol o‘quvchilar',
      value: settings?.stats_students || '1,250+',
      icon: Users,
      color: 'from-blue-600 to-indigo-600',
      badge: '98% qoniqish',
    },
    {
      id: 'teachers',
      label: 'Professional ustozlar',
      value: settings?.stats_teachers || '48+',
      icon: GraduationCap,
      color: 'from-emerald-600 to-teal-600',
      badge: 'Katta tajriba',
    },
    {
      id: 'courses',
      label: 'Zamonaviy kurslar',
      value: settings?.stats_courses || '24+',
      icon: BookOpen,
      color: 'from-purple-600 to-pink-600',
      badge: 'Amaliy dastur',
    },
    {
      id: 'graduates',
      label: 'Muvaffaqiyatli bitiruvchilar',
      value: settings?.stats_graduates || '3,400+',
      icon: Award,
      color: 'from-amber-600 to-orange-600',
      badge: 'Xalqaro sertifikat',
    },
  ];

  return (
    <section id="stats" className="relative -mt-12 z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <ScrollReveal
              key={stat.id}
              animation="up"
              delay={idx * 100}
              className="bg-white/95 dark:bg-[#1a2332]/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-none hover:-translate-y-1 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-tr ${stat.color} flex items-center justify-center text-white shadow-md shadow-emerald-950/20 group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                  {stat.badge}
                </span>
              </div>

              <div className="space-y-0.5">
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-950 dark:text-white tracking-tight">
                  {stat.value}
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400">
                  {stat.label}
                </p>
              </div>
            </ScrollReveal>
          );
        })}
      </div>
    </section>
  );
}
