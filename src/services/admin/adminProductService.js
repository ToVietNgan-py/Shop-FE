import api from "../../apis/default.js";
import { createCrudService, readResponseData } from "./adminBaseService.js";

const productService = createCrudService("/admin/products");

export const adminProductService = {
    ...productService,

    async uploadImages(id, formData) {
        const response = await api.post(`/admin/products/${id}/images`, formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });

        return readResponseData(response);
    }
};
