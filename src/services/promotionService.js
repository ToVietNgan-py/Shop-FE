import api from "../apis/default.js";

const readList = (res) => {
    const payload = res?.data ?? {};
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.items)) return payload.items;
    return [];
};

const fetchActive = async () => readList(await api.get("/promotions/active"));

const getIdList = (items = []) =>
    items
        .map((item) => Number(item?.id ?? item?.product_id ?? item?.category_id ?? item))
        .filter((value) => Number.isFinite(value) && value > 0);

const normalizePromotion = (promotion) => {
    if (!promotion) return null;

    return {
        id: promotion.id ?? promotion._id ?? null,
        name: promotion.name ?? promotion.title ?? "",
        type: promotion.type ?? "percent",
        value: Number(promotion.value ?? promotion.discount ?? 0),
        products: Array.isArray(promotion.products) ? promotion.products : (Array.isArray(promotion.product_ids) ? promotion.product_ids : []),
        categories: Array.isArray(promotion.categories) ? promotion.categories : (Array.isArray(promotion.category_ids) ? promotion.category_ids : []),
        bogo_rules: promotion.bogo_rules ?? promotion.rules ?? [],
        priority: Number(promotion.priority ?? 0),
        is_active: Boolean(promotion.is_active ?? true),
        is_running: Boolean(promotion.is_running ?? true),
        max_discount: promotion.max_discount ?? promotion.maxDiscount ?? null,
        min_order_total: Number(promotion.min_order_total ?? promotion.minOrderTotal ?? 0),
        products_scope: getIdList(promotion.products ?? promotion.product_ids ?? []),
        categories_scope: getIdList(promotion.categories ?? promotion.category_ids ?? []),
    };
};

const normalizePromotions = (list) => Array.isArray(list) ? list.map(normalizePromotion).filter(Boolean) : [];

const promotionMatchesProduct = (promo, product) => {
    if (!promo || !product) return false;

    const productId = Number(product.id ?? product.productId ?? product.product_id ?? 0);
    const categoryId = Number(product.category_id ?? product.categoryId ?? product.category?.id ?? 0);

    if (promo.products_scope.length === 0 && promo.categories_scope.length === 0) return true;
    return promo.products_scope.includes(productId) || promo.categories_scope.includes(categoryId);
};

const estimateProductPromotion = (product, promotions = []) => {
    const promos = normalizePromotions(promotions).filter((promo) => promo.is_active && promo.is_running);
    if (!product) return null;

    const price = Number(product.price ?? product.unitPrice ?? 0) || 0;
    let best = null;

    for (const promo of promos) {
        if (promo.type === "bogo" || promo.type === "flash_sale") continue;
        if (promo.min_order_total > 0 || !promotionMatchesProduct(promo, product)) continue;

        const rawDiscount = promo.type === "percent"
            ? price * (Number(promo.value || 0) / 100)
            : Number(promo.value || 0);
        const capped = promo.max_discount ? Math.min(rawDiscount, Number(promo.max_discount)) : rawDiscount;
        const discountAmount = Math.min(capped, price);
        const finalPrice = Math.max(0, price - discountAmount);

        if (!best || discountAmount > best.discountAmount) {
            best = { promo, discountAmount: Math.round(discountAmount), finalPrice: Math.round(finalPrice) };
        }
    }

    return best;
};

const fetchPromotionCatalog = async () => {
    return await fetchActive().catch(() => []);
};

const fetchFlashMap = async () => {
    const res = await api.get("/promotions/flash-sale").catch(() => null);
    const data = res?.data?.data;
    if (!data?.products?.length || Number(data.remaining_seconds ?? 0) <= 0) return {};

    return data.products.reduce((map, product) => {
        map[String(product.id)] = {
            promotionId: data.id,
            name: data.name,
            flashPrice: Number(product.flash_price ?? 0),
            originalPrice: Number(product.original_price ?? product.price ?? 0),
        };
        return map;
    }, {});
};

