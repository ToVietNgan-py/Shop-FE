import { z } from "zod";

const phoneRegex =
    /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;

export const profileFieldSchemas = {
    name: z.object({
        value: z
            .string()
            .trim()
            .min(2, "Họ tên tối thiểu 2 ký tự")
            .max(50, "Họ tên tối đa 50 ký tự"),
    }),

    dob: z.object({
        value: z
            .string()
            .min(1, "Vui lòng chọn ngày sinh")
            .refine((date) => {
                const selectedDate = new Date(date);
                const today = new Date();

                return selectedDate <= today;
            }, {
                message: "Ngày sinh không hợp lệ",
            }),
    }),

    gender: z.object({
        value: z
            .string()
            .min(1, "Vui lòng chọn giới tính"),
    }),

    phone: z.object({
        value: z
            .string()
            .trim()
            .regex(phoneRegex, "Số điện thoại không hợp lệ"),
    }),

    email: z.object({
        value: z
            .string()
            .trim()
            .email("Email không hợp lệ"),
    }),

    avatar: z.object({
        value: z.any().optional(),
    }),
};

export const profileAddressSchema = z.object({
    provinceCode: z
        .string()
        .min(1, "Vui lòng chọn tỉnh/thành"),

    districtCode: z
        .string()
        .min(1, "Vui lòng chọn quận/huyện"),

    wardCode: z
        .string()
        .min(1, "Vui lòng chọn phường/xã"),

    detailAddress: z
        .string()
        .trim()
        .min(5, "Địa chỉ quá ngắn")
        .max(255, "Địa chỉ quá dài"),
});