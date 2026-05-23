import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import promotionService from '../../services/promotionService';
import useCountdown from '../../hooks/useCountdown';
import './FlashSaleBanner.scss';

const fmt = (n) => String(n).padStart(2, '0');

const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

const Digit = ({ value, label }) => (
  <div className="fsb-digit">
    <span className="fsb-digit__num">{fmt(value)}</span>
    <span className="fsb-digit__label">{label}</span>
  </div>
);

const FlashProductCard = ({ product }) => {
  const discountPct =
    product.discount_percent ??
    Math.round(100 - (product.flash_price / product.original_price) * 100);

  return (
    <Link to={`/products/${product.id}`} className="fsb-product">
      <div className="fsb-product__img-wrap">
        {product.image && (
          <img src={product.image} alt={product.name} className="fsb-product__img" />
        )}
        <span className="fsb-product__badge">-{discountPct}%</span>
      </div>
      <div className="fsb-product__info">
        <p className="fsb-product__name">{product.name}</p>
        <div className="fsb-product__prices">
          <span className="fsb-product__flash-price">{formatPrice(product.flash_price)}</span>
          <span className="fsb-product__original-price">{formatPrice(product.original_price)}</span>
        </div>
      </div>
    </Link>
  );
};

// ─────────────────────────────────────────────────────────────────
const FlashSaleBanner = () => {
  const [flashSale, setFlashSale] = useState(null);
  const [loading, setLoading] = useState(true);

  // FIX 1: khởi động countdown từ 0, chỉ reset sau khi có data từ API
  const { hours, minutes, seconds, finished, reset } = useCountdown(0);

  // FIX 2: giữ reset trong ref → fetchFlashSale không bao giờ stale
  // mà cũng không cần reset trong dependency array
  const resetRef = useRef(reset);
  useEffect(() => {
    resetRef.current = reset;
  }, [reset]);

  // stable callback — không re-create khi countdown tick
  const fetchFlashSale = useCallback(async () => {
    try {
      const res = await promotionService.getFlashSale();
      const data = res.data?.data ?? null;
      setFlashSale(data);
      if (data?.remaining_seconds > 0) {
        resetRef.current(data.remaining_seconds); // dùng ref, không phải reset trực tiếp
      }
    } catch {
      setFlashSale(null);
    } finally {
      setLoading(false);
    }
  }, []); // ← dependency rỗng, stable suốt vòng đời component

  useEffect(() => {
    fetchFlashSale();
  }, [fetchFlashSale]);

  // polling 60s — stable vì fetchFlashSale không đổi
  useEffect(() => {
    const id = setInterval(fetchFlashSale, 60_000);
    return () => clearInterval(id);
  }, [fetchFlashSale]);

  if (loading || !flashSale || finished) return null;

  return (
    <section className="fsb-wrap" aria-label="Flash Sale">
      <div className="fsb-header">
        <div className="fsb-header__left">
          <span className="fsb-icon">⚡</span>
          <div>
            <h2 className="fsb-title">FLASH SALE</h2>
            <p className="fsb-subtitle">{flashSale.name}</p>
          </div>
        </div>

        <div className="fsb-countdown" aria-live="polite" aria-atomic="true">
          <span className="fsb-countdown__label">Kết thúc sau</span>
          <div className="fsb-countdown__digits">
            <Digit value={hours} label="GIỜ" />
            <span className="fsb-sep">:</span>
            <Digit value={minutes} label="PHÚT" />
            <span className="fsb-sep">:</span>
            <Digit value={seconds} label="GIÂY" />
          </div>
        </div>
      </div>

      {flashSale.products?.length > 0 && (
        <div className="fsb-products">
          {flashSale.products.map((p) => (
            <FlashProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
};

export default FlashSaleBanner;