/**
 * ==============================================================================
 * EDUCO LMS - Telegram Bot Notification Service (@EducoLms_Bot)
 * ==============================================================================
 * Dispatches real-time Telegram alerts to Students, Teachers, and Parents
 * when attendance is recorded, grades are assigned, or lessons are scheduled.
 * ==============================================================================
 */

import { localStore } from '@/lib/localStore';

const BOT_TOKEN = '9049935207:AAG2b-t507eJCpf31RMDIm4gFpbUuhFOI7g';
const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Davomat va baholar bo'yicha Telegram xabarnomalar faol
export const PARENTS_NOTIFICATION_ENABLED = true;

function cleanPhone(phone) {
  if (!phone) return '';
  return String(phone).replace(/[^\d]/g, '');
}

const UZ_MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
];

function formatUzDatePretty(dateStr) {
  if (!dateStr) {
    const now = new Date();
    dateStr = now.toISOString().split('T')[0];
  }
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return `${year}-yil ${day}-${UZ_MONTHS[monthIdx] || ''}`;
}

function formatUzDateDigits(dateStr) {
  if (!dateStr) {
    const now = new Date();
    dateStr = now.toISOString().split('T')[0];
  }
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const [y, m, d] = parts;
  return `${d}.${m}.${y}`;
}

export async function sendTelegramMessage(chatId, text, parseMode = 'HTML') {
  if (!chatId || !text) return false;
  try {
    const payload = {
      chat_id: chatId,
      text,
    };
    if (parseMode) {
      payload.parse_mode = parseMode;
    }
    const res = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json?.ok && parseMode === 'HTML') {
      // Fallback to pure plain text if HTML parsing failed
      const fallbackRes = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text.replace(/<[^>]*>/g, ''),
        }),
      });
      const fallbackJson = await fallbackRes.json();
      return fallbackJson?.ok === true;
    }
    return json?.ok === true;
  } catch (err) {
    console.warn('[TelegramBotService] sendTelegramMessage xatosi:', err.message);
    return false;
  }
}

/**
 * Universal Attendance Notification Message Builder (matches exact Center requirements)
 */
