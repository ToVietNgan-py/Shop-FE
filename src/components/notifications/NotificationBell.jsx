import { useState, useRef, useEffect } from 'react';
import useNotifications from '../../hooks/useNotifications';
import NotificationItem from './NotificationItem';

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null);
    const { notifications, unreadCount, loading, markRead, markAllRead } = useNotifications();

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
            {/* Nút chuông */}
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    position: 'relative',
                    background: open ? '#fce7f3' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '50%',
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#fce7f3'}
                onMouseLeave={e => e.currentTarget.style.background = open ? '#fce7f3' : 'transparent'}
                aria-label="Thông báo"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e91e63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>

                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute', top: 4, right: 4,
                        background: '#e91e63',
                        color: '#fff',
                        borderRadius: '999px',
                        fontSize: 9,
                        fontWeight: 700,
                        minWidth: 15,
                        height: 15,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 3px',
                        boxShadow: '0 0 0 2px #fff',
                    }}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    width: 360, background: '#fff',
                    borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                    border: '1px solid #e5e7eb', zIndex: 1000,
                    overflow: 'hidden',
                }}>
                    {/* Header dropdown */}
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Thông báo</span>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                style={{ fontSize: 12, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                            >
                                Đánh dấu tất cả đã đọc
                            </button>
                        )}
                    </div>

                    {/* List notifications */}
                    <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                        {loading ? (
                            <p style={{ padding: 16, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Đang tải...</p>
                        ) : notifications.length === 0 ? (
                            <p style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Không có thông báo nào</p>
                        ) : (
                            notifications.map(n => (
                                <NotificationItem key={n.id} notification={n} onRead={markRead} />
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}