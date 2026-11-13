// Telegram -> SMS bot & EDUCO LMS SMS Gateway Integratori
// Node.js 18+ talab qilinadi. Tashqi kutubxonasiz (native fetch) ishlaydi.
// Ishga tushirish: node bot.js (yoki "npm run dev" orqali avtomatik)

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ====== ASOSIY SOZLAMALAR ======
const BOT_TOKEN = process.env.BOT_TOKEN || '6939455511:AAF3lg3N6FdScstAgBC0zxvyvFELFoBYUJI';
const ADMIN_IDS = (process.env.ADMIN_IDS || '1594150529').split(',').map((s) => s.trim()).filter(Boolean);
const SMS_USER = process.env.SMS_USER || 'EMTIDA';
const SMS_PASS = process.env.SMS_PASS || '3x7k46xkpavev_';
const SMS_API = 'https://api.sms-gate.app/3rdparty/v1';
const DB_PATH = path.resolve(__dirname, '.data', 'db.json');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const auth = 'Basic ' + Buffer.from(`${SMS_USER}:${SMS_PASS}`).toString('base64');
const TG = `https://api.telegram.org/bot${BOT_TOKEN}`;

// --- DB YORDAMCHI FUNKSIYALARI ---
function getDb() {
  try {
    if (fs.existsSync(DB_PATH)) {
      return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    }
  } catch (e) {
    console.error('[DB Read Error]', e.message);
  }
  return {};
}

function saveDb(db) {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    db._sync_version = (db._sync_version || 0) + 1;
    db._updated_at = Date.now();
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
  } catch (e) {
    console.error('[DB Save Error]', e.message);
  }
}

