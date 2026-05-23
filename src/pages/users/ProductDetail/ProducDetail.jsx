import { useMemo, useState, useContext, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { CartContext } from "../../../context/CartContext";
import { AuthContext } from "../../../context/AuthContext.jsx";
import { getOrders } from "../../../services/orderService.js";
import { productService } from "../../../services/productService.js";
import { reviewService } from "../../../services/reviewService.js";
import { formatVND } from "../../../utils/format.js";
import { useFlashSale } from "../../../context/FlashSaleContext.jsx"; // ✅ THÊM
import PageLoading from "../../../components/PageLoading/PageLoading.jsx";
import ErrorState from "../../../components/ErrorState/ErrorState.jsx";
import AuthModal from "../../../components/AuthModal/AuthModal.jsx";
import StarRating from "../../../components/common/StarRating.jsx";
import WishlistButton from "../../../components/common/WishlistButton.jsx";
import "./ProductDetail.scss";

const getColors = (variants) => [...new Set(variants.map((v) => v.color).filter(Boolean))];
const CLOTH_SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "2XL", "3XL"];
const sortSizes = (sizes) => {
    const allNumeric = sizes.every((s) => /^\d+(\.\d+)?$/.test(s.trim()));
    if (allNumeric) return [...sizes].sort((a, b) => Number(a) - Number(b));
    return [...sizes].sort((a, b) => {
        const ai = CLOTH_SIZE_ORDER.indexOf(a.toUpperCase());
        const bi = CLOTH_SIZE_ORDER.indexOf(b.toUpperCase());
        if (ai !== -1 && bi !== -1) return ai - bi;
        if (ai !== -1) return -1;
        if (bi !== -1) return 1;
        return a.localeCompare(b);
    });
};
const getSizesForColor = (variants, color) =>
    sortSizes([...new Set(variants.filter((v) => !color || v.color === color).map((v) => v.size).filter(Boolean))]);
const findVariant = (variants, color, size) =>
    variants.find((v) => v.color === color && v.size === size) ?? null;

