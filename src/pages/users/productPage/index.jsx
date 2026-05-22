// import { memo, useEffect, useRef, useState } from "react";
// import { Link, useSearchParams } from "react-router-dom";
// import { productService } from "../../../services/productService.js";
// import { categoryService } from "../../../services/categoryService.js";
// import { promotionService } from "../../../services/promotionService.js";
// import "./style.scss";
// import { formatVND } from "../../../utils/format.js";
// import PageLoading from "../../../components/PageLoading/PageLoading.jsx";
// import ErrorState from "../../../components/ErrorState/ErrorState.jsx";
// import WishlistButton from "../../../components/common/WishlistButton.jsx";
// import ProductQuickActions from "../../../components/common/ProductQuickActions.jsx";

// const PRICE_RANGES = [
//     { value: "all", label: "Tất cả mức giá" },
//     { value: "under-200", label: "Dưới 200.000 VND" },
//     { value: "200-400", label: "200.000 - 400.000 VND" },
//     { value: "400-600", label: "400.000 - 600.000 VND" },
//     { value: "over-600", label: "Trên 600.000 VND" },
// ];

// const SORT_OPTIONS = [
//     { value: "featured", label: "Nổi bật" },
//     { value: "price-asc", label: "Giá tăng dần" },
//     { value: "price-desc", label: "Giá giảm dần" },
//     { value: "name-asc", label: "Tên A-Z" },
//     { value: "stock-desc", label: "Còn hàng nhiều" },
// ];

// const ProductPage = () => {
//     const [searchParams, setSearchParams] = useSearchParams();
//     const keyword = (searchParams.get("tu-khoa") || "").trim().toLowerCase();
//     const currentPage = Math.max(Number(searchParams.get("page") || 1), 1);

//     const [selectedCategory, setSelectedCategory] = useState("all");
//     const [selectedPriceRange, setSelectedPriceRange] = useState("all");
//     const [showHotOnly, setShowHotOnly] = useState(false);
//     const [showInStockOnly, setShowInStockOnly] = useState(false);
//     const [sortBy, setSortBy] = useState("featured");
//     const [isSortOpen, setIsSortOpen] = useState(false);

//     const sortDropdownRef = useRef(null);

//     const [categories, setCategories] = useState([{ slug: "all", name: "Tất cả sản phẩm" }]);
//     const [products, setProducts] = useState([]);
//     const [totalProducts, setTotalProducts] = useState(0);
//     const [totalPages, setTotalPages] = useState(1);
//     const [isLoading, setIsLoading] = useState(true);
//     const [pageError, setPageError] = useState("");
// <<<<<<< Updated upstream
//     const pageSize = 12;
//     const [promoMap, setPromoMap] = useState(new Map());
//     const [globalPromos, setGlobalPromos] = useState([]);

//     useEffect(() => {
//         let alive = true;
//         (async () => {
//             try {
//                 const list = await promotionService.fetchActive().catch(() => []);
//                 if (!alive) return;
//                 const map = new Map();
//                 const globals = [];
//                 for (const p of list) {
//                     if (p.products && p.products.length > 0) {
//                         for (const pr of p.products) {
//                             const id = Number(pr.id ?? pr.product_id ?? pr);
//                             if (!isNaN(id)) map.set(id, p);
//                         }
//                     } else {
//                         globals.push(p);
//                     }
//                 }
//                 setPromoMap(map);
//                 setGlobalPromos(globals);
//             } catch (e) {
//                 // ignore
//             }
//         })();
//         return () => { alive = false; };
//     }, []);
//     // Các state filter/sort vẫn nằm ở UI, nhưng dữ liệu đã được lấy qua service/API.
//     // Query params page/keyword tiếp tục được sync qua URL để share link được.
// =======
// >>>>>>> Stashed changes

//     const pageSize = 12;
//     const selectedSortOption = SORT_OPTIONS.find((o) => o.value === sortBy) ?? SORT_OPTIONS[0];

