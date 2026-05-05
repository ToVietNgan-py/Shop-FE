import api from "../apis/default.js";

const throwNice = (error, fallback) => {
    const errData = error.response?.data;
    throw {
        message: errData?.message ?? errData?.error ?? fallback,
        errors: errData?.errors,
        response: error.response,
    };
};

export const voucherService = {
    async apply({ code, orderTotal, cartId }) {
        try {
            const res = await api.post("/vouchers/apply", {
                code: code.trim().toUpperCase(),
                cart_id: cartId ?? undefined,
                order_total: orderTotal,
            });

            const data = res.data?.data ?? res.data;

            return {
                code: data.code ?? code.trim().toUpperCase(),
                type: data.type ?? "amount",
                value: Number(data.value ?? 0),
                discount: Number(data.discount ?? data.discount_amount ?? 0),
                minOrderTotal: Number(data.min_order_total ?? data.minOrderTotal ?? 0),
                maxDiscount: Number(data.max_discount ?? data.maxDiscount ?? 0),
                message: data.message ?? "",
            };
        } catch (error) {
            throwNice(error, "Ma giam gia khong hop le");
        }
    },
};
