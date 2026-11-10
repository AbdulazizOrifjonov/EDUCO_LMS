/**
 * ==============================================================================
 * EDUCO LMS - Rasmiy Ko'p Rolli Telegram Bot Servisi (@EducoLms_Bot)
 * ==============================================================================
 * Bot Token: 9049935207:AAG2b-t507eJCpf31RMDIm4gFpbUuhFOI7g
 * Rollar: Owner, Admin, Teacher, Student, Parent (Ota-ona)
 * Imkoniyatlar:
 *   - Telefon kontakt yoki login orqali avtomatik identifikatsiya
 *   - O'qituvchilar uchun Botning o'zida INTERAKTIV DAVOMAT (Barchani bor qilish,
 *     bittalab tekshirish, holatni tezkor o'zgartirish)
 *   - O'qituvchilar uchun Botda TEZKOR BAHOLASH (5, 4, 3, 2 ballar)
 *   - 20 daqiqa oldin avtomatik dars eslatmasi (Ustoz, O'quvchi va Ota-onaga)
 *   - Real-vaqtda davomat bildirishnomalari:
 *       * Talabaga: "Siz ... darsga qatnashdingiz / kech qoldingiz / qatnashmadingiz"
 *       * Ota-onaga: "Farzandingiz ... darsga qatnashdi / kech qoldi / qatnashmadi"
 *   - Ota-onalar uchun "💬 Sababnoma yuborish" (Darsga kela olmaslik sababi ustozga boradi)
 *   - Talabalar uchun "🔐 LMS Saytiga kirish" (Login-parol eslatmasi va havola)
 *   - Ko'p farzandli ota-onalar uchun bolani tanlash (Multi-Child Switcher)
 *   - Standart navigatsiya: "⬅️ Ortga" va "🏠 Bosh menyu"
 * ==============================================================================
 */

import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '9049935207:AAG2b-t507eJCpf31RMDIm4gFpbUuhFOI7g';
const DB_PATH = path.resolve(ROOT_DIR, '.data', 'db.json');
const SESSIONS_PATH = path.resolve(ROOT_DIR, '.data', 'bot_sessions.json');

// --- DATABASE & SESSION HELPERS ---
function getDb() {
  try {
    if (fs.existsSync(DB_PATH)) {
      return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    }
  } catch (e) {
    console.error('[Bot DB] Xatolik:', e.message);
  }
  return {};
}

function saveDb(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('[Bot DB Save] Xatolik:', e.message);
  }
}

function getSessions() {
  try {
    if (fs.existsSync(SESSIONS_PATH)) {
      return JSON.parse(fs.readFileSync(SESSIONS_PATH, 'utf8'));
    }
  } catch (e) {}
  return {};
}

function saveSessions(sessions) {
  try {
    const dir = path.dirname(SESSIONS_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SESSIONS_PATH, JSON.stringify(sessions, null, 2), 'utf8');
  } catch (e) {
    console.error('[Bot Sessions Save] Xatolik:', e.message);
  }
}

export function cleanPhone(phone) {
  if (!phone) return '';
  return String(phone).replace(/[^\d]/g, '');
}

// --- TELEGRAM API WRAPPER ---
function telegramRequest(method, payload = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${BOT_TOKEN}/${method}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
      timeout: 30000,
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve(json);
        } catch (e) {
          resolve({ ok: false, error: body });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Telegram API timeout'));
    });

    req.write(data);
    req.end();
  });
}

export async function sendMessage(chatId, text, extra = {}) {
  try {
    return await telegramRequest('sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      ...extra,
    });
  } catch (e) {
    console.error(`[Bot sendMessage] chatId: ${chatId} xatosi:`, e.message);
    return { ok: false, error: e.message };
  }
}

