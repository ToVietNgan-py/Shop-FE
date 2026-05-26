import axios from "axios";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("access_token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const refreshToken = localStorage.getItem("refresh_token");

        const isAuthRequest =
            originalRequest?.url?.includes("/auth/login") ||
            originalRequest?.url?.includes("/auth/register") ||
            originalRequest?.url?.includes("/auth/refresh");

        if (
            error.response?.status === 401 &&
            originalRequest &&
            !originalRequest._retry &&
            !isAuthRequest &&
            refreshToken
        ) {
            originalRequest._retry = true;

            try {
                const res = await axios.post(
                    `${API_URL}/api/auth/refresh`,
                    {
                        refresh_token: refreshToken,
                    }
                );

                const newAccessToken = res.data.access_token;

                localStorage.setItem("access_token", newAccessToken);

                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                return api(originalRequest);
            } catch {
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
                localStorage.removeItem("user");

                window.location.href = "/login";
            }
        }

        return Promise.reject(error);
    }
);

export default api;