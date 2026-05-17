import api from "../../apis/default.js";

const readResponseData = (response) => response?.data?.data ?? response?.data ?? response ?? {};

const readList = (payload) => {
    if (Array.isArray(payload)) {
        return payload;
    }

    if (Array.isArray(payload?.items)) {
        return payload.items;
    }

    if (Array.isArray(payload?.data)) {
        return payload.data;
    }

    if (Array.isArray(payload?.rows)) {
        return payload.rows;
    }

    return [];
};

const createCrudService = (resourcePath) => ({
    async list(params = {}) {
        const response = await api.get(resourcePath, { params });
        const payload = readResponseData(response);

        return {
            items: readList(payload),
            meta: payload.meta ?? payload.pagination ?? payload,
            message: payload.message ?? response.data?.message ?? ""
        };
    },

    async detail(id) {
        const response = await api.get(`${resourcePath}/${id}`);
        return readResponseData(response);
    },

    async create(payload) {
        // require auth token for write operations
        const token = localStorage.getItem("access_token");
        if (!token) {
            const err = new Error("Unauthorized: please login");
            err.status = 401;
            throw err;
        }

        const opts = {};
        // If payload is FormData, let axios set multipart headers properly
        if (typeof FormData !== "undefined" && payload instanceof FormData) {
            opts.headers = { "Content-Type": "multipart/form-data" };
        }

        const response = await api.post(resourcePath, payload, opts);
        return readResponseData(response);
    },

    async update(id, payload) {
        const token = localStorage.getItem("access_token");
        if (!token) {
            const err = new Error("Unauthorized: please login");
            err.status = 401;
            throw err;
        }

        const opts = {};
        if (typeof FormData !== "undefined" && payload instanceof FormData) {
            opts.headers = { "Content-Type": "multipart/form-data" };
        }

        const response = await api.put(`${resourcePath}/${id}`, payload, opts);
        return readResponseData(response);
    },

    async remove(id) {
        const token = localStorage.getItem("access_token");
        if (!token) {
            const err = new Error("Unauthorized: please login");
            err.status = 401;
            throw err;
        }

        const response = await api.delete(`${resourcePath}/${id}`);
        return readResponseData(response);
    }
});

export { createCrudService, readResponseData, readList };