export async function editMessageText(chatId, messageId, text, extra = {}) {
  try {
    return await telegramRequest('editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'HTML',
      ...extra,
    });
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function answerCallbackQuery(callbackQueryId, text = '', showAlert = false) {
  try {
    return await telegramRequest('answerCallbackQuery', {
      callback_query_id: callbackQueryId,
      text,
      show_alert: showAlert,
    });
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// --- KEYBOARDS & NAVIGATION ---
const NAV_BUTTONS = ['⬅️ Ortga', '🏠 Bosh menyu'];

function makeKeyboard(rows, placeholder = 'Menyudan tanlang:') {
  return {
    reply_markup: {
      keyboard: rows.map((r) => (Array.isArray(r) ? r : [r])),
      resize_keyboard: true,
      one_time_keyboard: false,
      input_field_placeholder: placeholder,
    },
  };
}

const START_KEYBOARD = {
  reply_markup: {
    keyboard: [[{ text: '📱 Mening akkauntim (Kontakt ulashish)', request_contact: true }]],
    resize_keyboard: true,
    one_time_keyboard: true,
  },
};

const AUTH_PHONE_KEYBOARD = {
  reply_markup: {
    keyboard: [
      [{ text: '📱 Mening akkauntim (Kontakt ulashish)', request_contact: true }],
      ['❌ Bekor qilish'],
    ],
    resize_keyboard: true,
    one_time_keyboard: true,
  },
};

const CANCEL_AUTH_KEYBOARD = makeKeyboard([['❌ Bekor qilish']], 'Parolingizni kiriting:');

function getMainMenuKeyboard(session) {
  const role = session.role;
  if (role === 'owner') {
    return makeKeyboard([
      ['📊 Markaz monitoringi', '💰 Moliyaviy tahlil'],
      ['📝 Tezkor davomat', '🌟 Baholar'],
      ['👥 Guruhlar ro‘yxati', '📱 SMS Gate holati'],
      ['📢 Ommaviy e’lon (Broadcast)'],
      ['👤 Mening akkauntim', '🔄 Rolni almashtirish'],
    ]);
  }
  if (role === 'admin') {
    return makeKeyboard([
      ['👥 Guruhlar va O‘quvchilar', '📅 Bugungi darslar'],
      ['📝 Tezkor davomat', '📋 Bugungi davomat'],
      ['💳 Qarzdorlar ro‘yxati'],
      ['👤 Mening akkauntim', '🔄 Rolni almashtirish'],
    ]);
  }
  if (role === 'teacher') {
    return makeKeyboard([
      ['📝 Tezkor davomat', '🌟 Baholar'],
      ['📅 Haftalik dars jadvalim', '👥 Mening guruhlarim'],
      ['👤 Mening akkauntim', '🔄 Rolni almashtirish'],
    ]);
  }
  if (role === 'student') {
    return makeKeyboard([
      ['📊 Mening davomatim', '🌟 Mening baholarim'],
      ['📚 Uyga vazifalar', '💳 To‘lovlarim va Balans'],
      ['📅 Dars jadvalim', '🔐 LMS Saytiga kirish'],
      ['👤 Mening akkauntim', '🔄 Rolni almashtirish'],
    ]);
  }
  if (role === 'parent') {
    const rows = [
      ['📊 Farzandim davomati', '🌟 Farzandim baholari'],
      ['💳 To‘lov holati', '📅 Dars jadvali'],
      ['💬 Sababnoma yuborish', '📞 Markaz bilan bog‘lanish'],
      ['👤 Mening akkauntim', '🔄 Rolni almashtirish'],
    ];
    if (session.children && session.children.length > 1) {
      rows.unshift(['👶 Farzandni tanlash']);
    }
    return makeKeyboard(rows);
  }
  return START_KEYBOARD;
}

function getSubMenuKeyboard(options = []) {
  const rows = [];
  for (let i = 0; i < options.length; i += 2) {
    if (options[i + 1]) {
      rows.push([options[i], options[i + 1]]);
    } else {
      rows.push([options[i]]);
    }
  }
  rows.push(NAV_BUTTONS);
  return makeKeyboard(rows);
}

// --- USER RESOLUTION & LINKING ---
export function findUserByInput(input) {
  if (!input) return null;
  const db = getDb();
  const users = db.educo_db_users || [];
  const clean = cleanPhone(input);

  // 1. Match by phone digits (last 9 digits for UZ numbers)
  if (clean && clean.length >= 7) {
    const directUser = users.find((u) => {
      const uPhone = cleanPhone(u.phone);
      return uPhone && (uPhone === clean || uPhone.endsWith(clean.slice(-9)) || clean.endsWith(uPhone.slice(-9)));
    });
    if (directUser) return { user: directUser, role: directUser.role, type: 'user' };

    // Match as parent (check father_phone, mother_phone, parent_phone in students)
    const children = users.filter((u) => {
      if (u.role !== 'student') return false;
      const fPhone = cleanPhone(u.father_phone || u.fatherPhone);
      const mPhone = cleanPhone(u.mother_phone || u.motherPhone);
      const pPhone = cleanPhone(u.parent_phone || u.parentPhone);

      const matchP = (p) => p && (p === clean || p.endsWith(clean.slice(-9)) || clean.endsWith(p.slice(-9)));
      return matchP(fPhone) || matchP(mPhone) || matchP(pPhone);
    });

    if (children.length > 0) {
      return {
        children,
        role: 'parent',
        type: 'parent',
        activeChildId: children[0].id,
      };
    }
  }

  // 2. Match by username or email
  const lower = String(input).trim().toLowerCase();
  const userByLogin = users.find((u) => {
    return (u.username && u.username.toLowerCase() === lower) ||
           (u.email && u.email.toLowerCase() === lower);
  });
  if (userByLogin) {
    return { user: userByLogin, role: userByLogin.role, type: 'user' };
  }

  return null;
}

function getGroupStudents(groupId) {
  const db = getDb();
  const group = (db.educo_db_groups || []).find((g) => g.id === groupId);
  if (!group) return [];
  const users = db.educo_db_users || [];
  const studentIds = new Set(group.student_ids || []);

  const memberships = (db.educo_db_group_memberships || db.educo_db_memberships || []).filter(
    (m) => m.group_id === groupId && m.status !== 'inactive'
  );
  memberships.forEach((m) => studentIds.add(m.student_id || m.user_id));

  users.forEach((u) => {
    if (u.role === 'student' && u.is_active !== false) {
      if (u.group_id === groupId || (Array.isArray(u.group_ids) && u.group_ids.includes(groupId))) {
        studentIds.add(u.id);
      }
    }
  });

  return users.filter((u) => studentIds.has(u.id));
}

// --- TASHKENT TIME HELPER ---
function getTashkentNow() {
  const now = new Date();
  return new Date(now.getTime() + (5 * 60 + now.getTimezoneOffset()) * 60000);
}

function formatTashkentDate(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const UZ_MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
];

function formatUzDatePretty(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return `${year}-yil ${day}-${UZ_MONTHS[monthIdx] || ''}`;
}

function getGroupLessonTime(group) {
  if (group && group.schedule) {
    const parts = group.schedule.split(',');
    if (parts.length > 1 && parts[1].includes('-')) {
      return parts[1].trim();
    }
    if (group.schedule.includes('-')) {
      return group.schedule.trim();
    }
  }
  if (group && group.schedule_time) {
    return group.schedule_time.trim();
  }
  return '09:30 - 10:50';
}

function parseGroupScheduleText(group) {
  const text = `${group.schedule || ''} ${group.schedule_days || ''}`.toLowerCase();
  const days = [];
  if (text.includes('dush')) days.push(1);
  if (text.includes('sesh')) days.push(2);
  if (text.includes('chor')) days.push(3);
  if (text.includes('pay')) days.push(4);
  if (text.includes('jum')) days.push(5);
  if (text.includes('shan')) days.push(6);
  if (text.includes('yak')) days.push(7);
  if (text.includes('har kun')) return { days: [1, 2, 3, 4, 5, 6, 7], startTime: group.start_time, endTime: group.end_time };

  const timeMatch = `${group.schedule || ''} ${group.schedule_time || ''}`.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
  let startTime = group.start_time;
  let endTime = group.end_time;
  if (timeMatch) {
    if (!startTime) startTime = `${timeMatch[1]}:00`;
    if (!endTime) endTime = `${timeMatch[2]}:00`;
  }
  return { days, startTime, endTime };
}

function getGroupLessonDaysSummary(group) {
  if (group && group.schedule) {
    const parts = group.schedule.split(',');
    if (parts.length > 0 && parts[0].trim()) {
      return parts[0].trim();
    }
  }
  if (group && group.schedule_days) {
    return group.schedule_days.trim();
  }
  return 'Dars kunlari';
}

// Dars boshlanganlik holatini tekshirish (Davomat va baholash faqat dars boshlangach ishlaydi)
function checkGroupLessonStatus(group, db, session = {}, forceBypass = false) {
  if (forceBypass) {
    return { canProceed: true, isBypassed: true };
  }

  const now = getTashkentNow();
  let currentDayOfWeek = now.getDay();
  if (currentDayOfWeek === 0) currentDayOfWeek = 7; // 1 = Dushanba, ..., 7 = Yakshanba
  const todayStr = formatTashkentDate(now);

  // Agar bugun ushbu guruh uchun davomat yoki baho qo'yilgan bo'lsa, dars allaqachon boshlangan va tahrirlash mumkin
  const hasTodayAttendance = (db.educo_db_attendance || []).some(
    (a) => a.group_id === group.id && a.date === todayStr
  );
  const hasTodayGrades = (db.educo_db_grades || []).some(
    (g) => g.group_id === group.id && (g.date === todayStr || (g.created_at && g.created_at.startsWith(todayStr)))
  );

  if (hasTodayAttendance || hasTodayGrades) {
    return { canProceed: true, alreadyStartedToday: true };
  }

  const dayNamesUz = {
    1: 'Dushanba',
    2: 'Seshanba',
    3: 'Chorshanba',
    4: 'Payshanba',
    5: 'Juma',
    6: 'Shanba',
    7: 'Yakshanba',
  };

  const schedules = (db.educo_db_lesson_schedules || []).filter((s) => s.group_id === group.id);
  const todaySchedule = schedules.find((s) => s.day_of_week === currentDayOfWeek);

  let isLessonDay = false;
  let startTimeStr = null;
  let endTimeStr = null;
  let room = group.room || 'Xona';

  if (todaySchedule && todaySchedule.start_time) {
    isLessonDay = true;
    startTimeStr = todaySchedule.start_time;
    endTimeStr = todaySchedule.end_time;
    if (todaySchedule.room) room = todaySchedule.room;
  } else if (schedules.length > 0) {
    isLessonDay = false;
  } else {
    const parsed = parseGroupScheduleText(group);
    if (parsed.days.includes(currentDayOfWeek)) {
      isLessonDay = true;
      startTimeStr = parsed.startTime || group.start_time || '09:30:00';
      endTimeStr = parsed.endTime || group.end_time || '11:00:00';
    }
  }

  if (!isLessonDay) {
    let allDays = schedules.map((s) => s.day_of_week);
    if (allDays.length === 0) {
      allDays = parseGroupScheduleText(group).days;
    }
    const uniqueDays = [...new Set(allDays)].sort();
    const scheduledDaysText = uniqueDays.map((d) => dayNamesUz[d]).filter(Boolean).join(', ') || group.schedule || 'Jadval belgilanmagan';
    const timeDisplay = getGroupLessonTime(group);

    return {
      canProceed: false,
      reason: 'not_today',
      todayName: dayNamesUz[currentDayOfWeek],
      scheduledDays: scheduledDaysText,
      timeDisplay,
      room,
    };
  }

  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTotalMinutes = currentHours * 60 + currentMinutes;

  const [startH, startM] = (startTimeStr || '09:30:00').split(':').map(Number);
  const startTotalMinutes = startH * 60 + startM;

  if (currentTotalMinutes < startTotalMinutes) {
    const diffMinutes = startTotalMinutes - currentTotalMinutes;
    const hoursLeft = Math.floor(diffMinutes / 60);
    const minsLeft = diffMinutes % 60;
    let timeLeftStr = '';
    if (hoursLeft > 0) {
      timeLeftStr += `${hoursLeft} soat `;
    }
    timeLeftStr += `${minsLeft} daqiqa`;

    const startFormatted = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;
    const endFormatted = endTimeStr ? endTimeStr.slice(0, 5) : '';

    return {
      canProceed: false,
      reason: 'not_started_yet',
      startTime: startFormatted,
      endTime: endFormatted,
      timeRange: endFormatted ? `${startFormatted} - ${endFormatted}` : startFormatted,
      diffMinutes,
      timeLeftStr,
      room,
    };
  }

  return {
    canProceed: true,
    startTime: startTimeStr,
    endTime: endTimeStr,
    room,
  };
}

// --- LIVE ATTENDANCE DASHBOARD RENDERER ---
async function renderGroupAttendancePanel(chatId, messageId, groupId, toastText = null, cqId = null, forceBypass = false) {
  if (cqId && toastText) {
    await answerCallbackQuery(cqId, toastText);
  } else if (cqId) {
    await answerCallbackQuery(cqId);
  }

  const db = getDb();
  const group = (db.educo_db_groups || []).find((g) => g.id === groupId);
  if (!group) {
    if (messageId) await editMessageText(chatId, messageId, '⚠️ Guruh topilmadi.');
    else await sendMessage(chatId, '⚠️ Guruh topilmadi.');
    return;
  }

  const sessions = getSessions();
  const session = sessions[chatId] || {};
  const isTester = session.role === 'owner' || String(chatId) === '1594150529' || session.actualRole === 'owner';
  const effectiveBypass = forceBypass || Boolean(session.forceBypass?.[groupId]);

  const lessonStatus = checkGroupLessonStatus(group, db, session, effectiveBypass);
  if (!lessonStatus.canProceed) {
    let warningText = '';
    const inline_keyboard = [];

    if (lessonStatus.reason === 'not_started_yet') {
      warningText = `⏳ <b>Dars hali boshlanmadi!</b>\n\n` +
        `👥 <b>Guruh:</b> ${group.name}\n` +
        `📚 <b>Fan:</b> ${group.course_name || group.name}\n` +
        `🕒 <b>Dars vaqti:</b> ${lessonStatus.timeRange}\n` +
        `🚪 <b>Xona:</b> ${lessonStatus.room}\n\n` +
        `⏰ <b>Dars boshlanishiga qoldi:</b> <b>${lessonStatus.timeLeftStr}</b>\n\n` +
        `<i>Davomat dars rasman boshlanganidan so‘ng (soat ${lessonStatus.startTime} da) avtomatik tarzda faollashadi. Ungacha tizim yopiq bo‘ladi.</i>`;
    } else {
      warningText = `⏳ <b>Dars hali boshlanmadi!</b>\n\n` +
        `👥 <b>Guruh:</b> ${group.name}\n` +
        `📚 <b>Fan:</b> ${group.course_name || group.name}\n` +
        `📌 <b>Dars kunlari:</b> ${lessonStatus.scheduledDays}\n` +
        `🕒 <b>Dars vaqti:</b> ${lessonStatus.timeDisplay}\n` +
        `🚪 <b>Xona:</b> ${lessonStatus.room}\n\n` +
        `📅 <i>Bugun (${lessonStatus.todayName}) ushbu guruh uchun dars kuni emas. Davomat dars kunida va dars boshlangan vaqtda faollashadi.</i>`;
    }

    inline_keyboard.push([
      { text: '🔄 Qayta tekshirish', callback_data: `att_g:${groupId}` },
      { text: '⬅️ Guruhlar ro‘yxati', callback_data: 'att_groups_list' },
    ]);
    inline_keyboard.push([
      { text: '🏠 Bosh menyu', callback_data: 'nav_home' },
    ]);

    if (isTester) {
      inline_keyboard.push([
        { text: '👑 Test rejimida ochish (Boshqaruvchi)', callback_data: `att_force:${groupId}` },
      ]);
    }

    if (messageId) {
      await editMessageText(chatId, messageId, warningText, { reply_markup: { inline_keyboard } });
    } else {
      await sendMessage(chatId, warningText, { reply_markup: { inline_keyboard } });
    }
    return;
  }

  const students = getGroupStudents(groupId);
  if (students.length === 0) {
    const emptyText = `⚠️ <b>${group.name}</b> guruhida birorta ham faol o‘quvchi topilmadi.`;
    if (messageId) await editMessageText(chatId, messageId, emptyText);
    else await sendMessage(chatId, emptyText);
    return;
  }

  const todayStr = formatTashkentDate(getTashkentNow());
  const todayPretty = formatUzDatePretty(todayStr);

  const groupAtt = (db.educo_db_attendance || []).filter(
    (a) => a.group_id === groupId && a.date === todayStr
  );

  let presentCount = 0;
  let lateCount = 0;
  let absentCount = 0;

  students.forEach((st) => {
    const rec = groupAtt.find((a) => a.student_id === st.id);
    const status = rec ? rec.status : 'present'; // Standart bor deb hisoblash
    if (status === 'present') presentCount++;
    else if (status === 'late') lateCount++;
    else if (status === 'absent') absentCount++;
  });

  const text = `📝 <b>Davomat Nazorati:</b> ${group.name}\n` +
    `📅 <b>Sana:</b> ${todayPretty}\n\n` +
    `📊 <b>Guruh statistikasi:</b>\n` +
    `🟢 <b>Bor:</b> ${presentCount} nafar\n` +
    `🟡 <b>Kech qoldi:</b> ${lateCount} nafar\n` +
    `🔴 <b>Kelmadi:</b> ${absentCount} nafar\n` +
    `👥 <b>Jami o‘quvchilar:</b> ${students.length} nafar\n\n` +
    `👇 <b>O‘quvchi tugmasini bosing — holati darhol o‘zgaradi:</b>\n` +
    `(🟢 Bor ➔ 🟡 Kech ➔ 🔴 Kelmadi)\n\n` +
    `<i>Holatlarni belgilab bo‘lgach, pastdagi <b>«💾 Davomatni yakunlash va saqlash»</b> tugmasini bosing!</i>`;

  const inline_keyboard = [];

  // 1. Tezkor ommaviy harakatlar
  inline_keyboard.push([
    { text: '🟢 Barchani BOR qilish', callback_data: `att_all:${groupId}` },
    { text: '🔴 Barchani KELMADI qilish', callback_data: `att_none:${groupId}` },
  ]);

  // 2. Har bir o'quvchi tugmasi
  students.forEach((st, idx) => {
    const rec = groupAtt.find((a) => a.student_id === st.id);
    const status = rec ? rec.status : 'present';
    const icon = status === 'present' ? '🟢' : (status === 'late' ? '🟡' : '🔴');
    const label = status === 'present' ? 'Bor' : (status === 'late' ? 'Kech qoldi' : 'Kelmadi');
    const stName = st.fullName || st.name || `${st.first_name || ''} ${st.last_name || ''}`.trim() || `O‘quvchi ${idx + 1}`;
    inline_keyboard.push([
      { text: `${icon} ${idx + 1}. ${stName} (${label})`, callback_data: `att_tog:${groupId}:${st.id}:${status}` },
    ]);
  });

  // 3. Pastki asosiy boshqaruv tugmasi: Yakunlash
  inline_keyboard.push([
    { text: '💾 Davomatni yakunlash va saqlash', callback_data: `att_finalize:${groupId}` },
  ]);
  inline_keyboard.push([
    { text: '🔄 Yangilash', callback_data: `att_g:${groupId}` },
    { text: '⬅️ Guruhlar ro‘yxati', callback_data: 'att_groups_list' },
  ]);
  inline_keyboard.push([
    { text: '🏠 Bosh menyu', callback_data: 'nav_home' },
  ]);

  if (messageId) {
    await editMessageText(chatId, messageId, text, { reply_markup: { inline_keyboard } });
  } else {
    await sendMessage(chatId, text, { reply_markup: { inline_keyboard } });
  }
}

// --- GRADE FEEDBACK MAP ---
const GRADE_FEEDBACK_MAP = {
  5: "A'lo darajada! Darsda juda faol qatnashdi va vazifalarni namunali bajardi. 👏",
  4: "Yaxshi! Dars mavzusini yaxshi o'zlashtirdi va vazifalarni to'g'ri bajardi. 👍",
  3: "Qoniqarli. Darsda qatnashdi, yanada faolroq bo'lish tavsiya etiladi. 📚",
  2: "Qoniqarsiz. Mavzuni o'zlashtirishda kamchiliklar bor, qo'shimcha tayyorgarlik zarur. ⚠️",
  1: "Yomon. Mashg'ulotlarga jiddiyroq e'tibor qaratish kerak. ❗",
};

// --- LIVE INTERACTIVE GRADING PANEL RENDERER ---
async function renderGroupGradingPanel(chatId, messageId, groupId, toastText = null, cqId = null, forceBypass = false) {
  if (cqId && toastText) {
    await answerCallbackQuery(cqId, toastText);
  } else if (cqId) {
    await answerCallbackQuery(cqId);
  }

  const db = getDb();
  const group = (db.educo_db_groups || []).find((g) => g.id === groupId);
  if (!group) {
    if (messageId) await editMessageText(chatId, messageId, '⚠️ Guruh topilmadi.');
    else await sendMessage(chatId, '⚠️ Guruh topilmadi.');
    return;
  }

  const sessions = getSessions();
  const session = sessions[chatId] || {};
  const isTester = session.role === 'owner' || String(chatId) === '1594150529' || session.actualRole === 'owner';
  const effectiveBypass = forceBypass || Boolean(session.forceBypass?.[groupId]);

  const lessonStatus = checkGroupLessonStatus(group, db, session, effectiveBypass);
  if (!lessonStatus.canProceed) {
    let warningText = '';
    const inline_keyboard = [];

    if (lessonStatus.reason === 'not_started_yet') {
      warningText = `⏳ <b>Dars hali boshlanmadi!</b>\n\n` +
        `👥 <b>Guruh:</b> ${group.name}\n` +
        `📚 <b>Fan:</b> ${group.course_name || group.name}\n` +
        `🕒 <b>Dars vaqti:</b> ${lessonStatus.timeRange}\n` +
        `🚪 <b>Xona:</b> ${lessonStatus.room}\n\n` +
        `⏰ <b>Dars boshlanishiga qoldi:</b> <b>${lessonStatus.timeLeftStr}</b>\n\n` +
        `<i>O‘quvchilarni baholash dars rasman boshlanganidan so‘ng (soat ${lessonStatus.startTime} da) avtomatik tarzda faollashadi. Ungacha tizim yopiq bo‘ladi.</i>`;
    } else {
      warningText = `⏳ <b>Dars hali boshlanmadi!</b>\n\n` +
        `👥 <b>Guruh:</b> ${group.name}\n` +
        `📚 <b>Fan:</b> ${group.course_name || group.name}\n` +
        `📌 <b>Dars kunlari:</b> ${lessonStatus.scheduledDays}\n` +
        `🕒 <b>Dars vaqti:</b> ${lessonStatus.timeDisplay}\n` +
        `🚪 <b>Xona:</b> ${lessonStatus.room}\n\n` +
        `📅 <i>Bugun (${lessonStatus.todayName}) ushbu guruh uchun dars kuni emas. Baholash dars kunida va dars boshlangan vaqtda faollashadi.</i>`;
    }

    inline_keyboard.push([
      { text: '🔄 Qayta tekshirish', callback_data: `grd_g:${groupId}` },
      { text: '⬅️ Guruhlar ro‘yxati', callback_data: 'grd_groups_list' },
    ]);
    inline_keyboard.push([
      { text: '🏠 Bosh menyu', callback_data: 'nav_home' },
    ]);

    if (isTester) {
      inline_keyboard.push([
        { text: '👑 Test rejimida ochish (Boshqaruvchi)', callback_data: `grd_force:${groupId}` },
      ]);
    }

    if (messageId) {
      await editMessageText(chatId, messageId, warningText, { reply_markup: { inline_keyboard } });
    } else {
      await sendMessage(chatId, warningText, { reply_markup: { inline_keyboard } });
    }
    return;
  }

  const allStudents = getGroupStudents(groupId);
  if (allStudents.length === 0) {
    const emptyText = `⚠️ <b>${group.name}</b> guruhida birorta ham faol o‘quvchi topilmadi.`;
    if (messageId) await editMessageText(chatId, messageId, emptyText);
    else await sendMessage(chatId, emptyText);
    return;
  }

  const todayStr = formatTashkentDate(getTashkentNow());
  const todayPretty = formatUzDatePretty(todayStr);

  // 1. Bugungi davomatni tekshirish va kelmagan (yo'q) o'quvchilarni aniqlash
  const todayAttendance = (db.educo_db_attendance || []).filter(
    (a) => a.group_id === groupId && a.date === todayStr
  );
  const absentStudentIds = new Set(
    todayAttendance.filter((a) => a.status === 'absent').map((a) => String(a.student_id))
  );

  // 2. Faqat darsda qatnashgan o'quvchilar ro'yxati (kelmaganlar avtomatik chiqariladi)
  const students = allStudents.filter((st) => !absentStudentIds.has(String(st.id)));
  const absentCount = allStudents.length - students.length;

  if (students.length === 0) {
    const allAbsentText = `ℹ️ <b>${group.name}</b> guruhida bugun barcha (${allStudents.length} nafar) o‘quvchilar «Kelmadi» deb belgilangan.\n\n` +
      `Darsda qatnashmagan o‘quvchilarni baholab bo‘lmaydi.`;
    const inline_keyboard = [
      [{ text: '✏️ Davomatni tahrirlash', callback_data: `att_g:${groupId}` }],
      [{ text: '⬅️ Guruhlar ro‘yxati', callback_data: 'grd_groups_list' }],
      [{ text: '🏠 Bosh menyu', callback_data: 'nav_home' }],
    ];
    if (messageId) await editMessageText(chatId, messageId, allAbsentText, { reply_markup: { inline_keyboard } });
    else await sendMessage(chatId, allAbsentText, { reply_markup: { inline_keyboard } });
    return;
  }

  const groupGrades = (db.educo_db_grades || []).filter(
    (g) => g.group_id === groupId && (g.date === todayStr || (g.created_at && g.created_at.startsWith(todayStr)))
  );

  let gradedCount = 0;
  students.forEach((st) => {
    if (groupGrades.some((g) => g.student_id === st.id)) gradedCount++;
  });

  let text = `🌟 <b>Tezkor Baholash Nazorati:</b> ${group.name}\n` +
    `📅 <b>Sana:</b> ${todayPretty}\n` +
    `📚 <b>Fan:</b> ${group.course_name || group.name}\n\n` +
    `📊 <b>Darsda qatnashganlar:</b> ${gradedCount} / ${students.length} nafar baholandi\n`;
  if (absentCount > 0) {
    text += `🚫 <i>Kelmagan ${absentCount} nafar o‘quvchi ro‘yxatdan avtomatik chiqarildi.</i>\n\n`;
  } else {
    text += `\n`;
  }
  text += `👇 <b>Har bir o‘quvchi ostidagi bahoni (1 dan 5 gacha) bosing:</b>\n` +
    `<i>Baho bosilishi bilan status yangilanadi. Yakunlash uchun pastdagi <b>«💾 Baholashni yakunlash va saqlash»</b> tugmasini bosing!</i>`;

  const inline_keyboard = [];

  students.forEach((st, idx) => {
    const studentGrades = groupGrades.filter((g) => g.student_id === st.id);
    const latestGrade = studentGrades.length > 0 ? studentGrades[studentGrades.length - 1].grade_value : null;

    const stName = st.fullName || st.name || `${st.first_name || ''} ${st.last_name || ''}`.trim() || `O‘quvchi ${idx + 1}`;
    const gradeBadge = latestGrade ? `(⭐ ${latestGrade} ball)` : `(Baholanmagan)`;

    // 1. O'quvchi ismi qatori
    inline_keyboard.push([
      { text: `👤 ${idx + 1}. ${stName} ${gradeBadge}`, callback_data: `grd_info:${groupId}:${st.id}` }
    ]);

    // 2. 1 dan 5 gacha baho tugmalari qatori (Direct inline 1-5 buttons)
    const gradeRow = [];
    for (let score = 1; score <= 5; score++) {
      const isSelected = latestGrade === score;
      const scoreLabel = isSelected ? `⭐ ${score}` : `${score}`;
      gradeRow.push({
        text: scoreLabel,
        callback_data: `grd_v:${groupId}:${st.id}:${score}`
      });
    }
    inline_keyboard.push(gradeRow);
  });

  // 3. Pastki asosiy boshqaruv tugmasi: Baholashni yakunlash
  inline_keyboard.push([
    { text: '💾 Baholashni yakunlash va saqlash', callback_data: `grd_finalize:${groupId}` },
  ]);
  inline_keyboard.push([
    { text: '🔄 Yangilash', callback_data: `grd_g:${groupId}` },
    { text: '⬅️ Guruhlar ro‘yxati', callback_data: 'grd_groups_list' },
  ]);
  inline_keyboard.push([
    { text: '🏠 Bosh menyu', callback_data: 'nav_home' },
  ]);

  if (messageId) {
    await editMessageText(chatId, messageId, text, { reply_markup: { inline_keyboard } });
  } else {
    await sendMessage(chatId, text, { reply_markup: { inline_keyboard } });
  }
}

// --- CALLBACK QUERY HANDLER (INLINE BUTTONS) ---
async function handleCallbackQuery(cq) {
  const chatId = cq.message?.chat?.id;
  const messageId = cq.message?.message_id;
  const data = cq.data || '';
  const sessions = getSessions();
  const session = sessions[chatId];

  if (!session || !chatId) {
    await answerCallbackQuery(cq.id, 'Iltimos, avval /start ni bosing.');
    return;
  }

  const db = getDb();
  const todayStr = formatTashkentDate(getTashkentNow());
  const todayPretty = formatUzDatePretty(todayStr);

  // 0. Demo Role Switcher Callback (Olib tashlangan / Xavfsiz holatga keltirilgan)
  if (data.startsWith('sw_role:')) {
    await answerCallbackQuery(cq.id, 'Demo rejim o‘chirilgan. Akkauntga kirish uchun menyudagi «Rolni almashtirish» tugmasini bosing.', true);
    return;
  }

  // 1. Teacher selects group for live attendance panel: `att_g:<groupId>`
  if (data.startsWith('att_g:')) {
    const groupId = data.replace('att_g:', '');
    await renderGroupAttendancePanel(chatId, messageId, groupId, null, cq.id);
    return;
  }

  // 1.05 Test bypass for owner / tester: `att_force:<groupId>`
  if (data.startsWith('att_force:')) {
    const groupId = data.replace('att_force:', '');
    if (!session.forceBypass) session.forceBypass = {};
    session.forceBypass[groupId] = true;
    sessions[chatId] = session;
    saveSessions(sessions);
    await renderGroupAttendancePanel(chatId, messageId, groupId, '👑 Test rejimi faollashtirildi!', cq.id, true);
    return;
  }

  // 1.1 Return to groups list: `att_groups_list`
  if (data === 'att_groups_list') {
    await answerCallbackQuery(cq.id);
    const allGroups = (db.educo_db_groups || []).filter((g) => g.status !== 'archived');
    const teacherId = session.userId;
    let targetGroups = (session.role === 'owner' || session.role === 'admin')
      ? allGroups
      : allGroups.filter((g) => g.teacher_id === teacherId || (g.teacher_name && g.teacher_name.toLowerCase().includes('abdulaziz')));

    if (targetGroups.length === 0) targetGroups = allGroups;

    const groupButtons = targetGroups.slice(0, 15).map((g) => {
      const gAtt = (db.educo_db_attendance || []).filter(a => a.group_id === g.id && a.date === todayStr);
      const p = gAtt.filter(a => a.status === 'present').length;
      const l = gAtt.filter(a => a.status === 'late').length;
      const ab = gAtt.filter(a => a.status === 'absent').length;
      const attBadge = gAtt.length > 0 ? ` (🟢${p} 🟡${l} 🔴${ab})` : '';

      const st = checkGroupLessonStatus(g, db, session, session.forceBypass?.[g.id]);
      let timeBadge = '';
      if (st.canProceed) {
        timeBadge = ' 🟢 [Dars vaqti]';
      } else if (st.reason === 'not_started_yet') {
        timeBadge = ` ⏳ [${st.startTime}]`;
      } else {
        timeBadge = ` 📅 [${getGroupLessonDaysSummary(g)}]`;
      }

      return [{ text: `👥 ${g.name}${attBadge}${timeBadge}`, callback_data: `att_g:${g.id}` }];
    });

    await editMessageText(
      chatId,
      messageId,
      `📝 <b>Davomat Boshqaruvi:</b> Qaysi guruh davomatini ko‘rmoqchisiz / yangilamoqchisiz?`,
      { reply_markup: { inline_keyboard: groupButtons } }
    );
    return;
  }

  // 2. Mark all students as PRESENT: `att_all:<groupId>`
  if (data.startsWith('att_all:')) {
    const groupId = data.replace('att_all:', '');
    const group = (db.educo_db_groups || []).find((g) => g.id === groupId);
    const students = getGroupStudents(groupId);

    if (!group || students.length === 0) {
      await answerCallbackQuery(cq.id, 'O‘quvchilar topilmadi.');
      return;
    }

    const isTester = session.role === 'owner' || String(chatId) === '1594150529' || session.actualRole === 'owner';
    const effectiveBypass = Boolean(session.forceBypass?.[groupId]);
    const lessonStatus = checkGroupLessonStatus(group, db, session, effectiveBypass);
    if (!lessonStatus.canProceed && !isTester) {
      const reasonMsg = lessonStatus.reason === 'not_started_yet'
        ? `⏳ Dars hali boshlanmadi! Dars vaqti: ${lessonStatus.startTime}. Ungacha davomat qilib bo‘lmaydi.`
        : `📅 Bugun dars kuni emas! Dars kunlari: ${lessonStatus.scheduledDays}`;
      await answerCallbackQuery(cq.id, reasonMsg, true);
      return;
    }

    if (!db.educo_db_attendance) db.educo_db_attendance = [];

    for (const st of students) {
      const existingIdx = db.educo_db_attendance.findIndex(
        (a) => a.student_id === st.id && a.date === todayStr && a.group_id === groupId
      );
      const record = {
        id: existingIdx >= 0 ? db.educo_db_attendance[existingIdx].id : `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        student_id: st.id,
        group_id: groupId,
        date: todayStr,
        status: 'present',
        remark: 'Darsda qatnashdi',
        recorded_by: session.userId || 'teacher',
        updated_at: new Date().toISOString(),
      };

      if (existingIdx >= 0) db.educo_db_attendance[existingIdx] = record;
      else db.educo_db_attendance.push(record);
    }

    saveDb(db);
    await renderGroupAttendancePanel(chatId, messageId, groupId, 'Barcha o‘quvchilar BOR deb belgilandi! 🟢', cq.id);
    return;
  }

  // 2.1 Mark all students as ABSENT: `att_none:<groupId>`
  if (data.startsWith('att_none:')) {
    const groupId = data.replace('att_none:', '');
    const group = (db.educo_db_groups || []).find((g) => g.id === groupId);
    const students = getGroupStudents(groupId);

    if (!group || students.length === 0) {
      await answerCallbackQuery(cq.id, 'O‘quvchilar topilmadi.');
      return;
    }

    const isTester = session.role === 'owner' || String(chatId) === '1594150529' || session.actualRole === 'owner';
    const effectiveBypass = Boolean(session.forceBypass?.[groupId]);
    const lessonStatus = checkGroupLessonStatus(group, db, session, effectiveBypass);
    if (!lessonStatus.canProceed && !isTester) {
      const reasonMsg = lessonStatus.reason === 'not_started_yet'
        ? `⏳ Dars hali boshlanmadi! Dars vaqti: ${lessonStatus.startTime}. Ungacha davomat qilib bo‘lmaydi.`
        : `📅 Bugun dars kuni emas! Dars kunlari: ${lessonStatus.scheduledDays}`;
      await answerCallbackQuery(cq.id, reasonMsg, true);
      return;
    }

    if (!db.educo_db_attendance) db.educo_db_attendance = [];

    for (const st of students) {
      const existingIdx = db.educo_db_attendance.findIndex(
        (a) => a.student_id === st.id && a.date === todayStr && a.group_id === groupId
      );
      const record = {
        id: existingIdx >= 0 ? db.educo_db_attendance[existingIdx].id : `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        student_id: st.id,
        group_id: groupId,
        date: todayStr,
        status: 'absent',
        remark: 'Darsga kelmadi',
        recorded_by: session.userId || 'teacher',
        updated_at: new Date().toISOString(),
      };

      if (existingIdx >= 0) db.educo_db_attendance[existingIdx] = record;
      else db.educo_db_attendance.push(record);
    }

    saveDb(db);
    await renderGroupAttendancePanel(chatId, messageId, groupId, 'Barcha o‘quvchilar KELMADI deb belgilandi! 🔴', cq.id);
    return;
  }

  // 3. Teacher toggles status of a student: `att_tog:<groupId>:<studentId>:<currentStatus>`
  if (data.startsWith('att_tog:')) {
    const [, groupId, studentId, currentStatus] = data.split(':');
    const group = (db.educo_db_groups || []).find((g) => g.id === groupId);
    const student = (db.educo_db_users || []).find((u) => u.id === studentId);

    if (!group || !student) {
      await answerCallbackQuery(cq.id, 'Xatolik: O‘quvchi topilmadi.');
      return;
    }

    const isTester = session.role === 'owner' || String(chatId) === '1594150529' || session.actualRole === 'owner';
    const effectiveBypass = Boolean(session.forceBypass?.[groupId]);
    const lessonStatus = checkGroupLessonStatus(group, db, session, effectiveBypass);
    if (!lessonStatus.canProceed && !isTester) {
      const reasonMsg = lessonStatus.reason === 'not_started_yet'
        ? `⏳ Dars hali boshlanmadi! Dars vaqti: ${lessonStatus.startTime}. Ungacha davomat qilib bo‘lmaydi.`
        : `📅 Bugun dars kuni emas! Dars kunlari: ${lessonStatus.scheduledDays}`;
      await answerCallbackQuery(cq.id, reasonMsg, true);
      return;
    }

    // Cycle status: present -> late -> absent -> present
    const nextStatus = currentStatus === 'present' ? 'late' : (currentStatus === 'late' ? 'absent' : 'present');
    const statusLabels = {
      present: '🟢 Bor',
      late: '🟡 Kech qoldi',
      absent: '🔴 Kelmadi'
    };

    if (!db.educo_db_attendance) db.educo_db_attendance = [];
    const existingIdx = db.educo_db_attendance.findIndex(
      (a) => a.student_id === studentId && a.date === todayStr && a.group_id === groupId
    );

    const wasFinalized = existingIdx >= 0 && Boolean(db.educo_db_attendance[existingIdx].finalized);

    const record = {
      id: existingIdx >= 0 ? db.educo_db_attendance[existingIdx].id : `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      student_id: studentId,
      group_id: groupId,
      date: todayStr,
      status: nextStatus,
      remark: nextStatus === 'present' ? 'Darsda qatnashdi' : (nextStatus === 'late' ? 'Kech qolib keldi' : 'Darsga kelmadi'),
      recorded_by: session.userId || 'teacher',
      finalized: wasFinalized,
      updated_at: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      db.educo_db_attendance[existingIdx] = record;
    } else {
      db.educo_db_attendance.push(record);
    }
    saveDb(db);

    // Agar ushbu guruh davomati allaqachon yakunlangan bo'lsa, o'zgarish darhol ota-ona va o'quvchiga yuboriladi
    if (wasFinalized) {
      await sendAttendanceTelegramNotification({
        studentId,
        status: nextStatus,
        courseName: group.course_name || group.name,
        teacherName: group.teacher_name || session.fullName,
        lessonTime: getGroupLessonTime(group),
      });
    }

    const studentName = student.fullName || student.name || 'O‘quvchi';
    await renderGroupAttendancePanel(chatId, messageId, groupId, `${studentName}: ${statusLabels[nextStatus]}`, cq.id);
    return;
  }

  // 4. Finalize attendance and send all notifications: `att_finalize:<groupId>`
  if (data.startsWith('att_finalize:')) {
    const groupId = data.replace('att_finalize:', '');
    const group = (db.educo_db_groups || []).find((g) => g.id === groupId);
    const students = getGroupStudents(groupId);

    if (!group || students.length === 0) {
      await answerCallbackQuery(cq.id, 'O‘quvchilar topilmadi.');
      return;
    }

    const isTester = session.role === 'owner' || String(chatId) === '1594150529' || session.actualRole === 'owner';
    const effectiveBypass = Boolean(session.forceBypass?.[groupId]);
    const lessonStatus = checkGroupLessonStatus(group, db, session, effectiveBypass);
    if (!lessonStatus.canProceed && !isTester) {
      const reasonMsg = lessonStatus.reason === 'not_started_yet'
        ? `⏳ Dars hali boshlanmadi! Dars vaqti: ${lessonStatus.startTime}. Ungacha davomatni yakunlab bo‘lmaydi.`
        : `📅 Bugun dars kuni emas! Dars kunlari: ${lessonStatus.scheduledDays}`;
      await answerCallbackQuery(cq.id, reasonMsg, true);
      return;
    }

    if (!db.educo_db_attendance) db.educo_db_attendance = [];

    const lessonTime = getGroupLessonTime(group);
    const teacherName = group.teacher_name || session.fullName || 'Fan mentori';
    const courseName = group.course_name || group.name;

    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;

    for (const st of students) {
      const existingIdx = db.educo_db_attendance.findIndex(
        (a) => a.student_id === st.id && a.date === todayStr && a.group_id === groupId
      );

      const status = existingIdx >= 0 ? db.educo_db_attendance[existingIdx].status : 'present';
      if (status === 'present') presentCount++;
      else if (status === 'late') lateCount++;
      else if (status === 'absent') absentCount++;

      const record = {
        id: existingIdx >= 0 ? db.educo_db_attendance[existingIdx].id : `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        student_id: st.id,
        group_id: groupId,
        date: todayStr,
        status,
        remark: status === 'present' ? 'Darsda qatnashdi' : (status === 'late' ? 'Kech qolib keldi' : 'Darsga kelmadi'),
        recorded_by: session.userId || group.teacher_id || 'teacher',
        finalized: true,
        updated_at: new Date().toISOString(),
      };

      if (existingIdx >= 0) db.educo_db_attendance[existingIdx] = record;
      else db.educo_db_attendance.push(record);

      // Telegram bildirishnomasi talaba va ota-onaga yuboriladi
      await sendAttendanceTelegramNotification({
        studentId: st.id,
        status,
        courseName,
        teacherName,
        lessonTime,
      });
    }

    saveDb(db);
    await answerCallbackQuery(cq.id, 'Davomat muvaffaqiyatli yakunlandi va saqlandi! 🎉');

    const eligibleCount = presentCount + lateCount;

    const successText = `🎉 <b>Davomat muvaffaqiyatli yakunlandi!</b>\n\n` +
      `👥 <b>Guruh:</b> ${group.name}\n` +
      `📅 <b>Sana:</b> ${todayPretty}\n` +
      `👥 <b>Jami o‘quvchilar:</b> ${students.length} nafar\n\n` +
      `🟢 <b>Qatnashdi:</b> ${presentCount} nafar\n` +
      `🟡 <b>Kech qoldi:</b> ${lateCount} nafar\n` +
      `🔴 <b>Kelmadi:</b> ${absentCount} nafar\n\n` +
      `Barcha talaba va ota-onalar telegramiga bildirishnomalar yuborildi! ✅\n` +
      `Davomat LMS platformasiga to‘liq saqlandi.\n\n` +
      `<i>Dars davomida o‘quvchilar holatini qayta tahrirlashingiz mumkin.</i>`;

    const finalKeyboard = [];
    if (eligibleCount > 0) {
      finalKeyboard.push([
        { text: `⭐ Qatnashganlarni baholash (${eligibleCount} nafar)`, callback_data: `grd_g:${groupId}` }
      ]);
    }
    finalKeyboard.push(
      [
        { text: '✏️ Davomatni qayta tahrirlash', callback_data: `att_g:${groupId}` },
      ],
      [
        { text: '⬅️ Guruhlar ro‘yxati', callback_data: 'att_groups_list' },
        { text: '🏠 Bosh menyu', callback_data: 'nav_home' },
      ]
    );

    await editMessageText(chatId, messageId, successText, {
      reply_markup: { inline_keyboard: finalKeyboard }
    });

    // Avtomatik ravishda darsda qatnashgan o'quvchilarni baholashni taklif qiluvchi xabar yuborish
    if (eligibleCount > 0) {
      const askGradingPrompt = `⭐ <b>Davomat yakunlandi! Qatnashgan o‘quvchilarni hoziroq baholaysizmi?</b>\n\n` +
        `👥 Darsda qatnashganlar: <b>${eligibleCount} nafar</b>\n` +
        (absentCount > 0 ? `🚫 Darsga kelmaganlar: <b>${absentCount} nafar</b> <i>(baholashdan avtomatik chiqarildi)</i>\n\n` : `\n`) +
        `O‘quvchilarni baholash uchun pastdagi tugmani bosing va 1-5 ball qo‘ying:`;

      await sendMessage(chatId, askGradingPrompt, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: `⭐ Ha, qatnashganlarni baholash (${eligibleCount} nafar)`, callback_data: `grd_g:${groupId}` }
            ],
            [
              { text: `🏠 Keyinroq / Bosh menyu`, callback_data: 'nav_home' }
            ]
          ]
        }
      });
    }
    return;
  }

  // 5. Send/Resend notification broadcast: `att_notify:<groupId>`
  if (data.startsWith('att_notify:')) {
    const groupId = data.replace('att_notify:', '');
    const group = (db.educo_db_groups || []).find((g) => g.id === groupId);
    const students = getGroupStudents(groupId);

    if (group && students.length > 0) {
      const lessonTime = getGroupLessonTime(group);
      for (const st of students) {
        const att = (db.educo_db_attendance || []).find(a => a.student_id === st.id && a.date === todayStr && a.group_id === groupId);
        const status = att ? att.status : 'present';
        await sendAttendanceTelegramNotification({
          studentId: st.id,
          status,
          courseName: group.course_name || group.name,
          teacherName: group.teacher_name || session.fullName,
          lessonTime,
        });
      }
    }

    await renderGroupAttendancePanel(chatId, messageId, groupId, 'Barcha talaba va ota-onalarga bildirishnomalar yuborildi! 📢', cq.id);
    return;
  }

  // 7. Teacher Grading Panel: `grd_g:<groupId>`
  if (data.startsWith('grd_g:')) {
    const groupId = data.replace('grd_g:', '');
    await renderGroupGradingPanel(chatId, messageId, groupId, null, cq.id);
    return;
  }

  // 7.05 Test bypass for owner / tester: `grd_force:<groupId>`
  if (data.startsWith('grd_force:')) {
    const groupId = data.replace('grd_force:', '');
    if (!session.forceBypass) session.forceBypass = {};
    session.forceBypass[groupId] = true;
    sessions[chatId] = session;
    saveSessions(sessions);
    await renderGroupGradingPanel(chatId, messageId, groupId, '👑 Test rejimi faollashtirildi!', cq.id, true);
    return;
  }

  // 7.1 Return to grading groups list: `grd_groups_list`
  if (data === 'grd_groups_list') {
    await answerCallbackQuery(cq.id);
    const allGroups = (db.educo_db_groups || []).filter((g) => g.status !== 'archived');
    const teacherId = session.userId;
    let targetGroups = (session.role === 'owner' || session.role === 'admin')
      ? allGroups
      : allGroups.filter((g) => g.teacher_id === teacherId || (g.teacher_name && g.teacher_name.toLowerCase().includes('abdulaziz')));

    if (targetGroups.length === 0) targetGroups = allGroups;

    const groupButtons = targetGroups.slice(0, 15).map((g) => {
      const st = checkGroupLessonStatus(g, db, session, session.forceBypass?.[g.id]);
      let timeBadge = '';
      if (st.canProceed) {
        timeBadge = ' 🟢 [Dars vaqti]';
      } else if (st.reason === 'not_started_yet') {
        timeBadge = ` ⏳ [${st.startTime}]`;
      } else {
        timeBadge = ` 📅 [${getGroupLessonDaysSummary(g)}]`;
      }
      return [{ text: `👥 ${g.name}${timeBadge}`, callback_data: `grd_g:${g.id}` }];
    });

    await editMessageText(
      chatId,
      messageId,
      `🌟 <b>Baholash Boshqaruvi:</b> Qaysi guruh o‘quvchilariga baho qo‘ymoqchisiz?`,
      { reply_markup: { inline_keyboard: groupButtons } }
    );
    return;
  }

  // 7.2 Student info hint toast: `grd_info:<groupId>:<studentId>`
  if (data.startsWith('grd_info:')) {
    await answerCallbackQuery(cq.id, 'Baholash uchun pastdagi 1 dan 5 gacha tugmalardan birini bosing ⭐');
    return;
  }

  // 8. Save/Update Grade (Direct 1-Tap): `grd_v:<groupId>:<studentId>:<score>`
  if (data.startsWith('grd_v:')) {
    const [, groupId, studentId, scoreStr] = data.split(':');
    const score = Number(scoreStr);
    const group = (db.educo_db_groups || []).find((g) => g.id === groupId);
    const student = (db.educo_db_users || []).find((u) => u.id === studentId);

    if (!group || !student) {
      await answerCallbackQuery(cq.id, 'Xatolik: O‘quvchi topilmadi.');
      return;
    }

    const isTester = session.role === 'owner' || String(chatId) === '1594150529' || session.actualRole === 'owner';
    const effectiveBypass = Boolean(session.forceBypass?.[groupId]);
    const lessonStatus = checkGroupLessonStatus(group, db, session, effectiveBypass);
    if (!lessonStatus.canProceed && !isTester) {
      const reasonMsg = lessonStatus.reason === 'not_started_yet'
        ? `⏳ Dars hali boshlanmadi! Dars vaqti: ${lessonStatus.startTime}. Ungacha baholab bo‘lmaydi.`
        : `📅 Bugun dars kuni emas! Dars kunlari: ${lessonStatus.scheduledDays}`;
      await answerCallbackQuery(cq.id, reasonMsg, true);
      return;
    }

    // Kelmagan (absent) o'quvchini baholash taqiqlanadi
    const todayAtt = (db.educo_db_attendance || []).find(
      (a) => a.student_id === studentId && a.group_id === groupId && a.date === todayStr
    );
    if (todayAtt && todayAtt.status === 'absent') {
      await answerCallbackQuery(cq.id, '❌ Ushbu o‘quvchi bugungi darsga kelmagan. Uni baholab bo‘lmaydi!', true);
      return;
    }

    if (!db.educo_db_grades) db.educo_db_grades = [];

    const studentName = student.fullName || student.name || `${student.first_name || ''} ${student.last_name || ''}`.trim();
    const feedback = GRADE_FEEDBACK_MAP[score] || 'Dars amaliy mashg‘ulotida qatnashdi';

    const existingIdx = db.educo_db_grades.findIndex(
      (g) => g.student_id === studentId && (g.date === todayStr || (g.created_at && g.created_at.startsWith(todayStr))) && g.group_id === groupId
    );

    const gradeRecord = {
      id: existingIdx >= 0 ? db.educo_db_grades[existingIdx].id : `grd-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      student_id: studentId,
      student_name: studentName,
      group_id: groupId,
      lesson_id: `lsn-${groupId}-${todayStr}`,
      grade_value: score,
      topic: 'Dars amaliy mashg‘uloti',
      feedback,
      date: todayStr,
      teacher_id: session.userId || group.teacher_id || 'teacher',
      teacher_name: session.fullName || group.teacher_name || 'Fan mentori',
      created_at: existingIdx >= 0 ? db.educo_db_grades[existingIdx].created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
      lessons: {
        id: `lsn-${groupId}-${todayStr}`,
        title: 'Dars amaliy mashg‘uloti',
        group_id: groupId,
        lesson_date: todayStr,
      },
      profiles: {
        id: student.id,
        first_name: student.first_name || '',
        last_name: student.last_name || '',
        username: student.username || '',
        avatar_url: student.avatar_url || null,
      }
    };

    if (existingIdx >= 0) {
      db.educo_db_grades[existingIdx] = gradeRecord;
    } else {
      db.educo_db_grades.push(gradeRecord);
    }
    saveDb(db);

    // Send real-time Telegram alert to Student & Parent (davomatgadek ota-onaga ketsin!)
    await sendGradeTelegramNotification({
      studentId,
      gradeValue: score,
      topic: 'Dars amaliy mashg‘uloti',
      feedback,
      teacherName: session.fullName || group.teacher_name || 'Fan mentori',
      courseName: group.course_name || group.name,
    });

    // Re-render the interactive grading panel in-place with instant toast
    await renderGroupGradingPanel(chatId, messageId, groupId, `${studentName}: ${score} ball qo‘yildi! ⭐`, cq.id);
    return;
  }

  // 9. Finalize Grading: `grd_finalize:<groupId>`
  if (data.startsWith('grd_finalize:')) {
    const groupId = data.replace('grd_finalize:', '');
    const group = (db.educo_db_groups || []).find((g) => g.id === groupId);
    const students = getGroupStudents(groupId);

    if (!group || students.length === 0) {
      await answerCallbackQuery(cq.id, 'O‘quvchilar topilmadi.');
      return;
    }

    const isTester = session.role === 'owner' || String(chatId) === '1594150529' || session.actualRole === 'owner';
    const effectiveBypass = Boolean(session.forceBypass?.[groupId]);
    const lessonStatus = checkGroupLessonStatus(group, db, session, effectiveBypass);
    if (!lessonStatus.canProceed && !isTester) {
      const reasonMsg = lessonStatus.reason === 'not_started_yet'
        ? `⏳ Dars hali boshlanmadi! Dars vaqti: ${lessonStatus.startTime}. Ungacha baholarni yakunlab bo‘lmaydi.`
        : `📅 Bugun dars kuni emas! Dars kunlari: ${lessonStatus.scheduledDays}`;
      await answerCallbackQuery(cq.id, reasonMsg, true);
      return;
    }

    // Kelmagan (absent) o'quvchilarni aniqlash va baholash hisobidan avtomatik chiqarish
    const todayAttendance = (db.educo_db_attendance || []).filter(
      (a) => a.group_id === groupId && a.date === todayStr
    );
    const absentStudentIds = new Set(
      todayAttendance.filter((a) => a.status === 'absent').map((a) => String(a.student_id))
    );
    const eligibleStudents = students.filter((st) => !absentStudentIds.has(String(st.id)));
    const absentCount = students.length - eligibleStudents.length;

    const groupGrades = (db.educo_db_grades || []).filter(
      (g) => g.group_id === groupId && (g.date === todayStr || (g.created_at && g.created_at.startsWith(todayStr)))
    );

    // Mark all existing grades for this group today as finalized
    groupGrades.forEach((g) => {
      g.finalized = true;
      g.updated_at = new Date().toISOString();
    });
    saveDb(db);

    const gradedStudentsCount = eligibleStudents.filter((st) => groupGrades.some((g) => g.student_id === st.id)).length;
    const ungradedCount = eligibleStudents.length - gradedStudentsCount;

    const scores = groupGrades
      .filter((g) => !absentStudentIds.has(String(g.student_id)))
      .map((g) => Number(g.grade_value))
      .filter((s) => s >= 1 && s <= 5);
    const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '—';

    await answerCallbackQuery(cq.id, 'Baholash muvaffaqiyatli yakunlandi! 🎉');

    let successText = `🎉 <b>Baholash muvaffaqiyatli yakunlandi!</b>\n\n` +
      `👥 <b>Guruh:</b> ${group.name}\n` +
      `📅 <b>Sana:</b> ${todayPretty}\n` +
      `📚 <b>Fan:</b> ${group.course_name || group.name}\n\n` +
      `📊 <b>Baholash natijalari:</b>\n` +
      `👥 <b>Darsda qatnashganlar:</b> ${eligibleStudents.length} nafar\n` +
      `⭐ <b>Baholandi:</b> ${gradedStudentsCount} nafar\n` +
      `⚪ <b>Baholanmagan:</b> ${ungradedCount} nafar\n`;
    if (absentCount > 0) {
      successText += `🚫 <b>Darsga kelmaganlar:</b> ${absentCount} nafar (baholashdan avtomatik chiqarildi)\n`;
    }
    successText += `📈 <b>Guruh o‘rtacha bali:</b> ${avgScore} ball\n\n` +
      `Barcha baholangan o‘quvchilar va ularning ota-onalariga xushxabarlar yuborildi! ✅\n` +
      `Baholar LMS platformasiga to‘liq muhrlandi.\n\n` +
      `<i>Dars davomida baholarni istalgan payt qayta tahrirlashingiz mumkin.</i>`;

    const finalKeyboard = [
      [
        { text: '✏️ Qayta tahrirlash (Dars davomida)', callback_data: `grd_g:${groupId}` },
      ],
      [
        { text: '⬅️ Guruhlar ro‘yxati', callback_data: 'grd_groups_list' },
        { text: '🏠 Bosh menyu', callback_data: 'nav_home' },
      ]
    ];

    await editMessageText(chatId, messageId, successText, {
      reply_markup: { inline_keyboard: finalKeyboard }
    });
    return;
  }

  // 10. Navigation Go Home callback
  if (data === 'nav_home') {
    await answerCallbackQuery(cq.id);
    await sendMessage(chatId, `🏠 <b>Bosh menyu:</b>`, getMainMenuKeyboard(session));
    return;
  }
}

// --- MESSAGE HANDLERS ---
export async function handleUpdate(update) {
  // Handle Inline Button clicks
  if (update.callback_query) {
    await handleCallbackQuery(update.callback_query);
    return;
  }

  if (!update.message) return;
  const msg = update.message;
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();
  const contact = msg.contact;

  const sessions = getSessions();
  let session = sessions[chatId] || {
    chatId,
    state: 'main',
    history: [],
  };

  // 1. /start command
  if (text === '/start') {
    session.state = 'main';
    session.history = [];
    sessions[chatId] = session;
    saveSessions(sessions);

    if (session.phone && session.role) {
      const roleTitles = {
        owner: '👑 Boshqaruvchi (Owner)',
        admin: '👔 Administrator',
        teacher: 'Mentor',
        student: '🎓 Talaba',
        parent: '👨‍👩‍👧 Ota-ona',
      };
      const displayRole = roleTitles[session.role] || (session.role === 'teacher' ? 'Mentor' : session.role);
      const welcome = `Assalomu alaykum, <b>${session.fullName || 'Foydalanuvchi'}</b>!\n` +
        `EDUCO LMS tizimining rasmiy botiga xush kelibsiz.\n\n` +
        `Sizning rolingiz: <b>${displayRole}</b>\n` +
        `Boshqaruv uchun quyidagi menyudan foydalaning:`;
      await sendMessage(chatId, welcome, getMainMenuKeyboard(session));
      return;
    }

    const startMsg = `🎓 <b>EDUCO LMS — Ta'lim Tizimi Rasmiy Boti</b>\n\n` +
      `Assalomu alaykum! Tizim imkoniyatlaridan to‘liq foydalanish uchun telefon raqamingizni tasdiqlang.\n\n` +
      `Quyidagi <b>«📱 Telefon raqamimni tasdiqlash»</b> tugmasini bosing yoki telefon raqamingizni yozib yuboring:`;
    await sendMessage(chatId, startMsg, START_KEYBOARD);
    return;
  }

  // 2. Native Telegram Contact Sharing: PAROL SO'RALMAYDI! BEVOSITA PROFILIGA KIRADI!
  if (contact) {
    const rawPhone = contact.phone_number.startsWith('+') ? contact.phone_number : `+${contact.phone_number}`;
    const match = findUserByInput(rawPhone);

    if (!match) {
      await sendMessage(
        chatId,
        `⚠️ <b>Kechirasiz!</b>\n` +
        `Ulashilgan telefon raqami (<code>${rawPhone}</code>) EDUCO LMS tizimida ro‘yxatdan o‘tmagan.\n\n` +
        `Iltimos, o‘quv markaz ma’muriyatiga murojaat qiling yoki boshqa raqam kiriting.`,
        session.role ? AUTH_PHONE_KEYBOARD : START_KEYBOARD
      );
      return;
    }

    // Telegram orqali tasdiqlangan kontakt: Parol so'ralmasdan to'g'ridan-to'g'ri tizimga kiradi!
    session.phone = rawPhone;
    session.role = match.role;
    session.state = 'main';
    session.history = [];
    session.pendingAuth = null;

    if (match.type === 'user') {
      session.userId = match.user.id;
      session.fullName = match.user.fullName || match.user.full_name || `${match.user.first_name || ''} ${match.user.last_name || ''}`.trim();

      const db = getDb();
      const uIdx = (db.educo_db_users || []).findIndex((u) => u.id === match.user.id);
      if (uIdx >= 0) {
        db.educo_db_users[uIdx].telegram_chat_id = chatId;
        db.educo_db_users[uIdx].telegram_username = msg.from?.username || '';
        saveDb(db);
      }
    } else if (match.type === 'parent') {
      session.children = match.children.map((c) => ({
        id: c.id,
        name: c.fullName || c.full_name || `${c.first_name || ''} ${c.last_name || ''}`.trim(),
        phone: c.phone,
      }));
      session.activeChildId = session.children[0].id;
      session.fullName = `Ota-ona (${session.children.map((c) => c.name).join(', ')})`;

      const db = getDb();
      (db.educo_db_users || []).forEach((u) => {
        if (session.children.some((c) => c.id === u.id)) {
          u.parent_telegram_chat_id = chatId;
        }
      });
      saveDb(db);
    }

    sessions[chatId] = session;
    saveSessions(sessions);

    const roleTitles = {
      owner: '👑 Boshqaruvchi (Owner)',
      admin: '👔 Administrator',
      teacher: 'Mentor',
      student: '🎓 Talaba / O‘quvchi',
      parent: '👨‍👩‍👧 Ota-ona',
    };
    const displayRole = roleTitles[session.role] || (session.role === 'teacher' ? 'Mentor' : session.role);

    let welcome = `✅ <b>Muvaffaqiyatli kirdingiz! (Kontakt orqali)</b>\n\n` +
      `Assalomu alaykum, <b>${session.fullName}</b>!\n` +
      `Sizning profilingiz: <b>${displayRole}</b>\n\n` +
      `Boshqaruv uchun quyidagi menyudan foydalaning:`;

    if (session.role === 'parent' && session.children.length > 1) {
      welcome += `\n\n📌 <i>Sizning ${session.children.length} nafar farzandingiz markazda tahsil oladi.</i>`;
    }

    await sendMessage(chatId, welcome, getMainMenuKeyboard(session));
    return;
  }

  // 3. «Mening akkauntim» tugmasi (Profil holati va 1 bosishda kontakt ulashish)
  if (text === '👤 Mening akkauntim' || text === 'Mening akkauntim' || text === '/myaccount' || text === '/me') {
    const currentName = session.fullName || 'Foydalanuvchi';
    const roleTitles = {
      owner: '👑 Boshqaruvchi (Owner)',
      admin: '👔 Administrator',
      teacher: 'Mentor',
      student: '🎓 Talaba / O‘quvchi',
      parent: '👨‍👩‍👧 Ota-ona',
    };
    const currentRole = roleTitles[session.role] || (session.role === 'teacher' ? 'Mentor' : session.role);
    const phoneDisplay = session.phone || 'Biriktirilmagan';

    const accountKeyboard = {
      reply_markup: {
        keyboard: [
          [{ text: '📱 O‘z kontaktimni ulashish (1 bosishda kirish)', request_contact: true }],
          ['🔄 Boshqa rolga o‘tish (Parol bilan)', '🏠 Bosh menyu'],
        ],
        resize_keyboard: true,
        one_time_keyboard: false,
      },
    };

    await sendMessage(
      chatId,
      `👤 <b>Mening akkauntim (Profil):</b>\n\n` +
      `📌 <b>Ism:</b> ${currentName}\n` +
      `🏷️ <b>Rol:</b> ${currentRole}\n` +
      `📞 <b>Telefon:</b> ${phoneDisplay}\n\n` +
      `💡 <b>Imkoniyatlar:</b>\n` +
      `• O‘z shaxsiy profilingizga darhol o‘tish uchun pastdagi <b>«📱 O‘z kontaktimni ulashish»</b> tugmasini bosing — kontakt ulashilgach, <b>parolsiz, 1 bosishda</b> kirasiz!\n` +
      `• Boshqa rol yoki akkauntga kirish uchun <b>«🔄 Boshqa rolga o‘tish»</b> tugmasidan foydalaning (telefon va parol so‘raladi).`,
      accountKeyboard
    );
    return;
  }

  // 4. Role / Account Switch Trigger («Rolni almashtirish»)
  if (text === '🔄 Rolni almashtirish' || text === '🔄 Boshqa rolga o‘tish (Parol bilan)' || text === '🔄 Akkauntni almashtirish' || text === '/role' || text === '/switch' || text === '/login') {
    session.state = 'auth_awaiting_phone';
    session.pendingAuth = null;
    sessions[chatId] = session;
    saveSessions(sessions);

    await sendMessage(
      chatId,
      `🔄 <b>Boshqa rolga / akkauntga kirish:</b>\n\n` +
      `👥 Boshqa rolga kirmoqchi bo‘lsangiz, ushbu akkaunt <b>telefon raqamini</b> yozib yuboring (masalan: <code>+998901234567</code>):\n\n` +
      `<i>O‘zingizning profilingizga qaytish uchun pastdagi <b>«📱 Mening akkauntim (Kontakt)»</b> tugmasini bosing (parolsiz, 1 bosishda kirish):</i>`,
      AUTH_PHONE_KEYBOARD
    );
    return;
  }

  // 5. Authentication Cancellation Handling
  if ((session.state === 'auth_awaiting_phone' || session.state === 'auth_awaiting_password') && text === '❌ Bekor qilish') {
    session.state = 'main';
    session.pendingAuth = null;
    sessions[chatId] = session;
    saveSessions(sessions);

    if (session.role) {
      await sendMessage(chatId, `❌ Amal bekor qilindi. Bosh menyudasiz:`, getMainMenuKeyboard(session));
    } else {
      await sendMessage(chatId, `Tizimdan foydalanish uchun telefon raqamingizni yuboring:`, START_KEYBOARD);
    }
    return;
  }

  // 6. Manual Phone Input for switching to another role (PAROL SO'RALADI!)
  const isAwaitingPhone = session.state === 'auth_awaiting_phone' || (!session.role && session.state !== 'auth_awaiting_password');

  if (isAwaitingPhone && text && !text.startsWith('/')) {
    const rawInput = text.trim();
    const clean = cleanPhone(rawInput);

    if (!clean || clean.length < 7) {
      await sendMessage(
        chatId,
        `⚠️ <b>Telefon raqam noto‘g‘ri formatda!</b>\n\n` +
        `Iltimos, telefon raqamini to‘liq yozing (masalan: <code>+998901234567</code>) yoki «📱 Mening akkauntim (Kontakt ulashish)» tugmasini bosing:`,
        session.role ? AUTH_PHONE_KEYBOARD : START_KEYBOARD
      );
      return;
    }

    const match = findUserByInput(rawInput);
    if (!match) {
      await sendMessage(
        chatId,
        `⚠️ <b>Foydalanuvchi topilmadi!</b>\n\n` +
        `Kiritilgan telefon raqami (<code>${rawInput}</code>) EDUCO LMS tizimida ro‘yxatdan o‘tmagan.\n\n` +
        `Iltimos, raqamni to‘g‘ri kiriting yoki o‘quv markaz ma’muriyatiga murojaat qiling:`,
        session.role ? AUTH_PHONE_KEYBOARD : START_KEYBOARD
      );
      return;
    }

    // Boshqa akkaunt / qo'lda kiritilgan raqam: PAROL SO'RALADI!
    session.pendingAuth = {
      rawPhone: rawInput,
      match,
    };
    session.state = 'auth_awaiting_password';
    sessions[chatId] = session;
    saveSessions(sessions);

    const displayName = match.type === 'user'
      ? (match.user.fullName || match.user.name || `${match.user.first_name || ''} ${match.user.last_name || ''}`.trim())
      : (match.children && match.children[0] ? `Ota-ona (${match.children.map(c => c.name || c.fullName).join(', ')})` : 'Foydalanuvchi');

    await sendMessage(
      chatId,
      `👤 <b>Foydalanuvchi aniqlandi:</b> ${displayName}\n\n` +
      `🔑 <b>Akkaunt parolini kiriting:</b>\n` +
      `<i>Boshqa akkauntga kirayotganingiz sababli parolni yozib yuboring (bekor qilish uchun pastdagi tugmani bosing):</i>`,
      CANCEL_AUTH_KEYBOARD
    );
    return;
  }

  // 5. Authentication Step 2: Receiving Password
  if (session.state === 'auth_awaiting_password' && text && !text.startsWith('/')) {
    const enteredPassword = text.trim();
    const pending = session.pendingAuth;

    if (!pending || !pending.match) {
      session.state = 'auth_awaiting_phone';
      sessions[chatId] = session;
      saveSessions(sessions);
      await sendMessage(chatId, `Iltimos, avval telefon raqamingizni yuboring:`, session.role ? AUTH_PHONE_KEYBOARD : START_KEYBOARD);
      return;
    }

    const match = pending.match;
    let passwordValid = false;

    if (match.type === 'user') {
      const userPassword = (match.user.password || '').trim();
      if (userPassword && userPassword === enteredPassword) {
        passwordValid = true;
      }
    } else if (match.type === 'parent') {
      const children = match.children || [];
      const db = getDb();
      const dbUsers = db.educo_db_users || [];
      for (const c of children) {
        const fullChild = dbUsers.find(u => u.id === c.id);
        if (fullChild && fullChild.password && fullChild.password.trim() === enteredPassword) {
          passwordValid = true;
          break;
        }
      }
    }

    if (!passwordValid) {
      await sendMessage(
        chatId,
        `❌ <b>Parol noto‘g‘ri kiritildi!</b>\n\n` +
        `Iltimos, parolingizni tekshirib qaytadan kiriting yoki <b>«❌ Bekor qilish»</b> tugmasini bosing:`,
        CANCEL_AUTH_KEYBOARD
      );
      return;
    }

    // Password is VALID! Authenticate the user!
    session.phone = pending.rawPhone;
    session.role = match.role;
    session.state = 'main';
    session.history = [];
    session.pendingAuth = null;

    if (match.type === 'user') {
      session.userId = match.user.id;
      session.fullName = match.user.fullName || match.user.full_name || `${match.user.first_name || ''} ${match.user.last_name || ''}`.trim();

      const db = getDb();
      const uIdx = (db.educo_db_users || []).findIndex(u => u.id === match.user.id);
      if (uIdx >= 0) {
        db.educo_db_users[uIdx].telegram_chat_id = chatId;
        db.educo_db_users[uIdx].telegram_username = msg.from?.username || '';
        saveDb(db);
      }
    } else if (match.type === 'parent') {
      session.children = match.children.map(c => ({
        id: c.id,
        name: c.fullName || c.full_name || `${c.first_name || ''} ${c.last_name || ''}`.trim(),
        phone: c.phone
      }));
      session.activeChildId = session.children[0].id;
      session.fullName = `Ota-ona (${session.children.map(c => c.name).join(', ')})`;

      const db = getDb();
      (db.educo_db_users || []).forEach(u => {
        if (session.children.some(c => c.id === u.id)) {
          u.parent_telegram_chat_id = chatId;
        }
      });
      saveDb(db);
    }

    sessions[chatId] = session;
    saveSessions(sessions);

    const roleNames = {
      owner: '👑 Boshqaruvchi (Owner)',
      admin: '👔 Administrator',
      teacher: 'Mentor',
      student: '🎓 Talaba / O‘quvchi',
      parent: '👨‍👩‍👧 Ota-ona',
    };
    const displayRole = roleNames[session.role] || (session.role === 'teacher' ? 'Mentor' : session.role);

    let welcome = `🎉 <b>Muvaffaqiyatli kirdingiz!</b>\n\n` +
      `Xush kelibsiz, <b>${session.fullName}</b>!\n` +
      `Sizning rolingiz: <b>${displayRole}</b>\n\n`;

    if (session.role === 'parent' && session.children.length > 1) {
      welcome += `📌 <i>Sizning ${session.children.length} nafar farzandingiz markazda tahsil oladi. Farzandni menyu orqali tanlashingiz mumkin.</i>\n\n`;
    }

    welcome += `Quyidagi menyudan boshqaruv bo‘limini tanlang:`;
    await sendMessage(chatId, welcome, getMainMenuKeyboard(session));
    return;
  }

  // Ensure user is authorized
  if (!session.role) {
    await sendMessage(
      chatId,
      `Iltimos, avval <b>«📱 Telefon raqamimni tasdiqlash»</b> tugmasi orqali o‘z profilingizni tasdiqlang.`,
      START_KEYBOARD
    );
    return;
  }

  // 3. Navigation: Home & Back
  if (text === '🏠 Bosh menyu') {
    session.state = 'main';
    session.history = [];
    sessions[chatId] = session;
    saveSessions(sessions);
    await sendMessage(chatId, `🏠 <b>Bosh menyu:</b>`, getMainMenuKeyboard(session));
    return;
  }

  if (text === '⬅️ Ortga') {
    const prevState = session.history.pop() || 'main';
    session.state = prevState;
    sessions[chatId] = session;
    saveSessions(sessions);
    if (prevState === 'main') {
      await sendMessage(chatId, `Asosiy menyuga qaytildi:`, getMainMenuKeyboard(session));
    } else {
      await sendMessage(chatId, `Ortga qaytildi:`, getMainMenuKeyboard(session));
    }
    return;
  }


  // 3.2 Greetings & Menu fallback
  const lowText = text.toLowerCase();
  if (lowText === 'salom' || lowText.includes('assalom') || lowText === 'boshlash' || lowText === '/menu') {
    const roleNames = {
      owner: '👑 Boshqaruvchi (Owner)',
      admin: '👔 Administrator',
      teacher: 'Mentor',
      student: '🎓 Talaba / O‘quvchi',
      parent: '👨‍👩‍👧 Ota-ona',
    };
    const roleTitle = roleNames[session.role] || (session.role || '').toUpperCase();
    const welcome = `Assalomu alaykum, <b>${session.fullName || 'Foydalanuvchi'}</b>! 👋\n\n` +
      `EDUCO LMS tizimining rasmiy botiga xush kelibsiz.\n` +
      `Sizning maqomingiz: <b>${roleTitle}</b>\n\n` +
      `Boshqaruv uchun quyidagi menyudan foydalaning:`;
    await sendMessage(chatId, welcome, getMainMenuKeyboard(session));
    return;
  }

  // 4. Role specific action routing
  const role = session.role;
  const db = getDb();

  // --- OWNER HANDLERS ---
  if (role === 'owner') {
    if (text === '📊 Markaz monitoringi') {
      const users = db.educo_db_users || [];
      const students = users.filter((u) => u.role === 'student' && u.is_active !== false);
      const teachers = users.filter((u) => u.role === 'teacher' && u.is_active !== false);
      const groups = (db.educo_db_groups || []).filter((g) => g.status !== 'archived');
      const courses = (db.educo_db_courses || []).filter((c) => c.is_active !== false);

      const msgText = `📊 <b>EDUCO LMS — Markaz Monitoringi</b>\n\n` +
        `👥 <b>Jami o‘quvchilar:</b> ${students.length} nafar\n` +
        `👨‍🏫 <b>Faol ustozlar:</b> ${teachers.length} nafar\n` +
        `📚 <b>Faol guruhlar:</b> ${groups.length} ta\n` +
        `🎓 <b>Mavjud kurslar:</b> ${courses.length} ta\n\n` +
        `🏢 Barcha o‘quv jarayonlari faol va nazorat ostida.`;
      await sendMessage(chatId, msgText, getSubMenuKeyboard());
      return;
    }

    if (text === '💰 Moliyaviy tahlil') {
      const payments = db.educo_db_payments || [];
      const courses = db.educo_db_courses || [];

      let totalCollected = 0;
      payments.forEach((p) => {
        totalCollected += Number(p.amount) || 0;
      });

      const msgText = `💰 <b>Moliyaviy Hisobot & Tushumlar</b>\n\n` +
        `💵 <b>Umumiy to‘plangan to‘lovlar:</b> ${totalCollected.toLocaleString('uz-UZ')} so‘m\n` +
        `🧾 <b>Jami to‘lov tranzaksiyalari:</b> ${payments.length} ta\n` +
        `📌 <b>Oylik to‘lov o‘rtacha kursi:</b> ${(courses[0]?.monthly_fee || 498000).toLocaleString('uz-UZ')} so‘m\n\n` +
        `Batafsil ma'lumotlar veb-panelda real-vaqtda yangilanib boradi.`;
      await sendMessage(chatId, msgText, getSubMenuKeyboard());
      return;
    }

    if (text === '👥 Guruhlar ro‘yxati') {
      const groups = (db.educo_db_groups || []).filter((g) => g.status !== 'archived');
      let msgText = `👥 <b>Markazdagi Guruhlar (${groups.length} ta):</b>\n\n`;
      groups.slice(0, 15).forEach((g, idx) => {
        const studentCount = (g.student_ids || []).length;
        msgText += `<b>${idx + 1}. ${g.name}</b>\n` +
          `   👨‍🏫 Ustoz: ${g.teacher_name || g.teacherName || 'Belgilanmagan'}\n` +
          `   👥 O‘quvchilar: ${studentCount} nafar | 🚪 ${g.room || 'Xona'}\n\n`;
      });
      await sendMessage(chatId, msgText, getSubMenuKeyboard());
      return;
    }

    if (text === '📱 SMS Gate holati') {
      const queue = db.educo_db_sms_queue || [];
      const logs = db.educo_db_sms_logs || [];
      const msgText = `📱 <b>SMS Gateway Xizmati Holati</b>\n\n` +
        `🟢 <b>Gateway Rejimi:</b> Cloud Server (Online)\n` +
        `📨 <b>Yuborilgan SMSlar:</b> ${logs.length} ta\n` +
        `⏳ <b>Navbatdagi SMSlar:</b> ${queue.length} ta\n` +
        `🔋 <b>Android Qurilma:</b> Xiaomi HyperOS (Avtonom)\n\n` +
        `SMS tizimi to‘liq integratsiya qilingan.`;
      await sendMessage(chatId, msgText, getSubMenuKeyboard());
      return;
    }

    if (text === '📢 Ommaviy e’lon (Broadcast)') {
      await sendMessage(
        chatId,
        `📢 <b>Ommaviy e’lon yo‘llash:</b>\n\n` +
        `Iltimos, barcha ustoz va talabalarga yubormoqchi bo‘lgan e’lon matnini yozing (yoki ⬅️ Ortga tugmasini bosing):`,
        getSubMenuKeyboard()
      );
      session.state = 'owner_broadcasting';
      sessions[chatId] = session;
      saveSessions(sessions);
      return;
    }
  }

  // Owner broadcast input receiver
  if (session.state === 'owner_broadcasting') {
    const allSessions = getSessions();
    let sentCount = 0;
    for (const [sChatId] of Object.entries(allSessions)) {
      if (sChatId !== String(chatId)) {
        await sendMessage(
          sChatId,
          `📢 <b>EDUCO LMS — Rasmiy E'lon:</b>\n\n${text}\n\n<i>Hurmat bilan, Boshqaruvchi</i>`
        );
        sentCount++;
      }
    }
    session.state = 'main';
    sessions[chatId] = session;
    saveSessions(sessions);
    await sendMessage(chatId, `✅ E'lon <b>${sentCount} ta</b> foydalanuvchiga yuborildi!`, getMainMenuKeyboard(session));
    return;
  }

  // --- ADMIN HANDLERS ---
  if (role === 'admin') {
    if (text === '👥 Guruhlar va O‘quvchilar') {
      const groups = (db.educo_db_groups || []).filter((g) => g.status !== 'archived');
      let msgText = `👥 <b>Guruhlar va O‘quvchilar Sig‘imi:</b>\n\n`;
      groups.slice(0, 10).forEach((g, idx) => {
        msgText += `<b>${idx + 1}. ${g.name}</b>\n` +
          `   Sig‘im: ${(g.student_ids || []).length} / ${g.capacity || 20} o‘quvchi\n` +
          `   Ustoz: ${g.teacher_name || 'Noma\'lum'}\n\n`;
      });
      await sendMessage(chatId, msgText, getSubMenuKeyboard());
      return;
    }

    if (text === '📅 Bugungi darslar') {
      const schedules = db.educo_db_lesson_schedules || [];
      const groups = db.educo_db_groups || [];
      const now = getTashkentNow();
      let dayOfWeek = now.getDay();
      if (dayOfWeek === 0) dayOfWeek = 7;

      const todaySchedules = schedules.filter((s) => s.day_of_week === dayOfWeek);
      if (todaySchedules.length === 0) {
        await sendMessage(chatId, `Bugun uchun dars jadvali topilmadi (Dam olish kuni).`, getSubMenuKeyboard());
        return;
      }

      let msgText = `📅 <b>Bugungi Darslar Jadvali (${todaySchedules.length} ta dars):</b>\n\n`;
      todaySchedules.forEach((s, idx) => {
        const group = groups.find((g) => g.id === s.group_id);
        msgText += `<b>${idx + 1}. ${group?.name || 'Guruh'}</b>\n` +
          `   🕒 Vaqt: ${s.start_time.slice(0, 5)} - ${s.end_time.slice(0, 5)}\n` +
          `   🚪 Xona: ${s.room || group?.room || 'Xona'}\n\n`;
      });
      await sendMessage(chatId, msgText, getSubMenuKeyboard());
      return;
    }

    if (text === '💳 Qarzdorlar ro‘yxati') {
      await sendMessage(
        chatId,
        `💳 <b>Qarzdorlik holati:</b>\n\nBarcha talabalar to‘lovlari nazoratda. Veb-sayt orqali to‘liq ro‘yxatni yuklab olishingiz mumkin.`,
        getSubMenuKeyboard()
      );
      return;
    }

    if (text === '📋 Bugungi davomat') {
      const todayStr = formatTashkentDate(getTashkentNow());
      const attendance = (db.educo_db_attendance || []).filter((a) => a.date === todayStr);

      const present = attendance.filter((a) => a.status === 'present').length;
      const late = attendance.filter((a) => a.status === 'late').length;
      const absent = attendance.filter((a) => a.status === 'absent').length;

      const msgText = `📋 <b>Bugungi Davomat Hisoboti (${todayStr}):</b>\n\n` +
        `🟢 Qatnashganlar: <b>${present} nafar</b>\n` +
        `🟡 Kech qolganlar: <b>${late} nafar</b>\n` +
        `🔴 Kelmaganlar: <b>${absent} nafar</b>\n` +
        `Jami qayd etilgan: <b>${attendance.length} nafar</b>`;
      await sendMessage(chatId, msgText, getSubMenuKeyboard());
      return;
    }
  }

  // --- IN-BOT ATTENDANCE & GRADING (FOR TEACHER, OWNER & ADMIN) ---
  if (role === 'teacher' || role === 'owner' || role === 'admin') {
    const allGroups = (db.educo_db_groups || []).filter((g) => g.status !== 'archived');
    const teacherId = session.userId;
    let targetGroups = (role === 'owner' || role === 'admin')
      ? allGroups
      : allGroups.filter((g) => g.teacher_id === teacherId || (g.teacher_name && g.teacher_name.toLowerCase().includes('abdulaziz')));

    if (targetGroups.length === 0) {
      targetGroups = allGroups; // Fallback so teacher can test with available groups
    }

    // 1. IN-BOT ATTENDANCE TRIGGER
    if (text === '📝 Tezkor davomat') {
      if (targetGroups.length === 0) {
        await sendMessage(chatId, `Markazda faol guruhlar topilmadi.`, getSubMenuKeyboard());
        return;
      }

      if (targetGroups.length === 1 && role === 'teacher') {
        // To'g'ridan-to'g'ri yagona guruh davomat panelini ochish
        await renderGroupAttendancePanel(chatId, null, targetGroups[0].id);
        return;
      }

      const groupButtons = targetGroups.slice(0, 15).map((g) => {
        const todayStr = formatTashkentDate(getTashkentNow());
        const gAtt = (db.educo_db_attendance || []).filter(a => a.group_id === g.id && a.date === todayStr);
        const p = gAtt.filter(a => a.status === 'present').length;
        const l = gAtt.filter(a => a.status === 'late').length;
        const ab = gAtt.filter(a => a.status === 'absent').length;
        const attBadge = gAtt.length > 0 ? ` (🟢${p} 🟡${l} 🔴${ab})` : '';

        const st = checkGroupLessonStatus(g, db, session, session.forceBypass?.[g.id]);
        let timeBadge = '';
        if (st.canProceed) {
          timeBadge = ' 🟢 [Dars vaqti]';
        } else if (st.reason === 'not_started_yet') {
          timeBadge = ` ⏳ [${st.startTime}]`;
        } else {
          timeBadge = ` 📅 [${getGroupLessonDaysSummary(g)}]`;
        }

        return [{ text: `👥 ${g.name}${attBadge}${timeBadge}`, callback_data: `att_g:${g.id}` }];
      });

      await sendMessage(
        chatId,
        `📝 <b>Davomat Nazorati:</b> Qaysi guruh davomatini ko‘rmoqchisiz / yangilamoqchisiz?`,
        { reply_markup: { inline_keyboard: groupButtons } }
      );
      return;
    }

    // 2. IN-BOT GRADING TRIGGER
    if (text === '🌟 Baholar') {
      if (targetGroups.length === 0) {
        await sendMessage(chatId, `Markazda faol guruhlar topilmadi.`, getSubMenuKeyboard());
        return;
      }

      if (targetGroups.length === 1) {
        await renderGroupGradingPanel(chatId, null, targetGroups[0].id);
        return;
      }

      const groupButtons = targetGroups.slice(0, 15).map((g) => {
        const st = checkGroupLessonStatus(g, db, session, session.forceBypass?.[g.id]);
        let timeBadge = '';
        if (st.canProceed) {
          timeBadge = ' 🟢 [Dars vaqti]';
        } else if (st.reason === 'not_started_yet') {
          timeBadge = ` ⏳ [${st.startTime}]`;
        } else {
          timeBadge = ` 📅 [${getGroupLessonDaysSummary(g)}]`;
        }
        return [{ text: `👥 ${g.name}${timeBadge}`, callback_data: `grd_g:${g.id}` }];
      });

      await sendMessage(
        chatId,
        `🌟 <b>Baholash:</b> Qaysi guruh o‘quvchilariga baho qo‘ymoqchisiz?`,
        { reply_markup: { inline_keyboard: groupButtons } }
      );
      return;
    }
  }

  // --- TEACHER SPECIFIC HANDLERS ---
  if (role === 'teacher') {
    const teacherId = session.userId;
    const allGroups = (db.educo_db_groups || []).filter((g) => g.status !== 'archived');
    const myGroups = allGroups.filter((g) => g.teacher_id === teacherId || (g.teacher_name && g.teacher_name.toLowerCase().includes('abdulaziz')));

    if (text === '📅 Haftalik dars jadvalim') {
      const myGroupIds = myGroups.map((g) => g.id);
      const schedules = (db.educo_db_lesson_schedules || []).filter((s) => myGroupIds.includes(s.group_id));

      const dayNames = {
        1: 'Dushanba', 2: 'Seshanba', 3: 'Chorshanba',
        4: 'Payshanba', 5: 'Juma', 6: 'Shanba', 7: 'Yakshanba'
      };

      if (schedules.length === 0) {
        await sendMessage(chatId, `Sizga biriktirilgan dars jadvali topilmadi.`, getSubMenuKeyboard());
        return;
      }

      let msgText = `📅 <b>Hurmatli ustoz, haftalik dars jadvalingiz:</b>\n\n`;
      schedules.sort((a, b) => a.day_of_week - b.day_of_week).forEach((s) => {
        const grp = myGroups.find((g) => g.id === s.group_id);
        msgText += `📌 <b>${dayNames[s.day_of_week]}:</b> ${grp?.name || 'Guruh'}\n` +
          `   🕒 ${s.start_time.slice(0, 5)} - ${s.end_time.slice(0, 5)} | 🚪 ${s.room || 'Xona'}\n\n`;
      });
      await sendMessage(chatId, msgText, getSubMenuKeyboard());
      return;
    }

    if (text === '👥 Mening guruhlarim') {
      if (myGroups.length === 0) {
        await sendMessage(chatId, `Sizga hali guruh biriktirilmagan.`, getSubMenuKeyboard());
        return;
      }
      let msgText = `👥 <b>Sizning Guruhlaringiz (${myGroups.length} ta):</b>\n\n`;
      myGroups.forEach((g, idx) => {
        msgText += `<b>${idx + 1}. ${g.name}</b>\n` +
          `   📚 Yo‘nalish: ${g.course_name || g.direction || 'Fan'}\n` +
          `   👥 O‘quvchilar: ${(g.student_ids || []).length} nafar\n` +
          `   🚪 Xona: ${g.room || 'Xona'}\n\n`;
      });
      await sendMessage(chatId, msgText, getSubMenuKeyboard());
      return;
    }
  }

  // --- STUDENT HANDLERS ---
  if (role === 'student') {
    const studentId = session.userId;

    if (text === '📊 Mening davomatim') {
      const attendance = (db.educo_db_attendance || []).filter((a) => a.student_id === studentId);
      const present = attendance.filter((a) => a.status === 'present').length;
      const late = attendance.filter((a) => a.status === 'late').length;
      const absent = attendance.filter((a) => a.status === 'absent').length;
      const total = attendance.length;
      const rate = total > 0 ? Math.round(((present + late * 0.5) / total) * 100) : 100;

      let msgText = `📊 <b>Sizning Davomatingiz:</b>\n\n` +
        `🟢 Qatnashgan darslar: <b>${present} ta</b>\n` +
        `🟡 Kech qolingan: <b>${late} ta</b>\n` +
        `🔴 Qatnashilmagan (kelmagan): <b>${absent} ta</b>\n` +
        `📈 Umumiy davomat ko‘rsatkichi: <b>${rate}%</b>\n\n` +
        `<b>So‘nggi qaydlar:</b>\n`;

      attendance.slice(-5).reverse().forEach((a) => {
        const icon = a.status === 'present' ? '🟢 Bor' : (a.status === 'late' ? '🟡 Kech qoldi' : '🔴 Kelmadi');
        msgText += `• ${formatUzDatePretty(a.date)}: ${icon} ${a.remark ? `(${a.remark})` : ''}\n`;
      });

      await sendMessage(chatId, msgText, getSubMenuKeyboard());
      return;
    }

    if (text === '🌟 Mening baholarim') {
      const grades = (db.educo_db_grades || []).filter((g) => g.student_id === studentId);
      if (grades.length === 0) {
        await sendMessage(chatId, `🌟 Sizga hali baho qo‘yilmagan. Darslarda faol bo‘ling!`, getSubMenuKeyboard());
        return;
      }
      let msgText = `🌟 <b>Sizning Baholaringiz:</b>\n\n`;
      grades.slice(-6).reverse().forEach((g, idx) => {
        msgText += `<b>${idx + 1}. Ball: ${g.grade_value}</b> | ${g.topic || 'Mavzu'}\n` +
          `   Ustoz izohi: <i>"${g.feedback || 'A\'lo'}"</i>\n\n`;
      });
      await sendMessage(chatId, msgText, getSubMenuKeyboard());
      return;
    }

    if (text === '📚 Uyga vazifalar') {
      const homeworks = db.educo_db_homework || [];
      if (homeworks.length === 0) {
        await sendMessage(chatId, `Hozircha faol uyga vazifalar yo‘q.`, getSubMenuKeyboard());
        return;
      }
      let msgText = `📚 <b>Uyga Vazifalar:</b>\n\n`;
      homeworks.slice(-3).reverse().forEach((hw) => {
        msgText += `📝 <b>${hw.title || 'Vazifa'}</b>\n` +
          `   Tavsif: ${hw.description || 'Vazifani bajaring'}\n` +
          `   Muddat: ${hw.due_date || 'Keyingi darsgacha'}\n\n`;
      });
      await sendMessage(chatId, msgText, getSubMenuKeyboard());
      return;
    }

    if (text === '💳 To‘lovlarim va Balans') {
      const payments = (db.educo_db_payments || []).filter((p) => p.student_id === studentId);
      let paid = 0;
      payments.forEach((p) => (paid += Number(p.amount) || 0));

      const msgText = `💳 <b>O‘quv To‘lovlari:</b>\n\n` +
        `✅ Jami to‘langan: <b>${paid.toLocaleString('uz-UZ')} so‘m</b>\n` +
        `📌 Holat: <b>Faol</b>\n\n` +
        `Har qanday to‘lov savollari bo‘yicha markaz administratoriga murojaat qilishingiz mumkin.`;
      await sendMessage(chatId, msgText, getSubMenuKeyboard());
      return;
    }

    if (text === '📅 Dars jadvalim') {
      const user = (db.educo_db_users || []).find((u) => u.id === studentId);
      const groupIds = user?.group_ids || (user?.group_id ? [user.group_id] : []);
      const schedules = (db.educo_db_lesson_schedules || []).filter((s) => groupIds.includes(s.group_id));

      const dayNames = {
        1: 'Dushanba', 2: 'Seshanba', 3: 'Chorshanba',
        4: 'Payshanba', 5: 'Juma', 6: 'Shanba', 7: 'Yakshanba'
      };

      if (schedules.length === 0) {
        await sendMessage(chatId, `Sizga hali dars jadvali biriktirilmagan.`, getSubMenuKeyboard());
        return;
      }

      let msgText = `📅 <b>Sizning Haftalik Dars Jadvalingiz:</b>\n\n`;
      schedules.sort((a, b) => a.day_of_week - b.day_of_week).forEach((s) => {
        const group = (db.educo_db_groups || []).find((g) => g.id === s.group_id);
        msgText += `📌 <b>${dayNames[s.day_of_week]}:</b> ${group?.name || 'Guruh'}\n` +
          `   🕒 ${s.start_time.slice(0, 5)} - ${s.end_time.slice(0, 5)} | 🚪 ${s.room || 'Xona'}\n\n`;
      });
      await sendMessage(chatId, msgText, getSubMenuKeyboard());
      return;
    }

    if (text === '🔐 LMS Saytiga kirish') {
      const user = (db.educo_db_users || []).find((u) => u.id === studentId);
      const msgText = `🔐 <b>EDUCO LMS Shaxsiy Kabinetingiz:</b>\n\n` +
        `🌐 <b>Sayt:</b> https://educo-lms.pages.dev/login\n` +
        `👤 <b>Login:</b> <code>${user?.username || 'login'}</code>\n` +
        `🔑 <b>Parol:</b> <code>${user?.password || 'Parol markazdan beriladi'}</code>\n\n` +
        `Saytga kirib dars materiallari, onlayn testlar va uy vazifalarini ko‘rishingiz mumkin.`;
      await sendMessage(chatId, msgText, getSubMenuKeyboard());
      return;
    }
  }

  // --- PARENT HANDLERS ---
  if (role === 'parent') {
    const children = session.children || [];
    let activeChild = children.find((c) => c.id === session.activeChildId) || children[0];

    // Child switcher
    if (text === '👶 Farzandni tanlash') {
      const childButtons = children.map((c) => [
        { text: `👦 ${c.name}`, callback_data: `child_sel:${c.id}` }
      ]);
      await sendMessage(
        chatId,
        `Qaysi farzandingiz ma’lumotlarini ko‘rmoqchisiz?`,
        { reply_markup: { inline_keyboard: childButtons } }
      );
      return;
    }

    // Sababnoma yuborish
    if (text === '💬 Sababnoma yuborish') {
      session.state = 'parent_writing_reason';
      sessions[chatId] = session;
      saveSessions(sessions);

      await sendMessage(
        chatId,
        `💬 <b>Dars qoldirish haqida sababnoma:</b>\n\n` +
        `Farzandingiz <b>${activeChild?.name}</b> bugun darsga qatnasha olmaslik sababini yozib yuboring (masalan: <i>"Tobi qochgani sababli bugun darsga bora olmaydi"</i>):\n\n` +
        `Ushbu xabar darhol guruh ustozi va markaz ma’muriyatiga yetkaziladi.`,
        getSubMenuKeyboard()
      );
      return;
    }

    if (text === '📊 Farzandim davomati') {
      if (!activeChild) {
        await sendMessage(chatId, `Farzand ma'lumotlari topilmadi.`, getSubMenuKeyboard());
        return;
      }
      const attendance = (db.educo_db_attendance || []).filter((a) => a.student_id === activeChild.id);
      const present = attendance.filter((a) => a.status === 'present').length;
      const late = attendance.filter((a) => a.status === 'late').length;
      const absent = attendance.filter((a) => a.status === 'absent').length;
      const total = attendance.length;
      const rate = total > 0 ? Math.round(((present + late * 0.5) / total) * 100) : 100;

      let msgText = `📊 <b>Farzandingiz (${activeChild.name}) Davomati:</b>\n\n` +
        `🟢 Darsga qatnashgan: <b>${present} marta</b>\n` +
        `🟡 Darsga kechikkan: <b>${late} marta</b>\n` +
        `🔴 Darsga kelmagan: <b>${absent} marta</b>\n` +
        `📈 Qatnashish darajasi: <b>${rate}%</b>\n\n` +
        `<b>So‘nggi darslar qaydi:</b>\n`;

      if (attendance.length === 0) {
        msgText += `<i>Hozircha davomat yozilmagan.</i>`;
      } else {
        attendance.slice(-5).reverse().forEach((a) => {
          const icon = a.status === 'present' ? '🟢 Qatnashdi' : (a.status === 'late' ? '🟡 Kech qoldi' : '🔴 Kelmadi');
          msgText += `• ${formatUzDatePretty(a.date)}: ${icon} ${a.remark ? `(${a.remark})` : ''}\n`;
        });
      }

      await sendMessage(chatId, msgText, getSubMenuKeyboard());
      return;
    }

    if (text === '🌟 Farzandim baholari') {
      if (!activeChild) return;
      const grades = (db.educo_db_grades || []).filter((g) => g.student_id === activeChild.id);
      if (grades.length === 0) {
        await sendMessage(
          chatId,
          `Farzandingiz <b>${activeChild.name}</b> uchun hali baho kiritilmagan.`,
          getSubMenuKeyboard()
        );
        return;
      }
      let msgText = `🌟 <b>Farzandingiz (${activeChild.name}) Baholari:</b>\n\n`;
      grades.slice(-6).reverse().forEach((g, idx) => {
        msgText += `<b>${idx + 1}. Baho: ${g.grade_value}</b> | ${g.topic || 'Dars'}\n` +
          `   Ustoz fikri: <i>"${g.feedback || 'Yaxshi'}"</i>\n\n`;
      });
      await sendMessage(chatId, msgText, getSubMenuKeyboard());
      return;
    }

    if (text === '💳 To‘lov holati') {
      if (!activeChild) return;
      const payments = (db.educo_db_payments || []).filter((p) => p.student_id === activeChild.id);
      let paid = 0;
      payments.forEach((p) => (paid += Number(p.amount) || 0));

      const msgText = `💳 <b>Farzandingiz (${activeChild.name}) To‘lov Holati:</b>\n\n` +
        `💵 Jami to‘langan summa: <b>${paid.toLocaleString('uz-UZ')} so‘m</b>\n` +
        `📌 Holati: <b>Faol ta'lim oluvchi</b>\n\n` +
        `To‘lov kvitansiyalari markaz kassasida rasmiylashtirilgan.`;
      await sendMessage(chatId, msgText, getSubMenuKeyboard());
      return;
    }

    if (text === '📅 Dars jadvali') {
      if (!activeChild) return;
      const user = (db.educo_db_users || []).find((u) => u.id === activeChild.id);
      const groupIds = user?.group_ids || (user?.group_id ? [user.group_id] : []);
      const schedules = (db.educo_db_lesson_schedules || []).filter((s) => groupIds.includes(s.group_id));

      const dayNames = {
        1: 'Dushanba', 2: 'Seshanba', 3: 'Chorshanba',
        4: 'Payshanba', 5: 'Juma', 6: 'Shanba', 7: 'Yakshanba'
      };

      if (schedules.length === 0) {
        await sendMessage(chatId, `Farzandingizga hali dars jadvali biriktirilmagan.`, getSubMenuKeyboard());
        return;
      }

      let msgText = `📅 <b>Farzandingiz (${activeChild.name}) Dars Jadvali:</b>\n\n`;
      schedules.sort((a, b) => a.day_of_week - b.day_of_week).forEach((s) => {
        const group = (db.educo_db_groups || []).find((g) => g.id === s.group_id);
        msgText += `📌 <b>${dayNames[s.day_of_week]}:</b> ${group?.name || 'Guruh'}\n` +
          `   🕒 ${s.start_time.slice(0, 5)} - ${s.end_time.slice(0, 5)} | 🚪 ${s.room || 'Xona'}\n\n`;
      });
      await sendMessage(chatId, msgText, getSubMenuKeyboard());
      return;
    }

    if (text === '📞 Markaz bilan bog‘lanish') {
      const msgText = `📞 <b>EDUCO O‘quv Markazi Aloqa Ma'lumotlari:</b>\n\n` +
        `🏢 <b>Markaz:</b> EDUCO LMS Ta'lim Markazi\n` +
        `📞 <b>Telefon:</b> +998 98 800 14 15\n` +
        `🕒 <b>Ish vaqti:</b> Dushanba - Shanba, 08:30 - 20:00\n` +
        `📍 <b>Manzil:</b> Asosiy bino, Qabul bo‘limi`;
      await sendMessage(chatId, msgText, getSubMenuKeyboard());
      return;
    }
  }

  // Parent Sababnoma receiver
  if (session.state === 'parent_writing_reason') {
    const children = session.children || [];
    const activeChild = children.find((c) => c.id === session.activeChildId) || children[0];
    const todayPretty = formatUzDatePretty(formatTashkentDate(getTashkentNow()));

    const alertText = `📩 <b>Ota-onadan Dars Qoldirish Haqida Sababnoma:</b>\n\n` +
      `👤 Farzand: <b>${activeChild?.name || 'O‘quvchi'}</b>\n` +
      `📞 Ota-ona telefoni: <code>${session.phone}</code>\n` +
      `📅 Sana: <b>${todayPretty}</b>\n\n` +
      `💬 <b>Sabab:</b>\n<i>"${text}"</i>`;

    // Notify all Admins and Owner on Telegram
    const allSessions = getSessions();
    for (const [sChatId, sData] of Object.entries(allSessions)) {
      if (sData.role === 'owner' || sData.role === 'admin' || sData.role === 'teacher') {
        await sendMessage(sChatId, alertText);
      }
    }

    session.state = 'main';
    sessions[chatId] = session;
    saveSessions(sessions);

    await sendMessage(
      chatId,
      `✅ <b>Sababnomangiz qabul qilindi!</b>\n\nXabar guruh mentori va o‘quv markazi ma’muriyatiga zudlik bilan yetkazildi.`,
      getMainMenuKeyboard(session)
    );
    return;
  }

  // Fallback for unrecognized text
  await sendMessage(
    chatId,
    `Iltimos, pastdagi menyu tugmalaridan birini tanlang:`,
    getMainMenuKeyboard(session)
  );
}

