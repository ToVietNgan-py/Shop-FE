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
    const categoryId = Number(product.category_id ?? product.categoryId ?? product.category?.id ?? product.category_id ?? 0);

    if (promo.products_scope.length > 0 && Number.isFinite(productId) && productId > 0) {
        if (promo.products_scope.includes(productId)) return true;
    }

    if (promo.categories_scope.length > 0 && Number.isFinite(categoryId) && categoryId > 0) {
        if (promo.categories_scope.includes(categoryId)) return true;
    }

    return promo.products_scope.length === 0 && promo.categories_scope.length === 0;
};

const estimateProductPromotion = (product, promotions = []) => {
    const promos = normalizePromotions(promotions).filter((promo) => promo.is_active && promo.is_running);
    if (!product) return null;

    const price = Number(product.price ?? product.unitPrice ?? 0) || 0;
    let best = null;

    for (const promo of promos) {
        if (!promotionMatchesProduct(promo, product)) continue;

        if (promo.type === "percent") {
            const discountAmount = Math.round(price * (Number(promo.value || 0) / 100));
            const finalPrice = Math.max(0, price - discountAmount);
            if (!best || discountAmount > best.discountAmount) {
                best = { promo, discountAmount, finalPrice };
            }
            continue;
        }

        if (promo.type === "amount") {
            const discountAmount = Math.min(Number(promo.value || 0), price);
            const finalPrice = Math.max(0, price - discountAmount);
            if (!best || discountAmount > best.discountAmount) {
                best = { promo, discountAmount, finalPrice };
            }
            continue;
        }

        if (!best) {
            best = { promo, discountAmount: 0, finalPrice: price };
        }
    }

    return best;
};

const fetchPromotionCatalog = async () => {
    return await fetchActive().catch(() => []);
};

// Progressive enhancement: FE fallback calculator
const applyToCart = async (items = [], orderTotal = 0) => {
    const promotions = normalizePromotions(await fetchActive().catch(() => []));

    const norm = items.map((item) => ({
        productId: Number(item.productId ?? item.product_id ?? item.id ?? 0),
        categoryId: Number(item.categoryId ?? item.category_id ?? item.category?.id ?? 0),
        price: Number(item.price ?? 0),
        quantity: Number(item.quantity ?? 1),
        raw: item,
    }));

    let discount = 0;
    const applied = [];
    const giftItems = [];

    promotions.sort((a, b) => (Number(b.priority ?? 0) - Number(a.priority ?? 0)) || (Number(a.id ?? 0) - Number(b.id ?? 0)));

    for (const promo of promotions) {
        if (!promo || (!promo.is_active && !promo.is_running)) continue;

        if (promo.type === "percent" || promo.type === "amount") {
            let eligibleAmount = 0;

            if (promo.products_scope.length > 0 || promo.categories_scope.length > 0) {
                for (const item of norm) {
                    const inProductScope = promo.products_scope.includes(item.productId);
                    const inCategoryScope = promo.categories_scope.includes(item.categoryId);
                    if (inProductScope || inCategoryScope) {
                        eligibleAmount += item.price * item.quantity;
                    }
                }
            } else {
                eligibleAmount = Number(orderTotal ?? 0);
            }

            if (Number(promo.min_order_total ?? 0) > eligibleAmount) continue;

            let thisDiscount = 0;
            if (promo.type === "percent") {
                thisDiscount = eligibleAmount * (Number(promo.value ?? 0) / 100);
            } else {
                thisDiscount = Number(promo.value ?? 0);
            }

            if (promo.max_discount) {
                thisDiscount = Math.min(thisDiscount, Number(promo.max_discount));
            }
            if (thisDiscount > 0) {
                discount += thisDiscount;
                applied.push({
                    id: promo.id,
                    name: promo.name,
                    type: promo.type,
                    value: promo.value,
                    amount: thisDiscount,
                });
            }
            continue;
        }

        if (promo.type === "bogo") {
            const rules = Array.isArray(promo.bogo_rules) ? promo.bogo_rules : [];

            for (const rule of rules) {
                const buyId = Number(rule.buy_product_id ?? rule.buy_product ?? 0);
                const giftId = Number(rule.gift_product_id ?? rule.gift_product ?? 0);
                const buyQty = Number(rule.buy_quantity ?? 1) || 1;
                const giftQty = Number(rule.gift_quantity ?? 1) || 1;
                const giftPct = Number(rule.gift_discount_percent ?? 100) || 100;

                const cartItem = norm.find((item) => item.productId === buyId);
                if (!cartItem) continue;

                const times = Math.floor(cartItem.quantity / buyQty);
                if (times <= 0) continue;

                const giftProductInCart = norm.find((item) => item.productId === giftId);
                const giftUnitPrice = giftProductInCart ? giftProductInCart.price : 0;
                const giftTotalQty = giftQty * times;
                const giftDiscountAmount = giftUnitPrice * giftTotalQty * (giftPct / 100);

                if (giftDiscountAmount > 0) {
                    discount += giftDiscountAmount;
                }

                giftItems.push({
                    promotionId: promo.id,
                    giftProductId: giftId,
                    quantity: giftTotalQty,
                    discountPercent: giftPct,
                    estimatedDiscount: giftDiscountAmount,
                });
            }

            if (rules.length > 0) {
                applied.push({ id: promo.id, name: promo.name, type: "bogo" });
            }
        }
    }

    return {
        discount: Math.round(discount),
        applied,
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