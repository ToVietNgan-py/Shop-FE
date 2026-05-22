

import { useContext, useEffect, useMemo, useState } from "react";
import { FaCreditCard, FaMoneyBillWave, FaUniversity } from "react-icons/fa";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, useSearchParams } from "react-router-dom";
import { CartContext } from "../../../context/CartContext.jsx";
import { productService } from "../../../services/productService.js";
import { ORDER_PAYMENT_METHODS } from "../../../services/orderService.js";
import { formatVND, buildVietQrUrl } from "../../../utils/format.js";
import { checkoutSchema } from "../../../validations/checkoutSchema.js";
import PageLoading from "../../../components/PageLoading/PageLoading.jsx";
import ErrorState from "../../../components/ErrorState/ErrorState.jsx";
import { useRegion } from "../../../hooks/useRegion.js";
import { useCheckoutOrder } from "../../../hooks/useCheckoutOrder.js";
import { PaymentStep } from "../../../components/PaymentStep.jsx";
import { SuccessStep } from "../../../components/SuccessStep.jsx";
import "./style.scss";
const SHIPPING_FEE = 35000;
// TODO: Lấy phí ship và giảm giá từ API pricing/promotion khi backend hoàn thiện.

const DEFAULT_BANK_INFO = {
    bankName: "Vietcombank",
    bin: "970436", // mã BIN Napas của Vietcombank, dùng để dựng VietQR
    accountName: "CONG TY TNHH DEAR ROSE",
    accountNumber: "0123456789",
};
// TODO: Bỏ DEFAULT_BANK_INFO khi BE trả về payment_info.bank_info.

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Trả label loading cho select địa chỉ */
function regionPlaceholder(isLoading, disabled, labels) {
    if (disabled) return labels.disabled;
    if (isLoading) return "Đang tải...";
    return labels.default;
}

// ─── Component chính ────────────────────────────────────────────────────────