// --- REAL-TIME ATTENDANCE & GRADE TRIGGER FUNCTIONS ---
export async function sendAttendanceTelegramNotification({ studentId, status, remark, courseName = 'Dars', teacherName = 'Fan mentori', lessonTime = '09:30 - 10:50' }) {
  try {
    const db = getDb();
    const student = (db.educo_db_users || []).find((u) => u.id === studentId);
    if (!student) return;

    const studentName = student.fullName || student.full_name || `${student.first_name || ''} ${student.last_name || ''}`.trim();
    const now = getTashkentNow();
    const todayPretty = formatUzDatePretty(formatTashkentDate(now));

    let studentMsg = '';
    let parentMsg = '';

    if (status === 'present') {
      studentMsg = `🟢 Hurmatli <b>${studentName}</b>,\n\n` +
        `Siz <b>${courseName}</b> fanidan ${todayPretty} sanasidagi darsga <b>qatnashdingiz</b>. Dars ${lessonTime} oralig‘ida o‘tkazildi.\n\n` +
        `Biz sizning bilim olishdagi qat'iyatingiz va ishtiyoqingizni yuqori baholaymiz.\n\n` +
        `Hurmat bilan, Fan mentori <b>${teacherName}</b>`;

      parentMsg = `🟢 Hurmatli Ota-ona,\n\n` +
        `Farzandingiz <b>${studentName}</b> <b>${courseName}</b> fanidan ${todayPretty} sanasidagi darsga <b>qatnashdi</b>. Dars ${lessonTime} oralig‘ida o‘tkazildi.\n\n` +
        `Biz farzandingizning bilim olishdagi intilishi va ishtiyoqini yuqori baholaymiz.\n\n` +
        `Hurmat bilan, Fan mentori <b>${teacherName}</b>`;
    } else if (status === 'late') {
      studentMsg = `🟡 Hurmatli <b>${studentName}</b>,\n\n` +
        `Siz <b>${courseName}</b> fanidan ${todayPretty} kungi darsga <b>KECH QOLIB keldingiz</b>. Dars ${lessonTime} oralig‘ida o‘tkazilmoqda.\n\n` +
        `Iltimos, darslarga o‘z vaqtida kelishingizni so‘raymiz.\n\n` +
        `Hurmat bilan, Fan mentori <b>${teacherName}</b>`;

      parentMsg = `🟡 Hurmatli Ota-ona,\n\n` +
        `Farzandingiz <b>${studentName}</b> <b>${courseName}</b> fanidan ${todayPretty} kungi darsga <b>KECH QOLIB yetib keldi</b>. Dars ${lessonTime} oralig‘ida o‘tkazilmoqda.\n\n` +
        `Iltimos, darslarga o‘z vaqtida qatnashishni nazorat qilishingizni so‘raymiz.\n\n` +
        `Hurmat bilan, Fan mentori <b>${teacherName}</b>`;
    } else {
      studentMsg = `🔴 DIQQAT: Hurmatli <b>${studentName}</b>,\n\n` +
        `Siz bugun (${todayPretty}) <b>${courseName}</b> fanidan darsda <b>QATNASHMADINGIZ (Darsga kelmadingiz)</b>. Dars vaqti: ${lessonTime}.\n\n` +
        `Sababini ma’muriyatga ma’lum qilishingizni so‘raymiz.\n\n` +
        `Hurmat bilan, EDUCO LMS Ma’muriyati`;

      parentMsg = `🔴 DIQQAT: Hurmatli Ota-ona,\n\n` +
        `Farzandingiz <b>${studentName}</b> bugun (${todayPretty}) <b>${courseName}</b> fanidan darsda <b>QATNASHMADI (Darsga kelmadi)</b>. Dars vaqti: ${lessonTime}.\n\n` +
        `Sababini aniqlashtirish uchun o‘quv markazi ma’muriyati bilan bog‘lanishingizni so‘raymiz.\n\n` +
        `Hurmat bilan, EDUCO LMS Ma’muriyati`;
    }

    const sessions = getSessions();
    const stClean = cleanPhone(student.phone);
    const fClean = cleanPhone(student.father_phone || student.fatherPhone);
    const mClean = cleanPhone(student.mother_phone || student.motherPhone);
    const pClean = cleanPhone(student.parent_phone || student.parentPhone);

    for (const [chatId, sess] of Object.entries(sessions)) {
      const sessClean = cleanPhone(sess.phone);
      if (!sessClean) continue;

      // Send to student
      if (sess.role === 'student' && sessClean === stClean) {
        await sendMessage(chatId, studentMsg);
      }

      // Send to parent
      if (sess.role === 'parent') {
        const isParent = [fClean, mClean, pClean].filter(Boolean).some((p) => p === sessClean || p.endsWith(sessClean.slice(-9)));
        if (isParent) {
          await sendMessage(chatId, parentMsg);
        }
      }
    }
  } catch (err) {
    console.error('[Bot Attendance Notify Error]:', err.message);
  }
}

