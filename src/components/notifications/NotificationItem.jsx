import { useNavigate } from 'react-router-dom';

export default function NotificationItem({ notification, onRead }) {
    const navigate = useNavigate();

    const handleClick = async () => {
        if (!notification.is_read) {
            await onRead(notification.id);
        }
        if (notification.data?.link) {
            navigate(notification.data.link);
        }
    };

    const timeAgo = (dateStr) => {
        const diff = Date.now() - new Date(dateStr);
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins} phút trước`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs} giờ trước`;
        return `${Math.floor(hrs / 24)} ngày trước`;
    };

    return (
        <div
            onClick={handleClick}
            style={{
                padding: '12px 16px',
                background: notification.is_read ? 'transparent' : 'rgba(99,102,241,0.08)',
                borderBottom: '1px solid #e5e7eb',
                cursor: 'pointer',
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
            }}
        >
            {/* Dot chưa đọc */}
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: notification.is_read ? 'transparent' : '#6366f1', flexShrink: 0, marginTop: 6 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: notification.is_read ? 400 : 600, fontSize: 13, color: '#111827', marginBottom: 2 }}>
                    {notification.title}
                </p>
                <p style={{ fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {notification.body}
                </p>
                <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                    {timeAgo(notification.created_at)}
                </p>
            </div>
        </div>
    );
}