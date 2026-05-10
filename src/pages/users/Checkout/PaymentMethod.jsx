const METHODS = [
    { id: 'cod', icon: '🚚', label: 'Thanh toán khi nhận hàng (COD)' },
    { id: 'bank_transfer', icon: '🏦', label: 'Chuyển khoản ngân hàng' },
    { id: 'vnpay', icon: '💳', label: 'VNPay (thẻ ATM / QR)' },
];

export default function PaymentMethod({ value, onChange }) {
    return (
        <div className="payment-methods">
            {METHODS.map(m => (
                <label key={m.id} className={`pm-card ${value === m.id ? 'active' : ''}`}>
                    <input
                        type="radio" name="payment"
                        value={m.id}
                        checked={value === m.id}
                        onChange={() => onChange(m.id)}
                    />
                    <span className="pm-icon">{m.icon}</span>
                    <span>{m.label}</span>
                </label>
            ))}

            {/* Thông tin chuyển khoản — chỉ hiện khi chọn bank_transfer */}
            {value === 'bank_transfer' && (
                <div className="bank-info">
                    <p>Ngân hàng: <strong>Vietcombank</strong></p>
                    <p>Số TK: <strong>0123456789</strong></p>
                    <p>Chủ TK: <strong>DEAR ROSE SHOP</strong></p>
                    <p style={{ color: '#f59e0b', fontSize: '13px', marginTop: '8px' }}>
                        ⚠ Đơn sẽ được xử lý sau khi chúng tôi xác nhận chuyển khoản (1–3 giờ làm việc).
                    </p>
                </div>
            )}
        </div>
    );
}