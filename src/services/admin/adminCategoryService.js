import { createCrudService, readResponseData } from "./adminBaseService.js";
import api from "../../apis/default.js";

const crudService = createCrudService("/admin/categories");

export const adminCategoryService = {
    ...crudService,

    // Override list — map Laravel paginate response
    async list(params = {}) {
        const response = await api.get("/admin/categories", { params });
        const payload = readResponseData(response);

        // Laravel paginate: { current_page, data: [...], total, per_page, last_page }
        return {
            items: Array.isArray(payload.data) ? payload.data : (Array.isArray(payload) ? payload : []),
            meta: {
                current_page: payload.current_page ?? 1,
                per_page: payload.per_page ?? 10,
                total: payload.total ?? 0,
                last_page: payload.last_page ?? 1,
            },
        };
    },
};