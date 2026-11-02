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
import Modal from '@/components/ui/Modal';
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

  const closeEditor = () => {
    setModalType(null);
    setEditingItem(null);
    setActiveImage('');
    setActiveVideoUrl('');
    setActiveScale(1);
    setActiveOffsetX(0);
    setActiveOffsetY(0);
    setCropperFile(null);
    setUploadLoading(false);
  };

  // File Upload Handlers with Automatic Apply & Clean Removal
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error('Rasm hajmi 20MB dan oshmasligi kerak');
      return;
    }

    setUploadLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      // AUTOMATICALLY SET IMMEDIATELY! Old image is replaced cleanly without forcing crop dialog
      setActiveImage(dataUrl);
      setActiveScale(1);
      setActiveOffsetX(0);
      setActiveOffsetY(0);
      setUploadLoading(false);
      toast.success('Yangi rasm tanlandi va avtomatik o‘rnatildi!');
    };
    reader.onerror = () => {
      setUploadLoading(false);
      toast.error('Rasmni yuklashda xatolik yuz berdi');
    };
    reader.readAsDataURL(file);
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

  const handleCropComplete = (croppedDataUrl) => {
    setActiveImage(croppedDataUrl);
    setCropperFile(null);
    toast.success('Rasm muvaffaqiyatli moslashtirildi!');
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

  const renderImageControls = (label = "Fotosurat masshtabi va joylashuvi:") => (
    <div className="p-3.5 rounded-2xl bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700/80 space-y-3.5 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-emerald-600" />
          <span>{label}</span>
        </span>
        <button
          type="button"
          onClick={() => {
            setActiveScale(1);
            setActiveOffsetX(0);
            setActiveOffsetY(0);
            setActivePosition('center');
            setActiveFitMode('cover');
          }}
          className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer flex items-center gap-1"
          title="Barcha parametrlarni asliga qaytarish"
        >
          <RotateCcw className="w-2.5 h-2.5" />
          <span>Asliga</span>
        </button>
      </div>

      {/* 1. Fit Mode & Quick Position Presets */}
      <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
        <div>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 block mb-1">To‘ldirish usuli:</span>
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setActiveFitMode('cover')}
              className={`py-1.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                activeFitMode === 'cover'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-gray-50 dark:bg-gray-900/60 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
              }`}
            >
              Qoplash (Cover)
            </button>
            <button
              type="button"
              onClick={() => setActiveFitMode('contain')}
              className={`py-1.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                activeFitMode === 'contain'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-gray-50 dark:bg-gray-900/60 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
              }`}
            >
              Sig‘dirish (Contain)
            </button>
          </div>
        </div>

        <div>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 block mb-1">Fokus pozitsiyasi:</span>
          <div className="grid grid-cols-3 gap-1">
            {[
              { id: 'top', label: 'Tepa' },
              { id: 'center', label: 'Markaz' },
              { id: 'bottom', label: 'Past' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setActivePosition(p.id)}
                className={`py-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                  activePosition === p.id
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-gray-50 dark:bg-gray-900/60 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Scale / Zoom Slider */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] font-bold text-gray-700 dark:text-gray-300">
          <span className="flex items-center gap-1">
            <ZoomIn className="w-3.5 h-3.5 text-emerald-600" />
            <span>Kattalashtirish / Kichraytirish (Zoom):</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-black">{Math.round(activeScale * 100)}%</span>
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveScale((prev) => Math.max(0.5, +(prev - 0.1).toFixed(2)))}
              className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-200 flex items-center justify-center font-black text-xs cursor-pointer active:scale-90"
              title="10% kichraytirish"
            >
              -
            </button>
            <button
              type="button"
              onClick={() => setActiveScale((prev) => Math.min(2.5, +(prev + 0.1).toFixed(2)))}
              className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-200 flex items-center justify-center font-black text-xs cursor-pointer active:scale-90"
              title="10% kattalashtirish"
            >
              +
            </button>
          </div>
        </div>
        <input
          type="range"
          min="0.5"
          max="2.5"
          step="0.05"
          value={activeScale}
          onChange={(e) => setActiveScale(parseFloat(e.target.value))}
          className="w-full accent-emerald-600 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
        />
      </div>

      {/* 3. Horizontal & Vertical Pan Sliders + Directional Arrow D-Pad */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
        {/* Sliders on left (8 cols) */}
        <div className="sm:col-span-8 space-y-2">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-gray-700 dark:text-gray-300">
              <span className="flex items-center gap-1">
                <Move className="w-3 h-3 text-emerald-600" />
                <span>Gorizontal surish (Chap / O‘ng):</span>
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-black">
                {activeOffsetX > 0 ? `+${activeOffsetX}%` : `${activeOffsetX}%`}
              </span>
            </div>
            <input
              type="range"
              min="-50"
              max="50"
              step="1"
              value={activeOffsetX}
              onChange={(e) => setActiveOffsetX(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-600 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-gray-700 dark:text-gray-300">
              <span className="flex items-center gap-1">
                <Move className="w-3 h-3 text-emerald-600" />
                <span>Vertikal surish (Tepa / Past):</span>
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-black">
                {activeOffsetY > 0 ? `+${activeOffsetY}%` : `${activeOffsetY}%`}
              </span>
            </div>
            <input
              type="range"
              min="-50"
              max="50"
              step="1"
              value={activeOffsetY}
              onChange={(e) => setActiveOffsetY(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-600 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* D-Pad Buttons on right (4 cols) */}
        <div className="sm:col-span-4 flex flex-col items-center justify-center p-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">
            Yo‘nalishlar
          </span>
          <div className="grid grid-cols-3 gap-1 w-24">
            <div />
            <button
              type="button"
              onClick={() => setActiveOffsetY((prev) => Math.max(-50, prev - 5))}
              className="h-7 w-7 rounded-lg bg-white dark:bg-gray-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 flex items-center justify-center font-bold text-xs shadow-2xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title="Yuqoriga surish"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <div />

            <button
              type="button"
              onClick={() => setActiveOffsetX((prev) => Math.max(-50, prev - 5))}
              className="h-7 w-7 rounded-lg bg-white dark:bg-gray-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 flex items-center justify-center font-bold text-xs shadow-2xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title="Chapga surish"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveOffsetX(0);
                setActiveOffsetY(0);
              }}
              className="h-7 w-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center font-black text-[10px] shadow-2xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title="Markazga qaytarish"
            >
              •
            </button>
            <button
              type="button"
              onClick={() => setActiveOffsetX((prev) => Math.min(50, prev + 5))}
              className="h-7 w-7 rounded-lg bg-white dark:bg-gray-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 flex items-center justify-center font-bold text-xs shadow-2xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title="O‘ngga surish"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <div />
            <button
              type="button"
              onClick={() => setActiveOffsetY((prev) => Math.min(50, prev + 5))}
              className="h-7 w-7 rounded-lg bg-white dark:bg-gray-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 flex items-center justify-center font-bold text-xs shadow-2xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title="Pastga surish"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <div />
          </div>
        </div>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // CRUD Actions
  // ---------------------------------------------------------------------------
  const handleSaveSlide = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const imgUrl = activeImage || '';
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
    const name = fd.get('name');
    const photo = activeImage || '';
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
      image_scale: activeScale,
      image_offset_x: activeOffsetX,
      image_offset_y: activeOffsetY,
      telegram: fd.get('telegram') || '',
      bio: fd.get('bio'),
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
      image_scale: activeScale,
      image_offset_x: activeOffsetX,
      image_offset_y: activeOffsetY,
      description: desc,
      caption: desc,
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
      image_scale: activeScale,
      image_offset_x: activeOffsetX,
      image_offset_y: activeOffsetY,
      description: fd.get('description'),
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
  if (modalType) {
    return (
      <WebsiteFullPageEditor
        modalType={modalType}
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

      {/* Universal Interactive Image Cropper Modal for Website Management */}
      <ImageCropperModal
        isOpen={Boolean(cropperFile)}
        imageFile={cropperFile}
        onClose={() => setCropperFile(null)}
        onCrop={handleCropComplete}
        aspectRatio={cropperAspectRatio}
        allowAspectChange={true}
        title={
          modalType === 'teacher'
            ? 'Ustoz fotosuratini moslashtirish'
            : modalType === 'slider'
            ? 'Slayder bannerini moslashtirish'
            : modalType === 'course'
            ? 'Kurs muqovasini moslashtirish'
            : modalType === 'subject'
            ? 'Fan muqovasini moslashtirish'
            : modalType === 'gallery'
            ? 'Dars lavhasini moslashtirish'
            : modalType === 'news'
            ? 'Yangilik rasmini moslashtirish'
            : modalType === 'testimonial'
            ? 'Mijoz rasmini moslashtirish'
            : 'Rasmni moslashtirish'
        }
        subtitle="Rasmni suring, kattalashtiring, burang va to‘g‘ri joylashtiring"
      />
    </div>
  );
}