const applyToCart = async (items = [], orderTotal = 0) => {
    const [promotions, flashMap] = await Promise.all([
        fetchActive().then(normalizePromotions).catch(() => []),
        fetchFlashMap(),
    ]);

    const norm = items.map((item) => ({
        productId: Number(item.productId ?? item.product_id ?? item.id ?? 0),
        categoryId: Number(item.categoryId ?? item.category_id ?? item.category?.id ?? 0),
        price: Number(item.originalPrice ?? item.price ?? 0),
        quantity: Number(item.quantity ?? 1),
    }));

    const claimed = new Set();
    let discount = 0;
    const applied = [];
    const giftItems = [];

    for (const item of norm) {
        const flash = flashMap[String(item.productId)];
        if (!flash || flash.flashPrice <= 0 || flash.flashPrice >= item.price) continue;

        const itemDiscount = (item.price - flash.flashPrice) * item.quantity;
        discount += itemDiscount;
        claimed.add(item.productId);

        const existing = applied.find((promo) => promo.id === flash.promotionId);
        if (existing) {
            existing.amount += itemDiscount;
        } else {
            applied.push({
                id: flash.promotionId,
                name: flash.name,
                type: "flash_sale",
                amount: itemDiscount,
            });
        }
    }

    const regularPromos = promotions.filter((promo) =>
        promo.is_active &&
        promo.is_running &&
        (promo.type === "percent" || promo.type === "amount") &&
        Number(orderTotal) >= Number(promo.min_order_total ?? 0)
    );

    let bestDiscountPromo = null;
    for (const promo of regularPromos) {
        const matched = norm.filter((item) => !claimed.has(item.productId) && promotionMatchesProduct(promo, {
            id: item.productId,
            category_id: item.categoryId,
        }));
        if (matched.length === 0) continue;

        const subtotal = matched.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const rawDiscount = promo.type === "percent"
            ? subtotal * (Number(promo.value ?? 0) / 100)
            : Number(promo.value ?? 0);
        const capped = promo.max_discount ? Math.min(rawDiscount, Number(promo.max_discount)) : rawDiscount;
        const amount = Math.min(capped, subtotal);

        if (amount > 0 && (!bestDiscountPromo || amount > bestDiscountPromo.amount)) {
            bestDiscountPromo = { promo, amount, matched };
        }
    }

    if (bestDiscountPromo) {
        discount += bestDiscountPromo.amount;
        bestDiscountPromo.matched.forEach((item) => claimed.add(item.productId));
        applied.push({
            id: bestDiscountPromo.promo.id,
            name: bestDiscountPromo.promo.name,
            type: bestDiscountPromo.promo.type,
            value: bestDiscountPromo.promo.value,
            amount: bestDiscountPromo.amount,
        });
    } else {
        let bestBogo = null;
        for (const promo of promotions.filter((promo) => promo.type === "bogo" && promo.is_active && promo.is_running)) {
            if (Number(orderTotal) < Number(promo.min_order_total ?? 0)) continue;

            const candidateGifts = [];
            let candidateDiscount = 0;
            for (const rule of Array.isArray(promo.bogo_rules) ? promo.bogo_rules : []) {
                const buyId = Number(rule.buy_product_id ?? rule.buy_product ?? 0);
                if (claimed.has(buyId)) continue;

                const cartItem = norm.find((item) => item.productId === buyId);
                if (!cartItem) continue;

                const times = Math.floor(cartItem.quantity / (Number(rule.buy_quantity ?? 1) || 1));
                if (times <= 0) continue;

                const giftQty = (Number(rule.gift_quantity ?? 1) || 1) * times;
                const giftPct = Number(rule.gift_discount_percent ?? 100) || 100;
                const estimatedDiscount = 0;
                candidateDiscount += estimatedDiscount;
                candidateGifts.push({
                    promotionId: promo.id,
                    giftProductId: Number(rule.gift_product_id ?? rule.gift_product ?? 0),
                    giftProductName: rule.gift_product_name ?? "",
                    quantity: giftQty,
                    discountPercent: giftPct,
                    estimatedDiscount,
                });
            }

            if (candidateGifts.length > 0 && (!bestBogo || candidateDiscount > bestBogo.discount)) {
                bestBogo = { promo, giftItems: candidateGifts, discount: candidateDiscount };
            }
        }

        if (bestBogo) {
            giftItems.push(...bestBogo.giftItems);
            applied.push({ id: bestBogo.promo.id, name: bestBogo.promo.name, type: "bogo", amount: bestBogo.discount });
        }
    }

    return {
        discount: Math.round(discount),
        applied: applied.map((promo) => ({ ...promo, amount: Math.round(promo.amount ?? 0) })),
        giftItems,
        promotionsCount: promotions.length,
    };
};

export const promotionService = {
    getActive: () => api.get("/promotions/active"),
    getFlashSale: () => api.get("/promotions/flash-sale"),
    fetchActive,
    applyToCart,
};

export const promotionUtils = {
    normalizePromotion,
    normalizePromotions,
    promotionMatchesProduct,
    estimateProductPromotion,
    fetchPromotionCatalog,
};

export default promotionService;
