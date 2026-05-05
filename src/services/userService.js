import api from "../apis/default.js";

const normalizeResponse = (res) => res.data?.data ?? res.data;

export const getProfile = async () => {
    try {
        const res = await api.get("/auth/profile");
        return normalizeResponse(res);
    } catch (error) {
        const errData = error.response?.data;
        throw {
            message: errData?.message || errData?.error || "Không thể lấy thông tin tài khoản",
            errors: errData?.errors,
        };
    }
};
export const updateProfile = async (data) => {
    try {
        const res = await api.put("/auth/profile", data);
        return normalizeResponse(res);
    } catch (error) {
        const errData = error.response?.data;
        throw {
            message: errData?.message || errData?.error || "Không thể cập nhật thông tin",
            errors: errData?.errors,
        };
    }
};
export const changePassword = async (data) => {
    try {
        const res = await api.put("/auth/password", data);
        return normalizeResponse(res);
    } catch (error) {
        const errData = error.response?.data;
        throw {
            message: errData?.message || errData?.error || "Không thể đổi mật khẩu",
            errors: errData?.errors,
        };
    }
};