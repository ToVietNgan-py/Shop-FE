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

const adminOrderService = {
    getAll: (params) => api.get('/admin/orders', { params: sanitizeParams(params) }),
    // params: { page, per_page, status, search, date_from, date_to }

    getById: (id) => api.get(`/admin/orders/${id}`),

    updateStatus: (id, status) => api.patch(`/admin/orders/${id}/status`, { status }),
};

export default adminOrderService;
