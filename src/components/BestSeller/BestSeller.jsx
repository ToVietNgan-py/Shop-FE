import "./BestSeller.scss";
import { productService } from "../../services/productService.js";
import { formatVND } from "../../utils/format.js";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageLoading from "../PageLoading/PageLoading.jsx";
import WishlistButton from "../common/WishlistButton.jsx";
import ProductQuickActions from "../common/ProductQuickActions.jsx";

function BestSeller() {
    const [startIndex, setStartIndex] = useState(0);
    const [products, setProducts] = useState([]);
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

        return () => {
            isMounted = false;
        };
    }, []);

    if (isLoading) {
        return <PageLoading compact title="Đang tải BEST SELLER" description="Danh sách sản phẩm nổi bật đang được lấy từ API." />;
    }

    const next = () => {
        if (startIndex + ITEMS_PER_PAGE < products.length) {
            setStartIndex(startIndex + ITEMS_PER_PAGE);
        }
    };

    const prev = () => {
        if (startIndex - ITEMS_PER_PAGE >= 0) {
            setStartIndex(startIndex - ITEMS_PER_PAGE);
        }
    };

    const visibleProducts = products.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    return (
        <div className="best-seller">
            <div className="header">
                <h2>BEST SELLER</h2>
                <Link to="/san-pham">
                    <button>Xem tất cả</button>
                </Link>
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

export default BestSeller;
