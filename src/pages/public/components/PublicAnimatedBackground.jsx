// src/pages/public/components/PublicAnimatedBackground.jsx
import React, { useMemo } from 'react';
import useTheme from '@/hooks/useTheme';

export default function PublicAnimatedBackground() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Generate deterministic floating micro-sparks / particles
  const particles = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      size: (i % 3) + 2, // 2px to 4px
      left: `${(i * 17) % 96 + 2}%`,
      top: `${(i * 23) % 94 + 3}%`,
      duration: `${14 + (i % 10) * 2}s`,
      delay: `${(i % 7) * 1.5}s`,
      opacity: 0.2 + (i % 4) * 0.15,
    }));
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none transition-colors duration-700"
    >
      {/* 1. Base Gradient Canvas */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${
          isDark
            ? 'bg-[#060b14]'
            : 'bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#edf2f7]'
        }`}
      />

      {/* 2. Interactive Animated Gradient Ambient Orbs (GPU Accelerated with Lightweight Composite) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ contain: 'paint' }}>
        {/* Orb 1: Top-Left (Tun: Emerald Glow, Kun: Royal Blue Glow) */}
        <div
          className={`absolute -top-32 -left-32 w-[30rem] sm:w-[42rem] h-[30rem] sm:h-[42rem] rounded-full blur-[65px] sm:blur-[85px] opacity-75 animate-bg-orb-1 transition-colors duration-700 ${
            isDark
              ? 'bg-gradient-to-br from-emerald-600/35 via-teal-600/20 to-transparent'
              : 'bg-gradient-to-br from-blue-600/22 via-indigo-500/15 to-transparent'
          }`}
          style={{ transform: 'translate3d(0, 0, 0)' }}
        />

        {/* Orb 2: Top-Right (Tun: Cyan/Sky Neon, Kun: Fresh Emerald/Teal) */}
        <div
          className={`absolute -top-24 -right-28 w-[28rem] sm:w-[40rem] h-[28rem] sm:h-[40rem] rounded-full blur-[65px] sm:blur-[85px] opacity-70 animate-bg-orb-2 transition-colors duration-700 ${
            isDark
              ? 'bg-gradient-to-bl from-cyan-500/30 via-emerald-500/18 to-transparent'
              : 'bg-gradient-to-bl from-emerald-500/20 via-teal-400/12 to-transparent'
          }`}
          style={{ transform: 'translate3d(0, 0, 0)' }}
        />

        {/* Orb 3: Center-Mid (Tun: Deep Indigo/Electric Purple, Kun: Soft Sky Blue) */}
        <div
          className={`absolute top-1/3 left-1/2 -translate-x-1/2 w-[32rem] sm:w-[46rem] h-[32rem] sm:h-[46rem] rounded-full blur-[70px] sm:blur-[90px] opacity-60 animate-bg-orb-3 transition-colors duration-700 ${
            isDark
              ? 'bg-gradient-to-tr from-indigo-600/25 via-blue-700/18 to-transparent'
              : 'bg-gradient-to-tr from-blue-400/18 via-sky-300/12 to-transparent'
          }`}
          style={{ transform: 'translate3d(0, 0, 0)' }}
        />

        {/* Orb 4: Bottom-Left (Tun: Dark Emerald Accent, Kun: Warm Amber/Rose Hint) */}
        <div
          className={`absolute -bottom-36 -left-20 w-[28rem] sm:w-[38rem] h-[28rem] sm:h-[38rem] rounded-full blur-[65px] sm:blur-[85px] opacity-65 animate-bg-orb-2 transition-colors duration-700 ${
            isDark
              ? 'bg-gradient-to-tr from-emerald-700/25 via-teal-800/15 to-transparent'
              : 'bg-gradient-to-tr from-amber-400/14 via-emerald-400/10 to-transparent'
          }`}
          style={{ transform: 'translate3d(0, 0, 0)' }}
        />

        {/* Orb 5: Bottom-Right (Tun: Sapphire Deep Blue, Kun: Royal Indigo Accent) */}
        <div
          className={`absolute -bottom-32 -right-24 w-[28rem] sm:w-[40rem] h-[28rem] sm:h-[40rem] rounded-full blur-[65px] sm:blur-[85px] opacity-60 animate-bg-orb-1 transition-colors duration-700 ${
            isDark
              ? 'bg-gradient-to-tl from-blue-600/22 via-indigo-700/15 to-transparent'
              : 'bg-gradient-to-tl from-indigo-500/16 via-blue-500/10 to-transparent'
          }`}
          style={{ transform: 'translate3d(0, 0, 0)' }}
        />
      </div>

      {/* 3. Subtle Modern Tech Grid Pattern with Radial Vignette */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${
          isDark ? 'opacity-[0.14]' : 'opacity-[0.06]'
        }`}
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, ${
            isDark ? '#34d399' : '#1e40af'
          } 1px, transparent 0)`,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse at 50% 40%, black 40%, transparent 85%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 40%, black 40%, transparent 85%)',
        }}
      />

      {/* 4. Delicate Modern Linear Scanbeam (Very slow, high-end SaaS feel) */}
      <div
        className={`absolute inset-x-0 h-40 opacity-20 blur-xl animate-bg-beam transition-colors duration-700 ${
          isDark
            ? 'bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent'
            : 'bg-gradient-to-r from-transparent via-blue-500/20 to-transparent'
        }`}
      />

      {/* 5. Floating Ambient Micro-Sparks / Particles */}
      <div className="absolute inset-0">
        {particles.map((p) => (
          <span
            key={p.id}
            className={`absolute rounded-full animate-float-sparkle ${
              isDark ? 'bg-emerald-400' : 'bg-blue-600'
            }`}
            style={{
              width: `${p.size}px`,
              height: `${p.size}px`,
              left: p.left,
              top: p.top,
              opacity: p.opacity,
              animationDuration: p.duration,
              animationDelay: p.delay,
              boxShadow: isDark
                ? `0 0 ${p.size * 3}px rgba(52, 211, 153, 0.8)`
                : `0 0 ${p.size * 2}px rgba(37, 99, 235, 0.6)`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
