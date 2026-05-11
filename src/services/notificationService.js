import api from '../apis/default';

const notificationService = {
    // Lấy danh sách + unread_count
    getAll: () => api.get('/notifications'),

    // Đánh dấu 1 notification đã đọc
    markRead: (id) => api.patch(`/notifications/${id}/read`),

    // Đánh dấu tất cả đã đọc
    markAllRead: () => api.post('/notifications/read-all'),
};

export default notificationService;