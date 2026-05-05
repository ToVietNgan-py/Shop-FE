import { useMemo, useState, useContext, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { CartContext } from "../../../context/CartContext";
import { productService } from "../../../services/productService.js";
import { formatVND } from "../../../utils/format.js";
import PageLoading from "../../../components/PageLoading/PageLoading.jsx";
import ErrorState from "../../../components/ErrorState/ErrorState.jsx";

import "./ProductDetail.scss";

function ProductDetail() {
    const { id } = useParams();
    const [selectedColor, setSelectedColor] = useState("Cream");
    const [selectedSize, setSelectedSize] = useState("S");
    const [quantity, setQuantity] = useState(1);
    const [addedSuccess, setAddedSuccess] = useState(false);
    const [cartActionError, setCartActionError] = useState("");

    const navigate = useNavigate();
    const { addToCart } = useContext(CartContext);

    const colors = useMemo(
        () => ["Cream", "Sky Blue", "Black"],
        []
    );

    const sizes = useMemo(() => ["S", "M", "L", "XL"], []);
    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

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
                    limit: 4
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

        window.scrollTo({
            top: 0,
            left: 0,
            behavior: "smooth"
        });

        loadProductDetail();

        return () => {
            isMounted = false;
        };
    }, [id]);

    useEffect(() => {
        if (addedSuccess) {
            const timer = setTimeout(() => setAddedSuccess(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [addedSuccess]);

    if (isLoading) {
        return <PageLoading title="Đang tải chi tiết sản phẩm" description="Đợi một chút, mình đang lấy dữ liệu từ API." />;
    }

    if (error) {
        return <ErrorState title="Không tải được sản phẩm" description={error} />;
    }

    const cartItem = {
        id: product.id,
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity,
        color: selectedColor,
        size: selectedSize
    };

    const handleAddToCart = async () => {
        setAddedSuccess(false);
        setCartActionError("");

        try {
            await addToCart(cartItem);
            setAddedSuccess(true);
        } catch (addError) {
            setCartActionError(addError?.message || "Khong the them san pham vao gio.");
        }
    };

    const handleBuyNow = async () => {
        setCartActionError("");

        try {
            await addToCart(cartItem);
            navigate("/thanh-toan");
        } catch (addError) {
            setCartActionError(addError?.message || "Khong the them san pham vao gio.");
        }
    };

    return (
        <>
            <section className="product-detail" aria-label="Chi tiết sản phẩm">
                <div className="product-media">
                    {product.image ? <img src={product.image} alt={product.name} className="main-image" /> : null}
                </div>

                <div className="product-info">
                    <p className="brand">Dear Róse</p>
                    <h1>{product.name}</h1>
                    <p className="price">{formatVND(product.price)}</p>

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
                        <button type="button" className={`btn secondary ${addedSuccess ? 'added-success' : ''}`} onClick={handleAddToCart}>Thêm vào giỏ</button>
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
            <div className="related-products-section">
                <h2>Sản phẩm cùng danh mục</h2>
                <div className="related-products-list">
                    {relatedProducts.map((item) => (
                        <Link to={`/san-pham/${item.id}`} key={item.id} className="related-product-card">
                            {item.image ? <img src={item.image} alt={item.name} /> : null}
                            <div>
                                <strong>{item.name}</strong>
                                <p>{formatVND(item.price)}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </>
    );

}

export default ProductDetail;
