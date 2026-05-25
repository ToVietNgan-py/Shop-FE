import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { productService } from "../../services/productService.js";
import { promotionUtils } from "../../services/promotionService.js";
import { formatVND } from "../../utils/format.js";
import { useFlashSale } from "../../context/FlashSaleContext.jsx";
import PageLoading from "../PageLoading/PageLoading.jsx";
import WishlistButton from "../common/WishlistButton.jsx";
import ProductQuickActions from "../common/ProductQuickActions.jsx";
import QuickShopModal from "../QuickShopModal/QuickShopModal.jsx";
import "./NewArrival.scss";

function NewArrival() {
  const [startIndex, setStartIndex] = useState(0);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quickShopProduct, setQuickShopProduct] = useState(null);
  const [quickActionType, setQuickActionType] = useState("cart");
  const [promoMap, setPromoMap] = useState(new Map());
  const [globalPromos, setGlobalPromos] = useState([]);
  const ITEMS_PER_PAGE = 4;
  const { getFlashInfo, isFlash } = useFlashSale();

  // Load newest products
  useEffect(() => {
    let isMounted = true;
    async function loadProducts() {
      setIsLoading(true);
      const result = await productService.list({ sortBy: "newest", limit: 8, page: 1 });
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

  // Load promotions for flash sale calculations
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
    return () => {
      alive = false;
    };
  }, []);

  if (isLoading) {
    return <PageLoading compact title="Đang tải NEW ARRIVAL" description="Danh sách sản phẩm mới đang được lấy từ API." />;
  }

  const next = () => {
    if (startIndex + ITEMS_PER_PAGE < products.length) setStartIndex(startIndex + ITEMS_PER_PAGE);
  };
  const prev = () => {
    if (startIndex - ITEMS_PER_PAGE >= 0) setStartIndex(startIndex - ITEMS_PER_PAGE);
  };
  const visibleProducts = products.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const renderPrice = (item) => {
    const allPromos = [...(promoMap.has(item.id) ? [promoMap.get(item.id)] : []), ...globalPromos];
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
    <>
      <div className="new-arrival">
        <div className="header">
          <h2>NEW ARRIVAL</h2>
          <Link to="/san-pham"><button>Xem tất cả</button></Link>
        </div>
        <div className="slider">
          <button className="arrow left" onClick={prev} disabled={startIndex === 0}>‹</button>
          <div className="list">
            {visibleProducts.map((item) => {
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
                        {hasFlash && (
                          <span style={{
                            position: "absolute",
                            top: 6,
                            left: 6,
                            background: "#ff3b3b",
                            color: "#fff",
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "2px 7px",
                            borderRadius: 4,
                          }}>⚡ Flash</span>
                        )}
                      </div>
                      <p className="name">{item.name}</p>
                      {hasFlash ? (
                        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                          <p className="price" style={{ color: "#ff3b3b", margin: 0 }}>{formatVND(displayPrice)}</p>
                          <p style={{ margin: 0, fontSize: 12, color: "#999", textDecoration: "line-through" }}>{formatVND(item.price)}</p>
                        </div>
                      ) : renderPrice(item)}
                    </Link>
                    <ProductQuickActions
                      product={{ ...item, flashPrice: hasFlash ? displayPrice : undefined }}
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
        {quickShopProduct && (
          <QuickShopModal
            product={quickShopProduct}
            actionType={quickActionType}
            onClose={() => setQuickShopProduct(null)}
          />
        )}
      </div>
    </>
  );
}

export default NewArrival;