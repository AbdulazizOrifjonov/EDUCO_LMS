import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Globe,
  Sliders,
  BookOpen,
  GraduationCap,
  Users,
  Image as ImageIcon,
  Video,
  Newspaper,
  MessageSquareQuote,
  Settings,
  Plus,
  Trash2,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  ExternalLink,
  Save,
  RefreshCw,
  Search,
  ArrowUp,
  ArrowDown,
  Layers,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Clock,
  Award,
  Star,
  Check,
  X,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import websiteService from '@/services/websiteService';

const SUB_MODULES = [
  { id: 'overview', label: 'Umumiy hisobot', icon: Layers },
  { id: 'slider', label: 'Bosh sahifa slayderi', icon: Sliders },
  { id: 'courses', label: 'Kurslar', icon: BookOpen },
  { id: 'subjects', label: 'Fanlar', icon: GraduationCap },
  { id: 'teachers', label: 'Ustozlar', icon: Users },
  { id: 'news', label: 'Yangiliklar', icon: Newspaper },
  { id: 'videos', label: 'Video lavhalar', icon: Video },
  { id: 'gallery', label: 'Darslardan lavhalar', icon: ImageIcon },
  { id: 'testimonials', label: 'Fikrlar va sharhlar', icon: MessageSquareQuote },
  { id: 'about', label: 'Biz haqimizda & Statistika', icon: Sparkles },
  { id: 'settings', label: 'Website sozlamalari', icon: Settings },
];

