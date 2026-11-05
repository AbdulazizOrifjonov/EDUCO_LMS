// src/hooks/useScrollReveal.jsx
import React, { useEffect, useRef, useState } from 'react';

/**
 * Apple & Asus ROG-Grade Scroll Reveal Hook
 * - Bounding box check triggers on mount ONLY for elements genuinely in initial viewport.
 * - Negative bottom rootMargin triggers animation when element enters 45px into view,
 *   ensuring the user visually witnesses the luxurious floating entrance.
 * - Hardware accelerated translate3d + cubic-bezier(0.16, 1, 0.3, 1) provides 120fps silkiness.
 * - Stagger delays gracefully cascade elements without blocking viewing.
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

    // 1. Initial viewport check: ONLY mark visible if genuinely inside initial visible screen
    try {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight || 800;
      if (rect.top < vh - 50 && rect.bottom > 40) {
        setIsVisible(true);
        return;
      }
    } catch (_) {}

    // 2. Observer with negative bottom margin: triggers as element glides 45px into viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      {
        threshold: options.threshold ?? 0.06,
        rootMargin: options.rootMargin ?? '0px 0px -45px 0px',
      }
    );

    observer.observe(el);

    // 3. Fallback scroll handler for fast swipes to guarantee zero permanently hidden elements
    const handleScrollCheck = () => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight || 800;
      if (rect.top < vh) {
        setIsVisible(true);
        observer.unobserve(el);
        window.removeEventListener('scroll', handleScrollCheck);
      }
    };

    window.addEventListener('scroll', handleScrollCheck, { passive: true });

    return () => {
      if (el) observer.unobserve(el);
      window.removeEventListener('scroll', handleScrollCheck);
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

  // Allow gentle stagger cascade up to 350ms so cards glide in one after another
  const effectiveDelay = Math.min(Math.max(delay, 0), 350);

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
