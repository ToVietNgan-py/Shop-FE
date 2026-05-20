import api from "../../apis/default.js";

const sanitizeParams = (params = {}) => Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
        if (value === null || value === undefined) return false;
        if (typeof value === "string") return value.trim() !== "";
        return true;
    })
);

const adminPromotionService = {
    getAll: (params) => api.get('/admin/promotions', { params: sanitizeParams(params) }),
    getById: (id) => api.get(`/admin/promotions/${id}`),
    create: (data) => api.post('/admin/promotions', data),
    update: (id, data) => api.put(`/admin/promotions/${id}`, data),
    remove: (id) => api.delete(`/admin/promotions/${id}`),
};

export default adminPromotionService;
