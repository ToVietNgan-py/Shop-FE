import api from '../apis/default';

const paymentService = {
    createOrder: (data) => api.post('/orders', data),
    // data: { cart_id, address_id, payment_method, voucher_code?, note? }
    // response: { data: { id, status, payment_method, ... } }

    createVNPay: (orderId) => api.post('/payment/vnpay/create', { order_id: orderId }),
    // response: { payment_url: 'https://sandbox.vnpayment.vn/...' }

    confirmReturn: (queryString) => api.get(`/payment/vnpay/return?${queryString}`),
    // gddPaymentResult cb BE verify signature
    // response: { success: bool, order_id, message }
};

export { paymentService };
export default paymentService;

