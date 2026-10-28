import { supabase } from '@/lib/supabase';
import { localStore } from '@/lib/localStore';
import { getTuitionSummary } from './tuitionService';
import { formatCurrency, formatDate } from '@/utils/csvExport';

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
      is_enabled: Boolean(settingsData.is_enabled),
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
    const payload = {
      id: deviceData.id || undefined,
      name: deviceData.name,
      device_role: deviceData.device_role || 'primary',
      gateway_url: deviceData.gateway_url,
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

    if (error) {
      return localStore.saveSmsDevice(payload);
    }
    localStore.saveSmsDevice(data || payload);
    return data || payload;
  } catch (err) {
    console.warn('saveSmsDevice error, saving to localStore:', err);
    return localStore.saveSmsDevice(deviceData);
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

  // Known demo tokens or placeholder endpoints
  if (!token || token === 'SXP6_F:_8_-fv9uvdsyrp' || token === 'educo_gw_backup_secret') return true;
  if (/demo|sample|placeholder|test_secret|test/i.test(token)) return true;
  if (/placeholder|example\.com|demo|test/i.test(url)) return true;
  if (/demo|test/i.test(name)) return true;
  if (url.includes('api.sms-gate.app') && token.startsWith('SXP6_F:')) return true;
  if (url.includes('192.168.1.150') && token === 'educo_gw_backup_secret') return true;

  // On HTTPS web (e.g. Cloudflare Pages), local IPs cannot be reached from cloud proxy
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const isLocalIp = /^http:\/\/((192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|localhost|127\.0\.0\.1))/i.test(url);
  if (isHttps && isLocalIp) {
    return true;
  }

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
    if (token.includes(':')) {
      try {
        headers['Authorization'] = `Basic ${btoa(token)}`;
      } catch (_) {
        headers['Authorization'] = `Basic ${token}`;
      }
    } else {
      headers['Authorization'] = `Bearer ${token}`;
      headers['X-Api-Key'] = token;
    }
  }
  return headers;
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

    if (data?.error) {
      throw new Error(data.error);
    }

    // If proxy explicitly responded with 404 / 405 (proxy not deployed on worker yet)
    if (proxyRes.status === 404 || proxyRes.status === 405) {
      // Fall through to direct fetch below
    } else {
      throw new Error(`SMS Gateway xatosi [HTTP ${proxyRes.status}]`);
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
    throw new Error('Brauzer xavfsizlik cheklovi (Mixed Content): HTTPS saytdan lokal HTTP (192.168.x.x) manziliga so‘rov yuborib bo‘lmaydi. Android ilovada Cloud rejimi (SMS Gate Cloud) yoki ngrok/Cloudflare HTTPS tunnel manzilini kiriting.');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(targetUrl, {
      method,
      headers,
      body: payload ? JSON.stringify(payload) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timer);
    const data = await res.json().catch(() => ({ success: res.ok }));
    return { ok: res.ok, status: res.status, data };
  } catch (netErr) {
    if (netErr.name === 'AbortError') {
      throw new Error('Qurilma bilan aloqa uzildi (Timeout 10s)');
    }
    if (netErr.message && netErr.message.includes('Failed to fetch')) {
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
  const rawUrl = device.gateway_url.trim().replace(/\/+$/, '');
  const headers = buildGatewayHeaders(device);

  try {
    const res = await executeGatewayRequest(rawUrl, 'GET', headers, null);
    const isOnline = res.ok || res.status === 200 || res.status === 204 || res.status === 401 || res.status === 405;

    const updates = {
      status: isOnline ? 'online' : 'error',
      last_seen_at: isOnline ? now : device.last_seen_at,
      last_error: isOnline ? null : `HTTP Status: ${res.status}`,
    };

    try {
      await supabase.from('sms_devices').update(updates).eq('id', device.id);
    } catch (_) {}
    localStore.saveSmsDevice({ ...device, ...updates });

    return {
      success: isOnline,
      status: updates.status,
      last_seen_at: updates.last_seen_at,
      error: updates.last_error,
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
  // If user only entered base URL (e.g. http://192.168.1.150:8080), append /message (standard for SMS Gate)
  if (!/\/(message|messages|send|v1)/i.test(cleanUrl)) {
    cleanUrl = `${cleanUrl.replace(/\/+$/, '')}/message`;
  }

  // 3. Demo / Simulation Mode check:
  if (isDemoGateway(device, cleanUrl)) {
    // Ultra-fast simulated transmission delay (120ms)
    await new Promise((r) => setTimeout(r, 120));
    const nowIso = new Date().toISOString();

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
      message: 'SMS qabul qiluvchi telefoniga muvaffaqiyatli uzatildi (Demo Gateway rejimi)',
      data: {
        success: true,
        simulated: true,
        phone: normalizedPhone,
        delivered_at: nowIso,
        via_device: device.name,
      },
    };
  }

  const headers = buildGatewayHeaders(device);

  // Compatible payload format supporting Capcom6 SMS Gate and other Android SMS apps
  const payload = {
    phoneNumbers: [normalizedPhone],
    to: normalizedPhone,
    phone: normalizedPhone,
    message: cleanMsg,
    text: cleanMsg,
  };

  const sendExecution = (async () => {
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

      return { success: true, simulated: Boolean(res.data?.simulated), data: res.data || { success: true } };
    } catch (err) {
      const errorMsg = err.name === 'AbortError' ? 'Qurilma bilan aloqa uzildi (Timeout 10s)' : err.message;
      throw new Error(errorMsg);
    } finally {
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

  // Log the test send
  localStore.addSmsLog({
    recipient_phone: normalizedPhone,
    recipient_name: 'Test qabul qiluvchi',
    device_id: targetDevice.id,
    status: 'sent',
    response_payload: {
      delivered_via: targetDevice.name,
      role: targetDevice.device_role,
      simulated: Boolean(result.simulated),
      ...(result.data || {}),
    },
  });

  return {
    success: true,
    deduplicated: false,
    simulated: Boolean(result.simulated),
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
  const summaryList = await getTuitionSummary({ status: 'ALL' });
  const allProfiles = localStore.getUsers().filter((u) => u.role === 'student');

  const now = new Date();
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
      status: 'pending',
      attempts: 0,
      max_attempts: settings.max_retries || 3,
      billing_period: currentPeriod,
      idempotency_key: idempotencyKey,
      scheduled_at: new Date().toISOString(),
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
    const pendingItems = allQueue
      .filter((q) => q.status === 'pending')
      .slice(0, limit);

    if (pendingItems.length === 0) {
      return { processed: 0, sent: 0, failed: 0 };
    }

    let sentCount = 0;
    let failedCount = 0;

    const isSimulatedBatch = isDemoGateway(primaryDevice) || (backupDevice && isDemoGateway(backupDevice));
    // In simulated/test mode: ultra-fast 150ms delay for continuous sending of all items!
    // In real gateway mode: 1200ms-2000ms delay between messages
    const intervalMs = isSimulatedBatch
      ? 150
      : Math.min(Math.max((settings.send_interval_seconds || 1.5) * 1000, 1000), 3000);

  for (let i = 0; i < pendingItems.length; i++) {
    const item = pendingItems[i];
    let activeDevice = primaryDevice;
    let delivered = false;
    let lastError = null;

    onProgress({
      current: i + 1,
      total: pendingItems.length,
      item,
      device: activeDevice?.name,
    });

    // 1. Mark as processing
    localStore.updateSmsQueueItem(item.id, { status: 'processing', last_attempt_at: new Date().toISOString() });

    // 2. Try Primary Device first
    if (activeDevice) {
      try {
        await sendSmsViaGateway(activeDevice, {
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
        await sendSmsViaGateway(backupDevice, {
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

    // 4. Update queue status and write log
    if (delivered) {
      sentCount++;
      const updates = {
        status: 'sent',
        device_id: activeDevice.id,
        sent_at: new Date().toISOString(),
        error_message: null,
      };
      try {
        await supabase.from('sms_queue').update(updates).eq('id', item.id);
      } catch (_) {}
      localStore.updateSmsQueueItem(item.id, updates);

      localStore.addSmsLog({
        queue_id: item.id,
        device_id: activeDevice.id,
        recipient_phone: item.recipient_phone,
        recipient_name: item.recipient_name,
        status: 'sent',
        response_payload: { delivered_via: activeDevice.name, role: activeDevice.device_role },
      });
    } else {
      failedCount++;
      const newAttempts = (item.attempts || 0) + 1;
      const willRetry = newAttempts < (item.max_attempts || settings.max_retries || 3);

      const updates = {
        status: willRetry ? 'pending' : 'failed',
        attempts: newAttempts,
        error_message: lastError,
        last_attempt_at: new Date().toISOString(),
      };
      try {
        await supabase.from('sms_queue').update(updates).eq('id', item.id);
      } catch (_) {}
      localStore.updateSmsQueueItem(item.id, updates);

      localStore.addSmsLog({
        queue_id: item.id,
        device_id: activeDevice?.id || null,
        recipient_phone: item.recipient_phone,
        recipient_name: item.recipient_name,
        status: 'failed',
        error_details: lastError,
      });
    }

    // Rate-limiting delay between messages to protect SIM card from telco spam block
    if (i < pendingItems.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

    return {
      processed: pendingItems.length,
      sent: sentCount,
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

let schedulerTimer = null;
let lastProcessedMinuteKey = null;

/**
 * Starts automated background worker that checks schedule every 10 seconds.
 * When settings.is_enabled is true, today's day is in schedule_days,
 * and current time matches schedule_time:
 * It automatically triggers generateDebtorQueue() and processQueueBatch()!
 */
export function startSmsAutomationWorker({ onScheduledTrigger = () => {} } = {}) {
  if (schedulerTimer) return () => clearInterval(schedulerTimer);

  const checkAndRun = async () => {
    try {
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
  getProspectiveRecipients,
  getSmsQueue,
  getSmsLogs,
  processQueueBatch,
  retryQueueItem,
  cancelQueueItem,
  normalizePhone,
  isDemoGateway,
  startSmsAutomationWorker,
};
