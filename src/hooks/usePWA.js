import { useState, useEffect } from 'react';

let deferredPrompt = typeof window !== 'undefined' ? (window.__pwaPrompt || null) : null;

export function usePWA() {
  const [isInstallable, setIsInstallable] = useState(Boolean(deferredPrompt));
  const [isStandalone, setIsStandalone] = useState(false);
  const [platform, setPlatform] = useState('desktop'); // 'ios' | 'android' | 'desktop'

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if early prompt already captured in window.__pwaPrompt
    if (window.__pwaPrompt) {
      deferredPrompt = window.__pwaPrompt;
      setIsInstallable(true);
    }

    // 1. Check if already installed & running standalone
    const standaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://');
    setIsStandalone(standaloneMode);

    // 2. Detect platform
    const ua = navigator.userAgent || '';
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroidDevice = /Android/i.test(ua);

    if (isIOSDevice) {
      setPlatform('ios');
    } else if (isAndroidDevice) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    // 3. Listen for browser install prompt (Chrome on PC/Mac, Edge on Windows, Chrome on Android)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      deferredPrompt = e;
      window.__pwaPrompt = e;
      setIsInstallable(true);
    };

    const handlePwaPromptAvailable = (e) => {
      deferredPrompt = e?.detail || window.__pwaPrompt;
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-prompt-available', handlePwaPromptAvailable);

    // Check if app was just installed
    const handleAppInstalled = () => {
      deferredPrompt = null;
      if (typeof window !== 'undefined') window.__pwaPrompt = null;
      setIsInstallable(false);
      setIsStandalone(true);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-prompt-available', handlePwaPromptAvailable);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = async () => {
    const promptToUse = deferredPrompt || (typeof window !== 'undefined' ? window.__pwaPrompt : null);
    if (promptToUse) {
      try {
        promptToUse.prompt();
        const choice = await promptToUse.userChoice;
        if (choice.outcome === 'accepted') {
          setIsStandalone(true);
        }
        deferredPrompt = null;
        if (typeof window !== 'undefined') window.__pwaPrompt = null;
        setIsInstallable(false);
        return true;
      } catch (err) {
        console.error('Install prompt error:', err);
      }
    }
    return false;
  };

  return {
    isInstallable,
    isStandalone,
    platform,
    triggerInstall,
    hasNativePrompt: Boolean(deferredPrompt || (typeof window !== 'undefined' && window.__pwaPrompt)),
  };
}
