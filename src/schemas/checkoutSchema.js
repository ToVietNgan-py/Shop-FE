import { z } from "zod";
import { ORDER_PAYMENT_METHODS } from "../services/orderService.js";

const phoneRegex =
    /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;

export const checkoutSchema = z.object({
    country: z
        .string()
        .min(1, "Vui lòng chọn quốc gia"),

    fullName: z
        .string()
        .trim()
        .min(2, "Họ tên tối thiểu 2 ký tự")
        .max(100, "Họ tên tối đa 100 ký tự"),

    addressDetail: z
        .string()
        .trim()
        .min(5, "Địa chỉ quá ngắn")
        .max(255, "Địa chỉ tối đa 255 ký tự"),

    city: z
        .string()
        .trim()
        .min(1, "Vui lòng chọn tỉnh/thành phố"),

    cityCode: z
        .string()
        .min(1, "Vui lòng chọn tỉnh/thành phố"),

    district: z
        .string()
        .trim()
        .min(1, "Vui lòng chọn quận/huyện"),

    districtCode: z
        .string()
        .min(1, "Vui lòng chọn quận/huyện"),

    ward: z
        .string()
        .trim()
        .min(1, "Vui lòng chọn phường/xã"),

    wardCode: z
        .string()
        .min(1, "Vui lòng chọn phường/xã"),

    phone: z
        .string()
        .trim()
        .regex(phoneRegex, "Số điện thoại không hợp lệ"),

    note: z
        .string()
        .max(500, "Ghi chú tối đa 500 ký tự")
        .optional(),

    voucher_code: z
        .string()
        .trim()
        .max(50, "Mã giảm giá không hợp lệ")
        .optional(),

    paymentMethod: z.enum([
        ORDER_PAYMENT_METHODS.COD,
        ORDER_PAYMENT_METHODS.BANK_TRANSFER,
        ORDER_PAYMENT_METHODS.VNPAY,
    ], {
        errorMap: () => ({
            message: "Vui lòng chọn phương thức thanh toán",
        }),
    }),
});