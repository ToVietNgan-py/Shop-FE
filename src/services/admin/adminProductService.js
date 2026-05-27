import api from "../../apis/default.js";
import { createCrudService, readResponseData } from "./adminBaseService.js";

const productService = createCrudService("/admin/products");
const adminProductService = {
    ...productService,

    async list(params = {}) {
        const response = await api.get("/admin/products", { params });
        const payload = response?.data ?? {};

        const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

        const normalizeImg = (url) => {
            if (!url) return null;

            // Đã là Cloudinary URL → dùng thẳng
            if (url.includes("res.cloudinary.com")) {
                return url;
            }

            // Nếu là full URL (bất kỳ domain nào) → extract path sau /storage/
            // rồi build Cloudinary URL từ đó, không phụ thuộc vào domain của BE
            let relativePath = url;
            const storageMatch = url.match(/\/storage\/(.+)$/);
            if (storageMatch) {
                relativePath = storageMatch[1]; // "products/file.webp"
            } else if (url.startsWith("http")) {
                // Full URL không có /storage/ → không xác định được path → bỏ qua
                return null;
            }

            // Build Cloudinary URL từ relative path
            if (CLOUD_NAME) {
                const publicId = relativePath.replace(/\.[^.]+$/, ""); // bỏ extension
                return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${publicId}`;
            }

            return null;
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