// --- TELEGRAM API WRAPPER ---
async function tg(method, body) {
  try {
    const r = await fetch(`${TG}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return await r.json();
  } catch (e) {
    console.error(`[Telegram API Error: ${method}]`, e.message);
    return { ok: false, error: e.message };
  }
}

async function notifyAdmins(text, parseMode = 'HTML') {
  for (const adminId of ADMIN_IDS) {
    await tg('sendMessage', {
      chat_id: adminId,
      text,
      parse_mode: parseMode,
    });
  }
}

// --- TELEFONDAGI SMS GATEWAY (API) ---
async function smsApi(method, pathStr, body) {
  const r = await fetch(SMS_API + pathStr, {
    method,
    headers: { Authorization: auth, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    if (r.status === 401) throw new Error('SMS Gateway Username yoki Password noto‘g‘ri');
    throw new Error(j.message || `HTTP ${r.status}`);
  }
  return j;
}

const sendSms = (phone, text) =>
  smsApi('POST', '/messages', {
    textMessage: { text },
    phoneNumbers: ['+' + phone.replace(/^\+/, '')],
  });

// Telefon haqiqatan yuborganligini tekshirish (30 soniyagacha)
async function waitStatus(id) {
  for (let i = 0; i < 15; i++) {
    await sleep(2000);
    try {
      const s = await smsApi('GET', `/messages/${id}`);
      if (['Sent', 'Delivered', 'Failed'].includes(s?.state)) return s;
    } catch (_) {
      return null;
    }
  }
  return null;
}

// --- MATNNI PARSE QILISH ---
function parsePhoneAndText(raw) {
  const re = /\s*(\S+)/y;
  let digits = '';
  let end = 0;
  let m;
  while ((m = re.exec(raw))) {
    if (!/^[+\d()\-]+$/.test(m[1])) break;
    digits += m[1].replace(/\D/g, '');
    end = re.lastIndex;
    if (digits.startsWith('998') ? digits.length >= 12 : digits.length >= 9) break;
  }
  if (digits.length === 9) digits = '998' + digits;
  if (!/^998\d{9}$/.test(digits)) {
    return { error: 'Telefon raqam noto‘g‘ri. Misol: +998935821774 Salom' };
  }
  const text = raw.slice(end).trim();
  if (!text) return { error: 'Matn yozilmagan. Misol: +998935821774 Salom' };
  return { phone: digits, text };
}

// ==============================================================================
// 1. KETMA-KET (SEQUENTIAL FIFO) SMS NAVBAT TIZIMI
// Talab: 1-nomeri boradi va u yuborilishi bilan 2-si boradi.
// Bitta yuborildimi, toki ketmaguncha keyingisiga o'tmaydi va SMS ketmay qolmaydi!
// ==============================================================================
let isQueueProcessing = false;

async function processSequentialQueue() {
  if (isQueueProcessing) return;
  isQueueProcessing = true;

  try {
    const db = getDb();
    const queue = db.educo_db_sms_queue || [];
    const pendingItems = queue.filter((q) => q.status === 'pending');

    if (pendingItems.length === 0) {
      isQueueProcessing = false;
      return;
    }

    // Navbatdagi eng birinchi element (FIFO)
    const currentItem = pendingItems[0];
    const totalPending = pendingItems.length;

    // Telefon raqamni tozalash
    let cleanPhone = (currentItem.recipient_phone || '').replace(/\D/g, '');
    if (cleanPhone.length === 9) cleanPhone = '998' + cleanPhone;

    if (!/^998\d{9}$/.test(cleanPhone)) {
      currentItem.status = 'failed';
      currentItem.error_message = 'Telefon raqam formati noto‘g‘ri';
      saveDb(db);
      isQueueProcessing = false;
      return;
    }

    const messageText = currentItem.message_text || '';
    const recipientName = currentItem.recipient_name || 'Hurmatli foydalanuvchi';
    const tag = currentItem.course_name ? `📚 ${currentItem.course_name}` : '📌 Bildirishnoma';

    // 1. Holatni "processing" ga o'tkazish
    currentItem.status = 'processing';
    currentItem.last_attempt_at = new Date().toISOString();
    saveDb(db);

    console.log(`\n[SMS Navbat] ⏳ [1/${totalPending}] Yuborilmoqda: +${cleanPhone} (${recipientName})`);

    // Telegram adminga xabar berish
    const tgAlertMsg =
      `📤 <b>SMS Navbatdan yuborilmoqda (Qoldi: ${totalPending} ta):</b>\n\n` +
      `👤 <b>Qabul qiluvchi:</b> ${recipientName}\n` +
      `📱 <b>Telefon:</b> +${cleanPhone}\n` +
      `🏷 <b>Turi:</b> ${tag}\n` +
      `💬 <b>Xabar:</b> <i>"${messageText}"</i>\n\n` +
      `⏳ <i>Telefonga uzatildi, natija kutilmoqda...</i>`;

    const adminNote = await tg('sendMessage', {
      chat_id: ADMIN_IDS[0] || '1594150529',
      text: tgAlertMsg,
      parse_mode: 'HTML',
    });

    // 2. Telefondagi SMS Gateway ilovasiga yuborish
    let job = null;
    let sendError = null;
    try {
      job = await sendSms(cleanPhone, messageText);
    } catch (err) {
      sendError = err.message;
    }

    if (!job || !job.id) {
      // Yuborishda xatolik bo'ldi
      currentItem.attempts = (currentItem.attempts || 0) + 1;
      const maxRetries = currentItem.max_attempts || 3;
      currentItem.status = currentItem.attempts >= maxRetries ? 'failed' : 'pending';
      currentItem.error_message = sendError || 'SMS Gateway uzatmadi';
      saveDb(db);

      console.error(`[SMS Navbat] ❌ Xatolik (+${cleanPhone}): ${currentItem.error_message}`);
      if (adminNote?.result?.message_id) {
        await tg('editMessageText', {
          chat_id: ADMIN_IDS[0] || '1594150529',
          message_id: adminNote.result.message_id,
          text: `❌ <b>Xatolik yuz berdi:</b>\n📱 +${cleanPhone} (${recipientName})\n⚠️ Sabab: ${currentItem.error_message}\n\nQayta urinish: ${currentItem.attempts}/${maxRetries}`,
          parse_mode: 'HTML',
        });
      }

      await sleep(2000);
      isQueueProcessing = false;
      return;
    }

    // 3. Telefon haqiqatan yuborganligini va yetkazilganligini kutish
    const statusResult = await waitStatus(job.id);
    const nowIso = new Date().toISOString();

    if (statusResult && (statusResult.state === 'Delivered' || statusResult.state === 'Sent')) {
      // MUVAFFAQIYATLI KETDI!
      currentItem.status = 'sent';
      currentItem.sent_at = nowIso;
      currentItem.delivered_at = statusResult.state === 'Delivered' ? nowIso : null;
      currentItem.tracking_id = job.id;
      currentItem.error_message = null;

      // Log saqlash
      db.educo_db_sms_logs = db.educo_db_sms_logs || [];
      db.educo_db_sms_logs.unshift({
        id: `log-${Date.now()}`,
        queue_id: currentItem.id,
        recipient_phone: `+${cleanPhone}`,
        recipient_name: recipientName,
        message_text: messageText,
        status: 'sent',
        tracking_id: job.id,
        sent_at: nowIso,
      });

      saveDb(db);
      console.log(`[SMS Navbat] ✅ Yuborildi va tasdiqlandi: +${cleanPhone}`);

      if (adminNote?.result?.message_id) {
        await tg('editMessageText', {
          chat_id: ADMIN_IDS[0] || '1594150529',
          message_id: adminNote.result.message_id,
          text:
            `✅ <b>SMS Muvaffaqiyatli Yetkazildi!</b>\n\n` +
            `👤 <b>Qabul qiluvchi:</b> ${recipientName}\n` +
            `📱 <b>Telefon:</b> +${cleanPhone}\n` +
            `💬 <b>Xabar:</b> <i>"${messageText}"</i>\n` +
            `🕒 <b>Vaqt:</b> ${new Date().toLocaleTimeString('uz-UZ')}\n` +
            `📶 <b>Holat:</b> ${statusResult.state === 'Delivered' ? 'Yetkazildi (Delivered)' : 'Yuborildi (Sent)'}`,
          parse_mode: 'HTML',
        });
      }

      // Xavfsiz oraliq: SIM-karta bloklanmasligi uchun 3 soniya tanaffus
      await sleep(3000);
    } else {
      // Telefon holat bermadi yoki Failed
      const isFailed = statusResult?.state === 'Failed';
      currentItem.attempts = (currentItem.attempts || 0) + 1;
      const maxRetries = currentItem.max_attempts || 3;
      currentItem.status = currentItem.attempts >= maxRetries || isFailed ? 'failed' : 'pending';
      currentItem.error_message = isFailed
        ? (statusResult?.recipients?.[0]?.error || 'Telefonda jo‘natish rad etildi')
        : 'Telefondan 30 soniyada javob kelmadi';

      saveDb(db);
      console.warn(`[SMS Navbat] ⚠️ Holat: ${currentItem.error_message} (+${cleanPhone})`);

      if (adminNote?.result?.message_id) {
        await tg('editMessageText', {
          chat_id: ADMIN_IDS[0] || '1594150529',
          message_id: adminNote.result.message_id,
          text:
            `⚠️ <b>Kutilgan javob olinmadi:</b>\n` +
            `📱 +${cleanPhone} (${recipientName})\n` +
            `Sabab: ${currentItem.error_message}\n` +
            `Holati: ${currentItem.status === 'failed' ? '❌ Bekor qilindi' : '⏳ Qayta navbatga qo‘yildi'}`,
          parse_mode: 'HTML',
        });
      }

      await sleep(2500);
    }
  } catch (err) {
    console.error('[SMS Navbat Xatosi]', err.message);
  } finally {
    isQueueProcessing = false;
  }
}

// ==============================================================================
// 2. QARZDORLARNI AVTOMATIK TAHLIL QILISH VA NAVBATGA QO'YISH
// ==============================================================================
function populateDebtorsToQueue() {
  try {
    const db = getDb();
    const students = (db.educo_db_users || []).filter((u) => u.role === 'student' && u.is_active !== false);
    const groups = db.educo_db_groups || [];
    const payments = db.educo_db_payments || [];
    const settings = db.educo_db_sms_settings || {};
    const queue = db.educo_db_sms_queue || [];

    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    let addedCount = 0;

    for (const st of students) {
      const studentGroups = groups.filter((g) =>
        Array.isArray(g.student_ids) && g.student_ids.includes(st.id)
      );
      if (studentGroups.length === 0) continue;

      for (const grp of studentGroups) {
        const monthlyFee = Number(grp.monthly_fee || grp.price || 1200000);
        const studentPayments = payments
          .filter((p) => p.student_id === st.id && (p.group_id === grp.id || !p.group_id))
          .reduce((sum, p) => sum + Number(p.amount || 0), 0);

        const debt = monthlyFee - studentPayments;
        if (debt > 0) {
          const idempotencyKey = `sms-bill-${st.id}-${grp.id}-${currentPeriod}`;
          const exists = queue.some((q) => q.idempotency_key === idempotencyKey && q.status !== 'failed');
          if (exists) continue;

          let targetPhone = st.father_phone || st.mother_phone || st.phone;
          if (!targetPhone) continue;

          cleanPhone = targetPhone.replace(/\D/g, '');
          if (cleanPhone.length === 9) cleanPhone = '998' + cleanPhone;

          const sName = `${st.first_name || ''} ${st.last_name || ''}`.trim() || st.fullName || 'Talaba';
          const formattedDebt = new Intl.NumberFormat('uz-UZ').format(debt) + " so'm";
          const msg = `Hurmatli ota-ona! Farzandingiz ${sName}ning ${grp.name} kursi uchun ${formattedDebt} to‘lov muddati yetib keldi. Iltimos, to‘lovni amalga oshiring. EDUCO LMS`;

          queue.push({
            id: `sms-deb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            student_id: st.id,
            recipient_phone: '+' + cleanPhone,
            recipient_name: `${sName} (Qarzdorlik)`,
            recipient_type: 'debtor',
            message_text: msg,
            amount_due: debt,
            course_name: grp.name,
            status: 'pending',
            attempts: 0,
            max_attempts: 3,
            idempotency_key: idempotencyKey,
            billing_period: currentPeriod,
            created_at: new Date().toISOString(),
            queued_at: new Date().toISOString(),
          });
          addedCount++;
        }
      }
    }

    if (addedCount > 0) {
      db.educo_db_sms_queue = queue;
      saveDb(db);
    }
    return addedCount;
  } catch (e) {
    console.error('[Debtors Analysis Error]', e.message);
    return 0;
  }
}