//     const updatePageQuery = (nextPage) => {
//         const next = new URLSearchParams(searchParams);
//         if (nextPage <= 1) next.delete("page");
//         else next.set("page", String(nextPage));
//         setSearchParams(next);
//     };

//     /* load categories */
//     useEffect(() => {
//         let alive = true;
//         categoryService.list().then((data) => {
//             if (!alive || !Array.isArray(data) || data.length === 0) return;
//             const seen = new Set();
//             const unique = data.filter((c) => { if (seen.has(c.slug)) return false; seen.add(c.slug); return true; });
//             setCategories([{ slug: "all", name: "Tất cả sản phẩm" }, ...unique]);
//         }).catch(() => { });
//         return () => { alive = false; };
//     }, []);

//     /* load products */
//     useEffect(() => {
//         let alive = true;
//         setIsLoading(true);
//         setPageError("");
//         productService.list({ keyword, category: selectedCategory, priceRange: selectedPriceRange, hotOnly: showHotOnly, inStockOnly: showInStockOnly, sortBy, page: currentPage, limit: pageSize })
//             .then((result) => {
//                 if (!alive) return;
//                 setProducts(result.data);
//                 setTotalProducts(result.meta.total);
//                 setTotalPages(result.meta.last_page);
//             })
//             .catch(() => {
//                 if (!alive) return;
//                 setProducts([]);
//                 setTotalProducts(0);
//                 setPageError("Không tải được danh sách sản phẩm.");
//             })
//             .finally(() => { if (alive) setIsLoading(false); });
//         return () => { alive = false; };
//     }, [keyword, selectedCategory, selectedPriceRange, showHotOnly, showInStockOnly, sortBy, currentPage]);

//     /* close sort dropdown on outside click */
//     useEffect(() => {
//         const handler = (e) => { if (!sortDropdownRef.current?.contains(e.target)) setIsSortOpen(false); };
//         document.addEventListener("mousedown", handler);
//         return () => document.removeEventListener("mousedown", handler);
//     }, []);

//     const resetFilters = () => {
//         setSelectedCategory("all");
//         setSelectedPriceRange("all");
//         setShowHotOnly(false);
//         setShowInStockOnly(false);
//         setSortBy("featured");
//         setIsSortOpen(false);
//         updatePageQuery(1);
//     };

//     const handlePageChange = (next) => updatePageQuery(Math.min(Math.max(next, 1), totalPages));

//     return (
//         <div className="product-page">
//             <div className="product-page__body">

//                 {/* ── SIDEBAR ── */}
//                 <aside className="filter-sidebar">
//                     <div className="sidebar-card">
//                         <h3>Danh mục</h3>
//                         {categories.map((cat) => (
//                             <button
//                                 key={cat.slug}
//                                 type="button"
//                                 className={`sidebar-option ${selectedCategory === cat.slug ? "active" : ""}`}
//                                 onClick={() => { setSelectedCategory(cat.slug); updatePageQuery(1); }}
//                             >
//                                 {cat.name}
//                             </button>
//                         ))}
//                     </div>

//                     <div className="sidebar-card">
//                         <h4>Mức giá</h4>
//                         <div className="filter-stack">
//                             {PRICE_RANGES.map((r) => (
//                                 <button
//                                     key={r.value}
//                                     type="button"
//                                     className={`sidebar-option ${selectedPriceRange === r.value ? "active" : ""}`}
//                                     onClick={() => { setSelectedPriceRange(r.value); updatePageQuery(1); }}
//                                 >
//                                     {r.label}
//                                 </button>
//                             ))}
//                         </div>
//                     </div>

//                     <div className="sidebar-card">
//                         <h4>Trạng thái</h4>
//                         <label className="check-option">
//                             <input type="checkbox" checked={showHotOnly} onChange={() => { setShowHotOnly((p) => !p); updatePageQuery(1); }} />
//                             <span>Chỉ hiển thị sản phẩm nổi bật</span>
//                         </label>
//                         <label className="check-option">
//                             <input type="checkbox" checked={showInStockOnly} onChange={() => { setShowInStockOnly((p) => !p); updatePageQuery(1); }} />
//                             <span>Chỉ hiển thị sản phẩm còn hàng</span>
//                         </label>
//                     </div>