export default function WebsiteManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';

  const setTab = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  // State data from websiteService
  const [settings, setSettings] = useState(() => (websiteService.getWebsiteSettings ? websiteService.getWebsiteSettings() : websiteService.getSettings?.() || {}));
  const [slides, setSlides] = useState(() => (websiteService.getHeroSlides ? websiteService.getHeroSlides() : websiteService.getSlides?.() || []));
  const [courses, setCourses] = useState(() => (websiteService.getWebsiteCourses ? websiteService.getWebsiteCourses() : websiteService.getCourses?.() || []));
  const [subjects, setSubjects] = useState(() => (websiteService.getWebsiteSubjects ? websiteService.getWebsiteSubjects() : websiteService.getSubjects?.() || []));
  const [teachers, setTeachers] = useState(() => (websiteService.getWebsiteTeachers ? websiteService.getWebsiteTeachers() : websiteService.getTeachers?.() || []));
  const [gallery, setGallery] = useState(() => (websiteService.getWebsiteGallery ? websiteService.getWebsiteGallery() : websiteService.getGallery?.() || []));
  const [videos, setVideos] = useState(() => (websiteService.getWebsiteVideos ? websiteService.getWebsiteVideos() : websiteService.getVideos?.() || []));
  const [news, setNews] = useState(() => (websiteService.getWebsiteNews ? websiteService.getWebsiteNews() : websiteService.getNews?.() || []));
  const [testimonials, setTestimonials] = useState(() => (websiteService.getWebsiteTestimonials ? websiteService.getWebsiteTestimonials() : websiteService.getTestimonials?.() || []));

  const refreshAll = () => {
    setSettings(websiteService.getWebsiteSettings ? websiteService.getWebsiteSettings() : websiteService.getSettings?.() || {});
    setSlides(websiteService.getHeroSlides ? websiteService.getHeroSlides() : websiteService.getSlides?.() || []);
    setCourses(websiteService.getWebsiteCourses ? websiteService.getWebsiteCourses() : websiteService.getCourses?.() || []);
    setSubjects(websiteService.getWebsiteSubjects ? websiteService.getWebsiteSubjects() : websiteService.getSubjects?.() || []);
    setTeachers(websiteService.getWebsiteTeachers ? websiteService.getWebsiteTeachers() : websiteService.getTeachers?.() || []);
    setGallery(websiteService.getWebsiteGallery ? websiteService.getWebsiteGallery() : websiteService.getGallery?.() || []);
    setVideos(websiteService.getWebsiteVideos ? websiteService.getWebsiteVideos() : websiteService.getVideos?.() || []);
    setNews(websiteService.getWebsiteNews ? websiteService.getWebsiteNews() : websiteService.getNews?.() || []);
    setTestimonials(websiteService.getWebsiteTestimonials ? websiteService.getWebsiteTestimonials() : websiteService.getTestimonials?.() || []);
  };

  useEffect(() => {
    const handleSync = () => refreshAll();
    window.addEventListener('educo-website-update', handleSync);
    return () => window.removeEventListener('educo-website-update', handleSync);
  }, []);

  // Modal editor states
  const [modalType, setModalType] = useState(null); // 'slide' | 'course' | 'subject' | 'teacher' | 'gallery' | 'video' | 'news' | 'testimonial'
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);

  // Search filter inside lists
  const [searchQuery, setSearchQuery] = useState('');

  // ---------------------------------------------------------------------------
  // CRUD Actions
  // ---------------------------------------------------------------------------
  const handleSaveSlide = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const itemData = {
      id: editingItem?.id,
      title: fd.get('title'),
      subtitle: fd.get('subtitle'),
      tag: fd.get('tag'),
      primaryBtnText: fd.get('primaryBtnText'),
      primaryBtnLink: fd.get('primaryBtnLink'),
      secondaryBtnText: fd.get('secondaryBtnText'),
      secondaryBtnLink: fd.get('secondaryBtnLink'),
      image: fd.get('image'),
      order: Number(fd.get('order') || 1),
      isActive: fd.get('isActive') === 'on',
    };
    websiteService.saveHeroSlide(itemData);
    toast.success('Slayd muvaffaqiyatli saqlandi!');
    setModalType(null);
    setEditingItem(null);
    refreshAll();
  };

  const handleSaveCourse = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const syllabusRaw = fd.get('syllabus') || '';
    const itemData = {
      id: editingItem?.id,
      title: fd.get('title'),
      category: fd.get('category'),
      level: fd.get('level'),
      duration: fd.get('duration'),
      lessonsCount: Number(fd.get('lessonsCount') || 36),
      teacherName: fd.get('teacherName'),
      price: fd.get('price'),
      description: fd.get('description'),
      image: fd.get('image'),
      featured: fd.get('featured') === 'on',
      syllabus: syllabusRaw.split('\n').map((s) => s.trim()).filter(Boolean),
    };
    websiteService.saveWebsiteCourse(itemData);
    toast.success('Kurs maʼlumotlari saqlandi!');
    setModalType(null);
    setEditingItem(null);
    refreshAll();
  };

  const handleSaveSubject = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const itemData = {
      id: editingItem?.id,
      name: fd.get('name'),
      coursesCount: Number(fd.get('coursesCount') || 1),
      color: fd.get('color'),
      description: fd.get('description'),
    };
    websiteService.saveWebsiteSubject(itemData);
    toast.success('Fan saqlandi!');
    setModalType(null);
    setEditingItem(null);
    refreshAll();
  };

  const handleSaveTeacher = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const itemData = {
      id: editingItem?.id,
      name: fd.get('name'),
      role: fd.get('role'),
      experience: fd.get('experience'),
      subject: fd.get('subject'),
      rating: Number(fd.get('rating') || 5),
      photo: fd.get('photo'),
      bio: fd.get('bio'),
    };
    websiteService.saveWebsiteTeacher(itemData);
    toast.success('Ustoz maʼlumotlari saqlandi!');
    setModalType(null);
    setEditingItem(null);
    refreshAll();
  };

  const handleSaveGalleryItem = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const itemData = {
      id: editingItem?.id,
      title: fd.get('title'),
      category: fd.get('category'),
      image: fd.get('image'),
      description: fd.get('description'),
    };
    websiteService.saveWebsiteGalleryItem(itemData);
    toast.success('Lavha saqlandi!');
    setModalType(null);
    setEditingItem(null);
    refreshAll();
  };

  const handleSaveVideo = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const itemData = {
      id: editingItem?.id,
      title: fd.get('title'),
      category: fd.get('category'),
      duration: fd.get('duration'),
      thumbnail: fd.get('thumbnail'),
      videoUrl: fd.get('videoUrl'),
      description: fd.get('description'),
    };
    websiteService.saveWebsiteVideo(itemData);
    toast.success('Video lavha saqlandi!');
    setModalType(null);
    setEditingItem(null);
    refreshAll();
  };

  const handleSaveNews = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const itemData = {
      id: editingItem?.id,
      title: fd.get('title'),
      category: fd.get('category'),
      date: fd.get('date'),
      readTime: fd.get('readTime'),
      image: fd.get('image'),
      summary: fd.get('summary'),
      content: fd.get('content'),
    };
    websiteService.saveWebsiteNews(itemData);
    toast.success('Yangilik saqlandi!');
    setModalType(null);
    setEditingItem(null);
    refreshAll();
  };

  const handleSaveTestimonial = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const itemData = {
      id: editingItem?.id,
      name: fd.get('name'),
      role: fd.get('role'),
      quote: fd.get('quote'),
      rating: Number(fd.get('rating') || 5),
      avatar: fd.get('avatar'),
    };
    websiteService.saveWebsiteTestimonial(itemData);
    toast.success('Fikr saqlandi!');
    setModalType(null);
    setEditingItem(null);
    refreshAll();
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const updated = {
      ...settings,
      name: fd.get('name'),
      tagline: fd.get('tagline'),
      phonePrimary: fd.get('phonePrimary'),
      phoneSecondary: fd.get('phoneSecondary'),
      email: fd.get('email'),
      address: fd.get('address'),
      workingHours: fd.get('workingHours'),
      socials: {
        telegram: fd.get('telegram'),
        instagram: fd.get('instagram'),
        youtube: fd.get('youtube'),
      },
    };
    websiteService.updateWebsiteSettings(updated);
    setSettings(updated);
    toast.success('Website sozlamalari yangilandi!');
  };

  const handleSaveAbout = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const updated = {
      ...settings,
      stats: {
        students: Number(fd.get('stat_students') || 1250),
        teachers: Number(fd.get('stat_teachers') || 48),
        courses: Number(fd.get('stat_courses') || 24),
        graduates: Number(fd.get('stat_graduates') || 3400),
      },
      about: {
        ...settings.about,
        mission: fd.get('mission'),
        vision: fd.get('vision'),
      },
    };
    websiteService.updateWebsiteSettings(updated);
    setSettings(updated);
    toast.success('Biz haqimizda va statistika maʼlumotlari saqlandi!');
  };

  const confirmDelete = () => {
    if (!deleteConfirmItem) return;
    const { type, id } = deleteConfirmItem;
    if (type === 'slide') websiteService.deleteHeroSlide(id);
    if (type === 'course') websiteService.deleteWebsiteCourse(id);
    if (type === 'subject') websiteService.deleteWebsiteSubject(id);
    if (type === 'teacher') websiteService.deleteWebsiteTeacher(id);
    if (type === 'gallery') websiteService.deleteWebsiteGalleryItem(id);
    if (type === 'video') websiteService.deleteWebsiteVideo(id);
    if (type === 'news') websiteService.deleteWebsiteNews(id);
    if (type === 'testimonial') websiteService.deleteWebsiteTestimonial(id);

    toast.success('Muvaffaqiyatli oʻchirildi');
    setDeleteConfirmItem(null);
    refreshAll();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">Website boshqaruvi</h1>
            <p className="text-xs sm:text-sm text-emerald-100 mt-0.5">
              EDUCO tashqi rasmiy sayti maʼlumotlari, slayderlar, kurslar va ustozlar nazorati
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshAll}
            className="!text-white hover:!bg-white/20 !rounded-xl"
            icon={RefreshCw}
          >
            Yangilash
          </Button>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-emerald-800 font-bold text-xs sm:text-sm shadow-md hover:bg-emerald-50 transition-transform active:scale-95"
          >
            <Eye className="w-4 h-4" />
            <span>Saytni koʻrish</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </a>
        </div>
      </div>

      {/* Sub-Navigation Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 border-b border-gray-200 dark:border-gray-800">
        {SUB_MODULES.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60 border border-gray-200/80 dark:border-gray-700/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* TAB 1: OVERVIEW */}
      {/* --------------------------------------------------------------------- */}
      {currentTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { label: 'Hero slayderlar', count: slides.length, tab: 'slider', icon: Sliders, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40' },
              { label: 'Faol kurslar', count: courses.length, tab: 'courses', icon: BookOpen, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' },
              { label: 'Fanlar roʻyxati', count: subjects.length, tab: 'subjects', icon: GraduationCap, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40' },
              { label: 'Professional ustozlar', count: teachers.length, tab: 'teachers', icon: Users, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40' },
              { label: 'Yangiliklar', count: news.length, tab: 'news', icon: Newspaper, color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950/40' },
              { label: 'Video lavhalar', count: videos.length, tab: 'videos', icon: Video, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40' },
              { label: 'Galereya rasmlari', count: gallery.length, tab: 'gallery', icon: ImageIcon, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40' },
              { label: 'Oʻquvchilar fikrlari', count: testimonials.length, tab: 'testimonials', icon: MessageSquareQuote, color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/40' },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.tab}
                  onClick={() => setTab(stat.tab)}
                  className="p-5 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/80 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${stat.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-2xl font-black text-gray-900 dark:text-white">
                      {stat.count}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {stat.label}
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">Boshqarish uchun bosing &rarr;</p>
                </div>
              );
            })}
          </div>

          {/* Quick info card */}
          <Card className="p-6">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">
              Website dinamik boshqaruv tizimi
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Ushbu boʻlim orqali kiritilgan har qanday oʻzgarish (yangi kurs, slayd, rasm, ustoz yoki yangilik) darhol tashqi <strong>https://educo-lms.pages.dev/</strong> saytida aks etadi. Sahifani qayta kompilyatsiya qilish yoki serverni qayta yuklash talab qilinmaydi.
            </p>
          </Card>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 2: HERO SLIDER */}
      {/* --------------------------------------------------------------------- */}
      {currentTab === 'slider' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Bosh sahifa slayderi ({slides.length})</h2>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => {
                setEditingItem({ order: slides.length + 1, isActive: true });
                setModalType('slide');
              }}
              className="!rounded-xl"
            >
              Yangi slayd qoʻshish
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {slides.map((slide) => (
              <div
                key={slide.id}
                className="relative rounded-3xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col"
              >
                <div className="h-44 relative bg-gray-900">
                  <img src={slide.image} alt={slide.title} className="w-full h-full object-cover opacity-80" />
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-bold bg-black/60 text-white backdrop-blur-md">
                    {slide.tag || 'Slayd'}
                  </div>
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${slide.isActive ? 'bg-emerald-500 text-white' : 'bg-gray-500 text-white'}`}>
                      {slide.isActive ? 'Faol' : 'Nofaol'}
                    </span>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white">{slide.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{slide.subtitle}</p>
                  </div>
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100 dark:border-gray-700/60">
                    <span className="text-xs text-gray-400 font-mono">Ketma-ketlik: #{slide.order}</span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="xs"
                        icon={Edit}
                        onClick={() => {
                          setEditingItem(slide);
                          setModalType('slide');
                        }}
                      >
                        Tahrirlash
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        icon={Trash2}
                        className="!text-red-500 hover:!bg-red-50 dark:hover:!bg-red-950/40"
                        onClick={() => setDeleteConfirmItem({ type: 'slide', id: slide.id, title: slide.title })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 3: COURSES */}
      {/* --------------------------------------------------------------------- */}
      {currentTab === 'courses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Kurslar roʻyxati ({courses.length})</h2>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => {
                setEditingItem({ featured: true });
                setModalType('course');
              }}
              className="!rounded-xl"
            >
              Yangi kurs yaratish
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <div
                key={course.id}
                className="rounded-3xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col"
              >
                <div className="h-40 relative bg-gray-900">
                  <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                    {course.category}
                  </div>
                  {course.featured && (
                    <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                      Tavsiya etiladi
                    </div>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white">{course.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{course.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                      <span>{course.duration}</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{course.price}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-1.5 pt-2">
                    <Button
                      variant="ghost"
                      size="xs"
                      icon={Edit}
                      onClick={() => {
                        setEditingItem(course);
                        setModalType('course');
                      }}
                    >
                      Tahrirlash
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      icon={Trash2}
                      className="!text-red-500 hover:!bg-red-50 dark:hover:!bg-red-950/40"
                      onClick={() => setDeleteConfirmItem({ type: 'course', id: course.id, title: course.title })}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 4: SUBJECTS */}
      {/* --------------------------------------------------------------------- */}
      {currentTab === 'subjects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Fanlar ({subjects.length})</h2>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => {
                setEditingItem(null);
                setModalType('subject');
              }}
              className="!rounded-xl"
            >
              Yangi fan qoʻshish
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {subjects.map((subj) => (
              <div
                key={subj.id}
                className="p-5 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between"
              >
                <div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">{subj.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subj.coursesCount} ta faol guruh / kurs</p>
                  <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">{subj.description}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-3">
                  <Button
                    variant="ghost"
                    size="xs"
                    icon={Edit}
                    onClick={() => {
                      setEditingItem(subj);
                      setModalType('subject');
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="xs"
                    icon={Trash2}
                    className="!text-red-500"
                    onClick={() => setDeleteConfirmItem({ type: 'subject', id: subj.id, title: subj.name })}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 5: TEACHERS */}
      {/* --------------------------------------------------------------------- */}
      {currentTab === 'teachers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Ustozlar jamoasi ({teachers.length})</h2>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => {
                setEditingItem(null);
                setModalType('teacher');
              }}
              className="!rounded-xl"
            >
              Ustoz qoʻshish
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {teachers.map((teacher) => (
              <div
                key={teacher.id}
                className="p-5 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between"
              >
                <div className="flex items-center gap-3.5 mb-3">
                  <img src={teacher.photo} alt={teacher.name} className="w-14 h-14 rounded-2xl object-cover shrink-0" />
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white">{teacher.name}</h3>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{teacher.role}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{teacher.experience} tajriba</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mb-4">{teacher.bio}</p>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                  <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-current" /> {teacher.rating || 5}.0
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="xs"
                      icon={Edit}
                      onClick={() => {
                        setEditingItem(teacher);
                        setModalType('teacher');
                      }}
                    >
                      Tahrirlash
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      icon={Trash2}
                      className="!text-red-500"
                      onClick={() => setDeleteConfirmItem({ type: 'teacher', id: teacher.id, title: teacher.name })}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 6: NEWS */}
      {/* --------------------------------------------------------------------- */}
      {currentTab === 'news' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Yangiliklar va eʼlonlar ({news.length})</h2>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => {
                setEditingItem({ date: new Date().toISOString().split('T')[0], readTime: '3 daqiqa' });
                setModalType('news');
              }}
              className="!rounded-xl"
            >
              Yangilik eʼlon qilish
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {news.map((item) => (
              <div
                key={item.id}
                className="rounded-3xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <img src={item.image} alt={item.title} className="w-full h-36 object-cover" />
                  <div className="p-4">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300">
                      {item.category}
                    </span>
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white mt-2 line-clamp-1">{item.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{item.summary}</p>
                  </div>
                </div>
                <div className="p-4 pt-0 flex items-center justify-between text-xs text-gray-400">
                  <span>{item.date}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="xs"
                      icon={Edit}
                      onClick={() => {
                        setEditingItem(item);
                        setModalType('news');
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="xs"
                      icon={Trash2}
                      className="!text-red-500"
                      onClick={() => setDeleteConfirmItem({ type: 'news', id: item.id, title: item.title })}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 7: VIDEOS */}
      {/* --------------------------------------------------------------------- */}
      {currentTab === 'videos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Video lavhalar ({videos.length})</h2>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => {
                setEditingItem(null);
                setModalType('video');
              }}
              className="!rounded-xl"
            >
              Video lavha qoʻshish
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {videos.map((vid) => (
              <div
                key={vid.id}
                className="rounded-3xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-40 bg-gray-950">
                    <img src={vid.thumbnail} alt={vid.title} className="w-full h-full object-cover opacity-80" />
                    <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/80 text-white">
                      {vid.duration}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">{vid.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{vid.description}</p>
                  </div>
                </div>
                <div className="p-4 pt-0 flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="xs"
                    icon={Edit}
                    onClick={() => {
                      setEditingItem(vid);
                      setModalType('video');
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="xs"
                    icon={Trash2}
                    className="!text-red-500"
                    onClick={() => setDeleteConfirmItem({ type: 'video', id: vid.id, title: vid.title })}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 8: GALLERY */}
      {/* --------------------------------------------------------------------- */}
      {currentTab === 'gallery' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Darslardan lavhalar ({gallery.length})</h2>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => {
                setEditingItem(null);
                setModalType('gallery');
              }}
              className="!rounded-xl"
            >
              Rasm qoʻshish
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {gallery.map((img) => (
              <div
                key={img.id}
                className="relative group rounded-3xl overflow-hidden bg-gray-900 aspect-square shadow-sm"
              >
                <img src={img.image} alt={img.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">{img.category}</span>
                  <p className="text-xs font-bold text-white line-clamp-1">{img.title}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingItem(img);
                        setModalType('gallery');
                      }}
                      className="p-1 rounded-lg bg-white/20 hover:bg-white/40 text-white text-[11px]"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmItem({ type: 'gallery', id: img.id, title: img.title })}
                      className="p-1 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-[11px]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 9: TESTIMONIALS */}
      {/* --------------------------------------------------------------------- */}
      {currentTab === 'testimonials' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Oʻquvchilar va ota-onalar fikrlari ({testimonials.length})</h2>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => {
                setEditingItem({ rating: 5 });
                setModalType('testimonial');
              }}
              className="!rounded-xl"
            >
              Fikr qoʻshish
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {testimonials.map((test) => (
              <div
                key={test.id}
                className="p-5 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-1 text-amber-500 mb-3">
                    {Array.from({ length: test.rating || 5 }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 italic leading-relaxed line-clamp-3">
                    &ldquo;{test.quote}&rdquo;
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2.5">
                    <img src={test.avatar} alt={test.name} className="w-8 h-8 rounded-full object-cover" />
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white">{test.name}</h4>
                      <p className="text-[10px] text-gray-400">{test.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="xs"
                      icon={Edit}
                      onClick={() => {
                        setEditingItem(test);
                        setModalType('testimonial');
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="xs"
                      icon={Trash2}
                      className="!text-red-500"
                      onClick={() => setDeleteConfirmItem({ type: 'testimonial', id: test.id, title: test.name })}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 10: ABOUT & STATS */}
      {/* --------------------------------------------------------------------- */}
      {currentTab === 'about' && (
        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Biz haqimizda & Statistika koʻrsatkichlari
          </h2>
          <form onSubmit={handleSaveAbout} className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Oʻquvchilar soni
                </label>
                <Input
                  type="number"
                  name="stat_students"
                  defaultValue={settings.stats?.students || 1250}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Ustozlar soni
                </label>
                <Input
                  type="number"
                  name="stat_teachers"
                  defaultValue={settings.stats?.teachers || 48}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Kurslar soni
                </label>
                <Input
                  type="number"
                  name="stat_courses"
                  defaultValue={settings.stats?.courses || 24}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Bitiruvchilar soni
                </label>
                <Input
                  type="number"
                  name="stat_graduates"
                  defaultValue={settings.stats?.graduates || 3400}
                  required
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Bizning vazifamiz (Missiya)
                </label>
                <textarea
                  name="mission"
                  defaultValue={settings.about?.mission}
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Bizning qarashimiz (Vizion)
                </label>
                <textarea
                  name="vision"
                  defaultValue={settings.about?.vision}
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
                  required
                />
              </div>
            </div>

            <Button type="submit" variant="primary" icon={Save} className="!rounded-xl">
              Statistika va Missiyani saqlash
            </Button>
          </form>
        </Card>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 11: SETTINGS */}
      {/* --------------------------------------------------------------------- */}
      {currentTab === 'settings' && (
        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Website aloqa va asosiy sozlamalari
          </h2>
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Markaz nomi
                </label>
                <Input name="name" defaultValue={settings.name} required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Shior (Tagline)
                </label>
                <Input name="tagline" defaultValue={settings.tagline} required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Asosiy telefon raqami
                </label>
                <Input name="phonePrimary" defaultValue={settings.phonePrimary} required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Qoʻshimcha telefon raqami
                </label>
                <Input name="phoneSecondary" defaultValue={settings.phoneSecondary} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Elektron pochta (Email)
                </label>
                <Input type="email" name="email" defaultValue={settings.email} required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Ish vaqti
                </label>
                <Input name="workingHours" defaultValue={settings.workingHours} required />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Manzil
                </label>
                <Input name="address" defaultValue={settings.address} required />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white mb-3 uppercase tracking-wider">
                Ijtimoiy tarmoq havolalari
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-1">Telegram kanal</label>
                  <Input name="telegram" defaultValue={settings.socials?.telegram} />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-1">Instagram sahifa</label>
                  <Input name="instagram" defaultValue={settings.socials?.instagram} />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-1">YouTube kanal</label>
                  <Input name="youtube" defaultValue={settings.socials?.youtube} />
                </div>
              </div>
            </div>

            <Button type="submit" variant="primary" icon={Save} className="!rounded-xl mt-4">
              Website sozlamalarini saqlash
            </Button>
          </form>
        </Card>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL EDITORS */}
      {/* --------------------------------------------------------------------- */}
      {/* Slayd Modal */}
      {modalType === 'slide' && (
        <Modal
          isOpen={true}
          onClose={() => setModalType(null)}
          title={editingItem?.id ? 'Slaydni tahrirlash' : 'Yangi slayd yaratish'}
        >
          <form onSubmit={handleSaveSlide} className="space-y-4">
            <div>
              <label className="block text-xs font-bold mb-1">Sarlavha (Katta matn)</label>
              <Input name="title" defaultValue={editingItem?.title || ''} required />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Kichik sarlavha (Tavsif)</label>
              <textarea
                name="subtitle"
                defaultValue={editingItem?.subtitle || ''}
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1">Teg (Masalan: Darslardan lavhalar)</label>
                <Input name="tag" defaultValue={editingItem?.tag || ''} required />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Tartib raqami (#)</label>
                <Input type="number" name="order" defaultValue={editingItem?.order || 1} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1">1-Tugma matni</label>
                <Input name="primaryBtnText" defaultValue={editingItem?.primaryBtnText || 'Kurslarni koʻrish'} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">1-Tugma havolasi</label>
                <Input name="primaryBtnLink" defaultValue={editingItem?.primaryBtnLink || '#kurslar'} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1">2-Tugma matni</label>
                <Input name="secondaryBtnText" defaultValue={editingItem?.secondaryBtnText || 'Biz haqimizda'} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">2-Tugma havolasi</label>
                <Input name="secondaryBtnLink" defaultValue={editingItem?.secondaryBtnLink || '#biz-haqimizda'} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Rasm havolasi (URL)</label>
              <Input
                name="image"
                defaultValue={editingItem?.image || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1600&auto=format&fit=crop&q=80'}
                required
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer pt-2">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={editingItem?.isActive !== false}
                className="w-4 h-4 rounded text-emerald-600"
              />
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Slaydni faollashtirish (Saytda koʻrinadi)</span>
            </label>
            <div className="flex justify-end gap-2 pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setModalType(null)}>
                Bekor qilish
              </Button>
              <Button type="submit" variant="primary" size="sm" icon={Save}>
                Saqlash
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Kurs Modal */}
      {modalType === 'course' && (
        <Modal
          isOpen={true}
          onClose={() => setModalType(null)}
          title={editingItem?.id ? 'Kursni tahrirlash' : 'Yangi kurs yaratish'}
        >
          <form onSubmit={handleSaveCourse} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <div>
              <label className="block text-xs font-bold mb-1">Kurs nomi</label>
              <Input name="title" defaultValue={editingItem?.title || ''} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1">Kategoriya</label>
                <Input name="category" defaultValue={editingItem?.category || 'Dasturlash'} required />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Daraja</label>
                <Input name="level" defaultValue={editingItem?.level || 'Boshlangʻich'} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1">Davomiyligi (oy)</label>
                <Input name="duration" defaultValue={editingItem?.duration || '6 oy'} required />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Darslar soni</label>
                <Input type="number" name="lessonsCount" defaultValue={editingItem?.lessonsCount || 72} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1">Ustoz ismi</label>
                <Input name="teacherName" defaultValue={editingItem?.teacherName || 'Abdulazizbek Orifjonov'} required />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Narxi (oyiga)</label>
                <Input name="price" defaultValue={editingItem?.price || '650 000 soʻm / oy'} required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Qisqacha tavsif</label>
              <textarea
                name="description"
                defaultValue={editingItem?.description || ''}
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Rasm havolasi (URL)</label>
              <Input
                name="image"
                defaultValue={editingItem?.image || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80'}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Oʻquv dasturi mavzulari (har bir qator 1 ta mavzu)</label>
              <textarea
                name="syllabus"
                defaultValue={(editingItem?.syllabus || ['HTML, CSS va zamonaviy veb standartlari', 'JavaScript asoslari va DOM', 'React.js va zamonaviy SPA', 'Backend integratsiyasi va API']).join('\n')}
                rows={4}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-mono"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer pt-2">
              <input
                type="checkbox"
                name="featured"
                defaultChecked={editingItem?.featured !== false}
                className="w-4 h-4 rounded text-emerald-600"
              />
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Tavsiya etilgan kurs (Bosh sahifada ajratib koʻrsatish)</span>
            </label>
            <div className="flex justify-end gap-2 pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setModalType(null)}>
                Bekor qilish
              </Button>
              <Button type="submit" variant="primary" size="sm" icon={Save}>
                Saqlash
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Ustoz Modal */}
      {modalType === 'teacher' && (
        <Modal
          isOpen={true}
          onClose={() => setModalType(null)}
          title={editingItem?.id ? 'Ustozni tahrirlash' : 'Yangi ustoz qoʻshish'}
        >
          <form onSubmit={handleSaveTeacher} className="space-y-4">
            <div>
              <label className="block text-xs font-bold mb-1">Toʻliq ismi</label>
              <Input name="name" defaultValue={editingItem?.name || ''} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1">Lavozimi / Yoʻnalishi</label>
                <Input name="role" defaultValue={editingItem?.role || 'Bosh Dasturlash Ustozi'} required />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Tajribasi</label>
                <Input name="experience" defaultValue={editingItem?.experience || '5+ yil'} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1">Oʻtadigan fani</label>
                <Input name="subject" defaultValue={editingItem?.subject || 'Frontend Dasturlash'} required />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Reyting (1 dan 5 gacha)</label>
                <Input type="number" step="0.1" name="rating" defaultValue={editingItem?.rating || 5} required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Fotosurat havolasi (URL)</label>
              <Input
                name="photo"
                defaultValue={editingItem?.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80'}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Ustoz haqida maʼlumot (Bio)</label>
              <textarea
                name="bio"
                defaultValue={editingItem?.bio || ''}
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setModalType(null)}>
                Bekor qilish
              </Button>
              <Button type="submit" variant="primary" size="sm" icon={Save}>
                Saqlash
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Generic Delete Confirmation Modal */}
      {deleteConfirmItem && (
        <Modal
          isOpen={true}
          onClose={() => setDeleteConfirmItem(null)}
          title="Oʻchirishni tasdiqlang"
        >
          <div className="space-y-4">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
              Haqiqatan ham <strong>{deleteConfirmItem.title || 'ushbu elementni'}</strong> oʻchirib tashlamoqchimisiz?
              Bu amal saytdan darhol olib tashlanadi.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirmItem(null)}>
                Bekor qilish
              </Button>
              <Button variant="danger" size="sm" onClick={confirmDelete} icon={Trash2}>
                Ha, oʻchirilsin
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
