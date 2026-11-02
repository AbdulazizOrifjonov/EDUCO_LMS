// src/pages/public/components/GallerySection.jsx
import React, { useState, useMemo } from 'react';
import { Camera, Eye, Calendar, Sparkles } from 'lucide-react';
import ScrollReveal from '@/hooks/useScrollReveal';
import { getImageTransformStyle } from '@/services/websiteService';

export default function GallerySection({ gallery = [], onSelectImage = () => {} }) {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = useMemo(() => {
    const set = new Set();
    gallery.forEach((g) => {
      if (g.category) set.add(g.category);
    });
    return ['all', ...Array.from(set)];
  }, [gallery]);

  const filteredGallery = useMemo(() => {
    if (selectedCategory === 'all') return gallery;
    return gallery.filter((g) => g.category === selectedCategory);
  }, [gallery, selectedCategory]);

  return (
    <section id="gallery" className="py-20 overflow-hidden">
      <div className="max-w-[1540px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <ScrollReveal animation="up" className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 dark:bg-emerald-950/60 text-blue-800 dark:text-emerald-300 text-xs font-bold border border-blue-300/60 dark:border-emerald-800/60">
            <Camera className="w-4 h-4 text-blue-600 dark:text-emerald-400" />
            <span>Darslardan Lavhalar</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
            Jonli dars jarayoni va qizg‘in muhit
          </h2>

          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            EDUCO markazimizdagi dars xonalari, laboratoriya mashg‘ulotlari, hakatondagi g‘alabalar va tadbirlardan fotolavhalar.
          </p>

          {/* Filter categories */}
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
                  {cat === 'all' ? 'Barcha rasmlar' : cat}
                </button>
              );
            })}
          </div>
        </ScrollReveal>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGallery.map((item, idx) => (
            <ScrollReveal
              key={item.id || idx}
              animation="zoom"
              delay={(idx % 3) * 100}
              className="relative h-64 sm:h-72 rounded-3xl overflow-hidden shadow-md hover:shadow-2xl group cursor-pointer border border-gray-200/80 dark:border-gray-800 bg-gray-100 dark:bg-gray-800"
              onClick={() => onSelectImage(item)}
            >
              {/* Image */}
              <img
                src={item.image_url || item.image || '/educo-logo.png'}
                alt={item.title}
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/educo-logo.png'; }}
                style={getImageTransformStyle(item, 'center')}
                className="w-full h-full transition-transform duration-700 ease-out"
                loading="lazy"
              />

              {/* Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-300" />

              {/* Hover Zoom Icon */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                  <Eye className="w-6 h-6" />
                </div>
              </div>

              {/* Caption Content */}
              <div className="absolute bottom-0 inset-x-0 p-5 space-y-1.5 text-white">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/80 backdrop-blur-md text-white">
                    {item.category}
                  </span>
                  {item.date && (
                    <span className="opacity-80 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {item.date}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-extrabold line-clamp-1 group-hover:text-emerald-300 transition-colors">
                  {item.title}
                </h3>

                {item.caption && (
                  <p className="text-xs text-gray-200/80 line-clamp-1 font-normal">
                    {item.caption}
                  </p>
                )}
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
