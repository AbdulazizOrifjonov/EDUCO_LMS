// src/pages/public/components/NewsSection.jsx
import React from 'react';
import { Newspaper, Calendar, Eye, ArrowRight } from 'lucide-react';
import ScrollReveal from '@/hooks/useScrollReveal';
import { getImageTransformStyle } from '@/services/websiteService';

export default function NewsSection({ news = [], onSelectNews = () => {} }) {
  return (
    <section id="news" className="py-20 overflow-hidden">
      <div className="max-w-[1540px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <ScrollReveal animation="up" className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 dark:bg-emerald-950/60 text-blue-800 dark:text-emerald-300 text-xs font-bold border border-blue-300/60 dark:border-emerald-800/60">
            <Newspaper className="w-4 h-4 text-blue-600 dark:text-emerald-400" />
            <span>Yangiliklar & E’lonlar</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
            Markaz hayotiga oid so‘nggi yangiliklar
          </h2>

          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Qabul jarayonlari, olimpiada natijalari, ochiq darslar va yangi kurslar haqidagi eng so‘nggi xabarlar.
          </p>
        </ScrollReveal>

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {news.map((item, idx) => (
            <ScrollReveal
              key={item.id || idx}
              animation="up"
              delay={(idx % 3) * 100}
              className="bg-white dark:bg-[#1a2332] rounded-3xl overflow-hidden border border-gray-200/90 dark:border-gray-800 shadow-md hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group cursor-pointer"
              onClick={() => onSelectNews(item)}
            >
              <div>
                {/* News Image */}
                <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <img
                    src={item.cover_image || item.image || item.image_url || '/educo-logo.png'}
                    alt={item.title}
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/educo-logo.png'; }}
                    style={getImageTransformStyle(item, 'center')}
                    className="w-full h-full transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Category Pill */}
                  <span className="absolute top-3.5 left-3.5 px-3 py-1 rounded-full text-xs font-bold bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-white backdrop-blur-md">
                    {item.category}
                  </span>
                </div>

                {/* Body */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 font-semibold">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {item.published_at}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {item.views || 0} marta o‘qildi
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed">
                    {item.excerpt}
                  </p>
                </div>
              </div>

              {/* Read More */}
              <div className="p-5 pt-0 flex items-center justify-between text-xs font-bold text-blue-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
                <span>Batafsil o‘qish</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
