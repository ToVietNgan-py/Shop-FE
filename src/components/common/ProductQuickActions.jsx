import { FiCreditCard, FiShoppingCart } from "react-icons/fi";

function ProductQuickActions({
    product,
    onAddToCart,
    onBuyNow,
    className = "",
}) {
    const stockValue = product?.inventory ?? product?.stock;

    const isUnavailable =
        product?.in_stock === false ||
        Number(stockValue) === 0;

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (isUnavailable) return;

        onAddToCart?.(product);
    };

    const handleBuyNow = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (isUnavailable) return;

        onBuyNow?.(product);
    };

    return (
        <div className={`product-quick-actions ${className}`}>
            <button
                type="button"
                className="quick-action-icon quick-action-icon--cart"
                onClick={handleAddToCart}
                disabled={isUnavailable}
                title="Thêm vào giỏ"
            >
                <FiShoppingCart />
            </button>

            <button
                type="button"
                className="quick-action-icon quick-action-icon--buy"
                onClick={handleBuyNow}
                disabled={isUnavailable}
                title="Mua ngay"
            >
                <FiCreditCard />
            </button>
        </div>
    );
}

export default ProductQuickActions;