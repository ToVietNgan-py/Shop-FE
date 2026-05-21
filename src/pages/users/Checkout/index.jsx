// import { useContext, useEffect, useMemo, useState } from "react";
// import { FaCheckCircle, FaCreditCard, FaMoneyBillWave, FaUniversity } from "react-icons/fa";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { MdContentCopy } from "react-icons/md";
// import { Link, useLocation, useSearchParams } from "react-router-dom";
// import { regionApi } from "../../../apis/region.js";
// import { CartContext } from "../../../context/CartContext.jsx";
// import { AuthContext } from "../../../context/AuthContext.jsx";
// import { cartService } from "../../../services/cartService.js";
// import { buildCreateOrderPayload, orderService, ORDER_PAYMENT_METHODS } from "../../../services/orderService.js";
// import { paymentService } from "../../../services/paymentService.js";
// import { productService } from "../../../services/productService.js";
// import { voucherService } from "../../../services/voucherService.js";
// import { formatVND } from "../../../utils/format.js";
// import { checkoutSchema } from "../../../validations/checkoutSchema.js";
// import PageLoading from "../../../components/PageLoading/PageLoading.jsx";
// import ErrorState from "../../../components/ErrorState/ErrorState.jsx";
// import "./style.scss";

// const SHIPPING_FEE = 35000;
// // TODO: Khi backend hoan thien, lay phi ship va giam gia tu API pricing/promotion
// // thay vi hardcode o frontend de tranh lech tong tien voi backend.

// // Backend hiện chưa trả về bank_info trong response của POST /orders.
// // Dùng tạm thông tin tài khoản cố định để hiển thị cho người dùng chuyển khoản.
// // TODO: Bỏ fallback này khi BE trả về payment_info.bank_info.
// const DEFAULT_BANK_INFO = {
//     bankName: "Vietcombank",
//     accountName: "CONG TY TNHH DEAR ROSE",
//     accountNumber: "0123456789",
// };

// const toBackendPaymentMethod = (method) => {
//     if (method === ORDER_PAYMENT_METHODS.BANK_TRANSFER) {
//         return "bank";
//     }

//     if (method === ORDER_PAYMENT_METHODS.VNPAY) {
//         return "vnpay";
//     }

//     return "cod";
// };



// function CheckoutPage() {
//     const location = useLocation();
//     const [searchParams] = useSearchParams();
//     const { cartId, cartItems, syncCart } = useContext(CartContext);
//     const { user } = useContext(AuthContext);
//     const productId = Number(searchParams.get("productId"));
//     const [fallbackItem, setFallbackItem] = useState(null);
//     const [isLoadingFallback, setIsLoadingFallback] = useState(true);
//     // Fallback vẫn giữ để trang checkout không bị trống nếu API chưa trả được sản phẩm.

//     useEffect(() => {
//         let isMounted = true;

//         async function loadFallbackProduct() {
//             setIsLoadingFallback(true);

//             const detail = productId ? await productService.detail(productId) : null;
//             const fallbackList = detail ? [detail] : (await productService.list({ limit: 1, page: 1 })).items;
//             const product = fallbackList[0];

//             if (isMounted && product) {
//                 setFallbackItem({
//                     id: product.id,
//                     name: product.name,
//                     image: product.image,
//                     price: product.price,
//                     color: "Cream",
//                     size: "S",
//                     quantity: 1
//                 });
//             }

//             if (isMounted) {
//                 setIsLoadingFallback(false);
//             }
//         }

//         loadFallbackProduct();

//         return () => {
//             isMounted = false;
//         };
//     }, [productId]);

//     const checkoutItems = useMemo(() => {
//         const stateItems = location.state?.checkoutItems;

//         if (Array.isArray(stateItems) && stateItems.length > 0) {
//             return stateItems;
//         }

//         if (location.state?.checkoutItem) {
//             return [location.state.checkoutItem];
//         }

//         if (cartItems.length > 0) {
//             return cartItems;
//         }

//         return fallbackItem ? [fallbackItem] : [];
//     }, [cartItems, fallbackItem, location.state]);