function ProductDetail() {
    const { id } = useParams();
    const productId = Number(id);
    const navigate = useNavigate();
    const { addToCart } = useContext(CartContext);
    const { user } = useContext(AuthContext) ?? {};

    // ✅ Flash sale
    const { getFlashInfo, isFlash } = useFlashSale();

    const [product, setProduct] = useState(null);
    const [variants, setVariants] = useState([]);
    const [variantsLoading, setVariantsLoading] = useState(true);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedColor, setSelectedColor] = useState("");
    const [selectedSize, setSelectedSize] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [addedSuccess, setAddedSuccess] = useState(false);
    const [cartActionError, setCartActionError] = useState("");
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [pendingCartItem, setPendingCartItem] = useState(null);
    const [pendingAction, setPendingAction] = useState("");
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

    const colors = useMemo(() => getColors(variants), [variants]);
    const sizes = useMemo(() => getSizesForColor(variants, selectedColor), [variants, selectedColor]);
    const activeVariant = useMemo(() => findVariant(variants, selectedColor, selectedSize), [variants, selectedColor, selectedSize]);

    // ✅ FIX: Giá ưu tiên flash sale
    const flashInfo = getFlashInfo(productId);
    const hasFlash = isFlash(productId);
    const basePrice = activeVariant?.price || product?.price || 0;
    const displayPrice = hasFlash ? (flashInfo?.flash_price ?? basePrice) : basePrice;
    const originalPrice = hasFlash ? basePrice : null;

    const variantInventory = activeVariant?.inventory ?? 0;
    const isVariantSelected = variants.length === 0 || Boolean(activeVariant);

    useEffect(() => {
        let mounted = true;
        async function load() {
            setIsLoading(true); setVariantsLoading(true); setError("");
            try {
                const [detailResult] = await Promise.allSettled([productService.detail(id), Promise.resolve(null)]);
                if (!mounted) return;
                const detail = detailResult.status === "fulfilled" ? detailResult.value : null;
                if (!detail) throw new Error("Không tìm thấy sản phẩm");
                setProduct(detail);
                const variantList = Array.isArray(detail.variants) ? detail.variants : [];
                setVariants(variantList);
                setVariantsLoading(false);
                if (variantList.length > 0) {
                    const firstColor = variantList[0].color;
                    const firstSize = variantList.find((v) => v.color === firstColor)?.size ?? "";
                    setSelectedColor(firstColor);
                    setSelectedSize(firstSize);
                }
                const related = await productService.related({ category: detail.categorySlug || detail.category, excludeId: detail.id, limit: 4 }).catch(() => []);
                if (mounted) setRelatedProducts(related);
            } catch (err) {
                if (mounted) { setError(err?.message || "Không tải được chi tiết sản phẩm."); setProduct(null); setVariants([]); setRelatedProducts([]); }
            } finally {
                if (mounted) { setIsLoading(false); setVariantsLoading(false); }
            }
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
        load();
        return () => { mounted = false; };
    }, [id]);

    const handleColorChange = useCallback((color) => {
        setSelectedColor(color);
        const firstSize = variants.find((v) => v.color === color)?.size ?? "";
        setSelectedSize(firstSize);
    }, [variants]);

    useEffect(() => {
        let mounted = true;
        async function loadReviews() {
            setReviewsLoading(true); setReviewsError("");
            try {
                const result = await reviewService.list(id, { perPage: 10, page: 1 });
                if (mounted) { setReviews(result.items ?? []); setReviewSummary({ total: Number(result.total ?? 0), averageRating: Number(result.averageRating ?? 0), ratingBreakdown: Array.isArray(result.ratingBreakdown) ? result.ratingBreakdown : [] }); }
            } catch (err) {
                if (mounted) { setReviews([]); setReviewSummary({ total: 0, averageRating: 0, ratingBreakdown: [] }); setReviewsError(err?.message || "Không tải được đánh giá."); }
            } finally { if (mounted) setReviewsLoading(false); }
        }
        loadReviews();
        return () => { mounted = false; };
    }, [id]);

    useEffect(() => {
        let mounted = true;
        async function loadEligibleOrders() {
            if (!user || !productId) { setEligibleOrders([]); setSelectedOrderId(""); setOrdersLoading(false); return; }
            setOrdersLoading(true); setOrdersError("");
            try {
                const response = await getOrders();
                const orders = Array.isArray(response.data) ? response.data : [];
                const matched = orders.filter((order) => order.status === "completed" && Array.isArray(order.items) && order.items.some((item) => String(item.productId ?? item.id) === String(productId)));
                if (mounted) { setEligibleOrders(matched); setSelectedOrderId(matched[0]?.id ? String(matched[0].id) : ""); }
            } catch (err) {
                if (mounted) { setEligibleOrders([]); setSelectedOrderId(""); setOrdersError(err?.message || "Không tải được danh sách đơn hàng."); }
            } finally { if (mounted) setOrdersLoading(false); }
        }
        loadEligibleOrders();
        return () => { mounted = false; };
    }, [user, productId]);

    useEffect(() => { if (!addedSuccess) return; const t = setTimeout(() => setAddedSuccess(false), 2000); return () => clearTimeout(t); }, [addedSuccess]);
    useEffect(() => { if (!reviewFeedback) return; const t = setTimeout(() => setReviewFeedback(""), 2500); return () => clearTimeout(t); }, [reviewFeedback]);

    useEffect(() => {
        if (!user || !pendingCartItem) return;
        let mounted = true;
        (async () => {
            try {
                if (pendingAction === "buy-now") {
                    const item = pendingCartItem; setPendingCartItem(null); setPendingAction("");
                    navigate("/thanh-toan", { state: { checkoutItem: item, buyNow: true } }); return;
                }
                await addToCart(pendingCartItem);
                if (mounted) { setAddedSuccess(true); setPendingCartItem(null); setPendingAction(""); }
            } catch (err) {
                if (mounted) { setCartActionError(err?.message || "Không thể thêm sản phẩm vào giỏ."); setPendingCartItem(null); setPendingAction(""); }
            }
        })();
        return () => { mounted = false; };
    }, [user, pendingCartItem, pendingAction, addToCart, navigate]);

    // ✅ FIX: buildCartItem dùng displayPrice (đã bao gồm flash price)
    const buildCartItem = () => ({
        id: product.id,
        productId: product.id,
        name: product.name,
        price: displayPrice,
        image: product.img,
        quantity,
        color: selectedColor,
        size: selectedSize,
    });

    const handleAddToCart = async () => {
        setAddedSuccess(false); setCartActionError(""); setPendingAction("add-to-cart");
        if (!isVariantSelected) { setCartActionError("Vui lòng chọn màu sắc và size."); return; }
        if (variants.length > 0 && variantInventory === 0) { setCartActionError("Biến thể này đã hết hàng."); return; }
        const item = buildCartItem();
        if (!user) { setPendingCartItem(item); setIsAuthOpen(true); return; }
        try { await addToCart(item); setAddedSuccess(true); }
        catch (err) { setCartActionError(err?.message || "Không thể thêm sản phẩm vào giỏ."); }
    };

    const handleBuyNow = () => {
        setCartActionError(""); setPendingAction("buy-now");
        if (!isVariantSelected) { setCartActionError("Vui lòng chọn màu sắc và size."); return; }
        if (variants.length > 0 && variantInventory === 0) { setCartActionError("Biến thể này đã hết hàng."); return; }
        const item = buildCartItem();
        if (!user) { setPendingCartItem(item); setIsAuthOpen(true); return; }
        navigate("/thanh-toan", { state: { checkoutItem: item, buyNow: true } });
    };

    const handleReviewSubmit = async (event) => {
        event.preventDefault(); setReviewFeedback("");
        if (!user) { setIsAuthOpen(true); return; }
        if (!selectedOrderId) { setReviewFeedbackType("error"); setReviewFeedback("Hãy chọn một đơn hàng đã hoàn thành để đánh giá."); return; }
        if (!reviewComment.trim()) { setReviewFeedbackType("error"); setReviewFeedback("Vui lòng nhập nội dung đánh giá."); return; }
        setReviewSubmitting(true);
        try {
            const created = await reviewService.create(id, { orderId: selectedOrderId, rating: reviewRating, comment: reviewComment });
            setReviews((cur) => { const next = [created, ...cur]; const avg = next.reduce((s, r) => s + Number(r.rating || 0), 0) / next.length; setReviewSummary((s) => ({ ...s, total: next.length, averageRating: avg })); return next; });
            setReviewRating(5); setReviewComment(""); setReviewFeedbackType("success"); setReviewFeedback("Đã gửi đánh giá thành công.");
        } catch (err) { setReviewFeedbackType("error"); setReviewFeedback(err?.message || "Không thể gửi đánh giá."); }
        finally { setReviewSubmitting(false); }
    };

    const averageRating = useMemo(() => {
        if (reviews.length > 0) return reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / reviews.length;
        return Number(reviewSummary.averageRating || 0);
    }, [reviews, reviewSummary.averageRating]);
    const totalReviewCount = reviews.length > 0 ? reviews.length : reviewSummary.total;

    if (isLoading) return <PageLoading title="Đang tải chi tiết sản phẩm" description="Đợi một chút, mình đang lấy dữ liệu từ API." />;
    if (error) return <ErrorState title="Không tải được sản phẩm" description={error} />;

    const renderReviewForm = () => {
        if (!user) return (<div className="review-form review-form--locked"><h3>Đăng nhập để đánh giá</h3><p>Chỉ thành viên đã đăng nhập mới có thể gửi review.</p><button type="button" className="review-login-btn" onClick={() => setIsAuthOpen(true)}>Đăng nhập ngay</button></div>);
        if (ordersLoading) return <div className="review-form review-form--locked"><h3>Đang kiểm tra đơn hàng đủ điều kiện</h3></div>;
        if (ordersError) return <div className="review-form review-form--locked"><h3>Không thể tải đơn hàng</h3><p>{ordersError}</p></div>;
        if (eligibleOrders.length === 0) return (<div className="review-form review-form--locked"><h3>Chưa thể đánh giá sản phẩm này</h3><p>Bạn cần có ít nhất một đơn hàng đã hoàn thành chứa sản phẩm này.</p></div>);
        return (
            <form className="review-form" onSubmit={handleReviewSubmit}>
                <h3>Viết đánh giá của bạn</h3>
                <label className="review-select-field"><span>Chọn đơn hàng đã hoàn thành</span>
                    <select value={selectedOrderId} onChange={(e) => setSelectedOrderId(e.target.value)}>
                        {eligibleOrders.map((order) => (<option key={order.id} value={String(order.id)}>{order.orderCode} - {order.createdAt}</option>))}
                    </select>
                </label>
                <div className="review-rating-field"><span>Đánh giá</span><StarRating value={reviewRating} onChange={setReviewRating} /></div>
                <label className="review-comment-field"><span>Nội dung</span><textarea rows="5" value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..." /></label>
                {reviewFeedback && <p className={`review-feedback ${reviewFeedbackType}`}>{reviewFeedback}</p>}
                <button type="submit" className="review-submit-btn" disabled={reviewSubmitting}>{reviewSubmitting ? "Đang gửi..." : "Gửi đánh giá"}</button>
            </form>
        );
    };

    const renderReviewItems = () => {
        if (reviewsLoading) return <p className="review-empty">Đang tải đánh giá...</p>;
        if (reviewsError) return <p className="review-empty error">{reviewsError}</p>;
        if (reviews.length === 0) return (<div className="review-empty"><strong>Chưa có đánh giá nào</strong><p>Hãy là người đầu tiên chia sẻ cảm nhận cho sản phẩm này.</p></div>);
        return (
            <div className="review-list">
                {reviews.map((review) => (
                    <article key={review.id} className="review-item">
                        <div className="review-item__header">
                            <div className="review-avatar"><span>{(review.userName || "K").charAt(0).toUpperCase()}</span></div>
                            <div className="review-meta"><strong>{review.userName}</strong><div className="review-meta__rating"><StarRating value={Math.round(Number(review.rating || 0))} readonly size={16} /><span>{review.createdAt}</span></div></div>
                        </div>
                        <p className="review-item__comment">{review.comment}</p>
                        {Array.isArray(review.images) && review.images.length > 0 && (<div className="review-images">{review.images.map((img, idx) => <img key={`${review.id}-${idx}`} src={img} alt={`Review ${idx + 1}`} />)}</div>)}
                    </article>
                ))}
            </div>
        );
    };

    return (
        <>
            <section className="product-detail" aria-label="Chi tiết sản phẩm">
                <div className="product-media">
                    {product.img && <img src={product.img} alt={product.name} className="main-image" />}
                </div>
                <div className="product-info">
                    <p className="brand">{product.brand ?? "Dear Rose"}</p>
                    <h1>{product.name}</h1>

                    {/* ✅ FIX: Hiện giá flash + gạch giá gốc */}
                    {hasFlash ? (
                        <div className="price-wrap">
                            <p className="price price--flash">⚡ {formatVND(displayPrice)}</p>
                            <p className="price price--orig">{formatVND(originalPrice)}</p>
                        </div>
                    ) : (
                        <p className="price">{formatVND(displayPrice)}</p>
                    )}

                    {variantsLoading ? (<p className="variants-loading">Đang tải biến thể...</p>) : (
                        <>
                            {colors.length > 0 && (
                                <div className="option-group">
                                    <span className="option-label">Màu sắc</span>
                                    <div className="chip-list">
                                        {colors.map((color) => (<button key={color} type="button" className={`chip ${selectedColor === color ? "active" : ""}`} onClick={() => handleColorChange(color)}>{color}</button>))}
                                    </div>
                                </div>
                            )}
                            {sizes.length > 0 && (
                                <div className="option-group">
                                    <span className="option-label">Size</span>
                                    <div className="chip-list size-list">
                                        {sizes.map((size) => { const v = findVariant(variants, selectedColor, size); const outOfStock = v ? v.inventory === 0 : false; return (<button key={size} type="button" className={`chip ${selectedSize === size ? "active" : ""} ${outOfStock ? "out-of-stock" : ""}`} onClick={() => !outOfStock && setSelectedSize(size)} disabled={outOfStock} title={outOfStock ? "Hết hàng" : ""}>{size}</button>); })}
                                    </div>
                                </div>
                            )}
                            {activeVariant && (<p className={`variant-stock ${variantInventory === 0 ? "out" : "in"}`}>{variantInventory === 0 ? "Hết hàng" : `Còn ${variantInventory} sản phẩm`}</p>)}
                        </>
                    )}

                    <div className="qty-row">
                        <span className="option-label">Số lượng</span>
                        <div className="qty-control">
                            <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Giảm số lượng">-</button>
                            <span>{quantity}</span>
                            <button type="button" onClick={() => setQuantity((q) => (variantInventory > 0 ? Math.min(q + 1, variantInventory) : q + 1))} aria-label="Tăng số lượng">+</button>
                        </div>
                    </div>

                    <div className="action-list">
                        <button type="button" className={`btn secondary ${addedSuccess ? "added-success" : ""}`} onClick={handleAddToCart} disabled={variants.length > 0 && variantInventory === 0}>
                            {addedSuccess ? "Đã thêm vào giỏ ✓" : "Thêm vào giỏ"}
                        </button>
                        <button type="button" className="btn primary" onClick={handleBuyNow} disabled={variants.length > 0 && variantInventory === 0}>Mua ngay</button>
                    </div>
                    {cartActionError && <p className="field-message error">{cartActionError}</p>}

                    <div className="meta-list">
                        <div className="meta-item"><span>Thông tin sản phẩm</span><p>{product.description}</p></div>
                        <div className="meta-item"><span>Chính sách vận chuyển</span><p>Giao hàng tiêu chuẩn từ 2 - 4 ngày.</p></div>
                        <div className="meta-item"><span>Chính sách đổi trả</span><p>Hỗ trợ đổi trả trong vòng 14 ngày nếu sản phẩm còn nguyên tag.</p></div>
                    </div>
                </div>
            </section>

            <section className="dr-reviews-section" aria-label="Đánh giá sản phẩm">
                <div className="dr-reviews-header">
                    <div className="dr-header-title"><span className="dr-kicker">Phản hồi khách hàng</span><h2>Đánh giá sản phẩm</h2></div>
                    <div className="dr-score-badge"><span className="dr-big-num">{averageRating.toFixed(1)}</span><div className="dr-score-meta"><StarRating value={Math.round(averageRating)} readonly size={15} /><span className="dr-total-text">Dựa trên {totalReviewCount} nhận xét</span></div></div>
                </div>
                <div className="dr-reviews-body">
                    <aside className="dr-reviews-sidebar">{renderReviewForm()}</aside>
                    <main className="dr-reviews-main"><div className="dr-list-title"><h3>Nhận xét thực tế ({reviews.length})</h3></div>{renderReviewItems()}</main>
                </div>
            </section>

            <div className="related-products-section">
                <h2>Sản phẩm cùng danh mục</h2>
                <div className="related-products-list">
                    {relatedProducts.map((item) => (
                        <div key={item.id} className="related-product-shell">
                            <WishlistButton product={item} />
                            <Link to={`/san-pham/${item.id}`} className="related-product-card">
                                {item.img && <img src={item.img} alt={item.name} />}
                                <div><strong>{item.name}</strong><p>{formatVND(item.price)}</p></div>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>

            {isAuthOpen && <AuthModal onClose={() => setIsAuthOpen(false)} />}
        </>
    );
}

export default ProductDetail;