import { useContext, useRef, useState, useEffect } from "react";
import { CartContext } from "../context/CartContext.jsx";
import { AuthContext } from "../context/AuthContext.jsx";
import { cartService } from "../services/cartService.js";
import { buildCreateOrderPayload, orderService, ORDER_PAYMENT_METHODS } from "../services/orderService.js";
import { paymentService } from "../services/paymentService.js";
import { voucherService } from "../services/voucherService.js";
import { promotionService } from "../services/promotionService.js";

// Phí ship mặc định hiển thị TRƯỚC khi BE xác nhận.
// Sau khi đặt hàng, dùng orderData.shippingFee từ BE thay thế.
export const SHIPPING_FEE_DISPLAY = 30000;

/**
 * Gom toàn bộ state + logic đặt hàng vào hook này,
 * tách khỏi CheckoutPage để component chỉ lo render.
 */
export function useCheckoutOrder({ checkoutItems, subtotal, onFreezeItems, buyNow = false }) {
    const { cartId, syncCart, cartItems } = useContext(CartContext);
    const { user } = useContext(AuthContext);

    const [orderData, setOrderData] = useState(null);
    const [orderError, setOrderError] = useState("");
    const [checkoutStep, setCheckoutStep] = useState("form");
    const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponError, setCouponError] = useState("");
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
    const [appliedPromotions, setAppliedPromotions] = useState([]);
    const [promotionDiscount, setPromotionDiscount] = useState(0);
    const [promotionGifts, setPromotionGifts] = useState([]);
    const [isLoadingPromotions, setIsLoadingPromotions] = useState(false);

    const couponDiscount = appliedCoupon?.discount ?? 0;
    const promoDiscount = promotionDiscount ?? 0;

    // FIX: shippingFee lấy từ BE sau khi đặt hàng xong.
    // Trước khi đặt hiển thị giá mặc định SHIPPING_FEE_DISPLAY.
    const shippingFee = orderData?.shippingFee ?? SHIPPING_FEE_DISPLAY;

    // FIX: total tính đúng — trừ cả promoDiscount lẫn couponDiscount.
    // Sau khi có orderData → dùng orderData.totalAmount (giá BE xác nhận, chính xác tuyệt đối).
    const total = orderData?.totalAmount
        ?? Math.max(0, subtotal + shippingFee - promoDiscount - couponDiscount);

    // Buy-now buộc phải tạm clear giỏ server (BE đặt hàng theo cart_id, mỗi user 1 giỏ).
    // Lưu lại giỏ gốc để khôi phục sau khi đặt xong → giỏ hàng của user không bị mất.
    const cartSnapshotRef = useRef([]);

    const restoreBuyNowCart = async () => {
        try {
            await cartService.clear().catch(() => { });
            if (cartSnapshotRef.current.length > 0) {
                for (const item of cartSnapshotRef.current) {
                    await cartService.add(item).catch(() => { });
                }
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

    // --- Áp promotional rules (percent/amount/bogo) client-side ---
    const computePromotions = async (items, subtotalValue) => {
        setIsLoadingPromotions(true);
        try {
            const res = await promotionService.applyToCart(items, subtotalValue);
            setPromotionDiscount(res.discount ?? 0);
            setAppliedPromotions(res.applied ?? []);
            setPromotionGifts(res.giftItems ?? []);
        } catch (e) {
            setPromotionDiscount(0);
            setAppliedPromotions([]);
            setPromotionGifts([]);
        } finally {
            setIsLoadingPromotions(false);
        }
    };

    // Auto compute promotions when cart items or subtotal change
    useEffect(() => {
        let mounted = true;
        (async () => {
            if (!mounted) return;
            try {
                await computePromotions(checkoutItems, subtotal);
            } catch (e) {
                // ignore
            }
        })();
        return () => { mounted = false; };
    }, [checkoutItems, subtotal]);

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

                // Add tuần tự từng item vào server cart
                let lastCart = null;
                for (const item of checkoutItems) {
                    lastCart = await cartService.add(item);
                }
                if (lastCart) {
                    resolvedCartId = lastCart.id ?? resolvedCartId;
                }

                if (!resolvedCartId) throw new Error("Không tạo được giỏ hàng trên máy chủ.");
                console.log("🛒 Cart sau khi add items:", JSON.stringify(lastCart, null, 2));
            } catch (syncErr) {
                throw new Error(syncErr?.message || "Không đồng bộ được giỏ hàng với máy chủ.");
            }

            if (!resolvedCartId) throw new Error("Không tạo được giỏ hàng trên máy chủ.");

            // 2. Build payload
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
                promotion_ids: appliedPromotions.map(p => p.id),
            });

            // 3. Tạo đơn hàng
            const createdOrder = await orderService.createOrder(payload);

            // FIX: setOrderData TRƯỚC mọi action tiếp theo
            // → total, shippingFee từ đây sẽ dùng giá BE xác nhận (chính xác)
            setOrderData(createdOrder);

            const method = createdOrder.paymentMethod;

            if (method === ORDER_PAYMENT_METHODS.COD || method === ORDER_PAYMENT_METHODS.BANK_TRANSFER || method === "bank") {
                await refreshCartAfterOrder();
                setCheckoutStep(method === ORDER_PAYMENT_METHODS.COD ? "success" : "payment");
                return;
            }

            // VNPay: dùng paymentUrl từ createdOrder (BE đã tính đúng total)
            let paymentUrl = createdOrder.paymentUrl;
            if (!paymentUrl && createdOrder.id) {
                const res = await paymentService.createVNPay(createdOrder.id);
                paymentUrl = res?.data?.data?.payment_url ?? res?.data?.payment_url ?? "";
            }
            if (!paymentUrl) throw new Error("Không tạo được liên kết thanh toán VNPay.");

            await refreshCartAfterOrder();
            window.location.href = paymentUrl;

        } catch (error) {
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
        promoDiscount,
        shippingFee,   // ← export để CheckoutPage dùng thay SHIPPING_FEE hardcode
        total,         // ← export tổng đã tính đúng
        appliedPromotions,
        promotionGifts,
        isLoadingPromotions,
        handleApplyCoupon,
        handlePlaceOrder,
        handleConfirmTransfer,
    };
}