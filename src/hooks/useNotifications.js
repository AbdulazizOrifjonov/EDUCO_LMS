import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import useAuth from './useAuth';

export default function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchErr } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchErr) {
        // Table might not exist yet or no rows
        console.warn('Could not fetch notifications:', fetchErr.message);
        setNotifications([]);
        setUnreadCount(0);
      } else {
        setNotifications(data || []);
        const unread = (data || []).filter((n) => !n.read_at && !n.is_read).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const markAsRead = async (id) => {
    try {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', id);
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;
    try {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);

      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('read_at', null);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    if (!user?.id) return;

    // Realtime subscription
    const channel = supabase
      .channel(`public:notifications:user_id=eq.${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) =>
            prev.map((n) => (n.id === payload.new.id ? payload.new : n))
          );
        }
      )
      .subscribe();

    const handleLocalUpdate = () => {
      fetchNotifications();
    };

    window.addEventListener('educo-notification-update', handleLocalUpdate);
    window.addEventListener('educo-data-sync', handleLocalUpdate);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('educo-notification-update', handleLocalUpdate);
      window.removeEventListener('educo-data-sync', handleLocalUpdate);
    };
  }, [user?.id, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}
