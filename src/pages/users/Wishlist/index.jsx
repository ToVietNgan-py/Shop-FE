import { useEffect, useMemo, useState, useContext } from "react";
import { Link } from "react-router-dom";
import { FaShoppingCart, FaTrashAlt } from "react-icons/fa";
import { CartContext } from "../../../context/CartContext.jsx";
import { useWishlist } from "../../../context/WishlistContext.jsx";
import { formatVND } from "../../../utils/format.js";
import PageLoading from "../../../components/PageLoading/PageLoading.jsx";
import ErrorState from "../../../components/ErrorState/ErrorState.jsx";
import WishlistButton from "../../../components/common/WishlistButton.jsx";
import { promotionUtils } from "../../../services/promotionService.js";

import "./style.scss";

function WishlistPage() {
    const { addToCart } = useContext(CartContext);
    const { wishlistItems, loading, error, removeFromWishlist, refreshWishlist } = useWishlist();
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
                        const productId = Number(productRef.id ?? productRef.product_id ?? productRef);
                        if (!Number.isNaN(productId)) {
                            map.set(productId, promo);
                        }
                    }
                } else {
                    globals.push(promo);
                }
            }

            setPromoMap(map);
            setGlobalPromos(globals);
        })();

        return () => {
            alive = false;
        };
    }, []);

    const getPromotionInfo = useMemo(() => {
        return (product) => {
            const allPromos = [
                ...(promoMap.has(product.id) ? [promoMap.get(product.id)] : []),
                ...globalPromos,
            ];

            return promotionUtils.estimateProductPromotion(product, allPromos);
        };
    }, [promoMap, globalPromos]);

    const handleAddToCart = async (product) => {
        const promo = getPromotionInfo(product);
        const priceToUse = promo?.discountAmount > 0 ? promo.finalPrice : product.price;

        try {
            await addToCart({
                id: product.id,
                productId: product.id,
                name: product.name,
                price: priceToUse,
                image: product.image,
                quantity: 1,
            });
        } catch (cartError) {
            console.error("Failed to add wishlist item to cart:", cartError);
        }
    };

    if (loading) {
        return <PageLoading title="Đang tải wishlist" description="Mình đang đồng bộ danh sách yêu thích của bạn." />;
    }

    if (error) {
        return <ErrorState title="Không tải được wishlist" description={error} actionLabel="Tải lại" onRetry={refreshWishlist} />;
    }

    return (
        <div className="wishlist-page">
            {wishlistItems.length === 0 ? (
                <div className="wishlist-empty">
                    <h2>Chưa có sản phẩm nào trong wishlist</h2>
                    <p>Hãy quay lại danh sách sản phẩm và bấm tim vào những món bạn thích.</p>
                    <Link to="/san-pham" className="wishlist-empty__cta">Khám phá sản phẩm</Link>
                </div>
            ) : (
                <div className="wishlist-grid">
                    {wishlistItems.map((product) => {
                        const promo = getPromotionInfo(product);
                        const hasDiscount = Boolean(promo?.discountAmount > 0);

                        return (
                            <div key={product.id} className="wishlist-card-shell">
                                <WishlistButton product={product} />
                                <Link to={`/san-pham/${product.id}`} className="wishlist-card">
                                    <div className="wishlist-card__image">
                                        {product.image ? <img src={product.image} alt={product.name} /> : null}
                                    </div>
                                    <div className="wishlist-card__body">
                                        <div>
                                            <h3>{product.name}</h3>
                                            <p className="wishlist-card__category">{product.category || "Sản phẩm"}</p>
                                        </div>
                                        <div className="wishlist-card__footer">
                                            {hasDiscount ? (
                                                <div className="wishlist-card__price">
                                                    <strong className="price-sale">{formatVND(promo.finalPrice)}</strong>
                                                    <span className="price-original">{formatVND(product.price)}</span>
                                                    <span className="price-badge">
                                                        {promo.promo.type === "percent"
                                                            ? `-${promo.promo.value}%`
                                                            : `Giảm ${Number(promo.promo.value).toLocaleString("vi-VN")}đ`}
                                                    </span>
                                                </div>
                                            ) : (
                                                <strong>{formatVND(product.price)}</strong>
                                            )}
                                            <span className={product.stock > 0 ? "stock in-stock" : "stock out-stock"}>
                                                {product.stock > 0 ? `Còn ${product.stock}` : "Hết hàng"}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                                <div className="wishlist-card__actions">
                                    <button type="button" className="action-btn primary" onClick={() => handleAddToCart(product)}>
                                        <FaShoppingCart />
                                        <span>Thêm vào giỏ</span>
                                    </button>
                                    <button type="button" className="action-btn ghost" onClick={() => removeFromWishlist(product.id)}>
                                        <FaTrashAlt />
                                        <span>Bỏ yêu thích</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default WishlistPage;
