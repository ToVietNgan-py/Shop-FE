/**
 * PriceBlock.jsx
 *
 * Component render khối giá dùng chung cho mọi nơi hiển thị sản phẩm.
 * Nhận output của useProductPrice và render nhất quán.
 *
 * Props:
 *   priceInfo   - object trả về từ useProductPrice(...)
 *   className   - class CSS tuỳ chỉnh (optional)
 *   center      - căn giữa (default: false)
 */
import { formatVND } from "../../utils/format.js";

function PriceBlock({ priceInfo, className = "", center = false }) {
    if (!priceInfo) return null;

    const { displayPrice, originalPrice, badgeLabel, flashBadge, isFlashSale, hasDiscount } = priceInfo;

    const wrapStyle = center
        ? { display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 6 }
        : { display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 };

    // ── Flash Sale ──
    if (isFlashSale) {
        return (
            <div className={`price-block ${className}`} style={wrapStyle}>
                <span className="price-sale">{formatVND(displayPrice)}</span>
                <span className="price-original">{formatVND(originalPrice)}</span>
                {badgeLabel && (
                    <span className="price-badge" style={{ background: "#ff3b3b" }}>
                        ⚡ {badgeLabel}
                    </span>
                )}
            </div>
        );
    }

    // ── Có promotion thường ──
    if (hasDiscount) {
        return (
            <div className={`price-block ${className}`} style={wrapStyle}>
                <span className="price-sale">{formatVND(displayPrice)}</span>
                <span className="price-original">{formatVND(originalPrice)}</span>
                {badgeLabel && <span className="price-badge">{badgeLabel}</span>}
            </div>
        );
    }

    // ── Giá bình thường ──
    return (
        <p className={`price ${className}`} style={center ? { textAlign: "center", margin: 0 } : {}}>
            {formatVND(displayPrice)}
        </p>
    );
}

export default PriceBlock;