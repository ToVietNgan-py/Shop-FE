import { z } from 'zod';

export const profileFieldSchemas = {
    name: z.object({
        value: z.string().trim().min(2, 'Họ tên tối thiểu 2 ký tự'),
    }),
    dob: z.object({
        value: z.string().trim().optional().refine((value) => {
            if (!value) return true;
            return new Date(value) <= new Date();
        }, 'Ngày sinh không được ở tương lai'),
    }),
    gender: z.object({
        value: z.enum(['', 'male', 'female', 'other']),
    }),
    phone: z.object({
        value: z.string().trim().regex(/^0[0-9]{9}$/, 'Số điện thoại không hợp lệ (VD: 0912345678)'),
    }),
    address: z.object({
        value: z.string().trim().min(10, 'Vui lòng nhập địa chỉ đầy đủ'),
    }),
};

export const profileAddressSchema = z.object({
    provinceCode: z.string().trim().min(1, 'Vui lòng chọn tỉnh/thành'),
    districtCode: z.string().trim().min(1, 'Vui lòng chọn quận/huyện'),
    wardCode: z.string().trim().min(1, 'Vui lòng chọn phường/xã'),
    detailAddress: z.string().trim().min(5, 'Vui lòng nhập số nhà, tên đường'),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: z.string()
        .min(8, 'Mật khẩu mới tối thiểu 8 ký tự')
        .regex(/[A-Za-z]/, 'Mật khẩu mới phải có ít nhất một chữ cái')
        .regex(/\d/, 'Mật khẩu mới phải có ít nhất một chữ số'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu mới'),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
});
