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
