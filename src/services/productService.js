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
        product.img ??
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

    const inventory = Number(product.inventory ?? product.stock ?? product.quantity ?? product.availableQuantity ?? 0);

    return {
        id: product.id ?? product._id ?? product.productId ?? null,
        name: product.name ?? product.productName ?? "",
        price: Number(product.price ?? product.unitPrice ?? 0),
        img: getProductImage(product),
        description: product.description ?? product.shortDescription ?? "",
        category: categoryName,
        categorySlug,
        inventory,
        in_stock: inventory > 0,
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
        if (params.priceRange && params.priceRange !== "all") {
            const rangeMap = {
                "under-200": { price_max: 200000 },
                "200-400": { price_min: 200000, price_max: 400000 },
                "400-600": { price_min: 400000, price_max: 600000 },
                "over-600": { price_min: 600000 },
            };
            Object.assign(queryParams, rangeMap[params.priceRange] ?? {});
        }
        if (params.inStockOnly) queryParams.in_stock = 1;
        if (params.sortBy) {
            const sortMap = {
                newest: "newest",
                featured: "best_seller",
                priceAsc: "price_asc",
                priceDesc: "price_desc",
                bestSeller: "best_seller",
                "price-asc": "price_asc",
                "price-desc": "price_desc",
                "name-asc": "name_asc",
                "name-desc": "name_desc",
                "stock-desc": "newest",
            };
            queryParams.sort = sortMap[params.sortBy] ?? params.sortBy;
        }
        if (Number.isInteger(params.page) && params.page > 0) queryParams.page = params.page;
        if (Number.isInteger(params.limit) && params.limit > 0) queryParams.per_page = params.limit;

        const response = await api.get("/products", { params: queryParams });
        const rawData = response.data; // { data: [...], meta: {...}, links: {...} }
        const listPayload = rawData?.data ?? rawData;

        const items = normalizeProductList(extractListPayload(listPayload));
        const total = Number(
            rawData?.meta?.total ??
            rawData?.pagination?.total ??
            items.length
        );
        const page = Number(
            rawData?.meta?.current_page ??
            rawData?.pagination?.current_page ??
            params.page ?? 1
        );
        const limit = Number(
            rawData?.meta?.per_page ??
            rawData?.pagination?.per_page ??
            params.limit ?? items.length
        );

        const last_page = limit > 0 ? Math.ceil(total / limit) : 1;

        return {
            data: items,
            meta: {
                total,
                current_page: page,
                per_page: limit,
                last_page
            }
        };
    },

    async detail(id) {
        const response = await api.get(`/products/${id}`);
        const data = response.data?.data ?? response.data;
        const product = normalizeProduct(data);
        if (!product) return null;

        // BE nhung variants[] trong response GET /products/{id}
        const rawVariants = Array.isArray(data?.variants) ? data.variants : [];
        product.variants = rawVariants.map((v) => ({
            id: v.id ?? null,
            sku: v.sku ?? "",
            color: v.color ?? "",
            size: v.size ?? "",
            price: Number(v.effective_price ?? v.price ?? 0),
            inventory: Number(v.inventory ?? 0),
            in_stock: Boolean(v.in_stock ?? (v.inventory > 0)),
        }));

        // BE tra available_colors / available_sizes san
        product.availableColors = Array.isArray(data?.available_colors) ? data.available_colors : [];
        product.availableSizes = Array.isArray(data?.available_sizes) ? data.available_sizes : [];
        product.hasVariants = Boolean(data?.has_variants);

        return product;
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

            return result.data.filter((product) => String(product.id) !== String(excludeId)).slice(0, limit);
        } catch (error) {
            console.error("Failed to load related products:", error);
            return [];
        }
    }
};
export default productService;