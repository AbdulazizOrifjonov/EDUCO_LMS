// src/pages/public/components/HeroSlider.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sparkles,
  BookOpen,
  Users,
  Award,
  Play,
} from 'lucide-react';

export default function HeroSlider({ slides = [], onOpenVideo = () => {} }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartXRef = useRef(0);
  const touchEndXRef = useRef(0);

  const activeSlides = slides.filter((s) => s.is_active);
  const total = activeSlides.length;

  useEffect(() => {
    if (total <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, 5500);
    return () => clearInterval(interval);
  }, [total, isPaused]);

  if (total === 0) return null;

  const currentSlide = activeSlides[currentIndex] || activeSlides[0];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    touchEndXRef.current = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - touchEndXRef.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
  };

  const scrollToTarget = (e, hash) => {
    if (hash && hash.startsWith('#')) {
      e.preventDefault();
      const el = document.getElementById(hash.replace('#', ''));
      if (el) {
        const yOffset = -80;
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
        if (hash === '#contact') {
          setTimeout(() => {
            document.getElementById('registration-name-input')?.focus();
          }, 600);
        }
      }
    }
  };

  const isIos =
    typeof window !== 'undefined' &&
    (/iPhone|iPad|iPod/.test(navigator.userAgent || '') ||
      (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent || '')));

  return (
    <div
      id="top"
      className="relative w-full min-h-[560px] sm:min-h-[640px] lg:min-h-[740px] overflow-hidden bg-gray-950 select-none"
      style={{
        paddingTop: isIos
          ? 'calc(max(env(safe-area-inset-top, 44px), 44px) + 4.5rem)'
          : 'calc(max(env(safe-area-inset-top, 0px), 0px) + 5.25rem)',
        minHeight: isIos
          ? 'calc(580px + max(env(safe-area-inset-top, 44px), 44px))'
          : 'calc(560px + max(env(safe-area-inset-top, 0px), 0px))',
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Slides with Crossfade Animation */}
      {activeSlides.map((slide, idx) => {
        const isActive = idx === currentIndex;
        return (
          <div
            key={slide.id || idx}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            {/* Background Image with Zoom Effect */}
            <div
              className={`absolute inset-0 bg-cover bg-center transition-transform duration-7000 ease-out ${
                isActive ? 'scale-105' : 'scale-100'
              }`}
              style={{
                backgroundImage: `url('${slide.image_url || slide.image || '/educo-logo.png'}')`,
                backgroundSize: slide.fit_mode === 'contain' ? 'contain' : 'cover',
                backgroundPosition: slide.object_position || 'center',
                backgroundRepeat: 'no-repeat',
                transform: `scale(${Number(slide.image_scale || 1) * (isActive ? 1.05 : 1)}) translate(${Number(slide.image_offset_x || 0)}%, ${Number(slide.image_offset_y || 0)}%)`,
                transformOrigin: 'center center',
              }}
            />

            {/* Dark & Brand Gradient Overlays for Maximum Contrast & Readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/75 to-black/45 dark:from-[#080d16]/95 dark:via-[#080d16]/80 dark:to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/35" />

            {/* Subtle Animated Decorative Glow Spots */}
            <div className="absolute top-1/4 left-10 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
            <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />

            {/* Slide Content Box with Generous Side Clearance to NEVER Collide with Navigation Controls */}
            <div className="relative z-20 max-w-[1540px] mx-auto h-full px-4 sm:px-14 md:px-24 lg:px-32 xl:px-44 flex flex-col justify-center">
              <div className="max-w-xl sm:max-w-2xl lg:max-w-3xl space-y-3 sm:space-y-6">
                {/* Badge Pill */}
                {slide.badge && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-blue-500/25 text-blue-200 border border-blue-400/40 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-400/30 text-xs sm:text-sm font-bold backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-500">
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-300 dark:text-emerald-400 shrink-0" />
                    <span>{slide.badge}</span>
                  </div>
                )}

                {/* Main Headline */}
                <h1 className="text-2xl xs:text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight drop-shadow-md animate-in fade-in slide-in-from-left-4 duration-700 break-words">
                  {slide.title}
                </h1>

                {/* Subtitle / Description */}
                <p className="text-xs sm:text-base lg:text-xl text-gray-200/90 font-normal leading-relaxed max-w-2xl drop-shadow-sm animate-in fade-in slide-in-from-left-6 duration-700 delay-150 line-clamp-3 sm:line-clamp-none break-words">
                  {slide.subtitle}
                </p>

                {/* Action CTA Buttons (Uniform Height, Non-wrapping, Sleek Glassmorphic & Modern) */}
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5 pt-2 sm:pt-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                  {/* 1. Sinov darsiga yozilish CTA (Lead Generation) */}
                  <a
                    href="#contact"
                    onClick={(e) => scrollToTarget(e, '#contact')}
                    className="relative overflow-hidden inline-flex items-center justify-center gap-2.5 h-12 sm:h-13 px-5 sm:px-7 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 dark:from-emerald-600 dark:via-teal-600 dark:to-emerald-700 dark:hover:from-emerald-500 dark:hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-blue-900/30 dark:shadow-emerald-950/40 border border-white/20 transition-all hover:scale-102 active:scale-98 cursor-pointer whitespace-nowrap group w-full xs:w-auto shrink-0"
                  >
                    {/* Sweeping Shimmer Light Beam */}
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent skew-x-[-20deg] pointer-events-none animate-shimmer-sweep" />

                    {/* Seamless Round Golden Sparkle Icon */}
                    <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-white/20 dark:bg-white/15 border border-white/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
                    </span>
                    <span className="relative z-10 whitespace-nowrap">Sinov darsiga yozilish</span>
                  </a>

                  {/* 2. Primary CTA: Courses / Teachers */}
                  {slide.cta_text && (
                    <a
                      href={slide.cta_link || '#courses'}
                      onClick={(e) => scrollToTarget(e, slide.cta_link || '#courses')}
                      className="inline-flex items-center justify-center gap-2 h-12 sm:h-13 px-4 sm:px-6 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm backdrop-blur-md border border-white/20 hover:border-white/40 transition-all cursor-pointer hover:scale-102 active:scale-98 shadow-lg shadow-black/20 whitespace-nowrap flex-1 xs:flex-none shrink-0 group"
                    >
                      <span>{slide.cta_text}</span>
                      <ArrowRight className="w-4 h-4 rtl:rotate-180 group-hover:translate-x-1 transition-transform duration-300 text-blue-300 dark:text-emerald-300" />
                    </a>
                  )}

                  {/* 3. Secondary CTA: About Us / Details */}
                  {slide.secondary_cta_text && (
                    <a
                      href={slide.secondary_cta_link || '#about'}
                      onClick={(e) => scrollToTarget(e, slide.secondary_cta_link || '#about')}
                      className="inline-flex items-center justify-center gap-2 h-12 sm:h-13 px-4 sm:px-6 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm backdrop-blur-md border border-white/20 hover:border-white/40 transition-all cursor-pointer hover:scale-102 active:scale-98 shadow-lg shadow-black/20 whitespace-nowrap flex-1 xs:flex-none shrink-0"
                    >
                      <span>{slide.secondary_cta_text}</span>
                    </a>
                  )}

                  {/* 4. Play Video Highlight Pill */}
                  <button
                    type="button"
                    onClick={onOpenVideo}
                    className="inline-flex items-center justify-center gap-2.5 h-12 sm:h-13 px-4 sm:px-5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/20 hover:border-white/40 backdrop-blur-md transition-all hover:scale-102 active:scale-98 cursor-pointer shadow-lg shadow-black/20 whitespace-nowrap shrink-0 group"
                    title="Markaz videolavhasini tomosha qilish"
                  >
                    <div className="relative w-6 h-6 rounded-full bg-blue-600 dark:bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
                      <span className="absolute inset-0 rounded-full bg-blue-400 dark:bg-emerald-400 animate-ping opacity-60" />
                      <Play className="relative z-10 w-2.5 h-2.5 fill-current ml-0.5" />
                    </div>
                    <span>Video</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Extreme-Edge Desktop Side Navigation Arrows (Only on extra wide screens xl+, safely outside text) */}
      {total > 1 && (
        <div className="hidden xl:flex absolute inset-x-4 2xl:inset-x-8 top-1/2 -translate-y-1/2 z-30 justify-between pointer-events-none">
          <button
            type="button"
            onClick={handlePrev}
            className="w-12 h-12 rounded-2xl bg-black/45 hover:bg-black/80 text-white/90 hover:text-white border border-white/25 backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 active:scale-95 pointer-events-auto cursor-pointer shadow-2xl hover:border-white/50 group"
            aria-label="Oldingi slayd"
          >
            <ChevronLeft className="w-6 h-6 rtl:rotate-180 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="w-12 h-12 rounded-2xl bg-black/45 hover:bg-black/80 text-white/90 hover:text-white border border-white/25 backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 active:scale-95 pointer-events-auto cursor-pointer shadow-2xl hover:border-white/50 group"
            aria-label="Keyingi slayd"
          >
            <ChevronRight className="w-6 h-6 rtl:rotate-180 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      )}

      {/* Modern Unified Bottom Navigation Bar (Arrows + Indicators Together - Zero Collision with Text!) */}
      {total > 1 && (
        <div className="absolute bottom-5 sm:bottom-7 inset-x-0 z-30 flex items-center justify-center gap-3">
          {/* Quick Prev Arrow Button */}
          <button
            type="button"
            onClick={handlePrev}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-black/50 hover:bg-black/80 text-white/90 hover:text-white border border-white/25 backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-lg"
            aria-label="Oldingi slayd"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 rtl:rotate-180" />
          </button>

          {/* Dots Pill Container */}
          <div className="flex items-center gap-2 bg-black/45 px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-md shadow-lg">
            {activeSlides.map((_, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    isActive
                      ? 'w-7 sm:w-8 h-2.5 bg-blue-500 shadow-md shadow-blue-500/60 dark:bg-emerald-400 dark:shadow-emerald-400/60'
                      : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/80'
                  }`}
                  aria-label={`Slayd ${idx + 1}`}
                />
              );
            })}
          </div>

          {/* Quick Next Arrow Button */}
          <button
            type="button"
            onClick={handleNext}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-black/50 hover:bg-black/80 text-white/90 hover:text-white border border-white/25 backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-lg"
            aria-label="Keyingi slayd"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 rtl:rotate-180" />
          </button>
        </div>
      )}
    </div>
  );
}
