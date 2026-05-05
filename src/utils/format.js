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

export const buildImageUrl = (path) => {
    if (!path) {
        return "";
    }

    if (path.startsWith("http")) {
        return path;
    }

    const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
    const baseUrl = apiUrl.replace(/\/api\/?$/, "");
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${baseUrl}${normalizedPath}`;
};
