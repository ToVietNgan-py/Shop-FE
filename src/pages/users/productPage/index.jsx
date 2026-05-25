import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { productService } from "../../../services/productService.js";
import { categoryService } from "../../../services/categoryService.js";
import { promotionUtils } from "../../../services/promotionService.js";
import "./style.scss";
import { formatVND } from "../../../utils/format.js";
import PageLoading from "../../../components/PageLoading/PageLoading.jsx";
import ErrorState from "../../../components/ErrorState/ErrorState.jsx";
import WishlistButton from "../../../components/common/WishlistButton.jsx";
import ProductQuickActions from "../../../components/common/ProductQuickActions.jsx";
import QuickShopModal from "../../../components/QuickShopModal/QuickShopModal.jsx";

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

const ProductPage = () => {
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

    const [categories, setCategories] = useState([{ slug: "all", name: "Tất cả sản phẩm" }]);
    const [products, setProducts] = useState([]);
    const [totalProducts, setTotalProducts] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [pageError, setPageError] = useState("");

    const pageSize = 12;
    const [promoMap, setPromoMap] = useState(new Map());
    const [globalPromos, setGlobalPromos] = useState([]);

    const selectedSortOption = SORT_OPTIONS.find((option) => option.value === sortBy) ?? SORT_OPTIONS[0];

    const updatePageQuery = (nextPage) => {
        const next = new URLSearchParams(searchParams);
        if (nextPage <= 1) {
            next.delete("page");
        } else {
            next.set("page", String(nextPage));
        }
        setSearchParams(next);
    };

    useEffect(() => {
        let alive = true;

        (async () => {
            try {
                const list = await promotionUtils.fetchPromotionCatalog().catch(() => []);
                if (!alive) return;

                const map = new Map();
                const globals = [];

                for (const promo of list) {
                    if (promo.products && promo.products.length > 0) {
                        for (const productRef of promo.products) {
                            const id = Number(productRef.id ?? productRef.product_id ?? productRef);
                            if (!Number.isNaN(id)) {
                                map.set(id, promo);
                            }
                        }
                    } else {
                        globals.push(promo);
                    }
                }

                setPromoMap(map);
                setGlobalPromos(globals);
            } catch {
                // ignore promotion loading errors
            }
        })();

        return () => {
            alive = false;
        };
    }, []);

    useEffect(() => {
        let alive = true;

        categoryService
            .list()
            .then((data) => {
                if (!alive || !Array.isArray(data) || data.length === 0) {
                    return;
                }

                const seen = new Set();
                const unique = data.filter((category) => {
                    if (seen.has(category.slug)) return false;
                    seen.add(category.slug);
                    return true;
                });

                setCategories([{ slug: "all", name: "Tất cả sản phẩm" }, ...unique]);
            })
            .catch(() => { });

        return () => {
            alive = false;
        };
    }, []);

    useEffect(() => {
        let alive = true;

        setIsLoading(true);
        setPageError("");

        productService
            .list({
                keyword,
                category: selectedCategory,
                priceRange: selectedPriceRange,
                hotOnly: showHotOnly,
                inStockOnly: showInStockOnly,
                sortBy,
                page: currentPage,
                limit: pageSize,
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
            .finally(() => {
                if (alive) setIsLoading(false);
            });

        return () => {
            alive = false;
        };
    }, [keyword, selectedCategory, selectedPriceRange, showHotOnly, showInStockOnly, sortBy, currentPage]);

    useEffect(() => {
        const handler = (event) => {
            if (!sortDropdownRef.current?.contains(event.target)) {
                setIsSortOpen(false);
            }
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

    const getPromotionInfo = (item) => {
        const allPromos = [
            ...(promoMap.has(item.id) ? [promoMap.get(item.id)] : []),
            ...globalPromos,
        ];

        return promotionUtils.estimateProductPromotion(item, allPromos);
    };

    return (
        <div className="product-page">
            <div className="product-page__body">
                <aside className="filter-sidebar">
                    <div className="sidebar-card">
                        <h3>Danh mục</h3>
                        {categories.map((category) => (
                            <button
                                key={category.slug}
                                type="button"
                                className={`sidebar-option ${selectedCategory === category.slug ? "active" : ""}`}
                                onClick={() => {
                                    setSelectedCategory(category.slug);
                                    updatePageQuery(1);
                                }}
                            >
                                {category.name}
                            </button>
                        ))}
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
                                    setShowHotOnly((current) => !current);
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
                                    setShowInStockOnly((current) => !current);
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
                                    onClick={() => setIsSortOpen((current) => !current)}
                                    aria-haspopup="listbox"
                                    aria-expanded={isSortOpen}
                                >
                                    <span>{selectedSortOption.label}</span>
                                    <span className="sort-dropdown__arrow" aria-hidden="true">
                                        ▾
                                    </span>
                                </button>

                                {isSortOpen && (
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
                                )}
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
                    ) : products.length === 0 ? (
                        <p className="empty">Không tìm thấy sản phẩm phù hợp.</p>
                    ) : (
                        <div className="product-list">
                            {products.map((item) => {
                                const promo = getPromotionInfo(item);
                                const hasDiscount = Boolean(promo?.discountAmount > 0);
                                const salePrice = hasDiscount ? promo.finalPrice : item.price;

                                return (
                                    <div key={item.id} className="product-card-wrapper">
                                        <WishlistButton product={item} />

                                        <div className="product-card">
                                            <Link to={`/san-pham/${item.id}`} className="product-card__main">
                                                <div className="image-box" style={{ position: "relative" }}>
                                                    {item.img ? (
                                                        <img src={item.img} alt={item.name} loading="lazy" />
                                                    ) : (
                                                        <div className="image-placeholder" />
                                                    )}

                                                    {promoMap.has(item.id) ? (
                                                        <span
                                                            className="product-promo"
                                                            style={{
                                                                position: "absolute",
                                                                top: 8,
                                                                left: 8,
                                                                background: "#db2777",
                                                                color: "#fff",
                                                                padding: "4px 8px",
                                                                borderRadius: 6,
                                                                fontSize: 12,
                                                            }}
                                                        >
                                                            {promoMap.get(item.id).type === "percent"
                                                                ? `-${promoMap.get(item.id).value}%`
                                                                : promoMap.get(item.id).type === "amount"
                                                                    ? `Giảm ${Number(promoMap.get(item.id).value).toLocaleString("vi-VN")} đ`
                                                                    : "KM"}
                                                        </span>
                                                    ) : globalPromos.length > 0 ? (
                                                        <span
                                                            className="product-promo"
                                                            style={{
                                                                position: "absolute",
                                                                top: 8,
                                                                left: 8,
                                                                background: "#f59e0b",
                                                                color: "#111",
                                                                padding: "4px 8px",
                                                                borderRadius: 6,
                                                                fontSize: 12,
                                                            }}
                                                        >
                                                            KM
                                                        </span>
                                                    ) : null}
                                                </div>
                                                <div className="product-card__content">
                                                    <div className="product-card__meta">
                                                        {item.category && <span className="product-tag">{item.category}</span>}
                                                        {item.isHot && <span className="product-badge">Nổi bật</span>}
                                                    </div>

                                                    <h3>{item.name}</h3>
                                                </div>
                                            </Link>

                                            <div className="product-card__footer">
                                                {hasDiscount ? (
                                                    <div className="price-block">
                                                        <span className="price-original">{formatVND(item.price)}</span>
                                                        <span className="price-sale">{formatVND(salePrice)}</span>
                                                        <span className="price-badge">
                                                            -{promo.promo.type === "percent"
                                                                ? promo.promo.value
                                                                : Math.round((promo.discountAmount / item.price) * 100)}%
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <p className="price">{formatVND(item.price)}</p>
                                                )}

                                                <span className={`stock ${item.in_stock ? "in-stock" : "out-stock"}`}>
                                                    {item.in_stock ? `Còn ${item.inventory}` : "Hết hàng"}
                                                </span>
                                            </div>

                                            <div className="product-card__title-row">
                                                <h3>{item.name}</h3>

                                                <div onClick={(event) => event.preventDefault()}>
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
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="pagination-bar">
                        <button
                            type="button"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage <= 1}
                        >
                            Trang trước
                        </button>
                        <span>Trang {currentPage} / {totalPages}</span>
                        <button
                            type="button"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage >= totalPages}
                        >
                            Trang sau
                        </button>
                    </div>
                </div>
            </div>

            {quickShopProduct && (
                <QuickShopModal
                    product={quickShopProduct}
                    actionType={quickActionType}
                    onClose={() => setQuickShopProduct(null)}
                />
            )}
        </div>
    );
};

export default memo(ProductPage);
