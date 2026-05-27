import api from "../../apis/default.js";
import { createCrudService, readResponseData } from "./adminBaseService.js";

const productService = createCrudService("/admin/products");
const adminProductService = {
    ...productService,

    async list(params = {}) {
        const response = await api.get("/admin/products", { params });
        const payload = response?.data ?? {};

        const BASE_URL = (import.meta.env.VITE_API_URL || "")
            .replace(/\/api\/?$/, "")
            .replace(/\/$/, "");

        const normalizeImg = (url) => {
            if (!url) return null;
            // Extract path after /storage/ regardless of what domain the BE returned
            const storageMatch = url.match(/\/storage\/(.+)$/);
            if (storageMatch) {
                return `${BASE_URL}/storage/${storageMatch[1]}`;
            }
            // Relative path (e.g. "products/file.webp")
            if (!url.startsWith("http")) {
                return `${BASE_URL}/storage/${url}`;
            }
            return url;
        };
        // BE trả { data: [...], meta: { current_page, per_page, total, last_page } }
        return {
            items: Array.isArray(payload.data)
                ? payload.data.map((p) => ({
                    ...p,
                    thumbnail: normalizeImg(p.thumbnail),
                    img: normalizeImg(p.img),
                }))
                : [],
            meta: {
                current_page: payload.meta?.current_page ?? 1,
                per_page: payload.meta?.per_page ?? 10,
                total: payload.meta?.total ?? 0,
                last_page: payload.meta?.last_page ?? 1,
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
        const response = await api.post(`/admin/products/${id}/images`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return readResponseData(response);
    },
};
export default adminProductService;