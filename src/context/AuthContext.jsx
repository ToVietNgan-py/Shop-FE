/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useEffect, useState } from "react";
import { getProfile } from "../services/authService.js";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const token = localStorage.getItem("access_token");

        if (!token) {
            localStorage.removeItem("user");
            return null;
        }

        const stored = localStorage.getItem("user");
        if (stored && stored !== "undefined") {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error("Failed to parse user:", e);
                return null;
            }
        }
        return null;
    });

    const [loading, setLoading] = useState(true);

    const logout = useCallback(() => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");

        setUser(null);
        window.location.href = "/";
    }, []);

    const fetchProfile = useCallback(async () => {
        try {
            const res = await getProfile();
            // Xử lý nhiều format response từ backend
            const profileUser = res.user ?? res.data?.user ?? res.profile ?? res.data ?? res;
            if (profileUser) {
                setUser(profileUser);
                localStorage.setItem("user", JSON.stringify(profileUser));
            }
        } catch {
            logout();
        } finally {
            setLoading(false);
        }
    }, [logout]);

    useEffect(() => {
        const token = localStorage.getItem("access_token");

        if (token) {
            fetchProfile();
        } else {
            localStorage.removeItem("user");
            setUser(null);
            setLoading(false);
        }
    }, [fetchProfile]);

    const loginContext = (data) => {
        const accessToken = data.access_token ?? data.data?.access_token;
        const refreshToken = data.refresh_token ?? data.data?.refresh_token;
        const userData = data.user ?? data.data?.user ?? data.profile ?? data.data;

        localStorage.setItem("access_token", accessToken);
        localStorage.setItem("refresh_token", refreshToken);
        localStorage.setItem("user", JSON.stringify(userData));

        if (userData) {
            localStorage.setItem("user", JSON.stringify(userData));
            setUser(userData);
        }
    };

    const updateUserContext = useCallback((nextUser) => {
        setUser(nextUser);
        if (nextUser) {
            localStorage.setItem("user", JSON.stringify(nextUser));
        }
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                loginContext,
                logout,
                updateUserContext,
            }}
        >
            {!loading && children}
        </AuthContext.Provider>
    );
};
