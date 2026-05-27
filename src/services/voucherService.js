import api from "../apis/default";

<<<<<<< Updated upstream
const unwrapVoucher = (responseData) => responseData?.data ?? responseData ?? {};

const throwNice = (error, fallback) => {
    const errData = error.response?.data;
    throw {
        message: errData?.message ?? errData?.error ?? error?.message ?? fallback,
        errors: errData?.errors,
        response: error.response,
=======
// Gọi BE thật: POST /api/vouchers/apply
// BE trả về: { code, type, value, discount, min_order_total, max_discount, message }
// Voucher tính trên order_total đã trừ promotion discount (xử lý ở useCheckoutOrder).
const throwNice = (error, fallback) => {
    const errData = error?.response?.data;
    throw {
        message: errData?.message ?? errData?.error ?? fallback,
        errors: errData?.errors,
        status: error?.response?.status,
>>>>>>> Stashed changes
    };
};

export const voucherService = {
    async apply({ code, orderTotal }) {
        const normalized = String(code ?? "").trim().toUpperCase();
        if (!normalized) throw { message: "Vui lòng nhập mã giảm giá" };
        if (Number(orderTotal) <= 0) throw { message: "Đơn hàng chưa có sản phẩm để áp mã giảm giá." };

        try {
            const res = await api.post("/vouchers/apply", {
<<<<<<< Updated upstream
                code: String(code ?? "").trim().toUpperCase(),
                order_total: Number(orderTotal ?? 0),
                cart_id: cartId,
            });
            const data = unwrapVoucher(res.data);
            return {
                code: data.code,
                type: data.type,
                discount: Number(data.discount ?? 0),
                finalTotal: Number(data.final_total ?? data.finalTotal ?? 0),
=======
                code: normalized,
                order_total: Number(orderTotal),
            });
            const data = res?.data?.data ?? res?.data ?? {};
            return {
                code: data.code ?? normalized,
                type: data.type ?? "amount",
                value: Number(data.value ?? 0),
                discount: Number(data.discount ?? 0),
                minOrderTotal: Number(data.min_order_total ?? 0),
                maxDiscount: Number(data.max_discount ?? 0),
                message: data.message ?? "Áp dụng mã thành công",
>>>>>>> Stashed changes
            };
        } catch (error) {
            throwNice(error, "Mã giảm giá không hợp lệ.");
        }
    },
};