// ==============================================================================
// 3. TELEGRAM BOT BUYRUQLARI VA XABAR ISHLOVCHISI
// ==============================================================================
const HELP_TEXT =
  `🤖 <b>EDUCO LMS SMS & Telegram Boti</b>\n\n` +
  `Ushbu bot LMS tizimidagi SMS xabarlarni (Davomat, Qarzdorlar, Eslatmalar) telefoningiz orqali ketma-ket yuborilishini boshqaradi.\n\n` +
  `<b>📋 Asosiy Buyruqlar:</b>\n` +
  `• <b>/status</b> — Navbat va SMS shlyuz holatini ko‘rish\n` +
  `• <b>/queue</b> — Navbatdagi kutilayotgan SMSlar ro‘yxati\n` +
  `• <b>/debtors</b> — Qarzdorlarni tekshirish va navbatga qo‘shish\n` +
  `• <b>/retry</b> — Xatolik tufayli to‘xtagan barcha SMSlarni qayta yuborish\n` +
  `• <b>/clear</b> — Yuborilgan eski xabarlarni tozalash\n` +
  `• <b>/id</b> — Sizning Telegram ID ingizni ko‘rish\n\n` +
  `<b>📲 To‘g‘ridan-to‘g‘ri SMS yuborish:</b>\n` +
  `<i>+998901234567 Salom, dars soat 14:00 da boshlanadi</i>`;

