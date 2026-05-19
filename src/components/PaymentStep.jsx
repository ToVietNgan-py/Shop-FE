import { MdContentCopy } from "react-icons/md";
import { useEffect, useState } from "react";
import { formatVND } from "../utils/format.js";

/**
 * Hiển thị thông tin chuyển khoản ngân hàng sau khi đặt hàng thành công.
 * Tách ra từ CheckoutPage để giảm JSX trong component chính.
 */
export function PaymentStep({ paymentInfo, orderData, total, isConfirmingPayment, onConfirm, onBack }) {
    const [copiedField, setCopiedField] = useState("");

    useEffect(() => {
        if (!copiedField) return;
        const timer = window.setTimeout(() => setCopiedField(""), 1800);
        return () => window.clearTimeout(timer);
    }, [copiedField]);

    const handleCopy = async (value, key) => {
        try {
            await navigator.clipboard.writeText(value);
            setCopiedField(key);
        } catch {
            setCopiedField("");
        }
    };

    return (
        <div className="payment-step">
            <div className="section-heading section-heading-inline">
                <h1>Thanh toán đơn hàng</h1>
            </div>

            <div className="payment-transfer-layout">
                <div className="payment-qr-card">
                    {paymentInfo.qrCodeUrl ? (
                        <img src={paymentInfo.qrCodeUrl} alt="QR thanh toán đơn hàng" />
                    ) : (
                        <div className="qr-placeholder">QR đang được backend cập nhật</div>
                    )}
                    <strong>Số tiền cần thanh toán</strong>
                    <p className="payment-amount">{formatVND(paymentInfo.amount || total)}</p>
                    <p className="payment-caption">Nội dung chuyển khoản: {paymentInfo.transferContent}</p>
                </div>

                <div className="payment-info-card">
                    <InfoRow label="Mã đơn hàng" value={orderData?.orderCode} />
                    <InfoRow label="Ngân hàng" value={paymentInfo.bankInfo.bankName} />
                    <CopyRow
                        label="Số tài khoản"
                        value={paymentInfo.bankInfo.accountNumber}
                        fieldKey="account"
                        copiedField={copiedField}
                        onCopy={handleCopy}
                    />
                    <InfoRow label="Chủ tài khoản" value={paymentInfo.bankInfo.accountName} />
                    <CopyRow
                        label="Nội dung"
                        value={paymentInfo.transferContent}
                        fieldKey="content"
                        copiedField={copiedField}
                        onCopy={handleCopy}
                    />

                    <div className="payment-step-actions">
                        <button
                            type="button"
                            className="secondary-action-btn"
                            onClick={onBack}
                            disabled={isConfirmingPayment}
                        >
                            Quay lại thông tin
                        </button>
                        <button
                            type="button"
                            className="place-order-btn"
                            onClick={onConfirm}
                            disabled={isConfirmingPayment}
                        >
                            {isConfirmingPayment ? "Đang xác nhận..." : "Tôi đã chuyển khoản"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InfoRow({ label, value }) {
    return (
        <div className="payment-info-row">
            <span>{label}</span>
            <strong>{value}</strong>
        </div>
    );
}

function CopyRow({ label, value, fieldKey, copiedField, onCopy }) {
    return (
        <div className="payment-info-row with-action">
            <div>
                <span>{label}</span>
                <strong>{value}</strong>
            </div>
            <button type="button" className="copy-btn" onClick={() => onCopy(value, fieldKey)}>
                <MdContentCopy />
                {copiedField === fieldKey ? "Đã copy" : "Copy"}
            </button>
        </div>
    );
}