export async function sendGradeTelegramNotification({
  studentId,
  gradeValue,
  topic = 'Dars amaliy mashg‘uloti',
  feedback,
  teacherName = 'Fan mentori',
  courseName = 'Dars',
}) {
  try {
    const db = getDb();
    const student = (db.educo_db_users || []).find((u) => u.id === studentId);
    if (!student) return;

    const studentName = student.fullName || student.full_name || `${student.first_name || ''} ${student.last_name || ''}`.trim();
    const now = getTashkentNow();
    const todayPretty = formatUzDatePretty(formatTashkentDate(now));
    const scoreNum = Number(gradeValue) || 5;
    const scoreStars = '⭐'.repeat(Math.max(1, Math.min(5, scoreNum)));
    const finalFeedback = feedback || GRADE_FEEDBACK_MAP[scoreNum] || 'A\'lo darajada';

    const text = `⭐ <b>Dars natijangiz baholandi!</b>\n\n` +
      `Hurmatli <b>${studentName}</b>, siz bugungi <b>${courseName}</b> darsidagi faolligingiz uchun baholandingiz:\n\n` +
      `🎯 <b>Natija:</b> ${scoreNum} ball ${scoreStars}\n` +
      `📅 <b>Sana:</b> ${todayPretty}\n` +
      `📝 <b>Mavzu:</b> ${topic}\n` +
      `💬 <b>Mentor fikri:</b> <i>"${finalFeedback}"</i>\n\n` +
      `👨‍🏫 <b>Mentor:</b> ${teacherName}\n` +
      `<i>Ilm olishdagi intilishingizni qo‘llab-quvvatlaymiz!</i>`;

    const parentText = `⭐ <b>Farzandingiz darsda baholandi!</b>\n\n` +
      `Hurmatli Ota-ona, farzandingiz <b>${studentName}</b> bugun <b>${courseName}</b> darsida yangi natijaga erishdi:\n\n` +
      `🎯 <b>Baho:</b> ${scoreNum} ball ${scoreStars}\n` +
      `📅 <b>Sana:</b> ${todayPretty}\n` +
      `📝 <b>Mavzu:</b> ${topic}\n` +
      `💬 <b>Mentor fikri:</b> <i>"${finalFeedback}"</i>\n\n` +
      `👨‍🏫 <b>Mentor:</b> ${teacherName}\n` +
      `<i>Farzandingiz ta'limiga ko‘rsatayotgan e'tiboringiz uchun tashakkur!</i>`;

    const sessions = getSessions();
    const stClean = cleanPhone(student.phone);
    const fClean = cleanPhone(student.father_phone || student.fatherPhone);
    const mClean = cleanPhone(student.mother_phone || student.motherPhone);
    const pClean = cleanPhone(student.parent_phone || student.parentPhone);

    for (const [chatId, sess] of Object.entries(sessions)) {
      const sessClean = cleanPhone(sess.phone);
      if (!sessClean) continue;
      if (sess.role === 'student' && sessClean === stClean) {
        await sendMessage(chatId, text);
      }
      if (sess.role === 'parent') {
        const isParent = [fClean, mClean, pClean].filter(Boolean).some((p) => p === sessClean || p.endsWith(sessClean.slice(-9)));
        if (isParent) {
          await sendMessage(chatId, parentText);
        }
      }
    }
  } catch (err) {
    console.error('[Bot Grade Notify Error]:', err.message);
  }
}

