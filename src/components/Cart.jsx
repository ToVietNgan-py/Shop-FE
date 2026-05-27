import { memo, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AiOutlineClose } from "react-icons/ai";
import { MdCheckCircle } from "react-icons/md";
import { CartContext } from "../context/CartContext.jsx";
import { voucherService } from "../services/voucherService.js";
import { promotionService } from "../services/promotionService.js";
import { formatVND } from "../utils/format.js";
import "./style.scss";

const PRODUCT_PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='92' height='112' viewBox='0 0 92 112'%3E%3Crect width='92' height='112' fill='%23f4f4f5'/%3E%3Ctext x='46' y='58' text-anchor='middle' font-size='12' fill='%239ca3af' font-family='Arial,sans-serif'%3ENo Image%3C/text%3E%3C/svg%3E";

const Cart = ({ onClose }) => {
    const navigate = useNavigate();
    const {
        cartItems,
        cartSubtotal,
        updateCartItemQuantity,
        removeFromCart,
        clearCart
    } = useContext(CartContext);

    // ===== Voucher state =====
    const [voucherCode, setVoucherCode] = useState("");
    const [appliedVoucher, setAppliedVoucher] = useState(null);
    const [voucherLoading, setVoucherLoading] = useState(false);
    const [voucherError, setVoucherError] = useState(null);
    const [appliedPromotions, setAppliedPromotions] = useState([]);
    const [promotionGifts, setPromotionGifts] = useState([]);
    const [promotionLoading, setPromotionLoading] = useState(false);
    const [itemPrices, setItemPrices] = useState([]);

    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, []);

    useEffect(() => {
        let alive = true;

        const compute = async () => {
            if (!cartItems?.length) {
                setAppliedPromotions([]);
                setPromotionGifts([]);
                setItemPrices([]);
                setPromotionLoading(false);
                return;
            }

            setPromotionLoading(true);
            try {
                const res = await promotionService.applyToCart(cartItems, cartSubtotal);
                if (!alive) return;
                setAppliedPromotions(res.applied ?? []);
                setPromotionGifts(res.giftItems ?? []);
                setItemPrices(res.itemPrices ?? []);
            } catch (error) {
                if (!alive) return;
                setAppliedPromotions([]);
                setPromotionGifts([]);
                setItemPrices([]);
            } finally {
                if (alive) setPromotionLoading(false);
            }
        };

        compute();

        return () => {
            alive = false;
        };
    }, [cartItems, cartSubtotal]);

    // ===== Voucher handlers =====
    const handleApplyVoucher = async () => {
        if (!voucherCode.trim()) {
            setVoucherError("Vui lòng nhập mã giảm giá");
            return;
        }

        setVoucherLoading(true);
        setVoucherError(null);

        try {
            const result = await voucherService.apply({
                code: voucherCode.trim(),
                orderTotal: resolvedSubtotal,
            });

            console.log("[Cart] Voucher applied:", result);
            setAppliedVoucher(result);
            setVoucherCode(""); // Clear input sau khi áp dụng thành công
        } catch (err) {
            console.error("[Cart] Voucher error:", err);
            setVoucherError(err.message || "Mã giảm giá không hợp lệ");
            setAppliedVoucher(null);
        } finally {
            setVoucherLoading(false);
        }
    };

    const handleRemoveVoucher = () => {
        setAppliedVoucher(null);
        setVoucherCode("");
        setVoucherError(null);
        console.log("[Cart] Voucher removed");
    };

    const handleVoucherInputKeyDown = (e) => {
        if (e.key === "Enter") {
            handleApplyVoucher();
        }
    };

    // ===== Calculate total =====
    const resolvedSubtotal = useMemo(() => {
        if (!itemPrices.length || !cartItems?.length) return cartSubtotal;
        return cartItems.reduce((sum, item, idx) => {
            const ip = itemPrices[idx];
            return sum + (ip?.resolvedPrice ?? item.price) * item.quantity;
        }, 0);
    }, [itemPrices, cartItems, cartSubtotal]);

    const totalSavings = useMemo(() => {
        if (!itemPrices.length || !cartItems?.length) return 0;
        return cartItems.reduce((sum, item, idx) => {
            const ip = itemPrices[idx];
            if (!ip || ip.resolvedPrice >= ip.originalPrice) return sum;
            return sum + (ip.originalPrice - ip.resolvedPrice) * item.quantity;
        }, 0);
    }, [itemPrices, cartItems]);

    const discountAmount = appliedVoucher?.discount ?? 0;
    const finalTotal = Math.max(0, resolvedSubtotal - discountAmount);

    const handleCheckout = () => {
        if (!cartItems?.length) {
            return;
        }

        navigate("/thanh-toan");
        onClose();
    };

    return (
        <div className="cart-overlay" onClick={onClose}>
            <div className="cart-sidebar" onClick={(event) => event.stopPropagation()}>
                <div className="cart-header">
                    <h2>Giỏ hàng của bạn</h2>
                    <AiOutlineClose className="close-icon" onClick={onClose} />
                </div>

                <div className="cart-content">
                    {cartItems?.length === 0 ? (
                        <div className="empty-cart">
                            <p>Chưa có sản phẩm trong giỏ hàng.</p>
                            <button className="btn-back" onClick={onClose}>
                                Tiếp tục mua sắm
                            </button>
                        </div>
                    ) : (
                        <div className="cart-list">
                            {cartItems.map((item, index) => {
                                const ip = itemPrices[index];
                                const resolvedPrice = ip?.resolvedPrice ?? item.price;
                                const originalPrice = ip?.originalPrice ?? item.price;
                                const hasDiscount = resolvedPrice < originalPrice;
                                return (
                                <article key={item.cartKey || `${item.productId || "item"}-${index}`} className="cart-item">
                                    <img
                                        src={item.image || PRODUCT_PLACEHOLDER_IMAGE}
                                        alt={item.name}
                                        className="cart-item-image"
                                    />
                                    <div className="cart-item-info">
                                        <h3>{item.name}</h3>
                                        <p>{item.size} / {item.color}</p>
                                        <div className="item-price-block">
                                            {hasDiscount && (
                                                <span className="item-price-original">{formatVND(originalPrice * item.quantity)}</span>
                                            )}
                                            <strong>{formatVND(resolvedPrice * item.quantity)}</strong>
                                        </div>
                                        <div className="cart-item-actions">
                                            <div className="cart-qty">
                                                <button
                                                    type="button"
                                                    onClick={() => updateCartItemQuantity(item.cartKey, item.quantity - 1)}
                                                >
                                                    -
                                                </button>
                                                <span>{item.quantity}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => updateCartItemQuantity(item.cartKey, item.quantity + 1)}
                                                >
                                                    +
                                                </button>
                                            </div>

                                            <button
                                                type="button"
                                                className="remove-item-btn"
                                                onClick={() => removeFromCart(item.cartKey)}
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    </div>
                                </article>
                                );
                            })}
                        </div>
                    )}
                </div>

                {cartItems?.length > 0 ? (
                    <div className="cart-footer">
                        {promotionGifts.length > 0 && (
                            <div className="voucher-section" style={{ marginBottom: 12 }}>
                                <strong>Quà tặng kèm:</strong>
                                <ul style={{ margin: '6px 0 0 18px' }}>
                                    {promotionGifts.map((gift, index) => (
                                        <li key={`${gift.giftProductId || 'gift'}-${index}`}>
                                            Sản phẩm ID {gift.giftProductId} x{gift.quantity}
                                            {gift.estimatedDiscount ? ` (ước tính giảm ${formatVND(Math.round(gift.estimatedDiscount))})` : ''}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* ===== Voucher Section ===== */}
                        <div className="voucher-section">
                            {!appliedVoucher ? (
                                <div className="voucher-input-group">
                                    <input
                                        type="text"
                                        placeholder="Nhập mã giảm giá"
                                        value={voucherCode}
                                        onChange={(e) => {
                                            setVoucherCode(e.target.value);
                                            setVoucherError(null);
                                        }}
                                        onKeyDown={handleVoucherInputKeyDown}
                                        disabled={voucherLoading}
                                        className="voucher-input"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleApplyVoucher}
                                        disabled={voucherLoading || !voucherCode.trim()}
                                        className="btn-apply-voucher"
                                    >
                                        {voucherLoading ? "Đang xử lý..." : "Áp dụng"}
                                    </button>
                                </div>
                            ) : (
                                <div className="voucher-applied">
                                    <div className="voucher-info">
                                        <MdCheckCircle className="voucher-icon" />
                                        <div className="voucher-details">
                                            <span className="voucher-code">{appliedVoucher.code}</span>
                                            <span className="voucher-discount">
                                                Giảm {formatVND(discountAmount)}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleRemoveVoucher}
                                        className="btn-remove-voucher"
                                    >
                                        Xóa
                                    </button>
                                </div>
                            )}
                            {voucherError && (
                                <div className="voucher-error">
                                    {voucherError}
                                </div>
                            )}
                        </div>

                        {/* ===== Cart Summary ===== */}
                        <div className="cart-summary-row">
                            <span>Tạm tính</span>
                            <strong>{formatVND(resolvedSubtotal)}</strong>
                        </div>

                        {appliedVoucher && (
                            <>
                                <div className="cart-summary-row discount-row">
                                    <span>Giảm giá ({appliedVoucher.code})</span>
                                    <strong className="discount-amount">-{formatVND(discountAmount)}</strong>
                                </div>
                                <div className="cart-summary-row total-row">
                                    <span>Tổng cộng</span>
                                    <strong className="final-total">{formatVND(finalTotal)}</strong>
                                </div>
                            </>
                        )}

                        {totalSavings > 0 && (
                            <div className="savings-row">
                                Bạn đã tiết kiệm {formatVND(totalSavings)}
                            </div>
                        )}

                        <div className="cart-footer-actions">
                            <button type="button" className="btn-secondary" onClick={clearCart}>
                                Xóa tất cả
                            </button>
                            <button type="button" className="btn-primary" onClick={handleCheckout}>
                                Thanh toán
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default memo(Cart);
