const formatVND = (n) => n.toLocaleString('vi-VN') + '₫';

export default function OrderSummary({ items, subtotal, discount }) {
    const safeItems = Array.isArray(items) ? items : [];
    const shipping = subtotal >= 500_000 ? 0 : 30_000;  // miễn ship khi ≥ 500k

    const total = subtotal - discount + shipping;

    return (
        <div className="order-summary">
            <h3>Đơn hàng của bạn</h3>

            <ul className="summary-items">
                {safeItems.map((item) => {
                    const product = item.product ?? {};
                    const thumbnail = product.thumbnail ?? product.image ?? item.image ?? "";
                    const name = product.name ?? item.name ?? "Sản phẩm";
                    const quantity = Number(item.quantity ?? 1);
                    const price = Number(item.price ?? 0);
                    const lineTotal = price * quantity;
                    const key = item.id ?? item.productId ?? `${name}-${item.color ?? ""}-${item.size ?? ""}`;

                    return (
                        <li key={key}>
                            {thumbnail ? (
                                <img src={thumbnail} alt={name} />
                            ) : (
                                <img src="/logo.png" alt={name} />
                            )}
                            <div>
                                <p>{name}</p>
                                {item.color && <span>{item.color}</span>}
                                {item.size && <span>{item.size}</span>}
                            </div>
                            <span>x{quantity}</span>
                            <span>{formatVND(lineTotal)}</span>
                        </li>
                    );
                })}
            </ul>

            <div className="summary-totals">
                <div><span>Tạm tính</span><span>{formatVND(subtotal)}</span></div>
                {discount > 0 && (
                    <div className="discount-row">
                        <span>Giảm giá</span>
                        <span>- {formatVND(discount)}</span>
                    </div>
                )}
                <div>
                    <span>Phí vận chuyển</span>
                    <span>{shipping === 0 ? 'Miễn phí' : formatVND(shipping)}</span>
                </div>
                <div className="total-row">
                    <span>Tổng cộng</span>
                    <strong>{formatVND(total)}</strong>
                </div>
            </div>
        </div>
    );
}