//     const {
//         register,
//         handleSubmit,
//         setValue,
//         watch,
//         formState: { errors, isSubmitting },
//     } = useForm({
//         resolver: zodResolver(checkoutSchema),
//         defaultValues: {
//             country: "Vietnam",
//             fullName: "",
//             addressDetail: "",
//             city: "",
//             cityCode: "",
//             district: "",
//             districtCode: "",
//             ward: "",
//             wardCode: "",
//             phone: "",
//             note: "",
//             voucher_code: "",
//             paymentMethod: ORDER_PAYMENT_METHODS.COD,
//         },
//     });
//     const formData = watch();
//     const couponCode = watch("voucher_code");
//     const paymentMethod = watch("paymentMethod");
//     const [appliedCoupon, setAppliedCoupon] = useState(null);
//     const [couponError, setCouponError] = useState("");
//     const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
//     const [checkoutStep, setCheckoutStep] = useState("form");
//     const [copiedField, setCopiedField] = useState("");
//     const [orderData, setOrderData] = useState(null);
//     const [orderError, setOrderError] = useState("");
//     const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
//     const [provinces, setProvinces] = useState([]);
//     const [districts, setDistricts] = useState([]);
//     const [wards, setWards] = useState([]);
//     const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
//     const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
//     const [isLoadingWards, setIsLoadingWards] = useState(false);
//     const [regionError, setRegionError] = useState("");
//     const [regionRetryNonce, setRegionRetryNonce] = useState(0);

//     const subtotal = useMemo(
//         () => checkoutItems.reduce((total, item) => total + item.price * item.quantity, 0),
//         [checkoutItems]
//     );
//     const couponDiscount = appliedCoupon?.discount ?? 0;
//     const total = subtotal + SHIPPING_FEE - couponDiscount;

//     const paymentInfo = useMemo(() => {
//         const beInfo = orderData?.paymentInfo;
//         const beBank = beInfo?.bankInfo;
//         const hasBeBank = beBank && (beBank.bankName || beBank.accountNumber);

//         return {
//             qrCodeUrl: beInfo?.qrCodeUrl ?? "",
//             transferContent: beInfo?.transferContent
//                 || (orderData?.orderCode ? `DEARROSE ${orderData.orderCode}` : ""),
//             amount: beInfo?.amount || orderData?.totalAmount || total,
//             bankInfo: hasBeBank ? beBank : DEFAULT_BANK_INFO,
//         };
//     }, [orderData, total]);
//     // TODO: Khi backend trả về payment_info.bank_info chuẩn, bỏ DEFAULT_BANK_INFO.

//     useEffect(() => {
//         let isMounted = true;

//         async function loadProvinces() {
//             setIsLoadingProvinces(true);
//             setRegionError("");

//             try {
//                 const data = await regionApi.getProvinces();

//                 if (isMounted) {
//                     setProvinces(data);
//                 }
//             } catch {
//                 if (isMounted) {
//                     setRegionError("Khong tai duoc du lieu dia chi tu VN Region API.");
//                 }
//             } finally {
//                 if (isMounted) {
//                     setIsLoadingProvinces(false);
//                 }
//             }
//         }

//         loadProvinces();

//         return () => {
//             isMounted = false;
//         };
//     }, [regionRetryNonce]);

//     useEffect(() => {
//         if (!formData.cityCode) {
//             setDistricts([]);
//             setWards([]);
//             return;
//         }

//         let isMounted = true;

//         async function loadDistricts() {
//             setIsLoadingDistricts(true);
//             setRegionError("");

//             try {
//                 const data = await regionApi.getDistricts(formData.cityCode);

//                 if (isMounted) {
//                     setDistricts(data);
//                 }
//             } catch {
//                 if (isMounted) {
//                     setRegionError("Khong tai duoc quan/huyen cho tinh thanh da chon.");
//                 }
//             } finally {
//                 if (isMounted) {
//                     setIsLoadingDistricts(false);
//                 }
//             }
//         }

//         loadDistricts();

//         return () => {
//             isMounted = false;
//         };
//     }, [formData.cityCode, regionRetryNonce]);

//     useEffect(() => {
//         if (!formData.districtCode) {
//             setWards([]);
//             return;
//         }

//         let isMounted = true;

//         async function loadWards() {
//             setIsLoadingWards(true);
//             setRegionError("");

//             try {
//                 const data = await regionApi.getWards(formData.districtCode);

//                 if (isMounted) {
//                     setWards(data);
//                 }
//             } catch {
//                 if (isMounted) {
//                     setRegionError("Khong tai duoc phuong/xa cho quan huyen da chon.");
//                 }
//             } finally {
//                 if (isMounted) {
//                     setIsLoadingWards(false);
//                 }
//             }
//         }

