// Cloudflare Pages Advanced Edge Worker for EDUCO LMS
// Handles /api/sync-store, /api/chat/upload, /api/chat/media, /api/chat/seen, and falls back to static assets

// In-memory fallback if D1 is not bound yet
const memoryKV = new Map();
const memoryMedia = new Map();
let currentStoreVersion = 1;
let lastStoreUpdatedAt = Date.now();

// Helper to return JSON with CORS headers
function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, If-None-Match',
      'Access-Control-Expose-Headers': 'ETag',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      ...extraHeaders,
    },
  });
}

// Universal Multi-Device Conflict-Free Merging Engine
function mergeCollections(current, incoming) {
  const merged = { ...current };
  const deletedSet = new Set(Array.isArray(current._deleted_ids) ? current._deleted_ids : []);
  if (incoming.deletedId) deletedSet.add(String(incoming.deletedId));
  if (Array.isArray(incoming._deleted_ids)) {
    incoming._deleted_ids.forEach((id) => deletedSet.add(String(id)));
  }
  merged._deleted_ids = Array.from(deletedSet);

  for (const [key, val] of Object.entries(incoming)) {
    if (key === 'deletedId' || key === '_deleted_ids') continue;

    if (Array.isArray(val)) {
      const existingList = Array.isArray(current[key]) ? current[key] : [];
      const map = new Map();

      // 1. Populate existing server records (excluding known deleted IDs)
      existingList.forEach((item) => {
        if (!item || typeof item !== 'object') return;
        const id = String(item.id || item.username || '');
        if (id && !deletedSet.has(id)) {
          map.set(id, item);
        }
      });

      // 2. Upsert incoming records from client
      val.forEach((item) => {
        if (!item || typeof item !== 'object') return;
        const id = String(item.id || item.username || '');
        if (!id || deletedSet.has(id)) return;

        if (!map.has(id)) {
          map.set(id, item);
        } else {
          const old = map.get(id);
          const oldTs = new Date(old.updated_at || old.created_at || 0).getTime();
          const newTs = new Date(item.updated_at || item.created_at || 0).getTime();
          if (newTs >= oldTs) {
            map.set(id, { ...old, ...item });
          }
        }
      });

      // 3. Clean list filtered against deletedSet
      merged[key] = Array.from(map.values()).filter((item) => {
        const id = String(item.id || item.username || '');
        return !deletedSet.has(id);
      });
    } else if (val && typeof val === 'object') {
      merged[key] = { ...(current[key] || {}), ...val };
    } else {
      merged[key] = val;
    }
  }

  // Guaranteed Security: Abbosbek Owner root must NEVER be lost or demoted
  if (Array.isArray(merged['educo_db_users'])) {
    const hasOwner = merged['educo_db_users'].some(
      (u) => (u.username === 'abbosbek' || u.role === 'owner') && u.is_active !== false
    );
    if (!hasOwner) {
      merged['educo_db_users'].unshift({
        id: 'usr-owner-1',
        username: 'abbosbek',
        first_name: 'Abbosbek',
        last_name: 'Boshqaruvchi',
        fullName: 'Abbosbek',
        full_name: 'Abbosbek',
        role: 'owner',
        email: 'abbosbek@educo.app',
        phone: '+998 98 800 14 15',
        password: 'AbbosBek1415',
        password_updated_at: '2026-10-31T05:02:37.920Z',
        is_active: true,
        created_at: '2026-10-31T05:02:37.920Z',
        avatar_url: '',
      });
    }
  }

  return merged;
}

// Ensure D1 table exists
async function initD1Tables(db) {
  if (!db) return;
  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS kv_store (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TEXT
      );
      CREATE TABLE IF NOT EXISTS media_blobs (
        id TEXT PRIMARY KEY,
        mime_type TEXT,
        data_base64 TEXT,
        created_at TEXT
      );
    `);
  } catch (err) {
    console.warn('D1 init table error:', err);
  }
}


// ==============================================================================
// EDUCO LMS TELEGRAM BOT SERVERLESS EDGE ENGINE (@EducoLms_Bot)
// Runs 24/7 on Cloudflare Pages without needing local Node.js or any external server
// ==============================================================================

const BOT_TOKEN = '9049935207:AAG2b-t507eJCpf31RMDIm4gFpbUuhFOI7g';

function cleanPhone(phone) {
  if (!phone) return '';
  return String(phone).replace(/[^\d]/g, '');
}

async function getWorkerDb(env) {
  const db = env.DB || env.DATABASE;
  if (db) await initD1Tables(db);
  const store = {};
  if (db) {
    try {
      const { results } = await db.prepare('SELECT key, value FROM kv_store').all();
      if (results && results.length > 0) {
        for (const row of results) {
          try {
            store[row.key] = JSON.parse(row.value);
          } catch {
            store[row.key] = row.value;
          }
        }
      }
    } catch (e) {
      console.warn('D1 fetch error in bot engine:', e);
    }
  }
  for (const [k, v] of memoryKV.entries()) {
    if (store[k] === undefined) store[k] = v;
  }
  return store;
}

async function saveWorkerKey(env, key, value) {
  memoryKV.set(key, value);
  const db = env.DB || env.DATABASE;
  if (db) {
    try {
      const valStr = JSON.stringify(value);
      const now = new Date().toISOString();
      await db
        .prepare('INSERT INTO kv_store (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at')
        .bind(key, valStr, now)
        .run();
    } catch (e) {
      console.warn('D1 save error in bot engine for ' + key, e);
    }
  }
}

async function getWorkerSessions(env) {
  const store = await getWorkerDb(env);
  return store['educo_db_bot_sessions'] || {};
}

async function saveWorkerSessions(env, sessions) {
  await saveWorkerKey(env, 'educo_db_bot_sessions', sessions);
}

// Telegram API Client (using standard Cloudflare global fetch)
async function telegramApi(botToken, method, payload = {}) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json().catch(() => ({ ok: false }));
  } catch (err) {
    console.error('Telegram API request failed:', method, err);
    return { ok: false, error: err.message };
  }
}

async function sendMessage(botToken, chatId, text, extra = {}) {
  return await telegramApi(botToken, 'sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    ...extra,
  });
}

async function editMessageText(botToken, chatId, messageId, text, extra = {}) {
  return await telegramApi(botToken, 'editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: 'HTML',
    ...extra,
  });
}

async function answerCallbackQuery(botToken, cqId, text = '', showAlert = false) {
  return await telegramApi(botToken, 'answerCallbackQuery', {
    callback_query_id: cqId,
    text: text || undefined,
    show_alert: showAlert,
  });
}

// Keyboards & Navigation
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

function findUserByInput(db, input) {
  if (!input) return null;
  const users = db.educo_db_users || [];
  const cleanInput = cleanPhone(input);

  // 1. Check direct phone match across all users
  for (const u of users) {
    const uPhone = cleanPhone(u.phone);
    if (uPhone && (uPhone === cleanInput || uPhone.endsWith(cleanInput) || cleanInput.endsWith(uPhone))) {
      return { type: 'user', user: u, role: u.role || 'student' };
    }
  }

  // 2. Check parent phones
  const parentMatches = [];
  for (const u of users) {
    const pPhone = cleanPhone(u.parent_phone);
    if (pPhone && (pPhone === cleanInput || pPhone.endsWith(cleanInput) || cleanInput.endsWith(pPhone))) {
      parentMatches.push(u);
    }
  }
  if (parentMatches.length > 0) {
    return { type: 'parent', children: parentMatches, role: 'parent' };
  }

  // 3. Check username
  const low = input.toLowerCase().replace('@', '').trim();
  const byUsername = users.find((u) => (u.username || '').toLowerCase() === low);
  if (byUsername) {
    return { type: 'user', user: byUsername, role: byUsername.role || 'student' };
  }

  return null;
}

function getGroupStudents(db, groupId) {
  const group = (db.educo_db_groups || []).find((g) => g.id === groupId);
  if (!group) return [];
  const users = db.educo_db_users || [];
  const studentIds = new Set(group.student_ids || []);

  const members = (db.educo_db_group_members || []).filter((m) => m.group_id === groupId && m.status !== 'inactive');
  members.forEach((m) => {
    if (m.student_id) studentIds.add(m.student_id);
    if (m.user_id) studentIds.add(m.user_id);
  });

  users.forEach((u) => {
    if (u.role === 'student' && u.is_active !== false) {
      if (u.group_id === groupId || (Array.isArray(u.group_ids) && u.group_ids.includes(groupId))) {
        studentIds.add(u.id);
      }
    }
  });

  return users.filter((u) => studentIds.has(u.id));
}

// Tashkent Time Helpers (UTC+5)
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

function checkGroupLessonStatus(group, db, session = {}, forceBypass = false) {
  if (forceBypass) {
    return { canProceed: true, isBypassed: true };
  }

  const now = getTashkentNow();
  let currentDayOfWeek = now.getDay();
  if (currentDayOfWeek === 0) currentDayOfWeek = 7;
  const todayStr = formatTashkentDate(now);

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
    1: 'Dushanba', 2: 'Seshanba', 3: 'Chorshanba', 4: 'Payshanba', 5: 'Juma', 6: 'Shanba', 7: 'Yakshanba'
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
    if (hoursLeft > 0) timeLeftStr += `${hoursLeft} soat `;
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

// Interactive Live Attendance Panel Renderer
async function renderGroupAttendancePanel(botToken, chatId, messageId, groupId, toastText = null, cqId = null, forceBypass = false, env) {
  if (cqId && toastText) {
    await answerCallbackQuery(botToken, cqId, toastText);
  } else if (cqId) {
    await answerCallbackQuery(botToken, cqId);
  }

  const db = await getWorkerDb(env);
  const group = (db.educo_db_groups || []).find((g) => g.id === groupId);
  if (!group) {
    if (messageId) await editMessageText(botToken, chatId, messageId, '⚠️ Guruh topilmadi.');
    else await sendMessage(botToken, chatId, '⚠️ Guruh topilmadi.');
    return;
  }

  const sessions = await getWorkerSessions(env);
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
    inline_keyboard.push([{ text: '🏠 Bosh menyu', callback_data: 'nav_home' }]);

    if (isTester) {
      inline_keyboard.push([{ text: '👑 Test rejimida ochish (Boshqaruvchi)', callback_data: `att_force:${groupId}` }]);
    }

    if (messageId) {
      await editMessageText(botToken, chatId, messageId, warningText, { reply_markup: { inline_keyboard } });
    } else {
      await sendMessage(botToken, chatId, warningText, { reply_markup: { inline_keyboard } });
    }
    return;
  }

  const students = getGroupStudents(db, groupId);
  if (students.length === 0) {
    const emptyText = `⚠️ <b>${group.name}</b> guruhida birorta ham faol o‘quvchi topilmadi.`;
    if (messageId) await editMessageText(botToken, chatId, messageId, emptyText);
    else await sendMessage(botToken, chatId, emptyText);
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
    const status = rec ? rec.status : 'present';
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
  inline_keyboard.push([
    { text: '🟢 Barchani BOR qilish', callback_data: `att_all:${groupId}` },
    { text: '🔴 Barchani KELMADI qilish', callback_data: `att_none:${groupId}` },
  ]);

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

  inline_keyboard.push([{ text: '💾 Davomatni yakunlash va saqlash', callback_data: `att_finalize:${groupId}` }]);
  inline_keyboard.push([
    { text: '🔄 Yangilash', callback_data: `att_g:${groupId}` },
    { text: '⬅️ Guruhlar ro‘yxati', callback_data: 'att_groups_list' },
  ]);
  inline_keyboard.push([{ text: '🏠 Bosh menyu', callback_data: 'nav_home' }]);

  if (messageId) {
    await editMessageText(botToken, chatId, messageId, text, { reply_markup: { inline_keyboard } });
  } else {
    await sendMessage(botToken, chatId, text, { reply_markup: { inline_keyboard } });
  }
}

// Grade feedback text
const GRADE_FEEDBACK_MAP = {
  5: "A'lo darajada! Darsda juda faol qatnashdi va vazifalarni namunali bajardi. 👏",
  4: "Yaxshi! Dars mavzusini yaxshi o'zlashtirdi va vazifalarni to'g'ri bajardi. 👍",
  3: "Qoniqarli. Darsda qatnashdi, yanada faolroq bo'lish tavsiya etiladi. 📚",
  2: "Qoniqarsiz. Mavzuni o'zlashtirishda kamchiliklar bor, qo'shimcha tayyorgarlik zarur. ⚠️",
  1: "Yomon. Mashg'ulotlarga jiddiyroq e'tibor qaratish kerak. ❗",
};

// Interactive Live Grading Panel Renderer (Excludes Absent Students Automatically!)
async function renderGroupGradingPanel(botToken, chatId, messageId, groupId, toastText = null, cqId = null, forceBypass = false, env) {
  if (cqId && toastText) {
    await answerCallbackQuery(botToken, cqId, toastText);
  } else if (cqId) {
    await answerCallbackQuery(botToken, cqId);
  }

  const db = await getWorkerDb(env);
  const group = (db.educo_db_groups || []).find((g) => g.id === groupId);
  if (!group) {
    if (messageId) await editMessageText(botToken, chatId, messageId, '⚠️ Guruh topilmadi.');
    else await sendMessage(botToken, chatId, '⚠️ Guruh topilmadi.');
    return;
  }

  const sessions = await getWorkerSessions(env);
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
    inline_keyboard.push([{ text: '🏠 Bosh menyu', callback_data: 'nav_home' }]);

    if (isTester) {
      inline_keyboard.push([{ text: '👑 Test rejimida ochish (Boshqaruvchi)', callback_data: `grd_force:${groupId}` }]);
    }

    if (messageId) {
      await editMessageText(botToken, chatId, messageId, warningText, { reply_markup: { inline_keyboard } });
    } else {
      await sendMessage(botToken, chatId, warningText, { reply_markup: { inline_keyboard } });
    }
    return;
  }

  const allStudents = getGroupStudents(db, groupId);
  if (allStudents.length === 0) {
    const emptyText = `⚠️ <b>${group.name}</b> guruhida birorta ham faol o‘quvchi topilmadi.`;
    if (messageId) await editMessageText(botToken, chatId, messageId, emptyText);
    else await sendMessage(botToken, chatId, emptyText);
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
    if (messageId) await editMessageText(botToken, chatId, messageId, allAbsentText, { reply_markup: { inline_keyboard } });
    else await sendMessage(botToken, chatId, allAbsentText, { reply_markup: { inline_keyboard } });
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

    inline_keyboard.push([
      { text: `👤 ${idx + 1}. ${stName} ${gradeBadge}`, callback_data: `grd_info:${groupId}:${st.id}` }
    ]);

    const gradeRow = [];
    for (let score = 1; score <= 5; score++) {
      const isSelected = latestGrade === score;
      const btnText = isSelected ? `[ ⭐ ${score} ]` : `${score} ⭐`;
      gradeRow.push({
        text: btnText,
        callback_data: `grd_v:${groupId}:${st.id}:${score}`
      });
    }
    inline_keyboard.push(gradeRow);
  });

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
    await editMessageText(botToken, chatId, messageId, text, { reply_markup: { inline_keyboard } });
  } else {
    await sendMessage(botToken, chatId, text, { reply_markup: { inline_keyboard } });
  }
}

// Notifications Dispatcher
async function sendAttendanceTelegramNotification({ studentId, status, remark, courseName = 'Dars', teacherName = 'Fan mentori', lessonTime = '09:30 - 10:50' }, db, botToken) {
  const users = db.educo_db_users || [];
  const student = users.find((u) => u.id === studentId);
  if (!student) return;

  const studentName = student.fullName || student.name || `${student.first_name || ''} ${student.last_name || ''}`.trim();
  const statusLabels = {
    present: { title: 'Darsda qatnashdingiz ✅', icon: '🟢', parentTitle: 'darsda to‘liq qatnashdi ✅' },
    late: { title: 'Darsga kech qolib keldingiz ⚠️', icon: '🟡', parentTitle: 'darsga kech qolib keldi ⚠️' },
    absent: { title: 'Darsga qatnashmadingiz ❌', icon: '🔴', parentTitle: 'bugun darsga qatnashmadi (kelmadi) ❌' },
  };
  const config = statusLabels[status] || statusLabels.present;
  const todayStr = formatUzDatePretty(formatTashkentDate(getTashkentNow()));

  if (student.telegram_chat_id) {
    const studentMsg = `${config.icon} <b>Davomat xabarnomasi:</b>\n\n` +
      `Hurmatli <b>${studentName}</b>, siz bugun (${todayStr}) <b>${courseName}</b> fanidan ${config.title}.\n\n` +
      `🕒 <b>Dars vaqti:</b> ${lessonTime}\n` +
      `👨‍🏫 <b>Ustoz:</b> ${teacherName}\n` +
      (remark ? `📝 <b>Izoh:</b> ${remark}\n\n` : '\n') +
      `<i>EDUCO LMS avtomatik nazorat xizmati</i>`;
    await sendMessage(botToken, student.telegram_chat_id, studentMsg);
  }

  if (student.parent_telegram_chat_id) {
    const parentMsg = `${config.icon} <b>Hurmatli ota-ona!</b>\n\n` +
      `Farzandingiz <b>${studentName}</b> bugun (${todayStr}) <b>${courseName}</b> fanidan ${config.parentTitle}.\n\n` +
      `🕒 <b>Dars vaqti:</b> ${lessonTime}\n` +
      `👨‍🏫 <b>Ustoz:</b> ${teacherName}\n` +
      (remark ? `📝 <b>Ustoz izohi:</b> ${remark}\n\n` : '\n') +
      `<i>EDUCO LMS ta'lim monitoring markazi</i>`;
    await sendMessage(botToken, student.parent_telegram_chat_id, parentMsg);
  }
}

