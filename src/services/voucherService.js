import api from "../apis/default";

const unwrapVoucher = (responseData) => responseData?.data ?? responseData ?? {};

const throwNice = (error, fallback) => {
    const errData = error.response?.data;
    throw {
        message: errData?.message ?? errData?.error ?? error?.message ?? fallback,
        errors: errData?.errors,
        response: error.response,
    };
};

export const voucherService = {
    async apply({ code, orderTotal, cartId }) {
        try {
            const res = await api.post("/vouchers/apply", {
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
            };
        } catch (error) {
            throwNice(error, "Ma giam gia khong hop le");
        }
    },
};