//                     <button type="button" className="reset-btn" onClick={resetFilters}>Xóa bộ lọc</button>
//                 </aside>

//                 {/* ── CONTENT ── */}
//                 <div className="product-content">

//                     {/* filter bar */}
//                     <div className="filter-bar">
//                         <div className="filter-bar__summary">
//                             <strong>{totalProducts}</strong>
//                             <span>sản phẩm phù hợp</span>
//                         </div>

//                         <div className="sort-field" ref={sortDropdownRef}>
//                             <span>Sắp xếp</span>
//                             <div className={`sort-dropdown ${isSortOpen ? "is-open" : ""}`}>
//                                 <button
//                                     type="button"
//                                     className="sort-dropdown__trigger"
//                                     onClick={() => setIsSortOpen((p) => !p)}
//                                     aria-haspopup="listbox"
//                                     aria-expanded={isSortOpen}
//                                 >
//                                     <span>{selectedSortOption.label}</span>
//                                     <span className="sort-dropdown__arrow" aria-hidden="true">▾</span>
//                                 </button>

//                                 {isSortOpen && (
//                                     <div className="sort-dropdown__menu" role="listbox">
//                                         {SORT_OPTIONS.map((o) => (
//                                             <button
//                                                 key={o.value}
//                                                 type="button"
//                                                 className={`sort-dropdown__option ${sortBy === o.value ? "active" : ""}`}
//                                                 onClick={() => { setSortBy(o.value); setIsSortOpen(false); updatePageQuery(1); }}
//                                                 role="option"
//                                                 aria-selected={sortBy === o.value}
//                                             >
//                                                 {o.label}
//                                             </button>
//                                         ))}
//                                     </div>
//                                 )}
//                             </div>
//                         </div>
//                     </div>

//                     {/* product list */}
//                     {isLoading ? (
//                         <PageLoading title="Đang tải danh sách sản phẩm" description="Lọc, sắp xếp và phân trang đang được xử lý từ API." />
//                     ) : pageError ? (
//                         <ErrorState title="Không tải được sản phẩm" description={pageError} actionLabel="Tải lại" onRetry={() => updatePageQuery(currentPage)} />
//                     ) : products.length === 0 ? (
//                         <p className="empty">Không tìm thấy sản phẩm phù hợp.</p>
//                     ) : (
//                         <div className="product-list">
//                             {products.map((item) => (
//                                 <div key={item.id} className="product-card-wrapper">
//                                     <WishlistButton product={item} />
// <<<<<<< Updated upstream
//                                     <Link to={`/san-pham/${item.id}`} className="product-card">
//                                         {/* TODO: Đang điều hướng bằng id local.
//                                             Khi có backend, đảm bảo id/slug route này khớp với API chi tiết sản phẩm. */}
//                                         <div className="image-box">
//                                             {item.img ? <img src={item.img} alt={item.name} /> : null}
//                                             {promoMap.has(item.id) ? (
//                                                 <span className="product-promo" style={{ position: 'absolute', top: 8, left: 8, background: '#db2777', color: '#fff', padding: '4px 8px', borderRadius: 6, fontSize: 12 }}>
//                                                     {promoMap.get(item.id).type === 'percent' ? `-${promoMap.get(item.id).value}%` : promoMap.get(item.id).type === 'amount' ? `Giảm ${Number(promoMap.get(item.id).value).toLocaleString('vi-VN')} đ` : 'KM'}
//                                                 </span>
//                                             ) : globalPromos.length > 0 ? (
//                                                 <span className="product-promo" style={{ position: 'absolute', top: 8, left: 8, background: '#f59e0b', color: '#111', padding: '4px 8px', borderRadius: 6, fontSize: 12 }}>
//                                                     KM
//                                                 </span>
//                                             ) : null}
//                                         </div>