async function handleTelegramMessage(msg) {
  const chatId = msg.chat.id;
  const uid = String(msg.from.id);
  const text = (msg.text || '').trim();
  const reply = (t) => tg('sendMessage', { chat_id: chatId, text: t, parse_mode: 'HTML' });

  if (text === '/id') return reply(`Sizning Telegram ID: <code>${uid}</code>`);

  if (!ADMIN_IDS.includes(uid)) {
    return reply(`⛔ <b>Ruxsat yo‘q!</b>\nSizning ID: <code>${uid}</code>\nBot egasi ushbu ID ni sozlamalarga kiritishi kerak.`);
  }

  if (text.startsWith('/start') || text === '/help') {
    return reply(HELP_TEXT);
  }

  // 1. STATUS BUYRUG'I
  if (text === '/status') {
    const db = getDb();
    const queue = db.educo_db_sms_queue || [];
    const pendingCount = queue.filter((q) => q.status === 'pending').length;
    const processingCount = queue.filter((q) => q.status === 'processing').length;
    const sentToday = queue.filter((q) => {
      if (q.status !== 'sent' || !q.sent_at) return false;
      return new Date(q.sent_at).toDateString() === new Date().toDateString();
    }).length;
    const failedCount = queue.filter((q) => q.status === 'failed').length;

    return reply(
      `📊 <b>EDUCO LMS SMS Holati:</b>\n\n` +
      `📱 <b>Shlyuz:</b> 🟢 Faol (EMTIDA - +998 93 582 17 74)\n` +
      `⏳ <b>Navbatda kutilayotgan:</b> ${pendingCount} ta\n` +
      `🔄 <b>Hozir yuborilayotgan:</b> ${processingCount} ta\n` +
      `✅ <b>Bugun yuborilgan:</b> ${sentToday} ta\n` +
      `❌ <b>Xatolik bergan:</b> ${failedCount} ta\n\n` +
      `<i>SMSlar navbat bilan bittalab yuborilmoqda.</i>`
    );
  }

  // 2. QUEUE BUYRUG'I
  if (text === '/queue') {
    const db = getDb();
    const queue = db.educo_db_sms_queue || [];
    const pendingItems = queue.filter((q) => q.status === 'pending');

    if (pendingItems.length === 0) {
      return reply('✅ <b>Hozirda SMS navbati bo‘sh.</b> Barcha xabarlar yuborilgan!');
    }

    let report = `📋 <b>Navbatdagi SMSlar (${pendingItems.length} ta):</b>\n\n`;
    pendingItems.slice(0, 8).forEach((item, idx) => {
      report +=
        `<b>${idx + 1}.</b> ${item.recipient_name || 'Noma‘lum'}\n` +
        `📱 ${item.recipient_phone}\n` +
        `💬 <i>"${item.message_text.slice(0, 45)}..."</i>\n\n`;
    });

    if (pendingItems.length > 8) {
      report += `<i>...va yana ${pendingItems.length - 8} ta xabar kutmoqda.</i>`;
    }

    return reply(report);
  }

  // 3. DEBTORS BUYRUG'I
  if (text === '/debtors') {
    const added = populateDebtorsToQueue();
    if (added === 0) {
      return reply('✅ <b>Barcha qarzdorlar allaqachon navbatga qo‘yilgan yoki qarzdorlar yo‘q.</b>');
    }
    return reply(`🔔 <b>Qarzdorlar tahlili:</b> ${added} ta yangi SMS navbatga qo‘shildi va yuborilmoqda!`);
  }

  // 4. RETRY BUYRUG'I
  if (text === '/retry') {
    const db = getDb();
    const queue = db.educo_db_sms_queue || [];
    let count = 0;
    queue.forEach((item) => {
      if (item.status === 'failed') {
        item.status = 'pending';
        item.attempts = 0;
        count++;
      }
    });
    saveDb(db);
    return reply(`🔄 <b>${count} ta xatolik bergan SMS qayta navbatga qo‘yildi!</b>`);
  }

  // 5. TO'G'RIDAN-TO'G'RI SMS YUBORISH
  const p = parsePhoneAndText(text);
  if (p.error) {
    return reply(`❌ ${p.error}\n\nQo‘llanma uchun /help buyrug‘ini bosing.`);
  }

  const db = getDb();
  db.educo_db_sms_queue = db.educo_db_sms_queue || [];
  db.educo_db_sms_queue.push({
    id: `sms-manual-${Date.now()}`,
    recipient_phone: '+' + p.phone,
    recipient_name: 'Telegram orqali yozilgan',
    recipient_type: 'manual',
    message_text: p.text,
    status: 'pending',
    attempts: 0,
    max_attempts: 3,
    created_at: new Date().toISOString(),
    queued_at: new Date().toISOString(),
  });
  saveDb(db);

  return reply(
    `📥 <b>Xabar SMS navbatiga qo‘shildi!</b>\n` +
    `📱 <b>Raqam:</b> +${p.phone}\n` +
    `💬 <b>Matn:</b> "${p.text}"\n\n` +
    `<i>Ushbu xabar navbat tartibida telefonga uzatiladi.</i>`
  );
}

