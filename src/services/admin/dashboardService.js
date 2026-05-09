import api from "../../apis/default.js";
import { readResponseData } from "./adminBaseService.js";

export const dashboardService = {
    async summary(params = {}) {
        const response = await api.get("/admin/dashboard/summary", { params });
        const payload = readResponseData(response);

        return {
            period: payload.period ?? payload.timeframe ?? params.month ?? "",
            metrics: payload.metrics ?? payload.stats ?? [],
            recentOrders: payload.recentOrders ?? payload.orders ?? [],
            topProducts: payload.topProducts ?? payload.bestSellers ?? payload.topSales ?? []
        };
    }
};