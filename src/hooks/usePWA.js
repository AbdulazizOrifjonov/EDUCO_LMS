import { useState, useEffect } from 'react';

let deferredPrompt = null;

export function usePWA() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [platform, setPlatform] = useState('desktop'); // 'ios' | 'android' | 'desktop'

  useEffect(() => {
    if (typeof window === 'undefined') return;

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
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app was just installed
    const handleAppInstalled = () => {
      deferredPrompt = null;
      setIsInstallable(false);
      setIsStandalone(true);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsStandalone(true);
        }
        deferredPrompt = null;
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
    hasNativePrompt: Boolean(deferredPrompt),
  };
}
