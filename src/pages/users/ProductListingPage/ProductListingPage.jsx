/**
 * ProductListingPage.jsx
 * Route: /products  (hoặc /shop)
 *
 * Flow:
 * 1. Fetch flash sale → lấy danh sách product id + flash_price
 * 2. Fetch product list
 * 3. Merge: product nào nằm trong flash sale → gắn flashPrice
 * 4. Render FlashSaleBanner (đã có countdown riêng)
 * 5. Render ProductCard grid, flash card có border đỏ + badge ⚡
 *
 * Khi hết flash sale (finished = true từ useCountdown trong Banner):
 * → polling 60s của Banner sẽ trả active:false → Banner tự ẩn
 * → flashSaleMap clear → product card về giá gốc
 */
import { useEffect, useState, useCallback } from 'react';
import FlashSaleBanner from '../../../components/FlashSaleBanner/FlashSaleBanner.jsx';
import ProductCard from '../../../components/product/ProductCard';
import { promotionService } from '../../../services/promotionService';
import { productService } from '../../../services/productService'; // tự có sẵn
import './ProductListingPage.scss';

// ── Category filter tabs ───────────────────────────────────────────
const CATEGORIES = [
    { key: '', label: 'Tất cả' },
    { key: 'toner', label: 'Toner' },
    { key: 'serum', label: 'Serum' },
    { key: 'cleanser', label: 'Cleanser' },
    { key: 'moisturizer', label: 'Kem dưỡng' },
    { key: 'sunscreen', label: 'Kem chống nắng' },
];

const SORTS = [
    { key: 'newest', label: 'Mới nhất' },
    { key: 'flash', label: '⚡ Flash Sale' },
    { key: 'price_asc', label: 'Giá tăng dần' },
    { key: 'price_desc', label: 'Giá giảm dần' },
];

// ── Main ───────────────────────────────────────────────────────────
const ProductListingPage = () => {
    const [products, setProducts] = useState([]);
    const [flashMap, setFlashMap] = useState({}); // { [productId]: flash_price }
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState('');
    const [sort, setSort] = useState('newest');
    const [cart, setCart] = useState([]);   // mini cart count

    // ── Fetch flash sale map ─────────────────────────────────────────
    const loadFlashMap = useCallback(async () => {
        try {
            const res = await promotionService.getFlashSale();
            const data = res.data?.data;
            console.log('🔥 Flash sale data:', data); // thêm dòng này

            if (!data || data.remaining_seconds <= 0) {
                setFlashMap({});
                return;
            }
            const map = {};
            (data.products ?? []).forEach((p) => {
                map[p.id] = p.flash_price;
            });
            console.log('🗺️ Flash map:', map); // thêm dòng này

            setFlashMap(map);
        } catch {
            setFlashMap({});
        }
    }, []);

    // ── Fetch products ───────────────────────────────────────────────
    const loadProducts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await productService.list({
                category: category || undefined,
                sort,
            });
            setProducts(res.data?.data ?? res.data ?? []);
        } catch {
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, [category, sort]);

    useEffect(() => {
        loadFlashMap();
        loadProducts();
    }, [loadFlashMap, loadProducts]);

    // Polling flash map mỗi 60s (đồng bộ với Banner)
    useEffect(() => {
        const id = setInterval(loadFlashMap, 60_000);
        return () => clearInterval(id);
    }, [loadFlashMap]);

    // ── Merge flash price vào product ───────────────────────────────
    const enriched = products.map((p) => {
        const flashPrice = flashMap[p.id] ?? null;
        if (flashPrice) console.log(`⚡ Product ${p.id} có flash price:`, flashPrice); // thêm
        return { ...p, flashPrice };
    });

    // ── Sort flash lên đầu nếu chọn filter Flash ────────────────────
    const displayed = sort === 'flash'
        ? [...enriched].sort((a, b) => (b.flashPrice ? 1 : 0) - (a.flashPrice ? 1 : 0))
        : enriched;

    // ── Add to cart ─────────────────────────────────────────────────
    const handleAddToCart = (product) => {
        setCart((prev) => [...prev, product.id]);
        // TODO: gọi cartService.add(product.id, 1)
    };

    return (
        <div className="plp">
            {/* Flash sale banner — tự fetch + countdown riêng */}
            <FlashSaleBanner />

            {/* Page header */}
            <div className="plp__head">
                <h1 className="plp__title">Sản phẩm</h1>
                {cart.length > 0 && (
                    <div className="plp__cart-indicator">
                        🛒 {cart.length} sản phẩm trong giỏ
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="plp__controls">
                {/* Category tabs */}
                <div className="plp__cats">
                    {CATEGORIES.map((c) => (
                        <button
                            key={c.key}
                            className={`plp__cat-btn${category === c.key ? ' plp__cat-btn--on' : ''}`}
                            onClick={() => setCategory(c.key)}
                        >
                            {c.label}
                        </button>
                    ))}
                </div>

                {/* Sort */}
                <select
                    className="plp__sort"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                >
                    {SORTS.map((s) => (
                        <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                </select>
            </div>

            {/* Flash badge filter shortcut */}
            {Object.keys(flashMap).length > 0 && sort !== 'flash' && (
                <div className="plp__flash-hint">
                    <span>⚡</span>
                    <span>Có {Object.keys(flashMap).length} sản phẩm đang Flash Sale</span>
                    <button className="plp__flash-hint-btn" onClick={() => setSort('flash')}>
                        Xem trước
                    </button>
                </div>
            )}

            {/* Grid */}
            {loading ? (
                <div className="plp__skeleton-grid">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="plp__skeleton-card" />
                    ))}
                </div>
            ) : (
                <div className="plp__grid">
                    {displayed.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            onAddToCart={handleAddToCart}
                            onWishlist={(p) => console.log('wishlist', p.id)}
                        />
                    ))}
                </div>
            )}

            {!loading && displayed.length === 0 && (
                <div className="plp__empty">
                    <p>Không có sản phẩm nào trong danh mục này.</p>
                </div>
            )}
        </div>
    );
};

export default ProductListingPage;