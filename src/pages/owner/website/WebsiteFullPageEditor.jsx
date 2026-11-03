import React from 'react';
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
  Link as LinkIcon,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const SUBJECT_ICONS = [
  { name: 'Calculator', icon: Calculator, label: 'Matematika' },
  { name: 'Cpu', icon: Cpu, label: 'IT & Robototexnika' },
  { name: 'Code', icon: Code, label: 'Dasturlash' },
  { name: 'Globe', icon: Globe, label: 'Tillar' },
  { name: 'BookOpen', icon: BookOpen, label: 'Gumanitar' },
  { name: 'Palette', icon: Palette, label: 'Dizayn' },
  { name: 'Film', icon: Film, label: 'Media' },
  { name: 'Sparkles', icon: Sparkles, label: 'Boshqa' },
];

// Safe price display helper that never returns 'NaN so'm'
const formatPriceDisplay = (val, defaultVal = "650,000 soʻm") => {
  if (val === undefined || val === null || val === '') return defaultVal;
  if (typeof val === 'number') {
    return isNaN(val) ? defaultVal : `${val.toLocaleString()} soʻm`;
  }
  const str = String(val).trim();
  if (str.toLowerCase().includes("so'm") || str.toLowerCase().includes("soʻm") || str.toLowerCase().includes("som")) {
    return str;
  }
  const digitsOnly = str.replace(/[^\d]/g, '');
  if (digitsOnly) {
    const num = Number(digitsOnly);
    return isNaN(num) ? defaultVal : `${num.toLocaleString()} soʻm`;
  }
  return str || defaultVal;
};