//         loadWards();

//         return () => {
//             isMounted = false;
//         };
//     }, [formData.districtCode, regionRetryNonce]);

//     useEffect(() => {
//         if (!copiedField) {
//             return undefined;
//         }

//         const timer = window.setTimeout(() => setCopiedField(""), 1800);
//         return () => window.clearTimeout(timer);
//     }, [copiedField]);

//     const refreshCartAfterOrder = async () => {
//         // BE order creation đã xoá items trong server cart.
//         // Xoá luôn guest cart trong localStorage để khi VNPay redirect quay lại,
//         // CartContext không re-merge stale items lên server (gây cart cũ hiện trở lại).
//         try {
//             window.localStorage.removeItem("guest_cart");
//         } catch {
//             // Ignore localStorage errors.
//         }

//         try {
//             await syncCart();
//         } catch {
//             // OrderController::store already clears the cart on success.
//             // If refresh fails, the next cart load will resync from server.
//         }
//     };

//     const handleProvinceChange = ({ target }) => {
//         const selectedProvince = provinces.find((item) => String(item.code) === target.value);

//         setValue("city", selectedProvince?.name ?? "", { shouldValidate: true });
//         setValue("cityCode", target.value, { shouldValidate: true });
//         setValue("district", "", { shouldValidate: true });
//         setValue("districtCode", "", { shouldValidate: true });
//         setValue("ward", "", { shouldValidate: true });
//         setValue("wardCode", "", { shouldValidate: true });

//         setDistricts([]);
//         setWards([]);
//     };

//     const handleDistrictChange = ({ target }) => {
//         const selectedDistrict = districts.find((item) => String(item.code) === target.value);

//         setValue("district", selectedDistrict?.name ?? "", { shouldValidate: true });
//         setValue("districtCode", target.value, { shouldValidate: true });
//         setValue("ward", "", { shouldValidate: true });
//         setValue("wardCode", "", { shouldValidate: true });

//         setWards([]);
//     };

//     const handleWardChange = ({ target }) => {
//         const selectedWard = wards.find((item) => String(item.code) === target.value);

//         setValue("ward", selectedWard?.name ?? "", { shouldValidate: true });
//         setValue("wardCode", target.value, { shouldValidate: true });
//     };

//     const handleApplyCoupon = async () => {
//         const normalizedCode = (couponCode || "").trim().toUpperCase();

//         setCouponError("");
//         setAppliedCoupon(null);

//         if (!normalizedCode) {
//             return;
//         }

//         if (subtotal <= 0) {
//             setCouponError("Đơn hàng chưa có sản phẩm để áp mã giảm giá.");
//             return;
//         }

//         setIsApplyingCoupon(true);

//         try {
//             const voucher = await voucherService.apply({
//                 code: normalizedCode,
//                 orderTotal: subtotal,
//                 cartId,
//             });

//             setAppliedCoupon(voucher);
//         } catch (error) {
//             setCouponError(error?.message || "Ma giam gia khong hop le.");
//         } finally {
//             setIsApplyingCoupon(false);
//         }
//     };

//     const handlePlaceOrder = async (values) => {
//         setOrderError("");

//         try {
//             console.log('[Checkout] submit start', {
//                 checkoutItemsLen: checkoutItems.length,
//                 hasUserEmail: Boolean(user?.email),
//                 paymentMethod: values.paymentMethod,
//                 cartId,
//             });

//             if (!checkoutItems.length) {
//                 throw new Error("Gio hang dang trong. Vui long them san pham truoc khi dat hang.");
//             }

//             if (!user?.email) {
//                 throw new Error("Vui long dang nhap truoc khi dat hang.");
//             }

//             const payload = buildCreateOrderPayload({
//                 customer: {
//                     fullName: values.fullName,
//                     phone: values.phone,
//                     email: user.email
//                 },
//                 shippingAddress: {
//                     country: values.country,
//                     city: values.city,
//                     cityCode: values.cityCode,
//                     district: values.district,
//                     districtCode: values.districtCode,
//                     ward: values.ward,
//                     wardCode: values.wardCode,
//                     addressLine: values.addressDetail
//                 },
//                 items: checkoutItems,
//                 note: values.note
//             });

