import { memo, useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { productService } from "../../../services/productService.js";
import { categoryService, categorySlugify } from "../../../services/categoryService.js";
import "./style.scss";
import PageLoading from "../../../components/PageLoading/PageLoading.jsx";
import ErrorState from "../../../components/ErrorState/ErrorState.jsx";
import WishlistButton from "../../../components/common/WishlistButton.jsx";
import ProductQuickActions from "../../../components/common/ProductQuickActions.jsx";
import QuickShopModal from "../../../components/QuickShopModal/QuickShopModal.jsx";
import { usePromoCatalog } from "../../../hooks/usePromoCatalog.js";
import { useProductPrice } from "../../../hooks/useProductPrice.js";
import PriceBlock from "../../../components/common/PriceBlock.jsx";

const PRICE_RANGES = [
    { value: "all", label: "Tất cả mức giá" },
    { value: "under-200", label: "Dưới 200.000 VND" },
    { value: "200-400", label: "200.000 - 400.000 VND" },
    { value: "400-600", label: "400.000 - 600.000 VND" },
    { value: "over-600", label: "Trên 600.000 VND" },
];

const SORT_OPTIONS = [
    { value: "featured", label: "Nổi bật" },
    { value: "price-asc", label: "Giá tăng dần" },
    { value: "price-desc", label: "Giá giảm dần" },
    { value: "name-asc", label: "Tên A-Z" },
    { value: "stock-desc", label: "Còn hàng nhiều" },
];

// ── Sub-component: mỗi card tự gọi useProductPrice ──
function ProductCard({ item, promoMap, globalPromos, onAddToCart, onBuyNow }) {
    const priceInfo = useProductPrice(item, promoMap, globalPromos);

    return (
        <div className="product-card-wrapper" style={{ position: "relative" }}>
            <WishlistButton product={item} />

            <div className="product-card">
                <Link to={`/san-pham/${item.id}`} className="product-card__main">
                    <div className="image-box">
                        {item.img
                            ? <img src={item.img} alt={item.name} loading="lazy" />
                            : <div className="image-placeholder" />
                        }

                        {priceInfo?.isFlashSale && <span className="product-promo">⚡ Flash</span>}
                    </div>

                    <div className="product-card__content">
                        <h3>{item.name}</h3>
                        <div className="product-card__price">
                            <PriceBlock priceInfo={priceInfo} center />
                        </div>
                    </div>
                </Link>

                <ProductQuickActions
                    product={{
                        ...item,
                        price: priceInfo?.originalPrice ?? item.price,
                        ...(priceInfo?.hasDiscount ? { salePrice: priceInfo.displayPrice } : {}),
                        ...(priceInfo?.isFlashSale ? { flashPrice: priceInfo.displayPrice } : {}),
                    }}
                    onAddToCart={onAddToCart}
                    onBuyNow={onBuyNow}
                />
            </div>
        </div>
    );
}

// ── Trang chính ──
const ProductPage = () => {
    const { slug: categorySlug } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const keyword = (searchParams.get("tu-khoa") || "").trim().toLowerCase();
    const currentPage = Math.max(Number(searchParams.get("page") || 1), 1);

    const [quickShopProduct, setQuickShopProduct] = useState(null);
    const [quickActionType, setQuickActionType] = useState("cart");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedPriceRange, setSelectedPriceRange] = useState("all");
    const [showHotOnly, setShowHotOnly] = useState(false);
    const [showInStockOnly, setShowInStockOnly] = useState(false);
    const [sortBy, setSortBy] = useState("featured");
    const [isSortOpen, setIsSortOpen] = useState(false);

    const sortDropdownRef = useRef(null);

    const [categories, setCategories] = useState([{ id: "all", value: "all", slug: "all", name: "Tất cả sản phẩm" }]);
    const [products, setProducts] = useState([]);
    const [totalProducts, setTotalProducts] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [pageError, setPageError] = useState("");

    const pageSize = 12;
    const selectedSortOption = SORT_OPTIONS.find((o) => o.value === sortBy) ?? SORT_OPTIONS[0];

    const { promoMap, globalPromos } = usePromoCatalog();

    const updatePageQuery = (nextPage) => {
        const next = new URLSearchParams(searchParams);
        if (nextPage <= 1) next.delete("page");
        else next.set("page", String(nextPage));
        setSearchParams(next);
    };

    useEffect(() => {
        let alive = true;
        categoryService.list()
            .then((data) => {
                if (!alive || !Array.isArray(data) || data.length === 0) return;
                const seen = new Set();
                const unique = data.filter((c) => {
                    const key = String(c.id ?? c.slug ?? c.name);
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                }).map((c) => ({
                    ...c,
                    value: String(c.id ?? c.slug),
                }));
                const nextCategories = [{ id: "all", value: "all", slug: "all", name: "Tất cả sản phẩm" }, ...unique];
                setCategories(nextCategories);

                if (categorySlug) {
                    const matched = nextCategories.find((c) =>
                        c.slug === categorySlug || categorySlugify(c.name) === categorySlug
                    );
                    setSelectedCategory(matched?.value ?? "all");
                } else {
                    setSelectedCategory("all");
                }
            })
            .catch(() => { });
        return () => { alive = false; };
    }, [categorySlug]);

    useEffect(() => {
        let alive = true;
        setIsLoading(true);
        setPageError("");

        productService.list({
            keyword, category: selectedCategory, priceRange: selectedPriceRange,
            hotOnly: showHotOnly, inStockOnly: showInStockOnly,
            sortBy, page: currentPage, limit: pageSize,
        })
            .then((result) => {
                if (!alive) return;
                setProducts(result.data);
                setTotalProducts(result.meta.total);
                setTotalPages(result.meta.last_page);
            })
            .catch(() => {
                if (!alive) return;
                setProducts([]);
                setTotalProducts(0);
                setPageError("Không tải được danh sách sản phẩm.");
            })
            .finally(() => { if (alive) setIsLoading(false); });

        return () => { alive = false; };
    }, [keyword, selectedCategory, selectedPriceRange, showHotOnly, showInStockOnly, sortBy, currentPage]);

    useEffect(() => {
        const handler = (e) => {
            if (!sortDropdownRef.current?.contains(e.target)) setIsSortOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
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

    const handlePageChange = (next) => {
        updatePageQuery(Math.min(Math.max(next, 1), totalPages));
    };

    return (
        <div className="product-page">
            <div className="product-page__body">
                <aside className="filter-sidebar">
                    <div className="sidebar-card">
                        <h3>Danh mục</h3>
                        {categories.map((c) => (
                            <button key={c.value} type="button"
                                className={`sidebar-option ${selectedCategory === c.value ? "active" : ""}`}
                                onClick={() => { setSelectedCategory(c.value); updatePageQuery(1); }}
                            >
                                {c.name}
                            </button>
                        ))}
                    </div>

                    <div className="sidebar-card">
                        <h4>Mức giá</h4>
                        <div className="filter-stack">
                            {PRICE_RANGES.map((r) => (
                                <button key={r.value} type="button"
                                    className={`sidebar-option ${selectedPriceRange === r.value ? "active" : ""}`}
                                    onClick={() => { setSelectedPriceRange(r.value); updatePageQuery(1); }}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="sidebar-card">
                        <h4>Trạng thái</h4>
                        <label className="check-option">
                            <input type="checkbox" checked={showHotOnly}
                                onChange={() => { setShowHotOnly((v) => !v); updatePageQuery(1); }} />
                            <span>Chỉ hiển thị sản phẩm nổi bật</span>
                        </label>
                        <label className="check-option">
                            <input type="checkbox" checked={showInStockOnly}
                                onChange={() => { setShowInStockOnly((v) => !v); updatePageQuery(1); }} />
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
                                <button type="button" className="sort-dropdown__trigger"
                                    onClick={() => setIsSortOpen((v) => !v)}
                                    aria-haspopup="listbox" aria-expanded={isSortOpen}
                                >
                                    <span>{selectedSortOption.label}</span>
                                    <span className="sort-dropdown__arrow" aria-hidden="true">▾</span>
                                </button>
                                {isSortOpen && (
                                    <div className="sort-dropdown__menu" role="listbox">
                                        {SORT_OPTIONS.map((o) => (
                                            <button key={o.value} type="button"
                                                className={`sort-dropdown__option ${sortBy === o.value ? "active" : ""}`}
                                                onClick={() => { setSortBy(o.value); setIsSortOpen(false); updatePageQuery(1); }}
                                                role="option" aria-selected={sortBy === o.value}
                                            >
                                                {o.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <PageLoading title="Đang tải danh sách sản phẩm" description="Lọc, sắp xếp và phân trang đang được xử lý từ API." />
                    ) : pageError ? (
                        <ErrorState title="Không tải được sản phẩm" description={pageError}
                            actionLabel="Tải lại" onRetry={() => updatePageQuery(currentPage)} />
                    ) : products.length === 0 ? (
                        <p className="empty">Không tìm thấy sản phẩm phù hợp.</p>
                    ) : (
                        <div className="product-list">
                            {products.map((item) => (
                                <ProductCard
                                    key={item.id}
                                    item={item}
                                    promoMap={promoMap}
                                    globalPromos={globalPromos}
                                    onAddToCart={(p) => { setQuickActionType("cart"); setQuickShopProduct(p); }}
                                    onBuyNow={(p) => { setQuickActionType("buy"); setQuickShopProduct(p); }}
                                />
                            ))}
                        </div>
                    )}

                    <div className="pagination-bar">
                        <button type="button" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1}>
                            Trang trước
                        </button>
                        <span>Trang {currentPage} / {totalPages}</span>
                        <button type="button" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages}>
                            Trang sau
                        </button>
                    </div>
                </div>
            </div>

            {quickShopProduct && (
                <QuickShopModal product={quickShopProduct} actionType={quickActionType}
                    onClose={() => setQuickShopProduct(null)} />
            )}
        </div>
    );
};

export default memo(ProductPage);
