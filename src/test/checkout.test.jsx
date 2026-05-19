vi.mock('@/services/orderService')

describe('Checkout flow', () => {
    it('hiển thị form checkout', () => { /* ... */ })
    it('submit form thiếu địa chỉ báo lỗi validation', async () => { /* ... */ })
    it('đặt hàng thành công redirect sang PaymentResult', async () => { /* ... */ })
})