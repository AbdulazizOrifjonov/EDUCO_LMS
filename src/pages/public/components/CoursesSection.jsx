// src/pages/public/components/CoursesSection.jsx
import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Clock,
  User,
  Star,
  ArrowRight,
  Sparkles,
  Layers,
  ChevronRight,
} from 'lucide-react';
import ScrollReveal from '@/hooks/useScrollReveal';
import { getImageTransformStyle } from '@/services/websiteService';

export default function CoursesSection({
  courses = [],
  onSelectCourse = () => {},
  onEnrollCourse,
}) {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = useMemo(() => {
    const set = new Set();
    courses.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return ['all', ...Array.from(set)];
  }, [courses]);

  const filteredCourses = useMemo(() => {
    if (selectedCategory === 'all') return courses;
    return courses.filter((c) => c.category === selectedCategory);
  }, [courses, selectedCategory]);

  const scrollToContact = (courseTitle) => {
    const el = document.getElementById('contact');
    if (el) {
      const yOffset = -80;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });

      // Pre-fill course input if available
      try {
        const select = document.getElementById('registration-course-select');
        if (select) {
          select.value = courseTitle;
        }
      } catch (_) {}
    }
  };

  return (
    <section id="courses" className="py-20 bg-gray-50/60 dark:bg-[#0c121e] overflow-hidden">
      <div className="max-w-[1540px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <ScrollReveal animation="up" className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 dark:bg-emerald-950/60 text-blue-800 dark:text-emerald-300 text-xs font-bold border border-blue-300/60 dark:border-emerald-800/60">
            <BookOpen className="w-4 h-4 text-blue-600 dark:text-emerald-400" />
            <span>Bizning Kurslar</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
            Zamonaviy kasblar va talabgir ta’lim dasturlari
          </h2>

          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Har bir kurs soha mutaxassislari tomonidan xalqaro talablarga mos ravishda tuzilgan bo‘lib, to‘liq amaliyotga asoslangan.
          </p>

          {/* Category Filter Tabs */}
          <div className="flex overflow-x-auto no-scrollbar sm:flex-wrap items-center sm:justify-center gap-2 pt-2 pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 touch-pan-x">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 sm:shrink ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-emerald-600 dark:to-teal-700 text-white shadow-md shadow-blue-600/30 dark:shadow-emerald-600/30 scale-103'
                      : 'bg-white dark:bg-[#1a2332] text-gray-700 dark:text-gray-300 border border-gray-200/80 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {cat === 'all' ? 'Barcha kurslar' : cat}
                </button>
              );
            })}
          </div>
        </ScrollReveal>

        {/* Courses Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredCourses.map((course, idx) => (
            <ScrollReveal
              key={course.id || idx}
              animation="up"
              delay={(idx % 3) * 100}
              className="bg-white dark:bg-[#1a2332] rounded-3xl overflow-hidden border border-gray-200/90 dark:border-gray-800 shadow-md hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col group"
            >
              {/* Card Cover Image */}
              <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-gray-200 dark:bg-gray-800">
                <img
                  src={course.image_url || course.image || '/educo-logo.png'}
                  alt={course.title}
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/educo-logo.png'; }}
                  style={getImageTransformStyle(course, 'center')}
                  className="w-full h-full transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

                {/* Category Pill */}
                <span className="absolute top-3.5 left-3.5 px-3 py-1 rounded-full text-xs font-bold bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-white backdrop-blur-md shadow-sm">
                  {course.category}
                </span>

                {/* Featured Badge */}
                {course.is_featured && (
                  <span className="absolute top-3.5 right-3.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-500 text-white shadow-sm flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    <span>Top Kurs</span>
                  </span>
                )}

                {/* Price Tag in Bottom Left */}
                <div className="absolute bottom-3 left-3.5 text-white">
                  <span className="text-xs opacity-80 block">Oylik to‘lov:</span>
                  <span className="text-lg font-black">{course.price}</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <h3 className="text-lg sm:text-xl font-black text-gray-950 dark:text-white group-hover:text-blue-700 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                    {course.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>

                  {/* Course Meta Info */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-gray-800 text-[11px] sm:text-xs text-gray-600 dark:text-gray-400 font-semibold">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>{course.level}</span>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2 truncate">
                      <User className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                      <span className="truncate">Ustoz: {course.teacher_name}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => onSelectCourse(course)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs sm:text-sm font-bold transition-all cursor-pointer text-center"
                  >
                    Batafsil
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onEnrollCourse) {
                        onEnrollCourse(course);
                      } else {
                        scrollToContact(course.title);
                      }
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 dark:from-emerald-600 dark:to-teal-700 dark:hover:from-emerald-700 dark:hover:to-teal-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 dark:shadow-emerald-600/20 transition-all cursor-pointer text-center flex items-center justify-center gap-1"
                  >
                    <span>Yozilish</span>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </button>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
