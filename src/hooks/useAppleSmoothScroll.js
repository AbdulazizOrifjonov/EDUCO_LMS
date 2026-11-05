// src/hooks/useAppleSmoothScroll.js
import { useEffect, useRef, useCallback } from 'react';

/**
 * Apple & Asus ROG-Grade Inertial Smooth Scroll Hook
 * 
 * Physics & Capabilities:
 * - Velocity Clamping: Caps maximum scroll delta per wheel impulse so fast flicking
 *   never teleports the page down uncontrollably.
 * - Progressive Momentum Damping: As forward distance builds, subsequent inputs are
 *   logarithmically cushioned, allowing animations to reveal at a steady, luxurious pace.
 * - Sub-pixel LERP (Linear Interpolation) on 60/120Hz RAF: Silky, weighted deceleration.
 * - Zero Idle Overhead: Cancels RAF loop immediately when movement settles (< 0.4px).
 * - Modal & Input Safe: Automatically yields to native scrolling if hovering over an
 *   active modal, scrollable popover, or typing in form controls.
 * - Keyboard & Anchor Support: Handles ArrowDown/Up, PageDown/Up, Space, Home, End
 *   and custom anchor events ('educo-smooth-scroll-to').
 */
export function useAppleSmoothScroll({ enabled = true } = {}) {
  const isRunningRef = useRef(false);
  const rafIdRef = useRef(null);
  const currentYRef = useRef(0);
  const targetYRef = useRef(0);

  const getScrollTop = useCallback(() => {
    return window.pageYOffset || document.documentElement.scrollTop || 0;
  }, []);

  const getMaxScroll = useCallback(() => {
    return Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight
    );
  }, []);

  // Check if an event target is an open modal or inner scroll container
  const isInsideScrollable = useCallback((target) => {
    if (!target || !(target instanceof HTMLElement)) return false;

    // Check if target is inside an input, textarea, or contentEditable
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) {
      return true;
    }

    // Check if target is inside an active modal dialog
    if (target.closest('[role="dialog"], .modal-content, [data-modal-container], [data-prevent-smooth-scroll]')) {
      return true;
    }

    // Check if any ancestor is an independent scroll container
    let parent = target;
    while (parent && parent !== document.body && parent !== document.documentElement) {
      const style = window.getComputedStyle(parent);
      const overflowY = style.overflowY;
      if (['auto', 'scroll'].includes(overflowY) && parent.scrollHeight > parent.clientHeight) {
        return true;
      }
      parent = parent.parentElement;
    }

    return false;
  }, []);

  // Check if body scroll is locked by a modal
  const isBodyLocked = useCallback(() => {
    return (
      document.body.style.overflow === 'hidden' ||
      document.documentElement.style.overflow === 'hidden' ||
      document.querySelector('[role="dialog"]') !== null
    );
  }, []);

  const render = useCallback(() => {
    const maxScroll = getMaxScroll();
    targetYRef.current = Math.max(0, Math.min(maxScroll, targetYRef.current));

    const diff = targetYRef.current - currentYRef.current;

    if (Math.abs(diff) > 0.35) {
      // 0.082 is the Apple / Asus silk inertia constant
      currentYRef.current += diff * 0.082;
      window.scrollTo(0, Math.round(currentYRef.current * 10) / 10);
      rafIdRef.current = requestAnimationFrame(render);
    } else {
      currentYRef.current = targetYRef.current;
      window.scrollTo(0, currentYRef.current);
      isRunningRef.current = false;
      rafIdRef.current = null;
    }
  }, [getMaxScroll]);

  const scrollToPosition = useCallback((y) => {
    const maxScroll = getMaxScroll();
    const clampedY = Math.max(0, Math.min(maxScroll, y));
    currentYRef.current = getScrollTop();
    targetYRef.current = clampedY;

    if (!isRunningRef.current) {
      isRunningRef.current = true;
      rafIdRef.current = requestAnimationFrame(render);
    }
  }, [getMaxScroll, getScrollTop, render]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    currentYRef.current = getScrollTop();
    targetYRef.current = currentYRef.current;

    // 1. Wheel Event Listener with Velocity Clamping & Momentum Damping
    const handleWheel = (e) => {
      // Allow native scroll if inside modal or scrollable child
      if (isBodyLocked() || isInsideScrollable(e.target)) {
        return;
      }

      // Check for horizontal dominance (e.g. horizontal trackpad gestures in sliders)
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.5) {
        return;
      }

      e.preventDefault();

      // Normalize line-scroll vs pixel-scroll
      const rawDelta = e.deltaMode === 1 ? e.deltaY * 36 : e.deltaY;

      // Dynamic impulse limiter: clamp fast violent wheel flick to max 125px per tick
      const clampedTick = Math.sign(rawDelta) * Math.min(Math.abs(rawDelta), 125);

      // Progressive momentum damping: as distance ahead grows, compress additional impulses
      const currentLead = targetYRef.current - currentYRef.current;
      let damp = 1;
      if (Math.sign(currentLead) === Math.sign(clampedTick)) {
        const leadMag = Math.abs(currentLead);
        // Exponential-like decay curve prevents flying uncontrollably past sections
        damp = Math.max(0.18, 1 - Math.min(leadMag / 750, 0.82));
      }

      const maxScroll = getMaxScroll();
      targetYRef.current = Math.max(0, Math.min(maxScroll, targetYRef.current + clampedTick * damp * 1.08));

      // Hard cap maximum forward lead (max 1.15 viewport height) so user never skips 3+ sections
      const maxLead = Math.min(window.innerHeight * 1.15, 800);
      targetYRef.current = Math.max(
        currentYRef.current - maxLead,
        Math.min(targetYRef.current, currentYRef.current + maxLead)
      );

      if (!isRunningRef.current) {
        isRunningRef.current = true;
        rafIdRef.current = requestAnimationFrame(render);
      }
    };

    // 2. Keyboard Navigation Smoothing
    const handleKeyDown = (e) => {
      if (isBodyLocked() || isInsideScrollable(e.target)) return;

      const key = e.key;
      let delta = 0;

      if (key === 'ArrowDown') delta = 90;
      else if (key === 'ArrowUp') delta = -90;
      else if (key === 'PageDown' || (key === ' ' && !e.shiftKey)) delta = window.innerHeight * 0.75;
      else if (key === 'PageUp' || (key === ' ' && e.shiftKey)) delta = -window.innerHeight * 0.75;
      else if (key === 'Home') {
        e.preventDefault();
        scrollToPosition(0);
        return;
      } else if (key === 'End') {
        e.preventDefault();
        scrollToPosition(getMaxScroll());
        return;
      } else {
        return;
      }

      e.preventDefault();
      const maxScroll = getMaxScroll();
      targetYRef.current = Math.max(0, Math.min(maxScroll, targetYRef.current + delta));

      if (!isRunningRef.current) {
        isRunningRef.current = true;
        rafIdRef.current = requestAnimationFrame(render);
      }
    };

    // 3. User Native Scrollbar Drag or External Scroll Synchronization
    const handleNativeScroll = () => {
      if (!isRunningRef.current) {
        const actualY = getScrollTop();
        currentYRef.current = actualY;
        targetYRef.current = actualY;
      }
    };

    // 4. Window Resize Synchronization
    const handleResize = () => {
      const actualY = getScrollTop();
      currentYRef.current = actualY;
      targetYRef.current = actualY;
    };

    // 5. Custom Event Listener for Smooth Scroll Anchors
    const handleCustomScrollTo = (e) => {
      if (typeof e.detail?.top === 'number') {
        scrollToPosition(e.detail.top);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleNativeScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    window.addEventListener('educo-smooth-scroll-to', handleCustomScrollTo);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleNativeScroll);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('educo-smooth-scroll-to', handleCustomScrollTo);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [enabled, getScrollTop, getMaxScroll, isInsideScrollable, isBodyLocked, render, scrollToPosition]);

  return { scrollTo: scrollToPosition };
}

export default useAppleSmoothScroll;