function CheckoutPage() {
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { cartId, cartItems } = useContext(CartContext);


    const buyNowItems = location.state?.items ?? null;

    // --- Fallback product khi không có items ---
    const productId = Number(searchParams.get("productId"));
    const [fallbackItem, setFallbackItem] = useState(null);
    const [isLoadingFallback, setIsLoadingFallback] = useState(true);

    useEffect(() => {
        let isMounted = true;
        async function loadFallback() {
            setIsLoadingFallback(true);
            try {
                const detail = productId ? await productService.detail(productId) : null;
                const res = detail ? null : await productService.list({ limit: 1, page: 1 });
                const list = detail ? [detail] : (res?.items ?? res?.data ?? []);
                const product = list[0];
                if (isMounted && product) {
                    setFallbackItem({ id: product.id, name: product.name, image: product.image, price: product.price, color: "Cream", size: "S", quantity: 1 });
                }
            } catch (e) {
                console.warn("[Checkout] loadFallback failed:", e?.message);
            } finally {
                if (isMounted) setIsLoadingFallback(false);
            }
        }
        loadFallback();
        return () => { isMounted = false; };
    }, [productId]);
    const [frozenItems, setFrozenItems] = useState(null);
    // Buy-now: chỉ thanh toán riêng sản phẩm này, không đụng vào giỏ hàng hiện có.
    const isBuyNow = Boolean(location.state?.buyNow);
    // --- Danh sách sản phẩm checkout ---
    const checkoutItems = useMemo(() => {
        // Case 1:
        // Đã đóng băng dữ liệu checkout (sau refresh / VNPay / etc)
        if (frozenItems?.length > 0) {
            return frozenItems;
        }

        // Case 2:
        // Mua ngay từ QuickActions hoặc ProductDetail
        // navigate(..., { state: { checkoutItems: [...] } })
        const stateItems = location.state?.checkoutItems;

        if (Array.isArray(stateItems) && stateItems.length > 0) {
            return stateItems;
        }

        // Case 3:
        // Fallback single item
        if (location.state?.checkoutItem) {
            return [location.state.checkoutItem];
        }

        // Case 4:
        // Thanh toán từ giỏ hàng
        if (Array.isArray(cartItems) && cartItems.length > 0) {
            return cartItems;
        }

        // Case 5:
        // fallback cuối cùng
        return fallbackItem ? [fallbackItem] : [];
    }, [
        frozenItems,
        location.state,
        cartItems,
        fallbackItem,
    ]);
    // --- Form ---
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(checkoutSchema),
        defaultValues: {
            country: "Vietnam",
            fullName: "",
            addressDetail: "",
            city: "",
            cityCode: "",
            district: "",
            districtCode: "",
            ward: "",
            wardCode: "",
            phone: "",
            note: "",
            voucher_code: "",
            paymentMethod: ORDER_PAYMENT_METHODS.COD,
        },
    });

    // Dùng watch() một lần, lấy tất cả giá trị cần — tránh watch() lặp nhiều lần
    const { cityCode, districtCode, voucher_code: couponCode, paymentMethod, phone } = watch();

    // --- Region hook (thay 3 useEffect lặp code) ---
    const {
        provinces, districts, wards,
        isLoadingProvinces, isLoadingDistricts, isLoadingWards,
        regionError, retryRegions,
    } = useRegion({ cityCode, districtCode });

    // --- Tính tiền ---
    const subtotal = useMemo(
        () => checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
        [checkoutItems]
    );
    const {
        orderData, orderError, checkoutStep, setCheckoutStep,
        isConfirmingPayment, appliedCoupon, couponError, isApplyingCoupon, couponDiscount,
        promoDiscount, appliedPromotions, promotionGifts, isLoadingPromotions,
        handleApplyCoupon, handlePlaceOrder, handleConfirmTransfer,
    } = useCheckoutOrder({ checkoutItems, subtotal, cartId, total: subtotal + SHIPPING_FEE - 0, onFreezeItems: setFrozenItems, buyNow: isBuyNow });

    const total = subtotal + SHIPPING_FEE - couponDiscount;

    // --- Payment info cho bước chuyển khoản ---
    const paymentInfo = useMemo(() => {
        const beInfo = orderData?.paymentInfo;
        const beBank = beInfo?.bankInfo;
        const hasBeBank = beBank && (beBank.bankName || beBank.accountNumber);
        const bankInfo = hasBeBank ? beBank : DEFAULT_BANK_INFO;
        const transferContent = beInfo?.transferContent || (orderData?.orderCode ? `DEARROSE ${orderData.orderCode}` : "");
        const amount = beInfo?.amount || orderData?.totalAmount || total;
        return {
            // BE chưa trả ảnh QR → tự dựng VietQR từ thông tin ngân hàng để khách quét chuyển khoản.
            qrCodeUrl: beInfo?.qrCodeUrl || buildVietQrUrl(bankInfo, amount, transferContent),
            transferContent,
            amount,
            bankInfo,
        };
    }, [orderData, total]);

    // --- Handlers địa chỉ ---
    const handleProvinceChange = ({ target }) => {
        const found = provinces.find((p) => String(p.code) === target.value);
        setValue("city", found?.name ?? "", { shouldValidate: true });
        setValue("cityCode", target.value, { shouldValidate: true });
        ["district", "districtCode", "ward", "wardCode"].forEach((f) =>
            setValue(f, "", { shouldValidate: true })
        );
    };

    const handleDistrictChange = ({ target }) => {
        const found = districts.find((d) => String(d.code) === target.value);
        setValue("district", found?.name ?? "", { shouldValidate: true });
        setValue("districtCode", target.value, { shouldValidate: true });
        setValue("ward", "", { shouldValidate: true });
        setValue("wardCode", "", { shouldValidate: true });
    };

    const handleWardChange = ({ target }) => {
        const found = wards.find((w) => String(w.code) === target.value);
        setValue("ward", found?.name ?? "", { shouldValidate: true });
        setValue("wardCode", target.value, { shouldValidate: true });
    };

    const onSubmit = (values) => handlePlaceOrder(values);

    // --- Loading guard ---
    if (isLoadingFallback && checkoutItems.length === 0) {
        return <PageLoading title="Đang tải thanh toán" description="Đang lấy dữ liệu sản phẩm mặc định từ API." />;
    }

    return (
        <section className="checkout-page">
            <form className="checkout-layout" onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="checkout-main">

                    {/* ── Step: Form thông tin ── */}
                    {checkoutStep === "form" && (
                        <div className="checkout-columns">
                            {/* Cột trái: Thông tin liên hệ */}
                            <div className="checkout-column">
                                <div className="section-heading section-heading-inline">
                                    <h1>Thông tin mua hàng</h1>
                                    <p>Nhập đầy đủ thông tin liên hệ để tạo đơn hàng.</p>
                                </div>

                                {isLoadingProvinces && provinces.length === 0 && (
                                    <PageLoading
                                        title="Đang tải địa chỉ giao hàng"
                                        description="Đang lấy tỉnh/thành, quận/huyện và phường/xã từ VN Region API."
                                        compact
                                    />
                                )}

                                {regionError && (
                                    <ErrorState
                                        title="Không tải được dữ liệu địa chỉ"
                                        description={regionError}
                                        actionLabel="Thử lại"
                                        onRetry={retryRegions}
                                    />
                                )}

                                <div className="field-list">
                                    <select {...register("country")} disabled={isSubmitting}>
                                        <option value="Vietnam">Việt Nam</option>
                                    </select>
                                    <FieldError error={errors.country} />

                                    <input placeholder="Họ và tên" aria-invalid={!!errors.fullName} {...register("fullName")} />
                                    <FieldError error={errors.fullName} />

                                    <input placeholder="Số điện thoại" aria-invalid={!!errors.phone} {...register("phone")} />
                                    <FieldError error={errors.phone} />

                                    <input placeholder="Số nhà, tên đường, tòa nhà ..." aria-invalid={!!errors.addressDetail} {...register("addressDetail")} />
                                    <FieldError error={errors.addressDetail} />

                                    <textarea rows="4" placeholder="Ghi chú đơn hàng" aria-invalid={!!errors.note} {...register("note")} />
                                    <FieldError error={errors.note} />
                                </div>
                            </div>

                            {/* Cột phải: Địa chỉ giao hàng + Thanh toán */}
                            <div className="checkout-column">
                                <div className="section-heading section-heading-inline">
                                    <h2>Vận chuyển</h2>
                                    <div className="shipping-alert">Vui lòng nhập thông tin giao hàng.</div>
                                </div>

                                <div className="field-list">
                                    <div className="grid-two">
                                        <select
                                            value={cityCode}
                                            onChange={handleProvinceChange}
                                            disabled={isLoadingProvinces || isSubmitting}
                                            aria-invalid={!!errors.cityCode}
                                        >
                                            <option value="">{regionPlaceholder(isLoadingProvinces, false, { default: "Chọn Tỉnh/Thành phố", disabled: "Chọn Tỉnh/Thành phố" })}</option>
                                            {provinces.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
                                        </select>
                                        <FieldError error={errors.cityCode} />

                                        <select
                                            value={districtCode}
                                            onChange={handleDistrictChange}
                                            disabled={!cityCode || isLoadingDistricts || isSubmitting}
                                            aria-invalid={!!errors.districtCode}
                                        >
                                            <option value="">{regionPlaceholder(isLoadingDistricts, !cityCode, { default: "Chọn Quận/Huyện", disabled: "Chọn Tỉnh/Thành trước" })}</option>
                                            {districts.map((d) => <option key={d.code} value={d.code}>{d.name}</option>)}
                                        </select>
                                        <FieldError error={errors.districtCode} />
                                    </div>

                                    <div className="grid-two">
                                        <select
                                            value={watch("wardCode")}
                                            onChange={handleWardChange}
                                            disabled={!districtCode || isLoadingWards}
                                            aria-invalid={!!errors.wardCode}
                                        >
                                            <option value="">{regionPlaceholder(isLoadingWards, !districtCode, { default: "Chọn Phường/Xã", disabled: "Chọn Quận/Huyện trước" })}</option>
                                            {wards.map((w) => <option key={w.code} value={w.code}>{w.name}</option>)}
                                        </select>
                                        <FieldError error={errors.wardCode} />
                                    </div>

                                    {regionError && <p className="field-message error">{regionError}</p>}
                                </div>

                                {/* Phương thức thanh toán */}
                                <div className="checkout-block checkout-block-compact">
                                    <h2>Thanh toán</h2>
                                    <p className="helper-text">Chọn hình thức thanh toán đơn hàng.</p>
                                    {PAYMENT_OPTIONS.map(({ value, label, Icon, iconClass }) => (
                                        <label key={value} className={`payment-card ${paymentMethod === value ? "selected" : ""}`}>
                                            <input
                                                type="radio"
                                                value={value}
                                                checked={paymentMethod === value}
                                                onChange={(e) => setValue("paymentMethod", e.target.value, { shouldValidate: true })}
                                            />
                                            <span className={`payment-icon ${iconClass}`} aria-hidden="true"><Icon /></span>
                                            <div><strong>{label}</strong></div>
                                        </label>
                                    ))}
                                </div>

                                <div className="checkout-block checkout-block-compact">
                                    <h2>Phương thức vận chuyển</h2>
                                    <label className="option-card selected">
                                        <input type="radio" checked readOnly />
                                        <span>Giao hàng tiêu chuẩn</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Step: Chuyển khoản ── */}
                    {checkoutStep === "payment" && (
                        <PaymentStep
                            paymentInfo={paymentInfo}
                            orderData={orderData}
                            total={total}
                            isConfirmingPayment={isConfirmingPayment}
                            onConfirm={handleConfirmTransfer}
                            onBack={() => setCheckoutStep("form")}
                        />
                    )}

                    {/* ── Step: Thành công ── */}
                    {checkoutStep === "success" && (
                        <SuccessStep orderData={orderData} phone={phone} />
                    )}

                    {orderError && <p className="field-message error checkout-error-banner">{orderError}</p>}
                </div>

                {/* ── Sidebar tóm tắt đơn hàng ── */}
                <aside className="checkout-summary">
                    <div className="summary-header">
                        <h2>Đơn hàng</h2>
                    </div>

                    <div className="summary-product-list">
                        {checkoutItems.map((item, index) => (
                            <div
                                key={item.cartKey ?? `${item.id ?? "item"}-${item.color ?? ""}-${item.size ?? ""}-${index}`}
                                className="summary-product"
                            >
                                <div className="product-thumb">
                                    {item.image
                                        ? <img
                                            src={
                                                item.img ||
                                                item.image ||
                                                "/placeholder.png"
                                            }
                                            alt={item.name}
                                        />
                                        : <div className="thumb-placeholder" />
                                    }
                                    <span className="quantity-badge">{item.quantity}</span>
                                </div>
                                <div className="product-meta">
                                    <h3>{item.name}</h3>
                                    <p>{item.size} / {item.color}</p>
                                </div>
                                <strong>{formatVND(item.price * item.quantity)}</strong>
                            </div>
                        ))}
                    </div>

                    <div className="voucher-box">
                        <div className="voucher-row">
                            <input
                                type="text"
                                placeholder="Nhập mã giảm giá"
                                value={couponCode || ""}
                                onChange={(e) => setValue("voucher_code", e.target.value, { shouldValidate: true })}
                            />
                            <button type="button" onClick={() => handleApplyCoupon(couponCode)} disabled={isApplyingCoupon}>
                                {isApplyingCoupon ? "Đang kiểm tra..." : "Áp dụng"}
                            </button>
                        </div>
                        <FieldError error={errors.voucher_code} />
                        {appliedCoupon && <p className="coupon-note">Đã áp dụng mã {appliedCoupon.code}.</p>}
                        {couponError && <p className="coupon-note">{couponError}</p>}
                        {appliedPromotions && appliedPromotions.length > 0 && (
                            <div style={{ marginTop: 8 }}>
                                <strong>Khuyến mãi áp dụng:</strong>
                                <ul style={{ margin: '6px 0 0 18px' }}>
                                    {appliedPromotions.map((p) => (<li key={p.id}>{p.name} {p.amount ? `(- ${formatVND(Math.round(p.amount))})` : ''}</li>))}
                                </ul>
                            </div>
                        )}
                        {promotionGifts && promotionGifts.length > 0 && (
                            <div style={{ marginTop: 8 }}>
                                <strong>Quà tặng:</strong>
                                <ul style={{ margin: '6px 0 0 18px' }}>
                                    {promotionGifts.map((g, idx) => (<li key={idx}>Sản phẩm ID {g.giftProductId} x{g.quantity} (Ước tính giảm {formatVND(Math.round(g.estimatedDiscount || 0))})</li>))}
                                </ul>
                            </div>
                        )}
                    </div>

                    <div className="price-list">
                        <PriceRow label="Tạm tính" value={formatVND(subtotal)} />
                        <PriceRow label="Phí vận chuyển" value={formatVND(SHIPPING_FEE)} />
                        <PriceRow label="Giảm giá thành viên" value="0 đ" muted />
                        <PriceRow label="Giảm giá coupon" value={`- ${formatVND(couponDiscount)}`} muted />
                        <PriceRow label="Giảm giá khuyến mãi" value={`- ${formatVND(promoDiscount || 0)}`} muted />
                    </div>

                    <div className="summary-footer">
                        <div className="total-row">
                            <span>Tổng cộng</span>
                            <strong>{formatVND(orderData?.totalAmount || total)}</strong>
                        </div>
                        {checkoutStep === "form" && (
                            <button type="submit" className="place-order-btn" disabled={isSubmitting}>
                                {isSubmitting ? "Đang tạo đơn..." : "Đặt hàng"}
                            </button>
                        )}
                    </div>
                </aside>
            </form>
        </section>
    );
}

export default CheckoutPage;

// ─── Constants ───────────────────────────────────────────────────────────────

const PAYMENT_OPTIONS = [
    { value: ORDER_PAYMENT_METHODS.COD, label: "(COD) Thanh toán khi nhận hàng", Icon: FaMoneyBillWave, iconClass: "payment-icon-cod" },
    { value: ORDER_PAYMENT_METHODS.BANK_TRANSFER, label: "Chuyển khoản ngân hàng", Icon: FaUniversity, iconClass: "payment-icon-bank" },
    { value: ORDER_PAYMENT_METHODS.VNPAY, label: "Thanh toán VNPay", Icon: FaCreditCard, iconClass: "payment-icon-vnpay" },
];

// ─── Micro-components dùng trong trang ───────────────────────────────────────

function FieldError({ error }) {
    if (!error) return null;
    return <p className="field-message error">{error.message}</p>;
}

function PriceRow({ label, value, muted }) {
    return (
        <div className={`price-row${muted ? " muted" : ""}`}>
            <span>{label}</span>
            <strong>{value}</strong>
        </div>
    );
}
