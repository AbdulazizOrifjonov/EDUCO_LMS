import WebsiteFullPageEditor from './WebsiteFullPageEditor';
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
  Code,
  Film,
  Check,
  X,
  Maximize2,
  FileVideo,
  Clock,
  Send,
  HelpCircle,
  Crop,
  ZoomIn,
  ZoomOut,
  Move,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ImageCropperModal from '@/components/ui/ImageCropperModal';
import { toast } from '@/components/ui/Toast';
import websiteService, { getImageTransformStyle } from '@/services/websiteService';

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
  const actionParam = searchParams.get('action'); // 'edit' | 'create'
  const typeParam = searchParams.get('type');
  const idParam = searchParams.get('id');

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
  const [activeScale, setActiveScale] = useState(1); // 0.5 to 2.5 zoom
  const [activeOffsetX, setActiveOffsetX] = useState(0); // -50% to +50% horizontal pan
  const [activeOffsetY, setActiveOffsetY] = useState(0); // -50% to +50% vertical pan
  const [activeRating, setActiveRating] = useState(5);
  const [activeIcon, setActiveIcon] = useState('Sparkles');
  const [activeColor, setActiveColor] = useState('from-emerald-600 to-teal-700');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [mediaUploadMode, setMediaUploadMode] = useState('file'); // 'file' | 'url'
  const [videoUploadMode, setVideoUploadMode] = useState('url'); // 'file' | 'url'

  // Interactive Cropper States
  const [cropperFile, setCropperFile] = useState(null);
  const [cropperAspectRatio, setCropperAspectRatio] = useState('4:3');

  // Search filter inside lists
  const [searchQuery, setSearchQuery] = useState('');

  // Open Editor Helper (URL-Driven & Full Page)
  const openEditor = (type, item = null, updateUrl = true) => {
    setEditingItem(item);
    setModalType(type);

    if (updateUrl) {
      if (item?.id) {
        setSearchParams({ tab: currentTab, action: 'edit', type, id: String(item.id) });
      } else {
        setSearchParams({ tab: currentTab, action: 'create', type });
      }
    }

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
    setActiveFitMode(item?.fit_mode || item?.fitMode || 'cover');
    setActivePosition(item?.object_position || item?.objectPosition || (type === 'teacher' ? 'top' : 'center'));
    setActiveScale(Number(item?.image_scale || item?.imageScale || 1));
    setActiveOffsetX(Number(item?.image_offset_x || item?.imageOffsetX || 0));
    setActiveOffsetY(Number(item?.image_offset_y || item?.imageOffsetY || 0));
    setActiveRating(Number(item?.rating || 5));
    setActiveIcon(item?.icon_name || 'Sparkles');
    setActiveColor(item?.color || 'from-emerald-600 to-teal-700');
    setMediaUploadMode(initialImg?.startsWith('data:') ? 'file' : 'url');
    setVideoUploadMode(item?.video_url?.startsWith('data:') ? 'file' : 'url');
  };

  const closeEditor = (updateUrl = true) => {
    setModalType(null);
    setEditingItem(null);
    setActiveImage('');
    setActiveVideoUrl('');
    setActiveScale(1);
    setActiveOffsetX(0);
    setActiveOffsetY(0);
    setCropperFile(null);
    setUploadLoading(false);
    if (updateUrl) {
      setSearchParams({ tab: currentTab });
    }
  };

  // Sync URL search params with Full-Page Editor state
  useEffect(() => {
    if (actionParam && typeParam) {
      if (actionParam === 'edit' && idParam) {
        let found = null;
        if (typeParam === 'slide') found = slides.find((s) => String(s.id) === String(idParam));
        else if (typeParam === 'course') found = courses.find((c) => String(c.id) === String(idParam));
        else if (typeParam === 'subject') found = subjects.find((s) => String(s.id) === String(idParam));
        else if (typeParam === 'teacher') found = teachers.find((t) => String(t.id) === String(idParam));
        else if (typeParam === 'gallery') found = gallery.find((g) => String(g.id) === String(idParam));
        else if (typeParam === 'video') found = videos.find((v) => String(v.id) === String(idParam));
        else if (typeParam === 'news') found = news.find((n) => String(n.id) === String(idParam));
        else if (typeParam === 'testimonial') found = testimonials.find((t) => String(t.id) === String(idParam));

        if (found && (!editingItem || String(editingItem.id) !== String(found.id) || modalType !== typeParam)) {
          openEditor(typeParam, found, false);
        }
      } else if (actionParam === 'create') {
        if (!modalType || modalType !== typeParam) {
          const defaults = {
            slide: { order: slides.length + 1, isActive: true, fit_mode: 'cover' },
            course: { featured: true, isActive: true, fit_mode: 'cover' },
            subject: { coursesCount: 1, isActive: true, color: 'from-emerald-600 to-teal-700', icon_name: 'Sparkles' },
            teacher: { rating: 5, experience: '3+ yil', isActive: true, fit_mode: 'cover', object_position: 'top' },
            gallery: { category: 'Darslar', isActive: true, fit_mode: 'cover' },
            video: { duration: '03:00', category: 'Tanishtiruv', isActive: true, fit_mode: 'cover' },
            news: { date: new Date().toISOString().split('T')[0], readTime: '3 daqiqa', category: 'Yangiliklar', isActive: true, fit_mode: 'cover' },
            testimonial: { rating: 5, isActive: true, fit_mode: 'cover' },
          };
          openEditor(typeParam, defaults[typeParam] || {}, false);
        }
      }
    } else if (!actionParam && modalType) {
      closeEditor(false);
    }
  }, [actionParam, typeParam, idParam, slides, courses, subjects, teachers, gallery, videos, news, testimonials]);

  // File Upload Handlers with Automatic Apply & Clean Removal
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      toast.error('Rasm hajmi 25MB dan oshmasligi kerak');
      return;
    }

    setUploadLoading(true);

    // 1. Upload directly to server for fast cross-device URL sync
    try {
      const formData = new FormData();
      formData.append('file', file, file.name || 'image.jpg');

      const res = await fetch('/api/chat/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.url) {
          setActiveImage(data.url);
          setActiveScale(1);
          setActiveOffsetX(0);
          setActiveOffsetY(0);
          setUploadLoading(false);
          toast.success('Yangi rasm tanlandi va serverga yuklandi!');
          e.target.value = '';
          return;
        }
      }
    } catch (netErr) {
      console.warn('Direct server upload fallback to compressed image:', netErr);
    }

    // 2. Fallback: Compress image via Canvas so it never exceeds localStorage quota
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const MAX_WIDTH = 1280;
          const MAX_HEIGHT = 1280;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.round(width);
          canvas.height = Math.round(height);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const compressed = canvas.toDataURL('image/jpeg', 0.82);
          setActiveImage(compressed);
          setActiveScale(1);
          setActiveOffsetX(0);
          setActiveOffsetY(0);
          setUploadLoading(false);
          toast.success('Yangi rasm tanlandi va avtomatik o‘rnatildi!');
        };
        img.onerror = () => {
          setActiveImage(event.target.result);
          setUploadLoading(false);
        };
        img.src = event.target.result;
      };
      reader.onerror = () => {
        setUploadLoading(false);
        toast.error('Rasmni yuklashda xatolik yuz berdi');
      };
      reader.readAsDataURL(file);
    } catch (_) {
      setUploadLoading(false);
    }

    e.target.value = '';
  };

  const handleRemoveImage = () => {
    setActiveImage('');
    setActiveScale(1);
    setActiveOffsetX(0);
    setActiveOffsetY(0);
    toast.success('Rasm butunlay o‘chirib tashlandi!');
  };

  const handleOpenCropperForExisting = (customRatio) => {
    if (!activeImage) {
      toast.error('Avval rasm yuklang');
      return;
    }
    const ratio = customRatio || (
      modalType === 'teacher' ? '4:3' :
      modalType === 'testimonial' ? '1:1' :
      modalType === 'subject' ? '4:3' :
      modalType === 'gallery' ? '4:3' :
      '16:9'
    );
    setCropperAspectRatio(ratio);
    setCropperFile(activeImage);
  };

  const handleCropComplete = async (croppedDataUrl) => {
    setCropperFile(null);
    if (!croppedDataUrl) return;

    // Immediately reset offsets and scale so the newly cropped image fits perfectly 1:1
    setActiveScale(1);
    setActiveOffsetX(0);
    setActiveOffsetY(0);
    setActiveFitMode('cover');
    setActivePosition('center');

    // Immediately set active image for instant live UI update (zero latency)
    setActiveImage(croppedDataUrl);
    toast.success('Rasm muvaffaqiyatli moslashtirildi va saqlandi!');

    // Upload cropped image to server in background for cross-device persistence
    try {
      const res = await fetch(croppedDataUrl);
      const blob = await res.blob();
      const formData = new FormData();
      formData.append('file', blob, `crop_${Date.now()}.jpg`);
      const uploadRes = await fetch('/api/chat/upload', { method: 'POST', body: formData });
      if (uploadRes.ok) {
        const data = await uploadRes.json();
        if (data && data.url) {
          setActiveImage(data.url);
        }
      }
    } catch (_) {}
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Video hajmi 50MB dan oshmasligi kerak. Katta videolar uchun YouTube havolasidan foydalaning.');
      return;
    }
    setUploadLoading(true);

    // 1. Upload to server
    try {
      const formData = new FormData();
      formData.append('file', file, file.name || 'video.mp4');

      const res = await fetch('/api/chat/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.url) {
          setActiveVideoUrl(data.url);
          setUploadLoading(false);
          toast.success(`"${file.name}" video muvaffaqiyatli serverga yuklandi!`);
          e.target.value = '';
          return;
        }
      }
    } catch (netErr) {
      console.warn('Server video upload failed, fallback to local file reader:', netErr);
    }

    // 2. Fallback
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
    e.target.value = '';
  };

  // Helper to extract YouTube ID
  const getYouTubeId = (url) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : '';
  };

  const renderImageControls = () => null;

  // ---------------------------------------------------------------------------
  // CRUD Actions
  // ---------------------------------------------------------------------------
  const handleSaveSlide = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const imgUrl = activeImage || '';
    const itemData = {
      id: editingItem?.id,
      title: fd.get('title') || '',
      subtitle: fd.get('subtitle') || '',
      tag: fd.get('tag') || 'Darslardan lavhalar',
      badge: fd.get('tag') || 'Darslardan lavhalar',
      primaryBtnText: fd.get('primaryBtnText') || 'Kurslarni ko‘rish',
      cta_text: fd.get('primaryBtnText') || 'Kurslarni ko‘rish',
      primaryBtnLink: fd.get('primaryBtnLink') || '#courses',
      cta_link: fd.get('primaryBtnLink') || '#courses',
      secondaryBtnText: fd.get('secondaryBtnText') || 'Biz haqimizda',
      secondary_cta_text: fd.get('secondaryBtnText') || 'Biz haqimizda',
      secondaryBtnLink: fd.get('secondaryBtnLink') || '#about',
      secondary_cta_link: fd.get('secondaryBtnLink') || '#about',
      image: imgUrl,
      image_url: imgUrl,
      fit_mode: activeFitMode,
      object_position: activePosition,
      image_scale: activeScale,
      image_offset_x: activeOffsetX,
      image_offset_y: activeOffsetY,
      order: Number(fd.get('order') || 1),
      isActive: fd.get('isActive') === 'on',
      is_active: fd.get('isActive') === 'on',
      updated_at: new Date().toISOString(),
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
    const imgUrl = activeImage || '';
    const teacherName = fd.get('teacherName') || fd.get('teacher_name') || 'EDUCO Mentor';
    const lessonsCount = Number(fd.get('lessonsCount') || fd.get('lessons_count') || 36);
    const isFeatured = fd.get('featured') === 'on' || fd.get('is_popular') === 'on';
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
      image_scale: activeScale,
      image_offset_x: activeOffsetX,
      image_offset_y: activeOffsetY,
      featured: isFeatured,
      is_featured: isFeatured,
      isActive: fd.get('isActive') === 'on',
      is_active: fd.get('isActive') === 'on',
      syllabus: syllabusRaw.split('\n').map((s) => s.trim()).filter(Boolean),
      updated_at: new Date().toISOString(),
    };
    websiteService.saveWebsiteCourse(itemData);
    toast.success('Kurs maʼlumotlari saqlandi!');
    closeEditor();
    refreshAll();
  };

  const handleSaveSubject = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const imgUrl = activeImage || '';
    const count = Number(fd.get('coursesCount') || fd.get('courses_count') || 1);
    const itemData = {
      id: editingItem?.id,
      name: fd.get('name') || fd.get('title') || '',
      title: fd.get('name') || fd.get('title') || '',
      coursesCount: count,
      courses_count: count,
      icon_name: activeIcon,
      color: activeColor,
      description: fd.get('description') || '',
      image: imgUrl,
      image_url: imgUrl,
      fit_mode: activeFitMode,
      object_position: activePosition,
      image_scale: activeScale,
      image_offset_x: activeOffsetX,
      image_offset_y: activeOffsetY,
      isActive: fd.get('isActive') === 'on',
      is_active: fd.get('isActive') === 'on',
      updated_at: new Date().toISOString(),
    };
    websiteService.saveWebsiteSubject(itemData);
    toast.success('Fan muvaffaqiyatli saqlandi!');
    closeEditor();
    refreshAll();
  };

  const handleSaveTeacher = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const name = fd.get('name') || fd.get('full_name') || '';
    const photo = activeImage || '';
    const exp = fd.get('experience') || fd.get('experience_years') || '5+ yil';
    const subj = fd.get('subject') || fd.get('specialization') || '';
    const itemData = {
      id: editingItem?.id,
      name: name,
      full_name: name,
      role: fd.get('role') || 'Ustoz',
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
      image_scale: activeScale,
      image_offset_x: activeOffsetX,
      image_offset_y: activeOffsetY,
      telegram: fd.get('telegram') || '',
      bio: fd.get('bio') || '',
      isActive: fd.get('isActive') === 'on',
      is_active: fd.get('isActive') === 'on',
      updated_at: new Date().toISOString(),
    };
    websiteService.saveWebsiteTeacher(itemData);
    toast.success('Ustoz maʼlumotlari saqlandi!');
    closeEditor();
    refreshAll();
  };

  const handleSaveGalleryItem = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const imgUrl = activeImage || '';
    const caption = fd.get('caption') || fd.get('title') || 'Dars lavhasi';
    const tag = fd.get('tag') || fd.get('category') || 'Darslar';
    const order = Number(fd.get('order') || 1);
    const itemData = {
      id: editingItem?.id,
      title: caption,
      caption: caption,
      tag: tag,
      category: tag,
      order: order,
      date: fd.get('date') || new Date().toISOString().split('T')[0],
      image: imgUrl,
      image_url: imgUrl,
      fit_mode: activeFitMode,
      object_position: activePosition,
      image_scale: activeScale,
      image_offset_x: activeOffsetX,
      image_offset_y: activeOffsetY,
      description: caption,
      isActive: fd.get('isActive') === 'on',
      is_active: fd.get('isActive') === 'on',
      updated_at: new Date().toISOString(),
    };
    websiteService.saveWebsiteGalleryItem(itemData);
    toast.success('Lavha saqlandi!');
    closeEditor();
    refreshAll();
  };

  const handleSaveVideo = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const thumb = activeImage || '';
    const vUrl = activeVideoUrl || fd.get('video_url') || fd.get('videoUrl') || '';
    const ytId = getYouTubeId(vUrl);
    const itemData = {
      id: editingItem?.id,
      title: fd.get('title'),
      category: fd.get('category') || 'Dars lavhalari',
      duration: fd.get('duration') || '03:00',
      author: fd.get('author') || 'EDUCO Media',
      thumbnail: thumb,
      image: thumb,
      thumbnail_url: thumb,
      videoUrl: vUrl,
      video_url: vUrl,
      youtube_id: ytId,
      fit_mode: activeFitMode,
      object_position: activePosition,
      image_scale: activeScale,
      image_offset_x: activeOffsetX,
      image_offset_y: activeOffsetY,
      description: fd.get('description') || '',
      isActive: fd.get('isActive') === 'on',
      is_active: fd.get('isActive') === 'on',
      updated_at: new Date().toISOString(),
    };
    websiteService.saveWebsiteVideo(itemData);
    toast.success('Video lavha saqlandi!');
    closeEditor();
    refreshAll();
  };

  const handleSaveNews = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const imgUrl = activeImage || '';
    const sum = fd.get('summary') || '';
    const dt = fd.get('published_at') || fd.get('date') || new Date().toISOString().split('T')[0];
    const category = fd.get('tag') || fd.get('category') || 'Yangiliklar';
    const readTime = fd.get('read_time') || fd.get('readTime') || '3 daqiqa';
    const itemData = {
      id: editingItem?.id,
      title: fd.get('title'),
      category: category,
      tag: category,
      author: fd.get('author') || 'EDUCO Matbuot xizmati',
      date: dt,
      published_at: dt,
      readTime: readTime,
      read_time: readTime,
      image: imgUrl,
      cover_image: imgUrl,
      image_url: imgUrl,
      fit_mode: activeFitMode,
      object_position: activePosition,
      image_scale: activeScale,
      image_offset_x: activeOffsetX,
      image_offset_y: activeOffsetY,
      summary: sum,
      excerpt: sum,
      content: fd.get('content') || sum,
      is_published: fd.get('isActive') === 'on',
      isActive: fd.get('isActive') === 'on',
      updated_at: new Date().toISOString(),
    };
    websiteService.saveWebsiteNews(itemData);
    toast.success('Yangilik saqlandi!');
    closeEditor();
    refreshAll();
  };

  const handleSaveTestimonial = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const avatar = activeImage || '';
    const content = fd.get('content') || fd.get('quote') || '';
    const itemData = {
      id: editingItem?.id,
      name: fd.get('name') || fd.get('author') || 'O‘quvchi',
      author: fd.get('name') || fd.get('author') || 'O‘quvchi',
      role: fd.get('role') || 'O‘quvchi',
      quote: content,
      content: content,
      date: fd.get('date') || new Date().toISOString().split('T')[0],
      rating: Number(activeRating || 5),
      avatar: avatar,
      image: avatar,
      photo: avatar,
      fit_mode: activeFitMode,
      object_position: activePosition,
      image_scale: activeScale,
      image_offset_x: activeOffsetX,
      image_offset_y: activeOffsetY,
      isActive: fd.get('isActive') === 'on',
      is_active: fd.get('isActive') === 'on',
      updated_at: new Date().toISOString(),
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
    if (localStore && typeof localStore._recordDeletedId === 'function' && id) {
      localStore._recordDeletedId(id);
    }
    const targetType = type || modalType;
    if (targetType === 'slide') websiteService.deleteHeroSlide(id);
    if (targetType === 'course') websiteService.deleteWebsiteCourse(id);
    if (targetType === 'subject') websiteService.deleteWebsiteSubject(id);
    if (targetType === 'teacher') websiteService.deleteWebsiteTeacher(id);
    if (targetType === 'gallery') websiteService.deleteWebsiteGalleryItem(id);
    if (targetType === 'video') websiteService.deleteWebsiteVideo(id);
    if (targetType === 'news') websiteService.deleteWebsiteNews(id);
    if (targetType === 'testimonial') websiteService.deleteWebsiteTestimonial(id);

    toast.success('Muvaffaqiyatli oʻchirildi');
    setDeleteConfirmItem(null);
    if (modalType) {
      closeEditor();
    }
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

  // Dedicated Full-Page CRUD Editor: No Cramped Modals!
  const activeEditorType = modalType || (actionParam && typeParam ? typeParam : null);
  if (activeEditorType) {
    return (
      <WebsiteFullPageEditor
        modalType={activeEditorType}
        editingItem={editingItem}
        activeImage={activeImage}
        setActiveImage={setActiveImage}
        activeVideoUrl={activeVideoUrl}
        setActiveVideoUrl={setActiveVideoUrl}
        activeScale={activeScale}
        setActiveScale={setActiveScale}
        activeOffsetX={activeOffsetX}
        setActiveOffsetX={setActiveOffsetX}
        activeOffsetY={activeOffsetY}
        setActiveOffsetY={setActiveOffsetY}
        activeFitMode={activeFitMode}
        setActiveFitMode={setActiveFitMode}
        activePosition={activePosition}
        setActivePosition={setActivePosition}
        activeRating={activeRating}
        setActiveRating={setActiveRating}
        activeColor={activeColor}
        setActiveColor={setActiveColor}
        activeIcon={activeIcon}
        setActiveIcon={setActiveIcon}
        mediaUploadMode={mediaUploadMode}
        setMediaUploadMode={setMediaUploadMode}
        videoUploadMode={videoUploadMode}
        setVideoUploadMode={setVideoUploadMode}
        uploadLoading={uploadLoading}
        handleImageUpload={handleImageUpload}
        handleRemoveImage={handleRemoveImage}
        handleVideoUpload={handleVideoUpload}
        handleOpenCropperForExisting={handleOpenCropperForExisting}
        handleSaveSlide={handleSaveSlide}
        handleSaveCourse={handleSaveCourse}
        handleSaveSubject={handleSaveSubject}
        handleSaveTeacher={handleSaveTeacher}
        handleSaveNews={handleSaveNews}
        handleSaveVideo={handleSaveVideo}
        handleSaveGalleryItem={handleSaveGalleryItem}
        handleSaveTestimonial={handleSaveTestimonial}
        closeEditor={closeEditor}
        deleteConfirmItem={deleteConfirmItem}
        setDeleteConfirmItem={setDeleteConfirmItem}
        confirmDelete={confirmDelete}
        cropperFile={cropperFile}
        cropperAspectRatio={cropperAspectRatio}
        setCropperFile={setCropperFile}
        handleCropComplete={handleCropComplete}
      />
    );
  }

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

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full sm:w-auto shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshAll}
            className="!text-white hover:!bg-white/20 !rounded-xl flex-1 sm:flex-none justify-center"
            icon={RefreshCw}
          >
            Yangilash
          </Button>
          <a
            href={`/website${activeModule.targetHash || ''}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-emerald-900 font-extrabold text-xs sm:text-sm shadow-md hover:bg-emerald-50 hover:shadow-lg transition-all active:scale-95 flex-1 sm:flex-none"
            title="Rasmiy veb-saytni yangi oynada ochish"
          >
            <Eye className="w-4 h-4 text-emerald-600" />
            <span className="whitespace-nowrap">Saytni ochish</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </a>
        </div>
      </div>

      {/* Sub-Navigation Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1.5 border-b border-gray-200 dark:border-gray-800 -mx-4 px-4 sm:mx-0 sm:px-0 touch-pan-x scroll-smooth">
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
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  icon={Plus}
                  onClick={() => openEditor('slide', { order: slides.length + 1, isActive: true, fit_mode: 'cover' })}
                  className="!rounded-xl whitespace-nowrap"
                >
                  Yangi slayd qoʻshish
                </Button>
                <a
                  href="/owner/website?tab=slider&action=create&type=slide"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                  title="Yangi oynada ochish"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Yangi oynada</span>
                </a>
              </div>
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
                    style={getImageTransformStyle(slide, 'center')}
                    className="w-full h-full opacity-85 transition-transform"
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
                      <a
                        href={`/owner/website?tab=slider&action=edit&type=slide&id=${slide.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded-lg text-gray-500 hover:text-emerald-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="Yangi oynada ochish"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
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
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  icon={Plus}
                  onClick={() => openEditor('course', { featured: true, isActive: true, fit_mode: 'cover' })}
                  className="!rounded-xl whitespace-nowrap"
                >
                  Yangi kurs yaratish
                </Button>
                <a
                  href="/owner/website?tab=courses&action=create&type=course"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                  title="Yangi oynada ochish"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Yangi oynada</span>
                </a>
              </div>
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
                    style={getImageTransformStyle(course, 'center')}
                    className="w-full h-full transition-transform"
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
                      <a
                        href={`/owner/website?tab=courses&action=edit&type=course&id=${course.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded-lg text-gray-500 hover:text-emerald-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="Yangi oynada ochish"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
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
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  icon={Plus}
                  onClick={() => openEditor('subject', { coursesCount: 1, isActive: true, color: 'from-emerald-600 to-teal-700', icon_name: 'Sparkles' })}
                  className="!rounded-xl whitespace-nowrap"
                >
                  Yangi fan qoʻshish
                </Button>
                <a
                  href="/owner/website?tab=subjects&action=create&type=subject"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                  title="Yangi oynada ochish"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Yangi oynada</span>
                </a>
              </div>
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
                    <a
                      href={`/owner/website?tab=subjects&action=edit&type=subject&id=${subj.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded-lg text-gray-500 hover:text-emerald-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Yangi oynada ochish"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
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
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  icon={Plus}
                  onClick={() => openEditor('teacher', { rating: 5, experience: '3+ yil', isActive: true, fit_mode: 'cover', object_position: 'top' })}
                  className="!rounded-xl whitespace-nowrap"
                >
                  Ustoz qoʻshish
                </Button>
                <a
                  href="/owner/website?tab=teachers&action=create&type=teacher"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                  title="Yangi oynada ochish"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Yangi oynada</span>
                </a>
              </div>
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
                      style={getImageTransformStyle(teacher, 'top')}
                      className="w-full h-full transition-transform"
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
                    <a
                      href={`/owner/website?tab=teachers&action=edit&type=teacher&id=${teacher.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded-lg text-gray-500 hover:text-emerald-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Yangi oynada ochish"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
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
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  icon={Plus}
                  onClick={() => openEditor('news', { date: new Date().toISOString().split('T')[0], readTime: '3 daqiqa', category: 'Yangiliklar', isActive: true, fit_mode: 'cover' })}
                  className="!rounded-xl whitespace-nowrap"
                >
                  Yangilik eʼlon qilish
                </Button>
                <a
                  href="/owner/website?tab=news&action=create&type=news"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                  title="Yangi oynada ochish"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Yangi oynada</span>
                </a>
              </div>
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
                      style={getImageTransformStyle(item, 'center')}
                      className="w-full h-full transition-transform"
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
                    <a
                      href={`/owner/website?tab=news&action=edit&type=news&id=${item.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded-lg text-gray-500 hover:text-emerald-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Yangi oynada ochish"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
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
                      style={getImageTransformStyle(vid, 'center')}
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
                  <a
                    href={`/owner/website?tab=videos&action=edit&type=video&id=${vid.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded-lg text-gray-500 hover:text-emerald-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Yangi oynada ochish"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
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
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  icon={Plus}
                  onClick={() => openEditor('gallery', { category: 'Darslar', isActive: true, fit_mode: 'cover' })}
                  className="!rounded-xl whitespace-nowrap"
                >
                  Rasm qoʻshish
                </Button>
                <a
                  href="/owner/website?tab=gallery&action=create&type=gallery"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                  title="Yangi oynada ochish"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Yangi oynada</span>
                </a>
              </div>
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
                  style={getImageTransformStyle(img, 'center')}
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
                    <a
                      href={`/owner/website?tab=gallery&action=edit&type=gallery&id=${img.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-white/20 hover:bg-white/40 text-white text-xs cursor-pointer inline-flex items-center justify-center"
                      title="Yangi oynada ochish"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
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
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  icon={Plus}
                  onClick={() => openEditor('testimonial', { rating: 5, isActive: true, fit_mode: 'cover' })}
                  className="!rounded-xl whitespace-nowrap"
                >
                  Fikr qoʻshish
                </Button>
                <a
                  href="/owner/website?tab=testimonials&action=create&type=testimonial"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                  title="Yangi oynada ochish"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Yangi oynada</span>
                </a>
              </div>
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
                    <div className="w-9 h-9 rounded-full overflow-hidden border border-emerald-500/30 shrink-0">
                      <img
                        src={test.avatar || test.image || test.photo || '/educo-logo.png'}
                        alt={test.name || test.author}
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/educo-logo.png'; }}
                        style={getImageTransformStyle(test, 'center')}
                        className="w-full h-full transition-transform"
                      />
                    </div>
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
                    <a
                      href={`/owner/website?tab=testimonials&action=edit&type=testimonial&id=${test.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded-lg text-gray-500 hover:text-emerald-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Yangi oynada ochish"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
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

      {/* High-Contrast Delete Confirmation Modal Overlay */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 border border-red-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3.5 text-red-600 dark:text-red-400">
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/70 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-base text-gray-900 dark:text-white">
                  O‘chirishni tasdiqlaysizmi?
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Bu amalni qaytarib bo‘lmaydi
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-800/60 p-3 rounded-2xl border border-gray-200/60 dark:border-gray-700/60">
              <span className="font-bold text-gray-900 dark:text-white">
                "{deleteConfirmItem.title || deleteConfirmItem.name || 'Ushbu element'}"
              </span>{' '}
              saytdan butunlay o‘chiriladi va darhol olib tashlanadi.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmItem(null)}
                className="!rounded-xl font-bold flex-1 sm:flex-initial"
              >
                Bekor qilish
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={confirmDelete}
                icon={Trash2}
                className="!rounded-xl font-bold flex-1 sm:flex-initial"
              >
                Ha, butunlay o‘chirilsin
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Universal Telegram-style Image Cropper Modal */}
      {cropperFile && (
        <ImageCropperModal
          isOpen={Boolean(cropperFile)}
          imageFile={cropperFile instanceof File ? cropperFile : null}
          imageSrc={typeof cropperFile === 'string' ? cropperFile : null}
          aspectRatio={cropperAspectRatio || '16:9'}
          allowAspectChange={true}
          onClose={() => setCropperFile(null)}
          onCrop={handleCropComplete}
          onCropComplete={handleCropComplete}
          title="Fotosuratni kadrga moslashtirish"
          subtitle="Rasmni suring, kattalashtiring va kadr nisbatini tanlang"
        />
      )}
    </div>
  );
}
