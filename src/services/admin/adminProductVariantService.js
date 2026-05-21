import api from "../../apis/default.js";

const adminProductVariantService = {
    async list(productId) {
        const response = await api.get(`/admin/products/${productId}/variants`);
        const data = response?.data?.data ?? response?.data ?? [];
        return Array.isArray(data) ? data : [];
    },

    async create(productId, payload) {
        const response = await api.post(`/admin/products/${productId}/variants`, payload);
        return response?.data?.data ?? response?.data ?? {};
    },

    async update(productId, variantId, payload) {
        const response = await api.put(`/admin/products/${productId}/variants/${variantId}`, payload);
        return response?.data?.data ?? response?.data ?? {};
    },

    async remove(productId, variantId) {
        const response = await api.delete(`/admin/products/${productId}/variants/${variantId}`);
        return response?.data ?? {};
    },
};

export default adminProductVariantService;