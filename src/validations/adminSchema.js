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

export const promotionSchema = z.object({
    name: z.string().trim().min(2, 'Tên tối thiểu 2 ký tự').max(150, 'Tên tối đa 150 ký tự'),
    description: z.string().trim().max(255, 'Mô tả tối đa 255 ký tự').optional().nullable(),
    type: z.enum(['percent', 'amount'], { message: 'Vui lòng chọn loại giảm' }),
    value: z.coerce.number().min(0, 'Giá trị phải >= 0'),
    min_order_total: z.coerce.number().min(0, 'Đơn hàng tối thiểu không được âm').optional().nullable(),
    max_discount: z.coerce.number().min(0, 'Giá trị tối đa phải >= 0').optional().nullable(),
    priority: z.coerce.number().int().min(0).optional().default(0),
    starts_at: z.any().optional().nullable(),
    expires_at: z.any().optional().nullable(),
    usage_limit: z.coerce.number().int().min(1).optional().nullable(),
    is_active: z.boolean().default(true),
    product_ids: z.array(z.string().or(z.number())).optional().nullable(),
    category_ids: z.array(z.string().or(z.number())).optional().nullable(),
}).superRefine((data, ctx) => {
    if (data.type === 'percent' && data.value > 100) {
        ctx.addIssue({ code: 'custom', path: ['value'], message: 'Giảm theo phần trăm không được vượt quá 100%' });
    }
    if (data.starts_at && data.expires_at) {
        try {
            const s = new Date(data.starts_at);
            const e = new Date(data.expires_at);
            if (s > e) {
                ctx.addIssue({ code: 'custom', path: ['expires_at'], message: 'Thời gian kết thúc phải sau thời gian bắt đầu' });
            }
        } catch (e) { }
    }
});
