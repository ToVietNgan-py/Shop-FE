import { useContext, useEffect, useMemo, useState } from "react";
import { FaCheckCircle, FaCreditCard, FaMoneyBillWave, FaUniversity } from "react-icons/fa";
import { MdContentCopy } from "react-icons/md";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { regionApi } from "../../../apis/region.js";
import { CartContext } from "../../../context/CartContext.jsx";
import { AuthContext } from "../../../context/AuthContext.jsx";
import { buildCreateOrderPayload, orderService, ORDER_PAYMENT_METHODS } from "../../../services/orderService.js";
import { paymentService } from "../../../services/paymentService.js";
import { productService } from "../../../services/productService.js";
import { voucherService } from "../../../services/voucherService.js";
import { formatVND } from "../../../utils/format.js";
import PageLoading from "../../../components/PageLoading/PageLoading.jsx";
import ErrorState from "../../../components/ErrorState/ErrorState.jsx";
import "./style.scss";

const SHIPPING_FEE = 35000;
const FE_ONLY_COD_BANK = true;
// TODO: Khi backend hoan thien, lay phi ship va giam gia tu API pricing/promotion
// thay vi hardcode o frontend de tranh lech tong tien voi backend.

const toBackendPaymentMethod = (method) => {
    if (method === ORDER_PAYMENT_METHODS.BANK_TRANSFER) {
        return "bank";
    }

    if (method === ORDER_PAYMENT_METHODS.VNPAY) {
        return "vnpay";
    }

    return "cod";
};



