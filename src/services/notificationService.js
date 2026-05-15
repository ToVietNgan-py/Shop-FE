import api from '../apis/default';

const notificationService = {
    // Lấy danh sách + unread_count (paginated)
    getAll: ({ page = 1, limit = 20 } = {}) => api.get('/notifications', { params: { page, limit } }),

    // Đánh dấu 1 notification đã đọc
    markRead: (id) => api.patch(`/notifications/${id}/read`),

    // Đánh dấu tất cả đã đọc
    markAllRead: () => api.post('/notifications/read-all'),
};

export default notificationService;