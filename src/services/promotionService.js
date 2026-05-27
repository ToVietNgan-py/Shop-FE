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

// FE preview calculator — mirrors BE combine rules:
// 1. Flash sale claims items first; flash items get no other promo.
// 2. Among percent/amount promos, pick the ONE giving highest total discount.
// 3. BOGO runs only when no percent/amount discount was applied; flash items
//    cannot act as the "buy" trigger in a BOGO rule.
// 4. Voucher applies after (handled separately in useCheckoutOrder).
const applyToCart = async (items = [], orderTotal = 0) => {
    const [allPromos, flashRes] = await Promise.all([
        fetchActive().catch(() => []),
        api.get("/promotions/flash-sale").then(r => r?.data?.data ?? null).catch(() => null),
    ]);
    const promotions = normalizePromotions(allPromos);

    // Build flash map: productId → flash_price
    const flashMap = {};
    if (flashRes?.products?.length && (flashRes.remaining_seconds ?? 0) > 0) {
        for (const p of flashRes.products) {
            if (p.id && p.flash_price > 0) flashMap[String(p.id)] = Number(p.flash_price);
        }
    }

    const norm = items.map((item) => ({
        productId: Number(item.productId ?? item.product_id ?? item.id ?? 0),
        categoryId: Number(item.categoryId ?? item.category_id ?? item.category?.id ?? 0),
        price: Number(item.originalPrice ?? item.price ?? 0),
        quantity: Number(item.quantity ?? 1),
    }));

    const orderSubtotal = norm.reduce((s, i) => s + i.price * i.quantity, 0);

    // ── Step 1: Flash sale ──────────────────────────────────────
    const flashClaimed = new Array(norm.length).fill(false);
    let flashDiscount = 0;
    const flashApplied = [];

    for (let idx = 0; idx < norm.length; idx++) {
        const item = norm[idx];
        const fp = flashMap[String(item.productId)];
        if (!fp) continue;
        const perUnit = item.price - fp;
        if (perUnit <= 0) continue;
        flashClaimed[idx] = true;
        flashDiscount += perUnit * item.quantity;
    }

    if (flashDiscount > 0) {
        const flashPromo = promotions.find(p => p.type === "flash_sale");
        flashApplied.push({
            id: flashPromo?.id ?? "flash",
            name: flashPromo?.name ?? "Flash Sale",
            type: "flash_sale",
            amount: Math.round(flashDiscount),
        });
    }

    // ── Step 2: Best percent/amount promo (non-flash items only) ──
    const percentAmountPromos = promotions.filter(p => p.type === "percent" || p.type === "amount");

    let bestPromo = null;
    let bestDiscount = 0;

    for (const promo of percentAmountPromos) {
        let eligibleAmount = 0;
        const isGlobal = promo.products_scope.length === 0 && promo.categories_scope.length === 0;

        for (let idx = 0; idx < norm.length; idx++) {
            if (flashClaimed[idx]) continue;
            const item = norm[idx];
            if (isGlobal ||
                promo.products_scope.includes(item.productId) ||
                promo.categories_scope.includes(item.categoryId)) {
                eligibleAmount += item.price * item.quantity;
            }
        }

        if (eligibleAmount <= 0) continue;
        if (Number(promo.min_order_total ?? 0) > orderSubtotal) continue;

        let thisDiscount = promo.type === "percent"
            ? eligibleAmount * (Number(promo.value ?? 0) / 100)
            : Number(promo.value ?? 0);

        if (promo.max_discount) thisDiscount = Math.min(thisDiscount, Number(promo.max_discount));
        thisDiscount = Math.min(thisDiscount, eligibleAmount);

        if (thisDiscount > bestDiscount) {
            bestDiscount = thisDiscount;
            bestPromo = { promo, amount: thisDiscount, eligibleAmount };
        }
    }

    const percentAmountApplied = [];
    if (bestPromo) {
        percentAmountApplied.push({
            id: bestPromo.promo.id,
            name: bestPromo.promo.name,
            type: bestPromo.promo.type,
            value: bestPromo.promo.value,
            amount: Math.round(bestPromo.amount),
        });
    }

    // ── Step 3: BOGO — only when no percent/amount promo applied ──
    const giftItems = [];
    let bogoDiscount = 0;
    const bogoApplied = [];

    if (!bestPromo) {
        const bogoPromos = promotions.filter(p => p.type === "bogo");
        for (const promo of bogoPromos) {
            const rules = Array.isArray(promo.bogo_rules) ? promo.bogo_rules : [];
            let promoHasGift = false;

            for (const rule of rules) {
                const buyId = Number(rule.buy_product_id ?? rule.buy_product ?? 0);
                const buyQty = Number(rule.buy_quantity ?? 1) || 1;
                const giftId = Number(rule.gift_product_id ?? rule.gift_product ?? 0);
                const giftQty = Number(rule.gift_quantity ?? 1) || 1;
                const giftPct = Number(rule.gift_discount_percent ?? 100) || 100;

                const buyItemIdx = norm.findIndex(i => i.productId === buyId);
                const buyItem = buyItemIdx >= 0 ? norm[buyItemIdx] : null;
                if (!buyItem || flashClaimed[buyItemIdx]) continue;

                const times = Math.floor(buyItem.quantity / buyQty);
                if (times <= 0) continue;

                const giftInCart = norm.find(i => i.productId === giftId);
                const giftUnitPrice = giftInCart ? giftInCart.price : 0;
                const giftTotalQty = giftQty * times;
                const giftDiscount = giftUnitPrice * giftTotalQty * (giftPct / 100);

                bogoDiscount += giftDiscount;
                promoHasGift = true;
                giftItems.push({
                    promotionId: promo.id,
                    giftProductId: Number(rule.gift_product_id ?? rule.gift_product ?? 0),
                    giftProductName: rule.gift_product_name ?? "",
                    quantity: giftQty,
                    discountPercent: giftPct,
                    estimatedDiscount: Math.round(giftDiscount),
                });
            }

            if (promoHasGift) {
                bogoApplied.push({ id: promo.id, name: promo.name, type: "bogo" });
            }
        }
    }

    const applied = [...flashApplied, ...percentAmountApplied, ...bogoApplied];
    const discount = Math.round(flashDiscount + bestDiscount + bogoDiscount);

    // ── Step 4: Per-item resolved prices for Shopee-style display ──────────
    const itemPrices = norm.map((item, idx) => {
        const originalPrice = item.price;

        if (flashClaimed[idx]) {
            const fp = flashMap[String(item.productId)];
            return { resolvedPrice: fp ?? originalPrice, originalPrice };
        }

        if (bestPromo) {
            const promo = bestPromo.promo;
            const isGlobal = promo.products_scope.length === 0 && promo.categories_scope.length === 0;
            const itemMatches = isGlobal
                || promo.products_scope.includes(item.productId)
                || promo.categories_scope.includes(item.categoryId);

            if (itemMatches) {
                if (promo.type === "percent") {
                    const value = Number(promo.value ?? 0);
                    const uncappedPerUnit = originalPrice * (value / 100);
                    const uncappedTotal = bestPromo.eligibleAmount * (value / 100);
                    const capRatio = (uncappedTotal > 0 && bestPromo.amount < uncappedTotal)
                        ? bestPromo.amount / uncappedTotal
                        : 1;
                    const perUnit = Math.min(uncappedPerUnit * capRatio, originalPrice);
                    return { resolvedPrice: Math.round(originalPrice - perUnit), originalPrice };
                }
                if (promo.type === "amount") {
                    const eligibleAmt = bestPromo.eligibleAmount;
                    if (eligibleAmt > 0) {
                        const itemWeight = (originalPrice * item.quantity) / eligibleAmt;
                        const perUnit = (bestPromo.amount * itemWeight) / item.quantity;
                        return { resolvedPrice: Math.round(originalPrice - Math.min(perUnit, originalPrice)), originalPrice };
                    }
                }
            }
        }

        return { resolvedPrice: originalPrice, originalPrice };
    });

    return {
        discount,
        applied,
        giftItems,
        promotionsCount: promotions.length,
        itemPrices,
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
