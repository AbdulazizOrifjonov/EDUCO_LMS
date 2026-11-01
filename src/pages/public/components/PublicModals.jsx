// src/pages/public/components/PublicModals.jsx
import React from 'react';
import {
  X,
  Clock,
  User,
  Layers,
  ArrowRight,
  Send,
  Calendar,
  Eye,
  CheckCircle2,
  Play,
} from 'lucide-react';

export function CourseDetailModal({ course, onClose, onRegister, onEnroll }) {
  if (!course) return null;

  const handleEnrollClick = () => {
    onClose();
    if (onEnroll) {
      onEnroll(course);
    } else if (onRegister) {
      onRegister(course.title || course);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#1a2332] rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cover Image */}
        <div className="relative h-56 sm:h-64 w-full bg-gray-900 shrink-0">
          <img
            src={course.image_url}
            alt={course.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-5 right-5 text-white">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-600 dark:bg-emerald-500 text-white inline-block mb-2">
              {course.category}
            </span>
            <h2 className="text-xl sm:text-2xl font-black">{course.title}</h2>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Key Info Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
              <span className="text-[11px] text-gray-500 dark:text-gray-400 block font-semibold">
                Davomiyligi
              </span>
              <span className="text-sm font-extrabold text-gray-900 dark:text-white">
                {course.duration}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
              <span className="text-[11px] text-gray-500 dark:text-gray-400 block font-semibold">
                Darslar soni
              </span>
              <span className="text-sm font-extrabold text-gray-900 dark:text-white">
                {course.lessons_count || 48} ta dars
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
              <span className="text-[11px] text-gray-500 dark:text-gray-400 block font-semibold">
                Daraja
              </span>
              <span className="text-sm font-extrabold text-gray-900 dark:text-white">
                {course.level}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-blue-50 dark:bg-emerald-950/60 border border-blue-200 dark:border-emerald-800">
              <span className="text-[11px] text-blue-700 dark:text-emerald-300 block font-semibold">
                Oylik to‘lov
              </span>
              <span className="text-sm font-black text-blue-700 dark:text-emerald-300">
                {course.price}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              Kurs haqida batafsil
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
              {course.description}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Mas’ul Ustoz:
                </span>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                  {course.teacher_name}
                </h4>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3 bg-gray-50/50 dark:bg-gray-900/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          >
            Yopish
          </button>
          <button
            type="button"
            onClick={handleEnrollClick}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 dark:from-emerald-600 dark:to-teal-700 dark:hover:from-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>Ushbu kursga yozilish</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function TeacherModal({ teacher, onClose }) {
  if (!teacher) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-[#1a2332] rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-150 p-6 sm:p-7 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <img
              src={teacher.image_url}
              alt={teacher.full_name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover object-top border-2 border-emerald-500 shadow-md"
            />
            <div>
              <h3 className="text-xl font-black text-gray-950 dark:text-white">
                {teacher.full_name}
              </h3>
              <p className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {teacher.role}
              </p>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                {teacher.experience_years} tajriba
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800">
          <div>
            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Mutaxassislik yo‘nalishi
            </h4>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {teacher.specialization}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Ustoz haqida
            </h4>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
              {teacher.bio}
            </p>
          </div>
        </div>

        {teacher.telegram && (
          <div className="pt-2">
            <a
              href={teacher.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-300 font-bold text-xs sm:text-sm border border-blue-200 dark:border-blue-800 flex items-center justify-center gap-2 transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>Telegram orqali bog‘lanish</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export function NewsDetailModal({ newsItem, news, onClose }) {
  const currentNews = newsItem || news;
  if (!currentNews) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#1a2332] rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-60 w-full bg-gray-900 shrink-0">
          <img
            src={currentNews.cover_image || currentNews.image || currentNews.image_url}
            alt={currentNews.title}
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 font-semibold">
            <span className="px-3 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold">
              {currentNews.category}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {currentNews.published_at || currentNews.date}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {currentNews.views || 0} ko‘rildi
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-gray-950 dark:text-white leading-tight">
            {currentNews.title}
          </h2>

          {(currentNews.excerpt || currentNews.summary) && (
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 italic border-l-4 border-emerald-500 pl-3">
              {currentNews.excerpt || currentNews.summary}
            </p>
          )}

          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line pt-2">
            {currentNews.content}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LightboxModal({ imageItem, image, onClose }) {
  const currentImage = imageItem || image;
  if (!currentImage) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-6 right-6 w-11 h-11 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer z-50"
      >
        <X className="w-6 h-6" />
      </button>

      <div
        className="max-w-4xl w-full max-h-[85vh] flex flex-col items-center justify-center space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={currentImage.image_url || currentImage.image}
          alt={currentImage.title}
          className="max-h-[70vh] w-auto max-w-full rounded-2xl shadow-2xl object-contain border border-white/10"
        />
        <div className="text-center text-white space-y-1">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-600 text-white inline-block">
            {currentImage.category}
          </span>
          <h3 className="text-lg font-bold">{currentImage.title}</h3>
          {(currentImage.caption || currentImage.description) && (
            <p className="text-xs text-gray-300 max-w-md mx-auto">{currentImage.caption || currentImage.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function VideoPlayerModal({ video, onClose }) {
  if (!video) return null;

  const rawUrl = video.video_url || video.videoUrl || '';
  let ytId = video.youtube_id || video.youtubeId;

  if (!ytId && rawUrl) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = rawUrl.match(regExp);
    if (match && match[2].length === 11) {
      ytId = match[2];
    }
  }

  const embedUrl = ytId ? `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0` : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-black rounded-3xl overflow-hidden shadow-2xl border border-gray-800 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative pt-[56.25%] w-full bg-black">
          {embedUrl ? (
            <iframe
              className="absolute inset-0 w-full h-full"
              src={embedUrl}
              title={video.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : rawUrl ? (
            <video
              className="absolute inset-0 w-full h-full"
              src={rawUrl}
              controls
              autoPlay
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70 p-6 text-center">
              <p className="text-sm">Video havolasi mavjud emas.</p>
            </div>
          )}
        </div>

        <div className="p-5 bg-gray-950 text-white space-y-1">
          <h3 className="text-lg font-bold">{video.title}</h3>
          <p className="text-xs text-gray-400">{video.description}</p>
        </div>
      </div>
    </div>
  );
}
