/**
 * EDUCO LMS System & Mobile Push Notification Service
 * Integrates Web Notifications API, Service Worker, and Web Audio chime
 */

let swRegistration = null;

// Audio chime using Web Audio API (works without external mp3 files)
function playNotificationChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (_) {
    // Ignore audio errors if blocked by browser policy
  }
}

/**
 * Initializes Service Worker registration
 */
export async function initPushNotifications() {
  if (typeof window === 'undefined') return null;

  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      swRegistration = reg;
      console.log('[pushNotificationService] Service Worker registered with scope:', reg.scope);
      return reg;
    } catch (err) {
      console.warn('[pushNotificationService] SW registration failed:', err.message);
    }
  }
  return null;
}

/**
 * Checks if browser supports Notifications
 */
export function isPushSupported() {
  if (typeof window === 'undefined') return false;
  return 'Notification' in window;
}

/**
 * Gets current notification permission
 * @returns {'default' | 'granted' | 'denied'}
 */
export function getNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
  return Notification.permission;
}

/**
 * Requests notification permission from the user
 */
export async function requestNotificationPermission() {
  if (!isPushSupported()) {
    throw new Error('Brauzeringiz tizim bildirishnomalarini qo‘llab-quvvatlamaydi');
  }

  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    // Send immediate confirmation notification
    await showPushNotification({
      title: 'EDUCO LMS — Bildirishnomalar faol! 🔔',
      body: 'Endi yangi chat xabarlari va markaz e‘lonlari telefoningiz tepasida darhol ko‘rinadi!',
      tag: 'welcome-notification',
      url: '/',
    });
  }
  return permission;
}

/**
 * Displays a system notification at the top of the phone / desktop
 */
export async function showPushNotification({
  title = 'EDUCO LMS',
  body = 'Yangi bildirishnoma mavjud',
  icon = '/educo-logo-192.png',
  badge = '/favicon-32x32.png',
  url = '/',
  tag = 'educo-alert',
  playChime = true,
} = {}) {
  if (!isPushSupported() || Notification.permission !== 'granted') {
    return false;
  }

  if (playChime) {
    playNotificationChime();
  }

  // 1. Prefer Service Worker registration (native Android status bar banner)
  if ('serviceWorker' in navigator) {
    try {
      let reg = swRegistration || (await navigator.serviceWorker.getRegistration());
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          body,
          icon,
          badge,
          vibrate: [200, 100, 200, 100, 200],
          tag,
          renotify: true,
          data: { url },
        });
        return true;
      }
    } catch (err) {
      console.warn('[pushNotificationService] SW showNotification error:', err);
    }
  }

  // 2. Fallback to standard Window Notification
  try {
    const notif = new Notification(title, {
      body,
      icon,
      badge,
      vibrate: [200, 100, 200],
      tag,
      renotify: true,
      data: { url },
    });
    notif.onclick = () => {
      window.focus();
      if (url && window.location.pathname !== url) {
        window.location.href = url;
      }
      notif.close();
    };
    return true;
  } catch (err) {
    console.warn('[pushNotificationService] Fallback Notification error:', err);
    return false;
  }
}

/**
 * Triggers notification for Center Announcements
 */
export function notifyAnnouncement(announcement) {
  const title = `📢 Markaz E‘loni: ${announcement?.title || 'Yangi e‘lon'}`;
  const body = (announcement?.content || announcement?.message || '').slice(0, 150);
  return showPushNotification({
    title,
    body: body || 'Markaz ma‘muriyatidan muhim e‘lon chiqdi!',
    url: '/chat?channel=announcements',
    tag: `announcement-${announcement?.id || Date.now()}`,
  });
}

/**
 * Triggers notification for incoming chat messages
 */
export function notifyChatMessage({ senderName, messageText, groupName, groupId }) {
  const title = groupName ? `💬 ${senderName} (${groupName})` : `💬 ${senderName}`;
  return showPushNotification({
    title,
    body: messageText || 'Yangi xabar yuborildi',
    url: groupId ? `/chat?groupId=${groupId}` : '/chat',
    tag: `chat-${groupId || 'direct'}`,
  });
}

export default {
  initPushNotifications,
  isPushSupported,
  getNotificationPermission,
  requestNotificationPermission,
  showPushNotification,
  notifyAnnouncement,
  notifyChatMessage,
};
