/**
 * ProductCard.jsx
 * Product card dùng chung — tự nhận diện flash sale qua prop flashPrice.
 *
 * Props:
 *   product  - { id, name, category, image, price, flashPrice?, discountPercent?, stock?, stockTotal?, isNew? }
 *   onAddToCart  - (product) => void
 *   onWishlist   - (product) => void
 */
import { Link } from 'react-router-dom';
import './ProductCard.scss';

const fmt = (n) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

const ProductCard = ({ product, onAddToCart, onWishlist }) => {
    const {
        id, name, category, image, price,
        flashPrice, discountPercent,
        stock = null, stockTotal = null,
        isNew = false,
    } = product;

    const isFlash = !!flashPrice;
    const isSoldOut = stock === 0;
    const stockPct = stockTotal > 0 ? Math.round((1 - stock / stockTotal) * 100) : null;

    const pct = discountPercent
        ?? (flashPrice ? Math.round(100 - (flashPrice / price) * 100) : null);

    return (
        <div className={`pc${isFlash ? ' pc--flash' : ''}${isSoldOut ? ' pc--soldout' : ''}`}>
            {/* Image */}
            <Link to={`/products/${id}`} className="pc__img-wrap">
                {image
                    ? <img src={image} alt={name} className="pc__img" />
                    : <div className="pc__img-placeholder">{category?.[0] ?? '✦'}</div>
                }

                {/* Badges */}
                {isFlash && !isSoldOut && (
                    <span className="pc__badge pc__badge--flash">⚡ Flash</span>
                )}
                {isNew && !isFlash && (
                    <span className="pc__badge pc__badge--new">Mới</span>
                )}
                {pct > 0 && (
                    <span className="pc__badge pc__badge--pct">-{pct}%</span>
                )}

                {/* Wishlist */}
                <button
                    className="pc__wish"
                    aria-label="Thêm vào yêu thích"
                    onClick={(e) => { e.preventDefault(); onWishlist?.(product); }}
                >
                    ♡
                </button>
            </Link>

            {/* Info */}
            <div className="pc__body">
                {category && <p className="pc__cat">{category}</p>}
                <Link to={`/products/${id}`} className="pc__name">{name}</Link>

                {/* Price */}
                <div className="pc__prices">
                    {isFlash ? (
                        <>
                            <span className="pc__price-flash">{fmt(flashPrice)}</span>
                            <span className="pc__price-orig">{fmt(price)}</span>
                        </>
                    ) : (
                        <span className="pc__price">{fmt(price)}</span>
                    )}
                </div>

                {/* Stock progress — chỉ hiện khi flash sale */}
                {isFlash && stockPct !== null && (
                    <div className="pc__stock">
                        <div className="pc__stock-bar">
                            <div
                                className="pc__stock-fill"
                                style={{ width: `${Math.min(stockPct, 100)}%` }}
                            />
                        </div>
                        <p className={`pc__stock-lbl${stockPct >= 80 ? ' pc__stock-lbl--urgent' : ''}`}>
                            {isSoldOut
                                ? 'Đã hết hàng'
                                : stockPct >= 80
                                    ? `Đã bán ${stockPct}% — sắp hết`
                                    : `Đã bán ${stockPct}%`}
                        </p>
                    </div>
                )}
            </div>

            {/* Add to cart */}
            <button
                className="pc__add"
                disabled={isSoldOut}
                onClick={() => !isSoldOut && onAddToCart?.(product)}
            >
                {isSoldOut ? 'Hết hàng' : 'Thêm vào giỏ'}
            </button>
        </div>
    );
};

export default ProductCard;