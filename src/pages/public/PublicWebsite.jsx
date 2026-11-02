import React, { useState, useEffect, useCallback } from 'react';
import websiteService from '@/services/websiteService';
import PublicNavbar from './components/PublicNavbar';
import PublicAnimatedBackground from './components/PublicAnimatedBackground';
import HeroSlider from './components/HeroSlider';
import StatsSection from './components/StatsSection';
import AboutSection from './components/AboutSection';
import CoursesSection from './components/CoursesSection';
import SubjectsSection from './components/SubjectsSection';
import TeachersSection from './components/TeachersSection';
import GallerySection from './components/GallerySection';
import VideoSection from './components/VideoSection';
import NewsSection from './components/NewsSection';
import TestimonialsSection from './components/TestimonialsSection';
import CtaSection from './components/CtaSection';
import PublicFooter from './components/PublicFooter';
import {
  CourseDetailModal,
  TeacherModal,
  NewsDetailModal,
  LightboxModal,
  VideoPlayerModal,
} from './components/PublicModals';
import { Send, Phone } from 'lucide-react';

export default function PublicWebsite() {
  // Live website content states
  const [settings, setSettings] = useState(() => (websiteService.getWebsiteSettings ? websiteService.getWebsiteSettings() : websiteService.getSettings?.() || {}));
  const [slides, setSlides] = useState(() => (websiteService.getHeroSlides ? websiteService.getHeroSlides() : websiteService.getSlides?.() || []));
  const [courses, setCourses] = useState(() => (websiteService.getWebsiteCourses ? websiteService.getWebsiteCourses() : websiteService.getCourses?.() || []));
  const [subjects, setSubjects] = useState(() => (websiteService.getWebsiteSubjects ? websiteService.getWebsiteSubjects() : websiteService.getSubjects?.() || []));
  const [teachers, setTeachers] = useState(() => (websiteService.getWebsiteTeachers ? websiteService.getWebsiteTeachers() : websiteService.getTeachers?.() || []));
  const [gallery, setGallery] = useState(() => (websiteService.getWebsiteGallery ? websiteService.getWebsiteGallery() : websiteService.getGallery?.() || []));
  const [videos, setVideos] = useState(() => (websiteService.getWebsiteVideos ? websiteService.getWebsiteVideos() : websiteService.getVideos?.() || []));
  const [news, setNews] = useState(() => (websiteService.getWebsiteNews ? websiteService.getWebsiteNews() : websiteService.getNews?.() || []));
  const [testimonials, setTestimonials] = useState(() => (websiteService.getWebsiteTestimonials ? websiteService.getWebsiteTestimonials() : websiteService.getTestimonials?.() || []));

  // Modal inspection states
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedNews, setSelectedNews] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null);

  // CTA form pre-fill from course selection
  const [prefilledCourseTitle, setPrefilledCourseTitle] = useState('');

  // Synchronize state with websiteService
  const refreshWebsiteData = useCallback(() => {
    setSettings(websiteService.getWebsiteSettings ? websiteService.getWebsiteSettings() : websiteService.getSettings?.() || {});
    setSlides(websiteService.getHeroSlides ? websiteService.getHeroSlides() : websiteService.getSlides?.() || []);
    setCourses(websiteService.getWebsiteCourses ? websiteService.getWebsiteCourses() : websiteService.getCourses?.() || []);
    setSubjects(websiteService.getWebsiteSubjects ? websiteService.getWebsiteSubjects() : websiteService.getSubjects?.() || []);
    setTeachers(websiteService.getWebsiteTeachers ? websiteService.getWebsiteTeachers() : websiteService.getTeachers?.() || []);
    setGallery(websiteService.getWebsiteGallery ? websiteService.getWebsiteGallery() : websiteService.getGallery?.() || []);
    setVideos(websiteService.getWebsiteVideos ? websiteService.getWebsiteVideos() : websiteService.getVideos?.() || []);
    setNews(websiteService.getWebsiteNews ? websiteService.getWebsiteNews() : websiteService.getNews?.() || []);
    setTestimonials(websiteService.getWebsiteTestimonials ? websiteService.getWebsiteTestimonials() : websiteService.getTestimonials?.() || []);
  }, []);

  useEffect(() => {
    // Listen for live updates broadcast from the admin/owner management dashboard
    window.addEventListener('educo-website-update', refreshWebsiteData);
    window.addEventListener('educo-data-sync', refreshWebsiteData);
    window.addEventListener('storage', refreshWebsiteData);

    return () => {
      window.removeEventListener('educo-website-update', refreshWebsiteData);
      window.removeEventListener('educo-data-sync', refreshWebsiteData);
      window.removeEventListener('storage', refreshWebsiteData);
    };
  }, [refreshWebsiteData]);

  // Handle course enrollment click (pre-fill CTA form and scroll smoothly)
  const handleEnrollCourse = (course) => {
    setSelectedCourse(null);
    const title = course?.title || (typeof course === 'string' ? course : '');
    setPrefilledCourseTitle(title);
    const ctaEl = document.getElementById('contact') || document.getElementById('aloqa');
    if (ctaEl) {
      const yOffset = -80;
      const y = ctaEl.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50/50 dark:bg-[#060b14] text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-600 dark:selection:bg-emerald-500 selection:text-white transition-colors duration-500 overflow-x-hidden">
      {/* Dynamic Animated Background with Ambient Orbs & Floating Stars for Tun & Kun */}
      <PublicAnimatedBackground />

      {/* 1. Header & Sticky Navbar */}
      <PublicNavbar settings={settings} />

      <main className="relative z-10 overflow-hidden">
        {/* 2. Hero Section with Managed Multi-Slide Carousel */}
        <HeroSlider
          slides={slides}
          onOpenVideo={() => {
            if (videos && videos.length > 0) {
              setActiveVideo(videos[0]);
            }
          }}
        />

        {/* 3. Statistics Section (Real-time animated counters) */}
        <StatsSection settings={settings} />

        {/* 4. About EDUCO (Mission, vision, values, why choose us) */}
        <AboutSection settings={settings} />

        {/* 5. Courses Section (Interactive catalog with filter & detail modal) */}
        <CoursesSection
          courses={courses}
          onSelectCourse={(c) => setSelectedCourse(c)}
          onEnrollCourse={handleEnrollCourse}
        />

        {/* 6. Subjects Section (Fanlar cards) */}
        <SubjectsSection subjects={subjects} />

        {/* 7. Teachers Section (Professional ustozlar) */}
        <TeachersSection
          teachers={teachers}
          onSelectTeacher={(t) => setSelectedTeacher(t)}
        />

        {/* 8. Lessons Gallery (Darslardan lavhalar with Lightbox) */}
        <GallerySection
          gallery={gallery}
          onSelectImage={(img) => setSelectedImage(img)}
        />

        {/* 9. Video Gallery (Video lavhalar with interactive player) */}
        <VideoSection
          videos={videos}
          onPlayVideo={(v) => setActiveVideo(v)}
          onSelectVideo={(v) => setActiveVideo(v)}
        />

        {/* 10. News & Announcements (Yangiliklar va e'lonlar) */}
        <NewsSection
          news={news}
          onSelectNews={(n) => setSelectedNews(n)}
        />

        {/* 11. Testimonials (O'quvchilar va ota-onalar fikrlari) */}
        <TestimonialsSection testimonials={testimonials} />

        {/* 12. Call to Action & Direct Application Form */}
        <CtaSection
          settings={settings}
          courses={courses}
          prefilledCourse={prefilledCourseTitle}
        />

        {/* 13. Public Footer */}
        <PublicFooter settings={settings} />
      </main>

      {/* Floating Quick Contact Dock (Telegram & Phone Call - Sleek & Compact for Mobile) */}
      <div className="fixed bottom-4 right-3.5 sm:bottom-6 sm:right-7 z-40 flex flex-col items-end gap-2 select-none pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Telegram Direct Floating Button */}
        <a
          href={settings?.telegram || "https://t.me/educomarkaz36"}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center justify-center w-11 h-11 sm:w-auto sm:h-auto sm:px-3.5 sm:py-2.5 rounded-full bg-[#229ED9] hover:bg-[#1b8bc2] text-white shadow-xl hover:shadow-[#229ED9]/40 transition-all hover:scale-105 active:scale-95 cursor-pointer ring-2 ring-white/30"
          title="Telegram orqali savol berish (@educomarkaz36)"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-4 sm:h-4 shrink-0 fill-white" aria-hidden="true">
            <path d="m20.665 3.717-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l-.313 4.69c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.785l3.019-14.228c.309-1.239-.473-1.8-1.282-1.431z" />
          </svg>
          <span className="text-xs font-bold hidden sm:inline">Telegram: @educomarkaz36</span>
        </a>

        {/* Phone Call Floating Button */}
        <a
          href={`tel:${settings?.phone?.replace(/\D/g, '') || '998995418989'}`}
          className="group flex items-center justify-center w-11 h-11 sm:w-auto sm:h-auto sm:px-3.5 sm:py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl hover:shadow-emerald-600/40 transition-all hover:scale-105 active:scale-95 cursor-pointer ring-2 ring-white/30"
          title="Tezkor qo‘ng‘iroq: +998 (99) 541-89-89"
        >
          <Phone className="w-5 h-5 sm:w-4 sm:h-4" />
          <span className="text-xs font-bold hidden sm:inline">{settings?.phone || '+998 (99) 541-89-89'}</span>
        </a>
      </div>

      {/* Interactive Modals */}
      {selectedCourse && (
        <CourseDetailModal
          course={selectedCourse}
          onClose={() => setSelectedCourse(null)}
          onEnroll={handleEnrollCourse}
        />
      )}

      {selectedTeacher && (
        <TeacherModal
          teacher={selectedTeacher}
          onClose={() => setSelectedTeacher(null)}
        />
      )}

      {selectedNews && (
        <NewsDetailModal
          news={selectedNews}
          onClose={() => setSelectedNews(null)}
        />
      )}

      {selectedImage && (
        <LightboxModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}

      {activeVideo && (
        <VideoPlayerModal
          video={activeVideo}
          onClose={() => setActiveVideo(null)}
        />
      )}
    </div>
  );
}
