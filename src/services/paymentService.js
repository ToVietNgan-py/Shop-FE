import api from "../apis/default.js";

const throwNice = (error, fallback) => {
    const errData = error.response?.data;
    throw {
        message: errData?.message ?? errData?.error ?? fallback,
        errors: errData?.errors,
        response: error.response,
    };
};

export const paymentService = {
    async createVNPay({ orderId, orderCode, returnUrl }) {
        try {
            const res = await api.post("/payment/vnpay/create", {
                order_id: orderId ?? undefined,
                order_code: orderCode ?? undefined,
                return_url: returnUrl ?? `${window.location.origin}/thanh-toan/ket-qua`,
            });

            const data = res.data?.data ?? res.data;

            return {
                paymentUrl: data.payment_url ?? data.url ?? data.paymentUrl ?? "",
                qrCodeUrl: data.qr_code_url ?? data.qrCodeUrl ?? data.qr_url ?? data.qrUrl ?? data.qr_code ?? data.qrCode ?? data.qr ?? "",
                transactionId: data.transaction_id ?? data.transactionId ?? null,
            };
        } catch (error) {
            throwNice(error, "Khong the tao lien ket thanh toan VNPay");
        }
    },

    async confirmReturn(vnpayParams) {
        try {
            const res = await api.get("/payment/vnpay/return", {
                params: vnpayParams,
            });

            const data = res.data?.data ?? res.data;

            const success = data.success !== undefined
                ? data.success
                : data.status === "success" || data.vnp_ResponseCode === "00";

            return {
                success: Boolean(success),
                orderId: data.order_id ?? data.orderId ?? null,
                orderCode: data.order_code ?? data.orderCode ?? "",
                message: data.message ?? "",
                order: data.order ?? null,
            };
        } catch (error) {
            throwNice(error, "Khong the xac nhan ket qua thanh toan");
        }
    },
};
