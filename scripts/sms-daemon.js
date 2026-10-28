/**
 * ==============================================================================
 * EDUCO LMS - 24/7 Autonomous SMS Reminder Daemon
 * ==============================================================================
 * This script runs autonomously in the background on any server (VPS, PM2, Docker, or Cloud VM).
 * It requires NO open browser.
 *
 * HOW TO RUN:
 *   node scripts/sms-daemon.js
 * OR with PM2 for 24/7 auto-restart:
 *   pm2 start scripts/sms-daemon.js --name "educo-sms-daemon"
 * ==============================================================================
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Safely load .env file without requiring external dotenv package
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const line of envContent.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
} catch (e) {}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('[SMS Daemon] Xatolik: VITE_SUPABASE_URL yoki SUPABASE_SERVICE_ROLE_KEY .env faylda topilmadi.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log('[SMS Daemon] EDUCO Avtomatlashtirilgan SMS Gateway xizmati ishga tushdi...');
console.log(`[SMS Daemon] Supabase URL: ${SUPABASE_URL}`);

let lastRunDate = null;

async function checkAndRunScheduledQueue() {
  try {
    const { data: settings, error } = await supabase
      .from('sms_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error || !settings) {
      return;
    }

    if (!settings.is_enabled) {
      return; // System disabled by Owner
    }

    const now = new Date();
    // Use Tashkent Time (UTC+5)
    const tashkentTime = new Date(now.getTime() + (5 * 60 + now.getTimezoneOffset()) * 60000);
    const currentDay = tashkentTime.getDate();
    const currentHour = String(tashkentTime.getHours()).padStart(2, '0');
    const currentMinute = String(tashkentTime.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHour}:${currentMinute}`;
    const todayStr = tashkentTime.toISOString().split('T')[0];

    const scheduledDays = Array.isArray(settings.schedule_days) ? settings.schedule_days : [1, 5, 10, 15, 20, 25];
    const targetTime = settings.schedule_time || '10:00';

    // Check if today is a scheduled day and current time matches, and hasn't run today
    if (scheduledDays.includes(currentDay) && currentTimeStr === targetTime && lastRunDate !== todayStr) {
      console.log(`[SMS Daemon] Rejalashtirilgan vaqt yetib keldi (${todayStr} ${currentTimeStr}). Qarzdorliklar tekshirilmoqda...`);
      lastRunDate = todayStr;
      await populateQueueFromDebtors(settings);
    }
  } catch (err) {
    console.error('[SMS Daemon] checkAndRunScheduledQueue xatosi:', err.message);
  }
}

async function populateQueueFromDebtors(settings) {
  try {
    // 1. Get all courses with monthly fee
    const { data: courses } = await supabase.from('courses').select('id, name, monthly_fee');
    const courseMap = (courses || []).reduce((acc, c) => ({ ...acc, [c.id]: c }), {});

    // 2. Get active students with parent contacts
    const { data: students } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, phone, father_phone, mother_phone, is_active')
      .eq('is_active', true);

    if (!students || students.length === 0) return;

    // 3. Get tuition payment sums per student
    const { data: payments } = await supabase.from('payment_records').select('student_id, amount, status').eq('status', 'completed');
    const paymentMap = (payments || []).reduce((acc, p) => {
      acc[p.student_id] = (acc[p.student_id] || 0) + Number(p.amount || 0);
      return acc;
    }, {});

    // 4. Get student group enrollments
    const { data: memberships } = await supabase.from('group_memberships').select('student_id, group_id, groups(name, course_id)').eq('is_active', true);
    const membershipMap = (memberships || []).reduce((acc, m) => {
      acc[m.student_id] = m;
      return acc;
    }, {});

    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    let queued = 0;

    for (const st of students) {
      const membership = membershipMap[st.id];
      const courseId = membership?.groups?.course_id;
      const course = courseMap[courseId];
      const monthlyFee = Number(course?.monthly_fee || 1200000);
      const totalPaid = Number(paymentMap[st.id] || 0);
      const balance = monthlyFee - totalPaid;

      if (balance > 0) {
        // Has debt
        const father = st.father_phone;
        const mother = st.mother_phone;
        const student = st.phone;

        let targetPhone = '';
        let recipientType = 'parent';
        if (settings.target_recipient === 'father_first') {
          targetPhone = father || mother || student;
          recipientType = father ? 'father' : mother ? 'mother' : 'student';
        } else if (settings.target_recipient === 'mother_first') {
          targetPhone = mother || father || student;
          recipientType = mother ? 'mother' : father ? 'father' : 'student';
        } else {
          targetPhone = student || father || mother;
          recipientType = 'student';
        }

        if (!targetPhone) continue;

        const idempotencyKey = `sms-bill-${st.id}-${currentPeriod}`;
        const template = settings.message_template || 'Hurmatli ota-ona! {student_name}ning to‘lov muddati yetib keldi. EDUCO';
        const fullName = `${st.first_name} ${st.last_name}`.trim();
        const courseName = course?.name || 'Kurs';
        const formattedAmount = new Intl.NumberFormat('uz-UZ').format(balance) + " so'm";

        const messageText = template
          .replace(/{student_name}/g, fullName)
          .replace(/{parent_name}/g, recipientType === 'father' ? 'Hurmatli ota' : recipientType === 'mother' ? 'Hurmatli ona' : 'Hurmatli ota-ona')
          .replace(/{course_name}/g, courseName)
          .replace(/{amount}/g, formattedAmount)
          .replace(/{due_date}/g, now.toLocaleDateString('uz-UZ'));

        const { error: insertErr } = await supabase.from('sms_queue').insert([
          {
            student_id: st.id,
            recipient_phone: targetPhone,
            recipient_name: `${fullName} (${recipientType})`,
            recipient_type: recipientType,
            message_text: messageText,
            amount_due: balance,
            course_name: courseName,
            status: 'pending',
            billing_period: currentPeriod,
            idempotency_key: idempotencyKey,
            max_attempts: settings.max_retries || 3,
          },
        ]);

        if (!insertErr) queued++;
      }
    }

    console.log(`[SMS Daemon] Qarzdorlar tahlil qilindi: ${queued} ta yangi SMS navbatga qo‘shildi.`);
  } catch (err) {
    console.error('[SMS Daemon] populateQueueFromDebtors xatosi:', err.message);
  }
}

async function processPendingQueue() {
  try {
    const { data: queueItems } = await supabase
      .from('sms_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10);

    if (!queueItems || queueItems.length === 0) return;

    // Fetch primary and backup devices
    const { data: devices } = await supabase.from('sms_devices').select('*').eq('is_active', true);
    if (!devices || devices.length === 0) return;

    const primaryDevice = devices.find((d) => d.device_role === 'primary');
    const backupDevice = devices.find((d) => d.device_role === 'backup');

    for (const item of queueItems) {
      console.log(`[SMS Daemon] SMS yuborilmoqda: ${item.recipient_phone} (${item.recipient_name})`);
      let delivered = false;
      let activeDevice = primaryDevice;
      let lastError = null;

      // Mark processing
      await supabase.from('sms_queue').update({ status: 'processing', last_attempt_at: new Date().toISOString() }).eq('id', item.id);

      // Try Primary
      if (activeDevice) {
        try {
          await sendViaGatewayHttp(activeDevice, item.recipient_phone, item.message_text);
          delivered = true;
        } catch (err) {
          lastError = `Primary error: ${err.message}`;
          console.warn(`[SMS Daemon] Primary qurilma xatolik berdi, zaxiraga o'tilmoqda...`, err.message);
        }
      }

      // Try Backup if Primary failed
      if (!delivered && backupDevice) {
        activeDevice = backupDevice;
        try {
          await sendViaGatewayHttp(backupDevice, item.recipient_phone, item.message_text);
          delivered = true;
          lastError = null;
        } catch (err) {
          lastError = `${lastError || ''} | Backup error: ${err.message}`;
          console.error(`[SMS Daemon] Zaxira qurilma ham xatolik berdi:`, err.message);
        }
      }

      if (delivered) {
        await supabase.from('sms_queue').update({
          status: 'sent',
          device_id: activeDevice.id,
          sent_at: new Date().toISOString(),
          error_message: null,
        }).eq('id', item.id);

        await supabase.from('sms_logs').insert([{
          queue_id: item.id,
          device_id: activeDevice.id,
          recipient_phone: item.recipient_phone,
          status: 'sent',
          response_payload: { delivered_via: activeDevice.name, role: activeDevice.device_role },
        }]);
        console.log(`[SMS Daemon] ✅ Muvaffaqiyatli yuborildi: ${item.recipient_phone} (${activeDevice.name})`);
      } else {
        const attempts = (item.attempts || 0) + 1;
        const willRetry = attempts < (item.max_attempts || 3);
        await supabase.from('sms_queue').update({
          status: willRetry ? 'pending' : 'failed',
          attempts,
          error_message: lastError,
          last_attempt_at: new Date().toISOString(),
        }).eq('id', item.id);

        await supabase.from('sms_logs').insert([{
          queue_id: item.id,
          device_id: activeDevice?.id || null,
          recipient_phone: item.recipient_phone,
          status: 'failed',
          error_details: lastError,
        }]);
        console.error(`[SMS Daemon] ❌ Yuborish muvaffaqiyatsiz bo'ldi: ${item.recipient_phone}`);
      }

      // 4-second delay between sends to protect SIM card
      await new Promise((res) => setTimeout(res, 4000));
    }
  } catch (err) {
    console.error('[SMS Daemon] processPendingQueue xatosi:', err.message);
  }
}

async function sendViaGatewayHttp(device, phone, text) {
  let url = device.gateway_url.trim();
  if (!/\/(message|messages|send|v1)/i.test(url)) {
    url = `${url.replace(/\/+$/, '')}/message`;
  }

  const headers = { 'Content-Type': 'application/json' };
  if (device.api_token) {
    const token = device.api_token.trim();
    if (token.includes(':')) {
      try {
        headers['Authorization'] = `Basic ${Buffer.from(token).toString('base64')}`;
      } catch (_) {
        headers['Authorization'] = `Basic ${token}`;
      }
    } else {
      headers['Authorization'] = `Bearer ${token}`;
      headers['X-Api-Key'] = token;
    }
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      phoneNumbers: [phone],
      simNumber: 1,
      to: phone,
      phone: phone,
      message: text,
      text: text,
      sim: 1,
    }),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  return true;
}

// Check every 30 seconds
setInterval(async () => {
  await checkAndRunScheduledQueue();
  await processPendingQueue();
}, 30000);

// Initial immediate run
checkAndRunScheduledQueue();
processPendingQueue();
