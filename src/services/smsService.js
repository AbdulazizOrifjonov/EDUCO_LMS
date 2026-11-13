import { supabase } from '@/lib/supabase';
import { localStore } from '@/lib/localStore';
import { getTuitionSummary } from './tuitionService';
import { formatCurrency, formatDate } from '@/utils/csvExport';

/**
 * Definitive 6 SMS Lifecyle Statuses
 * - PENDING: Queued, awaiting dispatch
 * - DISPATCHING: Transmitted to Gateway/Cloud queue
 * - SUBMITTED: Android SmsManager confirmed handed to carrier (SMS_SENT callback)
 * - DELIVERED: Carrier delivered report confirmed (SMS_DELIVERED callback)
 * - FAILED: Transmission or carrier failure
 * - UNKNOWN: Delivery status unconfirmed after threshold timeout
 */
export const SMS_STATUS = {
  PENDING: 'PENDING',
  DISPATCHING: 'DISPATCHING',
  SUBMITTED: 'SUBMITTED',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
  UNKNOWN: 'UNKNOWN',
};

// Davomat SMS xabarlari ota-onalarga yuborilishi faol
export const PARENTS_SMS_ENABLED = true;

/**
 * Normalizes any legacy or mixed-case status to canonical SMS_STATUS
 */
export function normalizeSmsStatus(status) {
  if (!status) return SMS_STATUS.PENDING;
  const s = String(status).toUpperCase();
  if (s === 'DELIVERED') return SMS_STATUS.DELIVERED;
  if (s === 'SUBMITTED' || s === 'SENT') return SMS_STATUS.SUBMITTED;
  if (s === 'DISPATCHING' || s === 'PROCESSING') return SMS_STATUS.DISPATCHING;
  if (s === 'FAILED' || s === 'ERROR' || s === 'CANCELLED') return SMS_STATUS.FAILED;
  if (s === 'UNKNOWN') return SMS_STATUS.UNKNOWN;
  if (s === 'PENDING') return SMS_STATUS.PENDING;
  return s;
}

/**
 * Calculates granular stage latencies in milliseconds
 */
export function calculateSmsLatencies(item) {
  const queued = item?.queued_at || item?.created_at ? new Date(item.queued_at || item.created_at).getTime() : null;
  const dispatched = item?.dispatched_at ? new Date(item.dispatched_at).getTime() : null;
  const androidReceived = item?.android_received_at || item?.processed_at ? new Date(item.android_received_at || item.processed_at).getTime() : null;
  const androidSent = item?.android_sent_at ? new Date(item.android_sent_at).getTime() : null;
  const delivered = item?.delivered_at ? new Date(item.delivered_at).getTime() : null;

  const lmsLatencyMs = dispatched && queued ? Math.max(0, dispatched - queued) : null;
  const cloudToPhoneMs = androidReceived && dispatched ? Math.max(0, androidReceived - dispatched) : null;
  const phoneToCarrierMs = androidSent && androidReceived ? Math.max(0, androidSent - androidReceived) : null;
  const androidLatencyMs = androidSent && dispatched ? Math.max(0, androidSent - dispatched) : null;
  const carrierLatencyMs = delivered && androidSent ? Math.max(0, delivered - androidSent) : null;
  const totalLatencyMs = delivered && queued ? Math.max(0, delivered - queued) : null;

  return {
    lms_latency_ms: item?.lms_latency_ms ?? lmsLatencyMs,
    cloud_to_phone_latency_ms: item?.cloud_to_phone_latency_ms ?? cloudToPhoneMs,
    phone_to_carrier_latency_ms: item?.phone_to_carrier_latency_ms ?? phoneToCarrierMs,
    android_latency_ms: item?.android_latency_ms ?? androidLatencyMs,
    carrier_latency_ms: item?.carrier_latency_ms ?? carrierLatencyMs,
    total_latency_ms: item?.total_latency_ms ?? totalLatencyMs,
    lmsLatencyMs: item?.lms_latency_ms ?? lmsLatencyMs,
    cloudToPhoneLatencyMs: item?.cloud_to_phone_latency_ms ?? cloudToPhoneMs,
    phoneToCarrierLatencyMs: item?.phone_to_carrier_latency_ms ?? phoneToCarrierMs,
    androidLatencyMs: item?.android_latency_ms ?? androidLatencyMs,
    carrierLatencyMs: item?.carrier_latency_ms ?? carrierLatencyMs,
    totalLatencyMs: item?.total_latency_ms ?? totalLatencyMs,
  };
}

/**
 * Normalizes an Uzbek or international phone number
 */
export function normalizePhone(raw) {
  if (!raw) return '';
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length === 9) return `+998${digits}`;
  if (digits.length === 12 && digits.startsWith('998')) return `+${digits}`;
  if (digits.startsWith('+')) return digits;
  return `+${digits}`;
}

/**
 * Gets SMS configuration settings
 */
export async function getSmsSettings() {
  try {
    const { data, error } = await supabase
      .from('sms_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return localStore.getSmsSettings();
    }
    return data;
  } catch (err) {
    console.warn('getSmsSettings error, falling back to localStore:', err);
    return localStore.getSmsSettings();
  }
}

/**
 * Updates SMS configuration settings
 */
