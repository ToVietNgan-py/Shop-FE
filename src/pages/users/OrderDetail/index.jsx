import { useCallback, useContext, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    FiAlertCircle,
    FiCreditCard,
    FiFileText,
    FiMapPin,
    FiPackage,
    FiShoppingBag,
} from "react-icons/fi";
import { getOrder } from "../../../services/orderService";
import { formatVND } from "../../../utils/format";
import ProfileSidebar from "../../../components/profile/ProfileSidebar.jsx";
import { AuthContext } from "../../../context/AuthContext.jsx";
import "./style.scss";

// Order status labels
const STATUS_LABELS = {
    pending: "Chờ xác nhận",
    confirmed: "Đã xác nhận",
    shipping: "Đang giao",
    delivered: "Đã giao",
    cancelled: "Đã hủy",
};

// Status colors
const STATUS_COLORS = {
    pending: "#b7791f",
    confirmed: "#2563eb",
    shipping: "#7c3aed",
    delivered: "#047857",
    cancelled: "#dc2626",
};

const PAYMENT_METHOD_LABELS = {
    cod: "Thanh toán khi nhận hàng (COD)",
    code: "Thanh toán khi nhận hàng (COD)",
    cash: "Thanh toán khi nhận hàng (COD)",
    bank: "Chuyển khoản ngân hàng",
    bank_transfer: "Chuyển khoản ngân hàng",
    transfer: "Chuyển khoản ngân hàng",
    qr: "Chuyển khoản ngân hàng",
    vnpay: "Thanh toán VNPay",
    vn_pay: "Thanh toán VNPay",
};

const getPaymentMethodLabel = (method) => {
    const normalized = String(method ?? "").trim().toLowerCase();
    return PAYMENT_METHOD_LABELS[normalized] ?? method ?? "Chưa có thông tin";
};

const getQrImageSrc = (qrCode) => {
    if (!qrCode) {
        return "";
    }

    if (/^https?:\/\//i.test(qrCode) || qrCode.startsWith("data:")) {
        return qrCode;
    }

    return `https://quickchart.io/qr?size=220&text=${encodeURIComponent(qrCode)}`;
};


// Format datetime
const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

// Status Badge Component
const StatusBadge = ({ status }) => (
    <span
        className="status-badge"
        style={{ backgroundColor: STATUS_COLORS[status] }}
    >
        {STATUS_LABELS[status]}
    </span>
);

const SectionTitle = ({ icon: Icon, children }) => (
    <div className="section-title">
        <span className="section-title__icon" aria-hidden="true">
            <Icon />
        </span>
        <h3>{children}</h3>
    </div>
);

// Order Item Component
const OrderItem = ({ item }) => (
    <div className="order-item">
        {item.image ? <img src={item.image} alt={item.name} className="item-image" /> : <div className="item-image" aria-hidden="true" />}
        <div className="item-details">
            <h4 className="item-name">{item.name}</h4>
            <p className="item-variant">
                {item.color} / {item.size} · SL: {item.quantity}
            </p>
        </div>
        <div className="item-price">{formatVND(item.price * (item.quantity || 1))}</div>
    </div>
);

