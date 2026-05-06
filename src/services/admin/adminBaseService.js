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
        const response = await api.post(resourcePath, payload);
        return readResponseData(response);
    },

    async update(id, payload) {
        const response = await api.put(`${resourcePath}/${id}`, payload);
        return readResponseData(response);
    },

    async remove(id) {
        const response = await api.delete(`${resourcePath}/${id}`);
        return readResponseData(response);
    }
});

export { createCrudService, readResponseData, readList };