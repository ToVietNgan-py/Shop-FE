import api from '../apis/default';

export const voucherService = {
    apply: (code) => api.post('/vouchers/apply', { code }),
    // response: { discount, discount_type, message }
};

