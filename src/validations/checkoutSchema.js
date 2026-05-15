import { z } from 'zod';

export const checkoutSchema = z.object({
    country: z.string().trim().min(1, 'Vui lòng chọn quốc gia'),
    fullName: z.string().trim().min(2, 'Vui lòng nhập họ tên'),
    phone: z.string().trim().regex(/^0[0-9]{9}$/, 'Số điện thoại không hợp lệ (VD: 0912345678)'),
    addressDetail: z.string().trim().min(5, 'Vui lòng nhập số nhà, tên đường'),
    city: z.string().trim().min(1, 'Vui lòng chọn tỉnh/thành phố'),
    cityCode: z.string().trim().min(1, 'Vui lòng chọn tỉnh/thành phố'),
    district: z.string().trim().min(1, 'Vui lòng chọn quận/huyện'),
    districtCode: z.string().trim().min(1, 'Vui lòng chọn quận/huyện'),
    ward: z.string().trim().min(1, 'Vui lòng chọn phường/xã'),
    wardCode: z.string().trim().min(1, 'Vui lòng chọn phường/xã'),
    paymentMethod: z.enum(['cod', 'bank_transfer', 'vnpay'], {
        message: 'Vui lòng chọn phương thức thanh toán',
    }),
    note: z.string().trim().max(500, 'Ghi chú tối đa 500 ký tự').optional(),
    voucher_code: z.string().trim().max(50, 'Mã giảm giá tối đa 50 ký tự').optional(),
});