// ==============================================================================
// 4. ASOSIY ISHGA TUSHIRISH (MAIN)
// ==============================================================================
async function main() {
  console.log('====================================================');
  console.log('🚀 EDUCO LMS SMS & Telegram Bot xizmati ishga tushdi!');
  console.log(`📱 SMS Gateway: ${SMS_USER} (${SMS_API})`);
  console.log(`🤖 Telegram Bot: ${BOT_TOKEN.slice(0, 10)}...`);
  console.log('====================================================');

  // Adminga bot ishga tushgani haqida salom xabari
  notifyAdmins(
    `🚀 <b>EDUCO LMS SMS & Telegram Boti ishga tushdi!</b>\n\n` +
    `📱 <b>SMS Shlyuz:</b> 🟢 Faol (EMTIDA - +998 93 582 17 74)\n` +
    `🕒 <b>Vaqt:</b> ${new Date().toLocaleTimeString('uz-UZ')}\n` +
    `<i>Davomat va qarzdorlik SMSlari avtomatik bittalab yuboriladi.</i>`
  ).catch(() => {});

  // 1. KETMA-KET SMS NAVBATINI TEKSHIRIB TURISH (har 3 soniyada)
  setInterval(() => {
    processSequentialQueue().catch((e) => console.error('[Queue Interval Error]', e.message));
  }, 3000);

  // 2. KUNDALIK QARZDORLIKNI TEKSHIRISH (har 30 daqiqada)
  setInterval(() => {
    populateDebtorsToQueue();
  }, 30 * 60 * 1000);

  // Dastlabki navbat tekshiruvi
  processSequentialQueue();

  // 3. TELEGRAMDAN XABARLARNI OLISH (LONG POLLING)
  let offset = 0;
  while (true) {
    try {
      const res = await tg('getUpdates', { offset, timeout: 30, allowed_updates: ['message'] });
      if (!res.ok) {
        await sleep(3000);
        continue;
      }
      for (const u of res.result || []) {
        offset = u.update_id + 1;
        if (u.message && u.message.text) {
          handleTelegramMessage(u.message).catch((e) => console.error('[Handle Message Error]', e.message));
        }
      }
    } catch (e) {
      await sleep(3000);
    }
  }
}

main();