// --- 20-MINUTE LESSON REMINDER CRON DAEMON ---
const notifiedLessonsCache = new Set();

async function checkAndSend20MinuteLessonReminders() {
  try {
    const db = getDb();
    const schedules = db.educo_db_lesson_schedules || [];
    const groups = db.educo_db_groups || [];
    const users = db.educo_db_users || [];
    const sessions = getSessions();

    const now = getTashkentNow();
    let currentDayOfWeek = now.getDay();
    if (currentDayOfWeek === 0) currentDayOfWeek = 7;

    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTotalMinutes = currentHours * 60 + currentMinutes;

    for (const sch of schedules) {
      if (sch.day_of_week !== currentDayOfWeek) continue;
      if (!sch.start_time) continue;

      const [startH, startM] = sch.start_time.split(':').map(Number);
      const startTotalMinutes = startH * 60 + startM;

      // Difference in minutes between class start and now
      const diffMinutes = startTotalMinutes - currentTotalMinutes;

      // 20 minutes notification window (19 to 21 min)
      if (diffMinutes >= 19 && diffMinutes <= 21) {
        const todayStr = formatTashkentDate(now);
        const cacheKey = `${todayStr}-${sch.id}`;
        if (notifiedLessonsCache.has(cacheKey)) continue;

        notifiedLessonsCache.add(cacheKey);

        const group = groups.find((g) => g.id === sch.group_id);
        if (!group) continue;

        const teacher = users.find((u) => u.id === group.teacher_id);
        const teacherName = teacher?.fullName || group.teacher_name || 'Fan mentori';
        const courseName = group.course_name || group.name || 'Dars';
        const room = sch.room || group.room || 'Xona';
        const timeStr = `${sch.start_time.slice(0, 5)} - ${sch.end_time?.slice(0, 5) || ''}`;

        // 1. Notify Teacher
        if (teacher) {
          const tClean = cleanPhone(teacher.phone);
          for (const [chatId, sess] of Object.entries(sessions)) {
            if (sess.role === 'teacher' && cleanPhone(sess.phone) === tClean) {
              const teacherReminder = `🔔 <b>Dars eslatmasi (20 daqiqa qoldi)!</b>\n\n` +
                `Hurmatli <b>${teacherName}</b>, 20 daqiqadan so‘ng darsingiz boshlanadi.\n` +
                `📚 <b>Fan:</b> ${courseName}\n` +
                `👥 <b>Guruh:</b> ${group.name}\n` +
                `🕒 <b>Vaqti:</b> ${timeStr}\n` +
                `🚪 <b>Xona:</b> ${room}\n\n` +
                `<i>Talabalar sizni kutmoqda!</i>`;
              await sendMessage(chatId, teacherReminder);
            }
          }
        }

        // 2. Notify Students & Parents
        const studentIds = group.student_ids || [];
        for (const stId of studentIds) {
          const student = users.find((u) => u.id === stId);
          if (!student) continue;

          const stClean = cleanPhone(student.phone);
          const fClean = cleanPhone(student.father_phone || student.fatherPhone);
          const mClean = cleanPhone(student.mother_phone || student.motherPhone);
          const pClean = cleanPhone(student.parent_phone || student.parentPhone);

          const studentReminder = `🔔 <b>Darsingiz boshlanishiga 20 daqiqa qoldi!</b>\n\n` +
            `📚 <b>Fan:</b> ${courseName}\n` +
            `🕒 <b>Vaqt:</b> ${timeStr}\n` +
            `👨‍🏫 <b>Ustoz:</b> ${teacherName}\n` +
            `🚪 <b>Xona:</b> ${room}\n\n` +
            `<i>Darsga kechikmasdan kelishingizni so‘raymiz!</i>`;

          for (const [chatId, sess] of Object.entries(sessions)) {
            const sessClean = cleanPhone(sess.phone);
            if (!sessClean) continue;
            if (sess.role === 'student' && sessClean === stClean) {
              await sendMessage(chatId, studentReminder);
            }
            if (sess.role === 'parent') {
              const isParent = [fClean, mClean, pClean].filter(Boolean).some((p) => p === sessClean || p.endsWith(sessClean.slice(-9)));
              if (isParent) {
                const parentReminder = `🔔 <b>Farzandingiz darsiga 20 daqiqa qoldi!</b>\n\n` +
                  `Farzandingiz <b>${student.fullName || student.name}</b> uchun ${courseName} darsi 20 daqiqadan so‘ng (${timeStr}) boshlanadi.\n` +
                  `🚪 Xona: ${room}\nUstoz: ${teacherName}`;
                await sendMessage(chatId, parentReminder);
              }
            }
          }
        }
      }
    }
  } catch (e) {
    console.error('[Bot Cron Reminder Error]:', e.message);
  }
}

