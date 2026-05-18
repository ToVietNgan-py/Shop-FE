import api from "../../apis/default.js";
import { readResponseData } from "./adminBaseService.js";

export const dashboardService = {
    async summary(params = {}) {
        const response = await api.get("/admin/dashboard/summary", { params });
        const payload = readResponseData(response);

        // Backend may return different keys (cards, recent_orders, revenue_chart_30d, top_products)
        const cards = payload.cards ?? payload.metrics ?? {};
        const recent = payload.recent_orders ?? payload.recentOrders ?? payload.orders ?? [];
        const revenueChart = payload.revenue_chart_30d ?? payload.revenueChart ?? [];
        const topProducts = payload.top_products ?? payload.topProducts ?? payload.bestSellers ?? [];

        // Normalize metrics into an array expected by UI
        const metrics = [
            { label: "Đơn hôm nay", value: cards.pending_orders ?? cards.today_orders ?? 0, suffix: "" },
            { label: "Doanh thu tháng", value: cards.total_revenue ?? cards.month_revenue ?? 0, prefix: "đ" },
            { label: "User mới", value: cards.total_users ?? 0, suffix: "" },
            { label: "Sản phẩm thiếu kho", value: cards.low_stock ?? 0, suffix: "" }
        ];

        // Normalize recent orders to the shape used by the dashboard component
        const recentOrders = (recent || []).map((o) => ({
            key: o.id ?? o.code ?? Math.random(),
            id: o.id ?? o.code,
            code: o.id ? `#${o.id}` : o.code ?? "",
            customer: o.user?.name ?? o.customer_name ?? o.customer ?? "—",
            total: parseFloat(o.total) ?? parseFloat(o.amount) ?? 0,
            status: o.status ? (typeof o.status === 'string' ? (o.status.charAt(0).toUpperCase() + o.status.slice(1).toLowerCase()) : o.status) : "",
            payment_status: o.payment_status ?? o.paymentStatus ?? "",
            payment_method: o.payment_method ?? o.paymentMethod ?? "",
            created_at: o.created_at ?? o.createdAt ?? ""
        }));

        // Normalize revenue chart to { day, revenue }
        const revenue = (revenueChart || []).map((r) => ({ day: r.date ?? r.day ?? r.label, revenue: r.total ?? r.revenue ?? 0 }));

        return {
            period: payload.period ?? payload.timeframe ?? params.month ?? "",
            metrics,
            recentOrders,
            topProducts,
            revenueChart: revenue
        };
    }
};