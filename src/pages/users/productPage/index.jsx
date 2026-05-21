import { memo, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { productService } from "../../../services/productService.js";
import { categoryService } from "../../../services/categoryService.js";
import { promotionService } from "../../../services/promotionService.js";
import "./style.scss";
import { formatVND } from "../../../utils/format.js";
import PageLoading from "../../../components/PageLoading/PageLoading.jsx";
import ErrorState from "../../../components/ErrorState/ErrorState.jsx";
import WishlistButton from "../../../components/common/WishlistButton.jsx";

// Danh sách sản phẩm hiện đi qua productService và lấy dữ liệu từ API.
// Filter/sort/pagination đã được đẩy xuống service/backend.

const PRICE_RANGES = [
    { value: "all", label: "Tất cả mức giá" },
    { value: "under-200", label: "Dưới 200.000 VND" },
    { value: "200-400", label: "200.000 - 400.000 VND" },
    { value: "400-600", label: "400.000 - 600.000 VND" },
    { value: "over-600", label: "Trên 600.000 VND" }
];

const SORT_OPTIONS = [
    { value: "featured", label: "Nổi bật" },
    { value: "price-asc", label: "Giá tăng dần" },
    { value: "price-desc", label: "Giá giảm dần" },
    { value: "name-asc", label: "Tên A-Z" },
    { value: "stock-desc", label: "Còn hàng nhiều" }
];

const ProductPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const keyword = (searchParams.get("tu-khoa") || "").trim().toLowerCase();
    const currentPage = Math.max(Number(searchParams.get("page") || 1), 1);
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedPriceRange, setSelectedPriceRange] = useState("all");
    const [showHotOnly, setShowHotOnly] = useState(false);
    const [showInStockOnly, setShowInStockOnly] = useState(false);
    const [sortBy, setSortBy] = useState("featured");
    const [isSortOpen, setIsSortOpen] = useState(false);
    const sortDropdownRef = useRef(null);
    const [categories, setCategories] = useState([{ slug: "all", name: "Tất cả sản phẩm" }]);
    const [products, setProducts] = useState([]);
    const [totalProducts, setTotalProducts] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [pageError, setPageError] = useState("");
    const pageSize = 12;
    const [promoMap, setPromoMap] = useState(new Map());
    const [globalPromos, setGlobalPromos] = useState([]);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const list = await promotionService.fetchActive().catch(() => []);
                if (!alive) return;
                const map = new Map();
                const globals = [];
                for (const p of list) {
                    if (p.products && p.products.length > 0) {
                        for (const pr of p.products) {
                            const id = Number(pr.id ?? pr.product_id ?? pr);
                            if (!isNaN(id)) map.set(id, p);
                        }
                    } else {
                        globals.push(p);
                    }
                }
                setPromoMap(map);
                setGlobalPromos(globals);
            } catch (e) {
                // ignore
            }
        })();
        return () => { alive = false; };
    }, []);
    // Các state filter/sort vẫn nằm ở UI, nhưng dữ liệu đã được lấy qua service/API.
    // Query params page/keyword tiếp tục được sync qua URL để share link được.

    const selectedSortOption = SORT_OPTIONS.find((option) => option.value === sortBy) ?? SORT_OPTIONS[0];

    const updatePageQuery = (nextPage) => {
        const nextSearchParams = new URLSearchParams(searchParams);

        if (nextPage <= 1) {
            nextSearchParams.delete("page");
        } else {
            nextSearchParams.set("page", String(nextPage));
        }

        setSearchParams(nextSearchParams);
    };

    const filteredProducts = products;
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        let isMounted = true;

        async function loadCategories() {
            try {
                const data = await categoryService.list();


                if (isMounted && Array.isArray(data) && data.length > 0) {
                    const seen = new Set();
                    const unique = data.filter(cat => {
                        if (seen.has(cat.slug)) return false;
                        seen.add(cat.slug);
                        return true;
                    });
                    setCategories([{ slug: "all", name: "Tất cả sản phẩm" }, ...unique]);
                }
            } catch {
                if (isMounted) {
                    setCategories([{ slug: "all", name: "Tất cả sản phẩm" }]);
                }
            }
        }

        loadCategories();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        let isMounted = true;

        async function loadProducts() {
            setIsLoading(true);
            setPageError("");

            try {
                const result = await productService.list({
                    keyword,
                    category: selectedCategory,
                    priceRange: selectedPriceRange,
                    hotOnly: showHotOnly,
                    inStockOnly: showInStockOnly,
                    sortBy,
                    page: currentPage,
                    limit: pageSize
                });

                if (isMounted) {
                    let nextItems = [...result.data];

                    if (showHotOnly) {
                        nextItems = nextItems.filter((item) => item.isHot);
                    }

                    if (sortBy === "stock-desc") {
                        nextItems.sort((left, right) => Number(right.inventory ?? 0) - Number(left.inventory ?? 0));
                    }

                    setProducts(nextItems);
                    setTotalProducts(showHotOnly ? nextItems.length : result.meta.total);
                    setTotalPages(result.meta.last_page);
                }
            } catch {
                if (isMounted) {
                    setProducts([]);
                    setTotalProducts(0);
                    setPageError("Không tải được danh sách sản phẩm.");
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        loadProducts();

        return () => {
            isMounted = false;
        };
    }, [keyword, selectedCategory, selectedPriceRange, showHotOnly, showInStockOnly, sortBy, currentPage]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!sortDropdownRef.current?.contains(event.target)) {
                setIsSortOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const resetFilters = () => {
        setSelectedCategory("all");
        setSelectedPriceRange("all");
        setShowHotOnly(false);
        setShowInStockOnly(false);
        setSortBy("featured");
        setIsSortOpen(false);
        updatePageQuery(1);
    };

    const handlePageChange = (nextPage) => {
        const safePage = Math.min(Math.max(nextPage, 1), totalPages);
        updatePageQuery(safePage);
    };

    return (
        <div className="product-page">
            {/* <div className="product-page__hero">
                <div>
                    <h2>Sản phẩm</h2>
                </div>
            </div> */}

            {keyword && (
                <p className="search-result">
                    Kết quả tìm kiếm cho: "{searchParams.get("tu-khoa")}"
                </p>
            )}

            <div className="product-page__body">
                <aside className="filter-sidebar">
                    <div className="sidebar-card">
                        <h4>Danh mục</h4>
                        <div className="filter-stack">
                            {categories.map((category) => (
                                <button
                                    key={category.id ?? category.slug}
                                    type="button"
                                    className={`sidebar-option ${selectedCategory === (category.id ?? category.slug) ? "active" : ""}`}
                                    onClick={() => {
                                        setSelectedCategory(category.id ?? category.slug);
                                        updatePageQuery(1);
                                    }}
                                >
                                    {category.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="sidebar-card">
                        <h4>Mức giá</h4>
                        <div className="filter-stack">
                            {PRICE_RANGES.map((range) => (
                                <button
                                    key={range.value}
                                    type="button"
                                    className={`sidebar-option ${selectedPriceRange === range.value ? "active" : ""}`}
                                    onClick={() => {
                                        setSelectedPriceRange(range.value);
                                        updatePageQuery(1);
                                    }}
                                >
                                    {range.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="sidebar-card">
                        <h4>Trạng thái</h4>
                        <label className="check-option">
                            <input
                                type="checkbox"
                                checked={showHotOnly}
                                onChange={() => {
                                    setShowHotOnly((prev) => !prev);
                                    updatePageQuery(1);
                                }}
                            />
                            <span>Chỉ hiển thị sản phẩm nổi bật</span>
                        </label>
                        <label className="check-option">
                            <input
                                type="checkbox"
                                checked={showInStockOnly}
                                onChange={() => {
                                    setShowInStockOnly((prev) => !prev);
                                    updatePageQuery(1);
                                }}
                            />
                            <span>Chỉ hiển thị sản phẩm còn hàng</span>
                        </label>
                    </div>

                    <button type="button" className="reset-btn" onClick={resetFilters}>
                        Xóa bộ lọc
                    </button>
                </aside>

                <div className="product-content">
                    <div className="filter-bar">
                        <div className="filter-bar__summary">
                            <strong>{totalProducts}</strong>
                            <span>sản phẩm phù hợp</span>
                        </div>

                        <div className="sort-field" ref={sortDropdownRef}>
                            <span>Sắp xếp</span>
                            <div className={`sort-dropdown ${isSortOpen ? "is-open" : ""}`}>
                                <button
                                    type="button"
                                    className="sort-dropdown__trigger"
                                    onClick={() => setIsSortOpen((prev) => !prev)}
                                    aria-haspopup="listbox"
                                    aria-expanded={isSortOpen}
                                >
                                    <span>{selectedSortOption.label}</span>
                                    <span className="sort-dropdown__arrow" aria-hidden="true">v</span>
                                </button>

                                {isSortOpen ? (
                                    <div className="sort-dropdown__menu" role="listbox">
                                        {SORT_OPTIONS.map((option) => (
                                            <button
                                                key={option.value}
                                                type="button"
                                                className={`sort-dropdown__option ${sortBy === option.value ? "active" : ""}`}
                                                onClick={() => {
                                                    setSortBy(option.value);
                                                    setIsSortOpen(false);
                                                    updatePageQuery(1);
                                                }}
                                                role="option"
                                                aria-selected={sortBy === option.value}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <PageLoading
                            title="Đang tải danh sách sản phẩm"
                            description="Lọc, sắp xếp và phân trang đang được xử lý từ API."
                        />
                    ) : pageError ? (
                        <ErrorState
                            title="Không tải được sản phẩm"
                            description={pageError}
                            actionLabel="Tải lại"
                            onRetry={() => updatePageQuery(currentPage)}
                        />
                    ) : filteredProducts.length === 0 ? (
                        <p className="empty">Không tìm thấy sản phẩm phù hợp.</p>
                    ) : (
                        <div className="product-list">
                            {filteredProducts.map((item) => (
                                <div key={item.id} style={{ position: "relative", height: "100%" }}>
                                    <WishlistButton product={item} />
                                    <Link to={`/san-pham/${item.id}`} className="product-card">
                                        {/* TODO: Đang điều hướng bằng id local.
                                            Khi có backend, đảm bảo id/slug route này khớp với API chi tiết sản phẩm. */}
                                        <div className="image-box">
                                            {item.img ? <img src={item.img} alt={item.name} /> : null}
                                            {promoMap.has(item.id) ? (
                                                <span className="product-promo" style={{ position: 'absolute', top: 8, left: 8, background: '#db2777', color: '#fff', padding: '4px 8px', borderRadius: 6, fontSize: 12 }}>
                                                    {promoMap.get(item.id).type === 'percent' ? `-${promoMap.get(item.id).value}%` : promoMap.get(item.id).type === 'amount' ? `Giảm ${Number(promoMap.get(item.id).value).toLocaleString('vi-VN')} đ` : 'KM'}
                                                </span>
                                            ) : globalPromos.length > 0 ? (
                                                <span className="product-promo" style={{ position: 'absolute', top: 8, left: 8, background: '#f59e0b', color: '#111', padding: '4px 8px', borderRadius: 6, fontSize: 12 }}>
                                                    KM
                                                </span>
                                            ) : null}
                                        </div>

                                        <div className="product-card__content">
                                            <div className="product-card__meta">
                                                {/* TODO: UI đang giả định sản phẩm có `category` và `isHot`.
                                                    Khi backend thật, cần map đúng các field badge/tag từ response. */}
                                                <span className="product-tag">{item.category}</span>
                                                {item.isHot ? <span className="product-badge">Nổi bật</span> : null}
                                            </div>

                                            <h3>{item.name}</h3>

                                            <div className="product-card__footer">
                                                <p className="price">{formatVND(item.price)}</p>
                                                {/* TODO: Trạng thái tồn kho hiện đang dựa trực tiếp vào `stock`.
                                                    Khi có backend, cần xem dùng `stock`, `inventoryStatus` hay `availableQuantity`. */}
                                                <span className={`stock ${item.in_stock ? "in-stock" : "out-stock"}`}>
                                                    {item.in_stock ? `Còn ${item.inventory}` : "Hết hàng"}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="pagination-bar">
                        <button type="button" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1}>
                            Trang trước
                        </button>
                        <span>
                            Trang {currentPage} / {totalPages}
                        </span>
                        <button type="button" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages}>
                            Trang sau
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default memo(ProductPage);