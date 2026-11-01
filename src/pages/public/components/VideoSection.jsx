// src/pages/public/components/VideoSection.jsx
import React from 'react';
import { Play, Video, Clock, ArrowRight } from 'lucide-react';
import ScrollReveal from '@/hooks/useScrollReveal';

export default function VideoSection({ videos = [], onSelectVideo = () => {} }) {
  return (
    <section id="videos" className="py-20 bg-gray-50/60 dark:bg-[#0c121e] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <ScrollReveal animation="up" className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 text-xs font-bold border border-rose-300/60 dark:border-rose-800/60">
            <Video className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>Video Lavhalar</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
            Darslar va bitiruvchilarimiz haqida videoroliklar
          </h2>

          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            O‘quv jarayoni, masterklasslar va muvaffaqiyatga erishgan talabalarimiz intervyularini video formatda tomosha qiling.
          </p>
        </ScrollReveal>

        {/* Video Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {videos.map((video, idx) => (
            <ScrollReveal
              key={video.id || idx}
              animation="up"
              delay={(idx % 3) * 100}
              className="bg-white dark:bg-[#1a2332] rounded-3xl overflow-hidden border border-gray-200/90 dark:border-gray-800 shadow-md hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group cursor-pointer"
              onClick={() => onSelectVideo(video)}
            >
              <div>
                {/* Thumbnail with Play Icon */}
                <div className="relative h-52 w-full overflow-hidden bg-gray-900">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 opacity-90"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-blue-600 dark:bg-emerald-600 text-white flex items-center justify-center shadow-xl group-hover:scale-115 transition-transform">
                      <Play className="w-6 h-6 fill-current ml-1" />
                    </div>
                  </div>

                  {/* Duration Badge */}
                  {video.duration && (
                    <span className="absolute bottom-3 right-3 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-black/70 text-white backdrop-blur-md flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {video.duration}
                    </span>
                  )}

                  {/* Category Pill */}
                  <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-white backdrop-blur-md">
                    {video.category || 'Video'}
                  </span>
                </div>

                {/* Body */}
                <div className="p-5 space-y-2">
                  <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                    {video.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                    {video.description}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
                <span>Videoni tomosha qilish</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
