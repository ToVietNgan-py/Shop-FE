import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { productService } from "../../services/productService.js";
import PageLoading from "../PageLoading/PageLoading.jsx";
import WishlistButton from "../common/WishlistButton.jsx";
import ProductQuickActions from "../common/ProductQuickActions.jsx";
import QuickShopModal from "../QuickShopModal/QuickShopModal.jsx";
import { usePromoCatalog } from "../../hooks/usePromoCatalog.js";
import { useProductPrice } from "../../hooks/useProductPrice.js";
import PriceBlock from "../common/PriceBlock.jsx";
import "./NewArrival.scss";

// ── Sub-component để mỗi card tự gọi useProductPrice ──
function NewArrivalCard({ item, onAddToCart, onBuyNow, promoMap, globalPromos }) {
  const priceInfo = useProductPrice(item, promoMap, globalPromos);

  return (
    <div style={{ position: "relative" }}>
      <WishlistButton product={item} />
      <div className="card">
        <Link to={`/san-pham/${item.id}`} className="card-main">
          <div className="image" style={{ position: "relative" }}>
            {item.img
              ? <img src={item.img} alt={item.name} />
              : null
            }
            {priceInfo?.isFlashSale && (
              <span style={{
                position: "absolute", top: 6, left: 6,
                background: "#ff3b3b", color: "#fff",
                fontSize: 11, fontWeight: 700,
                padding: "2px 7px", borderRadius: 4, zIndex: 2,
              }}>⚡ Flash</span>
            )}
          </div>
          <p className="name">{item.name}</p>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <PriceBlock priceInfo={priceInfo} center />
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

function NewArrival() {
  const [startIndex, setStartIndex] = useState(0);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quickShopProduct, setQuickShopProduct] = useState(null);
  const [quickActionType, setQuickActionType] = useState("cart");
  const ITEMS_PER_PAGE = 4;

  const { promoMap, globalPromos } = usePromoCatalog();

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
    return () => { isMounted = false; };
  }, []);

  const next = () => { if (startIndex + ITEMS_PER_PAGE < products.length) setStartIndex(startIndex + ITEMS_PER_PAGE); };
  const prev = () => { if (startIndex - ITEMS_PER_PAGE >= 0) setStartIndex(startIndex - ITEMS_PER_PAGE); };
  const visibleProducts = products.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  if (isLoading) {
    return <PageLoading compact title="Đang tải NEW ARRIVAL" description="Danh sách sản phẩm mới đang được lấy từ API." />;
  }

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
            {visibleProducts.map((item) => (
              <NewArrivalCard
                key={item.id}
                item={item}
                promoMap={promoMap}
                globalPromos={globalPromos}
                onAddToCart={(product) => { setQuickActionType("cart"); setQuickShopProduct(product); }}
                onBuyNow={(product) => { setQuickActionType("buy"); setQuickShopProduct(product); }}
              />
            ))}
          </div>
          <button className="arrow right" onClick={next} disabled={startIndex + ITEMS_PER_PAGE >= products.length}>›</button>
        </div>
      </div>
      {quickShopProduct && (
        <QuickShopModal
          product={quickShopProduct}
          actionType={quickActionType}
          onClose={() => setQuickShopProduct(null)}
        />
      )}
    </>
  );
}

export default NewArrival;