// --- 45-MINUTE (DARS TENG YARMI) LESSON HALF-TIME & ABSENCE CRON ---
const notifiedHalfTimeTeacherAlerts = new Set();
const notifiedHalfTimeAbsents = new Set();

async function checkLessonHalfTimeStatus() {
  try {
    const db = getDb();
    const schedules = db.educo_db_lesson_schedules || [];
    const groups = db.educo_db_groups || [];
    const users = db.educo_db_users || [];
    const sessions = getSessions();

    const now = getTashkentNow();
    let currentDayOfWeek = now.getDay();
    if (currentDayOfWeek === 0) currentDayOfWeek = 7;

    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTotalMinutes = currentHours * 60 + currentMinutes;
    const todayStr = formatTashkentDate(now);
    const todayPretty = formatUzDatePretty(todayStr);

    let dbModified = false;

    for (const sch of schedules) {
      if (sch.day_of_week !== currentDayOfWeek) continue;
      if (!sch.start_time) continue;

      const [startH, startM] = sch.start_time.split(':').map(Number);
      const startTotalMinutes = startH * 60 + startM;

      let duration = 90; // Standart 1 soat 30 daqiqa
      if (sch.end_time) {
        const [endH, endM] = sch.end_time.split(':').map(Number);
        const dur = (endH * 60 + endM) - startTotalMinutes;
        if (dur > 0) duration = dur;
      }

      const halfTimeMinutes = Math.floor(duration / 2); // 45 daqiqa
      const minutesSinceStart = currentTotalMinutes - startTotalMinutes;

      // Darsning teng yarmi (masalan 45-47 daqiqa) oynasi
      if (minutesSinceStart >= halfTimeMinutes && minutesSinceStart <= halfTimeMinutes + 2) {
        const group = groups.find((g) => g.id === sch.group_id);
        if (!group) continue;

        const students = getGroupStudents(group.id);
        if (students.length === 0) continue;

        const teacher = users.find((u) => u.id === group.teacher_id);
        const teacherName = teacher?.fullName || group.teacher_name || 'Fan mentori';
        const courseName = group.course_name || group.name || 'Dars';
        const timeStr = `${sch.start_time.slice(0, 5)} - ${sch.end_time?.slice(0, 5) || ''}`;
        const room = sch.room || group.room || 'Xona';

        const groupAtt = (db.educo_db_attendance || []).filter(
          (a) => a.group_id === group.id && a.date === todayStr
        );

        const hasAnyAttendance = groupAtt.length > 0;
        const hasFinalized = groupAtt.some((a) => a.finalized === true);

        // 1. O'qituvchi hali davomat qilmagan bo'lsa: Shoshilinch ogohlantirish (Bot va LMS Platforma)
        if (!hasAnyAttendance || !hasFinalized) {
          const teacherAlertKey = `${todayStr}-${sch.id}-teacher-ht`;
          if (!notifiedHalfTimeTeacherAlerts.has(teacherAlertKey)) {
            notifiedHalfTimeTeacherAlerts.add(teacherAlertKey);

            // A) Telegram orqali o'qituvchiga shoshilinch xabar
            if (teacher) {
              const tClean = cleanPhone(teacher.phone);
              for (const [chatId, sess] of Object.entries(sessions)) {
                if (sess.role === 'teacher' && cleanPhone(sess.phone) === tClean) {
                  const urgentMsg = `⏰ <b>SHOSHILINCH: Darsning yarmi (${halfTimeMinutes} daqiqa) o‘tdi!</b>\n\n` +
                    `Hurmatli <b>${teacherName}</b>!\n` +
                    `«<b>${group.name}</b>» guruhi darsi boshlanganiga <b>${halfTimeMinutes} daqiqa</b> bo‘ldi, ammo davomat hali yakunlanmagan!\n\n` +
                    `🕒 <b>Dars vaqti:</b> ${timeStr}\n` +
                    `🚪 <b>Xona:</b> ${room}\n\n` +
                    `<i>Iltimos, zudlik bilan davomatni belgilang va saqlang:</i>`;

                  await sendMessage(chatId, urgentMsg, {
                    reply_markup: {
                      inline_keyboard: [
                        [{ text: '📝 Hozir davomat qilish', callback_data: `att_g:${group.id}` }],
                        [{ text: '🏠 Bosh menyu', callback_data: 'nav_home' }]
                      ]
                    }
                  });
                }
              }
            }

            // B) LMS Platformasiga (Notification markazi) yozish
            if (!db.educo_db_notifications) db.educo_db_notifications = [];
            db.educo_db_notifications.push({
              id: `notif-ht-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              user_id: group.teacher_id,
              title: `⏰ Shoshilinch: Darsning yarmi (${halfTimeMinutes} daqiqa) o‘tdi!`,
              message: `«${group.name}» guruhi darsi boshlanganiga ${halfTimeMinutes} daqiqa bo‘ldi. Davomat hali olinmadi. Iltimos, darhol belgilang!`,
              type: 'warning',
              is_read: false,
              link: '/attendance',
              created_at: new Date().toISOString(),
            });
            dbModified = true;
          }
        }

        // 2. 45 daqiqa ichida kelmagan o'quvchilarni platformada KELMADI deb saqlash va ota-onaga yuborish
        if (!db.educo_db_attendance) db.educo_db_attendance = [];
        let autoAbsentCount = 0;

        for (const st of students) {
          const existingAttIdx = db.educo_db_attendance.findIndex(
            (a) => a.student_id === st.id && a.date === todayStr && a.group_id === group.id
          );
          const currentRec = existingAttIdx >= 0 ? db.educo_db_attendance[existingAttIdx] : null;

          // Agar o'quvchi 'present' bo'lmasa (ya'ni 'absent' yoki umuman belgilanmagan bo'lsa)
          if (!currentRec || currentRec.status !== 'present') {
            const absentKey = `${todayStr}-${group.id}-${st.id}-absent45`;
            if (!notifiedHalfTimeAbsents.has(absentKey)) {
              notifiedHalfTimeAbsents.add(absentKey);

              const updatedRec = {
                id: currentRec ? currentRec.id : `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                student_id: st.id,
                group_id: group.id,
                date: todayStr,
                status: 'absent',
                remark: `Darsning ${halfTimeMinutes}-daqiqasigacha yetib kelmadi (Avtomatik rasmiylashtirildi)`,
                recorded_by: currentRec?.recorded_by || group.teacher_id || 'system',
                finalized: true,
                updated_at: new Date().toISOString(),
              };

              if (existingAttIdx >= 0) db.educo_db_attendance[existingAttIdx] = updatedRec;
              else db.educo_db_attendance.push(updatedRec);

              dbModified = true;
              autoAbsentCount++;

              // Talaba va ota-onaga 'Kelmadi' xabarnomasini yuborish
              await sendAttendanceTelegramNotification({
                studentId: st.id,
                status: 'absent',
                remark: `Darsning ${halfTimeMinutes}-daqiqasigacha kelmadi`,
                courseName,
                teacherName,
                lessonTime: timeStr,
              });
            }
          }
        }

        // Agar kelmaganlar avtomatik belgilangan bo'lsa, o'qituvchiga ham xabar berish
        if (autoAbsentCount > 0 && teacher) {
          const tClean = cleanPhone(teacher.phone);
          for (const [chatId, sess] of Object.entries(sessions)) {
            if (sess.role === 'teacher' && cleanPhone(sess.phone) === tClean) {
              await sendMessage(
                chatId,
                `📢 <b>${halfTimeMinutes}-daqiqa davomat nazorati:</b>\n` +
                `«<b>${group.name}</b>» guruhida darsning ${halfTimeMinutes}-daqiqasigacha kelmagan <b>${autoAbsentCount} nafar</b> o‘quvchi platformada «Kelmadi» deb qayd etildi va ota-onalariga xabarnoma yuborildi.\n\n` +
                `<i>(Agar dars davomida kelishsa, davomatni bemalol qayta tahrirlashingiz mumkin!)</i>`,
                {
                  reply_markup: {
                    inline_keyboard: [
                      [{ text: '✏️ Davomatni tahrirlash', callback_data: `att_g:${group.id}` }],
                      [{ text: '🏠 Bosh menyu', callback_data: 'nav_home' }]
                    ]
                  }
                }
              );
            }
          }
        }
      }
    }

    if (dbModified) {
      saveDb(db);
    }
  } catch (err) {
    console.error('[Bot Half-Time Cron Error]:', err.message);
  }
}

