// src/hooks/useScrollReveal.jsx
import React, { useEffect, useRef, useState } from 'react';

/**
 * Ultra-Fast & Smooth Scroll Reveal Hook (Zero Lag / Pre-triggered)
 * - Pre-triggers 250px ahead of the viewport so fast scrolling never encounters blank areas.
 * - Snappy 0.38s transitions with minimal stagger delays for instant responsiveness.
 * - Fast-swipe scroll listeners guarantee zero missing or delayed elements.
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

    // 1. Initial viewport check: mark visible if in or close to initial visible screen
    try {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight || 800;
      if (rect.top < vh + 150 && rect.bottom > -100) {
        setIsVisible(true);
        return;
      }
    } catch (_) {}

    // 2. Pre-triggered Observer: begins animation 250px ahead of the viewport
    const rootMargin = options.rootMargin ?? '150px 0px 250px 0px';
    const threshold = options.threshold ?? 0.01;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(el);

    // 3. Fast scroll & flick listener: triggers immediately when scrolling quickly
    const handleScrollCheck = () => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight || 800;
      if (rect.top < vh + 300 && rect.bottom > -150) {
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

  // Snappy stagger cascade capped at 100ms so cards glide in without blocking fast scrolling
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
