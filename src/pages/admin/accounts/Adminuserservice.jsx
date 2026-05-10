import axiosInstance from '../axiosInstance'; // điều chỉnh path tuỳ project

const BASE = '/api/admin/users';

const adminUserService = {
    /** GET /api/admin/users — danh sách có filter + pagination */
    getAll: (params) => axiosInstance.get(BASE, { params }),

    /** GET /api/admin/users/{id} — chi tiết một user */
    getById: (id) => axiosInstance.get(`${BASE}/${id}`),

    /** POST /api/admin/users — tạo tài khoản mới */
    create: (data) => axiosInstance.post(BASE, data),

    /** PUT /api/admin/users/{id} — cập nhật name, email, phone */
    update: (id, data) => axiosInstance.put(`${BASE}/${id}`, data),

    /** DELETE /api/admin/users/{id} — soft delete (không thể tự xoá bản thân) */
    delete: (id) => axiosInstance.delete(`${BASE}/${id}`),

    /** PATCH /api/admin/users/{id}/role — gán / đổi role (sync, xoá role cũ)
     *  Thử { roles: [role] } trước (Spatie syncRoles).
     *  Nếu BE vẫn lỗi, đổi thành { role } hoặc { name: role } tuỳ controller. */
    updateRole: (id, role) => axiosInstance.patch(`${BASE}/${id}/role`, { roles: ['admin'] }),

    /** PATCH /api/admin/users/{id}/lock — khoá tài khoản */
    lock: (id) => axiosInstance.patch(`${BASE}/${id}/lock`),

    /** PATCH /api/admin/users/{id}/unlock — mở khoá tài khoản */
    unlock: (id) => axiosInstance.patch(`${BASE}/${id}/unlock`),
};

export default adminUserService;