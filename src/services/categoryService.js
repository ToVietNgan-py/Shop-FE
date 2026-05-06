import api from "../apis/default.js";

const slugify = (value) => String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizeCategory = (category) => {
    if (!category) {
        return null;
    }

    return {
        id: category.id ?? category._id ?? category.slug ?? slugify(category.name ?? category.categoryName ?? ""),
        name: category.name ?? category.categoryName ?? "",
        slug: category.slug ?? slugify(category.name ?? category.categoryName ?? ""),
        productCount: Number(category.productCount ?? category.totalProducts ?? 0),
        description: category.description ?? ""
    };
};

const extractListPayload = (responseData) => {
    if (Array.isArray(responseData)) {
        return responseData;
    }

    if (Array.isArray(responseData?.items)) {
        return responseData.items;
    }

    if (Array.isArray(responseData?.data)) {
        return responseData.data;
    }

    if (Array.isArray(responseData?.categories)) {
        return responseData.categories;
    }

    return [];
};

export const categoryService = {
    async list() {
        const response = await api.get("/categories");
        const categories = extractListPayload(response.data?.data ?? response.data)
            .map(normalizeCategory)
            .filter(Boolean);

        return categories;
    },

    async detail(identifier) {
        try {
            const response = await api.get(`/categories/${encodeURIComponent(identifier)}`);
            const data = response.data?.data ?? response.data;
            return normalizeCategory(data);
        } catch (error) {
            throw {
                message: error.response?.data?.message || error.response?.data?.error || "Không thể lấy thông tin danh mục.",
                errors: error.response?.data?.errors,
            };
        }
    }
};