//             // CartContext hiện chỉ lưu localStorage → server cart có thể rỗng hoặc lệch.
//             // BE checkout đọc items từ cart_id, nên phải đẩy local items lên server trước
//             // bằng cách clear server cart rồi merge lại đúng list FE đang thấy.
//             let resolvedCartId = null;

//             try {
//                 try {
//                     const cleared = await cartService.clear();
//                     resolvedCartId = cleared?.id ?? null;
//                 } catch (clearErr) {
//                     console.warn("[Checkout] cartService.clear() failed (ignored):", clearErr?.message);
//                 }

//                 const serverCart = await cartService.mergeGuestCart(checkoutItems);
//                 resolvedCartId = serverCart?.id ?? resolvedCartId;
//             } catch (syncErr) {
//                 throw new Error(
//                     syncErr?.message
//                     || "Khong dong bo duoc gio hang voi may chu de tao don hang."
//                 );
//             }

//             if (!resolvedCartId) {
//                 throw new Error("Khong tao duoc gio hang tren may chu de tao don hang.");
//             }

//             payload.cart_id = resolvedCartId;
//             payload.payment_method = toBackendPaymentMethod(values.paymentMethod);

//             if (appliedCoupon?.code) {
//                 payload.voucher_code = appliedCoupon.code;
//             }

//             const createdOrder = await orderService.createOrder(payload);
//             setOrderData(createdOrder);

//             if (createdOrder.paymentMethod === ORDER_PAYMENT_METHODS.COD) {
//                 await refreshCartAfterOrder();
//                 setCheckoutStep("success");
//                 return;
//             }

//             if (createdOrder.paymentMethod === ORDER_PAYMENT_METHODS.BANK_TRANSFER) {
//                 await refreshCartAfterOrder();
//                 setCheckoutStep("payment");
//                 return;
//             }

//             if (createdOrder.paymentMethod !== ORDER_PAYMENT_METHODS.VNPAY) {
//                 throw new Error("Phuong thuc thanh toan khong hop le cho luong VNPay.");
//             }

//             // BE trả payment_url ngay trong response của POST /orders khi payment_method=vnpay
//             // (orderService.createOrder đã merge field này vào createdOrder.paymentUrl).
//             // Fallback: gọi /payment/vnpay/create với order_id nếu BE chưa kèm URL.
//             let paymentUrl = createdOrder.paymentUrl;

//             if (!paymentUrl && createdOrder.id) {
//                 const vnpayRes = await paymentService.createVNPay(createdOrder.id);
//                 paymentUrl = vnpayRes?.data?.data?.payment_url ?? vnpayRes?.data?.payment_url ?? "";
//             }

//             if (!paymentUrl) {
//                 throw new Error("Khong tao duoc lien ket thanh toan VNPay.");
//             }

//             await refreshCartAfterOrder();
//             window.location.href = paymentUrl;
//         } catch (error) {
//             setOrderError(
//                 error?.message || error?.response?.data?.message || "Khong tao duoc don hang. Vui long thu lai."
//             );
//         }
//     };

//     const handleConfirmTransfer = async () => {
//         if (!orderData?.orderCode) {
//             return;
//         }

//         setOrderError("");
//         setIsConfirmingPayment(true);

//         try {
//             // TODO: Flow nay dang cho nguoi dung tu bam xac nhan da chuyen khoan.
//             // Khi tich hop cong thanh toan that, co the doi sang polling, webhook hoac query payment status tu backend.
//             // Backend /payment/vnpay/return đang kỳ vọng đúng bộ querystring từ VNPay.
//             // Flow hiện tại chỉ là confirm nội bộ với orderCode nên dễ bị 400.
//             // Tạm thời bỏ confirmReturn để tránh lỗi thanh toán.
//             // Khi backend chuẩn hóa, thay lại bằng flow confirm/polling đúng signature.
//             await Promise.resolve();


//             await refreshCartAfterOrder();
//             setCheckoutStep("success");
//         } catch (error) {
//             setOrderError(
//                 error?.response?.data?.message || "Khong xac nhan duoc thanh toan. Vui long thu lai."
//             );
//         } finally {
//             setIsConfirmingPayment(false);
//         }
//     };

//     const handleCopy = async (value, key) => {
//         try {
//             await navigator.clipboard.writeText(value);
//             setCopiedField(key);
//         } catch {
//             setCopiedField("");
//         }
//     };

//     const handleRetryRegions = () => {
//         setRegionError("");
//         setRegionRetryNonce((prev) => prev + 1);
//     };

