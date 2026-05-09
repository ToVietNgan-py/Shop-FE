import api from "../../apis/default.js";

const adminVoucherService = {
    getAll: (params) => api.get('/admin/vouchers', { params }),
    getById: (id) => api.get(`/admin/vouchers/${id}`),
    create: (data) => api.post('/admin/vouchers', data),
    update: (id, data) => api.put(`/admin/vouchers/${id}`, data),
    remove: (id) => api.delete(`/admin/vouchers/${id}`),
    getUsage: (id) => api.get(`/admin/vouchers/${id}/usage`),
};

export default adminVoucherService;
