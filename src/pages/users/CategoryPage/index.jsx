import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { categoryService } from "../../../services/categoryService.js";
import { productService } from "../../../services/productService.js";
import PageLoading from "../../../components/PageLoading/PageLoading.jsx";
import ErrorState from "../../../components/ErrorState/ErrorState.jsx";
import { formatVND } from "../../../utils/format.js";
import WishlistButton from "../../../components/common/WishlistButton.jsx";

import "./style.scss";

function CategoryPage() {
    const { slug } = useParams();
    const [category, setCategory] = useState(null);
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;

        async function loadCategoryPage() {
            setIsLoading(true);
            setError("");

            try {
                const categoryData = await categoryService.detail(slug);

                if (!categoryData) {
                    throw new Error("Không tìm thấy danh mục");
                }

                const productResult = await productService.list({
                    category: categoryData.id ?? slug,
                    page: 1,
                    limit: 24
                });

                if (isMounted) {
                    setCategory(categoryData);
                    setProducts(productResult.items);
                }
            } catch (loadError) {
                if (isMounted) {
                    setError(loadError?.message || "Không tải được danh mục");
                    setCategory(null);
                    setProducts([]);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        loadCategoryPage();

        return () => {
            isMounted = false;
        };
    }, [slug]);

    if (isLoading) {
        return <PageLoading title="Đang tải danh mục" description="Đợi một chút, mình đang lấy dữ liệu từ API." />;
    }

    if (error) {
        return <ErrorState title="Không tải được danh mục" description={error} />;
    }

    return (
        <div className="category-page">
            <div className="category-page__hero">
                <h1>{category?.name}</h1>
                <p>{category?.productCount ?? products.length} sản phẩm</p>
            </div>

            <div className="category-page__grid">
                {products.map((item) => (
                    <div key={item.id} style={{ position: "relative" }}>
                        <WishlistButton product={item} />
                        <Link to={`/san-pham/${item.id}`} className="category-product-card">
                            <img src={item.img} alt={item.name} />
                            <div>
                                <strong>{item.name}</strong>
                                <p>{formatVND(item.price)}</p>
                            </div>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default CategoryPage;