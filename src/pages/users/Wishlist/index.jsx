import { useContext } from "react";
import { Link } from "react-router-dom";
import { FaShoppingCart, FaTrashAlt } from "react-icons/fa";
import { CartContext } from "../../../context/CartContext.jsx";
import { useWishlist } from "../../../context/WishlistContext.jsx";
import { formatVND } from "../../../utils/format.js";
import PageLoading from "../../../components/PageLoading/PageLoading.jsx";
import ErrorState from "../../../components/ErrorState/ErrorState.jsx";
import WishlistButton from "../../../components/common/WishlistButton.jsx";

import "./style.scss";

function WishlistPage() {
    const { addToCart } = useContext(CartContext);
    const { wishlistItems, loading, error, removeFromWishlist, refreshWishlist } = useWishlist();
    const wishlistCount = wishlistItems.length;

    const handleAddToCart = async (product) => {
        try {
            await addToCart({
                id: product.id,
                productId: product.id,
                name: product.name,
                price: product.price,
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
            <div className="wishlist-hero">
                <div className="wishlist-hero__topline">
                    <p className="eyebrow">Yêu thích</p>
                    <span className="wishlist-hero__count">{wishlistCount} sản phẩm</span>
                </div>
                <h1>Sản phẩm bạn đã lưu</h1>
                <p>Danh sách này đồng bộ theo tài khoản, cập nhật theo thời gian thực và có thể thêm thẳng vào giỏ hàng.</p>
            </div>

            {wishlistItems.length === 0 ? (
                <div className="wishlist-empty">
                    <h2>Chưa có sản phẩm nào trong wishlist</h2>
                    <p>Hãy quay lại danh sách sản phẩm và bấm tim vào những món bạn thích.</p>
                    <Link to="/san-pham" className="wishlist-empty__cta">Khám phá sản phẩm</Link>
                </div>
            ) : (
                <div className="wishlist-grid">
                    {wishlistItems.map((product) => (
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
                                        <strong>{formatVND(product.price)}</strong>
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
                    ))}
                </div>
            )}
        </div>
    );
}

export default WishlistPage;
