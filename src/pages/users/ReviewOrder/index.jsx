import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FiAlertCircle, FiChevronLeft, FiPackage } from "react-icons/fi";
import { getOrder } from "../../../services/orderService.js";
import { reviewService } from "../../../services/reviewService.js";
import { formatVND } from "../../../utils/format.js";
import PageLoading from "../../../components/PageLoading/PageLoading.jsx";
import ErrorState from "../../../components/ErrorState/ErrorState.jsx";
import StarRating from "../../../components/common/StarRating.jsx";
import "./style.scss";

const formatDateTime = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

function ReviewOrderPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedProductId, setSelectedProductId] = useState("");
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState("");
    const [feedbackType, setFeedbackType] = useState("success");
    const [submitted, setSubmitted] = useState(false);

    const reviewableItems = useMemo(() => Array.isArray(order?.items) ? order.items : [], [order]);

    const loadOrder = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await getOrder(id);
            const orderData = response.data ?? null;
            setOrder(orderData);

            const firstItem = Array.isArray(orderData?.items) ? orderData.items[0] : null;
            setSelectedProductId(firstItem?.productId ? String(firstItem.productId) : "");
        } catch (loadError) {
            setOrder(null);
            setError(loadError?.message || "Không thể tải đơn hàng để đánh giá.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadOrder();
    }, [loadOrder]);

    useEffect(() => {
        if (!feedback) return undefined;

        const timer = setTimeout(() => setFeedback(""), 2500);
        return () => clearTimeout(timer);
    }, [feedback]);

    const selectedItem = useMemo(
        () => reviewableItems.find((item) => String(item.productId) === String(selectedProductId)) ?? null,
        [reviewableItems, selectedProductId]
    );

    const canReview = order?.status === "delivered";

    const handleSubmit = async (event) => {
        event.preventDefault();
        setFeedback("");

        if (!selectedProductId) {
            setFeedbackType("error");
            setFeedback("Vui lòng chọn sản phẩm muốn đánh giá.");
            return;
        }

        if (!comment.trim()) {
            setFeedbackType("error");
            setFeedback("Vui lòng nhập nội dung đánh giá.");
            return;
        }

        setSubmitting(true);

        try {
            await reviewService.create(Number(selectedProductId), {
                orderId: order.id,
                rating,
                comment,
            });

            setSubmitted(true);
            setFeedbackType("success");
            setFeedback("Đã gửi đánh giá thành công.");
            navigate(`/don-hang/${id}`, {
                replace: true,
                state: { reviewSuccess: true },
            });
        } catch (submitError) {
            setFeedbackType("error");
            setFeedback(submitError?.message || "Không thể gửi đánh giá.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <PageLoading title="Đang tải đơn hàng" description="Mình đang lấy dữ liệu để mở form đánh giá." />;
    }

    if (error) {
        return <ErrorState title="Không mở được form đánh giá" description={error} />;
    }

    if (!order) {
        return <ErrorState title="Không tìm thấy đơn hàng" description="Đơn hàng không tồn tại hoặc đã bị xóa." />;
    }

    if (!canReview) {
        return (
            <div className="review-order-page">
                <div className="review-order-card review-order-card--locked">
                    <FiAlertCircle className="review-order-card__icon" />
                    <h1>Chỉ có thể đánh giá đơn đã giao</h1>
                    <p>Đơn hàng này chưa ở trạng thái đã giao nên chưa thể gửi review.</p>
                    <div className="review-order-actions">
                        <Link to={`/don-hang/${id}`} className="review-order-back-btn">
                            <FiChevronLeft />
                            Về chi tiết đơn hàng
                        </Link>
                        <Link to="/don-hang" className="review-order-home-btn">
                            Về danh sách đơn hàng
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="review-order-page">
                <div className="review-order-card review-order-card--locked">
                    <span className="review-order-success-icon" aria-hidden="true">✓</span>
                    <h1>Đánh giá đã được gửi</h1>
                    <p>Cảm ơn bạn đã chia sẻ cảm nhận. Hệ thống đang đưa bạn về chi tiết đơn hàng.</p>
                    <div className="review-order-actions">
                        <Link to={`/don-hang/${id}`} className="review-order-back-btn">
                            <FiChevronLeft />
                            Về chi tiết đơn hàng
                        </Link>
                        <Link to="/don-hang" className="review-order-home-btn">
                            Về danh sách đơn hàng
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="review-order-page">
            <div className="review-order-layout">
                <div className="review-order-card">
                    <div className="review-order-header">
                        <div>
                            <span className="review-order-eyebrow">Đánh giá đơn hàng</span>
                            <h1>Mã đơn: {order.orderCode}</h1>
                            <p>
                                Đơn giao lúc {formatDateTime(order.createdAt)}
                            </p>
                        </div>
                        <Link to={`/don-hang/${id}`} className="review-order-back-link">
                            <FiChevronLeft />
                            Quay lại
                        </Link>
                    </div>

                    <div className="review-order-products">
                        <h2><FiPackage /> Chọn sản phẩm muốn đánh giá</h2>
                        <div className="review-order-product-list">
                            {reviewableItems.map((item) => {
                                const active = String(item.productId) === String(selectedProductId);

                                return (
                                    <button
                                        key={item.id ?? item.productId}
                                        type="button"
                                        className={`review-order-product ${active ? "active" : ""}`}
                                        onClick={() => setSelectedProductId(String(item.productId))}
                                    >
                                        {item.image ? <img src={item.image} alt={item.name} /> : <div className="review-order-product__image" />}
                                        <div className="review-order-product__meta">
                                            <strong>{item.name}</strong>
                                            <span>{item.color} / {item.size} · SL: {item.quantity}</span>
                                            <span>{formatVND(item.price * (item.quantity || 1))}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <form className="review-order-form" onSubmit={handleSubmit}>
                        <div className="review-order-form__selected">
                            <span>Sản phẩm đang đánh giá</span>
                            <strong>{selectedItem?.name ?? "Chưa chọn sản phẩm"}</strong>
                        </div>

                        <div className="review-order-rating">
                            <span>Đánh giá</span>
                            <StarRating value={rating} onChange={setRating} />
                        </div>

                        <label className="review-order-comment">
                            <span>Nội dung đánh giá</span>
                            <textarea
                                rows="5"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
                            />
                        </label>

                        {feedback && <p className={`review-order-feedback ${feedbackType}`}>{feedback}</p>}

                        <div className="review-order-actions">
                            <button type="submit" className="review-order-submit" disabled={submitting || reviewableItems.length === 0}>
                                {submitting ? "Đang gửi..." : "Gửi đánh giá"}
                            </button>
                            <button type="button" className="review-order-cancel" onClick={() => navigate("/don-hang")}>
                                Hủy
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default ReviewOrderPage;
