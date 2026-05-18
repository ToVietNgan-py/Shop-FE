import api from "../../apis/default.js";
import { createCrudService, readResponseData } from "./adminBaseService.js";

const productService = createCrudService("/admin/products");
const adminProductService = {
    ...productService,

    // Override list để map pagination đúng từ Laravel
    async list(params = {}) {
        const response = await api.get("/admin/products", { params });
        const payload = readResponseData(response);

        // Laravel paginate trả: { current_page, data: [...], total, per_page, last_page }
        return {
            items: Array.isArray(payload.data) ? payload.data : [],
            meta: {
                current_page: payload.current_page ?? 1,
                per_page: payload.per_page ?? 10,
                total: payload.total ?? 0,
                last_page: payload.last_page ?? 1,
            },
        };
    },

    // Override update: Laravel không nhận PUT multipart → POST + _method=PUT
    async update(id, formData) {
        const token = localStorage.getItem("access_token");
        if (!token) throw Object.assign(new Error("Unauthorized"), { status: 401 });

        if (formData instanceof FormData) {
            formData.append("_method", "PUT");
        }

        const response = await api.post(`/admin/products/${id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return readResponseData(response);
    },

    // Upload ảnh riêng nếu cần
    async uploadImage(id, formData) {
        const response = await api.post(`/admin/products/${id}/image`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return readResponseData(response);
    },
};
export default adminProductService;