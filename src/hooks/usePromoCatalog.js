/**
 * usePromoCatalog.js
 *
 * Hook tải promotion catalog một lần, trả về promoMap + globalPromos.
 * Dùng chung cho BestSeller, NewArrival, WishlistPage, ProductPage.
 */
import { useState, useEffect } from "react";
import { promotionUtils } from "../services/promotionService.js";

export function usePromoCatalog() {
    const [promoMap, setPromoMap] = useState(new Map());
    const [globalPromos, setGlobalPromos] = useState([]);

    useEffect(() => {
        let alive = true;

        (async () => {
            const list = await promotionUtils.fetchPromotionCatalog().catch(() => []);
            if (!alive) return;

            const map = new Map();
            const globals = [];

            for (const promo of list) {
                if (promo.products?.length > 0) {
                    for (const productRef of promo.products) {
                        const pid = Number(productRef.id ?? productRef.product_id ?? productRef);
                        if (!Number.isNaN(pid)) map.set(pid, promo);
                    }
                } else {
                    globals.push(promo);
                }
            }

            setPromoMap(map);
            setGlobalPromos(globals);
        })();

        return () => { alive = false; };
    }, []);

    return { promoMap, globalPromos };
}