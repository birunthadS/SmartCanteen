import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Notification } from '../../types';
import { Bell, CheckCheck, Loader } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const NOTIF_ICONS: Record<string, string> = {
  ORDER_PLACED: '🛒', ORDER_CONFIRMED: '✅', PREPARING: '👨‍🍳',
  READY: '🔔', COMPLETED: '🎉', CANCELLED: '❌', NEW_ORDER: '📦',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications);
        setUnread(res.data.unreadCount);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markRead = async (id: string) => {
    await api.patch(`/notifications/${id}/read`);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await api.patch('/notifications/read-all');
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnread(0);
    toast.success('All notifications marked as read');
  };

  if (loading) return (
    <div className="space-y-3 animate-fade-in">
      <div className="skeleton h-8 w-48 rounded-xl mb-6" />
      {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Bell size={28} className="text-canteen-green" /> Notifications
          {unread > 0 && <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unread}</span>}
        </h1>
        {unread > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-1.5 text-sm text-canteen-green hover:text-canteen-green-dark font-medium transition-colors">
            <CheckCheck size={16} /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🔔</div>
          <h2 className="font-display text-xl font-semibold text-gray-600 mb-2">No notifications yet</h2>
          <p className="text-gray-400">You'll see order updates and alerts here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => !n.isRead && markRead(n.id)}
              className={`card p-4 cursor-pointer transition-all ${n.isRead ? 'opacity-70' : 'border-canteen-green/30 bg-green-50/50 hover:shadow-card-hover'}`}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl shrink-0 mt-0.5">{NOTIF_ICONS[n.type] || '📢'}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`font-semibold text-sm ${n.isRead ? 'text-gray-600' : 'text-gray-900'}`}>{n.title}</p>
                    {!n.isRead && <div className="w-2 h-2 rounded-full bg-canteen-green shrink-0 mt-1" />}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