async function sendGradeTelegramNotification({ studentId, gradeValue, topic, feedback, teacherName = 'Fan mentori', courseName = 'Dars' }, db, botToken) {
  const users = db.educo_db_users || [];
  const student = users.find((u) => u.id === studentId);
  if (!student) return;

  const studentName = student.fullName || student.name || `${student.first_name || ''} ${student.last_name || ''}`.trim();
  const todayStr = formatUzDatePretty(formatTashkentDate(getTashkentNow()));
  const scoreBadge = '⭐'.repeat(gradeValue);

  if (student.telegram_chat_id) {
    const studentMsg = `🌟 <b>Yangi baho qo‘yildi!</b>\n\n` +
      `Hurmatli <b>${studentName}</b>, siz bugun (${todayStr}) <b>${courseName}</b> fanidan baholandingiz:\n\n` +
      `⭐ <b>Olingan baho:</b> <b>${gradeValue} ball</b> (${scoreBadge})\n` +
      `📚 <b>Mavzu:</b> ${topic || 'Dars mashg‘uloti'}\n` +
      `👨‍🏫 <b>Ustoz:</b> ${teacherName}\n` +
      `💬 <b>Ustoz fikri:</b> <i>"${feedback || 'Darsda qatnashdi'}"</i>\n\n` +
      `<i>O‘qishlaringizda doimo muvaffaqiyat tilaymiz!</i>`;
    await sendMessage(botToken, student.telegram_chat_id, studentMsg);
  }

  if (student.parent_telegram_chat_id) {
    const parentMsg = `🌟 <b>Farzandingiz yangi baho oldi!</b>\n\n` +
      `Hurmatli ota-ona, farzandingiz <b>${studentName}</b> bugun (${todayStr}) <b>${courseName}</b> fanidan baholandi:\n\n` +
      `⭐ <b>Baho:</b> <b>${gradeValue} ball</b> (${scoreBadge})\n` +
      `📚 <b>Mavzu:</b> ${topic || 'Dars mashg‘uloti'}\n` +
      `👨‍🏫 <b>Ustoz:</b> ${teacherName}\n` +
      `💬 <b>Ustoz izohi:</b> <i>"${feedback || 'Darsda qatnashdi'}"</i>\n\n` +
      `<i>EDUCO LMS ta'lim monitoring markazi</i>`;
    await sendMessage(botToken, student.parent_telegram_chat_id, parentMsg);
  }
}

