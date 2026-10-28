import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Play, Pause } from 'lucide-react';

/**
 * Deterministic pseudo-random number generator to create organic
 * Telegram-style voice message waveform bars based on a seed string.
 */
function generateWaveformBars(seed = 'educo-voice', barCount = 32) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const bars = [];
  let currentVal = Math.abs(hash) % 100;
  for (let i = 0; i < barCount; i++) {
    currentVal = (currentVal * 9301 + 49297) % 233280;
    const rnd = currentVal / 233280;
    // Bell-shaped curve weight towards the middle, speech-like heights 4px to 24px
    const envelope = Math.sin((i / (barCount - 1)) * Math.PI) * 0.4 + 0.6;
    const height = Math.max(4, Math.round((rnd * 18 + 4) * envelope));
    bars.push(height);
  }
  return bars;
}

function formatAudioTime(seconds) {
  if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function TelegramVoicePlayer({
  src,
  fileName = 'Ovozli xabar',
  isOwn = false,
  duration: initialDuration = 0,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);

  const audioRef = useRef(null);
  const waveformRef = useRef(null);
  const playerIdRef = useRef(`voice_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);

  // Stable 32-bar waveform derived from fileName or src
  const bars = useMemo(() => {
    return generateWaveformBars(fileName + (src || ''), 32);
  }, [fileName, src]);

  // Synchronize duration when metadata loads
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
        setIsLoaded(true);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  // Pause other players whenever any player starts (Telegram single-audio policy)
  useEffect(() => {
    const handleGlobalPlay = (e) => {
      if (e.detail?.id !== playerIdRef.current && audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    };

    window.addEventListener('educo-audio-play', handleGlobalPlay);
    return () => {
      window.removeEventListener('educo-audio-play', handleGlobalPlay);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      window.dispatchEvent(
        new CustomEvent('educo-audio-play', { detail: { id: playerIdRef.current } })
      );
      audio.play().catch((err) => console.warn('Audio play failed:', err));
    }
  };

  const handleWaveformClick = (e) => {
    if (!waveformRef.current || !audioRef.current || !duration) return;
    const rect = waveformRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = ratio * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const cycleSpeed = (e) => {
    e.stopPropagation();
    const speeds = [1, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const currentBarIndex = Math.floor((progressPercent / 100) * bars.length);

  return (
    <div
      className={`flex items-center gap-2.5 p-2 rounded-2xl select-none max-w-full w-full sm:w-[280px] md:w-[300px] transition-all ${
        isOwn
          ? 'bg-white/10 text-white'
          : 'bg-emerald-50/70 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 border border-emerald-100 dark:border-gray-700/60'
      }`}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Telegram Circular Play / Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-md transition-all active:scale-95 cursor-pointer ${
          isOwn
            ? 'bg-white text-[#123D78] hover:bg-white/95'
            : 'bg-blue-600 hover:bg-blue-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white'
        }`}
        title={isPlaying ? 'Pauza' : 'Ijro etish'}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current ml-0.5 rtl:ml-0 rtl:mr-0.5" />
        )}
      </button>

      {/* Waveform & Info Area */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        {/* Interactive Audio Waveform */}
        <div
          ref={waveformRef}
          onClick={handleWaveformClick}
          className="flex items-center gap-[2px] h-7 cursor-pointer py-1 group/wave"
          title="Tovush to'lqini bo'ylab o'tkazish"
        >
          {bars.map((barHeight, idx) => {
            const isPlayed = idx <= currentBarIndex;
            return (
              <span
                key={idx}
                style={{ height: `${barHeight}px` }}
                className={`w-[3px] rounded-full transition-all duration-100 ${
                  isPlayed
                    ? isOwn
                      ? 'bg-white'
                      : 'bg-blue-600 dark:bg-emerald-400'
                    : isOwn
                    ? 'bg-white/35 group-hover/wave:bg-white/50'
                    : 'bg-gray-300 dark:bg-gray-600 group-hover/wave:bg-gray-400 dark:group-hover/wave:bg-gray-500'
                }`}
              />
            );
          })}
        </div>

        {/* Footer: Duration counter and Speed Toggle */}
        <div className="flex items-center justify-between text-[11px] font-mono opacity-85 mt-0.5">
          <span>{isPlaying ? formatAudioTime(currentTime) : formatAudioTime(duration || 0)}</span>

          {/* Telegram 1X / 1.5X / 2X speed pill */}
          <button
            type="button"
            onClick={cycleSpeed}
            className={`px-1.5 py-0.2 rounded text-[10px] font-bold tracking-tight transition-colors cursor-pointer ${
              isOwn
                ? 'bg-white/20 hover:bg-white/30 text-white'
                : 'bg-emerald-100 dark:bg-gray-700 hover:bg-emerald-200 dark:hover:bg-gray-600 text-emerald-800 dark:text-emerald-300'
            }`}
            title="Ijro tezligi (1x, 1.5x, 2x)"
          >
            {playbackSpeed}X
          </button>
        </div>
      </div>
    </div>
  );
}
