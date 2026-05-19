import api from "../apis/default.js";

export const ORDER_PAYMENT_METHODS = {
    COD: "cod",
    BANK_TRANSFER: "bank_transfer",
    BANK: "bank",
    VNPAY: "vnpay",
};

const normalizePaymentMethod = (value) => {
    const normalized = String(value ?? "").trim().toLowerCase();

    if (normalized === ORDER_PAYMENT_METHODS.COD || normalized === "code" || normalized === "cash") {
        return ORDER_PAYMENT_METHODS.COD;
    }

    if (
        normalized === ORDER_PAYMENT_METHODS.BANK_TRANSFER
        || normalized === "bank"
        || normalized === "bank_transfer"
        || normalized === "banktransfer"
        || normalized === "bank_transfer_qr"
        || normalized === "transfer"
        || normalized === "qr"
    ) {
        return "bank";
    }

    if (normalized === ORDER_PAYMENT_METHODS.VNPAY || normalized === "vn_pay") {
        return "vnpay";
    }

    return normalized ? normalized : ORDER_PAYMENT_METHODS.COD;
};

const normalizeStatus = (status) => {
    const normalized = String(status ?? "").toLowerCase();

    return {
        pending: "pending",
        processing: "confirmed",
        delivering: "shipping",
        completed: "delivered",
        cancelled: "cancelled",
    }[normalized] ?? normalized;
};

const normalizeAddress = (address = {}, payload = {}) => ({
    fullName: address.full_name ?? address.fullName ?? payload.fullName ?? payload.FullName ?? "",
    phone: address.phone ?? payload.phoneNumber ?? payload.PhoneNumber ?? "",
    address: address.address ?? address.address_line ?? address.addressLine ?? payload.address ?? payload.Address ?? "",
    ward: address.ward ?? "",
    district: address.district ?? "",
    city: address.city ?? "",
});

const normalizeOrderItem = (item = {}) => {
    const product = item.product ?? {};

    return {
        id: item.id ?? item.product_id ?? item.productId ?? product.id ?? null,
        productId: item.product_id ?? item.productId ?? product.id ?? null,
        name: product.name ?? item.product_name ?? item.productName ?? item.name ?? "",
        image: product.image_url ?? product.imageUrl ?? product.image ?? product.img ?? item.image_url ?? item.imageUrl ?? item.image ?? item.img ?? "",
        price: Number(product.price ?? item.unit_price ?? item.unitPrice ?? item.price ?? 0),
        quantity: Number(item.quantity ?? 1),
        color: item.color ?? item.variant?.color ?? "",
        size: item.size ?? item.variant?.size ?? "",
    };
};

const normalizeBankInfo = (bankInfo = {}, payload = {}) => ({
    bankName: bankInfo.bank_name ?? bankInfo.bankName ?? payload.bank_name ?? payload.bankName ?? "",
    accountName: bankInfo.account_name ?? bankInfo.accountName ?? payload.account_name ?? payload.accountName ?? "",
    accountNumber: bankInfo.account_number ?? bankInfo.accountNumber ?? payload.account_number ?? payload.accountNumber ?? "",
});

const normalizePaymentInfo = (paymentInfo = {}, payload = {}) => {
    const qrCodeUrl = paymentInfo.qr_code_url
        ?? paymentInfo.qrCodeUrl
        ?? paymentInfo.qr_url
        ?? paymentInfo.qrUrl
        ?? paymentInfo.qr_code
        ?? paymentInfo.qrCode
        ?? paymentInfo.qr
        ?? payload.qr_code_url
        ?? payload.qrCodeUrl
        ?? payload.qr_url
        ?? payload.qrUrl
        ?? payload.qr_code
        ?? payload.qrCode
        ?? payload.qr
        ?? "";

    return {
        qrCodeUrl,
        transferContent: paymentInfo.transfer_content
            ?? paymentInfo.transferContent
            ?? paymentInfo.content
            ?? paymentInfo.description
            ?? payload.transfer_content
            ?? payload.transferContent
            ?? payload.content
            ?? payload.description
            ?? payload.order_code
            ?? payload.orderCode
            ?? "",
        amount: Number(paymentInfo.amount ?? payload.amount ?? payload.total_amount ?? payload.totalAmount ?? payload.total ?? 0),
        bankInfo: normalizeBankInfo(paymentInfo.bank_info ?? paymentInfo.bankInfo, payload),
    };
};

