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
  status = 'present', // 'present' | 'late' | 'absent' | 'excused'
  prevStatus = null,
  date = null,
  remark = '',
}) {
  try {
    const users = localStore.getUsers() || [];
    const student = users.find((u) => u.id === studentId);
    if (!student) return;

    const sName = studentName || student.fullName || student.name || `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'O‘quvchi';
    const prettyDate = formatUzDateDigits(date);

    const effectiveCourseName = courseName && courseName !== 'Dars' ? courseName : 'Matematika 1.2';
    const effectiveTeacherName = teacherName && teacherName !== 'Fan mentori' ? teacherName : 'Abdulazizbek Orifjonov';
    const effectiveLessonTime = lessonTime && lessonTime !== 'Dars vaqtida' ? lessonTime : '08:30 - 10:00';

    let studentMsg = '';
    let parentMsg = '';

    if (status === 'present') {
      studentMsg = `🟢 <b>Hurmatli ${sName}!</b>\n\n` +
        `Siz bugun (${prettyDate}) <b>${effectiveCourseName}</b> darsida to‘liq qatnashdingiz.\n` +
        `⏰ Dars vaqti: ${effectiveLessonTime}\n` +
        `👨‍🏫 O‘qituvchi: <b>${effectiveTeacherName}</b>\n\n` +
        `Bilim olishdagi intilishingizni qo‘llab-quvvatlaymiz!\n` +
        `Hurmat bilan, EDUCO LMS`;

      parentMsg = `🟢 <b>Hurmatli ota-ona!</b>\n\n` +
        `Farzandingiz <b>${sName}</b> bugun (${prettyDate}) <b>${effectiveCourseName}</b> darsida to‘liq qatnashdi.\n` +
        `⏰ Dars vaqti: ${effectiveLessonTime}\n` +
        `👨‍🏫 O‘qituvchi: <b>${effectiveTeacherName}</b>\n\n` +
        `Farzandingizning bilim olishdagi intilishini qo‘llab-quvvatlaymiz!\n` +
        `Hurmat bilan, EDUCO LMS`;
    } else if (status === 'late') {
      studentMsg = `🟡 <b>Hurmatli ${sName}!</b>\n\n` +
        `Siz bugun (${prettyDate}) <b>${effectiveCourseName}</b> darsiga KECHIKIB yetib keldingiz va ayni vaqtda mashg‘ulotda qatnashmoqdasiz.\n` +
        `⏰ Dars vaqti: ${effectiveLessonTime}\n` +
        `👨‍🏫 O‘qituvchi: <b>${effectiveTeacherName}</b>\n\n` +
        `Iltimos, darslarga o‘z vaqtida kelishingizni so‘raymiz.\n` +
        `Hurmat bilan, EDUCO LMS`;

      parentMsg = `🟡 <b>Hurmatli ota-ona!</b>\n\n` +
        `Farzandingiz <b>${sName}</b> bugun (${prettyDate}) <b>${effectiveCourseName}</b> darsiga KECHIKIB yetib keldi va ayni vaqtda mashg‘ulotda qatnashmoqda.\n` +
        `⏰ Dars vaqti: ${effectiveLessonTime}\n` +
        `👨‍🏫 O‘qituvchi: <b>${effectiveTeacherName}</b>\n\n` +
        `Iltimos, darslarga o‘z vaqtida qatnashishni nazorat qilishingizni so‘raymiz.\n` +
        `Hurmat bilan, EDUCO LMS`;
    } else if (status === 'excused') {
      const reasonText = remark ? ` (Sababi: ${remark})` : '';
      studentMsg = `ℹ️ <b>Hurmatli ${sName}!</b>\n\n` +
        `Sizning bugun (${prettyDate}) <b>${effectiveCourseName}</b> darsini SABABLI holatda qoldirishingiz qayd etildi${reasonText}.\n` +
        `⏰ Dars vaqti: ${effectiveLessonTime}\n` +
        `👨‍🏫 O‘qituvchi: <b>${effectiveTeacherName}</b>\n\n` +
        `Hurmat bilan, EDUCO LMS`;

      parentMsg = `ℹ️ <b>Hurmatli ota-ona!</b>\n\n` +
        `Farzandingiz <b>${sName}</b> bugun (${prettyDate}) <b>${effectiveCourseName}</b> darsini SABABLI holatda qoldirishi qayd etildi${reasonText}.\n` +
        `⏰ Dars vaqti: ${effectiveLessonTime}\n` +
        `👨‍🏫 O‘qituvchi: <b>${effectiveTeacherName}</b>\n\n` +
        `Hurmat bilan, EDUCO LMS`;
    } else {
      // absent
      studentMsg = `🔴 <b>DIQQAT: Hurmatli ${sName}!</b>\n\n` +
        `Siz bugun (${prettyDate}) <b>${effectiveCourseName}</b> fanidan darsda QATNASHMADINGIZ (Darsga kelmadingiz).\n` +
        `⏰ Dars vaqti: ${effectiveLessonTime}\n` +
        `👨‍🏫 O‘qituvchi: <b>${effectiveTeacherName}</b>\n\n` +
        `Dars qoldirish sababini ma’lum qilish uchun o‘quv markazi ma’muriyati yoki ustoz bilan bog‘lanishingizni so‘raymiz.\n` +
        `Hurmat bilan, EDUCO LMS`;

      parentMsg = `🔴 <b>DIQQAT: Hurmatli ota-ona!</b>\n\n` +
        `Farzandingiz <b>${sName}</b> bugun (${prettyDate}) <b>${effectiveCourseName}</b> fanidan darsda QATNASHMADI (Darsga kelmadi).\n` +
        `⏰ Dars vaqti: ${effectiveLessonTime}\n` +
        `👨‍🏫 O‘qituvchi: <b>${effectiveTeacherName}</b>\n\n` +
        `Dars qoldirish sababini ma’lum qilish uchun o‘quv markazi ma’muriyati yoki ustoz bilan bog‘lanishingizni so‘raymiz.\n` +
        `Hurmat bilan, EDUCO LMS`;
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
