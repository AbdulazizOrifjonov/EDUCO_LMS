import { localStore, STORAGE_KEYS } from '@/lib/localStore';

/**
 * Exports all system data (users, courses, groups, attendance, grades, reminders, etc.)
 * as a downloadable JSON backup file.
 */
export function exportDatabaseBackup(centerName = 'EDUCO LMS') {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupData = {
      system: 'EDUCO_LMS',
      version: '1.0',
      exported_at: new Date().toISOString(),
      center_name: centerName,
      data: {
        [STORAGE_KEYS.USERS]: localStore.getUsers(),
        [STORAGE_KEYS.COURSES]: localStore.getCourses(),
        [STORAGE_KEYS.GROUPS]: localStore.getGroups(),
        [STORAGE_KEYS.MEMBERSHIPS]: localStore.getMemberships(),
        [STORAGE_KEYS.LESSON_SCHEDULES]: localStore.getSchedules(),
        [STORAGE_KEYS.ATTENDANCE]: localStore.getItem(STORAGE_KEYS.ATTENDANCE, []),
        [STORAGE_KEYS.GRADES]: localStore.getGrades(),
        [STORAGE_KEYS.STUDENT_REMINDERS]: localStore.getStudentReminders(),
        [STORAGE_KEYS.PAYMENTS]: localStore.getPayments(),
        [STORAGE_KEYS.TEACHER_ATTENDANCE]: localStore.getTeacherAttendance(),
        [STORAGE_KEYS.CHAT_MESSAGES]: localStore.getChatMessages(),
        [STORAGE_KEYS.NOTIFICATIONS]: localStore.getItem(STORAGE_KEYS.NOTIFICATIONS, []),
        [STORAGE_KEYS.SMS_DEVICES]: localStore.getSmsDevices(),
      },
    };

    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `educo_backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('exportDatabaseBackup error:', err);
    throw err;
  }
}

/**
 * Restores system data from an uploaded JSON backup file.
 */
export async function restoreDatabaseBackup(backupJson) {
  try {
    const parsed = typeof backupJson === 'string' ? JSON.parse(backupJson) : backupJson;
    if (!parsed || !parsed.data || typeof parsed.data !== 'object') {
      throw new Error('Zaxira fayli formati noto‘g‘ri yoki buzilgan!');
    }

    const payloadToPush = {};
    Object.values(STORAGE_KEYS).forEach((key) => {
      const items = parsed.data[key];
      if (items !== undefined && Array.isArray(items)) {
        localStore.setItem(key, items);
        payloadToPush[key] = items;
      }
    });

    if (Object.keys(payloadToPush).length > 0) {
      await localStore.pushToServer(payloadToPush);
    }

    return true;
  } catch (err) {
    console.error('restoreDatabaseBackup error:', err);
    throw err;
  }
}
