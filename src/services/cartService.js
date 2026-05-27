import api from "../apis/default.js";
import { buildImageUrl } from "../utils/format.js";

const SESSION_TOKEN_KEY = "cart_session_token";

const readSessionToken = () => {
    if (typeof window === "undefined") {
        return "";
    }

    return window.localStorage.getItem(SESSION_TOKEN_KEY) || "";
};

const saveSessionToken = (sessionToken) => {
    if (typeof window === "undefined" || !sessionToken) {
        return;
    }

    window.localStorage.setItem(SESSION_TOKEN_KEY, sessionToken);
};

const generateSessionToken = () => {
    if (typeof window !== "undefined" && window.crypto?.randomUUID) {
        return window.crypto.randomUUID();
    }

    const randomHex = () => Math.floor(Math.random() * 16).toString(16);
    return Array.from({ length: 32 }, randomHex).join("");
};

const getSessionToken = () => {
    let sessionToken = readSessionToken();

    if (!sessionToken) {
        sessionToken = generateSessionToken();
        saveSessionToken(sessionToken);
    }

    return sessionToken;
};

const cartHeaders = () => {
    const sessionToken = getSessionToken();
    return sessionToken ? { "X-Cart-Token": sessionToken } : {};
};

const getImage = (item) => {
    const product = item.product ?? {};
    const images = product.images ?? item.images;
    const firstImage = Array.isArray(images) ? images[0] : null;

    const rawImage = (
        product.img ??
        product.image_url ??
        product.imageUrl ??
        product.thumbnail_url ??
        product.thumbnailUrl ??
        product.image ??
        product.thumbnail ??
        firstImage?.url ??
        firstImage?.image_url ??
        firstImage ??
        item.img ??
        item.image_url ??
        item.imageUrl ??
        item.thumbnail_url ??
        item.thumbnailUrl ??
        item.image ??
        item.thumbnail ??
        ""
    );

    return buildImageUrl(typeof rawImage === "string" ? rawImage.trim() : rawImage);
};

export const normalizeCartItem = (item = {}) => {
    const product = item.product ?? {};
    const productId = item.product_id ?? item.productId ?? product.id ?? product._id ?? item.id ?? null;
    const cartItemId = item.id ?? item.cart_item_id ?? item.cartItemId ?? null;
    const color = item.color ?? "";
    const size = item.size ?? "";

    return {
        id: cartItemId,
        cartItemId,
        cartKey: item.cart_key ?? item.cartKey ?? String(cartItemId ?? `${productId}-${color}-${size}`),
        productId,
        variantId: item.product_variant_id ?? item.productVariantId ?? item.variant_id ?? item.variantId ?? null,
        name: product.name ?? item.name ?? item.product_name ?? "",
        price: Number(item.originalPrice ?? product.price ?? item.price ?? item.unit_price ?? 0),
        displayPrice: Number(item.displayPrice ?? item.sale_price ?? product.sale_price ?? item.price ?? product.price ?? 0),
        originalPrice: Number(item.originalPrice ?? product.price ?? item.price ?? item.unit_price ?? 0),
        isFlashSale: Boolean(item.isFlashSale ?? item.is_flash_sale ?? false),
        image: getImage(item),
        color,
        size,
        quantity: Math.max(1, Number(item.quantity ?? 1)),
    };
};

const normalizeCart = (responseData) => {
    const data = responseData?.data ?? responseData ?? {};
    const cart = data.cart ?? data;
    const items = Array.isArray(cart.items)
        ? cart.items
        : Array.isArray(cart.cart_items)
            ? cart.cart_items
            : Array.isArray(data.items)
                ? data.items
                : Array.isArray(data.cart_items)
                    ? data.cart_items
                    : Array.isArray(data)
                        ? data
                        : [];

    const sessionToken = cart.session_token ?? cart.sessionToken ?? data.session_token ?? data.sessionToken ?? readSessionToken();
    saveSessionToken(sessionToken);

    return {
        id: cart.id ?? cart.cart_id ?? data.cart_id ?? data.cartId ?? null,
        sessionToken,
        items: items.map(normalizeCartItem),
    };
};

const throwNice = (error, fallback) => {
    const errData = error.response?.data;
    throw {
        message: errData?.message ?? errData?.error ?? fallback,
        errors: errData?.errors,
        status: error.response?.status,
    };
};

const requestFirstSupported = async (requests) => {
    let lastError;

    for (const request of requests) {
        try {
            return await request();
        } catch (error) {
            lastError = error;

            if (error.response?.status !== 405 && error.response?.status !== 404) {
                throw error;
            }
        }
    }

    throw lastError;
};

export const cartService = {
    getSessionToken: getSessionToken,

    async get() {
        try {
            const res = await api.get("/cart", { headers: cartHeaders() });
            return normalizeCart(res.data);
        } catch (error) {
            throwNice(error, "Khong the tai gio hang");
        }
    },

    async add(item) {
        try {
            const productId = item.productId ?? item.product_id ?? item.id;
            const payload = {
                product_id: productId,
                product_variant_id: item.variantId ?? item.product_variant_id ?? item.productVariantId ?? undefined,
                color: item.color ?? "",
                size: item.size ?? "",
                quantity: item.quantity ?? 1,
            };
            const res = await requestFirstSupported([
                () => api.post("/cart/items", payload, { headers: cartHeaders() }),
                () => api.post("/cart/add", payload, { headers: cartHeaders() }),
            ]);
            return normalizeCart(res.data);
        } catch (error) {
            throwNice(error, "Khong the them san pham vao gio");
        }
    },

    async update(cartItemId, quantity) {
        try {
            const payload = { quantity };
            const res = await requestFirstSupported([
                () => api.put(`/cart/items/${cartItemId}`, payload, { headers: cartHeaders() }),
                () => api.patch(`/cart/items/${cartItemId}`, payload, { headers: cartHeaders() }),
                () => api.put(`/cart/${cartItemId}`, payload, { headers: cartHeaders() }),
                () => api.patch(`/cart/${cartItemId}`, payload, { headers: cartHeaders() }),
            ]);
            return normalizeCart(res.data);
        } catch (error) {
            throwNice(error, "Khong the cap nhat gio hang");
        }
    },

    async remove(cartItemId) {
        try {
            const res = await api.delete(`/cart/items/${cartItemId}`, {
                headers: cartHeaders(),
            });
            return normalizeCart(res.data);
        } catch (error) {
            throwNice(error, "Khong the xoa san pham khoi gio");
        }
    },

    async clear() {
        try {
            const res = await api.delete("/cart", {
                headers: cartHeaders(),
            });
            return normalizeCart(res.data);
        } catch (error) {
            throwNice(error, "Khong the xoa gio hang");
        }
    },

    async mergeGuestCart(guestItems = []) {
        try {
            const payload = guestItems.map((item) => ({
                product_id: item.productId ?? item.product_id ?? item.id,
                product_variant_id: item.variantId ?? item.product_variant_id ?? item.productVariantId ?? undefined,
                color: item.color ?? "",
                size: item.size ?? "",
                quantity: item.quantity ?? 1,
            }));

            const res = await api.post(
                "/cart/merge",
                { items: payload },
                { headers: cartHeaders() }
            );
            return normalizeCart(res.data);
        } catch (error) {
            throwNice(error, "Khong the dong bo gio hang");
        }
    },
};
