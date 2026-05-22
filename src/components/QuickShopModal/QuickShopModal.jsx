import { useEffect, useState, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { productService } from "../../services/productService.js";
import { CartContext } from "../../context/CartContext.jsx";
import { AuthContext } from "../../context/AuthContext.jsx";
import { formatVND } from "../../utils/format.js";
import "./QuickShopModal.scss";

// ─── Size sort (giống ProductDetail) ─────────────────────────────────────────
const CLOTH_SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "2XL", "3XL"];

const sortSizes = (sizes) => {
    const allNumeric = sizes.every((s) => /^\d+(\.\d+)?$/.test(String(s).trim()));
    if (allNumeric) return [...sizes].sort((a, b) => Number(a) - Number(b));
    return [...sizes].sort((a, b) => {
        const ai = CLOTH_SIZE_ORDER.indexOf(String(a).toUpperCase());
        const bi = CLOTH_SIZE_ORDER.indexOf(String(b).toUpperCase());
        if (ai !== -1 && bi !== -1) return ai - bi;
        if (ai !== -1) return -1;
        if (bi !== -1) return 1;
        return String(a).localeCompare(String(b));
    });
};

const getColors = (variants) =>
    [...new Set(variants.map((v) => v.color).filter(Boolean))];

const getSizesForColor = (variants, color) =>
    sortSizes([...new Set(
        variants
            .filter((v) => !color || v.color === color)
            .map((v) => v.size)
            .filter(Boolean)
    )]);

const findVariant = (variants, color, size) =>
    variants.find((v) => v.color === color && v.size === size) ?? null;

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * QuickShopModal
 *
 * Props:
 *   product  – object từ list (id, name, img, price)
 *   onClose  – callback đóng modal
 */
