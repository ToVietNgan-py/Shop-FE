/**
 * useProductPrice.js
 *
 * Hook dùng chung để tính giá hiển thị cho 1 sản phẩm.
 *
 * Logic ưu tiên:
 *   1. Nếu sản phẩm đang trong Flash Sale  →  chỉ dùng flash_price, KHÔNG áp thêm promotion nào
 *   2. Nếu không flash sale                →  tính promotion (percent / amount) bình thường
 *
 * Trả về:
 *   {
 *     displayPrice,      // giá hiển thị (số)
 *     originalPrice,     // giá gốc (số)
 *     badgeLabel,        // chuỗi badge, vd "-20%" | "Giảm 50.000đ" | "⚡ Flash" | null
 *     isFlashSale,       // boolean
 *     hasDiscount,       // boolean (có giá khuyến mãi khác giá gốc)
 *   }
 */

import { useMemo } from "react";
import { useFlashSale } from "../context/FlashSaleContext.jsx";
import { promotionUtils } from "../services/promotionService.js";

/**
 * @param {object}   product    - object sản phẩm (cần có .id, .price)
 * @param {Map}      promoMap   - Map<productId, promotion> từ fetchPromotionCatalog
 * @param {Array}    globalPromos - mảng promotion áp dụng toàn bộ
 */
export function useProductPrice(product, promoMap = new Map(), globalPromos = []) {
    const { getFlashInfo, isFlash } = useFlashSale();

    return useMemo(() => {
        if (!product) return null;

        const originalPrice = Number(product.price ?? 0);
        const flash = getFlashInfo(product.id);
        const flashActive = isFlash(product.id);

        // ── 1. Flash Sale: KHÔNG áp thêm bất kỳ promotion nào ──
        if (flashActive && flash?.flash_price > 0) {
            const displayPrice = flash.flash_price;
            const pct = originalPrice > 0
                ? Math.round(100 - (displayPrice / originalPrice) * 100)
                : 0;
            return {
                displayPrice,
                originalPrice,
                badgeLabel: pct > 0 ? `-${pct}%` : null,
                flashBadge: true,       // để render badge "⚡ Flash" riêng
                isFlashSale: true,
                hasDiscount: displayPrice < originalPrice,
            };
        }

        // ── 2. Không flash sale: tính promotion thông thường ──
        const allPromos = [
            ...(promoMap.has(product.id) ? [promoMap.get(product.id)] : []),
            ...globalPromos,
        ];
        const promo = promotionUtils.estimateProductPromotion(product, allPromos);

        if (promo?.discountAmount > 0) {
            const badgeLabel = promo.promo.type === "percent"
                ? `-${promo.promo.value}%`
                : `Giảm ${Number(promo.promo.value).toLocaleString("vi-VN")}đ`;

            return {
                displayPrice: promo.finalPrice,
                originalPrice,
                badgeLabel,
                flashBadge: false,
                isFlashSale: false,
                hasDiscount: true,
            };
        }

        // ── 3. Giá bình thường ──
        return {
            displayPrice: originalPrice,
            originalPrice,
            badgeLabel: null,
            flashBadge: false,
            isFlashSale: false,
            hasDiscount: false,
        };
    }, [product, promoMap, globalPromos, getFlashInfo, isFlash]);
}