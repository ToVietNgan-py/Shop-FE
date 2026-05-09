import api from "../apis/default.js";
import { buildImageUrl } from "../utils/format.js";

const slugify = (value) => String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const getProductImage = (product) => {
    const images = product.images ?? product.productImages ?? product.product_images;
    const firstImage = Array.isArray(images) ? images[0] : null;
    const rawImage = (
        product.image ??
        product.imageUrl ??
        product.image_url ??
        product.thumbnail ??
        product.thumbnailUrl ??
        product.thumbnail_url ??
        product.mainImage ??
        product.main_image ??
        firstImage?.url ??
        firstImage?.image ??
        firstImage?.imageUrl ??
        firstImage?.image_url ??
        firstImage
    );

    return buildImageUrl(typeof rawImage === "string" ? rawImage.trim() : rawImage);
};

const normalizeProduct = (product) => {
    if (!product) {
        return null;
    }

    const categoryName = product.category?.name ?? product.categoryName ?? product.category ?? "";
    const categorySlug = product.category?.slug ?? product.categorySlug ?? (categoryName ? slugify(categoryName) : "");

    return {
        id: product.id ?? product._id ?? product.productId ?? null,
        name: product.name ?? product.productName ?? "",
        price: Number(product.price ?? product.unitPrice ?? 0),
        image: getProductImage(product),
        description: product.description ?? product.shortDescription ?? "",
        category: categoryName,
        categorySlug,
        stock: Number(product.stock ?? product.quantity ?? product.availableQuantity ?? 0),
        isHot: Boolean(product.isHot ?? product.hot ?? product.featured)
    };
};

const normalizeProductList = (payload) => {
    const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.items)
            ? payload.items
            : Array.isArray(payload?.data)
                ? payload.data
                : Array.isArray(payload?.products)
                    ? payload.products
                    : [];

    return list.map(normalizeProduct).filter(Boolean);
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

    if (Array.isArray(responseData?.products)) {
        return responseData.products;
    }

    return responseData ?? [];
};

export const productService = {
    async list(params = {}) {
        const queryParams = {};

        if (params.keyword) queryParams.q = params.keyword;
        if (params.category && params.category !== "all") queryParams.category_id = params.category;
        if (params.priceMin) queryParams.price_min = params.priceMin;
        if (params.priceMax) queryParams.price_max = params.priceMax;
        if (params.inStockOnly) queryParams.in_stock = 1;
        if (params.sortBy) {
            const sortMap = {
                newest: "newest",
                priceAsc: "price_asc",
                priceDesc: "price_desc",
                bestSeller: "best_seller",
            };
            queryParams.sort = sortMap[params.sortBy] ?? params.sortBy;
        }
        if (Number.isInteger(params.page) && params.page > 0) queryParams.page = params.page;
        if (Number.isInteger(params.limit) && params.limit > 0) queryParams.per_page = params.limit;

        const response = await api.get("/products", { params: queryParams });
        const data = response.data?.data ?? response.data;
        const items = normalizeProductList(extractListPayload(data));

        const total = Number(data?.meta?.total ?? data?.pagination?.total ?? data?.total ?? items.length);
        const page = Number(data?.meta?.current_page ?? data?.pagination?.current_page ?? params.page ?? 1);
        const limit = Number(data?.meta?.per_page ?? data?.pagination?.per_page ?? params.limit ?? items.length);

        return {
            items,
            total,
            page,
            limit
        };
    },

    async detail(id) {
        const response = await api.get(`/products/${id}`);
        const data = response.data?.data ?? response.data;
        return normalizeProduct(data);
    },

    async related({ category, excludeId, limit = 4 } = {}) {
        try {
            const result = await this.list({
                category,
                excludeId,
                limit,
                page: 1,
                sortBy: "featured"
            });

            return result.items.filter((product) => String(product.id) !== String(excludeId)).slice(0, limit);
        } catch (error) {
            console.error("Failed to load related products:", error);
            return [];
        }
    }
};
