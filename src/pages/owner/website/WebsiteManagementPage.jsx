import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  ExternalLink,
  Save,
  RefreshCw,
  Search,
  Layers,
  Sparkles,
  Star,
  Upload,
  Play,
  Camera,
  Palette,
  Calculator,
  Cpu,
  Film,
  Check,
  X,
  Maximize2,
  FileVideo,
  Clock,
  Send,
  HelpCircle,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import websiteService from '@/services/websiteService';

const SUB_MODULES = [
  { id: 'overview', label: 'Umumiy hisobot', icon: Layers, targetHash: '' },
  { id: 'slider', label: 'Bosh sahifa slayderi', icon: Sliders, targetHash: '#top' },
  { id: 'courses', label: 'Kurslar', icon: BookOpen, targetHash: '#courses' },
  { id: 'subjects', label: 'Fanlar', icon: GraduationCap, targetHash: '#subjects' },
  { id: 'teachers', label: 'Ustozlar', icon: Users, targetHash: '#teachers' },
  { id: 'news', label: 'Yangiliklar', icon: Newspaper, targetHash: '#news' },
  { id: 'videos', label: 'Video lavhalar', icon: Video, targetHash: '#videos' },
  { id: 'gallery', label: 'Darslardan lavhalar', icon: ImageIcon, targetHash: '#gallery' },
  { id: 'testimonials', label: 'Fikrlar va sharhlar', icon: MessageSquareQuote, targetHash: '#testimonials' },
  { id: 'about', label: 'Biz haqimizda & Statistika', icon: Sparkles, targetHash: '#about' },
  { id: 'settings', label: 'Website sozlamalari', icon: Settings, targetHash: '#contact' },
];

const SUBJECT_ICONS = [
  { name: 'Sparkles', icon: Sparkles, label: 'Yulduz / Umumiy' },
  { name: 'Globe', icon: Globe, label: 'Globus / Tillar' },
  { name: 'Code', icon: Code, label: 'Dasturlash / Kod' },
  { name: 'Palette', icon: Palette, label: 'Dizayn / San’at' },
  { name: 'Calculator', icon: Calculator, label: 'Matematika / Moliya' },
  { name: 'Cpu', icon: Cpu, label: 'Robototexnika / AI' },
  { name: 'BookOpen', icon: BookOpen, label: 'Fan / Ta’lim' },
];

const GRADIENT_PRESETS = [
  { id: 'from-emerald-600 to-teal-700', label: 'Zangori (Yashil-Teal)', bg: 'from-emerald-600 to-teal-700' },
  { id: 'from-blue-600 to-indigo-700', label: 'Moviy (Ko‘k-Indogo)', bg: 'from-blue-600 to-indigo-700' },
  { id: 'from-purple-600 to-pink-600', label: 'Binafsha (Siyohrang-Pushti)', bg: 'from-purple-600 to-pink-600' },
  { id: 'from-amber-500 to-orange-600', label: 'Quyosh (Sariq-Zarg‘aldoq)', bg: 'from-amber-500 to-orange-600' },
  { id: 'from-rose-600 to-red-700', label: 'Yoqut (Qizil)', bg: 'from-rose-600 to-red-700' },
  { id: 'from-cyan-600 to-blue-700', label: 'Okean (Sian-Moviy)', bg: 'from-cyan-600 to-blue-700' },
];

