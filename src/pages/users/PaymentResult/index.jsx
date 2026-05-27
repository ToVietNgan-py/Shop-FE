import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { orderService } from '../../../services/orderService.js';
import './style.scss';

// VNPay redirect về BE → BE verify signature, update DB, rồi redirect tiếp về FE
// với query đã rút gọn: ?success=1&order_id=...&txn_ref=...&message=...
// Tuy nhiên ở môi trường sandbox, signature có thể fail dù VNPay đã trừ tiền.
// Vì vậy ta đọc query để biết flag hiển thị, đồng thời lấy trạng thái thực từ BE
// qua GET /orders/{id} để xác thực và override flag khi cần.
const parseQuery = () => {
    if (typeof window === 'undefined') {
        return { orderId: null, isSuccessByQuery: false, messageParam: '' };
    }

    const params = new URLSearchParams(window.location.search);
    const successFlag = params.get('success');
    const orderIdParam = params.get('order_id');

    return {
        orderId: orderIdParam ? Number(orderIdParam) : null,
        isSuccessByQuery: successFlag === '1' || successFlag === 'true',
        messageParam: params.get('message') ?? '',
    };
};

export default function PaymentResultPage() {
    const navigate = useNavigate();

    const { orderId, isSuccessByQuery, messageParam } = useMemo(() => parseQuery(), []);
    const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'fail'
    const [message, setMessage] = useState('');

    useEffect(() => {
        let cancelled = false;

        async function resolveResult() {
            // Không có order_id (truy cập trực tiếp) → dựa hẳn vào query.
            if (!orderId) {
                setMessage(messageParam || (isSuccessByQuery ? 'Thanh toán thành công.' : 'Giao dịch không thành công.'));
                setStatus(isSuccessByQuery ? 'success' : 'fail');
                return;
            }

            try {
                const order = await orderService.getOrder(orderId);
                if (cancelled) return;

                const paymentStatus = String(order?.paymentStatus || '').toLowerCase();
                const isPaid = paymentStatus === 'paid' || paymentStatus === 'success';
                const isFailed = paymentStatus === 'failed' || paymentStatus === 'cancelled';

                if (isPaid) {
                    setMessage(messageParam || 'Thanh toán thành công.');
                    setStatus('success');
                    return;
                }

                if (isFailed) {
                    setMessage(messageParam || 'Giao dịch không thành công.');
                    setStatus('fail');
                    return;
                }

                // Pending: tin theo flag query (sandbox đôi khi chưa kịp gửi IPN).
                setMessage(
                    messageParam
                    || (isSuccessByQuery
                        ? 'Thanh toán đang được xác nhận. Bạn có thể xem chi tiết trong đơn hàng.'
                        : 'Giao dịch không thành công.')
                );
                setStatus(isSuccessByQuery ? 'success' : 'fail');
            } catch (err) {
                if (cancelled) return;
                console.warn('[PaymentResult] Không lấy được trạng thái đơn:', err?.message);
                setMessage(messageParam || (isSuccessByQuery ? 'Thanh toán thành công.' : 'Không xác nhận được giao dịch.'));
                setStatus(isSuccessByQuery ? 'success' : 'fail');
            }
        }

        resolveResult();

        return () => {
            cancelled = true;
        };
    }, [orderId, isSuccessByQuery, messageParam]);

    // Render verifying state as centered card
    if (status === 'verifying') {
        return (
            <div className="payment-result-page">
                <div className="payment-result-card">
                    <div className="spinner" />
                    <h1>Đang xác nhận thanh toán</h1>
                    <p>Vui lòng chờ trong giây lát. Chúng tôi đang xác thực giao dịch của bạn.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="payment-result-page">
            <div className={`payment-result-card ${status === 'success' ? 'success' : 'failed'}`}>
                {status === 'success' ? (
                    <>
                        <div className="result-icon success">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" fill="#FCEFF3" />
                                <path d="M7 13l3 3 7-8" stroke="#D6336C" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <h1>Thanh toán thành công</h1>
                        <p>{message || 'Đơn hàng của bạn đã được xác nhận và đang được xử lý.'}</p>
                        <div className="result-actions">
                            {orderId && (
                                <Link to={`/don-hang/${orderId}`} className="primary-action">
                                    Xem đơn hàng
                                </Link>
                            )}
                            <Link to="/" className="secondary-action">
                                Tiếp tục mua sắm
                            </Link>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="result-icon failed">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" fill="#FFF5F6" />
                                <path d="M15 9l-6 6M9 9l6 6" stroke="#D6336C" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <h1>Thanh toán thất bại</h1>
                        <p>{message || 'Giao dịch không thành công. Vui lòng thử lại hoặc liên hệ hỗ trợ nếu tiền đã bị trừ.'}</p>
                        <div className="result-actions">
                            {orderId && (
                                <Link to={`/don-hang/${orderId}`} className="primary-action">
                                    Kiểm tra đơn hàng
                                </Link>
                            )}
                            <button onClick={() => navigate(-1)} className="secondary-action">
                                Thử lại
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
