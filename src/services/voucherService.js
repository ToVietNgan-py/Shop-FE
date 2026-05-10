import api from '../apis/default';

const LOCAL_VOUCHERS = {
    DEARROSE30: {
        type: "amount",
        value: 30000,
        minOrderTotal: 200000,
        maxDiscount: 0,
        message: "Giảm 30.000đ cho đơn từ 200.000đ",
    },
    SALE10: {
        type: "percent",
        value: 10,
        minOrderTotal: 300000,
        maxDiscount: 100000,
        message: "Giảm 10% (tối đa 100.000đ) cho đơn từ 300.000đ",
    },
    WELCOME50: {
        type: "amount",
        value: 50000,
        minOrderTotal: 500000,
        maxDiscount: 0,
        message: "Giảm 50.000đ cho đơn từ 500.000đ",
    },
};

const calculateLocalDiscount = (voucher, orderTotal) => {
    if (voucher.type === "percent") {
        const raw = (orderTotal * voucher.value) / 100;

        if (voucher.maxDiscount > 0) {
            return Math.min(raw, voucher.maxDiscount);
        }

        return raw;
    }

    return voucher.value;
};

const applyLocalVoucher = ({ code, orderTotal }) => {
    const normalizedCode = String(code ?? "").trim().toUpperCase();

    if (!normalizedCode) {
        throw {
            message: "Vui lòng nhập mã giảm giá",
            errors: undefined,
            response: undefined,
        };
    }

    const total = Number(orderTotal) || 0;

    if (total <= 0) {
        throw {
            message: "Đơn hàng chưa có sản phẩm để áp mã giảm giá.",
            errors: undefined,
            response: undefined,
        };
    }

    const voucher = LOCAL_VOUCHERS[normalizedCode];

    if (!voucher) {
        throw {
            message: "Mã giảm giá không tồn tại.",
            errors: undefined,
            response: undefined,
        };
    }

    if (total < voucher.minOrderTotal) {
        throw {
            message: `Đơn hàng cần tối thiểu ${voucher.minOrderTotal.toLocaleString("vi-VN")}đ để áp mã.`,
            errors: undefined,
            response: undefined,
        };
    }

    const discount = Math.min(calculateLocalDiscount(voucher, total), total);

    return {
        code: normalizedCode,
        type: voucher.type,
        value: voucher.value,
        discount: Math.round(discount),
        minOrderTotal: voucher.minOrderTotal,
        maxDiscount: voucher.maxDiscount,
        message: voucher.message,
    };
};

export const voucherService = {
<<<<<<< HEAD
    apply: (code) => api.post('/vouchers/apply', { code }),
    // response: { discount, discount_type, message }
=======
    async apply({ code, orderTotal, cartId }) {
        try {
            return applyLocalVoucher({ code, orderTotal, cartId });
        } catch (error) {
            throwNice(error, "Ma giam gia khong hop le");
        }
    },
>>>>>>> 2446754ffc7a9beb855332c946efc38d2e4eaeea
};