export default function WebsiteFullPageEditor({
  modalType,
  editingItem,
  activeImage,
  setActiveImage,
  activeVideoUrl,
  setActiveVideoUrl,
  activeScale,
  setActiveScale,
  activeOffsetX,
  setActiveOffsetX,
  activeOffsetY,
  setActiveOffsetY,
  activeFitMode,
  setActiveFitMode,
  activePosition,
  setActivePosition,
  activeRating,
  setActiveRating,
  activeColor,
  setActiveColor,
  activeIcon,
  setActiveIcon,
  mediaUploadMode,
  setMediaUploadMode,
  videoUploadMode,
  setVideoUploadMode,
  uploadLoading,
  handleImageUpload,
  handleRemoveImage,
  handleVideoUpload,
  handleOpenCropperForExisting,
  handleSaveSlide,
  handleSaveCourse,
  handleSaveSubject,
  handleSaveTeacher,
  handleSaveNews,
  handleSaveVideo,
  handleSaveGalleryItem,
  handleSaveTestimonial,
  closeEditor,
  deleteConfirmItem,
  setDeleteConfirmItem,
  confirmDelete,
  cropperFile,
  cropperAspectRatio,
  setCropperFile,
  handleCropComplete,
}) {
  if (!modalType) return null;

  const editorConfig = {
    slide: {
      title: editingItem?.id ? 'Hero Slaydni tahrirlash' : 'Yangi Hero Slayd yaratish',
      moduleName: 'Bosh sahifa slayderi',
      icon: Sliders,
    },
    course: {
      title: editingItem?.id ? 'Kurs ma’lumotlarini tahrirlash' : 'Yangi kurs qo‘shish',
      moduleName: 'Kurslar katalogi',
      icon: BookOpen,
    },
    subject: {
      title: editingItem?.id ? 'Fan ma’lumotlarini tahrirlash' : 'Yangi fan qo‘shish',
      moduleName: 'Fanlar ro‘yxati',
      icon: GraduationCap,
    },
    teacher: {
      title: editingItem?.id ? 'Ustoz ma’lumotlarini tahrirlash' : 'Yangi ustoz qo‘shish',
      moduleName: 'Ustozlar tarkibi',
      icon: Users,
    },
    news: {
      title: editingItem?.id ? 'Yangilikni tahrirlash' : 'Yangi e’lon va yangilik qo‘shish',
      moduleName: 'Yangiliklar va e’lonlar',
      icon: Newspaper,
    },
    video: {
      title: editingItem?.id ? 'Video lavhani tahrirlash' : 'Yangi video lavha qo‘shish',
      moduleName: 'Video lavhalar',
      icon: Video,
    },
    gallery: {
      title: editingItem?.id ? 'Galereya rasmini tahrirlash' : 'Yangi dars lavhasi (foto) qo‘shish',
      moduleName: 'Darslardan lavhalar',
      icon: ImageIcon,
    },
    testimonial: {
      title: editingItem?.id ? 'O‘quvchi fikrini tahrirlash' : 'Yangi o‘quvchi fikrini qo‘shish',
      moduleName: 'O‘quvchilar fikrlari',
      icon: MessageSquareQuote,
    },
  };

  const currentConfig = editorConfig[modalType] || {
    title: 'Ma’lumotlarni tahrirlash',
    moduleName: 'Veb-sayt bo‘limi',
    icon: Layers,
  };
  const ModuleIcon = currentConfig.icon;
  const formId = 'website-editor-form';

    // Interactive Drag-to-Pan support on media images
  const handleImageDragStart = (e) => {
    e.preventDefault();
    const startX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : undefined);
    const startY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : undefined);
    if (startX === undefined || startY === undefined) return;
    const initialX = activeOffsetX;
    const initialY = activeOffsetY;

    const onMove = (moveEvent) => {
      const curX = moveEvent.clientX || (moveEvent.touches && moveEvent.touches[0] ? moveEvent.touches[0].clientX : undefined);
      const curY = moveEvent.clientY || (moveEvent.touches && moveEvent.touches[0] ? moveEvent.touches[0].clientY : undefined);
      if (curX === undefined || curY === undefined) return;
      const deltaX = Math.round((curX - startX) / 2.5);
      const deltaY = Math.round((curY - startY) / 2.5);
      const newX = Math.max(-50, Math.min(50, initialX + deltaX));
      const newY = Math.max(-50, Math.min(50, initialY + deltaY));
      setActiveOffsetX(newX);
      setActiveOffsetY(newY);
    };

    const onEnd = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onEnd);
  };

  // Smart Auto-apply Image Upload Box with Live Interactive Media Studio & Controls
  const renderImageUploadBox = (label = 'Fotosurat', aspectHint = '4:3 nisbat tavsiya etiladi', fieldName = 'image') => (
    <div className="p-4 sm:p-6 rounded-3xl bg-gray-50 dark:bg-gray-800/70 border-2 border-gray-200 dark:border-gray-700/80 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <label className="text-xs sm:text-sm font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <ImageIcon className="w-4 h-4" />
          </div>
          <span>{label}</span>
        </label>
        {activeImage ? (
          <span className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/90 px-3 py-1 rounded-full border border-emerald-300 dark:border-emerald-700 flex items-center gap-1.5 shadow-2xs">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Rasm o‘rnatilgan</span>
          </span>
        ) : (
          <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">
            Hali rasm tanlanmagan
          </span>
        )}
      </div>

      {activeImage ? (
        <div className="space-y-4">
          {/* 1. Live Interactive Visual Canvas (Drag-to-pan) */}
          <div className="relative rounded-2xl overflow-hidden bg-gray-950 border-2 border-emerald-500/50 shadow-inner group">
            <div
              className="w-full h-56 sm:h-72 relative overflow-hidden select-none cursor-grab active:cursor-grabbing flex items-center justify-center bg-gray-900"
              onMouseDown={handleImageDragStart}
              onTouchStart={handleImageDragStart}
              title="Rasmni sichqoncha yoki barmoq bilan ushlab xohlagan tomonga suring"
            >
              <img
                src={activeImage}
                alt="Yuklangan rasm"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/educo-logo.png'; }}
                style={{
                  objectFit: activeFitMode,
                  objectPosition: activePosition,
                  transform: `scale(${activeScale}) translate(${activeOffsetX}%, ${activeOffsetY}%)`,
                  transformOrigin: 'center center',
                }}
                className="w-full h-full pointer-events-none transition-transform duration-75"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30 pointer-events-none" />

              {/* Floating guidance and coordinates (Single responsive flex bar that never collides) */}
              <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-1.5 pointer-events-none">
                <span className="px-2.5 py-1 rounded-xl bg-black/80 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1.5 border border-white/20 shadow-md">
                  <Move className="w-3 h-3 text-emerald-400 animate-pulse" />
                  <span className="hidden xs:inline">Surish mumkin</span>
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-black/80 backdrop-blur-md text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/30 shadow-md">
                  {Math.round(activeScale * 100)}% • X:{activeOffsetX > 0 ? `+${activeOffsetX}` : activeOffsetX}% Y:{activeOffsetY > 0 ? `+${activeOffsetY}` : activeOffsetY}%
                </span>
              </div>

              {/* Asliga qaytarish button inside frame */}
              <button
                type="button"
                onClick={() => {
                  setActiveScale(1);
                  setActiveOffsetX(0);
                  setActiveOffsetY(0);
                  setActivePosition('center');
                  setActiveFitMode('cover');
                }}
                className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-black/80 hover:bg-black text-white hover:text-emerald-300 text-xs font-bold transition-all flex items-center gap-1.5 border border-white/25 cursor-pointer shadow-lg active:scale-95"
                title="Barcha surish va masshtabni asliga qaytarish"
              >
                <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                <span>Asliga qaytarish</span>
              </button>
            </div>
          </div>

          {/* 2. Direct Pan & Zoom Control Studio */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/80 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-gray-100 dark:border-gray-700/60">
              <span className="text-xs sm:text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Rasmni surish va moslashtirish paneli</span>
              </span>
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-lg">
                Jonli boshqaruv
              </span>
            </div>

            {/* A. Chapga / O'ngga Surish (Gorizontal) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <ArrowLeft className="w-3.5 h-3.5 text-blue-500" />
                  <ArrowRight className="w-3.5 h-3.5 text-blue-500" />
                  <span>Chapga / O‘ngga surish (Gorizontal):</span>
                </span>
                <span className="font-mono text-blue-600 dark:text-blue-400 font-extrabold text-xs">
                  {activeOffsetX === 0 ? 'Markaz (0%)' : activeOffsetX > 0 ? `+${activeOffsetX}% (O‘ngga)` : `${activeOffsetX}% (Chapga)`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveOffsetX((prev) => Math.max(-50, prev - 5))}
                  className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-gray-800 dark:text-gray-200 hover:text-blue-600 text-xs font-extrabold transition-all flex items-center gap-1 cursor-pointer shrink-0 border border-gray-200 dark:border-gray-600 shadow-2xs active:scale-95"
                  title="Chapga surish (-5%)"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Chapga
                </button>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  step="1"
                  value={activeOffsetX}
                  onChange={(e) => setActiveOffsetX(parseInt(e.target.value, 10))}
                  className="flex-1 accent-blue-600 cursor-pointer h-2 bg-gray-200 dark:bg-gray-700 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setActiveOffsetX((prev) => Math.min(50, prev + 5))}
                  className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-gray-800 dark:text-gray-200 hover:text-blue-600 text-xs font-extrabold transition-all flex items-center gap-1 cursor-pointer shrink-0 border border-gray-200 dark:border-gray-600 shadow-2xs active:scale-95"
                  title="O‘ngga surish (+5%)"
                >
                  O‘ngga <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* B. Tepaga / Pastga Surish (Vertikal) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <ArrowUp className="w-3.5 h-3.5 text-purple-500" />
                  <ArrowDown className="w-3.5 h-3.5 text-purple-500" />
                  <span>Tepaga / Pastga surish (Vertikal):</span>
                </span>
                <span className="font-mono text-purple-600 dark:text-purple-400 font-extrabold text-xs">
                  {activeOffsetY === 0 ? 'Markaz (0%)' : activeOffsetY > 0 ? `+${activeOffsetY}% (Pastga)` : `${activeOffsetY}% (Tepaga)`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveOffsetY((prev) => Math.max(-50, prev - 5))}
                  className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-gray-800 dark:text-gray-200 hover:text-purple-600 text-xs font-extrabold transition-all flex items-center gap-1 cursor-pointer shrink-0 border border-gray-200 dark:border-gray-600 shadow-2xs active:scale-95"
                  title="Tepaga surish (-5%)"
                >
                  <ArrowUp className="w-3.5 h-3.5" /> Tepaga
                </button>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  step="1"
                  value={activeOffsetY}
                  onChange={(e) => setActiveOffsetY(parseInt(e.target.value, 10))}
                  className="flex-1 accent-purple-600 cursor-pointer h-2 bg-gray-200 dark:bg-gray-700 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setActiveOffsetY((prev) => Math.min(50, prev + 5))}
                  className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-gray-800 dark:text-gray-200 hover:text-purple-600 text-xs font-extrabold transition-all flex items-center gap-1 cursor-pointer shrink-0 border border-gray-200 dark:border-gray-600 shadow-2xs active:scale-95"
                  title="Pastga surish (+5%)"
                >
                  Pastga <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* C. Kattalashtirish (Zoom) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <ZoomIn className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Kattalashtirish / Kichraytirish (Masshtab):</span>
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-extrabold text-xs">
                  {Math.round(activeScale * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveScale(Math.max(0.5, Number((activeScale - 0.1).toFixed(2))))}
                  className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-emerald-50 text-gray-800 dark:text-gray-200 hover:text-emerald-600 text-sm font-black flex items-center justify-center border border-gray-200 dark:border-gray-600 cursor-pointer shadow-2xs active:scale-95"
                  title="Kichraytirish (-10%)"
                >
                  -
                </button>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.05"
                  value={activeScale}
                  onChange={(e) => setActiveScale(parseFloat(e.target.value))}
                  className="flex-1 accent-emerald-600 cursor-pointer h-2 bg-gray-200 dark:bg-gray-700 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setActiveScale(Math.min(3, Number((activeScale + 0.1).toFixed(2))))}
                  className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-emerald-50 text-gray-800 dark:text-gray-200 hover:text-emerald-600 text-sm font-black flex items-center justify-center border border-gray-200 dark:border-gray-600 cursor-pointer shadow-2xs active:scale-95"
                  title="Kattalashtirish (+10%)"
                >
                  +
                </button>
              </div>
            </div>

            {/* D. To'ldirish & Fokus */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100 dark:border-gray-700/60">
              <div>
                <span className="text-[11px] font-bold text-gray-600 dark:text-gray-400 block mb-1">To‘ldirish usuli:</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveFitMode('cover')}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
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
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
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
                <span className="text-[11px] font-bold text-gray-600 dark:text-gray-400 block mb-1">Fokus pozitsiyasi:</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'top', label: 'Tepa' },
                    { id: 'center', label: 'Markaz' },
                    { id: 'bottom', label: 'Past' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setActivePosition(p.id)}
                      className={`py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
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
          </div>

          {/* 3. Media Action Buttons: Change Photo & Delete */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
            <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-emerald-500/50 hover:border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] shadow-2xs">
              <Upload className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{uploadLoading ? 'Yuklanmoqda...' : 'Boshqa rasm yuklash (Kompyuterdan)'}</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>

            <Button
              type="button"
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={handleRemoveImage}
              className="!rounded-xl text-xs font-bold"
              title="Rasmni butunlay o‘chirib tashlash"
            >
              Rasmni butunlay o‘chirish
            </Button>
          </div>
        </div>
      ) : (
        /* Empty State: Big inviting upload dropzone */
        <div className="space-y-3">
          <label className="flex flex-col items-center justify-center gap-2 p-6 sm:p-8 rounded-2xl border-2 border-dashed border-emerald-500/40 hover:border-emerald-500 bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] shadow-xs text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-600 mb-1">
              <Upload className="w-6 h-6" />
            </div>
            <span className="text-sm font-black text-gray-900 dark:text-white">
              {uploadLoading ? 'Rasm yuklanmoqda...' : 'Kompyuterdan rasm tanlash'}
            </span>
            <span className="text-[11px] text-gray-500 dark:text-gray-400">
              Tanlangan rasm avtomatik o‘rnatiladi va surish/kattalashtirish paneli ochiladi
            </span>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>
        </div>
      )}

      {/* Direct URL input field */}
      <div className="pt-2 border-t border-gray-200/60 dark:border-gray-700/60 space-y-1">
        <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Yoki to‘g‘ridan-to‘g‘ri rasm URL havolasi:
        </label>
        <Input
          name={fieldName}
          value={activeImage}
          onChange={(e) => setActiveImage(e.target.value)}
          placeholder="https://images.unsplash.com/photo-..."
          className="text-xs"
        />
        <p className="text-[10px] text-gray-500 dark:text-gray-400">{aspectHint}</p>
      </div>
    </div>
  );

  // Real-time Image Zoom, Pan, D-pad, Fit & Position Controls
  const renderImageControls = (label = "Fotosurat masshtabi va joylashuvi:") => (
    <div className="p-3.5 rounded-2xl bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700/80 space-y-3.5 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px] font-bold">
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

      {/* 2. Interactive Zoom Slider & Controls */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-bold">
          <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
            <ZoomIn className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Kattalashtirish / Kichraytirish (Zoom):</span>
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-700 dark:text-emerald-400 font-mono text-xs">
              {Math.round(activeScale * 100)}%
            </span>
            <div className="flex items-center gap-0.5 ml-1 bg-gray-100 dark:bg-gray-700/80 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setActiveScale(Math.max(0.5, Number((activeScale - 0.1).toFixed(2))))}
                className="w-5 h-5 rounded flex items-center justify-center hover:bg-white dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold text-xs"
                title="Kichraytirish (-10%)"
              >
                -
              </button>
              <button
                type="button"
                onClick={() => setActiveScale(Math.min(3, Number((activeScale + 0.1).toFixed(2))))}
                className="w-5 h-5 rounded flex items-center justify-center hover:bg-white dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold text-xs"
                title="Kattalashtirish (+10%)"
              >
                +
              </button>
            </div>
          </div>
        </div>
        <input
          type="range"
          min="0.5"
          max="2.5"
          step="0.05"
          value={activeScale}
          onChange={(e) => setActiveScale(parseFloat(e.target.value))}
          className="w-full accent-emerald-600 cursor-pointer h-2 bg-gray-200 dark:bg-gray-700 rounded-lg touch-pan-x"
        />
      </div>

      {/* 3. Horizontal Pan Slider & Controls */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-[11px] font-bold text-gray-700 dark:text-gray-300">
          <span className="flex items-center gap-1">
            <ArrowLeft className="w-3 h-3 text-blue-500" />
            <ArrowRight className="w-3 h-3 text-blue-500" />
            <span>Chapga / O‘ngga surish (Gorizontal):</span>
          </span>
          <span className="font-mono text-blue-600 dark:text-blue-400 font-extrabold text-xs">
            {activeOffsetX === 0 ? '0%' : activeOffsetX > 0 ? `+${activeOffsetX}% (O‘ngga)` : `${activeOffsetX}% (Chapga)`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveOffsetX((prev) => Math.max(-50, prev - 5))}
            className="px-2.5 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-blue-50 text-gray-700 dark:text-gray-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 border border-gray-200 dark:border-gray-600 active:scale-95"
            title="Chapga surish (-5%)"
          >
            <ArrowLeft className="w-3 h-3" /> Chap
          </button>
          <input
            type="range"
            min="-50"
            max="50"
            step="1"
            value={activeOffsetX}
            onChange={(e) => setActiveOffsetX(parseInt(e.target.value, 10))}
            className="flex-1 accent-blue-600 cursor-pointer h-2 bg-gray-200 dark:bg-gray-700 rounded-lg touch-pan-x"
          />
          <button
            type="button"
            onClick={() => setActiveOffsetX((prev) => Math.min(50, prev + 5))}
            className="px-2.5 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-blue-50 text-gray-700 dark:text-gray-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 border border-gray-200 dark:border-gray-600 active:scale-95"
            title="O‘ngga surish (+5%)"
          >
            O‘ng <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 4. Vertical Pan Slider & Controls */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-[11px] font-bold text-gray-700 dark:text-gray-300">
          <span className="flex items-center gap-1">
            <ArrowUp className="w-3 h-3 text-purple-500" />
            <ArrowDown className="w-3 h-3 text-purple-500" />
            <span>Tepaga / Pastga surish (Vertikal):</span>
          </span>
          <span className="font-mono text-purple-600 dark:text-purple-400 font-extrabold text-xs">
            {activeOffsetY === 0 ? '0%' : activeOffsetY > 0 ? `+${activeOffsetY}% (Pastga)` : `${activeOffsetY}% (Tepaga)`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveOffsetY((prev) => Math.max(-50, prev - 5))}
            className="px-2.5 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-purple-50 text-gray-700 dark:text-gray-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 border border-gray-200 dark:border-gray-600 active:scale-95"
            title="Tepaga surish (-5%)"
          >
            <ArrowUp className="w-3 h-3" /> Tepa
          </button>
          <input
            type="range"
            min="-50"
            max="50"
            step="1"
            value={activeOffsetY}
            onChange={(e) => setActiveOffsetY(parseInt(e.target.value, 10))}
            className="flex-1 accent-purple-600 cursor-pointer h-2 bg-gray-200 dark:bg-gray-700 rounded-lg touch-pan-x"
          />
          <button
            type="button"
            onClick={() => setActiveOffsetY((prev) => Math.min(50, prev + 5))}
            className="px-2.5 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-purple-50 text-gray-700 dark:text-gray-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 border border-gray-200 dark:border-gray-600 active:scale-95"
            title="Pastga surish (+5%)"
          >
            Past <ArrowDown className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );

  // Common Bottom Form Actions with Back, Delete and Save
  const renderBottomFormActions = () => (
    <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
      <div>
        {editingItem?.id && (
          <Button
            type="button"
            variant="danger"
            size="sm"
            icon={Trash2}
            onClick={() => setDeleteConfirmItem({
              type: modalType,
              id: editingItem.id,
              title: editingItem.title || editingItem.name || editingItem.caption || 'Ushbu element'
            })}
            className="!rounded-2xl font-bold w-full sm:w-auto"
          >
            O‘chirish
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2.5 self-end sm:self-auto w-full sm:w-auto">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={closeEditor}
          className="!rounded-2xl font-bold flex-1 sm:flex-initial"
        >
          Bekor qilish
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          icon={Save}
          className="!rounded-2xl font-bold shadow-md shadow-emerald-600/20 flex-1 sm:flex-initial"
        >
          Saqlash
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/70 dark:bg-gray-950 pb-36 pb-[calc(9rem+env(safe-area-inset-bottom,0px))] -m-4 sm:-m-6 lg:-m-8 p-3 sm:p-6 lg:p-8 animate-in fade-in duration-200">
      {/* Top Header Sticky Navigation Bar */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-2xl sm:rounded-3xl p-3 sm:p-5 mb-5 shadow-sm">
        {/* Mobile View: Row 1 = [Ortga] + [Bekor] [Saqlash]; Row 2 = Icon + Title */}
        <div className="sm:hidden space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={ArrowLeft}
              onClick={closeEditor}
              className="!rounded-xl font-bold text-xs !py-1.5 !px-3"
            >
              Ortga
            </Button>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={closeEditor}
                className="!rounded-xl font-bold text-xs !py-1.5 !px-2.5"
              >
                Bekor qilish
              </Button>
              {editingItem?.id && (
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  onClick={() => setDeleteConfirmItem({
                    type: modalType,
                    id: editingItem.id,
                    title: editingItem.title || editingItem.name || editingItem.caption || 'Ushbu element'
                  })}
                  className="!rounded-xl font-bold text-xs !py-1.5 !px-2.5"
                />
              )}
              <Button
                type="submit"
                form={formId}
                variant="primary"
                size="sm"
                icon={Save}
                className="!rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 !py-1.5 !px-3"
              >
                Saqlash
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-gray-100 dark:border-gray-800">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ModuleIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 truncate">
                {currentConfig.moduleName} / {editingItem?.id ? 'Tahrirlash' : 'Yangi qo‘shish'}
              </div>
              <h1 className="text-sm font-black text-gray-900 dark:text-white truncate">
                {currentConfig.title}
              </h1>
            </div>
          </div>
        </div>

        {/* Desktop View (sm+): Wide Breadcrumbs + Action Buttons */}
        <div className="hidden sm:flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <Button
              variant="outline"
              size="sm"
              icon={ArrowLeft}
              onClick={closeEditor}
              className="!rounded-2xl font-bold"
            >
              Ortga qaytish
            </Button>
            <div>
              <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mb-0.5">
                <span>Veb-sayt boshqaruvi</span>
                <span>/</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{currentConfig.moduleName}</span>
                <span>/</span>
                <span>{editingItem?.id ? 'Tahrirlash' : 'Yangi qo‘shish'}</span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                <ModuleIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>{currentConfig.title}</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={closeEditor}
              className="!rounded-2xl font-bold"
            >
              Bekor qilish
            </Button>
            {editingItem?.id && (
              <Button
                type="button"
                variant="danger"
                size="sm"
                icon={Trash2}
                onClick={() => setDeleteConfirmItem({
                  type: modalType,
                  id: editingItem.id,
                  title: editingItem.title || editingItem.name || editingItem.caption || 'Ushbu element'
                })}
                className="!rounded-2xl font-bold"
              >
                O‘chirish
              </Button>
            )}
            <Button
              type="submit"
              form={formId}
              variant="primary"
              size="sm"
              icon={Save}
              className="!rounded-2xl font-bold shadow-md shadow-emerald-600/20"
            >
              Saqlash
            </Button>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 1. SLAYD FULL-PAGE EDITOR */}
      {/* ===================================================================== */}
      {modalType === 'slide' && (
        <form id={formId} onSubmit={handleSaveSlide} className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          <div className="lg:col-span-7 space-y-4 sm:space-y-5 bg-white dark:bg-gray-900 p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Teg (Masalan: Darslardan lavhalar)</label>
                <Input name="tag" defaultValue={editingItem?.tag || ''} required />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Tartib raqami (#)</label>
                <Input type="number" name="order" defaultValue={editingItem?.order || 1} required />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Asosiy tugma matni</label>
                <Input name="cta_text" defaultValue={editingItem?.cta_text || 'Kurslar katalogi'} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Asosiy tugma havolasi</label>
                <Input name="cta_link" defaultValue={editingItem?.cta_link || '#courses'} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Qoʻshimcha tugma matni</label>
                <Input name="secondary_cta_text" defaultValue={editingItem?.secondary_cta_text || ''} placeholder="Masalan: Biz haqimizda" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Qoʻshimcha tugma havolasi</label>
                <Input name="secondary_cta_link" defaultValue={editingItem?.secondary_cta_link || '#about'} />
              </div>
            </div>

            {/* Smart Image Upload Box */}
            {renderImageUploadBox('Slayder orqa fon fotosurati', '16:9 keng format tavsiya etiladi (Kattalashtirish va surish mumkin)', 'image')}

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={editingItem?.isActive !== false && editingItem?.is_active !== false}
                className="w-4 h-4 rounded text-emerald-600"
              />
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Slaydni faollashtirish (Saytda koʻrinadi)</span>
            </label>

            {renderBottomFormActions()}
          </div>

          {/* Live Preview Box */}
          <div className="lg:col-span-5 sticky top-28 space-y-4 bg-gray-50 dark:bg-gray-900/60 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Slayder koʻrinishi</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold">
                  Jonli
                </span>
              </div>

              <div className="rounded-3xl overflow-hidden relative h-64 bg-gray-950 border border-gray-800 shadow-xl select-none">
                {activeImage ? (
                  <div
                    className="absolute inset-0 bg-no-repeat transition-transform duration-75"
                    style={{
                      backgroundImage: `url('${activeImage}')`,
                      backgroundSize: activeFitMode === 'contain' ? 'contain' : 'cover',
                      backgroundPosition: activePosition || 'center',
                      transform: `scale(${activeScale}) translate(${activeOffsetX}%, ${activeOffsetY}%)`,
                      transformOrigin: 'center center',
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-xs">
                    Rasm tanlanmagan
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />

                {activeImage && (
                  <button
                    type="button"
                    onClick={() => handleOpenCropperForExisting('16:9')}
                    className="absolute top-3 right-3 z-10 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/85 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5 shadow-md border border-white/20 transition-all cursor-pointer active:scale-95"
                    title="Rasmni surish va qirqish"
                  >
                    <Crop className="w-3.5 h-3.5 text-emerald-400" />
                    <span>To‘g‘rilash</span>
                  </button>
                )}

                <div className="absolute inset-0 p-5 flex flex-col justify-end text-white">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30 w-fit mb-2">
                    {editingItem?.tag || 'Darslardan lavhalar'}
                  </span>
                  <h3 className="text-base font-black leading-snug line-clamp-2">
                    {editingItem?.title || 'Kelajak kasblarini EDUCO bilan zabt eting'}
                  </h3>
                  <p className="text-xs text-gray-300 line-clamp-2 mt-1">
                    {editingItem?.subtitle || 'Kichik sarlavha tavsifi'}
                  </p>
                </div>
              </div>
            </div>

            {renderImageControls("Slayder banneri masshtabi va joylashuvi:")}
          </div>
        </form>
      )}

      {/* ===================================================================== */}
      {/* 2. KURS FULL-PAGE EDITOR */}
      {/* ===================================================================== */}
      {modalType === 'course' && (
        <form id={formId} onSubmit={handleSaveCourse} className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          <div className="lg:col-span-7 space-y-4 sm:space-y-5 bg-white dark:bg-gray-900 p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div>
              <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Kurs nomi</label>
              <Input name="title" defaultValue={editingItem?.title || ''} placeholder="Masalan: Frontend Dasturlash (React & Next.js)" required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Kategoriya / Yoʻnalish</label>
                <Input name="category" defaultValue={editingItem?.category || 'Dasturlash'} required />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Daraja (Level)</label>
                <Input name="level" defaultValue={editingItem?.level || 'Noldan professionalgacha'} required />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Darslar soni</label>
                <Input type="number" name="lessons_count" defaultValue={editingItem?.lessons_count || editingItem?.lessonsCount || 48} required />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Davomiyligi (Oylarda)</label>
                <Input type="number" name="duration_months" defaultValue={editingItem?.duration_months || 6} required />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Narxi (Soʻm)</label>
                <Input type="number" name="price" defaultValue={editingItem?.price || 650000} required />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Narx davri</label>
                <Input name="price_period" defaultValue={editingItem?.price_period || 'oyiga'} required />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Bosh ustoz (Mentor)</label>
              <Input name="teacher_name" defaultValue={editingItem?.teacher_name || editingItem?.teacherName || 'Abdulazizbek Orifjonov'} required />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Kurs tavsifi (Batafsil)</label>
              <textarea
                name="description"
                defaultValue={editingItem?.description || ''}
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
                required
              />
            </div>

            {/* Smart Image Upload Box */}
            {renderImageUploadBox('Kurs muqovasi (Fotosurat)', '16:9 nisbat tavsiya etiladi (Kattalashtirish va surish mumkin)', 'image')}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked={editingItem?.isActive !== false && editingItem?.is_active !== false}
                  className="w-4 h-4 rounded text-emerald-600"
                />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Faol kurs (Saytda koʻrinadi)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_popular"
                  defaultChecked={editingItem?.is_popular || editingItem?.popular}
                  className="w-4 h-4 rounded text-emerald-600"
                />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Ommabop kurs (Badge)</span>
              </label>
            </div>

            {renderBottomFormActions()}
          </div>

          {/* Live Preview Box */}
          <div className="lg:col-span-5 sticky top-28 space-y-4 bg-gray-50 dark:bg-gray-900/60 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Kurs kartasi koʻrinishi</span>
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
                      style={{
                        objectFit: activeFitMode,
                        objectPosition: activePosition,
                        transform: `scale(${activeScale}) translate(${activeOffsetX}%, ${activeOffsetY}%)`,
                        transformOrigin: 'center center',
                      }}
                      className="w-full h-full transition-transform duration-75"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <BookOpen className="w-8 h-8 opacity-40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent pointer-events-none" />

                  {activeImage && (
                    <button
                      type="button"
                      onClick={() => handleOpenCropperForExisting('16:9')}
                      className="absolute top-2.5 right-2.5 z-10 px-2.5 py-1 rounded-xl bg-black/60 hover:bg-black/85 backdrop-blur-md text-white text-[11px] font-bold flex items-center gap-1.5 shadow-md border border-white/20 transition-all cursor-pointer active:scale-95"
                      title="Kurs rasmini surish va kattalashtirish"
                    >
                      <Crop className="w-3.5 h-3.5 text-emerald-400" />
                      <span>To‘g‘rilash</span>
                    </button>
                  )}

                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white shadow-md">
                    {editingItem?.category || 'Dasturlash'}
                  </span>
                </div>
                <div className="p-4 space-y-2">
                  <h4 className="text-sm font-black text-gray-900 dark:text-white line-clamp-1">{editingItem?.title || 'Kurs nomi'}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{editingItem?.description || 'Kurs haqida qisqacha tavsif...'}</p>
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs font-bold">
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {formatPriceDisplay(editingItem?.price)}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {editingItem?.lessons_count || 48} ta dars
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {renderImageControls("Kurs muqovasi masshtabi va joylashuvi:")}
          </div>
        </form>
      )}

      {/* ===================================================================== */}
      {/* 3. FAN FULL-PAGE EDITOR */}
      {/* ===================================================================== */}
      {modalType === 'subject' && (
        <form id={formId} onSubmit={handleSaveSubject} className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          <div className="lg:col-span-7 space-y-4 sm:space-y-5 bg-white dark:bg-gray-900 p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div>
              <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Fan nomi</label>
              <Input name="name" defaultValue={editingItem?.name || editingItem?.title || ''} placeholder="Masalan: Matematika & Mantiq" required />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Fan tavsifi</label>
              <textarea
                name="description"
                defaultValue={editingItem?.description || ''}
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Oʻquvchilar soni</label>
                <Input type="number" name="students_count" defaultValue={editingItem?.students_count || 450} required />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Kurslar soni</label>
                <Input type="number" name="courses_count" defaultValue={editingItem?.courses_count || 6} required />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Tartib raqami (#)</label>
                <Input type="number" name="order" defaultValue={editingItem?.order || 1} required />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Belgisi (Icon)</label>
                <select
                  name="icon"
                  value={activeIcon}
                  onChange={(e) => setActiveIcon(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
                >
                  {SUBJECT_ICONS.map((i) => (
                    <option key={i.name} value={i.name}>
                      {i.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Rang sxemasi (Gradient)</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'from-emerald-600 to-teal-700', label: 'Zumrad (Yashil)' },
                  { id: 'from-blue-600 to-cyan-700', label: 'Moviy (Koʻk)' },
                  { id: 'from-indigo-600 to-purple-700', label: 'Binafsha' },
                  { id: 'from-amber-500 to-orange-600', label: 'Qahrabo (Zargʻaldoq)' },
                  { id: 'from-rose-600 to-pink-700', label: 'Qizil / Pushti' },
                  { id: 'from-slate-700 to-gray-900', label: 'Toʻq kulrang' },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveColor(c.id)}
                    className={`p-2 rounded-xl border text-[11px] font-bold flex items-center gap-2 cursor-pointer transition-all ${
                      activeColor === c.id
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full bg-gradient-to-tr ${c.id} shrink-0`} />
                    <span className="truncate">{c.label}</span>
                  </button>
                ))}
              </div>
              <input type="hidden" name="color" value={activeColor} />
            </div>

            {/* Smart Image Upload Box */}
            {renderImageUploadBox('Fan banneri / fotosurati (Ixtiyoriy)', '4:3 yoki 16:9 nisbat tavsiya etiladi', 'image')}

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={editingItem?.isActive !== false && editingItem?.is_active !== false}
                className="w-4 h-4 rounded text-emerald-600"
              />
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Fanni faollashtirish (Saytda koʻrinadi)</span>
            </label>

            {renderBottomFormActions()}
          </div>

          {/* Live Preview Box */}
          <div className="lg:col-span-5 sticky top-28 space-y-4 bg-gray-50 dark:bg-gray-900/60 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Fan kartasi koʻrinishi</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold">
                  Saytda
                </span>
              </div>

              <div className="rounded-3xl overflow-hidden bg-white dark:bg-[#1a2332] border border-gray-200 dark:border-gray-800 shadow-md p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${activeColor} flex items-center justify-center text-white shadow-md shrink-0`}>
                    {(() => {
                      const IconComponent = SUBJECT_ICONS.find((i) => i.name === activeIcon)?.icon || Sparkles;
                      return <IconComponent className="w-6 h-6" />;
                    })()}
                  </div>
                  <div>
                    <h4 className="text-base font-black text-gray-900 dark:text-white">{editingItem?.name || 'Fan nomi'}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{editingItem?.students_count || 450}+ faol oʻquvchi</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  {editingItem?.description || 'Ushbu fanning maqsad va imkoniyatlari haqida qisqacha tavsif...'}
                </p>
                {activeImage && (
                  <div className="h-32 rounded-2xl overflow-hidden relative bg-gray-950">
                    <img
                      src={activeImage}
                      alt="Subject banner"
                      style={{
                        objectFit: activeFitMode,
                        objectPosition: activePosition,
                        transform: `scale(${activeScale}) translate(${activeOffsetX}%, ${activeOffsetY}%)`,
                        transformOrigin: 'center center',
                      }}
                      className="w-full h-full transition-transform duration-75"
                    />
                  </div>
                )}
              </div>
            </div>

            {activeImage && renderImageControls("Fan rasmi masshtabi va joylashuvi:")}
          </div>
        </form>
      )}

      {/* ===================================================================== */}
      {/* 4. USTOZ (TEACHER) FULL-PAGE EDITOR */}
      {/* ===================================================================== */}
      {modalType === 'teacher' && (
        <form id={formId} onSubmit={handleSaveTeacher} className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          <div className="lg:col-span-7 space-y-4 sm:space-y-5 bg-white dark:bg-gray-900 p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div>
              <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Toʻliq ismi va familiyasi</label>
              <Input name="name" defaultValue={editingItem?.name || editingItem?.full_name || ''} placeholder="Masalan: Abdulazizbek Orifjonov" required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Lavozimi / Mutaxassisligi</label>
                <Input name="role" defaultValue={editingItem?.role || 'Bosh Dasturlash Ustozi'} required />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Tajribasi</label>
                <Input name="experience" defaultValue={editingItem?.experience || editingItem?.experience_years || '5+ yil'} required />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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

            {/* Smart Image Upload Box with Instant Auto-apply and Remove Photo button */}
            {renderImageUploadBox('Ustoz fotosurati', '4:3 vertikal yoki gorizontal nisbat tavsiya etiladi (Kattalashtirish va surish mumkin)', 'photo')}

            <div>
              <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Ustoz haqida maʼlumot (Bio)</label>
              <textarea
                name="bio"
                defaultValue={editingItem?.bio || ''}
                rows={3}
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

            {renderBottomFormActions()}
          </div>

          {/* Live Preview Box */}
          <div className="lg:col-span-5 sticky top-28 space-y-4 bg-gray-50 dark:bg-gray-900/60 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Ustoz kartasi koʻrinishi</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold">
                  Saytda
                </span>
              </div>

              <div className="rounded-3xl overflow-hidden bg-white dark:bg-[#1a2332] border border-gray-200 dark:border-gray-800 shadow-md">
                <div className="h-64 relative bg-gray-950 overflow-hidden">
                  {activeImage ? (
                    <img
                      src={activeImage}
                      alt="Preview"
                      style={{
                        objectFit: activeFitMode,
                        objectPosition: activePosition,
                        transform: `scale(${activeScale}) translate(${activeOffsetX}%, ${activeOffsetY}%)`,
                        transformOrigin: 'center center',
                      }}
                      className="w-full h-full transition-transform duration-75"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Users className="w-12 h-12 opacity-40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent pointer-events-none" />

                  {activeImage && (
                    <button
                      type="button"
                      onClick={() => handleOpenCropperForExisting('4:3')}
                      className="absolute top-2.5 right-2.5 z-10 px-2.5 py-1 rounded-xl bg-black/60 hover:bg-black/85 backdrop-blur-md text-white text-[11px] font-bold flex items-center gap-1.5 shadow-md border border-white/20 transition-all cursor-pointer active:scale-95"
                      title="Ustoz rasmini surish va kattalashtirish"
                    >
                      <Crop className="w-3.5 h-3.5 text-emerald-400" />
                      <span>To‘g‘rilash</span>
                    </button>
                  )}

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

            {renderImageControls("Ustoz fotosurati masshtabi va joylashuvi:")}
          </div>
        </form>
      )}

      {/* ===================================================================== */}
      {/* 5. YANGILIK (NEWS) FULL-PAGE EDITOR */}
      {/* ===================================================================== */}
      {modalType === 'news' && (
        <form id={formId} onSubmit={handleSaveNews} className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          <div className="lg:col-span-7 space-y-4 sm:space-y-5 bg-white dark:bg-gray-900 p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div>
              <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Yangilik sarlavhasi</label>
              <Input name="title" defaultValue={editingItem?.title || ''} placeholder="Masalan: Yangi dasturlash kursi qabuli boshlandi!" required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Teg / Kategoriya</label>
                <Input name="tag" defaultValue={editingItem?.tag || editingItem?.category || 'Yangiliklar'} required />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Muallif</label>
                <Input name="author" defaultValue={editingItem?.author || 'EDUCO Matbuot xizmati'} required />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Sana</label>
                <Input type="date" name="published_at" defaultValue={editingItem?.published_at?.split('T')[0] || new Date().toISOString().split('T')[0]} required />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Oʻqish vaqti</label>
                <Input name="read_time" defaultValue={editingItem?.read_time || '3 daqiqa'} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Qisqacha mazmuni (Summary)</label>
              <textarea
                name="summary"
                defaultValue={editingItem?.summary || ''}
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Toʻliq matn (Content)</label>
              <textarea
                name="content"
                defaultValue={editingItem?.content || editingItem?.summary || ''}
                rows={4}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
              />
            </div>

            {/* Smart Image Upload Box */}
            {renderImageUploadBox('Yangilik fotosurati', '16:9 nisbat tavsiya etiladi (Kattalashtirish va surish mumkin)', 'image')}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked={editingItem?.isActive !== false && editingItem?.is_active !== false}
                  className="w-4 h-4 rounded text-emerald-600"
                />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Nashr etish (Saytda koʻrinadi)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_featured"
                  defaultChecked={editingItem?.is_featured}
                  className="w-4 h-4 rounded text-emerald-600"
                />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Asosiy eʼlon (Featured)</span>
              </label>
            </div>

            {renderBottomFormActions()}
          </div>

          {/* Live Preview Box */}
          <div className="lg:col-span-5 sticky top-28 space-y-4 bg-gray-50 dark:bg-gray-900/60 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
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
                      style={{
                        objectFit: activeFitMode,
                        objectPosition: activePosition,
                        transform: `scale(${activeScale}) translate(${activeOffsetX}%, ${activeOffsetY}%)`,
                        transformOrigin: 'center center',
                      }}
                      className="w-full h-full transition-transform duration-75"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Newspaper className="w-8 h-8 opacity-40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent pointer-events-none" />

                  {activeImage && (
                    <button
                      type="button"
                      onClick={() => handleOpenCropperForExisting('16:9')}
                      className="absolute top-2.5 right-2.5 z-10 px-2.5 py-1 rounded-xl bg-black/60 hover:bg-black/85 backdrop-blur-md text-white text-[11px] font-bold flex items-center gap-1.5 shadow-md border border-white/20 transition-all cursor-pointer active:scale-95"
                      title="Yangilik rasmini surish va kattalashtirish"
                    >
                      <Crop className="w-3.5 h-3.5 text-emerald-400" />
                      <span>To‘g‘rilash</span>
                    </button>
                  )}

                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white shadow-md">
                    {editingItem?.tag || 'Yangilik'}
                  </span>
                </div>
                <div className="p-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-[11px] text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>{editingItem?.read_time || '3 daqiqa'} oʻqish</span>
                  </div>
                  <h4 className="text-sm font-black text-gray-900 dark:text-white line-clamp-1">{editingItem?.title || 'Yangilik sarlavhasi'}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{editingItem?.summary || 'Yangilik mazmuni...'}</p>
                </div>
              </div>
            </div>

            {renderImageControls("Yangilik rasmi masshtabi va joylashuvi:")}
          </div>
        </form>
      )}

      {/* ===================================================================== */}
      {/* 6. VIDEO FULL-PAGE EDITOR */}
      {/* ===================================================================== */}
      {modalType === 'video' && (
        <form id={formId} onSubmit={handleSaveVideo} className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          <div className="lg:col-span-7 space-y-4 sm:space-y-5 bg-white dark:bg-gray-900 p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div>
              <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Video lavha nomi</label>
              <Input name="title" defaultValue={editingItem?.title || ''} placeholder="Masalan: Oʻquvchilarimiz bilan master-klass" required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Kategoriya</label>
                <Input name="category" defaultValue={editingItem?.category || 'Dars lavhalari'} required />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Davomiyligi (Masalan: 05:30)</label>
                <Input name="duration" defaultValue={editingItem?.duration || '05:30'} required />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Muallif / Spiker</label>
              <Input name="author" defaultValue={editingItem?.author || 'EDUCO Media'} required />
            </div>

            {/* Video File / URL Selector */}
            <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                  <FileVideo className="w-4 h-4 text-emerald-600" />
                  <span>Video manbasi (MP4 yoki YouTube/URL)</span>
                </label>
                <div className="flex items-center rounded-lg bg-gray-200 dark:bg-gray-800 p-0.5 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setVideoUploadMode('url')}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${videoUploadMode === 'url' ? 'bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 shadow-xs' : 'text-gray-600 dark:text-gray-400'}`}
                  >
                    URL havola
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoUploadMode('file')}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${videoUploadMode === 'file' ? 'bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 shadow-xs' : 'text-gray-600 dark:text-gray-400'}`}
                  >
                    Fayl yuklash
                  </button>
                </div>
              </div>

              {videoUploadMode === 'url' ? (
                <Input
                  name="video_url"
                  value={activeVideoUrl}
                  onChange={(e) => setActiveVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... yoki .mp4 havola"
                  required={!activeVideoUrl}
                />
              ) : (
                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-emerald-500/40 hover:border-emerald-500 rounded-xl bg-white dark:bg-gray-800 cursor-pointer transition-all">
                  <Upload className="w-6 h-6 text-emerald-600 mb-1" />
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                    {uploadLoading ? 'Yuklanmoqda...' : 'MP4 video fayl tanlash'}
                  </span>
                  <span className="text-[10px] text-gray-400 mt-0.5">Maksimal hajm 25MB (Kattaroq videolar uchun YouTube URL tavsiya etiladi)</span>
                  <input type="file" accept="video/mp4,video/webm" onChange={handleVideoUpload} className="hidden" />
                </label>
              )}
            </div>

            {/* Smart Thumbnail Upload Box */}
            {renderImageUploadBox('Video muqovasi (Thumbnail)', '16:9 nisbat tavsiya etiladi (Kattalashtirish va surish mumkin)', 'thumbnail')}

            <div>
              <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Video tavsifi</label>
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

            {renderBottomFormActions()}
          </div>

          {/* Live Preview Box */}
          <div className="lg:col-span-5 sticky top-28 space-y-4 bg-gray-50 dark:bg-gray-900/60 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Video kartasi koʻrinishi</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold">
                  Saytda
                </span>
              </div>

              <div className="rounded-3xl overflow-hidden bg-white dark:bg-[#1a2332] border border-gray-200 dark:border-gray-800 shadow-md">
                <div className="h-44 relative bg-gray-950 overflow-hidden flex items-center justify-center">
                  {activeImage ? (
                    <img
                      src={activeImage}
                      alt="Thumbnail preview"
                      style={{
                        objectFit: activeFitMode,
                        objectPosition: activePosition,
                        transform: `scale(${activeScale}) translate(${activeOffsetX}%, ${activeOffsetY}%)`,
                        transformOrigin: 'center center',
                      }}
                      className="w-full h-full transition-transform duration-75"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Video className="w-8 h-8 opacity-40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 pointer-events-none" />

                  {/* Play Button Icon */}
                  <div className="absolute w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 ml-0.5 fill-current" />
                  </div>

                  <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] font-mono font-bold">
                    {editingItem?.duration || '05:30'}
                  </span>
                </div>
                <div className="p-4 space-y-1">
                  <h4 className="text-sm font-black text-gray-900 dark:text-white line-clamp-1">{editingItem?.title || 'Video nomi'}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{editingItem?.description || 'Video haqida qisqacha maʼlumot...'}</p>
                </div>
              </div>
            </div>

            {renderImageControls("Video muqovasi masshtabi va joylashuvi:")}
          </div>
        </form>
      )}

      {/* ===================================================================== */}
      {/* 7. GALEREYA FULL-PAGE EDITOR */}
      {/* ===================================================================== */}
      {modalType === 'gallery' && (
        <form id={formId} onSubmit={handleSaveGalleryItem} className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          <div className="lg:col-span-7 space-y-4 sm:space-y-5 bg-white dark:bg-gray-900 p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div>
              <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Rasm sarlavhasi (Izoh / Caption)</label>
              <Input name="caption" defaultValue={editingItem?.caption || editingItem?.title || ''} placeholder="Masalan: Robototexnika laboratoriyasida amaliy mashgʻulot" required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Teg / Boʻlim</label>
                <Input name="tag" defaultValue={editingItem?.tag || 'Darslar'} required />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Tartib raqami (#)</label>
                <Input type="number" name="order" defaultValue={editingItem?.order || 1} required />
              </div>
            </div>

            {/* Smart Image Upload Box */}
            {renderImageUploadBox('Galereya fotosurati', '4:3 yoki 16:9 nisbat tavsiya etiladi (Kattalashtirish va surish mumkin)', 'image')}

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={editingItem?.isActive !== false && editingItem?.is_active !== false}
                className="w-4 h-4 rounded text-emerald-600"
              />
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Galereyada koʻrsatish (Saytda koʻrinadi)</span>
            </label>

            {renderBottomFormActions()}
          </div>

          {/* Live Preview Box */}
          <div className="lg:col-span-5 sticky top-28 space-y-4 bg-gray-50 dark:bg-gray-900/60 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Dars lavhasi koʻrinishi</span>
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
                      alt="Gallery preview"
                      style={{
                        objectFit: activeFitMode,
                        objectPosition: activePosition,
                        transform: `scale(${activeScale}) translate(${activeOffsetX}%, ${activeOffsetY}%)`,
                        transformOrigin: 'center center',
                      }}
                      className="w-full h-full transition-transform duration-75"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <ImageIcon className="w-8 h-8 opacity-40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent pointer-events-none" />

                  {activeImage && (
                    <button
                      type="button"
                      onClick={() => handleOpenCropperForExisting('4:3')}
                      className="absolute top-2.5 right-2.5 z-10 px-2.5 py-1 rounded-xl bg-black/60 hover:bg-black/85 backdrop-blur-md text-white text-[11px] font-bold flex items-center gap-1.5 shadow-md border border-white/20 transition-all cursor-pointer active:scale-95"
                      title="Galereya rasmini surish va kattalashtirish"
                    >
                      <Crop className="w-3.5 h-3.5 text-emerald-400" />
                      <span>To‘g‘rilash</span>
                    </button>
                  )}

                  <span className="absolute bottom-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/25 text-white backdrop-blur-md border border-white/30">
                    {editingItem?.tag || 'Lavha'}
                  </span>
                </div>
                <div className="p-3">
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200 line-clamp-1">
                    {editingItem?.caption || editingItem?.title || 'Rasm tavsifi'}
                  </p>
                </div>
              </div>
            </div>

            {renderImageControls("Dars lavhasi masshtabi va joylashuvi:")}
          </div>
        </form>
      )}

      {/* ===================================================================== */}
      {/* 8. TESTIMONIAL FULL-PAGE EDITOR */}
      {/* ===================================================================== */}
      {modalType === 'testimonial' && (
        <form id={formId} onSubmit={handleSaveTestimonial} className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          <div className="lg:col-span-7 space-y-4 sm:space-y-5 bg-white dark:bg-gray-900 p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div>
              <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Oʻquvchi / Bitiruvchi ismi</label>
              <Input name="name" defaultValue={editingItem?.name || editingItem?.student_name || ''} placeholder="Masalan: Sardor Alimov" required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Bitirgan kursi / Hozirgi lavozimi</label>
                <Input name="role" defaultValue={editingItem?.role || 'Frontend bitiruvchisi, hozirda EPAM muhandisi'} required />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Sana</label>
                <Input type="date" name="date" defaultValue={editingItem?.date || new Date().toISOString().split('T')[0]} required />
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

            <div>
              <label className="block text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">Oʻquvchi fikri / Sharh matni</label>
              <textarea
                name="content"
                defaultValue={editingItem?.content || editingItem?.quote || ''}
                rows={4}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
                required
              />
            </div>

            {/* Smart Image Upload Box */}
            {renderImageUploadBox('O‘quvchi fotosurati (Avatar)', '1:1 kvadrat nisbat tavsiya etiladi (Kattalashtirish va surish mumkin)', 'avatar')}

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={editingItem?.isActive !== false && editingItem?.is_active !== false}
                className="w-4 h-4 rounded text-emerald-600"
              />
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Fikrni faollashtirish (Saytda koʻrinadi)</span>
            </label>

            {renderBottomFormActions()}
          </div>

          {/* Live Preview Box */}
          <div className="lg:col-span-5 sticky top-28 space-y-4 bg-gray-50 dark:bg-gray-900/60 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Fikr kartasi koʻrinishi</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold">
                  Saytda
                </span>
              </div>

              <div className="rounded-3xl overflow-hidden bg-white dark:bg-[#1a2332] border border-gray-200 dark:border-gray-800 shadow-md p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden relative bg-gray-950 shrink-0 border border-emerald-500/40">
                    {activeImage ? (
                      <img
                        src={activeImage}
                        alt="Student avatar"
                        style={{
                          objectFit: activeFitMode,
                          objectPosition: activePosition,
                          transform: `scale(${activeScale}) translate(${activeOffsetX}%, ${activeOffsetY}%)`,
                          transformOrigin: 'center center',
                        }}
                        className="w-full h-full transition-transform duration-75"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Users className="w-6 h-6 opacity-40" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-gray-900 dark:text-white">{editingItem?.name || 'Oʻquvchi ismi'}</h4>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1">{editingItem?.role || 'Bitiruvchi'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(activeRating || 5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-300 italic line-clamp-3">
                  "{editingItem?.content || editingItem?.quote || 'EDUCO o‘quv markazidagi sifatli taʼlim va amaliyot menga katta natija berdi...'}"
                </p>
              </div>
            </div>

            {activeImage && renderImageControls("Mijoz fotosurati masshtabi va joylashuvi:")}
          </div>
        </form>
      )}

      {/* Inline Delete Confirmation Banner (Zero Modals) */}
      {deleteConfirmItem && (
        <div className="p-4 my-6 rounded-2xl border-2 border-red-500/50 bg-red-500/10 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
            <Trash2 className="w-6 h-6 shrink-0" />
            <div>
              <div className="font-bold text-base">Haqiqatan ham o‘chirmoqchimisiz?</div>
              <div className="text-xs text-surface-600 dark:text-surface-300">
                "{deleteConfirmItem.title || 'Ushbu element'}" saytdan butunlay o‘chiriladi. Bu amalni qaytarib bo‘lmaydi.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirmItem(null)}>
              Bekor qilish
            </Button>
            <Button variant="danger" size="sm" onClick={confirmDelete} icon={Trash2}>
              Ha, butunlay o‘chirilsin
            </Button>
          </div>
        </div>
      )}
      {/* Mobile Sticky Quick Save Bar (Floats at bottom of phone for instant 1-tap save) */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 p-3 shadow-2xl flex items-center gap-2 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={closeEditor}
          className="!rounded-xl font-bold text-xs flex-1 justify-center"
        >
          Bekor qilish
        </Button>
        <Button
          type="submit"
          form={formId}
          variant="primary"
          size="sm"
          icon={Save}
          className="!rounded-xl font-bold text-xs flex-1 justify-center shadow-md shadow-emerald-600/20"
        >
          Saqlash
        </Button>
      </div>
    </div>
  );
}
