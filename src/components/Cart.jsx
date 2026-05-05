import { memo, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AiOutlineClose } from "react-icons/ai";
import { CartContext } from "../context/CartContext.jsx";
import { formatVND } from "../utils/format.js";
import "./style.scss";

const Cart = ({ onClose }) => {
    const navigate = useNavigate();
    const {
        cartItems,
        cartSubtotal,
        updateCartItemQuantity,
        removeFromCart,
        clearCart
    } = useContext(CartContext);

    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, []);

    const handleCheckout = () => {
        if (!cartItems.length) {
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
                    {cartItems.length === 0 ? (
                        <div className="empty-cart">
                            <p>Chưa có sản phẩm trong giỏ hàng.</p>
                            <button className="btn-back" onClick={onClose}>
                                Tiếp tục mua sắm
                            </button>
                        </div>
                    ) : (
                        <div className="cart-list">
                            {cartItems.map((item) => (
                                <article key={item.cartKey} className="cart-item">
                                    <img src={item.image} alt={item.name} className="cart-item-image" />
                                    <div className="cart-item-info">
                                        <h3>{item.name}</h3>
                                        <p>{item.size} / {item.color}</p>
                                        <strong>{formatVND(item.price * item.quantity)}</strong>
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
                            ))}
                        </div>
                    )}
                </div>

                {cartItems.length > 0 ? (
                    <div className="cart-footer">
                        <div className="cart-summary-row">
                            <span>Tạm tính</span>
                            <strong>{formatVND(cartSubtotal)}</strong>
                        </div>
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
