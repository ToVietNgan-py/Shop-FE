import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { productService } from "../../services/productService.js";
import { formatVND } from "../../utils/format.js";
import { useFlashSale } from "../../context/FlashSaleContext.jsx";
import PageLoading from "../PageLoading/PageLoading.jsx";
import WishlistButton from "../common/WishlistButton.jsx";
import ProductQuickActions from "../common/ProductQuickActions.jsx";
import QuickShopModal from "../QuickShopModal/QuickShopModal.jsx";
import "./BestSeller.scss";

function BestSeller() {
    const [startIndex, setStartIndex] = useState(0);
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [quickShopProduct, setQuickShopProduct] = useState(null);
    const [quickActionType, setQuickActionType] = useState("cart");
    const ITEMS_PER_PAGE = 4;

    // ✅ FIX: lấy flash sale map để overlay giá
    const { getFlashInfo, isFlash } = useFlashSale();

    useEffect(() => {
        let isMounted = true;
        async function loadProducts() {
            setIsLoading(true);
            const result = await productService.list({ sortBy: "featured", limit: 8, page: 1 });
            if (isMounted) { setProducts(result.data); setIsLoading(false); }
        }
        loadProducts();
        return () => { isMounted = false; };
    }, []);

    if (isLoading) {
        return <PageLoading compact title="Đang tải BEST SELLER" description="Danh sách sản phẩm nổi bật đang được lấy từ API." />;
    }

    const next = () => { if (startIndex + ITEMS_PER_PAGE < products.length) setStartIndex(startIndex + ITEMS_PER_PAGE); };
    const prev = () => { if (startIndex - ITEMS_PER_PAGE >= 0) setStartIndex(startIndex - ITEMS_PER_PAGE); };
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
                        {visibleProducts.map((item) => {
                            // ✅ FIX: check flash sale cho từng sản phẩm
                            const flash = getFlashInfo(item.id);
                            const displayPrice = flash?.flash_price ?? item.price;
                            const hasFlash = isFlash(item.id);

                            return (
                                <div key={item.id} style={{ position: "relative" }}>
                                    <WishlistButton product={item} />
                                    <div className="card">
                                        <Link to={`/san-pham/${item.id}`} className="card-main">
                                            <div className="image" style={{ position: "relative" }}>
                                                {item.img ? <img src={item.img} alt={item.name} /> : null}
                                                {/* ✅ Badge flash sale */}
                                                {hasFlash && (
                                                    <span style={{
                                                        position: "absolute", top: 6, left: 6,
                                                        background: "#ff3b3b", color: "#fff",
                                                        fontSize: 11, fontWeight: 700,
                                                        padding: "2px 7px", borderRadius: 4,
                                                    }}>⚡ Flash</span>
                                                )}
                                            </div>
                                            <p className="name">{item.name}</p>
                                            {/* ✅ FIX: hiện giá flash + gạch giá gốc */}
                                            {hasFlash ? (
                                                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                                                    <p className="price" style={{ color: "#ff3b3b", margin: 0 }}>
                                                        {formatVND(displayPrice)}
                                                    </p>
                                                    <p style={{ margin: 0, fontSize: 12, color: "#999", textDecoration: "line-through" }}>
                                                        {formatVND(item.price)}
                                                    </p>
                                                </div>
                                            ) : (
                                                <p className="price">{formatVND(item.price)}</p>
                                            )}
                                        </Link>
                                        <ProductQuickActions
                                            product={{
                                                ...item,
                                                // ✅ FIX: truyền flashPrice để QuickShopModal dùng đúng giá
                                                flashPrice: hasFlash ? displayPrice : undefined,
                                            }}
                                            onAddToCart={(product) => { setQuickActionType("cart"); setQuickShopProduct(product); }}
                                            onBuyNow={(product) => { setQuickActionType("buy"); setQuickShopProduct(product); }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <button className="arrow right" onClick={next} disabled={startIndex + ITEMS_PER_PAGE >= products.length}>›</button>
                </div>
            </div>

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