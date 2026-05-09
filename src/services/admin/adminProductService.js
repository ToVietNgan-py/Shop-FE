import api from "../../apis/default.js";
import { createCrudService, readResponseData } from "./adminBaseService.js";

const productService = createCrudService("/admin/products");

export const adminProductService = {
    ...productService,

    async uploadImage(id, formData) {
        const response = await api.post(`/admin/products/${id}/image`, formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });

        return readResponseData(response);
    }
};