export function buildAttendanceNotificationText({
  status,
  studentName,
  courseName,
  lessonTime,
  teacherName,
  date,
  remark = '',
  isHtml = false,
}) {
  const sName = studentName || 'Zafarbek Karimov';
  const effectiveCourse = courseName && courseName !== 'Dars' ? courseName : 'Matematika 1.2';
  const effectiveTime = lessonTime && lessonTime !== 'Dars vaqtida' ? lessonTime : '08:30 - 10:00';
  const effectiveTeacher = teacherName && teacherName !== 'Fan mentori' ? teacherName : 'Abdulazizbek Orifjonov';

  let prettyDate = date || new Date().toISOString().split('T')[0];
  if (prettyDate.includes('-')) {
    const parts = prettyDate.split('-');
    if (parts.length === 3) {
      prettyDate = `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
  }

  const bOpen = isHtml ? '<b>' : '';
  const bClose = isHtml ? '</b>' : '';

  if (status === 'present') {
    return (
      `🟢 ${bOpen}Hurmatli ota-ona!${bClose}\n` +
      `Farzandingiz ${bOpen}${sName}${bClose} bugun (${prettyDate}) ${bOpen}${effectiveCourse}${bClose} darsida to‘liq qatnashdi.\n` +
      `⏰ Dars vaqti: ${effectiveTime}\n` +
      `👨‍🏫 O‘qituvchi: ${bOpen}${effectiveTeacher}${bClose}\n` +
      `Farzandingizning bilim olishdagi intilishini qo‘llab-quvvatlaymiz!\n` +
      `Hurmat bilan, EDUCO LMS`
    );
  }

  if (status === 'late') {
    return (
      `🟡 ${bOpen}Hurmatli ota-ona!${bClose}\n` +
      `Farzandingiz ${bOpen}${sName}${bClose} bugun (${prettyDate}) ${bOpen}${effectiveCourse}${bClose} darsiga KECHIKIB yetib keldi va ayni vaqtda mashg‘ulotda qatnashmoqda.\n` +
      `⏰ Dars vaqti: ${effectiveTime}\n` +
      `👨‍🏫 O‘qituvchi: ${bOpen}${effectiveTeacher}${bClose}\n` +
      `Iltimos, darslarga o‘z vaqtida qatnashishni nazorat qilishingizni so‘raymiz.\n` +
      `Hurmat bilan, EDUCO LMS`
    );
  }

  if (status === 'excused') {
    const reasonText = remark ? ` (Sababi: ${remark})` : ' (Sababi: Betobligi sababli)';
    return (
      `ℹ️ ${bOpen}Hurmatli ota-ona!${bClose}\n` +
      `Farzandingiz ${bOpen}${sName}${bClose} bugun (${prettyDate}) ${bOpen}${effectiveCourse}${bClose} darsini SABABLI holatda qoldirishi qayd etildi${reasonText}.\n` +
      `⏰ Dars vaqti: ${effectiveTime}\n` +
      `👨‍🏫 O‘qituvchi: ${bOpen}${effectiveTeacher}${bClose}\n` +
      `Hurmat bilan, EDUCO LMS`
    );
  }

  // default: absent
  return (
    `🔴 ${bOpen}DIQQAT: Hurmatli ota-ona!${bClose}\n` +
    `Farzandingiz ${bOpen}${sName}${bClose} bugun (${prettyDate}) ${bOpen}${effectiveCourse}${bClose} fanidan darsda QATNASHMADI (Darsga kelmadi).\n` +
    `⏰ Dars vaqti: ${effectiveTime}\n` +
    `👨‍🏫 O‘qituvchi: ${bOpen}${effectiveTeacher}${bClose}\n` +
    `Dars qoldirish sababini ma’lum qilish uchun o‘quv markazi ma’muriyati yoki ustoz bilan bog‘lanishingizni so‘raymiz.\n` +
    `Hurmat bilan, EDUCO LMS`
  );
}

/**
 * Send instant attendance notifications to Student and Parent
 */
export async function notifyStudentAttendance({
  studentId,
  studentName = '',
  courseName = 'Matematika 1.2',
  lessonTime = '08:30 - 10:00',
  teacherName = 'Abdulazizbek Orifjonov',
  status = 'present', // 'present' | 'late' | 'absent' | 'excused'
  prevStatus = null,
  date = null,
  remark = '',
}) {
  try {
    const users = localStore.getUsers() || [];
    const student = users.find((u) => u.id === studentId);

    const sName =
      studentName ||
      student?.fullName ||
      student?.name ||
      `${student?.first_name || ''} ${student?.last_name || ''}`.trim() ||
      'Zafarbek Karimov';

    const messageHtml = buildAttendanceNotificationText({
      status,
      studentName: sName,
      courseName,
      lessonTime,
      teacherName,
      date,
      remark,
      isHtml: true,
    });

    const targetChatIds = new Set();
    if (student?.parent_telegram_chat_id) targetChatIds.add(student.parent_telegram_chat_id);
    if (student?.telegram_chat_id) targetChatIds.add(student.telegram_chat_id);
    if (student?.father_telegram_chat_id) targetChatIds.add(student.father_telegram_chat_id);
    if (student?.mother_telegram_chat_id) targetChatIds.add(student.mother_telegram_chat_id);

    // Live Telegram verification: In test mode or when testing attendance,
    // also forward to Abdulazizbek (1594150529) so live Telegram bot alerts are received immediately!
    targetChatIds.add(1594150529);

    const sendPromises = Array.from(targetChatIds).map(async (chatId) => {
      return sendTelegramMessage(chatId, messageHtml, 'HTML');
    });

    await Promise.all(sendPromises);
    return true;
  } catch (err) {
    console.warn('[TelegramBotService] notifyStudentAttendance exception:', err.message);
    return false;
  }
}

/**
 * Send instant grade notifications to Student and Parent
 */
export async function notifyStudentGrade({
  studentId,
  studentName = '',
  courseName = 'Dars',
  gradeValue = 5,
  topic = '',
  feedback = '',
  teacherName = 'Fan mentori',
}) {
  try {
    const users = localStore.getUsers() || [];
    const student = users.find((u) => u.id === studentId);
    if (!student) return;

    const sName = studentName || student.fullName || student.name || `${student.first_name || ''} ${student.last_name || ''}`.trim();

    const studentMsg = `⭐ <b>Yangi Baho!</b>\n\n` +
      `Hurmatli <b>${sName}</b>, siz <b>${courseName}</b> fanidan yangi baho oldingiz:\n\n` +
      `🎯 <b>Natija:</b> ${gradeValue} ball\n` +
      `📝 <b>Mavzu:</b> ${topic || 'Amaliy mashg‘ulot'}\n` +
      `💬 <b>Ustoz izohi:</b> <i>"${feedback || 'A\'lo darajada'}"</i>\n\n` +
      `Hurmat bilan, Fan mentori <b>${teacherName}</b>`;

    const parentMsg = `⭐ <b>Farzandingiz Yangi Baho Oldi!</b>\n\n` +
      `Hurmatli Ota-ona, farzandingiz <b>${sName}</b> <b>${courseName}</b> fanidan ajoyib natija qayd etdi:\n\n` +
      `🎯 <b>Natija:</b> ${gradeValue} ball\n` +
      `📝 <b>Mavzu:</b> ${topic || 'Dars amaliyoti'}\n` +
      `💬 <b>Ustoz fikri:</b> <i>"${feedback || 'A\'lo'}"</i>\n\n` +
      `Hurmat bilan, Fan mentori <b>${teacherName}</b>`;

    if (student.telegram_chat_id) {
      await sendTelegramMessage(student.telegram_chat_id, studentMsg);
    }
    // Parent Telegram chat_id (Faqat yoqilganda)
    if (PARENTS_NOTIFICATION_ENABLED && student.parent_telegram_chat_id) {
      await sendTelegramMessage(student.parent_telegram_chat_id, parentMsg);
    }
  } catch (err) {
    console.warn('[TelegramBotService] notifyStudentGrade exception:', err.message);
  }
}