//     if (isLoadingFallback && checkoutItems.length === 0) {
//         return <PageLoading title="Đang tải thanh toán" description="Mình đang lấy dữ liệu sản phẩm mặc định từ API." />;
//     }

//     return (
//         <section className="checkout-page">
//             <form className="checkout-layout" onSubmit={handleSubmit(handlePlaceOrder)} noValidate>
//                 <div className="checkout-main">
//                     {checkoutStep === "form" ? (
//                         <div className="checkout-columns">
//                             <div className="checkout-column">
//                                 <div className="section-heading section-heading-inline">
//                                     <h1>Thông tin mua hàng</h1>
//                                     <p>Nhập đầy đủ thông tin liên hệ để tạo đơn hàng.</p>
//                                 </div>

//                                 {isLoadingProvinces && provinces.length === 0 ? (
//                                     <PageLoading
//                                         title="Đang tải địa chỉ giao hàng"
//                                         description="Đang lấy tỉnh/thành, quận/huyện và phường/xã từ VN Region API."
//                                         compact
//                                     />
//                                 ) : null}

//                                 {regionError ? (
//                                     <ErrorState
//                                         title="Không tải được dữ liệu địa chỉ"
//                                         description={regionError}
//                                         actionLabel="Thử lại"
//                                         onRetry={handleRetryRegions}
//                                     />
//                                 ) : null}

//                                 <div className="field-list">
//                                     <select {...register("country")} disabled={isSubmitting}>
//                                         <option value="Vietnam">Việt Nam</option>
//                                     </select>
//                                     {errors.country ? <p className="field-message error">{errors.country.message}</p> : null}

//                                     <input
//                                         placeholder="Họ và tên"
//                                         aria-invalid={!!errors.fullName}
//                                         {...register("fullName")}
//                                     />
//                                     {errors.fullName ? <p className="field-message error">{errors.fullName.message}</p> : null}

//                                     <input
//                                         placeholder="Số điện thoại"
//                                         aria-invalid={!!errors.phone}
//                                         {...register("phone")}
//                                     />
//                                     {errors.phone ? <p className="field-message error">{errors.phone.message}</p> : null}

//                                     <input
//                                         placeholder="Số nhà, tên đường, tòa nhà ..."
//                                         aria-invalid={!!errors.addressDetail}
//                                         {...register("addressDetail")}
//                                     />
//                                     {errors.addressDetail ? <p className="field-message error">{errors.addressDetail.message}</p> : null}

//                                     <textarea
//                                         rows="4"
//                                         placeholder="Ghi chú đơn hàng"
//                                         aria-invalid={!!errors.note}
//                                         {...register("note")}
//                                     />
//                                     {errors.note ? <p className="field-message error">{errors.note.message}</p> : null}
//                                 </div>
//                             </div>

//                             <div className="checkout-column">
//                                 <div className="section-heading section-heading-inline">
//                                     <h2>Van chuyen</h2>
//                                     <div className="shipping-alert">Vui lòng nhập thông tin giao hàng .</div>
//                                 </div>

//                                 <div className="field-list">
//                                     <div className="grid-two">
//                                         <select
//                                             name="cityCode"
//                                             value={formData.cityCode}
//                                             onChange={handleProvinceChange}
//                                             disabled={isLoadingProvinces || isSubmitting}
//                                             aria-invalid={!!errors.cityCode}
//                                         >
//                                             <option value="">
//                                                 {isLoadingProvinces ? "Dang tai..." : "Chọn Tỉnh/Thành phố"}
//                                             </option>
//                                             {provinces.map((province) => (
//                                                 <option key={province.code} value={province.code}>
//                                                     {province.name}
//                                                 </option>
//                                             ))}
//                                         </select>
//                                         {errors.cityCode ? <p className="field-message error">{errors.cityCode.message}</p> : null}

//                                         <select
//                                             name="districtCode"
//                                             value={formData.districtCode}
//                                             onChange={handleDistrictChange}
//                                             disabled={!formData.cityCode || isLoadingDistricts || isSubmitting}
//                                             aria-invalid={!!errors.districtCode}
//                                         >
//                                             <option value="">
//                                                 {!formData.cityCode
//                                                     ? "Chọn Quận/Huyện"
//                                                     : isLoadingDistricts
//                                                         ? "Dang tai quan/huyen..."
//                                                         : "Chon Quan/Huyen"}
//                                             </option>
//                                             {districts.map((district) => (
//                                                 <option key={district.code} value={district.code}>
//                                                     {district.name}
//                                                 </option>
//                                             ))}
//                                         </select>
//                                         {errors.districtCode ? <p className="field-message error">{errors.districtCode.message}</p> : null}
//                                     </div>