//                                         <div className="product-card__content">
//                                             <div className="product-card__meta">
//                                                 {/* TODO: UI đang giả định sản phẩm có `category` và `isHot`.
//                                                     Khi backend thật, cần map đúng các field badge/tag từ response. */}
//                                                 <span className="product-tag">{item.category}</span>
//                                                 {item.isHot ? <span className="product-badge">Nổi bật</span> : null}
// =======
//                                     <div className="product-card">
//                                         <Link to={`/san-pham/${item.id}`} className="product-card__main">
//                                             {/* Ảnh: position relative để absolute img hoạt động đúng */}
//                                             <div className="image-box" style={{ position: "relative" }}>
//                                                 {item.img
//                                                     ? <img src={item.img} alt={item.name} loading="lazy" />
//                                                     : <div className="image-placeholder" />}
// >>>>>>> Stashed changes
//                                             </div>

//                                             <div className="product-card__content">
//                                                 <div className="product-card__meta">
//                                                     {item.category && <span className="product-tag">{item.category}</span>}
//                                                     {item.isHot && <span className="product-badge">Nổi bật</span>}
//                                                 </div>
//                                                 <h3>{item.name}</h3>
//                                             </div>
//                                         </Link>

//                                         {/* footer: giá + tồn kho */}
//                                         <div className="product-card__footer">
//                                             <p className="price">{formatVND(item.price)}</p>
//                                             <span className={`stock ${item.in_stock ? "in-stock" : "out-stock"}`}>
//                                                 {item.in_stock ? `Còn ${item.inventory}` : "Hết hàng"}
//                                             </span>
//                                         </div>

//                                         {/* nút mua / giỏ hàng */}
//                                         <div className="product-card__quick-actions">
//                                             <ProductQuickActions product={item} />
//                                         </div>
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>
//                     )}

