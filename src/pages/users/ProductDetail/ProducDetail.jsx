
import { useMemo, useState, useContext, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { CartContext } from "../../../context/CartContext";
import { AuthContext } from "../../../context/AuthContext.jsx";
import { getOrders } from "../../../services/orderService.js";
import { productService } from "../../../services/productService.js";
import { reviewService } from "../../../services/reviewService.js";
import { formatVND } from "../../../utils/format.js";
import PageLoading from "../../../components/PageLoading/PageLoading.jsx";
import ErrorState from "../../../components/ErrorState/ErrorState.jsx";
import AuthModal from "../../../components/AuthModal/AuthModal.jsx";
import StarRating from "../../../components/common/StarRating.jsx";
import WishlistButton from "../../../components/common/WishlistButton.jsx";
import { promotionUtils } from "../../../services/promotionService.js";
import "./ProductDetail.scss";

function ProductDetail() {
    const { id } = useParams();
    const productId = Number(id);
    const [selectedColor, setSelectedColor] = useState("Cream");
    const [selectedSize, setSelectedSize] = useState("S");
    const [quantity, setQuantity] = useState(1);
    const [addedSuccess, setAddedSuccess] = useState(false);
    const [cartActionError, setCartActionError] = useState("");
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [pendingCartItem, setPendingCartItem] = useState(null);
    const [pendingAction, setPendingAction] = useState("");
    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [promoResult, setPromoResult] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [reviewSummary, setReviewSummary] = useState({ total: 0, averageRating: 0, ratingBreakdown: [] });
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [reviewsError, setReviewsError] = useState("");
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState("");
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [reviewFeedback, setReviewFeedback] = useState("");
    const [reviewFeedbackType, setReviewFeedbackType] = useState("success");
    const [eligibleOrders, setEligibleOrders] = useState([]);
    const [selectedOrderId, setSelectedOrderId] = useState("");
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [ordersError, setOrdersError] = useState("");

    const navigate = useNavigate();
    const { addToCart } = useContext(CartContext);
    const { user } = useContext(AuthContext) ?? {};

    const colors = useMemo(() => ["Cream", "Sky Blue", "Black"], []);
    const sizes = useMemo(() => ["S", "M", "L", "XL"], []);

    const averageRating = useMemo(() => {
        if (reviews.length > 0) {
            const total = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
            return total / reviews.length;
        }

        return Number(reviewSummary.averageRating || 0);
    }, [reviews, reviewSummary.averageRating]);

    const totalReviewCount = reviews.length > 0 ? reviews.length : reviewSummary.total;

    const decreaseQuantity = () => {
        setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
    };

    const increaseQuantity = () => {
        setQuantity((prev) => prev + 1);
    };

    useEffect(() => {
        let isMounted = true;

        async function loadProductDetail() {
            setIsLoading(true);
            setError("");

            try {
                const detail = await productService.detail(id);

                if (!detail) {
                    throw new Error("Không tìm thấy sản phẩm");
                }

                const related = await productService.related({
                    category: detail.categorySlug || detail.category,
                    excludeId: detail.id,
                    limit: 4,
                });

                if (isMounted) {
                    setProduct(detail);
                    setRelatedProducts(related);
                }
            } catch (loadError) {
                if (isMounted) {
                    setError(loadError?.message || "Không tải được chi tiết sản phẩm.");
                    setProduct(null);
                    setRelatedProducts([]);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
        loadProductDetail();

        return () => {
            isMounted = false;
        };
    }, [id]);

    useEffect(() => {
        if (!product) return;
        let alive = true;
        (async () => {
            const list = await promotionUtils.fetchPromotionCatalog().catch(() => []);
            if (!alive) return;
            const result = promotionUtils.estimateProductPromotion(product, list);
            setPromoResult(result);
        })();
        return () => { alive = false; };
    }, [product]);

    useEffect(() => {
        let isMounted = true;

        async function loadReviews() {
            setReviewsLoading(true);
            setReviewsError("");

            try {
                const result = await reviewService.list(id, { perPage: 10, page: 1 });

                if (isMounted) {
                    setReviews(result.items ?? []);
                    setReviewSummary({
                        total: Number(result.total ?? 0),
                        averageRating: Number(result.averageRating ?? 0),
                        ratingBreakdown: Array.isArray(result.ratingBreakdown) ? result.ratingBreakdown : [],
                    });
                }
            } catch (loadError) {
                if (isMounted) {
                    setReviews([]);
                    setReviewSummary({ total: 0, averageRating: 0, ratingBreakdown: [] });
                    setReviewsError(loadError?.message || "Không tải được đánh giá.");
                }
            } finally {
                if (isMounted) {
                    setReviewsLoading(false);
                }
            }
        }

        loadReviews();

        return () => {
            isMounted = false;
        };
    }, [id]);

    useEffect(() => {
        let isMounted = true;

        async function loadEligibleOrders() {
            if (!user || !productId) {
                if (isMounted) {
                    setEligibleOrders([]);
                    setSelectedOrderId("");
                    setOrdersLoading(false);
                }
                return;
            }

            setOrdersLoading(true);
            setOrdersError("");

            try {
                const response = await getOrders();
                const orders = Array.isArray(response.data) ? response.data : [];
                const matchedOrders = orders.filter((order) => {
                    if (order.status !== "completed") {
                        return false;
                    }

                    return Array.isArray(order.items) && order.items.some((item) => String(item.productId ?? item.id) === String(productId));
                });

                if (isMounted) {
                    setEligibleOrders(matchedOrders);
                    setSelectedOrderId(matchedOrders[0]?.id ? String(matchedOrders[0].id) : "");
                }
            } catch (loadError) {
                if (isMounted) {
                    setEligibleOrders([]);
                    setSelectedOrderId("");
                    setOrdersError(loadError?.message || "Không tải được danh sách đơn hàng đủ điều kiện.");
                }
            } finally {
                if (isMounted) {
                    setOrdersLoading(false);
                }
            }
        }

        loadEligibleOrders();

        return () => {
            isMounted = false;
        };
    }, [user, productId]);

    useEffect(() => {
        if (addedSuccess) {
            const timer = setTimeout(() => setAddedSuccess(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [addedSuccess]);

    useEffect(() => {
        if (reviewFeedback) {
            const timer = setTimeout(() => setReviewFeedback(""), 2500);
            return () => clearTimeout(timer);
        }
    }, [reviewFeedback]);

    useEffect(() => {
        if (!user || !pendingCartItem) {
            return;
        }

        let isMounted = true;

        (async () => {
            try {
                // Buy-now sau khi đăng nhập: đi thẳng tới checkout riêng, không thêm vào giỏ.
                if (pendingAction === "buy-now") {
                    if (isMounted) {
                        const item = pendingCartItem;
                        setPendingCartItem(null);
                        setPendingAction("");
                        navigate("/thanh-toan", { state: { checkoutItem: item, buyNow: true } });
                    }
                    return;
                }

                await addToCart(pendingCartItem);

                if (isMounted) {
                    setAddedSuccess(true);
                    setPendingCartItem(null);
                    setPendingAction("");
                }
            } catch (addError) {
                if (isMounted) {
                    setCartActionError(addError?.message || "Khong the them san pham vao gio.");
                    setPendingCartItem(null);
                    setPendingAction("");
                }
            }
        })();

        return () => {
            isMounted = false;
        };
    }, [user, pendingCartItem, pendingAction, addToCart, navigate]);

    if (isLoading) {
        return <PageLoading title="Đang tải chi tiết sản phẩm" description="Đợi một chút, mình đang lấy dữ liệu từ API." />;
    }

    if (error) {
        return <ErrorState title="Không tải được sản phẩm" description={error} />;
    }

    // const cartItem = {
    //     id: product.id,
    //     productId: product.id,
    //     name: product.name,
    //     price: product.price,
    //     image: product.img,
    //     quantity,
    //     color: selectedColor,
    //     size: selectedSize,
    // };
    const cartItem = {
        id: product.id,
        productId: product.id,
        name: product.name,
        price: promoResult?.finalPrice ?? product.price,      // ← giá sau giảm
        originalPrice: product.price,                          // ← giá gốc lưu lại
        image: product.img,
        quantity,
        color: selectedColor,
        size: selectedSize,
    };
    const handleAddToCart = async () => {
        setAddedSuccess(false);
        setCartActionError("");
        setPendingAction("add-to-cart");

        if (!user) {
            setPendingCartItem(cartItem);
            setIsAuthOpen(true);
            return;
        }

        try {
            await addToCart(cartItem);
            setAddedSuccess(true);
        } catch (addError) {
            setCartActionError(addError?.message || "Khong the them san pham vao gio.");
        }
    };

    const handleBuyNow = () => {
        setCartActionError("");
        setPendingAction("buy-now");

        if (!user) {
            setPendingCartItem(cartItem);
            setIsAuthOpen(true);
            return;
        }

        // Mua ngay = luồng thanh toán riêng cho duy nhất sản phẩm này.
        // Không addToCart để tránh trộn vào giỏ hàng hiện tại; truyền item qua route state.
        navigate("/thanh-toan", { state: { checkoutItem: cartItem, buyNow: true } });
    };

    const handleReviewSubmit = async (event) => {
        event.preventDefault();
        setReviewFeedback("");

        if (!user) {
            setIsAuthOpen(true);
            setReviewFeedbackType("error");
            setReviewFeedback("Vui lòng đăng nhập để viết đánh giá.");
            return;
        }

        if (!selectedOrderId) {
            setReviewFeedbackType("error");
            setReviewFeedback("Hãy chọn một đơn hàng đã hoàn thành để đánh giá.");
            return;
        }

        if (!reviewComment.trim()) {
            setReviewFeedbackType("error");
            setReviewFeedback("Vui lòng nhập nội dung đánh giá.");
            return;
        }

        setReviewSubmitting(true);

        try {
            const createdReview = await reviewService.create(id, {
                orderId: selectedOrderId,
                rating: reviewRating,
                comment: reviewComment,
            });

            setReviews((current) => {
                const next = [createdReview, ...current];
                const nextAverage = next.reduce((sum, review) => sum + Number(review.rating || 0), 0) / next.length;

                setReviewSummary((currentSummary) => ({
                    ...currentSummary,
                    total: next.length,
                    averageRating: nextAverage,
                }));

                return next;
            });

            setReviewRating(5);
            setReviewComment("");
            setReviewFeedbackType("success");
            setReviewFeedback("Đã gửi đánh giá thành công.");
        } catch (submitError) {
            setReviewFeedbackType("error");
            setReviewFeedback(submitError?.message || "Không thể gửi đánh giá.");
        } finally {
            setReviewSubmitting(false);
        }
    };

    const renderReviewForm = () => {
        if (!user) {
            return (
                <div className="review-form review-form--locked">
                    <h3>Đăng nhập để đánh giá</h3>
                    <p>Chỉ thành viên đã đăng nhập mới có thể gửi review.</p>
                    <button type="button" className="review-login-btn" onClick={() => setIsAuthOpen(true)}>
                        Đăng nhập ngay
                    </button>
                </div>
            );
        }

        if (ordersLoading) {
            return (
                <div className="review-form review-form--locked">
                    <h3>Đang kiểm tra đơn hàng đủ điều kiện</h3>
                    <p>Mình đang tìm các đơn đã hoàn thành có chứa sản phẩm này.</p>
                </div>
            );
        }

        if (ordersError) {
            return (
                <div className="review-form review-form--locked">
                    <h3>Không thể tải đơn hàng</h3>
                    <p>{ordersError}</p>
                </div>
            );
        }

        if (eligibleOrders.length === 0) {
            return (
                <div className="review-form review-form--locked">
                    <h3>Chưa thể đánh giá sản phẩm này</h3>
                    <p>Bạn cần có ít nhất một đơn hàng đã hoàn thành chứa sản phẩm này thì mới gửi review được.</p>
                </div>
            );
        }

        return (
            <form className="review-form" onSubmit={handleReviewSubmit}>
                <h3>Viết đánh giá của bạn</h3>

                <label className="review-select-field">
                    <span>Chọn đơn hàng đã hoàn thành</span>
                    <select value={selectedOrderId} onChange={(event) => setSelectedOrderId(event.target.value)}>
                        {eligibleOrders.map((order) => (
                            <option key={order.id} value={String(order.id)}>
                                {order.orderCode} - {order.createdAt}
                            </option>
                        ))}
                    </select>
                </label>

                <div className="review-rating-field">
                    <span>Đánh giá</span>
                    <StarRating value={reviewRating} onChange={setReviewRating} />
                </div>

                <label className="review-comment-field">
                    <span>Nội dung</span>
                    <textarea
                        rows="5"
                        value={reviewComment}
                        onChange={(event) => setReviewComment(event.target.value)}
                        placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
                    />
                </label>

                {reviewFeedback ? (
                    <p className={`review-feedback ${reviewFeedbackType}`}>{reviewFeedback}</p>
                ) : null}

                <button type="submit" className="review-submit-btn" disabled={reviewSubmitting}>
                    {reviewSubmitting ? "Đang gửi..." : "Gửi đánh giá"}
                </button>
            </form>
        );
    };

    const renderReviewItems = () => {
        if (reviewsLoading) {
            return <p className="review-empty">Đang tải đánh giá...</p>;
        }

        if (reviewsError) {
            return <p className="review-empty error">{reviewsError}</p>;
        }

        if (reviews.length === 0) {
            return (
                <div className="review-empty">
                    <strong>Chưa có đánh giá nào</strong>
                    <p>Hãy là người đầu tiên chia sẻ cảm nhận cho sản phẩm này.</p>
                </div>
            );
        }

        // return (
        //     <div className="review-list">
        //         {reviews.map((review) => (
        //             <article key={review.id} className="review-item">
        //                 <div className="review-item__header">
        //                     <div className="review-avatar">
        //                         <span>{(review.userName || "K").charAt(0).toUpperCase()}</span>
        //                     </div>
        //                     <div className="review-meta">
        //                         <strong>{review.userName}</strong>
        //                         <div className="review-meta__rating">
        //                             <StarRating value={Math.round(Number(review.rating || 0))} readonly size={16} />
        //                             <span>{review.createdAt}</span>
        //                         </div>
        //                     </div>
        //                 </div>
        //                 <p className="review-item__comment">{review.comment}</p>
        //                 {Array.isArray(review.images) && review.images.length > 0 ? (
        //                     <div className="review-images">
        //                         {review.images.map((image, index) => (
        //                             <img key={`${review.id}-image-${index}`} src={image} alt={`Review ${index + 1}`} />
        //                         ))}
        //                     </div>
        //                 ) : null}
        //             </article>
        //         ))}
        //     </div>
        // );
    };

    return (
        <>
            <section className="product-detail" aria-label="Chi tiết sản phẩm">
                <div className="product-media">
                    {product.img ? <img src={product.img} alt={product.name} className="main-image" /> : null}
                </div>

                <div className="product-info">
                    <p className="brand">Dear Róse</p>
                    <h1>{product.name}</h1>
                    {/* <p className="price">{formatVND(product.price)}</p> */}

                    {promoResult && promoResult.discountAmount > 0 ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                            <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "#e91e63" }}>
                                {formatVND(promoResult.finalPrice)}
                            </span>
                            <span style={{ fontSize: "1rem", color: "#9ca3af", textDecoration: "line-through" }}>
                                {formatVND(product.price)}
                            </span>
                            <span style={{
                                background: "#fef2f2", color: "#e91e63", border: "1px solid #fecaca",
                                borderRadius: 6, padding: "2px 8px", fontSize: "0.82rem", fontWeight: 700
                            }}>
                                {promoResult.promo.type === "percent"
                                    ? `-${promoResult.promo.value}%`
                                    : `Giảm ${Number(promoResult.promo.value).toLocaleString("vi-VN")}đ`}
                            </span>
                        </div>
                    ) : (
                        <p className="price">{formatVND(product.price)}</p>
                    )}

                    <div className="option-group">
                        <span className="option-label">Màu sắc</span>
                        <div className="chip-list">
                            {colors.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    className={`chip ${selectedColor === color ? "active" : ""}`}
                                    onClick={() => setSelectedColor(color)}
                                >
                                    {color}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="option-group">
                        <span className="option-label">Size</span>
                        <div className="chip-list size-list">
                            {sizes.map((size) => (
                                <button
                                    key={size}
                                    type="button"
                                    className={`chip ${selectedSize === size ? "active" : ""}`}
                                    onClick={() => setSelectedSize(size)}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="qty-row">
                        <span className="option-label">Số lượng</span>
                        <div className="qty-control">
                            <button type="button" onClick={decreaseQuantity} aria-label="Giảm số lượng">-</button>
                            <span>{quantity}</span>
                            <button type="button" onClick={increaseQuantity} aria-label="Tăng số lượng">+</button>
                        </div>
                    </div>

                    <div className="action-list">
                        <button type="button" className={`btn secondary ${addedSuccess ? "added-success" : ""}`} onClick={handleAddToCart}>Thêm vào giỏ</button>
                        <button type="button" className="btn primary" onClick={handleBuyNow}>Mua ngay</button>
                    </div>
                    {cartActionError ? <p className="field-message error">{cartActionError}</p> : null}

                    <div className="meta-list">
                        <div className="meta-item">
                            <span>Thông tin sản phẩm</span>
                            <p>{product.description}</p>
                        </div>
                        <div className="meta-item">
                            <span>Chính sách vận chuyển</span>
                            <p>Giao hàng tiêu chuẩn từ 2 - 4 ngày.</p>
                        </div>
                        <div className="meta-item">
                            <span>Chính sách đổi trả</span>
                            <p>Hỗ trợ đổi trả trong vòng 14 ngày nếu sản phẩm còn nguyên tag.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="dr-reviews-section" aria-label="Đánh giá sản phẩm">
                <div className="dr-reviews-header">
                    <div className="dr-header-title">
                        <span className="dr-kicker">Phản hồi khách hàng</span>
                        <h2>Đánh giá sản phẩm</h2>
                    </div>
                    <div className="dr-score-badge">
                        <span className="dr-big-num">{averageRating.toFixed(1)}</span>
                        <div className="dr-score-meta">
                            <StarRating value={Math.round(averageRating)} readonly size={15} />
                            <span className="dr-total-text">Dựa trên {totalReviewCount} nhận xét</span>
                        </div>
                    </div>
                </div>

                <div className="dr-reviews-body">
                    <aside className="dr-reviews-sidebar">
                        {renderReviewForm()}
                    </aside>

                    <main className="dr-reviews-main">
                        <div className="dr-list-title">
                            <h3>Nhận xét thực tế ({reviews.length})</h3>
                        </div>
                        {renderReviewItems()}
                    </main>
                </div>

            </section>

            <div className="related-products-section">
                <h2>Sản phẩm cùng danh mục</h2>
                <div className="related-products-list">
                    {relatedProducts.map((item) => (
                        <div key={item.id} className="related-product-shell">
                            <WishlistButton product={item} />
                            <Link to={`/san-pham/${item.id}`} className="related-product-card">
                                {item.img ? <img src={item.img} alt={item.name} /> : null}
                                <div>
                                    <strong>{item.name}</strong>
                                    <p>{formatVND(item.price)}</p>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>

            {isAuthOpen ? <AuthModal onClose={() => setIsAuthOpen(false)} /> : null}
        </>
    );
}

export default ProductDetail;