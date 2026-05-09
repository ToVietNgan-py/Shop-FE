export const LOCAL_ORDERS_KEY = 'local_orders';

export function loadLocalOrders() {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(LOCAL_ORDERS_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function saveLocalOrders(list) {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(list));
    } catch {
        // ignore
    }
}

export function pushLocalOrder(order) {
    const list = loadLocalOrders();
    list.unshift(order);
    saveLocalOrders(list);
}

export function updateLocalOrder(orderCode, patch) {
    const list = loadLocalOrders();
    const idx = list.findIndex(o => o.orderCode === orderCode);
    if (idx >= 0) {
        list[idx] = { ...list[idx], ...patch };
        saveLocalOrders(list);
    }
}

export function removeLocalOrder(orderCode) {
    const list = loadLocalOrders();
    const filtered = list.filter(o => o.orderCode !== orderCode);
    saveLocalOrders(filtered);
}