function CheckoutPage() {
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { cartId, cartItems, syncCart, clearCart } = useContext(CartContext);
    const { user } = useContext(AuthContext);
    const productId = Number(searchParams.get("productId"));
    const [fallbackItem, setFallbackItem] = useState(null);
    const [isLoadingFallback, setIsLoadingFallback] = useState(true);
    // Fallback vẫn giữ để trang checkout không bị trống nếu API chưa trả được sản phẩm.

    useEffect(() => {
        let isMounted = true;

        async function loadFallbackProduct() {
            setIsLoadingFallback(true);

            const detail = productId ? await productService.detail(productId) : null;
            const fallbackList = detail ? [detail] : (await productService.list({ limit: 1, page: 1 })).items;
            const product = fallbackList[0];

            if (isMounted && product) {
                setFallbackItem({
                    id: product.id,
                    name: product.name,
                    image: product.image,
                    price: product.price,
                    color: "Cream",
                    size: "S",
                    quantity: 1
                });
            }

            if (isMounted) {
                setIsLoadingFallback(false);
            }
        }

        loadFallbackProduct();

        return () => {
            isMounted = false;
        };
    }, [productId]);

    const checkoutItems = useMemo(() => {
        const stateItems = location.state?.checkoutItems;

        if (Array.isArray(stateItems) && stateItems.length > 0) {
            return stateItems;
        }

        if (location.state?.checkoutItem) {
            return [location.state.checkoutItem];
        }

        if (cartItems.length > 0) {
            return cartItems;
        }

        return fallbackItem ? [fallbackItem] : [];
    }, [cartItems, fallbackItem, location.state]);

    const [formData, setFormData] = useState({
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
        note: ""
    });
    const [couponCode, setCouponCode] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponError, setCouponError] = useState("");
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState(ORDER_PAYMENT_METHODS.COD);
    const [checkoutStep, setCheckoutStep] = useState("form");
    const [copiedField, setCopiedField] = useState("");
    const [orderData, setOrderData] = useState(null);
    const [orderError, setOrderError] = useState("");
    const [isCreatingOrder, setIsCreatingOrder] = useState(false);
    const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);
    const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
    const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
    const [isLoadingWards, setIsLoadingWards] = useState(false);
    const [regionError, setRegionError] = useState("");
    const [regionRetryNonce, setRegionRetryNonce] = useState(0);

    const subtotal = useMemo(
        () => checkoutItems.reduce((total, item) => total + item.price * item.quantity, 0),
        [checkoutItems]
    );
    const couponDiscount = appliedCoupon?.discount ?? 0;
    const total = subtotal + SHIPPING_FEE - couponDiscount;

    const paymentInfo = orderData?.paymentInfo ?? {
        qrCodeUrl: "",
        transferContent: "",
        amount: total,
        bankInfo: {
            bankName: "",
            accountName: "",
            accountNumber: ""
        }
    };
    // TODO: paymentInfo dang fallback rong neu backend chua tra ve du lieu thanh toan.
    // Khi chot contract backend, validate day du QR, amount, transferContent va bankInfo.

    useEffect(() => {
        let isMounted = true;

        async function loadProvinces() {
            setIsLoadingProvinces(true);
            setRegionError("");

            try {
                const data = await regionApi.getProvinces();

                if (isMounted) {
                    setProvinces(data);
                }
            } catch {
                if (isMounted) {
                    setRegionError("Khong tai duoc du lieu dia chi tu VN Region API.");
                }
            } finally {
                if (isMounted) {
                    setIsLoadingProvinces(false);
                }
            }
        }

        loadProvinces();

        return () => {
            isMounted = false;
        };
    }, [regionRetryNonce]);

    useEffect(() => {
        if (!formData.cityCode) {
            setDistricts([]);
            setWards([]);
            return;
        }

        let isMounted = true;

        async function loadDistricts() {
            setIsLoadingDistricts(true);
            setRegionError("");

            try {
                const data = await regionApi.getDistricts(formData.cityCode);

                if (isMounted) {
                    setDistricts(data);
                }
            } catch {
                if (isMounted) {
                    setRegionError("Khong tai duoc quan/huyen cho tinh thanh da chon.");
                }
            } finally {
                if (isMounted) {
                    setIsLoadingDistricts(false);
                }
            }
        }

        loadDistricts();

        return () => {
            isMounted = false;
        };
    }, [formData.cityCode, regionRetryNonce]);

    useEffect(() => {
        if (!formData.districtCode) {
            setWards([]);
            return;
        }

        let isMounted = true;

        async function loadWards() {
            setIsLoadingWards(true);
            setRegionError("");

            try {
                const data = await regionApi.getWards(formData.districtCode);

                if (isMounted) {
                    setWards(data);
                }
            } catch {
                if (isMounted) {
                    setRegionError("Khong tai duoc phuong/xa cho quan huyen da chon.");
                }
            } finally {
                if (isMounted) {
                    setIsLoadingWards(false);
                }
            }
        }

        loadWards();

        return () => {
            isMounted = false;
        };
    }, [formData.districtCode, regionRetryNonce]);

    useEffect(() => {
        if (!copiedField) {
            return undefined;
        }

        const timer = window.setTimeout(() => setCopiedField(""), 1800);
        return () => window.clearTimeout(timer);
    }, [copiedField]);

    const refreshCartAfterOrder = async () => {
        try {
            await syncCart();
        } catch {
            // OrderController::store already clears the cart on success.
            // If refresh fails, the next cart load will resync from server.
        }
    };

    const handleInputChange = ({ target }) => {
        const { name, value } = target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleProvinceChange = ({ target }) => {
        const selectedProvince = provinces.find((item) => String(item.code) === target.value);

        setFormData((prev) => ({
            ...prev,
            city: selectedProvince?.name ?? "",
            cityCode: target.value,
            district: "",
            districtCode: "",
            ward: "",
            wardCode: ""
        }));

        setDistricts([]);
        setWards([]);
    };

    const handleDistrictChange = ({ target }) => {
        const selectedDistrict = districts.find((item) => String(item.code) === target.value);

        setFormData((prev) => ({
            ...prev,
            district: selectedDistrict?.name ?? "",
            districtCode: target.value,
            ward: "",
            wardCode: ""
        }));

        setWards([]);
    };

    const handleWardChange = ({ target }) => {
        const selectedWard = wards.find((item) => String(item.code) === target.value);

        setFormData((prev) => ({
            ...prev,
            ward: selectedWard?.name ?? "",
            wardCode: target.value
        }));
    };

    const handleApplyCoupon = async () => {
        const normalizedCode = couponCode.trim().toUpperCase();

        setCouponError("");
        setAppliedCoupon(null);

        if (!normalizedCode) {
            return;
        }

        if (subtotal <= 0) {
            setCouponError("Đơn hàng chưa có sản phẩm để áp mã giảm giá.");
            return;
        }

        setIsApplyingCoupon(true);

        try {
            const voucher = await voucherService.apply({
                code: normalizedCode,
                orderTotal: subtotal,
                cartId,
            });

            setAppliedCoupon(voucher);
        } catch (error) {
            setCouponError(error?.message || "Ma giam gia khong hop le.");
        } finally {
            setIsApplyingCoupon(false);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setOrderError("");
        setIsCreatingOrder(true);

        const createLocalOrder = async () => {
            const localOrder = {
                id: null,
                orderCode: `LOCAL-${Date.now()}`,
                status: "pending",
                createdAt: new Date().toISOString(),
                paymentMethod,
                items: checkoutItems,
                subtotal,
                shippingFee: SHIPPING_FEE,
                discount: couponDiscount,
                totalAmount: subtotal + SHIPPING_FEE - couponDiscount,
                itemCount: checkoutItems.reduce((sum, item) => sum + (item.quantity || 0), 0),
                shippingAddress: {
                    fullName: formData.fullName,
                    phone: formData.phone,
                    address: formData.addressDetail,
                    city: formData.city,
                    district: formData.district,
                    ward: formData.ward,
                },
            };

            // try {
            //     const { pushLocalOrder } = await import("../../../utils/localOrders.js");
            //     pushLocalOrder(localOrder);
            // } catch {
            //     // Ignore local storage failure to keep checkout flow alive.
            // }

            setOrderData(localOrder);

            try {
                await clearCart();
            } catch {
                // Ignore cart clear errors for local fallback orders.
            }

            if (paymentMethod === ORDER_PAYMENT_METHODS.COD) {
                setCheckoutStep("success");
            } else {
                setCheckoutStep("payment");
            }
        };

        try {
            console.log('[Checkout] submit start', {
                checkoutItemsLen: checkoutItems.length,
                hasUserEmail: Boolean(user?.email),
                paymentMethod,
                cartId,
            });

            if (!checkoutItems.length) {
                throw new Error("Gio hang dang trong. Vui long them san pham truoc khi dat hang.");
            }

            if (!user?.email) {
                throw new Error("Vui long dang nhap truoc khi dat hang.");
            }


            // FE-only fallback for COD/bank while keeping VNPay real gateway flow.
            if (FE_ONLY_COD_BANK && paymentMethod !== ORDER_PAYMENT_METHODS.VNPAY) {
                await createLocalOrder();
                return;
            }

            const payload = buildCreateOrderPayload({
                customer: {
                    fullName: formData.fullName,
                    phone: formData.phone,
                    email: user.email
                },
                shippingAddress: {
                    country: formData.country,
                    city: formData.city,
                    cityCode: formData.cityCode,
                    district: formData.district,
                    districtCode: formData.districtCode,
                    ward: formData.ward,
                    wardCode: formData.wardCode,
                    addressLine: formData.addressDetail
                },
                items: checkoutItems,
                note: formData.note
            });

            // Backend currently requires cart_id from server cart.
            if (!cartId) {
                if (paymentMethod === ORDER_PAYMENT_METHODS.VNPAY) {
                    throw new Error("Giỏ hàng chưa đồng bộ với máy chủ, chưa thể tạo thanh toán VNPay.");
                }

                await createLocalOrder();
                return;
            }

            payload.cart_id = cartId;

            payload.payment_method = toBackendPaymentMethod(paymentMethod);

            // VNPay backend hiện báo cần chữ ký/querystring ngay khi tạo order.
            // Tạm thời đưa thêm các field VNPay tối thiểu để BE có thể tự tạo signature/querystring.
            // (Nếu BE yêu cầu tên field khác, mình sẽ chỉnh theo schema bạn cung cấp ở response 400/422 errors.)
            if (payload.payment_method === "vnpay") {
                payload.vnpay_return_url = payload.vnpay_return_url ?? window.location.origin + "/payment-result";
            }

            // Chỉ VNPay mới cần các field /return_url /signature.
            // Với bank-transfer, BE cần payment_method khác (không phải vnpay).



            // BE chỉ định rõ các trường bắt buộc cho /api/orders:
            // { cart_id, address_id, payment_method, voucher_code?, note? }
            // Checkout hiện đang không có address_id, nên mapping sang address_id = (server address) nếu có.
            // Nếu BE không cần address_id khi tạo theo shippingAddress payload thì bỏ qua.
            // Hiện tại dùng giá trị null để tránh undefined.
            payload.address_id = payload.address_id ?? null;


            if (appliedCoupon?.code) {
                payload.voucher_code = appliedCoupon.code;
            }

            const createdOrder = await orderService.createOrder(payload);
            setOrderData(createdOrder);
            // Đảm bảo checkout update UI đúng + dữ liệu đã lưu BE.
            // Nếu BE trả dữ liệu normalizeOrder thì createdOrder.id sẽ tồn tại.
            // Sau khi tạo đơn thành công, luôn sync cart để người dùng không bị kẹt ở history cũ.


            if (createdOrder.paymentMethod === ORDER_PAYMENT_METHODS.COD) {
                await refreshCartAfterOrder();
                setCheckoutStep("success");
                return;
            }

            if (createdOrder.paymentMethod === ORDER_PAYMENT_METHODS.BANK_TRANSFER) {
                await refreshCartAfterOrder();
                setCheckoutStep("payment");
                return;
            }

            if (createdOrder.paymentMethod !== ORDER_PAYMENT_METHODS.VNPAY) {
                throw new Error("Phuong thuc thanh toan khong hop le cho luong VNPay.");
            }

            const paymentUrl = createdOrder.paymentUrl || (await paymentService.createVNPay({
                orderId: createdOrder.id,
                orderCode: createdOrder.orderCode,
            })).paymentUrl;

            if (!paymentUrl) {
                throw new Error("Khong tao duoc lien ket thanh toan VNPay.");
            }

            await refreshCartAfterOrder();
            window.location.href = paymentUrl;
        } catch (error) {
            // If backend returns 422 (business validation) — fallback to local order flow
            const status = error?.response?.status;

            if (status === 422) {
                // Nếu BE trả 422 thì khả năng cao không tạo được order thật.
                // Không nên tạo local fake order vì sẽ không nằm trong DB => lịch sử đơn hàng trống.
                // Tạm thời remove local fallback để đảm bảo order thật.
                if (paymentMethod === ORDER_PAYMENT_METHODS.COD || paymentMethod === ORDER_PAYMENT_METHODS.BANK_TRANSFER) {
                    throw error;
                }

            }

            setOrderError(
                error?.message || error?.response?.data?.message || "Khong tao duoc don hang. Vui long thu lai."
            );
        } finally {
            setIsCreatingOrder(false);
        }
    };

    const handleConfirmTransfer = async () => {
        if (!orderData?.orderCode) {
            return;
        }

        setOrderError("");
        setIsConfirmingPayment(true);

        try {
            // TODO: Flow nay dang cho nguoi dung tu bam xac nhan da chuyen khoan.
            // Khi tich hop cong thanh toan that, co the doi sang polling, webhook hoac query payment status tu backend.
            // Backend /payment/vnpay/return đang kỳ vọng đúng bộ querystring từ VNPay.
            // Flow hiện tại chỉ là confirm nội bộ với orderCode nên dễ bị 400.
            // Tạm thời bỏ confirmReturn để tránh lỗi thanh toán.
            // Khi backend chuẩn hóa, thay lại bằng flow confirm/polling đúng signature.
            await Promise.resolve();


            await refreshCartAfterOrder();
            setCheckoutStep("success");
        } catch (error) {
            setOrderError(
                error?.response?.data?.message || "Khong xac nhan duoc thanh toan. Vui long thu lai."
            );
        } finally {
            setIsConfirmingPayment(false);
        }
    };

    const handleCopy = async (value, key) => {
        try {
            await navigator.clipboard.writeText(value);
            setCopiedField(key);
        } catch {
            setCopiedField("");
        }
    };

    const handleRetryRegions = () => {
        setRegionError("");
        setRegionRetryNonce((prev) => prev + 1);
    };

    if (isLoadingFallback && checkoutItems.length === 0) {
        return <PageLoading title="Đang tải thanh toán" description="Mình đang lấy dữ liệu sản phẩm mặc định từ API." />;
    }

    return (
        <section className="checkout-page">
            <form className="checkout-layout" onSubmit={handleSubmit}>
                <div className="checkout-main">
                    {checkoutStep === "form" ? (
                        <div className="checkout-columns">
                            <div className="checkout-column">
                                <div className="section-heading section-heading-inline">
                                    <h1>Thông tin mua hàng</h1>
                                    <p>Nhập đầy đủ thông tin liên hệ để tạo đơn hàng.</p>
                                </div>

                                {isLoadingProvinces && provinces.length === 0 ? (
                                    <PageLoading
                                        title="Đang tải địa chỉ giao hàng"
                                        description="Đang lấy tỉnh/thành, quận/huyện và phường/xã từ VN Region API."
                                        compact
                                    />
                                ) : null}

                                {regionError ? (
                                    <ErrorState
                                        title="Không tải được dữ liệu địa chỉ"
                                        description={regionError}
                                        actionLabel="Thử lại"
                                        onRetry={handleRetryRegions}
                                    />
                                ) : null}

                                <div className="field-list">
                                    <select name="country" value={formData.country} onChange={handleInputChange}>
                                        <option value="Vietnam">Việt Nam</option>
                                    </select>

                                    <input
                                        name="fullName"
                                        placeholder="Họ và tên"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                        required
                                    />

                                    <input
                                        name="phone"
                                        placeholder="Số điện thoại"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        required
                                    />

                                    <input
                                        name="addressDetail"
                                        placeholder="Số nhà, tên đường, tòa nhà ..."
                                        value={formData.addressDetail}
                                        onChange={handleInputChange}
                                        required
                                    />

                                    <textarea
                                        name="note"
                                        rows="4"
                                        placeholder="Ghi chú đơn hàng"
                                        value={formData.note}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            <div className="checkout-column">
                                <div className="section-heading section-heading-inline">
                                    <h2>Van chuyen</h2>
                                    <div className="shipping-alert">Vui lòng nhập thông tin giao hàng .</div>
                                </div>

                                <div className="field-list">
                                    <div className="grid-two">
                                        <select
                                            name="cityCode"
                                            value={formData.cityCode}
                                            onChange={handleProvinceChange}
                                            required
                                            disabled={isLoadingProvinces}
                                        >
                                            <option value="">
                                                {isLoadingProvinces ? "Dang tai..." : "Chọn Tỉnh/Thành phố"}
                                            </option>
                                            {provinces.map((province) => (
                                                <option key={province.code} value={province.code}>
                                                    {province.name}
                                                </option>
                                            ))}
                                        </select>

                                        <select
                                            name="districtCode"
                                            value={formData.districtCode}
                                            onChange={handleDistrictChange}
                                            required
                                            disabled={!formData.cityCode || isLoadingDistricts}
                                        >
                                            <option value="">
                                                {!formData.cityCode
                                                    ? "Chọn Quận/Huyện"
                                                    : isLoadingDistricts
                                                        ? "Dang tai quan/huyen..."
                                                        : "Chon Quan/Huyen"}
                                            </option>
                                            {districts.map((district) => (
                                                <option key={district.code} value={district.code}>
                                                    {district.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid-two">
                                        <select
                                            name="wardCode"
                                            value={formData.wardCode}
                                            onChange={handleWardChange}
                                            required
                                            disabled={!formData.districtCode || isLoadingWards}
                                        >
                                            <option value="">
                                                {!formData.districtCode
                                                    ? "Chọn Phường/Xã"
                                                    : isLoadingWards
                                                        ? "Đang tải phường/xã..."
                                                        : "Chọn Phường/Xã"}
                                            </option>
                                            {wards.map((ward) => (
                                                <option key={ward.code} value={ward.code}>
                                                    {ward.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {regionError ? <p className="field-message error">{regionError}</p> : null}
                                </div>

                                <div className="checkout-block checkout-block-compact">
                                    <h2>Thanh toan</h2>
                                    <p className="helper-text">Chọn hình thức thanh toán đơn hàng.</p>

                                    <label className={`payment-card ${paymentMethod === ORDER_PAYMENT_METHODS.COD ? "selected" : ""}`}>
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value={ORDER_PAYMENT_METHODS.COD}
                                            checked={paymentMethod === ORDER_PAYMENT_METHODS.COD}
                                            onChange={(event) => setPaymentMethod(event.target.value)}
                                        />
                                        <span className="payment-icon payment-icon-cod" aria-hidden="true">
                                            <FaMoneyBillWave />
                                        </span>
                                        <div>
                                            <strong>(COD) Thanh toán khi nhận hàng</strong>
                                        </div>
                                    </label>

                                    <label className={`payment-card ${paymentMethod === ORDER_PAYMENT_METHODS.BANK_TRANSFER ? "selected" : ""}`}>
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value={ORDER_PAYMENT_METHODS.BANK_TRANSFER}
                                            checked={paymentMethod === ORDER_PAYMENT_METHODS.BANK_TRANSFER}
                                            onChange={(event) => setPaymentMethod(event.target.value)}
                                        />
                                        <span className="payment-icon payment-icon-bank" aria-hidden="true">
                                            <FaUniversity />
                                        </span>
                                        <div>
                                            <strong>Chuyển khoản ngân hàng</strong>
                                        </div>
                                    </label>

                                    <label className={`payment-card ${paymentMethod === ORDER_PAYMENT_METHODS.VNPAY ? "selected" : ""}`}>
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value={ORDER_PAYMENT_METHODS.VNPAY}
                                            checked={paymentMethod === ORDER_PAYMENT_METHODS.VNPAY}
                                            onChange={(event) => setPaymentMethod(event.target.value)}
                                        />
                                        <span className="payment-icon payment-icon-vnpay" aria-hidden="true">
                                            <FaCreditCard />
                                        </span>
                                        <div>
                                            <strong>Thanh toán VNPay</strong>
                                        </div>
                                    </label>
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
                    ) : null}

                    {checkoutStep === "payment" ? (
                        <div className="payment-step">
                            <div className="section-heading section-heading-inline">
                                <h1>Thanh toán đơn hàng</h1>
                            </div>

                            <div className="payment-transfer-layout">
                                <div className="payment-qr-card">
                                    {paymentInfo.qrCodeUrl ? (
                                        <img src={paymentInfo.qrCodeUrl} alt="QR thanh toan don hang" />
                                    ) : (
                                        // TODO: Placeholder nay chi phu hop khi backend chua tra QR.
                                        // Sau nay co the can them loading, expired QR, hoac nut tao lai ma.
                                        <div className="qr-placeholder">QR dang duoc backend cap nhat</div>
                                    )}
                                    <strong>Số tiền cần thanh toán</strong>
                                    <p className="payment-amount">{formatVND(paymentInfo.amount || total)}</p>
                                    <p className="payment-caption">Nội dung chuyển khoản: {paymentInfo.transferContent}</p>
                                </div>

                                <div className="payment-info-card">
                                    <div className="payment-info-row">
                                        <span>Mã đơn hàng</span>
                                        <strong>{orderData?.orderCode}</strong>
                                    </div>
                                    <div className="payment-info-row">
                                        <span>Ngân hàng</span>
                                        <strong>{paymentInfo.bankInfo.bankName}</strong>
                                    </div>
                                    <div className="payment-info-row with-action">
                                        <div>
                                            <span>Số tài khoản</span>
                                            <strong>{paymentInfo.bankInfo.accountNumber}</strong>
                                        </div>
                                        <button
                                            type="button"
                                            className="copy-btn"
                                            onClick={() => handleCopy(paymentInfo.bankInfo.accountNumber, "account")}
                                        >
                                            <MdContentCopy />
                                            {copiedField === "account" ? "Da copy" : "Copy"}
                                        </button>
                                    </div>
                                    <div className="payment-info-row">
                                        <span>Chủ tài khoản</span>
                                        <strong>{paymentInfo.bankInfo.accountName}</strong>
                                    </div>
                                    <div className="payment-info-row with-action">
                                        <div>
                                            <span>Nội dung</span>
                                            <strong>{paymentInfo.transferContent}</strong>
                                        </div>
                                        <button
                                            type="button"
                                            className="copy-btn"
                                            onClick={() => handleCopy(paymentInfo.transferContent, "content")}
                                        >
                                            <MdContentCopy />
                                            {copiedField === "content" ? "Da copy" : "Copy"}
                                        </button>
                                    </div>

                                    <div className="payment-step-actions">
                                        <button
                                            type="button"
                                            className="secondary-action-btn"
                                            onClick={() => setCheckoutStep("form")}
                                            disabled={isConfirmingPayment}
                                        >
                                            Quay lại thông tin
                                        </button>
                                        <button
                                            type="button"
                                            className="place-order-btn"
                                            onClick={handleConfirmTransfer}
                                            disabled={isConfirmingPayment}
                                        >
                                            {isConfirmingPayment ? "Đang xác nhận..." : "Tôi đã chuyển khoản"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {checkoutStep === "success" ? (
                        <div className="payment-success-card">
                            <FaCheckCircle className="success-icon" />
                            <h1>Đặt hàng thành công</h1>
                            <p>
                                Đơn hàng <strong>{orderData?.orderCode}</strong> đã được ghi nhận.
                                {" "}
                                {orderData?.paymentMethod === ORDER_PAYMENT_METHODS.COD
                                    ? "Bạn sẽ thanh toán khi nhận hàng."
                                    : "Hệ thống đã nhận yêu cầu xác nhận chuyển khoản của bạn."}
                            </p>
                            <p>
                                Dear Rose sẽ liên hệ với bạn
                                {" "}
                                <strong>{formData.phone || "số điện thoại của bạn"}</strong>
                                {" "}
                                để xác nhận và giao hàng sớm nhất.
                            </p>
                            <div className="payment-step-actions success-actions">
                                <Link to="/" className="secondary-action-btn link-btn">
                                    Về trang chủ
                                </Link>
                                <Link to="/don-hang" className="place-order-btn link-btn">
                                    Xem đơn hàng
                                </Link>
                            </div>
                        </div>
                    ) : null}

                    {orderError ? <p className="field-message error checkout-error-banner">{orderError}</p> : null}
                </div>

                <aside className="checkout-summary">
                    <div className="summary-header">
                        <h2>Đơn hàng</h2>
                    </div>

                    <div className="summary-product-list">
                        {checkoutItems.map((item, index) => (
                            <div key={item.cartKey ?? `${item.id ?? "item"}-${item.color ?? ""}-${item.size ?? ""}-${index}`} className="summary-product">
                                <div className="product-thumb">
                                    {item.image ? (
                                        <img src={item.image} alt={item.name} />
                                    ) : (
                                        <div className="thumb-placeholder" />
                                    )}
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
                                value={couponCode}
                                onChange={(event) => setCouponCode(event.target.value)}
                            />
                            <button type="button" onClick={handleApplyCoupon} disabled={isApplyingCoupon}>
                                {isApplyingCoupon ? "Đang kiểm tra..." : "Áp dụng"}
                            </button>
                        </div>

                        {appliedCoupon ? (
                            <p className="coupon-note">Đã áp dụng mã {appliedCoupon.code}.</p>
                        ) : null}

                        {couponError ? (
                            <p className="coupon-note">{couponError}</p>
                        ) : null}
                    </div>

                    <div className="price-list">
                        <div className="price-row">
                            <span>Tạm tính</span>
                            <strong>{formatVND(subtotal)}</strong>
                        </div>
                        <div className="price-row">
                            <span>Phí vận chuyển</span>
                            <strong>{formatVND(SHIPPING_FEE)}</strong>
                        </div>
                        <div className="price-row muted">
                            <span>Giảm giá thành viên</span>
                            <strong>0 d</strong>
                        </div>
                        <div className="price-row muted">
                            <span>Giảm giá coupon</span>
                            <strong>- {formatVND(couponDiscount)}</strong>
                        </div>
                    </div>

                    <div className="summary-footer">
                        <div className="total-row">
                            <span>Tổng cộng</span>
                            <strong>{formatVND(orderData?.totalAmount || total)}</strong>
                        </div>

                        {checkoutStep === "form" ? (
                            <button type="submit" className="place-order-btn" disabled={isCreatingOrder}>
                                {isCreatingOrder ? "Đang tạo đơn..." : "Đặt hàng"}
                            </button>
                        ) : null}
                    </div>
                </aside>
            </form>
        </section>
    );
}

export default CheckoutPage;