// --- POLLING ENGINE (LONG POLLING) ---
let lastUpdateId = 0;
let isPolling = false;

async function pollUpdates() {
  if (isPolling) return;
  isPolling = true;

  try {
    const res = await telegramRequest('getUpdates', {
      offset: lastUpdateId + 1,
      timeout: 25,
      allowed_updates: ['message', 'callback_query'],
    });

    if (res && res.ok && Array.isArray(res.result)) {
      for (const update of res.result) {
        lastUpdateId = Math.max(lastUpdateId, update.update_id);
        const time = new Date().toLocaleTimeString('uz-UZ', { timeZone: 'Asia/Tashkent' });
        if (update.message) {
          console.log(`[${time} Bot In] Chat: ${update.message.chat.id} (${update.message.from?.first_name || ''}) Msg: "${update.message.text || (update.message.contact ? 'CONTACT' : '')}"`);
        } else if (update.callback_query) {
          console.log(`[${time} Bot In] Chat: ${update.callback_query.message?.chat?.id} Callback: "${update.callback_query.data}"`);
        }
        await handleUpdate(update);
      }
    } else if (res && !res.ok) {
      console.warn('[Telegram getUpdates Error]:', res.error_code, res.description);
    }
  } catch (err) {
    if (err.message && !err.message.includes('timeout')) {
      console.warn('[Bot Polling Error, reconnecting in 3s]:', err.message);
    }
    await new Promise((r) => setTimeout(r, 3000));
  } finally {
    isPolling = false;
  }
}