// Callback Query Handler
async function handleTelegramCallbackQuery(cq, env, botToken) {
  const chatId = cq.message?.chat?.id;
  const messageId = cq.message?.message_id;
  const data = cq.data || '';
  const sessions = await getWorkerSessions(env);
  const session = sessions[chatId];

  if (!session || !chatId) {
    await answerCallbackQuery(botToken, cq.id, 'Iltimos, avval /start ni bosing.');
    return;
  }

  const db = await getWorkerDb(env);
  const todayStr = formatTashkentDate(getTashkentNow());
  const todayPretty = formatUzDatePretty(todayStr);

  if (data.startsWith('sw_role:')) {
    await answerCallbackQuery(botToken, cq.id, 'Akkauntga kirish uchun menyudagi «Rolni almashtirish» tugmasini bosing.', true);
    return;
  }

  // 1. Attendance Panel: att_g:<groupId>
  if (data.startsWith('att_g:')) {
    const groupId = data.replace('att_g:', '');
    await renderGroupAttendancePanel(botToken, chatId, messageId, groupId, null, cq.id, false, env);
    return;
  }

  // 1.05 Test bypass: att_force:<groupId>
  if (data.startsWith('att_force:')) {
    const groupId = data.replace('att_force:', '');
    if (!session.forceBypass) session.forceBypass = {};
    session.forceBypass[groupId] = true;
    sessions[chatId] = session;
    await saveWorkerSessions(env, sessions);
    await renderGroupAttendancePanel(botToken, chatId, messageId, groupId, '👑 Test rejimi faollashtirildi!', cq.id, true, env);
    return;
  }

  // 1.1 Return to attendance groups list: att_groups_list
  if (data === 'att_groups_list') {
    await answerCallbackQuery(botToken, cq.id);
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
      if (st.canProceed) timeBadge = ' 🟢 [Dars vaqti]';
      else if (st.reason === 'not_started_yet') timeBadge = ` ⏳ [${st.startTime}]`;
      else timeBadge = ` 📅 [${getGroupLessonDaysSummary(g)}]`;

      return [{ text: `👥 ${g.name}${attBadge}${timeBadge}`, callback_data: `att_g:${g.id}` }];
    });

    await editMessageText(
      botToken,
      chatId,
      messageId,
      `📝 <b>Davomat Boshqaruvi:</b> Qaysi guruh davomatini ko‘rmoqchisiz / yangilamoqchisiz?`,
      { reply_markup: { inline_keyboard: groupButtons } }
    );
    return;
  }

  // 2. Mark all PRESENT: att_all:<groupId>
  if (data.startsWith('att_all:')) {
    const groupId = data.replace('att_all:', '');
    const group = (db.educo_db_groups || []).find((g) => g.id === groupId);
    const students = getGroupStudents(db, groupId);

    if (!group || students.length === 0) {
      await answerCallbackQuery(botToken, cq.id, 'O‘quvchilar topilmadi.');
      return;
    }

    const isTester = session.role === 'owner' || String(chatId) === '1594150529' || session.actualRole === 'owner';
    const effectiveBypass = Boolean(session.forceBypass?.[groupId]);
    const lessonStatus = checkGroupLessonStatus(group, db, session, effectiveBypass);
    if (!lessonStatus.canProceed && !isTester) {
      const reasonMsg = lessonStatus.reason === 'not_started_yet'
        ? `⏳ Dars hali boshlanmadi! Dars vaqti: ${lessonStatus.startTime}. Ungacha davomat qilib bo‘lmaydi.`
        : `📅 Bugun dars kuni emas! Dars kunlari: ${lessonStatus.scheduledDays}`;
      await answerCallbackQuery(botToken, cq.id, reasonMsg, true);
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

    await saveWorkerKey(env, 'educo_db_attendance', db.educo_db_attendance);
    await renderGroupAttendancePanel(botToken, chatId, messageId, groupId, 'Barcha o‘quvchilar BOR deb belgilandi! 🟢', cq.id, false, env);
    return;
  }

  // 2.1 Mark all ABSENT: att_none:<groupId>
  if (data.startsWith('att_none:')) {
    const groupId = data.replace('att_none:', '');
    const group = (db.educo_db_groups || []).find((g) => g.id === groupId);
    const students = getGroupStudents(db, groupId);

    if (!group || students.length === 0) {
      await answerCallbackQuery(botToken, cq.id, 'O‘quvchilar topilmadi.');
      return;
    }

    const isTester = session.role === 'owner' || String(chatId) === '1594150529' || session.actualRole === 'owner';
    const effectiveBypass = Boolean(session.forceBypass?.[groupId]);
    const lessonStatus = checkGroupLessonStatus(group, db, session, effectiveBypass);
    if (!lessonStatus.canProceed && !isTester) {
      const reasonMsg = lessonStatus.reason === 'not_started_yet'
        ? `⏳ Dars hali boshlanmadi! Dars vaqti: ${lessonStatus.startTime}. Ungacha davomat qilib bo‘lmaydi.`
        : `📅 Bugun dars kuni emas! Dars kunlari: ${lessonStatus.scheduledDays}`;
      await answerCallbackQuery(botToken, cq.id, reasonMsg, true);
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

    await saveWorkerKey(env, 'educo_db_attendance', db.educo_db_attendance);
    await renderGroupAttendancePanel(botToken, chatId, messageId, groupId, 'Barcha o‘quvchilar KELMADI deb belgilandi! 🔴', cq.id, false, env);
    return;
  }

  // 3. Toggle single student status: att_tog:<groupId>:<studentId>:<currentStatus>
  if (data.startsWith('att_tog:')) {
    const [, groupId, studentId, currentStatus] = data.split(':');
    const group = (db.educo_db_groups || []).find((g) => g.id === groupId);
    const student = (db.educo_db_users || []).find((u) => u.id === studentId);

    if (!group || !student) {
      await answerCallbackQuery(botToken, cq.id, 'Xatolik: O‘quvchi topilmadi.');
      return;
    }

    const isTester = session.role === 'owner' || String(chatId) === '1594150529' || session.actualRole === 'owner';
    const effectiveBypass = Boolean(session.forceBypass?.[groupId]);
    const lessonStatus = checkGroupLessonStatus(group, db, session, effectiveBypass);
    if (!lessonStatus.canProceed && !isTester) {
      const reasonMsg = lessonStatus.reason === 'not_started_yet'
        ? `⏳ Dars hali boshlanmadi! Dars vaqti: ${lessonStatus.startTime}. Ungacha davomat qilib bo‘lmaydi.`
        : `📅 Bugun dars kuni emas! Dars kunlari: ${lessonStatus.scheduledDays}`;
      await answerCallbackQuery(botToken, cq.id, reasonMsg, true);
      return;
    }

    const nextStatus = currentStatus === 'present' ? 'late' : (currentStatus === 'late' ? 'absent' : 'present');
    const statusLabels = { present: '🟢 Bor', late: '🟡 Kech qoldi', absent: '🔴 Kelmadi' };

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

    if (existingIdx >= 0) db.educo_db_attendance[existingIdx] = record;
    else db.educo_db_attendance.push(record);

    await saveWorkerKey(env, 'educo_db_attendance', db.educo_db_attendance);

    if (wasFinalized) {
      await sendAttendanceTelegramNotification({
        studentId,
        status: nextStatus,
        courseName: group.course_name || group.name,
        teacherName: group.teacher_name || session.fullName,
        lessonTime: getGroupLessonTime(group),
      }, db, botToken);
    }

    const studentName = student.fullName || student.name || 'O‘quvchi';
    await renderGroupAttendancePanel(botToken, chatId, messageId, groupId, `${studentName}: ${statusLabels[nextStatus]}`, cq.id, false, env);
    return;
  }

  // 4. Finalize attendance: att_finalize:<groupId>
  // PROMPTS AUTOMATICALLY TO GRADE ATTENDEES!
  if (data.startsWith('att_finalize:')) {
    const groupId = data.replace('att_finalize:', '');
    const group = (db.educo_db_groups || []).find((g) => g.id === groupId);
    const students = getGroupStudents(db, groupId);

    if (!group || students.length === 0) {
      await answerCallbackQuery(botToken, cq.id, 'O‘quvchilar topilmadi.');
      return;
    }

    const isTester = session.role === 'owner' || String(chatId) === '1594150529' || session.actualRole === 'owner';
    const effectiveBypass = Boolean(session.forceBypass?.[groupId]);
    const lessonStatus = checkGroupLessonStatus(group, db, session, effectiveBypass);
    if (!lessonStatus.canProceed && !isTester) {
      const reasonMsg = lessonStatus.reason === 'not_started_yet'
        ? `⏳ Dars hali boshlanmadi! Dars vaqti: ${lessonStatus.startTime}. Ungacha davomatni yakunlab bo‘lmaydi.`
        : `📅 Bugun dars kuni emas! Dars kunlari: ${lessonStatus.scheduledDays}`;
      await answerCallbackQuery(botToken, cq.id, reasonMsg, true);
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

      await sendAttendanceTelegramNotification({
        studentId: st.id,
        status,
        courseName,
        teacherName,
        lessonTime,
      }, db, botToken);
    }

    await saveWorkerKey(env, 'educo_db_attendance', db.educo_db_attendance);
    await answerCallbackQuery(botToken, cq.id, 'Davomat muvaffaqiyatli yakunlandi va saqlandi! 🎉');

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
      [{ text: '✏️ Davomatni qayta tahrirlash', callback_data: `att_g:${groupId}` }],
      [
        { text: '⬅️ Guruhlar ro‘yxati', callback_data: 'att_groups_list' },
        { text: '🏠 Bosh menyu', callback_data: 'nav_home' },
      ]
    );

    await editMessageText(botToken, chatId, messageId, successText, {
      reply_markup: { inline_keyboard: finalKeyboard }
    });

    // Avtomatik baholash taklifi yuborish
    if (eligibleCount > 0) {
      const askGradingPrompt = `⭐ <b>Davomat yakunlandi! Qatnashgan o‘quvchilarni hoziroq baholaysizmi?</b>\n\n` +
        `👥 Darsda qatnashganlar: <b>${eligibleCount} nafar</b>\n` +
        (absentCount > 0 ? `🚫 Darsga kelmaganlar: <b>${absentCount} nafar</b> <i>(baholashdan avtomatik chiqarildi)</i>\n\n` : `\n`) +
        `O‘quvchilarni baholash uchun pastdagi tugmani bosing va 1-5 ball qo‘ying:`;

      await sendMessage(botToken, chatId, askGradingPrompt, {
        reply_markup: {
          inline_keyboard: [
            [{ text: `⭐ Ha, qatnashganlarni baholash (${eligibleCount} nafar)`, callback_data: `grd_g:${groupId}` }],
            [{ text: `🏠 Keyinroq / Bosh menyu`, callback_data: 'nav_home' }]
          ]
        }
      });
    }
    return;
  }

  // 7. Teacher Grading Panel: grd_g:<groupId>
  if (data.startsWith('grd_g:')) {
    const groupId = data.replace('grd_g:', '');
    await renderGroupGradingPanel(botToken, chatId, messageId, groupId, null, cq.id, false, env);
    return;
  }

  // 7.05 Test bypass for grading: grd_force:<groupId>
  if (data.startsWith('grd_force:')) {
    const groupId = data.replace('grd_force:', '');
    if (!session.forceBypass) session.forceBypass = {};
    session.forceBypass[groupId] = true;
    sessions[chatId] = session;
    await saveWorkerSessions(env, sessions);
    await renderGroupGradingPanel(botToken, chatId, messageId, groupId, '👑 Test rejimi faollashtirildi!', cq.id, true, env);
    return;
  }

  // 7.1 Return to grading groups list: grd_groups_list
  if (data === 'grd_groups_list') {
    await answerCallbackQuery(botToken, cq.id);
    const allGroups = (db.educo_db_groups || []).filter((g) => g.status !== 'archived');
    const teacherId = session.userId;
    let targetGroups = (session.role === 'owner' || session.role === 'admin')
      ? allGroups
      : allGroups.filter((g) => g.teacher_id === teacherId || (g.teacher_name && g.teacher_name.toLowerCase().includes('abdulaziz')));

    if (targetGroups.length === 0) targetGroups = allGroups;

    const groupButtons = targetGroups.slice(0, 15).map((g) => {
      const st = checkGroupLessonStatus(g, db, session, session.forceBypass?.[g.id]);
      let timeBadge = '';
      if (st.canProceed) timeBadge = ' 🟢 [Dars vaqti]';
      else if (st.reason === 'not_started_yet') timeBadge = ` ⏳ [${st.startTime}]`;
      else timeBadge = ` 📅 [${getGroupLessonDaysSummary(g)}]`;
      return [{ text: `👥 ${g.name}${timeBadge}`, callback_data: `grd_g:${g.id}` }];
    });

    await editMessageText(
      botToken,
      chatId,
      messageId,
      `🌟 <b>Baholash Boshqaruvi:</b> Qaysi guruh o‘quvchilariga baho qo‘ymoqchisiz?`,
      { reply_markup: { inline_keyboard: groupButtons } }
    );
    return;
  }

  // 7.2 Student info hint toast: grd_info:<groupId>:<studentId>
  if (data.startsWith('grd_info:')) {
    await answerCallbackQuery(botToken, cq.id, 'Baholash uchun pastdagi 1 dan 5 gacha tugmalardan birini bosing ⭐');
    return;
  }

  // 8. Save/Update Grade (Direct 1-Tap): grd_v:<groupId>:<studentId>:<score>
  if (data.startsWith('grd_v:')) {
    const [, groupId, studentId, scoreStr] = data.split(':');
    const score = Number(scoreStr);
    const group = (db.educo_db_groups || []).find((g) => g.id === groupId);
    const student = (db.educo_db_users || []).find((u) => u.id === studentId);

    if (!group || !student) {
      await answerCallbackQuery(botToken, cq.id, 'Xatolik: O‘quvchi topilmadi.');
      return;
    }

    const isTester = session.role === 'owner' || String(chatId) === '1594150529' || session.actualRole === 'owner';
    const effectiveBypass = Boolean(session.forceBypass?.[groupId]);
    const lessonStatus = checkGroupLessonStatus(group, db, session, effectiveBypass);
    if (!lessonStatus.canProceed && !isTester) {
      const reasonMsg = lessonStatus.reason === 'not_started_yet'
        ? `⏳ Dars hali boshlanmadi! Dars vaqti: ${lessonStatus.startTime}. Ungacha baholab bo‘lmaydi.`
        : `📅 Bugun dars kuni emas! Dars kunlari: ${lessonStatus.scheduledDays}`;
      await answerCallbackQuery(botToken, cq.id, reasonMsg, true);
      return;
    }

    // Kelmagan (absent) o'quvchini baholash taqiqlanadi
    const todayAtt = (db.educo_db_attendance || []).find(
      (a) => a.student_id === studentId && a.group_id === groupId && a.date === todayStr
    );
    if (todayAtt && todayAtt.status === 'absent') {
      await answerCallbackQuery(botToken, cq.id, '❌ Ushbu o‘quvchi bugungi darsga kelmagan. Uni baholab bo‘lmaydi!', true);
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

    if (existingIdx >= 0) db.educo_db_grades[existingIdx] = gradeRecord;
    else db.educo_db_grades.push(gradeRecord);

    await saveWorkerKey(env, 'educo_db_grades', db.educo_db_grades);

    await sendGradeTelegramNotification({
      studentId,
      gradeValue: score,
      topic: 'Dars amaliy mashg‘uloti',
      feedback,
      teacherName: session.fullName || group.teacher_name || 'Fan mentori',
      courseName: group.course_name || group.name,
    }, db, botToken);

    await renderGroupGradingPanel(botToken, chatId, messageId, groupId, `${studentName}: ${score} ball qo‘yildi! ⭐`, cq.id, false, env);
    return;
  }

  // 9. Finalize Grading: grd_finalize:<groupId>
  // EXCLUDES ABSENT STUDENTS COMPLETELY!
  if (data.startsWith('grd_finalize:')) {
    const groupId = data.replace('grd_finalize:', '');
    const group = (db.educo_db_groups || []).find((g) => g.id === groupId);
    const students = getGroupStudents(db, groupId);

    if (!group || students.length === 0) {
      await answerCallbackQuery(botToken, cq.id, 'O‘quvchilar topilmadi.');
      return;
    }

    const isTester = session.role === 'owner' || String(chatId) === '1594150529' || session.actualRole === 'owner';
    const effectiveBypass = Boolean(session.forceBypass?.[groupId]);
    const lessonStatus = checkGroupLessonStatus(group, db, session, effectiveBypass);
    if (!lessonStatus.canProceed && !isTester) {
      const reasonMsg = lessonStatus.reason === 'not_started_yet'
        ? `⏳ Dars hali boshlanmadi! Dars vaqti: ${lessonStatus.startTime}. Ungacha baholarni yakunlab bo‘lmaydi.`
        : `📅 Bugun dars kuni emas! Dars kunlari: ${lessonStatus.scheduledDays}`;
      await answerCallbackQuery(botToken, cq.id, reasonMsg, true);
      return;
    }

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

    groupGrades.forEach((g) => {
      g.finalized = true;
      g.updated_at = new Date().toISOString();
    });
    await saveWorkerKey(env, 'educo_db_grades', db.educo_db_grades);

    const gradedStudentsCount = eligibleStudents.filter((st) => groupGrades.some((g) => g.student_id === st.id)).length;
    const ungradedCount = eligibleStudents.length - gradedStudentsCount;

    const scores = groupGrades
      .filter((g) => !absentStudentIds.has(String(g.student_id)))
      .map((g) => Number(g.grade_value))
      .filter((s) => s >= 1 && s <= 5);
    const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '—';

    await answerCallbackQuery(botToken, cq.id, 'Baholash muvaffaqiyatli yakunlandi! 🎉');

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
      [{ text: '✏️ Qayta tahrirlash (Dars davomida)', callback_data: `grd_g:${groupId}` }],
      [
        { text: '⬅️ Guruhlar ro‘yxati', callback_data: 'grd_groups_list' },
        { text: '🏠 Bosh menyu', callback_data: 'nav_home' },
      ]
    ];

    await editMessageText(botToken, chatId, messageId, successText, {
      reply_markup: { inline_keyboard: finalKeyboard }
    });
    return;
  }

  // 10. Navigation Go Home
  if (data === 'nav_home') {
    await answerCallbackQuery(botToken, cq.id);
    await sendMessage(botToken, chatId, `🏠 <b>Bosh menyu:</b>`, getMainMenuKeyboard(session));
    return;
  }
}