export async function updateSmsSettings(settingsData) {
  try {
    const payload = {
      ...settingsData,
      is_enabled: Boolean(settingsData.is_enabled),
      debtor_sms_enabled: Boolean(settingsData.debtor_sms_enabled),
      debtor_sms_start_date: settingsData.debtor_sms_start_date || '',
      debtor_sms_start_day: Number(settingsData.debtor_sms_start_day || 5),
      schedule_days: settingsData.schedule_days || [1, 5, 10, 15, 20, 25],
      schedule_time: settingsData.schedule_time || '10:00',
      target_recipient: settingsData.target_recipient || 'father_first',
      message_template: settingsData.message_template,
      send_interval_seconds: Number(settingsData.send_interval_seconds || 4),
      max_retries: Number(settingsData.max_retries || 3),
      anti_duplicate_days: Number(settingsData.anti_duplicate_days || 15),
      sender_name: settingsData.sender_name || 'EDUCO',
      notify_owner_on_failure: settingsData.notify_owner_on_failure ?? true,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('sms_settings')
      .upsert(payload)
      .select()
      .single();

    if (error) {
      return localStore.saveSmsSettings(payload);
    }
    localStore.saveSmsSettings(data || payload);
    return data || payload;
  } catch (err) {
    console.warn('updateSmsSettings error, saving to localStore:', err);
    return localStore.saveSmsSettings(settingsData);
  }
}

/**
 * Gets registered SMS Gateway devices (Primary and Backup)
 */
export async function getSmsDevices() {
  try {
    const { data, error } = await supabase
      .from('sms_devices')
      .select('*')
      .order('device_role', { ascending: false }); // primary first

    if (error || !data || data.length === 0) {
      return localStore.getSmsDevices();
    }
    return data;
  } catch (err) {
    console.warn('getSmsDevices error, falling back to localStore:', err);
    return localStore.getSmsDevices();
  }
}

/**
 * Saves or updates an SMS Gateway device
 */
export async function saveSmsDevice(deviceData) {
  try {
    const devId = deviceData.id || `dev-${deviceData.device_role || 'device'}-${Date.now()}`;
    const payload = {
      id: devId,
      name: deviceData.name || 'Android SMS Gateway',
      device_role: deviceData.device_role || 'primary',
      gateway_url: deviceData.gateway_url || deviceData.url || '',
      api_token: deviceData.api_token || '',
      is_active: deviceData.is_active !== undefined ? deviceData.is_active : true,
      phone_number: deviceData.phone_number || '',
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('sms_devices')
      .upsert(payload)
      .select()
      .single();

    const result = (error || !data) ? localStore.saveSmsDevice(payload) : data;
    localStore.saveSmsDevice(result || payload);
    const finalDevice = result || payload;
    return {
      ...finalDevice,
      url: finalDevice.gateway_url || finalDevice.url,
    };
  } catch (err) {
    console.warn('saveSmsDevice error, saving to localStore:', err);
    const saved = localStore.saveSmsDevice(deviceData);
    return {
      ...saved,
      url: saved?.gateway_url || saved?.url || deviceData?.url,
    };
  }
}

/**
 * Deletes an SMS Gateway device
 */
export async function deleteSmsDevice(id) {
  try {
    await supabase.from('sms_devices').delete().eq('id', id);
  } catch (_) {}
  localStore.deleteSmsDevice(id);
  return true;
}

/**
 * Helper: Detects whether a device or target URL is running in Demo / Simulation mode
 */
export function isDemoGateway(device, targetUrl = '') {
  const token = (device?.api_token || '').trim();
  const url = (targetUrl || device?.gateway_url || '').trim().toLowerCase();
  const name = (device?.name || '').trim().toLowerCase();

  // Explicit demo/placeholder tokens only (never treat real SXP6_F credentials as demo)
  if (!token || token === 'demo_token_educo' || token === 'demo_token_123') return true;
  if (/^demo$|^placeholder$/i.test(token)) return true;
  if (/placeholder|example\.com/i.test(url)) return true;

  return false;
}

/**
 * Helper: Builds headers including Basic Auth or Bearer token
 */
function buildGatewayHeaders(device) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  if (device && device.api_token) {
    const token = device.api_token.trim();
    const isEskiz = (device?.gateway_url || '').includes('eskiz.uz') || device?.provider === 'eskiz';
    if (isEskiz) {
      headers['Authorization'] = `Bearer ${token.replace(/^Bearer\s+/i, '')}`;
    } else if (token.includes(':')) {
      let b64 = '';
      try {
        if (typeof btoa === 'function') {
          b64 = btoa(token);
        } else if (typeof Buffer !== 'undefined') {
          b64 = Buffer.from(token).toString('base64');
        }
      } catch (_) {
        b64 = token;
      }
      headers['Authorization'] = `Basic ${b64}`;
    } else {
      headers['Authorization'] = `Bearer ${token}`;
      headers['X-Api-Key'] = token;
    }
  }
  return headers;
}

/**
 * Helper: Resolves Eskiz.uz JWT Bearer token from token string or email:password
 */
export async function getEskizToken(device) {
  if (!device) return null;
  const token = (device.api_token || '').trim();
  if (!token || token.startsWith('EMTIDA:')) {
    return null;
  }
  if (token.startsWith('eyJ') || token.length > 50) {
    return token.replace(/^Bearer\s+/i, '');
  }
  let email = device.email;
  let password = device.password;
  if (!email && token.includes(':')) {
    const parts = token.split(':');
    email = parts[0].trim();
    password = parts.slice(1).join(':').trim();
  }
  if (email && password) {
    try {
      const res = await executeGatewayRequest('https://notify.eskiz.uz/api/auth/login', 'POST', {
        'Content-Type': 'application/json',
      }, { email, password });
      if (res.data?.data?.token) {
        return res.data.data.token;
      }
      if (res.data?.message) {
        throw new Error(`Eskiz Login: ${res.data.message}`);
      }
    } catch (e) {
      if (e.message && e.message.includes('Eskiz')) throw e;
    }
  }
  return token ? token.replace(/^Bearer\s+/i, '') : null;
}

/**
 * Helper: Executes request to Android Gateway with CORS-proxy fallback
 */
async function executeGatewayRequest(targetUrl, method, headers, payload) {
  // 1. Try server proxy route (/api/sms-proxy)
  try {
    const proxyRes = await fetch('/api/sms-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: targetUrl, method, headers, payload }),
    });

    if (proxyRes.ok || proxyRes.status === 200 || proxyRes.status === 201 || proxyRes.status === 202) {
      const data = await proxyRes.json().catch(() => ({ success: true }));
      return { ok: true, status: proxyRes.status, data: data || { success: true } };
    }

    const data = await proxyRes.json().catch(() => null);

    if (proxyRes.status === 401 || proxyRes.status === 403) {
      throw new Error(data?.error || `Autentifikatsiya xatosi (Login/Parol noto‘g‘ri - ${proxyRes.status})`);
    }

    if (data?.error || data?.message) {
      throw new Error(data.error || data.message);
    }

    // If proxy explicitly responded with 404 / 405 (proxy not deployed on worker yet)
    if (proxyRes.status === 404 || proxyRes.status === 405) {
      // Fall through to direct fetch below
    } else {
      const detail = data?.error || data?.message || data?.details || '';
      throw new Error(`SMS Gateway xatosi [HTTP ${proxyRes.status}]${detail ? `: ${detail}` : ''}`);
    }
  } catch (proxyErr) {
    if (proxyErr.message && (
      proxyErr.message.includes('Autentifikatsiya') ||
      proxyErr.message.includes('Gateway xatosi') ||
      proxyErr.message.includes('aloqa o‘rnatilmadi')
    )) {
      throw proxyErr;
    }
    // Fall back to direct fetch only if proxy was completely unreachable or 404/405
  }

  // 2. Direct browser fetch (for local Wi-Fi Android gateway on same subnet or CORS-enabled endpoints)
  const isLocalIp = /^http:\/\/((192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|localhost|127\.0\.0\.1))/i.test(targetUrl);
  const isHttpsPage = typeof window !== 'undefined' && window.location.protocol === 'https:';

  if (isLocalIp && isHttpsPage && targetUrl.startsWith('http:')) {
    throw new Error('Brauzer xavfsizlik cheklovi (Mixed Content): HTTPS saytdan lokal HTTP (192.168.x.x) manziliga so‘rov yuborib bo‘lmaydi. Android ilovada Cloud server (SMS Gate Cloud) rejimini yoqing.');
  }

  let timer = null;
  const fetchOpts = {
    method,
    headers,
    body: payload ? JSON.stringify(payload) : undefined,
  };

  try {
    const controller = new AbortController();
    fetchOpts.signal = controller.signal;
    timer = setTimeout(() => controller.abort(), 12000);
  } catch (_) {}

  try {
    let res;
    try {
      res = await fetch(targetUrl, fetchOpts);
    } catch (fetchErr) {
      if (fetchErr.message && fetchErr.message.includes('Expected signal')) {
        delete fetchOpts.signal;
        res = await fetch(targetUrl, fetchOpts);
      } else {
        throw fetchErr;
      }
    }
    if (timer) clearTimeout(timer);
    const data = await res.json().catch(() => ({ success: res.ok }));
    return { ok: res.ok, status: res.status, data };
  } catch (netErr) {
    if (netErr.name === 'AbortError') {
      if (isLocalIp) {
        throw new Error('Lokal Gateway bilan aloqa o‘rnatilmadi (Timeout 12s). Telefoningizda "Local server" tugmasi yoqilganini, telefon va kompyuter bitta Wi-Fi tarmog‘ida ekanini va IP manzil to‘g‘riligini tekshiring.');
      }
      throw new Error('Qurilma bilan aloqa uzildi (Timeout 12s)');
    }
    if (netErr.message && netErr.message.includes('Failed to fetch')) {
      if (isLocalIp) {
        throw new Error('Lokal serverga ulanib bo‘lmadi. Android ilovada "Local server" yoqilganini tekshiring.');
      }
      throw new Error('SMS Gateway bilan aloqa o‘rnatilmadi. Qurilma yoqilganini, Gateway ilovasi faolligini va internet aloqasini tekshiring.');
    }
    throw netErr;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Pings an Android SMS Gateway to verify online status and battery
 */
export async function pingDevice(device) {
  if (!device || !device.gateway_url) {
    return { success: false, error: 'Gateway URL ko‘rsatilmagan' };
  }

  const now = new Date().toISOString();

  // 1. Instant check for Demo / Sandbox Gateway
  if (isDemoGateway(device, device.gateway_url)) {
    const updates = {
      status: 'online',
      last_seen_at: now,
      last_error: null,
    };
    try {
      await supabase.from('sms_devices').update(updates).eq('id', device.id);
    } catch (_) {}
    localStore.saveSmsDevice({ ...device, ...updates });

    return {
      success: true,
      status: 'online',
      last_seen_at: now,
      simulated: true,
      error: null,
    };
  }

  // 2. Real Gateway Ping
  let pingUrl = device.gateway_url.trim().replace(/\/+$/, '');
  const isEskiz = pingUrl.includes('eskiz.uz') || device?.provider === 'eskiz';
  if (isEskiz) {
    pingUrl = 'https://notify.eskiz.uz/api/auth/user';
  } else if (pingUrl.includes('api.sms-gate.app')) {
    pingUrl = 'https://api.sms-gate.app/3rdparty/v1/device';
  } else if (!/\/(message|messages|device|status|ping|health)/i.test(pingUrl)) {
    pingUrl = `${pingUrl}/message`;
  }
  const headers = buildGatewayHeaders(device);
  if (isEskiz && (!headers['Authorization'] || !headers['Authorization'].startsWith('Bearer eyJ'))) {
    const eskizToken = await getEskizToken(device);
    if (eskizToken) headers['Authorization'] = `Bearer ${eskizToken}`;
  }

  try {
    const res = await executeGatewayRequest(pingUrl, 'GET', headers, null);
    const isOnline = res.ok || res.status === 200 || res.status === 204 || res.status === 401 || res.status === 405;

    const devInfo = Array.isArray(res.data) ? res.data[0] : res.data;
    const isCloud = pingUrl.includes('api.sms-gate.app');
    let isDeviceActive = isOnline;
    let deviceError = isOnline ? null : `HTTP Status: ${res.status}`;

    // On Eskiz gateway, extract balance and user info
    let eskizBalance = null;
    if (isOnline && isEskiz && devInfo) {
      const uData = devInfo.data || devInfo;
      eskizBalance = uData?.balance !== undefined ? uData.balance : null;
      if (res.status === 401) {
        isDeviceActive = false;
        deviceError = 'Eskiz API autentifikatsiya xatosi (Login yoki parol noto‘g‘ri)';
      }
    }

    // On Cloud server, check the physical Android phone's lastSeen timestamp
    if (isOnline && isCloud && devInfo?.lastSeen) {
      const lastSeenMs = new Date(devInfo.lastSeen).getTime();
      const diffMs = Date.now() - lastSeenMs;
      // If phone hasn't communicated in over 3 minutes (180s), physical device is sleeping or disconnected
      if (diffMs > 180000) {
        const mins = Math.max(1, Math.round(diffMs / 60000));
        isDeviceActive = false;
        deviceError = `Qurilma uyqu rejimida (${mins} daqiqa oldin ko‘rilgan). Xiaomi telefoningizda SMS Gate ilovasini oching yoki fonda ishlash cheklovlarini olib tashlang.`;
      }
    }

    const updates = {
      status: isDeviceActive ? 'online' : (isOnline ? 'sleeping' : 'error'),
      last_seen_at: devInfo?.lastSeen || devInfo?.updatedAt || (isOnline ? now : device.last_seen_at),
      last_error: deviceError,
      battery_level: eskizBalance !== null ? eskizBalance : device.battery_level,
    };

    // Auto-optimize Cloud settings: keep polling interval ultra-fast (5s) instead of default 15min
    if (pingUrl.includes('api.sms-gate.app') && isOnline) {
      executeGatewayRequest('https://api.sms-gate.app/3rdparty/v1/settings', 'PATCH', headers, {
        ping: { interval_seconds: 5 },
      }).catch(() => {});
    }

    try {
      await supabase.from('sms_devices').update(updates).eq('id', device.id);
    } catch (_) {}
    localStore.saveSmsDevice({ ...device, ...updates });

    return {
      success: isDeviceActive,
      status: updates.status,
      last_seen_at: updates.last_seen_at,
      error: updates.last_error,
      deviceInfo: devInfo || null,
    };
  } catch (err) {
    const errorMsg = err.name === 'AbortError' ? 'Ulanish vaqti tugadi (Timeout 10s)' : err.message;

    const updates = {
      status: 'offline',
      last_error: errorMsg,
      updated_at: now,
    };

    try {
      await supabase.from('sms_devices').update(updates).eq('id', device.id);
    } catch (_) {}
    localStore.saveSmsDevice({ ...device, ...updates });

    return { success: false, status: 'offline', error: errorMsg };
  }
}

/**
 * In-flight SMS request deduplication map (key => Promise)
 */
const inFlightSmsRequests = new Map();

/**
 * Sent SMS timestamp cache for anti-duplicate prevention (1-second double-tap protection)
 */
const recentSentSmsCache = new Map();
const ANTI_DUPLICATE_WINDOW_MS = 1000;

/**
 * Lock flag for batch queue processing
 */
let isBatchProcessing = false;

/**
 * Sends a single SMS through the specified Android Gateway device
 */
export async function sendSmsViaGateway(device, { to, message, forceSend = false }) {
  if (!device || !device.gateway_url) {
    throw new Error('Gateway qurilmasi yoki URL manzili mavjud emas');
  }

  const normalizedPhone = normalizePhone(to);
  const cleanMsg = (message || '').trim();
  const dedupeKey = `${normalizedPhone}::${cleanMsg}`;
  const now = Date.now();

  // 1. Anti-duplicate check: Only when NOT forceSend, with a short 1s window (prevents accidental double clicks)
  if (!forceSend && recentSentSmsCache.has(dedupeKey)) {
    const lastSent = recentSentSmsCache.get(dedupeKey);
    if (now - lastSent < ANTI_DUPLICATE_WINDOW_MS) {
      console.warn(`[smsService] Takroriy bosish bloklandi: ${normalizedPhone}`);
      return {
        success: true,
        deduplicated: true,
        message: 'Takroriy SMS oldi olindi',
        data: { deduplicated: true, phone: normalizedPhone },
      };
    }
  }

  // 2. In-flight request check
  if (!forceSend && inFlightSmsRequests.has(dedupeKey)) {
    return await inFlightSmsRequests.get(dedupeKey);
  }

  let cleanUrl = device.gateway_url.trim();
  const isEskizGateway = cleanUrl.includes('eskiz.uz') || device?.provider === 'eskiz';
  if (isEskizGateway) {
    cleanUrl = 'https://notify.eskiz.uz/api/message/sms/send';
  } else if (cleanUrl.includes('api.sms-gate.app')) {
    cleanUrl = 'https://api.sms-gate.app/3rdparty/v1/messages';
  } else if (!/\/(message|messages|send|v1)/i.test(cleanUrl)) {
    cleanUrl = `${cleanUrl.replace(/\/+$/, '')}/message`;
  }

  // 3. Demo / Simulation Mode check:
  if (isDemoGateway(device, cleanUrl)) {
    // Ultra-fast simulated transmission delay (120ms)
    await new Promise((r) => setTimeout(r, 120));
    const nowIso = new Date().toISOString();
    const androidSentIso = new Date(Date.now() + 250).toISOString();
    const deliveredIso = new Date(Date.now() + 750).toISOString();
    const trackingId = `demo-tr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    try {
      await supabase.from('sms_devices').update({
        status: 'online',
        last_seen_at: nowIso,
        last_error: null,
      }).eq('id', device.id);
    } catch (_) {}
    localStore.saveSmsDevice({ ...device, status: 'online', last_seen_at: nowIso, last_error: null });
    recentSentSmsCache.set(dedupeKey, Date.now());

    return {
      success: true,
      simulated: true,
      tracking_id: trackingId,
      status: SMS_STATUS.DELIVERED,
      dispatched_at: nowIso,
      android_sent_at: androidSentIso,
      delivered_at: deliveredIso,
      message: 'SMS qabul qiluvchi telefoniga muvaffaqiyatli yetkazildi (Demo Gateway rejimi)',
      data: {
        id: trackingId,
        state: 'Delivered',
        success: true,
        simulated: true,
        phone: normalizedPhone,
        dispatched_at: nowIso,
        android_sent_at: androidSentIso,
        delivered_at: deliveredIso,
        via_device: device.name,
      },
    };
  }

  const headers = buildGatewayHeaders(device);

  // Exact payload format strictly conforming to Capcom6 SMS Gate Cloud, Local Gateway, or Eskiz.uz
  const isCloudGateway = cleanUrl.includes('api.sms-gate.app');
  let payload;
  if (isEskizGateway) {
    const eskizToken = await getEskizToken(device);
    if (!eskizToken) {
      throw new Error("Eskiz.uz API tokeni kiritilmagan! Iltimos, Qurilmalar bo‘limida 'Tahrirlash'ni bosib, Eskiz SMS shlyuz tokenini yoki (email:parol) ni kiriting.");
    }
    headers['Authorization'] = `Bearer ${eskizToken}`;
    const cleanPhone = normalizedPhone.replace(/^\+/, '');
    payload = {
      mobile_phone: cleanPhone,
      message: cleanMsg,
      from: device.sender_name || '4546',
      user_sms_id: `educo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    };
  } else if (isCloudGateway) {
    payload = {
      phoneNumbers: [normalizedPhone],
      textMessage: {
        text: cleanMsg,
      },
    };
  } else {
    payload = {
      message: cleanMsg,
      phoneNumbers: [normalizedPhone],
    };
  }

  const sendExecution = (async () => {
    // Safety auto-expiration timer for inFlight dedupe key
    const flightTimer = setTimeout(() => {
      inFlightSmsRequests.delete(dedupeKey);
    }, 15000);

    try {
      const res = await executeGatewayRequest(cleanUrl, 'POST', headers, payload);
      if (!res.ok && res.status !== 200 && res.status !== 201 && res.status !== 202) {
        throw new Error(`Gateway xatosi [${res.status}]`);
      }

      const isoNow = new Date().toISOString();
      try {
        await supabase.from('sms_devices').update({
          status: 'online',
          last_seen_at: isoNow,
          last_error: null,
        }).eq('id', device.id);
      } catch (_) {}
      localStore.saveSmsDevice({ ...device, status: 'online', last_seen_at: isoNow, last_error: null });

      // Save successful timestamp in anti-duplicate cache
      recentSentSmsCache.set(dedupeKey, Date.now());

      // Periodically clean up old entries
      if (recentSentSmsCache.size > 200) {
        const cutoff = Date.now() - 60000;
        for (const [k, timestamp] of recentSentSmsCache.entries()) {
          if (timestamp < cutoff) recentSentSmsCache.delete(k);
        }
      }

      // Extract tracking ID and granular status from Gateway response
      const trackingId = res.data?.id || res.data?.messageId || res.data?.user_sms_id || `tr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const rawState = res.data?.state || res.data?.status || res.data?.recipients?.[0]?.state || 'Pending';

      let mappedStatus = SMS_STATUS.DISPATCHING;
      let androidSentAt = null;
      let deliveredAt = null;

      if (rawState === 'Delivered' || rawState === 'DELIVRD') {
        mappedStatus = SMS_STATUS.DELIVERED;
        androidSentAt = isoNow;
        deliveredAt = isoNow;
      } else if (rawState === 'Sent' || rawState === 'waiting' || rawState === 'ACCEPTED') {
        mappedStatus = SMS_STATUS.SUBMITTED;
        androidSentAt = isoNow;
      } else {
        // Pending / Process in Gateway Cloud: queued on cloud, waiting for Android phone poll
        mappedStatus = SMS_STATUS.DISPATCHING;
      }

      return {
        success: true,
        tracking_id: trackingId,
        status: mappedStatus,
        dispatched_at: isoNow,
        android_sent_at: androidSentAt,
        delivered_at: deliveredAt,
        simulated: Boolean(res.data?.simulated),
        data: res.data || { success: true, id: trackingId },
      };
    } catch (err) {
      const errorMsg = err.name === 'AbortError' ? 'Qurilma bilan aloqa uzildi (Timeout 10s)' : err.message;
      throw new Error(errorMsg);
    } finally {
      clearTimeout(flightTimer);
      inFlightSmsRequests.delete(dedupeKey);
    }
  })();

  inFlightSmsRequests.set(dedupeKey, sendExecution);
  return await sendExecution;
}

/**
 * Sends a test SMS immediately to verify end-to-end delivery
 */
export async function sendTestSms({ phone, message, deviceId }) {
  const normalizedPhone = normalizePhone(phone);
  const cleanMsg = (message || '').trim();

  const devices = await getSmsDevices();
  let targetDevice = null;

  if (deviceId) {
    targetDevice = devices.find((d) => d.id === deviceId);
  }

  if (!targetDevice) {
    targetDevice = devices.find((d) => d.device_role === 'primary' && d.is_active);
  }

  if (!targetDevice) {
    targetDevice = devices.find((d) => d.device_role === 'backup' && d.is_active);
  }

  if (!targetDevice && devices.length > 0) {
    targetDevice = devices[0];
  }

  if (!targetDevice) {
    targetDevice = {
      id: 'dev-demo-primary',
      name: 'Android SMS Gateway (Test)',
      device_role: 'primary',
      gateway_url: 'https://api.sms-gate.app/3rdparty/v1/message',
      api_token: 'demo_token_educo',
      is_active: true,
      status: 'online',
    };
  }

  const result = await sendSmsViaGateway(targetDevice, {
    to: normalizedPhone,
    message: cleanMsg,
    forceSend: true,
  });

  // Log the test send with granular status and timestamps
  localStore.addSmsLog({
    tracking_id: result.tracking_id || null,
    recipient_phone: normalizedPhone,
    recipient_name: 'Test qabul qiluvchi',
    device_id: targetDevice.id,
    status: result.status || SMS_STATUS.SUBMITTED,
    dispatched_at: result.dispatched_at || new Date().toISOString(),
    android_sent_at: result.android_sent_at || null,
    delivered_at: result.delivered_at || null,
    response_payload: {
      delivered_via: targetDevice.name,
      role: targetDevice.device_role,
      simulated: Boolean(result.simulated),
      tracking_id: result.tracking_id || null,
      status: result.status || SMS_STATUS.SUBMITTED,
      ...(result.data || {}),
    },
  });

  return {
    success: true,
    deduplicated: false,
    simulated: Boolean(result.simulated),
    tracking_id: result.tracking_id || null,
    status: result.status || SMS_STATUS.SUBMITTED,
    dispatched_at: result.dispatched_at,
    android_sent_at: result.android_sent_at,
    delivered_at: result.delivered_at,
    device: targetDevice,
    result,
  };
}

/**
 * Parses message template with dynamic debtor variables
 */
export function formatSmsMessage(template, variables) {
  const {
    student_name = 'Talaba',
    parent_name = 'Ota-ona',
    course_name = 'Kurs',
    amount = '0',
    due_date = formatDate(new Date()),
  } = variables;

  return template
    .replace(/{student_name}/g, student_name)
    .replace(/{parent_name}/g, parent_name)
    .replace(/{course_name}/g, course_name)
    .replace(/{amount}/g, typeof amount === 'number' ? formatCurrency(amount) : amount)
    .replace(/{due_date}/g, due_date);
}

/**
 * Automatically inspects debtors from tuition and generates SMS queue jobs.
 * Enforces anti-duplicate window and idempotency.
 * Accepts optional excludedStudentIds or forceRequeue.
 */
export async function generateDebtorQueue(options = {}) {
  const settings = await getSmsSettings();

  // 1. Agar qarzdorlarga SMS yuborish o'chirilgan bo'lsa (va forceRequeue bo'lmasa) - HECH QANDAY SMS YUBORILMAYDI!
  if (!settings.debtor_sms_enabled && !options.forceRequeue) {
    return {
      totalDebtors: 0,
      queuedCount: 0,
      skippedCount: 0,
      noPhoneCount: 0,
      status: 'disabled',
      message: "Qarzdorlarga to‘lov SMS xabarlari yuborish o‘chirilgan. Yoqish uchun SMS bo‘limidagi 'ON' tugmasini bosing.",
    };
  }

  // 2. Belgilangan sana tekshiruvi: Agar sana belgilanib, bugungi sana undan oldin bo'lsa - xabar yuborilmaydi!
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  if (settings.debtor_sms_start_date && !options.forceRequeue) {
    if (todayStr < settings.debtor_sms_start_date) {
      return {
        totalDebtors: 0,
        queuedCount: 0,
        skippedCount: 0,
        noPhoneCount: 0,
        status: 'date_not_reached',
        message: `Belgilangan sana (${settings.debtor_sms_start_date}) hali yetib kelmadi. Bugun: ${todayStr}. SMS yuborish belgilangan kunda boshlanadi.`,
      };
    }
  }

  const summaryList = await getTuitionSummary({ status: 'ALL' });
  const allProfiles = localStore.getUsers().filter((u) => u.role === 'student');

  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const existingQueue = localStore.getSmsQueue();
  const excludedIds = options.excludedStudentIds || [];

  const template = settings.message_template ||
    'Hurmatli ota-ona! Farzandingiz {student_name}ning {course_name} kursi uchun {amount} so‘m to‘lov muddati yetib keldi ({due_date}). Iltimos, to‘lovni amalga oshiring. EDUCO';

  let queuedCount = 0;
  let skippedCount = 0;
  let noPhoneCount = 0;

  // Filter only students with positive outstanding balance
  const debtors = (summaryList || []).filter((s) => Number(s.balance || 0) > 0);

  for (const debtor of debtors) {
    if (excludedIds.includes(debtor.studentId)) {
      skippedCount++;
      continue;
    }

    const studentProfile = allProfiles.find((p) => p.id === debtor.studentId) || {};

    const studentPhone = debtor.studentPhone || studentProfile.phone || '';
    const fatherPhone = studentProfile.father_phone || studentProfile.fatherPhone || '';
    const motherPhone = studentProfile.mother_phone || studentProfile.motherPhone || '';

    // Determine target recipient based on owner settings
    let targetPhone = '';
    let recipientType = 'parent';
    let parentName = 'Hurmatli ota-ona';

    if (settings.target_recipient === 'father_first') {
      if (fatherPhone) {
        targetPhone = fatherPhone;
        recipientType = 'father';
        parentName = 'Hurmatli ota';
      } else if (motherPhone) {
        targetPhone = motherPhone;
        recipientType = 'mother';
        parentName = 'Hurmatli ona';
      } else if (studentPhone) {
        targetPhone = studentPhone;
        recipientType = 'student';
        parentName = debtor.studentName || 'Hurmatli talaba';
      }
    } else if (settings.target_recipient === 'mother_first') {
      if (motherPhone) {
        targetPhone = motherPhone;
        recipientType = 'mother';
        parentName = 'Hurmatli ona';
      } else if (fatherPhone) {
        targetPhone = fatherPhone;
        recipientType = 'father';
        parentName = 'Hurmatli ota';
      } else if (studentPhone) {
        targetPhone = studentPhone;
        recipientType = 'student';
        parentName = debtor.studentName || 'Hurmatli talaba';
      }
    } else {
      // Default: direct to student
      targetPhone = studentPhone || fatherPhone || motherPhone;
      recipientType = studentPhone ? 'student' : 'parent';
      parentName = debtor.studentName || 'Hurmatli talaba';
    }

    if (!targetPhone) {
      noPhoneCount++;
      continue;
    }

    // Unique idempotency key: prevents duplicate SMS for same student in same billing period
    const idempotencyKey = `sms-bill-${debtor.studentId}-${currentPeriod}`;

    // Anti-duplicate check: if already sent or queued for this period
    const alreadyQueued = existingQueue.find(
      (q) => q.idempotency_key === idempotencyKey && q.status !== 'failed' && q.status !== 'cancelled'
    );

    if (alreadyQueued && !options.forceRequeue) {
      skippedCount++;
      continue;
    }

    const studentFullName = `${studentProfile.first_name || ''} ${studentProfile.last_name || ''}`.trim() || debtor.studentName || 'Talaba';
    const effectiveCourseName = debtor.courseName || studentProfile.course_name || 'O‘quv kursi';
    const effectiveGroupName = debtor.groupName || studentProfile.group_name || 'Guruh';

    const messageText = formatSmsMessage(template, {
      student_name: studentFullName,
      parent_name: parentName,
      course_name: effectiveCourseName,
      amount: debtor.balance,
      due_date: formatDate(new Date()),
    });

    const nowIso = new Date().toISOString();
    const queueItem = {
      student_id: debtor.studentId,
      recipient_phone: normalizePhone(targetPhone),
      recipient_name: `${studentFullName} (${recipientType === 'father' ? 'Otasi' : recipientType === 'mother' ? 'Onasi' : 'Talaba'})`,
      recipient_type: recipientType,
      message_text: messageText,
      amount_due: Number(debtor.balance),
      course_name: effectiveCourseName,
      group_name: effectiveGroupName,
      due_date: new Date().toISOString().split('T')[0],
      status: SMS_STATUS.PENDING,
      attempts: 0,
      max_attempts: settings.max_retries || 3,
      billing_period: currentPeriod,
      idempotency_key: idempotencyKey,
      scheduled_at: nowIso,
      queued_at: nowIso,
      created_at: nowIso,
      dispatched_at: null,
      android_sent_at: null,
      delivered_at: null,
      failed_at: null,
    };

    try {
      await supabase.from('sms_queue').insert([queueItem]);
    } catch (_) {}
    localStore.saveSmsQueueItem(queueItem);
    queuedCount++;
  }

  return {
    totalDebtors: debtors.length,
    queuedCount,
    skippedCount,
    noPhoneCount,
  };
}

/**
 * Enqueue attendance notification SMS for students/parents
 */
export async function enqueueAttendanceSms({
  studentId,
  studentName = '',
  courseName = 'Dars',
  lessonTime = 'Dars vaqtida',
  status = 'absent',
  date = null,
  remark = '',
  teacherName = 'Fan mentori',
}) {
  if (!PARENTS_SMS_ENABLED) return null;

  try {
    const settings = await getSmsSettings();
    if (!settings || !settings.is_enabled) return null;

    const users = localStore.getUsers() || [];
    const student = users.find((u) => u.id === studentId);
    if (!student) return null;

    const sName =
      studentName ||
      student.fullName ||
      student.name ||
      `${student.first_name || ''} ${student.last_name || ''}`.trim() ||
      'Talaba';
    const dateFormatted = date || new Date().toISOString().split('T')[0];

    // Sana formatini chiroyli qilish (masalan, 2026-11-13 -> 13.11.2026)
    let prettyDate = dateFormatted;
    if (dateFormatted && dateFormatted.includes('-')) {
      const parts = dateFormatted.split('-');
      if (parts.length === 3) {
        prettyDate = `${parts[2]}.${parts[1]}.${parts[0]}`;
      }
    }

    // Ota-ona telefon raqamlari (Talab: faqat ota-ona raqami bo'lsa ularga SMS yuboriladi)
    let targetPhone = '';
    let recipientType = 'parent';
    const father = (student.father_phone || student.fatherPhone || '').trim();
    const mother = (student.mother_phone || student.motherPhone || '').trim();
    const parent = (student.parent_phone || student.parentPhone || '').trim();

    if (settings.target_recipient === 'mother_first') {
      targetPhone = mother || father || parent;
      recipientType = mother ? 'mother' : father ? 'father' : 'parent';
    } else {
      targetPhone = father || mother || parent;
      recipientType = father ? 'father' : mother ? 'mother' : 'parent';
    }

    // Ota-onaning telefon raqami bo'lmasa, SMS yuborilmaydi (talab: faqat ota-onaga SMS borsin)
    if (!targetPhone) return null;

    // Idempotency key: prevents duplicate attendance SMS for the same student, date, and status
    const idempotencyKey = `sms-att-${studentId}-${dateFormatted}-${status}`;
    const existingQueue = localStore.getSmsQueue() || [];
    const alreadyQueued = existingQueue.find(
      (q) => q.idempotency_key === idempotencyKey && q.status !== 'failed' && q.status !== 'cancelled'
    );
    if (alreadyQueued) return alreadyQueued;

    let messageText = '';
    if (status === 'present') {
      messageText =
        `🟢 Hurmatli Ota-ona,\n\n` +
        `Farzandingiz ${sName} ${courseName} fanidan ${prettyDate} sanasidagi darsga qatnashdi. Dars ${lessonTime} oralig‘ida o‘tkazildi.\n\n` +
        `Biz farzandingizning bilim olishdagi intilishi va ishtiyoqini yuqori baholaymiz.\n\n` +
        `Hurmat bilan, Fan mentori ${teacherName}`;
    } else if (status === 'late') {
      messageText =
        `🟡 Hurmatli Ota-ona,\n\n` +
        `Farzandingiz ${sName} ${courseName} fanidan ${prettyDate} kungi darsga KECH QOLIB yetib keldi. Dars ${lessonTime} oralig‘ida o‘tkazilmoqda.\n\n` +
        `Iltimos, darslarga o‘z vaqtida qatnashishni nazorat qilishingizni so‘raymiz.\n\n` +
        `Hurmat bilan, Fan mentori ${teacherName}`;
    } else {
      messageText =
        `🔴 DIQQAT: Hurmatli Ota-ona,\n\n` +
        `Farzandingiz ${sName} bugun (${prettyDate}) ${courseName} fanidan darsda QATNASHMADI (Darsga kelmadi). Dars vaqti: ${lessonTime}.\n\n` +
        `Sababini aniqlashtirish uchun o‘quv markazi ma’muriyati bilan bog‘lanishingizni so‘raymiz.\n\n` +
        `Hurmat bilan, EDUCO LMS Ma’muriyati`;
    }

    const nowIso = new Date().toISOString();
    const queueItem = {
      id: `sms-att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      student_id: studentId,
      recipient_phone: normalizePhone(targetPhone),
      recipient_name: `${sName} (${recipientType === 'father' ? 'Otasi' : recipientType === 'mother' ? 'Onasi' : 'Talaba'})`,
      recipient_type: recipientType,
      message_text: messageText,
      course_name: courseName,
      status: SMS_STATUS.PENDING,
      attempts: 0,
      max_attempts: settings.max_retries || 3,
      idempotency_key: idempotencyKey,
      scheduled_at: nowIso,
      queued_at: nowIso,
      created_at: nowIso,
      dispatched_at: null,
      android_sent_at: null,
      delivered_at: null,
      failed_at: null,
    };

    try {
      await supabase.from('sms_queue').insert([queueItem]);
    } catch (_) {}
    localStore.saveSmsQueueItem(queueItem);
    return queueItem;
  } catch (err) {
    console.warn('[smsService] enqueueAttendanceSms exception:', err.message);
    return null;
  }
}

/**
 * Calculates all prospective recipients (debtors and full student roster),
 * resolving target parent/student phone, amounts, and live formatted message
 * according to current settings or provided overrides.
 */
export async function getProspectiveRecipients(options = {}) {
  const currentSettings = options.settingsOverride || (await getSmsSettings()) || {};
  const summaryList = await getTuitionSummary({ status: 'ALL' });
  const allProfiles = localStore.getUsers().filter((u) => u.role === 'student');

  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const existingQueue = localStore.getSmsQueue();

  const template =
    currentSettings.message_template ||
    'Hurmatli ota-ona! Farzandingiz {student_name}ning {course_name} kursi uchun {amount} so‘m to‘lov muddati yetib keldi ({due_date}). Iltimos, to‘lovni amalga oshiring. EDUCO';
  const targetPriority = currentSettings.target_recipient || 'father_first';
  const excludedIds = options.excludedStudentIds || [];

  return (summaryList || []).map((debtor) => {
    const studentProfile = allProfiles.find((p) => p.id === debtor.studentId) || {};

    const studentPhone = debtor.studentPhone || studentProfile.phone || '';
    const fatherPhone = studentProfile.father_phone || studentProfile.fatherPhone || '';
    const motherPhone = studentProfile.mother_phone || studentProfile.motherPhone || '';

    let targetPhone = '';
    let recipientType = 'parent';
    let recipientLabel = 'Ota-ona';
    let parentSalutation = 'Hurmatli ota-ona';

    if (targetPriority === 'father_first') {
      if (fatherPhone) {
        targetPhone = fatherPhone;
        recipientType = 'father';
        recipientLabel = 'Otasi';
        parentSalutation = 'Hurmatli ota';
      } else if (motherPhone) {
        targetPhone = motherPhone;
        recipientType = 'mother';
        recipientLabel = 'Onasi';
        parentSalutation = 'Hurmatli ona';
      } else if (studentPhone) {
        targetPhone = studentPhone;
        recipientType = 'student';
        recipientLabel = 'Talabaning o‘zi';
        parentSalutation = debtor.studentName || 'Hurmatli talaba';
      }
    } else if (targetPriority === 'mother_first') {
      if (motherPhone) {
        targetPhone = motherPhone;
        recipientType = 'mother';
        recipientLabel = 'Onasi';
        parentSalutation = 'Hurmatli ona';
      } else if (fatherPhone) {
        targetPhone = fatherPhone;
        recipientType = 'father';
        recipientLabel = 'Otasi';
        parentSalutation = 'Hurmatli ota';
      } else if (studentPhone) {
        targetPhone = studentPhone;
        recipientType = 'student';
        recipientLabel = 'Talabaning o‘zi';
        parentSalutation = debtor.studentName || 'Hurmatli talaba';
      }
    } else {
      if (studentPhone) {
        targetPhone = studentPhone;
        recipientType = 'student';
        recipientLabel = 'Talabaning o‘zi';
        parentSalutation = debtor.studentName || 'Hurmatli talaba';
      } else if (fatherPhone) {
        targetPhone = fatherPhone;
        recipientType = 'father';
        recipientLabel = 'Otasi';
        parentSalutation = 'Hurmatli ota';
      } else if (motherPhone) {
        targetPhone = motherPhone;
        recipientType = 'mother';
        recipientLabel = 'Onasi';
        parentSalutation = 'Hurmatli ona';
      }
    }

    const studentFullName =
      `${studentProfile.first_name || ''} ${studentProfile.last_name || ''}`.trim() ||
      debtor.studentName ||
      'Talaba';
    const effectiveCourseName = debtor.courseName || studentProfile.course_name || 'O‘quv kursi';
    const effectiveGroupName = debtor.groupName || studentProfile.group_name || 'Guruh';
    const balance = Number(debtor.balance || 0);
    const isDebtor = balance > 0;
    const isExcluded = excludedIds.includes(debtor.studentId);

    const idempotencyKey = `sms-bill-${debtor.studentId}-${currentPeriod}`;
    const queuedEntry = existingQueue.find(
      (q) => q.idempotency_key === idempotencyKey && q.status !== 'cancelled'
    );

    const messageText = formatSmsMessage(template, {
      student_name: studentFullName,
      parent_name: parentSalutation,
      course_name: effectiveCourseName,
      amount: balance > 0 ? balance : debtor.totalDue,
      due_date: formatDate(new Date()),
    });

    return {
      studentId: debtor.studentId,
      studentName: studentFullName,
      courseName: effectiveCourseName,
      groupName: effectiveGroupName,
      studentPhone: normalizePhone(studentPhone),
      fatherPhone: normalizePhone(fatherPhone),
      motherPhone: normalizePhone(motherPhone),
      targetPhone: normalizePhone(targetPhone),
      recipientType,
      recipientLabel,
      parentSalutation,
      totalDue: Number(debtor.totalDue || 0),
      paid: Number(debtor.paid || 0),
      balance,
      isDebtor,
      isExcluded,
      hasPhone: Boolean(targetPhone),
      queueStatus: queuedEntry?.status || null,
      messageText,
      discountDetails: debtor.discountDetails || [],
    };
  });
}

/**
 * Gets SMS queue with filters (status, search)
 */
export async function getSmsQueue(filters = {}) {
  const { status, search } = filters;
  let list = [];

  try {
    let query = supabase.from('sms_queue').select('*').order('created_at', { ascending: false });
    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    }
    const { data, error } = await query;
    if (error || !data) {
      list = localStore.getSmsQueue();
    } else {
      list = data;
    }
  } catch (_) {
    list = localStore.getSmsQueue();
  }

  if (status && status !== 'ALL') {
    list = list.filter((item) => item.status === status);
  }

  if (search && search.trim()) {
    const q = search.toLowerCase().trim();
    const rawDigits = q.replace(/\D/g, '');
    list = list.filter(
      (item) =>
        (item.recipient_name && item.recipient_name.toLowerCase().includes(q)) ||
        (item.recipient_phone && (item.recipient_phone.includes(q) || (rawDigits && item.recipient_phone.includes(rawDigits)))) ||
        (item.message_text && item.message_text.toLowerCase().includes(q))
    );
  }

  return list;
}

/**
 * Gets SMS delivery audit logs
 */
export async function getSmsLogs(limit = 100) {
  try {
    const { data, error } = await supabase
      .from('sms_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data || data.length === 0) {
      return localStore.getSmsLogs().slice(0, limit);
    }
    return data;
  } catch (_) {
    return localStore.getSmsLogs().slice(0, limit);
  }
}

/**
 * Processes pending queue items with Dual-Device Failover & rate limiting
 */
export async function processQueueBatch({ limit = 500, onProgress = () => {} } = {}) {
  if (isBatchProcessing) {
    console.warn('[smsService] Queue batch processing is already in progress, rejecting parallel run.');
    return { processed: 0, sent: 0, failed: 0, inProgress: true };
  }

  isBatchProcessing = true;
  try {
    const settings = await getSmsSettings();
    const devices = await getSmsDevices();

    let primaryDevice = devices.find((d) => d.device_role === 'primary' && d.is_active);
    let backupDevice = devices.find((d) => d.device_role === 'backup' && d.is_active);

    if (!primaryDevice && !backupDevice && devices.length > 0) {
      primaryDevice = devices[0];
    }

    if (!primaryDevice && !backupDevice) {
      primaryDevice = {
        id: 'dev-demo-primary',
        name: 'Android SMS Gateway (Avto)',
        device_role: 'primary',
        gateway_url: 'https://api.sms-gate.app/3rdparty/v1/message',
        api_token: 'demo_token_educo',
        is_active: true,
        status: 'online',
      };
    }

    const allQueue = localStore.getSmsQueue();
    // Sort pending items: scheduled earlier items first, newly retried items at the end
    const pendingItems = allQueue
      .filter((q) => {
        const norm = normalizeSmsStatus(q.status);
        if (norm === SMS_STATUS.PENDING) return true;
        // If DISPATCHING but has no tracking_id, it failed to dispatch earlier and should be retried
        if (norm === SMS_STATUS.DISPATCHING && !q.tracking_id) return true;
        return false;
      })
      .sort((a, b) => {
        const timeA = new Date(a.scheduled_at || a.queued_at || a.created_at || 0).getTime();
        const timeB = new Date(b.scheduled_at || b.queued_at || b.created_at || 0).getTime();
        return timeA - timeB;
      })
      .slice(0, limit);

    if (pendingItems.length === 0) {
      return { processed: 0, submitted: 0, delivered: 0, sent: 0, failed: 0 };
    }

    let submittedCount = 0;
    let deliveredCount = 0;
    let failedCount = 0;

    const isSimulatedBatch = isDemoGateway(primaryDevice) || (backupDevice && isDemoGateway(backupDevice));
    // Rate-limiting delay: in simulated mode: 120ms. In real gateway: 1500ms - 2200ms
    // To protect SIM card from telecom operator spam block while providing optimal delivery speed
    const intervalMs = isSimulatedBatch
      ? 120
      : Math.min(Math.max((settings.send_interval_seconds || 1.8) * 1000, 1200), 3000);

    for (let i = 0; i < pendingItems.length; i++) {
      const item = pendingItems[i];

      try {
        // 0. Strict Anti-Duplicate Check: verify if this item was already delivered, submitted, or in-flight dispatching
        const currentQueue = localStore.getSmsQueue();
        const alreadySentItem = currentQueue.find(
          (q) => q.id !== item.id &&
            q.idempotency_key === item.idempotency_key &&
            (normalizeSmsStatus(q.status) === SMS_STATUS.DELIVERED ||
             normalizeSmsStatus(q.status) === SMS_STATUS.SUBMITTED ||
             (normalizeSmsStatus(q.status) === SMS_STATUS.DISPATCHING && q.tracking_id))
        );
        const itemAlreadyDelivered = currentQueue.find(
          (q) => q.id === item.id && (
            normalizeSmsStatus(q.status) === SMS_STATUS.DELIVERED ||
            normalizeSmsStatus(q.status) === SMS_STATUS.SUBMITTED ||
            (normalizeSmsStatus(q.status) === SMS_STATUS.DISPATCHING && q.tracking_id)
          )
        );

        if (alreadySentItem || itemAlreadyDelivered) {
          console.warn(`[smsService] Dublikatsiya oldi olindi: ${item.recipient_phone} (${item.idempotency_key})`);
          const skipUpdates = {
            status: itemAlreadyDelivered ? itemAlreadyDelivered.status : 'CANCELLED',
            error_message: 'Dublikatsiya oldi olindi (allaqachon yuborilgan yoki qabul qilingan)',
          };
          try {
            await supabase.from('sms_queue').update(skipUpdates).eq('id', item.id);
          } catch (_) {}
          localStore.updateSmsQueueItem(item.id, skipUpdates);
          continue;
        }

      let activeDevice = primaryDevice;
      let delivered = false;
      let sendResult = null;
      let lastError = null;

      onProgress({
        current: i + 1,
        total: pendingItems.length,
        item,
        device: activeDevice?.name,
      });

      // 1. Mark as DISPATCHING with exact dispatched_at timestamp
      const dispatchIso = new Date().toISOString();
      localStore.updateSmsQueueItem(item.id, {
        status: SMS_STATUS.DISPATCHING,
        dispatched_at: dispatchIso,
        last_attempt_at: dispatchIso,
      });

      // 2. Try Primary Device first
      if (activeDevice) {
        try {
          sendResult = await sendSmsViaGateway(activeDevice, {
            to: item.recipient_phone,
            message: item.message_text,
            forceSend: true,
          });
          delivered = true;
        } catch (err) {
          lastError = `Primary xatosi: ${err.message}`;
          console.warn(`Primary device failed for ${item.recipient_phone}, switching to Backup:`, err.message);
        }
      }

      // 3. Failover to Backup Device if Primary failed
      if (!delivered && backupDevice) {
        activeDevice = backupDevice;
        try {
          sendResult = await sendSmsViaGateway(backupDevice, {
            to: item.recipient_phone,
            message: item.message_text,
            forceSend: true,
          });
          delivered = true;
          lastError = null; // Cleared on successful backup send
        } catch (backupErr) {
          lastError = `${lastError || ''} | Backup xatosi: ${backupErr.message}`;
          console.error(`Backup device also failed for ${item.recipient_phone}:`, backupErr.message);
        }
      }

      // 4. Update queue status with stage latencies & write audit log
      if (delivered && sendResult) {
        const finalStatus = sendResult.status || SMS_STATUS.SUBMITTED;
        if (finalStatus === SMS_STATUS.DELIVERED) {
          deliveredCount++;
        } else {
          submittedCount++;
        }

        if (item._batchRetries) {
          failedCount = Math.max(0, failedCount - 1);
        }

        const queuedAt = item.queued_at || item.created_at || dispatchIso;
        const lmsLatency = Math.max(0, new Date(dispatchIso).getTime() - new Date(queuedAt).getTime());
        const androidLatency = sendResult.android_sent_at
          ? Math.max(0, new Date(sendResult.android_sent_at).getTime() - new Date(dispatchIso).getTime())
          : null;
        const carrierLatency = sendResult.delivered_at && sendResult.android_sent_at
          ? Math.max(0, new Date(sendResult.delivered_at).getTime() - new Date(sendResult.android_sent_at).getTime())
          : null;
        const totalLatency = sendResult.delivered_at
          ? Math.max(0, new Date(sendResult.delivered_at).getTime() - new Date(queuedAt).getTime())
          : null;

        const updates = {
          tracking_id: sendResult.tracking_id || item.tracking_id || null,
          status: finalStatus,
          device_id: activeDevice.id,
          dispatched_at: sendResult.dispatched_at || dispatchIso,
          android_sent_at: sendResult.android_sent_at || null,
          delivered_at: sendResult.delivered_at || null,
          sent_at: sendResult.android_sent_at || dispatchIso,
          lms_latency_ms: lmsLatency,
          android_latency_ms: androidLatency,
          carrier_latency_ms: carrierLatency,
          total_latency_ms: totalLatency,
          error_message: null,
        };

        try {
          await supabase.from('sms_queue').update(updates).eq('id', item.id);
        } catch (_) {}
        localStore.updateSmsQueueItem(item.id, updates);

        localStore.addSmsLog({
          queue_id: item.id,
          tracking_id: sendResult.tracking_id || null,
          device_id: activeDevice.id,
          recipient_phone: item.recipient_phone,
          recipient_name: item.recipient_name,
          status: finalStatus,
          dispatched_at: updates.dispatched_at,
          android_sent_at: updates.android_sent_at,
          delivered_at: updates.delivered_at,
          response_payload: {
            delivered_via: activeDevice.name,
            role: activeDevice.device_role,
            tracking_id: sendResult.tracking_id || null,
            status: finalStatus,
            lms_latency_ms: lmsLatency,
            android_latency_ms: androidLatency,
            carrier_latency_ms: carrierLatency,
            total_latency_ms: totalLatency,
          },
        });
      } else {
        failedCount++;
        const newAttempts = (item.attempts || 0) + 1;
        const maxRetries = item.max_attempts || settings.max_retries || 10;
        const willRetry = newAttempts < maxRetries;
        const failIso = new Date().toISOString();

        const updates = {
          status: willRetry ? SMS_STATUS.PENDING : SMS_STATUS.FAILED,
          attempts: newAttempts,
          error_message: lastError,
          failed_at: willRetry ? null : failIso,
          last_attempt_at: failIso,
          scheduled_at: new Date(Date.now() + 15000).toISOString(),
        };
        try {
          await supabase.from('sms_queue').update(updates).eq('id', item.id);
        } catch (_) {}
        localStore.updateSmsQueueItem(item.id, updates);

        localStore.addSmsLog({
          queue_id: item.id,
          tracking_id: item.tracking_id || null,
          device_id: activeDevice?.id || null,
          recipient_phone: item.recipient_phone,
          recipient_name: item.recipient_name,
          status: willRetry ? 'retrying' : SMS_STATUS.FAILED,
          failed_at: failIso,
          error_details: `${lastError} (Urinish: ${newAttempts}/${maxRetries})`,
        });
      }
    } catch (itemErr) {
      failedCount++;
      console.error(`[smsService] Xatolik navbatdagi element uchun (${item?.recipient_phone}):`, itemErr);
      const failIso = new Date().toISOString();
      const failUpdates = {
        status: SMS_STATUS.FAILED,
        error_message: itemErr.message || 'Kutilmagan xatolik',
        failed_at: failIso,
      };
      try {
        await supabase.from('sms_queue').update(failUpdates).eq('id', item.id);
      } catch (_) {}
      localStore.updateSmsQueueItem(item.id, failUpdates);
    }

      // Telecom operator safe rate-limiting delay between messages
      if (i < pendingItems.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }
    }

    // After batch dispatch, trigger status reconciliation for in-flight cloud messages
    reconcileSmsDeliveryStatuses().catch(() => {});

    return {
      processed: pendingItems.length,
      submitted: submittedCount,
      delivered: deliveredCount,
      sent: submittedCount + deliveredCount,
      failed: failedCount,
    };
  } finally {
    isBatchProcessing = false;
  }
}

/**
 * Retries a failed or stuck queue item
 */
export async function retryQueueItem(id) {
  const updates = {
    status: 'pending',
    attempts: 0,
    error_message: null,
    updated_at: new Date().toISOString(),
  };
  try {
    await supabase.from('sms_queue').update(updates).eq('id', id);
  } catch (_) {}
  return localStore.updateSmsQueueItem(id, updates);
}

/**
 * Retries all failed queue items at once by moving them back to pending
 */
export async function retryAllFailedQueueItems() {
  const allQueue = localStore.getSmsQueue();
  const failedItems = allQueue.filter((q) => q.status === 'failed');
  for (const item of failedItems) {
    const updates = {
      status: 'pending',
      attempts: 0,
      error_message: null,
      scheduled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    try {
      await supabase.from('sms_queue').update(updates).eq('id', item.id);
    } catch (_) {}
    localStore.updateSmsQueueItem(item.id, updates);
  }
  return failedItems.length;
}

/**
 * Cancels a pending queue item
 */
export async function cancelQueueItem(id) {
  const updates = {
    status: 'cancelled',
    updated_at: new Date().toISOString(),
  };
  try {
    await supabase.from('sms_queue').update(updates).eq('id', id);
  } catch (_) {}
  return localStore.updateSmsQueueItem(id, updates);
}

/**
 * Reconciles SMS delivery reports with Android Gateway / Cloud in real time.
 * Translates Gateway States into canonical LMS statuses:
 *   - 'Pending' / 'Process' -> DISPATCHING (or UNKNOWN if > 30 mins)
 *   - 'Sent' -> SUBMITTED (SmsManager confirmed handover to operator)
 *   - 'Delivered' -> DELIVERED (Operator confirmed delivery report received)
 *   - 'Failed' -> FAILED
 */
export async function reconcileSmsDeliveryStatuses(options = {}) {
  const devices = await getSmsDevices();
  const primary = devices.find((d) => d.device_role === 'primary' && d.is_active) || devices[0];
  if (!primary || !primary.gateway_url) {
    return { reconciled: 0, reconciledCount: 0, checked: 0 };
  }

  // Demo gateway simulation reconciliation
  if (isDemoGateway(primary)) {
    const queue = localStore.getSmsQueue();
    let simulatedReconciled = 0;
    const now = Date.now();

    for (const q of queue) {
      const norm = normalizeSmsStatus(q.status);
      if (norm === SMS_STATUS.DISPATCHING) {
        const dispatchedTime = new Date(q.dispatched_at || q.created_at || now).getTime();
        if (now - dispatchedTime > 300) {
          const sentIso = new Date(dispatchedTime + 250).toISOString();
          const deliveredIso = new Date(dispatchedTime + 850).toISOString();
          const updates = {
            status: SMS_STATUS.DELIVERED,
            android_sent_at: sentIso,
            delivered_at: deliveredIso,
            lms_latency_ms: 120,
            android_latency_ms: 250,
            carrier_latency_ms: 600,
            total_latency_ms: 970,
          };
          localStore.updateSmsQueueItem(q.id, updates);
          simulatedReconciled++;
        }
      }
    }
    return { reconciled: simulatedReconciled, reconciledCount: simulatedReconciled, checked: queue.length, simulated: true };
  }

  // Real Gateway reconciliation via Capcom6 SMS Gate Cloud
  let url = primary.gateway_url.trim().replace(/\/+$/, '');
  if (url.includes('api.sms-gate.app')) {
    url = 'https://api.sms-gate.app/3rdparty/v1/messages?limit=100';
  } else {
    url = `${url}/messages?limit=100`;
  }
  const headers = buildGatewayHeaders(primary);

  try {
    const res = await executeGatewayRequest(url, 'GET', headers, null);
    if (!res.ok || !Array.isArray(res.data)) {
      return { reconciled: 0, checked: 0 };
    }

    const gatewayMessages = res.data;
    const queue = localStore.getSmsQueue();
    let reconciledCount = 0;

    for (const gwMsg of gatewayMessages) {
      if (!gwMsg.id) continue;
      const phoneClean = normalizePhone(gwMsg.recipients?.[0]?.phoneNumber);
      const queueItem = queue.find(
        (q) => q.tracking_id === gwMsg.id ||
          (phoneClean && q.recipient_phone === phoneClean &&
            (normalizeSmsStatus(q.status) === SMS_STATUS.DISPATCHING ||
             normalizeSmsStatus(q.status) === SMS_STATUS.SUBMITTED ||
             q.status === 'pending' ||
             q.status === 'processing' ||
             q.status === 'sent'))
      );

      if (!queueItem) continue;

      const currentState = gwMsg.state || gwMsg.recipients?.[0]?.state || 'Pending';
      const statesObj = gwMsg.states || {};
      const sentTime = statesObj.Sent || gwMsg.sentAt || null;
      const deliveredTime = statesObj.Delivered || gwMsg.deliveredAt || null;
      const processedTime = statesObj.Processed || null;

      let newStatus = null;
      const updates = {};
      if (processedTime) updates.android_received_at = processedTime;

      if (currentState === 'Delivered') {
        newStatus = SMS_STATUS.DELIVERED;
        updates.delivered_at = deliveredTime || new Date().toISOString();
        if (sentTime) updates.android_sent_at = sentTime;
      } else if (currentState === 'Sent') {
        newStatus = SMS_STATUS.SUBMITTED;
        updates.android_sent_at = sentTime || new Date().toISOString();
      } else if (currentState === 'Failed') {
        newStatus = SMS_STATUS.FAILED;
        updates.failed_at = new Date().toISOString();
      } else if (currentState === 'Pending' || currentState === 'Process') {
        const createdTime = new Date(gwMsg.createdAt || queueItem.dispatched_at || 0).getTime();
        // If pending on cloud for more than 30 minutes without operator handover -> UNKNOWN
        if (Date.now() - createdTime > 30 * 60 * 1000) {
          newStatus = SMS_STATUS.UNKNOWN;
          updates.error_message = 'Yetkazilganlik hisoboti kelmagan (Gateway kutish vaqti 30 daqiqadan oshdi)';
        } else {
          newStatus = SMS_STATUS.DISPATCHING;
        }
      }

      const currentNorm = normalizeSmsStatus(queueItem.status);
      if (newStatus && (newStatus !== currentNorm || !queueItem.android_sent_at || (!queueItem.delivered_at && newStatus === SMS_STATUS.DELIVERED))) {
        updates.status = newStatus;
        updates.tracking_id = gwMsg.id;

        // Calculate granular stage latencies
        const queuedAt = queueItem.queued_at || queueItem.created_at;
        const dispatchedAt = queueItem.dispatched_at || gwMsg.createdAt;
        const androidReceivedAt = updates.android_received_at || queueItem.android_received_at;
        const androidSentAt = updates.android_sent_at || queueItem.android_sent_at;
        const deliveredAt = updates.delivered_at || queueItem.delivered_at;

        if (queuedAt && dispatchedAt) {
          updates.lms_latency_ms = Math.max(0, new Date(dispatchedAt).getTime() - new Date(queuedAt).getTime());
        }
        if (dispatchedAt && androidReceivedAt) {
          updates.cloud_to_phone_latency_ms = Math.max(0, new Date(androidReceivedAt).getTime() - new Date(dispatchedAt).getTime());
        }
        if (androidReceivedAt && androidSentAt) {
          updates.phone_to_carrier_latency_ms = Math.max(0, new Date(androidSentAt).getTime() - new Date(androidReceivedAt).getTime());
        }
        if (dispatchedAt && androidSentAt) {
          updates.android_latency_ms = Math.max(0, new Date(androidSentAt).getTime() - new Date(dispatchedAt).getTime());
        }
        if (androidSentAt && deliveredAt) {
          updates.carrier_latency_ms = Math.max(0, new Date(deliveredAt).getTime() - new Date(androidSentAt).getTime());
        }
        if (queuedAt && deliveredAt) {
          updates.total_latency_ms = Math.max(0, new Date(deliveredAt).getTime() - new Date(queuedAt).getTime());
        }

        localStore.updateSmsQueueItem(queueItem.id, updates);
        try {
          await supabase.from('sms_queue').update(updates).eq('id', queueItem.id);
        } catch (_) {}

        localStore.addSmsLog({
          queue_id: queueItem.id,
          tracking_id: gwMsg.id,
          recipient_phone: queueItem.recipient_phone,
          recipient_name: queueItem.recipient_name,
          status: newStatus,
          dispatched_at: dispatchedAt,
          android_received_at: androidReceivedAt,
          android_sent_at: androidSentAt,
          delivered_at: deliveredAt,
          response_payload: {
            reconciled: true,
            gateway_state: currentState,
            states: statesObj,
            lms_latency_ms: updates.lms_latency_ms,
            cloud_to_phone_latency_ms: updates.cloud_to_phone_latency_ms,
            phone_to_carrier_latency_ms: updates.phone_to_carrier_latency_ms,
            carrier_latency_ms: updates.carrier_latency_ms,
            total_latency_ms: updates.total_latency_ms,
          },
        });
        reconciledCount++;
      }
    }

    return { reconciled: reconciledCount, reconciledCount, checked: gatewayMessages.length };
  } catch (err) {
    console.warn('[reconcileSmsDeliveryStatuses] error:', err.message);
    return { reconciled: 0, reconciledCount: 0, error: err.message };
  }
}

let schedulerTimer = null;
let lastProcessedMinuteKey = null;
let reconciliationCounter = 0;

/**
 * Starts automated background worker that checks schedule every 10 seconds
 * and reconciles SMS delivery status reports every 20 seconds.
 */
export function startSmsAutomationWorker({ onScheduledTrigger = () => {} } = {}) {
  if (schedulerTimer) return () => clearInterval(schedulerTimer);

  const checkAndRun = async () => {
    try {
      reconciliationCounter++;
      // Auto-reconcile delivery status reports every 2 iterations (20s)
      if (reconciliationCounter % 2 === 0) {
        reconcileSmsDeliveryStatuses().catch(() => {});
      }

      const settings = await getSmsSettings();
      if (!settings || !settings.is_enabled) return;

      const now = new Date();
      const currentDay = now.getDate();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${hours}:${minutes}`;

      const scheduleTime = settings.schedule_time || '10:00';
      const scheduleDays = Array.isArray(settings.schedule_days) ? settings.schedule_days : [1, 5, 10, 15, 20, 25];

      // Match day of month and exact time (HH:mm)
      if (!scheduleDays.includes(currentDay)) return;
      if (currentTime !== scheduleTime) return;

      const minuteKey = `${now.getFullYear()}-${now.getMonth() + 1}-${currentDay}_${currentTime}`;
      if (lastProcessedMinuteKey === minuteKey) return; // Prevent multiple runs in same minute
      lastProcessedMinuteKey = minuteKey;

      console.log(`[SMS Avtomatika] Reja vaqti yetib keldi (${scheduleTime}). Qarzdorlarni tekshirish boshlanmoqda...`);

      const res = await generateDebtorQueue();
      let sentInfo = null;
      if (res && res.queuedCount > 0) {
        sentInfo = await processQueueBatch({ limit: 50 });
      }

      onScheduledTrigger({ minuteKey, res, sentInfo });
    } catch (err) {
      console.warn('[SMS Avtomatika] Xatolik:', err);
    }
  };

  checkAndRun();
  schedulerTimer = setInterval(checkAndRun, 10000);
  return () => {
    if (schedulerTimer) {
      clearInterval(schedulerTimer);
      schedulerTimer = null;
    }
  };
}

export default {
  getSmsSettings,
  updateSmsSettings,
  getSmsDevices,
  saveSmsDevice,
  deleteSmsDevice,
  pingDevice,
  sendSmsViaGateway,
  sendTestSms,
  formatSmsMessage,
  generateDebtorQueue,
  enqueueAttendanceSms,
  getProspectiveRecipients,
  getSmsQueue,
  getSmsLogs,
  processQueueBatch,
  retryQueueItem,
  retryAllFailedQueueItems,
  cancelQueueItem,
  normalizePhone,
  isDemoGateway,
  startSmsAutomationWorker,
  reconcileSmsDeliveryStatuses,
  calculateSmsLatencies,
  normalizeSmsStatus,
  SMS_STATUS,
};
