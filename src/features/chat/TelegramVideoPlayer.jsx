import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Check,
  CheckCheck,
} from 'lucide-react';

function formatVideoTime(seconds) {
  if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function TelegramVideoPlayer({
  src,
  fileName = '',
  isCircular = false,
  isOwn = false,
  message = null,
  onViewSeen = null,
  formatTime = (t) => t,
  showTimestamp = true,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const progressRingRadius = 48;
  const progressRingCircumference = 2 * Math.PI * progressRingRadius;

  // Single-media policy: pause any other audio/video when this starts
  const playerIdRef = useRef(`vid_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);

  useEffect(() => {
    const handleGlobalPlay = (e) => {
      if (e.detail?.id !== playerIdRef.current && videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    };
    window.addEventListener('educo-audio-play', handleGlobalPlay);
    return () => {
      window.removeEventListener('educo-audio-play', handleGlobalPlay);
    };
  }, []);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
    if (videoRef.current.duration && isFinite(videoRef.current.duration)) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    if (videoRef.current.duration && isFinite(videoRef.current.duration)) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const togglePlay = (e) => {
    e?.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      window.dispatchEvent(
        new CustomEvent('educo-audio-play', { detail: { id: playerIdRef.current } })
      );
      video.play().catch((err) => console.warn('Video play error:', err));
      setIsPlaying(true);
    }
  };

  const toggleMute = (e) => {
    e?.stopPropagation();
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const toggleFullscreen = (e) => {
    e?.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    if (video.requestFullscreen) {
      video.requestFullscreen();
    } else if (video.webkitRequestFullscreen) {
      video.webkitRequestFullscreen();
    }
  };

  const handleSeek = (e) => {
    e?.stopPropagation();
    const video = videoRef.current;
    if (!video || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = ratio * duration;
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Viewers metadata for checkmarks
  const otherViewers = ((message && message.seen_by) || []).filter(
    (s) => String(s.user_id) !== String(message?.sender_id)
  );
  const isSeenByOthers = otherViewers.length > 0;

  // =========================================================================
  // 1. CIRCULAR VIDEO NOTE (Telegram "Krujochek")
  // =========================================================================
  if (isCircular) {
    return (
      <div className={`relative select-none my-1 flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Circular Video Element Container */}
        <div
          onClick={togglePlay}
          className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full overflow-hidden aspect-square bg-black shadow-2xl border-[3px] border-emerald-500/80 cursor-pointer group/circle"
        >
          {/* Circular Video Element (NO native controls) */}
          <video
            ref={videoRef}
            src={src}
            playsInline
            loop
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            className="w-full h-full object-cover rounded-full"
          />

          {/* Telegram Play Icon Overlay when paused */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover/circle:bg-black/40 transition-colors">
              <div className="w-14 h-14 rounded-full bg-blue-600/90 dark:bg-emerald-600/90 text-white flex items-center justify-center shadow-xl group-hover/circle:scale-110 transition-transform">
                <Play className="w-6 h-6 fill-current ml-0.5" />
              </div>
            </div>
          )}

          {/* Telegram Slim Circular Progress Ring while playing */}
          {isPlaying && (
            <svg
              className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none z-10"
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                r={progressRingRadius}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeDasharray={progressRingCircumference}
                strokeDashoffset={progressRingCircumference - (progressPercent / 100) * progressRingCircumference}
                strokeLinecap="round"
              />
            </svg>
          )}
        </div>

        {/* Time & Delivery Checkmarks Pill OUTSIDE the circle, directly below it (never clipped) */}
        {showTimestamp && message && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onViewSeen?.(message);
            }}
            className={`mt-1.5 ${
              isOwn ? 'mr-3 rtl:mr-0 rtl:ml-3' : 'ml-3 rtl:ml-0 rtl:mr-3'
            } bg-black/80 dark:bg-gray-950/90 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1.5 text-[11px] text-white font-mono shadow-lg border border-white/20 z-20 cursor-pointer hover:bg-black hover:scale-105 active:scale-95 transition-all select-none`}
            title={
              isOwn
                ? isSeenByOthers
                  ? `Ko‘rildi: ${otherViewers.map((v) => v.user_name).join(', ')}`
                  : 'Yuborildi (hali ko‘rilmadi)'
                : 'Xabar vaqti'
            }
          >
            <span className="font-semibold tracking-tight">{formatTime(message.created_at)}</span>
            {isOwn && (
              isSeenByOthers ? (
                <CheckCheck className="w-3.5 h-3.5 text-cyan-300 stroke-[2.5]" />
              ) : (
                <Check className="w-3.5 h-3.5 text-white/90 stroke-[2.5]" />
              )
            )}
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // 2. REGULAR RECTANGULAR VIDEO (Custom Telegram-style sleek player, NO native white bar)
  // =========================================================================
  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      className="rounded-2xl overflow-hidden bg-black aspect-video w-full sm:w-80 md:w-96 max-w-full shadow-lg relative group/vid select-none"
    >
      <video
        ref={videoRef}
        src={src}
        playsInline
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={togglePlay}
        className="w-full h-full object-contain cursor-pointer"
      />

      {/* Centered Play Button when paused */}
      {!isPlaying && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/25 cursor-pointer transition-colors hover:bg-black/40"
        >
          <div className="w-14 h-14 rounded-full bg-blue-600/90 hover:bg-blue-600 dark:bg-emerald-600/90 dark:hover:bg-emerald-600 text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all">
            <Play className="w-6 h-6 fill-current ml-0.5" />
          </div>
        </div>
      )}

      {/* Sleek Custom Bottom Overlay Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-2.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-200 ${
          showControls || !isPlaying ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Seeker Bar */}
        <div
          onClick={handleSeek}
          className="w-full h-1.5 hover:h-2.5 bg-white/30 rounded-full cursor-pointer relative overflow-hidden transition-all mb-2"
        >
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-100"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between text-white text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              className="p-1 hover:text-emerald-400 transition-colors cursor-pointer"
              title={isPlaying ? 'Pauza' : 'Ijro etish'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            <button
              type="button"
              onClick={toggleMute}
              className="p-1 hover:text-emerald-400 transition-colors cursor-pointer"
              title={isMuted ? 'Ovozni yoqish' : 'Ovozni o‘chirish'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <span className="font-mono text-[11px] opacity-90">
              {formatVideoTime(currentTime)} / {formatVideoTime(duration)}
            </span>
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1 hover:text-emerald-400 transition-colors cursor-pointer"
            title="To'liq ekranga olish"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
