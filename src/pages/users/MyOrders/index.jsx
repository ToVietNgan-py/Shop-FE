import { useContext, useState, useEffect, memo } from "react";
import { useNavigate } from "react-router-dom";
import { getOrders, cancelOrder } from "../../../services/orderService";
import { formatVND } from "../../../utils/format";
import ProfileSidebar from "../../../components/profile/ProfileSidebar.jsx";
import { AuthContext } from "../../../context/AuthContext.jsx";
import "./style.scss";

// Order status labels
const STATUS_LABELS = {
    all: "Tất cả",
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

// Mock data for demo
const MOCK_ORDERS = [
    {
        id: 1,
        orderCode: "DR123456",
        status: "pending",
        createdAt: "2024-01-15T10:30:00",
        totalAmount: 450000,
        itemCount: 2,
        items: [
            {
                id: 1,
                name: "Áo Thun Dear Rose",
                image: "https://via.placeholder.com/80",
                price: 200000,
                quantity: 1,
                color: "Trắng",
                size: "M",
            },
            {
                id: 2,
                name: "Quần Jean Skinny",
                image: "https://via.placeholder.com/80",
                price: 250000,
                quantity: 1,
                color: "Xanh đen",
                size: "30",
            },
        ],
    },
    {
        id: 2,
        orderCode: "DR789012",
        status: "delivered",
        createdAt: "2024-01-10T14:20:00",
        totalAmount: 320000,
        itemCount: 1,
        items: [
            {
                id: 3,
                name: "Áo Sơ Mi Caro",
                image: "https://via.placeholder.com/80",
                price: 320000,
                quantity: 1,
                color: "Xanh rêu",
                size: "L",
            },
        ],
    },
    {
        id: 3,
        orderCode: "DR345678",
        status: "shipping",
        createdAt: "2024-01-12T09:15:00",
        totalAmount: 890000,
        itemCount: 3,
        items: [
            {
                id: 4,
                name: "Áo Hoodie Unisex",
                image: "https://via.placeholder.com/80",
                price: 390000,
                quantity: 2,
                color: "Đen",
                size: "M",
            },
            {
                id: 5,
                name: "Mũ Lười",
                image: "https://via.placeholder.com/80",
                price: 110000,
                quantity: 1,
                color: "Xám",
                size: "F",
            },
        ],
    },
    {
        id: 4,
        orderCode: "DR901234",
        status: "cancelled",
        createdAt: "2024-01-08T16:45:00",
        totalAmount: 180000,
        itemCount: 1,
        items: [
            {
                id: 6,
                name: "Túi Tote Dear Rose",
                image: "https://via.placeholder.com/80",
                price: 180000,
                quantity: 1,
                color: "Hồng",
                size: "F",
            },
        ],
    },
];

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
        <div className="item-info">
            <h4 className="item-name">{item.name}</h4>
            <p className="item-variant">
                {item.color} / {item.size} | SL: {item.quantity}
            </p>
        </div>
        <div className="item-price">{formatVND(item.price)}</div>
    </div>
);

// Order Card Component
const OrderCard = ({ order, onViewDetail, onCancel, onReview, cancelling }) => {
    const canCancel = order.status === "pending" || order.status === "confirmed";
    const canReview = order.status === "delivered";

    return (
        <div className="order-card">
            <div className="order-header">
                <div className="order-code">Mã đơn: {order.orderCode}</div>
                <StatusBadge status={order.status} />
            </div>
            <div className="order-date">{formatDateTime(order.createdAt)}</div>

            <div className="order-items">
                {order.items.map((item) => (
                    <OrderItem key={item.id} item={item} />
                ))}
            </div>

            <div className="order-footer">
                <div className="order-total">
                    <span className="label">Tổng tiền:</span>
                    <span className="amount">{formatVND(order.totalAmount)}</span>
                    <span className="item-count">({order.itemCount} sản phẩm)</span>
                </div>
                <div className="order-actions">
                    {canCancel && (
                        <button
                            className="cancel-btn"
                            onClick={onCancel}
                            disabled={cancelling}
                        >
                            {cancelling ? "Đang hủy..." : "Hủy đơn"}
                        </button>
                    )}
                    {canReview && (
                        <button className="review-btn" onClick={onReview}>
                            Đánh giá
                        </button>
                    )}
                    <button className="view-detail-btn" onClick={onViewDetail}>
                        Xem chi tiết
                    </button>
                </div>
            </div>
        </div>
    );
};

