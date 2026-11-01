// src/pages/public/components/TestimonialsSection.jsx
import React from 'react';
import { Star, MessageSquareQuote, CheckCircle2 } from 'lucide-react';
import ScrollReveal from '@/hooks/useScrollReveal';

export default function TestimonialsSection({ testimonials = [] }) {
  return (
    <section className="py-20 bg-gray-50/60 dark:bg-[#0c121e] overflow-hidden">
      <div className="max-w-[1540px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <ScrollReveal animation="up" className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-300/60 dark:border-amber-800/60">
            <MessageSquareQuote className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>O‘quvchilar Fikrlari</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
            Biz haqimizda o‘quvchilar va ota-onalar nima deydi?
          </h2>

          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Haqiqiy natijalar, samimiy minnatdorchilik va o‘quvchilarimizning muvaffaqiyat hikoyalari.
          </p>
        </ScrollReveal>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {testimonials.map((item, idx) => (
            <ScrollReveal
              key={item.id || idx}
              animation="up"
              delay={idx * 120}
              className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#1a2332] border border-gray-200/90 dark:border-gray-800 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-5"
            >
              <div className="space-y-4">
                {/* Rating Stars */}
                <div className="flex items-center gap-1 text-amber-400">
                  {Array.from({ length: item.rating || 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>

                {/* Review Text */}
                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">
                  "{item.text}"
                </p>
              </div>

              {/* Author Info */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center gap-3">
                <img
                  src={item.avatar_url}
                  alt={item.author_name}
                  className="w-11 h-11 rounded-full object-cover border-2 border-emerald-500 shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    {item.author_name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {item.author_role}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