function QuickShopModal({ product, onClose, actionType = "cart" }) {
    const navigate = useNavigate();
    const { addToCart } = useContext(CartContext);
    const { user } = useContext(AuthContext) ?? {};

    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [selectedColor, setSelectedColor] = useState("");
    const [selectedSize, setSelectedSize] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [feedback, setFeedback] = useState("");
    const [feedbackType, setFeedbackType] = useState("success");

    // Fetch detail (có variants) khi modal mở
    useEffect(() => {
        if (!product?.id) return;
        let mounted = true;
        setLoading(true);
        setError("");

        productService.detail(product.id)
            .then((data) => {
                if (!mounted) return;
                setDetail(data);

                const variants = Array.isArray(data?.variants) ? data.variants : [];
                if (variants.length > 0) {
                    const firstAvailable =
                        variants.find((v) => v.inventory > 0) ?? variants[0];

                    setSelectedColor(firstAvailable?.color ?? "");
                    setSelectedSize(firstAvailable?.size ?? "");
                }
            })
            .catch(() => {
                if (mounted) setError("Không tải được thông tin sản phẩm.");
            })
            .finally(() => { if (mounted) setLoading(false); });

        return () => { mounted = false; };
    }, [product?.id]);

    // Đóng khi bấm Escape
    useEffect(() => {
        const handler = (e) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [onClose]);

    // Lock scroll
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    const variants = detail?.variants ?? [];
    const colors = getColors(variants);
    const sizes = getSizesForColor(variants, selectedColor);
    const activeVariant = findVariant(variants, selectedColor, selectedSize);
    const hasVariants = variants.length > 0;
    const displayPrice = activeVariant?.price || detail?.price || product?.price || 0;
    const variantInventory = activeVariant?.inventory ?? detail?.inventory ?? 0;
    const canAdd =
        !hasVariants ||
        Boolean(activeVariant && variantInventory > 0);
    const showFeedback = useCallback((msg, type = "success") => {
        setFeedback(msg);
        setFeedbackType(type);
        setTimeout(() => setFeedback(""), 2500);
    }, []);

    const handleAddToCart = useCallback(async () => {
        if (!canAdd) {
            showFeedback("Vui lòng chọn màu và size.", "error");
            return;
        }

        const item = {
            id: product.id,
            name: detail?.name ?? product.name,
            price: displayPrice,
            img: detail?.img ?? product.img,
            quantity,
            ...(hasVariants && activeVariant
                ? { variantId: activeVariant.id, color: selectedColor, size: selectedSize }
                : {}),
        };

        try {
            await addToCart(item);
            showFeedback("Đã thêm vào giỏ hàng ✓", "success");
        } catch {
            showFeedback("Thêm vào giỏ thất bại.", "error");
        }
    }, [canAdd, addToCart, product, detail, displayPrice, quantity, hasVariants, activeVariant, selectedColor, selectedSize, showFeedback]);

    const handleBuyNow = useCallback(() => {
        if (!canAdd) {
            showFeedback("Vui lòng chọn màu và size.", "error");
            return;
        }

        const buyNowItem = {
            id: product.id,
            name: detail?.name ?? product.name,
            price: displayPrice,
            img:
                detail?.img ||
                product?.img ||
                detail?.image ||
                product?.image ||
                "",
            quantity,

            ...(hasVariants && activeVariant
                ? {
                    variantId: activeVariant.id,
                    color: selectedColor,
                    size: selectedSize,
                }
                : {}),
        };

        onClose();

        navigate("/thanh-toan", {
            state: {
                buyNow: true,
                checkoutItems: [buyNowItem],
            },
        });
    }, [
        canAdd,
        product,
        detail,
        displayPrice,
        quantity,
        hasVariants,
        activeVariant,
        selectedColor,
        selectedSize,
        navigate,
        onClose,
        showFeedback,
    ]);
    useEffect(() => {
        if (!detail || loading) return;

        // Nếu không có variants thì xử lý luôn
        if (!hasVariants) {
            if (actionType === "buy") {
                handleBuyNow();
            }
        }
    }, [
        detail,
        loading,
        hasVariants,
        actionType,
        handleBuyNow,
    ]);
    const handleColorChange = (color) => {
        setSelectedColor(color);
        setSelectedSize("");
        setQuantity(1);
    };

    return (
        <div className="qsm-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Chọn nhanh sản phẩm">
            <div className="qsm-panel" onClick={(e) => e.stopPropagation()}>
                {/* Close */}
                <button className="qsm-close" onClick={onClose} aria-label="Đóng">✕</button>

                {/* Product header */}
                <div className="qsm-header">
                    <div className="qsm-thumb">
                        {(detail?.img ?? product?.img) && (
                            <img src={detail?.img ?? product?.img} alt={detail?.name ?? product?.name} />
                        )}
                    </div>
                    <div className="qsm-info">
                        <h3 className="qsm-name">{detail?.name ?? product?.name}</h3>
                        <p className="qsm-price">{formatVND(displayPrice)}</p>
                    </div>
                </div>

                {/* Body */}
                <div className="qsm-body">
                    {loading && <p className="qsm-loading">Đang tải...</p>}
                    {error && <p className="qsm-error">{error}</p>}

                    {!loading && !error && (
                        <>
                            {/* Màu */}
                            {colors.length > 0 && (
                                <div className="qsm-option-group">
                                    <span className="qsm-label">Màu sắc</span>
                                    <div className="qsm-chips">
                                        {colors.map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                className={`qsm-chip ${selectedColor === color ? "active" : ""}`}
                                                onClick={() => handleColorChange(color)}
                                            >
                                                {color}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Size */}
                            {sizes.length > 0 && (
                                <div className="qsm-option-group">
                                    <span className="qsm-label">Size</span>
                                    <div className="qsm-chips">
                                        {sizes.map((size) => {
                                            const v = findVariant(variants, selectedColor, size);
                                            const oos = v ? v.inventory === 0 : false;
                                            return (
                                                <button
                                                    key={size}
                                                    type="button"
                                                    className={`qsm-chip ${selectedSize === size ? "active" : ""} ${oos ? "oos" : ""}`}
                                                    onClick={() => !oos && setSelectedSize(size)}
                                                    disabled={oos}
                                                    title={oos ? "Hết hàng" : ""}
                                                >
                                                    {size}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Tồn kho */}
                            {activeVariant && (
                                <p className={`qsm-stock ${variantInventory === 0 ? "out" : "in"}`}>
                                    {variantInventory === 0 ? "Hết hàng" : `Còn ${variantInventory} sản phẩm`}
                                </p>
                            )}

                            {/* Số lượng */}
                            <div className="qsm-qty-row">
                                <span className="qsm-label">Số lượng</span>
                                <div className="qsm-qty">
                                    <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</button>
                                    <span>{quantity}</span>
                                    <button
                                        type="button"
                                        onClick={() => setQuantity((q) =>
                                            variantInventory > 0 ? Math.min(q + 1, variantInventory) : q + 1
                                        )}
                                    >+</button>
                                </div>
                            </div>

                            {/* Feedback */}
                            {feedback && (
                                <p className={`qsm-feedback ${feedbackType}`}>{feedback}</p>
                            )}

                            {/* Actions */}
                            <div className="qsm-actions">
                                <button
                                    type="button"
                                    className="qsm-btn secondary"
                                    onClick={handleAddToCart}
                                    disabled={hasVariants && variantInventory === 0}
                                >
                                    Thêm vào giỏ
                                </button>
                                <button
                                    type="button"
                                    className={`qsm-btn primary ${actionType === "buy"
                                        ? "is-buy"
                                        : "is-cart"
                                        }`}
                                    onClick={handleBuyNow}
                                    disabled={hasVariants && variantInventory === 0}
                                >
                                    Mua ngay
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default QuickShopModal;