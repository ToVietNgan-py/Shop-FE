import { useCallback, useContext, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
    pending: "#ff9800",
    confirmed: "#2196f3",
    shipping: "#9c27b0",
    delivered: "#4caf50",
    cancelled: "#f44336",
};

// Mock order data for demo
// const mockOrderDetail = {
//     id: 1,
//     orderCode: "DR123456",
//     status: "pending",
//     createdAt: "2024-01-15T10:30:00",
//     totalAmount: 450000,
//     itemCount: 2,
//     shippingFee: 0,
//     discount: 0,
//     items: [
//         {
//             id: 1,
//             name: "Áo Thun Dear Rose",
//             image: "https://via.placeholder.com/80",
//             price: 200000,
//             quantity: 1,
//             color: "Trắng",
//             size: "M",
//         },
//         {
//             id: 2,
//             name: "Quần Jean Skinny",
//             image: "https://via.placeholder.com/80",
//             price: 250000,
//             quantity: 1,
//             color: "Xanh đen",
//             size: "30",
//         },
//     ],
//     shippingAddress: {
//         fullName: "Ngân Việt",
//         phone: "0123456789",
//         address: "123 Đường Nguyễn Trãi, Quận 1",
//         ward: "Phường Bến Nghé",
//         district: "Quận 1",
//         city: "TP. Hồ Chí Minh",
//     },
//     paymentMethod: "Tiền mặt",
//     note: "",
// };

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

// Order Item Component
const OrderItem = ({ item }) => (
    <div className="order-item">
        <img src={item.image} alt={item.name} className="item-image" />
        <div className="item-details">
            <h4 className="item-name">{item.name}</h4>
            <p className="item-variant">
                {item.color} / {item.size} | SL: {item.quantity}
            </p>
        </div>
        <div className="item-price">{formatVND(item.price)}</div>
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

    const mockUser = {
        name: "Ngan Viet",
        email: "test@gmail.com",
    };
    const sidebarUser = user ?? mockUser;

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
                            <div className="error-icon">⚠️</div>
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
                    {/* Header */}
                    <div className="page-header">
                        <button className="back-link" onClick={handleBack}>
                            ← Quay lại danh sách đơn hàng
                        </button>
                        <h1>Chi tiết đơn hàng</h1>
                    </div>

                    {/* Order Info Card */}
                    <div className="order-info-card">
                        <div className="order-info-header">
                            <div className="order-code">Mã đơn: {order.orderCode}</div>
                            <StatusBadge status={order.status} />
                        </div>
                        <div className="order-date">
                            Ngày đặt: {formatDateTime(order.createdAt)}
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="info-card">
                        <h3>📍 Địa chỉ giao hàng</h3>
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
                        <h3>🛍️ Sản phẩm ({order.itemCount})</h3>
                        <div className="order-items">
                            {order.items?.map((item) => (
                                <OrderItem key={item.id} item={item} />
                            ))}
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="info-card">
                        <h3>💳 Thông tin thanh toán</h3>
                        <div className="payment-details">
                            <div className="payment-row">
                                <span className="label">Phương thức:</span>
                                <span className="value">{order.paymentMethod}</span>
                            </div>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="info-card">
                        <h3>📋 Tổng quan đơn hàng</h3>
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
                    </div>

                    {/* Actions */}
                    <div className="order-actions">
                        {order.status === "delivered" && (
                            <button className="buy-again-btn" onClick={handleBuyAgain}>
                                Mua lại
                            </button>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetail;