// Helper: Compress and encode image file to lightweight Base64 JPEG data URL
const compressImageFile = (file, maxWidth = 1600, maxHeight = 1000, quality = 0.82) => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(event.target.result);
      img.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function WebsiteManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';

  const setTab = (tabId) => {
    setSearchParams({ tab: tabId });
    setSearchQuery('');
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
    window.addEventListener('educo-data-sync', handleSync);
    return () => {
      window.removeEventListener('educo-website-update', handleSync);
      window.removeEventListener('educo-data-sync', handleSync);
    };
  }, []);

  // Modal editor states
  const [modalType, setModalType] = useState(null); // 'slide' | 'course' | 'subject' | 'teacher' | 'gallery' | 'video' | 'news' | 'testimonial'
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);

  // Active form media & styling controls
  const [activeImage, setActiveImage] = useState('');
  const [activeVideoUrl, setActiveVideoUrl] = useState('');
  const [activeFitMode, setActiveFitMode] = useState('cover'); // 'cover' | 'contain'
  const [activePosition, setActivePosition] = useState('center'); // 'center' | 'top' | 'bottom'
  const [activeRating, setActiveRating] = useState(5);
  const [activeIcon, setActiveIcon] = useState('Sparkles');
  const [activeColor, setActiveColor] = useState('from-emerald-600 to-teal-700');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [mediaUploadMode, setMediaUploadMode] = useState('file'); // 'file' | 'url'
  const [videoUploadMode, setVideoUploadMode] = useState('url'); // 'file' | 'url'

  // Search filter inside lists
  const [searchQuery, setSearchQuery] = useState('');

  // Open Editor Helper
  const openEditor = (type, item = null) => {
    setEditingItem(item);
    setModalType(type);

    const initialImg =
      item?.image ||
      item?.image_url ||
      item?.photo ||
      item?.photo_url ||
      item?.avatar ||
      item?.thumbnail ||
      item?.cover_image ||
      '';

    setActiveImage(initialImg);
    setActiveVideoUrl(item?.video_url || item?.videoUrl || '');
    setActiveFitMode(item?.fit_mode || 'cover');
    setActivePosition(item?.object_position || (type === 'teacher' ? 'top' : 'center'));
    setActiveRating(Number(item?.rating || 5));
    setActiveIcon(item?.icon_name || 'Sparkles');
    setActiveColor(item?.color || 'from-emerald-600 to-teal-700');
    setMediaUploadMode(initialImg?.startsWith('data:') ? 'file' : 'url');
    setVideoUploadMode(item?.video_url?.startsWith('data:') ? 'file' : 'url');
  };

  const closeEditor = () => {
    setModalType(null);
    setEditingItem(null);
    setActiveImage('');
    setActiveVideoUrl('');
    setUploadLoading(false);
  };

  // File Upload Handlers
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadLoading(true);
    try {
      const dataUrl = await compressImageFile(file);
      setActiveImage(dataUrl);
      toast.success(`"${file.name}" muvaffaqiyatli yuklandi!`);
    } catch (err) {
      toast.error('Rasmni yuklashda xatolik yuz berdi');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      toast.error('Video hajmi 25MB dan oshmasligi kerak. Katta videolar uchun YouTube havolasidan foydalaning.');
      return;
    }
    setUploadLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setActiveVideoUrl(reader.result);
      setUploadLoading(false);
      toast.success(`"${file.name}" video muvaffaqiyatli yuklandi!`);
    };
    reader.onerror = () => {
      setUploadLoading(false);
      toast.error('Videoni yuklashda xatolik yuz berdi');
    };
    reader.readAsDataURL(file);
  };

  // Helper to extract YouTube ID
  const getYouTubeId = (url) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : '';
  };

  // ---------------------------------------------------------------------------
  // CRUD Actions
  // ---------------------------------------------------------------------------
  const handleSaveSlide = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const imgUrl = activeImage || fd.get('image');
    const itemData = {
      id: editingItem?.id,
      title: fd.get('title'),
      subtitle: fd.get('subtitle'),
      tag: fd.get('tag'),
      badge: fd.get('tag'),
      primaryBtnText: fd.get('primaryBtnText'),
      cta_text: fd.get('primaryBtnText'),
      primaryBtnLink: fd.get('primaryBtnLink'),
      cta_link: fd.get('primaryBtnLink'),
      secondaryBtnText: fd.get('secondaryBtnText'),
      secondary_cta_text: fd.get('secondaryBtnText'),
      secondaryBtnLink: fd.get('secondaryBtnLink'),
      secondary_cta_link: fd.get('secondaryBtnLink'),
      image: imgUrl,
      image_url: imgUrl,
      fit_mode: activeFitMode,
      object_position: activePosition,
      order: Number(fd.get('order') || 1),
      isActive: fd.get('isActive') === 'on',
      is_active: fd.get('isActive') === 'on',
    };
    websiteService.saveHeroSlide(itemData);
    toast.success('Slayd muvaffaqiyatli saqlandi!');
    closeEditor();
    refreshAll();
  };

  const handleSaveCourse = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const syllabusRaw = fd.get('syllabus') || '';
    const imgUrl = activeImage || fd.get('image');
    const teacherName = fd.get('teacherName');
    const lessonsCount = Number(fd.get('lessonsCount') || 36);
    const isFeatured = fd.get('featured') === 'on';
    const itemData = {
      id: editingItem?.id,
      title: fd.get('title'),
      category: fd.get('category'),
      level: fd.get('level'),
      duration: fd.get('duration'),
      lessonsCount: lessonsCount,
      lessons_count: lessonsCount,
      teacherName: teacherName,
      teacher_name: teacherName,
      price: fd.get('price') || '500,000 so‘m/oy',
      description: fd.get('description'),
      image: imgUrl,
      image_url: imgUrl,
      fit_mode: activeFitMode,
      object_position: activePosition,
      featured: isFeatured,
      is_featured: isFeatured,
      isActive: fd.get('isActive') === 'on',
      is_active: fd.get('isActive') === 'on',
      syllabus: syllabusRaw.split('\n').map((s) => s.trim()).filter(Boolean),
    };
    websiteService.saveWebsiteCourse(itemData);
    toast.success('Kurs maʼlumotlari saqlandi!');
    closeEditor();
    refreshAll();
  };

  const handleSaveSubject = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const imgUrl = activeImage || fd.get('image') || '';
    const itemData = {
      id: editingItem?.id,
      name: fd.get('name'),
      coursesCount: Number(fd.get('coursesCount') || 1),
      courses_count: Number(fd.get('coursesCount') || 1),
      icon_name: activeIcon,
      color: activeColor,
      description: fd.get('description'),
      image: imgUrl,
      image_url: imgUrl,
      fit_mode: activeFitMode,
      object_position: activePosition,
      isActive: fd.get('isActive') === 'on',
      is_active: fd.get('isActive') === 'on',
    };
    websiteService.saveWebsiteSubject(itemData);
    toast.success('Fan muvaffaqiyatli saqlandi!');
    closeEditor();
    refreshAll();
  };

  const handleSaveTeacher = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const name = fd.get('name');
    const photo = activeImage || fd.get('photo');
    const exp = fd.get('experience');
    const subj = fd.get('subject');
    const itemData = {
      id: editingItem?.id,
      name: name,
      full_name: name,
      role: fd.get('role'),
      experience: exp,
      experience_years: exp,
      subject: subj,
      specialization: subj,
      rating: Number(activeRating || 5),
      photo: photo,
      photo_url: photo,
      image_url: photo,
      fit_mode: activeFitMode,
      object_position: activePosition,
      telegram: fd.get('telegram') || '',
      bio: fd.get('bio'),
      isActive: fd.get('isActive') === 'on',
      is_active: fd.get('isActive') === 'on',
    };
    websiteService.saveWebsiteTeacher(itemData);
    toast.success('Ustoz maʼlumotlari saqlandi!');
    closeEditor();
    refreshAll();
  };

  const handleSaveGalleryItem = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const imgUrl = activeImage || fd.get('image');
    const desc = fd.get('description');
    const itemData = {
      id: editingItem?.id,
      title: fd.get('title'),
      category: fd.get('category'),
      date: fd.get('date') || new Date().toISOString().split('T')[0],
      image: imgUrl,
      image_url: imgUrl,
      fit_mode: activeFitMode,
      object_position: activePosition,
      description: desc,
      caption: desc,
      isActive: fd.get('isActive') === 'on',
      is_active: fd.get('isActive') === 'on',
    };
    websiteService.saveWebsiteGalleryItem(itemData);
    toast.success('Lavha saqlandi!');
    closeEditor();
    refreshAll();
  };

  const handleSaveVideo = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const thumb = activeImage || fd.get('thumbnail');
    const vUrl = activeVideoUrl || fd.get('videoUrl');
    const ytId = getYouTubeId(vUrl);
    const itemData = {
      id: editingItem?.id,
      title: fd.get('title'),
      category: fd.get('category'),
      duration: fd.get('duration') || '03:00',
      thumbnail: thumb,
      image: thumb,
      thumbnail_url: thumb,
      videoUrl: vUrl,
      video_url: vUrl,
      youtube_id: ytId,
      fit_mode: activeFitMode,
      object_position: activePosition,
      description: fd.get('description'),
      isActive: fd.get('isActive') === 'on',
      is_active: fd.get('isActive') === 'on',
    };
    websiteService.saveWebsiteVideo(itemData);
    toast.success('Video lavha saqlandi!');
    closeEditor();
    refreshAll();
  };

  const handleSaveNews = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const imgUrl = activeImage || fd.get('image');
    const sum = fd.get('summary');
    const dt = fd.get('date') || new Date().toISOString().split('T')[0];
    const itemData = {
      id: editingItem?.id,
      title: fd.get('title'),
      category: fd.get('category') || 'Yangiliklar',
      date: dt,
      published_at: dt,
      readTime: fd.get('readTime') || '3 daqiqa',
      image: imgUrl,
      cover_image: imgUrl,
      image_url: imgUrl,
      fit_mode: activeFitMode,
      object_position: activePosition,
      summary: sum,
      excerpt: sum,
      content: fd.get('content') || sum,
      is_published: fd.get('isActive') === 'on',
      isActive: fd.get('isActive') === 'on',
    };
    websiteService.saveWebsiteNews(itemData);
    toast.success('Yangilik saqlandi!');
    closeEditor();
    refreshAll();
  };

  const handleSaveTestimonial = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const avatar = activeImage || fd.get('avatar');
    const itemData = {
      id: editingItem?.id,
      name: fd.get('name'),
      role: fd.get('role'),
      quote: fd.get('quote'),
      rating: Number(activeRating || 5),
      avatar: avatar,
      image: avatar,
      photo: avatar,
      fit_mode: activeFitMode,
      object_position: activePosition,
      isActive: fd.get('isActive') === 'on',
      is_active: fd.get('isActive') === 'on',
    };
    websiteService.saveWebsiteTestimonial(itemData);
    toast.success('Fikr saqlandi!');
    closeEditor();
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

  // Filtered lists by search query
  const q = searchQuery.toLowerCase().trim();
  const filteredSlides = useMemo(() => slides.filter((s) => !q || s.title?.toLowerCase().includes(q) || s.tag?.toLowerCase().includes(q)), [slides, q]);
  const filteredCourses = useMemo(() => courses.filter((c) => !q || c.title?.toLowerCase().includes(q) || c.category?.toLowerCase().includes(q) || c.teacherName?.toLowerCase().includes(q)), [courses, q]);
  const filteredSubjects = useMemo(() => subjects.filter((s) => !q || s.name?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)), [subjects, q]);
  const filteredTeachers = useMemo(() => teachers.filter((t) => !q || t.name?.toLowerCase().includes(q) || t.role?.toLowerCase().includes(q) || t.subject?.toLowerCase().includes(q)), [teachers, q]);
  const filteredNews = useMemo(() => news.filter((n) => !q || n.title?.toLowerCase().includes(q) || n.category?.toLowerCase().includes(q)), [news, q]);
  const filteredVideos = useMemo(() => videos.filter((v) => !q || v.title?.toLowerCase().includes(q) || v.category?.toLowerCase().includes(q)), [videos, q]);
  const filteredGallery = useMemo(() => gallery.filter((g) => !q || g.title?.toLowerCase().includes(q) || g.category?.toLowerCase().includes(q)), [gallery, q]);
  const filteredTestimonials = useMemo(() => testimonials.filter((t) => !q || t.name?.toLowerCase().includes(q) || t.role?.toLowerCase().includes(q) || t.quote?.toLowerCase().includes(q)), [testimonials, q]);

  // Current active sub-module info
  const activeModule = SUB_MODULES.find((m) => m.id === currentTab) || SUB_MODULES[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner">
            <Globe className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">Website Boshqaruvi</h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/25 text-white">Live Sync</span>
            </div>
            <p className="text-xs sm:text-sm text-emerald-100 mt-0.5">
              EDUCO tashqi rasmiy veb-sayti kontenti, media fayllar, kurslar va ustozlarni boshqarish
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
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
            href={`/website${activeModule.targetHash || ''}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-emerald-900 font-extrabold text-xs sm:text-sm shadow-md hover:bg-emerald-50 hover:shadow-lg transition-all active:scale-95"
            title="Rasmiy veb-saytni yangi oynada ochish"
          >
            <Eye className="w-4 h-4 text-emerald-600" />
            <span>Saytni yangi oynada ochish</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </a>
        </div>
      </div>

      {/* Sub-Navigation Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 border-b border-gray-200 dark:border-gray-800">
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
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-102'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60 border border-gray-200/80 dark:border-gray-700/60'
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
              { label: 'Hero slayderlar', count: slides.length, tab: 'slider', hash: '#top', icon: Sliders, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40' },
              { label: 'Faol kurslar', count: courses.length, tab: 'courses', hash: '#courses', icon: BookOpen, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' },
              { label: 'Fanlar roʻyxati', count: subjects.length, tab: 'subjects', hash: '#subjects', icon: GraduationCap, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40' },
              { label: 'Ustozlar jamoasi', count: teachers.length, tab: 'teachers', hash: '#teachers', icon: Users, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40' },
              { label: 'Yangiliklar', count: news.length, tab: 'news', hash: '#news', icon: Newspaper, color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950/40' },
              { label: 'Video lavhalar', count: videos.length, tab: 'videos', hash: '#videos', icon: Video, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40' },
              { label: 'Galereya rasmlari', count: gallery.length, tab: 'gallery', hash: '#gallery', icon: ImageIcon, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40' },
              { label: 'Oʻquvchilar fikrlari', count: testimonials.length, tab: 'testimonials', hash: '#testimonials', icon: MessageSquareQuote, color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/40' },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.tab}
                  className="p-5 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/80 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${stat.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-2xl font-black text-gray-900 dark:text-white">
                      {stat.count}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200">
                      {stat.label}
                    </h3>
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100 dark:border-gray-700/60">
                      <button
                        type="button"
                        onClick={() => setTab(stat.tab)}
                        className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        Boshqarish &rarr;
                      </button>
                      <a
                        href={`/website${stat.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-0.5"
                        title="Saytda ko‘rish"
                      >
                        <span>Saytda</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                  100% Moslashuvchan va Dinamik Boshqaruv
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl">
                  Har bir boʻlimda rasm va videolarni toʻgʻridan-toʻgʻri kompyuteringiz yoki telefoningizdan fayl orqali yuklashingiz,
                  oʻlcham va qoplash usulini (100% toʻldirish yoki sigʻdirish) boshqarishingiz mumkin. Barcha oʻzgarishlar darhol tashqi saytda aks etadi.
                </p>
              </div>
              <a
                href="/website"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 shadow-md transition-all active:scale-95"
              >
                <Eye className="w-4 h-4" />
                <span>Saytni Koʻrish</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </Card>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 2: HERO SLIDER */}
      {/* --------------------------------------------------------------------- */}
      {currentTab === 'slider' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Bosh sahifa slayderi ({filteredSlides.length})</h2>
              <a
                href="/website#top"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
              >
                <span>Saytda koʻrish</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Qidirish..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 w-36 sm:w-48"
                />
              </div>
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => openEditor('slide', { order: slides.length + 1, isActive: true, fit_mode: 'cover' })}
                className="!rounded-xl whitespace-nowrap"
              >
                Yangi slayd qoʻshish
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSlides.map((slide) => (
              <div
                key={slide.id}
                className="relative rounded-3xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between"
              >
                <div className="h-48 relative bg-gray-900 overflow-hidden">
                  <img
                    src={slide.image || slide.image_url || '/educo-logo.png'}
                    alt={slide.title}
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/educo-logo.png'; }}
                    style={{ objectFit: slide.fit_mode || 'cover', objectPosition: slide.object_position || 'center' }}
                    className="w-full h-full opacity-85"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-bold bg-black/60 text-white backdrop-blur-md">
                    {slide.tag || 'Slayd'}
                  </div>
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${slide.isActive || slide.is_active ? 'bg-emerald-500 text-white' : 'bg-gray-500 text-white'}`}>
                      {slide.isActive || slide.is_active ? 'Faol' : 'Nofaol'}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-4 right-4 text-white">
                    <h4 className="font-black text-sm line-clamp-1">{slide.title}</h4>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{slide.subtitle}</p>
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100 dark:border-gray-700/60">
                    <span className="text-xs text-gray-400 font-mono">#{slide.order} • {slide.fit_mode === 'contain' ? 'Sigʻdirish' : '100% Qoplash'}</span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="xs"
                        icon={Edit}
                        onClick={() => openEditor('slide', slide)}
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Kurslar roʻyxati ({filteredCourses.length})</h2>
              <a
                href="/website#courses"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
              >
                <span>Saytda koʻrish</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Kurs nomi, kategoriya..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 w-36 sm:w-48"
                />
              </div>
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => openEditor('course', { featured: true, isActive: true, fit_mode: 'cover' })}
                className="!rounded-xl whitespace-nowrap"
              >
                Yangi kurs yaratish
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="rounded-3xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between"
              >
                <div className="h-44 relative bg-gray-900 overflow-hidden">
                  <img
                    src={course.image || course.image_url || '/educo-logo.png'}
                    alt={course.title}
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/educo-logo.png'; }}
                    style={{ objectFit: course.fit_mode || 'cover', objectPosition: course.object_position || 'center' }}
                    className="w-full h-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                    {course.category}
                  </div>
                  {(course.featured || course.is_featured) && (
                    <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      <span>Top Kurs</span>
                    </div>
                  )}
                  <div className="absolute bottom-2.5 left-3.5 right-3.5 flex items-center justify-between text-white text-xs">
                    <span className="font-black text-sm">{course.price}</span>
                    <span className="opacity-90">{course.duration}</span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">{course.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{course.description}</p>
                    <p className="text-[11px] text-gray-400 mt-2">Ustoz: <strong>{course.teacherName || course.teacher_name}</strong></p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700/60">
                    <span className="text-[11px] text-gray-400">{course.lessonsCount || course.lessons_count || 36} dars</span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="xs"
                        icon={Edit}
                        onClick={() => openEditor('course', course)}
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Fanlar va Yoʻnalishlar ({filteredSubjects.length})</h2>
              <a
                href="/website#subjects"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
              >
                <span>Saytda koʻrish</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Fan nomi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 w-36 sm:w-48"
                />
              </div>
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => openEditor('subject', { coursesCount: 1, isActive: true, color: 'from-emerald-600 to-teal-700', icon_name: 'Sparkles' })}
                className="!rounded-xl whitespace-nowrap"
              >
                Yangi fan qoʻshish
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredSubjects.map((subj) => {
              const IconComp = SUBJECT_ICONS.find((i) => i.name === subj.icon_name)?.icon || Sparkles;
              return (
                <div
                  key={subj.id}
                  className="p-5 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${subj.color || 'from-emerald-600 to-teal-700'} flex items-center justify-center text-white shadow-md shrink-0`}>
                      <IconComp className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 shrink-0">
                      {subj.coursesCount || subj.courses_count || 1} ta kurs
                    </span>
                  </div>

                  <div className="mt-4">
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">{subj.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{subj.description}</p>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 pt-3 mt-3 border-t border-gray-100 dark:border-gray-700/60">
                    <Button
                      variant="ghost"
                      size="xs"
                      icon={Edit}
                      onClick={() => openEditor('subject', subj)}
                    >
                      Tahrirlash
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      icon={Trash2}
                      className="!text-red-500 hover:!bg-red-50 dark:hover:!bg-red-950/40"
                      onClick={() => setDeleteConfirmItem({ type: 'subject', id: subj.id, title: subj.name })}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 5: TEACHERS */}
      {/* --------------------------------------------------------------------- */}
      {currentTab === 'teachers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Ustozlar jamoasi ({filteredTeachers.length})</h2>
              <a
                href="/website#teachers"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
              >
                <span>Saytda koʻrish</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Ustoz ismi, fan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 w-36 sm:w-48"
                />
              </div>
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => openEditor('teacher', { rating: 5, experience: '3+ yil', isActive: true, fit_mode: 'cover', object_position: 'top' })}
                className="!rounded-xl whitespace-nowrap"
              >
                Ustoz qoʻshish
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredTeachers.map((teacher) => (
              <div
                key={teacher.id}
                className="p-5 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between"
              >
                <div className="flex items-center gap-3.5 mb-3">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0 border border-gray-200 dark:border-gray-600">
                    <img
                      src={teacher.photo || teacher.photo_url || teacher.image_url || '/educo-logo.png'}
                      alt={teacher.name || teacher.full_name}
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/educo-logo.png'; }}
                      style={{ objectFit: teacher.fit_mode || 'cover', objectPosition: teacher.object_position || 'top' }}
                      className="w-full h-full"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">{teacher.name || teacher.full_name}</h3>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold line-clamp-1">{teacher.role}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{teacher.experience || teacher.experience_years || '5+ yil'} tajriba</p>
                  </div>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mb-4">{teacher.bio}</p>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700/60">
                  <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-current" /> {teacher.rating || 5}.0
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="xs"
                      icon={Edit}
                      onClick={() => openEditor('teacher', teacher)}
                    >
                      Tahrirlash
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      icon={Trash2}
                      className="!text-red-500 hover:!bg-red-50 dark:hover:!bg-red-950/40"
                      onClick={() => setDeleteConfirmItem({ type: 'teacher', id: teacher.id, title: teacher.name || teacher.full_name })}
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Yangiliklar va Eʼlonlar ({filteredNews.length})</h2>
              <a
                href="/website#news"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
              >
                <span>Saytda koʻrish</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Yangilik nomi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 w-36 sm:w-48"
                />
              </div>
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => openEditor('news', { date: new Date().toISOString().split('T')[0], readTime: '3 daqiqa', category: 'Yangiliklar', isActive: true, fit_mode: 'cover' })}
                className="!rounded-xl whitespace-nowrap"
              >
                Yangilik eʼlon qilish
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredNews.map((item) => (
              <div
                key={item.id}
                className="rounded-3xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="h-44 relative bg-gray-900 overflow-hidden">
                    <img
                      src={item.image || item.cover_image || item.image_url || '/educo-logo.png'}
                      alt={item.title}
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/educo-logo.png'; }}
                      style={{ objectFit: item.fit_mode || 'cover', objectPosition: item.object_position || 'center' }}
                      className="w-full h-full"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <span className="absolute top-3 left-3 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-600 text-white">
                      {item.category}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">{item.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{item.summary || item.excerpt}</p>
                  </div>
                </div>

                <div className="p-4 pt-0 flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 dark:border-gray-700/60 mt-2">
                  <span>{item.date || item.published_at}</span>
                  <div className="flex items-center gap-1.5 pt-2">
                    <Button
                      variant="ghost"
                      size="xs"
                      icon={Edit}
                      onClick={() => openEditor('news', item)}
                    >
                      Tahrirlash
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      icon={Trash2}
                      className="!text-red-500 hover:!bg-red-50 dark:hover:!bg-red-950/40"
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Video lavhalar ({filteredVideos.length})</h2>
              <a
                href="/website#videos"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
              >
                <span>Saytda koʻrish</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Video sarlavhasi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 w-36 sm:w-48"
                />
              </div>
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => openEditor('video', { duration: '03:00', category: 'Tanishtiruv', isActive: true, fit_mode: 'cover' })}
                className="!rounded-xl whitespace-nowrap"
              >
                Video lavha qoʻshish
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredVideos.map((vid) => (
              <div
                key={vid.id}
                className="rounded-3xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 bg-gray-950 overflow-hidden group">
                    <img
                      src={vid.thumbnail || vid.image || vid.thumbnail_url || '/educo-logo.png'}
                      alt={vid.title}
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/educo-logo.png'; }}
                      style={{ objectFit: vid.fit_mode || 'cover', objectPosition: vid.object_position || 'center' }}
                      className="w-full h-full opacity-85 group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>
                    <span className="absolute bottom-2.5 right-2.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-black/80 text-white backdrop-blur-md">
                      {vid.duration}
                    </span>
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-white backdrop-blur-md">
                      {vid.category || 'Video'}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">{vid.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{vid.description}</p>
                  </div>
                </div>

                <div className="p-4 pt-0 flex items-center justify-end gap-1.5 border-t border-gray-100 dark:border-gray-700/60 mt-2">
                  <Button
                    variant="ghost"
                    size="xs"
                    icon={Edit}
                    onClick={() => openEditor('video', vid)}
                  >
                    Tahrirlash
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    icon={Trash2}
                    className="!text-red-500 hover:!bg-red-50 dark:hover:!bg-red-950/40"
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Darslardan lavhalar ({filteredGallery.length})</h2>
              <a
                href="/website#gallery"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
              >
                <span>Saytda koʻrish</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rasm nomi, kategoriya..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 w-36 sm:w-48"
                />
              </div>
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => openEditor('gallery', { category: 'Darslar', isActive: true, fit_mode: 'cover' })}
                className="!rounded-xl whitespace-nowrap"
              >
                Rasm qoʻshish
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filteredGallery.map((img) => (
              <div
                key={img.id}
                className="relative group rounded-3xl overflow-hidden bg-gray-900 aspect-square shadow-sm"
              >
                <img
                  src={img.image || img.image_url || '/educo-logo.png'}
                  alt={img.title}
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/educo-logo.png'; }}
                  style={{ objectFit: img.fit_mode || 'cover', objectPosition: img.object_position || 'center' }}
                  className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">{img.category}</span>
                  <p className="text-xs font-bold text-white line-clamp-1">{img.title}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <button
                      type="button"
                      onClick={() => openEditor('gallery', img)}
                      className="p-1.5 rounded-lg bg-white/20 hover:bg-white/40 text-white text-xs cursor-pointer"
                      title="Tahrirlash"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmItem({ type: 'gallery', id: img.id, title: img.title })}
                      className="p-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-xs cursor-pointer"
                      title="Oʻchirish"
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Fikrlar va Sharhlar ({filteredTestimonials.length})</h2>
              <a
                href="/website#testimonials"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
              >
                <span>Saytda koʻrish</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Ism, kasb, fikr..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 w-36 sm:w-48"
                />
              </div>
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => openEditor('testimonial', { rating: 5, isActive: true, fit_mode: 'cover' })}
                className="!rounded-xl whitespace-nowrap"
              >
                Fikr qoʻshish
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredTestimonials.map((test) => (
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

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100 dark:border-gray-700/60">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={test.avatar || test.image || test.photo || '/educo-logo.png'}
                      alt={test.name || test.author}
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/educo-logo.png'; }}
                      style={{ objectFit: test.fit_mode || 'cover', objectPosition: test.object_position || 'center' }}
                      className="w-9 h-9 rounded-full object-cover border border-emerald-500/30"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">{test.name}</h4>
                      <p className="text-[10px] text-gray-400 line-clamp-1">{test.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="xs"
                      icon={Edit}
                      onClick={() => openEditor('testimonial', test)}
                    >
                      Tahrirlash
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      icon={Trash2}
                      className="!text-red-500 hover:!bg-red-50 dark:hover:!bg-red-950/40"
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Biz haqimizda & Statistika koʻrsatkichlari
            </h2>
            <a
              href="/website#about"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
            >
              <span>Saytda koʻrish</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Website aloqa va asosiy sozlamalari
            </h2>
            <a
              href="/website#contact"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
            >
              <span>Saytda koʻrish</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
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

      {/* ===================================================================== */}
      {/* 2-COLUMN MODERN MODAL EDITORS (WITH 100% LIVE PREVIEW & FILE UPLOADS)  */}
      {/* ===================================================================== */}

      {/* 1. SLAYD MODAL */}
      {modalType === 'slide' && (
        <Modal
          isOpen={true}
          onClose={closeEditor}
          size="2xl"
          title={editingItem?.id ? 'Hero Slaydni tahrirlash' : 'Yangi Hero Slayd yaratish'}
        >
          <form onSubmit={handleSaveSlide} className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[78vh] overflow-y-auto pr-1">
            {/* Form Fields (Left) */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Sarlavha (Katta matn)</label>
                <Input name="title" defaultValue={editingItem?.title || ''} placeholder="Masalan: Kelajak kasblarini EDUCO bilan zabt eting" required />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Kichik sarlavha (Tavsif)</label>
                <textarea
                  name="subtitle"
                  defaultValue={editingItem?.subtitle || ''}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Teg (Masalan: Darslardan lavhalar)</label>
                  <Input name="tag" defaultValue={editingItem?.tag || ''} required />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Tartib raqami (#)</label>
                  <Input type="number" name="order" defaultValue={editingItem?.order || 1} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">1-Tugma matni</label>
                  <Input name="primaryBtnText" defaultValue={editingItem?.primaryBtnText || 'Kurslarni ko‘rish'} />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">1-Tugma havolasi</label>
                  <Input name="primaryBtnLink" defaultValue={editingItem?.primaryBtnLink || '#courses'} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">2-Tugma matni</label>
                  <Input name="secondaryBtnText" defaultValue={editingItem?.secondaryBtnText || 'Dars lavhalari'} />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">2-Tugma havolasi</label>
                  <Input name="secondaryBtnLink" defaultValue={editingItem?.secondaryBtnLink || '#gallery'} />
                </div>
              </div>

              {/* Image Upload / URL Controls */}
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    <span>Slayd rasmi</span>
                  </label>
                  <div className="flex items-center rounded-lg bg-gray-200 dark:bg-gray-800 p-0.5 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setMediaUploadMode('file')}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${mediaUploadMode === 'file' ? 'bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 shadow-xs' : 'text-gray-600 dark:text-gray-400'}`}
                    >
                      Fayl yuklash
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaUploadMode('url')}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${mediaUploadMode === 'url' ? 'bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 shadow-xs' : 'text-gray-600 dark:text-gray-400'}`}
                    >
                      URL havola
                    </button>
                  </div>
                </div>

                {mediaUploadMode === 'file' ? (
                  <div className="space-y-2">
                    <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-emerald-500/40 hover:border-emerald-500 rounded-xl bg-white dark:bg-gray-800 cursor-pointer transition-all">
                      <Upload className="w-6 h-6 text-emerald-600 mb-1" />
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                        {uploadLoading ? 'Yuklanmoqda...' : 'Kompyuter yoki telefondan rasm tanlang'}
                      </span>
                      <span className="text-[10px] text-gray-400 mt-0.5">PNG, JPG, WEBP (Avtomatik 100% optimizatsiya qilinadi)</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  </div>
                ) : (
                  <div>
                    <Input
                      name="image"
                      value={activeImage}
                      onChange={(e) => setActiveImage(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      required={!activeImage}
                    />
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked={editingItem?.isActive !== false && editingItem?.is_active !== false}
                  className="w-4 h-4 rounded text-emerald-600"
                />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Slaydni faollashtirish (Saytda koʻrinadi)</span>
              </label>

              <div className="flex justify-end gap-2 pt-3">
                <Button type="button" variant="outline" size="sm" onClick={closeEditor}>
                  Bekor qilish
                </Button>
                <Button type="submit" variant="primary" size="sm" icon={Save}>
                  Saqlash
                </Button>
              </div>
            </div>

            {/* Live 100% Preview Box (Right) */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4 bg-gray-50 dark:bg-gray-900/60 p-4 rounded-2xl border border-gray-200 dark:border-gray-700">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-emerald-600" />
                    <span>Jonli koʻrinish (100% Box)</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold">
                    Saytda qanday koʻrinadi
                  </span>
                </div>

                {/* Box Display Frame */}
                <div className="relative w-full h-56 rounded-2xl overflow-hidden bg-gray-950 border border-gray-300 dark:border-gray-700 flex items-center justify-center">
                  {activeImage ? (
                    <img
                      src={activeImage}
                      alt="Preview"
                      style={{ objectFit: activeFitMode, objectPosition: activePosition }}
                      className="w-full h-full transition-all duration-200"
                    />
                  ) : (
                    <div className="text-center p-4 text-gray-400">
                      <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                      <p className="text-xs">Rasm tanlanmagan</p>
                    </div>
                  )}
                  {/* Overlay elements */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />
                  <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-md">
                    {editingItem?.tag || 'Darslardan lavhalar'}
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 text-white pointer-events-none">
                    <p className="text-[11px] font-black line-clamp-1">{editingItem?.title || 'Sarlavha kiritilmagan'}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-[9px] font-bold">1-Tugma</span>
                      <span className="px-2 py-0.5 rounded-md bg-white/20 text-[9px] font-bold">2-Tugma</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rasm Bo'yi va Enini Boshqarish (Fit & Position) */}
              <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block">
                  Rasm oʻlchami va fokusini sozlash:
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setActiveFitMode('cover')}
                    className={`py-1.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${activeFitMode === 'cover' ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}
                  >
                    100% Toʻliq qoplash (Cover)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFitMode('contain')}
                    className={`py-1.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${activeFitMode === 'contain' ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}
                  >
                    Toʻliq sigʻdirish (Contain)
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] font-bold pt-1">
                  <span className="text-gray-500">Rasm markazi:</span>
                  <div className="flex items-center gap-1">
                    {['top', 'center', 'bottom'].map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => setActivePosition(pos)}
                        className={`px-2.5 py-1 rounded-lg capitalize transition-colors cursor-pointer ${activePosition === pos ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'}`}
                      >
                        {pos === 'top' ? 'Tepa' : pos === 'center' ? 'Markaz' : 'Past'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* 2. KURS MODAL */}
      {modalType === 'course' && (
        <Modal
          isOpen={true}
          onClose={closeEditor}
          size="2xl"
          title={editingItem?.id ? 'Kurs maʼlumotlarini tahrirlash' : 'Yangi kurs yaratish'}
        >
          <form onSubmit={handleSaveCourse} className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[78vh] overflow-y-auto pr-1">
            <div className="lg:col-span-7 space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Kurs nomi</label>
                <Input name="title" defaultValue={editingItem?.title || ''} placeholder="Masalan: Frontend Web Dasturlash" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Kategoriya</label>
                  <Input name="category" defaultValue={editingItem?.category || 'Dasturlash'} required />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Daraja</label>
                  <Input name="level" defaultValue={editingItem?.level || 'Boshlangʻich'} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Davomiyligi (oy)</label>
                  <Input name="duration" defaultValue={editingItem?.duration || '6 oy'} required />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Darslar soni</label>
                  <Input type="number" name="lessonsCount" defaultValue={editingItem?.lessonsCount || editingItem?.lessons_count || 72} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Ustoz ismi</label>
                  <Input name="teacherName" defaultValue={editingItem?.teacherName || editingItem?.teacher_name || 'Abbosbek'} required />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Narxi (oyiga)</label>
                  <Input name="price" defaultValue={editingItem?.price || '500,000 so‘m/oy'} required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Qisqacha tavsif</label>
                <textarea
                  name="description"
                  defaultValue={editingItem?.description || ''}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
                  required
                />
              </div>

              {/* Media File Upload or URL */}
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    <span>Kurs muqova rasmi</span>
                  </label>
                  <div className="flex items-center rounded-lg bg-gray-200 dark:bg-gray-800 p-0.5 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setMediaUploadMode('file')}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${mediaUploadMode === 'file' ? 'bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 shadow-xs' : 'text-gray-600 dark:text-gray-400'}`}
                    >
                      Fayl yuklash
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaUploadMode('url')}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${mediaUploadMode === 'url' ? 'bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 shadow-xs' : 'text-gray-600 dark:text-gray-400'}`}
                    >
                      URL havola
                    </button>
                  </div>
                </div>

                {mediaUploadMode === 'file' ? (
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-emerald-500/40 hover:border-emerald-500 rounded-xl bg-white dark:bg-gray-800 cursor-pointer transition-all">
                    <Upload className="w-6 h-6 text-emerald-600 mb-1" />
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                      {uploadLoading ? 'Yuklanmoqda...' : 'Kompyuterdan rasm yuklash'}
                    </span>
                    <span className="text-[10px] text-gray-400 mt-0.5">Avtomatik 100% optimallashtiriladi</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                ) : (
                  <Input
                    name="image"
                    value={activeImage}
                    onChange={(e) => setActiveImage(e.target.value)}
                    placeholder="https://..."
                    required={!activeImage}
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Oʻquv dasturi mavzulari (har bir qator 1 ta mavzu)</label>
                <textarea
                  name="syllabus"
                  defaultValue={(editingItem?.syllabus || ['HTML, CSS va zamonaviy veb standartlari', 'JavaScript asoslari va DOM', 'React.js va zamonaviy SPA', 'Backend integratsiyasi va API']).join('\n')}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-mono text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="featured"
                    defaultChecked={editingItem?.featured !== false && editingItem?.is_featured !== false}
                    className="w-4 h-4 rounded text-emerald-600"
                  />
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Tavsiya etilgan (Top Kurs)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isActive"
                    defaultChecked={editingItem?.isActive !== false && editingItem?.is_active !== false}
                    className="w-4 h-4 rounded text-emerald-600"
                  />
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Faol (Saytda koʻrinadi)</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button type="button" variant="outline" size="sm" onClick={closeEditor}>
                  Bekor qilish
                </Button>
                <Button type="submit" variant="primary" size="sm" icon={Save}>
                  Saqlash
                </Button>
              </div>
            </div>

            {/* Live 100% Preview Box (Right) */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4 bg-gray-50 dark:bg-gray-900/60 p-4 rounded-2xl border border-gray-200 dark:border-gray-700">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-emerald-600" />
                    <span>Kurs kartasi koʻrinishi</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold">
                    100% Fit Box
                  </span>
                </div>

                <div className="rounded-2xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md">
                  <div className="h-44 relative bg-gray-950 overflow-hidden">
                    {activeImage ? (
                      <img
                        src={activeImage}
                        alt="Preview"
                        style={{ objectFit: activeFitMode, objectPosition: activePosition }}
                        className="w-full h-full transition-all duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ImageIcon className="w-8 h-8 opacity-40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                      {editingItem?.category || 'Dasturlash'}
                    </span>
                    <span className="absolute bottom-2.5 left-2.5 font-black text-sm text-white">
                      {editingItem?.price || '500,000 so‘m/oy'}
                    </span>
                  </div>
                  <div className="p-3.5 space-y-1.5">
                    <h4 className="font-bold text-xs text-gray-900 dark:text-white line-clamp-1">{editingItem?.title || 'Kurs nomi'}</h4>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2">{editingItem?.description || 'Kurs haqida qisqacha maʼlumot'}</p>
                  </div>
                </div>
              </div>

              {/* Control panel */}
              <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block">
                  Rasm qoplash va fokus nazorati:
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setActiveFitMode('cover')}
                    className={`py-1.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${activeFitMode === 'cover' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}
                  >
                    100% Qoplash (Cover)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFitMode('contain')}
                    className={`py-1.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${activeFitMode === 'contain' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}
                  >
                    Sigʻdirish (Contain)
                  </button>
                </div>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* 3. FAN (SUBJECT) MODAL */}
      {modalType === 'subject' && (
        <Modal
          isOpen={true}
          onClose={closeEditor}
          size="2xl"
          title={editingItem?.id ? 'Fanni tahrirlash' : 'Yangi fan yoʻnalishi qoʻshish'}
        >
          <form onSubmit={handleSaveSubject} className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[78vh] overflow-y-auto pr-1">
            <div className="lg:col-span-7 space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Fan yoʻnalishi nomi</label>
                <Input name="name" defaultValue={editingItem?.name || ''} placeholder="Masalan: Dasturlash & IT Texnologiyalar" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Kurslar soni</label>
                  <Input type="number" name="coursesCount" defaultValue={editingItem?.coursesCount || editingItem?.courses_count || 1} required />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Belgi (Icon)</label>
                  <select
                    value={activeIcon}
                    onChange={(e) => setActiveIcon(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
                  >
                    {SUBJECT_ICONS.map((i) => (
                      <option key={i.name} value={i.name}>{i.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Gradient Color Selector */}
              <div>
                <label className="block text-xs font-bold mb-1.5 text-gray-700 dark:text-gray-300">Karta rang gradienti</label>
                <div className="grid grid-cols-3 gap-2">
                  {GRADIENT_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setActiveColor(p.id)}
                      className={`h-9 rounded-xl bg-gradient-to-r ${p.bg} text-white text-[11px] font-bold flex items-center justify-center transition-all cursor-pointer ${activeColor === p.id ? 'ring-2 ring-emerald-500 ring-offset-2 scale-103' : 'opacity-85 hover:opacity-100'}`}
                    >
                      {activeColor === p.id && <Check className="w-4 h-4 mr-1" />}
                      <span className="truncate px-1">{p.label.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Tavsif</label>
                <textarea
                  name="description"
                  defaultValue={editingItem?.description || ''}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
                  required
                />
              </div>

              {/* Media File Upload or URL (Optional for subjects) */}
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    <span>Fan rasmi / banneri (ixtiyoriy)</span>
                  </label>
                  <label className="text-[11px] font-bold text-emerald-600 hover:underline cursor-pointer">
                    <span>Fayl tanlash</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
                <Input
                  name="image"
                  value={activeImage}
                  onChange={(e) => setActiveImage(e.target.value)}
                  placeholder="URL havola yoki yuqoridagi fayl tanlash tugmasi"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked={editingItem?.isActive !== false && editingItem?.is_active !== false}
                  className="w-4 h-4 rounded text-emerald-600"
                />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Fanni faollashtirish (Saytda koʻrinadi)</span>
              </label>

              <div className="flex justify-end gap-2 pt-3">
                <Button type="button" variant="outline" size="sm" onClick={closeEditor}>
                  Bekor qilish
                </Button>
                <Button type="submit" variant="primary" size="sm" icon={Save}>
                  Saqlash
                </Button>
              </div>
            </div>

            {/* Live Preview Box */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4 bg-gray-50 dark:bg-gray-900/60 p-4 rounded-2xl border border-gray-200 dark:border-gray-700">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-emerald-600" />
                    <span>Fan kartasi koʻrinishi</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold">
                    Saytda
                  </span>
                </div>

                <div className="p-5 rounded-3xl bg-white dark:bg-[#1a2332] border border-gray-200 dark:border-gray-800 shadow-md space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${activeColor} flex items-center justify-center text-white shadow-md`}>
                      {(() => {
                        const IconComponent = SUBJECT_ICONS.find((i) => i.name === activeIcon)?.icon || Sparkles;
                        return <IconComponent className="w-7 h-7" />;
                      })()}
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      {editingItem?.coursesCount || 1} ta kurs
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-black text-gray-900 dark:text-white line-clamp-1">
                      {editingItem?.name || 'Fan nomi'}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {editingItem?.description || 'Ushbu fan yoʻnalishi haqida qisqacha maʼlumot.'}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-gray-100 dark:border-gray-800 text-xs font-bold text-emerald-600 flex items-center justify-between">
                    <span>Kurslarni koʻrish</span>
                    <span>&rarr;</span>
                  </div>
                </div>
              </div>

              {activeImage && (
                <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-[11px] font-bold text-gray-500">Rasm koʻrinishi:</span>
                  <div className="h-28 rounded-xl overflow-hidden bg-gray-900">
                    <img src={activeImage} alt="Preview" style={{ objectFit: activeFitMode }} className="w-full h-full" />
                  </div>
                </div>
              )}
            </div>
          </form>
        </Modal>
      )}

      {/* 4. USTOZ MODAL */}
      {modalType === 'teacher' && (
        <Modal
          isOpen={true}
          onClose={closeEditor}
          size="2xl"
          title={editingItem?.id ? 'Ustoz maʼlumotlarini tahrirlash' : 'Yangi ustoz qoʻshish'}
        >
          <form onSubmit={handleSaveTeacher} className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[78vh] overflow-y-auto pr-1">
            <div className="lg:col-span-7 space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Toʻliq ismi va familiyasi</label>
                <Input name="name" defaultValue={editingItem?.name || editingItem?.full_name || ''} placeholder="Masalan: Abdulazizbek Orifjonov" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Lavozimi / Mutaxassisligi</label>
                  <Input name="role" defaultValue={editingItem?.role || 'Bosh Dasturlash Ustozi'} required />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Tajribasi</label>
                  <Input name="experience" defaultValue={editingItem?.experience || editingItem?.experience_years || '5+ yil'} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Oʻtadigan fani</label>
                  <Input name="subject" defaultValue={editingItem?.subject || editingItem?.specialization || 'Frontend Dasturlash'} required />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Telegram havolasi</label>
                  <Input name="telegram" defaultValue={editingItem?.telegram || ''} placeholder="https://t.me/..." />
                </div>
              </div>

              {/* Rating picker */}
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Reyting (Yulduzlar)</label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setActiveRating(star)}
                      className="p-1 text-amber-500 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star className={`w-5 h-5 ${star <= activeRating ? 'fill-current' : 'opacity-30'}`} />
                    </button>
                  ))}
                  <span className="text-xs font-bold ml-2 text-gray-600 dark:text-gray-400">{activeRating}.0 yulduz</span>
                </div>
              </div>

              {/* Photo Upload / URL Controls */}
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    <span>Ustoz fotosurati</span>
                  </label>
                  <div className="flex items-center rounded-lg bg-gray-200 dark:bg-gray-800 p-0.5 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setMediaUploadMode('file')}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${mediaUploadMode === 'file' ? 'bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 shadow-xs' : 'text-gray-600 dark:text-gray-400'}`}
                    >
                      Fayl yuklash
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaUploadMode('url')}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${mediaUploadMode === 'url' ? 'bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 shadow-xs' : 'text-gray-600 dark:text-gray-400'}`}
                    >
                      URL havola
                    </button>
                  </div>
                </div>

                {mediaUploadMode === 'file' ? (
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-emerald-500/40 hover:border-emerald-500 rounded-xl bg-white dark:bg-gray-800 cursor-pointer transition-all">
                    <Upload className="w-6 h-6 text-emerald-600 mb-1" />
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                      {uploadLoading ? 'Yuklanmoqda...' : 'Ustoz rasmini fayldan yuklash'}
                    </span>
                    <span className="text-[10px] text-gray-400 mt-0.5">Yuz qismi tepaga qarab avtomatik moslashtiriladi</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                ) : (
                  <Input
                    name="photo"
                    value={activeImage}
                    onChange={(e) => setActiveImage(e.target.value)}
                    placeholder="https://..."
                    required={!activeImage}
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Ustoz haqida maʼlumot (Bio)</label>
                <textarea
                  name="bio"
                  defaultValue={editingItem?.bio || ''}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
                  required
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked={editingItem?.isActive !== false && editingItem?.is_active !== false}
                  className="w-4 h-4 rounded text-emerald-600"
                />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Ustozni faollashtirish (Saytda koʻrinadi)</span>
              </label>

              <div className="flex justify-end gap-2 pt-3">
                <Button type="button" variant="outline" size="sm" onClick={closeEditor}>
                  Bekor qilish
                </Button>
                <Button type="submit" variant="primary" size="sm" icon={Save}>
                  Saqlash
                </Button>
              </div>
            </div>

            {/* Live Preview Box */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4 bg-gray-50 dark:bg-gray-900/60 p-4 rounded-2xl border border-gray-200 dark:border-gray-700">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-emerald-600" />
                    <span>Ustoz kartasi koʻrinishi</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold">
                    Saytda
                  </span>
                </div>

                <div className="rounded-3xl overflow-hidden bg-white dark:bg-[#1a2332] border border-gray-200 dark:border-gray-800 shadow-md">
                  <div className="h-56 relative bg-gray-950 overflow-hidden">
                    {activeImage ? (
                      <img
                        src={activeImage}
                        alt="Preview"
                        style={{ objectFit: activeFitMode, objectPosition: activePosition }}
                        className="w-full h-full transition-all duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Users className="w-10 h-10 opacity-40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent pointer-events-none" />
                    <span className="absolute bottom-3 left-3 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-600 dark:bg-emerald-500 text-white shadow-md">
                      {editingItem?.experience || '5+ yil'} tajriba
                    </span>
                  </div>
                  <div className="p-4 space-y-1">
                    <h4 className="text-base font-black text-gray-900 dark:text-white line-clamp-1">{editingItem?.name || 'Ustoz ismi'}</h4>
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{editingItem?.role || 'Mutaxassis'}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">{editingItem?.bio || 'Bio tavsifi'}</p>
                  </div>
                </div>
              </div>

              {/* Fit and Position controls */}
              <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block">
                  Fotosurat fokus va qoplash usuli:
                </span>
                <div className="grid grid-cols-3 gap-1.5 text-[11px] font-bold">
                  {['top', 'center', 'bottom'].map((pos) => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => setActivePosition(pos)}
                      className={`py-1.5 rounded-xl border text-center transition-all cursor-pointer ${activePosition === pos ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}
                    >
                      {pos === 'top' ? 'Tepa (Yuz)' : pos === 'center' ? 'Markaz' : 'Past'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* 5. YANGILIK (NEWS) MODAL */}
      {modalType === 'news' && (
        <Modal
          isOpen={true}
          onClose={closeEditor}
          size="2xl"
          title={editingItem?.id ? 'Yangilikni tahrirlash' : 'Yangi eʼlon va yangilik chop etish'}
        >
          <form onSubmit={handleSaveNews} className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[78vh] overflow-y-auto pr-1">
            <div className="lg:col-span-7 space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Sarlavha</label>
                <Input name="title" defaultValue={editingItem?.title || ''} placeholder="Masalan: Yangi mavsum uchun 100% grantlar eʼlon qilindi" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Kategoriya</label>
                  <Input name="category" defaultValue={editingItem?.category || 'Yangiliklar'} required />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Sana</label>
                  <Input type="date" name="date" defaultValue={editingItem?.date || editingItem?.published_at || new Date().toISOString().split('T')[0]} required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Oʻqish vaqti</label>
                <Input name="readTime" defaultValue={editingItem?.readTime || '3 daqiqa'} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Qisqacha mazmun (Excerpt / Anons)</label>
                <textarea
                  name="summary"
                  defaultValue={editingItem?.summary || editingItem?.excerpt || ''}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
                  required
                />
              </div>

              {/* Photo Upload / URL Controls */}
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    <span>Muqova rasmi</span>
                  </label>
                  <div className="flex items-center rounded-lg bg-gray-200 dark:bg-gray-800 p-0.5 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setMediaUploadMode('file')}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${mediaUploadMode === 'file' ? 'bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 shadow-xs' : 'text-gray-600 dark:text-gray-400'}`}
                    >
                      Fayl yuklash
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaUploadMode('url')}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${mediaUploadMode === 'url' ? 'bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 shadow-xs' : 'text-gray-600 dark:text-gray-400'}`}
                    >
                      URL havola
                    </button>
                  </div>
                </div>

                {mediaUploadMode === 'file' ? (
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-emerald-500/40 hover:border-emerald-500 rounded-xl bg-white dark:bg-gray-800 cursor-pointer transition-all">
                    <Upload className="w-6 h-6 text-emerald-600 mb-1" />
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                      {uploadLoading ? 'Yuklanmoqda...' : 'Kompyuterdan yangilik rasmini tanlang'}
                    </span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                ) : (
                  <Input
                    name="image"
                    value={activeImage}
                    onChange={(e) => setActiveImage(e.target.value)}
                    placeholder="https://..."
                    required={!activeImage}
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Toʻliq maqola matni</label>
                <textarea
                  name="content"
                  defaultValue={editingItem?.content || ''}
                  rows={4}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked={editingItem?.isActive !== false && editingItem?.is_published !== false}
                  className="w-4 h-4 rounded text-emerald-600"
                />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Yangilikni saytda chop etish</span>
              </label>

              <div className="flex justify-end gap-2 pt-3">
                <Button type="button" variant="outline" size="sm" onClick={closeEditor}>
                  Bekor qilish
                </Button>
                <Button type="submit" variant="primary" size="sm" icon={Save}>
                  Saqlash
                </Button>
              </div>
            </div>

            {/* Live Preview Box */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4 bg-gray-50 dark:bg-gray-900/60 p-4 rounded-2xl border border-gray-200 dark:border-gray-700">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-emerald-600" />
                    <span>Yangilik kartasi koʻrinishi</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold">
                    Saytda
                  </span>
                </div>

                <div className="rounded-3xl overflow-hidden bg-white dark:bg-[#1a2332] border border-gray-200 dark:border-gray-800 shadow-md">
                  <div className="h-44 relative bg-gray-950 overflow-hidden">
                    {activeImage ? (
                      <img
                        src={activeImage}
                        alt="Preview"
                        style={{ objectFit: activeFitMode, objectPosition: activePosition }}
                        className="w-full h-full transition-all duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Newspaper className="w-10 h-10 opacity-40" />
                      </div>
                    )}
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-600 text-white">
                      {editingItem?.category || 'Yangilik'}
                    </span>
                  </div>
                  <div className="p-3.5 space-y-1">
                    <h4 className="text-sm font-black text-gray-900 dark:text-white line-clamp-1">{editingItem?.title || 'Sarlavha'}</h4>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2">{editingItem?.summary || 'Qisqacha anons matni'}</p>
                    <div className="pt-2 text-[10px] text-gray-400 flex items-center justify-between">
                      <span>{editingItem?.date || 'Bugun'}</span>
                      <span className="text-emerald-600 font-bold">Batafsil oʻqish &rarr;</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block">
                  Rasm oʻlchami va fokusini sozlash:
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setActiveFitMode('cover')}
                    className={`py-1.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${activeFitMode === 'cover' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}
                  >
                    100% Qoplash (Cover)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFitMode('contain')}
                    className={`py-1.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${activeFitMode === 'contain' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}
                  >
                    Sigʻdirish (Contain)
                  </button>
                </div>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* 6. VIDEO MODAL */}
      {modalType === 'video' && (
        <Modal
          isOpen={true}
          onClose={closeEditor}
          size="2xl"
          title={editingItem?.id ? 'Video lavhani tahrirlash' : 'Yangi video lavha qoʻshish'}
        >
          <form onSubmit={handleSaveVideo} className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[78vh] overflow-y-auto pr-1">
            <div className="lg:col-span-7 space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Video sarlavhasi</label>
                <Input name="title" defaultValue={editingItem?.title || ''} placeholder="Masalan: Dars jarayonidan 2 daqiqalik video" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Kategoriya</label>
                  <Input name="category" defaultValue={editingItem?.category || 'Tanishtiruv'} required />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Davomiyligi (mm:ss)</label>
                  <Input name="duration" defaultValue={editingItem?.duration || '02:45'} required />
                </div>
              </div>

              {/* Video Source Controls */}
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-rose-600" />
                    <span>Video manbasi</span>
                  </label>
                  <div className="flex items-center rounded-lg bg-gray-200 dark:bg-gray-800 p-0.5 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setVideoUploadMode('url')}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${videoUploadMode === 'url' ? 'bg-white dark:bg-gray-700 text-rose-700 dark:text-rose-300 shadow-xs' : 'text-gray-600 dark:text-gray-400'}`}
                    >
                      YouTube / URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setVideoUploadMode('file')}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${videoUploadMode === 'file' ? 'bg-white dark:bg-gray-700 text-rose-700 dark:text-rose-300 shadow-xs' : 'text-gray-600 dark:text-gray-400'}`}
                    >
                      Fayl yuklash (.mp4)
                    </button>
                  </div>
                </div>

                {videoUploadMode === 'file' ? (
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-rose-500/40 hover:border-rose-500 rounded-xl bg-white dark:bg-gray-800 cursor-pointer transition-all">
                    <FileVideo className="w-6 h-6 text-rose-600 mb-1" />
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                      {uploadLoading ? 'Video yuklanmoqda...' : 'Kompyuterdan video faylni tanlang (.mp4, .webm)'}
                    </span>
                    <span className="text-[10px] text-gray-400 mt-0.5">Maksimal hajm: 25MB</span>
                    <input type="file" accept="video/mp4,video/webm,video/*" onChange={handleVideoUpload} className="hidden" />
                  </label>
                ) : (
                  <div>
                    <Input
                      name="videoUrl"
                      value={activeVideoUrl}
                      onChange={(e) => setActiveVideoUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=... yoki to‘g‘ridan-to‘g‘ri video URL"
                      required={!activeVideoUrl}
                    />
                    <span className="text-[10px] text-gray-400 mt-1 block">YouTube, Vimeo yoki bevosita .mp4 video havolasi</span>
                  </div>
                )}
              </div>

              {/* Thumbnail / Cover controls */}
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    <span>Video muqova rasmi (Thumbnail)</span>
                  </label>
                  <label className="text-[11px] font-bold text-emerald-600 hover:underline cursor-pointer">
                    <span>Fayldan rasm yuklash</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
                <Input
                  name="thumbnail"
                  value={activeImage}
                  onChange={(e) => setActiveImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Tavsif</label>
                <textarea
                  name="description"
                  defaultValue={editingItem?.description || ''}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
                  required
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked={editingItem?.isActive !== false && editingItem?.is_active !== false}
                  className="w-4 h-4 rounded text-emerald-600"
                />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Videoni faollashtirish (Saytda koʻrinadi)</span>
              </label>

              <div className="flex justify-end gap-2 pt-3">
                <Button type="button" variant="outline" size="sm" onClick={closeEditor}>
                  Bekor qilish
                </Button>
                <Button type="submit" variant="primary" size="sm" icon={Save}>
                  Saqlash
                </Button>
              </div>
            </div>

            {/* Live Video Player Preview (Right) */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4 bg-gray-50 dark:bg-gray-900/60 p-4 rounded-2xl border border-gray-200 dark:border-gray-700">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                    <Play className="w-4 h-4 text-rose-600" />
                    <span>Jonli Video Pleyer</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-bold">
                    Tekshirib koʻrish
                  </span>
                </div>

                {/* Video Playback Box */}
                <div className="relative w-full h-56 rounded-2xl overflow-hidden bg-black border border-gray-800 flex items-center justify-center">
                  {(() => {
                    const ytId = getYouTubeId(activeVideoUrl);
                    if (ytId) {
                      return (
                        <iframe
                          className="w-full h-full"
                          src={`https://www.youtube.com/embed/${ytId}?rel=0`}
                          title="YouTube video player"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      );
                    }
                    if (activeVideoUrl) {
                      return (
                        <video
                          src={activeVideoUrl}
                          controls
                          className="w-full h-full object-contain"
                        />
                      );
                    }
                    if (activeImage) {
                      return (
                        <div className="relative w-full h-full">
                          <img
                            src={activeImage}
                            alt="Thumbnail"
                            style={{ objectFit: activeFitMode }}
                            className="w-full h-full opacity-80"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <div className="w-12 h-12 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg">
                              <Play className="w-5 h-5 fill-current ml-0.5" />
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div className="text-center p-4 text-gray-400">
                        <Video className="w-8 h-8 mx-auto mb-1 opacity-50" />
                        <p className="text-xs">Video yoki muqova kiritilmagan</p>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block">
                  Muqova rasm oʻlchami nazorati:
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setActiveFitMode('cover')}
                    className={`py-1.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${activeFitMode === 'cover' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}
                  >
                    100% Qoplash (Cover)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFitMode('contain')}
                    className={`py-1.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${activeFitMode === 'contain' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}
                  >
                    Sigʻdirish (Contain)
                  </button>
                </div>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* 7. GALEREYA (GALLERY) MODAL */}
      {modalType === 'gallery' && (
        <Modal
          isOpen={true}
          onClose={closeEditor}
          size="2xl"
          title={editingItem?.id ? 'Galereya rasmini tahrirlash' : 'Darslardan yangi lavha qoʻshish'}
        >
          <form onSubmit={handleSaveGalleryItem} className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[78vh] overflow-y-auto pr-1">
            <div className="lg:col-span-7 space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Rasm sarlavhasi (Tavsif)</label>
                <Input name="title" defaultValue={editingItem?.title || ''} placeholder="Masalan: Frontend guruhining jamoaviy dars jarayoni" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Kategoriya</label>
                  <Input name="category" defaultValue={editingItem?.category || 'Darslar'} required />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Sana</label>
                  <Input type="date" name="date" defaultValue={editingItem?.date || new Date().toISOString().split('T')[0]} />
                </div>
              </div>

              {/* Image Upload / URL Controls */}
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-indigo-600" />
                    <span>Galereya rasmi</span>
                  </label>
                  <div className="flex items-center rounded-lg bg-gray-200 dark:bg-gray-800 p-0.5 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setMediaUploadMode('file')}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${mediaUploadMode === 'file' ? 'bg-white dark:bg-gray-700 text-indigo-700 dark:text-indigo-300 shadow-xs' : 'text-gray-600 dark:text-gray-400'}`}
                    >
                      Fayl yuklash
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaUploadMode('url')}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${mediaUploadMode === 'url' ? 'bg-white dark:bg-gray-700 text-indigo-700 dark:text-indigo-300 shadow-xs' : 'text-gray-600 dark:text-gray-400'}`}
                    >
                      URL havola
                    </button>
                  </div>
                </div>

                {mediaUploadMode === 'file' ? (
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-indigo-500/40 hover:border-indigo-500 rounded-xl bg-white dark:bg-gray-800 cursor-pointer transition-all">
                    <Upload className="w-6 h-6 text-indigo-600 mb-1" />
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                      {uploadLoading ? 'Yuklanmoqda...' : 'Rasmni kompyuterdan tanlang'}
                    </span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                ) : (
                  <Input
                    name="image"
                    value={activeImage}
                    onChange={(e) => setActiveImage(e.target.value)}
                    placeholder="https://..."
                    required={!activeImage}
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Qoʻshimcha izoh</label>
                <textarea
                  name="description"
                  defaultValue={editingItem?.description || editingItem?.caption || ''}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button type="button" variant="outline" size="sm" onClick={closeEditor}>
                  Bekor qilish
                </Button>
                <Button type="submit" variant="primary" size="sm" icon={Save}>
                  Saqlash
                </Button>
              </div>
            </div>

            {/* Live Preview Box */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4 bg-gray-50 dark:bg-gray-900/60 p-4 rounded-2xl border border-gray-200 dark:border-gray-700">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-emerald-600" />
                    <span>Galereya koʻrinishi</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 font-bold">
                    Saytda
                  </span>
                </div>

                <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-950 border border-gray-300 dark:border-gray-700">
                  {activeImage ? (
                    <img
                      src={activeImage}
                      alt="Preview"
                      style={{ objectFit: activeFitMode, objectPosition: activePosition }}
                      className="w-full h-full transition-all duration-200"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Camera className="w-10 h-10 opacity-40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-3 inset-x-3 text-white pointer-events-none">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                      {editingItem?.category || 'Darslar'}
                    </span>
                    <p className="text-xs font-bold line-clamp-1">{editingItem?.title || 'Rasm nomi'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block">
                  Rasm oʻlchami va fokusini sozlash:
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setActiveFitMode('cover')}
                    className={`py-1.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${activeFitMode === 'cover' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}
                  >
                    100% Qoplash (Cover)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFitMode('contain')}
                    className={`py-1.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${activeFitMode === 'contain' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}
                  >
                    Sigʻdirish (Contain)
                  </button>
                </div>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* 8. TESTIMONIAL (FIKR VA SHARH) MODAL */}
      {modalType === 'testimonial' && (
        <Modal
          isOpen={true}
          onClose={closeEditor}
          size="2xl"
          title={editingItem?.id ? 'Fikr va sharhni tahrirlash' : 'Yangi oʻquvchi fikri qoʻshish'}
        >
          <form onSubmit={handleSaveTestimonial} className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[78vh] overflow-y-auto pr-1">
            <div className="lg:col-span-7 space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Ism va familiya</label>
                <Input name="name" defaultValue={editingItem?.name || ''} placeholder="Masalan: Sardor Rustamov" required />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Rol / Kasbi / Guruh</label>
                <Input name="role" defaultValue={editingItem?.role || 'Frontend dasturchi, Bitiruvchi'} required />
              </div>

              {/* Rating picker */}
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Baho (Yulduzlar)</label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setActiveRating(star)}
                      className="p-1 text-amber-500 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star className={`w-5 h-5 ${star <= activeRating ? 'fill-current' : 'opacity-30'}`} />
                    </button>
                  ))}
                  <span className="text-xs font-bold ml-2 text-gray-600 dark:text-gray-400">{activeRating}.0 / 5.0</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Fikr / Sharh matni</label>
                <textarea
                  name="quote"
                  defaultValue={editingItem?.quote || ''}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
                  placeholder="Markaz haqida oʻquvchining samimiy fikri..."
                  required
                />
              </div>

              {/* Avatar Upload / URL Controls */}
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    <span>Oʻquvchi fotosurati (Avatar)</span>
                  </label>
                  <label className="text-[11px] font-bold text-emerald-600 hover:underline cursor-pointer">
                    <span>Fayl tanlash</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
                <Input
                  name="avatar"
                  value={activeImage}
                  onChange={(e) => setActiveImage(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button type="button" variant="outline" size="sm" onClick={closeEditor}>
                  Bekor qilish
                </Button>
                <Button type="submit" variant="primary" size="sm" icon={Save}>
                  Saqlash
                </Button>
              </div>
            </div>

            {/* Live Preview Box */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4 bg-gray-50 dark:bg-gray-900/60 p-4 rounded-2xl border border-gray-200 dark:border-gray-700">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-emerald-600" />
                    <span>Sharh kartasi koʻrinishi</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-bold">
                    Saytda
                  </span>
                </div>

                <div className="p-5 rounded-3xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md space-y-3">
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: activeRating || 5 }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 italic leading-relaxed">
                    &ldquo;{editingItem?.quote || 'Markazdagi amaliy muhit va ustozlarning individual yondashuvi sabab tezda natijaga erishdim.'}&rdquo;
                  </p>
                  <div className="flex items-center gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <img
                      src={activeImage || '/educo-logo.png'}
                      alt="Avatar"
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/educo-logo.png'; }}
                      className="w-10 h-10 rounded-full object-cover border border-emerald-500/40"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">{editingItem?.name || 'Oʻquvchi ismi'}</h4>
                      <p className="text-[10px] text-gray-400">{editingItem?.role || 'Frontend dasturchi'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmItem && (
        <Modal
          isOpen={true}
          onClose={() => setDeleteConfirmItem(null)}
          size="sm"
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
