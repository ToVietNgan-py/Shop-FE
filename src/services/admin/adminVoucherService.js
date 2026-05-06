import api from "../../apis/default.js";
import { createCrudService, readResponseData } from "./adminBaseService.js";

const voucherService = createCrudService("/admin/vouchers");

export const adminVoucherService = {
    ...voucherService,

    async usage(id) {
        const response = await api.get(`/admin/vouchers/${id}/usage`);
        return readResponseData(response);
    }
};
