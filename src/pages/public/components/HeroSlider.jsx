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

  return (
    <div
      id="top"
      className="relative w-full h-[620px] sm:h-[680px] lg:h-[740px] overflow-hidden bg-gray-950 select-none pt-20"
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
              }}
            />

            {/* Dark & Brand Gradient Overlays for Maximum Contrast & Readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/75 to-black/45 dark:from-[#080d16]/95 dark:via-[#080d16]/80 dark:to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/35" />

            {/* Subtle Animated Decorative Glow Spots */}
            <div className="absolute top-1/4 left-10 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
            <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />

            {/* Slide Content Box */}
            <div className="relative z-20 max-w-[1540px] mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
              <div className="max-w-2xl sm:max-w-3xl space-y-4 sm:space-y-6">
                {/* Badge Pill */}
                {slide.badge && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/25 text-blue-200 border border-blue-400/40 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-400/30 text-xs sm:text-sm font-bold backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-500">
                    <Sparkles className="w-4 h-4 text-blue-300 dark:text-emerald-400 shrink-0" />
                    <span>{slide.badge}</span>
                  </div>
                )}

                {/* Main Headline */}
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight drop-shadow-md animate-in fade-in slide-in-from-left-4 duration-700">
                  {slide.title}
                </h1>

                {/* Subtitle / Description */}
                <p className="text-sm sm:text-lg lg:text-xl text-gray-200/90 font-normal leading-relaxed max-w-2xl drop-shadow-sm animate-in fade-in slide-in-from-left-6 duration-700 delay-150">
                  {slide.subtitle}
                </p>

                {/* Action CTA Buttons */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2 sm:pt-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                  {/* Sinov darsiga yozilish CTA (Direct scroll to registration form) */}
                  <a
                    href="#contact"
                    onClick={(e) => scrollToTarget(e, '#contact')}
                    className="inline-flex items-center gap-2.5 px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-emerald-950/40 hover:scale-103 active:scale-97 transition-all cursor-pointer ring-2 ring-emerald-300/40"
                  >
                    <span className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-amber-300" />
                    </span>
                    <span>Sinov darsiga yozilish</span>
                  </a>

                  {/* Primary CTA: Courses */}
                  <a
                    href={slide.cta_link || '#courses'}
                    onClick={(e) => scrollToTarget(e, slide.cta_link || '#courses')}
                    className="inline-flex items-center gap-2.5 px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm sm:text-base backdrop-blur-md border border-white/25 hover:border-white/40 transition-all cursor-pointer hover:scale-102 active:scale-98"
                  >
                    <span>{slide.cta_text || 'Kurslar katalogi'}</span>
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </a>

                  {/* Secondary CTA */}
                  {slide.secondary_cta_text && (
                    <a
                      href={slide.secondary_cta_link || '#about'}
                      onClick={(e) => scrollToTarget(e, slide.secondary_cta_link || '#about')}
                      className="inline-flex items-center gap-2 px-5 sm:px-7 py-3.5 sm:py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm sm:text-base backdrop-blur-md border border-white/25 hover:border-white/40 transition-all cursor-pointer hover:scale-102 active:scale-98"
                    >
                      <span>{slide.secondary_cta_text}</span>
                    </a>
                  )}

                  {/* Play Video Highlight Pill */}
                  <button
                    type="button"
                    onClick={onOpenVideo}
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-black/40 hover:bg-black/60 text-white/90 text-xs sm:text-sm font-semibold border border-white/15 backdrop-blur-md transition-colors cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-600 dark:bg-emerald-500 text-white flex items-center justify-center shrink-0">
                      <Play className="w-3 h-3 fill-current ml-0.5" />
                    </div>
                    <span className="hidden sm:inline">Markaz videosi</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Manual Navigation Arrows (Desktop & Tablet) */}
      {total > 1 && (
        <div className="hidden sm:flex absolute inset-x-4 top-1/2 -translate-y-1/2 z-30 justify-between pointer-events-none">
          <button
            type="button"
            onClick={handlePrev}
            className="w-12 h-12 rounded-2xl bg-black/40 hover:bg-black/70 text-white/90 hover:text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 active:scale-95 pointer-events-auto cursor-pointer shadow-xl"
            aria-label="Oldingi slayd"
          >
            <ChevronLeft className="w-6 h-6 rtl:rotate-180" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="w-12 h-12 rounded-2xl bg-black/40 hover:bg-black/70 text-white/90 hover:text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 active:scale-95 pointer-events-auto cursor-pointer shadow-xl"
            aria-label="Keyingi slayd"
          >
            <ChevronRight className="w-6 h-6 rtl:rotate-180" />
          </button>
        </div>
      )}

      {/* Pagination Dot Indicators */}
      {total > 1 && (
        <div className="absolute bottom-6 inset-x-0 z-30 flex items-center justify-center gap-2.5">
          {activeSlides.map((_, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  isActive
                    ? 'w-9 h-3 bg-blue-500 shadow-md shadow-blue-500/50 dark:bg-emerald-400 dark:shadow-emerald-400/50'
                    : 'w-3 h-3 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Slayd ${idx + 1}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
