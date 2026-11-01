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
