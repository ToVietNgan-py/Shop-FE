const currencyFormatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND"
});

export const formatVND = (amount = 0) => currencyFormatter.format(Number(amount) || 0);

export const formatDate = (date) => {
    if (!date) {
        return "";
    }

    return new Date(date).toLocaleDateString("vi-VN");
};

// export const buildImageUrl = (path) => {
//     if (!path) {
//         return "";
//     }

//     // If an object is passed (e.g. { url } or { path }), try common fields
//     if (typeof path !== "string") {
//         const candidate = path?.url ?? path?.image ?? path?.path ?? path?.src ?? "";
//         if (typeof candidate === "string") {
//             path = candidate.trim();
//         } else {
//             return "";
//         }
//     }

//     if (path.startsWith("http")) {
//         return path;
//     }

export const buildImageUrl = (path) => {
    if (!path) return "";

    if (typeof path !== "string") {
        const candidate = path?.url ?? path?.image ?? path?.path ?? path?.src ?? "";
        if (typeof candidate === "string") {
            path = candidate.trim();
        } else {
            return "";
        }
    }

    // Đã là full URL → giữ nguyên
    if (path.startsWith("http")) return path;

    const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
    const baseUrl = apiUrl.replace(/\/api\/?$/, "");

    // Thêm /storage/ prefix nếu chưa có
    const normalizedPath = path.startsWith("/storage") || path.startsWith("storage")
        ? `/${path.replace(/^\//, "")}`          // đã có storage → chỉ đảm bảo có /
        : `/storage/${path.replace(/^\//, "")}`; // chưa có → thêm /storage/

    return `${baseUrl}${normalizedPath}`;
};

// const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
// const baseUrl = apiUrl.replace(/\/api\/?$/, "");
// const normalizedPath = path.startsWith("/") ? path : `/${path}`;
// return `${baseUrl}${normalizedPath}`;
// };

// Map tên/viết tắt ngân hàng phổ biến → mã BIN (Napas) mà VietQR yêu cầu.
const BANK_BIN_MAP = {
    vietcombank: "970436", vcb: "970436",
    techcombank: "970407", tcb: "970407",
    vietinbank: "970415", vtb: "970415",
    bidv: "970418",
    agribank: "970405", vbsp: "970405",
    mbbank: "970422", mb: "970422",
    acb: "970416",
    vpbank: "970432", vpb: "970432",
    tpbank: "970423", tpb: "970423",
    sacombank: "970403", stb: "970403",
};

const resolveBankBin = (bankInfo = {}) => {
    const explicit = bankInfo.bin ?? bankInfo.bankBin ?? bankInfo.bank_bin
        ?? bankInfo.bankCode ?? bankInfo.bank_code;
    if (explicit) return String(explicit).trim();

    const key = String(bankInfo.bankName ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
    return BANK_BIN_MAP[key] ?? "";
};

/**
 * Dựng URL ảnh QR chuyển khoản theo chuẩn VietQR (img.vietqr.io) từ thông tin ngân hàng.
 * Dùng làm fallback khi backend chưa trả về ảnh QR. Trả "" nếu thiếu BIN hoặc số tài khoản.
 */
export const buildVietQrUrl = (bankInfo = {}, amount, content) => {
    const bin = resolveBankBin(bankInfo);
    const accountNumber = String(bankInfo.accountNumber ?? "").trim();
    if (!bin || !accountNumber) {
        return "";
    }

    const params = new URLSearchParams();
    const numericAmount = Math.round(Number(amount) || 0);
    if (numericAmount > 0) params.set("amount", String(numericAmount));
    if (content) params.set("addInfo", content);
    if (bankInfo.accountName) params.set("accountName", bankInfo.accountName);

    const query = params.toString();
    return `https://img.vietqr.io/image/${bin}-${accountNumber}-compact2.png${query ? `?${query}` : ""}`;
};
