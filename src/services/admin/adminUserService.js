import api from "../../apis/default.js";
const adminUserService = {
    getAll: (params) => api.get('/admin/users', { params }),
    // params: { page, per_page, role, search }

    getById: (id) => api.get(`/admin/users/${id}`),
    create: (data) => api.post('/admin/users', data),
    update: (id, data) => api.put(`/admin/users/${id}`, data),
    remove: (id) => api.delete(`/admin/users/${id}`),

    updateRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
    lock: (id) => api.patch(`/admin/users/${id}/lock`),
    unlock: (id) => api.patch(`/admin/users/${id}/unlock`),

    getRoles: () => api.get('/admin/roles'),
};

export default adminUserService;