//                                     <div className="grid-two">
//                                         <select
//                                             name="wardCode"
//                                             value={formData.wardCode}
//                                             onChange={handleWardChange}
//                                             disabled={!formData.districtCode || isLoadingWards}
//                                             aria-invalid={!!errors.wardCode}
//                                         >
//                                             <option value="">
//                                                 {!formData.districtCode
//                                                     ? "Chọn Phường/Xã"
//                                                     : isLoadingWards
//                                                         ? "Đang tải phường/xã..."
//                                                         : "Chọn Phường/Xã"}
//                                             </option>
//                                             {wards.map((ward) => (
//                                                 <option key={ward.code} value={ward.code}>
//                                                     {ward.name}
//                                                 </option>
//                                             ))}
//                                         </select>
//                                         {errors.wardCode ? <p className="field-message error">{errors.wardCode.message}</p> : null}
//                                     </div>

//                                     {regionError ? <p className="field-message error">{regionError}</p> : null}
//                                 </div>

//                                 <div className="checkout-block checkout-block-compact">
//                                     <h2>Thanh toan</h2>
//                                     <p className="helper-text">Chọn hình thức thanh toán đơn hàng.</p>

//                                     <label className={`payment-card ${paymentMethod === ORDER_PAYMENT_METHODS.COD ? "selected" : ""}`}>
//                                         <input
//                                             type="radio"
//                                             name="paymentMethod"
//                                             value={ORDER_PAYMENT_METHODS.COD}
//                                             checked={paymentMethod === ORDER_PAYMENT_METHODS.COD}
//                                             onChange={(event) => setValue("paymentMethod", event.target.value, { shouldValidate: true })}
//                                         />
//                                         <span className="payment-icon payment-icon-cod" aria-hidden="true">
//                                             <FaMoneyBillWave />
//                                         </span>
//                                         <div>
//                                             <strong>(COD) Thanh toán khi nhận hàng</strong>
//                                         </div>
//                                     </label>

//                                     <label className={`payment-card ${paymentMethod === ORDER_PAYMENT_METHODS.BANK_TRANSFER ? "selected" : ""}`}>
//                                         <input
//                                             type="radio"
//                                             name="paymentMethod"
//                                             value={ORDER_PAYMENT_METHODS.BANK_TRANSFER}
//                                             checked={paymentMethod === ORDER_PAYMENT_METHODS.BANK_TRANSFER}
//                                             onChange={(event) => setValue("paymentMethod", event.target.value, { shouldValidate: true })}
//                                         />
//                                         <span className="payment-icon payment-icon-bank" aria-hidden="true">
//                                             <FaUniversity />
//                                         </span>
//                                         <div>
//                                             <strong>Chuyển khoản ngân hàng</strong>
//                                         </div>
//                                     </label>

//                                     <label className={`payment-card ${paymentMethod === ORDER_PAYMENT_METHODS.VNPAY ? "selected" : ""}`}>
//                                         <input
//                                             type="radio"
//                                             name="paymentMethod"
//                                             value={ORDER_PAYMENT_METHODS.VNPAY}
//                                             checked={paymentMethod === ORDER_PAYMENT_METHODS.VNPAY}
//                                             onChange={(event) => setValue("paymentMethod", event.target.value, { shouldValidate: true })}
//                                         />
//                                         <span className="payment-icon payment-icon-vnpay" aria-hidden="true">
//                                             <FaCreditCard />
//                                         </span>
//                                         <div>
//                                             <strong>Thanh toán VNPay</strong>
//                                         </div>
//                                     </label>
//                                 </div>

//                                 <div className="checkout-block checkout-block-compact">
//                                     <h2>Phương thức vận chuyển</h2>
//                                     <label className="option-card selected">
//                                         <input type="radio" checked readOnly />
//                                         <span>Giao hàng tiêu chuẩn</span>
//                                     </label>
//                                 </div>
//                             </div>
//                         </div>
//                     ) : null}