// Main Component
const OrderDetail = () => {
    const { id: orderId } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const sidebarUser = user;

    // Handle menu change from sidebar
    const handleMenuChange = (menuKey) => {
        if (menuKey === "info") {
            navigate("/tai-khoan");
        } else if (menuKey === "orders") {
            navigate("/don-hang");
        }
    };

    // Fetch order detail
    const fetchOrderDetail = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await getOrder(orderId);
            setOrder(res.data || null);
        } catch (err) {
            console.error("Error fetching order:", err);
            setError("Khong tai duoc chi tiet don hang.");
            setOrder(null);
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        fetchOrderDetail();
    }, [fetchOrderDetail]);

    // Handle back to orders
    const handleBack = () => {
        navigate("/don-hang");
    };

    // Handle buy again
    const handleBuyAgain = () => {
        // Navigate to product page or add to cart
        navigate("/san-pham");
    };

    const paymentInfo = order?.paymentInfo ?? {};
    const qrImageSrc = getQrImageSrc(paymentInfo.qrCodeUrl);

    // If loading
    if (loading) {
        return (
            <div className="order-detail-page">
                <div className="profile-layout">
                    <ProfileSidebar user={sidebarUser} activeMenu="orders" onMenuChange={handleMenuChange} />
                    <div className="detail-content">
                        <div className="loading">
                            <div className="spinner"></div>
                            <p>Đang tải thông tin đơn hàng...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // If error or no order
    if (error || !order) {
        return (
            <div className="order-detail-page">
                <div className="profile-layout">
                    <ProfileSidebar user={sidebarUser} activeMenu="orders" onMenuChange={handleMenuChange} />
                    <div className="detail-content">
                        <div className="error-state">
                            <FiAlertCircle className="error-icon" aria-hidden="true" />
                            <h3>Không tìm thấy đơn hàng</h3>
                            <p>Đơn hàng không tồn tại hoặc đã bị xóa.</p>
                            <button className="back-btn" onClick={handleBack}>
                                Quay lại
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="order-detail-page">
            <div className="profile-layout">
                <ProfileSidebar user={sidebarUser} activeMenu="orders" onMenuChange={handleMenuChange} />

                <div className="detail-content">


                    {/* Order Info Card */}
                    <div className="order-info-card">
                        <div className="order-info-header">
                            <div>
                                <div className="eyebrow">Chi tiết đơn hàng</div>
                            </div>
                            <StatusBadge status={order.status} />
                        </div>
                        <div className="order-date">
                            Ngày đặt: {formatDateTime(order.createdAt)}
                        </div>
                    </div>

                    <div className="order-detail-grid">
                        <div className="order-main-column">
                            {/* Shipping Address */}
                            <div className="info-card">
                                <SectionTitle icon={FiMapPin}>Địa chỉ giao hàng</SectionTitle>
                                <div className="address-info">
                                    <p className="full-name">{order.shippingAddress?.fullName}</p>
                                    <p className="phone">{order.shippingAddress?.phone}</p>
                                    <p className="address">
                                        {order.shippingAddress?.address}, {order.shippingAddress?.ward}, {order.shippingAddress?.district}, {order.shippingAddress?.city}
                                    </p>
                                </div>
                            </div>

                            {/* Products */}
                            <div className="info-card">
                                <SectionTitle icon={FiShoppingBag}>Sản phẩm ({order.items?.reduce((s, it) => s + (it.quantity || 0), 0)})</SectionTitle>
                                <div className="order-items">
                                    {order.items?.map((item, index) => (
                                        <OrderItem key={item.id ?? item.productId ?? `${order.orderCode}-item-${index}`} item={item} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="order-side-column">
                            {/* Payment Info */}
                            <div className="info-card">
                                <SectionTitle icon={FiCreditCard}>Thông tin thanh toán</SectionTitle>
                                <div className="payment-details">
                                    <div className="payment-row payment-method-row">
                                        <span className="label">Phương thức:</span>
                                        <span className="value">{getPaymentMethodLabel(order.paymentMethod)}</span>
                                    </div>
                                    {order.paymentStatus ? (
                                        <div className="payment-row">
                                            <span className="label">Trạng thái:</span>
                                            <span className="value">{order.paymentStatus}</span>
                                        </div>
                                    ) : null}
                                    {paymentInfo.bankInfo?.bankName ? (
                                        <div className="payment-row">
                                            <span className="label">Ngân hàng:</span>
                                            <span className="value">{paymentInfo.bankInfo.bankName}</span>
                                        </div>
                                    ) : null}
                                    {paymentInfo.bankInfo?.accountNumber ? (
                                        <div className="payment-row">
                                            <span className="label">Số tài khoản:</span>
                                            <span className="value">{paymentInfo.bankInfo.accountNumber}</span>
                                        </div>
                                    ) : null}
                                    {paymentInfo.transferContent ? (
                                        <div className="payment-row">
                                            <span className="label">Nội dung:</span>
                                            <span className="value">{paymentInfo.transferContent}</span>
                                        </div>
                                    ) : null}
                                    {qrImageSrc ? (
                                        <div className="payment-qr-detail">
                                            <img src={qrImageSrc} alt="QR thanh toán đơn hàng" />
                                        </div>
                                    ) : null}
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="info-card summary-card">
                                <SectionTitle icon={FiFileText}>Tổng quan đơn hàng</SectionTitle>
                                <div className="order-summary">
                                    <div className="summary-row">
                                        <span className="label">Tạm tính:</span>
                                        <span className="value">{formatVND(order.totalAmount - order.shippingFee + order.discount)}</span>
                                    </div>
                                    <div className="summary-row">
                                        <span className="label">Phí vận chuyển:</span>
                                        <span className="value">
                                            {order.shippingFee > 0 ? formatVND(order.shippingFee) : "Miễn phí"}
                                        </span>
                                    </div>
                                    {order.discount > 0 && (
                                        <div className="summary-row discount">
                                            <span className="label">Giảm giá:</span>
                                            <span className="value">-{formatVND(order.discount)}</span>
                                        </div>
                                    )}
                                    <div className="summary-row total">
                                        <span className="label">Tổng tiền:</span>
                                        <span className="value">{formatVND(order.totalAmount)}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="order-actions">
                                    {order.status === "delivered" && (
                                        <button className="buy-again-btn" onClick={handleBuyAgain}>
                                            <FiPackage aria-hidden="true" />
                                            Mua lại
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetail;
