import { useContext, useRef, useState } from "react";
import { CartContext } from "../context/CartContext.jsx";
import { AuthContext } from "../context/AuthContext.jsx";
import { cartService } from "../services/cartService.js";
import { buildCreateOrderPayload, orderService, ORDER_PAYMENT_METHODS } from "../services/orderService.js";
import { paymentService } from "../services/paymentService.js";
import { voucherService } from "../services/voucherService.js";

/**
 * Gom toàn bộ state + logic đặt hàng vào hook này,
 * tách khỏi CheckoutPage để component chỉ lo render.
 */
export function useCheckoutOrder({ checkoutItems, subtotal, total, onFreezeItems, buyNow = false }) {
    const { cartId, syncCart, cartItems } = useContext(CartContext);
    const { user } = useContext(AuthContext);

    const [orderData, setOrderData] = useState(null);
    const [orderError, setOrderError] = useState("");
    const [checkoutStep, setCheckoutStep] = useState("form");
    const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponError, setCouponError] = useState("");
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

    const couponDiscount = appliedCoupon?.discount ?? 0;

    // Buy-now buộc phải tạm clear giỏ server (BE đặt hàng theo cart_id, mỗi user 1 giỏ).
    // Lưu lại giỏ gốc để khôi phục sau khi đặt xong → giỏ hàng của user không bị mất.
    const cartSnapshotRef = useRef([]);

    const restoreBuyNowCart = async () => {
        try {
            await cartService.clear().catch(() => { });
            if (cartSnapshotRef.current.length > 0) {
                await cartService.mergeGuestCart(cartSnapshotRef.current);
            }
        } catch (e) {
            console.warn("[Checkout] restore buy-now cart failed:", e?.message);
        }
    };

    // --- Sync + clear cart sau khi đặt hàng xong ---
    const refreshCartAfterOrder = async () => {
        onFreezeItems(checkoutItems); // ← freeze trước khi clear cart
        if (buyNow) {
            await restoreBuyNowCart(); // trả lại giỏ hàng gốc đã tạm xoá
        } else {
            try { window.localStorage.removeItem("guest_cart"); } catch { }
        }
        try { await syncCart(); } catch { }
    };

    // --- Áp mã giảm giá ---
    const handleApplyCoupon = async (couponCode) => {
        const code = (couponCode || "").trim().toUpperCase();
        setCouponError("");
        setAppliedCoupon(null);

        if (!code) return;
        if (subtotal <= 0) {
            setCouponError("Đơn hàng chưa có sản phẩm để áp mã giảm giá.");
            return;
        }

        setIsApplyingCoupon(true);
        try {
            const voucher = await voucherService.apply({ code, orderTotal: subtotal, cartId });
            setAppliedCoupon(voucher);
        } catch (error) {
            setCouponError(error?.message || "Mã giảm giá không hợp lệ.");
        } finally {
            setIsApplyingCoupon(false);
        }
    };

    // --- Đặt hàng ---
    const handlePlaceOrder = async (values) => {
        setOrderError("");

        if (!checkoutItems.length) {
            setOrderError("Giỏ hàng đang trống. Vui lòng thêm sản phẩm trước khi đặt hàng.");
            return;
        }

        if (!user?.email) {
            setOrderError("Vui lòng đăng nhập trước khi đặt hàng.");
            return;
        }

        // Buy-now: chụp lại giỏ hàng gốc để khôi phục sau khi đặt (giỏ server sắp bị tạm xoá).
        if (buyNow) {
            cartSnapshotRef.current = cartItems.map((item) => ({ ...item }));
        }

        try {
            // 1. Sync cart trước để lấy resolvedCartId
            let resolvedCartId = null;
            try {
                const cleared = await cartService.clear().catch((e) => {
                    console.warn("[Checkout] cartService.clear() failed (ignored):", e?.message);
                    return null;
                });
                resolvedCartId = cleared?.id ?? null;

                const serverCart = await cartService.mergeGuestCart(checkoutItems);
                resolvedCartId = serverCart?.id ?? resolvedCartId;
            } catch (syncErr) {
                throw new Error(syncErr?.message || "Không đồng bộ được giỏ hàng với máy chủ.");
            }

            if (!resolvedCartId) throw new Error("Không tạo được giỏ hàng trên máy chủ.");

            // 2. Build payload sau khi đã có resolvedCartId
            const payload = buildCreateOrderPayload({
                customer: {
                    fullName: values.fullName,
                    phone: values.phone,
                    email: user.email,
                },
                shippingAddress: {
                    country: values.country,
                    city: values.city,
                    cityCode: values.cityCode,
                    district: values.district,
                    districtCode: values.districtCode,
                    ward: values.ward,
                    wardCode: values.wardCode,
                    addressLine: values.addressDetail,
                },
                cartId: resolvedCartId,
                paymentMethod: values.paymentMethod,
                note: values.note,
                voucherCode: appliedCoupon?.code,
            });

            // 3. Tạo đơn hàng
            const createdOrder = await orderService.createOrder(payload);
            setOrderData(createdOrder);

            const method = createdOrder.paymentMethod;

            if (method === ORDER_PAYMENT_METHODS.COD || method === ORDER_PAYMENT_METHODS.BANK_TRANSFER || method === "bank") {
                await refreshCartAfterOrder();
                setCheckoutStep(method === ORDER_PAYMENT_METHODS.COD ? "success" : "payment");
                return;
            }

            // VNPay
            let paymentUrl = createdOrder.paymentUrl;
            if (!paymentUrl && createdOrder.id) {
                const res = await paymentService.createVNPay(createdOrder.id);
                paymentUrl = res?.data?.data?.payment_url ?? res?.data?.payment_url ?? "";
            }
            if (!paymentUrl) throw new Error("Không tạo được liên kết thanh toán VNPay.");

            await refreshCartAfterOrder();
            window.location.href = paymentUrl;

        } catch (error) {
            // Đặt hàng lỗi: nếu là buy-now, giỏ server đã bị clear → khôi phục lại giỏ gốc.
            if (buyNow) {
                await restoreBuyNowCart();
                try { await syncCart(); } catch { /* lần load giỏ kế tiếp sẽ tự resync */ }
            }
            setOrderError(
                error?.message || error?.response?.data?.message || "Không tạo được đơn hàng. Vui lòng thử lại."
            );
        }
    };

    // --- Xác nhận chuyển khoản ---
    const handleConfirmTransfer = async () => {
        if (!orderData?.orderCode) return;

        setOrderError("");
        setIsConfirmingPayment(true);
        try {
            // TODO: Thay bằng polling/webhook khi backend chuẩn hóa flow xác nhận chuyển khoản.
            await Promise.resolve();
            await refreshCartAfterOrder();
            setCheckoutStep("success");
        } catch (error) {
            setOrderError(error?.response?.data?.message || "Không xác nhận được thanh toán. Vui lòng thử lại.");
        } finally {
            setIsConfirmingPayment(false);
        }
    };

    return {
        orderData,
        orderError,
        checkoutStep,
        setCheckoutStep,
        isConfirmingPayment,
        appliedCoupon,
        couponError,
        isApplyingCoupon,
        couponDiscount,
        handleApplyCoupon,
        handlePlaceOrder,
        handleConfirmTransfer,
    };
}