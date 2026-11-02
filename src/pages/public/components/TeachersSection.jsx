// src/pages/public/components/TeachersSection.jsx
import React from 'react';
import {
  Users,
  GraduationCap,
  Award,
  ArrowRight,
  Send,
  Sparkles,
  Star,
} from 'lucide-react';
import ScrollReveal from '@/hooks/useScrollReveal';
import { getImageTransformStyle } from '@/services/websiteService';

export default function TeachersSection({ teachers = [], onSelectTeacher = () => {} }) {
  return (
    <section id="teachers" className="py-20 bg-gray-50/60 dark:bg-[#0c121e] overflow-hidden">
      <div className="max-w-[1540px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <ScrollReveal animation="up" className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 dark:bg-emerald-950/60 text-blue-800 dark:text-emerald-300 text-xs font-bold border border-blue-300/60 dark:border-emerald-800/60">
            <Users className="w-4 h-4 text-blue-600 dark:text-emerald-400" />
            <span>Bizning Ustozlar</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
            Tajribali va xalqaro sertifikatga ega mentorlar
          </h2>

          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Har bir ustozimiz o‘z sohasining yetakchi amaliyotchi mutaxassisi bo‘lib, o‘quvchilarni noldan natijagacha yo‘naltiradi.
          </p>
        </ScrollReveal>

        {/* Teachers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {teachers.map((teacher, idx) => (
            <ScrollReveal
              key={teacher.id || idx}
              animation="up"
              delay={(idx % 4) * 100}
              className="bg-white dark:bg-[#1a2332] rounded-3xl overflow-hidden border border-gray-200/90 dark:border-gray-800 shadow-md hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Teacher Photo */}
                <div className="relative h-64 w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <img
                    src={teacher.image_url || teacher.photo || teacher.photo_url || '/educo-logo.png'}
                    alt={teacher.full_name || teacher.name}
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/educo-logo.png'; }}
                    style={getImageTransformStyle(teacher, 'top')}
                    className="w-full h-full transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />

                  {/* Experience Badge */}
                  <span className="absolute bottom-3 left-3 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-600 dark:bg-emerald-500 text-white shadow-md">
                    {teacher.experience_years} tajriba
                  </span>

                  {/* Telegram / Social Link */}
                  {teacher.telegram && (
                    <a
                      href={teacher.telegram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 hover:bg-blue-600 text-white flex items-center justify-center backdrop-blur-md transition-colors"
                      title="Telegram orqali bog‘lanish"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 space-y-2">
                  <h3 className="text-lg font-black text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-emerald-400 transition-colors">
                    {teacher.full_name}
                  </h3>

                  <p className="text-xs font-bold text-blue-700 dark:text-emerald-400">
                    {teacher.role}
                  </p>

                  <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                    {teacher.specialization}
                  </p>

                  <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-3 pt-1 leading-relaxed">
                    {teacher.bio}
                  </p>
                </div>
              </div>

              {/* View Profile Button */}
              <div className="p-5 pt-0">
                <button
                  type="button"
                  onClick={() => onSelectTeacher(teacher)}
                  className="w-full py-2.5 px-3 rounded-xl bg-gray-100 hover:bg-blue-50 dark:bg-gray-800 dark:hover:bg-emerald-950/40 text-gray-900 dark:text-gray-100 hover:text-blue-700 dark:hover:text-emerald-400 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Batafsil ma’lumot</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </button>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
