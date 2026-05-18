import { createCrudService, readResponseData } from "./adminBaseService.js";
import api from "../../apis/default.js";

const crudService = createCrudService("/admin/categories");

export const adminCategoryService = {
    ...crudService,

    async list(params = {}) {
        const response = await api.get("/admin/categories", { params });

        // DEBUG — xem cấu trúc thực tế, xoá sau khi xác nhận đúng
        console.log("[adminCategoryService.list] raw response:", response);

        const payload = readResponseData(response);

        console.log("[adminCategoryService.list] payload:", payload);

        // Trường hợp 1: readResponseData trả về mảng trực tiếp
        // Xảy ra khi API trả { data: [...] } và readResponseData unwrap "data"
        if (Array.isArray(payload)) {
            return {
                items: payload,
                meta: {
                    current_page: 1,
                    per_page: payload.length,
                    total: payload.length,
                    last_page: 1,
                },
            };
        }

        // Trường hợp 2: Laravel paginate — payload = { current_page, data: [...], total, ... }
        if (payload && Array.isArray(payload.data)) {
            return {
                items: payload.data,
                meta: {
                    current_page: payload.current_page ?? 1,
                    per_page: payload.per_page ?? 10,
                    total: payload.total ?? 0,
                    last_page: payload.last_page ?? 1,
                },
            };
        }

        // Trường hợp 3: custom format { items: [...] }
        if (payload && Array.isArray(payload.items)) {
            return {
                items: payload.items,
                meta: {
                    current_page: payload.current_page ?? 1,
                    per_page: payload.per_page ?? 10,
                    total: payload.total ?? payload.items.length,
                    last_page: payload.last_page ?? 1,
                },
            };
        }

        // Không nhận ra format — kiểm tra console để debug
        console.error("[adminCategoryService.list] ❌ Format không xác định:", payload);
        return {
            items: [],
            meta: { current_page: 1, per_page: 10, total: 0, last_page: 1 },
        };
    },

    // Upload icon — POST /api/admin/categories/{id}/icon
    async uploadIcon(categoryId, file) {
        const formData = new FormData();
        formData.append("icon", file);
        const response = await api.post(`/admin/categories/${categoryId}/icon`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return readResponseData(response);
    },
};