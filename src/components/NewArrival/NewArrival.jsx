import "./NewArrival.scss";
import { productService } from "../../services/productService.js";
import { formatVND } from "../../utils/format.js";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageLoading from "../PageLoading/PageLoading.jsx";
function NewArrival() {
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
        return <PageLoading compact title="Đang tải NEW ARRIVAL" description="Danh sách sản phẩm mới đang được lấy từ API." />;
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

    const visibleProducts = products.slice(
        startIndex,
        startIndex + ITEMS_PER_PAGE
    );

    return (
        <div className="new-arrival">

            <div className="header">
                <h2>NEW ARRIVAL</h2>
                <Link to="/san-pham">
                    <button>Xem tất cả</button>
                </Link>
            </div>

            <div className="slider">

                <button className="arrow left" onClick={prev} disabled={startIndex === 0}>‹</button>

                <div className="list">
                    {visibleProducts.map((item) => (
                        <Link to={`/san-pham/${item.id}`} key={item.id}>
                            <div className="card">

                                <div className="image">
                                    {item.img ? <img src={item.img} alt={item.name} /> : null}
                                </div>

                                <p className="name">{item.name}</p>
                                <p className="price">
                                    {formatVND(item.price)}
                                </p>

                            </div>
                        </Link>
                    ))}
                </div>

                <button className="arrow right" onClick={next} disabled={startIndex + ITEMS_PER_PAGE >= products.length}>›</button>

            </div>
        </div>
    );
}
export default NewArrival;