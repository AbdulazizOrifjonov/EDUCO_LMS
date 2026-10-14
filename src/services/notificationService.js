import { supabase } from '@/lib/supabase';

/**
 * Fetches notifications for a user.
 * @param {string} userId 
 * @param {Object} [options]
 * @param {string} [options.type] - Optional filter by type
 * @param {number} [options.limit=50]
 */
export async function getNotifications(userId, options = {}) {
  if (!userId) return [];
  const { type, limit = 50 } = options;

  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (type && type !== 'ALL') {
      query = query.eq('type', type);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('notificationService getNotifications warning:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('getNotifications error:', err);
    return [];
  }
}

/**
 * Gets count of unread notifications for a user.
 * @param {string} userId 
 */
export async function getUnreadCount(userId) {
  if (!userId) return 0;
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .or('is_read.is.false,is_read.is.null');

    if (error) {
      console.warn('notificationService getUnreadCount warning:', error.message);
      return 0;
    }
    return count || 0;
  } catch (err) {
    console.error('getUnreadCount error:', err);
    return 0;
  }
}

/**
 * Marks a single notification as read.
 * @param {string} notificationId 
 */
export async function markAsRead(notificationId) {
  if (!notificationId) return null;
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: now })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) {
      console.warn('markAsRead warning:', error.message);
    }
    return data;
  } catch (err) {
    console.error('markAsRead error:', err);
    return null;
  }
}

/**
 * Marks all notifications for a user as read.
 * @param {string} userId 
 */
export async function markAllAsRead(userId) {
  if (!userId) return false;
  try {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: now })
      .eq('user_id', userId)
      .or('is_read.is.false,is_read.is.null');

    if (error) {
      console.warn('markAllAsRead warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('markAllAsRead error:', err);
    return false;
  }
}

/**
 * Creates a notification.
 * @param {string} type - e.g. 'PAYMENT', 'SALARY', 'ATTENDANCE', 'SYSTEM', 'ANNOUNCEMENT'
 * @param {string} recipientId - User ID of the recipient
 * @param {Object} data - payload { title, message, link, ... }
 */
export async function createNotification(type, recipientId, data = {}) {
  if (!recipientId) return null;
  try {
    const payload = {
      user_id: recipientId,
      type: type || 'SYSTEM',
      title: data.title || 'Notification',
      message: data.message || '',
      link: data.link || null,
      metadata: data.metadata || data,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    const { data: created, error } = await supabase
      .from('notifications')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.warn('createNotification warning:', error.message);
      return null;
    }
    return created;
  } catch (err) {
    console.error('createNotification error:', err);
    return null;
  }
}

/**
 * Subscribes to real-time notifications for a user.
 * @param {string} userId 
 * @param {Function} callback - invoked on new or updated notification
 * @returns {Object} supabase subscription channel
 */
export function subscribeToNotifications(userId, callback) {
  if (!userId) return null;

  const channel = supabase
    .channel(`public:notifications:user_${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (callback && typeof callback === 'function') {
          callback(payload);
        }
      }
    )
    .subscribe();

  return channel;
}

export default {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  createNotification,
  subscribeToNotifications,
};
