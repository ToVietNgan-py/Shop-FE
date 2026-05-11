import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().trim().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
    password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});

export const registerSchema = z.object({
    name: z.string().trim().min(2, 'Tên tối thiểu 2 ký tự'),
    email: z.string().trim().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
    password: z.string()
        .min(8, 'Mật khẩu tối thiểu 8 ký tự')
        .regex(/[A-Za-z]/, 'Mật khẩu phải có ít nhất một chữ cái')
        .regex(/\d/, 'Mật khẩu phải có ít nhất một chữ số'),
    password_confirmation: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
}).refine(data => data.password === data.password_confirmation, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['password_confirmation'],
});
