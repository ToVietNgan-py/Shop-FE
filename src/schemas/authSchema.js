
import { z } from 'zod'

export const loginSchema = z.object({
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
})

export const registerSchema = z.object({
    name: z.string().min(2, 'Tên tối thiểu 2 ký tự'),
    email: z.string().email('Email không hợp lệ'),
    password: z
        .string()
        .min(8, "Mật khẩu tối thiểu 8 ký tự")
        .regex(
            /^(?=.*[A-Za-z])(?=.*\d).+$/,
            "Mật khẩu phải có chữ và số"
        ),
    password_confirmation: z.string(),
}).refine(d => d.password === d.password_confirmation, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['password_confirmation'],
})