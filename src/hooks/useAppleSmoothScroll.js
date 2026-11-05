// src/hooks/useAppleSmoothScroll.js
import { useEffect, useCallback } from 'react';

/**
 * High-Performance Smooth Scroll Hook
 * 
 * Uses hardware-accelerated native smooth scrolling with fallback support.
 * Never locks the wheel or prevents native browser gestures, ensuring 100%
 * responsiveness across Windows, macOS, iOS, Android, and touchpads.
 */
export function useAppleSmoothScroll({ enabled = true } = {}) {
  const getScrollTop = useCallback(() => {
    return window.pageYOffset || document.documentElement.scrollTop || 0;
  }, []);

  const getMaxScroll = useCallback(() => {
    return Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight
    );
  }, []);

  const scrollToPosition = useCallback((y) => {
    if (typeof window === 'undefined') return;
    const maxScroll = getMaxScroll();
    const clampedY = Math.max(0, Math.min(maxScroll, y));

    try {
      window.scrollTo({
        top: clampedY,
        behavior: 'smooth',
      });
    } catch {
      window.scrollTo(0, clampedY);
    }
  }, [getMaxScroll]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Custom Anchor / Component Navigation Listener
    const handleCustomScroll = (e) => {
      const targetY = e.detail?.top;
      if (typeof targetY === 'number') {
        scrollToPosition(targetY);
      }
    };

    window.addEventListener('educo-smooth-scroll-to', handleCustomScroll);

    return () => {
      window.removeEventListener('educo-smooth-scroll-to', handleCustomScroll);
    };
  }, [enabled, scrollToPosition]);

  return {
    scrollTo: scrollToPosition,
    getScrollTop,
    getMaxScroll,
  };
}

export default useAppleSmoothScroll;
