import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  CheckCheck,
  Check,
  CreditCard,
  Calendar,
  AlertTriangle,
  Info,
  DollarSign,
  User,
  ExternalLink,
  Filter,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import { Button, Card, Badge, EmptyState, LoadingSpinner } from '@/components/ui';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  subscribeToNotifications,
  getUnreadCount,
} from '@/services/notificationService';
import { formatDate } from '@/utils/csvExport';

export default function NotificationsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'PAYMENT' | 'SALARY' | 'ATTENDANCE' | 'SYSTEM'

  useEffect(() => {
    if (!user?.id) return;

    loadNotifications();

    // Subscribe to real-time notification events
    const channel = subscribeToNotifications(user.id, (payload) => {
      // Refresh notifications when an insert or update occurs
      loadNotifications();
    });

    return () => {
      if (channel) channel.unsubscribe();
    };
  }, [user?.id, filterType]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const [list, count] = await Promise.all([
        getNotifications(user?.id, { type: filterType !== 'ALL' ? filterType : undefined }),
        getUnreadCount(user?.id),
      ]);
      setNotifications(list);
      setUnreadCount(count);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id, e) => {
    e?.stopPropagation();
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead(user?.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleNotificationClick = (item) => {
    if (!item.is_read) {
      handleMarkAsRead(item.id);
    }
    if (item.link) {
      navigate(item.link);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'PAYMENT':
        return <CreditCard className="w-5 h-5 text-emerald-500" />;
      case 'SALARY':
        return <DollarSign className="w-5 h-5 text-blue-500" />;
      case 'ATTENDANCE':
        return <Calendar className="w-5 h-5 text-purple-500" />;
      case 'WARNING':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'SYSTEM':
      default:
        return <Info className="w-5 h-5 text-brand-navy dark:text-blue-400" />;
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Notification Center
            </h1>
            {unreadCount > 0 && (
              <Badge variant="danger" size="md">
                {unreadCount} Unread
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Realtime updates regarding tuition, payroll, attendance, and center messages
          </p>
        </div>

        {notifications.length > 0 && (
          <Button
            variant="outline"
            icon={CheckCheck}
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
          >
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-3">
        <span className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1.5 mr-2">
          <Filter className="w-3.5 h-3.5" /> Filter:
        </span>
        {[
          { id: 'ALL', label: 'All Notifications' },
          { id: 'PAYMENT', label: 'Payments' },
          { id: 'SALARY', label: 'Payroll' },
          { id: 'ATTENDANCE', label: 'Attendance' },
          { id: 'SYSTEM', label: 'System' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`
              px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all
              ${
                filterType === tab.id
                  ? 'bg-brand-navy text-white shadow-sm dark:bg-blue-600'
                  : 'bg-gray-100 dark:bg-surface-dark-tertiary text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <Card noPadding>
        {loading ? (
          <div className="py-16 text-center text-gray-500">
            <LoadingSpinner size="lg" />
            <p className="mt-2 text-xs">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16">
            <EmptyState
              icon={Bell}
              title="No notifications"
              description="You're all caught up! When you receive alerts or updates, they'll show up right here."
            />
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {notifications.map((item) => {
              const isUnread = !item.is_read;
              return (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`
                    p-4 sm:p-5 flex items-start gap-4 transition-colors cursor-pointer
                    ${
                      isUnread
                        ? 'bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/70 dark:hover:bg-blue-950/30'
                        : 'bg-white dark:bg-surface-dark-secondary hover:bg-gray-50/60 dark:hover:bg-surface-dark-tertiary/40'
                    }
                  `}
                >
                  {/* Icon */}
                  <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-surface-dark-tertiary shrink-0 mt-0.5">
                    {getNotificationIcon(item.type)}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h4
                          className={`text-sm font-semibold truncate ${
                            isUnread
                              ? 'text-brand-navy dark:text-blue-300'
                              : 'text-gray-900 dark:text-gray-100'
                          }`}
                        >
                          {item.title}
                        </h4>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-brand-red shrink-0" />
                        )}
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                        {formatDate(item.created_at, 'en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                      {item.message}
                    </p>

                    {item.link && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-brand-navy dark:text-blue-400 font-medium hover:underline">
                        <span>View details</span>
                        <ExternalLink className="w-3 h-3" />
                      </div>
                    )}
                  </div>

                  {/* Action */}
                  {isUnread && (
                    <button
                      onClick={(e) => handleMarkAsRead(item.id, e)}
                      title="Mark as read"
                      className="p-1.5 text-gray-400 hover:text-brand-navy dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-dark-tertiary shrink-0"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
