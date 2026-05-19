import { z } from "zod";

const phoneRegex =
    /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;

const passwordRegex =
    /^(?=.*[A-Za-z])(?=.*\d).+$/;

const ROLE_OPTIONS = [
    "admin",
    "employee",
    "customer",
];

export const accountCreateSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Họ tên tối thiểu 2 ký tự")
        .max(100, "Họ tên tối đa 100 ký tự"),

    email: z
        .string()
        .trim()
        .email("Email không hợp lệ"),

    phone: z
        .string()
        .trim()
        .regex(phoneRegex, "Số điện thoại không hợp lệ"),

    role: z
        .enum(ROLE_OPTIONS, {
            errorMap: () => ({
                message: "Role không hợp lệ",
            }),
        }),

    password: z
        .string()
        .min(8, "Mật khẩu tối thiểu 8 ký tự")
        .regex(
            passwordRegex,
            "Mật khẩu phải gồm chữ và số"
        ),
});

export const accountUpdateSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Họ tên tối thiểu 2 ký tự")
        .max(100, "Họ tên tối đa 100 ký tự"),

    email: z
        .string()
        .trim()
        .email("Email không hợp lệ"),

    phone: z
        .string()
        .trim()
        .regex(phoneRegex, "Số điện thoại không hợp lệ"),

    role: z
        .enum(ROLE_OPTIONS, {
            errorMap: () => ({
                message: "Role không hợp lệ",
            }),
        }),

    password: z
        .string()
        .trim()
        .optional()
        .or(z.literal(""))
        .refine(
            (value) => {
                if (!value) {
                    return true;
                }

                return value.length >= 8;
            },
            {
                message: "Mật khẩu tối thiểu 8 ký tự",
            }
        )
        .refine(
            (value) => {
                if (!value) {
                    return true;
                }

                return passwordRegex.test(value);
            },
            {
                message: "Mật khẩu phải gồm chữ và số",
            }
        ),
});