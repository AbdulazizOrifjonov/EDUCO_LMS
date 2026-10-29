import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Automatically scrolls window, document, and scrollable containers to the top
 * on every route change (sidebar click, link navigation, page transition).
 */
export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // 1. Reset standard window and document scroll
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } catch {
      window.scrollTo(0, 0);
    }

    if (typeof document !== 'undefined') {
      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
      }
      if (document.body) {
        document.body.scrollTop = 0;
      }

      // 2. Reset scroll on all active scrollable containers (<main>, overflow-y-auto elements)
      const scrollables = document.querySelectorAll('main, [data-scrollable="true"], .overflow-y-auto');
      scrollables.forEach((el) => {
        try {
          el.scrollTop = 0;
        } catch {}
      });
    }
  }, [pathname, search]);

  return null;
}
