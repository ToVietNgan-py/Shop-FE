/**
 * FlashSaleContext.jsx
 *
 * Cung cấp dữ liệu flash sale cho toàn app.
 * Dùng hook useFlashSale() để lấy:
 *   - flashMap: { [productId]: { flash_price, original_price, discount_percent } }
 *   - isFlash(id): boolean
 *   - getFlashPrice(id): number | null
 */
import { createContext, useContext, useEffect, useRef, useState } from "react";
import promotionService from "../services/promotionService.js";

const FlashSaleContext = createContext({ flashMap: {}, isFlash: () => false, getFlashPrice: () => null });

export function FlashSaleProvider({ children }) {
    const [flashMap, setFlashMap] = useState({});
    const timerRef = useRef(null);

    const load = async () => {
        try {
            const res = await promotionService.getFlashSale();
            const data = res?.data?.data ?? null;
            if (!data?.products?.length) { setFlashMap({}); return; }

            // Nếu flash sale đã hết hạn → clear
            if (data.remaining_seconds <= 0) { setFlashMap({}); return; }

            const map = {};
            for (const p of data.products) {
                if (!p.id) continue;
                map[String(p.id)] = {
                    flash_price: Number(p.flash_price ?? 0),
                    original_price: Number(p.original_price ?? p.price ?? 0),
                    discount_percent: Number(p.discount_percent ?? 0),
                    stock: p.stock ?? null,
                    stock_total: p.stock_total ?? null,
                };
            }
            setFlashMap(map);

            // Auto-expire khi hết giờ
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => setFlashMap({}), data.remaining_seconds * 1000);
        } catch {
            setFlashMap({});
        }
    };

    useEffect(() => {
        load();
        const interval = setInterval(load, 60_000);
        return () => {
            clearInterval(interval);
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const isFlash = (id) => Boolean(id && flashMap[String(id)]);
    const getFlashPrice = (id) => (id && flashMap[String(id)]?.flash_price) || null;
    const getFlashInfo = (id) => (id ? flashMap[String(id)] ?? null : null);

    return (
        <FlashSaleContext.Provider value={{ flashMap, isFlash, getFlashPrice, getFlashInfo }}>
            {children}
        </FlashSaleContext.Provider>
    );
}

export function useFlashSale() {
    return useContext(FlashSaleContext);
}

export default FlashSaleContext;