// Main Component
const MyOrders = () => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [cancellingId, setCancellingId] = useState(null);
    const [error, setError] = useState(null);

    // Handle menu change from sidebar
    const handleMenuChange = (menuKey) => {
        if (menuKey === "password") {
            navigate("/tai-khoan");
        } else if (menuKey === "info") {
            navigate("/tai-khoan");
        }
    };

    // Current user from localStorage (mock)
    const [mockUser] = useState({
        name: "Ngân Việt",
        email: "test@gmail.com",
    });

    const sidebarUser = user ?? mockUser;

    // Fetch orders
    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await getOrders();
            setOrders(res.data || []);
        } catch (err) {
            console.error("Error fetching orders:", err);
            setError(err?.message || "Khong the tai danh sach don hang.");
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    // Handle cancel order
    const handleCancelOrder = async (orderCode) => {
        if (!window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) {
            return;
        }

        try {
            setCancellingId(orderCode);
            setError(null);
            await cancelOrder(orderCode, "Khách hàng yêu cầu hủy");

            // Update local state
            setOrders(prev => prev.map(order =>
                order.orderCode === orderCode
                    ? { ...order, status: "cancelled" }
                    : order
            ));
        } catch (err) {
            console.error("Error cancelling order:", err);
            setError("Không thể hủy đơn hàng. Vui lòng thử lại.");
        } finally {
            setCancellingId(null);
        }
    };

    // Handle review (navigate to review page)
    const handleReview = (orderCode) => {
        navigate(`/don-hang/${orderCode}/danh-gia`);
    };

    // Filter orders by status and search
    const filteredOrders = orders.filter(order => {
        const matchesStatus = activeTab === "all" || order.status === activeTab;

        // Search by order code OR product name
        const matchesSearch = !searchQuery ||
            order.orderCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.items.some(item =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase())
            );

        return matchesStatus && matchesSearch;
    });

    // Handle view order detail
    const handleViewDetail = (orderCode) => {
        navigate(`/don-hang/${orderCode}`);
    };

    // If loading
    if (loading) {
        return (
            <div className="my-orders-page">
                <div className="profile-layout">
                    <ProfileSidebar user={sidebarUser} activeMenu="orders" onMenuChange={handleMenuChange} />
                    <div className="orders-content">
                        <div className="loading">
                            <div className="spinner"></div>
                            <p>Đang tải đơn hàng...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="my-orders-page">
            {error && (
                <div className="error-message" onClick={() => setError(null)}>
                    {error}
                </div>
            )}

            <div className="profile-layout">
                <ProfileSidebar user={sidebarUser} activeMenu="orders" onMenuChange={handleMenuChange} />

                <div className="orders-content">
                    <div className="page-header">
                        <h1>Lịch sử đơn hàng</h1>
                    </div>

                    {/* Search Bar */}
                    <div className="search-bar">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo mã đơn hoặc tên sản phẩm..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                className="clear-search"
                                onClick={() => setSearchQuery("")}
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Status Tabs */}
                    <div className="status-tabs">
                        {Object.entries(STATUS_LABELS).map(([key, label]) => (
                            <button
                                key={key}
                                className={`tab ${activeTab === key ? "active" : ""}`}
                                onClick={() => setActiveTab(key)}
                            >
                                {label}
                                {key !== "all" && (
                                    <span className="tab-count">
                                        {orders.filter((o) => o.status === key).length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Orders List */}
                    <div className="orders-list">
                        {filteredOrders.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">📦</div>
                                <h3>Không tìm thấy đơn hàng</h3>
                                <p>
                                    {searchQuery
                                        ? `Không có đơn hàng nào với mã "${searchQuery}"`
                                        : "Bạn chưa có đơn hàng nào trong mục này"
                                    }
                                </p>
                                <button
                                    className="shop-now-btn"
                                    onClick={() => navigate("/san-pham")}
                                >
                                    Mua sắm ngay
                                </button>
                            </div>
                        ) : (
                            filteredOrders.map((order) => (
                                <OrderCard
                                    key={order.id}
                                    order={order}
                                    onViewDetail={() => handleViewDetail(order.orderCode)}
                                    onCancel={() => handleCancelOrder(order.orderCode)}
                                    onReview={() => handleReview(order.orderCode)}
                                    cancelling={cancellingId === order.orderCode}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default memo(MyOrders);
