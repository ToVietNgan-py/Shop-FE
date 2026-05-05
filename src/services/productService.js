import api from "../apis/default.js";
import { productSeed } from "../data/products.mock.js";
import { buildImageUrl } from "../utils/format.js";

const normalizeText = (value) => String(value ?? "").trim().toLowerCase();

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

const applyPriceRange = (items, priceRange) => {
    if (priceRange === "under-200") {
        return items.filter((product) => product.price < 200000);
    }

    if (priceRange === "200-400") {
        return items.filter((product) => product.price >= 200000 && product.price <= 400000);
    }

    if (priceRange === "400-600") {
        return items.filter((product) => product.price > 400000 && product.price <= 600000);
    }

    if (priceRange === "over-600") {
        return items.filter((product) => product.price > 600000);
    }

    return items;
};

const applySort = (items, sortBy) => {
    const nextItems = [...items];

    nextItems.sort((firstProduct, secondProduct) => {
        if (sortBy === "price-asc") {
            return firstProduct.price - secondProduct.price;
        }

        if (sortBy === "price-desc") {
            return secondProduct.price - firstProduct.price;
        }

        if (sortBy === "name-asc") {
            return firstProduct.name.localeCompare(secondProduct.name);
        }

        if (sortBy === "stock-desc") {
            return secondProduct.stock - firstProduct.stock;
        }

        return Number(secondProduct.isHot) - Number(firstProduct.isHot);
    });

    return nextItems;
};

export const productService = {
    async list(params = {}) {
        const queryParams = {};

        if (params.keyword) queryParams.keyword = params.keyword;
        if (params.category && params.category !== "all") queryParams.category = params.category;
        if (params.priceRange && params.priceRange !== "all") queryParams.priceRange = params.priceRange;
        if (params.hotOnly) queryParams.hotOnly = "true";
        if (params.inStockOnly) queryParams.inStockOnly = "true";
        if (params.sortBy) queryParams.sortBy = params.sortBy;
        if (Number.isInteger(params.page) && params.page > 0) queryParams.page = params.page;
        if (Number.isInteger(params.limit) && params.limit > 0) queryParams.limit = params.limit;
        if (params.excludeId) queryParams.excludeId = params.excludeId;

        try {
            const response = await api.get("/products", { params: queryParams });
            const data = response.data?.data ?? response.data;
            const items = normalizeProductList(extractListPayload(data));

            const total = Number(data?.total ?? data?.meta?.total ?? data?.pagination?.total ?? items.length);
            const page = Number(data?.page ?? params.page ?? 1);
            const limit = Number(data?.limit ?? params.limit ?? items.length);

            return {
                items,
                total,
                page,
                limit
            };
        } catch {
            const products = [...productSeed].map(normalizeProduct).filter(Boolean);
            const normalizedKeyword = normalizeText(params.keyword);
            let nextProducts = products;

            if (normalizedKeyword) {
                nextProducts = nextProducts.filter((product) => normalizeText(product.name).includes(normalizedKeyword));
            }

            if (params.category && params.category !== "all") {
                const categoryLower = normalizeText(params.category);
                nextProducts = nextProducts.filter((product) => {
                    const productCategoryLower = normalizeText(product.category);
                    const productSlugLower = normalizeText(product.categorySlug);
                    return productCategoryLower === categoryLower || productSlugLower === categoryLower;
                });
            }

            nextProducts = applyPriceRange(nextProducts, params.priceRange ?? "all");

            if (params.hotOnly) {
                nextProducts = nextProducts.filter((product) => product.isHot);
            }

            if (params.inStockOnly) {
                nextProducts = nextProducts.filter((product) => product.stock > 0);
            }

            nextProducts = applySort(nextProducts, params.sortBy ?? "featured");

            const limit = Number.isInteger(params.limit) ? params.limit : nextProducts.length;
            const page = Number.isInteger(params.page) && params.page > 0 ? params.page : 1;
            const startIndex = (page - 1) * limit;

            return {
                items: nextProducts.slice(startIndex, startIndex + limit),
                total: nextProducts.length,
                page,
                limit
            };
        }
    },

    async detail(id) {
        try {
            const response = await api.get(`/products/${id}`);
            const data = response.data?.data ?? response.data;
            return normalizeProduct(data);
        } catch {
            return normalizeProduct(productSeed.find((product) => String(product.id) === String(id)));
        }
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
        } catch {
            return productSeed
                .map(normalizeProduct)
                .filter(Boolean)
                .filter((product) => String(product.id) !== String(excludeId) && (!category || product.categorySlug === category || product.category === category))
                .slice(0, limit);
        }
    }
};
