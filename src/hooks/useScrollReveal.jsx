// src/hooks/useScrollReveal.jsx
import React, { useEffect, useRef, useState } from 'react';

export function useScrollReveal(options = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      {
        threshold: options.threshold ?? 0.12,
        rootMargin: options.rootMargin ?? '0px 0px -40px 0px',
      }
    );

    observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
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

  return (
    <Component
      ref={ref}
      style={{
        transitionDelay: `${delay}ms`,
        ...style,
      }}
      className={`${initClass} ${isVisible ? 'reveal-active' : ''} ${className}`}
    >
      {children}
    </Component>
  );
}

export default ScrollReveal;
