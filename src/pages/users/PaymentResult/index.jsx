import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import paymentService from '../../../services/paymentService';
import './style.scss';

export default function PaymentResultPage() {
    const navigate = useNavigate();

    const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'fail'
    const [orderId, setOrderId] = useState(null);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const qs = window.location.search.replace('?', '');

        paymentService
            .confirmReturn(qs)
            .then((res) => {
                const { success, order_id, message: serverMessage } = res.data || {};

                if (!isMounted) return;

                setOrderId(order_id ?? null);
                setMessage(serverMessage ?? '');
                setStatus(success ? 'success' : 'fail');
            })
            .catch(() => {
                if (!isMounted) return;

                setStatus('fail');
                setMessage('Không thể xác nhận giao dịch. Vui lòng kiểm tra lại trong mục Đơn hàng.');
            })
            .finally(() => {
                if (!isMounted) return;
                setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    if (isLoading || status === 'verifying') {
        return (
            <div className="payment-result verifying">
                <div className="spinner" />
                <p>Đang xác nhận thanh toán...</p>
            </div>
        );
    }

    return (
        <div className={`payment-result ${status}`}>
            {status === 'success' ? (
                <>
                    <div className="result-icon success-icon">✓</div>
                    <h1>Thanh toán thành công!</h1>
                    <p>{message || 'Đơn hàng của bạn đã được xác nhận và đang được xử lý.'}</p>
                    <div className="result-actions">
                        {orderId && (
                            <Link to={`/don-hang/${orderId}`} className="btn-primary">
                                Xem đơn hàng →
                            </Link>
                        )}
                        <Link to="/" className="btn-secondary">
                            Tiếp tục mua sắm
                        </Link>
                    </div>
                </>
            ) : (
                <>
                    <div className="result-icon fail-icon">✗</div>
                    <h1>Thanh toán thất bại</h1>
                    <p>{message}</p>
                    <div className="result-actions">
                        {orderId && (
                            <Link to={`/don-hang/${orderId}`} className="btn-primary">
                                Kiểm tra đơn hàng
                            </Link>
                        )}
                        <button onClick={() => navigate(-1)} className="btn-secondary">
                            Thử lại
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

