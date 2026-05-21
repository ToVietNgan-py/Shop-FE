import api from "../apis/default.js";

const readList = (res) => {
    const payload = res?.data ?? {};
    return Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : payload?.items ?? [];
};

const fetchActive = async () => {
    const res = await api.get('/promotions/active');
    return readList(res);
};

// Basic client-side apply logic supporting percent, amount and simple BOGO rules.
// This is meant as a progressive enhancement when backend cannot calculate discounts yet.
const applyToCart = async (items = [], orderTotal = 0) => {
    const promotions = await fetchActive().catch(() => []);

    // normalize items: ensure productId, price, quantity, and optional categoryId
    const norm = items.map((it) => ({
        productId: Number(it.productId ?? it.product_id ?? it.id ?? 0),
        price: Number(it.price ?? 0),
        quantity: Number(it.quantity ?? 1),
        raw: it,
    }));

    let discount = 0;
    const applied = [];
    const giftItems = [];

    // sort by priority desc
    promotions.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    for (const promo of promotions) {
        if (!promo || !promo.is_active) continue;

        if (promo.type === 'percent' || promo.type === 'amount') {
            // scope: if product_ids present, only sum those; if category_ids present we skip category matching (FE may not have ids)
            const productIds = (promo.products ?? []).map(p => Number(p.id ?? p.product_id ?? p));
            let eligibleAmount = 0;

            if (productIds.length > 0) {
                for (const it of norm) {
                    if (productIds.includes(it.productId)) eligibleAmount += it.price * it.quantity;
                }
            } else {
                eligibleAmount = orderTotal;
            }

            if ((promo.min_order_total ?? 0) > eligibleAmount) continue;

            let thisDisc = 0;
            if (promo.type === 'percent') {
                thisDisc = eligibleAmount * (Number(promo.value ?? 0) / 100);
            } else {
                thisDisc = Number(promo.value ?? 0);
            }

            if (promo.max_discount) thisDisc = Math.min(thisDisc, Number(promo.max_discount));
            if (thisDisc > 0) {
                discount += thisDisc;
                applied.push({ id: promo.id, name: promo.name, type: promo.type, value: promo.value, amount: thisDisc });
            }
        }

        if (promo.type === 'bogo') {
            const rules = promo.bogo_rules ?? [];
            for (const rule of rules) {
                const buyId = Number(rule.buy_product_id ?? rule.buy_product ?? 0);
                const giftId = Number(rule.gift_product_id ?? rule.gift_product ?? 0);
                const buyQty = Number(rule.buy_quantity ?? 1) || 1;
                const giftQty = Number(rule.gift_quantity ?? 1) || 1;
                const giftPct = Number(rule.gift_discount_percent ?? 100) || 100;

                const cartItem = norm.find(i => i.productId === buyId);
                if (!cartItem) continue;

                const times = Math.floor(cartItem.quantity / buyQty);
                if (times <= 0) continue;

                // Try to approximate gift price from items in cart; otherwise leave price 0 and rely on BE.
                const giftProductInCart = norm.find(i => i.productId === giftId);
                const giftUnitPrice = giftProductInCart ? giftProductInCart.price : 0;
                const giftTotalQty = giftQty * times;
                const giftDiscountAmount = giftUnitPrice * giftTotalQty * (giftPct / 100);

                if (giftDiscountAmount > 0) {
                    discount += giftDiscountAmount;
                }

                giftItems.push({ promotionId: promo.id, giftProductId: giftId, quantity: giftTotalQty, discountPercent: giftPct, estimatedDiscount: giftDiscountAmount });
            }
            if ((promo.bogo_rules ?? []).length > 0) applied.push({ id: promo.id, name: promo.name, type: 'bogo' });
        }
    }

    return { discount: Math.round(discount), applied, giftItems, promotionsCount: promotions.length };
};

export const promotionService = { fetchActive, applyToCart };

export default promotionService;