// --- START BOT SERVICE ---
export async function startBot() {
  console.log('=====================================================');
  console.log('🤖 EDUCO LMS Ko‘p Rolli Telegram Bot (@EducoLms_Bot)');
  console.log('=====================================================');

  try {
    const me = await telegramRequest('getMe');
    if (!me.ok) {
      console.error('❌ Telegram Bot token xato:', me);
      process.exit(1);
    }
    console.log(`✅ Telegram bot faol: @${me.result.username} (${me.result.first_name})`);

    // Delete webhook to ensure Long Polling operates smoothly
    await telegramRequest('deleteWebhook', { drop_pending_updates: false });

    // Start 20-minute lesson reminder cron (Every 60 seconds)
    setInterval(checkAndSend20MinuteLessonReminders, 60000);
    checkAndSend20MinuteLessonReminders().catch(() => {});

    // Start 45-minute lesson half-time cron (Every 60 seconds)
    setInterval(checkLessonHalfTimeStatus, 60000);
    checkLessonHalfTimeStatus().catch(() => {});

    // Start 24/7 Cloud Health Check HTTP Server (Render / Railway / Koyeb port compatibility)
    const PORT = process.env.PORT || 3000;
    try {
      const server = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'online',
          service: 'EDUCO LMS Telegram Bot',
          bot: `@${me.result.username}`,
          uptime_seconds: Math.floor(process.uptime()),
          timestamp: new Date().toISOString()
        }));
      });
      server.listen(PORT, '0.0.0.0', () => {
        console.log(`🌐 24/7 Cloud Web Service port ${PORT} da faol (Render / Railway mosligi).`);
      });
    } catch (serverErr) {
      console.warn('[Cloud Server Warning]:', serverErr.message);
    }

    console.log('⏰ 20 daqiqalik dars eslatmalari va 45 daqiqalik yarim-vaqt nazorat taymerlari ishga tushdi.');
    console.log('🚀 Xabarlar tinglanmoqda (Long Polling)...');

    // Polling loop
    while (true) {
      await pollUpdates();
      await new Promise((r) => setTimeout(r, 200));
    }
  } catch (err) {
    console.error('❌ Botni ishga tushirishda xatolik:', err);
  }
}

// Auto-run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startBot();
}
