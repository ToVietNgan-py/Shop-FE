import { z } from "zod";
import dayjs from "dayjs";

const voucherTypeEnum = ["percent", "amount"];

export const voucherSchema = z.object({
    code: z
        .string()
        .trim()
        .min(3, "Mã voucher tối thiểu 3 ký tự")
        .max(50, "Mã voucher tối đa 50 ký tự")
        .regex(
            /^[A-Z0-9_-]+$/i,
            "Mã voucher chỉ được gồm chữ, số, _ hoặc -"
        ),

    description: z
        .string()
        .trim()
        .max(500, "Mô tả tối đa 500 ký tự")
        .optional()
        .or(z.literal("")),

    type: z.enum(voucherTypeEnum, {
        errorMap: () => ({
            message: "Loại voucher không hợp lệ",
        }),
    }),

    value: z
        .number({
            required_error: "Vui lòng nhập giá trị giảm",
            invalid_type_error: "Giá trị giảm không hợp lệ",
        })
        .min(1, "Giá trị giảm phải lớn hơn 0"),

    min_order_value: z
        .number({
            invalid_type_error: "Đơn tối thiểu không hợp lệ",
        })
        .min(0, "Đơn tối thiểu không được âm")
        .nullable()
        .optional(),

    max_uses: z
        .number({
            invalid_type_error: "Số lượt sử dụng không hợp lệ",
        })
        .min(1, "Số lượt sử dụng tối thiểu là 1")
        .nullable()
        .optional(),

    expires_at: z
        .any()
        .nullable()
        .refine(
            (value) => {
                if (!value) {
                    return true;
                }

                return dayjs(value).isValid();
            },
            {
                message: "Ngày hết hạn không hợp lệ",
            }
        )
        .refine(
            (value) => {
                if (!value) {
                    return true;
                }

                return dayjs(value).endOf("day").isAfter(dayjs());
            },
            {
                message: "Ngày hết hạn phải lớn hơn hiện tại",
            }
        ),

    is_active: z.boolean(),
}).superRefine((data, ctx) => {
    if (data.type === "percent" && data.value > 100) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["value"],
            message: "Voucher phần trăm không được vượt quá 100%",
        });
    }
});