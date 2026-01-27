import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { notificationsAPI } from '../api/notifications';
import type { Notification } from '../types';
import {
  Bell,
  Trophy,
  Building2,
  Euro,
  RefreshCw,
  MessageSquare,
  Star,
  CheckCheck,
} from 'lucide-react';

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationsAPI.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread count only
  const fetchUnreadCount = async () => {
    try {
      const count = await notificationsAPI.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchNotifications();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Mark notification as read
  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      // Optimistically update the UI
      setNotifications(notifications.map(n =>
        n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
      // Revert on error
      fetchNotifications();
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      const now = new Date().toISOString();
      setNotifications(notifications.map(n => ({ ...n, read_at: now })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      fetchNotifications();
    }
  };

  // Toggle dropdown
  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  // Get icon for notification type
  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'tournament_registration':
        return <Trophy className="w-4 h-4 text-gold-400" />;
      case 'club_join':
        return <Building2 className="w-4 h-4 text-blue-400" />;
      case 'payment':
        return <Euro className="w-4 h-4 text-green-400" />;
      case 'refund_request':
        return <RefreshCw className="w-4 h-4 text-yellow-400" />;
      case 'review':
        return <Star className="w-4 h-4 text-yellow-400" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 text-purple-400" />;
      default:
        return <Bell className="w-4 h-4 text-white/60" />;
    }
  };

  // Format relative time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IE', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={handleToggle}
        className="relative p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-h-[600px] overflow-hidden glass-card border border-white/10 rounded-xl shadow-xl z-50">
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <p className="text-xs text-white/60">{unreadCount} unread</p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors"
              >
                <CheckCheck className="w-3 h-3" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[500px] overflow-y-auto">
            {loading ? (
              <div className="p-12 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-gold-400/30 border-t-gold-400 rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center">
                <Bell className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/60 text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors ${
                    !notification.read_at ? 'bg-white/[0.02]' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`p-2 rounded-lg ${
                      notification.type === 'tournament_registration' ? 'bg-gold-500/20' :
                      notification.type === 'club_join' ? 'bg-blue-500/20' :
                      notification.type === 'payment' ? 'bg-green-500/20' :
                      notification.type === 'refund_request' ? 'bg-yellow-500/20' :
                      notification.type === 'review' ? 'bg-yellow-500/20' :
                      'bg-purple-500/20'
                    }`}>
                      {getIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            notification.read_at ? 'text-white/80' : 'text-white'
                          }`}>
                            {notification.title}
                          </p>
                          <p className={`text-xs mt-0.5 ${
                            notification.read_at ? 'text-white/40' : 'text-white/60'
                          }`}>
                            {notification.message}
                          </p>
                          {notification.event_name && (
                            <p className="text-xs text-white/40 mt-1">
                              {notification.event_name}
                            </p>
                          )}
                        </div>

                        {/* Unread indicator */}
                        {!notification.read_at && (
                          <div className="w-2 h-2 bg-gold-400 rounded-full mt-1" />
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-white/40">
                          {formatTime(notification.created_at)}
                        </span>
                        {notification.link && (
                          <Link
                            to={notification.link}
                            onClick={() => {
                              handleMarkAsRead(notification.id);
                              setIsOpen(false);
                            }}
                            className="text-xs text-gold-400 hover:text-gold-300 transition-colors"
                          >
                            View →
                          </Link>
                        )}
                        {!notification.read_at && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-xs text-white/60 hover:text-white transition-colors"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-white/10 text-center">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to full notifications page (if you create one)
                }}
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
