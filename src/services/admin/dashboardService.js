import api from "../../apis/default.js";
import { readResponseData } from "./adminBaseService.js";

const fallbackSummary = {
    metrics: [
        { label: "Đơn hôm nay", value: 18, suffix: "+12%" },
        { label: "Doanh thu tháng", value: 12500000, prefix: "đ" },
        { label: "User mới", value: 24, suffix: "+4" },
        { label: "Sản phẩm thiếu kho", value: 6 }
    ],
    recentOrders: [
        { key: 1, code: "DH-1024", customer: "Nguyen Thi A", total: "1.250.000đ", status: "Completed" },
        { key: 2, code: "DH-1025", customer: "Tran Van B", total: "880.000đ", status: "Processing" },
        { key: 3, code: "DH-1026", customer: "Le Thi C", total: "540.000đ", status: "Pending" }
    ]
};

export const dashboardService = {
    async summary() {
        try {
            const response = await api.get("/admin/dashboard/summary");
            const payload = readResponseData(response);

            return {
                metrics: payload.metrics ?? payload.stats ?? fallbackSummary.metrics,
                recentOrders: payload.recentOrders ?? payload.orders ?? fallbackSummary.recentOrders
            };
        } catch {
            return fallbackSummary;
        }
    }
};