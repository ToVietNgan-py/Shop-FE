import { useState, useEffect, useRef, useCallback } from "react";
import api from "../apis/default.js";

const POLL_INTERVAL = 15000;

export function useOrderPolling(apiUrl) {
    const [orders, setOrders] = useState([]);
    const [unread, setUnread] = useState(0);
    const lastIdRef = useRef(0);
    const stoppedRef = useRef(false);

    const fetchOrders = useCallback(async () => {
        if (stoppedRef.current) return;

        try {
            // Normalize apiUrl to avoid double-prefixing the base URL (e.g. /api/api/...)
            const defaultBase = import.meta.env.VITE_API_URL || "/api";
            let requestUrl = apiUrl;

            if (!/^https?:\/\//.test(apiUrl)) {
                // Attempt to determine the base path from axios instance or env
                const axiosBase = api.defaults?.baseURL || defaultBase;

                // compute base path (handles full URL or simple '/api')
                let basePath = "/api";
                try {
                    basePath = new URL(axiosBase).pathname || basePath;
                } catch (e) {
                    if (typeof axiosBase === "string" && axiosBase.startsWith("/")) basePath = axiosBase;
                }

                if (requestUrl.startsWith(basePath)) {
                    requestUrl = requestUrl.slice(basePath.length);
                }

                if (!requestUrl.startsWith("/")) requestUrl = "/" + requestUrl;
            }

            const response = await api.get(requestUrl, { params: { after_id: lastIdRef.current } });
            // Support different response shapes:
            // - Paginated or array: response.data or response.data.data (array)
            // - Admin dashboard summary: response.data.data.recent_orders
            let data = response.data?.data ?? response.data;

            if (data && data.recent_orders) {
                data = data.recent_orders;
            }

            if (!Array.isArray(data) || data.length === 0) return;

            const newOrders = data.filter((o) => (o.id ?? 0) > lastIdRef.current);
            if (newOrders.length === 0) return;

            lastIdRef.current = Math.max(...newOrders.map((o) => o.id ?? 0));
            setOrders((prev) => [...newOrders, ...prev].slice(0, 50));
            setUnread((n) => n + newOrders.length);
        } catch (err) {
            // If unauthorized, stop polling to avoid noisy 401s
            const status = err?.response?.status;
            if (status === 401 || status === 403) {
                stoppedRef.current = true;
                console.warn("Order polling stopped due to auth error (401/403)");
                return;
            }

            console.error("Polling error:", err);
        }
    }, [apiUrl]);

    useEffect(() => {
        stoppedRef.current = false;
        fetchOrders();
        const timer = setInterval(fetchOrders, POLL_INTERVAL);
        return () => {
            stoppedRef.current = true;
            clearInterval(timer);
        };
    }, [fetchOrders]);

    const markAllRead = useCallback(() => setUnread(0), []);

    return { orders, unread, markAllRead };
}