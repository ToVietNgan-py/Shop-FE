import api from "../../apis/default.js";

const sanitizeParams = (params = {}) => Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
        if (value === null || value === undefined) {
            return false;
        }

        if (typeof value === "string") {
            return value.trim() !== "";
        }

        return true;
    })
);

const adminVoucherService = {
    getAll: (params) => api.get('/admin/vouchers', { params: sanitizeParams(params) }),
    getById: (id) => api.get(`/admin/vouchers/${id}`),
    create: (data) => api.post('/admin/vouchers', data),
    update: (id, data) => api.put(`/admin/vouchers/${id}`, data),
    remove: (id) => api.delete(`/admin/vouchers/${id}`),
    getUsage: (id) => api.get(`/admin/vouchers/${id}/usage`),
};

export default adminVoucherService;
