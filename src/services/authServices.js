import api from "../apis/default.js";

export const register = async (data) => {
    try {
        const res = await api.post("/auth/register", data);

        if (res.data.access_token) {
            localStorage.setItem("access_token", res.data.access_token);
            localStorage.setItem("refresh_token", res.data.refresh_token);
        }

        return res.data;
    } catch (error) {
        const errData = error.response?.data;
        const validationMessage = errData?.errors
            ? Object.values(errData.errors).flat().join(" ")
            : "";
        throw {
            message: validationMessage || errData?.message || errData?.error || "Đăng ký thất bại",
            errors: errData?.errors,
        };
    }
};

export const login = async (data) => {
    try {
        const res = await api.post("/auth/login", data);

        localStorage.setItem("access_token", res.data.access_token);
        localStorage.setItem("refresh_token", res.data.refresh_token);

        return res.data;
    } catch (error) {
        const errData = error.response?.data;
        throw {
            message: errData?.message || errData?.error || "Sai tài khoản hoặc mật khẩu",
            errors: errData?.errors,
        };
    }
};

export const getProfile = async () => {
    try {
        const res = await api.get("/auth/profile");
        return res.data?.data ?? res.data;
    } catch (error) {
        const errData = error.response?.data;
        throw {
            message: errData?.message || errData?.error || "Không thể lấy thông tin tài khoản",
            errors: errData?.errors,
        };
    }
};

export const logout = async () => {
    try {
        await api.post("/auth/logout");
    } catch {
        // Token may already be invalid; local cleanup still needs to run.
    }

    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
};