//                     {checkoutStep === "payment" ? (
//                         <div className="payment-step">
//                             <div className="section-heading section-heading-inline">
//                                 <h1>Thanh toán đơn hàng</h1>
//                             </div>

//                             <div className="payment-transfer-layout">
//                                 <div className="payment-qr-card">
//                                     {paymentInfo.qrCodeUrl ? (
//                                         <img src={paymentInfo.qrCodeUrl} alt="QR thanh toan don hang" />
//                                     ) : (
//                                         // TODO: Placeholder nay chi phu hop khi backend chua tra QR.
//                                         // Sau nay co the can them loading, expired QR, hoac nut tao lai ma.
//                                         <div className="qr-placeholder">QR dang duoc backend cap nhat</div>
//                                     )}
//                                     <strong>Số tiền cần thanh toán</strong>
//                                     <p className="payment-amount">{formatVND(paymentInfo.amount || total)}</p>
//                                     <p className="payment-caption">Nội dung chuyển khoản: {paymentInfo.transferContent}</p>
//                                 </div>

//                                 <div className="payment-info-card">
//                                     <div className="payment-info-row">
//                                         <span>Mã đơn hàng</span>
//                                         <strong>{orderData?.orderCode}</strong>
//                                     </div>
//                                     <div className="payment-info-row">
//                                         <span>Ngân hàng</span>
//                                         <strong>{paymentInfo.bankInfo.bankName}</strong>
//                                     </div>
//                                     <div className="payment-info-row with-action">
//                                         <div>
//                                             <span>Số tài khoản</span>
//                                             <strong>{paymentInfo.bankInfo.accountNumber}</strong>
//                                         </div>
//                                         <button
//                                             type="button"
//                                             className="copy-btn"
//                                             onClick={() => handleCopy(paymentInfo.bankInfo.accountNumber, "account")}
//                                         >
//                                             <MdContentCopy />
//                                             {copiedField === "account" ? "Da copy" : "Copy"}
//                                         </button>
//                                     </div>
//                                     <div className="payment-info-row">
//                                         <span>Chủ tài khoản</span>
//                                         <strong>{paymentInfo.bankInfo.accountName}</strong>
//                                     </div>
//                                     <div className="payment-info-row with-action">
//                                         <div>
//                                             <span>Nội dung</span>
//                                             <strong>{paymentInfo.transferContent}</strong>
//                                         </div>
//                                         <button
//                                             type="button"
//                                             className="copy-btn"
//                                             onClick={() => handleCopy(paymentInfo.transferContent, "content")}
//                                         >
//                                             <MdContentCopy />
//                                             {copiedField === "content" ? "Da copy" : "Copy"}
//                                         </button>
//                                     </div>

//                                     <div className="payment-step-actions">
//                                         <button
//                                             type="button"
//                                             className="secondary-action-btn"
//                                             onClick={() => setCheckoutStep("form")}
//                                             disabled={isConfirmingPayment}
//                                         >
//                                             Quay lại thông tin
//                                         </button>
//                                         <button
//                                             type="button"
//                                             className="place-order-btn"
//                                             onClick={handleConfirmTransfer}
//                                             disabled={isConfirmingPayment}
//                                         >
//                                             {isConfirmingPayment ? "Đang xác nhận..." : "Tôi đã chuyển khoản"}
//                                         </button>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     ) : null}

//                     {checkoutStep === "success" ? (
//                         <div className="payment-success-card">
//                             <FaCheckCircle className="success-icon" />
//                             <h1>Đặt hàng thành công</h1>
//                             <p>
//                                 Đơn hàng <strong>{orderData?.orderCode}</strong> đã được ghi nhận.
//                                 {" "}
//                                 {orderData?.paymentMethod === ORDER_PAYMENT_METHODS.COD
//                                     ? "Bạn sẽ thanh toán khi nhận hàng."
//                                     : "Hệ thống đã nhận yêu cầu xác nhận chuyển khoản của bạn."}
//                             </p>
//                             <p>
//                                 Dear Rose sẽ liên hệ với bạn
//                                 {" "}
//                                 <strong>{formData.phone || "số điện thoại của bạn"}</strong>
//                                 {" "}
//                                 để xác nhận và giao hàng sớm nhất.
//                             </p>
//                             <div className="payment-step-actions success-actions">
//                                 <Link to="/" className="secondary-action-btn link-btn">
//                                     Về trang chủ
//                                 </Link>
//                                 <Link to="/don-hang" className="place-order-btn link-btn">
//                                     Xem đơn hàng
//                                 </Link>
//                             </div>
//                         </div>
//                     ) : null}

