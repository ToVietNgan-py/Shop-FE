import api from "../../apis/default.js";

const adminOrderService = {
    getAll: (params) => api.get('/admin/orders', { params }),
    // params: { page, per_page, status, search, date_from, date_to }

    getById: (id) => api.get(`/admin/orders/${id}`),

    updateStatus: (id, status) => api.patch(`/admin/orders/${id}/status`, { status }),
};

export default adminOrderService;
