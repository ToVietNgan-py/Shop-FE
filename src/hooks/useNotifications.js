import { useState, useEffect, useCallback } from 'react';
import notificationService from '../services/notificationService';

const POLL_INTERVAL = 30000; // 30 giây

export default function useNotifications() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await notificationService.getAll({ page: 1, limit: 20 });
            // API trả: res.data.data (array) + res.data.unread_count + res.data.meta (nếu có)
            setNotifications(res.data.data);
            setUnreadCount(res.data.unread_count);
        } catch (err) {
            console.error('Notification fetch error', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
        const timer = setInterval(fetchNotifications, POLL_INTERVAL);
        return () => clearInterval(timer); // cleanup khi unmount
    }, [fetchNotifications]);

    const markRead = async (id) => {
        await notificationService.markRead(id);
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const markAllRead = async () => {
        await notificationService.markAllRead();
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
    };

    return { notifications, unreadCount, loading, markRead, markAllRead, refetch: fetchNotifications };
}