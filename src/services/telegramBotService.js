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

export async function sendTelegramMessage(chatId, text) {
  if (!chatId || !text) return false;
  try {
    const res = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    });
    const json = await res.json();
    return json?.ok === true;
  } catch (err) {
    console.warn('[TelegramBotService] sendTelegramMessage xatosi:', err.message);
    return false;
  }
}

/**
 * Send instant attendance notifications to Student and Parent
 */
export async function notifyStudentAttendance({
  studentId,
  studentName = '',
  courseName = 'Dars',
  lessonTime = 'Dars vaqtida',
  teacherName = 'Fan mentori',
  status = 'present', // 'present' | 'late' | 'absent'
  date = null,
}) {
  try {
    const users = localStore.getUsers() || [];
    const student = users.find((u) => u.id === studentId);
    if (!student) return;

    const sName = studentName || student.fullName || student.name || `${student.first_name || ''} ${student.last_name || ''}`.trim();
    const dateFormatted = formatUzDatePretty(date);

    let studentMsg = '';
    let parentMsg = '';

    if (status === 'present') {
      studentMsg = `🟢 Hurmatli <b>${sName}</b>,\n\n` +
        `Siz <b>${courseName}</b> fanidan ${dateFormatted} sanasidagi darsga qatnashdingiz. Dars ${lessonTime} oralig‘ida o‘tkazildi.\n\n` +
        `Biz sizning bilim olishdagi qat'iyatingiz va ishtiyoqingizni yuqori baholaymiz.\n\n` +
        `Hurmat bilan, Fan mentori <b>${teacherName}</b>`;

      parentMsg = `🟢 Hurmatli Ota-ona,\n\n` +
        `Farzandingiz <b>${sName}</b> <b>${courseName}</b> fanidan ${dateFormatted} sanasidagi darsga qatnashdi. Dars ${lessonTime} oralig‘ida o‘tkazildi.\n\n` +
        `Biz farzandingizning bilim olishdagi intilishi va ishtiyoqini yuqori baholaymiz.\n\n` +
        `Hurmat bilan, Fan mentori <b>${teacherName}</b>`;
    } else if (status === 'late') {
      studentMsg = `🟡 Hurmatli <b>${sName}</b>,\n\n` +
        `Siz <b>${courseName}</b> fanidan ${dateFormatted} kungi darsga KECH QOLIB keldingiz. Dars ${lessonTime} oralig‘ida o‘tkazilmoqda.\n\n` +
        `Iltimos, darslarga o‘z vaqtida kelishingizni so‘raymiz.\n\n` +
        `Hurmat bilan, Fan mentori <b>${teacherName}</b>`;

      parentMsg = `🟡 Hurmatli Ota-ona,\n\n` +
        `Farzandingiz <b>${sName}</b> <b>${courseName}</b> fanidan ${dateFormatted} kungi darsga KECH QOLIB yetib keldi. Dars ${lessonTime} oralig‘ida o‘tkazilmoqda.\n\n` +
        `Iltimos, darslarga o‘z vaqtida qatnashishni nazorat qilishingizni so‘raymiz.\n\n` +
        `Hurmat bilan, Fan mentori <b>${teacherName}</b>`;
    } else {
      studentMsg = `🔴 DIQQAT: Hurmatli <b>${sName}</b>,\n\n` +
        `Siz bugun (${dateFormatted}) <b>${courseName}</b> fanidan darsda QATNASHMADINGIZ (Darsga kelmadingiz). Dars vaqti: ${lessonTime}.\n\n` +
        `Sababini ma’muriyatga ma’lum qilishingizni so‘raymiz.\n\n` +
        `Hurmat bilan, EDUCO LMS Ma’muriyati`;

      parentMsg = `🔴 DIQQAT: Hurmatli Ota-ona,\n\n` +
        `Farzandingiz <b>${sName}</b> bugun (${dateFormatted}) <b>${courseName}</b> fanidan darsda QATNASHMADI (Darsga kelmadi). Dars vaqti: ${lessonTime}.\n\n` +
        `Sababini aniqlashtirish uchun o‘quv markazi ma’muriyati bilan bog‘lanishingizni so‘raymiz.\n\n` +
        `Hurmat bilan, EDUCO LMS Ma’muriyati`;
    }

    // 1. Direct Telegram chat_id if student linked their account
    if (student.telegram_chat_id) {
      await sendTelegramMessage(student.telegram_chat_id, studentMsg);
    }

    // 2. Parent Telegram chat_id if parent linked their account (Faqat yoqilganda)
    if (PARENTS_NOTIFICATION_ENABLED && student.parent_telegram_chat_id) {
      await sendTelegramMessage(student.parent_telegram_chat_id, parentMsg);
    }
  } catch (err) {
    console.warn('[TelegramBotService] notifyStudentAttendance exception:', err.message);
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