// Master Update Handler for Cloudflare Webhook
async function handleTelegramUpdate(update, env, botToken) {
  if (update.callback_query) {
    await handleTelegramCallbackQuery(update.callback_query, env, botToken);
    return;
  }

  if (!update.message) return;
  const msg = update.message;
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();
  const contact = msg.contact;

  const sessions = await getWorkerSessions(env);
  let session = sessions[chatId] || {
    chatId,
    state: 'main',
    history: [],
  };

  const db = await getWorkerDb(env);

  // 1. /start command
  if (text === '/start') {
    session.state = 'main';
    session.history = [];
    sessions[chatId] = session;
    await saveWorkerSessions(env, sessions);

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
      await sendMessage(botToken, chatId, welcome, getMainMenuKeyboard(session));
      return;
    }

    const startMsg = `🎓 <b>EDUCO LMS — Ta'lim Tizimi Rasmiy Boti</b>\n\n` +
      `Assalomu alaykum! Tizim imkoniyatlaridan to‘liq foydalanish uchun telefon raqamingizni tasdiqlang.\n\n` +
      `Quyidagi <b>«📱 Telefon raqamimni tasdiqlash»</b> tugmasini bosing yoki telefon raqamingizni yozib yuboring:`;
    await sendMessage(botToken, chatId, startMsg, START_KEYBOARD);
    return;
  }

  // 2. Native Telegram Contact Sharing: Instant 1-tap login without password
  if (contact) {
    const rawPhone = contact.phone_number.startsWith('+') ? contact.phone_number : `+${contact.phone_number}`;
    const match = findUserByInput(db, rawPhone);

    if (!match) {
      await sendMessage(
        botToken,
        chatId,
        `⚠️ <b>Kechirasiz!</b>\n` +
        `Ulashilgan telefon raqami (<code>${rawPhone}</code>) EDUCO LMS tizimida ro‘yxatdan o‘tmagan.\n\n` +
        `Iltimos, o‘quv markaz ma’muriyatiga murojaat qiling yoki boshqa raqam kiriting.`,
        session.role ? AUTH_PHONE_KEYBOARD : START_KEYBOARD
      );
      return;
    }

    session.phone = rawPhone;
    session.role = match.role;
    session.state = 'main';
    session.history = [];
    session.pendingAuth = null;

    if (match.type === 'user') {
      session.userId = match.user.id;
      session.fullName = match.user.fullName || match.user.full_name || `${match.user.first_name || ''} ${match.user.last_name || ''}`.trim();

      const uIdx = (db.educo_db_users || []).findIndex((u) => u.id === match.user.id);
      if (uIdx >= 0) {
        db.educo_db_users[uIdx].telegram_chat_id = chatId;
        db.educo_db_users[uIdx].telegram_username = msg.from?.username || '';
        await saveWorkerKey(env, 'educo_db_users', db.educo_db_users);
      }
    } else if (match.type === 'parent') {
      session.children = match.children.map((c) => ({
        id: c.id,
        name: c.fullName || c.full_name || `${c.first_name || ''} ${c.last_name || ''}`.trim(),
        phone: c.phone,
      }));
      session.activeChildId = session.children[0].id;
      session.fullName = `Ota-ona (${session.children.map((c) => c.name).join(', ')})`;

      (db.educo_db_users || []).forEach((u) => {
        if (session.children.some((c) => c.id === u.id)) {
          u.parent_telegram_chat_id = chatId;
        }
      });
      await saveWorkerKey(env, 'educo_db_users', db.educo_db_users);
    }

    sessions[chatId] = session;
    await saveWorkerSessions(env, sessions);

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

    await sendMessage(botToken, chatId, welcome, getMainMenuKeyboard(session));
    return;
  }

  // 3. Mening akkauntim (Profil)
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
      botToken,
      chatId,
      `👤 <b>Mening akkauntim (Profil):</b>\n\n` +
      `📌 <b>Ism:</b> ${currentName}\n` +
      `🏷️ <b>Rol:</b> ${currentRole}\n` +
      `📞 <b>Telefon:</b> ${phoneDisplay}\n\n` +
      `💡 <b>Imkoniyatlar:</b>\n` +
      `• O‘z shaxsiy profilingizga darhol o‘tish uchun pastdagi <b>«📱 O‘z kontaktimni ulashish»</b> tugmasini bosing — kontakt ulashilgach, <b>parolsiz, 1 bosishda</b> kirasiz!\n` +
      `• Boshqa rol yoki akkauntga kirish uchun <b>«🔄 Boshqa rolga o‘tish»</b> tugmasidan foydalaning.`,
      accountKeyboard
    );
    return;
  }

  // 4. Role switch trigger
  if (text === '🔄 Rolni almashtirish' || text === '🔄 Boshqa rolga o‘tish (Parol bilan)' || text === '🔄 Akkauntni almashtirish' || text === '/role' || text === '/switch' || text === '/login') {
    session.state = 'auth_awaiting_phone';
    session.pendingAuth = null;
    sessions[chatId] = session;
    await saveWorkerSessions(env, sessions);

    await sendMessage(
      botToken,
      chatId,
      `🔄 <b>Boshqa rolga / akkauntga kirish:</b>\n\n` +
      `👥 Boshqa rolga kirmoqchi bo‘lsangiz, ushbu akkaunt <b>telefon raqamini</b> yozib yuboring (masalan: <code>+998901234567</code>):\n\n` +
      `<i>O‘zingizning profilingizga qaytish uchun pastdagi <b>«📱 Mening akkauntim (Kontakt)»</b> tugmasini bosing (parolsiz, 1 bosishda kirish):</i>`,
      AUTH_PHONE_KEYBOARD
    );
    return;
  }

  // 5. Auth Cancellation
  if ((session.state === 'auth_awaiting_phone' || session.state === 'auth_awaiting_password') && text === '❌ Bekor qilish') {
    session.state = 'main';
    session.pendingAuth = null;
    sessions[chatId] = session;
    await saveWorkerSessions(env, sessions);

    if (session.role) {
      await sendMessage(botToken, chatId, `❌ Amal bekor qilindi. Bosh menyudasiz:`, getMainMenuKeyboard(session));
    } else {
      await sendMessage(botToken, chatId, `Tizimdan foydalanish uchun telefon raqamingizni yuboring:`, START_KEYBOARD);
    }
    return;
  }

  // 6. Manual Phone Input
  const isAwaitingPhone = session.state === 'auth_awaiting_phone' || (!session.role && session.state !== 'auth_awaiting_password');
  if (isAwaitingPhone && text && !text.startsWith('/')) {
    const rawInput = text.trim();
    const clean = cleanPhone(rawInput);

    if (!clean || clean.length < 7) {
      await sendMessage(
        botToken,
        chatId,
        `⚠️ <b>Telefon raqam noto‘g‘ri formatda!</b>\n\n` +
        `Iltimos, telefon raqamini to‘liq yozing (masalan: <code>+998901234567</code>) yoki «📱 Mening akkauntim (Kontakt ulashish)» tugmasini bosing:`,
        session.role ? AUTH_PHONE_KEYBOARD : START_KEYBOARD
      );
      return;
    }

    const match = findUserByInput(db, rawInput);
    if (!match) {
      await sendMessage(
        botToken,
        chatId,
        `⚠️ <b>Foydalanuvchi topilmadi!</b>\n\n` +
        `Kiritilgan telefon raqami (<code>${rawInput}</code>) EDUCO LMS tizimida ro‘yxatdan o‘tmagan.\n\n` +
        `Iltimos, raqamni to‘g‘ri kiriting yoki o‘quv markaz ma’muriyatiga murojaat qiling:`,
        session.role ? AUTH_PHONE_KEYBOARD : START_KEYBOARD
      );
      return;
    }

    session.pendingAuth = { rawPhone: rawInput, match };
    session.state = 'auth_awaiting_password';
    sessions[chatId] = session;
    await saveWorkerSessions(env, sessions);

    const displayName = match.type === 'user'
      ? (match.user.fullName || match.user.name || `${match.user.first_name || ''} ${match.user.last_name || ''}`.trim())
      : (match.children && match.children[0] ? `Ota-ona (${match.children.map((c) => c.name || c.fullName).join(', ')})` : 'Foydalanuvchi');

    await sendMessage(
      botToken,
      chatId,
      `👤 <b>Foydalanuvchi aniqlandi:</b> ${displayName}\n\n` +
      `🔑 <b>Akkaunt parolini kiriting:</b>\n` +
      `<i>Boshqa akkauntga kirayotganingiz sababli parolni yozib yuboring (bekor qilish uchun pastdagi tugmani bosing):</i>`,
      CANCEL_AUTH_KEYBOARD
    );
    return;
  }

  // 7. Password Verification
  if (session.state === 'auth_awaiting_password' && text && !text.startsWith('/')) {
    const enteredPassword = text.trim();
    const pending = session.pendingAuth;

    if (!pending || !pending.match) {
      session.state = 'auth_awaiting_phone';
      sessions[chatId] = session;
      await saveWorkerSessions(env, sessions);
      await sendMessage(botToken, chatId, `Iltimos, avval telefon raqamingizni yuboring:`, session.role ? AUTH_PHONE_KEYBOARD : START_KEYBOARD);
      return;
    }

    const match = pending.match;
    let passwordValid = false;

    if (match.type === 'user') {
      const userPassword = (match.user.password || '').trim();
      if (userPassword && userPassword === enteredPassword) passwordValid = true;
    } else if (match.type === 'parent') {
      const children = match.children || [];
      const dbUsers = db.educo_db_users || [];
      for (const c of children) {
        const fullChild = dbUsers.find((u) => u.id === c.id);
        if (fullChild && fullChild.password && fullChild.password.trim() === enteredPassword) {
          passwordValid = true;
          break;
        }
      }
    }

    if (!passwordValid) {
      await sendMessage(
        botToken,
        chatId,
        `❌ <b>Parol noto‘g‘ri kiritildi!</b>\n\n` +
        `Iltimos, parolingizni tekshirib qaytadan kiriting yoki <b>«❌ Bekor qilish»</b> tugmasini bosing:`,
        CANCEL_AUTH_KEYBOARD
      );
      return;
    }

    session.phone = pending.rawPhone;
    session.role = match.role;
    session.state = 'main';
    session.history = [];
    session.pendingAuth = null;

    if (match.type === 'user') {
      session.userId = match.user.id;
      session.fullName = match.user.fullName || match.user.full_name || `${match.user.first_name || ''} ${match.user.last_name || ''}`.trim();

      const uIdx = (db.educo_db_users || []).findIndex((u) => u.id === match.user.id);
      if (uIdx >= 0) {
        db.educo_db_users[uIdx].telegram_chat_id = chatId;
        db.educo_db_users[uIdx].telegram_username = msg.from?.username || '';
        await saveWorkerKey(env, 'educo_db_users', db.educo_db_users);
      }
    } else if (match.type === 'parent') {
      session.children = match.children.map((c) => ({
        id: c.id,
        name: c.fullName || c.full_name || `${c.first_name || ''} ${c.last_name || ''}`.trim(),
        phone: c.phone
      }));
      session.activeChildId = session.children[0].id;
      session.fullName = `Ota-ona (${session.children.map((c) => c.name).join(', ')})`;

      (db.educo_db_users || []).forEach((u) => {
        if (session.children.some((c) => c.id === u.id)) {
          u.parent_telegram_chat_id = chatId;
        }
      });
      await saveWorkerKey(env, 'educo_db_users', db.educo_db_users);
    }

    sessions[chatId] = session;
    await saveWorkerSessions(env, sessions);

    const roleNames = {
      owner: '👑 Boshqaruvchi (Owner)',
      admin: '👔 Administrator',
      teacher: 'Mentor',
      student: '🎓 Talaba / O‘quvchi',
      parent: '👨‍👩‍👧 Ota-ona',
    };
    const displayRole = roleNames[session.role] || (session.role === 'teacher' ? 'Mentor' : session.role);

    const welcome = `🎉 <b>Muvaffaqiyatli kirdingiz!</b>\n\n` +
      `Xush kelibsiz, <b>${session.fullName}</b>!\n` +
      `Sizning rolingiz: <b>${displayRole}</b>\n\n` +
      `Quyidagi menyudan boshqaruv bo‘limini tanlang:`;

    await sendMessage(botToken, chatId, welcome, getMainMenuKeyboard(session));
    return;
  }

  // Require Authorization
  if (!session.role) {
    await sendMessage(
      botToken,
      chatId,
      `Iltimos, avval <b>«📱 Telefon raqamimni tasdiqlash»</b> tugmasi orqali o‘z profilingizni tasdiqlang.`,
      START_KEYBOARD
    );
    return;
  }

  // Navigation: Home & Back
  if (text === '🏠 Bosh menyu') {
    session.state = 'main';
    session.history = [];
    sessions[chatId] = session;
    await saveWorkerSessions(env, sessions);
    await sendMessage(botToken, chatId, `🏠 <b>Bosh menyu:</b>`, getMainMenuKeyboard(session));
    return;
  }

  if (text === '⬅️ Ortga') {
    const prevState = session.history.pop() || 'main';
    session.state = prevState;
    sessions[chatId] = session;
    await saveWorkerSessions(env, sessions);
    await sendMessage(botToken, chatId, `Asosiy menyuga qaytildi:`, getMainMenuKeyboard(session));
    return;
  }

  // Greetings & Menu fallback
  const lowText = text.toLowerCase();
  if (lowText === 'salom' || lowText.includes('assalom') || lowText === 'boshlash' || lowText === '/menu') {
    const roleNames = {
      owner: '👑 Boshqaruvchi (Owner)', admin: '👔 Administrator', teacher: 'Mentor', student: '🎓 Talaba / O‘quvchi', parent: '👨‍👩‍👧 Ota-ona'
    };
    const roleTitle = roleNames[session.role] || (session.role || '').toUpperCase();
    const welcome = `Assalomu alaykum, <b>${session.fullName || 'Foydalanuvchi'}</b>! 👋\n\n` +
      `EDUCO LMS tizimining rasmiy botiga xush kelibsiz.\n` +
      `Sizning maqomingiz: <b>${roleTitle}</b>\n\n` +
      `Boshqaruv uchun quyidagi menyudan foydalaning:`;
    await sendMessage(botToken, chatId, welcome, getMainMenuKeyboard(session));
    return;
  }

  const role = session.role;

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
      await sendMessage(botToken, chatId, msgText, getSubMenuKeyboard());
      return;
    }

    if (text === '💰 Moliyaviy tahlil') {
      const payments = db.educo_db_payments || [];
      const courses = db.educo_db_courses || [];
      let totalCollected = 0;
      payments.forEach((p) => { totalCollected += Number(p.amount) || 0; });

      const msgText = `💰 <b>Moliyaviy Hisobot & Tushumlar</b>\n\n` +
        `💵 <b>Umumiy to‘plangan to‘lovlar:</b> ${totalCollected.toLocaleString('uz-UZ')} so‘m\n` +
        `🧾 <b>Jami to‘lov tranzaksiyalari:</b> ${payments.length} ta\n` +
        `📌 <b>Oylik to‘lov o‘rtacha kursi:</b> ${(courses[0]?.monthly_fee || 498000).toLocaleString('uz-UZ')} so‘m\n\n` +
        `Batafsil ma'lumotlar veb-panelda real-vaqtda yangilanib boradi.`;
      await sendMessage(botToken, chatId, msgText, getSubMenuKeyboard());
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
      await sendMessage(botToken, chatId, msgText, getSubMenuKeyboard());
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
      await sendMessage(botToken, chatId, msgText, getSubMenuKeyboard());
      return;
    }
  }

  // --- ADMIN HANDLERS ---
  if (role === 'admin') {
    if (text === '👥 Guruhlar va O‘quvchilar') {
      const groups = (db.educo_db_groups || []).filter((g) => g.status !== 'archived');
      let msgText = `👥 <b>Guruhlar va O‘quvchilar Sig‘imi:</b>\n\n`;
      groups.slice(0, 10).forEach((g, idx) => {
        msgText += `<b>${idx + 1}. ${g.name}</b>\n` +
          `   Sig‘im: ${(g.student_ids || []).length} / ${g.capacity || 20} o‘quvchi\n` +
          `   Ustoz: ${g.teacher_name || "Noma'lum"}\n\n`;
      });
      await sendMessage(botToken, chatId, msgText, getSubMenuKeyboard());
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
        await sendMessage(botToken, chatId, `Bugun uchun dars jadvali topilmadi (Dam olish kuni).`, getSubMenuKeyboard());
        return;
      }

      let msgText = `📅 <b>Bugungi Darslar Jadvali (${todaySchedules.length} ta dars):</b>\n\n`;
      todaySchedules.forEach((s, idx) => {
        const group = groups.find((g) => g.id === s.group_id);
        msgText += `<b>${idx + 1}. ${group?.name || 'Guruh'}</b>\n` +
          `   🕒 Vaqt: ${s.start_time.slice(0, 5)} - ${s.end_time.slice(0, 5)}\n` +
          `   🚪 Xona: ${s.room || group?.room || 'Xona'}\n\n`;
      });
      await sendMessage(botToken, chatId, msgText, getSubMenuKeyboard());
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
      await sendMessage(botToken, chatId, msgText, getSubMenuKeyboard());
      return;
    }
  }

  // --- IN-BOT ATTENDANCE & GRADING (TEACHER, OWNER & ADMIN) ---
  if (role === 'teacher' || role === 'owner' || role === 'admin') {
    const allGroups = (db.educo_db_groups || []).filter((g) => g.status !== 'archived');
    const teacherId = session.userId;
    let targetGroups = (role === 'owner' || role === 'admin')
      ? allGroups
      : allGroups.filter((g) => g.teacher_id === teacherId || (g.teacher_name && g.teacher_name.toLowerCase().includes('abdulaziz')));

    if (targetGroups.length === 0) targetGroups = allGroups;

    if (text === '📝 Tezkor davomat') {
      if (targetGroups.length === 0) {
        await sendMessage(botToken, chatId, `Markazda faol guruhlar topilmadi.`, getSubMenuKeyboard());
        return;
      }

      if (targetGroups.length === 1 && role === 'teacher') {
        await renderGroupAttendancePanel(botToken, chatId, null, targetGroups[0].id, null, null, false, env);
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
        if (st.canProceed) timeBadge = ' 🟢 [Dars vaqti]';
        else if (st.reason === 'not_started_yet') timeBadge = ` ⏳ [${st.startTime}]`;
        else timeBadge = ` 📅 [${getGroupLessonDaysSummary(g)}]`;

        return [{ text: `👥 ${g.name}${attBadge}${timeBadge}`, callback_data: `att_g:${g.id}` }];
      });

      await sendMessage(
        botToken,
        chatId,
        `📝 <b>Davomat Nazorati:</b> Qaysi guruh davomatini ko‘rmoqchisiz / yangilamoqchisiz?`,
        { reply_markup: { inline_keyboard: groupButtons } }
      );
      return;
    }

    if (text === '🌟 Baholar') {
      if (targetGroups.length === 0) {
        await sendMessage(botToken, chatId, `Markazda faol guruhlar topilmadi.`, getSubMenuKeyboard());
        return;
      }

      if (targetGroups.length === 1) {
        await renderGroupGradingPanel(botToken, chatId, null, targetGroups[0].id, null, null, false, env);
        return;
      }

      const groupButtons = targetGroups.slice(0, 15).map((g) => {
        const st = checkGroupLessonStatus(g, db, session, session.forceBypass?.[g.id]);
        let timeBadge = '';
        if (st.canProceed) timeBadge = ' 🟢 [Dars vaqti]';
        else if (st.reason === 'not_started_yet') timeBadge = ` ⏳ [${st.startTime}]`;
        else timeBadge = ` 📅 [${getGroupLessonDaysSummary(g)}]`;
        return [{ text: `👥 ${g.name}${timeBadge}`, callback_data: `grd_g:${g.id}` }];
      });

      await sendMessage(
        botToken,
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
        1: 'Dushanba', 2: 'Seshanba', 3: 'Chorshanba', 4: 'Payshanba', 5: 'Juma', 6: 'Shanba', 7: 'Yakshanba'
      };

      if (schedules.length === 0) {
        await sendMessage(botToken, chatId, `Sizga biriktirilgan dars jadvali topilmadi.`, getSubMenuKeyboard());
        return;
      }

      let msgText = `📅 <b>Hurmatli ustoz, haftalik dars jadvalingiz:</b>\n\n`;
      schedules.sort((a, b) => a.day_of_week - b.day_of_week).forEach((s) => {
        const grp = myGroups.find((g) => g.id === s.group_id);
        msgText += `📌 <b>${dayNames[s.day_of_week]}:</b> ${grp?.name || 'Guruh'}\n` +
          `   🕒 ${s.start_time.slice(0, 5)} - ${s.end_time.slice(0, 5)} | 🚪 ${s.room || 'Xona'}\n\n`;
      });
      await sendMessage(botToken, chatId, msgText, getSubMenuKeyboard());
      return;
    }

    if (text === '👥 Mening guruhlarim') {
      if (myGroups.length === 0) {
        await sendMessage(botToken, chatId, `Sizga hali guruh biriktirilmagan.`, getSubMenuKeyboard());
        return;
      }
      let msgText = `👥 <b>Sizning Guruhlaringiz (${myGroups.length} ta):</b>\n\n`;
      myGroups.forEach((g, idx) => {
        msgText += `<b>${idx + 1}. ${g.name}</b>\n` +
          `   📚 Yo‘nalish: ${g.course_name || g.direction || 'Fan'}\n` +
          `   👥 O‘quvchilar: ${(g.student_ids || []).length} nafar\n` +
          `   🚪 Xona: ${g.room || 'Xona'}\n\n`;
      });
      await sendMessage(botToken, chatId, msgText, getSubMenuKeyboard());
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

      await sendMessage(botToken, chatId, msgText, getSubMenuKeyboard());
      return;
    }

    if (text === '🌟 Mening baholarim') {
      const grades = (db.educo_db_grades || []).filter((g) => g.student_id === studentId);
      if (grades.length === 0) {
        await sendMessage(botToken, chatId, `🌟 Sizga hali baho qo‘yilmagan. Darslarda faol bo‘ling!`, getSubMenuKeyboard());
        return;
      }
      let msgText = `🌟 <b>Sizning Baholaringiz:</b>\n\n`;
      grades.slice(-6).reverse().forEach((g, idx) => {
        msgText += `<b>${idx + 1}. Ball: ${g.grade_value}</b> | ${g.topic || 'Mavzu'}\n` +
          `   Ustoz izohi: <i>"${g.feedback || "A'lo"}"</i>\n\n`;
      });
      await sendMessage(botToken, chatId, msgText, getSubMenuKeyboard());
      return;
    }

    if (text === '📅 Dars jadvalim') {
      const user = (db.educo_db_users || []).find((u) => u.id === studentId);
      const groupIds = user?.group_ids || (user?.group_id ? [user.group_id] : []);
      const schedules = (db.educo_db_lesson_schedules || []).filter((s) => groupIds.includes(s.group_id));

      const dayNames = {
        1: 'Dushanba', 2: 'Seshanba', 3: 'Chorshanba', 4: 'Payshanba', 5: 'Juma', 6: 'Shanba', 7: 'Yakshanba'
      };

      if (schedules.length === 0) {
        await sendMessage(botToken, chatId, `Sizga hali dars jadvali biriktirilmagan.`, getSubMenuKeyboard());
        return;
      }

      let msgText = `📅 <b>Sizning Haftalik Dars Jadvalingiz:</b>\n\n`;
      schedules.sort((a, b) => a.day_of_week - b.day_of_week).forEach((s) => {
        const group = (db.educo_db_groups || []).find((g) => g.id === s.group_id);
        msgText += `📌 <b>${dayNames[s.day_of_week]}:</b> ${group?.name || 'Guruh'}\n` +
          `   🕒 ${s.start_time.slice(0, 5)} - ${s.end_time.slice(0, 5)} | 🚪 ${s.room || 'Xona'}\n\n`;
      });
      await sendMessage(botToken, chatId, msgText, getSubMenuKeyboard());
      return;
    }

    if (text === '🔐 LMS Saytiga kirish') {
      const user = (db.educo_db_users || []).find((u) => u.id === studentId);
      const msgText = `🔐 <b>EDUCO LMS Shaxsiy Kabinetingiz:</b>\n\n` +
        `🌐 <b>Sayt:</b> https://educo-lms.pages.dev/login\n` +
        `👤 <b>Login:</b> <code>${user?.username || 'login'}</code>\n` +
        `🔑 <b>Parol:</b> <code>${user?.password || 'Parol markazdan beriladi'}</code>\n\n` +
        `Saytga kirib dars materiallari, onlayn testlar va uy vazifalarini ko‘rishingiz mumkin.`;
      await sendMessage(botToken, chatId, msgText, getSubMenuKeyboard());
      return;
    }
  }

  // --- PARENT HANDLERS ---
  if (role === 'parent') {
    const children = session.children || [];
    let activeChild = children.find((c) => c.id === session.activeChildId) || children[0];

    if (text === '👶 Farzandni tanlash') {
      const childButtons = children.map((c) => [
        { text: `👦 ${c.name}`, callback_data: `child_sel:${c.id}` }
      ]);
      await sendMessage(
        botToken,
        chatId,
        `Qaysi farzandingiz ma’lumotlarini ko‘rmoqchisiz?`,
        { reply_markup: { inline_keyboard: childButtons } }
      );
      return;
    }

    if (text === '📊 Farzandim davomati') {
      if (!activeChild) {
        await sendMessage(botToken, chatId, `Farzand ma'lumotlari topilmadi.`, getSubMenuKeyboard());
        return;
      }
      const attendance = (db.educo_db_attendance || []).filter((a) => a.student_id === activeChild.id);
      const present = attendance.filter((a) => a.status === 'present').length;
      const late = attendance.filter((a) => a.status === 'late').length;
      const absent = attendance.filter((a) => a.status === 'absent').length;

      let msgText = `📊 <b>${activeChild.name}ning Davomati:</b>\n\n` +
        `🟢 Qatnashgan darslar: <b>${present} ta</b>\n` +
        `🟡 Kech qolingan: <b>${late} ta</b>\n` +
        `🔴 Kelmagan: <b>${absent} ta</b>\n\n` +
        `<b>So‘nggi qaydlar:</b>\n`;

      attendance.slice(-5).reverse().forEach((a) => {
        const icon = a.status === 'present' ? '🟢 Bor' : (a.status === 'late' ? '🟡 Kech qoldi' : '🔴 Kelmadi');
        msgText += `• ${formatUzDatePretty(a.date)}: ${icon}\n`;
      });
      await sendMessage(botToken, chatId, msgText, getSubMenuKeyboard());
      return;
    }

    if (text === '🌟 Farzandim baholari') {
      if (!activeChild) {
        await sendMessage(botToken, chatId, `Farzand ma'lumotlari topilmadi.`, getSubMenuKeyboard());
        return;
      }
      const grades = (db.educo_db_grades || []).filter((g) => g.student_id === activeChild.id);
      if (grades.length === 0) {
        await sendMessage(botToken, chatId, `🌟 Farzandingizga hali baho qo‘yilmagan.`, getSubMenuKeyboard());
        return;
      }
      let msgText = `🌟 <b>${activeChild.name}ning Baholari:</b>\n\n`;
      grades.slice(-6).reverse().forEach((g, idx) => {
        msgText += `<b>${idx + 1}. Baho: ${g.grade_value} ball</b> (${'⭐'.repeat(g.grade_value)})\n` +
          `   Mavzu: ${g.topic || 'Mavzu'}\n` +
          `   Ustoz fikri: <i>"${g.feedback || 'Yaxshi'}"</i>\n\n`;
      });
      await sendMessage(botToken, chatId, msgText, getSubMenuKeyboard());
      return;
    }
  }

  // Fallback for unhandled messages
  await sendMessage(
    botToken,
    chatId,
    `Kechirasiz, buyruq tushunarsiz bo‘ldi. Iltimos, menyudagi tugmalardan birini tanlang:`,
    getMainMenuKeyboard(session)
  );
}

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);

      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        });
      }

      
      // --- API: TELEGRAM BOT WEBHOOK (/api/telegram-webhook) ---
      if (url.pathname === '/api/telegram-webhook') {
        const botToken = env.TELEGRAM_BOT_TOKEN || BOT_TOKEN;

        // GET: Status & Management (setWebhook, deleteWebhook, getWebhookInfo)
        if (request.method === 'GET') {
          const action = url.searchParams.get('action');

          if (action === 'set') {
            const webhookUrl = url.searchParams.get('url') || `${url.origin}/api/telegram-webhook`;
            const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                url: webhookUrl,
                drop_pending_updates: true,
                allowed_updates: ['message', 'callback_query'],
              }),
            });
            const data = await tgRes.json();
            return jsonResponse({ action: 'setWebhook', webhookUrl, result: data });
          }

          if (action === 'delete') {
            const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ drop_pending_updates: true }),
            });
            const data = await tgRes.json();
            return jsonResponse({ action: 'deleteWebhook', result: data });
          }

          if (action === 'info') {
            const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
            const data = await tgRes.json();
            return jsonResponse({ action: 'getWebhookInfo', result: data });
          }

          return jsonResponse({
            status: 'online',
            service: 'EDUCO LMS Telegram Bot Edge Webhook',
            bot: '@EducoLms_Bot',
            timestamp: new Date().toISOString(),
          });
        }

        // POST: Live Telegram Updates processing
        if (request.method === 'POST') {
          try {
            const update = await request.json().catch(() => null);
            if (!update) {
              return new Response('Invalid payload', { status: 400 });
            }

            await handleTelegramUpdate(update, env, botToken);
            return new Response('OK', { status: 200 });
          } catch (err) {
            console.error('Bot webhook error:', err);
            return new Response('OK', { status: 200 }); // Always 200 so Telegram does not retry unnecessarily
          }
        }
      }

      // --- API: REALTIME EVENT SOURCE STREAM (/api/realtime, /api/realtime-stream) ---
      if (url.pathname === '/api/realtime' || url.pathname === '/api/realtime-stream') {
        return new Response(': keep-alive\n\n', {
          status: 200,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

    // --- API: SMS GATEWAY CORS PROXY (/api/sms-proxy) ---
    if (url.pathname === '/api/sms-proxy') {
      if (request.method === 'GET') {
        return jsonResponse({
          status: 'online',
          service: 'EDUCO SMS Gateway Proxy',
          timestamp: new Date().toISOString(),
        }, 200);
      }

      if (request.method === 'POST') {
        try {
          const body = await request.json().catch(() => ({}));
          const { url: targetUrl, method = 'POST', headers = {}, payload } = body;
          if (!targetUrl) {
            return jsonResponse({ error: 'url is required' }, 400);
          }

          // Demo / Simulation check: only for explicit placeholder or demo tokens
          const authHeader = headers['Authorization'] || headers['authorization'] || '';
          const isSampleToken =
            authHeader.includes('demo_token_educo') ||
            /placeholder|example\.com/i.test(targetUrl);

          if (isSampleToken) {
            return jsonResponse({
              success: true,
              simulated: true,
              message: 'SMS qabul qiluvchi telefoniga muvaffaqiyatli uzatildi (Test / Gateway rejimi)',
              timestamp: new Date().toISOString(),
            }, 200);
          }

          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 12000);

          const fetchOptions = {
            method,
            headers: { ...headers },
            signal: controller.signal,
          };

          if (method !== 'GET' && method !== 'HEAD' && payload) {
            fetchOptions.body = typeof payload === 'string' ? payload : JSON.stringify(payload);
            fetchOptions.headers['Content-Type'] = 'application/json';
          }

          let response;
          try {
            response = await fetch(targetUrl, fetchOptions);
          } catch (netErr) {
            clearTimeout(timer);
            return jsonResponse({
              error: `SMS Gateway bilan aloqa o‘rnatilmadi: ${netErr.message || 'Tarmoq xatosi'}. Agar qurilma lokal Wi-Fi (192.168.x.x) bo‘lsa, u faqat bir xil Wi-Fi tarmog‘ida ishlaydi.`,
              offline: true,
            }, 502);
          }
          clearTimeout(timer);

          const respText = await response.text();
          let parsed = null;
          try {
            parsed = JSON.parse(respText);
          } catch {
            parsed = { status: response.status, ok: response.ok, body: respText };
          }

          return new Response(JSON.stringify(parsed), {
            status: response.status,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
          });
        } catch (err) {
          return jsonResponse({ error: err.message || 'SMS Gateway proxy error' }, 502);
        }
      }
    }

    // --- API: STORE SYNC (/api/sync-store) ---
    if (url.pathname === '/api/sync-store') {
      const db = env.DB || env.DATABASE;
      const kv = env.KV || env.EDUCO_KV || env.STORE_KV;
      if (db) await initD1Tables(db);

      // GET /api/sync-store - Fetch all shared data (supports 304 Not Modified ETag caching)
      if (request.method === 'GET') {
        const rawClientETag = request.headers.get('if-none-match') || '';
        const clientETag = rawClientETag.replace(/^W\//, '').replace(/"/g, '').trim();
        const force = url.searchParams.get('force') === '1';

        let dbMaxUpdated = null;
        let dbKeyCount = 0;

        if (db) {
          try {
            const meta = await db.prepare('SELECT MAX(updated_at) as max_up, COUNT(*) as cnt FROM kv_store').first();
            if (meta) {
              dbMaxUpdated = meta.max_up;
              dbKeyCount = meta.cnt;
            }
          } catch (e) {
            console.warn('D1 meta error:', e);
          }
        }

        const currentETagValue = dbMaxUpdated
          ? `d1-${dbKeyCount}-${dbMaxUpdated}`
          : `mem-${currentStoreVersion}-${lastStoreUpdatedAt}`;
        const currentETag = `"${currentETagValue}"`;

        if (!force && clientETag && clientETag === currentETagValue) {
          return new Response(null, {
            status: 304,
            headers: {
              'ETag': currentETag,
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization, If-None-Match',
              'Access-Control-Expose-Headers': 'ETag',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
            },
          });
        }

        const store = {};

        if (db) {
          try {
            const { results } = await db.prepare('SELECT key, value FROM kv_store').all();
            if (results && results.length > 0) {
              for (const row of results) {
                try {
                  store[row.key] = JSON.parse(row.value);
                } catch {
                  store[row.key] = row.value;
                }
              }
            }
          } catch (e) {
            console.warn('D1 fetch error:', e);
          }
        }

        // Fill in missing keys from memory cache
        for (const [k, v] of memoryKV.entries()) {
          if (!store[k]) store[k] = v;
        }

        // Default: If users key is empty, ensure only Abbosbek Owner is present!
        if (!store['educo_db_users'] || !store['educo_db_users'].length) {
          store['educo_db_users'] = [
            {
              id: 'usr-owner-1',
              username: 'abbosbek',
              first_name: 'Abbosbek',
              last_name: 'Boshqaruvchi',
              fullName: 'Abbosbek',
              full_name: 'Abbosbek',
              role: 'owner',
              email: 'abbosbek@educo.app',
              phone: '+998 98 800 14 15',
              password: 'AbbosBek1415',
              password_updated_at: '2026-10-31T05:02:37.920Z',
              is_active: true,
              created_at: '2026-10-31T05:02:37.920Z',
              avatar_url: '',
            },
          ];
        }

        return new Response(JSON.stringify(store), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'ETag': currentETag,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, If-None-Match',
            'Access-Control-Expose-Headers': 'ETag',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        });
      }

      // POST /api/sync-store - Save/merge shared data
      if (request.method === 'POST') {
        try {
          const payload = await request.json();
          if (payload && typeof payload === 'object') {
            currentStoreVersion++;
            lastStoreUpdatedAt = Date.now();
            const now = new Date().toISOString();
            let postETag = `"${currentStoreVersion}-${lastStoreUpdatedAt}"`;

            // Data protection: Wipe flag ignored to prevent data loss on redeploys or client resets
            if (payload._wipe_to_clean === true) {
              console.warn('[DataProtection] Client wipe request safely ignored to protect production database.');
            }

            // 1. Reconstruct current server store for conflict-free merging
            const currentStore = {};
            if (db) {
              try {
                const { results } = await db.prepare('SELECT key, value FROM kv_store').all();
                if (results && results.length > 0) {
                  for (const row of results) {
                    try {
                      currentStore[row.key] = JSON.parse(row.value);
                    } catch {
                      currentStore[row.key] = row.value;
                    }
                  }
                }
              } catch (e) {
                console.warn('D1 read error during merge:', e);
              }
            }
            for (const [k, v] of memoryKV.entries()) {
              if (currentStore[k] === undefined) currentStore[k] = v;
            }

            // 2. Perform safe, conflict-free multi-gadget merge
            const merged = mergeCollections(currentStore, payload);

            for (const [key, value] of Object.entries(merged)) {
              if (key.startsWith('_')) continue;
              memoryKV.set(key, value);

              if (db) {
                try {
                  const valStr = JSON.stringify(value);
                  await db
                    .prepare(
                      'INSERT INTO kv_store (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at'
                    )
                    .bind(key, valStr, now)
                    .run();
                } catch (e) {
                  console.warn(`D1 save error for ${key}:`, e);
                }
              }

              if (kv && typeof kv.put === 'function') {
                try {
                  await kv.put(key, JSON.stringify(value));
                } catch (_) {}
              }

              // Broadcast changes to real-time sync bus for all gadgets
              try {
                fetch('https://ntfy.sh/educo_lms_sync_bus_8899', {
                  method: 'POST',
                  headers: { 'Title': 'STORE_UPDATE', 'Tags': 'sync' },
                  body: JSON.stringify({ type: 'STORE_UPDATE', key, val: value, deviceId: 'worker', ts: Date.now() }),
                }).catch(() => {});
              } catch (_) {}
            }

            postETag = `"${currentStoreVersion}-${lastStoreUpdatedAt}"`;
            if (db) {
              try {
                const meta = await db.prepare('SELECT MAX(updated_at) as max_up, COUNT(*) as cnt FROM kv_store').first();
                if (meta && meta.max_up) {
                  postETag = `"d1-${meta.cnt}-${meta.max_up}"`;
                }
              } catch (_) {}
            }
            return jsonResponse({ success: true, timestamp: now }, 200, { 'ETag': postETag });
          }
          return jsonResponse({ success: true, timestamp: new Date().toISOString() });
        } catch (err) {
          return jsonResponse({ error: err.message }, 400);
        }
      }
    }

    // --- API: CHAT MEDIA UPLOAD (/api/chat/upload) ---
    if (url.pathname === '/api/chat/upload' && request.method === 'POST') {
      try {
        const db = env.DB;
        if (db) await initD1Tables(db);

        const contentType = request.headers.get('content-type') || '';
        let fileName = 'file';
        let mimeType = 'application/octet-stream';
        let fileBytes = null;
        let base64Data = null;

        if (contentType.includes('multipart/form-data')) {
          const formData = await request.formData();
          const file = formData.get('file');
          if (file && file instanceof File) {
            fileName = file.name;
            mimeType = file.type || 'application/octet-stream';
            fileBytes = await file.arrayBuffer();
          }
        } else if (contentType.includes('application/json')) {
          const json = await request.json();
          fileName = json.name || 'recording.webm';
          mimeType = json.type || 'video/webm';
          base64Data = json.base64;
          if (base64Data) {
            // Strip data: prefix if present
            const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
            const binary = atob(cleanBase64);
            const len = binary.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            fileBytes = bytes.buffer;
          }
        } else {
          // Direct binary stream
          mimeType = contentType;
          fileName = request.headers.get('x-file-name') || `media_${Date.now()}`;
          fileBytes = await request.arrayBuffer();
        }

        if (!fileBytes && !base64Data) {
          return jsonResponse({ error: 'No file data received' }, 400);
        }

        // Security: Restrict maximum upload size to 50MB
        if (fileBytes && fileBytes.byteLength > 50 * 1024 * 1024) {
          return jsonResponse({ error: 'Fayl hajmi 50MB dan oshmasligi kerak (File size exceeds 50MB limit)' }, 413);
        }

        const rawExt = fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : (mimeType.includes('video') ? 'webm' : 'jpg');
        const ext = rawExt.replace(/[^a-z0-9]/g, '').slice(0, 8) || 'bin';
        const mediaId = `media_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

        // 1. If R2 bucket is bound, put into R2
        const r2 = env.R2 || env.MEDIA_BUCKET;
        if (r2 && fileBytes) {
          await r2.put(mediaId, fileBytes, {
            httpMetadata: { contentType: mimeType },
          });
        }

        // 2. If D1 is bound, store binary as base64 in media_blobs
        if (db) {
          try {
            if (!base64Data && fileBytes) {
              const u8 = new Uint8Array(fileBytes);
              let binary = '';
              const chunkSize = 8192;
              for (let i = 0; i < u8.length; i += chunkSize) {
                binary += String.fromCharCode.apply(null, u8.subarray(i, i + chunkSize));
              }
              base64Data = btoa(binary);
            }
            await db
              .prepare('INSERT OR REPLACE INTO media_blobs (id, mime_type, data_base64, created_at) VALUES (?, ?, ?, ?)')
              .bind(mediaId, mimeType, base64Data, new Date().toISOString())
              .run();
          } catch (e) {
            console.warn('D1 media save fallback:', e);
          }
        }

        // 3. In-memory cache as well
        if (fileBytes) {
          memoryMedia.set(mediaId, { bytes: fileBytes, mimeType });
        }

        const mediaUrl = `/api/chat/media/${mediaId}`;
        return jsonResponse({
          success: true,
          id: mediaId,
          url: mediaUrl,
          file_name: fileName,
          file_type: mimeType,
          file_size: fileBytes ? fileBytes.byteLength : 0,
        });
      } catch (err) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    // --- API: CHAT MEDIA RETRIEVAL (/api/chat/media/:id) ---
    if (url.pathname.startsWith('/api/chat/media/')) {
      const mediaId = url.pathname.replace('/api/chat/media/', '').trim();
      const r2 = env.R2 || env.MEDIA_BUCKET;
      const db = env.DB;

      // 1. Try R2
      if (r2) {
        try {
          const obj = await r2.get(mediaId);
          if (obj) {
            return new Response(obj.body, {
              headers: {
                'Content-Type': obj.httpMetadata?.contentType || 'application/octet-stream',
                'Cache-Control': 'public, max-age=31536000, immutable',
                'Access-Control-Allow-Origin': '*',
              },
            });
          }
        } catch (e) {}
      }

      // 2. Try D1
      if (db) {
        try {
          const row = await db.prepare('SELECT mime_type, data_base64 FROM media_blobs WHERE id = ?').bind(mediaId).first();
          if (row && row.data_base64) {
            const binary = atob(row.data_base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            return new Response(bytes.buffer, {
              headers: {
                'Content-Type': row.mime_type || 'application/octet-stream',
                'Cache-Control': 'public, max-age=31536000, immutable',
                'Access-Control-Allow-Origin': '*',
              },
            });
          }
        } catch (e) {}
      }

      // 3. Try Memory Cache
      if (memoryMedia.has(mediaId)) {
        const item = memoryMedia.get(mediaId);
        return new Response(item.bytes, {
          headers: {
            'Content-Type': item.mimeType || 'application/octet-stream',
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      return new Response('Media Not Found', { status: 404 });
    }

    // --- API: MARK MESSAGE AS SEEN (/api/chat/seen) ---
    if (url.pathname === '/api/chat/seen' && request.method === 'POST') {
      try {
        const { messageId, user } = await request.json();
        if (!messageId || !user) {
          return jsonResponse({ error: 'messageId and user required' }, 400);
        }

        const db = env.DB;
        let messages = memoryKV.get('educo_db_chat_messages') || [];

        if (db) {
          try {
            const row = await db.prepare("SELECT value FROM kv_store WHERE key = 'educo_db_chat_messages'").first();
            if (row && row.value) {
              messages = JSON.parse(row.value);
            }
          } catch (e) {}
        }

        const msgIndex = messages.findIndex((m) => m.id === messageId);
        if (msgIndex >= 0) {
          const msg = messages[msgIndex];
          const isStaffChat = msg.group_id === 'staff-general-chat';

          // SECURITY GUARD: Never allow students in staff chat seen receipts
          if (isStaffChat && user.user_role === 'student') {
            return jsonResponse({ error: 'Students not permitted in staff chat' }, 403);
          }

          if (!msg.seen_by) msg.seen_by = [];
          const alreadyIdx = msg.seen_by.findIndex((s) => s.user_id === user.user_id);
          if (alreadyIdx >= 0) {
            // Update name and role if previously saved as generic 'User' / 'student'
            if (user.user_name && user.user_name !== 'User') {
              msg.seen_by[alreadyIdx].user_name = user.user_name;
            }
            if (user.user_role && user.user_role !== 'student') {
              msg.seen_by[alreadyIdx].user_role = user.user_role;
            }
            if (user.avatar_url) {
              msg.seen_by[alreadyIdx].avatar_url = user.avatar_url;
            }
          } else {
            msg.seen_by.push({
              user_id: user.user_id,
              user_name: user.user_name || 'Xodim',
              user_role: user.user_role || (isStaffChat ? 'teacher' : 'student'),
              avatar_url: user.avatar_url || '',
              seen_at: new Date().toISOString(),
            });
          }

          // Sanitize: Clean up any invalid student entries in staff chat
          if (isStaffChat) {
            msg.seen_by = msg.seen_by.filter((s) => s.user_role !== 'student' && s.user_name !== 'User');
          }

          messages[msgIndex] = msg;
          memoryKV.set('educo_db_chat_messages', messages);

          if (db) {
            try {
              await db
                .prepare(
                  "INSERT INTO kv_store (key, value, updated_at) VALUES ('educo_db_chat_messages', ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at"
                )
                .bind(JSON.stringify(messages), new Date().toISOString())
                .run();
            } catch (e) {}
          }
          return jsonResponse({ success: true, seen_by: msg.seen_by });
        }
        return jsonResponse({ error: 'Message not found' }, 404);
      } catch (err) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    // For everything else, serve static frontend assets with SPA fallback on 404
    try {
      let assetResponse = await env.ASSETS.fetch(request);
      if (assetResponse.status === 404 && request.method === 'GET' && !url.pathname.includes('.')) {
        const indexUrl = new URL('/index.html', request.url);
        assetResponse = await env.ASSETS.fetch(new Request(indexUrl, {
          method: 'GET',
          headers: request.headers,
        }));
      }

      // Prevent Cloudflare Edge & Browser from caching index.html so updates are instant
      const isHtml =
        url.pathname === '/' ||
        url.pathname === '/index.html' ||
        assetResponse.headers.get('content-type')?.includes('text/html');

      if (isHtml && assetResponse.status === 200) {
        const freshHeaders = new Headers(assetResponse.headers);
        freshHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        freshHeaders.set('Pragma', 'no-cache');
        freshHeaders.set('Expires', '0');
        return new Response(assetResponse.body, {
          status: assetResponse.status,
          statusText: assetResponse.statusText,
          headers: freshHeaders,
        });
      }

      return assetResponse;
    } catch (assetErr) {
      console.warn('Asset fetch fallback:', assetErr);
      return new Response('Asset Not Found', { status: 404 });
    }
  } catch (workerErr) {
    console.error('Worker top-level error:', workerErr);
    try {
      return await env.ASSETS.fetch(request);
    } catch {
      return new Response('Server Error', { status: 500 });
    }
  }
},
};
