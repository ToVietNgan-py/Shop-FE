import { z } from 'zod';

const optionalPhone = z.string().trim().optional().refine(
    (value) => !value || /^0[0-9]{9}$/.test(value),
    'Số điện thoại không hợp lệ (VD: 0912345678)'
);

export const accountCreateSchema = z.object({
    name: z.string().trim().min(2, 'Tên tối thiểu 2 ký tự'),
    email: z.string().trim().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
    phone: optionalPhone,
    role: z.enum(['employee', 'admin', 'customer'], {
        message: 'Vui lòng chọn role',
    }),
    password: z.string()
        .min(8, 'Mật khẩu tối thiểu 8 ký tự')
        .regex(/[A-Za-z]/, 'Mật khẩu phải có ít nhất một chữ cái')
        .regex(/\d/, 'Mật khẩu phải có ít nhất một chữ số'),
});

export const accountUpdateSchema = z.object({
    name: z.string().trim().min(2, 'Tên tối thiểu 2 ký tự'),
    email: z.string().trim().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
    phone: optionalPhone,
});

export const voucherSchema = z.object({
    code: z.string().trim().min(2, 'Mã voucher tối thiểu 2 ký tự').max(50, 'Mã voucher tối đa 50 ký tự'),
    description: z.string().trim().max(255, 'Mô tả tối đa 255 ký tự').optional(),
    type: z.enum(['percent', 'amount'], {
        message: 'Vui lòng chọn loại giảm',
    }),
    value: z.coerce.number().min(1, 'Giá trị phải lớn hơn 0'),
    min_order_value: z.coerce.number().min(0, 'Đơn hàng tối thiểu không được âm').optional().nullable(),
    max_uses: z.coerce.number().int('Số lần dùng phải là số nguyên').min(1, 'Số lần dùng tối thiểu là 1').optional().nullable(),
    expires_at: z.any().optional().nullable(),
    is_active: z.boolean().default(true),
}).superRefine((data, ctx) => {
    if (data.type === 'percent' && data.value > 100) {
        ctx.addIssue({
            code: 'custom',
            path: ['value'],
            message: 'Giảm theo phần trăm không được vượt quá 100%',
        });
    }
});
