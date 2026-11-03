// src/hooks/useScrollReveal.jsx
import React, { useEffect, useRef, useState } from 'react';

/**
 * High-Performance Eager Scroll Reveal Hook
 * - Eager pre-triggering (320px ahead of viewport) prevents lagging/stuck animations on fast scroll
 * - Instant viewport check on mount prevents initial invisible state
 * - Capped delay keeps cascade elegant without stalling user viewing
 */
export function useScrollReveal(options = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    // 1. Immediate bounding box check on mount (zero lag for in-view or near-view elements)
    try {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight || 800;
      if (rect.top <= vh + 300 && rect.bottom >= -200) {
        setIsVisible(true);
        return;
      }
    } catch (_) {}

    // 2. High-performance eager observer with 320px pre-trigger margin
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      {
        threshold: options.threshold ?? 0.001,
        rootMargin: options.rootMargin ?? '320px 0px 180px 0px',
      }
    );

    observer.observe(el);

    // 3. Fast scroll emergency safety: if user scrolls past rapidly, reveal immediately
    const handleFastScroll = () => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight || 800;
      if (rect.top <= vh + 150) {
        setIsVisible(true);
        observer.unobserve(el);
        window.removeEventListener('scroll', handleFastScroll);
      }
    };

    window.addEventListener('scroll', handleFastScroll, { passive: true });

    return () => {
      if (el) observer.unobserve(el);
      window.removeEventListener('scroll', handleFastScroll);
    };
  }, [options.threshold, options.rootMargin]);

  return [ref, isVisible];
}

export function ScrollReveal({
  children,
  animation = 'up', // 'up', 'left', 'right', 'zoom'
  delay = 0,
  className = '',
  style = {},
  as = 'div',
}) {
  const [ref, isVisible] = useScrollReveal();
  const Component = as;

  const initClass = {
    left: 'reveal-init-left',
    right: 'reveal-init-right',
    up: 'reveal-init-up',
    zoom: 'reveal-init-zoom',
  }[animation] || 'reveal-init-up';

  // Cap animation delay to max 100ms so fast scrolling never leaves empty spaces
  const effectiveDelay = Math.min(Math.max(delay, 0), 100);

  return (
    <Component
      ref={ref}
      style={{
        transitionDelay: `${effectiveDelay}ms`,
        ...style,
      }}
      className={`${initClass} ${isVisible ? 'reveal-active' : ''} ${className}`}
    >
      {children}
    </Component>
  );
}

export default ScrollReveal;
