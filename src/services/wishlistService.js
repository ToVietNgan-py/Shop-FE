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

const extractList = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.products)) return payload.products;
    return [];
};

const getImage = (product) => {
    const images = product.images ?? product.productImages ?? product.product_images;
    const firstImage = Array.isArray(images) ? images[0] : null;

    const rawImage = (
        // Các field phổ biến từ productService.normalizeProduct
        product.img ??
        // Các field phổ biến từ API wishlist
        product.image ??
        product.imageUrl ??
        product.image_url ??
        product.thumbnail ??
        product.thumbnailUrl ??
        product.thumbnail_url ??
        product.mainImage ??
        product.main_image ??
        // Từ nested images array
        firstImage?.url ??
        firstImage?.image ??
        firstImage?.imageUrl ??
        firstImage?.image_url ??
        firstImage
    );

    return buildImageUrl(typeof rawImage === "string" ? rawImage.trim() : rawImage);
};

export const normalizeWishlistProduct = (product) => {
    if (!product) return null;

    const nestedProduct = product.product ?? product;
    const categoryName = nestedProduct.category?.name ?? nestedProduct.categoryName ?? nestedProduct.category ?? "";
    const categorySlug = nestedProduct.category?.slug ?? nestedProduct.categorySlug ?? (categoryName ? slugify(categoryName) : "");

    const imageUrl = getImage(nestedProduct);

    return {
        wishlistId: product.id ?? null,
        id: nestedProduct.id ?? nestedProduct._id ?? product.product_id ?? product.productId ?? null,
        name: nestedProduct.name ?? nestedProduct.productName ?? "",
        price: Number(nestedProduct.price ?? nestedProduct.unitPrice ?? 0),
        // Giữ cả 2 field để tương thích với mọi component:
        // - WishlistPage dùng product.image
        // - BestSeller/NewArrival (nếu reuse) dùng product.img
        image: imageUrl,
        img: imageUrl,
        description: nestedProduct.description ?? nestedProduct.shortDescription ?? "",
        category: categoryName,
        categorySlug,
        stock: Number(nestedProduct.stock ?? nestedProduct.quantity ?? nestedProduct.availableQuantity ?? nestedProduct.inventory ?? 0),
        isHot: Boolean(nestedProduct.isHot ?? nestedProduct.hot ?? nestedProduct.featured),
    };
};

export const wishlistService = {
    async list() {
        try {
            const response = await api.get("/wishlist");
            const payload = response.data?.data ?? response.data;
            return extractList(payload).map(normalizeWishlistProduct).filter(Boolean);
        } catch (error) {
            const errData = error.response?.data;
            throw {
                message: errData?.message || errData?.error || "Không thể tải danh sách yêu thích",
                errors: errData?.errors,
            };
        }
    },

    async add(productId) {
        try {
            const response = await api.post(`/wishlist/${productId}`);
            return response.data?.data ?? response.data ?? { in_wishlist: true };
        } catch (error) {
            const errData = error.response?.data;
            throw {
                message: errData?.message || errData?.error || "Không thể thêm vào wishlist",
                errors: errData?.errors,
            };
        }
    },

    async remove(productId) {
        try {
            const response = await api.delete(`/wishlist/${productId}`);
            return response.data?.data ?? response.data ?? { in_wishlist: false };
        } catch (error) {
            const errData = error.response?.data;
            throw {
                message: errData?.message || errData?.error || "Không thể xoá khỏi wishlist",
                errors: errData?.errors,
            };
        }
    },
};