//                     {orderError ? <p className="field-message error checkout-error-banner">{orderError}</p> : null}
//                 </div>

//                 <aside className="checkout-summary">
//                     <div className="summary-header">
//                         <h2>Đơn hàng</h2>
//                     </div>

//                     <div className="summary-product-list">
//                         {checkoutItems.map((item, index) => (
//                             <div key={item.cartKey ?? `${item.id ?? "item"}-${item.color ?? ""}-${item.size ?? ""}-${index}`} className="summary-product">
//                                 <div className="product-thumb">
//                                     {item.image ? (
//                                         <img src={item.image} alt={item.name} />
//                                     ) : (
//                                         <div className="thumb-placeholder" />
//                                     )}
//                                     <span className="quantity-badge">{item.quantity}</span>
//                                 </div>

//                                 <div className="product-meta">
//                                     <h3>{item.name}</h3>
//                                     <p>{item.size} / {item.color}</p>
//                                 </div>

//                                 <strong>{formatVND(item.price * item.quantity)}</strong>
//                             </div>
//                         ))}
//                     </div>

//                     <div className="voucher-box">
//                         <div className="voucher-row">
//                             <input
//                                 type="text"
//                                 placeholder="Nhập mã giảm giá"
//                                 value={couponCode || ""}
//                                 onChange={(event) => setValue("voucher_code", event.target.value, { shouldValidate: true })}
//                             />
//                             <button type="button" onClick={handleApplyCoupon} disabled={isApplyingCoupon}>
//                                 {isApplyingCoupon ? "Đang kiểm tra..." : "Áp dụng"}
//                             </button>
//                         </div>
//                         {errors.voucher_code ? <p className="field-message error">{errors.voucher_code.message}</p> : null}

//                         {appliedCoupon ? (
//                             <p className="coupon-note">Đã áp dụng mã {appliedCoupon.code}.</p>
//                         ) : null}

//                         {couponError ? (
//                             <p className="coupon-note">{couponError}</p>
//                         ) : null}
//                     </div>

//                     <div className="price-list">
//                         <div className="price-row">
//                             <span>Tạm tính</span>
//                             <strong>{formatVND(subtotal)}</strong>
//                         </div>
//                         <div className="price-row">
//                             <span>Phí vận chuyển</span>
//                             <strong>{formatVND(SHIPPING_FEE)}</strong>
//                         </div>
//                         <div className="price-row muted">
//                             <span>Giảm giá thành viên</span>
//                             <strong>0 d</strong>
//                         </div>
//                         <div className="price-row muted">
//                             <span>Giảm giá coupon</span>
//                             <strong>- {formatVND(couponDiscount)}</strong>
//                         </div>
//                     </div>

//                     <div className="summary-footer">
//                         <div className="total-row">
//                             <span>Tổng cộng</span>
//                             <strong>{formatVND(orderData?.totalAmount || total)}</strong>
//                         </div>

//                         {checkoutStep === "form" ? (
//                             <button type="submit" className="place-order-btn" disabled={isSubmitting}>
//                                 {isSubmitting ? "Đang tạo đơn..." : "Đặt hàng"}
//                             </button>
//                         ) : null}
//                     </div>
//                 </aside>
//             </form>
//         </section>
//     );
// }

// export default CheckoutPage;

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
        if (frozenItems) return frozenItems;
        const stateItems = location.state?.checkoutItems;
        if (Array.isArray(stateItems) && stateItems.length > 0) return stateItems;
        if (location.state?.checkoutItem) return [location.state.checkoutItem];
        if (cartItems.length > 0) return cartItems;
        return fallbackItem ? [fallbackItem] : [];
    }, [cartItems, fallbackItem, location.state, frozenItems]);

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
                                        ? <img src={item.image} alt={item.name} />
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
                    </div>

                    <div className="price-list">
                        <PriceRow label="Tạm tính" value={formatVND(subtotal)} />
                        <PriceRow label="Phí vận chuyển" value={formatVND(SHIPPING_FEE)} />
                        <PriceRow label="Giảm giá thành viên" value="0 đ" muted />
                        <PriceRow label="Giảm giá coupon" value={`- ${formatVND(couponDiscount)}`} muted />
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
