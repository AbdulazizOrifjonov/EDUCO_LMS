import { localStore } from '@/lib/localStore';

/**
 * Service for managing Student Call / Follow-up Reminders
 */

export async function getStudentReminders() {
  await localStore.syncWithServer().catch(() => {});
  return localStore.getStudentReminders();
}

export async function getDueReminders() {
  await localStore.syncWithServer().catch(() => {});
  const list = localStore.getStudentReminders();
  const todayStr = new Date().toISOString().split('T')[0];

  return list.filter((r) => {
    if (r.status !== 'pending') return false;
    // due if due_date <= todayStr
    return r.due_date <= todayStr;
  });
}

export async function createStudentReminder(reminderData) {
  const saved = localStore.saveStudentReminder(reminderData);
  return saved;
}

export async function completeStudentReminder(id, note = '') {
  const updated = localStore.completeStudentReminder(id, note);
  return updated;
}

export async function postponeStudentReminder(id, days = 1) {
  const updated = localStore.postponeStudentReminder(id, days);
  return updated;
}

export async function deleteStudentReminder(id) {
  const deleted = localStore.deleteStudentReminder(id);
  return deleted;
}
