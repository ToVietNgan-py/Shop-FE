import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { productService } from "../../services/productService.js";
import { formatVND } from "../../utils/format.js";
import PageLoading from "../PageLoading/PageLoading.jsx";
import WishlistButton from "../common/WishlistButton.jsx";
import ProductQuickActions from "../common/ProductQuickActions.jsx";
import QuickShopModal from "../QuickShopModal/QuickShopModal.jsx";
import "./BestSeller.scss";

function BestSeller() {
    const [startIndex, setStartIndex] = useState(0);
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [quickShopProduct, setQuickShopProduct] = useState(null); // ← modal state
    const [quickActionType, setQuickActionType] = useState("cart");
    const ITEMS_PER_PAGE = 4;

    useEffect(() => {
        let isMounted = true;

        async function loadProducts() {
            setIsLoading(true);
            const result = await productService.list({ sortBy: "featured", limit: 8, page: 1 });
            if (isMounted) {
                setProducts(result.data);
                setIsLoading(false);
            }
        }

        loadProducts();
        return () => { isMounted = false; };
    }, []);

    if (isLoading) {
        return <PageLoading compact title="Đang tải BEST SELLER" description="Danh sách sản phẩm nổi bật đang được lấy từ API." />;
    }

    const next = () => {
        if (startIndex + ITEMS_PER_PAGE < products.length) setStartIndex(startIndex + ITEMS_PER_PAGE);
    };
    const prev = () => {
        if (startIndex - ITEMS_PER_PAGE >= 0) setStartIndex(startIndex - ITEMS_PER_PAGE);
    };

    const visibleProducts = products.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    return (
        <>
            <div className="best-seller">
                <div className="header">
                    <h2>BEST SELLER</h2>
                    <Link to="/san-pham"><button>Xem tất cả</button></Link>
                </div>

                <div className="slider">
                    <button className="arrow left" onClick={prev} disabled={startIndex === 0}>‹</button>

                    <div className="list">
                        {visibleProducts.map((item) => (
                            <div key={item.id} style={{ position: "relative" }}>
                                <WishlistButton product={item} />
                                <div className="card">
                                    <Link to={`/san-pham/${item.id}`} className="card-main">
                                        <div className="image">
                                            {item.img ? <img src={item.img} alt={item.name} /> : null}
                                        </div>
                                        <p className="name">{item.name}</p>
                                        <p className="price">{formatVND(item.price)}</p>
                                    </Link>
                                    {/* Truyền onQuickShop để mở modal thay vì navigate */}
                                    <ProductQuickActions
                                        product={item}
                                        onAddToCart={(product) => {
                                            setQuickActionType("cart");
                                            setQuickShopProduct(product);
                                        }}
                                        onBuyNow={(product) => {
                                            setQuickActionType("buy");
                                            setQuickShopProduct(product);
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <button className="arrow right" onClick={next} disabled={startIndex + ITEMS_PER_PAGE >= products.length}>›</button>
                </div>
            </div>

            {/* Modal chọn màu/size — chỉ render khi có product được chọn */}
            {quickShopProduct && (
                <QuickShopModal
                    product={quickShopProduct}
                    actionType={quickActionType}
                    onClose={() => setQuickShopProduct(null)}
                />
            )}
        </>
    );
}

export default BestSeller;