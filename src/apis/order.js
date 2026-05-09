import api from "./default.js";

export const ORDER_PAYMENT_METHODS = {
    COD: "cod",
    QR: "qr"
};

const normalizePaymentMethod = (value) => (
    value === ORDER_PAYMENT_METHODS.COD ? ORDER_PAYMENT_METHODS.COD : ORDER_PAYMENT_METHODS.QR
);

export const normalizeOrderItemPayload = (item) => ({
    productId: Number(item.id),
    productName: item.name,
    image: item.image,
    unitPrice: Number(item.price) || 0,
    quantity: Math.max(1, Number(item.quantity) || 1),
    variant: {
        color: item.color || "",
        size: item.size || ""
    }
});

export const buildCreateOrderPayload = ({
    customer,
    shippingAddress,
    items,
    paymentMethod,
    couponCode,
    note
}) => ({
    customer: {
        fullName: customer.fullName.trim(),
        phone: customer.phone.trim()
    },
    shippingAddress: {
        country: shippingAddress.country,
        city: shippingAddress.city,
        district: shippingAddress.district,
        ward: shippingAddress.ward,
        addressLine: shippingAddress.addressLine.trim()
    },
    note: note?.trim() || "",
    couponCode: couponCode?.trim().toUpperCase() || "",
    paymentMethod: normalizePaymentMethod(paymentMethod),
    items: items.map(normalizeOrderItemPayload)
});

const normalizeBankInfo = (bankInfo) => ({
    bankName: bankInfo?.bankName || "",
    accountName: bankInfo?.accountName || "",
    accountNumber: bankInfo?.accountNumber || ""
});

const normalizePaymentInfo = (paymentInfo) => ({
    qrCodeUrl: paymentInfo?.qrCodeUrl || "",
    transferContent: paymentInfo?.transferContent || "",
    amount: Number(paymentInfo?.amount) || 0,
    bankInfo: normalizeBankInfo(paymentInfo?.bankInfo)
});

export const normalizeCreateOrderResponse = (payload) => ({
    orderCode: payload?.orderCode || "",
    status: payload?.status || "",
    paymentMethod: normalizePaymentMethod(payload?.paymentMethod),
    paymentStatus: payload?.paymentStatus || "",
    totalAmount: Number(payload?.totalAmount) || 0,
    paymentInfo: normalizePaymentInfo(payload?.paymentInfo)
});

export const normalizeConfirmPaymentResponse = (payload) => ({
    orderCode: payload?.orderCode || "",
    status: payload?.status || "",
    paymentStatus: payload?.paymentStatus || ""
});

export const orderApi = {
    async createOrder(payload) {
        const response = await api.post("/orders", payload);
        return normalizeCreateOrderResponse(response.data?.data ?? response.data);
    },

    async confirmPayment({ orderCode }) {
        const response = await api.post(`/orders/${orderCode}/confirm-payment`);
        return normalizeConfirmPaymentResponse(response.data?.data ?? response.data);
    }
};