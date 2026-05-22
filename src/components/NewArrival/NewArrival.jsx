import "./NewArrival.scss";
import { productService } from "../../services/productService.js";
import { formatVND } from "../../utils/format.js";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageLoading from "../PageLoading/PageLoading.jsx";
import WishlistButton from "../common/WishlistButton.jsx";
import ProductQuickActions from "../common/ProductQuickActions.jsx";
import { promotionUtils } from "../../services/promotionService.js";

function NewArrival() {
    const [startIndex, setStartIndex] = useState(0);
    const [products, setProducts] = useState([]);
    const [promoMap, setPromoMap] = useState(new Map());
    const [globalPromos, setGlobalPromos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

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

    useEffect(() => {
        let alive = true;
        (async () => {
            const list = await promotionUtils.fetchPromotionCatalog().catch(() => []);
            if (!alive) return;
            const map = new Map();
            const globals = [];
            for (const p of list) {
                if (p.products?.length > 0) {
                    for (const pr of p.products) {
                        const pid = Number(pr.id ?? pr.product_id ?? pr);
                        if (!isNaN(pid)) map.set(pid, p);
                    }
                } else {
                    globals.push(p);
                }
            }
            setPromoMap(map);
            setGlobalPromos(globals);
        })();
        return () => { alive = false; };
    }, []);

    if (isLoading) {
        return <PageLoading compact title="Đang tải NEW ARRIVAL" description="Danh sách sản phẩm mới đang được lấy từ API." />;
    }

    const next = () => { if (startIndex + ITEMS_PER_PAGE < products.length) setStartIndex(startIndex + ITEMS_PER_PAGE); };
    const prev = () => { if (startIndex - ITEMS_PER_PAGE >= 0) setStartIndex(startIndex - ITEMS_PER_PAGE); };
    const visibleProducts = products.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const renderPrice = (item) => {
        const allPromos = [
            ...(promoMap.has(item.id) ? [promoMap.get(item.id)] : []),
            ...globalPromos,
        ];
        const promo = promotionUtils.estimateProductPromotion(item, allPromos);
        if (promo?.discountAmount > 0) {
            return (
                <div className="price-block">
                    <span className="price-sale">{formatVND(promo.finalPrice)}</span>
                    <span className="price-original">{formatVND(item.price)}</span>
                    <span className="price-badge">
                        {promo.promo.type === "percent"
                            ? `-${promo.promo.value}%`
                            : `Giảm ${Number(promo.promo.value).toLocaleString("vi-VN")}đ`}
                    </span>
                </div>
            );
        }
        return <p className="price">{formatVND(item.price)}</p>;
    };

    return (
        <div className="new-arrival">
            <div className="header">
                <h2>NEW ARRIVAL</h2>
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
                                    {renderPrice(item)}
                                </Link>
                                <ProductQuickActions product={item} />
                            </div>
                        </div>
                    ))}
                </div>

                <button className="arrow right" onClick={next} disabled={startIndex + ITEMS_PER_PAGE >= products.length}>›</button>
            </div>
        </div>
    );
}

export default NewArrival;