//                     {/* pagination */}
//                     <div className="pagination-bar">
//                         <button type="button" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1}>
//                             Trang trước
//                         </button>
//                         <span>Trang {currentPage} / {totalPages}</span>
//                         <button type="button" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages}>
//                             Trang sau
//                         </button>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default memo(ProductPage);
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

    const selectedSortOption = SORT_OPTIONS.find((o) => o.value === sortBy) ?? SORT_OPTIONS[0];

    const updatePageQuery = (nextPage) => {
        const next = new URLSearchParams(searchParams);
        if (nextPage <= 1) next.delete("page");
        else next.set("page", String(nextPage));
        setSearchParams(next);
    };

    /* load promotions */
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
            } catch {
                // ignore
            }
        })();
        return () => { alive = false; };
    }, []);

    /* load categories */
    useEffect(() => {
        let alive = true;
        categoryService.list().then((data) => {
            if (!alive || !Array.isArray(data) || data.length === 0) return;
            const seen = new Set();
            const unique = data.filter((c) => {
                if (seen.has(c.slug)) return false;
                seen.add(c.slug);
                return true;
            });
            setCategories([{ slug: "all", name: "Tất cả sản phẩm" }, ...unique]);
        }).catch(() => { });
        return () => { alive = false; };
    }, []);

    /* load products */
    useEffect(() => {
        let alive = true;
        setIsLoading(true);
        setPageError("");
        productService.list({
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
            .finally(() => { if (alive) setIsLoading(false); });
        return () => { alive = false; };
    }, [keyword, selectedCategory, selectedPriceRange, showHotOnly, showInStockOnly, sortBy, currentPage]);

    /* close sort dropdown on outside click */
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

    const handlePageChange = (next) => updatePageQuery(Math.min(Math.max(next, 1), totalPages));

    return (
        <div className="product-page">
            <div className="product-page__body">

                {/* ── SIDEBAR ── */}
                <aside className="filter-sidebar">
                    <div className="sidebar-card">
                        <h3>Danh mục</h3>
                        {categories.map((cat) => (
                            <button
                                key={cat.slug}
                                type="button"
                                className={`sidebar-option ${selectedCategory === cat.slug ? "active" : ""}`}
                                onClick={() => { setSelectedCategory(cat.slug); updatePageQuery(1); }}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    <div className="sidebar-card">
                        <h4>Mức giá</h4>
                        <div className="filter-stack">
                            {PRICE_RANGES.map((r) => (
                                <button
                                    key={r.value}
                                    type="button"
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
                            <input
                                type="checkbox"
                                checked={showHotOnly}
                                onChange={() => { setShowHotOnly((p) => !p); updatePageQuery(1); }}
                            />
                            <span>Chỉ hiển thị sản phẩm nổi bật</span>
                        </label>
                        <label className="check-option">
                            <input
                                type="checkbox"
                                checked={showInStockOnly}
                                onChange={() => { setShowInStockOnly((p) => !p); updatePageQuery(1); }}
                            />
                            <span>Chỉ hiển thị sản phẩm còn hàng</span>
                        </label>
                    </div>

                    <button type="button" className="reset-btn" onClick={resetFilters}>
                        Xóa bộ lọc
                    </button>
                </aside>

                {/* ── CONTENT ── */}
                <div className="product-content">

                    {/* filter bar */}
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
                                    onClick={() => setIsSortOpen((p) => !p)}
                                    aria-haspopup="listbox"
                                    aria-expanded={isSortOpen}
                                >
                                    <span>{selectedSortOption.label}</span>
                                    <span className="sort-dropdown__arrow" aria-hidden="true">▾</span>
                                </button>

                                {isSortOpen && (
                                    <div className="sort-dropdown__menu" role="listbox">
                                        {SORT_OPTIONS.map((o) => (
                                            <button
                                                key={o.value}
                                                type="button"
                                                className={`sort-dropdown__option ${sortBy === o.value ? "active" : ""}`}
                                                onClick={() => { setSortBy(o.value); setIsSortOpen(false); updatePageQuery(1); }}
                                                role="option"
                                                aria-selected={sortBy === o.value}
                                            >
                                                {o.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* product list */}
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
                            {products.map((item) => (
                                <div key={item.id} className="product-card-wrapper">
                                    <WishlistButton product={item} />
                                    <div className="product-card">
                                        <Link to={`/san-pham/${item.id}`} className="product-card__main">
                                            <div className="image-box" style={{ position: "relative" }}>
                                                {item.img
                                                    ? <img src={item.img} alt={item.name} loading="lazy" />
                                                    : <div className="image-placeholder" />}

                                                {/* Promo badge: ưu tiên promo gắn riêng cho sản phẩm */}
                                                {promoMap.has(item.id) ? (
                                                    <span
                                                        className="product-promo"
                                                        style={{
                                                            position: "absolute", top: 8, left: 8,
                                                            background: "#db2777", color: "#fff",
                                                            padding: "4px 8px", borderRadius: 6, fontSize: 12,
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
                                                            position: "absolute", top: 8, left: 8,
                                                            background: "#f59e0b", color: "#111",
                                                            padding: "4px 8px", borderRadius: 6, fontSize: 12,
                                                        }}
                                                    >
                                                        KM
                                                    </span>
                                                ) : null}
                                            </div>

                                            {/* nút mua / giỏ hàng — ngay dưới hình ảnh */}


                                            <div className="product-card__content">
                                                <div className="product-card__meta">
                                                    {item.category && <span className="product-tag">{item.category}</span>}
                                                    {item.isHot && <span className="product-badge">Nổi bật</span>}
                                                </div>
                                                {/* footer: giá + tồn kho — nằm ngoài Link để không trigger navigation */}
                                                <div className="product-card__footer">
                                                    <p className="price">{formatVND(item.price)}</p>
                                                    <span className={`stock ${item.in_stock ? "in-stock" : "out-stock"}`}>
                                                        {item.in_stock ? `Còn ${item.inventory}` : "Hết hàng"}
                                                    </span>
                                                </div>

                                                <div className="product-card__title-row">
                                                    <h3>{item.name}</h3>

                                                    <div onClick={(e) => e.preventDefault()}>
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
                                        </Link>



                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* pagination */}
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