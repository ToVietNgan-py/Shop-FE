import api from "../../apis/default.js";
import { createCrudService, readResponseData } from "./adminBaseService.js";

const orderService = createCrudService("/admin/orders");

export const adminOrderService = {
    ...orderService,

    async updateStatus(id, status) {
        const response = await api.patch(`/admin/orders/${id}/status`, { status });
        return readResponseData(response);
    }
};
