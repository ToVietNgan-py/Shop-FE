import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { FaTrashAlt } from "react-icons/fa";
import { CartContext } from "../../../context/CartContext.jsx";
import { useWishlist } from "../../../context/WishlistContext.jsx";
import { formatVND } from "../../../utils/format.js";
import PageLoading from "../../../components/PageLoading/PageLoading.jsx";
import ErrorState from "../../../components/ErrorState/ErrorState.jsx";
import WishlistButton from "../../../components/common/WishlistButton.jsx";
import { usePromoCatalog } from "../../../hooks/usePromoCatalog.js";
import { useProductPrice } from "../../../hooks/useProductPrice.js";
import ProductQuickActions from "../../../components/common/ProductQuickActions.jsx";
import QuickShopModal from "../../../components/QuickShopModal/QuickShopModal.jsx";
import "./style.scss";

// ── Sub-component để mỗi wishlist card tự gọi useProductPrice ──
function WishlistCard({ product, promoMap, globalPromos, onOpenQuickShop, onRemove }) {
    const priceInfo = useProductPrice(product, promoMap, globalPromos);

    // Ảnh: wishlistService normalize vào field "image"
    const imgSrc = product.image ?? product.img ?? null;

    // Chuẩn bị product object truyền vào QuickShopModal.
    // QUAN TRỌNG: product.price phải là giá GỐC (để QuickShopModal gạch đúng).
    // salePrice / flashPrice là giá đã giảm — modal ưu tiên 2 field này làm displayPrice.
    const hasSalePrice = priceInfo?.hasDiscount || priceInfo?.isFlashSale;
    const productWithPrice = {
        ...product,
        img: imgSrc,
        // Đảm bảo price = giá gốc (priceInfo.originalPrice), không bị displayPrice ghi đè
        price: priceInfo?.originalPrice ?? product.price,
        ...(hasSalePrice ? { salePrice: priceInfo.displayPrice } : {}),
        ...(priceInfo?.isFlashSale ? { flashPrice: priceInfo.displayPrice } : {}),
    };

    return (
        <div className="wishlist-card-shell">
            <WishlistButton product={product} />
            <Link to={`/san-pham/${product.id}`} className="wishlist-card">
                <div className="wishlist-card__image">
                    {imgSrc
                        ? <img src={imgSrc} alt={product.name} />
                        : <div className="wishlist-card__img-placeholder">✦</div>
                    }
                    {priceInfo?.isFlashSale && (
                        <span className="wishlist-card__flash-badge">⚡ Flash</span>
                    )}
                </div>
                <div className="wishlist-card__body">
                    <div>
                        <h3>{product.name}</h3>
                        <p className="wishlist-card__category">{product.category || "Sản phẩm"}</p>
                    </div>
                    <div className="wishlist-card__footer">
                        {/* Giá */}
                        {priceInfo?.hasDiscount ? (
                            <div className="wishlist-card__price">
                                <strong className="price-sale">{formatVND(priceInfo.displayPrice)}</strong>
                                <span className="price-original">{formatVND(priceInfo.originalPrice)}</span>
                                {priceInfo.badgeLabel && (
                                    <span className="price-badge" style={priceInfo.isFlashSale ? { background: "#ff3b3b" } : {}}>
                                        {priceInfo.isFlashSale ? `⚡ ${priceInfo.badgeLabel}` : priceInfo.badgeLabel}
                                    </span>
                                )}
                            </div>
                        ) : (
                            <strong>{formatVND(priceInfo?.displayPrice ?? product.price)}</strong>
                        )}

                        {/* Tồn kho */}
                        <span className={product.stock > 0 ? "stock in-stock" : "stock out-stock"}>
                            {product.stock > 0 ? `Còn ${product.stock}` : "Hết hàng"}
                        </span>
                    </div>
                </div>
            </Link>
            <div className="wishlist-card__actions">
                {/* Thay nút FaShoppingCart bằng ProductQuickActions → mở QuickShopModal */}
                <ProductQuickActions
                    product={productWithPrice}
                    onAddToCart={() => onOpenQuickShop(productWithPrice, "cart")}
                    onBuyNow={() => onOpenQuickShop(productWithPrice, "buy")}
                />
                <button
                    type="button"
                    className="action-btn ghost"
                    onClick={() => onRemove(product.id)}
                >
                    <FaTrashAlt />
                </button>
            </div>
        </div>
    );
}

// ── Trang chính ──
function WishlistPage() {
    const { wishlistItems, loading, error, removeFromWishlist, refreshWishlist } = useWishlist();
    const { promoMap, globalPromos } = usePromoCatalog();

    // State điều khiển QuickShopModal
    const [quickShopProduct, setQuickShopProduct] = useState(null);
    const [quickShopAction, setQuickShopAction] = useState("cart");

    const handleOpenQuickShop = (product, actionType) => {
        setQuickShopProduct(product);
        setQuickShopAction(actionType);
    };

    const handleCloseQuickShop = () => {
        setQuickShopProduct(null);
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
                    {wishlistItems.map((product) => (
                        <WishlistCard
                            key={product.id}
                            product={product}
                            promoMap={promoMap}
                            globalPromos={globalPromos}
                            onOpenQuickShop={handleOpenQuickShop}
                            onRemove={removeFromWishlist}
                        />
                    ))}
                </div>
            )}

            {/* QuickShopModal — render khi có product được chọn */}
            {quickShopProduct && (
                <QuickShopModal
                    product={quickShopProduct}
                    actionType={quickShopAction}
                    onClose={handleCloseQuickShop}
                />
            )}
        </div>
    );
}

export default WishlistPage;