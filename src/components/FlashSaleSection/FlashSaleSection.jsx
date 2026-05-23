import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import promotionService from "../../services/promotionService.js";
import { productService } from "../../services/productService.js";
import { formatVND } from "../../utils/format.js";
import useCountdown from "../../hooks/useCountdown.js";
import WishlistButton from "../common/WishlistButton.jsx";
import ProductQuickActions from "../common/ProductQuickActions.jsx";
import QuickShopModal from "../QuickShopModal/QuickShopModal.jsx";
import "./FlashSaleSection.scss";

const fmt = (n) => String(n).padStart(2, "0");

function FlashSaleSection() {
    const [flashSale, setFlashSale] = useState(null);
    const [enrichedProducts, setEnrichedProducts] = useState([]);
    const [startIndex, setStartIndex] = useState(0);
    const [quickShopProduct, setQuickShopProduct] = useState(null);
    const [quickActionType, setQuickActionType] = useState("cart");
    const ITEMS_PER_PAGE = 4;

    const { hours, minutes, seconds, finished, reset } = useCountdown(0);
    const resetRef = useRef(reset);
    useEffect(() => { resetRef.current = reset; }, [reset]);

    useEffect(() => {
        let alive = true;

        const load = async () => {
            try {
                const res = await promotionService.getFlashSale();
                const data = res?.data?.data ?? null;
                if (!alive) return;
                setFlashSale(data);
                if (data?.remaining_seconds > 0) {
                    resetRef.current(data.remaining_seconds);
                }

                if (data?.products?.length) {
                    const withImages = await Promise.all(
                        data.products.map(async (p) => {
                            try {
                                // ✅ FIX: dùng productService.detail() thay vì getById()
                                // normalizeProduct() đã xử lý tất cả field ảnh → trả về p.img
                                const detail = await productService.detail(p.id);
                                return {
                                    ...p,
                                    image: detail?.img ?? null,
                                };
                            } catch {
                                return { ...p, image: null };
                            }
                        })
                    );
                    if (alive) setEnrichedProducts(withImages);
                }
            } catch {
                if (alive) { setFlashSale(null); setEnrichedProducts([]); }
            }
        };

        load();
        const id = setInterval(load, 60_000);
        return () => { alive = false; clearInterval(id); };
    }, []);

    if (!flashSale || finished) return null;

    const products = enrichedProducts.length ? enrichedProducts : (flashSale.products ?? []);
    const visibleProducts = products.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const prev = () => { if (startIndex - ITEMS_PER_PAGE >= 0) setStartIndex(startIndex - ITEMS_PER_PAGE); };
    const next = () => { if (startIndex + ITEMS_PER_PAGE < products.length) setStartIndex(startIndex + ITEMS_PER_PAGE); };

    return (
        <>
            <div className="fss">
                {/* Header */}
                <div className="fss__header">
                    <div className="fss__title-wrap">
                        <h2 className="fss__title">⚡ FLASH SALE</h2>
                        <p className="fss__subtitle">{flashSale.name}</p>
                    </div>

                    <div className="fss__countdown">
                        <span className="fss__countdown-label">Kết thúc sau</span>
                        <div className="fss__digits">
                            <div className="fss__block"><span>{fmt(hours)}</span><small>GIỜ</small></div>
                            <span className="fss__sep">:</span>
                            <div className="fss__block"><span>{fmt(minutes)}</span><small>PHÚT</small></div>
                            <span className="fss__sep">:</span>
                            <div className="fss__block"><span>{fmt(seconds)}</span><small>GIÂY</small></div>
                        </div>
                    </div>

                    <Link to="/san-pham"><button className="fss__btn">Xem tất cả</button></Link>
                </div>

                {/* Slider */}
                <div className="fss__slider">
                    <button className="fss__arrow fss__arrow--left" onClick={prev} disabled={startIndex === 0}>‹</button>

                    <div className="fss__list">
                        {visibleProducts.map((item) => {
                            const discountPct = item.discount_percent > 0
                                ? item.discount_percent
                                : item.flash_price > 0
                                    ? Math.round(100 - (item.flash_price / item.original_price) * 100)
                                    : 0;

                            const displayPrice = item.flash_price > 0 ? item.flash_price : item.original_price;
                            const hasDiscount = item.flash_price > 0 && item.flash_price < item.original_price;

                            return (
                                <div key={item.id} className="fss__card-wrap">
                                    <WishlistButton product={item} />

                                    <div className="fss__card">
                                        <Link to={`/san-pham/${item.id}`} className="fss__card-link">
                                            <div className="fss__img-wrap">
                                                {/* ✅ FIX: dùng item.image (được enrich từ detail.img) */}
                                                {item.image
                                                    ? <img src={item.image} alt={item.name} className="fss__img" />
                                                    : <div className="fss__img-placeholder">⚡</div>
                                                }
                                                <span className="fss__badge-flash">⚡ Flash</span>
                                                {discountPct > 0 && (
                                                    <span className="fss__badge-pct">-{discountPct}%</span>
                                                )}
                                            </div>

                                            <p className="fss__name">{item.name}</p>

                                            <div className="fss__prices">
                                                <span className="fss__price-flash">{formatVND(displayPrice)}</span>
                                                {hasDiscount && (
                                                    <span className="fss__price-orig">{formatVND(item.original_price)}</span>
                                                )}
                                            </div>
                                        </Link>

                                        <ProductQuickActions
                                            product={{
                                                ...item,
                                                // ✅ FIX: truyền cả flash_price để QuickShopModal ưu tiên dùng
                                                price: item.original_price,
                                                flashPrice: displayPrice,
                                                img: item.image,
                                            }}
                                            onAddToCart={(p) => { setQuickActionType("cart"); setQuickShopProduct(p); }}
                                            onBuyNow={(p) => { setQuickActionType("buy"); setQuickShopProduct(p); }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <button className="fss__arrow fss__arrow--right" onClick={next} disabled={startIndex + ITEMS_PER_PAGE >= products.length}>›</button>
                </div>
            </div>

            {quickShopProduct && (
                <QuickShopModal
                    product={quickShopProduct}
                    actionType={quickActionType}
                    onClose={() => setQuickShopProduct(null)}
                />
            )}
        </>
    );
}

export default FlashSaleSection;