export const normalizeOrder = (payload = {}) => {
    const items = Array.isArray(payload.items)
        ? payload.items
        : Array.isArray(payload.order_items)
            ? payload.order_items
            : Array.isArray(payload.details)
                ? payload.details
                : [];

    return {
        id: payload.id ?? null,
        orderCode: payload.order_code ?? payload.orderCode ?? String(payload.id ?? ""),
        status: normalizeStatus(payload.status ?? payload.Status ?? "pending"),
        createdAt: payload.created_at ?? payload.createdAt ?? "",
        paymentMethod: normalizePaymentMethod(payload.payment_method ?? payload.paymentMethod),
        paymentStatus: payload.payment_status ?? payload.paymentStatus ?? "",
        subtotal: Number(payload.subtotal ?? payload.sub_total ?? 0),
        shippingFee: Number(payload.shipping_fee ?? payload.shippingFee ?? 0),
        discount: Number(payload.discount ?? payload.discount_total ?? payload.discountTotal ?? 0),
        totalAmount: Number(payload.total_amount ?? payload.totalAmount ?? payload.total ?? 0),
        voucherCode: payload.voucher_code ?? payload.voucherCode ?? "",
        itemCount: Number(payload.item_count ?? payload.itemCount ?? items.length),
        items: items.map(normalizeOrderItem),
        shippingAddress: normalizeAddress(payload.shipping_address ?? payload.shippingAddress, payload),
        paymentInfo: normalizePaymentInfo(payload.payment_info ?? payload.paymentInfo, payload),
        paymentUrl: payload.payment_url ?? payload.paymentUrl ?? "",
    };
};

const unwrap = (responseData) => responseData?.data ?? responseData;

const throwNice = (error, fallback) => {
    const errData = error.response?.data;
    const validationMessage = errData?.errors
        ? Object.values(errData.errors).flat().join(" ")
        : "";

    throw {
        message: validationMessage || errData?.message || errData?.error || fallback,
        errors: errData?.errors,
        response: error.response,
    };
};

export const buildCreateOrderPayload = ({
    customer,
    shippingAddress,
    cartId,
    paymentMethod,
    note,
    voucherCode,
}) => ({
    cart_id: cartId,
    FullName: customer.fullName.trim(),
    PhoneNumber: customer.phone.trim(),
    Email: customer.email.trim(),
    Address: [
        shippingAddress.addressLine,
        shippingAddress.ward,
        shippingAddress.district,
        shippingAddress.city,
        shippingAddress.country,
    ].filter(Boolean).join(", "),
    payment_method: normalizePaymentMethod(paymentMethod),
    Note: note?.trim() || "",
    voucher_code: voucherCode?.trim() || undefined,
});

export const orderService = {
    async createOrder(payload) {
        try {
            console.log("📦 Payload gửi lên:", JSON.stringify(payload, null, 2));
            const res = await api.post("/orders", payload);
            const orderData = unwrap(res.data) ?? {};
            // BE trả payment_url ở root response (sibling với `data`) khi payment_method=vnpay.
            // Merge vào order data để normalizeOrder() đọc được qua paymentUrl.
            const rootPaymentUrl = res.data?.payment_url ?? res.data?.paymentUrl;
            const merged = rootPaymentUrl
                ? { ...orderData, payment_url: orderData.payment_url ?? rootPaymentUrl }
                : orderData;
            return normalizeOrder(merged);
        } catch (error) {
            throwNice(error, "Khong tao duoc don hang");
        }

    },

    async getOrders() {
        try {
            const res = await api.get("/orders");
            const data = unwrap(res.data);
            const list = Array.isArray(data?.items)
                ? data.items
                : Array.isArray(data?.orders)
                    ? data.orders
                    : Array.isArray(data)
                        ? data
                        : [];

            return list.map(normalizeOrder);
        } catch (error) {
            throwNice(error, "Khong the tai danh sach don hang");
        }
    },

    async getOrder(orderId) {
        try {
            const res = await api.get(`/orders/${orderId}`);
            return normalizeOrder(unwrap(res.data));
        } catch (error) {
            throwNice(error, "Khong the tai chi tiet don hang");
        }
    },

    async cancelOrder(orderId, reason) {
        try {
            const res = await api.patch(`/orders/${orderId}/cancel`, { reason });
            return normalizeOrder(unwrap(res.data));
        } catch (error) {
            throwNice(error, "Khong the huy don hang");
        }
    },

    async reorder(orderId) {
        try {
            const res = await api.post(`/user/orders/${orderId}/reorder`);
            return unwrap(res.data);
        } catch (error) {
            throwNice(error, "Khong the mua lai don hang");
        }
    },

};

export const createOrder = orderService.createOrder;
export const getOrders = async () => ({ data: await orderService.getOrders() });
export const getOrder = async (orderId) => ({ data: await orderService.getOrder(orderId) });
export const cancelOrder = orderService.cancelOrder;
export const reorder = orderService.reorder;
