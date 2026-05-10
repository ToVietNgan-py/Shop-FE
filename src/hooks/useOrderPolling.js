import { useState, useEffect, useRef, useCallback } from "react";

const POLL_INTERVAL = 15000;

export function useOrderPolling(apiUrl) {
    const [orders, setOrders] = useState([]);
    const [unread, setUnread] = useState(0);
    const lastIdRef = useRef(0);

    const fetchOrders = useCallback(async () => {
        try {
            const res = await fetch(`${apiUrl}?after_id=${lastIdRef.current}`);
            const data = await res.json();
            // data: [{ id, user_id, FullName, Address, PhoneNumber, Email, Note,
            //          Status, subtotal, total, payment_method, payment_status,
            //          created_at, updated_at, shipping_fee, discount, voucher_code }]

            if (!Array.isArray(data) || !data.length) return;

            const newOrders = data.filter(o => o.id > lastIdRef.current);
            if (!newOrders.length) return;

            lastIdRef.current = Math.max(...newOrders.map(o => o.id));
            setOrders(prev => [...newOrders, ...prev].slice(0, 50));
            setUnread(n => n + newOrders.length);
        } catch (err) {
            console.error("Polling error:", err);
        }
    }, [apiUrl]);

    useEffect(() => {
        fetchOrders();
        const timer = setInterval(fetchOrders, POLL_INTERVAL);
        return () => clearInterval(timer);
    }, [fetchOrders]);

    const markAllRead = useCallback(() => setUnread(0), []);

    return { orders, unread, markAllRead };
}